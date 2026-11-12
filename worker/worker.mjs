// Bibelbuch-Quest – Slack-Brücke (9.58). Läuft als Cloudflare Worker (kostenloser Tarif).
//
// App → Slack:  Die App speichert Feedback und Dialog-Nachrichten wie bisher in Firestore und stupst danach /neu an ({art, id}).
//               Der Worker liest GENAU dieses Dokument (also nur, was die Firebase-Regeln durchgelassen haben) und postet es:
//               Feedback nach Kategorie in #feedback-idee / -fehler / -lob / -frage (jedes Feedback ein eigener Beitrag, Antworten im Faden
//               gehen an den Spieler), Dialog-Nachrichten in den Faden, in dem zuletzt mit dem Spieler geschrieben wurde, Meldungen der App (art "info": Datenbank-Fehler,
//               Abstürze, Status) nach #alerts-crashes. Alle 15 Minuten wird nachgesendet, was kein Stupser erreicht hat.
// Slack → App:  Antwort im Faden eines Spielers → Nachricht im Dialog der App. „An <Name>: <Text>“ in #user-feedback → neuer Dialog.
//               Nachricht in #patchnotes → Neuigkeit für alle Spieler (erste Zeile = Titel).
// Täglich:      Tageszahlen nach #metrics (aus der Sammel-Rangliste, kostet 1–2 Lesezugriffe).
//
// Zugänge kommen als Geheimnisse aus GitHub (siehe .github/workflows/worker.yml) – nie in diese Datei schreiben.

const TAG = 864e5;
const esc = t => String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ---------- Firestore (REST) ---------- */
let tokenMerk = { t: "", bis: 0 };
const b64u = d => btoa(String.fromCharCode(...new Uint8Array(d))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64uText = t => b64u(new TextEncoder().encode(t));
async function googleToken(env) {
  if (env.FIRESTORE_EMULATOR) return "owner";
  if (tokenMerk.t && Date.now() < tokenMerk.bis) return tokenMerk.t;
  const k = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT), jetzt = Math.floor(Date.now() / 1000);
  const kopf = b64uText(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const inhalt = b64uText(JSON.stringify({ iss: k.client_email, scope: "https://www.googleapis.com/auth/datastore", aud: "https://oauth2.googleapis.com/token", iat: jetzt, exp: jetzt + 3600 }));
  const der = Uint8Array.from(atob(k.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "")), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = b64u(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(kopf + "." + inhalt)));
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + kopf + "." + inhalt + "." + sig });
  const j = await r.json(); if (!j.access_token) throw new Error("Google-Anmeldung fehlgeschlagen: " + JSON.stringify(j).slice(0, 200));
  tokenMerk = { t: j.access_token, bis: Date.now() + 50 * 60000 };
  return tokenMerk.t;
}
const fsBasis = env => `${env.FIRESTORE_EMULATOR || "https://firestore.googleapis.com"}/v1/projects/${env.PROJEKT}/databases/(default)/documents`;
export const wert = v => v == null ? { nullValue: null } : typeof v === "string" ? { stringValue: v } : typeof v === "boolean" ? { booleanValue: v }
  : typeof v === "number" ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : v instanceof Date ? { timestampValue: v.toISOString() }
  : Array.isArray(v) ? { arrayValue: { values: v.map(wert) } } : { mapValue: { fields: felder(v) } };
export const felder = o => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [k, wert(v)]));
export const lies = v => "stringValue" in v ? v.stringValue : "integerValue" in v ? Number(v.integerValue) : "doubleValue" in v ? v.doubleValue : "booleanValue" in v ? v.booleanValue
  : "timestampValue" in v ? Date.parse(v.timestampValue) : "mapValue" in v ? dok({ fields: v.mapValue.fields || {} }) : "arrayValue" in v ? (v.arrayValue.values || []).map(lies) : null;
