/* 10.52: Schätzfrage der Woche (Michaels Plan vom 23.11.2026)
   - Jeden Montag 7 Uhr eine Frage (Zahl aus der Bibel oder mit klarem Bibelbezug), schätzen bis Sonntag 20 Uhr – einmal, nicht änderbar.
   - Bis zur Auflösung sieht man nur, WIE VIELE geschätzt haben. Die Antwort steht nicht im Code, sondern in schaetzantwort/{wk}
     (die Firebase-Regel gibt sie erst nach dem Ende frei). Ausgewertet wird vom Sammel-Job (job/sammeln.mjs, szWertung) bzw. vom Verwalter.
   - Auflösung: Podest (gleicher Abstand = gleicher Platz, alle gewinnen), Gemeinde-Schätzung (Median), Liste aller Schätzungen mit Namen.
   - Preise: Platz 1/2/3 Gold-/Silber-/Bronzekrug (S.szPreise → smPreisZahl) + 30/20/10 Talente, Platz 1 eine Woche Titel „Schätzmeister“;
     +2 Manna fürs Mitmachen, +3 Manna innerhalb von 10 %. Testfragen (Beta) ohne Preise.
   - Live ab Mo 7.12.2026 07:00 (SZ_START), Beta sofort. Ankündigung „Infografik“ einmal je Spieler, NEU an der Kachel bis 20.12. */
const SZ_START = Date.UTC(2026, 11, 7, 6, 0, 0), SZ_NEU_BIS = Date.UTC(2026, 11, 20, 19, 0, 0);
const SZ_TALENTE = [0, 30, 20, 10], SZ_MANNA_DABEI = 2, SZ_MANNA_NAH = 3, SZ_NAH = 0.1;
const szLokal = () => typeof BQ_UHR !== "undefined" && BQ_UHR.lokal;
const szFrei = () => (typeof BETA !== "undefined" && BETA) || szLokal() || Date.now() >= SZ_START;
const szTestErlaubt = () => (typeof BETA !== "undefined" && BETA) || szLokal();
/* Fragen der nächsten Wochen – nur Frage und Einheit (die Antworten trägt der Verwalter im Postkasten ein, sie stehen nie im Code) */
const SZ_FRAGEN = {
  "2026-W50": { f: "Wie alt wurde Methusalah?", e: "Jahre" },
  "2026-W51": { f: "Wie viele Menschen waren mit Paulus auf dem Schiff, das vor Malta Schiffbruch erlitt?", e: "Personen" },
  "2026-W52": { f: "Wie weit ist es von Nazareth nach Bethlehem – den Weg gingen Josef und Maria? (Luftlinie)", e: "km" },
  "2026-W53": { f: "In wie vielen Tagen wurde die Mauer Jerusalems unter Nehemia fertig gebaut?", e: "Tage" },
  "2027-W01": { f: "Wie weit ist Rom von Jerusalem entfernt? Paulus kam als Gefangener nach Rom. (Luftlinie)", e: "km" },
  "2027-W02": { f: "Wie viele Lieder dichtete König Salomo?", e: "Lieder" },
  "2027-W03": { f: "Wie viele große Fische zogen die Jünger nach der Auferstehung ans Ufer?", e: "Fische" },
  "2027-W04": { f: "Über wie viele Provinzen herrschte König Ahasveros zur Zeit von Ester?", e: "Provinzen" }
};
const SZ_SYM = (g = 54) => `<svg class="sz-sym" viewBox="0 0 64 64" width="${g}" height="${g}" aria-hidden="true"><defs><radialGradient id="szG${g}" cx=".4" cy=".35"><stop offset="0" stop-color="#fff6dc"/><stop offset=".6" stop-color="#f2c14e"/><stop offset="1" stop-color="#b9822a"/></radialGradient></defs><circle cx="32" cy="32" r="29" fill="#1b2a55"/><circle cx="32" cy="32" r="25" fill="url(#szG${g})" stroke="#1b2a55" stroke-width="2"/><circle cx="32" cy="32" r="17" fill="#ff9f5a" stroke="#1b2a55" stroke-width="2"/><circle cx="32" cy="32" r="9" fill="url(#szG${g})" stroke="#1b2a55" stroke-width="2"/><circle cx="32" cy="32" r="3" fill="#1b2a55"/><path d="M44 8l-10 21" stroke="#1b2a55" stroke-width="4" stroke-linecap="round"/><path d="M44 8l-10 21" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M42 5l6 1 1 6-5-1z" fill="#fff" stroke="#1b2a55" stroke-width="1.5"/><path d="M14 20q3-6 9-8" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/></svg>`;
const szZahl = n => (n == null || !Number.isFinite(+n) ? "–" : Math.round(+n).toLocaleString("de-DE"));
const szIni = n => String(n || "?").trim().split(/\s+/).map(w => w[0] || "").join("").slice(0, 2).toUpperCase() || "?";
const SZ_FARBEN = ["#7a5cc8", "#3c8ac8", "#c85c7a", "#4ab08a", "#c8a24a", "#4ab0c8", "#8a7ac8", "#c87a4a", "#5c8ac8", "#a85cc8"];
const szFarbe = id => SZ_FARBEN[Math.abs(typeof hash === "function" ? hash(String(id)) : String(id).length) % SZ_FARBEN.length];
const SZ_TAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
function szZeitText(ms0) { try { const d = BQ_UHR.wand(ms0); return `${SZ_TAGE[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}., ${d.getHours()}${d.getMinutes() ? ":" + String(d.getMinutes()).padStart(2, "0") : ""} Uhr`; } catch (e) { return ""; } }
function szRestText(ende) { const t = ende - Date.now(); if (t <= 0) return "beendet"; const h = t / 36e5; return h >= 24 ? `noch ${Math.floor(h / 24)} ${Math.floor(h / 24) === 1 ? "Tag" : "Tage"}` : h >= 1 ? `noch ${Math.floor(h)} Std.` : `noch ${Math.max(1, Math.ceil(t / 60000))} Min.`; }
/* deutsche Uhrzeit → UTC-Millisekunden (Winter-/Sommerzeit über Intl) */
function szBerlin(y, mo, d, h) {
  const g = Date.UTC(y, mo - 1, d, h, 0, 0);
  const t = +new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hour: "numeric", hourCycle: "h23" }).formatToParts(new Date(g)).find(x => x.type === "hour").value;
  let off = (t - h); if (off < -12) off += 24; if (off > 12) off -= 24; return g - off * 36e5;
}
/* Start (Mo 7 Uhr) und Ende (So 20 Uhr) einer Kalenderwoche „2026-W50“ */
function szWocheZeiten(wk) {
  const m = /^(\d{4})-W(\d{2})$/.exec(wk); if (!m) return null;
  const y = +m[1], w = +m[2], j4 = new Date(Date.UTC(y, 0, 4)), mo = new Date(j4.getTime() - ((j4.getUTCDay() + 6) % 7) * 864e5 + (w - 1) * 7 * 864e5), so = new Date(mo.getTime() + 6 * 864e5);
  return { start: szBerlin(mo.getUTCFullYear(), mo.getUTCMonth() + 1, mo.getUTCDate(), 7), ende: szBerlin(so.getUTCFullYear(), so.getUTCMonth() + 1, so.getUTCDate(), 20) };
}
/* dieselbe Wertung wie im Sammel-Job (job/sammeln.mjs) */
function szWertung(f, a, liste) {
  const A = Math.round(+a.a || 0);
  const l = (liste || []).filter(x => x && typeof x.pid === "string" && Number.isFinite(+x.w))
    .map(x => ({ pid: x.pid, name: String(x.name || "?").slice(0, 20), w: Math.round(+x.w), z: +x.z || 0 })).map(x => ({ ...x, d: Math.abs(x.w - A) }))
    .sort((p, q) => p.d - q.d || p.z - q.z);
  let pl = 0, vor = -1; l.forEach(x => { if (x.d !== vor) { pl++; vor = x.d; } x.pl = pl; });
  const ws = l.map(x => x.w).sort((p, q) => p - q), n = ws.length;
  const med = n ? (n % 2 ? ws[(n - 1) / 2] : Math.round((ws[n / 2 - 1] + ws[n / 2]) / 2)) : null;
  return { f: f.f || "", e: f.e || "", t: !!f.t, a: A, s: a.s || "", i: a.i || "", n, med, l: JSON.stringify(l.map(x => [x.pid, x.name, x.w, x.d, x.pl])) };
}

