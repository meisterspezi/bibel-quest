# Bibelbuch-Quest veröffentlichen

Teil A: App auf GitHub Pages bringen · Teil B: Gemeinde-Rangliste einrichten (einmalig, ca. 10 Minuten)

# Teil A – GitHub Pages

## 1. GitHub-Konto anlegen
1. Auf https://github.com/signup registrieren (kostenlos).
2. Der Benutzername wird Teil der Adresse: https://BENUTZERNAME.github.io/bibel-quest/

## 2. Neues Repository anlegen
1. Oben rechts auf **+** → **New repository**.
2. Name: `bibel-quest` · Sichtbarkeit: **Public** · auf **Create repository** klicken.

## 3. Dateien hochladen
1. Die ZIP-Datei auf dem PC entpacken.
2. Im neuen Repository auf **uploading an existing file** (bzw. **Add file → Upload files**) klicken.
3. **Den Inhalt** des Ordners (index.html, logo.png, sw.js, qrcode.js, leaderboard.js, firebase-config.js, manifest.webmanifest, .nojekyll, README.md und den Ordner `icons`) per Drag-and-drop ins Browserfenster ziehen – nicht den Ordner selbst.
   Hinweis: `.nojekyll` ist eine versteckte Datei. Falls sie nicht mitkommt, ist das nicht schlimm.
4. Unten auf **Commit changes** klicken.

## 4. GitHub Pages einschalten
1. Im Repository auf **Settings** → links **Pages**.
2. Bei **Source**: „Deploy from a branch“ · Branch **main** · Ordner **/ (root)** → **Save**.
3. Nach 1–3 Minuten erscheint oben die Adresse der App.

## 5. Testen und teilen
1. Die Adresse auf dem Handy öffnen (iPhone: Safari, Android: Chrome).
2. In der App auf **Teilen** tippen – dort steht der QR-Code mit der richtigen Adresse.
3. Zum Startbildschirm hinzufügen:
   - iPhone: Teilen-Symbol → „Zum Home-Bildschirm“
   - Android: Menü ⋮ → „App installieren“

**Nur mit dem Handy (Chrome, nicht die GitHub-App):** Erst alle Dateien ohne Ordner hochladen, dann die vier Bilder über
https://github.com/meisterspezi/bibel-quest/upload/main/icons hochladen – sie landen so automatisch im Ordner `icons`.

## Später etwas ändern
1. Geänderte Datei im Repository hochladen (gleicher Name ersetzt die alte).
2. In `sw.js` die Zeile `const VERSION = "bibel-quest-v1";` auf `v2`, `v3` … erhöhen, damit alle Handys das Update laden.

## Gut zu wissen
- Jeder Spieler hat seinen eigenen Spielstand im Browser seines Geräts.
- Wer die Websitedaten löscht, beginnt von vorn.
- Die App funktioniert nach dem ersten Öffnen auch offline.


# Teil B – Gemeinde-Rangliste mit Firebase (kostenlos)

Die App läuft auch ohne diesen Teil. Die Rangliste zeigt dann „Noch nicht eingerichtet“.

## 1. Firebase-Projekt anlegen
1. https://console.firebase.google.com öffnen und mit deinem Google-Konto anmelden.
2. **Projekt erstellen** → Name `bibel-quest` → Google Analytics **ausschalten** → **Projekt erstellen**.

## 2. Anonyme Anmeldung einschalten
1. Links **Entwickeln/Build → Authentication** → **Jetzt starten**.
2. Reiter **Anmeldemethode** → **Anonym** → **Aktivieren** → **Speichern**.
3. Reiter **Einstellungen** → **Autorisierte Domains** → **Domain hinzufügen** → `meisterspezi.github.io`.

## 3. Datenbank anlegen
1. Links **Build → Firestore Database** → **Datenbank erstellen**.
2. Standort: **eur3 (Europa)** · Modus: **Produktionsmodus** → **Erstellen**.
3. Reiter **Regeln** → alles löschen → den Inhalt der Datei `firestore-regeln.txt` einfügen → **Veröffentlichen**.

## 4. Web-App registrieren und Werte eintragen
1. Links oben auf das Zahnrad → **Projekteinstellungen** → unten **Meine Apps** → Symbol **</>** (Web).
2. Spitzname `Bibel-Quest` → **App registrieren** (Firebase Hosting NICHT anhaken).
3. Es erscheint ein Block `const firebaseConfig = { apiKey: "...", ... }`.
4. Diese Werte in die Datei `firebase-config.js` übertragen (statt `HIER_EINTRAGEN`)
   – oder den Block einfach an Claude schicken, dann wird die Datei fertig zurückgegeben.
5. Die geänderte `firebase-config.js` bei GitHub hochladen (ersetzt die alte).

## 5. Testen
1. App öffnen → **Gemeinde-Rangliste** → Spitzname eingeben → **Beitreten**.
2. In der Firebase-Konsole unter Firestore erscheint jetzt ein Eintrag in `spieler`.

## So funktioniert die Rangliste
- **Woche:** Wer sammelt diese Kalenderwoche die meisten XP? Startet jeden Montag neu.
- **Gesamt:** Alle XP seit Beginn.
- **Kette:** Längste fehlerfreie Kette (max. 66 Bücher).
- Jeder sieht nur Spitznamen, Level und Punkte – keine E-Mail, kein Klarname.
- Jeder kann jederzeit **Austreten**; sein Eintrag wird dann gelöscht.

## Verwalten
- Unpassende Namen löschen: Firebase-Konsole → Firestore → `spieler` → Eintrag → **Dokument löschen**.
- Kosten: Der kostenlose Spark-Tarif reicht für eine Gemeinde bei weitem (50.000 Lesevorgänge pro Tag).
- Die Regeln verhindern unsinnige Werte, aber ein technisch versierter Spieler könnte seine Punkte fälschen.
  Für eine Gemeinde-Rangliste unter Freunden ist das vertretbar.
