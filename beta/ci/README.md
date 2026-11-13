# CI Bibelbuch-Quest

Gewählt am 13.11.2026: Farbe **„Nacht, Gold und Kreuzrot“** mit den Schriften **Cinzel / Lexend / Source Serif 4**.
`ci.css` ist in **Fassung 4**: Standard ist der nachtblaue Look der App („Nacht“), der Dunkelmodus („Tiefnacht“) ist noch dunkler und schaltet sich automatisch nach der Geräte-Einstellung ein. Einen weißen Modus gibt es nicht.
Das Stylesheet ist noch **nicht** in die App eingebunden.

## Einbinden

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Lexend:wght@400;500;700&family=Source+Serif+4:ital,opsz,wght@1,8..60,500;1,8..60,600&display=swap">
<link rel="stylesheet" href="ci/ci.css">
```

Mit der `<link>`-Zeile für die Schriften die `@import`-Zeile oben in `ci.css` löschen.
`<html class="ci">` setzt Seitengrund, Grundschrift und färbt `h1`–`h3` und `p` automatisch.

## Standard und Dunkel

| Einstellung | Wirkung |
|---|---|
| nichts gesetzt | Standard „Nacht“; steht das Gerät auf dunkel (`prefers-color-scheme: dark`), automatisch „Tiefnacht“ |
| `<html data-theme="light">` | immer Standard „Nacht“ |
| `<html data-theme="dark">` | immer „Tiefnacht“ |

Die Variablen haben drei Ebenen:

1. **`--ci-pal-…`** – feste Palette (Abschnitt 1). Wird nur in den Bedeutungs-Variablen benutzt.
2. **`--ci-farbe-…`** – Farbe nach Bedeutung, je Modus belegt (Abschnitte 3 und 4).
   **Bausteine verwenden nur diese**, sonst stimmt der Dunkelmodus nicht.
3. **Maße** – Schrift, Abstände, Radien, Schatten, Ebenen (Schatten je Modus).

## Farben nach Bedeutung

| Variable | Standard „Nacht“ | Dunkel „Tiefnacht“ | Einsatz |
|---|---|---|---|
| `--ci-farbe-hintergrund` | `#0E1226` | `#080A17` | Seitengrund |
| `--ci-farbe-hintergrund-tief` | `#151A36` | `#0C0F22` | Eingabefeld, Schiene, Balken |
| `--ci-farbe-oberflaeche` | `#1B2146` | `#10142C` | Karte, Kachel, Fußleiste |
| `--ci-farbe-oberflaeche-hoch` | `#262E5E` | `#181D3C` | Modal, Toast |
| `--ci-farbe-text` | `#F6F8FF` | `#E9ECF8` | Fließtext (dunkel etwas gedämpft gegen Blendung) |
| `--ci-farbe-text-leise` | `#A3ABD8` | `#949CC6` | Untertitel, Hinweise, Platzhalter |
| `--ci-farbe-titel` / `--ci-farbe-akzent-text` | `#F2C14E` | `#F2C14E` | Überschriften, Links, Zahlen |
| `--ci-farbe-linie` | `#323B74` | `#24294F` | nur Schmuck |
| `--ci-farbe-linie-stark` | `#7480C4` | `#5F6BAB` | Rand von Feld und sekundärem Knopf |
| `--ci-farbe-primaer` | `#F2C14E` | `#F2C14E` | Hauptknopf, Ring, Balken |
| `--ci-farbe-auf-primaer` | `#2A1D02` | `#2A1D02` | Schrift auf Gold |
| `--ci-farbe-primaer-hauch` | Gold 14 % | Gold 11 % | eigene Ranglistenzeile, Umschalter an |
| `--ci-farbe-signal` | `#E8141B` | `#E8141B` | Zähler, „neu“, Fehlerrand – nie große Fläche |
| `--ci-farbe-auf-signal` | `#FFFFFF` | `#FFFFFF` | Schrift auf Kreuzrot |
| `--ci-farbe-fehler-text` | `#FF8087` | `#FF8087` | Fehlertext |
| `--ci-farbe-ok` / `--ci-farbe-warnung` | `#5FE0B0` / `#FFB54A` | gleich | Zustände |
| `--ci-farbe-gesperrt-flaeche` / `-text` | `#2B3050` / `#A4A9C0` | `#1C2040` / `#9499B3` | Gesperrtes |
| `--ci-farbe-fokus` | `#FFE39A` | `#FFE39A` | Tastatur-Fokusrahmen |
| `--ci-farbe-hover` / `-gedrueckt` | Weiß 8 % / 14 % | Weiß 6 % / 11 % | Überlagerung bei Hover/Druck |

