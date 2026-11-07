/* =====================================================================
   Advent 2026 – Logik und Ansichten (Version 7.4)
   Die Krippe wächst (Gemeinschaftsprojekt, gespendet wird mit Adventslichtern), Adventskalender (ab 1. Dezember),
   Advents-Biblionär (eine Runde je Adventswoche) und Weihnachts-Duelle. Einstellungen und Inhalte: advent-daten.js.
   Wird vor spiel.js geladen; alles, was aus spiel.js gebraucht wird (S, save, go, modal …), wird erst beim Aufruf benutzt.
   Technische Namen mit „beth“ (Sammlung „bethlehem“) bleiben aus Kompatibilität erhalten und meinen die Krippe.
   ===================================================================== */

/* ---------- Entwickler-Testmodus (nur vor dem 1. Advent): eigener Probestand, keine Belohnungen, Datum frei wählbar ---------- */
const ADV_LEER = () => ({ beth: {}, bethG: {}, bethTage: [], bethGefeiert: [], bethAngekommen: false, kal: {}, advBib: {} });
const advTestOn = () => { try { return typeof entwickler !== "undefined" && !!entwickler && !!(S.advTest && S.advTest.on) && dayNum(today()) < dayNum(ADV_START); } catch (e) { return false; } };
function A() { if (!advTestOn()) return S; if (!S.advT) S.advT = ADV_LEER(); return S.advT; }
function advTestSchalten(an) { S.advTest = an ? { on: true, d: S.advTest && S.advTest.d || ADV_START } : { on: false, d: ADV_START }; if (!an) S.advT = null; save(); }
function advTestTag(delta) { const n = Math.max(dayNum(ADV_START) - 2, Math.min(dayNum(ADV_SICHT_BIS), dayNum(S.advTest.d) + delta)); S.advTest.d = dstr(datumVon(n)); save(); }
function advTestLeiste() {
  if (!advTestOn()) return "";
  return `<div class="adv-test" role="note"><b>Testmodus</b> · ${esc(adventKurz(adventTag()))} · keine Belohnungen, nichts wird gesendet<div class="adv-test-knoepfe"><button class="btn ghost mini" data-at="-1">− Tag</button><button class="btn ghost mini" data-at="1">+ Tag</button><button class="btn ghost mini" data-at="reset">Neu starten</button><button class="btn ghost mini" data-at="aus">Beenden</button></div></div>`;
}
function advTestWire(neu) {
  screen.querySelectorAll("[data-at]").forEach(b => b.onclick = () => { SFX.tap(); const v = b.dataset.at;
    if (v === "aus") { advTestSchalten(false); go("home"); return; }
    if (v === "reset") { S.advT = ADV_LEER(); save(); } else advTestTag(+v);
    neu(); });
}