/* ---------- Zustand: aktuelle Frage, eigene Schätzung, Anzahl, Ergebnis (sparsam zwischengespeichert) ---------- */
const SZ_LS = "bq-sz";
function szLs(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(SZ_LS + k) || "null"); localStorage.setItem(SZ_LS + k, JSON.stringify(v)); } catch (e) { return null; } }
function szS() { if (!S.sz || typeof S.sz !== "object") S.sz = {}; return S.sz; }  /* S.sz = { wk: Schätzung } */
let szLaedt = null;
async function szListeHolen(frisch) {
  const c = szLs("-liste"); if (!frisch && c && Date.now() - c.t < 20 * 60000) return c.l;
  const L = window.LB; if (!L || !L.ok || !L.szListe) return c ? c.l : [];
  if (szLaedt) return szLaedt;
  szLaedt = L.szListe(Date.now() - 4 * 864e5).then(l => { szLs("-liste", { t: Date.now(), l }); return l; }).catch(() => (c ? c.l : [])).finally(() => { szLaedt = null; });
  return szLaedt;
}
/* aktuelle Frage (läuft) bzw. zuletzt beendete – Testfragen nur in der Beta */
function szWahl(l) {
  const j = Date.now(), ok = (l || []).filter(f => f && (!f.t || szTestErlaubt()) && (f.t || f.start >= SZ_START || szTestErlaubt()));
  const lauf = ok.filter(f => f.start <= j && j < f.ende).sort((a, b) => a.ende - b.ende)[0];
  if (lauf) return { f: lauf, lauf: true };
  const fertig = ok.filter(f => f.ende <= j).sort((a, b) => b.ende - a.ende)[0];
  return fertig ? { f: fertig, lauf: false } : null;
}
async function szAnzahlHolen(wk, frisch) {
  const c = szLs("-n-" + wk); if (!frisch && c && Date.now() - c.t < 10 * 60000) return c.n;
  try { const n = await window.LB.szAnzahl(wk); szLs("-n-" + wk, { t: Date.now(), n }); return n; } catch (e) { return c ? c.n : null; }
}
async function szMeineHolen(wk) {
  const s = szS(); if (s[wk] != null) return s[wk];
  const gefragt = szLs("-m-" + wk + "-" + S.pid); if (gefragt) return null;
  try { const w = await window.LB.szMeine(wk, S.pid); szLs("-m-" + wk + "-" + S.pid, 1); if (w != null) { s[wk] = w; save(); } return w; } catch (e) { return null; }
}
async function szErgebnisHolen(wk) {
  const c = szLs("-e-" + wk); if (c && c.e) return c.e;
  if (c && Date.now() - c.t < 5 * 60000) return null;
  try { const e = await window.LB.szErgebnis(wk); szLs("-e-" + wk, { t: Date.now(), e }); return e; } catch (e) { return null; }
}
const szListe = e => { try { return JSON.parse(e.l || "[]").map(([pid, name, w, d, pl]) => ({ pid, name, w, d, pl })); } catch (x) { return []; } };

/* ---------- Preise ---------- */
function szLohnPruefen(wk, e) {
  if (!e || e.t || !S.pid || gesperrt) return;
  if (!Array.isArray(S.szLohn)) S.szLohn = [];
  if (S.szLohn.includes(wk)) return;
  const ich = szListe(e).find(x => x.pid === S.pid); if (!ich) { S.szLohn = [...S.szLohn, wk].slice(-60); save(); return; }
  S.szLohn = [...S.szLohn, wk].slice(-60);
  const teile = [];
  if (ich.pl <= 3) {
    S.szPreise = [...new Set([...(S.szPreise || []), wk + ":" + ich.pl])].slice(-60);
    addTal(SZ_TALENTE[ich.pl]); teile.push(["Gold", "Silber", "Bronze"][ich.pl - 1] + "krug", SZ_TALENTE[ich.pl] + " Talente");
    if (ich.pl === 1) { const fr = szLs("-liste"), f = fr && (fr.l || []).find(x => x.wk === wk); S.szTitelBis = Math.max(+S.szTitelBis || 0, ((f && f.ende) || Date.now()) + 7 * 864e5); teile.push("Titel „Schätzmeister“"); }
  }
  let m = mannaPlus(SZ_MANNA_DABEI); if (e.a > 0 && ich.d <= e.a * SZ_NAH) m += mannaPlus(SZ_MANNA_NAH);
  if (m) teile.push(m + " Manna");
  save(); renderHud(); try { if (typeof smHud === "function") smHud(0); lbSync(); } catch (x) {}
  const titel = ich.pl === 1 ? "Platz 1 – Schätzmeister!" : ich.pl <= 3 ? `Platz ${ich.pl}!` : "Danke fürs Mitschätzen!";
  setTimeout(() => {
    if (ich.pl <= 3) { try { SFX.badge(); rain(ich.pl === 1 ? 90 : 40); } catch (x) {} }
    toast(`${SZ_SYM(34)}<div><b>${titel}</b><div class="small muted">${teile.join(" · ") || "Schätzfrage der Woche"}</div></div>`);
  }, 600);
}
function szTitelPruefen() {
  if (S.title === "schaetzmeister" && Date.now() >= (+S.szTitelBis || 0)) { S.title = "none"; save(); try { renderHud(); lbSync(true); } catch (e) {} }
}
const szTitelFrei = () => Date.now() < (+S.szTitelBis || 0);
if (typeof TITEL !== "undefined" && !TITEL.some(t => t.id === "schaetzmeister"))
  TITEL.push({ id: "schaetzmeister", name: "Schätzmeister", price: -1, need: "sz-meister", bezug: "Wer einen Turm bauen will, setzt sich zuerst hin und überschlägt die Kosten (Lukas 14,28 sinngemäß). Platz 1 der Schätzfrage der Woche – gilt eine Woche." });

