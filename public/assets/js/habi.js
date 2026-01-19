const modal = document.getElementById("roomModal");
const closeModal = document.getElementById("closeModal");

const modalImg = document.getElementById("modalMainImg");
const modalTitle = document.getElementById("modalTitle");
const modalPrice = document.getElementById("modalPrice");
const modalReservar = document.getElementById("modalReservar");
const isEnglish = document.documentElement.lang === "en";
const priceUnit = isEnglish ? "MXN / night" : "MXN / noche";

// Abrir modal (delegado para soportar contenido dinámico)
document.addEventListener("click", (event) => {
  const btn = event.target.closest(".open-modal");
  if (!btn) return;
  event.preventDefault();

  const roomData = {
    name: btn.dataset.name,
    price: btn.dataset.price,
    img: btn.dataset.img,
    id: btn.dataset.id || null,
    summary: btn.dataset.summary || ""
  };

  modalImg.src = roomData.img;
  modalTitle.textContent = roomData.name;
  modalPrice.textContent = `$${roomData.price} ${priceUnit}`;

  // Guardar datos en el botón
  modalReservar.dataset.room = JSON.stringify(roomData);

  modal.classList.add("active");
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
const initCarousels = (root = document) => {
  root.querySelectorAll(".room-carousel").forEach(carousel => {
    if (carousel.dataset.initialized === "true") return;

    const images = carousel.querySelectorAll("img");
    const nextBtn = carousel.querySelector(".next");
    const prevBtn = carousel.querySelector(".prev");

    if (!images.length || !nextBtn || !prevBtn) return;

    let index = 0;

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

    carousel.dataset.initialized = "true";
  });
};

const initRoomsUI = () => {
  initCarousels();
};

window.initRoomsUI = initRoomsUI;

document.addEventListener("DOMContentLoaded", initRoomsUI);
