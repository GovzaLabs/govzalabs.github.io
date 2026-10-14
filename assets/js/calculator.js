/* Govza Labs — project cost calculator.
   Prices (USD) and timelines (working days) live in the config below. */
(() => {
  const form = document.querySelector('[data-calc-form]');
  if (!form) return;

  const TELEGRAM_URL = 'https://t.me/avoc0der';
  const WHATSAPP_URL = 'https://wa.me/79286404000';
  const PRICE_LIMIT = 15000; // the displayed total is capped and gets a "+"
  const COMPLEXITY_THRESHOLD = 4; // features beyond this count get pricier…
  const COMPLEXITY_RATE = 0.06; // …by 6% each
  const DESIGN_OVERLAP = 0.6; // design partly runs in parallel with development
  const TIMELINE_FACTOR = 0.85; // optimistic delivery

  const ICONS = {
    cart: '<path d="M3 4h2.2l2.1 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L20.5 8H6.1"/><circle cx="9.5" cy="20" r="1.2"/><circle cx="17" cy="20" r="1.2"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z"/><circle cx="12" cy="10" r="2.4"/>',
    book: '<path d="M3.5 5.5c2.8-.9 5.6-.6 8.5 1v13c-2.9-1.6-5.7-1.9-8.5-1Z"/><path d="M20.5 5.5c-2.8-.9-5.6-.6-8.5 1v13c2.9-1.6 5.7-1.9 8.5-1Z"/>',
    users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.2 14.2c1.8.6 3 2.2 3.3 4.8"/>',
    case: '<rect x="3.5" y="7" width="17" height="12.5" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17"/>',
    spark: '<path d="m12 3.5 1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8Z"/><path d="m18.5 15.5.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z"/>',
  };

  // `name` values are stable: they go into analytics and the chat message.
  const CATEGORIES = [
    { id: 'ecommerce', title: 'Маркетплейс / eCommerce', sub: 'Каталог, корзина, оплата', icon: 'cart' },
    { id: 'services', title: 'Доставка / Услуги', sub: 'Доставка, бронь, курьеры', icon: 'pin' },
    { id: 'education', title: 'Онлайн-обучение', sub: 'Курсы, уроки, личный кабинет', icon: 'book' },
    { id: 'community', title: 'Сообщество / Соцсеть', sub: 'Чаты, лента, профили', icon: 'users' },
    { id: 'b2b', title: 'B2B / Внутренние сервисы', sub: 'CRM, склад, процессы', icon: 'case' },
    { id: 'custom', title: 'Другое / Свой проект', sub: 'Выберу вручную', icon: 'spark' },
  ];

  const PLATFORMS = [
    { id: 'ios', name: 'iOS Приложение', title: 'iOS', sub: 'Swift / SwiftUI', line: 'iOS-приложение', price: 5000, days: 68 },
    { id: 'android', name: 'Android Приложение', title: 'Android', sub: 'Kotlin / Jetpack Compose', line: 'Android-приложение', price: 5000, days: 68 },
    { id: 'cross', name: 'Кроссплатформа', title: 'Кроссплатформа', sub: 'Flutter / React Native', line: 'Кроссплатформа iOS + Android', price: 8000, days: 90 },
    { id: 'web', name: 'Веб-приложение', title: 'Веб-приложение', sub: 'React / Next.js', line: 'Веб-приложение', price: 5000, days: 45 },
  ];

  const DESIGNS = [
    { id: 'ready', name: 'Есть макет', title: 'Есть макет', sub: 'Дизайн уже готов', line: 'Дизайн: есть макет', price: 0, days: 0 },
    { id: 'basic', name: 'Базовый дизайн', title: 'Базовый / Шаблон', sub: 'Чистый, стандартный UI', line: 'Базовый дизайн', price: 1000, days: 15 },
    { id: 'premium', name: 'Премиум дизайн', title: 'Премиум UI/UX', sub: 'Уникальный, анимированный', line: 'Премиум UI/UX', price: 5000, days: 45 },
  ];

  // devOnly: only makes sense when something is being built, not just designed.
  const FEATURES = [
    { id: 'auth', name: 'Авторизация', label: 'Авторизация (Email/Social)', price: 500, days: 8 },
    { id: 'push', name: 'Push-уведомления', label: 'Push-уведомления', price: 500, days: 6, devOnly: true },
    { id: 'analytics', name: 'Аналитика', label: 'Аналитика', price: 300, days: 3, devOnly: true },
    { id: 'ai', name: 'AI Интеграция', label: 'Интеграция ИИ', price: 2500, days: 23, devOnly: true },
    { id: 'payments', name: 'Платежи', label: 'Платежи (Apple/Google Pay, ЮKassa)', price: 1000, days: 15, devOnly: true },
    { id: 'recs', name: 'Рекомендации / персонализация', label: 'Рекомендации и персонализация', price: 1300, days: 18, devOnly: true },
    { id: 'subs', name: 'Подписки', label: 'Подписки (App Store, Google Play, ЮKassa)', price: 1500, days: 21, devOnly: true },
    { id: 'chat', name: 'Чат', label: 'Чат и сообщения', price: 1500, days: 30, devOnly: true },
    { id: 'feed', name: 'Лента новостей', label: 'Лента новостей', price: 1500, days: 23, devOnly: true },
    { id: 'profiles', name: 'Профили пользователей', label: 'Профили пользователей', price: 800, days: 12 },
    { id: 'maps', name: 'Карты', label: 'Карты (Google/Apple)', price: 1000, days: 15, devOnly: true },
    { id: 'gps', name: 'GPS Трекинг', label: 'GPS-трекинг', price: 1500, days: 23, devOnly: true },
    { id: 'media', name: 'Загрузка медиа', label: 'Загрузка фото и видео', price: 800, days: 12, devOnly: true },
    { id: 'search', name: 'Поиск', label: 'Поиск и фильтры', price: 800, days: 9 },
    { id: 'admin', name: 'Админ-панель', label: 'Админ-панель', price: 2000, days: 30, devOnly: true },
    { id: 'i18n', name: 'Мультиязычность', label: 'Мультиязычность', price: 1000, days: 15 },
    { id: 'dark', name: 'Темная тема', label: 'Тёмная тема', price: 500, days: 8 },
    { id: 'offline', name: 'Оффлайн режим', label: 'Офлайн-режим', price: 1500, days: 15, devOnly: true },
  ];

  const EXTRAS = [
    { id: 'domain', name: 'Доменное имя', label: 'Доменное имя (.com / .ru)', line: 'Доменное имя', price: 20, days: 0 },
    { id: 'publish', name: 'Публикация в сторах', label: 'Публикация в App Store и Google Play', line: 'Публикация в сторах', price: 500, days: 11, devOnly: true },
    { id: 'llc', name: 'Регистрация LLC для App Store и Google Play', label: 'Регистрация LLC для App Store и Google Play', line: 'Регистрация LLC', price: 450, days: 10, devOnly: true },
  ];

  const PRESETS = {
    ecommerce: ['auth', 'payments', 'recs', 'push', 'search', 'profiles'],
    services: ['auth', 'maps', 'gps', 'payments', 'push'],
    education: ['auth', 'media', 'search', 'profiles', 'subs', 'recs'],
    community: ['auth', 'chat', 'feed', 'profiles', 'push', 'media'],
    b2b: ['auth', 'push', 'i18n', 'admin', 'analytics'],
    custom: [],
  };

  const byId = (list) => Object.fromEntries(list.map((item) => [item.id, item]));
  const CATEGORY = byId(CATEGORIES);
  const PLATFORM = byId(PLATFORMS);
  const DESIGN = byId(DESIGNS);
  const FEATURE = byId(FEATURES);
  const EXTRA = byId(EXTRAS);

  const money = (value) => '$' + String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sum = (items, key) => items.reduce((total, item) => total + item[key], 0);
  const track = (name, params) => window.glTrack && window.glTrack(name, params);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Pure estimate (mirrors the original calculator) ---------- */

  function estimate({ platforms, design, features, extras }) {
    const lines = [];
    let designCost = 0;
    let designDays = 0;
    let devCost = 0;
    let devDays = 0;

    platforms.forEach((platform) => {
      devCost += platform.price;
      devDays += platform.days;
      lines.push({ label: platform.line, price: platform.price });
    });
    const hasDev = platforms.length > 0;

    if (design) {
      designCost += design.price;
      designDays += design.days;
      lines.push({ label: design.line, price: design.price });
    }

    const featureCount = features.length;
    const featuresTotal = sum(features, 'price');
    const featureDays = sum(features, 'days');
    const extrasTotal = sum(extras, 'price');
    const extrasDays = sum(extras, 'days');

    if (hasDev) {
      // Complexity applies to the feature scope only, not to platforms or extras.
      const multiplier = 1 + Math.max(0, (featureCount - COMPLEXITY_THRESHOLD) * COMPLEXITY_RATE);
      const featureCost = Math.round(featuresTotal * multiplier);
      devCost += featureCost + extrasTotal;
      devDays += Math.round(featureDays * multiplier) + extrasDays;
      if (featureCount > 0) lines.push({ label: `Функции · ${featureCount}`, price: featureCost });
    } else {
      // Design only: features widen the UX scope modestly instead of adding build cost.
      const featureCost = Math.round(featuresTotal * 0.25);
      designCost += featureCost + extrasTotal;
      designDays += (featureCount > 0 ? Math.max(4, Math.round(featureDays * 0.45)) : 0) + extrasDays;
      if (featureCount > 0) lines.push({ label: `Функции для дизайна · ${featureCount}`, price: featureCost });
    }

    extras.forEach((extra) => lines.push({ label: extra.line, price: extra.price }));

    const total = designCost + devCost;
    const combinedDays = hasDev ? Math.round(devDays + Math.round(designDays * DESIGN_OVERLAP)) : designDays;
    const hasSelection = hasDev || (design && design.price > 0) || featureCount > 0 || extras.length > 0;

    return {
      lines,
      total,
      shownTotal: Math.min(total, PRICE_LIMIT),
      overLimit: total > PRICE_LIMIT,
      days: Math.round(combinedDays * TIMELINE_FACTOR),
      hasSelection: Boolean(hasSelection),
    };
  }

  function formatTime(days) {
    if (days === 0) return '—';
    const months = Math.ceil(days / 30);
    return months >= 6 ? '6+ мес.' : `~${months} мес.`;
  }

  /* ---------- Markup ---------- */

  const svgIcon = (paths) =>
    `<svg class="opt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const useIcon = (id, className = '') => `<svg class="${className}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const legend = (step, title, hint) =>
    `<legend class="calc-legend"><span class="calc-step">${step}</span>${title}${hint ? `<span class="calc-hint">${hint}</span>` : ''}</legend>`;

  form.innerHTML = `
    <fieldset class="calc-group">
      ${legend(1, 'Тип проекта', 'подставит типичные функции')}
      <div class="opts opts--types">
        ${CATEGORIES.map((c) => `
          <label class="opt">
            <input type="radio" name="category" value="${c.id}"${c.id === 'custom' ? ' checked' : ''}>
            <span class="opt-card">${svgIcon(ICONS[c.icon])}<span class="opt-title">${c.title}</span><span class="opt-sub">${c.sub}</span></span>
          </label>`).join('')}
      </div>
    </fieldset>

    <fieldset class="calc-group">
      ${legend(2, 'Платформа', 'можно выбрать несколько')}
      <div class="opts opts--platforms">
        ${PLATFORMS.map((p) => `
          <label class="opt">
            <input type="checkbox" name="platform" value="${p.id}">
            <span class="opt-card">
              <span class="opt-top"><span class="opt-title">${p.title}</span><span class="opt-price">${money(p.price)}</span></span>
              <span class="opt-sub">${p.sub}</span>
            </span>
          </label>`).join('')}
      </div>
    </fieldset>

    <fieldset class="calc-group">
      ${legend(3, 'Дизайн')}
      <div class="opts opts--design">
        ${DESIGNS.map((d) => `
          <label class="opt">
            <input type="radio" name="design" value="${d.id}"${d.id === 'ready' ? ' checked' : ''}>
            <span class="opt-card">
              <span class="opt-top"><span class="opt-title">${d.title}</span><span class="opt-price">${money(d.price)}</span></span>
              <span class="opt-sub">${d.sub}</span>
            </span>
          </label>`).join('')}
      </div>
    </fieldset>

    <fieldset class="calc-group">
      ${legend(4, 'Функции')}
      <div class="opts opts--features">
        ${FEATURES.map((f) => `
          <label class="opt opt--chip">
            <input type="checkbox" name="feature" value="${f.id}"${f.devOnly ? ' data-dev-only' : ''}>
            <span class="opt-card">${useIcon('i-plus', 'i-off')}${useIcon('i-check', 'i-on')}${f.label}</span>
          </label>`).join('')}
      </div>
      <p class="calc-note" data-calc-note>Часть функций станет доступна, когда выберете платформу.</p>
    </fieldset>

    <fieldset class="calc-group">
      ${legend(5, 'Дополнительно')}
      <div class="opts opts--extras">
        ${EXTRAS.map((e) => `
          <label class="opt opt--row">
            <input type="checkbox" name="extra" value="${e.id}"${e.devOnly ? ' data-dev-only' : ''}>
            <span class="opt-card"><span class="opt-box">${useIcon('i-check')}</span><span class="opt-title">${e.label}</span><span class="opt-price">+${money(e.price)}</span></span>
          </label>`).join('')}
      </div>
    </fieldset>`;

  /* ---------- Elements ---------- */

  const calc = form.closest('[data-calc]');
  const section = form.closest('section');
  const receipt = calc.querySelector('.receipt');
  const summary = calc.querySelector('[data-calc-summary]');
  const linesEl = calc.querySelector('[data-calc-lines]');
  const emptyEl = calc.querySelector('[data-calc-empty]');
  const timeEl = calc.querySelector('[data-calc-time]');
  const priceEl = calc.querySelector('[data-calc-price]');
  const noteEl = calc.querySelector('[data-calc-note]');
  const dock = calc.querySelector('[data-calc-dock]');
  const dockPrice = calc.querySelector('[data-calc-dock-price]');
  const dockTime = calc.querySelector('[data-calc-dock-time]');
  const sendLinks = calc.querySelectorAll('[data-calc-send]');

  const live = document.createElement('p');
  live.className = 'sr-only';
  live.setAttribute('aria-live', 'polite');
  receipt.append(live);

  const dateEl = calc.querySelector('[data-calc-date]');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('ru-RU');

  /* ---------- State ---------- */

  let hasManualFeatureChange = false;
  let hadDev = false;
  let shownPrice = 0;
  let priceFrame = 0;
  let liveTimer = 0;
  let previousLines = new Set();

  const checked = (name) => Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
  const input = (name, value) => form.querySelector(`input[name="${name}"][value="${value}"]`);

  function readState() {
    const designId = checked('design')[0];
    return {
      category: checked('category')[0] || 'custom',
      platforms: checked('platform').map((id) => PLATFORM[id]),
      design: designId ? DESIGN[designId] : null,
      features: checked('feature').map((id) => FEATURE[id]),
      extras: checked('extra').map((id) => EXTRA[id]),
    };
  }

  function applyPreset(category) {
    const preset = new Set(PRESETS[category] || []);
    form.querySelectorAll('input[name="feature"]').forEach((el) => {
      el.checked = preset.has(el.value) && !el.disabled;
    });
  }

  function syncAvailability(hasDev) {
    form.querySelectorAll('input[data-dev-only]').forEach((el) => {
      if (!hasDev) el.checked = false;
      el.disabled = !hasDev;
    });
    noteEl.hidden = hasDev;
  }

  function handlePlatformExclusivity(changed) {
    // Web combines with anything; native and cross-platform exclude each other.
    if (!changed.checked || changed.value === 'web') return;
    if (changed.value === 'cross') {
      input('platform', 'ios').checked = false;
      input('platform', 'android').checked = false;
    } else {
      input('platform', 'cross').checked = false;
    }
  }

  function buildMessage(state) {
    let message = '\n\n-----\n\n';
    message += `Тип: ${CATEGORY[state.category].title}\n`;
    if (state.platforms.length) message += `\nПлатформы:\n${state.platforms.map((p) => `- ${p.name}`).join('\n')}\n`;
    if (state.design) message += `\nДизайн: ${state.design.name}\n`;
    if (state.features.length) message += `\nФункции:\n${state.features.map((f) => `- ${f.label}`).join('\n')}\n`;
    if (state.extras.length) message += `\nДополнительно:\n${state.extras.map((e) => `- ${e.label}`).join('\n')}\n`;
    return encodeURIComponent(message);
  }

  /* ---------- Render ---------- */

  function setPrice(value, suffix) {
    cancelAnimationFrame(priceFrame);
    const from = shownPrice;
    if (reduceMotion.matches || from === value) {
      shownPrice = value;
      priceEl.textContent = money(value) + suffix;
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / 600);
      shownPrice = Math.round(from + (value - from) * (1 - Math.pow(1 - t, 3)));
      priceEl.textContent = money(shownPrice) + suffix;
      if (t < 1) priceFrame = requestAnimationFrame(step);
    };
    priceFrame = requestAnimationFrame(step);
  }

  function render(result, state) {
    const empty = !result.hasSelection;
    receipt.classList.toggle('is-empty', empty);
    emptyEl.hidden = !empty;
    linesEl.hidden = empty;

    const nextLines = new Set();
    linesEl.innerHTML = result.lines.map((line) => {
      const key = `${line.label}:${line.price}`;
      nextLines.add(key);
      const style = previousLines.has(key) ? ' style="animation: none"' : '';
      return `<li${style}><span class="name">${line.label}</span><span class="dots"></span><span class="amount">${money(line.price)}</span></li>`;
    }).join('');
    previousLines = nextLines;

    const suffix = result.overLimit ? '+' : '';
    const time = formatTime(result.days);

    if (empty) {
      cancelAnimationFrame(priceFrame);
      shownPrice = 0;
      priceEl.textContent = '—';
      timeEl.textContent = '—';
      dockPrice.textContent = '—';
      dockTime.textContent = 'Выберите платформу или дизайн';
    } else {
      setPrice(result.shownTotal, suffix);
      timeEl.textContent = time;
      dockPrice.textContent = money(result.shownTotal) + suffix;
      dockTime.textContent = time === '—' ? 'Срок уточним' : `Срок ${time}`;
    }

    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => {
      live.textContent = empty
        ? 'Выберите платформу или дизайн, чтобы увидеть расчёт.'
        : `Оценка: ${money(result.shownTotal)}${suffix}, срок ${time}.`;
    }, 500);

    const message = buildMessage(state);
    sendLinks.forEach((link) => {
      const base = link.dataset.calcSend === 'whatsapp' ? WHATSAPP_URL : TELEGRAM_URL;
      link.href = `${base}?text=${message}`;
    });
  }

  function update() {
    const hasDev = checked('platform').length > 0;
    syncAvailability(hasDev);

    // Picking a platform unlocks build features: re-apply the chosen type's preset.
    if (hasDev && !hadDev && !hasManualFeatureChange) {
      const category = checked('category')[0];
      if (category && category !== 'custom') applyPreset(category);
    }
    hadDev = hasDev;

    const state = readState();
    render(estimate(state), state);
  }

  /* ---------- Events ---------- */

  form.addEventListener('change', (event) => {
    const target = event.target;
    if (target.name === 'category') {
      track('calculator_category_select', { category: target.value });
      if (target.value !== 'custom' && !hasManualFeatureChange) applyPreset(target.value);
    } else if (target.name === 'platform') {
      handlePlatformExclusivity(target);
    } else if (target.name === 'feature') {
      // Hand-picked features win over presets from now on.
      hasManualFeatureChange = true;
      input('category', 'custom').checked = true;
    }
    update();
  });

  calc.querySelector('[data-calc-reset]')?.addEventListener('click', () => {
    form.reset();
    hasManualFeatureChange = false;
    hadDev = false;
    update();
    track('calculator_reset');
  });

  sendLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const state = readState();
      const result = estimate(state);
      track('calculator_discuss_click', {
        total_price: result.hasSelection ? `${result.shownTotal}${result.overLimit ? '+' : ''}` : 'none',
        total_time: result.hasSelection ? formatTime(result.days) : 'none',
        category: state.category,
        platforms: state.platforms.map((p) => p.name).join(', '),
        design: state.design ? state.design.name : 'none',
        feature_count: state.features.length,
      });
      track('contact_select', { contact_method: link.dataset.calcSend });
    });
  });

  calc.querySelector('[data-calc-jump]')?.addEventListener('click', () => {
    summary.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  });

  // The floating total steps aside once the full receipt is on screen.
  new IntersectionObserver(([entry]) => {
    dock.classList.toggle('is-hidden', entry.isIntersecting);
  }, { threshold: 0.2 }).observe(summary);

  /* ---------- Analytics & deep links ---------- */

  const url = new URL(window.location.href);
  let openSource = 'scroll';

  // Old links used ?open=calculator; keep them working and tidy the URL.
  if (url.searchParams.get('open') === 'calculator') {
    url.searchParams.delete('open');
    url.hash = 'calculator';
    history.replaceState(null, '', url);
    section.scrollIntoView({ block: 'start' });
    openSource = 'deeplink';
  } else if (url.hash === '#calculator') {
    openSource = 'deeplink';
  }

  const openObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    track('calculator_open', { source: openSource });
    openObserver.disconnect();
  }, { threshold: 0.15 });
  openObserver.observe(section);

  update();
})();
