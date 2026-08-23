(() => {
  const config = window.TaploeEcommerce || {};
  const market = config.market || document.documentElement.dataset.market || 'mx';
  const locale = config.locale || document.documentElement.dataset.locale || 'es-MX';
  const copy = {
    title: 'Solicitar plan para equipo',
    inlineTitle: 'Solicitar cotización Taploe',
    intro: 'Cuéntanos qué necesita tu equipo y Taploe te ayuda con una cotización.',
    solution: 'Tipo de solución *',
    quantity: 'Cantidad aproximada *',
    name: 'Nombre completo *',
    company: 'Empresa opcional',
    phone: 'Teléfono opcional',
    email: 'Correo electrónico *',
    message: 'Cuéntanos brevemente qué tienes en mente opcional',
    messagePlaceholder: 'Ejemplo: Necesitamos 15 tarjetas para el equipo comercial, personalizadas con el logo y los datos de cada asesor.',
    cancel: 'Cancelar',
    submit: 'Enviar solicitud',
    sending: 'Enviando...',
    success: 'Solicitud enviada. Te contactaremos en 5-10 minutos.',
    error: 'No pudimos enviar tu solicitud. Intenta de nuevo o escribe a info@taploe.com.',
    close: 'Cerrar formulario de cotización',
    exit: 'Salir',
    icon: 'Solicitud de cotización',
    options: {
      digital_profile: 'Perfil digital',
      nfc_card: 'Tarjeta NFC + perfil digital',
      metal_card: 'Tarjeta NFC metálica',
      google_review_card: 'Tarjeta para reseñas de Google',
      team_solution: 'Solución para equipo',
      custom: 'Proyecto personalizado'
    }
  };

  const solutionValues = ['digital_profile', 'nfc_card', 'metal_card', 'google_review_card', 'team_solution', 'custom'];
  const supabaseBaseUrl = () => (config.supabaseUrl || '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const supabaseReady = () => config.supabaseUrl && config.supabaseAnonKey && supabaseBaseUrl();

  const field = (id, label, input) => `
    <label class="quote-field" for="${id}">
      <span>${label}</span>
      ${input}
    </label>
  `;

  const formMarkup = (mode = 'dialog') => {
    const prefix = mode === 'inline' ? 'quote-inline' : 'quote-dialog';
    return `
    <form class="quote-form" data-quote-form data-quote-mode="${mode}">
      <div class="quote-form__grid">
        ${field(`${prefix}-solution`, copy.solution, `
          <select id="${prefix}-solution" name="solution_type" required>
            ${solutionValues.map((value) => `<option value="${value}">${copy.options[value]}</option>`).join('')}
          </select>
        `)}
        ${field(`${prefix}-quantity`, copy.quantity, `<input id="${prefix}-quantity" name="approximate_quantity" type="number" inputmode="numeric" min="1" step="1" value="1" required>`)}
        ${field(`${prefix}-name`, copy.name, `<input id="${prefix}-name" name="full_name" type="text" autocomplete="name" required>`)}
        ${field(`${prefix}-company`, copy.company, `<input id="${prefix}-company" name="company" type="text" autocomplete="organization">`)}
        ${field(`${prefix}-phone`, copy.phone, `<input id="${prefix}-phone" name="phone" type="tel" autocomplete="tel">`)}
        ${field(`${prefix}-email`, copy.email, `<input id="${prefix}-email" name="email" type="email" autocomplete="email" required>`)}
      </div>
      ${field(`${prefix}-message`, copy.message, `<textarea id="${prefix}-message" name="message" placeholder="${copy.messagePlaceholder}"></textarea>`)}
      <p class="quote-form__status" role="status" aria-live="polite" data-quote-status></p>
      <div class="quote-form__feedback" aria-hidden="true">
        <div class="quote-form__feedback-box">
          <span class="quote-form__feedback-icon" aria-hidden="true"></span>
          <p data-quote-feedback-text></p>
        </div>
      </div>
      <div class="quote-form__actions">
        <button class="quote-button quote-button--secondary" type="button" data-quote-close>${copy.cancel}</button>
        <button class="quote-button quote-button--primary" type="submit">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12 20 5l-7 15-2-6-7-2Z"/></svg>
          <span>${copy.submit}</span>
        </button>
      </div>
    </form>
  `;
  };

  const headingIconMarkup = `<span class="quote-dialog__icon" aria-label="${copy.icon}" role="img"><i class="fa fa-file-text-o" aria-hidden="true"></i></span>`;

  const buildDialog = () => {
    if (document.querySelector('[data-quote-dialog]')) return;
    const dialog = document.createElement('div');
    dialog.className = 'quote-dialog';
    dialog.setAttribute('data-quote-dialog', '');
    dialog.setAttribute('aria-hidden', 'true');
    dialog.innerHTML = `
      <button class="quote-dialog__backdrop" type="button" data-quote-close tabindex="-1" aria-label="${copy.close}"></button>
      <section class="quote-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="quote-dialog-title">
        <button class="quote-dialog__close" type="button" data-quote-close aria-label="${copy.close}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
        </button>
        <div class="quote-dialog__heading">
          ${headingIconMarkup}
          <div>
            <h2 id="quote-dialog-title">${copy.title}</h2>
            <p>${copy.intro}</p>
          </div>
        </div>
        ${formMarkup('dialog')}
        <div class="quote-dialog__feedback" aria-hidden="true">
          <button class="quote-dialog__feedback-close" type="button" data-quote-close aria-label="${copy.close}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
          </button>
          <div class="quote-form__feedback-box">
            <span class="quote-form__feedback-icon" aria-hidden="true"></span>
            <p data-quote-panel-feedback-text></p>
            <button class="quote-button quote-button--primary quote-dialog__feedback-exit" type="button" data-quote-close>${copy.exit}</button>
          </div>
        </div>
      </section>
    `;
    document.body.appendChild(dialog);
  };

  const openDialog = (source) => {
    buildDialog();
    const dialog = document.querySelector('[data-quote-dialog]');
    const form = dialog.querySelector('[data-quote-form]');
    hydrateDefaults(form, source);
    dialog.classList.add('is-open');
    dialog.setAttribute('aria-hidden', 'false');
    document.body.classList.add('quote-is-open');
    form.querySelector('[name="solution_type"]')?.focus({ preventScroll: true });
  };

  const closeDialog = () => {
    const dialog = document.querySelector('[data-quote-dialog]');
    dialog?.classList.remove('is-open');
    dialog?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('quote-is-open');
  };

  const hydrateDefaults = (form, source = {}) => {
    if (!form) return;
    const solution = form.querySelector('[name="solution_type"]');
    const quantity = form.querySelector('[name="approximate_quantity"]');
    const status = form.querySelector('[data-quote-status]');
    const feedback = form.querySelector('[data-quote-feedback-text]');
    const panel = form.closest('.quote-dialog__panel');
    const panelFeedback = panel?.querySelector('[data-quote-panel-feedback-text]');
    if (solution && source.solutionType) solution.value = source.solutionType;
    if (quantity) quantity.value = source.quantity || (source.solutionType === 'team_solution' ? 10 : 1);
    form.dataset.quoteSource = source.source || 'quote_button';
    form.classList.remove('is-sending', 'is-success', 'is-error');
    panel?.classList.remove('is-sending', 'is-success', 'is-error');
    form.removeAttribute('aria-busy');
    if (status) status.textContent = '';
    if (feedback) feedback.textContent = '';
    if (panelFeedback) panelFeedback.textContent = '';
  };

  const sourceFromTrigger = (trigger) => {
    const text = (trigger.textContent || '').toLowerCase();
    let solutionType = trigger.dataset.quoteSolution || 'team_solution';
    if (text.includes('nfc') && !text.includes('team') && !text.includes('equipo')) solutionType = 'nfc_card';
    if (trigger.classList.contains('pricing-button--purple') ||
      text.includes('custom quote') ||
      text.includes('cotización personalizada') ||
      text.includes('pro')) {
      solutionType = 'custom';
    }
    return {
      solutionType,
      quantity: trigger.dataset.quoteQuantity || '',
      source: trigger.dataset.quoteSource || text.trim().slice(0, 80) || 'quote_button'
    };
  };

  const isQuoteTrigger = (element) => {
    if (!element) return false;
    if (element.matches('[data-quote-open]')) return true;
    const href = element.getAttribute('href') || '';
    const text = (element.textContent || '').toLowerCase();
    return href.includes('contacto.html#cotizacion') ||
      text.includes('solicitar cotización') ||
      text.includes('cotizar para') ||
      text.includes('request quote');
  };

  const submitQuote = async (form) => {
    const status = form.querySelector('[data-quote-status]');
    const submit = form.querySelector('[type="submit"]');
    const feedback = form.querySelector('[data-quote-feedback-text]');
    const panel = form.closest('.quote-dialog__panel');
    const panelFeedback = panel?.querySelector('[data-quote-panel-feedback-text]');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = new FormData(form);
    const payload = {
      solution_type: data.get('solution_type'),
      approximate_quantity: Number(data.get('approximate_quantity') || 1),
      full_name: String(data.get('full_name') || '').trim(),
      company: String(data.get('company') || '').trim() || null,
      phone: String(data.get('phone') || '').trim() || null,
      email: String(data.get('email') || '').trim(),
      message: String(data.get('message') || '').trim() || null,
      metadata: {
        market,
        locale,
        page_url: window.location.href,
        referrer: document.referrer || null,
        source: form.dataset.quoteSource || form.dataset.quoteMode || 'quote_form'
      }
    };
    if (!supabaseReady()) throw new Error('Supabase is not configured.');
    submit.disabled = true;
    form.classList.remove('is-success', 'is-error');
    panel?.classList.remove('is-success', 'is-error');
    form.classList.add('is-sending');
    panel?.classList.add('is-sending');
    form.setAttribute('aria-busy', 'true');
    if (status) status.textContent = copy.sending;
    if (feedback) feedback.textContent = copy.sending;
    if (panelFeedback) panelFeedback.textContent = copy.sending;
    const response = await fetch(`${supabaseBaseUrl()}/rest/v1/quote_requests`, {
      method: 'POST',
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await response.text());
    form.reset();
    hydrateDefaults(form, { solutionType: 'team_solution', source: form.dataset.quoteSource });
    form.classList.remove('is-sending', 'is-error');
    panel?.classList.remove('is-sending', 'is-error');
    form.classList.add('is-success');
    panel?.classList.add('is-success');
    form.setAttribute('aria-busy', 'false');
    if (status) status.textContent = copy.success;
    if (feedback) feedback.textContent = copy.success;
    if (panelFeedback) panelFeedback.textContent = copy.success;
    submit.disabled = false;
  };

  const mountInlineForms = () => {
    document.querySelectorAll('[data-quote-inline]').forEach((mount) => {
      if (mount.querySelector('[data-quote-form]')) return;
      mount.innerHTML = `
        <section class="quote-inline-card">
          <div class="quote-dialog__heading">
            ${headingIconMarkup}
            <div>
              <h2>${copy.inlineTitle}</h2>
              <p>${copy.intro}</p>
            </div>
          </div>
          ${formMarkup('inline')}
        </section>
      `;
      hydrateDefaults(mount.querySelector('[data-quote-form]'), { solutionType: 'team_solution', source: 'contact_page' });
    });
  };

  document.addEventListener('click', (event) => {
    const close = event.target.closest('[data-quote-close]');
    if (close) {
      const inlineForm = close.closest('[data-quote-form][data-quote-mode="inline"]');
      if (inlineForm) {
        inlineForm.reset();
        hydrateDefaults(inlineForm, { solutionType: 'team_solution', source: inlineForm.dataset.quoteSource || 'contact_page' });
        const status = inlineForm.querySelector('[data-quote-status]');
        if (status) status.textContent = '';
        return;
      }
      closeDialog();
      return;
    }
    const trigger = event.target.closest('a, button');
    if (isQuoteTrigger(trigger)) {
      event.preventDefault();
      openDialog(sourceFromTrigger(trigger));
    }
  });

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-quote-form]');
    if (!form) return;
    event.preventDefault();
    try {
      await submitQuote(form);
    } catch (error) {
      const status = form.querySelector('[data-quote-status]');
      const submit = form.querySelector('[type="submit"]');
      const feedback = form.querySelector('[data-quote-feedback-text]');
      const panel = form.closest('.quote-dialog__panel');
      const panelFeedback = panel?.querySelector('[data-quote-panel-feedback-text]');
      form.classList.remove('is-sending', 'is-success');
      panel?.classList.remove('is-sending', 'is-success');
      form.classList.add('is-error');
      panel?.classList.add('is-error');
      form.setAttribute('aria-busy', 'false');
      if (status) status.textContent = copy.error;
      if (feedback) feedback.textContent = copy.error;
      if (panelFeedback) panelFeedback.textContent = copy.error;
      if (submit) submit.disabled = false;
      console.error(error);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDialog();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      buildDialog();
      mountInlineForms();
      if (window.location.hash === '#cotizacion' && !document.querySelector('[data-quote-inline]')) {
        openDialog({ solutionType: 'team_solution', source: 'hash' });
      }
    });
  } else {
    buildDialog();
    mountInlineForms();
    if (window.location.hash === '#cotizacion' && !document.querySelector('[data-quote-inline]')) {
      openDialog({ solutionType: 'team_solution', source: 'hash' });
    }
  }
})();
