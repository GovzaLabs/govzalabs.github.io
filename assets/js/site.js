/* Govza Labs — shared page behaviour: theme, header, menu, reveals, previews. */
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  window.glReady = true;

  // Analytics: queue events until Firebase (analytics.js) has loaded.
  window.glTrack = (name, params) => {
    if (window.logEvent && window.firebaseAnalytics) {
      window.logEvent(window.firebaseAnalytics, name, params);
    } else {
      (window.glAnalyticsQueue = window.glAnalyticsQueue || []).push([name, params]);
    }
  };

  /* ---------- Theme ---------- */

  const themeButtons = document.querySelectorAll('[data-theme-toggle]');
  const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');

  const currentTheme = () => root.dataset.theme || (prefersDark.matches ? 'dark' : 'light');

  function syncThemeUI() {
    const isDark = currentTheme() === 'dark';
    // Icon-only toggles expose state via aria-pressed; labelled ones say it in words.
    themeButtons.forEach((button) => {
      if (button.classList.contains('icon-btn')) button.setAttribute('aria-pressed', String(isDark));
    });
    document.querySelectorAll('[data-theme-label]').forEach((label) => {
      label.textContent = isDark ? 'Тема: тёмная' : 'Тема: светлая';
    });
    if (root.dataset.theme) {
      themeColorMetas.forEach((meta) => {
        meta.setAttribute('content', isDark ? '#0E0E0D' : '#F2F0EB');
      });
    }
  }

  function setTheme(theme) {
    root.dataset.theme = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {}
    syncThemeUI();
  }

  themeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      button.classList.toggle('is-turning');
      if (document.startViewTransition && !reduceMotion.matches) {
        document.startViewTransition(() => setTheme(next));
      } else {
        setTheme(next);
      }
      window.glTrack('theme_toggle', { theme: next });
    });
  });

  prefersDark.addEventListener('change', syncThemeUI);
  syncThemeUI();

  /* ---------- Header ---------- */

  const header = document.querySelector('[data-header]');
  if (header) {
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:16px;pointer-events:none';
    document.body.prepend(sentinel);
    new IntersectionObserver(([entry]) => {
      header.classList.toggle('is-scrolled', !entry.isIntersecting);
    }).observe(sentinel);
  }

  /* ---------- Mobile menu ---------- */

  const menu = document.querySelector('[data-menu]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  let menuTimer;

  function setMenu(open) {
    if (!menu || !menuToggle) return;
    clearTimeout(menuTimer);
    menuToggle.setAttribute('aria-expanded', String(open));
    header?.classList.toggle('is-menu-open', open);
    root.classList.toggle('menu-locked', open);
    if (open) {
      menu.hidden = false;
      void menu.offsetHeight; // commit display before transitioning
      menu.classList.add('is-open');
    } else {
      menu.classList.remove('is-open');
      menuTimer = setTimeout(() => {
        menu.hidden = true;
      }, 450);
    }
  }

  menuToggle?.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });

  menu?.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuToggle.focus();
    }
  });

  window.matchMedia('(min-width: 1040px)').addEventListener('change', (event) => {
    if (event.matches) setMenu(false);
  });

  /* ---------- Scroll reveals ---------- */

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

  const stepsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-drawn');
      stepsObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -15% 0px' });

  document.querySelectorAll('.steps').forEach((el) => stepsObserver.observe(el));

  /* ---------- Active section in the nav ---------- */

  const navLinks = new Map();
  document.querySelectorAll('[data-nav]').forEach((link) => navLinks.set(link.dataset.nav, link));

  if (navLinks.size) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link, id) => {
          if (id === entry.target.id) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));
  }

  /* ---------- Jump from the home screen to a project ---------- */

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#work-"]');
    if (!link) return;
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    target.classList.add('is-in');
    const flashTarget = target.querySelector('.case-core') || target;
    setTimeout(() => {
      flashTarget.classList.remove('is-flash');
      void flashTarget.offsetWidth;
      flashTarget.classList.add('is-flash');
    }, reduceMotion.matches ? 0 : 450);
  });

  /* ---------- Technology band ---------- */

  document.querySelectorAll('[data-band]').forEach((track) => {
    track.innerHTML += track.innerHTML;
    track.classList.add('is-running');
  });

  /* ---------- Project index: cursor-following preview ---------- */

  const archive = document.querySelector('[data-archive]');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  if (archive && finePointer.matches && !reduceMotion.matches) {
    const rows = archive.querySelectorAll('[data-preview]');
    const preview = document.createElement('div');
    preview.className = 'archive-preview';
    preview.setAttribute('aria-hidden', 'true');
    preview.innerHTML = '<div class="archive-preview-inner"></div>';
    document.body.append(preview);
    const image = new Image();
    image.alt = '';
    image.decoding = 'async';

    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let frame = 0;
    let active = false;
    let preloaded = false;

    const loop = () => {
      x += (targetX - x) * 0.16;
      y += (targetY - y) * 0.16;
      const tilt = Math.max(-8, Math.min(8, (targetX - x) * 0.06));
      preview.style.transform = `translate3d(${x + 28}px, ${y - 140}px, 0) rotate(${tilt}deg)`;
      if (active || Math.abs(targetX - x) > 0.5 || Math.abs(targetY - y) > 0.5) {
        frame = requestAnimationFrame(loop);
      } else {
        frame = 0;
      }
    };

    archive.addEventListener('pointerenter', () => {
      if (preloaded) return;
      preloaded = true;
      rows.forEach((row) => {
        const img = new Image();
        img.src = row.dataset.preview;
      });
    });

    archive.addEventListener('pointermove', (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!active) {
        x = targetX;
        y = targetY;
      }
    });

    rows.forEach((row) => {
      row.addEventListener('pointerenter', (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        if (!active) {
          x = targetX;
          y = targetY;
        }
        if (image.getAttribute('src') !== row.dataset.preview) image.src = row.dataset.preview;
        if (!image.isConnected) preview.firstElementChild.append(image);
        active = true;
        preview.classList.add('is-visible');
        if (!frame) frame = requestAnimationFrame(loop);
      });
      row.addEventListener('pointerleave', () => {
        active = false;
        preview.classList.remove('is-visible');
      });
    });
  }

  /* ---------- Screenshot gallery (product pages) ---------- */

  document.querySelectorAll('[data-gallery]').forEach((gallery) => {
    const scope = gallery.closest('section') || document;
    const prev = scope.querySelector('[data-gallery-prev]');
    const next = scope.querySelector('[data-gallery-next]');
    if (!prev || !next) return;
    const step = () => (gallery.querySelector('li')?.getBoundingClientRect().width || 260) + 16;
    const sync = () => {
      prev.disabled = gallery.scrollLeft <= 4;
      next.disabled = gallery.scrollLeft + gallery.clientWidth >= gallery.scrollWidth - 4;
    };
    const behavior = () => (reduceMotion.matches ? 'auto' : 'smooth');
    prev.addEventListener('click', () => gallery.scrollBy({ left: -step(), behavior: behavior() }));
    next.addEventListener('click', () => gallery.scrollBy({ left: step(), behavior: behavior() }));
    gallery.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });

  /* ---------- Small things ---------- */

  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
})();
