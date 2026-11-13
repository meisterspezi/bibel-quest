/* =====================================================================
   Biblionär – Sondereditionen (Version 9.63, ersetzt advent.js)
   Weihnachten, Ostern, Pfingsten und Reformation: eigener Fragenpool für Solo, Duell und „Biblionär der Woche“.
   Der Schalter im Reiter Biblionär erscheint nur im Zeitraum einer Edition. Der Entwickler kann Editionen
   im Postkasten vorab einschalten (nur auf seinem Gerät, ohne Belohnungen).
   Fragen: editionen-daten.js. Wird vor spiel.js geladen; alles aus spiel.js wird erst beim Aufruf benutzt.
   ===================================================================== */

/* ---------- Symbole (klein, in Listen, Schalter und Spieltitel) ---------- */
const WEIH_FLOCKE = `<svg class="weih-fl" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M12 5.5l-2.2-2M12 5.5l2.2-2M12 18.5l-2.2 2M12 18.5l2.2 2M6.4 8.8l-.6-2.9M6.4 8.8l-2.8 1M17.6 15.2l.6 2.9M17.6 15.2l2.8-1M6.4 15.2l-2.8-1M6.4 15.2l-.6 2.9M17.6 8.8l2.8 1M17.6 8.8l.6-2.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
const ED_OSTER_SYM = `<svg class="weih-fl ed-fl ed-fl-ostern" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5v16M7.6 7.4h8.8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M2.5 21h19M4.8 17.6a7.6 7.6 0 0 1 3.4-4.6M19.2 17.6a7.6 7.6 0 0 0-3.4-4.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
const ED_PFINGST_SYM = `<svg class="weih-fl ed-fl ed-fl-pfingsten" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c3.2 3.8 6 6.8 6 11a6 6 0 0 1-12 0c0-2.6 1.4-4.6 3-6.2.2 2.2 1.2 3.4 2.6 4-.9-3.2-.4-6 .4-8.8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 14.5c1.4 1.4 2 2.4 2 3.5a2 2 0 0 1-4 0c0-1.1.6-2.1 2-3.5z" fill="currentColor"/></svg>`;
const ED_REFO_SYM = `<svg class="weih-fl ed-fl ed-fl-reformation" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 18.2c-3.6-2.6-5.4-4.5-5.4-6.7A2.8 2.8 0 0 1 12 9.8a2.8 2.8 0 0 1 5.4 1.7c0 2.2-1.8 4.1-5.4 6.7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 10.8v5M10.1 12.6h3.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
const WEIH_HAUBE = `<span class="weih-haube" aria-hidden="true"><svg viewBox="0 0 340 20" preserveAspectRatio="none"><path d="M8 12C8 5 14 3 24 3h292c10 0 16 2 16 9 0 4-4 5-7 3s-7-2-10 1-8 4-12 1-9-3-13 0-9 5-14 1-10-2-14 1-10 4-15 0-11-2-15 2-10 3-14-1-10-3-15 1-11 4-16 0-9-3-14 0-10 5-15 1-10-2-14 1-9 4-14 0-9-2-13 1-9 3-13 0-8-2-11 0-9 2-9-3z" fill="#fff"/><path d="M30 6h280" stroke="#dcecff" stroke-width="1.5" stroke-linecap="round" opacity=".7"/></svg></span>`;
const WEIH_STERN = `<svg class="weih-stern" viewBox="0 0 64 64" aria-hidden="true"><defs><radialGradient id="weihSt"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#fff1c2"/><stop offset="1" stop-color="#f2c14e" stop-opacity="0"/></radialGradient></defs><circle cx="34" cy="26" r="20" fill="url(#weihSt)" opacity=".5"/><path d="M34 2l3.4 19.5L56 26l-18.6 4.5L34 62l-3.4-31.5L12 26l18.6-4.5z" fill="#fff8dc" stroke="#f2c14e" stroke-width="1"/><path d="M34 14l1.6 10.4L46 26l-10.4 1.6L34 38l-1.6-10.4L22 26l10.4-1.6z" fill="#fff"/></svg>`;
(function () {
  const W = inner => `<svg x="0" y="0" width="24" height="24" viewBox="0 0 64 64" overflow="visible" class="wr wr-lohn"><ellipse cx="32" cy="61" rx="17" ry="2.2" fill="#000" opacity=".3"/>${inner}</svg>`;
  ICONS.kerze = W(`<rect x="22" y="26" width="20" height="32" rx="4" fill="#f6f1e6" stroke="#1b2a55" stroke-width="1.6"/><path d="M22 34h20" stroke="#b9b2a0" stroke-width="1.2"/><path d="M32 6c7 8 8 13 5 17-1.4 2-5.6 2-7 0-3-4-2-9 2-17z" fill="url(#wrF)" stroke="#1b2a55" stroke-width="1.4" stroke-linejoin="round"/><path d="M32 14c2.4 3 3 5 1.8 7-.6 1-2.8 1-3.6 0-1-2 0-4 1.8-7z" fill="#fff6c8"/><path d="M32 24v3" stroke="#1b2a55" stroke-width="1.6" stroke-linecap="round"/>`);
})();

