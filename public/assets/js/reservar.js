// ================= DATOS DE PRECIOS =================
const PRICES = {
  night: 3000,
  month: 33000,
  year: 31000
};

const isEnglish = document.documentElement.lang === "en";
const strings = {
  summaryDesc: isEnglish ? "2 guests · Wi-Fi · King bed" : "2 huéspedes · Wi-Fi · Cama King",
  noRoom: isEnglish ? "No room selected" : "No hay habitación seleccionada",
  nights: isEnglish ? "night(s)" : "noche(s)",
  month: isEnglish ? "month" : "mes",
  yearly: isEnglish ? "Annual contract" : "Contrato anual",
  priceNight: isEnglish ? "MXN / night" : "MXN / noche",
  priceMonth: isEnglish ? "MXN / month" : "MXN / mes",
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

  summaryPeriod.textContent = periodText;
  summaryTotal.textContent = total
    ? `$${total.toLocaleString()} MXN`
    : "—";
}

// ================= EVENTOS =================
stayRadios.forEach(radio => {
  radio.addEventListener("change", updateSummary);
});

checkinInput.addEventListener("change", updateSummary);
checkoutInput.addEventListener("change", updateSummary);

// ================= CONFIRMAR RESERVA =================
confirmBtn.addEventListener("click", () => {
  const name = document.querySelector("input[type='text']").value.trim();
  const email = document.querySelector("input[type='email']").value.trim();
  const phone = document.querySelector("input[type='tel']").value.trim();
  const stayType = document.querySelector("input[name='stay']:checked").value;

  if (!name || !email || !phone) {
    alert(strings.missingGuest);
    return;
  }

  if (stayType === "night" && getNights() === 0) {
    alert(strings.invalidDates);
    return;
  }

  const reservationData = {
    room,
    guest: { name, email, phone },
    stayType,
    checkin: checkinInput.value,
    checkout: checkoutInput.value,
    total: summaryTotal.textContent
  };

  console.log("📌 RESERVACIÓN:", reservationData);

  alert(strings.confirmMessage);
});
  
