/* Bibelbuch-Quest – 9.84/9.85: Sammelalbum (Goldstaub, Krüge, Tauschbeutel) und Jahresrückblick.
   Lädt nach spiel.js. Alles liegt im Spielstand unter S.sm (keine Datenbank-Änderung):
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

/* ---------- Regeln ---------- */
const SM_KRUG_PREIS = 10, SM_KRUG_KARTEN = 5, SM_KRUG_TAG = 3;
const SM_TAUSCH = { 1: 3, 2: 4, 3: 5 };                      /* 3 Bronze → Silber, 4 Silber → Gold, 5 Gold → Glanz */
const SM_W = { 1: 0.60, 2: 0.28, 3: 0.10, 4: 0.02 };         /* Seltenheit je Karte */
const SM_STUFE = ["Grau", "Bronze", "Silber", "Gold", "Glanz"];
const SM_RC = { 1: "#d58b4f", 2: "#bfe3ff", 3: "#f2c14e", 4: "#ff9ee8" };
const SM_GC = { geschichte: "#f0b85a", lehre: "#7fc8ff", prophetie: "#c49bff" };
const SM_GRUPPEN_LOHN = { 1: 10, 2: 25, 3: 50, 4: 100 };   /* Talente, wenn eine Lektionsgruppe komplett ist */
const SM_SPIEL_Q = ["vers", "lektion", "luecke", "blitz", "kette", "duell", "duelleigen", "bib"];
const smGc = i => SM_GC[gattungVon(i)] || "#f0b85a";
TAB_VON.album = ""; TAB_VON.rueckblick = "";

function smInit() {
  if (!S.sm || typeof S.sm !== "object") S.sm = {};
  const m = S.sm;
  if (!Array.isArray(m.album) || m.album.length !== 66) m.album = Array(66).fill(0);
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
const SM_TRUHEN_GESCHENK = 7; /* jede 7. Schatztruhe (insgesamt) = ein Geschenk-Krug */
const smGeschenkeGesamt = () => 1 + Math.floor(smInit().tz / SM_TRUHEN_GESCHENK); /* 1 = Startkrug für alle */
const smGeschenke = () => { const m = smInit(); return Math.max(0, smGeschenkeGesamt() - m.kga); };
const smHeuteKruege = () => { const m = smInit(); return m.kt === today() ? m.kn : 0; };
const smGefunden = () => smInit().album.filter(s => s > 0).length;
const smGlanz = () => smInit().album.filter(s => s === 4).length;

/* Zwei Geräte zusammenführen: je Wert das Maximum (verdient und ausgegeben getrennt, damit nichts doppelt zählt) */
function smMischen(r) {
  if (!r || !r.sm || typeof r.sm !== "object") return;
  const m = smInit(), o = r.sm;
  if (Array.isArray(o.album)) o.album.forEach((s, i) => { if (i < 66) m.album[i] = Math.max(m.album[i] | 0, Math.min(4, s | 0)); });
  ["gv", "ga", "kz", "kga", "tz", "ah", "tour"].forEach(k => { m[k] = Math.max(m[k] | 0, +o[k] || 0); });
  [["gt", "gn"], ["kt", "kn"]].forEach(([t, n]) => { if ((o[t] || "") > m[t]) { m[t] = o[t]; m[n] = +o[n] || 0; } else if (o[t] === m[t]) m[n] = Math.max(m[n], +o[n] || 0); });
  ["be", "ba"].forEach(k => { [1, 2, 3].forEach(x => { m[k][x] = Math.max(m[k][x] | 0, ((o[k] || {})[x]) | 0); }); });
  m.lohn = [...new Set([...m.lohn, ...(Array.isArray(o.lohn) ? o.lohn : [])])];
  if (o.rb) Object.keys(o.rb).forEach(k => { if (m.rb[k] === undefined) m.rb[k] = o.rb[k]; });
}

/* ---------- Goldstaub ---------- */
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
  const m = smInit(); let g = 0; info = info || {};
  if (SM_SPIEL_Q.includes(quelle)) {
    const dauer = info.t0 ? Date.now() - info.t0 : 60000;
    if (dauer >= 30000) { g = 1; if (info.fm && info.f / info.fm >= 0.8) g++; if (quelle === "bib" && /^Wochenrunde/.test(info.d || "")) g += 2; }
  }
  if (quelle === "tagesbonus" && /Schatztruhe/.test(info.d || "")) {
    g += 4;
    m.tz++;
    if (m.tz % SM_TRUHEN_GESCHENK === 0) smGeschenk(SM_TRUHEN_GESCHENK + " Schatztruhen gesammelt");
  }
  if (nachher > vorher) g += 3 * (nachher - vorher);
  if (g) smGoldGeben(g);
}
/* ---------- Kopfleiste: Goldstaub + Album-Symbol ---------- */
const SM_GOLD_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l1.9 5.2 5.4.4-4.2 3.4 1.4 5.3L12 14.9l-4.5 2.9 1.4-5.3-4.2-3.4 5.4-.4z" fill="#ffe27a" stroke="#8a5d10" stroke-width="1.1" stroke-linejoin="round"/><circle cx="19" cy="5" r="1.4" fill="#fff3b8"/><circle cx="5" cy="19" r="1.1" fill="#fff3b8"/><circle cx="20" cy="17" r=".9" fill="#ffe27a"/></svg>`;
const SM_ALBUM_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 6c3-1.6 6.4-1.6 9.5.4v13c-3.1-2-6.5-2-9.5-.4z" fill="#d58b4f" stroke="#1b2a55" stroke-width="1.3" stroke-linejoin="round"/><path d="M21.5 6c-3-1.6-6.4-1.6-9.5.4v13c3.1-2 6.5-2 9.5-.4z" fill="#f2c14e" stroke="#1b2a55" stroke-width="1.3" stroke-linejoin="round"/><rect x="4.6" y="8.5" width="4.6" height="6" rx=".8" fill="#bfe3ff" stroke="#1b2a55" stroke-width=".9"/><rect x="14.8" y="8.5" width="4.6" height="6" rx=".8" fill="#ff9ee8" stroke="#1b2a55" stroke-width=".9"/></svg>`;
const SM_KRUG_SVG = `<svg class="sm-kr-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 4h7l.6 2.5c3 1.8 4.4 5 4 9-.4 4-3 6.3-8.1 6.5-5.1-.2-7.7-2.5-8.1-6.5-.4-4 1-7.2 4-9z" fill="#c88a52" stroke="#2a160a" stroke-width="1.3" stroke-linejoin="round"/><rect x="7.6" y="2" width="8.8" height="3" rx="1" fill="#8a5a30" stroke="#2a160a" stroke-width="1.1"/><path d="M6.5 11.5c3.5 1 7.5 1 11 0" fill="none" stroke="#5e3216" stroke-width="1.1"/></svg>`;
function smHud(neu) {
  const b = $("hGoldBtn"); if (!b) return;
  $("hGold").textContent = smGold();
  const kann = smHeuteKruege() < SM_KRUG_TAG && (smGold() >= SM_KRUG_PREIS || smGeschenke() > 0);
  const p = $("tbKrug"); if (p) p.hidden = !kann;
  if (neu > 0) { b.classList.remove("sm-plus"); void b.offsetWidth; b.classList.add("sm-plus"); try { const r = b.getBoundingClientRect(); floatText("+" + neu + " ✦", r.left + r.width / 2, r.top + r.height + 18); } catch (e) {} }
}
/* Passt der Name nicht mehr neben die beiden Währungen, werden Laden- und Album-Symbol ausgeblendet (die Anzeigen bleiben antippbar).
   hudNameAnpassen (spiel.js) wird dafür umhüllt – so greift es auch, wenn die Schrift später nachlädt. */
