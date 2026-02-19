// ================= DATOS DE PRECIOS =================
const PRICES = {
  night: 3000,
  month: 33000,
  year: 31000
};

const CARD_FEE_RATE = 0.04;

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
// Stripe Checkout se crea en backend para recalcular montos y usar Stripe Connect.
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
  missingIdPhotos: isEnglish
    ? "⚠️ Please upload both ID photos."
    : "⚠️ Por favor sube las dos fotos del ID.",
  invalidDates: isEnglish
    ? "⚠️ Select valid dates."
    : "⚠️ Selecciona fechas válidas.",
  paymentUnavailable: isEnglish
    ? "⚠️ Payments are not available for this hotel yet."
    : "⚠️ Los pagos aún no están disponibles para este hotel.",
  confirm: isEnglish ? "Confirm booking" : "Confirmar reservación",
  redirecting: isEnglish
    ? "Redirecting to payment..."
    : "Redirigiendo al pago...",
  payCard: isEnglish ? "Pay by card (+4%)" : "Pagar con tarjeta (+4%)",
  payTransfer: isEnglish
    ? "Contact for discount (bank transfer)"
    : "Quiero descuento (transferencia)",
  payTransferConfirm: isEnglish
    ? "Send transfer request"
    : "Enviar solicitud de transferencia",
  sendingTransfer: isEnglish
    ? "Sending request..."
    : "Enviando solicitud...",
  roomBlocked: isEnglish
    ? "This apartment is blocked for those dates."
    : "Este departamento está bloqueado en esas fechas.",
  roomOccupied: isEnglish
    ? "This apartment is already occupied for those dates."
    : "Este departamento está ocupado en esas fechas.",
  availabilityError: isEnglish
    ? "Could not verify availability. Please try again."
    : "No se pudo verificar disponibilidad. Intenta nuevamente.",
  confirmTransfer: isEnglish
    ? "Confirm that you already made the bank transfer. A reservation ID will be generated now."
    : "Confirma que ya realizaste la transferencia. Se generará el folio ahora.",
  transferTitle: isEnglish ? "Bank transfer" : "Transferencia bancaria",
  transferIntro: isEnglish
    ? "To get the 4% discount, complete your transfer and confirm here."
    : "Para obtener el descuento del 4%, realiza tu transferencia y confirma aquí.",
  transferConfirm: isEnglish ? "Confirm transfer" : "Confirmar transferencia",
  transferNote: isEnglish
    ? "A reservation ID will be generated when you confirm."
    : "Se generará el folio de tu reservación al confirmar.",
  annualNote: isEnglish
    ? "For annual contracts, please contact us so we can agree on the contract details."
    : "Para contrato anual, favor de contactarnos para ponernos de acuerdo con el contrato."
};

const TRANSFER_DETAILS = {
  bank: "BBVA Mexico",
  holder: "Luxury Condo",
  mxnChecking: "0124385160",
  mxnClabe: "012320001243851602",
  usdAccount: "0125883040",
  usdClabe: "012320001258830401",
  swift: "BCMRMCMMPYM"
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

const formatDateForInput = (date) => (
  new Intl.DateTimeFormat("en-CA", {
    timeZone: MEXICO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date)
);

const addNights = (dateValue, nights) => {
  if (!dateValue) return "";
  const base = new Date(`${dateValue}T00:00:00`);
  const next = new Date(base);
  next.setDate(base.getDate() + nights);
  return formatDateForInput(next);
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
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { error: result?.error || "No se pudo crear la sesión de pago." };
    }
    return result;
  } catch (error) {
    return null;
  }
};

// ================= ELEMENTOS =================
const summaryImg = document.getElementById("summaryImg");
const summaryThumbs = document.getElementById("summaryThumbs");
const summaryTitle = document.getElementById("summaryTitle");
const summaryDesc = document.getElementById("summaryDesc");
const summaryPrice = document.getElementById("summaryPrice");
const summaryPeriod = document.getElementById("summaryPeriod");
const summaryTotal = document.getElementById("summaryTotal");
const summaryCardFee = document.getElementById("summaryCardFee");
const summaryCardTotal = document.getElementById("summaryCardTotal");
const bookingToast = document.getElementById("bookingToast");

