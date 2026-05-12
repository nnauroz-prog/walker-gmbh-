# Walker GmbH – Übergabe

> Diese Datei wächst mit jeder Etappe. Aktueller Stand: **Etappe 1 – Repo-Grundgerüst**.

## Stand

Die Repository-Struktur, das Designsystem (Navy/Blue/Chrome + Fraunces + Inter),
die Datenzugriffs-Schicht (`db.js` / `config.js`), das Admin-Skelett und die
Supabase-SQL-Vorlage sind angelegt. Sämtliche 11 HTML-Seiten haben ein
einheitliches Skelett mit Header, Footer, Cache-Buster und Inline-Critical-CSS.

Inhalte (Hero-Texte, Leistungs-Cards, FAQs etc.) folgen in **Etappe 2**.

---

## Dateien im Repo

| Datei | Zweck |
|---|---|
| `index.html` | Startseite (Skelett) |
| `leistungen.html` | Leistungs-Übersicht |
| `mercedes-spezialist.html` | Mercedes-Benz Spezialisierungs-Seite |
| `teilepartner.html` | Offizieller Teilepartner |
| `termin-anfragen.html` | Anfrage-Formular (Formular folgt in Etappe 3) |
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

Alle Asset-Links in HTML tragen `?v=2026-01-01-r1`. Wenn eine neue Version
ausgerollt wird:

1. In allen HTML-Dateien `2026-01-01-r1` durch neue Version ersetzen
   (z. B. `2026-01-15-r2`).
2. In `config.js` → `APP_VERSION` ebenfalls anpassen.
3. Im Inline-Cache-Buster-Microscript im `<head>` jeder Seite die Variable
   `V` anpassen.

Beim nächsten Seitenaufruf wird der `localStorage`-Cache geleert.

---

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

## Nächste Etappen (folgen)

- **Etappe 2** – Vollständige Inhalte aller öffentlichen Seiten.
- **Etappe 3** – Termin-Formular live an Supabase angeschlossen.
- **Etappe 4** – Admin-Editoren (Leistungen, Anfragen, Banner, Bilder,
  Öffnungszeiten, Kontakt) inkl. Realtime.
- **Etappe 5** – SEO-Politur, Lighthouse-Check, finale Übergabe.
