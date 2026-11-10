(() => {
  const market = document.documentElement.dataset.market || window.TaploeEcommerce?.market || 'mx';
  const locale = document.documentElement.dataset.locale || window.TaploeEcommerce?.locale || 'es-MX';
  const labels = { viewCart: 'Abrir carrito' };
  const cartKey = window.TaploeEcommerce?.cartStorageKey || `taploeCart:${market}`;
  const appLoginUrl = window.TaploeEcommerce?.appLoginUrl || `https://app.taploe.com/login?locale=${locale}`;

  const setupProductHoverMenus = () => {
    document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
      let closeTimer;
      const open = () => {
        clearTimeout(closeTimer);
        dropdown.classList.add('is-open');
      };
      const close = () => {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => dropdown.classList.remove('is-open'), 140);
      };
      dropdown.addEventListener('pointerenter', open);
      dropdown.addEventListener('pointerleave', close);
      dropdown.addEventListener('focusin', open);
      dropdown.addEventListener('focusout', close);
    });
  };

  setupProductHoverMenus();

  // Lazy product videos: load and play muted only while visible.
  const lazyVideos = document.querySelectorAll('video[data-lazy-video]');
  const loadVideo = (video) => {
    if (!video.src && video.dataset.src) {
      video.src = video.dataset.src;
      video.preload = 'auto';
    }
  };
  const playVideo = (video) => {
    loadVideo(video);
    video.muted = true;
    const attempt = video.play();
    if (attempt) attempt.catch(() => {});
  };
  if (lazyVideos.length) {
    if ('IntersectionObserver' in window) {
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            if (!video.dataset.userPaused) playVideo(video);
          } else if (!video.paused) {
            video.dataset.autoPaused = '1';
            video.pause();
          }
        });
      }, { threshold: 0.35 });
      lazyVideos.forEach((video) => {
        videoObserver.observe(video);
        video.addEventListener('pause', () => {
          if (!video.dataset.autoPaused) video.dataset.userPaused = '1';
          delete video.dataset.autoPaused;
        });
        video.addEventListener('play', () => { delete video.dataset.userPaused; });
      });
    } else {
      lazyVideos.forEach(playVideo);
    }
    // If the user presses play before the video was loaded.
    lazyVideos.forEach((video) => video.addEventListener('click', () => loadVideo(video), { once: true }));
  }

  document.querySelectorAll('a[href="iniciar-sesion.html"], a[href="login.html"]').forEach((link) => {
    link.href = appLoginUrl;
  });

  const readCartCount = () => {
    try {
      return JSON.parse(localStorage.getItem(cartKey) || '[]').reduce((sum, item) => sum + Number(item.quantity || 1), 0);
    } catch {
      return 0;
    }
  };
  const updateCartBadges = () => {
    const count = readCartCount();
    document.querySelectorAll('[data-cart-count]').forEach((badge) => {
      badge.textContent = String(count);
      badge.hidden = count === 0;
    });
  };
  const cartButton = () => {
    const button = document.createElement('button');
    button.className = 'cart-nav-button';
    button.type = 'button';
    button.setAttribute('aria-label', labels.viewCart);
    button.setAttribute('data-cart-open', '');
    button.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.2 6h15l-1.9 8.2a2 2 0 0 1-2 1.6H8.1a2 2 0 0 1-2-1.7L4.7 3.8H2.8"/>
        <path d="M9.2 20.2h.1M17.4 20.2h.1"/>
      </svg>
      <span class="sr-only">${labels.viewCart}</span>
      <b data-cart-count hidden>0</b>
    `;
    return button;
  };
  const headerActions = document.querySelector('.header-actions');
  if (headerActions && !headerActions.querySelector('.cart-nav-button')) {
    const menuButton = headerActions.querySelector('.menu-toggle');
    headerActions.insertBefore(cartButton(), menuButton || null);
  }
  const mobileNavInner = document.querySelector('.mobile-nav__inner');
  if (mobileNavInner && !mobileNavInner.querySelector('.cart-nav-button--mobile')) {
    const link = cartButton();
    link.classList.add('cart-nav-button--mobile');
    const loginLink = mobileNavInner.querySelector(`a[href="${appLoginUrl}"], a[href="iniciar-sesion.html"], a[href="login.html"]`);
    mobileNavInner.insertBefore(link, loginLink || null);
  }
  updateCartBadges();
  window.addEventListener('storage', updateCartBadges);
  window.addEventListener('taploe:cart-updated', updateCartBadges);

  const menuButton = document.querySelector(".menu-toggle");
  const mobileNav = document.querySelector("#mobile-navigation, .mobile-nav");

  if (!menuButton || !mobileNav) return;

  const closeMenu = () => {
    menuButton.setAttribute("aria-expanded", "false");
    mobileNav.classList.remove("is-open");
    document.body.classList.remove("menu-is-open");
  };

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    mobileNav.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-is-open", !isOpen);
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
})();
