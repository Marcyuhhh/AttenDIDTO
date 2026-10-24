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
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const adminEmail = Deno.env.get('ADMIN_EMAIL');
  const fromEmail = Deno.env.get('NOTIFICATION_FROM_EMAIL');
  const authorization = request.headers.get('Authorization');
  const configuredOrigin = Deno.env.get('APP_ORIGIN');
  const requestOrigin = request.headers.get('Origin');

  if (!supabaseUrl || !anonKey || !resendKey || !adminEmail || !fromEmail || !configuredOrigin || !authorization) {
    return json({ error: 'Notification service is not configured' }, 500);
  }
  if (requestOrigin && requestOrigin !== configuredOrigin) return json({ error: 'Origin not allowed' }, 403);

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);

  let payload: { eventId?: string; kind?: string };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  if (!payload.eventId || !['submitted', 'reviewed'].includes(payload.kind ?? '')) {
    return json({ error: 'Invalid notification request' }, 400);
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id,event_code,host_user_id,title,payment_reference,payment_status,status')
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

  const { data: hostProfile, error: hostError } = await supabase
    .from('profiles')
    .select('email,full_name')
    .eq('id', event.host_user_id)
    .maybeSingle();

  if (hostError || !hostProfile?.email) return json({ error: 'Event owner email unavailable' }, 409);

  const submitted = payload.kind === 'submitted';
  const approved = event.payment_status === 'paid' && event.status === 'active';
  const subject = submitted
    ? `Payment review requested: ${event.event_code}`
    : `Event ${approved ? 'confirmed' : 'canceled'}: ${event.event_code}`;
  const to = submitted ? adminEmail : hostProfile.email;
  const decisionText = approved ? 'confirmed' : 'canceled';
  const html = submitted
    ? `<p>A payment review was submitted for <strong>${escapeHtml(event.title)}</strong>.</p><p>Event ID: ${escapeHtml(event.event_code)}</p><p>Payment reference: ${escapeHtml(event.payment_reference ?? '')}</p><p>Open the admin dashboard to review this request.</p>`
    : `<p>Hello ${escapeHtml(hostProfile.full_name ?? '')},</p><p>Your event <strong>${escapeHtml(event.title)}</strong> (${escapeHtml(event.event_code)}) was ${decisionText} after payment review.</p>`;

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: fromEmail, to: [to], subject, html }),
  });

  if (!emailResponse.ok) {
    console.error('Resend notification failed:', await emailResponse.text());
    return json({ error: 'Email delivery failed' }, 502);
  }

  return json({ sent: true });
});

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}