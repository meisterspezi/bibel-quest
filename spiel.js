/* =====================================================================
   Bibelbuch-Quest – Spiel-Logik (Version 6.30)
   Braucht: daten.js (vorher geladen). Rangliste: leaderboard.js stellt window.LB bereit.
   ===================================================================== */

/* ---------- Zustand & Speichern ---------- */
const DEF = {
  xp: 0, tal: 0, tl: null, stars: {}, right: 0,
  streak: 0, bestStreak: 0, lastDay: "", todayXp: 0, todayDay: "", todayRight: 0, bestDayRight: 0,
  goalStreak: 0, bestGoalStreak: 0, lastGoalDay: "",
  bestChain: 0, chainAT: 0, chainNT: 0, chainRueck: 0, chainGebote: 0, chainSchoepfung: 0, bestBlitz: 0, bestCombo: 0,
  badges: [], owned: ["gold"], theme: "gold", avatar: "initial", frame: "none", title: "none",
  tage: [], treueWochen: [], treueBonus: { week: "", stufen: [] }, meister: { bibel: [], at: [], nt: [], rueck: [] },
  siegelGesehen: { bibel: 0, at: 0, nt: 0, rueck: 0 }, aufgefrischt: false, eingeladenVon: "", eingeladen: false, fischerDabei: false, menschenfischer: false,
  songHeard: [], gapPerfect: false, peeked: false, earlyBird: false,
  dq: { day: "", items: [], bonus: false }, questBonusCount: 0, lv: {}, duGes: [], duSiege: 0, duSpiele: 0, duTyp: "vers", duGesendet: 0, duAngenommen: 0, duArten: [], duKetteVoll: false,
  mute: false, beat: true, gapSing: false, atTi: 0, ntTi: 0,
  ruestStufe: {}, stift: {}, spendeXp: {}, advTest: { on: false, d: "2026-11-29" }, advT: null, beth: {}, bethG: {}, bethSync: "", bethTage: [], bethGefeiert: [], bethAngekommen: false, kal: {}, advBib: {}, advLv: 0, advLr: 0, adventIntro: false, stiftGefeiert: [], stiftEingeweiht: false,
  xq: null, dlgGesehen: 0, dlgDev: {}, lvLohn: 0, gem: null, gemNeu: false, nachGel: [], nachAb: 0, gemGesendet: "", rankScope: "", duAlle: false, lbName: "", pid: "", ownersSet: false, offlineOnly: false, weekKey: "", weekXp: 0, podium: false, wochensieger: false, wochenziel: false,
  ver: 6
};
let S = JSON.parse(JSON.stringify(DEF));
/* Mehrere Spieler auf einem Gerät: jeder hat einen eigenen Spielstand.
   Der erste (bisherige) Spieler behält den alten Speicherplatz "bibelquest-v1". */
const LS_SPIELER = "bibelquest-spieler";
const lsKey = key => (key === "haupt" ? "bibelquest-v1" : "bibelquest-v1:" + key);
/* 6.83: GERAET.aktiv = der Spieler DIESES Fensters (sessionStorage „bq-aktiv“). Im gemeinsamen Speicher steht nur, wer zuletzt
   gewählt wurde (Vorgabe für neue Fenster). Früher schrieb jedes Fenster bei jedem Speichern seinen Spieler als „aktiv“ zurück –
   ein zweites Fenster (z. B. im Hintergrund) konnte so den Spieler umstellen. */
const geraetLesen = () => { try { const g = JSON.parse(localStorage.getItem(LS_SPIELER) || "null"); if (g && Array.isArray(g.liste)) return g; } catch (e) {} return { aktiv: "haupt", liste: [] }; };
function geraetSchreiben(fn) {
  const g = geraetLesen(); fn(g); GERAET.liste = g.liste;
  try { localStorage.setItem(LS_SPIELER, JSON.stringify(g)); } catch (e) {}
}
let GERAET = geraetLesen();
try { const a = sessionStorage.getItem("bq-aktiv"); if (a && (a === "haupt" || /^s[a-z0-9]{5}$/.test(a))) GERAET.aktiv = a; } catch (e) {}
try { sessionStorage.setItem("bq-aktiv", GERAET.aktiv); } catch (e) {}
const LS = lsKey(GERAET.aktiv);
try { const v = JSON.parse(localStorage.getItem(LS) || "null"); if (v) S = Object.assign(JSON.parse(JSON.stringify(DEF)), v); } catch (e) {}
/* Umzug von Version 5: Rekord-Serie nachtragen */
if (!S.bestStreak) S.bestStreak = S.streak || 0;
/* Abzeichen, die es nicht mehr gibt (z. B. „Ein Leib“ seit Wegfall der Gemeinde-Treue), aussortieren */
function badgesBereinigen() { S.badges = (S.badges || []).filter(id => BADGES.some(b => b.id === id)); }
badgesBereinigen();
function geraetSpeichern() {
  if (gesperrt) return;
  const eintrag = { key: GERAET.aktiv, name: S.lbName, avatar: S.avatar, frame: S.frame, xp: Math.round(S.xp), pid: S.pid };
  geraetSchreiben(g => { const i = g.liste.findIndex(p => p.key === GERAET.aktiv); if (i > -1) g.liste[i] = eintrag; else if (S.lbName || S.xp > 0) g.liste.push(eintrag); });
}
/* 6.83 (D): Jeder gespeicherte Spielstand trägt eine laufende Nummer „rev“. Hat ein anderes Fenster desselben Spielers inzwischen
   einen neueren Stand gespeichert, überschreibt dieses Fenster ihn nicht, sondern pausiert (sperren) – sonst würde ein alter Stand
   (weniger XP, ältere Zählung) den neuen ersetzen. */
let gesperrt = false;
function lsSchreiben() {
  if (gesperrt) return false;
  try {
    const alt = JSON.parse(localStorage.getItem(LS) || "null");
    if (alt && (alt.rev | 0) > (S.rev | 0)) { sperren(alt.lbName || S.lbName); return false; }
    try { talBuchen(); } catch (e) {}
    S.rev = (S.rev | 0) + 1; localStorage.setItem(LS, JSON.stringify(S));
  } catch (e) {}
  return true;
}
function save() {
  if (!lsSchreiben()) return;
  geraetSpeichern(); cloudSync();
}
/* Dieses Fenster anhalten: ein anderes Fenster spielt mit demselben Spieler weiter */
function sperren(name) {
  if (gesperrt) return; gesperrt = true;
  try { clearTimeout(lbTimer); clearTimeout(cloudTimer); } catch (e) {}
  document.querySelectorAll(".modal").forEach(m => m.remove());
  const m = modal(`<div class="label">Pausiert</div><h2>${esc(name || "Dieser Spieler")} spielt in einem anderen Fenster weiter</h2>
    <p class="muted small">Damit keine Punkte doppelt oder beim falschen Spieler gezählt werden, ist dieses Fenster angehalten. „Hier weiterspielen“ lädt den neuesten Stand.</p>
    <button class="btn primary" data-close="neu">Hier weiterspielen</button>`, () => location.reload());
  m.classList.add("frage");
}
addEventListener("storage", e => {
  if (e.key !== LS || !e.newValue || gesperrt) return;
  try { const v = JSON.parse(e.newValue); if ((v.rev | 0) > (S.rev | 0)) sperren(v.lbName || S.lbName); } catch (x) {}
});
/* Spieler wechseln: offene Übertragungen abschließen, dann mit dem anderen Spielstand neu starten */
/* 6.83 (A): Bis 6.82 wurden hier nur Rangliste und Spielstand abgeschickt – XP-Quellen und Protokoll blieben auf dem Gerät liegen,
   bis derselbe Spieler die App wieder öffnete. In der XP-Prüfung standen diese XP dann „ohne Quelle“. Jetzt geht alles mit. */
async function allesSenden() {
  const L = window.LB; if (!S.lbName || !S.pid || !L || !L.ok || S.offlineOnly) return;
  const auf = [L.push(S.pid, lbPayload(), {}).catch(() => {})];
  if (S.ownersSet && L.saveState) auf.push(L.saveState(S.pid, spielstandExport()).catch(() => {}));
  try { stiftSenden(); } catch (e) {}
  try { bethSenden(); } catch (e) {}
  if (S.xq && L.xpSetzen) auf.push(L.xpSetzen(S.pid, S.lbName, xqKuerzen(S.xq)).then(() => { S.xqSync = JSON.stringify(S.xq); lsSchreiben(); }).catch(e => xqNachholen(e)));
  auf.push(xqLogLeeren(S.pid, S.lbName, XQ_LOGKEY()));
  await Promise.all(auf);
}
async function spielerWechseln(key) {
  if (gesperrt) { location.reload(); return; }
  clearTimeout(lbTimer); clearTimeout(cloudTimer); save();
  if (S.lbName && window.LB && window.LB.ok) toast(`${svg("people")}<div><b>Speichere den Fortschritt von ${esc(S.lbName)} …</b></div>`);
  await Promise.race([allesSenden().catch(() => {}), new Promise(r => setTimeout(r, 6000))]);
  geraetSchreiben(g => { g.aktiv = key; });
  try { sessionStorage.setItem("bq-aktiv", key); sessionStorage.setItem("bq-gewaehlt", "1"); } catch (e) {}
  location.reload();
}
function neuerSpielerAufGeraet() {
  let key; do { key = "s" + Math.random().toString(36).slice(2, 7); } while (GERAET.liste.some(p => p.key === key));
  spielerWechseln(key);
}
/* Online-Kennung für einen neuen Ranglisten-Eintrag: die Gerätekennung – oder, wenn die schon
   ein anderer Spieler dieses Geräts nutzt, Gerätekennung + Anhang */
function neuePid() {
  const L = window.LB; const belegt = GERAET.liste.some(p => p.key !== GERAET.aktiv && p.pid === L.uid);
  if (!belegt) return L.uid;
  const z = "abcdefghijklmnopqrstuvwxyz0123456789"; let a = ""; for (let k = 0; k < 4; k++) a += z[Math.floor(Math.random() * z.length)];
  return L.uid + "-" + a;
}
const eigenePid = pid => { const L = window.LB; return !!(L && L.uid && pid && (pid === L.uid || pid.startsWith(L.uid + "-"))); };

/* ---------- Hilfen ---------- */
const $ = id => document.getElementById(id);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const dstr = d => d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
const today = () => dstr(new Date());
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dstr(d); };
const dayNum = s => { if (!s) return 0; const p = s.split("-").map(Number); return Math.round(Date.UTC(p[0], p[1] - 1, p[2]) / 864e5); };
const datumVon = n => new Date(n * 864e5 + 12 * 3600e3);
function weekKey(datum) { const d = datum ? new Date(datum) : new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7)); const w1 = new Date(d.getFullYear(), 0, 4); const w = 1 + Math.round(((d - w1) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7); return d.getFullYear() + "-W" + String(w).padStart(2, "0"); }
const esc = t => String(t == null ? "" : t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const cumAlt = n => 25 * (n - 1) * (n + 2);
/* 6.69: ab Level 46 gleichmäßig steiler (siehe XP_KNICK/XP_STEIGUNG in daten.js) */
const cum = n => { if (n <= XP_KNICK) return cumAlt(n); let t = cumAlt(XP_KNICK); for (let k = XP_KNICK + 1; k <= n; k++) t += Math.round(50 * k * (1 + XP_STEIGUNG * (k - XP_KNICK))); return t; };
function levelOf(xp) { let n = 1; while (cum(n + 1) <= xp) n++; return n; }
const titleOf = n => { const h = RAENGE_HOCH.find(([ab]) => n >= ab); if (h) return h[1]; return TITLES[Math.min(n, TITLES.length) - 1] + (n > TITLES.length ? " " + (n - TITLES.length + 1) : ""); };
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const vibrate = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
const hash = str => { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const streakNow = () => (S.lastDay === today() || S.lastDay === yesterday() ? S.streak : 0);
const armorCount = (owned = S.owned) => RUESTUNG.filter(r => owned.includes("ar-" + r.id)).length;
/* Zentrale Symbole aus index.html: Talent-Münze und Regenbogen (Laden-Kategorie Farben) */
ICONS.tal = '<use href="#i-tal"/>'; ICONS.regenbogen = '<use href="#i-regenbogen"/>';
const svg = (k, c) => `<svg viewBox="0 0 24 24" aria-hidden="true" style="color:${c || "currentColor"}">${ICONS[k] || ""}</svg>`;
/* 8.2: eigene Bereichsfarben – Solo = Violett, Zusammen = Koralle; die beiden Menschen-Symbole bekommen dieselben Farben (Verläufe aus „lohn“ bzw. „gemeinde“ umgefärbt) */
(function () {
  const host = document.getElementById("wr-defs"), defs = host && host.querySelector("defs");
  if (!defs || !ICONS.user || !ICONS.people) return;
  const kopie = (von, nach, tausch) => [...defs.children].filter(e => e.id && e.id.endsWith("_" + von)).forEach(e => {
    let h = e.outerHTML.replace(new RegExp("_" + von + "\\b", "g"), "_" + nach); Object.entries(tausch || {}).forEach(([a, b]) => { h = h.split(a).join(b); });
    defs.insertAdjacentHTML("beforeend", h); });
  kopie("lohn", "allein");
  kopie("gemeinde", "zus", { "#e6fff5": "#fff0e8", "#5fe0b0": "#ff8a5c", "#138a68": "#c0431f", "#2fb58a": "#e8643a", "#0b5a45": "#7a2410", "#a8f5d8": "#ffc9b0", "#139a72": "#c8481c", "#8ff0cc": "#ffb394" });
  ICONS.user = ICONS.user.replace(/gemeinde/g, "allein");
  ICONS.people = ICONS.people.replace(/gemeinde/g, "zus");
})();
const STAR = on => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="${on ? "#f2c14e" : "#3a4380"}"/></svg>`;
const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
/* Lernvers der Gemeinde für den laufenden Monat (statt „Vers des Tages“) */
function monatsversHtml() {
  const d = new Date(), k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  const v = typeof MONATSVERSE !== "undefined" && MONATSVERSE[k];
  return v ? `<figure class="vers monat klein"><span class="vers-label">Lernvers im ${MONATE[d.getMonth()]}</span><blockquote>${esc(v[0])}</blockquote><figcaption>${esc(v[1])} · ${VERS_QUELLE}</figcaption></figure>` : "";
}
const versHtml = (key, cls = "") => { const v = VERSE[key]; return v ? `<figure class="vers ${cls}"><blockquote>${esc(v[0])}</blockquote><figcaption>${esc(v[1])} · ${VERS_QUELLE}</figcaption></figure>` : ""; };
/* ---------- Lernvers des Monats: Vers-Lektion nach Duolingo-Art ----------
   Ausblende-Methode in 5 Stufen (jede Stufe verdeckt mehr, schwache Wörter bleiben länger verdeckt)
   + Monatsgerüst: Wochenziel, höchstens eine neue Stufe pro Tag, Übungstage, Monatsprüfung (= Bewahren) am Monatsende,
   frühere Lernverse tauchen in den Lektionen zur Wiederholung auf. */
const LV_MAX = 5;
const LV_STUFEN = ["Kennenlernen", "Ordnen", "Ergänzen", "Anfangsbuchstaben", "Auswendig"];
const LV_TAL = [5, 5, 5, 5, 10];   /* Talente beim ersten Erreichen von Stufe 1 … 5 – je Vers einmal */
const LV_BEWAHR_TAL = 15;          /* Monatsprüfung bestanden („Vers bewahrt“) */
const LV_BEWAHR_TAGE = 7;          /* Monatsprüfung geht in den letzten 7 Tagen des Monats */
const LEKTION_XP_FAKTOR = 0.25; /* Grund-XP einer Lektion: 75 % weniger (6.93) */
const LV_XP = 30, LV_XP_RICHTIG = 48; /* XP je Lektion + je Aufgabe, die beim ersten Versuch sitzt */
const LV_STUFEN_PRO_TAG = 1;       /* neue Stufen pro Tag – danach wird „gefestigt“ (XP, Übungstag) */
const LV_TURBO_QUOTE = 90;         /* Turbo: wer eine Lektion mit so viel % beim ersten Versuch schafft … */
const LV_STUFEN_TURBO = 3;         /* … darf am selben Tag bis zu so viele Stufen gehen und bekommt Bonus-Aufgaben */
const LV_PRUEF_QUOTE = 0.9;        /* Monatsprüfung: so viel vom Vers muss stimmen */
const LV_FREI_QUOTE = 0.85;        /* freies Aufsagen in den Lektionen */
const LV_WOCHENZIEL = [2, 3, 4, 5]; /* Ziel-Stufe in Woche 1 … 4 des Monats */
const monatKey = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
const monatName = k => MONATE[+k.slice(5) - 1] + (k.slice(0, 4) !== String(new Date().getFullYear()) ? " " + k.slice(0, 4) : "");
/* Umzug: bis Version 6.29 gab es 3 Stufen (Wörter im Kopf aufsagen) → auf die neuen 5 Stufen umrechnen */
function lvMig(v) { if (!v || v.v === 2) return v; const alt = [0, 2, 3, 5][Math.min(3, v.st || 0)]; return Object.assign({}, v, { st: alt, v: 2 }); }
if (S.lv) Object.keys(S.lv).forEach(k => { S.lv[k] = lvMig(S.lv[k]); });
const lvStand = k => { const s = (S.lv && S.lv[k]) || {}; return { st: s.st || 0, b: !!s.b, tage: s.tage || [], sw: s.sw || {}, auf: s.auf || "", an: s.an || 0, q: s.q || 0, qd: s.qd || "" }; };
function lvSetzen(k, neu) { if (!S.lv) S.lv = {}; S.lv[k] = Object.assign({ v: 2 }, S.lv[k] || {}, neu, { v: 2 }); }
const lvLetzterTag = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); };
const lvBewahrAb = () => lvLetzterTag() - LV_BEWAHR_TAGE + 1;
const lvBewahrFenster = k => k === monatKey() && new Date().getDate() >= lvBewahrAb();
const lvWoche = () => Math.min(4, Math.ceil(new Date().getDate() / 7));
const lvZiel = () => LV_WOCHENZIEL[lvWoche() - 1];
const lvHeuteNeu = k => { const s = lvStand(k); return s.auf === today() ? s.an : 0; };
const lvTurbo = k => { const s = lvStand(k); return s.qd === today() && s.q >= LV_TURBO_QUOTE; };
const lvStufeFrei = k => lvStand(k).st < LV_MAX && (lvHeuteNeu(k) < LV_STUFEN_PRO_TAG || (lvTurbo(k) && lvHeuteNeu(k) < LV_STUFEN_TURBO));
const lvMonatsTage = k => { const s = lvStand(k), [y, m] = k.split("-").map(Number); return s.tage.filter(n => { const d = datumVon(n); return d.getFullYear() === y && d.getMonth() + 1 === m; }).length; };

/* ----- Wörter & Vergleich (tolerant: Groß/klein, Satzzeichen, Umlaute, ein Tippfehler bei langen Wörtern) ----- */
const lvKern = w => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
const lvNorm = w => lvKern(String(w).replace(/[\u00ad\u200b-\u200f\u2060\ufeff]/g, "")).toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
const lvIstWort = w => /[\p{L}\p{N}]/u.test(w);
function lvAbstand(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  let p = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) { const q = [i]; for (let j = 1; j <= b.length; j++) q[j] = Math.min(p[j] + 1, q[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = q; }
  return p[b.length];
}
/* „das“, „dass“ und „daß“ gelten untereinander als gleich (ß wird in lvNorm schon zu ss) */
const lvDass = t => t === "dass" ? "das" : t;
function lvGleich(a, b) { const x = lvDass(lvNorm(a)), y = lvDass(lvNorm(b)); return x === y || (y.length >= 5 && lvAbstand(x, y) <= 1); }
/* Wie viel vom Vers stimmt? Längste gemeinsame Wortfolge → Anteil + welche Zielwörter getroffen wurden */
function lvVergleich(eingabe, ziel) {
  const a = eingabe.split(/\s+/).filter(lvIstWort), z = ziel.split(" ").map((w, i) => ({ w, i })).filter(x => lvIstWort(x.w));
  const L = Array.from({ length: a.length + 1 }, () => new Array(z.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = z.length - 1; j >= 0; j--) L[i][j] = lvGleich(a[i], z[j].w) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const treffer = new Set(); let i = 0, j = 0;
  while (i < a.length && j < z.length) { if (lvGleich(a[i], z[j].w)) { treffer.add(z[j].i); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
  const extra = Math.max(0, a.length - treffer.size);
  return { anteil: z.length ? Math.max(0, (treffer.size - extra * 0.5) / z.length) : 0, treffer };
}
/* Welche Wörter werden verdeckt? Schwache Wörter zuerst, sonst gleichmäßig verteilt (feste Reihenfolge je Vers) */
function lvVerdeckt(text, anteil, sw = {}) {
  const w = text.split(" "), kand = w.map((_, i) => i).filter(i => (anteil >= 1 || i > 0) && lvIstWort(w[i]));
  if (anteil >= 1) return new Set(kand);
  const n = Math.max(1, Math.round(kand.length * anteil)), o = hash(text) % 4, prio = [1, 3, 0, 2];
  return new Set(kand.map((i, m) => ({ i, r: prio.indexOf((m + o) % 4) * 1000 + m, s: -(sw[i] || 0) }))
    .sort((a, b) => a.s - b.s || a.r - b.r).slice(0, n).map(x => x.i));
}
const LV_ANTEIL = [0, 0.25, 0.25, 0.5, 0.75, 1];
const lvAlleVerse = () => [...Object.values(MONATSVERSE), ...Object.values(VERSE)];
function lvFremdWoerter(text) {
  const eigene = new Set(text.split(" ").map(lvNorm)), raus = new Set();
  lvAlleVerse().forEach(v => v[0].split(" ").forEach(w => { const k = lvKern(w); if (k.length >= 3 && !eigene.has(lvNorm(k))) raus.add(k); }));
  return [...raus];
}
/* Ein ähnliches Ersatzwort: gleiche Groß-/Kleinschreibung, ähnliche Länge */
function lvErsatz(wort, text) {
  const gross = /^\p{Lu}/u.test(wort), pool = lvFremdWoerter(text).filter(w => /^\p{Lu}/u.test(w) === gross);
  const nah = pool.filter(w => Math.abs(w.length - wort.length) <= 2);
  return pick(nah.length >= 3 ? nah : pool.length ? pool : ["Licht"]);
}
/* Vers an einem Satzzeichen nahe der Mitte teilen */
function lvTeilung(text) {
  const w = text.split(" "), mitte = w.length / 2; let best = -1, d = 99;
  w.forEach((x, i) => { if (i > 0 && i < w.length - 2 && /[,;:.!?—–]$/.test(x) && Math.abs(i + 1 - mitte) < d) { best = i + 1; d = Math.abs(i + 1 - mitte); } });
  if (best < 2 || d > w.length / 4) best = Math.round(mitte);
  if (w[best] && !lvIstWort(w[best])) best++;
  return [w.slice(0, best).join(" "), w.slice(best).join(" ")];
}
/* Stellenangabe ändern: gleiche Schrift, andere Zahlen (für schwere Stufen) */
function lvStelleAehnlich(ref) {
  const m = /^(.*?)(\d+),(\d+)$/.exec(ref); if (!m) return [];
  const k = +m[2], v = +m[3], tausch = String(v).length === 2 ? +String(v).split("").reverse().join("") : v + 2;
  return [...new Set([`${m[1]}${k},${tausch}`, `${m[1]}${k + 1},${v}`, `${m[1]}${Math.max(1, k - 1)},${v}`, `${m[1]}${k},${v + 1}`])].filter(r => r !== ref);
}

/* ----- Aufgaben einer Lektion ----- */
function lvAufgaben(k, stufe, modus, bonus) {
  const [text, ref] = MONATSVERSE[k], s = lvStand(k), sw = s.sw;
  const a = [], A = (typ, x = {}) => a.push(Object.assign({ typ, k, stufe }, x));
  if (modus === "pruefung") { A("stelle", { schwer: true }); A("frei", { hilfe: false, quote: LV_PRUEF_QUOTE }); return a; } /* auch hier: leicht → schwer */
  const anteil = LV_ANTEIL[stufe];
  if (stufe === 1) { A("lesen"); A("fortsetzung"); A("stelle"); A("luecke", { anteil: 0.25 }); A("kacheln", { teil: 0 }); A("fehler"); A("kacheln", { teil: 1 }); }
  else if (stufe === 2) { A("kacheln", { teil: 0 }); A("luecke", { anteil }); A("kacheln", { teil: 1 }); A("fehler"); A("stelle"); A("kacheln", { stoer: 0 }); }
  else if (stufe === 3) { A("luecke", { anteil }); A("kacheln", { stoer: 2 }); A("fortsetzung", { schwer: true }); A("fehler"); A("luecke", { anteil, sw }); A("stelle"); }
  else if (stufe === 4) { A("tippen", { anteil, buchstabe: true }); A("kacheln", { stoer: 3 }); A("luecke", { anteil, sw }); A("stelle", { schwer: true }); A("tippen", { anteil, buchstabe: true, sw }); }
  else { A("tippen", { anteil: 0.75, sw }); A("frei", { hilfe: true, quote: LV_FREI_QUOTE }); A("stelle", { schwer: true }); A("kacheln", { stoer: 3 }); A("tippen", { anteil: 1, buchstabe: true }); }
  /* Wiederholung: ein früherer Lernvers, der schon geübt wurde */
  const frueher = Object.keys(MONATSVERSE).filter(x => x < k && lvStand(x).st >= 2);
  if (frueher.length) { const f = pick(frueher), fs = lvStand(f).st; a.splice(Math.min(a.length, 3), 0, { typ: pick(fs >= 4 ? ["stelle", "luecke", "fortsetzung"] : ["stelle", "fortsetzung"]), k: f, stufe: fs, anteil: 0.5, schwer: fs >= 4, wdh: true }); }
  /* Turbo: zwei Bonus-Aufgaben aus der nächsten (bzw. schwersten) Stufe */
  if (bonus) {
    const extra = { 1: [["kacheln", { stoer: 0 }], ["luecke", { anteil: 0.25 }]], 2: [["luecke", { anteil: 0.5 }], ["kacheln", { stoer: 2 }]], 3: [["tippen", { anteil: 0.75, buchstabe: true }], ["kacheln", { stoer: 3 }]],
      4: [["tippen", { anteil: 1, buchstabe: true }], ["frei", { hilfe: true, quote: LV_FREI_QUOTE }]], 5: [["tippen", { anteil: 1 }], ["frei", { hilfe: false, quote: LV_FREI_QUOTE }]] }[stufe];
    extra.forEach(([typ, x]) => a.push(Object.assign({ typ, k, stufe: Math.min(LV_MAX, stufe + 1), bonus: true, sw }, x)));
  }
  /* Reihenfolge innerhalb der Lektion: immer von leicht nach schwer (stabil – gleich schwere Aufgaben behalten ihre Reihenfolge) */
  void ref; return a.map((x, i) => [x, i]).sort((p, q) => lvSchwer(p[0]) - lvSchwer(q[0]) || p[1] - q[1]).map(p => p[0]);
}
/* Schwierigkeit einer Aufgabe (0 = leicht … 100 = sehr schwer): Wiedererkennen < Ordnen < Lücken wählen < Tippen < freies Aufsagen.
   Mehr verdeckte Wörter, falsche Störwörter, ähnliche Antworten und fehlende Hilfen machen eine Aufgabe schwerer. */
function lvSchwer(a) {
  const an = a.anteil || 0;
  switch (a.typ) {
    case "lesen": return 0;
    case "stelle": return a.schwer ? 42 : 12;
    case "fortsetzung": return a.schwer ? 45 : 10;
    case "fehler": return 25;
    case "luecke": return 18 + an * 40;
    case "kacheln": return (a.teil != null ? 20 : 30) + (a.stoer || 0) * 5;
    case "tippen": return 50 + an * 30 + (a.buchstabe ? 0 : 6);
    case "frei": return a.hilfe ? 88 : 100;
    default: return 50;
  }
}

/* ----- Lektion (eigene Ansicht, eine Aufgabe pro Bildschirm) ----- */
let VL = null;
const LV_SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
function vlStart(arg) {
  const [k0, art] = String(arg || "").split("|"), k = MONATSVERSE[k0] ? k0 : monatKey();
  if (!MONATSVERSE[k]) { go("lernverse"); return; }
  const s = lvStand(k), pruefung = art === "pruefung" && k === monatKey() && s.st >= LV_MAX && !s.b && lvBewahrFenster(k);
  const neu = !pruefung && lvStufeFrei(k), stufe = pruefung ? LV_MAX : neu ? s.st + 1 : Math.max(1, s.st);
  const bonus = !pruefung && lvTurbo(k);
  VL = { t0: Date.now(), k, stufe, bonus, modus: pruefung ? "pruefung" : neu ? "lernen" : "festigen", liste: lvAufgaben(k, stufe, pruefung ? "pruefung" : "lernen", bonus), i: 0, gesamt: 0, ersteRichtig: 0, fehlerWoerter: {}, wiederholt: new Set(), serie: 0, durchfall: false };
  VL.gesamt = VL.liste.length;
  document.body.classList.add("spiel-laeuft");
  /* 9.45: Countdown (3 · 2 · 1 · LOS) im Saphirblau des Lernvers – wie bei den Ketten und beim Blitz */
  const L = VL;
  countdown(() => { if (VL !== L) return; VL.t0 = Date.now(); vlZeige(); },
    cdSolo("vers", { name: "Lernvers " + monatName(k), modus: pruefung ? "Monatsprüfung" : neu ? "Neue Stufe" : "Festigen", sub: `Stufe ${stufe} · ${LV_STUFEN[stufe - 1]}` }));
}
function vlKopf() {
  const fertig = Math.min(VL.i, VL.gesamt) / VL.gesamt;
  return `<div class="vl-kopf"><button class="vl-x" id="vlX" aria-label="Lektion beenden">${svg("back")}</button>
    <div class="vl-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(fertig * 100)}"><i style="width:${fertig * 100}%"></i></div>
    <span class="vl-serie ${VL.serie >= 3 ? "an" : ""}" aria-label="${VL.serie} richtig in Folge">${svg("fire")}${VL.serie}</span></div>`;
}
function vlTitel(a) {
  if (a.wdh) return `<span class="vl-titel wdh">${svg("step")} Wiederholung · Lernvers ${esc(monatName(a.k))}</span>`;
  if (VL.modus === "pruefung") return `<span class="vl-titel pruef">${svg("siegel")} Monatsprüfung</span>`;
  if (a.bonus) return `<span class="vl-titel bonus">${svg("bolt")} Bonus · Turbo · Stufe ${a.stufe}</span>`;
  return `<span class="vl-titel">Stufe ${VL.stufe} · ${LV_STUFEN[VL.stufe - 1]}${VL.modus === "festigen" ? " · festigen" : ""}</span>`;
}
function vlZeige() {
  if (!VL) return;
  if (VL.i >= VL.liste.length) return vlEnde();
  const a = VL.liste[VL.i], [text, ref] = MONATSVERSE[a.k];
  let frage = "", inhalt = "", fuss = `<button class="btn primary breit" id="vlPruefen" disabled>Prüfen</button>`;
  const verdeckt = a.anteil != null ? lvVerdeckt(text, a.anteil, a.sw || {}) : null;
  if (a.typ === "lesen") {
    frage = "Lies den Lernvers – oder hör ihn dir an";
    inhalt = `<blockquote class="vl-vers">${esc(text)}</blockquote><div class="vl-ref">${esc(ref)} · ${VERS_QUELLE}</div>
      <button class="lv-btn vl-hoer" id="vlHoer">${svg("sound")} Vorlesen</button>`;
    fuss = `<button class="btn primary breit" id="vlWeiter">Los geht's</button>`;
  } else if (a.typ === "fortsetzung") {
    const [vorn, hinten] = lvTeilung(text);
    if (!a.opts) {
      let falsch;
      if (a.schwer) {
        const w = hinten.split(" "), idx = w.map((x, i) => i).filter(i => lvKern(w[i]).length >= 3);
        const f1 = w.slice(); const i1 = pick(idx); f1[i1] = w[i1].replace(lvKern(w[i1]), lvErsatz(lvKern(w[i1]), text));
        const f2 = w.slice(); const i2 = pick(idx.filter(i => i !== i1)) ?? i1; f2[i2] = w[i2].replace(lvKern(w[i2]), lvErsatz(lvKern(w[i2]), text));
        falsch = [f1.join(" "), f2.join(" ")];
      } else falsch = shuffle(lvAlleVerse().filter(v => v[0] !== text).map(v => lvTeilung(v[0])[1])).slice(0, 2);
      a.opts = shuffle([hinten, ...falsch.filter(x => x !== hinten)]); a.loesung = hinten;
    }
    frage = "Wie geht der Vers weiter?";
    inhalt = `<blockquote class="vl-vers">${esc(vorn)} <span class="vl-pkt">…</span></blockquote>
      <div class="vl-wahl">${a.opts.map((o, j) => `<button class="vl-opt" data-o="${j}">… ${esc(o)}</button>`).join("")}</div>`;
  } else if (a.typ === "stelle") {
    if (!a.opts) {
      const andere = a.schwer ? lvStelleAehnlich(ref) : [...new Set(lvAlleVerse().map(v => v[1]).filter(r => r !== ref))];
      a.opts = shuffle([ref, ...shuffle(andere).slice(0, 2)]); a.loesung = ref;
    }
    frage = "Wo steht dieser Vers?";
    inhalt = `<blockquote class="vl-vers">${esc(text)}</blockquote>
      <div class="vl-wahl">${a.opts.map((o, j) => `<button class="vl-opt" data-o="${j}">${esc(o)}</button>`).join("")}</div>`;
  } else if (a.typ === "fehler") {
    if (a.tausch == null) {
      const w = text.split(" "), kand = w.map((_, i) => i).filter(i => i > 0 && lvKern(w[i]).length >= 3);
      a.tausch = pick(kand); a.falsch = lvErsatz(lvKern(w[a.tausch]), text);
    }
    frage = "Ein Wort ist falsch – tippe es an";
    inhalt = `<div class="vl-vers vl-fehler">${text.split(" ").map((w, i) => { const zeige = i === a.tausch ? w.replace(lvKern(w), a.falsch) : w; return lvIstWort(w) ? `<button class="vl-wort" data-w="${i}">${esc(zeige)}</button>` : esc(w); }).join(" ")}</div>`;
    fuss = `<button class="btn primary breit" id="vlPruefen" disabled>Prüfen</button>`;
  } else if (a.typ === "luecke") {
    a.offen = a.offen || [...verdeckt].sort((x, y) => x - y); a.pos = a.pos || 0; a.fehler = a.fehler || 0;
    const w = text.split(" "), aktiv = a.offen[a.pos];
    if (a.opts == null || a.optsFuer !== aktiv) {
      const richtigesWort = lvKern(w[aktiv]);
      const eigene = shuffle([...verdeckt].map(i => lvKern(w[i])).filter(x => lvNorm(x) !== lvNorm(richtigesWort)));
      const frem = shuffle(lvFremdWoerter(text));
      a.opts = shuffle([richtigesWort, ...[...new Set([...eigene, ...frem])].slice(0, 2)]); a.optsFuer = aktiv;
    }
    frage = "Fülle die Lücken";
    inhalt = `<div class="vl-vers vl-lueckentext">${w.map((x, i) => {
      if (!verdeckt.has(i)) return esc(x);
      const m = x.match(/^(.*?)([.,;:!?»«„“"'’)]*)$/u);
      if (a.offen.indexOf(i) < a.pos) return `<span class="vl-gefuellt${(a.fehlStellen || {})[i] ? " fehlte" : ""}">${esc(m[1])}</span>${esc(m[2])}`;
      return `<span class="vl-loch ${i === aktiv ? "jetzt" : ""}"></span>${esc(m[2])}`;
    }).join(" ")}</div>
      <div class="vl-chips">${a.opts.map((o, j) => `<button class="chip" data-o="${j}">${esc(o)}</button>`).join("")}</div>`;
    fuss = "";
  } else if (a.typ === "kacheln") {
    const w = text.split(" ");
    let von = 0, bis = w.length, vorher = "", nachher = "";
    if (a.teil != null) { const [v1] = lvTeilung(text), n1 = v1.split(" ").length; if (a.teil === 0) { bis = n1; nachher = w.slice(n1).join(" "); } else { von = n1; vorher = w.slice(0, n1).join(" "); } }
    if (!a.ziel) {
      a.ziel = w.slice(von, bis).filter(lvIstWort).map(lvKern);
      const stoer = shuffle(lvFremdWoerter(text)).slice(0, a.stoer || 0);
      a.kacheln = shuffle([...a.ziel, ...stoer].map((t, j) => ({ t, j }))); a.gelegt = [];
    }
    frage = a.teil != null ? "Setze den Teil des Verses zusammen" : a.stoer ? "Setze den Vers zusammen – Vorsicht, falsche Wörter dabei!" : "Setze den Vers zusammen";
    inhalt = `${vorher ? `<div class="vl-kontext">${esc(vorher)} …</div>` : ""}
      <div class="vl-antwort" id="vlAntwort">${a.gelegt.map(j => `<button class="chip gelegt" data-z="${j}">${esc(a.kacheln.find(x => x.j === j).t)}</button>`).join("") || `<span class="vl-leer">Tippe die Wörter in der richtigen Reihenfolge an</span>`}</div>
      ${nachher ? `<div class="vl-kontext">… ${esc(nachher)}</div>` : ""}
      <div class="vl-chips">${a.kacheln.map(x => `<button class="chip ${a.gelegt.includes(x.j) ? "weg" : ""}" data-k="${x.j}" ${a.gelegt.includes(x.j) ? "disabled" : ""}>${esc(x.t)}</button>`).join("")}</div>`;
  } else if (a.typ === "tippen") {
    const w = text.split(" ");
    frage = a.buchstabe ? "Ergänze die fehlenden Wörter – der erste Buchstabe hilft" : "Ergänze die fehlenden Wörter";
    inhalt = `<div class="vl-vers vl-tipptext">${w.map((x, i) => {
      if (!verdeckt.has(i)) return esc(x);
      const m = x.match(/^(.*?)([.,;:!?»«„“"'’)]*)$/u);
      return `<input class="vl-feld" data-i="${i}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="next" aria-label="Wort ${i + 1}" placeholder="${a.buchstabe ? esc(m[1][0]) + "…" : ""}">${esc(m[2])}`;
    }).join(" ")}</div>`;
  } else if (a.typ === "frei") {
    frage = VL.modus === "pruefung" ? "Schreib den ganzen Vers auswendig auf" : "Sag den Vers auswendig auf – tippen oder sprechen";
    const hilfe = a.hilfe ? text.split(" ").map(x => lvIstWort(x) ? lvKern(x)[0] + x.slice(lvKern(x).length + x.indexOf(lvKern(x))) : x).join(" ") : "";
    inhalt = `<div class="vl-ref gross">${esc(ref)}</div>
      <textarea class="vl-frei" id="vlFrei" rows="4" autocomplete="off" autocapitalize="sentences" spellcheck="false" placeholder="Den Vers hier eintippen …"></textarea>
      <div class="vl-hilfen">${LV_SR ? `<button class="lv-btn" id="vlMik">${svg("mikro")} Sprechen</button>` : ""}${a.hilfe ? `<button class="lv-btn" id="vlTipp">${svg("eye")} Anfangsbuchstaben</button>` : ""}</div>
      ${a.hilfe ? `<div class="vl-anfang" id="vlAnfang" hidden>${esc(hilfe)}</div>` : ""}`;
  }
  screen.innerHTML = `<div class="vl">${vlKopf()}${vlTitel(a)}<h2 class="vl-frage">${frage}</h2><div class="vl-inhalt">${inhalt}</div><div class="vl-fuss">${fuss}</div></div>`;
  vlVerdrahten(a, verdeckt);
}
function vlVerdrahten(a, verdeckt) {
  const [text, ref] = MONATSVERSE[a.k], P = $("vlPruefen");
  $("vlX").onclick = () => {
    SFX.tap();
    if (VL.i === 0) { VL = null; go(heimAnsicht("home")); return; }
    modal(`<div class="label">Lektion beenden?</div><h2>Fast geschafft!</h2><p class="muted">Wenn du jetzt aufhörst, zählt diese Lektion noch nicht.</p>
      <button class="btn primary" data-close="weiter">Weiterlernen</button><button class="btn ghost" data-close="ende">Beenden</button>`, r => { if (r === "ende") { VL = null; go(heimAnsicht("home")); } });
  };
  if ($("vlWeiter")) $("vlWeiter").onclick = () => { SFX.tap(); vorlesenStop(); VL.i++; vlZeige(); };
  if ($("vlHoer")) $("vlHoer").onclick = () => { const beat = S.beat; S.beat = false; vorlesen([{ text: text + " – " + ref.replace(/(\d+),(\d+)/, "$1, Vers $2") }]); S.beat = beat; };
  let wahl = null;
  screen.querySelectorAll(".vl-opt").forEach(b => b.onclick = () => { SFX.tap(); wahl = +b.dataset.o; screen.querySelectorAll(".vl-opt").forEach(x => x.classList.toggle("gewaehlt", x === b)); P.disabled = false; });
  screen.querySelectorAll(".vl-wort").forEach(b => b.onclick = () => { SFX.tap(); wahl = +b.dataset.w; screen.querySelectorAll(".vl-wort").forEach(x => x.classList.toggle("gewaehlt", x === b)); P.disabled = false; });
  if (a.typ === "luecke") screen.querySelectorAll(".vl-chips .chip").forEach(b => b.onclick = () => {
    const w = text.split(" "), aktiv = a.offen[a.pos], ok = lvGleich(a.opts[+b.dataset.o], w[aktiv]);
    if (ok) {
      SFX.right(a.pos); vibrate(10); a.pos++; a.opts = null;
      if (a.pos >= a.offen.length) {
        /* letztes Wort sichtbar in die Lücke setzen, bevor das Urteil erscheint */
        const loch = screen.querySelector(".vl-loch.jetzt"), m = w[aktiv].match(/^(.*?)([.,;:!?»«„“"'’)]*)$/u);
        if (loch) loch.outerHTML = `<span class="vl-gefuellt${(a.fehlStellen || {})[aktiv] ? " fehlte" : ""}">${esc(m[1])}</span>`;
        const n = a.fehler, st = Object.keys(a.fehlStellen || {}).map(Number).sort((x, y) => x - y);
        const wo = st.map(i => `<span class="vu-fehlwort">${esc(lvKern(w[i]))}</span>${a.fehlStellen[i] > 1 ? ` (${a.fehlStellen[i]}×)` : ""}`).join(", ");
        vlUrteil(a, n === 0, n ? `Alle Lücken sind jetzt richtig. Fehlversuch${st.length > 1 ? "e" : ""} bei: ${wo} – im Vers orange markiert.` : null, true);
      } else vlZeige();
    }
    else { a.fehler++; a.fehlStellen = a.fehlStellen || {}; a.fehlStellen[aktiv] = (a.fehlStellen[aktiv] || 0) + 1; vlFehlerWort(a.k, aktiv); SFX.wrong(); vibrate([40, 30, 40]); b.classList.remove("no"); void b.offsetWidth; b.classList.add("no"); b.disabled = true; }
  });
  if (a.typ === "kacheln") {
    const neu = () => { vlZeige(); };
    screen.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { SFX.tap(); a.gelegt.push(+b.dataset.k); neu(); });
    screen.querySelectorAll("[data-z]").forEach(b => b.onclick = () => { SFX.tap(); a.gelegt = a.gelegt.filter(j => j !== +b.dataset.z); neu(); });
    if (P) P.disabled = !a.gelegt.length;
  }
  if (a.typ === "tippen") {
    const felder = [...screen.querySelectorAll(".vl-feld")];
    const pruef = () => { P.disabled = !felder.some(f => f.value.trim()); };
    /* Handy-Tastaturen melden die Leertaste oft nicht als " " – deshalb am Eingabetext erkennen:
       Wort + Leerzeichen → Rest in die folgenden (direkt anschließenden) Lücken verteilen und weiterspringen */
    /* Die Leertaste springt immer zur NÄCHSTEN Lücke – auch wenn dazwischen ein (oder mehrere) schon sichtbare Wörter stehen,
       und auch aus einer noch leeren Lücke. Nach der letzten Lücke springt sie zum Knopf „Prüfen“ (nochmal Leertaste = prüfen). */
    const weiter = j => {
      if (felder[j + 1]) felder[j + 1].focus();
      else if (!P.disabled) P.focus();
      else felder[j].focus();
    };
    const verteilen = (j) => {
      const f = felder[j], v = f.value;
      if (/^\s+$/.test(v)) { f.value = ""; weiter(j); return; }            /* nur Leerzeichen getippt → nächste Lücke */
      if (!/\S\s/.test(v)) return;
      const teile = v.trim().split(/\s+/).filter(Boolean); f.value = teile[0];
      let k = j;
      for (const t of teile.slice(1)) {                                      /* mehrere Wörter auf einmal: nur in direkt anschließende Lücken verteilen */
        const nx = felder[k + 1];
        if (!nx || +nx.dataset.i !== +felder[k].dataset.i + 1) break;
        nx.value = t; k++;
      }
      weiter(k);                                                              /* … und dann zur nächsten Lücke, egal ob ein Wort dazwischen steht */
    };
    felder.forEach((f, j) => {
      f.oninput = () => { pruef(); verteilen(j); pruef(); };
      f.onkeydown = e => {
        if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); weiter(j); }
        else if (e.key === "Enter") { e.preventDefault(); if (felder[j + 1]) felder[j + 1].focus(); else if (!P.disabled) P.click(); }
      };
    });
    if (felder[0] && !matchMedia("(pointer: coarse)").matches) felder[0].focus();
  }
  if (a.typ === "frei") {
    const t = $("vlFrei"); t.oninput = () => { P.disabled = !t.value.trim(); };
    if ($("vlTipp")) $("vlTipp").onclick = () => { SFX.tap(); a.tippGenutzt = true; $("vlAnfang").hidden = !$("vlAnfang").hidden; };
    if ($("vlMik")) $("vlMik").onclick = () => {
      const b = $("vlMik"); if (b.classList.contains("hoert")) { try { VL.sr && VL.sr.stop(); } catch (e) {} return; }
      try {
        const sr = new LV_SR(); VL.sr = sr; sr.lang = "de-DE"; sr.interimResults = true; sr.continuous = true; const basis = t.value ? t.value.trim() + " " : "";
        sr.onresult = e => { let x = ""; for (let r = 0; r < e.results.length; r++) x += e.results[r][0].transcript; t.value = basis + x.trim(); P.disabled = !t.value.trim(); };
        sr.onend = () => { b.classList.remove("hoert"); b.innerHTML = `${svg("mikro")} Sprechen`; };
        sr.onerror = ev => { if (ev.error === "not-allowed") toast(`${svg("music", "var(--muted)")}<div>Mikrofon nicht erlaubt – du kannst den Vers auch eintippen.</div>`); };
        sr.start(); b.classList.add("hoert"); b.innerHTML = `${svg("stop")} Fertig`;
      } catch (e) { toast(`${svg("music", "var(--muted)")}<div>Spracherkennung geht hier nicht – bitte eintippen.</div>`); }
    };
  }
  if (!P) return;
  P.onclick = () => {
    if (P.disabled) return;
    if (a.typ === "fortsetzung" || a.typ === "stelle") return vlUrteil(a, a.opts[wahl] === a.loesung, a.loesung);
    if (a.typ === "fehler") { const w = text.split(" "); return vlUrteil(a, wahl === a.tausch, `„${lvKern(w[a.tausch])}“ statt „${a.falsch}“`); }
    if (a.typ === "kacheln") {
      const gelegt = a.gelegt.map(j => a.kacheln.find(x => x.j === j).t), ok = gelegt.length === a.ziel.length && gelegt.every((t, j) => lvNorm(t) === lvNorm(a.ziel[j]));
      if (!ok) { const j = a.ziel.findIndex((t, j) => !gelegt[j] || lvNorm(gelegt[j]) !== lvNorm(t)); if (j > -1) vlFehlerWortText(a.k, a.ziel[j]); } /* nur die erste falsche Stelle merken */
      return vlUrteil(a, ok, a.ziel.join(" "));
    }
    if (a.typ === "tippen") {
      const w = text.split(" "); let ok = true; const falsche = [], abweich = [];
      screen.querySelectorAll(".vl-feld").forEach(f => { const i = +f.dataset.i, eing = f.value.trim(), gut = lvGleich(eing, w[i]); f.classList.add(gut ? "gut" : "falsch"); f.readOnly = true; if (!gut) { ok = false; falsche.push([eing, lvKern(w[i])]); vlFehlerWort(a.k, i); f.value = lvKern(w[i]); } else if (lvKern(eing) !== lvKern(w[i]) && lvNorm(eing) !== lvNorm(w[i]) && lvDass(lvNorm(eing)) === lvDass(lvNorm(w[i]))) abweich.push([eing, lvKern(w[i])]); });
      const paar = ([d, r]) => `<span class="vu-ersatz">${d ? esc(d) : "<i>leer</i>"} → <b>${esc(r)}</b></span>`;
      const liste = falsche.slice(0, 6).map(paar).join(" · ") + (falsche.length > 6 ? ` · … +${falsche.length - 6}` : "");
      /* „dass“ für „das“ (und umgekehrt) zählt als richtig – der Hinweis zeigt aber die Schreibweise im Vers */
      const hinweis = abweich.length ? `<br><small>Gilt als richtig – im Vers steht: ${abweich.map(paar).join(" · ")}</small>` : "";
      if (ok) return vlUrteil(a, true, abweich.length ? `Gilt als richtig – im Vers steht: ${abweich.map(paar).join(" · ")}` : null, true);
      return vlUrteil(a, false, `Nicht alle Wörter stimmten – die roten Felder zeigen die richtigen.<br><small>${liste}</small>${hinweis}`, true);
    }
    if (a.typ === "frei") {
      try { VL.sr && VL.sr.stop(); } catch (e) {}
      const r = lvVergleich($("vlFrei").value, text), ok = r.anteil >= a.quote;
      text.split(" ").forEach((w, i) => { if (lvIstWort(w) && !r.treffer.has(i)) vlFehlerWort(a.k, i); });
      const markiert = text.split(" ").map((w, i) => !lvIstWort(w) ? esc(w) : `<span class="${r.treffer.has(i) ? "t-ja" : "t-nein"}">${esc(w)}</span>`).join(" ");
      return vlUrteil(a, ok, `<span class="vl-prozent">${Math.round(Math.min(1, r.anteil) * 100)} % richtig</span><span class="vl-markiert">${markiert}</span>`, true);
    }
  };
}
/* Schwache Wörter merken (für die Ausblende-Reihenfolge) */
function vlFehlerWort(k, i) { const s = lvStand(k), sw = Object.assign({}, s.sw); sw[i] = Math.min(9, (sw[i] || 0) + 1); lvSetzen(k, { sw }); }
function vlFehlerWortText(k, t) { const i = MONATSVERSE[k][0].split(" ").findIndex(w => lvNorm(w) === lvNorm(t)); if (i > -1) vlFehlerWort(k, i); }
/* Urteil wie bei Duolingo: Leiste unten, grün oder rot, mit Lösung; Fehler kommen am Ende nochmal */
function vlUrteil(a, ok, loesung, html) {
  const erster = !a.versuch; a.versuch = (a.versuch || 0) + 1;
  if (ok) { if (erster) { VL.ersteRichtig++; VL.serie++; } SFX.right(Math.min(VL.serie, 12)); vibrate(12); }
  else {
    VL.serie = 0; if (VL.modus === "pruefung") VL.durchfall = true; SFX.wrong(); vibrate([40, 30, 40]); shakeScreen();
    /* Fehler-Wiederholung: Aufgabe kommt (höchstens zweimal) am Ende der Lektion nochmal – neu gemischt */
    if (VL.modus !== "pruefung" && a.versuch < 3) { const kopie = Object.assign({}, a); ["opts", "loesung", "tausch", "falsch", "ziel", "kacheln", "gelegt", "offen", "pos", "fehler", "optsFuer", "tippGenutzt", "fehlStellen"].forEach(x => delete kopie[x]); VL.liste.push(kopie); }
  }
  screen.querySelectorAll(".vl-opt, .vl-wort, .vl-chips .chip, [data-z], textarea, .vl-feld").forEach(x => { if (x.tagName === "TEXTAREA" || x.classList.contains("vl-feld")) x.readOnly = true; else x.disabled = true; });
  if (a.typ === "fortsetzung" || a.typ === "stelle") screen.querySelectorAll(".vl-opt").forEach(b => { const o = a.opts[+b.dataset.o]; if (o === a.loesung) b.classList.add("richtig"); else if (b.classList.contains("gewaehlt")) b.classList.add("falsch"); });
  if (a.typ === "fehler") screen.querySelectorAll(".vl-wort").forEach(b => { if (+b.dataset.w === a.tausch) b.classList.add("richtig"); else if (b.classList.contains("gewaehlt")) b.classList.add("falsch"); });
  const lob = ["Richtig!", "Sehr gut!", "Super!", "Genau!", "Stark!"], fuss = screen.querySelector(".vl-fuss");
  const nochmal = !ok && VL.modus !== "pruefung" && a.versuch < 3;
  fuss.innerHTML = `<div class="vl-urteil ${ok ? "ok" : "nein"}" role="status">
    <div class="vu-kopf">${svg(ok ? "check" : "nein")}<b>${ok ? (VL.serie >= 3 ? `${VL.serie} in Folge!` : pick(lob)) : a.typ === "frei" && VL.modus === "pruefung" ? "Noch nicht ganz" : "Nicht ganz"}</b></div>
    ${loesung ? `<div class="vu-loesung">${ok ? "" : html ? "" : "Richtig wäre: "}${html ? loesung : esc(loesung)}</div>` : ""}
    ${nochmal ? `<div class="vu-info">Kommt am Ende der Lektion nochmal.</div>` : ""}
    <button class="btn ${ok ? "primary" : "rot"} breit" id="vlNaechste">Weiter</button></div>`;
  const n = $("vlNaechste"); n.focus({ preventScroll: true });
  n.onclick = () => { SFX.tap(); VL.i++; vlZeige(); };
  fuss.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
}
function vlEnde() {
  const { k, stufe, modus } = VL, s = lvStand(k), ohneLesen = VL.liste.filter((a, i) => i < VL.gesamt && a.typ !== "lesen").length;
  const quote = ohneLesen ? Math.round(Math.min(VL.ersteRichtig, ohneLesen) / ohneLesen * 100) : 100;
  const tage = s.tage.includes(dayNum(today())) ? s.tage : [...s.tage, dayNum(today())].slice(-40);
  let titel = "Lektion geschafft!", zeile = "", tal = 0, siegel = false;
  if (modus === "pruefung") {
    if (!VL.durchfall) { lvSetzen(k, { b: true, tage }); tal = LV_BEWAHR_TAL; siegel = true; titel = "Vers bewahrt!"; zeile = "Du kennst den Lernvers auswendig – das Abzeichen gehört dir."; }
    else { lvSetzen(k, { tage }); titel = "Fast geschafft!"; zeile = `Übe noch ein wenig – bis zum ${lvLetzterTag()}. ${MONATE[new Date().getMonth()]} kannst du die Prüfung jederzeit wiederholen.`; }
  } else if (modus === "lernen" && stufe > s.st) {
    lvSetzen(k, { st: stufe, tage, auf: today(), an: lvHeuteNeu(k) + 1, q: quote, qd: today() }); tal = LV_TAL[stufe - 1];
    titel = stufe < LV_MAX ? `Stufe ${stufe} geschafft!` : "Vers gemeistert!";
    zeile = stufe < LV_MAX ? `Als Nächstes: Stufe ${stufe + 1} – ${LV_STUFEN[stufe]}.` : (k === monatKey() ? `In den letzten ${LV_BEWAHR_TAGE} Tagen des Monats kommt die Monatsprüfung.` : "Du kannst ihn jederzeit wiederholen.");
  } else { lvSetzen(k, { tage, q: quote, qd: today() }); titel = "Gut gefestigt!"; zeile = s.st < LV_MAX ? `Als Nächstes: Stufe ${s.st + 1} – ${LV_STUFEN[s.st]}.` : "Täglich wiederholen hält den Vers frisch."; }
  const turboWeiter = modus !== "pruefung" && lvStufeFrei(k) && lvHeuteNeu(k) >= LV_STUFEN_PRO_TAG;
  const morgen = modus !== "pruefung" && !lvStufeFrei(k) && lvStand(k).st < LV_MAX;
  if (turboWeiter) zeile += ` <b class="vle-turbo">${svg("bolt")} Turbo! Mit ${quote} % geht es heute gleich weiter.</b>`;
  else if (morgen) zeile += lvHeuteNeu(k) >= LV_STUFEN_TURBO ? " Für heute ist das Maximum erreicht – morgen geht es weiter." : ` Morgen geht es weiter – oder schaffe beim Festigen ${LV_TURBO_QUOTE} % für den Turbo.`;
  const xp = LV_XP + LV_XP_RICHTIG * VL.ersteRichtig;
  const monatTage = lvMonatsTage(k), aktuell = k === monatKey(), neuSt = lvStand(k).st;
  const xInfo = { t0: VL.t0, f: Math.min(VL.i, VL.gesamt), fm: VL.gesamt, d: `Stufe ${stufe} · ${modus === "pruefung" ? "Prüfung" : modus === "lernen" ? "lernen" : "festigen"} · ${quote} % sofort richtig` };
  VL = null;
  richtig(Math.max(1, Math.round(ohneLesen * quote / 100))); quest("lernvers", 1); quest("runde", 1);
  SFX.win(); vibrate([20, 30, 20, 30, 60]); rain(siegel ? 90 : 50);
  screen.innerHTML = `<div class="vl vl-ende">
    <div class="vle-ic ${siegel ? "siegel" : ""}">${svg(siegel ? "siegel" : "star")}</div>
    <h1>${titel}</h1><p class="muted">${zeile}</p>
    <div class="vle-werte">
      <div><b>${quote} %</b><span>beim ersten Versuch</span></div>
      <div><b>+${xp}</b><span>XP</span></div>
      ${tal ? `<div><b>+${tal}${TAL_MUENZE}</b><span>Talente</span></div>` : ""}
    </div>
    ${aktuell ? `<div class="vle-monat">${svg("fire")}<span>An <b>${monatTage}</b> ${monatTage === 1 ? "Tag" : "Tagen"} im ${MONATE[new Date().getMonth()]} geübt · Woche ${lvWoche()}/4 · Ziel Stufe ${lvZiel()} ${neuSt >= lvZiel() ? svg("check", "var(--good)") : ""}</span></div>` : ""}
    <div class="lv-stufe gross" aria-label="Stufe ${neuSt} von ${LV_MAX}">${Array.from({ length: LV_MAX }, (_, i) => `<i class="${i < neuSt ? "an" : ""}"></i>`).join("")}</div>
    ${turboWeiter ? `<button class="btn primary breit" id="vlTurbo">${svg("bolt")} Weiter mit Stufe ${neuSt + 1}</button><button class="btn ghost breit" id="vlFertig">Für heute fertig</button>` : `<button class="btn primary breit" id="vlFertig">Weiter</button>`}</div>`;
  $("vlFertig").onclick = () => { SFX.tap(); go(heimAnsicht("home")); };
  if ($("vlTurbo")) $("vlTurbo").onclick = () => { SFX.tap(); go("verslektion", k); };
  setTimeout(() => { addXp(xp, $("vlFertig"), "vers", xInfo); if (tal) addTal(tal); save(); checkBadges(); lbSync(); }, 350);
}

/* ----- Karte auf der Startseite und im Archiv ----- */
function lvKarte(k, ort = "home") {
  const v = MONATSVERSE[k]; if (!v) return "";
  const s = lvStand(k), aktuell = k === monatKey();
  const tal = n => `<span class="lv-tal">+${n}${TAL_MUENZE}</span>`;
  const pruefung = aktuell && s.st >= LV_MAX && !s.b && lvBewahrFenster(k), frei = lvStufeFrei(k);
  let knopf, hinweis = "";
  if (pruefung) { knopf = `<button class="lv-btn gold" data-lv="pruefung">${svg("siegel")} Monatsprüfung ${tal(LV_BEWAHR_TAL)}</button>`; hinweis = "Monatsende: Weißt du ihn noch auswendig? Bewahre den Vers für das Abzeichen."; }
  else if (frei) { knopf = `<button class="lv-btn gold" data-lv="start">${svg(lvTurbo(k) ? "bolt" : "star")} Stufe ${s.st + 1}: ${LV_STUFEN[s.st]} ${tal(LV_TAL[s.st])}</button>`;
    if (lvTurbo(k) && lvHeuteNeu(k)) hinweis = `Turbo: Du lernst sicher – heute geht noch ${LV_STUFEN_TURBO - lvHeuteNeu(k) === 1 ? "eine Stufe" : "bis zu " + (LV_STUFEN_TURBO - lvHeuteNeu(k)) + " Stufen"}, mit Bonus-Aufgaben.`; }
  else { knopf = `<button class="lv-btn ${s.st < LV_MAX && aktuell ? "gold" : ""}" data-lv="start">${svg("step")} ${s.st < LV_MAX ? "Festigen" : "Wiederholen"}</button>`;
    hinweis = s.b ? "Bewahrt – du kennst diesen Vers auswendig." : s.st < LV_MAX ? (lvHeuteNeu(k) >= LV_STUFEN_TURBO ? `Stark – ${LV_STUFEN_TURBO} Stufen heute! Stufe ${s.st + 1} gibt es morgen.` : `Heute geschafft! Stufe ${s.st + 1} gibt es morgen – oder festige mit ${LV_TURBO_QUOTE} % für den Turbo.`) : aktuell ? `Gemeistert! Ab dem ${lvBewahrAb()}. ${MONATE[new Date().getMonth()]} kommt die Monatsprüfung.` : ""; }
  let fuss = knopf + `<button class="lv-btn rund" data-lv="vorlesen" aria-label="Vorlesen">${svg("sound")}</button>`;
  if (ort === "home") fuss = fuss + `<button class="lv-btn" data-go="lernverse" data-arg="home">${svg("scroll")} Archiv</button>`;
  const stand = s.b ? `<span class="lv-siegel" aria-label="Bewahrt">${svg("siegel")}</span>` : `<span class="lv-stufe" aria-label="Stufe ${s.st} von ${LV_MAX}">${Array.from({ length: LV_MAX }, (_, i) => `<i class="${i < s.st ? "an" : ""}"></i>`).join("")}</span>`;
  const mt = aktuell ? lvMonatsTage(k) : 0, ziel = lvZiel();
  const monat = aktuell && !s.b ? `<div class="lv-monat"><span class="lvm-woche">Woche ${lvWoche()}/4 · Ziel Stufe ${ziel}${s.st >= ziel ? ` ${svg("check")}` : ""}</span><span class="lvm-tage ${mt ? "an" : ""}">${svg("fire")}${mt} ${mt === 1 ? "Tag" : "Tage"}</span></div>` : "";
  return `<section class="lv ${ort === "home" ? "kompakt" : ""} ${s.b ? "bewahrt" : ""}" data-lvk="${k}" aria-label="Lernvers ${esc(monatName(k))}">
    <span class="lv-fkn" aria-hidden="true"><i></i><i></i><i></i></span>
    <div class="lv-kopf"><span class="lv-ic">${svg("scroll")}</span><span class="lv-lab">Lernvers ${esc(monatName(k))}</span>${ort === "home" ? `<span class="lv-ref">${esc(v[1])}</span>` : ""}${stand}</div>
    <div class="lv-text">${esc(v[0])}</div>${ort === "home" ? "" : `<div class="lv-ref">${esc(v[1])} · ${VERS_QUELLE}</div>`}
    ${monat}${hinweis ? `<div class="lv-hinweis">${hinweis}</div>` : ""}
    <div class="lv-fuss">${fuss}</div></section>`;
}
function lvVerdrahten() {
  screen.querySelectorAll("[data-lvk]").forEach(karte => {
    const k = karte.dataset.lvk, v = MONATSVERSE[k];
    karte.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { SFX.tap(); go(b.dataset.go, b.dataset.arg); });
    karte.querySelectorAll("[data-lv]").forEach(b => b.onclick = () => {
      const a = b.dataset.lv;
      if (a === "vorlesen") { const beat = S.beat; S.beat = false; vorlesen([{ text: v[0] + " – " + v[1].replace(/(\d+),(\d+)/, "$1, Vers $2") }]); S.beat = beat; return; }
      SFX.tap(); go("verslektion", k + (a === "pruefung" ? "|pruefung" : ""));
    });
  });
}
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ---------- Sound (Synthesizer) ---------- */
let AC = null;
function ac() { if (S.mute) return null; try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); return AC; } catch (e) { return null; } }
function tone(f, t0, dur, type, vol, slide) {
  const a = ac(); if (!a) return; const o = a.createOscillator(), g = a.createGain(); const t = a.currentTime + t0;
  o.type = type || "sine"; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
}
const SFX = {
  right(c = 0) { const base = 523 * Math.pow(2, Math.min(c, 12) / 12); tone(base, 0, .12, "triangle", .2); tone(base * 1.5, .07, .18, "triangle", .16); },
  wrong() { tone(180, 0, .25, "sawtooth", .12, 90); tone(120, .05, .3, "square", .06, 70); },
  tap() { tone(880, 0, .05, "sine", .08); },
  coin() { tone(988, 0, .08, "square", .08); tone(1319, .07, .2, "square", .08); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .1, .25, "triangle", .18)); tone(1568, .42, .5, "sine", .12); },
  level() { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * .09, .3, "triangle", .17)); [523, 659, 784].forEach(f => tone(f * 2, .6, .8, "sine", .07)); },
  badge() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * .07, .22, "sine", .14)); },
  tick() { tone(1200, 0, .03, "square", .04); },
  beat(n) { tone(n % 2 ? 98 : 82, 0, .16, "sine", .1, 50); },
  siegel() { tone(110, 0, .18, "sine", .16, 55); tone(1900, .02, .05, "square", .05, 600); tone(1400, .07, .05, "square", .04, 400); }
};
function renderMute() { $("muteBtn").innerHTML = svg(S.mute ? "mute" : "sound"); }
$("muteBtn").onclick = () => { S.mute = !S.mute; save(); renderMute(); if (!S.mute) SFX.tap(); else vorlesenStop(); };

/* ---------- Vorlesen (Sprachausgabe) & eigene Aufnahmen ---------- */
const TTS_OK = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
let ttsLauf = 0, beatTimer = null, audioEl = null;
function deStimme() { try { const vs = speechSynthesis.getVoices(); return vs.find(v => /^de[-_]DE/i.test(v.lang) && /google|neural|online|natural/i.test(v.name)) || vs.find(v => /^de[-_]DE/i.test(v.lang)) || vs.find(v => /^de/i.test(v.lang)) || null; } catch (e) { return null; } }
if (TTS_OK) try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => {}; } catch (e) {}
function vorlesenStop() {
  ttsLauf++; clearInterval(beatTimer); beatTimer = null;
  try { if (TTS_OK) speechSynthesis.cancel(); } catch (e) {}
  if (audioEl) { try { audioEl.pause(); } catch (e) {} audioEl = null; }
  document.querySelectorAll(".lz.on").forEach(e => e.classList.remove("on"));
  document.querySelectorAll(".lz .sing").forEach(e => e.classList.remove("sing"));
  document.querySelectorAll("[data-play].spielt").forEach(b => { b.classList.remove("spielt"); b.innerHTML = svg("play") + (b.id === "ganzBtn" ? " Ganzes Lied anhören" : " Anhören"); });
}
/* zeilen: [{text, el}] – liest nacheinander vor, markiert die aktuelle Zeile */
function vorlesen(zeilen, fertig) {
  vorlesenStop(); const lauf = ++ttsLauf;
  if (!TTS_OK) { toast(`${svg("sound", "var(--muted)")}<div>Dein Browser kann leider nicht vorlesen.</div>`); return; }
  if (S.beat && !S.mute) { let n = 0; SFX.beat(n++); beatTimer = setInterval(() => SFX.beat(n++), 560); }
  let i = 0;
  const next = () => {
    if (lauf !== ttsLauf) return;
    document.querySelectorAll(".lz.on").forEach(e => e.classList.remove("on"));
    if (i >= zeilen.length) { vorlesenStop(); fertig && fertig(); return; }
    const z = zeilen[i]; if (z.el) { z.el.classList.add("on"); }
    const u = new SpeechSynthesisUtterance(z.text); u.lang = "de-DE"; const v = deStimme(); if (v) u.voice = v;
    u.rate = 0.9; u.pitch = 1.05;
    let weiter = false; const go2 = () => { if (weiter) return; weiter = true; i++; setTimeout(next, 260); };
    u.onend = go2; u.onerror = go2;
    /* Sicherheitsnetz, falls ein Browser kein onend meldet */
    setTimeout(() => { if (lauf === ttsLauf && !weiter && !speechSynthesis.speaking) go2(); }, 900 + z.text.length * 120);
    speechSynthesis.speak(u);
  };
  next();
}
/* Eigene Aufnahmen: app/lied/strophe-1.mp3 … strophe-8.mp3 und lied/ganzes-lied.mp3 */
const AUFNAHMEN = {};
let aufnahmenGeprueft = null;
/* Liste der Aufnahmen: lied/aufnahmen.json, z. B. {"strophe-1":"strophe-1.mp3","ganzes-lied":"lied.mp3"} */
function aufnahmenPruefen() {
  if (aufnahmenGeprueft) return aufnahmenGeprueft;
  aufnahmenGeprueft = fetch("lied/aufnahmen.json", { cache: "no-cache" }).then(r => (r.ok ? r.json() : {})).then(j => {
    Object.entries(j || {}).forEach(([k, v]) => { if (typeof v === "string" && /^[\w.-]+\.(mp3|m4a|ogg|wav)$/i.test(v)) AUFNAHMEN[k] = "lied/" + v; });
    /* Zeitmarken der gesungenen Aufnahme: jede Liedzeile [Anfang, Ende] und der Einsatz jedes Buchs (Sekunden) */
    const z = j && j.zeiten;
    if (z && typeof z.datei === "string" && /^[\w.-]+\.(mp3|m4a|ogg)$/i.test(z.datei) && Array.isArray(z.zeilen) && z.zeilen.length === LZ_ANZ)
      LIEDZEIT = { src: "lied/" + z.datei, zeilen: z.zeilen, buecher: z.buecher || {} };
  }).catch(() => {});
  return aufnahmenGeprueft;
}
/* Fortlaufende Nummer einer Liedzeile (Strophe vi, Zeile li) */
const LZ_START = []; let LZ_ANZ = 0;
LIED.forEach((v, vi) => { LZ_START[vi] = LZ_ANZ; LZ_ANZ += v.lines.length; });
let LIEDZEIT = null;
function aufnahmeSpielen(src, zeilenEls, fertig) {
  vorlesenStop(); const lauf = ++ttsLauf;
  audioEl = new Audio(src); audioEl.play().catch(() => {});
  if (zeilenEls && zeilenEls.length) {
    audioEl.ontimeupdate = () => { if (lauf !== ttsLauf || !audioEl || !audioEl.duration) return; const k = Math.min(zeilenEls.length - 1, Math.floor(audioEl.currentTime / audioEl.duration * zeilenEls.length)); zeilenEls.forEach((e, j) => e.classList.toggle("on", j === k)); };
  }
  audioEl.onended = () => { if (lauf !== ttsLauf) return; vorlesenStop(); fertig && fertig(); };
}
/* Singt genau die übergebenen Liedzeilen (.lz-Elemente) aus der Aufnahme – mit Zeilen- und Buch-Markierung.
   Gibt false zurück, wenn keine Aufnahme mit Zeitmarken da ist (dann liest die Vorlesestimme). */
function liedSingen(els, fertig, ersatz, bis) {
  if (!LIEDZEIT || !els.length) return false;
  /* laufende Wiedergabe beenden, aber den gerade gedrückten Knopf („Stopp“) nicht zurücksetzen */
  ttsLauf++; clearInterval(beatTimer); beatTimer = null;
  try { if (TTS_OK) speechSynthesis.cancel(); } catch (e) {}
  if (audioEl) { try { audioEl.pause(); } catch (e) {} audioEl = null; }
  document.querySelectorAll(".lz.on, .lz .sing").forEach(e => e.classList.remove("on", "sing"));
  const lauf = ++ttsLauf;
  const zeilen = els.map(el => {
    const vi = +el.dataset.v, li = +el.dataset.l, n = LZ_START[vi] + li, [a, b] = LIEDZEIT.zeilen[n];
    const segs = LIED[vi].lines[li].filter(x => typeof x !== "string").map(x => LIEDZEIT.buecher[x.b[0]]);
    return { el, n, a, b, segs, spans: [...el.querySelectorAll("span")] };
  }).sort((x, y) => x.n - y.n);
  /* aufeinanderfolgende Zeilen am Stück abspielen */
  const teile = [];
  zeilen.forEach(z => { const t = teile[teile.length - 1]; if (t && t.letzte + 1 === z.n) { t.b = z.b; t.letzte = z.n; } else teile.push({ a: z.a, b: z.b, letzte: z.n }); });
  if (bis) { const t = teile[teile.length - 1]; t.b = Math.min(t.b, bis); } /* z. B. im Lückenquiz: nicht die noch offenen Bücher vorsingen */
  let ti = 0, gestartet = false;
  audioEl = new Audio(LIEDZEIT.src); audioEl.preload = "auto";
  const springe = () => { try { audioEl.currentTime = teile[ti].a; } catch (e) {} };
  audioEl.addEventListener("loadedmetadata", () => { if (lauf === ttsLauf) springe(); }, { once: true });
  audioEl.play().then(() => { gestartet = true; }).catch(() => {});
  audioEl.onerror = () => { if (lauf !== ttsLauf || gestartet) return; vorlesenStop(); ersatz && ersatz(); };
  const ende = () => { if (lauf !== ttsLauf) return; vorlesenStop(); fertig && fertig(); };
  /* timeupdate meldet sich nur etwa alle 0,25 s – zusätzlich jedes Bild prüfen, damit genau am Ende gestoppt wird */
  const genau = () => { if (lauf !== ttsLauf || !audioEl) return; if (!audioEl.paused) pruefe(); requestAnimationFrame(genau); };
  requestAnimationFrame(genau);
  const pruefe = audioEl.ontimeupdate = () => {
    if (lauf !== ttsLauf || !audioEl) return;
    const t = audioEl.currentTime;
    if (t < teile[ti].a - 0.5 && audioEl.readyState >= 1) { springe(); return; }
    if (t >= teile[ti].b) { ti++; if (ti >= teile.length) return ende(); springe(); return; }
    zeilen.forEach(z => {
      const an = t >= z.a && t < z.b; z.el.classList.toggle("on", an);
      let k = -1; if (an) z.segs.forEach((s, j) => { if (s != null && t >= s - 0.08) k = j; });
      z.spans.forEach((sp, j) => sp.classList.toggle("sing", j === k));
    });
  };
  audioEl.onended = ende;
  return true;
}

/* Liedzeilen mit eigenem „Anhören“-Knopf: singt genau diese Zeilen aus der Aufnahme */
function singBox(zeilenHtml, extra = "") {
  return `<div class="sing-box">${zeilenHtml}<div class="row-btns" style="margin-top:8px"><button class="btn mini" data-play data-sing>${svg("play")} Anhören</button>${extra}</div></div>`;
}
function wireSing(wurzel = screen) {
  wurzel.querySelectorAll("[data-sing]").forEach(b => b.onclick = e => {
    e.preventDefault(); e.stopPropagation();
    if (b.classList.contains("spielt")) { vorlesenStop(); return; }
    SFX.tap();
    const els = [...b.closest(".sing-box").querySelectorAll(".lz")];
    const fertig = () => {
      const vs = [...new Set(els.map(el => +el.dataset.v))];
      if (vs.length && els.length >= vs.length * 2) { vs.forEach(vi => { if (!S.songHeard.includes(vi)) S.songHeard.push(vi); }); save(); checkBadges(); }
    };
    const lesen = () => vorlesen(els.map(el => ({ text: el.textContent, el })), fertig);
    vorlesenStop();
    b.classList.add("spielt"); b.innerHTML = svg("stop") + " Stopp";
    if (!liedSingen(els, fertig, lesen)) lesen();
  });
}

/* ---------- Partikel-Effekte ---------- */
const cv = $("fx"), cx = cv.getContext("2d"); let parts = [], raf = 0;
function sizeCv() { const r = devicePixelRatio || 1; cv.width = innerWidth * r; cv.height = innerHeight * r; cx.setTransform(r, 0, 0, r, 0, 0); }
addEventListener("resize", sizeCv); sizeCv();
const accent = () => getComputedStyle(document.body).getPropertyValue("--accent").trim() || "#f2c14e";
function burst(x, y, n, opts = {}) {
  if (reduced) n = Math.min(n, 8);
  const cols = opts.colors || [accent(), "#ffffff", "#7cc4ff", "#ffa3c4", "#46d39a"];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = (opts.speed || 5) * (0.4 + Math.random());
    parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.up || 2), g: opts.g ?? 0.18, life: 1, decay: 0.012 + Math.random() * 0.02, s: 3 + Math.random() * 4, c: cols[i % cols.length], r: Math.random() * 6, vr: (Math.random() - .5) * .3, k: opts.kind || (Math.random() < .5 ? "star" : "rect") });
  }
  if (!raf) raf = requestAnimationFrame(loop);
}
function rain(n) { for (let i = 0; i < n; i++) setTimeout(() => burst(Math.random() * innerWidth, -10, 1, { speed: 2, up: -3, g: .12 }), i * 18); }
function drawStar(s) { cx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? s * .45 : s, a = i * Math.PI / 5 - Math.PI / 2; cx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } cx.closePath(); cx.fill(); }
function loop() {
  cx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.life > 0 && p.y < innerHeight + 40);
  for (const p of parts) { p.vy += p.g; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= p.decay; cx.save(); cx.globalAlpha = Math.max(p.life, 0); cx.fillStyle = p.c; cx.translate(p.x, p.y); cx.rotate(p.r); if (p.k === "star") drawStar(p.s); else cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); cx.restore(); }
  raf = parts.length ? requestAnimationFrame(loop) : 0; if (!raf) cx.clearRect(0, 0, innerWidth, innerHeight);
}
const centerOf = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
function floatText(txt, x, y) { const d = document.createElement("div"); d.className = "float"; d.textContent = txt; d.style.left = (x - 30) + "px"; d.style.top = (y - 20) + "px"; document.body.appendChild(d); setTimeout(() => d.remove(), 1000); }
function shakeScreen() { const a = $("screen"); a.classList.remove("shake-screen"); void a.offsetWidth; a.classList.add("shake-screen"); }

/* ---------- Tageswechsel, Serie & Manna ---------- */
function neuerTag() {
  const t = today();
  if (S.todayDay !== t) { S.todayDay = t; S.todayXp = 0; S.todayRight = 0; }
  aufgabenSicherstellen();
}
function serieZaehlen() {
  const t = today(); if (S.lastDay === t) return;
  const luecke = S.lastDay ? dayNum(t) - dayNum(S.lastDay) : 1;
  if (luecke === 1) S.streak++;
  else S.streak = 1;
  S.lastDay = t; S.bestStreak = Math.max(S.bestStreak, S.streak);
}
const ZIEL_TAG = 50;
/* ---------- Spieltage & Treue ---------- */
function tageDieseWoche(tl = S.tage) { const wk = weekKey(); return (tl || []).filter(n => weekKey(datumVon(n)) === wk).length; }
const tage28 = (tl) => { const h = dayNum(today()); return (tl || []).filter(n => n > h - 28).length; };
function treueWocheIn(tl) { const z = {}; (tl || []).forEach(n => { const w = weekKey(datumVon(n)); z[w] = (z[w] || 0) + 1; }); return Object.values(z).some(c => c >= TREUE_TAGE); }
function tagMerken() {
  const n = dayNum(today());
  if (!S.tage.includes(n)) { S.tage.push(n); S.tage = S.tage.filter(x => x > n - 35).sort((a, b) => a - b); }
  const wk = weekKey();
  if (tageDieseWoche() >= TREUE_TAGE && !S.treueWochen.includes(wk)) {
    S.treueWochen.push(wk); S.treueWochen = S.treueWochen.slice(-60);
    setTimeout(() => { SFX.badge(); toast(`${svg("people", accent())}<div><b>Treue Woche!</b><div class="small muted">Du hast an ${TREUE_TAGE} Tagen gespielt – eine treue Woche!</div></div>`); }, 1800);
  }
}

/* ---------- Siegel ---------- */
function siegelStufe(tage) {
  if (!tage || !tage.length) return 0;
  const wochen = new Set(tage.map(n => weekKey(datumVon(n))));
  const mk = n => { const d = datumVon(n); return d.getFullYear() * 12 + d.getMonth(); };
  const monate = [...new Set(tage.map(mk))].sort((a, b) => a - b);
  let lauf = 1, best = 1; for (let k = 1; k < monate.length; k++) { lauf = monate[k] === monate[k - 1] + 1 ? lauf + 1 : 1; best = Math.max(best, lauf); }
  if (best >= 12) return 4; if (monate.length >= 3) return 3; if (wochen.size >= 3) return 2; return 1;
}
const siegelFrisch = tage => !!(tage && tage.length) && dayNum(today()) - Math.max(...tage) <= SIEGEL_FRISCH;
const siegelRest = tage => (tage && tage.length ? SIEGEL_FRISCH - (dayNum(today()) - Math.max(...tage)) : 0);
function siegelHtml(stufe, frisch, gross) {
  if (!stufe) return `<span class="siegel leer ${gross ? "gross" : ""}" title="noch kein Siegel">${svg("siegel")}</span>`;
  return `<span class="siegel ${frisch ? "" : "blass"} ${gross ? "gross" : ""}" style="color:${SIEGEL[stufe].farbe}" title="${SIEGEL[stufe].name}${frisch ? "" : " (verblasst)"}">${svg("siegel")}</span>`;
}
function meisterErfolg(mode) {
  const liste = S.meister[mode] || (S.meister[mode] = []);
  const vorher = siegelStufe(liste), warFrisch = siegelFrisch(liste), n = dayNum(today());
  if (!liste.includes(n)) liste.push(n);
  const nachher = siegelStufe(liste); let tal = 0, meldung = "";
  if (vorher > 0 && !warFrisch) { tal += AUFFRISCH_TAL; S.aufgefrischt = true; meldung = `Siegel aufgefrischt! +${AUFFRISCH_TAL} Talente`; }
  if (nachher > vorher) { tal += SIEGEL[nachher].tal; meldung = `${SIEGEL[nachher].name}-Siegel für „${KETTEN[mode].name}“!` + (SIEGEL[nachher].tal ? ` +${SIEGEL[nachher].tal} Talente` : ""); }
  if (tal) S.tal += tal;
  if (meldung) setTimeout(() => { SFX.badge(); toast(`<span class="siegel gross" style="color:${SIEGEL[nachher].farbe}">${svg("siegel")}</span><div><b>${esc(meldung)}</b><div class="small muted">${nachher < 4 ? "Nächstes Siegel: " + SIEGEL[nachher + 1].text : "Höchste Stufe erreicht."}</div></div>`); }, 1600);
  return { vorher, nachher, tal };
}
function siegelDaten() {  // für die Rangliste: [Stufe, letzter Tag] je Kette
  const out = []; let bew = 0;
  ["bibel", "at", "nt", "rueck"].forEach(k => { const t = S.meister[k] || [], st = siegelStufe(t); out.push(st, t.length ? Math.max(...t) : 0); if (siegelFrisch(t)) bew += st; });
  return { sg: out, bew };
}
function bewaehrtWert(r) {
  if (Array.isArray(r.sg)) { const h = dayNum(today()); let w = 0; for (let k = 0; k < 8; k += 2) if (r.sg[k] && h - r.sg[k + 1] <= SIEGEL_FRISCH) w += r.sg[k]; return w; }
  return r.bew || 0;
}

/* ---------- XP-Quellen mitzählen (6.73) ----------
   Jede XP-Vergabe läuft über addXp(n, el, quelle). S.xq = { alt: XP vor der Zählung, q: {Quelle: XP}, n: {Quelle: Anzahl},
   m: {Quelle: größte einzelne Vergabe}, tag: {Tag: XP}, std: {"Tag-Stunde": XP} } – wird in die Sammlung „xpquellen“ gespiegelt.
   Der Verwalter sieht in der „XP-Prüfung“, ob die XP der Rangliste durch Quellen erklärt sind. */
const XQ_QUELLEN = { vers: "Lernvers", lektion: "Lektion", luecke: "Lückenquiz", blitz: "Blitz", kette: "Kette", duell: "Duell", duelleigen: "Duell (eigenes Profil)", bib: "Biblionär", tagesbonus: "Tagesaufgaben", spickzettel: "Spickzettel", sonst: "Sonstiges", abgleich: "Geräteabgleich", spende: "Spenden-Events" };
/* höchste XP, die eine einzelne Vergabe je Quelle ehrlich bringen kann (Blitz: 60 Richtige; Kette rückwärts: 65×4+300 …) */
/* bis 6.78 geltende Höchstwerte – für ältere Protokolleinträge und die gesamte „größte Vergabe“ (m), die nie sinkt */
const XQ_MAX_ALT = { vers: 400, lektion: 180, luecke: 600, blitz: 1300, kette: 560, duell: 350, duelleigen: 350, bib: 330, tagesbonus: 100, spickzettel: 20, sonst: 100, abgleich: 10000000, spende: 30000 };
const xqMaxFuer = (q, ver) => { const neu = XQ_MAX[q] || 300, alt = XQ_MAX_ALT[q] || 100; return parseFloat(ver) >= 6.79 ? neu : Math.max(neu, alt); };
/* höchste XP, die eine einzelne Vergabe je Quelle ehrlich bringen kann (ab 6.79: Blitz 60 Richtige mit Combo-Stufe 3, Kette rückwärts 66×6+180 …) */
const XQ_MAX = { vers: 1200, lektion: 540, luecke: 1800, blitz: 960, kette: 630, duell: 1050, duelleigen: 1050, bib: 990, tagesbonus: 300, spickzettel: 60, sonst: 300, abgleich: 10000000, spende: 30000 };
/* sortierbarer Tagesschlüssel (dstr() schreibt Monat/Tag ohne führende Null) */
const xqTagKey = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
function xqZaehlen(n, q) {
  n = Math.round(n); if (!(n > 0)) return;
  if (!XQ_QUELLEN[q]) q = "sonst";
  const x = S.xq && S.xq.q ? S.xq : (S.xq = { alt: Math.max(0, Math.round(S.xp)), q: {}, n: {}, m: {}, tag: {}, std: {} });
  x.n = x.n || {}; x.m = x.m || {}; x.tag = x.tag || {}; x.std = x.std || {};
  x.q[q] = (x.q[q] | 0) + n; x.n[q] = (x.n[q] | 0) + 1; x.m[q] = Math.max(x.m[q] | 0, n);
  const tg = xqTagKey(new Date()), st = tg + "-" + String(new Date().getHours()).padStart(2, "0");
  x.tag[tg] = (x.tag[tg] | 0) + n; x.std[st] = (x.std[st] | 0) + n;
  xqKuerzen(x);
}
/* 6.81: Tages-/Stundenwerte auf das erlaubte Maß kürzen (Regeln: tag ≤ 12, std ≤ 50). Nach dem Zusammenführen zweier Geräte waren es
   bis zu 20 Tage bzw. 96 Stunden – dann lehnte die Datenbank die XP-Quellen still ab, bis wieder XP vergeben wurden. */
function xqKuerzen(x) {
  if (!x) return x; x.tag = x.tag || {}; x.std = x.std || {};
  const tk = Object.keys(x.tag).sort(); while (tk.length > 10) delete x.tag[tk.shift()];
  const sk = Object.keys(x.std).sort(); while (sk.length > 48) delete x.std[sk.shift()];
  return x;
}
/* 6.74: Protokoll der täglichen Belohnung (Schatztruhe): wann (Uhrzeit laut Gerät), wie viel XP/Talente, welcher Truhen-Tag, direkt geöffnet oder „von gestern“ */
function xqBelohnung(art, xp, tal, tag) {
  const x = S.xq; if (!x) return;
  x.bel = Array.isArray(x.bel) ? x.bel : [];
  x.bel.push({ z: Date.now(), x: Math.round(xp), t: Math.round(tal), a: art === "gestern" ? "gestern" : "truhe", d: String(tag || "").slice(0, 10) });
  while (x.bel.length > 100) x.bel.shift();
}
function xqMischen(a, b) {
  if (!b || !b.q) return a; if (!a || !a.q) return JSON.parse(JSON.stringify(b));
  const mx = (o1, o2) => { const r = Object.assign({}, o1 || {}); Object.entries(o2 || {}).forEach(([k, v]) => { r[k] = Math.max(r[k] | 0, v | 0); }); return r; };
  const bel = [...(Array.isArray(a.bel) ? a.bel : []), ...(Array.isArray(b.bel) ? b.bel : [])].filter((e, i, l) => l.findIndex(f => f.z === e.z && f.a === e.a) === i).sort((p, q) => p.z - q.z).slice(-100);
  return xqKuerzen({ alt: Math.min(a.alt | 0, b.alt | 0), q: mx(a.q, b.q), n: mx(a.n, b.n), m: mx(a.m, b.m), tag: mx(a.tag, b.tag), std: mx(a.std, b.std), bel });
}
/* 6.76: Geräteabgleich – bringt das Zusammenführen XP von einem anderen Gerät mit (höherer Wert gewinnt) und stehen diese XP in keiner
   Quelle. Genau dieser Zuwachs wird als eigene Quelle „Geräteabgleich“ gebucht (mit Protokolleintrag), damit er nicht als „ohne Quelle“
   gilt. Gebucht wird höchstens der Zuwachs durch den Abgleich selbst – XP, die auf diesem Gerät ohne Quelle entstehen, bleiben sichtbar. */
function xqAbgleich(xpVorher) {
  const x = S.xq; if (!x || !x.q) return;
  const zuwachs = Math.round(S.xp) - Math.round(xpVorher || 0); if (!(zuwachs > 0)) return;
  const erklaert = (x.alt | 0) + Object.values(x.q).reduce((a, v) => a + (+v || 0), 0);
  const luecke = Math.round(S.xp) - erklaert, n = Math.min(zuwachs, luecke); if (!(n > 0)) return;
  xqEreignis(n, "abgleich", { d: "Zuwachs von anderem Gerät" }, S.xp - n);
  x.n = x.n || {}; x.m = x.m || {};
  x.q.abgleich = (x.q.abgleich | 0) + n; x.n.abgleich = (x.n.abgleich | 0) + 1; x.m.abgleich = Math.min(100000, Math.max(x.m.abgleich | 0, n));
}
/* 6.75: Einzelprotokoll – jede XP-Vergabe wird mit Zeit (Uhr des Geräts), Quelle, XP, XP-Stand vorher, Spielzeit und Fortschritt
   in der Sammlung „xpprotokoll“ abgelegt. Die Einträge lassen sich nur anlegen, nie ändern oder löschen (Regeln), und der Server
   setzt seine eigene Uhrzeit dazu („gebucht“) – so ist später nachprüfbar, was wann wie lange gespielt wurde.
   Bis zum Senden liegen die Einträge in localStorage (Schlüssel LS + ":xlog"), auch offline. */
const XQ_LOGKEY = () => LS + ":xlog", XQ_LOGMAX = 300;
function xqLogLesen() { try { const l = JSON.parse(localStorage.getItem(XQ_LOGKEY()) || "[]"); return Array.isArray(l) ? l : []; } catch (e) { return []; } }
function xqLogSchreiben(l) { try { localStorage.setItem(XQ_LOGKEY(), JSON.stringify(l.slice(-XQ_LOGMAX))); } catch (e) {} }
/* info: { t0: Startzeit des Spiels (ms), f: Fortschritt (z. B. richtige Antworten), fm: möglicher Höchstwert, d: Kurzbeschreibung } */
function xqEreignis(n, q, info, vor) {
  n = Math.round(n); if (!(n > 0)) return;
  if (!XQ_QUELLEN[q]) q = "sonst";
  info = info || {};
  const jetzt = Date.now(), e = { z: jetzt, n: (S.xqSeq = ((S.xqSeq | 0) % 100000) + 1), q, x: n, v: Math.max(0, Math.round(vor || 0)), ver: String(APP_VERSION).slice(0, 12) };
  if (info.t0 > 0) e.s = Math.max(0, Math.min(86400, Math.round((jetzt - info.t0) / 1000)));
  if (Number.isFinite(info.f)) e.f = Math.max(0, Math.min(100000, Math.round(info.f)));
  if (Number.isFinite(info.fm)) e.fm = Math.max(0, Math.min(100000, Math.round(info.fm)));
  if (info.d) e.d = String(info.d).slice(0, 60);
  const l = xqLogLesen(); l.push(e); xqLogSchreiben(l);
}
let xqLogLaeuft = false;
async function xqLogSenden() {
  const L = window.LB; if (xqLogLaeuft || !L || !L.ok || !L.xpEreignisse || !S.pid || S.offlineOnly || !S.lbName) return;
  const l = xqLogLesen(); if (!l.length) return;
  xqLogLaeuft = true;
  try {
    const fertig = await L.xpEreignisse(S.pid, S.lbName, l.slice(0, 25));
    if (fertig && fertig.length) { const ids = new Set(fertig.map(e => e.z + "_" + e.n)); xqLogSchreiben(xqLogLesen().filter(e => !ids.has(e.z + "_" + e.n))); }
    xqLogLaeuft = false;
    if (fertig && fertig.length === 25 && xqLogLesen().length) setTimeout(xqLogSenden, 500);
  } catch (e) { xqLogLaeuft = false; /* bewusst still, siehe xqSenden */ }
}
/* 6.83: Protokoll eines Spielers (Schlüssel key) vollständig abschicken – in 25er-Paketen, gesendete Einträge werden entfernt */
async function xqLogLeeren(pid, name, key) {
  const L = window.LB; if (!L || !L.ok || !L.xpEreignisse || !pid || !name) return;
  const lies = () => { try { const l = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(l) ? l : []; } catch (e) { return []; } };
  for (let runde = 0; runde < 12; runde++) {
    const l = lies(); if (!l.length) return;
    let fertig = []; try { fertig = await L.xpEreignisse(pid, name, l.slice(0, 25)); } catch (e) { return; }
    if (!fertig || !fertig.length) return;
    const ids = new Set(fertig.map(e => e.z + "_" + e.n));
    try { localStorage.setItem(key, JSON.stringify(lies().filter(e => !ids.has(e.z + "_" + e.n)))); } catch (e) {}
    if (fertig.length < 25) return;
  }
}
/* 6.83 (B): Liegengebliebene Zählung der ANDEREN Spieler auf diesem Gerät abschicken (XP-Quellen + Protokoll). Ihr Spielstand selbst
   wird dabei nicht verändert – gesendet wird nur, was sie gespielt haben. Das Gerät besitzt ihre Profile, die Regeln erlauben es. */
let andereGesendet = false;
async function andereSpielerNachsenden() {
  const L = window.LB; if (andereGesendet || gesperrt || !L || !L.ok || !L.xpSetzen) return; andereGesendet = true;
  for (const p of geraetLesen().liste) {
    if (!p || p.key === GERAET.aktiv || !p.pid || !p.name) continue;
    let st = null; try { st = JSON.parse(localStorage.getItem(lsKey(p.key)) || "null"); } catch (e) {}
    if (!st || !st.pid || !st.lbName || st.offlineOnly || st.pid !== p.pid) continue;
    try { await xqLogLeeren(st.pid, st.lbName, lsKey(p.key) + ":xlog"); } catch (e) {}
    if (st.xq && st.xq.q) {
      const sig = JSON.stringify(st.xq), sk = lsKey(p.key) + ":xqsent";
      let alt = ""; try { alt = localStorage.getItem(sk) || ""; } catch (e) {}
      if (alt !== String(hash(sig)) && st.xqSync !== sig) {
        try { await L.xpSetzen(st.pid, st.lbName, xqKuerzen(JSON.parse(sig))); localStorage.setItem(sk, String(hash(sig))); } catch (e) { /* z. B. ein anderes Gerät ist schon weiter – holt der Spieler selbst nach */ }
      }
    }
  }
}
function xqSenden() {
  const L = window.LB; if (!L || !L.ok || !L.xpSetzen || !S.pid || S.offlineOnly || !S.xq || !S.lbName) return;
  xqLogSenden(); truheNachholen();
  const sig = JSON.stringify(S.xq); if (S.xqSync === sig) return;
  /* bewusst still: solange die Regeln für „xpquellen“ nicht veröffentlicht sind, darf das Spiel nichts melden oder neu verbinden */
  L.xpSetzen(S.pid, S.lbName, xqKuerzen(S.xq)).then(() => { S.xqSync = sig; xqFehler = null; save(); }).catch(e => xqNachholen(e));
}
/* 6.81: Ein anderes Gerät desselben Spielers hat die Zählung schon weitergeschrieben (Regeln: Summen nur steigend, Anfangsbestand nur
   sinkend, Belohnungs-Protokoll nie kürzer). Dann lehnt die Datenbank den älteren Stand dieses Geräts ab – bis 6.80 still und so lange,
   bis die App neu startete. Die Rangliste bekam die XP trotzdem, und in der XP-Prüfung standen sie als „ohne Quelle“.
   Jetzt holt sich das Gerät den Stand aus der Datenbank, mischt ihn ein (je Quelle der höhere Wert) und sendet einmal erneut. */
let xqNachLaeuft = 0, xqFehler = null;
/* 6.85: Bildet die Firebase-Regeln für „xpquellen“ nach und nennt jede Regel, die dieser Stand gegenüber dem Stand in der Datenbank (a) verletzen würde.
   Die Datenbank selbst meldet nur „permission-denied“ – so wird sichtbar, WARUM sie ablehnt. */
const xqPayload = x => ({ name: S.lbName || "", alt: (x && x.alt) | 0, q: (x && x.q) || {}, n: (x && x.n) || {}, m: (x && x.m) || {}, tag: (x && x.tag) || {}, std: (x && x.std) || {}, bel: Array.isArray(x && x.bel) ? x.bel.slice(-100) : [] });
function xqRegelFehler(d, a) {
  const f = [], ganz = v => Number.isInteger(v), nm = k => XQ_QUELLEN[k] || k;
  if (!d || !d.q) return ["Zählung leer"];
  if (!(String(d.name).length >= 2 && String(d.name).length <= 20)) f.push("Name nicht 2–20 Zeichen");
  if (!ganz(d.alt) || d.alt < 0 || d.alt > 1e7) f.push("Anfangsbestand ungültig");
  if (a && ganz(d.alt) && d.alt > ((a.alt | 0))) f.push(`Anfangsbestand ${d.alt} höher als in der Datenbank (${a.alt | 0}) – er darf nur sinken`);
  [["q", "XP"], ["n", "Anzahl"], ["m", "größte Vergabe"]].forEach(([m, t]) => Object.entries(d[m] || {}).forEach(([k, v]) => {
    if (!XQ_QUELLEN[k]) f.push(`unbekannte Quelle „${k}“ (${t})`);
    else if (!ganz(v) || v < 0) f.push(`${nm(k)}: ${t} keine ganze Zahl`);
    else if (m === "m" && v > 100000) f.push(`${nm(k)}: größte Vergabe über 100.000`);
    else if (m !== "m" && v > 1e7) f.push(`${nm(k)}: ${t} über 10.000.000`);
  }));
  if (a && a.q) Object.entries(d.q || {}).forEach(([k, v]) => { if (k in a.q && v < (a.q[k] | 0)) f.push(`${nm(k)}: ${v} XP auf dem Gerät, aber ${a.q[k]} in der Datenbank – Summen dürfen nur steigen`); });
  if (Object.keys(d.tag || {}).length > 12) f.push(`Tageswerte: ${Object.keys(d.tag).length} statt höchstens 12`);
  if (Object.keys(d.std || {}).length > 50) f.push(`Stundenwerte: ${Object.keys(d.std).length} statt höchstens 50`);
  if (d.bel.length > 100) f.push("Belohnungs-Protokoll über 100 Einträge");
  if (a && Array.isArray(a.bel) && d.bel.length < a.bel.length) f.push(`Belohnungs-Protokoll kürzer als in der Datenbank (${d.bel.length} statt ${a.bel.length})`);
  return f;
}
/* 6.87: Lehnt die Datenbank den kompletten Stand ab, ohne dass ein Regelverstoß erkennbar ist (z. B. weil die veröffentlichten Firebase-Regeln
   älter sind als die der App), wird er in Teilen gespeichert: erst der Stand der Datenbank mit den höheren Summen der vorhandenen Quellen,
   dann jede neue Quelle einzeln, dann Tages-/Stundenwerte, Belohnungs-Protokoll und Anfangsbestand. Was angenommen wird, bleibt gespeichert,
   was abgelehnt wird, wird benannt. Auf dem Gerät bleibt die Zählung vollständig. */
async function xqEinkreisen(r, gem) {
  const L = window.LB, nm = k => XQ_QUELLEN[k] || k, kopie = o => JSON.parse(JSON.stringify(o));
  const srv = r.srv && r.srv.q ? r.srv : null, sq = (srv && srv.q) || {};
  let cur = srv ? { alt: srv.alt | 0, q: kopie(srv.q || {}), n: kopie(srv.n || {}), m: kopie(srv.m || {}), tag: kopie(srv.tag || {}), std: kopie(srv.std || {}), bel: Array.isArray(srv.bel) ? kopie(srv.bel) : [] }
    : { alt: gem.alt | 0, q: {}, n: {}, m: {}, tag: {}, std: {}, bel: [] };
  r.ok_teile = []; r.abgelehnt = [];
  const versuch = async (label, aend) => {
    const neu = kopie(cur); aend(neu); if (JSON.stringify(neu) === JSON.stringify(cur)) return;
    try { await L.xpSetzen(S.pid, S.lbName, neu); cur = neu; r.ok_teile.push(label); }
    catch (e) { r.abgelehnt.push(label + " (" + ((e && e.code) || "Fehler") + ")"); }
  };
  const vorhanden = Object.keys(gem.q || {}).filter(k => k in sq), neuK = Object.keys(gem.q || {}).filter(k => !(k in sq));
  await versuch("höhere Summen vorhandener Quellen", c => vorhanden.forEach(k => { c.q[k] = gem.q[k]; if (k in (gem.n || {})) c.n[k] = gem.n[k]; if (k in (gem.m || {})) c.m[k] = gem.m[k]; }));
  for (const k of neuK) await versuch("Quelle „" + nm(k) + "“", c => { c.q[k] = gem.q[k]; if (k in (gem.n || {})) c.n[k] = gem.n[k]; if (k in (gem.m || {})) c.m[k] = gem.m[k]; });
  await versuch("Tages-/Stundenwerte", c => { c.tag = kopie(gem.tag || {}); c.std = kopie(gem.std || {}); });
  await versuch("Belohnungs-Protokoll", c => { c.bel = kopie(Array.isArray(gem.bel) ? gem.bel.slice(-100) : []); });
  await versuch("Anfangsbestand", c => { c.alt = Math.min(c.alt | 0, gem.alt | 0); });
  r.teil = r.ok_teile.length > 0;
}
/* 6.85: Zählung dieses Spielers mit dem Stand in der Datenbank abgleichen: lesen, Unterschiede benennen, mischen (je Quelle der höhere Wert),
   erneut speichern und zur Kontrolle noch einmal lesen. Ergebnis { ok, code, msg, srv, nachher, vorher[], diffs[], neu[] } – Anzeige in der XP-Prüfung. */
async function xqAbgleichen(manuell) {
  const L = window.LB, r = { ok: false, code: "", msg: "", srv: null, nachher: null, vorher: [], diffs: [], neu: [] };
  if (gesperrt || !L || !L.ok || !L.xpHolen || !L.xpSetzen || !S.xq || !S.xq.q || !S.pid || !S.lbName || S.offlineOnly) { r.code = "nicht-bereit"; return r; }
  try { await L.signIn(); r.srv = await L.xpHolen(S.pid); } catch (e) { r.code = (e && e.code) || "lesen"; r.msg = String((e && e.message) || "").slice(0, 160); return r; }
  xqKuerzen(S.xq);
  r.vorher = xqRegelFehler(xqPayload(S.xq), r.srv);
  const gem = r.srv && r.srv.q ? xqMischen(S.xq, r.srv) : S.xq;
  r.diffs = xqRegelFehler(xqPayload(gem), r.srv);
  r.neu = Object.entries(gem.q || {}).filter(([k, v]) => (+v || 0) > (((r.srv && r.srv.q) || {})[k] | 0)).map(([k, v]) => ({ k, vorher: ((r.srv && r.srv.q) || {})[k] | 0, jetzt: +v || 0 }));
  try {
    await L.xpSetzen(S.pid, S.lbName, gem);
    S.xq = gem; S.xqSync = JSON.stringify(S.xq); save(); xqFehler = null; r.ok = true;
    try { r.nachher = await L.xpHolen(S.pid); } catch (e) {}
  } catch (e) { r.code = (e && e.code) || "unbekannt"; r.msg = String((e && e.message) || "").slice(0, 160); xqFehler = { z: Date.now(), code: r.code, msg: r.msg };
    if (!r.diffs.length && (manuell || xqEinkreisenFrei())) { try { await xqEinkreisen(r, gem); } catch (e2) {} } }
  return r;
}
/* automatische Eingrenzung höchstens einmal je Stunde (jeder Versuch sind einige Schreibzugriffe) */
function xqEinkreisenFrei() { const k = "bq-xq-ek", t = Date.now(); try { if (t - (+localStorage.getItem(k) || 0) < 36e5) return false; localStorage.setItem(k, String(t)); } catch (e) {} return true; }
const xqUnterschiedText = l => (l && l.length ? l.join("; ") : "kein Regelverstoß erkennbar").slice(0, 900);
/* Abgleich mit Meldung an den Verwalter (Postkasten, höchstens einmal je Tag und Art) */
async function xqAbgleichMitMeldung(grund) {
  const r = await xqAbgleichen(); if (r.code === "nicht-bereit") return r;
  const wer = `Spieler ${S.lbName || "?"}, Profil ${S.pid || "?"}, Version ${APP_VERSION}`;
  if (!r.ok) postkastenMelden("datenbank", `XP-Zählung speichern fehlgeschlagen (${r.code}${r.msg ? ": " + r.msg : ""}) – ${wer}. Verletzt: ${xqUnterschiedText(r.vorher)}. Nach dem Mischen: ${xqUnterschiedText(r.diffs)}.${r.ok_teile ? ` Einzeln gespeichert: ${r.ok_teile.join(", ") || "nichts"}. Abgelehnt: ${r.abgelehnt.join(", ") || "nichts"}.` : ""}`, "xqz-fehl-" + r.code + "-" + S.pid);
  else if (r.neu.length || r.vorher.length) postkastenMelden("datenbank", `XP-Zählung nachgeholt (${grund}) – ${wer}. Neu in der Datenbank: ${r.neu.map(x => `${XQ_QUELLEN[x.k] || x.k} ${x.vorher}→${x.jetzt}`).join(", ") || "–"}. Der alte Stand hätte verletzt: ${xqUnterschiedText(r.vorher)}.`, "xqz-ok-" + S.pid);
  return r;
}
/* 6.81: Ein anderes Gerät desselben Spielers hat die Zählung schon weitergeschrieben (Regeln: Summen nur steigend, Anfangsbestand nur
   sinkend, Belohnungs-Protokoll nie kürzer). Dann lehnt die Datenbank den älteren Stand dieses Geräts ab – bis 6.80 still und so lange,
   bis die App neu startete. Die Rangliste bekam die XP trotzdem, und in der XP-Prüfung standen sie als „ohne Quelle“.
   Jetzt holt sich das Gerät den Stand aus der Datenbank, mischt ihn ein (je Quelle der höhere Wert) und sendet einmal erneut.
   6.85: bei JEDEM Fehler außer Verbindungsproblemen (nicht nur permission-denied), Wiederholung frühestens nach 20 s, Fehler wird gemerkt und gemeldet. */
async function xqNachholen(e) {
  const code = String((e && e.code) || "");
  xqFehler = { z: Date.now(), code: code || "unbekannt", msg: String((e && e.message) || "").slice(0, 160) };
  if (gesperrt || Date.now() - xqNachLaeuft < 2e4) return;
  if (["unavailable", "deadline-exceeded", "cancelled"].includes(code) || (typeof navigator !== "undefined" && navigator.onLine === false)) return;
  xqNachLaeuft = Date.now();
  try { await xqAbgleichMitMeldung("nach abgelehnter Speicherung"); } catch (e2) { /* still – nächster Versuch beim nächsten Senden */ }
}
/* 6.85: Beim Start einmal prüfen, ob die Datenbank alles hat, was dieses Gerät gezählt hat – sonst nachholen */
async function xqStartPruefung() {
  const L = window.LB; if (gesperrt || !L || !L.ok || !L.xpHolen || !S.xq || !S.xq.q || !S.pid || !S.lbName || S.offlineOnly) return;
  let srv = null; try { await L.signIn(); srv = await L.xpHolen(S.pid); } catch (e) { return; }
  // 6.88: Der Verwalter hat einen Abgleich angefordert (für diesen Spieler oder alle) – einmal je Anforderung ausführen
  try {
    const ts = L.abgleichHolen ? await L.abgleichHolen(S.pid) : 0, key = "bq-abg-" + S.pid;
    if (ts && ts > (+localStorage.getItem(key) || 0)) {
      const r = await xqAbgleichMitMeldung("auf Anforderung des Verwalters");
      if (r && r.ok) { localStorage.setItem(key, String(ts)); return; }
    }
  } catch (e) {}
  const fehlt = !srv || !srv.q || Object.entries(S.xq.q).some(([k, v]) => (+v || 0) > ((srv.q[k]) | 0));
  if (fehlt) await xqAbgleichMitMeldung("beim Start");
}
function addXp(n, el, quelle, info) {
  if (gesperrt) return;
  neuerTag(); serieZaehlen(); tagMerken();
  try { adventLichterVerdienen(n, quelle); } catch (e) {} /* 7.3: Adventslichter */
  xqEreignis(n, quelle, info, S.xp);
  xqZaehlen(n, quelle);
  const vorher = levelOf(S.xp);
  S.xp += n; S.todayXp += n;
  const wk = weekKey(); if (S.weekKey !== wk) { S.weekKey = wk; S.weekXp = 0; } S.weekXp += n;
  if (el) { const [x, y] = centerOf(el); floatText("+" + n + " XP", x, y); }
  quest("xp", n);
  const nachher = levelOf(S.xp); renderHud(); save(); lbSync();
  if (nachher > vorher) setTimeout(() => levelUp(nachher), 450);
  checkBadges();
}
function richtig(n = 1) {
  neuerTag(); S.right += n; S.todayRight += n; S.bestDayRight = Math.max(S.bestDayRight || 0, S.todayRight);
  if (new Date().getHours() < 7) S.earlyBird = true;
  quest("right", n);
}
function addTal(n) { if (n <= 0) return; S.tal += n; renderHud(); save(); SFX.coin(); }
/* 6.95: Talente-Zählung für die Verwalter-Seite „Talente-Planung“ (Postkasten). Statt an jeder der vielen Stellen, die Talente vergeben,
   mitzuzählen, wird bei jedem Speichern (lsSchreiben) der Unterschied zum zuletzt gesehenen Guthaben gebucht: Zuwachs = verdient (gesamt und je Tag),
   Abnahme = ausgegeben (Laden/Rüstung). Spenden an die Stiftshütte bucht die Spendenfunktion selbst (p) und setzt l, damit sie nicht als Ausgabe zählen.
   S.tl = { s: Tag des Zählbeginns (dayNum), l: zuletzt gesehenes Guthaben, v: verdient, a: ausgegeben, p: gespendet, t: { dayNum: verdient an dem Tag (letzte 40 Tage) } }.
   Vor dem Zählbeginn gibt es keine Daten – das bisherige Guthaben wird nicht als „verdient“ gezählt. */
function talBuchen() {
  if (typeof S.tal !== "number") return;
  const n = dayNum(today());
  if (!S.tl || typeof S.tl !== "object") S.tl = { s: n, l: S.tal | 0, v: 0, a: 0, p: 0, t: {} };
  const T = S.tl, d = (S.tal | 0) - (T.l | 0); if (!T.t || typeof T.t !== "object") T.t = {};
  if (d > 0) { T.v = (T.v | 0) + d; const k = String(n); T.t[k] = (T.t[k] | 0) + d; }
  else if (d < 0) T.a = (T.a | 0) - d;
  T.l = S.tal | 0;
  Object.keys(T.t).forEach(k => { if (+k < n - 40) delete T.t[k]; });
}
/* Zusammenführen mit einem anderen Gerät/Spielstand r: je Summe der höhere Wert, Zählbeginn der frühere, Tageswerte je Tag der höhere */
function talMischen(r) {
  const b = r && r.tl, a = S.tl;
  if (b && typeof b === "object") {
    if (!a || typeof a !== "object") S.tl = JSON.parse(JSON.stringify(b));
    else {
      a.s = Math.min(a.s | 0 || b.s | 0, b.s | 0 || a.s | 0); ["v", "a", "p"].forEach(k => { a[k] = Math.max(a[k] | 0, b[k] | 0); });
      a.t = a.t || {}; Object.entries(b.t || {}).forEach(([k, v]) => { a.t[k] = Math.max(a.t[k] | 0, v | 0); });
    }
  }
  if (S.tl) S.tl.l = S.tal | 0;   /* der Sprung durch das Zusammenführen ist kein neu verdientes Guthaben */
}
/* Zählung für die Datenbank (Sammlung „talente“, nur der Verwalter liest) */
function talSenden() {
  const L = window.LB; if (!L || !L.ok || !L.talSetzen || !S.pid || S.offlineOnly || !S.lbName) return;
  try { talBuchen(); } catch (e) { return; }
  const T = S.tl; if (!T) return;
  const d = { tal: S.tal | 0, s: T.s | 0, v: T.v | 0, a: T.a | 0, p: T.p | 0, t: T.t || {}, sd: (S.tage || []).filter(x => x >= (T.s | 0)).slice(-35) };
  const sig = JSON.stringify(d); if (S.tlSync === sig) return;
  L.talSetzen(S.pid, S.lbName, d).then(() => { S.tlSync = sig; save(); }).catch(() => {});   /* still: solange die Regeln noch nicht veröffentlicht sind, passiert nichts */
}
/* ---------- Level-Belohnungen (v6.39) ----------
   S.lvLohn = höchstes Level, dessen Belohnung schon ausgezahlt ist (0 = noch nie nach neuem Plan gerechnet).
   Talente für jedes übersprungene Level werden mitgezahlt; Skins schalten sich über need:"lvN" von selbst frei. */
const SKIN_LISTE = { avatar: () => AVATARE, rahmen: () => RAHMEN, titel: () => TITEL, farbe: () => THEMES };
const SKIN_ART = { avatar: "Avatar", rahmen: "Rahmen", titel: "Titel", farbe: "Farbe" };
function skinVon(n) { const s = LEVEL_SKIN[n]; if (!s) return null; const it = SKIN_LISTE[s[0]]().find(x => x.id === s[1]); return it ? { kat: s[0], it, n } : null; }
function skinBild(sk, size = 56) {
  const name = S.lbName || "?";
  if (sk.kat === "avatar") return avatarHtml({ avatar: sk.it.id, frame: S.frame, name }, size);
  if (sk.kat === "rahmen") return avatarHtml({ avatar: S.avatar, frame: sk.it.id, name }, size);
  if (sk.kat === "farbe") return `<span class="swatch lv-swatch" style="background:radial-gradient(circle at 35% 30%,#fff8,${sk.it.c} 45%,#1b2146)"></span>`;
  return `<span class="kb-titel-ic lv-titel-ic">${svg("scroll")}</span>`;
}
const skinTraegt = sk => ({ avatar: S.avatar, rahmen: S.frame, titel: S.title, farbe: S.theme })[sk.kat] === sk.it.id;
function skinAnlegen(sk) {
  if (sk.kat === "avatar") S.avatar = sk.it.id; if (sk.kat === "rahmen") S.frame = sk.it.id; if (sk.kat === "titel") S.title = sk.it.id;
  if (sk.kat === "farbe") { S.theme = sk.it.id; applyTheme(); }
  save(); lbSync(); renderHud();
}
/* Nächster Meilenstein mit Gegenstand (für den Ausblick im Fenster) */
function naechsterSkin(n) { for (let k = n + 1; k <= 50; k++) { const s = skinVon(k); if (s) return s; } return null; }
function lohnKarte(sk, mitKnopf) {
  return `<div class="lv-lohn">${skinBild(sk)}<div><b>${SKIN_ART[sk.kat]} „${esc(sk.it.name)}“</b><span class="lv-nur" title="Gibt es nur durch das Level, nicht im Laden">Level ${sk.n} · exklusiv</span></div>${mitKnopf && !skinTraegt(sk) ? `<button class="btn ghost lv-an" data-lvan="${sk.n}">Anlegen</button>` : ""}</div>`;
}
function lohnVerdrahten(m) {
  m.querySelectorAll("[data-lvan]").forEach(b => b.onclick = () => { const sk = skinVon(+b.dataset.lvan); if (!sk) return; SFX.tap(); skinAnlegen(sk); b.replaceWith(Object.assign(document.createElement("span"), { className: "pz ok lv-an", innerHTML: `${svg("check")} angelegt` })); });
}
function levelUp(n) {
  if (!S.lvLohn) levelNachreichen(n - 1);  // alter Spielstand: erst bis zum vorigen Level nachrechnen
  const von = Math.max(1, S.lvLohn || 1);
  let tal = 0; const skins = [];
  for (let k = von + 1; k <= n; k++) { tal += lvTalente(k); const s = skinVon(k); if (s) skins.push(s); }
  const meilenstein = skins.length || n % 5 === 0;
  S.lvLohn = Math.max(S.lvLohn || 0, n); S.tal += tal; save(); renderHud(); lbSync();
  SFX.level(); vibrate([30, 40, 30, 40, 80]); rain(meilenstein ? 180 : 110);
  if (meilenstein) setTimeout(() => SFX.badge(), 700);
  const nx = naechsterSkin(n), fehlt = nx ? Math.max(0, cum(nx.n) - S.xp) : 0;
  const m = modal(`<div class="label">${meilenstein ? "Meilenstein erreicht" : "Level aufgestiegen"}</div><div class="lvlbig ${meilenstein ? "ms" : ""}">${n}</div><h2>${titleOf(n)}</h2>
    ${tal ? `<div class="lv-tal">+${tal} Talente</div>` : ""}${skins.map(s => lohnKarte(s, true)).join("")}
    ${nx ? `<p class="small muted lv-ausblick">Nächste Sonderbelohnung bei Level ${nx.n}: ${SKIN_ART[nx.kat]} „${esc(nx.it.name)}“ · noch ${fehlt} XP</p>` : ""}
    <button class="btn primary" data-close>Weiter</button>`);
  m.classList.add("lv-modal"); if (meilenstein) m.classList.add("lv-ms"); lohnVerdrahten(m);
  /* 6.68: Level 50 = Halljahr – große Feier mit Posaunen */
  if (n >= 50 && von < 50) { m.classList.add("lv-halljahr");
    m.querySelector(".lvlbig").insertAdjacentHTML("afterend", `<div class="halljahr"><span class="hj-posaune">${svg("posaune")}</span><b>Halljahr!</b><small>„Ihr sollt das fünfzigste Jahr heiligen … Ein Jubeljahr soll es euch sein.“ (3. Mose 25,10)</small></div>`);
    [600, 1500, 2600].forEach(t => setTimeout(() => { SFX.level(); rain(160); }, t)); }
}
/* Einmalig für alle, die schon vor 6.39 gespielt haben: alle Level-Talente nach dem neuen Plan (ohne Abzug des alten Bonus,
   der bei übersprungenen Leveln oft gar nicht gezahlt wurde) und alle erreichten Level-Skins */
function levelNachreichen(bis) {
  if (S.lvLohn) return false;
  const L = bis || levelOf(S.xp); let plus = 0; const skins = [];
  for (let k = 2; k <= L; k++) { plus += lvTalente(k); const s = skinVon(k); if (s) skins.push(s); }
  S.lvLohn = Math.max(1, L); S.tal += plus; save(); renderHud(); lbSync();
  if (!plus && !skins.length) return false;
  setTimeout(() => {
    if (document.querySelector(".modal")) { setTimeout(levelNachZeigen, 1500); return; }
    levelNachZeigen();
  }, 700);
  function levelNachZeigen() {
    SFX.badge(); rain(120);
    const m = modal(`<div class="label">Nachträglich für dich</div><h2>Neue Level-Belohnungen</h2>
      <p class="muted small">Ab jetzt bringt jedes Level mehr Talente, und jedes 5. Level ist ein Meilenstein mit einem besonderen Gegenstand. Für deine bisherigen ${L} Level bekommst du alle Level-Talente nach dem neuen Plan:</p>
      ${plus ? `<div class="lv-tal">+${plus} Talente</div>` : ""}${skins.map(s => lohnKarte(s, true)).join("")}
      <button class="btn primary" data-close>Danke!</button>`);
    m.classList.add("lv-modal", "lv-ms"); lohnVerdrahten(m);
  }
  return true;
}
function checkBadges() {
  let neu = 0;
  BADGES.forEach(b => {
    if (!S.badges.includes(b.id) && b.ok(S)) {
      S.badges.push(b.id); const t = b.tal || 5; S.tal += t; neu++;
      setTimeout(() => { SFX.badge(); toast(`${svg(b.ic, accent())}<div><b>Abzeichen: ${esc(b.name)}</b><div class="small muted">${esc(b.d)} · +${t} Talente</div></div>`); burst(innerWidth / 2, innerHeight - 60, 40, { up: 6 }); }, 900 + neu * 700);
    }
  });
  titelCheck();
  if (neu) { save(); renderHud(); lbSync(); }
}
let toastQ = Promise.resolve();
function toast(html) {
  toastQ = toastQ.then(() => new Promise(res => {
    const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.innerHTML = html; document.body.appendChild(t);
    setTimeout(() => { t.remove(); res(); }, 2600);
  }));
}
function modal(html, onClose) {
  const m = document.createElement("div"); m.className = "modal"; m.innerHTML = `<div class="card stack" role="dialog" aria-modal="true">${html}</div>`; document.body.appendChild(m);
  m.querySelectorAll("[data-close]").forEach(b => b.onclick = () => { m.remove(); SFX.tap(); onClose && onClose(b.dataset.close); });
  m.addEventListener("click", e => { if (e.target === m && m.dataset.frei) { m.remove(); onClose && onClose(""); } });
  return m;
}

/* ---------- Tagesaufgaben ---------- */
/* Auslosung nach Datum (für alle gleich); gleiche Spielart nicht doppelt, zusammen höchstens AUFGABEN_MAX_MIN Minuten */
function aufgabenAuslosen(t) {
  let h = hash("bq" + t); const verfuegbar = AUFGABEN.filter(a => (a.ev !== "lernvers" || MONATSVERSE[monatKey()]) && (!a.online || (S.lbName && !S.offlineOnly))); const pool = verfuegbar.slice(); const gew = [];
  for (let versuch = 0; gew.length < 3 && pool.length && versuch < 60; versuch++) {
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; const idx = h % pool.length, a = pool[idx];
    const minuten = gew.reduce((m, x) => m + x.min, 0) + a.min, rest = 3 - gew.length - 1;
    if (gew.some(x => x.ev === a.ev) || minuten + rest > AUFGABEN_MAX_MIN) continue;
    gew.push(pool.splice(idx, 1)[0]);
  }
  for (const a of verfuegbar) if (gew.length < 3 && !gew.includes(a) && !gew.some(x => x.ev === a.ev)) gew.push(a);
  return gew;
}
/* ---------- Schatztruhe: Tagesbuchung auf dem Server (6.78) ----------
   Die Truhe gilt je Spieler und Serverdatum höchstens einmal: Dokument „tagestruhe/<pid>_<JJJJMMTT>“ wird nur angelegt, die Regeln
   prüfen das Datum gegen die Serverzeit (heute oder gestern). Uhr umstellen, App-Daten löschen oder ein zweites Gerät helfen nicht mehr.
   Ergebnis: ok (gebucht) · schon (heute bereits geholt) · regeln (Server-Regeln noch nicht veröffentlicht oder Spieler nicht in der
   Rangliste → wie früher auszahlen) · netz (offline/Fehler → später) · tag (Datum passt nicht → Uhr des Geräts prüfen). */
async function serverMs() {
  try { const r = await fetch(location.pathname, { method: "HEAD", cache: "no-store" }); const d = Date.parse(r.headers.get("date") || ""); if (d > 0) return d; } catch (e) {}
  return Date.now();
}
const berlinTagZahl = ms => +new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date(ms)).replace(/-/g, "");
let truheLaeuft = false;
async function truheBuchen(vorTagen) {
  const L = window.LB; if (!L || !L.ok || !L.truheBuchen || !S.pid || !S.lbName || S.offlineOnly) return "regeln";
  try { const tag = berlinTagZahl((await serverMs()) - (vorTagen | 0) * 864e5); return await L.truheBuchen(S.pid, S.lbName, tag, APP_VERSION); }
  catch (e) { return "netz"; }
}
/* Truhe von gestern, die wegen fehlender Verbindung noch nicht gebucht werden konnte – wird bei der nächsten Synchronisation nachgeholt */
async function truheNachholen() {
  if (!S.truheNach || truheLaeuft) return; truheLaeuft = true;
  try { const e = await truheBuchen(1); if (e === "netz") return;
    const tag = S.truheNach; S.truheNach = ""; save();
    if (e === "ok" || e === "regeln") truheGestern(tag);
  } finally { truheLaeuft = false; }
}
function truheGestern(truhenTag) {
  addXp(AUFGABE_BONUS_XP, null, "tagesbonus", { d: "Schatztruhe von gestern" }); xqBelohnung("gestern", AUFGABE_BONUS_XP, AUFGABE_BONUS, truhenTag); addTal(AUFGABE_BONUS);
  toast(`${TAL_MUENZE}<div><b>Deine Schatztruhe von gestern</b><div class="small muted">wurde für dich geöffnet: +${AUFGABE_BONUS_XP} XP und +${AUFGABE_BONUS} Talente</div></div>`);
}
function aufgabenSicherstellen() {
  const t = today(); if (S.dq && S.dq.day === t && S.dq.items.every(it => AUFGABEN.some(a => a.id === it.id))) return;
  const alteTruhe = S.dq && S.dq.geschafft && !S.dq.bonus, truhenTag = S.dq ? S.dq.day : "";
  const gew = aufgabenAuslosen(t);
  if (alteTruhe) setTimeout(async () => {
    const e = await truheBuchen(1);
    if (e === "ok" || e === "regeln") truheGestern(truhenTag);
    else if (e === "netz") { S.truheNach = truhenTag; save(); }
  }, 1500);
  S.dq = { day: t, items: gew.map(a => ({ id: a.id, prog: 0, done: false })), bonus: false };
}
function quest(ev, val = 1) {
  aufgabenSicherstellen(); let geaendert = false;
  S.dq.items.forEach(it => {
    const a = AUFGABEN.find(x => x.id === it.id); if (!a || a.ev !== ev || it.done) return;
    it.prog += val;
    geaendert = true;
    if (it.prog >= a.ziel) {
      it.done = true; S.tal += AUFGABE_TAL;
      setTimeout(() => { SFX.coin(); toast(`${svg("check", "var(--good)")}<div><b>Tagesaufgabe erledigt</b><div class="small muted">${esc(a.text)} · +${AUFGABE_TAL} Talente</div></div>`); }, 300);
    }
  });
  if (geaendert && !S.dq.geschafft && !S.dq.bonus && S.dq.items.every(i => i.done)) {
    S.dq.geschafft = true; S.questBonusCount = (S.questBonusCount || 0) + 1;
    if (S.lastGoalDay !== today()) { S.goalStreak = S.lastGoalDay === yesterday() ? S.goalStreak + 1 : 1; S.lastGoalDay = today(); S.bestGoalStreak = Math.max(S.bestGoalStreak, S.goalStreak); }
    setTimeout(() => { SFX.badge(); toast(`<span class="toast-truhe">${TRUHE_ZU}</span><div><b>Alle Tagesaufgaben geschafft!</b><div class="small muted">Deine Schatztruhe wartet auf der Startseite – öffne sie!</div></div>`); if (current === "home") go("home"); }, 900);
  }

  if (geaendert) { renderHud(); checkBadges(); }
}

/* ---------- Fortschritt im AT und NT ---------- */
function fortschritt(st = S.stars, cAT = S.chainAT, cNT = S.chainNT) {
  const sum = ids => ids.reduce((a, i) => a + (st[i] || 0), 0);
  const atP = Math.round(50 * sum([0, 1, 2, 3, 4]) / 15 + 50 * Math.min(cAT || 0, 38) / 38);
  const ntP = Math.round(50 * sum([5, 6, 7]) / 9 + 50 * Math.min(cNT || 0, 26) / 26);
  return { atP, ntP };
}
const titelIndex = (liste, p) => { let k = 0; liste.forEach((t, i) => { if (p >= t[0]) k = i; }); return k; };
function titelCheck() {
  const { atP, ntP } = fortschritt();
  const ai = titelIndex(AT_TITEL, atP), ni = titelIndex(NT_TITEL, ntP);
  [[ai, "atTi", AT_TITEL, "Alten Testament"], [ni, "ntTi", NT_TITEL, "Neuen Testament"]].forEach(([i, k, L, name]) => {
    if (i > (S[k] || 0)) { S[k] = i; lsSchreiben(); setTimeout(() => { SFX.badge(); toast(`${svg("crown", accent())}<div><b>Neuer Titel im ${name}: ${esc(L[i][1])}</b><div class="small muted">${esc(L[i][2])}</div></div>`); }, 1500); }
  });
}

/* ---------- Kopfleiste ---------- */
/* 9.2: genaue Levelfortschritt-Anzeige (Menü beim Antippen des Spielers und Profil) */
function xpInfoHtml(kompakt) {
  const n = levelOf(S.xp), lo = cum(n), hi = cum(n + 1), im = Math.max(0, Math.round(S.xp) - lo), gesamt = hi - lo, fehlt = Math.max(0, hi - Math.round(S.xp)), p = Math.max(0, Math.min(100, im / gesamt * 100));
  return `<div class="xpinfo" role="group" aria-label="Levelfortschritt">
    <div class="xi-kopf"><b>Level ${n}</b><span>${Math.floor(p)} % bis Level ${n + 1}</span></div>
    <div class="xi-balken" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p)}"><i style="width:${p.toFixed(1)}%"></i></div>
    ${kompakt ? `<div class="xi-eine"><span><b>${pkt(im)}</b> XP geschafft</span><span>noch <b>${pkt(fehlt)}</b> XP</span><span>gesamt <b>${pkt(Math.round(S.xp))}</b></span></div>` : `<div class="xi-zeilen"><span>Schon geschafft</span><b>${pkt(im)} XP</b><span>Noch bis Level ${n + 1}</span><b>${pkt(fehlt)} XP</b><span>Dieses Level umfasst</span><b>${pkt(gesamt)} XP</b><span>XP insgesamt</span><b>${pkt(Math.round(S.xp))} XP</b></div>`}</div>`;
}
/* Kopfzeile: langer Spielername. Erst die Schrift schrittweise verkleinern, passt er dann noch nicht, in zwei Zeilen
   (kleinere Schrift) – die Höhe der Kopfzeile bleibt gleich. */
function hudNameAnpassen() {
  const el = $("hTitle"), hud = document.querySelector(".hud"); if (!el || !hud || !el.clientWidth) return;
  const box = el.parentElement; el.classList.remove("zwei"); box.classList.remove("zweizeilig"); el.style.fontSize = "";
  const basis = hud.offsetHeight;
  if (el.scrollWidth <= el.clientWidth + 1) return;
  const start = parseFloat(getComputedStyle(el).fontSize) || 19, min = Math.max(14, start * 0.8);
  for (let px = start - 0.5; px >= min; px -= 0.5) { el.style.fontSize = px.toFixed(1) + "px"; if (el.scrollWidth <= el.clientWidth + 1) return; }
  el.classList.add("zwei"); box.classList.add("zweizeilig");
  for (let px = Math.min(start, 16); px >= 11; px -= 0.5) { el.style.fontSize = px.toFixed(1) + "px"; if (el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1 && hud.offsetHeight <= basis) return; }
}
window.addEventListener("resize", () => { try { hudNameAnpassen(); } catch (e) {} });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { try { hudNameAnpassen(); } catch (e) {} });
function renderHud() {
  const n = levelOf(S.xp), lo = cum(n), hi = cum(n + 1);
  $("hLvl").textContent = n; if ($("hGem")) $("hGem").innerHTML = gemLogoHtml(meineGem() === "gast" ? null : gemInfo(meineGem()), 22); $("hAvatar").innerHTML = avatarHtml({ avatar: S.avatar, frame: S.frame, name: S.lbName || "?" }, 44);
  const rang = entwickler ? ENTW_RANG : titleOf(n);
  $("hTitle").textContent = S.lbName || rang; $("hXp").textContent = S.lbName ? rang : "Level " + n; $("hXpZ").textContent = `${S.xp - lo} / ${hi - lo} XP`;
  $("hRing").style.setProperty("--p", Math.max(0, Math.min(100, (S.xp - lo) / (hi - lo) * 100)).toFixed(1));
  const serie = streakNow(); $("hStreak").textContent = serie === 1 ? "1 Tag" : serie + " Tage"; $("hStreak").parentElement.classList.toggle("null", !serie);
  { const hs = $("hShop"); if (hs && !hs.firstChild) hs.innerHTML = svg("shop"); }
  $("hTal").textContent = S.tal; const tbP = $("tbTal"); if (tbP) tbP.hidden = !etwasKaufbar();
  $("hLvlT").textContent = "Level " + n;
  { const pz = Math.max(0, Math.min(100, (S.xp - lo) / (hi - lo) * 100)); const lt = $("hLvlT"); lt.style.setProperty("--lp", pz.toFixed(1) + "%"); lt.title = `Level ${n}: ${Math.round(S.xp) - lo} von ${hi - lo} XP (noch ${Math.max(0, hi - Math.round(S.xp))} bis Level ${n + 1})`; }
  hudNameAnpassen();
  const pk = $("pkBtn"); if (pk) { pk.hidden = !entwickler; pk.innerHTML = `${svg("post")}${pkOffenPruef ? `<i class="pk-ap" aria-hidden="true"></i>` : ""}${postfachNeu ? `<span class="pk-zahl">${postfachNeu > 99 ? "99+" : postfachNeu}</span>` : ""}`; pk.setAttribute("aria-label", `Postkasten${postfachNeu ? ", " + postfachNeu + " neu" : ""}`); }
}
/* Was ist im Laden gerade kaufbar? (je Kategorie, Reihenfolge-Regeln wie im Laden) */
function kaufbarIn(kat) {
  if (kat === "ruestung") { const r = RUESTUNG[armorCount()]; if (r && r.price <= S.tal) return true; return RUESTUNG.some(x => { const p = veredelPreis(x.id); return p && p <= S.tal; }); }
  if (kat === "avatar" || kat === "rahmen") {
    const [l, p] = kat === "avatar" ? [AVATARE, "av-"] : [RAHMEN, "fr-"];
    const x = l.filter(i => i.price > 0).find(i => !S.owned.includes(p + i.id)); return !!x && x.price <= S.tal && (!x.ab || levelOf(S.xp) >= x.ab);
  }
  const [l, p] = kat === "titel" ? [TITEL, "ti-"] : [THEMES, ""];
  return l.some(i => i.price > 0 && i.price <= S.tal && !S.owned.includes(p + i.id));
}
const LADEN_KAT = ["ruestung", "avatar", "rahmen", "titel", "farbe"];
function etwasKaufbar() { return LADEN_KAT.some(kaufbarIn); }
/* Talente einheitlich: jeder sichtbare Text „+N Talente“ wird zu „+N“ mit der Licht-Münze */
function talMarken(root) {
  if (!root || root.nodeType !== 1 && root.nodeType !== 3) return;
  const RE = /\+(\d+) Talente?\b/g, treffer = [];
  if (root.nodeType === 3) { if (RE.test(root.nodeValue)) treffer.push(root); }
  else { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); while (w.nextNode()) { RE.lastIndex = 0; if (RE.test(w.currentNode.nodeValue)) treffer.push(w.currentNode); } }
  treffer.forEach(n => { if (!n.parentNode || n.parentNode.closest("script,style,textarea")) return;
    const s = document.createElement("span"); s.innerHTML = esc(n.nodeValue).replace(RE, `<span class="tal-n">+$1${TAL_MUENZE}</span>`);
    n.replaceWith(...s.childNodes); });
}
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(talMarken))).observe(document.body, { childList: true, subtree: true });
function applyTheme() { document.body.dataset.acc = S.theme; }

/* ---------- Spieler-Optik (Avatar, Rahmen, Titel, Rüstung) ---------- */
function avatarHtml(p, size = 44) {
  const av = p.avatar || "initial", fr = p.frame || "none";
  const inner = av === "initial" || !ICONS["av-" + av] ? `<b>${esc(String(p.name || "?").trim().charAt(0).toUpperCase() || "?")}</b>` : svg("av-" + av);
  const rahmen = fr !== "none" && window.RAHMEN_SVG && RAHMEN_SVG[fr] ? RAHMEN_SVG[fr] : "";
  return `<span class="av fr-${esc(fr)}" style="--s:${size}px">${inner}${rahmen}</span>`;
}
/* Avatar mit Rahmen und Level-Münze (Rangliste) */
/* 9.11.1: Gemeindelogo als Kreis links unten (gleiche Größe wie die Level-Münze rechts unten) */
const gemMuenze = pid => { const id = gemVon(pid), g = id === "gast" || id === "?" ? null : gemInfo(id);
  /* 9.30: Unbekannte Gemeinde (noch nicht geladen oder Gemeinde gelöscht) → neutrale leere Münze, nicht das Gast-Symbol und nie ein falsches Logo */
  if (id === "?" || (id !== "gast" && !g)) return `<span class="gmc gmc-leer" aria-hidden="true"></span>`;
  return `<span class="gmc" title="${esc(g ? g.name : "Gast")}">${gemLogoHtml(g, 20)}</span>`; };
const avatarLv = (p, size) => `<span class="avw">${avatarHtml(p, size)}${gemMuenze(p.id || S.pid)}<span class="lvc" title="Level ${p.level || 1}">${p.level || 1}</span></span>`;
const titelName = id => { const t = TITEL.find(x => x.id === id); return t && t.id !== "none" ? t.name : ""; };
const ENTW_RANG = "Entwickler";
/* Angezeigter Rang eines Ranglisten-Eintrags bzw. (ohne r) des eigenen Profils */
function rangVon(r) {
  if (!r) return entwickler ? ENTW_RANG : titelName(S.title) || titleOf(levelOf(S.xp));
  if (ENTW_PID && r.id === ENTW_PID) return ENTW_RANG;
  return titelName(r.title) || titleOf(r.level || 1);
}
/* 6.68: Veredelungs-Stufe eines Rüstungsteils (0 = Grundstufe, 1 = Geläutert, 2 = Im Feuer erprobt) */
const ruestStufe = id => Math.min(2, (S.ruestStufe || {})[id] | 0);
/* 9.5: Veredeln aus dem Laden gestrichen – bereits erreichte Stufen bleiben sichtbar */
const veredelPreis = id => { return 0; if (!S.owned.includes("ar-" + id)) return 0; const st = ruestStufe(id); return st >= 2 ? 0 : RUEST_VEREDEL_PREIS[id][st]; };
function ruestungHtml(n, klein = true) {
  if (!n) return "";
  return `<span class="ruest ${klein ? "klein" : ""}" title="Waffenrüstung Gottes: ${n} von 6">${RUESTUNG.slice(0, n).map(r => `<i class="rst-${ruestStufe(r.id)}">${svg("ar-" + r.id)}</i>`).join("")}</span>`;
}
/* Freischalt-Bedingung: "lvN" = ab Level N (Level-Belohnung), sonst ein Abzeichen */
const needOk = need => /^lv\d+$/.test(need || "") ? levelOf(S.xp) >= +need.slice(2) : S.badges.includes(need);
const needText = need => /^lv\d+$/.test(need || "") ? `ab Level ${need.slice(2)}` : `Abzeichen „${(BADGES.find(x => x.id === need) || {}).name || ""}“`;
function itemFrei(kat, it) {
  if (it.price === 0) return true;
  if (it.price < 0) return needOk(it.need);
  return S.owned.includes(kat + it.id);
}

/* ---------- Navigation ---------- */
let current = "home", timers = [], lbUnsub = [];
function clearTimers() { timers.forEach(clearInterval); timers = []; }
/* 8.3: Nach einem Spiel (fertig oder abgebrochen) geht es dorthin zurück, wo es gestartet wurde */
const HAUPT_ANSICHTEN = ["home", "lernen", "lernverse", "spielen", "zusammen", "gegner", "duelle", "bib"];
let ursprung = "";
const HEIM_NAME = { home: "Start", lernen: "Lektionen", lernverse: "Lernverse", spielen: "Solo", zusammen: "Zusammen", duelle: "Duelle", bib: "Biblionär" };
const heimAnsicht = fb => { const u = ursprung === "gegner" ? "zusammen" : ursprung; return u && HEIM_NAME[u] ? u : fb; };
const heimName = fb => HEIM_NAME[heimAnsicht(fb)];
function go(name, arg) {
  if (current && HAUPT_ANSICHTEN.includes(current)) ursprung = current;
  VL = null; applyTheme(); clearTimers(); vorlesenStop(); lbUnsub.forEach(u => { try { u(); } catch (e) {} }); lbUnsub = [];
  if (!S.lbName && name !== "name") name = "name";
  current = name; window.scrollTo(0, 0); document.body.classList.remove("spiel-laeuft");
  tabbarSetzen(name); (VIEWS[name] || VIEWS.home)(arg);
  try { staemmeErstatten(); appBonusPruefen(); appHinweisZeigen(); nachPruefen(); } catch (e) {} /* beim allerersten go() sind die Konstanten unten noch nicht bereit */
  if (typeof duAufloesQ !== "undefined" && duAufloesQ.length) setTimeout(duAufloesVersuch, 400);
}
/* Untere Menüleiste: zu welchem Reiter gehört eine Ansicht? */
/* 8.0 „Allein und Zusammen“: nur noch vier große Reiter – Laden über die Talente oben, Rangliste unter „Zusammen“ */
/* 9.36: Neue „Goldsonne“ ersetzt das Sonnen-Symbol überall (Fußleiste „Start“, Spieltage, Wartet auf Gegner, Zeit ist um, Abzeichen …):
   dunkles Medaillon mit goldenem Ring, 8 lange + 8 kurze Strahlen, Weißgold-Scheibe mit Glanzpunkt (Stil wie das Arena-Logo). */
const SONNE_STRAHLEN = [0, 1, 2, 3, 4, 5, 6, 7].map(k => `<path d="M50 8 L55 27 L45 27 Z" transform="rotate(${k * 45} 50 50)"/><path d="M50 14 L53.5 27 L46.5 27 Z" transform="rotate(${k * 45 + 22.5} 50 50)"/>`).join("");
ICONS.sun = `<g class="wr" transform="scale(.24)"><defs><radialGradient id="snM" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#3a4ca8"/><stop offset=".6" stop-color="#1b2250"/><stop offset="1" stop-color="#0e1226"/></radialGradient><linearGradient id="snG" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#fff7d6"/><stop offset=".45" stop-color="#f2c14e"/><stop offset="1" stop-color="#b9821f"/></linearGradient><radialGradient id="snD" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#fff0bf"/><stop offset=".75" stop-color="#f2c14e"/><stop offset="1" stop-color="#b9821f"/></radialGradient></defs><circle cx="50" cy="50" r="47" fill="url(#snM)" stroke="url(#snG)" stroke-width="2.5"/><g fill="url(#snG)" stroke="#0e1226" stroke-width=".6" stroke-linejoin="round">${SONNE_STRAHLEN}</g><circle cx="50" cy="50" r="23" fill="url(#snD)" stroke="#8a5d12" stroke-width="1"/><ellipse cx="43" cy="41" rx="8" ry="4.5" fill="#fff" opacity=".45" transform="rotate(-30 43 41)"/></g>`;
const TABS = [["home", "Start", "sun"], ["lernen", "Lektionen", "book"], ["spielen", "Solo", "user"], ["bib", "Biblionär", "biblionaer"], ["duelle", "Arena", "arena"], ["rank", "Rangliste", "trophy"]]; /* 9.14: Arena + Biblionär statt „Zusammen“ (VIEWS.zusammen bleibt im Code, ist aber nicht mehr im Menü) */
const TAB_VON = { stift: "rank", advent: "home", beth: "home", kal: "home", duell: "duelle", zusammen: "duelle", verslektion: "lernen", lektion: "lernen", lied: "lernen", lernverse: "lernen", learn: "lernen", path: "lernen", stage: "lernen", bibelsong: "lernen", blitz: "spielen", gap: "spielen", chain: "spielen", biblionaer: "bib",
  bib: "bib", gemverwaltung: "", gegner: "duelle", duelle: "duelle", rank: "rank", shop: "rank", ich: "", profil: "", stat: "", errung: "", badges: "", wer: "", postfach: "", neuigkeiten: "", nachrichten: "" };
/* rote Zahl am Duell-Reiter: wartende Herausforderungen */
function tbDuSetzen() { let a = 0, b = 0; try { a = duFuerMich().length; b = duFuerBib().length; } catch (e) {} [["tbDu", a], ["tbBib", b]].forEach(([id, n]) => { const t = $(id); if (!t) return; t.hidden = !n; t.textContent = n; }); }
function tabbarSetzen(name) {
  const nav = $("tabbar"); if (!nav) return;
  const aktiv = name in TAB_VON ? TAB_VON[name] : name;
  document.body.dataset.tab = name === "name" ? "" : (aktiv || "frei");
  if (!nav.dataset.fertig) {
    nav.innerHTML = TABS.map(([k, t, i]) => `<button data-tab="${k}" aria-label="${t}"><span class="tb-ic">${i === "arena" ? DUELL_LOGO : svg(i)}</span><span>${t}</span>${k === "duelle" ? `<span class="tb-du" id="tbDu" hidden></span>` : k === "bib" ? `<span class="tb-du" id="tbBib" hidden></span>` : ""}</button>`).join("");
    nav.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { SFX.tap(); go(b.dataset.tab); });
    nav.dataset.fertig = "1";
  }
  tbDuSetzen();
  nav.querySelectorAll("[data-tab]").forEach(b => { const an = b.dataset.tab === aktiv; b.classList.toggle("an", an); if (an) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
}
const screen = $("screen");
const backBtn = (to = "home", txt = "Zurück") => `<button class="back" data-go="${to}">${svg("back")}<span>${txt}</span></button>`;
/* Seitenkopf der Hauptbereiche: Titel links, kleine Info rechts */
const seitenKopf = (titel, info = "") => `<div class="seitenkopf"><h1>${titel}</h1>${info ? `<span class="pill sk-info">${info}</span>` : ""}</div>`;
/* 6.57: Bereichs-Kopf im Arena-Stil – o: {ic | bild, t, sub, ring:[zahl, text], tafel:[[zahl, text]×3], zeile:{ic,t,p,r}, knopf:{ic,t,attr}} */
const BK_FARBE = { home: "#f2c14e", lernen: "var(--ar-lernen)", spielen: "var(--ar-spielen)", bib: "#7be04a", gemeinde: "var(--ar-gemeinde)", advent: "#ffcf5a", laden: "#3fd0c0" };
/* 8.2: Zusatzinfos im Kopf (Ring, Zahlentafel, „Zahlen“-Knopf) entfallen – ruhiger. Die Elemente bleiben unsichtbar im Dokument, damit Stellen, die Werte nachtragen (ringId, Tafel-IDs), weiter funktionieren. */
const bereichKopf = (m, o) => `<div class="bkopf" style="--bk:${BK_FARBE[m]}">
  <header class="bk-kopf">${o.bild ? `<span class="bk-med bild"><img src="${o.bild}" alt="" width="480" height="455"></span>` : `<span class="bk-med">${svg(o.ic)}</span>`}
    <div class="bk-t"><h1>${o.t}</h1><span>${o.sub}</span></div>
    ${o.ring ? `<div class="bk-ring" aria-hidden="true"><b${o.ringId ? ` id="${o.ringId}"` : ""}>${o.ring[0]}</b><small>${o.ring[1]}</small></div>` : ""}</header>
  ${o.tafel ? `<div class="bk-tafel" aria-hidden="true">${o.tafel.map(([z, t, id]) => `<span><b${id ? ` id="${id}"` : ""}>${z}</b> ${t}</span>`).join("")}</div>` : ""}
  ${o.knopf ? `<button class="bk-start" ${o.knopf.attr}>${svg(o.knopf.ic)}<b>${o.knopf.t}</b>${svg("bolt")}</button>` : ""}</div>`;
const bkLabel = (ic, t, n) => `<div class="bk-label">${svg(ic)}<span>${t}</span>${n ? `<i>${n}</i>` : ""}</div>`;
function wireGo() { screen.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { SFX.tap(); go(b.dataset.go, b.dataset.arg); });
}

/* ---------- Antwortmöglichkeiten ---------- */
/* Antwortmöglichkeiten: das richtige Buch + 3 Ablenker, die zumindest denkbar sind.
   Ausgeschlossen wird, was logisch nicht passen kann:
   – das gefragte Buch selbst und sein Vorgänger (auf 2. Könige folgt nicht 1. Könige)
   – nummerierte Bücher derselben Reihe außer dem direkten Nachfolger (auf 3. Mose folgt nicht 5. Mose)
   – „2. …“/„3. …“ anderer Reihen, denn davor muss immer „1. …“ stehen (auf 2. Könige folgt nicht 2. Chronik)
   Bei der Rückwärts-Kette gilt alles spiegelverkehrt. Bevorzugt werden die Bücher kurz danach. */
const NUMMER = n => { const m = /^(\d)\. (.+)$/.exec(n); return m ? { n: +m[1], s: m[2] } : null; };
const REIHE_MAX = {}; ALL.forEach(b => { const x = NUMMER(b.b); if (x) REIHE_MAX[x.s] = Math.max(REIHE_MAX[x.s] || 0, x.n); });
function denkbar(kandidat, aktuell, rueck) {
  const c = NUMMER(kandidat), u = NUMMER(aktuell);
  if (!c) return true;
  if (u && u.s === c.s) return c.n === u.n + (rueck ? -1 : 1);
  return rueck ? c.n === REIHE_MAX[c.s] : c.n === 1;
}
function optsSeq(seq, pos) {
  const correct = ALL[seq[pos + 1]].b, aktuell = ALL[seq[pos]].b, rueck = seq.length > 1 && seq[1] < seq[0];
  const verboten = new Set([correct, aktuell, pos > 0 ? ALL[seq[pos - 1]].b : ""]);
  const name = k => ALL[seq[k]].b;
  const near = [];
  const nimm = (liste, n) => shuffle(liste.filter(t => !verboten.has(t) && denkbar(t, aktuell, rueck))).slice(0, n).forEach(t => { verboten.add(t); near.push(t); });
  nimm([pos + 2, pos + 3, pos + 4, pos + 5, pos + 6].filter(k => k < seq.length).map(name), 3);
  if (near.length < 3) nimm([pos - 2, pos - 3, pos - 4, pos - 5].filter(k => k >= 0).map(name), 3 - near.length);
  if (near.length < 3) nimm(seq.map((_, k) => name(k)), 3 - near.length);
  if (near.length < 3) nimm(ALL.map(b => b.b), 3 - near.length);
  return shuffle([correct, ...near]);
}
const FWD = ALL.map((_, i) => i);
const makeOpts = i => optsSeq(FWD, i);
/* 9.12: Auch das erste Glied der Kette muss erraten werden („Womit beginnt …?“) – Antworten: das richtige und drei andere Glieder der Kette */
const KETTE_START = { bibel: "Womit beginnt die Bibel?", at: "Womit beginnt das Alte Testament?", nt: "Womit beginnt das Neue Testament?", rueck: "Welches Buch steht am Ende der Bibel?" };
function optsStart(seq) {
  const correct = ALL[seq[0]].b;
  const rest = shuffle(seq.slice(1).map(k => ALL[k].b).filter(t => t !== correct)).slice(0, 3);
  return shuffle([correct, ...rest]);
}

/* ---------- Lied: Darstellung ---------- */
/* Zeile als HTML; luecke = Segment-Index, der als Lücke erscheint */
function zeileHtml(vi, li, luecke = -1, offen = null) {
  const v = LIED[vi];
  const segs = v.lines[li].map((s, si) => {
    if (typeof s === "string") return esc(s);
    if (si === luecke) return `<span class="luecke">${"_".repeat(Math.max(4, Math.min(12, s.t.length)))}</span>`;
    if (offen && !offen.has(vi + "-" + li + "-" + si)) return `<span class="luecke zu">${"·".repeat(Math.max(3, Math.min(8, Math.round(s.t.length / 2))))}</span>`;
    return `<span class="bk-${gattungVon(s.b[0])}${s.neu ? " neu" : ""}">${esc(s.t)}</span>`;
  }).join("");
  return `<span class="lz" data-v="${vi}" data-l="${li}">${segs}</span>`;
}
const zeilenPlain = vi => LIED[vi].lines.map(ln => zeileText(ln));
function strophePlay(vi, btn) {
  if (btn && btn.classList.contains("spielt")) { vorlesenStop(); return; }
  const els = [...screen.querySelectorAll(`.lz[data-v="${vi}"]`)];
  const fertig = () => {
    if (!S.songHeard.includes(vi)) S.songHeard.push(vi);
    quest("lied", 1); save(); checkBadges();
  };
  if (btn) { btn.classList.add("spielt"); btn.innerHTML = svg("stop") + " Stopp"; }
  const rec = AUFNAHMEN["strophe-" + (vi + 1)];
  const lesen = () => vorlesen(zeilenPlain(vi).map((t, j) => ({ text: t, el: els[j] })), fertig);
  if (rec) aufnahmeSpielen(rec, els, fertig);
  else if (!liedSingen(els, fertig, lesen)) lesen();
}
function liedHinweisHtml(gi) {
  return strophenVonGruppe(gi).map(vi => `<div class="lied-mini">${LIED[vi].lines.map((_, li) => zeileHtml(vi, li)).join("<br>")}</div>`).join("");
}
/* Zeile mit dem gesuchten Buch als Lücke (für Lied-Hilfe in der Kette) */
function hilfeZeile(buch) {
  const p = BUCH_IM_LIED[buch]; if (!p) return "";
  return zeileHtml(p.v, p.l, p.s);
}

/* =====================================================================
   Bildschirme
   ===================================================================== */
const VIEWS = {};
VIEWS.advent = VIEWS_ADVENT; VIEWS.beth = VIEWS_BETH; VIEWS.kal = VIEWS_KAL; /* 7.3: Advent (advent.js) */

/* Schatztruhe für den Tagesbonus: zu, solange Aufgaben offen sind; offen mit Lichtschein, wenn alle drei geschafft sind */
const TRUHE_DEFS = `<defs><linearGradient id="trHolz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9783c"/><stop offset=".55" stop-color="#8a5226"/><stop offset="1" stop-color="#5a3214"/></linearGradient>
  <linearGradient id="trGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6d0"/><stop offset=".45" stop-color="#f2c14e"/><stop offset="1" stop-color="#a06a14"/></linearGradient>
  <linearGradient id="trInnen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1f0c"/><stop offset="1" stop-color="#6b3d1a"/></linearGradient>
  <radialGradient id="trLicht" cx=".5" cy=".75" r=".6"><stop offset="0" stop-color="#fff7c8"/><stop offset=".45" stop-color="#f2c14e" stop-opacity=".55"/><stop offset="1" stop-color="#f2c14e" stop-opacity="0"/></radialGradient></defs>`;
const TRUHE_KORPUS = `<rect x="7" y="33" width="50" height="25" rx="4" fill="url(#trHolz)" stroke="#3a1f0c" stroke-width="1.6"/>
  <path d="M9 41h46M9 49h46" stroke="#3a1f0c" stroke-width="1" opacity=".45"/>
  <rect x="13" y="33" width="5" height="25" fill="url(#trGold)" stroke="#7a4e0c" stroke-width=".8"/><rect x="46" y="33" width="5" height="25" fill="url(#trGold)" stroke="#7a4e0c" stroke-width=".8"/>
  <rect x="6" y="31" width="52" height="5" rx="2" fill="url(#trGold)" stroke="#7a4e0c" stroke-width=".8"/>
  <rect x="7" y="55" width="50" height="3.5" rx="1.5" fill="url(#trGold)" stroke="#7a4e0c" stroke-width=".6"/>`;
/* Goldener Schlüssel (eine Tagesaufgabe = ein Schlüssel) und Vorhängeschloss */
/* 9.30: Grafik für die Feedback-Karte unten auf der Startseite (Sprechblase mit Herz und Funkeln, Weißgold-Stil) */
const FB_BILD = `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="fbBl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf2"/><stop offset=".55" stop-color="#ffe9a8"/><stop offset="1" stop-color="#f2c14e"/></linearGradient><linearGradient id="fbHz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9fb8"/><stop offset="1" stop-color="#e0463c"/></linearGradient></defs>
<path d="M12 10h34a8 8 0 0 1 8 8v18a8 8 0 0 1-8 8H31l-11 10v-10h-8a8 8 0 0 1-8-8V18a8 8 0 0 1 8-8z" transform="translate(1 1)" fill="url(#fbBl)" stroke="#1b2a55" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M17 18c5-3 13-3 20-2" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".85"/>
<path d="M32 38c-8-5.4-11.6-9-11.6-12.9a6 6 0 0 1 11.6-2.1 6 6 0 0 1 11.6 2.1C43.6 29 40 32.600 32 38z" transform="translate(1 -2) scale(.97)" fill="url(#fbHz)" stroke="#1b2a55" stroke-width="2" stroke-linejoin="round"/>
<path d="M54 4l1.800 4.200L60 10l-4.200 1.800L54 16l-1.800-4.200L48 10l4.200-1.800z" fill="#fff6c8" stroke="#c98f12" stroke-width="1" stroke-linejoin="round"/>
<path d="M7 50l1.200 2.800L11 54l-2.800 1.200L7 58l-1.200-2.800L3 54l2.800-1.200z" fill="#fff6c8" stroke="#c98f12" stroke-width=".9" stroke-linejoin="round"/></svg>`;
const SCHLUESSEL = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 10.6h11v2.8h-1.6v3h-2.2v-3h-1.4v2.2h-2.2v-2.2h-3.6z" fill="#f2c14e" stroke="#7a4e0c" stroke-width=".9" stroke-linejoin="round"/><circle cx="7" cy="12" r="5" fill="#f2c14e" stroke="#7a4e0c" stroke-width=".9"/><circle cx="7" cy="12" r="2" fill="#3a2a08"/><path d="M4 9.6a3.6 3.6 0 0 1 3-1.6M12 11.3h8.6" stroke="#fff8d8" stroke-width=".9" stroke-linecap="round" fill="none" opacity=".9"/></svg>`;
const SCHLOSS = (bereit) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 11V8a4.5 4.5 0 0 1 9 0v3" fill="none" stroke="${bereit ? "#e8d9a8" : "#9aa1b8"}" stroke-width="2.6"/><rect x="4.5" y="10.5" width="15" height="11" rx="2.6" fill="${bereit ? "#f2c14e" : "#8a90a8"}" stroke="${bereit ? "#7a4e0c" : "#3c4158"}" stroke-width="1"/><path d="M6 12.5h12" stroke="#fff" stroke-opacity=".45" stroke-width="1"/><circle cx="12" cy="15" r="1.7" fill="#2a1d02"/><path d="M12 16v2.6" stroke="#2a1d02" stroke-width="1.6" stroke-linecap="round"/></svg>`;
const SCHLOSS_X = [16, 32, 48];
/* Geschlossene Truhe; k = Zahl der Schlüssel (0–3) färbt die Schlösser golden, k < 0 = ohne Schlösser (für die Animation) */
const truheZu = (k = 0) => `<svg viewBox="0 0 64 64" aria-hidden="true">${TRUHE_DEFS}${TRUHE_KORPUS}
  <path d="M7 33V25C7 15 17 10 32 10S57 15 57 25V33Z" fill="url(#trHolz)" stroke="#3a1f0c" stroke-width="1.6"/>
  <path d="M13 31V16.5M18 31V13.6M46 31V13.6M51 31V16.5" stroke="#7a4e0c" stroke-width=".6"/>
  <path d="M13 32V16Q15.5 14.2 18 13.3V32ZM46 32V13.3Q48.5 14.2 51 16V32Z" fill="url(#trGold)" stroke="#7a4e0c" stroke-width=".7"/>
  <path d="M12 21C16 15 24 13 32 13" stroke="#fff" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round"/>
  ${k < 0 ? "" : SCHLOSS_X.map((x, i) => `<g transform="translate(${x - 6.5} 28) scale(.54)">${SCHLOSS(i < k).replace(/<\/?svg[^>]*>/g, "")}</g>`).join("")}</svg>`;
const TRUHE_ZU = truheZu(3);
const TRUHE_AUF = `<svg viewBox="0 0 64 64" aria-hidden="true">${TRUHE_DEFS}
  <ellipse cx="32" cy="24" rx="30" ry="24" fill="url(#trLicht)"/>
  <g stroke="#fff3b0" stroke-linecap="round" opacity=".75"><path d="M32 22V3" stroke-width="2.2"/><path d="M22 24L13 8M42 24L51 8" stroke-width="1.6"/><path d="M17 28L4 20M47 28L60 20" stroke-width="1.2"/></g>
  <path d="M9 32L13 12H51L55 32Z" fill="url(#trInnen)" stroke="#3a1f0c" stroke-width="1.4"/>
  <path d="M13 12H51L52 15H12Z" fill="url(#trGold)" stroke="#7a4e0c" stroke-width=".6"/>
  <g stroke="#7a4e0c" stroke-width=".7"><circle cx="22" cy="30" r="4.2" fill="url(#trGold)"/><circle cx="29" cy="28.5" r="4.4" fill="url(#trGold)"/><circle cx="37" cy="29" r="4.2" fill="url(#trGold)"/><circle cx="43" cy="30.5" r="3.8" fill="url(#trGold)"/></g>
  <path d="M31.5 21.5l3.5 3.5-3.5 4-3.5-4z" fill="#b38cff" stroke="#5b2fb0" stroke-width=".8"/><path d="M29.5 25h5" stroke="#fff" stroke-opacity=".6" stroke-width=".8"/>
  ${TRUHE_KORPUS}
  <rect x="26" y="31" width="12" height="9" rx="2" fill="url(#trGold)" stroke="#7a4e0c" stroke-width="1"/></svg>`;

/* Nächste Lektion für die „Weiter“-Karte: zuerst eine noch nicht geschaffte, dann eine ohne 3 Sterne */
function naechsteLektion() {
  let i = GROUPS.findIndex((_, k) => !S.stars[k]);
  if (i < 0) i = GROUPS.findIndex((_, k) => (S.stars[k] || 0) < 3);
  return i;
}
const ringSvg = (anteil, farbe, text = "", gr = 36) => { const r = gr / 2 - 4, C = 2 * Math.PI * r;
  return `<svg class="mring" viewBox="0 0 ${gr} ${gr}" style="width:${gr}px;height:${gr}px" aria-hidden="true"><circle cx="${gr / 2}" cy="${gr / 2}" r="${r}" fill="none" stroke="#ffffff17" stroke-width="5"/><circle cx="${gr / 2}" cy="${gr / 2}" r="${r}" fill="none" stroke="${farbe}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - Math.min(1, anteil))}" transform="rotate(-90 ${gr / 2} ${gr / 2})"/>${text ? `<text x="${gr / 2}" y="${gr / 2 + 4.2}" text-anchor="middle" font-size="${gr > 40 ? 13 : 11.5}" font-weight="900" fill="currentColor" font-family="Nunito, sans-serif">${text}</text>` : ""}</svg>`; };
const TAL_MUENZE = svg("tal"); /* das eine Talente-Symbol (Licht-Münze, definiert in index.html) */

/* Schatztruhe öffnen: Truhe fliegt in die Mitte, wackelt, springt auf – Licht, Münzen, Belohnung */
function truheOeffnen(von) {
  if (S.dq.bonus || document.querySelector(".truhe-fx") || truheLaeuft) return;
  truheLaeuft = true;
  truheBuchen(0).then(e => {
    truheLaeuft = false;
    if (S.dq.bonus || document.querySelector(".truhe-fx")) return;
    if (e === "schon") { S.dq.geschafft = true; S.dq.bonus = true; save(); toast(`${TAL_MUENZE}<div><b>Schatztruhe schon geöffnet</b><div class="small muted">Für heute wurde sie bereits abgeholt – morgen gibt es die nächste.</div></div>`); if (current === "home") go("home"); return; }
    if (e === "netz") { toast(`${TAL_MUENZE}<div><b>Keine Verbindung</b><div class="small muted">Die Truhe öffnet sich, sobald du wieder online bist.</div></div>`); return; }
    if (e === "tag") { toast(`${TAL_MUENZE}<div><b>Datum passt nicht</b><div class="small muted">Bitte Datum und Uhrzeit deines Geräts prüfen (automatisch einstellen).</div></div>`); return; }
    truheAnimation(von);
  });
}
function truheAnimation(von) {
  S.dq.geschafft = true; S.dq.bonus = true; save();
  const ov = document.createElement("div"); ov.className = "truhe-fx"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Schatztruhe");
  const muenzen = Array.from({ length: 22 }, (_, i) => { const w = (i / 22) * Math.PI * 2 + Math.random() * .3, d = 110 + Math.random() * 90;
    return `<i class="tf-muenze" style="--dx:${Math.cos(w) * d}px;--dy:${Math.sin(w) * d - 60}px;--r:${Math.random() * 720 - 360}deg;--v:${Math.random() * .25}s">${TAL_MUENZE}</i>`; }).join("");
  const funken = Array.from({ length: 16 }, (_, i) => `<i class="tf-funke" style="--w:${i * 22.5}deg;--v:${Math.random() * .3}s"></i>`).join("");
  ov.innerHTML = `<div class="tf-strahlen"></div><div class="tf-blitz"></div>
    <div class="tf-buehne"><div class="tf-truhe">${truheZu(-1)}${SCHLOSS_X.map((x, i) => `<span class="tf-schloss" style="--x:${x};--v:${i * .22}s">${SCHLOSS(true)}<i class="tf-klick"></i></span><span class="tf-schl" style="--x:${x};--sx:${(i - 1) * 130}px;--v:${i * .22}s">${SCHLUESSEL}</span>`).join("")}</div>${muenzen}${funken}</div>
    <div class="tf-lohn">
      <div class="tf-titel">Schatz gefunden!</div>
      <div class="tf-karte tf-xp"><b>+${AUFGABE_BONUS_XP}</b><span>XP</span></div>
      <div class="tf-karte tf-tal">${TAL_MUENZE}<b>+${AUFGABE_BONUS}</b><span>Talente</span></div>
      ${S.goalStreak > 1 ? `<div class="tf-serie">${svg("fire")} ${S.goalStreak} Tage in Folge alle Aufgaben!</div>` : ""}
      <button class="btn gold tf-ok">Super!</button>
    </div>`;
  document.body.appendChild(ov);
  const truhe = ov.querySelector(".tf-truhe");
  SFX.tap(); requestAnimationFrame(() => ov.classList.add("an"));
  const t = (ms, f) => setTimeout(f, ms);
  const klick = () => { tone(1800, 0, .04, "square", .07); tone(900, .04, .08, "square", .06); };
  t(450, () => ov.classList.add("schluessel"));                                   // drei Schlüssel fliegen zu den Schlössern
  [0, 1, 2].forEach(i => t(950 + i * 220, () => SFX.tick()));
  t(1500, () => ov.classList.add("drehen"));                                      // Schlüssel drehen sich
  [0, 1, 2].forEach(i => t(1600 + i * 220, () => { klick(); vibrate(15); }));
  t(2250, () => { ov.classList.add("loesen"); SFX.badge(); });                     // Schlösser springen ab
  t(2600, () => { ov.classList.add("wackeln"); SFX.tick(); });
  t(2850, () => SFX.tick());
  t(3150, () => {
    ov.classList.remove("wackeln"); ov.classList.add("offen"); truhe.innerHTML = TRUHE_AUF; SFX.win(); vibrate([30, 40, 80]);
    addXp(AUFGABE_BONUS_XP, null, "tagesbonus", { d: "Schatztruhe (3 Tagesaufgaben)" }); xqBelohnung("truhe", AUFGABE_BONUS_XP, AUFGABE_BONUS, S.dq && S.dq.day); addTal(AUFGABE_BONUS);
  });
  t(3600, () => { ov.classList.add("lohn"); SFX.coin(); });
  t(3950, () => SFX.coin());
  const zu = () => { ov.classList.add("weg"); setTimeout(() => { ov.remove(); if (current === "home") go("home"); }, 350); };
  ov.querySelector(".tf-ok").onclick = () => { SFX.tap(); zu(); };
}

/* Arena-Logo „Kolosseum“: Weißgold-Kolosseum mit Lorbeer auf rotem Medaillon mit Koralle-Ring; überall gleich (Startseite, Fußleiste, Abzeichen, Rangliste, Aufgaben) */
const DUELL_LOGO = `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><radialGradient id="dlR" cx=".4" cy=".32" r=".75"><stop offset="0" stop-color="#ff8a6e"/><stop offset=".5" stop-color="#c8344f"/><stop offset="1" stop-color="#5a1430"/></radialGradient><linearGradient id="dlG" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#fff0bf"/><stop offset=".7" stop-color="#f2c14e"/><stop offset="1" stop-color="#b9821f"/></linearGradient><linearGradient id="dlL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff7d6"/><stop offset=".5" stop-color="#f2c14e"/><stop offset="1" stop-color="#a8741a"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="url(#dlR)" stroke="#ff8a5c" stroke-width="3"/><circle cx="32" cy="32" r="26.5" fill="none" stroke="#ffb3a0" stroke-opacity=".25" stroke-width="1"/><path d="M12 22a22 22 0 0 1 22-14" stroke="#fff" stroke-opacity=".35" stroke-width="2.5" fill="none" stroke-linecap="round"/><g fill="url(#dlL)" stroke="#5a3a0c" stroke-width=".45"><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(21.6 54.3) rotate(173) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(21.6 54.3) rotate(237) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(17.9 52.2) rotate(183) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(17.9 52.2) rotate(247) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(14.6 49.4) rotate(193) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(14.6 49.4) rotate(257) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(11.8 46.1) rotate(203) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(11.8 46.1) rotate(267) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(9.7 42.4) rotate(213) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(9.7 42.4) rotate(277) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(8.2 38.4) rotate(223) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(8.2 38.4) rotate(287) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(42.4 54.3) rotate(123) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(42.4 54.3) rotate(187) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(46.1 52.2) rotate(113) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(46.1 52.2) rotate(177) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(49.4 49.4) rotate(103) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(49.4 49.4) rotate(167) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(52.2 46.1) rotate(93) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(52.2 46.1) rotate(157) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(54.3 42.4) rotate(83) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(54.3 42.4) rotate(147) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(55.8 38.4) rotate(73) translate(0 0) translate(2.4 0)" /><ellipse cx="0" cy="0" rx="3.3" ry="1.35" transform="translate(55.8 38.4) rotate(137) translate(0 0) translate(2.4 0)" /></g><ellipse cx="32" cy="49.6" rx="19" ry="1.8" fill="#2a0a18" opacity=".45"/><path d="M12.6 47.5V23.6Q32 14.4 51.4 22.4v6.1l-2.6 1.1v4.6l2.6 1V47.5z" fill="url(#dlG)" stroke="#1b2a55" stroke-width="1.6" stroke-linejoin="round"/><path d="M12.8 31.4h38.4M12.8 38.7h38.4" stroke="#a8741a" stroke-width=".9"/><g fill="#1b2a55" opacity=".88"><path d="M15.3 30V26.4a1.6 1.6 0 0 1 3.2 0V30z"/><path d="M21.2 30V26.4a1.6 1.6 0 0 1 3.2 0V30z"/><path d="M27.1 30V26.4a1.6 1.6 0 0 1 3.2 0V30z"/><path d="M33.0 30V26.4a1.6 1.6 0 0 1 3.2 0V30z"/><path d="M38.9 30V26.4a1.6 1.6 0 0 1 3.2 0V30z"/><path d="M15.3 37.3V33.9a1.6 1.6 0 0 1 3.2 0V37.3z"/><path d="M21.2 37.3V33.9a1.6 1.6 0 0 1 3.2 0V37.3z"/><path d="M27.1 37.3V33.9a1.6 1.6 0 0 1 3.2 0V37.3z"/><path d="M33.0 37.3V33.9a1.6 1.6 0 0 1 3.2 0V37.3z"/><path d="M38.9 37.3V33.9a1.6 1.6 0 0 1 3.2 0V37.3z"/><path d="M44.8 37.3V33.9a1.6 1.6 0 0 1 3.2 0V37.3z"/><path d="M15.3 45.2V41.2a1.6 1.6 0 0 1 3.2 0V45.2z"/><path d="M21.2 45.2V41.2a1.6 1.6 0 0 1 3.2 0V45.2z"/><path d="M27.1 45.2V41.2a1.6 1.6 0 0 1 3.2 0V45.2z"/><path d="M33.0 45.2V41.2a1.6 1.6 0 0 1 3.2 0V45.2z"/><path d="M38.9 45.2V41.2a1.6 1.6 0 0 1 3.2 0V45.2z"/><path d="M44.8 45.2V41.2a1.6 1.6 0 0 1 3.2 0V45.2z"/></g><rect x="10.8" y="45.4" width="42.4" height="3.6" rx="1" fill="url(#dlG)" stroke="#1b2a55" stroke-width="1.1"/><path d="M15.2 23.2Q32 16.4 48.4 22" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".85"/><path d="M50 6.5l1.1 2.9 2.9 1.1-2.9 1.1-1.1 2.9-1.1-2.9-2.9-1.1 2.9-1.1z" fill="#fff3c0"/></svg>`;
/* Duell-Logo auch als kleines Symbol (Abzeichen, Tagesaufgabe, Rangliste) */
ICONS.duell = `<g class="du-ic-g" transform="scale(.375)">${DUELL_LOGO.replace(/<\/?svg[^>]*>/g, "").replace(/id="dl/g, 'id="dk').replace(/url\(#dl/g, "url(#dk")}</g>`;
VIEWS.home = () => {
  neuerTag(); save();
  const vKey = VERS_DES_TAGES[dayNum(today()) % VERS_DES_TAGES.length];
  const geschafft = GROUPS.filter((_, k) => S.stars[k]).length;
  const ni = naechsteLektion(), duN = duFuerMich().length, bibN = duFuerBib().length;
  /* Seit 6.43: vier gleich große Felder (2×2) – Lernen, Spielen, Biblionär, Arena */
  const felder = [
    { go: "lernen", ar: "lernen", ic: svg("book"), t: "Lektionen", info: `<b>${geschafft}/${GROUPS.length}</b> · ${ni >= 0 ? esc(GROUPS[ni].name) : "Alles geschafft!"}`, ecke: "" },
    { go: "spielen", ar: "spielen", ic: svg("bolt"), t: "Spielen", info: S.bestBlitz ? `Blitz · Kette · Lücke<br>Rekord <b>${S.bestBlitz}</b>` : "Blitz · Kette · Lücke", ecke: "" },
    { go: "bib", ar: "bib", ic: svg("biblionaer"), t: "Biblionär", info: S.bibRekord ? `Rekord <b>${pkt(S.bibRekord)}</b>` : "15 Fragen zur Million", ecke: "" },
    { id: "torDuell", ar: "arena", ic: `<span class="sf-logo">${DUELL_LOGO}</span>`, t: "Arena", info: duN ? `<b>${duN}</b> ${duN === 1 ? "Duell wartet" : "Duelle warten"}` : "Fordere jemanden heraus", ecke: duN ? `<i class="du-punkt">${duN}</i>` : "" }];
  const weiter = `<div class="sf-grid">${felder.map(f => `<button class="sf" data-ar="${f.ar}" ${f.go ? `data-go="${f.go}"` : `id="${f.id}"`} aria-label="${f.t}${f.ar === "arena" && duN ? ` – ${duN} ${duN === 1 ? "Herausforderung wartet" : "Herausforderungen warten"}` : ""}">
      <span class="sf-ic">${f.ic}</span><span class="sf-t">${f.t}</span><span class="sf-info">${f.info}</span>${f.ecke ? `<span class="sf-ecke">${f.ecke}</span>` : ""}</button>`).join("")}</div>`;
  const erledigt = S.dq.items.filter(i => i.done).length;
  /* Tagesaufgaben kompakt: je Aufgabe eine Zeile mit kleinem Ring, rechts die Schatztruhe */
  const AUFG_ART = { runde: ["step", "spielen", "spielen"], xp: ["star", "home", "spielen"], right: ["target", "spielen", "blitz"], blitz: ["bolt", "spielen", "blitz"],
    station: ["book", "lernen", "lernen"], ketteGespielt: ["link", "spielen", "spielen"], lied: ["music", "lernen", "lied"], luecke: ["scroll", "spielen", "gap"], lernvers: ["scroll", "lernen", "verslektion"], duell: ["duell", "spielen", "duelle"] };
  const aufg = S.dq.items.map(it => { const a = AUFGABEN.find(x => x.id === it.id); if (!a) return ""; const pr = Math.min(it.prog, a.ziel);
    const [ic, ar, ziel] = AUFG_ART[a.ev] || ["target", "spielen", "spielen"], C = 2 * Math.PI * 13;
    return `<li><button class="tz ${it.done ? "done" : ""}" data-ar="${ar}" data-go="${ziel}"${ziel === "gap" ? ' data-arg="alle"' : ""} aria-label="${esc(a.text)}: ${pr} von ${a.ziel}${it.done ? ", erledigt" : ""}">
      <span class="tz-ic"><svg class="tz-ring" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="none" stroke="#ffffff16" stroke-width="3"/><circle cx="16" cy="16" r="13" fill="none" stroke="var(--tq)" stroke-width="3" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pr / a.ziel)}" transform="rotate(-90 16 16)"/></svg>${svg(ic)}</span>
      <span class="tz-tx">${esc(a.text)}</span><span class="tz-z">${it.done ? SCHLUESSEL : `${pr}/${a.ziel}`}</span></button></li>`; }).join("");
  const bereit = !S.dq.bonus && (S.dq.geschafft || erledigt === 3);
  const truhe = S.dq.bonus
    ? `<div class="tz-truhe erhalten" aria-label="Schatztruhe geöffnet: ${AUFGABE_BONUS_XP} XP und ${AUFGABE_BONUS} Talente erhalten">${TRUHE_AUF}<span class="tz-lohn">${svg("check")} Erhalten</span></div>`
    : bereit
    ? `<button class="tz-truhe bereit" id="truheBtn" aria-label="Schatztruhe mit drei Schlüsseln öffnen">${truheZu(3)}<span class="tz-lohn">Öffnen!</span></button>`
    : `<div class="tz-truhe" aria-label="Schatztruhe – ${erledigt} von 3 Schlüsseln">${truheZu(erledigt)}<span class="tz-keys">${[0, 1, 2].map(i => `<i class="${i < erledigt ? "an" : ""}">${SCHLUESSEL}</i>`).join("")}</span><span class="tz-lohn">+${AUFGABE_BONUS_XP} XP · +${AUFGABE_BONUS}${TAL_MUENZE}</span></div>`;
  const siegel = (() => { const f = Object.entries(KETTEN).map(([id, k]) => ({ id, k, t: S.meister[id] || [] })).filter(x => x.t.length && siegelRest(x.t) <= 5).sort((a, b) => siegelRest(a.t) - siegelRest(b.t))[0];
      return f ? `<button class="erinnerung" data-go="spielen">${siegelHtml(siegelStufe(f.t), siegelFrisch(f.t), true)}<span><b>${siegelFrisch(f.t) ? `Dein Siegel „${esc(f.k.name)}“ verblasst in ${siegelRest(f.t)} Tag(en)` : `Dein Siegel „${esc(f.k.name)}“ ist verblasst`}</b><span class="small muted">Jetzt die Kette wiederholen und auffrischen${siegelFrisch(f.t) ? "" : ` (+${AUFFRISCH_TAL} Talente)`}</span></span></button>` : ""; })();
  /* 9.15: Startseite – vier Kacheln 2×2, Logo ragt oben heraus */
  const ktKachel = (go, c, logo, titel, sub, n = 0) => `<button class="kt" data-go="${go}" style="--c:${c}" aria-label="${titel}${n ? ` – ${n} ${n === 1 ? "Duell wartet" : "Duelle warten"}` : ""}"><span class="kt-logo${/^<svg/.test(logo) && !logo.includes('id="dlR"') ? " med" : ""}">${logo}</span><span class="kt-tx"><b>${titel}</b><small>${sub}</small></span>${n ? `<i class="kt-n">${n}</i>` : ""}</button>`;
  const ezZeile = (go, ar, ic, t, sub, ecke = "") => `<button class="ez" data-ar="${ar}" data-go="${go}"><span class="ez-ic">${ic}</span><span class="ez-tx"><b>${t}</b><small>${sub}</small></span>${ecke}<i class="ez-pf">›</i></button>`;
  /* 8.2: „Dein Tag“ entfällt – der Kopf IST die Tagesaufgabe (Truhe statt Sonne, Schlüssel rechts), darunter wie gewohnt der Kringel-Bogen.
     Antippen klappt die drei Aufgaben auf; ist die Truhe bereit, öffnet der Kopf direkt die Truhe. */
  const keysH = `<span class="ez-keys${S.dq.bonus ? " verbraucht" : ""}" aria-hidden="true">${[0, 1, 2].map(i => `<i class="${i < erledigt ? "an" : ""}">${SCHLUESSEL}</i>`).join("")}</span>`;
  const kopfTitel = S.dq.bonus ? "Geöffnet!" : bereit ? "Öffnen!" : `Heute ${erledigt}/3`;
  const kopfSub = S.dq.bonus ? "Belohnung abgeholt" : bereit ? "Truhe antippen zum Öffnen" : "3 Aufgaben = 1 Schatztruhe";
  const kopfInnen = `<span class="bk-med truhe${S.dq.bonus ? " offen" : ""}">${S.dq.bonus ? TRUHE_AUF + `<i class="truhe-haken">${svg("check")}</i>` : truheZu(bereit ? 3 : erledigt)}</span><div class="bk-t"><h1>${kopfTitel}</h1><span>${kopfSub}</span></div>${keysH}`;
  const kopf = bereit
    ? `<div class="bkopf start-aufg" style="--bk:#f2c14e"><button class="bk-kopf bk-aufg bereit" id="truheKopf" aria-label="Schatztruhe mit drei Schlüsseln öffnen">${kopfInnen}</button></div>`
    : `<div class="bkopf start-aufg" style="--bk:#f2c14e"><details class="bk-aufg-d"><summary class="bk-kopf bk-aufg" aria-label="Tagesaufgaben: ${erledigt} von 3 geschafft">${kopfInnen}</summary>
        <section class="heute3 ${S.dq.bonus ? "fertig" : ""}" aria-label="Tagesaufgaben, ${erledigt} von 3 erledigt"><ul>${aufg}</ul>${truhe}</section></details></div>`;
  screen.innerHTML = `<div class="stack start start2 start8">
    ${kopf}
    ${adventMiniHtml(true)}${siegel}
    ${bkLabel("scroll", "Lernvers")}
    <div class="start-vers">${MONATSVERSE[monatKey()] ? lvKarte(monatKey()) : `<button class="vers-zeile" id="versZeile" aria-expanded="false">${versHtml(vKey, "tag klein")}<span class="vz-mehr">mehr</span></button>`}</div>
    ${bkLabel("play", "Los geht's")}
    <div class="kt-grid">
      ${ktKachel("lernen", "var(--ar-lernen)", svg("book"), "Lektionen", "66 Bücher der Bibel")}
      ${ktKachel("spielen", "var(--ar-spielen)", svg("user"), "Solo", "Blitz · Ketten · Lernvers")}
      ${ktKachel("bib", "#7be04a", `<img src="icons/biblionaer-logo.webp" alt="">`, "Biblionär", bibN ? (bibN === 1 ? "1 Duell wartet" : `${bibN} Duelle warten`) : "15 Fragen zur Million", bibN)}
      ${ktKachel("duelle", "#e0463c", DUELL_LOGO, "Arena", duN ? (duN === 1 ? "1 Duell wartet" : `${duN} Duelle warten`) : "Fordere jemand heraus", duN)}
    </div>
    ${entwickler && postfachNeu ? `<button class="erinnerung pf-hinweis" data-go="postfach">${svg("chat")}<span><b>${postfachNeu} ${postfachNeu === 1 ? "neue Meldung" : "neue Meldungen"} im Postkasten</b><span class="small muted">Feedback, Status und Datenbank</span></span></button>` : ""}
    <div class="fb-abstand" aria-hidden="true"></div>
    <button class="fb-karte" id="fbLinkStart" aria-label="Feedback an den Entwickler"><span class="fb-bild">${FB_BILD}</span><span class="fb-tx"><b>Feedback an den Entwickler</b><small>Idee, Lob oder Fehler? Schreib mir!</small></span></button>
  </div>`;
  wireGo();
  $("fbLinkStart").onclick = () => { SFX.tap(); feedbackOeffnen(); };
  const tb = $("truheBtn"); if (tb) tb.onclick = () => truheOeffnen(tb);
  const tk = $("truheKopf"); if (tk) tk.onclick = () => truheOeffnen(tk);
  const td = $("torDuell"); if (td) td.onclick = () => { SFX.tap(); go("duelle"); };
  lvVerdrahten();
  if (S.lbName) levelNachreichen();
  const vz = $("versZeile"); if (vz) { vz.onclick = () => { const auf = vz.getAttribute("aria-expanded") !== "true"; vz.setAttribute("aria-expanded", auf); };
    requestAnimationFrame(() => { const bq = vz.querySelector("blockquote"); if (bq && bq.scrollHeight <= bq.clientHeight + 2) vz.classList.add("passt"); }); }
};

/* ---------- Schatz (Reiter „Ich“): Profil oben, darunter direkt der Laden ---------- */
VIEWS.ich = (tab) => VIEWS.shop(tab);

/* ---------- Bereich Lernen ---------- */
let lernTeil = null;
VIEWS.lernen = (teil) => {
  const { atP, ntP } = fortschritt();
  const ni = naechsteLektion();
  if (teil === "at" || teil === "nt") lernTeil = teil;
  if (!lernTeil) lernTeil = ni >= 5 ? "nt" : "at";
  const sterne = Object.values(S.stars).reduce((a, b) => a + b, 0);
  const lektion = (g, i) => { const st = S.stars[i] || 0, jetzt = i === ni; return `<button class="lek ${st ? "done" : ""} ${jetzt ? "jetzt" : ""}" data-go="lektion" data-arg="${i}"><span class="lek-nr" aria-label="Lektion ${i + 1}">${svg("lek-" + (i + 1))}</span><span class="lek-tx"><b>${g.name}</b><span>${g.books.length} Bücher · ${g.books[0]} – ${g.books[g.books.length - 1]}</span></span>${jetzt ? `<span class="jetzt-chip">${st ? "Sterne holen" : "Weiter"} ›</span>` : `<span class="stars">${STAR(st >= 1)}${STAR(st >= 2)}${STAR(st >= 3)}</span>`}</button>`; };
  const at = lernTeil === "at", P = at ? atP : ntP, T = at ? AT_TITEL : NT_TITEL;
  screen.innerHTML = `${bereichKopf("lernen", { ic: "book", t: "Lektionen", sub: ni >= 0 ? `Weiter mit: ${esc(GROUPS[ni].name)}` : "Alles geschafft!", ring: [sterne, sterne === 1 ? "Stern" : "Sterne"],
    tafel: [[atP + "%", "AT"], [ntP + "%", "NT"], [`${S.songHeard.length}/8`, "Lied"]],
    knopf: ni >= 0 ? { ic: "book", t: "Weiterlernen", attr: `data-go="lektion" data-arg="${ni}"` } : null })}
  ${bkLabel("book", "Lektionen")}
  <div class="kb-tabs lern-tabs" role="tablist" aria-label="Testament"><button role="tab" data-teil="at" aria-selected="${at}">${svg("kette-at")}<span>Altes Testament</span></button><button role="tab" data-teil="nt" aria-selected="${!at}">${svg("kette-nt")}<span>Neues Testament</span></button></div>
  <div class="titelzeile"><span class="tag ${lernTeil}">${lernTeil.toUpperCase()}</span> <b>${esc(T[titelIndex(T, P)][1])}</b><span class="tbar"><i style="width:${P}%"></i></span><span class="small muted">${P}%</span></div>
  <div class="stack lek-liste">${(at ? GROUPS.slice(0, 5) : GROUPS.slice(5)).map((g, k) => lektion(g, at ? k : k + 5)).join("")}</div>
  ${bkLabel("music", "Lernhilfen")}
  <div class="duo">
    <button class="mini-karte" data-go="lied"><span class="lek-nr">${svg("music")}</span><b>Lied</b><span>Zum Mitsingen</span></button>
    <button class="mini-karte" data-go="learn"><span class="lek-nr">${svg("eye")}</span><b>Spickzettel</b><span>Alle 66 Bücher</span></button>
  </div>
  <button class="bereich klein lv-zugang" data-go="lernverse"><span class="b-ic">${svg("scroll")}</span><span class="b-tx"><b>Lernverse</b><span>Vers des Monats und frühere Verse</span></span></button>`;
  wireGo();
  screen.querySelectorAll("[data-teil]").forEach(b => b.onclick = () => { SFX.tap(); lernTeil = b.dataset.teil; VIEWS.lernen(); });
};

VIEWS.verslektion = vlStart; /* Vers-Lektion (Code oben beim Lernvers) */
/* Archiv: alle Lernverse bis zum laufenden Monat, neuester zuerst */
VIEWS.lernverse = (zurueck) => {
  const jetzt = monatKey(), keys = Object.keys(MONATSVERSE).filter(k => k <= jetzt).sort().reverse();
  const fertig = keys.filter(k => lvStand(k).st >= LV_MAX).length, bew = keys.filter(k => lvStand(k).b).length;
  screen.innerHTML = `${backBtn(zurueck === "home" ? "home" : "lernen")}${seitenKopf("Lernverse", `${fertig}/${keys.length} gemeistert`)}
    <p class="small muted lv-intro">Alle Lernverse der Gemeinde. Jeden Monat kommt einer dazu – präge ihn dir in fünf Stufen ein, eine pro Tag – wer sicher ist (Turbo ab 90 %), schafft bis zu drei. Frühere Verse tauchen in den Lektionen zur Wiederholung auf. ${bew ? `Bewahrt: <b>${bew}</b>` : "Am Monatsende wartet die Monatsprüfung – dann ist der Vers bewahrt."}</p>
    <div class="stack lv-archiv">${keys.map(k => lvKarte(k, "archiv")).join("")}</div>`;
  wireGo(); lvVerdrahten();
};

/* ---------- 8.2: Spielauswahl – Allein und Zusammen sehen gleich aus (Kette · Blitz · Biblionär · Lied bzw. Lernvers), je mit Rubrik-Trenner ---------- */
/* 8.3: Rangliste und Laden teilen sich einen Reiter (rechts in der Leiste) */
const rlSchalter = akt => `<div class="rl-switch" style="--rl:${akt === "shop" ? "#3fd0c0" : "#5fe0b0"}" role="tablist" aria-label="Rangliste oder Laden"><button role="tab" data-go="rank" aria-selected="${akt === "rank"}">${svg("trophy")}<span>Rangliste</span></button><button role="tab" data-go="shop" aria-selected="${akt === "shop"}">${svg("shop")}<span>Laden</span></button></div>`;
/* 9.7: Jede Kachel gleich aufgebaut – Spielsymbol, Name, eine Zeile eigener Stand und darunter ein feiner Fortschrittsbalken am Kachelrand (macht die Kachel nicht größer). */
const spKachel = (attr, ic, t, sub = "", extra = "", pct = null) => `<button class="bereich klein sp-k ${extra}" ${attr}><span class="b-ic">${ic}</span><span class="b-tx"><b>${t}</b>${sub ? `<span>${sub}</span>` : ""}</span>${pct === null ? "" : `<i class="sp-fort" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><i style="width:${Math.max(0, Math.min(100, pct)).toFixed(1)}%"></i></i>`}</button>`;
const BLITZ_ZIELE = [10, 20, 30, 40, 50, 60, 80, 100, 130, 160, 200];
function spielStand(id) {
  if (id === "blitz") { const r = S.bestBlitz | 0, z = BLITZ_ZIELE.find(x => x > r) || r; return r ? [`Rekord ${r} · Ziel ${z}`, Math.min(100, r / z * 100)] : ["Noch nicht gespielt", 0]; }
  if (id === "quiz") { const st = BIB_LEITER.filter(p => p <= (S.bibRekord || 0)).length; return st ? [`Rekord: Frage ${st} von ${BIB_LEITER.length}`, st / BIB_LEITER.length * 100] : ["Noch nicht gespielt", 0]; }
  if (id === "vers") { const k = monatKey(); if (!MONATSVERSE[k]) return ["", null]; const st = Math.min(LV_MAX, lvStand(k).st); return [st >= LV_MAX ? "Vers des Monats gemeistert" : st ? `Stufe ${st} von ${LV_MAX}` : "Neuer Vers wartet", st / LV_MAX * 100]; }
  if (id === "lied") { const n = Math.min(8, S.songHeard.length); return [`${n} von 8 Strophen gehört`, n / 8 * 100]; }
  return ["", null];
}
function spielMenue(zus) {
  const kette = Object.entries(KETTEN).map(([id, k]) => { const n = Math.min(k.seq.length, kettenBuecher(k.key));
    return spKachel(zus ? `data-dtyp="kette-${id}"` : `data-k="${id}"`, svg("kette-" + id), k.name, n ? `${n} von ${k.seq.length}` : "Los geht's!", "sp-ketten", n / k.seq.length * 100); }).join("");
  const sp = (id, attr, ic, t) => { const [sub, pct] = spielStand(id === "" ? "lied" : id); return spKachel(zus ? `data-dtyp="${id}"` : attr, svg(ic), t, sub, "", pct); };
  return `<div class="sp-menue" style="--ar:var(--ar-${zus ? "gemeinde" : "spielen"})">
    ${bkLabel("link", "Kette")}
    <div class="sp-gitter">${kette}</div>
    ${bkLabel("scroll", "Themen-Ketten")}<div class="sp-gitter">${Object.entries(TKETTEN).map(([id, k]) => { const n = Math.min(k.items.length, S[k.key] ? S[k.key] + 1 : 0); return spKachel(zus ? `data-dtyp="kette-${id}"` : `data-tk="${id}"`, svg(k.ic), k.name, n ? `${n} von ${k.items.length}` : "Los geht's!", "sp-ketten", n / k.items.length * 100); }).join("")}</div>
    ${bkLabel("bolt", "Blitz")}
    ${sp("blitz", 'data-go="blitz"', "bolt", "Blitz-Runde")}
    ${bkLabel("scroll", "Lernvers")}
    ${sp("vers", 'data-go="verslektion"', "scroll", "Lernvers")}
  </div>`;
}
/* 9.21: Solo im Medaillon-Stil von „Zusammen“ – ein Tipp startet das Spiel direkt (kein Gegner nötig); die Medaillons und Stände kommen aus zvSpiele() */
const soloAttr = s => { if (s.id === "blitz") return 'data-go="blitz"'; if (s.id === "vers") return 'data-go="verslektion"'; const id = s.id.replace(/^kette-/, ""); return KETTEN[id] ? `data-k="${id}"` : `data-tk="${id}"`; };
VIEWS.spielen = () => {
  const g = zvSpiele();
  screen.innerHTML = `${bereichKopf("spielen", { ic: "user", t: "Solo", sub: "Wie weit kommst du heute?" })}
  <div class="zv"><div class="zv2-buehne">
    <div class="zv2-reihe"><span class="zv2-tit">${svg("link")}Ketten</span></div><div class="zv2-gitter">${g.slice(0, 4).map(x => zvMedaille(x, false, soloAttr(x))).join("")}</div>
    <div class="zv2-reihe"><span class="zv2-tit">${svg("star")}Themen · Blitz · Vers</span></div><div class="zv2-gitter">${g.slice(4).map(x => zvMedaille(x, false, soloAttr(x))).join("")}</div></div>
    <p class="zv2-hinw"><span>1</span>Spiel antippen<i></i><span>2</span>Los geht's!</p></div>`;
  wireGo();
  screen.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { SFX.tap(); countdown(() => playChain(b.dataset.k), cdSolo("kette-" + b.dataset.k)); });
  screen.querySelectorAll("[data-tk]").forEach(b => b.onclick = () => { SFX.tap(); countdown(() => playThemenKette(b.dataset.tk), cdSolo("kette-" + b.dataset.tk)); });
};

/* ---------- 9.19: „Zusammen“ / Neues Duell: Medaillon-Bühne. Spiel antippen → darunter erscheint die Gegnerliste, ein Tipp auf einen Gegner startet das Duell ---------- */
const ZV_FARBE = { kette: "#ffb54a", gebote: "#b38cff", schoepfung: "#5fe0b0", blitz: "#ff8a5c", vers: "#7fc8ff" };
const zvPr = v => Math.max(0, Math.min(100, v || 0)).toFixed(1);
function zvSpiele() {
  const k = id => { const K = KETTEN[id], n = Math.min(K.seq.length, kettenBuecher(K.key));
    return { id: "kette-" + id, ic: "kette-" + id, name: K.name, kurz: { bibel: "Ganze Bibel", at: "Altes Test.", nt: "Neues Test.", rueck: "Rückwärts" }[id], sub: n ? `${n} von ${K.seq.length}` : "Los geht's!", pct: n / K.seq.length * 100, grp: "kette" }; };
  const t = id => { const K = TKETTEN[id], n = Math.min(K.items.length, S[K.key] ? S[K.key] + 1 : 0);
    return { id: "kette-" + id, ic: K.ic, name: K.name, kurz: K.name, sub: n ? `${n} von ${K.items.length}` : "Los geht's!", pct: n / K.items.length * 100, grp: id }; };
  const bp = spielStand("blitz")[1], [vs0, vp] = spielStand("vers"), r = S.bestBlitz | 0;
  const vs = vs0.startsWith("Neuer") ? "Neuer Vers!" : vs0.startsWith("Vers des") ? "Gemeistert" : vs0;
  return [k("bibel"), k("at"), k("nt"), k("rueck"), t("gebote"), t("schoepfung"),
    { id: "blitz", ic: "bolt", name: "Blitz", kurz: "Blitz", sub: r ? `Rekord ${r}` : "Los geht's!", pct: bp, grp: "blitz" },
    { id: "vers", ic: "scroll", name: "Lernvers", kurz: "Lernvers", sub: vs, pct: vp, grp: "vers" }];
}
let zvWahl = null;
const zvMedaille = (s, an, attr) => `<button class="zv2-m${an ? " an" : ""}" ${attr || `data-dtyp="${s.id}" aria-pressed="${an}"`} style="--c:${ZV_FARBE[s.grp]};--p:${zvPr(s.pct)}"><span class="zv2-ring"><span class="zv2-in">${svg(s.ic)}</span></span><b>${esc(s.kurz)}</b><small>${esc(s.sub)}</small></button>`;
/* Gegnerliste unter den Spielen: ein Tipp = Duell starten */
function zvGegnerHtml() {
  const G = DU_TYPEN[zvWahl]; if (!G) return "";
  const offen = (duListe || []).filter(d => d.von === S.pid && duStatus(d) === "offen"), frei = Math.max(0, DU_MAX_OFFEN - offen.length), q = nameSchluessel(duSuche);
  return `<section class="zv2-gegner" id="zvGegner" aria-label="Gegner wählen">
    <div class="zv2-gk"><span class="zv2-gic">${svg(G.ic)}</span><span class="zv2-gt"><small>Dein Spiel</small><b>${esc(G.name)}</b></span><span class="zv2-gh">Gegner antippen – dann geht es los!</span></div>
    ${!frei ? `<p class="small muted" style="margin:0">Du hast schon ${DU_MAX_OFFEN} offene Herausforderungen – erst müssen diese gespielt werden. Unter „Arena“ kannst du eine abbrechen.</p>` : `
    <input class="du-suche" id="duSuche" type="search" placeholder="Name suchen …" value="${esc(duSuche)}" autocomplete="off" aria-label="Gegner suchen">
    ${duGegner === null ? `<p class="small muted">Lade Gemeinde …</p>` : `<ul class="du-wahl zv2-liste">${duGegnerListeHtml(q, r => { const laeuft = offen.some(d => d.an === r.id);
      return `<li><button class="du-person" data-zvg="${esc(r.id)}" ${laeuft ? "disabled" : ""}>${avatarLv(r, 34)}<span class="du-tx"><b>${esc(r.name)}</b><span>${duUnterzeile(r, laeuft)}</span></span>${laeuft ? "" : `<span class="zv2-vor" aria-hidden="true">${svg(G.ic)}</span>`}</button></li>`; })}</ul>`}`}
  </section>`;
}
VIEWS.zusammen = () => {
  const duN = duFuerMich().length, online = duOk(), dran = duDranHtml(), g = zvSpiele();
  if (!online) zvWahl = null;
  screen.innerHTML = `${bereichKopf("gemeinde", { ic: "people", t: "Zusammen", sub: duN ? `${duN} ${duN === 1 ? "Duell wartet" : "Duelle warten"} auf dich!` : "Mit der Gemeinde spielen" })}
  ${online ? "" : `<p class="small muted zus-hinweis">${window.LB && window.LB.ok ? "Für Duelle brauchst du einen Eintrag in der Gemeinde-Rangliste." : "Für Duelle brauchst du Internet."}</p>`}
  ${dran}
  <div class="zv ${online ? "" : "sp-aus"}"><div class="zv2-buehne">
    <div class="zv2-reihe"><span class="zv2-tit">${svg("link")}Ketten</span></div><div class="zv2-gitter">${g.slice(0, 4).map(s => zvMedaille(s, zvWahl === s.id)).join("")}</div>
    <div class="zv2-reihe"><span class="zv2-tit">${svg("star")}Themen · Blitz · Vers</span></div><div class="zv2-gitter">${g.slice(4).map(s => zvMedaille(s, zvWahl === s.id)).join("")}</div></div>
    <p class="zv2-hinw"><span>1</span>Spiel antippen<i></i><span>2</span>Gegner wählen<i></i><span>3</span>Duell!</p>
    <div id="zvGegnerBox">${zvWahl ? zvGegnerHtml() : ""}</div></div>`;
  wireGo(); duDranVerdrahten(); zvVerdrahten();
  if (online) { if (duGegner === null) duGegnerLaden().then(() => { if (current === "zusammen") zvGegnerNeu(); }); if (duListe === null) duAktualisieren().then(() => { if (current === "zusammen") zvGegnerNeu(); }).catch(() => {}); }
  else if (typeof duAktualisieren === "function" && duListe === null) duAktualisieren().catch(() => {});
};
function zvGegnerNeu() { const box = $("zvGegnerBox"); if (!box || !zvWahl) return; const w = $("zvGegner") && $("zvGegner").querySelector(".zv2-liste"), top = w ? w.scrollTop : 0;
  box.innerHTML = zvGegnerHtml(); zvGegnerVerdrahten(); const n = $("zvGegner") && $("zvGegner").querySelector(".zv2-liste"); if (n) n.scrollTop = top; }
function zvGegnerVerdrahten() {
  const f = $("duSuche"); if (f) f.oninput = () => { duSuche = f.value; const pos = f.selectionStart; zvGegnerNeu(); const g = $("duSuche"); g.focus(); try { g.setSelectionRange(pos, pos); } catch (e) {} };
  screen.querySelectorAll("[data-zvg]").forEach(b => b.onclick = () => { const r = (duGegner || []).find(x => x.id === b.dataset.zvg); if (!r) return; SFX.tap();
    S.duTyp = zvWahl; save(); duAuswahl = []; duHerausfordern({ id: r.id, name: r.name }, zvWahl); });
}
function zvVerdrahten() {
  screen.querySelectorAll("[data-dtyp]").forEach(b => b.onclick = () => { SFX.tap();
    if (!duOk()) { toast(`${svg("duell", "var(--muted)")}<div>Für Duelle brauchst du Internet und einen Eintrag in der Rangliste.</div>`); return; }
    zvWahl = b.dataset.dtyp; duSuche = "";
    screen.querySelectorAll("[data-dtyp]").forEach(x => { const an = x === b; x.classList.toggle("an", an); x.setAttribute("aria-pressed", an); });
    zvGegnerNeu(); const box = $("zvGegner");
    if (box) { let ruhig = false; try { ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {} box.scrollIntoView({ behavior: ruhig ? "auto" : "smooth", block: "start" }); } });
  zvGegnerVerdrahten();
}
/* Schritt 2: nur noch den Gegner wählen – das Spiel steht schon fest (S.duTyp) */
VIEWS.gegner = () => {
  if (!duOk()) { go("zusammen"); return; }
  const typ = duTypAktuell(), T = DU_TYPEN[typ];
  screen.innerHTML = `<div class="gegner-seite">${backBtn("zusammen", "Anderes Spiel")}
    ${bereichKopf("gemeinde", { ic: T.ic, t: "Gegner", sub: esc(T.name) })}
    ${duGegnerHtml()}</div>`;
  wireGo(); duGegnerVerdrahten();
  if (duGegner === null) duGegnerLaden();
  if (duListe === null) duAktualisieren().then(() => { if (current === "gegner") { const box = $("duGegner"); if (box) { box.outerHTML = duGegnerHtml(); duGegnerVerdrahten(); } } }).catch(() => {});
};

/* ---------- Geführte Lektion: ansehen → anhören → ordnen ---------- */
VIEWS.lektion = (arg) => {
  aufnahmenPruefen();
  const gi = +arg, g = GROUPS[gi]; let schritt = 1; const t0 = Date.now();
  const start = GROUPS.slice(0, gi).reduce((a, x) => a + x.books.length, 0);
  const kopf = () => `<button class="back" data-go="lernen">← Lernen</button>
    <span class="tag ${g.t.toLowerCase()}">Lektion ${gi + 1} · ${g.t}</span><h1>${g.name}</h1>
    <ol class="schritte">${["Ansehen", "Anhören", "Ordnen"].map((n, k) => `<li class="${k + 1 < schritt ? "fertig" : k + 1 === schritt ? "jetzt" : ""}"><span>${k + 1 < schritt ? svg("check") : k + 1}</span>${n}</li>`).join("")}</ol>`;
  const zeige = () => {
    vorlesenStop();
    if (schritt === 1) {
      screen.innerHTML = kopf() + `<div class="card stack">
        <ol class="buchliste" start="${start + 1}">${g.books.map(b => `<li>${esc(b)}</li>`).join("")}</ol>
        <div class="merk"><b>Merkhilfe:</b> ${g.tip}</div></div>
        <button class="btn primary breit" id="weiter">Weiter: Anhören</button>`;
    } else if (schritt === 2) {
      screen.innerHTML = kopf() + `<div class="card stack"><div class="label">Aus dem Lied „In des Alten Bundes Schriften“</div>
        <p class="liedtext gross">${strophenVonGruppe(gi).map(vi => LIED[vi].lines.map((_, li) => zeileHtml(vi, li)).join("<br>")).join("<br><br>")}</p>
        <button class="btn" id="hoeren" data-play>${svg("play")} Anhören</button></div>
        <button class="btn primary breit" id="weiter">Weiter: Selbst ordnen</button>`;
      $("hoeren").onclick = () => {
        const b = $("hoeren"); if (b.classList.contains("spielt")) { vorlesenStop(); return; }
        const strophen = strophenVonGruppe(gi), els = [...screen.querySelectorAll(".lz")];
        const z = []; strophen.forEach(vi => zeilenPlain(vi).forEach(t => z.push({ text: t, el: els[z.length] })));
        const fertig = () => { strophen.forEach(vi => { if (!S.songHeard.includes(vi)) S.songHeard.push(vi); }); quest("lied", strophen.length); save(); checkBadges(); };
        b.classList.add("spielt"); b.innerHTML = svg("stop") + " Stopp";
        if (!liedSingen(els, fertig, () => vorlesen(z, fertig))) vorlesen(z, fertig);
      };
    } else {
      let pos = 0, err = 0;
      screen.innerHTML = kopf() + `<div class="card stack">
        <p class="small muted" style="margin:0">Tippe die Bücher in der richtigen Reihenfolge an.</p>
        <div class="progress"><i id="sp"></i></div><div class="slots" id="slots"></div><div class="pool" id="pool"></div>
        <div class="small muted">Fehler: <span id="se">0</span></div></div>
        <button class="btn ghost breit" id="zurueck1">Nochmal ansehen</button>`;
      $("zurueck1").onclick = () => { SFX.tap(); schritt = 1; zeige(); };
      shuffle(g.books).forEach(b => { const c = document.createElement("button"); c.className = "chip"; c.textContent = b; c.onclick = () => tippe(c, b); $("pool").appendChild(c); });
      function tippe(c, b) {
        if (b === g.books[pos]) {
          pos++; SFX.right(pos); vibrate(12); const [x, y] = centerOf(c); burst(x, y, 14, { speed: 4 }); c.remove();
          const s2 = document.createElement("span"); s2.className = "slot"; s2.textContent = b; $("slots").appendChild(s2);
          $("sp").style.width = (pos / g.books.length * 100) + "%";
          if (pos === g.books.length) fertig(err);
        } else { err++; $("se").textContent = err; SFX.wrong(); vibrate([40, 30, 40]); c.classList.remove("no"); void c.offsetWidth; c.classList.add("no"); setTimeout(() => c.classList.remove("no"), 400); }
      }
    }
    wireGo();
    if ($("weiter")) $("weiter").onclick = () => { SFX.tap(); schritt++; zeige(); };
  };
  function fertig(err) {
    const stars = err === 0 ? 3 : err <= 2 ? 2 : 1, prev = S.stars[gi] || 0; if (stars > prev) S.stars[gi] = stars;
    const W = spielWdh("lektion-" + gi, LEKTION_WDH), xp = wdhMal(Math.max(1, Math.round((g.books.length * 21 + stars * 36) * LEKTION_XP_FAKTOR)), W), ltal = wdhMal(Math.max(0, stars - prev) * 2, W); richtig(g.books.length);
    quest("station", 1); quest("runde", 1);
    SFX.win(); vibrate([20, 30, 20, 30, 60]); rain(70);
    setTimeout(() => {
      addXp(xp, null, "lektion", { t0, f: g.books.length, fm: g.books.length, d: `Lektion ${gi + 1} · ${stars} ${stars === 1 ? "Stern" : "Sterne"} · ${err} Fehler${W.d}` }); addTal(ltal);
      const next = gi + 1 < GROUPS.length;
      const m = modal(`<div class="label">Lektion geschafft</div><div class="stars" style="justify-content:center;gap:8px">${[1, 2, 3].map(k => `<span style="display:inline-block;width:44px;animation:pop .4s ${k * 0.15}s both">${STAR(stars >= k)}</span>`).join("")}</div>
      <h2>${err === 0 ? "Fehlerfrei!" : err + " Fehler"}</h2><div class="rewards">${xp ? `<span class="pill">+${xp} XP</span>` : ""}${ltal ? `<span class="pill">+${ltal} Talente</span>` : ""}</div>${W.hinweis}
      ${LIEDZEIT ? `<div class="hilfe belohnung"><div class="label">${svg("music")} Liedbelohnung – freiwillig</div>${singBox(strophenVonGruppe(gi).map(vi => `<div class="lied-mini">${LIED[vi].lines.map((_, li) => zeileHtml(vi, li)).join("<br>")}</div>`).join(""))}</div>` : ""}
      <button class="btn primary" data-close="${next ? "next" : "lernen"}">${next ? "Nächste Lektion" : "Zur Übersicht"}</button><button class="btn ghost" data-close="again">Nochmal ordnen</button>`,
        r => { vorlesenStop(); if (r === "next") go("lektion", gi + 1); else if (r === "again") { schritt = 3; zeige(); } else go("lernen"); });
      wireSing(m);
    }, 400);
  }
  zeige();
};
VIEWS.path = VIEWS.lernen; VIEWS.stage = VIEWS.lektion;

/* ---------- Das Lied ---------- */
VIEWS.bibelsong = () => go("lied"); /* alter Link → Lied */
VIEWS.lied = () => {
  aufnahmenPruefen();
  let html = `${backBtn("lernen", "Lektionen")}<h1>In des Alten Bundes Schriften</h1>
  <div class="card stack">
    <p class="small muted" style="margin:0">Traditioneller Merkvers, angepasst an die Reihenfolge der Schlachter 2000 (<span class="neu">so markiert</span>). Die App singt ihn mit einer eigenen, flotten Melodie – die gesungene Zeile und das Buch leuchten mit. Farben: <span class="bk-geschichte">Geschichte</span>, <span class="bk-lehre">Lehre &amp; Poesie</span>, <span class="bk-prophetie">Prophetie</span>.</p>
    <div class="row-btns">
      <button class="btn primary" id="ganzBtn" data-play>${svg("play")} Ganzes Lied anhören</button>
      <button class="btn" data-go="gap" data-arg="alle">${svg("target")} Lückenquiz: ganzes Lied</button>
    </div>
    <label class="schalter"><input type="checkbox" id="beatCb" ${S.beat ? "checked" : ""}> Leiser Takt zur Vorlesestimme (nur ohne Aufnahme, z. B. offline)</label>
  </div>`;
  let lastT = "";
  LIED.forEach((v, vi) => {
    const t = vi < 4 ? "AT" : "NT";
    if (t !== lastT) { html += `<div class="label" style="margin:18px 0 8px">${t === "AT" ? "Altes Testament · 39 Bücher" : "Neues Testament · 27 Bücher"}</div>`; lastT = t; }
    html += `<div class="card stack strophe">
      <div class="topline"><span class="snr">${vi + 1}</span><span class="small muted">${S.songHeard.includes(vi) ? svg("check", "var(--good)").replace("<svg", '<svg style="width:16px;height:16px;vertical-align:-3px"') + " angehört" : ""}</span></div>
      <p class="liedtext">${v.lines.map((_, li) => zeileHtml(vi, li)).join("<br>")}</p>
      <div class="row-btns"><button class="btn mini" data-play="${vi}">${svg("play")} Anhören</button><button class="btn ghost mini" data-go="gap" data-arg="${vi}">Lückenquiz</button></div>
    </div>`;
  });
  screen.innerHTML = html; wireGo();
  $("beatCb").onchange = e => { S.beat = e.target.checked; save(); };
  screen.querySelectorAll("[data-play]").forEach(b => {
    if (b.id === "ganzBtn") return;
    b.onclick = () => { SFX.tap(); strophePlay(+b.dataset.play, b); };
  });
  $("ganzBtn").onclick = () => {
    const b = $("ganzBtn");
    if (b.classList.contains("spielt")) { vorlesenStop(); b.innerHTML = svg("play") + " Ganzes Lied anhören"; return; }
    const els = [...screen.querySelectorAll(".lz")];
    const fertig = () => { LIED.forEach((_, vi) => { if (!S.songHeard.includes(vi)) S.songHeard.push(vi); }); quest("lied", 8); save(); checkBadges(); b.innerHTML = svg("play") + " Ganzes Lied anhören"; };
    b.classList.add("spielt"); b.innerHTML = svg("stop") + " Stopp";
    const lesen = () => {
      const z = []; LIED.forEach((_, vi) => zeilenPlain(vi).forEach((t, j) => z.push({ text: t, el: screen.querySelector(`.lz[data-v="${vi}"][data-l="${j}"]`) })));
      vorlesen(z, fertig);
    };
    if (LIEDZEIT) { if (!liedSingen(els, fertig, lesen)) lesen(); }
    else if (AUFNAHMEN["ganzes-lied"]) aufnahmeSpielen(AUFNAHMEN["ganzes-lied"], els, fertig);
    else lesen();
  };
};

/* ---------- Lied-Lückenquiz ---------- */
const GAP_VORLAUF = 0.3; /* Sekunden Abstand vor dem nächsten gesuchten Buch (Sänger setzt etwas früher ein) */
VIEWS.gap = (arg) => {
  aufnahmenPruefen();
  const alle = arg === "alle"; const strophen = alle ? LIED.map((_, i) => i) : [+arg];
  const luecken = [];
  strophen.forEach(vi => LIED[vi].lines.forEach((ln, li) => ln.forEach((s, si) => { if (typeof s !== "string") luecken.push({ vi, li, si, t: s.t }); })));
  const alleTexte = []; LIED.forEach(v => v.lines.forEach(ln => ln.forEach(s => { if (typeof s !== "string") alleTexte.push(s.t); })));
  let k = 0, fehler = 0, xp = 0; const offen = new Set(); let lock = false; const t0 = Date.now();
  const render = () => {
    const L = luecken[k]; lock = false;
    /* bereits erratene Bücher sichtbar, die übrigen verdeckt */
    const strophe = LIED[L.vi].lines.map((_, li) => zeileHtml(L.vi, li, li === L.li ? L.si : -1, offen)).join("<br>");
    const idx = alleTexte.indexOf(L.t);
    const nah = shuffle([...new Set([idx - 2, idx - 1, idx + 1, idx + 2, idx + 3].filter(j => j >= 0 && j < alleTexte.length).map(j => alleTexte[j]).filter(t => t !== L.t))]).slice(0, 3);
    while (nah.length < 3) { const r = pick(alleTexte); if (r !== L.t && !nah.includes(r)) nah.push(r); }
    screen.innerHTML = `${backBtn(alle ? heimAnsicht("spielen") : "lied", alle ? heimName("spielen") : "Lied")}<h1>Lückenquiz${alle ? "" : " · Strophe " + (L.vi + 1)}</h1>
      <div class="stack"><div class="topline"><span>${k + 1} / ${luecken.length}</span><span>Fehler: ${fehler}</span></div>
      <div class="progress"><i style="width:${k / luecken.length * 100}%"></i></div>
      <div class="card"><p class="liedtext gross" id="gapText">${strophe}</p></div>
      ${LIEDZEIT ? `<label class="schalter"><input type="checkbox" id="gapSingCb" ${S.gapSing ? "checked" : ""}> ${svg("music")} Nach jeder Lücke die Zeile singen</label>` : ""}
      <div class="opts" id="go">${shuffle([L.t, ...nah]).map(t => `<button class="opt" data-t="${esc(t)}">${esc(t)}</button>`).join("")}</div></div>`;
    wireGo();
    if ($("gapSingCb")) $("gapSingCb").onchange = e => { S.gapSing = e.target.checked; save(); };
    screen.querySelectorAll("#go .opt").forEach(b => b.onclick = () => {
      if (lock) return;
      if (b.dataset.t === L.t) {
        lock = true; b.classList.add("right"); SFX.right(k % 12); richtig(1); xp += 21; offen.add(L.vi + "-" + L.li + "-" + L.si);
        const [x, y] = centerOf(b); burst(x, y, 10);
        let weiter = false; const naechste = () => { if (weiter) return; weiter = true; vorlesenStop(); k++; if (k >= luecken.length) ende(); else render(); };
        if (S.gapSing && LIEDZEIT) {
          /* Zeile mit eingesetztem Buch zeigen und singen – „Weiter“ überspringt */
          $("gapText").innerHTML = LIED[L.vi].lines.map((_, li) => zeileHtml(L.vi, li, -1, offen)).join("<br>");
          const zl = $("gapText").querySelector(`.lz[data-l="${L.li}"]`);
          const sk = document.createElement("button"); sk.className = "btn ghost mini"; sk.textContent = "Weiter ›"; sk.onclick = () => { SFX.tap(); naechste(); };
          $("go").innerHTML = ""; $("go").appendChild(sk);
          /* nur bis kurz vor das nächste noch offene Buch singen – auch wenn es erst in der nächsten Zeile beginnt.
             So ist vom nächsten gesuchten Buch nichts zu hören, bevor man antworten muss. */
          const tJetzt = LIEDZEIT.buecher[LIED[L.vi].lines[L.li][L.si].b[0]] || 0;
          const offeneZeiten = luecken.filter(x => !offen.has(x.vi + "-" + x.li + "-" + x.si))
            .map(x => LIEDZEIT.buecher[LIED[x.vi].lines[x.li][x.si].b[0]]).filter(z => z != null && z > tJetzt);
          const bis = offeneZeiten.length ? Math.min(...offeneZeiten) - GAP_VORLAUF : null;
          setTimeout(() => { if (!weiter && !liedSingen([zl], naechste, naechste, bis)) naechste(); }, 250);
        } else setTimeout(naechste, 450);
      } else { fehler++; b.classList.add("wrong"); b.disabled = true; SFX.wrong(); shakeScreen(); }
    });
  };
  const ende = () => {
    const perfekt = fehler === 0;
    if (alle && perfekt) S.gapPerfect = true;
    quest("luecke", 1); quest("runde", 1);
    const W = spielWdh("luecke"); xp = wdhMal(xp, W);
    screen.innerHTML = `<div class="card result stack"><div class="label">Lückenquiz geschafft</div><div class="big">${luecken.length - Math.min(fehler, luecken.length)} / ${luecken.length}</div>
      <div class="muted">${perfekt ? "Ohne Fehler – stark!" : fehler + " Fehler"}</div>
      <div class="rewards"><span class="pill">+${xp} XP</span></div>${W.hinweis}
      <div class="hilfe" style="text-align:left"><div class="label">${alle ? "Jetzt das ganze Lied am Stück" : "Jetzt die Strophe am Stück"}</div>${alle
        ? `<details class="lied-det"><summary>${svg("music")} Liedtext zeigen</summary>${singBox(LIED.map((v, vi) => `<div class="lied-mini">${v.lines.map((_, li) => zeileHtml(vi, li)).join("<br>")}</div>`).join(""))}</details>`
        : singBox(`<div class="lied-mini">${LIED[strophen[0]].lines.map((_, li) => zeileHtml(strophen[0], li)).join("<br>")}</div>`)}</div>
      <button class="btn primary" id="again">Nochmal</button><button class="btn ghost" data-go="${alle ? heimAnsicht("spielen") : "lied"}">Zurück</button><button class="btn fertig" data-go="home">Fertig</button></div>`;
    wireGo(); wireSing(); $("again").onclick = () => { SFX.tap(); vorlesenStop(); VIEWS.gap(arg); };
    SFX.win(); if (perfekt) rain(80);
    if (xp) addXp(xp, null, "luecke", { t0, f: luecken.length - Math.min(fehler, luecken.length), fm: luecken.length, d: `${alle ? "Ganzes Lied" : "Strophe " + (strophen[0] + 1)} · ${fehler} Fehler${W.d}` }); save(); checkBadges();
  };
  render();
};

/* ---------- Blitz-Runde ---------- */
VIEWS.blitz = () => {
  screen.innerHTML = `${backBtn(heimAnsicht("spielen"), heimName("spielen"))}<h1>Blitz-Runde</h1>
  <div class="card stack" style="text-align:center">
    <p class="muted" style="margin:0">60 Sekunden: Was kommt nach dem Buch? Jede 10er-Combo erhöht den Multiplikator (bis x3). Ein Fehler kostet 3 Sekunden.</p>
    <div class="label">Bereich</div>
    <div class="modes" style="grid-template-columns:repeat(3,1fr)">
      <button class="btn primary" data-s="all">Ganze Bibel</button><button class="btn" data-s="AT">AT</button><button class="btn" data-s="NT">NT</button>
    </div>
    <div class="small muted">Rekord: ${S.bestBlitz} Richtige · Beste Combo: ${S.bestCombo}</div>
  </div>`;
  wireGo();
  screen.querySelectorAll("[data-s]").forEach(b => b.onclick = () => { SFX.tap(); countdown(() => playBlitz(b.dataset.s), cdBlitz(b.dataset.s)); });
};
/* 9.22: Countdown als Intro-Bühne – 3 Sekunden (3 · 2 · 1), dabei zeigt der Bildschirm, WAS gespielt wird (Logo der Spielart, Name, eigener Stand)
   und bei Duellen GEGEN WEN (Du ↔ VS ↔ Gegner). Effekte im Takt: Ring läuft je Sekunde einmal um das Logo, Druckwelle + Funken, Strahlenkranz dreht schneller.
   info = { name, ic, sub, farbe, modus, gegner:[{name, p}] } – aus cdSolo()/cdDuell(); ohne info bleibt es eine schlichte Zahl. */
const CD_QUIZ_FARBE = "#66e0d0";
function cdSolo(id, extra) {
  let s0 = null; try { s0 = id === "quiz" ? null : zvSpiele().find(x => x.id === id); } catch (e) {}
  const basis = id === "quiz" ? { name: "Wer wird Biblionär?", ic: "biblionaer", sub: spielStand("quiz")[0], farbe: CD_QUIZ_FARBE }
    : s0 ? { name: s0.name, ic: s0.ic, sub: s0.sub, farbe: ZV_FARBE[s0.grp] } : {};
  return Object.assign({ modus: "Solo" }, basis, extra || {});
}
/* 9.46: Blitz-Countdown je Bereich – Ganze Bibel (Koralle), Altes Testament (Gold), Neues Testament (Rosé), jeweils mit dem Logo des Bereichs */
const CD_BLITZ = { all: { ic: "kette-bibel", sub: "Ganze Bibel", farbe: "#ff8a5c" }, AT: { ic: "kette-at", sub: "Altes Testament", farbe: "#ffc94d" }, NT: { ic: "kette-nt", sub: "Neues Testament", farbe: "#ff6fa8" } };
const cdBlitz = scope => { const c = CD_BLITZ[scope] || CD_BLITZ.all; return cdSolo("blitz", { name: "Blitz", ic: c.ic, sub: c.sub + " · 60 Sekunden", farbe: c.farbe }); };
function cdDuell() {
  const D = duSpiel; if (!D) return {};
  const id = D.art === "kette" ? "kette-" + D.k : D.art === "quiz" ? "quiz" : D.art;
  const ziele = D.ziele && D.ziele.length ? D.ziele : [{ id: D.vonPid || D.an, name: D.gegner }];
  return Object.assign(cdSolo(id), { modus: D.weih ? "Weihnachts-Duell" : "Duell", sub: "Gleiche Fragen für beide",
    gegner: ziele.map(g => ({ id: g.id, name: g.name || "?", p: cdGegnerFinden(g) })) });
}
/* 9.22: echte Avatare der Gegner – aus der geladenen Gegnerliste (nach id, sonst nach Name) */
const cdGegnerFinden = g => (duGegner || []).find(x => x.id === g.id) || (duGegner || []).find(x => x.name === g.name) || null;
const cdAvatar = (g, gr) => avatarHtml({ avatar: g.p && g.p.avatar, frame: g.p && g.p.frame, name: g.name }, gr);
function countdown(cb, info) {
  info = info || {};
  document.body.classList.add("spiel-laeuft");
  const farbe = info.farbe || "#f2c14e", gg = info.gegner || [];
  const ich = { avatar: S.avatar, frame: S.frame, name: S.lbName || "Du" };
  const seite = (p, name, extra) => `<span class="cd-sp ${extra}">${avatarHtml(p, 62)}<b>${esc(name)}</b></span>`;
  const rechtsHtml = () => !gg.length ? "" : gg.length === 1 ? seite({ avatar: gg[0].p && gg[0].p.avatar, frame: gg[0].p && gg[0].p.frame, name: gg[0].name }, gg[0].name, "cd-r")
    : `<span class="cd-sp cd-r"><span class="cd-stapel">${gg.slice(0, 3).map(g => cdAvatar(g, 46)).join("")}</span><b>${gg.length} Gegner</b></span>`;
  const rechts = rechtsHtml();
  const duell = gg.length ? `<div class="cd-duell">${seite(ich, "Du", "cd-l")}<span class="cd-vs">VS</span>${rechts}</div>` : "";
  screen.innerHTML = `<div class="cd-b${gg.length ? " mit-gegner" : ""}" id="cdB" style="--cd:${farbe}">
    <div class="cd-strahl"></div>
    ${info.modus ? `<span class="cd-modus">${esc(info.modus)}</span>` : ""}
    ${info.ic ? `<div class="cd-logo" id="cdLogo"><svg class="cd-ring" viewBox="0 0 200 200" aria-hidden="true"><circle class="cd-rbg" cx="100" cy="100" r="92"/><circle class="cd-rfg" id="cdFg" cx="100" cy="100" r="92"/></svg><i class="cd-welle" id="cdW"></i><span class="cd-med" id="cdM">${svg(info.ic)}</span></div>` : ""}
    ${info.name ? `<div class="cd-name"><h1>${esc(info.name)}</h1>${info.sub ? `<span>${esc(info.sub)}</span>` : ""}</div>` : ""}
    ${duell}
    <div class="cd-zahl"><b id="cd">3</b></div></div>`;
  /* Gegnerliste noch nicht geladen (z. B. Duell aus dem Biblionär-Reiter angenommen)? Dann während des Countdowns nachladen und die Avatare austauschen. */
  if (gg.length && gg.some(g => !g.p) && window.LB && LB.gegnerListe) {
    const fertig = l => { if (!l || !l.length) return; duGegner = l.filter(r => r.id !== S.pid && r.name); gg.forEach(g => { g.p = g.p || cdGegnerFinden(g); });
      const alt = document.querySelector(".cd-duell .cd-r"); if (alt && $("cdB")) alt.outerHTML = rechtsHtml(); };
    try { Promise.all([LB.gegnerListe(), gemLaden().catch(() => false)]).then(([l]) => fertig(l)).catch(() => {}); } catch (e) {} /* 9.30: mit Gemeinde-Zuordnung, sonst bleiben die Münzen später leer */
  }
  const neu = (id, kl) => { const e = $(id); if (!e) return; e.classList.remove(kl); void e.getBoundingClientRect(); e.classList.add(kl); };
  const takt = n => {
    const z = $("cd"); if (!z) return;
    z.textContent = n; z.dataset.n = n; neu("cd", "cd-pop"); neu("cdFg", "cd-lauf"); neu("cdW", "cd-wellen"); neu("cdM", "cd-puls");
    if (n === 1 && $("cdB")) $("cdB").classList.add("letzte");
    const l = $("cdLogo"); if (l) { const [x, y] = centerOf(l); burst(x, y, 8 + (4 - n) * 8, { speed: 3 + (4 - n) * 1.2, colors: [farbe, "#ffffff", "#fff1c2"], up: 0, g: .06 }); }
    SFX.tick();
  };
  let n = 3; takt(n);
  /* 9.23: kurzes „LOS!“ (0,45 s) mit Lichtblitz und großer Funkenwolke, dann erst startet das Spiel */
  const los = () => {
    const z = $("cd"); if (!z || !$("cdB")) { cb(); return; }
    z.textContent = "LOS!"; z.dataset.n = "los"; neu("cd", "cd-pop"); neu("cdW", "cd-wellen"); neu("cdM", "cd-puls"); $("cdB").classList.add("los");
    const l = $("cdLogo"); if (l) { const [x, y] = centerOf(l); burst(x, y, 46, { speed: 7, colors: [farbe, "#ffffff", "#fff1c2", "#ffd36b"], up: 1, g: .08 }); }
    tone(784, 0, .12, "triangle", .2); tone(1175, .1, .3, "triangle", .22);
    const w = setTimeout(cb, 450); timers.push(w);
  };
  const t = setInterval(() => { n--; if (n <= 0) { clearInterval(t); los(); } else takt(n); }, 1000); timers.push(t);
}
function playBlitz(scope) {
  const idx = []; ALL.forEach((x, i) => { if (i < ALL.length - 1 && (scope === "all" || (x.t === scope && ALL[i + 1].t === scope))) idx.push(i); });
  let time = 60, right = 0, wrong = 0, combo = 0, maxCombo = 0, xp = 0, cur = -1, lock = false; const fehlerBuecher = []; const t0 = Date.now();
  screen.innerHTML = `<div class="stack">
    <div class="topline"><span id="bt">60 s</span><span>${svg("check", "var(--good)").replace('<svg', '<svg style="width:18px;height:18px;vertical-align:-3px"')} <span id="br">0</span></span><span id="bx">0 XP</span></div>
    <div class="timer"><i id="tb"></i></div>
    <div class="card stack"><div class="qsub">Was kommt nach</div><div class="q" id="bq"></div><div class="qsub" id="bm"></div><div class="combo" id="bc"></div><div class="opts" id="bo"></div></div>
    <button class="btn ghost" id="bstop">Runde beenden</button></div>`;
  $("bstop").onclick = end;
  const t = setInterval(() => { time -= 0.1; $("tb").style.width = Math.max(time, 0) / 60 * 100 + "%"; $("bt").textContent = Math.ceil(Math.max(time, 0)) + " s"; if (time <= 10 && Math.abs(time - Math.round(time)) < 0.05) SFX.tick(); if (time <= 0) end(); }, 100); timers.push(t);
  next();
  function mult() { return Math.min(1 + Math.floor(combo / 10), 3); }
  function next() {
    let i; do { i = idx[Math.floor(Math.random() * idx.length)]; } while (idx.length > 1 && i === cur); cur = i; lock = false;
    $("bq").textContent = ALL[i].b; $("bm").textContent = GROUPS[ALL[i].gi].name;
    const o = $("bo"); o.innerHTML = ""; makeOpts(i).forEach(b => { const btn = document.createElement("button"); btn.className = "opt"; btn.textContent = b; btn.onclick = () => ans(btn, b); o.appendChild(btn); });
  }
  function ans(btn, b) {
    if (lock) return; const correct = ALL[cur + 1].b;
    if (b === correct) {
      lock = true; combo++; right++; maxCombo = Math.max(maxCombo, combo); const g = 6 * mult(); xp += g; richtig(1);
      btn.classList.add("right"); SFX.right(combo); vibrate(10); const [x, y] = centerOf(btn); burst(x, y, 10 + mult() * 6, { speed: 3 + mult() }); floatText("+" + g, x, y);
      $("br").textContent = right; $("bx").textContent = xp + " XP";
      if (combo % 5 === 0) { tone(1568, 0, .15, "sine", .12); shakeScreen(); }
      setTimeout(next, 320);
    } else {
      fehlerBuecher.push(cur + 1); combo = 0; wrong++; time -= 3; btn.classList.add("wrong"); SFX.wrong(); vibrate([40, 30, 40]); shakeScreen();
      [...$("bo").children].forEach(x => { if (x.textContent === correct) x.classList.add("right"); }); lock = true; setTimeout(next, 700);
    }
    const c = $("bc"); c.textContent = combo >= 2 ? `Combo ${combo} · x${mult()}` : ""; c.className = "combo" + (mult() >= 3 ? " hot" : "");
  }
  /* Freiwillig: die Liedzeilen zu den verpassten Büchern (höchstens 3) */
  function blitzLiedHilfe() {
    const zeilen = []; fehlerBuecher.forEach(b => { const p = BUCH_IM_LIED[b]; if (p && !zeilen.some(z => z.v === p.v && z.l === p.l)) zeilen.push(p); });
    if (!zeilen.length) return "";
    return `<div class="hilfe"><div class="label">${svg("music")} So geht's im Lied${zeilen.length > 3 ? " · die ersten 3 Fehler" : ""}</div>${zeilen.slice(0, 3).map(z => singBox(zeileHtml(z.v, z.l))).join('<div style="height:10px"></div>')}</div>`;
  }
  function end() {
    clearTimers(); const rec = right > S.bestBlitz;
    if (rec) S.bestBlitz = right; if (maxCombo > S.bestCombo) S.bestCombo = maxCombo;
    quest("blitz", 1); quest("runde", 1);
    const W = spielWdh("blitz"); xp = wdhMal(xp, W);
    const tal = wdhMal(Math.floor(right / 5) + (rec ? 3 : 0), W);
    screen.innerHTML = `<div class="card result stack"><div class="label">Zeit abgelaufen</div><div class="big">${right}</div><div class="muted">Richtige · ${wrong} Fehler · beste Combo ${maxCombo}</div>${rec && right > 0 ? '<h2>Neuer Rekord!</h2>' : ''}
      <div class="rewards"><span class="pill">+${xp} XP</span><span class="pill">+${tal} Talente</span></div>${W.hinweis}
      ${blitzLiedHilfe()}
      <button class="btn primary" id="again">Nochmal</button><button class="btn ghost" data-go="${heimAnsicht("spielen")}">Zurück</button><button class="btn fertig" data-go="home">Fertig</button></div>`; wireGo(); wireSing();
    $("again").onclick = () => { SFX.tap(); vorlesenStop(); VIEWS.blitz(); };
    if (right > 0) { SFX.win(); if (rec) rain(90); }
    if (xp) addXp(xp, null, "blitz", { t0, f: right, fm: right + wrong, d: `${scope === "all" ? "Ganze Bibel" : scope} · ${wrong} Fehler · Combo ${maxCombo}${W.d}` }); addTal(tal); save(); checkBadges(); lbSync();
  }
}

/* ---------- Die Kette ---------- */
const KETTEN = {
  bibel: { name: "Ganze Bibel", info: "1. Mose bis Offenbarung", seq: FWD, key: "bestChain", bonus: 60, tal: 20 },
  at: { name: "Altes Testament", info: "1. Mose bis Maleachi", seq: FWD.slice(0, 39), key: "chainAT", bonus: 30, tal: 8 },
  nt: { name: "Neues Testament", info: "Matthäus bis Offenbarung", seq: FWD.slice(39), key: "chainNT", bonus: 24, tal: 6 },
  rueck: { name: "Rückwärts", info: "Offenbarung bis 1. Mose · für Profis", seq: FWD.slice().reverse(), key: "chainRueck", bonus: 180, tal: 30, rueck: true }
};
const kettenBuecher = (key) => (S[key] ? S[key] + 1 : 0);
VIEWS.chain = () => { go("spielen"); };
VIEWS._chainAlt = () => {
  screen.innerHTML = `${backBtn(heimAnsicht("spielen"), heimName("spielen"))}<h1>Die Kette</h1>
  <p class="muted small" style="margin:0 0 10px">Immer das nächste Buch – ein Fehler beendet die Kette. Die Lied-Hilfe gibt es nur im Lernteil.</p>
  <div class="stack">${Object.entries(KETTEN).map(([id, k]) => { const max = k.seq.length, rec = kettenBuecher(k.key), voll = rec >= max;
    return `<button class="kette-karte ${voll ? "voll" : ""}" data-k="${id}">
      <div class="ic">${svg("kette-" + id)}</div>
      <div class="kk-text"><b>${k.name}</b><span class="small muted">${k.info}</span><span class="progress kk"><i style="width:${rec / max * 100}%"></i></span></div>
      <div class="kk-rec"><b>${rec}</b><span class="small muted">/ ${max}</span></div></button>`; }).join("")}
  </div>`;
  wireGo();
  screen.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { SFX.tap(); countdown(() => playChain(b.dataset.k), cdSolo("kette-" + b.dataset.k)); });
};
function playChain(mode) {
  const K = KETTEN[mode], seq = K.seq; let i = -1, xp = 0, lock = false; const t0 = Date.now();
  screen.innerHTML = `<div class="stack"><div class="topline"><span><span id="cp">1</span> / ${seq.length}</span><span class="small muted">${K.name}</span><span id="cx">0 XP</span></div>
  <div class="progress"><i id="cbar"></i></div>
  <div class="card stack"><div class="qsub" id="cs">${K.rueck ? "Was steht davor?" : "Was kommt nach"}</div><div class="q" id="cq"></div><div class="qsub" id="cm"></div>
    <div class="combo" id="cc"></div><div class="opts" id="co"></div></div>
  <div class="topline" style="justify-content:flex-end"><button class="btn ghost mini" data-go="${heimAnsicht("spielen")}">Abbrechen</button></div></div>`;
  wireGo(); show();
  function show() {
    lock = false;
    $("cp").textContent = i + 2; $("cbar").style.width = ((i + 1) / (seq.length - 1) * 100) + "%";
    if (i < 0) { $("cs").textContent = KETTE_START[mode]; $("cq").textContent = ""; $("cm").textContent = K.info; }
    else { const b = seq[i]; $("cs").textContent = K.rueck ? "Was steht davor?" : "Was kommt nach"; $("cq").textContent = ALL[b].b; $("cm").textContent = `${ALL[b].t === "AT" ? "Altes" : "Neues"} Testament · ${GROUPS[ALL[b].gi].name}`; }
    const o = $("co"); o.innerHTML = ""; (i < 0 ? optsStart(seq) : optsSeq(seq, i)).forEach(t => { const btn = document.createElement("button"); btn.className = "opt"; btn.textContent = t; btn.onclick = () => ans(btn, t); o.appendChild(btn); });
  }
  function ans(btn, t) {
    if (lock) return; const correct = ALL[seq[i + 1]].b;
    if (t === correct) {
      lock = true; i++; xp += 6; richtig(1);
      btn.classList.add("right"); SFX.right(Math.min(i / 4, 12)); vibrate(10); const [x, y] = centerOf(btn); burst(x, y, 12); $("cx").textContent = xp + " XP";
      if (mode === "bibel" && i === 38) { $("cc").textContent = "Altes Testament geschafft!"; tone(1047, 0, .4, "triangle", .15); rain(50); }
      else $("cc").textContent = "";
      if (i === seq.length - 1) return setTimeout(() => done(true), 350);
      setTimeout(show, 330);
    } else {
      lock = true; btn.classList.add("wrong"); SFX.wrong(); vibrate([60, 40, 60]); shakeScreen();
      [...$("co").children].forEach(x => { if (x.textContent === correct) x.classList.add("right"); });
      setTimeout(() => done(false, correct), 1300);
    }
  }
  function done(full, correct) {
    const rec = i > (S[K.key] || 0); if (rec) S[K.key] = i;
    let tal = Math.floor(Math.max(0, i) / 10) + (full ? K.tal : 0); if (full) xp += K.bonus;
    const W = spielWdh("kette-" + mode); xp = wdhMal(xp, W); tal = wdhMal(tal, W);
    quest("ketteGespielt", 1); quest("runde", 1);
    const sieg = full ? meisterErfolg(mode) : null;
    const vorher = i < 0 ? "" : ALL[seq[i]].b;
    screen.innerHTML = `<div class="card result stack"><div class="label">${full ? "Großartig" : "Kette gerissen"}</div><div class="big">${i + 1} / ${seq.length}</div>
      <div class="muted">${full ? `${esc(K.name)} komplett in der richtigen Reihenfolge!` : i < 0 ? `${esc(KETTE_START[mode])} „${esc(correct)}“.` : `${K.rueck ? "Vor" : "Nach"} „${esc(vorher)}“ ${K.rueck ? "steht" : "kommt"} „${esc(correct)}“.`}</div>${rec && !full ? '<h2>Neuer Rekord!</h2>' : ''}
      ${!full && BUCH_IM_LIED[seq[i + 1]] ? `<div class="hilfe"><div class="label">So geht's im Lied</div>${singBox(zeileHtml(BUCH_IM_LIED[seq[i + 1]].v, BUCH_IM_LIED[seq[i + 1]].l))}</div>` : ""}
      ${sieg ? `<div class="siegel-box">${siegelHtml(sieg.nachher, true, true)}<div><b>${SIEGEL[sieg.nachher].name}-Siegel</b><div class="small muted">${sieg.nachher < 4 ? "Nächstes: " + SIEGEL[sieg.nachher + 1].name + " – " + SIEGEL[sieg.nachher + 1].text : "Höchste Stufe!"}<br>Bleibt ${SIEGEL_FRISCH} Tage frisch – danach einfach wiederholen.</div></div></div>` : ""}
      <div class="rewards"><span class="pill">+${xp} XP</span><span class="pill">+${tal + (sieg ? sieg.tal : 0)} Talente</span></div>${W.hinweis}
      <button class="btn primary" id="cagain">Nochmal</button><button class="btn ghost" data-go="${heimAnsicht("spielen")}">Andere Kette</button><button class="btn fertig" data-go="home">Fertig</button></div>`; wireGo(); wireSing();
    $("cagain").onclick = () => { SFX.tap(); vorlesenStop(); countdown(() => playChain(mode), cdSolo("kette-" + mode)); };
    if (full) { SFX.level(); rain(200); } else if (rec) SFX.win();
    if (xp) addXp(xp, null, "kette", { t0, f: Math.max(0, i), fm: seq.length - 1, d: `${K.name}${full ? " · komplett" : " · gerissen"}${W.d}` }); addTal(tal); save(); checkBadges(); lbSync();
  }
}

/* ---------- 9.11: Themen-Ketten – feste Reihenfolge mit klarer biblischer Grundlage (Zehn Gebote, Schöpfungstage) ----------
   Wie die Buch-Ketten: immer das, was als Nächstes kommt – ein Fehler beendet die Kette. Rekord je Kette in S[key] (Index des letzten richtigen Gliedes). */
const TKETTEN = {
  gebote: { name: "Zehn Gebote", info: "2. Mose 20,3–17", key: "chainGebote", bonus: 30, tal: 8, ic: "tafeln", frage: "Welches Gebot kommt nach", start: "Wie lautet das 1. Gebot?", sub: n => `${n + 1}. Gebot`,
    items: [
      { t: "Keine anderen Götter neben dem HERRN", d: "Der HERR allein ist Gott – er hat sein Volk aus Ägypten geführt. Neben ihm soll niemand und nichts den ersten Platz im Leben bekommen.", r: "2. Mose 20,3" }, { t: "Kein Götzenbild machen", d: "Gott lässt sich nicht in Bildern nachmachen. Man soll sich weder ein Götzenbild machen noch sich davor niederwerfen.", r: "2. Mose 20,4–6" }, { t: "Den Namen des HERRN nicht missbrauchen", d: "Gottes Name ist heilig. Man soll ihn nicht leichtfertig, falsch oder für Lügen gebrauchen.", r: "2. Mose 20,7" },
      { t: "Den Sabbat heiligen", d: "Sechs Tage arbeiten, der siebte ist ein Ruhetag für den HERRN – für dich, deine Familie und alle, die bei dir leben.", r: "2. Mose 20,8–11" }, { t: "Vater und Mutter ehren", d: "Wer seine Eltern ehrt, lebt nach Gottes Ordnung – damit es ihm gut geht in dem Land, das der HERR gibt.", r: "2. Mose 20,12" }, { t: "Nicht töten", d: "Das Leben ist ein Geschenk Gottes. Kein Mensch darf einen anderen ermorden.", r: "2. Mose 20,13" },
      { t: "Nicht die Ehe brechen", d: "Die Ehe ist ein Bund vor Gott. Wer die Treue bricht, zerstört Vertrauen und Familie.", r: "2. Mose 20,14" }, { t: "Nicht stehlen", d: "Was dem anderen gehört, bleibt sein Eigentum. Man soll nicht nehmen, was einem nicht gehört.", r: "2. Mose 20,15" }, { t: "Kein falsches Zeugnis reden", d: "Vor Gericht und im Alltag gilt: die Wahrheit sagen und niemandem durch Lügen schaden.", r: "2. Mose 20,16" }, { t: "Nicht begehren, was dem Nächsten gehört", d: "Nicht Haus, Besitz oder Familie des anderen haben wollen – Zufriedenheit statt Neid.", r: "2. Mose 20,17" }] },
  schoepfung: { name: "Schöpfung", info: "Die sieben Schöpfungstage · 1. Mose 1,1–2,3", key: "chainSchoepfung", bonus: 24, tal: 6, ic: "schoepfung", frage: "Was folgt auf", start: "Was schuf Gott am 1. Tag?", sub: n => `${n + 1}. Tag`,
    items: [
      { t: "Licht und Finsternis", d: "Gott spricht: „Es werde Licht!“ Er trennt das Licht von der Finsternis und nennt das Licht Tag und die Finsternis Nacht.", r: "1. Mose 1,3–5" }, { t: "Himmelsfeste: Wasser oben und unten", d: "Gott schafft die Weite des Himmels und trennt das Wasser unter ihr vom Wasser über ihr.", r: "1. Mose 1,6–8" }, { t: "Land, Meer und Pflanzen", d: "Das Wasser sammelt sich zu Meeren, trockenes Land erscheint. Die Erde lässt Gras, Kräuter und fruchttragende Bäume wachsen.", r: "1. Mose 1,9–13" },
      { t: "Sonne, Mond und Sterne", d: "Gott setzt Sonne, Mond und Sterne an den Himmel – als Lichter für Tag und Nacht, für Zeiten, Tage und Jahre.", r: "1. Mose 1,14–19" }, { t: "Fische und Vögel", d: "Das Wasser wimmelt von Leben, Vögel fliegen unter dem Himmel. Gott segnet sie: Seid fruchtbar und mehrt euch.", r: "1. Mose 1,20–23" }, { t: "Landtiere und der Mensch", d: "Gott schafft die Landtiere – und zuletzt den Menschen als sein Ebenbild, als Mann und Frau. Alles war sehr gut.", r: "1. Mose 1,24–31" }, { t: "Gott ruht", d: "Gott vollendet sein Werk und ruht am siebten Tag. Er segnet diesen Tag und heiligt ihn.", r: "1. Mose 2,2–3" }] }
};
/* 9.19: neue Symbole für Zehn Gebote (Steintafeln) und Schöpfung (Erdkugel mit Strahlen). Beim Generator-Lauf nach werkzeuge/symbole-erzeugen.js übernehmen. */
(() => {
const SPARK = (x, y) => `<path class="wr-spark" d="M${x} ${y}l1.49 4.01 4.01 1.49-4.01 1.49-1.49 4.01-1.49-4.01-4.01-1.49 4.01-1.49z" fill="#fff"/>`;
const KOPF = c => `<svg x="0" y="0" width="24" height="24" viewBox="0 0 64 64" overflow="visible" class="wr wr-spielen"><circle class="wr-halo" cx="32" cy="32" r="31" fill="url(#wrH_${c})"/><ellipse cx="32" cy="61" rx="19" ry="2.2" fill="#000" opacity=".3"/>`;
/* Zehn Gebote: zwei Steintafeln mit goldenen Zeilen (I–V und VI–X), Lichtstrahlen darüber */
const tafel = (x, zeilen) => `<path d="M${x} 58V24a11.5 11.5 0 0 1 23 0V58z" fill="url(#wrSt)" stroke="#1b2a55" stroke-width="1.4" stroke-linejoin="round"/>` +
  `<path d="M${x + 3} 55V24.5a8.5 8.5 0 0 1 4-7.2" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="2" stroke-linecap="round"/>` +
  zeilen.map((w, i) => `<path d="M${x + 11.5 - w / 2} ${25 + i * 6.6}h${w}" stroke="url(#wrG)" stroke-width="2.6" stroke-linecap="round"/><path d="M${x + 11.5 - w / 2} ${25 + i * 6.6}h${w}" stroke="#1b2a55" stroke-width=".5" opacity=".5" stroke-linecap="round"/>`).join("");
const TAFELN = KOPF("spielen") +
  `<g stroke="#1b2a55" stroke-width="6" stroke-linecap="round"><path d="M32 1.5v7M15 6l3.5 5.5M49 6l-3.5 5.5M5 17l6 2.5M59 17l-6 2.5"/></g>` +
  `<g stroke="url(#wrT_spielen)" stroke-width="3" stroke-linecap="round"><path d="M32 1.5v7M15 6l3.5 5.5M49 6l-3.5 5.5M5 17l6 2.5M59 17l-6 2.5"/></g>` +
  tafel(5, [9, 12, 8, 12, 9]) + tafel(36, [11, 8, 12, 9, 12]) + SPARK(52.5, 2) + `</svg>`;
/* Schöpfung: leuchtende Erdkugel (Wasser, Land) mit Strahlenkranz – „Es werde Licht“ */
const SCHOEPFUNG = KOPF("spielen") +
  `<g stroke="#1b2a55" stroke-width="7" stroke-linecap="round"><path d="M32 2v8M10 10l5.5 5.5M54 10l-5.5 5.5M2 32h8M54 32h8"/></g>` +
  `<g stroke="url(#wrT_spielen)" stroke-width="4" stroke-linecap="round"><path d="M32 2v8M10 10l5.5 5.5M54 10l-5.5 5.5M2 32h8M54 32h8"/></g>` +
  `<clipPath id="scKugel"><circle cx="32" cy="36" r="19"/></clipPath>` +
  `<circle cx="32" cy="36" r="19" fill="url(#wrJ_lernen)" stroke="#1b2a55" stroke-width="1.4"/>` +
  `<g clip-path="url(#scKugel)"><path d="M18 30q6-9 15-6 5 2 2 8-3 4-9 3-5 5-10 2z" fill="url(#wrG)" opacity=".95"/><path d="M38 41q8-4 12 3 0 9-9 11-6-2-5-8 0-3 2-6z" fill="url(#wrG)" opacity=".95"/><path d="M13 44q8 3 14 10" stroke="#fff" stroke-width="1.6" fill="none" opacity=".35"/></g>` +
  `<path d="M20 28a14 14 0 0 1 8-8" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="2.6" stroke-linecap="round"/>` +
  `<circle cx="32" cy="36" r="19" fill="none" stroke="url(#wrG)" stroke-width="1.6" opacity=".9"/>` + SPARK(50, 38) + `</svg>`;
ICONS.tafeln = TAFELN; ICONS.schoepfung = SCHOEPFUNG;
})();
/* Bilder der Themen-Ketten: tk-bilder.js (TK_BILD, tkBildSvg) */
/* Zeitleiste: leere Felder (keine Vorschau, die die Antwort verraten würde), bis die Frage richtig beantwortet ist; ziel = das Glied, das gerade gefragt wird; neu = gerade aufgedecktes Glied */
function tkZeitleiste(id, erreicht, ziel, neu) {
  const K = TKETTEN[id], n = K.items.length;
  return `<div class="tk-zl tk-${id}" style="--n:${n}" role="list" aria-label="${esc(K.name)}">${K.items.map((x, k) => {
    const auf = k <= erreicht, kl = ["tk-t", auf ? "auf" : "zu", k === ziel ? "ziel" : "", k === neu ? "neu" : ""].filter(Boolean).join(" ");
    return `<div class="${kl}" role="listitem" aria-label="${esc(K.sub(k))}${auf ? ": " + esc(x.t) : ""}"><span class="tk-bild">${auf ? tkBildSvg(id, k) : ""}</span><b>${id === "gebote" ? k + 1 + "." : "Tag " + (k + 1)}</b></div>`;
  }).join("")}</div>`;
}

function tkErgebnis(id, i, full) {
  const K = TKETTEN[id], it = K.items;
  const zeile = k => `<div class="tk-zeile"><span class="tk-bild gross">${tkBildSvg(id, k)}</span><div><b>${esc(K.sub(k))} · ${esc(it[k].t)}</b><small>${esc(it[k].r)}</small><p>${esc(it[k].d || "")}</p></div></div>`;
  if (full) return `${tkZeitleiste(id, it.length - 1, -1, -1)}<div class="tk-liste">${it.map((_, k) => zeile(k)).join("")}</div>`;
  const k = Math.min(i + 1, it.length - 1);
  return `<div class="tk-hero"><span class="tk-bild hero">${tkBildSvg(id, k)}</span><b>${esc(K.sub(k))} · ${esc(it[k].t)}</b><small>${esc(it[k].r)}</small><p>${esc(it[k].d || "")}</p></div>${tkZeitleiste(id, i, -1, -1)}`;
}
function playThemenKette(id) {
  const K = TKETTEN[id], seq = K.items; let i = -1, xp = 0, lock = false, neuAuf = -1; const t0 = Date.now();
  screen.innerHTML = `<div class="stack"><div class="topline"><span><span id="cp">1</span> / ${seq.length}</span><span class="small muted">${esc(K.name)}</span><span id="cx">0 XP</span></div>
  <div class="progress"><i id="cbar"></i></div>
  <div id="tkz"></div>
  <div class="card stack"><div class="qsub" id="cs">${K.frage}</div><div class="q" id="cq"></div><div class="qsub" id="cm"></div>
    <div class="combo" id="cc"></div><div class="opts" id="co"></div></div>
  <div class="topline" style="justify-content:flex-end"><button class="btn ghost mini" data-go="${heimAnsicht("spielen")}">Abbrechen</button></div></div>`;
  wireGo(); show();
  function opts() {
    if (i < 0) return shuffle([seq[0].t, ...shuffle(seq.slice(1).map(x => x.t)).slice(0, 3)]);
    const richtig = seq[i + 1].t, rest = shuffle(seq.map(x => x.t).filter(t => t !== richtig && t !== seq[i].t)).slice(0, 3);
    return shuffle([richtig, ...rest]);
  }
  function show() {
    lock = false;
    if (i < 0) { $("cs").textContent = K.start; $("cq").textContent = ""; $("cm").textContent = K.info; }
    else { $("cs").textContent = K.frage; $("cq").textContent = seq[i].t; $("cm").textContent = `${K.sub(i)} · ${seq[i].r}`; }
    $("cp").textContent = i + 2; $("cbar").style.width = ((i + 1) / (seq.length - 1) * 100) + "%";
    $("tkz").innerHTML = tkZeitleiste(id, i, i + 1, neuAuf); neuAuf = -1;
    const o = $("co"); o.innerHTML = ""; opts().forEach(t => { const btn = document.createElement("button"); btn.className = "opt"; btn.textContent = t; btn.onclick = () => ans(btn, t); o.appendChild(btn); });
  }
  function ans(btn, t) {
    if (lock) return; const correct = seq[i + 1].t;
    if (t === correct) {
      lock = true; i++; xp += 6; richtig(1); neuAuf = i;
      btn.classList.add("right"); SFX.right(Math.min(i / 2, 12)); vibrate(10); const [x, y] = centerOf(btn); burst(x, y, 12); $("cx").textContent = xp + " XP";
      $("tkz").innerHTML = tkZeitleiste(id, i, -1, i); /* sofort aufdecken */
      if (i === seq.length - 1) return setTimeout(() => done(true), 350);
      setTimeout(show, 330);
    } else {
      lock = true; btn.classList.add("wrong"); SFX.wrong(); vibrate([60, 40, 60]); shakeScreen();
      [...$("co").children].forEach(x => { if (x.textContent === correct) x.classList.add("right"); });
      setTimeout(() => done(false, correct), 1300);
    }
  }
  function done(full, correct) {
    const rec = i > (S[K.key] || 0); if (rec) S[K.key] = i;
    let tal = Math.floor(Math.max(0, i) / 5) + (full ? K.tal : 0); if (full) xp += K.bonus;
    const W = spielWdh("tk-" + id); xp = wdhMal(xp, W); tal = wdhMal(tal, W);
    quest("ketteGespielt", 1); quest("runde", 1);
    screen.innerHTML = `${backBtn(heimAnsicht("spielen"), heimName("spielen"))}<div class="card result stack"><div class="label">${full ? "Großartig" : "Kette gerissen"}</div><div class="big">${i + 1} / ${seq.length}</div>
      <div class="muted">${full ? `${esc(K.name)} komplett in der richtigen Reihenfolge! (${esc(K.info)})` : i < 0 ? `${esc(K.start)} „${esc(correct)}“ (${esc(seq[0].r)}).` : `Nach „${esc(seq[i].t)}“ kommt „${esc(correct)}“ (${esc(seq[i + 1].r)}).`}</div>${rec && !full ? "<h2>Neuer Rekord!</h2>" : ""}
      <div class="rewards"><span class="pill">+${xp} XP</span><span class="pill">+${tal} Talente</span></div>${W.hinweis}
      <div class="tk-knoepfe"><button class="btn primary" id="cagain">Nochmal</button><button class="btn ghost" data-go="${heimAnsicht("spielen")}">Andere Kette</button><button class="btn fertig" data-go="home">Fertig</button></div>
      ${tkErgebnis(id, i, full)}</div>`; wireGo();
    $("cagain").onclick = () => { SFX.tap(); countdown(() => playThemenKette(id), cdSolo("kette-" + id)); };
    if (full) { SFX.level(); rain(200); } else if (rec) SFX.win();
    if (xp) addXp(xp, null, "kette", { t0, f: Math.max(0, i), fm: seq.length - 1, d: `${K.name}${full ? " · komplett" : " · gerissen"}${W.d}` }); addTal(tal); save(); checkBadges(); lbSync();
  }
}

/* ---------- Spickzettel ---------- */
VIEWS.learn = () => {
  let n = 0, html = `${backBtn("lernen", "Lektionen")}<h1>Spickzettel</h1>
  <p class="muted small" style="margin:0 0 12px">Tippe ein Buch an, um es zu verdecken. Oder verdecke alle und prüfe dich selbst.</p>
  <div class="topline" style="margin-bottom:12px"><button class="btn" id="hideAll">Alle verdecken</button><button class="btn ghost" id="showAll">Alle zeigen</button></div><div class="card stack">`;
  GROUPS.forEach((g, gi) => {
    html += `<div class="grp"><span class="tag ${g.t.toLowerCase()}">${g.t}</span> <b>${g.name}</b><div class="small muted">${g.tip}</div><div class="blist">` +
      g.books.map(b => { n++; return `<button class="bk"><span class="n">${n}</span><span class="t">${b}</span></button>`; }).join("") +
      `</div><details class="lied-det"><summary>${svg("music")} Im Lied</summary>${singBox(liedHinweisHtml(gi))}</details></div>`;
  });
  screen.innerHTML = html + "</div>"; wireGo(); wireSing(); aufnahmenPruefen();
  const bks = [...screen.querySelectorAll(".bk")];
  bks.forEach(b => b.onclick = () => { b.classList.toggle("hid"); SFX.tap(); });
  $("hideAll").onclick = () => { bks.forEach(b => b.classList.add("hid")); SFX.tap(); screen.dataset.all = "1"; };
  $("showAll").onclick = () => { bks.forEach(b => b.classList.remove("hid")); SFX.tap(); };
  bks.forEach(b => b.addEventListener("click", () => { if (screen.dataset.all === "1" && !S.peeked && bks.every(x => !x.classList.contains("hid"))) { S.peeked = true; save(); addXp(60, null, "spickzettel", { d: "Spickzettel entdeckt" }); checkBadges(); } }));
};

/* ---------- Abzeichen ---------- */
function badgeGrid(haben, vergleich) {
  return Object.entries(BADGE_KAT).map(([k, name]) => {
    const liste = BADGES.filter(b => b.kat === k);
    return `<div class="label" style="margin:16px 0 8px">${name}</div><div class="badges">${liste.map(b => {
      const got = haben.includes(b.id), cmp = vergleich ? vergleich.includes(b.id) : null;
      return `<div class="badge ${got ? "got" : ""}"><div class="medal">${svg(b.ic, got ? "#2a1d00" : "var(--muted)")}</div><b>${esc(b.name)}</b><span>${esc(b.d)}</span>
        ${vergleich ? `<span class="cmp"><i class="${got ? "ja" : ""}">${got ? "✓" : "–"}</i><i class="${cmp ? "ja" : ""}">${cmp ? "✓" : "–"}</i></span>` : `<span class="btal tal-n">+${b.tal || 5}${TAL_MUENZE}</span>`}</div>`;
    }).join("")}</div>`;
  }).join("");
}
VIEWS.badges = () => {
  screen.innerHTML = `${backBtn("home", "Start")}<h1>Abzeichen</h1><p class="muted small" style="margin:0 0 4px">${S.badges.length} von ${BADGES.length} gesammelt · jedes bringt Talente.</p>${badgeGrid(S.badges)}`;
  wireGo();
};

/* ---------- Talente-Laden ---------- */
let shopTab = "ruestung";
function kaufen(id, preis, el) {
  if (S.tal < preis) { SFX.wrong(); shakeScreen(); toast(`${TAL_MUENZE}<div>Dir fehlen noch <b>${preis - S.tal}</b> Talente.</div>`); return false; }
  S.tal -= preis; if (!S.owned.includes(id)) S.owned.push(id);
  SFX.coin(); if (el) { const [x, y] = centerOf(el); burst(x, y, 50, { up: 4 }); }
  save(); renderHud(); checkBadges(); lbSync(); return true;
}
/* Schatz-Laden als „Umkleide“: oben Vorschau am eigenen Avatar, darunter Kategorien (ohne seitliches Wischen) und ein 3er-Raster */
const SHOP_KAT = { ruestung: ["Rüstung", "ar-schild"], avatar: ["Avatare", "av-taube"], rahmen: ["Rahmen", ""], titel: ["Titel", "scroll"], farbe: ["Farben", "regenbogen"] };
let shopWahl = {};
VIEWS.shop = (tab, wahl) => {
  if (tab && SHOP_KAT[tab]) shopTab = tab;
  if (wahl) shopWahl[shopTab] = wahl;
  const n = armorCount();
  const muenze = TAL_MUENZE;
  /* Zustand eines Gegenstands: aktiv · frei (anlegen) · zu (Abzeichen/Reihenfolge) · kaufbar */
  const zustand = (kat, it, aktiv) => {
    if (kat === "ruestung") {
      const k = RUESTUNG.indexOf(it), hat = S.owned.includes("ar-" + it.id);
      if (hat) return { art: "aktiv", text: ["angelegt", "geläutert", "Gold"][ruestStufe(it.id)] };
      if (k === n) return { art: "kauf", preis: it.price, buy: "ruestung" };
      return { art: "zu", text: `erst ${RUESTUNG[n] ? RUESTUNG[n].name.split(" ")[0] : ""}` };
    }
    const pre = { avatar: "av", rahmen: "fr", titel: "ti", farbe: "" }[kat];
    if (aktiv) return { art: "aktiv", text: "aktiv" };
    if (it.price < 0) return needOk(it.need) ? { art: "frei", eq: pre || "farbe" } : { art: "zu", text: "Abzeichen", need: it.need };
    if (itemFrei(pre ? pre + "-" : "", it)) return { art: "frei", eq: pre || "farbe" };
    if (it.ab && levelOf(S.xp) < it.ab) return { art: "zu", text: "ab Level " + it.ab };
    if (kat === "avatar" || kat === "rahmen") {
      const liste = (kat === "avatar" ? AVATARE : RAHMEN).filter(x => x.price > 0);
      const naechstes = liste.find(x => !S.owned.includes(pre + "-" + x.id));
      if (naechstes && naechstes.id !== it.id) return { art: "zu", text: "erst " + naechstes.name.split(" ")[0] };
    }
    return { art: "kauf", preis: it.price, buy: pre || "farbe" };
  };
  const liste = { ruestung: RUESTUNG, avatar: AVATARE, rahmen: RAHMEN, titel: TITEL, farbe: THEMES }[shopTab];
  const istAktiv = it => ({ avatar: S.avatar === it.id, rahmen: S.frame === it.id, titel: S.title === it.id, farbe: S.theme === it.id, ruestung: S.owned.includes("ar-" + it.id) })[shopTab];
  const standard = shopTab === "ruestung" ? (RUESTUNG[n] || RUESTUNG.find(x => veredelPreis(x.id)) || RUESTUNG[RUESTUNG.length - 1]).id : (liste.find(istAktiv) || liste[0]).id;
  const sel = liste.find(x => x.id === shopWahl[shopTab]) || liste.find(x => x.id === standard);
  const zs = zustand(shopTab, sel, shopTab !== "ruestung" && istAktiv(sel));
  /* Farben: die gewählte Farbwelt sofort als Vorschau auf die ganze App legen (auch ungekauft); beim Verlassen gilt wieder die eigene */
  if (shopTab === "farbe") document.body.dataset.acc = sel.id; else applyTheme();
  /* Vorschau: der eigene Avatar mit dem gewählten Gegenstand */
  const vAv = shopTab === "avatar" ? sel.id : S.avatar, vFr = shopTab === "rahmen" ? sel.id : S.frame;
  const buehneBild = shopTab === "ruestung"
    ? `<span class="kb-ruest rst-${ruestStufe(sel.id)}">${svg("ar-" + sel.id)}</span>`
    : `<span class="kb-av" ${shopTab === "farbe" ? `style="--glanz:${sel.c}"` : ""}>${avatarHtml({ avatar: vAv, frame: vFr, name: S.lbName || "?" }, 96)}</span>`;
  const vStufe = shopTab === "ruestung" && S.owned.includes("ar-" + sel.id) ? ruestStufe(sel.id) : 0, vPreis = shopTab === "ruestung" ? veredelPreis(sel.id) : 0;
  const text = shopTab === "ruestung" ? (vStufe ? RUEST_STUFE[vStufe].bezug : `„${sel.vers}“ – ${sel.ref}`) : (sel.bezug || "");
  const knopf = zs.art === "kauf" ? `<button class="btn gold kb-kauf" data-buy="${zs.buy}" data-id="${sel.id}" data-p="${zs.preis}">Kaufen · ${zs.preis}${muenze}</button>`
    : zs.art === "frei" ? `<button class="btn gold kb-kauf" data-eq="${zs.eq}" data-id="${sel.id}">Anlegen</button>`
    : zs.art === "aktiv" && vPreis ? `<button class="btn gold kb-kauf" data-veredel="${sel.id}" data-p="${vPreis}">${svg("fire")} Veredeln: ${RUEST_STUFE[vStufe + 1].name} · ${vPreis}${muenze}</button>`
    : zs.art === "aktiv" ? `<span class="pz ok kb-status">${svg("check")} ${zs.text}</span>`
    : `<span class="pz zu kb-status">${svg("lock")} ${zs.need ? esc(needText(zs.need)) : esc(zs.text)}</span>`;
  const katIc = k => k === "rahmen" ? avatarHtml({ avatar: "initial", frame: "gold", name: "M" }, 22) : svg(SHOP_KAT[k][1]);
  const kachel = it => { const z = zustand(shopTab, it, shopTab !== "ruestung" && istAktiv(it));
    const bild = shopTab === "ruestung" ? `<span class="rst-${S.owned.includes("ar-" + it.id) ? ruestStufe(it.id) : 0}">${svg("ar-" + it.id)}</span>` : shopTab === "avatar" ? avatarHtml({ avatar: it.id, frame: "none", name: S.lbName || "?" }, 46)
      : shopTab === "rahmen" ? avatarHtml({ avatar: S.avatar, frame: it.id, name: S.lbName || "?" }, 40)
      : shopTab === "farbe" ? `<span class="swatch" style="background:radial-gradient(circle at 35% 30%,#fff8,${it.c} 45%,#1b2146)"></span>`
      : `<span class="kb-titel-ic">${svg(it.id === "none" ? "user" : "scroll")}</span>`;
    const marke = z.art === "aktiv" ? `<span class="pz ok">${z.text}</span>` : z.art === "frei" ? `<span class="pz ok">${it.price > 0 ? "gekauft" : "frei"}</span>` : z.art === "zu" ? `<span class="pz zu">${svg("lock")}</span>` : `<span class="pz ${S.tal >= z.preis ? "" : "arm"}">${z.preis}${muenze}</span>`;
    return `<button class="kb-item ${it.id === sel.id ? "gewaehlt" : ""} ${z.art === "zu" ? "gesperrt" : ""}" data-wahl="${it.id}" aria-label="${esc(it.name)}">${z.art === "aktiv" ? `<span class="an-haken">${svg("check")}</span>` : ""}<span class="vor">${bild}</span><small>${esc(it.name)}</small>${marke}</button>`; };
  const ladenZahl = (() => { let h = RUESTUNG.filter(r => S.owned.includes("ar-" + r.id)).length, g = RUESTUNG.length;
    [[AVATARE, "av-"], [RAHMEN, "fr-"], [TITEL, "ti-"], [THEMES, ""]].forEach(([l, p]) => l.filter(i => i.price > 0).forEach(i => { g++; if (S.owned.includes(p + i.id)) h++; })); return `${h}/${g}`; })();
  const ruestN = RUESTUNG.filter(r => S.owned.includes("ar-" + r.id)).length;
  screen.innerHTML = `${bereichKopf("laden", { ic: "shop", t: "Laden", sub: kaufbarIn(shopTab) || Object.keys(SHOP_KAT).some(kaufbarIn) ? "Es gibt etwas Neues für dich!" : "Sammle Talente für Neues", ring: [pkt(S.tal), "Talente"],
    tafel: [[`${ruestN}/${RUESTUNG.length}`, "Rüstung"], [ladenZahl, "Gesammelt"], [`${levelOf(S.xp)}`, "Level"]] })}
    ${bkLabel("star", "Vorschau")}
    <section class="kb-buehne ${shopTab}">
      <div class="podest">${buehneBild}</div>
      <div class="kb-info"><span class="kb-tag">${shopTab === "ruestung" ? `Teil ${RUESTUNG.indexOf(sel) + 1} von 6${vStufe ? " · " + RUEST_STUFE[vStufe].name : ""}` : zs.art === "aktiv" ? "Trägst du gerade" : shopTab === "farbe" ? "Vorschau auf die App" : "Vorschau"}</span><b>${esc(sel.name)}</b>
        ${text ? `<div class="kb-text">${esc(text)}</div>` : ""}${knopf}</div>
    </section>
    ${bkLabel("shop", "Sortiment")}
    <div class="kb-tabs" role="tablist">${Object.entries(SHOP_KAT).map(([k, [t]]) => `<button role="tab" data-tab="${k}" aria-selected="${shopTab === k}" aria-label="${t}${kaufbarIn(k) ? ", jetzt kaufbar" : ""}">${katIc(k)}${kaufbarIn(k) ? `<i class="kat-punkt" aria-hidden="true"></i>` : ""}<span>${t}</span></button>`).join("")}</div>
    <div class="kb-grid">${liste.map(kachel).join("")}</div>`;
  wireGo();
  screen.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { SFX.tap(); const y = scrollY; VIEWS.shop(b.dataset.tab); scrollTo(0, y); });
  screen.querySelectorAll("[data-wahl]").forEach(b => b.onclick = () => { SFX.tap(); const y = scrollY; VIEWS.shop(null, b.dataset.wahl); scrollTo(0, y); const bh = screen.querySelector(".kb-buehne"); if (bh && bh.getBoundingClientRect().top < 60) bh.scrollIntoView({ behavior: "smooth", block: "center" }); });
  screen.querySelectorAll("[data-buy]").forEach(b => b.onclick = () => {
    const kat = b.dataset.buy, id = b.dataset.id, p = +b.dataset.p;
    const pre = { ruestung: "ar-", av: "av-", fr: "fr-", ti: "ti-", farbe: "" }[kat];
    if (!kaufen(pre + id, p, b)) return;
    if (kat === "av") S.avatar = id; if (kat === "fr") S.frame = id; if (kat === "ti") S.title = id; if (kat === "farbe") { S.theme = id; applyTheme(); }
    if (kat === "ruestung") { const r = RUESTUNG.find(x => x.id === id); rain(60); delete shopWahl.ruestung; modal(`<div class="label">Angelegt</div><div class="ruest-gross">${svg("ar-" + id)}</div><h2>${esc(r.name)}</h2><figure class="vers klein"><blockquote>${esc(r.vers)}</blockquote><figcaption>${esc(r.ref)} · ${VERS_QUELLE}</figcaption></figure><button class="btn primary" data-close>Amen</button>`); }
    save(); lbSync(); renderHud(); VIEWS.shop();
  });
  screen.querySelectorAll("[data-eq]").forEach(b => b.onclick = () => {
    const kat = b.dataset.eq, id = b.dataset.id; SFX.tap();
    if (kat === "av") S.avatar = id; if (kat === "fr") S.frame = id; if (kat === "ti") S.title = id; if (kat === "farbe") { S.theme = id; applyTheme(); }
    save(); lbSync(); renderHud(); VIEWS.shop();
  });
  /* 6.68: Rüstung veredeln */
  screen.querySelectorAll("[data-veredel]").forEach(b => b.onclick = () => {
    const id = b.dataset.veredel, p = +b.dataset.p, st = ruestStufe(id);
    if (S.tal < p) { SFX.wrong(); shakeScreen(); toast(`${TAL_MUENZE}<div>Dir fehlen noch <b>${p - S.tal}</b> Talente.</div>`); return; }
    S.tal -= p; S.ruestStufe = Object.assign({}, S.ruestStufe, { [id]: st + 1 }); SFX.badge(); const [x, y] = centerOf(b); burst(x, y, 60, { up: 5 }); rain(st ? 90 : 50);
    save(); renderHud(); checkBadges(); lbSync();
    const r = RUESTUNG.find(x => x.id === id), neu = RUEST_STUFE[st + 1];
    modal(`<div class="label">Veredelt</div><div class="ruest-gross rst-${st + 1}">${svg("ar-" + id)}</div><h2>${esc(r.name)}</h2><span class="pz ok" style="justify-self:center">${esc(neu.name)}</span><p class="muted small" style="margin:0">${esc(neu.bezug)}</p>
      ${RUESTUNG.every(x => ruestStufe(x.id) >= 2) ? `<p class="small" style="margin:0;color:var(--accent)"><b>Die ganze Rüstung ist im Feuer erprobt!</b> Rahmen „Im Feuer erprobt“ ist freigeschaltet.</p>` : ""}<button class="btn primary" data-close>Amen</button>`);
    VIEWS.shop();
  });
};

/* ---------- Menü am Avatar oben: Profil, Abzeichen, Teilen, Wer spielt?, Feedback ---------- */
function ichMenue() {
  if (!S.lbName) { go("name"); return; }
  const z = (wert, ic, t, info = "") => `<button class="im-zeile" data-close="${wert}">${svg(ic)}<span><b>${t}</b>${info ? `<small>${info}</small>` : ""}</span><i>›</i></button>`;
  const m = modal(`<div class="im-kopf">${avatarHtml({ avatar: S.avatar, frame: S.frame, name: S.lbName }, 56)}<div><b>${esc(S.lbName)}</b><small>${esc(rangVon())} · Level ${levelOf(S.xp)}</small></div></div>
    ${xpInfoHtml()}
    <div class="im-liste">${z("wer", "people", "Wer spielt?", "Spieler wechseln")}${z("profil", "user", "Mein Profil", "Name, Gemeinde, Statistik")}
    <button class="im-zeile gs-schalter" id="gsSchalter" aria-pressed="${grossAn()}">${svg("eye")}<span><b>Große Schrift</b><small>${grossAn() ? "an" : "aus"}</small></span><i class="gs-knopf"></i></button>${z("badges", "medal", "Abzeichen", `${S.badges.length} von ${BADGES.length}`)}${z("share", "share", "Mit Freunden teilen", "QR-Code")}${NACH && NACH.some(nachSichtbar) ? z("neuigkeiten", "chat", "Neuigkeiten", nachUngelesen().length ? nachUngelesen().length + " neu" : "") : ""}${DLG && DLG.length ? z("dialog", "chat", "Post vom Entwickler", dlgNeuSpieler() ? dlgNeuSpieler() + " neu" : "Gespräch öffnen") : ""}${entwickler ? z("postfach", "post", "Postkasten", postfachNeu ? postfachNeu + " neu" : "") : ""}${deferredInstall && !S.appBonus ? z("install", "down", "App installieren", `+${APP_BONUS} Talente`) : ""}${z("feedback", "chat", "Feedback an den Entwickler")}</div>
    <button class="btn ghost" data-close="">Schließen</button>`, r => {
      if (r === "feedback") feedbackOeffnen();
      else if (r === "install") { deferredInstall.prompt(); deferredInstall.userChoice.catch(() => {}).then(() => { deferredInstall = null; }); }
      else if (r) go(r);
    });
  m.classList.add("ich-menue"); m.dataset.frei = "1";
  const gs = m.querySelector("#gsSchalter"); if (gs) gs.onclick = () => { SFX.tap(); grossSetzen(!grossAn()); gs.setAttribute("aria-pressed", grossAn()); gs.querySelector("small").textContent = grossAn() ? "an" : "aus"; };
}
/* 8.0: Große Schrift – je Gerät, alles ca. 15 % größer */
const GROSS_KEY = "bq-gross3"; /* 9.8: neuer Schlüssel – Große Schrift ist für alle standardmäßig AUS und nur noch manuell zuschaltbar (alte Werte aus bq-gross2 zählen nicht mehr) */
function grossAn() { try { return localStorage.getItem(GROSS_KEY) === "1"; } catch (e) { return false; } }
function grossSetzen(an) { try { localStorage.setItem(GROSS_KEY, an ? "1" : "0"); } catch (e) {} document.documentElement.classList.toggle("gross", an); }
document.documentElement.classList.toggle("gross", grossAn());

/* ---------- Mein Profil ---------- */
function statsZeilen(p) {
  return [
    ["Level", p.level || 1], ["XP gesamt", p.xp || 0], ["XP diese Woche", p.week === weekKey() ? p.weekXp || 0 : 0],
    ["Titel im AT", AT_TITEL[titelIndex(AT_TITEL, p.atP || 0)][1]], ["Titel im NT", NT_TITEL[titelIndex(NT_TITEL, p.ntP || 0)][1]],
    ["Kette Bibel", (p.bestChain ? p.bestChain + 1 : 0) + "/66"], ["Kette AT", (p.chainAT ? p.chainAT + 1 : 0) + "/39"], ["Kette NT", (p.chainNT ? p.chainNT + 1 : 0) + "/27"],
    ["Kette rückwärts", (p.chainRueck ? p.chainRueck + 1 : 0) + "/66"], ["Blitz-Rekord", p.blitz || 0], ["Blitz in Folge", p.combo != null ? p.combo : "–"], ["Spieltage (4 Wochen)", Array.isArray(p.tl) ? tage28(p.tl) : "–"], ["Frische Siegel", bewaehrtWert(p)], ["Serie (Tage)", p.streak || 0], ["Abzeichen", p.badges || 0], ["Arena-Siege", p.duS != null ? p.duS : "–"], ["Arena-Duelle", p.duG != null ? p.duG : "–"], ["Waffenrüstung", (p.armor || 0) + "/6"]
  ];
}
function titelKarte(liste, p, tag) {
  const i = titelIndex(liste, p), t = liste[i], next = liste[i + 1];
  return `<div class="titelkarte"><div class="topline"><span><span class="tag ${tag.toLowerCase()}">${tag}</span> <b>${esc(t[1])}</b></span><span class="small muted">${p}%</span></div>
    <span class="tbar"><i style="width:${p}%"></i></span><div class="small muted">${esc(t[2])}</div>${next ? `<div class="small">Nächster Titel bei ${next[0]}%: <b>${esc(next[1])}</b></div>` : ""}</div>`;
}
/* 9.10: Profil neu (Spielerausweis) + eigene Seite „Errungenschaften und Statistik“ */
const PF_IC = {
  stift: '<svg class="pf2-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19z"/><path d="M14.5 6.5l3 3"/></svg>',
  tausch: '<svg class="pf2-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h14l-3-3M20 16H6l3 3"/></svg>',
  pfeil: '<svg class="pf2-pf" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  ok: '<svg class="pf2-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  zu: '<svg class="pf2-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};
const pfTrenner = t => `<div class="pf2-tr" role="separator"><i></i><b></b><span>${t}</span><b></b><i></i></div>`;
function pfLevel() { const n = levelOf(S.xp), lo = cum(n), hi = cum(n + 1); return { n, lo, hi, p: Math.max(0, Math.min(100, (S.xp - lo) / (hi - lo) * 100)), fehlt: Math.max(0, hi - Math.round(S.xp)) }; }
function pfRing(p, px, txt) {
  const r = px / 2 - 6, c = 2 * Math.PI * r;
  return `<div class="pf2-ring" style="width:${px}px;height:${px}px"><svg width="${px}" height="${px}" aria-hidden="true"><circle cx="${px / 2}" cy="${px / 2}" r="${r}" fill="none" stroke="#ffffff1a" stroke-width="6"/><circle cx="${px / 2}" cy="${px / 2}" r="${r}" fill="none" stroke="#f2c14e" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(c * Math.max(0, Math.min(100, p)) / 100).toFixed(1)} ${c.toFixed(1)}"/></svg><b>${txt}</b></div>`;
}
VIEWS.profil = () => {
  const li = pfLevel(), online = window.LB && window.LB.ok;
  /* 9.34: Profil kompakt (Variante 2) – passt ohne Scrollen auf eine Seite */
  const zeile = (go, ic, t, w) => `<button class="pf2-zeile pf2-k pf3-z" data-go="${go}"><span class="pf2-ic">${svg(ic)}</span><span class="pf2-tx"><b>${t}</b></span>${w ? `<small class="pf3-w">${w}</small>` : ""}${PF_IC.pfeil}</button>`;
  const tageN = streakNow() | 0;
  screen.innerHTML = `${backBtn("home", "Start")}<div class="pf2 pf3">
    <section class="pf2-ausweis pf3-ausweis">
      ${avatarHtml({ avatar: S.avatar, frame: S.frame, name: S.lbName || "Du" }, 64)}
      <div class="pf3-id"><div class="pf2-namebox pf3-namebox" id="pfNameBox"><h2>${esc(S.lbName || "Noch ohne Namen")}</h2>${S.lbName ? `<button class="pf2-edit" id="rename" aria-label="Namen ändern">${PF_IC.stift}</button>` : ""}</div>
        <span class="pf2-rang">${esc(rangVon())} · Level ${li.n}</span></div>
      <div class="pf2-xp pf3-xp" aria-label="Fortschritt bis Level ${li.n + 1}"><div class="pf2-bar"><i style="width:${li.p.toFixed(1)}%"></i></div><span><b>${pkt(Math.round(S.xp))} XP</b> · noch ${pkt(li.fehlt)} bis Level ${li.n + 1}</span></div>
      ${!S.pid && !S.offlineOnly ? `<div class="small muted pf3-hinw">Erscheint in der Rangliste, sobald Internet da ist.</div>` : ""}
    </section>
    ${gemKarteHtml()}
    ${zeile("errung", "medal", "Errungenschaften", `${S.badges.length}/${BADGES.length}`)}
    ${zeile("stat", "fire", "Statistik", `${tageN} ${tageN === 1 ? "Tag" : "Tage"} in Folge`)}
    ${zeile("share", "share", "Mit Freunden teilen", "QR-Code")}
    ${deferredInstall && !S.appBonus ? `<button class="pf2-zeile pf2-k pf3-z" id="pfInstall"><span class="pf2-ic">${svg("down")}</span><span class="pf2-tx"><b>App installieren</b></span><small class="pf3-w">+${APP_BONUS} Talente</small>${PF_IC.pfeil}</button>` : ""}
    ${entwickler && (advTestOn() || dayNum(today()) < dayNum(ADV_START)) ? `<button class="pf2-zeile pf2-k pf3-z" id="advTestBtn"><span class="pf2-ic">${svg("kerze")}</span><span class="pf2-tx"><b>Advent-Testmodus</b></span><small class="pf3-w">${advTestOn() ? "an – öffnen" : "starten"}</small>${PF_IC.pfeil}</button>` : ""}
    <button class="pf2-zeile pf2-k pf3-z gs-schalter pf-gross" id="gsSchalterP" aria-pressed="${grossAn()}"><span class="pf2-ic">${svg("eye")}</span><span class="pf2-tx"><b>Große Schrift</b></span><small class="pf3-w">${grossAn() ? "an" : "aus"}</small><i class="gs-knopf"></i></button>
    ${entwickler && online ? kennungHtml("kennProfil") : ""}
    <p class="small muted pf3-fuss">Bibelverse: ${VERS_QUELLE} © Genfer Bibelgesellschaft.</p>
    <button class="fb-karte" id="fbLink2" aria-label="Feedback an den Entwickler"><span class="fb-bild">${FB_BILD}</span><span class="fb-tx"><b>Feedback an den Entwickler</b><small>Idee, Lob oder Fehler? Schreib mir!</small></span></button></div>`;
  wireGo(); pfGemVerdrahten();
  gemLaden().then(ch => { if (ch && current === "profil" && !document.querySelector(".modal")) { const k = $("pfGem"); if (k) { k.outerHTML = gemKarteHtml(); pfGemVerdrahten(); } } });
  $("gsSchalterP").onclick = () => { SFX.tap(); const b = $("gsSchalterP"); grossSetzen(!grossAn()); b.setAttribute("aria-pressed", grossAn()); b.querySelector("small").textContent = grossAn() ? "an" : "aus"; };
  $("fbLink2").onclick = () => { SFX.tap(); feedbackOeffnen(); };
  if ($("pfInstall")) $("pfInstall").onclick = () => { SFX.tap(); deferredInstall.prompt(); deferredInstall.userChoice.catch(() => {}).then(() => { deferredInstall = null; }); };
  if ($("advTestBtn")) $("advTestBtn").onclick = () => { SFX.tap(); if (!advTestOn()) advTestSchalten(true); go("advent"); };
  kennungKopierenVerdrahten(screen);
  /* Name direkt am Namen ändern */
  if ($("rename")) $("rename").onclick = () => {
    SFX.tap(); const box = $("pfNameBox"); box.classList.add("bearbeiten");
    box.innerHTML = `<input class="field pf2-input" id="rn" maxlength="20" value="${esc(S.lbName)}" aria-label="Neuer Spitzname"><button class="pf2-edit ok" id="rnSave" aria-label="Speichern">${PF_IC.ok}</button><button class="pf2-edit" id="rnNo" aria-label="Abbrechen">${PF_IC.zu}</button>`;
    const speichern = () => { const n = $("rn").value.trim().replace(/\s+/g, " "); if (n.length < 2) { SFX.wrong(); $("rn").focus(); return; } if (n !== S.lbName) { S.lbName = n; S.gemGesendet = ""; save(); lbSync(true); gemSenden(); SFX.coin(); } go("profil"); };
    $("rnSave").onclick = speichern; $("rnNo").onclick = () => { SFX.tap(); go("profil"); };
    $("rn").onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); speichern(); } else if (e.key === "Escape") go("profil"); };
    $("rn").focus(); $("rn").select();
  };
};
function pfGemVerdrahten() {
  if ($("wechseln")) $("wechseln").onclick = () => { SFX.tap(); go("wer"); };
  if ($("gemBeitritt")) $("gemBeitritt").onclick = () => { SFX.tap(); gemBeitreten(); };
  if ($("gemWeg")) $("gemWeg").onclick = () => { SFX.tap(); gemVerlassen(); };
  if ($("antragWeg")) $("antragWeg").onclick = () => { SFX.tap(); const L = window.LB; if (!L || !L.ok || !L.antragLoeschen) return; L.antragLoeschen(S.pid).then(() => { ANTRAG = null; gemNeuZeichnen(); }).catch(() => toast(`${svg("nein")}<div>Das hat nicht geklappt.</div>`)); };
}

/* ---------- Errungenschaften und Statistik (9.10) ---------- */
function pfBalken(t, v, max, kl) { return `<div class="pf2-zl"><div class="pf2-vz"><span>${t}</span><b>${v}/${max}</b></div><div class="pf2-bar ${kl || ""}"><i style="width:${Math.min(100, v / max * 100).toFixed(0)}%"></i></div></div>`; }
function pfTitel(liste, p, tag) {
  const i = titelIndex(liste, p), t = liste[i], nx = liste[i + 1];
  return `<div class="pf2-zl"><div class="pf2-vz"><span><span class="tag ${tag.toLowerCase()}">${tag}</span> <b>${esc(t[1])}</b></span><b>${p}%</b></div><div class="pf2-bar ${tag.toLowerCase()}"><i style="width:${p}%"></i></div>${nx ? `<div class="small muted">Nächster Titel bei ${nx[0]}%: ${esc(nx[1])}</div>` : `<div class="small muted">Höchster Titel erreicht</div>`}</div>`;
}
function pfKachel(ic, n, t) { return `<div class="pf2-kachel">${svg(ic)}<div class="n">${n}</div><div class="t">${t}</div></div>`; }
const pfKopf = t => `<h1 class="pf2-h1">${t}</h1>`;
let errTab = 0;
VIEWS.errung = (tab) => {
  if (typeof tab === "number") errTab = tab;
  const m = lbPayload(), { atP, ntP } = fortschritt(), TABS = ["Übersicht", "Abzeichen"];
  const teile = [
    () => `<div class="pf2-g2"><button class="pf2-kachel pf2-kl" data-st="1" aria-label="Alle Abzeichen ansehen">${pfKachel("medal", `${S.badges.length}<small> / ${BADGES.length}</small>`, "Abzeichen ›").replace(/^<div class="pf2-kachel">|<\/div>$/g, "")}</button>${pfKachel("ar-schild", armorCount() + "<small> / 6</small>", "Waffenrüstung")}</div>
      ${pfTrenner("Titel")}
      <div class="pf2-karte pf2-zls">${pfTitel(AT_TITEL, atP, "AT")}${pfTitel(NT_TITEL, ntP, "NT")}</div>
      ${pfTrenner("Siegel")}
      <div class="pf2-karte"><div class="pf2-sg">${siegelReihe(m)}</div></div>`,
    () => `<div class="pf2-karte"><div class="pf2-vz"><span>Gesammelt</span><b>${S.badges.length} von ${BADGES.length}</b></div><div class="pf2-bar"><i style="width:${(S.badges.length / BADGES.length * 100).toFixed(0)}%"></i></div></div>${badgeGrid(S.badges)}`
  ];
  screen.innerHTML = `${backBtn("profil", "Profil")}${pfKopf("Errungenschaften")}<div class="pf2"><div class="pf2-seg pf2-seg2" role="tablist">${TABS.map((t, i) => `<button role="tab" aria-selected="${i === errTab}" class="${i === errTab ? "an" : ""}" data-st="${i}">${t}</button>`).join("")}</div>${teile[errTab]()}</div>`;
  wireGo();
  screen.querySelectorAll("[data-st]").forEach(b => b.onclick = () => { SFX.tap(); VIEWS.errung(+b.dataset.st); window.scrollTo(0, 0); });
};
VIEWS.stat = () => {
  const m = lbPayload(), h = dayNum(today());
  const ch = (t, v, max, kl) => pfBalken(t, v ? v + 1 : 0, max, kl);
  screen.innerHTML = `${backBtn("profil", "Profil")}${pfKopf("Statistik")}<div class="pf2">
    ${pfTrenner("Überblick")}
    <div class="pf2-g2">${pfKachel("fire", (m.streak || 0) + (m.streak === 1 ? " Tag" : " Tage"), "Serie")}${pfKachel("sun", m.t28 || 0, "Spieltage in 4 Wochen")}</div>
    <div class="pf2-karte"><div class="pf2-vz"><span>Die letzten 4 Wochen</span><b>${m.t28 || 0} Tage</b></div><div class="pf2-tage" role="img" aria-label="${m.t28 || 0} Spieltage in den letzten 4 Wochen">${Array.from({ length: 28 }, (_, i) => `<i class="${S.tage.includes(h - 27 + i) ? "an" : ""}"></i>`).join("")}</div></div>
    ${pfTrenner("Rekorde")}
    <div class="pf2-g2">${pfKachel("bolt", m.blitz || 0, "Blitz-Rekord")}${pfKachel("bolt", m.combo != null ? m.combo : "–", "Blitz in Folge")}${pfKachel("duell", (m.duS || 0) + " / " + (m.duG || 0), "Arena-Siege / Duelle")}${pfKachel("biblionaer", pkt(m.bib || 0), "Biblionär-Rekord")}</div>
    ${pfTrenner("Ketten")}
    <div class="pf2-karte pf2-zls">${ch("Kette Bibel", m.bestChain, 66)}${ch("Kette AT", m.chainAT, 39, "at")}${ch("Kette NT", m.chainNT, 27, "nt")}${ch("Kette rückwärts", m.chainRueck, 66)}${ch("Zehn Gebote", m.chainGebote, 10)}${ch("Schöpfungstage", m.chainSchoepfung, 7)}</div></div>`;
  wireGo();
};

/* ---------- Gemeinde-Rangliste ---------- */
function lbPayload() {
  const wk = weekKey();
  return {
    name: S.lbName, xp: Math.round(S.xp), level: levelOf(S.xp),
    bestChain: Math.min(S.bestChain | 0, 65), chainAT: Math.min(S.chainAT | 0, 38), chainNT: Math.min(S.chainNT | 0, 26), chainRueck: Math.min(S.chainRueck | 0, 65),
    stars: Math.min(Object.values(S.stars).reduce((a, b) => a + b, 0), 24), badges: S.badges.length, badgeIds: S.badges.slice(0, 80),
    streak: streakNow() | 0, bestStreak: S.bestStreak | 0, blitz: S.bestBlitz | 0, combo: Math.min(S.bestCombo | 0, 1000),
    week: wk, weekXp: S.weekKey === wk ? Math.round(S.weekXp) : 0,
    avatar: S.avatar, frame: S.frame, title: S.title, armor: armorCount(),
    atP: fortschritt().atP, ntP: fortschritt().ntP,
    tl: S.tage.filter(n => n > dayNum(today()) - 31).slice(-31), t28: tage28(S.tage),
    sg: siegelDaten().sg, bew: siegelDaten().bew, duS: Math.min(S.duSiege | 0, 100000), duG: Math.min(S.duSpiele | 0, 100000),
    bib: Math.min(S.bibRekord | 0, 1000000),
    ...(S.eingeladenVon && S.eingeladenVon !== S.pid ? { von: S.eingeladenVon } : {})
  };
}
let lbTimer = null, cloudTimer = null;
function lbSync(now) {
  const L = window.LB; if (gesperrt || !S.lbName || S.offlineOnly || !L || !L.ok || !L.uid || namePruefungLaeuft) return;
  if (!S.pid) S.pid = neuePid();
  clearTimeout(lbTimer);
  lbTimer = setTimeout(() => {
    try { stiftSenden(); } catch (e) {} /* 6.68: noch nicht gesendete Spenden */
    try { bethSenden(); } catch (e) {} /* 7.3: Weg nach Bethlehem */
    try { xqSenden(); } catch (e) {} /* 6.73: XP-Quellen */
    try { talSenden(); } catch (e) {} /* 6.95: Talente-Zählung */
    try { gemSenden(); } catch (e) {} /* 9.0: Gemeinde-Zuordnung */
    const opts = {}; if (!S.ownersSet && eigenePid(S.pid)) opts.owners = [L.uid];
    const ok = () => { if (opts.owners) { S.ownersSet = true; lsSchreiben(); geraetSpeichern(); } };
    /* Übergang 6.40: Solange die neuen Firebase-Regeln (Biblionär-Felder) noch nicht veröffentlicht sind, ohne diese Felder speichern */
    const ohneBib = () => { const d = lbPayload(); delete d.bib; return d; };
    /* Wochenrunde „Biblionär“ steht in einer eigenen Sammlung (die Ranglisten-Regel ist an ihrer Rechengrenze) */
    if (S.bwK && L.bibWocheSetzen && S.bwSync !== S.bwK + ":" + (S.bwP | 0)) { const sig = S.bwK + ":" + (S.bwP | 0);
      L.bibWocheSetzen({ pid: S.pid, wk: S.bwK, p: Math.min(S.bwP | 0, 1000000), name: S.lbName, av: S.avatar, fr: S.frame, lv: levelOf(S.xp) }).then(() => { S.bwSync = sig; save(); }).catch(e => dbFehler("Wochenrunde speichern", e)); }
    /* 6.48: Biblionär-Spiele für die Rangliste „Gespielt“ – als Dokument gesamt_<pid> in derselben Sammlung (Regeln bleiben unverändert) */
    const bgSig = (S.bibSpiele | 0) + ":" + S.lbName + ":" + (S.avatar || "") + ":" + (S.frame || "") + ":" + levelOf(S.xp);
    if ((S.bibSpiele | 0) > 0 && L.bibWocheSetzen && S.bgSync !== bgSig)
      L.bibWocheSetzen({ pid: S.pid, wk: BIB_GESAMT, p: Math.min(S.bibSpiele | 0, 1000000), name: S.lbName, av: S.avatar, fr: S.frame, lv: levelOf(S.xp) }).then(() => { S.bgSync = bgSig; save(); }).catch(e => dbFehler("Biblionär-Spiele speichern", e));
    L.push(S.pid, lbPayload(), opts).then(ok).catch(e => {
      if (e && e.code === "permission-denied") return L.push(S.pid, ohneBib(), opts).then(ok).catch(e2 => dbFehler("Rangliste speichern", e2));
      dbFehler("Rangliste speichern", e);
    });
  }, now ? 0 : 2500);
}
/* Datenbankfehler (z. B. abgelehnt durch die Regeln) an den Verwalter melden – Verbindungsprobleme nicht.
   6.64: Bei „permission-denied“ zuerst prüfen, ob dieses Gerät noch in der Geräteliste des Profils steht.
   Hat das Gerät eine neue Kennung bekommen (z. B. weil Safari die Anmeldung gelöscht hat), verbindet es sich selbst neu. */
function dbFehler(was, e) {
  const code = (e && e.code) || "unbekannt";
  if (["unavailable", "deadline-exceeded", "cancelled"].includes(code) || (typeof navigator !== "undefined" && navigator.onLine === false) || String(e && e.message) === "offline") return;
  if (code === "permission-denied" && S.pid && S.ownersSet) { geraetNeuVerbinden(was); return; }
  postkastenMelden("datenbank", `${was} fehlgeschlagen (${code}) – Spieler ${S.lbName || "?"}, Profil ${S.pid || "?"}, Gerät ${geraetKennung() || "?"}, Version ${APP_VERSION}.`, "dbf-" + was + "-" + code);
}
let neuVerbindenLaeuft = null, neuVerbundenPid = "";
function geraetNeuVerbinden(was) {
  const L = window.LB, pid = S.pid; if (!L || !L.ok || !L.uid || !pid) return Promise.resolve(false);
  if (neuVerbindenLaeuft) return neuVerbindenLaeuft;
  neuVerbindenLaeuft = (async () => {
    const kenn = L.uid, wer = `Spieler ${S.lbName || "?"}, Profil ${pid}, Gerät ${kenn}, Version ${APP_VERSION}`;
    let e = null; try { e = await L.holeSpieler(pid); } catch (x) {}
    if (!e) { postkastenMelden("datenbank", `${was || "Prüfung"}: Profil nicht gefunden – ${wer}.`, "nv-weg-" + pid); return false; }
    const drin = Array.isArray(e.owners) ? e.owners.includes(kenn) : pid === kenn;
    if (drin) { /* Gerät ist eingetragen – dann liegt es an etwas anderem (z. B. Größe des Spielstands) */
      if (was) postkastenMelden("datenbank", `${was} fehlgeschlagen (permission-denied, Gerät ist eingetragen) – ${wer}, Spielstand ${JSON.stringify(spielstandExport()).length} Zeichen.`, "dbf-" + was + "-drin");
      return false; }
    if (neuVerbundenPid === pid) return false; /* höchstens einmal pro Sitzung */
    neuVerbundenPid = pid;
    try {
      await L.join(pid, {});
      S.ownersSet = true; save(); lbSync(true); cloudSync(true);
      postkastenMelden("datenbank", `Gerät automatisch neu verbunden – ${wer} (Geräte im Profil jetzt ${(e.owners || []).length + 1}/20).`, "nv-ok-" + pid + "-" + kenn);
      return true;
    } catch (x) {
      const n = (e.owners || []).length, c = (x && x.code) || "unbekannt";
      postkastenMelden("datenbank", `Neu verbinden fehlgeschlagen (${c}) – ${wer}, Geräte im Profil ${n}/20${n >= 20 ? " (Liste voll)" : ""}.`, "nv-fehler-" + pid + "-" + c);
      toast(`${svg("people", accent())}<div><b>Online-Sicherung klappt gerade nicht</b><div class="small muted">Dein Fortschritt bleibt auf diesem Gerät. Der Verwalter ist informiert.</div></div>`);
      return false;
    }
  })().finally(() => { setTimeout(() => { neuVerbindenLaeuft = null; }, 100); });
  return neuVerbindenLaeuft;
}
/* Kompletten Spielstand online sichern (nur wer in der Rangliste ist) */
function cloudSync(now) {
  const L = window.LB; if (gesperrt || !S.lbName || S.offlineOnly || !S.pid || !S.ownersSet || !L || !L.ok || !L.saveState) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => { L.saveState(S.pid, spielstandExport()).catch(e => dbFehler("Spielstand sichern", e)); }, now ? 0 : 4000);
}
function spielstandExport() { const c = JSON.parse(JSON.stringify(S)); delete c.mute; delete c.beat; return c; }
/* Zwei Spielstände zusammenführen – nichts geht verloren */
function zusammenfuehren(r) {
  if (!r || typeof r !== "object") return;
  const max = k => { S[k] = Math.max(+S[k] || 0, +r[k] || 0); };
  const xpVorher = +S.xp || 0;
  ["xp", "tal", "right", "bestStreak", "bestChain", "chainAT", "chainNT", "chainRueck", "chainGebote", "chainSchoepfung", "bestBlitz", "bestCombo", "questBonusCount", "bestGoalStreak", "bestDayRight", "duSiege", "duSpiele", "duGesendet", "duAngenommen", "lvLohn", "bibRekord", "bibSpiele", "bibMillion"].forEach(max);
  try { talMischen(r); } catch (e) {}
  /* Wochenrunde: die neuere Woche gewinnt; in derselben Woche zählt der höhere Wert (ein Versuch wird nie zurückgesetzt) */
  if ((r.bwK || "") > (S.bwK || "")) { if (S.bwK && S.bwK !== r.bwK) { S.bwVK = S.bwK; S.bwVP = S.bwP | 0; } S.bwK = r.bwK; S.bwP = r.bwP | 0; S.bwFertig = !!r.bwFertig; }
  else if (r.bwK && r.bwK === S.bwK) { S.bwP = Math.max(S.bwP | 0, r.bwP | 0); S.bwFertig = !!(S.bwFertig || r.bwFertig); }
  if ((r.bwVK || "") > (S.bwVK || "") && r.bwVK !== S.bwK) { S.bwVK = r.bwVK; S.bwVP = r.bwVP | 0; }
  S.bwSiege = [...new Set([...(S.bwSiege || []), ...(Array.isArray(r.bwSiege) ? r.bwSiege : [])])].slice(-60);
  S.duArten = [...new Set([...(S.duArten || []), ...(Array.isArray(r.duArten) ? r.duArten : [])])]; S.duKetteVoll = !!(S.duKetteVoll || r.duKetteVoll);
  S.duGes = [...new Set([...(S.duGes || []), ...(Array.isArray(r.duGes) ? r.duGes : [])])].slice(-60);
  ["aufgefrischt", "eingeladen", "fischerDabei", "menschenfischer"].forEach(k => { S[k] = !!(S[k] || r[k]); });
  S.tage = [...new Set([...(S.tage || []), ...(r.tage || [])])].sort((a, b) => a - b).slice(-35);
  S.treueWochen = [...new Set([...(S.treueWochen || []), ...(r.treueWochen || [])])];
  ["bibel", "at", "nt", "rueck"].forEach(k => { S.meister[k] = [...new Set([...((S.meister || {})[k] || []), ...((r.meister || {})[k] || [])])].sort((a, b) => a - b); });
  ["peeked", "gapPerfect", "earlyBird", "podium", "wochensieger", "wochenziel", "appBonus"].forEach(k => { S[k] = !!(S[k] || r[k]); });
  ["badges", "owned", "songHeard"].forEach(k => { S[k] = [...new Set([...(S[k] || []), ...(r[k] || [])])]; }); badgesBereinigen();
  Object.entries(r.stars || {}).forEach(([k, v]) => { S.stars[k] = Math.max(S.stars[k] || 0, v || 0); });
  if (dayNum(r.lastDay) > dayNum(S.lastDay)) { S.lastDay = r.lastDay; S.streak = r.streak; } else if (r.lastDay === S.lastDay) S.streak = Math.max(S.streak, r.streak || 0);
  if (r.xq) S.xq = xqMischen(S.xq, r.xq);
  /* 6.83: Duelle gegen denselben Gegner heute – je Gegner der höhere Zählerstand; gekürzte Duelle vereinigen */
  if (r.duGT && r.duGT.t === today()) { const n = duGleichStand(); Object.entries(r.duGT.n || {}).forEach(([k, v]) => { n[k] = Math.max(n[k] | 0, v | 0); }); }
  if (r.spWdh && r.spWdh.t === today()) { const n = wdhStand(); Object.entries(r.spWdh.n || {}).forEach(([k, v]) => { n[k] = Math.max(n[k] | 0, v | 0); }); }
  if (r.duKurz && typeof r.duKurz === "object") S.duKurz = Object.assign({}, r.duKurz, S.duKurz || {});
  try { xqAbgleich(xpVorher); } catch (e) {}
  if (r.weekKey === S.weekKey) S.weekXp = Math.max(S.weekXp, r.weekXp || 0); else if ((r.weekKey || "") > (S.weekKey || "")) { S.weekKey = r.weekKey; S.weekXp = r.weekXp; }
  if (r.todayDay === S.todayDay) { S.todayXp = Math.max(S.todayXp, r.todayXp || 0); S.todayRight = Math.max(S.todayRight || 0, r.todayRight || 0); }
  if (r.lastGoalDay && dayNum(r.lastGoalDay) > dayNum(S.lastGoalDay)) { S.lastGoalDay = r.lastGoalDay; S.goalStreak = r.goalStreak; }
  if (r.dq && r.dq.day === today() && S.dq && S.dq.day === today()) {
    S.dq.items.forEach((it, k) => { const o = r.dq.items[k]; if (o && o.id === it.id) { it.prog = Math.max(it.prog, o.prog); it.done = it.done || o.done; } }); S.dq.bonus = S.dq.bonus || r.dq.bonus; S.dq.geschafft = S.dq.geschafft || r.dq.geschafft || r.dq.bonus;
  }
  /* Lernverse: je Monat höchste Stufe, bewahrt bleibt bewahrt */
  if (!S.lv) S.lv = {};
  Object.entries(r.lv || {}).forEach(([k, v0]) => { const v = lvMig(v0); if (!v) return; const a = lvMig(S.lv[k]) || { st: 0, b: false };
    const sw = Object.assign({}, v.sw || {}); Object.entries(a.sw || {}).forEach(([i, n]) => { sw[i] = Math.max(sw[i] || 0, n); });
    const neuer = (a.auf || "") >= (v.auf || "") ? a : v;
    S.lv[k] = { v: 2, st: Math.max(a.st || 0, v.st || 0), b: !!(a.b || v.b), tage: [...new Set([...(a.tage || []), ...(v.tage || [])])].sort((x, y) => x - y).slice(-40), sw, auf: neuer.auf || "", an: neuer.an || 0, q: (a.qd || "") >= (v.qd || "") ? a.q || 0 : v.q || 0, qd: [a.qd || "", v.qd || ""].sort().pop() }; });
  ["avatar", "frame", "title", "theme"].forEach(k => { if ((S[k] === DEF[k]) && r[k]) S[k] = r[k]; });
  /* 6.68: Rüstungs-Stufen und Stiftshütten-Spenden: je Schlüssel das Maximum */
  ["ruestStufe", "stift", "spendeXp"].forEach(k => { const a = S[k] = Object.assign({}, S[k] || {}); Object.entries(r[k] || {}).forEach(([i, v]) => { a[i] = Math.max(a[i] | 0, v | 0); }); });
  S.stiftGefeiert = [...new Set([...(S.stiftGefeiert || []), ...(Array.isArray(r.stiftGefeiert) ? r.stiftGefeiert : [])])]; S.stiftEingeweiht = !!(S.stiftEingeweiht || r.stiftEingeweiht);
  try { adventMischen(r); } catch (e) {} /* 7.3: Advent */
  if (r.lbName && !S.lbName) S.lbName = r.lbName;
}
/* Diesem Gerät ein bestehendes Spielerprofil zuordnen (Kopplungscode oder Zusammenführung durch den Verwalter) */
async function profilBeitreten(pid, opts = {}) {
  const L = window.LB;
  /* bisheriger eigener Eintrag (auch aus älteren App-Versionen ohne gespeicherte Kennung = Gerätekennung) */
  const altPid = S.pid ? (eigenePid(S.pid) ? S.pid : "") : (L.uid && !uidAnderweitigBelegt() ? L.uid : "");
  let daten;
  try { daten = await L.join(pid, opts); }
  catch (e) { /* zweiter Versuch (z. B. schwaches Netz) – nicht bei abgelehnter Berechtigung */
    if (String((e && e.code) || "").includes("permission-denied")) throw e;
    await new Promise(r => setTimeout(r, 1500)); daten = await L.join(pid, opts);
  }
  let remote = null; try { remote = await L.loadState(pid); } catch (e) {}
  if (remote) zusammenfuehren(remote);
  else if (daten) { /* noch kein Online-Spielstand: Werte aus der Rangliste übernehmen */
    zusammenfuehren(ausRangliste(daten));
  }
  S.lbName = (daten && daten.name) || S.lbName; S.pid = pid; S.ownersSet = true;
  if (altPid && altPid !== pid && !GERAET.liste.some(p => p.key !== GERAET.aktiv && p.pid === altPid)) { try { await L.remove(altPid); } catch (e) {} }
  applyTheme(); save(); renderHud(); checkBadges(); lbSync(true); cloudSync(true);
}
/* Verständlicher Grund für einen Fehler beim Beitreten (mit Fehlercode zum Nachschauen) */
function fehlerGrund(e) {
  const c = String((e && e.code) || "").replace(/^firestore\//, "");
  const T = {
    "permission-denied": "Der Server hat das Eintragen abgelehnt (keine Berechtigung).",
    "auth/network-request-failed": "Die Anmeldung beim Server war nicht erreichbar – Netz zu schwach oder ein Blocker (z. B. iCloud Privat-Relay, Werbeblocker) verhindert sie.",
    "auth/internal-error": "Die Anmeldung beim Server wurde unterbrochen – evtl. blockiert ein Werbeblocker oder iCloud Privat-Relay sie.",
    "auth/too-many-requests": "Zu viele Versuche – bitte ein paar Minuten warten.",
    "auth/operation-not-allowed": "Die Anmeldung ist auf dem Server abgeschaltet – bitte dem Verwalter Bescheid geben.",
    "auth/web-storage-unsupported": "Der Browser erlaubt keinen Speicher (privater Modus?).",
    "unavailable": "Der Server war nicht erreichbar (kein oder schwaches Netz).",
    "deadline-exceeded": "Zeitüberschreitung – das Netz ist zu langsam.",
    "not-found": "Dieser Spieler-Eintrag wurde nicht gefunden.",
    "unauthenticated": "Dieses Gerät ist nicht beim Server angemeldet."
  };
  if (!navigator.onLine) return { t: "Dieses Gerät ist gerade offline.", c: c || "offline" };
  if (T[c]) return { t: T[c], c };
  if (c.startsWith("auth/")) return { t: "Die Anmeldung beim Server ist fehlgeschlagen.", c };
  return { t: "Unerwarteter Fehler in der App.", c: c || String((e && (e.name + ": " + (e.message || ""))) || "unbekannt").slice(0, 90) };
}
/* Kennung dieses Geräts beim Server (für die Zusammenführung durch den Verwalter) */
const geraetKennung = () => { const L = window.LB; return (L && L.uid) || ""; };
function kennungHtml(id) {
  const k = geraetKennung();
  return `<div class="kennung"><span class="small muted">Gerätekennung</span>${k ? `<button class="btn ghost mini" data-kopier="${id}">Kopieren</button>` : ""}<code id="${id}">${k ? esc(k) : "noch keine – Anmeldung fehlt"}</code></div>`;
}
function kennungKopierenVerdrahten(root) {
  root.querySelectorAll("[data-kopier]").forEach(b => b.onclick = async ev => {
    ev.stopPropagation(); SFX.tap(); const el = $(b.dataset.kopier);
    try { await navigator.clipboard.writeText(el.textContent); b.textContent = "Kopiert ✓"; }
    catch (e) { const r = document.createRange(); r.selectNodeContents(el); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); b.textContent = "Markiert"; }
  });
}
/* Beitreten hat nicht geklappt: Grund, Fehlercode und Gerätekennung zeigen, „Nochmal versuchen“ anbieten */
function beitrittFehler(e, nochmal) {
  try { console.error("Beitreten fehlgeschlagen", e); } catch (x) {}
  const g = fehlerGrund(e);
  const m = modal(`<div class="label">Das hat nicht geklappt</div><h2 style="margin:0">Beitreten fehlgeschlagen</h2>
    <p style="margin:0">${esc(g.t)}</p><p class="small muted" style="margin:0">Fehlercode: <code>${esc(g.c)}</code></p>
    ${kennungHtml("kennFehler")}<p class="small muted" style="margin:0">Klappt es weiterhin nicht, schick Fehlercode und Gerätekennung an den Verwalter – er kann dich dann von Hand verbinden.</p>
    ${nochmal ? `<button class="btn primary" data-close="nochmal">Nochmal versuchen</button>` : ""}<button class="btn ghost" data-close="zu">Schließen</button>`, a => { if (a === "nochmal" && nochmal) nochmal(); });
  kennungKopierenVerdrahten(m);
}
async function lbStart() {
  const L = window.LB; if (!L || !L.ok || !L.uid) return;
  feedbackNachsenden(); entwicklerPruefen();
  if (S.lbName && S.pid && !S.menschenfischer && L.invitees) {
    L.invitees(S.pid).then(rows => {
      rows = rows.filter(r => r.id !== S.pid); let neu = false;
      if (!S.fischerDabei && rows.some(r => (Array.isArray(r.tl) && r.tl.length >= 1) || (r.xp || 0) > 0)) { S.fischerDabei = true; neu = true; }
      if (rows.some(r => treueWocheIn(r.tl))) { S.menschenfischer = true; neu = true; }
      if (neu) { save(); checkBadges(); }
    }).catch(() => {});
  }
  try {
    /* Zusammenführung durch den Verwalter gilt nur für den Spieler, der die Gerätekennung nutzt */
    const ziel = L.getMergeTarget && (S.pid === L.uid || (!S.pid && GERAET.liste.length <= 1)) ? await L.getMergeTarget() : null;
    if (ziel && ziel !== S.pid && !GERAET.liste.some(p => p.key !== GERAET.aktiv && p.pid === ziel)) {
      await profilBeitreten(ziel, { merge: true });
      toast(`${svg("people", accent())}<div><b>Spielstände zusammengeführt</b><div class="small muted">Du spielst jetzt auf allen Geräten als ${esc(S.lbName)}.</div></div>`);
      if (current === "home" || current === "rank" || current === "profil") go(current);
      return;
    }
    if (S.offlineOnly) return;
    /* Wer spielt hier? Ältere App-Versionen haben den Ranglisten-Eintrag unter der Gerätekennung angelegt,
       aber die Kennung nicht im Spielstand gespeichert – dann diesen Eintrag wiedererkennen. */
    const eigenerEintrag = !S.pid && !uidAnderweitigBelegt() && L.holeSpieler ? await L.holeSpieler(L.uid).catch(() => null) : null;
    if (eigenerEintrag && S.lbName) {
      S.pid = L.uid; if (Array.isArray(eigenerEintrag.owners)) S.ownersSet = true;
      zusammenfuehren(ausRangliste(eigenerEintrag)); save(); renderHud(); checkBadges(); lbSync(true); cloudSync(true);
      if (["home", "profil"].includes(current) && !document.querySelector(".modal")) go(current);
      return;
    }
    if (eigenerEintrag && !S.lbName) { wiedererkennen(eigenerEintrag); return; }
    if (S.lbName && !S.pid) { await offlineNamePruefen(); return; }
    if (S.lbName) {
      /* 6.64: Gerät hat eine neue Kennung und steht nicht mehr in der Geräteliste → still neu verbinden (vor dem Laden) */
      if (S.ownersSet && S.pid !== L.uid && L.holeSpieler) { const e0 = await L.holeSpieler(S.pid).catch(() => null);
        if (e0 && !e0.zu && Array.isArray(e0.owners) && !e0.owners.includes(L.uid)) await geraetNeuVerbinden(""); }
      if (S.ownersSet || S.pid !== L.uid) { const r = await L.loadState(S.pid).catch(() => null); if (r) { zusammenfuehren(r); save(); renderHud(); } }
      /* Höhere Werte aus dem eigenen Ranglisten-Eintrag übernehmen (z. B. nach automatischem Zusammenführen) */
      if (L.holeSpieler) { const e = await L.holeSpieler(S.pid).catch(() => null);
        if (e && !e.zu && (e.xp || 0) > S.xp) { zusammenfuehren(ausRangliste(e)); save(); renderHud(); }
        /* Duell-Zahlen aus der Rangliste nie nach unten überschreiben (z. B. vom Verwalter nachgetragen) */
        else if (e && !e.zu && ((e.duS | 0) > (S.duSiege | 0) || (e.duG | 0) > (S.duSpiele | 0))) { S.duSiege = Math.max(S.duSiege | 0, e.duS | 0); S.duSpiele = Math.max(S.duSpiele | 0, e.duG | 0); save(); } }
      lbSync(true); cloudSync();
      /* Duelle im Hintergrund laden: Hinweis auf der Startseite, Zahl im Bereich Spielen */
      duAktualisieren().then(() => {
        const td = $("torDuell"), n = duFuerMich().length; if (td && current === "home") { const pk = td.querySelector(".du-punkt"); if (pk) pk.remove(); if (n) { td.insertAdjacentHTML("beforeend", `<i class="du-punkt">${n}</i>`); td.setAttribute("aria-label", `Arena – ${n} ${n === 1 ? "Herausforderung wartet" : "Herausforderungen warten"}`); } }
        tbDuSetzen();
        if (["spielen", "duelle", "home"].includes(current) && !document.querySelector(".modal") && !duSpiel) go(current);
      });
      bibSiegerPruefen();
      /* 6.68: Stiftshütte – offene Spenden senden, fertige Abschnitte feiern */
      stiftSenden(); stiftLaden().then(() => { if (["home", "rank", "stift"].includes(current)) setTimeout(stiftFeiern, 1500); });
      /* 7.3: Advent – Gaben senden, Stationen feiern, Willkommen */
      bethSenden(); bethLaden().then(() => { if (["home", "advent", "beth"].includes(current)) setTimeout(() => { bethFeiern(); adventStartHinweis(); }, 1500); });
    }
  } catch (e) {}
}
const uidAnderweitigBelegt = () => { const L = window.LB; return GERAET.liste.some(p => p.key !== GERAET.aktiv && p.pid === L.uid); };
/* Werte eines Ranglisten-Eintrags als Spielstand (falls kein Online-Spielstand vorhanden ist) */
function ausRangliste(d) {
  return { weekKey: d.week, weekXp: d.weekXp || 0, xp: d.xp, bestChain: d.bestChain, chainAT: d.chainAT, chainNT: d.chainNT, chainRueck: d.chainRueck, bestBlitz: d.blitz, bestCombo: d.combo, bestStreak: d.bestStreak, badges: d.badgeIds || [], tage: Array.isArray(d.tl) ? d.tl : [], duSiege: d.duS || 0, duSpiele: d.duG || 0, bibRekord: d.bib || 0 };
}
/* Gerät hat schon einen Ranglisten-Eintrag, aber kein Name ist gespeichert: nachfragen */
function wiedererkennen(r) {
  if (document.querySelector(".modal")) return;
  modal(`<div class="label">Willkommen zurück</div>${avatarHtml(r, 64)}<h2>Bist du ${esc(r.name)}?</h2><p class="muted small">Auf diesem Gerät wurde schon als ${esc(r.name)} gespielt (${(r.xp || 0).toLocaleString("de-DE")} XP). Alle Punkte und Abzeichen werden übernommen.</p>
    <button class="btn primary" data-close="ja">Ja, ich bin ${esc(r.name)}</button><button class="btn ghost" data-close="nein">Nein, jemand anderes</button>`, async a => {
    if (a !== "ja") return;
    const versuch = async () => { try { await profilBeitreten(r.id, {}); SFX.win(); rain(70); toast(`${svg("people", accent())}<div><b>Willkommen zurück, ${esc(S.lbName)}!</b><div class="small muted">Dein Fortschritt ist übernommen.</div></div>`); go("home"); }
      catch (e) { SFX.wrong(); beitrittFehler(e, versuch); } };
    versuch();
  });
}
/* Ohne Internet angelegter Name: gibt es ihn schon in der Rangliste? Dann nachfragen. */
let namePruefungLaeuft = false;
async function offlineNamePruefen() {
  const L = window.LB; if (!L || !L.ok || !S.lbName || S.pid || S.offlineOnly) return;
  namePruefungLaeuft = true; let treffer = [];
  try { treffer = L.findeName ? (await L.findeName(S.lbName)).filter(r => !GERAET.liste.some(p => p.key !== GERAET.aktiv && p.pid === r.id)) : []; } catch (e) {}
  namePruefungLaeuft = false;
  if (!treffer.length) { lbSync(true); return; }
  const r = treffer[0];
  modal(`<div class="label">Rangliste</div>${avatarHtml(r, 64)}<h2>Bist du ${esc(r.name)} aus der Rangliste?</h2><p class="muted small">Dort gibt es schon „${esc(r.name)}“ mit ${(r.xp || 0).toLocaleString("de-DE")} XP. Bist du das, wird dein Fortschritt von hier dazugezählt.</p>
    <button class="btn primary" data-close="ja">Ja, das bin ich</button><button class="btn ghost" data-close="nein">Nein, jemand anderes</button>`, async a => {
    if (a === "ja") { try { await profilBeitreten(r.id, {}); toast(`${svg("people", accent())}<div><b>Willkommen zurück, ${esc(S.lbName)}!</b></div>`); go(current); } catch (e) {} return; }
    modal(`<div class="label">Anderer Name</div><h2>Wie sollen dich die anderen sehen?</h2><p class="muted small">Damit man euch unterscheiden kann, z. B. mit Anfangsbuchstaben: „${esc(S.lbName)} K.“</p><input class="field" id="nn" maxlength="20" value="${esc(S.lbName)} "><button class="btn primary" data-close="ok">Speichern</button>`, () => {
      const n = (document.getElementById("nn") ? document.getElementById("nn").value : "").trim().replace(/\s+/g, " ");
      if (n.length >= 2 && n !== S.lbName) { S.lbName = n; S.gemGesendet = ""; } save(); renderHud(); lbSync(true); gemSenden(); go(current);
    });
    setTimeout(() => { const f = document.getElementById("nn"); if (f) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); } }, 50);
  });
}
let letzterAbgleich = 0;
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState !== "visible" || Date.now() - letzterAbgleich < 30000) return;
  letzterAbgleich = Date.now(); const L = window.LB;
  if (L && L.ok && S.lbName && S.pid && S.ownersSet) { try { const r = await L.loadState(S.pid); if (r) { zusammenfuehren(r); save(); renderHud(); if (current === "home") go("home"); } } catch (e) {} }
});
addEventListener("lb-ready", () => {
  lbStart();
  jokerLaden().catch(() => {});  /* 9.11: Willi und Aaron für freigeschaltete Mitglieder */
  setTimeout(() => andereSpielerNachsenden().catch(() => {}), 3000);  /* 6.83 (B) */
  setTimeout(() => xqStartPruefung().catch(() => {}), 6000);  /* 6.85 */
  aufnahmenPruefen();
  setTimeout(() => { try { nachPruefen(); } catch (e) {} }, 1500);
  if (current === "name") { const e = $("bAltSub"); if (e && window.LB && window.LB.ok) e.textContent = "Meinen Namen aus der Rangliste auswählen"; return; }
  if (["rank", "home", "profil"].includes(current) && !document.querySelector(".modal")) go(current);
});

const RANK_TABS = {
  woche: { label: "Woche", val: r => (r.week === weekKey() ? r.weekXp || 0 : 0), unit: "XP", titel: "Wochenrennen" },
  gesamt: { label: "Gesamt", val: r => r.xp || 0, unit: "XP", titel: "Gesamtpunkte" },
  kette: { label: "Kette", unit: "Bücher", titel: "Längste Kette" },
  treue: { label: "Treue", val: r => (Array.isArray(r.tl) ? tage28(r.tl) : aktuell(r) ? r.streak || 0 : 0), unit: "Tage", titel: "Spieltage in 4 Wochen" },
  bewaehrt: { label: "Bewährt", val: r => bewaehrtWert(r), unit: "Siegel", titel: "Frische Siegel" },
  abzeichen: { label: "Abzeichen", val: r => r.badges || 0, unit: "", titel: "Abzeichen-Sammler" },
  blitz: { label: "Blitz", unit: "Richtige", titel: "Blitz-Rekord" },
  duSiege: { label: "Siege", val: r => r.duS || 0, unit: "Siege", titel: "Siege in der Arena" },
  duSpiele: { label: "Gespielt", val: r => r.duG || 0, unit: "Duelle", titel: "Duelle in der Arena" },
  bibSpiele: { label: "Gespielt", val: r => (r.bwK === BIB_GESAMT ? r.p || 0 : 0), unit: "Spiele", titel: "Biblionär-Spiele" },
  bibWoche: { label: "Woche", val: r => (r.bwK === weekKey() ? r.bwP || 0 : 0), unit: "Punkte", titel: "Biblionär der Woche" },
  bibRekord: { label: "Rekord", val: r => r.bib || 0, unit: "Punkte", titel: "Biblionär-Rekord" }
};
/* ---------- 9.7: Gemeinden – Beitritt mit Passwort (= der Ort der Gemeinde). Neue Spieler sind Gast und treten per Passwort bei;
   bisherige Spieler gehören zu „fbg“ (Freie Baptisten Eichstätt). Gemeinden legt nur der Verwalter an (mit Passwort und Logo). ---------- */
const GEM_STANDARD = "fbg";
const GEM_FBG = { id: GEM_STANDARD, name: "Freie Baptisten Eichstätt", logo: "icons/gem-fbg.png", pw: "Eichstätt" };
let GEM = [Object.assign({}, GEM_FBG)], GEM_ZUORD = {}, gemGeladen = false;
const gemInfo = id => GEM.find(g => g.id === id) || null;
const gemName = id => id === "gast" ? "Gäste" : ((gemInfo(id) || {}).name || "Unbekannte Gemeinde");
const meineGem = () => S.gem || GEM_STANDARD;
/* 9.11: Gemeinden mit Freischaltung (pruef): Neue Spieler sind Gast, bis der Verwalter sie freischaltet. Ohne Eintrag gilt "fbg" nur, solange fbg keine Freischaltung hat. */
const gemPruef = id => !!(gemInfo(id) || {}).pruef;
/* 9.30: Solange die Gemeinden nicht geladen sind (und das Laden nicht gescheitert ist), ist die Gemeinde anderer Spieler UNBEKANNT ("?") –
   früher galt dann jeder als Eichstätt (Standard ohne Freischaltung) und bekam das falsche Logo, bis zufällig Profil oder Rangliste geladen hatten. */
let gemFehler = false, gemZeit = 0;
const gemBekannt = () => gemGeladen || gemFehler;
const gemVon = pid => (pid && (pid === S.pid) ? meineGem() : (GEM_ZUORD[pid] || (!gemBekannt() ? "?" : (gemPruef(GEM_STANDARD) ? "gast" : GEM_STANDARD))));
let ANTRAG = null; /* mein Beitrittsantrag: {g, status: "offen" | "abgelehnt"} oder null */
/* Passwort = Ort der Gemeinde: gespeichertes Passwort, sonst das letzte Wort des Namens („… Eichstätt“). Groß-/Kleinschreibung und Umlaute egal. */
const gemPw = g => (g && (g.pw || String(g.name || "").trim().split(/\s+/).pop())) || "";
const pwNorm = t => String(t || "").toLowerCase().replace(/ß/g, "ss").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u").replace(/[^a-z0-9]/g, "");
/* Logo der Gemeinde (Bild) oder – ohne Logo – ein farbiges Kürzel; Gast = Menschen-Symbol */
function gemLogoHtml(g, px = 40) {
  if (!g) return `<span class="gem-logo gem-gast" style="--s:${px}px">${svg("user")}</span>`;
  if (g.logo) return `<span class="gem-logo" style="--s:${px}px"><img src="${esc(g.logo)}" alt="" loading="lazy" decoding="async"></span>`;
  const ini = String(g.name || "?").split(/\s+/).filter(Boolean).slice(0, 3).map(w => w[0]).join("").toUpperCase();
  return `<span class="gem-logo gem-init" style="--s:${px}px;--h:${hash(String(g.name || g.id)) % 360}">${esc(ini)}</span>`;
}
/* lädt Gemeinden + Zuordnungen; true, wenn sich etwas geändert hat. Fehlende Regeln/offline: Standard bleibt */
async function gemLaden(neu) {
  const L = window.LB; if (!L || !L.ok || !L.gemListe) return false;
  if (gemGeladen && !neu && Date.now() - gemZeit < 600000) return false; /* 9.30: nach 10 Minuten neu holen, damit Beitritte/Freischaltungen in langen Sitzungen ankommen */
  try {
    const [g, m] = await Promise.all([L.gemListe(), L.mitgliedListe()]);
    const liste = g.filter(x => x.name).sort((a, b) => (a.ord | 0) - (b.ord | 0) || String(a.name).localeCompare(String(b.name), "de"));
    const f = liste.find(x => x.id === GEM_STANDARD);
    if (f) { f.logo = f.logo || GEM_FBG.logo; f.pw = f.pw || GEM_FBG.pw; } else liste.unshift(Object.assign({}, GEM_FBG));
    const z = {}; m.forEach(x => { if (x.g) z[x.id] = x.g; });
    const alt = JSON.stringify([GEM, GEM_ZUORD, ANTRAG]); GEM = liste; GEM_ZUORD = z; gemGeladen = true; gemFehler = false; gemZeit = Date.now();
    /* 9.11: eigenen Antrag und die Entscheidung des Verwalters holen (Freischaltung gilt vom Server aus) */
    if (S.pid && S.ownersSet && L.antragHolen) {
      try { const a = await L.antragHolen(S.pid); ANTRAG = a ? { g: a.g, status: a.status } : null; } catch (e) {}
      const eig = z[S.pid];
      if (eig && eig !== S.gem && (!S.gemGesendet || S.gemGesendet === S.gem) && (gemInfo(eig) || eig === "gast")) {
        S.gem = eig; S.gemGesendet = eig; S.gemNeu = false; save();
        if (eig === GEM_STANDARD) jokerLaden(true).catch(() => {}); else jokerSperren();
        if (eig !== "gast") toast(`${svg("people")}<div><b>Willkommen bei ${esc(gemName(eig))}!</b><div class="small muted">Der Verwalter hat dich freigeschaltet.</div></div>`);
      }
    }
    return alt !== JSON.stringify([GEM, GEM_ZUORD, ANTRAG]);
  } catch (e) { if (!gemGeladen) gemFehler = true; return false; } /* 9.30: Laden gescheitert → alter Ersatzwert statt dauerhaft leerer Münzen */
}
function gemSenden() {
  const L = window.LB; if (!L || !L.ok || !L.gemSetzen || !S.pid || !S.ownersSet || !S.gem || S.gemGesendet === S.gem) return;
  const g = S.gem; L.gemSetzen(S.pid, S.lbName, g).then(() => { S.gemGesendet = g; GEM_ZUORD[S.pid] = g; save(); }).catch(() => {});
}
function gemNeuZeichnen() { if (["rank", "ich", "profil", "zusammen", "gegner", "shop"].includes(current)) go(current); }
/* Gemeinde eintragen / wechseln: Gemeinde wählen → Passwort (Ort der Gemeinde) */
function gemBeitreten() {
  const m = modal(`<div id="gbBox"></div>`); m.dataset.frei = "1";
  const box = m.querySelector("#gbBox");
  const liste = () => {
    box.dataset.schritt = "liste";
    const eigene = meineGem(), gast = eigene === "gast";
    const opt = GEM.filter(g => g.id !== eigene).map(g => `<button class="gb-opt" data-gb="${esc(g.id)}">${gemLogoHtml(g, 40)}<b>${esc(g.name)}</b><i aria-hidden="true">›</i></button>`).join("");
    box.innerHTML = `<div class="label">Gemeinde</div><h2 style="margin:0">${gast ? "Gemeinde eintragen" : "Gemeinde wechseln"}</h2>
      <p class="muted small" style="margin:0">Wähle deine Gemeinde. Zum Beitreten brauchst du das Passwort – das ist der Ort der Gemeinde.</p>
      <div class="gb-liste">${opt || `<p class="muted small" style="margin:0">Es gibt noch keine weitere Gemeinde.</p>`}</div><button class="btn ghost" id="gbAb">Abbrechen</button>`;
    $("gbAb").onclick = () => { SFX.tap(); m.remove(); };
    box.querySelectorAll("[data-gb]").forEach(b => b.onclick = () => { SFX.tap(); const g = gemInfo(b.dataset.gb); if (g) pw(g); });
  };
  const pw = g => {
    box.dataset.schritt = "pw";
    box.innerHTML = `<div class="gb-kopf">${gemLogoHtml(g, 52)}<div><div class="label">Beitreten</div><b>${esc(g.name)}</b></div></div>
      <div class="gb-pw"><label class="label" for="gbPw">Passwort</label><input class="field" id="gbPw" type="text" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="Ort der Gemeinde" maxlength="30" enterkeyhint="go"><div class="gb-fehler" id="gbFehler" role="alert"></div></div>
      <button class="btn primary" id="gbOk">Beitreten</button><button class="btn ghost" id="gbZurueck">Zurück</button>`;
    const los = () => {
      const w = pwNorm($("gbPw").value);
      if (w && w === pwNorm(gemPw(g)) && g.pruef) {
        /* 9.11: Gemeinde mit Freischaltung – Passwort stimmt, jetzt geht ein Antrag an den Verwalter */
        const L = window.LB;
        if (!L || !L.ok || !L.antragSenden || !S.ownersSet || !S.pid) { SFX.wrong(); $("gbFehler").textContent = "Für den Antrag brauchst du Internet und einen Eintrag in der Rangliste. Versuche es gleich noch einmal."; return; }
        $("gbOk").disabled = true;
        L.antragSenden(S.pid, S.lbName, g.id).then(() => { ANTRAG = { g: g.id, status: "offen" }; m.remove(); SFX.coin(); toast(`${svg("people")}<div><b>Antrag gesendet</b><div class="small muted">Der Verwalter schaltet dich frei, dann gehörst du zu ${esc(g.name)}.</div></div>`); gemNeuZeichnen(); })
          .catch(() => { $("gbOk").disabled = false; SFX.wrong(); $("gbFehler").textContent = "Der Antrag konnte nicht gesendet werden (Firebase-Regeln von 9.11 eingespielt?)."; });
        return;
      }
      if (w && w === pwNorm(gemPw(g))) {
        const fertig = () => {
          if (gemPruef(meineGem()) && !g.pruef) { jokerSperren(); const L = window.LB; if (L && L.ok && L.uid && L.freigabeEntfernen) L.freigabeEntfernen([L.uid]).catch(() => {}); } /* Willi und Aaron gibt es nur für Eichstätt */
          S.gem = g.id; S.gemNeu = false; S.gemGesendet = ""; save(); gemSenden(); GEM_ZUORD[S.pid] = g.id;
          m.remove(); SFX.coin(); toast(`${svg("people")}<div>Willkommen bei ${esc(g.name)}!</div>`); gemNeuZeichnen();
        };
        if (meineGem() !== "gast") gemWarnung(g, fertig); /* 9.13.1: Wechsel aus einer Gemeinde – erst warnen, mit Abbrechen */
        else fertig();
      } else {
        SFX.wrong(); $("gbFehler").textContent = "Das Passwort stimmt nicht. Tipp: Es ist der Ort der Gemeinde.";
        const i = $("gbPw"); i.classList.remove("gb-wackel"); void i.offsetWidth; i.classList.add("gb-wackel"); i.select();
      }
    };
    $("gbOk").onclick = () => { SFX.tap(); los(); };
    $("gbPw").onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); los(); } };
    $("gbZurueck").onclick = () => { SFX.tap(); liste(); };
    setTimeout(() => { const i = $("gbPw"); if (i) i.focus(); }, 60);
  };
  liste();
  gemLaden(true).then(ch => { if (ch && document.body.contains(m) && box.dataset.schritt === "liste") liste(); });
}
/* 9.13.1: Warnung mit den Folgen, bevor jemand eine Gemeinde endgültig verlässt (Verlassen oder Wechsel) – mit Abbrechen */
function gemWarnung(ziel, weiter) {
  const id = meineGem(), g = gemInfo(id), pruef = gemPruef(id), zn = ziel ? ziel.name : "";
  const folgen = [
    ziel ? `Du gehörst dann zu <b>${esc(zn)}</b> und nicht mehr zu <b>${esc(gemName(id))}</b>.` : `Du bist dann <b>Gast</b> und gehörst zu keiner Gemeinde mehr.`,
    `Du zählst nicht mehr für die Wertung von ${esc(gemName(id))} und erscheinst nicht mehr in deren Gemeinde-Rangliste. In der Welt-Rangliste bist du weiter dabei.`,
    ...(pruef ? [`Die <b>Freischaltung</b> durch den Verwalter geht verloren.`,
      `Zum Zurückkommen brauchst du das Passwort <b>und eine neue Freischaltung</b> durch den Verwalter. Das kann dauern.`] : [`Zum Zurückkommen brauchst du wieder das Passwort der Gemeinde.`]),
    `Dein Spielstand bleibt erhalten: XP, Level, Abzeichen, Ketten und Rekorde.`
  ];
  modal(`<div class="gb-kopf">${gemLogoHtml(g, 52)}<div><div class="label" style="color:#ff8a8a">Achtung – bitte lesen</div><b>${ziel ? "Gemeinde wechseln?" : "Gemeinde wirklich verlassen?"}</b></div></div>
    <div class="gw-warn"><ul>${folgen.map(f => `<li>${f}</li>`).join("")}</ul></div>
    <p class="small muted" style="margin:0">Das lässt sich nicht einfach rückgängig machen.</p>
    <button class="btn primary" data-close="">Abbrechen – ich bleibe</button><button class="btn ghost gw-ja" data-close="ja">${ziel ? "Ja, endgültig wechseln" : "Ja, endgültig verlassen"}</button>`,
    r => { if (r === "ja") weiter(); });
}
function gemVerlassen() {
  gemWarnung(null, () => {
    const warPruef = gemPruef(meineGem()); S.gem = "gast"; S.gemNeu = false; S.gemGesendet = ""; save(); gemSenden(); GEM_ZUORD[S.pid] = "gast";
    if (warPruef) { jokerSperren(); const L = window.LB; if (L && L.ok && L.uid && L.freigabeEntfernen) L.freigabeEntfernen([L.uid]).catch(() => {}); }
    toast(`${svg("user")}<div>Du bist jetzt Gast.</div>`); gemNeuZeichnen();
  });
}
/* 9.34: Zeile oben im Profil: „Spieler wechseln“ + Gemeinde (eintragen · wechseln · Antrag) und darunter eine schmale Statuszeile */
function gemKarteHtml() {
  const id = meineGem(), gast = id === "gast", g = gast ? null : gemInfo(id);
  const an = gast && ANTRAG && gemInfo(ANTRAG.g) ? ANTRAG : null; /* 9.11: Antrag an eine Gemeinde mit Freischaltung */
  const hinweis = an ? (an.status === "abgelehnt" ? `Dein Antrag an ${esc(gemName(an.g))} wurde nicht freigegeben.` : `Antrag an ${esc(gemName(an.g))} gesendet – wartet auf die Freischaltung durch den Verwalter.`) : "";
  const rechts = an ? `<button class="pf2-btn pf3-btn" id="antragWeg">${svg("people")}<span>${an.status === "abgelehnt" ? "Neu versuchen" : "Antrag zurückziehen"}</span></button>`
    : `<button class="pf2-btn pf3-btn" id="gemBeitritt">${svg("people")}<span>${gast ? "Gemeinde eintragen" : "Gemeinde wechseln"}</span></button>`;
  return `<div class="pf3-gem" id="pfGem"><div class="pf3-duo"><button class="pf2-btn pf3-btn" id="wechseln">${PF_IC.tausch}<span>Spieler wechseln</span></button>${rechts}</div>
    <div class="pf3-gemzeile">${gemLogoHtml(g, 26)}<span class="pf3-gemtx">Gemeinde: <b>${gast ? "Gast" : esc(gemName(id))}</b></span>${gast ? "" : `<button class="pf2-link" id="gemWeg">verlassen</button>`}</div>${hinweis ? `<div class="small muted pf3-hinw">${hinweis}</div>` : ""}</div>`;
}
/* Logo aus einer Bilddatei: quadratisch skaliert, klein genug für die Datenbank (höchstens ca. 28 000 Zeichen) */
function logoLesen(file) {
  return new Promise((ok, fehler) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      try {
        for (const px of [192, 144, 112, 80, 56]) {
          const c = document.createElement("canvas"); c.width = c.height = px; const x = c.getContext("2d");
          const sc = Math.min(px / img.width, px / img.height), w = img.width * sc, h = img.height * sc; x.drawImage(img, (px - w) / 2, (px - h) / 2, w, h);
          let d = c.toDataURL("image/webp", 0.85); if (!d.startsWith("data:image/webp")) d = c.toDataURL("image/png");
          if (d.length <= 28000) { URL.revokeObjectURL(url); ok(d); return; }
        }
        fehler(new Error("zu groß"));
      } catch (e) { fehler(e); }
    };
    img.onerror = () => fehler(new Error("Bild nicht lesbar")); img.src = url;
  });
}
/* Verwalter: Gemeinden anlegen und bearbeiten (Passwort, Logo), Spieler zuordnen */
VIEWS.gemverwaltung = () => {
  const L = window.LB; if (!entwickler || !L || !L.ok) { go("home"); return; }
  screen.innerHTML = `${backBtn("postfach", "Postkasten")}<h1>Gemeinden</h1><div id="gvBox"><p class="muted">Lade …</p></div>`;
  Promise.all([gemLaden(true), L.alleSpieler().catch(() => [])]).then(([, spieler]) => {
    if (current !== "gemverwaltung") return;
    const zahl = id => spieler.filter(r => gemVon(r.id) === id).length, logos = {};
    const fehler = t => toast(`${svg("nein")}<div>${t}</div>`);
    $("gvBox").innerHTML = `<p class="small muted" style="margin:0 0 8px">Das Passwort zum Beitreten ist der Ort der Gemeinde. Ohne eigenes Passwort gilt das letzte Wort des Namens.</p>
      <div class="stack">${GEM.map(g => `<div class="card gv-karte" data-g="${esc(g.id)}"><div class="gv-kopf">${gemLogoHtml(g, 52)}<div><b>${esc(g.name)}</b><div class="small muted">${zahl(g.id)} Spieler · ${esc(g.id)}</div></div></div>
        <label class="label">Name der Gemeinde</label><input class="du-suche" data-name value="${esc(g.name)}" maxlength="50" autocomplete="off">
        <label class="label">Passwort (Ort)</label><input class="du-suche" data-pw value="${esc(gemPw(g))}" maxlength="30" autocomplete="off">
        <label class="small" style="display:flex;gap:8px;align-items:center;margin:6px 0"><input type="checkbox" data-pruef ${g.pruef ? "checked" : ""} ${g.id === GEM_STANDARD && !g.pruef ? "disabled" : ""}> Neue Mitglieder müssen von mir freigeschaltet werden</label>
        ${g.id === GEM_STANDARD && !g.pruef ? `<button class="btn" data-pruefein>Freischaltung einschalten …</button><p class="small muted" style="margin:4px 0 0">Alle bisherigen Spieler dieser Gemeinde bleiben Mitglied. Danach brauchen nur neue Spieler eine Freischaltung.</p>` : ""}
        <div class="gv-logozeile"><input type="file" accept="image/*" data-logo><span class="small muted">Logo ändern</span></div>
        <div class="row-btns"><button class="btn primary" data-save>Speichern</button>${g.id === GEM_STANDARD || zahl(g.id) ? "" : `<button class="btn ghost" data-weg>Löschen</button>`}</div></div>`).join("")}
        <div class="card"><div class="gv-kopf">${gemLogoHtml(null, 52)}<div><b>Gäste</b><div class="small muted">${zahl("gast")} Spieler</div></div></div></div></div>
      <div class="card gv-karte" style="margin-top:12px"><b>Neue Gemeinde</b><input class="du-suche" id="gvName" placeholder="Name der Gemeinde" maxlength="50" autocomplete="off"><input class="du-suche" id="gvPw" placeholder="Passwort = Ort, z. B. Ditzingen" maxlength="30" autocomplete="off"><div class="gv-logozeile"><input type="file" accept="image/*" id="gvLogo"><span class="small muted">Logo (optional)</span></div><button class="btn primary" id="gvNeu">Gemeinde anlegen</button></div>
      <div class="card stack" style="margin-top:12px"><b>Spieler zuordnen</b><select class="du-suche" id="gvSp">${spieler.slice().sort((a, b) => String(a.name).localeCompare(String(b.name), "de")).map(r => `<option value="${esc(r.id)}">${esc(r.name)} · ${esc(gemName(gemVon(r.id)))}</option>`).join("")}</select>
        <select class="du-suche" id="gvZiel">${GEM.map(g => `<option value="${esc(g.id)}">${esc(g.name)}</option>`).join("")}<option value="gast">Gast</option></select><button class="btn" id="gvZu">Zuordnen</button></div>
      <div class="card stack" style="margin-top:12px"><b>Telefonjoker-Schlüssel</b><p class="small muted" style="margin:0" id="jkStatus">Prüfe …</p>
        <input class="du-suche" id="jkNeu" placeholder="Schlüssel einfügen (aus joker-schluessel.txt)" maxlength="120" autocomplete="off" spellcheck="false"><button class="btn" id="jkSet">Schlüssel speichern</button></div>`;
    L.jokerSchluessel().then(k => { const e = $("jkStatus"); if (e) e.textContent = k ? "Gespeichert – freigeschaltete Mitglieder können Willi und Aaron anrufen." : "Noch kein Schlüssel gespeichert – alle sehen nur den Gastprediger."; }).catch(() => { const e = $("jkStatus"); if (e) e.textContent = "Nicht lesbar (Firebase-Regeln von 9.11 eingespielt?)."; });
    $("jkSet").onclick = () => { const k = $("jkNeu").value.trim(); if (!/^[A-Za-z0-9+/]{43}=$/.test(k)) { fehler("Das sieht nicht wie der Schlüssel aus (44 Zeichen, endet mit =)."); return; }
      L.jokerSchluesselSetzen(k).then(() => { SFX.coin(); $("jkNeu").value = ""; toast(`${svg("check")}<div>Schlüssel gespeichert.</div>`); const e = $("jkStatus"); if (e) e.textContent = "Gespeichert – freigeschaltete Mitglieder können Willi und Aaron anrufen."; }).catch(() => fehler("Das hat nicht geklappt (Firebase-Regeln von 9.11 eingespielt?).")); };
    const eigenesLogo = g => (g.logo && g.logo.startsWith("data:") ? g.logo : "");
    const fehlerText = e => `Das hat nicht geklappt (Firebase-Regeln von Version 9.7 eingespielt?).`;
    const logoWahl = (inp, id) => { inp.onchange = () => { const f = inp.files && inp.files[0]; if (!f) return; logoLesen(f).then(d => { logos[id] = d; toast(`${svg("check")}<div>Logo bereit – bitte speichern.</div>`); }).catch(() => fehler("Das Bild konnte nicht gelesen werden.")); }; };
    screen.querySelectorAll("[data-g]").forEach(k => {
      const id = k.dataset.g, g = gemInfo(id), idx = GEM.findIndex(x => x.id === id);
      logoWahl(k.querySelector("[data-logo]"), id);
      const neuerName = () => k.querySelector("[data-name]").value.trim().replace(/\s+/g, " ");
      k.querySelector("[data-save]").onclick = () => { const pw = k.querySelector("[data-pw]").value.trim(); if (pwNorm(pw).length < 2) { fehler("Bitte ein Passwort (Ort) eingeben."); return; }
        const name = neuerName(); if (name.length < 2 || name.length > 50) { fehler("Der Name braucht 2 bis 50 Zeichen."); return; }
        if (GEM.some(x => x.id !== id && String(x.name).toLowerCase() === name.toLowerCase())) { fehler("Eine andere Gemeinde heißt schon so."); return; }
        L.gemAnlegen(id, name, idx, { pw, logo: logos[id] || eigenesLogo(g), pruef: k.querySelector("[data-pruef]").checked }).then(() => { SFX.coin(); VIEWS.gemverwaltung(); }).catch(() => fehler(fehlerText())); };
      const pe = k.querySelector("[data-pruefein]"); if (pe) pe.onclick = () => { SFX.tap(); freischaltungEinschalten(Object.assign({}, g, { name: neuerName() || g.name }), idx, spieler, k.querySelector("[data-pw]").value.trim()); };
      const w = k.querySelector("[data-weg]"); if (w) w.onclick = () => { SFX.tap(); L.gemLoeschen(id).then(() => VIEWS.gemverwaltung()).catch(() => {}); };
    });
    logoWahl($("gvLogo"), "_neu");
    $("gvNeu").onclick = () => { const n = $("gvName").value.trim(), pw = $("gvPw").value.trim(); const id = n.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
      if (n.length < 2 || id.length < 2) { fehler("Bitte einen Namen eingeben."); return; }
      if (pwNorm(pw).length < 2) { fehler("Bitte ein Passwort (Ort) eingeben."); return; }
      if (GEM.some(g => g.id === id)) { fehler("Diese Gemeinde gibt es schon."); return; }
      L.gemAnlegen(id, n, GEM.length, { pw, logo: logos._neu || "" }).then(() => { SFX.coin(); VIEWS.gemverwaltung(); }).catch(() => fehler(fehlerText())); };
    $("gvZu").onclick = () => { const pid = $("gvSp").value, g = $("gvZiel").value, r = spieler.find(x => x.id === pid); if (!r) return;
      const vorher = gemVon(pid);
      L.gemSetzen(pid, r.name, g, "verwalter").then(() => freigabeAbgleich(pid, g, vorher)).then(() => { SFX.coin(); GEM_ZUORD[pid] = g; if (pid === S.pid) { S.gem = g; save(); } VIEWS.gemverwaltung(); }).catch(() => fehler("Das hat nicht geklappt.")); };
    wireGo();
  });
};
/* 9.11: Freigaben je Gerät – wer Mitglied einer Gemeinde mit Freischaltung ist, bekommt für seine Geräte eine Freigabe (Joker-Schlüssel); wer geht, verliert sie */
async function freigabeAbgleich(pid, g, vorher) {
  const L = window.LB; if (!L || !L.freigabeSetzen) return;
  const sp = L.holeSpieler ? await L.holeSpieler(pid).catch(() => null) : null, owners = (sp && Array.isArray(sp.owners) && sp.owners.length ? sp.owners : [pid]).filter(x => typeof x === "string" && x);
  if (gemPruef(g)) await L.freigabeSetzen(owners, g, pid);
  else if (gemPruef(vorher)) await L.freigabeEntfernen(owners);
}
/* Verwalter: Freischaltung für die Standardgemeinde einschalten – alle bisherigen Spieler bleiben Mitglied (Eintrag + Freigabe), dann gilt pruef */
function freischaltungEinschalten(g, idx, spieler, pw) {
  const L = window.LB; if (!L || !L.ok) return;
  modal(`<div class="label">Freischaltung</div><h2 style="margin:0">Für ${esc(g.name)} einschalten?</h2>
    <p class="muted small" style="margin:0">Alle ${spieler.filter(r => gemVon(r.id) === g.id).length} bisherigen Spieler bleiben Mitglied. Ab dann sind neue Spieler Gast, bis du sie im Postkasten unter „Beitrittsanträge“ freischaltest.</p>
    <button class="btn primary" data-close="ja">Jetzt einschalten</button><button class="btn ghost" data-close>Abbrechen</button>`, async a => {
    if (a !== "ja") return;
    const t = toast(`${svg("people")}<div>Bestand wird übernommen …</div>`);
    try {
      const mit = spieler.filter(r => gemVon(r.id) === g.id);
      /* 9.11.2: Die Gemeinde muss in Firestore existieren, bevor Spieler ihr zugeordnet werden (Regel exists) – zuerst ohne Freischaltung anlegen */
      await L.gemAnlegen(g.id, g.name, idx, { pw: pw || gemPw(g), logo: g.logo && g.logo.startsWith("data:") ? g.logo : "" });
      for (const r of mit) { if (!GEM_ZUORD[r.id]) await L.gemSetzen(r.id, r.name, g.id, "verwalter"); await L.freigabeSetzen((Array.isArray(r.owners) && r.owners.length ? r.owners : [r.id]).filter(x => typeof x === "string" && x), g.id, r.id); GEM_ZUORD[r.id] = g.id; }
      await L.gemAnlegen(g.id, g.name, idx, { pw: pw || gemPw(g), logo: g.logo && g.logo.startsWith("data:") ? g.logo : "", pruef: true });
      SFX.coin(); toast(`${svg("check")}<div><b>Freischaltung ist an.</b><div class="small muted">${mit.length} Spieler übernommen.</div></div>`); gemGeladen = false; VIEWS.gemverwaltung();
    } catch (e) { toast(`${svg("nein")}<div>Das hat nicht geklappt (${esc(String((e && e.code) || (e && e.message) || "Fehler").slice(0, 60))}) – Firebase-Regeln von 9.11 eingespielt?</div>`); }
  });
}
/* 9.11: Beitrittsanträge – der Verwalter schaltet frei oder lehnt ab */
let antragOffen = 0;
/* 9.28: Protokoll der Gemeinde-Zuordnungen (nur Verwalter) – Beitritt, Austritt, Wechsel mit Zeitstempel (Server-Uhr) */
let gemLogFilter = "alle", gemLogSuche = "";
VIEWS.gemprotokoll = () => {
  const L = window.LB; if (!entwickler || !L || !L.ok || !L.gemProtokoll) { go("home"); return; }
  screen.innerHTML = `${backBtn("postfach", "Postkasten")}<h1>Gemeinde-Protokoll</h1><p class="muted small" style="margin:0 0 8px">Zeitpunkt, wann ein Spieler einer Gemeinde beigetreten ist oder sie verlassen hat (Uhrzeit des Servers).</p>
    <input class="du-suche" id="glSuche" placeholder="Name suchen" autocomplete="off" value="${esc(gemLogSuche)}">
    <div class="row-btns" id="glFilter" style="margin:8px 0;flex-wrap:wrap">${[["alle", "Alle"], ["Beitritt", "Beitritte"], ["Austritt", "Austritte"], ["Wechsel", "Wechsel"]].map(([k, t]) => `<button class="btn ghost mini" data-f="${k}" aria-pressed="${gemLogFilter === k}">${t}</button>`).join("")}</div>
    <div id="glBox"><p class="muted">Lade …</p></div>`;
  const art = e => e.nach === "gast" ? (e.von ? "Austritt" : "Gast") : (e.von && e.von !== "gast" ? "Wechsel" : "Beitritt");
  const FARBE = { Beitritt: "#5fe0b0", Austritt: "#ff8a8a", Wechsel: "#ffb54a", Gast: "#b8c0d8" };
  const zeit = z => z ? new Date(z).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "–";
  const nm = id => id ? gemName(id) : "–";
  let liste = [];
  const zeichne = () => {
    screen.querySelectorAll("#glFilter [data-f]").forEach(b => { const an = b.dataset.f === gemLogFilter; b.setAttribute("aria-pressed", String(an)); b.style.borderColor = an ? "#f2c14e" : ""; b.style.color = an ? "#f2c14e" : ""; });
    const q = gemLogSuche.trim().toLowerCase(), z = liste.filter(e => (gemLogFilter === "alle" || art(e) === gemLogFilter) && (!q || String(e.name).toLowerCase().includes(q)));
    $("glBox").innerHTML = z.length ? `<div class="small muted" style="margin-bottom:6px">${z.length} ${z.length === 1 ? "Eintrag" : "Einträge"} · neueste zuerst</div><div class="stack">${z.map(e => { const a = art(e); return `<div class="card" style="padding:10px 12px"><div class="topline"><b>${esc(e.name || "?")}</b><span class="small" style="color:${FARBE[a]};font-weight:700">${a}</span></div><div class="small">${esc(nm(e.von))} › ${esc(nm(e.nach))}</div><div class="small muted">${zeit(e.zeit)}${e.durch === "verwalter" ? " · durch Verwalter" : ""}</div></div>`; }).join("")}</div>` : `<p class="muted">${liste.length ? "Nichts gefunden." : "Noch keine Einträge. Das Protokoll beginnt mit Version 9.28."}</p>`;
  };
  $("glSuche").oninput = e => { gemLogSuche = e.target.value; zeichne(); };
  $("glFilter").querySelectorAll("[data-f]").forEach(b => b.onclick = () => { SFX.tap(); gemLogFilter = b.dataset.f; zeichne(); });
  Promise.all([gemLaden(true), L.gemProtokoll(500)]).then(([, l]) => { if (current !== "gemprotokoll") return; liste = l; zeichne(); })
    .catch(() => { if ($("glBox")) $("glBox").innerHTML = `<p class="muted">Das Protokoll konnte nicht geladen werden (Firebase-Regeln von 9.28 eingespielt?).</p>`; });
  wireGo();
};
VIEWS.antraege = () => {
  const L = window.LB; if (!entwickler || !L || !L.ok || !L.antragListe) { go("home"); return; }
  screen.innerHTML = `${backBtn("postfach", "Postkasten")}<h1>Beitrittsanträge</h1><div id="anBox"><p class="muted">Lade …</p></div>`;
  const fehler = t => toast(`${svg("nein")}<div>${t}</div>`);
  Promise.all([gemLaden(true), L.antragListe()]).then(([, liste]) => {
    if (current !== "antraege") return;
    liste.sort((a, b) => (a.status === "offen" ? 0 : 1) - (b.status === "offen" ? 0 : 1) || b.zeit - a.zeit);
    antragOffen = liste.filter(a => a.status === "offen").length; renderHud();
    $("anBox").innerHTML = liste.length ? `<div class="stack">${liste.map(a => `<div class="card gv-karte" data-an="${esc(a.id)}"><div class="gv-kopf">${gemLogoHtml(gemInfo(a.g), 52)}<div><b>${esc(a.name || "?")}</b><div class="small muted">möchte zu ${esc(gemName(a.g))} · ${a.zeit ? new Date(a.zeit).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}${a.status === "abgelehnt" ? " · abgelehnt" : ""}</div></div></div>
      <div class="row-btns">${a.status === "offen" ? `<button class="btn primary" data-ok>Freischalten</button><button class="btn ghost" data-nein>Ablehnen</button>` : `<button class="btn ghost" data-weg>Löschen</button>`}</div></div>`).join("")}</div>`
      : `<p class="muted">Keine Anträge. 🙂</p>`;
    screen.querySelectorAll("[data-an]").forEach(k => {
      const a = liste.find(x => x.id === k.dataset.an), b = sel => k.querySelector(sel);
      if (b("[data-ok]")) b("[data-ok]").onclick = async () => { SFX.tap(); b("[data-ok]").disabled = true;
        try { await L.gemSetzen(a.pid, a.name, a.g, "verwalter"); await freigabeAbgleich(a.pid, a.g, "gast"); await L.antragLoeschen(a.pid); GEM_ZUORD[a.pid] = a.g; SFX.coin(); VIEWS.antraege(); }
        catch (e) { fehler("Das hat nicht geklappt (Firebase-Regeln von 9.11 eingespielt?)."); b("[data-ok]").disabled = false; } };
      if (b("[data-nein]")) b("[data-nein]").onclick = () => { SFX.tap(); L.antragAblehnen(a.pid).then(() => VIEWS.antraege()).catch(() => fehler("Das hat nicht geklappt.")); };
      if (b("[data-weg]")) b("[data-weg]").onclick = () => { SFX.tap(); L.antragLoeschen(a.pid).then(() => VIEWS.antraege()).catch(() => fehler("Das hat nicht geklappt.")); };
    });
    wireGo();
  }).catch(() => { if ($("anBox")) $("anBox").innerHTML = `<p class="muted">Die Anträge konnten nicht geladen werden (Firebase-Regeln von 9.11 eingespielt?).</p>`; });
};
/* ---------- 9.11: Gespräche – der Verwalter schreibt einzelne Spieler an, der Spieler antwortet direkt, und so weiter ----------
   Sammlung dialoge: pid (Spieler), von ("dev" | "spieler"), text, zeit. Ungelesen wird auf dem Gerät gemerkt:
   S.dlgGesehen = Zeit der letzten gesehenen Nachricht (Spieler), S.dlgDev[pid] = dasselbe je Spieler (Verwalter). */
let DLG = null, DLG_ALLE = [], dlgGezeigt = 0;
const dlgNeuSpieler = () => (DLG || []).filter(m => m.von === "dev" && m.zeit > (S.dlgGesehen || 0)).length;
const dlgNeuDev = () => { const n = {}; DLG_ALLE.forEach(m => { if (m.von === "spieler" && m.zeit > ((S.dlgDev || {})[m.pid] || 0)) n[m.pid] = 1; }); return Object.keys(n).length; };
const dlgZeit = z => z ? new Date(z).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "jetzt";
function dlgBlasen(liste, ichBin) {
  return liste.length ? liste.map(m => `<div class="dlg-b ${m.von === ichBin ? "ich" : "du"}"><div class="dlg-t">${esc(m.text).replace(/\n/g, "<br>")}</div><div class="dlg-z small muted">${m.von === "dev" ? "Entwickler" : esc(m.name || "Spieler")} · ${dlgZeit(m.zeit)}</div></div>`).join("") : `<p class="muted small">Noch keine Nachrichten.</p>`;
}
/* Spieler: Gespräch laden; bei neuer Nachricht vom Entwickler ein Fenster zeigen (nur auf ruhigen Hauptseiten) */
function dlgPruefen() {
  const L = window.LB; if (!S.lbName || !S.pid || !S.ownersSet || !L || !L.ok || !L.dialogHolen || gesperrt) return;
  if (Date.now() - dlgGezeigt < 5 * 60000 && DLG) return; dlgGezeigt = Date.now();
  L.dialogHolen(S.pid).then(l => {
    DLG = l; const n = dlgNeuSpieler(); if (!n) return;
    if (!["home", "lernen", "spielen", "zusammen", "rank"].includes(current) || document.querySelector(".modal") || document.body.classList.contains("spiel-laeuft")) return;
    const letzte = l.filter(m => m.von === "dev").pop();
    modal(`<div class="label">Nachricht vom Entwickler</div><h2 style="margin:0">${n === 1 ? "Neue Nachricht" : n + " neue Nachrichten"}</h2>
      <div class="card" style="margin:0"><p style="margin:0">${esc(letzte.text).replace(/\n/g, "<br>")}</p></div>
      <button class="btn primary" data-close="antwort">Antworten</button><button class="btn ghost" data-close="">Später</button>`, r => { S.dlgGesehen = Math.max(...l.map(m => m.zeit), 0); save(); renderHud(); if (r === "antwort") go("dialog"); });
    SFX.coin && SFX.coin();
  }).catch(() => {});
}
/* Gespräch (Spieler: sein eigenes; Verwalter: mit dem Spieler arg) */
VIEWS.dialog = (arg) => {
  const L = window.LB, dev = entwickler && !!arg, pid = dev ? arg : S.pid;
  if (!L || !L.ok || !pid || !L.dialogHolen) { go("home"); return; }
  const zurueck = dev ? backBtn("dialoge", "Gespräche") : backBtn("home", "Start");
  screen.innerHTML = `${zurueck}<h1 id="dlgKopf">${dev ? "Gespräch" : "Post vom Entwickler"}</h1><div class="stack" id="dlgListe"><p class="muted">Lade …</p></div>
    <div class="card stack dlg-neu"><label class="label" for="dlgText">${dev ? "Antwort an den Spieler" : "Deine Antwort"}</label><textarea class="field" id="dlgText" rows="4" maxlength="1000" placeholder="Nachricht schreiben …"></textarea>
    <div class="small muted" id="dlgZahl">0 / 1000 Zeichen</div><button class="btn primary" id="dlgSend">Senden</button></div>`;
  wireGo(); let name = dev ? "" : S.lbName;
  const zeichne = l => {
    if (current !== "dialog") return; if (dev) { const m = l.find(x => x.von === "spieler"); name = (m && m.name) || (DLG_ALLE.find(x => x.pid === pid) || {}).name || name; if (name && $("dlgKopf")) $("dlgKopf").textContent = name; }
    $("dlgListe").innerHTML = `<div class="dlg-liste">${dlgBlasen(l, dev ? "dev" : "spieler")}</div>`;
    const ende = Math.max(0, ...l.map(m => m.zeit)); if (dev) { S.dlgDev = Object.assign({}, S.dlgDev, { [pid]: ende }); } else { S.dlgGesehen = ende; DLG = l; } save(); renderHud();
    window.scrollTo(0, document.body.scrollHeight);
  };
  const laden = () => L.dialogHolen(pid).then(l => { if (dev) DLG_ALLE = DLG_ALLE.filter(m => m.pid !== pid).concat(l); zeichne(l); }).catch(() => { if ($("dlgListe")) $("dlgListe").innerHTML = `<p class="muted">Das Gespräch konnte nicht geladen werden (Firebase-Regeln von 9.11 eingespielt?).</p>`; });
  if (dev) { const m = DLG_ALLE.find(x => x.pid === pid); name = m ? m.name : ""; }
  laden();
  $("dlgText").oninput = () => { $("dlgZahl").textContent = `${$("dlgText").value.length} / 1000 Zeichen`; };
  $("dlgSend").onclick = () => { const t = $("dlgText").value.trim(); if (!t) { SFX.wrong(); return; } const b = $("dlgSend"); b.disabled = true;
    L.dialogSenden(pid, dev ? name : S.lbName, dev ? "dev" : "spieler", t).then(() => { SFX.coin(); $("dlgText").value = ""; $("dlgZahl").textContent = "0 / 1000 Zeichen"; b.disabled = false; return laden(); })
      .catch(() => { b.disabled = false; toast(`${svg("nein")}<div>Das hat nicht geklappt (Firebase-Regeln von 9.11 eingespielt?).</div>`); }); };
};
/* Verwalter: alle Gespräche + neue Nachricht an einen Spieler */
VIEWS.dialoge = () => {
  const L = window.LB; if (!entwickler || !L || !L.ok || !L.dialogAlle) { go("home"); return; }
  screen.innerHTML = `${backBtn("postfach", "Postkasten")}<h1>Gespräche</h1><div id="dgBox"><p class="muted">Lade …</p></div>`;
  Promise.all([L.dialogAlle(), L.alleSpieler().catch(() => [])]).then(([alle, spieler]) => {
    if (current !== "dialoge") return; DLG_ALLE = alle; renderHud();
    const faden = {}; alle.forEach(m => { (faden[m.pid] = faden[m.pid] || []).push(m); });
    const namen = {}; spieler.forEach(r => { namen[r.id] = r.name; }); alle.forEach(m => { if (m.von === "spieler" && m.name) namen[m.pid] = m.name; });
    const reihe = Object.entries(faden).map(([pid, l]) => ({ pid, l, letzte: l[l.length - 1], neu: l.some(m => m.von === "spieler" && m.zeit > ((S.dlgDev || {})[pid] || 0)) })).sort((a, b) => b.letzte.zeit - a.letzte.zeit);
    $("dgBox").innerHTML = `<div class="card stack"><b>Neue Nachricht</b>
      <select class="du-suche" id="dgSp">${spieler.slice().sort((a, b) => String(a.name).localeCompare(String(b.name), "de")).map(r => `<option value="${esc(r.id)}">${esc(r.name)}</option>`).join("")}</select>
      <textarea class="field" id="dgText" rows="4" maxlength="1000" placeholder="Nachricht an den Spieler …"></textarea><button class="btn primary" id="dgSend">Senden</button></div>
      <h2 style="margin:16px 0 8px">Gespräche</h2>
      ${reihe.length ? `<div class="stack">${reihe.map(r => `<button class="pk-pin" data-dlg="${esc(r.pid)}" data-ampel="${r.neu ? "orange" : "gruen"}"><span class="pk-ampel" aria-hidden="true"></span><span class="pk-pt"><b>${esc(namen[r.pid] || r.pid)}</b><span class="small muted">${r.letzte.von === "dev" ? "Du: " : ""}${esc(r.letzte.text.slice(0, 60))} · ${dlgZeit(r.letzte.zeit)}</span></span><span class="pk-pfeil" aria-hidden="true">›</span></button>`).join("")}</div>` : `<p class="muted small">Noch keine Gespräche.</p>`}`;
    screen.querySelectorAll("[data-dlg]").forEach(b => b.onclick = () => { SFX.tap(); go("dialog", b.dataset.dlg); });
    $("dgSend").onclick = () => { const pid = $("dgSp").value, t = $("dgText").value.trim(); if (!pid || !t) { SFX.wrong(); toast(`${svg("nein")}<div>Bitte Spieler und Text angeben.</div>`); return; } const b = $("dgSend"); b.disabled = true;
      L.dialogSenden(pid, namen[pid] || "", "dev", t).then(() => { SFX.coin(); go("dialog", pid); }).catch(() => { b.disabled = false; toast(`${svg("nein")}<div>Das hat nicht geklappt (Firebase-Regeln von 9.11 eingespielt?).</div>`); }); };
    wireGo();
  }).catch(() => { if ($("dgBox")) $("dgBox").innerHTML = `<p class="muted">Die Gespräche konnten nicht geladen werden (Firebase-Regeln von 9.11 eingespielt?).</p>`; });
};
/* ---------- 9.7: Nachrichten des Entwicklers an die Spieler (Patchnotes, Mitteilungen) – Sammlung „nachrichten“ ----------
   Der Verwalter schreibt im Postkasten („Nachricht an Spieler“), Empfänger: alle, nur Gäste oder eine Gemeinde. Spieler sehen ungelesene Nachrichten
   beim Öffnen der App als Fenster „Neuigkeiten“; danach unter Menü → Neuigkeiten. Gelesen-Liste im Spielstand (S.nachGel). */
let NACH = null, nachGeladen = 0; const nachGezeigt = new Set();
const NACH_TAGE = 30;
const nachSichtbar = n => (n.g === "alle" || !n.g || n.g === meineGem()) && (!S.nachAb || n.zeit >= S.nachAb) && (!n.zeit || Date.now() - n.zeit < NACH_TAGE * 864e5);
const nachUngelesen = () => (NACH || []).filter(n => nachSichtbar(n) && !(S.nachGel || []).includes(n.id));
async function nachLaden(erzwingen) {
  const L = window.LB; if (!L || !L.ok || !L.nachrichtenListe) return NACH;
  if (!erzwingen && NACH && Date.now() - nachGeladen < 10 * 60000) return NACH;
  try { NACH = (await L.nachrichtenListe()).filter(n => n.titel && n.text); nachGeladen = Date.now(); } catch (e) {}
  return NACH;
}
function nachGelesen(liste) { S.nachGel = ((S.nachGel || []).concat(liste.map(n => n.id).filter(id => !(S.nachGel || []).includes(id)))).slice(-60); save(); }
const nachDatum = z => z ? new Date(z).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
const nachKarte = (n, neu) => `<article class="nach-karte"><div class="nk-kopf"><span class="nk-art ${n.art === "patch" ? "" : "info"}">${n.art === "patch" ? "Patchnotes" : "Nachricht"}</span>${n.ver ? `<span>Version ${esc(n.ver)}</span>` : ""}<span>${nachDatum(n.zeit)}</span>${neu ? `<span class="nach-neu">NEU</span>` : ""}</div><h3>${esc(n.titel)}</h3><p>${esc(n.text).replace(/\n/g, "<br>")}</p></article>`;
function nachZeigen(liste) {
  liste.forEach(n => nachGezeigt.add(n.id));
  const neueste = liste.slice().sort((a, b) => b.zeit - a.zeit);
  modal(`<div class="label">Neuigkeiten</div><h2 style="margin:0">${neueste.length === 1 ? "Eine neue Nachricht" : neueste.length + " neue Nachrichten"}</h2><div class="nach-liste">${neueste.map(n => nachKarte(n, false)).join("")}</div><button class="btn primary" data-close="ok">Gelesen</button><button class="btn ghost" data-close="">Später</button>`,
    r => { if (r === "ok") { nachGelesen(liste); renderHud(); } });
  SFX.coin && SFX.coin();
}
/* beim Start und bei jedem Seitenwechsel (höchstens alle 10 Minuten Datenbank-Abfrage) – nur auf ruhigen Hauptseiten */
function nachPruefen() {
  if (!S.lbName || gesperrt || !window.LB || !window.LB.ok) return;
  nachLaden().then(() => {
    if (!["home", "lernen", "spielen", "zusammen", "rank"].includes(current) || document.querySelector(".modal") || document.body.classList.contains("spiel-laeuft")) return;
    const u = nachUngelesen().filter(n => !nachGezeigt.has(n.id)); if (u.length) nachZeigen(u);
  }).catch(() => {});
  dlgPruefen();
}
VIEWS.neuigkeiten = () => {
  screen.innerHTML = `${backBtn("home", "Start")}<h1>Neuigkeiten</h1><div id="nkListe"><p class="muted">Lade …</p></div>`; wireGo();
  nachLaden(true).then(() => { if (current !== "neuigkeiten") return; const l = (NACH || []).filter(nachSichtbar), alt = S.nachGel || [];
    $("nkListe").innerHTML = l.length ? `<div class="nach-liste" style="max-height:none">${l.map(n => nachKarte(n, !alt.includes(n.id))).join("")}</div>` : `<div class="card"><p class="muted" style="margin:0">Keine Nachrichten.</p></div>`;
    nachGelesen(l); renderHud(); });
};
/* Verwalter: Nachricht an die Spieler schreiben */
VIEWS.nachrichten = () => {
  const L = window.LB; if (!entwickler || !L || !L.ok) { go("home"); return; }
  const empf = [["alle", "Alle Spieler"]].concat(GEM.map(g => [g.id, g.name])).concat([["gast", "Nur Gäste"]]);
  screen.innerHTML = `${backBtn("postfach", "Postkasten")}<h1>Nachricht an Spieler</h1>
    <div class="card stack"><div class="rk-var" role="group" aria-label="Art"><button data-art="patch" aria-pressed="true">Patchnotes</button><button data-art="info" aria-pressed="false">Mitteilung</button></div>
      <label class="label" for="nTitel">Titel</label><input class="field" id="nTitel" maxlength="60" value="Neu in Version ${esc(APP_VERSION)}" autocomplete="off">
      <label class="label" for="nText">Text</label><textarea class="field" id="nText" rows="7" maxlength="2000" placeholder="Eine Zeile pro Punkt, z. B.&#10;• Neu: Gemeinde mit Passwort beitreten&#10;• Verbessert: Gemeinde-Wertung"></textarea>
      <label class="label" for="nEmpf">Empfänger</label><select class="du-suche" id="nEmpf">${empf.map(([k, n]) => `<option value="${esc(k)}">${esc(n)}</option>`).join("")}</select>
      <div class="small muted" id="nZahl">0 / 2000 Zeichen</div><button class="btn primary" id="nSend">Senden</button></div>
    <h2 style="margin:16px 0 8px">Gesendet</h2><div class="stack" id="nListe"><p class="muted small">Lade …</p></div>`;
  wireGo(); let art = "patch";
  screen.querySelectorAll("[data-art]").forEach(b => b.onclick = () => { SFX.tap(); art = b.dataset.art; screen.querySelectorAll("[data-art]").forEach(x => x.setAttribute("aria-pressed", x === b));
    const t = $("nTitel"); if (art === "patch" && !t.value.trim()) t.value = "Neu in Version " + APP_VERSION; if (art === "info" && /^Neu in Version/.test(t.value)) t.value = ""; });
  $("nText").oninput = () => { $("nZahl").textContent = `${$("nText").value.length} / 2000 Zeichen`; };
  const liste = () => nachLaden(true).then(() => { if (current !== "nachrichten") return; const l = NACH || [];
    $("nListe").innerHTML = l.length ? l.map(n => `<div class="card stack">${nachKarte(n, false)}<div class="topline"><span class="small muted">An: ${esc(n.g === "alle" ? "Alle Spieler" : n.g === "gast" ? "Nur Gäste" : gemName(n.g))}</span><button class="btn ghost mini" data-del="${esc(n.id)}">Löschen</button></div></div>`).join("") : `<p class="muted small">Noch nichts gesendet.</p>`;
    screen.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { SFX.tap(); L.nachrichtLoeschen(b.dataset.del).then(() => { NACH = null; liste(); }).catch(() => toast(`${svg("nein")}<div>Löschen hat nicht geklappt.</div>`)); }); });
  liste(); gemLaden().then(ch => { if (ch && current === "nachrichten") { const sel = $("nEmpf"), v = sel.value; sel.innerHTML = [["alle", "Alle Spieler"]].concat(GEM.map(g => [g.id, g.name])).concat([["gast", "Nur Gäste"]]).map(([k, n]) => `<option value="${esc(k)}">${esc(n)}</option>`).join(""); sel.value = v; } });
  $("nSend").onclick = () => { const titel = $("nTitel").value.trim(), text = $("nText").value.trim(), g = $("nEmpf").value;
    if (!titel || text.length < 3) { SFX.wrong(); toast(`${svg("nein")}<div>Bitte Titel und Text eingeben.</div>`); return; }
    const b = $("nSend"); b.disabled = true;
    L.nachrichtSenden({ art, titel, text, g, ver: art === "patch" ? APP_VERSION : "" }).then(() => { SFX.coin(); $("nText").value = ""; $("nZahl").textContent = "0 / 2000 Zeichen"; b.disabled = false; toast(`${svg("check")}<div>Nachricht gesendet.</div>`); NACH = null; liste(); })
      .catch(() => { b.disabled = false; toast(`${svg("nein")}<div>Das hat nicht geklappt (Firebase-Regeln von Version 9.7 eingespielt?).</div>`); }); };
};
const rkSchalterHtml = scope => `<nav class="kb-tabs rk-scope" aria-label="Rangliste für" style="grid-template-columns:repeat(${meineGem() === "gast" ? 2 : 3},1fr)">${(meineGem() === "gast" ? [] : [["gemeinde", "Meine Gemeinde", "people"]]).concat([["gemeinden", "Gemeinden", "crown"], ["welt", "Welt", "star"]]).map(([k, t, ic]) => `<button data-scope="${k}" aria-pressed="${k === scope}" aria-selected="${k === scope}">${svg(ic)}<span>${t}</span></button>`).join("")}</nav>`;
const rankScope = () => { const g = meineGem() === "gast"; const sc = S.rankScope || (g ? "welt" : "gemeinde"); return g && sc === "gemeinde" ? "welt" : sc; };
/* Gemeinde-Wertung: Gesamtsumme aller XP je Gemeinde – mit Logo, Platz-Marke und vollem (umbrechendem) Namen */
function gemeindenWertungHtml(spieler) {
  const sum = {}, anz = {}; GEM.forEach(g => { sum[g.id] = 0; anz[g.id] = 0; });
  spieler.forEach(r => { const g = gemVon(r.id); if (g === "gast" || !(g in sum)) return; sum[g] += r.xp | 0; anz[g]++; });
  const zeilen = GEM.map(g => ({ g, s: sum[g.id], n: anz[g.id] })).sort((a, b) => b.s - a.s || a.g.name.localeCompare(b.g.name, "de")), top = Math.max(1, zeilen[0] ? zeilen[0].s : 1);
  let platz = 0, vor = null;
  return `<div class="gw-liste">${zeilen.map((z, i) => { if (vor === null || z.s !== vor) platz = i + 1; vor = z.s; const ich = z.g.id === meineGem(), avg = z.n ? Math.round(z.s / z.n) : 0;
    return `<div class="gw-zeile${platz <= 3 && z.s > 0 ? " p" + platz : ""}${ich ? " me" : ""}" title="${esc(z.g.name)}"><div class="gw-logo">${gemLogoHtml(z.g, 52)}<i class="gw-pl">${platz}</i></div><div class="gw-tx"><b${z.g.name.length > 30 ? ' class="lang"' : ""}>${esc(z.g.name)}</b><span class="small muted"><span class="gw-n">${z.n} Spieler</span>${z.n ? ` <span class="gw-n">· Ø ${pkt(avg)} XP</span>` : ""}</span>${ich ? '<span class="you">Deine Gemeinde</span>' : ""}</div><div class="gw-sum"><b>${pkt(z.s)}</b><small>XP gesamt</small></div><i class="gw-balken"><i style="width:${Math.round(z.s / top * 100)}%"></i></i></div>`; }).join("")}</div>`;
}
/* Vier Kategorien; Unterteilungen erscheinen als kleiner Umschalter im Listenkopf */
const RANK_KAT = [
  { id: "erfahrung", name: "Erfahrung", icon: "star", tabs: ["woche", "gesamt"] },
  { id: "kette", name: "Kette", icon: "link", tabs: ["kette"] },
  { id: "blitz", name: "Blitz", icon: "bolt", tabs: ["blitz"] },
  { id: "biblionaer", name: "Biblionär", icon: "biblionaer", tabs: ["bibSpiele", "bibWoche", "bibRekord"] },
  { id: "duell", name: "Arena", icon: "duell", tabs: ["duSiege", "duSpiele"] },
  { id: "ausdauer", name: "Ausdauer", icon: "fire", tabs: ["treue", "bewaehrt", "abzeichen"] }
];
const katVon = tab => RANK_KAT.find(k => k.tabs.includes(tab)) || RANK_KAT[0];
const letzterTab = {};
const TAB_LABEL = { woche: "Woche", gesamt: "Gesamt", kette: "Kette", blitz: "Blitz", treue: "Spieltage", bewaehrt: "Bewährt", abzeichen: "Abzeichen", duSiege: "Siege", duSpiele: "Gespielt", bibSpiele: "Gespielt", bibWoche: "Diese Woche", bibRekord: "Rekord" };
const BLITZ_SUB = { richtige: ["Richtige", "blitz", "Richtige", "Blitz-Rekord"], folge: ["In Folge", "combo", "in Folge", "Richtige in Folge (60 Sek.)"] };
let blitzSub = "richtige";
const KETTE_SUB = { bibel: ["Bibel", "bestChain", 66], at: ["AT", "chainAT", 39], nt: ["NT", "chainNT", 27], rueck: ["Rückwärts", "chainRueck", 66] };
let rankTab = "woche", ketteSub = "bibel";
function aktuell(r) { const t = r.updated && (r.updated.toMillis ? r.updated.toMillis() : Date.parse(r.updated)); return !t || Date.now() - t < 2 * 864e5; }
function rankWert(r) {
  if (rankTab === "kette") { const k = r[KETTE_SUB[ketteSub][1]] || 0; return k ? k + 1 : 0; }
  if (rankTab === "blitz") return r[BLITZ_SUB[blitzSub][1]] || 0;
  return RANK_TABS[rankTab].val(r);
}
const BIB_GESAMT = "gesamt"; /* Woche-Schlüssel für die Gesamtzahl der Biblionär-Spiele in der Sammlung biblionaer */
const istBibTab = t => t === "bibSpiele" || t === "bibWoche" || t === "bibRekord";
function rankKind() { if (rankTab === "bibSpiele") return "bibWoche"; return rankTab === "kette" ? "kette_" + ketteSub : rankTab === "blitz" ? (blitzSub === "folge" ? "combo" : "blitz") : rankTab; }
VIEWS.rank = (tab) => {
  if (tab && RANK_TABS[tab]) rankTab = tab;
  const L = window.LB;
  /* 6.58: Kopf im Arena-Stil – Ring = eigener Platz in der gewählten Liste, Tafel Level/Abzeichen/Spieler (nach dem Laden nachgetragen) */
  let html = bereichKopf("gemeinde", { ic: "trophy", t: "Rangliste", sub: meineGem() === "gast" ? "Alle Spieler" : gemName(meineGem()), ring: ["–", "Platz"], ringId: "bkPlatz",
    tafel: [[levelOf(S.xp), "Level"], [`${S.badges.length}`, "Abzeichen"], ["–", "Spieler", "bkSpieler"]] }) + `<div id="shMiniBox">${stiftMiniHtml() || adventMiniHtml()}</div>` + bkLabel("trophy", "Ranglisten");
  stiftLaden().then(() => { const b = $("shMiniBox"); if (b && current === "rank") { b.innerHTML = stiftMiniHtml() || adventMiniHtml(); wireGo(); } });
  if (!L) { screen.innerHTML = html + `<div class="card"><p class="muted" style="margin:0">Rangliste wird geladen …</p></div>`; wireGo(); return; }
  if (!L.configured) { screen.innerHTML = html + `<div class="card stack"><b>Noch nicht eingerichtet</b><p class="muted small" style="margin:0">Die Rangliste braucht einen gemeinsamen Online-Speicher. Bis dahin kannst du ganz normal spielen – dein Fortschritt wird später übernommen.</p></div>`; wireGo(); return; }
  if (!L.ok) { screen.innerHTML = html + `<div class="card stack"><b>Keine Verbindung</b><p class="muted small" style="margin:0">Für die Rangliste brauchst du Internet. Deine Punkte werden übertragen, sobald du wieder online bist.</p><button class="btn" id="retry">Neu laden</button></div>`; wireGo(); $("retry").onclick = () => location.reload(); return; }
  if (S.offlineOnly) { screen.innerHTML = html + `<div class="card stack"><b>Du bist nicht in der Rangliste</b><p class="muted small" style="margin:0">Du spielst als ${esc(S.lbName)} nur auf diesem Gerät. Du kannst jederzeit wieder beitreten – dein Fortschritt wird übernommen.</p><button class="btn primary" id="wieder">Wieder beitreten</button></div>`; wireGo();
    $("wieder").onclick = () => { SFX.coin(); S.offlineOnly = false; save(); lbStart().then(() => go("rank")); }; return; }
  if (!S.pid && !S.ownersSet) { lbStart(); }
  const scope = rankScope();
  gemLaden().then(ch => { if (ch && current === "rank") go("rank", rankTab); });
  if (scope === "gemeinden") {
    screen.innerHTML = html + `<div class="stack rk">${rkSchalterHtml(scope)}<div class="card rk-liste"><div class="rk-kopf"><div><b>Gemeinde-Wertung</b><span class="small muted">Alle XP der Spieler zusammen</span></div></div><div id="rbody"><p class="muted" style="margin:0">Lade …</p></div></div></div>`;
    wireGo(); screen.querySelectorAll("[data-scope]").forEach(b => b.onclick = () => { SFX.tap(); S.rankScope = b.dataset.scope; save(); go("rank", rankTab); });
    gemLaden(true).then(() => L.alleSpieler()).then(sp => { if (current === "rank" && $("rbody")) $("rbody").innerHTML = gemeindenWertungHtml(sp); }).catch(() => { if ($("rbody")) $("rbody").innerHTML = `<p class="muted" style="margin:0">Die Wertung konnte nicht geladen werden.</p>`; });
    return;
  }
  const T = RANK_TABS[rankTab];
  const kat = katVon(rankTab); letzterTab[kat.id] = rankTab;
  const varianten = kat.tabs.length > 1 ? kat.tabs.map(k => `<button data-tab="${k}" aria-pressed="${k === rankTab}">${TAB_LABEL[k]}</button>`).join("")
    : rankTab === "kette" ? Object.entries(KETTE_SUB).map(([k, v]) => `<button data-sub="${k}" aria-pressed="${k === ketteSub}">${v[0]}</button>`).join("")
    : rankTab === "blitz" ? Object.entries(BLITZ_SUB).map(([k, v]) => `<button data-bsub="${k}" aria-pressed="${k === blitzSub}">${v[0]}</button>`).join("") : "";
  const titel = rankTab === "kette" ? T.titel : rankTab === "blitz" ? "Blitz-Rekord" : T.titel;
  screen.innerHTML = html + `<div class="stack rk">
    ${rkSchalterHtml(scope)}
    <nav class="kb-tabs rk-nav" aria-label="Ranglisten" style="grid-template-columns:repeat(${RANK_KAT.length},1fr)">${RANK_KAT.map(k => `<button data-kat="${k.id}" aria-pressed="${k.id === kat.id}" aria-selected="${k.id === kat.id}">${svg(k.icon)}<span>${k.name}</span></button>`).join("")}</nav>
    <div class="card rk-liste">
      <div class="rk-kopf ${istBibTab(rankTab) ? "rk-bib" : ""}"><div><b>${esc(titel)}</b><span class="small muted" id="rcount">${rankTab === "woche" || rankTab === "bibWoche" ? weekKey().split("-W")[1] + ". Kalenderwoche" : istBibTab(rankTab) ? "Gemeinde" : ""}</span></div>${varianten ? `<div class="rk-var" role="group" aria-label="Variante">${varianten}</div>` : ""}</div>
      ${istBibTab(rankTab) ? `<div id="bwBox">${bibInfoLeiste()}</div>` : ""}
      <div id="rbody"><p class="muted" style="margin:0">Lade Rangliste …</p></div>
    </div>
    <div class="du-bar" id="rme"></div>
  </div>`;
  wireGo();
  screen.querySelectorAll("[data-scope]").forEach(b => b.onclick = () => { SFX.tap(); S.rankScope = b.dataset.scope; save(); go("rank", rankTab); });
  screen.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { SFX.tap(); go("rank", b.dataset.tab); });
  screen.querySelectorAll("[data-kat]").forEach(b => b.onclick = () => { SFX.tap(); const k = RANK_KAT.find(x => x.id === b.dataset.kat); go("rank", letzterTab[k.id] || k.tabs[0]); });
  screen.querySelectorAll("[data-sub]").forEach(b => b.onclick = () => { SFX.tap(); ketteSub = b.dataset.sub; go("rank", "kette"); });
  screen.querySelectorAll("[data-bsub]").forEach(b => b.onclick = () => { SFX.tap(); blitzSub = b.dataset.bsub; go("rank", "blitz"); });
  const bwVerdrahten = () => { const b = $("bwLos"); if (b) b.onclick = () => { SFX.tap(); bibWocheStarten(); }; };
  if (rankTab === "bibWoche") { bwVerdrahten(); bibSiegerPruefen().then(() => (bibVorwocheListe ? bibVorwocheListe : bibVorwocheLaden())).then(() => { const box = $("bwBox"); if (box && current === "rank" && rankTab === "bibWoche") { box.innerHTML = bibInfoLeiste(); bwVerdrahten(); } }); }
  const me = S.pid || L.uid; const wk = weekKey(); let zeilen = [];
  lbUnsub.push(L.watch(rankKind(), rankTab === "bibSpiele" ? BIB_GESAMT : wk, rows => {
    if (current !== "rank") return;
    rows = rows.filter(r => (scope !== "gemeinde" || gemVon(r.id) === meineGem()) && (rankWert(r) > 0 || r.id === me)).sort((a, b) => rankWert(b) - rankWert(a) || String(a.name).localeCompare(String(b.name)));
    zeilen = rows;
    const myIdx = rows.findIndex(r => r.id === me);
    /* Gleichstand: gleicher Wert = gleicher Platz; Plätze ohne Lücke (1, 1, 1, 2, 3 …) */
    const platz = []; rows.forEach((r, i) => { platz[i] = i && rankWert(r) === rankWert(rows[i - 1]) ? platz[i - 1] : (i ? platz[i - 1] + 1 : 1); });
    const meinPlatz = myIdx > -1 ? platz[myIdx] : 0;
    if (rankTab === "woche" && myIdx > -1 && rankWert(rows[myIdx]) > 0) {
      if (meinPlatz <= 3 && rows.length >= 3 && !S.podium) { S.podium = true; save(); checkBadges(); }
      if (meinPlatz === 1 && rows.length >= 5 && !S.wochensieger) { S.wochensieger = true; save(); checkBadges(); }
    }
    const unit = rankTab === "kette" ? "Bücher" : rankTab === "blitz" ? BLITZ_SUB[blitzSub][2] : T.unit;
    const body = $("rbody");
    if (!rows.length) body.innerHTML = `<p class="muted" style="margin:0">${rankTab === "woche" ? "Diese Woche hat noch niemand gespielt. Hol dir den ersten Platz!" : "Noch keine Einträge."}</p>`;
    else {
      const gruppe = n => rows.filter((_, i) => platz[i] === n);
      const g1 = gruppe(1), g2 = gruppe(2), g3 = gruppe(3), wert1 = rankWert(g1[0]);
      const voll = rankTab === "kette" && wert1 >= KETTE_SUB[ketteSub][2];
      const vollText = { bibel: "Alle 66 Bücher geschafft!", at: "Das ganze Alte Testament geschafft!", nt: "Das ganze Neue Testament geschafft!", rueck: "Alle 66 Bücher rückwärts geschafft!" }[ketteSub];
      /* Waffenrüstung (bzw. Siegel bei „Bewährt“) auch auf dem Podest */
      const ext = r => rankTab === "bewaehrt" ? siegelReihe(r) : ruestungHtml(r.armor);
      const person = (r, sz) => `<button class="gk-p ${r.id === me ? "me" : ""}" data-pid="${esc(r.id)}">${avatarLv(r, sz)}<b>${esc(r.name)}</b>${ext(r)}</button>`;
      const gold = `<div class="gk-gold"><span class="pod-krone">${svg("crown")}</span>
        <div class="gk-t">${voll ? vollText : `Platz 1 · ${pkt(wert1)} ${esc(unit)}`}${g1.length > 1 ? `<small>${g1.length} Spieler teilen sich Platz 1</small>` : voll ? `<small>${wert1} ${esc(unit)}</small>` : ""}</div>
        <div class="gk-leute">${g1.map(r => person(r, g1.length > 4 ? 44 : 50)).join("")}</div></div>`;
      const klein = (n, g) => g.length ? `<div class="gk-k gk-k${n} gk-licht"><div class="gk-h"><span class="gk-med">${n}</span><span>${pkt(rankWert(g[0]))} ${esc(unit)}</span></div>
        <div class="gk-stapel">${g.slice(0, 5).map(r => `<button data-pid="${esc(r.id)}" class="${r.id === me ? "me" : ""}">${avatarLv(r, 36)}</button>`).join("")}${g.length > 5 ? `<span class="gk-mehr">+${g.length - 5}</span>` : ""}</div>
        <div class="gk-wer">${g.slice(0, 3).map(r => `<div class="${r.id === me ? "me" : ""}"><b>${esc(r.name)}</b>${ext(r)}</div>`).join("")}${g.length > 3 ? `<div class="small muted">+${g.length - 3} weitere</div>` : ""}</div></div>` : "";
      const pod = `<div class="gk">${gold}${g2.length ? `<div class="gk-zd">${klein(2, g2)}${klein(3, g3)}</div>` : ""}</div>`;
      const rest = rows.map((r, i) => [r, platz[i]]).filter(([, p]) => p > 3).slice(0, 80).map(([r, p], k, arr) => `<button class="rrow ${r.id === me ? "me" : ""}" data-pid="${esc(r.id)}"><div class="rk">${k && arr[k - 1][1] === p ? "" : p}</div>${avatarLv(r, 38)}<div class="who"><b>${esc(r.name)}${r.id === me ? '<span class="you">DU</span>' : ""}</b><span>${esc(rangVon(r))}</span>${rankTab === "bewaehrt" ? siegelReihe(r) : ruestungHtml(r.armor)}</div><div class="val">${pkt(rankWert(r))}</div></button>`).join("");
      if ($("rcount")) $("rcount").textContent = (rankTab === "woche" || rankTab === "bibWoche" ? wk.split("-W")[1] + ". KW · " : istBibTab(rankTab) ? "Gemeinde · " : "") + rows.length + " Spieler";
      body.innerHTML = `${pod}${rest ? `<div class="rlist">${rest}</div>` : ""}`;
      body.querySelectorAll("[data-pid]").forEach(b => b.onclick = () => { SFX.tap(); const r = rows.find(x => x.id === b.dataset.pid);
        /* Wochenrunde: Zeilen kommen aus der eigenen Sammlung – für den Vergleich den vollen Eintrag holen */
        if ((rankTab === "bibWoche" || rankTab === "bibSpiele") && L.holeSpieler) L.holeSpieler(r.id).then(v => profilVergleich(v || r)).catch(() => profilVergleich(r)); else profilVergleich(r); });
    }
    const mv = myIdx > -1 ? rankWert(rows[myIdx]) : 0;
    const vor = myIdx > -1 && meinPlatz > 1 ? rows.filter((_, i) => platz[i] === meinPlatz - 1) : [];
    const ahead = vor.length ? rankWert(vor[0]) - mv : 0;
    const ich = myIdx > -1 ? rows[myIdx] : { id: S.pid, name: S.lbName, avatar: S.avatar, frame: S.frame, level: levelOf(S.xp) };
    if ($("bkPlatz")) $("bkPlatz").textContent = meinPlatz || "–";
    if ($("bkSpieler")) $("bkSpieler").textContent = rows.length;
    $("rme").innerHTML = `${avatarLv(ich, 36)}<div class="du-tx"><b>Platz ${meinPlatz || "–"} · ${pkt(mv)} ${esc(unit || "")}</b><span>${vor.length ? `Noch ${pkt(ahead + 1)} bis Platz ${meinPlatz - 1} (${esc(vor[0].name)}${vor.length > 1 ? " u. a." : ""})` : meinPlatz === 1 ? "Du bist an der Spitze!" : rankTab === "bibWoche" ? (bibWocheGespielt() ? "Deine Runde ist gespielt" : "Spiel die Wochenrunde für deinen Platz") : "Spiel eine Runde für deinen Platz"}</span></div>${meinPlatz === 1 ? `<span class="du-krone">${svg("crown")}</span>` : ""}`;
  }, () => { if ($("rbody")) $("rbody").innerHTML = `<p class="muted" style="margin:0">Rangliste konnte nicht geladen werden. Prüfe die Internetverbindung.</p>`; }));
};
/* Name wählen (Pflicht): neuer Spieler oder bestehenden Spieler aus der Rangliste */
VIEWS.name = (modus) => {
  const andere = GERAET.liste.filter(p => p.key !== GERAET.aktiv && p.name);
  const kopf = `<div class="church lg"><img src="logo.png" alt="Logo der Freien Baptisten Eichstätt" onerror="this.remove()"><div><h1 style="margin:0">Willkommen!</h1><span>Freie Baptisten Eichstätt</span></div></div>
    ${andere.length ? `<button class="back" id="nZurWer">← Andere Spieler auf diesem Gerät</button>` : ""}`;
  beitrittAnzeigen(kopf, modus || "");
  if ($("nZurWer")) $("nZurWer").onclick = () => { SFX.tap(); verwerfenUndWaehlen(); };
};
/* leerer, gerade angelegter Spieler ohne Namen: verwerfen und zur Auswahl */
function verwerfenUndWaehlen() {
  if (!S.lbName && S.xp === 0) { try { if (GERAET.aktiv !== "haupt") localStorage.removeItem(LS); } catch (e) {} GERAET.liste = GERAET.liste.filter(p => p.key !== GERAET.aktiv); }
  const z = GERAET.liste.find(p => p.key !== GERAET.aktiv && p.name); if (z) { const weg = !S.lbName && S.xp === 0 ? GERAET.aktiv : null; gesperrt = true;
    geraetSchreiben(g => { if (weg) g.liste = g.liste.filter(p => p.key !== weg); g.aktiv = z.key; }); try { sessionStorage.setItem("bq-aktiv", z.key); sessionStorage.removeItem("bq-gewaehlt"); } catch (e) {} location.reload(); }
}
function beitrittAnzeigen(html, modus = "") {
  let L = window.LB; const online = !!(L && L.ok); const jetztOnline = () => { L = window.LB; return !!(L && L.ok); };
  const fertig = () => { if (current === "rank") go("rank"); else go("home"); };
  if (!modus) {
    screen.innerHTML = html + `<div class="card stack">
      <p class="muted" style="margin:0">${S.xp > 0 ? `Damit dein Fortschritt (${Math.round(S.xp)} XP) einen Namen bekommt:` : "Wer spielt? Jeder Spieler braucht einen Namen – damit sieht dich auch die Gemeinde in der Rangliste."}</p>
      <button class="bereich klein" id="bNeu"><span class="b-ic">${svg("user")}</span><span class="b-tx"><b>Ich bin neu</b><span>Einen Spitznamen wählen</span></span></button>
      <button class="bereich klein" id="bAlt"><span class="b-ic">${svg("people")}</span><span class="b-tx"><b>Ich spiele schon mit</b><span id="bAltSub">${online ? "Meinen Namen aus der Rangliste auswählen" : "Braucht Internet"}</span></span></button></div>`;
    wireGo();
    $("bNeu").onclick = () => { SFX.tap(); beitrittAnzeigen(html, "neu"); };
    $("bAlt").onclick = () => { SFX.tap(); if (!jetztOnline()) { toast(`<div><b>Keine Verbindung</b><div class="small muted">Um deinen Namen aus der Rangliste zu wählen, brauchst du Internet. Du kannst auch „Ich bin neu“ wählen – sobald Internet da ist, fragt die App, ob du schon mitspielst.</div></div>`); return; } beitrittAnzeigen(html, "alt"); };
    return;
  }
  if (modus === "neu") {
    screen.innerHTML = html + `<div class="card stack">
      <button class="back" id="bZur">← Zurück</button>
      <label class="label" for="lbName">Dein Spitzname</label>
      <input class="field" id="lbName" maxlength="20" autocomplete="nickname" placeholder="z. B. Micha aus Eichstätt">
      <p class="small muted" style="margin:0">Alle in der Rangliste sehen diesen Namen. Ein Spitzname reicht – bei Kindern bitte keinen vollen Namen.${online ? "" : " Gerade ist kein Internet da: Du kannst trotzdem losspielen und erscheinst später in der Rangliste."}</p>
      <div class="small" id="lbErr" aria-live="polite"></div>
      <button class="btn primary" id="join">Los geht's (+10 Talente)</button></div>`;
    wireGo(); $("bZur").onclick = () => beitrittAnzeigen(html);
    setTimeout(() => { try { $("lbName").focus(); } catch (e) {} }, 50);
    let warnungGezeigt = "";
    const fehler = (t, farbe = "var(--bad)") => { $("lbErr").style.color = farbe; $("lbErr").innerHTML = t; };
    $("join").onclick = async () => {
      const n = $("lbName").value.trim().replace(/\s+/g, " ");
      if (n.length < 2) { fehler("Bitte mindestens 2 Zeichen eingeben."); SFX.wrong(); return; }
      if (GERAET.liste.some(p => p.key !== GERAET.aktiv && String(p.name).toLowerCase() === n.toLowerCase())) { fehler(`„${esc(n)}“ spielt schon auf diesem Gerät. Tippe oben auf „Andere Spieler“, um zu wechseln.`); SFX.wrong(); return; }
      if (jetztOnline() && warnungGezeigt !== n && L.nameTaken) {
        let belegt = false; try { belegt = await L.nameTaken(n); } catch (e) {}
        if (belegt) { warnungGezeigt = n; fehler(`<b>„${esc(n)}“ gibt es schon.</b> Bist du das? Dann geh zurück und wähle „Ich spiele schon mit“. Sonst nimm einen unterscheidbaren Namen (z. B. mit Anfangsbuchstaben) oder tippe nochmal.`, "var(--fg)"); return; }
      }
      $("join").disabled = true; $("join").textContent = "Einen Moment …";
      S.lbName = n; S.offlineOnly = false;
      if (jetztOnline()) {
        try { await L.signIn(); S.pid = neuePid(); await L.push(S.pid, lbPayload(), { owners: [L.uid], neu: true }); S.ownersSet = true; }
        catch (e) { S.pid = ""; S.ownersSet = false; /* klappt später automatisch */ }
      }
      save(); addTal(10); rain(60); SFX.win(); checkBadges(); renderHud(); cloudSync(true);
      toast(`${svg("user", accent())}<div><b>Hallo ${esc(n)}!</b><div class="small muted">${S.ownersSet ? "Du bist jetzt in der Gemeinde-Rangliste." : "Du erscheinst in der Rangliste, sobald Internet da ist."}</div></div>`);
      fertig();
    };
    return;
  }
  /* bestehender Spieler */
  screen.innerHTML = html + `<div class="card stack"><button class="back" id="bZur">← Zurück</button>
    <b>Wer bist du?</b><p class="small muted" style="margin:0">Tippe deinen Namen an. Dein Fortschritt von diesem Gerät wird übernommen – es geht nichts verloren.</p>
    <input class="field" id="suche" placeholder="Name suchen …" aria-label="Name suchen"><div class="stack" id="nliste"><p class="muted small">Lade Spieler …</p></div></div>`;
  wireGo(); $("bZur").onclick = () => beitrittAnzeigen(html);
  let alle = []; const hier = current;
  const zeichne = () => {
    const q = $("suche").value.trim().toLowerCase();
    /* Das Verwalter-Profil kann man nicht per Auswahl übernehmen (nur über den Verwalter) */
    const liste = alle.filter(r => (!ENTW_PID || r.id !== ENTW_PID || GERAET.liste.some(p => p.pid === r.id)) && (!q || String(r.name).toLowerCase().includes(q)));
    $("nliste").innerHTML = liste.length ? liste.map(r => { const t = r.updated && (r.updated.toMillis ? r.updated.toMillis() : Date.parse(r.updated));
      const lokal = GERAET.liste.find(p => p.key !== GERAET.aktiv && p.pid === r.id);
      return `<button class="rrow wahl" data-pid="${esc(r.id)}">${avatarHtml(r, 38)}<div class="who"><b>${esc(r.name)}</b><span>${lokal ? "spielt schon auf diesem Gerät" : `Level ${r.level || 1} · ${(r.xp || 0).toLocaleString("de-DE")} XP${t ? " · zuletzt " + new Date(t).toLocaleDateString("de-DE") : ""}`}</span></div><div class="val">›</div></button>`; }).join("")
      : `<p class="muted small">Kein Name gefunden.</p>`;
    $("nliste").querySelectorAll("[data-pid]").forEach(b => b.onclick = () => {
      const r = alle.find(x => x.id === b.dataset.pid); SFX.tap();
      const lokal = GERAET.liste.find(p => p.key !== GERAET.aktiv && p.pid === r.id);
      if (lokal) { spielerWechseln(lokal.key); return; }
      modal(`<div class="label">Bestätigen</div>${avatarHtml(r, 64)}<h2>Bist du ${esc(r.name)}?</h2><p class="muted small">Dieses Gerät spielt dann als ${esc(r.name)} weiter.${S.xp > 0 ? " Dein bisheriger Fortschritt hier wird hinzugefügt." : ""}</p>
        <button class="btn primary" data-close="ja">Ja, das bin ich</button><button class="btn ghost" data-close="nein">Nein</button>`, async antw => {
        if (antw !== "ja") return;
        const versuch = async () => {
          if (screen.querySelector("#nliste")) screen.querySelector("#nliste").innerHTML = `<p class="muted small">Verbinde …</p>`;
          try { await profilBeitreten(r.id, {}); SFX.win(); rain(80); toast(`${svg("people", accent())}<div><b>Willkommen zurück, ${esc(S.lbName)}!</b><div class="small muted">Dein Spielstand ist jetzt auf diesem Gerät.</div></div>`); fertig(); }
          catch (e) { SFX.wrong(); if (current === hier && $("nliste")) zeichne(); beitrittFehler(e, versuch); }
        };
        versuch();
      });
    });
  };
  $("suche").oninput = zeichne;
  lbUnsub.push(L.watch("gesamt", weekKey(), rows => { alle = rows.slice().sort((a, b) => String(a.name).localeCompare(String(b.name), "de")); if (current === hier) zeichne(); }, () => { $("nliste").innerHTML = `<p class="muted small">Liste konnte nicht geladen werden.</p>`; }));
}
/* Spieler auf diesem Gerät umbenennen (auch einen, der gerade nicht aktiv ist) */
function spielerUmbenennen(key) {
  const p = GERAET.liste.find(x => x.key === key); if (!p) return;
  modal(`<div class="label">Umbenennen</div>${avatarHtml(p, 56)}<label class="label" for="umName">Neuer Spitzname</label><input class="field" id="umName" maxlength="20" value="${esc(p.name)}">
    <p class="small muted" style="margin:0">${p.pid ? "Der neue Name erscheint auch in der Rangliste" + (key === GERAET.aktiv ? "." : ", sobald " + esc(p.name) + " das nächste Mal spielt.") : "Ein Spitzname reicht – bei Kindern bitte keinen vollen Namen."}</p>
    <div class="small" id="umErr" aria-live="polite"></div>
    <button class="btn primary" id="umOk">Speichern</button><button class="btn ghost" data-close>Abbrechen</button>`);
  setTimeout(() => { const f = $("umName"); if (f) { f.focus(); f.select(); } }, 50);
  $("umOk").onclick = async () => {
    const n = $("umName").value.trim().replace(/\s+/g, " "), err = t => { $("umErr").style.color = "var(--bad)"; $("umErr").textContent = t; SFX.wrong(); };
    if (n.length < 2) return err("Bitte mindestens 2 Zeichen eingeben.");
    if (GERAET.liste.some(x => x.key !== key && String(x.name).toLowerCase() === n.toLowerCase())) return err(`„${n}“ spielt schon auf diesem Gerät.`);
    const L = window.LB;
    if (n !== p.name && L && L.ok && L.findeName) { try { const t = (await L.findeName(n)).filter(r => r.id !== p.pid); if (t.length && $("umErr").dataset.warn !== n) { $("umErr").dataset.warn = n; $("umErr").style.color = "var(--fg)"; $("umErr").innerHTML = `<b>„${esc(n)}“ gibt es schon in der Rangliste.</b> Nimm besser einen unterscheidbaren Namen – oder tippe nochmal auf Speichern.`; return; } } catch (e) {} }
    if (key === GERAET.aktiv) { S.lbName = n; S.gemGesendet = ""; save(); renderHud(); lbSync(true); gemSenden(); }
    else {
      try { const k = lsKey(key), st = JSON.parse(localStorage.getItem(k) || "{}"); st.lbName = n; st.gemGesendet = ""; localStorage.setItem(k, JSON.stringify(st)); } catch (e) {}
      p.name = n; geraetSchreiben(g => { const q = g.liste.find(x => x.key === key); if (q) q.name = n; });
    }
    document.querySelectorAll(".modal").forEach(m => m.remove()); SFX.coin(); go("wer");
  };
}
/* Wer spielt? – alle Spieler auf diesem Gerät */
VIEWS.wer = () => {
  geraetSpeichern();
  const liste = GERAET.liste.filter(p => p.name);
  screen.innerHTML = `${backBtn("home", "Start")}<h1>Wer spielt?</h1>
  <p class="muted" style="margin:0 0 12px">Spielen mehrere Personen auf diesem Gerät, hat jeder seinen eigenen Fortschritt.</p>
  <div class="stack">${liste.map(p => `<div class="wer-zeile"><button class="rrow wahl ${p.key === GERAET.aktiv ? "me" : ""}" data-key="${esc(p.key)}">${avatarHtml(p, 44)}<div class="who"><b>${esc(p.name)}${p.key === GERAET.aktiv ? '<span class="you">JETZT</span>' : ""}</b><span>Level ${levelOf(p.xp || 0)} · ${(p.xp || 0).toLocaleString("de-DE")} XP</span></div><div class="val">›</div></button><button class="umben" data-umben="${esc(p.key)}" aria-label="${esc(p.name)} umbenennen" title="Umbenennen">${svg("stift")}</button></div>`).join("")}
    <button class="bereich klein" id="wNeu"><span class="b-ic">${svg("user")}</span><span class="b-tx"><b>Weiteren Spieler hinzufügen</b><span>Neu anfangen oder Namen aus der Rangliste wählen</span></span></button>
  </div>
  ${liste.length > 1 ? `<details class="aufg-det" style="margin-top:16px"><summary>Spieler von diesem Gerät entfernen</summary><div class="stack" style="margin-top:8px">${liste.filter(p => p.key !== GERAET.aktiv).map(p => `<button class="btn ghost mini" data-weg="${esc(p.key)}">${esc(p.name)} entfernen</button>`).join("")}<p class="small muted" style="margin:0">Der Eintrag in der Rangliste und der online gesicherte Spielstand bleiben erhalten. Wer nicht in der Rangliste war, verliert seinen Fortschritt.</p></div></details>` : ""}`;
  wireGo();
  screen.querySelectorAll("[data-key]").forEach(b => b.onclick = () => { SFX.tap(); if (b.dataset.key === GERAET.aktiv) go("home"); else spielerWechseln(b.dataset.key); });
  $("wNeu").onclick = () => { SFX.tap(); neuerSpielerAufGeraet(); };
  screen.querySelectorAll("[data-umben]").forEach(b => b.onclick = () => { SFX.tap(); spielerUmbenennen(b.dataset.umben); });
  screen.querySelectorAll("[data-weg]").forEach(b => b.onclick = () => {
    const p = GERAET.liste.find(x => x.key === b.dataset.weg); if (!p) return;
    modal(`<div class="label">Entfernen</div>${avatarHtml(p, 56)}<h2>${esc(p.name)} von diesem Gerät entfernen?</h2><p class="muted small">${p.pid ? "Der Spielstand bleibt online gesichert – mit „Ich spiele schon mit“ kommt er zurück." : "Achtung: Dieser Spieler ist nicht in der Rangliste. Sein Fortschritt geht verloren."}</p><button class="btn primary" data-close="ja">Entfernen</button><button class="btn ghost" data-close="nein">Abbrechen</button>`, a => {
      if (a !== "ja") return;
      try { if (p.key !== "haupt") localStorage.removeItem(lsKey(p.key)); else localStorage.removeItem("bibelquest-v1"); } catch (e) {}
      geraetSchreiben(g => { g.liste = g.liste.filter(x => x.key !== p.key); }); go("wer");
    });
  });
};
function siegelReihe(r) {
  if (!Array.isArray(r.sg)) return "";
  const h = dayNum(today());
  return `<span class="siegel-reihe">${["Bibel", "AT", "NT", "Rück"].map((n, k) => `<span>${siegelHtml(r.sg[2 * k], h - r.sg[2 * k + 1] <= SIEGEL_FRISCH)}<i>${n}</i></span>`).join("")}</span>`;
}
function profilVergleich(r) {
  if (!r) return;
  const ich = Object.assign(lbPayload(), { id: S.pid });
  const istIch = r.id === S.pid;
  const zeilenR = statsZeilen(r), zeilenI = statsZeilen(ich);
  const hatIds = Array.isArray(r.badgeIds);
  const m = modal(`<div class="vergleich">
    <div class="vg-kopf">${avatarLv(r, 72)}<div><h2 style="margin:0">${esc(r.name)}</h2><div class="muted small">${esc(ENTW_PID && r.id === ENTW_PID ? "Level " + (r.level || 1) + " · " + ENTW_RANG : titelName(r.title) || "Level " + (r.level || 1) + " · " + titleOf(r.level || 1))}</div><div class="small"><span class="tag at">AT</span> ${esc(AT_TITEL[titelIndex(AT_TITEL, r.atP || 0)][1])} · <span class="tag nt">NT</span> ${esc(NT_TITEL[titelIndex(NT_TITEL, r.ntP || 0)][1])}</div>${ruestungHtml(r.armor, false)}</div></div>
    <table class="werte vg"><thead><tr><th></th><th>${esc(r.name)}</th>${istIch ? "" : "<th>Du</th>"}</tr></thead><tbody>
      ${zeilenR.map(([k, v], j) => `<tr><th>${k}</th><td>${esc(v)}</td>${istIch ? "" : `<td>${esc(zeilenI[j][1])}</td>`}</tr>`).join("")}</tbody></table>
    ${Array.isArray(r.sg) ? `<div class="label" style="margin:12px 0 6px">Siegel</div>${siegelReihe(r)}` : ""}
    ${hatIds ? `<div class="small muted" style="margin-top:8px">${istIch ? "" : `Spalten bei den Abzeichen: links ${esc(r.name)}, rechts du.`}</div>${badgeGrid(r.badgeIds, istIch ? null : S.badges)}` : `<p class="small muted">Die Abzeichen sind sichtbar, sobald ${esc(r.name)} die neue App-Version öffnet.</p>`}
    </div>${!istIch && duOk() ? `<button class="btn du-fordern" data-close="duell">${svg("bolt")} In die Arena fordern</button>` : ""}<button class="btn primary" data-close>Schließen</button>`,
    x => { if (x === "duell") duTypWahl({ id: r.id, name: r.name }, null); });
  m.dataset.frei = "1"; m.classList.add("weit");
}

/* ---------- Duelle (asynchron) ----------
   Drei Arten mit gleichem Ablauf: Der Herausforderer spielt zuerst und sendet sein Ergebnis; der Gegner bekommt genau dieselben
   Fragen (gleicher Startwert) und hat 7 Tage Zeit.
   – Lernvers: 8 Fragen zum Lernvers, 12 s je Frage. Punkte: 100 je richtige Antwort + bis zu 50 für Schnelligkeit.
   – Kette (Ganze Bibel / AT / NT / Rückwärts): Buch für Buch, 10 s je Buch, ein Fehler beendet sie. Punkte wie beim Lernvers.
   – Blitz: 60 Sekunden „Was kommt danach?“, ein Fehler kostet 3 s. Punkte: 100 je Richtige + 20 je Combo-Stufe.
   Datenmodell (firestore-regeln.txt): art = vers | kette | blitz, k = Lernvers-Monat bzw. Kette (bibel/at/nt/rueck) bzw. Bereich (all). */
const DU_FRAGEN = 8, DU_SEK = 12, DU_KETTE_SEK = 10, DU_BLITZ_SEK = 60, DU_BLITZ_FRAGEN = 160, DU_MAX_OFFEN = 10, DU_MAX_AUSWAHL = 10, DU_TAGE_HALTEN = 30;
/* 6.77/6.79: XP-Angleichung – Ziel ≈ 150 XP/Min im Einzelspiel (≈ Esthers Tagestempo von ~9.000 XP bei rund 1 Std. Spielzeit), Duelle (soziales Spiel mit Warten/Herausfordern) ≈ 225 XP/Min (+50 %) */
const DU_XP = 30, DU_PRO = { vers: 33, blitz: 9, kette: 9, quiz: 66 }, DU_MAXR = { vers: 8, blitz: 25, kette: 66, quiz: 15 };
const DU_SIEG_TAL = 10, DU_REMIS_TAL = 5, DU_FAIR_TAL = 5;
const DU_TYPEN = {
  vers: { art: "vers", name: "Lernvers", ic: "scroll", info: "8 Fragen zum Lernvers des Monats · 12 s je Frage" },
  blitz: { art: "blitz", k: "all", name: "Blitz", ic: "bolt", info: "60 Sekunden: Was kommt danach? Ein Fehler kostet 3 s" },
  "kette-bibel": { art: "kette", k: "bibel", name: "Kette Bibel", ic: "kette-bibel", info: "Ganze Bibel Buch für Buch · ein Fehler beendet sie" },
  "kette-at": { art: "kette", k: "at", name: "Kette AT", ic: "kette-at", info: "1. Mose bis Maleachi · ein Fehler beendet sie" },
  "kette-nt": { art: "kette", k: "nt", name: "Kette NT", ic: "kette-nt", info: "Matthäus bis Offenbarung · ein Fehler beendet sie" },
  "kette-rueck": { art: "kette", k: "rueck", name: "Rückwärts", ic: "kette-rueck", info: "Offenbarung bis 1. Mose · für Profis" },
  "kette-gebote": { art: "kette", k: "gebote", name: "Zehn Gebote", ic: "tafeln", info: "2. Mose 20,3–17 · ein Fehler beendet sie" },
  "kette-schoepfung": { art: "kette", k: "schoepfung", name: "Schöpfung", ic: "schoepfung", info: "Die sieben Schöpfungstage · ein Fehler beendet sie" },
  quiz: { art: "quiz", k: "leiter", name: "Biblionär", kurz: "Biblionär", ic: "biblionaer", info: "15 Bibelfragen bis 1 Million Punkte · 3 Joker · Aussteigen erlaubt" }
};
let duListe = null, duFehler = "", duSpiel = null, duWahl = false, duGegner = null, duSuche = "", duAlle = false;
/* Mehrfach-Herausforderung (6.44): bis zu 10 Gegner auf einmal – jeder bekommt ein eigenes Duell mit denselben Fragen */
let duAuswahl = [];
const duNamenText = l => (l.length <= 2 ? l.map(g => g.name).join(" und ") : `${l.slice(0, -1).map(g => g.name).join(", ")} und ${l[l.length - 1].name}`);
const DU_ERG_KURZ = 4;
const duOk = () => { const L = window.LB; return !!(L && L.ok && L.meineDuelle && S.pid && S.lbName && !S.offlineOnly); };
const duVerseKey = () => { const jetzt = monatKey(); return Object.keys(MONATSVERSE).filter(k => k <= jetzt).sort().pop() || Object.keys(MONATSVERSE).sort()[0]; };
/* Welcher Duell-Typ steckt in einem Dokument? null = unbekannt (spätere Variante) */
const duTypVon = d => { const t = (d.art || "vers") === "kette" ? "kette-" + d.k : (d.art || "vers"); return DU_TYPEN[t] ? t : null; };
const duTypAktuell = () => (DU_TYPEN[S.duTyp] ? S.duTyp : "vers");
const duTypText = d => { const t = duTypVon(d) || "vers"; return t === "vers" ? `Lernvers ${monatName(d.k)}` : DU_TYPEN[t].name; };
const duErgText = (art, e) => (art === "blitz" ? `${e.r} richtig` : art === "kette" ? `${e.r}/${e.n} Bücher richtig` : `${e.r}/${e.n} richtig`);
/* 9.13: Wer gewinnt, entscheidet allein die Zahl der richtigen Antworten – bei gleicher Zahl ist es unentschieden, egal wer schneller war (die Punkte werden weiter angezeigt) */
/* 9.29: Biblionär (art "quiz"): bei gleich vielen richtigen Antworten gewinnt, wer die höhere Wertung (Gewinnstufe) hat – wer rechtzeitig aussteigt, wird belohnt */
const duVgl = (a, b, art) => { const v = Math.sign((a && a.r | 0) - (b && b.r | 0)); return v || (art === "quiz" ? Math.sign((a && a.p | 0) - (b && b.p | 0)) : 0); };
const duMeinVgl = d => { const ich = d.von === S.pid; return duVgl(ich ? d.vonErg : d.anErg, ich ? d.anErg : d.vonErg, d.art); };
const duP = p => pkt(p); /* Punkte mit Tausenderpunkt (Biblionär bis 1.000.000) */

/* ---------- Auflösung „Siegelbruch“ (6.62): die Punkte des Gegners bleiben bis zum Ende versiegelt ----------
   Erst zählt die eigene Zahl hoch, dann wackelt das Siegel, bricht, und die Gegner-Punkte zählen hoch.
   Die bessere Karte hebt sich und bekommt die Krone. Belohnungseffekte (Ton, Konfetti) nur für den Gewinner.
   Antippen überspringt die Animation. Genutzt am Duell-Ende (Gegenspieler) und einmalig beim Herausforderer. */
const sbGroesse = p => (String(duP(p)).length > 7 ? " lang" : String(duP(p)).length > 5 ? " mittel" : "");
function sbHtml(o) {
  return `<div class="sb-paar">
    <div class="sb-k" id="sbDu"><span class="sb-krone">${svg("crown", "#f2c14e")}</span><span class="sb-n">Du</span><b class="sb-z${sbGroesse(o.du.p)}" id="sbZ1">0</b><small>${duErgText(o.art, o.du)}</small></div>
    <div class="sb-k" id="sbEr"><span class="sb-krone">${svg("crown", "#f2c14e")}</span><span class="sb-n">${esc(o.gegner)}</span><b class="sb-z${sbGroesse(o.er.p)}" id="sbZ2">?</b><small>${duErgText(o.art, o.er)}</small>
      <span class="sb-siegel" id="sbSiegel" aria-hidden="true"><i>?</i></span></div></div>`;
}
function sbStarten(root, o, fertig) {
  const ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches, T = [], R = [];
  const q = sel => root.querySelector(sel); let fertigGemacht = false;
  const nach = (ms, f) => T.push(setTimeout(f, ms));
  const zaehle = (el, ziel, ms, f) => { const t0 = performance.now();
    const s = t => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = duP(Math.round(ziel * e)); if (k < 1) R.push(requestAnimationFrame(s)); else f && f(); };
    R.push(requestAnimationFrame(s)); };
  const splitter = karte => { for (let i = 0; i < 12; i++) { const sp = document.createElement("i"); sp.className = "sb-split"; karte.appendChild(sp);
    const w = Math.random() * Math.PI * 2, d = 60 + Math.random() * 60;
    sp.animate([{ transform: "translate(-50%,-50%)", opacity: 1 }, { transform: `translate(${Math.cos(w) * d}px,${Math.sin(w) * d + 40}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }], { duration: 700, easing: "cubic-bezier(.2,.7,.4,1)", fill: "forwards" });
    setTimeout(() => sp.remove(), 800); } };
  const ende = () => {
    if (fertigGemacht) return; fertigGemacht = true; T.forEach(clearTimeout); R.forEach(cancelAnimationFrame); root.onclick = null;
    q("#sbZ1").textContent = duP(o.du.p); q("#sbZ2").textContent = duP(o.er.p);
    const sg = q("#sbSiegel"); if (sg) sg.remove();
    const sieg = duVgl(o.du, o.er, o.art) > 0, remis = duVgl(o.du, o.er, o.art) === 0;
    if (!remis) { q(sieg ? "#sbDu" : "#sbEr").classList.add("sieger"); q(sieg ? "#sbEr" : "#sbDu").classList.add("verlierer"); }
    fertig(sieg, remis);
  };
  if (ruhig) { ende(); return; }
  root.onclick = e => { if (!e.target.closest("button")) ende(); };
  zaehle(q("#sbZ1"), o.du.p, 900, () => {
    nach(450, () => { const sg = q("#sbSiegel"); if (sg) sg.classList.add("wackel"); SFX.tick(); });
    nach(1250, () => { const sg = q("#sbSiegel"); if (!sg) return; sg.classList.add("bricht"); SFX.siegel(); splitter(sg.parentElement);
      zaehle(q("#sbZ2"), o.er.p, 1100, () => nach(250, ende)); });
  });
}
/* Titel, Zeile und Knöpfe erscheinen erst nach der Auflösung; Ton und Konfetti nur beim Sieg */
function sbSchluss(root, sieg) {
  root.querySelectorAll(".sb-spaet").forEach((el, i) => setTimeout(() => el.classList.add("zeig"), i * 220));
  if (sieg) { SFX.win(); rain(90); }
}

/* Herausforderer: fertige Duelle einmal als Auflösung zeigen (Warteschlange, nacheinander) */
let duAufloesQ = [];
function duAufloesVersuch() {
  if (!duAufloesQ.length || duSpiel || document.querySelector(".modal, .sb-ov") || !["home", "duelle", "bib", "spielen", "rank", "profil", "lernen", "ich"].includes(current)) return;
  const d = duAufloesQ.shift(), du = d.vonErg, er = d.anErg, typ = duTypVon(d) || "vers", art = DU_TYPEN[typ].art || d.art;
  const kf = 1 /* 6.93: keine Kürzung bei Duellen */, sieg0 = duVgl(du, er, art) > 0, remis0 = duVgl(du, er, art) === 0, tal = Math.round((sieg0 ? DU_SIEG_TAL : remis0 ? DU_REMIS_TAL : 0) * kf);
  const ov = document.createElement("div"); ov.className = "sb-ov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
  ov.innerHTML = `<div class="vl vl-ende du-ende sb-ende">
    <div class="sb-kopf"><small>Ergebnis ist da</small><b>${esc(duTypText(d))}-Duell gegen ${esc(d.anName)}</b></div>
    ${sbHtml({ gegner: d.anName, du, er, art })}
    <h1 class="sb-spaet sb-titel"></h1><p class="muted sb-spaet sb-zeile"></p>
    ${tal ? `<div class="vle-werte sb-spaet"><div><b>+${tal}${TAL_MUENZE}</b><span>Talente</span></div></div>` : ""}
    <div class="sb-spaet sb-knoepfe"><button class="btn primary breit" id="sbWeiter">${duAufloesQ.length ? `Nächstes Ergebnis (${duAufloesQ.length})` : "Weiter"}</button>
    <button class="btn ghost breit" id="sbRev">${svg("bolt")} ${sieg0 ? "Nochmal duellieren" : "Revanche"}</button></div></div>`;
  document.body.appendChild(ov);
  sbStarten(ov, { gegner: d.anName, du, er, art }, (sieg, remis) => {
    ov.querySelector(".sb-titel").textContent = sieg ? "Gewonnen!" : remis ? "Unentschieden!" : "Knapp vorbei!";
    if (!sieg && !remis) ov.querySelector(".sb-titel").classList.add("leise");
    ov.querySelector(".sb-zeile").textContent = sieg ? (art === "quiz" && du.r === er.r ? `Gleich viele richtige Antworten – deine höhere Wertung entscheidet. Du hast ${d.anName} besiegt.` : `Du hast ${d.anName} besiegt.`) : remis ? "Genau gleich viele richtige Antworten – egal, wer schneller war!" : `${d.anName} war diesmal besser – fordere eine Revanche!`;
    if (!sieg) ov.querySelector("#sbRev").classList.add("puls");
    sbSchluss(ov, sieg || remis); /* 9.13: Unentschieden wird wie ein Sieg gefeiert */
  });
  const zu = () => { ov.remove(); };
  ov.querySelector("#sbWeiter").onclick = () => { SFX.tap(); zu(); if (duAufloesQ.length) setTimeout(duAufloesVersuch, 150); else if (["duelle", "bib", "home"].includes(current)) go(current); };
  ov.querySelector("#sbRev").onclick = () => { SFX.tap(); zu(); duAufloesQ = []; const g = { id: d.an, name: d.anName };
    if (d.art === "quiz") { go("bib"); bibRevanche(g, !sieg0); } else { go("duelle"); duTypWahl(g, typ, !sieg0); } };
}
function rngVon(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/* Fragen aus Startwert + Art – für beide Spieler genau gleich (Zufall wird dafür kurz ersetzt) */
function duFragen(seed, art, k, stand, weih) {
  const alt = Math.random; Math.random = rngVon(seed);
  if (art === "quiz") { Math.random = alt; return bibFragen(seed, stand, weih ? ADV_ALLE_FRAGEN : null); }
  try {
    if (art === "kette") {
      if (TKETTEN[k]) { const T = TKETTEN[k], it = T.items;
        return [{ start: T.start, opts: shuffle([it[0].t, ...shuffle(it.slice(1).map(x => x.t)).slice(0, 3)]), loesung: it[0].t },
          ...it.slice(0, -1).map((_, pos) => ({ buch: it[pos].t, label: T.frage, opts: shuffle([it[pos + 1].t, ...shuffle(it.map(x => x.t).filter(t => t !== it[pos + 1].t && t !== it[pos].t)).slice(0, 3)]), loesung: it[pos + 1].t }))]; }
      const seq = (KETTEN[k] || KETTEN.bibel).seq;
      return [{ start: KETTE_START[k] || KETTE_START.bibel, opts: optsStart(seq), loesung: ALL[seq[0]].b },
        ...seq.slice(0, -1).map((_, pos) => ({ buch: ALL[seq[pos]].b, opts: optsSeq(seq, pos), loesung: ALL[seq[pos + 1]].b }))];
    }
    if (art === "blitz") {
      const idx = ALL.map((_, i) => i).slice(0, -1); let cur = -1;
      return Array.from({ length: DU_BLITZ_FRAGEN }, () => { let i; do { i = pick(idx); } while (i === cur); cur = i;
        return { buch: ALL[i].b, gruppe: GROUPS[ALL[i].gi].name, opts: makeOpts(i), loesung: ALL[i + 1].b }; });
    }
    const frueher = Object.keys(MONATSVERSE).filter(x => x < k).sort().slice(-6);
    const keys = Array.from({ length: DU_FRAGEN }, (_, i) => (i % 4 === 3 && frueher.length ? pick(frueher) : k));
    const arten = shuffle(["weiter", "stelle", "fehler", "luecke", "weiter", "stelle", "fehler", "luecke"]);
    return keys.map((vk, i) => duFrage(arten[i], vk));
  } finally { Math.random = alt; }
}
function duFrage(art, k) {
  const [text, ref] = MONATSVERSE[k], w = text.split(" "), kand = w.map((_, i) => i).filter(i => i > 0 && lvKern(w[i]).length >= 3);
  if (art === "weiter") {
    const [vorn, hinten] = lvTeilung(text), hw = hinten.split(" "), idx = hw.map((_, i) => i).filter(i => lvKern(hw[i]).length >= 3);
    const falsch = shuffle(idx).slice(0, 2).map(i => { const f = hw.slice(); f[i] = hw[i].replace(lvKern(hw[i]), lvErsatz(lvKern(hw[i]), text)); return f.join(" "); });
    return { k, frage: "Wie geht der Vers weiter?", vers: esc(vorn) + ' <span class="vl-pkt">…</span>', opts: shuffle([hinten, ...falsch]).map(o => "… " + o), loesung: "… " + hinten, lang: true };
  }
  if (art === "stelle") {
    const andere = lvStelleAehnlich(ref), weit = lvAlleVerse().map(v => v[1]).filter(r => r !== ref);
    return { k, frage: "Wo steht dieser Vers?", vers: esc(text), opts: shuffle([ref, pick(andere), pick(weit.filter(r => !andere.includes(r)))]), loesung: ref };
  }
  if (art === "fehler") {
    const i = pick(kand), falsch = lvErsatz(lvKern(w[i]), text);
    const andere = shuffle(kand.filter(j => j !== i && lvNorm(w[j]) !== lvNorm(falsch))).slice(0, 2).map(j => lvKern(w[j]));
    return { k, frage: "Welches Wort ist falsch?", vers: esc(w.map((x, j) => (j === i ? x.replace(lvKern(x), falsch) : x)).join(" ")), opts: shuffle([falsch, ...andere]), loesung: falsch };
  }
  const i = pick(kand), richtigW = lvKern(w[i]);
  const eigene = kand.filter(j => j !== i).map(j => lvKern(w[j])).filter(x => lvNorm(x) !== lvNorm(richtigW));
  const opts = shuffle([richtigW, ...shuffle([...new Set([pick(eigene) || "Herr", lvErsatz(richtigW, text)])]).slice(0, 2)]);
  return { k, frage: "Welches Wort fehlt?", vers: w.map((x, j) => (j === i ? `<span class="vl-loch jetzt"></span>${esc(x.slice(x.indexOf(richtigW) + richtigW.length))}` : esc(x))).join(" "), opts, loesung: richtigW };
}

/* Abbrechen (6.44) – gilt für Arena und Biblionär:
   Herausforderer zieht eine offene Herausforderung zurück (Duell wird gelöscht),
   Gegenspieler lehnt ab, solange er noch nicht gespielt hat (Status „abgelehnt“, der Herausforderer sieht es). */
function duNeuZeichnen() { if (current === "duelle") VIEWS.duelle(); else if (current === "bib") VIEWS.bib(); }
/* 6.50: Abbrechen erst 24 Stunden nach der eigenen Runde – damit niemand schlechte Runden gleich wieder löscht.
   „erstellt“ ist die Serverzeit, zu der die Runde gespielt und die Herausforderung abgeschickt wurde. */
const DU_STOP_SPERRE = 24 * 36e5;
function duStopAb(d) { return (d.erstellt || Date.now()) + DU_STOP_SPERRE; }
function duStopGesperrt(d) { return Date.now() < duStopAb(d); }
function duStopZeit(d) { const ab = new Date(duStopAb(d)), heute = new Date(), uhr = ab.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return `${ab.toDateString() === heute.toDateString() ? "heute" : "morgen"} um ${uhr} Uhr`; }
function duStopKnopfIc(d) { return svg(duStopGesperrt(d) ? "lock" : "nein"); }
function duStopLabel(d) { return duStopGesperrt(d) ? `Abbrechen erst ${duStopZeit(d)} möglich` : `Herausforderung an ${d.anName} abbrechen`; }
function duAbbrechenFrage(d) {
  const L = window.LB;
  if (duStopGesperrt(d)) {
    const std = Math.max(1, Math.ceil((duStopAb(d) - Date.now()) / 36e5));
    return modal(`<div class="label">Noch gesperrt</div><h2>${esc(d.anName)}</h2><p class="muted">Eine Herausforderung kannst du erst <b>24 Stunden nach deiner Runde</b> abbrechen – so kann niemand schwache Runden einfach wieder löschen.</p><p>Abbrechen möglich <b>${esc(duStopZeit(d))}</b> (noch ${std === 1 ? "etwa 1 Stunde" : `${std} Stunden`}).</p><button class="btn primary" data-close="ok">Verstanden</button>`);
  }
  modal(`<div class="label">Herausforderung abbrechen?</div><h2>${esc(d.anName)}</h2><p class="muted">${esc(d.anName)} sieht dieses ${esc(duTypText(d))}-Duell dann nicht mehr. Deine ${duP(d.vonErg.p)} Punkte aus dieser Runde verfallen.</p><button class="btn primary" data-close="nein">Weiter warten</button><button class="btn ghost" data-close="stop">${svg("nein")} Herausforderung abbrechen</button>`,
    r => { if (r !== "stop") return;
      L.duellLoeschen(d.id).then(() => { duListe = (duListe || []).filter(x => x.id !== d.id); duNeuZeichnen(); toast(`${svg("nein", "var(--muted)")}<div>Herausforderung an <b>${esc(d.anName)}</b> abgebrochen.</div>`); })
        .catch(() => toast(`${svg("nein", "var(--bad)")}<div>Das hat nicht geklappt – bist du online? Vielleicht hat ${esc(d.anName)} auch gerade gespielt.</div>`)); });
}
function duAblehnenFrage(d, spielen) {
  const L = window.LB;
  modal(`<div class="label">Herausforderung abbrechen?</div><h2>${esc(d.vonName)}</h2><p class="muted">Du lehnst dieses ${esc(duTypText(d))}-Duell ab. ${esc(d.vonName)} sieht dann, dass du abgelehnt hast.</p><button class="btn primary" data-close="spielen">${svg("bolt")} Doch spielen</button><button class="btn ghost" data-close="ab">${svg("nein")} Ablehnen</button>`,
    r => { if (r === "ab") L.duellAblehnen(d.id, S.pid).then(() => { d.status = "abgelehnt"; duNeuZeichnen(); toast(`${svg("nein", "var(--muted)")}<div>Duell von <b>${esc(d.vonName)}</b> abgelehnt.</div>`); })
        .catch(() => toast(`${svg("nein", "var(--bad)")}<div>Das hat nicht geklappt – bist du online? Vielleicht hat ${esc(d.vonName)} die Herausforderung schon zurückgezogen.</div>`));
      else if (r === "spielen" && spielen) spielen(); });
}
/* Duelle laden; alte (über 30 Tage) und abgelaufene still aufräumen */
async function duAktualisieren() {
  if (!duOk()) return duListe;
  try {
    const L = window.LB, alle = await L.meineDuelle(S.pid), jetzt = Date.now();
    duListe = alle.filter(d => {
      /* nur Varianten anzeigen, die diese App-Version kennt (spätere Duell-Arten bleiben unberührt) */
      if (!duTypVon(d) || (d.modus || "1v1") !== "1v1" || !d.vonErg || (d.status === "fertig" && !d.anErg)) return false;
      const alt = jetzt - d.erstellt > DU_TAGE_HALTEN * 864e5;
      if (alt && (d.status !== "offen" || jetzt > d.ablauf)) { L.duellLoeschen(d.id).catch(() => {}); return false; }
      return true;
    });
    duFehler = ""; duBelohnen(); duZaehlen(); tbDuSetzen();
  } catch (e) { duFehler = "laden"; }
  return duListe;
}
/* Siege und Spiele aus den Duellen selbst ableiten (Quelle der Wahrheit) – nie verringern, nie doppelt zählen.
   Ältere Duelle werden nach 30 Tagen gelöscht; deren Zählung bleibt im Spielstand erhalten (Maximum). */
function duZaehlen() {
  const fertig = (duListe || []).filter(d => d.status === "fertig" && d.vonErg && d.anErg && (d.von === S.pid || d.an === S.pid));
  const siege = fertig.filter(d => duMeinVgl(d) > 0).length;
  const vorher = [S.duSiege | 0, S.duSpiele | 0];
  S.duSiege = Math.max(vorher[0], siege); S.duSpiele = Math.max(vorher[1], fertig.length);
  if (S.duSiege !== vorher[0] || S.duSpiele !== vorher[1]) { save(); checkBadges(); lbSync(); }
}
const duStatus = d => (d.status === "offen" && d.ablauf && Date.now() > d.ablauf ? "abgelaufen" : d.status);
/* 9.14: Arena (alle Arten außer Biblionär) und Biblionär getrennt – annehmbare Biblionär-Duelle stehen nur im Biblionär-Reiter */
const duOffenFuerMich = () => (duListe || []).filter(d => d.an === S.pid && duStatus(d) === "offen");
const duFuerMich = () => duOffenFuerMich().filter(d => !bibIstQuiz(d));
const duFuerBib = () => duOffenFuerMich().filter(bibIstQuiz);
const duNeueErgebnisse = () => (duListe || []).filter(d => d.von === S.pid && d.status === "fertig" && !(S.duGes || []).includes(d.id));
/* Herausforderer bekommt seinen Sieg, sobald er das Ergebnis zum ersten Mal sieht */
function duBelohnen() {
  const neu = duNeueErgebnisse(); if (!neu.length) return;
  let tal = 0;
  neu.forEach(d => {
    S.duGes = [...(S.duGes || []), d.id].slice(-60);
    const v = duVgl(d.vonErg, d.anErg, d.art);
    const kf = 1;  /* 6.93: Duelle werden nie gekürzt (bis 6.92: gekürzt beim 5.+ Duell am Tag gegen denselben Gegner) */
    if (v > 0) tal += Math.round(DU_SIEG_TAL * kf); else if (v === 0) tal += Math.round(DU_REMIS_TAL * kf); /* der Sieg selbst wird in duZaehlen() aus den Duellen gezählt */
    duAufloesQ.push(d); /* 6.62: statt Hinweis eine Auflösung im Siegelbruch-Stil */
  });
  setTimeout(duAufloesVersuch, 600);
  if (tal) S.tal += tal; save(); renderHud();
  /* Sieg sofort in die Rangliste und Abzeichen prüfen (sonst erst beim nächsten Spiel) */
  checkBadges(); lbSync();
}
/* Kleine farbige Marke für die Duell-Art (Liste, Hinweise) */
const duMarke = d => { const t = duTypVon(d) || "vers"; return `<i class="du-marke t-${DU_TYPEN[t].art}">${esc(DU_TYPEN[t].kurz || DU_TYPEN[t].name)}</i>`; };

/* Anzeige-Helfer der Duellseite: Initialen, Siegesserie, nächstes Abzeichen, Arena-Banner */
const duInitialen = n => (String(n || "?").trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2) || "?").toUpperCase();
const DU_ZIELE = [["duMutig", "duGesendet", 1, "gesendet", "gesendet"], ["duStein", "duSiege", 1, "Sieg", "Siege"], ["duAntwort", "duAngenommen", 5, "angenommen", "angenommen"],
  ["duEisen", "duSpiele", 10, "Duell", "Duelle"], ["duSteine5", "duSiege", 5, "Sieg", "Siege"], ["duKampf", "duSpiele", 50, "Duell", "Duelle"], ["duHelden", "duSiege", 25, "Sieg", "Siege"]];
function duNaechstesZiel() {
  const offen = DU_ZIELE.filter(([id]) => !(S.badges || []).includes(id)).map(([id, feld, ziel, e1, eN]) => ({ b: BADGES.find(x => x.id === id), ist: Math.min(ziel, S[feld] || 0), ziel, einheit: ziel === 1 ? e1 : eN }))
    .filter(z => z.b && z.ist < z.ziel);
  return offen.sort((a, b) => b.ist / b.ziel - a.ist / a.ziel)[0] || null;
}
function duSerie() {
  const fertig = (duListe || []).filter(d => d.status === "fertig" && d.vonErg && d.anErg).sort((a, b) => (b.fertig || b.erstellt) - (a.fertig || a.erstellt));
  let n = 0; for (const d of fertig) { if (duMeinVgl(d) > 0) n++; else break; }
  return n;
}
/* Kompakter Arena-Kopf: Logo, Titel mit Zuruf, Siege als römische Zahl; darunter Werte-Tafel und nächstes Abzeichen */
function duArenaHtml(fuerMich) {
  const siege = S.duSiege || 0, spiele = S.duSpiele || 0, quote = spiele ? Math.round(siege / spiele * 100) : 0, serie = duSerie(), ziel = duNaechstesZiel();
  const ruf = fuerMich.length ? `${fuerMich.length === 1 ? esc(fuerMich[0].vonName) + " wartet" : fuerMich.length + " Gegner warten"} auf dich!`
    : serie >= 2 ? `${serie} Siege in Folge – bleib dran!` : spiele ? "Wen forderst du heute heraus?" : "Dein erstes Duell wartet!";
  return `<header class="ar-kopf">
      <span class="ar-logo">${DUELL_LOGO}</span>
      <div class="ar-titel"><h1>Arena</h1><span>${ruf}</span></div>
    </header>
`;
}

/* 8.4: Duell direkt annehmen – von Start und Zusammen aus (je 1 Karte „Du bist dran“) */
const duAnnehmen = d => duSpielStarten({ id: d.id, seed: d.seed, erstellt: d.erstellt, art: d.art || "vers", k: d.k, gegner: d.vonName, gegnerErg: d.vonErg, vonPid: d.von, weih: !!(d.opt && d.opt.w) });
function duDranKarte(d) {
  const art = DU_TYPEN[duTypVon(d)].art, n = Math.max(0, Math.ceil((d.ablauf - Date.now()) / 864e5));
  return `<li class="ar-karte t-${art}${n <= 1 ? " eilig" : ""}">
      <span class="du-medaille t-${art}">${esc(duInitialen(d.vonName))}</span>
      <span class="ar-tx"><b>${esc(d.vonName)}</b><span>${duMarke(d)}</span></span>
      <span class="ar-vor"><b class="du-verdeckt" aria-label="Punkte verdeckt">?</b><small class="ar-zeit">noch ${n} ${n === 1 ? "Tag" : "Tage"}</small></span>
      <span class="ar-knoepfe"><button class="ar-antreten" data-an="${d.id}">${svg("bolt")}Antreten</button><button class="ar-rev" data-ab="${d.id}" aria-label="Ablehnen">${svg("nein")}</button></span></li>`;
}
const duDranHtml = () => { const l = duFuerMich().sort((a, b) => a.ablauf - b.ablauf); return l.length && duOk()
  ? `<div class="bk-label">${svg("bolt")}<span>Du bist dran</span><i>${l.length}</i><button class="zus-alle" data-go="duelle">Alle Duelle ›</button></div><ul class="ar-liste du-dran">${l.map(duDranKarte).join("")}</ul>` : ""; };
function duDranVerdrahten() {
  const liste = duFuerMich();
  screen.querySelectorAll(".du-dran [data-an]").forEach(b => b.onclick = () => { SFX.tap(); const d = liste.find(x => x.id === b.dataset.an); if (d) duAnnehmen(d); });
  screen.querySelectorAll(".du-dran [data-ab]").forEach(b => b.onclick = () => { SFX.tap(); const d = liste.find(x => x.id === b.dataset.ab); if (d) duAblehnenFrage(d, () => duAnnehmen(d)); });
}
VIEWS.duelle = () => {
  const kopf = seitenKopf("Arena", `${svg("crown")}${S.duSiege || 0} ${S.duSiege === 1 ? "Sieg" : "Siege"}`);
  if (!duOk()) {
    screen.innerHTML = kopf + `<div class="card stack"><b>${window.LB && window.LB.ok ? "Erst in die Gemeinde-Rangliste" : "Keine Verbindung"}</b><p class="small muted" style="margin:0">${window.LB && window.LB.ok ? "Für die Arena brauchst du einen Eintrag in der Gemeinde-Rangliste." : "Für die Arena brauchst du Internet."}</p></div>`;
    wireGo(); return;
  }
  const L = window.LB, jetzt = Date.now(), tage = ms => Math.max(0, Math.ceil((ms - jetzt) / 864e5));
  const liste = duListe || [];
  const fuerMich = duFuerMich(), warte = liste.filter(d => d.von === S.pid && duStatus(d) === "offen");
  const fertigAlle = liste.filter(d => !(d.an === S.pid && duStatus(d) === "offen") && !(d.von === S.pid && duStatus(d) === "offen")).slice(0, 12);
  const fertig = duAlle ? fertigAlle : fertigAlle.slice(0, DU_ERG_KURZ);
  const art = d => DU_TYPEN[duTypVon(d)].art;
  const zeile = d => {
    const ich = d.von === S.pid, gegner = ich ? d.anName : d.vonName, st = duStatus(d);
    if (st === "fertig") {
      const p = ich ? d.vonErg.p : d.anErg.p, q = ich ? d.anErg.p : d.vonErg.p, erg = duMeinVgl(d) > 0 ? "sieg" : duMeinVgl(d) === 0 ? "remis" : "nieder";
      const knapp = erg === "nieder" && q > 0 && (q - p) / q < 0.15, anteil = p + q ? Math.round(p / (p + q) * 100) : 50;
      const text = erg === "sieg" ? "Gewonnen" : erg === "remis" ? "Remis" : knapp ? "Knapp verloren" : "Verloren";
      return `<li class="ar-zeile ${erg}"><span class="du-medaille t-${art(d)}">${erg === "sieg" ? svg("crown") : esc(duInitialen(gegner))}</span><span class="ar-tx"><b>${esc(gegner)}</b><span><em>${text}</em> ${duMarke(d)}</span><i class="du-balken" role="img" aria-label="${duP(p)} zu ${duP(q)} Punkte"><i style="width:${anteil}%"></i></i></span><span class="du-stand"><b>${duP(p)}</b><small>${duP(q)}</small></span><button class="ar-rev" data-rev="${d.id}" aria-label="${erg === "sieg" ? "Nochmal" : "Revanche"} gegen ${esc(gegner)}">${svg("bolt")}</button></li>`;
    }
    return `<li class="ar-zeile grau"><span class="du-medaille">${svg("lock")}</span><span class="ar-tx"><b>${esc(gegner)}</b><span>${st === "abgelehnt" ? "abgelehnt" : "abgelaufen"} ${duMarke(d)}</span></span><span></span><button class="ar-rev" data-weg="${d.id}" aria-label="Entfernen">${svg("nein")}</button></li>`;
  };
  const tageText = n => `${n} ${n === 1 ? "Tag" : "Tage"}`;
  const dranKarte = d => { const n = tage(d.ablauf);
    return `<li class="ar-karte t-${art(d)}${n <= 1 ? " eilig" : ""}">
      <span class="du-medaille t-${art(d)}">${esc(duInitialen(d.vonName))}</span>
      <span class="ar-tx"><b>${esc(d.vonName)}</b><span>${duMarke(d)}</span></span>
      <span class="ar-vor"><b class="du-verdeckt" aria-label="Punkte verdeckt">?</b><small class="ar-zeit">noch ${tageText(n)}</small></span>
      <span class="ar-knoepfe"><button class="ar-antreten" data-an="${d.id}">${svg("bolt")}Antreten</button><button class="ar-rev" data-ab="${d.id}" aria-label="Ablehnen">${svg("nein")}</button></span></li>`; };
  const warteZeile = d => { const n = tage(d.ablauf), weg = Math.min(100, Math.max(4, Math.round((1 - (d.ablauf - jetzt) / (7 * 864e5)) * 100)));
    return `<li class="ar-zeile warte"><span class="du-medaille t-${art(d)}">${esc(duInitialen(d.anName))}</span><span class="ar-tx"><b>${esc(d.anName)}</b><span>${duMarke(d)} deine <b class="du-gold">${duP(d.vonErg.p)}</b></span><i class="du-uhr" aria-label="noch ${tageText(n)}"><i style="width:${weg}%"></i></i></span><span class="du-tage">${n}<small>${n === 1 ? "Tag" : "Tage"}</small></span><button class="ar-rev ar-stop${duStopGesperrt(d) ? " gesperrt" : ""}" data-stop="${d.id}" aria-label="${esc(duStopLabel(d))}">${duStopKnopfIc(d)}</button></li>`; };
  const titel = (ic, t, n) => `<div class="ar-label">${svg(ic)}<span>${t}</span>${n ? `<i>${n}</i>` : ""}</div>`;
  screen.innerHTML = `
    ${duArenaHtml(fuerMich)}
    <button class="ar-start" id="duNeu">${svg("duell")}<b>Neues Duell</b>${svg("bolt")}</button>
    ${duFehler ? `<p class="small muted">Die Arena konnte nicht geladen werden. <button class="lv-btn" id="duNeuLaden">Nochmal</button></p>` : ""}
    ${duListe === null && !duFehler ? `<p class="small muted du-laden">${svg("duell")} Lade Arena …</p>` : ""}
    ${fuerMich.length ? titel("bolt", "Du bist dran", fuerMich.length) + `<ul class="ar-liste">${fuerMich.map(dranKarte).join("")}</ul>` : ""}
    ${warte.length ? titel("sun", "Wartet auf Gegner", warte.length) + `<ul class="ar-liste">${warte.map(warteZeile).join("")}</ul>` : ""}
    ${fertig.length ? titel("crown", "Ergebnisse", "") + `<ul class="ar-liste">${fertig.map(zeile).join("")}</ul>${fertigAlle.length > DU_ERG_KURZ ? `<button class="ar-mehr" id="duAlle">${duAlle ? "Weniger zeigen" : `Alle ${fertigAlle.length} Ergebnisse`}</button>` : ""}` : ""}
    ${duListe && !liste.length ? `<div class="du-leer"><span class="du-leer-ic">${DUELL_LOGO}</span><b>Die Arena ist bereit</b><p class="small muted">Fordere jemanden aus der Gemeinde heraus – schon das Absenden bringt „Mutig wie David“.</p></div>` : ""}
    <p class="ar-regel">Annehmen +${DU_FAIR_TAL} · Sieg +${DU_SIEG_TAL} · Remis +${DU_REMIS_TAL} Talente · beide bekommen dieselben Fragen · 7 Tage Zeit</p>`;
  if ($("duAlle")) $("duAlle").onclick = () => { SFX.tap(); duAlle = !duAlle; VIEWS.duelle(); };
  wireGo();
  $("duNeu").onclick = () => { SFX.tap(); go("zusammen"); };
  if ($("duNeuLaden")) $("duNeuLaden").onclick = () => { duAktualisieren().then(() => current === "duelle" && VIEWS.duelle()); };
  const annehmen = duAnnehmen;
  screen.querySelectorAll("[data-an]").forEach(b => b.onclick = () => { SFX.tap(); const d = liste.find(x => x.id === b.dataset.an); if (d) annehmen(d); });
  screen.querySelectorAll("[data-ab]").forEach(b => b.onclick = () => { SFX.tap(); const d = liste.find(x => x.id === b.dataset.ab); if (d) duAblehnenFrage(d, () => annehmen(d)); });
  screen.querySelectorAll("[data-rev]").forEach(b => b.onclick = () => { SFX.tap(); const d = liste.find(x => x.id === b.dataset.rev); if (!d) return; const ich = d.von === S.pid;
    duTypWahl({ id: ich ? d.an : d.von, name: ich ? d.anName : d.vonName }, duTypVon(d), true); });
  /* Eigene, noch offene Herausforderung zurückziehen (das Duell wird gelöscht, der Gegner sieht es nicht mehr) */
  screen.querySelectorAll("[data-stop]").forEach(b => b.onclick = () => { SFX.tap(); const d = liste.find(x => x.id === b.dataset.stop); if (d) duAbbrechenFrage(d); });
  screen.querySelectorAll("[data-weg]").forEach(b => b.onclick = () => { SFX.tap(); const id = b.dataset.weg; L.duellLoeschen(id).catch(() => {}); duListe = (duListe || []).filter(d => d.id !== id); VIEWS.duelle(); });
  if (duListe === null) duAktualisieren().then(() => { if (current === "duelle" && !duSpiel) VIEWS.duelle(); });
};
/* Auswahl der Duell-Art als Kacheln (eine Ebene, direkt über der Gegnerliste) */
const duTypKacheln = (aktiv, attr = "data-typ", marken = {}) => `<div class="du-typen" role="radiogroup" aria-label="Duell-Art">${Object.entries(DU_TYPEN).map(([id, t]) =>
  `<button class="du-typ t-${t.art}" role="radio" aria-checked="${id === aktiv}" ${attr}="${id}"><span class="dt-ic">${svg(t.ic)}</span><span class="dt-name">${esc(t.name)}</span>${marken[id] ? `<i class="dt-marke">${marken[id]}</i>` : ""}</button>`).join("")}</div>`;
/* Gegnerwahl direkt auf der Duell-Seite (keine weitere Menüebene) */
async function duGegnerLaden() {
  if (duGegner) return;
  /* 9.30: Gemeinde-Zuordnungen gleichzeitig laden – die Liste erscheint erst, wenn die Logos stimmen („Lade Gemeinde …“) */
  try { const [l] = await Promise.all([window.LB.gegnerListe(), gemLaden().catch(() => false)]); duGegner = l.filter(r => r.id !== S.pid && r.name); } catch (e) { duGegner = []; }
  if (current === "gegner") { const box = $("duGegner"); if (box) { box.outerHTML = duGegnerHtml(); duGegnerVerdrahten(); } }
}
/* 9.20: Bilanz gegen einen Gegner (Siege / Unentschieden / Niederlagen) aus den fertigen Duellen; Duelle werden nach 30 Tagen gelöscht, die Bilanz zeigt also die letzten 30 Tage */
function duBilanz(id) {
  let sg = 0, un = 0, nd = 0; const art = {};
  (duListe || []).forEach(d => {
    if (d.status !== "fertig" || !d.vonErg || !d.anErg) return;
    if (!((d.von === S.pid && d.an === id) || (d.an === S.pid && d.von === id))) return;
    const v = duMeinVgl(d), t = duTypVon(d), a = art[t] || (art[t] = { sg: 0, un: 0, nd: 0 });
    if (v > 0) { sg++; a.sg++; } else if (v < 0) { nd++; a.nd++; } else { un++; a.un++; }
  });
  return { sg, un, nd, n: sg + un + nd, art };
}
const duUnterzeile = (r, laeuft) => {
  if (laeuft) return "Duell läuft schon";
  const b = duBilanz(r.id);
  if (!b.n) return "Level " + (r.level || 1);
  /* nur Zahlen (grün = Siege, gelb = Unentschieden, rot = Niederlagen); Tipp darauf öffnet die Statistik */
  return `<em class="du-bil" role="button" tabindex="0" data-bil="${esc(r.id)}" aria-label="Bilanz gegen ${esc(r.name)}: ${b.sg} Siege, ${b.un} Unentschieden, ${b.nd} Niederlagen – Statistik öffnen"><b class="bs">${b.sg}</b><i>·</i><b class="bu">${b.un}</b><i>·</i><b class="bn">${b.nd}</b></em>`;
};
/* Detail-Statistik gegen einen Spieler (letzte 30 Tage), je Duell-Art */
function duBilanzFenster(id) {
  const r = (duGegner || []).find(x => x.id === id) || { id, name: "Gegner" }, b = duBilanz(id);
  const z = (n, k) => n ? `<b class="${k}">${n}</b>` : `<span class="nix">–</span>`;
  const zeile = (name, ic, a, klasse = "") => `<div class="bil-z ${klasse}"><span class="bil-n">${ic ? svg(ic) : ""}${esc(name)}</span>${z(a.sg, "bs")}${z(a.un, "bu")}${z(a.nd, "bn")}</div>`;
  const rows = Object.entries(DU_TYPEN).map(([t, T]) => zeile(T.name, T.ic, b.art[t] || { sg: 0, un: 0, nd: 0 }, b.art[t] ? "" : "leer")).join("");
  modal(`<div class="label">Bilanz · letzte 30 Tage</div><h2 style="margin:2px 0 8px">gegen ${esc(r.name)}</h2>
    <div class="bil-tab"><div class="bil-z bil-kopf"><span class="bil-n">Duell-Art</span><b class="bs">Siege</b><b class="bu">Unent&shy;schieden</b><b class="bn">Nieder&shy;lagen</b></div>${rows}${zeile("Gesamt", "", b, "bil-sum")}</div>
    <button class="btn ghost" data-close="x" style="margin-top:10px">Schließen</button>`);
}
document.addEventListener("click", e => { const t = e.target.closest && e.target.closest("[data-bil]"); if (!t) return; e.stopPropagation(); e.preventDefault(); duBilanzFenster(t.dataset.bil); }, true);
document.addEventListener("keydown", e => { if (e.key !== "Enter" && e.key !== " ") return; const t = e.target.closest && e.target.closest("[data-bil]"); if (t) { e.preventDefault(); e.stopPropagation(); duBilanzFenster(t.dataset.bil); } }, true);
/* 9.18: Gegnerliste in Arena und Biblionär: erst die eigene Gemeinde, darunter hinter einem Trennstrich Gäste und andere Gemeinden */
function duGegnerGruppen(q) {
  const alle = (duGegner || []).filter(r => !q || nameSchluessel(r.name).includes(q)), me = meineGem();
  return { eigen: alle.filter(r => gemVon(r.id) === me).slice(0, 40), andere: alle.filter(r => gemVon(r.id) !== me).slice(0, 40) };
}
function duGegnerListeHtml(q, zeile) {
  const g = duGegnerGruppen(q);
  if (!g.eigen.length && !g.andere.length) return `<li class="small muted">Niemand gefunden.</li>`;
  return g.eigen.map(zeile).join("") + (g.andere.length ? `<li class="du-trenn" aria-hidden="true"><span>Gäste &amp; andere Gemeinden</span></li>` + g.andere.map(zeile).join("") : "");
}
function duGegnerHtml() {
  const offen = (duListe || []).filter(d => d.von === S.pid && duStatus(d) === "offen");
  const frei = Math.max(0, DU_MAX_OFFEN - offen.length), maxWahl = Math.min(DU_MAX_AUSWAHL, frei);
  duAuswahl = duAuswahl.filter(g => !offen.some(d => d.an === g.id)).slice(0, maxWahl);
  const q = nameSchluessel(duSuche), typ = duTypAktuell(), n = duAuswahl.length, voll = n >= maxWahl;
  return `<div class="card du-gegner" id="duGegner">
    ${!frei ? `<p class="small muted" style="margin:0">Du hast schon ${DU_MAX_OFFEN} offene Herausforderungen – erst müssen diese gespielt werden. Unten bei „Wartet auf Gegner“ kannst du eine abbrechen.</p>` : `
    ${typ === "quiz" ? weihSchalterHtml() : ""}
    <div class="label du-schritt du-schritt2"><span>${esc(DU_TYPEN[typ].name)} · Gegner</span><i class="du-zahl${n ? " an" : ""}">${n}/${maxWahl}</i></div>
    <input class="du-suche" id="duSuche" type="search" placeholder="Name suchen …" value="${esc(duSuche)}" autocomplete="off" aria-label="Gegner suchen">
    ${n ? `<div class="du-chips">${duAuswahl.map(g => `<button class="du-chip" data-raus="${esc(g.id)}" aria-label="${esc(g.name)} abwählen">${esc(g.name)}${svg("nein")}</button>`).join("")}</div>` : ""}
    ${duGegner === null ? `<p class="small muted">Lade Gemeinde …</p>` : `<ul class="du-wahl">${duGegnerListeHtml(q, r => { const laeuft = offen.some(d => d.an === r.id), an = duAuswahl.some(g => g.id === r.id);
      return `<li><button class="du-person${an ? " gewaehlt" : ""}" data-gegner="${esc(r.id)}" aria-pressed="${an}" ${laeuft || (voll && !an) ? "disabled" : ""}>${avatarLv(r, 34)}<span class="du-tx"><b>${esc(r.name)}</b><span>${duUnterzeile(r, laeuft)}</span></span>${laeuft ? "" : `<span class="du-haken">${an ? svg("check") : ""}</span>`}</button></li>`; })}</ul>`}
    <button class="btn primary du-fordern du-los-knopf" id="duLos" ${n ? "" : "disabled"}>${svg("bolt")} ${n ? `${esc(DU_TYPEN[typ].name)}-Duell gegen ${n === 1 ? esc(duAuswahl[0].name) : n + " Gegner"}` : `Gegner antippen (bis ${maxWahl})`}</button>
    ${n > 1 ? `<p class="small muted du-typ-info" style="margin:0">Du spielst einmal – jeder bekommt dieselben Fragen und ein eigenes Duell gegen dich.</p>` : ""}`}
  </div>`;
}
function duGegnerVerdrahten() {
  const neuZeichnen = () => { const box = $("duGegner"); if (!box) return; const alt = box.querySelector(".du-wahl"), top = alt ? alt.scrollTop : 0;
    box.outerHTML = duGegnerHtml(); duGegnerVerdrahten(); const w = $("duGegner") && $("duGegner").querySelector(".du-wahl"); if (w) w.scrollTop = top; };
  const f = $("duSuche"); if (f) f.oninput = () => { duSuche = f.value; const pos = f.selectionStart; neuZeichnen(); const g = $("duSuche"); g.focus(); try { g.setSelectionRange(pos, pos); } catch (e) {} };
  weihSchalterWire(neuZeichnen);
  screen.querySelectorAll("[data-gegner]").forEach(b => b.onclick = () => { SFX.tap(); const r = (duGegner || []).find(x => x.id === b.dataset.gegner); if (!r) return;
    duAuswahl = duAuswahl.some(g => g.id === r.id) ? duAuswahl.filter(g => g.id !== r.id) : [...duAuswahl, { id: r.id, name: r.name }]; neuZeichnen(); });
  screen.querySelectorAll("[data-raus]").forEach(b => b.onclick = () => { SFX.tap(); duAuswahl = duAuswahl.filter(g => g.id !== b.dataset.raus); neuZeichnen(); });
  if ($("duLos")) $("duLos").onclick = () => { if (!duAuswahl.length) return; SFX.tap(); const wahl = duAuswahl.slice(); const t = duTypAktuell(); duHerausfordern(wahl, t, t === "quiz" && weihAktiv() ? { weih: true } : {}); };
}
/* Duell-Art wählen und herausfordern (Revanche, Profil): die bisherige Art ist markiert, eine andere wird vorgeschlagen */
function duTypWahl(r, bisher, revanche = false) {
  const andere = Object.keys(DU_TYPEN).filter(t => t !== bisher);
  const vorschlag = bisher ? (DU_TYPEN[bisher].art === "vers" ? "blitz" : DU_TYPEN[bisher].art === "blitz" ? "kette-at" : "vers") : null;
  let wahl = vorschlag || duTypAktuell();
  const marken = {}; if (bisher) marken[bisher] = "wie eben"; if (vorschlag && andere.includes(vorschlag)) marken[vorschlag] = "Vorschlag";
  const m = modal(`<div class="label">${revanche ? "Revanche" : "Duell"} gegen</div><h2 style="margin:0">${esc(r.name)}</h2>
    <p class="small muted" style="margin:0">${bisher ? "Noch einmal dasselbe – oder diesmal eine andere Duell-Art?" : "Welche Duell-Art?"}</p>
    ${duTypKacheln(wahl, "data-mtyp", marken)}<p class="small muted du-typ-info" id="duMInfo">${esc(DU_TYPEN[wahl].info)}</p>
    <button class="btn primary du-fordern" data-close="los" id="duMLos">${svg("bolt")} ${esc(DU_TYPEN[wahl].name)}-Duell starten</button><button class="btn ghost" data-close>Abbrechen</button>`,
    x => { if (x !== "los") return; S.duTyp = wahl; save(); const los = () => duHerausfordern(r, wahl, wahl === "quiz" && weihAktiv() ? { weih: true } : {}); if (duListe) los(); else duAktualisieren().then(los); });
  m.dataset.frei = "1";
  m.querySelectorAll("[data-mtyp]").forEach(b => b.onclick = () => { SFX.tap(); wahl = b.dataset.mtyp;
    m.querySelectorAll("[data-mtyp]").forEach(x => x.setAttribute("aria-checked", x === b)); $("duMInfo").textContent = DU_TYPEN[wahl].info;
    $("duMLos").innerHTML = `${svg("bolt")} ${esc(DU_TYPEN[wahl].name)}-Duell starten`; });
}
/* r = ein Gegner {id, name} oder eine Liste (Mehrfach-Herausforderung, bis DU_MAX_AUSWAHL) */
function duHerausfordern(r, typ = duTypAktuell(), extra = {}) {
  if (!duOk()) { go("duelle"); return; }
  const offen = (duListe || []).filter(d => d.von === S.pid && duStatus(d) === "offen");
  const alle = (Array.isArray(r) ? r : [r]).filter((g, i, l) => g && g.id && g.id !== S.pid && l.findIndex(x => x.id === g.id) === i);
  const laeuft = alle.filter(g => offen.some(d => d.an === g.id)), ziele = alle.filter(g => !laeuft.includes(g)).slice(0, DU_MAX_AUSWAHL);
  if (!ziele.length) { if (laeuft.length) toast(`${svg("bolt", "var(--muted)")}<div>Gegen ${esc(duNamenText(laeuft))} läuft schon ein Duell.</div>`); return; }
  if (offen.length + ziele.length > DU_MAX_OFFEN) { const frei = Math.max(0, DU_MAX_OFFEN - offen.length);
    toast(`${svg("bolt", "var(--muted)")}<div>${frei ? `Du kannst nur noch ${frei} ${frei === 1 ? "Gegner" : "Gegner"} herausfordern (höchstens ${DU_MAX_OFFEN} offene Duelle).` : `Du hast schon ${DU_MAX_OFFEN} offene Duelle.`}</div>`); return; }
  const T = DU_TYPEN[typ] || DU_TYPEN.vers;
  const seed = crypto.getRandomValues(new Uint32Array(1))[0] % 2147483647;
  duAuswahl = [];
  duSpielStarten(Object.assign({ neu: true, an: ziele[0].id, gegner: ziele.length === 1 ? ziele[0].name : `${ziele.length} Gegner`, ziele: ziele.map(g => ({ id: g.id, name: g.name })),
    seed, art: T.art, k: T.art === "vers" ? duVerseKey() : T.k }, extra));
}

/* ----- Das Duell selbst: eine Frage pro Bildschirm, Zeitbalken, sofortige Rückmeldung ----- */
function duSpielStarten(opt) {
  duWahl = false;
  go("duell");
  const art = DU_TYPEN[opt.art === "kette" ? "kette-" + opt.k : opt.art] ? opt.art : "vers";
  duSpiel = Object.assign({ i: 0, p: 0, r: 0, f: 0, combo: 0, maxCombo: 0, rest: DU_BLITZ_SEK, gesendet: false }, opt, { art });
  duSpiel.fragen = duFragen(opt.seed, art, opt.k, opt.erstellt ? weekKey(opt.erstellt) : weekKey(), !!opt.weih);
  document.body.classList.add("spiel-laeuft");
  if (art === "quiz") { duSpiel.modus = "duell"; countdown(() => bibStart(duSpiel), cdDuell()); return; }
  countdown(() => { duSpiel.t0 = Date.now(); if (art === "blitz") duBlitzUhr(); duZeige(); }, cdDuell());
}
/* Blitz: eine gemeinsame Uhr über alle Fragen */
function duBlitzUhr() {
  const D = duSpiel, t = setInterval(() => {
    if (duSpiel !== D || D.abgeschlossen) { clearInterval(t); return; }
    D.rest = Math.max(0, D.rest - 0.1);
    const z = $("duZeit"); if (z) z.style.width = D.rest / DU_BLITZ_SEK * 100 + "%";
    const s = $("duSek"); if (s) s.textContent = Math.ceil(D.rest) + " s";
    if (D.rest <= 10 && Math.abs(D.rest - Math.round(D.rest)) < 0.05) SFX.tick();
    if (D.rest <= 0) { clearInterval(t); duAbschluss(); }
  }, 100);
  timers.push(t);
}
function duAbschluss() { const D = duSpiel; if (!D || D.abgeschlossen) return; D.abgeschlossen = true; duEnde(); }
VIEWS.duell = () => { screen.innerHTML = ""; };
function duZeige() {
  const D = duSpiel; if (!D || current !== "duell" || D.abgeschlossen) return;
  if (D.i >= D.fragen.length || D.aus) return duAbschluss();
  const f = D.fragen[D.i], blitz = D.art === "blitz", kette = D.art === "kette", sek = kette ? DU_KETTE_SEK : DU_SEK;
  const fortschritt = blitz ? (DU_BLITZ_SEK - D.rest) / DU_BLITZ_SEK : D.i / D.fragen.length;
  const mult = () => Math.min(1 + Math.floor(D.combo / 5), 5);
  const titel = blitz ? `Blitz · <span id="duSek">${Math.ceil(D.rest)} s</span>${D.combo >= 2 ? ` · Combo ${D.combo} · x${mult()}` : ""}`
    : kette ? `${esc(DU_TYPEN["kette-" + D.k].name)} · Buch ${D.i + 1}/${D.fragen.length}` : `Frage ${D.i + 1}/${D.fragen.length}${f.k !== D.k ? ` · Lernvers ${esc(monatName(f.k))}` : ""}`;
  screen.innerHTML = `<div class="vl du-spiel du-${D.art}">
    <div class="vl-kopf"><button class="vl-x" id="duX" aria-label="Duell abbrechen">${svg("back")}</button>
      <div class="vl-bar du-bar"><i style="width:${fortschritt * 100}%"></i></div><span class="du-punkte">${D.p}</span></div>
    <span class="vl-titel du-titel">${svg(blitz ? "bolt" : kette ? "link" : "bolt")} ${esc(D.gegner)} · ${titel}</span>
    <div class="du-zeit">${blitz ? `<i id="duZeit" class="global" style="width:${D.rest / DU_BLITZ_SEK * 100}%"></i>` : `<i id="duZeit" style="animation-duration:${sek}s"></i>`}</div>
    ${f.start ? `<div class="du-frage-buch"><span class="qsub">${esc(f.start)}</span></div>`
      : f.buch ? `<div class="du-frage-buch"><span class="qsub">${esc(f.label || "Was kommt nach")}</span><b class="du-buch">${esc(f.buch)}</b>${f.gruppe ? `<span class="qsub">${esc(f.gruppe)}</span>` : ""}</div>`
      : `<h2 class="vl-frage">${f.frage}</h2><div class="vl-vers">${f.vers}</div>`}
    <div class="vl-wahl ${f.lang ? "" : "du-kurz"} ${f.buch || f.start ? "du-buecher" : ""}">${f.opts.map((o, j) => `<button class="vl-opt" data-o="${j}">${esc(o)}</button>`).join("")}</div>
  </div>`;
  const start = performance.now(); let fertig = false;
  const antworten = (j, el) => {
    if (fertig || D.abgeschlossen) return; fertig = true;
    const ok = j != null && f.opts[j] === f.loesung, rest = Math.max(0, sek - (performance.now() - start) / 1000);
    const zeitEl = $("duZeit"); if (zeitEl && !blitz) zeitEl.style.animationPlayState = "paused";
    screen.querySelectorAll(".vl-opt").forEach(b => { b.disabled = true; const o = f.opts[+b.dataset.o]; if (o === f.loesung) b.classList.add("richtig"); else if (b === el) b.classList.add("falsch"); });
    if (ok) {
      D.combo++; D.maxCombo = Math.max(D.maxCombo, D.combo);
      const pkt = blitz ? 100 + 20 * (mult() - 1) : 100 + Math.round(50 * rest / sek); D.p += pkt; D.r++;
      SFX.right(blitz ? D.combo : D.r); vibrate(12); if (el) { const [x, y] = centerOf(el); floatText("+" + pkt, x, y); burst(x, y, 12, { speed: 4 }); }
      if (blitz && D.combo % 5 === 0) { tone(1568, 0, .15, "sine", .12); shakeScreen(); }
    } else {
      D.f++; D.combo = 0; SFX.wrong(); vibrate([40, 30, 40]);
      if (blitz) { D.rest = Math.max(0, D.rest - 3); shakeScreen(); }
      else if (j == null) toast(`${svg("sun", "var(--muted)")}<div>Zeit ist um!</div>`);
      if (kette) D.aus = true;
    }
    const pk = screen.querySelector(".du-punkte"); if (pk) pk.textContent = D.p;
    timers.push(setTimeout(() => { D.i++; duZeige(); }, blitz ? (ok ? 320 : 700) : kette ? (ok ? 450 : 1600) : ok ? 750 : 1500));
  };
  screen.querySelectorAll(".vl-opt").forEach(b => b.onclick = () => antworten(+b.dataset.o, b));
  if (!blitz) timers.push(setTimeout(() => antworten(null, null), sek * 1000));
  $("duX").onclick = () => {
    SFX.tap();
    modal(`<div class="label">Duell abbrechen?</div><h2>Gegen ${esc(D.gegner)}</h2><p class="muted">${D.neu ? "Die Herausforderung wird dann nicht gesendet." : "Du kannst später noch einmal neu anfangen."}</p><button class="btn primary" data-close="weiter">Weiterspielen</button><button class="btn ghost" data-close="ende">Abbrechen</button>`,
      r => { if (r === "ende") { D.abgeschlossen = true; duSpiel = null; go(D.heim || heimAnsicht("duelle")); } });
  };
}
/* 6.77: Duell-XP je Spielart (Grundwert + XP je Richtige, Obergrenze je Art). Zweitprofile zählen wie Einzelspiel, ab dem
   DU_TAGE_VOLL-ten Duell am Tag nur noch halb – so lohnt sich Duellieren mit vielen verschiedenen Mitspielern, nicht mit Absprachen. */
function duXpTagStand() { const t = today(), d = S.duXpTag; return d && d.t === t ? d.n | 0 : 0; }
/* 6.83: Wiederholungen am selben Tag – milde Stufen: 1.–4. Runde voll, ab der 5. Runde 75 %, ab der 10. Runde 50 % (XP und Talente).
   Gezählt wird je Spielart: Blitz, jede Kette einzeln (Bibel, AT, NT, Rückwärts), Lückenquiz, jede Lektion einzeln, Biblionär solo –
   und bei Duellen je Gegner (egal welche Duell-Art). Neuer Tag = wieder volle Belohnung. */
const WDH_STUFEN = [[10, 0.5], [5, 0.75]];
const wdhFaktorBei = (nr, stufen) => { for (const [ab, f] of (stufen || WDH_STUFEN)) if (nr >= ab) return f; return 1; };
/* 6.99: Lektionen werden je Lektion und Tag strenger gestaffelt: 1. Mal 100 %, 2. Mal 75 %, 3. Mal 50 %, 4. Mal 25 %, ab dem 5. Mal keine XP
   und keine Talente mehr (Sterne und Fortschritt zählen weiter, neuer Tag = wieder voll). Ersetzt für Lektionen die milden Stufen. */
const LEKTION_WDH = [[5, 0], [4, 0.25], [3, 0.5], [2, 0.75]];
function wdhStand() { const t = today(); if (!S.spWdh || S.spWdh.t !== t) S.spWdh = { t, n: {} }; return S.spWdh.n; }
/* zählt eine Runde der Spielart key und gibt Faktor, Nummer und Hinweis zurück */
function spielWdh(key, stufen) {
  const n = wdhStand(), nr = (n[key] | 0) + 1; n[key] = nr;
  const f = wdhFaktorBei(nr, stufen);
  return { f, nr, d: f < 1 ? ` · ${nr}. Runde heute ×${f}` : "",
    hinweis: f === 0 ? `<div class="small muted wdh-hinw">Diese Lektion hast du heute schon ${nr - 1}× geschafft – dafür gibt es heute keine XP mehr. Morgen gibt es wieder die volle Belohnung.</div>`
      : f < 1 ? `<div class="small muted wdh-hinw">Heute schon ${nr - 1}× gespielt – ${Math.round(f * 100)} % der Belohnung. Morgen gibt es wieder die volle.</div>` : "" };
}
const wdhMal = (v, w) => (w && w.f < 1 ? Math.round(v * w.f) : v);
/* 6.83: Gleicher Gegner – ab dem 5. Duell am selben Tag gegen dieselbe Person (egal, wer herausfordert) gibt es nur noch die halbe
   Belohnung (XP und Talente). Gezählt wird je gespielter Runde; bei einer Mehrfach-Herausforderung je Gegner, die XP werden dann
   anteilig gekürzt (z. B. 1 von 4 Gegnern schon 4× heute → 1/8 weniger). */
const DU_GLEICH_VOLL = 4;
function duGleichStand() { const t = today(); if (!S.duGT || S.duGT.t !== t) S.duGT = { t, n: {} }; return S.duGT.n; }
const duGleichEinzel = id => 1; /* 6.93: Duelle werden nie gekürzt (vorher: ab dem 5. Duell gegen dieselbe Person Stufen 75/50 %) */
function duGleichFaktor(ids) { return 1; }
function duGleichZaehlen(ids) { const n = duGleichStand(); (ids || []).filter(Boolean).forEach(id => { n[id] = (n[id] | 0) + 1; }); save(); }
function duXpTagZaehlen() { const t = today(); S.duXpTag = { t, n: (S.duXpTag && S.duXpTag.t === t ? S.duXpTag.n | 0 : 0) + 1 }; save(); }
function duXpWert(D, ziele) {
  const art = DU_PRO[D.art] ? D.art : "blitz", roh = DU_XP + DU_PRO[art] * Math.min(D.r | 0, DU_MAXR[art]);
  /* 6.93: Duelle sind sozial erwünscht – XP und Talente immer zu 100 % (keine Kürzung für spätes Duell am Tag, gleichen Gegner oder eigenes Profil) */
  return Math.max(1, roh);
}
async function duEnde() {
  const D = duSpiel, L = window.LB, n = D.art === "blitz" ? Math.max(1, D.r + D.f) : D.fragen.length;
  const erg = { p: D.p, r: D.r, n };
  let xp = 0;
  if (!D.belohnt) { D.belohnt = true; S.duSpiele = (S.duSpiele || 0) + 1; S.duArten = [...new Set([...(S.duArten || []), D.art])];
    if (D.art === "kette" && D.r === D.fragen.length) S.duKetteVoll = true;
    richtig(D.r); quest("runde", 1); if (D.art === "blitz") quest("blitz", 1); if (D.art === "kette") quest("ketteGespielt", 1); save(); }
  /* zählt erst, wenn Herausforderung bzw. Antwort wirklich angekommen ist */
  const ziele = D.ziele || [{ id: D.an, name: D.gegner }], viele = ziele.length > 1;
  /* 6.83: Kürzung beim gleichen Gegner – einmal je Runde festlegen und zählen (auch bei „Nochmal senden“ nur einmal) */
  const gegnerIds = D.neu ? ziele.map(z => z.id) : [D.vonPid];
  if (D.gleichF == null) { D.gleichF = duGleichFaktor(gegnerIds); D.gleichEinzel = D.neu ? Object.fromEntries(ziele.map(z => [z.id, duGleichEinzel(z.id)])) : null; duGleichZaehlen(gegnerIds); }
  xp = duXpWert(D, ziele);
  const angekommen = () => { if (D.gezaehlt) return; D.gezaehlt = true; if (D.neu) S.duGesendet = (S.duGesendet || 0) + ziele.length; else S.duAngenommen = (S.duAngenommen || 0) + 1; quest("duell", 1); save(); };
  let titel, zeile, tal = 0, sieg = false, remis = false, fehler = false, weg = false;
  try {
    if (D.neu) {
      /* je Gegner ein eigenes Duell mit demselben Startwert; bei einem Fehler werden beim nächsten Versuch nur die fehlenden gesendet */
      D.ok = D.ok || [];
      for (const g of ziele) if (!D.ok.includes(g.id)) { D.id = await L.duellAnlegen({ art: D.art, von: S.pid, an: g.id, vonName: S.lbName, anName: g.name, k: D.k, seed: D.seed, vonErg: erg, weih: D.weih }); D.ok.push(g.id); duListe = null;
        /* späterer Sieg-/Remis-Lohn für dieses Duell ebenfalls gekürzt, wenn es heute schon das 5.+ gegen diesen Gegner war */
        const f = D.gleichEinzel ? D.gleichEinzel[g.id] : 1; if (f < 1 && D.id) { S.duKurz = Object.assign({}, S.duKurz || {}); S.duKurz[D.id] = f; const ks = Object.keys(S.duKurz); while (ks.length > 60) delete S.duKurz[ks.shift()]; save(); } }
      D.gesendet = true;
      angekommen();
      titel = viele ? `${ziele.length} Herausforderungen gesendet!` : "Herausforderung gesendet!";
      zeile = viele ? `${esc(duNamenText(ziele))} bekommen dieselben Fragen und haben 7 Tage Zeit. Jedes Duell wird einzeln gewertet.`
        : `${esc(D.gegner)} bekommt dieselben Fragen und hat 7 Tage Zeit. Du siehst das Ergebnis hier und auf der Startseite.`;
    } else {
      if (!D.gesendet) { await L.duellErgebnis(D.id, erg, S.pid); D.gesendet = true; duListe = null; }
      angekommen();
      const vgl = duVgl({ r: D.r, p: D.p }, D.gegnerErg, D.art); sieg = vgl > 0; remis = vgl === 0;
      /* Fairplay: wer eine Herausforderung annimmt, bekommt immer etwas – dazu Sieg/Remis */
      if (!D.talGegeben) { D.talGegeben = true; tal = Math.round((DU_FAIR_TAL + (sieg ? DU_SIEG_TAL : vgl === 0 ? DU_REMIS_TAL : 0)) * (D.gleichF != null ? D.gleichF : 1)); if (sieg) S.duSiege = (S.duSiege || 0) + 1; save(); }
      titel = sieg ? "Gewonnen!" : vgl === 0 ? "Unentschieden!" : "Knapp vorbei!";
      zeile = sieg ? (D.art === "quiz" && D.r === (D.gegnerErg.r | 0) ? `Gleich viele richtige Antworten – deine höhere Wertung entscheidet. Du hast ${esc(D.gegner)} besiegt.` : `Du hast ${esc(D.gegner)} besiegt.`) : vgl === 0 ? "Genau gleich viele richtige Antworten – egal, wer schneller war!" : `${esc(D.gegner)} war diesmal besser – fordere eine Revanche!`;
    }
  } catch (e) {
    /* Hat der Herausforderer das Duell inzwischen abgebrochen? Dann gibt es nichts mehr zu senden. */
    if (!D.neu) { try { await duAktualisieren(); weg = !duFehler && !(duListe || []).some(x => x.id === D.id); } catch (e2) {} }
    if (weg) { titel = "Herausforderung zurückgezogen"; zeile = `${esc(D.gegner)} hat dieses Duell abgebrochen. Deine XP für die Runde bekommst du trotzdem.`; }
    else { fehler = true; titel = "Nicht gesendet";
      zeile = D.neu && D.ok && D.ok.length ? `${D.ok.length} von ${ziele.length} Herausforderungen sind angekommen. Prüfe dein Internet und sende den Rest nochmal.` : "Die Verbindung hat nicht geklappt. Prüfe dein Internet und versuche es nochmal."; }
  }
  if (D.gleichF < 1 && !fehler && !weg) zeile += `<br><span class="small">${Math.round(D.gleichF * 100)} % der Belohnung: ${viele ? "gegen einige von ihnen" : "gegen " + esc(D.gegner)} heute schon ${DU_GLEICH_VOLL}× oder öfter gespielt.</span>`;
  const typ = D.art === "kette" ? "kette-" + D.k : D.art, ich = { r: D.r, n };
  const extra = D.art === "blitz" && D.maxCombo >= 2 ? ` · beste Combo ${D.maxCombo}` : D.art === "kette" && D.r === D.fragen.length ? " · ganze Kette!"
    : D.art === "quiz" ? (D.p >= BIB_LEITER[14] ? " · Biblionär!" : D.raus ? " · ausgestiegen" : "") : "";
  const gegnerSpalte = `<div class="du-vs-sp offen"><span>${esc(D.gegner)}</span><b>?</b><small>${viele ? "sind dran" : "ist dran"}</small></div>`;
  function xpGeben(ms) { if (D.xpGegeben) return; D.xpGegeben = true; duXpTagZaehlen(); setTimeout(() => { addXp(xp, null, ziele.some(z => eigenePid(z.id)) ? "duelleigen" : "duell", { t0: D.t0, f: D.r, fm: (D.fragen || []).length, d: `${(DU_TYPEN[typ] && DU_TYPEN[typ].name) || D.art} · ${D.neu ? "Herausforderung" : "angenommen"}${D.gleichF < 1 ? " · gleicher Gegner ×" + (Math.round(D.gleichF * 100) / 100) : ""}` }); if (tal) addTal(tal); checkBadges(); lbSync(); }, ms); }
  /* 6.62: Gegenspieler – Auflösung im Siegelbruch-Stil; Titel, Belohnung und Knöpfe erst danach */
  const aufl = !D.neu && !fehler && !weg;
  if (aufl) {
    screen.innerHTML = `<div class="vl vl-ende du-ende sb-ende">
    <div class="sb-kopf"><small>${duMarke({ art: D.art, k: D.k })}</small><b>Du gegen ${esc(D.gegner)}</b></div>
    ${sbHtml({ gegner: D.gegner, du: { p: D.p, r: D.r, n }, er: D.gegnerErg, art: D.art })}
    <h1 class="sb-spaet${sieg || remis ? "" : " leise"}">${titel}</h1><p class="muted sb-spaet">${zeile}${extra ? `<br><span class="small">${extra.replace(/^ · /, "")}</span>` : ""}</p>
    <div class="vle-werte sb-spaet"><div><b>+${xp}</b><span>XP</span></div>${tal ? `<div><b>+${tal}${TAL_MUENZE}</b><span>${tal > DU_FAIR_TAL ? "Talente" : "Fairplay"}</span></div>` : ""}</div>
    <div class="sb-spaet sb-knoepfe"><button class="btn ghost breit${sieg ? "" : " puls"}" id="duRevanche">${svg("bolt")} ${sieg ? "Nochmal duellieren" : "Revanche"}</button>
    <button class="btn primary breit" id="duFertig">${D.heim === "bib" ? "Zurück zu Biblionär" : "Zurück zu " + heimName("duelle")}</button></div></div>`;
    const wurzel = screen.querySelector(".sb-ende");
    /* XP/Level-Aufstieg erst nach der Auflösung, damit nichts das Ergebnis vorwegnimmt */
    sbStarten(wurzel, { gegner: D.gegner, du: { p: D.p, r: D.r, n }, er: D.gegnerErg, art: D.art }, (s, r) => { sbSchluss(wurzel, s || r); xpGeben(900); });
  } else
  screen.innerHTML = `<div class="vl vl-ende du-ende">
    <div class="vle-ic ${sieg ? "" : D.art === "quiz" ? "bib-ic" : "du"}">${svg(sieg ? "crown" : D.art === "quiz" ? "biblionaer" : "bolt")}</div>
    <h1>${titel}</h1><p class="muted">${zeile}</p>
    <div class="du-art-zeile">${duMarke({ art: D.art, k: D.k })}<span class="small muted">${esc(DU_TYPEN[typ].info)}</span></div>
    <div class="du-vs"><div class="du-vs-sp ${sieg ? "vorn" : ""}"><span>Du</span><b>${duP(D.p)}</b><small>${duErgText(D.art, ich)}${extra}</small></div><span class="du-vs-x">:</span>${gegnerSpalte}</div>
    <div class="vle-werte"><div><b>+${xp}</b><span>XP</span></div>${tal ? `<div><b>+${tal}${TAL_MUENZE}</b><span>${tal > DU_FAIR_TAL ? "Talente" : "Fairplay"}</span></div>` : ""}</div>
    ${fehler ? `<button class="btn primary breit" id="duNochmal">Nochmal senden</button>` : `<button class="btn primary breit" id="duFertig">${D.heim === "bib" ? "Zurück zu Biblionär" : "Zurück zu " + heimName("duelle")}</button>`}
    ${!D.neu && !fehler && !weg ? `<button class="btn ghost breit" id="duRevanche">${svg("bolt")} ${sieg ? "Nochmal duellieren" : "Revanche"}</button>` : ""}</div>`;
  if (!aufl && !fehler && !weg) SFX.coin(); /* Herausforderung gesendet: kleiner Ton, kein Sieg-Effekt */
  const weiter = () => { duSpiel = null; go(D.heim || heimAnsicht("duelle")); };
  if ($("duFertig")) $("duFertig").onclick = () => { SFX.tap(); weiter(); };
  if ($("duNochmal")) $("duNochmal").onclick = () => { SFX.tap(); duEnde(); };
  if ($("duRevanche")) $("duRevanche").onclick = () => { SFX.tap(); duSpiel = null;
    if (D.heim === "bib") { go("bib"); bibRevanche({ id: D.vonPid, name: D.gegner }, !sieg); return; }
    go("duelle"); duTypWahl({ id: D.vonPid, name: D.gegner }, typ, !sieg); };
  if (!aufl) xpGeben(350);
}

/* ---------- Biblionär (v6.40) ----------
   15 Bibelfragen (5 leicht, 5 mittel, 5 schwer) mit Gewinnleiter wie im Fernsehen, 3 Joker, Aussteigen ab Frage 2.
   Drei Wege ins Spiel: Arena-Duell (gleiche Fragen über den Startwert), Solo-Übung (Spielen) und
   „Biblionär der Woche“ (gleiche Fragen für alle in dieser Kalenderwoche, ein Versuch, Rangliste unter Gemeinde). */
const BIB_LEITER = [50, 100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 500000, 1000000];
const BIB_SICHER = [4, 9];               // Sicherheitsstufen: Frage 5 (500) und Frage 10 (16.000)
const BIB_SEK = 30;                      // Bedenkzeit je Frage
const BIB_WOCHE_TAL = 5;                 // Teilnahme an der Wochenrunde
const BIB_SIEG_TAL = 20;                 // Platz 1 der Vorwoche (mind. 3 Teilnehmer)
const pkt = n => (+n || 0).toLocaleString("de-DE");
/* Punkte, die nach „erreicht“ richtigen Antworten sicher sind */
const bibGesichert = erreicht => { let s = 0; BIB_SICHER.forEach(i => { if (erreicht > i) s = BIB_LEITER[i]; }); return s; };
const bibWocheSeed = wk => hash("biblionaer-" + wk) % 2147483647;
const bibVorwoche = () => weekKey(Date.now() - 7 * 864e5);
const bibWocheTage = () => { const d = new Date(), wt = (d.getDay() + 6) % 7; return 7 - wt; }; // inkl. heute bis Sonntag

/* Fragen aus dem Startwert: Auswahl, Antwort-Reihenfolge und die Joker-Ergebnisse sind für alle gleich */
/* stand: Kalenderwoche, aus deren Fragenpool gezogen wird (Duell: Woche der Herausforderung) – neue Fragen mit ab: … ändern so keine alten Runden */
function bibFragen(seed, stand, pool) {
  const alt = Math.random; Math.random = rngVon(seed); stand = stand || weekKey();
  try {
    const alle = pool ? pool.map(q => Object.assign({ thema: "Advent" }, q)) : QUIZ_THEMEN.flatMap(t => t.fragen.filter(q => (!q.ab || q.ab <= stand) && (!q.bis || stand < q.bis)).map(q => Object.assign({ thema: t.name }, q)));
    const stufe = st => { const gew = [], themen = []; for (const q of shuffle(alle.filter(x => x.st === st))) {
        if (gew.length >= 5) break; if (!pool && themen.filter(t => t === q.thema).length >= 2) continue; gew.push(q); themen.push(q.thema); }
      return gew; };
    return [...stufe(1), ...stufe(2), ...stufe(3)].map(q => {
      const loesung = q.a[0], falsche = q.a.slice(1), opts = shuffle(q.a.slice()), weg = shuffle(falsche).slice(0, 2);
      /* Gemeinde-Joker: bei leichten Fragen weiß es die Gemeinde meist, bei schweren ist sie unsicherer */
      let richtigAnteil = [0, .66, .5, .36][q.st] + Math.random() * .16;
      const w = falsche.map(() => Math.random() + .25), sw = w.reduce((a, b) => a + b, 0);
      let ant = opts.map(o => (o === loesung ? richtigAnteil : (1 - richtigAnteil) * w[falsche.indexOf(o)] / sw));
      if (q.st === 3 && Math.random() < .18) { const j = ant.indexOf(Math.max(...ant.filter((_, k) => opts[k] !== loesung))), r = opts.indexOf(loesung); [ant[j], ant[r]] = [ant[r], ant[j]]; }
      let proz = ant.map(a => Math.round(a * 100)); proz[proz.indexOf(Math.max(...proz))] += 100 - proz.reduce((a, b) => a + b, 0);
      return { f: q.f, opts, loesung, ref: q.ref, st: q.st, thema: q.thema, weg, gemeinde: proz, weih: !!pool };
    }).map((q, idx) => Object.assign(q, { ws: hash("willi|" + seed + "|" + idx) }));
  } finally { Math.random = alt; }
}

/* Spiel starten. G: { modus: "duell" | "solo" | "woche", fragen, gegner? } – beim Duell ist G das Duell-Objekt selbst */
function bibStart(G) {
  Object.assign(G, { t0: Date.now(), i: 0, r: 0, gewonnen: 0, joker: { halb: false, gemeinde: false, tel: false }, halbBei: -1, hilfe: "", fertigGrund: "" });
  document.body.classList.add("spiel-laeuft");
  bibZeige(G);
}
const bibLeiterHtml = (G, kurz) => `<ol class="bib-leiter" aria-label="Gewinnleiter">${BIB_LEITER.map((p, k) => ({ p, k })).reverse().map(({ p, k }) =>
  `<li class="${k < G.i ? "ok" : ""} ${k === G.i && !G.fertigGrund ? "jetzt" : ""} ${BIB_SICHER.includes(k) || k === 14 ? "sicher" : ""}"><span>${k + 1}</span><b>${pkt(p)}</b></li>`).join("")}</ol>
  ${kurz ? "" : `<p class="small muted bib-leiter-info">Sicher sind 500 (ab Frage 5) und 16.000 Punkte (ab Frage 10). Aussteigen geht ab Frage 2.</p>`}`;
function bibLeiterZeigen(G, dauer) {
  const m = modal(`<div class="label">Gewinnleiter</div>${bibLeiterHtml(G, !!dauer)}${dauer ? "" : `<button class="btn primary" data-close>Weiter</button>`}`);
  m.classList.add("bib-leiter-modal"); m.dataset.frei = "1";
  if (dauer) setTimeout(() => m.remove(), dauer);
  return m;
}
function bibZeige(G) {
  if (G.abgeschlossen || G.fertigGrund) return;
  if (G.modus === "duell" && (current !== "duell" || duSpiel !== G)) return;
  if (G.modus !== "duell" && current !== "biblionaer") return;
  const f = G.fragen[G.i], halb = G.halbBei === G.i;
  const lang = f.opts.some(o => o.length > 22);
  const titel = G.modus === "duell" ? `${G.weih ? "Weihnachts-Duell" : "Duell"} gegen ${esc(G.gegner)}` : G.modus === "woche" ? `Biblionär der Woche · ${weekKey().split("-W")[1]}. KW` : G.modus === "advent" ? `Weihnachts-Biblionär · ${advRundeName(G.adv)}` : G.weih ? "Weihnachts-Biblionär" : "Biblionär";
  screen.innerHTML = `<div class="vl bib">
    <div class="vl-kopf"><button class="vl-x" id="bibX" aria-label="Spiel abbrechen">${svg("back")}</button>
      <button class="bib-leiste" id="bibLeiter" aria-label="Gewinnleiter ansehen"><span>Frage ${G.i + 1}/15</span><b>${pkt(BIB_LEITER[G.i])}</b></button></div>
    <span class="vl-titel bib-titel">${svg("biblionaer")} ${titel}</span>
    <div class="bib-stand"><span>${G.gewonnen ? `Erreicht <b>${pkt(G.gewonnen)}</b>` : "Noch keine Punkte"}</span><span>Sicher <b>${pkt(bibGesichert(G.i))}</b></span></div>
    <div class="du-zeit bib-zeit"><i id="bibZeit" style="animation-duration:${BIB_SEK}s"></i></div>
    <div class="bib-frage-box st${f.st}"><span class="bib-thema">${esc(f.thema)}</span><h2 class="bib-frage">${esc(f.f)}</h2></div>
    <div class="bib-antw ${lang ? "lang" : ""}">${f.opts.map((o, j) => `<button class="bib-opt" data-o="${j}" ${halb && f.weg.includes(o) ? 'disabled data-weg="1"' : ""}><i>${"ABCD"[j]}</i><span>${halb && f.weg.includes(o) ? "" : esc(o)}</span></button>`).join("")}</div>
    <div class="bib-hilfe" id="bibHilfe" aria-live="polite">${G.hilfe || ""}</div>
    <div class="bib-joker" role="group" aria-label="Joker">
      <button data-j="halb" ${G.joker.halb ? "disabled" : ""}><b>50:50</b><span>2 falsche weg</span></button>
      <button data-j="gemeinde" ${G.joker.gemeinde ? "disabled" : ""}>${svg("people")}<span>Gemeinde</span></button>
      <button data-j="tel" ${G.joker.tel ? "disabled" : ""}>${svg("telefon")}<span>Telefon</span></button></div>
    ${G.i >= 1 ? `<button class="btn ghost bib-raus" id="bibRaus">Aussteigen mit ${pkt(G.gewonnen)} Punkten</button>` : `<p class="small muted bib-tipp">Tipp: Jeder Joker hilft einmal pro Spiel.</p>`}
  </div>`;
  let fertig = false, pausiert = false, zeitRest = BIB_SEK * 1000, zeitAb = performance.now();
  let zeit = setTimeout(() => antworten(null, null), zeitRest); timers.push(zeit);
  /* Während des Telefonats (Kontaktwahl und Gespräch) steht die Uhr */
  const zeitPause = () => { if (fertig || pausiert) return; pausiert = true; clearTimeout(zeit); zeitRest -= performance.now() - zeitAb; const z = $("bibZeit"); if (z) z.style.animationPlayState = "paused"; };
  const zeitWeiter = () => { if (fertig || !pausiert || G.abgeschlossen) return; pausiert = false; zeitAb = performance.now(); zeit = setTimeout(() => antworten(null, null), Math.max(300, zeitRest)); timers.push(zeit); const z = $("bibZeit"); if (z) z.style.animationPlayState = "running"; };
  const tick = setInterval(() => { if (fertig || pausiert) return; const el = $("bibZeit"); if (!el) return clearInterval(tick); const rest = (zeitRest - (performance.now() - zeitAb)) / 1000; if (rest <= 5 && rest > 0 && Math.abs(rest - Math.round(rest)) < .06) SFX.tick(); }, 100); timers.push(tick);
  function antworten(j, el) {
    if (fertig || G.abgeschlossen) return; fertig = true; clearTimeout(zeit);
    const z = $("bibZeit"); if (z) z.style.animationPlayState = "paused";
    screen.querySelectorAll(".bib-opt,#bibRaus").forEach(b => (b.disabled = true));
    const jk = screen.querySelector(".bib-joker"); if (jk) jk.classList.add("gesperrt");
    if (el) { el.classList.add("eingeloggt"); SFX.tap(); }
    const ok = j != null && f.opts[j] === f.loesung;
    timers.push(setTimeout(() => {
      screen.querySelectorAll(".bib-opt").forEach(b => { if (f.opts[+b.dataset.o] === f.loesung) b.classList.add("richtig"); else if (b === el) b.classList.add("falsch"); });
      if (ok) {
        G.r++; G.gewonnen = BIB_LEITER[G.i]; SFX.right(G.r); vibrate(15);
        const [x, y] = centerOf(el); burst(x, y, 14 + G.i * 2, { speed: 4 }); floatText("+" + pkt(BIB_LEITER[G.i] - (G.i ? BIB_LEITER[G.i - 1] : 0)), x, y);
        if (G.i === 14) { timers.push(setTimeout(() => bibFertig(G, "biblionaer"), 1400)); return; }
        if (BIB_SICHER.includes(G.i)) { tone(1568, 0, .2, "sine", .12); toast(`${svg("check", "var(--good)")}<div><b>${pkt(BIB_LEITER[G.i])} Punkte sind sicher!</b></div>`); }
        G.i++; G.hilfe = "";
        timers.push(setTimeout(() => { bibLeiterZeigen(G, 1500); timers.push(setTimeout(() => bibZeige(G), 1550)); }, 900));
      } else {
        SFX.wrong(); vibrate([40, 30, 40]); shakeScreen();
        if (j == null) toast(`${svg("sun", "var(--muted)")}<div>Die Zeit ist um!</div>`);
        G.letzte = f; timers.push(setTimeout(() => bibFertig(G, j == null ? "zeit" : "falsch"), 1800));
      }
    }, el ? (f.st === 3 ? 1700 : 1100) : 300));
  }
  screen.querySelectorAll(".bib-opt").forEach(b => b.onclick = () => antworten(+b.dataset.o, b));
  screen.querySelectorAll("[data-j]").forEach(b => b.onclick = () => {
    if (fertig) return; const art = b.dataset.j; if (G.joker[art]) return;
    if (art === "tel") { telefonJoker(b); return; }
    G.joker[art] = true; SFX.coin(); b.disabled = true;
    if (art === "halb") {
      G.halbBei = G.i;
      screen.querySelectorAll(".bib-opt").forEach(x => { if (f.weg.includes(f.opts[+x.dataset.o])) { x.disabled = true; x.dataset.weg = "1"; x.querySelector("span").textContent = ""; } });
    } else if (art === "gemeinde") {
      const zeilen = f.opts.map((o, k) => ({ o, k, w: f.gemeinde[k] })).filter(x => !(G.halbBei === G.i && f.weg.includes(x.o)));
      const summe = zeilen.reduce((a, x) => a + x.w, 0) || 1;
      G.hilfe = `<div class="bib-umfrage" role="img" aria-label="Die Gemeinde stimmt ab">${zeilen.map(x => { const p = Math.round(x.w / summe * 100); return `<div><i>${"ABCD"[x.k]}</i><span><em style="width:${p}%"></em></span><b>${p} %</b></div>`; }).join("")}</div>`;
      $("bibHilfe").innerHTML = G.hilfe;
    }
  });
  /* Telefonjoker: erst Kontakt wählen (Mitglieder: zwei Kontakte, sonst der Gastprediger), dann telefonieren – die Uhr steht dabei */
  function telefonJoker(b) {
    SFX.tap(); zeitPause();
    (meineGem() === GEM_STANDARD ? jokerLaden() : Promise.resolve(false)).then(() => { if (fertig || G.abgeschlossen) { zeitWeiter(); return; }
    telefonWahl(id => {
      if (fertig || G.abgeschlossen) return;
      G.joker.tel = true; SFX.coin(); b.disabled = true;
      const w = pastorAntwort(f, G.halbBei === G.i, id);
      pastorAnruf(w, () => {
        G.hilfe = `<div class="bib-stelle bib-willi">${svg("telefon")}<span>${PASTOREN[id].kurz} tippt auf <b>${esc(w.tipp)}</b> · ${w.grad}</span></div>`;
        const h = $("bibHilfe"); if (h) h.innerHTML = G.hilfe;
        zeitWeiter();
      });
    }, () => zeitWeiter(), !!f.weih); });
  }
  $("bibLeiter").onclick = () => { SFX.tap(); bibLeiterZeigen(G); };
  if ($("bibRaus")) $("bibRaus").onclick = () => {
    SFX.tap();
    modal(`<div class="label">Aussteigen?</div><h2 style="margin:0">${pkt(G.gewonnen)} Punkte mitnehmen</h2>
      <p class="muted">${bibGesichert(G.i) >= G.gewonnen ? "Deine Punkte sind schon sicher – du kannst ohne Risiko weiterspielen." : `Bei einer falschen Antwort fällst du auf ${pkt(bibGesichert(G.i))} Punkte zurück. Mit der nächsten Antwort wären es ${pkt(BIB_LEITER[G.i])}.`}</p>
      <button class="btn primary" data-close="weiter">Weiterspielen</button><button class="btn ghost" data-close="raus">Aussteigen</button>`,
      r => { if (r !== "raus" || fertig) return; fertig = true; clearTimeout(zeit); G.letzte = f;
        screen.querySelectorAll(".bib-opt").forEach(b => { b.disabled = true; if (f.opts[+b.dataset.o] === f.loesung) b.classList.add("richtig"); });
        timers.push(setTimeout(() => bibFertig(G, "raus"), 1500)); });
  };
  $("bibX").onclick = () => {
    SFX.tap();
    const text = G.modus === "duell" ? (G.neu ? "Die Herausforderung wird dann nicht gesendet." : "Du kannst später noch einmal neu anfangen.")
      : (G.modus === "woche" || G.modus === "advent") ? "Die Runde hat nur einen Versuch. Wenn du abbrichst, zählt sie mit 0 Punkten." : "Dein Fortschritt in dieser Runde geht verloren.";
    modal(`<div class="label">Spiel abbrechen?</div><h2>Biblionär</h2><p class="muted">${text}</p><button class="btn primary" data-close="weiter">Weiterspielen</button><button class="btn ghost" data-close="ende">Abbrechen</button>`,
      r => { if (r !== "ende") return; fertig = true; G.abgeschlossen = true; clearTimers();
        if (G.modus === "duell") { duSpiel = null; go(G.heim || heimAnsicht("duelle")); }
        else if (G.modus === "woche") { G.gewonnen = 0; G.fertigGrund = "abbruch"; bibErgebnis(G, 0); go("rank", "bibWoche"); }
        else if (G.modus === "advent") { G.gewonnen = 0; G.fertigGrund = "abbruch"; bibErgebnis(G, 0); go("advent"); }
        else go(heimAnsicht("bib")); });
  };
}
/* Ende: richtige Antworten, Punkte nach Leiter/Sicherheitsstufe */
function bibFertig(G, grund) {
  if (G.fertigGrund) return; G.fertigGrund = grund;
  const punkte = grund === "biblionaer" ? BIB_LEITER[14] : grund === "raus" ? G.gewonnen : bibGesichert(G.i);
  document.querySelectorAll(".bib-leiter-modal").forEach(m => m.remove());
  if (G.modus === "duell") { G.p = punkte; G.raus = grund === "raus"; bibErgebnis(G, punkte); G.abgeschlossen = true; duEnde(); return; }
  bibEnde(G, punkte);
}
/* Rekord, Wochenrunde, Zähler (für alle Wege gleich) */
function bibErgebnis(G, punkte) {
  if (G.gezaehlt) return; G.gezaehlt = true;
  if (G.modus === "advent" && advTestOn()) { A().advBib = Object.assign({}, A().advBib, { [G.adv]: punkte }); save(); return; } /* Testmodus: keine Zähler, keine Rekorde */
  S.bibSpiele = (S.bibSpiele || 0) + 1;
  if (punkte > (S.bibRekord || 0)) { G.rekord = !!S.bibRekord || punkte > 0; S.bibRekord = punkte; }
  if (punkte >= BIB_LEITER[14]) S.bibMillion = (S.bibMillion || 0) + 1;
  if (G.modus === "woche") { S.bwP = punkte; S.bwFertig = true; }
  if (G.modus === "advent") A().advBib = Object.assign({}, A().advBib, { [G.adv]: punkte });
  save();
}
function bibEnde(G, punkte) {
  bibErgebnis(G, punkte);
  const grund = G.fertigGrund, million = grund === "biblionaer", woche = G.modus === "woche", adv = G.modus === "advent";
  if (!woche && !adv && !G.wdh) G.wdh = spielWdh("bib-solo");
  const W = woche || adv ? null : G.wdh;
  const xp = adv && advTestOn() ? 0 : wdhMal(30 + 42 * G.r + (million ? 300 : 0), W);
  const tal = adv && advTestOn() ? 0 : wdhMal(Math.floor(G.r / 3) + (million ? 25 : 0) + (G.rekord && !woche ? 3 : 0), W) + (woche ? BIB_WOCHE_TAL : 0) + (adv ? ADV_BIB_TAL : 0);
  if (!G.belohnt) { G.belohnt = true; if (!(adv && advTestOn())) { richtig(G.r); quest("runde", 1); } save(); }
  const titel = million ? "Biblionär!" : grund === "raus" ? "Klug ausgestiegen!" : grund === "zeit" ? "Die Zeit ist um" : "Leider falsch";
  const zeile = million ? "Alle 15 Fragen richtig – du hast die Million!" : grund === "raus" ? `Du nimmst ${pkt(punkte)} Punkte mit.` : `Du fällst auf die Sicherheitsstufe zurück: ${pkt(punkte)} Punkte.`;
  const f = G.letzte;
  screen.innerHTML = `<div class="vl vl-ende bib-ende">
    <div class="vle-ic bib-ic">${svg(million ? "crown" : "biblionaer")}</div>
    <h1>${titel}</h1><p class="muted">${zeile}</p>
    <div class="bib-gross"><b>${pkt(punkte)}</b><span>Punkte · ${G.r} von 15 richtig${G.rekord && !million ? " · neuer Rekord!" : ""}</span></div>
    ${f && !million ? `<div class="bib-loesung"><span class="small muted">Frage ${G.i + 1}: ${esc(f.f)}</span><b>${svg("check", "var(--good)")} ${esc(f.loesung)}</b><span class="small muted">${svg("book")} ${esc(f.ref)}</span></div>` : ""}
    <div class="vle-werte"><div><b>+${xp}</b><span>XP</span></div><div><b>+${tal}${TAL_MUENZE}</b><span>Talente</span></div>${woche || adv ? "" : `<div><b>${pkt(S.bibRekord)}</b><span>Rekord</span></div>`}</div>
    ${adv ? `<p class="small muted" style="margin:0">Alle in der Gemeinde bekommen dieselben Fragen. Nächsten Sonntag gibt es neue.</p><button class="btn primary breit" data-go="advent">${svg("kerze")} Zurück zum Advent</button>`
      : woche ? `<p class="small muted" style="margin:0">Alle in der Gemeinde bekommen diese Woche dieselben Fragen. Am Montag gibt es neue.</p>
      <button class="btn primary breit" id="bibRang">${svg("trophy")} Zur Wochen-Rangliste</button><button class="btn ghost breit" data-go="${heimAnsicht("bib")}">Zurück zu ${heimName("bib")}</button>`
      : `<button class="btn primary breit" id="bibNochmal">${svg("biblionaer")} Nochmal spielen</button><button class="btn ghost breit" data-go="${heimAnsicht("bib")}">Zurück zu ${heimName("bib")}</button>`}
  </div>`;
  wireGo();
  if ($("bibNochmal")) $("bibNochmal").onclick = () => { SFX.tap(); bibSolo(); };
  if ($("bibRang")) $("bibRang").onclick = () => { SFX.tap(); go("rank", "bibWoche"); };
  SFX.win(); if (million) rain(140); else if (punkte >= 16000) rain(60);
  setTimeout(() => { if (xp) addXp(xp, null, "bib", { t0: G.t0, f: G.r, fm: 15, d: `${woche ? "Wochenrunde" : adv ? "Weihnachts-Woche" : "Solo"} · ${pkt(punkte)} Punkte${W ? W.d : ""}` }); if (tal) addTal(tal); checkBadges(); lbSync(); }, 350);
}
/* Solo-Übung (Spielen): zufällige Fragen */
VIEWS.biblionaer = () => { screen.innerHTML = ""; };
function bibSolo(weih) {
  go("biblionaer");
  const w = !!weih && weihnachtsDuellOk();
  const G = { modus: "solo", weih: w, fragen: bibFragen(crypto.getRandomValues(new Uint32Array(1))[0] % 2147483647, "", w ? ADV_ALLE_FRAGEN : null) };
  countdown(() => bibStart(G), cdSolo("quiz", { modus: w ? "Weihnachts-Solo" : "Solo" }));
}
/* ---------- 6.80: Wochen-Sicherung (Biblionär der Woche) ----------
   Wie bei der Schatztruhe: je Spieler und Serverwoche entsteht genau ein Dokument „bibversuch/<pid>_<Wochennummer>“ (nur anlegen).
   Wochennummer = Wochen seit Montag, 5.1.2026 (Mitteleuropäische Zeit); die Regeln rechnen mit der Serverzeit gegen. Das Dokument
   entsteht beim Start der Runde – wer abbricht, hat den Versuch verbraucht (wie bisher: 0 Punkte). */
const WOCHE_MS = 604800000, WOCHE_NULL = 1767571200000;   /* Montag 05.01.2026 00:00 UTC */
function berlinOffsetMs(ms) {
  const p = {}; new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(ms)).forEach(x => { p[x.type] = +x.value; });
  return Math.round((Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - Math.floor(ms / 6e4) * 6e4) / 36e5) * 36e5;
}
const serverWochenNr = ms => Math.floor((ms + berlinOffsetMs(ms) - WOCHE_NULL) / WOCHE_MS);
async function bibVersuchBuchen(ms) {
  const L = window.LB; if (!L || !L.ok || !L.bibVersuch || !S.pid || !S.lbName || S.offlineOnly) return "regeln";
  try { return await L.bibVersuch(S.pid, S.lbName, serverWochenNr(ms), weekKey(ms), APP_VERSION); } catch (e) { return "netz"; }
}
/* Wochenrunde: ein Versuch je Kalenderwoche; der Versuch zählt ab dem Start (Abbrechen = 0 Punkte) */
const bibWocheGespielt = () => S.bwK === weekKey() || S.bwGesperrt === weekKey();
function bibWocheStarten() {
  if (bibWocheGespielt()) { go("rank", "bibWoche"); return; }
  const wk = weekKey();
  modal(`<div class="label">Biblionär der Woche</div><h2 style="margin:0">${wk.split("-W")[1]}. Kalenderwoche</h2>
    <p class="muted">Alle in der Gemeinde bekommen dieselben 15 Fragen. Du hast <b>einen Versuch</b> – wer abbricht, bekommt 0 Punkte. Am Montag kommt die Siegerin oder der Sieger aufs Podest.</p>
    <button class="btn primary" data-close="los">${svg("biblionaer")} Los geht's</button><button class="btn ghost" data-close>Später</button>`, r => {
    if (r !== "los") return;
    bibWocheAnfang();
  });
}
let bibWocheLaeuft = false;
async function bibWocheAnfang() {
  if (bibWocheLaeuft) return; bibWocheLaeuft = true;
  try {
    const ms = await serverMs(), wk = weekKey(ms), e = await bibVersuchBuchen(ms);
    if (e === "schon") { S.bwGesperrt = wk; save(); toast(`${svg("biblionaer")}<div><b>Diese Woche schon gespielt</b><div class="small muted">Die Wochenrunde gibt es nur einmal – am Montag kommen neue Fragen.</div></div>`); go("rank", "bibWoche"); return; }
    if (e === "netz") { toast(`${svg("biblionaer")}<div><b>Keine Verbindung</b><div class="small muted">Die Wochenrunde braucht Internet, damit niemand sie doppelt spielt.</div></div>`); return; }
    if (e === "tag") { toast(`${svg("biblionaer")}<div><b>Datum passt nicht</b><div class="small muted">Bitte Datum und Uhrzeit deines Geräts prüfen (automatisch einstellen).</div></div>`); return; }
    if (S.bwK && S.bwK !== wk) { S.bwVK = S.bwK; S.bwVP = S.bwP | 0; }
    S.bwK = wk; S.bwP = 0; S.bwFertig = false; save(); lbSync(true);
    go("biblionaer");
    const G = { modus: "woche", fragen: bibFragen(bibWocheSeed(wk), wk) };
    countdown(() => bibStart(G), cdSolo("quiz", { modus: "Wochenrunde" }));
  } finally { bibWocheLaeuft = false; }
}
/* Sieger der Vorwoche: Platz 1 bekommt Krone (Abzeichen) und Talente – einmal pro Woche geprüft */
let bibVorwocheListe = null;
async function bibVorwocheLaden() {
  const L = window.LB; if (!L || !L.ok || !L.bibWoche) return null;
  const vw = bibVorwoche();
  try { bibVorwocheListe = { wk: vw, rows: (await L.bibWoche(vw)).filter(r => r.p > 0).sort((a, b) => b.p - a.p) }; } catch (e) { return null; }
  return bibVorwocheListe;
}
async function bibSiegerPruefen() {
  const vw = bibVorwoche();
  if (S.bwGeprueft === vw || !S.pid || !(S.bwK === vw || S.bwVK === vw)) return;
  const v = await bibVorwocheLaden(); if (!v) return;
  S.bwGeprueft = vw;
  const top = v.rows.length ? v.rows[0].p : 0;
  if (v.rows.length >= 3 && top > 0 && v.rows.some(r => r.id === S.pid && r.p === top) && !(S.bwSiege || []).includes(vw)) {
    S.bwSiege = [...(S.bwSiege || []), vw].slice(-60); S.tal += BIB_SIEG_TAL; renderHud();
    setTimeout(() => { SFX.badge(); rain(90); toast(`${svg("crown", "#f2c14e")}<div><b>Biblionär der Woche!</b><div class="small muted">Platz 1 in der ${vw.split("-W")[1]}. KW mit ${pkt(top)} Punkten · +${BIB_SIEG_TAL} Talente</div></div>`); }, 800);
    checkBadges(); lbSync();
  }
  save();
}
/* Karte über der Wochen-Rangliste: spielen bzw. eigenes Ergebnis, dazu der Sieger der Vorwoche */
/* 6.48: eine Leiste, für Gespielt / Diese Woche / Rekord gleich aufgebaut – Texte einzeilig (kein Umbruch) */
function bibInfoLeiste() {
  const online = !!(S.lbName && !S.offlineOnly), n = bibWocheTage();
  const leiste = (ic, titel, unter, rechts) => `<div class="bi-leiste">${svg(ic)}<span class="bi-tx"><b>${titel}</b><small>${unter}</small></span>${rechts}</div>`;
  const wert = w => `<b class="bi-wert">${w}</b>`;
  if (rankTab === "bibSpiele") return leiste("play", "Deine Spiele", "Solo, Wochenrunde und Duelle", wert(pkt(S.bibSpiele || 0)));
  if (rankTab === "bibRekord") { const st = BIB_LEITER.filter(p => p <= (S.bibRekord || 0)).length;
    return leiste("trophy", "Dein Rekord", st ? `Frage ${st} von 15 geschafft` : "Noch kein Spiel", wert(pkt(S.bibRekord || 0))); }
  const v = bibVorwocheListe && bibVorwocheListe.wk === bibVorwoche() ? bibVorwocheListe.rows : null;
  const sieger = v && v.length ? v.filter(r => r.p === v[0].p) : [];
  const vor = sieger.length ? `Letzte Woche: ${sieger.slice(0, 2).map(r => esc(r.name)).join(", ")}${sieger.length > 2 ? " u. a." : ""} · ${pkt(sieger[0].p)}` : "";
  if (!online) return leiste("crown", "Wochenrunde", "Nur mit Eintrag in der Rangliste", "");
  if (bibWocheGespielt()) return leiste("crown", "Deine Runde", vor || `Neue Fragen in ${n} ${n === 1 ? "Tag" : "Tagen"}`, wert(pkt(S.bwP)));
  return leiste("crown", "Wochenrunde", vor || `1 Versuch · noch ${n} ${n === 1 ? "Tag" : "Tage"}`, `<button class="bi-los" id="bwLos">${svg("biblionaer")}Spielen</button>`);
}
function bibWocheKarte() {
  const online = !!(S.lbName && !S.offlineOnly);
  const v = bibVorwocheListe && bibVorwocheListe.wk === bibVorwoche() ? bibVorwocheListe.rows : null;
  const sieger = v && v.length ? v.filter(r => r.p === v[0].p) : [];
  const vor = sieger.length ? `<div class="bw-vor">${svg("crown", "#f2c14e")}<span>Letzte Woche: <b>${sieger.slice(0, 3).map(r => esc(r.name)).join(", ")}</b>${sieger.length > 3 ? " u. a." : ""} · ${pkt(sieger[0].p)}</span></div>` : "";
  const n = bibWocheTage();
  const knopf = !online ? `<p class="small muted" style="margin:0">Für die Wochenrunde brauchst du einen Eintrag in der Gemeinde-Rangliste.</p>`
    : bibWocheGespielt() ? `<div class="bw-ich"><span>Deine Runde</span><b>${pkt(S.bwP)}</b><small>Neue Fragen in ${n} ${n === 1 ? "Tag" : "Tagen"}</small></div>`
    : `<button class="btn primary bw-los" id="bwLos">${svg("biblionaer")} Wochenrunde spielen</button><span class="small muted">1 Versuch · noch ${n} ${n === 1 ? "Tag" : "Tage"}</span>`;
  return `<div class="card bw-karte">${knopf}${vor}</div>`;
}

/* Symbol „biblionaer“ (6.43): Michaels eigenes Biblionär-Logo (icons/biblionaer-logo.webp) – überall statt des alten Symbols,
   auch in Fußleiste, Rangliste und Startkachel. Liegt als Bild im SVG, damit svg("biblionaer") wie bisher funktioniert. */
ICONS.biblionaer = `<image href="icons/biblionaer-logo.webp" x="-1" y="-1" width="26" height="26" preserveAspectRatio="xMidYMid meet"/>`;
/* Symbol „telefon“ (Belohnungs-/Joker-Violett) – beim nächsten Lauf des Symbol-Generators dorthin übernehmen */
/* 9.42: neues Laden-Symbol „Marktstand“ (Türkis) – beim nächsten Generator-Lauf nach werkzeuge/symbole-erzeugen.js übernehmen */
ICONS.shop = `<svg x="0" y="0" width="24" height="24" viewBox="0 0 64 64" overflow="visible" class="wr wr-lohn"><defs><linearGradient id="gSM" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6c2"/><stop offset=".5" stop-color="#f2c14e"/><stop offset="1" stop-color="#b57d1c"/></linearGradient><linearGradient id="aSM" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8fff0"/><stop offset=".55" stop-color="#3fd0c0"/><stop offset="1" stop-color="#12796f"/></linearGradient><linearGradient id="wSM" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfd8f5"/></linearGradient><radialGradient id="hSM"><stop offset="0" stop-color="#3fd0c0" stop-opacity=".55"/><stop offset="1" stop-color="#3fd0c0" stop-opacity="0"/></radialGradient></defs><circle cx="32" cy="32" r="31" fill="url(#hSM)"/><ellipse cx="32" cy="61" rx="22" ry="2.2" fill="#000" opacity=".3"/><path d="M12 28V56M52 28V56" stroke="#1b2a55" stroke-width="3.4"/><path d="M12 28V56M52 28V56" stroke="url(#gSM)" stroke-width="1.8"/><rect x="9" y="42" width="46" height="15" rx="2" fill="url(#aSM)" stroke="#1b2a55" stroke-width="1.2"/><path d="M9 42h46" stroke="url(#gSM)" stroke-width="3"/><circle cx="24" cy="37" r="4.6" fill="url(#gSM)" stroke="#1b2a55" stroke-width=".9"/><path d="M24 34.5v5M21.5 36.5h5" stroke="#1b2a55" stroke-width="1.2"/><path d="M36 39l3-6h6l3 6-6 5z" fill="url(#aSM)" stroke="#1b2a55" stroke-width=".9"/><path d="M36 39h12M39 33l3 11M45 33l-3 11" stroke="rgba(255,255,255,.7)" stroke-width=".7"/><path d="M12.00 10H18.67L14.67 24H6.00Z" fill="url(#gSM)" stroke="#1b2a55" stroke-width=".8"/><path d="M18.67 10H25.33L23.33 24H14.67Z" fill="url(#wSM)" stroke="#1b2a55" stroke-width=".8"/><path d="M25.33 10H32.00L32.00 24H23.33Z" fill="url(#gSM)" stroke="#1b2a55" stroke-width=".8"/><path d="M32.00 10H38.67L40.67 24H32.00Z" fill="url(#wSM)" stroke="#1b2a55" stroke-width=".8"/><path d="M38.67 10H45.33L49.33 24H40.67Z" fill="url(#gSM)" stroke="#1b2a55" stroke-width=".8"/><path d="M45.33 10H52.00L58.00 24H49.33Z" fill="url(#wSM)" stroke="#1b2a55" stroke-width=".8"/><path d="M6.00 24a4.33 4.33 0 0 0 8.67 0z" fill="url(#gSM)" stroke="#1b2a55" stroke-width=".8"/><path d="M14.67 24a4.33 4.33 0 0 0 8.67 0z" fill="url(#wSM)" stroke="#1b2a55" stroke-width=".8"/><path d="M23.33 24a4.33 4.33 0 0 0 8.67 0z" fill="url(#gSM)" stroke="#1b2a55" stroke-width=".8"/><path d="M32.00 24a4.33 4.33 0 0 0 8.67 0z" fill="url(#wSM)" stroke="#1b2a55" stroke-width=".8"/><path d="M40.67 24a4.33 4.33 0 0 0 8.67 0z" fill="url(#gSM)" stroke="#1b2a55" stroke-width=".8"/><path d="M49.33 24a4.33 4.33 0 0 0 8.67 0z" fill="url(#wSM)" stroke="#1b2a55" stroke-width=".8"/><path d="M14 12l-4 10" stroke="rgba(255,255,255,.8)" stroke-width="1.6" stroke-linecap="round"/><path class="wr-spark" d="M52 2.5l1.49 4.01 4.01 1.49-4.01 1.49-1.49 4.01-1.49-4.01-4.01-1.49 4.01-1.49z" fill="#fff"/></svg>`;
ICONS.telefon = `<svg x="0" y="0" width="24" height="24" viewBox="0 0 64 64" overflow="visible" class="wr wr-lohn"><circle class="wr-halo" cx="32" cy="32" r="31" fill="url(#wrH_lohn)"/><ellipse cx="32" cy="61" rx="17" ry="2.2" fill="#000" opacity=".3"/><path d="M15 9.5c2.6-1.9 6.3-1.2 7.6 1.8l4.2 9.4c1.1 2.5.2 5.4-2.1 6.8l-3.4 2.1c2.8 6.4 7.4 11.1 13.6 14.1l2.2-3.3c1.5-2.2 4.4-3 6.8-1.9l9.3 4.3c3 1.4 3.6 5.2 1.6 7.7l-3.6 4.4c-2.8 3.4-7.6 4.6-11.7 2.9C26.5 52.6 15.6 41.8 10.4 28.7 8.8 24.6 10 19.9 13.4 17.1z" fill="url(#wrG)" stroke="#1b2a55" stroke-width="1.6" stroke-linejoin="round"/><path d="M14.6 14.2c-2.4 2.7-3 6.6-1.6 10" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none" opacity=".75"/><path d="M37 8.5a19 19 0 0 1 18.5 18.5M37 16a11.5 11.5 0 0 1 11 11" stroke="url(#wrX_lohn)" stroke-width="3.4" stroke-linecap="round" fill="none"/><path d="M37 8.5a19 19 0 0 1 18.5 18.5M37 16a11.5 11.5 0 0 1 11 11" stroke="#1b2a55" stroke-width=".8" stroke-linecap="round" fill="none" opacity=".5"/><path class="wr-spark" d="M54 42.5l1.49 4.01 4.01 1.49-4.01 1.49-1.49 4.01-1.49-4.01-4.01-1.49 4.01-1.49z" fill="#fff"/></svg>`;
/* 9.11: Die Texte und Bilder von Willi und Aaron liegen verschlüsselt in joker.enc. */
/* Neutraler Telefonjoker für alle ohne Freischaltung: der Gastprediger (in anderen Gemeinden „Pastor“). Keine persönlichen Angaben. */
/* ---------- 9.11: Dritter Kontakt „Gastprediger“ – ein typischer Baptisten-Pastor ohne persönliche Geschichten.
   Willi und Aaron kennen nur die Spieler aus Eichstätt; alle anderen (andere Gemeinden, Gäste) rufen den Gastprediger an. ---------- */
const GAST_HALLO = [
  "Gelobt sei der Herr! Hier ist der Gastprediger – für eine Bibelfrage habe ich immer Zeit.",
  "Liebe Schwester, lieber Bruder – hier spricht der Gastprediger. Wie kann ich dienen?",
  "Gottes Segen! Gastprediger am Apparat. Ich war gerade bei der Predigtvorbereitung – genau der richtige Moment.",
  "Guten Tag, hier ist der Gastprediger! Ich sitze im Gemeindehaus, der Kaffee ist noch warm. Schieß los!",
  "Der Herr sei mit dir! Hier der Gastprediger – eine Bibel in der Hand und ein Gedanke im Herzen.",
  "Hallo, Gastprediger hier! Ich bin heute mal wieder zu Gast in einer Gemeinde – wie praktisch. Was liegt an?",
  "Friede sei mit dir! Gastprediger am Telefon. Die Frage klingt, als hätte ich dazu schon einmal gepredigt.",
  "Ja, hier ist der Gastprediger. Moment, ich leg nur schnell mein Predigtmanuskript beiseite – Punkt drei ist ohnehin noch nicht fertig."
];
const GAST_SICHER = [
  x => `Da brauche ich keine drei Punkte: ${x.X}. Das steht in ${x.ref}.`,
  x => `${x.X}! Darüber habe ich schon gepredigt – ${x.ref}. Amen!`,
  x => `Ganz klar ${x.X}. Schlag ${x.ref} auf, da steht es schwarz auf weiß.`,
  x => `${x.X} – so sicher wie das Amen nach dem Gebet. Lies ${x.ref} nach.`,
  x => `${x.X}! Diese Stelle ist mir so vertraut wie der Kaffee nach dem Gottesdienst. Sie steht in ${x.ref}.`,
  x => `Ohne Zweifel: ${x.X}. Ich habe ${x.ref} schon in mancher Gemeinde ausgelegt – und es wird nie langweilig.`,
  x => `${x.X}. Das lernt man schon im Kindergottesdienst – ${x.ref}.`,
  x => `Gelobt sei der Herr, das weiß ich genau: ${x.X}! Nachzulesen in ${x.ref}.`
];
const GAST_SICHER_OHNE = [
  x => `${x.X}. Das weiß ich so sicher wie das Amen in der Kirche.`,
  x => `Ganz klar ${x.X} – die Bibelbücher haben wir in der Jungschar rauf und runter aufgesagt.`,
  x => `${x.X}! Dafür muss ich nicht einmal die Bibel aufschlagen – obwohl ich es trotzdem täte.`,
  x => `Ohne Zweifel: ${x.X}. Das sitzt wie ein Lieblingslied im Gesangbuch.`
];
const GAST_ZIEMLICH = [
  x => `Ich bin ziemlich sicher: ${x.X}. Ich glaube, das steht in ${x.ref} – schau aber lieber nochmal nach.`,
  x => `Hm, ich würde ${x.X} sagen. Müsste ${x.ref} sein – meine Bibel liegt leider noch auf der Kanzel.`,
  x => `Ich tippe auf ${x.X}. Wenn mich mein Gedächtnis nicht täuscht, ist es ${x.ref}.`,
  x => `Ziemlich sicher ${x.X} – ${x.ref}, meine ich. Das haben wir mal in der Bibelstunde durchgenommen.`,
  x => `Mein Herz sagt ${x.X}, und ${x.ref} spricht dafür, wenn ich mich recht erinnere.`,
  x => `Zu neunzig Prozent ${x.X}. Die restlichen zehn Prozent überlasse ich dem Heiligen Geist. Wohl ${x.ref}.`
];
const GAST_ZIEMLICH_OHNE = [
  x => `Ich bin ziemlich sicher: ${x.X}. Aber zähl zur Sicherheit nochmal nach.`,
  x => `Hm … ${x.X}, würde ich sagen. Das klingt jedenfalls vertraut.`,
  x => `Ziemlich sicher ${x.X}. Ein Bibelkundler wüsste es genauer – aber ich bin nah dran.`
];
const GAST_SCHWANK = [
  x => `Das ist knifflig. ${x.X} oder ${x.Y}? Ich würde ${x.X} nehmen, aber ganz sicher bin ich nicht.`,
  x => `Ich blättere gedanklich in meiner Bibel … ${x.X}? Oder ${x.Y}? Ich entscheide mich für ${x.X} – im Gebet bin ich dabei.`,
  x => `${x.X} oder ${x.Y} – das ist wie die Frage, ob nach dem Gottesdienst erst der Kuchen oder erst der Kaffee kommt. Ich sage ${x.X}.`,
  x => `Da bin ich hin- und hergerissen: ${x.X} oder ${x.Y}. Ich tendiere zu ${x.X}, aber prüf es lieber selbst.`,
  x => `Hm, ${x.Y} könnte auch stimmen. Trotzdem mein Tipp: ${x.X}. Ohne Gewähr – wie jede Predigtprognose.`,
  x => `Ich muss kurz beten … ${x.X}? ${x.Y}? Ich nehme ${x.X}, aber verlass dich nicht allein auf mich.`
];
const GAST_GERATEN = [
  x => `Oje, da bin ich überfragt. Aus dem Bauch heraus ${x.X} – aber verlass dich nicht drauf!`,
  x => `Ehrlich gesagt weiß ich es nicht. Vielleicht ${x.X}? Das musst du am Ende selbst entscheiden.`,
  x => `Das habe ich wohl in der Bibelstunde verpasst. Ich rate ${x.X}.`,
  x => `Da muss ich passen. ${x.X} – aber das ist nur geraten, nicht gepredigt.`,
  x => `Ich stochere im Nebel. Vielleicht ${x.X}? Frag lieber noch jemanden aus der Gemeinde.`
];
const GAST_THEMA = [
  [/David|Goliat/, "David gegen Goliat (1. Samuel 17) – für mich die schönste Mutgeschichte: Nicht Größe zählt, sondern Gottvertrauen."],
  [/Noah|Arche|Sintflut/, "Noah hat über Jahre eine Arche gebaut, bevor der erste Tropfen fiel. Das nenne ich Glaubensgehorsam (1. Mose 6–9)."],
  [/Jona|Ninive/, "Jona wollte in die andere Richtung – wer von uns kennt das nicht? Gott lässt trotzdem nicht locker (Jona 1–4)."],
  [/Psalm 23|Hirte/, "„Der HERR ist mein Hirte“ (Psalm 23,1) – Predigtstoff für ein ganzes Leben, nicht nur für Beerdigungen."],
  [/Schilfmeer|Passah|Auszug/, "Gott führte sein Volk durchs Schilfmeer (2. Mose 14). Wo wir keinen Weg sehen, schafft er einen."],
  [/Paulus|Saulus|Damaskus/, "Aus Saulus wurde Paulus (Apostelgeschichte 9) – kein Mensch ist zu weit weg für Gottes Gnade."],
  [/verlorene Sohn|Lukas 15/, "Das Gleichnis vom verlorenen Sohn (Lukas 15) – eigentlich ist es die Geschichte vom liebenden Vater."],
  [/Bergpredigt|Matthäus 5|Seligpreisung/, "Die Bergpredigt (Matthäus 5–7) – die beste Predigt, die je gehalten wurde. Und sie ist nicht einmal zu lang."],
  [/Taufe|taufen|Jordan/, "Als Baptist sage ich: erst der Glaube, dann die Taufe (Apostelgeschichte 8,36-38) – ein froher Schritt der Nachfolge."],
  [/eingeborenen Sohn|Johannes 3,16/, "Johannes 3,16 – das Evangelium in einem Satz. Da bekommt jeder Pastor Gänsehaut."],
  [/Vaterunser|Matthäus 6/, "Das Vaterunser (Matthäus 6,9-13) – kurz genug zum Auswendiglernen, tief genug für ein ganzes Leben."],
  [/Pfingst|Heiliger Geist|Apostelgeschichte 2/, "An Pfingsten kam der Heilige Geist (Apostelgeschichte 2) – an diesem Tag wurde die Gemeinde geboren."],
  [/Auferstehung|Ostern|leere Grab/, "Das leere Grab ist das Fundament unseres Glaubens (1. Korinther 15,14) – ohne Ostern wäre jede Predigt umsonst."],
  [/Missionsbefehl|Gehet hin|alle Völker/, "Der Missionsbefehl (Matthäus 28,19-20) – für uns Baptisten ein echtes Herzensanliegen."],
  [/Daniel|Löwen/, "Daniel in der Löwengrube (Daniel 6) – er hat gebetet, obwohl es verboten war. Treue lohnt sich."],
  [/Ruth|Boas|Noomi/, "„Wo du hingehst, da will auch ich hingehen“ (Ruth 1,16) – Treue, die Teil der Familiengeschichte des Messias wurde."],
  [/Salomo|Weisheit|Sprüche/, "Die Sprüche sind Lebensweisheit in Kurzform – Gottesfurcht ist der Anfang der Erkenntnis (Sprüche 1,7)."],
  [/Bileam|Eselin/, "Gott hat Humor: Er ließ sogar die Eselin Bileams sprechen (4. Mose 22,28). Seitdem traue ich jeder Zuhörerschaft etwas zu."]
];
const GAST_THEMEN = {
  "Bibelkunde": ["Bibelkunde ist wie Kirchenkaffee: Man lernt dabei die ganze Gemeinde kennen – hier eben alle 66 Bücher.", "66 Bücher – ein Bibliothekar hätte seine Freude. Ich auch."],
  "Propheten": ["Die Propheten haben oft unbequeme Predigten gehalten – und hatten trotzdem recht.", "Prophetenbücher sind lang, aber lohnend – wie eine gute Predigtreihe."],
  "Psalmen & Weisheit": ["Die Psalmen sind das Gesangbuch der Bibel – und das ehrlichste Gebetbuch dazu.", "Die Sprüche sind Lebensweisheit in Kurzform – leider ohne drei Punkte, aber dafür auf den Punkt."],
  "Briefe & Offenbarung": ["Die Briefe des Neuen Testaments sind die ersten Gemeindebriefe. Pünktlich gedruckt wurden sie damals auch nicht.", "Die Offenbarung endet mit dem Sieg Jesu. Das lese ich jedem Skeptiker gern vor."],
  "Apostel & erste Gemeinde": ["Die erste Gemeinde war arm, mutig und voller Gebet – davon kann jede Gemeinde lernen.", "In der Apostelgeschichte wird die Gemeinde gegründet – ohne Gemeindeausschuss, aber mit Heiligem Geist."],
  "Orte & Reisen": ["Die Bibel ist ein Reisebuch – von Ur bis Rom. Ich bin als Gastprediger ja auch viel unterwegs.", "Paulus war der erste Vielreisende der Gemeinde – ohne Auto, aber mit Auftrag."]
};
const GAST_ALLG = [
  "Ich habe gerade die Bibelstunde vorbereitet – da kommt so eine Frage wie gerufen.",
  "Nach dem Gottesdienst gibt es bei uns Kirchenkaffee. Den eigentlichen Gemeindeaufbau erlebt man dort.",
  "Wenn du die Million holst, spendier ich dir beim nächsten Gemeindefest ein Stück Kuchen. Vielleicht auch zwei.",
  "Ein Pastor hat immer drei Punkte – und alle drei fangen meist mit demselben Buchstaben an.",
  "Kleiner Tipp vom Prediger: Ein Kapitel am Tag – und du bist in gut drei Jahren einmal durch die ganze Bibel.",
  "Beim Gemeindefest bringt jeder etwas mit. Ich bringe immer die Bibel mit – die anderen den Nudelsalat.",
  "Man sagt, Baptisten treffen sich zum Beten – und bleiben zum Essen.",
  "Mein Predigtmanuskript hat zwölf Seiten. Die Gemeinde hofft auf sechs.",
  "In der Bibelstunde sagt immer einer: „Das hab ich auch gerade gedacht!“ – meistens war er kurz eingenickt.",
  "„Das Wort des Christus wohne reichlich in euch“ (Kolosser 3,16) – wichtiger als jeder Punktestand.",
  "Wenn du Fragen hast, frag ruhig weiter. Jesus hat sich auch nie über Fragen beschwert.",
  "Als Gastprediger komme ich von Gemeinde zu Gemeinde – und überall gibt es einen Kuchen, der gleich geheimnisvoll aussieht."
];
const GAST_TSCHUESS = [
  "Der Herr segne dich und behüte dich (4. Mose 6,24). Amen!",
  "Gott befohlen – und viel Erfolg!",
  "Ich bete für dich. Auf Wiederhören!",
  "So, jetzt rufen drei Punkte und eine Kanzel. Gottes Segen!",
  "Friede sei mit dir – und gutes Gelingen!",
  "Auf Wiederhören – und grüß die Gemeinde von mir!",
  "Gottes Segen, und denk dran: Am Ende zählt nicht die Million, sondern die Ewigkeit.",
  "Der Kuchen ruft – und die Kanzel auch. Gott befohlen!",
  "Amen – und jetzt tipp mutig!"
];
/* Porträt: grauer Haarkranz, Brille, dunkler Anzug mit Krawatte, kleine Bibel */
const GAST_BILD = `<svg class="willi-bild" viewBox="0 0 96 96" aria-hidden="true"><defs><radialGradient id="gsH" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#b38cff" stop-opacity=".45"/><stop offset="1" stop-color="#b38cff" stop-opacity="0"/></radialGradient><linearGradient id="gsHaut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2c4"/><stop offset="1" stop-color="#e9b88e"/></linearGradient><linearGradient id="gsHaar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4e6ee"/><stop offset="1" stop-color="#a9aebf"/></linearGradient><linearGradient id="gsAnzug" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a4478"/><stop offset="1" stop-color="#1a2147"/></linearGradient></defs>
<circle cx="48" cy="48" r="47" fill="url(#gsH)"/><circle cx="48" cy="48" r="38" fill="#1b2146" stroke="url(#wrG)" stroke-width="3"/>
<clipPath id="gsK"><circle cx="48" cy="48" r="36.5"/></clipPath><g clip-path="url(#gsK)">
<path d="M18 92c2-17 14-24 30-24s28 7 30 24z" fill="url(#gsAnzug)" stroke="#1b2a55" stroke-width="1.4"/><path d="M40 69l8 12 8-12z" fill="#fff" stroke="#1b2a55" stroke-width="1.2"/><path d="M46.5 74h3l2 14-3.5 3.5L44.5 88z" fill="#b23a48" stroke="#5e1822" stroke-width="1"/>
<circle cx="48" cy="42" r="16" fill="url(#gsHaut)" stroke="#1b2a55" stroke-width="1.4"/>
<path d="M32 38c-2-12 6-19 16-19s18 7 16 19c-2-5-6-8-16-8s-14 3-16 8z" fill="url(#gsHaar)" stroke="#1b2a55" stroke-width="1.2"/>
<path d="M32.5 40c-1.6 3-1.2 7 .6 9M63.5 40c1.6 3 1.2 7-.6 9" stroke="#a9aebf" stroke-width="3" fill="none" stroke-linecap="round"/>
<circle cx="41.5" cy="41" r="4.6" fill="#fff" fill-opacity=".25" stroke="#1b2a55" stroke-width="1.4"/><circle cx="54.5" cy="41" r="4.6" fill="#fff" fill-opacity=".25" stroke="#1b2a55" stroke-width="1.4"/><path d="M46.1 41h3.8" stroke="#1b2a55" stroke-width="1.4"/>
<circle cx="41.5" cy="41" r="1.7" fill="#1b2a55"/><circle cx="54.5" cy="41" r="1.7" fill="#1b2a55"/>
<path d="M42 50q6 4.5 12 0" fill="none" stroke="#7a3b2c" stroke-width="1.8" stroke-linecap="round"/>
<path d="M37 28q3-5 9-6" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none" stroke-linecap="round"/></g>
<g transform="rotate(-12 77 64)"><rect x="67" y="51" width="20" height="26" rx="2.5" fill="#2d3a78" stroke="#1b2a55" stroke-width="1.2"/><path d="M77 56v14M71.5 61h11" stroke="url(#wrG)" stroke-width="2.2" stroke-linecap="round"/></g></svg>`;
const PASTOREN = {
  gast: { get name() { return meineGem() === "gast" ? "Gastprediger" : "Pastor"; }, get kurz() { return meineGem() === "gast" ? "Gastprediger" : "Pastor"; }, info: "Baptisten-Pastor auf Besuch", bild: () => GAST_BILD, salt: 0x7a3d91e5, quoten: [[.88, .97, .99], [.58, .83, .92], [.34, .6, .79]],
    hallo: GAST_HALLO, sicher: GAST_SICHER, ziemlich: GAST_ZIEMLICH, sicherOhne: GAST_SICHER_OHNE, ziemlichOhne: GAST_ZIEMLICH_OHNE, schwank: GAST_SCHWANK, geraten: GAST_GERATEN, thema: GAST_THEMA, themen: GAST_THEMEN, allg: GAST_ALLG, tschuess: GAST_TSCHUESS }
};
/* Telefonjoker – Zugang: Willi und Aaron liegen verschlüsselt in joker.enc. Den Schlüssel bekommen nur freigeschaltete Geräte (Sammlung „geheim“);
   er wird auf dem Gerät gemerkt, damit der Joker auch offline geht. Verliert ein Gerät die Freigabe, wird er gelöscht. */
const JK_KEY = "bq-jk";
let jokerGeladen = false, jokerVersuch = null;
const jkBytes = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
function jokerSperren() {
  try { localStorage.removeItem(JK_KEY); } catch (e) {}
  jokerGeladen = false; jokerVersuch = null;
  ["willi", "aaron"].forEach(k => { delete PASTOREN[k]; delete ADV_PASTOREN[k]; });
}
async function jokerEntschluesseln(k) {
  const buf = new Uint8Array(await (await fetch("joker.enc")).arrayBuffer());
  const key = await crypto.subtle.importKey("raw", jkBytes(k), "AES-GCM", false, ["decrypt"]);
  const klar = await crypto.subtle.decrypt({ name: "AES-GCM", iv: buf.slice(0, 12) }, key, buf.slice(12));
  const M = new Function(new TextDecoder().decode(klar))();
  Object.assign(PASTOREN, M.PASTOREN); Object.assign(ADV_PASTOREN, M.ADV_PASTOREN); jokerGeladen = true;
}
function jokerLaden(neu) {
  if (meineGem() !== GEM_STANDARD) return Promise.resolve(false);
  if (jokerGeladen && !neu) return Promise.resolve(true);
  if (jokerVersuch && !neu) return jokerVersuch;
  jokerVersuch = (async () => {
    let k = ""; try { k = localStorage.getItem(JK_KEY) || ""; } catch (e) {}
    const L = window.LB;
    if (L && L.ok && L.jokerSchluessel) {
      try { const sk = await L.jokerSchluessel(); if (sk) { k = sk; try { localStorage.setItem(JK_KEY, sk); } catch (e) {} } }
      catch (e) { if (e && e.code === "permission-denied") { jokerSperren(); return false; } }
    }
    if (!k) return false;
    try { await jokerEntschluesseln(k); return true; } catch (e) { return false; }
  })().then(ok => { if (!ok) jokerVersuch = null; return ok; });
  return jokerVersuch;
}
/* Wer steht beim Telefonjoker zur Wahl? Freigeschaltete Mitglieder: Willi und Aaron – alle anderen: der Gastprediger */
const jokerKontakte = () => jokerGeladen && meineGem() === GEM_STANDARD && PASTOREN.willi && PASTOREN.aaron ? ["willi", "aaron"] : ["gast"];
const jokerErwartet = () => meineGem() === GEM_STANDARD && (jokerGeladen || (() => { try { return !!localStorage.getItem(JK_KEY); } catch (e) { return false; } })());
const jokerBeschreibung = () => jokerErwartet() ? "Willi oder Aaron" : (meineGem() === "gast" ? "Gastprediger" : "Pastor");
/* Abwechslung (6.51): Sätze, die auf diesem Gerät kürzlich schon kamen, werden übersprungen. Der Tipp selbst
   (richtig/falsch, Sicherheit) hängt weiter nur vom Startwert ab – fair im Duell und in der Wochenrunde.
   Jede Auswahl verbraucht genau einen Zufallswert, egal ob übersprungen wird. */
const TEL_ZULETZT_KEY = "bq-telefon-zuletzt";
function telZuletzt() { try { const a = JSON.parse(localStorage.getItem(TEL_ZULETZT_KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function telMerken(liste) { try { localStorage.setItem(TEL_ZULETZT_KEY, JSON.stringify(liste.slice(-150))); } catch (e) {} }
function pastorAntwort(f, halb, id = "willi") {
  const P0 = PASTOREN[id] || PASTOREN.gast, weih = !!f.weih && !!ADV_PASTOREN[id]; /* 7.3: Weihnachtsmodus – Mütze und weihnachtliche Antworten */
  const P = weih ? Object.assign({}, P0, ADV_PASTOREN[id], { sicherOhne: null, ziemlichOhne: null }) : P0; if (weih) id = id + "-w";
  const rnd = rngVon((f.ws || hash(f.f)) ^ (halb ? 0x5bd1e995 : 0) ^ P.salt), zuletzt = telZuletzt();
  /* wahl: zufälliger Eintrag; ist er kürzlich gekommen, der nächste noch nicht gehörte. Gesperrt wird je Liste
     höchstens gut die Hälfte, damit immer genug Auswahl bleibt. */
  const wahl = (a, nameFest) => {
    const start = Math.floor(rnd() * a.length), name = nameFest || Object.keys(P).find(k => P[k] === a) || "x";
    const kenn = k => `${id}|${name}|${k}`, gesperrt = new Set(zuletzt.filter(z => z.startsWith(`${id}|${name}|`)).slice(-Math.ceil(a.length * .6)));
    let k = start;
    for (let n = 0; n < a.length; n++) { const j = (start + n) % a.length; if (!gesperrt.has(kenn(j))) { k = j; break; } }
    zuletzt.push(kenn(k)); return a[k];
  };
  const sichtbar = f.opts.map((o, k) => k).filter(k => !(halb && f.weg.includes(f.opts[k])));
  const r = f.opts.indexOf(f.loesung), falsche = sichtbar.filter(k => k !== r);
  const txt = k => `<b>${"ABCD"[k]}: ${esc(f.opts[k])}</b>`, kurz = k => `${"ABCD"[k]}: ${f.opts[k]}`;
  const [sicher, ziemlich, schwank] = P.quoten[(f.st || 1) - 1];
  const p = rnd(), y = falsche[Math.floor(rnd() * falsche.length)]; /* Tipp nur vom Startwert abhängig */
  let tipp, grad, satz, richtigGetippt = true;
  const vers = /\d+,\d/.test(f.ref || "");  // echte Versangabe? Sonst Sätze ohne „steht in …“
  if (p < sicher) { tipp = r; grad = "ganz sicher"; satz = wahl(vers || !P.sicherOhne ? P.sicher : P.sicherOhne)({ X: txt(r), ref: esc(f.ref) }); }
  else if (p < ziemlich) { tipp = r; grad = "ziemlich sicher"; satz = wahl(vers || !P.ziemlichOhne ? P.ziemlich : P.ziemlichOhne)({ X: txt(r), ref: esc(f.ref) }); }
  else if (p < schwank) { tipp = r; grad = `unsicher (oder ${"ABCD"[y]})`; satz = wahl(P.schwank)({ X: txt(r), Y: txt(y) }); }
  else {
    tipp = y; richtigGetippt = false;
    if (rnd() < .5) { grad = `unsicher (oder ${"ABCD"[r]})`; satz = wahl(P.schwank)({ X: txt(y), Y: txt(r) }); }
    else { grad = "nur geraten"; satz = wahl(P.geraten)({ X: txt(y) }); }
  }
  /* Bezug zur Frage nur, wenn der Pastor richtig liegt – sonst würde er sich selbst widersprechen.
     Gesucht wird in Frage, Lösung und Bibelstelle (nicht im Themennamen – dafür gibt es die Themen-Witze). */
  const heu = `${f.f} ${f.loesung} ${f.ref}`, passend = P.thema.map(([re], k) => k).filter(k => P.thema[k][0].test(heu));
  /* Reihenfolge: genauer Bezug zur Frage (nur wenn richtig) → Witz zum Thema → allgemeiner Satz.
     6.56: Ein Bezug, der kürzlich schon kam, wird übersprungen – sonst kommt bei derselben Frage immer dieselbe Geschichte. */
  const themenWitze = (P.themen || {})[f.thema];
  const bezugKenn = k => `${id}|bezug|${k}`, frischeBezuege = passend.filter(k => !zuletzt.includes(bezugKenn(k)));
  let extra;
  if (richtigGetippt && passend.length && rnd() < .8 && frischeBezuege.length) {
    const k = frischeBezuege[Math.floor(rnd() * frischeBezuege.length)]; zuletzt.push(bezugKenn(k)); extra = P.thema[k][1];
  } else {
    /* Themen-Witz nur, wenn davon noch einer „frisch“ ist – sonst lieber ein allgemeiner Satz */
    const thFrisch = themenWitze && themenWitze.some((t, k) => !zuletzt.includes(`${id}|th:${f.thema}|${k}`));
    extra = thFrisch && rnd() < .6 ? wahl(themenWitze, "th:" + f.thema) : wahl(P.allg);
  }
  const saetze = [wahl(P.hallo), satz, esc(extra)];
  /* Aaron: Star Wars gern noch einmal extra, wenn der Satz davor keinen Bezug hatte */
  if (P.sw && !/Star Wars|Jedi|Yoda|Macht|Todesstern|Han Solo|Luke|Vader|Tatooine|Chewbacca|C-3PO|Lichtschwert|Kamino|Falke|Mos Eisley|Obi-Wan|Hoth/.test(extra) && rnd() < .6) saetze.push(esc(wahl(P.sw)));
  saetze.push(wahl(P.tschuess));
  telMerken(zuletzt);
  if (id.startsWith("gast") && meineGem() !== "gast") for (let k = 0; k < saetze.length; k++) saetze[k] = saetze[k].replace(/Gastprediger/g, "Pastor"); /* außerhalb von „Gast“ heißt er nur „Pastor“ */
  return { saetze, tipp: kurz(tipp), grad, richtig: tipp === r, wer: id.replace(/-w$/, ""), weih };
}

/* Wen rufst du an? Erst nach der Wahl ist der Joker verbraucht – Abbrechen gibt ihn zurück. */
function telefonWahl(weiter, abbruch, weih) {
  const ids = jokerKontakte();
  if (ids.length === 1) { weiter(ids[0]); return; }
  const m = modal(`<div class="label">Telefonjoker</div><h2 style="margin:0">Wen rufst du an?</h2>
    <div class="tel-wahl">${ids.map(id => [id, PASTOREN[id]]).map(([id, P]) => `<button class="tel-kontakt" data-tel="${id}">${pastorBild(P, weih)}<span><b>${P.name}</b><small>${P.info}</small></span>${svg("telefon")}</button>`).join("")}</div>
    <p class="small muted" style="margin:0">Die Uhr steht, solange du telefonierst. Du hast nur einen Anruf.</p>
    <button class="btn ghost" data-close>Doch nicht</button>`, x => { if (x !== "gewaehlt") abbruch(); });
  m.classList.add("willi-modal");
  m.querySelectorAll("[data-tel]").forEach(b => b.onclick = () => { m.remove(); weiter(b.dataset.tel); });
}
/* Das Telefonat: es klingelt, dann erzählt der Pastor Satz für Satz. Die Bedenkzeit steht so lange. */
const pastorBild = (P, weih) => weih ? weihBild(P.bild()) : P.bild();
function pastorAnruf(w, weiter) {
  const P = PASTOREN[w.wer] || PASTOREN.gast;
  const ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const m = modal(`<div class="willi">
      <div class="willi-kopf">${pastorBild(P, w.weih)}<div><div class="label">Telefonjoker</div><b>${P.name}</b><small id="wStatus"><i class="w-ring"></i> Es klingelt …</small></div></div>
      <div class="willi-text" id="wText" aria-live="polite">${w.saetze.map((t, k) => `<p class="${ruhig ? "da" : ""}" data-k="${k}">${t}</p>`).join("")}</div>
      <button class="btn primary" data-close="auf">${svg("telefon")} Danke, ${P.kurz}! Auflegen</button></div>`, () => weiter());
  m.classList.add("willi-modal");
  const status = $("wStatus"); let sek = 0, uhr = null;
  [0, 1].forEach(k => { tone(440, k * .9, .35, "sine", .06); tone(480, k * .9, .35, "sine", .05); });
  setTimeout(() => {
    if (!document.body.contains(m)) return;
    status.innerHTML = `<i class="w-an"></i> verbunden · 0:00`;
    uhr = setInterval(() => { if (!document.body.contains(m)) return clearInterval(uhr); sek++; status.innerHTML = `<i class="w-an"></i> verbunden · 0:${String(sek).padStart(2, "0")}`; }, 1000);
    m.querySelectorAll(".willi-text p").forEach((el, k) => setTimeout(() => el.classList.add("da"), ruhig ? 0 : 250 + k * 1100));
  }, ruhig ? 0 : 1700);
}

/* ---------- Eigener Reiter „Biblionär“ (6.42): Solo, Biblionär der Woche, einfaches Duell, Rekord ----------
   Das Biblionär-Duell geht hier mit einem Tipp (ohne Duell-Art-Auswahl); alle anderen Duelle bleiben in der Arena. */
let bibDuWahl = false, bibDuSuche = "";
const bibIstQuiz = d => (d.art || "vers") === "quiz";
function bibGegnerHtml() {
  const offen = (duListe || []).filter(d => d.von === S.pid && duStatus(d) === "offen");
  const q = nameSchluessel(bibDuSuche);
  return `<section class="zv2-gegner bq-gegner" id="bqGegner" aria-label="Gegner wählen">
    <div class="zv2-gk"><span class="zv2-gic">${svg("biblionaer")}</span><span class="zv2-gt"><small>Dein Spiel</small><b>Biblionär-Duell</b></span><span class="zv2-gh">Gegner antippen – dann geht es los!</span></div>
    ${offen.length >= DU_MAX_OFFEN ? `<p class="small muted" style="margin:0">Du hast schon ${DU_MAX_OFFEN} offene Herausforderungen – erst müssen diese gespielt werden. Unten bei „Wartet auf“ kannst du eine abbrechen.</p>` : `
    <input class="du-suche" id="bqSuche" type="search" placeholder="Name suchen …" value="${esc(bibDuSuche)}" autocomplete="off" aria-label="Gegner suchen">
    ${duGegner === null ? `<p class="small muted">Lade Gemeinde …</p>` : `<ul class="du-wahl zv2-liste">${duGegnerListeHtml(q, r => { const laeuft = offen.some(d => d.an === r.id);
      return `<li><button class="du-person" data-bqg="${esc(r.id)}" ${laeuft ? "disabled" : ""}>${avatarLv(r, 34)}<span class="du-tx"><b>${esc(r.name)}</b><span>${duUnterzeile(r, laeuft)}</span></span>${laeuft ? "" : `<span class="zv2-vor" aria-hidden="true">${svg("biblionaer")}</span>`}</button></li>`; })}</ul>`}`}
  </section>`;
}
/* 9.27: Solo/Duell als Medaillons im Stil von „Zusammen“ */
const bqMedaille = (id, ic, kurz, sub, pct, farbe, an, extra = "") => `<button class="zv2-m${an ? " an" : ""}" id="${id}" ${extra} style="--c:${farbe};--p:${zvPr(pct)}"><span class="zv2-ring"><span class="zv2-in">${svg(ic)}</span></span><b>${kurz}</b><small>${sub}</small></button>`;
function bibGegnerVerdrahten() {
  const neu = () => { const box = $("bqGegner"); if (box) { box.outerHTML = bibGegnerHtml(); bibGegnerVerdrahten(); } };
  const f = $("bqSuche"); if (f) f.oninput = () => { bibDuSuche = f.value; const pos = f.selectionStart; neu(); const g = $("bqSuche"); g.focus(); try { g.setSelectionRange(pos, pos); } catch (e) {} };
  screen.querySelectorAll("[data-bqg]").forEach(b => b.onclick = () => { SFX.tap(); const r = (duGegner || []).find(x => x.id === b.dataset.bqg); if (r) bibHerausfordern(r); });
}
function bibHerausfordern(r) {
  /* 7.5: Der Modus (Normal/Weihnachten) kommt vom Schalter im Reiter Biblionär bzw. in der Arena */
  const los = () => { bibDuWahl = false; duHerausfordern(r, "quiz", { heim: "bib", weih: weihAktiv() }); };
  if (duListe) los(); else duAktualisieren().then(los);
}
/* Revanche nach einem Biblionär-Duell: gleich wieder Biblionär, nur kurz bestätigen */
function bibRevanche(r, revanche) {
  modal(`<div class="label">${revanche ? "Revanche" : "Nochmal"} gegen</div><h2 style="margin:0">${esc(r.name)}</h2>
    <p class="small muted" style="margin:0">Neue 15 Fragen – ${esc(r.name)} bekommt genau dieselben.</p>
    <button class="btn primary" data-close="los">${svg("biblionaer")} Biblionär-Duell starten</button><button class="btn ghost" data-close>Abbrechen</button>`,
    x => { if (x === "los") bibHerausfordern(r); }).dataset.frei = "1";
}
VIEWS.bib = () => {
  /* 6.45: kompakt ohne Scrollen – Kopf mit Logo + Rekord-Leiter, Solo/Woche als zwei Kacheln, ein Duell-Kasten, Joker mit Erklärung */
  const online = duOk(), wk = weekKey(), n = bibWocheTage(), gespielt = bibWocheGespielt();
  const liste = (duListe || []).filter(bibIstQuiz), dran = duFuerBib(), andere = duFuerMich().length;
  const warte = liste.filter(d => d.von === S.pid && duStatus(d) === "offen");
  const fertig = liste.filter(d => d.status === "fertig" && d.vonErg && d.anErg).slice(0, 2);
  const rek = S.bibRekord || 0, stufe = BIB_LEITER.filter(p => p <= rek).length;
  const wocheAn = S.lbName && !S.offlineOnly;
  /* 6.49: Wochenrunde als schmale goldene Zeile unter den beiden Startknöpfen */
  /* 6.57: Biblionär der Woche als goldener Kasten mit Kronen-Medaillon und Resttage-Marke */
  const ar = advRunde(), advGesp = ar ? advBibGespielt(ar) : true;
  const woche = weihAktiv()
    ? (ar ? `<button class="bq4-woche weih" id="bqWoche" aria-label="Weihnachts-Biblionär der Woche – ${advRundeName(ar)}"><span class="bq4-kr">${svg("kerze")}</span><span><b>Biblionär der Woche</b><small>${advGesp ? `Weihnachten · deine Runde ${pkt((A().advBib || {})[ar] | 0)} Punkte` : `Weihnachten · ${advRundeName(ar)} · 1 Versuch`}</small></span>${advGesp ? `<span class="bq4-uhr">${svg("check")}<small>gespielt</small></span>` : `<span class="bq4-uhr">${svg("play")}<small>Start</small></span>`}</button>`
        : `<div class="bq4-woche aus"><span class="bq4-kr">${svg("kerze")}</span><span><b>Biblionär der Woche</b><small>die Weihnachtsrunden sind vorbei</small></span><span></span></div>`)
    : !wocheAn
    ? `<div class="bq4-woche aus"><span class="bq4-kr">${svg("crown")}</span><span><b>Biblionär der Woche</b><small>nur mit Eintrag in der Rangliste</small></span><span></span></div>`
    : `<button class="bq4-woche" id="bqWoche" aria-label="${gespielt ? `Biblionär der Woche: deine Runde ${pkt(S.bwP)} Punkte – Rangliste` : `Biblionär der Woche starten – noch ${n} ${n === 1 ? "Tag" : "Tage"}`}"><span class="bq4-kr">${svg("crown")}</span><span><b>Biblionär der Woche</b><small>${gespielt ? `deine Runde · ${pkt(S.bwP)} Punkte` : `${wk.split("-W")[1]}. KW · gleiche Fragen für alle · 1 Versuch`}</small></span>${gespielt ? `<span class="bq4-uhr">${svg("trophy")}<small>Liste</small></span>` : `<span class="bq4-uhr">${n}<small>${n === 1 ? "Tag" : "Tage"}</small></span>`}</button>`;
  const ichKurz = esc(duInitialen(S.lbName || "Ich"));
  const dranZeile = d => `<li class="bq2-z"><span class="bq2-av">${esc(duInitialen(d.vonName))}</span><span class="bq2-tx"><b>${esc(d.vonName)}</b><small>fordert dich heraus · noch ${Math.max(0, Math.ceil((d.ablauf - Date.now()) / 864e5))} T.</small></span>
      <span class="bq2-p du-verdeckt" aria-label="Punkte verdeckt">?</span><span class="bq2-kn"><button class="bq2-an" data-bqan="${d.id}">${svg("bolt")}Antreten</button><button class="bq2-x" data-bqab="${d.id}" aria-label="Duell von ${esc(d.vonName)} ablehnen">${svg("nein")}</button></span></li>`;
  const ergKachel = d => { const ich = d.von === S.pid, g = ich ? d.anName : d.vonName, p = ich ? d.vonErg.p : d.anErg.p, q = ich ? d.anErg.p : d.vonErg.p, e = duMeinVgl(d) > 0 ? "sieg" : duMeinVgl(d) === 0 ? "remis" : "nieder";
    return `<button class="bq2-e ${e}" data-bqrev="${d.id}" aria-label="${e === "sieg" ? "Nochmal" : "Revanche"} gegen ${esc(g)}">${e === "sieg" ? svg("crown") : `<span class="bq2-av klein">${esc(duInitialen(g))}</span>`}<span class="bq2-tx"><b>${esc(g)}</b><em>${e === "sieg" ? "Gewonnen" : e === "remis" ? "Remis" : "Verloren"}</em></span><span class="bq2-p">${duP(p)}<small>${duP(q)}</small></span>${svg("bolt")}</button>`; };
  const duell = !online
    ? `<p class="small muted bq2-leer">${window.LB && window.LB.ok ? "Für Duelle brauchst du einen Eintrag in der Gemeinde-Rangliste." : "Für Duelle brauchst du Internet."}</p>`
    : `${duListe === null ? `<p class="small muted du-laden">${svg("biblionaer")} Lade Duelle …</p>` : ""}
      ${dran.length ? `<ul class="bq2-liste">${dran.map(dranZeile).join("")}</ul>` : ""}
      ${warte.length ? `<div class="bq2-warte">${svg("sun")}<span>Wartet auf:</span>${warte.map(d => `<button class="du-chip bq-stop${duStopGesperrt(d) ? " gesperrt" : ""}" data-bqstop="${d.id}" aria-label="${esc(duStopLabel(d))}">${esc(d.anName)}${duStopKnopfIc(d)}</button>`).join("")}</div>` : ""}
      ${fertig.length ? `<div class="bq2-erg">${fertig.map(ergKachel).join("")}</div>` : ""}
      ${!dran.length && !warte.length && !fertig.length && duListe !== null ? `<p class="small muted bq2-leer">Noch keine Duelle – fordere oben jemanden heraus. Ihr bekommt beide dieselben 15 Fragen.</p>` : ""}
      ${andere > 0 ? `<button class="ar-mehr bq2-mehr" data-go="duelle">${andere} ${andere === 1 ? "weiteres Duell wartet" : "weitere Duelle warten"} in der Arena</button>` : ""}`;
  screen.innerHTML = `
    ${bereichKopf("bib", { bild: "icons/biblionaer-logo.webp", t: "Biblionär", sub: "15 Bibelfragen bis zur Million" })}
    ${weihSchalterHtml()}
    <div class="zv"><div class="zv2-buehne bq5-buehne">
      <div class="zv2-reihe"><span class="zv2-tit">${svg("biblionaer")}Spielen</span></div>
      <div class="zv2-gitter bq5-gitter">
        ${bqMedaille("bqSolo", "user", "Solo", weihAktiv() ? "Weihnachtsfragen" : rek ? `Rekord ${pkt(rek)}` : "Allein üben", stufe / 15 * 100, "#66e0d0", false, 'aria-label="Solo spielen – 1 Spieler"')}
        ${online ? bqMedaille("bqNeu", "people", "Duell", bibDuWahl ? "Gegner antippen" : "Gegen die Gemeinde", 100, "#ff8a5c", bibDuWahl, `aria-pressed="${bibDuWahl}" aria-label="${bibDuWahl ? "Gegnerwahl schließen" : "Neues Duell – 2 Spieler"}"`)
          : `<div class="zv2-m aus" style="--c:#ff8a5c;--p:0"><span class="zv2-ring"><span class="zv2-in">${svg("people")}</span></span><b>Duell</b><small>${window.LB && window.LB.ok ? "Nur mit Rangliste" : "Nur mit Internet"}</small></div>`}
      </div>
      <p class="zv2-hinw"><span>1</span>Spiel antippen<i></i><span>2</span>Gegner<i></i><span>3</span>Los!</p>
    </div>
    ${online && bibDuWahl ? bibGegnerHtml() : ""}
    <div class="bq3-start">${woche}</div></div>
    ${bkLabel("duell", "Deine Duelle", dran.length)}
    <section class="bq2-duell">
      ${duell}
    </section>
    ${bkLabel("star", "Deine Joker")}
    <div class="bq2-joker" aria-label="Deine Joker – je einmal pro Spiel">
      <span><b class="bq2-j5">50:50</b><span><b>Halbieren</b><small>2 falsche weg</small></span></span>
      <span>${svg("people")}<span><b>Gemeinde</b><small>alle stimmen ab</small></span></span>
      <span>${svg("telefon")}<span><b>Telefon</b><small>${jokerBeschreibung()}</small></span></span>
    </div>`;
  wireGo();
  $("bqSolo").onclick = () => { SFX.tap(); bibSolo(weihAktiv()); };
  weihSchalterWire(() => VIEWS.bib());
  if ($("bqWoche")) $("bqWoche").onclick = () => { SFX.tap(); if (weihAktiv()) { if (ar) bibAdventStarten(); return; } if (gespielt) go("rank", "bibWoche"); else bibWocheStarten(); };
  if ($("bqNeu")) $("bqNeu").onclick = () => { SFX.tap(); bibDuWahl = !bibDuWahl; VIEWS.bib();
    if (bibDuWahl) { const g0 = $("bqGegner"); if (g0) { let ruhig = false; try { ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {} g0.scrollIntoView({ behavior: ruhig ? "auto" : "smooth", block: "start" }); } duGegnerLaden().then(() => { if (current !== "bib" || !bibDuWahl) return; const b = $("bqGegner"); if (!b) return;
        const fokus = document.activeElement?.id === "bqSuche"; b.outerHTML = bibGegnerHtml(); bibGegnerVerdrahten(); if (fokus) { const f = $("bqSuche"); f.focus(); f.setSelectionRange(f.value.length, f.value.length); } });
      const f = $("bqSuche"); if (f && !matchMedia("(pointer: coarse)").matches) f.focus(); } };
  bibGegnerVerdrahten();
  screen.querySelectorAll("[data-bqan]").forEach(b => b.onclick = () => { SFX.tap(); const d = dran.find(x => x.id === b.dataset.bqan); if (!d) return;
    duSpielStarten({ id: d.id, seed: d.seed, erstellt: d.erstellt, art: "quiz", k: d.k, gegner: d.vonName, gegnerErg: d.vonErg, vonPid: d.von, heim: "bib", weih: !!(d.opt && d.opt.w) }); });
  const bqAntreten = d => duSpielStarten({ id: d.id, seed: d.seed, erstellt: d.erstellt, art: "quiz", k: d.k, gegner: d.vonName, gegnerErg: d.vonErg, vonPid: d.von, heim: "bib", weih: !!(d.opt && d.opt.w) });
  screen.querySelectorAll("[data-bqab]").forEach(b => b.onclick = () => { SFX.tap(); const d = dran.find(x => x.id === b.dataset.bqab); if (d) duAblehnenFrage(d, () => bqAntreten(d)); });
  screen.querySelectorAll("[data-bqstop]").forEach(b => b.onclick = () => { SFX.tap(); const d = warte.find(x => x.id === b.dataset.bqstop); if (d) duAbbrechenFrage(d); });
  screen.querySelectorAll("[data-bqrev]").forEach(b => b.onclick = () => { SFX.tap(); const d = liste.find(x => x.id === b.dataset.bqrev); if (!d) return; const ich = d.von === S.pid;
    const p = ich ? d.vonErg.p : d.anErg.p, q = ich ? d.anErg.p : d.vonErg.p; bibRevanche({ id: ich ? d.an : d.von, name: ich ? d.anName : d.vonName }, p <= q); });
  if (online && duListe === null) duAktualisieren().then(() => { if (current === "bib" && document.activeElement?.id !== "bqSuche") VIEWS.bib(); });
};

/* ---------- Feedback an den Entwickler ---------- */
/* Wird in Firebase (Sammlung "feedback") gespeichert; lesen kann es nur der Entwickler in der Firebase-Konsole.
   Ohne Internet wartet es auf dem Gerät und wird später gesendet. */
const FB_KEY = "bibelquest-feedback-warteschlange";
function geraetBeschreibung() {
  const u = navigator.userAgent;
  const os = /iPad/.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1) ? "iPad" : /iPhone/.test(u) ? "iPhone" : /Android/.test(u) ? "Android" : /Windows/.test(u) ? "Windows" : /Mac/.test(u) ? "Mac" : /Linux/.test(u) ? "Linux" : "anderes";
  const br = /SamsungBrowser/.test(u) ? "Samsung Internet" : /Edg\//.test(u) ? "Edge" : /Firefox|FxiOS/.test(u) ? "Firefox" : /Chrome|CriOS/.test(u) ? "Chrome" : /Safari/.test(u) ? "Safari" : "Browser";
  const app = (matchMedia("(display-mode: standalone)").matches || navigator.standalone) ? " · als App" : "";
  return (os + " " + br + app).slice(0, 80);
}
function feedbackWarteschlange() { try { return JSON.parse(localStorage.getItem(FB_KEY) || "[]"); } catch (e) { return []; } }
async function feedbackNachsenden() {
  const L = window.LB, liste = feedbackWarteschlange(); if (!liste.length || !L || !L.ok || !L.feedback) return;
  const rest = [];
  for (const f of liste) { try { await L.feedback(f); } catch (e) { rest.push(f); } }
  try { localStorage.setItem(FB_KEY, JSON.stringify(rest)); } catch (e) {}
}
function feedbackOeffnen() {
  const art = [["idee", "Idee"], ["fehler", "Fehler"], ["lob", "Lob"], ["frage", "Frage"]];
  modal(`<div class="label">Feedback an den Entwickler</div><h2 style="margin:0">Was möchtest du sagen?</h2>
    <div class="fb-arten" role="radiogroup">${art.map(([k, n], i) => `<label><input type="radio" name="fbArt" value="${k}" ${i === 0 ? "checked" : ""}><span>${n}</span></label>`).join("")}</div>
    <textarea class="field" id="fbText" rows="5" maxlength="2000" placeholder="Was gefällt dir, was fehlt, was klappt nicht?"></textarea>
    <p class="small fb-name" style="margin:0">${svg("user")} Gesendet von <b>${esc(S.lbName || "?")}</b></p>
    <p class="small muted" style="margin:0">Mitgesendet wird außerdem: App-Version ${APP_VERSION} · ${esc(geraetBeschreibung())}. Nur der Entwickler kann das Feedback lesen.</p>
    <div class="small" id="fbErr" aria-live="polite"></div>
    <button class="btn primary" id="fbSenden">Senden</button><button class="btn ghost" data-close>Abbrechen</button>`);
  setTimeout(() => { const t = $("fbText"); if (t) t.focus(); }, 50);
  $("fbSenden").onclick = async () => {
    const text = $("fbText").value.trim();
    if (text.length < 3) { $("fbErr").style.color = "var(--bad)"; $("fbErr").textContent = "Bitte schreib ein paar Worte."; SFX.wrong(); return; }
    /* Seit 6.67 immer mit Namen (Michaels Wunsch) – der Name ist in der App Pflicht */
    const f = { text, art: (document.querySelector('input[name="fbArt"]:checked') || {}).value || "idee", ver: APP_VERSION, geraet: geraetBeschreibung(), name: S.lbName || "ohne Namen", pid: S.pid || "", wann: new Date().toISOString() };
    $("fbSenden").disabled = true; $("fbSenden").textContent = "Sende …";
    const L = window.LB; let gesendet = false;
    if (L && L.ok && L.feedback) { try { await L.feedback(f); gesendet = true; } catch (e) {} }
    if (!gesendet) { const q = feedbackWarteschlange(); q.push(f); try { localStorage.setItem(FB_KEY, JSON.stringify(q.slice(-10))); } catch (e) {} }
    document.querySelectorAll(".modal").forEach(m => m.remove()); SFX.coin();
    toast(`${svg("check", "var(--good)")}<div><b>Danke für dein Feedback!</b><div class="small muted">${gesendet ? "Es ist beim Entwickler angekommen." : "Gerade ist kein Internet da – es wird automatisch nachgesendet."}</div></div>`);
  };
}

/* ---------- Feedback-Postfach (nur für den Entwickler) ---------- */
let entwickler = false, postfachNeu = 0;
/* 9.44: ToDo im Postkasten – Einträge, die der Verwalter später bearbeitet. Sie zählen nicht als neu (kein Punkt, keine Zahl) und bleiben dort,
   bis er sie auf „Erledigt“ setzt. Die Ids liegen im eigenen Spielstand (S.pkTodo), also ohne Änderung der Firebase-Regeln. */
const pkTodoIds = () => (S.pkTodo && typeof S.pkTodo === "object" ? S.pkTodo : (S.pkTodo = {}));
const pkIstTodo = f => !f.erledigt && !!pkTodoIds()[f.id];
const pkIstNeu = f => !f.erledigt && !pkIstTodo(f);
const pkIn = (f, k) => k === "alle" ? true : k === "neu" ? pkIstNeu(f) : k === "todo" ? pkIstTodo(f) : !!f.erledigt;
function pkTodoSetzen(id, an) { const t = pkTodoIds(); if (an) t[id] = 1; else delete t[id]; save(); }
/* Profil-ID des Verwalters (einstellungen/entwickler) – sein Rang heißt für alle „Entwickler“ */
let ENTW_PID = null;
/* Doppelte Namen automatisch zusammenführen.
   Läuft auf dem Gerät des Verwalters (Entwickler) höchstens einmal am Tag.
   Sicher: Automatisch zusammengeführt werden nur Einträge OHNE Geräte-Verknüpfung (alte App-Versionen).
   Gibt es denselben Namen mehrfach MIT eigenen Geräten, sind es vermutlich verschiedene Personen –
   dann kommt nur ein Hinweis ins Postfach. Punkte (XP) werden addiert, Bestwerte übernommen. */
const nameSchluessel = n => String(n || "").trim().toLowerCase().replace(/\s+/g, " ");
let doppelteGeprueft = 0;
async function doppelteZusammenfuehren(erzwingen) {
  const L = window.LB; if (!L || !L.alleSpieler || !L.verwalterZusammenfuehren) return [];
  if (!erzwingen && S.dupCheck === today()) return [];
  const alle = (await L.alleSpieler()).filter(r => r.name);
  doppelteGeprueft = alle.length;
  const gruppen = {}; alle.forEach(r => { (gruppen[nameSchluessel(r.name)] = gruppen[nameSchluessel(r.name)] || []).push(r); });
  const verknuepft = r => Array.isArray(r.owners) && r.owners.length > 0;
  const berichte = [];
  for (const g of Object.values(gruppen)) {
    if (g.length < 2) continue;
    const mitGeraet = g.filter(verknuepft);
    const ziel = mitGeraet.length ? mitGeraet.slice().sort((a, b) => (b.xp || 0) - (a.xp || 0))[0] : g.slice().sort((a, b) => (b.xp || 0) - (a.xp || 0))[0];
    const dups = g.filter(r => r.id !== ziel.id && !verknuepft(r));
    if (mitGeraet.length > 1) berichte.push(`Bitte prüfen: „${g[0].name}“ gibt es ${mitGeraet.length}× mit eigenen Geräten – vermutlich verschiedene Personen, darum nicht automatisch zusammengeführt.`);
    if (!dups.length) continue;
    const wk = weekKey(), teil = [ziel, ...dups];
    const mx = k => Math.max(0, ...teil.map(r => +r[k] || 0));
    const xp = teil.reduce((a, r) => a + (+r.xp || 0), 0);
    const ids = [...new Set(teil.flatMap(r => Array.isArray(r.badgeIds) ? r.badgeIds : []))].slice(0, 80);
    const tl = [...new Set(teil.flatMap(r => Array.isArray(r.tl) ? r.tl : []))].sort((a, b) => a - b).slice(-31);
    const werte = { xp, level: levelOf(xp), week: wk, weekXp: teil.filter(r => r.week === wk).reduce((a, r) => a + (+r.weekXp || 0), 0),
      bestChain: Math.min(mx("bestChain"), 65), chainAT: Math.min(mx("chainAT"), 38), chainNT: Math.min(mx("chainNT"), 26), chainRueck: Math.min(mx("chainRueck"), 65),
      stars: Math.min(mx("stars"), 24), badges: Math.max(mx("badges"), ids.length), streak: mx("streak"), bestStreak: mx("bestStreak"),
      blitz: mx("blitz"), combo: Math.min(mx("combo"), 1000), armor: Math.min(mx("armor"), 6), atP: Math.min(mx("atP"), 100), ntP: Math.min(mx("ntP"), 100), bew: Math.min(mx("bew"), 16) };
    if (ids.length) werte.badgeIds = ids;
    if (tl.length) { werte.tl = tl; werte.t28 = Math.min(tage28(tl), 31); }
    try {
      await L.verwalterZusammenfuehren(ziel.id, dups.map(r => r.id), werte);
      berichte.push(`Automatisch zusammengeführt: „${ziel.name}“ – ${teil.length} Einträge zu einem (jetzt ${xp.toLocaleString("de-DE")} XP, Level ${werte.level}).`);
    } catch (e) { berichte.push(`„${ziel.name}“ konnte nicht zusammengeführt werden (${e && e.code ? e.code : "Fehler"}${e && e.message ? ": " + String(e.message).slice(0, 120) : ""}).`); }
  }
  S.dupCheck = today(); save();
  for (const text of berichte) await postkastenMelden("datenbank", text, "dup-" + today() + "-" + text.slice(0, 30));
  return berichte;
}
async function entwicklerPruefen() {
  const L = window.LB; if (!L || !L.ok || !L.entwicklerPid) return;
  try {
    const pid = await L.entwicklerPid();
    if (pid !== ENTW_PID) { ENTW_PID = pid || null; if (current === "rank" && !document.querySelector(".modal")) go("rank"); }
    if (!S.pid) return;
    entwickler = !!pid && pid === S.pid;
    if (!entwickler) { renderHud(); return; }
    await doppelteZusammenfuehren();
    await statusBerichte();
    await xpBerichte();
    const liste = await L.feedbackListe(); postfachNeu = liste.filter(pkIstNeu).length;
    try { antragOffen = L.antragListe ? (await L.antragListe()).filter(a => a.status === "offen").length : 0; } catch (e) { antragOffen = 0; }
    try { if (L.dialogAlle) DLG_ALLE = await L.dialogAlle(); } catch (e) {}
    pkOffenPruef = liste.filter(f => pkIstNeu(f) && (pkIstXp(f) || pkIstDup(f))).length + antragOffen + dlgNeuDev(); renderHud();
    if (["home", "profil"].includes(current) && !document.querySelector(".modal")) go(current);
  } catch (e) { entwickler = false; }
}
const ART_NAME = { idee: "Idee", fehler: "Fehler", lob: "Lob", frage: "Frage", info: "Datenbank", datenbank: "Datenbank", status: "Status" };
/* Postkasten des Verwalters: Feedback der Spieler, Statusberichte und Datenbankmeldungen.
   Status und Datenbank werden als Art „info“ gespeichert; „geraet“ beginnt mit „status“ oder „datenbank“. */
const pkKat = f => f.art !== "info" ? "feedback" : String(f.geraet || "").startsWith("status") ? "status" : "datenbank";
const PK_KAT = [["alle", "Alle", "post"], ["feedback", "Feedback", "chat"], ["status", "Status", "sun"], ["datenbank", "Datenbank", "netz"]];
let pkKategorie = "alle";
/* Meldung in den Postkasten schreiben (status | datenbank) – höchstens einmal pro Schlüssel und Tag */
async function postkastenMelden(kat, text, schluessel) {
  const L = window.LB; if (!L || !L.ok || !L.feedback) return;
  const k = "bq-pk-" + (schluessel || kat + text.slice(0, 40)), heute = today();
  try { if (localStorage.getItem(k) === heute) return; } catch (e) {}
  try { await L.feedback({ text: text.slice(0, 2000), art: "info", ver: APP_VERSION, geraet: (kat + " · " + geraetBeschreibung()).slice(0, 80), ...(S.lbName ? { name: S.lbName, pid: S.pid || "" } : {}) }); try { localStorage.setItem(k, heute); } catch (e) {} } catch (e) {}
}
/* Statusberichte für den Verwalter: neue App-Version, Wochenbericht */
async function statusBerichte() {
  const L = window.LB; if (!entwickler || !L || !L.alleSpieler) return;
  if (S.pkVersion !== APP_VERSION) { await postkastenMelden("status", `App-Version ${APP_VERSION} ist aktiv${S.pkVersion ? ` (vorher ${S.pkVersion})` : ""}.`, "version-" + APP_VERSION); S.pkVersion = APP_VERSION; save(); }
  const wk = weekKey(); if (S.pkWoche === wk) return;
  try {
    const alle = await L.alleSpieler(), vorher = S.pkWoche;
    const aktivWoche = alle.filter(r => r.week === wk && (r.weekXp || 0) > 0).length;
    const altWoche = vorher ? alle.filter(r => r.week === vorher).length : 0;
    const treu = alle.filter(r => Array.isArray(r.tl) && r.tl.filter(n => weekKey(datumVon(n)) === wk).length >= TREUE_TAGE).length;
    const top = alle.slice().sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 3).map(r => `${r.name} (${(r.xp || 0).toLocaleString("de-DE")} XP)`).join(", ");
    await postkastenMelden("status", `Wochenbericht KW ${wk.split("-W")[1]}: ${alle.length} Spieler in der Rangliste, ${aktivWoche} haben diese Woche schon gespielt, ${treu} sind treu (${TREUE_TAGE} Tage).${vorher ? ` Letzte Woche aktiv: ${altWoche}.` : ""} Spitze gesamt: ${top || "–"}.`, "woche-" + wk);
    S.pkWoche = wk; save();
  } catch (e) {}
}
var pkOffenPruef = 0;
let postfachFilter = "neu", pkSuche = "", pkAuswahl = false, pkSuchOffen = false; const pkGew = new Set();
/* 6.91: Postkasten wie ein Posteingang – oben die Prüfungen als angeheftete Zeilen mit Ampel (XP-Prüfung, doppelte Namen),
   darunter die Post (einklappbar, Suche per Lupe, Kategorie als Auswahl, Sammelaktionen im Auswahlmodus).
   Ampel: grün = nichts Offenes, orange = offene Hinweise im Postkasten, grau = noch nicht geprüft. Der Punkt erscheint auch am Postkasten-Symbol. */
const pkIstXp = f => /^XP-Prüfung:/.test(f.text || "");
const pkIstDup = f => pkKat(f) === "datenbank" && /^(Bitte prüfen: „|Automatisch zusammengeführt: „|„.+“ konnte nicht zusammengeführt)/.test(f.text || "");
const pkDatum = z => z ? new Date(z).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
VIEWS.postfach = (kat) => {
  const L = window.LB; if (kat && PK_KAT.some(k => k[0] === kat)) pkKategorie = kat;
  const heute = today(), xpTag = S.xpPruef, dupTag = S.dupCheck;
  const tagText = t => t === heute ? "heute geprüft" : t ? "geprüft " + xqDatum(t) : "noch nicht geprüft";
  const zeile = (id, ic, titel, tag, attr) => `<button class="pk-pin" id="${id}" data-ampel="grau" ${attr}><span class="pk-ampel" aria-hidden="true"></span><span class="pk-pt"><b>${svg(ic)} ${titel}</b><span class="small muted" data-pkinfo>${tagText(tag)}</span></span><span class="pk-pfeil" aria-hidden="true">›</span></button>`;
  screen.innerHTML = `${backBtn("home", "Start")}<div class="pk-kopf"><h1>Postkasten</h1><span class="pk-ikonen">
    <button class="iconbtn" id="pkLupe" aria-label="Suchen" aria-pressed="${pkSuchOffen}"><span aria-hidden="true">🔍</span></button>
    <button class="iconbtn" id="pkWahl" aria-label="Auswählen" aria-pressed="${pkAuswahl}">☑</button></span></div>
  <div class="pk-pins" aria-label="Prüfungen">${zeile("pkXp", "medal", "XP-Prüfung", xpTag, 'data-go="xppruefung"')}${zeile("pkDup", "people", "Doppelte Namen", dupTag, 'id2="x"')}<button class="pk-pin" id="pkAnt" data-go="antraege"><span class="pk-ampel" aria-hidden="true"></span><span class="pk-pt"><b>${svg("people")} Beitrittsanträge</b><span class="small muted" data-pkinfo>${antragOffen ? antragOffen + " offen" : "Freischaltung für neue Mitglieder"}</span></span><span class="pk-pfeil" aria-hidden="true">›</span></button><button class="pk-pin" id="pkDlg" data-go="dialoge"><span class="pk-ampel" aria-hidden="true"></span><span class="pk-pt"><b>${svg("chat")} Gespräche mit Spielern</b><span class="small muted" data-pkinfo>${dlgNeuDev() ? dlgNeuDev() + " neue Antwort" + (dlgNeuDev() === 1 ? "" : "en") : "Einzelne Spieler anschreiben"}</span></span><span class="pk-pfeil" aria-hidden="true">›</span></button><button class="pk-pin" id="pkGemLog" data-go="gemprotokoll"><span class="pk-pt"><b>${svg("scroll")} Gemeinde-Protokoll</b><span class="small muted">Wer wann beigetreten oder ausgetreten ist</span></span><span class="pk-pfeil" aria-hidden="true">›</span></button><button class="pk-pin" id="pkGem" data-go="gemverwaltung"><span class="pk-pt"><b>${svg("people")} Gemeinden</b><span class="small muted">Gemeinden anlegen, Spieler zuordnen</span></span><span class="pk-pfeil" aria-hidden="true">›</span></button><button class="pk-pin" id="pkTal" data-go="talente"><span class="pk-pt"><b>${svg("tal")} Talente-Planung</b><span class="small muted">Guthaben, Ø pro Tag, Spenden-Prognose</span></span><span class="pk-pfeil" aria-hidden="true">›</span></button><button class="pk-pin" id="pkNach" data-go="nachrichten"><span class="pk-pt"><b>${svg("chat")} Nachricht an Spieler</b><span class="small muted">Patchnotes und Mitteilungen senden</span></span><span class="pk-pfeil" aria-hidden="true">›</span></button></div>
  <div class="card rk-liste" style="margin-top:10px">
    <div class="pk-suchzeile" ${pkSuchOffen ? "" : "hidden"}><input type="search" id="pkSuche" placeholder="Suchen (Text, Name, Version)" value="${esc(pkSuche)}" aria-label="Post durchsuchen" autocomplete="off"></div>
    <div class="pk-filter"><div class="rk-var" role="group" aria-label="Filter">${[["neu", "Neu"], ["todo", "ToDo"], ["alle", "Alle"], ["erledigt", "Erledigt"]].map(([k, n]) => `<button data-pf="${k}" aria-pressed="${k === postfachFilter}">${n}<i class="pk-n" data-pfn="${k}"></i></button>`).join("")}</div>
      <select id="pkKat" aria-label="Kategorie">${PK_KAT.map(([k, n]) => `<option value="${k}" ${k === pkKategorie ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    <div class="pk-leiste" id="pkLeiste" ${pkAuswahl ? "" : "hidden"}><label class="small"><input type="checkbox" id="pkAlle"> Alle</label><span class="small muted" id="pkGewZahl"></span><span class="pk-aktion"><button class="btn ghost mini" id="pkTodo">ToDo</button><button class="btn ghost mini" id="pkErl">Erledigt</button><button class="btn ghost mini" id="pkDel">Löschen</button></span></div>
    <div class="stack" id="pfListe" style="margin-top:6px"><p class="muted small">Lade …</p></div></div>`;
  wireGo();
  const ampel = (id, zustand, text) => { const e = $(id); if (!e) return; e.dataset.ampel = zustand; const i = e.querySelector("[data-pkinfo]"); if (i && text) i.textContent = text; };
  screen.querySelectorAll("[data-pf]").forEach(b => b.onclick = () => { SFX.tap(); postfachFilter = b.dataset.pf; pkGew.clear(); go("postfach"); });
  $("pkKat").onchange = e => { SFX.tap(); pkGew.clear(); go("postfach", e.target.value); };
  $("pkLupe").onclick = () => { SFX.tap(); pkSuchOffen = !pkSuchOffen; if (!pkSuchOffen) pkSuche = ""; go("postfach"); if (pkSuchOffen) setTimeout(() => { const i = $("pkSuche"); if (i) i.focus(); }, 30); };
  $("pkWahl").onclick = () => { SFX.tap(); pkAuswahl = !pkAuswahl; pkGew.clear(); go("postfach"); };
  const dupLauf = async () => {
    SFX.tap(); const k = $("pkDup"), info = k.querySelector("[data-pkinfo]"); k.disabled = true; info.textContent = "Prüfe …";
    try {
      const b = await doppelteZusammenfuehren(true);
      modal(`<div class="label">Doppelte Namen</div><h2>${b.length ? "Ergebnis" : "Alles in Ordnung"}</h2>${b.length ? `<ul class="hinweisliste">${b.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : `<p class="muted">${doppelteGeprueft} Einträge geprüft – kein Name kommt doppelt vor.</p>`}<button class="btn primary" data-close>OK</button>`, () => go("postfach"));
    } catch (e) { modal(`<h2>Prüfung fehlgeschlagen</h2><p class="muted small">${esc((e && e.code) || "")} ${esc(String((e && e.message) || e).slice(0, 200))}</p><button class="btn primary" data-close>OK</button>`, () => go("postfach")); }
  };
  $("pkDup").onclick = dupLauf;
  if (!entwickler || !L || !L.ok) { $("pfListe").innerHTML = `<p class="muted">Der Postkasten braucht Internet.</p>`; return; }
  let liste = [];
  const passt = f => (pkKategorie === "alle" || pkKat(f) === pkKategorie) && (!pkSuche.trim() || [f.text, f.name, f.ver, f.geraet, f.art].some(s => String(s || "").toLowerCase().includes(pkSuche.trim().toLowerCase())));
  const zeichne = () => {
    postfachNeu = liste.filter(pkIstNeu).length; renderHud();
    const xpOff = liste.filter(f => pkIstNeu(f) && pkIstXp(f)).length, dupOff = liste.filter(f => pkIstNeu(f) && pkIstDup(f)).length;
    pkOffenPruef = xpOff + dupOff + antragOffen; renderHud();
    ampel("pkXp", xpOff ? "orange" : xpTag ? "gruen" : "grau", xpOff ? `${xpOff} offen · ${tagText(xpTag)}` : "");
    ampel("pkDup", dupOff ? "orange" : dupTag ? "gruen" : "grau", dupOff ? `${dupOff} offen · ${tagText(dupTag)}` : "");
    const basis = liste.filter(passt), zahl = k => basis.filter(f => pkIn(f, k)).length;
    ["neu", "todo", "alle", "erledigt"].forEach(k => { const e = screen.querySelector(`[data-pfn="${k}"]`); if (e) e.textContent = zahl(k) ? " " + zahl(k) : ""; });
    const z = basis.filter(f => pkIn(f, postfachFilter));
    [...pkGew].forEach(id => { if (!z.some(f => f.id === id)) pkGew.delete(id); });
    if ($("pkGewZahl")) $("pkGewZahl").textContent = pkGew.size ? pkGew.size + " gewählt" : "nichts gewählt";
    if ($("pkTodo")) { $("pkTodo").disabled = !pkGew.size; $("pkTodo").hidden = postfachFilter === "erledigt"; $("pkTodo").textContent = postfachFilter === "todo" ? "Zu Neu" : "ToDo"; }
    if ($("pkErl")) $("pkErl").disabled = !pkGew.size; if ($("pkDel")) $("pkDel").disabled = !pkGew.size;
    if ($("pkAlle")) $("pkAlle").checked = z.length > 0 && pkGew.size === z.length;
    $("pfListe").innerHTML = z.length ? z.map(f => { const kt = pkKat(f); const art = kt === "feedback" ? (ART_NAME[f.art] || f.art) : kt === "datenbank" ? "DB" : ART_NAME[kt]; const kurz = String(f.text || "").replace(/\s+/g, " ").trim();
      return `<details class="card pf pk-${kt} ${f.erledigt ? "erledigt" : ""}${pkIstTodo(f) ? " pk-ist-todo" : ""}" data-id="${esc(f.id)}">
        <summary>${pkAuswahl ? `<input type="checkbox" class="pk-cb" data-cb="${esc(f.id)}" ${pkGew.has(f.id) ? "checked" : ""} aria-label="Auswählen">` : ""}<span class="pf-art art-${esc(kt === "feedback" ? f.art : kt)}">${esc(art)}</span><span class="pk-vorschau">${esc(kurz.length > 70 ? kurz.slice(0, 70) + " …" : kurz)}</span>${pkIstNeu(f) ? `<i class="pk-punkt" aria-label="neu"></i>` : pkIstTodo(f) ? `<span class="pk-todo-m">ToDo</span>` : ""}<span class="small muted pk-zeit">${esc(pkDatum(f.zeit))}</span></summary>
        <p class="pf-text">${esc(f.text)}</p>
        <div class="small muted">${kt === "feedback" ? (f.name ? `von <b>${esc(f.name)}</b>` : "anonym") : (f.name ? esc(f.name) : "automatisch")} · ${esc(f.ver || "?")} · ${esc(String(f.geraet || "").replace(/^(status|datenbank) · /, ""))}</div>
        ${pkAuswahl ? "" : `<div class="row-btns" style="margin-top:8px">${pkIstNeu(f) ? `<button class="btn ghost mini" data-todo="${esc(f.id)}">ToDo</button>` : ""}<button class="btn ghost mini" data-erl="${esc(f.id)}">${f.erledigt ? "Wieder als neu" : "Erledigt"}</button>${pkIstTodo(f) ? `<button class="btn ghost mini" data-todo="${esc(f.id)}">Zu Neu</button>` : ""}<button class="btn ghost mini" data-del="${esc(f.id)}">Löschen</button></div>`}</details>`; }).join("")
      : `<p class="muted" style="margin:6px 0">${pkSuche.trim() ? "Nichts gefunden." : postfachFilter === "neu" ? "Nichts Neues. 🙂" : "Keine Einträge."}</p>`;
    if (pkAuswahl) $("pfListe").querySelectorAll("details.pf > summary").forEach(s => s.onclick = e => { e.preventDefault(); const id = s.parentElement.dataset.id; if (pkGew.has(id)) pkGew.delete(id); else pkGew.add(id); zeichne(); });
    $("pfListe").querySelectorAll("[data-erl]").forEach(b => b.onclick = async () => { SFX.tap(); const f = liste.find(x => x.id === b.dataset.erl); try { await L.feedbackErledigt(f.id, !f.erledigt); f.erledigt = !f.erledigt; pkTodoSetzen(f.id, false); zeichne(); } catch (e) { toast("<div>Das hat nicht geklappt.</div>"); } });
    $("pfListe").querySelectorAll("[data-todo]").forEach(b => b.onclick = () => { SFX.tap(); const f = liste.find(x => x.id === b.dataset.todo); if (!f) return; pkTodoSetzen(f.id, !pkIstTodo(f)); zeichne(); });
    $("pfListe").querySelectorAll("[data-del]").forEach(b => b.onclick = () => { SFX.tap();
      modal(`<h2>Eintrag löschen?</h2><p class="muted small">Das lässt sich nicht rückgängig machen.</p><button class="btn primary" data-close="ja">Löschen</button><button class="btn ghost" data-close>Abbrechen</button>`, async a => {
        if (a !== "ja") return; try { await L.feedbackLoeschen(b.dataset.del); pkTodoSetzen(b.dataset.del, false); liste = liste.filter(x => x.id !== b.dataset.del); zeichne(); } catch (e) { toast("<div>Löschen hat nicht geklappt.</div>"); } }); });
  };
  $("pkSuche").oninput = e => { pkSuche = e.target.value; zeichne(); };
  $("pkAlle").onchange = e => { const z = liste.filter(passt).filter(f => pkIn(f, postfachFilter)); pkGew.clear(); if (e.target.checked) z.forEach(f => pkGew.add(f.id)); zeichne(); };
  $("pkErl").onclick = async () => { SFX.tap(); const ziel = liste.filter(f => pkGew.has(f.id)); if (!ziel.length) return; let fehler = 0;
    for (const f of ziel) { try { await L.feedbackErledigt(f.id, postfachFilter !== "erledigt"); f.erledigt = postfachFilter !== "erledigt"; pkTodoSetzen(f.id, false); } catch (e) { fehler++; } }
    pkGew.clear(); zeichne(); if (fehler) toast(`<div>${fehler} Einträge konnten nicht geändert werden.</div>`); };
  $("pkDel").onclick = () => { SFX.tap(); const ziel = liste.filter(f => pkGew.has(f.id)); if (!ziel.length) return;
    modal(`<h2>${ziel.length} ${ziel.length === 1 ? "Eintrag" : "Einträge"} löschen?</h2><p class="muted small">Das lässt sich nicht rückgängig machen.</p><button class="btn primary" data-close="ja">Löschen</button><button class="btn ghost" data-close>Abbrechen</button>`, async a => {
      if (a !== "ja") return; let fehler = 0;
      for (const f of ziel) { try { await L.feedbackLoeschen(f.id); pkTodoSetzen(f.id, false); liste = liste.filter(x => x.id !== f.id); } catch (e) { fehler++; } }
      pkGew.clear(); zeichne(); if (fehler) toast(`<div>${fehler} Einträge konnten nicht gelöscht werden.</div>`); }); };
  $("pkTodo").onclick = () => { SFX.tap(); const ziel = liste.filter(f => pkGew.has(f.id)); if (!ziel.length) return; const an = postfachFilter !== "todo"; ziel.forEach(f => { if (!f.erledigt) pkTodoSetzen(f.id, an); }); pkGew.clear(); zeichne(); };
  L.feedbackListe().then(l => { liste = l; if (l.length < 200) { const t = pkTodoIds(); let ch = false; Object.keys(t).forEach(id => { if (!l.some(x => x.id === id)) { delete t[id]; ch = true; } }); if (ch) save(); } zeichne(); }).catch(() => { $("pfListe").innerHTML = `<p class="muted">Postkasten konnte nicht geladen werden.</p>`; });
};

/* ---------- XP-Prüfung (6.73, ausgebaut in 6.75) ----------
   Vergleicht die XP der Rangliste mit der Zählung je Quelle (Sammlung „xpquellen“) und mit dem Einzelprotokoll (Sammlung „xpprotokoll“).
   „Ohne Quelle“ = XP − Anfangsbestand − Summe der Quellen. Spiele sind nach XP sortiert (höchste oben) mit Anteil in % an den aktuellen XP. */
const xqZeit = z => new Date(+z).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
const xqUhr = z => new Date(+z).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
const xqDatum = d => { const p = String(d).split("-"); return p.length === 3 ? `${p[2].padStart(2, "0")}.${p[1].padStart(2, "0")}.` : String(d); };
const xqDauer = s => (s == null || !Number.isFinite(+s)) ? "–" : Math.floor(s / 60) + ":" + String(Math.round(s % 60)).padStart(2, "0") + " min";
const xqMs = t => (t && t.toMillis) ? t.toMillis() : (t && t.seconds ? t.seconds * 1000 : 0);
const xqProzent = p => (+p || 0).toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " %";
/* Farben wie in der App: Lernen = Saphir, Spielen = Bernstein, Arena (Duell) = Koralle, Biblionär = Türkis, Belohnungen = Gold */
const XQ_FARBE = { vers: "#7fc8ff", lektion: "#7fc8ff", spickzettel: "#7fc8ff", luecke: "#ffb54a", blitz: "#ffb54a", kette: "#ffb54a", duell: "#ff8a5c", duelleigen: "#ff8a5c", bib: "#7be04a", tagesbonus: "#f2c14e", spende: "#f4a6c8", abgleich: "#b39ddb", sonst: "#b8c0d8", alt: "#6b7399", offen: "#ff5c5c" };
const XQ_BEREICH = { spende: "Gemeinschaft", vers: "Lernen", lektion: "Lernen", spickzettel: "Lernen", luecke: "Spielen", blitz: "Spielen", kette: "Spielen", duell: "Arena", duelleigen: "Arena", bib: "Biblionär", tagesbonus: "Belohnung", abgleich: "anderes Gerät" };
/* höchste ehrliche XP je Sekunde und Quelle (Richtwerte, absichtlich großzügig) – und kürzeste Zeit je Antwort (0,3 s) */
const XQ_RATE = { vers: 45, lektion: 60, luecke: 75, blitz: 105, kette: 75, duell: 45, duelleigen: 45, bib: 24, sonst: 30 };
/* Auffälligkeiten einer einzelnen Vergabe (leer = unauffällig) */
function xqEvVerdacht(e) {
  const t = [], max = xqMaxFuer(e.q, e.ver);
  if (e.x > max) t.push(`${e.x} XP in einer Vergabe (ehrlich höchstens ${max})`);
  if (e.s != null && e.s >= 0) {
    const rate = XQ_RATE[e.q] || 0;
    if (rate && e.x >= 60 && e.x / Math.max(e.s, 1) > rate) t.push(`${e.x} XP in nur ${e.s} Sek. – zu schnell`);
    if (e.f >= 5 && e.s < e.f * 0.3) t.push(`${e.f} Antworten in ${e.s} Sek. – zu schnell`);
  }
  if (e.fm > 0 && e.f > e.fm) t.push(`Fortschritt ${e.f} von höchstens ${e.fm}`);
  return t;
}
/* Anteile eines Spielers: je Quelle, dazu „vor der Zählung“ und „ohne Quelle“, höchste XP zuerst */
function xqAnteile(q, n, alt, offen, xp) {
  const z = Object.entries(q || {}).filter(([, v]) => v > 0).map(([k, v]) => ({ k, name: XQ_QUELLEN[k] || k, xp: v, n: (n || {})[k] | 0, farbe: XQ_FARBE[k] || XQ_FARBE.sonst, bereich: XQ_BEREICH[k] || "" }));
  if (alt > 0) z.push({ k: "alt", name: "Vor der Zählung", xp: alt, n: 0, farbe: XQ_FARBE.alt, bereich: "Anfangsbestand" });
  if (offen > 0) z.push({ k: "offen", name: "Ohne Quelle", xp: offen, n: 0, farbe: XQ_FARBE.offen, bereich: "nicht erklärt" });
  const ges = Math.max(1, xp, z.reduce((a, r) => a + r.xp, 0));
  z.forEach(r => { r.p = r.xp / ges * 100; });
  return z.sort((a, b) => b.xp - a.xp);
}
/* 6.81: „Ohne Quelle“ aufschlüsseln. Grundlage ist das Einzelprotokoll eines Spielers: Jeder Eintrag kennt den XP-Stand vorher (v),
   die Vergabe (x) und eine laufende Nummer je Gerät (n). Folgt auf Nr. k die Nr. k+1, muss v gleich vorher v + x sein – liegt v höher,
   kamen dazwischen XP ohne Vergabe auf diesem Gerät dazu („Sprung“). Kategorien (in dieser Reihenfolge auf „ohne Quelle“ verteilt):
   wartet  – Vergaben, die nach der letzten gespeicherten Zählung gebucht wurden (Zählung dieses Geräts wurde abgelehnt, siehe xqNachholen)
   sprung  – Sprung ohne andere Vergaben dazwischen und ab Version 6.76: nicht erklärbar → bleibt rot
   zweit   – Sprung, während auf einem zweiten Gerät gespielt wurde (Übernahme beim Abgleich)
   altlast – Sprung mit App-Version vor 6.76 (Geräteabgleich wurde damals noch nicht gebucht) und Rest aus der Zeit vor dem Protokoll
   Rest ohne Erklärung bei vollständigem Protokoll → „nicht zuzuordnen“ (rot). Nur Anzeige – an den gezählten Quellen ändert sich nichts. */
const XQ_LUECKE = {
  wartet: { name: "Noch nicht übertragen", bereich: "Zählung eines Geräts hing hinterher", farbe: "#8fb3d9" },
  zweit: { name: "Übernahme vom zweiten Gerät", bereich: "Abgleich ohne mitgezählte Quelle", farbe: "#b39ddb" },
  altlast: { name: "Altlast vor 6.76", bereich: "Abgleich/alte Version, vor dem Protokoll", farbe: "#8a84a8" },
  sprung: { name: "Sprung ohne Spiel", bereich: "nicht erklärt", farbe: "#ff5c5c" },
  ohneprot: { name: "Ohne Protokoll-Eintrag", bereich: "Gerät ohne Zählung oder veränderter Spielstand", farbe: "#ff8a5c" },
  rest: { name: "Nicht zuzuordnen", bereich: "nicht erklärt", farbe: "#ff5c5c" }
};
function xqLueckenAnalyse(o, ev, vollGeladen) {
  const l = (ev || []).filter(e => e && +e.z > 0).slice().sort((a, b) => a.z - b.z || a.n - b.n);
  const nachNr = new Map(); l.forEach(e => { if (!nachNr.has(e.n)) nachNr.set(e.n, []); nachNr.get(e.n).push(e); });
  const summe = { wartet: 0, sprung: 0, ohneprot: 0, zweit: 0, altlast: 0 }, spruenge = [];
  /* 6.82: Rangliste höher als Stand nach der letzten protokollierten Vergabe → XP kamen ohne jeden Eintrag dazu */
  const letzte = l[l.length - 1]; if (letzte && vollGeladen && +o.xp > 0) summe.ohneprot = Math.max(0, Math.round(+o.xp - ((+letzte.v || 0) + (+letzte.x || 0))));
  if (o.upd) l.forEach(e => { if (xqMs(e.gebucht) > o.upd + 2000) summe.wartet += +e.x || 0; });
  l.forEach(e => {
    const vor = (nachNr.get(e.n - 1) || []).filter(p => p.z <= e.z && e.z - p.z < 30 * 864e5).pop(); if (!vor) return;
    const plus = Math.round((+e.v || 0) - ((+vor.v || 0) + (+vor.x || 0))); if (!(plus > 0)) return;
    const dazwischen = l.some(f => f !== vor && f !== e && f.z > vor.z && f.z < e.z);
    const k = !(parseFloat(e.ver) >= 6.76) ? "altlast" : (dazwischen || e.q === "abgleich") ? "zweit" : "sprung";
    summe[k] += plus; spruenge.push({ k, xp: plus, von: vor.z, bis: e.z, ver: e.ver || "" });
  });
  let rest = Math.max(0, Math.round(o.offen || 0)); const zeilen = [];
  ["wartet", "sprung", "ohneprot", "zweit", "altlast"].forEach(k => { const v = Math.min(rest, summe[k]); if (v > 0) { zeilen.push({ k, xp: v }); rest -= v; } });
  /* Protokoll unvollständig (Zählung begann vor 6.75 oder nicht alle Einträge geladen) → Rest gehört in die Zeit davor */
  const vollst = vollGeladen && l.length >= Object.values(o.n || {}).reduce((a, v) => a + (+v || 0), 0);
  if (rest > 0) { const k = vollst ? "rest" : "altlast", z = zeilen.find(r => r.k === k); if (z) z.xp += rest; else zeilen.push({ k, xp: rest }); }
  return { zeilen: zeilen.map(z => Object.assign({ n: 0 }, XQ_LUECKE[z.k], z)), spruenge: spruenge.sort((a, b) => b.bis - a.bis), vollst, eintraege: l.length };
}
/* Anteile mit aufgeschlüsselter Lücke statt einer roten Zeile „Ohne Quelle“ */
function xqAnteileLuecke(r, a, ohne) {
  const basis = xqAnteile(r.q, r.n, ohne ? 0 : r.alt, 0, ohne ? Math.max(0, r.xp - r.alt) : r.xp).concat(a.zeilen.map(z => Object.assign({}, z, { k: "l-" + z.k })));
  const ges = Math.max(1, ohne ? r.xp - r.alt : r.xp, basis.reduce((s, z) => s + z.xp, 0)); basis.forEach(z => { z.p = z.xp / ges * 100; });
  return basis.sort((x, y) => y.xp - x.xp);
}
/* opt.seit/opt.limit: Zeitraum und Höchstzahl der gelesenen Protokoll-Einträge (jeder Eintrag zählt als Lesezugriff im Tageskontingent!) */
async function xpPruefDaten(opt) {
  const L = window.LB, jetzt = Date.now(); opt = opt || {};
  const [sp, xl, ev] = await Promise.all([L.alleSpieler(), L.xpListe(), L.xpProtokollNeu ? L.xpProtokollNeu(opt.seit || jetzt - 7 * 864e5, opt.limit || 2000).catch(() => null) : Promise.resolve(null)]);
  const xm = new Map(xl.map(r => [r.pid, r])), ab24 = (() => { const d = new Date(jetzt - 864e5); return xqTagKey(d) + "-" + String(d.getHours()).padStart(2, "0"); })();
  const evVon = new Map(); (ev || []).forEach(e => { if (!evVon.has(e.pid)) evVon.set(e.pid, []); evVon.get(e.pid).push(e); });
  const seen = S.xpSeen || {};
  /* 6.83: Spieler, deren Besitzerlisten sich überschneiden, spielen auf demselben Gerät */
  const besitzer = new Map(sp.filter(r => r.name).map(r => [r.id, new Set(Array.isArray(r.owners) ? r.owners : [])]));
  const teilt = id => sp.filter(r => r.name && r.id !== id && [...(besitzer.get(r.id) || [])].some(u => (besitzer.get(id) || new Set()).has(u))).map(r => r.name);
  const liste = sp.filter(r => r.name).map(r => {
    const x = xm.get(r.id) || null, xp = +r.xp || 0, o = { id: r.id, name: r.name, xp, level: r.level || levelOf(xp), hat: !!x, flags: [], ev: (evVon.get(r.id) || []).sort((a, b) => b.z - a.z), geteilt: teilt(r.id) };
    if (o.geteilt.length) o.flags.push({ hart: false, t: `Teilt ein Gerät mit ${o.geteilt.join(", ")}` });
    if (!x) return o;
    const q = x.q || {}, n = x.n || {}, m = x.m || {}, std = x.std || {};
    o.bel = (Array.isArray(x.bel) ? x.bel : []).filter(e => e && +e.z > 0).sort((a, b) => a.z - b.z);
    { const gesehen = {}; o.bel.forEach(e => { const k = e.d || "?"; gesehen[k] = (gesehen[k] | 0) + 1; });
      Object.entries(gesehen).forEach(([k, c]) => { if (k !== "?" && c > 1) o.flags.push({ hart: true, t: `Tägliche Belohnung für den Truhen-Tag ${xqDatum(k)} ${c}× erhalten` }); });
      o.bel.forEach(e => { if (e.x !== AUFGABE_BONUS_XP && e.x !== 100) o.flags.push({ hart: true, t: `Tägliche Belohnung ${xqZeit(e.z)} mit ${e.x} XP statt ${AUFGABE_BONUS_XP}` }); }); }
    o.q = q; o.n = n; o.alt = x.alt | 0; o.upd = xqMs(x.updated); o.summe = Object.values(q).reduce((a, v) => a + (+v || 0), 0);
    o.offen = Math.max(0, xp - o.alt - o.summe);
    o.spitze = Math.max(0, ...Object.values(std).map(v => +v || 0));
    o.h24 = Object.entries(std).filter(([k]) => k >= ab24).reduce((a, [, v]) => a + (+v || 0), 0);
    o.anteile = xqAnteile(q, n, o.alt, o.offen, xp);
    if (o.offen > Math.max(500, xp * 0.1)) o.flags.push({ hart: true, t: `${o.offen.toLocaleString("de-DE")} XP ohne erklärende Quelle` });
    if (o.spitze > 30000) o.flags.push({ hart: true, t: `${o.spitze.toLocaleString("de-DE")} XP in einer einzigen Stunde` });
    Object.entries(m).forEach(([k, v]) => { const mx = xqMaxFuer(k, "6.76"); if (mx < v) o.flags.push({ hart: true, t: `Einzelvergabe ${v} XP bei „${XQ_QUELLEN[k] || k}“ (ehrlich höchstens ${mx})` }); });
    if ((q.abgleich | 0) > 0) o.flags.push({ hart: (q.abgleich | 0) > Math.max(1500, xp * 0.1), t: `${(q.abgleich | 0).toLocaleString("de-DE")} XP durch Geräteabgleich (Zuwachs von einem anderen Gerät)` });
    if ((q.duelleigen | 0) > 0) o.flags.push({ hart: false, t: `${(q.duelleigen | 0).toLocaleString("de-DE")} XP aus Duellen mit eigenem Profil` });
    /* Anstieg seit der letzten Prüfung: XP-Plus, das die Quellen nicht erklären */
    const sv = seen[r.id];
    if (sv && sv.z) { const dXp = xp - (sv.xp | 0), dQ = o.summe - (sv.sum | 0); if (dXp > 300 && dXp - dQ > Math.max(300, dXp * 0.2)) o.flags.push({ hart: true, t: `Seit ${xqZeit(sv.z)} +${dXp.toLocaleString("de-DE")} XP, davon nur ${Math.max(0, dQ).toLocaleString("de-DE")} durch Quellen erklärt` }); }
    /* Einzelvergaben der letzten 7 Tage prüfen (höchstens 4 Meldungen je Spieler) */
    const ba = []; o.ev.forEach(e => { const t = xqEvVerdacht(e); if (t.length) ba.push(`${xqUhr(e.z)} ${XQ_QUELLEN[e.q] || e.q}: ${t[0]}`); });
    ba.slice(0, 4).forEach(t => o.flags.push({ hart: true, t })); if (ba.length > 4) o.flags.push({ hart: true, t: `… und ${ba.length - 4} weitere auffällige Vergaben` });
    const uhr = o.ev.filter(e => { const g = xqMs(e.gebucht); return g && (e.z > g + 3e5 || g - e.z > 7 * 864e5); }).length;
    if (uhr) o.flags.push({ hart: false, t: `${uhr} Einträge, bei denen die Geräteuhr stark vom Server abweicht` });
    return o;
  });
  liste.evOk = ev !== null; return liste;
}
async function xpBerichte() {
  const L = window.LB; if (!entwickler || !L || !L.xpListe || !L.alleSpieler || Date.now() - (S.xpPruefZ | 0) < 3 * 36e5) return;
  try {
    /* Hintergrundprüfung liest nur Einträge seit der letzten Prüfung (nicht jedes Mal alle 7 Tage) – schont das tägliche Lese-Kontingent */
    const z = await xpPruefDaten({ seit: Math.max(Date.now() - 7 * 864e5, (S.xpPruefZ | 0) - 6e5), limit: 1500 });
    for (const r of z) { const h = r.flags.filter(f => f.hart); if (h.length) await postkastenMelden("datenbank", `XP-Prüfung: ${r.name} (${r.xp.toLocaleString("de-DE")} XP) – ${h.map(f => f.t).join("; ")}. Details: Postkasten → XP-Prüfung.`, "xp-" + r.id + "-" + today() + "-" + String(hash(h.map(f => f.t).join("|")))); }
    S.xpSeen = {}; z.forEach(r => { if (r.hat) S.xpSeen[r.id] = { xp: r.xp, sum: r.summe, z: Date.now() }; });
    S.xpPruef = today(); S.xpPruefZ = Date.now(); save();
  } catch (e) { /* Regeln noch nicht veröffentlicht oder kein Internet – später wieder */ }
}
/* 6.75: CSV-Ausgabe des Protokolls (Excel-tauglich: Semikolon, UTF-8 mit BOM). Texte, die mit = + - @ beginnen, bekommen ein ' davor,
   damit Namen oder Beschreibungen in Tabellenprogrammen nie als Formel laufen. */
const xqCsvFeld = v => { let t = v == null ? "" : String(v); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return /[;"\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
function xqCsv(liste) {
  const kopf = ["Datum", "Uhrzeit (Geraet)", "Spieler", "Spieler-ID", "Quelle", "XP", "XP vorher", "XP nachher", "Spielzeit (Sek.)", "Fortschritt", "Maximum", "Beschreibung", "Server-Zeit", "App-Version", "Auffaellig"];
  const zeilen = liste.slice().sort((a, b) => b.z - a.z).map(e => { const d = new Date(+e.z), g = xqMs(e.gebucht), pad = n => String(n).padStart(2, "0");
    return [`${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`, `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`, e.name || "", e.pid || "", XQ_QUELLEN[e.q] || e.q, e.x, e.v, (+e.v || 0) + (+e.x || 0),
      e.s == null ? "" : e.s, e.f == null ? "" : e.f, e.fm == null ? "" : e.fm, e.d || "", g ? new Date(g).toISOString() : "", e.ver || "", xqEvVerdacht(e).join(" | ")].map(xqCsvFeld).join(";"); });
  return "\uFEFF" + [kopf.join(";"), ...zeilen].join("\r\n") + "\r\n";
}
function xqCsvLaden(dateiname, liste) {
  const url = URL.createObjectURL(new Blob([xqCsv(liste)], { type: "text/csv;charset=utf-8" })), a = document.createElement("a");
  a.href = url; a.download = dateiname; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
const xqDateiTag = () => { const d = new Date(), p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const xqAnteilHtml = (zeilen) => `<div class="xq-bar" aria-hidden="true">${zeilen.map(z => `<i style="width:${Math.max(z.p, 0.4)}%;background:${z.farbe}" title="${esc(z.name)} ${xqProzent(z.p)}"></i>`).join("")}</div>
  <div class="xq-zeilen">${zeilen.map(z => `<div class="xq-zeile"><i class="xq-dot" style="background:${z.farbe}"></i><span class="xq-nm">${esc(z.name)}<small>${esc(z.bereich)}${z.n ? (z.bereich ? " · " : "") + z.n.toLocaleString("de-DE") + "×" : ""}</small></span><b class="xq-xp">${(+z.xp).toLocaleString("de-DE")}</b><span class="xq-p">${xqProzent(z.p)}</span></div>`).join("")}</div>`;
function xqEreignisHtml(e) {
  const v = xqEvVerdacht(e), farbe = XQ_FARBE[e.q] || XQ_FARBE.sonst, g = xqMs(e.gebucht);
  const abw = g && (e.z > g + 3e5 || g - e.z > 36e5) ? ` · Server ${esc(xqUhr(g))}` : "";
  return `<div class="xq-ev${v.length ? " bad" : ""}"><div class="xq-ev1"><span class="xq-evz">${esc(xqUhr(e.z))}</span><span class="xq-evq" style="color:${farbe}">● ${esc(XQ_QUELLEN[e.q] || e.q)}</span><b>+${(+e.x).toLocaleString("de-DE")} XP</b></div>
    <div class="small muted">Spielzeit ${esc(xqDauer(e.s))}${e.f != null ? ` · Fortschritt ${e.f}${e.fm ? " / " + e.fm : ""}` : ""} · Stand ${(+e.v).toLocaleString("de-DE")} → ${(+e.v + +e.x).toLocaleString("de-DE")}${e.ver ? " · v" + esc(e.ver) : ""}${abw}</div>
    ${e.d ? `<div class="small muted">${esc(e.d)}</div>` : ""}${v.map(t => `<div class="small xq-warn">⚠ ${esc(t)}</div>`).join("")}</div>`;
}
function xqLueckeHtml(a) {
  const zahl = v => (+v || 0).toLocaleString("de-DE");
  const erkl = { wartet: "Ein Gerät durfte seine Zählung nicht speichern, weil ein anderes Gerät schon weiter war. Die Vergaben stehen im Protokoll – ab 6.81 holt das Gerät den Stand nach.",
    zweit: "XP kamen beim Abgleich mit einem zweiten Gerät dazu, dessen Quellen nicht mitkamen (z. B. weil dort die Zählung abgelehnt wurde).",
    altlast: "Vor Version 6.76 wurde der Geräteabgleich nicht als Quelle gebucht; vor 6.75 gab es noch kein Protokoll. Diese XP lassen sich nicht mehr genauer zuordnen.",
    ohneprot: "Die Rangliste zeigt mehr XP als der Stand nach der letzten protokollierten Vergabe. Diese XP schrieb ein Gerät, das nichts protokolliert – eine alte App-Version (z. B. iPhone-Startbildschirm-App) – oder der Spielstand wurde verändert.",
    sprung: "Der XP-Stand stieg zwischen zwei Vergaben desselben Geräts, ohne dass irgendwo gespielt wurde. Das sollte nicht vorkommen – genauer ansehen.",
    rest: "Das Protokoll ist vollständig, erklärt diese XP aber nicht." };
  const sp = a.spruenge.filter(s => s.k === "sprung" || s.k === "zweit").slice(0, 8);
  return `${a.zeilen.map(z => `<div class="xq-zeile"><i class="xq-dot" style="background:${z.farbe}"></i><span class="xq-nm">${esc(z.name)}<small>${esc(erkl[z.k] || "")}</small></span><b class="xq-xp">${zahl(z.xp)}</b></div>`).join("")}
    ${sp.length ? `<div style="margin-top:6px"><b>Sprünge im Protokoll</b><br>${sp.map(s => `${esc(xqUhr(s.von))} → ${esc(xqUhr(s.bis))}: +${zahl(s.xp)} XP · ${esc(XQ_LUECKE[s.k].name)}${s.ver ? " · v" + esc(s.ver) : ""}`).join("<br>")}</div>` : ""}
    ${a.geteilt && a.geteilt.length && a.zeilen.some(z => z.k === "wartet" || z.k === "ohneprot") ? `<div style="margin-top:6px">ℹ Teilt ein Gerät mit ${esc(a.geteilt.join(", "))}: Bis 6.82 blieben XP-Quellen und Protokoll beim Spielerwechsel auf dem Gerät liegen, bis derselbe Spieler die App wieder öffnete. Seit 6.83 werden sie beim Wechsel und beim Start für alle Spieler des Geräts nachgeschickt – diese Lücke sollte dann kleiner werden.</div>` : ""}
    <div style="margin-top:4px"><i>${zahl(a.eintraege)} Protokoll-Einträge ausgewertet${a.vollst ? "" : " · Protokoll reicht nicht bis zum Beginn der Zählung zurück"}</i></div>`;
}
/* 6.77: gemessene XP pro Minute je Spiel (nur Vergaben ab Version 6.79 mit Spielzeit; 6.89: keine Mindestzeit, alle Spiele immer gelistet, 30 Tage) – Grundlage zum Nachjustieren */
const XQ_ZIEL_MIN = { solo: 150, duell: 225 };
/* 7.0: Zeitraum-Umschalter für „Gemeinde gesamt“ und jeden Spieler (je eigener Schalter, Standard Heute). Heute/7 Tage/30 Tage werden aus dem
   Einzelprotokoll (r.ev, bis 30 Tage / 4000 Einträge) berechnet, „Gesamt“ ist die bisherige Ansicht aus der Zählung (inkl. Anfangsbestand und „ohne Quelle“). */
const XQ_ZEIT = { heute: "Heute", woche: "7 Tage", monat: "30 Tage", gesamt: "Gesamt" };
const xqZModus = k => { const m = (window.__xqZ || {})[k]; return XQ_ZEIT[m] ? m : "heute"; };
const xqZSeg = k => { const m = xqZModus(k); return `<div class="seg xq-evseg" role="tablist" aria-label="Zeitraum" style="grid-template-columns:repeat(4,1fr)">${Object.entries(XQ_ZEIT).map(([v, t]) => `<button type="button" role="tab" data-zk="${esc(k)}" data-zm="${v}" aria-selected="${v === m}">${t}</button>`).join("")}</div>`; };
function xqZPeriode(evs, modus) {
  const seit = modus === "heute" ? xqTagStart() : Date.now() - (modus === "woche" ? 7 : 30) * 864e5, q = {}, n = {}; let xp = 0, cnt = 0, alt = Infinity;
  (evs || []).forEach(e => { if (e.z < alt) alt = e.z; if (e.z < seit || !(+e.x > 0)) return; const k = XQ_QUELLEN[e.q] ? e.q : "sonst"; q[k] = (q[k] | 0) + (+e.x); n[k] = (n[k] | 0) + 1; xp += +e.x; cnt++; });
  return { q, n, xp, cnt, abgeschnitten: (evs || []).length >= 4000 && alt > seit };
}
const xqZNotiz = (p, ok) => !ok ? `<div class="small muted">Das Einzelprotokoll ist nicht lesbar – Zeiträume gehen erst, wenn es geladen werden kann.</div>` : p.abgeschnitten ? `<div class="small muted">Hinweis: Es wurden nur die neuesten 4000 Vergaben geladen – dieser Zeitraum ist evtl. unvollständig.</div>` : "";
function xqGemInnen(z, ohne) {
  const zahl = v => (+v || 0).toLocaleString("de-DE"), m = xqZModus("gem"), seg = xqZSeg("gem");
  if (m === "gesamt") {
    const gez = z.filter(r => r.hat), gq = {}, gn = {}; let gXp = 0, gAlt = 0, gOffen = 0;
    gez.forEach(r => { gXp += r.xp; gAlt += r.alt; gOffen += r.offen; Object.entries(r.q).forEach(([k, v]) => { gq[k] = (gq[k] | 0) + (+v || 0); gn[k] = (gn[k] | 0) + (+(r.n[k]) || 0); }); });
    return `<div class="topline"><b>Gemeinde gesamt</b><span class="small muted">${gez.length} von ${z.length} Spielern gezählt · ${ohne ? zahl(gXp - gAlt) + " gezählte XP (ohne Anfangsbestand)" : zahl(gXp) + " XP"}</span></div>${seg}${gez.length ? xqAnteilHtml(xqAnteile(gq, gn, ohne ? 0 : gAlt, gOffen, ohne ? Math.max(0, gXp - gAlt) : gXp)) : `<div class="small muted">Noch keine Zählung.</div>`}`;
  }
  const alle = z.flatMap(r => r.ev || []), p = xqZPeriode(alle, m), akt = new Set(alle.filter(e => e.z >= (m === "heute" ? xqTagStart() : Date.now() - (m === "woche" ? 7 : 30) * 864e5)).map(e => e.pid)).size;
  return `<div class="topline"><b>Gemeinde gesamt</b><span class="small muted">${zahl(p.xp)} XP · ${zahl(p.cnt)} Vergaben · ${akt} von ${z.length} Spielern aktiv</span></div>${seg}${p.cnt ? xqAnteilHtml(xqAnteile(p.q, p.n, 0, 0, p.xp)) : `<div class="small muted">${m === "heute" ? "Heute" : m === "woche" ? "In den letzten 7 Tagen" : "In den letzten 30 Tagen"} noch keine protokollierten Vergaben.</div>`}${xqZNotiz(p, z.evOk)}`;
}
/* 7.1: Spielerliste der XP-Prüfung eingeklappt – je Spieler eine Zeile (Buchstabe, Name, Level/XP, Mini-Verlauf der letzten 7 Tage, XP heute, roter Rand bei Warnung),
   Tippen klappt die Details auf. Geöffnete Spieler merkt sich window.__xqOffen, solange die App offen ist. */
const XQ_CHEV = '<svg class="chev" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M5 7l5 6 5-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function xqSpielerZeile(r, ohne, evOk) {
  const zahl = v => (+v || 0).toLocaleString("de-DE"), t0 = xqTagStart(), tage = [0, 0, 0, 0, 0, 0, 0];
  (r.ev || []).forEach(e => { const i = 6 - Math.floor((t0 + 864e5 - 1 - e.z) / 864e5); if (i >= 0 && i <= 6 && +e.x > 0) tage[i] += +e.x; });
  const mx = Math.max(1, ...tage), heute = tage[6], hart = r.flags.some(f => f.hart);
  const sub = `Level ${r.level} · ${r.hat && ohne ? zahl(r.xp - r.alt) + " gezählt" : zahl(r.xp) + " XP"}`;
  return `<span class="av" aria-hidden="true">${esc(String(r.name || "?").trim().charAt(0).toUpperCase() || "?")}</span>
    <span class="nm"><b>${esc(r.name)}${r.geteilt && r.geteilt.length ? ` <span class="xq-teilt" title="Spielt auf demselben Gerät wie ${esc(r.geteilt.join(", "))}">${svg("people")}</span>` : ""}${hart ? ` <span class="xq-pkt" title="Auffälligkeit – Details aufklappen" aria-label="Auffälligkeit"></span>` : ""}</b><small>${sub}</small></span>
    <span class="sp" aria-hidden="true">${tage.map(v => `<i style="height:${evOk ? Math.max(2, Math.round(v / mx * 22)) : 2}px"></i>`).join("")}</span>
    <span class="hx"><b>${evOk && heute ? "+" + zahl(heute) : "–"}</b><small>heute</small></span>${XQ_CHEV}`;
}
function xqSpielerBalken(r, ohne) {
  const m = xqZModus(r.id);
  if (m === "gesamt") return `<div id="xqBar-${esc(r.id)}">${xqAnteilHtml(r.luecke ? xqAnteileLuecke(r, r.luecke, ohne) : ohne ? xqAnteile(r.q, r.n, 0, r.offen, Math.max(0, r.xp - r.alt)) : r.anteile)}</div>`;
  const p = xqZPeriode(r.ev || [], m);
  return `<div class="small muted">${(+p.xp).toLocaleString("de-DE")} XP · ${p.cnt} ${p.cnt === 1 ? "Vergabe" : "Vergaben"} (${XQ_ZEIT[m]})</div>${p.cnt ? xqAnteilHtml(xqAnteile(p.q, p.n, 0, 0, p.xp)) : `<div class="small muted">${m === "heute" ? "Heute" : m === "woche" ? "In den letzten 7 Tagen" : "In den letzten 30 Tagen"} noch keine protokollierten Vergaben.</div>`}${xqZNotiz(p, true)}`;
}
function xqZVerdrahten(z, ohne) {
  document.querySelectorAll("[data-zk]").forEach(b => b.onclick = () => {
    const k = b.dataset.zk, m = b.dataset.zm; if (xqZModus(k) === m) return; SFX.tap(); (window.__xqZ = window.__xqZ || {})[k] = m;
    if (k === "gem") { const box = $("xqGem"); if (box) box.innerHTML = xqGemInnen(z, ohne); }
    else { const r = z.find(x => x.id === k), box = $("xqZeit-" + k); if (r && box) box.innerHTML = xqZSeg(k) + xqSpielerBalken(r, ohne); }
    xqZVerdrahten(z, ohne);
  });
}
function xqTagStart() { const t = new Date(); t.setHours(0, 0, 0, 0); return t.getTime(); }
const XQ_RATE_ZEIT = { heute: "Heute", woche: "7 Tage", monat: "30 Tage" };
function xqRateInnen(z) {
  const modus = XQ_RATE_ZEIT[window.__xqRateModus] ? window.__xqRateModus : "heute", seit = modus === "heute" ? xqTagStart() : Date.now() - (modus === "woche" ? 7 : 30) * 864e5;
  const g = {};
  z.forEach(r => (r.ev || []).forEach(e => { if (e.z < seit || !(parseFloat(e.ver) >= 6.79) || !(e.s > 0) || !XQ_BEREICH[e.q] || e.q === "tagesbonus" || e.q === "spickzettel" || e.q === "spende") return;
    const q = e.q === "duelleigen" ? "duell" : e.q;   // 6.90: Duelle auf dem eigenen Profil zählen als Duell
    const o = g[q] || (g[q] = { x: 0, s: 0, n: 0 }); o.x += e.x; o.s += e.s; o.n++; }));
  const ALLE = ["vers", "lektion", "luecke", "blitz", "kette", "duell", "bib"];
  const zeilen = ALLE.map(q => { const o = g[q]; return { q, n: o ? o.n : 0, s: o ? o.s : 0, r: o ? o.x / (o.s / 60) : null }; });
  const seg = `<div class="seg xq-evseg" role="tablist" aria-label="Zeitraum" style="grid-template-columns:repeat(3,1fr)">${Object.entries(XQ_RATE_ZEIT).map(([k, t]) => `<button type="button" role="tab" data-ratem="${k}" aria-selected="${k === modus}">${t}</button>`).join("")}</div>`;
  const kopf = `<div class="topline"><b>XP pro Minute</b><span class="small muted">Ziel ${XQ_ZIEL_MIN.solo} (Duell ${XQ_ZIEL_MIN.duell})</span></div>${seg}`;
  if (!zeilen.some(t => t.n)) return `${kopf}<div class="small muted">${modus === "heute" ? "Heute" : modus === "woche" ? "In den letzten 7 Tagen" : "In den letzten 30 Tagen"} gibt es noch keine Messwerte. Sie erscheinen, sobald Spieler die Version 6.79 oder neuer nutzen und das Protokoll lesbar ist.</div>`;
  const dauer = sek => sek >= 120 ? Math.round(sek / 60) + " Min" : Math.round(sek) + " s";
  const mit = zeilen.filter(t => t.r != null).sort((a, b) => b.r - a.r), ohne = zeilen.filter(t => t.r == null);
  return `${kopf}${mit.map(t => {
    const ziel = t.q === "duell" ? XQ_ZIEL_MIN.duell : XQ_ZIEL_MIN.solo, abw = Math.round((t.r / ziel - 1) * 100);
    return `<div style="display:grid;grid-template-columns:auto 1fr auto auto;gap:2px 8px;align-items:baseline"><i class="xq-dot" style="background:${XQ_FARBE[t.q] || XQ_FARBE.sonst}"></i><span class="xq-nm">${esc(XQ_QUELLEN[t.q] || t.q)}</span><b>${Math.round(t.r)}</b><span class="small" style="min-width:3.2em;text-align:right;color:${abw >= 0 ? "var(--good,#7fd99a)" : "var(--muted,#9aa)"}">${abw > 0 ? "+" : ""}${abw} %</span><span></span><span class="small muted" style="grid-column:2/5">${t.n}× · ${dauer(t.s)}${t.n < 3 ? " · wenig Daten" : ""}</span></div>`; }).join("")}${ohne.length ? `<div class="small muted">Noch keine Messung: ${ohne.map(t => esc(XQ_QUELLEN[t.q] || t.q)).join(", ")}</div>` : ""}`;
}
function xqRateKarte(z) { return `<div class="card stack" id="xqRate">${xqRateInnen(z)}</div>`; }
function xqRateVerdrahten(z) {
  const box = $("xqRate"); if (!box) return;
  box.querySelectorAll("[data-ratem]").forEach(b => b.onclick = () => { if (b.dataset.ratem === (window.__xqRateModus || "heute")) return; SFX.tap(); window.__xqRateModus = b.dataset.ratem; box.innerHTML = xqRateInnen(z); xqRateVerdrahten(z); });
}
/* 6.95: Talente-Planung (nur Verwalter) – Guthaben je Spieler, verdiente Talente pro Tag und Prognose, wie viel die Gemeinde für Events wie die
   Stiftshütte spenden kann. Datenquellen: Sammlung „talente“ (Zählung ab Version 6.95, siehe talBuchen) und „stiftshuette“ (alle Spenden). */
const talZ1 = v => (Math.round((+v || 0) * 10) / 10).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
function talAuswerten(tz, stift) {
  const n = dayNum(today()), gesp = new Map((stift || []).map(r => [r.pid, Object.values(r.s || {}).reduce((a, v) => a + (v | 0), 0)]));
  return tz.map(r => {
    const s = (r.s | 0) || n, t = r.t || {}, ab = Math.max(s, n - 34), summe = (von, bis) => Object.entries(t).reduce((a, [k, v]) => (+k >= von && +k <= bis) ? a + (v | 0) : a, 0);
    const spiel = (r.sd || []).filter(x => x >= ab).length, tage7 = Math.max(1, Math.min(7, n - s + 1));
    return { pid: r.pid, name: r.name || "?", tal: r.tal | 0, v: r.v | 0, a: r.a | 0, p: gesp.get(r.pid) | 0, s, spiel, proSpiel: spiel ? summe(ab, n) / spiel : null, pro7: summe(n - 6, n) / tage7, tage7, stand: xqMs(r.updated) };
  });
}
function talPrognose(z, stift) {
  const sum = STIFT.map(() => 0); (stift || []).forEach(r => { for (let k = 1; k <= 8; k++) sum[k - 1] += (r.s || {})[k] | 0; });
  let k = 0; while (k < 8 && sum[k] >= STIFT[k].ziel) k++;
  const rest = k < 8 ? STIFT[k].ziel - sum[k] : 0, restAlle = STIFT.reduce((a, x, i) => i >= k ? a + Math.max(0, x.ziel - sum[i]) : a, 0);
  const guth = z.reduce((a, r) => a + r.tal, 0), fluss = z.reduce((a, r) => a + r.pro7, 0), gespendet = sum.reduce((a, v) => a + v, 0);
  const tage = (need, q) => { const vorrat = guth * q, f = fluss * q; return need <= vorrat ? 0 : f > 0 ? Math.ceil((need - vorrat) / f) : null; };
  return { k, rest, restAlle, guth, fluss, gespendet, tage, sum };
}
VIEWS.talente = () => {
  const L = window.LB;
  screen.innerHTML = `${backBtn("postfach", "Postkasten")}<h1>Talente-Planung</h1>
  <details class="small muted tp-hinweis"><summary>Hinweis zur Zählung</summary><p style="margin:6px 0 0">Gezählt wird ab Version 6.95, je Spieler ab dem Tag, an dem seine App die neue Version zum ersten Mal öffnet. Davor gibt es keine Daten. Die Durchschnitte werden mit jedem Tag verlässlicher.</p><p style="margin:6px 0 0">Prognose: Die Spalten zeigen, wie viel Prozent der Spieler ihr Guthaben und alle neu verdienten Talente spenden. Die Abschnitte werden nacheinander gefüllt und öffnen frühestens am angegebenen Montag; das Datum ist ein Richtwert nach dem Zufluss der letzten 7 Tage. Ø/Spieltag zählt nur Tage, an denen gespielt wurde, Ø 7 Tage jeden Kalendertag.</p></details>
  <div class="stack" id="talListe"><p class="muted small">Lade …</p></div>`;
  wireGo();
  if (!entwickler || !L || !L.ok || !L.talListe) { $("talListe").innerHTML = `<p class="muted">Die Talente-Planung braucht Internet und Verwalter-Rechte.</p>`; return; }
  Promise.all([L.talListe(), L.stiftListe ? L.stiftListe() : Promise.resolve([]), L.alleSpieler ? L.alleSpieler() : Promise.resolve([])]).then(([tz, stift, sp]) => {
    const z = talAuswerten(tz, stift).sort((a, b) => b.tal - a.tal), pr = talPrognose(z, stift), hat = new Set(z.map(r => r.pid));
    const ohne = (sp || []).filter(r => r.name && !hat.has(r.id)).map(r => r.name).sort((a, b) => a.localeCompare(b, "de"));
    const st = pr.k < 8 ? STIFT[pr.k] : null, ziel = STIFT.reduce((a, x) => a + x.ziel, 0);
    const kachel = (zahl, text) => `<div class="tp-k"><b>${zahl}</b><span>${text}</span></div>`;
    const kopf = `<div class="tp-kacheln">${kachel(pkt(pr.guth), "Guthaben")}${kachel(talZ1(pr.fluss) + "/Tag", "Zufluss · Ø 7 Tage")}${kachel(pkt(pr.gespendet), "gespendet von " + pkt(ziel))}</div>`;
    /* Prognose je Abschnitt: voraussichtlicher Tag, an dem der Abschnitt voll ist. Die Abschnitte werden nacheinander gefüllt, deshalb zählt der Bedarf
       aller Abschnitte bis dahin (noch fehlende Talente). Frühestens am Montag, an dem der Abschnitt öffnet; das Guthaben darf vorher gespart werden. */
    const heute = dayNum(today()), jahr = new Date().getFullYear(), q3 = [1, 0.5, 0.25];
    const dat = tag => { const d = datumVon(tag); return d.toLocaleDateString("de-DE", d.getFullYear() === jahr ? { day: "numeric", month: "numeric" } : { day: "numeric", month: "numeric", year: "2-digit" }); };
    let cum = 0;
    const abschnitte = STIFT.map((a, i) => {
      const rest = Math.max(0, a.ziel - pr.sum[i]), offen = dayNum(STIFT_START) + 7 * i; cum += rest;
      const zelle = q => { if (!rest) return "✓"; const t = pr.tage(cum, q); return t === null ? "–" : dat(Math.max(heute + t, offen)); };
      return `<div class="tp-s"><div class="tp-zeile"><b>${i + 1}. ${esc(a.kurz)}</b>${q3.map(q => `<span>${zelle(q)}</span>`).join("")}</div>
        <div class="tp-d">Ziel ${pkt(a.ziel)} · ${rest ? "noch " + pkt(rest) : "voll"} · öffnet ${esc(dat(offen))}${i === pr.k ? " · jetzt offen" : ""}</div></div>`;
    }).join("");
    const prog = `<div class="card tp-prog"><div class="topline"><b>Prognose je Abschnitt</b><span class="small muted">≈ ${pkt(Math.round(pr.fluss * 7))} pro Woche</span></div>
      <div class="tp-zeile tp-zk"><span>Voll am</span>${q3.map(q => `<span>${Math.round(q * 100)} %</span>`).join("")}</div>${abschnitte}
      <div class="small muted" style="margin-top:4px">${pr.restAlle ? `Bis zur Bundeslade fehlen noch ${pkt(pr.restAlle)} Talente.` : "Alle Abschnitte sind erreicht."}</div></div>`;
    const zeile = r => `<div class="tp-s"><div class="tp-zeile"><b>${esc(r.name)}</b><span>${pkt(r.tal)}</span><span>${r.proSpiel === null ? "–" : talZ1(r.proSpiel)}</span><span>${talZ1(r.pro7)}</span></div>
      <div class="tp-d">seit ${esc(datumVon(r.s).toLocaleDateString("de-DE", { day: "numeric", month: "numeric" }))} verdient ${pkt(r.v)} · Laden ${pkt(r.a)} · gespendet ${pkt(r.p)} · ${r.spiel} Spieltage</div></div>`;
    const liste = `<div class="card tp-liste"><div class="tp-zeile tp-zk"><span>Spieler</span><span>Guthaben</span><span>Ø/Spieltag</span><span>Ø 7 Tage</span></div>${z.map(zeile).join("") || `<p class="small muted">Noch keine Zählung.</p>`}</div>`;
    $("talListe").innerHTML = kopf + prog + liste + (ohne.length ? `<div class="small muted">Noch ohne Zählung (App noch nicht in 6.95 geöffnet): ${ohne.map(esc).join(", ")}</div>` : "") +
      `<button class="btn ghost mini" id="talCsv" style="align-self:flex-start">${svg("scroll")} Als CSV (Excel)</button>`;
    if ($("talCsv")) $("talCsv").onclick = () => {
      SFX.tap(); const num = v => v === null ? "" : String(Math.round(v * 10) / 10).replace(".", ","), kopfz = ["Spieler", "Spieler-ID", "Guthaben", "Verdient seit Zaehlbeginn", "Zaehlbeginn", "Spieltage (35 Tage)", "Durchschnitt je Spieltag", "Durchschnitt pro Tag (7 Tage)", "Im Laden ausgegeben", "Stiftshuette gespendet", "Stand"];
      const zeilen = z.map(r => [r.name, r.pid, r.tal, r.v, datumVon(r.s).toLocaleDateString("de-DE"), r.spiel, num(r.proSpiel), num(r.pro7), r.a, r.p, r.stand ? xqZeit(r.stand) : ""].map(xqCsvFeld).join(";"));
      const url = URL.createObjectURL(new Blob(["﻿" + [kopfz.join(";"), ...zeilen].join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" })), a = document.createElement("a");
      a.href = url; a.download = `talente-gemeinde-${xqDateiTag()}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    };
  }).catch(e => { $("talListe").innerHTML = `<p class="muted">Konnte nicht geladen werden (${esc((e && e.code) || "Fehler")}). Sind die neuen Firebase-Regeln (Version 6.95) veröffentlicht?</p>`; });
};
VIEWS.xppruefung = () => {
  const L = window.LB;
  screen.innerHTML = `${backBtn("postfach", "Postkasten")}<h1>XP-Prüfung</h1>
  <p class="muted small" style="margin:0 0 10px">Jede XP-Vergabe wird mit Quelle, Uhrzeit, Spielzeit und Fortschritt protokolliert und kann später in der Datenbank nachgeprüft werden (Einträge lassen sich nicht mehr ändern oder löschen). Die Spiele sind nach XP sortiert, die Farben entsprechen den Bereichen der App: <span style="color:${XQ_FARBE.vers}">Lernen</span> · <span style="color:${XQ_FARBE.blitz}">Spielen</span> · <span style="color:${XQ_FARBE.duell}">Arena</span> · <span style="color:${XQ_FARBE.bib}">Biblionär</span> · <span style="color:${XQ_FARBE.tagesbonus}">Belohnung</span> · <span style="color:${XQ_FARBE.spende}">Spenden-Events</span>. „Ohne Quelle“ sind XP, die weder zum Anfangsbestand noch zu einer Quelle passen – das kann auf Veränderungen am Spielstand hindeuten (oder auf ein Gerät mit alter App-Version). Die Zählung beginnt für jeden Spieler erst, wenn er die neue Version öffnet.</p>
  <label class="small" style="display:flex;gap:8px;align-items:center;margin:0 0 10px"><input type="checkbox" id="xqOhneAlt" ${S.xqOhneAlt ? "checked" : ""}> „Vor der Zählung“ ausblenden – nur gezählte XP zeigen und danach sortieren</label>
  <div class="stack" id="xpListe"><p class="muted small">Lade …</p></div>`;
  wireGo();
  if (!entwickler || !L || !L.ok || !L.xpListe) { $("xpListe").innerHTML = `<p class="muted">Die XP-Prüfung braucht Internet und Verwalter-Rechte.</p>`; return; }
  const zahl = v => (+v || 0).toLocaleString("de-DE");
  xpPruefDaten({ seit: Date.now() - 30 * 864e5, limit: 4000 }).then(z => {
   const zeichnen = () => {
    const ohne = !!S.xqOhneAlt;   // 6.80: „Vor der Zählung“ ausblenden → nur gezählte XP, danach sortiert
    z.sort((a, b) => (b.level - a.level) || (b.xp - a.xp) || String(a.name).localeCompare(String(b.name), "de"));   // 7.2: höchstes Level oben, bei gleichem Level mehr XP zuerst
    const auffaellig = z.filter(r => r.flags.some(f => f.hart));
    const gesamt = z.length ? `<div class="card stack" id="xqGem">${xqGemInnen(z, ohne)}</div>` : "";
    const warn = auffaellig.length ? `<div class="card stack xq-karte-bad"><b>⚠ Auffälligkeiten (${auffaellig.length})</b>${auffaellig.map(r => `<div class="small"><b>${esc(r.name)}</b> (${zahl(r.xp)} XP)<br>${r.flags.filter(f => f.hart).map(f => esc(f.t)).join("<br>")}</div>`).join("")}</div>` : `<div class="card small muted">Keine Auffälligkeiten.</div>`;
    const hinweis = z.evOk ? "" : `<div class="card small muted">Das Einzelprotokoll ist noch nicht lesbar – sind die neuen Firebase-Regeln (Version 6.75) veröffentlicht?</div>`;
    const csvAlle = `<button class="btn ghost breit" id="xqCsvAlle" style="width:100%">${svg("scroll")} Alle XP-Vergaben als CSV-Datei (Excel)</button><div class="small muted" id="xqCsvMeld" aria-live="polite"></div>`;
    $("xpListe").innerHTML = hinweis + warn + gesamt + xqRateKarte(z) + csvAlle + `<div class="card stack"><button class="btn ghost breit" id="xqAnAlle" style="width:100%">${svg("check")} Zählung für alle Spieler anfordern</button><div class="small muted" id="xqAnAlleM" aria-live="polite">Jede App gleicht beim nächsten Start ihre XP-Zählung mit der Datenbank ab.</div></div>` + z.map(r => {
      const zeile = xqSpielerZeile(r, ohne, z.evOk), bad = r.flags.some(f => f.hart), offen = (window.__xqOffen || {})[r.id] ? " open" : "";
      if (!r.hat) return `<details class="xq-sp" data-spid="${esc(r.id)}"${offen}><summary>${zeile}</summary><div class="xq-spbody small muted">Noch keine Zählung (neue Version noch nicht geöffnet).</div></details>`;
      return `<details class="xq-sp${bad ? " bad" : ""}" data-spid="${esc(r.id)}"${offen}><summary>${zeile}</summary><div class="xq-spbody stack">
        <div class="stack" id="xqZeit-${esc(r.id)}">${xqZSeg(r.id)}${xqSpielerBalken(r, ohne)}</div>
        ${r.offen > 0 ? `<details data-xqlu="${esc(r.id)}"${r.luecke ? " open" : ""}><summary class="small">Woher kommen die ${zahl(r.offen)} XP „ohne Quelle“?</summary><div class="xq-luliste small muted" style="margin-top:6px">${r.luecke ? xqLueckeHtml(r.luecke) : "Wird beim Öffnen aus dem Protokoll berechnet …"}</div></details>` : ""}
        <div class="small muted">Letzte 24 Stunden: ${zahl(r.h24)} XP · stärkste Stunde: ${zahl(r.spitze)} XP</div>
        <details data-xpev="${esc(r.id)}"><summary class="small">Protokoll aller XP-Vergaben (Zeit, Spielzeit, Fortschritt)</summary><div class="xq-evliste small muted" style="margin-top:6px">Wird beim Öffnen geladen …</div></details>
        ${r.bel.length ? `<details><summary class="small">Tägliche Belohnung: ${r.bel.length}× erhalten · zuletzt ${esc(xqZeit(r.bel[r.bel.length - 1].z))} (+${r.bel[r.bel.length - 1].x} XP)</summary><div class="small muted" style="margin-top:6px">${r.bel.slice(-14).reverse().map(e => `${esc(xqZeit(e.z))} · +${e.x} XP · +${e.t} Talente · Truhe vom ${esc(xqDatum(e.d || "?"))}${e.a === "gestern" ? " (am Folgetag automatisch geöffnet)" : ""}`).join("<br>")}<br><i>Uhrzeit laut Gerät des Spielers</i></div></details>` : ""}
        ${r.id === S.pid ? `<div><button class="btn ghost mini" data-xqab>${svg("check")} Zählung jetzt abgleichen</button><div class="small muted" data-xqabm aria-live="polite" style="margin-top:4px">${xqFehler ? "Letzter Fehler auf diesem Gerät: " + esc(xqFehler.code) + (xqFehler.msg ? " – " + esc(xqFehler.msg) : "") : ""}</div></div>` : ""}
        ${r.id !== S.pid ? `<div><button class="btn ghost mini" data-xqan="${esc(r.id)}">${svg("check")} Zählung jetzt anfordern</button><div class="small muted" data-xqanm aria-live="polite" style="margin-top:4px">Der Spieler gleicht beim nächsten Start der App ab.</div></div>` : ""}
        ${r.flags.map(f => `<div class="small" style="color:${f.hart ? "var(--bad,#ff8a5c)" : "var(--muted,#9aa)"}">${f.hart ? "⚠ " : "ℹ "}${esc(f.t)}</div>`).join("")}</div></details>`;
    }).join("") || `<p class="muted">Keine Einträge.</p>`;
    if ($("xqCsvAlle")) $("xqCsvAlle").onclick = async () => {
      SFX.tap(); const k = $("xqCsvAlle"), m = $("xqCsvMeld"); k.disabled = true; m.textContent = "Lade das Protokoll …";
      try { const l = await L.xpProtokollNeu(0, 10000); if (!l.length) m.textContent = "Noch keine protokollierten Vergaben."; else { xqCsvLaden(`xp-protokoll-gemeinde-${xqDateiTag()}.csv`, l); m.textContent = `${l.length.toLocaleString("de-DE")} Vergaben exportiert${l.length >= 10000 ? " (die neuesten 10.000)" : ""}.`; } }
      catch (e) { m.textContent = "Export fehlgeschlagen (" + ((e && e.code) || "Fehler") + ")."; }
      k.disabled = false;
    };
    const anfordern = async (id, b, m) => { SFX.tap(); b.disabled = true; m.textContent = "Fordere an …";
      try { await L.abgleichAnfordern(id); m.textContent = "✓ Angefordert – wird beim nächsten Start der App des Spielers ausgeführt."; }
      catch (e) { m.textContent = "✗ Nicht möglich (" + ((e && e.code) || "Fehler") + ") – sind die neuen Firebase-Regeln (6.88) veröffentlicht und ist dieses Gerät als Verwalter eingetragen?"; }
      b.disabled = false; };
    xqRateVerdrahten(z); xqZVerdrahten(z, ohne);
    screen.querySelectorAll("details.xq-sp").forEach(d => d.addEventListener("toggle", () => { (window.__xqOffen = window.__xqOffen || {})[d.dataset.spid] = d.open; }));
    if ($("xqAnAlle")) $("xqAnAlle").onclick = () => anfordern("_alle", $("xqAnAlle"), $("xqAnAlleM"));
    screen.querySelectorAll("[data-xqan]").forEach(b => b.onclick = () => anfordern(b.dataset.xqan, b, b.parentNode.querySelector("[data-xqanm]")));
    screen.querySelectorAll("[data-xqab]").forEach(b => b.onclick = async () => {
      SFX.tap(); const m = b.parentNode.querySelector("[data-xqabm]"); b.disabled = true; m.textContent = "Gleiche ab …";
      try {
        const r = await xqAbgleichen(true), nm = k => XQ_QUELLEN[k] || k;
        const alt = r.srv ? `In der Datenbank standen: ${Object.entries(r.srv.q || {}).map(([k, v]) => nm(k) + " " + v).join(", ") || "–"}.` : "In der Datenbank gab es noch keine Zählung.";
        if (r.code === "nicht-bereit") m.textContent = "Nicht möglich (Internet, Anmeldung oder gesperrtes Fenster).";
        else if (r.ok) m.innerHTML = `✓ Gespeichert. ${esc(alt)}<br>${r.neu.length ? "Neu eingetragen: " + r.neu.map(x => esc(nm(x.k)) + " " + x.vorher + " → " + x.jetzt).join(", ") : "Nichts nachzutragen – die Datenbank war schon aktuell."}<br>Der alte Stand hätte verletzt: ${esc(xqUnterschiedText(r.vorher))}.<br>Öffne die XP-Prüfung neu, um die Zahlen zu aktualisieren.`;
        else m.innerHTML = `✗ Abgelehnt (${esc(r.code)}${r.msg ? ": " + esc(r.msg) : ""}).<br>${esc(alt)}<br>Verletzt (alter Stand): ${esc(xqUnterschiedText(r.vorher))}<br>Verletzt (nach Mischen): ${esc(xqUnterschiedText(r.diffs))}${r.ok_teile ? `<br><b>Einzeln gespeichert:</b> ${esc(r.ok_teile.join(", ") || "nichts")}<br><b>Von der Datenbank abgelehnt:</b> ${esc(r.abgelehnt.join(", ") || "nichts")}` : ""}`;
      } catch (e) { m.textContent = "Abgleich fehlgeschlagen (" + ((e && e.code) || "Fehler") + ")."; }
      b.disabled = false;
    });
    screen.querySelectorAll("details[data-xqlu]").forEach(d => d.addEventListener("toggle", () => {
      const r = z.find(x => x.id === d.dataset.xqlu); if (!d.open || !r || r.luecke || d.dataset.laedt) return; d.dataset.laedt = "1"; const box = d.querySelector(".xq-luliste");
      L.xpProtokoll(r.id, 2000).then(l => { r.luecke = xqLueckenAnalyse(r, l, l.length < 2000); r.luecke.geteilt = r.geteilt || []; box.innerHTML = xqLueckeHtml(r.luecke);
        const bar = $("xqBar-" + r.id); if (bar) bar.innerHTML = xqAnteilHtml(xqAnteileLuecke(r, r.luecke, !!S.xqOhneAlt)); })
        .catch(e => { d.dataset.laedt = ""; box.textContent = "Konnte nicht geladen werden (" + ((e && e.code) || "Fehler") + ")."; });
    }));
    screen.querySelectorAll("details[data-xpev]").forEach(d => d.addEventListener("toggle", () => {
      if (!d.open || d.dataset.geladen) return; d.dataset.geladen = "1"; const box = d.querySelector(".xq-evliste"), pid = d.dataset.xpev, zwischen = {};
      const tagStart = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t.getTime(); };
      const zeigen = async modus => {
        box.innerHTML = `<div class="seg xq-evseg" role="tablist" aria-label="Zeitraum"><button type="button" role="tab" data-evm="heute" aria-selected="${modus === "heute"}">Heute</button><button type="button" role="tab" data-evm="woche" aria-selected="${modus === "woche"}">Letzte 7 Tage</button></div><div class="xq-evinhalt small muted">Lade …</div>`;
        box.querySelectorAll("[data-evm]").forEach(b => b.onclick = () => { if (b.dataset.evm === modus) return; SFX.tap(); window.__xqEvModus = b.dataset.evm; zeigen(b.dataset.evm); });
        const inh = box.querySelector(".xq-evinhalt");
        try {
          if (!zwischen[modus]) zwischen[modus] = await L.xpProtokoll(pid, 1000, modus === "heute" ? tagStart() : Date.now() - 7 * 864e5);
          if (box.querySelector("[aria-selected=true]").dataset.evm !== modus) return;
          const alle = zwischen[modus], l = alle.slice(0, 100), summe = alle.reduce((a, e) => a + (+e.x || 0), 0);
          const kopf = modus === "heute" ? "heute" : "7 Tage";
          inh.className = "xq-evinhalt";
          inh.innerHTML = l.length ? `<div class="small muted" style="margin-bottom:6px">${alle.length > l.length ? `Die letzten ${l.length} von ${alle.length} Vergaben` : `${l.length} ${l.length === 1 ? "Vergabe" : "Vergaben"}`} (${kopf}) · zusammen +${summe.toLocaleString("de-DE")} XP · neueste zuerst · Uhrzeit laut Gerät des Spielers</div>${l.map(xqEreignisHtml).join("")}<button class="btn ghost mini" data-xqcsv style="margin-top:4px">${svg("scroll")} Dieses Protokoll als CSV</button>` : `<div class="small muted">${modus === "heute" ? "Heute noch keine protokollierten Vergaben." : "In den letzten 7 Tagen keine protokollierten Vergaben."}</div>`;
          const kn = inh.querySelector("[data-xqcsv]"); if (kn) kn.onclick = async () => { SFX.tap(); kn.disabled = true; try { const voll = await L.xpProtokoll(pid, 5000); xqCsvLaden(`xp-protokoll-${String(((z.find(r => r.id === pid) || {}).name) || "spieler").replace(/[^\w-]+/g, "_")}-${xqDateiTag()}.csv`, voll); } catch (e) { toast("<div>Export fehlgeschlagen.</div>"); } kn.disabled = false; };
        } catch (e) { inh.textContent = "Konnte nicht geladen werden (" + ((e && e.code) || "Fehler") + ")."; d.dataset.geladen = ""; }
      };
      zeigen(window.__xqEvModus === "woche" ? "woche" : "heute");
    }));
   };
   zeichnen();
   if ($("xqOhneAlt")) $("xqOhneAlt").onchange = e => { S.xqOhneAlt = e.target.checked; save(); zeichnen(); };
  }).catch(e => { $("xpListe").innerHTML = `<p class="muted">Konnte nicht geladen werden (${esc((e && e.code) || "Fehler")}). Sind die neuen Firebase-Regeln veröffentlicht?</p>`; });
};

/* ---------- Teilen ---------- */
VIEWS.share = () => {
  const basis = location.origin + location.pathname.replace(/index\.html$/, "");
  const url = basis + (S.lbName && S.pid ? "?von=" + encodeURIComponent(S.pid) : "");
  let qr = ""; try { const q = qrcode(0, "M"); q.addData(url); q.make(); qr = q.createSvgTag({ cellSize: 8, margin: 2, scalable: true }); } catch (e) { qr = '<p style="color:#000">QR-Code konnte nicht erzeugt werden.</p>'; }
  screen.innerHTML = `${backBtn("home", "Start")}<h1>Mit Freunden teilen</h1>
  <div class="stack">
    <div class="card stack" style="text-align:center">
      <div class="church" style="justify-content:center"><img src="logo.png" alt="" onerror="this.remove()"><span>Freie Baptisten Eichstätt</span></div>
      <p class="muted" style="margin:0">Lass deine Freunde diesen Code mit der Handykamera scannen.${S.lbName ? " Abzeichen in drei Stufen: Link teilen → jemand spielt über deinen Link mit → er ist an 3 Tagen einer Woche treu dabei („Menschenfischer“)." : ""}</p>
      <div class="qrbox">${qr}</div>
      <div class="url" id="url">${esc(url)}</div>
      <div class="modes" style="grid-template-columns:1fr 1fr">
        <button class="btn primary" id="shareBtn">Link senden</button><button class="btn" id="copyBtn">Link kopieren</button>
      </div>
      <div class="small muted" id="shareFb" aria-live="polite"></div>
    </div>
    <div class="card stack">
      <b>So kommt die App auf den Startbildschirm</b>
      <div><span class="tag at">iPhone</span><ol class="steps small"><li>Link in <b>Safari</b> öffnen</li><li>Unten auf das Teilen-Symbol tippen</li><li>„Zum Home-Bildschirm“ wählen</li></ol></div>
      <div><span class="tag nt">Android</span><ol class="steps small"><li>Link in <b>Chrome</b> öffnen</li><li>Menü ⋮ oben rechts</li><li>„App installieren“ oder „Zum Startbildschirm hinzufügen“</li></ol></div>
      <p class="small muted" style="margin:0">Tipp fürs iPhone: Erst zum Home-Bildschirm hinzufügen, dann dort der Rangliste beitreten – sonst gibt es zwei getrennte Spielstände. Schon passiert? In der App „Ich spiele schon mit“ wählen und den eigenen Namen antippen.</p>
    </div>
  </div>`; wireGo();
  const fb = $("shareFb");
  const geteilt = () => { if (S.lbName && S.pid && !S.eingeladen) { S.eingeladen = true; save(); checkBadges(); } };
  $("shareBtn").onclick = async () => { SFX.tap(); if (navigator.share) { try { await navigator.share({ title: "Bibelbuch-Quest", text: "Lerne mit uns von den Freien Baptisten Eichstätt alle 66 Bücher der Bibel – als Spiel:", url }); SFX.coin(); geteilt(); } catch (e) {} } else $("copyBtn").click(); };
  $("copyBtn").onclick = async () => { SFX.tap(); geteilt(); try { await navigator.clipboard.writeText(url); fb.textContent = "Link kopiert."; SFX.coin(); } catch (e) { const r = document.createRange(); r.selectNodeContents($("url")); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); fb.textContent = "Link markiert – jetzt kopieren."; } };
};

/* ---------- PWA ---------- */
let deferredInstall = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredInstall = e; if (current === "ich") go("ich"); });
addEventListener("appinstalled", () => { deferredInstall = null; appHinweisZeigen(); }); /* 6.66: Belohnung gibt es beim ersten Start als App (+100) */
if ("serviceWorker" in navigator && location.protocol === "https:") { addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {})); }

/* ---------- Start ---------- */
try { const von = new URLSearchParams(location.search).get("von"); if (von && /^[\w-]{4,64}$/.test(von)) { if (!S.lbName && !S.eingeladenVon) S.eingeladenVon = von; history.replaceState(null, "", location.pathname); } } catch (e) {}
$("hWer").onclick = () => { SFX.tap(); if (!S.lbName) { go("name"); return; } go("profil"); };
$("hTalBtn").onclick = () => { SFX.tap(); go("ich"); };
/* 9.0: Bestehende Spieler gehören zu den Freien Baptisten Eichstätt */
if (!S.gem) { if (S.lbName || S.xp > 0) { S.gem = GEM_STANDARD; S.gemGesendet = GEM_STANDARD; } else { S.gem = "gast"; S.gemNeu = false; S.nachAb = Date.now(); } } /* 9.7: neue Spieler sind Gast und treten mit dem Passwort bei */
neuerTag(); applyTheme(); renderMute(); renderHud(); checkBadges(); geraetSpeichern(); go("home");
if (window.SPL) SPL.done(); /* 9.25: Start-Bild beenden, sobald die Startseite steht */
/* Mehrere Spieler auf dem Gerät? Dann beim Start fragen, wer spielt */
/* 6.83 (E): Auf gemeinsamen Geräten beim Start und nach mehr als 10 Minuten Pause fragen, wer spielt – mit einem Knopf je Spieler,
   damit niemand unbemerkt im Profil des anderen weiterspielt. */
const WER_PAUSE = 10 * 60000;
function werSpieltFrage(nachPause) {
  if (gesperrt || !S.lbName || document.querySelector(".modal.wer-frage")) return;
  const andere = geraetLesen().liste.filter(p => p.name && p.key !== GERAET.aktiv);
  if (!andere.length) return;
  const m = modal(`${avatarHtml({ avatar: S.avatar, frame: S.frame, name: S.lbName }, 72)}<h2>${nachPause ? `Spielt noch ${esc(S.lbName)}?` : `Bist du ${esc(S.lbName)}?`}</h2><p class="muted small" style="margin:0">Auf diesem Gerät spielen mehrere Personen – so landen die Punkte beim Richtigen.</p>
    <button class="btn primary" data-close="ja">Ja, ${nachPause ? `${esc(S.lbName)} spielt weiter` : `ich bin ${esc(S.lbName)}`}</button>
    ${andere.slice(0, 4).map(p => `<button class="btn ghost wer-knopf" data-close="k:${esc(p.key)}">${avatarHtml(p, 28)}<span>Ich bin ${esc(p.name)}</span></button>`).join("")}
    ${andere.length > 4 ? `<button class="btn ghost" data-close="liste">Jemand anderes …</button>` : ""}`, a => {
      if (a && a.startsWith("k:")) spielerWechseln(a.slice(2)); else if (a === "liste") go("wer"); });
  m.classList.add("frage", "wer-frage");
}
(() => {
  let gewaehlt = false; try { gewaehlt = sessionStorage.getItem("bq-gewaehlt") === "1"; sessionStorage.removeItem("bq-gewaehlt"); } catch (e) {}
  if (!gewaehlt) werSpieltFrage(false);
})();
let verstecktSeit = 0;
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") { verstecktSeit = Date.now(); return; }
  if (verstecktSeit && Date.now() - verstecktSeit > WER_PAUSE) werSpieltFrage(true);
  verstecktSeit = 0;
});
document.addEventListener("pointerdown", () => { ac(); }, { once: true });

/* ---------- 6.66: Hinweis „App installieren“ (Variante 3 „Heimkehr-Karte“) ----------
   Nur im Browser sichtbar, über der Fußleiste auf den Hauptreitern. Beim ersten Start als App
   (Startbildschirm) gibt es einmalig 100 Talente und das Abzeichen „Heimkehr“; danach verschwindet der Hinweis. */
const APP_BONUS = 100;
const alsApp = () => { try { return matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches || navigator.standalone === true; } catch (e) { return false; } };
const istIos = () => { const u = navigator.userAgent || ""; return /iPhone|iPad|iPod/.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1); };
const AH_REITER = ["home", "lernen", "spielen", "zusammen", "bib", "duelle", "rank", "ich", "profil", "stat", "errung", "badges"];
const ahKey = "bq-app-hinweis-zu";
function ahZuHeute() { try { return localStorage.getItem(ahKey) === today(); } catch (e) { return false; } }
function appBonusPruefen() {
  if (!alsApp() || S.appBonus || !S.lbName) return;
  S.appBonus = true; S.tal += APP_BONUS;
  if (!S.badges.includes("heimkehr")) S.badges.push("heimkehr");
  save(); renderHud(); lbSync(); cloudSync();
  setTimeout(() => {
    SFX.level(); rain(80);
    modal(`<div class="label">Willkommen in der App</div><div class="ah-gross">${svg("down", accent())}</div><h2 style="margin:0">Heimkehr!</h2>
      <p class="muted" style="margin:0">Danke, dass du die Bibel-Quest auf deinen Startbildschirm geholt hast.</p>
      <div class="vle-werte"><div><b>+${APP_BONUS}${TAL_MUENZE}</b><span>Talente</span></div><div><b>${svg("medal", accent())}</b><span>Abzeichen „Heimkehr“</span></div></div>
      <button class="btn primary" data-close="ok">Weiter</button>`);
  }, 700);
}
function appHinweisZeigen() {
  let el = document.getElementById("appHinweis");
  const zeigen = !alsApp() && !S.appBonus && !!S.lbName && AH_REITER.includes(current) && !document.body.classList.contains("spiel-laeuft") && !ahZuHeute();
  document.body.classList.toggle("mit-app-hinweis", zeigen);
  if (!zeigen) { if (el) el.remove(); return; }
  const ios = istIos();
  const teilen = `<svg class="ah-teilen" viewBox="0 0 13 15" aria-hidden="true"><path d="M6.5 1 V9 M3.5 4 L6.5 1 L9.5 4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M2.5 6.5 H1.5 V14 H11.5 V6.5 H10.5" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>`;
  /* 9.37 (Design-Kritik): schmale Zeile statt großer Karte – verdeckt keine Kacheln mehr */
  const html = `<span class="ah-mini" aria-hidden="true"><i class="ah-app"><img src="icons/icon-192.png" alt=""></i></span>
      <span class="ah-tx"><b>Immer dabei</b><small>+${APP_BONUS} Talente geschenkt</small></span>
      <button class="ah-knopf" id="ahInst" aria-label="${ios ? "Anleitung: App aufs iPhone holen" : "App installieren"}">${ios ? teilen + " So geht’s" : svg("down") + " Installieren"}</button><button class="ah-x" id="ahZu" aria-label="Für heute ausblenden">${svg("nein")}</button>`;
  if (!el) { el = document.createElement("div"); el.id = "appHinweis"; el.className = "ah"; el.setAttribute("role", "region"); el.setAttribute("aria-label", "App installieren"); document.body.appendChild(el); }
  el.innerHTML = html;
  $("ahZu").onclick = () => { SFX.tap(); try { localStorage.setItem(ahKey, today()); } catch (e) {} appHinweisZeigen(); };
  $("ahInst").onclick = () => { SFX.tap();
    if (deferredInstall) { deferredInstall.prompt(); deferredInstall.userChoice.catch(() => {}).then(c => { deferredInstall = null; if (c && c.outcome === "accepted") appAnleitung(true); }); return; }
    appAnleitung(false); };
  const img = el.querySelector(".ah-app img"); if (img) img.onerror = () => { img.replaceWith(Object.assign(document.createElement("span"), { innerHTML: svg("book", accent()) })); };
}
function appAnleitung(installiert) {
  const ios = istIos();
  const teilen = `<svg class="ah-teilen" viewBox="0 0 13 15" aria-hidden="true"><path d="M6.5 1 V9 M3.5 4 L6.5 1 L9.5 4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M2.5 6.5 H1.5 V14 H11.5 V6.5 H10.5" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>`;
  const schritte = installiert ? [`Die App ist installiert. Öffne <b>Bibel-Quest</b> jetzt vom Startbildschirm.`]
    : ios ? [`Unten in Safari auf ${teilen} <b>Teilen</b> tippen`, `<b>Zum Home-Bildschirm</b> wählen und <b>Hinzufügen</b> tippen`]
    : [`Oben rechts im Browser auf <b>⋮</b> tippen`, `<b>App installieren</b> bzw. <b>Zum Startbildschirm hinzufügen</b> wählen`];
  if (!installiert) schritte.push(`Bibel-Quest vom Startbildschirm öffnen`);
  schritte.push(`Dort einmal <b>„Ich spiele schon mit“</b> und deinen Namen antippen – dein Fortschritt kommt mit.`);
  modal(`<div class="label">So kommt die App aufs ${ios ? "iPhone" : "Handy"}</div><h2 style="margin:0">${installiert ? "Fast geschafft!" : "In wenigen Sekunden"}</h2>
    <ol class="ah-ol">${schritte.map(x => `<li>${x}</li>`).join("")}</ol>
    <p class="small muted" style="margin:0">Beim ersten Start als App bekommst du <b>${APP_BONUS} Talente</b> und das Abzeichen „Heimkehr“.</p>
    <button class="btn primary" data-close="ok">Verstanden</button>`);
}
if (window.matchMedia) try { matchMedia("(display-mode: standalone)").addEventListener("change", () => { appBonusPruefen(); appHinweisZeigen(); }); } catch (e) {}
setTimeout(() => { appBonusPruefen(); appHinweisZeigen(); }, 1200);

/* ---------- 6.68: neue Symbole (vorerst hier; beim nächsten Generator-Lauf in werkzeuge/symbole-erzeugen.js übernehmen) ---------- */
(function () {
  const W = (bereich, inner, halo = true) => `<svg x="0" y="0" width="24" height="24" viewBox="0 0 64 64" overflow="visible" class="wr wr-${bereich}">${halo ? `<circle class="wr-halo" cx="32" cy="32" r="31" fill="url(#wrH_${bereich === "avatar" ? "lohn" : bereich})"/>` : ""}<ellipse cx="32" cy="61" rx="17" ry="2.2" fill="#000" opacity=".3"/>${inner}</svg>`;
  /* Avatar „Brennender Dornbusch“ (Level 35) */
  ICONS["av-dornbusch"] = W("avatar", `<path d="M32 6c5 7 13 11 12 21c4-3 5-8 4-12c6 7 8 15 4 23c-3 7-11 11-20 11s-17-4-20-11c-4-8-2-16 4-23c-1 4 0 9 4 12c-1-10 7-14 12-21z" fill="url(#wrF)" stroke="#1b2a55" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M32 18c3 5 8 8 7 15c-1 5-4 8-7 8s-6-3-7-8c-1-7 4-10 7-15z" fill="#fff6c8" opacity=".9"/>
    <path d="M14 56c4-6 10-9 18-9s14 3 18 9" fill="none" stroke="#1b2a55" stroke-width="5" stroke-linecap="round"/><path d="M14 56c4-6 10-9 18-9s14 3 18 9" fill="none" stroke="#5fae5a" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M20 52l-4-5M27 49l-2-6M37 49l2-6M44 52l4-5" stroke="#3f7a3a" stroke-width="2" stroke-linecap="round"/>`, false);
  /* Posaune / Schofar (Halljahr) */
  ICONS.posaune = W("lohn", `<path d="M6 48C10 54 24 56 36 48C46 41 52 30 51 16L60 12C64 30 56 46 44 54C30 63 12 60 4 52Z" fill="url(#wrG)" stroke="#1b2a55" stroke-width="1.6" stroke-linejoin="round"/>
    <ellipse cx="55.5" cy="13.5" rx="5.6" ry="2.8" transform="rotate(-25 55.5 13.5)" fill="#fff6c8" stroke="#1b2a55" stroke-width="1.3"/>
    <path d="M14 53q4-2 6-6M24 55q4-3 5-8M34 52q4-4 4-9M43 45q3-5 3-10" stroke="#a07c22" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M9 50C16 54 28 53 37 46" stroke="#fff" stroke-width="1.6" fill="none" opacity=".8" stroke-linecap="round"/>
    <path d="M58 22q4 3 4 8M62 16q2 2 1 6" stroke="#ffe39a" stroke-width="2" fill="none" stroke-linecap="round"/>`);
  /* Zelt der Stiftshütte (Gemeinde) */
  ICONS.zelt = W("gemeinde", `<path d="M6 50L22 26H48L58 50Z" fill="#7a2a2a" stroke="#1b2a55" stroke-width="1.5" stroke-linejoin="round"/><path d="M22 26L12 50H34L30 26Z" fill="#9a3a3a" stroke="#1b2a55" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M17 40h10v10H17z" fill="#5c8fd6" stroke="#1b2a55" stroke-width="1"/><path d="M22 26H48" stroke="#ffe39a" stroke-width="2"/><path d="M34 6c2 6 6 7 5 12c-1 3-3 5-5 5s-4-2-5-5c-1-5 3-6 5-12z" fill="url(#wrF)" stroke="#1b2a55" stroke-width="1"/>`);
  /* Rahmen (Overlay um den Avatar) */
  const R = window.RAHMEN_SVG = window.RAHMEN_SVG || {};
  const ring = (stroke, w = 6) => `<circle cx="50" cy="50" r="38.8" fill="none" stroke="#141a3a" stroke-width="1.4"/><circle cx="50" cy="50" r="35" fill="none" stroke="${stroke}" stroke-width="${w}"/><circle cx="50" cy="50" r="32" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="1"/>`;
  const glanz = `<path d="M22 38a30 30 0 0 1 18-18" stroke="#fff" stroke-opacity=".75" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  const um = (n, f) => Array.from({ length: n }, (_, i) => f(i, (i / n) * Math.PI * 2 - Math.PI / 2)).join("");
  R.saeule = `<svg class="av-fr" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="frSaeuleL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#c9d6f2"/><stop offset=".5" stop-color="#ffb54a"/><stop offset="1" stop-color="#ff6b3a"/></linearGradient></defs>${ring("url(#frSaeuleL)")}
    <g fill="#fff" stroke="#c9d6f2" stroke-width=".6"><circle cx="13" cy="44" r="6"/><circle cx="10" cy="54" r="5"/><circle cx="16" cy="63" r="5"/><circle cx="14" cy="34" r="4"/></g>
    <g fill="url(#wrF)" stroke="#7a2a08" stroke-width=".6"><path d="M87 66c-4-4-5-9-2-14c1 4 3 5 4 5c0-5 2-9 5-12c-1 5 2 8 2 12c0 6-4 9-9 9z"/><path d="M85 40c-3-3-3-7-1-10c1 3 2 4 3 4c0-3 1-6 4-8c-1 4 1 6 1 9c0 4-3 6-7 5z"/></g>${glanz}</svg>`;
  R.feuergold = `<svg class="av-fr" viewBox="0 0 100 100" aria-hidden="true"><circle class="fr-schein" cx="50" cy="50" r="47" fill="url(#wrRschein)"/>${ring("url(#wrR_gold)", 7)}${um(16, (i, a) => `<path d="M${(50 + 40 * Math.cos(a)).toFixed(2)} ${(50 + 40 * Math.sin(a)).toFixed(2)}L${(50 + (i % 2 ? 45 : 48) * Math.cos(a)).toFixed(2)} ${(50 + (i % 2 ? 45 : 48) * Math.sin(a)).toFixed(2)}" stroke="#ffb54a" stroke-width="${i % 2 ? 1.6 : 2.6}" stroke-linecap="round"/>`)}${um(6, (i, a) => `<circle cx="${(50 + 35 * Math.cos(a)).toFixed(2)}" cy="${(50 + 35 * Math.sin(a)).toFixed(2)}" r="2.8" fill="#fff6c8" stroke="#a0520a" stroke-width=".8"/>`)}${glanz}</svg>`;
  R.wolke = `<svg class="av-fr" viewBox="0 0 100 100" aria-hidden="true"><circle class="fr-schein" cx="50" cy="50" r="47" fill="url(#wrRschein)"/>${ring("url(#wrR_licht)")}
    <g fill="#fff" stroke="#c9d6f2" stroke-width=".7"><ellipse cx="50" cy="13" rx="20" ry="7"/><circle cx="38" cy="11" r="7"/><circle cx="50" cy="7" r="8"/><circle cx="62" cy="11" r="7"/></g>
    <path d="M50 20V30" stroke="#ffe39a" stroke-width="2" stroke-linecap="round"/>${glanz}</svg>`;
})();

/* ---------- 6.68: Gemeinsamer Bau der Stiftshütte ----------
   Spenden je Spieler in der Sammlung „stiftshuette“ ({pid, name, s: {"1": Talente, …, "8": …}}). Summe = alle Spieler.
   Ein Abschnitt k ist offen, wenn alle vorigen fertig sind und seine Woche begonnen hat. Ist das Ziel erreicht: „mehr als genug“. */
let stiftDaten = null, stiftZeit = 0, stiftLaedt = null;
const stiftWoche = () => Math.floor((dayNum(today()) - dayNum(STIFT_START)) / 7);
const stiftMontag = k => { const d = datumVon(dayNum(STIFT_START) + 7 * k); return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" }); };
function stiftLaden(neu) {
  const L = window.LB; if (!L || !L.ok || !L.stiftListe) return Promise.resolve(stiftDaten);
  if (!neu && stiftDaten && Date.now() - stiftZeit < 60e3) return Promise.resolve(stiftDaten);
  if (stiftLaedt) return stiftLaedt;
  stiftLaedt = L.stiftListe().then(rows => { stiftDaten = rows; stiftZeit = Date.now(); return rows; }).catch(() => stiftDaten).finally(() => { stiftLaedt = null; });
  return stiftLaedt;
}
function stiftStand() {
  const sum = STIFT.map(() => 0), spender = STIFT.map(() => []);
  const zeilen = (stiftDaten || []).filter(r => r.pid !== S.pid);
  if (S.pid || Object.keys(S.stift || {}).length) { const eig = (stiftDaten || []).find(r => r.pid === S.pid) || { s: {} }; const s = {}; for (let k = 1; k <= 8; k++) s[k] = Math.max((eig.s || {})[k] | 0, (S.stift || {})[k] | 0); zeilen.push({ pid: S.pid, name: S.lbName, s, ich: true }); }
  zeilen.forEach(r => { for (let k = 1; k <= 8; k++) { const v = (r.s || {})[k] | 0; if (v > 0) { sum[k - 1] += v; spender[k - 1].push(r.ich ? "Du" : r.name); } } });
  let k = 0; while (k < 8 && sum[k] >= STIFT[k].ziel) k++;
  const woche = stiftWoche();
  return { sum, spender, k, fertig: k, eingeweiht: k >= 8, woche, offen: k < 8 && woche >= k, vorStart: woche < 0 };
}
/* Schrägansicht von oben: x = Länge 0–100 Ellen, y = Tiefe 0–50, z = Höhe. Die Wohnung ist (künstlerisch) etwas größer
   gezeichnet als im Maßstab, die vordere Wand und das Dach fehlen – so schaut man hinein. */
function stiftBild(st) {
  const P = (x, y, z = 0) => `${(10 + x * 2.6 + y * 0.8).toFixed(1)},${(204 - y * 1.8 - z * 3.6).toFixed(1)}`;
  const X = (...a) => P(...a).split(",")[0], Y = (...a) => P(...a).split(",")[1];
  const poly = (pts, attr) => `<polygon points="${pts.map(q => P(...q)).join(" ")}" ${attr}/>`;
  const linie = (a, b, attr) => `<line x1="${X(...a)}" y1="${Y(...a)}" x2="${X(...b)}" y2="${Y(...b)}" ${attr}/>`;
  const teil = (k, inner) => `<g class="sh-teil ${st.fertig >= k ? "an" : st.k + 1 === k && st.offen ? "bau" : "aus"}">${inner}</g>`;
  const pfosten = (x1, y1, x2, y2, n) => Array.from({ length: n + 1 }, (_, i) => { const x = x1 + (x2 - x1) * i / n, y = y1 + (y2 - y1) * i / n; return linie([x, y, 0], [x, y, 5.6], `stroke="#d9b24a" stroke-width="1.5"`) + `<circle cx="${X(x, y, 5.6)}" cy="${Y(x, y, 5.6)}" r="1" fill="#e3e9f6"/>`; }).join("");
  const zaun = (a, b, extra = "") => poly([[...a, 0.6], [...b, 0.6], [...b, 5], [...a, 5]], `fill="#f1ead6" stroke="#cfc6aa" stroke-width=".5" ${extra}`);
  const box = (x1, y1, x2, y2, h, oben, vorne, rechts, rand) => poly([[x1, y1, h], [x2, y1, h], [x2, y2, h], [x1, y2, h]], `fill="${oben}" stroke="${rand}" stroke-width=".6"`)
    + poly([[x1, y1, 0], [x2, y1, 0], [x2, y1, h], [x1, y1, h]], `fill="${vorne}" stroke="${rand}" stroke-width=".6"`) + poly([[x2, y1, 0], [x2, y2, 0], [x2, y2, h], [x2, y1, h]], `fill="${rechts}" stroke="${rand}" stroke-width=".6"`);
  const glut = (x, y, z, r, id = "shGlut") => `<circle cx="${X(x, y, z)}" cy="${Y(x, y, z)}" r="${r}" fill="url(#${id})"/>`;
  const sterne = Array.from({ length: 24 }, (_, i) => `<circle cx="${(i * 47) % 320}" cy="${(i * 29) % 64 + 5}" r="${i % 4 ? .8 : 1.4}" fill="#fff" opacity="${i % 3 ? .55 : .9}"/>`).join("");
  const T = { x1: 52, x2: 92, y1: 15, y2: 35, h: 13, vh: 82 };   /* Wohnung; Vorhang bei x = vh */
  return `<svg class="sh-bild" viewBox="0 0 320 215" role="img" aria-label="Die Stiftshütte: ${st.fertig} von 8 Bauabschnitten fertig">
  <defs><linearGradient id="shNacht" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1636"/><stop offset="1" stop-color="#2a2552"/></linearGradient>
    <linearGradient id="shSand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a07a46"/><stop offset="1" stop-color="#6b4f2a"/></linearGradient>
    <linearGradient id="shHolz" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c18c45"/><stop offset="1" stop-color="#8a5a24"/></linearGradient>
    <linearGradient id="shGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".6" stop-color="#f2c14e"/><stop offset="1" stop-color="#a07c22"/></linearGradient>
    <linearGradient id="shVorhang" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a4fc0"/><stop offset=".5" stop-color="#7a3aa8"/><stop offset="1" stop-color="#c0263a"/></linearGradient>
    <radialGradient id="shGlut"><stop offset="0" stop-color="#fff6c8"/><stop offset=".45" stop-color="#ffb54a" stop-opacity=".75"/><stop offset="1" stop-color="#ff6b3a" stop-opacity="0"/></radialGradient>
    <radialGradient id="shHerrl"><stop offset="0" stop-color="#fffbe8"/><stop offset=".5" stop-color="#ffe39a" stop-opacity=".6"/><stop offset="1" stop-color="#ffe39a" stop-opacity="0"/></radialGradient></defs>
  <rect width="320" height="215" fill="url(#shNacht)"/>${sterne}
  <path d="M0 120Q70 100 150 110T320 96V215H0Z" fill="#4a3820"/><path d="M0 200Q90 180 190 192T320 182V215H0Z" fill="url(#shSand)" opacity=".7"/>
  ${poly([[0, 0], [100, 0], [100, 50], [0, 50]], `fill="#c49a5c" opacity=".6"`)}
  ${teil(1, `${zaun([0, 50], [100, 50])}${zaun([100, 0], [100, 50])}${pfosten(0, 50, 100, 50, 20)}${pfosten(100, 0, 100, 50, 10)}`)}
  ${poly([[T.x1, T.y1], [T.x2, T.y1], [T.x2, T.y2], [T.x1, T.y2]], `fill="#6b4c2c" opacity=".75"`)}
  ${teil(4, `${poly([[T.x1, T.y2, 0], [T.x2, T.y2, 0], [T.x2, T.y2, T.h], [T.x1, T.y2, T.h]], `fill="url(#shHolz)" stroke="#4a2c10" stroke-width=".8"`)}
    ${Array.from({ length: 26 }, (_, i) => linie([T.x1 + 1.5 + i * 1.5, T.y2, 0], [T.x1 + 1.5 + i * 1.5, T.y2, T.h], `stroke="#6b4318" stroke-width=".55"`)).join("")}
    ${poly([[T.x2, T.y1, 0], [T.x2, T.y2, 0], [T.x2, T.y2, T.h], [T.x2, T.y1, T.h]], `fill="#9a6a30" stroke="#4a2c10" stroke-width=".8"`)}
    ${Array.from({ length: 27 }, (_, i) => poly([[T.x1 + .2 + i * 1.5, T.y2 - .4, 0], [T.x1 + 1.2 + i * 1.5, T.y2 - .4, 0], [T.x1 + 1.2 + i * 1.5, T.y2 - .4, .6], [T.x1 + .2 + i * 1.5, T.y2 - .4, .6]], `fill="#e3e9f6"`)).join("")}
    ${Array.from({ length: 27 }, (_, i) => poly([[T.x1 + .2 + i * 1.5, T.y1, 0], [T.x1 + 1.2 + i * 1.5, T.y1, 0], [T.x1 + 1.2 + i * 1.5, T.y1, 1.4], [T.x1 + .2 + i * 1.5, T.y1, 1.4]], `fill="#a8743c" stroke="#e3e9f6" stroke-width=".3"`)).join("")}
    ${[0, 1, 2, 3, 4].map(i => linie([T.x1, T.y1 + i * 5, 0], [T.x1, T.y1 + i * 5, T.h], `stroke="url(#shGold)" stroke-width="1.8"`)).join("")}`)}
  ${teil(5, `${poly([[T.x1 - 1, T.y2 + .6, T.h], [T.x2 + 1, T.y2 + .6, T.h], [T.x2 + 1, T.y2 - 5, T.h + 1.6], [T.x1 - 1, T.y2 - 5, T.h + 1.6]], `fill="#3a2a2a" stroke="#1a1010" stroke-width=".6"`)}
    ${poly([[T.x1 - 1, T.y2 - 5, T.h + 1.6], [T.x2 + 1, T.y2 - 5, T.h + 1.6], [T.x2 + 1, T.y2 - 8, T.h + 1.2], [T.x1 - 1, T.y2 - 8, T.h + 1.2]], `fill="#b03a3a" stroke="#5a1414" stroke-width=".6"`)}
    ${poly([[T.x2 + .4, T.y1 - .5, 0], [T.x2 + .4, T.y2 + .6, 0], [T.x2 + .4, T.y2 + .6, T.h + .4], [T.x2 + .4, T.y1 - .5, T.h + .4]], `fill="#8a2a2a" opacity=".55"`)}`)}
  ${teil(6, `${glut(57, 18.5, 5, 16)}${linie([57, 18.5, 0], [57, 18.5, 7], `stroke="url(#shGold)" stroke-width="2"`)}
    ${[[-3, 4.5], [-2, 5.5], [-1, 6.4], [1, 6.4], [2, 5.5], [3, 4.5]].map(([d, z]) => `<path d="M${P(57, 18.5, 2.5)} Q${P(57 + d, 18.5, 2.5)} ${P(57 + d, 18.5, z)}" stroke="url(#shGold)" stroke-width="1.4" fill="none"/><circle cx="${X(57 + d, 18.5, z + .4)}" cy="${Y(57 + d, 18.5, z + .4)}" r="1.4" fill="#fff6c8"/>`).join("")}<circle cx="${X(57, 18.5, 7.4)}" cy="${Y(57, 18.5, 7.4)}" r="1.5" fill="#fff6c8"/>
    ${box(60, 29, 68, 32.5, 3, "url(#shGold)", "#d9a640", "#a07c22", "#7a5208")}
    ${[61.5, 64, 66.5].map(x => `<ellipse cx="${X(x, 30.8, 3.3)}" cy="${Y(x, 30.8, 3.3)}" rx="3" ry="1.3" fill="#f6e2b0" stroke="#a07c22" stroke-width=".4"/>`).join("")}
    ${box(77, 23.5, 79, 26.5, 3.2, "url(#shGold)", "#d9a640", "#a07c22", "#7a5208")}<path d="M${P(78, 25, 3.4)} q3 -5 0 -9 q-3 -4 1 -8" stroke="#e3e9f6" stroke-width="1.1" fill="none" opacity=".75"/>`)}
  ${teil(7, `${poly([[T.vh, T.y1, 0], [T.vh, T.y2, 0], [T.vh, T.y2, T.h], [T.vh, T.y1, T.h]], `fill="url(#shVorhang)" opacity=".86" stroke="#2a1a4a" stroke-width=".7"`)}
    <path d="M${P(T.vh, 20, 7)} q5 -9 11 -4 M${P(T.vh, 30, 7)} q5 -9 11 -4" stroke="#ffe39a" stroke-width="1.3" fill="none"/>`)}
  ${teil(8, `${glut(87, 25, 3, 26, "shHerrl")}${box(84.5, 23.5, 89.5, 26.5, 2.4, "url(#shGold)", "#e0b04a", "#a07c22", "#7a5208")}
    <path d="M${P(85.2, 25, 2.6)} q-2 -6 3.4 -5 M${P(88.8, 25, 2.6)} q2 -6 -3.4 -5" stroke="url(#shGold)" stroke-width="1.6" fill="none"/>`)}
  ${teil(2, `${glut(21.5, 24.5, 4.5, 15)}${box(18, 21, 25, 28, 3.2, "#7a4a24", "#c98a4b", "#a56a32", "#5a3410")}${[[18, 21], [25, 21], [25, 28], [18, 28]].map(([x, y]) => `<circle cx="${X(x, y, 3.4)}" cy="${Y(x, y, 3.4)}" r="1.2" fill="#e8b27a"/>`).join("")}`)}
  ${teil(3, `<ellipse cx="${X(37, 24.5, 2.2)}" cy="${Y(37, 24.5, 2.2)}" rx="10" ry="4.2" fill="#b8c8e0" stroke="#e3e9f6" stroke-width="1.1"/><ellipse cx="${X(37, 24.5, 2.2)}" cy="${Y(37, 24.5, 2.2)}" rx="6.5" ry="2.4" fill="#7fc8ff" opacity=".75"/>${linie([37, 24.5, 0], [37, 24.5, 1.9], `stroke="#9fb6d8" stroke-width="3.4"`)}`)}
  ${teil(1, `${zaun([0, 0], [100, 0], `opacity=".5"`)}${zaun([0, 0], [0, 50], `opacity=".45"`)}${poly([[0, 20, 0.6], [0, 30, 0.6], [0, 30, 5], [0, 20, 5]], `fill="url(#shVorhang)" opacity=".9"`)}${pfosten(0, 0, 100, 0, 20)}${pfosten(0, 0, 0, 50, 10)}`)}
  ${st.eingeweiht ? `<g class="sh-wolke">${glut(72, 25, 22, 70, "shHerrl")}<g fill="#fff" stroke="#dfe6f6" stroke-width=".8"><ellipse cx="${X(72, 25, 23)}" cy="${Y(72, 25, 23)}" rx="62" ry="14"/><circle cx="${X(56, 25, 25)}" cy="${Y(56, 25, 25)}" r="15"/><circle cx="${X(72, 25, 28)}" cy="${Y(72, 25, 28)}" r="18"/><circle cx="${X(88, 25, 25)}" cy="${Y(88, 25, 25)}" r="14"/></g></g>`
    : `<g class="sh-feuer"><path d="M${P(72, 25, 20)} c-6 -10 4 -14 0 -26 c8 8 10 18 4 26 z" fill="url(#shGlut)"/><ellipse cx="${X(72, 25, 19)}" cy="${Y(72, 25, 19)}" rx="9" ry="20" fill="url(#shGlut)" opacity=".55"/></g>`}
  </svg>`;
}
/* Kompakter Bauweg: 8 Medaillons in einer Reihe */
function stiftWeg(st) {
  return `<ol class="sh-weg" aria-label="Bauabschnitte">${STIFT.map((a, i) => { const z = i < st.fertig ? "fertig" : i === st.k && st.offen ? "jetzt" : i === st.k ? "naechst" : "spaeter";
    return `<li class="${z}" title="${i + 1}. ${esc(a.n)}"><span>${z === "fertig" ? svg("check") : i + 1}</span><small>${esc(a.kurz)}</small></li>`; }).join("")}</ol>`;
}
function stiftNamen(liste) {
  const n = [...new Set(liste)]; if (!n.length) return "";
  const du = n.includes("Du"), rest = n.filter(x => x !== "Du");
  const zeig = (du ? ["Du"] : []).concat(rest.slice(0, du ? 3 : 4)), mehr = n.length - zeig.length;
  return zeig.map(x => `<b>${esc(x)}</b>`).join(", ") + (mehr > 0 ? ` und ${mehr} weitere` : "");
}
/* Kleine Karte auf dem Gemeinde-Reiter */
function stiftMiniHtml() {
  if (!STIFT_AKTIV) return "";
  const st = stiftStand(), a = STIFT[Math.min(st.k, 7)], pz = st.eingeweiht ? 100 : Math.min(100, Math.round(st.sum[st.k] / a.ziel * 100));
  const zeile = st.eingeweiht ? "Eingeweiht – die Wolke erfüllt die Hütte" : st.vorStart ? `Baustart ${stiftMontag(0)}` : st.offen ? `${st.k + 1}/8 · ${a.n}` : `${st.k}/8 fertig · weiter ${stiftMontag(st.k)}`;
  return `<button class="sh-mini" data-go="stift" aria-label="Stiftshütte: ${esc(zeile)}">${svg("zelt")}<span class="sh-mini-tx"><b>Stiftshütte</b><small>${esc(zeile)}</small><i class="sh-balken klein"><i style="width:${st.vorStart ? 0 : pz}%"></i></i></span><span class="sh-pfeil">›</span></button>`;
}
VIEWS.stift = () => {
  if (!STIFT_AKTIV) { go("home"); return; }
  const st = stiftStand(), a = STIFT[Math.min(st.k, 7)], ist = st.eingeweiht ? 0 : st.sum[st.k], rest = st.eingeweiht ? 0 : Math.max(0, a.ziel - ist);
  const pz = st.eingeweiht ? 100 : Math.min(100, Math.round(ist / a.ziel * 100)), online = window.LB && LB.ok && LB.stiftSetzen && S.pid && !S.offlineOnly;
  const tageNoch = 7 - ((dayNum(today()) - dayNum(STIFT_START)) % 7 + 7) % 7;
  let karte;
  if (st.eingeweiht) karte = `<div class="sh-karte fertig"><div class="sh-z1"><b>Eingeweiht!</b><small>alle 8 Abschnitte</small></div><p class="sh-vers">„Da bedeckte die Wolke die Stiftshütte, und die Herrlichkeit des HERRN erfüllte die Wohnung.“ (2. Mose 40,34)</p>
      <p class="sh-geber">Gebaut von ${stiftNamen(st.spender.flat())}</p></div>`;
  else if (st.vorStart) karte = `<div class="sh-karte"><div class="sh-z1"><b>1 · ${esc(a.n)}</b><small>ab ${esc(stiftMontag(0))}</small></div><p class="sh-vers">${esc(a.k)} (${esc(a.v)})</p>
      <p class="sh-geber">Am Montag beginnt der Bau. Jede Woche öffnet ein neuer Abschnitt – sammle schon Talente! „Jeder, den sein Herz willig machte, brachte dem HERRN eine Gabe“ (2. Mose 35,21).</p></div>`;
  else if (!st.offen) karte = `<div class="sh-karte genug"><div class="sh-z1"><b>Es ist mehr als genug!</b><small>${st.k}/8 fertig</small></div><p class="sh-vers">„Das Volk bringt viel mehr, als für den Dienst an dem Werk nötig ist“ (2. Mose 36,5). Der nächste Abschnitt „${esc(a.n)}“ beginnt ${esc(stiftMontag(st.k))}.</p>
      <p class="sh-geber">Zuletzt gaben ${stiftNamen(st.spender[st.k - 1])}</p></div>`;
  else karte = `<div class="sh-karte"><div class="sh-z1"><b>${st.k + 1} · ${esc(a.n)}</b><small>${st.woche > st.k ? "läuft weiter" : `noch ${tageNoch} ${tageNoch === 1 ? "Tag" : "Tage"}`}</small></div><p class="sh-vers">${esc(a.k)} (${esc(a.v)})</p>
      <div class="sh-balken"><i style="width:${pz}%"></i></div><div class="sh-zahlen"><span>${pkt(ist)} von ${pkt(a.ziel)} Talenten</span><span>${pz} %</span></div>
      ${online ? `<div class="sh-spenden">${[10, 50, 100].map(v => `<button data-sp="${v}" ${S.tal < 1 ? "disabled" : ""}>+${v}</button>`).join("")}<button class="haupt" data-sp="frei">Spenden</button></div>` : `<p class="small muted" style="margin:0">Spenden geht nur mit Internet und Eintrag in der Rangliste.</p>`}
      <p class="sh-geber">${st.spender[st.k].length ? `Diese Woche gaben ${stiftNamen(st.spender[st.k])}` : "Sei der Erste, der für diesen Abschnitt gibt!"}</p></div>`;
  screen.innerHTML = `${backBtn("rank", "Gemeinde")}${bereichKopf("gemeinde", { ic: "zelt", t: "Stiftshütte", sub: "Die Gemeinde baut gemeinsam", ring: [st.fertig, "von 8"] })}
    <div class="sh-buehne">${stiftBild(st)}</div>${stiftWeg(st)}${karte}
    <p class="small muted sh-fuss">Spender werden mit Namen genannt, Beträge bleiben verborgen (Matthäus 6,3). Du hast ${pkt(S.tal)} Talente.</p>`;
  wireGo();
  screen.querySelectorAll("[data-sp]").forEach(b => b.onclick = () => { const v = b.dataset.sp;
    if (v === "frei") { stiftSpendeWahl(); return; } stiftSpenden(+v, b); });
  if (!stiftDaten || Date.now() - stiftZeit > 60e3) stiftLaden(true).then(() => { if (current === "stift" && !document.querySelector(".modal")) VIEWS.stift(); stiftFeiern(); });
  else stiftFeiern();
};
function stiftSpendeWahl() {
  const st = stiftStand(), rest = Math.max(0, STIFT[st.k].ziel - st.sum[st.k]), max = Math.min(S.tal, rest);
  const m = modal(`<div class="label">Gabe für die Stiftshütte</div><h2 style="margin:0">${esc(STIFT[st.k].n)}</h2><p class="muted small" style="margin:0">Noch ${pkt(rest)} Talente bis zum Ziel · du hast ${pkt(S.tal)}.<br>Für jedes gespendete Talent bekommst du ${STIFT_XP_PRO_TAL} XP.</p>
    <input class="field" id="spBetrag" type="number" inputmode="numeric" min="1" max="${max}" value="${Math.min(max, 25)}" aria-label="Talente spenden">
    <button class="btn primary" id="spOk" ${max < 1 ? "disabled" : ""}>Spenden</button><button class="btn ghost" data-close>Abbrechen</button>`);
  m.querySelector("#spOk").onclick = () => { const v = Math.floor(+m.querySelector("#spBetrag").value || 0); m.remove(); stiftSpenden(v); };
}
/* 6.79: Wer für die Stiftshütte gibt, bekommt XP – 12 XP je gespendetem Talent (ein Talent kostet beim Spielen etwa 30 XP Aufwand, die Gabe ist ein Opfer für alle) */
const STIFT_XP_PRO_TAL = 12;
function stiftSpenden(v, el) {
  const st = stiftStand(); if (!st.offen) return;
  const rest = Math.max(0, STIFT[st.k].ziel - st.sum[st.k]); v = Math.min(v | 0, rest, S.tal);
  if (v < 1) { SFX.wrong(); toast(`${TAL_MUENZE}<div>${S.tal < 1 ? "Du hast gerade keine Talente." : "Dieser Abschnitt ist schon voll."}</div>`); return; }
  const k = String(st.k + 1), xpLohn = v * STIFT_XP_PRO_TAL;
  try { talBuchen(); } catch (e) {} S.tal -= v; if (S.tl) { S.tl.p = (S.tl.p | 0) + v; S.tl.l = S.tal | 0; }
  S.stift = Object.assign({}, S.stift, { [k]: ((S.stift || {})[k] | 0) + v }); save(); renderHud();
  SFX.coin(); if (el) { const [x, y] = centerOf(el); burst(x, y, 40, { up: 5 }); }
  stiftSenden();
  const voll = st.sum[st.k] + v >= STIFT[st.k].ziel;
  VIEWS.stift();
  if (voll) setTimeout(stiftFeiern, 500);
  else toast(`${svg("zelt")}<div><b>Danke für deine Gabe!</b><div class="small muted">+${v} für „${esc(STIFT[st.k].n)}“ · +${xpLohn} XP</div></div>`);
}
/* 6.80: XP für Spenden werden auf dem Server gegengebucht: Dokument „spendenxp/<pid>_stift<Abschnitt>“ merkt, für wie viele Talente
   schon XP gezahlt wurden (nur steigend, höchstens so viel wie in der Stiftshütte wirklich gespendet ist). So zählt jedes gespendete
   Talent nur einmal – auch bei zurückgesetzten App-Daten oder mehreren Geräten. Ohne Server-Regeln wird wie bisher direkt gutgeschrieben. */
let spendeXpLaeuft = false;
async function spendeXpAbgleichen() {
  if (spendeXpLaeuft) return; spendeXpLaeuft = true;
  try {
    const L = window.LB; S.spendeXp = S.spendeXp || {};
    for (const k of Object.keys(S.stift || {})) {
      const total = S.stift[k] | 0, schuld = total - (S.spendeXp[k] | 0); if (schuld < 1) continue;
      let tal = 0;
      if (!L || !L.ok || !L.spendeXpBuchen || !S.pid || !S.lbName || S.offlineOnly) tal = schuld;
      else { let r; try { r = await L.spendeXpBuchen(S.pid, S.lbName, k, total, APP_VERSION); } catch (e) { r = "netz"; }
        if (r === "netz") break; tal = r === "regeln" ? schuld : Math.max(0, r.neu - r.vorher); }
      S.spendeXp[k] = total; save();
      if (tal > 0) { const a = STIFT[+k - 1]; addXp(tal * STIFT_XP_PRO_TAL, null, "spende", { d: `Stiftshütte · ${a ? a.kurz : k} · ${tal} Talente` }); }
    }
  } finally { spendeXpLaeuft = false; }
}
function stiftSenden() {
  const L = window.LB; if (!L || !L.ok || !L.stiftSetzen || !S.pid || S.offlineOnly) return;
  const sig = JSON.stringify(S.stift || {}); if (sig === "{}") return; if (S.stiftSync === sig) { spendeXpAbgleichen(); return; }
  const s = {}; Object.entries(S.stift || {}).forEach(([k, v]) => { if (+k >= 1 && +k <= 8 && v > 0) s[k] = Math.min(v | 0, 20000); });
  L.stiftSetzen(S.pid, S.lbName, s).then(() => { S.stiftSync = sig; save(); stiftDaten = (stiftDaten || []).filter(r => r.pid !== S.pid).concat([{ pid: S.pid, name: S.lbName, s }]); spendeXpAbgleichen(); })
    .catch(e => dbFehler("Stiftshütte speichern", e));
}
/* Feiern: jeder fertige Abschnitt einmal für alle, die dafür gegeben haben; die Einweihung für alle Spender */
function stiftFeiern() {
  if (document.querySelector(".modal")) return;
  const st = stiftStand(); let neu = false;
  if (st.eingeweiht && !S.stiftEingeweiht) { S.stiftEingeweiht = true; neu = true; save(); checkBadges();
    if (Object.values(S.stift || {}).some(v => v > 0)) {
      [0, 900, 2000].forEach(t => setTimeout(() => { SFX.level(); rain(150); }, t));
      modal(`<div class="label">Einweihung</div><div class="sh-feier">${stiftBild(st)}</div><h2 style="margin:0">Die Stiftshütte ist fertig!</h2><p class="muted small" style="margin:0">„Da bedeckte die Wolke die Stiftshütte, und die Herrlichkeit des HERRN erfüllte die Wohnung“ (2. Mose 40,34). Danke, dass du mitgebaut hast!</p>
        <div class="vle-werte"><div><b>${avatarHtml({ avatar: S.avatar, frame: "wolke", name: S.lbName }, 44)}</b><span>Rahmen „Wolke der Herrlichkeit“</span></div><div><b>${svg("scroll")}</b><span>Titel „Bezaleel“</span></div></div>
        <button class="btn primary" data-close>Amen</button>`); return; }
  }
  for (let i = 0; i < st.fertig; i++) { const k = String(i + 1);
    if ((S.stift || {})[k] > 0 && !(S.stiftGefeiert || []).includes(k)) {
      S.stiftGefeiert = [...(S.stiftGefeiert || []), k]; save(); SFX.badge(); rain(100);
      modal(`<div class="label">Bauabschnitt ${k} von 8 fertig</div><div class="sh-feier">${stiftBild(Object.assign({}, st, { fertig: Math.max(st.fertig, i + 1) }))}</div><h2 style="margin:0">${esc(STIFT[i].n)}</h2>
        <p class="muted small" style="margin:0">„Es ist mehr als genug!“ (2. Mose 36,7) – Gebaut von ${stiftNamen(st.spender[i])}.</p><button class="btn primary" data-close="ok">Weiter</button>`, () => setTimeout(stiftFeiern, 300));
      return; }
  }
  return neu;
}

/* 6.69: Die Stammeswappen (6.68) wurden aus dem Laden genommen – gekaufte Wappen werden voll erstattet */
const STAEMME_ERSTATTUNG = { ruben: 80, simeon: 90, levi: 100, juda: 110, sebulon: 120, issaschar: 140, dan: 150, gad: 160, asser: 180, naftali: 200, josef: 220, benjamin: 250 };
function staemmeErstatten() {
  const weg = (S.owned || []).filter(x => /^st-/.test(x)); if (!weg.length && !(S.badges || []).includes("ganzisrael")) return;
  const tal = weg.reduce((a, x) => a + (STAEMME_ERSTATTUNG[x.slice(3)] || 0), 0);
  S.owned = S.owned.filter(x => !/^st-/.test(x)); S.badges = (S.badges || []).filter(b => b !== "ganzisrael");
  if (S.title === "ganzisrael") S.title = "none"; if (S.frame === "zwoelf") S.frame = "none"; delete S.wappen;
  S.tal += tal; save(); renderHud(); lbSync();
  if (tal) setTimeout(() => toast(`${TAL_MUENZE}<div><b>+${tal} Talente erstattet</b><div class="small muted">Die Stammeswappen gibt es nicht mehr im Laden – dafür neue Avatare bis Level 60.</div></div>`), 1200);
}
/* 6.69: Symbole der neuen Avatare (vorerst hier; beim nächsten Generator-Lauf übernehmen) */
(function () {
  const A = inner => `<svg x="0" y="0" width="24" height="24" viewBox="0 0 64 64" overflow="visible" class="wr wr-avatar"><ellipse cx="32" cy="61" rx="17" ry="2.2" fill="#000" opacity=".3"/>${inner}</svg>`;
  const O = "#1b2a55";
  ICONS["av-hirtenstab"] = A(`<path d="M30 60V22c0-9 6-15 13-15s12 5 12 11c0 5-4 8-8 8" fill="none" stroke="${O}" stroke-width="8" stroke-linecap="round"/><path d="M30 60V22c0-9 6-15 13-15s12 5 12 11c0 5-4 8-8 8" fill="none" stroke="url(#wrG)" stroke-width="5" stroke-linecap="round"/><path d="M33 52V24c0-6 4-12 10-12" fill="none" stroke="#fff" stroke-width="1.4" opacity=".8" stroke-linecap="round"/><path d="M14 46c4-4 10-4 12 0c-2 4-8 6-12 0z" fill="url(#wrP)" stroke="${O}" stroke-width="1.2"/><circle cx="16" cy="45" r="1.2" fill="${O}"/>`);
  ICONS["av-tafeln"] = A(`${[[8, -6], [30, 6]].map(([x, r]) => `<path d="M${x} 56V22a13 13 0 0 1 26 0V56Z" transform="rotate(${r} ${x + 13} 40)" fill="url(#wrP)" stroke="${O}" stroke-width="1.6"/>`).join("")}${[30, 37, 44, 51].map(y => `<path d="M13 ${y}h14M36 ${y + 1}h14" stroke="#7a8ab0" stroke-width="1.6" stroke-linecap="round" transform="rotate(0)"/>`).join("")}<path d="M17 22h6M40 23h6" stroke="url(#wrG)" stroke-width="2.4" stroke-linecap="round"/>`);
  ICONS["av-arche"] = A(`<path d="M10 22a22 22 0 0 1 44 0" fill="none" stroke="#ff8a8a" stroke-width="2.4"/><path d="M13 22a19 19 0 0 1 38 0" fill="none" stroke="#ffe39a" stroke-width="2.4"/><path d="M16 22a16 16 0 0 1 32 0" fill="none" stroke="#7fc8ff" stroke-width="2.4"/><rect x="20" y="28" width="24" height="12" rx="2" fill="#c18c45" stroke="${O}" stroke-width="1.4"/><path d="M18 30L32 22L46 30" fill="#9a6a30" stroke="${O}" stroke-width="1.4" stroke-linejoin="round"/><rect x="29" y="32" width="6" height="8" fill="${O}" opacity=".6"/><path d="M6 40H58L52 52H12Z" fill="url(#wrG)" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 44h44" stroke="#a07c22" stroke-width="1.2"/><path d="M4 56q7-4 14 0t14 0t14 0t14 0" fill="none" stroke="#7fc8ff" stroke-width="2.2" stroke-linecap="round"/>`);
  ICONS["av-weinstock"] = A(`<path d="M32 6c0 6-6 6-6 12" fill="none" stroke="#7a5a2a" stroke-width="3" stroke-linecap="round"/><path d="M33 12c6-6 16-6 20 0c-6 0-8 4-10 8c-4-4-10-4-10-8z" fill="#5fae5a" stroke="${O}" stroke-width="1.3" stroke-linejoin="round"/>${[[26, 22], [34, 22], [22, 30], [30, 30], [38, 30], [26, 38], [34, 38], [30, 46], [22, 38] , [38, 38]].slice(0, 9).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.4" fill="#8a5ad6" stroke="${O}" stroke-width="1.2"/><circle cx="${x - 1.6}" cy="${y - 1.8}" r="1.4" fill="#fff" opacity=".7"/>`).join("")}`);
  ICONS["av-brote"] = A(`<path d="M8 40h48l-6 16H14z" fill="#a8743c" stroke="${O}" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 46h40M16 51h32" stroke="#6b4318" stroke-width="1.2"/>${[[16, 34], [26, 31], [36, 31], [46, 34], [31, 24]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="5" fill="url(#wrG)" stroke="${O}" stroke-width="1.2"/><path d="M${x - 3} ${y - 1}q3-2 6 0" stroke="#a07c22" stroke-width="1" fill="none"/>`).join("")}${[[18, 12, 1], [44, 14, -1]].map(([x, y, d]) => `<path d="M${x - 8 * d} ${y}q${8 * d}-7 ${14 * d} 0q-${6 * d} 7-${14 * d} 0z" fill="#9fc6e8" stroke="${O}" stroke-width="1.2"/><path d="M${x + 6 * d} ${y}l${5 * d}-4v8z" fill="#9fc6e8" stroke="${O}" stroke-width="1.1"/>`).join("")}`);
  ICONS["av-menora"] = A(`<circle class="wr-halo" cx="32" cy="22" r="22" fill="url(#wrH_lohn)"/><path d="M32 18V54M22 58h20" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M32 18V54M22 58h20" stroke="url(#wrG)" stroke-width="3.6" stroke-linecap="round"/>${[8, 15, 22].map(w => `<path d="M${32 - w} 18v6c0 ${w * .9} ${w} ${w * .9 + 6} ${w} ${w * .9 + 6}s${w}-${0} ${w}-${w * .9 + 6}v-6" fill="none" stroke="${O}" stroke-width="5.4" stroke-linecap="round"/><path d="M${32 - w} 18v6c0 ${w * .9} ${w} ${w * .9 + 6} ${w} ${w * .9 + 6}s${w}-${0} ${w}-${w * .9 + 6}v-6" fill="none" stroke="url(#wrG)" stroke-width="3" stroke-linecap="round"/>`).join("")}${[10, 17, 24, 32, 40, 47, 54].map(x => `<path d="M${x} 16c-2-3 0-6 0-8c2 2 3 5 0 8z" fill="url(#wrF)" stroke="#a0520a" stroke-width=".6"/>`).join("")}`);
  ICONS["av-leiter"] = A(`<circle class="wr-halo" cx="46" cy="12" r="16" fill="url(#wrH_lohn)"/><path d="M14 60L40 6M28 60L54 6" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M14 60L40 6M28 60L54 6" stroke="url(#wrG)" stroke-width="3" stroke-linecap="round"/>${[0, 1, 2, 3, 4, 5].map(i => { const y = 52 - i * 8.6, x = 18 + i * 4.2; return `<path d="M${x} ${y}h14" stroke="${O}" stroke-width="4.4" stroke-linecap="round"/><path d="M${x} ${y}h14" stroke="url(#wrP)" stroke-width="2.4" stroke-linecap="round"/>`; }).join("")}${[[46, 2], [58, 10], [56, 22]].map(([x, y]) => `<path d="M${x} ${y - 3}l1 2.2 2.4 .8-2.4.8-1 2.2-1-2.2-2.4-.8 2.4-.8z" fill="#fff6c8"/>`).join("")}`);
  ICONS["av-palme"] = A(`<path d="M18 60C24 44 34 26 50 6" fill="none" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M18 60C24 44 34 26 50 6" fill="none" stroke="#7a9a3a" stroke-width="3" stroke-linecap="round"/>${Array.from({ length: 9 }, (_, i) => { const t = .15 + i * .09, x = 18 + (50 - 18) * t + 2, y = 60 - 54 * t, l = 16 - i * 1.1; return `<path d="M${x} ${y}q-${l * .8}-${l * .2}-${l}-${l * .7}" fill="none" stroke="#3f7a3a" stroke-width="3.2" stroke-linecap="round"/><path d="M${x} ${y}q${l * .3}-${l * .3}${l}-${l * .2}" fill="none" stroke="#5fae5a" stroke-width="3.2" stroke-linecap="round"/>`; }).join("")}<path d="M48 8l4-4" stroke="url(#wrG)" stroke-width="2.4" stroke-linecap="round"/>`);
})();
