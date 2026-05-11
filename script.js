/* Walker GmbH – UI scripts */
(function () {
  'use strict';

  // ---------- Mobile drawer ----------
  const burger = document.querySelector('[data-burger]');
  const drawer = document.querySelector('[data-drawer]');
  const drawerClose = document.querySelector('[data-drawer-close]');
  let lastFocus = null;

  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    burger && burger.setAttribute('aria-expanded', 'true');
    const firstLink = drawer.querySelector('a, button');
    firstLink && firstLink.focus();
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    burger && burger.setAttribute('aria-expanded', 'false');
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  burger && burger.addEventListener('click', openDrawer);
  drawerClose && drawerClose.addEventListener('click', closeDrawer);
  drawer && drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer && drawer.getAttribute('aria-hidden') === 'false') closeDrawer();
  });

  // ---------- FAQ accordion (uses <details>, no JS needed except optional single-open) ----------
  // Native <details> handles open/close. No additional script needed.

  // ---------- Termin / Multi-step form ----------
  const form = document.querySelector('[data-termin-form]');
  if (form) {
    const steps = Array.from(form.querySelectorAll('.form-step'));
    const stepperItems = Array.from(document.querySelectorAll('.stepper__item'));
    const successView = document.querySelector('[data-success]');
    let current = 0;

    function showStep(idx) {
      steps.forEach((s, i) => s.setAttribute('data-active', i === idx ? 'true' : 'false'));
      stepperItems.forEach((it, i) => {
        it.classList.remove('stepper__item--active', 'stepper__item--done');
        if (i === idx) it.classList.add('stepper__item--active');
        else if (i < idx) it.classList.add('stepper__item--done');
      });
      current = idx;
      // scroll the form card into view (gentle)
      const card = form.closest('.form-card');
      if (card) {
        const top = card.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }

    function validateStep(idx) {
      const step = steps[idx];
      const required = step.querySelectorAll('[required]');
      let ok = true;
      required.forEach(el => {
        if (el.type === 'radio') {
          const name = el.name;
          const checked = step.querySelector(`input[name="${name}"]:checked`);
          if (!checked) ok = false;
        } else if (el.type === 'checkbox') {
          if (!el.checked) { ok = false; el.focus(); }
        } else if (!el.value.trim()) {
          ok = false;
          el.focus();
        }
      });
      if (!ok) {
        // Mark fields visually
        required.forEach(el => {
          if (el.type !== 'radio' && el.type !== 'checkbox' && !el.value.trim()) {
            el.style.borderColor = 'var(--c-red)';
          }
        });
      }
      return ok;
    }

    form.addEventListener('input', e => {
      if (e.target.style && e.target.style.borderColor) e.target.style.borderColor = '';
    });

    form.querySelectorAll('[data-next]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!validateStep(current)) return;
        if (current < steps.length - 1) showStep(current + 1);
      });
    });
    form.querySelectorAll('[data-prev]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (current > 0) showStep(current - 1);
      });
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!validateStep(current)) return;

      const data = new FormData(form);
      const lines = [];
      lines.push('Terminanfrage Walker GmbH Kfz-Reparaturen');
      lines.push('');
      lines.push('Anliegen: ' + (data.get('anliegen') || '-'));
      lines.push('');
      lines.push('Fahrzeug:');
      lines.push('  Marke: ' + (data.get('marke') || '-'));
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
  function showBanner() { banner && banner.setAttribute('aria-hidden', 'false'); }
  function hideBanner() { banner && banner.setAttribute('aria-hidden', 'true'); }

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
    iframe.title = 'Standort Walker GmbH Kfz-Reparaturen';
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    iframe.setAttribute('allowfullscreen', '');
    mapBox.innerHTML = '';
    mapBox.appendChild(iframe);
    mapBox.dataset.loaded = '1';
  }

  const consent = getConsent();
  if (consent) applyConsent(consent);
  else if (banner) showBanner();

  document.querySelectorAll('[data-consent]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-consent');
      if (action === 'all') setConsent({ necessary: true, maps: true });
      else if (action === 'necessary') setConsent({ necessary: true, maps: false });
      else if (action === 'open') showBanner();
    });
  });

  // Manual map load button (on consent)
  document.querySelectorAll('[data-map-load]').forEach(btn => {
    btn.addEventListener('click', () => setConsent({ necessary: true, maps: true }));
  });

  // ---------- Year ----------
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = String(new Date().getFullYear());
  });
})();
