(() => {
  const container = document.querySelector("[data-rooms-list]");
  if (!container) return;

  const isEnglish = document.documentElement.lang === "en";
  const detailsLabel = isEnglish ? "View details" : "Ver detalles";
  const priceLabel = isEnglish ? "MXN / night" : "MXN / noche";
  const fallbackSummary = isEnglish
    ? "2 guests · Wi-Fi · King bed"
    : "2 huéspedes · Wi-Fi · Cama King";
  const fallbackImage = "/assets/img/1.jpeg";

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

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms?public=1");
      if (!response.ok) return [];
      const result = await response.json();
      return result?.data || [];
    } catch (error) {
      return [];
    }
  };

  const formatPrice = (value) => {
    const numberValue = Number(value || 0);
    if (!numberValue) return `— ${priceLabel}`;
    return `$${numberValue.toLocaleString()} ${priceLabel}`;
  };

  const buildRoomStore = (rooms) => {
    const store = {};
    rooms.forEach((room) => {
      const roomId = String(room.id || "");
      if (!roomId) return;
      const images = (Array.isArray(room.images) ? room.images : [])
        .map(normalizeImage)
        .filter(Boolean);

      store[roomId] = {
        id: room.id,
        name: room.name || "",
        summary: room.summary || "",
        description: room.description || "",
        price_night: Number(room.price_night || 0),
        price_month: room.price_month,
        price_year: room.price_year,
        images: images.length ? images : [fallbackImage]
      };
    });
    window.__roomsCatalog = store;
  };

  const renderRooms = (rooms) => {
    container.innerHTML = "";
    if (!rooms.length) return;

    buildRoomStore(rooms);

    rooms.forEach((room, roomIndex) => {
      const roomId = String(room.id || "");
      const roomStore = window.__roomsCatalog?.[roomId];
      const carouselImages = roomStore?.images?.length
        ? roomStore.images.slice(0, 5)
        : [fallbackImage];

      const imagesHtml = carouselImages.map((img, imageIndex) => {
        const isFirstVisibleCard = roomIndex < 2 && imageIndex === 0;
        const loadingMode = isFirstVisibleCard ? "eager" : "lazy";
        const fetchPriority = isFirstVisibleCard ? ' fetchpriority="high"' : "";
        const activeClass = imageIndex === 0 ? "active" : "";
        return `<img src="${img}" class="${activeClass}" alt="${room.name || ""}" loading="${loadingMode}" decoding="async"${fetchPriority}>`;
      }).join("");

      const card = document.createElement("div");
      card.className = "room-card";
      card.innerHTML = `
        <div class="room-carousel" data-index="0">
          ${imagesHtml}
          <button class="carousel-btn prev" type="button">‹</button>
          <button class="carousel-btn next" type="button">›</button>
        </div>
        <div class="room-info">
          <h3>${room.name || "—"}</h3>
          <p>${room.summary || fallbackSummary}</p>
          <div class="room-footer">
            <span class="price">${formatPrice(room.price_night)}</span>
            <a
              href="#"
              class="btn open-modal"
              data-id="${roomId}"
            >
              ${detailsLabel}
            </a>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    if (window.initRoomsUI) {
      window.initRoomsUI();
    }
  };

  fetchRooms().then(renderRooms);
})();
