# Walker GmbH – Übergabe

> **Aktueller Stand (Mai 2026):** Design-System auf Mercedes-Benz
> Premium-Schnitt, Texte komplett in Walker-Werkstatt-Stimme,
> Auftragsstatus-Tracker live, Subpages konsolidiert.

## Stand

Die Webseite ist fertig zum Deploy:

- **Designsprache**: MB-Premium-Minimalismus — Inter/Inter Tight,
  Schwarz/Anthrazit/Chrome, kein Bernstein, keine Editorial-Spielerei.
- **Tonalität**: konkrete Werkstatt-Stimme statt KI-Marketing-Floskel.
  Beispiele: „Eine Werkstatt. Für eine Marke.", „Hier steht kein Auto.",
  „Original, wenn möglich.", „24 bis 48 Stunden auf dem Tresen."
- **Auftragsstatus-Tracker** („Mein Fahrzeug") läuft, Owner pflegt
  Status pro Auto in 10 Sekunden im Admin.
- **Telefon + persönliches Vorbeikommen** als Kontaktwege.
  Kein Termin-Formular, kein WhatsApp, kein E-Mail-Posteingang
  zum Abarbeiten.

## Werkstatt-Konzept (Entlastung statt Mehrarbeit)

Statt eines Kontaktformulars, das E-Mails erzeugt, die niemand
abarbeiten kann, läuft alles über zwei werkstatt-taugliche Kanäle:

1. **Telefon** als primärer Kontakt (+49 40 225536, einfacher
   `tel:`-Link in der Header-Leiste). Direkter Draht zur Werkstatt,
   kein Callcenter, keine Warteschleife.
2. **Persönlich vorbeikommen** in der Ifflandstraße 71. Adresse +
   Routen-Knopf (Google / Apple Maps) auf der Kontaktseite.
3. **„Mein Fahrzeug"-Status** für die häufigste Frage („Ist mein
   Auto fertig?") — Kunde gibt sein Kennzeichen ein, sieht selbst
   den Status, ruft nicht an.

Der Status wird im Admin-Bereich gepflegt:
Kennzeichen + Status-Dropdown (Angenommen / In Bearbeitung / Warten
auf Teile / Abholbereit / Abgeschlossen) + optionaler Hinweis.
Eine Statusänderung dauert ein paar Sekunden.

---

## Dateien im Repo

| Datei | Zweck |
|---|---|
| `index.html` | Startseite (Skelett) |
| `leistungen.html` | Leistungs-Übersicht |
| `mercedes-spezialist.html` | Mercedes-Benz Spezialisierungs-Seite |
| `teilepartner.html` | Offizieller Teilepartner |
| `mein-fahrzeug.html` | Status-Abfrage per Kennzeichen (öffentlich) |
| `kontakt.html` | Adresse, Anfahrt, Öffnungszeiten |
| `ueber-uns.html` | Über Walker GmbH |
| `impressum.html` | Pflichtangaben |
| `datenschutz.html` | DSGVO-Hinweise |
| `admin.html` | Mitgliederbereich (Login + Dashboard) |
| `404.html` | Fehlerseite |
| `styles.css` | Designsystem |
| `script.js` | Öffentliche Logik (Burger, Cookie, Live-Status, …) |
| `db.js` | `walkerDb` Datenzugriffs-API |
| `config.js` | Supabase-URL + Anon-Key (leer = Demo-Modus) |
| `admin.js` | Admin-Logik (Skelett) |
| `setup.sql` | Supabase-SQL zum Reinkopieren |
| `sitemap.xml`, `robots.txt` | SEO |
| `logo.png`, `favicon.png` | Markenzeichen |
| `foto-diagnose.jpg`, `foto-wartung.jpg`, `foto-bremsen.jpg` (+ `-sm.jpg`) | Werkstatt-Bilder |

---

## Supabase einrichten — Schritt für Schritt

Die Seite läuft sofort im **Demo-Modus** (`localStorage`). Für Production
(Owner-Login, Anfragen-Storage, Bilder-Upload, Realtime) Supabase wie folgt
aufsetzen:

### 1. Projekt anlegen

1. Auf [supabase.com](https://supabase.com) anmelden / registrieren.
2. **„New Project"** klicken.
3. Name z. B. `walker-gmbh`, Region **Frankfurt** (EU – DSGVO-relevant),
   ein starkes Datenbank-Passwort setzen (Passwort sicher notieren – wird nur
   für direkten DB-Zugang gebraucht).
4. Tier: Free reicht für den Anfang.
5. Warten bis das Projekt fertig aufgesetzt ist (1–2 Minuten).

### 2. SQL-Skript ausführen

1. Im Supabase-Dashboard links auf **SQL Editor**.
2. Inhalt von `setup.sql` komplett reinkopieren.
3. **Run** klicken.
4. Erwartet: 2 Tabellen (`content`, `service_requests`), 1 Storage-Bucket
   (`images`), Row-Level-Security aktiviert.

### 3. API-Schlüssel kopieren

1. Im Supabase-Dashboard → **Settings → API**.
2. Aus dem Bereich **„Project URL"** den URL kopieren (Format
   `https://xxxxxxxxx.supabase.co`).
3. Aus **„Project API keys"** den Schlüssel mit Label **`anon` `public`**
   kopieren (langer JWT-String, beginnt mit `eyJ…`).
4. In `config.js` eintragen:

```js
window.walkerConfig = {
  SUPABASE_URL:      'https://xxxxxxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJ…',
  ...
};
```

5. Datei speichern, Seite neu laden – die Verbindung wird automatisch erkannt.

### 4. Owner-Account anlegen

1. Im Supabase-Dashboard → **Authentication → Users**.
2. **„Add user"** → **„Create new user"**.
3. E-Mail-Adresse des Inhabers und ein erstes Passwort vergeben.
4. **„Auto Confirm User"** aktivieren (keine E-Mail-Verifizierung nötig).
5. „Create user" klicken.

Diese Zugangsdaten sind die Anmeldung im Mitgliederbereich (`admin.html`).
Weitere Mitarbeiter werden über denselben Weg angelegt.

### 5. Realtime aktivieren (falls nicht automatisch)

1. Supabase-Dashboard → **Database → Replication**.
2. Sicherstellen, dass die Publication `supabase_realtime` aktiv ist und
   die Tabellen `content` und `service_requests` enthält.
3. Das setup.sql versucht dies automatisch zu konfigurieren, in manchen
   Plänen muss man es manuell anhaken.

---

## Lokales Testen

Da reines HTML/CSS/JS, kein Build-Step nötig:

```bash
cd walker-gmbh-
python3 -m http.server 8080
# → http://localhost:8080
```

DevTools öffnen, Konsole prüfen. Folgendes erwartet:

- Splash blendet sich nach Sekunden weg.
- Mobile-Burger-Menü öffnet/schließt sauber.
- Keine 404-Errors auf `styles.css`, `script.js`, `db.js`, `config.js`, `logo.png`.

---

## Netlify-Deploy

1. Auf [app.netlify.com](https://app.netlify.com) einloggen.
2. **„Add new site → Deploy manually"**.
3. Den Repo-Ordner (entpackt) per Drag &amp; Drop hochziehen.
4. Netlify generiert eine URL (z. B. `walker-gmbh.netlify.app`).
5. Eigene Domain `walker-kfz.de` → in Netlify unter Domain Management
   verknüpfen, DNS umstellen.

Alternativ: GitHub-Repo verbinden, Auto-Deploy bei jedem Push.

---

## Cache-Busting

Alle Asset-Links in HTML tragen `?v=2026-06-10-r3`. Wenn eine neue Version
ausgerollt wird:

1. In allen HTML-Dateien `2026-06-10-r3` durch neue Version ersetzen
   (z. B. `2026-01-15-r2`).
2. In `config.js` → `APP_VERSION` ebenfalls anpassen.
3. Im Inline-Cache-Buster-Microscript im `<head>` jeder Seite die Variable
   `V` anpassen.

Beim nächsten Seitenaufruf wird der `localStorage`-Cache geleert.

---

## „Mein Fahrzeug"-Workflow (Status-Tracker)

Der Tracker entlastet das Telefon. Workflow:

1. **Bei Annahme**: Kennzeichen im Admin (`admin.html` → „Auftragsstatus
   pflegen") anlegen mit Status „Angenommen".
2. **Während der Arbeit**: Status auf „In Bearbeitung" klicken — auto-save.
3. **Bei Teile-Bestellung**: Status „Warten auf Teile", evtl. mit Hinweis
   wie „Bremsteile bestellt, Lieferung Donnerstag".
4. **Sobald fertig**: Status auf „Abholbereit". Mehr ist nicht nötig.
   Kunden sehen das selbst auf `mein-fahrzeug.html`.
5. **Nach Abholung**: Status „Abgeschlossen" oder Eintrag löschen.

Tipp: Auf der Übersicht zeigt das **Badge auf der Admin-Karte** an, wie
viele Fahrzeuge gerade „Abholbereit" sind.

## Offene Geschäfts-/Rechtsdaten (TODO)

- **Impressum**: Vor- und Nachname Geschäftsführung, Handelsregister-Gericht,
  HRB-Nummer, USt-IdNr.
- **Kontakt**: Geschäfts-E-Mail-Adresse.
- **Datenschutz**: Tatsächlicher Hosting-Anbieter (Netlify, GitHub Pages,
  Eigenhosting?).
- **Mercedes-Benz Teilepartner-Status**: rechtlich verifizieren, dass die
  Formulierung „offizieller Mercedes-Benz Teilepartner" zutreffend ist und
  vom Hersteller anerkannt wird. Falls nicht, Formulierung ändern.

---

## Admin-Editoren — aktueller Stand

| Editor | Status | content-Key |
|---|---|---|
| Auftragsstatus „Mein Fahrzeug" | ✅ live | (eigene Tabelle `vehicle_status`) |
| Hinweisbanner | ✅ live (Etappe 4a) | `notice` |
| Öffnungszeiten | ✅ live + Live-Binding (Etappe 4b) | `hours` |
| Kontakt & Standort | ✅ live + Live-Binding (Etappe 4c + Folge-PR) | `contact` |
| Leistungen | ✅ live + Live-Binding (Etappe 4d) | `services` |
| Bilder | ⏳ folgt (braucht Supabase Storage Bucket `images`) | (Storage) |

### content.hours

```json
{ "days": [
  { "key": 1, "closed": false, "from": "07:30", "to": "18:30" },
  …
  { "key": 0, "closed": true,  "from": "",      "to": "" }
] }
```
`key` ist `Date#getDay()`-Wert: 0=Sonntag, 1=Montag, …, 6=Samstag.

### content.contact

```json
{
  "street":   "Ifflandstraße 71",
  "city":     "22087 Hamburg",
  "district": "Hamburg-Hohenfelde",
  "phone":    "+49 40 225536",
  "phoneRaw": "+4940225536",
  "email":    "info@walker-kfz.de"
}
```

Live-Binding (`script.js#applyCustomContactIfAny`):
- Alle `<a href^="tel:">` → `href` aus `phoneRaw` (automatisch, kein Marker nötig)
- Alle `<a href^="mailto:">` analog
- `[data-bind="phone|email|street|city|district"]` → `textContent`

### content.services

```json
{ "items": [
  { "id": "diagnose",   "title": "…", "body": "…" },
  { "id": "wartung",    "title": "…", "body": "…" },
  { "id": "oel",        "title": "…", "body": "…" },
  { "id": "bremsen",    "title": "…", "body": "…" },
  { "id": "elektronik", "title": "…", "body": "…" },
  { "id": "klima",      "title": "…", "body": "…" },
  { "id": "reparatur",  "title": "…", "body": "…" },
  { "id": "teile",      "title": "…", "body": "…" }
] }
```

- Reihenfolge + IDs sind fix (`mergeServices()` korrigiert versehentliche Umsortierung)
- Title: `textContent`, Body: `innerHTML` (Links erlaubt — Admin-only Auth)
- Live-Binding nur auf `leistungen.html` aktiv (kein-op auf anderen Seiten)

### content.notice

```json
{ "enabled": true, "text": "Betriebsurlaub vom 14.–25. Juli — ab dem 28. sind wir wieder da." }
```

## SEO-Stand

- `BreadcrumbList` JSON-LD auf allen 8 Subseiten
- `AutoRepair` JSON-LD auf Index (mit `aggregateRating`, `openingHoursSpecification`)
- `og:image` zeigt auf `foto-diagnose.jpg` (1200×800)
- `<link rel="preload" as="image" fetchpriority="high">` auf Hero (LCP)
- Sitemap mit `<lastmod>` aktuell, robots.txt mit korrekten Disallows

## Deployment

- **Production**: `.github/workflows/pages.yml` deployt automatisch bei
  jedem Push auf `main`. Trigger: `Settings → Pages → Source: GitHub Actions`.
- Cache-Buster `2026-06-10-r3` synchron in allen Files; bei nächstem
  Release: APP_VERSION in `config.js` + `V=` in den Microscripts hochzählen.

## Nächste Etappen (folgen, optional)

- **Etappe 4e** — Bilder-Upload (Logo, Hero, Werkstatt-Fotos) via Supabase
  Storage Bucket `images`. Braucht aktive Supabase-Konfig.
- **Lighthouse-Lauf in Production** — sobald `walker-kfz.de` live ist,
  Werte messen, Detail-Optimierungen ergänzen.
- **Performance**: WebP-/AVIF-Konvertierung der drei Werkstatt-Fotos
  (manueller Schritt, spart ~60 % Image-Payload).
- **Eigene Domain anbinden** — `walker-kfz.de` per CNAME auf
  `nnauroz-prog.github.io` zeigen lassen, Pages → Custom domain eintragen.
