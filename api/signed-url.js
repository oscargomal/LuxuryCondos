import { assertSupabase, parseBody, supabaseAdmin } from './_supabase.js';

const ALLOWED_BUCKETS = new Set(['customer-ids']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!assertSupabase(res, { requireAdmin: true })) return;

  const body = parseBody(req);
  const bucket = body.bucket || 'customer-ids';
  const path = body.path;
  const expiresIn = Number(body.expiresIn || 600);

  if (!ALLOWED_BUCKETS.has(bucket)) {
    res.status(400).json({ error: 'Bucket no permitido.' });
    return;
  }

  if (!path) {
    res.status(400).json({ error: 'Falta path.' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ signedUrl: data?.signedUrl || '' });
}
