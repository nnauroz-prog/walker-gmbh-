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
