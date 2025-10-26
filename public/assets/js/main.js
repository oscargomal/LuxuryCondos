// ------------------------------
// 1️⃣ Configuración
// ------------------------------
const EXCHANGE_RATE = 0.053; // MXN -> USD

// ------------------------------
// 2️⃣ Funciones auxiliares
// ------------------------------
function formatMXN(amount){ return `$${amount.toLocaleString()} MXN`; }
function formatUSD(amount){ return `$${amount.toFixed(2)} USD`; }
function nightsBetween(a,b){
  if(!a||!b) return 0;
  const d1=new Date(a), d2=new Date(b);
  d1.setHours(0,0,0,0); d2.setHours(0,0,0,0);
  const diff=(d2-d1)/(1000*60*60*24);
  return diff>0?diff:0;
}

// ------------------------------
// 3️⃣ Actualizar total al cambiar fechas
// ------------------------------
function attachBookingListeners(modalId){
  const modal = document.getElementById(modalId);
  const checkin = modal.querySelector('.booking-checkin');
  const checkout = modal.querySelector('.booking-checkout');
  const nightsEl = modal.querySelector('.booking-nights');
  const totalEl = modal.querySelector('.booking-total');
  const price = Number(modal.querySelector('.btn-book-now').dataset.price);

  function updateTotals(){
    const nights = nightsBetween(checkin.value, checkout.value);
    nightsEl.textContent = nights || '—';
    totalEl.textContent = nights ? formatMXN(price*nights)+' (~'+formatUSD(price*nights*EXCHANGE_RATE)+')' : '—';
  }

  checkin.addEventListener('change', updateTotals);
  checkout.addEventListener('change', updateTotals);
}

// ------------------------------
// 4️⃣ Inicializar listeners para modales
// ------------------------------
['modalLakeView','modalMountainView'].forEach(id=>{
  attachBookingListeners(id);
});

// ------------------------------
// 5️⃣ Botones "Pagar / Confirmar reserva"
// ------------------------------
document.querySelectorAll('.btn-book-now').forEach(btn=>{
  btn.addEventListener('click', async ()=>{
    const modal = btn.closest('.modal');
    const room = btn.dataset.room;
    const price = Number(btn.dataset.price);
    const checkin = modal.querySelector('.booking-checkin').value;
    const checkout = modal.querySelector('.booking-checkout').value;
    const nights = nightsBetween(checkin, checkout);
    const total = price * nights;

    if(!checkin||!checkout||nights<=0){
      alert('Por favor completa fechas válidas');
      return;
    }

    // Aquí se envía al backend para Stripe
    try{
      const res = await fetch('/api/reservas',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({habitacion:room, fechaInicio:checkin, fechaFin:checkout, total})
      });
      const data = await res.json();
      if(data.url) window.location.href = data.url;
      else alert('Error creando reserva');
    }catch(err){ console.error(err); alert('Error conectando con el servidor'); }
  });
});

// ------------------------------
// 6️⃣ Mostrar precio aproximado en USD en cada card
// ------------------------------
document.querySelectorAll('[data-price-mxn]').forEach(el=>{
  const mxn = Number(el.dataset.priceMxn);
  if(!isNaN(mxn)){
    const usdSpan = el.querySelector('.price-usd');
    if(usdSpan) usdSpan.textContent = ' ≈ '+formatUSD(mxn*EXCHANGE_RATE);
  }
});
