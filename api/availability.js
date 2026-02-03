import { assertSupabase, supabaseAdmin } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!assertSupabase(res, { requireAdmin: true })) return;

  const roomId = req.query?.roomId ? String(req.query.roomId) : null;
  const checkin = req.query?.checkin || null;
  const checkout = req.query?.checkout || null;

  if (!roomId) {
    res.status(400).json({ error: 'Falta roomId.' });
    return;
  }

  if (!checkin || !checkout) {
    res.status(400).json({ error: 'Faltan fechas.' });
    return;
  }

  const { data: room, error: roomError } = await supabaseAdmin
    .from('rooms')
    .select('id, occupied')
    .eq('id', roomId)
    .single();

  if (roomError || !room) {
    res.status(404).json({ error: 'No se encontró el departamento.' });
    return;
  }

  const { data: blocks, error: blocksError } = await supabaseAdmin
    .from('room_blocks')
    .select('id, start_date, end_date')
    .eq('room_id', roomId)
    .lte('start_date', checkout)
    .gte('end_date', checkin)
    .limit(1);

  if (blocksError) {
    res.status(500).json({ error: blocksError.message });
    return;
  }

  const blocked = Boolean(blocks && blocks.length);
  const occupied = Boolean(room.occupied);
  const available = !blocked && !occupied;

  res.status(200).json({
    available,
    blocked,
    occupied,
    reason: occupied ? 'occupied' : blocked ? 'blocked' : null
  });
}
