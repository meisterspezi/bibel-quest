/* Bibelbuch-Quest – 9.84–9.92: Sammelalbum (Manna – früher „Goldstaub“/„Öl“ –, goldener Krug, Tauschbeutel) und Jahresrückblick.
   Lädt nach spiel.js. Alles liegt im Spielstand unter S[SM_KEY] – Live „sm2“, Beta „smBeta“ (9.93: getrennt, die Beta bringt in Live keine Vorteile):
   sm = { album:[66 Stufen 0–4], gv/ga: Goldstaub verdient/ausgegeben, gt/gn: Tag + heute verdient,
          be/ba: Tauschbeutel erhalten/ausgegeben je Stufe {1,2,3}, kz: Krüge insgesamt (Treue-Siegel), kt/kn: Tag + heute geöffnet,
          kga: Geschenk-Krüge benutzt (9.85: Geschenke = 1 Startkrug + je 7 Schatztruhen einer), tz: Schatztruhen insgesamt (ab 9.85), lohn: erhaltene Gruppen-Belohnungen,
          ah: Ankündigung gesehen, tour: Album-Tour gesehen,
          rb: Rückblick {f: Fenster gesehen (Jahr), g: geteilt (Jahr), n: Name zeigen}, offen: Krug-Ergebnis, das noch aufgedeckt werden muss } */

/* ---------- Karten-Inhalte (Entwurf 17.11.2026 – von Michael zu prüfen) ----------
   k: Kapitel · v: Verfasser (überliefert) · t: Kernaussage in eigenen Worten · s: Schlüsselstelle · z: worum es dort geht (eigene Worte, kein Zitat) */
const ALBUM_TEXT = [
  { k: 50, v: "Mose", t: "Gott erschafft die Welt und beginnt mit Abraham die Geschichte seines Volkes.", s: "1. Mose 1,1", z: "Gott schafft Himmel und Erde." },
  { k: 40, v: "Mose", t: "Gott befreit Israel aus Ägypten und schließt am Sinai seinen Bund.", s: "2. Mose 20", z: "Die Zehn Gebote." },
  { k: 27, v: "Mose", t: "Gott zeigt, wie sein Volk heilig leben und ihm Opfer bringen soll.", s: "3. Mose 19,18", z: "Liebe deinen Nächsten wie dich selbst." },
  { k: 36, v: "Mose", t: "Israel wandert vierzig Jahre durch die Wüste und erlebt Gottes Treue.", s: "4. Mose 6,24-26", z: "Der Segen, mit dem Aaron das Volk segnet." },
  { k: 34, v: "Mose", t: "Mose erinnert Israel vor dem Einzug ins Land an Gottes Gebote.", s: "5. Mose 6,4-5", z: "Gott von ganzem Herzen lieben." },
  { k: 24, v: "Josua (überliefert)", t: "Israel zieht unter Josua in das verheißene Land ein.", s: "Josua 1,9", z: "Sei stark und mutig – Gott ist mit dir." },
  { k: 21, v: "unbekannt (überliefert: Samuel)", t: "Israel wendet sich immer wieder von Gott ab, und Gott rettet durch Richter.", s: "Richter 21,25", z: "Es gab keinen König, jeder tat, was er für richtig hielt." },
  { k: 4, v: "unbekannt (überliefert: Samuel)", t: "Die Moabiterin Ruth bleibt treu bei Noomi und wird die Urgroßmutter Davids.", s: "Ruth 1,16", z: "Ruth will mit Noomi gehen und ihren Gott annehmen." },
  { k: 31, v: "unbekannt (überliefert: Samuel u. a.)", t: "Samuel, König Saul und der junge David – Gott sucht sich seinen König aus.", s: "1. Samuel 16,7", z: "Der Mensch sieht auf das Äußere, Gott sieht das Herz an." },
  { k: 24, v: "unbekannt (überliefert: Nathan, Gad)", t: "David wird König, und Gott verheißt ihm ein ewiges Königtum.", s: "2. Samuel 7,16", z: "Davids Königtum soll für immer bestehen." },
  { k: 22, v: "unbekannt (überliefert: Jeremia)", t: "Salomo baut den Tempel, danach zerfällt das Reich; Elia tritt auf.", s: "1. Könige 18", z: "Elia und die Propheten Baals auf dem Karmel." },
  { k: 25, v: "unbekannt (überliefert: Jeremia)", t: "Die Könige Israels und Judas bis zur Wegführung nach Babylon.", s: "2. Könige 2,11", z: "Elia wird im Sturm in den Himmel aufgenommen." },
  { k: 29, v: "unbekannt (überliefert: Esra)", t: "Die Geschichte von Adam bis David, mit Blick auf Tempel und Gottesdienst.", s: "1. Chronik 16,34", z: "Dankt dem Herrn, denn er ist gut." },
  { k: 36, v: "unbekannt (überliefert: Esra)", t: "Von Salomo bis zum Ende Judas – Gott ruft immer wieder zur Umkehr.", s: "2. Chronik 7,14", z: "Wenn Gottes Volk sich demütigt und betet, will er hören und heilen." },
  { k: 10, v: "Esra", t: "Juden kehren aus Babylon zurück und bauen den Tempel wieder auf.", s: "Esra 7,10", z: "Esra will Gottes Gesetz erforschen, tun und lehren." },
  { k: 13, v: "Nehemia", t: "Nehemia baut die Mauern Jerusalems wieder auf.", s: "Nehemia 8,10", z: "Die Freude am Herrn ist eure Stärke." },
  { k: 10, v: "unbekannt", t: "Gott bewahrt sein Volk in Persien durch Königin Esther.", s: "Esther 4,14", z: "Vielleicht bist du gerade für diese Zeit Königin geworden." },
  { k: 42, v: "unbekannt", t: "Ein gerechter Mann verliert alles, ringt mit Gott und begegnet ihm.", s: "Hiob 19,25", z: "Ich weiß, dass mein Erlöser lebt." },
  { k: 150, v: "David und andere", t: "Lieder und Gebete Israels – Lob, Klage, Dank und Vertrauen.", s: "Psalm 23", z: "Der Herr ist mein Hirte." },
  { k: 31, v: "Salomo und andere", t: "Weisheit für das tägliche Leben.", s: "Sprüche 1,7", z: "Die Furcht des Herrn ist der Anfang der Erkenntnis." },
  { k: 12, v: "überliefert: Salomo", t: "Ohne Gott ist alles vergänglich – das Leben ist Gottes Gabe.", s: "Prediger 3,1", z: "Alles hat seine Zeit." },
  { k: 8, v: "überliefert: Salomo", t: "Ein Lied über die Liebe zwischen Braut und Bräutigam.", s: "Hohelied 8,6", z: "Die Liebe ist stark wie der Tod." },
  { k: 66, v: "Jesaja", t: "Gericht und Trost – Jesaja kündigt den kommenden Retter an.", s: "Jesaja 53,5", z: "Der Gottesknecht wird für unsere Schuld verwundet." },
  { k: 52, v: "Jeremia", t: "Jeremia warnt Juda vor dem Gericht und verheißt einen neuen Bund.", s: "Jeremia 29,11", z: "Gott hat Gedanken des Friedens und gibt Hoffnung." },
  { k: 5, v: "überliefert: Jeremia", t: "Trauer über das zerstörte Jerusalem – und Hoffnung auf Gottes Treue.", s: "Klagelieder 3,22-23", z: "Gottes Güte ist jeden Morgen neu." },
  { k: 48, v: "Hesekiel", t: "Hesekiel sieht im Exil Gottes Herrlichkeit und verkündet einen Neuanfang.", s: "Hesekiel 36,26", z: "Gott schenkt ein neues Herz und einen neuen Geist." },
  { k: 12, v: "Daniel", t: "Daniel bleibt in Babylon Gott treu und sieht Gottes Reich kommen.", s: "Daniel 6", z: "Daniel in der Löwengrube." },
  { k: 14, v: "Hosea", t: "Gott liebt sein untreues Volk trotz allem.", s: "Hosea 6,6", z: "Gott wünscht Liebe statt Opfer." },
  { k: 4, v: "Joel", t: "Der Tag des Herrn kommt – und Gott gießt seinen Geist aus.", s: "Joel 3,1", z: "Gott gießt seinen Geist über alle Menschen aus." },
  { k: 9, v: "Amos", t: "Gott fordert Gerechtigkeit, besonders für die Armen.", s: "Amos 5,24", z: "Das Recht soll fließen wie Wasser." },
  { k: 1, v: "Obadja", t: "Gericht über Edom, das sich über Israels Not freute.", s: "Obadja 1,15", z: "Wie du getan hast, so wird dir geschehen." },
  { k: 4, v: "überliefert: Jona", t: "Gottes Erbarmen gilt auch der feindlichen Stadt Ninive.", s: "Jona 2,1", z: "Ein großer Fisch verschluckt Jona." },
  { k: 7, v: "Micha", t: "Micha kündigt Gericht an und den Retter aus Bethlehem.", s: "Micha 6,8", z: "Recht tun, Güte lieben und demütig mit Gott gehen." },
  { k: 3, v: "Nahum", t: "Gericht über Ninive – Gott ist eine Zuflucht für alle, die ihm vertrauen.", s: "Nahum 1,7", z: "Der Herr ist gütig, eine Zuflucht in der Not." },
  { k: 3, v: "Habakuk", t: "Habakuk fragt Gott nach dem Warum und lernt, ihm zu vertrauen.", s: "Habakuk 2,4", z: "Der Gerechte wird durch seinen Glauben leben." },
  { k: 3, v: "Zephanja", t: "Der Tag des Herrn kommt – Gott freut sich über sein gerettetes Volk.", s: "Zephanja 3,17", z: "Gott freut sich über dich mit Jubel." },
  { k: 2, v: "Haggai", t: "Haggai ruft das Volk auf, den Tempel fertig zu bauen.", s: "Haggai 1,8", z: "Holt Holz und baut das Haus Gottes." },
  { k: 14, v: "Sacharja", t: "Visionen von Gottes Zukunft und dem kommenden König.", s: "Sacharja 9,9", z: "Dein König kommt zu dir, sanftmütig auf einem Esel." },
  { k: 3, v: "Maleachi", t: "Die letzte Mahnung des Alten Testaments und die Ankündigung des Boten.", s: "Maleachi 3,1", z: "Gott sendet seinen Boten, der den Weg bereitet." },
  { k: 28, v: "Matthäus", t: "Jesus ist der verheißene König und Messias.", s: "Matthäus 28,19-20", z: "Jesus sendet seine Jünger zu allen Völkern." },
  { k: 16, v: "Markus", t: "Jesus ist der Sohn Gottes, der gekommen ist, um zu dienen.", s: "Markus 10,45", z: "Jesus kam, um zu dienen und sein Leben zu geben." },
  { k: 24, v: "Lukas", t: "Jesus ist der Retter aller Menschen.", s: "Lukas 19,10", z: "Jesus sucht und rettet, was verloren ist." },
  { k: 21, v: "Johannes", t: "Jesus ist der Sohn Gottes – wer an ihn glaubt, hat das Leben.", s: "Johannes 3,16", z: "So sehr hat Gott die Welt geliebt." },
  { k: 28, v: "Lukas", t: "Das Evangelium breitet sich von Jerusalem bis nach Rom aus.", s: "Apostelgeschichte 1,8", z: "Ihr werdet meine Zeugen sein." },
  { k: 16, v: "Paulus", t: "Gerecht vor Gott wird man allein durch den Glauben an Jesus.", s: "Römer 1,16", z: "Das Evangelium ist eine Kraft Gottes zur Rettung." },
  { k: 16, v: "Paulus", t: "Paulus hilft einer Gemeinde mit vielen Problemen – der größte Weg ist die Liebe.", s: "1. Korinther 13", z: "Das Hohelied der Liebe." },
  { k: 13, v: "Paulus", t: "Gottes Kraft zeigt sich gerade in Schwachheit.", s: "2. Korinther 12,9", z: "Meine Gnade genügt dir." },
  { k: 6, v: "Paulus", t: "In Christus sind wir frei – nicht durch das Gesetz gerecht.", s: "Galater 5,22-23", z: "Die Frucht des Geistes." },
  { k: 6, v: "Paulus", t: "Aus Gnade gerettet – die Gemeinde ist der Leib Christi.", s: "Epheser 2,8-9", z: "Aus Gnade seid ihr gerettet durch den Glauben." },
  { k: 4, v: "Paulus", t: "Freude in Christus, auch im Gefängnis.", s: "Philipper 4,4", z: "Freut euch im Herrn allezeit." },
  { k: 4, v: "Paulus", t: "Christus steht über allem – in ihm haben wir alles.", s: "Kolosser 3,17", z: "Tut alles im Namen des Herrn Jesus." },
  { k: 5, v: "Paulus", t: "Hoffnung auf die Wiederkunft Jesu und ein Leben, das Gott gefällt.", s: "1. Thessalonicher 5,16-18", z: "Freut euch, betet und seid dankbar." },
  { k: 3, v: "Paulus", t: "Standhaft bleiben, bis Jesus wiederkommt.", s: "2. Thessalonicher 3,3", z: "Der Herr ist treu und bewahrt euch." },
  { k: 6, v: "Paulus", t: "Anweisungen an Timotheus für das Leben in der Gemeinde.", s: "1. Timotheus 4,12", z: "Niemand soll dich wegen deiner Jugend geringachten." },
  { k: 4, v: "Paulus", t: "Paulus' letzter Brief: Bleib treu beim Wort Gottes.", s: "2. Timotheus 3,16", z: "Die ganze Schrift ist von Gott eingegeben." },
  { k: 3, v: "Paulus", t: "Gesunde Lehre und gute Werke für die Gemeinden auf Kreta.", s: "Titus 2,11", z: "Gottes rettende Gnade ist erschienen." },
  { k: 1, v: "Paulus", t: "Paulus bittet Philemon, seinen entlaufenen Sklaven Onesimus als Bruder aufzunehmen.", s: "Philemon 1,16", z: "Nicht mehr als Sklaven, sondern als geliebten Bruder." },
  { k: 13, v: "unbekannt", t: "Jesus ist größer als alles im Alten Bund – haltet fest am Glauben.", s: "Hebräer 11,1", z: "Was Glaube ist." },
  { k: 5, v: "Jakobus", t: "Echter Glaube zeigt sich in Taten.", s: "Jakobus 2,17", z: "Glaube ohne Taten ist tot." },
  { k: 5, v: "Petrus", t: "Hoffnung und Halt für Christen, die leiden.", s: "1. Petrus 5,7", z: "Werft alle eure Sorgen auf Gott." },
  { k: 3, v: "Petrus", t: "Wachsam bleiben gegen Irrlehre und auf Jesu Wiederkunft warten.", s: "2. Petrus 3,9", z: "Gott ist geduldig und will, dass alle umkehren." },
  { k: 5, v: "Johannes", t: "Gott ist Liebe – wer ihn kennt, liebt auch seine Geschwister.", s: "1. Johannes 4,8", z: "Gott ist Liebe." },
  { k: 1, v: "Johannes", t: "In der Wahrheit und in der Liebe bleiben.", s: "2. Johannes 1,6", z: "Liebe heißt, nach Gottes Geboten zu leben." },
  { k: 1, v: "Johannes", t: "Lob für Gastfreundschaft gegenüber den Mitarbeitern im Evangelium.", s: "3. Johannes 1,4", z: "Die größte Freude: Kinder, die in der Wahrheit leben." },
  { k: 1, v: "Judas", t: "Kämpft für den Glauben, der den Christen ein für alle Mal anvertraut ist.", s: "Judas 1,3", z: "Für den Glauben kämpfen." },
  { k: 22, v: "Johannes", t: "Jesus siegt – Gott macht am Ende alles neu.", s: "Offenbarung 21,4", z: "Gott wischt alle Tränen ab." }
];

/* ---------- 10.0: Zeitschalter für den Live-Start ----------
   Das Sammelalbum erscheint in Live erst ab Mittwoch, 18.11.2026, 08:00 Uhr (deutsche Zeit = 07:00 UTC).
   Vorher: kein Manna, keine Anzeige, keine Ankündigung. In der Beta und auf localhost immer frei. */
const SM_START = Date.UTC(2026, 10, 18, 7, 0, 0);
const smFrei = () => (typeof BETA !== "undefined" && BETA) || /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || Date.now() >= SM_START;
/* ---------- Regeln ---------- */
const SM_KEY = typeof BETA !== "undefined" && BETA ? "smBeta" : "sm2"; /* 9.93: Beta-Album getrennt vom echten Album */
const SM_KRUG_PREIS = 10, SM_KRUG_KARTEN = 4, SM_KRUG_TAG = 3, SM_TREUE = 7, SM_MAX = 3; /* 9.92: nur Bronze/Silber/Gold, 4 Karten, jeder 7. Krug sicher Gold */
const SM_TAUSCH = { 1: 4, 2: 4 };                             /* 4 Bronze → Silber, 4 Silber → Gold */
const SM_W = { 1: 0.75, 2: 0.20, 3: 0.05 };         /* Seltenheit je Karte */
const SM_W_GESCHENK = { 1: 0.50, 2: 0.40, 3: 0.10 }; /* 10.12: Geschenk-Krüge – doppelte Chance auf Silber und Gold */
const smProz = w => [1, 2, 3].map(r => Math.round(w[r] * 100) + " %");
const SM_STUFE = ["Grau", "Bronze", "Silber", "Gold"];
const SM_RC = { 1: "#d58b4f", 2: "#bfe3ff", 3: "#f2c14e", 4: "#ff9ee8" };
const SM_GC = { geschichte: "#f0b85a", lehre: "#7fc8ff", prophetie: "#c49bff" };
const SM_GRUPPEN_LOHN = { 1: 5, 2: 10, 3: 20 };   /* 10.5: Manna (statt Talente), wenn eine Buchreihe komplett ist; in Gold zusätzlich ein Avatar */
const SM_AV_REIHE = ["alb-gesetz", "alb-geschichte", "alb-weisheit", "alb-grossprop", "alb-kleinprop", "alb-evangelien", "alb-paulus", "alb-briefe"];
/* Freischaltung immer nach dem ECHTEN Album (sm2) – das Beta-Album bringt in Live keine Vorteile */
function smLohnFrei(need) {
  const a = (S.sm2 && Array.isArray(S.sm2.album)) ? S.sm2.album : [];
  if (need === "alb-wort") return a.length === 66 && a.every(x => (x | 0) >= SM_MAX);
  if (need === "alb-wort-s" || need === "alb-wort-b") { const st = need === "alb-wort-s" ? 2 : 1; return a.length === 66 && a.every(x => (x | 0) >= st); }
  const gi = SM_AV_REIHE.indexOf(need); if (gi < 0) return false;
  return ALL.every((b, i) => b.gi !== gi || (a[i] | 0) >= SM_MAX);
}
const SM_SPIEL_Q = ["vers", "lektion", "luecke", "blitz", "kette", "duell", "duelleigen", "bib"];
const smGc = i => SM_GC[gattungVon(i)] || "#f0b85a";
TAB_VON.album = ""; TAB_VON.rueckblick = "";

