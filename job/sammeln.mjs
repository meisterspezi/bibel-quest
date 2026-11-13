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
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldPath } from "firebase-admin/firestore";

export const TAG = 864e5;
// Felder einer Zeile in fester Reihenfolge (spart Platz: die Namen stehen nur einmal im Dokument)
export const FELDER = ["id", "name", "xp", "level", "bestChain", "chainAT", "chainNT", "chainRueck", "stars", "badges", "streak", "bestStreak", "blitz", "combo",
  "week", "weekXp", "avatar", "frame", "title", "armor", "atP", "ntP", "t28", "sg", "bew", "duS", "duG", "bib", "u", "tb", "tm", "g"];
const ms = t => (t && typeof t.toMillis === "function" ? t.toMillis() : 0);
// Spieltage (Liste von Tagesnummern) als Basis-Tag + Bitmaske der 31 Tage davor – die App macht daraus wieder die Liste
export function tageMaske(tl) {
  const l = (Array.isArray(tl) ? tl : []).filter(n => Number.isInteger(n) && n > 0); if (!l.length) return [0, 0];
  const tb = Math.max(...l); let tm = 0; new Set(l).forEach(n => { const i = tb - n; if (i >= 0 && i < 31) tm += 2 ** i; });
  return [tb, tm];
}
// Ein Spieler-Dokument → schlanke Zeile (ohne Geräteliste, Abzeichen-Liste … – die holt die App bei Bedarf einzeln)
export function zeile(id, d, g) {
  const [tb, tm] = tageMaske(d.tl), r = { ...d, id, u: ms(d.updated), tb, tm, g: g || "" };
  return FELDER.map(f => { const v = r[f]; return v === undefined || v === null || (typeof v === "number" && !Number.isFinite(v)) ? "" : (typeof v === "string" ? v.slice(0, 40) : typeof v === "number" || typeof v === "boolean" ? v : ""); });
}
// Zeilen auf Dokumente verteilen (Firestore: höchstens 1 MiB je Dokument – wir bleiben deutlich darunter)
export function teilen(zeilen, maxBytes = 700000) {
  const teile = []; let akt = [], n = 2;
  for (const z of zeilen) { const b = Buffer.byteLength(JSON.stringify(z)) + 1; if (akt.length && n + b > maxBytes) { teile.push(akt); akt = []; n = 2; } akt.push(z); n += b; }
  if (akt.length || !teile.length) teile.push(akt);
  return teile;
}

function start() {
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
  const jetzt = Date.now(), R = db.collection("rangliste"), jobRef = db.collection("jobstand").doc("sammeln");
  const job = (await jobRef.get()).data() || {};
  const alt = (await R.get()).docs.filter(d => d.id.startsWith("spieler-"));
  let stand = 0; const karte = new Map(); let lesbar = alt.length > 0;
  for (const d of alt) { const x = d.data(); try { const p = JSON.parse(x.daten); if (JSON.stringify(p.f) !== JSON.stringify(FELDER)) lesbar = false; else p.z.forEach(z => karte.set(z[0], z)); } catch (e) { lesbar = false; }
    stand = stand ? Math.min(stand, ms(x.stand)) : ms(x.stand); }
  const voll = opt.voll || !lesbar || !stand || jetzt - (+job.voll || 0) > 23 * 36e5;
  let gelesen = 0;
  if (voll) {
    karte.clear();
    const [sp, mi] = await Promise.all([db.collection("spieler").get(), db.collection("mitglied").get()]);
    gelesen = sp.size + mi.size;
    const g = new Map(mi.docs.map(d => [d.id, String(d.data().g || "")]));
    sp.docs.forEach(d => { const x = d.data(); if (!x.zu) karte.set(d.id, zeile(d.id, x, g.get(d.id))); });
  } else {
    const seit = Timestamp.fromMillis(stand - 5 * 60000);  // 5 Minuten Überlappung
    const [sp, mi] = await Promise.all([db.collection("spieler").where("updated", ">", seit).get(), db.collection("mitglied").where("updated", ">", seit).get()]);
    gelesen = sp.size + mi.size;
    const iG = FELDER.indexOf("g");
    sp.docs.forEach(d => { const x = d.data(), vor = karte.get(d.id); if (x.zu) karte.delete(d.id); else karte.set(d.id, zeile(d.id, x, vor ? vor[iG] : "")); });
    mi.docs.forEach(d => { const z = karte.get(d.id); if (z) z[iG] = String(d.data().g || ""); });
  }
  const zeilen = [...karte.values()].sort((a, b) => (a[0] < b[0] ? -1 : 1)), teile = teilen(zeilen);
  const b = db.batch(), ts = Timestamp.fromMillis(jetzt);
  teile.forEach((z, i) => b.set(R.doc("spieler-" + i), { stand: ts, teil: i, teile: teile.length, anzahl: zeilen.length, daten: JSON.stringify({ f: FELDER, z }) }));
  alt.filter(d => +d.id.slice(8) >= teile.length).forEach(d => b.delete(d.ref));
  b.set(jobRef, { stand: jetzt, ...(voll ? { voll: jetzt } : {}) }, { merge: true });
  await b.commit();
  return { art: voll ? "voll" : "Änderungen", spieler: zeilen.length, dokumente: teile.length, gelesen, bytes: teile.map(z => Buffer.byteLength(JSON.stringify(z))) };
}

// Was aufgeräumt wird: [Sammlung, Feld, Grenze, Beschreibung]
export function aufraeumPlan(jetzt) {
  const vor = t => Timestamp.fromMillis(jetzt - t * TAG);
  return [
    ["xpprotokoll", "z", jetzt - 60 * TAG, "XP-Protokoll älter als 60 Tage"],
    ["duelle", "ablauf", vor(1), "Duelle, die nach 3 Tagen unbeantwortet abgelaufen sind (fertige Duelle bleiben)", d => d.status !== "fertig"],
    ["duelle", "erstellt", vor(45), "Duelle älter als 45 Tage (die App zeigt sie nach 30 Tagen nicht mehr; Siege/Spiele bleiben im Spielstand)"],
    ["tagestruhe", "gebucht", vor(10), "Schatztruhen-Belege älter als 10 Tage"],
    ["bibversuch", "gebucht", vor(30), "Biblionär-Wochenbelege älter als 30 Tage"],
    ["kopplung", "exp", vor(1), "abgelaufene Kopplungscodes"]
  ];
}
export async function aufraeumen(db, opt = {}) {
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
if (import.meta.url === `file://${process.argv[1]}`) {
  const db = start();
  const r = await sammeln(db, { voll: ja(process.env.VOLL) });
  console.log(`Sammel-Rangliste (${r.art}): ${r.spieler} Spieler in ${r.dokumente} Dokument(en), ${r.gelesen} Dokumente gelesen, Größe ${r.bytes.map(b => Math.round(b / 1024) + " KB").join(" + ")}`);
  const loeschen = ja(process.env.AUFRAEUMEN), a = await aufraeumen(db, { loeschen, erzwingen: ja(process.env.AUFRAEUMEN_JETZT) });
  if (!a) console.log("Aufräumen: heute schon gelaufen.");
  else { console.log(loeschen ? "Aufräumen (es wird gelöscht):" : "Aufräumen – NUR GEZÄHLT, nichts gelöscht (zum Einschalten die Repository-Variable AUFRAEUMEN auf „ja“ setzen):");
    a.forEach(x => console.log(`  ${x.text}: ${loeschen ? x.geloescht + " gelöscht" + (x.mehr ? " (Rest folgt morgen)" : "") : x.gefunden + " gefunden"}`)); }
}
