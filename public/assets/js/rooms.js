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
  const detailsFallback = isEnglish
    ? ["2 guests", "King bed", "Wi-Fi", "Balcony"]
    : ["2 huéspedes", "Cama King", "Wi-Fi", "Balcón"];

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

  const pickLocalizedSummary = (value) => {
    const summary = String(value || "").trim();
    if (!summary) return fallbackSummary;
    if (!summary.includes("/")) return summary;
    const parts = summary.split("/").map((part) => part.trim()).filter(Boolean);
    if (parts.length < 2) return summary;
    return isEnglish ? parts[parts.length - 1] : parts[0];
  };

  const extractAttributes = (rawSummary) => {
    const summary = pickLocalizedSummary(rawSummary);
    const attributes = [];

    const guestsMatch = summary.match(/\d+\s*(?:hu[eé]spedes?|guests?)/i);
    const bedsMatch = summary.match(/\d+\s*(?:camas?|beds?)/i);
    const bedTypeMatch = summary.match(/(?:cama|bed)\s*(?:king|queen)|(?:king|queen)\s*(?:size|bed)/i);
    const balconyMatch = summary.match(/balc[oó]n|balcony/i);
    const wifiMatch = summary.match(/wi-?fi|internet/i);

    if (guestsMatch) attributes.push(guestsMatch[0]);
    if (bedsMatch) attributes.push(bedsMatch[0]);
    if (bedTypeMatch) attributes.push(bedTypeMatch[0]);
    if (balconyMatch) attributes.push(isEnglish ? "Balcony" : "Balcón");
    if (wifiMatch) attributes.push("Wi-Fi");

    if (attributes.length >= 3) {
      return [...new Set(attributes)].slice(0, 4);
    }

    const splitFallback = summary
      .split(/(?:\s*[·|,]\s*|\s+-\s+)/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (splitFallback.length) {
      return [...new Set(splitFallback)].slice(0, 4);
    }

    return detailsFallback.slice(0, 4);
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

      const attributes = extractAttributes(room.summary || fallbackSummary);
      const attributesHtml = attributes
        .map((item) => `<li>${item}</li>`)
        .join("");

      const card = document.createElement("div");
      card.className = "room-card is-reveal";
      card.style.animationDelay = `${Math.min(roomIndex * 60, 360)}ms`;
      card.innerHTML = `
        <div class="room-carousel" data-index="0">
          ${imagesHtml}
          <button class="carousel-btn prev" type="button">‹</button>
          <button class="carousel-btn next" type="button">›</button>
        </div>
        <div class="room-info">
          <h3>${room.name || "—"}</h3>
          <ul class="room-attrs">${attributesHtml}</ul>
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

      card.querySelectorAll("img").forEach((image) => {
        const markAsLoaded = () => image.classList.add("is-loaded");
        if (image.complete) {
          markAsLoaded();
        } else {
          image.addEventListener("load", markAsLoaded, { once: true });
          image.addEventListener("error", markAsLoaded, { once: true });
        }
      });

      container.appendChild(card);
    });

    if (window.initRoomsUI) {
      window.initRoomsUI();
    }
  };

  fetchRooms().then(renderRooms);
})();
