import { assertSupabase, parseBody, supabaseAdmin } from './_supabase.js';
import { fetchOccupiedReservations, fetchRoomBlocks, getMinimumStayError } from './_room-availability.js';

const mapReservation = (reservation) => ({
  id: reservation?.id,
  created_at: reservation?.created_at,
  updated_at: reservation?.updated_at,
  guest_name: reservation?.guest_name,
  guest_email: reservation?.guest_email,
  guest_phone: reservation?.guest_phone,
  stay_type: reservation?.stay_type,
  checkin: reservation?.checkin,
  checkout: reservation?.checkout,
  total: reservation?.total,
  status: reservation?.status,
  payment_status: reservation?.payment_status,
  room_name: reservation?.room_name,
  room_id: reservation?.room_id,
  language: reservation?.language,
  room_occupied: reservation?.room_occupied,
  room_snapshot: reservation?.room_snapshot,
  guest_snapshot: reservation?.guest_snapshot
});

const normalizeGuestSnapshot = (guestSnapshot, body) => {
  const idPhotoFront = guestSnapshot?.idPhotoFront || body.idPhotoFront || body.id_photo_front || null;
  const idPhotoBack = guestSnapshot?.idPhotoBack || body.idPhotoBack || body.id_photo_back || null;

  if (!guestSnapshot && !idPhotoFront && !idPhotoBack) return null;

  return {
    ...(guestSnapshot || {}),
    idPhotoFront: idPhotoFront || null,
    idPhotoBack: idPhotoBack || null
  };
};

const shouldTreatReservationAsOccupied = ({ status, paymentStatus, roomOccupied }) => {
  const normalizedStatus = String(status || '').toLowerCase();
  const normalizedPayment = String(paymentStatus || '').toLowerCase();

  if (normalizedStatus.includes('cancel')) return false;
  if (normalizedPayment === 'paid') return true;
  if (normalizedStatus.includes('confirm')) return true;

  return Boolean(Number(roomOccupied || 0));
};

const validateDateOrder = ({ checkin, checkout }) => {
  if (!checkin || !checkout) return null;
  if (new Date(`${checkin}T00:00:00`) >= new Date(`${checkout}T00:00:00`)) {
    return 'La salida debe ser posterior a la entrada.';
  }
  return null;
};

const validateReservationConflicts = async ({
  roomId,
  checkin,
  checkout,
  excludeReservationId = null
}) => {
  if (!roomId || !checkin || !checkout) return null;

  const [
    { data: blocks, error: blocksError },
    { data: occupiedReservations, error: occupiedError }
  ] = await Promise.all([
    fetchRoomBlocks({ roomId, from: checkin, to: checkout }),
    fetchOccupiedReservations({ roomId, from: checkin, to: checkout, excludeReservationId })
  ]);

  if (blocksError) {
    return { error: blocksError.message };
  }

  if (occupiedError) {
    return { error: occupiedError.message };
  }

  if (occupiedReservations.length) {
    return { error: 'El departamento ya está ocupado en esas fechas.', code: 409 };
  }

  if (blocks.length) {
    return { error: 'El departamento está bloqueado en esas fechas.', code: 409 };
  }

  return null;
};

const validateRoomRules = async ({ roomId, checkin, checkout, stayType }) => {
  if (!roomId) return null;

  const { data: room, error } = await supabaseAdmin
    .from('rooms')
    .select('id, name, minimum_months')
    .eq('id', roomId)
    .single();

  if (error || !room) {
    return { error: 'No se encontró el departamento.', code: 404 };
  }

  const minimumStayError = getMinimumStayError({ room, checkin, checkout, stayType });
  if (minimumStayError) {
    return { error: minimumStayError, code: 400 };
  }

  return null;
};