function smInit() {
  if ("sm" in S) delete S.sm; /* 9.93: Test-Alben der Betas 9.84–9.92 verwerfen */
  if (!S[SM_KEY] || typeof S[SM_KEY] !== "object") S[SM_KEY] = {};
  const m = S[SM_KEY];
  if (!Array.isArray(m.album) || m.album.length !== 66) m.album = Array(66).fill(0);
  if (m.album.some(x => x > SM_MAX)) m.album = m.album.map(x => Math.min(SM_MAX, x | 0)); /* 9.92: Glanz-Karten werden Gold */
  ["gv", "ga", "gn", "kz", "kn", "kga", "tz", "ah", "tour", "gls"].forEach(k => { m[k] = Math.max(0, +m[k] || 0); });
  ["gt", "kt"].forEach(k => { if (typeof m[k] !== "string") m[k] = ""; });
  ["be", "ba"].forEach(k => { if (!m[k] || typeof m[k] !== "object") m[k] = { 1: 0, 2: 0, 3: 0 }; });
  if (!Array.isArray(m.lohn)) m.lohn = [];
  if (!m.rb || typeof m.rb !== "object") m.rb = {};
  if (m.offen && !Array.isArray(m.offen.z)) m.offen = null;
  return m;
}
const smGold = () => { const m = smInit(); return Math.max(0, m.gv - m.ga); };
const smBeutel = r => { const m = smInit(); return Math.max(0, (m.be[r] | 0) - (m.ba[r] | 0)); };
const SM_TRUHE_MANNA = 5; /* 10.1: Manna je Schatztruhe – auch sichtbar auf Truhe und Tagesaufgaben */
const SM_TRUHEN_GESCHENK = 7; /* jede 7. Schatztruhe (insgesamt) = ein Geschenk-Krug */
/* 10.12: Preis für den Biblionär der Woche = 1 Gratiskrug. Gezählt über die gewonnenen Wochen S.bwSiege (ab KW 47/2026) –
   beim Zusammenführen werden die Wochen vereinigt, so zählt kein Sieg doppelt und keiner geht verloren */
const BW_KRUG_AB = "2026-W47";
const smBibKruege = () => (Array.isArray(S.bwSiege) ? S.bwSiege : []).filter(w => typeof w === "string" && w >= BW_KRUG_AB).length;
const smGeschenkeGesamt = () => 1 + Math.floor(smInit().tz / SM_TRUHEN_GESCHENK) + smBibKruege(); /* 1 = Startkrug für alle */
const smGeschenke = () => { const m = smInit(); return Math.max(0, smGeschenkeGesamt() - m.kga); };
/* 10.5: Neue Krüge gibt es jeden Morgen um 8 Uhr – der „Krug-Tag“ beginnt um 8:00 Uhr (Gerätezeit) */
const SM_KRUG_STUNDE = 8;
const smKrugTag = () => dstr(new Date(Date.now() - SM_KRUG_STUNDE * 36e5));
const smHeuteKruege = () => { const m = smInit(); return m.kt === smKrugTag() ? m.kn : 0; };
const smNeueKruegeText = () => (new Date().getHours() < SM_KRUG_STUNDE ? "heute" : "morgen") + " um " + SM_KRUG_STUNDE + " Uhr";
const smGefunden = () => smInit().album.filter(s => s > 0).length;
const smGlanz = () => smInit().album.filter(s => s >= SM_MAX).length; /* 9.92: Goldkarten (Name bleibt für die Rangliste/Sammlung album) */

/* Zwei Geräte zusammenführen: je Wert das Maximum (verdient und ausgegeben getrennt, damit nichts doppelt zählt) */
function smMischen(r) {
  if (!r || !r[SM_KEY] || typeof r[SM_KEY] !== "object") return;
  const m = smInit(), o = r[SM_KEY];
  if (Array.isArray(o.album)) o.album.forEach((s, i) => { if (i < 66) m.album[i] = Math.max(m.album[i] | 0, Math.min(SM_MAX, s | 0)); });
  ["gv", "ga", "kz", "kga", "tz", "ah", "tour"].forEach(k => { m[k] = Math.max(m[k] | 0, +o[k] || 0); });
  [["gt", "gn"], ["kt", "kn"]].forEach(([t, n]) => { if ((o[t] || "") > m[t]) { m[t] = o[t]; m[n] = +o[n] || 0; } else if (o[t] === m[t]) m[n] = Math.max(m[n], +o[n] || 0); });
  ["be", "ba"].forEach(k => { [1, 2].forEach(x => { m[k][x] = Math.max(m[k][x] | 0, ((o[k] || {})[x]) | 0); }); });
  m.lohn = [...new Set([...m.lohn, ...(Array.isArray(o.lohn) ? o.lohn : [])])];
  if (o.rb) Object.keys(o.rb).forEach(k => { if (m.rb[k] === undefined) m.rb[k] = o.rb[k]; });
}

