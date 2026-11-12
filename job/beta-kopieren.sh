#!/bin/sh
# Bibelbuch-Quest – Beta-Kanal (9.60): legt den App-Stand eines Zweigs oder Commits in den Ordner beta/ (auf main ausführen).
#   job/beta-kopieren.sh <zweig-oder-commit>     z. B.  job/beta-kopieren.sh claude/mein-zweig
# Live bleibt, was im Hauptordner liegt; die Beta ist, was in beta/ liegt. Regel: beta/ ist nie älter als Live –
# nach jeder Live-Veröffentlichung ohne laufende Beta also  job/beta-kopieren.sh HEAD  ausführen.
set -e
ref="${1:-HEAD}"
rm -rf beta && mkdir beta
git archive "$ref" -- $(git ls-tree --name-only "$ref" | grep -v -x -e beta -e job -e worker -e .github -e ANLEITUNG.md -e README.md -e firestore-regeln.txt) | tar -x -C beta
echo "beta/ enthält jetzt den Stand $(git rev-parse --short "$ref") – Version $(grep -o 'APP_VERSION = "[^"]*"' beta/daten.js | cut -d'"' -f2)"
