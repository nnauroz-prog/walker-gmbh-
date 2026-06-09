# Walker GmbH — Webseite

Statische Webseite für **Walker GmbH**, Mercedes-Benz Spezialist in
Hamburg-Hohenfelde.

- Adresse: Ifflandstraße 71, 22087 Hamburg
- Telefon: [040 225536](tel:+4940225536)
- Live: https://nnauroz-prog.github.io/walker-gmbh-/ (oder eigene Domain)

## Konzept

Werkstatt-taugliche Webseite ohne Mehrarbeit für den Inhaber:

- **Telefon + persönlich vorbeikommen** als Kontaktwege. Kein
  Termin-Formular, kein WhatsApp, kein E-Mail-Posteingang zum
  Abarbeiten.
- **„Mein Fahrzeug"-Status-Tracker** — Kunden geben Kennzeichen ein,
  sehen ob ihr Auto fertig ist. Owner pflegt im Admin in
  10 Sekunden pro Auto.
- **Demo-Modus per `localStorage`** läuft sofort. Supabase optional
  für Production (Setup in `UEBERGABE.md`).

## Tech-Stack

- Reines HTML, CSS, Vanilla-JavaScript — kein Build, kein Framework
- Schriften: Inter / Inter Tight (MB-Premium-Schnitt)
- Backend optional: Supabase (Auth + Postgres mit RLS + Storage + Realtime)
- Hosting: GitHub Pages (aktiv) oder Netlify / Vercel / klassischer Webspace
- Mobile-First, `prefers-reduced-motion`, `:focus-visible`, iPhone Safe-Area

## Seiten

| Datei                       | Zweck                                        |
| --------------------------- | -------------------------------------------- |
| `index.html`                | Startseite                                   |
| `leistungen.html`           | Vollständige Leistungsliste                  |
| `mercedes-spezialist.html`  | Mercedes-Benz Spezialisierungs-Detailseite   |
| `teilepartner.html`         | Offizieller Teilepartner-Status              |
| `mein-fahrzeug.html`        | Auftragsstatus per Kennzeichen abfragen      |
| `ueber-uns.html`            | Werkstatt-Selbstverständnis                  |
| `kontakt.html`              | Adresse, Anfahrt, Öffnungszeiten             |
| `impressum.html`            | Pflichtangaben § 5 TMG                       |
| `datenschutz.html`          | DSGVO-Hinweise                               |
| `admin.html`                | Mitgliederbereich (Login + Dashboard)        |
| `404.html`                  | Fehlerseite                                  |

## Lokal entwickeln

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

DevTools öffnen, Konsole prüfen. Erwartet: Splash blendet weg,
Mobile-Burger öffnet/schließt, keine 404 auf CSS/JS/Bilder.

## Deploy

- **GitHub Pages**: `.github/workflows/pages.yml` deployed automatisch
  bei jedem Push auf `main`. Settings → Pages → Source: `GitHub Actions`.
- **Netlify**: Repo verknüpfen oder den Ordner per Drag & Drop nach
  https://app.netlify.com/drop ziehen.

## Production-Setup (Supabase)

Schritt-für-Schritt in `UEBERGABE.md`. Kurzfassung:

1. Projekt auf [supabase.com](https://supabase.com) anlegen
2. `setup.sql` im SQL-Editor ausführen
3. Anon-Key in `config.js` eintragen
4. Owner-Account in Authentication → Users anlegen

Ohne Supabase-Keys läuft die Seite im Demo-Modus via `localStorage`.

## Markenrechtlicher Hinweis

Walker GmbH ist eine eigenständige Fachwerkstatt mit Spezialisierung
auf Mercedes-Benz und offizieller Mercedes-Benz Teilepartner.
**Keine offizielle Mercedes-Benz Niederlassung. Keine Vertragswerkstatt.**
„Mercedes-Benz" ist eine eingetragene Marke der Mercedes-Benz Group AG.

## Owner-Daten zum Ausfüllen

Noch offen, bevor live geschaltet wird:

- Geschäftsführer-Name (Impressum)
- HRB-Nummer + Registergericht
- USt-IdNr.
- E-Mail-Adresse (falls gewünscht)
- Echtes Gründungsjahr (aktuell „seit Jahrzehnten")
- Supabase-Projekt URL + Anon-Key (`config.js`)
