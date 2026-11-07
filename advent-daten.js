/* =====================================================================
   Advent 2026 – Inhalte und Einstellungen (Version 7.3)
   Alles, was man später gern anpassen möchte, steht hier oben: Starttermine, Belohnungen, Ziele der Stationen.
   Die Logik und die Ansichten stehen in advent.js. Beide Dateien werden vor spiel.js geladen.
   Bibelstellen: Schlachter 2000 – Texte sind sinngemäß wiedergegeben, die Stellen sind angegeben.
   ===================================================================== */

/* ---------- Termine ---------- */
const ADV_START = "2026-11-29";        /* 1. Advent: Krippe, Weihnachts-Biblionär und Duell-Aktion beginnen */
const KAL_START = "2026-12-01";        /* Adventskalender: Türchen 1 */
const ADV_KRIPPE = "2026-12-24";       /* Heiligabend: das Kind liegt in der Krippe */
const ADV_SICHT_BIS = "2027-01-06";    /* so lange bleibt der Advent in der App sichtbar */

/* ---------- Die Krippe wächst: nach dem biblischen Zeitplan (7.6) ----------
   Jede Figur erscheint an einem festen Tag, passend zur Geschichte und zum Adventskalender (Feld d in BETH). Das Kind kommt an Heiligabend (ADV_KRIPPE),
   die Weisen erst am 6. Januar (Epiphanias). Adventslichter ändern den Zeitplan NICHT – sie schmücken die Krippe (Lichterglanz für alle)
   und schalten persönliche Belohnungen frei (Rahmen, Titel). */
/* Adventslichter gibt es nur in der Adventszeit: Jede Spielerin und jeder Spieler verdient sie bei allem, was XP bringt
   (Lernen, Spielen, Biblionär, Duelle, Tagesaufgaben …) und im Adventskalender. Gespendet wird nur mit Lichtern – nie mit Talenten. */
const ADV_LICHT_XP = 10;               /* 1 Adventslicht je 10 verdiente XP */
const ADV_LICHT_NAME = "Adventslichter";
const ADV_GLANZ = [150, 400, 800, 1500, 2500];   /* Lichter der ganzen Gemeinde → Glanzstufe 1–5 der Krippe (Lichterkette, Funkeln, Sternschnuppe …) */
const ADV_SPENDER = 50;                /* so viele eigene Lichter für Rahmen „Lichterglanz“ und Titel „Lichtträger“ */
const BETH_TAGESGABE = 5;              /* kostenlose „Wegzehrung“: je Spieler und Tag ein kleines Licht für die Krippe */
/* d = Tag, an dem die Figur erscheint, f = Figur im Bild (siehe advent.js), ver = Verheißung, erf = Erfüllung. */
const BETH = [
  { f: "maria", n: "Maria", kurz: "Maria", v: "Lukas 1,26-38", d: "2026-12-11",
    k: "Der Engel Gabriel kommt zu Maria in Nazareth: Du wirst einen Sohn bekommen und ihn Jesus nennen. Maria antwortet: Siehe, ich bin des Herrn Magd.",
    ver: ["Jesaja 7,14", "Eine junge Frau wird schwanger werden und einen Sohn gebären – sein Name: Immanuel, Gott mit uns."], erf: ["Matthäus 1,22-23", "Das ist geschehen, damit sich erfüllt, was der Herr durch den Propheten gesagt hat."] },
  { f: "josef", n: "Josef", kurz: "Josef", v: "Matthäus 1,18-25", d: "2026-12-15",
    k: "Josef will sich erst von Maria trennen. Da sagt ihm ein Engel im Traum: Fürchte dich nicht, nimm Maria zu dir – das Kind ist vom Heiligen Geist. Josef gehorcht.",
    ver: ["Jesaja 11,1", "Ein Reis wird hervorgehen aus dem Stamm Isais – aus Davids Familie kommt der Retter."], erf: ["Matthäus 1,20", "Der Engel nennt Josef „Sohn Davids“ – Jesus gehört zum Königshaus."] },
  { f: "stall", n: "Der Stall in Bethlehem", kurz: "Stall", v: "Lukas 2,4-7", d: "2026-12-19",
    k: "Josef stammt aus dem Haus Davids, darum zieht er nach Bethlehem. In der Herberge ist kein Platz – ein einfacher Stall wird zum Zuhause für diese Nacht.",
    ver: ["Micha 5,1", "Du, Bethlehem, bist klein unter den Städten Judas – aus dir soll der kommen, der Herrscher über Israel sein wird."], erf: ["Lukas 2,4-7", "Jesus wird in Bethlehem, der Stadt Davids, geboren."] },
  { f: "schafe", n: "Die Schafe auf dem Feld", kurz: "Schafe", v: "Lukas 2,8", d: "2026-12-20",
    k: "Draußen vor der Stadt hüten Hirten ihre Herden bei Nacht. Schafe und Lämmer gehören in Bethlehem zum Alltag – und zu den Opfern im Tempel.",
    ver: ["Jesaja 53,7", "Wie ein Lamm, das zur Schlachtung geführt wird – der Knecht Gottes trägt unsere Schuld."], erf: ["Johannes 1,29", "Johannes der Täufer sieht Jesus und sagt: Siehe, das Lamm Gottes, das die Sünde der Welt trägt!"] },
  { f: "engel", n: "Der Engel und das Heer des Himmels", kurz: "Engel", v: "Lukas 2,9-14", d: "2026-12-21",
    k: "Ein Engel des Herrn tritt zu den Hirten, Gottes Licht umstrahlt sie. Dann loben viele Engel Gott: Ehre sei Gott in der Höhe und Friede auf Erden!",
    ver: ["Jesaja 9,5", "Uns ist ein Kind geboren – sein Name ist Wunder-Rat, Gott-Held, Ewig-Vater, Friedefürst."], erf: ["Lukas 2,11.14", "Euch ist heute der Retter geboren, der Christus, der Herr – und Friede auf Erden."] },
  { f: "stern", n: "Der Stern über dem Stall", kurz: "Stern", v: "Matthäus 2,1-2", d: "2026-12-23",
    k: "Weise aus dem Morgenland sehen einen Stern aufgehen und machen sich auf den Weg: Wo ist der neugeborene König der Juden?",
    ver: ["4. Mose 24,17", "Ein Stern geht auf aus Jakob, ein Zepter erhebt sich aus Israel."], erf: ["Matthäus 2,2", "Wir haben seinen Stern gesehen und sind gekommen, ihn anzubeten."] },
  { f: "hirten", n: "Die Hirten", kurz: "Hirten", v: "Lukas 2,8-20", d: "2026-12-25",
    k: "Nach der Botschaft der Engel laufen die Hirten los, finden das Kind in der Krippe und erzählen es weiter. Weihnachten ist ihre Geschichte.",
    ver: ["Hesekiel 34,23", "Ich will einen einzigen Hirten über sie setzen, meinen Knecht David, der soll sie weiden."], erf: ["Johannes 10,11", "Jesus sagt: Ich bin der gute Hirte. Der gute Hirte lässt sein Leben für die Schafe."] },
  { f: "weise", n: "Die Weisen aus dem Morgenland", kurz: "Weise", v: "Matthäus 2,9-11", d: "2027-01-06",
    k: "Der Stern führt die Weisen zum Haus. Sie fallen nieder, beten das Kind an und schenken ihm Gold, Weihrauch und Myrrhe.",
    ver: ["Jesaja 60,3.6", "Völker ziehen zu deinem Licht, sie bringen Gold und Weihrauch und verkünden das Lob des Herrn."], erf: ["Matthäus 2,11", "Sie öffneten ihre Schätze und schenkten ihm Gold, Weihrauch und Myrrhe."] }
];
const BETH_FINALE = { n: "Heiligabend – das Kind ist da!", v: "Lukas 2,7.11-12",
  k: "Maria bringt ihren ersten Sohn zur Welt, wickelt ihn in Windeln und legt ihn in eine Krippe. Der Engel sagt den Hirten: Euch ist heute der Retter geboren, der Christus, der Herr.",
  ver: ["Jesaja 9,5", "Uns ist ein Kind geboren, ein Sohn ist uns gegeben."], erf: ["Johannes 1,14", "Das Wort wurde Mensch und wohnte unter uns – wir sahen seine Herrlichkeit."] };