const smNameOrig = hudNameAnpassen;
hudNameAnpassen = function () {
  const hud = document.querySelector(".hud"), t = $("hTitle");
  if (!hud || !t || !t.clientWidth) return smNameOrig();
  hud.classList.remove("eng"); smNameOrig();
  if (t.classList.contains("zwei") || t.scrollWidth > t.clientWidth || parseFloat(getComputedStyle(t).fontSize) < 17) { hud.classList.add("eng"); smNameOrig(); }
};
const smHudPlatz = () => hudNameAnpassen();
addEventListener("resize", () => { try { smHudPlatz(); } catch (e) {} });
try { document.fonts.ready.then(() => { try { smHudPlatz(); } catch (e) {} }); document.fonts.addEventListener("loadingdone", () => { try { smHudPlatz(); } catch (e) {} }); } catch (e) {}
[1500, 4000].forEach(ms => setTimeout(() => { try { smHudPlatz(); } catch (e) {} }, ms));
(function smHudBauen() {
  const tal = $("hTalBtn"); if (!tal || $("hGoldBtn")) return;
  const b = document.createElement("button"); b.className = "pill hud-gold"; b.id = "hGoldBtn"; b.setAttribute("aria-label", "Goldstaub – zum Sammelalbum");
  b.innerHTML = `${SM_GOLD_SVG}<span id="hGold">0</span><span class="hud-album" aria-hidden="true">${SM_ALBUM_SVG}</span><span class="tb-punkt" id="tbKrug" hidden aria-label="Ein Krug kann geöffnet werden"></span>`;
  tal.insertAdjacentElement("afterend", b);
  b.onclick = () => { SFX.tap(); go("album"); };
  smHud(0); setTimeout(() => { try { smHudPlatz(); } catch (e) {} }, 300);
})();

/* ---------- Krug ziehen: nie doppelt, fehlende zuerst ----------
   1. Seltenheit würfeln (Garantie: mind. 1 Silber, jeder 4. Krug Gold – mit der letzten Karte).
   2. Gibt es Bücher unter dieser Stufe, wird eines aufgewertet (bevorzugt genau eine Stufe darunter → fehlende Bronze zuerst).
   3. Sonst eine doppelte Karte dieser Stufe → Tauschbeutel. 4. Jedes Buch höchstens einmal pro Krug. */
