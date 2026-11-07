/* =====================================================================
   Bibelbuch-Quest – Spiel-Logik (Version 6.30)
   Braucht: daten.js (vorher geladen). Rangliste: leaderboard.js stellt window.LB bereit.
   ===================================================================== */

/* ---------- Zustand & Speichern ---------- */
const DEF = {
  xp: 0, tal: 0, tl: null, stars: {}, right: 0,
  streak: 0, bestStreak: 0, lastDay: "", todayXp: 0, todayDay: "", todayRight: 0, bestDayRight: 0,
  goalStreak: 0, bestGoalStreak: 0, lastGoalDay: "",
  bestChain: 0, chainAT: 0, chainNT: 0, chainRueck: 0, bestBlitz: 0, bestCombo: 0,
  badges: [], owned: ["gold"], theme: "gold", avatar: "initial", frame: "none", title: "none",
  tage: [], treueWochen: [], treueBonus: { week: "", stufen: [] }, meister: { bibel: [], at: [], nt: [], rueck: [] },
  siegelGesehen: { bibel: 0, at: 0, nt: 0, rueck: 0 }, aufgefrischt: false, eingeladenVon: "", eingeladen: false, fischerDabei: false, menschenfischer: false,
  songHeard: [], gapPerfect: false, peeked: false, earlyBird: false,
  dq: { day: "", items: [], bonus: false }, questBonusCount: 0, lv: {}, duGes: [], duSiege: 0, duSpiele: 0, duTyp: "vers", duGesendet: 0, duAngenommen: 0, duArten: [], duKetteVoll: false,
  mute: false, beat: true, gapSing: false, atTi: 0, ntTi: 0,
  ruestStufe: {}, stift: {}, spendeXp: {}, advTest: { on: false, d: "2026-11-29" }, advT: null, beth: {}, bethG: {}, bethSync: "", bethTage: [], bethGefeiert: [], bethAngekommen: false, kal: {}, advBib: {}, advLv: 0, advLr: 0, adventIntro: false, stiftGefeiert: [], stiftEingeweiht: false,
  xq: null, lvLohn: 0, lbName: "", pid: "", ownersSet: false, offlineOnly: false, weekKey: "", weekXp: 0, podium: false, wochensieger: false, wochenziel: false,
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
  if (modus === "pruefung") { A("frei", { hilfe: false, quote: LV_PRUEF_QUOTE }); A("stelle", { schwer: true }); return a; }
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
  void ref; return a;
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
  vlZeige();
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
      if (a.offen.indexOf(i) < a.pos) return `<span class="vl-gefuellt">${esc(m[1])}</span>${esc(m[2])}`;
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
    if (VL.i === 0) { VL = null; go("home"); return; }
    modal(`<div class="label">Lektion beenden?</div><h2>Fast geschafft!</h2><p class="muted">Wenn du jetzt aufhörst, zählt diese Lektion noch nicht.</p>
      <button class="btn primary" data-close="weiter">Weiterlernen</button><button class="btn ghost" data-close="ende">Beenden</button>`, r => { if (r === "ende") { VL = null; go("home"); } });
  };
  if ($("vlWeiter")) $("vlWeiter").onclick = () => { SFX.tap(); vorlesenStop(); VL.i++; vlZeige(); };
  if ($("vlHoer")) $("vlHoer").onclick = () => { const beat = S.beat; S.beat = false; vorlesen([{ text: text + " – " + ref.replace(/(\d+),(\d+)/, "$1, Vers $2") }]); S.beat = beat; };
  let wahl = null;
  screen.querySelectorAll(".vl-opt").forEach(b => b.onclick = () => { SFX.tap(); wahl = +b.dataset.o; screen.querySelectorAll(".vl-opt").forEach(x => x.classList.toggle("gewaehlt", x === b)); P.disabled = false; });
  screen.querySelectorAll(".vl-wort").forEach(b => b.onclick = () => { SFX.tap(); wahl = +b.dataset.w; screen.querySelectorAll(".vl-wort").forEach(x => x.classList.toggle("gewaehlt", x === b)); P.disabled = false; });
  if (a.typ === "luecke") screen.querySelectorAll(".vl-chips .chip").forEach(b => b.onclick = () => {
    const w = text.split(" "), aktiv = a.offen[a.pos], ok = lvGleich(a.opts[+b.dataset.o], w[aktiv]);
    if (ok) { SFX.right(a.pos); vibrate(10); a.pos++; a.opts = null; if (a.pos >= a.offen.length) vlUrteil(a, a.fehler === 0, null); else vlZeige(); }
    else { a.fehler++; vlFehlerWort(a.k, aktiv); SFX.wrong(); vibrate([40, 30, 40]); b.classList.remove("no"); void b.offsetWidth; b.classList.add("no"); b.disabled = true; }
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
    const verteilen = (j) => {
      const f = felder[j], v = f.value;
      if (!/\S\s/.test(v)) return;
      const teile = v.trim().split(/\s+/).filter(Boolean); f.value = teile[0];
      let k = j;
      for (const t of teile.slice(1)) {
        const nx = felder[k + 1];
        if (!nx || +nx.dataset.i !== +felder[k].dataset.i + 1) break;
        nx.value = t; k++;
      }
      const ziel = felder[k + 1] && +felder[k + 1].dataset.i === +felder[k].dataset.i + 1 ? felder[k + 1] : felder[k];
      if (ziel) ziel.focus();
    };
    felder.forEach((f, j) => { f.oninput = () => { verteilen(j); pruef(); }; f.onkeydown = e => { if (e.key === "Enter" || (e.key === " " && f.value.trim())) { e.preventDefault(); if (felder[j + 1]) felder[j + 1].focus(); else if (!P.disabled) P.click(); } }; });
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
    if (VL.modus !== "pruefung" && a.versuch < 3) { const kopie = Object.assign({}, a); ["opts", "loesung", "tausch", "falsch", "ziel", "kacheln", "gelegt", "offen", "pos", "fehler", "optsFuer", "tippGenutzt"].forEach(x => delete kopie[x]); VL.liste.push(kopie); }
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
  $("vlFertig").onclick = () => { SFX.tap(); go("home"); };
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
function renderHud() {
  const n = levelOf(S.xp), lo = cum(n), hi = cum(n + 1);
  $("hLvl").textContent = n; $("hAvatar").innerHTML = avatarHtml({ avatar: S.avatar, frame: S.frame, name: S.lbName || "?" }, 44);
  const rang = entwickler ? ENTW_RANG : titleOf(n);
  $("hTitle").textContent = S.lbName || rang; $("hXp").textContent = S.lbName ? rang : "Level " + n; $("hXpZ").textContent = `${S.xp - lo} / ${hi - lo} XP`;
  $("hRing").style.setProperty("--p", Math.max(0, Math.min(100, (S.xp - lo) / (hi - lo) * 100)).toFixed(1));
  const serie = streakNow(); $("hStreak").textContent = serie === 1 ? "1 Tag" : serie + " Tage"; $("hStreak").parentElement.classList.toggle("null", !serie);
  $("hTal").textContent = S.tal; const tbP = $("tbTal"); if (tbP) tbP.hidden = !etwasKaufbar();
  $("hLvlT").textContent = "Level " + n;
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
const avatarLv = (p, size) => `<span class="avw">${avatarHtml(p, size)}<span class="lvc" title="Level ${p.level || 1}">${p.level || 1}</span></span>`;
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
const veredelPreis = id => { if (!S.owned.includes("ar-" + id)) return 0; const st = ruestStufe(id); return st >= 2 ? 0 : RUEST_VEREDEL_PREIS[id][st]; };
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
function go(name, arg) {
  VL = null; applyTheme(); clearTimers(); vorlesenStop(); lbUnsub.forEach(u => { try { u(); } catch (e) {} }); lbUnsub = [];
  if (!S.lbName && name !== "name") name = "name";
  current = name; window.scrollTo(0, 0); document.body.classList.remove("spiel-laeuft");
  tabbarSetzen(name); (VIEWS[name] || VIEWS.home)(arg);
  try { staemmeErstatten(); appBonusPruefen(); appHinweisZeigen(); } catch (e) {} /* beim allerersten go() sind die Konstanten unten noch nicht bereit */
  if (typeof duAufloesQ !== "undefined" && duAufloesQ.length) setTimeout(duAufloesVersuch, 400);
}
/* Untere Menüleiste: zu welchem Reiter gehört eine Ansicht? */
/* 8.0 „Allein und Zusammen“: nur noch vier große Reiter – Laden über die Talente oben, Rangliste unter „Zusammen“ */
const TABS = [["home", "Start", "sun"], ["lernen", "Lernen", "book"], ["spielen", "Allein", "user"], ["zusammen", "Zusammen", "people"]];
const TAB_VON = { stift: "zusammen", advent: "home", beth: "home", kal: "home", duell: "zusammen", verslektion: "lernen", lektion: "lernen", lied: "lernen", lernverse: "lernen", learn: "lernen", path: "lernen", stage: "lernen", bibelsong: "lernen", blitz: "spielen", gap: "spielen", chain: "spielen", biblionaer: "zusammen",
  bib: "zusammen", duelle: "zusammen", rank: "zusammen", shop: "", ich: "", profil: "", badges: "", wer: "", postfach: "" };
/* rote Zahl am Duell-Reiter: wartende Herausforderungen */
function tbDuSetzen() { const t = $("tbDu"); if (!t) return; const n = typeof duFuerMich === "function" ? duFuerMich().length : 0; t.hidden = !n; t.textContent = n; }
function tabbarSetzen(name) {
  const nav = $("tabbar"); if (!nav) return;
  const aktiv = name in TAB_VON ? TAB_VON[name] : name;
  document.body.dataset.tab = name === "name" ? "" : (aktiv || "frei");
  if (!nav.dataset.fertig) {
    nav.innerHTML = TABS.map(([k, t, i]) => `<button data-tab="${k}" aria-label="${t}"><span class="tb-ic">${svg(i)}</span><span>${t}</span>${k === "zusammen" ? `<span class="tb-du" id="tbDu" hidden></span>` : ""}</button>`).join("");
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
const BK_FARBE = { home: "#f2c14e", lernen: "var(--ar-lernen)", spielen: "var(--ar-spielen)", bib: "#66e0d0", gemeinde: "#5fe0b0", advent: "#ffcf5a", laden: "#b38cff" };
const BK_ZAHLEN = "bq-zahlen";
const bkZahlenAn = () => { try { return localStorage.getItem(BK_ZAHLEN) === "1"; } catch (e) { return false; } };
const bereichKopf = (m, o) => `<div class="bkopf${bkZahlenAn() ? " zahlen" : ""}" style="--bk:${BK_FARBE[m]}">
  <header class="bk-kopf">${o.bild ? `<span class="bk-med bild"><img src="${o.bild}" alt="" width="480" height="455"></span>` : `<span class="bk-med">${svg(o.ic)}</span>`}
    <div class="bk-t"><h1>${o.t}</h1><span>${o.sub}</span></div>
    <div class="bk-ring" aria-label="${o.ring[0]} ${o.ring[1]}"><b${o.ringId ? ` id="${o.ringId}"` : ""}>${o.ring[0]}</b><small>${o.ring[1]}</small></div>
    <button class="bk-zk" data-bkzahlen aria-label="Meine Zahlen ein- oder ausblenden">${svg("star")}<span>Zahlen</span></button></header>
  ${o.tafel ? `<div class="bk-tafel">${o.tafel.map(([z, t, id]) => `<span><b${id ? ` id="${id}"` : ""}>${z}</b> ${t}</span>`).join("")}${o.zeile ? `<span class="bk-zeile">${svg(o.zeile.ic)}<em>${o.zeile.t}</em><i class="bk-bar"><i style="width:${Math.max(4, Math.round(o.zeile.p))}%"></i></i><small>${o.zeile.r}</small></span>` : ""}</div>` : ""}
  ${o.knopf ? `<button class="bk-start" ${o.knopf.attr}>${svg(o.knopf.ic)}<b>${o.knopf.t}</b>${svg("bolt")}</button>` : ""}</div>`;
const bkLabel = (ic, t, n) => `<div class="bk-label">${svg(ic)}<span>${t}</span>${n ? `<i>${n}</i>` : ""}</div>`;
function wireGo() { screen.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { SFX.tap(); go(b.dataset.go, b.dataset.arg); });
  screen.querySelectorAll("[data-bkzahlen]").forEach(b => b.onclick = () => { SFX.tap(); const an = !bkZahlenAn(); try { localStorage.setItem(BK_ZAHLEN, an ? "1" : "0"); } catch (e) {} screen.querySelectorAll(".bkopf").forEach(k => k.classList.toggle("zahlen", an)); }); }

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
  const ni = naechsteLektion(), duN = duFuerMich().length;
  /* Seit 6.43: vier gleich große Felder (2×2) – Lernen, Spielen, Biblionär, Arena */
  const felder = [
    { go: "lernen", ar: "lernen", ic: svg("book"), t: "Lernen", info: `<b>${geschafft}/${GROUPS.length}</b> · ${ni >= 0 ? esc(GROUPS[ni].name) : "Alles geschafft!"}`, ecke: "" },
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
  const ezZeile = (go, ar, ic, t, sub, ecke = "") => `<button class="ez" data-ar="${ar}" data-go="${go}"><span class="ez-ic">${ic}</span><span class="ez-tx"><b>${t}</b><small>${sub}</small></span>${ecke}<i class="ez-pf">›</i></button>`;
  screen.innerHTML = `<div class="stack start start2 start8">
    <details class="ez-aufg ${S.dq.bonus ? "fertig" : bereit ? "bereit" : ""}"${bereit ? " open" : ""}>
      <summary><span class="ez-ic">${svg("target")}</span><span class="ez-tx"><b>${S.dq.bonus ? "Heute geschafft!" : bereit ? "Die Truhe wartet!" : `Heute: ${erledigt} von 3`}</b><small>${S.dq.bonus ? "Morgen gibt es neue Aufgaben" : "Tagesaufgaben – antippen zum Öffnen"}</small></span><span class="ez-keys">${[0, 1, 2].map(i => `<i class="${i < erledigt ? "an" : ""}">${SCHLUESSEL}</i>`).join("")}</span></summary>
      <section class="heute3 ${S.dq.bonus ? "fertig" : ""}" aria-label="Tagesaufgaben, ${erledigt} von 3 erledigt"><ul>${aufg}</ul>${truhe}</section>
    </details>
    ${adventMiniHtml(true)}${siegel}
    <div class="ez-liste">
      ${ezZeile("lernen", "lernen", svg("book"), "Lernen", ni >= 0 ? `Weiter mit: ${esc(GROUPS[ni].name)}` : "Lektionen, Lernvers, Lied")}
      ${ezZeile("spielen", "spielen", svg("user"), "Allein spielen", "Blitz, Kette, Biblionär")}
      ${ezZeile("zusammen", "gemeinde", svg("people"), "Zusammen", duN ? (duN === 1 ? "1 Duell wartet auf dich" : `${duN} Duelle warten auf dich`) : "Duelle, Biblionär der Woche, Rangliste", duN ? `<span class="ez-zahl" aria-label="${duN} ${duN === 1 ? "Duell wartet" : "Duelle warten"}">${duN}</span>` : "")}
    </div>
    <div class="start-vers">${MONATSVERSE[monatKey()] ? lvKarte(monatKey()) : `<button class="vers-zeile" id="versZeile" aria-expanded="false">${versHtml(vKey, "tag klein")}<span class="vz-mehr">mehr</span></button>`}</div>
    ${entwickler && postfachNeu ? `<button class="erinnerung pf-hinweis" data-go="postfach">${svg("chat")}<span><b>${postfachNeu} ${postfachNeu === 1 ? "neue Meldung" : "neue Meldungen"} im Postkasten</b><span class="small muted">Feedback, Status und Datenbank</span></span></button>` : ""}
    <button class="feedback-link fb-start" id="fbLinkStart">${svg("chat")} Feedback an den Entwickler</button>
  </div>`;
  wireGo();
  $("fbLinkStart").onclick = () => { SFX.tap(); feedbackOeffnen(); };
  const tb = $("truheBtn"); if (tb) tb.onclick = () => truheOeffnen(tb);
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
  screen.innerHTML = `${bereichKopf("lernen", { ic: "book", t: "Lernen", sub: ni >= 0 ? `Weiter mit: ${esc(GROUPS[ni].name)}` : "Alles geschafft – jetzt wiederholen!", ring: [sterne, sterne === 1 ? "Stern" : "Sterne"],
    tafel: [[atP + "%", "AT"], [ntP + "%", "NT"], [`${S.songHeard.length}/8`, "Lied"]],
    knopf: ni >= 0 ? { ic: "book", t: "Weiterlernen", attr: `data-go="lektion" data-arg="${ni}"` } : null })}
  ${bkLabel("book", "Lektionen")}
  <div class="kb-tabs lern-tabs" role="tablist" aria-label="Testament"><button role="tab" data-teil="at" aria-selected="${at}">${svg("kette-at")}<span>Altes Testament</span></button><button role="tab" data-teil="nt" aria-selected="${!at}">${svg("kette-nt")}<span>Neues Testament</span></button></div>
  <div class="titelzeile"><span class="tag ${lernTeil}">${lernTeil.toUpperCase()}</span> <b>${esc(T[titelIndex(T, P)][1])}</b><span class="tbar"><i style="width:${P}%"></i></span><span class="small muted">${P}%</span></div>
  <div class="stack lek-liste">${(at ? GROUPS.slice(0, 5) : GROUPS.slice(5)).map((g, k) => lektion(g, at ? k : k + 5)).join("")}</div>
  ${bkLabel("music", "Lernhilfen")}
  <div class="duo">
    <button class="mini-karte" data-go="lied"><span class="lek-nr">${svg("music")}</span><b>Lied</b><span>${S.songHeard.length}/8 Strophen</span></button>
    <button class="mini-karte" data-go="learn"><span class="lek-nr">${svg("eye")}</span><b>Spickzettel</b><span>Alle 66 Bücher</span></button>
  </div>
  <button class="bereich klein lv-zugang" data-go="lernverse"><span class="b-ic">${svg("scroll")}</span><span class="b-tx"><b>Lernverse</b><span>Vers des Monats und frühere Verse</span></span><span class="b-info">${Object.keys(MONATSVERSE).filter(k => k <= monatKey() && lvStand(k).st >= LV_MAX).length}/${Object.keys(MONATSVERSE).filter(k => k <= monatKey()).length}</span></button>`;
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

/* ---------- Bereich Spielen ---------- */
VIEWS.spielen = () => {
  const siegelZahl = Object.keys(KETTEN).filter(id => siegelStufe(S.meister[id] || [])).length;
  const besteKette = Math.max(0, ...Object.values(KETTEN).map(k => kettenBuecher(k.key)));
  screen.innerHTML = `${bereichKopf("spielen", { ic: "user", t: "Allein", sub: S.bestBlitz ? `Knackst du heute ${S.bestBlitz}?` : "Wie weit kommst du heute?", ring: [`${siegelZahl}/${Object.keys(KETTEN).length}`, "Siegel"],
    tafel: [[S.bestBlitz || 0, "Blitz"], [besteKette, "Kette"], [siegelZahl, "Siegel"]],
    knopf: { ic: "bolt", t: "Blitz-Runde", attr: `data-go="blitz" aria-label="Blitz-Runde: 60 Sekunden – was kommt danach?"` } })}
  <div class="stack">
    ${bkLabel("biblionaer", "Wer wird Biblionär?")}
    <button class="bereich klein" id="alleinBib"><span class="b-ic">${svg("biblionaer")}</span><span class="b-tx"><b>Biblionär allein</b><span>15 Bibelfragen bis zur Million${S.bibRekord ? ` · Rekord ${pkt(S.bibRekord)}` : ""}</span></span></button>
    <details class="erklaer"><summary>${bkLabel("link", "Die Kette · ein Fehler beendet sie")}<span class="ek-i" aria-label="Erklärung">?</span></summary>
    <p class="small muted">Wer eine Kette komplett schafft, bekommt ein Siegel. Wiederhole sie in verschiedenen Wochen und Monaten für Silber, Gold und Diamant. Nach ${SIEGEL_FRISCH} Tagen verblasst ein Siegel – dann einfach auffrischen.</p></details>
    ${Object.entries(KETTEN).map(([id, k]) => { const max = k.seq.length, rec = kettenBuecher(k.key), voll = rec >= max, t = S.meister[id] || [], st = siegelStufe(t), fr = siegelFrisch(t);
      return `<button class="kette-karte ${voll ? "voll" : ""}" data-k="${id}"><div class="ic">${st ? siegelHtml(st, fr) : svg("kette-" + id)}</div>
        <div class="kk-text"><b>${k.name}</b><span class="small muted">${st ? `${SIEGEL[st].name}-Siegel · ${fr ? "frisch noch " + siegelRest(t) + " Tage" : "verblasst – auffrischen!"}` : k.info}</span><span class="progress kk"><i style="width:${rec / max * 100}%"></i></span></div>
        <div class="kk-rec"><b>${rec}</b><span class="small muted">/ ${max}</span></div></button>`; }).join("")}
    ${bkLabel("music", "Lied")}
    <button class="bereich klein" data-go="gap" data-arg="alle"><span class="b-ic">${svg("music")}</span><span class="b-tx"><b>Lied-Lückenquiz</b><span>Welches Buch fehlt in der Liedzeile?</span></span></button>
  </div>`;
  wireGo();
  screen.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { SFX.tap(); countdown(() => playChain(b.dataset.k)); });
  $("alleinBib").onclick = () => { SFX.tap(); bibSolo(weihAktiv()); };
};

/* ---------- 8.0: Bereich „Zusammen“ – Duelle, Biblionär der Woche/zu zweit, Ranglisten ---------- */
VIEWS.zusammen = () => {
  const duN = duFuerMich().length;
  const k = (go, ar, ic, t, sub, ecke = "") => `<button class="ez" data-ar="${ar}" data-go="${go}"><span class="ez-ic">${ic}</span><span class="ez-tx"><b>${t}</b><small>${sub}</small></span>${ecke}<i class="ez-pf">›</i></button>`;
  screen.innerHTML = `${bereichKopf("gemeinde", { ic: "people", t: "Zusammen", sub: "Mit der Gemeinde spielen", ring: [levelOf(S.xp), "Level"] })}
  <div class="ez-liste">
    ${k("duelle", "arena", `<span class="sf-logo">${DUELL_LOGO}</span>`, "Duelle", duN ? `${duN} ${duN === 1 ? "Herausforderung wartet" : "Herausforderungen warten"}` : "Fordere jemanden heraus", duN ? `<span class="ez-zahl">${duN}</span>` : "")}
    ${k("bib", "bib", svg("biblionaer"), "Wer wird Biblionär?", "Duell zu zweit · Biblionär der Woche")}
    ${k("rank", "gemeinde", svg("trophy"), "Ranglisten", "Woche, Gesamt, Treue und mehr")}
  </div>`;
  wireGo();
  if (typeof duAktualisieren === "function" && duListe === null) duAktualisieren().then(() => { if (current === "zusammen" && duFuerMich().length !== duN) VIEWS.zusammen(); }).catch(() => {});
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
  let html = `${backBtn("lernen", "Lernen")}<h1>In des Alten Bundes Schriften</h1>
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
    screen.innerHTML = `${backBtn(alle ? "spielen" : "lied", alle ? "Spielen" : "Lied")}<h1>Lückenquiz${alle ? "" : " · Strophe " + (L.vi + 1)}</h1>
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
      <button class="btn primary" id="again">Nochmal</button><button class="btn ghost" data-go="${alle ? "spielen" : "lied"}">Zurück</button></div>`;
    wireGo(); wireSing(); $("again").onclick = () => { SFX.tap(); vorlesenStop(); VIEWS.gap(arg); };
    SFX.win(); if (perfekt) rain(80);
    if (xp) addXp(xp, null, "luecke", { t0, f: luecken.length - Math.min(fehler, luecken.length), fm: luecken.length, d: `${alle ? "Ganzes Lied" : "Strophe " + (strophen[0] + 1)} · ${fehler} Fehler${W.d}` }); save(); checkBadges();
  };
  render();
};

/* ---------- Blitz-Runde ---------- */
VIEWS.blitz = () => {
  screen.innerHTML = `${backBtn("spielen", "Spielen")}<h1>Blitz-Runde</h1>
  <div class="card stack" style="text-align:center">
    <p class="muted" style="margin:0">60 Sekunden: Was kommt nach dem Buch? Jede 10er-Combo erhöht den Multiplikator (bis x3). Ein Fehler kostet 3 Sekunden.</p>
    <div class="label">Bereich</div>
    <div class="modes" style="grid-template-columns:repeat(3,1fr)">
      <button class="btn primary" data-s="all">Ganze Bibel</button><button class="btn" data-s="AT">AT</button><button class="btn" data-s="NT">NT</button>
    </div>
    <div class="small muted">Rekord: ${S.bestBlitz} Richtige · Beste Combo: ${S.bestCombo}</div>
  </div>`;
  wireGo();
  screen.querySelectorAll("[data-s]").forEach(b => b.onclick = () => { SFX.tap(); countdown(() => playBlitz(b.dataset.s)); });
};
function countdown(cb) {
  document.body.classList.add("spiel-laeuft");
  let n = 3; screen.innerHTML = `<div class="result" style="padding-top:80px"><div class="big" id="cd">3</div></div>`; SFX.tick();
  const t = setInterval(() => { n--; if (n <= 0) { clearInterval(t); tone(1047, 0, .25, "triangle", .2); cb(); } else { $("cd").textContent = n; $("cd").style.animation = "none"; void $("cd").offsetWidth; $("cd").style.animation = "pop .3s"; SFX.tick(); } }, 700); timers.push(t);
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
      <button class="btn primary" id="again">Nochmal</button><button class="btn ghost" data-go="spielen">Zurück</button></div>`; wireGo(); wireSing();
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
  screen.innerHTML = `${backBtn("spielen", "Spielen")}<h1>Die Kette</h1>
  <p class="muted small" style="margin:0 0 10px">Immer das nächste Buch – ein Fehler beendet die Kette. Die Lied-Hilfe gibt es nur im Lernteil.</p>
  <div class="stack">${Object.entries(KETTEN).map(([id, k]) => { const max = k.seq.length, rec = kettenBuecher(k.key), voll = rec >= max;
    return `<button class="kette-karte ${voll ? "voll" : ""}" data-k="${id}">
      <div class="ic">${svg("kette-" + id)}</div>
      <div class="kk-text"><b>${k.name}</b><span class="small muted">${k.info}</span><span class="progress kk"><i style="width:${rec / max * 100}%"></i></span></div>
      <div class="kk-rec"><b>${rec}</b><span class="small muted">/ ${max}</span></div></button>`; }).join("")}
  </div>`;
  wireGo();
  screen.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { SFX.tap(); countdown(() => playChain(b.dataset.k)); });
};
function playChain(mode) {
  const K = KETTEN[mode], seq = K.seq; let i = 0, xp = 0, lock = false; const t0 = Date.now();
  screen.innerHTML = `<div class="stack"><div class="topline"><span><span id="cp">1</span> / ${seq.length}</span><span class="small muted">${K.name}</span><span id="cx">0 XP</span></div>
  <div class="progress"><i id="cbar"></i></div>
  <div class="card stack"><div class="qsub">${K.rueck ? "Was steht davor?" : "Was kommt nach"}</div><div class="q" id="cq"></div><div class="qsub" id="cm"></div>
    <div class="combo" id="cc"></div><div class="opts" id="co"></div></div>
  <div class="topline" style="justify-content:flex-end"><button class="btn ghost mini" data-go="spielen">Abbrechen</button></div></div>`;
  wireGo(); show();
  function show() {
    lock = false;
    const b = seq[i]; $("cq").textContent = ALL[b].b; $("cm").textContent = `${ALL[b].t === "AT" ? "Altes" : "Neues"} Testament · ${GROUPS[ALL[b].gi].name}`;
    $("cp").textContent = i + 1; $("cbar").style.width = (i / (seq.length - 1) * 100) + "%";
    const o = $("co"); o.innerHTML = ""; optsSeq(seq, i).forEach(t => { const btn = document.createElement("button"); btn.className = "opt"; btn.textContent = t; btn.onclick = () => ans(btn, t); o.appendChild(btn); });
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
    let tal = Math.floor(i / 10) + (full ? K.tal : 0); if (full) xp += K.bonus;
    const W = spielWdh("kette-" + mode); xp = wdhMal(xp, W); tal = wdhMal(tal, W);
    quest("ketteGespielt", 1); quest("runde", 1);
    const sieg = full ? meisterErfolg(mode) : null;
    const vorher = ALL[seq[i]].b;
    screen.innerHTML = `<div class="card result stack"><div class="label">${full ? "Großartig" : "Kette gerissen"}</div><div class="big">${i + 1} / ${seq.length}</div>
      <div class="muted">${full ? `${esc(K.name)} komplett in der richtigen Reihenfolge!` : `${K.rueck ? "Vor" : "Nach"} „${esc(vorher)}“ ${K.rueck ? "steht" : "kommt"} „${esc(correct)}“.`}</div>${rec && !full ? '<h2>Neuer Rekord!</h2>' : ''}
      ${!full && BUCH_IM_LIED[seq[i + 1]] ? `<div class="hilfe"><div class="label">So geht's im Lied</div>${singBox(zeileHtml(BUCH_IM_LIED[seq[i + 1]].v, BUCH_IM_LIED[seq[i + 1]].l))}</div>` : ""}
      ${sieg ? `<div class="siegel-box">${siegelHtml(sieg.nachher, true, true)}<div><b>${SIEGEL[sieg.nachher].name}-Siegel</b><div class="small muted">${sieg.nachher < 4 ? "Nächstes: " + SIEGEL[sieg.nachher + 1].name + " – " + SIEGEL[sieg.nachher + 1].text : "Höchste Stufe!"}<br>Bleibt ${SIEGEL_FRISCH} Tage frisch – danach einfach wiederholen.</div></div></div>` : ""}
      <div class="rewards"><span class="pill">+${xp} XP</span><span class="pill">+${tal + (sieg ? sieg.tal : 0)} Talente</span></div>${W.hinweis}
      <button class="btn primary" id="cagain">Nochmal</button><button class="btn ghost" data-go="spielen">Andere Kette</button></div>`; wireGo(); wireSing();
    $("cagain").onclick = () => { SFX.tap(); vorlesenStop(); countdown(() => playChain(mode)); };
    if (full) { SFX.level(); rain(200); } else if (rec) SFX.win();
    if (xp) addXp(xp, null, "kette", { t0, f: i, fm: seq.length - 1, d: `${K.name}${full ? " · komplett" : " · gerissen"}${W.d}` }); addTal(tal); save(); checkBadges(); lbSync();
  }
}

/* ---------- Spickzettel ---------- */
VIEWS.learn = () => {
  let n = 0, html = `${backBtn("lernen", "Lernen")}<h1>Spickzettel</h1>
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
    <div class="im-liste">${z("profil", "user", "Mein Profil", "Titel, Siegel, Werte")}${z("ich", "shop", "Laden", "Aussehen, Rüstung")}
    <button class="im-zeile gs-schalter" id="gsSchalter" aria-pressed="${grossAn()}">${svg("eye")}<span><b>Große Schrift</b><small>${grossAn() ? "an" : "aus"}</small></span><i class="gs-knopf"></i></button>${z("badges", "medal", "Abzeichen", `${S.badges.length} von ${BADGES.length}`)}${z("share", "share", "Mit Freunden teilen", "QR-Code")}${z("wer", "people", "Wer spielt?", "Spieler wechseln")}${entwickler ? z("postfach", "post", "Postkasten", postfachNeu ? postfachNeu + " neu" : "") : ""}${deferredInstall && !S.appBonus ? z("install", "down", "App installieren", `+${APP_BONUS} Talente`) : ""}${z("feedback", "chat", "Feedback an den Entwickler")}</div>
    <button class="btn ghost" data-close="">Schließen</button>`, r => {
      if (r === "feedback") feedbackOeffnen();
      else if (r === "install") { deferredInstall.prompt(); deferredInstall.userChoice.catch(() => {}).then(() => { deferredInstall = null; }); }
      else if (r) go(r);
    });
  m.classList.add("ich-menue"); m.dataset.frei = "1";
  const gs = m.querySelector("#gsSchalter"); if (gs) gs.onclick = () => { SFX.tap(); grossSetzen(!grossAn()); gs.setAttribute("aria-pressed", grossAn()); gs.querySelector("small").textContent = grossAn() ? "an" : "aus"; };
}
/* 8.0: Große Schrift – je Gerät, alles ca. 15 % größer */
const GROSS_KEY = "bq-gross";
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
VIEWS.profil = () => {
  const me = lbPayload(), { atP, ntP } = fortschritt();
  const L = window.LB, online = L && L.ok;
  screen.innerHTML = `${backBtn("home", "Start")}<h1>Mein Profil</h1>
  <div class="card profil-kopf">${avatarHtml({ avatar: S.avatar, frame: S.frame, name: S.lbName || "Du" }, 84)}
    <div><h2 style="margin:0">${esc(S.lbName || "Noch ohne Namen")}</h2>${!S.pid && !S.offlineOnly ? `<div class="small muted">Erscheint in der Rangliste, sobald Internet da ist.</div>` : ""}<div class="muted">${esc(rangVon())}</div>${ruestungHtml(armorCount(), false)}</div></div>
  <div class="row-btns" style="margin:10px 0"><button class="btn" data-go="shop">Aussehen ändern</button><button class="btn ghost" data-go="badges">Meine Abzeichen</button></div>
  <div class="card stack">${titelKarte(AT_TITEL, atP, "AT")}${titelKarte(NT_TITEL, ntP, "NT")}
    <p class="small muted" style="margin:0">Die Titel wachsen mit deinen Sternen in den Lektionen und deiner Kette im AT bzw. NT.</p></div>
  <div class="card stack" style="margin-top:12px"><b>Meine Siegel</b>${siegelReihe(Object.assign({}, me))}
    <p class="small muted" style="margin:0">Bronze: 1-mal · Silber: in 3 Wochen · Gold: in 3 Monaten · Diamant: 12 Monate am Stück. Ein Siegel bleibt ${SIEGEL_FRISCH} Tage frisch.</p></div>
  <div class="card" style="margin-top:12px"><table class="werte">${statsZeilen(me).map(([k, v]) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join("")}</table></div>
  <div class="card stack" style="margin-top:12px">
    <b>Auf einem weiteren Gerät spielen</b>
    <p class="small muted" style="margin:0">Öffne die App auf dem anderen Gerät und wähle <b>Ich spiele schon mit</b> (spielt dort schon jemand: oben auf Level/Namen tippen → Weiteren Spieler hinzufügen). Dann tippe deinen Namen an. Dann spielst du dort mit demselben Spielstand weiter.</p>
  </div>
  <div class="row-btns" style="margin-top:12px"><button class="btn ghost mini" id="wechseln">Spieler wechseln</button><button class="btn ghost mini" id="rename">Namen ändern</button>${S.pid && online && !S.offlineOnly ? `<button class="btn ghost mini" id="leave">Aus der Rangliste austreten</button>` : ""}</div><div id="pextra"></div>
  ${entwickler && (advTestOn() || dayNum(today()) < dayNum(ADV_START)) ? `<button class="btn" id="advTestBtn" style="margin-top:12px;width:100%">${svg("kerze")} Advent-Testmodus: ${advTestOn() ? "an – öffnen" : "starten"}</button>` : ""}
  ${entwickler ? `<button class="btn" data-go="postfach" style="margin-top:12px;width:100%">${svg("post")} Postkasten${postfachNeu ? ` (${postfachNeu} neu)` : ""}</button>` : ""}
  <button class="feedback-link" id="fbLink2">${svg("chat")} Feedback an den Entwickler</button>
  ${online ? kennungHtml("kennProfil") : ""}
  <p class="small muted" style="margin-top:18px">Bibelverse: ${VERS_QUELLE} © Genfer Bibelgesellschaft.</p>`;
  wireGo();
  $("wechseln").onclick = () => { SFX.tap(); go("wer"); };
  $("fbLink2").onclick = () => { SFX.tap(); feedbackOeffnen(); };
  if ($("advTestBtn")) $("advTestBtn").onclick = () => { SFX.tap(); if (!advTestOn()) advTestSchalten(true); go("advent"); };
  kennungKopierenVerdrahten(screen);
  if ($("rename")) $("rename").onclick = () => { SFX.tap(); $("pextra").innerHTML = `<div class="card stack"><label class="label" for="rn">Neuer Spitzname</label><input class="field" id="rn" maxlength="20" value="${esc(S.lbName)}"><button class="btn primary" id="rnSave">Speichern</button></div>`;
    $("rnSave").onclick = () => { const n = $("rn").value.trim().replace(/\s+/g, " "); if (n.length < 2) { SFX.wrong(); return; } S.lbName = n; save(); lbSync(true); SFX.coin(); go("profil"); }; };
  if ($("leave")) $("leave").onclick = () => { SFX.tap(); $("pextra").innerHTML = `<div class="card stack"><b>Aus der Rangliste austreten?</b><p class="small muted" style="margin:0">Dein Eintrag wird für alle gelöscht. Dein Spielstand auf diesem Gerät bleibt erhalten.</p><div class="topline"><button class="btn" id="lvNo">Abbrechen</button><button class="btn primary" id="lvYes">Austreten</button></div></div>`;
    $("lvNo").onclick = () => { $("pextra").innerHTML = ""; };
    $("lvYes").onclick = async () => { try { if (S.pid) await L.remove(S.pid); } catch (e) {} S.pid = ""; S.ownersSet = false; S.offlineOnly = true; save(); go("profil"); }; };
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
  ["xp", "tal", "right", "bestStreak", "bestChain", "chainAT", "chainNT", "chainRueck", "bestBlitz", "bestCombo", "questBonusCount", "bestGoalStreak", "bestDayRight", "duSiege", "duSpiele", "duGesendet", "duAngenommen", "lvLohn", "bibRekord", "bibSpiele", "bibMillion"].forEach(max);
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
        if ((current === "spielen" || current === "duelle") && !document.querySelector(".modal") && !duSpiel) go(current);
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
      if (n.length >= 2) S.lbName = n; save(); renderHud(); lbSync(true); go(current);
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
  setTimeout(() => andereSpielerNachsenden().catch(() => {}), 3000);  /* 6.83 (B) */
  setTimeout(() => xqStartPruefung().catch(() => {}), 6000);  /* 6.85 */
  aufnahmenPruefen();
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
  let html = bereichKopf("gemeinde", { ic: "people", t: "Gemeinde", sub: "Freie Baptisten Eichstätt", ring: ["–", "Platz"], ringId: "bkPlatz",
    tafel: [[levelOf(S.xp), "Level"], [`${S.badges.length}`, "Abzeichen"], ["–", "Spieler", "bkSpieler"]] }) + `<div id="shMiniBox">${stiftMiniHtml() || adventMiniHtml()}</div>` + bkLabel("trophy", "Ranglisten");
  stiftLaden().then(() => { const b = $("shMiniBox"); if (b && current === "rank") { b.innerHTML = stiftMiniHtml() || adventMiniHtml(); wireGo(); } });
  if (!L) { screen.innerHTML = html + `<div class="card"><p class="muted" style="margin:0">Rangliste wird geladen …</p></div>`; wireGo(); return; }
  if (!L.configured) { screen.innerHTML = html + `<div class="card stack"><b>Noch nicht eingerichtet</b><p class="muted small" style="margin:0">Die Rangliste braucht einen gemeinsamen Online-Speicher. Bis dahin kannst du ganz normal spielen – dein Fortschritt wird später übernommen.</p></div>`; wireGo(); return; }
  if (!L.ok) { screen.innerHTML = html + `<div class="card stack"><b>Keine Verbindung</b><p class="muted small" style="margin:0">Für die Rangliste brauchst du Internet. Deine Punkte werden übertragen, sobald du wieder online bist.</p><button class="btn" id="retry">Neu laden</button></div>`; wireGo(); $("retry").onclick = () => location.reload(); return; }
  if (S.offlineOnly) { screen.innerHTML = html + `<div class="card stack"><b>Du bist nicht in der Rangliste</b><p class="muted small" style="margin:0">Du spielst als ${esc(S.lbName)} nur auf diesem Gerät. Du kannst jederzeit wieder beitreten – dein Fortschritt wird übernommen.</p><button class="btn primary" id="wieder">Wieder beitreten</button></div>`; wireGo();
    $("wieder").onclick = () => { SFX.coin(); S.offlineOnly = false; save(); lbStart().then(() => go("rank")); }; return; }
  if (!S.pid && !S.ownersSet) { lbStart(); }
  const T = RANK_TABS[rankTab];
  const kat = katVon(rankTab); letzterTab[kat.id] = rankTab;
  const varianten = kat.tabs.length > 1 ? kat.tabs.map(k => `<button data-tab="${k}" aria-pressed="${k === rankTab}">${TAB_LABEL[k]}</button>`).join("")
    : rankTab === "kette" ? Object.entries(KETTE_SUB).map(([k, v]) => `<button data-sub="${k}" aria-pressed="${k === ketteSub}">${v[0]}</button>`).join("")
    : rankTab === "blitz" ? Object.entries(BLITZ_SUB).map(([k, v]) => `<button data-bsub="${k}" aria-pressed="${k === blitzSub}">${v[0]}</button>`).join("") : "";
  const titel = rankTab === "kette" ? T.titel : rankTab === "blitz" ? "Blitz-Rekord" : T.titel;
  screen.innerHTML = html + `<div class="stack rk">
    <nav class="kb-tabs rk-nav" aria-label="Ranglisten" style="grid-template-columns:repeat(${RANK_KAT.length},1fr)">${RANK_KAT.map(k => `<button data-kat="${k.id}" aria-pressed="${k.id === kat.id}" aria-selected="${k.id === kat.id}">${svg(k.icon)}<span>${k.name}</span></button>`).join("")}</nav>
    <div class="card rk-liste">
      <div class="rk-kopf ${istBibTab(rankTab) ? "rk-bib" : ""}"><div><b>${esc(titel)}</b><span class="small muted" id="rcount">${rankTab === "woche" || rankTab === "bibWoche" ? weekKey().split("-W")[1] + ". Kalenderwoche" : istBibTab(rankTab) ? "Gemeinde" : ""}</span></div>${varianten ? `<div class="rk-var" role="group" aria-label="Variante">${varianten}</div>` : ""}</div>
      ${istBibTab(rankTab) ? `<div id="bwBox">${bibInfoLeiste()}</div>` : ""}
      <div id="rbody"><p class="muted" style="margin:0">Lade Rangliste …</p></div>
    </div>
    <div class="du-bar" id="rme"></div>
  </div>`;
  wireGo();
  screen.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { SFX.tap(); go("rank", b.dataset.tab); });
  screen.querySelectorAll("[data-kat]").forEach(b => b.onclick = () => { SFX.tap(); const k = RANK_KAT.find(x => x.id === b.dataset.kat); go("rank", letzterTab[k.id] || k.tabs[0]); });
  screen.querySelectorAll("[data-sub]").forEach(b => b.onclick = () => { SFX.tap(); ketteSub = b.dataset.sub; go("rank", "kette"); });
  screen.querySelectorAll("[data-bsub]").forEach(b => b.onclick = () => { SFX.tap(); blitzSub = b.dataset.bsub; go("rank", "blitz"); });
  const bwVerdrahten = () => { const b = $("bwLos"); if (b) b.onclick = () => { SFX.tap(); bibWocheStarten(); }; };
  if (rankTab === "bibWoche") { bwVerdrahten(); bibSiegerPruefen().then(() => (bibVorwocheListe ? bibVorwocheListe : bibVorwocheLaden())).then(() => { const box = $("bwBox"); if (box && current === "rank" && rankTab === "bibWoche") { box.innerHTML = bibInfoLeiste(); bwVerdrahten(); } }); }
  const me = S.pid || L.uid; const wk = weekKey(); let zeilen = [];
  lbUnsub.push(L.watch(rankKind(), rankTab === "bibSpiele" ? BIB_GESAMT : wk, rows => {
    if (current !== "rank") return;
    rows = rows.filter(r => rankWert(r) > 0 || r.id === me).sort((a, b) => rankWert(b) - rankWert(a) || String(a.name).localeCompare(String(b.name)));
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
    const ich = myIdx > -1 ? rows[myIdx] : { name: S.lbName, avatar: S.avatar, frame: S.frame, level: levelOf(S.xp) };
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
    if (key === GERAET.aktiv) { S.lbName = n; save(); renderHud(); lbSync(true); }
    else {
      try { const k = lsKey(key), st = JSON.parse(localStorage.getItem(k) || "{}"); st.lbName = n; localStorage.setItem(k, JSON.stringify(st)); } catch (e) {}
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
  quiz: { art: "quiz", k: "leiter", name: "Wer wird Biblionär?", kurz: "Biblionär", ic: "biblionaer", info: "15 Bibelfragen bis 1 Million Punkte · 3 Joker · Aussteigen erlaubt" }
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
    const sieg = o.du.p > o.er.p, remis = o.du.p === o.er.p;
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
  const kf = 1 /* 6.93: keine Kürzung bei Duellen */, sieg0 = du.p > er.p, remis0 = du.p === er.p, tal = Math.round((sieg0 ? DU_SIEG_TAL : remis0 ? DU_REMIS_TAL : 0) * kf);
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
    if (!sieg) ov.querySelector(".sb-titel").classList.add("leise");
    ov.querySelector(".sb-zeile").textContent = sieg ? `Du hast ${d.anName} besiegt.` : remis ? "Genau gleich viele Punkte!" : `${d.anName} war diesmal besser – fordere eine Revanche!`;
    if (!sieg) ov.querySelector("#sbRev").classList.add("puls");
    sbSchluss(ov, sieg);
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
      const seq = (KETTEN[k] || KETTEN.bibel).seq;
      return seq.slice(0, -1).map((_, pos) => ({ buch: ALL[seq[pos]].b, opts: optsSeq(seq, pos), loesung: ALL[seq[pos + 1]].b }));
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
  const siege = fertig.filter(d => { const ich = d.von === S.pid, p = ich ? d.vonErg.p : d.anErg.p, q = ich ? d.anErg.p : d.vonErg.p; return p > q; }).length;
  const vorher = [S.duSiege | 0, S.duSpiele | 0];
  S.duSiege = Math.max(vorher[0], siege); S.duSpiele = Math.max(vorher[1], fertig.length);
  if (S.duSiege !== vorher[0] || S.duSpiele !== vorher[1]) { save(); checkBadges(); lbSync(); }
}
const duStatus = d => (d.status === "offen" && d.ablauf && Date.now() > d.ablauf ? "abgelaufen" : d.status);
const duFuerMich = () => (duListe || []).filter(d => d.an === S.pid && duStatus(d) === "offen");
const duNeueErgebnisse = () => (duListe || []).filter(d => d.von === S.pid && d.status === "fertig" && !(S.duGes || []).includes(d.id));
/* Herausforderer bekommt seinen Sieg, sobald er das Ergebnis zum ersten Mal sieht */
function duBelohnen() {
  const neu = duNeueErgebnisse(); if (!neu.length) return;
  let tal = 0;
  neu.forEach(d => {
    S.duGes = [...(S.duGes || []), d.id].slice(-60);
    const p = d.vonErg.p, q = d.anErg.p;
    const kf = 1;  /* 6.93: Duelle werden nie gekürzt (bis 6.92: gekürzt beim 5.+ Duell am Tag gegen denselben Gegner) */
    if (p > q) tal += Math.round(DU_SIEG_TAL * kf); else if (p === q) tal += Math.round(DU_REMIS_TAL * kf); /* der Sieg selbst wird in duZaehlen() aus den Duellen gezählt */
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
  let n = 0; for (const d of fertig) { const ich = d.von === S.pid, p = ich ? d.vonErg.p : d.anErg.p, q = ich ? d.anErg.p : d.vonErg.p; if (p > q) n++; else break; }
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
      <div class="ar-siege" aria-label="${siege} ${siege === 1 ? "Sieg" : "Siege"}"><b>${siege}</b><small>${siege === 1 ? "Sieg" : "Siege"}</small></div>
    </header>
    <div class="ar-tafel">
      <span><b>${spiele}</b> Duelle</span><span><b>${quote}%</b> Quote</span><span class="${serie >= 2 ? "heiss" : ""}"><b>${serie}</b> in Folge</span>
      ${ziel ? `<span class="ar-ziel" title="${esc(ziel.b.d)}">${svg(ziel.b.ic)}<em>${esc(ziel.b.name)}</em><i class="ar-fort"><i style="width:${Math.max(6, Math.round(ziel.ist / ziel.ziel * 100))}%"></i></i><small>${ziel.ist}/${ziel.ziel}</small></span>` : ""}
    </div>`;
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
      const p = ich ? d.vonErg.p : d.anErg.p, q = ich ? d.anErg.p : d.vonErg.p, erg = p > q ? "sieg" : p === q ? "remis" : "nieder";
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
    <button class="ar-start" id="duNeu" ${duWahl ? 'aria-expanded="true"' : ""}>${svg("duell")}<b>${duWahl ? "Gegner wählen" : "In die Arena"}</b>${svg(duWahl ? "nein" : "bolt")}</button>
    ${duWahl ? duGegnerHtml() : ""}
    ${duFehler ? `<p class="small muted">Die Arena konnte nicht geladen werden. <button class="lv-btn" id="duNeuLaden">Nochmal</button></p>` : ""}
    ${duListe === null && !duFehler ? `<p class="small muted du-laden">${svg("duell")} Lade Arena …</p>` : ""}
    ${fuerMich.length ? titel("bolt", "Du bist dran", fuerMich.length) + `<ul class="ar-liste">${fuerMich.map(dranKarte).join("")}</ul>` : ""}
    ${warte.length ? titel("sun", "Wartet auf Gegner", warte.length) + `<ul class="ar-liste">${warte.map(warteZeile).join("")}</ul>` : ""}
    ${fertig.length ? titel("crown", "Ergebnisse", "") + `<ul class="ar-liste">${fertig.map(zeile).join("")}</ul>${fertigAlle.length > DU_ERG_KURZ ? `<button class="ar-mehr" id="duAlle">${duAlle ? "Weniger zeigen" : `Alle ${fertigAlle.length} Ergebnisse`}</button>` : ""}` : ""}
    ${duListe && !liste.length ? `<div class="du-leer"><span class="du-leer-ic">${DUELL_LOGO}</span><b>Die Arena ist bereit</b><p class="small muted">Fordere jemanden aus der Gemeinde heraus – schon das Absenden bringt „Mutig wie David“.</p></div>` : ""}
    <p class="ar-regel">Annehmen +${DU_FAIR_TAL} · Sieg +${DU_SIEG_TAL} · Remis +${DU_REMIS_TAL} Talente · beide bekommen dieselben Fragen · 7 Tage Zeit</p>`;
  if ($("duAlle")) $("duAlle").onclick = () => { SFX.tap(); duAlle = !duAlle; VIEWS.duelle(); };
  wireGo(); duGegnerVerdrahten();
  $("duNeu").onclick = () => { SFX.tap(); duWahl = !duWahl; VIEWS.duelle(); if (duWahl) { duGegnerLaden(); const f = $("duSuche"); if (f && !matchMedia("(pointer: coarse)").matches) f.focus(); } };
  if ($("duNeuLaden")) $("duNeuLaden").onclick = () => { duAktualisieren().then(() => current === "duelle" && VIEWS.duelle()); };
  const annehmen = d => duSpielStarten({ id: d.id, seed: d.seed, erstellt: d.erstellt, art: d.art || "vers", k: d.k, gegner: d.vonName, gegnerErg: d.vonErg, vonPid: d.von, weih: !!(d.opt && d.opt.w) });
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
  try { duGegner = (await window.LB.gegnerListe()).filter(r => r.id !== S.pid && r.name); } catch (e) { duGegner = []; }
  if (current === "duelle" && duWahl) { const box = $("duGegner"); if (box) { box.outerHTML = duGegnerHtml(); duGegnerVerdrahten(); } }
}
function duGegnerHtml() {
  const offen = (duListe || []).filter(d => d.von === S.pid && duStatus(d) === "offen");
  const frei = Math.max(0, DU_MAX_OFFEN - offen.length), maxWahl = Math.min(DU_MAX_AUSWAHL, frei);
  duAuswahl = duAuswahl.filter(g => !offen.some(d => d.an === g.id)).slice(0, maxWahl);
  const q = nameSchluessel(duSuche), typ = duTypAktuell(), n = duAuswahl.length, voll = n >= maxWahl;
  const liste = (duGegner || []).filter(r => !q || nameSchluessel(r.name).includes(q)).slice(0, 40);
  return `<div class="card du-gegner" id="duGegner">
    ${!frei ? `<p class="small muted" style="margin:0">Du hast schon ${DU_MAX_OFFEN} offene Herausforderungen – erst müssen diese gespielt werden. Unten bei „Wartet auf Gegner“ kannst du eine abbrechen.</p>` : `
    <div class="label du-schritt">1 · Duell-Art</div>
    ${duTypKacheln(typ)}
    ${typ === "quiz" ? weihSchalterHtml() : ""}
    <p class="small muted du-typ-info">${esc(DU_TYPEN[typ].info)}${typ === "quiz" && weihAktiv() ? " – im Weihnachtsmodus mit Fragen zu Advent und Weihnachten" : ""}</p>
    <div class="label du-schritt du-schritt2"><span>2 · Gegner</span><i class="du-zahl${n ? " an" : ""}">${n}/${maxWahl}</i></div>
    <input class="du-suche" id="duSuche" type="search" placeholder="Name suchen …" value="${esc(duSuche)}" autocomplete="off" aria-label="Gegner suchen">
    ${n ? `<div class="du-chips">${duAuswahl.map(g => `<button class="du-chip" data-raus="${esc(g.id)}" aria-label="${esc(g.name)} abwählen">${esc(g.name)}${svg("nein")}</button>`).join("")}</div>` : ""}
    ${duGegner === null ? `<p class="small muted">Lade Gemeinde …</p>` : `<ul class="du-wahl">${liste.map(r => { const laeuft = offen.some(d => d.an === r.id), an = duAuswahl.some(g => g.id === r.id);
      return `<li><button class="du-person${an ? " gewaehlt" : ""}" data-gegner="${esc(r.id)}" aria-pressed="${an}" ${laeuft || (voll && !an) ? "disabled" : ""}>${avatarLv(r, 34)}<span class="du-tx"><b>${esc(r.name)}</b><span>${laeuft ? "Duell läuft schon" : "Level " + (r.level || 1)}</span></span>${laeuft ? "" : `<span class="du-haken">${an ? svg("check") : ""}</span>`}</button></li>`; }).join("") || `<li class="small muted">Niemand gefunden.</li>`}</ul>`}
    <button class="btn primary du-fordern du-los-knopf" id="duLos" ${n ? "" : "disabled"}>${svg("bolt")} ${n ? `${esc(DU_TYPEN[typ].name)}-Duell gegen ${n === 1 ? esc(duAuswahl[0].name) : n + " Gegner"}` : `Gegner antippen (bis ${maxWahl})`}</button>
    ${n > 1 ? `<p class="small muted du-typ-info" style="margin:0">Du spielst einmal – jeder bekommt dieselben Fragen und ein eigenes Duell gegen dich.</p>` : ""}`}
  </div>`;
}
function duGegnerVerdrahten() {
  const neuZeichnen = () => { const box = $("duGegner"); if (!box) return; const alt = box.querySelector(".du-wahl"), top = alt ? alt.scrollTop : 0;
    box.outerHTML = duGegnerHtml(); duGegnerVerdrahten(); const w = $("duGegner") && $("duGegner").querySelector(".du-wahl"); if (w) w.scrollTop = top; };
  const f = $("duSuche"); if (f) f.oninput = () => { duSuche = f.value; const pos = f.selectionStart; neuZeichnen(); const g = $("duSuche"); g.focus(); try { g.setSelectionRange(pos, pos); } catch (e) {} };
  screen.querySelectorAll("[data-typ]").forEach(b => b.onclick = () => { SFX.tap(); S.duTyp = b.dataset.typ; save(); neuZeichnen(); });
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
  if (art === "quiz") { duSpiel.modus = "duell"; countdown(() => bibStart(duSpiel)); return; }
  countdown(() => { duSpiel.t0 = Date.now(); if (art === "blitz") duBlitzUhr(); duZeige(); });
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
    ${f.buch ? `<div class="du-frage-buch"><span class="qsub">Was kommt nach</span><b class="du-buch">${esc(f.buch)}</b>${f.gruppe ? `<span class="qsub">${esc(f.gruppe)}</span>` : ""}</div>`
      : `<h2 class="vl-frage">${f.frage}</h2><div class="vl-vers">${f.vers}</div>`}
    <div class="vl-wahl ${f.lang ? "" : "du-kurz"} ${f.buch ? "du-buecher" : ""}">${f.opts.map((o, j) => `<button class="vl-opt" data-o="${j}">${esc(o)}</button>`).join("")}</div>
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
      r => { if (r === "ende") { D.abgeschlossen = true; duSpiel = null; go("duelle"); } });
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
  let titel, zeile, tal = 0, sieg = false, fehler = false, weg = false;
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
      const q = D.gegnerErg.p; sieg = D.p > q;
      /* Fairplay: wer eine Herausforderung annimmt, bekommt immer etwas – dazu Sieg/Remis */
      if (!D.talGegeben) { D.talGegeben = true; tal = Math.round((DU_FAIR_TAL + (sieg ? DU_SIEG_TAL : D.p === q ? DU_REMIS_TAL : 0)) * (D.gleichF != null ? D.gleichF : 1)); if (sieg) S.duSiege = (S.duSiege || 0) + 1; save(); }
      titel = sieg ? "Gewonnen!" : D.p === q ? "Unentschieden!" : "Knapp vorbei!";
      zeile = sieg ? `Du hast ${esc(D.gegner)} besiegt.` : D.p === q ? "Genau gleich viele Punkte!" : `${esc(D.gegner)} war diesmal besser – fordere eine Revanche!`;
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
    <h1 class="sb-spaet${sieg ? "" : " leise"}">${titel}</h1><p class="muted sb-spaet">${zeile}${extra ? `<br><span class="small">${extra.replace(/^ · /, "")}</span>` : ""}</p>
    <div class="vle-werte sb-spaet"><div><b>+${xp}</b><span>XP</span></div>${tal ? `<div><b>+${tal}${TAL_MUENZE}</b><span>${tal > DU_FAIR_TAL ? "Talente" : "Fairplay"}</span></div>` : ""}</div>
    <div class="sb-spaet sb-knoepfe"><button class="btn ghost breit${sieg ? "" : " puls"}" id="duRevanche">${svg("bolt")} ${sieg ? "Nochmal duellieren" : "Revanche"}</button>
    <button class="btn primary breit" id="duFertig">${D.heim === "bib" ? "Zurück zu Biblionär" : "Zurück zur Arena"}</button></div></div>`;
    const wurzel = screen.querySelector(".sb-ende");
    /* XP/Level-Aufstieg erst nach der Auflösung, damit nichts das Ergebnis vorwegnimmt */
    sbStarten(wurzel, { gegner: D.gegner, du: { p: D.p, r: D.r, n }, er: D.gegnerErg, art: D.art }, s => { sbSchluss(wurzel, s); xpGeben(900); });
  } else
  screen.innerHTML = `<div class="vl vl-ende du-ende">
    <div class="vle-ic ${sieg ? "" : D.art === "quiz" ? "bib-ic" : "du"}">${svg(sieg ? "crown" : D.art === "quiz" ? "biblionaer" : "bolt")}</div>
    <h1>${titel}</h1><p class="muted">${zeile}</p>
    <div class="du-art-zeile">${duMarke({ art: D.art, k: D.k })}<span class="small muted">${esc(DU_TYPEN[typ].info)}</span></div>
    <div class="du-vs"><div class="du-vs-sp ${sieg ? "vorn" : ""}"><span>Du</span><b>${duP(D.p)}</b><small>${duErgText(D.art, ich)}${extra}</small></div><span class="du-vs-x">:</span>${gegnerSpalte}</div>
    <div class="vle-werte"><div><b>+${xp}</b><span>XP</span></div>${tal ? `<div><b>+${tal}${TAL_MUENZE}</b><span>${tal > DU_FAIR_TAL ? "Talente" : "Fairplay"}</span></div>` : ""}</div>
    ${fehler ? `<button class="btn primary breit" id="duNochmal">Nochmal senden</button>` : `<button class="btn primary breit" id="duFertig">${D.heim === "bib" ? "Zurück zu Biblionär" : "Zurück zur Arena"}</button>`}
    ${!D.neu && !fehler && !weg ? `<button class="btn ghost breit" id="duRevanche">${svg("bolt")} ${sieg ? "Nochmal duellieren" : "Revanche"}</button>` : ""}</div>`;
  if (!aufl && !fehler && !weg) SFX.coin(); /* Herausforderung gesendet: kleiner Ton, kein Sieg-Effekt */
  const weiter = () => { duSpiel = null; go(D.heim || "duelle"); };
  if ($("duFertig")) $("duFertig").onclick = () => { SFX.tap(); weiter(); };
  if ($("duNochmal")) $("duNochmal").onclick = () => { SFX.tap(); duEnde(); };
  if ($("duRevanche")) $("duRevanche").onclick = () => { SFX.tap(); duSpiel = null;
    if (D.heim === "bib") { go("bib"); bibRevanche({ id: D.vonPid, name: D.gegner }, !sieg); return; }
    go("duelle"); duTypWahl({ id: D.vonPid, name: D.gegner }, typ, !sieg); };
  if (!aufl) xpGeben(350);
}

/* ---------- „Wer wird Biblionär?“ (v6.40) ----------
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
  const titel = G.modus === "duell" ? `${G.weih ? "Weihnachts-Duell" : "Duell"} gegen ${esc(G.gegner)}` : G.modus === "woche" ? `Biblionär der Woche · ${weekKey().split("-W")[1]}. KW` : G.modus === "advent" ? `Weihnachts-Biblionär · ${advRundeName(G.adv)}` : G.weih ? "Weihnachts-Biblionär" : "Wer wird Biblionär?";
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
  /* Telefonjoker: erst Kontakt wählen (Willi oder Aaron), dann telefonieren – die Uhr steht dabei */
  function telefonJoker(b) {
    SFX.tap(); zeitPause();
    telefonWahl(id => {
      if (fertig || G.abgeschlossen) return;
      G.joker.tel = true; SFX.coin(); b.disabled = true;
      const w = pastorAntwort(f, G.halbBei === G.i, id);
      pastorAnruf(w, () => {
        G.hilfe = `<div class="bib-stelle bib-willi">${svg("telefon")}<span>${PASTOREN[id].kurz} tippt auf <b>${esc(w.tipp)}</b> · ${w.grad}</span></div>`;
        const h = $("bibHilfe"); if (h) h.innerHTML = G.hilfe;
        zeitWeiter();
      });
    }, () => zeitWeiter(), !!f.weih);
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
    modal(`<div class="label">Spiel abbrechen?</div><h2>Wer wird Biblionär?</h2><p class="muted">${text}</p><button class="btn primary" data-close="weiter">Weiterspielen</button><button class="btn ghost" data-close="ende">Abbrechen</button>`,
      r => { if (r !== "ende") return; fertig = true; G.abgeschlossen = true; clearTimers();
        if (G.modus === "duell") { duSpiel = null; go(G.heim || "duelle"); }
        else if (G.modus === "woche") { G.gewonnen = 0; G.fertigGrund = "abbruch"; bibErgebnis(G, 0); go("rank", "bibWoche"); }
        else if (G.modus === "advent") { G.gewonnen = 0; G.fertigGrund = "abbruch"; bibErgebnis(G, 0); go("advent"); }
        else go("bib"); });
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
      <button class="btn primary breit" id="bibRang">${svg("trophy")} Zur Wochen-Rangliste</button><button class="btn ghost breit" data-go="bib">Zurück zu Biblionär</button>`
      : `<button class="btn primary breit" id="bibNochmal">${svg("biblionaer")} Nochmal spielen</button><button class="btn ghost breit" data-go="bib">Zurück zu Biblionär</button>`}
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
  countdown(() => bibStart(G));
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
    countdown(() => bibStart(G));
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
ICONS.telefon = `<svg x="0" y="0" width="24" height="24" viewBox="0 0 64 64" overflow="visible" class="wr wr-lohn"><circle class="wr-halo" cx="32" cy="32" r="31" fill="url(#wrH_lohn)"/><ellipse cx="32" cy="61" rx="17" ry="2.2" fill="#000" opacity=".3"/><path d="M15 9.5c2.6-1.9 6.3-1.2 7.6 1.8l4.2 9.4c1.1 2.5.2 5.4-2.1 6.8l-3.4 2.1c2.8 6.4 7.4 11.1 13.6 14.1l2.2-3.3c1.5-2.2 4.4-3 6.8-1.9l9.3 4.3c3 1.4 3.6 5.2 1.6 7.7l-3.6 4.4c-2.8 3.4-7.6 4.6-11.7 2.9C26.5 52.6 15.6 41.8 10.4 28.7 8.8 24.6 10 19.9 13.4 17.1z" fill="url(#wrG)" stroke="#1b2a55" stroke-width="1.6" stroke-linejoin="round"/><path d="M14.6 14.2c-2.4 2.7-3 6.6-1.6 10" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none" opacity=".75"/><path d="M37 8.5a19 19 0 0 1 18.5 18.5M37 16a11.5 11.5 0 0 1 11 11" stroke="url(#wrX_lohn)" stroke-width="3.4" stroke-linecap="round" fill="none"/><path d="M37 8.5a19 19 0 0 1 18.5 18.5M37 16a11.5 11.5 0 0 1 11 11" stroke="#1b2a55" stroke-width=".8" stroke-linecap="round" fill="none" opacity=".5"/><path class="wr-spark" d="M54 42.5l1.49 4.01 4.01 1.49-4.01 1.49-1.49 4.01-1.49-4.01-4.01-1.49 4.01-1.49z" fill="#fff"/></svg>`;
/* ---------- Telefonjoker (6.42, ersetzt den Joker „Bibelstelle“) – Kontakt 1: Pastor Willi ----------
   Willi hat ein sehr gutes Bibelwissen, trägt Bart, ist verheiratet mit Heidi (geboren in Iowa, USA), hat zwei Töchter.
   Willi hat in den USA am Faith Baptist Bible College (Iowa) Theologie studiert und dort Heidi kennengelernt;
   nach dem Studium kamen beide als Missionare nach Deutschland. Er
   und grillt am liebsten Fleisch – Gemüse mag er nicht so. Seine Antwort hängt nur vom Startwert der Frage ab
   (und ob 50:50 schon genommen wurde): Im Duell und in der Wochenrunde sagt er allen dasselbe.
   Bei leichten Fragen liegt er fast immer richtig, bei schweren ist er manchmal unsicher oder irrt sich. */
const WILLI_HALLO = [
  "Griaß di, hier Willi! Ah, „Wer wird Biblionär?“ – na, dann lies mal vor …",
  "Servus, Willi hier – Moment, ich leg nur schnell die Grillzange weg … So, schieß los!",
  "Griaß di, Pastor Willi am Apparat! Du hast Glück, die Steaks brauchen noch fünf Minuten.",
  "Servus! Heidi, mach mal die Musik leiser, das ist wichtig! … Also, wie lautet die Frage?",
  "Griaß di, Willi hier! Ich hab gerade 1.500 Teile Himmel gepuzzelt – nur blau. Da ist eine Bibelfrage die reinste Erholung.",
  "Servus, hier Willi! Du hast Glück, mein Brotteig muss eh noch eine Stunde gehen.",
  "Griaß di, Pastor Willi! Moment, Heidi wollte rangehen – sie dachte, ihre Mutter ruft aus Iowa an.",
  "Servus, Willi am Apparat – ich stehe mit Mehl bis zu den Ellbogen in der Küche. Leg los!",
  "Griaß di, hier Willi! Ich hab das Handy gerade mit der Grillzange angenommen. Geht erstaunlich gut.",
  "Servus! Ah, du bist das! Heidi hat schon gesagt: „Der ruft bestimmt wegen Biblionär an.“ Frauen wissen so was.",
  "Griaß di, Willi hier – ich sitze gerade über der Predigt für Sonntag. Eine kleine Pause kommt mir sehr recht.",
  "Servus, Willi am Telefon! Ich stehe beim Metzger in der Schlange, aber für dich trete ich kurz zur Seite.",
  "Griaß di, Pastor Willi! Kurz warten, ich wisch mir nur den Bart ab – es gab Spaghetti. Ohne Gemüsesoße, versteht sich.",
  "Servus, hier Willi! Die Mädels haben gerade den Hörer abgenommen und „Papa, Biblionär!“ gerufen. Ich bin ganz Ohr.",
  "Griaß di, Pastor Willi – oder wie wir damals am Bible College in Iowa gesagt haben: Hi there! Was gibt's?",
  "Servus, Willi hier! Heidi telefoniert gerade mit ihrer Familie in Iowa – gut, dass ich das zweite Handy hab. Schieß los!",
  "Griaß di, Willi hier – Moment, ich leg nur schnell die Gitarre weg … So, jetzt bin ich ganz Ohr.",
  "Servus, Pastor Willi! Hörst du die Musik im Hintergrund? Musikteam-Probe. Ich geh kurz raus – die schaffen das Lied auch ohne mich. Hoffentlich.",
  "Griaß di, Willi am Apparat! Ich hab mich gerade frisch parfümiert. Riechst du das nicht durchs Telefon? Schade – Heidi sagt, im Treppenhaus schon.",
  "Servus, Willi hier! Heidi und ich stehen gerade vor dem Kleiderschrank und stimmen die Farben für Sonntag ab. Du rettest mich – leg los!",
  "Griaß di, hier Willi! Ich packe schon mal gedanklich die Koffer für Amerika. Das Parfüm ist drin – das Wichtigste also. Schieß los!",
  "Servus, hier Willi! Ich sitze an der Predigt – da ist eine Bibelfrage wie Nachtisch. Her damit!",
  "Griaß di, Willi hier – ich erkläre gerade einem Vegetarier, dass Holzkohle eigentlich auch pflanzlich ist. Gutes Timing, rette mich!",
  "Servus, Pastor Willi am Apparat! Heidi fragt gerade, ob mein Hemd zu ihrem Kleid passt. Natürlich passt es – wir passen ja auch zusammen. Also, die Frage?"
];
const WILLI_SICHER = [
  x => `Da muss ich nicht lange überlegen: ${x.X}. Das steht in ${x.ref}.`,
  x => `Das ist ganz klar ${x.X} – lies mal ${x.ref} nach.`,
  x => `${x.X}! Da bin ich mir sicherer als bei der Frage, ob Rosenkohl schmeckt. Steht in ${x.ref}.`,
  x => `${x.X}. So sicher wie das Amen in der Kirche – steht in ${x.ref}.`,
  x => `Ha, die kenne ich! ${x.X}. Schlag ${x.ref} auf, da steht's schwarz auf weiß.`,
  x => `${x.X} – dafür würde ich meine Grillzange verwetten. Na gut, wetten tun wir nicht. Aber es steht in ${x.ref}.`,
  x => `Ganz klar ${x.X}. Über ${x.ref} hab ich schon gepredigt – da sitzt jedes Wort.`,
  x => `Das ist ${x.X}! Meine Töchter wüssten das auch – ${x.ref} haben wir beim Abendessen gelesen.`,
  x => `Einfach: ${x.X}. Wer ${x.ref} einmal gelesen hat, vergisst das nicht mehr.`,
  x => `${x.X} – das haben wir schon am Bible College in Iowa gelernt. Lies ${x.ref} nach.`,
  x => `${x.X}! Das sitzt bei mir wie ein G-Dur-Akkord. Steht in ${x.ref}.`,
  x => `Ganz klar ${x.X} – darüber hab ich sogar schon in einer Gemeinde in Amerika gepredigt. Lies ${x.ref}.`,
  x => `${x.X}. So sicher, wie Heidi und ich am Sonntag farblich zusammenpassen. Steht in ${x.ref}.`,
  x => `${x.X}! Dafür muss ich nicht mal die Gitarre stimmen, so klar ist das. Lies ${x.ref} nach.`,
  x => `Das ist ${x.X}! Über ${x.ref} könnte ich dir jetzt eine Predigt mit drei Punkten halten – aber du hast ja nur 30 Sekunden.`
];
/* Antwortsätze, wenn die „Bibelstelle“ keine echte Versangabe ist (Bibelkunde, z. B. „Die Paulusbriefe“) – 6.53 */
const WILLI_SICHER_OHNE = [
  x => `${x.X}. Das weiß ich so sicher wie das Amen in der Kirche.`,
  x => `Ha, die kenne ich! ${x.X}. Die Bibelbücher kann ich im Schlaf – Heidi sagt, manchmal tatsächlich.`,
  x => `Ganz klar ${x.X}. Das haben meine Töchter mit dem Lied aus eurer App gelernt – und ich gleich mit.`,
  x => `${x.X} – da bin ich mir sicherer als bei der Frage, ob Rosenkohl schmeckt.`,
  x => `${x.X} – so klar wie ein frisch gestimmter Gitarrenakkord.`,
  x => `Ganz klar ${x.X}. Da bin ich sicherer als ein Vegetarier am Salatbuffet.`
];
const WILLI_ZIEMLICH_OHNE = [
  x => `Ich bin ziemlich sicher: ${x.X}. Aber zähl lieber nochmal nach.`,
  x => `Hm … ${x.X}, würde ich sagen. Mein Puzzle-Gedächtnis sagt jedenfalls ja.`,
  x => `Ziemlich sicher ${x.X}. Klingt jedenfalls stimmig – und als Musikteamleiter hör ich so was.`
];
const WILLI_ZIEMLICH = [
  x => `Ich bin mir ziemlich sicher, dass es ${x.X} ist. Wenn ich mich recht erinnere, steht das in ${x.ref}.`,
  x => `Hm … ich sage ${x.X}. Ich glaube, das steht in ${x.ref} – schau aber lieber nochmal genau hin.`,
  x => `Ich würde ${x.X} sagen. Das müsste in ${x.ref} stehen – meine Bibel liegt leider gerade im Auto.`,
  x => `Ziemlich sicher ${x.X}. Ich meine, das ist ${x.ref} – Heidi nickt jedenfalls.`,
  x => `Ich denke ${x.X}, so zu neunzig Prozent. Steht wohl in ${x.ref}. Die restlichen zehn Prozent hat der Grillrauch vernebelt.`,
  x => `Mein Gefühl sagt ${x.X} – und ${x.ref} bestätigt das, wenn ich mich recht erinnere.`,
  x => `Ich tippe auf ${x.X}. Müsste ${x.ref} sein – meine Bibel steckt gerade im Gitarrenkoffer.`,
  x => `Ziemlich sicher ${x.X}, ich meine ${x.ref}. Heidi nickt – und sie trägt heute dieselbe Farbe wie ich, das zählt doppelt.`
];
const WILLI_SCHWANK = [
  x => `Puh, das ist knifflig. Ich schwanke zwischen ${x.X} und ${x.Y} … ich würde ${x.X} nehmen, aber ganz sicher bin ich nicht.`,
  x => `Ich streich mir gerade nachdenklich durch den Bart … ${x.X} oder ${x.Y}? Ich tendiere zu ${x.X}.`,
  x => `Hmm … ${x.X} oder ${x.Y}? Das ist schwerer als die Wahl zwischen Bratwurst und Rippchen. Ich sag ${x.X}, aber ohne Garantie.`,
  x => `Jetzt erwischst du mich auf dem falschen Fuß. Ich meine ${x.X}, aber ${x.Y} lässt mich nicht ganz los.`,
  x => `Heidi sagt ${x.Y}, ich sage ${x.X}. Und meistens hat Heidi recht … hm. Ich bleib trotzdem bei ${x.X}.`,
  x => `Ich krame in meinem Gedächtnis … ${x.X}? Oder doch ${x.Y}? Ich nehme ${x.X} – aber prüf es lieber selbst.`,
  x => `${x.X} oder ${x.Y}? Das ist so schwer wie die Frage, ob Heidi am Sonntag Blau oder Türkis trägt. Ich leg mich auf ${x.X} fest – mit Bauchweh.`,
  x => `Ich zupfe nachdenklich an der Gitarre … ${x.X}? ${x.Y} klingt aber auch nicht schief. Ich nehme ${x.X}, ohne Gewähr.`,
  x => `Das ist wie ein Akkord mit einem falschen Ton: ${x.X} oder ${x.Y}? Ich sag ${x.X} – aber hör lieber nochmal genau hin.`
];
const WILLI_GERATEN = [
  x => `Oje, da bin ich überfragt. Aus dem Bauch heraus würde ich ${x.X} sagen – aber verlass dich nicht drauf!`,
  x => `Ehrlich gesagt weiß ich es nicht genau. Vielleicht ${x.X}? Das musst du am Ende selbst entscheiden.`,
  x => `Da muss ich passen – das hab ich im Bibelunterricht wohl verträumt. Ich rate mal ${x.X}.`,
  x => `Puh, keine Ahnung. Eine meiner Töchter ruft gerade ${x.X} – mehr hab ich leider nicht.`,
  x => `Ich stochere im Nebel wie im Grillrauch. Vielleicht ${x.X}? Hör lieber auf dein Herz.`,
  x => `Ehrlich: Das ist ein Puzzleteil, das mir fehlt. Ich sag mal ${x.X}, aber das ist geraten.`,
  x => `Da bin ich so ratlos wie ein Vegetarier vor dem Grill. Ich rate ${x.X}.`,
  x => `Puh, da bin ich verstimmt wie meine Gitarre nach dem Flug aus Amerika. Vielleicht ${x.X}?`,
  x => `Ehrlich? Keine Ahnung. Heidi ist gerade nicht da – und ohne sie fehlt mir die Hälfte, nicht nur farblich. Ich rate ${x.X}.`
];
/* Bezüge zur Frage: [Suchmuster über Frage, Antwort, Bibelstelle und Thema, Satz] */
const WILLI_THEMA = [
  [/Esau|Isaak|Jakob(?!us)|Linsen/, "Isaak hatte Esau lieb, weil er so gern von seinem Wildbret aß (1. Mose 25,28) – ein Mann nach meinem Geschmack! Dass Esau dann alles für ein Linsengericht hergab, verstehe ich bis heute nicht."],
  [/Daniel|Nebukadnezar|Löwengrube|Belsazar/, "Daniel hat zehn Tage lang nur Gemüse gegessen und sah danach besser aus als alle anderen (Daniel 1,12-15). Heidi hält mir den Vers bei jedem Grillabend unter die Nase …"],
  [/Manna|Wachtel|Wüste|Sinai/, "In der Wüste gab es abends Wachteln (2. Mose 16,13) – der Herr weiß eben, was ein hungriger Mann braucht!"],
  [/Passah|Pharao|Plage|Lamm/, "Das Passahlamm sollte am Feuer gebraten werden, nicht gekocht (2. Mose 12,8-9). Ich sag ja immer: Grillen ist biblisch!"],
  [/verlorene|gemästet|Lukas 15/, "Als der verlorene Sohn heimkam, ließ der Vater das gemästete Kalb schlachten (Lukas 15,23). Das nenne ich ein Fest!"],
  [/Abraham|Abram|Sara\b|Mamre/, "Abraham hat für seine drei Besucher ein zartes, gutes Kalb zubereiten lassen (1. Mose 18,7). Gastfreundschaft mit Fleisch – so gehört sich das."],
  [/(?<!\d\. )Petrus|Kornelius/, "Mein Lieblingsvers für den Grillabend: „Steh auf, Petrus, schlachte und iss!“ (Apostelgeschichte 10,13)."],
  [/Elia|Rabe|Karmel|Isebel|Ahab/, "Die Raben brachten Elia morgens und abends Brot und Fleisch (1. Könige 17,6) – von Salat steht da nichts."],
  [/Fisch|Genezareth|Brote|5000|fünftausend|Netz|Fischer/, "Der Herr Jesus selbst hat am See ein Kohlenfeuer gemacht und Fisch darauf gelegt (Johannes 21,9). Grillen am Ufer – herrlich!"],
  [/Römer|Paulus|Saulus|Korinth|Galater|Epheser|Philipper|Timotheus/, "Paulus schreibt: Der Schwache isst Gemüse (Römer 14,2). Ich will ja niemanden richten – aber ich nehme lieber noch ein Würstchen."],
  [/Noah|Arche|Sintflut|Regenbogen/, "Nach der Sintflut hat Gott Noah erlaubt, auch Fleisch zu essen (1. Mose 9,3). Seitdem bin ich Noah sehr dankbar!"],
  [/Täufer|Heuschreck/, "Johannes der Täufer aß Heuschrecken und wilden Honig (Matthäus 3,4). Heuschrecken vom Grill hab ich noch nicht probiert – meine Töchter würden schreiend weglaufen."],
  [/Gideon/, "Gideon hat für den Engel des Herrn ein Ziegenböcklein zubereitet (Richter 6,19). Gute Wahl, Gideon!"],
  [/Simson|Delila|Philister|Löwe/, "Simson fand Honig im Kadaver des Löwen (Richter 14,8-9) – also, nicht jedes Fleischgericht in der Bibel ist zu empfehlen."],
  [/Salomo|Sprüche|Weisheit/, "Salomo schreibt sinngemäß: Lieber ein Gemüsegericht mit Liebe als ein gemästeter Ochse mit Hass (Sprüche 15,17). Den Vers zitiert Heidi besonders gern, wenn ich am Grill brumme."],
  [/Kana\b|Hochzeit|Wasser zu Wein/, "Bei der Hochzeit zu Kana hat der Herr Jesus sein erstes Zeichen getan (Johannes 2,11). Was es dazu zu essen gab, steht nicht drin – ich tippe auf ein ordentliches Festmahl!"],
  [/David|Goliath|Hirte|Schaf/, "David hat als Hirte seine Schafe vor Löwe und Bär beschützt (1. Samuel 17,34-35). Ich beschütze am Grill meine Würstchen vor meinen Töchtern – fast genauso mutig."],
  [/Jona\b|Ninive/, "Jona war drei Tage im Bauch des Fisches (Jona 2,1). Der einzige Fisch in der Bibel, den ich nicht grillen würde!"],
  [/Brot|Bäcker|ungesäuert|Abendmahl|Gerste/, "Ich backe ja selbst Brot – am liebsten Sauerteig, frisch aus dem Ofen. Und der Herr Jesus sagt: Ich bin das Brot des Lebens (Johannes 6,35). Davon wird man richtig satt."],
  [/Brot|Bäcker|Körbe/, "Brot backen ist wie Glauben: Es braucht Zeit, Wärme und Geduld. Und am Ende teilt man es – wie der Herr Jesus bei der Speisung, als sogar zwölf Körbe übrig blieben (Johannes 6,13)."],
  [/Hesekiel|Dinkel/, "Das Brot aus Hesekiel 4,9 – Weizen, Gerste, Bohnen, Linsen, Hirse, Dinkel – hab ich tatsächlich mal nachgebacken. Heidi meinte: Endlich mal Gemüse, das du freiwillig isst!"],
  [/Schaubrot/, "Zwölf Schaubrote, für jeden Stamm eins (3. Mose 24,5-6). So viele schaffe ich in meinem Ofen nicht auf einmal – aber ich arbeite dran."],
  [/Ahija|Mantel|Stücke|\bLeib\b|Glieder/, "Ich puzzle leidenschaftlich gern. Ahija hat einen Mantel in zwölf Stücke gerissen (1. Könige 11,30) – ein Puzzle mit Bedeutung! Und die Gemeinde ist genauso: viele Teile, ein Leib (1. Korinther 12,12)."],
  [/Mauer|Nehemia/, "Nehemia hat die Mauer Stück für Stück in 52 Tagen wieder aufgebaut (Nehemia 6,15) – wie ein riesiges Puzzle. Da hätte ich gern mitgemacht."],
  [/Esra|vorlesen|vorlas|Chronik seiner|Kämmerer|Synagoge/, "Heidi liest für ihr Leben gern, bei uns stapeln sich die Bücher. Aber dass Esra dem Volk vom Morgen bis zum Mittag vorgelesen hat (Nehemia 8,3) – das schafft nicht mal sie."],
  [/Jojakim/, "König Jojakim hat Jeremias Buchrolle ins Feuer geworfen (Jeremia 36,23). Heidi war beim Lesen richtig empört. Ich auch – ein Kohlenfeuer ist schließlich für Steaks da!"],
  [/Psalm|Hirte\b|Hirsch|Baum an Wasser/, "Psalm 23 sagt: Du bereitest vor mir einen Tisch (Psalm 23,5). Ich stelle mir da immer einen gut gedeckten Grilltisch vor."],
  [/Hirsch|lechzt/, "Wie der Hirsch nach Wasser lechzt, so lechzt meine Seele nach Gott (Psalm 42,2). Mein Magen lechzt eher nach Mittagessen – aber der ist ja auch nicht so geistlich."],
  [/Ameise|Faule/, "Geh zur Ameise, du Fauler (Sprüche 6,6)! Heidi zitiert das immer, wenn ich nach dem Grillen auf dem Sofa einschlafe."],
  [/tüchtige Frau|Lemuel|Sprüche 31/, "Sprüche 31 lobt die tüchtige Frau – Heidi hat das Kapitel bei uns an den Kühlschrank gehängt. Mit Leuchtmarker."],
  [/Salomo|Sprüche 1|Furcht des HERRN/, "Die Furcht des HERRN ist der Anfang der Erkenntnis (Sprüche 1,7). Der Anfang einer guten Mahlzeit ist übrigens ein frisch gebackenes Brot."],
  [/Prediger|seine Zeit|nichtig/, "Alles hat seine Zeit (Prediger 3,1) – auch der Brotteig. Wer ihn zu früh in den Ofen schiebt, backt einen Ziegelstein."],
  [/Hiob|Uz|Elihu/, "Hiob hat alles verloren und Gott trotzdem gelobt. Ich verliere schon die Geduld, wenn meinem Puzzle ein Teil fehlt."],
  [/Hohelied|Braut|stark wie der Tod/, "Das Hohelied lese ich Heidi manchmal vor. Sonst liest ja immer sie mir vor – ausgleichende Gerechtigkeit!"],
  [/Bathseba|Psalm 51/, "Nach seiner Schuld betete David: Schaffe mir, o Gott, ein reines Herz (Psalm 51,12). Den Vers bete ich auch – meistens nach dem dritten Würstchen."],
  [/Berge|Psalm 121/, "Meine Hilfe kommt vom HERRN (Psalm 121,2) – nicht von den Bergen. Und schon gar nicht vom Grillanzünder, der klappt bei mir nie."],
  [/Seraph|glühende/, "Eine glühende Kohle vom Altar (Jesaja 6,6) – ich hätte sie ja unter den Rost gelegt. Jesaja war da eindeutig geistlicher als ich."],
  [/Friedefürst|Jesaja 9/, "Friedefürst (Jesaja 9,5) – den Frieden bräuchten wir bei uns zu Hause, wenn es um die Frage Steak oder Gemüsespieß geht."],
  [/Adler/, "Auffahren mit Flügeln wie Adler (Jesaja 40,31) – ich bin eher wie ein Brathähnchen: fliegt nicht, aber macht glücklich."],
  [/Scharlach|Schnee/, "Rot wie Scharlach, weiß wie Schnee (Jesaja 1,18) – so gründlich vergibt Gott. Meine Grillschürze bekommt Heidi leider nie so sauber."],
  [/Jeremia|zu jung|Töpfer/, "Gott ist der Töpfer und wir sind der Ton (Jeremia 18,6). Beim Brotteig kneten fühle ich mich ihm ein kleines bisschen nahe."],
  [/Klagelieder|Barmherzigkeit/, "Gottes Barmherzigkeit ist jeden Morgen neu (Klagelieder 3,23) – wie frisches Brot aus dem Ofen. Nur noch viel besser."],
  [/neues Herz/, "Ein neues Herz von Gott (Hesekiel 36,26) – das ist besser als jedes Rinderherz vom Metzger. Okay, das war ein schlechter Vergleich."],
  [/Kebar/, "Am Fluss Kebar hatte Hesekiel gewaltige Visionen (Hesekiel 1). Ich hab am Fluss meistens nur die Vision von gegrilltem Fisch."],
  [/Mene|Belsazar/, "Mene, mene, tekel (Daniel 5,25) – gewogen und zu leicht befunden. Das passiert mir auf der Waage nach Weihnachten nie."],
  [/Micha\b|Bethlehem/, "Bethlehem heißt übersetzt „Brothaus“ – kein Wunder, dass das meine Lieblingsstadt in der Bibel ist!"],
  [/Hosea|Gomer/, "Hosea hielt seiner Frau Gomer die Treue – so treu ist Gott zu uns. Heidi und ich streiten zum Glück nur über Gemüse."],
  [/Joel|Heuschreck/, "Heuschrecken fressen alles kahl (Joel 1,4) – wie meine Töchter, wenn ich frisches Brot aus dem Ofen hole."],
  [/alles Fleisch|Joel 3/, "Gott gießt seinen Geist aus über alles Fleisch (Joel 3,1) – bei dem Wort „Fleisch“ höre ich als Grillmeister immer besonders gut zu."],
  [/Amos|Maulbeer/, "Amos war Hirte und Maulbeerfeigenzüchter (Amos 7,14) – also eigentlich Obstbauer. Gott beruft sogar Obstleute. Das gibt mir zu denken."],
  [/wie Wasser|Amos 5/, "Das Recht soll strömen wie Wasser (Amos 5,24). Bei uns strömt am Gemeindefest vor allem Apfelschorle."],
  [/Obadja|Edom/, "Obadja hat nur ein einziges Kapitel – das lese ich, während der Grill vorheizt. Edom war übrigens das Land von Esau, dem Wildbret-Liebhaber."],
  [/demütig|Micha 6/, "Recht tun, Liebe üben, demütig sein (Micha 6,8). Am Grill demütig zu sein fällt mir am schwersten."],
  [/Habakuk|Glauben leben/, "Der Gerechte wird durch seinen Glauben leben (Habakuk 2,4) – nicht vom Brot allein. Obwohl Brot schon sehr hilft."],
  [/Zephanja|Tag des HERRN/, "Der Tag des HERRN ist nahe (Zephanja 1,14). Mein Lieblingstag bleibt bis dahin der Sonntag: erst Gottesdienst, dann Grillen."],
  [/Haggai|Tempel wieder/, "Haggai rief: Baut das Haus Gottes (Haggai 1,8)! Bauen ist wie Puzzeln – nur mit schwereren Teilen."],
  [/Esel\b|Sacharja/, "Der König kommt demütig auf einem Esel (Sacharja 9,9). Ich wäre mit dem Grillwagen gekommen – darum bin ich auch nicht der König."],
  [/Zehnten|Vorratshaus/, "Bringt den ganzen Zehnten ins Vorratshaus (Maleachi 3,10). Heidi hat gefragt, ob das auch für meine Würstchen gilt."],
  [/Maleachi 3,23|Elia/, "Gott kündigt den Propheten Elia an (Maleachi 3,23). Elia hat in der Wüste übrigens ein auf heißen Steinen gebackenes Brot vom Engel bekommen (1. Könige 19,6) – himmlisches Backhandwerk!"],
  [/Sold der Sünde|Gnadengabe|Römer 6/, "Der Sold der Sünde ist der Tod, aber Gottes Gnadengabe ist das ewige Leben (Römer 6,23). Geschenkt – wie die letzte Bratwurst, die ich dir überlasse."],
  [/scheiden|Römer 8/, "Nichts kann uns von Gottes Liebe trennen (Römer 8,39) – nicht mal ein Puzzle, bei dem das letzte Randstück fehlt."],
  [/Liebe|1. Korinther 13/, "Die Liebe ist langmütig (1. Korinther 13,4). Heidi braucht das, wenn ich mir zum dritten Mal Nachschlag hole."],
  [/500|1. Korinther 15/, "Über 500 Brüder sahen den Auferstandenen auf einmal (1. Korinther 15,6). So viele Leute kriege ich nicht mal beim Gemeindefest satt."],
  [/neue Schöpfung/, "Eine neue Schöpfung in Christus (2. Korinther 5,17) – wie aus Mehl und Wasser ein Brot wird. Nur unendlich wunderbarer."],
  [/Pfahl/, "Paulus hatte einen Pfahl ins Fleisch (2. Korinther 12,7). Ich hatte mal eine Gräte im Fisch – ich weiß, das ist nicht dasselbe."],
  [/Frucht des Geistes|Galater/, "Die Frucht des Geistes (Galater 5,22) – Früchte sind das einzige Grünzeug, das ich wirklich mag. Diese hier ganz besonders."],
  [/Gnade|Epheser 2/, "Aus Gnade gerettet, nicht aus Werken (Epheser 2,8–9) – sonst hätte ich mit meinen Grillkünsten ja einen unfairen Vorteil."],
  [/Waffenrüstung|Schwert des Geistes/, "Die Waffenrüstung Gottes kennst du ja aus unserer App! Ich hätte noch die Grillzange des Glaubens dazugelegt."],
  [/Freut euch|Gefängnis/, "Paulus schreibt aus dem Gefängnis: Freut euch allezeit (Philipper 4,4)! Ich freu mich schon, wenn der Grill anspringt."],
  [/Kolosser|von Herzen/, "Alles, was ihr tut, tut von Herzen (Kolosser 3,23) – auch das Wenden der Würstchen. Vor allem das!"],
  [/Unterlass|Beten/, "Betet ohne Unterlass (1. Thessalonicher 5,17) – ich bete sogar, wenn der Grill nicht angehen will. Gerade dann."],
  [/nicht arbeiten|nicht essen/, "Wer nicht arbeiten will, soll auch nicht essen (2. Thessalonicher 3,10). Darum helfe ich beim Grillen immer mit – zumindest beim Probieren."],
  [/Jugend|Timotheus 4/, "Niemand verachte dich wegen deiner Jugend (1. Timotheus 4,12) – das sage ich meinen Töchtern, wenn sie mich beim Bibelquiz schlagen."],
  [/Lois|Großmutter/, "Lois, die Großmutter des Timotheus, hatte einen echten Glauben (2. Timotheus 1,5). Heidi liest unseren Töchtern jeden Abend aus der Bibel vor – so fängt das an!"],
  [/Kreta|Titus/, "Paulus ließ Titus auf Kreta zurück (Titus 1,5). Schöne Insel – das Lamm vom Grill soll dort hervorragend sein, hab ich gehört."],
  [/Onesimus|Philemon/, "Onesimus heißt „der Nützliche“ (Philemon 11). Wenn ich am Grill stehe, darfst du mich gern auch so nennen."],
  [/Zuversicht|Hebräer 11/, "Glaube ist eine feste Zuversicht (Hebräer 11,1) – wie meine Zuversicht, dass der Brotteig über Nacht aufgeht."],
  [/Melchisedek/, "Melchisedek kam Abraham mit Brot entgegen und segnete ihn (1. Mose 14,18-19) – ein Mann ganz nach meinem Herzen!"],
  [/gestern, heute/, "Jesus Christus ist derselbe gestern, heute und in Ewigkeit (Hebräer 13,8) – zuverlässiger als mein bestes Sauerteig-Rezept."],
  [/Jakobus 3|Zunge/, "Die Zunge ist ein kleines Feuer (Jakobus 3,5) – als Grillmeister weiß ich: kleines Feuer, große Wirkung."],
  [/tausend Jahre/, "Ein Tag ist wie tausend Jahre (2. Petrus 3,8) – so fühlt es sich an, wenn der Brotteig gehen muss."],
  [/Gott ist|1. Johannes|vergibt/, "Gott ist Liebe (1. Johannes 4,8) – und wenn wir unsere Sünden bekennen, vergibt er (1. Johannes 1,9). Sogar die mit dem heimlich gegessenen Würstchen."],
  [/Gajus|auserwählte Frau|2. Johannes|3. Johannes/, "Die kleinen Johannesbriefe sind kurz, weil Johannes lieber persönlich kommen wollte (2. Johannes 12). Geht mir genauso – am liebsten zum Grillabend."],
  [/Michael|Judas 9/, "Der Judasbrief hat nur 25 Verse – wie ein Puzzle mit 25 Teilen. Und mittendrin der Erzengel Michael!"],
  [/Offenbarung|Laodizea|Sendschreiben/, "Laodizea war weder kalt noch warm (Offenbarung 3,16). Lauwarmes Essen mag ich auch nicht – das Steak muss heiß sein und der Glaube auch!"],
  [/klopft|vor der Tür/, "Jesus steht vor der Tür und klopft an und will mit uns Mahl halten (Offenbarung 3,20). Bei mir gibt's dann frisches Brot!"],
  [/A und das O/, "Jesus ist das A und das O (Offenbarung 22,13). Bei mir gibt's beim perfekten Steak auch immer ein „Ah“ und ein „Oh“."],
  [/Tränen|Perlen|neue Jerusalem/, "Im neuen Jerusalem gibt es keine Tränen mehr (Offenbarung 21,4). Ich hoffe ganz leise: auch keinen Rosenkohl."],
  [/Nächsten/, "Liebe deinen Nächsten wie dich selbst (3. Mose 19,18) – darum bekommt mein Nachbar beim Grillen immer das zweitbeste Steak. Na gut: das beste."],
  [/Versöhnungstag|Bock/, "Am Versöhnungstag ging ein Bock in die Wüste (3. Mose 16,10). Heidi sagt, ich soll bei solchen Versen nicht immer gleich ans Grillen denken."],
  [/Höre, Israel|einschärfen|5. Mose 6/, "Höre, Israel (5. Mose 6,4)! Bei uns zu Hause heißt es eher: Höre, Willi – das Essen ist fertig!"],
  [/Jabez/, "Jabez bat Gott: Erweitere mein Gebiet (1. Chronik 4,10). Das bete ich jedes Mal, wenn ich einen größeren Grill kaufen will."],
  [/Blut vergossen|1. Chronik 22/, "David durfte den Tempel nicht bauen, aber er hat alles dafür vorbereitet (1. Chronik 22,5) – wie ich, wenn ich am Vorabend den Sauerteig ansetze, damit morgens gebacken werden kann."],
  [/Einweihung|2. Chronik 7/, "Bei Salomos Tempelweihe fiel Feuer vom Himmel (2. Chronik 7,1). Die schnellste Grillglut aller Zeiten!"],
  [/Schriftgelehrter/, "Esra war Schriftgelehrter – ein echter Bücherwurm. Heidi wäre mit ihm sofort ins Gespräch gekommen."],
  [/Leopard|Böcklein/, "Der Leopard lagert beim Böcklein (Jesaja 11,6) – im Friedensreich ist sogar das Böcklein sicher. Vor mir am Grill hoffentlich auch."],
  [/Mundschenk|Bäcker/, "Josef hat den Traum des obersten Bäckers gedeutet (1. Mose 40,16-19) – für den ging es leider nicht gut aus. Seitdem backe ich nur noch mit Gebet."],
  [/Rut|Boas|Ähren|Noomi/, "Boas lud Rut ein, ihren Bissen in den Essig zu tauchen (Rut 2,14) – ein echter Gastgeber! Ich hätte ihr noch eine Bratwurst angeboten."],
  [/Martha|Bethanien|Schwester des Lazarus/, "Martha hat sich mit dem Essen abgemüht, Maria saß zu Jesu Füßen (Lukas 10,39-42). Ich bin ehrlich gesagt eher Martha – vor allem am Grill."],
  [/Emmaus/, "Die Emmausjünger erkannten Jesus, als er das Brot brach (Lukas 24,30-31). Seitdem ist Brot brechen für mich etwas ganz Besonderes."],
  [/Dornbusch|Horeb/, "Der Dornbusch brannte und verbrannte doch nicht (2. Mose 3,2). Das wünsche ich mir manchmal für meine Würstchen."],
  [/Witwe|Zarpat|Mehl/, "Bei der Witwe in Zarpat ging das Mehl im Topf nicht aus (1. Könige 17,16). Mein Sauerteig heißt deshalb „Elia“."],
  [/Staub von der Erde|1\. Mose 2,7/, "Gott hat den Menschen aus Staub geformt und ihm den Odem des Lebens eingehaucht (1. Mose 2,7). Ich forme Brotteig – das mit dem Leben einhauchen überlasse ich lieber dem Sauerteig."],
  [/Rippe|erste Frau/, "Gott hat die Frau aus einer Rippe gebaut (1. Mose 2,22). Bei Rippchen werde ich ja schwach – aber Heidi sagt, das ist kein theologisches Argument."],
  [/verführte Eva|Die Schlange/, "Die Schlange war listiger als alle Tiere des Feldes (1. Mose 3,1). Und gegessen wurde dann – Obst! Ich sag ja: Obst und Gemüse bringen nur Ärger."],
  [/Feigenbl/, "Schurze aus Feigenblättern (1. Mose 3,7) – die erste Schürze der Welt! Meine Grillschürze ist zum Glück etwas stabiler."],
  [/Cherub/, "Cherubim mit einem flammenden Schwert (1. Mose 3,24) – da wäre sogar mein Grillanzünder neidisch."],
  [/Abel|Kain/, "Abel war Schafhirte, Kain Ackerbauer. Gott sah Abels Opfer gnädig an – aber Achtung, Fleischfreunde: Es ging um den Glauben, nicht ums Menü (Hebräer 11,4)."],
  [/Jubal|Harfen- und Flöten/, "Jubal war der Vater aller Flötenspieler (1. Mose 4,21). Heidi hat mal versucht, mir Blockflöte beizubringen. Ich bin dann lieber zurück zum Grill."],
  [/300 Ellen|Wasser der Sintflut/, "Die Arche war 300 Ellen lang (1. Mose 6,15) – ungefähr anderthalb Fußballfelder. Da hätte sogar ein richtig großer Grill draufgepasst."],
  [/Raben\b.*Arche|als ersten aus der Arche/, "Noah schickte erst einen Raben, dann eine Taube (1. Mose 8,7-8). Der Rabe kam nicht zurück – wahrscheinlich hat er irgendwo ein Grillfest gefunden."],
  [/Vater Noahs|Lamech/, "Lamech nannte seinen Sohn Noah, weil er Trost erhoffte (1. Mose 5,29). Ich hätte meine Töchter auch „Trost“ nennen können – beim ersten Zahn eher nicht."],
  [/Sprache der Menschen|verwirrte Gott/, "In Babel verwirrte Gott die Sprache (1. Mose 11,7). Seitdem versteht ein Ingolstädter nicht jeden Eichstätter. Kleiner Scherz – fast."],
  [/Sterne am Himmel/, "Abraham sollte die Sterne zählen (1. Mose 15,5). Ich zähle lieber Puzzleteile – da weiß man wenigstens, wann man fertig ist."],
  [/Widder|Isaak opfern|Land Morija/, "Gott hat selbst einen Widder bereitgestellt (1. Mose 22,13). „Der HERR wird ersehen“ – und Jahrhunderte später hat er sein eigenes Lamm gegeben."],
  [/Kamelen zu trinken|Frau für Isaak/, "Rebekka hat zehn Kamelen Wasser geschöpft (1. Mose 24,10.19). Weißt du, wie viel Wasser ein Kamel trinkt? Heidi meint: so viel wie ich nach dem Grillen."],
  [/Ziegenb/, "Rebekka hat Ziegenböcklein so zubereitet, wie Isaak es gern hatte (1. Mose 27,9). Die Frau wusste: Ein Mann lässt sich mit gutem Essen überzeugen."],
  [/Rahel|Laban/, "Jakob diente sieben Jahre um Rahel, und sie kamen ihm vor wie wenige Tage (1. Mose 29,20). So geht's mir mit Heidi beim Puzzeln."],
  [/Becher|Benjamins Sack/, "Josef ließ seinen Becher in Benjamins Sack stecken (1. Mose 44,2). Ich verstecke manchmal Puzzleteile vor meinen Töchtern – die finden sie leider immer."],
  [/Hungersnot|Gosen/, "Josef hat sieben Jahre Korn gesammelt (1. Mose 41,48). Ich sammle Mehl für mein Brot – Heidi sagt, für sieben Jahre reicht's schon."],
  [/Haran|75 Jahre/, "Abram war 75, als er aus Haran aufbrach (1. Mose 12,4). Man ist nie zu alt für Gottes Ruf – oder für einen Umzug von Ingolstadt nach Eichstätt."],
  [/Frösche/, "Frösche überall – sogar in den Backöfen und Backtrögen (2. Mose 7,28)! Da hört für einen Bäcker der Spaß wirklich auf."],
  [/Stechmücken/, "Stechmücken als Plage (2. Mose 8,13) – im Sommer am Grill weiß ich genau, wie sich die Ägypter gefühlt haben."],
  [/Wolkensäule|Feuersäule/, "Eine Feuersäule bei Nacht (2. Mose 13,21) – die perfekte Grillbeleuchtung. Aber sie war zum Führen da, nicht zum Grillen."],
  [/steinerne Tafeln|keine anderen Götter/, "Die Zehn Gebote standen auf Stein (2. Mose 31,18). Meine Puzzleanleitung steht auf Papier – und trotzdem lese ich sie nie."],
  [/Vater und deine Mutter/, "Ehre Vater und Mutter (Epheser 6,2). Meine Töchter ehren mich am meisten, wenn es Stockbrot am Lagerfeuer gibt."],
  [/Mandeln|Aarons Stab/, "Aarons Stab trug über Nacht Mandeln (4. Mose 17,23). Mein Grillspieß hat noch nie geblüht. Ich arbeite dran."],
  [/Weintraube|Kundschafter/, "Eine Traube so groß, dass zwei Männer sie tragen mussten (4. Mose 13,23)! Das einzige Obst, bei dem ich schwach werde – bei der Größe zählt es fast als Hauptgericht."],
  [/Mara|bitteres Wasser/, "In Mara wurde bitteres Wasser süß (2. Mose 15,25). Heidi macht das mit meinem Kaffee – mit sehr viel Milch."],
  [/Elim|Wasserquellen/, "Zwölf Quellen und siebzig Palmen in Elim (2. Mose 15,27) – der erste Rastplatz mit Picknickplatz der Geschichte."],
  [/Bezaleel|Kunsthandwerker/, "Gott erfüllte Bezaleel mit seinem Geist für das Handwerk (2. Mose 31,3). Gott beruft Handwerker – vielleicht ja auch Bäcker?"],
  [/Korah|verschlungen/, "Korah lehnte sich gegen Mose auf, und die Erde tat sich auf (4. Mose 16,32). Seitdem widerspreche ich Heidi nur noch auf ganz festem Boden."],
  [/Hebräer 9,4|Bundeslade.*Manna/, "In der Bundeslade lag ein Krug mit Manna (Hebräer 9,4) – das erste Vorratsglas der Geschichte. Haltbarkeit: unbegrenzt!"],
  [/rote Schnur|Rahab/, "Rahab hängte eine rote Schnur ins Fenster (Josua 2,18) – und sie steht sogar im Stammbaum von Jesus (Matthäus 1,5)!"],
  [/Jordan, als die Priester|Das Wasser blieb stehen/, "Der Jordan blieb stehen, als die Priester hineintraten (Josua 3,16). Gott macht den Weg frei – manchmal erst, wenn man den ersten Schritt tut."],
  [/mein Haus, wir wollen/, "Ich aber und mein Haus, wir wollen dem HERRN dienen (Josua 24,15) – das könnte bei uns über der Tür hängen. Gleich neben „Vorsicht, Grillmeister“."],
  [/Gideon|Krüge|Tenne/, "Gideon wollte zweimal ein Zeichen mit dem Fell (Richter 6,36-40). Kenne ich vom Brotbacken: Ist es schon durch? Klopfen, nochmal klopfen!"],
  [/wie sie Wasser tranken/, "Gott wählte Gideons Männer danach aus, wie sie tranken (Richter 7,5). Bei uns würde Gott wahrscheinlich nach der Bratwurst-Technik auswählen."],
  [/Füchse/, "Simson fing 300 Füchse (Richter 15,4). Ich bekomme nicht mal zwei Töchter gleichzeitig ins Auto."],
  [/Haus der Philister|Wie starb Simson/, "Simson betete am Ende noch einmal um Kraft (Richter 16,28). Gott hört auch das letzte, schwache Gebet."],
  [/Wo du hingehst|Orpa|Obed|Ähren/, "So treu wie Ruth – das wünscht man sich. Heidi ist sogar aus Iowa mit nach Bayern gekommen – als Missionarin!"],
  [/Jephta|Gelübde/, "Jephta hat ein unbedachtes Gelübde getan (Richter 11,30). Seitdem verspreche ich beim Grillen nichts mehr, bevor ich nicht nachgedacht habe."],
  [/Schibbolet/, "Schibbolet (Richter 12,6) – an der Aussprache erkannte man, woher einer kam. In Eichstätt merken sie bei mir auch sofort: Der ist aus Ingolstadt!"],
  [/salbte David|Riese verspottete|bevor er König wurde/, "Gott sieht das Herz an, nicht das Äußere (1. Samuel 16,7). Gut so – sonst hätte ich mit meinem Bart keine Chance."],
  [/dein Knecht hört/, "Rede, denn dein Knecht hört! – Samuel war noch ein Junge. Gott redet auch mit Kindern, meine Töchter erinnern mich gern daran."],
  [/echte Mutter/, "Salomo ließ ein Schwert bringen, und die Wahrheit kam ans Licht (1. Könige 3,24-27). Ich teile höchstens die letzte Bratwurst. Ungern."],
  [/Israel und Juda|Jerobeam|Rehabeam/, "Rehabeam hörte auf die jungen Berater statt auf die alten (1. Könige 12,8). Hätte er mal einen bärtigen Pastor gefragt!"],
  [/Nabot/, "Ahab wollte Nabots Grundstück – für einen Gemüsegarten (1. Könige 21,2)! Ich sag es ja: Gemüse bringt nur Ärger."],
  [/Säuseln/, "Gott war nicht im Sturm und nicht im Feuer, sondern im leisen Säuseln (1. Könige 19,12). Darum mache ich beim Beten den Grill aus."],
  [/Eisen der Axt/, "Elisa ließ eine eiserne Axt schwimmen (2. Könige 6,6). Bei mir schwimmen höchstens die Knödel oben."],
  [/Joas/, "Joas war sieben, als er König wurde (2. Könige 12,1). Meine Töchter regieren bei uns zu Hause schon länger."],
  [/Sanherib|Hiskia/, "Hiskia breitete den Drohbrief vor dem HERRN aus (2. Könige 19,14). So mache ich das mit Rechnungen auch – beten hilft!"],
  [/Standbild/, "Das Standbild hatte Füße teils aus Eisen, teils aus Ton (Daniel 2,33) – wackelig! Wie mein erster selbstgebauter Grill."],
  [/offenen Fenster|Daniel 6,11/, "Daniel betete dreimal am Tag (Daniel 6,11). Ich bete auch dreimal – vor jedem Essen. Und bei mir gibt's oft mehr als drei Mahlzeiten."],
  [/Rizinus/, "Jona freute sich über die Rizinusstaude mehr als über Ninive (Jona 4,6). Ich freu mich auch über Schatten am Grill – aber Gottes Gnade ist größer."],
  [/3 Tage und 3 Nächte/, "Drei Tage im Fisch (Jona 2,1) – und Jesus sagt, das ist ein Zeichen auf seine Auferstehung (Matthäus 12,40). Mehr Tiefgang geht nicht."],
  [/Herberge|Windeln/, "Kein Raum in der Herberge (Lukas 2,7). Bei uns in Eichstätt hätten sie ein Zimmer bekommen – mit frischem Brot zum Frühstück."],
  [/Weisen|Stern des Königs|Herodes/, "Die Weisen sind dem Stern gefolgt (Matthäus 2,2). Ich folge zuverlässig dem Duft von frischem Brot."],
  [/Zacharias|hüpfte|Elisabeth/, "Zacharias war stumm, bis Johannes geboren wurde (Lukas 1,20). Heidi meinte, so eine Pause würde mir manchmal auch guttun."],
  [/erhebt den Herrn|Lobgesang/, "Maria hat gesungen statt geklagt (Lukas 1,46). Ich singe auch – beim Teigkneten. Heidi schließt dann die Küchentür."],
  [/Turteltauben/, "Turteltauben waren das Opfer der Armen (3. Mose 12,8). Jesus kam in eine einfache Familie – keine Grillparty, aber Gottes Sohn!"],
  [/Haus Davids|Geschlecht/, "Josef stammte aus dem Haus Davids (Lukas 2,4) – darum ging es nach Bethlehem, ins „Brothaus“. Für einen Bäcker die schönste Stadt der Welt!"],
  [/Fürchtet euch nicht|große Freude/, "Große Freude für alles Volk (Lukas 2,10)! Bei uns ist große Freude, wenn das erste Weihnachtsbrot aus dem Ofen kommt."],
  [/gebot dem Wind/, "Jesus gebot dem Wind und dem Meer (Matthäus 8,26). Ich gebiete meinem Grillfeuer – aber es hört nie auf mich."],
  [/durch das Dach/, "Die Freunde deckten das Dach ab (Markus 2,4) – echte Freunde! Meine würden das für mich auch tun. Wahrscheinlich, um ans Buffet zu kommen."],
  [/Sprich nur ein Wort/, "Sprich nur ein Wort (Matthäus 8,8) – dieser Glaube hat sogar Jesus gewundert. Mich wundert schon, wenn ein Brot beim ersten Versuch gelingt."],
  [/Blutfluss/, "Die Frau berührte nur sein Gewand und wurde gesund (Markus 5,29). Manchmal reicht ein kleiner Schritt im Glauben."],
  [/Hälfte seiner Güter|Zachäus/, "Jesus hat sich bei Zachäus selbst zum Essen eingeladen (Lukas 19,5). Darauf warte ich bei mir auch – der Grill wäre bereit!"],
  [/Speichel|Siloah|Blindgeboren/, "Jesus machte einen Brei aus Speichel und Erde (Johannes 9,6). Meine Töchter finden Kochen mit Matsch auch super. Heidi nicht."],
  [/sieben Broten|4000/, "Sieben Brote für 4000 Männer (Matthäus 15,38). Ich schaffe mit sieben Broten nicht mal unseren Hauskreis."],
  [/Stater/, "Petrus holte die Steuer aus einem Fischmaul (Matthäus 17,27). Wenn ich angle, finde ich höchstens einen alten Schuh."],
  [/Kephas/, "Kephas heißt Fels – und auf dem Bekenntnis zu Christus steht die Gemeinde fester als jedes Fundament."],
  [/Zebedäus|Bethsaida/, "Die Zebedäus-Söhne nannte Jesus „Donnersöhne“ (Markus 3,17). Bei uns donnert es nur, wenn der Grill nicht angeht."],
  [/eingeborenen Sohn/, "Johannes 3,16 ist das Evangelium im Kleinformat – das passt sogar auf einen Brotkorb."],
  [/Salz der Erde/, "Ihr seid das Salz der Erde (Matthäus 5,13) – ohne Salz schmeckt kein Steak, und ohne Christen fehlt der Welt der Geschmack."],
  [/mit unseren Feinden/, "Liebt eure Feinde (Matthäus 5,44) – ich übe noch. Mit Rosenkohl klappt's noch nicht."],
  [/Kinder zu mir/, "Lasst die Kinder zu mir kommen (Markus 10,14). Meine Mädels kommen auch immer – vor allem, wenn es Stockbrot gibt."],
  [/Licht der Welt/, "Ich bin das Licht der Welt (Johannes 8,12) – heller als jede Grillfackel."],
  [/Weinstock, ihr seid/, "Ohne den Weinstock keine Frucht (Johannes 15,5) – wie beim Sauerteig: ohne Ansatz kein Brot."],
  [/sein Leben für die Schafe/, "Der gute Hirte lässt sein Leben für die Schafe (Johannes 10,11). Bei diesem Vers wird selbst ein Grillmeister ganz leise."],
  [/Kämmerlein/, "Geh in dein Kämmerlein (Matthäus 6,6). Mein Kämmerlein ist die Speisekammer – da ist es ruhig und riecht nach Brot."],
  [/morgigen Tag/, "Sorgt euch nicht um morgen (Matthäus 6,34). Ich sorge mich nur, ob der Teig über Nacht aufgeht – und dann bete ich."],
  [/Nadelöhr/, "Ein Kamel durchs Nadelöhr – das ist schwerer, als meine Töchter zum Gemüseessen zu bringen. Und das ist schon schwer!"],
  [/Erbteil|hütete der verlorene/, "Der verlorene Sohn hätte gern vom Schweinefutter gegessen (Lukas 15,16). Ich sag ja: Lieber gleich heimkommen – beim Vater gibt's das gemästete Kalb!"],
  [/Priester und ein Levit/, "Priester und Levit gingen vorbei, der Samariter half (Lukas 10,33). Der Nächste ist der, der Hilfe braucht – auch wenn er Gemüse mag."],
  [/vergrub|ein Talent/, "Der Knecht vergrub sein Talent (Matthäus 25,18). Ich vergrabe nur Kartoffeln in der Glut – die bringen wenigstens etwas."],
  [/sei mir Sünder/, "Der Zöllner schlug sich an die Brust (Lukas 18,13). Ehrlichkeit vor Gott ist mehr wert als jedes fromme Angeben."],
  [/Scheunen/, "Der reiche Kornbauer wollte größere Scheunen (Lukas 12,18). Ich wollte einen größeren Grill. Ich glaube, ich verstehe die Warnung."],
  [/Sanftmütig/, "Die Sanftmütigen erben das Land (Matthäus 5,5). Ich übe Sanftmut, wenn der Grill nicht anspringt. Ich übe noch."],
  [/Hosianna|Kleider und Zweige/, "Die Leute breiteten ihre Kleider auf den Weg (Matthäus 21,8). Heidi würde das mit meiner Grillschürze nie machen."],
  [/Geldwechsler|Händler/, "Jesus trieb die Händler aus dem Tempel (Matthäus 21,12). Beim Gemeindefest verkaufen wir Kuchen – aber draußen, versprochen!"],
  [/wusch ihnen die Füße/, "Jesus wusch seinen Jüngern die Füße (Johannes 13,5). Ich wasche nach dem Grillen das Geschirr ab. Fast genauso demütig."],
  [/Kuss/, "Judas verriet Jesus mit einem Kuss (Matthäus 26,49). Das Schlimmste kann von nahem kommen – darum brauchen wir Gottes Treue."],
  [/schliefen/, "Die Jünger schliefen in Gethsemane (Matthäus 26,40). Ich schlafe auch schnell ein – nach dem Grillen auf dem Sofa. Aber Jesus hat für uns gewacht."],
  [/dein Wille geschehe/, "Nicht mein, sondern dein Wille (Lukas 22,42) – das schwerste Gebet der Welt. Jesus hat es gebetet."],
  [/vollbracht/, "Es ist vollbracht (Johannes 19,30) – kein Puzzle mit fehlendem Teil: Jesus hat alles getan."],
  [/vergib ihnen/, "Vater, vergib ihnen (Lukas 23,34) – am Kreuz betet Jesus für seine Feinde. Da wird jeder Streit über Gemüse ganz klein."],
  [/Vorhang/, "Der Vorhang zerriss von oben nach unten (Matthäus 27,51) – von oben! Gott selbst hat den Weg zu sich geöffnet."],
  [/Wahrhaftig, dieser/, "Ein römischer Hauptmann sagte: Wahrhaftig, dieser war Gottes Sohn (Matthäus 27,54). Manchmal erkennen die, von denen man es am wenigsten erwartet."],
  [/Myrrhe und Aloe/, "Nikodemus kam erst bei Nacht – und zeigte sich am Ende ganz offen (Johannes 19,39). Gott hat Geduld mit Spätzündern."],
  [/Gärtner/, "Maria hielt Jesus für den Gärtner (Johannes 20,15). Mich würde nie jemand für einen Gärtner halten – bei mir wächst ja nichts Grünes."],
  [/153/, "153 große Fische (Johannes 21,11) – und Jesus hatte schon Fisch auf dem Kohlenfeuer. Der beste Grillmeister aller Zeiten."],
  [/hast du mich lieb/, "Dreimal verleugnet, dreimal gefragt: Hast du mich lieb? (Johannes 21,17). Jesus heilt auch alte Wunden."],
  [/Wolke nahm ihn/, "Eine Wolke nahm ihn auf (Apostelgeschichte 1,9) – und er kommt genauso wieder. Ich halte den Grill bereit."],
  [/Korb über die Mauer/, "Paulus wurde in einem Korb über die Mauer gelassen (Apostelgeschichte 9,25). Ich hätte den Korb lieber mit Brot gefüllt."],
  [/nichts mehr sehen|Saulus, bevor/, "Saulus war drei Tage blind und aß nichts (Apostelgeschichte 9,9). Drei Tage nichts essen – das wäre für mich das größere Wunder."],
  [/Rhode|befreite Petrus/, "Rhode ließ Petrus vor Freude draußen stehen (Apostelgeschichte 12,14). Die Gemeinde betete – und konnte dann kaum glauben, dass es geklappt hat. Kommt mir bekannt vor."],
  [/Areopag|Athen/, "Paulus sprach in Athen über den unbekannten Gott (Apostelgeschichte 17,23). In Eichstätt kennt man ihn zum Glück – sogar die Kirchtürme zeigen nach oben."],
  [/Kerkermeister|damit ich gerettet werde/, "Glaube an den Herrn Jesus, so wirst du gerettet, du und dein Haus (Apostelgeschichte 16,31). Und danach gab es Essen (Vers 34) – so gefällt mir eine Bekehrung!"],
  [/Otter/, "Paulus schüttelte die Otter einfach ins Feuer (Apostelgeschichte 28,5). Ganz ruhig – so wünsche ich mir das auch, wenn eine Wespe auf meiner Bratwurst sitzt."],
  [/Artemis|Ephesus/, "In Ephesus schrien sie zwei Stunden lang (Apostelgeschichte 19,34). Zwei Stunden! Bei uns ist nach zwei Liedern Kaffeepause."],
  [/finstere Tal/, "Ich fürchte kein Unglück, denn du bist bei mir (Psalm 23,4) – das bete ich auch, bevor ich ein neues Brotrezept ausprobiere."],
  [/Psalm 103/, "So fern der Osten vom Westen (Psalm 103,12) – von Eichstätt bis nach Iowa, Heidis Heimat, ist schon weit. Gottes Vergebung reicht noch weiter!"],
  [/eigenen Verstand/, "Verlass dich nicht auf deinen Verstand (Sprüche 3,5) – das sagt Heidi auch, wenn ich ohne Rezept backe."],
  [/sanfte Antwort/, "Eine sanfte Antwort wendet den Grimm ab (Sprüche 15,1). Das funktioniert sogar bei meinen Töchtern. Manchmal."],
  [/Prediger 12,1|Prediger 3,11/, "Gedenke an deinen Schöpfer in deiner Jugend (Prediger 12,1) – darum wird bei uns abends aus der Bibel vorgelesen. Meistens liest Heidi."],
  [/41,10/, "Fürchte dich nicht (Jesaja 41,10) – Gott weiß, wie oft wir das hören müssen."],
  [/Jesaja 53,5/, "Durch seine Wunden sind wir geheilt (Jesaja 53,5) – das hat Jesaja rund 700 Jahre vor dem Kreuz geschrieben. Gänsehaut!"],
  [/Immanuel/, "Immanuel – Gott mit uns. Sogar am Grill. Gerade da."],
  [/Mandelzweig/, "Ein Mandelzweig (Jeremia 1,11) – Mandeln mag ich übrigens. Auf Kuchen. Kuchen ist kein Gemüse!"],
  [/Jeremia 29,11/, "Gedanken des Friedens (Jeremia 29,11) – das schrieb Gott an Leute in der Fremde. Wer umzieht, darf sich daran festhalten. Auch von Ingolstadt nach Eichstätt."],
  [/Tiefe des Meeres/, "Gott wirft unsere Sünden in die Tiefe des Meeres (Micha 7,19) – und ich glaube, er stellt ein Schild dazu: Angeln verboten!"],
  [/Hesekiel 3,1|eine Buchrolle/, "Hesekiel aß eine Buchrolle, und sie war süß wie Honig (Hesekiel 3,3). Endlich ein Rezept, das Heidi und ich beide gut finden."],
  [/Messschnur/, "Ein Mann mit Messschnur (Sacharja 2,5) – so stecke ich beim Gemeindefest den Grillplatz ab."],
  [/Philipper 4,13/, "Ich vermag alles durch Christus (Philipper 4,13) – Paulus schreibt das über Mangel und Überfluss. Also auch über Tage ohne Grill."],
  [/Römer 3,23/, "Alle haben gesündigt (Römer 3,23) – auch Pastoren. Vor allem beim Nachschlag."],
  [/Römer 8,28/, "Alle Dinge dienen zum Besten (Römer 8,28) – sogar ein verbranntes Brot. Daraus macht Heidi Semmelbrösel."],
  [/Tempel des Heiligen Geistes/, "Der Leib ist ein Tempel des Heiligen Geistes (1. Korinther 6,19). Heidi sagt, darum soll ich mehr Gemüse essen. Ich halte dagegen: Im Tempel wurde Fleisch geopfert!"],
  [/Alle Schrift/, "Alle Schrift ist von Gott eingegeben (2. Timotheus 3,16) – sogar die langen Namenslisten. Die lese ich wie ein Puzzle: Jeder Name hat seinen Platz."],
  [/1\. Petrus 5,7/, "Werft alle eure Sorge auf ihn (1. Petrus 5,7) – die Sorgen aufs Gebet, die Holzkohle auf den Grill."],
  [/Offenbarung 22,21|letzte Vers/, "Die Bibel endet mit Gnade (Offenbarung 22,21). Das schönste Ende – schöner als das letzte Puzzleteil."],
  [/zweischneidige/, "Gottes Wort ist schärfer als jedes zweischneidige Schwert (Hebräer 4,12) – schärfer als mein bestes Brotmesser. Und das ist scharf!"],
  [/lachte/, "Sara lachte – und der Sohn hieß Isaak, „er lacht“ (1. Mose 21,6). Gott hat das letzte Lachen!"],
  [/Isaak heiratete/, "Isaak gewann Rebekka lieb und wurde getröstet (1. Mose 24,67). Eine gute Frau ist ein Geschenk – meine hat mir sogar das Barbecue mitgebracht."],
  [/betrunken/, "Eli hat Hanna falsch verstanden – dabei betete sie aus tiefstem Herzen (1. Samuel 1,13-15). Gott hört auch das Gebet, das andere falsch verstehen."],
  [/Füße und trocknete/, "Das ganze Haus duftete nach dem Salböl (Johannes 12,3). Bei uns duftet das Haus nach frischem Brot – auch nicht schlecht."],
  [/Scherflein/, "Zwei Scherflein – und Jesus sagt, sie hat mehr gegeben als alle (Markus 12,43). Gott zählt nicht den Betrag, sondern das Herz."],
  [/Seine Schwester|von Ferne/, "Mirjam passte auf ihren kleinen Bruder auf (2. Mose 2,4). Meine Töchter passen auch aufeinander auf – zumindest, wenn es Schokolade gibt."],
  [/Michal/, "Michal ließ David durchs Fenster hinab und legte eine Figur ins Bett (1. Samuel 19,12-13). Die erste Bettattrappe der Geschichte!"],
  [/Abigail/, "Abigail kam unter anderem mit 200 Broten, fünf zubereiteten Schafen und Feigenkuchen (1. Samuel 25,18). So stoppt man einen Streit – mit gutem Essen!"],
  [/Priscilla/, "Priscilla und Aquila waren Zeltmacher wie Paulus (Apostelgeschichte 18,3). Ich kann Zelte aufbauen – sie stehen nur immer etwas schief."],
  [/Phöbe/, "Paulus empfiehlt Phöbe als Dienerin der Gemeinde (Römer 16,1). Ohne fleißige Frauen gäbe es in keiner Gemeinde Kaffee und Kuchen."],
  [/Jochebed|Hebammen/, "Die Hebammen fürchteten Gott mehr als den Pharao (2. Mose 1,17). Mutige Frauen! Heidi wäre auch so eine."],
  [/Obergemach|Schunemiterin/, "Die Schunemiterin richtete Elisa ein Zimmer mit Bett, Tisch, Stuhl und Leuchter ein (2. Könige 4,10). Bei uns hätte er noch einen Grill auf dem Balkon bekommen."],
  [/Hulda/, "Hulda hat Gottes Wort klar gesagt, auch als es unbequem war (2. Könige 22,15-20). Mutige Prophetin!"],
  [/wie eine Taube|Taufe Jesu auf ihn/, "Der Geist kam wie eine Taube (Matthäus 3,16). Tauben sind übrigens das einzige Geflügel, über das ich am Grill keine Witze mache."],
  [/Hahn/, "Der Hahn krähte, und Petrus weinte bitterlich (Matthäus 26,75). Aber Jesus hat ihm vergeben – das ist nicht das Ende der Geschichte."],
  [/Lamm Gottes/, "Siehe, das Lamm Gottes (Johannes 1,29) – das Passahlamm zeigte auf Jesus hin. Über dieses Lamm mache ich keine Grillwitze."],
  [/Stamm Juda/, "Der Löwe aus Juda hat gesiegt (Offenbarung 5,5) – und dann sieht Johannes ein Lamm. Gottes Sieg sieht anders aus, als wir denken."],
  [/In welche Tiere|Dämonen/, "Etwa 2000 Schweine stürzten in den See (Markus 5,13). Als Grillmeister tut mir das in der Seele weh."],
  [/wie die Schlangen/, "Klug wie die Schlangen, ohne Falsch wie die Tauben (Matthäus 10,16). Am Grill bin ich klug wie die Schlange: Ich weiß genau, welches Würstchen das beste ist."],
  [/Stroh/, "Der Löwe frisst Stroh wie das Rind (Jesaja 11,7). Ein vegetarischer Löwe! Ich weiß nicht, ob ich mich auf diesen Teil des Friedensreichs freuen soll."],
  [/reinen Tiere|Je sieben/, "Von den reinen Tieren je sieben (1. Mose 7,2) – Noah hat praktisch gedacht. Nach der Flut gab's erst einmal ein Dankopfer (1. Mose 8,20)."],
  [/Lukas 12,24/, "Betrachtet die Raben – Gott ernährt sie (Lukas 12,24). Und die Raben bei Elia haben sogar Fleisch geliefert!"],
  [/Amalekiter/, "Gehorsam ist besser als Opfer (1. Samuel 15,22) – den Vers sage ich mir vor jedem Grillkauf vor."],
  [/Tarsus/, "Paulus stammte aus Tarsus – ein Zugezogener. Wie ich als Ingolstädter in Eichstätt."],
  [/Bethesda/, "38 Jahre wartete der Mann am Teich (Johannes 5,5) – so lange warte ich auf einen perfekten Grillsommer."],
  [/\bSilo\b/, "In Silo betete Hanna um Samuel, und dort wuchs er auf. Ein Ort voller Gebete!"],
  [/Kidron/, "Jesus ging über den Bach Kidron in den Garten (Johannes 18,1). Kleine Bäche, große Geschichte – wie bei uns die Altmühl."],
  [/Nach Babel/, "Auch in Babel sagte Gott: Suchet der Stadt Bestes (Jeremia 29,7). Wo Gott einen hinstellt, kann man zum Segen werden – sogar weit weg von Ingolstadt."],
  [/Schiffbruch/, "Beim Schiffbruch kamen alle 276 Menschen gerettet an Land (Apostelgeschichte 27,37.44). Und vorher hat Paulus allen gesagt: Esst etwas! Ein Mann nach meinem Herzen."],
  [/sende mich/, "Hier bin ich, sende mich (Jesaja 6,8)! So melde ich mich auch immer freiwillig – fürs Grillen beim Gemeindefest."],
  [/lebendigen Gottes/, "Du bist der Christus (Matthäus 16,16) – auf diesem Bekenntnis steht die Gemeinde. Fester als jedes Fundament."],
  [/Mein Herr und mein Gott/, "Thomas zweifelte – und dann kam das stärkste Bekenntnis (Johannes 20,28). Zweifler können die besten Bekenner werden."],
  [/Komme ich um/, "Esther hat vorher drei Tage gefastet (Esther 4,16). Fasten! Davor hätte ich fast mehr Respekt als vor dem König."],
  [/Was ist Wahrheit/, "Pilatus fragte: Was ist Wahrheit? – und die Wahrheit stand direkt vor ihm (Johannes 14,6)."],
  [/Silber und Gold/, "Silber und Gold habe ich nicht (Apostelgeschichte 3,6) – das sage ich auch an der Tankstelle. Aber Petrus hatte etwas viel Wertvolleres: den Namen Jesus!"],
  [/zum Pharao gehen/, "Wer bin ich? (2. Mose 3,11) – und Gott antwortet: Ich will mit dir sein. Das reicht."],
  [/stark und mutig/, "Sei stark und mutig (Josua 1,9) – das sage ich mir auch, bevor ich Heidi erkläre, dass ich einen neuen Grill brauche."],
  [/denk an mich/, "Heute noch wirst du mit mir im Paradies sein (Lukas 23,43) – Gnade in letzter Minute!"],
  [/Erlöser lebt/, "Ich weiß, dass mein Erlöser lebt (Hiob 19,25) – das sagt Hiob mitten im Leid. Stärker kann man nicht glauben."],
  [/entlässt du deinen Knecht/, "Simeon hatte lange gewartet und durfte das Kind sehen (Lukas 2,29-30). Warten lohnt sich – das weiß jeder Brotbäcker."],
  [/muss abnehmen/, "Er muss wachsen, ich aber muss abnehmen (Johannes 3,30). Heidi meint, ich soll den Vers auch wörtlich nehmen."],
  [/guten Kampf/, "Den Lauf vollendet (2. Timotheus 4,7) – ich laufe selten. Aber den Glaubenslauf will ich durchziehen."],
  [/mehr gehorchen/, "Man muss Gott mehr gehorchen als den Menschen (Apostelgeschichte 5,29) – die Apostel ließen sich nicht einschüchtern."],
  [/Unglauben/, "Ich glaube; hilf meinem Unglauben (Markus 9,24) – ein ehrliches Gebet. Das bete ich auch manchmal. Nicht nur beim Grillanzünden."],
  [/Missionsbefehl|Gehet hin|alle Völker|Missionsreise|Barnabas/, "Geht hin in alle Welt! Heidi und ich haben uns nach dem Bible College in Iowa genau das zu Herzen genommen – nur eben Richtung Deutschland."],
  [/Rebekka|Frau für Isaak/, "Abrahams Knecht fand Rebekka in der Fremde (1. Mose 24). Ich hab meine Heidi in Iowa gefunden – Gott führt, auch über den Ozean."],
  [/Harfe|1\. Samuel 16/, "David hat für Saul auf der Harfe gespielt, und der böse Geist wich von ihm (1. Samuel 16,23). Ich spiele Gitarre – bei mir weicht höchstens der Grillrauch."],
  [/Jubal/, "Jubal ist der Vater aller Harfen- und Flötenspieler (1. Mose 4,21) – sozusagen der erste Musikteamleiter. Den hätte ich sofort für Sonntag eingeteilt."],
  [/Psalm|Lobt? den HERRN/, "Lobt ihn mit Saitenspiel und Flöte (Psalm 150,4)! Saitenspiel – das bin ich mit meiner Gitarre. Ich sag ja: Lobpreis ist biblisch!"],
  [/Asaph|Sänger/, "Asaph war unter David der Leiter der Sänger (1. Chronik 16,5) – ein Kollege! Als Musikteamleiter weiß ich: Der Mann hatte viel zu organisieren."],
  [/Mirjam|Pauke|Schilfmeer/, "Mirjam nahm die Pauke, und alle Frauen zogen tanzend hinter ihr her (2. Mose 15,20). Im Musikteam hätte ich sie sofort genommen – auch wenn Heidi sagt, die Kirchenfenster überleben keine Pauke."],
  [/Weihrauch|Myrrhe|Aloe|Wohlgeruch/, "Paulus schreibt, wir sind für Gott ein Wohlgeruch des Christus (2. Korinther 2,15). Heidi meint, ich nehme den Vers etwas zu wörtlich – wegen meines Parfüms."],
  [/Narde|Bethanien|Johannes 12/, "Maria salbte Jesus mit kostbarem Nardenöl, und das ganze Haus war vom Duft erfüllt (Johannes 12,3). Bei uns ist das jeden Sonntagmorgen so – Heidi sagt, mein Parfüm riecht man schon auf dem Parkplatz."],
  [/Salböl|Psalm 133|Eintracht|einträchtig/, "Das Salböl fließt herab in den Bart Aarons (Psalm 133,2) – Bart und Wohlgeruch in einem Vers! Das ist eindeutig mein Psalm."],
  [/Leibrock|Potifar/, "Josef bekam von seinem Vater einen bunten Leibrock (1. Mose 37,3). Wäre Heidi dabei gewesen, hätte sie ihm sofort das passende Kleid dazu ausgesucht – bei uns geht keiner unabgestimmt aus dem Haus."],
  [/Lydia|Purpur/, "Lydia handelte mit Purpur (Apostelgeschichte 16,14). Heidi und ich trugen mal beide Purpur im Gottesdienst. Die Gemeinde hat geklatscht – oder gelacht, so genau weiß ich das nicht."],
  [/Missionsreise|Barnabas|Silas|Antiochia/, "Paulus und Barnabas wurden auf Missionsreise ausgesandt (Apostelgeschichte 13,2). Wir fliegen jedes Jahr nach Amerika, zu Heidis Familie und zu Gemeinden. Nur hatte Paulus kein Gepäcklimit – Heidis Bücher und mein Parfüm hätten sich gefreut."],
  [/Kleider|Gewand/, "„Lass deine Kleider allezeit weiß sein, und lass deinem Haupt das Öl nicht mangeln“ (Prediger 9,8). Kleider und Duft in einem Vers – Heidi und ich halten uns dran, nur farblich etwas mutiger."],
  [/Garten Eden|1\. Mose 1,29|Kraut/, "Im Garten Eden gab Gott Pflanzen zur Speise (1. Mose 1,29) – das zitieren unsere Vegetarier gern. Ich antworte mit 1. Mose 9,3. Und dann sitzen wir zusammen am Tisch, jeder mit seinem Teller. So soll Gemeinde sein!"]
];
const WILLI_ALLG = [
  "Heidi hat übrigens aus Amerika das Barbecue mitgebracht – seitdem grillen wir sogar im Winter.",
  "Meine zwei Töchter wollen mir immer Zucchini auf den Grill schmuggeln. Ich bete noch drüber.",
  "Heidi ruft gerade aus der Küche: „Good luck!“ – und ich sag: Gottes Segen!",
  "Wenn du die Million holst, gibt es beim Gemeindefest ein Extra-Steak für dich. Die Gemüsespieße bringt Heidi mit.",
  "Heidi sagt dann immer: „Willi, denk an Daniel!“ – der hat zehn Tage nur Gemüse gegessen (Daniel 1,12). Ich denk lieber an das gemästete Kalb aus Lukas 15.",
  "Mein Bart riecht schon nach Holzkohle – das heißt, die Glut ist perfekt.",
  "Bei so einer Frage krieg ich glatt Hunger. Gut, dass gleich die Bratwürste fertig sind.",
  "Meine Töchter rufen im Hintergrund schon mit – die beiden sind fast so bibelfest wie ihr Vater.",
  "Rosenkohl ist für mich die elfte Plage. Steht nicht in der Bibel – aber gefühlt schon.",
  "Gerade ist mein Brot im Ofen und es riecht herrlich. Bis es fertig ist, haben wir die Frage längst gelöst.",
  "Heidi liest gerade auf dem Sofa und sagt, das kam in ihrem letzten Buch auch irgendwo vor.",
  "Auf meinem Esstisch liegt ein Puzzle mit 2000 Teilen. Da ist so eine Bibelfrage richtig erholsam.",
  "Ich hab mir ein Puzzle mit der Arche Noah gekauft – 3000 Teile, davon gefühlt 2000 Wasser.",
  "Heidi hat diese Woche schon drei Bücher gelesen. Ich hab in der Zeit ein Brot gebacken. Wir ergänzen uns.",
  "Meine Töchter haben mir eine Schürze geschenkt: „Ich grille, also bin ich.“ Theologisch fragwürdig, aber sie passt.",
  "Kleiner Tipp vom Pastor: Wer jeden Tag ein Kapitel liest, ist in gut drei Jahren einmal durch die ganze Bibel.",
  "Mein Bart hat übrigens schon mehr Bibelstunden erlebt als mancher Theologiestudent.",
  "Heidi sagt, in Amerika dauert ein Barbecue den ganzen Tag. Ich hab sofort gesagt: Gott segne Amerika!",
  "Die Mädels wollten ein Gemüse-Puzzle mit mir legen. Die Karotten-Teile sind rein zufällig unters Sofa gerutscht.",
  "Heidi meinte, ich soll mal Tofu probieren. Ich wollte ihr einen Bibelvers dagegen zeigen – und habe Sprüche 15,17 gefunden. Der spricht leider für sie.",
  "Eine meiner Töchter hält mir gerade einen Zettel hin: „Papa, sag die richtige Antwort!“ Danke für den Tipp, Schatz.",
  "Ich hab einmal Zucchini gegrillt. Einmal. Wir reden nicht drüber.",
  "Heidi liest mehr Bücher als ich – aber in der Bibel blättere ich schneller. Das lass ich mir nicht nehmen.",
  "Für so eine Frage leg ich sogar mein Brotmesser beiseite. Das will was heißen!",
  "Ich bin gebürtiger Ingolstädter – in Eichstätt hab ich gelernt: Hier geht alles etwas gemütlicher. Wie ein guter Sauerteig.",
  "Ingolstadt hat die Autos, Eichstätt hat den Dom – und ich hab den Grill. Jeder hat seine Stärken.",
  "Wenn ich nach Ingolstadt fahre, sagen die Leute: Der Willi ist ein Eichstätter geworden. Ich sag: Hauptsache, die Grillkohle ist dieselbe.",
  "Ich hab in Iowa am Faith Baptist Bible College Theologie studiert – und dort Heidi kennengelernt. Die beste Lektion meines ganzen Studiums!",
  "Nach dem Studium sind Heidi und ich als Missionare nach Deutschland gegangen. Für mich ging's zurück nach Hause, für Heidi war's ein Abenteuer.",
  "In Iowa hab ich gelernt, was richtiges Barbecue ist. Heidi hat dafür in Bayern gelernt, dass man ohne Brezn nicht frühstückt.",
  "Iowa ist flach und voller Mais. Heidi sagt, Mais ist Gemüse. Ich sag: Popcorn zählt nicht.",
  "Pastor Aaron hat übrigens am selben Bible College studiert wie ich. Iowa bringt gute Leute hervor – allen voran Heidi!",
  "Heidi und Pastor Aaron kommen beide aus Iowa. Wenn die zwei loslegen, verstehe ich nur noch „corn“ und „snowstorm“.",
  "Im Winter in Iowa hab ich gelernt: Bei minus 25 Grad grillt man trotzdem. Man steht nur näher an der Glut.",
  "Ich hab gerade die Gitarre für Sonntag gestimmt. Wenn du die Million holst, spielt das Musikteam ein Siegeslied.",
  "Heidi und ich haben heute beide Dunkelgrün an. Nicht abgesprochen, sagt sie. Ich glaube ihr kein Wort.",
  "Wenn du mich beim Gemeindefest suchst: einfach der Nase nach. Heidi sagt, mein Parfüm hat eine größere Reichweite als unser WLAN.",
  "Ein Vegetarier hat mich gefragt, ob ich mal Grillgemüse probiere. Ich hab gesagt: Ich bete drüber. Das war vor drei Jahren.",
  "Unsere Vegetarier in der Gemeinde sind wunderbare Leute. Ich bete jeden Tag dafür, dass sie die Bratwurst noch entdecken.",
  "Kennst du den? Treffen sich ein Vegetarier und ein Pastor am Grill – am Ende sind beide satt. Das nenne ich ein Wunder.",
  "Nächstes Jahr fliegen wir wieder nach Amerika – Heidis Familie besuchen und Gemeinden. Ich übe schon: „The big steak, please!“",
  "In Amerika besuchen wir jedes Jahr Gemeinden. Die verstehen mein Englisch – solange Heidi danebensteht und nickt.",
  "Heidi sagt, unser Koffer für Amerika ist halb Kleidung, halb Parfüm. Das ist übertrieben. Höchstens ein Drittel Parfüm.",
  "Das Schönste an meinem Beruf? Menschen von Jesus zu erzählen. Das Zweitschönste? Das Gemeindefest. Das Drittschönste? Die Gitarre.",
  "Heidi sagt, wenn man mich lässt, wird aus jeder Antwort eine Predigt mit drei Punkten. Keine Sorge – heute nur ein Punkt.",
  "Im Musikteam sag ich immer: Wir spielen nicht vor der Gemeinde, sondern für Gott. Die Gemeinde darf aber gern mitsingen!",
  "Meine Gitarre hat schon mehr Gottesdienste erlebt als mancher Kirchenstuhl.",
  "Heidi und ich hatten letzten Sonntag Partnerlook in Weinrot. Die Jugend hat ein Foto gemacht. Ich fürchte, wir sind jetzt ein Meme.",
  "Bei uns hängt eine Farbkarte am Kleiderschrank: Heidi wählt die Farbe, ich das Parfüm. Teamwork in der Ehe!",
  "Am Flughafen in Amerika hat der Zollbeamte an meinem Koffer gerochen und gesagt: „Sir, you smell great.“ Ich hab geantwortet: „God bless you!“",
  "Ich leite das Musikteam – das heißt: Ich zähle ein, alle anderen fangen trotzdem zu unterschiedlichen Zeiten an. Wie beim Grillen – jedes Würstchen hat sein Tempo.",
  "Wenn ich predige, vergesse ich manchmal die Zeit. Heidi gibt mir dann aus der ersten Reihe ein Zeichen – farblich passend zu meiner Krawatte."
];
const WILLI_TSCHUESS = [
  "Gott segne dich – viel Erfolg! Pfiat di!",
  "So, jetzt muss ich die Steaks wenden. Gott befohlen – Servus!",
  "Ich bete für dich. Pfiat di!",
  "Heidi und die Mädels drücken dir die Daumen. Bis Sonntag – Servus!",
  "Gott befohlen – und denk dran: Gottes Wort ist mehr wert als Tausende Gold- und Silberstücke (Psalm 119,72). Pfiat di!",
  "So, mein Brot will aus dem Ofen. Gott segne dich – Servus!",
  "Ich muss weiterpuzzeln – mir fehlt noch ein Stück Himmel. Pfiat di!",
  "Heidi ruft „Bye!“, die Mädels rufen „Tschüss!“, und ich sage ganz bayrisch: Servus!",
  "Und jetzt: kurz beten, dann tippen. Pfiat di!",
  "Viel Erfolg! Und falls es schiefgeht: Beim Gemeindefest gibt's trotzdem eine Bratwurst für dich. Servus!",
  "Der HERR segne dich und behüte dich (4. Mose 6,24). Pfiat di!",
  "Ich leg jetzt auf, bevor die Glut ausgeht. Gottes Segen – Servus!",
  "Wie man in Iowa sagt: Take care! Und wie man in Bayern sagt: Pfiat di!",
  "So, ich muss zur Musikprobe – die Gitarre wartet. Gott befohlen – Servus!",
  "Und wenn es am Sonntag im Gemeindesaal gut duftet: Das bin ich. Pfiat di!",
  "Heidi winkt – im selben Farbton wie ich, versteht sich. Gottes Segen – Servus!",
  "Gott segne dich! Ich muss noch Flüge nach Amerika vergleichen. Pfiat di!",
  "Bis Sonntag! Wenn du gewinnst, spiel ich dir ein Lied auf der Gitarre. Servus!"];
/* Abwechslung (6.51): Sätze, die auf diesem Gerät kürzlich schon kamen, werden übersprungen. Der Tipp selbst
   (richtig/falsch, Sicherheit) hängt weiter nur vom Startwert ab – fair im Duell und in der Wochenrunde.
   Jede Auswahl verbraucht genau einen Zufallswert, egal ob übersprungen wird. */
const TEL_ZULETZT_KEY = "bq-telefon-zuletzt";
function telZuletzt() { try { const a = JSON.parse(localStorage.getItem(TEL_ZULETZT_KEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function telMerken(liste) { try { localStorage.setItem(TEL_ZULETZT_KEY, JSON.stringify(liste.slice(-150))); } catch (e) {} }
function pastorAntwort(f, halb, id = "willi") {
  const P0 = PASTOREN[id] || PASTOREN.willi, weih = !!f.weih && !!ADV_PASTOREN[id]; /* 7.3: Weihnachtsmodus – Mütze und weihnachtliche Antworten */
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
  return { saetze, tipp: kurz(tipp), grad, richtig: tipp === r, wer: id.replace(/-w$/, ""), weih };
}

/* ---------- Zweiter Telefonjoker-Kontakt: Pastor Aaron (6.42) ----------
   Aaron ist Amerikaner (geboren in Iowa), hat am Faith Baptist Bible College Theologie studiert – wie Willi –, arbeitet in Deutschland und wohnt mit seiner Frau Eliza in Eichstätt. Eliza kommt aus Russland,
   spielt Querflöte und ist sehr musikalisch. Aaron weiß alles über Star Wars und liebt amerikanisches BBQ.
   Star Wars darf bei ihm oft vorkommen – auch wenn der Bezug manchmal etwas konstruiert ist. */
const AARON_HALLO = [
  "Hey, hier ist Aaron! Oh, „Wer wird Biblionär?“ – awesome, schieß los!",
  "Aaron hier – sorry, Eliza übt gerade Querflöte, ich geh kurz raus … Okay, ich höre!",
  "Hallo! Aaron am Apparat. Ich hab gerade „Das Imperium schlägt zurück“ pausiert – für dich mach ich das gern.",
  "Hi! Moment, ich wisch mir nur die BBQ-Sauce von den Fingern … So, go!",
  "Hey, Aaron hier! Ich bin im Supermarkt und suche verzweifelt Erdnussbutter. Aber für dich hab ich Zeit.",
  "Aaron speaking – oh, sorry, Gewohnheit! Hier ist Aaron. Was gibt's?",
  "Hallo! Ich hab gerade versucht, Elizas Katze „Sitz“ beizubringen. Sie hat mich ignoriert. Deine Frage ist bestimmt leichter.",
  "Hi, hier Aaron! Eliza lässt dich grüßen – auf Russisch: Privet!",
  "Hi, Aaron hier – Grüße aus Eichstätt und ein bisschen aus Iowa! Womit kann ich helfen?",
  "Aaron hier! Ich sortiere gerade meine Lego-Raumschiffe … äh, ich meine: meine Predigtnotizen. Leg los!",
  "Hallo, hier Aaron – ich kämpfe gerade mit der, die, das. Bibelfragen sind einfacher als deutsche Artikel!",
  "Hey! Aaron hier. Gutes Timing – mein Pulled Pork braucht noch sechs Stunden.",
  "Aaron am Apparat! Eliza hat gerade ihre Querflöte weggelegt – du hast jetzt meine volle Aufmerksamkeit.",
  "Hey, Aaron hier! In Iowa ist es jetzt mitten in der Nacht – zum Glück wohne ich in Eichstätt. Shoot!"
];
const AARON_SICHER = [
  x => `Oh, das ist easy: ${x.X}. Steht in ${x.ref}. Da bin ich mir so sicher wie Yoda.`,
  x => `${x.X} – hundertprozentig! Lies ${x.ref} nach. Und ausnahmsweise hab ich kein mieses Gefühl dabei, wie Han Solo sagen würde.`,
  x => `Ganz klar ${x.X}. Das steht in ${x.ref} – das weiß ich so genau wie die Reihenfolge aller Star-Wars-Filme.`,
  x => `No doubt: ${x.X}. Schau in ${x.ref} – it's right there.`,
  x => `Ganz sicher ${x.X}. Steht in ${x.ref}. Eliza nickt auch – und sie hat das bessere Gedächtnis von uns beiden.`,
  x => `${x.X} – so sicher wie Pancakes am Sonntagmorgen. Lies ${x.ref}.`,
  x => `Easy one: ${x.X}! ${x.ref} – das könnte ich dir sogar auf Englisch vorlesen.`,
  x => `Das ist ${x.X}, ganz klar. ${x.ref} gehört zu meinen Lieblingsstellen.`,
  x => `${x.X} – das hatten wir am Bible College in Iowa schon im ersten Semester. Lies ${x.ref}.`
];
const AARON_SICHER_OHNE = [
  x => `Easy: ${x.X}! Das weiß ich so sicher wie die Reihenfolge der Star-Wars-Filme.`,
  x => `${x.X} – hundertprozentig! Das hab ich mit dieser App gelernt.`,
  x => `No doubt: ${x.X}. Eliza nickt auch.`,
  x => `${x.X}! Das hätte ich schon am Bible College gewusst.`
];
const AARON_ZIEMLICH_OHNE = [
  x => `I think it's ${x.X}. Ziemlich sicher – aber nicht ganz Jedi-sicher.`,
  x => `Ich tippe auf ${x.X}. Zähl lieber nochmal nach!`
];
const AARON_ZIEMLICH = [
  x => `Ich bin ziemlich sicher: ${x.X}. Ich glaube, das steht in ${x.ref}.`,
  x => `Hmm, ich sage ${x.X}. Wenn ich mich nicht irre, steht das in ${x.ref} – check das lieber nochmal.`,
  x => `I think it's ${x.X}. Wenn mein Gedächtnis mich nicht trügt: ${x.ref}.`,
  x => `Ziemlich sicher ${x.X}. ${x.ref}, glaube ich – Eliza würde jetzt sagen: „Schau nach, Aaron!“`,
  x => `Ich tippe auf ${x.X}. Steht wohl in ${x.ref}. Nicht ganz Jedi-sicher, aber fast.`
];
const AARON_SCHWANK = [
  x => `Okay, tricky … ${x.X} oder ${x.Y}? Ich spüre eine Erschütterung in der Macht. Ich würde ${x.X} nehmen, aber sicher bin ich nicht.`,
  x => `Puh, ich schwanke zwischen ${x.X} und ${x.Y}. Mein Bauchgefühl sagt ${x.X}.`,
  x => `Hmm, ${x.X} oder ${x.Y}? Das ist wie die Frage: Episode IV oder V? Ich sag ${x.X} – aber frag mich in fünf Minuten nochmal.`,
  x => `Eliza flüstert ${x.Y}, ich denke ${x.X}. Ich gehe mit ${x.X}, aber ohne Garantie.`,
  x => `Ich hab ein mieses Gefühl bei dieser Frage … ${x.X}, vielleicht auch ${x.Y}. I lean towards ${x.X}.`
];
const AARON_GERATEN = [
  x => `Sorry, da bin ich überfragt. Aus dem Bauch heraus: ${x.X} – aber verlass dich nicht drauf!`,
  x => `Ehrlich? Ich weiß es nicht. Vielleicht ${x.X}? Wie Yoda sagen würde: Schwer zu sehen, die Antwort ist.`,
  x => `Da bin ich lost. Elizas Katze ist gerade übers Handy gelaufen und hat ${x.X} gedrückt – besser weiß ich es ehrlich auch nicht.`,
  x => `No idea, sorry! Ich rate ${x.X} – ein Schuss ins Blaue, wie bei einem Sturmtruppler.`,
  x => `Puh. Ich sag ${x.X}, aber das ist reines Raten – so wie ich bei deutschen Artikeln.`,
  x => `Puh, das kam am Bible College in Iowa nicht dran – oder ich hab in der Vorlesung geschlafen. Ich rate ${x.X}.`
];
const AARON_THEMA = [
  [/Goliath/, "David gegen Goliath – das ist wie Luke gegen den Todesstern: Der Kleine gewinnt. Nur hat David nicht auf die Macht vertraut, sondern auf den Herrn (1. Samuel 17,45)."],
  [/David|Harfe|Saul\b/, "David spielte so schön Harfe, dass Saul ruhig wurde (1. Samuel 16,23). Eliza sagt, mit der Querflöte klappt das bei mir genauso."],
  [/Jericho|Posaune/, "In Jericho fielen die Mauern, als das Volk die Posaunen hörte und laut schrie (Josua 6,20) – ganz ohne Schuss. Das hätte nicht mal der Todesstern geschafft."],
  [/Sonne still|Gibeon/, "Tatooine hat zwei Sonnen – aber nur bei Josua blieb die Sonne stehen (Josua 10,13). That’s a real miracle!"],
  [/Jona\b|Ninive/, "Jona im Bauch des Fisches erinnert mich an den Millennium Falken im Bauch des Weltraum-Wurms in „Das Imperium schlägt zurück“. Beide kamen wieder raus – Jona, weil er gebetet hat (Jona 2,2)."],
  [/Daniel|Löwengrube/, "Daniel in der Löwengrube – wie Luke in der Grube mit dem Rancor! Nur brauchte Daniel keinen Trick: Gott verschloss den Löwen den Rachen (Daniel 6,23)."],
  [/Saulus|Paulus|Damaskus/, "Saulus wurde vom Verfolger zum Apostel (Apostelgeschichte 9). Darth Vader hat für seine Umkehr bis zum Ende von Episode VI gebraucht!"],
  [/Pfingsten|Zungen|Turmbau|Sprache/, "C-3PO beherrscht über sechs Millionen Kommunikationsformen. Aber zu Pfingsten hat jeder die Apostel in seiner eigenen Sprache gehört (Apostelgeschichte 2,6) – das war ein echtes Wunder."],
  [/Schilfmeer|Meer\b|Stab/, "Yoda hebt einen X-Wing aus dem Sumpf – aber ein ganzes Meer teilen wie bei Mose (2. Mose 14,21), das kann nur der lebendige Gott."],
  [/Wüste|40 Jahre|vierzig/, "40 Jahre durch die Wüste – länger als Luke auf Tatooine gelebt hat. Und Manna statt blauer Milch!"],
  [/Sintflut|Arche|Noah/, "Bei der Sintflut war die ganze Erde unter Wasser – fast wie der Planet Kamino. Gut, dass Noah eine Arche hatte (1. Mose 7)."],
  [/Jünger|Apostel\b/, "Zwölf Jünger – genau so viele Plätze hat der Hohe Rat der Jedi. Zufall? Ja, ganz eindeutig."],
  [/Isaak|Abraham/, "Abraham hat 25 Jahre auf seinen Sohn Isaak gewartet. In Star Wars geht das viel plötzlicher: „Ich bin dein Vater!“"],
  [/Salomo|Weisheit|Sprüche/, "Salomo hat Gott um Weisheit gebeten (1. Könige 3,9) – weiser als Yoda und ohne komische Satzstellung."],
  [/Psalm|Lied|sang|singen|Mirjam|Pauke|Musik|Asaf|Levit/, "Eliza sagt, die Psalmen sind die schönste Musik der Welt. Sie muss es wissen – sie spielt Querflöte, seit sie als Kind in Russland war."],
  [/Mirjam|Pauke/, "Mirjam nahm die Pauke und alle Frauen tanzten (2. Mose 15,20). Eliza hätte bestimmt ihre Querflöte mitgebracht!"],
  [/Esau|Wildbret/, "Esau war Jäger und brachte Wildbret (1. Mose 27). Ich stell mir das als Texas-Brisket vor – zwölf Stunden low and slow geräuchert."],
  [/Wachtel|Manna/, "Abends Wachteln in der Wüste (2. Mose 16,13) – ich hätte sie mit Hickory-Rauch gesmokt!"],
  [/Elia|Karmel/, "Auf dem Karmel fiel Feuer vom Himmel auf Elias Opfer (1. Könige 18,38) – eindrucksvoller als jedes Lichtschwert."],
  [/Simson|Delila/, "Simson erinnert mich an Chewbacca: unglaublich stark – und beide mit ziemlich langen Haaren (Richter 16,17)."],
  [/Bethlehem|Hirten|Stern des|Weisen/, "Der Stern über Bethlehem (Matthäus 2,9) ist mein Lieblingsstern – noch vor dem Todesstern. Okay, der ist ja auch gar kein Stern."],
  [/Leiter|Bethel/, "Jakobs Leiter bis zum Himmel (1. Mose 28,12) – früher beim Zocken hätte ich gesagt: das ultimative Level-Up! Aber in den Himmel kommt man nicht mit Punkten, sondern durch Gnade."],
  [/Goliath/, "Goliath war über sechs Ellen groß (1. Samuel 17,4) – in meinen alten Videospielen hieß so einer Endgegner. David hatte kein Extra-Leben, aber den lebendigen Gott an seiner Seite."],
  [/Lazarus/, "Lazarus nach vier Tagen aus dem Grab (Johannes 11) – in Videospielen nennt man das Extra-Leben. Aber das hier war echt: Jesus ist die Auferstehung und das Leben (Johannes 11,25)."],
  [/Talent/, "Fünf Talente verdoppelt (Matthäus 25,16) – das ist besser als jeder Highscore, den ich früher an der Konsole geschafft habe."],
  [/Matthias|\bLos\b/, "Bei Matthias wurde das Los geworfen (Apostelgeschichte 1,26) – aber kein Zufallsgenerator wie in meinen alten Games: Die Jünger haben vorher gebetet."],
  [/Löwe|Leopard|Böcklein/, "Eliza hat eine Katze, die sich für einen Löwen hält. Katzen kommen in der Bibel übrigens nicht vor – nur ihre großen Verwandten, Löwen und Leoparden."],
  [/Teufel|brüllend/, "Der Teufel geht umher wie ein brüllender Löwe (1. Petrus 5,8). Elizas Katze faucht auch manchmal so – aber die meint es nicht böse. Meistens."],
  [/Psalm|Harfe|Odem/, "Ein Psalm ist eigentlich ein Song. Eliza sagt, in Psalm 150 fehlt nur noch die Querflöte – Harfe und Zimbeln stehen ja schon drin."],
  [/Psalm 117|kürzeste/, "Psalm 117 hat nur zwei Verse – perfekt für einen jungen Padawan."],
  [/Psalm 119|Leuchte/, "Psalm 119 hat 176 Verse – länger als jede Weltraumschlacht. Und Gottes Wort ist eine Leuchte, heller als jedes Lichtschwert (Psalm 119,105)."],
  [/Hirsch|Baum an Wasser/, "Wie ein Baum an Wasserbächen (Psalm 1,3) – in Iowa sieht man eher Maisfelder bis zum Horizont. In Eichstätt an der Altmühl dafür ganz normal!"],
  [/Bathseba|Psalm 51/, "Nach seiner Schuld betete David Psalm 51: Schaffe mir, o Gott, ein reines Herz. Echte Umkehr – das hat Darth Vader erst ganz am Ende geschafft."],
  [/Berge|Psalm 121/, "Meine Hilfe kommt vom HERRN (Psalm 121,2) – nicht von den Bergen und nicht von der Macht. In Iowa gibt es eh kaum Berge – alles flach wie ein Pancake."],
  [/Hiob|Uz|Elihu/, "Hiob hat alles verloren und doch nicht aufgegeben. Bei so einem Level hätte ich früher an der Konsole längst den Controller geworfen."],
  [/Ameise|Faule/, "Geh zur Ameise, du Fauler (Sprüche 6,6)! Elizas Katze sollte den Vers mal lesen – die schläft 16 Stunden am Tag."],
  [/Furcht des HERRN|Sprüche 1/, "Yoda sagt, Furcht führt zur dunklen Seite. Aber die Furcht des HERRN ist der Anfang der Erkenntnis (Sprüche 1,7) – das ist Ehrfurcht, die helle Seite!"],
  [/tüchtige Frau|Lemuel/, "Eine tüchtige Frau – wer findet sie? (Sprüche 31,10). Ich hab meine gefunden: Eliza – sie spielt Querflöte, liebt ihre Katze und erträgt sogar meine Star-Wars-Sammlung."],
  [/Prediger|seine Zeit|nichtig/, "Alles hat seine Zeit (Prediger 3,1) – eine Zeit zum Zocken und eine Zeit zum Bibellesen. Früher hatte ich das Verhältnis falsch herum."],
  [/Hohelied|Braut|stark wie der Tod/, "Das Hohelied ist das romantischste Buch der Bibel. Eliza findet, ich sollte es öfter lesen und weniger Star Wars schauen."],
  [/Seraph|heilig, heilig|glühende/, "Heilig, heilig, heilig (Jesaja 6,3) – der beste Chorus aller Zeiten. Eliza spielt ihn auf der Querflöte, und sogar die Katze hört zu."],
  [/Jesaja 53/, "Das Lamm in Jesaja 53 ist kein Held mit Lichtschwert, sondern einer, der schweigend für uns gelitten hat. That’s the real hero."],
  [/Friedefürst/, "Friedefürst (Jesaja 9,5) – ein besserer Titel als alle Jedi-Ränge zusammen."],
  [/Adler/, "Auffahren mit Flügeln wie Adler (Jesaja 40,31) – schneller als jeder X-Wing und ganz ohne Treibstoff!"],
  [/Scharlach|Schnee/, "Weiß wie Schnee (Jesaja 1,18) – wie Hoth, nur ohne Kälte. Gottes Vergebung macht alles rein."],
  [/zu jung/, "Jeremia meinte, er sei zu jung (Jeremia 1,6). Luke dachte das auch, als Obi-Wan ihn rief. Gott sagt: Fürchte dich nicht!"],
  [/Töpfer/, "Gott formt uns wie der Töpfer den Ton (Jeremia 18). In Videospielen heißt das Charakter-Editor – aber Gott macht dabei keine Fehler."],
  [/Klagelieder|Barmherzigkeit/, "Seine Barmherzigkeit ist jeden Morgen neu (Klagelieder 3,23) – jeden Morgen ein neuer Start, ganz ohne Game Over!"],
  [/neues Herz/, "Ein neues Herz (Hesekiel 36,26) – nicht nur ein Upgrade, sondern ein komplett neues Herz. Better than any cyborg part!"],
  [/Kebar|Hesekiel 1/, "Hesekiel sah Räder voller Augen (Hesekiel 1,18). Da kommen nicht mal die besten Spezialeffekte aus Hollywood mit."],
  [/Mene|Belsazar/, "Die Schrift an der Wand (Daniel 5) – der erste Untertitel der Geschichte. Ohne C-3PO, dafür mit Daniel als Übersetzer."],
  [/Hosea|Gomer/, "Hosea liebte Gomer trotz allem. Eliza sagt, sie liebt mich trotz meiner Star-Wars-Sammlung. Fast dasselbe."],
  [/Heuschreck/, "Heuschrecken, die alles fressen (Joel 1,4) – wie Jawas, die alles mitnehmen, was nicht festgeschraubt ist."],
  [/alles Fleisch|Joel 3/, "Gott gießt seinen Geist aus über alles Fleisch (Joel 3,1) – erfüllt an Pfingsten. Viel größer als die Macht!"],
  [/Amos|Maulbeer/, "Amos war Hirte und Feigenzüchter, kein Profi-Prophet (Amos 7,14). Gott beruft gern Farmboys – siehe David. Und Luke Skywalker."],
  [/wie Wasser|Amos 5/, "Das Recht soll strömen wie Wasser (Amos 5,24) – Martin Luther King hat diesen Vers in seiner berühmten Rede zitiert. Als Amerikaner bekomme ich da Gänsehaut."],
  [/Obadja/, "Obadja ist das kürzeste Buch im Alten Testament – ein echter Speedrun durch die Prophetie!"],
  [/Edom/, "Edom – das Volk von Esau, dem Jäger. Und schon hab ich wieder BBQ-Hunger."],
  [/demütig|Micha 6/, "Recht tun, Liebe üben, demütig sein (Micha 6,8) – das ist besser als jeder Jedi-Kodex."],
  [/Habakuk|Glauben leben/, "Der Gerechte wird durch seinen Glauben leben (Habakuk 2,4) – das Neue Testament zitiert den Vers gleich dreimal. Ein echter Klassiker!"],
  [/Zephanja|Tag des HERRN/, "Der Tag des HERRN (Zephanja 1,14) – das große Finale. Und anders als bei manchen Filmreihen wird dieses Ende perfekt."],
  [/Haggai|Tempel wieder/, "Baut den Tempel wieder auf (Haggai 1,8)! Wie die Rebellen ihre Basis nach Hoth – nur mit mehr Steinen und weniger Schnee."],
  [/Esel\b|Sacharja/, "Der König kommt auf einem Esel (Sacharja 9,9) – kein Tauntaun, kein Speeder. Jesus kam demütig."],
  [/Maleachi|Zehnten/, "Maleachi ist das letzte Buch im Alten Testament – danach rund 400 Jahre Pause bis zu Johannes dem Täufer. Länger als jede Wartezeit auf die nächste Star-Wars-Episode!"],
  [/Sold der Sünde|Gnadengabe|Römer 6/, "Gottes Gnadengabe ist das ewige Leben (Römer 6,23) – kein Respawn, sondern echtes, ewiges Leben."],
  [/scheiden|Römer 8/, "Nichts kann uns von Gottes Liebe trennen (Römer 8,38-39) – nicht mal das ganze Imperium."],
  [/Rom\b|Römer 1/, "Paulus schrieb nach Rom, bevor er je dort war (Römer 1,13) – wie eine Nachricht an eine Basis, die man erst später erreicht."],
  [/1. Korinther 13|Liebe/, "1. Korinther 13 wird auf fast jeder Hochzeit gelesen. Eliza würde dazu Querflöte spielen – und ich würde einen ganzen Tag nicht über Star Wars reden. Versprochen!"],
  [/500|1. Korinther 15/, "Über 500 Zeugen auf einmal (1. Korinther 15,6) – so viele Leute standen nicht mal bei einer Star-Wars-Premiere an."],
  [/neue Schöpfung/, "Eine neue Schöpfung (2. Korinther 5,17) – nicht nur ein neuer Skin, sondern ein komplett neuer Charakter!"],
  [/Pfahl/, "Gottes Kraft ist in der Schwachheit mächtig (2. Korinther 12,9). Luke hatte eine Roboterhand und hat trotzdem gewonnen."],
  [/Frucht des Geistes|Galater 5/, "Liebe, Freude, Friede … (Galater 5,22). Elizas Katze hat davon höchstens die Freude – und die auch nur beim Fressen."],
  [/Antiochia|Galater 2/, "Paulus hat Petrus offen widersprochen (Galater 2,11) – unter Brüdern, ehrlich und in Liebe. Besser als jedes Lichtschwert-Duell."],
  [/Gnade|Epheser 2/, "Aus Gnade gerettet (Epheser 2,8) – kein Grinding, keine Achievements. Einfach geschenkt."],
  [/Waffenrüstung|Schwert des Geistes/, "Das Schwert des Geistes ist Gottes Wort (Epheser 6,17) – das einzige Schwert, das stärker ist als ein Lichtschwert."],
  [/Freut euch|Gefängnis/, "Paulus schrieb aus dem Gefängnis: Freut euch allezeit (Philipper 4,4)! Han Solo in Karbonit war da deutlich weniger fröhlich."],
  [/Kolosser|von Herzen/, "Alles von Herzen tun (Kolosser 3,23) – sogar das Katzenklo sauber machen. Eliza hat mir den Vers extra drübergeklebt."],
  [/Unterlass|Beten/, "Betet ohne Unterlass (1. Thessalonicher 5,17)! Früher hab ich ohne Unterlass gezockt – das hier ist das bessere Upgrade."],
  [/nicht arbeiten|nicht essen/, "Wer nicht arbeiten will, soll auch nicht essen (2. Thessalonicher 3,10). Das gilt bei uns auch für die Katze – sie weiß es nur leider nicht."],
  [/Jugend|Timotheus 4/, "Niemand verachte dich wegen deiner Jugend (1. Timotheus 4,12). Anakin hätte diesen Vers auch gut gebrauchen können."],
  [/Lois|Großmutter/, "Lois und Eunike haben Timotheus den Glauben vorgelebt (2. Timotheus 1,5). In Amerika sagt man: Der Glaube wird am Küchentisch weitergegeben – am besten mit Cornbread."],
  [/Kreta|Titus/, "Titus auf Kreta (Titus 1,5) – eine Insel wie Ahch-To, wo Luke sich versteckt hat. Nur hat Titus sich nicht versteckt, sondern Gemeinden aufgebaut."],
  [/Onesimus|Philemon/, "Onesimus kam als entlaufener Sklave und wurde zum geliebten Bruder (Philemon 16) – besser als jeder Plot-Twist."],
  [/Zuversicht|Hebräer 11/, "Glaube ist die Überzeugung von Dingen, die man nicht sieht (Hebräer 11,1) – wie Luke, der mit dem Helm über den Augen trainiert. Nur viel tiefer."],
  [/Melchisedek/, "Melchisedek – ein Priesterkönig ohne Stammbaum (Hebräer 7,3). Geheimnisvoller als jeder Bösewicht im Kino, aber auf der richtigen Seite."],
  [/gestern, heute/, "Jesus Christus ist derselbe gestern, heute und in Ewigkeit (Hebräer 13,8) – kein Reboot, kein Remake, keine neue Trilogie."],
  [/Werke|tot\b/, "Glaube ohne Werke ist tot (Jakobus 2,17) – wie ein Lichtschwert ohne Kristall."],
  [/Zunge|Hören/, "Schnell zum Hören, langsam zum Reden (Jakobus 1,19) – hätte ich das früher bei Online-Games beherzigt, wäre mein Chat viel freundlicher gewesen."],
  [/tausend Jahre/, "Ein Tag ist beim Herrn wie tausend Jahre (2. Petrus 3,8) – Yoda wurde 900 Jahre alt. Für Gott ist das nicht mal ein Tag!"],
  [/Gott ist|1. Johannes 4/, "Gott ist Liebe (1. Johannes 4,8) – kein Imperator, sondern ein Vater, der liebt."],
  [/vergibt|bekennen/, "Wenn wir unsere Sünden bekennen, vergibt er (1. Johannes 1,9) – kein Neustart vom letzten Speicherpunkt, sondern echte Vergebung."],
  [/Gajus|auserwählte Frau|2. Johannes|3. Johannes/, "Die kleinen Johannesbriefe sind kurz wie eine SMS – Johannes wollte lieber persönlich kommen (3. Johannes 13-14). Ich lade dich auch lieber zum BBQ ein!"],
  [/Michael|Judas 9/, "Der Erzengel Michael (Judas 9) – der echte Kommandant der himmlischen Heerscharen. Da kann kein Admiral mithalten."],
  [/Offenbarung 1,11/, "Sieben Gemeinden, sieben Briefe (Offenbarung 2–3) – wie sieben Level vor dem großen Finale."],
  [/Laodizea/, "Laodizea war lauwarm (Offenbarung 3,16) – wie BBQ, das zu lange herumsteht. Jesus will, dass wir mit ganzem Herzen dabei sind!"],
  [/klopft|vor der Tür/, "Jesus klopft an die Tür (Offenbarung 3,20). Bei uns ist meistens die Katze zuerst an der Tür – sie ist sehr neugierig."],
  [/A und das O/, "Das A und das O (Offenbarung 22,13) – Anfang und Ende. Filmreihen gehen irgendwann zu Ende, aber Jesus hat das letzte Wort."],
  [/Tränen|Perlen|neue Jerusalem/, "Im neuen Jerusalem sind die Tore aus Perlen, und es gibt keinen Tod und keine Tränen mehr (Offenbarung 21). That’s the true happy end!"],
  [/Versöhnungstag|Bock/, "Am Versöhnungstag trug ein Bock die Schuld in die Wüste (3. Mose 16) – ein Sündenbock. Jesus hat das ein für alle Mal für uns getan."],
  [/Nächsten/, "Liebe deinen Nächsten wie dich selbst (3. Mose 19,18) – auch wenn dein Nächster Darth-Vader-Fan ist."],
  [/Höre, Israel|einschärfen|5. Mose 6/, "Höre, Israel (5. Mose 6,4)! Eliza sagt, ich höre sonst nur auf die Star-Wars-Titelmelodie."],
  [/Jabez/, "Jabez betete: Erweitere mein Gebiet (1. Chronik 4,10)! In Strategiespielen wollte ich das auch immer – Jabez hat es mit Beten geschafft."],
  [/Blut vergossen|1. Chronik 22/, "David durfte den Tempel nicht bauen, sein Sohn Salomo schon. Wie bei einer Saga: Die nächste Generation vollendet die Geschichte."],
  [/Einweihung|2. Chronik 7/, "Bei der Tempelweihe fiel Feuer vom Himmel (2. Chronik 7,1) – epischer als jede Feuerwerks-Szene in einem Film."],
  [/Schriftgelehrter/, "Esra war Schriftgelehrter – ein echter Bibel-Nerd. So wie ich ein Star-Wars-Nerd bin, nur sinnvoller."],
  [/Ahija|Stücke/, "Zwölf Stücke eines Mantels (1. Könige 11,30) – wie zwölf Teile, die man in einem Videospiel einsammeln muss. Nur ging es hier um die zwölf Stämme Israels."],
  [/Esra|vorlas|vorlesen|Chronik seiner|Synagoge/, "Eliza liest abends gern vor, und die Katze schläft dabei jedes Mal ein. Bei Esras Lesung vom Morgen bis zum Mittag sind alle wach geblieben (Nehemia 8,3) – respect!"],
  [/Hesekiel 4|Dinkel/, "Hesekiels Brot aus sechs Getreidesorten (Hesekiel 4,9) – der Urahn von jedem Multigrain-Bagel in New York!"],
  [/tägliches Brot|Vaterunser/, "Unser tägliches Brot gib uns heute (Matthäus 6,11). In Amerika beten wir das auch – und meinen manchmal heimlich Pancakes."],
  [/Staub von der Erde|1\. Mose 2,7/, "Aus Staub gemacht (1. Mose 2,7) – auf Tatooine gäbe es davon reichlich. Aber nur Gott kann aus Staub einen lebendigen Menschen machen."],
  [/Rippe|erste Frau/, "Adam war begeistert, als Gott ihm Eva brachte (1. Mose 2,23). Ich versteh ihn – ohne Eliza wäre mein Leben wie Star Wars ohne Musik."],
  [/verführte Eva|Die Schlange/, "Die Schlange hat Eva mit einer Lüge reingelegt (1. Mose 3,4). Wie der Imperator bei Anakin: tolle Versprechen, mieses Ende."],
  [/Feigenbl/, "Erst Feigenblätter, dann hat Gott ihnen Kleider aus Fell gemacht (1. Mose 3,21). Upgrade unlocked – und zwar aus Gnade."],
  [/Cherub/, "Ein flammendes Schwert vor dem Garten Eden (1. Mose 3,24) – das erste Lichtschwert der Geschichte? Okay, nicht ganz. Aber fast!"],
  [/Abel|Kain/, "Soll ich meines Bruders Hüter sein? (1. Mose 4,9). Ja, Kain! Das hätten die Skywalkers auch mal lernen sollen: Pass auf deine Familie auf."],
  [/Jubal|Harfen- und Flöten/, "Jubal, der Vater aller Harfen- und Flötenspieler (1. Mose 4,21)! Eliza sagt, das ist ihr Ur-Ur-Ur-…-Kollege."],
  [/300 Ellen|Wasser der Sintflut/, "Die Arche: 300 Ellen lang, 50 breit, 30 hoch (1. Mose 6,15). Kein Sternzerstörer, aber sie hat jeden Sturm überstanden."],
  [/Raben\b.*Arche|als ersten aus der Arche/, "Noahs Rabe kam nicht zurück – typisch Rabe, würde Elizas Katze sagen. Die Taube war da zuverlässiger."],
  [/Sprache der Menschen|verwirrte Gott/, "Seit Babel gibt es viele Sprachen. Ich hab Englisch, Berlinerisch und jetzt Bayerisch gelernt – das war fast eine eigene Sprachverwirrung!"],
  [/Sterne am Himmel/, "Nachkommen wie die Sterne (1. Mose 15,5) – mehr als alle Sternsysteme einer Galaxis. Und anders als im Film ist das echt!"],
  [/Widder|Isaak opfern|Land Morija/, "Der HERR sieht vor (1. Mose 22,14) – das ist besser als jeder Plot-Twist, weil die ganze Geschichte auf Jesus hinweist."],
  [/Kamelen zu trinken|Frau für Isaak/, "Rebekka hat freiwillig zehn Kamele getränkt – das ist Gastfreundschaft, Iowa-Style!"],
  [/Ziegenb/, "Jakob im Ziegenfell (1. Mose 27,16) – das älteste Kostüm der Bibel. Mein Chewbacca-Kostüm zu Fasching war aber überzeugender."],
  [/Rahel|Laban/, "Sieben Jahre warten – und sie kamen ihm vor wie wenige Tage (1. Mose 29,20). Ich werde ungeduldig, wenn die Pizza zwölf Minuten braucht."],
  [/Becher|Benjamins Sack/, "Josef testet seine Brüder – und diesmal halten sie zusammen. Echte Familie, nicht wie bei den Sith!"],
  [/Hungersnot|Gosen/, "Josef hat sieben Jahre lang vorgesorgt – der erste Notfallplaner der Weltgeschichte. In Iowa hätte er Mais in riesige Silos gefüllt."],
  [/Haran|75 Jahre/, "Mit 75 noch umziehen! Ich hab es nur von Berlin nach Eichstätt geschafft und war danach drei Tage platt."],
  [/Frösche/, "Frösche im Bett und im Backofen (2. Mose 7,28)! Elizas Katze hätte den Spaß ihres Lebens gehabt."],
  [/Stechmücken/, "Bei den Stechmücken gaben die Zauberer auf und sagten: Das ist Gottes Finger (2. Mose 8,15)! Nicht mal Magie kommt gegen Gott an."],
  [/Wolkensäule|Feuersäule/, "Wolkensäule am Tag, Feuersäule in der Nacht – Gottes Navigation! Besser als jede Fahrplan-App in Berlin."],
  [/steinerne Tafeln|keine anderen Götter/, "In Stein gemeißelt – kein Update, kein Patch nötig. Gottes Gebote gelten immer."],
  [/Vater und deine Mutter/, "Ehre deine Eltern – Luke hat sogar bei Vader an das Gute geglaubt. Bei Gott geht es aber um mehr als Filmhelden: um Respekt und Liebe."],
  [/Mandeln|Aarons Stab/, "Ein Stab, der über Nacht blüht – sogar Yoda hätte gestaunt. Das war Gottes Zeichen, nicht die Macht. Übrigens: Ich heiße wie dieser Aaron!"],
  [/Weintraube|Kundschafter/, "Zwölf Kundschafter, zehn hatten Angst, zwei vertrauten Gott (4. Mose 14,6-9). Josua und Kaleb – the real rebels!"],
  [/Mara|bitteres Wasser/, "Bitteres Wasser wird süß (2. Mose 15,25) – wie Sweet Tea aus den Südstaaten, nur gesünder und ohne Zucker."],
  [/Elim|Wasserquellen/, "Zwölf Quellen und siebzig Palmen – das klingt nach Urlaub. Fast wie Eichstätt an der Altmühl im Sommer."],
  [/Bezaleel|Kunsthandwerker/, "Bezaleel – ein Handwerker voll Heiligem Geist! Der hätte bestimmt die besten Lego-Modelle gebaut."],
  [/Korah|verschlungen/, "Korah wollte die Macht an sich reißen – eine Rebellion auf der falschen Seite. Das endete nicht gut."],
  [/Hebräer 9,4|Bundeslade.*Manna/, "Manna, Aarons Stab und die Tafeln in der Lade – Indiana Jones hat sie gesucht, aber die echte Geschichte steht in der Bibel."],
  [/rote Schnur|Rahab/, "Rahab half den Kundschaftern und wurde eine Vorfahrin von Jesus (Matthäus 1,5). Gottes Gnade schreibt die besten Geschichten."],
  [/Jordan, als die Priester|Das Wasser blieb stehen/, "Erst als die Füße der Priester im Wasser waren, blieb der Jordan stehen. Glaube heißt: losgehen. Wie Luke, der einfach in den X-Wing stieg."],
  [/mein Haus, wir wollen/, "Ich aber und mein Haus … – inklusive Katze! Eliza sagt allerdings, die Katze dient eher sich selbst."],
  [/Gideon|Krüge|Tenne/, "300 Mann mit Posaunen und Krügen mit Fackeln (Richter 7,16) – die genialste Taktik seit dem Angriff auf den Todesstern!"],
  [/wie sie Wasser tranken/, "Gott hat Gideons Armee kleiner gemacht, damit klar ist: Der Sieg kommt vom HERRN. Wenige plus Gott sind immer genug."],
  [/Füchse/, "300 Füchse auf einmal! Simson hatte wirklich die verrücktesten Pläne der ganzen Bibel."],
  [/Haus der Philister|Wie starb Simson/, "Simsons letzter Moment – er bat Gott ein letztes Mal um Kraft. Ein Finale wie in Episode VI!"],
  [/Wo du hingehst|Orpa|Obed|Ähren/, "Ruth zog in ein fremdes Land. Eliza auch – von Russland nach Bayern. Und ich über Berlin nach Eichstätt. Wir sind eine echte Ruth-Familie!"],
  [/Jephta|Gelübde/, "Jephtas Gelübde zeigt: Erst denken, dann versprechen. Jakobus sagt: Euer Ja sei ein Ja (Jakobus 5,12)."],
  [/Schibbolet/, "An der Aussprache verraten! Bei mir reicht ein einziges „Grüß Gott“ mit amerikanischem Akzent."],
  [/salbte David|Riese verspottete|bevor er König wurde/, "Gott wählt den Jüngsten, den Hirtenjungen. Wie Luke, der Farmjunge. Gott sieht das Herz an (1. Samuel 16,7)."],
  [/dein Knecht hört/, "Samuel dachte erst, Eli ruft ihn. Ich dachte nachts mal, es ist ein Einbrecher – war aber die Katze."],
  [/echte Mutter/, "Salomos Urteil – weiser als Yoda und ohne das Schwert wirklich zu benutzen. Eine echte Mutter würde ihr Kind nie teilen lassen."],
  [/Israel und Juda|Jerobeam|Rehabeam/, "Das Reich zerbrach in Nord und Süd – ein Riss tiefer als jeder Streit unter Star-Wars-Fans über die neuen Filme."],
  [/Nabot/, "König Ahab hat geschmollt wie ein Kind, weil er Nabots Grundstück nicht bekam (1. Könige 21,4). Elizas Katze schmollt würdevoller."],
  [/Säuseln/, "Gott sprach ganz leise (1. Könige 19,12). In Berlin hätte Elia das nie gehört – viel zu laut dort!"],
  [/Eisen der Axt/, "Eine schwimmende Axt – Physik-Level: Wunder. Nicht mal Yoda hätte das so elegant gemacht."],
  [/Joas/, "Mit sieben Jahren König! Anakin war neun beim Podrennen – Joas war noch jünger."],
  [/Sanherib|Hiskia/, "Sanherib prahlte, Hiskia betete – und Gott rettete Jerusalem. Großmaul gegen Gebet: Das Gebet gewinnt."],
  [/Standbild/, "Gold, Silber, Bronze, Eisen – und ein einziger Stein macht alles platt (Daniel 2,34). Das Original aller Endgegner!"],
  [/offenen Fenster|Daniel 6,11/, "Daniel betete dreimal täglich – sogar als es verboten war. Das ist Disziplin, echter als jeder Jedi-Kodex."],
  [/Rizinus/, "Jona war sauer, weil eine Pflanze verdorrte (Jona 4,9). Ich war mal sauer, weil mein Spielstand weg war. Gott zeigt: Menschen sind wichtiger."],
  [/3 Tage und 3 Nächte/, "Jesus selbst nennt Jona als Zeichen für seine drei Tage im Grab (Matthäus 12,40). Das beste Foreshadowing der Weltgeschichte!"],
  [/Herberge|Windeln/, "Kein Platz in der Herberge – wir hätten sofort das Gästezimmer freigemacht. Die Katze hätte sogar ihr Körbchen geteilt. Vielleicht."],
  [/Weisen|Stern des Königs|Herodes/, "Die Weisen sind einem Stern gefolgt – ohne Hyperantrieb, zu Fuß und auf Kamelen. Respekt!"],
  [/Zacharias|hüpfte|Elisabeth/, "Zacharias konnte monatelang nicht reden – Eliza sagt, bei mir und Star Wars wäre das die perfekte Lösung."],
  [/erhebt den Herrn|Lobgesang/, "Marias Lobgesang ist eines der ältesten Lieder der Christenheit. Eliza hat sich eine Melodie dazu auf der Querflöte ausgedacht – wunderschön."],
  [/Turteltauben/, "Turteltauben als Opfer – Jesu Eltern waren nicht reich. Der König aller Könige kam ganz bescheiden."],
  [/Haus Davids|Geschlecht/, "Josef aus dem Haus Davids – die Verheißung an David wurde in Jesus erfüllt. Eine Saga über tausend Jahre!"],
  [/Fürchtet euch nicht|große Freude/, "Große Freude für alle – nicht nur für Hirten, sondern für alle Völker. Auch für Texaner, Russinnen und Bayern!"],
  [/gebot dem Wind/, "Jesus stillt den Sturm mit einem Wort – kein Jedi-Trick, sondern Schöpfermacht."],
  [/durch das Dach/, "Vier Freunde graben sich durchs Dach – the ultimate squad! Solche Freunde braucht jeder."],
  [/Sprich nur ein Wort/, "Der Hauptmann vertraute Jesu Wort über die Entfernung. Kein Hologramm nötig – Jesus heilt auch aus der Ferne!"],
  [/Blutfluss/, "Nur das Gewand berührt – und Jesus merkte es sofort. In der ganzen Menge hat er genau sie gesehen."],
  [/Hälfte seiner Güter|Zachäus/, "Zachäus war klein, aber Jesus sah ihn. Wie Yoda sagt: Size matters not. Bei Jesus zählt jeder."],
  [/Speichel|Siloah|Blindgeboren/, "„Ich war blind und bin jetzt sehend“ (Johannes 9,25) – mein Lieblingssatz im ganzen Kapitel. Einfach, ehrlich, stark."],
  [/sieben Broten|4000/, "Sieben Brote, 4000 Männer – und sieben Körbe übrig (Matthäus 15,37). Catering auf göttlichem Level!"],
  [/Stater/, "Eine Münze im Fischmaul – Jesus hatte für alles eine Lösung. Sogar für die Tempelsteuer."],
  [/Kephas/, "Kephas heißt Fels – Petrus, the Rock! Der Fels hatte Risse, aber Jesus hat ihn trotzdem gebraucht."],
  [/Zebedäus|Bethsaida/, "Jakobus und Johannes hießen „Donnersöhne“ (Markus 3,17) – coolere Spitznamen als jede Jedi-Einheit!"],
  [/eingeborenen Sohn/, "John 3:16 – in Amerika steht das auf Schildern im Football-Stadion. In Eichstätt eher nicht, aber wahr ist es trotzdem!"],
  [/Salz der Erde/, "Salz der Erde – ohne Salz kein gutes BBQ-Rub! Jesus wusste, wovon er redet."],
  [/mit unseren Feinden/, "Liebt eure Feinde – das sagt Jesus. Nicht nur tolerieren, sondern lieben. Das ist die echte helle Seite."],
  [/Kinder zu mir/, "Jesus hatte immer Zeit für Kinder. In unserer Gemeinde lieben die Kinder vor allem den Kuchen danach – aber das ist auch ein Anfang!"],
  [/Licht der Welt/, "Ich bin das Licht der Welt – heller als jedes Lichtschwert, und ganz ohne Batterie."],
  [/Weinstock, ihr seid/, "Ohne mich könnt ihr nichts tun (Johannes 15,5). Das ist kein Solo-Game, das ist Koop-Modus mit Jesus."],
  [/sein Leben für die Schafe/, "Der gute Hirte gibt sein Leben – kein Held, der nur kämpft, sondern einer, der sich opfert."],
  [/Kämmerlein/, "Beten im Kämmerlein – bei uns ist das der Abstellraum. Da hört man Elizas Flöte nur noch ganz leise."],
  [/morgigen Tag/, "Jeder Tag hat seine eigene Plage – wie jedes Level seinen eigenen Boss. Aber Jesus sagt: Sorgt euch nicht!"],
  [/Nadelöhr/, "Unmöglich? Bei Gott sind alle Dinge möglich (Matthäus 19,26)!"],
  [/Erbteil|hütete der verlorene/, "Der verlorene Sohn landete ganz unten – und der Vater rannte ihm entgegen. Das ist Gnade, keine Strafe."],
  [/Priester und ein Levit/, "Der Samariter – der Außenseiter wird zum Helden. Wie Han Solo, der am Ende doch zurückkommt!"],
  [/sei mir Sünder/, "Der Pharisäer prahlte, der Zöllner bat um Gnade – und ging gerechtfertigt heim. Demut gewinnt."],
  [/Scheunen/, "Größere Scheunen – wie ich mit meiner Lego-Sammlung. Jesus sagt: Sei reich bei Gott. Okay, okay …"],
  [/Sanftmütig/, "Die Sanftmütigen erben das Land – nicht die mit der größten Flotte. Sorry, Imperium!"],
  [/Hosianna|Kleider und Zweige/, "Hosianna – ein Empfang wie für einen König. Kein roter Teppich, sondern Kleider und Zweige!"],
  [/Geldwechsler|Händler/, "Jesus räumt den Tempel auf: Ein Bethaus soll er sein (Matthäus 21,13), kein Marktplatz."],
  [/wusch ihnen die Füße/, "Der König wäscht Füße! Stell dir vor, ein Imperator hätte das getan … unmöglich. Jesus ist ganz anders."],
  [/Kuss/, "Verrat mit einem Kuss – schlimmer als Lando in der Wolkenstadt. Und Jesus nannte ihn trotzdem noch „Freund“ (Matthäus 26,50)."],
  [/schliefen/, "Jesus kämpfte im Gebet, die Jünger schliefen. Der Geist ist willig, aber das Fleisch ist schwach (Matthäus 26,41) – wie wahr."],
  [/dein Wille geschehe/, "Nicht mein Wille – das ist das Gegenteil von Anakin. Jesus hat sich dem Vater ganz hingegeben."],
  [/vollbracht/, "Es ist vollbracht! Mission complete – und zwar für immer."],
  [/vergib ihnen/, "Vergebung am Kreuz – Jesus betet für die, die ihn kreuzigen. Größer geht Liebe nicht."],
  [/Vorhang/, "Der Vorhang zerriss von oben nach unten – kein Mensch hat ihn zerrissen, sondern Gott. Freier Zugang zum Vater!"],
  [/Wahrhaftig, dieser/, "Ausgerechnet ein römischer Offizier erkennt es zuerst – wie ein Sturmtruppler, der die Seiten wechselt."],
  [/Myrrhe und Aloe/, "Nikodemus brachte etwa hundert Pfund Myrrhe und Aloe – vom heimlichen Fragesteller zum offenen Jünger."],
  [/Gärtner/, "Maria hielt ihn für den Gärtner – bis er ihren Namen sagte. Gänsehaut-Moment, besser als jedes Wiedersehen im Kino."],
  [/153/, "153 Fische, und das Netz zerriss nicht! Jesus kennt sich sogar mit Fischerei besser aus als die Profis."],
  [/hast du mich lieb/, "Dreimal fragt Jesus Petrus – dreimal Wiederherstellung. Jesus gibt zweite Chancen."],
  [/Wolke nahm ihn/, "Und die Engel sagten: Er kommt genauso wieder (Apostelgeschichte 1,11). The best is yet to come!"],
  [/Korb über die Mauer/, "Flucht im Korb über die Stadtmauer – eine Szene wie aus einem Actionfilm!"],
  [/nichts mehr sehen|Saulus, bevor/, "Vom Verfolger zum Apostel – die größte Kehrtwende der Geschichte."],
  [/Rhode|befreite Petrus/, "Petrus wird befreit, klopft an – und Rhode lässt ihn vor Freude draußen stehen. Comedy in der Apostelgeschichte!"],
  [/Areopag|Athen/, "Paulus predigte vor Philosophen auf dem Areopag – und erklärte ihnen den unbekannten Gott. Respekt!"],
  [/Kerkermeister|damit ich gerettet werde/, "Mitternacht, Gefängnis, Lobgesang, Erdbeben – und der Kerkermeister findet zum Glauben. Besser als jeder Film."],
  [/Otter/, "Eine Otter beißt Paulus – und nichts passiert! Elizas Katze hätte die Schlange vorher erwischt."],
  [/Artemis|Ephesus/, "Zwei Stunden Geschrei für Artemis – lauter als Fans im Stadion. Aber Götzen sind stumm; nur der lebendige Gott antwortet."],
  [/finstere Tal/, "Im finsteren Tal ist der Hirte dabei – näher als Obi-Wan bei Luke."],
  [/Psalm 103/, "Lobe den HERRN, meine Seele – und vergiss nicht, was er dir Gutes getan hat. Weiter als von Berlin nach Iowa reicht seine Gnade."],
  [/eigenen Verstand/, "Vertraue dem HERRN von ganzem Herzen – nicht dem eigenen Verstand und auch nicht der Macht."],
  [/sanfte Antwort/, "Eine sanfte Antwort – das hätte ich in meiner Online-Gaming-Zeit wissen sollen!"],
  [/Prediger 12,1|Prediger 3,11/, "Gott hat die Ewigkeit in unser Herz gelegt (Prediger 3,11) – darum macht uns kein Highscore der Welt wirklich satt."],
  [/41,10/, "Yoda sagt: Furcht führt zur dunklen Seite. Gott sagt: Fürchte dich nicht, ich halte dich mit meiner rechten Hand (Jesaja 41,10)."],
  [/Immanuel/, "Immanuel – Gott mit uns. Nicht in einer weit entfernten Galaxis, sondern ganz nah."],
  [/Mandelzweig/, "Im Hebräischen klingt „Mandelzweig“ fast wie „wachen“ – ein Wortspiel von Gott selbst (Jeremia 1,11-12). God has humor!"],
  [/Jeremia 29,11/, "Jeremia 29,11 hängt in Amerika bei vielen an der Wand. Bei uns in Eichstätt jetzt auch – direkt neben dem Star-Wars-Poster."],
  [/Tiefe des Meeres/, "Sünden in der Tiefe des Meeres – kein Speicherstand, kein Wiederherstellen. Vergeben ist vergeben!"],
  [/Hesekiel 3,1|eine Buchrolle/, "Gottes Wort essen – süß wie Honig (Hesekiel 3,3). Süßer als jeder Pancake-Sirup!"],
  [/Messschnur/, "Gott selbst wird eine feurige Mauer rings um Jerusalem sein (Sacharja 2,9). Besser als jeder Schutzschild einer Rebellenbasis!"],
  [/Philipper 4,13/, "Philipper 4,13 steht in Amerika auf vielen Sporttrikots. Aber es geht um Zufriedenheit in allem, nicht um Touchdowns."],
  [/Römer 3,23/, "Alle haben gesündigt – Pastoren, Pianisten, Programmierer. Darum brauchen wir alle Jesus."],
  [/Römer 8,28/, "Alle Dinge dienen zum Besten – Gott schreibt auch aus schweren Kapiteln ein gutes Ende."],
  [/Tempel des Heiligen Geistes/, "Unser Leib ist ein Tempel – Eliza meint, meiner braucht weniger BBQ-Soße. Sie hat wahrscheinlich recht."],
  [/Alle Schrift/, "Alle Schrift ist von Gott eingegeben – kein Fan-Fiction, sondern Gottes Wort."],
  [/1\. Petrus 5,7/, "Werft eure Sorge auf ihn, denn er sorgt für euch – kein Algorithmus, sondern ein Vater."],
  [/Offenbarung 22,21|letzte Vers/, "Das letzte Wort der Bibel ist Gnade – kein Cliffhanger, sondern das perfekte Finale."],
  [/zweischneidige/, "Schärfer als jedes Schwert – sogar als ein Lichtschwert. Und es trifft mitten ins Herz."],
  [/lachte/, "Sara lachte – und Gott machte daraus den Namen Isaak, „er lacht“. God turned a laugh into a promise!"],
  [/Isaak heiratete/, "Isaak und Rebekka – eine Liebesgeschichte mit Brunnen und Kamelen. Romantischer als Han und Leia!"],
  [/betrunken/, "Hanna betete so innig, dass Eli sie falsch verstand. Echte Gebete sind manchmal ungewöhnlich – und Gott hört sie."],
  [/Füße und trocknete/, "Das Haus war erfüllt vom Duft der Narde. Bei uns ist es meistens der Duft von Pulled Pork."],
  [/Scherflein/, "Zwei kleine Münzen – und für Jesus mehr als alles Gold. Das ist Gottes Mathematik!"],
  [/viel beschäftigt/, "Martha arbeitete, Maria hörte zu (Lukas 10,40-42). Eliza sagt, ich bin eher Maria – aber nur beim Zuhören von Star-Wars-Podcasts."],
  [/Michal/, "Michal rettet David durchs Fenster und legt eine Figur ins Bett – eine Ablenkung, wie sie R2-D2 nicht besser hinbekommen hätte."],
  [/Abigail/, "Abigail stoppt David mit einem riesigen Picknick – Brot, Feigenkuchen und fünf zubereitete Schafe. BBQ-Diplomatie!"],
  [/Priscilla/, "Aquila und Priscilla – ein Ehepaar im Dienst für Gott. Eliza und ich versuchen das auch: Sie macht die Musik, ich das BBQ."],
  [/Phöbe/, "Phöbe hat wahrscheinlich den Römerbrief nach Rom gebracht – die wichtigste Briefträgerin der Geschichte!"],
  [/Jochebed|Hebammen/, "Zwei Hebammen gegen den Pharao – eine kleine Rebellenallianz mit großem Glauben!"],
  [/Obergemach|Schunemiterin/, "Ein eigenes Gästezimmer für den Propheten! In Berlin hätte Elisa dafür monatelang eine Wohnung suchen müssen."],
  [/Hulda/, "Der König schickte zu Hulda – und sie sagte klar, was Gott sagt. Mutig und treu."],
  [/wie eine Taube|Taufe Jesu auf ihn/, "Der Heilige Geist wie eine Taube – sanft und friedlich. Ganz anders als ein Sternzerstörer."],
  [/Hahn/, "Der Hahn krähte – Petrus' tiefster Moment. Aber Jesus hat ihm später einen Neustart geschenkt."],
  [/Lamm Gottes/, "Das Lamm Gottes – der wahre Held kommt zuerst als Lamm. Und am Ende als Löwe (Offenbarung 5)!"],
  [/Stamm Juda/, "Der Löwe aus Juda! Elizas Katze hält sich auch für einen Löwen – ihr größter Sieg war gegen eine Wollmaus."],
  [/In welche Tiere|Dämonen/, "Die Dämonen mussten Jesus gehorchen. Er hat Macht über alle Finsternis – stärker als jeder Sith."],
  [/wie die Schlangen/, "Klug wie Schlangen, sanft wie Tauben – die perfekte Balance. Nur biblisch, nicht jedi-mäßig."],
  [/Stroh/, "Löwen, die Stroh fressen – im Friedensreich wird sogar Elizas Katze friedlich. Hoffentlich."],
  [/reinen Tiere|Je sieben/, "Sieben von jeder reinen Art – Noah, der erste Tiersammler der Geschichte."],
  [/Lukas 12,24/, "Die Raben säen nicht, und Gott ernährt sie trotzdem. Elizas Katze arbeitet auch nicht – und bekommt trotzdem Futter. Von mir."],
  [/Amalekiter/, "Saul wollte es auf seine Art machen – und Samuel sagte: Gehorsam ist besser als Opfer (1. Samuel 15,22)."],
  [/Tarsus/, "Paulus aus Tarsus, ich aus Iowa – Gott holt seine Leute von überall her!"],
  [/Bethesda/, "Jesus fragte: Willst du gesund werden? (Johannes 5,6). Manchmal ist das die wichtigste Frage überhaupt."],
  [/\bSilo\b/, "Silo – da wuchs Samuel auf. Sozusagen sein Training: Rede, Herr, dein Knecht hört."],
  [/Kidron/, "Über den Kidron nach Gethsemane – der schwerste Weg der Geschichte. Jesus ging ihn freiwillig."],
  [/Terebinthen/, "Bei Mamre hat Abraham seinen Gästen ein Festmahl gemacht (1. Mose 18,6-8). Gastfreundschaft wie bei uns in Iowa, nur 4000 Jahre früher."],
  [/See von Galiläa/, "Am See ließen die Fischer ihre Netze liegen und folgten Jesus. Ich hab dafür meinen Controller weggelegt – kleinerer Schritt, aber immerhin!"],
  [/Nach Babel/, "An den Strömen Babels saßen sie und weinten (Psalm 137,1). Eliza kennt Heimweh – dann spielt sie russische Lieder. Aber unsere Heimat ist im Himmel."],
  [/Schiffbruch/, "Schiffbruch auf dem Weg nach Rom – epischer als jede Weltraumschlacht. Und alle überlebten!"],
  [/sende mich/, "Jesaja meldete sich sofort. Luke brauchte länger – aber am Ende sind beide losgegangen."],
  [/lebendigen Gottes/, "Petrus' Bekenntnis – darauf baut Jesus seine Gemeinde, und die Pforten des Totenreichs werden sie nicht überwältigen (Matthäus 16,18)."],
  [/Mein Herr und mein Gott/, "Thomas – vom Zweifler zum Bekenner. Wie Han Solo, der zuerst an nichts glaubte. Nur dass Thomas den echten Herrn sah."],
  [/Komme ich um/, "Esther ging ungerufen zum König – mutiger als jede Prinzessin im Kino!"],
  [/Was ist Wahrheit/, "Pilatus fragte nach der Wahrheit und ging dann einfach weg. Da hat er die wichtigste Antwort der Geschichte verpasst."],
  [/Silber und Gold/, "Kein Silber, kein Gold – aber im Namen Jesu: Steh auf und geh! Besser als alle Credits von Tatooine."],
  [/zum Pharao gehen/, "Mose fühlte sich unfähig – wie Luke vor Yoda. Aber Gott sagt: Ich bin mit dir. Das zählt."],
  [/stark und mutig/, "Sei stark und mutig – denn der HERR ist mit dir, wo du hingehst. Auch nach Eichstätt!"],
  [/denk an mich/, "Ein Verbrecher in letzter Minute gerettet – Gottes Gnade hat keine Deadline."],
  [/Erlöser lebt/, "Hiob sagt das mitten im tiefsten Leid. Das ist Glaube auf dem höchsten Schwierigkeitsgrad."],
  [/entlässt du deinen Knecht/, "Simeon wartete sein ganzes Leben auf diesen Moment. Ich warte nur auf die nächste Serie – das ist nichts dagegen."],
  [/muss abnehmen/, "Johannes wusste, dass er nicht der Held ist – ein Wegbereiter, der auf Jesus zeigt."],
  [/guten Kampf/, "Den guten Kampf gekämpft – der Abschied des Paulus ist bewegender als jedes Serienfinale."],
  [/mehr gehorchen/, "Gott mehr gehorchen als Menschen – die Apostel waren echte Rebellen, aber für die gute Sache."],
  [/Unglauben/, "Das ehrlichste Gebet der Bibel – und Jesus hat den Vater nicht weggeschickt, sondern geholfen."],
  [/Ähren|Boas/, "Rut sammelte Ähren auf dem Feld des Boas (Rut 2,3). In Iowa wären das Maisfelder – da kann man sich glatt verlaufen."],
  [/Sämann|Saat\b|Samen/, "Das Gleichnis vom Sämann versteht in Iowa jedes Kind – dort wird im Frühling halb Amerika eingesät. Gottes Wort braucht guten Boden!"],
  [/Missionsbefehl|Gehet hin|alle Völker|Missionsreise|Barnabas/, "Geht hin in alle Welt! Ich bin vom Bible College in Iowa bis nach Eichstätt gegangen – Pastor Willi und Heidi haben denselben Weg genommen."]
];
const AARON_ALLG = [
  "Eliza übt im Nebenzimmer Querflöte – wenn du genau hinhörst: Es ist die Star-Wars-Titelmelodie. Ich hab sie überredet.",
  "Was ich an Eichstätt liebe? Die Gemeinde. Was ich vermisse? Richtiges amerikanisches BBQ.",
  "Eliza kommt aus Russland, ich aus Iowa, und wir wohnen in Eichstätt – bei uns ist es fast wie in der Cantina von Mos Eisley, nur viel friedlicher.",
  "Wenn du die Million holst, lade ich dich zu Burgern und Spare Ribs ein – American Style!",
  "Möge die Macht mit dir sein – nein, Moment: Der Herr sei mit dir! Das ist viel besser.",
  "Yoda sagt: Tu es oder tu es nicht, es gibt kein Versuchen. Ich sag: Erst beten, dann tippen!",
  "Im Hintergrund meint Eliza gerade, ich soll weniger über Star Wars und mehr über die Bibel reden. Sie hat recht.",
  "Pulled Pork, Mac and Cheese, Cornbread … sorry, ich hab gerade Hunger bekommen.",
  "Früher hab ich nächtelang Videospiele gezockt. Heute sammle ich lieber Bibelverse – much better Highscore!",
  "Elizas Katze sitzt gerade auf meiner Bibel. Ich glaube, sie will auch mitspielen.",
  "Achtung, Elizas Katze läuft über mein Handy – falls ich gleich komisch klinge, war sie das.",
  "Funfact: In Amerika gibt es Kirchen mit Drive-in. In Eichstätt gibt es dafür die schöneren Kirchtürme.",
  "Eliza hat mir beigebracht, Borschtsch zu kochen. Ich hab ihr beigebracht, Ribs zu smoken. Fairer Deal.",
  "Die Katze hat heute meinen Lego-Millennium-Falken umgeworfen. Ich vergebe ihr – siebzigmal siebenmal (Matthäus 18,22).",
  "Deutsch ist schwer: Warum heißt es „das Mädchen“, aber „die Gemeinde“? Die Bibel ist da manchmal einfacher.",
  "Mein deutscher Lieblingssatz: „Gottes Segen und guten Appetit!“ Passt immer.",
  "Ich träume von einem Thanksgiving-Truthahn für die ganze Gemeinde. Eliza meint, dafür ist unser Ofen zu klein.",
  "Eliza spielt gerade „Amazing Grace“ auf der Querflöte. Gänsehaut – sogar die Katze hält still.",
  "In Texas sagt man: Everything is bigger in Texas. Aber Gottes Gnade ist noch größer – sogar größer als Texas!",
  "Meine Bibel-App läuft im Dunkelmodus. Nicht wegen der dunklen Seite – nur wegen der Augen.",
  "Eliza sagt, ich rede beim Telefonieren zu viel. Okay, okay – zurück zur Frage!",
  "In Amerika sagen wir „awesome“ zu allem. Aber bei Gott passt es wirklich: ehrfurchtgebietend.",
  "Ich hab Eliza „Wer wird Biblionär?“ gezeigt. Jetzt will sie gegen mich spielen – ich hab ein bisschen Angst.",
  "Ich hab lange in Berlin gewohnt – da war Currywurst mein BBQ-Ersatz. Eichstätt ist ruhiger, aber ich vermisse den Lärm kein bisschen.",
  "In Berlin sagt man „icke“, in Bayern „i“, in Texas „y’all“. Ich sag einfach: Gott segne dich!",
  "Nach Berlin ist Eichstätt wie ein Planet nach einem Weltraumbahnhof: ruhig, grün und mit viel besseren Leuten.",
  "Ich komme aus Iowa – da gibt es mehr Schweine als Menschen und Mais bis zum Horizont. Eichstätt hat dafür die Altmühl.",
  "Ich hab am Faith Baptist Bible College in Iowa Theologie studiert. Pastor Willi übrigens auch – same school! Iowa-Theologen halten zusammen.",
  "Fun fact: Heidi, die Frau von Pastor Willi, kommt auch aus Iowa. Wenn wir uns treffen, reden wir nur über Mais und Schneestürme.",
  "Auf der Iowa State Fair gibt es jedes Jahr eine Kuh aus Butter – in Lebensgröße. Kein Witz! Pancakes dazu, und ich bin glücklich.",
  "In Iowa sagen alle „Midwest nice“: freundlich, hilfsbereit, ein bisschen zurückhaltend. Klingt fast wie Eichstätt!"
];
const AARON_SW = [
  "Und vergiss nicht: Die helle Seite gewinnt am Ende immer – in Star Wars und erst recht in der Bibel.",
  "Übrigens: Ich hab ein Lichtschwert-Lesezeichen in meiner Bibel. Blau, natürlich.",
  "Ein Jedi wird man durch Training – ein Biblionär auch. Weiter so, junger Padawan!",
  "Wie Obi-Wan sagen würde: Das ist die Antwort, nach der du suchst.",
  "Fun fact: „Möge die Macht mit dir sein“ klingt fast wie „Der HERR sei mit euch“ aus Rut 2,4. Ich sag ja: Die Bibel war zuerst!",
  "Ich hab alle Star-Wars-Filme bestimmt zehnmal gesehen. Die Bibel lese ich aber noch öfter – promise!",
  "Wie Yoda sagen würde: Stolz du sein kannst, wenn richtig die Antwort ist.",
  "Mein Wecker spielt morgens den Imperialen Marsch. Eliza findet das nicht lustig.",
  "R2-D2 würde jetzt fröhlich piepen. Ich piepe einfach mit: Biep-bup!",
  "Jedi-Tipp: erst Ruhe, dann Antwort. Christen-Tipp: erst Gebet, dann Antwort. Ich mache beides.",
  "Iowa im Januar fühlt sich an wie Hoth. Da hätte ich auch gern einen Tauntaun gehabt – oder wenigstens eine Heizdecke.",
  "Fun fact: Captain Kirk soll mal in Iowa geboren werden – aber das ist die falsche Galaxis. Bei mir zählt nur Star Wars!"
];
const AARON_TSCHUESS = ["Der Herr sei mit dir – always!", "Good luck! Eliza spielt dir einen Tusch auf der Querflöte.", "Okay, ich muss zurück zum Smoker. God bless!", "Bis Sonntag in der Gemeinde – see you!",
  "Möge … äh, der Herr mit dir sein! Bye!",
  "Gotta go – die Katze hat die BBQ-Soße entdeckt. God bless!",
  "Da swidanija, wie Eliza sagt – und Gottes Segen von mir!",
  "Okay, ich muss los – Episode V läuft noch auf Pause. Be blessed!",
  "Take care! Ich bete für dich – wirklich, nicht nur so dahergesagt.",
  "See you later, alligator! Gott segne dich.",
  "Bye! Und grüß die Gemeinde von mir – oh wait, ich seh sie ja am Sonntag."];
/* Pastor Aaron als Porträt: kurze Haare, freundliches Lächeln, blaues Lichtschwert */
const AARON_BILD = `<svg class="willi-bild" viewBox="0 0 96 96" aria-hidden="true"><defs><radialGradient id="aaH" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#7fc8ff" stop-opacity=".45"/><stop offset="1" stop-color="#7fc8ff" stop-opacity="0"/></radialGradient><linearGradient id="aaHaut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe6cf"/><stop offset="1" stop-color="#f0c29c"/></linearGradient><linearGradient id="aaHemd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9563f"/><stop offset="1" stop-color="#7a2a25"/></linearGradient></defs>
<circle cx="48" cy="48" r="47" fill="url(#aaH)"/><circle cx="48" cy="48" r="38" fill="#1b2146" stroke="url(#wrG)" stroke-width="3"/>
<clipPath id="aaK"><circle cx="48" cy="48" r="36.5"/></clipPath><g clip-path="url(#aaK)">
<path d="M18 92c2-17 14-24 30-24s28 7 30 24z" fill="url(#aaHemd)" stroke="#1b2a55" stroke-width="1.4"/><path d="M40 70l8 8 8-8" fill="#f6f1e6" stroke="#1b2a55" stroke-width="1.2"/>
<path d="M43 61h10v8h-10z" fill="url(#aaHaut)"/>
<ellipse cx="48" cy="45" rx="15" ry="17" fill="url(#aaHaut)" stroke="#1b2a55" stroke-width="1.4"/>
<path d="M33 41c-1-11 6-17 15-17 9 0 16 5 15 17-2-5-6-8-11-8-5 2-11 3-17 1-1 2-2 4-2 7z" fill="#c69a5a" stroke="#1b2a55" stroke-width="1.2"/>
<circle cx="42.5" cy="45" r="1.9" fill="#1b2a55"/><circle cx="53.5" cy="45" r="1.9" fill="#1b2a55"/><path d="M39 41q3.5-1.6 7 0M50 41q3.5-1.6 7 0" stroke="#8a6232" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<path d="M41.5 53q6.5 5.5 13 0" fill="#fff" stroke="#3a1e08" stroke-width="1.6" stroke-linecap="round"/>
<path d="M36 33q3-6 9-7" stroke="#fff" stroke-opacity=".55" stroke-width="2" fill="none" stroke-linecap="round"/></g>
<g transform="rotate(32 78 34)"><rect x="76.5" y="2" width="5" height="34" rx="2.5" fill="#bfe6ff" opacity=".35"/><rect x="77.5" y="3" width="3" height="33" rx="1.5" fill="#e9f7ff"/><rect x="76" y="35" width="6" height="14" rx="1.5" fill="url(#wrSt)" stroke="#1b2a55" stroke-width="1"/><path d="M76 39h6M76 43h6" stroke="#1b2a55" stroke-width=".8"/></g></svg>`;
/* Die beiden Kontakte des Telefonjokers. salt: eigener Zufall je Kontakt, damit Willi und Aaron nicht immer gleich antworten. */
/* Themen-Witze (6.53): wenn kein Bezug genau zur Frage passt */
const WILLI_THEMEN = {
  "Schöpfung & Urgeschichte": ["Gott hat in sechs Tagen die ganze Welt gemacht. Ich brauche für ein 1000-Teile-Puzzle länger.", "Am siebten Tag ruhte Gott – den Teil der Schöpfungsgeschichte mag ich besonders: Sonntagsruhe mit frischem Brot."],
  "Abraham bis Josef": ["Die Vätergeschichten sind ein Familienpuzzle mit vielen Teilen – erst am Ende passt alles zusammen.", "Bei Abraham, Isaak und Jakob gab es ständig Festessen. Ich fühle mich da sehr zu Hause."],
  "Mose & Wüstenzeit": ["40 Jahre Wüste – und Gott hat jeden Tag Brot geschickt. Backen musste keiner, das ist fast unfair.", "Das Volk murrte in der Wüste übers Essen. Ich murre nur, wenn es Gemüseauflauf gibt."],
  "Josua, Richter & Ruth": ["Zur Richterzeit tat jeder, was ihn recht dünkte (Richter 21,25) – wie meine Töchter, wenn Heidi und ich kurz weg sind.", "Das Buch Richter ist spannender als jeder Krimi auf Heidis Nachttisch."],
  "Könige & Propheten": ["Die Königsbücher sind wie eine lange Serie – am Ende jeder Folge heißt es: Er tat, was recht oder böse war in den Augen des HERRN.", "So viele Könige – Heidi hat für mich eine Liste an den Kühlschrank gehängt."],
  "Jesu Geburt & Kindheit": ["Bethlehem heißt „Brothaus“ – Jesus, das Brot des Lebens, kam im Brothaus zur Welt. Für einen Bäcker die schönste Geschichte!", "Weihnachten backt Heidi amerikanische Cookies und ich deutsches Brot. Völkerverständigung in der Küche!", "Weihrauch und Myrrhe als Geschenk – die Weisen wussten, was gut riecht. Heidi sagt, ich hätte ihnen gefallen."],
  "Jesu Wirken & Wunder": ["Jesus hat Kranke geheilt, Stürme gestillt und Tausende satt gemacht. Das mit dem Sattmachen beeindruckt mich als Grillmeister besonders.", "Bei Jesus gab es ständig gemeinsames Essen – mit Zöllnern, Sündern und Freunden. Tischgemeinschaft ist Evangelium!"],
  "Gleichnisse & Worte Jesu": ["Jesus hat in Bildern aus dem Alltag gesprochen – Brot, Samen, Schafe. Heute wäre vielleicht ein Grill dabei.", "Gleichnisse sind wie ein Puzzle: Erst sieht man Teile, dann plötzlich das ganze Bild.", "Jesus hat so gepredigt, dass alle zugehört haben – ganz ohne Gitarre. Ich arbeite noch dran."],
  "Leiden & Auferstehung": ["Das ist das Herz des Evangeliums – da wird selbst ein Grillmeister ganz still.", "Ostern ist das größte Fest – größer als jedes Gemeindefest. Das Grab ist leer!"],
  "Apostel & erste Gemeinde": ["Paulus war Missionar – Heidi und ich auch: aus Iowa nach Deutschland. Nur ohne Schiffbruch, Gott sei Dank.", "Die ersten Christen brachen das Brot in den Häusern (Apostelgeschichte 2,46) – Gemeinde fängt am Esstisch an!", "Die Apostelgeschichte ist voller Reisen und Schiffbrüche. Mein größtes Abenteuer war der Umzug von Ingolstadt nach Eichstätt.", "In Amerika besuchen wir jedes Jahr Gemeinden – wie Paulus, nur mit Flugzeug statt Schiff und mit deutlich mehr Parfüm im Koffer."],
  "Psalmen & Weisheit": ["Die Psalmen lese ich gern morgens – Heidi liest dazu in einem ihrer tausend Bücher.", "Weisheit beginnt mit der Furcht des HERRN. Und gutes Grillen mit Geduld.", "Die Psalmen sind das Liederbuch der Bibel. Als Musikteamleiter hätte ich David sofort ins Team geholt – Asaph als Stellvertreter."],
  "Propheten": ["Den Propheten wollte oft keiner zuhören. Kenne ich, wenn ich rufe: Das Essen ist fertig!", "Die kleinen Propheten hab ich mit dem Lied aus der App gelernt. Seitdem summe ich sie beim Teigkneten."],
  "Briefe & Offenbarung": ["Paulus schrieb so viele Briefe – ich schreibe höchstens Einkaufszettel. Hauptsache, Fleisch steht drauf.", "Die Briefe sind wie Post von einem guten Freund – nur dass Paulus manche im Gefängnis geschrieben hat."],
  "Bibelkunde": ["66 Bücher – wie ein Puzzle mit 66 Teilen. Wer alle kennt, sieht ein wunderschönes Bild.", "Die Reihenfolge der Bibelbücher hab ich mit dem Lied in unserer App gelernt. Jetzt werde ich es beim Backen nicht mehr los."],
  "Frauen der Bibel": ["Die Frauen der Bibel waren mutig, klug und treu – wie Heidi. Die ist sogar aus Iowa nach Bayern gezogen!", "Heidi hat ein ganzes Regal voller Bücher über Frauen der Bibel. Ich hab ein Regal mit Grillbüchern. Wir ergänzen uns.", "Ohne die Frauen in der Bibel gäbe es viele Geschichten gar nicht. Ohne Heidi gäbe es bei uns kein Gemüse. Na gut – das wäre mir recht.", "Ester hat sich zwölf Monate mit Öl und Duftstoffen vorbereitet (Ester 2,12). Heidi sagt, ich brauche morgens ungefähr genauso lange."],
  "Tiere der Bibel": ["Die Bibel ist voller Tiere – Löwen, Raben, Wachteln, Lämmer. Als Grillmeister sage ich zu manchen lieber nichts.", "Meine Töchter fragen, ob es im Himmel Tiere gibt. Ich sage: Jesaja 11 sieht ganz danach aus!", "In der Bibel sind Tiere oft Gottes Boten – Raben, Tauben, sogar eine Eselin. Bei uns ist der Bote meistens das Telefon."],
  "Orte & Reisen": ["Die Bibel ist ein Reisebuch – von Ur bis Rom. Ich bin bisher von Ingolstadt nach Eichstätt gekommen. Immerhin!", "Wenn ich mal ins Heilige Land fahre, will ich am See Genezareth Fisch grillen – genau wie in Johannes 21.", "Abraham ist ohne Navi losgezogen, nur mit Gottes Zusage. Ich verfahre mich mit Navi schon zwischen Ingolstadt und Eichstätt.", "Wir fliegen jedes Jahr nach Amerika – zu Heidis Familie und zu Gemeinden. Paulus wäre neidisch auf die Flugmeilen."],
  "Wer sagte das?": ["Zitate erkennen ist wie Stimmen am Telefon erkennen – manche sofort, andere erst beim zweiten Satz.", "Der Satz, den ich zu Hause am häufigsten höre? „Willi, nicht schon wieder Fleisch!“ – Heidi.", "Die Bibel ist voller großer Sätze. Mein Lieblingssatz bleibt: Es ist vollbracht."]
};
const AARON_THEMEN = {
  "Schöpfung & Urgeschichte": ["Gott sprach – und es wurde Licht. Keine Spezialeffekte nötig, nur ein Wort!", "Die Schöpfung ist das ultimative Worldbuilding – schöner als jede Galaxis im Kino.", "Der zweithäufigste Satz bei uns zu Hause: „Willi, nicht so viel Parfüm!“ Der häufigste kommt beim Grillen."],
  "Abraham bis Josef": ["Josefs Geschichte ist eine Saga in mehreren Episoden – Verrat, Gefängnis und ein Happy End.", "Familiendrama bei Jakob – fast so kompliziert wie bei den Skywalkers. Aber Gott hat Gutes daraus gemacht (1. Mose 50,20)."],
  "Mose & Wüstenzeit": ["Mose gegen den Pharao – ein Showdown, und Gott hat gewonnen. Ohne Lichtschwert!", "40 Jahre Wüste – länger als jede Mission auf Tatooine. Aber Gott war jeden Tag dabei."],
  "Josua, Richter & Ruth": ["Die Richter waren Helden mit Schwächen – der wahre Held in dem Buch ist Gott.", "Ruth ist mein Lieblingsbuch für Zugezogene – und davon gibt es bei uns zu Hause gleich zwei."],
  "Könige & Propheten": ["Die Königsbücher sind eine echte Saga – Könige kommen und gehen, Gott bleibt treu.", "Elia, Elisa, Daniel – mehr Action als jede Kinoreihe."],
  "Jesu Geburt & Kindheit": ["Weihnachten in Amerika heißt: Lichterketten überall. In Eichstätt ist es ruhiger – das Wunder ist dasselbe.", "Der Retter kam als Baby, nicht als Krieger. That’s God’s style."],
  "Jesu Wirken & Wunder": ["Jesus heilte Blinde, Lahme und Aussätzige – keine Tricks, echte Wunder.", "Jesu Wunder sind wie ein Trailer für das, was kommt: eine neue Welt ohne Krankheit."],
  "Gleichnisse & Worte Jesu": ["Jesus ist der beste Geschichtenerzähler aller Zeiten – besser als jeder Drehbuchautor in Hollywood.", "Gleichnisse sind wie Easter Eggs: Beim zweiten Lesen entdeckt man immer noch etwas Neues."],
  "Leiden & Auferstehung": ["Das Kreuz sah aus wie eine Niederlage – und war der größte Sieg der Geschichte.", "Ostern ist keine Fan-Theorie, sondern Geschichte: Er ist auferstanden!"],
  "Apostel & erste Gemeinde": ["Die Apostelgeschichte ist ein Roadtrip mit dem Heiligen Geist als Navigator.", "Die erste Gemeinde war bunt gemischt – wie unsere in Eichstätt mit Amerikanern, Russinnen und Bayern.", "Paulus ging auf Missionsreise, Willi und Heidi kamen als Missionare aus Iowa – und ich auch nach Eichstätt. Gute Tradition!"],
  "Psalmen & Weisheit": ["Eliza spielt gern Psalmen auf der Querflöte – das waren ja eigentlich Lieder.", "Die Sprüche sind wie Yoda-Weisheiten – nur in normaler Satzstellung."],
  "Propheten": ["Die Propheten sahen weit voraus – nicht durch die Macht, sondern weil Gott es ihnen gezeigt hat.", "Die kleinen Propheten sind kurz, aber kraftvoll. Wie Yoda."],
  "Briefe & Offenbarung": ["Paulus’ Briefe waren Ermutigung für kleine Gemeinden – wie Nachrichten an versprengte Rebellenbasen.", "Die Offenbarung ist das Finale – und ich hab das Ende schon gelesen: Jesus gewinnt!"],
  "Bibelkunde": ["66 Bücher – eine riesige Saga. Und anders als bei Star Wars gibt es keinen Streit über die richtige Reihenfolge.", "Ich lerne die Bibelbücher mit dieser App. Eliza ist leider schneller – sie ist eben musikalischer."],
  "Frauen der Bibel": ["Die Frauen der Bibel sind echte Heldinnen – mutiger als jede Filmprinzessin.", "Eliza sagt, bei Frauenfragen soll ich besonders gut aufpassen. Smart woman.", "Ruth, Esther, Abigail – starke Frauen. Ich kenne auch eine: Eliza, Querflötistin aus Russland."],
  "Tiere der Bibel": ["Elizas Katze kommt in der Bibel nicht vor – sie findet aber, sie hätte mindestens einen eigenen Psalm verdient.", "Von der Eselin bis zum Löwen – die Tiere der Bibel sind spannender als jedes Wesen auf Tatooine.", "Hatte Noah Katzen in der Arche? Bestimmt – sonst hätte Eliza heute keine."],
  "Orte & Reisen": ["Ich bin von Iowa über Berlin nach Eichstätt gekommen – Paulus wäre stolz auf diese Reiseroute.", "Die Bibel hat mehr Schauplätze als die ganze Star-Wars-Saga – und alle sind echt!", "In Berlin war die U-Bahn manchmal wie die Wüstenwanderung: lang, und keiner weiß, wann man ankommt."],
  "Wer sagte das?": ["Zitate zuordnen? Bei Star Wars kann ich jeden Satz. Bei der Bibel arbeite ich noch dran.", "Wer sagte das? Bei uns zu Hause meistens Eliza: „Aaron, weniger Star Wars!“", "Die Bibel hat die stärksten Sätze der Geschichte – stärker als „Ich bin dein Vater“."]
};
const PASTOREN = {
  willi: { name: "Pastor Willi", kurz: "Willi", info: "Bibelkenner & Grillmeister", bild: () => WILLI_BILD, salt: 0, quoten: [[.9, .98, .995], [.62, .86, .94], [.38, .64, .82]],
    hallo: WILLI_HALLO, sicher: WILLI_SICHER, ziemlich: WILLI_ZIEMLICH, sicherOhne: WILLI_SICHER_OHNE, ziemlichOhne: WILLI_ZIEMLICH_OHNE, schwank: WILLI_SCHWANK, geraten: WILLI_GERATEN, thema: WILLI_THEMA, themen: WILLI_THEMEN, allg: WILLI_ALLG, tschuess: WILLI_TSCHUESS },
  aaron: { name: "Pastor Aaron", kurz: "Aaron", info: "Bibelkenner & Star-Wars-Experte", bild: () => AARON_BILD, salt: 0x2c1b3c6d, quoten: [[.9, .98, .995], [.6, .85, .93], [.36, .62, .8]],
    hallo: AARON_HALLO, sicher: AARON_SICHER, ziemlich: AARON_ZIEMLICH, sicherOhne: AARON_SICHER_OHNE, ziemlichOhne: AARON_ZIEMLICH_OHNE, schwank: AARON_SCHWANK, geraten: AARON_GERATEN, thema: AARON_THEMA, themen: AARON_THEMEN, allg: AARON_ALLG, tschuess: AARON_TSCHUESS, sw: AARON_SW }
};
/* Wen rufst du an? Erst nach der Wahl ist der Joker verbraucht – Abbrechen gibt ihn zurück. */
function telefonWahl(weiter, abbruch, weih) {
  const m = modal(`<div class="label">Telefonjoker</div><h2 style="margin:0">Wen rufst du an?</h2>
    <div class="tel-wahl">${Object.entries(PASTOREN).map(([id, P]) => `<button class="tel-kontakt" data-tel="${id}">${pastorBild(P, weih)}<span><b>${P.name}</b><small>${P.info}</small></span>${svg("telefon")}</button>`).join("")}</div>
    <p class="small muted" style="margin:0">Die Uhr steht, solange du telefonierst. Du hast nur einen Anruf.</p>
    <button class="btn ghost" data-close>Doch nicht</button>`, x => { if (x !== "gewaehlt") abbruch(); });
  m.classList.add("willi-modal");
  m.querySelectorAll("[data-tel]").forEach(b => b.onclick = () => { m.remove(); weiter(b.dataset.tel); });
}
/* Pastor Willi als kleines Porträt im Stil „Himmlisches Licht“ (Bart, Grillzange) */
const WILLI_BILD = `<svg class="willi-bild" viewBox="0 0 96 96" aria-hidden="true"><defs><radialGradient id="wiH" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#b38cff" stop-opacity=".45"/><stop offset="1" stop-color="#b38cff" stop-opacity="0"/></radialGradient><linearGradient id="wiHaut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2c4"/><stop offset="1" stop-color="#e9b88e"/></linearGradient><linearGradient id="wiBart" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6a3c"/><stop offset="1" stop-color="#5e3a1c"/></linearGradient><linearGradient id="wiHemd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3d5ab8"/><stop offset="1" stop-color="#1d2f6b"/></linearGradient></defs>
<circle cx="48" cy="48" r="47" fill="url(#wiH)"/><circle cx="48" cy="48" r="38" fill="#1b2146" stroke="url(#wrG)" stroke-width="3"/>
<clipPath id="wiK"><circle cx="48" cy="48" r="36.5"/></clipPath><g clip-path="url(#wiK)">
<path d="M18 92c2-17 14-24 30-24s28 7 30 24z" fill="url(#wiHemd)" stroke="#1b2a55" stroke-width="1.4"/><path d="M42 69l6 9 6-9" fill="#fff" stroke="#1b2a55" stroke-width="1.2"/>
<circle cx="48" cy="42" r="16" fill="url(#wiHaut)" stroke="#1b2a55" stroke-width="1.4"/>
<path d="M32 40c-1 6 1 12 4 17 3 5 7 9 12 9s9-4 12-9c3-5 5-11 4-17-2 4-5 6-8 6-3-2-5-2-8-2s-5 0-8 2c-3 0-6-2-8-6z" fill="url(#wiBart)" stroke="#1b2a55" stroke-width="1.2"/>
<path d="M42 49q6 4 12 0" fill="none" stroke="#3a1e08" stroke-width="1.8" stroke-linecap="round"/><path d="M43.5 53q4.5 2.4 9 0" fill="#c4544c"/>
<path d="M33 35c0-10 7-15 15-15s15 5 15 15c-3-5-8-7-15-7s-12 2-15 7z" fill="#7a5230" stroke="#1b2a55" stroke-width="1.2"/>
<circle cx="42" cy="40" r="1.9" fill="#1b2a55"/><circle cx="54" cy="40" r="1.9" fill="#1b2a55"/><path d="M38.5 36q3.5-2 7 0M50.5 36q3.5-2 7 0" stroke="#5e3a1c" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<path d="M36 30q2-6 8-7" stroke="#fff" stroke-opacity=".55" stroke-width="2" fill="none" stroke-linecap="round"/></g>
<g transform="rotate(28 78 30)"><rect x="76" y="20" width="4" height="30" rx="2" fill="url(#wrG)" stroke="#1b2a55" stroke-width="1"/><path d="M74 21V9M78 21V7M82 21V9" stroke="url(#wrG)" stroke-width="2.4" stroke-linecap="round"/><path d="M73 21h10" stroke="#1b2a55" stroke-width="1"/></g></svg>`;
/* Das Telefonat: es klingelt, dann erzählt Willi Satz für Satz. Die Bedenkzeit steht so lange. */
const pastorBild = (P, weih) => weih ? weihBild(P.bild()) : P.bild();
function pastorAnruf(w, weiter) {
  const P = PASTOREN[w.wer] || PASTOREN.willi;
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
  const q = nameSchluessel(bibDuSuche), liste = (duGegner || []).filter(r => !q || nameSchluessel(r.name).includes(q)).slice(0, 40);
  return `<div class="card du-gegner bq-gegner" id="bqGegner">
    ${offen.length >= DU_MAX_OFFEN ? `<p class="small muted" style="margin:0">Du hast schon ${DU_MAX_OFFEN} offene Herausforderungen – erst müssen diese gespielt werden. Unten bei „Wartet auf“ kannst du eine abbrechen.</p>` : `
    <input class="du-suche" id="bqSuche" type="search" placeholder="Wen herausfordern? Name suchen …" value="${esc(bibDuSuche)}" autocomplete="off" aria-label="Gegner suchen">
    ${duGegner === null ? `<p class="small muted">Lade Gemeinde …</p>` : `<ul class="du-wahl">${liste.map(r => { const laeuft = offen.some(d => d.an === r.id);
      return `<li><button class="du-person" data-bqg="${esc(r.id)}" ${laeuft ? "disabled" : ""}>${avatarLv(r, 34)}<span class="du-tx"><b>${esc(r.name)}</b><span>${laeuft ? "Duell läuft schon" : "Level " + (r.level || 1)}</span></span>${laeuft ? "" : `<span class="du-los bq-los">${svg("biblionaer")}</span>`}</button></li>`; }).join("") || `<li class="small muted">Niemand gefunden.</li>`}</ul>`}`}
  </div>`;
}
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
  const liste = (duListe || []).filter(bibIstQuiz), alleDran = duFuerMich(), dran = alleDran.filter(bibIstQuiz), andere = alleDran.length - dran.length;
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
  const ergKachel = d => { const ich = d.von === S.pid, g = ich ? d.anName : d.vonName, p = ich ? d.vonErg.p : d.anErg.p, q = ich ? d.anErg.p : d.vonErg.p, e = p > q ? "sieg" : p === q ? "remis" : "nieder";
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
    ${bereichKopf("bib", { bild: "icons/biblionaer-logo.webp", t: "Biblionär", sub: "15 Bibelfragen bis zur Million", ring: [stufe, "von 15"],
      tafel: [[S.bibSpiele || 0, S.bibSpiele === 1 ? "Spiel" : "Spiele"], [pkt(rek), "Rekord"], [S.bibMillion || 0, "Million"]],
      zeile: { ic: "crown", t: "Rekord-Leiter", p: stufe / 15 * 100, r: `${stufe}/15` } })}
    ${bkLabel("play", "Spielen")}
    ${weihSchalterHtml()}
    <div class="bq3-start">
      <div class="bq4-paar">
        <button class="bq4-k bq4-solo" id="bqSolo" aria-label="Solo spielen – 1 Spieler"><span class="bq4-chip">${svg("user")}1 Spieler</span><span class="bq4-bild"><span class="bq4-av">${ichKurz}</span></span><b class="bq4-tt">Solo</b><span class="bq4-sub">${weihAktiv() ? "Weihnachtsfragen" : rek ? `Rekord ${pkt(rek)}` : "Allein üben"}</span>${svg("play")}</button>
        ${online ? `<button class="bq4-k bq4-duell" id="bqNeu" aria-label="${bibDuWahl ? "Gegnerwahl schließen" : "Neues Duell – 2 Spieler"}" ${bibDuWahl ? 'aria-expanded="true"' : ""}><span class="bq4-chip">${svg("people")}2 Spieler</span><span class="bq4-bild"><span class="bq4-av">${ichKurz}</span><span class="bq4-vs">VS</span><span class="bq4-av f">?</span></span><b class="bq4-tt">Duell</b><span class="bq4-sub">${bibDuWahl ? "Unten Namen antippen" : "Gegen die Gemeinde"}</span>${svg(bibDuWahl ? "nein" : "bolt")}</button>`
          : `<div class="bq4-k bq4-duell aus"><span class="bq4-chip">${svg("people")}2 Spieler</span><span class="bq4-bild"><span class="bq4-av">${ichKurz}</span><span class="bq4-vs">VS</span><span class="bq4-av f">?</span></span><b class="bq4-tt">Duell</b><span class="bq4-sub">${window.LB && window.LB.ok ? "Nur mit Eintrag in der Rangliste" : "Nur mit Internet"}</span></div>`}
      </div>
      ${online && bibDuWahl ? bibGegnerHtml() : ""}
      ${woche}
    </div>
    ${bkLabel("duell", "Deine Duelle", dran.length)}
    <section class="bq2-duell">
      ${duell}
    </section>
    ${bkLabel("star", "Deine Joker")}
    <div class="bq2-joker" aria-label="Deine Joker – je einmal pro Spiel">
      <span><b class="bq2-j5">50:50</b><span><b>Halbieren</b><small>2 falsche weg</small></span></span>
      <span>${svg("people")}<span><b>Gemeinde</b><small>alle stimmen ab</small></span></span>
      <span>${svg("telefon")}<span><b>Telefon</b><small>Willi oder Aaron</small></span></span>
    </div>
    <button class="bq2-fuss" data-go="rank" data-arg="bibRekord">${svg("trophy")}<span>Joker je 1× pro Spiel · Bestenliste</span><b>Rangliste ›</b></button>`;
  wireGo();
  $("bqSolo").onclick = () => { SFX.tap(); bibSolo(weihAktiv()); };
  weihSchalterWire(() => VIEWS.bib());
  if ($("bqWoche")) $("bqWoche").onclick = () => { SFX.tap(); if (weihAktiv()) { if (ar) bibAdventStarten(); return; } if (gespielt) go("rank", "bibWoche"); else bibWocheStarten(); };
  if ($("bqNeu")) $("bqNeu").onclick = () => { SFX.tap(); bibDuWahl = !bibDuWahl; VIEWS.bib();
    if (bibDuWahl) { duGegnerLaden().then(() => { if (current !== "bib" || !bibDuWahl) return; const b = $("bqGegner"); if (!b) return;
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
    const liste = await L.feedbackListe(); postfachNeu = liste.filter(f => !f.erledigt).length; pkOffenPruef = liste.filter(f => !f.erledigt && (pkIstXp(f) || pkIstDup(f))).length; renderHud();
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
  <div class="pk-pins" aria-label="Prüfungen">${zeile("pkXp", "medal", "XP-Prüfung", xpTag, 'data-go="xppruefung"')}${zeile("pkDup", "people", "Doppelte Namen", dupTag, 'id2="x"')}<button class="pk-pin" id="pkTal" data-go="talente"><span class="pk-pt"><b>${svg("tal")} Talente-Planung</b><span class="small muted">Guthaben, Ø pro Tag, Spenden-Prognose</span></span><span class="pk-pfeil" aria-hidden="true">›</span></button></div>
  <div class="card rk-liste" style="margin-top:10px">
    <div class="pk-suchzeile" ${pkSuchOffen ? "" : "hidden"}><input type="search" id="pkSuche" placeholder="Suchen (Text, Name, Version)" value="${esc(pkSuche)}" aria-label="Post durchsuchen" autocomplete="off"></div>
    <div class="pk-filter"><div class="rk-var" role="group" aria-label="Filter">${[["neu", "Neu"], ["alle", "Alle"], ["erledigt", "Erledigt"]].map(([k, n]) => `<button data-pf="${k}" aria-pressed="${k === postfachFilter}">${n}<i class="pk-n" data-pfn="${k}"></i></button>`).join("")}</div>
      <select id="pkKat" aria-label="Kategorie">${PK_KAT.map(([k, n]) => `<option value="${k}" ${k === pkKategorie ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    <div class="pk-leiste" id="pkLeiste" ${pkAuswahl ? "" : "hidden"}><label class="small"><input type="checkbox" id="pkAlle"> Alle</label><span class="small muted" id="pkGewZahl"></span><span class="pk-aktion"><button class="btn ghost mini" id="pkErl">Erledigt</button><button class="btn ghost mini" id="pkDel">Löschen</button></span></div>
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
    postfachNeu = liste.filter(f => !f.erledigt).length; renderHud();
    const xpOff = liste.filter(f => !f.erledigt && pkIstXp(f)).length, dupOff = liste.filter(f => !f.erledigt && pkIstDup(f)).length;
    pkOffenPruef = xpOff + dupOff; renderHud();
    ampel("pkXp", xpOff ? "orange" : xpTag ? "gruen" : "grau", xpOff ? `${xpOff} offen · ${tagText(xpTag)}` : "");
    ampel("pkDup", dupOff ? "orange" : dupTag ? "gruen" : "grau", dupOff ? `${dupOff} offen · ${tagText(dupTag)}` : "");
    const basis = liste.filter(passt), zahl = k => basis.filter(f => k === "alle" ? true : k === "neu" ? !f.erledigt : f.erledigt).length;
    ["neu", "alle", "erledigt"].forEach(k => { const e = screen.querySelector(`[data-pfn="${k}"]`); if (e) e.textContent = zahl(k) ? " " + zahl(k) : ""; });
    const z = basis.filter(f => postfachFilter === "alle" || (postfachFilter === "neu" ? !f.erledigt : f.erledigt));
    [...pkGew].forEach(id => { if (!z.some(f => f.id === id)) pkGew.delete(id); });
    if ($("pkGewZahl")) $("pkGewZahl").textContent = pkGew.size ? pkGew.size + " gewählt" : "nichts gewählt";
    if ($("pkErl")) $("pkErl").disabled = !pkGew.size; if ($("pkDel")) $("pkDel").disabled = !pkGew.size;
    if ($("pkAlle")) $("pkAlle").checked = z.length > 0 && pkGew.size === z.length;
    $("pfListe").innerHTML = z.length ? z.map(f => { const kt = pkKat(f); const art = kt === "feedback" ? (ART_NAME[f.art] || f.art) : kt === "datenbank" ? "DB" : ART_NAME[kt]; const kurz = String(f.text || "").replace(/\s+/g, " ").trim();
      return `<details class="card pf pk-${kt} ${f.erledigt ? "erledigt" : ""}" data-id="${esc(f.id)}">
        <summary>${pkAuswahl ? `<input type="checkbox" class="pk-cb" data-cb="${esc(f.id)}" ${pkGew.has(f.id) ? "checked" : ""} aria-label="Auswählen">` : ""}<span class="pf-art art-${esc(kt === "feedback" ? f.art : kt)}">${esc(art)}</span><span class="pk-vorschau">${esc(kurz.length > 70 ? kurz.slice(0, 70) + " …" : kurz)}</span>${f.erledigt ? "" : `<i class="pk-punkt" aria-label="neu"></i>`}<span class="small muted pk-zeit">${esc(pkDatum(f.zeit))}</span></summary>
        <p class="pf-text">${esc(f.text)}</p>
        <div class="small muted">${kt === "feedback" ? (f.name ? `von <b>${esc(f.name)}</b>` : "anonym") : (f.name ? esc(f.name) : "automatisch")} · ${esc(f.ver || "?")} · ${esc(String(f.geraet || "").replace(/^(status|datenbank) · /, ""))}</div>
        ${pkAuswahl ? "" : `<div class="row-btns" style="margin-top:8px"><button class="btn ghost mini" data-erl="${esc(f.id)}">${f.erledigt ? "Wieder als neu" : "Erledigt"}</button><button class="btn ghost mini" data-del="${esc(f.id)}">Löschen</button></div>`}</details>`; }).join("")
      : `<p class="muted" style="margin:6px 0">${pkSuche.trim() ? "Nichts gefunden." : postfachFilter === "neu" ? "Nichts Neues. 🙂" : "Keine Einträge."}</p>`;
    if (pkAuswahl) $("pfListe").querySelectorAll("details.pf > summary").forEach(s => s.onclick = e => { e.preventDefault(); const id = s.parentElement.dataset.id; if (pkGew.has(id)) pkGew.delete(id); else pkGew.add(id); zeichne(); });
    $("pfListe").querySelectorAll("[data-erl]").forEach(b => b.onclick = async () => { SFX.tap(); const f = liste.find(x => x.id === b.dataset.erl); try { await L.feedbackErledigt(f.id, !f.erledigt); f.erledigt = !f.erledigt; zeichne(); } catch (e) { toast("<div>Das hat nicht geklappt.</div>"); } });
    $("pfListe").querySelectorAll("[data-del]").forEach(b => b.onclick = () => { SFX.tap();
      modal(`<h2>Eintrag löschen?</h2><p class="muted small">Das lässt sich nicht rückgängig machen.</p><button class="btn primary" data-close="ja">Löschen</button><button class="btn ghost" data-close>Abbrechen</button>`, async a => {
        if (a !== "ja") return; try { await L.feedbackLoeschen(b.dataset.del); liste = liste.filter(x => x.id !== b.dataset.del); zeichne(); } catch (e) { toast("<div>Löschen hat nicht geklappt.</div>"); } }); });
  };
  $("pkSuche").oninput = e => { pkSuche = e.target.value; zeichne(); };
  $("pkAlle").onchange = e => { const z = liste.filter(passt).filter(f => postfachFilter === "alle" || (postfachFilter === "neu" ? !f.erledigt : f.erledigt)); pkGew.clear(); if (e.target.checked) z.forEach(f => pkGew.add(f.id)); zeichne(); };
  $("pkErl").onclick = async () => { SFX.tap(); const ziel = liste.filter(f => pkGew.has(f.id)); if (!ziel.length) return; let fehler = 0;
    for (const f of ziel) { try { await L.feedbackErledigt(f.id, postfachFilter !== "erledigt"); f.erledigt = postfachFilter !== "erledigt"; } catch (e) { fehler++; } }
    pkGew.clear(); zeichne(); if (fehler) toast(`<div>${fehler} Einträge konnten nicht geändert werden.</div>`); };
  $("pkDel").onclick = () => { SFX.tap(); const ziel = liste.filter(f => pkGew.has(f.id)); if (!ziel.length) return;
    modal(`<h2>${ziel.length} ${ziel.length === 1 ? "Eintrag" : "Einträge"} löschen?</h2><p class="muted small">Das lässt sich nicht rückgängig machen.</p><button class="btn primary" data-close="ja">Löschen</button><button class="btn ghost" data-close>Abbrechen</button>`, async a => {
      if (a !== "ja") return; let fehler = 0;
      for (const f of ziel) { try { await L.feedbackLoeschen(f.id); liste = liste.filter(x => x.id !== f.id); } catch (e) { fehler++; } }
      pkGew.clear(); zeichne(); if (fehler) toast(`<div>${fehler} Einträge konnten nicht gelöscht werden.</div>`); }); };
  L.feedbackListe().then(l => { liste = l; zeichne(); }).catch(() => { $("pfListe").innerHTML = `<p class="muted">Postkasten konnte nicht geladen werden.</p>`; });
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
const XQ_FARBE = { vers: "#7fc8ff", lektion: "#7fc8ff", spickzettel: "#7fc8ff", luecke: "#ffb54a", blitz: "#ffb54a", kette: "#ffb54a", duell: "#ff8a5c", duelleigen: "#ff8a5c", bib: "#66e0d0", tagesbonus: "#f2c14e", spende: "#f4a6c8", abgleich: "#b39ddb", sonst: "#b8c0d8", alt: "#6b7399", offen: "#ff5c5c" };
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
$("hWer").onclick = () => { SFX.tap(); ichMenue(); };
$("hTalBtn").onclick = () => { SFX.tap(); go("ich"); };
neuerTag(); applyTheme(); renderMute(); renderHud(); checkBadges(); geraetSpeichern(); go("home");
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
const AH_REITER = ["home", "lernen", "spielen", "zusammen", "bib", "duelle", "rank", "ich", "profil", "badges"];
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
  const html = `<div class="ah-oben"><span class="ah-mini" aria-hidden="true"><i></i><i></i><i></i><i></i><i class="ah-app"><img src="icons/icon-192.png" alt=""></i><i></i></span>
      <span class="ah-tx"><b>Immer dabei</b><small>Hol dir die Bibel-Quest auf deinen Startbildschirm: ein Tipp, und du bist drin – auch ohne Internet.</small></span></div>
    <span class="ah-lohn"><i>+${APP_BONUS} Talente</i><i>${svg("medal")} Abzeichen „Heimkehr“</i></span>
    <div class="ah-unten">${ios ? `<button class="ah-schritte" id="ahInst" aria-label="Anleitung: App aufs iPhone holen"><em>${teilen} Teilen</em><span>→</span><em>Zum Home-Bildschirm</em></button>`
      : `<button class="btn primary ah-knopf" id="ahInst">${svg("down")} App installieren</button>`}<button class="ah-x" id="ahZu" aria-label="Für heute ausblenden">${svg("nein")}</button></div>`;
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
