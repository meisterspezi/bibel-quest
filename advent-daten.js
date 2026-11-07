/* =====================================================================
   Advent 2026 – Inhalte und Einstellungen (Version 7.3)
   Alles, was man später gern anpassen möchte, steht hier oben: Starttermine, Belohnungen, Ziele der Stationen.
   Die Logik und die Ansichten stehen in advent.js. Beide Dateien werden vor spiel.js geladen.
   Bibelstellen: Schlachter 2000 – Texte sind sinngemäß wiedergegeben, die Stellen sind angegeben.
   ===================================================================== */

/* ---------- Termine ---------- */
const ADV_START = "2026-11-29";        /* 1. Advent: Weg nach Bethlehem, Advents-Biblionär und Duell-Aktion beginnen */
const KAL_START = "2026-12-01";        /* Adventskalender: Türchen 1 */
const ADV_KRIPPE = "2026-12-24";       /* Heiligabend: das Kind liegt in der Krippe */
const ADV_SICHT_BIS = "2027-01-06";    /* so lange bleibt der Advent in der App sichtbar */

/* ---------- Weg nach Bethlehem: Gemeinschaftsprojekt mit Spenden ---------- */
const BETH_ZUSCHUSS = 0.5;             /* die Gemeinde legt zu jeder Gabe 50 % dazu */
const BETH_TAGE = 3;                   /* jede Station hat 3 Tage Zeit; danach füllt die Gemeinde den Rest auf */
const BETH_TAGESGABE = 5;              /* kostenlose „Wegzehrung“ je Spieler und Tag (zählt für den Weg, kostet keine Talente) */
/* ziel = so viele Talente braucht die Station (inklusive Gemeinde-Zuschuss). Summe 6.000 ≈ 4.000 Talente aus Spenden.
   Nach einem Blick in „Talente-Planung“ (Postkasten) hier anpassen. */
const BETH = [
  { n: "Nazareth – der Engel kommt", kurz: "Nazareth", v: "Lukas 1,26-38", ziel: 400,
    k: "In Nazareth in Galiläa erscheint der Engel Gabriel einer jungen Frau namens Maria. Sie soll einen Sohn bekommen und ihn Jesus nennen." },
  { n: "Bei Elisabeth im Bergland", kurz: "Elisabeth", v: "Lukas 1,39-45", ziel: 500,
    k: "Maria macht sich auf den Weg ins Bergland von Judäa. Ihre Verwandte Elisabeth freut sich mit ihr und segnet sie." },
  { n: "Josefs Traum", kurz: "Josef", v: "Matthäus 1,18-25", ziel: 600,
    k: "Josef will sich zuerst von Maria trennen. Da sagt ihm ein Engel im Traum: Hab keine Angst, nimm Maria zu dir – das Kind ist vom Heiligen Geist." },
  { n: "Der Befehl des Kaisers", kurz: "Kaiser", v: "Lukas 2,1-3", ziel: 700,
    k: "Kaiser Augustus befiehlt eine Volkszählung. Jeder soll sich in seiner Heimatstadt eintragen lassen." },
  { n: "Aufbruch nach Süden", kurz: "Aufbruch", v: "Lukas 2,4-5", ziel: 800,
    k: "Josef stammt aus dem Haus Davids. Darum zieht er mit der schwangeren Maria von Nazareth hinauf in die Stadt Davids, nach Bethlehem." },
  { n: "Ankunft in Bethlehem", kurz: "Bethlehem", v: "Lukas 2,6-7", ziel: 900,
    k: "Sie erreichen Bethlehem. Die Zeit der Geburt ist nahe – aber in der Herberge ist kein Platz für sie." },
  { n: "Ein Stall wird bereitet", kurz: "Stall", v: "Lukas 2,7", ziel: 1000,
    k: "Ein einfacher Stall wird zum Zuhause für diese Nacht. Eine Futterkrippe steht bereit – für das Kind, das bald kommt." },
  { n: "Der Stern geht auf", kurz: "Stern", v: "Matthäus 2,1-2", ziel: 1100,
    k: "Über Bethlehem leuchtet der Stern, dem später die Weisen aus dem Morgenland folgen. Noch eine Nacht – dann ist es so weit." }
];
const BETH_FINALE = { n: "Heiligabend – das Kind ist da!", v: "Lukas 2,7.11-12",
  k: "Maria bringt ihren ersten Sohn zur Welt, wickelt ihn in Windeln und legt ihn in eine Krippe. Der Engel sagt den Hirten: Euch ist heute der Retter geboren, der Christus, der Herr." };

/* ---------- Adventskalender (ab 1. Dezember) ---------- */
const KAL_TAL = 8, KAL_TAL_SPAET = 4, KAL_TAL_FRAGE = 4;   /* Talente: am Tag selbst / später geöffnet / Frage richtig */
const KAL_MEISTER = 20;                                     /* so viele Türchen für Rahmen „Adventskranz“ und Titel „Adventsbote“ */
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

/* ---------- Duell-Aktion und Advents-Biblionär ---------- */
const ADV_DU_ZIEL = 3;      /* so viele Duelle pro Adventswoche … */
const ADV_DU_GEGNER = 2;    /* … gegen mindestens so viele verschiedene Mitspieler */
const ADV_DU_TAL = 15;      /* Belohnung je geschaffter Woche (einmal) */
const ADV_BIB_TAL = 10;     /* Talente für eine gespielte Advents-Biblionär-Runde */
