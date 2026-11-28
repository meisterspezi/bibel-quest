// Bibelbuch-Quest – Sammel-Job (9.56). Läuft alle 30 Minuten über GitHub Actions (.github/workflows/sammeln.yml).
//
// 1) Sammel-Rangliste: Statt dass jedes Gerät alle Spieler-Dokumente einzeln liest (500 Spieler = 500 Lesezugriffe je Abruf),
//    fasst dieser Job alle Spieler in wenigen Dokumenten rangliste/spieler-<n> zusammen. Die App liest nur noch diese.
//    – Normaler Lauf: nur Spieler, die sich seit dem letzten Lauf geändert haben (wenige Lesezugriffe).
//    – Einmal am Tag (oder mit VOLL=ja): alles neu lesen – entfernt gelöschte und zusammengeführte Spieler.
// 2) Aufräumen (einmal am Tag): alte XP-Protokolle, Duelle, Schatztruhen-/Biblionär-Belege und Kopplungscodes.
//    Gelöscht wird NUR mit AUFRAEUMEN=ja (Repository-Variable). Sonst wird nur gezählt und im Protokoll des Laufs angezeigt.
//
// Zugang: FIREBASE_SERVICE_ACCOUNT = Inhalt der Dienstschlüssel-Datei (GitHub-Secret – NIE ins Repository legen!).
//
// 10.6: Das Sammeln läuft zusätzlich im Cloudflare-Worker der Slack-Brücke (alle 30 Minuten, zuverlässig – GitHub startet
//       geplante Läufe oft nur alle paar Stunden). Darum lädt diese Datei firebase-admin erst bei Bedarf: Der Worker gibt ein
//       kleines Ersatz-„db“ über die REST-Schnittstelle mit (worker/fs-rest.mjs, mit db.Timestamp). GitHub sammelt nur noch,
//       wenn der letzte Lauf älter als 45 Minuten ist (Ersatz, falls der Worker ausfällt), und räumt wie bisher auf.
let Timestamp = null;
const ADMIN = "firebase-admin";  // Name zusammengesetzt, damit der Worker-Bündler firebase-admin nicht einpackt
async function ladeAdmin() {
  const app = await import(ADMIN + "/app"), fsm = await import(ADMIN + "/firestore");
  Timestamp = fsm.Timestamp; return { ...app, ...fsm };
}
const bytes = t => new TextEncoder().encode(t).length;

export const TAG = 864e5;
// Felder einer Zeile in fester Reihenfolge (spart Platz: die Namen stehen nur einmal im Dokument)
export const FELDER = ["id", "name", "xp", "level", "bestChain", "chainAT", "chainNT", "chainRueck", "stars", "badges", "streak", "bestStreak", "blitz", "combo",
  "week", "weekXp", "avatar", "frame", "title", "armor", "atP", "ntP", "t28", "sg", "bew", "duS", "duG", "bib", "gl", "u", "tb", "tm", "g", "ab", "aw", "awk", "awb"];
