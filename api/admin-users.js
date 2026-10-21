// /api/admin-users — staff account management. Admins only (checked from the caller's Supabase session).
//   POST   { name, email, password }  → create an editor login
//   PATCH  { id, password }           → set a new temporary password
//   DELETE { id }                     → delete a login and its profile
const { supabase, requireAdmin } = require('./_lib/supabase');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  const me = await requireAdmin(req);
  if (!me) return res.status(403).json({ error: 'Admins only.' });
  const b = req.body || {};

  try {
    if (req.method === 'POST') {
      const name = String(b.name || '').trim().slice(0, 100);
      const email = String(b.email || '').trim().toLowerCase();
      const password = String(b.password || '');
      if (!name || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a name and a valid email.' });
      if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

      const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) return res.status(400).json({ error: error.message });
      const { error: pErr } = await supabase.from('profiles').insert({ id: data.user.id, name, email, role: 'editor' });
      if (pErr) {
        await supabase.auth.admin.deleteUser(data.user.id);
        throw new Error(pErr.message);
      }
      return res.status(200).json({ ok: true });
    }

    const id = String(b.id || '');
    if (!id) return res.status(400).json({ error: 'Missing user.' });
    const { data: target } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (!target) return res.status(404).json({ error: 'User not found.' });

    if (req.method === 'PATCH') {
      const password = String(b.password || '');
      if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
      if (target.role === 'admin' && target.id !== me.id) {
        return res.status(403).json({ error: 'Other admins must change their own password.' });
      }
      const { error } = await supabase.auth.admin.updateUserById(id, { password });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      if (target.role === 'admin') return res.status(403).json({ error: 'Admins cannot be removed here.' });
      const { error } = await supabase.auth.admin.deleteUser(id);
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin-users error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
