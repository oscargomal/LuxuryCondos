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
const langSwitch = document.querySelector('[data-lang-switch]');
if (langSwitch) {
  const scrollThreshold = 76;
  const emojiEl = langSwitch.querySelector('[data-lang-emoji]');
  const globeEmoji = langSwitch.dataset.emojiGlobe || '🌐';
  const flagEmoji = langSwitch.dataset.emojiFlag || '🇺🇸';
  const hasAudioOverlay = typeof audioOverlay !== 'undefined' && Boolean(audioOverlay);
  let isAudioReady = !hasAudioOverlay || audioOverlay.classList.contains('hidden');
  let isScrollReady = window.scrollY > scrollThreshold;

  const revealSwitch = () => {
    if (langSwitch.classList.contains('is-visible')) return;
    langSwitch.classList.add('is-visible');
    if (emojiEl) emojiEl.textContent = globeEmoji;

    setTimeout(() => {
      langSwitch.classList.add('is-collapsed');
      if (emojiEl) emojiEl.textContent = flagEmoji;
    }, 3200);
  };

  const tryRevealSwitch = () => {
    if (!isAudioReady || !isScrollReady) return;
    revealSwitch();
  };

  const onScrollReveal = () => {
    if (isScrollReady) return;
    if (window.scrollY > scrollThreshold) {
      isScrollReady = true;
      tryRevealSwitch();
    }
  };

  window.addEventListener('scroll', onScrollReveal, { passive: true });

  if (hasAudioOverlay && !isAudioReady) {
    window.addEventListener('audio-overlay-hidden', () => {
      isAudioReady = true;
      tryRevealSwitch();
    }, { once: true });
  } else {
    isAudioReady = true;
  }

  if (isScrollReady) {
    tryRevealSwitch();
  }
}

/* ================= REVEAL EFFECT ================= */
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
