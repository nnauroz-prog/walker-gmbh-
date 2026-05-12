/* =========================================================
   Walker GmbH – Unified Data Layer (db.js)
   =========================================================
   Single source for all data operations. Switches between
   localStorage (Demo-Modus) and Supabase based on config.js.

   Public API:
     window.walkerDb = {
       isProd, ready(), get, set, remove,
       uploadImage, subscribe,
       auth: { signIn, signOut, isAuthed, getEmail, resetPassword, updatePassword, inviteUser },
       addServiceRequest, listServiceRequests,
       updateServiceRequestStatus, deleteServiceRequest
     }
========================================================= */

(function(global){
  'use strict';

  var cfg = global.walkerConfig || {};
  var SUPABASE_URL = cfg.SUPABASE_URL || '';
  var SUPABASE_KEY = cfg.SUPABASE_ANON_KEY || '';
  var isProd = !!(SUPABASE_URL && SUPABASE_KEY);

  // ---------- localStorage helpers (Fallback / Cache) ----------
  var LS_PREFIX = 'walker:';
  function lsKey(k){ return LS_PREFIX + k; }
  function lsGet(k){
    try { var v = localStorage.getItem(lsKey(k)); return v ? JSON.parse(v) : null; }
    catch(e){ return null; }
  }
  function lsSet(k, v){
    try { localStorage.setItem(lsKey(k), JSON.stringify(v)); return true; }
    catch(e){ return false; }
  }
  function lsRemove(k){
    try { localStorage.removeItem(lsKey(k)); return true; }
    catch(e){ return false; }
  }

  // ---------- Supabase client (lazy load via CDN) ----------
  var supabaseClient = null;
  var supabasePromise = null;
  function loadSupabase(){
    if (!isProd) return Promise.resolve(null);
    if (supabasePromise) return supabasePromise;
    supabasePromise = new Promise(function(resolve){
      if (global.supabase && typeof global.supabase.createClient === 'function') {
        resolve(global.supabase);
        return;
      }
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.async = true;
      s.onload = function(){ resolve(global.supabase); };
      s.onerror = function(){ resolve(null); };
      document.head.appendChild(s);
    }).then(function(supa){
      if (supa && supa.createClient) {
        try {
          supabaseClient = supa.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: { persistSession: true, autoRefreshToken: true }
          });
        } catch(e){ supabaseClient = null; }
      }
      return supabaseClient;
    });
    return supabasePromise;
  }

  // ---------- ready() ----------
  function ready(){
    return loadSupabase().then(function(){ return { isProd: isProd, supabase: supabaseClient }; });
  }

  // ---------- Generic content (key/value) ----------
  function get(key){
    if (!isProd) {
      return Promise.resolve(lsGet('content:' + key));
    }
    return ready().then(function(){
      if (!supabaseClient) return lsGet('content:' + key);
      return supabaseClient
        .from('content')
        .select('data')
        .eq('id', key)
        .maybeSingle()
        .then(function(res){
          if (res.error) return lsGet('content:' + key);
          var data = res.data ? res.data.data : null;
          if (data) lsSet('content:' + key, data);  // cache
          return data;
        });
    });
  }

  function set(key, value){
    lsSet('content:' + key, value);  // always cache locally
    if (!isProd) return Promise.resolve({ ok: true, local: true });
    return ready().then(function(){
      if (!supabaseClient) return { ok: true, local: true };
      return supabaseClient
        .from('content')
        .upsert({ id: key, data: value })
        .then(function(res){
          return { ok: !res.error, error: res.error };
        });
    });
  }

  function remove(key){
    lsRemove('content:' + key);
    if (!isProd) return Promise.resolve({ ok: true });
    return ready().then(function(){
      if (!supabaseClient) return { ok: true };
      return supabaseClient
        .from('content')
        .delete()
        .eq('id', key)
        .then(function(res){ return { ok: !res.error, error: res.error }; });
    });
  }

  // ---------- Storage / Images ----------
  function uploadImage(file, slot){
    if (!file) return Promise.reject(new Error('Keine Datei'));
    if (!isProd) {
      // Demo-Modus: data-URL im localStorage
      return new Promise(function(resolve, reject){
        var reader = new FileReader();
        reader.onload = function(e){
          var dataUrl = e.target.result;
          lsSet('image:' + slot, dataUrl);
          resolve({ ok: true, url: dataUrl, local: true });
        };
        reader.onerror = function(){ reject(new Error('Lesefehler')); };
        reader.readAsDataURL(file);
      });
    }
    return ready().then(function(){
      if (!supabaseClient) throw new Error('Supabase nicht verfügbar');
      var path = slot + '/' + Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      return supabaseClient.storage
        .from('images')
        .upload(path, file, { cacheControl: '3600', upsert: true })
        .then(function(res){
          if (res.error) throw res.error;
          var pub = supabaseClient.storage.from('images').getPublicUrl(path);
          var url = pub.data && pub.data.publicUrl ? pub.data.publicUrl : '';
          return { ok: true, url: url, path: path };
        });
    });
  }

  // ---------- Realtime subscribe ----------
  function subscribe(cb){
    if (typeof cb !== 'function') return function(){};
    if (!isProd) return function(){};
    var unsub = null;
    ready().then(function(){
      if (!supabaseClient) return;
      var channel = supabaseClient.channel('walker-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'content' }, cb)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, cb)
        .subscribe();
      unsub = function(){ try { supabaseClient.removeChannel(channel); } catch(e){} };
    });
    return function(){ if (unsub) unsub(); };
  }

  // ---------- Auth ----------
  var auth = {
    signIn: function(email, password){
      if (!isProd) return Promise.resolve({ ok: false, error: { message: 'Demo-Modus: Supabase nicht konfiguriert. Siehe UEBERGABE.md.' } });
      return ready().then(function(){
        if (!supabaseClient) return { ok: false, error: { message: 'Supabase-Client nicht verfügbar' } };
        return supabaseClient.auth.signInWithPassword({ email: email, password: password })
          .then(function(res){ return { ok: !res.error, data: res.data, error: res.error }; });
      });
    },
    signOut: function(){
      if (!isProd) return Promise.resolve({ ok: true });
      return ready().then(function(){
        if (!supabaseClient) return { ok: true };
        return supabaseClient.auth.signOut().then(function(){ return { ok: true }; });
      });
    },
    isAuthed: function(){
      if (!isProd) return Promise.resolve(false);
      return ready().then(function(){
        if (!supabaseClient) return false;
        return supabaseClient.auth.getSession().then(function(res){
          return !!(res && res.data && res.data.session);
        });
      });
    },
    getEmail: function(){
      if (!isProd) return Promise.resolve(null);
      return ready().then(function(){
        if (!supabaseClient) return null;
        return supabaseClient.auth.getUser().then(function(res){
          return res && res.data && res.data.user ? res.data.user.email : null;
        });
      });
    },
    resetPassword: function(email){
      if (!isProd) return Promise.resolve({ ok: false });
      return ready().then(function(){
        if (!supabaseClient) return { ok: false };
        return supabaseClient.auth.resetPasswordForEmail(email)
          .then(function(res){ return { ok: !res.error, error: res.error }; });
      });
    },
    updatePassword: function(newPassword){
      if (!isProd) return Promise.resolve({ ok: false });
      return ready().then(function(){
        if (!supabaseClient) return { ok: false };
        return supabaseClient.auth.updateUser({ password: newPassword })
          .then(function(res){ return { ok: !res.error, error: res.error }; });
      });
    },
    inviteUser: function(/* email */){
      // Owner muss neue Nutzer via Supabase-Dashboard einladen (admin API benötigt service_role).
      return Promise.resolve({ ok: false, error: { message: 'Bitte neuen Mitarbeiter über das Supabase-Dashboard einladen (Auth → Users → Invite).' } });
    }
  };

  // ---------- Service Requests ----------
  function addServiceRequest(payload){
    var entry = Object.assign({
      id: 'req-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      status: 'new',
      received_at: new Date().toISOString()
    }, payload);

    if (!isProd) {
      var list = lsGet('service_requests') || [];
      list.unshift(entry);
      lsSet('service_requests', list);
      return Promise.resolve({ ok: true, local: true, data: entry });
    }
    return ready().then(function(){
      if (!supabaseClient) {
        var list = lsGet('service_requests') || [];
        list.unshift(entry);
        lsSet('service_requests', list);
        return { ok: true, local: true, data: entry };
      }
      return supabaseClient
        .from('service_requests')
        .insert(entry)
        .select()
        .single()
        .then(function(res){
          if (res.error) {
            // Fallback to localStorage so user data isn't lost
            var list = lsGet('service_requests') || [];
            list.unshift(entry);
            lsSet('service_requests', list);
            return { ok: false, local: true, error: res.error, data: entry };
          }
          return { ok: true, data: res.data };
        });
    });
  }

  function listServiceRequests(){
    if (!isProd) {
      return Promise.resolve(lsGet('service_requests') || []);
    }
    return ready().then(function(){
      if (!supabaseClient) return lsGet('service_requests') || [];
      return supabaseClient
        .from('service_requests')
        .select('*')
        .order('received_at', { ascending: false })
        .then(function(res){
          if (res.error) return lsGet('service_requests') || [];
          return res.data || [];
        });
    });
  }

  function updateServiceRequestStatus(id, status){
    if (!isProd) {
      var list = lsGet('service_requests') || [];
      list = list.map(function(r){ return r.id === id ? Object.assign({}, r, { status: status }) : r; });
      lsSet('service_requests', list);
      return Promise.resolve({ ok: true, local: true });
    }
    return ready().then(function(){
      if (!supabaseClient) return { ok: false };
      return supabaseClient
        .from('service_requests')
        .update({ status: status })
        .eq('id', id)
        .then(function(res){ return { ok: !res.error, error: res.error }; });
    });
  }

  function deleteServiceRequest(id){
    if (!isProd) {
      var list = (lsGet('service_requests') || []).filter(function(r){ return r.id !== id; });
      lsSet('service_requests', list);
      return Promise.resolve({ ok: true, local: true });
    }
    return ready().then(function(){
      if (!supabaseClient) return { ok: false };
      return supabaseClient
        .from('service_requests')
        .delete()
        .eq('id', id)
        .then(function(res){ return { ok: !res.error, error: res.error }; });
    });
  }

  // ---------- Export ----------
  global.walkerDb = {
    isProd: isProd,
    ready: ready,
    get: get,
    set: set,
    remove: remove,
    uploadImage: uploadImage,
    subscribe: subscribe,
    auth: auth,
    addServiceRequest: addServiceRequest,
    listServiceRequests: listServiceRequests,
    updateServiceRequestStatus: updateServiceRequestStatus,
    deleteServiceRequest: deleteServiceRequest
  };
})(window);
