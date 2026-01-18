const modal = document.getElementById("roomModal");
const closeModal = document.getElementById("closeModal");

const modalImg = document.getElementById("modalMainImg");
const modalTitle = document.getElementById("modalTitle");
const modalPrice = document.getElementById("modalPrice");
const modalReservar = document.getElementById("modalReservar");
const isEnglish = document.documentElement.lang === "en";
const priceUnit = isEnglish ? "MXN / night" : "MXN / noche";

// Abrir modal
document.querySelectorAll(".open-modal").forEach(btn => {
  btn.addEventListener("click", e => {
    e.preventDefault();

    const roomData = {
      name: btn.dataset.name,
      price: btn.dataset.price,
      img: btn.dataset.img
    };

    modalImg.src = roomData.img;
    modalTitle.textContent = roomData.name;
    modalPrice.textContent = `$${roomData.price} ${priceUnit}`;

    // Guardar datos en el botón
    modalReservar.dataset.room = JSON.stringify(roomData);

    modal.classList.add("active");
  });
});

// Guardar ANTES de ir a reservar
modalReservar.addEventListener("click", () => {
  const roomData = JSON.parse(modalReservar.dataset.room);
  localStorage.setItem("selectedRoom", JSON.stringify(roomData));
});

// Cerrar modal
closeModal.addEventListener("click", () => {
  modal.classList.remove("active");
});

modal.addEventListener("click", e => {
  if (e.target === modal) modal.classList.remove("active");
});
document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll(".room-carousel").forEach(carousel => {

    const images = carousel.querySelectorAll("img");
    const nextBtn = carousel.querySelector(".next");
    const prevBtn = carousel.querySelector(".prev");

    if (!images.length) return;

    let index = 0;

    // Asegurar imagen activa
    images.forEach(img => img.classList.remove("active"));
    images[0].classList.add("active");

    nextBtn.addEventListener("click", () => {
      images[index].classList.remove("active");
      index = (index + 1) % images.length;
      images[index].classList.add("active");
    });

    prevBtn.addEventListener("click", () => {
      images[index].classList.remove("active");
      index = (index - 1 + images.length) % images.length;
      images[index].classList.add("active");
    });

  });

});
