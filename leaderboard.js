// Gemeinde-Rangliste für Bibelbuch-Quest (Firebase: anonyme Anmeldung + Firestore).
// Stellt window.LB bereit und meldet sich mit dem Ereignis "lb-ready".
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
    const { getAuth, signInAnonymously, onAuthStateChanged } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);
    const fs = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);
    const app = initializeApp(CFG);
    const auth = getAuth(app);
    const db = fs.getFirestore(app);
    const col = fs.collection(db, "spieler");

    let authReady;
    const whenAuthed = new Promise(r => (authReady = r));
    onAuthStateChanged(auth, u => { if (u) { LB.uid = u.uid; authReady(u.uid); } });

    LB.signIn = async () => { if (!LB.uid) await signInAnonymously(auth); return whenAuthed; };

    // Eigenen Spielstand hochladen
    LB.push = async (data) => {
      const uid = await LB.signIn();
      await fs.setDoc(fs.doc(db, "spieler", uid), { ...data, updated: fs.serverTimestamp() });
    };

    // Aus der Rangliste entfernen
    LB.remove = async () => {
      const uid = await LB.signIn();
      await fs.deleteDoc(fs.doc(db, "spieler", uid));
    };

    // Live-Liste: kind = "woche" | "gesamt" | "kette"
    LB.watch = (kind, week, cb, onErr) => {
      let q;
      if (kind === "woche") q = fs.query(col, fs.where("week", "==", week), fs.limit(500));
      else if (kind === "kette") q = fs.query(col, fs.orderBy("bestChain", "desc"), fs.limit(100));
      else q = fs.query(col, fs.orderBy("xp", "desc"), fs.limit(100));
      return fs.onSnapshot(q, snap => {
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        cb(rows);
      }, e => onErr && onErr(e));
    };

    // Bereits beigetretene Spieler sofort anmelden (anonym, bleibt auf dem Gerät gespeichert)
    LB.ok = true;
    dispatchEvent(new Event("lb-ready"));
  } catch (e) {
    LB.error = "offline";
    dispatchEvent(new Event("lb-ready"));
  }
}
