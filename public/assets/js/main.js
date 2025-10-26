// ------------------------------
// 1️⃣ Configuración general
// ------------------------------
const EXCHANGE_RATE = 0.053; // MXN -> USD aproximado

// Booking modal elements (solo uno)
const bookingModalEl = document.getElementById('bookingModal');
const bookingModal = new bootstrap.Modal(bookingModalEl);
const bkRoomName = document.getElementById('bookingRoomName');
const bkPricePerNight = document.getElementById('bookingPricePerNight');
const bkNights = document.getElementById('bookingNights');
const bkTotal = document.getElementById('bookingTotal');
const checkinInput = document.getElementById('bookingCheckin');
const checkoutInput = document.getElementById('bookingCheckout');
const guestsInput = document.getElementById('bookingGuests');

// ------------------------------
// 2️⃣ Funciones auxiliares
// ------------------------------
function formatMXN(amount) { return `$${amount.toLocaleString()} MXN`; }
function formatUSD(amount) { return `$${amount.toFixed(2)} USD`; }
function nightsBetween(a, b) {
  if (!a || !b) return 0;
  const d1 = new Date(a), d2 = new Date(b);
  d1.setHours(0,0,0,0); d2.setHours(0,0,0,0);
  const diff = (d2 - d1) / (1000*60*60*24);
  return diff > 0 ? diff : 0;
}
function updateBookingTotals() {
  const price = Number(bkPricePerNight.dataset.price) || 0;
  const nights = nightsBetween(checkinInput.value, checkoutInput.value);
  if (nights <= 0) {
    bkNights.textContent = '—';
    bkTotal.textContent = '—';
    return;
  }
  bkNights.textContent = nights;
  const total = price * nights;
  bkTotal.textContent = formatMXN(total) + ' (~' + formatUSD(total*EXCHANGE_RATE) + ')';
}

// ------------------------------
// 3️⃣ Lightbox para imágenes
// ------------------------------
const lightboxModalEl = document.getElementById('lightboxModal');
const lightboxModal = new bootstrap.Modal(lightboxModalEl);
const lightboxImage = document.getElementById('lightboxImage');

function openLightbox(src) {
  lightboxImage.src = src;
  lightboxModal.show();
}

document.querySelectorAll('.room-modal-img, .carousel-item img').forEach(img => {
  img.style.cursor = 'zoom-in';
  img.addEventListener('click', () => openLightbox(img.src));
});

// ------------------------------
// 4️⃣ Abrir modal de vista expandida
// ------------------------------
document.querySelectorAll('.room-card').forEach(card => {
  card.addEventListener('click', () => {
    const targetModalId = card.dataset.bsTarget;
    const modalEl = document.querySelector(targetModalId);
    if(modalEl){
      const bsModal = new bootstrap.Modal(modalEl);
      bsModal.show();
    }
  });
});

// ------------------------------
// 5️⃣ Abrir modal de booking dinámico (CORREGIDO)
// ------------------------------
function openBookingModal(roomName, price) {
  // Setear datos en el modal de booking
  bkRoomName.value = roomName;
  bkPricePerNight.textContent = formatMXN(price) + ' (~' + formatUSD(price*EXCHANGE_RATE) + ')';
  bkPricePerNight.dataset.price = price;
  document.getElementById('bookingRoomTitle').textContent = 'Reservar — ' + roomName;

  // Resetar fechas y totales
  checkinInput.value = '';
  checkoutInput.value = '';
  bkNights.textContent = '—';
  bkTotal.textContent = '—';
  guestsInput.value = '2';

  // Mostrar modal de booking
  bookingModal.show();
}

// Escuchar click en botones "Reservar ahora"
document.querySelectorAll('.open-booking').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // Evita click propagado

    // Cerrar modal de habitación abierto
    const activeRoomModalEl = document.querySelector('.modal.show');
    if(activeRoomModalEl){
      const activeRoomModal = bootstrap.Modal.getInstance(activeRoomModalEl);
      if(activeRoomModal && activeRoomModalEl.id !== 'bookingModal'){
        activeRoomModal.hide();
      }
    }

    const roomName = btn.dataset.room;
    const price = Number(btn.dataset.price) || 0;
    openBookingModal(roomName, price);
  });
});

// Opcional: abrir directamente desde la card (si quieres)
// document.querySelectorAll('.room-card').forEach(card => {
//   card.addEventListener('dblclick', () => { 
//      const roomName = card.dataset.roomName;
//      const price = Number(card.dataset.priceMxn) || 0;
//      openBookingModal(roomName, price);
//   });
// });

// ------------------------------
// 6️⃣ Actualizar total al cambiar fechas
// ------------------------------
[checkinInput, checkoutInput].forEach(inp => inp.addEventListener('change', updateBookingTotals));

// ------------------------------
// 7️⃣ Enviar reserva al backend (Stripe)
// ------------------------------
document.getElementById('bookingForm').addEventListener('submit', async e => {
  e.preventDefault();

  const room = bkRoomName.value;
  const checkinDate = checkinInput.value;
  const checkoutDate = checkoutInput.value;

  if (!room || !checkinDate || !checkoutDate) {
    alert('Por favor completa todos los campos');
    return;
  }

  const price = Number(bkPricePerNight.dataset.price) || 0;
  const nights = nightsBetween(checkinDate, checkoutDate);
  const total = price * nights;

  try {
    const res = await fetch('/api/reservas', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        nombre: 'Cliente Prueba',
        email: 'test@example.com',
        habitacion: room,
        fechaInicio: checkinDate,
        fechaFin: checkoutDate,
        total
      })
    });

    const data = await res.json();
    if(data.url) window.location.href = data.url;
    else alert('Error creando reserva');
  } catch(err) {
    console.error(err);
    alert('Error conectando con el servidor');
  }
});

// ------------------------------
// 8️⃣ Mostrar precio aproximado en USD en cada card y modal
// ------------------------------
document.querySelectorAll('[data-price-mxn]').forEach(el => {
  const mxn = Number(el.dataset.priceMxn);
  if(!isNaN(mxn)){
    let usdSpan = el.querySelector('.price-usd');
    if(!usdSpan){
      usdSpan = document.createElement('span');
      usdSpan.className = 'price-usd';
      el.appendChild(usdSpan);
    }
    usdSpan.textContent = ' ≈ ' + formatUSD(mxn*EXCHANGE_RATE);
  }
});