/* ---------- 10.53: Medaillon-Reihe unter den Tagesaufgaben (Advent · Schätzfrage · Biblionär der Woche) ----------
   Leuchtender goldener Ring + rote Zahl, solange dort etwas wartet; grau mit Haken, wenn erledigt. */
/* 10.60: Info-Leiste IN der Kopfzeile neben der Truhe (Michaels Wahl „C“): Feste (Advent, Ostern …), Wochenspiele (Schätzfrage,
   Biblionär der Woche) und Sonderthemen (Bibeljahr). Nur was laut Termin gerade läuft. Zu viele Einträge → seitlich wischen, Punkte zeigen die Seiten.
   Reihenfolge: Wartendes (rote Zahl/NEU) zuerst, dann nach ord, Erledigtes (grau) am Ende. Ohne Einträge bleibt die Truhe breit. */
function evReihe() {
  let r = screen.querySelector(".ev-reihe"); if (r) return r;
  r = document.createElement("div"); r.className = "ev-reihe ev-wart"; r.setAttribute("aria-label", "Aktionen");
  const kopf = screen.querySelector(".start-aufg"); if (kopf) kopf.appendChild(r); else screen.prepend(r);
  setTimeout(evFertig, 1500);  /* spätestens dann zeigen, auch wenn die Schätzfrage noch lädt */
  return r;
}
function evFertig() {
  const r = screen.querySelector(".ev-reihe"); if (!r || current !== "home") return;
  const w = x => x.classList.contains("grau") ? 2 : x.querySelector(".ev-zahl,.ev-neu") ? 0 : 1;
  [...r.children].sort((a, c) => (w(a) - w(c)) || (+a.dataset.ord - +c.dataset.ord)).forEach(x => r.appendChild(x));
  r.classList.remove("ev-wart");
  const k = r.closest(".start-aufg"); if (k) { k.classList.toggle("ev-da", r.children.length > 0); k.dataset.n = Math.min(5, r.children.length); } /* 10.63: Darstellung je nach Anzahl */
  r.scrollLeft = 0; evPunkte(); r.onscroll = evPunkte;
}
function evPunkte() {
  const r = screen.querySelector(".start-aufg .ev-reihe"), k = r && r.closest(".start-aufg"); if (!k) return;
  let p = k.querySelector(".ev-punkte");
  const n = Math.ceil((r.scrollWidth - 4) / Math.max(1, r.clientWidth));
  r.classList.toggle("am-ende", r.scrollLeft + r.clientWidth >= r.scrollWidth - 4);
  if (n < 2) { if (p) p.remove(); return; }
  if (!p) { p = document.createElement("div"); p.className = "ev-punkte"; p.setAttribute("aria-hidden", "true"); k.appendChild(p); }
  const akt = Math.round(r.scrollLeft / Math.max(1, r.scrollWidth - r.clientWidth) * (n - 1));
  p.innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i === akt ? "an" : ""}"></i>`).join("");
}
function evSetzen(id, o) {
  if (current !== "home") return;
  const r = evReihe(); let b = r.querySelector(`[data-ev="${id}"]`);
  if (!b) { b = document.createElement("button"); b.dataset.ev = id; r.appendChild(b); }
  b.className = "ev-m" + (o.grau ? " grau" : ""); b.style.setProperty("--c", o.farbe || "#f2c14e"); b.dataset.ord = o.ord || 9;
  /* 10.64: Restzeit in die rote Bubble („noch 5 Tage“ → „5 T“), damit unter der Plakette kein Text mehr in den Bogen läuft; eine Zahl (z. B. Türchen) bleibt */
  const tage = !o.grau && (!o.zahl || o.zahl === "!") && /noch (\d+) Tag/.exec(o.sub || ""); if (tage) o = Object.assign({}, o, { zahl: tage[1] + " T", lang: true });
  b.innerHTML = `<span class="ev-ring"><span class="ev-in">${o.sym}</span></span>${o.zahl ? `<span class="ev-zahl${o.lang ? " lang" : ""}">${esc(o.zahl)}</span>` : o.grau ? `<span class="ev-ok">✓</span>` : ""}${o.neu ? `<span class="ev-neu">NEU</span>` : ""}<b>${esc(o.titel)}</b><small>${esc(o.sub || "")}</small>`;
  b.setAttribute("aria-label", `${o.titel}: ${o.sub || ""}${o.zahl ? " – wartet" : ""}`);
  b.onclick = () => { SFX.tap(); o.klick(); };
  [...r.children].sort((a, c) => (+a.dataset.ord) - (+c.dataset.ord)).forEach(x => r.appendChild(x));
  if (!r.classList.contains("ev-wart")) evFertig();
}
function bibEv() {
  if (!S.lbName || S.offlineOnly || current !== "home" || typeof bibWocheGespielt !== "function") return;
  const pause = typeof bwPause === "function" && bwPause(), neuAufl = pause && bibAufloesungFaellig();
  const fertig = !neuAufl && (pause || bibWocheGespielt()), n = bibWocheTage();
  /* 10.54: offen → direkt zur Wochenrunde; Sonntag 20 Uhr bis Montag 7 Uhr: Auflösung (Animation) bzw. die Sieger */
  evSetzen("bib", { ord: 3, farbe: "#66e0d0", sym: `<img src="icons/biblionaer-logo.webp" alt="" width="48" height="46">`, titel: "Biblionär",
    sub: neuAufl ? "Auflösung!" : pause ? "Sieger ✓" : fertig ? "der Woche ✓" : `noch ${n} ${n === 1 ? "Tag" : "Tage"}`, zahl: fertig ? "" : "!", grau: fertig,
    klick: () => neuAufl ? bibAufloesungPruefen(true).catch(() => {}) : (typeof bibWocheStarten === "function" ? bibWocheStarten() : go("bib")) });
}

