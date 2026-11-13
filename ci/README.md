# CI Bibelbuch-Quest

Gewählt am 13.11.2026: **Farbe 1 „Nacht, Gold und Kreuzrot“** und **Schrift A4b**.
Das Stylesheet `ci.css` (Fassung 2) ist noch **nicht** in die App eingebunden.

Fest gewählt und nicht zu ändern sind: Nacht, Fläche, Umriss, Gold, Kreuzrot, Text, die acht
Bereichsfarben und die drei Schriften. Alle anderen Werte sind Hilfswerte und dürfen bei Bedarf
angepasst werden, solange die Kontraste unten eingehalten bleiben.

## Farben

| Rolle | Variable | Wert | Einsatz |
|---|---|---|---|
| Hintergrund | `--ci-nacht` | `#0E1226` | Seitengrund |
| Hintergrund vertieft | `--ci-nacht-2` | `#151A36` | Eingabefeld, Schiene der Reiterleiste |
| Fläche | `--ci-flaeche` | `#1B2146` | Karten, Kacheln, Fußleiste, Modal |
| Fläche erhöht | `--ci-flaeche-2` | `#262E5E` | Toast, Schiene des Fortschrittsbalkens |
| Umriss | `--ci-umriss` | `#1B2A55` | Symbol-Umrisse, dunkle Kante an Gold |
| Linie | `--ci-linie` | `#323B74` | nur Schmuck: Trenner, Kartenrand |
| Linie stark | `--ci-linie-stark` | `#7480C4` | Rand von Feldern und leisen Knöpfen |
| Text | `--ci-text` | `#F6F8FF` | Fließtext |
| Text leise | `--ci-text-leise` | `#A3ABD8` | Untertitel, Hinweise, Platzhalter |
| **Hauptfarbe** | `--ci-gold` | `#F2C14E` | Titel, Hauptknopf, Ringe, Punkte |
| Gold hell / tief | `--ci-gold-hell` / `--ci-gold-tief` | `#FFE39A` / `#C8952A` | Verläufe, Fokusrahmen |
| Schrift auf Gold | `--ci-gold-ink` | `#2A1D02` | Text auf Gold und auf dem Duell-Verlauf |
| **Signal** | `--ci-kreuzrot` | `#E8141B` | Zähler, „neu“, Fehler, Duell-Hinweis – nur als kleine Fläche, Rand, Punkt |
| Schrift auf Kreuzrot | `--ci-kreuzrot-ink` | `#FFFFFF` | reines Weiß, nicht `--ci-text` |
| Rote Schrift | `--ci-kreuzrot-hell` | `#FF8087` | Fehlertext auf dunklem Grund |
| Gesperrt | `--ci-gesperrt-flaeche` / `--ci-gesperrt-text` | `#2B3050` / `#A4A9C0` | Gesperrtes: grau, ohne Schein |
| Zustände | `--ci-ok` / `--ci-warnung` / `--ci-fehler` / `--ci-fehler-text` | `#5FE0B0` / `#FFB54A` / Kreuzrot / Kreuzrot hell | richtig, Achtung, Fehler |
| Logo | `--ci-logo-…` | `#000000` / `#EE0002` / `#FFFFFF` | nur im Logo und im Druck |

Bereichsfarben (wie in der App), gesetzt über `data-bereich="…"`:

| Bereich | `data-bereich` | Variable | Wert |
|---|---|---|---|
| Start | `start` | `--ci-gold` | `#F2C14E` |
| Lernen | `lernen` | `--ci-lernen` | `#7FC8FF` |
| Spielen | `spielen` | `--ci-spielen` | `#FFB54A` |
| Gemeinde | `gemeinde` | `--ci-gemeinde` | `#5FE0B0` |
| Laden/Lohn | `lohn` | `--ci-lohn` | `#B38CFF` |
| Biblionär | `biblionaer` | `--ci-biblionaer` | `#66E0D0` |
| Duell | `duell` | `--ci-duell` | `#FF8A5C` |
| Spenden | `spende` | `--ci-spende` | `#F4A6C8` |
| Bedienung | `bedienung` | `--ci-bedienung` | `#E3E9F6` |