const ms = t => (t && typeof t.toMillis === "function" ? t.toMillis() : 0);
// Spieltage (Liste von Tagesnummern) als Basis-Tag + Bitmaske der 31 Tage davor – die App macht daraus wieder die Liste
export function tageMaske(tl) {
  const l = (Array.isArray(tl) ? tl : []).filter(n => Number.isInteger(n) && n > 0); if (!l.length) return [0, 0];
  const tb = Math.max(...l); let tm = 0; new Set(l).forEach(n => { const i = tb - n; if (i >= 0 && i < 31) tm += 2 ** i; });
  return [tb, tm];
}
// Ein Spieler-Dokument → schlanke Zeile (ohne Geräteliste, Abzeichen-Liste … – die holt die App bei Bedarf einzeln)
// 9.85 Glanz-Karten aus album/{pid} (0 = leer, spart Platz)
const glanz = x => { const n = x && Number.isInteger(x.gl) ? Math.max(0, Math.min(66, x.gl)) : 0; return n || ""; };
// 10.2 Album-Stand aus album/{pid}: sk = 22 Zeichen (je Zeichen 3 Bücher à 2 Bit, Alphabet A–Z a–z 0–9 - _)
const SK_ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
export const albumSk = x => (x && typeof x.sk === "string" && /^[A-Za-z0-9_-]{22}$/.test(x.sk) ? x.sk : "");
export function skZahlen(sk) {  // [Gold, Silber, Bronze]
  const z = [0, 0, 0, 0]; for (const c of sk || "") { const v = SK_ABC.indexOf(c); z[(v >> 4) & 3]++; z[(v >> 2) & 3]++; z[v & 3]++; }
  return [z[3], z[2], z[1]];
}
// Kurzform für die Haupt-Rangliste: "Gold.Silber.Bronze" (das ganze Album steht nur in albumliste/alle)
export const abVon = sk => (sk ? skZahlen(sk).join(".") : "");
const abPunkte = ab => { const [g, s0, b] = String(ab || "").split(".").map(Number); return (g || 0) * 3 + (s0 || 0) * 2 + (b || 0); };
// Kalenderwoche wie in der App (weekKey, deutsche Zeit): "2026-W47"
/* 10.58: Berliner Kalendertag als Zahl (Tage seit 1970) – gleich wie dayNum(today()) in der App */
export function tagNr(ms0) {
  const t = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms0));
  return Math.round(Date.parse(t + "T00:00:00Z") / 864e5);
}
export function wocheVon(ms0) {
  const t = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms0));
  const d = new Date(t + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const w1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const w = 1 + Math.round(((d - w1) / 864e5 - 3 + ((w1.getUTCDay() + 6) % 7)) / 7);
  return d.getUTCFullYear() + "-W" + String(w).padStart(2, "0");
}
export function zeile(id, d, g) {
  const [tb, tm] = tageMaske(d.tl), r = { ...d, id, u: ms(d.updated), tb, tm, g: g || "" };
  return FELDER.map(f => { const v = r[f]; return v === undefined || v === null || (typeof v === "number" && !Number.isFinite(v)) ? "" : (typeof v === "string" ? v.slice(0, f === "st" ? 66 : 40) : typeof v === "number" || typeof v === "boolean" ? v : ""); });
}
// Zeilen auf Dokumente verteilen (Firestore: höchstens 1 MiB je Dokument – wir bleiben deutlich darunter)
export function teilen(zeilen, maxBytes = 700000) {
  const teile = []; let akt = [], n = 2;
  for (const z of zeilen) { const b = bytes(JSON.stringify(z)) + 1; if (akt.length && n + b > maxBytes) { teile.push(akt); akt = []; n = 2; } akt.push(z); n += b; }
  if (akt.length || !teile.length) teile.push(akt);
  return teile;
}

async function start() {
  const { initializeApp, cert, getFirestore } = await ladeAdmin();
  const emu = !!process.env.FIRESTORE_EMULATOR_HOST;
  if (emu) initializeApp({ projectId: process.env.GCLOUD_PROJECT || "demo-bibel-quest" });
  else {
    const roh = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!roh) throw new Error("FIREBASE_SERVICE_ACCOUNT fehlt (GitHub: Settings → Secrets and variables → Actions → New repository secret).");
    let k; try { k = JSON.parse(roh); } catch (e) { throw new Error("FIREBASE_SERVICE_ACCOUNT ist kein gültiges JSON – bitte den ganzen Inhalt der Schlüsseldatei einfügen."); }
    initializeApp({ credential: cert(k) });
  }
  return getFirestore();
}

