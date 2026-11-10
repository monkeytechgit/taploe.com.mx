(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('has-anim');
  const boot = () => root.classList.remove('anim-boot');
  if (reduce) boot();

  // ---------- Header: compact + shadow on scroll ----------
  const header = document.querySelector('.site-header');
  const toTop = document.createElement('button');
  toTop.type = 'button';
  toTop.className = 'to-top';
  toTop.setAttribute('aria-label', 'Volver arriba');
  toTop.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>';
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
  document.body.appendChild(toTop);

  let ticking = false;
  const parallax = reduce ? [] : Array.from(document.querySelectorAll(
    '.hero-media img, .hero-visual img, .digital-hero__media img, .blog-featured__media img, .post-cover img, [data-parallax]'
  ));
  const onScroll = () => {
    const y = window.scrollY;
    header?.classList.toggle('is-scrolled', y > 12);
    toTop.classList.toggle('is-visible', y > 700);
    parallax.forEach((img) => {
      const rect = img.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -0.05;
      img.style.setProperty('--parallax', `${offset.toFixed(1)}px`);
    });
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  // ---------- Images fade in as they load ----------
  document.querySelectorAll('main img').forEach((img) => {
    if (img.complete && img.naturalWidth) return;
    img.classList.add('img-fade');
    const done = () => img.classList.add('is-loaded');
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });

  if (reduce) return;
  window.addEventListener('pageshow', (event) => { if (event.persisted) boot(); });

  // ---------- Scroll reveal ----------
  const GROUPS = [
    '.shop-grid', '.blog-posts', '.blog-trending', '.steps-grid', '.faq-grid', '.faq-column', '.pdp-trust',
    '.pdp-packs', '.pdp-designs', '.pdp-checks', '.video-showcase__grid', '.product-grid', '.related-products__grid',
    '.digital-feature-grid', '.digital-process__grid', '.pricing-grid', '.post-stats', '.footer-grid', '.blog-chips',
    '.shop-chips', '.pdp-ideal ul', '.pdp-acc', '.post-faq', '.blog-faq', '.brand-benefits', '.logo-row', '.trust-logos'
  ];
  const SINGLES = [
    'main h1', 'main h2', 'main .section-heading', 'main .blog-featured', 'main .post-cover', 'main .post-body > *',
    'main .pdp-guide__inner > *', 'main .blog-banner', 'main .post-cta', 'main .pdp-custom', 'main .pdp-promo',
    'main .pdp-divider', 'main .pdp-buy', 'main .catalog-heading', 'main .shop-toolbar', 'main .blog-list-head',
    'main section .container > *'
  ];
  const marked = new Set();
  const mark = (el, delay = 0, kind = 'up') => {
    if (marked.has(el) || el.closest('.promo-marquee, .site-header, dialog, .post-aside')) return;
    for (const m of marked) { if (m.contains(el) || el.contains(m)) return; }
    el.dataset.reveal = kind;
    el.style.setProperty('--reveal-delay', `${delay}ms`);
    marked.add(el);
  };
  GROUPS.forEach((sel) => document.querySelectorAll(sel).forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      if (child.matches('script, template, [hidden]')) return;
      mark(child, Math.min(i, 8) * 80, group.matches('.pdp-packs, .pdp-checks, .pdp-ideal ul') ? 'left' : 'up');
    });
  }));
  SINGLES.forEach((sel) => document.querySelectorAll(sel).forEach((el) => mark(el)));

  const vh = window.innerHeight;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-revealed');
      observer.unobserve(el);
      const delay = parseInt(el.style.getPropertyValue('--reveal-delay'), 10) || 0;
      setTimeout(() => el.classList.remove('reveal-pending', 'is-revealed'), 800 + delay);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  marked.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < vh * 0.92 && rect.bottom > 0) {
      // already on screen at load: animate in right away (staggered), no hidden flash
      el.classList.add('is-revealed', 'is-instant');
      return;
    }
    el.classList.add('reveal-pending');
    observer.observe(el);
  });
  requestAnimationFrame(boot);

  // ---------- Count-up numbers ----------
  const counters = document.querySelectorAll('.post-stats b, [data-count]');
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      countObserver.unobserve(entry.target);
      const el = entry.target;
      const match = el.textContent.match(/^(\D*)([\d.,]+)(.*)$/);
      if (!match) return;
      const target = parseFloat(match[2].replace(/,/g, ''));
      const decimals = (match[2].split('.')[1] || '').length;
      const start = performance.now();
      const dur = 1200;
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = match[1] + (target * eased).toLocaleString('es-MX', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + match[3];
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  counters.forEach((el) => countObserver.observe(el));

  // ---------- Button ripple ----------
  const RIPPLE = '.button, .product-submit, .pdp-buynow, .shop-chip, .blog-more button, .pdp-help-btn, .post-cta a, .post-promo a, .blog-banner a, .pdp-arrow, .pdp-qty button';
  document.addEventListener('pointerdown', (event) => {
    const target = event.target.closest(RIPPLE);
    if (!target) return;
    target.classList.add('has-ripple');
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.6;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    target.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });

  // ---------- 3D tilt on product media ----------
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.shop-card__media, .blog-featured, .video-showcase__media').forEach((card) => {
      card.classList.add('tilt');
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--rx', `${(-y * 5).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${(x * 6).toFixed(2)}deg`);
        card.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
        card.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  // ---------- Smooth accordions ----------
  document.querySelectorAll('.pdp-acc details, details.faq-item, .product-accordion').forEach((details) => {
    const summary = details.querySelector('summary');
    if (!summary) return;
    let anim = null;
    summary.addEventListener('click', (event) => {
      event.preventDefault();
      if (anim) anim.cancel();
      const startH = details.offsetHeight;
      const closing = details.open;
      if (!closing) details.open = true;
      const endH = closing ? summary.offsetHeight : details.scrollHeight;
      details.style.overflow = 'hidden';
      anim = details.animate({ height: [`${startH}px`, `${endH}px`] }, { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
      anim.onfinish = () => {
        if (closing) details.open = false;
        details.style.overflow = '';
        anim = null;
      };
      anim.oncancel = () => { details.style.overflow = ''; };
    });
  });

  // ---------- Price bump when it changes ----------
  const prices = document.querySelectorAll('[data-product-price-display], [data-product-compare-display], [data-save-label], [data-shop-count], [data-blog-count]');
  if (prices.length && 'MutationObserver' in window) {
    const bump = new MutationObserver((mutations) => {
      const targets = new Set(mutations.map((m) => (m.target.nodeType === 1 ? m.target : m.target.parentElement)));
      targets.forEach((el) => {
        if (!el) return;
        el.classList.remove('is-bump');
        void el.offsetWidth;
        el.classList.add('is-bump');
      });
    });
    prices.forEach((el) => bump.observe(el, { childList: true, characterData: true, subtree: true }));
  }

  // ---------- Re-animate cards shown again by filters ----------
  const refilter = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      const el = m.target;
      if (m.attributeName === 'hidden' && !el.hidden && el.matches('.shop-card, .post-card')) {
        el.classList.remove('is-filtered-in');
        void el.offsetWidth;
        el.classList.add('is-filtered-in');
      }
    });
  });
  document.querySelectorAll('.shop-card, .post-card').forEach((el) => refilter.observe(el, { attributes: true, attributeFilter: ['hidden'] }));
})();
