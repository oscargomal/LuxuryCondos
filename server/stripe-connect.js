import Stripe from 'stripe';
import { supabaseAdmin } from './supabase.js';

export const APP_SETTINGS_MISSING_MESSAGE = 'falta ejecutar SQL de app_settings';

export const isMissingAppSettings = (error) => (
  error?.code === '42P01'
  || String(error?.message || '').includes('app_settings')
);

export const normalizeSettingsError = (error) => {
  if (!error) return null;
  if (isMissingAppSettings(error)) {
    return { message: APP_SETTINGS_MISSING_MESSAGE };
  }
  return { message: error.message || 'Error desconocido.' };
};

export const getStoredStripeAccountId = async () => {
  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .select('stripe_account_id')
    .order('id', { ascending: true })
    .limit(1);

  if (error) {
    return { error: normalizeSettingsError(error) };
  }

  let accountId = data?.[0]?.stripe_account_id || null;

  if (!accountId) {
    const { data: fallback, error: fallbackError } = await supabaseAdmin
      .from('rooms')
      .select('stripe_account_id')
      .not('stripe_account_id', 'is', null)
      .neq('stripe_account_id', '')
      .limit(1);

    if (fallbackError) {
      return { error: { message: fallbackError.message || 'No se pudo leer Stripe Connect.' } };
    }

    const fallbackId = fallback?.[0]?.stripe_account_id || null;
    if (fallbackId) {
      const { error: upsertError } = await supabaseAdmin
        .from('app_settings')
        .upsert({
          id: 1,
          stripe_account_id: fallbackId,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (upsertError) {
        return { error: normalizeSettingsError(upsertError) };
      }

      accountId = fallbackId;
    }
  }

  return { accountId };
};

export const createStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
};

export const summarizeStripeAccount = (account) => {
  if (!account) return null;
  return {
    accountId: account.id || null,
    detailsSubmitted: Boolean(account.details_submitted),
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    onboardingComplete: Boolean(account.details_submitted && account.charges_enabled),
    pendingRequirements: Array.isArray(account.requirements?.currently_due)
      ? account.requirements.currently_due
      : []
  };
};

export const getStripeAccountStatus = async (accountId) => {
  if (!accountId) return { account: null, status: null };

  const stripe = createStripeClient();
  if (!stripe) {
    return {
      account: null,
      status: {
        accountId,
        detailsSubmitted: null,
        chargesEnabled: null,
        payoutsEnabled: null,
        onboardingComplete: null,
        pendingRequirements: []
      }
    };
  }

  try {
    const account = await stripe.accounts.retrieve(accountId);
    return {
      account,
      status: summarizeStripeAccount(account)
    };
  } catch (error) {
    return {
      error: {
        message: error?.message || 'No se pudo consultar la cuenta de Stripe.'
      }
    };
  }
};

export const getStripeCheckoutReadinessError = (status) => {
  if (!status) return null;
  if (status.chargesEnabled === false) {
    return 'La cuenta de Stripe Connect todavía no puede cobrar. Completa la verificación/onboarding en Stripe.';
  }
  return null;
};
