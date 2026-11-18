// Bibelbuch-Quest – kleines Firestore-„db“ über die REST-Schnittstelle (10.6).
// Bildet genau den Teil von firebase-admin nach, den job/sammeln.mjs braucht, damit der Worker den Sammel-Job ausführen kann:
//   db.collection(n).get() · .where(feld, op, wert).get() · .doc(id).get() · db.batch().set(ref, daten, {merge}) / .delete(ref) / .commit()
//   db.Timestamp.fromMillis(ms) · Zeitwerte kommen als Objekte mit toMillis() zurück (wie bei firebase-admin).
// Der Dienstkonto-Zugang (Token) kommt aus dem Worker (googleToken) – hier steht kein Geheimnis.

class Zeit {
  constructor(ms) { this.ms = ms; }
  toMillis() { return this.ms; }
  static fromMillis(ms) { return new Zeit(ms); }
}

const kodieren = v => v == null ? { nullValue: null }
  : v instanceof Zeit ? { timestampValue: new Date(v.ms).toISOString() }
  : typeof v === "string" ? { stringValue: v }
  : typeof v === "boolean" ? { booleanValue: v }
  : typeof v === "number" ? (Number.isSafeInteger(v) ? { integerValue: String(v) } : { doubleValue: v })
  : Array.isArray(v) ? { arrayValue: { values: v.map(kodieren) } }
  : { mapValue: { fields: felderVon(v) } };
const felderVon = o => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [k, kodieren(v)]));
const lesen = v => "stringValue" in v ? v.stringValue : "integerValue" in v ? Number(v.integerValue) : "doubleValue" in v ? v.doubleValue
  : "booleanValue" in v ? v.booleanValue : "timestampValue" in v ? new Zeit(Date.parse(v.timestampValue))
  : "mapValue" in v ? datenVon(v.mapValue.fields) : "arrayValue" in v ? (v.arrayValue.values || []).map(lesen) : null;
const datenVon = f => Object.fromEntries(Object.entries(f || {}).map(([k, v]) => [k, lesen(v)]));
const OPS = { "<": "LESS_THAN", "<=": "LESS_THAN_OR_EQUAL", ">": "GREATER_THAN", ">=": "GREATER_THAN_OR_EQUAL", "==": "EQUAL" };

export function restDb({ basis, projekt, token }) {
  // basis = "https://firestore.googleapis.com" oder Emulator-Adresse; token = async () => "…"
  const wurzel = `projects/${projekt}/databases/(default)/documents`;
  let anfragen = 0;
  async function rufen(pfad, opt = {}) {
    anfragen++;
    const r = await fetch(`${basis}/v1/${wurzel}${pfad}`, { method: opt.method || "GET",
      headers: { authorization: "Bearer " + await token(), "content-type": "application/json" }, body: opt.body ? JSON.stringify(opt.body) : undefined });
    if (r.status === 404 && opt.leer404) return null;
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Firestore ${r.status} ${pfad}: ${JSON.stringify(j).slice(0, 200)}`);
    return j;
  }
  const schnapp = (sammlung, d) => { const id = d.name.split("/").pop(); return { id, ref: ref(sammlung, id), exists: true, data: () => datenVon(d.fields) }; };
  const ref = (sammlung, id) => ({ id, pfad: `${sammlung}/${id}`, name: `${wurzel}/${sammlung}/${id}`,
    async get() { const d = await rufen(`/${sammlung}/${encodeURIComponent(id)}`, { leer404: true }); return d ? schnapp(sammlung, d) : { id, exists: false, data: () => undefined }; } });
  async function abfrage(sammlung, filter) {
    const q = { from: [{ collectionId: sammlung }] };
    if (filter) q.where = { fieldFilter: { field: { fieldPath: filter[0] }, op: OPS[filter[1]], value: kodieren(filter[2]) } };
    const l = await rufen(":runQuery", { method: "POST", body: { structuredQuery: q } });
    const docs = (l || []).filter(x => x.document).map(x => schnapp(sammlung, x.document));
    return { docs, size: docs.length, empty: !docs.length };
  }
  const db = {
    Timestamp: Zeit,
    get anfragen() { return anfragen; },
    collection: sammlung => ({
      get: () => abfrage(sammlung),
      where: (feld, op, wert) => { if (!OPS[op]) throw new Error("Vergleich nicht unterstützt: " + op); return { get: () => abfrage(sammlung, [feld, op, wert]) }; },
      doc: id => ref(sammlung, id)
    }),
    batch() {
      const writes = [];
      return {
        set(r, daten, opt) { const w = { update: { name: r.name, fields: felderVon(daten) } }; if (opt && opt.merge) w.updateMask = { fieldPaths: Object.keys(daten).filter(k => daten[k] !== undefined).map(k => /^[A-Za-z_][A-Za-z_0-9]*$/.test(k) ? k : "`" + k.replace(/[`\\]/g, "\\$&") + "`") }; writes.push(w); return this; },
        delete(r) { writes.push({ delete: r.name }); return this; },
        async commit() { if (writes.length) await rufen(":commit", { method: "POST", body: { writes } }); return writes.length; }
      };
    }
  };
  return db;
}
export { Zeit };