const dok = d => Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, lies(v)]));
const dokMitId = d => ({ id: d.name.split("/").pop(), ...dok(d) });
async function fs(env, pfad, opt = {}) {
  const r = await fetch(fsBasis(env) + pfad, { method: opt.method || "GET", headers: { authorization: "Bearer " + await googleToken(env), "content-type": "application/json" }, body: opt.body ? JSON.stringify(opt.body) : undefined });
  if (r.status === 404) return null;
  const j = await r.json(); if (!r.ok) throw new Error(`Firestore ${r.status} ${pfad}: ${JSON.stringify(j).slice(0, 200)}`);
  return j;
}
const fsHolen = async (env, pfad) => { const d = await fs(env, "/" + pfad); return d ? dokMitId(d) : null; };
const fsSetzen = (env, pfad, daten, nurWennDa) => fs(env, "/" + pfad + "?" + Object.keys(daten).map(k => "updateMask.fieldPaths=" + k).join("&") + (nurWennDa ? "&currentDocument.exists=true" : ""), { method: "PATCH", body: { fields: felder(daten) } });
const fsNeu = (env, sammlung, daten) => fs(env, "/" + sammlung, { method: "POST", body: { fields: felder(daten) } });
async function fsSuche(env, sammlung, feld, op, w, limit = 50) {
  const l = await fs(env, ":runQuery", { method: "POST", body: { structuredQuery: { from: [{ collectionId: sammlung }], where: { fieldFilter: { field: { fieldPath: feld }, op, value: wert(w) } }, limit } } });
  return (l || []).filter(x => x.document).map(x => dokMitId(x.document));
}
async function fsZahl(env, sammlung, feld, op, w) {
  const l = await fs(env, ":runAggregationQuery", { method: "POST", body: { structuredAggregationQuery: { structuredQuery: { from: [{ collectionId: sammlung }], where: { fieldFilter: { field: { fieldPath: feld }, op, value: wert(w) } } }, aggregations: [{ alias: "n", count: {} }] } } });
  return Number((((l || [])[0] || {}).result || {}).aggregateFields?.n?.integerValue || 0);
}

