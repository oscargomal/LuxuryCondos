const modal = document.getElementById("roomModal");
const closeModal = document.getElementById("closeModal");

const modalImg = document.getElementById("modalMainImg");
const modalThumbs = document.getElementById("modalThumbs");
const modalTitle = document.getElementById("modalTitle");
const modalPrice = document.getElementById("modalPrice");
const modalReservar = document.getElementById("modalReservar");
const isEnglish = document.documentElement.lang === "en";
const priceUnit = isEnglish ? "MXN / night" : "MXN / noche";

const parseImagesData = (value) => {
  if (!value) return [];
  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const renderModalGallery = (images) => {
  const safeImages = (images || []).filter(Boolean);
  if (!safeImages.length) {
    if (modalImg) modalImg.removeAttribute("src");
    if (modalThumbs) {
      modalThumbs.innerHTML = "";
      modalThumbs.style.display = "none";
    }
    return;
  }

  if (modalImg) {
    modalImg.src = safeImages[0];
  }

  if (!modalThumbs) return;
  modalThumbs.innerHTML = "";
  modalThumbs.style.display = safeImages.length > 1 ? "flex" : "none";
  if (safeImages.length <= 1) return;

  safeImages.forEach((src, index) => {
    const thumb = document.createElement("img");
    thumb.src = src;
    thumb.alt = isEnglish ? "Preview" : "Vista previa";
    if (index === 0) thumb.classList.add("active");
    thumb.addEventListener("click", () => {
      if (modalImg) modalImg.src = src;
      modalThumbs.querySelectorAll("img").forEach((item) => item.classList.remove("active"));
      thumb.classList.add("active");
    });
    modalThumbs.appendChild(thumb);
  });
};

// Abrir modal (delegado para soportar contenido dinámico)
document.addEventListener("click", (event) => {
  const btn = event.target.closest(".open-modal");
  if (!btn) return;
  event.preventDefault();

  const images = parseImagesData(btn.dataset.images);
  const roomData = {
    name: btn.dataset.name,
    price: btn.dataset.price,
    price_month: btn.dataset.priceMonth || null,
    price_year: btn.dataset.priceYear || null,
    img: btn.dataset.img,
    images,
    id: btn.dataset.id || null,
    summary: btn.dataset.summary || ""
  };

  const galleryImages = roomData.images?.length ? roomData.images : (roomData.img ? [roomData.img] : []);
  renderModalGallery(galleryImages);
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
