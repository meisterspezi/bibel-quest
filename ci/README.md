# CI Bibelbuch-Quest

Gewählt am 13.11.2026: **Farbe 1 „Nacht, Gold und Kreuzrot“** und **Schrift A4b**.
Das Stylesheet `ci.css` ist noch **nicht** in die App eingebunden.

## Farben

| Rolle | Name | Wert | Einsatz |
|---|---|---|---|
| Hintergrund | Nacht | `#0E1226` | Seitengrund |
| Fläche | Fläche | `#1B2146` | Karten, Kacheln |
| Umriss | Umriss | `#1B2A55` | Symbol-Umrisse |
| Linie | Linie | `#323B74` | Ränder, Trenner |
| Text | Text | `#F6F8FF` | Fließtext |
| Text leise | Text leise | `#A3ABD8` | Untertitel, Hinweise |
| **Hauptfarbe** | Gold | `#F2C14E` | Titel, Hauptknopf, Ringe, Punkte (Schrift darauf `#2A1D02`) |
| **Signal** | Kreuzrot | `#E8141B` | Zähler, „neu“, Fehler, Duell-Hinweis (Schrift darauf weiß) |
| Logo | Schwarz / Rot / Weiß | `#000000` / `#EE0002` / `#FFFFFF` | nur im Logo und im Druck |

Bereichsfarben bleiben wie in der App: Lernen `#7FC8FF`, Spielen `#FFB54A`, Gemeinde `#5FE0B0`,
Laden/Lohn `#B38CFF`, Biblionär `#66E0D0`, Duell `#FF8A5C`, Spenden `#F4A6C8`, Bedienung `#E3E9F6`.

## Schriften

| Rolle | Schrift | Regel |
|---|---|---|
| Titel | Cinzel 600/800 | immer Großbuchstaben, leicht gesperrt |
| Text | Lexend 400/500/700 | Fließtext, Knöpfe, Zahlen, Marken |
| Bibelverse | Source Serif 4 kursiv 500 | immer kursiv, Stelle in Lexend darunter, Schlachter 2000 |

## Regeln

- Gold führt, Kreuzrot meldet: Rot nie als große Fläche oder für Titel.
- Das Gemeindelogo nicht umfärben; auf dunklem Grund auf weißer Scheibe zeigen.
- Bedienknöpfe ruhig ohne Schein, Gesperrtes grau ohne Schein, `prefers-reduced-motion` beachten.
- Alles muss bei 390 px Breite passen.

## Dateien

- `ci.css` – Variablen (`--ci-…`) und Bausteine (`.ci-knopf`, `.ci-marke`, `.ci-vers` …).
  Die Namen `--bg`, `--surface`, `--line`, `--muted`, `--display`, `--body`, `--serif` entsprechen `index.html`.
- `gemeinde-logo.png` – Gemeindelogo (Original).
