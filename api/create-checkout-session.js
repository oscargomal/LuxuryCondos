import Stripe from 'stripe';
import { assertSupabase, parseBody, supabaseAdmin } from './_supabase.js';

const DEFAULT_PRICES = {
  month: 33000,
  year: 31000
};

const getNights = (checkin, checkout) => {
  if (!checkin || !checkout) return 0;
  const start = new Date(`${checkin}T00:00:00`);
  const end = new Date(`${checkout}T00:00:00`);
  const diff = end - start;
  return Math.max(Math.round(diff / (1000 * 60 * 60 * 24)), 0);
};

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
  const reservationId = body.reservationId;
  const roomId = body.roomId;
  const stayType = body.stayType;
  const checkin = body.checkin;
  const checkout = body.checkout;
  const language = body.language === 'en' ? 'en' : 'es';

  if (!reservationId) {
    res.status(400).json({ error: 'Falta reservationId.' });
    return;
  }

  if (stayType === 'other') {
    const pendingUrl = `${process.env.SITE_URL}${language === 'en' ? '/eng/pending.html' : '/pendiente.html'}?reservationId=${reservationId}`;
    res.status(200).json({ checkoutUrl: pendingUrl, noPayment: true });
    return;
  }

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

  const connectedAccountId = room.stripe_account_id;
  if (!connectedAccountId) {
    res.status(400).json({ error: 'Stripe Connect no configurado para este hotel.' });
    return;
  }

  let unitAmount = 0;
  let quantity = 1;
  let description = '';

  if (stayType === 'night') {
    const nights = getNights(checkin, checkout);
    if (!nights) {
      res.status(400).json({ error: 'Fechas invalidas.' });
      return;
    }
    unitAmount = Math.round(Number(room.price_night || 0) * 100);
    quantity = nights;
    description = `${nights} noche(s)`;
  } else if (stayType === 'month') {
    unitAmount = Math.round(Number(room.price_month || DEFAULT_PRICES.month) * 100);
    description = 'Estancia mensual';
  } else if (stayType === 'year') {
    unitAmount = Math.round(Number(room.price_year || DEFAULT_PRICES.year) * 100);
    description = 'Contrato anual';
  }

  if (!unitAmount) {
    res.status(400).json({ error: 'Precio no configurado.' });
    return;
  }

  const successUrl = `${process.env.SITE_URL}${language === 'en' ? '/eng/thanks.html' : '/gracias.html'}?reservationId=${reservationId}`;
  const cancelUrl = `${process.env.SITE_URL}${language === 'en' ? '/eng/pending.html' : '/pendiente.html'}?reservationId=${reservationId}`;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

  try {
    // Stripe Connect: crear el Checkout en la cuenta del hotel.
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity,
          price_data: {
            currency: 'mxn',
            unit_amount: unitAmount,
            product_data: {
              name: room.name || 'Reserva',
              description
            }
          }
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        reservationId,
        roomId,
        stayType,
        connectedAccountId
      }
    }, {
      stripeAccount: connectedAccountId
    });

    res.status(200).json({ checkoutUrl: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