/* ---------- Adventskalender (ab 1. Dezember) ---------- */
/* Belohnung je Türchen (ähnlich der Tages-Schatztruhe: 25 Talente). Am Tag selbst geöffnet / nachgeholt; Frage richtig = Zugabe. */
const KAL_TAL = 25, KAL_TAL_SPAET = 12, KAL_TAL_FRAGE = 10;
const KAL_LICHT = 30, KAL_LICHT_SPAET = 15, KAL_LICHT_FRAGE = 10;     /* Adventslichter */
const KAL_GROSS = { 24: [60, 150] };                                 /* Heiligabend: [Talente, Lichter] zusätzlich */
const KAL_MEISTER = 20;                                              /* so viele Türchen für Rahmen „Adventskranz“ und Titel „Adventsbote“ */
/* a: die richtige Antwort steht immer zuerst; die App mischt für jedes Türchen immer gleich */
const KALENDER = [
  { t: "Die erste Verheißung", v: "1. Mose 3,15", s: "Gleich nach dem Sündenfall verspricht Gott: Ein Nachkomme der Frau wird der Schlange den Kopf zertreten. Hier beginnt der Weg zum Retter.",
    q: "Zu wem sagt Gott in 1. Mose 3,15 das Wort vom Nachkommen, der den Kopf zertritt?", a: ["Zur Schlange", "Zu Eva", "Zu Adam", "Zu Kain"], e: "Gott sagt es zur Schlange – ein erster Hinweis auf Jesus." },
  { t: "Gesegnet für alle Völker", v: "1. Mose 12,1-3", s: "Gott beruft einen Mann und verspricht ihm: Durch dich sollen alle Geschlechter der Erde gesegnet werden. Der Segen führt bis zu Jesus.",
    q: "Wen berief Gott mit dem Versprechen, dass durch ihn alle Geschlechter gesegnet werden?", a: ["Abram (Abraham)", "Noah", "Mose", "David"], e: "Abram zog los – und aus seiner Familie kommt Jesus." },
  { t: "Das Zepter bleibt bei Juda", v: "1. Mose 49,10", s: "Jakob segnet am Ende seines Lebens seine Söhne. Von Juda soll der Herrscher kommen, dem die Völker gehorchen werden.",
    q: "Aus welchem Stamm sollte nach 1. Mose 49,10 der Herrscher kommen?", a: ["Juda", "Levi", "Benjamin", "Dan"], e: "Jesus stammt aus dem Stamm Juda." },
  { t: "Ein Prophet wie Mose", v: "5. Mose 18,15", s: "Mose sagt dem Volk: Der Herr wird euch einen Propheten erwecken, wie ich es bin. Auf ihn sollt ihr hören.",
    q: "Mit wem wird der verheißene Prophet in 5. Mose 18,15 verglichen?", a: ["Mit Mose", "Mit Elia", "Mit Samuel", "Mit Jesaja"], e: "Mose selbst kündigt den Propheten an, auf den alle hören sollen." },
  { t: "Ein König für immer", v: "2. Samuel 7,12-16", s: "Gott verspricht David: Dein Königshaus und dein Thron sollen für immer bestehen. Ein Nachkomme wird ewig regieren.",
    q: "Wem versprach Gott einen Nachkommen mit einem ewigen Thron?", a: ["David", "Salomo", "Saul", "Hiskia"], e: "Jesus wird „Sohn Davids“ genannt." },
  { t: "Immanuel", v: "Jesaja 7,14", s: "Der Prophet Jesaja kündigt ein Zeichen an: Eine junge Frau wird schwanger werden und einen Sohn gebären. Sein Name: Immanuel – „Gott mit uns“.",
    q: "Welchen Namen soll der Sohn nach Jesaja 7,14 tragen?", a: ["Immanuel", "Johannes", "Elia", "Josua"], e: "Matthäus erklärt: Immanuel heißt „Gott mit uns“ (Matthäus 1,23)." },
  { t: "Uns ist ein Kind geboren", v: "Jesaja 9,5", s: "Jesaja sieht ein Licht in der Dunkelheit: Ein Kind wird geboren, ein Sohn wird gegeben. Er trägt große Namen – einer davon heißt Friedefürst.",
    q: "Wie wird das Kind in Jesaja 9,5 unter anderem genannt?", a: ["Friedefürst", "Löwe von Juda", "Menschensohn", "Hirte Israels"], e: "Wunder-Rat, Gott-Held, Ewig-Vater, Friedefürst." },
  { t: "Bethlehem – klein und doch groß", v: "Micha 5,1", s: "Der Prophet Micha nennt den Ort, aus dem der Herrscher Israels kommen soll – klein unter den Städten Judas, aber von Gott erwählt.",
    q: "Welcher Ort wird in Micha 5 als Herkunft des Herrschers genannt?", a: ["Bethlehem", "Nazareth", "Jerusalem", "Hebron"], e: "700 Jahre vor Jesu Geburt war Bethlehem schon genannt." },
  { t: "Eine Stimme in der Wüste", v: "Jesaja 40,3", s: "Eine Stimme ruft: Bereitet dem Herrn den Weg in der Wüste! Dieser Ruf gilt dem, der vor Jesus herkommen wird.",
    q: "Wer wurde als Rufer in der Wüste angekündigt, der den Weg bereitet?", a: ["Johannes der Täufer", "Elia", "Jeremia", "Simeon"], e: "Alle vier Evangelien erzählen von Johannes dem Täufer." },
  { t: "Zacharias im Tempel", v: "Lukas 1,5-13", s: "Der alte Priester Zacharias und seine Frau Elisabeth haben keine Kinder. Im Tempel erscheint ihm ein Engel: Du bekommst einen Sohn.",
    q: "Wie hieß der Priester, dem der Engel einen Sohn ankündigte?", a: ["Zacharias", "Simeon", "Eli", "Josef"], e: "Der Sohn: Johannes, der später Jesus den Weg bereitet." },
  { t: "Der Engel Gabriel in Nazareth", v: "Lukas 1,26-27", s: "Sechs Monate später sendet Gott den Engel Gabriel zu einer jungen Frau, die mit Josef verlobt ist: Maria.",
    q: "In welche Stadt wurde der Engel Gabriel zu Maria gesandt?", a: ["Nazareth", "Bethlehem", "Jerusalem", "Kapernaum"], e: "Nazareth lag in Galiläa, im Norden." },
  { t: "Fürchte dich nicht, Maria", v: "Lukas 1,28-33", s: "Gabriel sagt: Du hast Gnade bei Gott gefunden. Du wirst einen Sohn bekommen, den sollst du Jesus nennen. Er wird groß sein und sein Reich wird kein Ende haben.",
    q: "Welchen Namen sollte Maria ihrem Sohn geben?", a: ["Jesus", "Johannes", "Josef", "Jakob"], e: "Jesus bedeutet „Der Herr rettet“." },
  { t: "Besuch im Bergland", v: "Lukas 1,39-45", s: "Maria macht sich eilig auf den Weg zu Elisabeth. Als Elisabeth sie begrüßt, hüpft das Kind in ihrem Leib vor Freude.",
    q: "Wen besuchte Maria nach der Botschaft des Engels?", a: ["Elisabeth", "Hanna", "Marta", "Lydia"], e: "Elisabeth war mit Maria verwandt." },
  { t: "Marias Lobgesang", v: "Lukas 1,46-55", s: "Maria antwortet mit einem Lied: Sie lobt Gott, der auf die Niedrigen sieht und große Dinge an ihr getan hat.",
    q: "Was stimmte Maria bei Elisabeth an?", a: ["Einen Lobgesang", "Ein Klagelied", "Einen Bußpsalm", "Einen Reisesegen"], e: "Man nennt das Lied „Magnificat“ – nach dem ersten Wort im Lateinischen." },
  { t: "Josefs Traum", v: "Matthäus 1,18-21", s: "Josef ist unsicher, was er tun soll. Da erscheint ihm im Traum ein Engel des Herrn und sagt: Nimm Maria zu dir, das Kind ist vom Heiligen Geist.",
    q: "Wodurch sprach Gott zu Josef?", a: ["Durch einen Engel im Traum", "Durch einen Propheten", "Durch eine Wolke", "Durch einen Brief"], e: "Josef gehorchte und nahm Maria zu sich." },
  { t: "Ein Name mit Bedeutung", v: "Matthäus 1,21", s: "Der Engel sagt zu Josef: Du sollst ihn Jesus nennen, denn er wird sein Volk von seinen Sünden retten.",
    q: "Warum soll das Kind Jesus heißen?", a: ["Weil er sein Volk von seinen Sünden retten wird", "Weil er Wunder tun wird", "Weil er Prophet sein wird", "Weil er Richter sein wird"], e: "Der Name verrät schon den Auftrag." },
  { t: "Der Kaiser befiehlt", v: "Lukas 2,1-3", s: "Zu jener Zeit befiehlt Kaiser Augustus eine Volkszählung im ganzen Reich. Jeder geht in seine Stadt, um sich eintragen zu lassen.",
    q: "Welcher Kaiser ordnete die Volkszählung an?", a: ["Augustus", "Nero", "Tiberius", "Herodes"], e: "So kam es, dass Josef und Maria nach Bethlehem reisten." },
  { t: "Die Reise nach Bethlehem", v: "Lukas 2,4-5", s: "Auch Josef macht sich auf, von Nazareth nach Bethlehem, mit Maria, die ein Kind erwartet.",
    q: "Warum musste Josef nach Bethlehem?", a: ["Er stammte aus dem Haus und Geschlecht Davids", "Er hatte dort Arbeit", "Er besuchte Verwandte", "Der König rief ihn"], e: "Bethlehem ist die Stadt Davids." },
  { t: "Kein Platz in der Herberge", v: "Lukas 2,6-7", s: "Als sie in Bethlehem sind, kommt die Zeit der Geburt. Maria wickelt ihren Sohn in Windeln und legt ihn in eine Krippe, denn in der Herberge ist kein Platz.",
    q: "Warum legte Maria das Kind in eine Krippe?", a: ["In der Herberge war kein Platz für sie", "Josef war Hirte", "Es war so Brauch", "Die Hirten baten darum"], e: "Der Retter der Welt beginnt ganz unten." },
  { t: "Hirten auf dem Feld", v: "Lukas 2,8-9", s: "In der Nacht hüten Hirten ihre Herden. Plötzlich steht ein Engel des Herrn bei ihnen und Gottes Herrlichkeit umstrahlt sie.",
    q: "Wer bekam die Botschaft von der Geburt zuerst zu hören?", a: ["Hirten auf dem Feld", "Könige", "Priester", "Soldaten"], e: "Gott beginnt bei den einfachen Menschen." },
  { t: "Fürchtet euch nicht", v: "Lukas 2,10-12", s: "Der Engel sagt: Fürchtet euch nicht! Ich bringe euch große Freude: Heute ist der Retter geboren. Ihr werdet ihn in einer Krippe finden.",
    q: "Mit welchen Worten begann der Engel seine Botschaft an die Hirten?", a: ["Fürchtet euch nicht!", "Steht auf!", "Folgt mir!", "Friede sei mit euch!"], e: "Die Botschaft ist Freude – für das ganze Volk." },
  { t: "Ehre sei Gott", v: "Lukas 2,13-14", s: "Plötzlich ist bei dem Engel eine große Menge himmlischer Heerscharen. Sie loben Gott und sagen: Ehre sei Gott in der Höhe und Friede auf Erden.",
    q: "Wer lobte Gott gemeinsam mit dem Engel?", a: ["Eine Menge himmlischer Heerscharen", "Die Hirten", "Die Weisen", "Maria"], e: "Der Himmel feiert die Geburt." },
  { t: "Der Stern und die Weisen", v: "Matthäus 2,1-2", s: "Weise aus dem Morgenland kommen nach Jerusalem und fragen: Wo ist der neugeborene König der Juden? Wir haben seinen Stern gesehen.",
    q: "Was haben die Weisen im Morgenland gesehen?", a: ["Seinen Stern", "Eine Feuersäule", "Einen Regenbogen", "Einen Engel"], e: "Der Stern führte sie nach Bethlehem." },
  { t: "Das Wort wurde Mensch", v: "Johannes 1,14", s: "Johannes erzählt Weihnachten ganz anders: Das Wort, das von Anfang an bei Gott war, wurde Mensch und wohnte unter uns. Wir haben seine Herrlichkeit gesehen.",
    q: "Wer ist „das Wort“, das Mensch wurde (Johannes 1,14)?", a: ["Jesus Christus", "Mose", "Johannes der Täufer", "Gabriel"], e: "Frohe Weihnachten! Gott ist Mensch geworden – er wohnt unter uns." }
];

