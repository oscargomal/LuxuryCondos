/* main.js - manejo de modales, carruseles, calculadora y envío al backend */

// ------------------------------
// 1️⃣ Configuración y utilidades
// ------------------------------
const EXCHANGE_RATE = 0.052; // aproximado MXN -> USD

function formatMXN(n){ return '$' + Number(n).toLocaleString('es-MX') + ' MXN'; }
function formatUSD(n){ return '$' + Number(n).toFixed(2) + ' USD'; }
function nightsBetween(start, end){
  if(!start || !end) return 0;
  const d1 = new Date(start); const d2 = new Date(end);
  d1.setHours(0,0,0,0); d2.setHours(0,0,0,0);
  const diff = (d2 - d1) / (1000*60*60*24);
  return diff > 0 ? diff : 0;
}

// ------------------------------
// 2️⃣ Mostrar USD aproximado en cards (si existe)
// ------------------------------
document.querySelectorAll('[data-price-mxn]').forEach(el=>{
  const mxn = Number(el.dataset.priceMxn);
  if(!isNaN(mxn)){
    const usdSpan = el.querySelector('.price-usd');
    if(usdSpan) usdSpan.textContent = ' ≈ ' + formatUSD(mxn * EXCHANGE_RATE);
  }
});

// ------------------------------
// 3️⃣ Helpers para actualizar los displays dentro de un modal (por habitación)
// ------------------------------
function updateModalTotals(modalEl, price){
  const checkin = modalEl.querySelector('.modal-checkin').value;
  const checkout = modalEl.querySelector('.modal-checkout').value;
  const nightsEl = modalEl.querySelector('.modal-nights');
  const totalEl = modalEl.querySelector('.modal-total');
  const nights = nightsBetween(checkin, checkout);

  nightsEl.textContent = nights > 0 ? nights : '—';
  if(nights > 0){
    const total = nights * price;
    totalEl.textContent = formatMXN(total) + ' (~' + formatUSD(total * EXCHANGE_RATE) + ')';
  } else {
    totalEl.textContent = '—';
  }
}

// ------------------------------
// 4️⃣ Abrir modal de detalle de habitación (Ver detalles)
// ------------------------------
document.querySelectorAll('.open-room-modal').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    e.preventDefault();
    const target = btn.getAttribute('data-target');
    const price = Number(btn.dataset.price);
    const room = btn.dataset.room;
    const modal = document.querySelector(target);
    if(!modal) return;

    // inicializar valores del modal
    modal.querySelectorAll('[data-room-price]').forEach(el=>{
      el.textContent = formatMXN(price);
    });
    modal.querySelectorAll('.modal-price-per-night').forEach(el=>{
      el.textContent = formatMXN(price);
    });
    modal.dataset.price = price;
    modal.dataset.room = room;

    // limpiar campos
    modal.querySelectorAll('.modal-checkin, .modal-checkout').forEach(i => i.value = '');
    modal.querySelectorAll('.modal-nights').forEach(n => n.textContent = '—');
    modal.querySelectorAll('.modal-total').forEach(t => t.textContent = '—');

    // show modal using bootstrap API
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    // attach listeners once (idempotente)
    attachModalInputListeners(modal);
  });
});

// ------------------------------
// 5️⃣ Abrir directamente booking universal desde la card (Reservar ahora)
// ------------------------------
document.querySelectorAll('.open-booking-direct').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    e.preventDefault();
    const room = btn.dataset.room;
    const price = Number(btn.dataset.price);
    openUniversalBooking(room, price);
  });
});

// ------------------------------
// 6️⃣ Dentro de cada modal: actualizar totals al cambiar fechas
// ------------------------------
function attachModalInputListeners(modal){
  // if already attached, skip (prevent multiple)
  if(modal.__listenersAttached) return;
  modal.__listenersAttached = true;

  const checkin = modal.querySelector('.modal-checkin');
  const checkout = modal.querySelector('.modal-checkout');
  const price = Number(modal.dataset.price) || Number(modal.querySelector('.modal-price-per-night')?.textContent?.replace(/\D/g,'')) || 0;

  [checkin, checkout].forEach(inp=>{
    if(inp) inp.addEventListener('change', ()=> updateModalTotals(modal, price));
  });

  // botón dentro del modal que abre el universal booking (pre-fills)
  const modalBookBtn = modal.querySelector('.modal-open-booking');
  if(modalBookBtn){
    modalBookBtn.addEventListener('click', ()=>{
      const room = modalBookBtn.dataset.room;
      const price = Number(modalBookBtn.dataset.price);
      const checkinVal = modal.querySelector('.modal-checkin').value;
      const checkoutVal = modal.querySelector('.modal-checkout').value;
      const guestsVal = modal.querySelector('.modal-guests').value;

      openUniversalBooking(room, price, { checkin: checkinVal, checkout: checkoutVal, guests: guestsVal });
      // hide current room modal to avoid backdrop stacking
      const bs = bootstrap.Modal.getInstance(modal);
      if(bs) bs.hide();
    });
  }
}

