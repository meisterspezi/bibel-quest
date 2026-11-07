/* =====================================================================
   Advent 2026 – Logik und Ansichten (Version 7.3)
   Weg nach Bethlehem (Gemeinschaftsprojekt mit Spenden und Gemeinde-Zuschuss), Adventskalender (ab 1. Dezember),
   Advents-Biblionär (eine Runde je Adventswoche) und Duell-Aktion. Einstellungen und Inhalte: advent-daten.js.
   Wird vor spiel.js geladen; alles, was aus spiel.js gebraucht wird (S, save, go, modal …), wird erst beim Aufruf benutzt.
   ===================================================================== */

/* ---------- Datum (nur auf localhost testbar: ?advent=2026-12-05) ---------- */
function adventHeute() {
  try {
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
      const t = new URLSearchParams(location.search).get("advent") || sessionStorage.getItem("bq-advent-test");
      if (t && /^\d{4}-\d{1,2}-\d{1,2}$/.test(t)) { sessionStorage.setItem("bq-advent-test", t); return t; }
    }
  } catch (e) {}
  return today();
}
const adventTag = () => dayNum(adventHeute());
const adventSichtbar = () => { const t = adventTag(); return t >= dayNum(ADV_START) && t <= dayNum(ADV_SICHT_BIS); };
/* 1–4 = Adventswoche (Sonntag bis Samstag), 5 = vorbei, 0 = noch nicht */
function adventWoche() { const t = adventTag() - dayNum(ADV_START); return t < 0 ? 0 : t >= 28 ? 5 : Math.floor(t / 7) + 1; }
const advRunde = () => { const w = adventWoche(); return w >= 1 && w <= 4 ? w : 0; };
const kalHeuteNr = () => Math.min(24, Math.max(0, adventTag() - dayNum(KAL_START) + 1));
const adventDatum = tag => datumVon(tag).toLocaleDateString("de-DE", { day: "numeric", month: "long" });
const adventKurz = tag => datumVon(tag).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" });

