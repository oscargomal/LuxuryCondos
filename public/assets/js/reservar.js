// ================= DATOS DE PRECIOS =================
const PRICES = {
  night: 3000,
  month: 33000,
  year: 31000
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
  summaryDesc.textContent = "2 huéspedes · Wi-Fi · Cama King";
} else {
  summaryTitle.textContent = "No hay habitación seleccionada";
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
    summaryPrice.textContent = `$${PRICES.night.toLocaleString()} MXN / noche`;
    periodText = nights ? `${nights} noche(s)` : "—";
  }

  if (stayType === "month") {
    total = PRICES.month;
    summaryPrice.textContent = `$${PRICES.month.toLocaleString()} MXN / mes`;
    periodText = "1 mes";
  }

  if (stayType === "year") {
    total = PRICES.year;
    summaryPrice.textContent = `$${PRICES.year.toLocaleString()} MXN / mes`;
    periodText = "Contrato anual";
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
    alert("⚠️ Por favor completa todos los datos del huésped.");
    return;
  }

  if (stayType === "night" && getNights() === 0) {
    alert("⚠️ Selecciona fechas válidas.");
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

  alert(
    "✅ Solicitud enviada correctamente.\n\n" +
    "Nos pondremos en contacto para confirmar disponibilidad."
  );
});
  