/* ---------- Advents-Biblionär: 4 Wochen × 15 Fragen (5 leicht, 5 mittel, 5 schwer) ----------
   Woche n nimmt von jeder Stufe die Fragen 5·(n-1) bis 5·n-1. Die richtige Antwort steht immer zuerst. */
const ADV_BIB_FRAGEN = {
  1: [
    { f: "In welcher Stadt wurde Jesus geboren?", a: ["Bethlehem", "Nazareth", "Jerusalem", "Kapernaum"], ref: "Lukas 2,4-7", st: 1 },
    { f: "Wie hieß die Mutter von Jesus?", a: ["Maria", "Marta", "Elisabeth", "Hanna"], ref: "Lukas 1,27", st: 1 },
    { f: "Wie hieß Marias Verlobter?", a: ["Josef", "Zacharias", "Simeon", "Johannes"], ref: "Matthäus 1,18-20", st: 1 },
    { f: "Wohin legte Maria das neugeborene Kind?", a: ["In eine Krippe", "In einen Korb", "In ein Bett", "In ein Boot"], ref: "Lukas 2,7", st: 1 },
    { f: "Wem erschienen die Engel auf dem Feld?", a: ["Den Hirten", "Den Soldaten", "Den Priestern", "Den Fischern"], ref: "Lukas 2,8-9", st: 1 },
    { f: "Wer war Zacharias?", a: ["Der Vater von Johannes dem Täufer", "Der Vater von Jesus", "Ein Wirt in Bethlehem", "Ein Hirte"], ref: "Lukas 1,5-13", st: 2 },
    { f: "Was geschah mit Zacharias, weil er dem Engel nicht glaubte?", a: ["Er wurde stumm", "Er wurde blind", "Er wurde krank", "Er kam ins Gefängnis"], ref: "Lukas 1,20", st: 2 },
    { f: "Welchen Namen gab Zacharias seinem Sohn?", a: ["Johannes", "Zacharias", "Elia", "Simeon"], ref: "Lukas 1,63", st: 2 },
    { f: "Welchen Beruf hatte Josef nach den Evangelien?", a: ["Zimmermann", "Fischer", "Zöllner", "Schafhirte"], ref: "Matthäus 13,55", st: 2 },
    { f: "Von wem war Maria nach den Worten des Engels schwanger?", a: ["Vom Heiligen Geist", "Von einem Propheten", "Von einem Engel", "Von einem König"], ref: "Matthäus 1,20", st: 2 },
    { f: "Wo erschien der Engel Gabriel dem Zacharias?", a: ["Im Tempel am Räucheraltar", "Auf dem Feld", "In seinem Haus", "In Nazareth"], ref: "Lukas 1,8-11", st: 3 },
    { f: "Wie lange blieb Maria etwa bei Elisabeth?", a: ["Etwa drei Monate", "Etwa sechs Monate", "Etwa neun Monate", "Etwa einen Monat"], ref: "Lukas 1,56", st: 3 },
    { f: "In welchem Monat der Schwangerschaft Elisabeths erschien Gabriel der Maria?", a: ["Im sechsten Monat", "Im dritten Monat", "Im neunten Monat", "Im ersten Monat"], ref: "Lukas 1,26", st: 3 },
    { f: "Woran sollten die Hirten das Kind erkennen?", a: ["In Windeln gewickelt in einer Krippe", "An einer Krone", "An einem Stern auf der Stirn", "Auf einem Esel sitzend"], ref: "Lukas 2,12", st: 3 },
    { f: "Wann wurde Jesus beschnitten und erhielt den Namen?", a: ["Am achten Tag", "Am dritten Tag", "Am siebten Tag", "Am vierzigsten Tag"], ref: "Lukas 2,21", st: 3 }
  ],
  2: [
    { f: "Wie hieß der Engel, der Maria die Geburt Jesu ankündigte?", a: ["Gabriel", "Michael", "Raphael", "Uriel"], ref: "Lukas 1,26-27", st: 1 },
    { f: "Welchen Namen sollte das Kind tragen?", a: ["Jesus", "Johannes", "Jakobus", "Josef"], ref: "Lukas 1,31", st: 1 },
    { f: "Was sahen die Weisen aus dem Morgenland am Himmel?", a: ["Einen Stern", "Einen Regenbogen", "Eine Wolkensäule", "Eine Feuerkugel"], ref: "Matthäus 2,2", st: 1 },
    { f: "Welche Geschenke brachten die Weisen?", a: ["Gold, Weihrauch und Myrrhe", "Brot, Wein und Öl", "Silber, Perlen und Seide", "Weizen, Gerste und Datteln"], ref: "Matthäus 2,11", st: 1 },
    { f: "Wohin zogen die Weisen zuerst, um nach dem neugeborenen König zu fragen?", a: ["Nach Jerusalem", "Nach Nazareth", "Nach Ägypten", "Nach Rom"], ref: "Matthäus 2,1-2", st: 1 },
    { f: "Wer nahm das Jesuskind im Tempel auf die Arme und lobte Gott?", a: ["Simeon", "Zacharias", "Johannes", "Nikodemus"], ref: "Lukas 2,25-28", st: 2 },
    { f: "Wie hieß die alte Prophetin, die im Tempel Gott diente?", a: ["Hanna", "Debora", "Mirjam", "Lydia"], ref: "Lukas 2,36-38", st: 2 },
    { f: "Wie reagierte König Herodes, als er vom neugeborenen König hörte?", a: ["Er erschrak", "Er freute sich", "Er lud die Weisen zum Fest ein", "Er ignorierte es"], ref: "Matthäus 2,3", st: 2 },
    { f: "Wen fragte Herodes, wo der Christus geboren werden sollte?", a: ["Die Hohenpriester und Schriftgelehrten", "Die Hirten", "Die Soldaten", "Josef"], ref: "Matthäus 2,4", st: 2 },
    { f: "Auf welchem Weg kehrten die Weisen heim?", a: ["Auf einem anderen Weg", "Auf demselben Weg", "Auf Schiffen", "Mit dem Stern"], ref: "Matthäus 2,12", st: 2 },
    { f: "Wer war Statthalter von Syrien zur Zeit der Volkszählung?", a: ["Quirinius", "Pilatus", "Felix", "Festus"], ref: "Lukas 2,2", st: 3 },
    { f: "Wer sprach: „Meine Augen haben dein Heil gesehen“?", a: ["Simeon", "Zacharias", "Johannes", "Josef"], ref: "Lukas 2,30", st: 3 },
    { f: "Aus welchem Stamm kam die Prophetin Hanna?", a: ["Asser", "Juda", "Levi", "Benjamin"], ref: "Lukas 2,36", st: 3 },
    { f: "Welche Opfergabe brachten Maria und Josef im Tempel dar?", a: ["Ein Paar Turteltauben oder zwei junge Tauben", "Ein Lamm", "Einen Stier", "Zwei Ziegen"], ref: "Lukas 2,24", st: 3 },
    { f: "Wo fanden die Weisen das Kind nach dem Matthäusevangelium?", a: ["In einem Haus", "Im Stall", "In einer Höhle", "Im Tempel"], ref: "Matthäus 2,11", st: 3 }
  ],
  3: [
    { f: "Wohin flohen Josef und Maria mit dem Kind?", a: ["Nach Ägypten", "Nach Babylon", "Nach Rom", "Nach Damaskus"], ref: "Matthäus 2,13-14", st: 1 },
    { f: "Wie hieß der König, der das Kind in Bethlehem töten lassen wollte?", a: ["Herodes", "Augustus", "David", "Salomo"], ref: "Matthäus 2,13", st: 1 },
    { f: "Woher kamen die Weisen?", a: ["Aus dem Morgenland", "Aus Ägypten", "Aus Rom", "Aus Galiläa"], ref: "Matthäus 2,1", st: 1 },
    { f: "Wer reiste mit der schwangeren Maria nach Bethlehem?", a: ["Josef", "Zacharias", "Johannes", "Simeon"], ref: "Lukas 2,4-5", st: 1 },
    { f: "In welcher Stadt wohnten Maria und Josef vor der Reise nach Bethlehem?", a: ["Nazareth", "Hebron", "Jericho", "Kapernaum"], ref: "Lukas 2,4", st: 1 },
    { f: "Wie hieß die Mutter von Johannes dem Täufer?", a: ["Elisabeth", "Maria", "Hanna", "Sara"], ref: "Lukas 1,57-60", st: 2 },
    { f: "Wohin zog die Familie nach der Rückkehr aus Ägypten?", a: ["Nach Nazareth in Galiläa", "Nach Bethlehem", "Nach Jerusalem", "Nach Kapernaum"], ref: "Matthäus 2,22-23", st: 2 },
    { f: "Wie alt war Jesus etwa, als er öffentlich zu wirken begann?", a: ["Etwa 30 Jahre", "Etwa 12 Jahre", "Etwa 25 Jahre", "Etwa 40 Jahre"], ref: "Lukas 3,23", st: 2 },
    { f: "Welcher König wurde in Bethlehem als Sohn Isais gesalbt?", a: ["David", "Saul", "Salomo", "Jehu"], ref: "1. Samuel 16,1-13", st: 2 },
    { f: "Wie beginnt das Johannesevangelium?", a: ["Im Anfang war das Wort", "Es begab sich aber zu der Zeit", "Dies ist das Buch der Geschlechter", "Der Anfang des Evangeliums"], ref: "Johannes 1,1", st: 2 },
    { f: "Wie wird Bethlehem bei Micha außerdem genannt?", a: ["Ephrata", "Zion", "Salem", "Gibea"], ref: "Micha 5,1", st: 3 },
    { f: "Welche Moabiterin steht in Bethlehem im Stammbaum Davids?", a: ["Rut", "Ester", "Rahab", "Debora"], ref: "Rut 4,13-22", st: 3 },
    { f: "Mit wem beginnt der Stammbaum Jesu im Matthäusevangelium?", a: ["Mit Abraham", "Mit Adam", "Mit Noah", "Mit Isaak"], ref: "Matthäus 1,1-2", st: 3 },
    { f: "Bis zu wem führt Lukas den Stammbaum Jesu zurück?", a: ["Bis zu Adam", "Bis zu Abraham", "Bis zu Noah", "Bis zu David"], ref: "Lukas 3,38", st: 3 },
    { f: "Welche Frau aus Jericho steht im Stammbaum Jesu?", a: ["Rahab", "Rut", "Tamar", "Batseba"], ref: "Matthäus 1,5", st: 3 }
  ],
  4: [
    { f: "Was verkündigte der Engel den Hirten?", a: ["Große Freude", "Eine Warnung", "Ein Gericht", "Eine Hungersnot"], ref: "Lukas 2,10", st: 1 },
    { f: "Wo hüteten die Hirten nachts ihre Herde?", a: ["Auf dem Feld bei Bethlehem", "Am Berg Sinai", "Am See Genezareth", "In der Wüste Sin"], ref: "Lukas 2,8", st: 1 },
    { f: "Was taten die Hirten, nachdem sie das Kind gesehen hatten?", a: ["Sie lobten Gott und erzählten es weiter", "Sie gingen still heim", "Sie blieben im Stall", "Sie zogen nach Ägypten"], ref: "Lukas 2,17-20", st: 1 },
    { f: "Was brachte die Hirten nach Bethlehem?", a: ["Die Botschaft der Engel", "Die Volkszählung", "Ein Stern", "Der Befehl des Königs"], ref: "Lukas 2,15", st: 1 },
    { f: "In welchem Evangelium steht die Geschichte mit den Hirten und den Engeln?", a: ["Lukas", "Markus", "Johannes", "Matthäus"], ref: "Lukas 2,8-20", st: 1 },
    { f: "In welchem Evangelium kommen die Weisen aus dem Morgenland vor?", a: ["Matthäus", "Lukas", "Markus", "Johannes"], ref: "Matthäus 2,1-12", st: 2 },
    { f: "Wie nennt man Jesus mit dem Namen, der „Gott mit uns“ bedeutet?", a: ["Immanuel", "Maranatha", "Messias", "Abba"], ref: "Matthäus 1,23", st: 2 },
    { f: "Wie alt war Jesus, als er mit seinen Eltern zum Passafest nach Jerusalem ging und im Tempel blieb?", a: ["12 Jahre", "8 Jahre", "10 Jahre", "14 Jahre"], ref: "Lukas 2,42", st: 2 },
    { f: "In welches Gebiet ging Maria, um Elisabeth zu besuchen?", a: ["Ins Bergland von Judäa", "An den See Genezareth", "In die Wüste Negev", "Nach Ägypten"], ref: "Lukas 1,39", st: 2 },
    { f: "Was tat das Kind in Elisabeths Leib, als Maria sie grüßte?", a: ["Es hüpfte vor Freude", "Es bewegte sich nicht", "Es weinte", "Es sang"], ref: "Lukas 1,41", st: 2 },
    { f: "Nach wie vielen Tagen fanden Maria und Josef den zwölfjährigen Jesus im Tempel?", a: ["Nach drei Tagen", "Nach einem Tag", "Nach einer Woche", "Nach zwei Stunden"], ref: "Lukas 2,46", st: 3 },
    { f: "Welche drei Titel nennt der Engel in Lukas 2,11?", a: ["Retter, Christus, Herr", "König, Hirte, Lamm", "Prophet, Priester, König", "Licht, Weg, Wahrheit"], ref: "Lukas 2,11", st: 3 },
    { f: "Zu welcher Priesterabteilung gehörte Zacharias?", a: ["Abija", "Eli", "Aaron", "Zadok"], ref: "Lukas 1,5", st: 3 },
    { f: "Womit beginnt Marias Lobgesang?", a: ["Meine Seele erhebt den Herrn", "Gelobt sei der Herr, der Gott Israels", "Ehre sei Gott in der Höhe", "Der Herr ist mein Hirte"], ref: "Lukas 1,46", st: 3 },
    { f: "Worauf schrieb Zacharias den Namen seines Sohnes?", a: ["Auf eine Schreibtafel", "Auf einen Stein", "Auf Papyrus", "Auf ein Tuch"], ref: "Lukas 1,63", st: 3 }
  ]
};

