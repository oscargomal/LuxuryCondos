import Stripe from 'stripe';
import { assertSupabase, parseBody, supabaseAdmin } from './_supabase.js';

const STRIPE_ACCOUNT_REGEX = /^acct_[A-Za-z0-9]+$/;
const APP_SETTINGS_MISSING_MESSAGE = 'falta ejecutar SQL de app_settings';

const getFallbackUrl = (baseUrl, roomId, type) => (
  `${baseUrl}/admin/rooms.html?stripe=${type}&roomId=${roomId}`
);

const isMissingAppSettings = (error) => (
  error?.code === '42P01'
  || String(error?.message || '').includes('app_settings')
);

const normalizeSettingsError = (error) => {
  if (!error) return null;
  if (isMissingAppSettings(error)) {
    return { message: APP_SETTINGS_MISSING_MESSAGE };
  }
  return { message: error.message || 'Error desconocido.' };
};

const getAppSettings = async () => {
  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .select('id, stripe_account_id')
    .order('id', { ascending: true })
    .limit(1);

  if (error) return { error: normalizeSettingsError(error) };
  return { settings: data?.[0] || null };
};

const upsertAppSettings = async (stripeAccountId) => {
  const payload = {
    id: 1,
    stripe_account_id: stripeAccountId || null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabaseAdmin
    .from('app_settings')
    .upsert(payload, { onConflict: 'id' });

  if (error) return { error: normalizeSettingsError(error) };
  return { stripeAccountId: stripeAccountId || null };
};

const migrateStripeAccountId = async () => {
  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('stripe_account_id')
    .not('stripe_account_id', 'is', null)
    .neq('stripe_account_id', '')
    .limit(1);

  if (error) return { error };
  if (!data?.length) return { accountId: null };

  const accountId = data[0].stripe_account_id;
  if (!accountId) return { accountId: null };

  const { error: upsertError } = await upsertAppSettings(accountId);
  if (upsertError) return { error: upsertError };

  return { accountId };
};

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!assertSupabase(res, { requireAdmin: true })) return;

  const body = parseBody(req);
  const roomId = body.roomId || 'global';
  const manualAccountId = body.stripeAccountId !== undefined
    ? String(body.stripeAccountId || '').trim()
    : null;

  if (req.method === 'GET') {
    const { settings, error } = await getAppSettings();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    let accountId = settings?.stripe_account_id || null;
    if (!accountId) {
      const { accountId: migratedId, error: migrateError } = await migrateStripeAccountId();
      if (migrateError) {
        const normalized = normalizeSettingsError(migrateError);
        res.status(500).json({ error: normalized?.message || migrateError.message });
        return;
      }
      accountId = migratedId;
    }

    res.status(200).json({ stripeAccountId: accountId });
    return;
  }

  if (manualAccountId !== null) {
    if (manualAccountId && !STRIPE_ACCOUNT_REGEX.test(manualAccountId)) {
      res.status(400).json({ error: 'El ID de Stripe debe empezar con acct_.' });
      return;
    }

    const { error } = await upsertAppSettings(manualAccountId || null);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ accountId: manualAccountId || null });
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

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  const country = body.country || 'MX';
  const email = body.email || null;

  const { settings, error } = await getAppSettings();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  let accountId = settings?.stripe_account_id || null;

  try {
    if (!accountId) {
      const { accountId: migratedId, error: migrateError } = await migrateStripeAccountId();
      if (migrateError) {
        const normalized = normalizeSettingsError(migrateError);
        res.status(500).json({ error: normalized?.message || migrateError.message });
        return;
      }
      if (migratedId) {
        accountId = migratedId;
      }
    }

    if (!accountId) {
      // Stripe Connect Express: la cuenta conectada pertenece al hotel.
      const account = await stripe.accounts.create({
        type: 'express',
        country,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        }
      });

      accountId = account.id;
      const { error: upsertError } = await upsertAppSettings(accountId);
      if (upsertError) {
        res.status(500).json({ error: upsertError.message });
        return;
      }
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
