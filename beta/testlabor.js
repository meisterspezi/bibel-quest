/* Bibelbuch-Quest – 9.93: Testlabor (nur in der Beta)
   Zum Ausprobieren neuer Events und des Sammelalbums ohne Vorteile für Live:
   - Testdatum (sessionStorage „bq-ed-datum“, gilt bis die App geschlossen wird): Editionen und Rückblick nach diesem Datum.
     Mit Testdatum sind Biblionär-Runden der Editionen Vorschau-Runden (keine XP, keine Zähler, keine Ranglisten-Einträge).
   - Sammelalbum der Beta liegt getrennt unter S.smBeta (Live nutzt S.sm2) – Manna, Karten und Krüge hier zählen nur in der Beta,
     Gruppen-Talente werden in der Beta nicht gutgeschrieben, die Goldkarten-Zahl geht nicht in die Rangliste. */
const TL_DATUM_KEY = "bq-ed-datum";
function testDatum() { try { return BETA ? sessionStorage.getItem(TL_DATUM_KEY) || "" : ""; } catch (e) { return ""; } }
function testDatumAktiv() { return !!testDatum(); }
function testDatumSetzen(t) { try { if (t) sessionStorage.setItem(TL_DATUM_KEY, t); else sessionStorage.removeItem(TL_DATUM_KEY); } catch (e) {} tlMarke(); }
function tlMarke() { const b = document.getElementById("betaMarke"); if (b) b.textContent = testDatumAktiv() ? "BETA · " + testDatum().slice(8, 10) + "." + testDatum().slice(5, 7) + "." : "BETA"; }
if (typeof BETA !== "undefined" && BETA) addEventListener("DOMContentLoaded", () => setTimeout(tlMarke, 50));