/* ---------- Advents-Biblionär ---------- */
const ADV_BIB_TAL = 10;     /* Talente für eine gespielte Advents-Biblionär-Runde (zusätzlich zu XP und Lichtern) */
/* Alle Fragen zusammen: Pool für Weihnachts-Duelle */
const ADV_ALLE_FRAGEN = Object.values(ADV_BIB_FRAGEN).flat();

/* ---------- Verheißung und Erfüllung: je Türchen ein Satz „Gott versprochen → in Jesus erfüllt“ ---------- */
const KAL_ERF = [
  ["1. Mose 3,15: Ein Nachkomme der Frau wird der Schlange den Kopf zertreten.", "Galater 4,4: Als die Zeit erfüllt war, sandte Gott seinen Sohn, geboren von einer Frau."],
  ["1. Mose 12,3: In dir sollen alle Geschlechter der Erde gesegnet werden.", "Galater 3,16: Die Verheißungen gelten Abraham und seinem Nachkommen – das ist Christus."],
  ["1. Mose 49,10: Das Zepter wird von Juda nicht weichen.", "Offenbarung 5,5: Der Löwe aus dem Stamm Juda hat überwunden."],
  ["5. Mose 18,15: Gott wird euch einen Propheten erwecken wie mich.", "Apostelgeschichte 3,22-26: Petrus sagt: Dieser Prophet ist Jesus."],
  ["2. Samuel 7,16: Dein Thron soll für immer bestehen.", "Lukas 1,32-33: Gott wird ihm den Thron seines Vaters David geben, und sein Reich wird kein Ende haben."],
  ["Jesaja 7,14: Die junge Frau wird einen Sohn gebären – Immanuel.", "Matthäus 1,22-23: Das ist geschehen, damit sich erfüllt, was der Herr gesagt hat."],
  ["Jesaja 9,5: Uns ist ein Kind geboren, ein Sohn ist uns gegeben.", "Lukas 2,11: Euch ist heute der Retter geboren, der Christus, der Herr."],
  ["Micha 5,1: Aus Bethlehem soll der Herrscher über Israel kommen.", "Matthäus 2,5-6: Die Schriftgelehrten nennen Bethlehem – und Jesus wird dort geboren."],
  ["Jesaja 40,3: Eine Stimme ruft: In der Wüste bereitet dem Herrn den Weg!", "Matthäus 3,1-3: Johannes der Täufer ist diese Stimme, die auf Jesus vorbereitet."],
  ["Maleachi 3,1: Ich sende meinen Boten, der den Weg vor mir bereiten soll.", "Lukas 1,16-17: Der Sohn des Zacharias wird das Volk für den Herrn bereit machen."],
  ["Jesaja 7,14: Die Jungfrau wird schwanger werden.", "Lukas 1,26-27: Gott sendet Gabriel zu einer Jungfrau namens Maria."],
  ["2. Samuel 7,13: Sein Königreich will ich festigen für immer.", "Lukas 1,32-33: Der Sohn wird der Sohn des Höchsten genannt, sein Reich hat kein Ende."],
  ["Micha 5,2: Von Ewigkeit her ist sein Ursprung.", "Lukas 1,43: Elisabeth ruft: Wie kommt es, dass die Mutter meines Herrn zu mir kommt?"],
  ["1. Mose 22,18: Durch deinen Nachkommen sollen alle Völker gesegnet werden.", "Lukas 1,54-55: Maria lobt Gott: Er denkt an seine Barmherzigkeit, wie er unseren Vätern zugesagt hat, Abraham."],
  ["Jesaja 7,14: Sein Name: Immanuel – Gott mit uns.", "Matthäus 1,20-21: Der Engel sagt Josef: Das Kind ist vom Heiligen Geist."],
  ["Psalm 130,8: Er wird Israel erlösen von allen seinen Sünden.", "Matthäus 1,21: Du sollst ihm den Namen Jesus geben, denn er wird sein Volk retten von seinen Sünden."],
  ["Micha 5,1: Aus Bethlehem kommt der Herrscher.", "Lukas 2,1-4: Durch den Befehl des Kaisers muss Josef nach Bethlehem – so führt Gott alles zusammen."],
  ["Micha 5,1: Du Bethlehem Ephrata, klein unter den Städten Judas.", "Lukas 2,4-5: Josef und Maria ziehen hinauf in die Stadt Davids, die Bethlehem heißt."],
  ["Jesaja 53,2-3: Er hatte keine Gestalt, die uns gefiel; er war verachtet.", "Lukas 2,7: Kein Platz in der Herberge – der König kommt ganz klein."],
  ["Hesekiel 34,23: Ich will einen Hirten über sie setzen, meinen Knecht David.", "Lukas 2,8-11: Hirten hören als Erste: Euch ist der Retter geboren."],
  ["Jesaja 9,1: Das Volk, das im Finstern wandelt, sieht ein großes Licht.", "Lukas 2,9-11: Die Klarheit des Herrn umleuchtet die Hirten – der Retter ist da."],
  ["Jesaja 9,5: Er heißt Friedefürst.", "Lukas 2,14: Ehre sei Gott in der Höhe und Friede auf Erden bei den Menschen seines Wohlgefallens."],
  ["4. Mose 24,17: Ein Stern geht auf aus Jakob.", "Matthäus 2,2.10-11: Die Weisen sehen den Stern, kommen und beten Jesus an."],
  ["Jesaja 9,5 und Jesaja 40,5: Die Herrlichkeit des Herrn wird offenbart werden.", "Johannes 1,14: Das Wort wurde Fleisch und wohnte unter uns, und wir sahen seine Herrlichkeit."]
];

