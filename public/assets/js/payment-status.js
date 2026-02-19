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
  const TRANSFER_DETAILS = {
    bank: "BBVA Mexico",
    holder: "Luxury Condo",
    mxnChecking: "0124385160",
    mxnClabe: "012320001243851602",
    usdAccount: "0125883040",
    usdClabe: "012320001258830401",
    swift: "BCMRMCMMPYM"
  };

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
    const cardEl = document.querySelector(".payment-card");
    if (titleEl) {
      titleEl.textContent = isEnglish ? "Transfer received" : "Transferencia recibida";
    }
    if (noteEl) {
      noteEl.textContent = isEnglish
        ? "Your transfer will be verified by our team."
        : "Tu transferencia será verificada por nuestro equipo.";
    }
    if (cardEl) {
      const detailsEl = document.createElement("section");
      detailsEl.className = "transfer-info";
      detailsEl.innerHTML = isEnglish
        ? `<h3>Bank details</h3>
          <p>Bank: <strong>${TRANSFER_DETAILS.bank}</strong></p>
          <p>Account holder: <strong>${TRANSFER_DETAILS.holder}</strong></p>
          <p>MXN checking account: <strong>${TRANSFER_DETAILS.mxnChecking}</strong></p>
          <p>MXN CLABE: <strong>${TRANSFER_DETAILS.mxnClabe}</strong></p>
          <p>USD account: <strong>${TRANSFER_DETAILS.usdAccount}</strong></p>
          <p>USD CLABE: <strong>${TRANSFER_DETAILS.usdClabe}</strong></p>
          <p>SWIFT code: <strong>${TRANSFER_DETAILS.swift}</strong></p>`
        : `<h3>Datos bancarios</h3>
          <p>Banco: <strong>${TRANSFER_DETAILS.bank}</strong></p>
          <p>Beneficiario: <strong>${TRANSFER_DETAILS.holder}</strong></p>
          <p>Cuenta cheques MXN: <strong>${TRANSFER_DETAILS.mxnChecking}</strong></p>
          <p>CLABE MXN: <strong>${TRANSFER_DETAILS.mxnClabe}</strong></p>
          <p>Cuenta USD: <strong>${TRANSFER_DETAILS.usdAccount}</strong></p>
          <p>CLABE USD: <strong>${TRANSFER_DETAILS.usdClabe}</strong></p>
          <p>Código SWIFT: <strong>${TRANSFER_DETAILS.swift}</strong></p>`;
      cardEl.appendChild(detailsEl);
    }
  }

  const idEl = document.querySelector("[data-reservation-id]");
  if (idEl) idEl.textContent = reservationId || "—";
})();
