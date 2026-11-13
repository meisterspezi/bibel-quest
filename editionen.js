/* =====================================================================
   Biblionär – Sondereditionen (Version 9.63, ersetzt advent.js)
   Weihnachten, Ostern, Pfingsten und Reformation: eigener Fragenpool für Solo, Duell und „Biblionär der Woche“.
   Der Schalter im Reiter Biblionär erscheint nur im Zeitraum einer Edition. Der Entwickler kann Editionen
   im Postkasten vorab einschalten (nur auf seinem Gerät, ohne Belohnungen).
   Fragen: editionen-daten.js. Wird vor spiel.js geladen; alles aus spiel.js wird erst beim Aufruf benutzt.
   ===================================================================== */

/* ---------- Symbole (klein, in Listen, Schalter und Spieltitel) ---------- */
/* 9.64: Symbole der Sondereditionen – mehrfarbig, dunkler Umriss wie die übrigen Glanz-Symbole (Verläufe kommen aus edDefs unten) */
const ED_UM = "#1b2a55";
/* Schneeflocke: sechs Arme mit Verzweigungen. voll = mehrfarbig (Eis, weiß, goldener Kern), sonst einfarbig für den fallenden Schnee */
function edFlocke(voll, klasse) {
  const arm = "M12 12V2M12 6.6l-2.1-2.1M12 6.6l2.1-2.1M12 9.6l-1.2-1.2M12 9.6l1.2-1.2";
  let g = "";
  for (let k = 0; k < 6; k++) g += `<g transform="rotate(${k * 60} 12 12)"><path d="${arm}"/></g>`;
  const cls = `weih-fl${klasse ? " " + klasse : ""}`;
  if (!voll) return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${g}</g></svg>`;
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="${ED_UM}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${g}</g>
    <g fill="none" stroke="#f4faff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${g}</g>
    <g fill="none" stroke="#7fbdf5" stroke-width=".9" stroke-linecap="round">${[0, 1, 2, 3, 4, 5].map(k => `<g transform="rotate(${k * 60} 12 12)"><path d="M12 6.6l-2.1-2.1M12 6.6l2.1-2.1"/></g>`).join("")}</g>
    <circle cx="12" cy="12" r="2.3" fill="url(#edgGold)" stroke="${ED_UM}" stroke-width="1"/><circle cx="11.3" cy="11.3" r=".6" fill="#fff"/></svg>`;
}
const WEIH_FLOCKE = edFlocke(false);
const ED_WEIH_SYM = edFlocke(true, "ed-fl ed-fl-weihnachten");
/* Ostern: Golgatha – drei Kreuze auf dem Hügel vor dem Abendhimmel, das mittlere Kreuz (Jesus) größer und golden, kein Tuch */
const ED_OSTER_SYM = `<svg class="weih-fl ed-fl ed-fl-ostern" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="9" fill="url(#edgSun)" opacity=".9"/>
  <path d="M3.9 8.6h1.5v1.9h1.8v1.4H5.4v7.600H3.9v-7.600H2.1v-1.400h1.8z" fill="#d7b46b" stroke="${ED_UM}" stroke-width=".8" stroke-linejoin="round"/><path d="M18.6 8.600h1.500v1.900h1.8v1.400h-1.8v7.600h-1.500v-7.600h-1.8v-1.400h1.8z" fill="#d7b46b" stroke="${ED_UM}" stroke-width=".8" stroke-linejoin="round"/>
  <path d="M10.700 2.400h2.600v3.300h3.300v2.500h-3.300v10.400h-2.600V8.200H7.400V5.700h3.300z" fill="url(#edgGold)" stroke="${ED_UM}" stroke-width="1.1" stroke-linejoin="round"/><path d="M11.600 3.600v13M8.400 6.600h2.300" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".7"/>
  <path d="M0.8 23c3-4.600 7.2-6.2 11.2-6.2S20.2 18.400 23.2 23z" fill="url(#edgHill)" stroke="${ED_UM}" stroke-width="1.1" stroke-linejoin="round"/></svg>`;
