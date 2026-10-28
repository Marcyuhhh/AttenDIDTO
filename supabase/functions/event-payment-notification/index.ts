/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_ORIGIN') ?? 'null',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const googleRefreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');
  const adminEmail = Deno.env.get('ADMIN_EMAIL');
  const senderEmail = Deno.env.get('GMAIL_SENDER_EMAIL');
  const configuredOrigin = Deno.env.get('APP_ORIGIN');
  const authorization = request.headers.get('Authorization');

  if (!supabaseUrl || !anonKey || !googleClientId || !googleClientSecret
      || !googleRefreshToken || !senderEmail || !configuredOrigin || !authorization) {
    return json({ error: 'Notification service is not configured' }, 500);
  }
  if (request.headers.get('Origin') && request.headers.get('Origin') !== configuredOrigin) {
    return json({ error: 'Origin not allowed' }, 403);
  }
  if (!isValidEmail(senderEmail)) {
    return json({ error: 'Notification email address is invalid' }, 500);
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);

  let payload: { eventId?: string; kind?: string; scannerUserId?: string };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }
  if (!payload.eventId || !['submitted', 'reviewed', 'co_scanner_added'].includes(payload.kind ?? '')) {
    return json({ error: 'Invalid notification request' }, 400);
  }
  if (payload.kind === 'submitted' && (!adminEmail || !isValidEmail(adminEmail))) {
    return json({ error: 'Notification email address is invalid' }, 500);
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id,event_code,host_user_id,title,venue,event_date,start_time,payment_reference,payment_status,status')
    .eq('id', payload.eventId)
    .maybeSingle();
  if (eventError || !event) return json({ error: 'Event not found or access denied' }, 404);

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const callerIsAdmin = callerProfile?.role === 'admin';
  if (payload.kind === 'submitted' && event.host_user_id !== user.id) {
    return json({ error: 'Only the event host can send a submission notice' }, 403);
  }
  if (payload.kind === 'reviewed' && !callerIsAdmin) {
    return json({ error: 'Admin access required' }, 403);
  }
  if (payload.kind === 'co_scanner_added' && event.host_user_id !== user.id) {
    return json({ error: 'Only the event host can send a co-scanner notice' }, 403);
  }

  const { data: hostProfile, error: hostError } = await supabase
    .from('profiles')
    .select('email,full_name,school')
    .eq('id', event.host_user_id)
    .maybeSingle();
  if (hostError || !hostProfile?.email) return json({ error: 'Event owner email unavailable' }, 409);

  const submitted = payload.kind === 'submitted';
  const approved = event.payment_status === 'paid' && event.status === 'active';
  const eventCode = event.event_code ?? event.id;
  let recipientEmail = submitted ? adminEmail : hostProfile.email;
  let subject = submitted
    ? `Payment review requested: ${eventCode}`
    : `Event ${approved ? 'confirmed' : 'canceled'}: ${eventCode}`;
  const decisionText = approved ? 'confirmed' : 'canceled';
  let html = submitted
    ? `<h2>New payment review request</h2><p>A payment reference was submitted for <strong>${escapeHtml(event.title)}</strong>.</p><p><strong>Event:</strong> ${escapeHtml(eventCode)}</p><p><strong>Organizer:</strong> ${escapeHtml(hostProfile.full_name ?? '')}</p><p><strong>Email:</strong> ${escapeHtml(hostProfile.email)}</p><p><strong>School:</strong> ${escapeHtml(hostProfile.school ?? '')}</p><p><strong>Payment reference:</strong> ${escapeHtml(event.payment_reference ?? '')}</p><p><strong>Venue:</strong> ${escapeHtml(event.venue ?? '')}</p><p><strong>Date:</strong> ${escapeHtml(event.event_date ?? '')} at ${escapeHtml(event.start_time ?? '')}</p><p><a href="${escapeHtml(configuredOrigin)}">Open attendIDto to review this request</a></p>`
    : `<p>Hello ${escapeHtml(hostProfile.full_name ?? '')},</p><p>Your event <strong>${escapeHtml(event.title)}</strong> (${escapeHtml(eventCode)}) was ${decisionText} after payment review.</p>`;

  if (payload.kind === 'co_scanner_added') {
    if (!payload.scannerUserId) return json({ error: 'Co-scanner account is required' }, 400);
    const { data: assignment, error: assignmentError } = await supabase
      .from('event_scanners')
      .select('user_id')
      .eq('event_id', event.id)
      .eq('user_id', payload.scannerUserId)
      .maybeSingle();
    if (assignmentError || !assignment) return json({ error: 'Co-scanner assignment not found' }, 404);

    const { data: scannerProfile, error: scannerError } = await supabase
      .from('profiles')
      .select('email,full_name,school')
      .eq('id', payload.scannerUserId)
      .maybeSingle();
    if (scannerError || !scannerProfile?.email) return json({ error: 'Co-scanner email unavailable' }, 409);

    recipientEmail = scannerProfile.email;
    subject = `You have been added as a co-scanner: ${event.title}`;
    html = `<h2>You have been added as a co-scanner</h2><p>Hello ${escapeHtml(scannerProfile.full_name ?? '')},</p><p>You can now scan attendance for <strong>${escapeHtml(event.title)}</strong>.</p><p><strong>Event:</strong> ${escapeHtml(eventCode)}</p><p><strong>Organizer:</strong> ${escapeHtml(hostProfile.full_name ?? '')}</p><p><strong>Venue:</strong> ${escapeHtml(event.venue ?? '')}</p><p><strong>Date:</strong> ${escapeHtml(event.event_date ?? '')} at ${escapeHtml(event.start_time ?? '')}</p><p>Sign in to attendIDto to open the event and use the participant scanner.</p><p><a href="${escapeHtml(configuredOrigin)}">Open attendIDto</a></p>`;
  }

  if (!isValidEmail(recipientEmail)) return json({ error: 'Notification recipient email is invalid' }, 409);
  try {
    await sendGmailMessage({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      refreshToken: googleRefreshToken,
      senderEmail,
      recipientEmail,
      subject,
      html,
    });
  } catch (error) {
    console.error('Gmail notification failed:', error);
    return json({ error: 'Email delivery failed' }, 502);
  }
  return json({ sent: true });
});

async function sendGmailMessage({
  clientId,
  clientSecret,
  refreshToken,
  senderEmail,
  recipientEmail,
  subject,
  html,
}: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  html: string;
}) {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!tokenResponse.ok) {
    console.error('Google OAuth token refresh failed:', await tokenResponse.text());
    throw new Error('Unable to authorize Gmail API request');
  }
  const tokenData: { access_token?: string } = await tokenResponse.json();
  if (!tokenData.access_token) throw new Error('Google OAuth response did not contain an access token');

  const mimeMessage = [
    `From: ${senderEmail}`,
    `To: ${recipientEmail}`,
    `Subject: =?UTF-8?B?${encodeBase64(subject)}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    wrapBase64(encodeBase64(html)),
  ].join('\r\n');
  const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodeBase64(mimeMessage).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
    }),
  });
  if (!gmailResponse.ok) {
    console.error('Gmail API send failed:', await gmailResponse.text());
    throw new Error('Gmail API rejected the notification');
  }
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

function wrapBase64(value: string) {
  return value.match(/.{1,76}/g)?.join('\r\n') ?? '';
}

function isValidEmail(value: string) {
  return /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}
