const APP_VERSION = "6.5";
/* =====================================================================
   Bibelbuch-Quest – Spieldaten
   Bücher (Schlachter 2000), Lieder, Bibelverse (Schlachter 2000 © Genfer Bibelgesellschaft),
   Abzeichen, Laden-Artikel, Tagesaufgaben.
   Diese Datei enthält nur Daten – die Spiel-Logik steht in spiel.js.
   ===================================================================== */

/* ---------- Die 66 Bücher in Gruppen (Reihenfolge Schlachter 2000) ---------- */
const GROUPS = [
  { t: "AT", g: "geschichte", name: "Gesetz", books: ["1. Mose", "2. Mose", "3. Mose", "4. Mose", "5. Mose"], tip: "Einfach durchzählen: 1. bis 5. Mose." },
  { t: "AT", g: "geschichte", name: "Geschichtsbücher", books: ["Josua", "Richter", "Ruth", "1. Samuel", "2. Samuel", "1. Könige", "2. Könige", "1. Chronik", "2. Chronik", "Esra", "Nehemia", "Esther"], tip: "„Josua richtet Ruth, Samuel krönt Könige“ – dann Chronik, Esra, Nehemia, Esther. Samuel, Könige und Chronik kommen immer doppelt." },
  { t: "AT", g: "lehre", name: "Weisheitsbücher", books: ["Hiob", "Psalmen", "Sprüche", "Prediger", "Hohelied"], tip: "„Hiob psalmt Sprüche, predigt das Hohelied“ – vom Leid über Gebet und Weisheit zur Liebe." },
  { t: "AT", g: "prophetie", name: "Große Propheten", books: ["Jesaja", "Jeremia", "Klagelieder", "Hesekiel", "Daniel"], tip: "Jeremia schrieb auch die Klagelieder, darum folgen sie direkt. Buchstaben: J-J-K-H-D." },
  { t: "AT", g: "prophetie", name: "Kleine Propheten", books: ["Hosea", "Joel", "Amos", "Obadja", "Jona", "Micha", "Nahum", "Habakuk", "Zephanja", "Haggai", "Sacharja", "Maleachi"], tip: "In Dreierpaketen: Hosea Joel Amos · Obadja Jona Micha · Nahum Habakuk Zephanja · Haggai Sacharja Maleachi." },
  { t: "NT", g: "geschichte", name: "Evangelien & Apostelgeschichte", books: ["Matthäus", "Markus", "Lukas", "Johannes", "Apostelgeschichte"], tip: "M-M-L-J, danach die Apostelgeschichte als Fortsetzung von Lukas." },
  { t: "NT", g: "lehre", name: "Paulusbriefe", books: ["Römer", "1. Korinther", "2. Korinther", "Galater", "Epheser", "Philipper", "Kolosser", "1. Thessalonicher", "2. Thessalonicher", "1. Timotheus", "2. Timotheus", "Titus", "Philemon"], tip: "Römer, 2× Korinther – „Geh essen, Pommes kosten“ (Galater, Epheser, Philipper, Kolosser) – 2× Thessalonicher, 2× Timotheus, Titus, Philemon." },
  { t: "NT", g: "lehre", name: "Allgemeine Briefe & Offenbarung", books: ["Hebräer", "Jakobus", "1. Petrus", "2. Petrus", "1. Johannes", "2. Johannes", "3. Johannes", "Judas", "Offenbarung"], tip: "Hebräer, Jakobus – dann 2× Petrus, 3× Johannes, Judas. Zum Schluss die Offenbarung." }
];
const ALL = [];
GROUPS.forEach((g, gi) => g.books.forEach(b => ALL.push({ b, gi, t: g.t })));
/* Gattung je Buch (Farben wie im Liedblatt): Geschichte · Lehre/Poesie · Prophetie */
const GATTUNG = { geschichte: "Geschichte", lehre: "Lehre & Poesie", prophetie: "Prophetie" };
const gattungVon = i => (i === 65 ? "prophetie" : GROUPS[ALL[i].gi].g);

/* ---------- Das Lied der biblischen Bücher ----------
   Traditioneller Merkvers „In des Alten Bundes Schriften“ (gemeinfrei),
   angepasst an die Reihenfolge der Schlachter 2000 (Klagelieder ergänzt, Hebräer/Jakobus vor Petrus).
   Segment = { b:[Buch-Indizes], t:"Text" } oder einfacher Text. neu:true = angepasste Stelle. */
