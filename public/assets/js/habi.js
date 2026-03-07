const modal = document.getElementById("roomModal");
const closeModal = document.getElementById("closeModal");
const modalImg = document.getElementById("modalMainImg");
const modalPrevBtn = document.getElementById("modalPrevBtn");
const modalNextBtn = document.getElementById("modalNextBtn");
const modalThumbsWrap = document.getElementById("modalThumbsWrap");
const modalThumbs = document.getElementById("modalThumbs");
const modalThumbsMore = document.getElementById("modalThumbsMore");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalPrice = document.getElementById("modalPrice");
const modalReservar = document.getElementById("modalReservar");

const isEnglish = document.documentElement.lang === "en";
const priceUnit = isEnglish ? "MXN / night" : "MXN / noche";
const fallbackDescription = isEnglish
  ? "Cozy apartment with complete amenities."
  : "Departamento cómodo con amenidades completas.";
const previewChunkSize = 5;

let currentGalleryImages = [];
let renderedThumbCount = 0;
let currentGalleryIndex = 0;

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

const normalizeImage = (src) => {
  if (!src) return "";
  const value = String(src).trim();
  if (!value) return "";
  if (
    value.startsWith("http://")
    || value.startsWith("https://")
    || value.startsWith("/")
    || value.startsWith("data:")
    || value.startsWith("blob:")
  ) {
    return value;
  }
  return `/${value.replace(/^\/+/, "")}`;
};

const getRoomFromStore = (roomId) => {
  if (!roomId) return null;
  const store = window.__roomsCatalog;
  if (!store || typeof store !== "object") return null;
  return store[roomId] || null;
};

const setActiveThumb = (index) => {
  if (!modalThumbs) return;
  modalThumbs.querySelectorAll(".modal-thumb").forEach((thumb, thumbIndex) => {
    thumb.classList.toggle("active", thumbIndex === index);
  });
};

const setModalNavVisibility = () => {
  const showNav = currentGalleryImages.length > 1;
  if (modalPrevBtn) modalPrevBtn.hidden = !showNav;
  if (modalNextBtn) modalNextBtn.hidden = !showNav;
};

const createFallbackThumb = () => {
  const fallback = document.createElement("span");
  fallback.className = "modal-thumb__fallback";
  fallback.setAttribute("aria-hidden", "true");
  fallback.textContent = "IMG";
  return fallback;
};

const createThumb = (src, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "modal-thumb";
  if (index === 0) button.classList.add("active");

  const image = document.createElement("img");
  image.src = src;
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";

  image.addEventListener("error", () => {
    button.classList.add("is-fallback");
    image.remove();
    if (!button.querySelector(".modal-thumb__fallback")) {
      button.appendChild(createFallbackThumb());
    }
  });

  button.appendChild(image);
  button.addEventListener("click", () => {
    setModalImageByIndex(index);
  });
  return button;
};

const appendThumbs = (start, end) => {
  if (!modalThumbs) return;
  for (let index = start; index < end; index += 1) {
    const src = currentGalleryImages[index];
    if (!src) continue;
    modalThumbs.appendChild(createThumb(src, index));
  }
};

const ensureThumbRendered = (index) => {
  if (!modalThumbs || index < renderedThumbCount) return;
  const nextCount = Math.min(index + 1, currentGalleryImages.length);
  appendThumbs(renderedThumbCount, nextCount);
  renderedThumbCount = nextCount;
  if (modalThumbsMore) {
    modalThumbsMore.hidden = renderedThumbCount >= currentGalleryImages.length;
  }
};

const preloadNeighbors = (index) => {
  [1, 2, -1, -2].forEach((offset) => {
    const src = currentGalleryImages[index + offset];
    if (!src) return;
    const image = new Image();
    image.src = src;
  });
};

const setModalImageSource = (src) => {
  if (!modalImg) return;
  modalImg.classList.remove("is-visible");
  modalImg.src = src;

  const revealImage = () => {
    modalImg.classList.add("is-visible");
  };

  if (modalImg.complete) {
    requestAnimationFrame(revealImage);
    return;
  }

  modalImg.addEventListener("load", revealImage, { once: true });
  modalImg.addEventListener("error", revealImage, { once: true });
};

const setModalImageByIndex = (nextIndex) => {
  if (!modalImg || !currentGalleryImages.length) return;
  const total = currentGalleryImages.length;
  const safeIndex = ((nextIndex % total) + total) % total;
  currentGalleryIndex = safeIndex;
  setModalImageSource(currentGalleryImages[safeIndex]);
  ensureThumbRendered(safeIndex);
  setActiveThumb(safeIndex);
  preloadNeighbors(safeIndex);
};

const renderModalThumbs = () => {
  if (!modalThumbs || !modalThumbsWrap) return;
  modalThumbs.innerHTML = "";
  renderedThumbCount = 0;

  if (currentGalleryImages.length <= 1) {
    modalThumbsWrap.hidden = true;
    if (modalThumbsMore) modalThumbsMore.hidden = true;
    setModalNavVisibility();
    return;
  }

  modalThumbsWrap.hidden = false;
  const initialCount = Math.min(previewChunkSize, currentGalleryImages.length);
  appendThumbs(0, initialCount);
  renderedThumbCount = initialCount;

  if (modalThumbsMore) {
    modalThumbsMore.hidden = renderedThumbCount >= currentGalleryImages.length;
  }
  setModalNavVisibility();
};