/* ---------- Datum (auf localhost zusätzlich: ?advent=2026-12-05) ---------- */
function adventHeute() {
  if (advTestOn()) return S.advTest.d || ADV_START;
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
/* Weihnachts-Duelle: in der ganzen Adventszeit (nach dem echten Datum, für den Entwickler auch im Testmodus) */
function weihnachtsDuellOk() { const t = adventTag(); return t >= dayNum(ADV_START) && t <= dayNum(ADV_SICHT_BIS); }

/* ---------- Adventslichter: die Währung der Adventszeit ----------
   Verdient wird bei allem, was XP bringt (1 Licht je 10 XP), dazu im Kalender. Gespendet wird nur mit Lichtern, nie mit Talenten.
   Verdient: S.advLv (steigt nur), ausgegeben: Summe der Spenden S.beth – so lässt sich der Stand zwischen Geräten gefahrlos zusammenführen. */
const advLichtZeit = () => { const t = adventTag(); return t >= dayNum(ADV_START) && t <= dayNum(ADV_KRIPPE); };
function adventLichterVerdienen(n, quelle) {
  if (advTestOn() || !advLichtZeit() || !(n > 0) || quelle === "abgleich" || quelle === "spende") return;
  S.advLr = (S.advLr | 0) + n; const g = Math.floor(S.advLr / ADV_LICHT_XP);
  if (g > 0) { S.advLr -= g * ADV_LICHT_XP; S.advLv = (S.advLv | 0) + g; }
}
function adventLichtGeben(n) { if (advTestOn() || n <= 0) return; S.advLv = (S.advLv | 0) + n; save(); }
const advAusgegeben = () => Object.values(S.beth || {}).reduce((a, v) => a + (v | 0), 0);
const advLichter = () => advTestOn() ? 1e9 : Math.max(0, (S.advLv | 0) - advAusgegeben());
const advLichtText = () => advTestOn() ? "∞" : pkt(advLichter());

/* ---------- Symbole, Abzeichen, Rahmen, Titel ---------- */
(function () {
  const W = inner => `<svg x="0" y="0" width="24" height="24" viewBox="0 0 64 64" overflow="visible" class="wr wr-lohn"><ellipse cx="32" cy="61" rx="17" ry="2.2" fill="#000" opacity=".3"/>${inner}</svg>`;
  ICONS.stern = W(`<path d="M32 4l8.2 17.6 19.3 2.3-14.3 13.2 3.8 19L32 46.6 15 56.1l3.8-19L4.5 23.9l19.3-2.3z" fill="url(#wrG)" stroke="#1b2a55" stroke-width="1.7" stroke-linejoin="round"/><path d="M24 22l8-11" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".8"/><path class="wr-spark" d="M54 8l1.5 4 4 1.5-4 1.5L54 19l-1.5-4-4-1.5 4-1.5z" fill="#fff"/>`);
  ICONS.kerze = W(`<rect x="22" y="26" width="20" height="32" rx="4" fill="#f6f1e6" stroke="#1b2a55" stroke-width="1.6"/><path d="M22 34h20" stroke="#b9b2a0" stroke-width="1.2"/><path d="M32 6c7 8 8 13 5 17-1.4 2-5.6 2-7 0-3-4-2-9 2-17z" fill="url(#wrF)" stroke="#1b2a55" stroke-width="1.4" stroke-linejoin="round"/><path d="M32 14c2.4 3 3 5 1.8 7-.6 1-2.8 1-3.6 0-1-2 0-4 1.8-7z" fill="#fff6c8"/><path d="M32 24v3" stroke="#1b2a55" stroke-width="1.6" stroke-linecap="round"/>`);
  ICONS.licht = W(`<circle cx="32" cy="34" r="22" fill="#ffe39a" opacity=".25"/><path d="M32 6c10 11 12 19 8 26-2.4 4-13.6 4-16 0-4-7-2-15 8-26z" fill="url(#wrF)" stroke="#1b2a55" stroke-width="1.6" stroke-linejoin="round"/><path d="M32 22c4 5 5 9 3 12-1.2 1.8-4.8 1.8-6 0-2-3-1-7 3-12z" fill="#fff6c8"/><ellipse cx="32" cy="46" rx="13" ry="5" fill="url(#wrG)" stroke="#1b2a55" stroke-width="1.5"/><path d="M19 46v8c0 3 6 5 13 5s13-2 13-5v-8" fill="#c98a4b" stroke="#1b2a55" stroke-width="1.5"/>`);
  ICONS.tuer = W(`<rect x="10" y="8" width="44" height="50" rx="5" fill="#8a2a3a" stroke="#1b2a55" stroke-width="1.6"/><rect x="16" y="14" width="32" height="38" rx="3" fill="#b03a4a" stroke="#1b2a55" stroke-width="1.2"/><path d="M32 14v38M16 33h32" stroke="#1b2a55" stroke-width="1.2" opacity=".6"/><circle cx="26" cy="33" r="2.2" fill="#f2c14e"/><circle cx="38" cy="33" r="2.2" fill="#f2c14e"/>`);
  ICONS.krippe = W(`<path d="M8 26L32 8l24 18" fill="#7a4a24" stroke="#1b2a55" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 26v30M52 26v30" stroke="#a56a32" stroke-width="4" stroke-linecap="round"/><path d="M18 46h28l-4 10H22z" fill="#c98a4b" stroke="#1b2a55" stroke-width="1.4" stroke-linejoin="round"/><ellipse cx="32" cy="43" rx="8" ry="4" fill="#fff6c8" stroke="#e0b04a" stroke-width="1"/>`);
  /* Abzeichen */
  const B = (id, name, d, ic, tal, ok) => BADGES.push({ id, kat: "gemeinschaft", name, d, ic, tal, ok: x => !advTestOn() && ok(x) });
  B("bethlehem", "Krippenbauer", "An der Krippe mitgebaut – bis das Kind in der Krippe lag (Lukas 2,12)", "krippe", 30,
    s => !!A().bethAngekommen && (Object.values(A().beth || {}).some(v => v > 0) || Object.values(A().bethG || {}).some(v => v > 0)));
  B("adventskalender", "Adventsbote", `${KAL_MEISTER} Türchen im Adventskalender geöffnet`, "tuer", 30, s => Object.keys(A().kal || {}).length >= KAL_MEISTER);
  B("advBib", "Advents-Biblionär", "In 3 Adventswochen die Biblionär-Runde gespielt", "biblionaer", 20, s => Object.keys(A().advBib || {}).length >= 3);
  /* Rahmen und Titel zum Freischalten */
  RAHMEN.push({ id: "stern", name: "Stern von Bethlehem", price: -1, need: "bethlehem", bezug: "Die Weisen sagten: Wir haben seinen Stern gesehen und sind gekommen, ihn anzubeten (Matthäus 2,2)." });
  RAHMEN.push({ id: "kranz", name: "Adventskranz", price: -1, need: "adventskalender", bezug: "Das Licht scheint in der Finsternis, und die Finsternis hat es nicht überwältigt (Johannes 1,5)." });
  TITEL.push({ id: "bethlehem", name: "Krippenbauer", price: -1, need: "bethlehem", bezug: "Die Hirten sagten: Lasst uns nach Bethlehem gehen und die Sache sehen, die geschehen ist (Lukas 2,15)." });
  TITEL.push({ id: "adventsbote", name: "Adventsbote", price: -1, need: "adventskalender", bezug: "Der Engel sagte: Ich verkündige euch große Freude, die dem ganzen Volk widerfahren wird (Lukas 2,10)." });
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
   Die Krippe wächst
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
/* Stand der Krippe. Die Gabe jedes Spielers zählt mit Gemeinde-Zuschuss. Eine Figur ist fertig, wenn ihr Ziel erreicht ist
   oder ihre Zeit abgelaufen ist (dann füllt die Gemeinde den Rest auf). Die nächste Figur öffnet höchstens einen Tag früher als geplant. */
function bethStand() {
  const sum = BETH.map(() => 0), spender = BETH.map(() => []), alle = new Set();
  const test = advTestOn(), zeilen = test ? [] : (bethDaten || []).filter(r => r.pid !== S.pid);
  if (S.pid || Object.keys(A().beth || {}).length || Object.keys(A().bethG || {}).length) {
    const eig = test ? { s: {}, g: {} } : (bethDaten || []).find(r => r.pid === S.pid) || { s: {}, g: {} }, s = {}, g = {};
    for (let k = 1; k <= 8; k++) { s[k] = Math.max((eig.s || {})[k] | 0, (A().beth || {})[k] | 0); g[k] = Math.max((eig.g || {})[k] | 0, (A().bethG || {})[k] | 0); }
    zeilen.push({ pid: S.pid, name: S.lbName, s, g, ich: true });
  }
  zeilen.forEach(r => { let da = false; for (let k = 1; k <= 8; k++) { const v = bethSumme(r, k); if (v > 0) { sum[k - 1] += v; spender[k - 1].push(r.ich ? "Du" : r.name); da = true; } } if (da) alle.add(r.ich ? "Du" : r.name); });
  const eff = sum.map(v => Math.round(v * (1 + BETH_ZUSCHUSS)));
  const tag = adventTag(), start = dayNum(ADV_START);
  const fertigI = i => eff[i] >= BETH[i].ziel || tag >= start + BETH_TAGE * (i + 1);
  let k = 0; while (k < 8 && fertigI(k)) k++;
  const fertigAlle = k >= 8;
  return { sum, eff, spender, namen: [...alle], k, fertig: k, alle: fertigAlle, krippe: fertigAlle && tag >= dayNum(ADV_KRIPPE), vorStart: tag < start,
    offen: k < 8 && tag >= start + BETH_TAGE * k - 1, ab: start + BETH_TAGE * k - 1, frist: start + BETH_TAGE * (k + 1) };
}
const bethRest = st => st.k >= 8 ? 0 : Math.ceil(Math.max(0, BETH[st.k].ziel - st.eff[st.k]) / (1 + BETH_ZUSCHUSS));
const bethHeuteGegeben = () => (A().bethTage || []).includes(adventTag());
function bethSerie() {
  const t = A().bethTage || []; let n = 0, d = adventTag(); if (!t.includes(d)) d--;
  while (t.includes(d)) { n++; d--; } return n;
}
function bethSenden() {
  if (advTestOn()) return;
  const L = window.LB; if (!L || !L.ok || !L.bethSetzen || !S.pid || S.offlineOnly || !S.lbName) return;
  const sig = JSON.stringify([S.beth || {}, S.bethG || {}]); if (!Object.keys(S.beth || {}).length && !Object.keys(S.bethG || {}).length) return; if (S.bethSync === sig) return;
  const klaer = o => { const r = {}; Object.entries(o || {}).forEach(([k, v]) => { if (+k >= 1 && +k <= 8 && v > 0) r[k] = Math.min(v | 0, 20000); }); return r; };
  L.bethSetzen(S.pid, S.lbName, klaer(S.beth), klaer(S.bethG)).then(() => { S.bethSync = sig; save(); const s = klaer(S.beth), g = klaer(S.bethG); bethDaten = (bethDaten || []).filter(r => r.pid !== S.pid).concat([{ pid: S.pid, name: S.lbName, s, g }]); })
    .catch(e => { try { dbFehler("Krippe speichern", e); } catch (e2) {} });
}
function bethSpenden(v, el) {
  const st = bethStand(); if (!st.offen) return;
  v = Math.min(v | 0, bethRest(st), advLichter());
  if (v < 1) { SFX.wrong(); toast(`${svg("licht")}<div>${advLichter() < 1 ? "Du hast gerade keine Adventslichter. Sie kommen bei allem, was XP bringt." : "Diese Figur ist schon fertig."}</div>`); return; }
  const k = String(st.k + 1), mit = Math.round(v * (1 + BETH_ZUSCHUSS));
  A().beth = Object.assign({}, A().beth, { [k]: ((A().beth || {})[k] | 0) + v }); save(); renderHud();
  SFX.coin(); if (el) { const [x, y] = centerOf(el); burst(x, y, 40, { up: 5 }); }
  bethSenden(); checkBadges();
  const voll = bethStand().k > st.k;
  VIEWS.beth();
  if (voll) setTimeout(bethFeiern, 500);
  else toast(`${svg("licht")}<div><b>Danke für dein Licht!</b><div class="small muted">${v} Adventslichter + Gemeinde = ${mit} für „${esc(BETH[st.k].kurz)}“</div></div>`);
}
/* Tägliche Gabe: kostenlos, zählt für die Krippe (einmal pro Tag) */
function bethTagesgabe(el) {
  const st = bethStand(); if (!st.offen || bethHeuteGegeben()) return;
  const v = Math.min(BETH_TAGESGABE, bethRest(st)); if (v < 1) return;
  const k = String(st.k + 1);
  A().bethG = Object.assign({}, A().bethG, { [k]: ((A().bethG || {})[k] | 0) + v }); A().bethTage = [...(A().bethTage || []), adventTag()].slice(-40); save();
  SFX.coin(); if (el) { const [x, y] = centerOf(el); burst(x, y, 30, { up: 4 }); }
  bethSenden(); checkBadges();
  const voll = bethStand().k > st.k;
  VIEWS.beth();
  if (voll) setTimeout(bethFeiern, 500);
  else toast(`${svg("licht")}<div><b>Tägliches Licht gebracht!</b><div class="small muted">+${v} für „${esc(BETH[st.k].kurz)}“ · ${bethSerie()} ${bethSerie() === 1 ? "Tag" : "Tage"} in Folge</div></div>`);
}
/* Feiern: jede fertige Figur einmal für alle, die dafür gegeben haben; das Kind an Heiligabend für alle */
function bethFeiern() {
  if (document.querySelector(".modal") || !adventSichtbar()) return;
  const st = bethStand();
  if (st.krippe && !A().bethAngekommen) {
    A().bethAngekommen = true; save(); checkBadges();
    [0, 900, 2000, 3200].forEach(t => setTimeout(() => { SFX.level(); rain(150); }, t));
    const dabei = Object.values(A().beth || {}).some(v => v > 0) || Object.values(A().bethG || {}).some(v => v > 0);
    modal(`<div class="label">Heiligabend</div><div class="sh-feier adv-finale">${krippeBild(Object.assign({}, st, { kind: true, neuKind: true }))}</div><h2 style="margin:0">${esc(BETH_FINALE.n)}</h2>
      <p class="adv-gruss"><b>Frohe Weihnachten${S.lbName ? ", " + esc(S.lbName) : ""}!</b><br>Die Gemeinde der Freien Baptisten Eichstätt wünscht dir ein gesegnetes Fest. ${st.namen.length} ${st.namen.length === 1 ? "Stern hat" : "Sterne haben"} die Krippe gebaut – jetzt liegt Jesus darin.</p>
      <p class="small muted" style="margin:0">${esc(BETH_FINALE.k)} (${esc(BETH_FINALE.v)})</p>
      <div class="adv-vf"><div><small>Verheißung · ${esc(BETH_FINALE.ver[0])}</small><span>${esc(BETH_FINALE.ver[1])}</span></div><i>→</i><div><small>Erfüllt · ${esc(BETH_FINALE.erf[0])}</small><span>${esc(BETH_FINALE.erf[1])}</span></div></div>
      ${dabei ? `<div class="vle-werte"><div><b>${avatarHtml({ avatar: S.avatar, frame: "stern", name: S.lbName }, 44)}</b><span>Rahmen „Stern von Bethlehem“</span></div><div><b>${svg("krippe")}</b><span>Titel „Krippenbauer“</span></div></div>` : ""}
      <button class="btn primary" data-close>Frohe Weihnachten!</button>`);
    return;
  }
  for (let i = 0; i < st.fertig; i++) {
    const k = String(i + 1);
    if (((A().beth || {})[k] > 0 || (A().bethG || {})[k] > 0) && !(A().bethGefeiert || []).includes(k)) {
      A().bethGefeiert = [...(A().bethGefeiert || []), k]; save(); SFX.badge(); rain(90);
      const b = BETH[i];
      modal(`<div class="label">Figur ${k} von 8 ist da</div><div class="sh-feier">${krippeBild(Object.assign({}, st, { fertig: Math.max(st.fertig, i + 1), neu: i }))}</div><h2 style="margin:0">${esc(b.n)}</h2>
        <div class="adv-vf"><div><small>Gott hat versprochen · ${esc(b.ver[0])}</small><span>${esc(b.ver[1])}</span></div><i>→</i><div><small>In Jesus erfüllt · ${esc(b.erf[0])}</small><span>${esc(b.erf[1])}</span></div></div>
        <p class="muted small" style="margin:0">Mitgebaut haben ${stiftNamen(st.spender[i])}.</p><button class="btn primary" data-close="ok">Weiter</button>`, () => setTimeout(bethFeiern, 300));
      return;
    }
  }
}

/* ---------- Das Krippenbild: jede Figur erscheint, wenn ihre Station fertig ist ---------- */
const kfMensch = (x, y, rock, o = {}) => `<g transform="translate(${x} ${y})"><ellipse cy="1" rx="10" ry="2.4" fill="#000" opacity=".3"/><path d="M-8 0L-5.5 -24h11L8 0z" fill="${rock}" stroke="#1b2a55" stroke-width=".8" stroke-linejoin="round"/>${o.guertel ? `<path d="M-6 -13h12" stroke="${o.guertel}" stroke-width="1.6"/>` : ""}<circle cy="-29" r="5.6" fill="#f1d3b0" stroke="#1b2a55" stroke-width=".7"/>${o.haar || ""}${o.hut || ""}${o.stab ? `<path d="M10 0V-38" stroke="#6b4318" stroke-width="1.7" stroke-linecap="round"/><path d="M10 -38q4 0 4 4" fill="none" stroke="#6b4318" stroke-width="1.7" stroke-linecap="round"/>` : ""}${o.extra || ""}</g>`;
const kfSchaf = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cy="1" rx="11" ry="2.4" fill="#000" opacity=".3"/><path d="M-5 -2v5M5 -2v5" stroke="#3a3a44" stroke-width="1.8" stroke-linecap="round"/><ellipse cy="-8" rx="10" ry="7" fill="#f4f0e6" stroke="#b9b2a0" stroke-width=".8"/><circle cx="-5" cy="-12" r="4" fill="#f4f0e6"/><circle cx="3" cy="-13" r="4" fill="#f4f0e6"/><ellipse cx="11" cy="-9" rx="4" ry="3.6" fill="#3a3a44"/><circle cx="12" cy="-10" r=".8" fill="#fff"/></g>`;
const kfFiguren = {
  stall: () => `<g><path d="M104 74L160 44l56 30z" fill="#7a4a24" stroke="#3a210c" stroke-width="1.6" stroke-linejoin="round"/><path d="M118 74L160 52l42 22z" fill="#8f5a2e"/><rect x="108" y="74" width="104" height="94" fill="#2b2140" opacity=".92"/><rect x="104" y="72" width="7" height="98" rx="2" fill="#a56a32" stroke="#3a210c" stroke-width=".9"/><rect x="209" y="72" width="7" height="98" rx="2" fill="#a56a32" stroke="#3a210c" stroke-width=".9"/>
    <path d="M142 150h36l-5 17h-26z" fill="#c98a4b" stroke="#5a3410" stroke-width="1.2" stroke-linejoin="round"/><path d="M146 150c6-6 22-6 28 0" fill="#e8c46a" stroke="#b9923a" stroke-width="1"/><path d="M118 168c6-5 12-5 18 0M184 168c6-5 12-5 18 0" stroke="#e8c46a" stroke-width="1.6" fill="none"/></g>`,
  maria: () => kfMensch(130, 168, "#4a7fd0", { guertel: "#f2c14e", haar: `<path d="M-6.4 -29a6.4 6.4 0 0 1 12.8 0v3h-12.8z" fill="#2f5fb0" stroke="#1b2a55" stroke-width=".7"/>` }),
  josef: () => kfMensch(190, 168, "#8a5a30", { guertel: "#3a210c", stab: true, haar: `<path d="M-5.6 -29a5.6 5.6 0 0 1 11.2 0c-2-2-4-3-5.6-3s-3.6 1-5.6 3z" fill="#5e3a1c"/><path d="M-4 -26q4 6 8 0" fill="#7a5230"/>` }),
  schafe: () => kfSchaf(244, 172) + kfSchaf(266, 176, .8) + kfSchaf(226, 177, .7),
  hirten: () => kfMensch(286, 170, "#6b8a4a", { stab: true, hut: `<path d="M-6.4 -31a6.4 3.6 0 0 1 12.8 0z" fill="#6b4a2a" stroke="#3a210c" stroke-width=".6"/>` }) + kfMensch(308, 172, "#a56a32", { hut: `<path d="M-6.4 -31a6.4 3.6 0 0 1 12.8 0z" fill="#8a2a3a" stroke="#3a210c" stroke-width=".6"/>` }),
  engel: () => `<g transform="translate(278 62)"><circle r="34" fill="url(#kfGlut)"/><path d="M-6 -4q-22-14-26 6 8-2 14 4 6-2 12-10z" fill="#fff" stroke="#c9d6f0" stroke-width=".8"/><path d="M6 -4q22-14 26 6-8-2-14 4-6-2-12-10z" fill="#fff" stroke="#c9d6f0" stroke-width=".8"/><path d="M-7 14L-5 -6h10l2 20z" fill="#fff" stroke="#c9d6f0" stroke-width=".8"/><circle cy="-11" r="5.4" fill="#f6dcc0" stroke="#c9b08a" stroke-width=".6"/><ellipse cy="-19" rx="6" ry="1.9" fill="none" stroke="#f2c14e" stroke-width="1.6"/></g>`,
  stern: () => `<g transform="translate(160 30)"><path d="M-3 4L-24 138H24L3 4z" fill="url(#kfGlut)" opacity=".28"/><circle r="30" fill="url(#kfGlut)"/><path d="M0 -17l5 11 12 1.5-9 8 2.6 12L0 9l-10.6 6.5L-8 3.5l-9-8 12-1.5z" fill="#fff3c4" stroke="#f2c14e" stroke-width="1" stroke-linejoin="round"/></g>`,
  weise: () => kfMensch(34, 170, "#7a3a8a", { hut: kfKrone, extra: kfGabe("#f2c14e") }) + kfMensch(60, 172, "#2f7a6a", { hut: kfKrone, extra: kfGabe("#e8e2d0") }) + kfMensch(86, 170, "#b0392f", { hut: kfKrone, extra: kfGabe("#8a5a30") })
};
const kfKrone = `<path d="M-5.6 -33l1.6-5 2.4 3 1.6-4 1.6 4 2.4-3 1.6 5z" fill="#f2c14e" stroke="#9a6d12" stroke-width=".6"/>`;
const kfGabe = c => `<rect x="-14" y="-12" width="8" height="8" rx="1.2" fill="${c}" stroke="#1b2a55" stroke-width=".6"/>`;
function krippeBild(st) {
  const sterne = Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 47) % 320}" cy="${(i * 29) % 80 + 6}" r="${i % 4 ? .8 : 1.4}" fill="#fff" opacity="${i % 3 ? .55 : .9}"/>`).join("");
  const figs = BETH.map((b, i) => { const z = i < st.fertig ? "da" : i === st.k && st.offen && !st.alle ? "jetzt" : "spaeter";
    return `<g class="kf kf-${z}${st.neu === i ? " kf-neu" : ""}" data-f="${b.f}">${kfFiguren[b.f]()}</g>`; }).join("");
  const kind = `<g class="kf-kind${st.neuKind ? " kf-neu" : ""}"><circle cx="160" cy="146" r="${st.kind ? 40 : 0}" fill="url(#kfGlut)"/><ellipse cx="160" cy="153" rx="14" ry="6.5" fill="#fff" stroke="#e8dcc0" stroke-width="1"/><circle cx="160" cy="147" r="5.4" fill="#f6dcc0" stroke="#d9b896" stroke-width=".7"/><path d="M155 146q5 3 10 0" stroke="#b08a6a" stroke-width=".8" fill="none"/>${st.kind ? [0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M160 146L${(160 + 70 * Math.cos(Math.PI + i * Math.PI / 6)).toFixed(0)} ${(146 + 70 * Math.sin(Math.PI + i * Math.PI / 6)).toFixed(0)}" stroke="#fff3c4" stroke-width="1" opacity=".25"/>`).join("") : ""}</g>`;
  return `<svg class="sh-bild krippe-bild" viewBox="0 0 320 190" role="img" aria-label="Die Krippe: ${st.fertig} von 8 Figuren stehen${st.kind ? ", das Kind liegt in der Krippe" : ""}">
  <defs><linearGradient id="kfNacht" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1636"/><stop offset=".7" stop-color="#2a2552"/><stop offset="1" stop-color="#5a3a52"/></linearGradient>
    <radialGradient id="kfGlut"><stop offset="0" stop-color="#fffbe8"/><stop offset=".45" stop-color="#ffe39a" stop-opacity=".6"/><stop offset="1" stop-color="#ffe39a" stop-opacity="0"/></radialGradient></defs>
  <rect width="320" height="190" fill="url(#kfNacht)"/>${sterne}
  <path d="M0 128Q60 100 130 118T320 92V190H0Z" fill="#2b2447"/><path d="M0 164Q90 138 190 154T320 134V190H0Z" fill="#3a2f55"/><rect y="168" width="320" height="22" fill="#3a2f55"/>
  ${figs}${st.fertig >= 1 || st.kind ? kind : ""}</svg>`;
}
const bethWeg = st => `<ol class="sh-weg" aria-label="Figuren">${BETH.map((a, i) => { const z = i < st.fertig ? "fertig" : i === st.k && st.offen ? "jetzt" : i === st.k ? "naechst" : "spaeter";
  return `<li class="${z}" title="${i + 1}. ${esc(a.n)}"><span>${z === "fertig" ? svg("check") : i + 1}</span><small>${esc(a.kurz)}</small></li>`; }).join("")}</ol>`;
const vfTeil = t => { const i = t.indexOf(": "); return i < 0 ? ["", t] : [t.slice(0, i), t.slice(i + 2)]; };
const vfKarte = (ver, erf, kopf1 = "Gott hat versprochen", kopf2 = "In Jesus erfüllt") => `<div class="adv-vf"><div><small>${kopf1} · ${esc(ver[0])}</small><span>${esc(ver[1])}</span></div><i>→</i><div><small>${kopf2} · ${esc(erf[0])}</small><span>${esc(erf[1])}</span></div></div>`;
const sternenTafel = st => `<section class="adv-tafel" aria-label="Sternen-Tafel"><div class="adv-tafel-kopf">${svg("stern")}<div><b>Sternen-Tafel</b><small>Alle, die an der Krippe mitbauen</small></div></div>
  ${st.namen.length ? `<div class="adv-sterne">${st.namen.slice().sort((a, b) => a === "Du" ? -1 : b === "Du" ? 1 : a.localeCompare(b, "de")).slice(0, 40).map(n => `<span class="adv-stern${n === "Du" ? " ich" : ""}">${svg("stern")}${esc(n)}</span>`).join("")}${st.namen.length > 40 ? `<span class="adv-stern mehr">+${st.namen.length - 40}</span>` : ""}</div>` : `<p class="small muted" style="margin:6px 0 0">Noch leer – dein Stern kann der erste sein.</p>`}</section>`;
VIEWS_BETH = () => {
  const st = bethStand(), a = BETH[Math.min(st.k, 7)], ist = st.alle ? 0 : st.eff[st.k];
  const pz = st.alle ? 100 : Math.min(100, Math.round(ist / a.ziel * 100)), online = (window.LB && LB.ok && LB.bethSetzen && S.pid && !S.offlineOnly) || advTestOn();
  const zuschuss = Math.round(BETH_ZUSCHUSS * 100);
  let karte;
  if (st.krippe) karte = `<div class="sh-karte fertig"><div class="sh-z1"><b>${esc(BETH_FINALE.n)}</b><small>8 von 8</small></div><p class="sh-vers">${esc(BETH_FINALE.k)} (${esc(BETH_FINALE.v)})</p>${vfKarte(BETH_FINALE.ver, BETH_FINALE.erf)}</div>`;
  else if (st.alle) karte = `<div class="sh-karte genug"><div class="sh-z1"><b>Alles ist bereit!</b><small>8 von 8</small></div><p class="sh-vers">Die Krippe steht, alle sind da. Nur einer fehlt noch: Am Heiligabend (${esc(adventDatum(dayNum(ADV_KRIPPE)))}) liegt das Kind darin – schau dann wieder vorbei!</p>
      <p class="sh-geber">Zuletzt bauten mit ${stiftNamen(st.spender[7])}</p></div>`;
  else if (!st.offen) karte = `<div class="sh-karte genug"><div class="sh-z1"><b>Figur ist da!</b><small>${st.k} von 8</small></div><p class="sh-vers">Es geht weiter am ${esc(adventDatum(st.ab + 1))} mit „${esc(a.n)}“.</p>${vfKarte(BETH[st.k - 1].ver, BETH[st.k - 1].erf)}
      <p class="sh-geber">Mitgebaut haben ${stiftNamen(st.spender[st.k - 1])}</p></div>`;
  else {
    const heute = bethHeuteGegeben(), serie = bethSerie();
    karte = `<div class="sh-karte"><div class="sh-z1"><b>${st.k + 1} · ${esc(a.n)}</b><small>bis ${esc(adventKurz(st.frist - 1))}</small></div><p class="sh-vers">${esc(a.k)} (${esc(a.v)})</p>${vfKarte(a.ver, a.erf)}
      <div class="sh-balken"><i style="width:${pz}%"></i></div><div class="sh-zahlen"><span>${pkt(ist)} von ${pkt(a.ziel)} Lichtern</span><span>${pz} %</span></div>
      <p class="small muted" style="margin:0">Die Gemeinde legt zu jedem Licht <b>${zuschuss} %</b> dazu. Spätestens am ${esc(adventDatum(st.frist))} füllt sie den Rest auf und die nächste Figur kommt.</p>
      ${online ? `<div class="sh-spenden">${[10, 50, 100].map(v => `<button data-sp="${v}" ${advLichter() < 1 ? "disabled" : ""}>+${v}</button>`).join("")}<button class="haupt" data-sp="frei">Spenden</button></div>
        <button class="btn ${heute ? "ghost" : "primary"} breit adv-gabe" id="bethGabe" ${heute ? "disabled" : ""}>${svg("licht")} ${heute ? `Heute gebracht · ${serie} ${serie === 1 ? "Tag" : "Tage"} in Folge` : `Tägliches Licht · +${BETH_TAGESGABE} gratis`}</button>`
      : `<p class="small muted" style="margin:0">Spenden geht nur mit Internet und Eintrag in der Rangliste.</p>`}
      <p class="sh-geber">${st.spender[st.k].length ? `Bisher bauten mit ${stiftNamen(st.spender[st.k])}` : "Sei der Erste, der für diese Figur ein Licht bringt!"}</p></div>`;
  }
  screen.innerHTML = `${backBtn("advent", "Advent")}${bereichKopf("advent", { ic: "krippe", t: "Die Krippe", sub: "Die Gemeinde baut sie gemeinsam", ring: [st.fertig, "von 8"] })}${advTestLeiste()}
    <div class="sh-buehne">${krippeBild(st)}</div>${bethWeg(st)}
    <div class="adv-licht-zeile">${svg("licht")}<span><b>${advLichtText()} Adventslichter</b><small>Du verdienst 1 Licht je ${ADV_LICHT_XP} XP – bei allen Spielen. Gespendet wird nur mit Lichtern.</small></span></div>
    ${karte}${sternenTafel(st)}
    <p class="small muted sh-fuss">Wer mitgebaut hat, wird mit Namen genannt, Mengen bleiben verborgen (Matthäus 6,3).</p>`;
  wireGo(); advTestWire(VIEWS_BETH);
  screen.querySelectorAll("[data-sp]").forEach(b => b.onclick = () => { const v = b.dataset.sp; if (v === "frei") { bethSpendeWahl(); return; } bethSpenden(+v, b); });
  const g = $("bethGabe"); if (g) g.onclick = () => bethTagesgabe(g);
  if ((!bethDaten || Date.now() - bethZeit > 60e3) && Date.now() - bethVersuch > 60e3) bethLaden(true).then(() => { if (current === "beth" && !document.querySelector(".modal")) VIEWS_BETH(); bethFeiern(); });
  else bethFeiern();
};
function bethSpendeWahl() {
  const st = bethStand(), rest = bethRest(st), max = Math.min(advLichter(), rest);
  const m = modal(`<div class="label">Licht für die Krippe</div><h2 style="margin:0">${esc(BETH[st.k].n)}</h2><p class="muted small" style="margin:0">Noch ${pkt(rest)} Lichter bis zum Ziel · du hast ${advTestOn() ? "im Test unbegrenzt" : pkt(advLichter())}.<br>Die Gemeinde legt ${Math.round(BETH_ZUSCHUSS * 100)} % dazu.</p>
    <input class="field" id="spBetrag" type="number" inputmode="numeric" min="1" max="${max}" value="${Math.max(1, Math.min(max, 25))}" aria-label="Adventslichter spenden">
    <button class="btn primary" id="spOk" ${max < 1 ? "disabled" : ""}>Spenden</button><button class="btn ghost" data-close>Abbrechen</button>`);
  m.querySelector("#spOk").onclick = () => { const v = Math.floor(+m.querySelector("#spBetrag").value || 0); m.remove(); bethSpenden(v); };
}

/* =====================================================================
   Adventskalender – Türchen mit großer Belohnung
   ===================================================================== */
const kalOptionen = d => KALENDER[d - 1].a.slice().sort((x, y) => hash("kal" + d + x) - hash("kal" + d + y));
const kalBelohnung = (d, heute) => { const g = KAL_GROSS[d] || [0, 0]; return { tal: (heute ? KAL_TAL : KAL_TAL_SPAET) + g[0], licht: (heute ? KAL_LICHT : KAL_LICHT_SPAET) + g[1] }; };
function kalOeffnen(d) {
  if (d > kalHeuteNr()) { SFX.wrong(); toast(`${svg("tuer")}<div><b>Noch zu!</b><div class="small muted">Türchen ${d} geht am ${esc(adventDatum(dayNum(KAL_START) + d - 1))} auf.</div></div>`); return; }
  const e = KALENDER[d - 1], frist = dayNum(KAL_START) + d - 1, heute = adventTag() === frist, test = advTestOn();
  A().kal = Object.assign({}, A().kal);
  let neu = false;
  if (!A().kal[d]) { neu = true; A().kal[d] = { o: adventTag() }; save(); }
  const lohn = neu ? kalBelohnung(d, heute) : { tal: 0, licht: 0 };
  if (neu && !test) { addTal(lohn.tal); adventLichtGeben(lohn.licht); checkBadges(); }
  const beantwortet = () => A().kal[d].r !== undefined;
  const m = modal(`<div class="label">Türchen ${d}${d === 24 ? " · Heiligabend" : ""}</div><div id="kalInhalt"></div>`);
  m.classList.add("adv-tuer-modal");
  const innen = m.querySelector("#kalInhalt");
  const zahlen = (tal, licht) => `<div class="adv-lohn"><div class="adv-lohn-k tal">${TAL_MUENZE}<b data-z="${tal}">+${test ? 0 : tal}</b><span>Talente</span></div><div class="adv-lohn-k licht">${svg("licht")}<b data-z="${licht}">+${test ? 0 : licht}</b><span>Adventslichter</span></div></div>`;
  const zaehlen = () => { if (test) return; innen.querySelectorAll("[data-z]").forEach(b => { const z = +b.dataset.z; let t0 = performance.now(); const f = t => { const p = Math.min(1, (t - t0) / 900); b.textContent = "+" + Math.round(z * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }); };
  const schritt0 = () => {
    if (!neu) { schritt1(); return; }
    innen.innerHTML = `<div class="adv-tor"><div class="adv-tor-licht"></div><div class="adv-tor-blatt l"></div><div class="adv-tor-blatt r"></div><b class="adv-tor-nr">${d}</b></div>`;
    SFX.tap(); setTimeout(() => { SFX.badge(); const [x, y] = centerOf(innen.querySelector(".adv-tor")); burst(x, y, 36, { up: 6 }); rain(d === 24 ? 120 : 40); }, 500);
    setTimeout(schritt1, 1500);
  };
  const schritt1 = () => {
    const ev = KAL_ERF[d - 1];
    innen.innerHTML = `<div class="adv-aufgang"><h2 style="margin:0 0 6px">${esc(e.t)}</h2><p class="small muted" style="margin:0 0 8px">${svg("book")} ${esc(e.v)}</p><p style="margin:0 0 10px">${esc(e.s)}</p>
      ${vfKarte(vfTeil(ev[0]), vfTeil(ev[1]), "Verheißung", "Erfüllung")}
      ${neu ? `${zahlen(lohn.tal, lohn.licht)}${test ? `<p class="small muted" style="margin:0 0 10px">Testmodus: keine Belohnung${heute ? "" : " (nachgeholt)"}</p>` : `<p class="small muted" style="margin:0 0 10px">${heute ? "Heute geöffnet – volle Belohnung" : "Nachgeholt – halbe Belohnung"}</p>`}` : ""}
      ${beantwortet() ? `<p class="small muted" style="margin:0 0 10px">${A().kal[d].r ? `${svg("check", "var(--good)")} Frage richtig beantwortet` : "Frage beantwortet"} – ${esc(e.e)}</p><button class="btn primary" data-close>Schließen</button>`
        : `<button class="btn primary" id="kalFrage">Zur Frage (+${KAL_TAL_FRAGE} Talente, +${KAL_LICHT_FRAGE} Lichter)</button><button class="btn ghost" data-close>Später</button>`}</div>`;
    innen.querySelectorAll("[data-close]").forEach(b => b.onclick = () => { m.remove(); SFX.tap(); if (current === "kal") VIEWS.kal(); });
    const f = innen.querySelector("#kalFrage"); if (f) f.onclick = () => { SFX.tap(); schritt2(); };
    if (neu) setTimeout(zaehlen, 250);
  };
  const schritt2 = () => {
    innen.innerHTML = `<h2 style="margin:0 0 8px;font-size:1.1rem">${esc(e.q)}</h2><div class="stack">${kalOptionen(d).map((o, i) => `<button class="btn kal-opt" data-o="${i}">${esc(o)}</button>`).join("")}</div>`;
    innen.querySelectorAll(".kal-opt").forEach(b => b.onclick = () => {
      const wahl = b.textContent, ok = wahl === e.a[0];
      innen.querySelectorAll(".kal-opt").forEach(x => { x.disabled = true; if (x.textContent === e.a[0]) x.classList.add("richtig"); else if (x === b) x.classList.add("falsch"); });
      A().kal[d].r = ok ? 1 : 0; save();
      if (ok) { SFX.right && SFX.right(); if (!test) { addTal(KAL_TAL_FRAGE); adventLichtGeben(KAL_LICHT_FRAGE); } } else SFX.wrong();
      setTimeout(() => { innen.insertAdjacentHTML("beforeend", `<p style="margin:10px 0 6px"><b>${ok ? (test ? "Richtig!" : `Richtig! +${KAL_TAL_FRAGE} Talente, +${KAL_LICHT_FRAGE} Lichter`) : "Leider nicht."}</b> ${esc(e.e)}</p><button class="btn primary" id="kalOk">Weiter</button>`);
        $("kalOk").onclick = () => { m.remove(); SFX.tap(); if (current === "kal") VIEWS.kal(); }; }, 500);
    });
  };
  schritt0();
}
VIEWS_KAL = () => {
  const nr = kalHeuteNr(), offen = Object.keys(A().kal || {}).length, schon = adventTag() >= dayNum(KAL_START);
  const tuer = Array.from({ length: 24 }, (_, i) => { const d = i + 1, auf = !!(A().kal || {})[d], da = d <= nr;
    const z = auf ? "auf" : d === nr ? "heute" : da ? "verpasst" : "zu";
    return `<button class="adv-tuer ${z} ${d === 24 ? "gross" : ""}" data-t="${d}" aria-label="Türchen ${d}${auf ? ", geöffnet" : da ? ", wartet" : ", noch zu"}"><b>${d}</b>${auf ? svg("check") : d === 24 ? svg("krippe") : da ? svg("tuer") : svg("lock")}</button>`; }).join("");
  const r = kalBelohnung(Math.max(1, nr), true);
  screen.innerHTML = `${backBtn("advent", "Advent")}${bereichKopf("advent", { ic: "tuer", t: "Kalender", sub: schon ? "Jeden Tag ein Türchen" : `Es geht los am ${adventDatum(dayNum(KAL_START))}`, ring: [offen, "von 24"],
    tafel: [[nr, "heute dran"], [Object.values(A().kal || {}).filter(x => x.r === 1).length, "Fragen richtig"], [`${KAL_MEISTER}`, "für Rahmen"]] })}
    ${advTestLeiste()}<div class="adv-tuerfeld">${tuer}</div>
    <p class="small muted sh-fuss">Jedes Türchen zeigt, was Gott versprochen hat und wie Jesus es erfüllt. Belohnung: ${r.tal} Talente und ${r.licht} Adventslichter (am Tag selbst, nachgeholt die Hälfte), dazu eine Frage mit Zugabe. Mit ${KAL_MEISTER} Türchen gibt es den Rahmen „Adventskranz“ und den Titel „Adventsbote“.</p>`;
  wireGo(); advTestWire(VIEWS_KAL);
  screen.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { SFX.tap(); kalOeffnen(+b.dataset.t); });
};

/* =====================================================================
   Advents-Biblionär (eine Runde je Adventswoche, mit weihnachtlichen Pastoren)
   ===================================================================== */
const advBibGespielt = w => (A().advBib || {})[w] !== undefined;
function bibAdventStarten() {
  const w = advRunde();
  if (!w) { toast(`${svg("biblionaer")}<div><b>Der Advent ist vorbei</b><div class="small muted">Frohe Weihnachten!</div></div>`); return; }
  if (advBibGespielt(w)) { toast(`${svg("biblionaer")}<div><b>Diese Woche schon gespielt</b><div class="small muted">Nächsten Sonntag gibt es neue Fragen.</div></div>`); return; }
  modal(`<div class="label">Advents-Biblionär</div><h2 style="margin:0">${w}. Advent</h2>
    <p class="muted">15 Fragen rund um Advent und Weihnachten – für alle in der Gemeinde dieselben. Pastor Willi und Pastor Aaron helfen dir mit Weihnachtsmütze. Du hast <b>einen Versuch pro Adventswoche</b>; wer abbricht, bekommt 0 Punkte. Zusätzlich gibt es ${ADV_BIB_TAL} Talente.${advTestOn() ? " <b>(Testmodus: ohne Belohnung)</b>" : ""}</p>
    <button class="btn primary" data-close="los">${svg("biblionaer")} Los geht's</button><button class="btn ghost" data-close>Später</button>`, r => { if (r === "los") advBibLos(w); });
}
function advBibLos(w) {
  if (advBibGespielt(w)) return;
  A().advBib = Object.assign({}, A().advBib, { [w]: 0 }); save();
  go("biblionaer");
  const G = { modus: "advent", adv: w, weih: true, fragen: bibFragen(hash("advent" + w), "", ADV_BIB_FRAGEN[w]) };
  countdown(() => bibStart(G));
}