/* ---------- Symbole, Abzeichen, Rahmen, Titel ---------- */
(function () {
  const W = inner => `<svg x="0" y="0" width="24" height="24" viewBox="0 0 64 64" overflow="visible" class="wr wr-lohn"><ellipse cx="32" cy="61" rx="17" ry="2.2" fill="#000" opacity=".3"/>${inner}</svg>`;
  ICONS.stern = W(`<path d="M32 4l8.2 17.6 19.3 2.3-14.3 13.2 3.8 19L32 46.6 15 56.1l3.8-19L4.5 23.9l19.3-2.3z" fill="url(#wrG)" stroke="#1b2a55" stroke-width="1.7" stroke-linejoin="round"/><path d="M24 22l8-11" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".8"/><path class="wr-spark" d="M54 8l1.5 4 4 1.5-4 1.5L54 19l-1.5-4-4-1.5 4-1.5z" fill="#fff"/>`);
  ICONS.kerze = W(`<rect x="22" y="26" width="20" height="32" rx="4" fill="#f6f1e6" stroke="#1b2a55" stroke-width="1.6"/><path d="M22 34h20" stroke="#b9b2a0" stroke-width="1.2"/><path d="M32 6c7 8 8 13 5 17-1.4 2-5.6 2-7 0-3-4-2-9 2-17z" fill="url(#wrF)" stroke="#1b2a55" stroke-width="1.4" stroke-linejoin="round"/><path d="M32 14c2.4 3 3 5 1.8 7-.6 1-2.8 1-3.6 0-1-2 0-4 1.8-7z" fill="#fff6c8"/><path d="M32 24v3" stroke="#1b2a55" stroke-width="1.6" stroke-linecap="round"/>`);
  ICONS.tuer = W(`<rect x="10" y="8" width="44" height="50" rx="5" fill="#8a2a3a" stroke="#1b2a55" stroke-width="1.6"/><rect x="16" y="14" width="32" height="38" rx="3" fill="#b03a4a" stroke="#1b2a55" stroke-width="1.2"/><path d="M32 14v38M16 33h32" stroke="#1b2a55" stroke-width="1.2" opacity=".6"/><circle cx="26" cy="33" r="2.2" fill="#f2c14e"/><circle cx="38" cy="33" r="2.2" fill="#f2c14e"/>`);
  ICONS.krippe = W(`<path d="M8 26L32 8l24 18" fill="#7a4a24" stroke="#1b2a55" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 26v30M52 26v30" stroke="#a56a32" stroke-width="4" stroke-linecap="round"/><path d="M18 46h28l-4 10H22z" fill="#c98a4b" stroke="#1b2a55" stroke-width="1.4" stroke-linejoin="round"/><ellipse cx="32" cy="43" rx="8" ry="4" fill="#fff6c8" stroke="#e0b04a" stroke-width="1"/>`);
  /* Abzeichen */
  const B = (id, name, d, ic, tal, ok) => BADGES.push({ id, kat: "gemeinschaft", name, d, ic, tal, ok });
  B("bethlehem", "Bethlehem-Pilger", "Beim Weg nach Bethlehem mitgeholfen – bis zur Krippe (Lukas 2,15)", "stern", 30,
    s => !!s.bethAngekommen && (Object.values(s.beth || {}).some(v => v > 0) || Object.values(s.bethG || {}).some(v => v > 0)));
  B("adventskalender", "Adventsbote", `${KAL_MEISTER} Türchen im Adventskalender geöffnet`, "tuer", 30, s => Object.keys(s.kal || {}).length >= KAL_MEISTER);
  B("advDuell", "Kerzenhüter", "In 3 Adventswochen die Duell-Aktion geschafft", "kerze", 20, s => (s.advDuOk || []).length >= 3);
  B("advBib", "Advents-Biblionär", "In 3 Adventswochen die Biblionär-Runde gespielt", "biblionaer", 20, s => Object.keys(s.advBib || {}).length >= 3);
  /* Rahmen und Titel zum Freischalten */
  RAHMEN.push({ id: "stern", name: "Stern von Bethlehem", price: -1, need: "bethlehem", bezug: "Die Weisen sagten: Wir haben seinen Stern gesehen und sind gekommen, ihn anzubeten (Matthäus 2,2)." });
  RAHMEN.push({ id: "kranz", name: "Adventskranz", price: -1, need: "adventskalender", bezug: "Das Licht scheint in der Finsternis, und die Finsternis hat es nicht überwältigt (Johannes 1,5)." });
  TITEL.push({ id: "bethlehem", name: "Bethlehem-Pilger", price: -1, need: "bethlehem", bezug: "Die Hirten sagten: Lasst uns nach Bethlehem gehen und die Sache sehen, die geschehen ist (Lukas 2,15)." });
  TITEL.push({ id: "adventsbote", name: "Adventsbote", price: -1, need: "adventskalender", bezug: "Der Engel sagte: Ich verkündige euch große Freude, die dem ganzen Volk widerfahren wird (Lukas 2,10)." });
  TITEL.push({ id: "kerzenhueter", name: "Kerzenhüter", price: -1, need: "advDuell", bezug: "Jesus sagt: Ihr seid das Licht der Welt (Matthäus 5,14)." });
  /* Rahmen-Overlays um den Avatar */
  const R = window.RAHMEN_SVG = window.RAHMEN_SVG || {};
  const ring = (stroke, w = 6) => `<circle cx="50" cy="50" r="38.8" fill="none" stroke="#141a3a" stroke-width="1.4"/><circle cx="50" cy="50" r="35" fill="none" stroke="${stroke}" stroke-width="${w}"/><circle cx="50" cy="50" r="32" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="1"/>`;
  const glanz = `<path d="M22 38a30 30 0 0 1 18-18" stroke="#fff" stroke-opacity=".75" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  R.stern = `<svg class="av-fr" viewBox="0 0 100 100" aria-hidden="true"><circle class="fr-schein" cx="50" cy="50" r="47" fill="url(#wrRschein)"/>${ring("url(#wrR_gold)", 6)}
    <path d="M50 -1l4.4 9.4 10.3 1.2-7.6 7 2 10.2L50 21.6 40.9 27.8l2-10.2-7.6-7 10.3-1.2z" fill="url(#wrG)" stroke="#1b2a55" stroke-width="1" stroke-linejoin="round" transform="translate(0 3)"/>
    <g stroke="#ffe39a" stroke-width="1.4" stroke-linecap="round"><path d="M50 30v6M18 60l5-3M82 60l-5-3"/></g>${glanz}</svg>`;
  R.kranz = `<svg class="av-fr" viewBox="0 0 100 100" aria-hidden="true">${ring("#2f6b3f", 7)}
    <g fill="#3f8a52" stroke="#1b3d24" stroke-width=".6">${Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2; return `<ellipse cx="${(50 + 35 * Math.cos(a)).toFixed(1)}" cy="${(50 + 35 * Math.sin(a)).toFixed(1)}" rx="5.4" ry="2.6" transform="rotate(${(a * 180 / Math.PI + 90).toFixed(0)} ${(50 + 35 * Math.cos(a)).toFixed(1)} ${(50 + 35 * Math.sin(a)).toFixed(1)})"/>`; }).join("")}</g>
    <g fill="#d93a4a" stroke="#6a1420" stroke-width=".5"><circle cx="83" cy="44" r="2.2"/><circle cx="17" cy="58" r="2.2"/><circle cx="62" cy="84" r="2.2"/><circle cx="30" cy="16" r="2.2"/></g>
    ${[[34, 9], [46, 6], [58, 6], [70, 9]].map(([x, y], i) => `<rect x="${x - 2.6}" y="${y}" width="5.2" height="9" rx="1.2" fill="${i === 2 ? "#e58fb8" : "#8a5cd6"}" stroke="#1b2a55" stroke-width=".6"/><path d="M${x} ${y - 6}c2.6 3 2.8 5 1 6.6-.8.6-2.2.6-2 0-1.6-1.6-1.4-3.6 1-6.6z" fill="url(#wrF)" stroke="#7a2a08" stroke-width=".4"/>`).join("")}${glanz}</svg>`;
})();

/* =====================================================================
   Weg nach Bethlehem
   ===================================================================== */
let bethDaten = null, bethZeit = 0, bethVersuch = 0, bethLaedt = null;
function bethLaden(neu) {
  const L = window.LB; if (!L || !L.ok || !L.bethListe) return Promise.resolve(bethDaten);
  if (!neu && bethDaten && Date.now() - bethZeit < 60e3) return Promise.resolve(bethDaten);
  if (bethLaedt) return bethLaedt;
  bethVersuch = Date.now();
  bethLaedt = L.bethListe().then(rows => { bethDaten = rows; bethZeit = Date.now(); return rows; }).catch(() => bethDaten).finally(() => { bethLaedt = null; });
  return bethLaedt;
}
const bethSumme = (r, k) => ((r.s || {})[k] | 0) + ((r.g || {})[k] | 0);
/* Stand des Wegs. Die Gabe jedes Spielers zählt mit Gemeinde-Zuschuss. Eine Station ist fertig, wenn ihr Ziel erreicht ist
   oder ihre Zeit abgelaufen ist (dann füllt die Gemeinde den Rest auf). Die nächste Station öffnet höchstens einen Tag früher als geplant. */
function bethStand() {
  const sum = BETH.map(() => 0), spender = BETH.map(() => []);
  const zeilen = (bethDaten || []).filter(r => r.pid !== S.pid);
  if (S.pid || Object.keys(S.beth || {}).length || Object.keys(S.bethG || {}).length) {
    const eig = (bethDaten || []).find(r => r.pid === S.pid) || { s: {}, g: {} }, s = {}, g = {};
    for (let k = 1; k <= 8; k++) { s[k] = Math.max((eig.s || {})[k] | 0, (S.beth || {})[k] | 0); g[k] = Math.max((eig.g || {})[k] | 0, (S.bethG || {})[k] | 0); }
    zeilen.push({ pid: S.pid, name: S.lbName, s, g, ich: true });
  }
  zeilen.forEach(r => { for (let k = 1; k <= 8; k++) { const v = bethSumme(r, k); if (v > 0) { sum[k - 1] += v; spender[k - 1].push(r.ich ? "Du" : r.name); } } });
  const eff = sum.map(v => Math.round(v * (1 + BETH_ZUSCHUSS)));
  const tag = adventTag(), start = dayNum(ADV_START);
  const fertigI = i => eff[i] >= BETH[i].ziel || tag >= start + BETH_TAGE * (i + 1);
  let k = 0; while (k < 8 && fertigI(k)) k++;
  const alle = k >= 8;
  return { sum, eff, spender, k, fertig: k, alle, krippe: alle && tag >= dayNum(ADV_KRIPPE), vorStart: tag < start,
    offen: k < 8 && tag >= start + BETH_TAGE * k - 1, ab: start + BETH_TAGE * k - 1, frist: start + BETH_TAGE * (k + 1) };
}
const bethRest = st => st.k >= 8 ? 0 : Math.ceil(Math.max(0, BETH[st.k].ziel - st.eff[st.k]) / (1 + BETH_ZUSCHUSS));
const bethHeuteGegeben = () => (S.bethTage || []).includes(adventTag());
function bethSerie() {
  const t = S.bethTage || []; let n = 0, d = adventTag(); if (!t.includes(d)) d--;
  while (t.includes(d)) { n++; d--; } return n;
}
function bethSenden() {
  const L = window.LB; if (!L || !L.ok || !L.bethSetzen || !S.pid || S.offlineOnly || !S.lbName) return;
  const sig = JSON.stringify([S.beth || {}, S.bethG || {}]); if (!Object.keys(S.beth || {}).length && !Object.keys(S.bethG || {}).length) return; if (S.bethSync === sig) return;
  const klaer = o => { const r = {}; Object.entries(o || {}).forEach(([k, v]) => { if (+k >= 1 && +k <= 8 && v > 0) r[k] = Math.min(v | 0, 20000); }); return r; };
  L.bethSetzen(S.pid, S.lbName, klaer(S.beth), klaer(S.bethG)).then(() => { S.bethSync = sig; save(); const s = klaer(S.beth), g = klaer(S.bethG); bethDaten = (bethDaten || []).filter(r => r.pid !== S.pid).concat([{ pid: S.pid, name: S.lbName, s, g }]); })
    .catch(e => { try { dbFehler("Weg nach Bethlehem speichern", e); } catch (e2) {} });
}
function bethSpenden(v, el) {
  const st = bethStand(); if (!st.offen) return;
  v = Math.min(v | 0, bethRest(st), S.tal | 0);
  if (v < 1) { SFX.wrong(); toast(`${TAL_MUENZE}<div>${S.tal < 1 ? "Du hast gerade keine Talente." : "Diese Station ist schon voll."}</div>`); return; }
  const k = String(st.k + 1), mit = Math.round(v * (1 + BETH_ZUSCHUSS));
  try { talBuchen(); } catch (e) {} S.tal -= v; if (S.tl) { S.tl.p = (S.tl.p | 0) + v; S.tl.l = S.tal | 0; }
  S.beth = Object.assign({}, S.beth, { [k]: ((S.beth || {})[k] | 0) + v }); save(); renderHud();
  SFX.coin(); if (el) { const [x, y] = centerOf(el); burst(x, y, 40, { up: 5 }); }
  bethSenden(); checkBadges();
  const voll = bethStand().k > st.k;
  VIEWS.beth();
  if (voll) setTimeout(bethFeiern, 500);
  else toast(`${svg("stern")}<div><b>Danke für deine Gabe!</b><div class="small muted">${v} Talente + Gemeinde = ${mit} für „${esc(BETH[st.k].kurz)}“</div></div>`);
}
/* Tägliche Wegzehrung: kostenlos, zählt für den Weg (Doppelbuchung am selben Tag nicht möglich) */
function bethTagesgabe(el) {
  const st = bethStand(); if (!st.offen || bethHeuteGegeben()) return;
  const v = Math.min(BETH_TAGESGABE, bethRest(st)); if (v < 1) return;
  const k = String(st.k + 1);
  S.bethG = Object.assign({}, S.bethG, { [k]: ((S.bethG || {})[k] | 0) + v }); S.bethTage = [...(S.bethTage || []), adventTag()].slice(-40); save();
  SFX.coin(); if (el) { const [x, y] = centerOf(el); burst(x, y, 30, { up: 4 }); }
  bethSenden(); checkBadges();
  const voll = bethStand().k > st.k;
  VIEWS.beth();
  if (voll) setTimeout(bethFeiern, 500);
  else toast(`${svg("stern")}<div><b>Wegzehrung gegeben!</b><div class="small muted">+${v} für „${esc(BETH[st.k].kurz)}“ · ${bethSerie()} ${bethSerie() === 1 ? "Tag" : "Tage"} in Folge</div></div>`);
}
/* Feiern: jede fertige Station einmal für alle, die dafür gegeben haben; die Krippe an Heiligabend für alle */
function bethFeiern() {
  if (document.querySelector(".modal") || !adventSichtbar()) return;
  const st = bethStand();
  if (st.krippe && !S.bethAngekommen) {
    S.bethAngekommen = true; save(); checkBadges();
    [0, 900, 2000].forEach(t => setTimeout(() => { SFX.level(); rain(150); }, t));
    const dabei = Object.values(S.beth || {}).some(v => v > 0) || Object.values(S.bethG || {}).some(v => v > 0);
    modal(`<div class="label">Heiligabend</div><div class="sh-feier">${bethBild(st)}</div><h2 style="margin:0">${esc(BETH_FINALE.n)}</h2><p class="muted small" style="margin:0">${esc(BETH_FINALE.k)} (${esc(BETH_FINALE.v)})</p>
      ${dabei ? `<div class="vle-werte"><div><b>${avatarHtml({ avatar: S.avatar, frame: "stern", name: S.lbName }, 44)}</b><span>Rahmen „Stern von Bethlehem“</span></div><div><b>${svg("stern")}</b><span>Titel „Bethlehem-Pilger“</span></div></div>` : `<p class="small muted" style="margin:0">Frohe Weihnachten! Gott ist Mensch geworden – er wohnt unter uns.</p>`}
      <button class="btn primary" data-close>Frohe Weihnachten!</button>`);
    return;
  }
  for (let i = 0; i < st.fertig; i++) {
    const k = String(i + 1);
    if (((S.beth || {})[k] > 0 || (S.bethG || {})[k] > 0) && !(S.bethGefeiert || []).includes(k)) {
      S.bethGefeiert = [...(S.bethGefeiert || []), k]; save(); SFX.badge(); rain(90);
      modal(`<div class="label">Station ${k} von 8 geschafft</div><div class="sh-feier">${bethBild(Object.assign({}, st, { fertig: Math.max(st.fertig, i + 1) }))}</div><h2 style="margin:0">${esc(BETH[i].n)}</h2>
        <p class="muted small" style="margin:0">Maria und Josef gehen weiter. Gemeinsam gebracht von ${stiftNamen(st.spender[i])}.</p><button class="btn primary" data-close="ok">Weiter</button>`, () => setTimeout(bethFeiern, 300));
      return;
    }
  }
}
/* Weg als glatte Kurve durch die Punkte */
function bethGlatt(p) {
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}
const BETH_PUNKTE = [[26, 152], [62, 130], [98, 148], [134, 124], [168, 142], [204, 114], [238, 126], [262, 96], [286, 78]];
function bethBild(st) {
  const sterne = Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 47) % 320}" cy="${(i * 29) % 70 + 6}" r="${i % 4 ? .8 : 1.4}" fill="#fff" opacity="${i % 3 ? .55 : .9}"/>`).join("");
  const frac = Math.min(1, st.fertig / 8), glut = .35 + .65 * frac, weg = bethGlatt(BETH_PUNKTE);
  const stern = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><circle r="26" fill="url(#bhGlut)" opacity="${glut}"/><path d="M0 -12l3.4 7.4 8.1 1-6 5.5 1.6 8L0 5.4l-7.1 4.5 1.6-8-6-5.5 8.1-1z" fill="#fff3c4" stroke="#f2c14e" stroke-width=".8" stroke-linejoin="round"/></g>`;
  const person = (x, y) => `<g transform="translate(${x} ${y})" class="bh-wanderer"><ellipse cy="2" rx="12" ry="2.6" fill="#000" opacity=".35"/>
      <path d="M-9 0L-6.5 -13h5L-2 0z" fill="#5c8fd6" stroke="#1b2a55" stroke-width=".6"/><circle cx="-4" cy="-16" r="3.3" fill="#f1d3b0" stroke="#1b2a55" stroke-width=".5"/>
      <path d="M2 0L4 -14h5l2 14z" fill="#8a5a30" stroke="#1b2a55" stroke-width=".6"/><circle cx="6.5" cy="-17" r="3.3" fill="#f1d3b0" stroke="#1b2a55" stroke-width=".5"/><path d="M13 0V-20" stroke="#6b4318" stroke-width="1.3"/></g>`;
  const haeuser = `<g transform="translate(270 60)"><path d="M0 28h44V14L30 6 18 12 8 6 0 12z" fill="#4a3d70" stroke="#2a2250" stroke-width=".8"/>
      ${[[7, 16], [22, 18], [34, 16]].map(([x, y]) => `<rect x="${x}" y="${y}" width="5" height="7" rx="1" fill="#ffd36a" opacity="${(.25 + .75 * frac).toFixed(2)}"/>`).join("")}</g>`;
  let mitte;
  if (st.krippe) {
    mitte = `<path d="M160 44L124 150H196Z" fill="url(#bhGlut)" opacity=".4"/>
      <path d="M118 112L160 80l42 32z" fill="#7a4a24" stroke="#3a210c" stroke-width="1.4" stroke-linejoin="round"/><path d="M122 112v38M198 112v38" stroke="#a56a32" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="160" cy="150" rx="48" ry="7" fill="#b8924a" opacity=".85"/><path d="M142 140h36l-5 12h-26z" fill="#c98a4b" stroke="#5a3410" stroke-width="1.2" stroke-linejoin="round"/>
      <circle cx="160" cy="132" r="22" fill="url(#bhGlut)"/><ellipse cx="160" cy="138" rx="9" ry="5.5" fill="#fff" stroke="#e8dcc0" stroke-width=".8"/><circle cx="160" cy="132" r="4.4" fill="#f6dcc0" stroke="#d9b896" stroke-width=".6"/>
      <g transform="translate(96 150)"><path d="M-9 0L-6 -17h12l3 17z" fill="#5c8fd6" stroke="#1b2a55" stroke-width=".7"/><circle cy="-21" r="4" fill="#f1d3b0" stroke="#1b2a55" stroke-width=".5"/></g>
      <g transform="translate(224 150)"><path d="M-9 0L-6 -17h12l3 17z" fill="#8a5a30" stroke="#1b2a55" stroke-width=".7"/><circle cy="-21" r="4" fill="#f1d3b0" stroke="#1b2a55" stroke-width=".5"/></g>${stern(160, 42, 1.5)}`;
  } else {
    const pos = BETH_PUNKTE[Math.min(st.fertig, 8)];
    mitte = `<path d="${weg}" fill="none" stroke="#4a3a2a" stroke-width="9" stroke-linecap="round"/><path d="${weg}" fill="none" stroke="#9a7a4c" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="1 6.5"/>
      <path d="${weg}" pathLength="100" fill="none" stroke="#ffe39a" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="${(frac * 100).toFixed(1)} 100" opacity=".95"/>
      ${BETH_PUNKTE.slice(0, 8).map(([x, y], i) => { const z = i < st.fertig ? "fertig" : i === st.k && st.offen ? "jetzt" : "spaeter";
        return `<g class="bh-pkt ${z}"><circle cx="${x}" cy="${y}" r="${z === "jetzt" ? 6.5 : 5}" fill="${z === "fertig" ? "#f2c14e" : z === "jetzt" ? "#5fe0b0" : "#2a3166"}" stroke="${z === "spaeter" ? "#6b76b8" : "#fff6c8"}" stroke-width="1.4"/><text x="${x}" y="${y + 2.6}" text-anchor="middle" font-size="7" font-weight="900" fill="${z === "spaeter" ? "#9aa5e0" : "#2a1d00"}">${i + 1}</text></g>`; }).join("")}
      ${st.alle ? "" : person(pos[0] + 6, pos[1] - 6)}${stern(300, 26, 1)}`;
  }
  return `<svg class="sh-bild" viewBox="0 0 320 190" role="img" aria-label="Der Weg nach Bethlehem: ${st.fertig} von 8 Stationen geschafft">
  <defs><linearGradient id="bhNacht" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1636"/><stop offset=".7" stop-color="#2a2552"/><stop offset="1" stop-color="#5a3a52"/></linearGradient>
    <radialGradient id="bhGlut"><stop offset="0" stop-color="#fffbe8"/><stop offset=".45" stop-color="#ffe39a" stop-opacity=".6"/><stop offset="1" stop-color="#ffe39a" stop-opacity="0"/></radialGradient></defs>
  <rect width="320" height="190" fill="url(#bhNacht)"/>${sterne}
  <path d="M0 126Q60 98 130 116T320 88V190H0Z" fill="#2b2447"/><path d="M0 160Q90 134 190 150T320 130V190H0Z" fill="#3a2f55"/>
  ${st.krippe ? "" : haeuser}${mitte}</svg>`;
}
function bethWeg(st) {
  return `<ol class="sh-weg" aria-label="Stationen">${BETH.map((a, i) => { const z = i < st.fertig ? "fertig" : i === st.k && st.offen ? "jetzt" : i === st.k ? "naechst" : "spaeter";
    return `<li class="${z}" title="${i + 1}. ${esc(a.n)}"><span>${z === "fertig" ? svg("check") : i + 1}</span><small>${esc(a.kurz)}</small></li>`; }).join("")}</ol>`;
}
VIEWS_BETH = () => {
  const st = bethStand(), a = BETH[Math.min(st.k, 7)], ist = st.alle ? 0 : st.eff[st.k];
  const pz = st.alle ? 100 : Math.min(100, Math.round(ist / a.ziel * 100)), online = window.LB && LB.ok && LB.bethSetzen && S.pid && !S.offlineOnly;
  const zuschuss = Math.round(BETH_ZUSCHUSS * 100);
  let karte;
  if (st.krippe) karte = `<div class="sh-karte fertig"><div class="sh-z1"><b>${esc(BETH_FINALE.n)}</b><small>8 von 8</small></div><p class="sh-vers">${esc(BETH_FINALE.k)} (${esc(BETH_FINALE.v)})</p>
      <p class="sh-geber">Gebracht von ${stiftNamen(st.spender.flat()) || "der ganzen Gemeinde"}</p></div>`;
  else if (st.alle) karte = `<div class="sh-karte genug"><div class="sh-z1"><b>Alles ist bereit!</b><small>8 von 8</small></div><p class="sh-vers">Der Stall steht, der Stern leuchtet. Am Heiligabend (${esc(adventDatum(dayNum(ADV_KRIPPE)))}) ist das Kind da – schau dann wieder vorbei!</p>
      <p class="sh-geber">Zuletzt gaben ${stiftNamen(st.spender[7])}</p></div>`;
  else if (!st.offen) karte = `<div class="sh-karte genug"><div class="sh-z1"><b>Station geschafft!</b><small>${st.k} von 8</small></div><p class="sh-vers">Maria und Josef ruhen sich aus. Weiter geht es am ${esc(adventDatum(st.ab + 1))}: „${esc(a.n)}“.</p>
      <p class="sh-geber">Zuletzt gaben ${stiftNamen(st.spender[st.k - 1])}</p></div>`;
  else {
    const heute = bethHeuteGegeben(), serie = bethSerie();
    karte = `<div class="sh-karte"><div class="sh-z1"><b>${st.k + 1} · ${esc(a.n)}</b><small>bis ${esc(adventKurz(st.frist - 1))}</small></div><p class="sh-vers">${esc(a.k)} (${esc(a.v)})</p>
      <div class="sh-balken"><i style="width:${pz}%"></i></div><div class="sh-zahlen"><span>${pkt(ist)} von ${pkt(a.ziel)} Talenten</span><span>${pz} %</span></div>
      <p class="small muted" style="margin:0">Die Gemeinde legt zu jeder Gabe <b>${zuschuss} %</b> dazu. Spätestens am ${esc(adventDatum(st.frist))} füllt sie den Rest auf und die Reise geht weiter.</p>
      ${online ? `<div class="sh-spenden">${[10, 50, 100].map(v => `<button data-sp="${v}" ${S.tal < 1 ? "disabled" : ""}>+${v}</button>`).join("")}<button class="haupt" data-sp="frei">Spenden</button></div>
        <button class="btn ${heute ? "ghost" : "primary"} breit adv-gabe" id="bethGabe" ${heute ? "disabled" : ""}>${svg("stern")} ${heute ? `Heute gegeben · ${serie} ${serie === 1 ? "Tag" : "Tage"} in Folge` : `Tägliche Wegzehrung · +${BETH_TAGESGABE} gratis`}</button>`
      : `<p class="small muted" style="margin:0">Spenden geht nur mit Internet und Eintrag in der Rangliste.</p>`}
      <p class="sh-geber">${st.spender[st.k].length ? `Bisher gaben ${stiftNamen(st.spender[st.k])}` : "Sei der Erste, der für diese Station gibt!"}</p></div>`;
  }
  screen.innerHTML = `${backBtn("advent", "Advent")}${bereichKopf("advent", { ic: "stern", t: "Bethlehem", sub: "Die Gemeinde geht gemeinsam", ring: [st.fertig, "von 8"] })}
    <div class="sh-buehne">${bethBild(st)}</div>${bethWeg(st)}${karte}
    <p class="small muted sh-fuss">Wer mitgeholfen hat, wird mit Namen genannt, Beträge bleiben verborgen (Matthäus 6,3). Du hast ${pkt(S.tal)} Talente.</p>`;
  wireGo();
  screen.querySelectorAll("[data-sp]").forEach(b => b.onclick = () => { const v = b.dataset.sp; if (v === "frei") { bethSpendeWahl(); return; } bethSpenden(+v, b); });
  const g = $("bethGabe"); if (g) g.onclick = () => bethTagesgabe(g);
  if ((!bethDaten || Date.now() - bethZeit > 60e3) && Date.now() - bethVersuch > 60e3) bethLaden(true).then(() => { if (current === "beth" && !document.querySelector(".modal")) VIEWS_BETH(); bethFeiern(); });
  else bethFeiern();
};
function bethSpendeWahl() {
  const st = bethStand(), rest = bethRest(st), max = Math.min(S.tal | 0, rest);
  const m = modal(`<div class="label">Gabe für den Weg</div><h2 style="margin:0">${esc(BETH[st.k].n)}</h2><p class="muted small" style="margin:0">Noch ${pkt(rest)} Talente bis zum Ziel · du hast ${pkt(S.tal)}.<br>Die Gemeinde legt ${Math.round(BETH_ZUSCHUSS * 100)} % dazu.</p>
    <input class="field" id="spBetrag" type="number" inputmode="numeric" min="1" max="${max}" value="${Math.max(1, Math.min(max, 25))}" aria-label="Talente spenden">
    <button class="btn primary" id="spOk" ${max < 1 ? "disabled" : ""}>Spenden</button><button class="btn ghost" data-close>Abbrechen</button>`);
  m.querySelector("#spOk").onclick = () => { const v = Math.floor(+m.querySelector("#spBetrag").value || 0); m.remove(); bethSpenden(v); };
}

/* =====================================================================
   Adventskalender
   ===================================================================== */
const kalOptionen = d => KALENDER[d - 1].a.slice().sort((x, y) => hash("kal" + d + x) - hash("kal" + d + y));
function kalOeffnen(d) {
  if (d > kalHeuteNr()) { SFX.wrong(); toast(`${svg("tuer")}<div><b>Noch zu!</b><div class="small muted">Türchen ${d} geht am ${esc(adventDatum(dayNum(KAL_START) + d - 1))} auf.</div></div>`); return; }
  const e = KALENDER[d - 1], frist = dayNum(KAL_START) + d - 1, heute = adventTag() === frist;
  S.kal = Object.assign({}, S.kal);
  let neu = false;
  if (!S.kal[d]) { neu = true; S.kal[d] = { o: adventTag() }; save(); }
  const tal = neu ? (heute ? KAL_TAL : KAL_TAL_SPAET) : 0;
  if (tal) { addTal(tal); }
  if (neu) { SFX.badge(); if (d === 24) { rain(160); setTimeout(() => SFX.level(), 500); } checkBadges(); }
  const beantwortet = () => S.kal[d].r !== undefined;
  const m = modal(`<div class="label">Türchen ${d}${d === 24 ? " · Heiligabend" : ""}</div><div id="kalInhalt"></div>`);
  const innen = m.querySelector("#kalInhalt");
  const schritt1 = () => {
    innen.innerHTML = `<h2 style="margin:0 0 6px">${esc(e.t)}</h2><p class="small muted" style="margin:0 0 8px">${svg("book")} ${esc(e.v)}</p><p style="margin:0 0 10px">${esc(e.s)}</p>
      ${tal ? `<p class="small" style="margin:0 0 10px">${TAL_MUENZE} <b>+${tal} Talente</b>${heute ? "" : " (nachgeholt)"}</p>` : ""}
      ${beantwortet() ? `<p class="small muted" style="margin:0 0 10px">${S.kal[d].r ? `${svg("check", "var(--good)")} Frage richtig beantwortet` : "Frage beantwortet"} – ${esc(e.e)}</p><button class="btn primary" data-close>Schließen</button>`
        : `<button class="btn primary" id="kalFrage">Zur Frage (+${KAL_TAL_FRAGE} Talente)</button><button class="btn ghost" data-close>Später</button>`}`;
    innen.querySelectorAll("[data-close]").forEach(b => b.onclick = () => { m.remove(); SFX.tap(); if (current === "kal") VIEWS.kal(); });
    const f = innen.querySelector("#kalFrage"); if (f) f.onclick = () => { SFX.tap(); schritt2(); };
  };
  const schritt2 = () => {
    innen.innerHTML = `<h2 style="margin:0 0 8px;font-size:1.1rem">${esc(e.q)}</h2><div class="stack">${kalOptionen(d).map((o, i) => `<button class="btn kal-opt" data-o="${i}">${esc(o)}</button>`).join("")}</div>`;
    innen.querySelectorAll(".kal-opt").forEach(b => b.onclick = () => {
      const wahl = b.textContent, ok = wahl === e.a[0];
      innen.querySelectorAll(".kal-opt").forEach(x => { x.disabled = true; if (x.textContent === e.a[0]) x.classList.add("richtig"); else if (x === b) x.classList.add("falsch"); });
      S.kal[d].r = ok ? 1 : 0; save();
      if (ok) { SFX.right && SFX.right(); addTal(KAL_TAL_FRAGE); } else SFX.wrong();
      setTimeout(() => { innen.insertAdjacentHTML("beforeend", `<p style="margin:10px 0 6px"><b>${ok ? `Richtig! +${KAL_TAL_FRAGE} Talente` : "Leider nicht."}</b> ${esc(e.e)}</p><button class="btn primary" id="kalOk">Weiter</button>`);
        $("kalOk").onclick = () => { m.remove(); SFX.tap(); if (current === "kal") VIEWS.kal(); }; }, 500);
    });
  };
  schritt1();
}
VIEWS_KAL = () => {
  const nr = kalHeuteNr(), offen = Object.keys(S.kal || {}).length, schon = adventTag() >= dayNum(KAL_START);
  const tuer = Array.from({ length: 24 }, (_, i) => { const d = i + 1, auf = !!(S.kal || {})[d], da = d <= nr;
    const z = auf ? "auf" : d === nr ? "heute" : da ? "verpasst" : "zu";
    return `<button class="adv-tuer ${z} ${d === 24 ? "gross" : ""}" data-t="${d}" aria-label="Türchen ${d}${auf ? ", geöffnet" : da ? ", wartet" : ", noch zu"}"><b>${d}</b>${auf ? svg("check") : d === 24 ? svg("krippe") : da ? svg("tuer") : svg("lock")}</button>`; }).join("");
  screen.innerHTML = `${backBtn("advent", "Advent")}${bereichKopf("advent", { ic: "tuer", t: "Kalender", sub: schon ? "Jeden Tag ein Türchen" : `Es geht los am ${adventDatum(dayNum(KAL_START))}`, ring: [offen, "von 24"],
    tafel: [[nr, "heute dran"], [Object.values(S.kal || {}).filter(x => x.r === 1).length, "Fragen richtig"], [`${KAL_MEISTER}`, "für Rahmen"]] })}
    <div class="adv-tuerfeld">${tuer}</div>
    <p class="small muted sh-fuss">Jedes Türchen bringt ${KAL_TAL} Talente (am selben Tag geöffnet, später ${KAL_TAL_SPAET}) und eine Frage mit ${KAL_TAL_FRAGE} Talenten. Verpasste Türchen kannst du jederzeit nachholen. Mit ${KAL_MEISTER} Türchen gibt es den Rahmen „Adventskranz“ und den Titel „Adventsbote“.</p>`;
  wireGo();
  screen.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { SFX.tap(); kalOeffnen(+b.dataset.t); });
};

/* =====================================================================
   Advents-Biblionär (eine Runde je Adventswoche) und Duell-Aktion
   ===================================================================== */
const advBibGespielt = w => (S.advBib || {})[w] !== undefined;
function bibAdventStarten() {
  const w = advRunde();
  if (!w) { toast(`${svg("biblionaer")}<div><b>Der Advent ist vorbei</b><div class="small muted">Frohe Weihnachten!</div></div>`); return; }
  if (advBibGespielt(w)) { toast(`${svg("biblionaer")}<div><b>Diese Woche schon gespielt</b><div class="small muted">Nächsten Sonntag gibt es neue Fragen.</div></div>`); return; }
  modal(`<div class="label">Advents-Biblionär</div><h2 style="margin:0">${w}. Advent</h2>
    <p class="muted">15 Fragen rund um Advent und Weihnachten – für alle in der Gemeinde dieselben. Du hast <b>einen Versuch pro Adventswoche</b>; wer abbricht, bekommt 0 Punkte. Zusätzlich gibt es ${ADV_BIB_TAL} Talente.</p>
    <button class="btn primary" data-close="los">${svg("biblionaer")} Los geht's</button><button class="btn ghost" data-close>Später</button>`, r => { if (r === "los") advBibLos(w); });
}
function advBibLos(w) {
  if (advBibGespielt(w)) return;
  S.advBib = Object.assign({}, S.advBib, { [w]: 0 }); save();
  go("biblionaer");
  const G = { modus: "advent", adv: w, fragen: bibFragen(hash("advent" + w), "", ADV_BIB_FRAGEN[w]) };
  countdown(() => bibStart(G));
}
/* Duell-Aktion: pro Adventswoche 3 Duelle gegen mindestens 2 verschiedene Mitspieler (ohne die eigenen Profile am selben Gerät) */
function adventDuell(ids) {
  const w = advRunde(); if (!w || !adventSichtbar()) return;
  const gegner = (ids || []).filter(id => id && !eigenePid(id)); if (!gegner.length) return;
  const alt = (S.advDu || {})[w] || { c: 0, g: [] }, neu = { c: (alt.c | 0) + gegner.length, g: [...new Set([...(alt.g || []), ...gegner])].slice(0, 20) };
  S.advDu = Object.assign({}, S.advDu, { [w]: neu });
  if (neu.c >= ADV_DU_ZIEL && neu.g.length >= ADV_DU_GEGNER && !(S.advDuOk || []).includes(w)) {
    S.advDuOk = [...(S.advDuOk || []), w]; S.tal += ADV_DU_TAL; renderHud();
    setTimeout(() => { SFX.badge(); toast(`${svg("kerze")}<div><b>Duell-Aktion geschafft!</b><div class="small muted">${w}. Advent · +${ADV_DU_TAL} Talente</div></div>`); }, 1500);
    checkBadges();
  }
  save();
}
const advDuStand = w => { const a = (S.advDu || {})[w] || { c: 0, g: [] }; return { c: Math.min(a.c | 0, ADV_DU_ZIEL), g: (a.g || []).length, ok: (S.advDuOk || []).includes(w) }; };