/* Pfingsten: dreifarbige Feuerflamme (Apg 2,3) */
const ED_PFINGST_SYM = `<svg class="weih-fl ed-fl ed-fl-pfingsten" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.600 1.5c.9 3.8 6.3 6.5 6.3 12.4a6.9 6.9 0 0 1-13.8 0c0-3 1.600-5.2 3.4-7.2.3 2.2 1.2 3.4 2.5 4.1-.8-3.5-.3-6.9 1.600-9.3z" fill="url(#edgFlameA)" stroke="${ED_UM}" stroke-width="1.3" stroke-linejoin="round"/>
  <path d="M12.2 8.2c.6 2.7 4.2 4.4 4.2 8a4.4 4.4 0 0 1-8.8 0c0-1.9 1-3.2 2.2-4.5.2 1.4.8 2.2 1.600 2.7-.5-2.3-.2-4.5.8-6.2z" fill="url(#edgFlameB)"/>
  <path d="M12 14.3c1.5 1.600 2.3 2.7 2.3 3.9a2.3 2.3 0 0 1-4.600 0c0-1.2.8-2.3 2.3-3.9z" fill="url(#edgFlameC)"/><path d="M8.600 8.8c.8-1.2 1-2.2 1-3" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".6" fill="none"/></svg>`;
/* Reformation: Pergament mit fünf Zeilen (die fünf Solas, rote Anfangsbuchstaben) und rotem Siegel */
const ED_REFO_SYM = `<svg class="weih-fl ed-fl ed-fl-reformation" viewBox="0 0 24 24" aria-hidden="true"><rect x="5.2" y="4" width="13.600" height="15.600" fill="url(#edgParch)" stroke="${ED_UM}" stroke-width="1.2"/>
  <rect x="3.2" y="2" width="17.600" height="3.8" rx="1.9" fill="url(#edgParch)" stroke="${ED_UM}" stroke-width="1.2"/><rect x="3.2" y="18.2" width="17.600" height="3.8" rx="1.9" fill="url(#edgParch)" stroke="${ED_UM}" stroke-width="1.2"/>
  <g stroke-linecap="round" stroke-width="1.1">${[[7.7, 16.8], [9.5, 15.2], [11.3, 16.8], [13.1, 14.2], [14.9, 15.8]].map(([y, x]) => `<path d="M7.4 ${y}h1.3" stroke="#c0262d"/><path d="M9.7 ${y}H${x}" stroke="#5b3a1e"/>`).join("")}</g>
  <circle cx="16.8" cy="16.600" r="2.7" fill="url(#edgRed)" stroke="${ED_UM}" stroke-width="1"/><path d="M16.8 15.2v2.8M15.5 16.2h2.600" stroke="#ffe9a8" stroke-width="1" stroke-linecap="round"/></svg>`;
