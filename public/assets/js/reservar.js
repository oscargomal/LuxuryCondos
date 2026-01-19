// ================= DATOS DE PRECIOS =================
const PRICES = {
  night: 3000,
  month: 33000,
  year: 31000
};

const STORAGE_KEY = "luxuryReservations";
const STORAGE_LAST_ID = "luxuryLastReservationId";
const RESERVATIONS_API = "/api/reservations";
const CHECKOUT_API = "/api/create-checkout-session";
const MEXICO_TZ = "America/Mexico_City";
const STATUS_PENDING = "Pendiente de pago";
const STATUS_CONFIRMED = "Confirmada";
const PAYMENT_STATUS = {
  pending: "pending",
  paid: "paid",
  failed: "failed",
  none: "none"
};
// TODO: Usa una función serverless (/api/create-checkout-session) para crear la sesión de Stripe.
//       La función debe devolver checkoutUrl y reservationId.
const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/test_REPLACE_ME";
const isEnglish = document.documentElement.lang === "en";
const strings = {
  summaryDesc: isEnglish ? "2 guests · Wi-Fi · King bed" : "2 huéspedes · Wi-Fi · Cama King",
  noRoom: isEnglish ? "No apartment selected" : "No hay departamento seleccionado",
  nights: isEnglish ? "night(s)" : "noche(s)",
  month: isEnglish ? "month" : "mes",
  yearly: isEnglish ? "Annual contract" : "Contrato anual",
  customStay: isEnglish ? "Custom request" : "Solicitud personalizada",
  priceNight: isEnglish ? "MXN / night" : "MXN / noche",
  priceMonth: isEnglish ? "MXN / month" : "MXN / mes",
  priceOther: isEnglish ? "To be defined" : "A convenir",
  missingGuest: isEnglish
    ? "⚠️ Please complete all guest details."
    : "⚠️ Por favor completa todos los datos del huésped.",
  invalidDates: isEnglish
    ? "⚠️ Select valid dates."
    : "⚠️ Selecciona fechas válidas.",
  redirecting: isEnglish
    ? "Redirecting to payment..."
    : "Redirigiendo al pago..."
};

const getMexicoToday = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: MEXICO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
};