/* ---------- Manna (intern weiter „gold“: smGold, gv/ga) ---------- */
function smGoldGeben(n) {
  const m = smInit(), t = today();
  if (m.gt !== t) { m.gt = t; m.gn = 0; }
  const x = Math.max(0, n | 0); if (x <= 0) return 0; /* 9.86: keine Tagesgrenze mehr – begrenzt sind nur die Krüge (3 am Tag) */
  m.gn += x; m.gv += x; save(); smHud(x); return x;
}
function smGeschenk(grund) {
  save(); smHud(0);
  setTimeout(() => { try { toast(`${SM_KRUG_SVG}<b>Geschenk: ein Krug!</b> ${esc(grund)}`); } catch (e) {} }, 900);
}
/* Wird von addXp nach jeder XP-Vergabe aufgerufen */
function sammelNachXp(n, quelle, info, vorher, nachher) {
  if (!smFrei()) return;
  const m = smInit(); let g = 0; info = info || {};
  if (SM_SPIEL_Q.includes(quelle)) {
    const dauer = info.t0 ? Date.now() - info.t0 : 60000;
    if (dauer >= 30000) { g = 1; if (info.fm && info.f / info.fm >= 0.8) g++; if (quelle === "bib" && /^Wochenrunde/.test(info.d || "")) g += 2; }
  }
  if (quelle === "tagesbonus" && /Schatztruhe/.test(info.d || "")) {
    g += SM_TRUHE_MANNA;
    m.tz++;
    if (m.tz % SM_TRUHEN_GESCHENK === 0) smGeschenk(SM_TRUHEN_GESCHENK + " Schatztruhen gesammelt");
  }
  if (nachher > vorher) g += 3 * (nachher - vorher);
  if (g) smGoldGeben(g);
}
/* 9.89/9.91: Duell-Herausforderung gesendet: +1 Manna, egal ob der andere annimmt – auch an Spieler vom eigenen Gerät */
function smHerausforderung(ziele) {
  if (!smFrei()) return;
  const x = smGoldGeben(1); if (x) setTimeout(() => toast(`Herausforderung gesendet: +${x} Manna`), 1200);
}
/* 10.1: Manna der Schatztruhe sichtbar machen (Truhen-Fenster, Tagesaufgaben, Truhe von gestern) */
const smTruheManna = () => smFrei() ? SM_TRUHE_MANNA : 0;
function smTruheKarte() {
  if (!smFrei()) return "";
  const nach = smInit().tz + 1, rest = SM_TRUHEN_GESCHENK - (nach % SM_TRUHEN_GESCHENK);
  const zeile = nach % SM_TRUHEN_GESCHENK === 0
    ? `<div class="tf-krug">${SM_KRUG_SVG} <b>+1 Geschenk-Krug!</b></div>`
    : `<div class="tf-krug leise">${SM_KRUG_SVG} Noch ${rest} ${rest === 1 ? "Truhe" : "Truhen"} bis zum Geschenk-Krug</div>`;
  return `<div class="tf-karte tf-tal tf-manna">${SM_GOLD_SVG}<b>+${SM_TRUHE_MANNA}</b><span>Manna</span></div>${zeile}`;
}
/* ---------- 10.5: Belohnungen des Sammelalbums – Avatare je Buchreihe in Gold, „Das ganze Wort“ (Avatar + Rahmen) für alle 66 in Gold ---------- */
Object.assign(ICONS, {"av-alb-gesetz": "<svg x=\"0\" y=\"0\" width=\"24\" height=\"24\" viewBox=\"0 0 64 64\" overflow=\"visible\" class=\"wr wr-avatar\"><circle cx=\"32\" cy=\"32\" r=\"22\" fill=\"#fff3b0\" opacity=\".16\"/><path d=\"M32 4c6 8 14 12 14 24 0 6-3 10-6 12 1-6-3-10-8-14-5 4-9 8-8 14-3-2-6-6-6-12 0-12 8-16 14-24z\" fill=\"url(#wrF)\" stroke=\"#1b2a55\" stroke-width=\"1.2\" stroke-linejoin=\"round\"/><path d=\"M14 26c0-5 3-8 8-8s8 3 8 8v30H14z\" fill=\"url(#wrSt)\" stroke=\"#1b2a55\" stroke-width=\"1.4\"/><path d=\"M34 26c0-5 3-8 8-8s8 3 8 8v30H34z\" fill=\"url(#wrSt)\" stroke=\"#1b2a55\" stroke-width=\"1.4\"/><path d=\"M18 30h8M18 35h8M18 40h8M18 45h6M38 30h8M38 35h8M38 40h8M38 45h6\" stroke=\"#6a5e4e\" stroke-width=\"1.6\" stroke-linecap=\"round\"/><path d=\"M16 24c1-3 3-4 6-4\" stroke=\"#fff\" stroke-width=\"1.4\" fill=\"none\" stroke-linecap=\"round\" opacity=\".8\"/><path d=\"M54 5l1.3 3.4 3.4 1.3-3.4 1.3-1.3 3.4-1.3-3.4-3.4-1.3 3.4-1.3z\" fill=\"#fff8dc\"/></svg>", "av-alb-geschichte": "<svg x=\"0\" y=\"0\" width=\"24\" height=\"24\" viewBox=\"0 0 64 64\" overflow=\"visible\" class=\"wr wr-avatar\"><circle cx=\"32\" cy=\"32\" r=\"22\" fill=\"#fff3b0\" opacity=\".16\"/><path d=\"M6 58V30h8v-6h6v6h6v-10h12v10h6v-6h6v6h8v28z\" fill=\"url(#wrSt)\" stroke=\"#1b2a55\" stroke-width=\"1.4\" stroke-linejoin=\"round\"/><path d=\"M26 58V44a6 6 0 0 1 12 0v14z\" fill=\"#3a2a18\" stroke=\"#1b2a55\" stroke-width=\"1.2\"/><path d=\"M6 30h52\" stroke=\"url(#wrG)\" stroke-width=\"3\"/><path d=\"M26 20h12\" stroke=\"url(#wrG)\" stroke-width=\"3\"/><path d=\"M10 38h8M46 38h8M10 46h8M46 46h8\" stroke=\"#7d7262\" stroke-width=\"1.4\"/><path d=\"M32 6v10M28 9l4-4 4 4\" stroke=\"url(#wrG)\" stroke-width=\"2.4\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M54 5l1.3 3.4 3.4 1.3-3.4 1.3-1.3 3.4-1.3-3.4-3.4-1.3 3.4-1.3z\" fill=\"#fff8dc\"/></svg>", "av-alb-weisheit": "<svg x=\"0\" y=\"0\" width=\"24\" height=\"24\" viewBox=\"0 0 64 64\" overflow=\"visible\" class=\"wr wr-avatar\"><circle cx=\"32\" cy=\"32\" r=\"22\" fill=\"#fff3b0\" opacity=\".16\"/><path d=\"M20 12.3V50.6\" stroke=\"#fff8dc\" stroke-width=\"1.1\"/><path d=\"M24 12.6V45.2\" stroke=\"#fff8dc\" stroke-width=\"1.1\"/><path d=\"M28 13.0V39.8\" stroke=\"#fff8dc\" stroke-width=\"1.1\"/><path d=\"M32 13.3V34.4\" stroke=\"#fff8dc\" stroke-width=\"1.1\"/><path d=\"M36 13.6V29.0\" stroke=\"#fff8dc\" stroke-width=\"1.1\"/><path d=\"M40 13.9V23.6\" stroke=\"#fff8dc\" stroke-width=\"1.1\"/><path d=\"M44 14.2V18.2\" stroke=\"#fff8dc\" stroke-width=\"1.1\"/><path d=\"M15 57L46 15\" stroke=\"url(#wrG)\" stroke-width=\"6\" stroke-linecap=\"round\"/><path d=\"M15 57L46 15\" stroke=\"#1b2a55\" stroke-width=\"1\" fill=\"none\"/><path d=\"M15 58C11 44 12 26 14 12\" stroke=\"url(#wrG)\" stroke-width=\"5.5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M15 58C11 44 12 26 14 12\" stroke=\"#1b2a55\" stroke-width=\"1\" fill=\"none\"/><path d=\"M13 13C20 4 28 15 36 10S45 9 47 15\" stroke=\"url(#wrG)\" stroke-width=\"5\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M13 13C20 4 28 15 36 10S45 9 47 15\" stroke=\"#1b2a55\" stroke-width=\"1\" fill=\"none\"/><ellipse cx=\"15\" cy=\"59\" rx=\"6\" ry=\"2.4\" fill=\"url(#wrG)\" stroke=\"#1b2a55\" stroke-width=\"1\"/><path d=\"M7 9l2.2 3.6 2.8-3 2.8 3L17 9l-1 6H8z\" fill=\"url(#wrG)\" stroke=\"#1b2a55\" stroke-width=\"1\" stroke-linejoin=\"round\"/><circle cx=\"12.5\" cy=\"12.4\" r=\"1\" fill=\"#e8434a\"/><path d=\"M12.5 50C11.5 40 12 28 13.5 18\" stroke=\"#fff\" stroke-width=\"1.2\" fill=\"none\" opacity=\".7\" stroke-linecap=\"round\"/><path d=\"M54 5l1.3 3.4 3.4 1.3-3.4 1.3-1.3 3.4-1.3-3.4-3.4-1.3 3.4-1.3z\" fill=\"#fff8dc\"/></svg>", "av-alb-grossprop": "<svg x=\"0\" y=\"0\" width=\"24\" height=\"24\" viewBox=\"0 0 64 64\" overflow=\"visible\" class=\"wr wr-avatar\"><circle cx=\"32\" cy=\"32\" r=\"22\" fill=\"#fff3b0\" opacity=\".16\"/><path d=\"M32 4c5 6 11 9 11 18 0 5-3 8-5 9 1-5-2-8-6-11-4 3-7 6-6 11-2-1-5-4-5-9 0-9 6-12 11-18z\" fill=\"url(#wrF)\" stroke=\"#1b2a55\" stroke-width=\"1.2\" stroke-linejoin=\"round\"/><rect x=\"14\" y=\"30\" width=\"36\" height=\"24\" rx=\"2\" fill=\"url(#wrP)\" stroke=\"#1b2a55\" stroke-width=\"1.3\"/><rect x=\"9\" y=\"27\" width=\"8\" height=\"30\" rx=\"4\" fill=\"url(#wrG)\" stroke=\"#1b2a55\" stroke-width=\"1.2\"/><rect x=\"47\" y=\"27\" width=\"8\" height=\"30\" rx=\"4\" fill=\"url(#wrG)\" stroke=\"#1b2a55\" stroke-width=\"1.2\"/><path d=\"M20 36h24M20 41h24M20 46h18\" stroke=\"#8fa6c8\" stroke-width=\"1.6\" stroke-linecap=\"round\"/><path d=\"M54 5l1.3 3.4 3.4 1.3-3.4 1.3-1.3 3.4-1.3-3.4-3.4-1.3 3.4-1.3z\" fill=\"#fff8dc\"/></svg>", "av-alb-kleinprop": "<svg x=\"0\" y=\"0\" width=\"24\" height=\"24\" viewBox=\"0 0 64 64\" overflow=\"visible\" class=\"wr wr-avatar\"><circle cx=\"32\" cy=\"32\" r=\"22\" fill=\"#fff3b0\" opacity=\".16\"/><path d=\"M44 30l14-10c-2 6-2 14 0 20z\" fill=\"url(#wrJ_lernen)\" stroke=\"#1b2a55\" stroke-width=\"1.3\" stroke-linejoin=\"round\"/><path d=\"M24 19c3-6 10-8 14-6-2 2-3 4-3 7z\" fill=\"url(#wrJ_lernen)\" stroke=\"#1b2a55\" stroke-width=\"1.1\" stroke-linejoin=\"round\"/><path d=\"M6 30c4-9 14-13 24-13s16 6 18 13c-2 7-8 13-18 13S10 39 6 30z\" fill=\"url(#wrJ_lernen)\" stroke=\"#1b2a55\" stroke-width=\"1.4\"/><path d=\"M17 21c-2 6-2 12 0 18\" stroke=\"#1b2a55\" stroke-width=\"1.1\" fill=\"none\" opacity=\".7\"/><g fill=\"none\" stroke=\"#dff0ff\" stroke-width=\"1.1\" opacity=\".75\"><path d=\"M24 24c2 2 2 4 0 6M24 30c2 2 2 4 0 6M30 22c2 2 2 5 0 8M30 30c2 2 2 5 0 8M36 25c2 2 2 4 0 6M36 31c2 2 2 4 0 6\"/></g><circle cx=\"12\" cy=\"27\" r=\"2.6\" fill=\"#fff\" stroke=\"#1b2a55\" stroke-width=\".9\"/><circle cx=\"12.6\" cy=\"27\" r=\"1.2\" fill=\"#1b2a55\"/><path d=\"M7 32c1.5 1 3 1 4.5 0\" stroke=\"#1b2a55\" stroke-width=\"1\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M10 22c5-4 12-5 18-4\" stroke=\"#fff\" stroke-width=\"1.6\" fill=\"none\" stroke-linecap=\"round\" opacity=\".75\"/><path d=\"M4 53c5-4 9-4 14 0s9 4 14 0 9-4 14 0 9 4 14 0\" stroke=\"url(#wrB)\" stroke-width=\"3\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M10 59c4-3 7-3 11 0s7 3 11 0 7-3 11 0\" stroke=\"url(#wrB)\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\" opacity=\".7\"/><path d=\"M54 5l1.3 3.4 3.4 1.3-3.4 1.3-1.3 3.4-1.3-3.4-3.4-1.3 3.4-1.3z\" fill=\"#fff8dc\"/></svg>", "av-alb-evangelien": "<svg x=\"0\" y=\"0\" width=\"24\" height=\"24\" viewBox=\"0 0 64 64\" overflow=\"visible\" class=\"wr wr-avatar\"><circle cx=\"32\" cy=\"32\" r=\"22\" fill=\"#fff3b0\" opacity=\".16\"/><path d=\"M8 20l48 32M8 32l40 26M8 44l22 14M20 8l36 24M32 8l24 16M8 20l12-12M8 32l24-24M8 44l36-36M12 58l44-44M28 58l28-28M44 58l12-12\" stroke=\"#7fc8ff\" stroke-width=\"1\" opacity=\".45\"/><path d=\"M28 6h8v14h14v8H36v30h-8V28H14v-8h14z\" fill=\"url(#wrG)\" stroke=\"#1b2a55\" stroke-width=\"1.4\" stroke-linejoin=\"round\"/><path d=\"M30.5 9v46\" stroke=\"#fff\" stroke-width=\"1.6\" opacity=\".8\" stroke-linecap=\"round\"/><path d=\"M54 5l1.3 3.4 3.4 1.3-3.4 1.3-1.3 3.4-1.3-3.4-3.4-1.3 3.4-1.3z\" fill=\"#fff8dc\"/></svg>", "av-alb-paulus": "<svg x=\"0\" y=\"0\" width=\"24\" height=\"24\" viewBox=\"0 0 64 64\" overflow=\"visible\" class=\"wr wr-avatar\"><circle cx=\"32\" cy=\"32\" r=\"22\" fill=\"#fff3b0\" opacity=\".16\"/><path d=\"M8 18h40l8 8v32H8z\" fill=\"url(#wrP)\" stroke=\"#1b2a55\" stroke-width=\"1.3\" stroke-linejoin=\"round\"/><path d=\"M48 18v8h8\" fill=\"#dcecff\" stroke=\"#1b2a55\" stroke-width=\"1.1\"/><path d=\"M14 28h28M14 34h34M14 40h30M14 46h20\" stroke=\"#8fa6c8\" stroke-width=\"1.6\" stroke-linecap=\"round\"/><circle cx=\"44\" cy=\"50\" r=\"7\" fill=\"#d23a44\" stroke=\"#1b2a55\" stroke-width=\"1.2\"/><path d=\"M41 50l2 2 4-4\" stroke=\"#ffd7d9\" stroke-width=\"1.6\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M50 4c-6 4-12 12-14 20l3 1c4-7 9-14 11-21z\" fill=\"url(#wrG)\" stroke=\"#1b2a55\" stroke-width=\"1\"/><path d=\"M54 5l1.3 3.4 3.4 1.3-3.4 1.3-1.3 3.4-1.3-3.4-3.4-1.3 3.4-1.3z\" fill=\"#fff8dc\"/></svg>", "av-alb-briefe": "<svg x=\"0\" y=\"0\" width=\"24\" height=\"24\" viewBox=\"0 0 64 64\" overflow=\"visible\" class=\"wr wr-avatar\"><circle cx=\"32\" cy=\"32\" r=\"22\" fill=\"#fff3b0\" opacity=\".16\"/><path d=\"M45 8v24\" stroke=\"url(#wrG)\" stroke-width=\"2\" stroke-linecap=\"round\"/><path d=\"M45 9h12l-3 4 3 4H45z\" fill=\"#ffffff\" stroke=\"#1b2a55\" stroke-width=\"1\"/><path d=\"M50 10v6M47 12.5h6\" stroke=\"#c99c3e\" stroke-width=\"1.8\"/><path d=\"M24 47v10M29 48v10M38 48v10M43 47v10\" stroke=\"#1b2a55\" stroke-width=\"2.6\" stroke-linecap=\"round\"/><circle cx=\"22\" cy=\"38\" r=\"7\" fill=\"#ffffff\" stroke=\"#1b2a55\" stroke-width=\"1.1\"/><circle cx=\"29\" cy=\"34\" r=\"7.5\" fill=\"#ffffff\" stroke=\"#1b2a55\" stroke-width=\"1.1\"/><circle cx=\"37\" cy=\"34\" r=\"7.5\" fill=\"#ffffff\" stroke=\"#1b2a55\" stroke-width=\"1.1\"/><circle cx=\"44\" cy=\"38\" r=\"7\" fill=\"#ffffff\" stroke=\"#1b2a55\" stroke-width=\"1.1\"/><circle cx=\"26\" cy=\"43\" r=\"6.5\" fill=\"#ffffff\" stroke=\"#1b2a55\" stroke-width=\"1.1\"/><circle cx=\"34\" cy=\"44\" r=\"6.5\" fill=\"#ffffff\" stroke=\"#1b2a55\" stroke-width=\"1.1\"/><circle cx=\"41\" cy=\"43\" r=\"6.5\" fill=\"#ffffff\" stroke=\"#1b2a55\" stroke-width=\"1.1\"/><path d=\"M20 36c4-4 9-4 12-2M32 33c4-3 9-2 11 1\" stroke=\"#c9d6f2\" stroke-width=\"1.2\" fill=\"none\"/><circle cx=\"15\" cy=\"26\" r=\"9\" fill=\"none\" stroke=\"url(#wrG)\" stroke-width=\"2.2\"/><path d=\"M9 27c0-5 4-8 8-8s7 3 6 8l-2 4c-2 3-8 3-10 0z\" fill=\"#f6ead8\" stroke=\"#1b2a55\" stroke-width=\"1.2\" stroke-linejoin=\"round\"/><path d=\"M20 22c4-2 7-1 8 2-2 1-5 1-8 0z\" fill=\"#f6ead8\" stroke=\"#1b2a55\" stroke-width=\"1\"/><circle cx=\"14.5\" cy=\"26\" r=\"1.3\" fill=\"#1b2a55\"/><path d=\"M12 32c1.5 1 3 1 4 0\" stroke=\"#1b2a55\" stroke-width=\"1\" fill=\"none\" stroke-linecap=\"round\"/><circle cx=\"13.5\" cy=\"19.5\" r=\"2.4\" fill=\"#ffffff\" stroke=\"#1b2a55\" stroke-width=\".9\"/><circle cx=\"17.5\" cy=\"19\" r=\"2.4\" fill=\"#ffffff\" stroke=\"#1b2a55\" stroke-width=\".9\"/><path d=\"M54 5l1.3 3.4 3.4 1.3-3.4 1.3-1.3 3.4-1.3-3.4-3.4-1.3 3.4-1.3z\" fill=\"#fff8dc\"/></svg>", "av-alb-wort": "<svg x=\"0\" y=\"0\" width=\"24\" height=\"24\" viewBox=\"0 0 64 64\" overflow=\"visible\" class=\"wr wr-avatar\"><circle cx=\"32\" cy=\"32\" r=\"22\" fill=\"#fff3b0\" opacity=\".16\"/><g stroke=\"#fff3b0\" stroke-width=\"2\" stroke-linecap=\"round\" opacity=\".9\"><path d=\"M32 4v8M14 10l5 6M50 10l-5 6M6 24l7 3M58 24l-7 3\"/></g><path d=\"M6 30c8-4 18-4 26 2 8-6 18-6 26-2v24c-8-4-18-4-26 2-8-6-18-6-26-2z\" fill=\"url(#wrG)\" stroke=\"#1b2a55\" stroke-width=\"1.4\" stroke-linejoin=\"round\"/><path d=\"M10 33c6-2 14-2 20 2v18c-6-3-14-3-20-1zM54 33c-6-2-14-2-20 2v18c6-3 14-3 20-1z\" fill=\"#fffbe8\" stroke=\"#1b2a55\" stroke-width=\"1\"/><path d=\"M32 32v24\" stroke=\"#a07020\" stroke-width=\"1.6\"/><path d=\"M14 39h12M14 43h12M14 47h9M38 39h12M38 43h12M38 47h9\" stroke=\"#c9a85a\" stroke-width=\"1.3\" stroke-linecap=\"round\"/><text x=\"32\" y=\"28\" text-anchor=\"middle\" font-family=\"Georgia,serif\" font-weight=\"700\" font-size=\"9\" fill=\"#a07020\">66</text><path d=\"M54 5l1.3 3.4 3.4 1.3-3.4 1.3-1.3 3.4-1.3-3.4-3.4-1.3 3.4-1.3z\" fill=\"#fff8dc\"/></svg>"});
if (window.RAHMEN_SVG) RAHMEN_SVG["alb-wort"] = "<svg class=\"av-fr\" viewBox=\"0 0 100 100\" aria-hidden=\"true\"><circle cx=\"50\" cy=\"50\" r=\"40.5\" fill=\"none\" stroke=\"#141a3a\" stroke-width=\"5\"/><circle cx=\"50\" cy=\"50\" r=\"40.5\" fill=\"none\" stroke=\"url(#wrR_gold)\" stroke-width=\"3.6\"/><circle cx=\"50.00\" cy=\"9.50\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"53.85\" cy=\"9.68\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"57.66\" cy=\"10.23\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"61.41\" cy=\"11.14\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"65.05\" cy=\"12.40\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"68.56\" cy=\"14.00\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"71.90\" cy=\"15.93\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"75.04\" cy=\"18.16\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"77.95\" cy=\"20.69\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"80.61\" cy=\"23.48\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"82.99\" cy=\"26.51\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"85.07\" cy=\"29.75\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"86.84\" cy=\"33.18\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"88.27\" cy=\"36.75\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"89.36\" cy=\"40.45\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"90.09\" cy=\"44.24\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"90.45\" cy=\"48.07\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"90.45\" cy=\"51.93\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"90.09\" cy=\"55.76\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"89.36\" cy=\"59.55\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"88.27\" cy=\"63.25\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"86.84\" cy=\"66.82\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"85.07\" cy=\"70.25\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"82.99\" cy=\"73.49\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"80.61\" cy=\"76.52\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"77.95\" cy=\"79.31\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"75.04\" cy=\"81.84\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"71.90\" cy=\"84.07\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"68.56\" cy=\"86.00\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"65.05\" cy=\"87.60\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"61.41\" cy=\"88.86\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"57.66\" cy=\"89.77\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"53.85\" cy=\"90.32\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"50.00\" cy=\"90.50\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"46.15\" cy=\"90.32\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"42.34\" cy=\"89.77\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"38.59\" cy=\"88.86\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"34.95\" cy=\"87.60\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"31.44\" cy=\"86.00\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"28.10\" cy=\"84.07\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"24.96\" cy=\"81.84\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"22.05\" cy=\"79.31\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"19.39\" cy=\"76.52\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"17.01\" cy=\"73.49\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"14.93\" cy=\"70.25\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"13.16\" cy=\"66.82\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"11.73\" cy=\"63.25\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"10.64\" cy=\"59.55\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"9.91\" cy=\"55.76\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"9.55\" cy=\"51.93\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"9.55\" cy=\"48.07\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"9.91\" cy=\"44.24\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"10.64\" cy=\"40.45\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"11.73\" cy=\"36.75\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"13.16\" cy=\"33.18\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"14.93\" cy=\"29.75\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"17.01\" cy=\"26.51\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"19.39\" cy=\"23.48\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"22.05\" cy=\"20.69\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"24.96\" cy=\"18.16\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"28.10\" cy=\"15.93\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"31.44\" cy=\"14.00\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"34.95\" cy=\"12.40\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"38.59\" cy=\"11.14\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"42.34\" cy=\"10.23\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"46.15\" cy=\"9.68\" r=\"1.25\" fill=\"#fff6c8\"/><circle cx=\"50\" cy=\"50\" r=\"35\" fill=\"none\" stroke=\"url(#wrR_gold)\" stroke-width=\"2.2\"/><path d=\"M50 3l2.2 5.4 5.6.8-4.2 3.8 1.2 5.6L50 15.8l-4.8 2.8 1.2-5.6-4.2-3.8 5.6-.8z\" fill=\"url(#wrR_gold)\" stroke=\"#5a3a08\" stroke-width=\".8\"/></svg>";
/* 10.10: „Das ganze Wort“ auch in Silber und Bronze */
if (window.RAHMEN_SVG) { RAHMEN_SVG["alb-wort-s"] = "<svg class=\"av-fr\" viewBox=\"0 0 100 100\" aria-hidden=\"true\"><circle cx=\"50\" cy=\"50\" r=\"40.5\" fill=\"none\" stroke=\"#141a3a\" stroke-width=\"5\"/><circle cx=\"50\" cy=\"50\" r=\"40.5\" fill=\"none\" stroke=\"url(#wrR_silber)\" stroke-width=\"3.6\"/><circle cx=\"50.00\" cy=\"9.50\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"53.85\" cy=\"9.68\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"57.66\" cy=\"10.23\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"61.41\" cy=\"11.14\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"65.05\" cy=\"12.40\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"68.56\" cy=\"14.00\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"71.90\" cy=\"15.93\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"75.04\" cy=\"18.16\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"77.95\" cy=\"20.69\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"80.61\" cy=\"23.48\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"82.99\" cy=\"26.51\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"85.07\" cy=\"29.75\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"86.84\" cy=\"33.18\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"88.27\" cy=\"36.75\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"89.36\" cy=\"40.45\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"90.09\" cy=\"44.24\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"90.45\" cy=\"48.07\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"90.45\" cy=\"51.93\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"90.09\" cy=\"55.76\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"89.36\" cy=\"59.55\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"88.27\" cy=\"63.25\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"86.84\" cy=\"66.82\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"85.07\" cy=\"70.25\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"82.99\" cy=\"73.49\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"80.61\" cy=\"76.52\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"77.95\" cy=\"79.31\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"75.04\" cy=\"81.84\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"71.90\" cy=\"84.07\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"68.56\" cy=\"86.00\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"65.05\" cy=\"87.60\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"61.41\" cy=\"88.86\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"57.66\" cy=\"89.77\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"53.85\" cy=\"90.32\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"50.00\" cy=\"90.50\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"46.15\" cy=\"90.32\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"42.34\" cy=\"89.77\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"38.59\" cy=\"88.86\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"34.95\" cy=\"87.60\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"31.44\" cy=\"86.00\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"28.10\" cy=\"84.07\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"24.96\" cy=\"81.84\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"22.05\" cy=\"79.31\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"19.39\" cy=\"76.52\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"17.01\" cy=\"73.49\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"14.93\" cy=\"70.25\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"13.16\" cy=\"66.82\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"11.73\" cy=\"63.25\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"10.64\" cy=\"59.55\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"9.91\" cy=\"55.76\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"9.55\" cy=\"51.93\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"9.55\" cy=\"48.07\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"9.91\" cy=\"44.24\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"10.64\" cy=\"40.45\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"11.73\" cy=\"36.75\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"13.16\" cy=\"33.18\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"14.93\" cy=\"29.75\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"17.01\" cy=\"26.51\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"19.39\" cy=\"23.48\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"22.05\" cy=\"20.69\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"24.96\" cy=\"18.16\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"28.10\" cy=\"15.93\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"31.44\" cy=\"14.00\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"34.95\" cy=\"12.40\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"38.59\" cy=\"11.14\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"42.34\" cy=\"10.23\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"46.15\" cy=\"9.68\" r=\"1.25\" fill=\"#f4f8ff\"/><circle cx=\"50\" cy=\"50\" r=\"35\" fill=\"none\" stroke=\"url(#wrR_silber)\" stroke-width=\"2.2\"/><path d=\"M50 3l2.2 5.4 5.6.8-4.2 3.8 1.2 5.6L50 15.8l-4.8 2.8 1.2-5.6-4.2-3.8 5.6-.8z\" fill=\"url(#wrR_silber)\" stroke=\"#3c4a5e\" stroke-width=\".8\"/></svg>"; RAHMEN_SVG["alb-wort-b"] = "<svg class=\"av-fr\" viewBox=\"0 0 100 100\" aria-hidden=\"true\"><circle cx=\"50\" cy=\"50\" r=\"40.5\" fill=\"none\" stroke=\"#141a3a\" stroke-width=\"5\"/><circle cx=\"50\" cy=\"50\" r=\"40.5\" fill=\"none\" stroke=\"url(#wrR_bronze)\" stroke-width=\"3.6\"/><circle cx=\"50.00\" cy=\"9.50\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"53.85\" cy=\"9.68\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"57.66\" cy=\"10.23\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"61.41\" cy=\"11.14\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"65.05\" cy=\"12.40\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"68.56\" cy=\"14.00\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"71.90\" cy=\"15.93\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"75.04\" cy=\"18.16\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"77.95\" cy=\"20.69\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"80.61\" cy=\"23.48\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"82.99\" cy=\"26.51\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"85.07\" cy=\"29.75\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"86.84\" cy=\"33.18\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"88.27\" cy=\"36.75\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"89.36\" cy=\"40.45\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"90.09\" cy=\"44.24\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"90.45\" cy=\"48.07\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"90.45\" cy=\"51.93\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"90.09\" cy=\"55.76\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"89.36\" cy=\"59.55\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"88.27\" cy=\"63.25\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"86.84\" cy=\"66.82\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"85.07\" cy=\"70.25\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"82.99\" cy=\"73.49\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"80.61\" cy=\"76.52\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"77.95\" cy=\"79.31\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"75.04\" cy=\"81.84\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"71.90\" cy=\"84.07\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"68.56\" cy=\"86.00\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"65.05\" cy=\"87.60\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"61.41\" cy=\"88.86\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"57.66\" cy=\"89.77\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"53.85\" cy=\"90.32\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"50.00\" cy=\"90.50\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"46.15\" cy=\"90.32\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"42.34\" cy=\"89.77\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"38.59\" cy=\"88.86\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"34.95\" cy=\"87.60\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"31.44\" cy=\"86.00\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"28.10\" cy=\"84.07\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"24.96\" cy=\"81.84\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"22.05\" cy=\"79.31\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"19.39\" cy=\"76.52\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"17.01\" cy=\"73.49\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"14.93\" cy=\"70.25\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"13.16\" cy=\"66.82\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"11.73\" cy=\"63.25\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"10.64\" cy=\"59.55\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"9.91\" cy=\"55.76\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"9.55\" cy=\"51.93\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"9.55\" cy=\"48.07\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"9.91\" cy=\"44.24\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"10.64\" cy=\"40.45\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"11.73\" cy=\"36.75\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"13.16\" cy=\"33.18\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"14.93\" cy=\"29.75\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"17.01\" cy=\"26.51\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"19.39\" cy=\"23.48\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"22.05\" cy=\"20.69\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"24.96\" cy=\"18.16\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"28.10\" cy=\"15.93\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"31.44\" cy=\"14.00\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"34.95\" cy=\"12.40\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"38.59\" cy=\"11.14\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"42.34\" cy=\"10.23\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"46.15\" cy=\"9.68\" r=\"1.25\" fill=\"#ffd8ae\"/><circle cx=\"50\" cy=\"50\" r=\"35\" fill=\"none\" stroke=\"url(#wrR_bronze)\" stroke-width=\"2.2\"/><path d=\"M50 3l2.2 5.4 5.6.8-4.2 3.8 1.2 5.6L50 15.8l-4.8 2.8 1.2-5.6-4.2-3.8 5.6-.8z\" fill=\"url(#wrR_bronze)\" stroke=\"#4a2410\" stroke-width=\".8\"/></svg>"; }
/* ---------- Kopfleiste: Manna neben den Talenten ---------- */
const SM_GOLD_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="#fffbe8" stroke="#c9a24a" stroke-width=".9"><circle cx="8" cy="9" r="3.4"/><circle cx="15.8" cy="7.4" r="2.7"/><circle cx="12" cy="15.4" r="3.8"/><circle cx="18.4" cy="14.6" r="2.3"/><circle cx="6.2" cy="16.8" r="2"/></g><path d="M6.6 7.6a1.7 1.7 0 0 1 1.7-1M10.4 13.6a2.1 2.1 0 0 1 2-1.1" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round"/></svg>`;
const SM_ALBUM_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="smAlbG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a9bff"/><stop offset="1" stop-color="#1d4bb0"/></linearGradient></defs><rect x="4.5" y="2.2" width="16" height="19.6" rx="2" fill="#fff4d6" stroke="#1b2a55" stroke-width="1.1"/><rect x="3.2" y="1.6" width="15.8" height="19.8" rx="2.2" fill="url(#smAlbG)" stroke="#f2c14e" stroke-width="1.5"/><path d="M5.2 1.8v19.4" stroke="#13306f" stroke-width="1.6"/><circle cx="12" cy="11.4" r="5" fill="#13306f" stroke="#f2c14e" stroke-width="1.2"/><text x="12" y="13.7" text-anchor="middle" font-size="6.4" font-weight="900" font-family="Lexend, Arial, sans-serif" fill="#f2c14e">66</text></svg>`;
const SM_KRUG_SVG = `<svg class="sm-kr-ic" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="smKgK" x1="0" x2="1"><stop offset="0" stop-color="#8a5a12"/><stop offset=".45" stop-color="#fff0b0"/><stop offset="1" stop-color="#9a6614"/></linearGradient></defs><path d="M9.5 6.5h5c.2 1 .7 1.6 1.6 2.3 1.9 1.4 2.9 3.6 2.9 6.2 0 4.3-3 7-7 7.3-4-.3-7-3-7-7.3 0-2.6 1-4.8 2.9-6.2.9-.7 1.4-1.3 1.6-2.3z" fill="url(#smKgK)" stroke="#5a3a08" stroke-width="1.1" stroke-linejoin="round"/><path d="M8.6 6.5c.4-1.9 1.9-2.9 3.4-2.9s3 1 3.4 2.9z" fill="url(#smKgK)" stroke="#5a3a08" stroke-width="1"/><circle cx="12" cy="2.6" r="1.1" fill="#ffe48a" stroke="#5a3a08" stroke-width=".7"/><path d="M6.4 14.2c3.7 1.2 7.5 1.2 11.2 0" fill="none" stroke="#fffbe8" stroke-width="1.2"/></svg>`;
/* 10.4: NEU-Fähnchen an der Album-Kapsel bis zum Start der Weihnachts-Ausgabe von Biblionär (1. Advent 2026 = 29.11.);
   das Funkeln bleibt dauerhaft. edTag() kennt das Testdatum (localhost/Beta, Testlabor). */
const SM_NEU_BIS = "2026-11-29";
const smNeuZeigen = () => { try { return (typeof edTag === "function" ? edTag() : dayNum(today())) < dayNum(SM_NEU_BIS); } catch (e) { return false; } };
function smHud(neu) {
  const b = $("hGoldBtn"); if (!b) return;
  $("hGold").textContent = typeof hudZahl === "function" ? hudZahl(smGold()) : smGold(); b.title = smGold().toLocaleString("de-DE") + " Manna";
  const kann = smKrugMoeglich() === "gold" || smGeschenkBereit();
  const p = $("tbKrug"); if (p) p.hidden = !kann;
  const nf = $("smNeu"); if (nf) nf.hidden = !smNeuZeigen();
  if (neu > 0) { b.classList.remove("sm-plus"); void b.offsetWidth; b.classList.add("sm-plus"); try { const r = b.getBoundingClientRect(); floatText("+" + neu + " Manna", r.left + r.width / 2, r.top + r.height + 18); } catch (e) {} }
}
/* Passt der Name nicht mehr neben die beiden Währungen, werden Laden- und Album-Symbol ausgeblendet (die Anzeigen bleiben antippbar).
   hudNameAnpassen (spiel.js) wird dafür umhüllt – so greift es auch, wenn die Schrift später nachlädt. */
const smNameOrig = hudNameAnpassen;
hudNameAnpassen = function () {
  const hud = document.querySelector(".hud"), t = $("hTitle");
  if (!hud || !t || !t.clientWidth) return smNameOrig();
  hud.classList.remove("eng"); t.classList.remove("zwei"); t.parentElement.classList.remove("zweizeilig"); t.style.fontSize = "";
  /* 9.90: Reihenfolge – 1. Name einzeilig bis 13 px verkleinern, 2. bei Leerzeichen/Bindestrich zweizeilig, 3. erst dann Laden-/Album-Symbol ausblenden */
  const start = parseFloat(getComputedStyle(t).fontSize) || 19;
  const passt = () => { const r = document.createRange(); r.selectNodeContents(t); return r.getBoundingClientRect().width <= t.getBoundingClientRect().width - 0.5; }; /* 9.100: genau messen (Bruchteile eines Pixels → sonst „…“) */
  for (let px = start; px >= 13; px -= 0.5) { t.style.fontSize = px.toFixed(1) + "px"; if (passt()) return; }
  t.style.fontSize = "";
  const mehrteilig = /[\s-]/.test(t.textContent.trim());
  if (mehrteilig) { smNameOrig(); if (t.scrollWidth <= t.clientWidth + 1 && t.scrollHeight <= t.clientHeight + 1) return; }
  hud.classList.add("eng");
  if (mehrteilig) { smNameOrig(); return; }
  /* 9.100: Einwortige Namen nie mitten im Wort trennen – einzeilig bis 11 px, sonst „…“ */
  t.classList.remove("zwei"); t.parentElement.classList.remove("zweizeilig");
  for (let px = start; px >= 11; px -= 0.5) { t.style.fontSize = px.toFixed(1) + "px"; if (passt()) return; }
};
const smHudPlatz = () => hudNameAnpassen();
addEventListener("resize", () => { try { smHudPlatz(); } catch (e) {} });
try { document.fonts.ready.then(() => { try { smHudPlatz(); } catch (e) {} }); document.fonts.addEventListener("loadingdone", () => { try { smHudPlatz(); } catch (e) {} }); } catch (e) {}
[1500, 4000].forEach(ms => setTimeout(() => { try { smHudPlatz(); } catch (e) {} }, ms));
(function smHudBauen() {
  if (!smFrei()) { setTimeout(() => { try { smHudBauen(); renderHud(); } catch (e) {} }, Math.min(2147000000, SM_START - Date.now() + 1500)); return; } /* 10.0: erscheint um 08:00 auch bei offener App */
  const tal = $("hTalBtn"); if (!tal || $("hGoldBtn")) return;
  const b = document.createElement("button"); b.className = "pill hud-gold"; b.id = "hGoldBtn"; b.setAttribute("aria-label", "Manna – zum Sammelalbum");
  b.innerHTML = `${SM_GOLD_SVG}<span id="hGold">0</span><span class="hud-album" aria-hidden="true">${SM_ALBUM_SVG}</span><span class="tb-punkt" id="tbKrug" hidden aria-label="Ein Krug kann geöffnet werden"></span>`
    + `<span class="sm-funk f1" aria-hidden="true">✦</span><span class="sm-funk f2" aria-hidden="true">✦</span><span class="sm-neu" id="smNeu" hidden>NEU</span>`; /* 10.4: Funkeln immer, NEU bis zum 1. Advent */
  tal.insertAdjacentElement("afterend", b); /* 9.90: nebeneinander in #hKasse */
  b.onclick = () => { SFX.tap(); go("album"); };
  smHud(0); setTimeout(() => { try { smHudPlatz(); } catch (e) {} }, 300);
})();

/* ---------- Krug ziehen: nie doppelt, fehlende zuerst ----------
   1. Seltenheit würfeln (Garantie: mind. 1 Silber, jeder 7. Krug Gold – mit der letzten Karte).
   2. Gibt es Bücher unter dieser Stufe, wird eines aufgewertet (bevorzugt genau eine Stufe darunter → fehlende Bronze zuerst).
   3. Sonst eine doppelte Karte dieser Stufe → Tauschbeutel. 4. Jedes Buch höchstens einmal pro Krug. */
function smWuerfeln(min, w) { w = w || SM_W; const o = []; let t = 0; for (let r = Math.max(1, min); r <= SM_MAX; r++) { o.push(r); t += w[r]; } let x = Math.random() * t; for (const r of o) { x -= w[r]; if (x <= 0) return r; } return o[o.length - 1]; }
function smZiehen(album, nr, w) {
  const res = [], used = {}, min = nr % SM_TREUE === 0 ? SM_MAX : 2, z = l => l[Math.floor(Math.random() * l.length)];
  for (let k = 0; k < SM_KRUG_KARTEN; k++) {
    if (album.every(s => s >= SM_MAX)) break;
    const r = (k === SM_KRUG_KARTEN - 1 && !res.some(c => c.s >= min)) ? smWuerfeln(min, w) : smWuerfeln(1, w);
    const idx = album.map((s, i) => i).filter(i => !used[i]), frei = idx.filter(i => album[i] < r);
    if (frei.length) { const g = frei.filter(i => album[i] === r - 1), i = z(g.length ? g : frei); used[i] = 1; res.push({ i, s: r, v: album[i] }); album[i] = r; }
    else { const d = idx.filter(i => album[i] >= r); if (!d.length) continue; const i = z(d); used[i] = 1; res.push({ i, s: r, v: album[i], d: 1 }); }
  }
  return res.sort((a, b) => a.s - b.s || (b.d | 0) - (a.d | 0));
}
/* 10.5: normaler Krug (3 am Tag) – der Geschenk-Krug ist zusätzlich und zählt nicht mit */
function smKrugMoeglich() { const m = smInit(); if (m.album.every(s => s >= SM_MAX)) return "fertig"; if (smHeuteKruege() >= SM_KRUG_TAG) return "tag"; if (smGold() >= SM_KRUG_PREIS) return "gold"; return "arm"; }
function smGeschenkBereit() { return smGeschenke() > 0 && !smInit().album.every(s => s >= SM_MAX); } /* Funktion (nicht const): smHud nutzt sie schon beim Laden */
function smKrugKaufen(wahl) {
  const art = wahl === "geschenk" ? (smGeschenkBereit() ? "geschenk" : "") : smKrugMoeglich(); if (art !== "geschenk" && art !== "gold") return null;
  const m = smInit(), t = smKrugTag();
  if (m.kt !== t) { m.kt = t; m.kn = 0; }
  if (art === "geschenk") m.kga++; else { m.ga += SM_KRUG_PREIS; m.kn++; } /* 10.5: Geschenk-Krug zählt nicht zu den 3 am Tag */
  m.kz++;
  const vor = m.album.slice(), zug = smZiehen(m.album, m.kz, art === "geschenk" ? SM_W_GESCHENK : SM_W);
  zug.forEach(c => { if (c.d && c.s < SM_MAX) m.be[c.s] = (m.be[c.s] | 0) + 1; });
  m.offen = { z: zug, vor, nr: m.kz, art }; /* Ergebnis wird VOR der Animation gespeichert – Schließen der App würfelt nichts neu */
  save(); smHud(0); lbSync();
  return m.offen;
}

/* 9.92: kurze Buchnamen für das kleine Album beim Einsortieren */
const SM_KURZ = { "Klagelieder": "Klagel.", "Apostelgeschichte": "Apg.", "1. Thessalonicher": "1. Thess.", "2. Thessalonicher": "2. Thess.", "Offenbarung": "Offenb.",
  "1. Korinther": "1. Kor.", "2. Korinther": "2. Kor.", "1. Chronik": "1. Chron.", "2. Chronik": "2. Chron.", "1. Timotheus": "1. Tim.", "2. Timotheus": "2. Tim.",
  "Philipper": "Philipper", "Hoheslied": "Hoheslied", "1. Johannes": "1. Joh.", "2. Johannes": "2. Joh.", "3. Johannes": "3. Joh.", "Zephanja": "Zephanja", "Habakuk": "Habakuk" };
const smZugText = zug => { const neu = zug.filter(c => !c.d && !c.v).length, besser = zug.filter(c => !c.d && c.v).length, d = zug.filter(c => c.d).length;
  return [neu ? `<b>${neu} neu</b>` : "", besser ? `${besser} verbessert` : "", d ? `${d} doppelt` : ""].filter(Boolean).join(" · "); };
const smKurz = n => SM_KURZ[n] || (n.length > 10 ? n.replace(/^(\d\.\s?)?(.{4}).*$/, "$1$2.") : n);
/* ---------- Gruppen komplett → Talente (einmal je Gruppe und Stufe) ---------- */
function smGruppenPruefen() {
  const m = smInit(), neu = [];
  GROUPS.forEach((g, gi) => {
    const idx = ALL.map((b, i) => b.gi === gi ? i : -1).filter(i => i >= 0), minS = Math.min(...idx.map(i => m.album[i]));
    for (let s = 1; s <= minS; s++) { const key = gi + "-" + s; if (!m.lohn.includes(key)) { m.lohn.push(key); neu.push({ gi, s }); smGoldGeben(SM_GRUPPEN_LOHN[s] || 0); } } /* 10.5: Manna statt Talente */ /* 9.93: Beta – keine echten Talente */
  });
  if (neu.length) save();
  return neu;
}

/* ---------- Karten-HTML ---------- */
const SM_BUCH = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4.5C6.5 3.6 9.5 3.6 12 5c2.5-1.4 5.5-1.4 8-.5V19c-2.5-.9-5.5-.9-8 .5-2.5-1.4-5.5-1.4-8-.5z" fill="#fff8e0" stroke="#1b2a55" stroke-width="1.3" stroke-linejoin="round"/><path d="M12 5v14.5" stroke="#1b2a55" stroke-width="1.3"/></svg>`;
/* 9.96: Stil 2 – Karte in der Gruppenfarbe, Motiv als Linienzeichnung im Metall der Stufe (karten-motive.js);
   Silber: Silberrahmen + Lichtschein, Gold: Goldrahmen + Lichtschein + Funkeln (Motiv nur leicht leuchtend, damit es erkennbar bleibt) */
