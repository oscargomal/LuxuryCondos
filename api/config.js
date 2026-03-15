import { assertSupabase, parseBody, supabaseAdmin } from '../server/supabase.js';

const APP_SETTINGS_HINT = 'falta ejecutar SQL de imágenes de inicio';

const isMissingSettingsTable = (error) => (
  error?.code === '42P01' || String(error?.message || '').includes('app_settings')
);

const isMissingHomeImagesColumn = (error) => (
  error?.code === '42703' || String(error?.message || '').includes('home_images')
);

const normalizeSettingsError = (error) => {
  if (!error) return null;
  if (isMissingSettingsTable(error) || isMissingHomeImagesColumn(error)) {
    return { message: APP_SETTINGS_HINT };
  }
  return { message: error.message || 'Error desconocido.' };
};

const sanitizeImages = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, 40);
};

const getHomeImages = async () => {
  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .select('home_images')
    .eq('id', 1)
    .maybeSingle();

  if (error) return { error: normalizeSettingsError(error) };
  return { images: sanitizeImages(data?.home_images) };
};

const saveHomeImages = async (images) => {
  const payload = {
    id: 1,
    home_images: images,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabaseAdmin
    .from('app_settings')
    .upsert(payload, { onConflict: 'id' });

  if (error) return { error: normalizeSettingsError(error) };
  return { images };
};

export default async function handler(req, res) {
  const wantsHomeImages = req.query?.homeImages === '1' || req.query?.section === 'home-images';

  if (req.method === 'GET' && !wantsHomeImages) {
    res.status(200).json({
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
    });
    return;
  }

  if (wantsHomeImages) {
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    if (!assertSupabase(res, { requireAdmin: true })) return;

    if (req.method === 'GET') {
      const { images, error } = await getHomeImages();
      if (error) {
        if (error.message === APP_SETTINGS_HINT) {
          res.status(200).json({ data: { images: [] }, warning: error.message });
          return;
        }
        res.status(500).json({ error: error.message });
        return;
      }

      res.status(200).json({ data: { images } });
      return;
    }

    const body = parseBody(req);
    const images = sanitizeImages(body.images);
    const { error } = await saveHomeImages(images);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ data: { images } });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