const stayRadios = document.querySelectorAll("input[name='stay']");
const checkinInput = document.getElementById("checkin");
const checkoutInput = document.getElementById("checkout");
const payWithCardBtn = document.getElementById("payWithCard");
const payWithTransferBtn = document.getElementById("payWithTransfer");
const annualNote = document.getElementById("annualNote");
const transferModal = document.getElementById("transferModal");
const transferTitle = document.getElementById("transferTitle");
const transferIntro = document.querySelector(".transfer-modal__intro");
const transferNote = document.querySelector(".transfer-modal__note");
const transferConfirmBtn = document.getElementById("confirmTransferBtn");
const transferWhatsapp = document.getElementById("transferWhatsapp");
const transferPhone = document.getElementById("transferPhone");
const transferBank = document.querySelector("[data-transfer-bank]");
const transferHolder = document.querySelector("[data-transfer-holder]");
const transferMxnChecking = document.querySelector("[data-transfer-mxn-checking]");
const transferMxnClabe = document.querySelector("[data-transfer-mxn-clabe]");
const transferUsdAccount = document.querySelector("[data-transfer-usd-account]");
const transferUsdClabe = document.querySelector("[data-transfer-usd-clabe]");
const transferSwift = document.querySelector("[data-transfer-swift]");
const idPhotoFrontInput = document.getElementById("idPhotoFront");
const idPhotoBackInput = document.getElementById("idPhotoBack");
const idPhotoFrontPreview = document.getElementById("idPhotoFrontPreview");
const idPhotoBackPreview = document.getElementById("idPhotoBackPreview");

if (transferBank) transferBank.textContent = TRANSFER_DETAILS.bank;
if (transferHolder) transferHolder.textContent = TRANSFER_DETAILS.holder;
if (transferMxnChecking) transferMxnChecking.textContent = TRANSFER_DETAILS.mxnChecking;
if (transferMxnClabe) transferMxnClabe.textContent = TRANSFER_DETAILS.mxnClabe;
if (transferUsdAccount) transferUsdAccount.textContent = TRANSFER_DETAILS.usdAccount;
if (transferUsdClabe) transferUsdClabe.textContent = TRANSFER_DETAILS.usdClabe;
if (transferSwift) transferSwift.textContent = TRANSFER_DETAILS.swift;

// ================= CARGAR HABITACIÓN =================
const room = JSON.parse(localStorage.getItem("selectedRoom"));
let idPhotoFrontData = "";
let idPhotoBackData = "";
let idPhotoFrontName = "";
let idPhotoBackName = "";
let currentBaseTotal = 0;
let currentCardFee = 0;
let currentCardTotal = 0;
let transferModalOpen = false;
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

const normalizeImage = (img) => {
  if (!img) return "";
  if (img.startsWith("http") || img.startsWith("/") || img.startsWith("data:")) return img;
  return `/${img}`;
};

const renderSummaryGallery = (images) => {
  if (!summaryImg) return;
  const safeImages = (images || []).map(normalizeImage).filter(Boolean);
  if (!safeImages.length) {
    summaryImg.removeAttribute("src");
    if (summaryThumbs) {
      summaryThumbs.innerHTML = "";
      summaryThumbs.style.display = "none";
    }
    return;
  }

  summaryImg.src = safeImages[0];

  if (!summaryThumbs) return;
  summaryThumbs.innerHTML = "";
  summaryThumbs.style.display = safeImages.length > 1 ? "grid" : "none";

  if (safeImages.length <= 1) return;

  safeImages.forEach((src, index) => {
    const thumb = document.createElement("img");
    thumb.src = src;
    thumb.alt = isEnglish ? "Preview" : "Vista previa";
    if (index === 0) thumb.classList.add("active");
    thumb.addEventListener("click", () => {
      summaryImg.src = src;
      summaryThumbs.querySelectorAll("img").forEach((item) => item.classList.remove("active"));
      thumb.classList.add("active");
    });
    summaryThumbs.appendChild(thumb);
  });
};

const readFileAsDataUrl = (file) => (
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  })
);

const uploadIdPhoto = async ({ dataUrl, fileName, reservationId, side }) => {
  const response = await fetch("/api/upload-id-photo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataUrl,
      fileName,
      reservationId,
      side
    })
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error || "No se pudo subir la identificación.");
  }

  return result?.path || "";
};

const renderIdPreview = (container, dataUrl) => {
  if (!container) return;
  container.innerHTML = "";
  if (!dataUrl) return;
  const img = document.createElement("img");
  img.src = dataUrl;
  img.alt = isEnglish ? "ID photo" : "Identificación";
  container.appendChild(img);
};