/* Ausschnitt oben am Rahmen, Stern: bleibt wie in 9.61 */
const WEIH_HAUBE = `<span class="weih-haube" aria-hidden="true"><svg viewBox="0 0 340 20" preserveAspectRatio="none"><path d="M8 12C8 5 14 3 24 3h292c10 0 16 2 16 9 0 4-4 5-7 3s-7-2-10 1-8 4-12 1-9-3-13 0-9 5-14 1-10-2-14 1-10 4-15 0-11-2-15 2-10 3-14-1-10-3-15 1-11 4-16 0-9-3-14 0-10 5-15 1-10-2-14 1-9 4-14 0-9-2-13 1-9 3-13 0-8-2-11 0-9 2-9-3z" fill="#fff"/><path d="M30 6h280" stroke="#dcecff" stroke-width="1.5" stroke-linecap="round" opacity=".7"/></svg></span>`;
const WEIH_STERN = `<svg class="weih-stern ed-emblem-svg" viewBox="0 0 64 64" aria-hidden="true"><defs><radialGradient id="weihSt"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#fff1c2"/><stop offset="1" stop-color="#f2c14e" stop-opacity="0"/></radialGradient><linearGradient id="weihSchweif" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1c2" stop-opacity=".9"/><stop offset="1" stop-color="#f2c14e" stop-opacity="0"/></linearGradient></defs><circle cx="40" cy="22" r="19" fill="url(#weihSt)" opacity=".55"/><path d="M38 24C26 34 14 46 4 60c14-8 28-14 38-30z" fill="url(#weihSchweif)"/><path d="M40 2l3.2 16.8L58 22l-14.8 3.2L40 42l-3.2-16.8L22 22l14.8-3.2z" fill="#fff8dc" stroke="#f2c14e" stroke-width="1" stroke-linejoin="round"/><path d="M40 12l1.600 8.400L50 22l-8.400 1.600L40 32l-1.600-8.400L30 22l8.400-1.600z" fill="#fff"/><circle cx="40" cy="22" r="2" fill="#f2c14e"/></svg>`;
(function () {
  const W = inner => `<svg x="0" y="0" width="24" height="24" viewBox="0 0 64 64" overflow="visible" class="wr wr-lohn"><ellipse cx="32" cy="61" rx="17" ry="2.2" fill="#000" opacity=".3"/>${inner}</svg>`;
  ICONS.kerze = W(`<rect x="22" y="26" width="20" height="32" rx="4" fill="#f6f1e6" stroke="#1b2a55" stroke-width="1.6"/><path d="M22 34h20" stroke="#b9b2a0" stroke-width="1.2"/><path d="M32 6c7 8 8 13 5 17-1.4 2-5.6 2-7 0-3-4-2-9 2-17z" fill="url(#wrF)" stroke="#1b2a55" stroke-width="1.4" stroke-linejoin="round"/><path d="M32 14c2.4 3 3 5 1.8 7-.6 1-2.8 1-3.6 0-1-2 0-4 1.8-7z" fill="#fff6c8"/><path d="M32 24v3" stroke="#1b2a55" stroke-width="1.6" stroke-linecap="round"/>`);
})();

/* ---------- Die Editionen ---------- */
const ED_REIHE = ["weihnachten", "ostern", "pfingsten", "reformation"];
const EDITIONEN = {
  weihnachten: { name: "Weihnachten", adj: "Weihnachts", ges: "w", farbe: "#ff5a6e", sym: ED_WEIH_SYM, fragen: WEIH_FRAGEN, thema: "Advent und Weihnachten", zeit: "1. Advent bis 6. Januar" },
  ostern: { name: "Ostern", adj: "Oster", ges: "o", farbe: "#f2c14e", sym: ED_OSTER_SYM, fragen: OSTER_FRAGEN, thema: "Passah, Kreuz und Auferstehung", zeit: "Karwoche und Osterwoche", runden: 2 },
  pfingsten: { name: "Pfingsten", adj: "Pfingst", ges: "p", farbe: "#ff8a3d", sym: ED_PFINGST_SYM, fragen: PFINGST_FRAGEN, thema: "Pfingsten und den Heiligen Geist", zeit: "1 Woche vor bis 1 Woche nach Pfingsten", runden: 2 },
  reformation: { name: "Reformation", adj: "Reformations", ges: "r", farbe: "#ff6f7d", sym: ED_REFO_SYM, fragen: REFORMATIONS_FRAGEN, thema: "die Reformation", zeit: "1 Woche vor bis 1 Woche nach dem Reformationstag", runden: 2, ab: 2027 }
};
/* Leuchtfarbe der Ausgabe (Countdown, Spielbildschirme) */
const edFarbe = id => ({ weihnachten: "#bfe3ff", ostern: "#ffd166", pfingsten: "#ff7a2e", reformation: "#ff5f6a" })[id] || "#f2c14e";
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
  /* 9.64: Weihnachten vom 1. Advent bis 6. Januar. Ostern: Karwoche + Osterwoche (Palmsonntag bis Samstag nach Ostern, Karfreitag liegt dazwischen).
     Pfingsten und Reformation: je 1 Woche vor und nach Pfingstsonntag bzw. Reformationstag (31. Oktober). Reformation erst ab 2027 (E.ab). */
  const E = EDITIONEN[id]; if (!E || (E.ab && y < E.ab)) return null;
  if (id === "weihnachten") return { von: edErsterAdvent(y), bis: dayNum(`${y + 1}-1-6`), jahr: y };
  if (id === "ostern") { const o = edOstern(y); return { von: o - 7, bis: o + 6, jahr: y }; }
  if (id === "pfingsten") { const p = edOstern(y) + 49; return { von: p - 7, bis: p + 7, jahr: y }; }
  if (id === "reformation") { const r = dayNum(`${y}-10-31`); return { von: r - 7, bis: r + 7, jahr: y }; }
  return null;
}
const edJahrVon = t => datumVon(t).getFullYear();
/* Runde (1…n) einer Edition am Tag t: kurze Zeiträume haben höchstens E.runden Runden, ein überstehender Tag zählt zur letzten */
const edRundeNr = (id, z, t) => { const r = Math.floor((t - z.von) / 7) + 1, m = EDITIONEN[id].runden; return m ? Math.min(r, m) : r; };
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
  /* kurze Zeiträume (Runden = E.runden): die Fragenwellen 1–4 verteilen sich auf die Runden, die letzte Runde hat alle */
  const woche = z ? (E.runden ? Math.ceil(edRundeNr(id, z, t) * 4 / E.runden) : Math.floor((t - z.von) / 7) + 1) : 99;
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
/* 9.64: Ab vier Knöpfen (nur beim Vorab-Testen) zeigt nur der gewählte seinen Namen, die anderen nur das Symbol – nichts bricht um.
   „Test“ ist ein kleiner Punkt oben rechts am Knopf und verändert die Breite nicht. */