const LIED = [
  { lines: [
    ["In des Alten Bundes Schriften merke an der ersten Stell:"],
    [{ b: [0, 1, 2, 3, 4], t: "Mose" }, ", ", { b: [5], t: "Josua" }, " und ", { b: [6], t: "Richter" }, ", ", { b: [7], t: "Ruth" }, " und ", { b: [8, 9], t: "zwei von Samuel" }, "."]
  ] },
  { lines: [
    [{ b: [10, 11], t: "Zwei der Könige" }, ", ", { b: [12, 13], t: "Chronik" }, ", ", { b: [14], t: "Esra" }, ", ", { b: [15], t: "Nehemia" }, ", ", { b: [16], t: "Esther" }, " mit."],
    [{ b: [17], t: "Hiob" }, ", ", { b: [18], t: "Psalter" }, ", dann die ", { b: [19], t: "Sprüche" }, ", ", { b: [20], t: "Prediger" }, " und ", { b: [21], t: "Hoheslied" }, "."]
  ] },
  { lines: [
    [{ b: [22], t: "Jesaja" }, " und ", { b: [23], t: "Jeremia" }, ", ", { b: [24], t: "Klagelieder", neu: true }, ", ", { b: [25], t: "Hesekiel" }, ", ", { b: [26], t: "Daniel" }, "."],
    ["Dann ", { b: [27], t: "Hosea" }, ", ", { b: [28], t: "Joel" }, ", ", { b: [29], t: "Amos" }, ", ", { b: [30], t: "Obadja" }, " und ", { b: [31], t: "Jonas" }, " Fehl,"]
  ] },
  { lines: [
    [{ b: [32], t: "Micha" }, ", welchem ", { b: [33], t: "Nahum" }, " folget, ", { b: [34], t: "Habakuk" }, ", ", { b: [35], t: "Zephania" }, ","],
    ["dann ", { b: [36], t: "Haggai" }, " und ", { b: [37], t: "Sacharja" }, ", schließlich noch ", { b: [38], t: "Malachia" }, "."]
  ] },
  { lines: [
    ["In dem Neuen stehn ", { b: [39], t: "Matthäus" }, ", ", { b: [40], t: "Markus" }, ", ", { b: [41], t: "Lukas" }, " und ", { b: [42], t: "Johann" }, ","],
    ["samt den ", { b: [43], t: "Taten der Apostel" }, " unter allen vornean."]
  ] },
  { lines: [
    ["An die ", { b: [44], t: "Römer" }, ", ", { b: [45, 46], t: "zwei Korinther" }, ", ", { b: [47], t: "Galater" }, " und ", { b: [48], t: "Epheser" }, ","],
    ["die ", { b: [49], t: "Philipper" }, " und ", { b: [50], t: "Kolosser" }, ", ", { b: [51, 52], t: "beide Thessalonicher" }, "."]
  ] },
  { lines: [
    [{ b: [53, 54], t: "Zwei Timotheus" }, ", an ", { b: [55], t: "Titus" }, ", an ", { b: [56], t: "Philemon" }, ", die ", { b: [57], t: "Hebräer", neu: true }, ","],
    [{ b: [58], t: "Jakobus", neu: true }, " und ", { b: [59, 60], t: "Petrus zwei" }, ", ", { b: [61, 62, 63], t: "drei Johannes" }, ", ", { b: [64], t: "Judas" }, " dabei."]
  ] },
  { lines: [
    ["Endlich schließt die ", { b: [65], t: "Offenbarung" }, " das gesamte Bibelbuch."],
    ["Mensch, gebrauche, was du liesest, dir zum Segen, nicht zum Fluch."]
  ] }
];
const zeileText = line => line.map(s => (typeof s === "string" ? s : s.t)).join("");
/* Für jedes Buch: in welcher Strophe/Zeile/Segment steht es? */
const BUCH_IM_LIED = [];
LIED.forEach((v, vi) => v.lines.forEach((ln, li) => ln.forEach((s, si) => {
  if (typeof s !== "string") s.b.forEach(b => (BUCH_IM_LIED[b] = { v: vi, l: li, s: si }));
})));
const strophenVonGruppe = gi => LIED.map((v, vi) => vi).filter(vi =>
  LIED[vi].lines.some(ln => ln.some(s => typeof s !== "string" && s.b.some(b => ALL[b].gi === gi))));

/* ---------- Bibelverse (Schlachter 2000 © Genfer Bibelgesellschaft) ---------- */
const VERSE = {
  leuchte: ["Dein Wort ist meines Fußes Leuchte und ein Licht auf meinem Weg.", "Psalm 119,105"],
  herz: ["Ich bewahre dein Wort in meinem Herzen, damit ich nicht gegen dich sündige.", "Psalm 119,11"],
  honig: ["Wie süß ist dein Wort meinem Gaumen, mehr als Honig meinem Mund!", "Psalm 119,103"],
  lust: ["… sondern seine Lust hat am Gesetz des HERRN und über sein Gesetz nachsinnt Tag und Nacht.", "Psalm 1,2"],
  josua: ["Lass dieses Buch des Gesetzes nicht von deinem Mund weichen, sondern forsche darin Tag und Nacht …", "Josua 1,8"],
  kind: ["… weil du von Kindheit an die heiligen Schriften kennst, welche die Kraft haben, dich weise zu machen zur Errettung durch den Glauben, der in Christus Jesus ist.", "2. Timotheus 3,15"],
  nuetze: ["Alle Schrift ist von Gott eingegeben und nützlich zur Belehrung, zur Überführung, zur Zurechtweisung, zur Erziehung in der Gerechtigkeit …", "2. Timotheus 3,16"],
  brot: ["Der Mensch lebt nicht vom Brot allein, sondern von einem jeden Wort, das aus dem Mund Gottes hervorgeht!", "Matthäus 4,4"],
  ewig: ["Das Gras ist verdorrt, die Blume ist abgefallen; aber das Wort unseres Gottes bleibt in Ewigkeit!", "Jesaja 40,8"],
  lebendig: ["Denn das Wort Gottes ist lebendig und wirksam und schärfer als jedes zweischneidige Schwert …", "Hebräer 4,12"],
  lieder: ["Lasst das Wort des Christus reichlich in euch wohnen in aller Weisheit …", "Kolosser 3,16"]
};
const VERS_QUELLE = "Schlachter 2000";
/* Wechselnder „Vers des Tages“ – das einzige Bibelzitat auf der Startseite */
const VERS_DES_TAGES = ["leuchte", "herz", "honig", "lust", "josua", "kind", "nuetze", "brot", "ewig", "lebendig", "lieder"];

