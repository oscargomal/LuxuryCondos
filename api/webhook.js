import Stripe from 'stripe';
import { assertSupabase, supabaseAdmin } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    res.status(500).json({ error: 'Stripe no configurado.' });
    return;
  }

  if (!assertSupabase(res, { requireAdmin: true })) return;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

  let rawBody = Buffer.from('');
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    rawBody = Buffer.concat(chunks);
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
    return;
  }

  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
    return;
  }

  // Stripe Connect: habilita eventos de cuentas conectadas en el webhook de la plataforma.
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const reservationId = session?.metadata?.reservationId;
    const roomId = session?.metadata?.roomId;

    if (reservationId) {
      await supabaseAdmin
        .from('reservations')
        .update({
          status: 'Confirmada',
          payment_status: 'paid',
          room_occupied: 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId);
    }

    if (roomId) {
      await supabaseAdmin
        .from('rooms')
        .update({ occupied: true })
        .eq('id', roomId);
    }
  }

  res.status(200).json({ received: true });
}