function edSchalterHtml() {
  const l = edListe(); if (!l.length) return "";
  const g = edGewaehlt(), dicht = l.length >= 3;
  const knopf = id => { const E = EDITIONEN[id], an = g === id;
    return `<button role="radio" aria-checked="${an}" data-ed="${id}"${id === "weihnachten" ? ' data-wm="1"' : ""} aria-label="${esc(E.name)}">${E.sym}<span class="ed-n">${esc(E.name)}</span>${edNurVorschau(id) ? `<small class="ed-test">Test</small>` : ""}</button>`; };
  const alle = [...l, ""];
  return `<div class="weih-schalter ed-schalter${dicht ? " dicht" : ""}" role="radiogroup" aria-label="Biblionär-Ausgabe" style="grid-template-columns:${alle.map(id => !dicht ? "minmax(0,1fr)" : `minmax(0,${(g || "") === id ? "2.2fr" : "1fr"})`).join(" ")}">${l.map(knopf).join("")}<button role="radio" aria-checked="${!g}" data-ed="" aria-label="Klassisch">${svg("biblionaer")}<span class="ed-n">Klassisch</span></button></div>`;
}
function edSchalterWire(neu) {
  screen.querySelectorAll("[data-ed]").forEach(b => b.onclick = () => { SFX.tap(); edModus = b.dataset.ed || null; neu(); });
}

