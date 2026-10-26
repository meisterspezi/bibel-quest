/* =====================================================================
   Bibelbuch-Quest – Spiel-Logik (Version 6.5)
   Braucht: daten.js (vorher geladen). Rangliste: leaderboard.js stellt window.LB bereit.
   ===================================================================== */

/* ---------- Zustand & Speichern ---------- */
const DEF = {
  xp: 0, tal: 0, stars: {}, right: 0,
  streak: 0, bestStreak: 0, lastDay: "", todayXp: 0, todayDay: "", todayRight: 0, bestDayRight: 0,
  goalStreak: 0, bestGoalStreak: 0, lastGoalDay: "",
  bestChain: 0, chainAT: 0, chainNT: 0, chainRueck: 0, bestBlitz: 0, bestCombo: 0,
  badges: [], owned: ["gold"], theme: "gold", avatar: "initial", frame: "none", title: "none",
  tage: [], treueWochen: [], treueBonus: { week: "", stufen: [] }, meister: { bibel: [], at: [], nt: [], rueck: [] },
  siegelGesehen: { bibel: 0, at: 0, nt: 0, rueck: 0 }, aufgefrischt: false, eingeladenVon: "", eingeladen: false, fischerDabei: false, menschenfischer: false,
  songHeard: [], gapPerfect: false, peeked: false, earlyBird: false,
  dq: { day: "", items: [], bonus: false }, questBonusCount: 0,
  mute: false, beat: true, atTi: 0, ntTi: 0,
  lbName: "", pid: "", ownersSet: false, offlineOnly: false, weekKey: "", weekXp: 0, podium: false, wochensieger: false, wochenziel: false,
  ver: 6
};
let S = JSON.parse(JSON.stringify(DEF));
/* Mehrere Spieler auf einem Gerät: jeder hat einen eigenen Spielstand.
   Der erste (bisherige) Spieler behält den alten Speicherplatz "bibelquest-v1". */
const LS_SPIELER = "bibelquest-spieler";
const lsKey = key => (key === "haupt" ? "bibelquest-v1" : "bibelquest-v1:" + key);
let GERAET = { aktiv: "haupt", liste: [] };
try { const g = JSON.parse(localStorage.getItem(LS_SPIELER) || "null"); if (g && Array.isArray(g.liste)) GERAET = g; } catch (e) {}
const LS = lsKey(GERAET.aktiv);
try { const v = JSON.parse(localStorage.getItem(LS) || "null"); if (v) S = Object.assign(JSON.parse(JSON.stringify(DEF)), v); } catch (e) {}
/* Umzug von Version 5: Rekord-Serie nachtragen */
if (!S.bestStreak) S.bestStreak = S.streak || 0;
function geraetSpeichern() {
  const eintrag = { key: GERAET.aktiv, name: S.lbName, avatar: S.avatar, frame: S.frame, xp: Math.round(S.xp), pid: S.pid };
  const i = GERAET.liste.findIndex(p => p.key === GERAET.aktiv);
  if (i > -1) GERAET.liste[i] = eintrag; else if (S.lbName || S.xp > 0) GERAET.liste.push(eintrag);
  try { localStorage.setItem(LS_SPIELER, JSON.stringify(GERAET)); } catch (e) {}
}
function save() {
  try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {}
  geraetSpeichern(); cloudSync();
}
/* Spieler wechseln: offene Übertragungen abschließen, dann mit dem anderen Spielstand neu starten */
async function spielerWechseln(key) {
  const L = window.LB; clearTimeout(lbTimer); clearTimeout(cloudTimer); save();
  if (S.lbName && S.pid && L && L.ok) {
    const fertig = Promise.all([L.push(S.pid, lbPayload(), {}).catch(() => {}), S.ownersSet && L.saveState ? L.saveState(S.pid, spielstandExport()).catch(() => {}) : null]);
    await Promise.race([fertig, new Promise(r => setTimeout(r, 2500))]);
  }
  GERAET.aktiv = key; try { localStorage.setItem(LS_SPIELER, JSON.stringify(GERAET)); sessionStorage.setItem("bq-gewaehlt", "1"); } catch (e) {}
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
const cum = n => 25 * (n - 1) * (n + 2);
function levelOf(xp) { let n = 1; while (cum(n + 1) <= xp) n++; return n; }
const titleOf = n => TITLES[Math.min(n, TITLES.length) - 1] + (n > TITLES.length ? " " + (n - TITLES.length + 1) : "");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const vibrate = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
const hash = str => { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const streakNow = () => (S.lastDay === today() || S.lastDay === yesterday() ? S.streak : 0);
const armorCount = (owned = S.owned) => RUESTUNG.filter(r => owned.includes("ar-" + r.id)).length;
const svg = (k, c) => `<svg viewBox="0 0 24 24" aria-hidden="true" style="color:${c || "currentColor"}">${ICONS[k] || ""}</svg>`;
const STAR = on => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="${on ? "#f2c14e" : "#3a4380"}"/></svg>`;
const versHtml = (key, cls = "") => { const v = VERSE[key]; return v ? `<figure class="vers ${cls}"><blockquote>${esc(v[0])}</blockquote><figcaption>${esc(v[1])} · ${VERS_QUELLE}</figcaption></figure>` : ""; };
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
  beat(n) { tone(n % 2 ? 98 : 82, 0, .16, "sine", .1, 50); }
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
  aufnahmenGeprueft = fetch("lied/aufnahmen.json", { cache: "no-store" }).then(r => (r.ok ? r.json() : {})).then(j => {
    Object.entries(j || {}).forEach(([k, v]) => { if (typeof v === "string" && /^[\w.-]+\.(mp3|m4a|ogg|wav)$/i.test(v)) AUFNAHMEN[k] = "lied/" + v; });
  }).catch(() => {});
  return aufnahmenGeprueft;
}
function aufnahmeSpielen(src, zeilenEls, fertig) {
  vorlesenStop(); const lauf = ++ttsLauf;
  audioEl = new Audio(src); audioEl.play().catch(() => {});
  if (zeilenEls && zeilenEls.length) {
    audioEl.ontimeupdate = () => { if (lauf !== ttsLauf || !audioEl || !audioEl.duration) return; const k = Math.min(zeilenEls.length - 1, Math.floor(audioEl.currentTime / audioEl.duration * zeilenEls.length)); zeilenEls.forEach((e, j) => e.classList.toggle("on", j === k)); };
  }
  audioEl.onended = () => { if (lauf !== ttsLauf) return; vorlesenStop(); fertig && fertig(); };
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
    setTimeout(() => { SFX.badge(); toast(`${svg("people", accent())}<div><b>Treue Woche!</b><div class="small muted">Du hast an ${TREUE_TAGE} Tagen gespielt und zählst für die Gemeinde-Treue.</div></div>`); }, 1800);
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

function addXp(n, el) {
  neuerTag(); serieZaehlen(); tagMerken();
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
function levelUp(n) {
  SFX.level(); vibrate([30, 40, 30, 40, 80]); rain(110);
  const bonus = 5 + n * 2; S.tal += bonus; save(); renderHud(); lbSync();
  modal(`<div class="label">Level aufgestiegen</div><div class="lvlbig">${n}</div><h2>${titleOf(n)}</h2><p class="muted">Bonus: +${bonus} Talente</p><button class="btn primary" data-close>Weiter</button>`);
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
  let h = hash("bq" + t); const pool = AUFGABEN.slice(); const gew = [];
  for (let versuch = 0; gew.length < 3 && pool.length && versuch < 60; versuch++) {
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; const idx = h % pool.length, a = pool[idx];
    const minuten = gew.reduce((m, x) => m + x.min, 0) + a.min, rest = 3 - gew.length - 1;
    if (gew.some(x => x.ev === a.ev) || minuten + rest > AUFGABEN_MAX_MIN) continue;
    gew.push(pool.splice(idx, 1)[0]);
  }
  for (const a of AUFGABEN) if (gew.length < 3 && !gew.includes(a) && !gew.some(x => x.ev === a.ev)) gew.push(a);
  return gew;
}
function aufgabenSicherstellen() {
  const t = today(); if (S.dq && S.dq.day === t && S.dq.items.every(it => AUFGABEN.some(a => a.id === it.id))) return;
  const gew = aufgabenAuslosen(t);
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
  if (geaendert && !S.dq.bonus && S.dq.items.every(i => i.done)) {
    S.dq.bonus = true; S.tal += AUFGABE_BONUS; S.questBonusCount = (S.questBonusCount || 0) + 1;
    if (S.lastGoalDay !== today()) { S.goalStreak = S.lastGoalDay === yesterday() ? S.goalStreak + 1 : 1; S.lastGoalDay = today(); S.bestGoalStreak = Math.max(S.bestGoalStreak, S.goalStreak); }
    setTimeout(() => { addXp(AUFGABE_BONUS_XP); SFX.win(); rain(90); toast(`${svg("target", accent())}<div><b>Alle Tagesaufgaben geschafft!</b><div class="small muted">Tagesbonus +${AUFGABE_BONUS_XP} XP und +${AUFGABE_BONUS} Talente${S.goalStreak > 1 ? " · " + S.goalStreak + " Tage in Folge" : ""}</div></div>`); if (current === "home") go("home"); }, 900);
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
    if (i > (S[k] || 0)) { S[k] = i; try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} setTimeout(() => { SFX.badge(); toast(`${svg("crown", accent())}<div><b>Neuer Titel im ${name}: ${esc(L[i][1])}</b><div class="small muted">${esc(L[i][2])}</div></div>`); }, 1500); }
  });
}

/* ---------- Kopfleiste ---------- */
function renderHud() {
  const n = levelOf(S.xp), lo = cum(n), hi = cum(n + 1);
  $("hLvl").textContent = n; $("hAvatar").innerHTML = avatarHtml({ avatar: S.avatar, frame: S.frame, name: S.lbName || "?" }, 42); $("hTitle").textContent = (S.lbName ? S.lbName + " · " : "") + titleOf(n);
  $("hBar").style.width = ((S.xp - lo) / (hi - lo) * 100) + "%"; $("hXp").textContent = `${S.xp - lo} / ${hi - lo} XP`;
  $("hStreak").textContent = streakNow(); $("hTal").textContent = S.tal;
  const pk = $("pkBtn"); if (pk) { pk.hidden = !entwickler; pk.innerHTML = `${svg("post")}${postfachNeu ? `<span class="pk-zahl">${postfachNeu > 99 ? "99+" : postfachNeu}</span>` : ""}`; pk.setAttribute("aria-label", `Postkasten${postfachNeu ? ", " + postfachNeu + " neu" : ""}`); }
}
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
function ruestungHtml(n, klein = true) {
  if (!n) return "";
  return `<span class="ruest ${klein ? "klein" : ""}" title="Waffenrüstung Gottes: ${n} von 6">${RUESTUNG.slice(0, n).map(r => svg("ar-" + r.id)).join("")}</span>`;
}
function itemFrei(kat, it) {
  if (it.price === 0) return true;
  if (it.price < 0) return S.badges.includes(it.need);
  return S.owned.includes(kat + it.id);
}

/* ---------- Navigation ---------- */
let current = "home", timers = [], lbUnsub = [];
function clearTimers() { timers.forEach(clearInterval); timers = []; }
function go(name, arg) {
  clearTimers(); vorlesenStop(); lbUnsub.forEach(u => { try { u(); } catch (e) {} }); lbUnsub = [];
  if (!S.lbName && name !== "name") name = "name";
  current = name; window.scrollTo(0, 0); (VIEWS[name] || VIEWS.home)(arg);
}
const screen = $("screen");
const backBtn = (to = "home", txt = "Zurück") => `<button class="back" data-go="${to}">← ${txt}</button>`;
function wireGo() { screen.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { SFX.tap(); go(b.dataset.go, b.dataset.arg); }); }

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
  if (rec) aufnahmeSpielen(rec, els, fertig);
  else vorlesen(zeilenPlain(vi).map((t, j) => ({ text: t, el: els[j] })), fertig);
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

