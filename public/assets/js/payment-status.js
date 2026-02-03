(() => {
  const STORAGE_KEY = "luxuryReservations";
  const STORAGE_LAST_ID = "luxuryLastReservationId";
  const root = document.querySelector("[data-payment-status]");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const paymentMode = params.get("payment");
  const isTransfer = paymentMode === "transfer";
  const isSuccess = root.dataset.paymentStatus === "success" && !isTransfer;
  const isEnglish = document.documentElement.lang === "en";

  const statusLabel = isTransfer
    ? (isEnglish ? "Transfer pending" : "Pendiente de transferencia")
    : isSuccess
      ? "Confirmada"
      : "Pendiente de pago";
  const paymentStatus = isTransfer ? "pending" : (isSuccess ? "paid" : "pending");
  const roomOccupied = isTransfer ? 0 : (isSuccess ? 1 : 0);

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

  const updateReservation = async (id) => {
    if (!id) return;
    const reservations = readReservations();
    const index = reservations.findIndex((reservation) => String(reservation.id) === String(id));
    if (index === -1) return;

    if (reservations[index]?.stayType === 'other') {
      return;
    }

    const next = {
      ...reservations[index],
      status: statusLabel,
      paymentStatus,
      roomOccupied,
      updatedAt: new Date().toISOString()
    };

    reservations[index] = next;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));

    try {
      await fetch("/api/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: statusLabel,
          paymentStatus,
          roomOccupied
        })
      });
    } catch (error) {
      // Mantener localStorage como respaldo si el API falla.
    }
  };

  updateReservation(reservationId);

  if (isTransfer) {
    const noteEl = document.getElementById("paymentNote");
    const titleEl = document.getElementById("paymentTitle");
    if (titleEl) {
      titleEl.textContent = isEnglish ? "Transfer received" : "Transferencia recibida";
    }
    if (noteEl) {
      noteEl.textContent = isEnglish
        ? "Your transfer will be verified by our team."
        : "Tu transferencia será verificada por nuestro equipo.";
    }
  }

  const idEl = document.querySelector("[data-reservation-id]");
  if (idEl) idEl.textContent = reservationId || "—";
})();
