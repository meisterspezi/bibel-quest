# CI Bibelbuch-Quest

Gewählt am 13.11.2026: Farbe **„Nacht, Gold und Kreuzrot“** mit den Schriften **Cinzel / Lexend / Source Serif 4**.
`ci.css` ist in **Fassung 3**: heller Modus als Standard, Dunkelmodus automatisch nach Geräte-Einstellung.
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

## Hell und Dunkel

| Einstellung | Wirkung |
|---|---|
| nichts gesetzt | folgt dem Gerät (`prefers-color-scheme`) |
| `<html data-theme="dark">` | immer dunkel – so sieht die App heute aus |
| `<html data-theme="light">` | immer hell – z. B. für Website und Druck |

Die Variablen haben drei Ebenen:

1. **`--ci-pal-…`** – feste Palette (Abschnitt 1). Wird nur in den Bedeutungs-Variablen benutzt.
2. **`--ci-farbe-…`** – Farbe nach Bedeutung, je Modus anders belegt (Abschnitte 3 und 4).
   **Bausteine verwenden nur diese**, sonst stimmt der Modus nicht.
3. **Maße** – Schrift, Abstände, Radien, Schatten, Ebenen (gleich in beiden Modi, Schatten je Modus).

## Farben nach Bedeutung

| Variable | Hell | Dunkel | Einsatz |
|---|---|---|---|
| `--ci-farbe-hintergrund` | `#F5F6FA` | `#0E1226` | Seitengrund |
| `--ci-farbe-hintergrund-tief` | `#ECEEF5` | `#151A36` | Eingabefeld, Schiene, Balken |
| `--ci-farbe-oberflaeche` | `#FFFFFF` | `#1B2146` | Karte, Kachel, Fußleiste |
| `--ci-farbe-oberflaeche-hoch` | `#FFFFFF` | `#262E5E` | Modal, Toast |
| `--ci-farbe-text` | `#0E1226` | `#F6F8FF` | Fließtext |
| `--ci-farbe-text-leise` | `#4B5470` | `#A3ABD8` | Untertitel, Hinweise, Platzhalter |
| `--ci-farbe-titel` | `#7A4E0C` | `#F2C14E` | Überschriften (Gold) |
| `--ci-farbe-akzent-text` | `#7A4E0C` | `#F2C14E` | Links, Zahlen, Ring |
| `--ci-farbe-linie` | `#DDE1EE` | `#323B74` | nur Schmuck |
| `--ci-farbe-linie-stark` | `#7A83A6` | `#7480C4` | Rand von Feld und sekundärem Knopf |
| `--ci-farbe-primaer` | `#F2C14E` | `#F2C14E` | Hauptknopf, Ring, Balken |
| `--ci-farbe-auf-primaer` | `#2A1D02` | `#2A1D02` | Schrift auf Gold |
| `--ci-farbe-primaer-hauch` | `#FBF3DC` | Gold 14 % | eigene Ranglistenzeile, Umschalter an |
| `--ci-farbe-signal` | `#E8141B` | `#E8141B` | Zähler, „neu“, Fehlerrand – nie große Fläche |
| `--ci-farbe-auf-signal` | `#FFFFFF` | `#FFFFFF` | Schrift auf Kreuzrot |
| `--ci-farbe-fehler-text` | `#C00A14` | `#FF8087` | Fehlertext |
| `--ci-farbe-ok` / `--ci-farbe-warnung` | `#0A7A55` / `#9A5400` | `#5FE0B0` / `#FFB54A` | Zustände |
| `--ci-farbe-gesperrt-flaeche` / `-text` | `#E7E9F0` / `#5C6276` | `#2B3050` / `#A4A9C0` | Gesperrtes |
| `--ci-farbe-fokus` | `#1B2A55` | `#FFE39A` | Tastatur-Fokusrahmen |
| `--ci-farbe-hover` / `-gedrueckt` | Nacht 5 % / 9 % | Weiß 8 % / 14 % | Überlagerung bei Hover/Druck |