/* ---------- Symbole (SVG-Pfade, 24×24) ---------- */
const ICONS = {
  chat: '<path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
  stift: '<path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  step: '<path d="M5 19h4v-4h4v-4h4V7h3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  scroll: '<path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M9 9h7M9 13h7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  cross: '<path d="M12 3v18M6 9h12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor"/>',
  fire: '<path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5 .2 2 1 3 2 3.5C11 9 11 5 12 2z" fill="currentColor"/>',
  crown: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z" fill="currentColor"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  gem: '<path d="M6 4h12l3 5-9 11L3 9z" fill="currentColor"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
  path: '<circle cx="6" cy="18" r="2.5" fill="currentColor"/><circle cx="18" cy="6" r="2.5" fill="currentColor"/><path d="M8 17c6 0 2-10 8-10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-dasharray="3 3"/>',
  link: '<path d="M9 15l6-6M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
  shop: '<path d="M4 8h16l-1 12H5zM8 8a4 4 0 0 1 8 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
  sound: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a8.5 8.5 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.4"/>',
  share: '<circle cx="18" cy="5" r="3" fill="currentColor"/><circle cx="6" cy="12" r="3" fill="currentColor"/><circle cx="18" cy="19" r="3" fill="currentColor"/><path d="M8.6 10.7l6.8-4M8.6 13.3l6.8 4" stroke="currentColor" stroke-width="2"/>',
  down: '<path d="M12 3v12M7 10l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  people: '<circle cx="9" cy="8" r="3.2" fill="currentColor"/><circle cx="17" cy="9" r="2.6" fill="currentColor"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6zM14.5 20c.2-2 0-3.6-1-5 .8-.6 2-1 3.5-1 2.8 0 4.5 2.2 4.5 6z" fill="currentColor"/>',
  trophy: '<path d="M7 3h10v5a5 5 0 0 1-10 0zM7 5H4v1a4 4 0 0 0 3.5 4M17 5h3v1a4 4 0 0 1-3.5 4M12 13v4M8 21h8l-1-4H9z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
  music: '<path d="M9 18V6l11-2v12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.8" fill="currentColor"/><circle cx="17.5" cy="16" r="2.8" fill="currentColor"/>',
  play: '<path d="M7 4l13 8-13 8z" fill="currentColor"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
  user: '<circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" fill="currentColor"/>',
  sun: '<circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  target: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/>',
  back: '<path d="M14 5l-7 7 7 7M7 12h13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  /* Avatare */
  "av-fisch": '<path d="M2.5 12c4-6 10.5-6.5 14.5 0-4 6.5-10.5 6-14.5 0zM17 12l5-4.5v9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="7" cy="11" r="1.1" fill="currentColor"/>',
  "av-taube": '<path d="M3 14.5c3.5.3 6-1.2 8-3.6L15 4c1.2 3 .6 5.6-1.3 8 2.6-.9 5.4-.3 8.3 1.6-2.8 2.2-6.4 3.4-10.4 3.4-3.6 0-6.4-.8-8.6-2.5z" fill="currentColor"/><path d="M15.6 15.5l1.6 3.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  "av-lampe": '<path d="M3 15.5c0-2.1 3.2-3.3 7.5-3.3H17l4.5-2.2-2.3 4.4c-1 2-3.2 3.1-6.3 3.1H8c-3 0-5-.9-5-2z" fill="currentColor"/><path d="M12 3.5c1.4 2 2.4 3.6 0 6.6-2.4-2.4-1.3-4.4 0-6.6z" fill="currentColor"/>',
  "av-lamm": '<circle cx="9" cy="12" r="3.4" fill="currentColor"/><circle cx="13" cy="10.5" r="3.6" fill="currentColor"/><circle cx="14.6" cy="14" r="3.2" fill="currentColor"/><circle cx="10" cy="15.2" r="3" fill="currentColor"/><ellipse cx="18.8" cy="10.4" rx="2.6" ry="2.1" fill="currentColor"/><path d="M10 18v3.5M15 18v3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  "av-harfe": '<path d="M6 21V5c5 0 10 3 13 9l-2 7z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M9 7v14M12 8.2V21M15 10.5V21" stroke="currentColor" stroke-width="1.4"/>',
  "av-anker": '<circle cx="12" cy="5" r="2.3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.3V21M8 10.5h8M4.5 14.5c.4 3.8 3.5 6.5 7.5 6.5s7.1-2.7 7.5-6.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  "av-loewe": '<circle cx="12" cy="12" r="9" fill="currentColor" opacity=".45"/><circle cx="12" cy="12.5" r="5.6" fill="currentColor"/><path d="M10 12h.01M14 12h.01" stroke="#1b1300" stroke-width="2" stroke-linecap="round"/><path d="M10.8 15h2.4" stroke="#1b1300" stroke-width="1.4" stroke-linecap="round"/>',
  "av-krone": '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z" fill="currentColor"/>',
  "av-rolle": '<path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M9 9h7M9 13h7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  /* Waffenrüstung Gottes */
  "ar-guertel": '<path d="M2.5 9.5h19v5h-19z" fill="currentColor"/><rect x="9.5" y="8" width="5" height="8" rx="1" fill="none" stroke="#1b1300" stroke-width="1.6"/>',
  "ar-panzer": '<path d="M6 3.5l6 2 6-2 2.5 4.5-2 12.5H5.5L3.5 8z" fill="currentColor"/><path d="M12 6v14" stroke="#1b1300" stroke-width="1.2" opacity=".5"/>',
  "ar-schuhe": '<path d="M4 5h5.5v8.5l7.5 2c2.6.7 4 2.2 4 4.5H4z" fill="currentColor"/>',
  "ar-schild": '<path d="M12 2.5l8.5 3.2V12c0 5.2-3.8 8.4-8.5 9.5C7.3 20.4 3.5 17.2 3.5 12V5.7z" fill="currentColor"/><path d="M12 7v10M8 11h8" stroke="#1b1300" stroke-width="1.8" stroke-linecap="round"/>',
  "ar-helm": '<path d="M4 15a8 8 0 0 1 16 0v4h-5.5v-4h-5v4H4z" fill="currentColor"/><path d="M12 3v4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  "ar-schwert": '<path d="M19.5 2.5h2v2L10.5 15.5l-2-2z" fill="currentColor"/><path d="M6 12.5l5.5 5.5M8 17l-4 4M5.2 18.2l.6.6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  coin: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="4" fill="currentColor"/>',
  manna: '<circle cx="7" cy="9" r="2.2" fill="currentColor"/><circle cx="13" cy="6.5" r="2" fill="currentColor"/><circle cx="17" cy="11" r="2.3" fill="currentColor"/><circle cx="10" cy="14" r="2.1" fill="currentColor"/><path d="M3 19h18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  siegel: '<circle cx="12" cy="9.5" r="7" fill="currentColor"/><path d="M8.2 14.6L6.5 22l5.5-2.8 5.5 2.8-1.7-7.4" fill="currentColor" opacity=".75"/><path d="M12 5.6l1.2 2.4 2.6.4-1.9 1.8.5 2.6L12 11.6l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z" fill="#1b1300" opacity=".5"/>',
  netz: '<path d="M3 6c4 2 14 2 18 0M3 12c4 2 14 2 18 0M3 18c4 2 14 2 18 0M7 4v17M12 4v17M17 4v17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
};