Gold, Kreuzrot und die Bereichsfarben sind in beiden Modi gleich.

### Bereichsfarben (`data-bereich="…"` setzt `--ar`)

| Bereich | Variable | Wert |
|---|---|---|
| Lernen (Saphir) | `--ci-farbe-lernen` | `#7FC8FF` |
| Spielen (Bernstein) | `--ci-farbe-spielen` | `#FFB54A` |
| Gemeinde (Grün) | `--ci-farbe-gemeinde` | `#5FE0B0` |
| Laden/Lohn (Violett) | `--ci-farbe-lohn` | `#B38CFF` |
| Biblionär (Türkis) | `--ci-farbe-biblionaer` | `#66E0D0` |
| Duell (Koralle) | `--ci-farbe-duell` | `#FF8A5C` |
| Spenden (Rosé) | `--ci-farbe-spende` | `#F4A6C8` |
| Bedienung (Silber) | `--ci-farbe-bedienung` | `#E3E9F6` |

Schrift auf einer Bereichsfarbe: `--ci-farbe-auf-bereich` (Nacht bzw. Tiefnacht).

## Abstände, Radien, Schatten

| Abstand | `--ci-abstand-1` … `-8` | 4 · 8 · 12 · 16 · 24 · 32 · 40 · 56 px |
|---|---|---|
| Radien | `--ci-radius-s/m/l/rund` | 8 · 12 · 18 px · rund |
| Schatten | `--ci-schatten-1/2/3` | flach (Karte) · mittel (erhöht, Hover) · hoch (Modal, Fußleiste) |
| Goldschein | `--ci-schein` / `--ci-schein-hover` | nur Hauptknopf und Belohnung |
| Innenlicht | `--ci-innenlicht` | Glanzkante oben am Goldknopf |

Im Dunkelmodus sind die Schatten tiefer und der Goldschein etwas ruhiger.

## Schriften und Typografie

| Klasse / Element | Schrift | Größe |
|---|---|---|
| `.ci-h1` / `h1` | Cinzel 800, Großbuchstaben, Gold | 28 px |
| `.ci-h2` / `h2` | Cinzel 800 | 22 px |
| `.ci-h3` / `h3` | Cinzel 600 | 18 px |
| `.ci-text` / `p` | Lexend 400, Zeilenhöhe 1,55, max. 68 Zeichen | 16 px |
| `.ci-text--gross` / `--klein` | Lexend | 18 / 14 px |
| `.ci-vers` + `.ci-stelle` | Source Serif 4 kursiv 500 + Lexend | 18 / 14 px |
| `.ci-label` | Lexend 700, gesperrt, Goldlinie | 12 px |
| `.ci-unter`, `.ci-leise`, `.ci-zahl`, `.ci-link` | Lexend | 14 px |

`h1`–`h3` und `p` werden nur innerhalb von `.ci` automatisch gestaltet (mit `:where`, also leicht überschreibbar).

## Bausteine

| Baustein | Klassen | Zustände |
|---|---|---|
| Primärer Knopf | `.ci-knopf` | Hover (heller, stärkerer Schein), Active, Fokus, `disabled` |
| Sekundärer Knopf | `.ci-knopf .ci-knopf--sekundaer` | Hover (Goldrand, Goldhauch), Active, Fokus, `disabled` |
| Weitere Knöpfe | `--leise`, `--bereich`, `--duell`, `--gefahr`, `--breit`, `--klein` | wie oben; `aria-pressed="true"` = Umschalter an |
| Eingabefeld | `.ci-feld-gruppe`, `.ci-feld-label`, `.ci-feld` (input/textarea/select), `.ci-feld-hinweis(--fehler)` | Hover, Fokus (Goldrand + Hauch), `aria-invalid="true"`, `disabled` |
| Karte | `.ci-karte` (+ `-kopf`, `-inhalt`, `-fuss`) | `--erhoeht`, `--bereich`, `--akzent`, `--klickbar` (Hover/Active/Fokus), `.ist-gesperrt` |
| Kleinteile | `.ci-marke(--signal/--bereich/--leise/--ok/--gesperrt)`, `.ci-zaehler(--ecke)`, `.ci-ring`, `.ci-medaillon`, `.ci-logo(--klein/--gross)` | |
| Bereich | `.ci-bereichskopf`, `.ci-tafel`, `.ci-balken(--bereich/--duell/--schmal)` | |
| Listen | `.ci-liste`, `.ci-zeile`, `.ci-zeile--ich`, `.ci-zeile-rang(--podest)`, `-haupt`, `-wert` | Hover/Active bei `<button>`/`<a>` |
| Meldung | `.ci-meldung(--fehler/--ok/--warnung)` | |
| Navigation | `.ci-reiter`, `.ci-fussleiste` | `aria-selected`, `aria-current`, `.ist-aktiv` |
| Überlagerung | `.ci-modal` + `.ci-modal-karte(--weit)` + `.ci-modal-knoepfe`, `.ci-toast(--ok/--fehler)` | `hidden` |
| Seite | `.ci-seite(--mit-fussleiste)`, `.ci-stapel(--eng/--weit)` | |
| Helfer | `.ist-gesperrt`, `.ci-schein`, `.ci-schatten-1/2/3`, `.ci-nur-vorlesen` | |