VIEWS.home = () => {
  neuerTag(); save();
  const C = 2 * Math.PI * 20;
  const vKey = VERS_DES_TAGES[dayNum(today()) % VERS_DES_TAGES.length];
  const erledigt = S.dq.items.filter(i => i.done).length;
  const aufg = S.dq.items.map(it => { const a = AUFGABEN.find(x => x.id === it.id); if (!a) return ""; const pr = Math.min(it.prog, a.ziel);
    return `<li class="${it.done ? "done" : ""}"><span class="qcheck">${it.done ? svg("check") : ""}</span><span class="qtext">${esc(a.text)}</span><span class="qbar"><i style="width:${pr / a.ziel * 100}%"></i></span><span class="qval">${pr}/${a.ziel}</span></li>`; }).join("");
  const sterne = Object.values(S.stars).reduce((a, b) => a + b, 0);
  screen.innerHTML = `
  <div class="titel-wappen"><div class="halo"></div><img src="logo.png" alt="Logo der Freien Baptisten Eichstätt" onerror="this.remove()"><h1>Bibelbuch-Quest</h1><div class="linie"><i></i><span>Alle <b>66</b> Bücher – Schritt für Schritt</span><i></i></div></div>
  <div class="stack" style="margin-top:12px">
    <div class="card heute ${S.dq.bonus ? "fertig" : ""}">
      <div class="heute-kopf">
        <svg class="ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="none" stroke="var(--surface2)" stroke-width="6"/><circle cx="24" cy="24" r="20" fill="none" stroke="${S.dq.bonus ? "var(--good)" : "var(--accent)"}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - erledigt / 3)}" transform="rotate(-90 24 24)"/><text x="24" y="29" text-anchor="middle" fill="var(--fg)" font-weight="900" font-size="14" font-family="Nunito, sans-serif">${erledigt}/3</text></svg>
        <div class="heute-titel"><b>Tagesaufgaben</b><span class="small muted">${S.dq.bonus ? "Geschafft – bis morgen!" : "Bonus für alle 3 →"}</span></div>
        <div class="preis ${S.dq.bonus ? "erhalten" : ""}" aria-label="Belohnung: ${AUFGABE_BONUS_XP} XP und ${AUFGABE_BONUS} Talente${S.dq.bonus ? ", erhalten" : ""}">
          <span class="preis-xp">+${AUFGABE_BONUS_XP}<small>XP</small></span>
          <span class="preis-tal"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#f2c14e"/><circle cx="12" cy="12" r="6" fill="none" stroke="#a8781a" stroke-width="2"/></svg>+${AUFGABE_BONUS}</span>
          ${S.dq.bonus ? `<span class="preis-ok">${svg("check")}</span>` : ""}
        </div>
      </div>
      <ul class="quests">${aufg}</ul>
    </div>
    ${(() => { const f = Object.entries(KETTEN).map(([id, k]) => ({ id, k, t: S.meister[id] || [] })).filter(x => x.t.length && siegelRest(x.t) <= 5).sort((a, b) => siegelRest(a.t) - siegelRest(b.t))[0];
      return f ? `<button class="erinnerung" data-go="spielen">${siegelHtml(siegelStufe(f.t), siegelFrisch(f.t), true)}<span><b>${siegelFrisch(f.t) ? `Dein Siegel „${esc(f.k.name)}“ verblasst in ${siegelRest(f.t)} Tag(en)` : `Dein Siegel „${esc(f.k.name)}“ ist verblasst`}</b><span class="small muted">Jetzt die Kette wiederholen und auffrischen${siegelFrisch(f.t) ? "" : ` (+${AUFFRISCH_TAL} Talente)`}</span></span></button>` : ""; })()}
    <button class="bereich" data-go="lernen"><span class="b-ic">${svg("book")}</span><span class="b-tx"><b>Lernen</b><span>Lektionen · Lieder · Spickzettel</span></span><span class="b-info">${sterne}/24 ★</span></button>
    <button class="bereich" data-go="spielen"><span class="b-ic">${svg("bolt")}</span><span class="b-tx"><b>Spielen</b><span>Blitz-Runde · Die Kette · Lückenquiz</span></span><span class="b-info">${S.bestBlitz ? "Rekord " + S.bestBlitz : ""}</span></button>
    <button class="bereich" data-go="rank"><span class="b-ic">${svg("trophy")}</span><span class="b-tx"><b>Gemeinschaft</b><span>${S.lbName ? `Rangliste · ${S.weekKey === weekKey() ? S.weekXp : 0} XP diese Woche` : "Rangliste der Gemeinde"}</span></span><span class="b-info"></span></button>
    <nav class="leiste" aria-label="Weitere Bereiche">
      <button data-go="shop">${svg("shop")}<span>Laden</span></button>
      <button data-go="badges">${svg("medal")}<span>Abzeichen</span></button>
      <button data-go="profil">${svg("user")}<span>Profil</span></button>
      <button data-go="share">${svg("share")}<span>Teilen</span></button>
      ${deferredInstall ? `<button id="installBtn">${svg("down")}<span>Installieren</span></button>` : ""}
    </nav>
    ${versHtml(vKey, "tag klein")}
    ${entwickler && postfachNeu ? `<button class="erinnerung pf-hinweis" data-go="postfach">${svg("chat")}<span><b>${postfachNeu} ${postfachNeu === 1 ? "neue Meldung" : "neue Meldungen"} im Postkasten</b><span class="small muted">Feedback, Status und Datenbank</span></span></button>` : ""}
    <button class="feedback-link" id="fbLink">${svg("chat")} Idee oder Fehler? Feedback an den Entwickler</button>
  </div>`;
  wireGo();
  $("fbLink").onclick = () => { SFX.tap(); feedbackOeffnen(); };
  const ib = $("installBtn"); if (ib) ib.onclick = async () => { SFX.tap(); deferredInstall.prompt(); try { await deferredInstall.userChoice; } catch (e) {} deferredInstall = null; go("home"); };
};

/* ---------- Bereich Lernen ---------- */
VIEWS.lernen = () => {
  const { atP, ntP } = fortschritt();
  const lektion = (g, i) => { const st = S.stars[i] || 0; return `<button class="lek ${st ? "done" : ""}" data-go="lektion" data-arg="${i}"><span class="lek-nr" aria-label="Lektion ${i + 1}">${svg("lek-" + (i + 1))}</span><span class="lek-tx"><b>${g.name}</b><span>${g.books.length} Bücher · ${g.books[0]} – ${g.books[g.books.length - 1]}</span></span><span class="stars">${STAR(st >= 1)}${STAR(st >= 2)}${STAR(st >= 3)}</span></button>`; };
  screen.innerHTML = `${backBtn()}<h1>Lernen</h1>
  <p class="muted small" style="margin:0 0 12px">Jede Lektion hat drei Schritte: ansehen, anhören, selbst ordnen.</p>
  <div class="titelzeile"><span class="tag at">AT</span> <b>${esc(AT_TITEL[titelIndex(AT_TITEL, atP)][1])}</b><span class="tbar"><i style="width:${atP}%"></i></span><span class="small muted">${atP}%</span></div>
  <div class="stack lek-liste">${GROUPS.slice(0, 5).map((g, i) => lektion(g, i)).join("")}</div>
  <div class="titelzeile" style="margin-top:16px"><span class="tag nt">NT</span> <b>${esc(NT_TITEL[titelIndex(NT_TITEL, ntP)][1])}</b><span class="tbar"><i style="width:${ntP}%"></i></span><span class="small muted">${ntP}%</span></div>
  <div class="stack lek-liste">${GROUPS.slice(5).map((g, i) => lektion(g, i + 5)).join("")}</div>
  <div class="label" style="margin:20px 0 8px">Lied</div>
  <div class="stack">
    <button class="bereich klein" data-go="lied"><span class="b-ic">${svg("music")}</span><span class="b-tx"><b>In des Alten Bundes Schriften</b><span>Mitlesen und anhören · ${S.songHeard.length}/8 Strophen</span></span></button>
  </div>
  <div class="label" style="margin:20px 0 8px">Nachschlagen</div>
  <button class="bereich klein" data-go="learn"><span class="b-ic">${svg("eye")}</span><span class="b-tx"><b>Spickzettel</b><span>Alle 66 Bücher auf einen Blick, zum Abdecken</span></span></button>`;
  wireGo();
};