const renderModalGallery = (images) => {
  currentGalleryImages = (images || []).map(normalizeImage).filter(Boolean);
  currentGalleryIndex = 0;

  if (!currentGalleryImages.length) {
    if (modalImg) {
      modalImg.classList.remove("is-visible");
      modalImg.removeAttribute("src");
    }
    if (modalThumbs) modalThumbs.innerHTML = "";
    if (modalThumbsWrap) modalThumbsWrap.hidden = true;
    if (modalThumbsMore) modalThumbsMore.hidden = true;
    setModalNavVisibility();
    return;
  }

  if (modalImg) {
    modalImg.loading = "eager";
    modalImg.decoding = "async";
  }

  renderModalThumbs();
  setModalImageByIndex(0);
};

const parseMoney = (value) => {
  const numberValue = Number(value || 0);
  if (!Number.isFinite(numberValue)) return 0;
  return numberValue;
};

const formatModalPrice = (value) => {
  const numberValue = parseMoney(value);
  if (!numberValue) return `— ${priceUnit}`;
  return `$${numberValue.toLocaleString()} ${priceUnit}`;
};

const setModalDescription = (description, summary) => {
  if (!modalDescription) return;
  const text = String(description || "").trim() || String(summary || "").trim() || fallbackDescription;
  modalDescription.textContent = text;
};

const getRoomDataFromButton = (button) => {
  const roomId = button.dataset.id || null;
  const roomFromStore = getRoomFromStore(roomId);
  const storeImages = Array.isArray(roomFromStore?.images) ? roomFromStore.images : [];
  const parsedDatasetImages = parseImagesData(button.dataset.images);
  const galleryImages = (storeImages.length ? storeImages : parsedDatasetImages)
    .map(normalizeImage)
    .filter(Boolean);

  return {
    id: roomId,
    name: roomFromStore?.name || button.dataset.name || "",
    summary: roomFromStore?.summary || button.dataset.summary || "",
    description: roomFromStore?.description || button.dataset.description || "",
    price: roomFromStore?.price_night ?? button.dataset.price ?? 0,
    price_month: roomFromStore?.price_month ?? button.dataset.priceMonth ?? null,
    price_year: roomFromStore?.price_year ?? button.dataset.priceYear ?? null,
    img: galleryImages[0] || normalizeImage(button.dataset.img),
    images: galleryImages
  };
};

if (modalThumbsMore) {
  modalThumbsMore.addEventListener("click", () => {
    if (renderedThumbCount >= currentGalleryImages.length) return;
    appendThumbs(renderedThumbCount, currentGalleryImages.length);
    renderedThumbCount = currentGalleryImages.length;
    modalThumbsMore.hidden = true;
    setActiveThumb(currentGalleryIndex);
  });
}

if (modalPrevBtn) {
  modalPrevBtn.addEventListener("click", () => {
    setModalImageByIndex(currentGalleryIndex - 1);
  });
}

if (modalNextBtn) {
  modalNextBtn.addEventListener("click", () => {
    setModalImageByIndex(currentGalleryIndex + 1);
  });
}

// Abrir modal (delegado para soportar contenido dinámico)
document.addEventListener("click", (event) => {
  const btn = event.target.closest(".open-modal");
  if (!btn || !modal) return;
  event.preventDefault();

  const roomData = getRoomDataFromButton(btn);
  const galleryImages = roomData.images?.length ? roomData.images : (roomData.img ? [roomData.img] : []);

  renderModalGallery(galleryImages);
  if (modalTitle) modalTitle.textContent = roomData.name || "—";
  if (modalPrice) modalPrice.textContent = formatModalPrice(roomData.price);
  setModalDescription(roomData.description, roomData.summary);

  if (modalReservar) {
    modalReservar.dataset.room = JSON.stringify(roomData);
  }

  modal.classList.add("active");
});

if (modalReservar) {
  modalReservar.addEventListener("click", () => {
    const rawData = modalReservar.dataset.room;
    if (!rawData) return;
    try {
      const roomData = JSON.parse(rawData);
      localStorage.setItem("selectedRoom", JSON.stringify(roomData));
    } catch (error) {
      // Ignore malformed data
    }
  });
}

if (closeModal && modal) {
  closeModal.addEventListener("click", () => {
    modal.classList.remove("active");
  });
}

if (modal) {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.classList.remove("active");
  });
}

document.addEventListener("keydown", (event) => {
  if (!modal || !modal.classList.contains("active")) return;
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    setModalImageByIndex(currentGalleryIndex - 1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    setModalImageByIndex(currentGalleryIndex + 1);
  } else if (event.key === "Escape") {
    modal.classList.remove("active");
  }
});

const initCarousels = (root = document) => {
  root.querySelectorAll(".room-carousel").forEach((carousel) => {
    if (carousel.dataset.initialized === "true") return;

    const images = carousel.querySelectorAll("img");
    const nextBtn = carousel.querySelector(".next");
    const prevBtn = carousel.querySelector(".prev");

    if (!images.length || !nextBtn || !prevBtn) return;

    if (images.length < 2) {
      nextBtn.hidden = true;
      prevBtn.hidden = true;
    }

    let index = 0;
    images.forEach((img) => img.classList.remove("active"));
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