const showToast = (message, variant = "error") => {
  if (!bookingToast) return;
  bookingToast.textContent = message;
  bookingToast.classList.remove("toast--error", "toast--warning", "show");
  bookingToast.classList.add(`toast--${variant}`);
  bookingToast.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    bookingToast.classList.remove("show");
  }, 3500);
};

const setPaymentDisabled = (disabled) => {
  if (payWithCardBtn) payWithCardBtn.disabled = disabled;
  if (payWithTransferBtn) payWithTransferBtn.disabled = disabled;
};

const checkAvailability = async ({ roomId, checkin, checkout }) => {
  if (!roomId || !checkin || !checkout) return { available: true };
  try {
    const params = new URLSearchParams({ roomId, checkin, checkout });
    const response = await fetch(`/api/availability?${params.toString()}`);
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { available: true, error: result?.error || strings.availabilityError };
    }
    return result;
  } catch (error) {
    return { available: true, error: strings.availabilityError };
  }
};

if (room) {
  const roomImages = Array.isArray(room?.images) ? room.images : [];
  const summaryImages = roomImages.length
    ? roomImages
    : room?.img
      ? [room.img]
      : [];
  renderSummaryGallery(summaryImages);
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

  currentBaseTotal = total;
  currentCardFee = total ? Math.round(total * CARD_FEE_RATE) : 0;
  currentCardTotal = total ? total + currentCardFee : 0;

  summaryPeriod.textContent = periodText;
  summaryTotal.textContent = total
    ? `$${total.toLocaleString()} MXN`
    : stayType === "other"
      ? strings.priceOther
      : "—";

  if (summaryCardFee) {
    summaryCardFee.textContent = total
      ? `$${currentCardFee.toLocaleString()} MXN`
      : stayType === "other"
        ? strings.priceOther
        : "—";
  }

  if (summaryCardTotal) {
    summaryCardTotal.textContent = total
      ? `$${currentCardTotal.toLocaleString()} MXN`
      : stayType === "other"
        ? strings.priceOther
        : "—";
  }
}

function updateStayType() {
  const stayType = document.querySelector("input[name='stay']:checked").value;
  const disableCheckout = stayType === "month" || stayType === "year";
  checkoutInput.disabled = disableCheckout;
  if (disableCheckout) {
    const nights = stayType === "month" ? 30 : 364;
    checkoutInput.value = checkinInput.value
      ? addNights(checkinInput.value, nights)
      : "";
  }
  setDateMinimums();
  updateSummary();
  runAvailabilityCheck();
  const isYear = stayType === "year";
  if (payWithCardBtn) {
    payWithCardBtn.disabled = isYear;
  }
  if (annualNote) {
    annualNote.hidden = !isYear;
    annualNote.textContent = strings.annualNote;
  }
}

const runAvailabilityCheck = async () => {
  const stayType = document.querySelector("input[name='stay']:checked").value;
  if (stayType === "other") return;
  if (!room?.id) return;
  if (!checkinInput.value || !checkoutInput.value) {
    setPaymentDisabled(false);
    return;
  }

  const result = await checkAvailability({
    roomId: room.id,
    checkin: checkinInput.value,
    checkout: checkoutInput.value
  });

  if (result?.available === false) {
    const message = result.reason === "occupied"
      ? strings.roomOccupied
      : strings.roomBlocked;
    showToast(message, "warning");
    setPaymentDisabled(true);
    return;
  }

  setPaymentDisabled(false);
};

// ================= EVENTOS =================
stayRadios.forEach(radio => {
  radio.addEventListener("change", updateStayType);
});

checkinInput.addEventListener("change", () => {
  setDateMinimums();
  const stayType = document.querySelector("input[name='stay']:checked").value;
  if (stayType === "month") {
    checkoutInput.value = addNights(checkinInput.value, 30);
  } else if (stayType === "year") {
    checkoutInput.value = addNights(checkinInput.value, 364);
  }
  updateSummary();
  runAvailabilityCheck();
});
checkoutInput.addEventListener("change", () => {
  updateSummary();
  runAvailabilityCheck();
});

updateStayType();