export async function sammeln(db, opt = {}) {
  const Timestamp = db.Timestamp || (await ladeAdmin()).Timestamp;
  const jetzt = Date.now(), R = db.collection("rangliste"), jobRef = db.collection("jobstand").doc("sammeln");
  const job = (await jobRef.get()).data() || {};
  const alt = (await R.get()).docs.filter(d => d.id.startsWith("spieler-"));
  let stand = 0; const karte = new Map(); let lesbar = alt.length > 0;
  for (const d of alt) { const x = d.data(); try { const p = JSON.parse(x.daten); if (JSON.stringify(p.f) !== JSON.stringify(FELDER)) lesbar = false; else p.z.forEach(z => karte.set(z[0], z)); } catch (e) { lesbar = false; }
    stand = stand ? Math.min(stand, ms(x.stand)) : ms(x.stand); }
  const voll = opt.voll || !lesbar || !stand || jetzt - (+job.voll || 0) > 23 * 36e5;
  let gelesen = 0;
  const iG = FELDER.indexOf("g"), iGl = FELDER.indexOf("gl"), iAb = FELDER.indexOf("ab");
  // 10.2 ganze Alben (für das Schaufenster) in EINEM Dokument albumliste/alle = { stand, daten: JSON {pid: sk} }
  const ALref = db.collection("albumliste").doc("alle"), alDoc = await ALref.get(); gelesen++;
  let skMap = {}, alOk = false; try { if (alDoc.exists) { skMap = JSON.parse(alDoc.data().daten || "{}"); alOk = true; } } catch (e) { skMap = {}; }
  const skVor = JSON.stringify(skMap);
  // Album-Dokumente: nur geänderte lesen – alles nur, wenn Rangliste oder Albumliste fehlt/unlesbar ist (spart den täglichen Voll-Lauf)
  const albumAlle = !lesbar || !alOk || !stand || opt.albumVoll;
  const seit = Timestamp.fromMillis((stand || jetzt) - 5 * 60000);  // 5 Minuten Überlappung
  const alQ = albumAlle ? db.collection("album").get() : db.collection("album").where("updated", ">", seit).get();
  if (voll) {
    const alt0 = new Map(karte); karte.clear();
    const [sp, mi, al] = await Promise.all([db.collection("spieler").get(), db.collection("mitglied").get(), alQ]);
    gelesen += sp.size + mi.size + al.size;
    const g = new Map(mi.docs.map(d => [d.id, String(d.data().g || "")]));
    sp.docs.forEach(d => { const x = d.data(), vor = alt0.get(d.id); if (!x.zu) karte.set(d.id, zeile(d.id, { ...x, gl: vor && !albumAlle ? vor[iGl] : "", ab: vor && !albumAlle ? vor[iAb] : "" }, g.get(d.id))); });
    if (albumAlle) skMap = {};
    al.docs.forEach(d => { const a = d.data(), sk = albumSk(a), z = karte.get(d.id); if (sk) skMap[d.id] = sk; if (z) { z[iGl] = glanz(a); if (sk) z[iAb] = abVon(sk); } });
  } else {
    const [sp, mi, al] = await Promise.all([db.collection("spieler").where("updated", ">", seit).get(), db.collection("mitglied").where("updated", ">", seit).get(), alQ]);
    gelesen += sp.size + mi.size + al.size;
    sp.docs.forEach(d => { const x = d.data(), vor = karte.get(d.id); if (x.zu) karte.delete(d.id); else karte.set(d.id, zeile(d.id, { ...x, gl: vor ? vor[iGl] : "", ab: vor ? vor[iAb] : "" }, vor ? vor[iG] : "")); });
    mi.docs.forEach(d => { const z = karte.get(d.id); if (z) z[iG] = String(d.data().g || ""); });
    al.docs.forEach(d => { const a = d.data(), sk = albumSk(a), z = karte.get(d.id); if (sk) skMap[d.id] = sk; if (z) { z[iGl] = glanz(a); if (sk) z[iAb] = abVon(sk); } });
  }
  for (const id of Object.keys(skMap)) if (!karte.has(id)) delete skMap[id];  // gelöschte/zusammengeführte Spieler
  // 10.44 Bethlehem schmücken: schmuck/{pid} = { n } – Summe aller Schmuckstücke; Stand je Spieler in jobstand (nur Geänderte lesen, täglich alles)
  const schAlt = job.schmuck && typeof job.schmuck === "object" ? job.schmuck : null, schAlle = !schAlt || voll;
  const sch = await (schAlle ? db.collection("schmuck").get() : db.collection("schmuck").where("updated", ">", seit).get()); gelesen += sch.size;
  const schMap = schAlle ? {} : { ...schAlt };
  sch.docs.forEach(d => { const n = Math.max(0, Math.min(1000, (d.data().n | 0))); if (n) schMap[d.id] = n; });
  const schNeu = JSON.stringify(schMap) !== JSON.stringify(schAlt || {});
  const schSumme = Object.values(schMap).reduce((a, n) => a + n, 0), schSpender = Object.keys(schMap).length;
  // 10.58: gemeinsam heute gespendet (Berliner Tag) – Basis = Summe beim ersten Lauf des Tages; gestern bleibt für das Tagesziel sichtbar
  const tagN = tagNr(jetzt), s0 = job.schmuckTag && typeof job.schmuckTag === "object" ? job.schmuckTag : null;
  const schTag = !s0 ? { d: tagN, b: schSumme, g: 0 } : s0.d === tagN ? { ...s0 } : { d: tagN, b: s0.e != null ? s0.e : s0.b, g: s0.d === tagN - 1 ? Math.max(0, (s0.e != null ? s0.e : s0.b) - s0.b) : 0 };
  schTag.e = schSumme; const schHeute = Math.max(0, schSumme - schTag.b);
  const skNeu = JSON.stringify(skMap) !== skVor || !alOk;
  // 10.84 Biblionär-Ranglisten (Woche, Vorwoche, „gesamt“ = Zahl der Spiele) aus biblionaer/{wk}_{pid}: nur geänderte Belege lesen,
  //       einmal am Tag die drei Wochen ganz. Stand in jobstand (bib), Ergebnis als JSON {wk: {pid: Punkte}} im Ranglisten-Teil 0 –
  //       die App braucht dafür keinen eigenen Lesezugriff mehr (vorher bis zu 200 je Öffnen der Biblionär-Rangliste).
  const bibWk = wocheVon(jetzt), bibVw = wocheVon(jetzt - 7 * TAG), BIB_WKS = [bibWk, bibVw, "gesamt"];
  /* als JSON-Text gespeichert: set(…, {merge}) würde Karten sonst nur ergänzen und gelöschte Einträge behalten */
  let bibAlt = null; try { bibAlt = typeof job.bib === "string" ? JSON.parse(job.bib) : null; } catch (e) { bibAlt = null; }
  const bibAlle = !bibAlt || !bibAlt.w || voll;
  const bibW = {}; BIB_WKS.forEach(k => (bibW[k] = bibAlle ? {} : { ...((bibAlt.w || {})[k] || {}) }));
  const bibDocs = bibAlle ? (await Promise.all(BIB_WKS.map(k => db.collection("biblionaer").where("wk", "==", k).get()))).flatMap(q => q.docs)
    : (await db.collection("biblionaer").where("updated", ">", seit).get()).docs;
  gelesen += Math.max(1, bibDocs.length);
  bibDocs.forEach(d => { const x = d.data(), k = String(x.wk || ""), pid = String(x.pid || ""); if (bibW[k] && pid && karte.has(pid)) { const p = Math.max(0, Math.min(1000000, x.p | 0)); if (p) bibW[k][pid] = p; else delete bibW[k][pid]; } });
  for (const k of BIB_WKS) for (const pid of Object.keys(bibW[k])) if (!karte.has(pid)) delete bibW[k][pid];
  const bibNeu = JSON.stringify(bibW) !== JSON.stringify(bibAlt ? bibAlt.w : null);
  // 10.84 Abgleich-Anforderungen des Verwalters (abgleich/{pid | _alle} = {ts}) – nur neue lesen, Liste in jobstand und im Ranglisten-Teil 0
  let abgAlt = null; try { abgAlt = typeof job.abg === "string" ? JSON.parse(job.abg) : null; } catch (e) { abgAlt = null; }
  const abgDocs = (await (abgAlt && !voll ? db.collection("abgleich").where("ts", ">", (stand || jetzt) - 5 * 60000) : db.collection("abgleich")).get()).docs;
  gelesen += Math.max(1, abgDocs.length);
  const abgMap = abgAlt && !voll ? { ...abgAlt } : {};
  abgDocs.forEach(d => { const t = +d.data().ts || 0; if (t) abgMap[d.id] = Math.max(t, abgMap[d.id] || 0); });
  const abgNeu = JSON.stringify(abgMap) !== JSON.stringify(abgAlt || {});
  // 10.2 Album-Woche: Punkte zu Wochenbeginn bzw. beim ersten Sehen in dieser Woche (Basis für „Album diese Woche“)
  // 10.7: zusätzlich der Stand je Stufe zu Wochenbeginn (awb = "Gold.Silber.Bronze") – für „neue Karten diese Woche“
  const wk = wocheVon(jetzt), iAw = FELDER.indexOf("aw"), iAwk = FELDER.indexOf("awk"), iAwb = FELDER.indexOf("awb");
  const aw0 = job.albumWoche && job.albumWoche.wk === wk ? job.albumWoche : { wk, b: {}, s: {} }, awB = { ...aw0.b }, awS = { ...(aw0.s || {}) };
  let awNeu = aw0 !== job.albumWoche;
  for (const [id, z] of karte) {
    const ab = z[iAb]; if (!ab) { z[iAw] = ""; z[iAwk] = ""; z[iAwb] = ""; continue; }
    if (!(id in awB)) { awB[id] = abPunkte(ab); awNeu = true; }
    if (!(id in awS)) { awS[id] = ab; awNeu = true; }  // ältere Wochen-Basis ohne Stufen: ab jetzt gezählt
    z[iAw] = awB[id]; z[iAwk] = wk; z[iAwb] = awS[id];
  }
  // 10.17: Stand der Albumliste in jedes Ranglisten-Teil (ms) – die App lädt ihre gemerkte Albumliste nur neu, wenn dieser Wert neuer ist
  const alStand = skNeu ? jetzt : (ms(alDoc.exists ? alDoc.data().stand : null) || jetzt);
  const zeilen = [...karte.values()].sort((a, b) => (a[0] < b[0] ? -1 : 1)), teile = teilen(zeilen);
  const b = db.batch(), ts = Timestamp.fromMillis(jetzt);
  teile.forEach((z, i) => b.set(R.doc("spieler-" + i), { stand: ts, teil: i, teile: teile.length, anzahl: zeilen.length, alStand, ...(i === 0 ? { bib: JSON.stringify(bibW), abg: JSON.stringify(abgMap) } : {}), schmuck: schSumme, schmuckSp: schSpender, schmuckHeute: schHeute, schmuckTag: tagN, schmuckGestern: schTag.g, daten: JSON.stringify({ f: FELDER, z }) }));
  alt.filter(d => +d.id.slice(8) >= teile.length).forEach(d => b.delete(d.ref));
  if (skNeu) b.set(ALref, { stand: ts, anzahl: Object.keys(skMap).length, daten: JSON.stringify(skMap) });
  b.set(jobRef, { stand: jetzt, ...(voll ? { voll: jetzt } : {}), ...(awNeu ? { albumWoche: { wk, b: awB, s: awS } } : {}), ...(schNeu || !schAlt ? { schmuck: schMap } : {}), schmuckTag: schTag, ...(bibNeu || !bibAlt ? { bib: JSON.stringify({ w: bibW }) } : {}), ...(abgNeu || !abgAlt ? { abg: JSON.stringify(abgMap) } : {}) }, { merge: true });
  await b.commit();
  let schaetz = []; try { schaetz = await schaetzAuswerten(db); } catch (e) { schaetz = ["Schätzfrage: " + e.message]; }  // 10.52
  return { schaetz, art: (voll ? "voll" : "Änderungen") + (albumAlle ? " + alle Alben" : ""), alben: Object.keys(skMap).length, schmuck: schSumme, spieler: zeilen.length, dokumente: teile.length, gelesen, bytes: teile.map(z => bytes(JSON.stringify(z))) };
}