const SM_GLAS = ["#ff9a52", "#ff5f4f", "#6fe05a", "#b48cff", "#e88cf0", "#5cb8ff", "#ff7fa8", "#3fdcc0"];
const smFenster = (i, s) => typeof KARTEN_MOTIV !== "undefined" && KARTEN_MOTIV[i]
  ? `<span class="smk-bild" aria-hidden="true"><svg viewBox="0 0 64 64">${KARTEN_MOTIV[i]}</svg></span>${s >= 2 ? `<span class="smk-glanz" aria-hidden="true"></span>` : ""}${s >= 3 ? `<span class="smk-fk f1" aria-hidden="true">✦</span><span class="smk-fk f2" aria-hidden="true">✦</span><span class="smk-fk f3" aria-hidden="true">✦</span>` : s === 2 ? `<span class="smk-fk f1" aria-hidden="true">✧</span>` : ""}`
  : `<span class="smk-band">${SM_BUCH}</span>`;
function smKarteHtml(i, s, extra) {
  const b = ALL[i], lang = b.b.length > 9 ? " lang" : "";
  if (!s) return `<span class="smk grau" data-i="${i}"><span class="smk-in"><span class="smk-fr">?</span><span class="smk-nm${lang}">${esc(b.b)}</span></span></span>`;
  return `<span class="smk" data-i="${i}" data-s="${s}" style="--rc:${SM_RC[s]};--gc:${smGc(i)};--gl:${SM_GLAS[b.gi] || "#7fc8ff"}"><span class="smk-in">${smFenster(i, s)}${extra || ""}<span class="smk-nm${lang}">${esc(b.b)}</span><span class="smk-gr">${esc(GROUPS[b.gi].name)}</span><span class="smk-st">${SM_STUFE[s]}</span></span></span>`;
}