/* ---------- Zusammenführen mit einem anderen Gerät: nie Fortschritt verlieren ---------- */
function adventMischen(r) {
  ["beth", "bethG", "advBib"].forEach(k => { const a = S[k] = Object.assign({}, S[k] || {}); Object.entries(r[k] || {}).forEach(([i, v]) => { a[i] = Math.max(a[i] | 0, v | 0); }); });
  const uni = (a, b) => [...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])])];
  S.bethTage = uni(S.bethTage, r.bethTage).sort((x, y) => x - y).slice(-40); S.bethGefeiert = uni(S.bethGefeiert, r.bethGefeiert); S.advDuOk = uni(S.advDuOk, r.advDuOk);
  S.bethAngekommen = !!(S.bethAngekommen || r.bethAngekommen);
  const kal = Object.assign({}, S.kal || {}); Object.entries(r.kal || {}).forEach(([d, v]) => { const a = kal[d]; if (!a) { kal[d] = v; return; }
    kal[d] = { o: Math.min(a.o || v.o || 0, v.o || a.o || 0), r: a.r === undefined ? v.r : v.r === undefined ? a.r : Math.max(a.r | 0, v.r | 0) }; if (kal[d].r === undefined) delete kal[d].r; });
  S.kal = kal;
  const du = Object.assign({}, S.advDu || {}); Object.entries(r.advDu || {}).forEach(([w, v]) => { const a = du[w] || { c: 0, g: [] }; du[w] = { c: Math.max(a.c | 0, v.c | 0), g: uni(a.g, v.g).slice(0, 20) }; }); S.advDu = du;
}

