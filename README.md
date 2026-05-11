# Walker GmbH Kfz-Reparaturen – Webseite

Statische Webseite für **Walker GmbH Kfz-Reparaturen**, Hamburg-Hohenfelde.

- Adresse: Ifflandstraße 71, 22087 Hamburg
- Telefon: [+49 40 225536](tel:+4940225536)

## Tech-Stack

- Reines HTML, CSS und Vanilla-JavaScript
- Kein Build-Step, kein Framework
- Statisch deploybar (Netlify, Vercel, GitHub Pages, klassischer Webspace)
- Mobile-First, responsive, barrierearm
- Inline-SVG-Icons, `prefers-reduced-motion`, `:focus-visible`, iPhone Safe-Area

## Seiten

| Datei              | Inhalt                                  |
| ------------------ | --------------------------------------- |
| `index.html`       | Startseite mit Hero, Leistungen, FAQ    |
| `leistungen.html`  | Detaillierte Leistungsübersicht         |
| `termin.html`      | Mehrstufige Terminanfrage (mailto)      |
| `ueber-uns.html`   | Werkstattphilosophie und Werte          |
| `kontakt.html`     | Kontakt, Adresse, Karte (Consent)       |
| `impressum.html`   | Pflichtangaben gemäß § 5 DDG            |
| `datenschutz.html` | Datenschutzhinweise                     |

## Lokales Vorschau-Setup

Reine statische Seite – einfach im Browser öffnen oder einen lokalen Server nutzen:

```bash
python3 -m http.server 8080
# danach http://localhost:8080 aufrufen
```

## Deployment

- **Netlify / Vercel:** Repository verbinden, Build-Command leer, Publish Directory `/`.
- **GitHub Pages:** Branch im Repo-Setting als Pages-Source wählen.

## Offene TODOs (siehe Code-Markierungen)

- Geschäftsführung, Handelsregister, USt-ID im **Impressum**
- E-Mail-Adresse für Kontakt & Datenschutz
- Konkrete Öffnungszeiten in **Kontakt**
- Hosting-Anbieter und Kartenanbieter im **Datenschutz**
- Bestätigung, ob TÜV-Vorbereitung Teil des Angebots ist (**Leistungen**)

## Hinweis zum Terminformular

Da kein Backend vorhanden ist, öffnet das Formular über `mailto:` das E-Mail-Programm des Nutzers mit
einer vorbereiteten Nachricht. Für produktiven Betrieb empfiehlt sich die Anbindung eines
Form-Backends (z. B. Netlify Forms, Formspree, eigener Endpoint).