/* ---------- Ansicht: Sammelalbum ---------- */
let smWahl = 0; /* Tauschen: Stufe, deren Karte gerade gewählt wird */
const SM_SACK = `<svg class="sack" viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="60" rx="19" ry="3" fill="#0006"/><path class="sk-k" d="M21 24C9 31 7 54 18 58.5h28C57 54 55 31 43 24z"/><path d="M17 33c-2 7-1 15 3 20" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".35"/><path class="sk-k2" d="M21 24l-4-9c5 2 9 3 15 3s10-1 15-3l-4 9c-7 3-15 3-22 0z"/><path d="M19.5 22.5c8 3.6 17 3.6 25 0" fill="none" stroke="#3a2410" stroke-width="3" stroke-linecap="round"/><path d="M19.5 22.5c8 3.6 17 3.6 25 0" fill="none" stroke="#e8c27a" stroke-width="1.4" stroke-linecap="round"/><path d="M33 25.5c3 4 6 6 9 6M33 25.5c-1 4-3 7-6 8" fill="none" stroke="#e8c27a" stroke-width="1.6" stroke-linecap="round"/><circle cx="33" cy="25.5" r="2.2" fill="#e8c27a" stroke="#3a2410" stroke-width="1"/><path class="sk-m" d="M32 37l2.6 5.3 5.8.8-4.2 4.1 1 5.8L32 50.3 26.8 53l1-5.8-4.2-4.1 5.8-.8z"/></svg>`;
const SM_SIEGEL_SVG = `<svg class="smt-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#f2c14e" stroke="#7a4c0e" stroke-width="1.4"/><circle cx="12" cy="12" r="6.2" fill="none" stroke="#fff3b8" stroke-width="1" stroke-dasharray="1.6 1.4"/><path d="M12 7.6l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="#fff8d6" stroke="#a8781a" stroke-width=".6"/></svg>`;
const SM_GESCHENK_SVG = `<svg class="smt-ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="1.8" fill="#5fe0b0" stroke="#145c37" stroke-width="1.3"/><rect x="3" y="7" width="18" height="4" rx="1.4" fill="#7be04a" stroke="#145c37" stroke-width="1.3"/><path d="M12 7v13" stroke="#f2c14e" stroke-width="2.4"/><path d="M12 7c-2-3-6-3-5-.5 .6 1.4 3.4.8 5 .5zm0 0c2-3 6-3 5-.5-.6 1.4-3.4.8-5 .5z" fill="#f2c14e" stroke="#7a4c0e" stroke-width=".9"/></svg>`;
function smBeutelHtml() {
  return `<div class="sm-beutel">${[1, 2].map(r => { const n = smBeutel(r), voll = n >= SM_TAUSCH[r];
    return `<button class="sm-bz${voll ? " voll" : ""}" data-tausch="${r}" style="--c:${SM_RC[r]}" aria-label="${SM_STUFE[r]}-Säckchen: ${n} von ${SM_TAUSCH[r]}${voll ? " – tauschen" : ""}">${SM_SACK}<span class="pk">${Array.from({ length: SM_TAUSCH[r] }, (_, k) => `<i class="${k < n ? "an" : ""}"></i>`).join("")}</span><span class="sm-bz-t"><b>${n}</b> ${SM_STUFE[r]}</span><small>${SM_TAUSCH[r]} → 1 ${SM_STUFE[r + 1]}</small></button>`; }).join("")}</div>`;
}
VIEWS.album = () => {
  if (!smFrei()) { go("home"); return; }
  const m = smInit();
  if (m.offen) { smKrugBuehne(m.offen, true); }
  const art = smKrugMoeglich(), gold = smGold(), heute = smHeuteKruege(), bisGold = SM_TREUE - (m.kz % SM_TREUE); /* der nächste Krug hat die Nummer kz+1; jeder 7. ist sicher Gold */
  const nochT = SM_TRUHEN_GESCHENK - (m.tz % SM_TRUHEN_GESCHENK);
  /* 10.5: Krug-Karte – drei Krüge des Tages, geöffnete mit Haken; bei 3/3 grün „Heute erledigt“ */
  const fertigTag = art === "tag";
  const gesch = smGeschenkBereit(), gN = smGeschenke();
  const kruege = [0, 1, 2].map(i => { const auf = i < heute, bereit = !auf && i === heute && art === "gold";
    return `<span class="smt-krug${auf ? " auf" : bereit ? " bereit" : ""}">${SM_KRUG_SVG}<small>${auf ? "geöffnet" : bereit ? "bereit" : SM_KRUG_PREIS + " Manna"}</small></span>`; }).join("")
    + (gesch ? `<button class="smt-krug geschenk" id="smGeschenkKn" aria-label="Geschenk-Krug öffnen">${SM_KRUG_SVG}<small>Geschenk${gN > 1 ? " ×" + gN : ""}</small></button>` : "");
  const aktion = fertigTag ? `<p class="smt-fertig">Neue Krüge ${smNeueKruegeText()}</p>`
    : art === "arm" ? `<button class="smt-los arm" id="smMannaLos">Noch ${SM_KRUG_PREIS - gold} Manna – spiel eine Runde</button>`
    : art === "fertig" ? "" : `<button class="smt-los" id="smKrugKn">${SM_KRUG_SVG}Krug öffnen · ${SM_KRUG_PREIS} Manna</button>`;
  const krugKarte = art === "fertig" ? `<p class="sm-hinw">Alle 66 Karten in Gold – dein Album ist vollendet!</p>`
    : `<div class="smt-karte${fertigTag ? " fertig" : ""}"><div class="smt-kopf"><b>${fertigTag ? "Heute erledigt ✓" : "Krüge heute"}</b><button class="smt-manna" id="smMannaInfo" aria-label="Manna – was ist das?">${SM_GOLD_SVG}${gold}</button></div>
      <div class="smt-kruege${gesch ? " vier" : ""}">${kruege}</div>${aktion}${gesch ? `<p class="smt-gesch">Geschenk-Krug zusätzlich – antippen!</p>` : ""}</div>`;
  const punkte = (n, an) => `<span class="smt-pk">${Array.from({ length: n }, (_, i) => `<i class="${i < an ? "an" : ""}"></i>`).join("")}</span>`;
  const leiste = `<div class="smt-leiste">
    <button class="smt-ziel" id="smTreueInfo" aria-label="Treue-Siegel: noch ${bisGold} Krüge bis zur sicheren Goldkarte">${SM_SIEGEL_SVG}${punkte(SM_TREUE, SM_TREUE - bisGold)}</button>
    <button class="smt-ziel gr" id="smGeschenkInfo" aria-label="Geschenk-Krug: noch ${nochT} Schatztruhen">${SM_GESCHENK_SVG}${punkte(SM_TRUHEN_GESCHENK, SM_TRUHEN_GESCHENK - nochT)}</button>
    ${[1, 2].map(r => { const n = smBeutel(r), voll = n >= SM_TAUSCH[r];
      return `<button class="smt-sack${voll ? " voll" : ""}" data-tausch="${r}" style="--c:${SM_RC[r]}" aria-label="${SM_STUFE[r]}-Säckchen: ${n} von ${SM_TAUSCH[r]}">${SM_SACK}<b>${n}/${SM_TAUSCH[r]}</b></button>`; }).join("")}</div>`;
  const knopf = "", treue = "", truhe = "";
  const knopfAlt = art === "fertig" ? `<p class="sm-hinw">Alle 66 Karten in Gold – dein Album ist vollendet!</p>`
    : `<button class="sm-krug-kn${art === "gold" || art === "geschenk" ? "" : " aus"}" id="smKrugKn">${SM_KRUG_SVG}<span><b>${art === "geschenk" ? "Geschenk-Krug öffnen" : "Krug öffnen"}</b><small>${art === "geschenk" ? `${smGeschenke()} ${smGeschenke() === 1 ? "Geschenk" : "Geschenke"} bereit` : art === "tag" ? "Heute schon 3 Krüge – morgen wieder" : art === "arm" ? `Noch ${SM_KRUG_PREIS - gold} Manna – spiel eine Runde!` : `${SM_KRUG_KARTEN} Karten · ${SM_KRUG_PREIS} Manna`}</small></span>${art === "gold" ? `<i class="sm-preis">${SM_GOLD_SVG}${SM_KRUG_PREIS}</i>` : ""}</button>`;
  const gruppen = GROUPS.map((g, gi) => { const idx = ALL.map((b, i) => b.gi === gi ? i : -1).filter(i => i >= 0), n = idx.filter(i => m.album[i] > 0).length;
    return `<section class="sm-gruppe"><div class="sm-gk"><b>${esc(g.name)}</b><span>${n} / ${idx.length}</span></div><div class="sm-raster">${idx.map(i => smKarteHtml(i, m.album[i])).join("")}</div></section>`; }).join("");
  screen.innerHTML = `${bereichKopf("home", { ic: "book", t: "Sammelalbum", sub: `${smGefunden()} / 66 gefunden · ${smGlanz()} in Gold` })}
    ${krugKarte}
    ${leiste}
    <p class="sm-hinw sm-wahl" id="smWahl" hidden></p>
    ${gruppen}
`; /* 10.4: Teilen-Knopf und Erklärtext entfernt */
  { const med = screen.querySelector(".bk-med"); if (med) med.innerHTML = SM_ALBUM_SVG; } /* 9.88: Album-Buch mit „66“ */
  wireGo();
  const kk = $("smKrugKn"); if (kk) kk.onclick = () => { if (kk.classList.contains("aus")) { SFX.tap(); return; } SFX.tap(); const o = smKrugKaufen(); if (o) smKrugBuehne(o, false); };
  const gk = $("smGeschenkKn"); if (gk) gk.onclick = () => { SFX.tap(); const o = smKrugKaufen("geschenk"); if (o) smKrugBuehne(o, false); };
  /* 10.5: Erklärungen erst beim Antippen */
  const info = (t, x) => { SFX.tap(); modal(`<div class="smt-info"><h2>${t}</h2>${x}</div><button class="btn primary" data-close>Verstanden</button>`).dataset.frei = "1"; };
  if ($("smMannaLos")) $("smMannaLos").onclick = () => { SFX.tap(); go("spielen"); };
  $("smMannaInfo") && ($("smMannaInfo").onclick = () => info(`${SM_GOLD_SVG} ${gold} Manna`, `<p>Mit ${SM_KRUG_PREIS} Manna öffnest du einen goldenen Krug mit ${SM_KRUG_KARTEN} Karten – bis zu ${SM_KRUG_TAG} Krüge am Tag. Neue Krüge gibt es jeden Morgen um ${SM_KRUG_STUNDE} Uhr.</p><p>Manna bekommst du für jede Runde ab 30 Sekunden (+1 bei guter Runde), jede Duell-Herausforderung, jede Schatztruhe (${SM_TRUHE_MANNA}), den Biblionär der Woche (2) und jeden Level-Aufstieg (3). Wer den Biblionär der Woche gewinnt, bekommt einen Gratiskrug. Sparen geht ohne Grenze.</p>`));
  $("smTreueInfo").onclick = () => info("Treue-Siegel", `<p>Jeder <b>${SM_TREUE}. Krug</b> enthält sicher eine Goldkarte.</p><p>${bisGold === 1 ? "Der <b>nächste Krug</b> ist es!" : `Noch <b>${bisGold} Krüge</b> bis dahin.`}</p>`);
  $("smGeschenkInfo").onclick = () => info("Geschenk-Krug", `<p>Jede <b>${SM_TRUHEN_GESCHENK}. Schatztruhe</b> (alle 3 Tagesaufgaben geschafft) schenkt dir einen grünen Geschenk-Krug – ohne Manna und <b>zusätzlich</b> zu den 3 Krügen am Tag. Im Geschenk-Krug ist die Chance auf Silber und Gold <b>doppelt so hoch</b> (Silber 40 %, Gold 10 %).</p><p>Noch <b>${nochT} Schatztruhen</b> bis zum nächsten Geschenk.</p>`);
  screen.querySelectorAll("[data-tausch]").forEach(b => b.onclick = () => smTauschStart(+b.dataset.tausch));
  screen.querySelectorAll(".smk").forEach(k => k.onclick = () => { if (smWahl) return smTauschWahl(+k.dataset.i); smKarteZeigen(+k.dataset.i); });
  if ($("smTeilen")) $("smTeilen").onclick = () => { SFX.tap(); smTeilenAlbum(); };
  smWahl = 0;
  if (!m.tour && !m.offen) setTimeout(smTour, 450);
};
function smKarteZeigen(i) {
  const m = smInit(), s = m.album[i], T = ALBUM_TEXT[i] || {}, b = ALL[i];
  /* 9.94: ab Bronze alle Infos (Gruppe, Kapitel, Kernaussage, Verfasser, Schlüsselstelle) */
  const info = !s ? `<p class="muted">Noch nicht gefunden – diese Karte steckt in einem der goldenen Krüge.</p>`
    : `<dl class="sm-info"><dt>Gruppe</dt><dd>${esc(GROUPS[b.gi].name)} · ${b.t === "AT" ? "Altes" : "Neues"} Testament</dd><dt>Kapitel</dt><dd>${T.k}</dd>
      <dt>Worum es geht</dt><dd>${esc(T.t)}</dd><dt>Verfasser</dt><dd>${esc(T.v)}</dd>
      <dt>Schlüsselstelle</dt><dd><b>${esc(T.s)}</b> – ${esc(T.z)}</dd></dl>
      ${s < SM_MAX ? `<p class="small muted" style="margin:6px 0 0">Nächste Stufe: ${SM_STUFE[s + 1]} – über Krüge oder den Tauschbeutel.</p>` : ""}`;
  modal(`<div class="sm-gross">${smKarteHtml(i, s)}</div>${info}<button class="btn primary" data-close="1">Schließen</button>`).dataset.frei = "1";
}

/* ---------- Tauschen ---------- */
function smTauschStart(r) {
  SFX.tap();
  const n = smBeutel(r), N = SM_TAUSCH[r];
  if (n < N) { modal(`<div class="smt-info"><h2>${SM_STUFE[r]}-Säckchen · ${n}/${N}</h2><p>Doppelte ${SM_STUFE[r]}karten landen hier. Mit <b>${N} doppelten</b> machst du eine deiner ${SM_STUFE[r]}karten zu <b>${SM_STUFE[r + 1]}</b> – welche, wählst du selbst.</p><p>Noch <b>${N - n}</b> bis zum Tausch.</p></div><button class="btn primary" data-close>Verstanden</button>`).dataset.frei = "1"; return; }
  const m = smInit(), wahl = m.album.map((s, i) => s === r ? i : -1).filter(i => i >= 0);
  if (!wahl.length) { /* keine Karte genau dieser Stufe: in das nächste Säckchen */
    m.ba[r] += N; if (r + 1 < SM_MAX) m.be[r + 1] = (m.be[r + 1] | 0) + 1; else { m.ba[r] -= N; toast("Alle Karten sind schon Gold."); save(); return; } save(); toast(`${N} ${SM_STUFE[r]} → 1 ${SM_STUFE[r + 1]} im Säckchen`); go("album"); return;
  }
  smWahl = r;
  screen.querySelectorAll(".smk").forEach(k => k.classList.toggle("waehlbar", m.album[+k.dataset.i] === r));
  const h = $("smWahl"); h.hidden = false; h.innerHTML = `Tippe eine <b>${SM_STUFE[r]}karte</b> an – sie wird <b>${SM_STUFE[r + 1]}</b>. <button class="sm-abbr" id="smAbbr">Abbrechen</button>`;
  $("smAbbr").onclick = () => go("album");
  h.scrollIntoView({ behavior: "smooth", block: "center" });
}
function smTauschWahl(i) {
  const m = smInit(), r = smWahl; if (!r || m.album[i] !== r) return;
  smWahl = 0; m.ba[r] += SM_TAUSCH[r]; m.album[i] = r + 1; save();
  const neu = smGruppenPruefen();
  smVerschmelzen(r, i, () => { smNeuBanner(neu); go("album"); });
}

/* ---------- Krug-Bühne (Auspack-Animation) ---------- */
/* 10.13: Wachssiegel des Treue-Krugs (zwei Hälften, die beim Öffnen auseinanderfliegen) */
const SM_SIEGEL_HTML = `<div class="sm-siegel" aria-hidden="true"><svg viewBox="0 0 64 74"><defs><radialGradient id="smSgW" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ff6b6b"/><stop offset=".55" stop-color="#c21f2c"/><stop offset="1" stop-color="#6e0d15"/></radialGradient><linearGradient id="smSgG" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#fff3b8"/><stop offset=".5" stop-color="#f2c14e"/><stop offset="1" stop-color="#8a5a12"/></linearGradient></defs>
  <g class="sg-band"><path d="M22 50l-8 22 9-5 5 7 4-22z" fill="#b01c28" stroke="#5a0a10" stroke-width="1"/><path d="M42 50l8 22-9-5-5 7-4-22z" fill="#b01c28" stroke="#5a0a10" stroke-width="1"/></g>
  <g class="sg-l"><path d="M32 6C18 6 6 17 6 31s12 25 26 25l-4-8 6-8-7-8 6-9-4-7z" fill="url(#smSgW)" stroke="url(#smSgG)" stroke-width="2.4" stroke-linejoin="round"/></g>
  <g class="sg-r"><path d="M32 6c14 0 26 11 26 25S46 56 32 56l-4-8 6-8-7-8 6-9-4-7z" fill="url(#smSgW)" stroke="url(#smSgG)" stroke-width="2.4" stroke-linejoin="round"/></g>
  <g class="sg-z"><circle cx="32" cy="31" r="17" fill="none" stroke="url(#smSgG)" stroke-width="1.6" stroke-dasharray="2 2.2"/><text x="32" y="40" text-anchor="middle" font-size="25" font-weight="900" font-family="Georgia,serif" fill="url(#smSgG)" stroke="#5a0a10" stroke-width=".6">7</text></g>
  <path d="M20 18c3-4 8-6 12-6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".55"/></svg></div>`;
const SM_KRUG_GROSS = `<svg viewBox="0 0 120 150" aria-hidden="true"><defs><radialGradient id="smGlut" cx="50%" cy="55%" r="55%"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".55"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient><linearGradient id="smGk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a5a12"/><stop offset=".22" stop-color="#e9b94a"/><stop offset=".42" stop-color="#fff0b0"/><stop offset=".6" stop-color="#f2c14e"/><stop offset="1" stop-color="#7a4c0e"/></linearGradient><linearGradient id="smGd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a6614"/><stop offset=".45" stop-color="#fff2bf"/><stop offset="1" stop-color="#8a5a12"/></linearGradient></defs>
  <ellipse class="smj-glut" cx="60" cy="88" rx="64" ry="72" fill="url(#smGlut)"/>
  <path d="M44 34h32c1 5 3 8 8 12 10 8 16 20 16 36 0 30-18 52-40 54-22-2-40-24-40-54 0-16 6-28 16-36 5-4 7-7 8-12z" fill="url(#smGk)" stroke="#5a3a08" stroke-width="2" stroke-linejoin="round"/>
  <path d="M24 56c-12 2-14 22-2 28M96 56c12 2 14 22 2 28" fill="none" stroke="url(#smGk)" stroke-width="6" stroke-linecap="round"/>
  <path d="M22 78c24 7 52 7 76 0" fill="none" stroke="#7a4c0e" stroke-width="7" opacity=".55"/><path d="M22 78c24 7 52 7 76 0" fill="none" stroke="#ffe48a" stroke-width="2.2"/>
  <g fill="#fffbe8" stroke="#a8781a" stroke-width=".7"><circle cx="40" cy="82.5" r="2.4"/><circle cx="50" cy="84" r="2.4"/><circle cx="60" cy="84.5" r="2.6"/><circle cx="70" cy="84" r="2.4"/><circle cx="80" cy="82.5" r="2.4"/></g>
  <path d="M40 58c-8 10-10 26-6 42" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/>
  <rect x="42" y="27" width="36" height="9" rx="3" fill="url(#smGd)" stroke="#5a3a08" stroke-width="1.6"/>
  <g class="smj-deckel"><path d="M38 27c2-9 12-13 22-13s20 4 22 13z" fill="url(#smGd)" stroke="#5a3a08" stroke-width="1.8" stroke-linejoin="round"/><circle cx="60" cy="10" r="5" fill="url(#smGd)" stroke="#5a3a08" stroke-width="1.5"/><path d="M60 4.5l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" fill="#fff"/></g></svg>`;
