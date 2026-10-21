// Shared helpers for the donation endpoints. Files under api/_lib are not exposed as routes.
const crypto = require('crypto');
const { supabase } = require('./supabase');

// Only these funds can receive donations; the key is what the page sends.
const FUNDS = {
  'poetry-peace-clubs': 'Poetry Peace Clubs Fund',
  'awards': 'Peace Journalism Awards Fund',
  'digital-influencers': 'Digital Peace Influencers Fund',
  'fellowship': 'Journalist Fellowship Fund'
};

const CURRENCIES = {
  USD: { min: 1, max: 50000, decimals: 2 },
  UGX: { min: 1000, max: 200000000, decimals: 0 }
};

async function flw(method, path, body) {
  const res = await fetch('https://api.flutterwave.com/v3' + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + process.env.FLW_SECRET_KEY,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status !== 'success') {
    throw new Error(json.message || 'Flutterwave request failed (' + res.status + ')');
  }
  return json.data;
}

function siteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return proto + '://' + req.headers.host;
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

function check({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

// Asks Flutterwave for the real state of a transaction and records it in Supabase.
// This is the only place a donation is ever marked "paid". Safe to call more than once:
// donations.flw_id is unique, so the same Flutterwave transaction can only be stored once.
async function verifyAndRecord(transactionId) {
  const t = await flw('GET', '/transactions/' + encodeURIComponent(transactionId) + '/verify');
  const flwId = String(t.id);
  const txRef = String(t.tx_ref);
  const now = new Date().toISOString();

  if (t.status !== 'successful') {
    if (t.status === 'failed') {
      check(await supabase.from('donations').update({ status: 'failed', updated_at: now })
        .eq('tx_ref', txRef).eq('status', 'pending').is('renewal_of', null));
    }
    return { status: t.status, txRef };
  }

  const done = (row) => ({
    status: 'successful', txRef, amount: Number(t.amount), currency: t.currency, fundName: row ? row.fund_name : ''
  });

  const already = check(await supabase.from('donations').select('*').eq('flw_id', flwId).maybeSingle());
  if (already) return done(already);

  const payment = {
    flw_id: flwId,
    paid_amount: Number(t.amount),
    paid_currency: t.currency,
    payment_type: t.payment_type || '',
    paid_at: now,
    updated_at: now
  };

  const original = check(await supabase.from('donations').select('*')
    .eq('tx_ref', txRef).is('renewal_of', null).order('created_at').limit(1).maybeSingle());

  if (original && original.status !== 'paid') {
    const matches = t.currency === original.currency && Number(t.amount) >= Number(original.amount);
    // The status filter makes this a compare-and-set: only one concurrent call can claim the row.
    const claimed = check(await supabase.from('donations')
      .update(Object.assign({ status: matches ? 'paid' : 'mismatch' }, payment))
      .eq('id', original.id).in('status', ['pending', 'failed']).is('flw_id', null).select());
    if (claimed.length) return done(original);
  }

  // Either a monthly renewal of an already-paid donation, or a payment that never came from our form.
  const meta = t.meta || {};
  const customer = t.customer || {};
  const base = original || {
    fund: meta.fund || '', fund_name: FUNDS[meta.fund] || 'Unspecified', frequency: 'unknown',
    donor_name: customer.name || '', donor_email: customer.email || '', donor_phone: customer.phone_number || ''
  };
  check(await supabase.from('donations').upsert(Object.assign({
    tx_ref: txRef, fund: base.fund, fund_name: base.fund_name, frequency: base.frequency,
    donor_name: base.donor_name, donor_email: base.donor_email, donor_phone: base.donor_phone,
    amount: Number(t.amount), currency: t.currency, status: 'paid',
    renewal_of: original ? txRef : null
  }, payment), { onConflict: 'flw_id', ignoreDuplicates: true }));

  return done(base);
}

module.exports = { supabase, check, FUNDS, CURRENCIES, flw, siteUrl, safeEqual, verifyAndRecord };