/* ---------- Die Editionen ---------- */
const ED_REIHE = ["weihnachten", "ostern", "pfingsten", "reformation"];
const EDITIONEN = {
  weihnachten: { name: "Weihnachten", adj: "Weihnachts", ges: "w", farbe: "#ff5a6e", sym: WEIH_FLOCKE, fragen: WEIH_FRAGEN, thema: "Advent und Weihnachten", zeit: "1. Advent bis 8. Januar" },
  ostern: { name: "Ostern", adj: "Oster", ges: "o", farbe: "#f2c14e", sym: ED_OSTER_SYM, fragen: OSTER_FRAGEN, thema: "Passah, Kreuz und Auferstehung", zeit: "3 Wochen vor bis 10 Tage nach Ostern" },
  pfingsten: { name: "Pfingsten", adj: "Pfingst", ges: "p", farbe: "#ff8a3d", sym: ED_PFINGST_SYM, fragen: PFINGST_FRAGEN, thema: "Pfingsten und den Heiligen Geist", zeit: "24 Tage vor bis 7 Tage nach Pfingsten" },
  reformation: { name: "Reformation", adj: "Reformations", ges: "r", farbe: "#ff6f7d", sym: ED_REFO_SYM, fragen: REFORMATIONS_FRAGEN, thema: "die Reformation", zeit: "15. Oktober bis 14. November" }
};
const edAdj = id => EDITIONEN[id] ? EDITIONEN[id].adj : "";

/* ---------- Kalender ---------- */
/* Ostersonntag (gregorianisch) als Tagesnummer */
function edOstern(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31), tag = ((h + l - 7 * m + 114) % 31) + 1;
  return dayNum(`${y}-${monat}-${tag}`);
}
/* 1. Advent: der vierte Sonntag vor dem 25. Dezember */
function edErsterAdvent(y) {
  const t25 = dayNum(`${y}-12-25`), wt = new Date(Date.UTC(y, 11, 25)).getUTCDay();
  return t25 - (wt === 0 ? 7 : wt) - 21;
}
/* Zeitraum einer Edition im Jahr y: {von, bis} als Tagesnummern (bis einschließlich) */
function edZeitraum(id, y) {
  if (id === "weihnachten") return { von: edErsterAdvent(y), bis: dayNum(`${y + 1}-1-8`), jahr: y };
  if (id === "ostern") { const o = edOstern(y); return { von: o - 21, bis: o + 10, jahr: y }; }
  if (id === "pfingsten") { const p = edOstern(y) + 49; return { von: p - 24, bis: p + 7, jahr: y }; }
  if (id === "reformation") return { von: dayNum(`${y}-10-15`), bis: dayNum(`${y}-11-14`), jahr: y };
  return null;
}
const edJahrVon = t => datumVon(t).getFullYear();
/* Zeitraum, in dem der Tag t liegt – sonst null */
function edFensterBei(id, t) {
  const y = edJahrVon(t);
  for (const j of [y - 1, y]) { const z = edZeitraum(id, j); if (z && t >= z.von && t <= z.bis) return z; }
  return null;
}
/* Nächster Zeitraum ab Tag t (für die Anzeige im Postkasten) */
function edNaechstes(id, t) {
  const y = edJahrVon(t);
  for (const j of [y - 1, y, y + 1]) { const z = edZeitraum(id, j); if (z && z.bis >= t) return z; }
  return null;
}
/* Heutiger Tag – auf localhost zum Testen mit ?edDatum=2027-03-20 */
function edHeute() {
  try {
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
      const t = new URLSearchParams(location.search).get("edDatum") || sessionStorage.getItem("bq-ed-datum");
      if (t && /^\d{4}-\d{1,2}-\d{1,2}$/.test(t)) { sessionStorage.setItem("bq-ed-datum", t); return t; }
    }
  } catch (e) {}
  return today();
}
const edTag = () => dayNum(edHeute());