const smRm = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
function smVibr(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
function smKlang(art) {
  const f = { bruch: () => { tone(220, 0, .5, "sine", .25, 120); [523, 659, 784, 1046].forEach((x, i) => tone(x, .2 + i * .06, .4, "triangle", .08)); }, klopf: () => { tone(140, 0, .16, "sine", .3, 90); tone(900, .02, .04, "square", .04); },
    silber: () => [784, 988, 1175].forEach((x, i) => tone(x, i * .07, .3, "triangle", .1)), gold: () => [523, 659, 784, 1046, 1318].forEach((x, i) => tone(x, i * .08, .5, "triangle", .13)),
    glanz: () => [1046, 1318, 1568, 2093, 2637, 3136].forEach((x, i) => tone(x, i * .06, .5, "sine", .08)), auf: () => { [392, 494, 587, 784].forEach((x, i) => tone(x, i * .12, .8, "triangle", .07)); for (let k = 0; k < 12; k++) tone(1800 + Math.random() * 1600, .4 + k * .07, .08, "sine", .015); }, flip: () => { tone(660, 0, .1, "sine", .07); tone(880, .04, .1, "sine", .07); }, plopp: () => { tone(880, 0, .08, "sine", .07); tone(1320, .02, .08, "sine", .07); } };
  try { (f[art] || f.plopp)(); } catch (e) {}
}
/* kleine Partikel-Fläche für die Bühne */
function smStaub(cv) {
  const cx = cv.getContext("2d"); let teile = [], laeuft = false;
  function groesse() { const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1; cv.width = r.width * d; cv.height = r.height * d; cx.setTransform(d, 0, 0, d, 0, 0); }
  groesse();
  function tick() { const r = cv.getBoundingClientRect(); cx.clearRect(0, 0, r.width, r.height); teile = teile.filter(p => p.a > 0);
    teile.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .09; p.vx *= .985; p.a -= p.d; cx.globalAlpha = Math.max(0, p.a); cx.fillStyle = p.f; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fill(); });
    cx.globalAlpha = 1; if (teile.length) requestAnimationFrame(tick); else laeuft = false; }
  return (x, y, n, farben, kraft) => { if (smRm()) return; kraft = kraft || 4; for (let i = 0; i < n; i++) { const w = Math.random() * 6.283, v = (.6 + Math.random()) * kraft; teile.push({ x, y, vx: Math.cos(w) * v, vy: Math.sin(w) * v - kraft * .8, r: 1 + Math.random() * 2.6, a: 1, f: farben[i % farben.length], d: .008 + Math.random() * .012 }); } if (!laeuft) { laeuft = true; requestAnimationFrame(tick); } };
}
function smKrugBuehne(offen, wieder) {
  if (document.querySelector(".sm-ov")) return;
  const rm = smRm(), zug = offen.z, ov = document.createElement("div");
  /* 10.13: Treue-Krug (jeder 7., sicher Gold) – eigener Auftritt: Wachssiegel mit „7“, goldene Strahlen, kreisende Funken; beim Antippen bricht das Siegel */
  const treue = offen.nr % SM_TREUE === 0;
  ov.className = "sm-ov" + (treue ? " treue" : ""); ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", treue ? "Treue-Krug öffnen" : "Krug öffnen");
  ov.innerHTML = `<div class="sm-ov-in"><div class="sm-ov-kopf"><b>${treue ? (offen.art === "geschenk" ? "Geschenk · Treue" : "Treue-Krug") : offen.art === "geschenk" ? "Geschenk-Krug" : "Krug"}</b><span>${wieder ? "Dein Krug wartet noch" : treue ? SM_TREUE + ". Krug · sicher Gold" : SM_KRUG_KARTEN + " Karten"}</span></div>
    <div class="sm-buehne">${treue ? `<div class="sm-tr-strahlen"></div><div class="sm-tr-halo"></div><div class="sm-tr-blitz"></div><div class="sm-tr-welle"></div>` : ""}<div class="sm-kegel"></div><div class="sm-beam"></div><div class="sm-sockel"></div>
      ${treue ? `<div class="sm-tr-orbit">${Array.from({ length: 10 }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div>` : ""}
      <div class="sm-jar ${rm ? "" : treue ? "treue-schweb" : zug.some(c => c.s >= 3) ? "stark" : "wackel"}${offen.art === "geschenk" ? " geschenk" : ""}${treue ? " treue" : ""}" role="button" tabindex="0" aria-label="Krug antippen">${SM_KRUG_GROSS}${treue ? SM_SIEGEL_HTML : ""}</div>
      <p class="sm-tipp">${treue ? "Tippe auf das Siegel – es bricht auf" : `Tippe auf den ${offen.art === "geschenk" ? "Geschenk-Krug" : "goldenen Krug"}`}</p>
      ${(pz => `<div class="sm-selten${treue ? " treue" : offen.art === "geschenk" ? " geschenk" : ""}"><span style="--c:#d58b4f"><b>${pz[0]}</b>Bronze</span><span style="--c:#bfe3ff"><b>${pz[1]}</b>Silber</span><span style="--c:#f2c14e"><b>${pz[2]}</b>Gold</span></div>`)(smProz(offen.art === "geschenk" ? SM_W_GESCHENK : SM_W))}
      <div class="sm-fan"></div><p class="sm-zus"></p><canvas class="sm-fx"></canvas></div>
    <div class="sm-ov-kn"><button class="btn" data-k="alle" hidden>Alle aufdecken</button><button class="btn primary" data-k="fertig" hidden>Ins Album</button></div></div>`;
  document.body.appendChild(ov); document.body.classList.add("spiel-laeuft");
  const q = s => ov.querySelector(s), buehne = q(".sm-buehne"), jar = q(".sm-jar"), fan = q(".sm-fan"), staub = smStaub(q(".sm-fx"));
  const mitte = el => { const r = buehne.getBoundingClientRect(), k = el.getBoundingClientRect(); return [k.left - r.left + k.width / 2, k.top - r.top + k.height / 2]; };
  let tipps = 0, offenN = 0, phase = "krug";
  function karten() {
    phase = "karten"; q(".sm-selten").classList.add("weg"); q(".sm-tipp").classList.add("weg");
    const n = zug.length, mi = (n - 1) / 2;
    zug.forEach((c, k) => {
      const el = document.createElement("div"); el.className = "sm-karte" + (c.d ? " doppelt" : "") + (rm ? " offen" : " wartet"); el.dataset.s = c.s; el.style.setProperty("--rc", SM_RC[c.s]);
      /* 9.98: Markierung NEU / BESSER / DOPPELT außerhalb des Motivs (sm-mark, Geschwister der Karte) */
      const typ = c.d ? "dup" : c.v > 0 ? "besser" : "neu", txt = { neu: "NEU", besser: "BESSER", dup: "DOPPELT" }[typ];
      const sub = c.d ? (c.s < SM_MAX ? "→ Beutel" : "schon da") : c.v > 0 ? `→ ${SM_STUFE[c.s]}` : "";
      el.innerHTML = `<div class="sm-strahl"></div><div class="sm-innen"><div class="sm-seite sm-ruecken"><b>66</b></div><div class="sm-seite sm-vorne">${smKarteHtml(c.i, c.s)}<span class="sm-mark ${typ}"><b>${typ === "besser" ? "▲ " : ""}${txt}</b>${sub ? `<small>${sub}</small>` : ""}</span></div></div>`;
      const x = (k - mi) * 80, y = (k - mi) * (k - mi) * 5, rot = (k - mi) * 5; /* 9.98: etwas weiter auseinander – Platz für die Markierungen */
      el.style.transform = `translate(${x}px,${y}px) rotate(${rot}deg)`;
      fan.appendChild(el);
      if (!rm) el.animate([{ transform: "translate(0,60px) scale(.2)", opacity: 0 }, { transform: `translate(${x * .4}px,${y - 50}px) scale(1.05) rotate(${rot}deg)`, opacity: 1, offset: .7 }, { transform: el.style.transform, opacity: 1 }], { duration: 700, delay: 150 * k, easing: "cubic-bezier(.2,.9,.3,1)", fill: "backwards" });
      el.onclick = () => aufdecken(el, c);
    });
    if (rm) { offenN = n; setTimeout(alleOffen, 200); } else setTimeout(() => { q('[data-k="alle"]').hidden = false; }, 150 * n + 400);
  }
  function aufdecken(el, c) {
    if (phase !== "karten" || el.classList.contains("offen")) return;
    el.classList.remove("wartet"); el.classList.add("offen"); smKlang("flip");
    const [x, y] = mitte(el);
    setTimeout(() => {
      if (c.d) return staub(x, y, 10, [SM_RC[c.s], "#fff"], 2);
      if (c.s === 1) staub(x, y, 14, ["#f0b07a", "#d58b4f"], 2);
      if (c.s === 2) { smKlang("silber"); staub(x, y, 30, ["#e6f4ff", "#bfe3ff", "#fff"], 3); }
      if (c.s === 3) { smKlang("gold"); smVibr([60, 40, 90]); staub(x, y, 80, ["#fff3b8", "#ffe08a", "#f2c14e"], 5); }
    }, 320);
    if (++offenN === zug.length) setTimeout(alleOffen, 650);
  }
  function alleOffen() {
    phase = "offen"; q('[data-k="alle"]').hidden = true; q('[data-k="fertig"]').hidden = false;
    q(".sm-zus").innerHTML = smZugText(zug);
  }
  q('[data-k="alle"]').onclick = () => { let t = 0; fan.querySelectorAll(".sm-karte").forEach((el, k) => { if (!el.classList.contains("offen")) { setTimeout(() => aufdecken(el, zug[k]), t); t += 260; } }); };
  /* 9.97: „Ins Album“ – das Krug-Fenster schließt sich, die Karten fliegen ins echte Sammelalbum (mit Scrollen) */
  q('[data-k="fertig"]').onclick = () => {
    if (phase !== "offen") return;
    phase = "sortieren";
    const m = smInit(), vor = (offen.vor || m.album).slice();
    m.offen = null; save();
    ov.remove(); document.body.classList.remove("spiel-laeuft");
    smEinfliegen(zug, vor, () => { const neu = smGruppenPruefen(); smNeuBanner(neu); smHud(0); });
  };
  const tippen = () => { /* 9.92: goldener Krug – einmal tippen, Deckel hebt sich, Manna rieselt */
    if (phase !== "krug") return;
    phase = "weg";
    if (rm) { jar.style.opacity = 0; setTimeout(() => { jar.remove(); karten(); }, 300); return; }
    oeffnen();
  };
  jar.onclick = tippen; jar.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tippen(); } };
  function oeffnen() {
    if (treue && !jar.dataset.gebrochen) { /* 10.13: zuerst bricht das Siegel – Goldblitz, Druckwelle, Goldfunken */
      jar.dataset.gebrochen = "1"; jar.classList.remove("treue-schweb"); jar.classList.add("bricht");
      const [sx, sy] = mitte(jar.querySelector(".sm-siegel") || jar);
      smKlang("gold"); smVibr([50, 40, 120]);
      setTimeout(() => { buehne.classList.add("tr-auf"); staub(sx, sy, 90, ["#fff3b8", "#ffe08a", "#f2c14e", "#ffffff"], 6); smKlang("silber"); }, 260);
      setTimeout(() => staub(sx, sy - 40, 60, ["#fff3b8", "#f2c14e", "#d8323f"], 4), 620);
      setTimeout(oeffnen, 900); return;
    }
    smKlang("klopf"); smVibr(30); jar.classList.remove("wackel", "stark"); jar.classList.add("glueht");
    const [mx, my] = mitte(jar), oben = my - 70, manna = treue ? ["#fff3b8", "#ffe08a", "#f2c14e", "#ffffff"] : ["#fffbee", "#fff3c4", "#ffffff", "#ffe9a0"];
    setTimeout(() => { jar.classList.add("auf"); smKlang("auf"); q(".sm-beam").classList.add("an"); staub(mx, oben, 70, manna, 4.5); }, 380);
    setTimeout(() => staub(mx, oben, 50, manna, 3.5), 780);
    setTimeout(() => staub(mx, oben, 40, manna, 3), 1150);
    setTimeout(() => { jar.classList.add("weg"); q(".sm-sockel").style.opacity = .35; }, 1350);
    setTimeout(karten, 1450);
  }
  if (wieder && rm) { tippen(); }
}
function smVerschmelzen(r, i, fertig) {
  const rm = smRm(), ov = document.createElement("div"), N = SM_TAUSCH[r];
  ov.className = "sm-ov"; ov.innerHTML = `<div class="sm-ov-in"><div class="sm-ov-kopf"><b>Tauschen</b><span>${N} ${SM_STUFE[r]} → 1 ${SM_STUFE[r + 1]}</span></div><div class="sm-buehne"><div class="sm-kegel"></div><div class="sm-fan"></div><canvas class="sm-fx"></canvas></div><div class="sm-ov-kn"><button class="btn primary" data-k="ok" hidden>Ins Album</button></div></div>`;
  document.body.appendChild(ov);
  const buehne = ov.querySelector(".sm-buehne"), fan = ov.querySelector(".sm-fan"), staub = smStaub(ov.querySelector(".sm-fx"));
  const W = buehne.getBoundingClientRect().width;
  for (let k = 0; k < N; k++) {
    const m = document.createElement("div"); m.className = "sm-mini"; m.style.setProperty("--rc", SM_RC[r]); fan.appendChild(m);
    const w = (k - (N - 1) / 2);
    m.animate([{ transform: `translate(${w * 60}px,180px) scale(.6)`, opacity: 0 }, { transform: `translate(${w * 70}px,40px) rotate(${w * 14}deg) scale(1.2)`, opacity: 1, offset: .5 }, { transform: "translate(0,60px) scale(.5)", opacity: 1 }], { duration: rm ? 300 : 1300, delay: k * 90, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
  }
  tone(300, 0, .2, "sine", .06); tone(600, .15, .2, "sine", .06); tone(900, .3, .25, "sine", .06);
  setTimeout(() => {
    fan.innerHTML = ""; smKlang(r + 1 === 4 ? "glanz" : r + 1 === 3 ? "gold" : "silber"); smVibr(60); staub(W / 2, 140, 110, [SM_RC[r + 1], "#fff", "#fff3b8"], 5);
    const el = document.createElement("div"); el.className = "sm-karte offen gross"; el.dataset.s = r + 1; el.style.setProperty("--rc", SM_RC[r + 1]);
    el.innerHTML = `<div class="sm-strahl"></div><div class="sm-innen"><div class="sm-seite sm-ruecken"><b>66</b></div><div class="sm-seite sm-vorne">${smKarteHtml(i, r + 1, `<span class="smk-up">${SM_STUFE[r]} → ${SM_STUFE[r + 1]}</span>`)}</div></div>`;
    fan.appendChild(el); el.animate([{ transform: "scale(.2)", opacity: 0 }, { transform: "scale(1.15)", opacity: 1, offset: .6 }, { transform: "scale(1)" }], { duration: rm ? 200 : 700, easing: "cubic-bezier(.2,1.4,.5,1)" });
    const ok = ov.querySelector('[data-k="ok"]'); ok.hidden = false; ok.onclick = () => { ov.remove(); fertig(); };
  }, rm ? 400 : 1650);
}
/* 9.97: Karten fliegen nacheinander an ihren Platz im echten Album; vorher zeigt das Album noch den alten Stand */
let smFliegt = false;
function smEinfliegen(zug, vor, fertig) {
  const rm = smRm();
  if (current !== "album") go("album"); else VIEWS.album();
  smFliegt = true;
  const platz = i => screen.querySelector(`.sm-raster .smk[data-i="${i}"]`);
  zug.forEach(c => { const el = platz(c.i); if (el && !c.d) el.outerHTML = smKarteHtml(c.i, vor[c.i]); }); /* alter Stand */
  const be = { 1: smBeutel(1), 2: smBeutel(2) }; zug.forEach(c => { if (c.d && c.s < SM_MAX) be[c.s] = Math.max(0, be[c.s] - 1); });
  const beutelZeigen = r => { const b = screen.querySelector(`[data-tausch="${r}"]`); if (!b) return; const n = Math.min(be[r], SM_TAUSCH[r]);
    b.querySelectorAll(".pk i").forEach((x, k) => x.classList.toggle("an", k < n)); const z = b.querySelector("b, .bz-n"); if (z && /^\d+$/.test(z.textContent.trim())) z.textContent = be[r]; };
  [1, 2].forEach(beutelZeigen);
  const schicht = document.createElement("div"); schicht.className = "sm-flug";
  schicht.innerHTML = `<button class="btn ghost sm-flug-weg">Überspringen</button><p class="sm-flug-z"></p>`;
  document.body.appendChild(schicht);
  let ende = false, k = 0; zug = zug.slice().sort((a, b) => a.i - b.i); /* in Album-Reihenfolge, damit die Ansicht nicht springt */
  const abschluss = () => {
    if (ende) return; ende = true; smFliegt = false; schicht.remove();
    go("album"); scrollTo({ top: 0, behavior: rm ? "auto" : "smooth" });
    toast(`${SM_ALBUM_SVG}<div><b>Ins Album sortiert</b><div class="small muted">${smZugText(zug)}</div></div>`);
    fertig && fertig();
  };
  schicht.querySelector(".sm-flug-weg").onclick = () => { SFX.tap(); abschluss(); };
  const naechste = () => {
    if (ende) return; if (k >= zug.length) return setTimeout(abschluss, rm ? 200 : 700);
    const c = zug[k++], ziel = c.d && c.s < SM_MAX ? screen.querySelector(`[data-tausch="${c.s}"]`) : platz(c.i);
    schicht.querySelector(".sm-flug-z").innerHTML = `${k} / ${zug.length} · <b>${esc(ALL[c.i].b)}</b> ${c.d ? "doppelt → Tauschbeutel" : c.v ? `${SM_STUFE[c.v]} → ${SM_STUFE[c.s]}` : "neu"}`;
    if (!ziel) return naechste();
    ziel.scrollIntoView({ block: "center", behavior: rm ? "auto" : "smooth" });
    /* 9.99: erst fliegen, wenn das Scrollen wirklich steht; Ziel in jedem Bild neu messen → landet genau einmal exakt auf dem Platz */
    const scrollFertig = cb => { let y = scrollY, ruhig = 0, n = 0; const t = () => { if (ende) return; n++; if (Math.abs(scrollY - y) < .5) ruhig++; else ruhig = 0; y = scrollY; if (ruhig >= 4 || n > 90) cb(); else requestAnimationFrame(t); }; requestAnimationFrame(t); };
    scrollFertig(() => {
      if (ende) return;
      const zielEl = () => c.d && c.s < SM_MAX ? screen.querySelector(`[data-tausch="${c.s}"]`) : platz(c.i);
      const r0 = zielEl().getBoundingClientRect(), w = c.d && c.s < SM_MAX ? Math.min(70, r0.width) : r0.width, h = c.d && c.s < SM_MAX ? w * 94 / 66 : r0.height;
      const fl = document.createElement("div"); fl.className = "sm-flieger"; fl.innerHTML = smKarteHtml(c.i, c.s);
      Object.assign(fl.style, { width: w + "px", height: h + "px", left: "0px", top: "0px" });
      schicht.appendChild(fl);
      const gr = Math.min(2.4, 150 / w), dauer = rm ? 0 : 950, t0 = performance.now(), ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      const landen = () => {
        const z = zielEl(); smKlang("flip");
        if (c.d && c.s < SM_MAX) { be[c.s]++; beutelZeigen(c.s); if (z) { z.classList.remove("sm-plopp"); void z.offsetWidth; z.classList.add("sm-plopp"); } fl.remove(); }
        else if (z) { const tmp = document.createElement("span"); tmp.innerHTML = smKarteHtml(c.i, c.s); const el = tmp.firstElementChild; el.classList.add("sm-gelandet");
          z.replaceWith(el); fl.remove(); /* erst austauschen, dann Flieger weg – kein Flackern, kein zweites Einsetzen */
          if (c.s === 3) smKlang("gold"); else if (c.s === 2) smKlang("silber"); }
        else fl.remove();
        setTimeout(naechste, rm ? 80 : 420);
      };
      const bild = jetzt => {
        if (ende) { fl.remove(); return; }
        const z = zielEl(); if (!z) { fl.remove(); return naechste(); }
        const r = z.getBoundingClientRect(), zx = r.left + r.width / 2 - w / 2, zy = r.top + r.height / 2 - h / 2;
        const p = dauer ? Math.min(1, (jetzt - t0) / dauer) : 1, e = ease(p), sx = innerWidth / 2 - w / 2, sy = innerHeight / 2 - h / 2;
        const x = sx + (zx - sx) * e, y = sy + (zy - sy) * e, sc = gr + (1 - gr) * e, rot = -6 * (1 - e);
        fl.style.transform = `translate(${x}px,${y}px) scale(${sc}) rotate(${rot}deg)`; fl.style.opacity = Math.min(1, p * 5);
        if (p < 1) requestAnimationFrame(bild); else landen();
      };
      requestAnimationFrame(bild);
    });
  };
  setTimeout(naechste, rm ? 50 : 350);
}
function smNeuBanner(neu) {
  (neu || []).forEach((x, k) => setTimeout(() => { try { SFX.badge(); toast(`<b>${esc(GROUPS[x.gi].name)} komplett in ${SM_STUFE[x.s]}!</b> +${SM_GRUPPEN_LOHN[x.s]} Manna${x.s >= SM_MAX ? ` · neuer Avatar „${esc((AVATARE.find(a => a.id === SM_AV_REIHE[x.gi]) || {}).name || "")}“ im Laden` : ""}${x.s >= SM_MAX && smInit().album.every(v => v >= SM_MAX) ? " · und „Das ganze Wort“ (Avatar und Rahmen)!" : x.s < SM_MAX && smInit().album.every(v => v >= x.s) ? ` · und Rahmen „Das ganze Wort (${SM_STUFE[x.s]})“!` : ""}`); } catch (e) {} }, 600 + k * 2800));
}

/* ---------- Teilen-Bilder (Rückblick und Album) ---------- */
function smLink() { const basis = "https://meisterspezi.github.io/bibel-quest/"; return basis + (S.lbName && S.pid ? "?von=" + encodeURIComponent(S.pid) : ""); }
function smBild(src) { return new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }); }
async function smQr(url) { try { const q = qrcode(0, "M"); q.addData(url); q.make(); return await smBild(q.createDataURL(10, 2)); } catch (e) { return null; } }
function smRund(cx, x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
function smUmbruch(cx, text, x, y, maxB, zeile) { const w = String(text).split(" "); let l = "", n = 0; for (const t of w) { const p = l ? l + " " + t : t; if (cx.measureText(p).width > maxB && l) { cx.fillText(l, x, y + n * zeile); l = t; n++; } else l = p; } if (l) cx.fillText(l, x, y + n * zeile); return n + 1; }
/* zeichnet Hintergrund, Kopf und Fuß (QR + Link) – inhalt(cx, W, y0, y1) füllt die Mitte */
async function smZeichnen(format, titel, unter, inhalt) {
  try { await document.fonts.ready; } catch (e) {}
  const W = 1080, H = format === "quadrat" ? 1080 : 1920, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const cx = cv.getContext("2d");
  const g = cx.createRadialGradient(W / 2, 0, 50, W / 2, H * .4, H); g.addColorStop(0, "#26306e"); g.addColorStop(.55, "#121838"); g.addColorStop(1, "#070a1d"); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
  cx.strokeStyle = "#f2c14e66"; cx.lineWidth = 6; smRund(cx, 24, 24, W - 48, H - 48, 48); cx.stroke();
  const icon = await smBild("icons/icon-192.png"), q = format === "quadrat";
  const kopf = q ? 70 : 110, ic = q ? 110 : 150;
  if (icon) cx.drawImage(icon, 70, kopf, ic, ic);
  cx.textAlign = "left"; cx.fillStyle = "#f2c14e"; { const frei = W - 70 - (70 + ic + 30); let fs = q ? 58 : 74; do { cx.font = `800 ${fs}px Cinzel, Georgia, serif`; } while (cx.measureText(titel).width > frei && --fs > 30); } cx.fillText(titel, 70 + ic + 30, kopf + ic * .55); /* 9.86: Titel passt immer */
  cx.fillStyle = "#c9d1ff"; cx.font = `600 ${q ? 32 : 38}px Lexend, sans-serif`; cx.fillText(unter, 70 + ic + 30, kopf + ic * .55 + (q ? 46 : 58));
  const fuss = q ? 250 : 360, y0 = kopf + ic + (q ? 40 : 70), y1 = H - fuss - 30;
  await inhalt(cx, W, y0, y1, q);
  /* Fuß: QR-Code + Einladung */
  const qr = await smQr(smLink()), qs = q ? 190 : 260, fy = H - fuss;
  cx.fillStyle = "#ffffff"; smRund(cx, 70, fy, qs + 24, qs + 24, 24); cx.fill(); if (qr) cx.drawImage(qr, 82, fy + 12, qs, qs);
  cx.fillStyle = "#fff1c2"; cx.font = `800 ${q ? 40 : 50}px Lexend, sans-serif`; cx.fillText("Lerne die 66 Bücher", 70 + qs + 60, fy + (q ? 70 : 90));
  cx.fillText("der Bibel – spiel mit!", 70 + qs + 60, fy + (q ? 120 : 155)); cx.fillStyle = "#a9b0d6"; cx.font = `600 ${q ? 28 : 34}px Lexend, sans-serif`; cx.fillText("Bibelbuch-Quest · QR-Code scannen", 70 + qs + 60, fy + (q ? 172 : 225));
  return cv;
}
async function smTeilen(cv, name, text) {
  const blob = await new Promise(r => cv.toBlob(r, "image/png"));
  const datei = blob ? new File([blob], name, { type: "image/png" }) : null;
  try { if (datei && navigator.canShare && navigator.canShare({ files: [datei] })) { await navigator.share({ files: [datei], text: text + "\n" + smLink() }); return true; } } catch (e) { if (e && e.name === "AbortError") return false; }
  try { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); } catch (e) {}
  try { await navigator.clipboard.writeText(text + "\n" + smLink()); toast("Bild gespeichert, Text mit Link kopiert – jetzt in WhatsApp einfügen."); } catch (e) { toast("Bild gespeichert."); }
  return true;
}
async function smTeilenAlbum() {
  const m = smInit();
  const cv = await smZeichnen("quadrat", "Mein Sammelalbum", `${smGefunden()} / 66 gefunden · ${smGlanz()} in Gold`, async (cx, W, y0, y1) => {
    const sp = 11, gap = 10, w = (W - 140 - gap * (sp - 1)) / sp, h = Math.min(w * 1.3, (y1 - y0 - gap * 5) / 6);
    m.album.forEach((s, i) => { const x = 70 + (i % sp) * (w + gap), y = y0 + Math.floor(i / sp) * (h + gap);
      if (s === 4) { const gr = cx.createLinearGradient(x, y, x + w, y + h); ["#ff8a8a", "#ffd95c", "#5fe0b0", "#7fc8ff", "#c49bff"].forEach((c, k) => gr.addColorStop(k / 4, c)); cx.fillStyle = gr; }
      else cx.fillStyle = s ? SM_RC[s] : "#1e2552";
      smRund(cx, x, y, w, h, 8); cx.fill(); cx.fillStyle = smGc(i); cx.fillRect(x + 4, y, w - 8, 6); });
  });
  smTeilen(cv, "mein-sammelalbum.png", `Mein Sammelalbum in Bibelbuch-Quest: ${smGefunden()} von 66 Bibelbüchern gefunden, ${smGlanz()} in Gold! Sammelst du mit?`);
}