/* ---------- Verläufe für die Symbole (einmal im Dokument, damit url(#…) überall greift) ---------- */
const ED_DEFS = (function () {
  const lg = (id, st, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${st.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
  const defs = lg("edgGold", [[0, "#fff6d2"], [.5, "#f2c14e"], [1, "#b8862a"]]) + lg("edgSun", [[0, "#fff3b0"], [1, "#ff9a2e"]]) + lg("edgGreen", [[0, "#b9f27c"], [1, "#2f8f26"]]) + lg("edgHill", [[0, "#9a7a4a"], [1, "#4a3420"]])
    + lg("edgPurple", [[0, "#d2b4ff"], [1, "#6a3dbd"]]) + lg("edgFlameA", [[0, "#ffb02e"], [1, "#e8321c"]]) + lg("edgFlameB", [[0, "#fff07a"], [1, "#ff8a1f"]])
    + lg("edgFlameC", [[0, "#ffffff"], [1, "#ffe066"]]) + lg("edgParch", [[0, "#fff8e0"], [1, "#e2c27d"]]) + lg("edgRed", [[0, "#ff8f8f"], [1, "#b01f28"]]);
  return defs;
})();
(function () {
  const defs = ED_DEFS;
  const el = () => { if (document.getElementById("edDefs")) return; const d = document.createElement("div"); d.id = "edDefs"; d.setAttribute("aria-hidden", "true"); d.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    d.innerHTML = `<svg width="0" height="0" focusable="false"><defs>${defs}</defs></svg>`; document.body.insertBefore(d, document.body.firstChild); };
  if (document.body) el(); else document.addEventListener("DOMContentLoaded", el);
})();

/* ---------- Stimmung der Ausgabe: Schnee, Lichtfunken, Glut, Flugblätter + Farben (body.ed-an.ed-<id>) ---------- */
function weihDeko(an) { edDeko(an ? "weihnachten" : null); }
const ED_TEILCHEN = {
  weihnachten: z => { const gr = 2 + z() * 4.5; return { gr, html: z() < .2 ? WEIH_FLOCKE : null, kl: "dk-schnee", dauer: 9 + z() * 10, dx: z() * 60 - 30 }; },
  ostern: z => ({ gr: 2 + z() * 3.2, html: z() < .12 ? ED_FUNKE : null, kl: "dk-licht", dauer: 12 + z() * 12, dx: z() * 40 - 20 }),
  pfingsten: z => ({ gr: 2 + z() * 3.4, html: z() < .16 ? ED_FLAMMCHEN : null, kl: "dk-glut", dauer: 7 + z() * 8, dx: z() * 70 - 35 }),
  reformation: z => ({ gr: 3 + z() * 1.8, html: z() < .55 ? ED_BLATT : null, kl: "dk-blatt", dauer: 12 + z() * 12, dx: z() * 90 - 45 })
};
const ED_FUNKE = `<svg class="ed-teil" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 0l1.200 3.800L10 5 6.200 6.200 5 10 3.800 6.200 0 5l3.800-1.200z" fill="#fff4c2"/></svg>`.replace("1.200", "1.2").replace("3.800", "3.8").replace("6.200", "6.2");
const ED_FLAMMCHEN = `<svg class="ed-teil" viewBox="0 0 10 14" aria-hidden="true"><path d="M5.400 0C6 3 9.600 5 9.600 9a4.600 4.600 0 0 1-9.200 0c0-2 1-3.400 2.200-4.800.2 1.400.8 2.200 1.600 2.700C3.600 4.600 4 2 5.400 0z" fill="#ff8a1f"/><path d="M5 8c1 1.100 1.600 1.900 1.600 2.700a1.600 1.600 0 0 1-3.200 0C3.400 9.900 4 9.100 5 8z" fill="#ffe066"/></svg>`.replace(/(\d)\.(\d)00/g, "$1.$2");
const ED_BLATT = `<svg class="ed-teil" viewBox="0 0 10 13" aria-hidden="true"><rect x=".5" y=".5" width="9" height="12" rx="1" fill="#f5e6bd" stroke="#b08a4a" stroke-width=".8"/><path d="M2.200 3.500h5.600M2.200 5.600h4.600M2.200 7.700h5.600M2.200 9.800h3.400" stroke="#7a5a2e" stroke-width=".8" stroke-linecap="round"/></svg>`.replace(/(\d)\.(\d)00/g, "$1.$2");
function edDeko(id) {
  const b = document.body, alt = [...b.classList].filter(c => c === "ed-an" || c === "weih-an" || /^ed-(weihnachten|ostern|pfingsten|reformation)$/.test(c));
  let el = document.getElementById("weihSchnee");
  if (!id || !ED_TEILCHEN[id]) { alt.forEach(c => b.classList.remove(c)); if (el) el.remove(); return; }
  if (el && el.dataset.ed === id && b.classList.contains("ed-" + id)) return;
  alt.forEach(c => b.classList.remove(c)); if (el) el.remove();
  b.classList.add("ed-an", "ed-" + id); if (id === "weihnachten") b.classList.add("weih-an");
  let r = 7; const z = () => (r = (r * 16807) % 2147483647) / 2147483647;
  el = document.createElement("div"); el.id = "weihSchnee"; el.dataset.ed = id; el.className = "dk-" + id; el.setAttribute("aria-hidden", "true"); let h = "";
  for (let k = 0, anz = id === "reformation" ? 22 : 40; k < anz; k++) {
    const t = ED_TEILCHEN[id](z), stil = `left:${(z() * 100).toFixed(1)}%;opacity:${(.45 + z() * .5).toFixed(2)};animation-duration:${t.dauer.toFixed(1)}s;animation-delay:-${(z() * t.dauer).toFixed(1)}s;--dx:${t.dx.toFixed(0)}px;`;
    h += t.html ? t.html.replace("<svg ", `<svg style="${stil}width:${(t.gr * (id === "weihnachten" ? 3 : 2.4)).toFixed(0)}px;height:${(t.gr * (id === "weihnachten" ? 3 : 2.4)).toFixed(0)}px" `)
      : `<i style="${stil}width:${t.gr.toFixed(1)}px;height:${t.gr.toFixed(1)}px"></i>`;
  }
  el.innerHTML = h; b.appendChild(el);
}

/* ---------- Kopf der Ausgabe: Zeile unter „Biblionär“ wechselt zwischen dem Namen der Ausgabe und Bibelbezug (eine Zeile, keine Höhenänderung) ---------- */
const ED_ZEILEN = {
  weihnachten: ["Lukas 2 · Geburt in Bethlehem", "Lukas 1 · Der Engel und Maria", "Matthäus 2 · Stern und Weise", "Lukas 2 · Hirten auf dem Feld", "Micha 5 · Aus Bethlehem", "Jesaja 7 · Gott mit uns", "Matthäus 1 · Josefs Traum"],
  ostern: ["Matthäus 21 · Der Einzug", "Lukas 22 · Das Abendmahl", "Johannes 19 · Dornenkrone", "Matthäus 27 · Das Grab", "Johannes 20 · Das leere Grab", "Lukas 24 · Weg nach Emmaus", "Markus 16 · Auferstanden"],
  pfingsten: ["Apg 1,8 · Kraft empfangen", "Apg 2,2 · Brausen vom Himmel", "Apg 2,3 · Zungen wie von Feuer", "Apg 2,4 · Vom Geist erfüllt", "Apg 2,6 · Fremde Sprachen", "Apg 2,14 · Petrus predigt", "Apg 2,41 · 3000 getauft"],
  reformation: ["Sola scriptura · Allein die Schrift", "Sola fide · Allein durch den Glauben", "Sola gratia · Allein aus Gnade", "Solus Christus · Allein Christus", "Soli Deo gloria · Gott allein die Ehre"]
};
function edKopfZeile(id) {
  const E = EDITIONEN[id], l = ED_ZEILEN[id] || [], n = Math.min(l.length, 5), t = edTag(), tag = l.length ? ((t % l.length) + l.length) % l.length : 0;
  const z = l.length ? Array.from({ length: n }, (_, i) => l[(tag + i) % l.length]) : [];
  return `<span class="ed-sub" style="--n:${z.length + 1}"><b>Die ${esc(E.adj)}-Ausgabe</b>${z.map((x, i) => `<em style="animation-delay:${((i + 1) * 4)}s">${esc(x)}</em>`).join("")}</span>`;
}
/* Zeichen oben rechts im Kopf (wie der Stern der Weihnachts-Ausgabe) */
const ED_EMBLEM = {
  weihnachten: () => WEIH_STERN,
  ostern: () => `<span class="ed-emblem ed-emblem-ostern" aria-hidden="true">${ED_OSTER_SYM.replace('class="weih-fl ed-fl ed-fl-ostern"', 'class="ed-emblem-svg"')}</span>`,
  pfingsten: () => `<span class="ed-emblem ed-emblem-pfingsten" aria-hidden="true"><svg class="ed-emblem-svg" viewBox="0 0 64 64"><defs><radialGradient id="edgGlut"><stop offset="0" stop-color="#ffd27a" stop-opacity=".85"/><stop offset="1" stop-color="#ff6a1f" stop-opacity="0"/></radialGradient></defs><circle cx="32" cy="38" r="26" fill="url(#edgGlut)"/>
    ${[["M32 4c2.400 9 15.600 15.600 15.600 29.200a15.600 15.600 0 0 1-31.200 0c0-7 3.800-12 8-16.800.6 5.200 2.800 8 6 9.600-1.800-8.200-.6-16.400 1.600-22z", 1], ["M12 26c1.400 5 8.600 8.600 8.600 16a8.600 8.600 0 0 1-17.200 0c0-3.800 2-6.600 4.4-9.200.4 2.800 1.400 4.4 3.200 5.200-1-4.4-.4-8.800 1-12z", .72], ["M52 26c1.400 5 8.600 8.600 8.600 16a8.600 8.600 0 0 1-17.200 0c0-3.800 2-6.600 4.4-9.200.4 2.800 1.400 4.4 3.200 5.200-1-4.4-.4-8.800 1-12z", .72]].map(([d, o], i) => `<path d="${d}" fill="url(#edgFlameA)" stroke="${ED_UM}" stroke-width="1.6" stroke-linejoin="round" opacity="${o === 1 ? 1 : .95}"/>`).join("")}
    <path d="M32 21c1.600 6 10 10 10 18a10 10 0 0 1-20 0c0-4.600 2.600-7.800 5.400-10.600.4 3 1.600 4.800 3.600 5.800-1.200-4.800-.8-9.400 1-13.200z" fill="url(#edgFlameB)"/><path d="M32 38c3.400 3.600 5 6 5 8.600a5 5 0 0 1-10 0c0-2.600 1.600-5 5-8.600z" fill="url(#edgFlameC)"/></svg></span>`,
  reformation: () => `<span class="ed-emblem ed-emblem-reformation" aria-hidden="true">${ED_REFO_SYM.replace('class="weih-fl ed-fl ed-fl-reformation"', 'class="ed-emblem-svg"')}</span>`
};
const edEmblem = id => ED_EMBLEM[id] ? ED_EMBLEM[id]() : "";

/* ---------- Oberkante der Spielen-Kachel (statt der Schneehaube): Palmwedel, Feuerzungen, Pergamentrolle ---------- */
function edHaube(id) {
  const ln = f => `<span class="weih-haube ed-haube" aria-hidden="true"><svg viewBox="0 0 340 20" preserveAspectRatio="none">${f}</svg></span>`;
  if (id === "ostern") {
    let g = `<path d="M4 15.5h332" stroke="#2f6f22" stroke-width="2.4" stroke-linecap="round"/>`;
    for (let x = 6; x < 334; x += 9) { const h = (x / 9 | 0) % 2 ? 5 : 1.5, d = (x / 9 | 0) % 3 === 0 ? -1 : 1;
      g += `<path d="M${x} 15.5Q${x + 3 * d} ${h + 4} ${x + 7 * d} ${h}Q${x + 7 * d} ${h + 8} ${x} 15.5z" fill="url(#edgGreen)" stroke="#1d5a14" stroke-width=".7" stroke-linejoin="round"/>`; }
    return ln(g + `<path d="M150 15.5h40" stroke="#f2c14e" stroke-width="3" stroke-linecap="round"/>`);
  }
  if (id === "pfingsten") {
    let g = "";
    for (let x = 6; x < 336; x += 15) { const h = (x / 15 | 0) % 2 ? 6 : 0;
      g += `<path d="M${x} 17.5C${x - 5} 12 ${x - 2} ${6 + h} ${x} ${h}C${x + 1.5} ${5 + h} ${x + 7} 8 ${x + 6} 13C${x + 5.5} 16 ${x + 3} 17.5 ${x} 17.5z" fill="url(#edgFlameA)" stroke="${ED_UM}" stroke-width=".7" stroke-linejoin="round"/><path d="M${x + 1} 17c-2-2.600-.5-5.400 1-7 .8 2.800 3.200 4.4 1.800 7z" fill="url(#edgFlameB)"/>`; }
    return ln(g);
  }
  if (id === "reformation") {
    return ln(`<path d="M10 4h320a6 6 0 0 1 0 12H10A6 6 0 0 1 10 4z" fill="url(#edgParch)" stroke="${ED_UM}" stroke-width="1"/><path d="M10 4a6 6 0 0 0 0 12" fill="none" stroke="#a9812f" stroke-width="1.2"/><path d="M330 4a6 6 0 0 1 0 12" fill="none" stroke="#a9812f" stroke-width="1.2"/><path d="M26 8h288M26 12h288" stroke="#c9a45a" stroke-width=".9" opacity=".7"/><circle cx="170" cy="10" r="4.4" fill="url(#edgRed)" stroke="${ED_UM}" stroke-width=".9"/><path d="M170 7.800v4.4M167.800 10h4.4" stroke="#ffe9a8" stroke-width="1" stroke-linecap="round"/>`);
  }
  return "";
}
/* Symbole als Hintergrundbild (Kappen der Medaillons, Trenner unter dem Kopf) – Rest der Gestaltung steht in index.html */
(function () {
  const uri = (sym, w) => `url("data:image/svg+xml,${encodeURIComponent(sym.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/(<svg[^>]*>)/, `$1<defs>${ED_DEFS}</defs>`))}")`;
  const kachel = (inner, w, h) => uri(`<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${inner}</svg>`);
  const T = {
    ostern: kachel(`<path d="M8 1.200v8.600M4.600 3.800h6.800" stroke="#f2c14e" stroke-width="1.700" stroke-linecap="round"/>`, 16, 11),
    pfingsten: kachel(`<path d="M7 10.5c-3.500-2-2-5-.4-6.600.4 1.600 1.200 2.300 2.200 2.800 1 1.200.6 3.400-1.800 3.800z" fill="#ff7a2e"/><path d="M7 10.5c-1.300-1-.8-2.600 0-3.400.6 1 1.700 1.600.9 3.200z" fill="#ffe066"/>`, 14, 11),
    reformation: kachel(`<circle cx="7" cy="3.800" r="2.300" fill="#e6c98a" stroke="#7a5a2e" stroke-width=".8"/><path d="M7 6.100v4" stroke="#b9945a" stroke-width="1.200" stroke-linecap="round"/>`, 14, 11)
  }, K = {
    ostern: uri(ED_OSTER_SYM), pfingsten: uri(ED_PFINGST_SYM), reformation: uri(ED_REFO_SYM)
  };
  let css = "";
  for (const id of ["ostern", "pfingsten", "reformation"].filter(x => T[x])) {
    const w = id === "ostern" ? 16 : 14;
    css += `body.ed-${id} .weih-kopf .bk-kopf::after{height:12px;border-bottom:0;background:${T[id]} 0 0/${w}px 11px repeat-x,linear-gradient(90deg,transparent,var(--edc),transparent) 0 100%/100% 2px no-repeat;opacity:.95}`;
    css += `.zv2-buehne.ed-${id} .zv2-ring::before{content:"";position:absolute;left:50%;top:-9px;width:20px;height:20px;margin-left:-10px;background:${K[id]} center/contain no-repeat;filter:drop-shadow(0 1px 2px #0009);z-index:3}`;
  }
  const st = document.createElement("style"); st.id = "edStil"; st.textContent = css; document.head.appendChild(st);
})();

/* ---------- Biblionär der Woche in einer Edition (eine Runde je Woche des Zeitraums, für alle dieselben Fragen) ---------- */
function edRunde(id) {
  const t = edTag(), z = edFensterBei(id, t);
  if (!z) return edVorschau(id) ? { r: 1, key: "vorschau", start: t, vorschau: true } : null;
  const r = edRundeNr(id, z, t);
  return { r, key: `${id}-${z.jahr}-${r}`, start: z.von + 7 * (r - 1), vorschau: false };
}
function edRundeName(id, r) {
  if (id === "weihnachten") return r <= 4 ? `${r}. Advent` : r === 5 ? "Weihnachtswoche" : "Epiphanias";
  if (id === "ostern") return r === 1 ? "Karwoche" : "Osterwoche";
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
  countdown(() => bibStart(G), { weih: G.weih, ed: id });
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
