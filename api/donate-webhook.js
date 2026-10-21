// POST /api/donate-webhook — Flutterwave calls this when a charge completes.
// The body is never trusted: we check the secret hash, then re-verify the transaction with Flutterwave.
const { safeEqual, verifyAndRecord } = require('./_lib/donations');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  if (!safeEqual(req.headers['verif-hash'], process.env.FLW_SECRET_HASH)) return res.status(401).end();

  const body = req.body || {};
  const data = body.data || body;
  if (!data.id) return res.status(200).end();

  try {
    await verifyAndRecord(data.id);
    return res.status(200).end();
  } catch (err) {
    console.error('webhook error:', err);
    // A non-200 makes Flutterwave retry later.
    return res.status(500).end();
  }
};
