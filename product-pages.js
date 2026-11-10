(() => {
  const gallery = document.querySelector('[data-gallery]');
  const selectGalleryButton = (button) => {
    if (!gallery || !button) return;
    const stage = gallery.querySelector('[data-gallery-stage]');
    if (!stage) return;
    const current = gallery.querySelector('[data-gallery-main]');
    const source = button.dataset.galleryVideo || button.dataset.galleryImage;
    if (!source) return;

    if (button.dataset.galleryVideo) {
      const video = document.createElement('video');
      video.className = 'product-gallery__main product-gallery__video';
      video.setAttribute('data-gallery-main', '');
      video.src = source;
      if (button.dataset.galleryPoster) video.poster = button.dataset.galleryPoster;
      video.playsInline = true;
      video.controls = true;
      video.preload = 'auto';
      video.muted = false;
      video.volume = 1;
      video.setAttribute('aria-label', button.dataset.galleryAlt || '');
      if (current) {
        current.replaceWith(video);
      } else {
        stage.appendChild(video);
      }
      const playAttempt = video.play();
      if (playAttempt) playAttempt.catch(() => {});
    } else {
      const image = document.createElement('img');
      image.className = 'product-gallery__main';
      image.setAttribute('data-gallery-main', '');
      image.src = source;
      image.alt = button.dataset.galleryAlt || '';
      if (current) {
        current.replaceWith(image);
      } else {
        stage.appendChild(image);
      }
    }

    gallery.querySelectorAll('[data-gallery-image], [data-gallery-video]').forEach((item) => item.setAttribute('aria-current', 'false'));
    button.setAttribute('aria-current', 'true');
  };
  if (gallery) {
    const thumbs = () => Array.from(gallery.querySelectorAll('[data-gallery-image], [data-gallery-video]'));
    thumbs().forEach((button) => {
      button.addEventListener('click', () => selectGalleryButton(button));
    });
    const step = (dir) => {
      const list = thumbs();
      if (!list.length) return;
      const index = Math.max(0, list.findIndex((item) => item.getAttribute('aria-current') === 'true'));
      const next = list[(index + dir + list.length) % list.length];
      selectGalleryButton(next);
      next.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    };
    gallery.querySelector('[data-gallery-prev]')?.addEventListener('click', () => step(-1));
    gallery.querySelector('[data-gallery-next]')?.addEventListener('click', () => step(1));
    const stage = gallery.querySelector('[data-gallery-stage]');
    let touchX = null;
    stage?.addEventListener('touchstart', (event) => { touchX = event.touches[0].clientX; }, { passive: true });
    stage?.addEventListener('touchend', (event) => {
      if (touchX === null) return;
      const delta = event.changedTouches[0].clientX - touchX;
      if (Math.abs(delta) > 45 && !gallery.querySelector('video[data-gallery-main]')) step(delta < 0 ? 1 : -1);
      touchX = null;
    });
    const zoom = gallery.querySelector('[data-gallery-zoom]');
    const lightbox = document.querySelector('[data-gallery-lightbox]');
    if (zoom && lightbox && typeof lightbox.showModal === 'function') {
      const lightboxImage = lightbox.querySelector('img');
      zoom.addEventListener('click', () => {
        const current = gallery.querySelector('[data-gallery-main]');
        if (!current || current.tagName === 'VIDEO') return;
        lightboxImage.src = current.currentSrc || current.src;
        lightboxImage.alt = current.alt || '';
        lightbox.showModal();
      });
      lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox || event.target.closest('[data-lightbox-close]')) lightbox.close();
      });
    }
  }

  const configurator = document.querySelector('[data-product-configurator]');
  if (!configurator) return;

  const ecommerce = window.TaploeEcommerce || {};
  const market = ecommerce.market || document.documentElement.dataset.market || 'mx';
  const locale = ecommerce.locale || document.documentElement.dataset.locale || 'es-MX';
  const currency = ecommerce.currency || 'MXN';
  const productCatalog = ecommerce.products || {};
  const cartKey = ecommerce.cartStorageKey || `taploeCart:${market}`;
  const labels = {
    added: 'Agregado al carrito ✓',
    adding: 'Agregando...',
    fileTooLarge: 'El archivo supera el máximo de 10 MB.',
    logoRequired: 'Carga tu logotipo para continuar con el diseño personalizado.',
    selectedFileAlt: 'Archivo de logotipo seleccionado',
    cartStatus: (product) => `${product} se agregó al carrito.`
  };
  const money = (value) => '$' + new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value || 0)) + ' ' + currency;
  const form = configurator.querySelector('[data-product-form]');
  const uploadPanel = configurator.querySelector('[data-upload-panel]');
  const designInputs = configurator.querySelectorAll('input[name="design"]');
  const dropzone = configurator.querySelector('[data-dropzone]');
  const fileInput = configurator.querySelector('[data-logo-input]');
  const preview = configurator.querySelector('[data-upload-preview]');
  const previewImage = configurator.querySelector('[data-upload-image]');
  const previewName = configurator.querySelector('[data-upload-name]');
  const previewSize = configurator.querySelector('[data-upload-size]');
  const removeUpload = configurator.querySelector('[data-upload-remove]');
  const quantityInput = configurator.querySelector('[data-quantity]');
  const reviewLinkInput = configurator.querySelector('[data-review-link]');
  const packageInputs = configurator.querySelectorAll('[data-package-option]');
  const priceDisplays = document.querySelectorAll('[data-product-price-display]');
  const compareDisplays = document.querySelectorAll('[data-product-compare-display]');
  const saveDisplays = document.querySelectorAll('[data-product-save-display]');
  const buyNow = configurator.querySelector('[data-buy-now]');
  const minus = configurator.querySelector('[data-quantity-minus]');
  const plus = configurator.querySelector('[data-quantity-plus]');
  const status = configurator.querySelector('[data-form-status]');
  const submit = configurator.querySelector('.product-submit');
  const mainImage = document.querySelector('[data-gallery] [data-gallery-image]');
  const showCartLoading = () => {
    let loader = document.querySelector('[data-cart-loading]');
    if (!loader) {
      loader = document.createElement('div');
      loader.className = 'cart-loading';
      loader.setAttribute('data-cart-loading', '');
      loader.setAttribute('role', 'status');
      loader.setAttribute('aria-live', 'polite');
      loader.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 8h12l1 13H5L6 8Z"/>
          <path d="M9 8V6a3 3 0 0 1 6 0v2"/>
        </svg>
        <span class="sr-only">${labels.adding}</span>
        <i></i><i></i><i></i>
      `;
      document.body.appendChild(loader);
    }
    requestAnimationFrame(() => loader.classList.add('is-visible'));
    return () => {
      loader.classList.remove('is-visible');
      setTimeout(() => {
        if (!loader.classList.contains('is-visible')) loader.remove();
      }, 260);
    };
  };

  const selectedValue = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || '';
  const selectedPackage = () => form.querySelector('[data-package-option]:checked');
  const productCode = configurator.dataset.productCode;
  const productConfig = productCatalog[productCode] || {};
  const openLogoDb = () => new Promise((resolve, reject) => {
    const request = indexedDB.open('taploe-ecommerce', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('logos');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const saveLogoFile = async (id, file) => {
    if (!file) return;
    const db = await openLogoDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction('logos', 'readwrite');
      tx.objectStore('logos').put(file, id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  };

  const parseReviewLinks = (value) => (value || '')
    .split(',')
    .map((link) => link.trim())
    .filter(Boolean);

  const updateDesign = () => {
    const custom = selectedValue('design') === 'custom';
    if (uploadPanel) uploadPanel.classList.toggle('is-visible', custom);
    if (custom) selectGalleryButton(gallery?.querySelector('[data-custom-logo-reference]'));
    if (!custom) selectGalleryButton(gallery?.querySelector('[data-gallery-image], [data-gallery-video]'));
  };
  designInputs.forEach((input) => input.addEventListener('change', updateDesign));
  if (designInputs.length) updateDesign();

  const clearFile = () => {
    if (fileInput) fileInput.value = '';
    if (preview) preview.classList.remove('is-visible');
    if (previewImage) previewImage.removeAttribute('src');
  };

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      if (status) status.textContent = labels.fileTooLarge;
      clearFile();
      return;
    }
    if (previewName) previewName.textContent = file.name;
    if (previewSize) previewSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
    if (preview) preview.classList.add('is-visible');
    if (file.type.startsWith('image/') && previewImage) {
      const reader = new FileReader();
      reader.onload = (event) => { previewImage.src = event.target.result; };
      reader.readAsDataURL(file);
    } else if (previewImage) {
      previewImage.removeAttribute('src');
      previewImage.alt = labels.selectedFileAlt;
    }
    if (status) status.textContent = '';
  };

  if (fileInput) fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));
  if (dropzone) {
    ['dragenter', 'dragover'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add('is-dragover');
    }));
    ['dragleave', 'drop'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove('is-dragover');
    }));
    dropzone.addEventListener('drop', (event) => {
      const file = event.dataTransfer.files[0];
      if (fileInput && file) {
        const transfer = new DataTransfer();
        transfer.items.add(file);
        fileInput.files = transfer.files;
      }
      handleFile(file);
    });
  }
  if (removeUpload) removeUpload.addEventListener('click', clearFile);

  const clampQuantity = (value) => Math.min(99, Math.max(1, Number(value) || 1));
  const setQuantity = (value) => {
    if (!quantityInput) return;
    quantityInput.value = clampQuantity(value);
    updatePrice();
  };
  if (minus) minus.addEventListener('click', () => setQuantity(Number(quantityInput.value) - 1));
  if (plus) plus.addEventListener('click', () => setQuantity(Number(quantityInput.value) + 1));
  if (quantityInput) quantityInput.addEventListener('change', () => setQuantity(quantityInput.value));

  const getPackageConfig = () => {
    const input = selectedPackage();
    if (!input) return null;
    const key = input.value;
    const catalogPackage = productConfig.packages?.[key] || {};
    return {
      key,
      label: input.dataset.packageLabel || '',
      quantity: Number(catalogPackage.quantity || input.dataset.packageQuantity),
      unitPrice: Number(catalogPackage.unitPrice || input.dataset.packageUnitPrice),
      totalPrice: Number(catalogPackage.totalPrice || input.dataset.packagePrice),
      stripePriceId: catalogPackage.priceId || input.dataset.stripePriceId || '',
    };
  };

  // Base price of one single card, used to show the honest "regular" comparison price.
  const basePrice = Number(configurator.dataset.productBasePrice || configurator.dataset.productPrice || 0);
  function currentTotals() {
    const units = clampQuantity(quantityInput?.value);
    const pack = getPackageConfig();
    if (pack) {
      const cards = pack.quantity * units;
      return { units, pack, cards, total: pack.totalPrice * units, regular: basePrice * cards };
    }
    const unitPrice = Number(productConfig.unitPrice || configurator.dataset.productPrice || 0);
    return { units, pack: null, cards: units, total: unitPrice * units, regular: unitPrice * units };
  }
  function updatePrice() {
    const { total, regular } = currentTotals();
    priceDisplays.forEach((node) => { node.textContent = money(total); });
    const saving = regular > total ? Math.round((1 - total / regular) * 100) : 0;
    compareDisplays.forEach((node) => {
      node.textContent = money(regular);
      node.hidden = saving <= 0;
    });
    saveDisplays.forEach((node) => {
      const label = node.querySelector('[data-save-label]') || node;
      label.textContent = `Ahorra ${saving}%`;
      node.hidden = saving <= 0;
    });
  }
  packageInputs.forEach((input) => input.addEventListener('change', updatePrice));
  updatePrice();

  const logoPayload = () => {
    const file = fileInput?.files?.[0];
    if (!file) return null;
    return {
      name: file.name,
      size: file.size,
      type: file.type
    };
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const goToCheckout = Boolean(event.submitter && event.submitter.hasAttribute('data-buy-now'));
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const design = selectedValue('design') || 'profile';
    const logoRequired = fileInput?.hasAttribute('data-logo-required');
    if ((design === 'custom' || logoRequired) && fileInput && !fileInput.files.length) {
      status.textContent = labels.logoRequired;
      uploadPanel?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const original = submit.innerHTML;
    submit.disabled = true;
    if (buyNow) buyNow.disabled = true;
    submit.classList.add('is-loading');
    submit.textContent = labels.adding;
    if (status) status.textContent = '';
    const hideCartLoading = goToCheckout ? () => {} : showCartLoading();

    const totals = currentTotals();
    const pack = totals.pack;
    const quantity = totals.cards;
    const unitPrice = pack?.unitPrice || Number(productConfig.unitPrice || configurator.dataset.productPrice);
    const totalPrice = totals.total;
    const reviewLink = reviewLinkInput?.value || '';
    const itemId = window.crypto?.randomUUID ? window.crypto.randomUUID() : `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const item = {
      id: itemId,
      product: configurator.dataset.productName,
      productCode,
      market,
      locale,
      currency,
      stripeProductId: productConfig.productId || configurator.dataset.stripeProductId || '',
      stripePriceId: pack?.stripePriceId || productConfig.priceId || configurator.dataset.stripePriceId || '',
      unitPrice,
      quantity,
      totalPrice,
      packageQuantity: pack?.quantity || '',
      packageUnitTotal: pack?.totalPrice || '',
      packageUnits: pack ? totals.units : '',
      promo: 'Promo 2026: +1 tarjeta extra de regalo',
      package: pack?.label || '',
      packageKey: pack?.key || '',
      design,
      color: selectedValue('color'),
      reviewLink,
      reviewLinks: parseReviewLinks(reviewLink),
      logo: logoPayload(),
      imageUrl: mainImage?.dataset.galleryImage || '',
      productUrl: window.location.href,
      addedAt: new Date().toISOString()
    };
    await Promise.all([
      saveLogoFile(item.id, fileInput?.files?.[0]).catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, 650))
    ]);
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    cart.push(item);
    localStorage.setItem(cartKey, JSON.stringify(cart));
    if (goToCheckout) {
      window.location.href = 'carrito.html';
      return;
    }
    window.dispatchEvent(new CustomEvent('taploe:cart-updated', { detail: { open: true, item } }));
    window.dispatchEvent(new CustomEvent('taploe:cart-open'));
    hideCartLoading();
    status.textContent = labels.cartStatus(item.product);
    submit.classList.remove('is-loading');
    submit.classList.add('is-added');
    submit.textContent = labels.added;
    setTimeout(() => {
      submit.disabled = false;
      if (buyNow) buyNow.disabled = false;
      submit.classList.remove('is-added');
      submit.innerHTML = original;
      updatePrice();
    }, 2200);
  });
})();
