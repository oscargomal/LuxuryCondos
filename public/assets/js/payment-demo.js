(() => {
  const STORAGE_LAST_ID = "luxuryLastReservationId";
  const params = new URLSearchParams(window.location.search);
  const reservationId = params.get("reservationId") || localStorage.getItem(STORAGE_LAST_ID);

  const idEl = document.querySelector("[data-reservation-id]");
  if (idEl) idEl.textContent = reservationId || "—";

  const links = document.querySelectorAll("[data-payment-link]");
  links.forEach((link) => {
    const base = link.getAttribute("data-payment-link");
    if (!base) return;
    link.href = reservationId ? `${base}?reservationId=${reservationId}` : base;
  });
})();