if (idPhotoFrontInput) {
  idPhotoFrontInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      idPhotoFrontData = "";
      idPhotoFrontName = "";
      renderIdPreview(idPhotoFrontPreview, "");
      return;
    }
    try {
      idPhotoFrontName = file.name || "id-front";
      idPhotoFrontData = await readFileAsDataUrl(file);
      renderIdPreview(idPhotoFrontPreview, idPhotoFrontData);
    } catch (error) {
      idPhotoFrontData = "";
      idPhotoFrontName = "";
      renderIdPreview(idPhotoFrontPreview, "");
    }
  });
}

if (idPhotoBackInput) {
  idPhotoBackInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      idPhotoBackData = "";
      idPhotoBackName = "";
      renderIdPreview(idPhotoBackPreview, "");
      return;
    }
    try {
      idPhotoBackName = file.name || "id-back";
      idPhotoBackData = await readFileAsDataUrl(file);
      renderIdPreview(idPhotoBackPreview, idPhotoBackData);
    } catch (error) {
      idPhotoBackData = "";
      idPhotoBackName = "";
      renderIdPreview(idPhotoBackPreview, "");
    }
  });
}

// ================= CONFIRMAR RESERVA =================
const closeTransferModal = () => {
  if (!transferModal) return;
  transferModal.classList.remove("is-open");
  transferModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  transferModalOpen = false;
};

const buildTransferMessage = () => {
  const name = document.querySelector("input[type='text']").value.trim();
  const email = document.querySelector("input[type='email']").value.trim();
  const phone = document.querySelector("input[type='tel']").value.trim();
  const stayType = document.querySelector("input[name='stay']:checked").value;
  const stayLabel = stayType === "year"
    ? (isEnglish ? "Annual contract" : "Contrato anual")
    : stayType === "month"
      ? (isEnglish ? "Monthly stay" : "Estancia mensual")
      : stayType === "night"
        ? (isEnglish ? "Per night" : "Por noche")
        : (isEnglish ? "Custom request" : "Solicitud personalizada");
  const checkinValue = checkinInput.value || "—";
  const checkoutValue = checkoutInput.value || "—";
  const roomName = room?.name || (isEnglish ? "Apartment" : "Departamento");

  if (isEnglish) {
    return `Hello! I want the 4% transfer discount.\n` +
      `Name: ${name || "—"}\nEmail: ${email || "—"}\nPhone: ${phone || "—"}\n` +
      `Stay: ${stayLabel}\nRoom: ${roomName}\nCheck-in: ${checkinValue}\nCheck-out: ${checkoutValue}`;
  }

  return `Hola, quiero el descuento del 4% por transferencia.\n` +
    `Nombre: ${name || "—"}\nCorreo: ${email || "—"}\nTeléfono: ${phone || "—"}\n` +
    `Estancia: ${stayLabel}\nDepto: ${roomName}\nCheck-in: ${checkinValue}\nCheck-out: ${checkoutValue}`;
};

const openTransferModal = () => {
  if (!transferModal) return;
  if (transferTitle) transferTitle.textContent = strings.transferTitle;
  if (transferIntro) transferIntro.textContent = strings.transferIntro;
  if (transferNote) transferNote.textContent = strings.transferNote;
  if (transferConfirmBtn) transferConfirmBtn.textContent = strings.transferConfirm;
  if (transferWhatsapp) {
    const message = buildTransferMessage();
    transferWhatsapp.href = `https://wa.me/523313695589?text=${encodeURIComponent(message)}`;
  }
  if (transferPhone) {
    transferPhone.href = "tel:+523313695589";
  }
  transferModal.classList.add("is-open");
  transferModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  transferModalOpen = true;
};

const setSubmitting = (paymentMethod, isSubmitting) => {
  const stayType = document.querySelector("input[name='stay']:checked").value;
  const isYear = stayType === "year";
  if (payWithCardBtn) {
    payWithCardBtn.disabled = isSubmitting || isYear;
    payWithCardBtn.textContent = isSubmitting && paymentMethod === "card"
      ? strings.redirecting
      : strings.payCard;
  }
  if (payWithTransferBtn) {
    payWithTransferBtn.disabled = isSubmitting;
    payWithTransferBtn.textContent = isSubmitting && paymentMethod === "transfer"
      ? strings.sendingTransfer
      : strings.payTransfer;
  }
};

