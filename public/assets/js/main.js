/* =========================================================
   🌐 main.js — Luxury Condo
   ========================================================= */

// 1️⃣ Abrir el modal correcto
document.querySelectorAll('.open-booking-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    const room = btn.dataset.room;
    const price = parseFloat(btn.dataset.price);

    // Configurar modal al abrir
    const modalId = room === 'Lake View' ? '#modalLakeView' : '#modalMountainView';
    const modalEl = document.querySelector(modalId);
    const form = modalEl.querySelector('.booking-form');

    form.dataset.price = price;
    form.querySelector('.price-per-night').textContent = `$${price.toLocaleString()} MXN`;
    form.querySelector('.nights').textContent = '—';
    form.querySelector('.total').textContent = '—';
  });
});

// 2️⃣ Calcular noches y total
document.querySelectorAll('.booking-form').forEach(form => {
  const checkin = form.querySelector('.checkin');
  const checkout = form.querySelector('.checkout');
  const nightsEl = form.querySelector('.nights');
  const totalEl = form.querySelector('.total');

  function updateTotal() {
  const price = parseFloat(form.dataset.price);
  const inDate = new Date(checkin.value);
  const outDate = new Date(checkout.value);
  if (checkin.value && checkout.value && inDate < outDate) {
    const diff = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
    const total = diff * price;
    nightsEl.textContent = diff;
    totalEl.textContent = `$${total.toLocaleString()} MXN`;
  } else {
    nightsEl.textContent = '—';
    totalEl.textContent = '—';
  }
    const diff = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
    const total = diff * price;
    nightsEl.textContent = diff;
    totalEl.textContent = `$${total.toLocaleString()} MXN`;
  }

  checkin.addEventListener('change', updateTotal);
  checkout.addEventListener('change', updateTotal);

  // 3️⃣ Preparar submit para Stripe o confirmación
  form.addEventListener('submit', e => {
    e.preventDefault();
    const total = totalEl.textContent;
    if (total === '—') {
      alert('Selecciona fechas válidas antes de continuar.');
      return;
    }
    alert(`Reserva confirmada para ${form.dataset.room} — Total ${total}`);
    // Aquí se integrará Stripe más adelante
  });
});