/* ---------- Startseite: Kachel ---------- */
async function szKachel() {
  if (!szFrei() || !S.lbName || S.offlineOnly || current !== "home") return;
  const w = szWahl(await szListeHolen()); if (!w || current !== "home") return;
  const f = w.f, meine = await szMeineHolen(f.wk);
  let e = null; if (!w.lauf) { e = await szErgebnisHolen(f.wk); if (e) szLohnPruefen(f.wk, e); }
  if (!w.lauf && Date.now() - f.ende > 3 * 864e5) return;  /* alte Auflösung nur 3 Tage zeigen */
  const n = w.lauf ? await szAnzahlHolen(f.wk) : null;
  if (current !== "home" || screen.querySelector(".sz-kachel")) return;
  const ich = e ? szListe(e).find(x => x.pid === S.pid) : null, neu = (BETA || Date.now() < SZ_NEU_BIS);
  /* 10.53: als Medaillon */
  { const wartet = w.lauf ? meine == null : !!(e && !(S.szGesehen || []).includes(f.wk));
    evSetzen("sz", { ord: 2, farbe: "#ff9f5a", sym: SZ_SYM(46), titel: "Schätzfrage",
      sub: w.lauf ? (meine == null ? szRestText(f.ende) : "der Woche ✓") : e ? (wartet ? "Auflösung!" : ich ? `Platz ${ich.pl} ✓` : "der Woche ✓") : "wird ausgewertet",
      zahl: wartet ? "!" : "", grau: !wartet, neu, klick: () => go("schaetz") });
    return; }
  const b = document.createElement("button"); b.className = "sz-kachel" + (w.lauf && meine == null ? " offen" : !w.lauf && e ? " gold" : "");
  const zeile = w.lauf ? (meine == null ? `<span class="sz-chip o">⏳ ${szRestText(f.ende)}</span>${n != null ? `<span class="sz-chip">👥 ${n} ${n === 1 ? "hat" : "haben"} geschätzt</span>` : ""}`
      : `<span class="sz-chip">Auflösung ${szZeitText(f.ende)}</span>`)
    : e ? `<span class="sz-chip o">Jetzt ansehen ›</span>` : `<span class="sz-chip">Wird gerade ausgewertet …</span>`;
  const text = w.lauf ? (meine == null ? esc(f.f) : `Deine Schätzung: <b>${szZahl(meine)} ${esc(f.e)}</b> ✓`) : e ? (ich ? `Du bist auf <b>Platz ${ich.pl}</b>${ich.pl <= 3 ? " " + ["🥇", "🥈", "🥉"][ich.pl - 1] : ""}` : `Die Antwort: <b>${szZahl(e.a)} ${esc(e.e)}</b>`) : esc(f.f);
  b.innerHTML = `${neu ? `<span class="pl-neu sz-neu">NEU</span>` : ""}${SZ_SYM(48)}<span class="sz-k-t"><b>${!w.lauf && e ? "Auflösung ist da!" : "Schätzfrage der Woche"}${f.t ? " · Test" : ""}</b><span class="sz-k-f">${text}</span><span class="sz-k-z">${zeile}</span></span>`;
  b.onclick = () => { SFX.tap(); go("schaetz"); };
  const kopf = screen.querySelector(".start-aufg"); if (kopf) kopf.insertAdjacentElement("afterend", b); else screen.prepend(b);
}

