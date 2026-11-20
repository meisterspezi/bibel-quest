/* 10.27: Vertrauenswürdige Uhr – Uhr umstellen, Zeitzone wechseln oder offline vorstellen bringt keine Vorteile mehr.
   Lädt als ERSTES App-Skript (vor qrcode.js/daten.js), damit alle anderen Skripte (auch Firebase) diese Uhr benutzen.

   1. Serverzeit: Beim Start und bei jeder Rückkehr in die App holt die App die Uhrzeit vom Server (Date-Kopf von GitHub Pages,
      wie schon bei der Schatztruhe). Danach läuft die Zeit mit performance.now() weiter – diese Stoppuhr merkt nichts davon,
      wenn jemand die Handy-Uhr verstellt. Date.now() und new Date() liefern überall diese Zeit (window.Date wird ersetzt).
   2. Ohne Server (offline): Zeit = Handy-Uhr + zuletzt gemessene Abweichung, nie früher als die letzte bestätigte Serverzeit.
      Für den KALENDER (heute, Woche, Monat) gilt offline höchstens das Ende des letzten bestätigten Tages –
      ein neuer Tag (neue Tagesaufgaben, neue Krüge, Wiederholungen wieder voll …) beginnt erst mit Internet.
   3. Kalender immer in deutscher Zeit (Europe/Berlin): Zeitzone am Handy umstellen ändert den Tag nicht.
   4. Der Kalender läuft nur vorwärts (nie vor die letzte bestätigte Serverzeit).
   Testen: auf localhost/file:// ohne Begrenzung (Entwickler-Werkzeuge dürfen die Zeit weiter verstellen). */
(function () {
  const D0 = Date, P = () => performance.now(), LSK = "bq-uhr";
  const lokal = location.protocol === "file:" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  let st = {}; try { st = JSON.parse(localStorage.getItem(LSK) || "{}") || {}; } catch (e) {}
  let off = Number.isFinite(+st.off) ? +st.off : 0, letzte = Number.isFinite(+st.l) ? +st.l : 0;
  let basis = { ms: Math.max(D0.now() + off, letzte), perf: P() }, gesichert = false;
  const jetzt = () => basis.ms + (P() - basis.perf);
  function merken() {
    if (!gesichert) return;
    try { const t = jetzt(); letzte = Math.max(letzte, t); off = t - D0.now(); localStorage.setItem(LSK, JSON.stringify({ off: Math.round(off), l: Math.round(letzte) })); } catch (e) {}
  }
  class BQDate extends D0 {
    constructor(...a) { if (a.length) super(...a); else super(jetzt()); }
    static now() { return Math.floor(jetzt()); }
  }
  window.Date = BQDate;

  const hoerer = [];
  let laeuft = null;
  function holen() {
    if (laeuft) return laeuft;
    laeuft = (async () => {
      try {
        const t0 = P(), r = await fetch(location.pathname, { method: "HEAD", cache: "no-store" }), t1 = P();
        const d = D0.parse(r.headers.get("date") || "");
        if (d > 0) {
          const erst = !gesichert;
          basis = { ms: d + 500, perf: (t0 + t1) / 2 }; /* Date-Kopf ist auf Sekunden abgerundet → +0,5 s */
          gesichert = true; merken();
          hoerer.forEach(f => { try { f(erst); } catch (e) {} });
          return true;
        }
      } catch (e) {}
      return false;
    })();
    laeuft.finally(() => { laeuft = null; });
    return laeuft;
  }

  /* Deutsche Wanduhr für einen Zeitpunkt */
  const FMT = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23" });
  function berlin(ms) { const p = {}; FMT.formatToParts(new D0(ms)).forEach(x => { if (x.type !== "literal") p[x.type] = +x.value; }); return p; }
  const tagEnde = ms => { const p = berlin(ms); return ms + ((23 - p.hour) * 3600 + (59 - p.minute) * 60 + (59 - p.second)) * 1000 + 999; };
  /* Zeitpunkt für Kalender-Fragen (heute, Woche, Monat) */
  function kalMs() {
    const t = jetzt();
    if (gesichert || lokal || !letzte) return t;
    return Math.min(t, tagEnde(letzte));
  }
  /* Datum-Objekt, dessen lokale Werte (getDate, getHours …) die deutsche Wanduhr zeigen – für dstr(), weekKey() usw. */
  function wand(ms) { const p = berlin(ms); return new BQDate(p.year, p.month - 1, p.day, p.hour, p.minute, p.second); }
  const kalDatum = () => (lokal ? new BQDate() : wand(kalMs()));

  window.BQ_UHR = {
    jetzt: () => Math.floor(jetzt()),
    gesichert: () => gesichert,
    lokal, holen, kalMs, kalDatum, berlin,
    wand: x => (lokal ? new BQDate(x) : wand(x instanceof D0 ? x.getTime() : typeof x === "number" ? x : new D0(x).getTime())),
    beiNeu: f => hoerer.push(f)
  };
  holen();
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") holen(); else merken(); });
  addEventListener("pagehide", merken);
  setInterval(merken, 60000);
})();
