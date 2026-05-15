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

  // ---------- Live status (Aktuell geöffnet) ----------
  safeRun(function(){
    var nodes = document.querySelectorAll('[data-live-status]');
    if (!nodes.length) return;

    // Parse hours table or data-* attributes. Expected format:
    //   <table data-hours>
    //     <tr data-day="1-4" data-from="07:30" data-to="18:30">...</tr>
    //     <tr data-day="5" data-from="07:00" data-to="12:00">...</tr>
    //     <tr data-day="6" data-closed>...</tr>
    //     <tr data-day="0" data-closed>...</tr>
    //   </table>
    var ruleSet = [];
    var src = document.querySelector('[data-hours]');
    if (src) {
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
      var weekday = now.getDay(); // 0 = Sonntag
      // Map: 0 So, 1 Mo, ... 6 Sa
      var rule = ruleSet[weekday === 0 ? 0 : weekday];
      if (!rule || rule.closed) {
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

    evaluate();
    setInterval(evaluate, 60000);
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