function smWuerfeln(min) { const o = []; let t = 0; for (let r = Math.max(1, min); r <= 4; r++) { o.push(r); t += SM_W[r]; } let x = Math.random() * t; for (const r of o) { x -= SM_W[r]; if (x <= 0) return r; } return o[o.length - 1]; }
function smZiehen(album, nr) {
  const res = [], used = {}, min = nr % 4 === 0 ? 3 : 2, z = l => l[Math.floor(Math.random() * l.length)];
  for (let k = 0; k < SM_KRUG_KARTEN; k++) {
    if (album.every(s => s === 4)) break;
    const r = (k === SM_KRUG_KARTEN - 1 && !res.some(c => c.s >= min)) ? smWuerfeln(min) : smWuerfeln(1);
    const idx = album.map((s, i) => i).filter(i => !used[i]), frei = idx.filter(i => album[i] < r);
    if (frei.length) { const g = frei.filter(i => album[i] === r - 1), i = z(g.length ? g : frei); used[i] = 1; res.push({ i, s: r, v: album[i] }); album[i] = r; }
    else { const d = idx.filter(i => album[i] >= r); if (!d.length) continue; const i = z(d); used[i] = 1; res.push({ i, s: r, v: album[i], d: 1 }); }
  }
  return res.sort((a, b) => a.s - b.s || (b.d | 0) - (a.d | 0));
}
function smKrugMoeglich() { const m = smInit(); if (m.album.every(s => s === 4)) return "fertig"; if (smHeuteKruege() >= SM_KRUG_TAG) return "tag"; if (smGeschenke() > 0) return "geschenk"; if (smGold() >= SM_KRUG_PREIS) return "gold"; return "arm"; }
function smKrugKaufen() {
  const art = smKrugMoeglich(); if (art !== "geschenk" && art !== "gold") return null;
  const m = smInit(), t = today();
  if (art === "geschenk") m.kga++; else m.ga += SM_KRUG_PREIS;
  if (m.kt !== t) { m.kt = t; m.kn = 0; } m.kn++; m.kz++;
  const vor = m.album.slice(), zug = smZiehen(m.album, m.kz);
  zug.forEach(c => { if (c.d) m.be[c.s] = (m.be[c.s] | 0) + 1; });
  m.offen = { z: zug, vor, nr: m.kz, art }; /* Ergebnis wird VOR der Animation gespeichert – Schließen der App würfelt nichts neu */
  save(); smHud(0); lbSync();
  return m.offen;
}

/* ---------- Gruppen komplett → Talente (einmal je Gruppe und Stufe) ---------- */
function smGruppenPruefen() {
  const m = smInit(), neu = [];
  GROUPS.forEach((g, gi) => {
    const idx = ALL.map((b, i) => b.gi === gi ? i : -1).filter(i => i >= 0), minS = Math.min(...idx.map(i => m.album[i]));
    for (let s = 1; s <= minS; s++) { const key = gi + "-" + s; if (!m.lohn.includes(key)) { m.lohn.push(key); neu.push({ gi, s }); addTal(SM_GRUPPEN_LOHN[s]); } }
  });
  if (neu.length) save();
  return neu;
}

/* ---------- Karten-HTML ---------- */
const SM_BUCH = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4.5C6.5 3.6 9.5 3.6 12 5c2.5-1.4 5.5-1.4 8-.5V19c-2.5-.9-5.5-.9-8 .5-2.5-1.4-5.5-1.4-8-.5z" fill="#fff8e0" stroke="#1b2a55" stroke-width="1.3" stroke-linejoin="round"/><path d="M12 5v14.5" stroke="#1b2a55" stroke-width="1.3"/></svg>`;
function smKarteHtml(i, s, extra) {
  const b = ALL[i], lang = b.b.length > 9 ? " lang" : "";
  if (!s) return `<span class="smk grau" data-i="${i}"><span class="smk-in"><span class="smk-fr">?</span><span class="smk-nm${lang}">${esc(b.b)}</span></span></span>`;
  return `<span class="smk" data-i="${i}" data-s="${s}" style="--rc:${SM_RC[s]};--gc:${smGc(i)}"><span class="smk-in"><span class="smk-band">${SM_BUCH}</span>${extra || ""}<span class="smk-nm${lang}">${esc(b.b)}</span><span class="smk-gr">${esc(GROUPS[b.gi].name)}</span><span class="smk-st">${SM_STUFE[s]}</span></span></span>`;
}

