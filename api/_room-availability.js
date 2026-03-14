import { supabaseAdmin } from './_supabase.js';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const normalizeDate = (value) => String(value || '').slice(0, 10);

const addDays = (dateValue, days) => {
  const base = new Date(`${normalizeDate(dateValue)}T00:00:00`);
  base.setDate(base.getDate() + days);
  return normalizeDate(base.toISOString());
};

export const getMexicoToday = () => DATE_FORMATTER.format(new Date());

const applyRoomFilters = (query, { roomId, roomIds } = {}) => {
  if (roomId) return query.eq('room_id', roomId);
  if (Array.isArray(roomIds) && roomIds.length === 1) return query.eq('room_id', roomIds[0]);
  if (Array.isArray(roomIds) && roomIds.length > 1) return query.in('room_id', roomIds);
  return query;
};

export const isReservationOccupied = (reservation) => {
  if (!reservation?.checkin || !reservation?.checkout) return false;
  const status = String(reservation?.status || '').toLowerCase();
  const paymentStatus = String(reservation?.payment_status || '').toLowerCase();

  if (status.includes('cancel')) return false;
  if (paymentStatus === 'paid') return true;
  if (status.includes('confirm')) return true;

  return Boolean(Number(reservation?.room_occupied || 0));
};

export const fetchRoomBlocks = async ({ roomId, roomIds, from, to } = {}) => {
  let query = supabaseAdmin
    .from('room_blocks')
    .select('id, room_id, start_date, end_date, reason, created_at')
    .order('start_date', { ascending: true });

  query = applyRoomFilters(query, { roomId, roomIds });

  if (from) query = query.gte('end_date', normalizeDate(from));
  if (to) query = query.lte('start_date', normalizeDate(to));

  const { data, error } = await query;
  return { data: data || [], error };
};

export const fetchOccupiedReservations = async ({
  roomId,
  roomIds,
  from,
  to,
  excludeReservationId
} = {}) => {
  let query = supabaseAdmin
    .from('reservations')
    .select('id, room_id, room_name, guest_name, checkin, checkout, status, payment_status, room_occupied')
    .not('checkin', 'is', null)
    .not('checkout', 'is', null)
    .order('checkin', { ascending: true });

  query = applyRoomFilters(query, { roomId, roomIds });

  if (from) query = query.gt('checkout', normalizeDate(from));
  if (to) query = query.lt('checkin', normalizeDate(to));
  if (excludeReservationId) query = query.neq('id', excludeReservationId);

  const { data, error } = await query;
  if (error) return { data: [], error };

  return {
    data: (data || []).filter(isReservationOccupied),
    error: null
  };
};

export const getRoomAvailability = async ({ roomId, checkin, checkout }) => {
  const startDate = normalizeDate(checkin);
  const endDate = normalizeDate(checkout);

  const [
    { data: blocks, error: blocksError },
    { data: occupiedReservations, error: occupiedError }
  ] = await Promise.all([
    fetchRoomBlocks({ roomId, from: startDate, to: endDate }),
    fetchOccupiedReservations({ roomId, from: startDate, to: endDate })
  ]);

  if (blocksError) return { error: blocksError };
  if (occupiedError) return { error: occupiedError };

  const blocked = blocks.length > 0;
  const occupied = occupiedReservations.length > 0;

  return {
    available: !blocked && !occupied,
    blocked,
    occupied,
    reason: occupied ? 'occupied' : blocked ? 'blocked' : null,
    blocks,
    occupiedReservations
  };
};

export const getRoomCalendar = async ({ roomId, from, to }) => {
  const startDate = normalizeDate(from);
  const endDate = normalizeDate(to);

  const [
    { data: blocks, error: blocksError },
    { data: occupiedReservations, error: occupiedError }
  ] = await Promise.all([
    fetchRoomBlocks({ roomId, from: startDate, to: endDate }),
    fetchOccupiedReservations({ roomId, from: startDate, to: addDays(endDate, 1) })
  ]);

  if (blocksError) return { error: blocksError };
  if (occupiedError) return { error: occupiedError };

  const today = getMexicoToday();
  const todayAvailability = await getRoomAvailability({
    roomId,
    checkin: today,
    checkout: addDays(today, 1)
  });

  if (todayAvailability?.error) return { error: todayAvailability.error };

  return {
    blocked: blocks.map((block) => ({
      id: block.id,
      room_id: block.room_id,
      start_date: normalizeDate(block.start_date),
      end_date: normalizeDate(block.end_date),
      reason: block.reason || '',
      created_at: block.created_at
    })),
    occupied: occupiedReservations.map((reservation) => ({
      id: reservation.id,
      room_id: reservation.room_id,
      room_name: reservation.room_name || '',
      guest_name: reservation.guest_name || '',
      checkin: normalizeDate(reservation.checkin),
      checkout: normalizeDate(reservation.checkout),
      status: reservation.status || '',
      payment_status: reservation.payment_status || '',
      room_occupied: reservation.room_occupied || 0
    })),
    today_status: todayAvailability.reason || 'available'
  };
};

export const getRoomStatusMapForDate = async ({ roomIds, date }) => {
  if (!Array.isArray(roomIds) || !roomIds.length) return new Map();

  const targetDate = normalizeDate(date);
  const nextDate = addDays(targetDate, 1);

  const [
    { data: blocks, error: blocksError },
    { data: occupiedReservations, error: occupiedError }
  ] = await Promise.all([
    fetchRoomBlocks({ roomIds, from: targetDate, to: targetDate }),
    fetchOccupiedReservations({ roomIds, from: targetDate, to: nextDate })
  ]);

  if (blocksError) return { error: blocksError, data: new Map() };
  if (occupiedError) return { error: occupiedError, data: new Map() };

  const statusMap = new Map();
  roomIds.forEach((roomId) => {
    statusMap.set(String(roomId), 'available');
  });

  blocks.forEach((block) => {
    statusMap.set(String(block.room_id), 'blocked');
  });

  occupiedReservations.forEach((reservation) => {
    statusMap.set(String(reservation.room_id), 'occupied');
  });

  return { data: statusMap, error: null };
};
