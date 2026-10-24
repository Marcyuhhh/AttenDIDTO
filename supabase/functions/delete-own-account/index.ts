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

  const origin = request.headers.get('Origin');
  const allowedOrigin = Deno.env.get('APP_ORIGIN');
  if (!allowedOrigin || (origin && origin !== allowedOrigin)) return json({ error: 'Origin not allowed' }, 403);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = request.headers.get('Authorization');
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization) {
    return json({ error: 'Account deletion service is not configured' }, 500);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: attendanceError } = await adminClient
    .from('attendance_records')
    .delete()
    .eq('scanned_by_user_id', user.id);
  if (attendanceError) {
    console.error('Scanner attendance cleanup failed:', attendanceError.message);
    return json({ error: 'Unable to delete account records' }, 500);
  }

  const { error: reviewError } = await adminClient
    .from('events')
    .update({ payment_reviewed_by: null })
    .eq('payment_reviewed_by', user.id);
  if (reviewError) {
    console.error('Event review reference cleanup failed:', reviewError.message);
    return json({ error: 'Unable to delete account records' }, 500);
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('Auth user deletion failed:', deleteError.message);
    return json({ error: 'Unable to delete account' }, 500);
  }

  return json({ deleted: true });
});
