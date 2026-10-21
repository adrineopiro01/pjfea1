// POST /api/donate — records a pending donation and returns a Flutterwave checkout link.
const crypto = require('crypto');
const { supabase, check, FUNDS, CURRENCIES, flw, siteUrl } = require('./_lib/donations');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const b = req.body || {};
  const fund = String(b.fund || '');
  const currency = String(b.currency || '').toUpperCase();
  const frequency = b.frequency === 'monthly' ? 'monthly' : 'once';
  const name = String(b.name || '').trim().slice(0, 100);
  const email = String(b.email || '').trim().slice(0, 200);
  const phone = String(b.phone || '').replace(/[^\d+]/g, '').slice(0, 20);
  const cur = CURRENCIES[currency];

  if (!FUNDS[fund]) return res.status(400).json({ error: 'Please choose a fund.' });
  if (!cur) return res.status(400).json({ error: 'Unsupported currency.' });
  const factor = Math.pow(10, cur.decimals);
  const amount = Math.round(Number(b.amount) * factor) / factor;
  if (!Number.isFinite(amount) || amount < cur.min || amount > cur.max) {
    return res.status(400).json({ error: 'Amount must be between ' + cur.min + ' and ' + cur.max + ' ' + currency + '.' });
  }
  if (!name) return res.status(400).json({ error: 'Please enter your name.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });

  const txRef = 'pjf-' + crypto.randomUUID();
  const fundName = FUNDS[fund];

  try {
    // Save first so the webhook always finds the record, even if it arrives quickly.
    check(await supabase.from('donations').insert({
      tx_ref: txRef, fund, fund_name: fundName, amount, currency, frequency,
      donor_name: name, donor_email: email, donor_phone: phone, status: 'pending'
    }));

    let paymentPlan;
    if (frequency === 'monthly') {
      const plan = await flw('POST', '/payment-plans', {
        amount, currency, interval: 'monthly',
        name: fundName + ' — monthly ' + currency + ' ' + amount
      });
      paymentPlan = plan.id;
    }

    const payment = await flw('POST', '/payments', {
      tx_ref: txRef,
      amount,
      currency,
      redirect_url: siteUrl(req) + '/?donation=return',
      payment_options: 'card,mobilemoneyuganda',
      payment_plan: paymentPlan,
      customer: { email, name, phonenumber: phone || undefined },
      customizations: {
        title: 'Peace Journalism Foundation',
        description: 'Donation to the ' + fundName
      },
      meta: { fund }
    });

    return res.status(200).json({ link: payment.link });
  } catch (err) {
    console.error('donate error:', err);
    return res.status(502).json({ error: 'We could not start the payment. Please try again in a moment.' });
  }
};
