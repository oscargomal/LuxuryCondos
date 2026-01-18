// ================= DATOS DE PRECIOS =================
const PRICES = {
  night: 3000,
  month: 33000,
  year: 31000
};

const STORAGE_KEY = "luxuryReservations";
const MEXICO_TZ = "America/Mexico_City";
const isEnglish = document.documentElement.lang === "en";
const strings = {
  summaryDesc: isEnglish ? "2 guests · Wi-Fi · King bed" : "2 huéspedes · Wi-Fi · Cama King",
  noRoom: isEnglish ? "No room selected" : "No hay habitación seleccionada",
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
  confirmMessage: isEnglish
    ? "✅ Request sent successfully.\n\nWe will contact you to confirm availability."
    : "✅ Solicitud enviada correctamente.\n\nNos pondremos en contacto para confirmar disponibilidad."
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

if (room) {
  summaryImg.src = room.img;
  summaryTitle.textContent = room.name;
  summaryDesc.textContent = strings.summaryDesc;
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
    total = nights * PRICES.night;
    summaryPrice.textContent = `$${PRICES.night.toLocaleString()} ${strings.priceNight}`;
    periodText = nights ? `${nights} ${strings.nights}` : "—";
  }

  if (stayType === "month") {
    total = PRICES.month;
    summaryPrice.textContent = `$${PRICES.month.toLocaleString()} ${strings.priceMonth}`;
    periodText = `1 ${strings.month}`;
  }

  if (stayType === "year") {
    total = PRICES.year;
    summaryPrice.textContent = `$${PRICES.year.toLocaleString()} ${strings.priceMonth}`;
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
confirmBtn.addEventListener("click", () => {
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
    room,
    guest: { name, email, phone },
    stayType,
    checkin: checkinInput.value,
    checkout: checkoutInput.value,
    total: summaryTotal.textContent
  };

  console.log("📌 RESERVACIÓN:", reservationData);
  const reservations = readReservations();
  reservations.unshift(reservationData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));

  alert(strings.confirmMessage);
});
  
