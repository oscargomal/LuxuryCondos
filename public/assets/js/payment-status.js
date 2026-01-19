(() => {
  const STORAGE_KEY = "luxuryReservations";
  const STORAGE_LAST_ID = "luxuryLastReservationId";
  const root = document.querySelector("[data-payment-status]");
  if (!root) return;

  const isSuccess = root.dataset.paymentStatus === "success";
  const statusLabel = isSuccess ? "Confirmada" : "Pendiente de pago";
  const paymentStatus = isSuccess ? "paid" : "pending";
  const roomOccupied = isSuccess ? 1 : 0;

  const params = new URLSearchParams(window.location.search);
  const reservationId = params.get("reservationId") || localStorage.getItem(STORAGE_LAST_ID);

  const readReservations = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };

  const updateReservation = (id) => {
    if (!id) return;
    const reservations = readReservations();
    const index = reservations.findIndex((reservation) => String(reservation.id) === String(id));
    if (index === -1) return;

    const next = {
      ...reservations[index],
      status: statusLabel,
      paymentStatus,
      roomOccupied,
      updatedAt: new Date().toISOString()
    };

    reservations[index] = next;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));

    // TODO: Reemplazar por actualización real en Supabase vía función serverless.
  };

  updateReservation(reservationId);

  const idEl = document.querySelector("[data-reservation-id]");
  if (idEl) idEl.textContent = reservationId || "—";
})();