/* ---------- Ansicht „schaetz“: schätzen · warten · Auflösung ---------- */
VIEWS.schaetz = () => {
  if (!szFrei()) { go("home"); return; }
  screen.innerHTML = `${backBtn("home", "Start")}<div class="sz-seite"><div class="sz-kopf">${SZ_SYM(52)}<div><h1 class="sz-h">Schätzfrage der Woche</h1><div class="sz-sub" id="szSub">wird geladen …</div></div></div><div id="szInhalt"><div class="card small muted">Einen Moment …</div></div></div>`;
  wireGo();
  szSeiteFuellen().catch(() => { const x = $("szInhalt"); if (x) x.innerHTML = `<div class="card small muted">Die Schätzfrage konnte nicht geladen werden – bitte kurz mit dem Internet verbinden.</div>`; });
};
async function szSeiteFuellen() {
  if (!S.lbName || S.offlineOnly) { $("szInhalt").innerHTML = `<div class="card small muted">Mitschätzen geht nur mit Eintrag in der Rangliste.</div>`; $("szSub").textContent = ""; return; }
  const w = szWahl(await szListeHolen(true)); if (current !== "schaetz") return;
  if (!w) { $("szSub").textContent = "Jeden Montag ab 7 Uhr eine neue Frage"; $("szInhalt").innerHTML = `<div class="card sz-leer">${SZ_SYM(64)}<p>Gerade läuft keine Schätzfrage.<br>Die nächste kommt am <b>Montag um 7 Uhr</b>.</p></div>`; return; }
  const f = w.f, kw = f.t ? "Testfrage" : "KW " + (+f.wk.slice(6) || "");
  if (w.lauf) {
    $("szSub").textContent = `${kw} · Auflösung ${szZeitText(f.ende)}`;
    const meine = await szMeineHolen(f.wk), n = await szAnzahlHolen(f.wk, true); if (current !== "schaetz") return;
    if (meine != null) { szWartenZeigen(f, meine, n); return; }
    $("szInhalt").innerHTML = `<div class="card sz-karte"><div class="sz-frage">${esc(f.f)}</div><span class="sz-einh">in ${esc(f.e)}</span>
      <label class="sz-feld"><input id="szWert" inputmode="numeric" autocomplete="off" placeholder="0" aria-label="Deine Schätzung in ${esc(f.e)}"><i>${esc(f.e)}</i></label>
      <button class="btn primary sz-los" id="szLos" disabled>Schätzung abgeben</button><p class="sz-hinw">Kann danach nicht mehr geändert werden.</p></div>
      <p class="sz-wer">👥 ${n != null ? `${n} ${n === 1 ? "hat" : "haben"} schon geschätzt` : "Wer schon geschätzt hat"} – was, siehst du ${f.t ? "bei der Auflösung" : "am Sonntag um 20 Uhr"}.</p>`;
    const inp = $("szWert"), los = $("szLos");
    const lesen = () => { const z = String(inp.value).replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 10); return z ? Math.min(1e9, +z) : null; };
    inp.oninput = () => { const v = lesen(); inp.value = v == null ? "" : szZahl(v); los.disabled = v == null; };
    inp.onkeydown = ev => { if (ev.key === "Enter" && !los.disabled) los.click(); };
    los.onclick = () => { const v = lesen(); if (v == null) return; SFX.tap();
      modal(`<div class="sz-sicher">${SZ_SYM(56)}<h2>Sicher?</h2><p>Deine Schätzung: <b>${szZahl(v)} ${esc(f.e)}</b></p><p class="small muted">Danach kannst du sie nicht mehr ändern.</p><button class="btn primary" data-close="ja">Abgeben</button><button class="btn ghost" data-close="">Noch ändern</button></div>`,
        async a => { if (a !== "ja") return; await szAbgeben(f, v); }); };
    setTimeout(() => { try { inp.focus(); } catch (e) {} }, 300);
    return;
  }
  $("szSub").textContent = `${kw} · aufgelöst ${szZeitText(f.ende)}`;
  const e = await szErgebnisHolen(f.wk); if (current !== "schaetz") return;
  if (!e) { $("szInhalt").innerHTML = `<div class="card sz-leer">${SZ_SYM(64)}<p>Die Schätzungen werden gerade ausgewertet.<br><span class="small muted">Spätestens in einer halben Stunde ist die Auflösung da.</span></p></div>`; return; }
  const ersteMal = !(S.szGesehen || []).includes(f.wk);
  if (ersteMal) { S.szGesehen = [...(S.szGesehen || []), f.wk].slice(-30); save(); rvSchaetz(f, e, () => szLohnPruefen(f.wk, e)); }
  else szLohnPruefen(f.wk, e);
  $("szSub").textContent = `${kw} · aufgelöst ${szZeitText(f.ende)} · ${e.n} ${e.n === 1 ? "Schätzung" : "Schätzungen"}`;
  $("szInhalt").innerHTML = szAufloesungHtml(e);
}
async function szAbgeben(f, v) {
  const L = window.LB; if (!L || !L.ok || !L.szAbgeben || gesperrt) return;
  if (Date.now() >= f.ende) { toast(`<div>Die Schätzfrage ist schon beendet.</div>`); go("schaetz"); return; }
  try { await L.szAbgeben(f.wk, S.pid, S.lbName, v); }
  catch (e) {
    if (e && e.code === "permission-denied") { const m = await L.szMeine(f.wk, S.pid).catch(() => null); if (m != null) { szS()[f.wk] = m; save(); go("schaetz"); return; } }
    toast(`${svg("nein")}<div><b>Das hat nicht geklappt.</b><div class="small muted">${Date.now() >= f.ende ? "Die Zeit ist abgelaufen." : "Bitte gleich noch einmal versuchen."}</div></div>`); return;
  }
  szS()[f.wk] = v; save(); szLs("-n-" + f.wk, null);
  try { SFX.coin(); } catch (e) {}
  toast(`${SZ_SYM(34)}<div><b>Schätzung abgegeben!</b><div class="small muted">${szZahl(v)} ${esc(f.e)} · Auflösung ${szZeitText(f.ende)}</div></div>`);
  go("schaetz");
}
function szWartenZeigen(f, meine, n) {
  $("szInhalt").innerHTML = `<div class="card sz-karte sz-warten"><div class="sz-frage">${esc(f.f)}</div>
    <div class="sz-deine"><small>Deine Schätzung</small><b>${szZahl(meine)}</b><i>${esc(f.e)}</i></div>
    <p class="sz-hinw">Festgelegt ✓ · Auflösung ${szZeitText(f.ende)} (${szRestText(f.ende)})</p></div>
    <p class="sz-wer">👥 ${n != null ? `${n} ${n === 1 ? "hat" : "haben"} geschätzt` : "Die anderen schätzen noch"} – was, bleibt bis zur Auflösung geheim.</p>`;
}
function szAufloesungHtml(e) {
  const l = szListe(e), ich = l.find(x => x.pid === S.pid), plN = p => l.filter(x => x.pl === p);
  const av = (x, gr) => `<span class="sz-av${x.pid === S.pid ? " ich" : ""}" style="--c:${szFarbe(x.pid)}${gr ? ";width:" + gr + "px;height:" + gr + "px" : ""}">${esc(szIni(x.name))}</span>`;
  const preis = p => e.t ? "Test – ohne Preise" : p === 1 ? `Goldkrug · ${SZ_TALENTE[1]} T<br>Titel „Schätzmeister“` : p === 2 ? `Silberkrug · ${SZ_TALENTE[2]} T` : `Bronzekrug · ${SZ_TALENTE[3]} T`;
  const platz = p => { const g = plN(p); if (!g.length) return `<div class="sz-p sz-p${p} leer"><div class="sz-r">${p}</div><div class="sz-w">–</div></div>`;
    const namen = g.length > 2 ? `${esc(g[0].name)} u. ${g.length - 1} weitere` : g.map(x => esc(x.name)).join(" &amp; ");
    return `<div class="sz-p sz-p${p}"><div class="sz-avs">${g.slice(0, 3).map(x => av(x, g.length > 1 ? 30 : 34)).join("")}</div><div class="sz-r">${p}</div><div class="sz-n">${namen}</div>
      <div class="sz-w">${g.length > 1 ? g.map(x => szZahl(x.w)).slice(0, 3).join(" / ") + " · je" : szZahl(g[0].w) + " ·"} ± ${szZahl(g[0].d)}</div><div class="sz-krug">${preis(p)}</div></div>`; };
  const dG = e.med == null ? null : Math.abs(e.med - e.a);
  const zeilen = l.map(x => { const med = x.pl <= 3 ? ["🥇", "🥈", "🥉"][x.pl - 1] : x.pl, bw = Math.max(4, 100 - (e.a ? Math.min(100, x.d / Math.max(1, e.a) * 100) : x.d ? 100 : 0));
    return `<div class="sz-li${x.pid === S.pid ? " ich" : ""}"><span class="sz-pl">${med}</span><span><b>${esc(x.name)}</b><span class="sz-bar"><i style="width:${bw}%${x.pl <= 3 ? ";background:#f2c14e" : ""}"></i></span></span><span class="sz-wt">${szZahl(x.w)}</span><span class="sz-ab">${x.d ? "± " + szZahl(x.d) : "genau!"}</span></div>`; });
  if (dG != null) { const i = l.findIndex(x => x.d > dG); const g = `<div class="sz-li sz-gem"><span class="sz-pl">◆</span><span><b>Gemeinde</b><small>Mitte aller Schätzungen</small></span><span class="sz-wt">${szZahl(e.med)}</span><span class="sz-ab">${dG ? "± " + szZahl(dG) : "genau!"}</span></div>`; zeilen.splice(i < 0 ? zeilen.length : i, 0, g); }
  const gemText = dG == null ? "" : dG === 0 ? "Die Mitte aller Schätzungen lag genau richtig!" : l.length && dG <= l[0].d ? `Die Mitte aller Schätzungen lag nur ${szZahl(dG)} ${esc(e.e)} daneben – so gut wie Platz 1!` : `Die Mitte aller Schätzungen lag ${szZahl(dG)} ${esc(e.e)} daneben.`;
  const meinGewinn = ich ? (e.t ? `Du: Platz ${ich.pl} · Testfrage ohne Preise` : `Du: Platz ${ich.pl}${ich.pl <= 3 ? " · " + ["Goldkrug", "Silberkrug", "Bronzekrug"][ich.pl - 1] + ", " + SZ_TALENTE[ich.pl] + " Talente" : ""}, +${SZ_MANNA_DABEI}${e.a > 0 && ich.d <= e.a * SZ_NAH ? "+" + SZ_MANNA_NAH : ""} Manna`) : "Du hast diesmal nicht mitgeschätzt.";
  return `<div class="sz-antw"><small>${esc(e.f)}</small><div class="sz-z">${szZahl(e.a)} <i>${esc(e.e)}</i></div>${e.s ? `<div class="sz-st">${esc(e.s)}</div>` : ""}${e.i ? `<p>${esc(e.i)}</p>` : ""}</div>
    ${l.length ? `<div class="sz-pod">${platz(2)}${platz(1)}${platz(3)}</div>` : `<div class="card small muted">Diesmal hat niemand geschätzt.</div>`}
    ${dG != null ? `<div class="sz-gemz"><span class="sz-d"></span><div><b>Gemeinde-Schätzung: ${szZahl(e.med)}</b><small>${gemText}</small></div></div>` : ""}
    <p class="sz-ich">${meinGewinn}</p>
    ${l.length ? `<div class="sz-lt">Alle Schätzungen</div><div class="sz-liste">${zeilen.join("")}</div>` : ""}`;
}

