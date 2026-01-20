import Stripe from 'stripe';
import { assertSupabase, parseBody, supabaseAdmin } from './_supabase.js';

const getFallbackUrl = (baseUrl, roomId, type) => (
  `${baseUrl}/admin/rooms.html?stripe=${type}&roomId=${roomId}`
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(501).json({ error: 'STRIPE_SECRET_KEY no configurado.' });
    return;
  }

  if (!process.env.SITE_URL) {
    res.status(500).json({ error: 'SITE_URL no configurado.' });
    return;
  }

  if (!assertSupabase(res, { requireAdmin: true })) return;

  const body = parseBody(req);
  const roomId = body.roomId;

  if (!roomId) {
    res.status(400).json({ error: 'Falta roomId.' });
    return;
  }

  const { data: room, error: roomError } = await supabaseAdmin
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (roomError || !room) {
    res.status(404).json({ error: 'No se encontro el departamento.' });
    return;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  const country = body.country || 'MX';
  const email = body.email || null;

  let accountId = room.stripe_account_id;

  try {
    if (!accountId) {
      // Stripe Connect Express: la cuenta conectada pertenece al hotel.
      const account = await stripe.accounts.create({
        type: 'express',
        country,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        metadata: { roomId }
      });

      accountId = account.id;

      await supabaseAdmin
        .from('rooms')
        .update({ stripe_account_id: accountId, updated_at: new Date().toISOString() })
        .eq('id', roomId);
    }

    const refreshUrl = process.env.STRIPE_CONNECT_REFRESH_URL
      || getFallbackUrl(process.env.SITE_URL, roomId, 'refresh');
    const returnUrl = process.env.STRIPE_CONNECT_RETURN_URL
      || getFallbackUrl(process.env.SITE_URL, roomId, 'return');

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding'
    });

    res.status(200).json({ accountId, url: accountLink.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
