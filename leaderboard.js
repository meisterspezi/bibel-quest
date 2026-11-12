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
    // 9.56: Die vollständige Liste (alle Felder, z. B. Geräte und Abzeichen-Listen) braucht nur noch der Verwalter – ohne die frühere Grenze von 500.
    LB.alleSpielerVoll = async () => aktiv((await fs.getDocs(spieler)).docs);
    // 9.56 Sammel-Rangliste: Ein Job (job/sammeln.mjs, GitHub Actions) fasst alle Spieler in wenigen Dokumenten rangliste/spieler-<n> zusammen.
    //      Die App liest nur diese (1–2 Lesezugriffe statt eines je Spieler). Fehlt die Sammlung oder ist sie älter als 3 Stunden
    //      (Job steht, Regeln noch nicht veröffentlicht), wird wie bisher direkt gelesen. Die Gemeinde (g) steht gleich mit in der Zeile.
    const SAMMEL_ALT = 3 * 3600e3;
    const sammelLesen = async () => {
      const teile = (await fs.getDocs(fs.collection(db, "rangliste"))).docs.filter(d => d.id.startsWith("spieler-")).map(d => d.data());
      if (!teile.length || teile.length < (teile[0].teile | 0)) return null;
      if (teile.some(t => Date.now() - zeitMs(t.stand) > SAMMEL_ALT)) return null;
      const aus = [];
      for (const t of teile) { const p = JSON.parse(t.daten), f = p.f;
        p.z.forEach(z => { const r = {}; f.forEach((k, i) => { if (z[i] !== "") r[k] = z[i]; });
          if (r.u) r.updated = { toMillis: () => r.u };
          if (r.tb) { r.tl = []; for (let i = 30; i >= 0; i--) if (Math.floor(r.tm / 2 ** i) % 2) r.tl.push(r.tb - i); }
          aus.push(r); }); }
      return aus;
    };
    LB.sammel = false;
    LB.alleSpieler = async () => {
      try { const r = await sammelLesen(); if (r) { LB.sammel = true; return r; } } catch (e) {}
      LB.sammel = false;
      return aktiv((await fs.getDocs(fs.query(spieler, fs.limit(1000)))).docs);
    };
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
        ...(d.weih ? { opt: { w: 1 } } : {}), /* 7.3: Weihnachtsmodus */
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
    // 7.3: Weg nach Bethlehem – Gaben je Spieler {pid, name, s: {"1".."8": Talente}, g: {"1".."8": Wegzehrung}}
    LB.bethListe = async () => { const q = await fs.getDocs(fs.collection(db, "bethlehem")); return q.docs.map(d => ({ pid: d.id, ...d.data() })); };
    LB.bethSetzen = async (pid, name, s, g) => { await LB.signIn(); await fs.setDoc(ref("bethlehem", pid), { pid, name, s, g, updated: fs.serverTimestamp() }); };
    // 6.73: XP-Quellen je Spieler {pid, name, alt, q:{Quelle:XP}, n:{Quelle:Anzahl}, m:{Quelle:größte Vergabe}, tag:{Tag:XP}, std:{"Tag-Std":XP}, bel:[{z:Zeit(ms), x:XP, t:Talente, a:truhe|gestern, d:Truhen-Tag}]}
    LB.xpListe = async () => { const q = await fs.getDocs(fs.collection(db, "xpquellen")); return q.docs.map(d => ({ pid: d.id, ...d.data() })); };
    LB.xpHolen = async (pid) => { await LB.signIn(); const s = await fs.getDoc(ref("xpquellen", pid)); return s.exists() ? s.data() : null; };  // 6.81
    LB.abgleichAnfordern = async (id) => { await LB.signIn(); await fs.setDoc(ref("abgleich", id), { ts: Date.now() }); };  // 6.88 (nur Verwalter)
    LB.abgleichHolen = async (pid) => { await LB.signIn(); let t = 0; for (const id of [pid, "_alle"]) { try { const d = await fs.getDoc(ref("abgleich", id)); if (d.exists()) t = Math.max(t, +d.data().ts || 0); } catch (e) {} } return t; };  // 6.88
    LB.xpSetzen = async (pid, name, x) => { await LB.signIn(); await fs.setDoc(ref("xpquellen", pid), { pid, name, alt: x.alt | 0, q: x.q || {}, n: x.n || {}, m: x.m || {}, tag: x.tag || {}, std: x.std || {}, bel: Array.isArray(x.bel) ? x.bel.slice(-100) : [], updated: fs.serverTimestamp() }); };
    // 6.75: XP-Protokoll – je XP-Vergabe ein Dokument (nur anlegen, nie ändern): {pid, name, z:Zeit(ms, Uhr des Geräts), q:Quelle, x:XP, v:XP-Stand vorher,
    //       s:Spielzeit(Sek.), f:Fortschritt, fm:möglicher Höchstwert, d:Kurztext, ver:App-Version, gebucht:Serverzeit}. Dokument-ID: <pid>_<z>_<n>
    // 9.55: Paket – bis zu 25 Vergaben in EINEM Dokument <pid>_<z>_<n>p = {pid, name, z (erste Vergabe), ev: [{z, n, q, x, v, s, f, fm, d, ver}], gebucht}.
    //       Solange die neuen Regeln nicht veröffentlicht sind („permission-denied“), wird wie bisher einzeln gespeichert.
    let xpPaket = true;
    const xpFeld = e => { const d = { z: e.z, n: e.n | 0, q: e.q, x: e.x, v: e.v, ver: e.ver || "" }; ["s", "f", "fm"].forEach(k => { if (Number.isFinite(e[k])) d[k] = e[k] | 0; }); if (e.d) d.d = String(e.d).slice(0, 60); return d; };
    LB.xpEreignisse = async (pid, name, liste) => {
      await LB.signIn(); const fertig = [];
      liste = (liste || []).slice(0, 25); if (!liste.length) return fertig;
      if (xpPaket) {
        try { await fs.setDoc(ref("xpprotokoll", pid + "_" + liste[0].z + "_" + (liste[0].n | 0) + "p"), { pid, name, z: liste[0].z, ev: liste.map(xpFeld), gebucht: fs.serverTimestamp() }); return liste; }
        catch (err) { if (!err || err.code !== "permission-denied") return fertig; xpPaket = false; }
      }
      for (const e of liste) {
        const id = pid + "_" + e.z + "_" + (e.n | 0), d = { pid, name, z: e.z, q: e.q, x: e.x, v: e.v, ver: e.ver || "", gebucht: fs.serverTimestamp() };
        ["s", "f", "fm"].forEach(k => { if (Number.isFinite(e[k])) d[k] = e[k] | 0; }); if (e.d) d.d = String(e.d).slice(0, 60);
        try { await fs.setDoc(ref("xpprotokoll", id), d); fertig.push(e); }
        catch (err) { try { const g = await fs.getDoc(ref("xpprotokoll", id)); if (g.exists()) { fertig.push(e); continue; } } catch (e2) {} break; }  // schon da = fertig, sonst später nochmal
      }
      return fertig;
    };
    // 9.55: Pakete beim Lesen wieder in einzelne Vergaben auflösen (gleiche Form wie die alten Einzel-Dokumente); doppelte (Paket + einzeln) nur einmal
    const xpFlach = docs => { const aus = [], da = new Set();
      docs.forEach(d => { const x = d.data();
        (Array.isArray(x.ev) ? x.ev.map((e, i) => { const { n, ...r } = e; return { k: x.pid + "_" + e.z + "_" + (n | 0), e: { id: d.id + "#" + i, pid: x.pid, name: x.name, gebucht: x.gebucht, ...r } }; }) : [{ k: d.id, e: { id: d.id, ...x } }])
          .forEach(o => { if (!da.has(o.k)) { da.add(o.k); aus.push(o.e); } }); });
      return aus; };
    // Verwalter: alle Einträge der letzten Zeit (seitMs) bzw. die letzten n Einträge eines Spielers (Dokument-ID beginnt mit der Spieler-ID)
    LB.xpProtokollNeu = async (seitMs, n = 3000) => { const q = await fs.getDocs(fs.query(fs.collection(db, "xpprotokoll"), fs.where("z", ">", seitMs), fs.orderBy("z", "desc"), fs.limit(n))); return xpFlach(q.docs).sort((x, y) => y.z - x.z); };
    // 6.82: aufsteigend nach Dokument-ID (<pid>_<Zeit>_<Nr>, Zeit hat 13 Ziffern → zeitlich sortiert). Absteigend brauchte einen Index,
    //       den es nicht gibt („failed-precondition“). seitMs grenzt auf neuere Einträge ein; Ergebnis neueste zuerst.
    LB.xpProtokoll = async (pid, n = 200, seitMs = 0) => { const q = await fs.getDocs(fs.query(fs.collection(db, "xpprotokoll"), fs.where(fs.documentId(), ">=", pid + "_" + (seitMs > 0 ? String(Math.floor(seitMs)) : "")), fs.where(fs.documentId(), "<", pid + "`"), fs.orderBy(fs.documentId()), fs.limit(n))); return xpFlach(q.docs).sort((x, y) => y.z - x.z); };
    // 6.78: Schatztruhe – höchstens einmal je Spieler und Serverdatum (Dokument-ID <pid>_<JJJJMMTT>, nur anlegen)
    LB.truheBuchen = async (pid, name, tag, ver) => {
      await LB.signIn(); const id = pid + "_" + tag;
      try { const g = await fs.getDoc(ref("tagestruhe", id)); if (g.exists()) return "schon"; }
      catch (e) { return e && e.code === "permission-denied" ? "regeln" : "netz"; }
      try { await fs.setDoc(ref("tagestruhe", id), { pid, name, tag, z: Date.now(), ver: String(ver || "").slice(0, 12), gebucht: fs.serverTimestamp() }); return "ok"; }
      catch (e) { return e && e.code === "permission-denied" ? "tag" : "netz"; }
    };
    // 6.80: Wochen-Sicherung Biblionär – je Spieler und Serverwoche ein Dokument bibversuch/<pid>_<Wochennummer> (nur anlegen)
    LB.bibVersuch = async (pid, name, w, wk, ver) => {
      await LB.signIn(); const id = pid + "_" + w;
      try { const g = await fs.getDoc(ref("bibversuch", id)); if (g.exists()) return "schon"; }
      catch (e) { return e && e.code === "permission-denied" ? "regeln" : "netz"; }
      try { await fs.setDoc(ref("bibversuch", id), { pid, name, w, wk: String(wk || "").slice(0, 10), z: Date.now(), ver: String(ver || "").slice(0, 12), gebucht: fs.serverTimestamp() }); return "ok"; }
      catch (e) { return e && e.code === "permission-denied" ? "tag" : "netz"; }
    };
    LB.duellAblehnen = async (id, pid) => { await LB.signIn(); await fs.updateDoc(ref("duelle", id), { status: "abgelehnt", am: pid }); };
    LB.duellLoeschen = async (id) => { await LB.signIn(); await fs.deleteDoc(ref("duelle", id)); };
    // 9.54: Bisher „limit(60)“ ohne Sortierung – Firestore lieferte dann 60 BELIEBIGE Duelle (nach zufälliger Dokument-ID), nicht die neuesten.
    //       Wer mehr als 60 Duelle hatte, sah neue Herausforderungen, Annahmen und Ergebnisse nur noch zufällig.
    //       Jetzt: die neuesten 100 (Index duelle: teil [Arrays] + erstellt [absteigend]). Fehlt der Index noch („failed-precondition“),
    //       werden alle Duelle des Spielers geladen und hier sortiert – vollständig, kostet aber mehr Lesezugriffe.
    const DU_MAX = 100; let duIndex = true;
    LB.meineDuelle = async (pid) => {
      const meine = fs.where("teil", "array-contains", pid); let s = null;
      if (duIndex) try { s = await fs.getDocs(fs.query(duelle, meine, fs.orderBy("erstellt", "desc"), fs.limit(DU_MAX))); }
        catch (e) { if (!e || e.code !== "failed-precondition") throw e; duIndex = false; LB.duIndexFehlt = true; console.warn("Duelle: Index fehlt – lade alle.", e.message); }
      if (!s) s = await fs.getDocs(fs.query(duelle, meine));
      return s.docs.map(duDaten).sort((x, y) => y.erstellt - x.erstellt).slice(0, DU_MAX);
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
    LB.bibWoche = async (week) => (await fs.getDocs(fs.query(bibliothek, fs.where("wk", "==", week), fs.limit(200)))).docs.map(bibZeile);
    LB.gegnerListe = async () => aktiv((await fs.getDocs(fs.query(spieler, fs.orderBy("xp", "desc"), fs.limit(150)))).docs);

    // 9.0 Gemeinden: Liste legt nur der Verwalter an (Sammlung gemeinden); jeder Spieler ordnet sich über mitglied/{pid} einer Gemeinde zu
    LB.gemListe = async () => (await fs.getDocs(fs.collection(db, "gemeinden"))).docs.map(d => ({ id: d.id, ...d.data() }));
    const mitgliedDirekt = async () => (await fs.getDocs(fs.collection(db, "mitglied"))).docs.map(d => ({ id: d.id, g: d.data().g }));
    LB.mitgliedListe = mitgliedDirekt;
    LB.gemSetzen = async (pid, name, g, durch) => {
      await LB.signIn();
      let vorher = null; try { const d = await fs.getDoc(ref("mitglied", pid)); if (d.exists()) vorher = String(d.data().g || ""); } catch (e) {}
      await fs.setDoc(ref("mitglied", pid), { pid, name, g, updated: fs.serverTimestamp() });
      /* 9.28 Protokoll: jede Änderung der Zuordnung mit Server-Zeitstempel (Sammlung gemlog, nur der Verwalter liest) */
      if (vorher !== g) { try { await fs.addDoc(fs.collection(db, "gemlog"), { pid, name: String(name || "").slice(0, 20), von: vorher || "", nach: g, durch: durch === "verwalter" ? "verwalter" : "spieler", zeit: fs.serverTimestamp() }); } catch (e) {} }
    };
    LB.gemProtokoll = async (n) => (await fs.getDocs(fs.query(fs.collection(db, "gemlog"), fs.orderBy("zeit", "desc"), fs.limit(n || 300)))).docs.map(d => { const x = d.data(); return { id: d.id, pid: x.pid, name: x.name || "", von: x.von || "", nach: x.nach || "", durch: x.durch || "spieler", zeit: x.zeit && x.zeit.toMillis ? x.zeit.toMillis() : 0 }; });
    LB.gemAnlegen = async (id, name, ord, extra) => { await LB.signIn(); const d = { name, ord: ord | 0 }; if (extra && extra.pw) d.pw = String(extra.pw).slice(0, 30); if (extra && extra.logo) d.logo = String(extra.logo).slice(0, 30000); if (extra && extra.pruef) d.pruef = true; await fs.setDoc(ref("gemeinden", id), d); };
    // 9.11 Freischaltung: Anträge (antraege/{pid}), Freigaben je Gerät (freigabe/{uid}) und der Joker-Schlüssel (geheim/joker)
    LB.antragSenden = async (pid, name, g) => { await LB.signIn(); await fs.setDoc(ref("antraege", pid), { pid, name: String(name || "").slice(0, 20), g, status: "offen", zeit: fs.serverTimestamp() }); };
    LB.antragHolen = async (pid) => { const d = await fs.getDoc(ref("antraege", pid)); return d.exists() ? { id: d.id, ...d.data() } : null; };
    LB.antragListe = async () => (await fs.getDocs(fs.query(fs.collection(db, "antraege"), fs.limit(200)))).docs.map(d => { const x = d.data(); return { id: d.id, pid: x.pid, name: x.name || "", g: x.g || "", status: x.status || "offen", zeit: x.zeit && x.zeit.toMillis ? x.zeit.toMillis() : 0 }; });
    LB.antragAblehnen = async (pid) => { await LB.signIn(); await fs.updateDoc(ref("antraege", pid), { status: "abgelehnt" }); };
    LB.antragLoeschen = async (pid) => { await LB.signIn(); await fs.deleteDoc(ref("antraege", pid)); };
    LB.freigabeSetzen = async (uids, g, pid) => { await LB.signIn(); for (const u of uids) await fs.setDoc(ref("freigabe", u), { g, pid, zeit: fs.serverTimestamp() }); };
    LB.freigabeEntfernen = async (uids) => { await LB.signIn(); for (const u of uids) await fs.deleteDoc(ref("freigabe", u)); };
    LB.jokerSchluessel = async () => { await LB.signIn(); const d = await fs.getDoc(ref("geheim", "joker")); return d.exists() ? String(d.data().k || "") : ""; };
    LB.jokerSchluesselSetzen = async (k) => { await LB.signIn(); await fs.setDoc(ref("geheim", "joker"), { k: String(k).slice(0, 120) }); };
    // 9.11 Gespräche zwischen Verwalter und einzelnen Spielern (Sammlung dialoge): von = "dev" (Verwalter) oder "spieler"
    const dlgZeile = d => { const x = d.data(); return { id: d.id, pid: x.pid, name: x.name || "", von: x.von, text: x.text || "", zeit: x.zeit && x.zeit.toMillis ? x.zeit.toMillis() : 0 }; };
    LB.dialogHolen = async (pid) => (await fs.getDocs(fs.query(fs.collection(db, "dialoge"), fs.where("pid", "==", pid), fs.limit(200)))).docs.map(dlgZeile).sort((a, b) => a.zeit - b.zeit);
    LB.dialogAlle = async () => (await fs.getDocs(fs.query(fs.collection(db, "dialoge"), fs.limit(400)))).docs.map(dlgZeile).sort((a, b) => a.zeit - b.zeit);
    LB.dialogSenden = async (pid, name, von, text) => { await LB.signIn(); await fs.addDoc(fs.collection(db, "dialoge"), { pid, name: String(name || "").slice(0, 20), von, text: String(text).slice(0, 1000), zeit: fs.serverTimestamp() }); };
    LB.dialogLoeschen = async (id) => { await LB.signIn(); await fs.deleteDoc(ref("dialoge", id)); };
    LB.gemLoeschen = async (id) => { await LB.signIn(); await fs.deleteDoc(ref("gemeinden", id)); };

    // 9.7 Nachrichten des Entwicklers an die Spieler (Patchnotes u. Ä.): nur der Verwalter schreibt, angemeldete Spieler lesen
    LB.nachrichtenListe = async () => (await fs.getDocs(fs.query(fs.collection(db, "nachrichten"), fs.orderBy("zeit", "desc"), fs.limit(30)))).docs.map(d => { const x = d.data(); return { id: d.id, art: x.art || "info", titel: x.titel || "", text: x.text || "", g: x.g || "alle", ver: x.ver || "", zeit: x.zeit && x.zeit.toMillis ? x.zeit.toMillis() : 0 }; });
    LB.nachrichtSenden = async (n) => { await LB.signIn(); const d = { art: n.art === "patch" ? "patch" : "info", titel: String(n.titel).slice(0, 60), text: String(n.text).slice(0, 2000), g: String(n.g || "alle").slice(0, 30), zeit: fs.serverTimestamp() }; if (n.ver) d.ver = String(n.ver).slice(0, 20); await fs.addDoc(fs.collection(db, "nachrichten"), d); };
    LB.nachrichtLoeschen = async (id) => { await LB.signIn(); await fs.deleteDoc(ref("nachrichten", id)); };

    // 9.52 Zwischenspeicher (localStorage, übersteht Neuladen): große Listen nur in Abständen vom Server holen.
    // Firestore-Zeitstempel werden als {__ts} gespeichert und beim Lesen wieder mit toMillis() versehen.
    const zsAus = v => Array.isArray(v) ? v.map(zsAus) : v && typeof v === "object" ? (v.toMillis ? { __ts: v.toMillis() } : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, zsAus(x)]))) : v;
    const zsEin = v => Array.isArray(v) ? v.map(zsEin) : v && typeof v === "object" ? ("__ts" in v ? { toMillis: () => v.__ts, seconds: Math.floor(v.__ts / 1000) } : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, zsEin(x)]))) : v;
    const ZS = "bq-zs2:";
    const zsHolen = (k, ttl) => { try { const c = JSON.parse(localStorage.getItem(ZS + k) || "null"); if (c && Date.now() - c.t < ttl && Array.isArray(c.d)) return zsEin(c.d); } catch (e) {} return null; };
    const zsMerken = (k, d) => { try { localStorage.setItem(ZS + k, JSON.stringify({ t: Date.now(), d: zsAus(d) })); } catch (e) { zsLeeren(); } };
    const zsWeg = (...namen) => { try { Object.keys(localStorage).filter(k => k.startsWith(ZS) && (!namen.length || namen.some(n => k.slice(ZS.length).startsWith(n)))).forEach(k => localStorage.removeItem(k)); } catch (e) {} };
    const zsLeeren = () => zsWeg();
    try { Object.keys(localStorage).filter(k => k.startsWith("bq-zs:")).forEach(k => localStorage.removeItem(k)); } catch (e) {} // alter Speicher (9.52-Entwurf)
    LB.zsLeeren = zsLeeren;
    const MIN = 60000;
    const zwischen = (name, ttl) => {
      const f = LB[name]; if (!f) return;
      LB[name] = async (frisch) => {
        if (!frisch) { const c = zsHolen(name, ttl); if (c) return c; }
        const d = await f(); zsMerken(name, d); return d;
      };
    };
    // Spielerliste 30 Min. (9.53; daraus auch Gegnerliste und alle Ranglisten), Gemeinden/Mitglieder/Nachrichten 60 Min., Advent 15 Min., Verwalter-Listen 30 Min. (nicht zeitkritisch)
    Object.entries({ alleSpieler: 30, alleSpielerVoll: 30, mitgliedListe: 60, gemListe: 60, nachrichtenListe: 60, bethListe: 15,
      feedbackListe: 30, antragListe: 30, dialogAlle: 30, xpListe: 30 }).forEach(([n, m]) => zwischen(n, m * MIN));
    // Nach eigenen Änderungen die betroffene Liste neu holen, damit man sie sofort sieht
    const nachher = (name, ...listen) => { const f = LB[name]; if (!f) return; LB[name] = async (...a) => { const r = await f(...a); zsWeg(...listen); return r; }; };
    nachher("feedbackErledigt", "feedbackListe"); nachher("feedbackLoeschen", "feedbackListe");
    nachher("antragSenden", "antragListe"); nachher("antragAblehnen", "antragListe"); nachher("antragLoeschen", "antragListe");
    nachher("freigabeSetzen", "antragListe", "mitgliedListe"); nachher("freigabeEntfernen", "mitgliedListe");
    nachher("gemSetzen", "mitgliedListe"); nachher("gemAnlegen", "gemListe"); nachher("gemLoeschen", "gemListe", "mitgliedListe");
    nachher("dialogSenden", "dialogAlle"); nachher("dialogLoeschen", "dialogAlle");
    nachher("nachrichtSenden", "nachrichtenListe"); nachher("nachrichtLoeschen", "nachrichtenListe");
    nachher("bibWocheSetzen", "rl:bibWoche"); nachher("verwalterZusammenfuehren", "alleSpieler", "rl:"); /* „alleSpieler“ trifft auch alleSpielerVoll (gleicher Anfang) */
    // 9.56: Gemeinde-Zuordnungen kommen aus der Sammel-Rangliste (kein eigener Abruf); „frisch“ (Verwalter) und ohne Sammel-Rangliste direkt
    const mitglied0 = LB.mitgliedListe;
    LB.mitgliedListe = async (frisch) => {
      if (!frisch) { try { const alle = await LB.alleSpieler(); if (LB.sammel) return alle.filter(r => r.g).map(r => ({ id: r.id, g: r.g })); } catch (e) {} }
      return mitglied0(frisch);
    };
    // Gegnerliste = die 150 Spieler mit den meisten XP aus der gemeinsamen Spielerliste (keine eigene Abfrage mehr)
    LB.gegnerListe = async (frisch) => (await LB.alleSpieler(frisch)).slice().sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 150);

    // Ranglisten (bis 9.51 Live-Listen mit onSnapshot – jeder Wechsel der Rangliste las bis zu 500 Dokumente neu, jede Änderung
    // eines Spielers ging an alle offenen Listen). Jetzt: einmal lesen, 5 Minuten merken; der eigene Eintrag wird mit dem
    // zuletzt gesendeten Stand überlagert, damit man den eigenen Fortschritt sofort sieht.
    const FELD = { gesamt: "xp", kette_bibel: "bestChain", kette_at: "chainAT", kette_nt: "chainNT", kette_rueck: "chainRueck", treue: "t28", bewaehrt: "bew", abzeichen: "badges", blitz: "blitz", combo: "combo", duSiege: "duS", duSpiele: "duG", bibRekord: "bib" };
    let eigen = null;
    const push0 = LB.push; LB.push = async (pid, data, opts) => { const r = await push0(pid, data, opts); eigen = { pid, d: data }; return r; };
    LB.eigenMerken = (pid, data) => { eigen = { pid, d: data }; };  // 9.55: eigener Fortschritt in den Ranglisten, auch wenn seltener gespeichert wird
    const RL_TTL = 15 * MIN; /* 9.53: Biblionär-Woche */
    LB.watch = (kind, week, cb, onErr) => {
      let weg = false;
      const k = "rl:" + kind + ":" + (kind === "woche" || kind === "bibWoche" ? week : "");
      const geben = rows => {
        if (weg) return;
        if (eigen && kind !== "bibWoche") {
          const e = eigen, mitDabei = kind !== "woche" || e.d.week === week;
          rows = rows.map(r => r.id === e.pid ? Object.assign({}, r, e.d) : r);
          if (mitDabei && !rows.some(r => r.id === e.pid)) rows = rows.concat([Object.assign({ id: e.pid }, e.d)]);
        }
        cb(rows);
      };
      const c = kind === "bibWoche" ? zsHolen(k, RL_TTL) : null;
      if (c) setTimeout(() => geben(c), 0);
      else (async () => {
        try {
          let rows;
          if (kind === "bibWoche") rows = (await fs.getDocs(fs.query(bibliothek, fs.where("wk", "==", week), fs.limit(200)))).docs.map(bibZeile);
          else { /* aus der gemeinsamen Spielerliste (eine Abfrage für alle Ranglisten) – wie die Datenbank-Sortierung: nur Einträge mit dem Feld */
            const f = FELD[kind] || "xp", alle = await LB.alleSpieler();
            rows = kind === "woche" ? alle.filter(r => r.week === week) : alle.filter(r => r[f] !== undefined).sort((a, b) => (b[f] || 0) - (a[f] || 0)).slice(0, 100);
          }
          if (kind === "bibWoche") zsMerken(k, rows); geben(rows);
        } catch (e) { if (!weg && onErr) onErr(e); }
      })();
      return () => { weg = true; };
    };

    LB.ok = true;
    dispatchEvent(new Event("lb-ready"));
  } catch (e) {
    LB.error = "offline";
    dispatchEvent(new Event("lb-ready"));
  }
}