const submitReservation = async (paymentMethod) => {
  const reservationId = Date.now();
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

  if (!idPhotoFrontData || !idPhotoBackData) {
    alert(strings.missingIdPhotos);
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

  if ((stayType === "month" || stayType === "year") && (!checkinValue || !checkoutValue)) {
    alert(strings.invalidDates);
    return;
  }

  const availabilityResult = await checkAvailability({
    roomId: room?.id,
    checkin: checkinValue,
    checkout: checkoutValue
  });

  if (availabilityResult?.available === false) {
    const message = availabilityResult.reason === "occupied"
      ? strings.roomOccupied
      : strings.roomBlocked;
    showToast(message, "warning");
    return;
  }

  if (availabilityResult?.error) {
    showToast(availabilityResult.error, "error");
  }

  let idPhotoFrontPath = "";
  let idPhotoBackPath = "";
  try {
    idPhotoFrontPath = await uploadIdPhoto({
      dataUrl: idPhotoFrontData,
      fileName: idPhotoFrontName || "id-front",
      reservationId,
      side: "front"
    });
    idPhotoBackPath = await uploadIdPhoto({
      dataUrl: idPhotoBackData,
      fileName: idPhotoBackName || "id-back",
      reservationId,
      side: "back"
    });
  } catch (error) {
    alert(error.message || "No se pudo subir la identificación.");
    return;
  }

  const totalAmount = paymentMethod === "card" ? currentCardTotal : currentBaseTotal;
  const totalLabel = totalAmount
    ? `$${totalAmount.toLocaleString()} MXN`
    : stayType === "other"
      ? strings.priceOther
      : "—";

  const reservationData = {
    id: reservationId,
    createdAt: getMexicoTimestamp(),
    status: stayType === "other"
      ? "Solicitud"
      : paymentMethod === "transfer"
        ? "Pendiente de transferencia"
        : STATUS_PENDING,
    paymentStatus: stayType === "other"
      ? PAYMENT_STATUS.none
      : PAYMENT_STATUS.pending,
    roomOccupied: 0,
    language: isEnglish ? "en" : "es",
    room,
    guest: {
      name,
      email,
      phone,
      idPhotoFront: idPhotoFrontPath || null,
      idPhotoBack: idPhotoBackPath || null
    },
    stayType,
    checkin: checkinInput.value,
    checkout: checkoutInput.value,
    total: totalLabel
  };

  console.log("📌 RESERVACIÓN:", reservationData);

  const savedReservation = await saveReservationToApi(reservationData);
  const nextReservation = savedReservation || reservationData;

  const reservations = readReservations();
  reservations.unshift(nextReservation);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
  localStorage.setItem(STORAGE_LAST_ID, String(nextReservation.id));

  setSubmitting(paymentMethod, true);

  if (stayType === "other") {
    closeTransferModal();
    window.location.href = isEnglish
      ? `/eng/pending.html?reservationId=${nextReservation.id}`
      : `/pendiente.html?reservationId=${nextReservation.id}`;
    return;
  }

  if (paymentMethod === "transfer") {
    closeTransferModal();
    const base = isEnglish ? "/eng/thanks.html" : "/gracias.html";
    window.location.href = `${base}?reservationId=${nextReservation.id}&payment=transfer`;
    return;
  }

  const checkoutResponse = await createCheckoutSession({
    reservationId: nextReservation.id,
    roomId: room?.id || null,
    stayType,
    checkin: checkinInput.value,
    checkout: checkoutInput.value,
    language: isEnglish ? "en" : "es",
    paymentMethod: "card",
    cardFeeRate: CARD_FEE_RATE
  });

  if (!checkoutResponse?.checkoutUrl) {
    alert(checkoutResponse?.error || strings.paymentUnavailable);
    setSubmitting(paymentMethod, false);
    return;
  }

  window.location.href = checkoutResponse.checkoutUrl;
};

if (payWithCardBtn) {
  payWithCardBtn.textContent = strings.payCard;
  payWithCardBtn.addEventListener("click", () => {
    closeTransferModal();
    submitReservation("card");
  });
}

if (payWithTransferBtn) {
  payWithTransferBtn.textContent = strings.payTransfer;
  payWithTransferBtn.addEventListener("click", () => {
    openTransferModal();
  });
}

if (transferConfirmBtn) {
  transferConfirmBtn.addEventListener("click", () => {
    submitReservation("transfer");
  });
}

if (transferModal) {
  transferModal.addEventListener("click", (event) => {
    const shouldClose = event.target.closest("[data-transfer-close]");
    if (shouldClose) closeTransferModal();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && transferModalOpen) closeTransferModal();
});
  