/* ---------- Bereich Spielen ---------- */
VIEWS.spielen = () => {
  screen.innerHTML = `${backBtn()}<h1>Spielen</h1>
  <div class="stack">
    <button class="bereich" data-go="blitz"><span class="b-ic">${svg("bolt")}</span><span class="b-tx"><b>Blitz-Runde</b><span>60 Sekunden: Was kommt danach?</span></span><span class="b-info">${S.bestBlitz ? "Rekord " + S.bestBlitz : ""}</span></button>
    <div class="label" style="margin:10px 0 0">Die Kette – ein Fehler beendet sie</div>
    <p class="small muted" style="margin:0">Wer eine Kette komplett schafft, bekommt ein Siegel. Wiederhole sie in verschiedenen Wochen und Monaten für Silber, Gold und Diamant. Nach ${SIEGEL_FRISCH} Tagen verblasst ein Siegel – dann einfach auffrischen.</p>
    ${Object.entries(KETTEN).map(([id, k]) => { const max = k.seq.length, rec = kettenBuecher(k.key), voll = rec >= max, t = S.meister[id] || [], st = siegelStufe(t), fr = siegelFrisch(t);
      return `<button class="kette-karte ${voll ? "voll" : ""}" data-k="${id}"><div class="ic">${st ? siegelHtml(st, fr) : svg("kette-" + id)}</div>
        <div class="kk-text"><b>${k.name}</b><span class="small muted">${st ? `${SIEGEL[st].name}-Siegel · ${fr ? "frisch noch " + siegelRest(t) + " Tage" : "verblasst – auffrischen!"}` : k.info}</span><span class="progress kk"><i style="width:${rec / max * 100}%"></i></span></div>
        <div class="kk-rec"><b>${rec}</b><span class="small muted">/ ${max}</span></div></button>`; }).join("")}
    <button class="bereich klein" data-go="gap" data-arg="alle"><span class="b-ic">${svg("music")}</span><span class="b-tx"><b>Lied-Lückenquiz</b><span>Welches Buch fehlt in der Liedzeile?</span></span></button>
  </div>`;
  wireGo();
  screen.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { SFX.tap(); countdown(() => playChain(b.dataset.k)); });
};