// 10.52: Schätzfrage der Woche auswerten – nach dem Ende (So 20 Uhr) beim nächsten Lauf. Wertung: Abstand zur Antwort,
// gleicher Abstand = gleicher Platz (ohne Lücke), Gemeinde-Schätzung = Median. Ergebnis in schaetzergebnis/{wk}, Liste als JSON
// [[pid, name, schätzung, abstand, platz], …]. Dieselbe Rechnung steht in schaetz.js (szWertung) für „Jetzt auswerten“ des Verwalters.
export function szWertung(f, a, liste) {
  const A = Math.round(+a.a || 0);
  const l = (liste || []).filter(x => x && typeof x.pid === "string" && Number.isFinite(+x.w))
    .map(x => ({ pid: x.pid, name: String(x.name || "?").slice(0, 20), w: Math.round(+x.w), z: +x.z || 0 })).map(x => ({ ...x, d: Math.abs(x.w - A) }))
    .sort((p, q) => p.d - q.d || p.z - q.z);
  let pl = 0, vor = -1; l.forEach(x => { if (x.d !== vor) { pl++; vor = x.d; } x.pl = pl; });
  const ws = l.map(x => x.w).sort((p, q) => p - q), n = ws.length;
  const med = n ? (n % 2 ? ws[(n - 1) / 2] : Math.round((ws[n / 2 - 1] + ws[n / 2]) / 2)) : null;
  return { f: f.f || "", e: f.e || "", t: !!f.t, a: A, s: a.s || "", i: a.i || "", n, med, l: JSON.stringify(l.map(x => [x.pid, x.name, x.w, x.d, x.pl])) };
}
export async function schaetzAuswerten(db) {
  const T = db.Timestamp || (await ladeAdmin()).Timestamp, jetzt = Date.now(), aus = [];
  const fr = await db.collection("schaetzfrage").where("ende", ">", T.fromMillis(jetzt - 3 * TAG)).get();
  for (const d of fr.docs) {
    const f = d.data(); if (f.fertig || ms(f.ende) > jetzt) continue;
    const ant = await db.collection("schaetzantwort").doc(d.id).get();
    if (!ant.exists) { aus.push(d.id + ": Antwort fehlt"); continue; }
    const ge = await db.collection("schaetzung").where("wk", "==", d.id).get();
    const e = szWertung(f, ant.data(), ge.docs.map(x => { const y = x.data(); return { ...y, z: ms(y.z) }; }));
    const b = db.batch();
    b.set(db.collection("schaetzergebnis").doc(d.id), { ...e, z: T.fromMillis(jetzt) });
    b.set(db.collection("schaetzfrage").doc(d.id), { fertig: T.fromMillis(jetzt) }, { merge: true });
    await b.commit(); aus.push(`${d.id}: ${e.n} Schätzungen ausgewertet`);
  }
  return aus;
}

