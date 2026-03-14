import { assertSupabase } from './_supabase.js';
import { getRoomAvailability } from './_room-availability.js';

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

  if (new Date(`${checkin}T00:00:00`) >= new Date(`${checkout}T00:00:00`)) {
    res.status(400).json({ error: 'El check-out debe ser posterior al check-in.' });
    return;
  }

  const result = await getRoomAvailability({ roomId, checkin, checkout });
  if (result?.error) {
    res.status(500).json({ error: result.error.message });
    return;
  }

  res.status(200).json({
    available: result.available,
    blocked: result.blocked,
    occupied: result.occupied,
    reason: result.reason
  });
}
