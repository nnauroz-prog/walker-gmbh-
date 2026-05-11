/* Walker GmbH – UI scripts */
(function () {
  'use strict';

  // ---------- Mobile drawer (robust) ----------
  const drawer = document.querySelector('[data-drawer]');
  const burger = document.querySelector('[data-burger]');
  let lastFocus = null;
  let isOpen = false;

  function openDrawer() {
    if (!drawer || isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement;
    drawer.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('no-scroll');
    document.body.classList.add('no-scroll');
    if (burger) burger.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => {
      const closeBtn = drawer.querySelector('[data-drawer-close]');
      if (closeBtn) {
        try { closeBtn.focus({ preventScroll: true }); } catch (_) { closeBtn.focus(); }
      }
    });
  }

  function closeDrawer() {
    if (!drawer || !isOpen) return;
    isOpen = false;
    drawer.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('no-scroll');
    document.body.classList.remove('no-scroll');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try { lastFocus.focus({ preventScroll: true }); } catch (_) { try { lastFocus.focus(); } catch (__) {} }
    }
  }

  if (burger) {
    burger.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (isOpen) closeDrawer();
      else openDrawer();
    });
  }

  if (drawer) {
    // Close button
    drawer.querySelectorAll('[data-drawer-close]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        closeDrawer();
      });
    });
    // Any nav link inside drawer closes it
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        closeDrawer();
      });
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) closeDrawer();
  });

  // Close drawer if window resized to desktop width
  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (window.innerWidth > 920 && isOpen) closeDrawer();
    }, 120);
  });

  // ---------- FAQ accordion ----------
  // Native <details> handles open/close — no extra JS required.

  // ---------- Termin / Multi-step form ----------
  const form = document.querySelector('[data-termin-form]');
  if (form) {
    const steps = Array.from(form.querySelectorAll('.form-step'));
    const stepperItems = Array.from(document.querySelectorAll('.stepper__item'));
    const successView = document.querySelector('[data-success]');
    let current = 0;

    function showStep(idx) {
      steps.forEach(function (s, i) {
        s.setAttribute('data-active', i === idx ? 'true' : 'false');
      });
      stepperItems.forEach(function (it, i) {
        it.classList.remove('stepper__item--active', 'stepper__item--done');
        if (i === idx) it.classList.add('stepper__item--active');
        else if (i < idx) it.classList.add('stepper__item--done');
      });
      current = idx;
      const card = form.closest('.form-card');
      if (card) {
        const top = card.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    }

    function validateStep(idx) {
      const step = steps[idx];
      const required = step.querySelectorAll('[required]');
      let ok = true;
      required.forEach(function (el) {
        if (el.type === 'radio') {
          const checked = step.querySelector('input[name="' + el.name + '"]:checked');
          if (!checked) ok = false;
        } else if (el.type === 'checkbox') {
          if (!el.checked) { ok = false; el.focus(); }
        } else if (!el.value.trim()) {
          ok = false;
          el.focus();
        }
      });
      if (!ok) {
        required.forEach(function (el) {
          if (el.type !== 'radio' && el.type !== 'checkbox' && !el.value.trim()) {
            el.style.borderColor = '#DC2626';
          }
        });
      }
      return ok;
    }

    form.addEventListener('input', function (e) {
      if (e.target.style && e.target.style.borderColor) e.target.style.borderColor = '';
    });

    form.querySelectorAll('[data-next]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!validateStep(current)) return;
        if (current < steps.length - 1) showStep(current + 1);
      });
    });
    form.querySelectorAll('[data-prev]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (current > 0) showStep(current - 1);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateStep(current)) return;

      const data = new FormData(form);
      const lines = [];
      lines.push('Terminanfrage Walker GmbH – Mercedes-Benz Spezialist');
      lines.push('');
      lines.push('Anliegen: ' + (data.get('anliegen') || '-'));
      lines.push('');
      lines.push('Fahrzeug:');
      lines.push('  Modellreihe / Marke: ' + (data.get('marke') || '-'));
      lines.push('  Modell: ' + (data.get('modell') || '-'));
      lines.push('  Baujahr: ' + (data.get('baujahr') || '-'));
      lines.push('  Kennzeichen: ' + (data.get('kennzeichen') || '-'));
      lines.push('  Kilometerstand: ' + (data.get('km') || '-'));
      lines.push('');
      lines.push('Kontakt:');
      lines.push('  Name: ' + (data.get('name') || '-'));
      lines.push('  Telefon: ' + (data.get('telefon') || '-'));
      lines.push('  E-Mail: ' + (data.get('email') || '-'));
      lines.push('  Bevorzugte Kontaktart: ' + (data.get('kontaktart') || '-'));
      lines.push('');
      lines.push('Wunschtermin: ' + (data.get('wunschtermin') || '-'));
      lines.push('');
      lines.push('Nachricht:');
      lines.push(data.get('nachricht') || '-');

      const subject = 'Terminanfrage – ' + (data.get('name') || 'Kunde');
      const body = lines.join('\n');
      const mailto = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

      window.location.href = mailto;

      if (successView) {
        form.style.display = 'none';
        successView.hidden = false;
        successView.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    showStep(0);
  }

  // ---------- Cookie consent ----------
  const STORAGE_KEY = 'walker-consent-v1';
  const banner = document.querySelector('[data-cookie]');
  const mapBox = document.querySelector('[data-map]');

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch (e) {}
    applyConsent(value);
    hideBanner();
  }
  function showBanner() { if (banner) banner.setAttribute('aria-hidden', 'false'); }
  function hideBanner() { if (banner) banner.setAttribute('aria-hidden', 'true'); }

  function applyConsent(value) {
    if (!mapBox) return;
    if (value && value.maps) loadMap();
  }

  function loadMap() {
    if (!mapBox || mapBox.dataset.loaded === '1') return;
    const src = mapBox.getAttribute('data-map-src');
    if (!src) return;
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.loading = 'lazy';
    iframe.title = 'Standort Walker GmbH';
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    iframe.setAttribute('allowfullscreen', '');
    mapBox.innerHTML = '';
    mapBox.appendChild(iframe);
    mapBox.dataset.loaded = '1';
  }

  const consent = getConsent();
  if (consent) applyConsent(consent);
  else if (banner) showBanner();

  document.querySelectorAll('[data-consent]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const action = btn.getAttribute('data-consent');
      if (action === 'all') setConsent({ necessary: true, maps: true });
      else if (action === 'necessary') setConsent({ necessary: true, maps: false });
      else if (action === 'open') showBanner();
    });
  });

  document.querySelectorAll('[data-map-load]').forEach(function (btn) {
    btn.addEventListener('click', function () { setConsent({ necessary: true, maps: true }); });
  });

  // ---------- Year ----------
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