/* ---------- Ansicht: Sammelalbum ---------- */
let smWahl = 0; /* Tauschen: Stufe, deren Karte gerade gewählt wird */
const SM_SACK = `<svg class="sack" viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="60" rx="19" ry="3" fill="#0006"/><path class="sk-k" d="M21 24C9 31 7 54 18 58.5h28C57 54 55 31 43 24z"/><path d="M17 33c-2 7-1 15 3 20" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".35"/><path class="sk-k2" d="M21 24l-4-9c5 2 9 3 15 3s10-1 15-3l-4 9c-7 3-15 3-22 0z"/><path d="M19.5 22.5c8 3.6 17 3.6 25 0" fill="none" stroke="#3a2410" stroke-width="3" stroke-linecap="round"/><path d="M19.5 22.5c8 3.6 17 3.6 25 0" fill="none" stroke="#e8c27a" stroke-width="1.4" stroke-linecap="round"/><path d="M33 25.5c3 4 6 6 9 6M33 25.5c-1 4-3 7-6 8" fill="none" stroke="#e8c27a" stroke-width="1.6" stroke-linecap="round"/><circle cx="33" cy="25.5" r="2.2" fill="#e8c27a" stroke="#3a2410" stroke-width="1"/><path class="sk-m" d="M32 37l2.6 5.3 5.8.8-4.2 4.1 1 5.8L32 50.3 26.8 53l1-5.8-4.2-4.1 5.8-.8z"/></svg>`;
function smBeutelHtml() {
  return `<div class="sm-beutel">${[1, 2, 3].map(r => { const n = smBeutel(r), voll = n >= SM_TAUSCH[r];
    return `<button class="sm-bz${voll ? " voll" : ""}" data-tausch="${r}" style="--c:${SM_RC[r]}" aria-label="${SM_STUFE[r]}-Säckchen: ${n} von ${SM_TAUSCH[r]}${voll ? " – tauschen" : ""}">${SM_SACK}<span class="pk">${Array.from({ length: SM_TAUSCH[r] }, (_, k) => `<i class="${k < n ? "an" : ""}"></i>`).join("")}</span><span class="sm-bz-t"><b>${n}</b> ${SM_STUFE[r]}</span><small>${SM_TAUSCH[r]} → 1 ${SM_STUFE[r + 1]}</small></button>`; }).join("")}</div>`;
}
VIEWS.album = () => {
  const m = smInit();
  if (m.offen) { smKrugBuehne(m.offen, true); }
  const art = smKrugMoeglich(), gold = smGold(), heute = smHeuteKruege(), bisGold = 4 - (m.kz % 4); /* der nächste Krug hat die Nummer kz+1; jeder 4. ist sicher Gold */
  const nochT = SM_TRUHEN_GESCHENK - (m.tz % SM_TRUHEN_GESCHENK);
  const truhe = `Schatztruhen: noch <b>${nochT}</b> bis zum nächsten Geschenk-Krug`;
  const treue = bisGold === 1 ? "Treue-Siegel: der nächste Krug hat <b>sicher eine Goldkarte</b>" : `Treue-Siegel: noch <b>${bisGold}</b> Krüge bis zur sicheren Goldkarte`;
  const knopf = art === "fertig" ? `<p class="sm-hinw">Alle 66 Karten in Glanz – dein Album ist vollendet!</p>`
    : `<button class="sm-krug-kn${art === "gold" || art === "geschenk" ? "" : " aus"}" id="smKrugKn">${SM_KRUG_SVG}<span><b>${art === "geschenk" ? "Geschenk-Krug öffnen" : "Krug öffnen"}</b><small>${art === "geschenk" ? `${smGeschenke()} ${smGeschenke() === 1 ? "Geschenk" : "Geschenke"} bereit` : art === "tag" ? "Heute schon 3 Krüge – morgen wieder" : art === "arm" ? `Noch ${SM_KRUG_PREIS - gold} Goldstaub – spiel eine Runde!` : `5 Karten · ${SM_KRUG_PREIS} Goldstaub`}</small></span>${art === "gold" ? `<i class="sm-preis">${SM_GOLD_SVG}${SM_KRUG_PREIS}</i>` : ""}</button>`;
  const gruppen = GROUPS.map((g, gi) => { const idx = ALL.map((b, i) => b.gi === gi ? i : -1).filter(i => i >= 0), n = idx.filter(i => m.album[i] > 0).length;
    return `<section class="sm-gruppe"><div class="sm-gk"><b>${esc(g.name)}</b><span>${n} / ${idx.length}</span></div><div class="sm-raster">${idx.map(i => smKarteHtml(i, m.album[i])).join("")}</div></section>`; }).join("");
  screen.innerHTML = `${bereichKopf("home", { ic: "book", t: "Sammelalbum", sub: `${smGefunden()} / 66 gefunden · ${smGlanz()} in Glanz` })}
    <div class="sm-kasse"><span class="sm-gold">${SM_GOLD_SVG}<b>${gold}</b> Goldstaub</span><span class="sm-heute">Krüge heute ${heute}/${SM_KRUG_TAG}</span></div>
    ${knopf}
    <p class="sm-treue">${treue}<br>${truhe}</p>
    <div class="sm-bt"><b>Tauschbeutel</b><span>Doppelte Karten sammeln sich hier</span></div>
    ${smBeutelHtml()}
    <p class="sm-hinw sm-wahl" id="smWahl" hidden></p>
    ${gruppen}
    <div class="sm-fuss"><button class="btn" id="smTeilen">${SM_ALBUM_SVG} Mein Album teilen</button><p class="small muted">Goldstaub gibt es für jede beendete Runde (+1 bei guter Runde), jede Schatztruhe (4), Biblionär der Woche (2) und jeden Level-Aufstieg (3). Ansparen ohne Grenze – öffnen kannst du bis zu ${SM_KRUG_TAG} Krüge am Tag. Jede ${SM_TRUHEN_GESCHENK}. Schatztruhe bringt einen Geschenk-Krug. Seltenheit: Bronze 60 %, Silber 28 %, Gold 10 %, Glanz 2 %.</p></div>`;
  wireGo();
  const kk = $("smKrugKn"); if (kk) kk.onclick = () => { if (kk.classList.contains("aus")) { SFX.tap(); return; } SFX.tap(); const o = smKrugKaufen(); if (o) smKrugBuehne(o, false); };
  screen.querySelectorAll("[data-tausch]").forEach(b => b.onclick = () => smTauschStart(+b.dataset.tausch));
  screen.querySelectorAll(".smk").forEach(k => k.onclick = () => { if (smWahl) return smTauschWahl(+k.dataset.i); smKarteZeigen(+k.dataset.i); });
  $("smTeilen").onclick = () => { SFX.tap(); smTeilenAlbum(); };
  smWahl = 0;
  if (!m.tour && !m.offen) setTimeout(smTour, 450);
};
function smKarteZeigen(i) {
  const m = smInit(), s = m.album[i], T = ALBUM_TEXT[i] || {}, b = ALL[i];
  const info = !s ? `<p class="muted">Noch nicht gefunden – diese Karte steckt in einem der Krüge.</p>`
    : `<dl class="sm-info"><dt>Gruppe</dt><dd>${esc(GROUPS[b.gi].name)} · ${b.t === "AT" ? "Altes" : "Neues"} Testament</dd><dt>Kapitel</dt><dd>${T.k}</dd>
      ${s >= 2 ? `<dt>Worum es geht</dt><dd>${esc(T.t)}</dd><dt>Verfasser</dt><dd>${esc(T.v)}</dd>` : `<dt>Mehr ab Silber</dt><dd class="muted">Kernaussage und Verfasser</dd>`}
      ${s >= 3 ? `<dt>Schlüsselstelle</dt><dd><b>${esc(T.s)}</b> – ${esc(T.z)}</dd>` : `<dt>Ab Gold</dt><dd class="muted">Schlüsselstelle</dd>`}</dl>`;
  modal(`<div class="sm-gross">${smKarteHtml(i, s)}</div>${info}<button class="btn primary" data-close="1">Schließen</button>`).dataset.frei = "1";
}