/* ---------- Laden: Farbthemen, Avatare, Rahmen, Titel, Waffenrüstung, Vorräte ---------- */
const THEMES = [
  { id: "gold", name: "Gold", price: 0, c: "#f2c14e", bezug: "Die Bundeslade, in der die Gesetzestafeln lagen, war innen und außen mit reinem Gold überzogen (2. Mose 25,10-16)." },
  { id: "smaragd", name: "Smaragd", price: 15, c: "#3fd6a6", bezug: "Johannes sieht um Gottes Thron einen Regenbogen, der aussieht wie ein Smaragd (Offenbarung 4,3)." },
  { id: "purpur", name: "Purpur", price: 30, c: "#c09bff", bezug: "Lydia war Purpurhändlerin. Sie hörte Paulus zu, kam zum Glauben und öffnete ihm ihr Haus (Apostelgeschichte 16,14-15)." },
  { id: "morgenrot", name: "Morgenrot", price: 50, c: "#ff8a5c", bezug: "Gottes Erbarmen ist jeden Morgen neu und seine Treue ist groß (Klagelieder 3,22-23)." },
  { id: "jordan", name: "Jordan", price: 90, c: "#5cc8ff", bezug: "Am Jordan zog Israel ins verheißene Land (Josua 3), und hier wurde Jesus getauft (Matthäus 3,13-17)." },
  { id: "zeder", name: "Zeder vom Libanon", price: 140, c: "#9fd36a", bezug: "Mit Zedernholz vom Libanon baute Salomo den Tempel (1. Könige 5–6). Der Gerechte wächst wie eine Zeder (Psalm 92,13)." }
];
const AVATARE = [
  { id: "initial", name: "Anfangsbuchstabe", price: 0, bezug: "Dein Name – Gott kennt dich mit Namen (Jesaja 43,1)." },
  { id: "fisch", name: "Fisch", price: 20, bezug: "Jesus rief Fischer wie Petrus und Andreas, ihm nachzufolgen (Matthäus 4,18-20). Der Fisch wurde zum Erkennungszeichen der ersten Christen." },
  { id: "rolle", name: "Schriftrolle", price: 30, bezug: "Jesus las in der Synagoge aus der Schriftrolle des Propheten Jesaja (Lukas 4,16-21)." },
  { id: "taube", name: "Taube", price: 40, bezug: "Bei der Taufe Jesu kam der Geist Gottes wie eine Taube auf ihn herab (Matthäus 3,16)." },
  { id: "lampe", name: "Öllampe", price: 60, bezug: "Gottes Wort ist wie eine Lampe für unseren Weg (Psalm 119,105)." },
  { id: "lamm", name: "Lamm", price: 80, bezug: "Johannes der Täufer nannte Jesus „das Lamm Gottes“ (Johannes 1,29)." },
  { id: "harfe", name: "Harfe Davids", price: 100, bezug: "David spielte Harfe für König Saul und schrieb viele Psalmen (1. Samuel 16,23)." },
  { id: "anker", name: "Anker", price: 140, bezug: "Die Hoffnung auf Gott ist ein sicherer und fester Anker für die Seele (Hebräer 6,19)." },
  { id: "loewe", name: "Löwe aus Juda", price: 200, bezug: "Jesus wird der Löwe aus dem Stamm Juda genannt, der gesiegt hat (Offenbarung 5,5)." },
  { id: "krone", name: "Krone des Lebens", price: 300, bezug: "Wer bis zum Tod treu bleibt, dem verspricht Jesus die Krone des Lebens (Offenbarung 2,10)." }
];
const RAHMEN = [
  { id: "none", name: "Ohne Rahmen", price: 0 },
  { id: "holz", name: "Arche (Holz)", price: 25, bezug: "Noah baute die Arche aus Holz, so wie Gott es ihm aufgetragen hatte (1. Mose 6,14-22)." },
  { id: "bronze", name: "Erz", price: 60, bezug: "Das große Becken im Vorhof des Tempels war aus Erz (Bronze) gegossen (1. Könige 7,23)." },
  { id: "silber", name: "Silber", price: 120, bezug: "Gottes Worte sind rein wie siebenmal geläutertes Silber (Psalm 12,7)." },
  { id: "gold", name: "Bundeslade (Gold)", price: 200, bezug: "Die Bundeslade war mit reinem Gold überzogen (2. Mose 25,11)." },
  { id: "regenbogen", name: "Regenbogen", price: 320, bezug: "Der Regenbogen ist das Zeichen für Gottes Bund mit Noah und der ganzen Erde (1. Mose 9,13)." },
  { id: "licht", name: "Licht der Welt", price: 450, bezug: "Jesus sagt zu seinen Jüngern: Ihr seid das Licht der Welt (Matthäus 5,14)." },
  { id: "gewappnet", name: "Gewappnet", price: -1, need: "armor", bezug: "Für alle, die die ganze Waffenrüstung Gottes angelegt haben (Epheser 6,11)." }
];
const TITEL = [
  { id: "none", name: "Ohne Titel", price: 0 },
  { id: "buecherwurm", name: "Bücherwurm", price: 20, bezug: "Sogar im Gefängnis bat Paulus Timotheus, ihm seine Bücher und Pergamente mitzubringen (2. Timotheus 4,13)." },
  { id: "psalmsaenger", name: "Psalmsänger", price: 60, bezug: "David und andere Sänger schrieben die Psalmen, um Gott zu loben und ihm ihr Herz auszuschütten (Psalm 150)." },
  { id: "schriftforscher", name: "Schriftforscher", price: 120, bezug: "Jesus sagt: Die Schriften sind es, die von mir zeugen (Johannes 5,39)." },
  { id: "waechter", name: "Wächter auf der Mauer", price: 200, bezug: "Gott setzte Hesekiel als Wächter ein, der sein Wort weitergeben sollte (Hesekiel 33,7)." },
  { id: "timotheus", name: "Timotheus", price: 260, bezug: "Timotheus kannte von Kindheit an die heiligen Schriften (2. Timotheus 3,15)." },
  { id: "beroeer", name: "Beröer", price: -1, need: "beroeer", bezug: "Die Christen in Beröa forschten jeden Tag in der Schrift (Apostelgeschichte 17,11)." },
  { id: "daniel", name: "Treu wie Daniel", price: -1, need: "streak30", bezug: "Daniel betete dreimal am Tag, auch als es verboten war (Daniel 6,11)." },
  { id: "rueckwaerts", name: "Rückwärtsleser", price: -1, need: "chainRueck", bezug: "„Gedenke der Tage der Vorzeit“ – Mose erinnert Israel an Gottes Geschichte (5. Mose 32,7)." },
  { id: "meister", name: "Bibel-Meister", price: -1, need: "chain66", bezug: "Esra war ein kundiger Schriftgelehrter im Gesetz des Mose (Esra 7,6)." },
  { id: "gewappnet", name: "Gewappnet", price: -1, need: "armor", bezug: "Zieht die ganze Waffenrüstung Gottes an (Epheser 6,11)." }
];
/* Epheser 6,14-17 – wird Stück für Stück angelegt */
const RUESTUNG = [
  { id: "guertel", name: "Gürtel der Wahrheit", price: 50, vers: "So steht nun fest, eure Lenden umgürtet mit Wahrheit …", ref: "Epheser 6,14" },
  { id: "panzer", name: "Brustpanzer der Gerechtigkeit", price: 90, vers: "… und angetan mit dem Brustpanzer der Gerechtigkeit …", ref: "Epheser 6,14" },
  { id: "schuhe", name: "Schuhe des Friedens", price: 130, vers: "… und die Füße gestiefelt mit der Bereitschaft [zum Zeugnis] für das Evangelium des Friedens.", ref: "Epheser 6,15" },
  { id: "schild", name: "Schild des Glaubens", price: 180, vers: "Vor allem aber ergreift den Schild des Glaubens, mit dem ihr alle feurigen Pfeile des Bösen auslöschen könnt …", ref: "Epheser 6,16" },
  { id: "helm", name: "Helm des Heils", price: 240, vers: "… und nehmt auch den Helm des Heils …", ref: "Epheser 6,17" },
  { id: "schwert", name: "Schwert des Geistes", price: 320, vers: "… und das Schwert des Geistes, welches das Wort Gottes ist.", ref: "Epheser 6,17" }
];

