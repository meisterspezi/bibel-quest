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
const ADV_SICHT_BIS = "2027-01-08";    /* so lange bleibt der Advent in der App sichtbar (7.8: bis 8. Januar, damit die Flucht nach Ägypten am 7.1. noch dabei ist) */

/* ---------- Die Krippe wächst: nach dem biblischen Zeitplan (7.6) ----------
   Jede Figur erscheint an einem festen Tag, passend zur Geschichte und zum Adventskalender (Feld d in BETH). Das Kind kommt an Heiligabend (ADV_KRIPPE),
   mit ihm Engel und Stern (7.8: biblisch erst in der Nacht der Geburt), die Hirten am 25.12., die Weisen am 6. Januar (Epiphanias).
   WICHTIG: BETH bleibt nach Datum sortiert und hat genau 8 Figuren (Schlüssel 1–8 in der Datenbank, Regeln und advent.js). Adventslichter ändern den Zeitplan NICHT – sie schmücken die Krippe (Lichterglanz für alle)
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
  { f: "engel", n: "Der Engel und das Heer des Himmels", kurz: "Engel", v: "Lukas 2,9-14", d: "2026-12-24",
    k: "Ein Engel des Herrn tritt zu den Hirten, Gottes Licht umstrahlt sie. Dann loben viele Engel Gott: Ehre sei Gott in der Höhe und Friede auf Erden!",
    ver: ["Jesaja 9,5", "Uns ist ein Kind geboren – sein Name ist Wunder-Rat, Gott-Held, Ewig-Vater, Friedefürst."], erf: ["Lukas 2,11.14", "Euch ist heute der Retter geboren, der Christus, der Herr – und Friede auf Erden."] },
  { f: "stern", n: "Der Stern über dem Stall", kurz: "Stern", v: "Matthäus 2,1-2", d: "2026-12-24",
    k: "Weise im Osten sehen einen besonderen Stern aufgehen – für sie das Zeichen, dass der neugeborene König der Juden da ist. Sie machen sich auf den Weg.",
    ver: ["4. Mose 24,17", "Ein Stern geht auf aus Jakob, ein Zepter erhebt sich aus Israel."], erf: ["Matthäus 2,2", "Wir haben seinen Stern gesehen und sind gekommen, ihn anzubeten."] },
  { f: "hirten", n: "Die Hirten", kurz: "Hirten", v: "Lukas 2,8-20", d: "2026-12-25",
    k: "Nach der Botschaft der Engel laufen die Hirten los, finden das Kind in der Krippe und erzählen es weiter. Weihnachten ist ihre Geschichte.",
    ver: ["Hesekiel 34,23", "Ich will einen einzigen Hirten über sie setzen, meinen Knecht David, der soll sie weiden."], erf: ["Johannes 10,11", "Jesus sagt: Ich bin der gute Hirte. Der gute Hirte lässt sein Leben für die Schafe."] },
  { f: "weise", n: "Die Weisen aus dem Morgenland", kurz: "Weise", v: "Matthäus 2,9-11", d: "2027-01-06",
    k: "Der Stern führt die Weisen zum Haus. Sie fallen nieder, beten das Kind an und schenken ihm Gold, Weihrauch und Myrrhe.",
    ver: ["Jesaja 60,3.6", "Völker ziehen zu deinem Licht, sie bringen Gold und Weihrauch und verkünden das Lob des Herrn."], erf: ["Matthäus 2,11", "Sie öffneten ihre Schätze und schenkten ihm Gold, Weihrauch und Myrrhe."] }
];
/* 7.7/7.8: Etappen – Hintergrund zu Zeit und Ort, dazu Verheißung und Erfüllung. Keine Figuren, keine Spenden: reine Wissenskarten im Zeitplan (Termine ohne Einfluss auf die Krippe).
   7.8: neue Karten ab dem 1. Advent, Reihenfolge nach Lukas/Matthäus (Josef vor dem Aufbruch, Herodes erst nach der Frage der Weisen), Karten nach Weihnachten bis 7. Januar.
   Beliebig viele Einträge möglich; die Reihenfolge im Array ist egal (der Zeitplan sortiert nach d). Bibelstellen Schlachter 2000, Texte sinngemäß. */