Verläufe: `--ci-goldverlauf` (Hauptknopf), `--ci-lichtverlauf` (Weißgold-Titel „Himmlisches Licht“),
`--ci-goldbogen` (Trenner), `--ci-duellverlauf` (Gold → Koralle → Rosé, nur im Duell).

## Kontraste (WCAG 2.1, nachgerechnet)

Ziel ist Stufe AA: Schrift mindestens **4,5:1**, große Schrift (ab 24 px oder 18,7 px fett) und
Bedien-Ränder mindestens **3:1**.

### Schrift auf den Grundflächen

| Schrift | auf Nacht `#0E1226` | auf Fläche `#1B2146` | auf Fläche 2 `#262E5E` | Urteil |
|---|---|---|---|---|
| Text `#F6F8FF` | 17,5 | 14,6 | 12,1 | AAA |
| Text leise `#A3ABD8` | 8,3 | 6,9 | 5,7 | AA |
| Gold `#F2C14E` | 11,0 | 9,3 | 7,7 | AAA |
| Kreuzrot hell `#FF8087` (Fehlertext) | 7,7 | 6,4 | 5,3 | AA |
| **Kreuzrot `#E8141B` als Schrift** | **4,0** | **3,4** | – | **zu wenig** – nur Fläche/Rand/Punkt |
| Gesperrt-Text `#A4A9C0` | 8,0 | 6,7 | 5,5 | AA |
| Lernen `#7FC8FF` | 10,2 | 8,6 | 7,1 | AAA |
| Spielen `#FFB54A` | 10,6 | 8,8 | 7,3 | AAA |
| Gemeinde `#5FE0B0` | 11,3 | 9,5 | 7,8 | AAA |
| Laden/Lohn `#B38CFF` | 7,2 | 6,0 | 5,0 | AA |
| Biblionär `#66E0D0` | 11,6 | 9,7 | 8,0 | AAA |
| Duell `#FF8A5C` | 8,0 | 6,7 | 5,5 | AA |
| Spenden `#F4A6C8` | 9,8 | 8,2 | 6,8 | AA |
| Bedienung `#E3E9F6` | 15,2 | 12,8 | 10,6 | AAA |

### Schrift auf farbigen Flächen

| Paar | Kontrast | Urteil |
|---|---|---|
| Gold-Ink `#2A1D02` auf Gold `#F2C14E` | 9,8 | AAA |
| Gold-Ink auf Gold hell `#FFE39A` (oberes Ende des Verlaufs) | 13,1 | AAA |
| Gold-Ink auf Gold tief `#C8952A` (unteres Ende des Verlaufs) | 6,1 | AA |
| Weiß `#FFFFFF` auf Kreuzrot `#E8141B` | 4,6 | AA (knapp) |
| Text `#F6F8FF` auf Kreuzrot | 4,35 | **zu wenig** – deshalb reines Weiß |
| App-Textfarbe `#EEF0FF` auf Kreuzrot | 4,1 | **zu wenig** |
| Gold-Ink auf Koralle `#FF8A5C` / Rosé `#F4A6C8` (Duell-Verlauf) | 7,1 / 8,7 | AAA |
| Nacht `#0E1226` auf den Bereichsfarben (Startknopf) | 7,2 (Violett) bis 15,2 (Silber) | AAA |
| Gesperrt-Text `#A4A9C0` auf Gesperrt-Fläche `#2B3050` | 5,5 | AA |
| Text / Text leise / Gold auf „eigene Zeile“ (Gold 14 % auf Fläche, `#393747`) | 10,9 / 5,2 / 6,9 | AA |
| Kreuzrot hell auf Fehler-Hinterlegung (Rot 14 % auf Fläche) | 6,0 | AA |

### Ränder und Zeichen (mindestens 3:1)

| Paar | Kontrast | Urteil |
|---|---|---|
| Linie stark `#7480C4` auf Nacht / Nacht 2 / Fläche / Fläche 2 | 5,0 / 4,6 / 4,2 / 3,4 | erfüllt |
| Linie `#323B74` auf Nacht / Fläche | 1,8 / 1,5 | nur Schmuck – nie als einziger Rand eines Bedienelements |
| Kreuzrot auf Nacht / Fläche (Rand, Punkt, Fehlerrahmen) | 4,0 / 3,4 | erfüllt |
| Goldbalken auf Schiene (Fläche 2) | 7,7 | erfüllt |
| Fokusrahmen Gold hell `#FFE39A` auf Nacht / Fläche | 14,8 / 12,4 | erfüllt |

