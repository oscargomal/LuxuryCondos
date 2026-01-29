import { assertSupabase, parseBody, supabaseAdmin } from './_supabase.js';

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
    const guestSnapshot = body.guest || null;
    const idPhotoFront = guestSnapshot?.idPhotoFront || body.idPhotoFront || body.id_photo_front || null;
    const idPhotoBack = guestSnapshot?.idPhotoBack || body.idPhotoBack || body.id_photo_back || null;
    const normalizedGuestSnapshot = guestSnapshot
      ? {
        ...guestSnapshot,
        idPhotoFront: idPhotoFront || guestSnapshot?.idPhotoFront || null,
        idPhotoBack: idPhotoBack || guestSnapshot?.idPhotoBack || null
      }
      : null;

    const payload = {
      guest_name: guestSnapshot?.name || body.guest_name || '',
      guest_email: guestSnapshot?.email || body.guest_email || '',
      guest_phone: guestSnapshot?.phone || body.guest_phone || '',
      stay_type: body.stayType || body.stay_type || '',
      checkin: body.checkin || null,
      checkout: body.checkout || null,
      total: body.total || '',
      status: body.status || 'Pendiente de pago',
      payment_status: body.paymentStatus || body.payment_status || 'pending',
      room_name: roomSnapshot?.name || body.room_name || '',
      room_id: roomSnapshot?.id || body.room_id || null,
      room_occupied: body.roomOccupied ?? body.room_occupied ?? 0,
      language: body.language || 'es',
      room_snapshot: roomSnapshot,
      guest_snapshot: normalizedGuestSnapshot
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

    if (payload.guest_email || payload.guest_phone) {
      const customerPayload = {
        name: payload.guest_name,
        email: payload.guest_email || null,
        phone: payload.guest_phone || null
      };

      if (idPhotoFront) customerPayload.id_photo_front = idPhotoFront;
      if (idPhotoBack) customerPayload.id_photo_back = idPhotoBack;

      if (payload.guest_email) {
        await supabaseAdmin
          .from('customers')
          .upsert(customerPayload, { onConflict: 'email' });
      } else {
        await supabaseAdmin
          .from('customers')
          .insert(customerPayload);
      }
    }

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

    const payload = {
      status: body.status,
      payment_status: body.paymentStatus || body.payment_status,
      room_occupied: body.roomOccupied ?? body.room_occupied,
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

    const nextPaymentStatus = payload.payment_status;
    const nextRoomOccupied = payload.room_occupied;
    const shouldUpdateRoom = data?.room_id && (nextPaymentStatus || nextRoomOccupied !== undefined);

    if (shouldUpdateRoom) {
      const occupiedValue = nextRoomOccupied !== undefined
        ? Boolean(nextRoomOccupied)
        : nextPaymentStatus === 'paid';

      await supabaseAdmin
        .from('rooms')
        .update({ occupied: occupiedValue })
        .eq('id', data.room_id);
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