// ------------------------------
// 7️⃣ Función que abre el modal universal de booking y pre-llena
// ------------------------------
function openUniversalBooking(room, price, opts = {}){
  const ubModalEl = document.getElementById('universalBookingModal');
  const ubTitle = document.getElementById('universalBookingTitle');
  const ubRoomInput = document.getElementById('ub_room');
  const ubPriceInput = document.getElementById('ub_price');
  const ubPriceText = document.getElementById('ub_price_text');
  const ubCheckin = document.getElementById('ub_checkin');
  const ubCheckout = document.getElementById('ub_checkout');
  const ubGuests = document.getElementById('ub_guests');
  const ubNights = document.getElementById('ub_nights');
  const ubTotal = document.getElementById('ub_total');

  ubTitle.textContent = 'Reserva — ' + room;
  ubRoomInput.value = room;
  ubPriceInput.value = price;
  ubPriceText.textContent = formatMXN(price);

  ubCheckin.value = opts.checkin || '';
  ubCheckout.value = opts.checkout || '';
  ubGuests.value = opts.guests || '2';

  // reset nights/total then recalc if dates present
  ubNights.textContent = '—';
  ubTotal.textContent = '—';
  if(ubCheckin.value && ubCheckout.value){
    const nights = nightsBetween(ubCheckin.value, ubCheckout.value);
    if(nights>0){
      ubNights.textContent = nights;
      ubTotal.textContent = formatMXN(nights * price) + ' (~' + formatUSD(nights * price * EXCHANGE_RATE) + ')';
    }
  }

  // show modal
  const bs = new bootstrap.Modal(ubModalEl);
  bs.show();

  // attach change listeners to recalc
  function recalcUB(){
    const nights = nightsBetween(ubCheckin.value, ubCheckout.value);
    ubNights.textContent = nights>0? nights : '—';
    ubTotal.textContent = nights>0 ? formatMXN(nights * price) + ' (~' + formatUSD(nights * price * EXCHANGE_RATE) + ')' : '—';
  }
  ubCheckin.onchange = recalcUB;
  ubCheckout.onchange = recalcUB;
}

// ------------------------------
// 8️⃣ Manejar envío del universal booking (va al backend /api/reservas)
// ------------------------------
document.getElementById('universalBookingForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const name = document.getElementById('ub_name').value.trim();
  const email = document.getElementById('ub_email').value.trim();
  const room = document.getElementById('ub_room').value;
  const price = Number(document.getElementById('ub_price').value) || 0;
  const checkin = document.getElementById('ub_checkin').value;
  const checkout = document.getElementById('ub_checkout').value;
  const guests = document.getElementById('ub_guests').value;

  if(!name || !email || !checkin || !checkout){
    alert('Por favor completa todos los campos.');
    return;
  }

  const nights = nightsBetween(checkin, checkout);
  if(nights <= 0){ alert('Selecciona un rango de fechas válido.'); return; }
  const total = nights * price;

  // enviar al backend (tu endpoint debe crear sesión Stripe y devolver { url })
  try {
    const res = await fetch('/api/reservas', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        nombre: name,
        email: email,
        habitacion: room,
        fechaInicio: checkin,
        fechaFin: checkout,
        huespedes: guests,
        total
      })
    });
    const data = await res.json();
    if(data.url){
      // redirige a Stripe Checkout
      window.location.href = data.url;
    } else {
      console.error('Respuesta backend:', data);
      alert('Error creando reserva. Revisa consola.');
    }
  } catch(err){
    console.error(err);
    alert('Error conectando con el servidor.');
  }
});
