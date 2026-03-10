/* ================= GALERÍA ================= */
const images = document.querySelectorAll('.gallery-grid img');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const closeBtn = document.querySelector('.lightbox .close');

if (images.length && lightbox && lightboxImg && closeBtn) {
  images.forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightbox.style.display = 'flex';
    });
  });

  closeBtn.addEventListener('click', () => {
    lightbox.style.display = 'none';
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target !== lightboxImg) {
      lightbox.style.display = 'none';
    }
  });
}

/* ================= HERO CAROUSEL ================= */
const heroCarousel = document.querySelector('[data-hero-carousel]');
const headerEl = document.querySelector('.header');

if (heroCarousel) {
  document.body.classList.add('is-home');
}

if (headerEl) {
  const updateHeaderState = () => {
    if (window.scrollY > 24) {
      headerEl.classList.add('is-scrolled');
    } else {
      headerEl.classList.remove('is-scrolled');
    }
  };

  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });
}

if (heroCarousel) {
  const slides = heroCarousel.querySelectorAll('.hero-slide');
  const prevBtn = heroCarousel.querySelector('[data-hero-prev]');
  const nextBtn = heroCarousel.querySelector('[data-hero-next]');
  let index = 0;
  let timerId = null;

  const setActive = (nextIndex) => {
    if (!slides.length) return;
    slides[index].classList.remove('is-active');
    index = (nextIndex + slides.length) % slides.length;
    slides[index].classList.add('is-active');
  };

  const startTimer = () => {
    if (slides.length < 2) return;
    timerId = setInterval(() => setActive(index + 1), 6500);
  };

  const resetTimer = () => {
    if (timerId) clearInterval(timerId);
    startTimer();
  };

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      setActive(index - 1);
      resetTimer();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      setActive(index + 1);
      resetTimer();
    });
  }

  heroCarousel.addEventListener('mouseenter', () => {
    if (timerId) clearInterval(timerId);
  });

  heroCarousel.addEventListener('mouseleave', () => {
    resetTimer();
  });

  startTimer();
}

/* ================= HOME VIDEOS ================= */
const homeVideos = document.querySelectorAll('.home-video');
if (homeVideos.length) {
  homeVideos.forEach((video) => {
    if (!(video instanceof HTMLVideoElement)) return;
    video.muted = true;
    video.playsInline = true;
    video.addEventListener('loadeddata', () => {
      video.classList.add('is-loaded');
    }, { once: true });

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Ignore autoplay restrictions; poster remains visible.
      });
    }
  });
}

/* ================= AVISOS ================= */
const notice = document.getElementById('siteNotice');

if (notice) {
  const rawNotice = localStorage.getItem('luxuryNotice');
  const isEnglish = document.documentElement.lang === 'en';

  if (!rawNotice) {
    notice.hidden = true;
  } else {
    try {
      const data = JSON.parse(rawNotice);
      const isActive = data.status === 'Activo';
      const title = isEnglish && data.titleEn ? data.titleEn : data.title;
      const message = isEnglish && data.messageEn ? data.messageEn : data.message;
      const typeTextMap = {
        Informativo: isEnglish ? 'Info' : 'Informativo',
        Promoción: isEnglish ? 'Promo' : 'Promoción',
        Urgente: isEnglish ? 'Urgent' : 'Urgente'
      };

      if (!isActive || !title || !message) {
        notice.hidden = true;
      } else {
        const tag = notice.querySelector('[data-notice-type]');
        const titleEl = notice.querySelector('[data-notice-title]');
        const messageEl = notice.querySelector('[data-notice-message]');
        const typeClassMap = {
          Informativo: 'notice-info',
          Promoción: 'notice-promo',
          Urgente: 'notice-urgent'
        };

        if (tag) tag.textContent = typeTextMap[data.type] || '';
        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;

        notice.classList.remove('notice-info', 'notice-promo', 'notice-urgent');
        notice.classList.add(typeClassMap[data.type] || 'notice-info');
        notice.hidden = false;
      }
    } catch (error) {
      notice.hidden = true;
    }
  }
}

/* ================= AUDIO BACKGROUND ================= */
const bgm = document.getElementById('bgm');
const audioOverlay = document.getElementById('audioOverlay');