(function () {
  if (typeof BETA === "undefined" || !BETA) return;
  TAB_VON.testlabor = "";
  const jahr = () => { const d = new Date(); return d.getMonth() >= 9 ? d.getFullYear() : d.getFullYear() - 1; }; /* Advent des laufenden Kirchenjahres */
  const advent1 = j => { const w = new Date(j, 11, 24), so = new Date(j, 11, 24 - w.getDay()); so.setDate(so.getDate() - 21); return so; }; /* 4. Advent = Sonntag am/vor 24.12. */
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  function daten() { const j = jahr(), a = advent1(j), vor = new Date(a); vor.setDate(a.getDate() - 1);
    return [["", "Echtes Datum"], [iso(vor), "Tag vor dem 1. Advent"], [iso(a), "1. Advent – Start Weihnachts-Ausgabe"], [`${j}-12-24`, "Heiligabend"],
      [`${j}-12-27`, "27.12. – Jahresrückblick"], [`${j + 1}-01-06`, "6.1. – letzter Tag"], [`${j + 1}-01-07`, "7.1. – alles vorbei"]]; }
  const ALBUM_STAND = {
    leer: () => Array(66).fill(0),
    anfang: () => Array.from({ length: 66 }, (_, i) => (i * 37 % 66) < 12 ? 1 : 0),
    mitte: () => Array.from({ length: 66 }, (_, i) => { const x = (i * 37 % 66) / 66; return x < .2 ? 0 : x < .7 ? 1 : x < .92 ? 2 : 3; }),
    fastsilber: () => Array.from({ length: 66 }, (_, i) => i === 40 ? 1 : (i * 37 % 66) / 66 < .25 ? 3 : 2),
    fastgold: () => Array.from({ length: 66 }, (_, i) => i === 42 ? 2 : 3),
    gold: () => Array(66).fill(3)
  };
  VIEWS.testlabor = () => {
    const m = smInit(), td = testDatum();
    const knopf = (id, txt, klein) => `<button class="btn${klein ? "" : " tl-k"}" data-tl="${id}">${txt}</button>`;
    screen.innerHTML = `${backBtn("home", "Start")}
      <h1 class="tl-t">Testlabor <small>nur in der Beta</small></h1>
      <p class="tl-hinw">Alles hier dient nur zum Testen. Das <b>Sammelalbum der Beta ist getrennt</b> von deinem echten Spielstand – Manna, Karten und Krüge zählen nicht für Live, Gruppen-Talente werden nicht gutgeschrieben und nichts davon erscheint in der Rangliste.</p>
      <section class="tl-box"><h2>Datum für Events</h2>
        <p class="tl-ist">Jetzt: <b>${td ? datumVon(dayNum(td)).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : "echtes Datum"}</b></p>
        <div class="tl-liste">${daten().map(([d, t]) => `<button class="tl-z${d === td ? " an" : ""}" data-datum="${d}"><span>${t}</span><small>${d ? datumVon(dayNum(d)).toLocaleDateString("de-DE", { day: "numeric", month: "short" }) : "–"}</small></button>`).join("")}</div>
        <p class="small muted">Gilt, bis du die App schließt. Biblionär-Runden der Weihnachts-Ausgabe sind mit Testdatum Vorschau-Runden: keine XP, keine Talente, kein Ranglisten-Eintrag.</p>
        <div class="tl-reihe">${knopf("edneu", "Weihnachts-Hinweise neu zeigen", 1)}${knopf("rbneu", "Rückblick-Fenster neu zeigen", 1)}</div>
      </section>
      <section class="tl-box"><h2>Sammelalbum (Beta)</h2>
        <p class="tl-ist">${smGefunden()} / 66 gefunden · ${smGlanz()} in Gold · <b>${smGold()} Manna</b> · Krüge heute ${smHeuteKruege()}/${SM_KRUG_TAG} · Geschenke ${smGeschenke()}</p>
        <div class="tl-reihe">${knopf("m10", "+10 Manna")}${knopf("m50", "+50 Manna")}${knopf("m0", "Manna auf 0")}</div>
        <div class="tl-reihe">${knopf("tag", "Krüge heute auf 0")}${knopf("geschenk", "+1 Silberkrug (Geschenk)")}${knopf("treue", "Nächster Krug: sicher Gold")}${knopf("bwpreis", "Preisübergabe Platz 1", 1)}${knopf("bwpreis2", "Platz 2", 1)}${knopf("bwpreis3", "Platz 3", 1)}${knopf("ggold", "+1 Goldkrug (Preis)")}${knopf("gbronze", "+1 Bronzekrug (Preis)")}</div>
        <div class="tl-reihe">${knopf("beutel", "Tauschbeutel füllen")}${knopf("beutel0", "Tauschbeutel leeren")}</div>
        <p class="tl-ist" style="margin-top:6px">Album-Stand setzen:</p>
        <div class="tl-reihe">${knopf("a:leer", "Leer", 1)}${knopf("a:anfang", "Anfang", 1)}${knopf("a:mitte", "Mitte", 1)}${knopf("a:fastsilber", "Fast alles Silber", 1)}${knopf("a:fastgold", "1 fehlt bis Gold", 1)}${knopf("a:gold", "Alles Gold", 1)}</div>
        <div class="tl-reihe">${knopf("einf", "Ankündigung + Tour neu", 1)}${knopf("reset", "Beta-Album ganz zurücksetzen", 1)}</div>
        <div class="tl-reihe">${knopf("album", "Sammelalbum öffnen")}${knopf("rb", "Rückblick öffnen")}</div>
      </section>
      <section class="tl-box"><h2>Version</h2><p class="tl-ist">${typeof VERSION_TEXT !== "undefined" ? VERSION_TEXT : APP_VERSION}</p>${knopf("kanal", "Zur Live-Version wechseln …", 1)}</section>`;
    wireGo();
    screen.querySelectorAll("[data-datum]").forEach(b => b.onclick = () => { SFX.tap(); testDatumSetzen(b.dataset.datum); toast(b.dataset.datum ? "Testdatum gesetzt" : "Echtes Datum"); try { tabbarSetzen(); } catch (e) {} VIEWS.testlabor(); });
    screen.querySelectorAll("[data-tl]").forEach(b => b.onclick = () => {
      SFX.tap(); const a = b.dataset.tl, m = smInit(); let msg = "";
      if (a === "m10" || a === "m50") { m.gv += a === "m10" ? 10 : 50; msg = "Manna gutgeschrieben (nur Beta)"; }
      if (a === "m0") { m.ga = m.gv; msg = "Manna auf 0"; }
      if (a === "tag") { m.kn = 0; msg = "Heute wieder 3 Krüge"; }
      if (a === "bwpreis" || a === "bwpreis2" || a === "bwpreis3") { bibPreisUebergabe(weekKey(), 900000, true, 0, a === "bwpreis" ? 1 : +a.slice(-1)); return; }
      if (a === "ggold") { m.kgg = Math.min(m.kgg, smPreisZahl(1)) - 1; msg = "Goldkrug bereit (nur Beta)"; }
      if (a === "gbronze") { m.kgb = Math.min(m.kgb, smPreisZahl(3)) - 1; msg = "Bronzekrug bereit (nur Beta)"; }
      if (a === "geschenk") { m.kga = Math.min(m.kga, smGeschenkeGesamt()) - 1; msg = "Geschenk-Krug bereit"; }
      if (a === "treue") { m.kz = Math.ceil((m.kz + 1) / SM_TREUE) * SM_TREUE - 1; msg = "Der nächste Krug hat sicher Gold"; }
      if (a === "beutel") { [1, 2].forEach(r => { m.be[r] = smBeutel(r) + m.ba[r] + SM_TAUSCH[r]; }); msg = "Tauschbeutel voll"; }
      if (a === "beutel0") { [1, 2].forEach(r => { m.ba[r] = m.be[r]; }); msg = "Tauschbeutel leer"; }
      if (a.startsWith("a:")) { m.album = ALBUM_STAND[a.slice(2)](); m.lohn = []; m.offen = null; msg = "Album-Stand gesetzt"; }
      if (a === "einf") { m.ah = 0; m.tour = 0; save(); go("home"); return; }
      if (a === "reset") { delete S[SM_KEY]; smInit(); msg = "Beta-Album zurückgesetzt (mit Startkrug)"; }
      if (a === "edneu") { try { localStorage.removeItem(LS + ":edneu"); } catch (e) {} save(); go("home"); return; }
      if (a === "rbneu") { m.rb = {}; save(); go("home"); return; }
      if (a === "album") { go("album"); return; }
      if (a === "rb") { rbSeite = 0; go("rueckblick"); return; }
      if (a === "kanal") { kanalFrage(); return; }
      save(); smHud(0); if (msg) toast(msg); VIEWS.testlabor();
    });
  };
})();
