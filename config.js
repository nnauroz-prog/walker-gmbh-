/* =========================================================
   Walker GmbH – Frontend Config
   =========================================================
   Trage hier deine Supabase-Zugangsdaten ein. Solange beide
   Werte leer sind, läuft die Seite im Demo-Modus (localStorage).

   Wo bekomme ich die Werte?
   1. Supabase-Projekt anlegen unter https://supabase.com
   2. Im Projekt: Settings → API
   3. „Project URL" → SUPABASE_URL
   4. „anon public" Key → SUPABASE_ANON_KEY
   Schritt-für-Schritt-Anleitung in UEBERGABE.md.

   Achtung: Der anon-Key gehört bewusst ins Frontend. Schutz
   sensibler Daten geschieht ausschließlich über Row-Level-
   Security in der Datenbank (siehe setup.sql).
========================================================= */

window.walkerConfig = {
  SUPABASE_URL:      '',  // z. B. 'https://xxxxxx.supabase.co'
  SUPABASE_ANON_KEY: '',  // z. B. 'eyJ...' (langer JWT-String)

  // Geschäftsdaten – werden vom Admin im Backend überschrieben,
  // dienen als Fallback wenn noch keine Owner-Inhalte vorliegen.
  COMPANY: {
    name:        'Walker GmbH',
    tagline:     'Mercedes-Benz Spezialist · Offizieller Teilepartner',
    phone:       '+49 40 225536',
    phoneRaw:    '+4940225536',
    email:       '',                                  // TODO Owner
    address:     'Ifflandstraße 71, 22087 Hamburg',
    addressStreet: 'Ifflandstraße 71',
    addressCity: '22087 Hamburg',
    district:    'Hamburg-Hohenfelde',
    domain:      'walker-kfz.de',                     // TODO Owner
    hours: [
      { day: 'Mo–Do', from: '07:30', to: '18:30' },
      { day: 'Fr',    from: '07:00', to: '12:00' },
      { day: 'Sa',    closed: true },
      { day: 'So',    closed: true }
    ],
    googleReviewsUrl: 'https://www.google.com/search?q=Walker+GmbH+Kfz-Reparaturen+Hamburg+Bewertungen',
    ratingValue: '4.3',
    ratingCount: '142'
  },

  // Cache-Buster-Version (muss mit Microscript im <head> übereinstimmen)
  APP_VERSION: '2026-06-10-r4'
};