Gold als **Fläche** bleibt in beiden Modi `#F2C14E`. Als **Schrift** auf Hell wird es zu Bronze `#7A4E0C`,
weil helles Gold auf Weiß nur 1,7:1 erreicht.

### Bereichsfarben (`data-bereich="…"` setzt `--ar`)

| Bereich | Variable | Hell | Dunkel |
|---|---|---|---|
| Lernen (Saphir) | `--ci-farbe-lernen` | `#0B6AA8` | `#7FC8FF` |
| Spielen (Bernstein) | `--ci-farbe-spielen` | `#9A5400` | `#FFB54A` |
| Gemeinde (Grün) | `--ci-farbe-gemeinde` | `#0A7A55` | `#5FE0B0` |
| Laden/Lohn (Violett) | `--ci-farbe-lohn` | `#6A3FC4` | `#B38CFF` |
| Biblionär (Türkis) | `--ci-farbe-biblionaer` | `#08776C` | `#66E0D0` |
| Duell (Koralle) | `--ci-farbe-duell` | `#B8441A` | `#FF8A5C` |
| Spenden (Rosé) | `--ci-farbe-spende` | `#A8336C` | `#F4A6C8` |
| Bedienung (Silber) | `--ci-farbe-bedienung` | `#4B5470` | `#E3E9F6` |

Schrift auf einer Bereichsfarbe: `--ci-farbe-auf-bereich` (hell: Weiß, dunkel: Nacht).

## Abstände, Radien, Schatten

| Abstand | `--ci-abstand-1` … `-8` | 4 · 8 · 12 · 16 · 24 · 32 · 40 · 56 px |
|---|---|---|
| Radien | `--ci-radius-s/m/l/rund` | 8 · 12 · 18 px · rund |
| Schatten | `--ci-schatten-1/2/3` | flach (Karte) · mittel (erhöht, Hover) · hoch (Modal, Fußleiste) |
| Goldschein | `--ci-schein` / `--ci-schein-hover` | nur Hauptknopf und Belohnung |
| Innenlicht | `--ci-innenlicht` | Glanzkante oben am Goldknopf |

Schatten sind im hellen Modus blaugrau und zart, im dunklen schwarz und kräftiger.

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

| Paar | Hell | Dunkel |
|---|---|---|
| Text auf Hintergrund | 17,2 | 17,5 |
| Text leise auf Oberfläche | 7,5 | 6,9 |
| Titel (Gold) auf Oberfläche | 6,7 | 11,0 |
| Akzent-Zahl auf Oberfläche | 7,2 | 9,3 |
| Schrift auf Gold | 9,8 | 9,8 |
| Sekundärer Knopf | 18,5 | 14,6 |
| Gesperrter Knopf / Feld | 5,0 | 5,5 |
| Fehlertext | 6,4 | 6,4 |
| Weiß auf Kreuzrot (Marke, Zähler) | 4,6 | 4,6 |
| Schrift auf Bereichsknopf (Lernen) | 5,8 | 10,2 |
| Bereichsfarbe als Untertitel (schwächste: Gemeinde hell) | 4,95 | 11,3 |
| Linie stark (Bedien-Rand) auf Oberfläche / tief | 3,7 / 3,2 | 4,2 / 4,6 |

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

1. Die App ist heute nur dunkel. Bis der helle Modus durchgetestet ist: `<html data-theme="dark">` setzen.
2. Bereichsfarben weichen ab: In `index.html` ist Spielen Violett und Gemeinde Koralle, die CI legt Bernstein und Grün fest.
3. Lexend läuft breiter als Nunito und hat kein 800/900 – enge Stellen (Fußleiste, Zahlentafel) bei 390 px prüfen.
4. `ci/ci.css` in die `APP`-Liste von `sw.js` aufnehmen (Offline-Start).
5. Rote Zähler der App (`--bad` als Fläche) auf `--ci-farbe-signal` umstellen.
6. Modal: Fokusfalle, Escape und `inert` liefert die App selbst; das CSS stellt nur das Aussehen.

## Dateien

- `ci.css` – Variablen und Bausteine
- `gemeinde-logo.png` – Gemeindelogo (Original)