## Kontraste (WCAG 2.1, im Browser gemessen)

| Paar | Standard | Dunkel |
|---|---|---|
| Text auf Hintergrund | 17,5 | 16,7 |
| Text leise auf Hintergrund | 6,9 | 6,8 |
| Titel (Gold) auf Hintergrund | 11,0 | 11,7 |
| Akzent-Zahl auf Oberfläche | 9,3 | 10,8 |
| Schrift auf Gold | 9,8 | 9,8 |
| Sekundärer Knopf | 14,6 | 15,4 |
| Gesperrter Knopf / Feld | 5,5 | 5,6 |
| Fehlertext | 6,4 | 7,5 |
| Weiß auf Kreuzrot (Marke, Zähler) | 4,6 | 4,6 |
| Schrift auf Bereichsknopf (Lernen) | 10,2 | 10,9 |
| Bereichsfarbe als Untertitel | 11,3 | 12,0 |
| Linie stark (Bedien-Rand) auf Oberfläche | 4,2 | 3,6 |

Alle Texte erreichen AA (4,5:1), alle Bedien-Ränder 3:1. `--ci-farbe-linie` ist nur Schmuck.

## Regeln

- **Gold führt, Kreuzrot meldet.** Rot nur für Zähler, „neu“, Fehler und Duell-Hinweise – nie als große Fläche oder für Titel. Schrift auf Kreuzrot immer reinweiß.
- In Bausteinen nur `--ci-farbe-…` verwenden, keine festen Werte.
- Titel in Cinzel immer in Großbuchstaben; Fließtext in Lexend; Verse in Source Serif 4 **kursiv**, Stelle darunter in Lexend (Schlachter 2000).
- Das Logo nicht umfärben; es steht immer auf einer weißen Scheibe (`.ci-logo`).
- Höchstens ein primärer Knopf je Ansicht. Sekundäre und Bedienknöpfe ohne Schein, Gesperrtes grau ohne Schein, zusätzlich Schloss-Symbol und `aria-disabled`.
- Alles passt bei 390 px ohne seitliches Wischen: Kinder in Flex/Grid bekommen `min-width: 0`, Spalten `minmax(0, 1fr)`.
- Tippflächen mindestens 44 px, Eingabefelder 16 px Schrift (sonst zoomt iOS).

## Namen wie in `index.html`

`--bg`, `--bg2`, `--surface`, `--surface2`, `--line`, `--fg`, `--muted`, `--accent`, `--accent-ink`, `--good`, `--bad`,
`--display`, `--body`, `--serif`, `--ar`, `--ar-lernen/-spielen/-gemeinde/-lohn`, `--fs-s/-m/-l`, `--tap`
zeigen auf die CI-Werte. Sie wirken nur, wenn `ci.css` **nach** dem `<style>` der App geladen wird.

## Beim Einbau in die App beachten

1. Standard „Nacht“ entspricht dem heutigen Look. Wer das Gerät auf dunkel stellt, bekommt automatisch „Tiefnacht“; soll die App vorerst immer gleich aussehen: `<html data-theme="light">` setzen.
2. Bereichsfarben weichen ab: In `index.html` ist Spielen Violett und Gemeinde Koralle, die CI legt Bernstein und Grün fest.
3. Lexend läuft breiter als Nunito und hat kein 800/900 – enge Stellen (Fußleiste, Zahlentafel) bei 390 px prüfen.
4. `ci/ci.css` in die `APP`-Liste von `sw.js` aufnehmen (Offline-Start).
5. Rote Zähler der App (`--bad` als Fläche) auf `--ci-farbe-signal` umstellen.
6. Modal: Fokusfalle, Escape und `inert` liefert die App selbst; das CSS stellt nur das Aussehen.

## Dateien

- `ci.css` – Variablen und Bausteine
- `gemeinde-logo.png` – Gemeindelogo (Original)
