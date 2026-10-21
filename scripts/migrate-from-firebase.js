// One-time copy of the existing Firebase content (staff, articles, homepage settings) into Supabase.
// Run AFTER supabase/schema.sql, from the project folder:
//
//   FIREBASE_SERVICE_ACCOUNT=./firebase-key.json \
//   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/migrate-from-firebase.js
//
// Firebase password hashes can't be moved, so every staff member gets a new temporary password,
// printed at the end. Share them privately; each person can change theirs under "Change password".
// Re-running is safe: existing users are reused and articles already copied (same title + date) are skipped.
const crypto = require('crypto');
const fs = require('fs');
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

const keySource = process.env.FIREBASE_SERVICE_ACCOUNT || '';
const firebaseKey = JSON.parse(fs.existsSync(keySource) ? fs.readFileSync(keySource, 'utf8') : keySource);
admin.initializeApp({ credential: admin.credential.cert(firebaseKey) });
const fdb = admin.firestore();
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const ARTICLE_COLUMNS = ['title', 'author', 'author_role', 'author_bio', 'author_photo', 'category', 'tag', 'excerpt',
  'pullquote', 'body', 'photo', 'gallery', 'featured', 'date', 'date_label', 'read_time', 'status', 'created_by',
  'created_by_name', 'updated_at'];
const snake = (k) => k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());

async function findSupabaseUser(email) {
  for (let page = 1; ; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    if (hit || data.users.length < 200) return hit || null;
  }
}

(async () => {
  // ---- Staff ----
  const uidMap = {};
  const passwords = [];
  const profiles = await fdb.collection('profiles').get();
  for (const doc of profiles.docs) {
    const p = doc.data();
    let email = p.email;
    if (!email) {
      try { email = (await admin.auth().getUser(doc.id)).email; } catch (e) { /* deleted login */ }
    }
    if (!email) { console.warn('Skipping profile without email:', doc.id); continue; }

    let user = await findSupabaseUser(email);
    if (!user) {
      const password = crypto.randomBytes(9).toString('base64url');
      const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) throw error;
      user = data.user;
      passwords.push({ email, password });
    }
    uidMap[doc.id] = user.id;
    const { error } = await sb.from('profiles').upsert({
      id: user.id, name: p.name || email, email, role: p.role === 'admin' ? 'admin' : 'editor'
    });
    if (error) throw error;
    console.log('Staff:', email, '(' + (p.role || 'editor') + ')');
  }

  // ---- Homepage settings ----
  const site = await fdb.collection('settings').doc('site').get();
  if (site.exists) {
    const data = Object.assign({}, site.data());
    delete data.articlesSeeded;
    delete data.heroHeadline;
    const { error } = await sb.from('settings').upsert({ id: 'site', data });
    if (error) throw error;
    console.log('Settings copied.');
  }

  // ---- Articles ----
  const articles = await fdb.collection('articles').get();
  for (const doc of articles.docs) {
    const a = doc.data();
    const row = {};
    Object.keys(a).forEach((k) => { if (ARTICLE_COLUMNS.includes(snake(k))) row[snake(k)] = a[k]; });
    row.created_by = uidMap[a.createdBy] || null;
    if (!row.date) row.date = (a.updatedAt || new Date().toISOString()).slice(0, 10);
    if (!row.title) { console.warn('Skipping untitled article', doc.id); continue; }

    const { data: dup } = await sb.from('articles').select('id').eq('title', row.title).eq('date', row.date).maybeSingle();
    if (dup) { console.log('Already copied:', row.title); continue; }
    const { error } = await sb.from('articles').insert(row);
    if (error) throw new Error(row.title + ': ' + error.message);
    console.log('Article:', row.title, '[' + row.status + ']');
  }

  console.log('\nDone.');
  if (passwords.length) {
    console.log('\nTemporary passwords (share privately):');
    passwords.forEach((p) => console.log('  ' + p.email + '  →  ' + p.password));
  }
  process.exit(0);
})().catch((err) => {
  console.error('Migration failed:', err.message || err);
  process.exit(1);
});