/* ---------- Level ---------- */
const TITLES = ["Schriftrollen-Lehrling", "Bücherwurm", "Fleißiger Leser", "Junger Schreiber", "Psalmensänger", "Weisheitssucher", "Prophetenschüler", "Schriftkundiger", "Bibelkenner", "Ältester", "Bibel-Meister", "Lebendiges Register"];

/* ---------- Gemeinde-Treue ---------- */
const TREUE_TAGE = 3;                       // ab so vielen Spieltagen pro Woche ist man „treu“
const TREUE_STUFEN = [                       // [treue Spieler, Talente für jeden Treuen, Name]
  [3, 10, "Bronze"], [6, 20, "Silber"], [10, 40, "Gold"]
];

/* ---------- Siegel: Meisterschaft durch Wiederholen ---------- */
const SIEGEL = [
  null,
  { name: "Bronze", farbe: "#cd7f32", text: "1-mal geschafft", tal: 0 },
  { name: "Silber", farbe: "#e2e6f0", text: "in 3 verschiedenen Wochen geschafft", tal: 20 },
  { name: "Gold", farbe: "#f2c14e", text: "in 3 verschiedenen Monaten geschafft", tal: 40 },
  { name: "Diamant", farbe: "#9be7ff", text: "12 Monate am Stück jeden Monat geschafft", tal: 100 }
];
const SIEGEL_FRISCH = 30;    // Tage, die ein Siegel frisch bleibt
const AUFFRISCH_TAL = 15;    // Bonus fürs Auffrischen eines verblassten Siegels

