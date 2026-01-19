(() => {
  const container = document.querySelector('[data-rooms-list]');
  if (!container) return;

  const isEnglish = document.documentElement.lang === 'en';
  const detailsLabel = isEnglish ? 'View details' : 'Ver detalles';
  const priceLabel = isEnglish ? 'MXN / night' : 'MXN / noche';
  const fallbackSummary = isEnglish
    ? '2 guests · Wi-Fi · King bed'
    : '2 huéspedes · Wi-Fi · Cama King';
  const fallbackImage = '/assets/img/1.jpeg';

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms?public=1');
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

  const renderRooms = (rooms) => {
    if (!rooms.length) return;
    container.innerHTML = '';

    rooms.forEach((room) => {
      const rawImages = Array.isArray(room.images) ? room.images : [];
      const images = rawImages
        .map((img) => {
          if (!img) return '';
          if (img.startsWith('http') || img.startsWith('/')) return img;
          return `/${img}`;
        })
        .filter(Boolean);
      const carouselImages = images.length ? images : [fallbackImage];
      const firstImage = carouselImages[0];

      const card = document.createElement('div');
      card.className = 'room-card';
      card.innerHTML = `
        <div class="room-carousel" data-index="0">
          ${carouselImages.map((img, index) => (
            `<img src="${img}" class="${index === 0 ? 'active' : ''}" alt="">`
          )).join('')}
          <button class="carousel-btn prev">‹</button>
          <button class="carousel-btn next">›</button>
        </div>
        <div class="room-info">
          <h3>${room.name || '—'}</h3>
          <p>${room.summary || fallbackSummary}</p>
          <div class="room-footer">
            <span class="price">${formatPrice(room.price_night)}</span>
            <a href="#" class="btn open-modal" data-id="${room.id || ''}" data-name="${room.name || ''}" data-summary="${room.summary || ''}" data-price="${room.price_night || 0}" data-price-month="${room.price_month || 0}" data-price-year="${room.price_year || 0}" data-img="${firstImage}">
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