/* ---------- Tauschen ---------- */
function smTauschStart(r) {
  SFX.tap();
  const n = smBeutel(r), N = SM_TAUSCH[r];
  if (n < N) { toast(`${SM_STUFE[r]}-Säckchen: ${n} von ${N} – noch ${N - n} doppelte ${SM_STUFE[r]}karten bis zum Tausch.`); return; }
  const m = smInit(), wahl = m.album.map((s, i) => s === r ? i : -1).filter(i => i >= 0);
  if (!wahl.length) { /* keine Karte genau dieser Stufe: in das nächste Säckchen */
    m.ba[r] += N; if (r < 3) m.be[r + 1] = (m.be[r + 1] | 0) + 1; save(); toast(`${N} ${SM_STUFE[r]} → 1 ${SM_STUFE[r + 1]} im Säckchen`); go("album"); return;
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
const SM_KRUG_GROSS = `<svg viewBox="0 0 120 150" aria-hidden="true"><defs><linearGradient id="smTon" x1="0" x2="1"><stop offset="0" stop-color="#7a4422"/><stop offset=".35" stop-color="#d99a62"/><stop offset=".6" stop-color="#c07d45"/><stop offset="1" stop-color="#5e3216"/></linearGradient><linearGradient id="smDeckel" x1="0" x2="1"><stop offset="0" stop-color="#6b3a18"/><stop offset=".4" stop-color="#c88a52"/><stop offset="1" stop-color="#5e3216"/></linearGradient><radialGradient id="smGlut"><stop offset="0" stop-color="#fff3b8"/><stop offset=".5" stop-color="#ffd34d88"/><stop offset="1" stop-color="#ffd34d00"/></radialGradient></defs>
  <ellipse class="smj-glut" cx="60" cy="85" rx="62" ry="70" fill="url(#smGlut)"/>
  <path d="M38 30c-12 4-16 10-12 15M82 30c12 4 16 10 12 15" fill="none" stroke="#5e3216" stroke-width="7" stroke-linecap="round"/><path d="M38 30c-12 4-16 10-12 15M82 30c12 4 16 10 12 15" fill="none" stroke="#b97a44" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M42 26h36l3 10c18 10 26 28 24 52-2 30-18 52-45 56-27-4-43-26-45-56-2-24 6-42 24-52z" fill="url(#smTon)" stroke="#2a160a" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M24 70c20 6 52 6 72 0M22 92c22 7 54 7 76 0" fill="none" stroke="#5e3216" stroke-width="2" opacity=".7"/><path d="M30 60c3-10 8-17 14-21" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>
  <rect x="36" y="16" width="48" height="14" rx="5" fill="url(#smDeckel)" stroke="#2a160a" stroke-width="2.5"/><path d="M44 12h32" stroke="#2a160a" stroke-width="2.5" stroke-linecap="round"/><path d="M52 8h16v6H52z" fill="#8a5a30" stroke="#2a160a" stroke-width="2"/>
  <path class="smj-riss" d="M60 40l-4 14 6 8-5 12"/><path class="smj-riss" d="M36 72l10 4 4 10 10 2 6 14M84 66l-8 10 3 10-9 8"/><path class="smj-riss" d="M28 100l14-2 8 10 12-4 10 10 14-6M66 120l-6 10 4 8M46 44l-6 10"/></svg>`;
const smRm = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
function smVibr(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
function smKlang(art) {
  const f = { bruch: () => { tone(220, 0, .5, "sine", .25, 120); [523, 659, 784, 1046].forEach((x, i) => tone(x, .2 + i * .06, .4, "triangle", .08)); }, klopf: () => { tone(140, 0, .16, "sine", .3, 90); tone(900, .02, .04, "square", .04); },
    silber: () => [784, 988, 1175].forEach((x, i) => tone(x, i * .07, .3, "triangle", .1)), gold: () => [523, 659, 784, 1046, 1318].forEach((x, i) => tone(x, i * .08, .5, "triangle", .13)),
    glanz: () => [1046, 1318, 1568, 2093, 2637, 3136].forEach((x, i) => tone(x, i * .06, .5, "sine", .08)), flip: () => { tone(660, 0, .1, "sine", .07); tone(880, .04, .1, "sine", .07); }, plopp: () => { tone(880, 0, .08, "sine", .07); tone(1320, .02, .08, "sine", .07); } };
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
  ov.className = "sm-ov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Krug öffnen");
  ov.innerHTML = `<div class="sm-ov-in"><div class="sm-ov-kopf"><b>${offen.art === "geschenk" ? "Geschenk-Krug" : "Krug"}</b><span>${wieder ? "Dein Krug wartet noch" : offen.nr % 4 === 0 ? "Treue-Siegel: sicher Gold" : "5 Karten"}</span></div>
    <div class="sm-buehne"><div class="sm-kegel"></div><div class="sm-beam"></div><div class="sm-sockel"></div>
      <div class="sm-jar ${rm ? "" : zug.some(c => c.s >= 3) ? "stark" : "wackel"}" role="button" tabindex="0" aria-label="Krug antippen">${SM_KRUG_GROSS}</div>
      <p class="sm-tipp">${rm ? "Tippe auf den Krug" : "Tippe dreimal auf den Krug"}</p>
      <div class="sm-selten"><span style="--c:#d58b4f"><b>60 %</b>Bronze</span><span style="--c:#bfe3ff"><b>28 %</b>Silber</span><span style="--c:#f2c14e"><b>10 %</b>Gold</span><span class="gl"><b>2 %</b>Glanz</span></div>
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
      const up = c.d ? "DOPPELT" : c.v > 0 ? SM_STUFE[c.v] + " → " + SM_STUFE[c.s] : "NEU";
      el.innerHTML = `<div class="sm-strahl"></div><div class="sm-innen"><div class="sm-seite sm-ruecken"><b>66</b></div><div class="sm-seite sm-vorne">${smKarteHtml(c.i, c.s, `<span class="smk-up${c.d ? " dup" : ""}">${up}</span>`)}${c.d ? `<i class="sm-dup">→ Tauschbeutel</i>` : ""}</div></div>`;
      const x = (k - mi) * 68, y = (k - mi) * (k - mi) * 5, rot = (k - mi) * 6;
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
      if (c.s === 4) { smKlang("glanz"); smVibr([40, 30, 40, 30, 120]); staub(x, y, 120, ["#ff8a8a", "#ffd95c", "#5fe0b0", "#7fc8ff", "#c49bff", "#fff"], 6); }
    }, 320);
    if (++offenN === zug.length) setTimeout(alleOffen, 650);
  }
  function alleOffen() {
    phase = "offen"; q('[data-k="alle"]').hidden = true; q('[data-k="fertig"]').hidden = false;
    const neu = zug.filter(c => !c.d).length, d = zug.length - neu;
    q(".sm-zus").textContent = `${neu} neue ${neu === 1 ? "Karte" : "Karten"}${d ? ` · ${d} doppelt` : ""}`;
  }
  q('[data-k="alle"]').onclick = () => { let t = 0; fan.querySelectorAll(".sm-karte").forEach((el, k) => { if (!el.classList.contains("offen")) { setTimeout(() => aufdecken(el, zug[k]), t); t += 260; } }); };
  q('[data-k="fertig"]').onclick = () => {
    const m = smInit(); m.offen = null; save();
    const neu = smGruppenPruefen(); ov.remove(); document.body.classList.remove("spiel-laeuft");
    smNeuBanner(neu); if (current === "album") go("album"); smHud(0);
  };
  const tippen = () => {
    if (phase !== "krug") return;
    if (rm) { phase = "weg"; jar.style.opacity = 0; setTimeout(() => { jar.remove(); karten(); }, 300); return; }
    tipps++; smKlang("klopf"); jar.querySelectorAll(".smj-riss")[Math.min(2, tipps - 1)].classList.add("an"); jar.querySelector(".smj-glut").style.opacity = tipps * .3;
    jar.animate([{ transform: "translateX(-50%) scale(1)" }, { transform: "translateX(-50%) scale(1.07,.93)" }, { transform: "translateX(-50%) scale(1)" }], { duration: 320 });
    const [x, y] = mitte(jar); staub(x, y, 10 * tipps, ["#ffe9a8", "#f2c14e", "#d99a62"], 2.5);
    if (tipps >= 3) { phase = "weg"; setTimeout(zerspringen, 260); }
  };
  jar.onclick = tippen; jar.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tippen(); } };
  function zerspringen() {
    smKlang("bruch"); smVibr(40);
    const [mx, my] = mitte(jar); jar.remove();
    const formen = ["polygon(0 0,100% 20%,70% 100%,10% 80%)", "polygon(20% 0,100% 30%,80% 100%,0 70%)", "polygon(0 20%,80% 0,100% 80%,30% 100%)", "polygon(10% 0,90% 10%,100% 100%,0 90%)"];
    for (let k = 0; k < 9; k++) {
      const s = document.createElement("div"), gr = 18 + Math.random() * 26; s.className = "sm-scherbe";
      Object.assign(s.style, { width: gr + "px", height: gr * (.7 + Math.random() * .6) + "px", left: mx - gr / 2 + "px", top: my - gr / 2 + "px", clipPath: formen[k % 4] });
      buehne.appendChild(s); const w = k / 9 * 6.283 + Math.random() * .5, dist = 120 + Math.random() * 90;
      s.animate([{ transform: "translate(0,0) rotate(0)", opacity: 1 }, { transform: `translate(${Math.cos(w) * dist}px,${Math.sin(w) * dist + 140}px) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 }], { duration: 1200, easing: "cubic-bezier(.2,.6,.4,1)", fill: "forwards" }).onfinish = () => s.remove();
    }
    q(".sm-beam").classList.add("an"); q(".sm-sockel").style.opacity = .35;
    staub(mx, my, 140, ["#fff3b8", "#ffe08a", "#f2c14e", "#ffd34d", "#fff"], 6);
    setTimeout(karten, 650);
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
function smNeuBanner(neu) {
  (neu || []).forEach((x, k) => setTimeout(() => { try { SFX.badge(); toast(`<b>${esc(GROUPS[x.gi].name)} komplett in ${SM_STUFE[x.s]}!</b> +${SM_GRUPPEN_LOHN[x.s]} Talente${x.s === 1 ? " und ein Geschenk-Krug" : ""}`); } catch (e) {} }, 600 + k * 2800));
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
  const cv = await smZeichnen("quadrat", "Mein Sammelalbum", `${smGefunden()} / 66 gefunden · ${smGlanz()} in Glanz`, async (cx, W, y0, y1) => {
    const sp = 11, gap = 10, w = (W - 140 - gap * (sp - 1)) / sp, h = Math.min(w * 1.3, (y1 - y0 - gap * 5) / 6);
    m.album.forEach((s, i) => { const x = 70 + (i % sp) * (w + gap), y = y0 + Math.floor(i / sp) * (h + gap);
      if (s === 4) { const gr = cx.createLinearGradient(x, y, x + w, y + h); ["#ff8a8a", "#ffd95c", "#5fe0b0", "#7fc8ff", "#c49bff"].forEach((c, k) => gr.addColorStop(k / 4, c)); cx.fillStyle = gr; }
      else cx.fillStyle = s ? SM_RC[s] : "#1e2552";
      smRund(cx, x, y, w, h, 8); cx.fill(); cx.fillStyle = smGc(i); cx.fillRect(x + 4, y, w - 8, 6); });
  });
  smTeilen(cv, "mein-sammelalbum.png", `Mein Sammelalbum in Bibelbuch-Quest: ${smGefunden()} von 66 Bibelbüchern gefunden, ${smGlanz()} in Glanz! Sammelst du mit?`);
}

