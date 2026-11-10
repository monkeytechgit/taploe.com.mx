(() => {
  const normalize = (value) => (value || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  // ---------- Blog index: filters, search, load more ----------
  const list = document.querySelector('#blog-posts');
  if (list) {
    const PAGE = 9;
    const cards = Array.from(list.querySelectorAll('.post-card'));
    const chips = document.querySelectorAll('[data-blog-filter]');
    const search = document.querySelector('#blog-search');
    const more = document.querySelector('[data-blog-more]');
    const count = document.querySelector('[data-blog-count]');
    const empty = document.querySelector('[data-blog-empty]');
    let limit = PAGE;

    const activeFilter = () => document.querySelector('[data-blog-filter].is-active')?.dataset.blogFilter || 'todos';
    const render = () => {
      const filter = activeFilter();
      const term = normalize(search?.value.trim());
      const matches = cards.filter((card) => {
        const byCat = filter === 'todos' || (filter === 'noticias' ? card.dataset.news === '1' : card.dataset.cat === filter);
        return byCat && (!term || normalize(card.dataset.search).includes(term));
      });
      cards.forEach((card) => { card.hidden = true; });
      matches.forEach((card, index) => { card.hidden = index >= limit; });
      if (count) count.textContent = `${matches.length} artículo${matches.length === 1 ? '' : 's'}`;
      if (empty) empty.hidden = matches.length > 0;
      if (more) more.parentElement.hidden = matches.length <= limit;
    };
    const setFilter = (value) => {
      chips.forEach((chip) => {
        const on = chip.dataset.blogFilter === value;
        chip.classList.toggle('is-active', on);
        chip.setAttribute('aria-pressed', String(on));
      });
      limit = PAGE;
      render();
    };
    chips.forEach((chip) => chip.addEventListener('click', () => setFilter(chip.dataset.blogFilter)));
    search?.addEventListener('input', () => { limit = PAGE; render(); });
    more?.addEventListener('click', () => { limit += PAGE; render(); });
    const initial = new URLSearchParams(window.location.search).get('categoria');
    if (initial && document.querySelector(`[data-blog-filter="${initial}"]`)) {
      setFilter(initial);
      document.querySelector('.blog-list-head')?.scrollIntoView({ block: 'start' });
    } else {
      render();
    }
  }

  // ---------- Article: reading progress ----------
  const progress = document.querySelector('[data-read-progress]');
  const body = document.querySelector('.post-body');
  if (progress && body) {
    const update = () => {
      const rect = body.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      const done = Math.min(1, Math.max(0, -rect.top / (total || 1)));
      progress.style.width = `${(done * 100).toFixed(1)}%`;
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // ---------- Article: active TOC link ----------
  const tocLinks = Array.from(document.querySelectorAll('.post-toc a'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map(tocLinks.map((link) => [link.getAttribute('href').slice(1), link]));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach((link) => link.classList.remove('is-active'));
        byId.get(entry.target.id)?.classList.add('is-active');
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    byId.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  // ---------- Article: copy link ----------
  document.querySelectorAll('[data-copy-link]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        button.setAttribute('data-copied', 'Copiado');
      } catch {
        button.setAttribute('data-copied', 'No se pudo copiar');
      }
      setTimeout(() => button.removeAttribute('data-copied'), 2000);
    });
  });
})();