/* ---------- Zusammenführen mit einem anderen Gerät: nie Fortschritt verlieren ---------- */
function adventMischen(r) {
  ["beth", "bethG", "advBib"].forEach(k => { const a = S[k] = Object.assign({}, S[k] || {}); Object.entries(r[k] || {}).forEach(([i, v]) => { a[i] = Math.max(a[i] | 0, v | 0); }); });
  S.advLv = Math.max(S.advLv | 0, r.advLv | 0); S.advLr = Math.max(S.advLr | 0, r.advLr | 0);
  const uni = (a, b) => [...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])])];
  S.bethTage = uni(S.bethTage, r.bethTage).sort((x, y) => x - y).slice(-40); S.bethGefeiert = uni(S.bethGefeiert, r.bethGefeiert);
  S.bethAngekommen = !!(S.bethAngekommen || r.bethAngekommen);
  const kal = Object.assign({}, S.kal || {}); Object.entries(r.kal || {}).forEach(([d, v]) => { const a = kal[d]; if (!a) { kal[d] = v; return; }
    kal[d] = { o: Math.min(a.o || v.o || 0, v.o || a.o || 0), r: a.r === undefined ? v.r : v.r === undefined ? a.r : Math.max(a.r | 0, v.r | 0) }; if (kal[d].r === undefined) delete kal[d].r; });
  S.kal = kal;
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
    ${kerzen}${nadeln}<g fill="#d93a4a" stroke="#6a1420" stroke-width=".6"><circle cx="70" cy="98" r="3"/><circle cx="160" cy="104" r="3"/><circle cx="252" cy="98" r="3"/><circle cx="112" cy="102" r="2.4"/><circle cx="210" cy="102" r="2.4"/></g></svg>`;
}
VIEWS_ADVENT = () => {
  const w = adventWoche(), n = Math.min(4, w), st = bethStand(), nr = kalHeuteNr(), kalOffen = Object.keys(A().kal || {}).length, kalHeute = nr > 0 && (A().kal || {})[nr];
  const r = advRunde(), bibGesp = r ? advBibGespielt(r) : true;
  const karte = (ic, titel, unter, info, attr, punkt) => `<button class="bereich klein adv-karte" ${attr}><span class="b-ic">${svg(ic)}</span><span class="b-tx"><b>${titel}</b><span>${unter}</span></span><span class="b-info">${punkt ? `<i class="adv-punkt"></i>` : ""}${info}</span></button>`;
  const wegUnter = st.krippe ? "Das Kind liegt in der Krippe!" : st.alle ? "Alles bereit – bis Heiligabend" : st.offen ? `Jetzt: ${esc(BETH[st.k].kurz)}` : "Die nächste Figur kommt bald";
  const wegPunkt = st.offen && !st.alle && !bethHeuteGegeben();
  const kalUnter = !nr ? `Ab ${esc(adventDatum(dayNum(KAL_START)))}` : kalHeute ? "Heute schon geöffnet" : `Türchen ${nr} wartet`;
  const vf = nr > 0 ? KAL_ERF[nr - 1].map(vfTeil) : [["Jesaja 9,1", "Das Volk, das im Finstern wandelt, sieht ein großes Licht."], ["Lukas 2,11", "Euch ist heute der Retter geboren, der Christus, der Herr."]];
  screen.innerHTML = `${backBtn("home", "Start")}${bereichKopf("advent", { ic: "kerze", t: "Advent", sub: w === 5 ? "Frohe Weihnachten!" : `${n}. Advent – Gott kommt zu uns`, ring: [n, n === 1 ? "Kerze" : "Kerzen"] })}${advTestLeiste()}
    <div class="adv-kranzbox">${adventKranz(n)}</div>
    <div class="adv-licht-zeile">${svg("licht")}<span><b>${advLichtText()} Adventslichter</b><small>Gibt es nur im Advent: 1 Licht je ${ADV_LICHT_XP} XP bei jedem Spiel. Damit baust du die Krippe.</small></span></div>
    ${karte("krippe", "Die Krippe wächst", wegUnter, `${st.fertig}/8`, `data-go="beth"`, wegPunkt)}
    ${karte("tuer", "Adventskalender", kalUnter, `${kalOffen}/24`, `data-go="kal"`, nr > 0 && !kalHeute)}
    ${karte("biblionaer", "Advents-Biblionär", !r ? "Die Runden sind vorbei" : bibGesp ? `Diese Woche: ${pkt((A().advBib || {})[r] | 0)} Punkte` : `${r}. Advent · 15 Fragen, 1 Versuch`, r ? `${Object.keys(A().advBib || {}).length}/4` : "–", `id="advBib"`, r && !bibGesp)}
    ${karte("duell", "Weihnachts-Duell", "Biblionär-Duell im Weihnachtsmodus", "›", `data-go="bib"`, false)}
    ${vfKarte(vf[0], vf[1], "Gott hat versprochen", "In Jesus erfüllt")}
    <p class="small muted sh-fuss">Jede Adventswoche beginnt am Sonntag. Im Weihnachtsmodus tragen Pastor Willi und Pastor Aaron Weihnachtsmützen und antworten weihnachtlich.</p>`;
  wireGo(); advTestWire(VIEWS_ADVENT);
  const b = $("advBib"); if (b) b.onclick = () => { SFX.tap(); bibAdventStarten(); };
  bethLaden().then(() => { if (current === "advent" && !document.querySelector(".modal")) { const alt = st.fertig; if (bethStand().fertig !== alt) VIEWS_ADVENT(); } });
};

/* ---------- Kleine Karte auf Start und Gemeinde ---------- */
function adventMiniHtml(kompakt) {
  if (!adventSichtbar()) return "";
  const st = bethStand(), nr = kalHeuteNr(), r = advRunde();
  const offen = [];
  if (st.offen && !st.alle && !bethHeuteGegeben()) offen.push("Tägliches Licht");
  if (nr > 0 && !(A().kal || {})[nr]) offen.push(`Türchen ${nr}`);
  if (r && !advBibGespielt(r)) offen.push("Biblionär-Runde");
  const zeile = st.krippe ? "Frohe Weihnachten! Das Kind ist da" : offen.length ? `Wartet: ${offen.slice(0, 2).join(" · ")}` : `Krippe ${st.fertig}/8`;
  const pz = st.alle ? 100 : Math.min(100, Math.round(st.eff[st.k] / BETH[st.k].ziel * 100));
  return `<button class="sh-mini adv-mini ${kompakt ? "kompakt" : ""}" data-go="advent" aria-label="Advent: ${esc(zeile)}">${svg("kerze")}<span class="sh-mini-tx"><b>Advent${advTestOn() ? " · Test" : ""}</b><small>${esc(zeile)}</small>${kompakt ? "" : `<i class="sh-balken klein"><i style="width:${pz}%"></i></i>`}</span><span class="adv-mini-licht">${svg("licht")}${advLichtText()}</span>${offen.length ? `<i class="adv-punkt" aria-hidden="true"></i>` : ""}<span class="sh-pfeil">›</span></button>`;
}
/* Einmaliger Willkommens-Hinweis am Anfang des Advents */
function adventStartHinweis() {
  if (advTestOn() || !adventSichtbar() || S.adventIntro || document.querySelector(".modal") || !S.lbName) return;
  S.adventIntro = true; save(); SFX.badge();
  modal(`<div class="label">1. Advent</div><h2 style="margin:0">Der Advent beginnt!</h2>
    <p class="muted" style="margin:0">Gott hat versprochen, dass er kommt – an Weihnachten hat Jesus es erfüllt. Bis dahin gibt es:</p>
    <ul class="adv-liste"><li>${svg("krippe")}<span><b>Die Krippe wächst</b> – die Gemeinde baut gemeinsam Stall, Maria, Josef, Schafe, Hirten, Engel, Stern und Weise. Am Heiligabend liegt das Kind darin.</span></li>
      <li>${svg("licht")}<span><b>Adventslichter</b> – gibt es nur im Advent, bei allem, was XP bringt. Mit ihnen baust du die Krippe; die Gemeinde legt ${Math.round(BETH_ZUSCHUSS * 100)} % dazu.</span></li>
      <li>${svg("tuer")}<span><b>Adventskalender</b> – ab ${esc(adventDatum(dayNum(KAL_START)))} jeden Tag ein Türchen mit großer Belohnung.</span></li>
      <li>${svg("biblionaer")}<span><b>Advents-Biblionär und Weihnachts-Duelle</b> – mit weihnachtlichen Pastoren.</span></li></ul>
    <button class="btn primary" data-close="los">${svg("kerze")} Zum Advent</button><button class="btn ghost" data-close>Später</button>`, r => { if (r === "los") go("advent"); });
}