/* ---------- 9.85: Glanz-Karten für die Rangliste ----------
   Eigene kleine Sammlung album/{pid} = { gl, updated } – die Ranglisten-Regel für „spieler“ ist an der Grenze von 1000 Rechenschritten.
   Geschrieben wird nur, wenn sich die Zahl ändert (höchstens 66-mal je Spieler). Der Sammel-Job trägt gl in die Rangliste ein. */
let smGlLaeuft = false;
function smGlanzSenden(L) {
  const m = smInit(), n = smGlanz();
  if (!S.pid || !L || !L.albumSetzen || smGlLaeuft || (m.gls | 0) === n || (!n && !m.gls)) return;
  smGlLaeuft = true;
  L.albumSetzen(S.pid, n).then(() => { m.gls = n; save(); }).catch(() => {}).finally(() => { smGlLaeuft = false; });
}

/* ---------- 9.85: Ankündigung (einmal) und kurze Tour beim ersten Öffnen ---------- */
function smAnkuendigen() {
  const m = smInit(); if (m.ah || !S.lbName) return;
  setTimeout(() => {
    if (current !== "home" || document.querySelector(".modal, .sm-ov, .sm-tour") || m.ah) return;
    m.ah = 1; save();
    const karten = [[0, 1], [18, 2], [42, 3]].map(([i, st]) => `<span class="sm-ank-k">${smKarteHtml(i, st)}</span>`).join("");
    modal(`<div class="rb-fenster sm-ank"><div class="sm-ank-f">${karten}</div><small class="sm-ank-neu">NEU</small><h2>Das Sammelalbum</h2>
      <p>Sammle alle 66 Bibelbücher als Karten – von Bronze bis Glanz. Beim Spielen verdienst du <b>Goldstaub</b>, damit öffnest du Krüge mit je 5 Karten.</p>
      <p class="sm-ank-g">${SM_KRUG_SVG}<span>Dein <b>erster Krug</b> ist ein Geschenk!</span></p>
      <button class="btn primary" data-close="los">Startkrug öffnen</button><button class="btn ghost" data-close="">Später</button></div>`,
      w => { if (w === "los") go("album"); }).dataset.frei = "1";
  }, 1500);
}
const SM_TOUR = [
  { sel: ".sm-kasse", t: "Goldstaub", x: "Verdienst du mit jeder Runde, guten Runden, Schatztruhen und Level-Aufstiegen. Sammeln so viel du willst – öffnen kannst du 3 Krüge am Tag." },
  { sel: "#smKrugKn", t: "Krüge", x: "Ein Krug kostet 10 Goldstaub und enthält 5 Karten. Bis zu 3 Krüge am Tag. Jede 7. Schatztruhe schenkt dir einen Krug – dein erster wartet schon." },
  { sel: ".sm-beutel", t: "Tauschbeutel", x: "Doppelte Karten landen hier. 3 Bronze → 1 Silber, 4 Silber → 1 Gold, 5 Gold → 1 Glanz. Welche Karte aufsteigt, wählst du selbst." }
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
    `<div class="rb-k"><small>Sammelalbum</small><div class="rb-gross"><b>${D.album}</b><span>von 66 Karten</span></div><p>${D.gold} Goldstaub liegen bereit – ${D.gold >= SM_KRUG_PREIS ? "genug für einen Krug!" : "spiel ein paar Runden für den nächsten Krug."}</p></div>`,
    `<div class="rb-k"><small>Gemeinsam</small><div class="rb-gross"><b>${rbGemeinde ? pkt(rbGemeinde) : "…"}</b><span>XP haben alle zusammen gesammelt</span></div><p>Danke, dass du Teil davon bist!</p></div>`,
    `<div class="rb-k rb-vers"><small>Dein Vers für ${D.jahr + 1}</small><blockquote>${esc(D.vers[0])}</blockquote><cite>${esc(D.vers[1])}</cite></div>`,
    `<div class="rb-k rb-teil"><small>Teilen</small><h3>Zeig deinen Freunden dein Bibeljahr</h3>
      <div class="rb-vorschau" id="rbVorschau"><span class="muted small">Bild wird erstellt …</span></div>
      <p class="rb-link small">Mit dem Bild wird dieser Link geteilt:<br><b>${esc(smLink())}</b></p>
      <button class="btn primary" id="rbTeilen">${svg("share") || ""} Teilen${m.rb.g === D.jahr ? "" : " · +5 Goldstaub"}</button></div>`
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
    if (ok && m.rb.g !== D.jahr) { m.rb.g = D.jahr; save(); const x = smGoldGeben(5); if (x) toast(`Danke fürs Teilen! +${x} Goldstaub`); } };
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
  if (altP) VIEWS.profil = function (a) { altP(a); const j = rbSichtbar(); const b = document.createElement("button"); b.className = "btn"; b.style.marginTop = "10px"; b.innerHTML = `${SM_ALBUM_SVG} ${j ? "Dein Bibeljahr " + j : "Sammelalbum"}`; b.onclick = () => { SFX.tap(); rbSeite = 0; go(j ? "rueckblick" : "album"); }; screen.appendChild(b); };
})();