/* =====================================================================
   Adventskranz und Übersicht
   ===================================================================== */
function adventKranz(n) {
  const xs = [76, 134, 190, 248], farbe = ["#8a5cd6", "#8a5cd6", "#e58fb8", "#8a5cd6"];
  const kerzen = xs.map((x, i) => `<g class="adv-kerze ${i < n ? "an" : ""}"><rect x="${x - 8}" y="46" width="16" height="46" rx="3.5" fill="${farbe[i]}" stroke="#1b2a55" stroke-width="1.2"/><path d="M${x - 8} 56h16" stroke="#fff" stroke-opacity=".25"/>
    <path d="M${x} 44v-5" stroke="#1b2a55" stroke-width="1.4" stroke-linecap="round"/>${i < n ? `<circle cx="${x}" cy="30" r="15" fill="url(#akGlut)"/><path d="M${x} 20c6 7 7 12 4 15-1.4 1.6-6.6 1.6-8 0-3-3-2-8 4-15z" fill="url(#wrF)" stroke="#7a2a08" stroke-width=".8"/><path d="M${x} 27c2 2.6 2.4 4.4 1.2 5.6-.8.7-2.4.7-2.4 0-1.2-1.2-.8-3 1.2-5.6z" fill="#fff6c8"/>` : ""}</g>`).join("");
  const nadeln = Array.from({ length: 26 }, (_, i) => { const x = 40 + i * 9.2, y = 98 + Math.sin(i * .9) * 2.4; return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="9" ry="4.2" fill="${i % 2 ? "#2f6b3f" : "#3f8a52"}" stroke="#1b3d24" stroke-width=".6" transform="rotate(${(i % 3 - 1) * 14} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }).join("");
  return `<svg class="adv-kranz" viewBox="0 0 320 120" role="img" aria-label="Adventskranz: ${n} von 4 Kerzen brennen"><defs><radialGradient id="akGlut"><stop offset="0" stop-color="#fff3c4" stop-opacity=".85"/><stop offset="1" stop-color="#ffb54a" stop-opacity="0"/></radialGradient></defs>
    ${kerzen}${nadeln}<g fill="#d93a4a" stroke="#6a1420" stroke-width=".6"><circle cx="70" cy="98" r="3"/><circle cx="160" cy="104" r="3"/><circle cx="252" cy="98" r="3"/><circle cx="112" cy="102" r="2.4"/><circle cx="210" cy="102" r="2.4"/></g>
    <path d="M150 94l10 0 4 10-8-3-8 3z" fill="#d93a4a" stroke="#6a1420" stroke-width=".6" transform="translate(-2 0)"/></svg>`;
}
VIEWS_ADVENT = () => {
  const w = adventWoche(), n = Math.min(4, w), st = bethStand(), nr = kalHeuteNr(), kalOffen = Object.keys(S.kal || {}).length, kalHeute = nr > 0 && (S.kal || {})[nr];
  const r = advRunde(), bibGesp = r ? advBibGespielt(r) : true, du = r ? advDuStand(r) : { c: 0, g: 0, ok: true };
  const karte = (ic, titel, unter, info, attr, punkt) => `<button class="bereich klein adv-karte" ${attr}><span class="b-ic">${svg(ic)}</span><span class="b-tx"><b>${titel}</b><span>${unter}</span></span><span class="b-info">${punkt ? `<i class="adv-punkt"></i>` : ""}${info}</span></button>`;
  const wegUnter = st.krippe ? "Das Kind ist da!" : st.alle ? "Alles bereit – bis Heiligabend" : st.offen ? `Station ${st.k + 1}: ${esc(BETH[st.k].kurz)}` : "Maria und Josef rasten";
  const wegPunkt = st.offen && !st.alle && (!bethHeuteGegeben() || S.tal > 0 && false);
  const kalUnter = !nr ? `Ab ${esc(adventDatum(dayNum(KAL_START)))}` : kalHeute ? "Heute schon geöffnet" : `Türchen ${nr} wartet`;
  screen.innerHTML = `${backBtn("home", "Start")}${bereichKopf("advent", { ic: "kerze", t: "Advent", sub: w === 5 ? "Frohe Weihnachten!" : `${n}. Advent – Gott kommt zu uns`, ring: [n, n === 1 ? "Kerze" : "Kerzen"] })}
    <div class="adv-kranzbox">${adventKranz(n)}</div>
    ${karte("stern", "Weg nach Bethlehem", wegUnter, `${st.fertig}/8`, `data-go="beth"`, wegPunkt)}
    ${karte("tuer", "Adventskalender", kalUnter, `${kalOffen}/24`, nr ? `data-go="kal"` : `data-go="kal"`, nr > 0 && !kalHeute)}
    ${karte("biblionaer", "Advents-Biblionär", !r ? "Die Runden sind vorbei" : bibGesp ? `Diese Woche: ${pkt((S.advBib || {})[r] | 0)} Punkte` : `${r}. Advent · 15 Fragen, 1 Versuch`, r ? `${Object.keys(S.advBib || {}).length}/4` : "–", `id="advBib"`, r && !bibGesp)}
    ${karte("duell", "Duell-Aktion", !r ? "Vorbei" : du.ok ? "Diese Woche geschafft!" : `${ADV_DU_ZIEL} Duelle gegen ${ADV_DU_GEGNER} Mitspieler`, r ? `${du.ok ? ADV_DU_ZIEL : du.c}/${ADV_DU_ZIEL}` : "–", `data-go="duelle"`, r && !du.ok)}
    <p class="small muted sh-fuss">Jede Adventswoche beginnt am Sonntag. Biblionär-Runde und Duell-Aktion gibt es einmal pro Woche; die Duell-Aktion bringt ${ADV_DU_TAL} Talente.</p>`;
  wireGo();
  const b = $("advBib"); if (b) b.onclick = () => { SFX.tap(); bibAdventStarten(); };
  bethLaden().then(() => { if (current === "advent" && !document.querySelector(".modal")) { const alt = st.fertig; if (bethStand().fertig !== alt) VIEWS_ADVENT(); } });
};

/* ---------- Kleine Karte auf Start und Gemeinde ---------- */
function adventMiniHtml(kompakt) {
  if (!adventSichtbar()) return "";
  const st = bethStand(), nr = kalHeuteNr(), r = advRunde();
  const offen = [];
  if (st.offen && !st.alle && !bethHeuteGegeben()) offen.push("Wegzehrung");
  if (nr > 0 && !(S.kal || {})[nr]) offen.push(`Türchen ${nr}`);
  if (r && !advBibGespielt(r)) offen.push("Biblionär-Runde");
  if (r && !advDuStand(r).ok) offen.push("Duell-Aktion");
  const zeile = st.krippe ? "Frohe Weihnachten! Das Kind ist da" : offen.length ? `Wartet: ${offen.slice(0, 2).join(" · ")}` : `Weg nach Bethlehem ${st.fertig}/8`;
  const pz = st.alle ? 100 : Math.min(100, Math.round(st.eff[st.k] / BETH[st.k].ziel * 100));
  return `<button class="sh-mini adv-mini ${kompakt ? "kompakt" : ""}" data-go="advent" aria-label="Advent: ${esc(zeile)}">${svg("kerze")}<span class="sh-mini-tx"><b>Advent</b><small>${esc(zeile)}</small>${kompakt ? "" : `<i class="sh-balken klein"><i style="width:${pz}%"></i></i>`}</span>${offen.length ? `<i class="adv-punkt" aria-hidden="true"></i>` : ""}<span class="sh-pfeil">›</span></button>`;
}
/* Einmaliger Willkommens-Hinweis am Anfang des Advents */
function adventStartHinweis() {
  if (!adventSichtbar() || S.adventIntro || document.querySelector(".modal") || !S.lbName) return;
  S.adventIntro = true; save(); SFX.badge();
  modal(`<div class="label">1. Advent</div><h2 style="margin:0">Der Advent beginnt!</h2>
    <p class="muted" style="margin:0">Bis Weihnachten gibt es etwas Besonderes:</p>
    <ul class="adv-liste"><li>${svg("stern")}<span><b>Weg nach Bethlehem</b> – die Gemeinde bringt gemeinsam Maria und Josef zur Krippe. Die Gemeinde legt zu jeder Gabe ${Math.round(BETH_ZUSCHUSS * 100)} % dazu.</span></li>
      <li>${svg("tuer")}<span><b>Adventskalender</b> – ab ${esc(adventDatum(dayNum(KAL_START)))} jeden Tag ein Türchen.</span></li>
      <li>${svg("biblionaer")}<span><b>Advents-Biblionär</b> – jede Woche 15 neue Fragen.</span></li>
      <li>${svg("kerze")}<span><b>Duell-Aktion</b> – ${ADV_DU_ZIEL} Duelle pro Woche, ${ADV_DU_TAL} Talente.</span></li></ul>
    <button class="btn primary" data-close="los">${svg("kerze")} Zum Advent</button><button class="btn ghost" data-close>Später</button>`, r => { if (r === "los") go("advent"); });
}