/* ---------- Titel für den Fortschritt im AT und NT (0–100 %) ---------- */
const AT_TITEL = [
  [0, "Hirte", "David war Hirtenjunge, bevor Gott ihn berief (1. Samuel 16,11-13)."],
  [10, "Wüstenwanderer", "Israel wanderte 40 Jahre durch die Wüste und lernte, Gott zu vertrauen (5. Mose 8,2)."],
  [25, "Kundschafter", "Josua und Kaleb erkundeten das verheißene Land und vertrauten Gott (4. Mose 13–14)."],
  [40, "Richter", "Gott gab seinem Volk Richter wie Gideon und Debora (Richter 2,16)."],
  [55, "Psalmsänger", "In den Psalmen loben, danken und klagen Menschen vor Gott (Psalm 150)."],
  [70, "Weiser wie Salomo", "Salomo bat Gott um ein weises Herz – und bekam es (1. Könige 3,9-12)."],
  [85, "Prophet", "Propheten wie Jesaja sagten: Hier bin ich, sende mich! (Jesaja 6,8)."],
  [100, "Schriftgelehrter wie Esra", "Esra war kundig im Gesetz des Mose und lehrte es das Volk (Esra 7,6.10)."]
];
const NT_TITEL = [
  [0, "Fischer", "Jesus rief einfache Fischer, ihm nachzufolgen (Matthäus 4,18-20)."],
  [10, "Nachfolger", "Wer Jesus nachfolgt, lernt jeden Tag von ihm (Lukas 9,23)."],
  [25, "Jünger", "Jesus wählte zwölf Jünger aus, die er selbst lehrte (Lukas 6,13)."],
  [40, "Zeuge", "Jesus sendet seine Jünger als Zeugen bis an das Ende der Erde (Apostelgeschichte 1,8)."],
  [55, "Freudenbote", "Wie schön sind die Füße derer, die gute Botschaft bringen (Römer 10,15)."],
  [70, "Missionar", "Paulus reiste mit dem Evangelium durch viele Länder (Apostelgeschichte 13–28)."],
  [85, "Lehrer der Gemeinde", "Timotheus sollte Gottes Wort an treue Menschen weitergeben (2. Timotheus 2,2)."],
  [100, "Säule der Gemeinde", "Petrus, Jakobus und Johannes galten als Säulen der Gemeinde (Galater 2,9)."]
];

/* ---------- Abzeichen ----------
   kat: Kategorie · tal: Talente-Belohnung · ok(S): Bedingung */