// Was aufgeräumt wird: [Sammlung, Feld, Grenze, Beschreibung]
export function aufraeumPlan(jetzt) {
  const vor = t => Timestamp.fromMillis(jetzt - t * TAG);
  return [
    ["xpprotokoll", "z", jetzt - 7 * TAG, "XP-Protokoll älter als 7 Tage"],
    ["duelle", "ablauf", vor(1), "Duelle, die nach 3 Tagen unbeantwortet abgelaufen sind (fertige Duelle bleiben)", d => d.status !== "fertig"],
    ["duelle", "erstellt", vor(30), "Duelle älter als 30 Tage (Siege/Spiele bleiben im Spielstand)"],
    ["tagestruhe", "gebucht", vor(7), "Schatztruhen-Belege älter als 7 Tage"],
    ["bibversuch", "gebucht", vor(30), "Biblionär-Wochenbelege älter als 30 Tage"],
    ["kopplung", "exp", vor(1), "abgelaufene Kopplungscodes"]
  ];
}
export async function aufraeumen(db, opt = {}) {
  if (!Timestamp) await ladeAdmin();
  const jetzt = Date.now(), jobRef = db.collection("jobstand").doc("sammeln"), job = (await jobRef.get()).data() || {};
  if (!opt.erzwingen && jetzt - (+job.aufgeraeumt || 0) < 23 * 36e5) return null;
  const max = opt.max || 3000, aus = [];
  for (const [sammlung, feld, grenze, text, filter] of aufraeumPlan(jetzt)) {
    const q = db.collection(sammlung).where(feld, "<", grenze);
    if (filter) { /* 9.65: nur bestimmte Dokumente (z. B. nicht fertige Duelle) */
      const s = await q.limit(max).get(), ziel = s.docs.filter(d => filter(d.data()));
      if (!opt.loeschen) { aus.push({ sammlung, text, gefunden: ziel.length, geloescht: 0 }); continue; }
      for (let i = 0; i < ziel.length; i += 400) { const b = db.batch(); ziel.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit(); }
      aus.push({ sammlung, text, geloescht: ziel.length, mehr: s.size >= max }); continue;
    }
    if (!opt.loeschen) { aus.push({ sammlung, text, gefunden: (await q.count().get()).data().count, geloescht: 0 }); continue; }
    let n = 0;
    while (n < max) { const s = await q.limit(Math.min(400, max - n)).get(); if (s.empty) break; const b = db.batch(); s.docs.forEach(d => b.delete(d.ref)); await b.commit(); n += s.size; if (s.size < 400) break; }
    aus.push({ sammlung, text, geloescht: n, mehr: n >= max });
  }
  await jobRef.set({ aufgeraeumt: jetzt }, { merge: true });
  return aus;
}

