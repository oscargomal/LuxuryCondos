import { assertSupabase, parseBody, supabaseAdmin } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (!assertSupabase(res, { requireAdmin: true })) return;
    const roomId = req.query?.roomId ? String(req.query.roomId) : null;

    let query = supabaseAdmin
      .from('room_blocks')
      .select('*')
      .order('start_date', { ascending: true });

    if (roomId) {
      query = query.eq('room_id', roomId);
    }

    const { data, error } = await query;
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ data: data || [] });
    return;
  }

  if (req.method === 'POST') {
    if (!assertSupabase(res, { requireAdmin: true })) return;
    const body = parseBody(req);
    const roomId = body.roomId || body.room_id;
    const startDate = body.startDate || body.start_date;
    const endDate = body.endDate || body.end_date;
    const reason = body.reason || null;

    if (!roomId || !startDate || !endDate) {
      res.status(400).json({ error: 'Faltan datos del bloqueo.' });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      res.status(400).json({ error: 'La fecha de inicio debe ser menor a la fecha final.' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('room_blocks')
      .insert({
        room_id: roomId,
        start_date: startDate,
        end_date: endDate,
        reason
      })
      .select('*')
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ data });
    return;
  }

  if (req.method === 'DELETE') {
    if (!assertSupabase(res, { requireAdmin: true })) return;
    const body = parseBody(req);
    const id = Number(body.id);
    if (!id) {
      res.status(400).json({ error: 'Falta id del bloqueo.' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('room_blocks')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