const BADGE_KAT = { lernen: "Lernen", koennen: "Können", ausdauer: "Ausdauer", wachstum: "Wachstum", gemeinschaft: "Gemeinschaft", schatz: "Schätze" };
const BADGES = [
  { id: "first", kat: "lernen", name: "Erster Schritt", d: "Erste Station geschafft", ic: "step", ok: s => Object.keys(s.stars).length >= 1 },
  { id: "at", kat: "lernen", name: "Altes Testament", d: "Alle AT-Stationen bestanden", ic: "scroll", ok: s => [0, 1, 2, 3, 4].every(i => s.stars[i] >= 1) },
  { id: "nt", kat: "lernen", name: "Neues Testament", d: "Alle NT-Stationen bestanden", ic: "cross", ok: s => [5, 6, 7].every(i => s.stars[i] >= 1) },
  { id: "allstars", kat: "lernen", name: "Sternensammler", d: "Überall 3 Sterne", ic: "star", tal: 10, ok: s => GROUPS.every((g, i) => s.stars[i] === 3) },
  { id: "learn", kat: "lernen", name: "Spickzettel", d: "Alle Bücher einmal verdeckt geprüft", ic: "eye", ok: s => s.peeked },
  { id: "song", kat: "lernen", name: "Mit Psalmen und Liedern", d: "Alle 8 Strophen des Liedes angehört", ic: "music", tal: 10, ok: s => (s.songHeard || []).length >= 8 },
  { id: "lueckenlos", kat: "lernen", name: "Lückenlos", d: "Lied-Lückenquiz über das ganze Lied ohne Fehler", ic: "check", tal: 15, ok: s => s.gapPerfect },

  { id: "chain39", kat: "koennen", name: "Bis Maleachi", d: "Ganze-Bibel-Kette bis zum Ende des AT", ic: "scroll", ok: s => s.bestChain >= 38 },
  { id: "chain66", kat: "koennen", name: "Alle 66!", d: "Ganze Bibel als Kette ohne Fehler", ic: "crown", tal: 25, ok: s => s.bestChain >= 65 },
  { id: "chainAT", kat: "koennen", name: "Altes Testament am Stück", d: "AT-Kette von 1. Mose bis Maleachi", ic: "link", tal: 10, ok: s => s.chainAT >= 38 },
  { id: "chainNT", kat: "koennen", name: "Neues Testament am Stück", d: "NT-Kette von Matthäus bis Offenbarung", ic: "link", tal: 10, ok: s => s.chainNT >= 26 },
  { id: "chainRueck", kat: "koennen", name: "Rückwärts gelesen", d: "Rückwärts-Kette von Offenbarung bis 1. Mose", ic: "back", tal: 30, ok: s => s.chainRueck >= 65 },
  { id: "combo10", kat: "koennen", name: "Im Fluss", d: "Combo von 10 im Blitz", ic: "bolt", ok: s => s.bestCombo >= 10 },
  { id: "combo25", kat: "koennen", name: "Unaufhaltsam", d: "Combo von 25 im Blitz", ic: "fire", tal: 10, ok: s => s.bestCombo >= 25 },
  { id: "blitz20", kat: "koennen", name: "Blitzmerker", d: "20 Richtige in einer Blitz-Runde", ic: "bolt", ok: s => s.bestBlitz >= 20 },
  { id: "blitz30", kat: "koennen", name: "Wie der Blitz", d: "30 Richtige in einer Blitz-Runde", ic: "bolt", tal: 10, ok: s => s.bestBlitz >= 30 },
  { id: "blitz40", kat: "koennen", name: "Unschlagbar", d: "40 Richtige in einer Blitz-Runde", ic: "bolt", tal: 20, ok: s => s.bestBlitz >= 40 },
  { id: "ps119", kat: "koennen", name: "Psalm 119", d: "176 richtige Antworten an einem Tag – so viele Verse hat Psalm 119", ic: "book", tal: 20, ok: s => (s.bestDayRight || 0) >= 176 },

  { id: "streak3", kat: "ausdauer", name: "Dranbleiber", d: "3 Tage in Folge", ic: "fire", ok: s => s.bestStreak >= 3 },
  { id: "streak7", kat: "ausdauer", name: "Eine Woche treu", d: "7 Tage in Folge", ic: "fire", tal: 10, ok: s => s.bestStreak >= 7 },
  { id: "streak14", kat: "ausdauer", name: "Zwei Wochen treu", d: "14 Tage in Folge", ic: "fire", tal: 15, ok: s => s.bestStreak >= 14 },
  { id: "streak30", kat: "ausdauer", name: "Treu wie Daniel", d: "30 Tage in Folge – Daniel betete täglich (Daniel 6,11)", ic: "fire", tal: 30, ok: s => s.bestStreak >= 30 },
  { id: "streak100", kat: "ausdauer", name: "Beständig", d: "100 Tage in Folge (Apostelgeschichte 2,42)", ic: "fire", tal: 60, ok: s => s.bestStreak >= 100 },
  { id: "beroeer", kat: "ausdauer", name: "Beröer", d: "7 Tage in Folge alle Tagesaufgaben erfüllt (Apostelgeschichte 17,11)", ic: "target", tal: 15, ok: s => (s.bestGoalStreak || 0) >= 7 },
  { id: "frueh", kat: "ausdauer", name: "Frühaufsteher", d: "Vor 7 Uhr gelernt (Markus 1,35)", ic: "sun", ok: s => s.earlyBird },
  { id: "right100", kat: "ausdauer", name: "Hundert", d: "100 richtige Antworten", ic: "check", ok: s => s.right >= 100 },
  { id: "right1000", kat: "ausdauer", name: "Tausend", d: "1000 richtige Antworten", ic: "check", tal: 15, ok: s => s.right >= 1000 },
  { id: "quests10", kat: "ausdauer", name: "Täter des Worts", d: "10-mal alle Tagesaufgaben erfüllt (Jakobus 1,22)", ic: "target", tal: 20, ok: s => (s.questBonusCount || 0) >= 10 },

  { id: "lvl5", kat: "wachstum", name: "Psalmensänger", d: "Level 5 erreicht", ic: "crown", ok: s => levelOf(s.xp) >= 5 },
  { id: "lvl10", kat: "wachstum", name: "Ältester", d: "Level 10 erreicht", ic: "crown", tal: 15, ok: s => levelOf(s.xp) >= 10 },
  { id: "lvl15", kat: "wachstum", name: "Säule", d: "Level 15 erreicht (Galater 2,9)", ic: "crown", tal: 30, ok: s => levelOf(s.xp) >= 15 },
  { id: "xp5000", kat: "wachstum", name: "Talente vermehrt", d: "5.000 XP gesammelt (Matthäus 25)", ic: "gem", tal: 15, ok: s => s.xp >= 5000 },
  { id: "xp20000", kat: "wachstum", name: "Guter und treuer Knecht", d: "20.000 XP gesammelt (Matthäus 25,21)", ic: "gem", tal: 40, ok: s => s.xp >= 20000 },

  { id: "gemeinschaft", kat: "gemeinschaft", name: "Gemeinschaft", d: "Der Gemeinde-Rangliste beigetreten", ic: "people", ok: s => !!s.lbName },
  { id: "podest", kat: "gemeinschaft", name: "Auf dem Podest", d: "Platz 1–3 in der Wochen-Rangliste", ic: "trophy", ok: s => s.podium },
  { id: "wochensieger", kat: "gemeinschaft", name: "Wochensieger", d: "Platz 1 der Woche bei mindestens 5 Spielern", ic: "trophy", tal: 20, ok: s => s.wochensieger },
  { id: "treu1", kat: "gemeinschaft", name: "Treue Woche", d: "An 3 Tagen in einer Woche gespielt", ic: "people", ok: s => (s.treueWochen || []).length >= 1 },
  { id: "treu4", kat: "gemeinschaft", name: "Vier treue Wochen", d: "In 4 Wochen jeweils an 3 Tagen gespielt", ic: "people", tal: 20, ok: s => (s.treueWochen || []).length >= 4 },
  { id: "einleib", kat: "gemeinschaft", name: "Ein Leib", d: "Gemeinde-Treue in Gold erreicht und selbst treu gewesen (1. Korinther 12)", ic: "people", tal: 15, ok: s => s.wochenziel },
  // Menschenfischer in drei Stufen: einladen → jemand ist dabei → jemand ist treu
  { id: "netz", kat: "gemeinschaft", name: "Netz ausgeworfen", d: "Deinen Einladungslink geteilt (Lukas 5,4)", ic: "netz", ok: s => s.eingeladen || s.fischerDabei || s.menschenfischer },
  { id: "fang", kat: "gemeinschaft", name: "Erster Fang", d: "Jemand spielt über deinen Link mit – wie Andreas, der seinen Bruder zu Jesus brachte (Johannes 1,41-42)", ic: "netz", tal: 10, ok: s => s.fischerDabei || s.menschenfischer },
  { id: "menschenfischer", kat: "gemeinschaft", name: "Menschenfischer", d: "Jemand, den du eingeladen hast, war an 3 Tagen einer Woche treu dabei (Matthäus 4,19)", ic: "netz", tal: 25, ok: s => s.menschenfischer },
  { id: "silber", kat: "koennen", name: "Bewährt", d: "Erstes Silber-Siegel: eine Kette in 3 verschiedenen Wochen geschafft", ic: "siegel", tal: 10, ok: s => siegelMax(s) >= 2 },
  { id: "goldsiegel", kat: "koennen", name: "Goldsiegel", d: "Eine Kette in 3 verschiedenen Monaten geschafft", ic: "siegel", tal: 20, ok: s => siegelMax(s) >= 3 },
  { id: "diamant", kat: "koennen", name: "Diamantsiegel", d: "Ein Jahr lang jeden Monat eine Kette geschafft", ic: "siegel", tal: 60, ok: s => siegelMax(s) >= 4 },
  { id: "aufgefrischt", kat: "ausdauer", name: "Aufgefrischt", d: "Ein verblasstes Siegel wieder zum Leuchten gebracht", ic: "siegel", ok: s => s.aufgefrischt },

  { id: "shop", kat: "schatz", name: "Neuer Glanz", d: "Etwas im Talente-Laden gekauft", ic: "gem", ok: s => kaufAnzahl(s) >= 1 },
  { id: "schatz", kat: "schatz", name: "Schatzsucher", d: "5 Dinge im Laden gekauft (Matthäus 13,44)", ic: "gem", tal: 10, ok: s => kaufAnzahl(s) >= 5 },
  { id: "armor", kat: "schatz", name: "Gewappnet", d: "Die ganze Waffenrüstung Gottes angelegt (Epheser 6)", ic: "ar-schild", tal: 50, ok: s => RUESTUNG.every(r => s.owned.includes("ar-" + r.id)) }
];
const siegelMax = s => Math.max(0, ...["bibel", "at", "nt", "rueck"].map(k => (typeof siegelStufe === "function" ? siegelStufe((s.meister || {})[k] || []) : 0)));
const kaufAnzahl = s => (s.owned || []).filter(id => !["gold", "av-initial", "fr-none", "ti-none"].includes(id)).length;