const BETH_ETAPPEN = [
  { d: "2026-11-29", n: "Advent heißt: Er kommt", v: "Galater 4,4",
    k: "Seit Jahrhunderten wartet das Volk Gottes auf den versprochenen Retter. „Advent“ heißt Ankunft: Gott hält sein Wort, und als die Zeit erfüllt ist, sendet er seinen Sohn.",
    ver: ["Jeremia 33,14", "Es kommen Tage, da ich das gute Wort erfüllen will, das ich zugesagt habe."], erf: ["Galater 4,4", "Als die Zeit erfüllt war, sandte Gott seinen Sohn, geboren von einer Frau."] },
  { d: "2026-12-01", n: "Der Stammbaum Davids", v: "Matthäus 1,1-17",
    k: "Matthäus beginnt sein Evangelium mit einer langen Namensliste. Sie zeigt: Jesus gehört zur Familie von Abraham und David, genau wie Gott es versprochen hatte.",
    ver: ["Jeremia 23,5", "Es kommen Tage, da erwecke ich dem David einen gerechten Spross, der als König regieren wird."], erf: ["Matthäus 1,1", "Buch des Ursprungs von Jesus Christus, dem Sohn Davids, dem Sohn Abrahams."] },
  { d: "2026-12-03", n: "Der Bote vor dem Herrn", v: "Lukas 7,27",
    k: "Der letzte Prophet des Alten Testaments kündigt an: Ein Bote wird Gott den Weg bereiten, danach kommt der Herr selbst. Jesus sagt später, wer dieser Bote ist.",
    ver: ["Maleachi 3,1", "Siehe, ich sende meinen Boten, der den Weg vor mir bereiten soll."], erf: ["Lukas 7,27", "Jesus über Johannes den Täufer: Dieser ist es, von dem geschrieben steht, ich sende meinen Boten vor dir her."] },
  { d: "2026-12-06", n: "Zacharias und Elisabeth", v: "Lukas 1,5-17",
    k: "Der alte Priester Zacharias und seine Frau Elisabeth haben keine Kinder. Im Tempel erscheint ihm der Engel Gabriel und kündigt einen Sohn an, der im Geist des Propheten Elia den Weg für den Herrn bereiten wird.",
    ver: ["Maleachi 3,23-24", "Ich sende euch den Propheten Elia, er wird das Herz der Väter den Kindern zuwenden."], erf: ["Lukas 1,17", "Er wird vor ihm hergehen im Geist und in der Kraft des Elia."] },
  { d: "2026-12-08", n: "Ein Reich ohne Ende", v: "Lukas 1,32-33",
    k: "Der Prophet Daniel sieht in einer Vision einen, dem Gott ewige Herrschaft gibt. Als der Engel Gabriel später mit Maria spricht, greift er dieses Versprechen auf.",
    ver: ["Daniel 7,14", "Ihm wurde Herrschaft, Ehre und Reich gegeben, seine Herrschaft ist ewig und vergeht nicht."], erf: ["Lukas 1,32-33", "Gott wird ihm den Thron seines Vaters David geben, und sein Reich wird kein Ende haben."] },
  { d: "2026-12-09", n: "Licht in Galiläa", v: "Matthäus 4,12-16",
    k: "Galiläa, die Gegend von Nazareth, galt als weit weg und unbedeutend. Gerade dort fängt Gott an: Jesus wächst in Nazareth auf und beginnt später in Galiläa zu predigen.",
    ver: ["Jesaja 9,1-2", "Das Volk, das im Finstern wandelt, sieht ein großes Licht."], erf: ["Matthäus 4,15-16", "Matthäus bezieht das auf Jesus, der in Galiläa auftritt."] },
  { d: "2026-12-16", n: "Der Kaiser und der Statthalter", v: "Lukas 2,1-2",
    k: "Lukas nennt genau, wer regiert: Augustus ist Kaiser in Rom, Quirinius Statthalter in Syrien, Herodes König in Judäa. Weihnachten ist keine Sage, sondern Geschichte mit Ort und Zeit. Der Befehl des Kaisers führt Josef und Maria nach Bethlehem.",
    ver: ["Sprüche 21,1", "Das Herz des Königs ist in der Hand des Herrn wie Wasserbäche, er lenkt es, wohin er will."], erf: ["Lukas 2,1-4", "Die Volkszählung des Kaisers bringt Josef und Maria genau dorthin, wo Gott es angekündigt hat."] },
  { d: "2026-12-17", n: "Aufbruch aus Nazareth", v: "Lukas 2,4-5",
    k: "Josef gehört zum Haus Davids und muss nach Bethlehem. Der Weg von Nazareth sind weit über 100 Kilometer, zu Fuß ein Marsch von mehreren Tagen – mit Maria, die ein Kind erwartet.",
    ver: ["Jesaja 40,3", "Bahnt dem Herrn einen Weg – Gott ist selbst unterwegs zu den Menschen."], erf: ["Lukas 2,4-5", "Josef und Maria brechen auf, das Kind kommt zur Welt, wo Gott es angekündigt hat."] },
  { d: "2026-12-18", n: "Hinauf nach Bethlehem", v: "Lukas 2,4",
    k: "Bethlehem liegt auf einem Höhenzug, nur wenige Kilometer südlich von Jerusalem. Hier wuchs der Hirtenjunge David auf und wurde zum König gesalbt – darum heißt der Ort „Stadt Davids“.",
    ver: ["1. Samuel 16,1.13", "Samuel salbt in Bethlehem den jüngsten Sohn Isais, David, zum König."], erf: ["Lukas 2,11", "In der Stadt Davids ist euch der Retter geboren."] },
  { d: "2026-12-19", n: "Wohin für die Nacht?", v: "Lukas 2,6-7",
    k: "Durch die Volkszählung ist Bethlehem voll. Das Wort, das mit „Herberge“ übersetzt wird, kann auch einen Gästeraum meinen – in einfachen Häusern lebte man oft nah bei den Tieren. So kommt es zum Stall.",
    ver: ["Jesaja 53,2", "Er hatte keine Gestalt und keine Pracht – der Retter kommt ganz unscheinbar."], erf: ["Lukas 2,7", "Es war kein Platz für sie in der Herberge."] },
  { d: "2026-12-26", n: "Das wahre Licht", v: "Johannes 1,4-9",
    k: "Johannes erzählt Weihnachten als Licht, das in die Welt kommt. Jesus ist das Licht, das jeden Menschen erleuchtet – für Hirten, Weise und alle Völker.",
    ver: ["Jesaja 42,6", "Ich habe dich zum Licht der Völker gemacht."], erf: ["Johannes 1,9", "Das wahre Licht, das jeden Menschen erleuchtet, kam in die Welt."] },
  { d: "2027-01-01", n: "Acht Tage alt: der Name Jesus", v: "Lukas 2,21",
    k: "Nach jüdischem Brauch wird ein Junge am achten Tag beschnitten und bekommt seinen Namen. Maria und Josef nennen das Kind Jesus, so wie der Engel es gesagt hatte: „Der Herr rettet“.",
    ver: ["1. Mose 17,12", "Jeder Junge soll, wenn er acht Tage alt ist, beschnitten werden – das Zeichen des Bundes."], erf: ["Lukas 2,21", "Als acht Tage vorüber waren, wurde er beschnitten und erhielt den Namen Jesus."] },
  { d: "2027-01-05", n: "König Herodes", v: "Matthäus 2,3",
    k: "Als die Weisen in Jerusalem nach dem neugeborenen König fragen, erschrickt Herodes. Er regiert in Jerusalem, hat den Tempel prächtig ausgebaut, ist aber misstrauisch und fürchtet jeden, der ihm den Thron nehmen könnte.",
    ver: ["Psalm 2,2", "Die Könige der Erde lehnen sich auf gegen den Herrn und seinen Gesalbten."], erf: ["Matthäus 2,3", "Als König Herodes das hörte, erschrak er und ganz Jerusalem mit ihm."] },
  { d: "2026-12-02", n: "Gott lässt warten – und kommt", v: "Hebräer 1,1-2",
    k: "Nach den Propheten wird es lange still. Doch das Warten ist kein Vergessen: Gott hat einen festen Zeitpunkt, und dann spricht er nicht mehr nur durch Boten, sondern durch seinen Sohn.",
    ver: ["Habakuk 2,3", "Die Weissagung wartet auf ihre Zeit – wenn sie sich verzögert, warte darauf, denn sie kommt gewiss."], erf: ["Hebräer 1,1-2", "Früher redete Gott durch die Propheten, in diesen letzten Tagen hat er zu uns geredet durch den Sohn."] },
  { d: "2026-12-05", n: "Der Dienst im Tempel", v: "Lukas 1,8-10",
    k: "Zacharias gehört zu den Priestern, die im Tempel Dienst tun. Das Los bestimmt, dass er das Räucheropfer darbringen darf – für viele Priester ein einmaliges Ereignis. Draußen betet das Volk.",
    ver: ["Psalm 141,2", "Mein Gebet gelte vor dir als Räucheropfer."], erf: ["Lukas 1,10", "Die ganze Menge des Volkes betete draußen zur Stunde des Räucheropfers – genau da kommt der Engel."] },
  { d: "2026-12-10", n: "Verlobt mit Josef", v: "Lukas 1,26-27",
    k: "Maria ist mit Josef verlobt, und eine Verlobung galt damals schon als rechtlich bindend. Josef stammt aus dem Haus Davids, und genau diese Herkunft hatte Gott dem Retter versprochen.",
    ver: ["2. Samuel 7,12-13", "Gott verspricht David einen Nachkommen, dessen Königsthron für immer bestehen soll."], erf: ["Lukas 1,27", "Maria ist verlobt mit Josef, einem Mann aus dem Haus Davids."] },
  { d: "2026-12-12", n: "Besuch bei Elisabeth", v: "Lukas 1,39-45",
    k: "Maria macht sich auf ins Bergland von Judäa zu ihrer Verwandten Elisabeth. Elisabeth begrüßt sie voller Freude als „Mutter meines Herrn“ – und das, bevor Maria überhaupt etwas erzählt hat.",
    ver: ["Psalm 110,1", "David sagt: Der Herr sprach zu meinem Herrn – der kommende König ist mehr als ein gewöhnlicher Nachkomme."], erf: ["Lukas 1,43", "Woher geschieht mir das, dass die Mutter meines Herrn zu mir kommt?"] },
  { d: "2026-12-13", n: "Marias Lobgesang", v: "Lukas 1,46-55",
    k: "Maria jubelt: Gott sieht die Geringen an und hält, was er den Vätern zugesagt hat. Ihr Lied erinnert an das Lied der Hanna und an die Zusage an Abraham.",
    ver: ["1. Mose 22,18", "Durch deinen Nachkommen sollen alle Völker der Erde gesegnet werden."], erf: ["Lukas 1,54-55", "Er hat sich seines Knechtes Israel angenommen, wie er zu Abraham und seinen Nachkommen geredet hat."] },
  { d: "2026-12-14", n: "Zacharias singt", v: "Lukas 1,67-79",
    k: "Als Johannes geboren wird und Zacharias den Namen aufschreibt, kann er wieder sprechen. Er lobt Gott: Der Retter aus dem Haus Davids kommt, und sein Sohn soll ihm den Weg bereiten.",
    ver: ["Psalm 132,17", "Dort lasse ich für David ein Horn sprossen – ein starker König kommt aus seinem Haus."], erf: ["Lukas 1,68-69", "Gott hat uns ein Horn des Heils aufgerichtet im Haus seines Knechtes David."] },
  { d: "2026-12-21", n: "Gott kommt zu den Einfachen", v: "Lukas 2,8-12",
    k: "Ausgerechnet Hirten, die nachts draußen arbeiten, hören die Botschaft als Erste. Gott sucht sich nicht die Paläste aus, sondern kommt zu denen, die sonst kaum jemand beachtet.",
    ver: ["Psalm 113,5-8", "Der Herr neigt sich zum Niedrigen und hebt den Geringen aus dem Staub."], erf: ["Lukas 2,8-12", "Die ersten Zeugen der Geburt Jesu sind Hirten auf dem Feld."] },
  { d: "2026-12-22", n: "Das Zeichen: eine Krippe", v: "Lukas 2,12",
    k: "Der Engel gibt den Hirten ein Zeichen: ein Kind in Windeln, in einer Krippe. Der Retter der Welt liegt dort, wo sonst Tiere fressen – einfacher geht es nicht.",
    ver: ["Jesaja 1,3", "Ein Ochse kennt seinen Besitzer und ein Esel die Krippe seines Herrn – aber Israel erkennt nicht."], erf: ["Lukas 2,12", "Ihr werdet ein Kind finden, in Windeln gewickelt und in einer Krippe liegend."] },
  { d: "2026-12-23", n: "Retter, Christus, Herr", v: "Lukas 2,11",
    k: "Der Engel nennt drei Titel: Retter, Christus und Herr. „Christus“ heißt „der Gesalbte“, also der versprochene König und Retter. Alles, worauf Israel wartete, liegt in diesem Kind.",
    ver: ["Jesaja 61,1", "Der Herr hat mich gesalbt, den Armen gute Botschaft zu bringen."], erf: ["Lukas 4,18-21", "Jesus liest diese Stelle in Nazareth und sagt: Heute ist diese Schrift erfüllt."] },
  { d: "2026-12-30", n: "Weise aus dem Osten", v: "Matthäus 2,1",
    k: "Wer die Weisen waren, nennt die Bibel nicht genau – nur dass sie aus dem Osten kamen und kostbare Geschenke mitbrachten. Von „drei Königen“ steht dort nichts; gezählt werden nur die drei Geschenke.",
    ver: ["Psalm 72,10-11", "Könige bringen Geschenke, alle Könige werfen sich vor ihm nieder."], erf: ["Matthäus 2,11", "Die Weisen fielen nieder und beteten ihn an."] },
  { d: "2027-01-03", n: "Vierzig Tage später im Tempel", v: "Lukas 2,22-32",
    k: "Maria und Josef bringen Jesus nach Jerusalem in den Tempel. Dort nimmt der alte Simeon das Kind auf die Arme und dankt Gott: Er hat den Retter gesehen, der Licht für alle Völker ist.",
    ver: ["Jesaja 49,6", "Ich mache dich zum Licht der Nationen, damit mein Heil bis an die Enden der Erde reicht."], erf: ["Lukas 2,30-32", "Meine Augen haben dein Heil gesehen, ein Licht zur Erleuchtung der Heiden."] },
  { d: "2027-01-04", n: "Die Schriftgelehrten kennen die Antwort", v: "Matthäus 2,4-6",
    k: "Herodes ruft die Hohepriester und Schriftgelehrten und fragt, wo der Christus geboren werden soll. Sie kennen die Antwort sofort aus der Bibel: in Bethlehem. Hingehen will aber keiner von ihnen.",
    ver: ["2. Samuel 5,2", "Du sollst mein Volk Israel weiden und Fürst über Israel sein."], erf: ["Matthäus 2,5-6", "Die Schriftgelehrten antworten: In Bethlehem in Judäa, denn so steht es beim Propheten."] },
  { d: "2027-01-07", n: "Flucht nach Ägypten", v: "Matthäus 2,13-15",
    k: "Ein Engel warnt Josef im Traum: Herodes will das Kind suchen. Josef steht in der Nacht auf und bringt Maria und Jesus in Sicherheit nach Ägypten. Gott beschützt seinen Sohn.",
    ver: ["Hosea 11,1", "Aus Ägypten habe ich meinen Sohn gerufen."], erf: ["Matthäus 2,14-15", "Josef zog nach Ägypten – so erfüllte sich, was der Herr durch den Propheten gesagt hatte."] }
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
/* a: die richtige Antwort steht immer zuerst; die App mischt für jedes Türchen immer gleich. qs: die Bibelstelle, in der die Lösung steht (wird bei der Frage eingeblendet) */
const KALENDER = [
  { t: "Die erste Verheißung", v: "1. Mose 3,15", s: "Gleich nach dem Sündenfall verspricht Gott: Ein Nachkomme der Frau wird der Schlange den Kopf zertreten. Hier beginnt der Weg zum Retter.",
    q: "Welches Versprechen gibt Gott gleich nach dem Sündenfall in 1. Mose 3,15?", a: ["Ein Nachkomme der Frau wird der Schlange den Kopf zertreten", "Die Menschen dürfen in den Garten Eden zurückkehren", "Die Schlange wird für immer verstummen", "Adam wird über die Schlange herrschen"], e: "Schon hier zeigt Gott, wohin die Geschichte führt: Einer wird das Böse besiegen. Christen sehen darin den ersten Hinweis auf Jesus.", qs: "1. Mose 3,15" },
  { t: "Gesegnet für alle Völker", v: "1. Mose 12,1-3", s: "Gott beruft einen Mann und verspricht ihm: Durch dich sollen alle Geschlechter der Erde gesegnet werden. Der Segen führt bis zu Jesus.",
    q: "Was verspricht Gott Abram in 1. Mose 12,3 für alle Geschlechter der Erde?", a: ["Durch ihn sollen alle gesegnet werden", "Alle sollen ihm dienen", "Alle sollen sein Land erben", "Alle sollen den Gott Israels fürchten"], e: "Der Segen ist nicht nur für Abrahams Familie gedacht, sondern für die ganze Welt. Paulus erklärt in Galater 3,8.16: Dieser Segen kommt durch Jesus.", qs: "1. Mose 12,3" },
  { t: "Das Zepter bleibt bei Juda", v: "1. Mose 49,10", s: "Jakob segnet am Ende seines Lebens seine Söhne. Von Juda soll der Herrscher kommen, dem die Völker gehorchen werden.",
    q: "Von welchem Sohn Jakobs heißt es in 1. Mose 49,10, dass das Zepter nicht von ihm weichen wird?", a: ["Juda", "Josef", "Levi", "Ruben"], e: "Jakob segnet seine Söhne – und über Juda sagt er: Hier kommt der Herrscher her. Jesus stammt aus Juda und heißt „der Löwe aus dem Stamm Juda“ (Offenbarung 5,5).", qs: "1. Mose 49,10" },
  { t: "Ein Prophet wie Mose", v: "5. Mose 18,15", s: "Mose sagt dem Volk: Der Herr wird euch einen Propheten erwecken, wie ich es bin. Auf ihn sollt ihr hören.",
    q: "Was kündigt Mose dem Volk in 5. Mose 18,15 an?", a: ["Gott wird einen Propheten wie Mose erwecken, auf den sie hören sollen", "Ein König wird alle Völker unterwerfen", "Ein Engel wird sie in das verheißene Land führen", "Ein Priester wird für immer im Tempel dienen"], e: "Petrus bezieht diese Zusage in Apostelgeschichte 3,22 auf Jesus: Er ist der Prophet, auf den man hören soll.", qs: "5. Mose 18,15" },
  { t: "Ein König für immer", v: "2. Samuel 7,12-16", s: "Gott verspricht David: Dein Königshaus und dein Thron sollen für immer bestehen. Ein Nachkomme wird ewig regieren.",
    q: "Wie lange soll nach 2. Samuel 7,13 der Thron von Davids Nachkomme bestehen?", a: ["Für immer", "Bis zur Rückkehr aus dem Exil", "Tausend Jahre", "Sieben Generationen"], e: "Salomo ist nur ein Vorläufer. Der Engel Gabriel greift diese Zusage in Lukas 1,32-33 auf: Jesus bekommt den Thron seines Vaters David – und sein Reich hat kein Ende.", qs: "2. Samuel 7,13" },
  { t: "Immanuel", v: "Jesaja 7,14", s: "Der Prophet Jesaja kündigt ein Zeichen an: Eine junge Frau wird schwanger werden und einen Sohn gebären. Sein Name: Immanuel – „Gott mit uns“.",
    q: "Welches Zeichen kündigt Jesaja dem Königshaus Davids in Jesaja 7,14 an?", a: ["Eine Jungfrau wird einen Sohn gebären, sein Name: Immanuel", "Ein Stern geht über Jerusalem auf", "Feuer fällt vom Himmel auf den Tempel", "Ein König wird in Jerusalem geboren"], e: "Immanuel heißt „Gott mit uns“. Matthäus zitiert die Stelle in Matthäus 1,22-23 für die Geburt von Jesus.", qs: "Jesaja 7,14" },
  { t: "Uns ist ein Kind geboren", v: "Jesaja 9,5", s: "Jesaja sieht ein Licht in der Dunkelheit: Ein Kind wird geboren, ein Sohn wird gegeben. Er trägt große Namen – einer davon heißt Friedefürst.",
    q: "Welcher dieser Namen gehört nach Jesaja 9,5 zum verheißenen Kind?", a: ["Friedefürst", "Löwe von Juda", "Guter Hirte", "Menschensohn"], e: "In Jesaja 9,5 stehen vier Namen: Wunder-Rat, Gott-Held, Ewig-Vater und Friedefürst. Ein Kind bekommt Namen, die nur zu Gott passen.", qs: "Jesaja 9,5" },
  { t: "Bethlehem – klein und doch groß", v: "Micha 5,1", s: "Der Prophet Micha nennt den Ort, aus dem der Herrscher Israels kommen soll – klein unter den Städten Judas, aber von Gott erwählt.",
    q: "Welcher kleine Ort wird in Micha 5,1 als Herkunft des künftigen Herrschers Israels genannt?", a: ["Bethlehem Ephrata", "Nazareth", "Jerusalem", "Hebron"], e: "Rund 700 Jahre vor Jesus nennt Micha den Ort schon. Als die Weisen nach dem König fragen, geben die Schriftgelehrten genau diese Stelle an (Matthäus 2,4-6).", qs: "Micha 5,1" },
  { t: "Eine Stimme in der Wüste", v: "Jesaja 40,3", s: "Eine Stimme ruft: Bereitet dem Herrn den Weg in der Wüste! Dieser Ruf gilt dem, der vor Jesus herkommen wird.",
    q: "Was ruft die Stimme in der Wüste nach Jesaja 40,3?", a: ["Bereitet dem Herrn den Weg", "Kehrt um zum Herrn", "Baut dem Herrn ein Haus", "Fürchtet euch nicht"], e: "Alle vier Evangelien beziehen das auf Johannes den Täufer, der Jesus den Weg bereitet (zum Beispiel Matthäus 3,3).", qs: "Jesaja 40,3" },
  { t: "Zacharias im Tempel", v: "Lukas 1,5-13", s: "Der alte Priester Zacharias und seine Frau Elisabeth haben keine Kinder. Im Tempel erscheint ihm ein Engel: Du bekommst einen Sohn.",
    q: "Welchen Namen soll der Sohn von Zacharias und Elisabeth nach Lukas 1,13 tragen?", a: ["Johannes", "Jakobus", "Simeon", "Josua"], e: "Der Name bedeutet „Gott ist gnädig“. Johannes wird der Wegbereiter von Jesus – und kommt ein halbes Jahr vor ihm zur Welt.", qs: "Lukas 1,13" },
  { t: "Der Engel Gabriel in Nazareth", v: "Lukas 1,26-27", s: "Sechs Monate später sendet Gott den Engel Gabriel zu einer jungen Frau, die mit Josef verlobt ist: Maria.",
    q: "In welche Stadt in Galiläa wird der Engel Gabriel nach Lukas 1,26-27 zu Maria gesandt?", a: ["Nazareth", "Bethlehem", "Jerusalem", "Kapernaum"], e: "Nazareth war ein kleiner Ort im Norden. Dass Gott gerade dort anfängt, passt zum ganzen Weihnachtsgeschehen: Er beginnt im Kleinen.", qs: "Lukas 1,26-27" },
  { t: "Fürchte dich nicht, Maria", v: "Lukas 1,28-33", s: "Gabriel sagt: Du hast Gnade bei Gott gefunden. Du wirst einen Sohn bekommen, den sollst du Jesus nennen. Er wird groß sein und sein Reich wird kein Ende haben.",
    q: "Welchen Namen soll Maria ihrem Sohn nach Lukas 1,31 geben?", a: ["Jesus", "Immanuel", "Johannes", "Josef"], e: "Jesus (hebräisch Jeschua) bedeutet „Der Herr rettet“. Immanuel ist ein Titel aus Jesaja 7,14 – der Name, den Gabriel nennt, lautet aber Jesus.", qs: "Lukas 1,31" },
  { t: "Besuch im Bergland", v: "Lukas 1,39-45", s: "Maria macht sich eilig auf den Weg zu Elisabeth. Als Elisabeth sie begrüßt, hüpft das Kind in ihrem Leib vor Freude.",
    q: "Was geschah nach Lukas 1,41, als Elisabeth Marias Gruß hörte?", a: ["Das Kind hüpfte in ihrem Leib", "Sie verlor ihre Stimme", "Sie fiel weinend auf die Knie", "Sie stimmte ein Lied an"], e: "Das Kind in Elisabeths Bauch ist Johannes. Schon vor der Geburt freut er sich über Jesus. Elisabeth wird vom Heiligen Geist erfüllt und nennt Maria „die Mutter meines Herrn“.", qs: "Lukas 1,41" },
  { t: "Marias Lobgesang", v: "Lukas 1,46-55", s: "Maria antwortet mit einem Lied: Sie lobt Gott, der auf die Niedrigen sieht und große Dinge an ihr getan hat.",
    q: "Wie beginnt Marias Lobgesang nach Lukas 1,46-47?", a: ["Meine Seele erhebt den Herrn", "Der Herr ist mein Hirte", "Lobe den Herrn, meine Seele", "Ehre sei Gott in der Höhe"], e: "Die anderen drei Sätze stammen aus Psalm 23, Psalm 103 und Lukas 2,14. Marias Lied erinnert an das Lied der Hanna in 1. Samuel 2.", qs: "Lukas 1,46-47" },
  { t: "Josefs Traum", v: "Matthäus 1,18-21", s: "Josef ist unsicher, was er tun soll. Da erscheint ihm im Traum ein Engel des Herrn und sagt: Nimm Maria zu dir, das Kind ist vom Heiligen Geist.",
    q: "Was sagt der Engel nach Matthäus 1,20 im Traum zu Josef?", a: ["Fürchte dich nicht, Maria zu dir zu nehmen", "Verlass Maria in aller Stille", "Zieh sofort nach Ägypten", "Geh nach Bethlehem"], e: "Sich in aller Stille zu trennen, hatte Josef selbst vor (Matthäus 1,19). Der Engel ändert seinen Plan: Das Kind ist vom Heiligen Geist. Josef gehorcht.", qs: "Matthäus 1,20" },
  { t: "Ein Name mit Bedeutung", v: "Matthäus 1,21", s: "Der Engel sagt zu Josef: Du sollst ihn Jesus nennen, denn er wird sein Volk von seinen Sünden retten.",
    q: "Warum soll das Kind nach Matthäus 1,21 Jesus heißen?", a: ["Weil er sein Volk von seinen Sünden retten wird", "Weil er Wunder tun wird", "Weil er König über Israel wird", "Weil er als Prophet auftreten wird"], e: "Der Name verrät den Auftrag: Jesus kommt nicht in erster Linie, um zu herrschen oder zu beeindrucken, sondern um zu retten.", qs: "Matthäus 1,21" },
  { t: "Der Kaiser befiehlt", v: "Lukas 2,1-3", s: "Zu jener Zeit befiehlt Kaiser Augustus eine Volkszählung im ganzen Reich. Jeder geht in seine Stadt, um sich eintragen zu lassen.",
    q: "Wer war nach Lukas 2,1 Kaiser, als er die Volkszählung anordnete?", a: ["Augustus", "Tiberius", "Nero", "Herodes"], e: "Herodes war König von Judäa, aber dem Kaiser in Rom untertan. Die Volkszählung brachte Josef und Maria dorthin, wo Micha 5,1 es angekündigt hatte.", qs: "Lukas 2,1-3" },
  { t: "Die Reise nach Bethlehem", v: "Lukas 2,4-5", s: "Auch Josef macht sich auf, von Nazareth nach Bethlehem, mit Maria, die ein Kind erwartet.",
    q: "Warum musste Josef nach Lukas 2,4 von Nazareth nach Bethlehem ziehen?", a: ["Er stammte aus dem Haus und Geschlecht Davids", "Er hatte dort Arbeit gefunden", "Er besuchte dort Verwandte", "König Herodes hatte ihn gerufen"], e: "Bethlehem ist „die Stadt Davids“. Josef war ein Nachkomme Davids, so wird Jesus als Davids Sohn geboren.", qs: "Lukas 2,4-5" },
  { t: "Kein Platz in der Herberge", v: "Lukas 2,6-7", s: "Als sie in Bethlehem sind, kommt die Zeit der Geburt. Maria wickelt ihren Sohn in Windeln und legt ihn in eine Krippe, denn in der Herberge ist kein Platz.",
    q: "Warum legte Maria ihr Kind nach Lukas 2,7 in eine Krippe?", a: ["In der Herberge war kein Platz für sie", "Josef arbeitete als Hirte", "Es war damals Brauch bei Neugeborenen", "Die Hirten hatten sie darum gebeten"], e: "Der Retter der Welt kommt nicht in einen Palast, sondern ganz unten an. Das ist Gottes Art, Menschen nahe zu sein.", qs: "Lukas 2,7" },
  { t: "Hirten auf dem Feld", v: "Lukas 2,8-9", s: "In der Nacht hüten Hirten ihre Herden. Plötzlich steht ein Engel des Herrn bei ihnen und Gottes Herrlichkeit umstrahlt sie.",
    q: "Wie reagierten die Hirten nach Lukas 2,9, als der Engel des Herrn zu ihnen trat?", a: ["Sie fürchteten sich sehr", "Sie fielen nieder und beteten an", "Sie liefen sofort nach Bethlehem", "Sie schliefen ruhig weiter"], e: "Gottes Herrlichkeit leuchtete um sie – darum die Angst. Der Engel beruhigt sie gleich: „Fürchtet euch nicht!“ (Lukas 2,10).", qs: "Lukas 2,9" },
  { t: "Fürchtet euch nicht", v: "Lukas 2,10-12", s: "Der Engel sagt: Fürchtet euch nicht! Ich bringe euch große Freude: Heute ist der Retter geboren. Ihr werdet ihn in einer Krippe finden.",
    q: "Woran sollen die Hirten das Kind nach Lukas 2,12 erkennen?", a: ["Es liegt in Windeln gewickelt in einer Krippe", "Ein Stern steht über dem Stall", "Es trägt eine goldene Krone", "Ein Engel wacht an seiner Seite"], e: "Ein Neugeborenes in einer Futterkrippe – ein Zeichen, das niemand erfunden hätte. Gerade das macht es für die Hirten unverwechselbar.", qs: "Lukas 2,12" },
  { t: "Ehre sei Gott", v: "Lukas 2,13-14", s: "Plötzlich ist bei dem Engel eine große Menge himmlischer Heerscharen. Sie loben Gott und sagen: Ehre sei Gott in der Höhe und Friede auf Erden.",
    q: "Was rufen die Engel nach Lukas 2,14?", a: ["Ehre sei Gott in der Höhe und Friede auf Erden bei den Menschen seines Wohlgefallens", "Heilig, heilig, heilig ist der Herr Zebaoth", "Hosanna dem Sohn Davids", "Halleluja, der Herr ist König"], e: "Hosanna rufen die Menschen später beim Einzug in Jerusalem (Matthäus 21,9). Der Himmel feiert die Geburt und verbindet Gottes Ehre mit dem Frieden unter den Menschen.", qs: "Lukas 2,14" },
  { t: "Der Stern und die Weisen", v: "Matthäus 2,1-2", s: "Weise aus dem Morgenland kommen nach Jerusalem und fragen: Wo ist der neugeborene König der Juden? Wir haben seinen Stern gesehen.",
    q: "Warum kamen die Weisen aus dem Morgenland nach Jerusalem (Matthäus 2,1-2)?", a: ["Sie hatten seinen Stern gesehen und wollten den neugeborenen König der Juden anbeten", "Sie hatten einen Handelsweg gesucht", "Der Kaiser hatte sie gerufen", "Sie wollten König Herodes beschenken"], e: "Heiden aus der Ferne finden zu Jesus. Das Matthäusevangelium beginnt mit dieser Zusage: Jesus ist für alle Völker gekommen.", qs: "Matthäus 2,1-2" },
  { t: "Das Wort wurde Mensch", v: "Johannes 1,14", s: "Johannes erzählt Weihnachten ganz anders: Das Wort, das von Anfang an bei Gott war, wurde Mensch und wohnte unter uns. Wir haben seine Herrlichkeit gesehen.",
    q: "Was sagt Johannes 1,14 über das Wort, das von Anfang an bei Gott war?", a: ["Es wurde Fleisch und wohnte unter uns", "Es kam als Engel zu den Hirten", "Es wurde im Tempel vorgelesen", "Es stand auf steinernen Tafeln"], e: "Das Wort ist Jesus. Johannes erzählt Weihnachten ohne Stall und Hirten, aber mit der größten Aussage: Gott wird Mensch und wohnt unter uns.", qs: "Johannes 1,14" }
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
   Weihnachts-Telefonjoker: die Pastoren in Weihnachtsmütze (die Texte stehen verschlüsselt in joker.enc).
   Gilt für den Advents-Biblionär und für Duelle im Weihnachtsmodus. Platzhalter: X = richtige/getippte Antwort, Y = die andere, ref = Bibelstelle.
   ===================================================================== */
const WEIH_MUETZE = `<g class="weih-muetze"><path d="M29 34C30 20 40 12 53 12c7 0 12 3 14 8l11-6-3 13c0 3-1 5-3 8z" fill="#d93a4a" stroke="#6a1420" stroke-width="1.3" stroke-linejoin="round"/><rect x="26" y="31" width="44" height="9" rx="4.5" fill="#fff" stroke="#c9c2b0" stroke-width="1"/><circle cx="78" cy="14" r="5.5" fill="#fff" stroke="#c9c2b0" stroke-width="1"/></g>`;
const weihBild = svgText => svgText.replace("</svg>", WEIH_MUETZE + "</svg>");
const ADV_PASTOREN = {}; /* 9.11: Weihnachtstexte von Willi und Aaron stehen verschlüsselt in joker.enc */
