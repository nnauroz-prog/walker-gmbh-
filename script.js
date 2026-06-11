/* =========================================================
   Walker GmbH – Shared Frontend Logic
   ========================================================= */

(function(){
  'use strict';

  // ---------- Splash safety net ----------
  function hideSplash(){
    var s = document.getElementById('splash');
    if (s) s.classList.add('hide');
  }
  // Safety: always hide after 2.5s regardless
  setTimeout(hideSplash, 2500);
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(hideSplash, 50);
  } else {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(hideSplash, 50); });
  }

  // ---------- Safe-run wrapper ----------
  function safeRun(fn){
    try { fn(); }
    catch(e){
      console.warn('[walker] init error:', e);
      hideSplash();
    }
  }

  // ---------- Global error handlers ----------
  window.addEventListener('error', function(e){
    console.warn('[walker] error:', e && e.message);
    hideSplash();
  });
  window.addEventListener('unhandledrejection', function(e){
    console.warn('[walker] unhandled:', e && e.reason);
    hideSplash();
  });

  // ---------- Mobile drawer ----------
  safeRun(function(){
    var drawer = document.querySelector('[data-drawer]');
    var burger = document.querySelector('[data-burger]');
    if (!drawer || !burger) return;
    var lastFocus = null;
    var isOpen = false;

    function open(){
      if (isOpen) return;
      isOpen = true;
      lastFocus = document.activeElement;
      drawer.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('no-scroll');
      document.body.classList.add('no-scroll');
      burger.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(function(){
        var first = drawer.querySelector('[data-drawer-close]');
        if (first) { try { first.focus({ preventScroll: true }); } catch(e){ first.focus(); } }
      });
    }
    function close(){
      if (!isOpen) return;
      isOpen = false;
      drawer.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
      burger.setAttribute('aria-expanded', 'false');
      if (lastFocus && typeof lastFocus.focus === 'function') {
        try { lastFocus.focus({ preventScroll: true }); } catch(e){}
      }
    }

    burger.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      if (isOpen) close(); else open();
    });
    drawer.querySelectorAll('[data-drawer-close]').forEach(function(b){
      b.addEventListener('click', function(e){ e.preventDefault(); close(); });
    });
    drawer.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', close);
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && isOpen) close();
    });

    var rt;
    window.addEventListener('resize', function(){
      clearTimeout(rt);
      rt = setTimeout(function(){
        if (window.innerWidth > 980 && isOpen) close();
      }, 120);
    });
  });

  // ---------- Reveal on scroll ----------
  safeRun(function(){
    var els = document.querySelectorAll('.reveal');
    if (!els.length || !('IntersectionObserver' in window)) {
      els.forEach(function(el){ el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    els.forEach(function(el){ io.observe(el); });
  });

  // ---------- Cookie banner ----------
  safeRun(function(){
    var KEY = 'walker:cookie-consent';
    var banner = document.querySelector('[data-cookie-banner]');
    if (!banner) return;
    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch(e){}
    if (!stored) banner.setAttribute('aria-hidden', 'false');

    banner.querySelectorAll('[data-cookie]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var v = btn.getAttribute('data-cookie');
        try { localStorage.setItem(KEY, v); } catch(e){}
        banner.setAttribute('aria-hidden', 'true');
      });
    });
    document.querySelectorAll('[data-cookie-open]').forEach(function(b){
      b.addEventListener('click', function(){ banner.setAttribute('aria-hidden', 'false'); });
    });
  });

  // ---------- Hours rendering from DB + Live status ----------
  // Renders a [data-hours] table from custom owner data (overrides static markup).
  // Visible tables (with th/td cells) get text rows; tracker tables (hidden) get attribute-only rows.
  var DAY_LABELS_DE = { 0:'Sonntag', 1:'Montag', 2:'Dienstag', 3:'Mittwoch', 4:'Donnerstag', 5:'Freitag', 6:'Samstag' };
  var DAY_ORDER_MOSO = [1, 2, 3, 4, 5, 6, 0];

  function renderHoursTable(tbl, days) {
    var target = (tbl.tBodies && tbl.tBodies[0]) ? tbl.tBodies[0] : tbl;
    // Probe whether this table is the visible one (has any cell content)
    var isVisible = !!tbl.querySelector('tbody tr th, tbody tr td');
    var html = '';
    DAY_ORDER_MOSO.forEach(function(k){
      var d = null;
      for (var i = 0; i < days.length; i++) {
        if (Number(days[i].key) === k) { d = days[i]; break; }
      }
      if (!d) return;
      var attrs;
      if (d.closed || !d.from || !d.to) {
        attrs = 'data-day="' + k + '" data-closed';
      } else {
        attrs = 'data-day="' + k + '" data-from="' + d.from + '" data-to="' + d.to + '"';
      }
      if (isVisible) {
        var display = (d.closed || !d.from || !d.to) ? 'Geschlossen' : (d.from + ' – ' + d.to);
        var cls = (d.closed || !d.from || !d.to) ? ' class="closed"' : '';
        html += '<tr ' + attrs + cls + '><th>' + DAY_LABELS_DE[k] + '</th><td>' + display + '</td></tr>';
      } else {
        html += '<tr ' + attrs + '></tr>';
      }
    });
    target.innerHTML = html;
  }

  function applyCustomHoursIfAny() {
    if (!window.walkerDb || !window.walkerDb.get) return Promise.resolve(false);
    return window.walkerDb.get('hours').then(function(custom){
      if (!custom || !Array.isArray(custom.days) || custom.days.length !== 7) return false;
      document.querySelectorAll('[data-hours]').forEach(function(tbl){
        renderHoursTable(tbl, custom.days);
      });
      return true;
    }).catch(function(){ return false; });
  }

  // ---------- Contact: owner data overrides static markup ----------
  // - Every <a href^="tel:"> gets its href rebound to phoneRaw (automatic, no marker needed).
  // - Every <a href^="mailto:"> gets its href rebound to email (automatic).
  // - Opt-in text bindings via [data-bind="<key>"]: phone, email, street, city, district.
  function applyCustomContactIfAny() {
    if (!window.walkerDb || !window.walkerDb.get) return Promise.resolve();
    return window.walkerDb.get('contact').then(function(c){
      if (!c) return;

      if (c.phoneRaw) {
        document.querySelectorAll('a[href^="tel:"]').forEach(function(a){
          a.setAttribute('href', 'tel:' + c.phoneRaw);
        });
      }
      if (c.email) {
        document.querySelectorAll('a[href^="mailto:"]').forEach(function(a){
          a.setAttribute('href', 'mailto:' + c.email);
        });
      }

      var TEXT_KEYS = ['phone', 'email', 'street', 'city', 'district'];
      TEXT_KEYS.forEach(function(key){
        if (!c[key]) return;
        document.querySelectorAll('[data-bind="' + key + '"]').forEach(function(el){
          el.textContent = c[key];
        });
      });
    }).catch(function(){});
  }

  safeRun(function(){ applyCustomContactIfAny(); });

  // ---------- Images: owner-uploaded photos override defaults ----------
  // Markup: <img data-img-slot="logo|hero|diagnose|wartung|bremsen" src="...">
  // If walkerDb has 'image:<slot>' set, replace src and tear down any <picture>
  // <source> siblings so owner's URL wins regardless of MIME.
  function applyCustomImagesIfAny() {
    if (!window.walkerDb || !window.walkerDb.get) return;
    document.querySelectorAll('[data-img-slot]').forEach(function(img){
      var slot = img.getAttribute('data-img-slot');
      if (!slot) return;
      window.walkerDb.get('image:' + slot).then(function(v){
        if (!v || !v.url) return;
        img.setAttribute('src', v.url);
        img.removeAttribute('srcset');
        var picture = img.closest('picture');
        if (picture) {
          picture.querySelectorAll('source').forEach(function(s){ s.remove(); });
        }
      }).catch(function(){});
    });
  }

  safeRun(function(){ applyCustomImagesIfAny(); });

  // ---------- Services: owner data overrides static markup on leistungen.html ----------
  // Each card has data-service-id on the <article>, and its first
  // [data-service-title] / [data-service-body] children get updated.
  // Title via textContent (no HTML), body via innerHTML (Owner-only admin, links allowed).
  function applyCustomServicesIfAny() {
    if (!window.walkerDb || !window.walkerDb.get) return Promise.resolve();
    var cards = document.querySelectorAll('[data-service-id]');
    if (!cards.length) return Promise.resolve();
    return window.walkerDb.get('services').then(function(data){
      if (!data || !Array.isArray(data.items)) return;
      var byId = {};
      data.items.forEach(function(it){ if (it && it.id) byId[it.id] = it; });
      cards.forEach(function(card){
        var id = card.getAttribute('data-service-id');
        var it = byId[id];
        if (!it) return;
        if (it.title) {
          var tEl = card.querySelector('[data-service-title]');
          if (tEl) tEl.textContent = it.title;
        }
        if (it.body) {
          var bEl = card.querySelector('[data-service-body]');
          if (bEl) bEl.innerHTML = it.body;
        }
      });
    }).catch(function(){});
  }

  safeRun(function(){ applyCustomServicesIfAny(); });

  safeRun(function(){
    var nodes = document.querySelectorAll('[data-live-status]');
    if (!nodes.length) {
      // Even without live-status badges, custom hours can rewrite the hours table on kontakt.html
      applyCustomHoursIfAny();
      return;
    }

    // Parse rules from any [data-hours] table currently in DOM.
    // Static format examples:
    //   <tr data-day="1-4" data-from="07:30" data-to="18:30">  (Mon–Thu)
    //   <tr data-day="5"   data-from="07:00" data-to="12:00">  (Fri)
    //   <tr data-day="6"   data-closed>                          (Sat)
    //   <tr data-day="0"   data-closed>                          (Sun)
    var ruleSet = [];

    function parseHoursIntoRuleset() {
      ruleSet = [];
      var src = document.querySelector('[data-hours]');
      if (!src) return;
      src.querySelectorAll('[data-day]').forEach(function(row){
        var days = row.getAttribute('data-day') || '';
        var closed = row.hasAttribute('data-closed');
        var from = row.getAttribute('data-from') || '';
        var to = row.getAttribute('data-to') || '';
        days.split(',').forEach(function(d){
          d = d.trim();
          var range = d.split('-');
          var start = parseInt(range[0], 10);
          var end = range[1] ? parseInt(range[1], 10) : start;
          if (isNaN(start)) return;
          for (var i = start; i <= end; i++) {
            ruleSet[(i + 7) % 7] = { closed: closed, from: from, to: to };
          }
        });
      });
    }

    function evaluate(){
      var now = new Date();
      var weekday = now.getDay(); // 0 = Sonntag, 1 = Montag, ...
      var rule = ruleSet[weekday];
      if (!rule || rule.closed || !rule.from || !rule.to) {
        update(false);
        return;
      }
      var fromParts = rule.from.split(':');
      var toParts = rule.to.split(':');
      var fromMin = parseInt(fromParts[0],10) * 60 + parseInt(fromParts[1],10);
      var toMin = parseInt(toParts[0],10) * 60 + parseInt(toParts[1],10);
      var nowMin = now.getHours() * 60 + now.getMinutes();
      update(nowMin >= fromMin && nowMin < toMin);
    }

    function update(open){
      nodes.forEach(function(n){
        n.classList.toggle('is-open', open);
        n.classList.toggle('is-closed', !open);
        var label = n.querySelector('[data-live-label]');
        if (label) label.textContent = open ? 'Aktuell geöffnet' : 'Aktuell geschlossen';
      });
    }

    // Initial: parse static markup so the badge renders immediately.
    parseHoursIntoRuleset();
    evaluate();
    setInterval(evaluate, 60000);

    // Then check for owner-customized hours; if present, rewrite tables and re-evaluate.
    applyCustomHoursIfAny().then(function(changed){
      if (changed) {
        parseHoursIntoRuleset();
        evaluate();
      }
    });
  });

  // ---------- Year ----------
  safeRun(function(){
    document.querySelectorAll('[data-year]').forEach(function(el){
      el.textContent = String(new Date().getFullYear());
    });
  });

  // ---------- Active nav highlighting ----------
  safeRun(function(){
    var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (path === '') path = 'index.html';
    document.querySelectorAll('[data-nav]').forEach(function(a){
      var href = (a.getAttribute('href') || '').toLowerCase();
      if (href === path || (path === 'index.html' && (href === '' || href === 'index.html' || href === './'))) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
    });
  });

  // ---------- Hinweisbanner (Notice from owner) ----------
  safeRun(function(){
    var holder = document.querySelector('[data-notice]');
    if (!holder || !window.walkerDb) return;
    window.walkerDb.get('notice').then(function(value){
      if (value && value.enabled && value.text) {
        holder.textContent = value.text;
        holder.hidden = false;
      }
    });
  });

  // ---------- Header scrolled state ----------
  safeRun(function(){
    var header = document.querySelector('.header');
    if (!header) return;
    var ticking = false;
    function apply(){
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener('scroll', function(){
      if (!ticking) { window.requestAnimationFrame(apply); ticking = true; }
    }, { passive: true });
    apply();
  });

  // ---------- Hero zoom-in on load ----------
  safeRun(function(){
    var hero = document.querySelector('[data-hero]');
    if (!hero) return;
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ hero.classList.add('is-loaded'); });
    });
  });

  // ---------- Custom Cursor (Desktop only, mix-blend-mode dot) ----------
  safeRun(function(){
    if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var dot = document.createElement('div');
    dot.className = 'cursor-dot';
    document.body.appendChild(dot);
    var x = 0, y = 0, tx = 0, ty = 0;
    document.addEventListener('mousemove', function(e){ tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop(){
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      dot.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
    var hoverSel = 'a, button, [role="button"], .hs-card, summary, input, textarea, select, .lookup__plate';
    document.addEventListener('mouseover', function(e){
      if (e.target.closest && e.target.closest(hoverSel)) dot.classList.add('is-hover');
    });
    document.addEventListener('mouseout', function(e){
      if (e.target.closest && e.target.closest(hoverSel)) dot.classList.remove('is-hover');
    });
  });

})();