Merksätze daraus:

- Rote **Schrift** auf dunklem Grund immer in `--ci-kreuzrot-hell`, nie in Kreuzrot.
- Schrift **auf** Kreuzrot immer reinweiß und fett; keine längeren Texte auf Rot.
- Laden/Lohn-Violett ist die schwächste Bereichsfarbe (5,0 auf Fläche 2) – als Schrift nicht kleiner als 12 px.
- Gesperrtes zeigt zusätzlich ein Schloss; Grau allein reicht nicht als Hinweis.

## Schriften

| Rolle | Schrift | Ersatz, wenn sie nicht lädt | Regel |
|---|---|---|---|
| Titel | Cinzel 600/800 | Trajan Pro, Cormorant SC, Georgia, serif | immer Großbuchstaben, leicht gesperrt (0,05 em) |
| Text | Lexend 400/500/700 | system-ui, Segoe UI, Roboto, Helvetica Neue, Arial | Fließtext, Knöpfe, Zahlen, Marken |
| Bibelverse | Source Serif 4 kursiv 500/600 | Source Serif Pro, EB Garamond, Georgia, serif | **immer kursiv**, Stelle in Lexend darunter, Schlachter 2000 |

Die Schriften kommen von **Google Fonts**. `ci.css` lädt sie selbst über `@import`. Schneller ist
es, sie im `<head>` zu laden und die `@import`-Zeile in `ci.css` zu löschen:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Lexend:wght@400;500;700&family=Source+Serif+4:ital,opsz,wght@1,8..60,500;1,8..60,600&display=swap">
<link rel="stylesheet" href="ci/ci.css">
```

Von Source Serif 4 wird nur der kursive Schnitt geladen. Betonung im Vers (`<em>`, `<b>`) bleibt
kursiv und wird nur kräftiger (600). Ohne Netz erscheinen die Ersatzschriften; das Layout bleibt gleich.

### Schriftgrößen (rem, 1 rem = 16 px)

| Variable | Größe | Zeilenhöhe | Einsatz |
|---|---|---|---|
| `--ci-gr-1` | 1,75 rem / 28 px | 1,15 | Seitentitel `.ci-h1` |
| `--ci-gr-2` | 1,375 rem / 22 px | 1,15 | Bereichstitel `.ci-h2` |
| `--ci-gr-3` | 1,125 rem / 18 px | 1,15 | Abschnitt, Kartentitel `.ci-h3` |
| `--ci-gr-vers` | 1,125 rem / 18 px | 1,5 | Bibelvers |
| `--ci-gr-text` | 1 rem / 16 px | 1,55 | Fließtext, Eingabefelder |
| `--ci-gr-klein` | 0,875 rem / 14 px | 1,25 | Untertitel, Hinweise, Reiter |
| `--ci-gr-mini` | 0,75 rem / 12 px | 1,25 | Marken, Abschnittstitel |
| `--ci-gr-winzig` | 0,6875 rem / 11 px | 1,25 | nur Zähler und Fußleiste |

Zeilenhöhen: `--ci-zh-titel` 1,15 · `--ci-zh-eng` 1,25 · `--ci-zh-text` 1,55 · `--ci-zh-vers` 1,5.

### Abstände und Formen

| Variable | Wert | | Variable | Wert |
|---|---|---|---|---|
| `--ci-abstand-1` | 0,25 rem / 4 px | | `--ci-radius-s` | 8 px |
| `--ci-abstand-2` | 0,5 rem / 8 px | | `--ci-radius-m` | 12 px (Karte, Knopf, Feld) |
| `--ci-abstand-3` | 0,75 rem / 12 px | | `--ci-radius-l` | 18 px (Modal, Toast, Fußleiste) |
| `--ci-abstand-4` | 1 rem / 16 px | | `--ci-radius-rund` | 999 px |
| `--ci-abstand-5` | 1,5 rem / 24 px | | `--ci-rand` | 16 px Seitenrand |
| `--ci-abstand-6` | 2,5 rem / 40 px | | `--ci-tippflaeche` | 44 px kleinste Tippfläche |

Spaltenbreite `--ci-spalte` 520 px, Fußleiste `--ci-fussleiste-hoehe` 68 px.
Ebenen wie in der App: Fußleiste 20, Toast 45, Modal 50.

## Bausteine

Benennung: `.ci-baustein`, `.ci-baustein-teil`, `.ci-baustein--variante`. Zustände möglichst über
Attribute (`disabled`, `aria-pressed`, `aria-selected`, `aria-current`, `aria-invalid`, `hidden`),
sonst `.ist-aktiv` und `.ist-gesperrt`. Beispiel-HTML steht jeweils als Kommentar in `ci.css`.

| Baustein | Klassen | Hinweis |
|---|---|---|
| Seite | `.ci` (auf `<html>`/`<body>`), `.ci-seite`, `.ci-seite--mit-fussleiste`, `.ci-stapel`, `.ci-stapel--eng` | Spalte bis 520 px, 16 px Rand |
| Titel | `.ci-h1`, `.ci-h2`, `.ci-h3`, `.ci-titel--licht` | Cinzel, Großbuchstaben; `--licht` = Weißgold-Verlauf |
| Text | `.ci-unter`, `.ci-leise`, `.ci-label`, `.ci-link`, `.ci-zahl` | `.ci-unter` nimmt innerhalb von `[data-bereich]` die Bereichsfarbe |
| Trenner | `.ci-bogen`, `.ci-bogen--duell` | goldener Bogen |
| Bibelvers | `.ci-vers`, `.ci-stelle` | immer kursiv |
| Karte | `.ci-karte`, `.ci-karte--bereich` | |
| Knopf | `.ci-knopf`, `--leise`, `--bereich`, `--duell`, `--gefahr`, `--breit`, `--klein` | Zustände hover, active, focus-visible, `aria-pressed`, gesperrt |
| Eingabefeld | `.ci-feld`, `.ci-feld-label`, `.ci-feld-hinweis`, `.ci-feld-hinweis--fehler` | für `input`, `textarea`, `select`; Fehler über `aria-invalid="true"` |
| Marke | `.ci-marke`, `--signal`, `--bereich`, `--leise`, `--ok`, `--gesperrt` | |
| Zähler | `.ci-zaehler`, `.ci-zaehler--ecke` | rote Zahl |
| Bereichskopf | `.ci-bereichskopf`, `.ci-bereichskopf-text`, `.ci-medaillon`, `.ci-ring` | Arena-Stil: Medaillon · Titel + Untertitel · Ring |
| Zahlentafel | `.ci-tafel` | drei Werte |
| Fortschritt | `.ci-balken`, `--bereich`, `--duell`, `--schmal` | Breite über `style="--wert:60%"` |
| Liste | `.ci-liste`, `.ci-zeile`, `.ci-zeile--ich`, `.ci-zeile-rang`, `.ci-zeile-rang--podest`, `.ci-zeile-haupt`, `.ci-zeile-wert` | auch Rangliste; als `<button>`/`<a>` antippbar |
| Meldung | `.ci-meldung`, `--fehler`, `--ok`, `--warnung` | im Seitenfluss |
| Reiterleiste | `.ci-reiter` | 3 Reiter, 4 nur mit kurzen Wörtern |
| Fußleiste | `.ci-fussleiste` | bis 6 Einträge; aktiv über `aria-current="page"` |
| Modal | `.ci-modal`, `.ci-modal-karte`, `.ci-modal-karte--weit`, `.ci-modal-knoepfe` | `role="dialog" aria-modal="true"` |
| Toast | `.ci-toast`, `--ok`, `--fehler` | `role="status"`, bei Fehler `role="alert"` |
| Logo | `.ci-logo`, `--klein`, `--gross` | weiße Scheibe |
| Helfer | `.ist-gesperrt`, `.ci-schein`, `.ci-nur-vorlesen` | |

## Regeln

- Gold führt, Kreuzrot meldet: Rot nie als große Fläche oder für Titel.
- Höchstens ein goldener Hauptknopf mit Schein je Ansicht. Bedienknöpfe (`--leise`) ruhig ohne Schein.
- Gesperrtes grau ohne Schein und ohne Bewegung, dazu ein Schloss-Symbol.
- Der Duell-Verlauf Gold → Koralle → Rosé gehört nur in den Duell-Bereich (Knopf, Balken, Trenner).
- Das Gemeindelogo nicht umfärben; auf dunklem Grund auf weißer Scheibe zeigen.
- Jede Tippfläche ist mindestens 44 px hoch; der Tastatur-Fokus zeigt einen hellgoldenen Rahmen.
- Übergänge laufen nur ohne `prefers-reduced-motion: reduce`.
- Alles muss bei 390 px Breite ohne seitliches Wischen passen: Kinder in Flex/Grid bekommen
  `min-width: 0`, Spalten `minmax(0, 1fr)`, lange Namen werden mit „…“ gekürzt, Titel brechen um.

## Namen wie in `index.html`

`ci.css` setzt zusätzlich die Variablennamen der App, damit sie die Werte später direkt übernimmt:

| App-Variable | zeigt auf | heute in der App | Unterschied |
|---|---|---|---|
| `--bg`, `--bg2` | `--ci-nacht`, `--ci-nacht-2` | `#0E1226`, `#151A36` | gleich |
| `--surface`, `--surface2` | `--ci-flaeche`, `--ci-flaeche-2` | `#1B2146`, `#262E5E` | gleich |
| `--line`, `--muted` | `--ci-linie`, `--ci-text-leise` | `#323B74`, `#A3ABD8` | gleich |
| `--fg` | `--ci-text` | `#EEF0FF` | etwas heller |
| `--accent`, `--accent-ink` | `--ci-gold`, `--ci-gold-ink` | `#F2C14E`, `#2A1D00` | praktisch gleich |
| `--good` | `--ci-ok` | `#46D39A` | heller |
| `--bad` | `--ci-fehler-text` | `#FF6B6B` | heller, für Schrift gedacht |
| `--display` | `--ci-schrift-titel` | Cinzel | gleich |
| `--body` | `--ci-schrift-text` | Nunito | **wird Lexend** |
| `--serif` | `--ci-schrift-vers` | EB Garamond | **wird Source Serif 4** |
| `--ar` | `--ci-gold` | `var(--accent)` | gleich |
| `--ar-lernen`, `--ar-lohn` | `--ci-lernen`, `--ci-lohn` | `#7FC8FF`, `#B38CFF` | gleich |
| `--ar-spielen`, `--ar-gemeinde` | `--ci-spielen`, `--ci-gemeinde` | `#B38CFF`, `#FF8A5C` (Zeile 519) | **ändert sich** auf Bernstein und Grün |
| `--fs-s`, `--fs-m`, `--fs-l` | `--ci-gr-mini`, `-klein`, `-text` | 0,75 / 0,875 / 1 rem | gleich |
| `--tap` | `--ci-tippflaeche` | 44 px | gleich |
| `--bk` | `--ar` (nur an `[data-bereich]`) | Farbe im Bereichskopf | – |