const ja = v => /^(ja|true|1|yes)$/i.test(String(v || "").trim());
// 10.6: Hat der Worker vor kurzem gesammelt, lässt GitHub das Sammeln aus (manueller Start mit „Alle Spieler neu einlesen“ sammelt immer)
export const ERSATZ_AB = 45 * 60000;
export async function sammelnNoetig(db, opt = {}) {
  if (opt.immer) return true;
  const j = (await db.collection("jobstand").doc("sammeln").get()).data() || {};
  return !(+j.stand > 0 && Date.now() - +j.stand < ERSATZ_AB);
}
export const sammelText = r => `Sammel-Rangliste (${r.art}): ${r.spieler} Spieler in ${r.dokumente} Dokument(en), ${r.gelesen} Dokumente gelesen, Größe ${r.bytes.map(b => Math.round(b / 1024) + " KB").join(" + ")}${r.schaetz && r.schaetz.length ? " · Schätzfrage: " + r.schaetz.join("; ") : ""}`;
if (typeof process !== "undefined" && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  const db = await start();
  if (await sammelnNoetig(db, { immer: ja(process.env.VOLL) || ja(process.env.IMMER) })) console.log(sammelText(await sammeln(db, { voll: ja(process.env.VOLL) })));
  else console.log("Sammel-Rangliste: der Worker hat vor weniger als 45 Minuten gesammelt – hier nichts zu tun.");
  const loeschen = ja(process.env.AUFRAEUMEN), a = await aufraeumen(db, { loeschen, erzwingen: ja(process.env.AUFRAEUMEN_JETZT) });
  if (!a) console.log("Aufräumen: heute schon gelaufen.");
  else { console.log(loeschen ? "Aufräumen (es wird gelöscht):" : "Aufräumen – NUR GEZÄHLT, nichts gelöscht (zum Einschalten die Repository-Variable AUFRAEUMEN auf „ja“ setzen):");
    a.forEach(x => console.log(`  ${x.text}: ${loeschen ? x.geloescht + " gelöscht" + (x.mehr ? " (Rest folgt morgen)" : "") : x.gefunden + " gefunden"}`)); }
}