/* ---------- Tagesaufgaben ---------- */
// Tagesaufgaben belohnen Einsatz, nicht Fehlerfreiheit. min = grobe Dauer in Minuten;
// es werden nur Kombinationen ausgelost, die zusammen höchstens AUFGABEN_MAX_MIN Minuten dauern.
const AUFGABEN = [
  { id: "runde1", ev: "runde", ziel: 1, min: 1, text: "1 Runde spielen" },
  { id: "runden2", ev: "runde", ziel: 2, min: 2, text: "2 Runden spielen" },
  { id: "xp30", ev: "xp", ziel: 30, min: 2, text: "30 XP sammeln" },
  { id: "right10", ev: "right", ziel: 10, min: 1, text: "10 richtige Antworten" },
  { id: "blitz1", ev: "blitz", ziel: 1, min: 1, text: "1 Blitz-Runde" },
  { id: "blitz2", ev: "blitz", ziel: 2, min: 2, text: "2 Blitz-Runden" },
  { id: "station1", ev: "station", ziel: 1, min: 2, text: "1 Lektion" },
  { id: "kette1", ev: "ketteGespielt", ziel: 1, min: 1, text: "1 Ketten-Versuch" },
  { id: "lied", ev: "lied", ziel: 2, min: 1, text: "2 Liedstrophen hören" },
  { id: "luecke", ev: "luecke", ziel: 1, min: 2, text: "1 Lückenquiz" }
];
const AUFGABEN_MAX_MIN = 5;
const AUFGABE_TAL = 5;          // pro Aufgabe
// Tagesbonus für alle drei – mehr als alle Einzelbelohnungen zusammen (3 × 5 Talente, größte XP-Aufgabe 30 XP)
const AUFGABE_BONUS = 25;       // Talente
const AUFGABE_BONUS_XP = 100;   // XP