const upsertCustomerIfNeeded = async ({ payload, guestSnapshot }) => {
  if (!payload.guest_email && !payload.guest_phone) return;

  const customerPayload = {
    name: payload.guest_name,
    email: payload.guest_email || null,
    phone: payload.guest_phone || null
  };

  if (guestSnapshot?.idPhotoFront) customerPayload.id_photo_front = guestSnapshot.idPhotoFront;
  if (guestSnapshot?.idPhotoBack) customerPayload.id_photo_back = guestSnapshot.idPhotoBack;

  if (payload.guest_email) {
    await supabaseAdmin
      .from('customers')
      .upsert(customerPayload, { onConflict: 'email' });
    return;
  }

  await supabaseAdmin
    .from('customers')
    .insert(customerPayload);
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (!assertSupabase(res, { requireAdmin: true })) return;

    const { data, error } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ data: data.map(mapReservation) });
    return;
  }

  if (req.method === 'POST') {
    if (!assertSupabase(res, { requireAdmin: true })) return;
    const body = parseBody(req);

    const roomSnapshot = body.room || null;
    const guestSnapshot = normalizeGuestSnapshot(body.guest || null, body);
    const stayType = body.stayType || body.stay_type || '';
    const status = body.status || 'Pendiente de pago';
    const paymentStatus = body.paymentStatus || body.payment_status || 'pending';
    const roomOccupied = body.roomOccupied ?? body.room_occupied ?? 0;
    const roomId = roomSnapshot?.id || body.room_id || null;
    const checkin = body.checkin || null;
    const checkout = body.checkout || null;

    const dateError = validateDateOrder({ checkin, checkout });
    if (dateError) {
      res.status(400).json({ error: dateError });
      return;
    }

    const roomRuleError = await validateRoomRules({ roomId, checkin, checkout, stayType });
    if (roomRuleError) {
      res.status(roomRuleError.code || 500).json({ error: roomRuleError.error });
      return;
    }

    if (shouldTreatReservationAsOccupied({ status, paymentStatus, roomOccupied })) {
      const conflict = await validateReservationConflicts({ roomId, checkin, checkout });
      if (conflict) {
        res.status(conflict.code || 500).json({ error: conflict.error });
        return;
      }
    }

    const payload = {
      guest_name: guestSnapshot?.name || body.guest_name || '',
      guest_email: guestSnapshot?.email || body.guest_email || '',
      guest_phone: guestSnapshot?.phone || body.guest_phone || '',
      stay_type: stayType,
      checkin,
      checkout,
      total: body.total || '',
      status,
      payment_status: paymentStatus,
      room_name: roomSnapshot?.name || body.room_name || '',
      room_id: roomId,
      room_occupied: roomOccupied,
      language: body.language || 'es',
      room_snapshot: roomSnapshot,
      guest_snapshot: guestSnapshot
    };

    const { data, error } = await supabaseAdmin
      .from('reservations')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    await upsertCustomerIfNeeded({ payload, guestSnapshot });

    res.status(201).json({ data: mapReservation(data) });
    return;
  }

  if (req.method === 'PATCH') {
    if (!assertSupabase(res, { requireAdmin: true })) return;
    const body = parseBody(req);
    const reservationId = body.id;

    if (!reservationId) {
      res.status(400).json({ error: 'Falta id de la reservacion.' });
      return;
    }

    const { data: currentReservation, error: currentError } = await supabaseAdmin
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (currentError || !currentReservation) {
      res.status(404).json({ error: 'No se encontró la reservación.' });
      return;
    }

    const nextStatus = body.status !== undefined ? body.status : currentReservation.status;
    const nextPaymentStatus = body.paymentStatus || body.payment_status || currentReservation.payment_status;
    const nextRoomOccupied = body.roomOccupied ?? body.room_occupied ?? currentReservation.room_occupied;
    const nextCheckin = body.checkin || currentReservation.checkin;
    const nextCheckout = body.checkout || currentReservation.checkout;
    const nextRoomId = body.room_id || currentReservation.room_id;
    const nextStayType = body.stayType || body.stay_type || currentReservation.stay_type;

    const dateError = validateDateOrder({ checkin: nextCheckin, checkout: nextCheckout });
    if (dateError) {
      res.status(400).json({ error: dateError });
      return;
    }

    const roomRuleError = await validateRoomRules({
      roomId: nextRoomId,
      checkin: nextCheckin,
      checkout: nextCheckout,
      stayType: nextStayType
    });
    if (roomRuleError) {
      res.status(roomRuleError.code || 500).json({ error: roomRuleError.error });
      return;
    }

    if (shouldTreatReservationAsOccupied({
      status: nextStatus,
      paymentStatus: nextPaymentStatus,
      roomOccupied: nextRoomOccupied
    })) {
      const conflict = await validateReservationConflicts({
        roomId: nextRoomId,
        checkin: nextCheckin,
        checkout: nextCheckout,
        excludeReservationId: reservationId
      });

      if (conflict) {
        res.status(conflict.code || 500).json({ error: conflict.error });
        return;
      }
    }

    const payload = {
      status: body.status,
      payment_status: body.paymentStatus || body.payment_status,
      room_occupied: body.roomOccupied ?? body.room_occupied,
      checkin: body.checkin,
      checkout: body.checkout,
      room_id: body.room_id,
      room_name: body.room_name,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('reservations')
      .update(payload)
      .eq('id', reservationId)
      .select('*')
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ data: mapReservation(data) });
    return;
  }

  if (req.method === 'DELETE') {
    if (!assertSupabase(res, { requireAdmin: true })) return;
    const body = parseBody(req);
    const reservationId = body.id;

    if (!reservationId) {
      res.status(400).json({ error: 'Falta id de la reservacion.' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('reservations')
      .delete()
      .eq('id', reservationId);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
