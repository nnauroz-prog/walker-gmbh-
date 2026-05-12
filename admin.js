/* =========================================================
   Walker GmbH – Admin Logic (Skelett – wird in Etappe 4 erweitert)
   ========================================================= */

(function(){
  'use strict';

  var $ = function(s, root){ return (root||document).querySelector(s); };
  var $$ = function(s, root){ return Array.prototype.slice.call((root||document).querySelectorAll(s)); };

  function show(el){ if (el) el.style.display = ''; }
  function hide(el){ if (el) el.style.display = 'none'; }

  // ---------- Boot ----------
  document.addEventListener('DOMContentLoaded', function(){
    if (!window.walkerDb) return;

    var loginView = $('[data-admin-login]');
    var shellView = $('[data-admin-shell]');

    // Demo-Modus Hinweis
    if (!window.walkerDb.isProd) {
      var note = $('[data-demo-note]');
      if (note) note.hidden = false;
    }

    // Check session
    window.walkerDb.auth.isAuthed().then(function(isAuthed){
      if (isAuthed) {
        showShell();
      } else {
        showLogin();
      }
    });

    function showLogin(){ show(loginView); hide(shellView); }
    function showShell(){ hide(loginView); show(shellView); initShell(); }

    // ---------- Login form ----------
    var loginForm = $('[data-login-form]');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e){
        e.preventDefault();
        var email = loginForm.querySelector('[name="email"]').value.trim();
        var password = loginForm.querySelector('[name="password"]').value;
        var status = $('[data-login-status]');
        if (status) { status.textContent = 'Einloggen …'; status.className = 'alert alert--info'; }

        window.walkerDb.auth.signIn(email, password).then(function(res){
          if (res.ok) {
            if (status) { status.textContent = 'Eingeloggt.'; status.className = 'alert alert--success'; }
            showShell();
          } else {
            var msg = (res.error && res.error.message) ? res.error.message : 'Login fehlgeschlagen.';
            if (status) { status.textContent = msg; status.className = 'alert alert--error'; }
          }
        });
      });

      // Password toggle
      var toggle = loginForm.querySelector('[data-pw-toggle]');
      var pwInput = loginForm.querySelector('[name="password"]');
      if (toggle && pwInput) {
        toggle.addEventListener('click', function(){
          pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
          toggle.setAttribute('aria-label', pwInput.type === 'password' ? 'Passwort anzeigen' : 'Passwort verbergen');
        });
      }
    }

    // ---------- Shell ----------
    function initShell(){
      var emailEl = $('[data-admin-email]');
      if (emailEl) {
        window.walkerDb.auth.getEmail().then(function(email){
          if (email) emailEl.textContent = email;
        });
      }

      // Sign out
      $$('[data-signout]').forEach(function(b){
        b.addEventListener('click', function(){
          window.walkerDb.auth.signOut().then(function(){
            showLogin();
          });
        });
      });

      // Card → Panel switching
      $$('[data-open-panel]').forEach(function(card){
        card.addEventListener('click', function(){
          var name = card.getAttribute('data-open-panel');
          openPanel(name);
        });
      });
      $$('[data-back-overview]').forEach(function(b){
        b.addEventListener('click', function(){ openPanel(null); });
      });

      function openPanel(name){
        $$('[data-panel]').forEach(function(p){
          p.setAttribute('data-active', String(p.getAttribute('data-panel') === name));
        });
        var ov = $('[data-overview]');
        if (ov) ov.style.display = name ? 'none' : '';
      }
    }
  });
})();