/* ---------- Slack ---------- */
async function slack(env, methode, daten, zweiter) {
  const r = await fetch("https://slack.com/api/" + methode, { method: "POST", headers: { authorization: "Bearer " + env.SLACK_BOT_TOKEN, "content-type": "application/json; charset=utf-8" }, body: JSON.stringify(daten) });
  const j = await r.json();
  if (!j.ok && j.error === "not_in_channel" && !zweiter && daten.channel) { await slack(env, "conversations.join", { channel: daten.channel }, true); return slack(env, methode, daten, true); }
  if (!j.ok) throw new Error(`Slack ${methode}: ${j.error}`);
  return j;
}
const sagen = (env, channel, text, mehr = {}) => slack(env, "chat.postMessage", { channel, text, unfurl_links: false, unfurl_media: false, ...mehr });
const haken = (env, channel, ts, name = "white_check_mark") => slack(env, "reactions.add", { channel, timestamp: ts, name }).catch(() => {});
async function slackEcht(env, anfrage, text) {
  const ts = anfrage.headers.get("x-slack-request-timestamp") || "", sig = anfrage.headers.get("x-slack-signature") || "";
  if (!env.SLACK_SIGNING_SECRET || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.SLACK_SIGNING_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const soll = "v0=" + [...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`v0:${ts}:${text}`)))].map(b => b.toString(16).padStart(2, "0")).join("");
  if (soll.length !== sig.length) return false;
  let ungleich = 0; for (let i = 0; i < soll.length; i++) ungleich |= soll.charCodeAt(i) ^ sig.charCodeAt(i);
  return ungleich === 0;
}
// Slack-Nachricht → reiner Text für die App (Emojis als Zeichen, Links als Adresse, keine Slack-Kürzel)
export function klartext(ev) {
  const aus = [];
  const el = e => e.type === "text" ? e.text : e.type === "emoji" ? (e.unicode ? String.fromCodePoint(...e.unicode.split("-").map(h => parseInt(h, 16))) : `:${e.name}:`)
    : e.type === "link" ? (e.text && e.text !== e.url ? `${e.text} (${e.url})` : e.url) : e.type === "user" ? "" : e.type === "channel" ? "" : e.type === "broadcast" ? "" : (e.text || "");
  const block = (b, vor = "") => { if (b.type === "rich_text_section" || b.type === "rich_text_quote" || b.type === "rich_text_preformatted") aus.push(vor + (b.elements || []).map(el).join(""));
    else if (b.type === "rich_text_list") (b.elements || []).forEach((x, i) => block(x, b.style === "ordered" ? `${i + 1}. ` : "• ")); };
  (ev.blocks || []).filter(b => b.type === "rich_text").forEach(b => (b.elements || []).forEach(x => block(x)));
  const t = aus.length ? aus.join("\n") : String(ev.text || "").replace(/<(https?:[^|>]+)\|([^>]+)>/g, "$2 ($1)").replace(/<(https?:[^>]+)>/g, "$1").replace(/<[@#!][^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  return t.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

/* ---------- App → Slack ---------- */
const ART = { idee: ["bulb", "Idee"], fehler: ["beetle", "Fehler"], lob: ["heart", "Lob"], frage: ["question", "Frage"], info: ["information_source", "Meldung"] };
// Kategorie → Kanal (ohne eigenen Kanal: #user-feedback)
const kanalFuer = (env, art) => ({ idee: env.K_IDEE, fehler: env.K_FEHLER, lob: env.K_LOB, frage: env.K_FRAGE })[art] || env.K_FEEDBACK;
const feedbackKanaele = env => [env.K_FEEDBACK, env.K_IDEE, env.K_FEHLER, env.K_LOB, env.K_FRAGE].filter(Boolean);
// slackfaden/{pid} = {ts: persönlicher Faden in #user-feedback, lts/lk: Faden und Kanal, in dem zuletzt mit dem Spieler geschrieben wurde}
const fadenMerken = (env, pid, name, lts, lk) => fsSetzen(env, "slackfaden/" + encodeURIComponent(pid), { lts, lk, name: name || "", pid });
// Persönlicher Faden je Spieler in #user-feedback – für Gespräche ohne vorheriges Feedback
async function faden(env, pid, name) {
  const f = await fsHolen(env, "slackfaden/" + encodeURIComponent(pid));
  if (f && f.ts) return f.ts;
  const m = await sagen(env, env.K_FEEDBACK, `:bust_in_silhouette: *${esc(name || "Unbekannt")}* – Antworte in diesem Faden, um dem Spieler in der App zu schreiben.`);
  await fsSetzen(env, "slackfaden/" + encodeURIComponent(pid), { ts: m.ts, name: name || "", pid });
  return m.ts;
}
async function feedbackSenden(env, f) {
  if (!f || f.slack) return false;
  const [ic, titel] = ART[f.art] || ART.info, fuss = `_${esc(f.name || "ohne Namen")} · v${esc(f.ver || "?")} · ${esc(f.geraet || "?")}_`;
  let m;
  if (f.art === "info") {  // Meldung der App selbst: Kategorie steht vorn im Gerätetext („datenbank · …“, „absturz · …“, „status · …“)
    const kat = String(f.geraet || "").split(" · ")[0] || "meldung", ernst = kat === "absturz" || kat === "datenbank";
    m = await sagen(env, env.K_ALARM, `${ernst ? ":rotating_light:" : ":information_source:"} *${esc(kat)}*\n${esc(f.text)}\n${fuss}`);
  } else if (f.pid) {  // eigener Beitrag im Kanal der Kategorie; Antworten im Faden darunter gehen an den Spieler
    const k = kanalFuer(env, f.art);
    m = await sagen(env, k, `:${ic}: *${titel}* von *${esc(f.name || "?")}*\n${esc(f.text)}\n${fuss}`);
    await fadenMerken(env, f.pid, f.name, m.ts, k);
  } else m = await sagen(env, kanalFuer(env, f.art), `:${ic}: *${titel}* (ohne Profil – Antworten nicht möglich)\n${esc(f.text)}\n${fuss}`);
  await fsSetzen(env, "feedback/" + f.id, { slack: m.ts }, true);
  return true;
}
async function dialogSenden(env, d) {
  if (!d || d.slack || d.von !== "spieler" || !d.pid) return false;
  // in den Faden, in dem zuletzt mit dem Spieler geschrieben wurde (sein Feedback oder deine Antwort) – sonst in seinen persönlichen Faden
  const f = await fsHolen(env, "slackfaden/" + encodeURIComponent(d.pid)), wo = f && f.lts && f.lk ? { k: f.lk, ts: f.lts } : { k: env.K_FEEDBACK, ts: await faden(env, d.pid, d.name) };
  const m = await sagen(env, wo.k, `:speech_balloon: *${esc(d.name || "?")}*: ${esc(d.text)}`, { thread_ts: wo.ts, reply_broadcast: true });
  await fsSetzen(env, "dialoge/" + d.id, { slack: m.ts }, true);
  return true;
}
// Nachsenden: alles aus den letzten 2 Stunden, das noch keinen Slack-Vermerk hat
async function nachsenden(env) {
  const seit = new Date(Date.now() - 2 * 36e5); let n = 0;
  for (const f of await fsSuche(env, "feedback", "zeit", "GREATER_THAN", seit)) try { if (await feedbackSenden(env, f)) n++; } catch (e) { console.log("feedback", f.id, e.message); }
  for (const d of await fsSuche(env, "dialoge", "zeit", "GREATER_THAN", seit)) try { if (await dialogSenden(env, d)) n++; } catch (e) { console.log("dialog", d.id, e.message); }
  return n;
}

/* ---------- Slack → App ---------- */
const darf = (env, user) => { const l = String(env.ADMINS || "").split(",").map(x => x.trim()).filter(Boolean); return !l.length || l.includes(user); };
async function anSpieler(env, pid, name, text, slackTs) {
  await fsNeu(env, "dialoge", { pid, name: String(name || "").slice(0, 20), von: "dev", text: text.slice(0, 1000), zeit: new Date(), slack: slackTs });
}
async function slackEreignis(env, ev) {
  if (ev.type !== "message" || ev.bot_id || (ev.subtype && ev.subtype !== "thread_broadcast") || !ev.user || !darf(env, ev.user)) return;
  const text = klartext(ev); if (!text) return;
  const fehler = t => sagen(env, ev.channel, ":warning: " + t, { thread_ts: ev.thread_ts || ev.ts });
  if (ev.channel === env.K_PATCH && !ev.thread_ts) {
    // Erste Zeile = Titel (höchstens 60 Zeichen), Rest = Text. „Info:“ am Anfang macht daraus eine allgemeine Nachricht statt Patchnotes.
    const zeilen = text.split("\n"), info = /^info\s*:/i.test(zeilen[0]);
    const titel = zeilen[0].replace(/^(info|patch(notes)?)\s*:\s*/i, "").replace(/[*_~`]/g, "").trim().slice(0, 60);
    const rest = zeilen.slice(1).join("\n").trim() || titel, ver = (titel.match(/\b(\d+\.\d+(?:\.\d+)?)\b/) || [])[1];
    if (!titel) return fehler("Die erste Zeile ist der Titel – sie darf nicht leer sein.");
    await fsNeu(env, "nachrichten", { art: info ? "info" : "patch", titel, text: rest.slice(0, 2000), g: "alle", ...(ver ? { ver } : {}), zeit: new Date() });
    await haken(env, ev.channel, ev.ts);
    await sagen(env, ev.channel, `:white_check_mark: In der App veröffentlicht als ${info ? "Nachricht" : "Patchnotes"} „${esc(titel)}“${rest.length > 2000 ? " (auf 2.000 Zeichen gekürzt)" : ""}. Spieler sehen sie beim nächsten Öffnen (bis zu 1 Stunde Zwischenspeicher).`, { thread_ts: ev.ts });
    return;
  }
  if (!feedbackKanaele(env).includes(ev.channel)) return;
  if (ev.thread_ts) {  // Antwort im Faden: unter einem Feedback (Vermerk „slack“ am Feedback) oder im persönlichen Faden eines Spielers
    const fb = (await fsSuche(env, "feedback", "slack", "EQUAL", ev.thread_ts, 1))[0];
    const f = fb && fb.pid ? { pid: fb.pid, name: fb.name } : (await fsSuche(env, "slackfaden", "ts", "EQUAL", ev.thread_ts, 1))[0];
    if (!f) return;  // Faden ohne Spieler (z. B. Feedback ohne Profil) – nichts zuzustellen
    await anSpieler(env, f.pid, f.name, text, ev.ts);
    await fadenMerken(env, f.pid, f.name, ev.thread_ts, ev.channel);
    return haken(env, ev.channel, ev.ts);
  }
  if (ev.channel !== env.K_FEEDBACK) return;
  const m = text.match(/^(?:an\s+|@)([^:\n]{1,30}):\s*([\s\S]+)$/i);  // „An Maria: Hallo …“ – neuen Dialog beginnen
  if (!m) return;
  const name = m[1].trim(), treffer = (await fsSuche(env, "spieler", "name", "EQUAL", name, 10)).filter(s => !s.zu);
  if (!treffer.length) return fehler(`Kein Spieler mit dem Namen „${esc(name)}“ gefunden (Groß-/Kleinschreibung muss stimmen).`);
  if (treffer.length > 1) return fehler(`${treffer.length} Spieler heißen „${esc(name)}“ – bitte im Faden des richtigen Spielers antworten.`);
  const s = treffer[0], alt = await fsHolen(env, "slackfaden/" + encodeURIComponent(s.id));
  await anSpieler(env, s.id, s.name, m[2].trim(), ev.ts);
  if (alt && alt.ts) { await sagen(env, env.K_FEEDBACK, `:outbox_tray: (an ${esc(s.name)}) ${esc(m[2].trim())}`, { thread_ts: alt.ts }); await fadenMerken(env, s.id, s.name, alt.ts, env.K_FEEDBACK); }
  else await fsSetzen(env, "slackfaden/" + encodeURIComponent(s.id), { ts: ev.ts, lts: ev.ts, lk: env.K_FEEDBACK, name: s.name, pid: s.id });  // diese Nachricht wird der Faden des Spielers
  return haken(env, ev.channel, ev.ts);
}

/* ---------- Tageszahlen ---------- */
export function zahlenAus(teile, jetzt) {
  const z = []; for (const t of teile) { const p = JSON.parse(t.daten); p.z.forEach(r => z.push(Object.fromEntries(p.f.map((k, i) => [k, r[i]])))); }
  const aktiv = t => z.filter(r => r.u && jetzt - r.u < t * TAG);
  const gem = {}; aktiv(1).forEach(r => { const g = r.g || "ohne Zuordnung"; gem[g] = (gem[g] || 0) + 1; });
  const top = z.filter(r => r.weekXp > 0).sort((a, b) => b.weekXp - a.weekXp).slice(0, 3);
  return { gesamt: z.length, heute: aktiv(1).length, woche: aktiv(7).length, gem, top };
}
async function tageszahlen(env) {
  const jetzt = Date.now(), l = await fs(env, "/rangliste?pageSize=20");
  const teile = ((l && l.documents) || []).map(dokMitId).filter(d => d.id.startsWith("spieler-"));
  if (!teile.length) return sagen(env, env.K_METRIK, ":warning: Tageszahlen: Die Sammel-Rangliste fehlt (läuft der Sammel-Job?).");
  const z = zahlenAus(teile, jetzt), gestern = new Date(jetzt - TAG);
  const [duelle, feedback, vor] = await Promise.all([fsZahl(env, "duelle", "erstellt", "GREATER_THAN", gestern), fsZahl(env, "feedback", "zeit", "GREATER_THAN", gestern), fsHolen(env, "jobstand/metrik")]);
  const neu = vor && Number.isFinite(vor.gesamt) ? z.gesamt - vor.gesamt : null;
  await fsSetzen(env, "jobstand/metrik", { gesamt: z.gesamt, zeit: new Date(jetzt) });
  const datum = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", weekday: "long", day: "numeric", month: "long" }).format(jetzt);
  const gemText = Object.entries(z.gem).sort((a, b) => b[1] - a[1]).map(([g, n]) => `${esc(g)} ${n}`).join(" · ");
  return sagen(env, env.K_METRIK, [`:bar_chart: *Bibelbuch-Quest – ${datum}*`,
    `*${z.heute}* aktive Spieler in den letzten 24 Stunden · *${z.woche}* in 7 Tagen · *${z.gesamt}* insgesamt${neu === null ? "" : ` (${neu >= 0 ? "+" : ""}${neu} seit gestern)`}`,
    `*${duelle}* neue Duelle · *${feedback}* Meldungen/Feedback`,
    gemText ? `Aktiv je Gemeinde: ${gemText}` : "",
    z.top.length ? `Wochen-XP: ${z.top.map((r, i) => `${i + 1}. ${esc(r.name)} (${Number(r.weekXp).toLocaleString("de-DE")})`).join(" · ")}` : ""].filter(Boolean).join("\n"));
}

// Slack schickt Nachrichten nur aus Kanälen, in denen die App Mitglied ist – deshalb tritt sie den vier Kanälen selbst bei
// (beim Einrichten der Ereignis-Adresse und danach bei jedem Zeitplan-Lauf einer neuen Worker-Instanz; mehrfach beitreten schadet nicht).
let beigetreten = false;
async function beitreten(env) {
  if (beigetreten) return; beigetreten = true;
  for (const c of [...feedbackKanaele(env), env.K_PATCH, env.K_ALARM, env.K_METRIK]) if (c) await slack(env, "conversations.join", { channel: c }, true).catch(e => { beigetreten = false; console.log("beitreten", c, e.message); });
}
/* ---------- Eingänge ---------- */
const CORS = { "access-control-allow-origin": "*" };
const antwort = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", ...CORS } });
// Bremse für /neu: Jeder Stupser kostet einen Lesezugriff – höchstens 60 je Minute insgesamt und 10 je Absender (je Worker-Instanz).
const bremse = new Map();
function zuViel(ip) {
  const min = Math.floor(Date.now() / 60000);
  if (bremse.get("min") !== min) { bremse.clear(); bremse.set("min", min); }
  const g = (bremse.get("alle") || 0) + 1, e = (bremse.get(ip) || 0) + 1; bremse.set("alle", g); bremse.set(ip, e);
  return g > 60 || e > 10;
}
export default {
  async fetch(anfrage, env, ctx) {
    const url = new URL(anfrage.url);
    try {
      if (anfrage.method === "OPTIONS") return new Response(null, { headers: { ...CORS, "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST" } });
      if (anfrage.method === "GET" && url.pathname === "/") return antwort({ ok: true, dienst: "bibel-quest-slack" });
      if (anfrage.method === "POST" && url.pathname === "/neu") {
        if (zuViel(anfrage.headers.get("cf-connecting-ip") || "?")) return antwort({ ok: false, grund: "zu viele" }, 429);
        let j = {}; try { j = JSON.parse(await anfrage.text()); } catch (e) {}
        if (!/^[A-Za-z0-9]{10,40}$/.test(String(j.id || "")) || !["feedback", "dialog"].includes(j.art)) return antwort({ ok: false }, 400);
        const arbeit = j.art === "feedback" ? fsHolen(env, "feedback/" + j.id).then(f => feedbackSenden(env, f)) : fsHolen(env, "dialoge/" + j.id).then(d => dialogSenden(env, d));
        ctx.waitUntil(arbeit.catch(e => console.log("neu", j.art, j.id, e.message)));
        return antwort({ ok: true });
      }
      if (anfrage.method === "POST" && url.pathname === "/slack/events") {
        const text = await anfrage.text();
        if (!await slackEcht(env, anfrage, text)) return antwort({ ok: false }, 401);
        const j = JSON.parse(text);
        if (j.type === "url_verification") { ctx.waitUntil(beitreten(env)); return new Response(j.challenge, { headers: { "content-type": "text/plain" } }); }
        // Slack wiederholt Ereignisse, wenn die Antwort zu spät kommt – Wiederholungen nicht doppelt zustellen
        if (j.type === "event_callback" && j.event && !anfrage.headers.get("x-slack-retry-num"))
          ctx.waitUntil(slackEreignis(env, j.event).catch(e => { console.log("slack", e.message); return sagen(env, j.event.channel, ":warning: Das hat nicht geklappt: " + esc(e.message).slice(0, 200), { thread_ts: j.event.thread_ts || j.event.ts }).catch(() => {}); }));
        return antwort({ ok: true });
      }
      return antwort({ ok: false }, 404);
    } catch (e) { console.log("fehler", e.message); return antwort({ ok: false }, 500); }
  },
  async scheduled(ereignis, env, ctx) {
    ctx.waitUntil(beitreten(env).then(() => ereignis.cron === "0 18 * * *" ? tageszahlen(env) : nachsenden(env)).catch(e => { console.log("zeitplan", e.message); return sagen(env, env.K_ALARM, ":rotating_light: *Slack-Brücke*: " + esc(e.message).slice(0, 300)).catch(() => {}); }));
  }
};
export { nachsenden, tageszahlen, slackEreignis };