/* ---------- 9.85/9.92: Goldkarten für die Rangliste (Feld gl, Sammlung album) ----------
   Eigene kleine Sammlung album/{pid} = { gl, updated } – die Ranglisten-Regel für „spieler“ ist an der Grenze von 1000 Rechenschritten.
   Geschrieben wird nur, wenn sich die Zahl ändert (höchstens 66-mal je Spieler). Der Sammel-Job trägt gl in die Rangliste ein. */
let smGlLaeuft = false, smStAlt = false;
/* 10.2: Album-Stand. Auf dem Gerät als 66 Ziffern (0 = fehlt, 1 Bronze, 2 Silber, 3 Gold), in der Datenbank kompakt als sk = 22 Zeichen
   (je Zeichen 3 Bücher à 2 Bit, Alphabet A–Z a–z 0–9 - _) – ein Drittel der Größe. */
const SM_SK_ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const smStText = () => smInit().album.map(x => Math.max(0, Math.min(SM_MAX, x | 0))).join("");
const smPack = st => { let o = ""; for (let i = 0; i < 66; i += 3) o += SM_SK_ABC[(+st[i] << 4) | (+st[i + 1] << 2) | +st[i + 2]]; return o; };
const smUnpack = sk => { if (typeof sk !== "string" || !/^[A-Za-z0-9_-]{22}$/.test(sk)) return ""; let o = ""; for (const c of sk) { const v = SM_SK_ABC.indexOf(c); o += ((v >> 4) & 3) + "" + ((v >> 2) & 3) + (v & 3); } return o; };
/* 10.2 Datenbank schonen: das Album geht gebündelt raus – sofort nur beim allerersten Mal, sonst höchstens alle 6 Stunden
   und beim Verlassen der App (sofortSenden). Andere sehen Änderungen deshalb mit Verzögerung – gewollt. */
const SM_SENDE_ABSTAND = 6 * 36e5;
function smGlanzSenden(L, jetzt) {
  if (!smFrei()) return;
  if (BETA) return; /* 9.93: Beta-Album nicht in die Rangliste */
  const m = smInit(), n = smGlanz(), st = smStText(), sk = smPack(st), leer = !/[1-3]/.test(st);
  const skNeu = !smStAlt && m.sts !== sk && !(leer && !m.sts), glNeu = (m.gls | 0) !== n && !(!n && !m.gls);
  if (!S.pid || !L || !L.albumSetzen || smGlLaeuft || (!skNeu && !glNeu)) return;
  if (!jetzt && m.sz && Date.now() - m.sz < SM_SENDE_ABSTAND) return;
  smGlLaeuft = true;
  L.albumSetzen(S.pid, n, smStAlt ? null : sk).then(w => { m.gls = n; m.sz = Date.now(); if (w === "alt") smStAlt = true; else m.sts = sk; save(); }).catch(() => {}).finally(() => { smGlLaeuft = false; });
}
/* ---------- 10.2: Album in der Rangliste (Kachel „Album“) und im Spielerprofil (Reiter „Album“) ----------
   Rangliste: Feld ab = "Gold.Silber.Bronze" in der Sammel-Rangliste (kein zusätzlicher Lesevorgang).
   Schaufenster: ganzes Album aus albumliste/alle (1 Lesevorgang, 12 Std. auf dem Gerät gemerkt) – erst, wenn jemand den Reiter öffnet. */
const smIch = r => r && r.id === S.pid && smFrei();
function albumZahlen(r) { /* [Gold, Silber, Bronze] oder null */
  if (smIch(r)) { const st = smStText(); return [3, 2, 1].map(s => st.split("").filter(c => +c === s).length); }
  if (r && typeof r.ab === "string" && /^\d+\.\d+\.\d+$/.test(r.ab)) return r.ab.split(".").map(Number);
  return null;
}
function albumPunkte(r) {
  const z = albumZahlen(r); if (z) return z[0] * 3 + z[1] * 2 + z[2];
  return r && +r.gl > 0 ? Math.min(66, r.gl | 0) * 3 : 0; /* ältere App-Version: Goldkarten × 3 als Untergrenze */
}
function albumWoche(r) {
  if (!r || r.awk !== weekKey() || r.aw === "" || r.aw == null || !(+r.aw >= 0)) return 0;
  return Math.max(0, albumPunkte(r) - (r.aw | 0));
}
function albumBalken(r, woche) {
  if (woche) return albumWocheBalken(r);
  const z = albumZahlen(r); if (!z) return "";
  const [g, s, b] = z, w = n => (n / 66 * 100).toFixed(1) + "%";
  return `<span class="alb-bar" title="${g} Gold · ${s} Silber · ${b} Bronze"><i class="b3" style="width:${w(g)}"></i><i class="b2" style="width:${w(s)}"></i><i class="b1" style="width:${w(b)}"></i></span>`;
}
/* 10.7: „Album diese Woche“ – nur was in dieser Woche dazukam. Aus dem Stand zu Wochenbeginn (awb = "Gold.Silber.Bronze",
   Sammel-Job) und dem jetzigen Stand: neu gefunden (Bronze), neu auf Silber, neu auf Gold. Summe = Wochenpunkte. */
function albumWocheZahlen(r) { /* [neu Gold, neu Silber, neu gefunden] oder null */
  const z = albumZahlen(r);
  if (!z || !r || r.awk !== weekKey() || typeof r.awb !== "string" || !/^\d+\.\d+\.\d+$/.test(r.awb)) return null;
  const [g0, s0, b0] = r.awb.split(".").map(Number), [g, s, b] = z;
  return [Math.max(0, g - g0), Math.max(0, g + s - g0 - s0), Math.max(0, g + s + b - g0 - s0 - b0)];
}
let albWMax = 1; /* höchster Wochenwert der Liste – volle Leiste */
function albumWocheBalken(r) {
  const p = albumWoche(r); if (!p) return `<span class="alb-bar"></span>`;
  const z = albumWocheZahlen(r), w = n => (n / Math.max(1, albWMax) * 100).toFixed(1) + "%";
  if (!z) return `<span class="alb-bar" title="+${p} Punkte diese Woche"><i class="b0" style="width:${w(p)}"></i></span>`;
  const [g, s, b] = z;
  return `<span class="alb-bar" title="${albumWocheText(z)}"><i class="b3" style="width:${w(g)}"></i><i class="b2" style="width:${w(s)}"></i><i class="b1" style="width:${w(b)}"></i></span>`;
}
const albumWocheText = z => [z[2] && `${z[2]} neu`, z[1] && `${z[1]} auf Silber`, z[0] && `${z[0]} auf Gold`].filter(Boolean).join(" · ") || "noch nichts Neues";
/* Zahlen als Farbpunkte (lang = mit Wörtern, fürs Podest Platz 1) */
function albumPunkteHtml(r, woche, lang) {
  const z = woche ? albumWocheZahlen(r) : albumZahlen(r);
  if (!z) return woche && albumWoche(r) ? `<span class="ap-z"><span>+${albumWoche(r)} Punkte</span></span>` : "";
  const nm = woche ? ["auf Gold", "auf Silber", "neu"] : ["Gold", "Silber", "Bronze"];
  return `<span class="ap-z">${[2, 1, 0].map(i => `<span class="${z[i] ? "" : "aus"}"><i class="d${3 - i}"></i>${z[i]}${lang ? " " + nm[i] : ""}</span>`).join("")}</span>`;
}
const albumAnzahl = r => { const z = albumZahlen(r); return z ? z[0] + z[1] + z[2] : 0; };
/* 10.7: Podest der Album-Rangliste. Platz 1 groß (bis 3 nebeneinander), Platz 2/3 als Karten; geteilte Plätze als
   schmale Zeilen – mehr als 4 laufen langsam durch (albumRotieren). */