const getMexicoTimestamp = () => {
  const locale = isEnglish ? "en-US" : "es-MX";
  return new Intl.DateTimeFormat(locale, {
    timeZone: MEXICO_TZ,
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date());
};

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

const saveReservationToApi = async (payload) => {
  try {
    const response = await fetch(RESERVATIONS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) return null;
    const result = await response.json();
    return result?.data || null;
  } catch (error) {
    return null;
  }
};

const createCheckoutSession = async (payload) => {
  try {
    const response = await fetch(CHECKOUT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
};

const getStripeRedirectUrl = (reservationId) => {
  const fallback = isEnglish ? "/eng/pago-demo.html" : "/pago-demo.html";
  if (!STRIPE_CHECKOUT_URL || STRIPE_CHECKOUT_URL.includes("REPLACE_ME")) {
    // Flujo local de pruebas mientras se integra Stripe.
    return `${fallback}?reservationId=${reservationId}`;
  }
  return STRIPE_CHECKOUT_URL;
};

// ================= ELEMENTOS =================
const summaryImg = document.getElementById("summaryImg");
const summaryTitle = document.getElementById("summaryTitle");
const summaryDesc = document.getElementById("summaryDesc");
const summaryPrice = document.getElementById("summaryPrice");
const summaryPeriod = document.getElementById("summaryPeriod");
const summaryTotal = document.getElementById("summaryTotal");

const stayRadios = document.querySelectorAll("input[name='stay']");
const checkinInput = document.getElementById("checkin");
const checkoutInput = document.getElementById("checkout");
const confirmBtn = document.querySelector(".btn-primary");

// ================= CARGAR HABITACIÓN =================
const room = JSON.parse(localStorage.getItem("selectedRoom"));
const getRoomNightPrice = () => {
  const raw = room?.price_night ?? room?.price ?? PRICES.night;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return PRICES.night;
  return parsed;
};

const getRoomMonthPrice = () => {
  const raw = room?.price_month ?? PRICES.month;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return PRICES.month;
  return parsed;
};

const getRoomYearPrice = () => {
  const raw = room?.price_year ?? PRICES.year;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return PRICES.year;
  return parsed;
};

if (room) {
  summaryImg.src = room.img;
  summaryTitle.textContent = room.name;
  summaryDesc.textContent = room.summary || strings.summaryDesc;
} else {
  summaryTitle.textContent = strings.noRoom;
}

// ================= CALCULAR NOCHES =================
function getNights() {
  const checkin = new Date(checkinInput.value);
  const checkout = new Date(checkoutInput.value);

  if (!checkinInput.value || !checkoutInput.value) return 0;

  const diff = checkout - checkin;
  return Math.max(diff / (1000 * 60 * 60 * 24), 0);
}

function setDateMinimums() {
  const today = getMexicoToday();
  checkinInput.min = today;

  if (checkinInput.value && checkinInput.value < today) {
    checkinInput.value = "";
  }

  if (checkoutInput.disabled) {
    checkoutInput.min = "";
    checkoutInput.value = "";
    return;
  }

  const checkoutMin = checkinInput.value || today;
  checkoutInput.min = checkoutMin;

  if (checkoutInput.value && checkoutInput.value < checkoutMin) {
    checkoutInput.value = "";
  }
}

// ================= ACTUALIZAR RESUMEN =================
function updateSummary() {
  const stayType = document.querySelector("input[name='stay']:checked").value;
  const nights = getNights();

  let total = 0;
  let periodText = "";

  if (stayType === "night") {
    const nightPrice = getRoomNightPrice();
    total = nights * nightPrice;
    summaryPrice.textContent = `$${nightPrice.toLocaleString()} ${strings.priceNight}`;
    periodText = nights ? `${nights} ${strings.nights}` : "—";
  }

  if (stayType === "month") {
    const monthPrice = getRoomMonthPrice();
    total = monthPrice;
    summaryPrice.textContent = `$${monthPrice.toLocaleString()} ${strings.priceMonth}`;
    periodText = `1 ${strings.month}`;
  }

  if (stayType === "year") {
    const yearPrice = getRoomYearPrice();
    total = yearPrice;
    summaryPrice.textContent = `$${yearPrice.toLocaleString()} ${strings.priceMonth}`;
    periodText = strings.yearly;
  }

  if (stayType === "other") {
    total = 0;
    summaryPrice.textContent = strings.priceOther;
    periodText = strings.customStay;
  }

  summaryPeriod.textContent = periodText;
  summaryTotal.textContent = total
    ? `$${total.toLocaleString()} MXN`
    : stayType === "other"
      ? strings.priceOther
      : "—";
}

function updateStayType() {
  const stayType = document.querySelector("input[name='stay']:checked").value;
  const disableCheckout = stayType === "month" || stayType === "year";
  checkoutInput.disabled = disableCheckout;
  if (disableCheckout) {
    checkoutInput.value = "";
  }
  setDateMinimums();
  updateSummary();
}

// ================= EVENTOS =================
stayRadios.forEach(radio => {
  radio.addEventListener("change", updateStayType);
});

checkinInput.addEventListener("change", () => {
  setDateMinimums();
  updateSummary();
});
checkoutInput.addEventListener("change", updateSummary);

updateStayType();

// ================= CONFIRMAR RESERVA =================
confirmBtn.addEventListener("click", async () => {
  const name = document.querySelector("input[type='text']").value.trim();
  const email = document.querySelector("input[type='email']").value.trim();
  const phone = document.querySelector("input[type='tel']").value.trim();
  const stayType = document.querySelector("input[name='stay']:checked").value;
  const today = getMexicoToday();
  const checkinValue = checkinInput.value;
  const checkoutValue = checkoutInput.value;

  if (!name || !email || !phone) {
    alert(strings.missingGuest);
    return;
  }

  if (checkinValue && checkinValue < today) {
    alert(strings.invalidDates);
    return;
  }

  if (checkoutValue && checkoutValue < today) {
    alert(strings.invalidDates);
    return;
  }

  if (stayType === "night" && (!checkinValue || !checkoutValue || getNights() === 0)) {
    alert(strings.invalidDates);
    return;
  }

  const reservationData = {
    id: Date.now(),
    createdAt: getMexicoTimestamp(),
    status: stayType === "other" ? "Solicitud" : STATUS_PENDING,
    paymentStatus: stayType === "other" ? PAYMENT_STATUS.none : PAYMENT_STATUS.pending,
    roomOccupied: 0,
    language: isEnglish ? "en" : "es",
    room,
    guest: { name, email, phone },
    stayType,
    checkin: checkinInput.value,
    checkout: checkoutInput.value,
    total: summaryTotal.textContent
  };

  console.log("📌 RESERVACIÓN:", reservationData);

  const savedReservation = await saveReservationToApi(reservationData);
  const nextReservation = savedReservation || reservationData;

  const reservations = readReservations();
  reservations.unshift(nextReservation);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
  localStorage.setItem(STORAGE_LAST_ID, String(nextReservation.id));

  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = strings.redirecting;
  }
  if (stayType === "other") {
    window.location.href = isEnglish
      ? `/eng/pending.html?reservationId=${nextReservation.id}`
      : `/pendiente.html?reservationId=${nextReservation.id}`;
    return;
  }

  const checkoutResponse = await createCheckoutSession({
    reservationId: nextReservation.id,
    roomId: room?.id || null,
    stayType,
    checkin: checkinInput.value,
    checkout: checkoutInput.value,
    language: isEnglish ? "en" : "es"
  });

  const checkoutUrl = checkoutResponse?.checkoutUrl
    || getStripeRedirectUrl(nextReservation.id);

  window.location.href = checkoutUrl;
});
  