Nicht gemappt, weil nicht Teil der CI: `--at`, `--nt` (Altes/Neues Testament), `--g-…` (Buchgruppen),
`--th`, `--edc`, `--gold`, `--licht` und die Farbthemen `body[data-acc="…"]`.

## Einbau in die App (später)

1. Schriften über `<link>` laden (siehe oben) und die alte Zeile mit Nunito/EB Garamond ersetzen.
2. `ci/ci.css` **nach** dem `<style>` der App einbinden – oder besser die Werte im ersten `:root`
   der App streichen. Steht `ci.css` davor, gewinnen die alten App-Werte.
3. `ci/ci.css` und die Schrift-Adressen in die Dateiliste von `sw.js` aufnehmen, sonst fehlt das
   Stylesheet ohne Netz.
4. Lexend läuft breiter als Nunito und hat kein 800/900: enge Stellen (Fußleiste, Zahlentafel,
   Reiter) bei 390 px nachprüfen; `font-weight: 800/900` fällt auf 700.
5. Rote Zähler der App nutzen `--bad` als Fläche mit weißer Schrift (heute 2,8:1). Dort auf
   `--ci-kreuzrot` mit `--ci-kreuzrot-ink` umstellen.
6. `--ar-spielen` und `--ar-gemeinde` ändern sich sichtbar (siehe Tabelle) – vorher ansehen.

## Dateien

- `ci.css` – Variablen (`--ci-…`), Aliasse für `index.html` und Bausteine.
- `README.md` – diese Regeln.
- `gemeinde-logo.png` – Gemeindelogo (Original).