/* ---------- Geführte Lektion: ansehen → anhören → ordnen ---------- */
VIEWS.lektion = (arg) => {
  const gi = +arg, g = GROUPS[gi]; let schritt = 1;
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
        b.classList.add("spielt"); b.innerHTML = svg("stop") + " Stopp";
        vorlesen(z, () => { strophen.forEach(vi => { if (!S.songHeard.includes(vi)) S.songHeard.push(vi); }); quest("lied", strophen.length); save(); checkBadges(); });
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
    const xp = g.books.length * 5 + stars * 10; richtig(g.books.length);
    quest("station", 1); quest("runde", 1);
    SFX.win(); vibrate([20, 30, 20, 30, 60]); rain(70);
    setTimeout(() => {
      addXp(xp); addTal(Math.max(0, stars - prev) * 2);
      const next = gi + 1 < GROUPS.length;
      modal(`<div class="label">Lektion geschafft</div><div class="stars" style="justify-content:center;gap:8px">${[1, 2, 3].map(k => `<span style="display:inline-block;width:44px;animation:pop .4s ${k * 0.15}s both">${STAR(stars >= k)}</span>`).join("")}</div>
      <h2>${err === 0 ? "Fehlerfrei!" : err + " Fehler"}</h2><div class="rewards"><span class="pill">+${xp} XP</span>${stars > prev ? `<span class="pill">+${(stars - prev) * 2} Talente</span>` : ""}</div>
      <button class="btn primary" data-close="${next ? "next" : "lernen"}">${next ? "Nächste Lektion" : "Zur Übersicht"}</button><button class="btn ghost" data-close="again">Nochmal ordnen</button>`,
        r => { if (r === "next") go("lektion", gi + 1); else if (r === "again") { schritt = 3; zeige(); } else go("lernen"); });
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
    <p class="small muted" style="margin:0">Traditioneller Merkvers, gesungen auf die Melodie von „Eine Insel mit zwei Bergen“ – angepasst an die Reihenfolge der Schlachter 2000 (<span class="neu">so markiert</span>). Farben: <span class="bk-geschichte">Geschichte</span>, <span class="bk-lehre">Lehre &amp; Poesie</span>, <span class="bk-prophetie">Prophetie</span>.</p>
    <div class="row-btns">
      <button class="btn primary" id="ganzBtn" data-play>${svg("play")} Ganzes Lied anhören</button>
      <button class="btn" data-go="gap" data-arg="alle">${svg("target")} Lückenquiz: ganzes Lied</button>
    </div>
    <label class="schalter"><input type="checkbox" id="beatCb" ${S.beat ? "checked" : ""}> Leiser Takt beim Vorlesen</label>
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
  html += `<div class="card stack" style="margin-top:14px"><b>Eigene Aufnahme verwenden</b>
    <p class="small muted" style="margin:0">Liegen im Ordner <code>lied</code> eigene Aufnahmen (eingetragen in <code>lied/aufnahmen.json</code>), spielt die App sie statt der Vorlesestimme ab – etwa vom Kinderchor gesungen. ${Object.keys(AUFNAHMEN).length ? `<b>${Object.keys(AUFNAHMEN).length} Aufnahme(n) gefunden.</b>` : ""}</p></div>`;
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
    if (AUFNAHMEN["ganzes-lied"]) aufnahmeSpielen(AUFNAHMEN["ganzes-lied"], els, fertig);
    else {
      const z = []; LIED.forEach((_, vi) => zeilenPlain(vi).forEach((t, j) => z.push({ text: t, el: screen.querySelector(`.lz[data-v="${vi}"][data-l="${j}"]`) })));
      vorlesen(z, fertig);
    }
  };
};

/* ---------- Lied-Lückenquiz ---------- */
VIEWS.gap = (arg) => {
  const alle = arg === "alle"; const strophen = alle ? LIED.map((_, i) => i) : [+arg];
  const luecken = [];
  strophen.forEach(vi => LIED[vi].lines.forEach((ln, li) => ln.forEach((s, si) => { if (typeof s !== "string") luecken.push({ vi, li, si, t: s.t }); })));
  const alleTexte = []; LIED.forEach(v => v.lines.forEach(ln => ln.forEach(s => { if (typeof s !== "string") alleTexte.push(s.t); })));
  let k = 0, fehler = 0, xp = 0; const offen = new Set(); let lock = false;
  const render = () => {
    const L = luecken[k]; lock = false;
    /* bereits erratene Bücher sichtbar, die übrigen verdeckt */
    const strophe = LIED[L.vi].lines.map((_, li) => zeileHtml(L.vi, li, li === L.li ? L.si : -1, offen)).join("<br>");
    const idx = alleTexte.indexOf(L.t);
    const nah = shuffle([...new Set([idx - 2, idx - 1, idx + 1, idx + 2, idx + 3].filter(j => j >= 0 && j < alleTexte.length).map(j => alleTexte[j]).filter(t => t !== L.t))]).slice(0, 3);
    while (nah.length < 3) { const r = pick(alleTexte); if (r !== L.t && !nah.includes(r)) nah.push(r); }
    screen.innerHTML = `${backBtn(alle ? "spielen" : "lied", "Zurück")}<h1>Lückenquiz${alle ? "" : " · Strophe " + (L.vi + 1)}</h1>
      <div class="stack"><div class="topline"><span>${k + 1} / ${luecken.length}</span><span>Fehler: ${fehler}</span></div>
      <div class="progress"><i style="width:${k / luecken.length * 100}%"></i></div>
      <div class="card"><p class="liedtext gross">${strophe}</p></div>
      <div class="opts" id="go">${shuffle([L.t, ...nah]).map(t => `<button class="opt" data-t="${esc(t)}">${esc(t)}</button>`).join("")}</div></div>`;
    wireGo();
    screen.querySelectorAll("#go .opt").forEach(b => b.onclick = () => {
      if (lock) return;
      if (b.dataset.t === L.t) {
        lock = true; b.classList.add("right"); SFX.right(k % 12); richtig(1); xp += 3; offen.add(L.vi + "-" + L.li + "-" + L.si);
        const [x, y] = centerOf(b); burst(x, y, 10);
        setTimeout(() => { k++; if (k >= luecken.length) ende(); else render(); }, 450);
      } else { fehler++; b.classList.add("wrong"); b.disabled = true; SFX.wrong(); shakeScreen(); }
    });
  };
  const ende = () => {
    const perfekt = fehler === 0;
    if (alle && perfekt) S.gapPerfect = true;
    quest("luecke", 1); quest("runde", 1);
    screen.innerHTML = `<div class="card result stack"><div class="label">Lückenquiz geschafft</div><div class="big">${luecken.length - Math.min(fehler, luecken.length)} / ${luecken.length}</div>
      <div class="muted">${perfekt ? "Ohne Fehler – stark!" : fehler + " Fehler"}</div>
      <div class="rewards"><span class="pill">+${xp} XP</span></div>
      <button class="btn primary" id="again">Nochmal</button><button class="btn ghost" data-go="${alle ? "spielen" : "lied"}">Zurück</button></div>`;
    wireGo(); $("again").onclick = () => { SFX.tap(); VIEWS.gap(arg); };
    SFX.win(); if (perfekt) rain(80);
    if (xp) addXp(xp); save(); checkBadges();
  };
  render();
};

/* ---------- Blitz-Runde ---------- */
VIEWS.blitz = () => {
  screen.innerHTML = `${backBtn("spielen", "Spielen")}<h1>Blitz-Runde</h1>
  <div class="card stack" style="text-align:center">
    <p class="muted" style="margin:0">60 Sekunden: Was kommt nach dem Buch? Jede 5er-Combo erhöht den Multiplikator. Ein Fehler kostet 3 Sekunden.</p>
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
  let n = 3; screen.innerHTML = `<div class="result" style="padding-top:80px"><div class="big" id="cd">3</div></div>`; SFX.tick();
  const t = setInterval(() => { n--; if (n <= 0) { clearInterval(t); tone(1047, 0, .25, "triangle", .2); cb(); } else { $("cd").textContent = n; $("cd").style.animation = "none"; void $("cd").offsetWidth; $("cd").style.animation = "pop .3s"; SFX.tick(); } }, 700); timers.push(t);
}
function playBlitz(scope) {
  const idx = []; ALL.forEach((x, i) => { if (i < ALL.length - 1 && (scope === "all" || (x.t === scope && ALL[i + 1].t === scope))) idx.push(i); });
  let time = 60, right = 0, wrong = 0, combo = 0, maxCombo = 0, xp = 0, cur = -1, lock = false;
  screen.innerHTML = `<div class="stack">
    <div class="topline"><span id="bt">60 s</span><span>${svg("check", "var(--good)").replace('<svg', '<svg style="width:18px;height:18px;vertical-align:-3px"')} <span id="br">0</span></span><span id="bx">0 XP</span></div>
    <div class="timer"><i id="tb"></i></div>
    <div class="card stack"><div class="qsub">Was kommt nach</div><div class="q" id="bq"></div><div class="qsub" id="bm"></div><div class="combo" id="bc"></div><div class="opts" id="bo"></div></div>
    <button class="btn ghost" id="bstop">Runde beenden</button></div>`;
  $("bstop").onclick = end;
  const t = setInterval(() => { time -= 0.1; $("tb").style.width = Math.max(time, 0) / 60 * 100 + "%"; $("bt").textContent = Math.ceil(Math.max(time, 0)) + " s"; if (time <= 10 && Math.abs(time - Math.round(time)) < 0.05) SFX.tick(); if (time <= 0) end(); }, 100); timers.push(t);
  next();
  function mult() { return Math.min(1 + Math.floor(combo / 5), 5); }
  function next() {
    let i; do { i = idx[Math.floor(Math.random() * idx.length)]; } while (idx.length > 1 && i === cur); cur = i; lock = false;
    $("bq").textContent = ALL[i].b; $("bm").textContent = GROUPS[ALL[i].gi].name;
    const o = $("bo"); o.innerHTML = ""; makeOpts(i).forEach(b => { const btn = document.createElement("button"); btn.className = "opt"; btn.textContent = b; btn.onclick = () => ans(btn, b); o.appendChild(btn); });
  }
  function ans(btn, b) {
    if (lock) return; const correct = ALL[cur + 1].b;
    if (b === correct) {
      lock = true; combo++; right++; maxCombo = Math.max(maxCombo, combo); const g = 5 * mult(); xp += g; richtig(1);
      btn.classList.add("right"); SFX.right(combo); vibrate(10); const [x, y] = centerOf(btn); burst(x, y, 10 + mult() * 6, { speed: 3 + mult() }); floatText("+" + g, x, y);
      $("br").textContent = right; $("bx").textContent = xp + " XP";
      if (combo % 5 === 0) { tone(1568, 0, .15, "sine", .12); shakeScreen(); }
      setTimeout(next, 320);
    } else {
      combo = 0; wrong++; time -= 3; btn.classList.add("wrong"); SFX.wrong(); vibrate([40, 30, 40]); shakeScreen();
      [...$("bo").children].forEach(x => { if (x.textContent === correct) x.classList.add("right"); }); lock = true; setTimeout(next, 700);
    }
    const c = $("bc"); c.textContent = combo >= 2 ? `Combo ${combo} · x${mult()}` : ""; c.className = "combo" + (mult() >= 3 ? " hot" : "");
  }
  function end() {
    clearTimers(); const rec = right > S.bestBlitz;
    if (rec) S.bestBlitz = right; if (maxCombo > S.bestCombo) S.bestCombo = maxCombo;
    quest("blitz", 1); quest("runde", 1);
    const tal = Math.floor(right / 5) + (rec ? 3 : 0);
    screen.innerHTML = `<div class="card result stack"><div class="label">Zeit abgelaufen</div><div class="big">${right}</div><div class="muted">Richtige · ${wrong} Fehler · beste Combo ${maxCombo}</div>${rec && right > 0 ? '<h2>Neuer Rekord!</h2>' : ''}
      <div class="rewards"><span class="pill">+${xp} XP</span><span class="pill">+${tal} Talente</span></div>
      <button class="btn primary" id="again">Nochmal</button><button class="btn ghost" data-go="spielen">Zurück</button></div>`; wireGo();
    $("again").onclick = () => { SFX.tap(); VIEWS.blitz(); };
    if (right > 0) { SFX.win(); if (rec) rain(90); }
    if (xp) addXp(xp); addTal(tal); save(); checkBadges(); lbSync();
  }
}

/* ---------- Die Kette ---------- */
const KETTEN = {
  bibel: { name: "Ganze Bibel", info: "1. Mose bis Offenbarung", seq: FWD, key: "bestChain", bonus: 200, tal: 20 },
  at: { name: "Altes Testament", info: "1. Mose bis Maleachi", seq: FWD.slice(0, 39), key: "chainAT", bonus: 80, tal: 8 },
  nt: { name: "Neues Testament", info: "Matthäus bis Offenbarung", seq: FWD.slice(39), key: "chainNT", bonus: 60, tal: 6 },
  rueck: { name: "Rückwärts", info: "Offenbarung bis 1. Mose · für Profis", seq: FWD.slice().reverse(), key: "chainRueck", bonus: 300, tal: 30, rueck: true }
};
const kettenBuecher = (key) => (S[key] ? S[key] + 1 : 0);
VIEWS.chain = () => { go("spielen"); };
VIEWS._chainAlt = () => {
  screen.innerHTML = `${backBtn()}<h1>Die Kette</h1>
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
  const K = KETTEN[mode], seq = K.seq; let i = 0, xp = 0, lock = false;
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
      lock = true; i++; xp += 4; richtig(1);
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
    quest("ketteGespielt", 1); quest("runde", 1);
    const sieg = full ? meisterErfolg(mode) : null;
    const vorher = ALL[seq[i]].b;
    screen.innerHTML = `<div class="card result stack"><div class="label">${full ? "Großartig" : "Kette gerissen"}</div><div class="big">${i + 1} / ${seq.length}</div>
      <div class="muted">${full ? `${esc(K.name)} komplett in der richtigen Reihenfolge!` : `${K.rueck ? "Vor" : "Nach"} „${esc(vorher)}“ ${K.rueck ? "steht" : "kommt"} „${esc(correct)}“.`}</div>${rec && !full ? '<h2>Neuer Rekord!</h2>' : ''}
      ${!full && BUCH_IM_LIED[seq[i + 1]] ? `<div class="hilfe"><div class="label">So geht's im Lied</div>${zeileHtml(BUCH_IM_LIED[seq[i + 1]].v, BUCH_IM_LIED[seq[i + 1]].l)}</div>` : ""}
      ${sieg ? `<div class="siegel-box">${siegelHtml(sieg.nachher, true, true)}<div><b>${SIEGEL[sieg.nachher].name}-Siegel</b><div class="small muted">${sieg.nachher < 4 ? "Nächstes: " + SIEGEL[sieg.nachher + 1].name + " – " + SIEGEL[sieg.nachher + 1].text : "Höchste Stufe!"}<br>Bleibt ${SIEGEL_FRISCH} Tage frisch – danach einfach wiederholen.</div></div></div>` : ""}
      <div class="rewards"><span class="pill">+${xp} XP</span><span class="pill">+${tal + (sieg ? sieg.tal : 0)} Talente</span></div>
      <button class="btn primary" id="cagain">Nochmal</button><button class="btn ghost" data-go="spielen">Andere Kette</button></div>`; wireGo();
    $("cagain").onclick = () => { SFX.tap(); countdown(() => playChain(mode)); };
    if (full) { SFX.level(); rain(200); } else if (rec) SFX.win();
    if (xp) addXp(xp); addTal(tal); save(); checkBadges(); lbSync();
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
      `</div><details class="lied-det"><summary>${svg("music")} Im Lied</summary>${liedHinweisHtml(gi)}</details></div>`;
  });
  screen.innerHTML = html + "</div>"; wireGo();
  const bks = [...screen.querySelectorAll(".bk")];
  bks.forEach(b => b.onclick = () => { b.classList.toggle("hid"); SFX.tap(); });
  $("hideAll").onclick = () => { bks.forEach(b => b.classList.add("hid")); SFX.tap(); screen.dataset.all = "1"; };
  $("showAll").onclick = () => { bks.forEach(b => b.classList.remove("hid")); SFX.tap(); };
  bks.forEach(b => b.addEventListener("click", () => { if (screen.dataset.all === "1" && !S.peeked && bks.every(x => !x.classList.contains("hid"))) { S.peeked = true; save(); addXp(20); checkBadges(); } }));
};

/* ---------- Abzeichen ---------- */
function badgeGrid(haben, vergleich) {
  return Object.entries(BADGE_KAT).map(([k, name]) => {
    const liste = BADGES.filter(b => b.kat === k);
    return `<div class="label" style="margin:16px 0 8px">${name}</div><div class="badges">${liste.map(b => {
      const got = haben.includes(b.id), cmp = vergleich ? vergleich.includes(b.id) : null;
      return `<div class="badge ${got ? "got" : ""}"><div class="medal">${svg(b.ic, got ? "#2a1d00" : "var(--muted)")}</div><b>${esc(b.name)}</b><span>${esc(b.d)}</span>
        ${vergleich ? `<span class="cmp"><i class="${got ? "ja" : ""}">${got ? "✓" : "–"}</i><i class="${cmp ? "ja" : ""}">${cmp ? "✓" : "–"}</i></span>` : `<span class="btal">+${b.tal || 5}</span>`}</div>`;
    }).join("")}</div>`;
  }).join("");
}
VIEWS.badges = () => {
  screen.innerHTML = `${backBtn()}<h1>Abzeichen</h1><p class="muted small" style="margin:0 0 4px">${S.badges.length} von ${BADGES.length} gesammelt · jedes bringt Talente.</p>${badgeGrid(S.badges)}`;
  wireGo();
};

/* ---------- Talente-Laden ---------- */
const SHOP_TABS = [["ruestung", "Waffenrüstung"], ["avatar", "Avatare"], ["rahmen", "Rahmen"], ["titel", "Titel"], ["farbe", "Farben"]];
let shopTab = "ruestung";
function kaufen(id, preis, el) {
  if (S.tal < preis) { SFX.wrong(); shakeScreen(); toast(`${svg("gem", "var(--muted)")}<div>Dir fehlen noch <b>${preis - S.tal} Talente</b>.</div>`); return false; }
  S.tal -= preis; if (!S.owned.includes(id)) S.owned.push(id);
  SFX.coin(); if (el) { const [x, y] = centerOf(el); burst(x, y, 50, { up: 4 }); }
  save(); renderHud(); checkBadges(); lbSync(); return true;
}
VIEWS.shop = (tab) => {
  if (tab) shopTab = tab;
  const vorschau = `<div class="shop-vorschau card">${avatarHtml({ avatar: S.avatar, frame: S.frame, name: S.lbName || "Du" }, 64)}<div><b>${esc(S.lbName || "Du")}</b><div class="small muted">${esc(titelName(S.title) || titleOf(levelOf(S.xp)))}</div>${ruestungHtml(armorCount(), false)}</div></div>`;
  let inhalt = "";
  const karte = (o) => `<div class="item ${o.akt ? "aktiv" : ""}"><div class="ivor">${o.vor}</div><div class="itext"><b>${esc(o.name)}</b>${o.text ? `<span class="small muted">${esc(o.text)}</span>` : ""}${o.bezug ? `<span class="ibezug">${esc(o.bezug)}</span>` : ""}${o.vers ? `<span class="ivers">${esc(o.vers)}</span>` : ""}</div>${o.knopf}</div>`;
  const knopf = (kat, it, aktiv) => {
    if (it.price < 0) return S.badges.includes(it.need) ? (aktiv ? `<button class="btn ghost mini" disabled>Aktiv</button>` : `<button class="btn mini" data-eq="${kat}" data-id="${it.id}">Anlegen</button>`) : `<span class="ilock">${svg("lock")} Abzeichen „${esc((BADGES.find(b => b.id === it.need) || {}).name || "")}“</span>`;
    if (itemFrei(kat === "farbe" ? "" : kat.slice(0, 2) + "-", it)) return aktiv ? `<button class="btn ghost mini" disabled>Aktiv</button>` : `<button class="btn mini" data-eq="${kat}" data-id="${it.id}">Anlegen</button>`;
    /* Avatare und Rahmen: Schritt für Schritt – erst das günstigere, dann das nächste */
    if (kat === "av" || kat === "fr") {
      const liste = (kat === "av" ? AVATARE : RAHMEN).filter(x => x.price > 0);
      const naechstes = liste.find(x => !S.owned.includes(kat + "-" + x.id));
      if (naechstes && naechstes.id !== it.id) return `<span class="ilock">${svg("lock")} erst ${esc(naechstes.name)}</span>`;
    }
    return `<button class="btn primary mini" data-buy="${kat}" data-id="${it.id}" data-p="${it.price}">${it.price} ${svg("coin")}</button>`;
  };
  if (shopTab === "ruestung") {
    const n = armorCount();
    inhalt = `<p class="small muted" style="margin:0">Lege die Waffenrüstung Gottes Stück für Stück an (Epheser 6,10-17). Jedes Teil erscheint neben deinem Namen in der Rangliste. Mit allen sechs wirst du „Gewappnet“.</p>
    <div class="ruest-figur">${RUESTUNG.map((r, k) => `<span class="${k < n ? "an" : ""}">${svg("ar-" + r.id)}</span>`).join("")}</div>` +
      RUESTUNG.map((r, k) => {
        const hat = S.owned.includes("ar-" + r.id), dran = k === n;
        return karte({ name: r.name, vers: `„${r.vers}“ – ${r.ref}`, vor: `<span class="ruest-ic ${hat ? "an" : ""}">${svg("ar-" + r.id)}</span>`,
          knopf: hat ? `<span class="iok">${svg("check")} angelegt</span>` : dran ? `<button class="btn primary mini" data-buy="ruestung" data-id="${r.id}" data-p="${r.price}">${r.price} ${svg("coin")}</button>` : `<span class="ilock">${svg("lock")} erst ${esc(RUESTUNG[n] ? RUESTUNG[n].name : "")}</span>` });
      }).join("");
  } else if (shopTab === "avatar") {
    inhalt = AVATARE.map(a => karte({ name: a.name, bezug: a.bezug, akt: S.avatar === a.id, vor: avatarHtml({ avatar: a.id, frame: S.frame, name: S.lbName || "Du" }, 48), knopf: knopf("av", a, S.avatar === a.id) })).join("");
  } else if (shopTab === "rahmen") {
    inhalt = RAHMEN.map(r => karte({ name: r.name, bezug: r.bezug, akt: S.frame === r.id, vor: avatarHtml({ avatar: S.avatar, frame: r.id, name: S.lbName || "Du" }, 48), knopf: knopf("fr", r, S.frame === r.id) })).join("");
  } else if (shopTab === "titel") {
    inhalt = TITEL.map(t => karte({ name: t.name, bezug: t.bezug, akt: S.title === t.id, vor: `<span class="ruest-ic ${t.id === "none" ? "" : "an"}">${svg(t.id === "none" ? "user" : "scroll")}</span>`, knopf: knopf("ti", t, S.title === t.id) })).join("");
  } else if (shopTab === "farbe") {
    inhalt = THEMES.map(t => karte({ name: t.name, bezug: t.bezug, akt: S.theme === t.id, vor: `<span class="swatch" style="background:linear-gradient(135deg,${t.c},#1b2146)"></span>`, knopf: knopf("farbe", t, S.theme === t.id) })).join("");

  }
  screen.innerHTML = `${backBtn()}<h1>Talente-Laden</h1>
    <p class="muted small" style="margin:0 0 10px">Talente verdienst du mit Sternen, Tagesaufgaben, Blitz-Runden, Ketten, Abzeichen und Levelaufstiegen.</p>
    ${vorschau}
    <div class="tabs" role="tablist">${SHOP_TABS.map(([id, n]) => `<button role="tab" data-tab="${id}" aria-selected="${shopTab === id}">${n}</button>`).join("")}</div>
    <div class="stack">${inhalt}</div>`;
  wireGo();
  screen.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { SFX.tap(); VIEWS.shop(b.dataset.tab); });
  screen.querySelectorAll("[data-buy]").forEach(b => b.onclick = () => {
    const kat = b.dataset.buy, id = b.dataset.id, p = +b.dataset.p;
    const pre = { ruestung: "ar-", av: "av-", fr: "fr-", ti: "ti-", farbe: "" }[kat];
    if (!kaufen(pre + id, p, b)) return;
    if (kat === "av") S.avatar = id; if (kat === "fr") S.frame = id; if (kat === "ti") S.title = id; if (kat === "farbe") { S.theme = id; applyTheme(); }
    if (kat === "ruestung") { const r = RUESTUNG.find(x => x.id === id); rain(60); modal(`<div class="label">Angelegt</div><div class="ruest-gross">${svg("ar-" + id)}</div><h2>${esc(r.name)}</h2><figure class="vers klein"><blockquote>${esc(r.vers)}</blockquote><figcaption>${esc(r.ref)} · ${VERS_QUELLE}</figcaption></figure><button class="btn primary" data-close>Amen</button>`); }
    save(); lbSync(); renderHud(); VIEWS.shop();
  });
  screen.querySelectorAll("[data-eq]").forEach(b => b.onclick = () => {
    const kat = b.dataset.eq, id = b.dataset.id; SFX.tap();
    if (kat === "av") S.avatar = id; if (kat === "fr") S.frame = id; if (kat === "ti") S.title = id; if (kat === "farbe") { S.theme = id; applyTheme(); }
    save(); lbSync(); renderHud(); VIEWS.shop();
  });
};

/* ---------- Mein Profil ---------- */
function statsZeilen(p) {
  return [
    ["Level", p.level || 1], ["XP gesamt", p.xp || 0], ["XP diese Woche", p.week === weekKey() ? p.weekXp || 0 : 0],
    ["Titel im AT", AT_TITEL[titelIndex(AT_TITEL, p.atP || 0)][1]], ["Titel im NT", NT_TITEL[titelIndex(NT_TITEL, p.ntP || 0)][1]],
    ["Kette Bibel", (p.bestChain ? p.bestChain + 1 : 0) + "/66"], ["Kette AT", (p.chainAT ? p.chainAT + 1 : 0) + "/39"], ["Kette NT", (p.chainNT ? p.chainNT + 1 : 0) + "/27"],
    ["Kette rückwärts", (p.chainRueck ? p.chainRueck + 1 : 0) + "/66"], ["Blitz-Rekord", p.blitz || 0], ["Blitz in Folge", p.combo != null ? p.combo : "–"], ["Spieltage (4 Wochen)", Array.isArray(p.tl) ? tage28(p.tl) : "–"], ["Frische Siegel", bewaehrtWert(p)], ["Serie (Tage)", p.streak || 0], ["Abzeichen", p.badges || 0], ["Waffenrüstung", (p.armor || 0) + "/6"]
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
  screen.innerHTML = `${backBtn()}<h1>Mein Profil</h1>
  <div class="card profil-kopf">${avatarHtml({ avatar: S.avatar, frame: S.frame, name: S.lbName || "Du" }, 84)}
    <div><h2 style="margin:0">${esc(S.lbName || "Noch ohne Namen")}</h2>${!S.pid && !S.offlineOnly ? `<div class="small muted">Erscheint in der Rangliste, sobald Internet da ist.</div>` : ""}<div class="muted">${esc(titelName(S.title) || titleOf(levelOf(S.xp)))}</div>${ruestungHtml(armorCount(), false)}</div></div>
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
  ${entwickler ? `<button class="btn" data-go="postfach" style="margin-top:12px;width:100%">${svg("post")} Postkasten${postfachNeu ? ` (${postfachNeu} neu)` : ""}</button>` : ""}
  <button class="feedback-link" id="fbLink2">${svg("chat")} Feedback an den Entwickler</button>
  <p class="small muted" style="margin-top:18px">Bibelverse: ${VERS_QUELLE} © Genfer Bibelgesellschaft.</p>`;
  wireGo();
  $("wechseln").onclick = () => { SFX.tap(); go("wer"); };
  $("fbLink2").onclick = () => { SFX.tap(); feedbackOeffnen(); };
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
    sg: siegelDaten().sg, bew: siegelDaten().bew,
    ...(S.eingeladenVon && S.eingeladenVon !== S.pid ? { von: S.eingeladenVon } : {})
  };
}
let lbTimer = null, cloudTimer = null;
function lbSync(now) {
  const L = window.LB; if (!S.lbName || S.offlineOnly || !L || !L.ok || !L.uid || namePruefungLaeuft) return;
  if (!S.pid) S.pid = neuePid();
  clearTimeout(lbTimer);
  lbTimer = setTimeout(() => {
    const opts = {}; if (!S.ownersSet && eigenePid(S.pid)) opts.owners = [L.uid];
    L.push(S.pid, lbPayload(), opts).then(() => { if (opts.owners) { S.ownersSet = true; try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} geraetSpeichern(); } }).catch(e => dbFehler("Rangliste speichern", e));
  }, now ? 0 : 2500);
}
/* Datenbankfehler (z. B. abgelehnt durch die Regeln) an den Verwalter melden – Verbindungsprobleme nicht */
function dbFehler(was, e) {
  const code = (e && e.code) || "unbekannt";
  if (["unavailable", "deadline-exceeded", "cancelled"].includes(code) || (typeof navigator !== "undefined" && navigator.onLine === false) || String(e && e.message) === "offline") return;
  postkastenMelden("datenbank", `${was} fehlgeschlagen (${code}) – Spieler ${S.lbName || "?"}, Profil ${S.pid || "?"}, Version ${APP_VERSION}.`, "dbf-" + was + "-" + code);
}
/* Kompletten Spielstand online sichern (nur wer in der Rangliste ist) */
function cloudSync(now) {
  const L = window.LB; if (!S.lbName || S.offlineOnly || !S.pid || !S.ownersSet || !L || !L.ok || !L.saveState) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => { L.saveState(S.pid, spielstandExport()).catch(e => dbFehler("Spielstand sichern", e)); }, now ? 0 : 4000);
}
function spielstandExport() { const c = JSON.parse(JSON.stringify(S)); delete c.mute; delete c.beat; return c; }
/* Zwei Spielstände zusammenführen – nichts geht verloren */
function zusammenfuehren(r) {
  if (!r || typeof r !== "object") return;
  const max = k => { S[k] = Math.max(+S[k] || 0, +r[k] || 0); };
  ["xp", "tal", "right", "bestStreak", "bestChain", "chainAT", "chainNT", "chainRueck", "bestBlitz", "bestCombo", "questBonusCount", "bestGoalStreak", "bestDayRight"].forEach(max);
  ["aufgefrischt", "eingeladen", "fischerDabei", "menschenfischer"].forEach(k => { S[k] = !!(S[k] || r[k]); });
  S.tage = [...new Set([...(S.tage || []), ...(r.tage || [])])].sort((a, b) => a - b).slice(-35);
  S.treueWochen = [...new Set([...(S.treueWochen || []), ...(r.treueWochen || [])])];
  ["bibel", "at", "nt", "rueck"].forEach(k => { S.meister[k] = [...new Set([...((S.meister || {})[k] || []), ...((r.meister || {})[k] || [])])].sort((a, b) => a - b); });
  ["peeked", "gapPerfect", "earlyBird", "podium", "wochensieger", "wochenziel"].forEach(k => { S[k] = !!(S[k] || r[k]); });
  ["badges", "owned", "songHeard"].forEach(k => { S[k] = [...new Set([...(S[k] || []), ...(r[k] || [])])]; });
  Object.entries(r.stars || {}).forEach(([k, v]) => { S.stars[k] = Math.max(S.stars[k] || 0, v || 0); });
  if (dayNum(r.lastDay) > dayNum(S.lastDay)) { S.lastDay = r.lastDay; S.streak = r.streak; } else if (r.lastDay === S.lastDay) S.streak = Math.max(S.streak, r.streak || 0);
  if (r.weekKey === S.weekKey) S.weekXp = Math.max(S.weekXp, r.weekXp || 0); else if ((r.weekKey || "") > (S.weekKey || "")) { S.weekKey = r.weekKey; S.weekXp = r.weekXp; }
  if (r.todayDay === S.todayDay) { S.todayXp = Math.max(S.todayXp, r.todayXp || 0); S.todayRight = Math.max(S.todayRight || 0, r.todayRight || 0); }
  if (r.lastGoalDay && dayNum(r.lastGoalDay) > dayNum(S.lastGoalDay)) { S.lastGoalDay = r.lastGoalDay; S.goalStreak = r.goalStreak; }
  if (r.dq && r.dq.day === today() && S.dq && S.dq.day === today()) {
    S.dq.items.forEach((it, k) => { const o = r.dq.items[k]; if (o && o.id === it.id) { it.prog = Math.max(it.prog, o.prog); it.done = it.done || o.done; } }); S.dq.bonus = S.dq.bonus || r.dq.bonus;
  }
  ["avatar", "frame", "title", "theme"].forEach(k => { if ((S[k] === DEF[k]) && r[k]) S[k] = r[k]; });
  if (r.lbName && !S.lbName) S.lbName = r.lbName;
}
/* Diesem Gerät ein bestehendes Spielerprofil zuordnen (Kopplungscode oder Zusammenführung durch den Verwalter) */
async function profilBeitreten(pid, opts = {}) {
  const L = window.LB;
  /* bisheriger eigener Eintrag (auch aus älteren App-Versionen ohne gespeicherte Kennung = Gerätekennung) */
  const altPid = S.pid ? (eigenePid(S.pid) ? S.pid : "") : (L.uid && !uidAnderweitigBelegt() ? L.uid : "");
  const daten = await L.join(pid, opts);
  let remote = null; try { remote = await L.loadState(pid); } catch (e) {}
  if (remote) zusammenfuehren(remote);
  else if (daten) { /* noch kein Online-Spielstand: Werte aus der Rangliste übernehmen */
    zusammenfuehren(ausRangliste(daten));
  }
  S.lbName = (daten && daten.name) || S.lbName; S.pid = pid; S.ownersSet = true;
  if (altPid && altPid !== pid && !GERAET.liste.some(p => p.key !== GERAET.aktiv && p.pid === altPid)) { try { await L.remove(altPid); } catch (e) {} }
  applyTheme(); save(); renderHud(); checkBadges(); lbSync(true); cloudSync(true);
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
      if (S.ownersSet || S.pid !== L.uid) { const r = await L.loadState(S.pid).catch(() => null); if (r) { zusammenfuehren(r); save(); renderHud(); } }
      /* Höhere Werte aus dem eigenen Ranglisten-Eintrag übernehmen (z. B. nach automatischem Zusammenführen) */
      if (L.holeSpieler) { const e = await L.holeSpieler(S.pid).catch(() => null); if (e && !e.zu && (e.xp || 0) > S.xp) { zusammenfuehren(ausRangliste(e)); save(); renderHud(); } }
      lbSync(true); cloudSync();
    }
  } catch (e) {}
}
const uidAnderweitigBelegt = () => { const L = window.LB; return GERAET.liste.some(p => p.key !== GERAET.aktiv && p.pid === L.uid); };
/* Werte eines Ranglisten-Eintrags als Spielstand (falls kein Online-Spielstand vorhanden ist) */
function ausRangliste(d) {
  return { weekKey: d.week, weekXp: d.weekXp || 0, xp: d.xp, bestChain: d.bestChain, chainAT: d.chainAT, chainNT: d.chainNT, chainRueck: d.chainRueck, bestBlitz: d.blitz, bestCombo: d.combo, bestStreak: d.bestStreak, badges: d.badgeIds || [], tage: Array.isArray(d.tl) ? d.tl : [] };
}
/* Gerät hat schon einen Ranglisten-Eintrag, aber kein Name ist gespeichert: nachfragen */
function wiedererkennen(r) {
  if (document.querySelector(".modal")) return;
  modal(`<div class="label">Willkommen zurück</div>${avatarHtml(r, 64)}<h2>Bist du ${esc(r.name)}?</h2><p class="muted small">Auf diesem Gerät wurde schon als ${esc(r.name)} gespielt (${(r.xp || 0).toLocaleString("de-DE")} XP). Alle Punkte und Abzeichen werden übernommen.</p>
    <button class="btn primary" data-close="ja">Ja, ich bin ${esc(r.name)}</button><button class="btn ghost" data-close="nein">Nein, jemand anderes</button>`, async a => {
    if (a !== "ja") return;
    try { await profilBeitreten(r.id, {}); SFX.win(); rain(70); toast(`${svg("people", accent())}<div><b>Willkommen zurück, ${esc(S.lbName)}!</b><div class="small muted">Dein Fortschritt ist übernommen.</div></div>`); go("home"); }
    catch (e) { toast("<div>Das hat nicht geklappt. Prüfe die Internetverbindung.</div>"); }
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
  blitz: { label: "Blitz", unit: "Richtige", titel: "Blitz-Rekord" }
};
/* Vier Kategorien; Unterteilungen erscheinen als kleiner Umschalter im Listenkopf */
const RANK_KAT = [
  { id: "erfahrung", name: "Erfahrung", icon: "star", tabs: ["woche", "gesamt"] },
  { id: "kette", name: "Kette", icon: "link", tabs: ["kette"] },
  { id: "blitz", name: "Blitz", icon: "bolt", tabs: ["blitz"] },
  { id: "ausdauer", name: "Ausdauer", icon: "fire", tabs: ["treue", "bewaehrt", "abzeichen"] }
];
const katVon = tab => RANK_KAT.find(k => k.tabs.includes(tab)) || RANK_KAT[0];
const letzterTab = {};
const TAB_LABEL = { woche: "Woche", gesamt: "Gesamt", kette: "Kette", blitz: "Blitz", treue: "Spieltage", bewaehrt: "Bewährt", abzeichen: "Abzeichen" };
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
function rankKind() { return rankTab === "kette" ? "kette_" + ketteSub : rankTab === "blitz" ? (blitzSub === "folge" ? "combo" : "blitz") : rankTab; }
/* Gemeinde-Treue: wie viele haben diese Woche an mindestens TREUE_TAGE Tagen gespielt? */
function treueBarometer(rows, me) {
  const wk = weekKey();
  const treu = rows.filter(r => r.id !== me && Array.isArray(r.tl) && r.tl.filter(n => weekKey(datumVon(n)) === wk).length >= TREUE_TAGE).length + (tageDieseWoche() >= TREUE_TAGE ? 1 : 0);
  return { treu, ichTreu: tageDieseWoche() >= TREUE_TAGE, meineTage: tageDieseWoche() };
}
function treueBonusPruefen(b) {
  const wk = weekKey(); if (S.treueBonus.week !== wk) S.treueBonus = { week: wk, stufen: [] };
  if (!b.ichTreu) return;
  TREUE_STUFEN.forEach(([n, tal, name], k) => {
    if (b.treu >= n && !S.treueBonus.stufen.includes(k)) {
      S.treueBonus.stufen.push(k); S.tal += tal; if (k === TREUE_STUFEN.length - 1) S.wochenziel = true;
      setTimeout(() => { SFX.win(); rain(60); toast(`${svg("people", accent())}<div><b>Gemeinde-Treue ${name}!</b><div class="small muted">${n} Treue diese Woche – du bekommst +${tal} Talente.</div></div>`); }, 600 + k * 900);
    }
  });
  save(); renderHud(); checkBadges();
}
VIEWS.rank = (tab) => {
  if (tab && RANK_TABS[tab]) rankTab = tab;
  const L = window.LB;
  let html = `${backBtn()}<div class="church rk-head"><img src="logo.png" alt="Logo der Freien Baptisten Eichstätt" onerror="this.remove()"><div><h1>Rangliste</h1><span>Freie Baptisten Eichstätt</span></div></div>`;
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
    <details class="treue-kurz" id="zielBox"><summary><span class="tk-ic">${svg("people")}</span><span class="tk-tx"><b>Gemeinde-Treue</b><span class="tk-bar"><i style="width:0"></i></span></span><span class="tk-st">…</span></summary><div class="tk-mehr small muted">wird berechnet …</div></details>
    <nav class="rk-nav" aria-label="Ranglisten">${RANK_KAT.map(k => `<button data-kat="${k.id}" aria-pressed="${k.id === kat.id}"><span class="rk-ic">${svg(k.icon)}</span><span>${k.name}</span></button>`).join("")}</nav>
    <div class="card rk-liste">
      <div class="rk-kopf"><div><b>${esc(titel)}</b><span class="small muted" id="rcount">${rankTab === "woche" ? weekKey().split("-W")[1] + ". Kalenderwoche" : ""}</span></div>${varianten ? `<div class="rk-var" role="group" aria-label="Variante">${varianten}</div>` : ""}</div>
      <div id="rbody"><p class="muted" style="margin:0">Lade Rangliste …</p></div>
    </div>
    <div class="du-bar" id="rme"></div>
  </div>`;
  wireGo();
  screen.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { SFX.tap(); go("rank", b.dataset.tab); });
  screen.querySelectorAll("[data-kat]").forEach(b => b.onclick = () => { SFX.tap(); const k = RANK_KAT.find(x => x.id === b.dataset.kat); go("rank", letzterTab[k.id] || k.tabs[0]); });
  screen.querySelectorAll("[data-sub]").forEach(b => b.onclick = () => { SFX.tap(); ketteSub = b.dataset.sub; go("rank", "kette"); });
  screen.querySelectorAll("[data-bsub]").forEach(b => b.onclick = () => { SFX.tap(); blitzSub = b.dataset.bsub; go("rank", "blitz"); });
  const me = S.pid || L.uid; const wk = weekKey(); let zeilen = [];
  /* Gemeinde-Treue */
  lbUnsub.push(L.watch("woche", wk, rows => {
    if (current !== "rank") return;
    const b = treueBarometer(rows, me), max = TREUE_STUFEN[TREUE_STUFEN.length - 1][0];
    const naechste = TREUE_STUFEN.find(([n]) => b.treu < n);
    treueBonusPruefen(b);
    const box = $("zielBox"); if (!box) return;
    box.querySelector(".tk-bar i").style.width = Math.min(1, b.treu / max) * 100 + "%";
    box.querySelector(".tk-st").innerHTML = naechste ? `<b>${b.treu}</b>/${naechste[0]} <em>${naechste[2]}</em>` : `<b>${b.treu}</b> <em>Gold</em>`;
    box.querySelector(".tk-mehr").innerHTML = `<div class="treue-skala"><div class="zielbar"><i style="width:${Math.min(1, b.treu / max) * 100}%"></i></div>
        ${TREUE_STUFEN.map(([n, tal, name]) => `<span class="stufe ${b.treu >= n ? "an" : ""}" style="left:${n / max * 100}%"><i>${n}</i><em>${name}</em></span>`).join("")}</div>
      <p style="margin:0">Treu ist, wer diese Woche an ${TREUE_TAGE} Tagen spielt. ${naechste ? `Noch ${naechste[0] - b.treu} bis ${naechste[2]}: +${naechste[1]} Talente für jeden Treuen.` : "Gold erreicht! Ein Leib, viele Glieder."}</p>
      <p style="margin:6px 0 0">Du: ${b.meineTage}/${TREUE_TAGE} Tage ${b.ichTreu ? "– du zählst mit!" : "– noch " + (TREUE_TAGE - b.meineTage) + " Tag(e), dann zählst du mit."}</p>`;
  }, () => {}));
  lbUnsub.push(L.watch(rankKind(), wk, rows => {
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
      const person = (r, sz) => `<button class="gk-p ${r.id === me ? "me" : ""}" data-pid="${esc(r.id)}">${avatarLv(r, sz)}<b>${esc(r.name)}</b></button>`;
      const gold = `<div class="gk-gold"><span class="pod-krone">${svg("crown")}</span>
        <div class="gk-t">${voll ? vollText : `Platz 1 · ${wert1} ${esc(unit)}`}${g1.length > 1 ? `<small>${g1.length} Spieler teilen sich Platz 1</small>` : voll ? `<small>${wert1} ${esc(unit)}</small>` : ""}</div>
        <div class="gk-leute">${g1.map(r => person(r, g1.length > 4 ? 44 : 50)).join("")}</div></div>`;
      const klein = (n, g) => g.length ? `<div class="gk-k gk-k${n}"><div class="gk-h"><span class="gk-med">${n}</span><span>${rankWert(g[0])} ${esc(unit)}</span></div>
        <div class="gk-stapel">${g.slice(0, 5).map(r => `<button data-pid="${esc(r.id)}" class="${r.id === me ? "me" : ""}">${avatarLv(r, 36)}</button>`).join("")}${g.length > 5 ? `<span class="gk-mehr">+${g.length - 5}</span>` : ""}</div>
        <div class="gk-namen">${g.map(r => esc(r.name)).join(", ")}</div></div>` : "";
      const pod = `<div class="gk">${gold}${g2.length ? `<div class="gk-zd">${klein(2, g2)}${klein(3, g3)}</div>` : ""}</div>`;
      const rest = rows.map((r, i) => [r, platz[i]]).filter(([, p]) => p > 3).slice(0, 80).map(([r, p], k, arr) => `<button class="rrow ${r.id === me ? "me" : ""}" data-pid="${esc(r.id)}"><div class="rk">${k && arr[k - 1][1] === p ? "" : p}</div>${avatarLv(r, 38)}<div class="who"><b>${esc(r.name)}${r.id === me ? '<span class="you">DU</span>' : ""}</b><span>${esc(titelName(r.title) || titleOf(r.level || 1))}</span>${rankTab === "bewaehrt" ? siegelReihe(r) : ruestungHtml(r.armor)}</div><div class="val">${rankWert(r)}</div></button>`).join("");
      if ($("rcount")) $("rcount").textContent = (rankTab === "woche" ? wk.split("-W")[1] + ". KW · " : "") + rows.length + " Spieler";
      body.innerHTML = `${pod}${rest ? `<div class="rlist">${rest}</div>` : ""}`;
      body.querySelectorAll("[data-pid]").forEach(b => b.onclick = () => { SFX.tap(); profilVergleich(rows.find(r => r.id === b.dataset.pid)); });
    }
    const mv = myIdx > -1 ? rankWert(rows[myIdx]) : 0;
    const vor = myIdx > -1 && meinPlatz > 1 ? rows.filter((_, i) => platz[i] === meinPlatz - 1) : [];
    const ahead = vor.length ? rankWert(vor[0]) - mv : 0;
    const ich = myIdx > -1 ? rows[myIdx] : { name: S.lbName, avatar: S.avatar, frame: S.frame, level: levelOf(S.xp) };
    $("rme").innerHTML = `${avatarLv(ich, 36)}<div class="du-tx"><b>Platz ${meinPlatz || "–"} · ${mv} ${esc(unit || "")}</b><span>${vor.length ? `Noch ${ahead + 1} bis Platz ${meinPlatz - 1} (${esc(vor[0].name)}${vor.length > 1 ? " u. a." : ""})` : meinPlatz === 1 ? "Du bist an der Spitze!" : "Spiel eine Runde für deinen Platz"}</span></div>${meinPlatz === 1 ? `<span class="du-krone">${svg("crown")}</span>` : ""}`;
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
  const z = GERAET.liste.find(p => p.key !== GERAET.aktiv && p.name); if (z) { GERAET.aktiv = z.key; try { localStorage.setItem(LS_SPIELER, JSON.stringify(GERAET)); sessionStorage.removeItem("bq-gewaehlt"); } catch (e) {} location.reload(); }
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
    const liste = alle.filter(r => !q || String(r.name).toLowerCase().includes(q));
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
        screen.querySelector("#nliste").innerHTML = `<p class="muted small">Verbinde …</p>`;
        try { await profilBeitreten(r.id, {}); SFX.win(); rain(80); toast(`${svg("people", accent())}<div><b>Willkommen zurück, ${esc(S.lbName)}!</b><div class="small muted">Dein Spielstand ist jetzt auf diesem Gerät.</div></div>`); fertig(); }
        catch (e) { SFX.wrong(); zeichne(); toast(`<div>Das hat nicht geklappt. Prüfe die Internetverbindung.</div>`); }
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
      p.name = n; try { localStorage.setItem(LS_SPIELER, JSON.stringify(GERAET)); } catch (e) {}
    }
    document.querySelectorAll(".modal").forEach(m => m.remove()); SFX.coin(); go("wer");
  };
}
/* Wer spielt? – alle Spieler auf diesem Gerät */
VIEWS.wer = () => {
  geraetSpeichern();
  const liste = GERAET.liste.filter(p => p.name);
  screen.innerHTML = `${backBtn()}<h1>Wer spielt?</h1>
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
      GERAET.liste = GERAET.liste.filter(x => x.key !== p.key); try { localStorage.setItem(LS_SPIELER, JSON.stringify(GERAET)); } catch (e) {} go("wer");
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
    <div class="vg-kopf">${avatarLv(r, 72)}<div><h2 style="margin:0">${esc(r.name)}</h2><div class="muted small">${esc(titelName(r.title) || "Level " + (r.level || 1) + " · " + titleOf(r.level || 1))}</div><div class="small"><span class="tag at">AT</span> ${esc(AT_TITEL[titelIndex(AT_TITEL, r.atP || 0)][1])} · <span class="tag nt">NT</span> ${esc(NT_TITEL[titelIndex(NT_TITEL, r.ntP || 0)][1])}</div>${ruestungHtml(r.armor, false)}</div></div>
    <table class="werte vg"><thead><tr><th></th><th>${esc(r.name)}</th>${istIch ? "" : "<th>Du</th>"}</tr></thead><tbody>
      ${zeilenR.map(([k, v], j) => `<tr><th>${k}</th><td>${esc(v)}</td>${istIch ? "" : `<td>${esc(zeilenI[j][1])}</td>`}</tr>`).join("")}</tbody></table>
    ${Array.isArray(r.sg) ? `<div class="label" style="margin:12px 0 6px">Siegel</div>${siegelReihe(r)}` : ""}
    ${hatIds ? `<div class="small muted" style="margin-top:8px">${istIch ? "" : `Spalten bei den Abzeichen: links ${esc(r.name)}, rechts du.`}</div>${badgeGrid(r.badgeIds, istIch ? null : S.badges)}` : `<p class="small muted">Die Abzeichen sind sichtbar, sobald ${esc(r.name)} die neue App-Version öffnet.</p>`}
    </div><button class="btn primary" data-close>Schließen</button>`);
  m.dataset.frei = "1"; m.classList.add("weit");
}

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
    <label class="small fb-name"><input type="checkbox" id="fbMitName" ${S.lbName ? "checked" : "disabled"}> Mit meinem Namen senden${S.lbName ? ` („${esc(S.lbName)}“)` : ""}</label>
    <p class="small muted" style="margin:0">Mitgesendet wird außerdem: App-Version ${APP_VERSION} · ${esc(geraetBeschreibung())}. Nur der Entwickler kann das Feedback lesen.</p>
    <div class="small" id="fbErr" aria-live="polite"></div>
    <button class="btn primary" id="fbSenden">Senden</button><button class="btn ghost" data-close>Abbrechen</button>`);
  setTimeout(() => { const t = $("fbText"); if (t) t.focus(); }, 50);
  $("fbSenden").onclick = async () => {
    const text = $("fbText").value.trim();
    if (text.length < 3) { $("fbErr").style.color = "var(--bad)"; $("fbErr").textContent = "Bitte schreib ein paar Worte."; SFX.wrong(); return; }
    const mitName = $("fbMitName").checked && !!S.lbName;
    const f = { text, art: (document.querySelector('input[name="fbArt"]:checked') || {}).value || "idee", ver: APP_VERSION, geraet: geraetBeschreibung(), ...(mitName ? { name: S.lbName, pid: S.pid || "" } : {}), wann: new Date().toISOString() };
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
  const L = window.LB; if (!L || !L.ok || !L.entwicklerPid || !S.pid) return;
  try {
    const pid = await L.entwicklerPid(); entwickler = !!pid && pid === S.pid;
    if (!entwickler) { renderHud(); return; }
    await doppelteZusammenfuehren();
    await statusBerichte();
    const liste = await L.feedbackListe(); postfachNeu = liste.filter(f => !f.erledigt).length; renderHud();
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
let postfachFilter = "neu";
VIEWS.postfach = (kat) => {
  const L = window.LB; if (kat && PK_KAT.some(k => k[0] === kat)) pkKategorie = kat;
  screen.innerHTML = `${backBtn()}<h1>Postkasten</h1>
  <p class="muted small" style="margin:0 0 10px">Nur für dich als Verwalter: Feedback der Spieler, Statusberichte und Meldungen aus der Datenbank.</p>
  <nav class="rk-nav pk-nav" aria-label="Postkasten">${PK_KAT.map(([k, n, ic]) => `<button data-pk="${k}" aria-pressed="${k === pkKategorie}"><span class="rk-ic">${svg(ic)}</span><span>${n}<i class="pk-n" data-pkn="${k}"></i></span></button>`).join("")}</nav>
  <div class="card rk-liste" style="margin-top:10px"><div class="rk-kopf"><div><b>${esc(PK_KAT.find(k => k[0] === pkKategorie)[1])}</b><span class="small muted" id="pkAnz"></span></div>
    <div class="rk-var" role="group" aria-label="Filter">${[["neu", "Neu"], ["alle", "Alle"], ["erledigt", "Erledigt"]].map(([k, n]) => `<button data-pf="${k}" aria-pressed="${k === postfachFilter}">${n}</button>`).join("")}</div></div>
  <div class="stack" id="pfListe" style="margin-top:6px"><p class="muted small">Lade …</p></div></div>
  ${pkKategorie === "datenbank" || pkKategorie === "alle" ? `<button class="btn ghost breit" id="dupJetzt" style="margin-top:10px;width:100%">${svg("people")} Doppelte Namen jetzt prüfen</button>` : ""}`;
  wireGo();
  screen.querySelectorAll("[data-pf]").forEach(b => b.onclick = () => { SFX.tap(); postfachFilter = b.dataset.pf; go("postfach"); });
  screen.querySelectorAll("[data-pk]").forEach(b => b.onclick = () => { SFX.tap(); go("postfach", b.dataset.pk); });
  if ($("dupJetzt")) $("dupJetzt").onclick = async () => {
    SFX.tap(); const k = $("dupJetzt"); k.disabled = true; k.textContent = "Prüfe …";
    try {
      const b = await doppelteZusammenfuehren(true);
      modal(`<div class="label">Doppelte Namen</div><h2>${b.length ? "Ergebnis" : "Alles in Ordnung"}</h2>${b.length ? `<ul class="hinweisliste">${b.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : `<p class="muted">${doppelteGeprueft} Einträge geprüft – kein Name kommt doppelt vor.</p>`}<button class="btn primary" data-close>OK</button>`, () => go("postfach"));
    } catch (e) { modal(`<h2>Prüfung fehlgeschlagen</h2><p class="muted small">${esc((e && e.code) || "")} ${esc(String((e && e.message) || e).slice(0, 200))}</p><button class="btn primary" data-close>OK</button>`, () => go("postfach")); }
  };
  if (!entwickler || !L || !L.ok) { $("pfListe").innerHTML = `<p class="muted">Der Postkasten braucht Internet.</p>`; return; }
  const zeichne = (liste) => {
    postfachNeu = liste.filter(f => !f.erledigt).length; renderHud();
    PK_KAT.forEach(([k]) => { const n = liste.filter(f => !f.erledigt && (k === "alle" || pkKat(f) === k)).length; const e = screen.querySelector(`[data-pkn="${k}"]`); if (e) e.textContent = n ? n : ""; });
    const z = liste.filter(f => (pkKategorie === "alle" || pkKat(f) === pkKategorie) && (postfachFilter === "alle" || (postfachFilter === "neu" ? !f.erledigt : f.erledigt)));
    if ($("pkAnz")) $("pkAnz").textContent = z.length + (z.length === 1 ? " Eintrag" : " Einträge");
    $("pfListe").innerHTML = z.length ? z.map(f => { const kt = pkKat(f); return `<div class="card pf pk-${kt} ${f.erledigt ? "erledigt" : ""}" data-id="${esc(f.id)}">
        <div class="topline"><span class="pf-art art-${esc(kt === "feedback" ? f.art : kt)}">${esc(kt === "feedback" ? (ART_NAME[f.art] || f.art) : ART_NAME[kt])}</span><span class="small muted">${f.zeit ? new Date(f.zeit).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}</span></div>
        <p class="pf-text">${esc(f.text)}</p>
        <div class="small muted">${kt === "feedback" ? (f.name ? `von <b>${esc(f.name)}</b>` : "anonym") : (f.name ? esc(f.name) : "automatisch")} · ${esc(f.ver || "?")} · ${esc(String(f.geraet || "").replace(/^(status|datenbank) · /, ""))}</div>
        <div class="row-btns" style="margin-top:8px"><button class="btn ghost mini" data-erl="${esc(f.id)}">${f.erledigt ? "Wieder als neu" : "Erledigt"}</button><button class="btn ghost mini" data-del="${esc(f.id)}">Löschen</button></div></div>`; }).join("")
      : `<p class="muted" style="margin:6px 0">${postfachFilter === "neu" ? "Nichts Neues. 🙂" : "Keine Einträge."}</p>`;
    $("pfListe").querySelectorAll("[data-erl]").forEach(b => b.onclick = async () => { SFX.tap(); const f = liste.find(x => x.id === b.dataset.erl); try { await L.feedbackErledigt(f.id, !f.erledigt); f.erledigt = !f.erledigt; zeichne(liste); } catch (e) { toast("<div>Das hat nicht geklappt.</div>"); } });
    $("pfListe").querySelectorAll("[data-del]").forEach(b => b.onclick = () => { SFX.tap();
      modal(`<h2>Eintrag löschen?</h2><p class="muted small">Das lässt sich nicht rückgängig machen.</p><button class="btn primary" data-close="ja">Löschen</button><button class="btn ghost" data-close>Abbrechen</button>`, async a => {
        if (a !== "ja") return; try { await L.feedbackLoeschen(b.dataset.del); liste = liste.filter(x => x.id !== b.dataset.del); zeichne(liste); } catch (e) { toast("<div>Löschen hat nicht geklappt.</div>"); } }); });
  };
  L.feedbackListe().then(zeichne).catch(() => { $("pfListe").innerHTML = `<p class="muted">Postkasten konnte nicht geladen werden.</p>`; });
};

