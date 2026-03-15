import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAnon = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export const assertSupabase = (res, { requireAdmin = false } = {}) => {
  if (!supabaseUrl) {
    res.status(500).json({ error: 'SUPABASE_URL no configurado.' });
    return false;
  }

  if (requireAdmin && !supabaseAdmin) {
    res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY no configurado.' });
    return false;
  }

  if (!requireAdmin && !supabaseAnon) {
    res.status(500).json({ error: 'SUPABASE_ANON_KEY no configurado.' });
    return false;
  }

  return true;
};

export const parseBody = (req) => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return {};
    }
  }
  return req.body;
};