if (bgm && audioOverlay) {
  const audioTriggers = Array.from(document.querySelectorAll('video'));
  let overlayTimer = null;
  let hideTimer = null;

  if (!audioTriggers.length) {
    audioTriggers.push(...document.querySelectorAll('.video-main, .video-side'));
  }

  const events = ['click', 'touchstart', 'play'];
  let audioStarted = false;

  const hideOverlay = () => {
    if (overlayTimer) {
      clearTimeout(overlayTimer);
      overlayTimer = null;
    }
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }

    if (audioOverlay.classList.contains('hidden')) {
      window.dispatchEvent(new Event('audio-overlay-hidden'));
      return;
    }

    audioOverlay.classList.add('is-fading-out');
    hideTimer = setTimeout(() => {
      audioOverlay.classList.add('hidden');
      audioOverlay.classList.remove('is-fading-out');
      hideTimer = null;
      window.dispatchEvent(new Event('audio-overlay-hidden'));
    }, 850);
  };

  const showOverlay = () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    audioOverlay.classList.remove('hidden', 'is-fading-out');
    if (overlayTimer) clearTimeout(overlayTimer);
    overlayTimer = setTimeout(() => {
      hideOverlay();
    }, 4300);
  };

  const removeListeners = () => {
    audioTriggers.forEach((el) => {
      events.forEach((eventName) => {
        el.removeEventListener(eventName, startAudio);
      });
    });
  };

  const startAudio = async () => {
    if (audioStarted) return;
    bgm.muted = false;
    bgm.volume = 0.3;

    try {
      await bgm.play();
      audioStarted = true;
      hideOverlay();
      removeListeners();
    } catch (error) {
      showOverlay();
    }
  };

  const attemptAutoplay = async () => {
    bgm.muted = false;
    bgm.volume = 0.3;

    try {
      await bgm.play();
      audioStarted = true;
      hideOverlay();
      removeListeners();
    } catch (error) {
      showOverlay();
    }
  };

  if (audioTriggers.length) {
    audioTriggers.forEach((el) => {
      events.forEach((eventName) => {
        el.addEventListener(eventName, startAudio);
      });
    });
  }

  attemptAutoplay();
}

/* ================= CAMBIO DE IDIOMA ================= */
const resolveLangTarget = () => {
  const path = window.location.pathname || '/';
  const isEnglishPage = document.documentElement.lang === 'en' || path.startsWith('/eng/');

  if (isEnglishPage) {
    if (path === '/eng/' || path === '/eng/index.html') {
      return { href: '/', shortLabel: 'ES', aria: 'Cambiar a español' };
    }
    if (path.startsWith('/eng/')) {
      return { href: path.replace(/^\/eng/, '') || '/', shortLabel: 'ES', aria: 'Cambiar a español' };
    }
    return { href: '/', shortLabel: 'ES', aria: 'Cambiar a español' };
  }

  if (path === '/' || path === '/index.html') {
    return { href: '/eng/', shortLabel: 'EN', aria: 'Change to English' };
  }

  return { href: `/eng${path.startsWith('/') ? path : `/${path}`}`, shortLabel: 'EN', aria: 'Change to English' };
};

const getOrCreateLangSwitch = () => {
  const existing = document.querySelector('[data-lang-switch]');
  if (existing) return existing;

  const link = document.createElement('a');
  link.className = 'lang-switch';
  link.setAttribute('data-lang-switch', '');
  const label = document.createElement('span');
  label.className = 'lang-switch__label';
  link.appendChild(label);
  document.body.appendChild(link);
  return link;
};

const langSwitch = getOrCreateLangSwitch();
if (langSwitch) {
  const { href, shortLabel, aria } = resolveLangTarget();
  const hasAudioOverlay = typeof audioOverlay !== 'undefined' && Boolean(audioOverlay);

  langSwitch.href = href;
  langSwitch.setAttribute('aria-label', aria);
  langSwitch.querySelectorAll('[data-lang-emoji], .lang-switch__emoji').forEach((node) => node.remove());

  let labelEl = langSwitch.querySelector('.lang-switch__label');
  if (!labelEl) {
    labelEl = document.createElement('span');
    labelEl.className = 'lang-switch__label';
    langSwitch.appendChild(labelEl);
  }
  labelEl.textContent = shortLabel;

  const revealSwitch = () => {
    if (langSwitch.classList.contains('is-visible')) return;
    langSwitch.classList.add('is-visible');
  };

  const scheduleReveal = () => {
    window.setTimeout(revealSwitch, 700);
  };

  if (hasAudioOverlay && !audioOverlay.classList.contains('hidden')) {
    window.addEventListener('audio-overlay-hidden', scheduleReveal, { once: true });
  } else {
    scheduleReveal();
  }
}

/* ================= REVEAL EFFECT ================= */
document.querySelectorAll('.home-cta .cta-button, .service-card, .contact-btn, .location-info, .location-map').forEach((node, index) => {
  if (!node.classList.contains('reveal-on-scroll')) {
    node.classList.add('reveal-on-scroll');
  }
  if (node.matches('.service-card, .contact-btn')) {
    node.style.transitionDelay = `${Math.min(index * 70, 560)}ms`;
  }
});

const revealItems = document.querySelectorAll('.reveal-on-scroll');
if (revealItems.length) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }
}
