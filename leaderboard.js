// Gemeinde-Rangliste für Bibelbuch-Quest (Firebase: anonyme Anmeldung + Firestore).
// Stellt window.LB bereit und meldet sich mit dem Ereignis "lb-ready".
// Die Test-Rangliste (dev/leaderboard-mock.js) hat dieselbe Schnittstelle.
const CFG = window.FIREBASE_CONFIG || {};
const configured = !!(CFG.apiKey && CFG.projectId && !String(CFG.apiKey).includes("HIER"));

const LB = { configured, ok: false, uid: null, error: "" };
window.LB = LB;

if (!configured) {
  LB.error = "nicht eingerichtet";
  dispatchEvent(new Event("lb-ready"));
} else {
  try {
    const V = "10.12.2";
    const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
    const { getAuth, signInAnonymously } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);
    const fs = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);
    const app = initializeApp(CFG);
    const auth = getAuth(app);
    const db = fs.getFirestore(app);
    const spieler = fs.collection(db, "spieler");
    const ref = (c, id) => fs.doc(db, c, id);

    // Bereits angemeldete Geräte sofort erkennen; neue erst beim Beitreten anmelden
    await auth.authStateReady();
    LB.uid = auth.currentUser ? auth.currentUser.uid : null;
    LB.signIn = async () => {
      if (!auth.currentUser) await signInAnonymously(auth);
      LB.uid = auth.currentUser.uid;
      return LB.uid;
    };

    // Eigenen Ranglisten-Eintrag schreiben (zusammenführend, Besitzer bleiben erhalten)
    LB.push = async (pid, data, opts = {}) => {
      await LB.signIn();
      const d = { ...data, updated: fs.serverTimestamp() };
      if (opts.owners) d.owners = fs.arrayUnion(...opts.owners);
      await fs.setDoc(ref("spieler", pid), d, { merge: true });
    };

    // Dieses Gerät einem bestehenden Profil zuordnen (per Kopplungscode oder Zusammenführung)
    LB.join = async (pid, opts = {}) => {
      await LB.signIn();
      const upd = { owners: fs.arrayUnion(pid, LB.uid), updated: fs.serverTimestamp() };
      if (opts.code) upd.code = opts.code;
      await fs.updateDoc(ref("spieler", pid), upd);
      const s = await fs.getDoc(ref("spieler", pid));
      return s.exists() ? s.data() : null;
    };

    // Vom Verwalter angelegte Zusammenführung für dieses Gerät?
    LB.getMergeTarget = async () => {
      if (!LB.uid) return null;
      try { const s = await fs.getDoc(ref("zusammenfuehren", LB.uid)); return s.exists() ? s.data().zu || null : null; }
      catch (e) { return null; }
    };

    // Kompletter Spielstand (nur für die Geräte des Spielers lesbar)
    LB.loadState = async (pid) => {
      const s = await fs.getDoc(ref("spielstand", pid));
      if (!s.exists()) return null;
      try { return JSON.parse(s.data().daten); } catch (e) { return null; }
    };
    LB.saveState = async (pid, obj) => {
      await fs.setDoc(ref("spielstand", pid), { daten: JSON.stringify(obj), updated: fs.serverTimestamp() });
    };

    // Kopplungscodes (6 Zeichen, 20 Minuten gültig)
    LB.createLinkCode = async (pid) => {
      const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      for (let versuch = 0; versuch < 3; versuch++) {
        let c = ""; crypto.getRandomValues(new Uint32Array(6)).forEach(n => (c += A[n % A.length]));
        try { await fs.setDoc(ref("kopplung", c), { pid, exp: fs.Timestamp.fromMillis(Date.now() + 20 * 60000) }); return c; }
        catch (e) { if (versuch === 2) throw e; }
      }
    };
    LB.resolveLinkCode = async (code) => {
      await LB.signIn();
      const s = await fs.getDoc(ref("kopplung", code));
      if (!s.exists()) return null;
      const d = s.data();
      if (d.exp && d.exp.toMillis() < Date.now()) return null;
      return d.pid || null;
    };

    // Aus der Rangliste entfernen
    LB.remove = async (pid) => {
      try { await fs.deleteDoc(ref("spielstand", pid)); } catch (e) {}
      await fs.deleteDoc(ref("spieler", pid));
    };

    // Wer hat sich über meinen Einladungslink angemeldet?
    LB.invitees = async (pid) => {
      const s = await fs.getDocs(fs.query(spieler, fs.where("von", "==", pid), fs.limit(50)));
      return s.docs.map(d => ({ id: d.id, ...d.data() }));
    };

    // Feedback an den Entwickler (nur anlegen – lesen kann es nur der Entwickler in der Firebase-Konsole)
    LB.feedback = async (f) => {
      await LB.signIn();
      const d = { text: String(f.text).slice(0, 2000), art: f.art, ver: f.ver, geraet: f.geraet, uid: LB.uid, zeit: fs.serverTimestamp() };
      if (f.name) { d.name = f.name; if (f.pid) d.pid = f.pid; }
      if (f.wann) d.geschrieben = f.wann;
      await fs.addDoc(fs.collection(db, "feedback"), d);
    };

    // Feedback-Postfach (nur für den Entwickler – die Regeln prüfen das)
    LB.entwicklerPid = async () => {
      try { const d = await fs.getDoc(ref("einstellungen", "entwickler")); return d.exists() ? d.data().pid || null : null; } catch (e) { return null; }
    };
    LB.feedbackListe = async () => {
      const s = await fs.getDocs(fs.query(fs.collection(db, "feedback"), fs.orderBy("zeit", "desc"), fs.limit(200)));
      return s.docs.map(d => { const x = d.data(); return { id: d.id, ...x, zeit: x.zeit && x.zeit.toMillis ? x.zeit.toMillis() : Date.parse(x.geschrieben || "") || 0 }; });
    };
    LB.feedbackErledigt = async (id, wert) => { await fs.updateDoc(ref("feedback", id), { erledigt: !!wert }); };
    LB.feedbackLoeschen = async (id) => { await fs.deleteDoc(ref("feedback", id)); };

    LB.holeSpieler = async (pid) => { const d = await fs.getDoc(ref("spieler", pid)); return d.exists() ? { id: d.id, ...d.data() } : null; };

    // Einträge mit „zu“ wurden zusammengeführt und werden nirgends mehr angezeigt
    const aktiv = docs => docs.map(d => ({ id: d.id, ...d.data() })).filter(r => !r.zu);
    LB.findeName = async (name) => {
      const s = await fs.getDocs(fs.query(spieler, fs.where("name", "==", name), fs.limit(10)));
      return aktiv(s.docs).slice(0, 5);
    };

    LB.nameTaken = async (name) => {
      const s = await fs.getDocs(fs.query(spieler, fs.where("name", "==", name), fs.limit(10)));
      return aktiv(s.docs).length > 0;
    };

    // Für den Verwalter: alle Einträge (zum Finden doppelter Namen) und Zusammenführen in einem Schritt
    LB.alleSpieler = async () => aktiv((await fs.getDocs(fs.query(spieler, fs.limit(500)))).docs);
    LB.verwalterZusammenfuehren = async (ziel, dups, werte) => {
      await LB.signIn();
      const b = fs.writeBatch(db);
      b.update(ref("spieler", ziel), { ...werte, updated: fs.serverTimestamp() });
      dups.forEach(id => { b.set(ref("zusammenfuehren", id), { zu: ziel }); b.update(ref("spieler", id), { zu: ziel }); });
      await b.commit();
    };

    // Duelle – allgemeines Modell (siehe firestore-regeln.txt): teil = Teilnehmer, ergebnisse = {pid: {p, r, n}}.
    // Für die App wird jedes Dokument zusätzlich in die einfache Eins-gegen-eins-Form gebracht (an, vonName, anName, vonErg, anErg).
    const duelle = fs.collection(db, "duelle");
    const zeitMs = t => (t && t.toMillis ? t.toMillis() : 0);
    const duDaten = d => {
      const x = d.data(), teil = x.teil || [], an = teil.find(p => p !== x.von) || "", namen = x.namen || {}, erg = x.ergebnisse || {};
      return { ...x, id: d.id, an, vonName: namen[x.von] || "", anName: namen[an] || "", vonErg: erg[x.von] || null, anErg: erg[an] || null,
        erstellt: zeitMs(x.erstellt) || Date.now(), ablauf: zeitMs(x.ablauf), fertig: zeitMs(x.fertig) };
    };
    LB.duellAnlegen = async (d) => {
      await LB.signIn();
      const r = await fs.addDoc(duelle, { v: 1, art: d.art || "vers", modus: d.modus || "1v1", von: d.von, teil: [d.von, d.an],
        namen: { [d.von]: d.vonName, [d.an]: d.anName }, k: d.k, seed: d.seed, ergebnisse: { [d.von]: d.vonErg },
        status: "offen", erstellt: fs.serverTimestamp(), ablauf: fs.Timestamp.fromMillis(Date.now() + 7 * 864e5) });
      return r.id;
    };
    /* eigenes Ergebnis eintragen; fertig = alle Teilnehmer haben gespielt (beim Eins-gegen-eins immer) */
    LB.duellErgebnis = async (id, erg, pid, fertig = true) => {
      await LB.signIn();
      const felder = [new fs.FieldPath("ergebnisse", pid), erg, "am", pid, "status", fertig ? "fertig" : "offen"];
      if (fertig) felder.push("fertig", fs.serverTimestamp());
      await fs.updateDoc(ref("duelle", id), ...felder);
    };
    // 6.68: Stiftshütte – Spenden je Spieler {pid, name, s: {"1".."8": Talente}}
    LB.stiftListe = async () => { const q = await fs.getDocs(fs.collection(db, "stiftshuette")); return q.docs.map(d => ({ pid: d.id, ...d.data() })); };
    LB.stiftSetzen = async (pid, name, s) => { await LB.signIn(); await fs.setDoc(ref("stiftshuette", pid), { pid, name, s, updated: fs.serverTimestamp() }); };
    // 6.73: XP-Quellen je Spieler {pid, name, alt, q:{Quelle:XP}, n:{Quelle:Anzahl}, m:{Quelle:größte Vergabe}, tag:{Tag:XP}, std:{"Tag-Std":XP}}
    LB.xpListe = async () => { const q = await fs.getDocs(fs.collection(db, "xpquellen")); return q.docs.map(d => ({ pid: d.id, ...d.data() })); };
    LB.xpSetzen = async (pid, name, x) => { await LB.signIn(); await fs.setDoc(ref("xpquellen", pid), { pid, name, alt: x.alt | 0, q: x.q || {}, n: x.n || {}, m: x.m || {}, tag: x.tag || {}, std: x.std || {}, updated: fs.serverTimestamp() }); };
    LB.duellAblehnen = async (id, pid) => { await LB.signIn(); await fs.updateDoc(ref("duelle", id), { status: "abgelehnt", am: pid }); };
    LB.duellLoeschen = async (id) => { await LB.signIn(); await fs.deleteDoc(ref("duelle", id)); };
    LB.meineDuelle = async (pid) => {
      const s = await fs.getDocs(fs.query(duelle, fs.where("teil", "array-contains", pid), fs.limit(60)));
      return s.docs.map(duDaten).sort((x, y) => y.erstellt - x.erstellt);
    };
    // „Biblionär der Woche“ (6.40): eigene Sammlung biblionaer/{Woche}_{pid} = { pid, wk, p, name, av, fr, lv }
    // (nicht im Ranglisten-Eintrag, weil dessen Regel an der Grenze von 1000 Rechenschritten ist)
    const bibliothek = fs.collection(db, "biblionaer");
    const bibZeile = d => { const x = d.data(); return { id: x.pid, name: x.name, avatar: x.av, frame: x.fr, level: x.lv || 1, bwK: x.wk, bwP: x.p || 0, p: x.p || 0 }; };
    LB.bibWocheSetzen = async (e) => {
      await LB.signIn();
      const d = { pid: e.pid, wk: e.wk, p: e.p | 0, name: String(e.name || "").slice(0, 20), lv: Math.min(e.lv | 0 || 1, 1000), updated: fs.serverTimestamp() };
      if (e.av) d.av = String(e.av).slice(0, 20); if (e.fr) d.fr = String(e.fr).slice(0, 20);
      await fs.setDoc(ref("biblionaer", e.wk + "_" + e.pid), d);
    };
    LB.bibWoche = async (week) => (await fs.getDocs(fs.query(bibliothek, fs.where("wk", "==", week), fs.limit(500)))).docs.map(bibZeile);
    LB.gegnerListe = async () => aktiv((await fs.getDocs(fs.query(spieler, fs.orderBy("xp", "desc"), fs.limit(150)))).docs);

    // Live-Listen
    const FELD = { gesamt: "xp", kette_bibel: "bestChain", kette_at: "chainAT", kette_nt: "chainNT", kette_rueck: "chainRueck", treue: "t28", bewaehrt: "bew", abzeichen: "badges", blitz: "blitz", combo: "combo", duSiege: "duS", duSpiele: "duG", bibRekord: "bib" };
    LB.watch = (kind, week, cb, onErr) => {
      if (kind === "bibWoche") return fs.onSnapshot(fs.query(bibliothek, fs.where("wk", "==", week), fs.limit(500)), snap => cb(snap.docs.map(bibZeile)), e => onErr && onErr(e));
      const q = kind === "woche"
        ? fs.query(spieler, fs.where("week", "==", week), fs.limit(500))
        : fs.query(spieler, fs.orderBy(FELD[kind] || "xp", "desc"), fs.limit(100));
      return fs.onSnapshot(q, snap => cb(aktiv(snap.docs)), e => onErr && onErr(e));
    };

    LB.ok = true;
    dispatchEvent(new Event("lb-ready"));
  } catch (e) {
    LB.error = "offline";
    dispatchEvent(new Event("lb-ready"));
  }
}
