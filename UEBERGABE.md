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

| Editor | Status | Wo |
|---|---|---|
| Auftragsstatus „Mein Fahrzeug" | ✅ live | Karte 1 im Admin |
| Hinweisbanner | ✅ live (Etappe 4a) | Karte „Hinweisbanner aktivieren" |
| Öffnungszeiten | ✅ live (Etappe 4b) | Karte „Öffnungszeiten ändern" |
| Kontakt & Standort | ✅ Editor (Etappe 4c, Live-Binding folgt) | Karte „Kontakt & Standort" |
| Leistungen | ⏳ folgt | Karte „Leistungen bearbeiten" |
| Bilder | ⏳ folgt | Karte „Bilder hochladen" |

**Öffnungszeiten** sind voll integriert: Werte werden in `content.hours` gespeichert, beim
nächsten Seitenaufruf rendert `script.js` alle `[data-hours]`-Tabellen aus den Owner-Werten,
und der „Aktuell geöffnet/geschlossen"-Hinweis nutzt automatisch die neuen Zeiten. Schema:

```json
{ "days": [
  { "key": 1, "closed": false, "from": "07:30", "to": "18:30" },
  …
  { "key": 0, "closed": true, "from": "", "to": "" }
] }
```
`key` ist `Date#getDay()`-Wert: 0=Sonntag, 1=Montag, …, 6=Samstag.

**Kontakt & Standort** speichert die Felder `street`, `city`, `district`, `phone`, `phoneRaw`,
`email` in `content.contact`. Die Anzeige in HTML ist aktuell hartkodiert; das automatische
Nachziehen über `data-bind`-Marker folgt, sobald die Texte gefroren sind.

## Nächste Etappen (folgen)

- **Etappe 2** – Vollständige Inhalte aller öffentlichen Seiten.
- **Etappe 3** – Termin-Formular live an Supabase angeschlossen.
- **Etappe 4** – Admin-Editoren (Leistungen, Anfragen, Banner, Bilder,
  Öffnungszeiten, Kontakt) inkl. Realtime.
- **Etappe 5** – SEO-Politur, Lighthouse-Check, finale Übergabe.