/* ---------- Ankündigung (Infografik), einmal je Spieler ---------- */
function szAnkuendigen(versuch = 0) {
  const k = BETA ? "szAnkB" : "szAnk";
  if (!szFrei() || S[k] || !S.lbName || S.offlineOnly || gesperrt) return;
  setTimeout(async () => {
    if (S[k] || current !== "home") return;
    if (document.querySelector(".modal, .sm-ov, .sm-tour, .truhe-fx") || document.body.classList.contains("spiel-laeuft")) { if (versuch < 6) szAnkuendigen(versuch + 1); return; }
    const w = szWahl(await szListeHolen()); if (!w || !w.lauf || current !== "home" || document.querySelector(".modal")) return;
    S[k] = 1; save();
    const z = (c, ic, t, p) => `<div class="sz-iz" style="--c:${c}"><span class="sz-iic">${ic}</span><div><b>${t}</b><p>${p}</p></div></div>`;
    const m = modal(`<div class="sz-info"><small class="sz-i-neu">NEU · jede Woche</small>${SZ_SYM(92)}<h2>Schätzfrage der Woche</h2>
      <div class="sz-izl">${z("#ff9f5a", "📅", "Jeden Montag eine Frage", "Eine Zahl aus der Bibel oder mit Bibelbezug – nur schätzen, nicht nachschlagen.")}
      ${z("#7fc8ff", "🔒", "Bis Sonntag 20 Uhr – einmal", "Deine Schätzung ist fest. Was die anderen tippen, bleibt bis zur Auflösung geheim.")}
      ${z("#f2c14e", "🏆", "Auflösung mit Preisen", "Platz 1–3: Gold-, Silber- und Bronzekrug plus Talente, Platz 1 wird <em>Schätzmeister</em>. Mitmachen bringt Manna.")}
      ${z("#5fe0b0", "◆", "Gemeinde-Schätzung", "Wie nah liegt die Mitte aller Schätzungen? Oft erstaunlich nah – zusammen sind wir gut!")}</div>
      <p class="sz-i-vers">„Wer von euch, der einen Turm bauen will, setzt sich nicht zuvor hin und überschlägt die Kosten?“<small>Lukas 14,28</small></p>
      <button class="btn primary" data-close="los">Jetzt schätzen</button><button class="btn ghost" data-close="">Später</button></div>`, a => { if (a === "los") go("schaetz"); });
    m.dataset.frei = "1"; m.classList.add("sz-info-m");
  }, versuch ? 2500 : 4200);
}
/* 10.63: Beim ersten Start zeichnet spiel.js die Startseite, BEVOR sammel.js/advent.js/schaetz.js geladen sind – deren Einträge fehlten dann,
   bis man erneut auf „Start“ tippte (das Neuzeichnen nach dem Datenbank-Start entfällt, solange ein Fenster offen ist). Hier ohne Neuzeichnen nachtragen. */
function evNachtragen() {
  if (current !== "home" || !screen.querySelector(".start-aufg") || screen.querySelector(".ev-reihe")) return;
  try { if (typeof rbEv === "function") rbEv(); } catch (e) {}
  try { if (typeof adBanner === "function") adBanner(); } catch (e) {}
  try { bibEv(); szKachel().catch(() => {}).finally(() => setTimeout(evFertig, 0)); } catch (e) {}
}
setTimeout(evNachtragen, 0);
(function szStart() { const alt = VIEWS.home; VIEWS.home = function (a) { alt(a); try { bibEv(); szTitelPruefen(); szKachel().catch(() => {}).finally(() => setTimeout(evFertig, 0)); szAnkuendigen(); setTimeout(() => bibAufloesungPruefen().catch(() => {}), 1800); } catch (e) {} }; })();
if (typeof TAB_VON !== "undefined") Object.assign(TAB_VON, { schaetz: "home", szverwaltung: "" });