/* =====================================================================
   Weihnachts-Telefonjoker: Pastor Willi und Pastor Aaron in Weihnachtsmütze und mit weihnachtlichen Antworten.
   Gilt für den Advents-Biblionär und für Duelle im Weihnachtsmodus. Platzhalter: X = richtige/getippte Antwort, Y = die andere, ref = Bibelstelle.
   ===================================================================== */
const WEIH_MUETZE = `<g class="weih-muetze"><path d="M29 34C30 20 40 12 53 12c7 0 12 3 14 8l11-6-3 13c0 3-1 5-3 8z" fill="#d93a4a" stroke="#6a1420" stroke-width="1.3" stroke-linejoin="round"/><rect x="26" y="31" width="44" height="9" rx="4.5" fill="#fff" stroke="#c9c2b0" stroke-width="1"/><circle cx="78" cy="14" r="5.5" fill="#fff" stroke="#c9c2b0" stroke-width="1"/></g>`;
const weihBild = svgText => svgText.replace("</svg>", WEIH_MUETZE + "</svg>");
const ADV_PASTOREN = {
  willi: {
    hallo: [
      "Frohe Weihnachten im Voraus! Willi am Telefon – ich stehe gerade am Glühweinstand und höre dir trotzdem zu.",
      "Willi hier! Heidi backt Plätzchen, das ganze Haus riecht nach Zimt. Ich hab eine Minute – schieß los!",
      "Servus, Pastor Willi mit Weihnachtsmütze! Die ist übrigens nicht gerutscht, die sitzt mit Absicht schief.",
      "Willi am Apparat! Ich hab Heidis Lebkuchen nur zur Kontrolle probiert, falls du dich wunderst, warum ich kaue.",
      "Hallo, hier ist Willi! Bei uns brennt schon die zweite Kerze am Kranz – und die Feuerwehr ist nicht nötig. Noch nicht.",
      "Willi hier, mitten im Adventstrubel! Das Beste an Weihnachten ist nicht der Braten, sondern das Kind in der Krippe. Aber der Braten hilft."
    ],
    sicher: [
      x => `Das weiß ich wie meinen Adventskranz: ${x.X}. Steht in ${x.ref}.`,
      x => `Ganz klar ${x.X}! Das haben wir schon als Kinder im Krippenspiel gelernt – ${x.ref}.`,
      x => `${x.X}! Da bin ich mir sicherer als bei Heidis Plätzchenrezept. ${x.ref}.`,
      x => `Ohne Zweifel: ${x.X}. Lies es nach in ${x.ref} – Weihnachten steht wirklich in der Bibel.`,
      x => `${x.X}, und das gilt, solange Weihnachten ist. Also immer. ${x.ref}.`
    ],
    ziemlich: [
      x => `Ich bin ziemlich sicher: ${x.X}. Wenn nicht, schiebe ich es auf den Glühwein.`,
      x => `Ich tippe stark auf ${x.X}. Das habe ich in ${x.ref} gelesen – oder war es im Krippenspiel?`,
      x => `Mein Bauchgefühl sagt ${x.X}, und das hat sich nach Lebkuchen bisher nicht geirrt.`,
      x => `Ich würde ${x.X} nehmen. Die Weisen aus dem Morgenland hätten es auch gewusst – wenn sie das Navi dabeigehabt hätten.`
    ],
    schwank: [
      x => `Hm, entweder ${x.X} oder ${x.Y}. Beim Adventskalender hätte ich jetzt gern ein Türchen mehr.`,
      x => `Ich schwanke zwischen ${x.X} und ${x.Y}. Wie Josef in der Nacht, bevor ihm der Engel erschien.`,
      x => `${x.X} würde ich sagen, aber ${x.Y} ist nicht ausgeschlossen. Ich habe zu viele Plätzchen gegessen.`,
      x => `Hin und her wie ein Schaf auf dem Hirtenfeld: ${x.X} oder ${x.Y}. Ich nehme ${x.X}.`
    ],
    geraten: [
      x => `Ehrlich gesagt geraten: ${x.X}. Mein Kopf ist schon im Weihnachtsurlaub.`,
      x => `Nur ein Tipp ins Blaue: ${x.X}. Mehr kann ich dir in diesem Moment nicht anbieten – außer Plätzchen.`,
      x => `Ganz unsicher. ${x.X}, aber ohne Gewähr, wie bei der Paketlieferung kurz vor Heiligabend.`
    ],
    thema: [
      [/Immanuel|Jesaja 7/, "Immanuel heißt „Gott mit uns“. Genau deshalb feiern wir: Gott kommt nicht von oben herab, er kommt mitten rein (Matthäus 1,23)."],
      [/Bethlehem|Micha/, "Bethlehem heißt „Haus des Brotes“ – und dort wird der geboren, der später sagt: Ich bin das Brot des Lebens (Johannes 6,35). Da hat Heidi nichts entgegenzusetzen."],
      [/Hirt|Schaf|Feld/, "Die Hirten waren die Ersten, die es erfuhren. Gott sucht sich zuerst die aus, die nachts arbeiten – ich verstehe das, ich grille auch nachts."],
      [/Engel|Gabriel|fürchte/, "„Fürchte dich nicht!“ ist der Weihnachtssatz der Bibel – er steht in der Weihnachtsgeschichte mehrmals. Das sage ich mir auch vor dem Weihnachtsessen."],
      [/Stern|Weise|Morgenland|Gold|Weihrauch/, "Gold, Weihrauch, Myrrhe – ich hätte der Familie lieber etwas Praktisches geschenkt. Eine Windel, zum Beispiel. Aber die Weisen wussten, wem sie schenken."],
      [/Josef|Traum/, "Josef ist mein Held der Weihnacht. Er sagt in der ganzen Geschichte kein einziges Wort – und tut trotzdem genau das Richtige."],
      [/Maria|Magd|Lobgesang/, "Marias Lobgesang ist das Adventslied schlechthin: „Meine Seele erhebt den Herrn.“ Und das als junge Frau, die gerade alles auf den Kopf gestellt bekommt."],
      [/Kaiser|Augustus|Zählung|Quirinius/, "Der Kaiser dachte, er plant eine Volkszählung. Tatsächlich hat Gott nur dafür gesorgt, dass Micha 5,1 stimmt. Das nenne ich Terminplanung."],
      [/Elisabeth|Zacharias|Johannes/, "Johannes der Täufer ist der Vorbote, der sagt: Macht den Weg frei! Das ist ungefähr wie der Räumdienst vor der Kirche am vierten Advent."],
      [/Jesaja|Prophet|Verhei/, "Die Propheten haben Jahrhunderte vor Weihnachten gesagt, was kommt. Gott hält, was er verspricht – das ist das Fundament von Weihnachten."],
      [/Name|Jesus|Retter/, "Jesus heißt „Gott rettet“. Der Name ist das ganze Programm von Weihnachten in zwei Silben."]
    ],
    themen: { "Advent": [
      "Advent heißt „Ankunft“. Der König kommt, und wir räumen auf – mindestens die Garage, bevor die Verwandtschaft anrückt.",
      "Jedes Türchen im Adventskalender erinnert: Gott hat versprochen, dass er kommt – und er hat es gehalten.",
      "Die Weihnachtsgeschichte ist die Erfüllung von Verheißungen. Jede Prophezeiung wird Kerze für Kerze heller."
    ] },
    allg: [
      "Weihnachten ist das Fest, an dem Gott sein Versprechen hält. Und der Christstollen auch.",
      "Wenn alles hektisch wird: Maria hat in der Krippenszene auch nicht gedrängelt. Sie hat Dinge in ihrem Herzen bewegt (Lukas 2,19).",
      "Das Kind in der Krippe ist die Antwort auf jahrhundertelanges Warten. Und ich beschwere mich über eine Viertelstunde im Stau.",
      "Heidi sagt, ich soll weniger reden und mehr Plätzchen backen. Aber die Frage ist ja gleich beantwortet.",
      "Weihnachten ist kein Wunschzettel, sondern ein Geschenk: Gott schenkt sich selbst.",
      "Die Hirten haben nicht lange gefragt, sie sind einfach losgerannt (Lukas 2,15). Beim Glühwein bin ich auch schneller."
    ],
    tschuess: [
      "Frohe Weihnachten! Und grüß mir die Krippe.",
      "So, ich muss zurück zum Plätzchenteller. Gesegneten Advent!",
      "Möge das Licht von Bethlehem bei dir brennen – ruf an, wenn du mehr brauchst!",
      "Und denk dran: Fürchte dich nicht. Gilt auch fürs Weihnachtsgeschäft.",
      "Bis bald – und ein frohes, gesegnetes Fest!"
    ]
  },
  aaron: {
    hallo: [
      "Aaron am Telefon – in Weihnachtsmütze! Selbst Chewbacca hat sich eine aufgesetzt, wenn auch ungern.",
      "Hallo, hier Aaron! Eliza hat gerade den Adventskranz angezündet, und ich halte den Feuerlöscher bereit. Frag, ich höre zu.",
      "Aaron hier! Bei uns läuft schon der Weihnachts-Soundtrack – und ja, auch das Imperial March-Cover. Was gibt's?",
      "Hallo! Das ist ein Anruf aus einer weit, weit entfernten Küche voller Lebkuchen. Schieß los!",
      "Aaron am Apparat! Möge die Macht – und der Glühwein – mit dir sein. Wobei, nur das eine davon ist biblisch.",
      "Hier Aaron! Wir schmücken gerade den Baum. Der Stern oben ist ein bisschen krumm. Wie das Krippenspiel letztes Jahr."
    ],
    sicher: [
      x => `Da muss ich nicht lange in die Macht greifen: ${x.X}. Steht in ${x.ref}.`,
      x => `Das ist ${x.X}! So sicher wie der Stern über Bethlehem – ${x.ref}.`,
      x => `${x.X}. Ganz klar. Lies ${x.ref} nach, das hat mehr Tiefgang als jeder Weihnachtsfilm.`,
      x => `Ohne Zweifel ${x.X}. So klar wie ein Sternenhimmel in Bethlehem. ${x.ref}.`,
      x => `${x.X}! Das ist Weihnachten, wie es geschrieben steht: ${x.ref}.`
    ],
    ziemlich: [
      x => `Ich bin ziemlich sicher: ${x.X}. Mein Gefühl sagt das, und es täuscht mich seltener als Eliza ihre Lebkuchenwaage.`,
      x => `Ich würde ${x.X} nehmen. Das habe ich in ${x.ref} im Ohr, vom Krippenspiel her.`,
      x => `Meine Antwort wäre ${x.X}. So sicher wie ein Hirte, der einem Engel begegnet – also fast.`,
      x => `${x.X} – das klingt wie die Weihnachtsgeschichte, wie ich sie kenne.`
    ],
    schwank: [
      x => `Zwischen ${x.X} und ${x.Y} – das ist wie die Entscheidung zwischen Lebkuchen und Zimtstern.`,
      x => `Ich schwanke: ${x.X} oder ${x.Y}. Ich nehme ${x.X} – möge der Stern von Bethlehem mir leuchten.`,
      x => `Hmm, ${x.X}, aber ${x.Y} könnte auch sein. Mein Hirn hat Weihnachtsmodus, nicht Prüfungsmodus.`,
      x => `Entweder ${x.X} oder ${x.Y}. Ich sage ${x.X}, aber frag bitte nicht nach.`
    ],
    geraten: [
      x => `Nur geraten: ${x.X}. Die Weisen hatten wenigstens einen Stern, ich habe nur Lebkuchenkrümel.`,
      x => `Ein Schuss ins Blaue: ${x.X}. Ich bin gedanklich schon beim Weihnachtsessen.`,
      x => `Unsicher. ${x.X}, aber behalte deinen Joker im Hinterkopf – ich bin heute nicht der beste Ratgeber.`
    ],
    thema: [
      [/Immanuel|Jesaja 7/, "Immanuel – „Gott mit uns“. Das ist die Version von „Die Macht ist mit dir“, die wirklich stimmt (Matthäus 1,23)."],
      [/Bethlehem|Micha/, "Bethlehem ist so klein wie Tatooine – und trotzdem passiert dort die wichtigste Geschichte der Welt (Micha 5,1)."],
      [/Hirt|Schaf|Feld/, "Die Hirten sind die ersten Zeugen, nicht die Mächtigen. Das ist die echte Rebellen-Allianz: die Kleinen, die Gott zuerst einlädt."],
      [/Engel|Gabriel|fürchte/, "„Fürchte dich nicht!“ – das hat jeder Engel in der Weihnachtsgeschichte gesagt. Auch ein Jedi-Meister könnte das nicht besser."],
      [/Stern|Weise|Morgenland|Gold|Weihrauch/, "Der Stern führt die Weisen zum Ziel – so gut navigiert nicht mal der Millennium Falke. Und das ohne Navi (Matthäus 2,9)."],
      [/Josef|Traum/, "Josef geht auf Gottes Wort hin los, ohne Beweise. Das ist Vertrauen, das Yoda stolz machen würde."],
      [/Maria|Magd|Lobgesang/, "Maria singt: „Meine Seele erhebt den Herrn.“ Das ist das erste Adventslied – und es ist keine Verhandlung, es ist Vertrauen."],
      [/Kaiser|Augustus|Zählung|Quirinius/, "Ein Kaiser denkt, er herrscht – und merkt gar nicht, dass er in Gottes Drehbuch mitspielt. Das ist besser als jeder Plot-Twist."],
      [/Elisabeth|Zacharias|Johannes/, "Johannes der Täufer macht den Weg frei – wie ein Pilot, der die Landebahn beleuchtet, bevor der König landet."],
      [/Jesaja|Prophet|Verhei/, "Hunderte Jahre vorher angekündigt und dann genau so geschehen: Das ist eine Prophezeiung, die wirklich funktioniert."],
      [/Name|Jesus|Retter/, "„Gott rettet“ – so heißt Jesus. Das ist das Beste, was ein Name versprechen kann."]
    ],
    themen: { "Advent": [
      "Advent ist Vorfreude. Gott kommt, und wir bereiten die Tür – mit Herz, nicht nur mit Lichterketten.",
      "Jede Kerze am Adventskranz ist ein Versprechen mehr: Das Licht kommt, und die Dunkelheit hat nicht das letzte Wort (Johannes 1,5).",
      "Weihnachten ist nicht die Geschichte eines Babys, sondern die Geschichte, wie Gott sein Wort hält."
    ] },
    allg: [
      "Eliza sagt, dass ich zu Weihnachten weniger Star Wars zitieren soll. Aber hier passt es, schau: Ein Licht in der Finsternis.",
      "Das Kind in der Krippe ist die größte Überraschung der Weltgeschichte. Und dabei ist die Lebkuchenkonkurrenz stark.",
      "Alle Verheißungen laufen auf die Krippe zu – ich liebe diese Spannung, besser als jeder Film-Trailer.",
      "Gott kommt klein, nicht mit Truppen. Genau das macht Weihnachten so besonders.",
      "Ich mag an Weihnachten, dass niemand eine Leistung bringen muss. Gott schenkt, wir dürfen auspacken.",
      "Die Weisen kamen von weit her, die Hirten von nebenan – bei Jesus ist für alle Platz."
    ],
    sw: [
      "Und denk dran: In einem Stall fing die größte Rebellion der Geschichte an – ohne Laserschwert, nur mit Liebe.",
      "Wenn es dunkel wird, denk an Bethlehem: Ein kleiner Stern reicht, und die Wüste hat ein Ziel.",
      "Selbst Yoda würde sagen: Ein Kind du suchen musst, in einer Krippe es liegt."
    ],
    tschuess: [
      "Frohe Weihnachten! Möge das Licht von Bethlehem dir leuchten.",
      "Ich muss zurück zu den Lebkuchen. Gesegneten Advent!",
      "Ruf wieder an, wenn du Hilfe brauchst – ich bin hier, bis die Kerzen runtergebrannt sind.",
      "Fürchte dich nicht, sagt der Engel. Gute Antwort, würde ich sagen!",
      "Bis zum nächsten Mal – und frohe, gesegnete Weihnachten!"
    ]
  }
};