/* ---------- Aktiv: nach Datum, oder für den Entwickler als Vorschau ---------- */
const ED_VORSCHAU_KEY = "bq-ed-vorschau";
function edVorschauListe() { try { const o = JSON.parse(localStorage.getItem(ED_VORSCHAU_KEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
const edVorschau = id => { try { return typeof entwickler !== "undefined" && !!entwickler && !!edVorschauListe()[id]; } catch (e) { return false; } };
function edVorschauSetzen(id, an) { try { const o = edVorschauListe(); if (an) o[id] = 1; else delete o[id]; localStorage.setItem(ED_VORSCHAU_KEY, JSON.stringify(o)); } catch (e) {} }
const edAktivDatum = id => !!edFensterBei(id, edTag());
const edAktiv = id => !!EDITIONEN[id] && (edAktivDatum(id) || edVorschau(id));
const edNurVorschau = id => edVorschau(id) && !edAktivDatum(id);
const edListe = () => ED_REIHE.filter(edAktiv);
/* Gewählter Modus im Reiter Biblionär: undefined = automatisch (die Edition nach Datum ist vorgewählt), null = Klassisch */
let edModus;
function edGewaehlt() {
  const l = edListe(); if (!l.length) return null;
  if (edModus === undefined) return l.find(edAktivDatum) || null;
  return l.includes(edModus) ? edModus : null;
}

/* ---------- Fragen ---------- */
/* Pool einer Edition zu einem Zeitpunkt (ms): Wellen w öffnen sich Woche für Woche ab Beginn des Zeitraums.
   Außerhalb des Zeitraums (Vorschau des Entwicklers) sind alle Fragen frei. Duelle rechnen mit dem Zeitpunkt der Herausforderung. */
function edPool(id, ms) {
  const E = EDITIONEN[id]; if (!E) return null;
  const t = dayNum(dstr(new Date(ms || Date.now()))), z = edFensterBei(id, t);
  const woche = z ? Math.floor((t - z.von) / 7) + 1 : 99;
  return E.fragen.filter(q => (q.w || 1) <= woche);
}
/* Edition eines Duells (alte Weihnachts-Duelle: opt.w = 1) */
const duEdition = d => (d && d.opt && (EDITIONEN[d.opt.e] ? d.opt.e : d.opt.w ? "weihnachten" : null)) || null;
const edOpt = id => id ? (id === "weihnachten" ? { w: 1 } : { e: id }) : null;
const edSym = id => EDITIONEN[id] ? EDITIONEN[id].sym : "";
/* Kleine Marke für Duelle einer Edition in allen Listen (Arena, Biblionär) */
const edMarke = d => { const id = duEdition(d); if (!id) return ""; const E = EDITIONEN[id];
  return `<i class="weih-marke ed-marke ed-${id}" title="${esc(E.adj)}-Duell">${E.sym}<span>${esc(E.name)}</span></i>`; };

/* ---------- Schalter im Reiter Biblionär ---------- */
function edSchalterHtml() {
  const l = edListe(); if (!l.length) return "";
  const g = edGewaehlt();
  const knopf = id => { const E = EDITIONEN[id];
    return `<button role="radio" aria-checked="${g === id}" data-ed="${id}"${id === "weihnachten" ? ' data-wm="1"' : ""}>${E.sym}${esc(E.name)}${edNurVorschau(id) ? `<small class="ed-test">Test</small>` : ""}</button>`; };
  return `<div class="weih-schalter ed-schalter" role="radiogroup" aria-label="Biblionär-Ausgabe" style="grid-template-columns:repeat(${l.length + 1},minmax(0,1fr))">${l.map(knopf).join("")}<button role="radio" aria-checked="${!g}" data-ed="">${svg("biblionaer")}Klassisch</button></div>`;
}
function edSchalterWire(neu) {
  screen.querySelectorAll("[data-ed]").forEach(b => b.onclick = () => { SFX.tap(); edModus = b.dataset.ed || null; neu(); });
}

/* ---------- Schnee nur für Weihnachten ---------- */
function weihDeko(an) {
  an = !!an; document.body.classList.toggle("weih-an", an);
  let el = document.getElementById("weihSchnee");
  if (!an) { if (el) el.remove(); return; }
  if (el) return;
  let r = 7; const z = () => (r = (r * 16807) % 2147483647) / 2147483647;
  el = document.createElement("div"); el.id = "weihSchnee"; el.setAttribute("aria-hidden", "true"); let h = "";
  for (let k = 0; k < 40; k++) {
    const gr = 2 + z() * 4.5, dauer = 9 + z() * 10, stil = `left:${(z() * 100).toFixed(1)}%;opacity:${(.45 + z() * .5).toFixed(2)};animation-duration:${dauer.toFixed(1)}s;animation-delay:-${(z() * dauer).toFixed(1)}s;--dx:${(z() * 60 - 30).toFixed(0)}px;`;
    h += z() < .2 ? WEIH_FLOCKE.replace("<svg ", `<svg style="${stil}width:${(gr * 3).toFixed(0)}px;height:${(gr * 3).toFixed(0)}px" `) : `<i style="${stil}width:${gr.toFixed(1)}px;height:${gr.toFixed(1)}px"></i>`;
  }
  el.innerHTML = h; document.body.appendChild(el);
}

/* ---------- Biblionär der Woche in einer Edition (eine Runde je Woche des Zeitraums, für alle dieselben Fragen) ---------- */
function edRunde(id) {
  const t = edTag(), z = edFensterBei(id, t);
  if (!z) return edVorschau(id) ? { r: 1, key: "vorschau", start: t, vorschau: true } : null;
  const r = Math.floor((t - z.von) / 7) + 1;
  return { r, key: `${id}-${z.jahr}-${r}`, start: z.von + 7 * (r - 1), vorschau: false };
}
function edRundeName(id, r) {
  if (id === "weihnachten") return r <= 4 ? `${r}. Advent` : r === 5 ? "Weihnachtswoche" : "Epiphanias";
  return `${r}. Woche`;
}
const edWocheGespielt = R => !!R && !R.vorschau && (S.edBib || {})[R.key] !== undefined;
const edWochePunkte = R => R ? (S.edBib || {})[R.key] | 0 : 0;
function edWocheStarten(id) {
  const E = EDITIONEN[id], R = edRunde(id);
  if (!R) { toast(`${svg("biblionaer")}<div><b>Die ${esc(E.adj)}-Runden sind vorbei</b></div>`); return; }
  if (edWocheGespielt(R)) { toast(`${E.sym}<div><b>Diese Woche schon gespielt</b><div class="small muted">Nächste Woche gibt es neue Fragen.</div></div>`); return; }
  modal(`<div class="label">${esc(E.adj)}-Biblionär der Woche</div><h2 style="margin:0">${esc(edRundeName(id, R.r))}</h2>
    <p class="muted">15 Fragen rund um ${esc(E.thema)} – für alle in der Gemeinde dieselben. Du hast <b>einen Versuch pro Woche</b>; wer abbricht, bekommt 0 Punkte. Zusätzlich gibt es ${ED_BIB_TAL} Talente.${R.vorschau ? " <b>(Vorschau: ohne Belohnung)</b>" : ""}</p>
    <button class="btn primary" data-close="los">${svg("biblionaer")} Los geht's</button><button class="btn ghost" data-close>Später</button>`, x => { if (x === "los") edWocheLos(id); });
}
function edWocheLos(id) {
  const R = edRunde(id); if (!R || edWocheGespielt(R)) return;
  if (!R.vorschau) { S.edBib = Object.assign({}, S.edBib, { [R.key]: 0 }); save(); }
  go("biblionaer");
  const pool = edPool(id, datumVon(R.start).getTime());
  const G = { modus: "edwoche", ed: id, weih: id === "weihnachten", edKey: R.key, edR: R.r, vorschau: R.vorschau, fragen: bibFragen(hash("ed|" + R.key), "", pool, null, id) };
  countdown(() => bibStart(G), { weih: G.weih });
}

/* ---------- Zusammenführen mit einem anderen Gerät: je Runde der höhere Wert ---------- */
function edMischen(r) {
  const a = S.edBib = Object.assign({}, S.edBib || {});
  Object.entries((r && r.edBib) || {}).forEach(([k, v]) => { a[k] = Math.max(a[k] | 0, v | 0); });
}

/* ---------- Postkasten (nur Entwickler): Editionen vorab einschalten ---------- */
function edVorschauModal() {
  const t = edTag(), datum = n => datumVon(n).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" });
  const zeile = id => { const E = EDITIONEN[id], z = edFensterBei(id, t) || edNaechstes(id, t), an = edVorschau(id), live = edAktivDatum(id);
    return `<button class="pf2-zeile pf2-k ed-vz" data-edv="${id}" aria-pressed="${an}"><span class="pf2-ic ed-vz-ic">${E.sym}</span><span class="pf2-tx"><b>${esc(E.name)}</b><small>${live ? "läuft gerade für alle" : z ? `${datum(z.von)} – ${datum(z.bis)}` : ""} · ${E.fragen.length} Fragen</small></span><small class="pf3-w">${live ? "aktiv" : an ? "Vorschau an" : "aus"}</small></button>`; };
  const m = modal(`<div class="label">Entwickler</div><h2 style="margin:0">Sondereditionen</h2>
    <p class="small muted" style="margin:0">Vorschau nur auf diesem Gerät: Die Edition erscheint im Reiter Biblionär, alle Fragen sind frei, es gibt keine Belohnungen. Für alle anderen startet sie erst im Zeitraum.</p>
    <div class="ed-vz-liste">${ED_REIHE.map(zeile).join("")}</div>
    <button class="btn primary" data-close>Fertig</button>`);
  m.querySelectorAll("[data-edv]").forEach(b => b.onclick = () => { SFX.tap(); const id = b.dataset.edv; edVorschauSetzen(id, !edVorschau(id)); m.remove(); edVorschauModal(); });
}