/* ---------- Verwalter: Postkasten → Schätzfragen ---------- */
(function szPostfach() { const alt = VIEWS.postfach; if (!alt) return; VIEWS.postfach = function (a) { alt(a); try { const b = $("pkBeta"); if (b && !$("pkSz")) b.insertAdjacentHTML("afterend", `<button class="pk-pin" id="pkSz" data-go="szverwaltung"><span class="pk-pt"><b>${SZ_SYM(18)} Schätzfragen</b><span class="small muted">Antworten eintragen, Testfrage, auswerten</span></span><span class="pk-pfeil" aria-hidden="true">›</span></button>`); wireGo(); } catch (e) {} }; })();
VIEWS.szverwaltung = () => {
  const L = window.LB; if (!entwickler || !L || !L.ok || !L.szFragenAlle) { go("home"); return; }
  const vorlage = Object.entries(SZ_FRAGEN).map(([wk]) => `${wk} | Antwort | Bibelstelle | kurze Erklärung`).join("\n");
  screen.innerHTML = `${backBtn("postfach", "Postkasten")}<h1>Schätzfragen</h1>
    <div class="card"><b>Fragen der nächsten Wochen</b><div id="szvListe" class="small muted" style="margin-top:6px">wird geladen …</div></div>
    <div class="card"><b>Antworten eintragen</b><p class="small muted" style="margin:4px 0 8px">Je Zeile: <code>Woche | Antwort (nur Zahl) | Bibelstelle | Erklärung</code>. Frage und Einheit kommen aus der App. Start Mo 7 Uhr, Ende So 20 Uhr werden automatisch gesetzt.</p>
      <textarea id="szvText" rows="7" style="width:100%;box-sizing:border-box;font:13px monospace" placeholder="${esc(vorlage)}"></textarea><button class="btn primary" id="szvImport">Übernehmen</button><p class="small" id="szvErg"></p></div>
    <div class="card"><b>Testfrage (nur Beta, ohne Preise)</b>
      <input id="szvTF" placeholder="Frage" style="width:100%;box-sizing:border-box;margin-top:6px" value="Wie viele Bücher hat die Bibel?"><div style="display:flex;gap:6px;margin-top:6px"><input id="szvTE" placeholder="Einheit" value="Bücher" style="flex:1;min-width:0"><input id="szvTA" inputmode="numeric" placeholder="Antwort" value="66" style="flex:1;min-width:0"><input id="szvTM" inputmode="numeric" placeholder="Min." value="15" style="width:60px;min-width:0"></div>
      <input id="szvTS" placeholder="Bibelstelle / Hinweis" style="width:100%;box-sizing:border-box;margin-top:6px" value="Schlachter 2000: 39 + 27 Bücher"><button class="btn" id="szvTest" style="margin-top:6px">Testfrage starten</button><p class="small" id="szvTErg"></p></div>`;
  wireGo();
  const liste = async () => {
    const alle = await L.szFragenAlle().catch(() => []); if (current !== "szverwaltung") return;
    const db = new Map(alle.map(f => [f.wk, f])), j = Date.now();
    const zeilen = [...new Set([...Object.keys(SZ_FRAGEN), ...alle.map(f => f.wk)])].sort().reverse().slice(0, 24).map(wk => { const f = db.get(wk), v = SZ_FRAGEN[wk] || f || {};
      const st = !f ? "⚪ noch nicht eingerichtet" : f.fertig ? "✅ ausgewertet" : f.ende <= j ? `🟠 beendet – <button class="btn mini" data-szausw="${esc(wk)}">Jetzt auswerten</button>` : f.start <= j ? `🟢 läuft bis ${szZeitText(f.ende)} <button class="btn mini ghost" data-szende="${esc(wk)}">Beenden</button>` : `🔵 startet ${szZeitText(f.start)}`;
      return `<div class="sz-vz"><b>${esc(wk)}</b>${f && f.t ? " · Test" : ""} – ${esc(v.f || "")}<br>${st}</div>`; });
    $("szvListe").innerHTML = zeilen.join("") || "Noch keine Fragen.";
    $("szvListe").querySelectorAll("[data-szausw]").forEach(b => b.onclick = async () => { b.disabled = true; try { const t = await szAuswerten(db.get(b.dataset.szausw)); toast(`<div>${esc(t)}</div>`); } catch (e) { toast(`${svg("nein")}<div>${esc(String(e.message || e).slice(0, 120))}</div>`); } liste(); });
    $("szvListe").querySelectorAll("[data-szende]").forEach(b => b.onclick = async () => { b.disabled = true; try { await L.szEndeSetzen(b.dataset.szende, Date.now() + 1000); szLs("-liste", null); } catch (e) { toast(`${svg("nein")}<div>Beenden ging nicht – Firebase-Regeln 10.52 veröffentlicht?</div>`); } setTimeout(liste, 1500); });
  };
  liste();
  $("szvImport").onclick = async () => {
    const aus = [];
    for (const z of $("szvText").value.split(/\n/).map(x => x.trim()).filter(Boolean)) {
      const [wk, a, s, ...i] = z.split("|").map(x => x.trim()), fr = SZ_FRAGEN[wk], zt = szWocheZeiten(wk || ""), zahl = Math.round(+String(a || "").replace(/\./g, "").replace(",", "."));
      if (!fr || !zt) { aus.push(`❌ ${wk}: unbekannte Woche`); continue; }
      if (!Number.isFinite(zahl) || zahl < 0) { aus.push(`❌ ${wk}: Antwort ist keine Zahl`); continue; }
      try { await L.szFrageSetzen(wk, { f: fr.f, e: fr.e, start: zt.start, ende: zt.ende }); await L.szAntwortSetzen(wk, { a: zahl, s: s || "", i: i.join("|") }); aus.push(`✅ ${wk}: ${szZahl(zahl)} ${fr.e}`); }
      catch (e) { aus.push(`❌ ${wk}: ${e.code || e.message} – Firebase-Regeln 10.52 veröffentlicht?`); }
    }
    $("szvErg").innerHTML = aus.join("<br>"); szLs("-liste", null); liste();
  };
  $("szvTest").onclick = async () => {
    const f = $("szvTF").value.trim(), e = $("szvTE").value.trim(), a = Math.round(+$("szvTA").value), min = Math.max(2, Math.min(600, +$("szvTM").value || 15));
    if (!f || !e || !Number.isFinite(a)) { $("szvTErg").textContent = "Frage, Einheit und Antwort ausfüllen."; return; }
    const d = BQ_UHR.wand(Date.now()), wk = `test-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
    try { await L.szFrageSetzen(wk, { f, e, t: true, start: Date.now() - 60000, ende: Date.now() + min * 60000 }); await L.szAntwortSetzen(wk, { a, s: $("szvTS").value.trim(), i: "" });
      $("szvTErg").textContent = `✅ Testfrage läuft ${min} Minuten (bis ${szZeitText(Date.now() + min * 60000)}). In der Beta auf der Startseite oder unter „Schätzfrage“.`; szLs("-liste", null); liste(); }
    catch (x) { $("szvTErg").textContent = `❌ ${x.code || x.message} – Firebase-Regeln 10.52 veröffentlicht?`; }
  };
};
/* Verwalter wertet selbst aus (wenn der Sammel-Job noch nicht gelaufen ist) */
async function szAuswerten(f) {
  const L = window.LB, a = await L.szAntwortHolen(f.wk); if (!a) throw new Error("Für " + f.wk + " fehlt die Antwort.");
  const g = await L.szAlle(f.wk), e = szWertung(f, a, g);
  await L.szErgebnisSetzen(f.wk, e); szLs("-e-" + f.wk, null); szLs("-liste", null);
  return `${f.wk}: ${e.n} Schätzungen ausgewertet`;
}

/* ---------- 10.54: Auflösungs-Animation am Ende der Woche (Schätzfrage der Woche · Biblionär der Woche) ----------
   Vollbild, einmal je Woche und Spieler, jederzeit „Überspringen“. Bei reduzierter Bewegung sofort das Endbild.
   Ablauf: Titel → Antwort/Logo → (Schätzungen fallen auf den Zahlenstrahl) → Podest wächst 3 · 2 · 1 → Krone/Konfetti → eigener Platz. */
const rvRuhig = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
function rvPodest(gruppen, wert) {
  /* gruppen[0..2] = Spieler auf Platz 1..3 (je Liste) */
  const sp = p => { const g = gruppen[p - 1] || []; if (!g.length) return `<div class="rv-p rv-p${p} leer"><div class="rv-sockel"><b>${p}</b></div></div>`;
    const namen = g.length > 2 ? `${esc(g[0].name)} +${g.length - 1}` : g.map(x => esc(x.name)).join(" &amp; ");
    return `<div class="rv-p rv-p${p}"><div class="rv-wer">${p === 1 ? `<span class="rv-krone">👑</span>` : ""}<div class="rv-avs">${g.slice(0, 3).map(x => `<span class="sz-av${x.pid === S.pid ? " ich" : ""}" style="--c:${szFarbe(x.pid)}">${esc(szIni(x.name))}</span>`).join("")}</div><b>${namen}</b><small>${wert(g[0])}</small></div><div class="rv-sockel"><b>${p}</b></div></div>`; };
  return `<div class="rv-pod">${sp(2)}${sp(1)}${sp(3)}</div>`;
}
function rvZeigen(html, fertig, ablauf) {
  if (document.querySelector(".rv-ov")) return;
  const ov = document.createElement("div"); ov.className = "rv-ov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Auflösung");
  ov.innerHTML = `<div class="rv-sterne" aria-hidden="true">${Array.from({ length: 36 }, (_, i) => `<i style="left:${(i * 37) % 100}%;top:${(i * 53) % 100}%;animation-delay:${(i % 7) * .4}s"></i>`).join("")}</div>
    <div class="rv-box">${html}</div><button class="rv-skip" type="button">Überspringen ›</button>`;
  document.body.appendChild(ov);
  const box = ov.querySelector(".rv-box"), uhren = [];
  let zu = false;
  const ende = () => { if (zu) return; zu = true; uhren.forEach(clearTimeout); ov.classList.add("weg"); setTimeout(() => { ov.remove(); try { fertig && fertig(); } catch (e) {} }, 350); };
  const alles = () => { uhren.forEach(clearTimeout); box.classList.add("s1", "s2", "s3", "s4", "s5", "s6"); ov.querySelector(".rv-skip").hidden = true; ablauf.sofort && ablauf.sofort(box); };
  ov.querySelector(".rv-skip").onclick = () => { try { SFX.tap(); } catch (e) {} alles(); };
  box.querySelectorAll("[data-rv-zu]").forEach(b => b.onclick = () => { try { SFX.tap(); } catch (e) {} ende(); });
  if (rvRuhig()) { alles(); return; }
  (ablauf.schritte || []).forEach(([t, fn]) => uhren.push(setTimeout(() => { try { fn(box); } catch (e) {} }, t)));
}
/* Zahl hochzählen (weich abbremsend) */
function rvZaehlen(el, ziel, dauer) {
  if (!el) return; const t0 = performance.now();
  const f = t => { const x = Math.min(1, (t - t0) / dauer), y = 1 - Math.pow(1 - x, 3); el.textContent = szZahl(ziel * y); if (x < 1 && document.body.contains(el)) requestAnimationFrame(f); else el.textContent = szZahl(ziel); };
  requestAnimationFrame(f);
}
function rvSchaetz(f, e, fertig) {
  const l = szListe(e), ich = l.find(x => x.pid === S.pid), gr = [1, 2, 3].map(p => l.filter(x => x.pl === p));
  const werte = [...l.map(x => x.w), e.a, e.med == null ? e.a : e.med], lo = Math.min(...werte), hi = Math.max(...werte), sp = Math.max(1, hi - lo) * 0.08;
  const x = v => ((v - (lo - sp)) / ((hi + sp) - (lo - sp)) * 100).toFixed(1) + "%";
  const punkte = l.map((p, i) => `<i class="rv-pt${p.pid === S.pid ? " ich" : ""}${p.pl <= 3 ? " top" : ""}" style="left:${x(p.w)};--d:${(i * 0.09).toFixed(2)}s"></i>`).join("");
  const kw = f.t ? "Testfrage" : "KW " + (+String(f.wk).slice(6) || "");
  const html = `<small class="rv-kw">${SZ_SYM(30)} Schätzfrage der Woche · ${kw}</small><h2 class="rv-t">Auflösung</h2>
    <p class="rv-f">${esc(e.f)}</p>
    <div class="rv-zahl"><b id="rvZ">0</b> <i>${esc(e.e)}</i></div><div class="rv-st">${esc(e.s || "")}</div>
    ${l.length ? `<div class="rv-strahl"><span class="rv-linie"></span>${punkte}<span class="rv-ziel" style="left:${x(e.a)}"></span>${e.med != null ? `<span class="rv-gem" style="left:${x(e.med)}" title="Gemeinde"></span>` : ""}</div>
    <div class="rv-leg"><span class="a">Antwort</span><span class="g">Gemeinde ${szZahl(e.med)}</span>${ich ? `<span class="d">Du ${szZahl(ich.w)}</span>` : ""}</div>` : ""}
    ${l.length ? rvPodest(gr, g => "± " + szZahl(g.d)) : `<p class="rv-f">Diesmal hat niemand geschätzt.</p>`}
    <p class="rv-ich">${ich ? (ich.pl <= 3 ? `Du bist auf <b>Platz ${ich.pl}</b> ${["🥇", "🥈", "🥉"][ich.pl - 1]}` : `Du bist auf Platz ${ich.pl} – ${szZahl(ich.d)} daneben`) : `${l.length} ${l.length === 1 ? "Spieler hat" : "Spieler haben"} geschätzt`}</p>
    <button class="btn primary rv-los" data-rv-zu>Zur Auflösung</button>`;
  rvZeigen(html, fertig, {
    sofort: b => { const z = b.querySelector("#rvZ"); if (z) z.textContent = szZahl(e.a); },
    schritte: [[100, b => b.classList.add("s1")], [900, b => { b.classList.add("s2"); rvZaehlen(b.querySelector("#rvZ"), e.a, 1700); }],
      [2700, b => { b.classList.add("s3"); try { SFX.level(); } catch (x) {} }], [3500, b => b.classList.add("s4")],
      [4300, b => b.classList.add("s5")], [5100, b => { b.classList.add("s6"); b.closest(".rv-ov").querySelector(".rv-skip").hidden = true; try { SFX.badge(); rain(ich && ich.pl <= 3 ? 110 : 60); } catch (x) {} }]]
  });
}
/* Biblionär der Woche: einmal je Woche für ALLE (wer mitgespielt hat oder nicht), sobald die Vorwoche fertig ist. Danach folgt
   für Platz 1–3 wie bisher die Preisübergabe (bibPreisUebergabe wartet, solange .rv-ov offen ist). */
const bibAufloesungFaellig = () => !!(S.lbName && !S.offlineOnly && typeof bwAufloesWoche === "function" && S.bwRv !== bwAufloesWoche());
async function bibAufloesungPruefen(klick) {
  if (!S.lbName || S.offlineOnly || (current !== "home" && !klick) || gesperrt || typeof bwAufloesWoche !== "function") return;
  const vw = bwAufloesWoche(); if (S.bwRv === vw) return;
  const v = bibVorwocheListe && bibVorwocheListe.wk === vw ? bibVorwocheListe : await bibVorwocheLaden(); if (!v || (current !== "home" && !klick)) return;
  if (!v.rows.length) { S.bwRv = vw; save(); bibSiegerPruefen().catch(() => {}); return; }
  if (document.querySelector(".modal, .sm-ov, .sm-tour, .truhe-fx, .rv-ov, .bwp") || document.body.classList.contains("spiel-laeuft")) { setTimeout(() => bibAufloesungPruefen().catch(() => {}), 4000); return; }
  S.bwRv = vw; save();
  const rows = v.rows.map(r => ({ pid: r.id, name: r.name || "?", p: +r.p || 0 })), stufen = [...new Set(rows.map(r => r.p))];
  rows.forEach(r => { r.pl = stufen.indexOf(r.p) + 1; });
  const gr = [1, 2, 3].map(p => rows.filter(r => r.pl === p)), ich = rows.find(r => r.pid === S.pid), kw = +String(vw).split("-W")[1] || "";
  const html = `<small class="rv-kw">Biblionär der Woche · KW ${kw}</small><div class="rv-logo"><img src="icons/biblionaer-logo.webp" alt="" width="150" height="142"></div>
    <h2 class="rv-t">Die Sieger der Woche</h2><p class="rv-f">${rows.length} ${rows.length === 1 ? "Spieler hat" : "Spieler haben"} mitgespielt – gleiche Fragen für alle.</p>
    ${rvPodest(gr, g => pkt(g.p) + " Punkte")}
    ${rows.length < 3 ? `<p class="rv-hinw">Preise gibt es ab 3 Teilnehmern.</p>` : `<p class="rv-hinw">Preise: Gold-, Silber- und Bronzekrug</p>`}
    <p class="rv-ich">${ich ? (ich.pl <= 3 ? `Du bist auf <b>Platz ${ich.pl}</b> ${["🥇", "🥈", "🥉"][ich.pl - 1]}` : `Du bist auf Platz ${ich.pl} mit ${pkt(ich.p)} Punkten`) : "Diese Woche wieder mitspielen?"}</p>
    <button class="btn primary rv-los" data-rv-zu>${ich && ich.pl <= 3 && rows.length >= 3 ? "Weiter zum Preis" : "Weiter"}</button>`;
  rvZeigen(html, () => { try { bibSiegerPruefen(); if (current === "home") go("home"); } catch (e) {} }, {
    schritte: [[100, b => b.classList.add("s1")], [800, b => { b.classList.add("s2"); try { SFX.level(); } catch (x) {} }], [1900, b => b.classList.add("s3")],
      [2400, b => b.classList.add("s4")], [3200, b => b.classList.add("s5")], [4000, b => { b.classList.add("s6"); b.closest(".rv-ov").querySelector(".rv-skip").hidden = true; try { SFX.badge(); rain(ich && ich.pl <= 3 ? 110 : 60); } catch (x) {} }]]
  });
}