function albumPodest(g1, g2, g3, wert, me, woche) {
  const name = r => `${esc(r.name)}${r.id === me ? '<span class="you">DU</span>' : ""}`;
  const zahl = r => woche ? `+${albumWoche(r)}` : `${albumAnzahl(r)}/66`;
  const zeile = (r, gross) => `<button class="ap-zl ${gross ? "gross" : ""} ${r.id === me ? "me" : ""}" data-pid="${esc(r.id)}">${gross ? avatarLv(r, 34) : avatarHtml(r, 24)}<span class="ap-zt"><span class="ap-nz"><b>${name(r)}</b><small>${zahl(r)}</small></span>${albumBalken(r, woche)}</span></button>`;
  const liste = (g, gross) => `<div class="ap-rot ${gross ? "gross" : ""} ${g.length > 4 ? "laeuft" : ""}" style="--n:${g.length}"><div class="ap-rot-in">${g.map(r => zeile(r, gross)).join("")}</div></div>`;
  const mehr = g => g.length > 1 ? ` · ${g.length}×` : "";
  let eins;
  if (g1.length === 1) { const r = g1[0], z = albumZahlen(r), n = albumAnzahl(r);
    eins = `<button class="ap-eins ${r.id === me ? "me" : ""}" data-pid="${esc(r.id)}">${avatarLv(r, 50)}<b class="ap-n1">${name(r)}</b>
      <span class="ap-lz"><span>${woche ? "Diese Woche" : "Album"}</span><span>${woche ? `+${albumWoche(r)} Punkte` : `${n} / 66 · ${Math.round(n / 66 * 100)} %`}</span></span>
      <span class="ap-gb">${albumBalken(r, woche)}</span>${albumPunkteHtml(r, woche, true)}</button>`; }
  else if (g1.length <= 3) eins = `<div class="ap-neben">${g1.map(r => `<button class="ap-p ${r.id === me ? "me" : ""}" data-pid="${esc(r.id)}">${avatarLv(r, 44)}<b>${name(r)}</b><small>${zahl(r)}</small>${albumBalken(r, woche)}</button>`).join("")}</div>`;
  else eins = liste(g1, true);
  const gold = `<div class="gk-gold ap-gold${g1.length === 1 ? " einzel" : ""}"><span class="pod-krone">${svg("crown")}</span>
    <div class="gk-t">Platz 1 · ${pkt(wert(g1[0]))} Punkte${g1.length > 1 ? `<small>${g1.length} Spieler teilen sich Platz 1</small>` : ""}</div>${eins}</div>`;
  const klein = (n, g) => { if (!g.length) return "";
    const kopf = `<div class="gk-h"><span class="gk-med">${n}</span><span>${pkt(wert(g[0]))} Punkte${mehr(g)}</span></div>`;
    if (g.length > 1) return `<div class="gk-k gk-k${n} gk-licht ap-k">${kopf}${liste(g)}</div>`;
    const r = g[0];
    return `<div class="gk-k gk-k${n} gk-licht ap-k einzel"><button class="ap-einzeln ${r.id === me ? "me" : ""}" data-pid="${esc(r.id)}">${kopf}${avatarLv(r, 42)}<b>${name(r)}</b>
      <span class="ap-lz"><span>${woche ? "Woche" : "Album"}</span><span>${zahl(r)}</span></span>${albumBalken(r, woche)}${albumPunkteHtml(r, woche)}</button></div>`; };
  return `<div class="gk ap">${gold}${g2.length ? `<div class="gk-zd">${klein(2, g2)}${klein(3, g3)}</div>` : ""}</div>`;
}
let albRotTimer = 0;
function albumRotieren(box) {
  clearInterval(albRotTimer); albRotTimer = 0;
  const listen = [...box.querySelectorAll(".ap-rot.laeuft")]; if (!listen.length) return;
  let ruhig = false; try { ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  albRotTimer = setInterval(() => {
    if (!document.body.contains(box)) { clearInterval(albRotTimer); albRotTimer = 0; return; }
    if (document.hidden) return;
    listen.forEach(l => { const inn = l.firstElementChild, erst = inn && inn.firstElementChild; if (!erst || inn.dataset.lauf) return;
      const h = erst.getBoundingClientRect().height + (parseFloat(getComputedStyle(erst).marginBottom) || 0);
      const fertig = () => { inn.style.transition = "none"; inn.appendChild(erst); inn.style.transform = ""; delete inn.dataset.lauf; };
      if (ruhig) { fertig(); return; }
      inn.dataset.lauf = "1"; inn.style.transition = "transform .7s ease"; inn.style.transform = `translateY(${-h}px)`;
      setTimeout(fertig, 750); });
  }, 3200);
}
/* Schaufenster: Mini-Album mit 66 Plätzen. st = 66 Ziffern (eigenes Album vom Gerät, sonst aus der Albumliste) */
function albumSchaufenster(r, istIch, st) {
  if (smIch(r)) st = smStText();
  if (!st || !/[1-3]/.test(st)) return `<p class="small muted" style="margin:8px 0 0">${istIch ? "Dein Album ist noch leer." : `${esc(r.name)} hat noch keine Karten im Album – oder sie sind noch nicht übertragen (bis zu ein paar Stunden).`}</p>`;
  const z = [3, 2, 1].map(s => st.split("").filter(c => +c === s).length), [g, s, b] = z, ich = istIch ? "" : smStText();
  const plaetze = st.split("").map((c, i) => `<i class="alb-p s${c}" style="--gl:${SM_GLAS[ALL[i].gi]}" title="${esc(ALL[i].b)} · ${c > 0 ? SM_STUFE[c] : "fehlt"}"></i>`).join("");
  const meister = GROUPS.map((gr, gi) => ALL.map((x, i) => [x, i]).filter(([x]) => x.gi === gi).every(([, i]) => st[i] === "3") ? gr.name : "").filter(Boolean);
  const nurEr = ich ? st.split("").map((c, i) => c === "3" && ich[i] !== "3" ? ALL[i].b : "").filter(Boolean) : [];
  return `<div class="alb-sf"><div class="alb-raster">${plaetze}</div>
    <div class="alb-zahl"><span class="z3">${g} Gold</span><span class="z2">${s} Silber</span><span class="z1">${b} Bronze</span><span>${66 - b - s - g} fehlen</span></div>
    ${meister.length ? `<p class="small" style="margin:6px 0 0"><b>Ganz in Gold:</b> ${esc(meister.join(", "))}</p>` : ""}
    ${nurEr.length ? `<p class="small muted" style="margin:4px 0 0">In Gold, was dir noch fehlt: ${esc(nurEr.slice(0, 6).join(", "))}${nurEr.length > 6 ? ` und ${nurEr.length - 6} weitere` : ""}</p>` : ""}</div>`;
}
async function albumVonSpieler(r) { /* 66 Ziffern oder "" */
  if (smIch(r)) return smStText();
  const L = window.LB; if (!L || !L.albumListe) return "";
  try { const m = await L.albumListe(); return smUnpack(m && m[r.id]); } catch (e) { return ""; }
}

/* ---------- 9.85: Ankündigung (einmal) und kurze Tour beim ersten Öffnen ---------- */
function smAnkuendigen() {
  if (!smFrei()) return;
  const m = smInit(); if (m.ah || !S.lbName) return;
  setTimeout(() => {
    if (current !== "home" || document.querySelector(".modal, .sm-ov, .sm-tour") || m.ah) return;
    m.ah = 1; save();
    const karten = [[0, 1], [18, 2], [42, 3]].map(([i, st]) => `<span class="sm-ank-k">${smKarteHtml(i, st)}</span>`).join("");
    modal(`<div class="rb-fenster sm-ank"><div class="sm-ank-f">${karten}</div><small class="sm-ank-neu">NEU</small><h2>Das Sammelalbum</h2>
      <p>Sammle alle 66 Bibelbücher als Karten – von Bronze bis Gold. Beim Spielen sammelst du <b>Manna</b>, damit öffnest du goldene Krüge mit je 4 Karten.</p>
      <p class="sm-ank-g">${SM_KRUG_SVG}<span>Dein <b>erster Krug</b> ist ein Geschenk!</span></p>
      <button class="btn primary" data-close="los">Startkrug öffnen</button><button class="btn ghost" data-close="">Später</button></div>`,
      w => { if (w === "los") go("album"); }).dataset.frei = "1";
  }, 1500);
}
const SM_TOUR = [
  { sel: ".smt-karte", t: "Krüge und Manna", x: "Ein goldener Krug kostet 10 Manna und enthält 4 Karten – bis zu 3 am Tag, neue jeden Morgen um 8 Uhr. Manna gibt es fürs Spielen. Dein erster Krug ist ein Geschenk." },
  { sel: ".smt-leiste", t: "Ziele und Tauschbeutel", x: "Treue-Siegel: jeder 7. Krug hat sicher Gold. Geschenk: jede 7. Schatztruhe schenkt einen Krug. In den Säckchen sammeln sich doppelte Karten – 4 gleiche machen eine Karte eine Stufe besser. Antippen erklärt alles." }
];
function smTour() {
  const m = smInit(); if (m.tour || current !== "album" || document.querySelector(".modal, .sm-ov, .sm-tour")) return;
  let k = 0; const ov = document.createElement("div"); ov.className = "sm-tour"; document.body.appendChild(ov);
  const ende = () => { ov.remove(); m.tour = 1; save(); removeEventListener("resize", zeigen); };
  function zeigen() {
    const T = SM_TOUR[k], el = document.querySelector(T.sel); if (!el) return ende();
    el.scrollIntoView({ block: "center" });
    const r = el.getBoundingClientRect(), pad = 6, unten = r.top + r.height / 2 < innerHeight / 2;
    ov.innerHTML = `<div class="sm-tour-loch" style="left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + 2 * pad}px;height:${r.height + 2 * pad}px"></div>
      <div class="sm-tour-bl" style="${unten ? `top:${r.bottom + 16}px` : `bottom:${innerHeight - r.top + 16}px`}"><small>${k + 1} / ${SM_TOUR.length}</small><b>${T.t}</b><p>${T.x}</p>
      <div class="sm-tour-kn"><button class="btn ghost mini" data-t="weg">Überspringen</button><button class="btn primary mini" data-t="vor">${k < SM_TOUR.length - 1 ? "Weiter" : "Los geht’s"}</button></div></div>`;
    ov.querySelector('[data-t="weg"]').onclick = () => { SFX.tap(); ende(); };
    ov.querySelector('[data-t="vor"]').onclick = () => { SFX.tap(); if (++k >= SM_TOUR.length) { ende(); scrollTo({ top: 0, behavior: "smooth" }); } else zeigen(); };
  }
  addEventListener("resize", zeigen); zeigen();
}

/* ---------- Jahresrückblick ---------- */
/* Sichtbar vom 26.12. bis 6.1. (Datum zum Testen mit ?edDatum=… auf localhost); in der Beta immer zum Ausprobieren */
function rbJahr() {
  const t = edTag(), d = datumVon(t), y = d.getFullYear();
  if (t >= dayNum(`${y}-12-26`)) return y; if (t <= dayNum(`${y}-1-6`)) return y - 1; return 0;
}
const rbSichtbar = () => rbJahr() || (typeof BETA !== "undefined" && BETA ? datumVon(edTag()).getFullYear() : 0);
function rbDaten() {
  const q = (S.xq && S.xq.q) || {}, ber = {};
  Object.entries(q).forEach(([k, v]) => { const b = { vers: "Lernen", lektion: "Lernen", spickzettel: "Lernen", luecke: "Solo", blitz: "Solo", kette: "Solo", bib: "Biblionär", duell: "Arena", duelleigen: "Arena" }[k]; if (b) ber[b] = (ber[b] || 0) + (+v || 0); });
  const summe = Object.values(ber).reduce((a, b) => a + b, 0) || 1, liste = Object.entries(ber).sort((a, b) => b[1] - a[1]);
  const buecher = GROUPS.reduce((a, g, gi) => a + (S.stars[gi] ? g.books.length : 0), 0);
  const vk = VERS_DES_TAGES[hash("rb|" + (S.pid || S.lbName || "x")) % VERS_DES_TAGES.length];
  return { jahr: rbSichtbar(), right: S.right | 0, xp: Math.round(S.xp), level: levelOf(S.xp), serie: S.bestStreak | 0, buecher, ber: liste.map(([k, v]) => [k, Math.round(v / summe * 100)]), lieb: liste.length ? liste[0][0] : "",
    kette: S.bestChain | 0, blitz: S.bestBlitz | 0, bib: S.bibRekord | 0, siege: S.duSiege | 0, duelle: S.duSpiele | 0, vers: VERSE[vk] || ["Dein Wort ist meines Fußes Leuchte und ein Licht auf meinem Weg.", "Psalm 119,105"], album: smGefunden(), gold: smGold() };
}
const RB_FARBE = { Lernen: "#7fc8ff", Solo: "#c49bff", Biblionär: "#7be04a", Arena: "#ff8a5c" };
let rbSeite = 0, rbFormat = "status", rbGemeinde = null;
VIEWS.rueckblick = () => {
  const D = rbDaten(), m = smInit();
  if (!D.jahr) { go("home"); return; }
  if (rbGemeinde === null && window.LB && LB.alleSpieler) { rbGemeinde = 0; LB.alleSpieler().then(l => { rbGemeinde = (l || []).reduce((a, r) => a + (+r.xp || 0), 0); if (current === "rueckblick" && rbSeite === 6) VIEWS.rueckblick(); }).catch(() => {}); }
  const name = S.lbName || "du";
  const ring = D.ber.length ? `conic-gradient(${D.ber.reduce((a, [k, p], i) => { const s = a.s, e = s + p; a.t.push(`${RB_FARBE[k] || "#888"} ${s}% ${e}%`); a.s = e; return a; }, { s: 0, t: [] }).t.join(",")})` : "#2a3266";
  const seiten = [
    `<div class="rb-k rb-intro"><span class="rb-ic">${SM_ALBUM_SVG}</span><small>Bibelbuch-Quest</small><h2>Dein Bibeljahr ${D.jahr}</h2><p>Schön, dass du dabei warst, ${esc(name)}!<br>Tippe, um dein Jahr anzusehen.</p></div>`,
    `<div class="rb-k"><small>In Zahlen</small><div class="rb-zahlen"><span><b>${pkt(D.right)}</b>richtige Antworten</span><span><b>${pkt(D.xp)}</b>XP gesammelt</span><span><b>${D.level}</b>Level erreicht</span><span><b>${D.buecher}</b>von 66 Büchern gelernt</span></div></div>`,
    `<div class="rb-k"><small>Treue</small><div class="rb-gross"><b>${D.serie}</b><span>${D.serie === 1 ? "Tag" : "Tage"} in Folge</span></div><p>So lange war deine längste Serie. Dranbleiben lohnt sich – auch ${D.jahr + 1}!</p></div>`,
    `<div class="rb-k"><small>Dein Lieblingsbereich</small><div class="rb-ringw"><div class="rb-ring" style="background:${ring}"></div><span>${esc(D.lieb || "–")}</span></div><div class="rb-leg">${D.ber.map(([k, p]) => `<span style="--c:${RB_FARBE[k] || "#888"}"><i></i>${esc(k)} ${p} %</span>`).join("")}</div></div>`,
    `<div class="rb-k"><small>Deine Rekorde</small><div class="rb-zahlen"><span><b>${D.kette}</b>Bücher in der Kette</span><span><b>${D.blitz}</b>Blitz-Rekord</span><span><b>${pkt(D.bib)}</b>Biblionär-Punkte</span><span><b>${D.siege}</b>Duell-Siege von ${D.duelle}</span></div></div>`,
    `<div class="rb-k"><small>Sammelalbum</small><div class="rb-gross"><b>${D.album}</b><span>von 66 Karten</span></div><p>${D.gold} Manna liegen bereit – ${D.gold >= SM_KRUG_PREIS ? "genug für einen Krug!" : "spiel ein paar Runden für den nächsten Krug."}</p></div>`,
    `<div class="rb-k"><small>Gemeinsam</small><div class="rb-gross"><b>${rbGemeinde ? pkt(rbGemeinde) : "…"}</b><span>XP haben alle zusammen gesammelt</span></div><p>Danke, dass du Teil davon bist!</p></div>`,
    `<div class="rb-k rb-vers"><small>Dein Vers für ${D.jahr + 1}</small><blockquote>${esc(D.vers[0])}</blockquote><cite>${esc(D.vers[1])}</cite></div>`,
    `<div class="rb-k rb-teil"><small>Teilen</small><h3>Zeig deinen Freunden dein Bibeljahr</h3>
      <div class="rb-vorschau" id="rbVorschau"><span class="muted small">Bild wird erstellt …</span></div>
      <p class="rb-link small">Mit dem Bild wird dieser Link geteilt:<br><b>${esc(smLink())}</b></p>
      <button class="btn primary" id="rbTeilen">${svg("share") || ""} Teilen${m.rb.g === D.jahr ? "" : " · +5 Manna"}</button></div>`
  ];
  rbSeite = Math.max(0, Math.min(seiten.length - 1, rbSeite));
  screen.innerHTML = `<div class="rb"><div class="rb-balken">${seiten.map((_, k) => `<i class="${k <= rbSeite ? "an" : ""}"></i>`).join("")}</div>
    <button class="rb-zu" data-go="home" aria-label="Rückblick schließen">${svg("nein")}</button>
    <div class="rb-buehne" id="rbBuehne">${seiten[rbSeite]}</div>
    <div class="rb-nav"><button class="btn" id="rbZur" ${rbSeite ? "" : "hidden"}>Zurück</button><button class="btn primary" id="rbWeiter" ${rbSeite < seiten.length - 1 ? "" : "hidden"}>Weiter</button></div></div>`;
  wireGo();
  const weiter = d => { const n = rbSeite + d; if (n < 0 || n >= seiten.length) return; rbSeite = n; SFX.tap(); VIEWS.rueckblick(); };
  $("rbWeiter").onclick = () => weiter(1); $("rbZur").onclick = () => weiter(-1);
  $("rbBuehne").onclick = e => { if (e.target.closest("button,input,label")) return; weiter(1); };
  let x0 = null; $("rbBuehne").ontouchstart = e => { x0 = e.touches[0].clientX; }; $("rbBuehne").ontouchend = e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) weiter(dx < 0 ? 1 : -1); x0 = null; };
  if (rbSeite === seiten.length - 1) rbTeilenSeite(D);
};
async function rbBild(D, format) {
  const name = S.lbName || ""; /* 9.86: Name immer aufs Bild */
  return smZeichnen(format, `Mein Bibeljahr ${D.jahr}`, name ? `${name} · Bibelbuch-Quest` : "Bibelbuch-Quest", async (cx, W, y0, y1, q) => {
    const z = [[pkt(D.right), "richtige Antworten"], [D.serie + " Tage", "längste Serie"], [D.buecher + " / 66", "Bücher gelernt"], [D.album + " / 66", "Album-Karten"]];
    const bw = (W - 140 - 30) / 2, bh = q ? 170 : 230;
    z.forEach(([w, t], k) => { const x = 70 + (k % 2) * (bw + 30), y = y0 + Math.floor(k / 2) * (bh + 30);
      cx.fillStyle = "#1b2252"; smRund(cx, x, y, bw, bh, 32); cx.fill(); cx.strokeStyle = "#f2c14e55"; cx.lineWidth = 3; cx.stroke();
      cx.textAlign = "center"; cx.fillStyle = "#ffffff"; cx.font = `900 ${q ? 72 : 96}px Lexend, sans-serif`; cx.fillText(w, x + bw / 2, y + bh * .52);
      cx.fillStyle = "#f2c14e"; cx.font = `700 ${q ? 32 : 38}px Lexend, sans-serif`; cx.fillText(t, x + bw / 2, y + bh * .52 + (q ? 52 : 66)); });
    let y = y0 + 2 * (bh + 30) + (q ? 10 : 40);
    if (!q) {
      if (D.lieb) { cx.textAlign = "left"; cx.fillStyle = "#c9d1ff"; cx.font = "700 40px Lexend, sans-serif"; cx.fillText("Lieblingsbereich: " + D.lieb, 70, y + 40); let x = 70;
        D.ber.forEach(([k, p]) => { const w = (W - 140) * p / 100; cx.fillStyle = RB_FARBE[k] || "#888"; cx.fillRect(x, y + 70, Math.max(0, w - 4), 28); x += w; }); y += 150; }
      cx.textAlign = "left"; cx.fillStyle = "#fff8e0"; cx.font = "italic 600 46px 'Source Serif 4', Georgia, serif"; const n = smUmbruch(cx, "„" + D.vers[0] + "“", 70, y + 50, W - 140, 62);
      cx.fillStyle = "#f2c14e"; cx.font = "700 36px Lexend, sans-serif"; cx.fillText(D.vers[1], 70, y + 50 + n * 62 + 10);
    }
  });
}
async function rbTeilenSeite(D) {
  const m = smInit();
  const cv = await rbBild(D, rbFormat); if (current !== "rueckblick") return;
  const v = $("rbVorschau"); if (v) { v.innerHTML = ""; cv.className = "rb-bild " + rbFormat; v.appendChild(cv); }
  $("rbTeilen").onclick = async () => { SFX.tap();
    const ok = await smTeilen(cv, `mein-bibeljahr-${D.jahr}.png`, `Mein Bibeljahr ${D.jahr} mit Bibelbuch-Quest: ${pkt(D.right)} richtige Antworten und schon ${D.buecher} von 66 Bibelbüchern gelernt! Lern mit und spiel gegen mich! 👇`);
    if (ok && m.rb.g !== D.jahr) { m.rb.g = D.jahr; save(); const x = smGoldGeben(5); if (x) toast(`Danke fürs Teilen! +${x} Manna`); } };
}
/* Start: Banner und einmaliges Fenster */
(function rbStart() {
  const alt = VIEWS.home;
  VIEWS.home = function (a) {
    alt(a);
    smAnkuendigen();
    const jahr = rbSichtbar(); if (!jahr || !S.lbName) return;
    const kopf = screen.querySelector(".start-aufg");
    const b = document.createElement("button"); b.className = "rb-banner"; b.innerHTML = `<span class="rb-banner-ic">${SM_ALBUM_SVG}</span><span><b>Dein Bibeljahr ${jahr}</b><small>Rückblick ansehen und teilen</small></span><i>›</i>`;
    b.onclick = () => { SFX.tap(); rbSeite = 0; go("rueckblick"); };
    if (kopf) kopf.insertAdjacentElement("afterend", b); else screen.prepend(b);
    const m = smInit();
    if (rbJahr() && m.rb.f !== jahr) setTimeout(() => {
      if (current !== "home" || document.querySelector(".modal") || m.rb.f === jahr) return;
      m.rb.f = jahr; save();
      modal(`<div class="rb-fenster"><span class="rb-ic">${SM_ALBUM_SVG}</span><h2>Dein Bibeljahr ${jahr}</h2><p>Sieh dir an, was du dieses Jahr in Bibelbuch-Quest geschafft hast – und teile es mit deinen Freunden.</p>
        <button class="btn primary" data-close="los">Rückblick ansehen</button><button class="btn ghost" data-close="">Später</button></div>`, w => { if (w === "los") { rbSeite = 0; go("rueckblick"); } }).dataset.frei = "1";
    }, 1200);
  };
  const altP = VIEWS.profil;
  if (altP) VIEWS.profil = function (a) { altP(a); const j = rbSichtbar(); if (!j) return; /* 10.3: Album steht im Profil-Reiter „Album“ */ const b = document.createElement("button"); b.className = "btn"; b.style.marginTop = "10px"; b.innerHTML = `${SM_ALBUM_SVG} ${j ? "Dein Bibeljahr " + j : "Sammelalbum"}`; b.onclick = () => { SFX.tap(); rbSeite = 0; go(j ? "rueckblick" : "album"); }; screen.appendChild(b); };
})();

/* ---------- 10.12: Preis „Biblionär der Woche“ – Gratiskrug zeigen und feierlich übergeben ---------- */
const bwPreisAn = () => typeof smFrei === "function" && smFrei();
/* klein: Marke im Biblionär-Reiter / auf dem Podest; gross: Kasten im Start-Fenster der Wochenrunde */
function bwPreisHtml(art) {
  if (!bwPreisAn()) return "";
  if (art === "marke") return `<span class="bw-marke" title="Preis für Platz 1: ein Gratiskrug">${SM_KRUG_SVG}<small>Preis</small></span>`;
  if (art === "band") return `<span class="bw-band">${SM_KRUG_SVG}Preis: Gratiskrug</span>`;
  return `<div class="bw-preis"><div class="bw-preis-krug">${SM_KRUG_GROSS}<i class="bw-st s1"></i><i class="bw-st s2"></i><i class="bw-st s3"></i></div>
    <div class="bw-preis-tx"><span>Preis der Woche</span><b>1 Gratiskrug</b><small>${SM_KRUG_KARTEN} Karten · doppelte Chance auf Silber und Gold – für Platz 1</small></div></div>`;
}
/* Übergabe: Vollbild mit Strahlen, Krone, einfliegendem Krug und Band „Dein Preis“. vorschau = Testlabor (kein Preis) */
function bibPreisUebergabe(vw, punkte, vorschau, versuch) {
  if (document.querySelector(".bwp")) return;
  if ((document.querySelector(".modal") || document.querySelector(".sm-ov")) && (versuch | 0) < 40) { setTimeout(() => bibPreisUebergabe(vw, punkte, vorschau, (versuch | 0) + 1), 1500); return; }
  const rm = smRm(), kw = String(vw || weekKey()).split("-W")[1], ov = document.createElement("div");
  const kannAuf = !vorschau && smGeschenkBereit();
  ov.className = "bwp" + (rm ? " ruhig" : ""); ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Biblionär der Woche – dein Preis");
  ov.innerHTML = `<div class="bwp-strahlen"></div><div class="bwp-in">
    <div class="bwp-krone">${svg("crown")}</div>
    <div class="bwp-t">Biblionär der Woche</div>
    <div class="bwp-sub">Platz 1 in der ${esc(kw)}. KW${punkte ? ` · ${pkt(punkte)} Punkte` : ""}</div>
    <div class="bwp-buehne"><div class="bwp-halo"></div><div class="bwp-krug">${SM_KRUG_GROSS}</div>
      ${[1, 2, 3, 4, 5, 6].map(i => `<i class="bw-st s${i}"></i>`).join("")}<div class="bwp-band"><span>Dein Preis</span></div></div>
    <div class="bwp-tx"><b>Ein Gratiskrug für dich!</b><span>${SM_KRUG_KARTEN} Karten für dein Sammelalbum – mit doppelter Chance auf Silber und Gold. Herzlichen Glückwunsch – die ganze Gemeinde sieht dich auf dem Podest.</span></div>
    <div class="bwp-kn">${kannAuf ? `<button class="btn primary" data-bwp="auf">${SM_KRUG_SVG} Krug jetzt öffnen</button>` : ""}<button class="btn ${kannAuf ? "ghost" : "primary"}" data-bwp="zu">${kannAuf ? "Später öffnen" : vorschau ? "Schließen (Vorschau)" : "Danke!"}</button></div>
  </div>`;
  document.body.appendChild(ov);
  try { SFX.badge(); } catch (e) {}
  setTimeout(() => { try { SFX.win(); if (!rm) rain(110); } catch (e) {} }, rm ? 0 : 1250);
  const zu = was => { ov.classList.add("weg"); setTimeout(() => ov.remove(), 350);
    if (was === "auf") { const o = smKrugKaufen("geschenk"); if (o) setTimeout(() => smKrugBuehne(o, false), 380); }
    else if (!vorschau) setTimeout(() => { try { toast(`${SM_KRUG_SVG}<div><b>Dein Gratiskrug wartet</b><div class="small muted">Öffne ihn im Sammelalbum</div></div>`); } catch (e) {} }, 400); };
  ov.querySelectorAll("[data-bwp]").forEach(b => b.onclick = () => { SFX.tap(); zu(b.dataset.bwp); });
}
