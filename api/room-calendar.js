import { assertSupabase } from './_supabase.js';
import { getMexicoToday, getRoomCalendar } from './_room-availability.js';

const addDays = (dateValue, days) => {
  const base = new Date(`${String(dateValue).slice(0, 10)}T00:00:00`);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!assertSupabase(res, { requireAdmin: true })) return;

  const roomId = req.query?.roomId ? String(req.query.roomId) : null;
  if (!roomId) {
    res.status(400).json({ error: 'Falta roomId.' });
    return;
  }

  const from = req.query?.from || getMexicoToday();
  const to = req.query?.to || addDays(from, 365);
  const result = await getRoomCalendar({ roomId, from, to });

  if (result?.error) {
    res.status(500).json({ error: result.error.message });
    return;
  }

  res.status(200).json({
    data: {
      roomId,
      from,
      to,
      today_status: result.today_status,
      blocked: result.blocked,
      occupied: result.occupied
    }
  });
}