/* ---------- Teilen ---------- */
VIEWS.share = () => {
  const basis = location.origin + location.pathname.replace(/index\.html$/, "");
  const url = basis + (S.lbName && S.pid ? "?von=" + encodeURIComponent(S.pid) : "");
  let qr = ""; try { const q = qrcode(0, "M"); q.addData(url); q.make(); qr = q.createSvgTag({ cellSize: 8, margin: 2, scalable: true }); } catch (e) { qr = '<p style="color:#000">QR-Code konnte nicht erzeugt werden.</p>'; }
  screen.innerHTML = `${backBtn()}<h1>Mit Freunden teilen</h1>
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
addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredInstall = e; if (current === "home") go("home"); });
addEventListener("appinstalled", () => { deferredInstall = null; S.tal += 10; save(); renderHud(); SFX.badge(); toast(`${svg("down", accent())}<div><b>App installiert!</b><div class="small muted">+10 Talente als Dankeschön</div></div>`); });
if ("serviceWorker" in navigator && location.protocol === "https:") { addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {})); }

/* ---------- Start ---------- */
try { const von = new URLSearchParams(location.search).get("von"); if (von && /^[\w-]{4,64}$/.test(von)) { if (!S.lbName && !S.eingeladenVon) S.eingeladenVon = von; history.replaceState(null, "", location.pathname); } } catch (e) {}
$("hWer").onclick = () => { SFX.tap(); go(S.lbName ? "wer" : "name"); };
neuerTag(); applyTheme(); renderMute(); renderHud(); checkBadges(); geraetSpeichern(); go("home");
/* Mehrere Spieler auf dem Gerät? Dann beim Start fragen, wer spielt */
(() => {
  let gewaehlt = false; try { gewaehlt = sessionStorage.getItem("bq-gewaehlt") === "1"; sessionStorage.removeItem("bq-gewaehlt"); } catch (e) {}
  if (gewaehlt || !S.lbName || GERAET.liste.filter(p => p.name).length < 2) return;
  const m = modal(`${avatarHtml({ avatar: S.avatar, frame: S.frame, name: S.lbName }, 72)}<h2>Bist du ${esc(S.lbName)}?</h2><p class="muted small" style="margin:0">Auf diesem Gerät spielen mehrere Personen.</p>
    <button class="btn primary" data-close="ja">Ja, ich bin ${esc(S.lbName)}</button><button class="btn ghost" data-close="nein">Nein, jemand anderes</button>`, a => { if (a === "nein") go("wer"); });
  m.classList.add("frage");
})();
document.addEventListener("pointerdown", () => { ac(); }, { once: true });
