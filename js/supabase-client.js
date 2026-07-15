(function() {
  'use strict';
  window.ET = window.ET || {};

  // Publiczne dane projektu Supabase — bezpieczne w kodzie klienckim
  // (klucz "anon/publishable" nie daje dostępu z pominięciem RLS).
  var SUPABASE_URL = 'https://vsvnldirowqhcbukxfic.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_cIBBg1-FdCoQuFAjv-MSLg_ZV14IWsb';

  var client = null;
  try {
    if (window.supabase && window.supabase.createClient && SUPABASE_URL && SUPABASE_ANON_KEY) {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
    }
  } catch (e) {
    console.warn('[supabase] init failed:', e);
  }

  // null gdy: brak sieci przy ładowaniu CDN, brak konfiguracji, lub błąd — reszta
  // aplikacji musi to sprawdzać i degradować się do trybu offline.
  ET.supabase = client;
})();
