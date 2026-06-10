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
        if (name === 'vehicle-status') renderVehicleStatus();
        if (name === 'notice') loadNotice();
        if (name === 'hours') loadHours();
        if (name === 'contact') loadContact();
      }

      // ===== Hinweisbanner-Editor =====
      var noticeForm = $('[data-notice-form]');
      var noticeStatusEl = $('[data-notice-status]');

      function setNoticeStatus(type, msg){
        if (!noticeStatusEl) return;
        noticeStatusEl.innerHTML = msg ? '<div class="alert alert--' + type + '">' + msg + '</div>' : '';
      }

      function noticePreviewUpdate(){
        var prev = $('[data-notice-preview]');
        if (!prev || !noticeForm) return;
        var text = noticeForm.querySelector('[name="text"]').value.trim();
        var enabled = noticeForm.querySelector('[name="enabled"]').checked;
        prev.textContent = text || '—';
        prev.style.opacity = (enabled && text) ? '1' : '0.45';
      }

      function loadNotice(){
        if (!noticeForm) return;
        window.walkerDb.get('notice').then(function(value){
          noticeForm.querySelector('[name="text"]').value = (value && value.text) || '';
          noticeForm.querySelector('[name="enabled"]').checked = !!(value && value.enabled);
          noticePreviewUpdate();
        });
      }

      if (noticeForm) {
        noticeForm.addEventListener('input', noticePreviewUpdate);

        noticeForm.addEventListener('submit', function(e){
          e.preventDefault();
          var text = noticeForm.querySelector('[name="text"]').value.trim();
          var enabled = noticeForm.querySelector('[name="enabled"]').checked;
          if (enabled && !text) {
            setNoticeStatus('error', 'Banner-Text fehlt. Entweder Text eintragen oder Haken entfernen.');
            return;
          }
          window.walkerDb.set('notice', { enabled: enabled, text: text }).then(function(res){
            if (res && res.ok === false) {
              setNoticeStatus('error', 'Speichern fehlgeschlagen: ' + ((res.error && res.error.message) || 'unbekannter Fehler'));
            } else {
              setNoticeStatus('success', enabled ? 'Gespeichert. Banner ist jetzt auf allen Seiten sichtbar.' : 'Gespeichert. Banner ist ausgeblendet.');
              setTimeout(function(){ setNoticeStatus('', ''); }, 2500);
            }
          });
        });

        var noticeClearBtn = $('[data-notice-clear]');
        if (noticeClearBtn) noticeClearBtn.addEventListener('click', function(){
          noticeForm.querySelector('[name="text"]').value = '';
          noticeForm.querySelector('[name="enabled"]').checked = false;
          window.walkerDb.set('notice', { enabled: false, text: '' }).then(function(){
            noticePreviewUpdate();
            setNoticeStatus('success', 'Banner gelöscht.');
            setTimeout(function(){ setNoticeStatus('', ''); }, 2500);
          });
        });
      }

      // ===== Öffnungszeiten-Editor =====
      var DEFAULT_HOURS = {
        days: [
          { key: 1, closed: false, from: '07:30', to: '18:30' },
          { key: 2, closed: false, from: '07:30', to: '18:30' },
          { key: 3, closed: false, from: '07:30', to: '18:30' },
          { key: 4, closed: false, from: '07:30', to: '18:30' },
          { key: 5, closed: false, from: '07:00', to: '12:00' },
          { key: 6, closed: true,  from: '', to: '' },
          { key: 0, closed: true,  from: '', to: '' }
        ]
      };
      var DAY_LABELS = { 0:'Sonntag', 1:'Montag', 2:'Dienstag', 3:'Mittwoch', 4:'Donnerstag', 5:'Freitag', 6:'Samstag' };

      var hoursForm = $('[data-hours-form]');
      var hoursStatusEl = $('[data-hours-status]');

      function setHoursStatus(type, msg){
        if (!hoursStatusEl) return;
        hoursStatusEl.innerHTML = msg ? '<div class="alert alert--' + type + '">' + msg + '</div>' : '';
      }

      function applyHoursValuesToForm(days){
        if (!hoursForm) return;
        days.forEach(function(d){
          var row = hoursForm.querySelector('[data-row-day="' + d.key + '"]');
          if (!row) return;
          row.querySelector('[data-closed]').checked = !!d.closed;
          row.querySelector('[data-from]').value = d.from || '';
          row.querySelector('[data-to]').value = d.to || '';
        });
      }

      function readHoursFromForm(){
        if (!hoursForm) return null;
        var days = [];
        $$('[data-row-day]', hoursForm).forEach(function(row){
          var key = parseInt(row.getAttribute('data-row-day'), 10);
          var closed = row.querySelector('[data-closed]').checked;
          var from = row.querySelector('[data-from]').value;
          var to = row.querySelector('[data-to]').value;
          days.push({ key: key, closed: closed, from: from, to: to });
        });
        return { days: days };
      }

      function loadHours(){
        if (!hoursForm) return;
        window.walkerDb.get('hours').then(function(value){
          var data = (value && Array.isArray(value.days) && value.days.length === 7) ? value : DEFAULT_HOURS;
          applyHoursValuesToForm(data.days);
          setHoursStatus('', '');
        });
      }

      if (hoursForm) {
        hoursForm.addEventListener('submit', function(e){
          e.preventDefault();
          var data = readHoursFromForm();
          // Validate non-closed days
          for (var i = 0; i < data.days.length; i++) {
            var d = data.days[i];
            if (d.closed) continue;
            if (!d.from || !d.to) {
              setHoursStatus('error', DAY_LABELS[d.key] + ': Bitte „Geschlossen" anhaken oder Von- und Bis-Zeit setzen.');
              return;
            }
            if (d.from >= d.to) {
              setHoursStatus('error', DAY_LABELS[d.key] + ': „Schließt" muss später sein als „Öffnet".');
              return;
            }
          }
          window.walkerDb.set('hours', data).then(function(res){
            if (res && res.ok === false) {
              setHoursStatus('error', 'Speichern fehlgeschlagen: ' + ((res.error && res.error.message) || 'unbekannter Fehler'));
            } else {
              setHoursStatus('success', 'Öffnungszeiten gespeichert. Beim nächsten Seitenaufruf werden sie überall übernommen.');
              setTimeout(function(){ setHoursStatus('', ''); }, 3500);
            }
          });
        });

        var hoursResetBtn = $('[data-hours-reset]');
        if (hoursResetBtn) hoursResetBtn.addEventListener('click', function(){
          if (!window.confirm('Standard-Öffnungszeiten (Mo–Do 07:30–18:30, Fr 07:00–12:00, Sa/So geschlossen) wiederherstellen? Noch nicht gespeichert — Sie müssen anschließend auf „Speichern" klicken.')) return;
          applyHoursValuesToForm(DEFAULT_HOURS.days);
          setHoursStatus('info', 'Standardwerte eingetragen. Klicken Sie auf „Speichern", um sie zu übernehmen.');
        });
      }

      // ===== Kontakt-Editor =====
      var CONTACT_FIELDS = ['street', 'city', 'district', 'phone', 'phoneRaw', 'email'];
      var contactForm = $('[data-contact-form]');
      var contactStatusEl = $('[data-contact-status]');

      function setContactStatus(type, msg){
        if (!contactStatusEl) return;
        contactStatusEl.innerHTML = msg ? '<div class="alert alert--' + type + '">' + msg + '</div>' : '';
      }

      function loadContact(){
        if (!contactForm) return;
        window.walkerDb.get('contact').then(function(value){
          if (!value) return;
          CONTACT_FIELDS.forEach(function(k){
            var input = contactForm.querySelector('[name="' + k + '"]');
            if (input && typeof value[k] === 'string') input.value = value[k];
          });
          setContactStatus('', '');
        });
      }

      if (contactForm) {
        contactForm.addEventListener('submit', function(e){
          e.preventDefault();
          var data = {};
          CONTACT_FIELDS.forEach(function(k){
            var input = contactForm.querySelector('[name="' + k + '"]');
            data[k] = input ? input.value.trim() : '';
          });
          if (data.phoneRaw && !/^\+?[0-9]+$/.test(data.phoneRaw)) {
            setContactStatus('error', 'Telefon (tel:-Link): nur Ziffern und optional ein führendes „+". Keine Leerzeichen oder Bindestriche.');
            return;
          }
          if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            setContactStatus('error', 'E-Mail-Format wirkt nicht korrekt. Bitte prüfen.');
            return;
          }
          window.walkerDb.set('contact', data).then(function(res){
            if (res && res.ok === false) {
              setContactStatus('error', 'Speichern fehlgeschlagen: ' + ((res.error && res.error.message) || 'unbekannter Fehler'));
            } else {
              setContactStatus('success', 'Kontaktdaten gespeichert.');
              setTimeout(function(){ setContactStatus('', ''); }, 3000);
            }
          });
        });
      }

      // ===== Vehicle Status Editor =====
      var STATUS_LABEL = {
        received:      'Angenommen',
        in_progress:   'In Bearbeitung',
        waiting_parts: 'Warten auf Teile',
        ready:         'Abholbereit',
        done:          'Abgeschlossen'
      };

      function relTime(ts){
        var d = new Date(ts);
        var diff = (Date.now() - d.getTime()) / 1000;
        if (diff < 60) return 'gerade eben';
        if (diff < 3600) return 'vor ' + Math.floor(diff/60) + ' Min.';
        if (diff < 86400) return 'vor ' + Math.floor(diff/3600) + ' Std.';
        var days = Math.floor(diff/86400);
        return days === 1 ? 'gestern' : 'vor ' + days + ' Tagen';
      }

      function renderVehicleStatus(){
        if (!window.walkerDb) return;
        var tbody = $('[data-vs-table] tbody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" style="color:var(--muted);">Lade …</td></tr>';
        window.walkerDb.listVehicleStatus().then(function(rows){
          if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="color:var(--muted);padding:24px;text-align:center;">Noch keine Einträge. Pflegen Sie oben das erste Kennzeichen ein.</td></tr>';
            updateBadge(0);
            return;
          }
          tbody.innerHTML = '';
          var readyCount = 0;
          rows.forEach(function(r){
            if (r.status === 'ready') readyCount++;
            var tr = document.createElement('tr');
            tr.dataset.plate = r.plate;
            tr.innerHTML = '' +
              '<td><strong style="font-family:var(--font-display);letter-spacing:0.04em;">' + escapeHtml(r.plate_display || r.plate) + '</strong>' +
                (r.pin ? ' <small style="color:var(--muted);">PIN gesetzt</small>' : '') + '</td>' +
              '<td>' + buildStatusSelect(r.status) + '</td>' +
              '<td><input type="text" class="vs-note-input" value="' + escapeHtmlAttr(r.public_note || '') + '" placeholder="Hinweis (optional)" style="width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:6px;font:inherit;font-size:0.9rem;"></td>' +
              '<td style="color:var(--muted);font-size:0.86rem;">' + relTime(r.updated_at) + '</td>' +
              '<td style="white-space:nowrap;"><button class="btn--link vs-save" type="button" style="color:var(--blue);font-weight:600;">Speichern</button> · <button class="btn--link vs-delete" type="button" style="color:#B91C1C;">Löschen</button></td>';
            tbody.appendChild(tr);
          });
          updateBadge(readyCount);
          attachRowHandlers();
        });
      }

      function buildStatusSelect(current){
        var opts = ['received','in_progress','waiting_parts','ready','done'];
        var html = '<select class="vs-status-select" style="padding:8px 10px;border:1px solid var(--line);border-radius:6px;font:inherit;font-size:0.9rem;">';
        opts.forEach(function(o){
          html += '<option value="' + o + '"' + (o === current ? ' selected' : '') + '>' + STATUS_LABEL[o] + '</option>';
        });
        html += '</select>';
        return html;
      }

      function escapeHtml(s){
        return String(s||'').replace(/[&<>"']/g, function(c){
          return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
        });
      }
      function escapeHtmlAttr(s){ return escapeHtml(s); }

      function attachRowHandlers(){
        $$('[data-vs-table] tr[data-plate]').forEach(function(tr){
          var plate = tr.dataset.plate;
          var statusSel = tr.querySelector('.vs-status-select');
          var noteInput = tr.querySelector('.vs-note-input');
          var saveBtn = tr.querySelector('.vs-save');
          var deleteBtn = tr.querySelector('.vs-delete');

          if (saveBtn) saveBtn.addEventListener('click', function(){
            saveBtn.textContent = 'Speichere …';
            window.walkerDb.upsertVehicleStatus({
              plate: plate,
              plate_display: tr.querySelector('strong').textContent.trim(),
              status: statusSel.value,
              public_note: noteInput.value
            }).then(function(){
              saveBtn.textContent = 'Gespeichert ✓';
              setTimeout(function(){ saveBtn.textContent = 'Speichern'; renderVehicleStatus(); }, 800);
            });
          });

          if (deleteBtn) deleteBtn.addEventListener('click', function(){
            if (!confirm('Eintrag löschen?')) return;
            window.walkerDb.deleteVehicleStatus(plate).then(function(){
              renderVehicleStatus();
            });
          });

          // Auto-save on status change
          if (statusSel) statusSel.addEventListener('change', function(){
            window.walkerDb.upsertVehicleStatus({
              plate: plate,
              plate_display: tr.querySelector('strong').textContent.trim(),
              status: statusSel.value,
              public_note: noteInput.value
            }).then(renderVehicleStatus);
          });
        });
      }

      function updateBadge(count){
        var b = $('[data-status-badge]');
        if (!b) return;
        if (count > 0) { b.hidden = false; b.textContent = String(count); }
        else b.hidden = true;
      }

      // Quick-add form
      var addForm = $('[data-vs-add]');
      var addStatus = $('[data-vs-status]');
      if (addForm) {
        addForm.addEventListener('submit', function(e){
          e.preventDefault();
          var plate = addForm.querySelector('[name="plate"]').value.trim().toUpperCase();
          var status = addForm.querySelector('[name="status"]').value;
          var note = addForm.querySelector('[name="public_note"]').value.trim();
          if (!plate) return;
          addStatus.innerHTML = '';
          window.walkerDb.upsertVehicleStatus({
            plate: plate,
            plate_display: plate,
            status: status,
            public_note: note
          }).then(function(res){
            if (res.ok) {
              addStatus.innerHTML = '<div class="alert alert--success">Gespeichert.</div>';
              addForm.reset();
              setTimeout(function(){ addStatus.innerHTML = ''; }, 2000);
              renderVehicleStatus();
            } else {
              addStatus.innerHTML = '<div class="alert alert--error">Speichern fehlgeschlagen: ' + ((res.error && res.error.message) || 'unbekannter Fehler') + '</div>';
            }
          });
        });
      }
    }
  });
})();
