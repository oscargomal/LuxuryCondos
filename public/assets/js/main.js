const EXCHANGE_RATE = 0.052; // MXN → USD

// ------------------------------
// 1️⃣ Formateo de monedas
// ------------------------------
function formatMXN(num){ return '$' + num.toLocaleString('es-MX'); }
function formatUSD(num){ return '$' + num.toFixed(0) + ' USD'; }
function nightsBetween(start, end){
  const diff = new Date(end) - new Date(start);
  return diff>0 ? diff/1000/60/60/24 : 0;
}

// ------------------------------
// 2️⃣ Mostrar precio aproximado en USD
// ------------------------------
document.querySelectorAll('[data-price-mxn]').forEach(el=>{
  const mxn = Number(el.dataset.priceMxn);
  if(!isNaN(mxn)){
    const usdSpan = el.querySelector('.price-usd');
    if(usdSpan) usdSpan.textContent = ' ≈ '+formatUSD(mxn*EXCHANGE_RATE);
  }
});

// ------------------------------
// 3️⃣ Abrir modal desde card o botón
// ------------------------------
document.querySelectorAll('.open-booking-btn').forEach(btn=>{
  btn.addEventListener('click', e=>{
    e.stopPropagation();
    const room = btn.dataset.room;
    const price = Number(btn.dataset.price);
    const modal = document.querySelector(room==='Lake View'? '#modalLakeView':'#modalMountainView');
    if(modal) new bootstrap.Modal(modal).show();
    updatePriceModal(modal, price);
  });
});

// ------------------------------
// 4️⃣ Actualizar precios dentro del modal
// ------------------------------
function updatePriceModal(modal, price){
  if(!modal) return;
  modal.querySelectorAll('.price-per-night').forEach(el=>el.textContent=formatMXN(price));
  modal.querySelectorAll('.nights').forEach(el=>el.textContent='—');
  modal.querySelectorAll('.total').forEach(el=>el.textContent='—');
  modal.querySelectorAll('.checkin, .checkout').forEach(inp=>inp.value='');
  modal.querySelectorAll('.guests').forEach(sel=>sel.value='2');
  modal.dataset.price = price;
}

// ------------------------------
// 5️⃣ Actualizar total al cambiar fechas o huéspedes
// ------------------------------
document.querySelectorAll('.booking-form').forEach(form=>{
  const modal = form.closest('.modal');
  const price = Number(modal.dataset.price);
  const checkinInput = form.querySelector('.checkin');
  const checkoutInput = form.querySelector('.checkout');
  const nightsEl = form.querySelector('.nights');
  const totalEl = form.querySelector('.total');

  [checkinInput, checkoutInput].forEach(inp=>{
    inp.addEventListener('change', ()=>{
      const nights = nightsBetween(checkinInput.value, checkoutInput.value);
      nightsEl.textContent = nights>0 ? nights : '—';
      totalEl.textContent = nights>0 ? formatMXN(nights*price) : '—';
    });
  });
});

// ------------------------------
// 6️⃣ Enviar reserva al backend (Stripe)
// ------------------------------
document.querySelectorAll('.booking-form').forEach(form=>{
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const modal = form.closest('.modal');
    const price = Number(modal.dataset.price);
    const checkin = form.querySelector('.checkin').value;
    const checkout = form.querySelector('.checkout').value;
    const guests = form.querySelector('.guests').value;
    const room = modal.querySelector('.modal-title').textContent;

    if(!checkin || !checkout){
      alert('Completa fechas para continuar');
      return;
    }

    const nights = nightsBetween(checkin, checkout);
    const total = nights*price;

    try{
      const res = await fetch('/api/reservas',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          nombre:'Cliente Prueba',
          email:'test@example.com',
          habitacion: room,
          fechaInicio: checkin,
          fechaFin: checkout,
          huespedes: guests,
          total
        })
      });
      const data = await res.json();
      if(data.url) window.location.href = data.url;
      else alert('Error creando reserva');
    }catch(err){
      console.error(err);
      alert('Error conectando con el servidor');
    }
  });
});
