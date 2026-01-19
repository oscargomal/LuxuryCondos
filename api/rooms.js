import { assertSupabase, parseBody, supabaseAdmin, supabaseAnon } from './_supabase.js';

const mapRoom = (room) => ({
  id: room?.id,
  name: room?.name,
  summary: room?.summary,
  description: room?.description,
  price_night: room?.price_night,
  price_month: room?.price_month,
  price_year: room?.price_year,
  images: room?.images || [],
  is_active: room?.is_active,
  occupied: room?.occupied,
  created_at: room?.created_at,
  updated_at: room?.updated_at
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const isPublic = req.query?.public === '1' || req.query?.public === 'true';
    const needsAdmin = !isPublic;
    if (!assertSupabase(res, { requireAdmin: needsAdmin })) return;

    const client = isPublic ? supabaseAnon : supabaseAdmin;
    let query = client
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (isPublic) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ data: data.map(mapRoom) });
    return;
  }

  if (req.method === 'POST') {
    if (!assertSupabase(res, { requireAdmin: true })) return;
    const body = parseBody(req);
    const payload = {
      name: body.name || '',
      summary: body.summary || '',
      description: body.description || '',
      price_night: Number(body.price_night || 0),
      price_month: body.price_month !== undefined ? Number(body.price_month) : null,
      price_year: body.price_year !== undefined ? Number(body.price_year) : null,
      images: Array.isArray(body.images) ? body.images : [],
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      occupied: body.occupied !== undefined ? Boolean(body.occupied) : false
    };

    const { data, error } = await supabaseAdmin
      .from('rooms')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ data: mapRoom(data) });
    return;
  }

  if (req.method === 'PUT') {
    if (!assertSupabase(res, { requireAdmin: true })) return;
    const body = parseBody(req);
    const roomId = body.id;

    if (!roomId) {
      res.status(400).json({ error: 'Falta id de la habitacion.' });
      return;
    }

    const payload = {
      name: body.name,
      summary: body.summary,
      description: body.description,
      price_night: body.price_night !== undefined ? Number(body.price_night) : undefined,
      price_month: body.price_month !== undefined ? Number(body.price_month) : undefined,
      price_year: body.price_year !== undefined ? Number(body.price_year) : undefined,
      images: Array.isArray(body.images) ? body.images : undefined,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : undefined,
      occupied: body.occupied !== undefined ? Boolean(body.occupied) : undefined,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('rooms')
      .update(payload)
      .eq('id', roomId)
      .select('*')
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ data: mapRoom(data) });
    return;
  }

  if (req.method === 'DELETE') {
    if (!assertSupabase(res, { requireAdmin: true })) return;
    const body = parseBody(req);
    const roomId = body.id;

    if (!roomId) {
      res.status(400).json({ error: 'Falta id de la habitacion.' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('rooms')
      .delete()
      .eq('id', roomId);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
