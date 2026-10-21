// GET /api/donate-status?transaction_id=…&tx_ref=… — used by the thank-you message after checkout.
// It verifies with Flutterwave itself, so it also records the payment if the webhook is late.
const { verifyAndRecord } = require('./_lib/donations');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = String(req.query.transaction_id || '');
  const txRef = String(req.query.tx_ref || '');
  if (!/^\d+$/.test(id) || !txRef) return res.status(400).json({ error: 'Missing transaction details.' });

  try {
    const result = await verifyAndRecord(id);
    if (result.txRef !== txRef) return res.status(400).json({ error: 'Transaction does not match.' });
    return res.status(200).json(result);
  } catch (err) {
    console.error('status error:', err);
    return res.status(502).json({ status: 'unknown' });
  }
};
