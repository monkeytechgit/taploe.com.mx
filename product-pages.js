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
    gallery.querySelectorAll('[data-gallery-image], [data-gallery-video]').forEach((button) => {
      button.addEventListener('click', () => selectGalleryButton(button));
    });
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
  const money = (value) => new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
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
  const priceDisplay = configurator.querySelector('[data-product-price-display]');
  const minus = configurator.querySelector('[data-quantity-minus]');
  const plus = configurator.querySelector('[data-quantity-plus]');
  const status = configurator.querySelector('[data-form-status]');
  const submit = configurator.querySelector('.product-submit');
  const mainImage = configurator.closest('.product-detail')?.querySelector('[data-gallery-main]');
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
  if (minus) minus.addEventListener('click', () => { quantityInput.value = clampQuantity(Number(quantityInput.value) - 1); });
  if (plus) plus.addEventListener('click', () => { quantityInput.value = clampQuantity(Number(quantityInput.value) + 1); });
  if (quantityInput) quantityInput.addEventListener('change', () => { quantityInput.value = clampQuantity(quantityInput.value); });

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

  const updatePackagePrice = () => {
    const pack = getPackageConfig();
    if (!pack || !priceDisplay) return;
    priceDisplay.textContent = money(pack.totalPrice);
  };
  packageInputs.forEach((input) => input.addEventListener('change', updatePackagePrice));
  updatePackagePrice();

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

    const original = submit.textContent;
    submit.disabled = true;
    submit.classList.add('is-loading');
    submit.textContent = labels.adding;
    if (status) status.textContent = '';
    const hideCartLoading = showCartLoading();

    const pack = getPackageConfig();
    const quantity = pack?.quantity || clampQuantity(quantityInput?.value);
    const unitPrice = pack?.unitPrice || Number(productConfig.unitPrice || configurator.dataset.productPrice);
    const totalPrice = pack?.totalPrice || unitPrice * quantity;
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
      packageUnits: pack ? 1 : '',
      package: pack?.label || '',
      packageKey: pack?.key || '',
      design,
      color: selectedValue('color'),
      reviewLink,
      reviewLinks: parseReviewLinks(reviewLink),
      logo: logoPayload(),
      imageUrl: mainImage?.getAttribute('src') || '',
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
    window.dispatchEvent(new CustomEvent('taploe:cart-updated', { detail: { open: true, item } }));
    window.dispatchEvent(new CustomEvent('taploe:cart-open'));
    hideCartLoading();
    status.textContent = labels.cartStatus(item.product);
    submit.classList.remove('is-loading');
    submit.classList.add('is-added');
    submit.textContent = labels.added;
    setTimeout(() => {
      submit.disabled = false;
      submit.classList.remove('is-added');
      submit.textContent = original;
    }, 2200);
  });
})();
