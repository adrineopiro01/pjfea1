// Server-side Supabase client. Uses the service-role key, which bypasses Row Level Security,
// so it must only ever be used inside /api functions — never sent to the browser.
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '', {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Returns the caller's profile if the request carries a valid admin session, else null.
async function requireAdmin(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
  return profile && profile.role === 'admin' ? profile : null;
}

module.exports = { supabase, requireAdmin };
