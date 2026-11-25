/* Bibelbuch-Quest – 10.40: Adventskalender 2026 („Bethlehem bei Nacht“). Daten in advent-daten.js. */
const BL_W = 360, BL_H = 500;
const BL_DEFS = `<defs>
<linearGradient id="blHim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04061c"/><stop offset=".45" stop-color="#121a4a"/><stop offset=".8" stop-color="#2a3170"/><stop offset="1" stop-color="#4a3e6e"/></linearGradient>
<linearGradient id="blBerg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2a52"/><stop offset="1" stop-color="#1a1a38"/></linearGradient>
<linearGradient id="blBerg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3250"/><stop offset="1" stop-color="#231e34"/></linearGradient>
<linearGradient id="blStein" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9a07c"/><stop offset=".55" stop-color="#9c8462"/><stop offset="1" stop-color="#6e5a44"/></linearGradient>
<linearGradient id="blSteinD" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a7458"/><stop offset="1" stop-color="#55452f"/></linearGradient>
<linearGradient id="blFels" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a5a4a"/><stop offset="1" stop-color="#3a3028"/></linearGradient>
<radialGradient id="blHoehle" cx=".5" cy=".75" r=".7"><stop offset="0" stop-color="#fff2c0"/><stop offset=".35" stop-color="#ffc46a"/><stop offset=".75" stop-color="#b8662a"/><stop offset="1" stop-color="#3a1e10"/></radialGradient>
<radialGradient id="blGlut" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".7"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
<radialGradient id="blSternS" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe6" stop-opacity=".95"/><stop offset=".3" stop-color="#fff0b0" stop-opacity=".45"/><stop offset="1" stop-color="#fff0b0" stop-opacity="0"/></radialGradient>
<linearGradient id="blStrahl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d0" stop-opacity=".55"/><stop offset="1" stop-color="#fff6d0" stop-opacity="0"/></linearGradient>
<radialGradient id="blFen" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#fff8d8"/><stop offset=".5" stop-color="#ffc85a"/><stop offset="1" stop-color="#d8782a"/></radialGradient>
<linearGradient id="blHolz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5232"/><stop offset="1" stop-color="#4a2e18"/></linearGradient>
<filter id="blBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="blBlur2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4"/></filter>
</defs>`;
const _r = s => { let a = s; return () => (a = (a * 16807) % 2147483647) / 2147483647; };
/* Haus: Kalkstein-Würfel mit Flachdach, Brüstung, Außentreppe; Fenster werden später als Türen darübergelegt */
const blHaus = (x, y, w, h, o = {}) => { const r = _r(Math.round(x * 7 + y * 13));
  const steine = Array.from({ length: Math.floor(w * h / 260) }, () => { const sx = x + 3 + r() * (w - 10), sy = y + 4 + r() * (h - 10); return `<rect x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" width="${(5 + r() * 6).toFixed(1)}" height="2.4" rx="1" fill="#000" opacity="${(.06 + r() * .08).toFixed(2)}"/>`; }).join("");
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${o.d ? "blSteinD" : "blStein"})"/>
  <rect x="${x + w * .62}" y="${y}" width="${w * .38}" height="${h}" fill="#000" opacity=".22"/>${steine}
  <rect x="${x - 2}" y="${y - 4}" width="${w + 4}" height="5" fill="#cbb48e"/><rect x="${x - 2}" y="${y}" width="${w + 4}" height="1.6" fill="#000" opacity=".25"/>
  ${o.br ? `<rect x="${x + 2}" y="${y - 10}" width="${w * .45}" height="6" fill="#bfa682"/><path d="M${x + 4} ${y - 10}v-6M${x + w * .45} ${y - 10}v-6M${x + 2} ${y - 16}h${w * .45}" stroke="#5a4a3a" stroke-width="1.2"/>` : ""}
  ${o.tr ? `<path d="M${x + w} ${y + h}l${12} -${h * .7}h4v${h * .7}z" fill="#8a7458"/>${Array.from({ length: 5 }, (_, k) => `<path d="M${x + w + 2 + k * 2.6} ${y + h - 4 - k * h * .13}h4" stroke="#5a4a3a" stroke-width="1"/>`).join("")}` : ""}
  ${o.tuer ? `<path d="M${x + w * .2} ${y + h}v-12a5 5 0 0 1 10 0v12z" fill="#2a1a10"/>` : ""}</g>`; };
const blOlive = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0q-2 -10 2 -18q-6 -4 -4 -10" stroke="#3a2a1e" stroke-width="3" fill="none"/><ellipse cx="-4" cy="-26" rx="13" ry="8" fill="#2e4a3a"/><ellipse cx="7" cy="-22" rx="11" ry="7" fill="#3a5a46"/><ellipse cx="0" cy="-32" rx="9" ry="6" fill="#4a6a52" opacity=".9"/></g>`;
const blZypresse = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0q-7 -18 0 -46q7 28 0 46z" fill="#1e3a2c"/><path d="M0 -4q-3 -16 0 -38" stroke="#2e5a40" stroke-width="2" fill="none"/></g>`;
const blPalme = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0q-2 -24 4 -44" stroke="#3a2a1e" stroke-width="3.4" fill="none"/>${[[-24, -42], [-20, -54], [4, -60], [22, -52], [26, -40]].map(([a, b]) => `<path d="M4 -44Q${(a + 4) / 2} ${b - 10} ${a} ${b}Q${(a + 4) / 2 + 3} ${b - 3} 4 -44z" fill="#24442e"/>`).join("")}</g>`;
const blSchaf = (x, y, s = 1, f = 1) => `<g transform="translate(${x} ${y}) scale(${s * f} ${s})"><ellipse cx="0" cy="0" rx="7" ry="4.4" fill="#e8e2d4"/><circle cx="-4" cy="-2" r="3" fill="#f2ece0"/><circle cx="0" cy="-3" r="3.2" fill="#f2ece0"/><circle cx="4" cy="-2" r="3" fill="#f2ece0"/><ellipse cx="8" cy="-2" rx="2.6" ry="2" fill="#3a3028"/><path d="M-4 3v3M4 3v3" stroke="#3a3028" stroke-width="1.2"/></g>`;

/* Szene ohne Türen (Hintergrund) */
function blSzene(heute) {
  const r = _r(11), sterne = Array.from({ length: 90 }, () => { const x = r() * BL_W, y = r() * 200, s = .4 + r() * 1.3; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(1)}" fill="#fff" opacity="${(.25 + r() * .7).toFixed(2)}"/>`; }).join("");
  /* Der Stern wandert von links oben (Tür 0) bis genau über den Stall (Tür 24) */
  const t = Math.max(0, Math.min(1, heute / 24)), sx = 40 + (180 - 40) * t, sy = 40 + (70 - 40) * t * t, sg = 1 + t * .6;
  return `${BL_DEFS}<rect width="${BL_W}" height="${BL_H}" fill="url(#blHim)"/>${sterne}
  <g transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)}) scale(${sg.toFixed(2)})"><circle r="34" fill="url(#blSternS)"/><path d="M0 -18L3 -3 18 0 3 3 0 18-3 3-18 0-3 -3z" fill="#fffbe6"/><path d="M0 -9L1.5 -1.5 9 0 1.5 1.5 0 9-1.5 1.5-9 0-1.5 -1.5z" fill="#fff" transform="rotate(45)"/><circle r="3" fill="#fff"/></g>
  ${t >= .99 ? `<path d="M168 92L150 360H210L192 92z" fill="url(#blStrahl)" filter="url(#blBlur2)"/>` : ""}
  <path d="M0 230Q60 170 130 196T260 176T360 200V500H0z" fill="url(#blBerg1)"/>
  <path d="M0 270Q70 230 150 250T300 236T360 246V500H0z" fill="url(#blBerg2)" opacity=".9"/>
  ${blZypresse(18, 262, .8)}${blZypresse(338, 250, .7)}${blPalme(300, 256, .7)}
  <path d="M-10 500V300Q60 280 120 300L150 360Q180 372 210 360L240 300Q300 280 370 300V500z" fill="#2b2433"/>
  <path d="M120 300L150 360Q180 372 210 360L240 300" stroke="#4a3e52" stroke-width="2" fill="none" opacity=".6"/>`;
}
/* Stall: Felsenhöhle mit Holzvorbau, Krippe im Licht, Ochse und Esel als Schatten, Futterraufe */
function blStall(auf) {
  return `<g>
  <path d="M96 470Q90 380 130 350Q180 316 230 350Q272 380 266 470z" fill="url(#blFels)"/>
  <path d="M100 470Q96 392 132 362Q180 330 228 362Q262 392 260 470" fill="none" stroke="#7a6a58" stroke-width="2" opacity=".6"/>
  ${Array.from({ length: 14 }, (_, i) => `<path d="M${110 + (i * 37) % 140} ${370 + (i * 23) % 90}l${6 + i % 4} ${2 + i % 3}" stroke="#2a2018" stroke-width="1.4" opacity=".5"/>`).join("")}
  <path d="M138 470V404Q138 372 180 368Q222 372 222 404V470z" fill="${auf ? "url(#blHoehle)" : "#1a120c"}"/>
  ${auf ? `<ellipse cx="180" cy="430" rx="80" ry="54" fill="url(#blGlut)" filter="url(#blBlur)"/><clipPath id="adStallC"><path d="M138 470V404Q138 372 180 368Q222 372 222 404V470z"/></clipPath><g clip-path="url(#adStallC)">${adBildIn("krippe", 120, 356, 120, 120)}</g><path d="M138 470V404Q138 372 180 368Q222 372 222 404V470z" fill="none" stroke="#f2c14e" stroke-width="2.4"/>` : ""}
  <path d="M126 470V398M234 470V398" stroke="url(#blHolz)" stroke-width="7"/><path d="M118 400L180 360L242 400" stroke="url(#blHolz)" stroke-width="7" fill="none" stroke-linejoin="round"/>
  <path d="M122 396L180 356L238 396" stroke="#a87a4a" stroke-width="1.4" fill="none"/>
  <path d="M112 402l68 -46 68 46" stroke="#5a3a22" stroke-width="3" fill="none" opacity=".5"/>
  ${Array.from({ length: 9 }, (_, i) => `<path d="M${124 + i * 14} ${404 - Math.abs(4 - i) * 0}l-2 -${10 - Math.abs(4 - i)}" stroke="#d8b860" stroke-width="1.4" opacity=".55"/>`).join("")}
  <g opacity=".9">${blSchaf(100, 470, 1.2)}${blSchaf(256, 468, 1.1, -1)}</g></g>`;
}
/* Türen: 0 = 1. Advent, 1–23, 24 = Stall. Sonntage (0, 6, 13, 20) als Rundbogentore */
const BL_SO = { 0: "1. Advent", 6: "2. Advent", 13: "3. Advent", 20: "4. Advent" };
/* Häuser [x, y, w, h, opt, Türen [[nr, dx, dy]]] – hinten nach vorn */
const BL_HAEUSER = [
  [14, 196, 40, 34, { d: 1 }, [[1, 8, 9]]], [58, 186, 36, 44, { br: 1 }, [[2, 8, 10]]], [262, 182, 38, 40, { d: 1, br: 1 }, [[3, 8, 9]]], [306, 192, 42, 36, {}, [[4, 10, 8]]],
  [100, 200, 52, 46, { tr: 1 }, [[0, 8, 4]]], [212, 196, 46, 50, {}, [[5, 10, 12]]],
  [6, 244, 50, 48, { br: 1 }, [[7, 8, 10]]], [60, 252, 58, 52, { d: 1 }, [[6, 11, 6]]], [244, 250, 56, 52, { tr: 1 }, [[8, 8, 12]]], [304, 240, 52, 50, { d: 1, br: 1 }, [[9, 12, 10]]],
  [128, 252, 44, 40, {}, [[10, 8, 8]]], [190, 254, 44, 38, { d: 1 }, [[11, 10, 7]]],
  [2, 306, 54, 54, { d: 1 }, [[12, 8, 10]]], [304, 300, 56, 58, {}, [[13, 10, 9]]], [56, 316, 40, 46, { br: 1, tuer: 1 }, [[14, 14, 6]]], [262, 314, 40, 48, { tuer: 1 }, [[15, 8, 8]]],
  [0, 370, 46, 52, {}, [[16, 8, 10]]], [314, 366, 46, 54, { d: 1 }, [[17, 12, 10]]], [44, 376, 46, 50, { d: 1 }, [[18, 8, 12]]], [268, 378, 46, 48, { br: 1 }, [[19, 10, 10]]],
  [0, 430, 52, 70, { d: 1 }, [[20, 8, 14]]], [52, 440, 40, 60, {}, [[21, 8, 12]]], [268, 438, 42, 62, { d: 1 }, [[22, 8, 12]]], [310, 428, 50, 72, {}, [[23, 10, 14]]]];
/* Sonntagsbild in ein Fenster/Tor einsetzen (zugeschnitten) */
const adBildIn = (key, x, y, w, h) => tkBildSvg("adv", key).replace("<svg ", `<svg x="${x}" y="${y}" width="${w}" height="${h}" `);
function blTuer(nr, x, y, st) {
  const so = AD_SO[nr], w = so ? 36 : 25, h = so ? 40 : 26, /* 10.43: normale Fenster größer (vorher 18×18) */ auf = st.offen.includes(nr), zu = nr > st.heute, jetzt = nr === st.heute, nach = !auf && nr < st.heute && !adNachEnde();
  const form = so ? `M${x} ${y + h}V${y + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V${y + h}z` : `M${x} ${y + h}V${y + 5}a5 5 0 0 1 5 -5h${w - 10}a5 5 0 0 1 5 5V${y + h}z`;
  if (so) { /* 10.42: Adventssonntag – großes goldenes Bogenfenster, darüber n Kerzen, geöffnet mit dem Bild der Geschichte */
    const T = ADVENT_TUEREN[nr], cid = "adc" + nr + "_" + (++_tkZ);
    const kerzen = Array.from({ length: so }, (_, k) => { const kx = x + w / 2 + (k - (so - 1) / 2) * 7; return `<rect x="${kx - 1.6}" y="${y - 9}" width="3.2" height="7" rx=".8" fill="#d8283a"/>${auf ? `<path d="M${kx} ${y - 14}q2.2 2.6 0 5q-2.2 -2.4 0 -5z" fill="#ffd24a"/><circle cx="${kx}" cy="${y - 11}" r="4" fill="#ffe9a0" opacity=".35"/>` : ""}`; }).join("");
    return `<g class="bl-t so${jetzt ? " jetzt" : ""}${auf ? " auf" : ""}" data-tuer="${nr}"><rect x="${x - 6}" y="${y - 16}" width="${w + 12}" height="${h + 22}" fill="transparent"/>
      <circle cx="${x + w / 2}" cy="${y + h / 2}" r="${w * .9}" fill="url(#blGlut)" opacity="${auf ? 1 : .45}" filter="url(#blBlur2)"/>
      ${auf ? `<clipPath id="${cid}"><path d="${form}"/></clipPath><g clip-path="url(#${cid})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#141a44"/>${adBildIn(T.bild, x - 4, y, w + 8, h + 8)}</g>`
        : `<path d="${form}" fill="${zu ? "#1a1430" : "#3a2410"}"/><path d="M${x + w / 2} ${y + 4}V${y + h}" stroke="#5a3a22" stroke-width="1.2" opacity=".8"/>`}
      <path d="${form}" fill="none" stroke="${jetzt ? "#fff6c0" : "#f2c14e"}" stroke-width="${jetzt ? 3 : 2.2}"/>
      ${kerzen}
      ${auf ? "" : `<text x="${x + w / 2}" y="${y + h - 9}" text-anchor="middle" font-family="Georgia" font-weight="700" font-size="11" fill="${zu ? "#c8a86a" : "#ffe9a8"}">${nr === 0 ? "★" : nr}</text>`}
      ${nach ? `<circle cx="${x + w}" cy="${y + 2}" r="4.4" fill="#e8475f"/>` : ""}</g>`;
  }
  return `<g class="bl-t${jetzt ? " jetzt" : ""}" data-tuer="${nr}"><rect x="${x - 7}" y="${y - 7}" width="${w + 14}" height="${h + 14}" fill="transparent"/>
    ${auf ? `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="${w}" fill="url(#blGlut)" filter="url(#blBlur2)"/>` : ""}
    <path d="${form}" fill="${auf ? "url(#blFen)" : zu ? "#1a1424" : "#3a2a1a"}" stroke="${jetzt ? "#fff6c0" : "#3a2a1a"}" stroke-width="${jetzt ? 2 : 1.4}"/>
    ${!auf ? `<path d="M${x + w / 2} ${y + 3}V${y + h}" stroke="#5a3a22" stroke-width="1" opacity="${zu ? .5 : .9}"/>` : ""}
    <text x="${x + w / 2}" y="${y + h - 7}" text-anchor="middle" font-family="Georgia" font-weight="700" font-size="12" fill="${auf ? "#5a2a08" : zu ? "#8a7a8a" : "#e8c890"}">${nr}</text>
    ${nach ? `<circle cx="${x + w}" cy="${y}" r="4" fill="#e8475f"/>` : ""}</g>`;
}
function bethlehem(st) {
  const haeuser = BL_HAEUSER.map(([x, y, w, h, o, t]) => blHaus(x, y, w, h, o) + t.map(([nr, dx, dy]) => AD_SO[nr] ? blTuer(nr, x + dx, y + dy, st) : blTuer(nr, x + Math.round((w - 25) / 2), y + Math.min(dy, h - 30), st)).join("")).join("");
  const stallAuf = st.offen.includes(24), stallJetzt = st.heute === 24;
  return `<svg viewBox="0 0 ${BL_W} ${BL_H}" class="bl-svg">${blSzene(st.heute)}
    ${blOlive(118, 302, .9)}${blOlive(248, 300, .85)}
    ${haeuser}
    ${blStall(stallAuf)}
    ${typeof blSchmuck === "function" && typeof schSumme === "function" ? blSchmuck(st.schmuck != null ? st.schmuck : schStufe(schSumme())) : ""}
    <g class="bl-t so${stallJetzt ? " jetzt" : ""}" data-tuer="24"><path d="M138 470V404Q138 372 180 368Q222 372 222 404V470z" fill="transparent"/><rect x="160" y="476" width="40" height="16" rx="8" fill="${stallAuf ? "#f2c14e" : "#1a1424"}" stroke="${stallJetzt ? "#fff6c0" : "#f2c14e"}" stroke-width="1.4"/><text x="180" y="488" text-anchor="middle" font-family="Georgia" font-weight="700" font-size="11" fill="${stallAuf ? "#3a1e08" : "#f2c14e"}">24</text></g>
  </svg>`;
}
const _schaf = blSchaf;
/* ---------- 10.40: Bilder der Adventssonntage und von Heiligabend (240×240, Stil der Themen-Ketten-Bilder) ---------- */
const _engel = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="-40" r="34" fill="#fff6d0" opacity=".35" filter="url(#bl@)"/>
  <path d="M-8 -44Q-46 -66 -50 -26Q-34 -40 -12 -30z" fill="#f6f2ff" stroke="#d8d0f0" stroke-width="1"/><path d="M8 -44Q46 -66 50 -26Q34 -40 12 -30z" fill="#f6f2ff" stroke="#d8d0f0" stroke-width="1"/>
  <path d="M-36 -46q8 4 16 6M-40 -38q10 2 18 4M36 -46q-8 4 -16 6M40 -38q-10 2 -18 4" stroke="#c8c0e8" stroke-width="1" fill="none"/>
  <path d="M-16 0l6 -48h20l6 48z" fill="#ffffff"/><path d="M-10 -48h20l3 22h-26z" fill="#f2eeff"/><path d="M-3 -48l-5 48h4l4 -46z" fill="#d8d0f0" opacity=".6"/>
  <circle cx="0" cy="-58" r="10" fill="#f2d2b0"/><path d="M-10 -60q0 -12 10 -12t10 12q-4 -6 -10 -6t-10 6z" fill="#f2d27a"/>
  <ellipse cx="0" cy="-72" rx="11" ry="3" fill="none" stroke="#fff3a0" stroke-width="2"/><path d="M-10 -40l-14 -16M10 -40l14 -16" stroke="#fff" stroke-width="6" stroke-linecap="round"/></g>`;
const _frau = (x, y, s, o = {}) => _mann(x, y, s, Object.assign({ bart: "#e8b88a", tuch: o.tuch || "#5a8ad8", g: o.g || "#3a5aa8", g2: o.g2 || "#6a8ad0" }, o));
const _esel = (x, y, s = 1, f = 1) => `<g transform="translate(${x} ${y}) scale(${s * f} ${s})"><path d="M-22 4v18M-12 6v16M12 6v16M20 4v18" stroke="#7a7068" stroke-width="5" stroke-linecap="round"/><ellipse cx="0" cy="0" rx="26" ry="13" fill="#8a8078"/><path d="M20 -4q12 -14 16 -22l8 4q-4 14 -14 24z" fill="#8a8078"/><ellipse cx="40" cy="-20" rx="7" ry="5" fill="#9a9088"/><path d="M34 -26l-2 -12 4 1 2 10M40 -26l2 -12 3 2 -2 10" fill="#7a7068"/><circle cx="40" cy="-22" r="1.2" fill="#1a1410"/><path d="M-26 0q-6 6 -4 14" stroke="#6a6058" stroke-width="2" fill="none"/></g>`;
const ADV_BILD = {};
/* 1. Advent – Die Verheißung (Jesaja 9,5): Prophet unter dem Sternenhimmel, Schriftrolle, der Stern leuchtet von fern */
ADV_BILD.verheissung = () => `<defs>${TK_DEFS_GLANZ}<linearGradient id="s@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070b2a"/><stop offset=".7" stop-color="#26306a"/><stop offset="1" stop-color="#5a4a7a"/></linearGradient></defs>
<rect width="240" height="240" fill="url(#s@)"/>${_sterne(7, 60, 4, 4, 236, 150, 1.4)}
<g transform="translate(170 52)"><circle r="40" fill="#fff3b0" opacity=".25" filter="url(#bl@)"/>${_fk(0, 0, 16, 1, "#fff8d0")}<circle r="5" fill="#fff"/></g>
<path d="M170 60L120 200" stroke="#fff3b0" stroke-opacity=".16" stroke-width="30" filter="url(#bl@)"/>
<path d="M0 196Q60 170 120 182T240 176V240H0z" fill="#3a3050"/><path d="M0 214Q120 200 240 214V240H0z" fill="#2a2238"/>
<g opacity=".7"><path d="M10 196l20-30 20 30z" fill="#4a3e60"/><path d="M196 186l24-36 24 36z" fill="#4a3e60"/></g>
${_mann(90, 214, 1.15, { arm: "hoch", g: "#5a3a7a", g2: "#7a5a9a" })}
<g transform="translate(140 206)"><rect x="-18" y="-6" width="36" height="12" rx="6" fill="#f2e2b8"/><rect x="-22" y="-8" width="6" height="16" rx="3" fill="#c99a4a"/><rect x="16" y="-8" width="6" height="16" rx="3" fill="#c99a4a"/><path d="M-12 -2h24M-12 2h18" stroke="#8a6a3a" stroke-width="1.2"/></g>
<g fill="#ffe9a0">${_fk(40, 40, 5, .8)}${_fk(110, 24, 4, .7)}${_fk(220, 120, 4, .6)}</g>`;
/* 2. Advent – Der Engel bei Maria (Lukas 1,30–31): Haus in Nazareth, Licht fällt herein */
ADV_BILD.maria = () => `<defs>${TK_DEFS_GLANZ}<linearGradient id="w@" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d8bc8e"/><stop offset="1" stop-color="#9c8058"/></linearGradient>
<radialGradient id="l@" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#fffbe6"/><stop offset=".4" stop-color="#fff0b8" stop-opacity=".6"/><stop offset="1" stop-color="#fff0b8" stop-opacity="0"/></radialGradient></defs>
<rect width="240" height="240" fill="url(#w@)"/><rect x="0" y="0" width="240" height="240" fill="#000" opacity=".12"/>
<path d="M20 30h50v70h-50z" fill="#1c2458"/>${_sterne(3, 10, 22, 32, 68, 98, 1)}<path d="M20 30h50v70h-50z" fill="none" stroke="#6a5038" stroke-width="5"/><path d="M45 30v70M20 65h50" stroke="#6a5038" stroke-width="3"/>
<path d="M0 196H240V240H0z" fill="#8a6a48"/><path d="M0 196H240" stroke="#6a4e34" stroke-width="2"/>
<rect width="240" height="240" fill="url(#l@)"/>
${_engel(70, 190, 1.25)}
<g transform="translate(172 222)"><path d="M-26 0q-4 -12 4 -22h44q8 10 4 22z" fill="#7a5a3a"/></g>
${_frau(168, 206, 1.1, { arm: "", g: "#2f4f9a", g2: "#5a7ac8", tuch: "#e8eef8" })}
<g transform="translate(206 186)"><path d="M0 0q-6 -16 0 -30q6 14 0 30z" fill="#4a7a3a"/><circle cx="0" cy="-30" r="5" fill="#fff"/><circle cx="-4" cy="-22" r="4" fill="#fff"/><path d="M-8 0h16l-3 12h-10z" fill="#a86a3a"/></g>
<g fill="#fff">${_fk(110, 70, 5, .8)}${_fk(130, 110, 3, .6)}${_fk(40, 140, 4, .7)}</g>`;
/* 3. Advent – Der Weg nach Bethlehem (Lukas 2,4–5): Josef führt den Esel, Maria reitet, Bethlehem in der Ferne */
ADV_BILD.weg = () => `<defs>${TK_DEFS_GLANZ}<linearGradient id="s@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1038"/><stop offset=".6" stop-color="#3a3a7a"/><stop offset="1" stop-color="#c8785a"/></linearGradient></defs>
<rect width="240" height="240" fill="url(#s@)"/>${_sterne(21, 40, 4, 4, 236, 100, 1.2)}
<g transform="translate(196 40)"><circle r="20" fill="#fff3b0" opacity=".3" filter="url(#bl@)"/>${_fk(0, 0, 9, 1, "#fff8d0")}</g>
<path d="M0 150Q80 120 160 140T240 130V240H0z" fill="#5a4a5a"/>
<g transform="translate(190 128)" opacity=".85">${_ar(6, i => `<rect x="${-26 + i * 9}" y="${-8 - (i % 3) * 5}" width="9" height="${10 + (i % 3) * 5}" fill="#8a7a6a"/><rect x="${-24 + i * 9}" y="${-4 - (i % 3) * 5}" width="3" height="3" fill="#ffd27a"/>`)}</g>
<path d="M0 170Q100 150 240 166V240H0z" fill="#7a6248"/><path d="M60 240Q110 200 200 150" stroke="#a88a62" stroke-width="22" fill="none" opacity=".7"/>
<path d="M0 200Q120 186 240 204V240H0z" fill="#5a4632"/>${_palme(20, 196, .8)}
${_esel(110, 196, 1.1)}
${_frau(108, 186, .78, { g: "#2f4f9a", g2: "#5a7ac8", tuch: "#e8eef8" })}
${_mann(170, 212, 1, { arm: "stab", g: "#7a5a3a", g2: "#9a7a52", bart: "#5a3a22", tuch: "#d8c8a8" })}${_stab(194, 172, 200, 212)}
<path d="M148 196l-14 -4" stroke="#5a3a22" stroke-width="2"/>`;
/* 4. Advent – Die Hirten auf dem Feld (Lukas 2,10–11): Engel im Licht über der nächtlichen Weide */
ADV_BILD.hirten = () => `<defs>${TK_DEFS_GLANZ}<radialGradient id="h@" cx=".5" cy=".3" r=".6"><stop offset="0" stop-color="#fffbe0"/><stop offset=".35" stop-color="#ffe9a0" stop-opacity=".75"/><stop offset="1" stop-color="#1a2050" stop-opacity="0"/></radialGradient>
<linearGradient id="s@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0e30"/><stop offset="1" stop-color="#2a3268"/></linearGradient></defs>
<rect width="240" height="240" fill="url(#s@)"/>${_sterne(5, 40, 4, 4, 236, 140, 1.2)}
<rect width="240" height="240" fill="url(#h@)"/>
${_engel(120, 104, 1.05)}
<path d="M0 170Q80 150 160 166T240 160V240H0z" fill="#2e4a3a"/><path d="M0 200Q120 186 240 200V240H0z" fill="#22382c"/>
<g transform="translate(40 190)"><circle r="10" fill="#ff8a2a" opacity=".5" filter="url(#bs@)"/><path d="M-8 4l16 -2M-6 -2l12 6" stroke="#5a3418" stroke-width="3"/><path d="M-4 0q4 -14 6 -2q2 -6 4 2z" fill="#ffc24a"/></g>
${_mann(72, 214, .95, { arm: "hoch", g: "#7a6a4a", g2: "#9a8a62", bart: "#5a4030", tuch: "#c8b890" })}
${_mann(196, 212, .85, { arm: "", f: 1, g: "#6a5a3a", g2: "#8a7a52", bart: "#d8d8d8", tuch: "#b8a880" })}${_stab(222, 168, 228, 212)}
${_schaf(110, 214, 1.4)}${_schaf(146, 222, 1.2, -1)}${_schaf(30, 226, 1.1)}${_schaf(166, 196, .9)}`;
/* Heiligabend – Das Kind in der Krippe (Lukas 2,7): der Stall im Licht, Maria und Josef, Ochse und Esel, der Stern darüber */
ADV_BILD.krippe = () => `<defs>${TK_DEFS_GLANZ}<radialGradient id="g@" cx=".5" cy=".7" r=".6"><stop offset="0" stop-color="#fff6d0"/><stop offset=".35" stop-color="#ffc85a"/><stop offset=".8" stop-color="#8a4a1e"/><stop offset="1" stop-color="#3a1e10"/></radialGradient>
<linearGradient id="s@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05081e"/><stop offset="1" stop-color="#1c2458"/></linearGradient>
<linearGradient id="f@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a5a4a"/><stop offset="1" stop-color="#2e261e"/></linearGradient></defs>
<rect width="240" height="240" fill="url(#s@)"/>${_sterne(17, 26, 4, 4, 236, 60, 1.2)}
<g transform="translate(120 22)"><circle r="26" fill="#fff6c0" opacity=".45" filter="url(#bl@)"/>${_fk(0, 0, 13, 1, "#fffbe6")}</g><path d="M112 34L96 120H144L128 34z" fill="#fff6d0" opacity=".22" filter="url(#bs@)"/>
<path d="M-10 240Q-6 120 60 80Q120 46 180 80Q246 120 250 240z" fill="url(#f@)"/>
<path d="M28 240V150Q28 96 120 92Q212 96 212 150V240z" fill="url(#g@)"/>
<path d="M30 240V148Q40 102 120 96" stroke="#ffe9a8" stroke-opacity=".25" stroke-width="3" fill="none"/>
<path d="M14 240V138M226 240V138" stroke="#4a2e18" stroke-width="10"/><path d="M4 142L120 80L236 142" stroke="#5a3820" stroke-width="10" fill="none" stroke-linejoin="round"/>
<g transform="translate(58 196)" opacity=".85"><ellipse cx="0" cy="0" rx="26" ry="14" fill="#6a4a30"/><circle cx="-24" cy="-8" r="11" fill="#6a4a30"/><path d="M-32 -16q-8 -6 -6 -12M-18 -16q6 -8 2 -12" stroke="#e8dcc0" stroke-width="3" fill="none"/></g>
${_esel(196, 204, .8, -1)}
${_frau(86, 222, 1.05, { g: "#2f4f9a", g2: "#5a7ac8", tuch: "#eef2fa" })}
${_mann(160, 222, 1.08, { arm: "stab", f: 1, g: "#7a5a3a", g2: "#9a7a52", bart: "#5a3a22", tuch: "#d8c8a8" })}
<g transform="translate(122 220)"><path d="M-30 -4l-6 24M30 -4l6 24" stroke="#4a2a12" stroke-width="4"/><path d="M-34 -10h68l-6 14h-56z" fill="#8a5a2a"/><path d="M-30 -10q30 -14 60 0" fill="#e8c86a"/>
  <ellipse cx="0" cy="-14" rx="18" ry="7" fill="#fffaf0"/><path d="M-12 -14q12 6 22 -2" stroke="#d8ccb8" stroke-width="1" fill="none"/><circle cx="14" cy="-18" r="5.4" fill="#f2c9a0"/>
  <circle cx="14" cy="-18" r="11" fill="none" stroke="#fff6c0" stroke-width="1.6" opacity=".9"/><circle cx="4" cy="-16" r="26" fill="#fff6c0" opacity=".25" filter="url(#bl@)"/></g>
<g fill="#fff">${_fk(30, 40, 4, .7)}${_fk(210, 50, 5, .8)}</g>`;
if (typeof TK_BILD !== "undefined") TK_BILD.adv = ADV_BILD;
/* ---------- 10.40: Adventskalender 2026 – Logik, Ansicht, Belohnungen ----------
   Tür 0 = 1. Advent (So 29.11.), Türen 1–24 = 1.–24.12. Nachholen bis 6.1.2027 mit voller Belohnung.
   Tag nach der Serverzeit in Berlin (today() über uhr.js); in der Beta und auf localhost gilt das Testdatum aus dem Testlabor –
   mit Testdatum ist alles Vorschau: Türen werden nur in dieser Sitzung geöffnet, keine Belohnungen.
   Stand im Spielstand S.adv = { o: { "<nr>": dayNum des Öffnens }, ank }; beim Zusammenführen je Tür der früheste Tag. */
const AD_TAGE = ["2026-11-29", ...Array.from({ length: 24 }, (_, i) => `2026-12-${i + 1}`)];
const AD_ENDE = "2027-01-06", AD_NEU_BIS = "2026-12-06", AD_ANSICHT_BIS = "2027-01-31"; /* bis 6.1. nachholen, bis 31.1. Bilder und Verse ansehen */
const AD_SO = { 0: 1, 6: 2, 13: 3, 20: 4 }; /* Adventssonntag n */
const AD_WT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const adLokal = () => /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const adHeuteStr = () => (typeof edHeute === "function" ? edHeute() : today());
const adTest = () => adHeuteStr() !== today();
const adTag = nr => dayNum(AD_TAGE[nr]);
const adJetzt = () => dayNum(adHeuteStr());
const adLaeuft = () => adJetzt() >= adTag(0) && adJetzt() <= dayNum(AD_ENDE);
const adNachEnde = () => adJetzt() > dayNum(AD_ENDE);
const adSichtbar = () => (adJetzt() >= adTag(0) && adJetzt() <= dayNum(AD_ANSICHT_BIS)) || (typeof BETA !== "undefined" && BETA) || adLokal();
const adHeuteNr = () => { const d = adJetzt(); let n = -1; AD_TAGE.forEach((t, i) => { if (dayNum(t) <= d) n = i; }); return n; };
const adDatumText = nr => { const d = datumVon(adTag(nr)); return `${AD_WT[d.getUTCDay()]} ${d.getUTCDate()}. ${d.getUTCMonth() === 10 ? "November" : "Dezember"}`; };
function adEcht() { if (!S.adv || typeof S.adv !== "object") S.adv = {}; if (!S.adv.o || typeof S.adv.o !== "object") S.adv.o = {}; return S.adv; }
function adStand() { if (!adTest()) return adEcht().o; try { const o = JSON.parse(sessionStorage.getItem("bq-adv-test") || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
const adOffen = nr => adStand()[nr] != null;
const adAnzahl = () => Object.keys(adEcht().o).length;
const adAmTag = () => Object.entries(adEcht().o).filter(([nr, t]) => +t === adTag(+nr)).length;
/* Belohnungen je Tür */
function adLohn(nr) {
  const so = AD_SO[nr], hl = nr === 24;
  return { xp: hl ? 150 : so ? 100 : 50, manna: hl ? 10 : so ? 5 : 3, krug: hl ? "gold" : so ? "silber" : null,
    rahmen: hl ? "adv-kranz5" : so ? "adv-kranz" + so : null, avatar: hl ? "adv-krippe" : null };
}
/* Geschenk-Krüge aus dem Kalender (nur echter Stand) – zählt sammel.js mit */
const adKruege = art => Object.keys(adEcht().o).filter(nr => adLohn(+nr).krug === art).length;
/* Freischaltung von Rahmen/Avatar (need „adv-…“) */
/* 10.43: Weihnachts-Rahmen und Krippen-Avatar gelten nur bis 6.1.2027 – im nächsten Advent wieder neu erspielen */
function adFrei(need) {
  if (adNachEnde()) return false;
  const o = adEcht().o;
  if (need === "adv-schmuck") return schEcht().g >= 1;
  if (need === "adv-stern") return Object.keys(o).length >= 10;
  if (need === "adv-stern-g") return adAmTag() >= 25;
  const m = /^adv-(\d+)$/.exec(need || ""); return !!m && o[m[1]] != null;
}
const adNeedText = need => adNachEnde() ? "Weihnachts-Belohnung – im nächsten Advent wieder erspielen" : adNeedText0(need);
const adNeedText0 = need => need === "adv-schmuck" ? "Bethlehem schmücken: 1 Schmuckstück spenden" : need === "adv-stern" ? "Adventskalender: 10 Türen geöffnet" : need === "adv-stern-g" ? "Adventskalender: alle 25 Türen am richtigen Tag" : /^adv-(\d+)$/.test(need || "") ? `Adventskalender: Tür ${need === "adv-0" ? "1. Advent" : need.slice(4)}` : "Adventskalender";
function adMischen(r) {
  if (!r || !r.adv || !r.adv.o) return; const o = adEcht().o;
  Object.entries(r.adv.o).forEach(([nr, t]) => { if (+t > 0 && (o[nr] == null || +t < +o[nr])) o[nr] = +t; });
  if (r.adv.ank) adEcht().ank = 1;
}
/* Avatar und Rahmen anmelden */
(function adLohnAnmelden() {
  if (typeof AVATARE !== "undefined" && !AVATARE.some(a => a.id === "adv-krippe")) AVATARE.push({ id: "adv-krippe", name: "Christus in der Krippe", price: -1, need: "adv-24", bezug: "Maria gebar ihren ersten Sohn, wickelte ihn in Windeln und legte ihn in eine Krippe (Lukas 2,7). Heiligabend im Adventskalender 2026 – gilt bis 6. Januar." });
  if (typeof RAHMEN !== "undefined" && !RAHMEN.some(r => r.id === "adv-kranz1")) {
    [1, 2, 3, 4].forEach(n => RAHMEN.push({ id: "adv-kranz" + n, name: `Adventskranz · ${n} ${n === 1 ? "Kerze" : "Kerzen"}`, price: -1, need: "adv-" + [0, 6, 13, 20][n - 1], bezug: `${n}. Advent im Adventskalender 2026 – das Licht kommt näher (Johannes 1,9). Gilt bis 6. Januar.` }));
    RAHMEN.push({ id: "adv-kranz5", name: "Adventskranz · Heiligabend", price: -1, need: "adv-24", bezug: "Alle Kerzen brennen: Heute ist euch der Retter geboren (Lukas 2,11). Gilt bis 6. Januar." });
    RAHMEN.push({ id: "adv-stern", name: "Sternenhimmel", price: -1, need: "adv-stern", bezug: "Der Stern ging den Weisen voraus (Matthäus 2,9). Für 10 geöffnete Türen im Adventskalender. Gilt bis 6. Januar." });
    RAHMEN.push({ id: "adv-stern-g", name: "Sternenhimmel · Gold", price: -1, need: "adv-stern-g", bezug: "Alle 25 Türen am richtigen Tag geöffnet – treu durch den ganzen Advent. Gilt bis 6. Januar." });
  }
  if (typeof BADGES !== "undefined" && !BADGES.some(b => b.id === "adventstreue")) BADGES.push({ id: "adventstreue", kat: "gemeinschaft", name: "Adventstreue", d: "Alle 25 Türen des Adventskalenders am richtigen Tag geöffnet", ic: "star", tal: 25, ok: () => adAmTag() >= 25 });
})();

/* ---------- Grafik: Avatar „Christus in der Krippe“ und Rahmen ---------- */
const AD_GR = `<defs><linearGradient id="adG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b0"/><stop offset=".5" stop-color="#f2c14e"/><stop offset="1" stop-color="#b8862a"/></linearGradient>
<linearGradient id="adTanne" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fae5a"/><stop offset="1" stop-color="#1f6a34"/></linearGradient>
<linearGradient id="adKerze" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff6a6a"/><stop offset=".45" stop-color="#d8283a"/><stop offset="1" stop-color="#8a1222"/></linearGradient>
<radialGradient id="adFl" cx=".5" cy=".7" r=".6"><stop offset="0" stop-color="#fffbe6"/><stop offset=".45" stop-color="#ffd24a"/><stop offset="1" stop-color="#ff8a2a"/></radialGradient>
<radialGradient id="adSchein" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff3b0" stop-opacity=".9"/><stop offset="1" stop-color="#fff3b0" stop-opacity="0"/></radialGradient>
<linearGradient id="adHolz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c48a4a"/><stop offset="1" stop-color="#7a4a22"/></linearGradient></defs>`;
const adSpark = (x, y, s = 1) => `<path d="M${x} ${y - 5 * s}l${1.4 * s} ${3.6 * s} ${3.6 * s} ${1.4 * s}-${3.6 * s} ${1.4 * s}-${1.4 * s} ${3.6 * s}-${1.4 * s}-${3.6 * s}-${3.6 * s}-${1.4 * s} ${3.6 * s}-${1.4 * s}z" fill="#fff"/>`;
const adFlamme = (x, y, s = 1) => `<ellipse cx="${x}" cy="${y - 2 * s}" rx="${6 * s}" ry="${7 * s}" fill="url(#adSchein)"/><path d="M${x} ${y - 9 * s}q${3.4 * s} ${4.6 * s} ${2.2 * s} ${7.4 * s}q-1 ${2 * s} -${2.2 * s} ${2 * s}q-${2.2 * s} 0 -${2.4 * s} -${2.2 * s}q-${.2 * s} -${3.4 * s} ${2.4 * s} -${7.2 * s}z" fill="url(#adFl)"/>`;
ICONS["av-adv-krippe"] = `<svg viewBox="0 0 64 64" class="wr wr-avatar">${AD_GR}
  <g stroke="#fff3b0" stroke-width="1.2" opacity=".55">${Array.from({ length: 10 }, (_, i) => { const a = (-160 + i * 15.5) / 57.3; return `<path d="M32 30L${(32 + Math.cos(a) * 30).toFixed(1)} ${(30 + Math.sin(a) * 30).toFixed(1)}"/>`; }).join("")}</g>
  <circle cx="32" cy="36" r="20" fill="url(#adSchein)"/>
  <path d="M32 3l2 5.2 5.4.4-4.2 3.4 1.4 5.4L32 14.6l-4.6 2.8 1.4-5.4-4.2-3.4 5.4-.4z" fill="url(#adG)" stroke="#8a5a10" stroke-width=".6"/><path d="M32 18v10" stroke="#fff3b0" stroke-width="1.4" opacity=".7"/>
  <path d="M12 42l4 16M52 42l-4 16M16 58l-4 2M48 58l4 2" stroke="#5a3418" stroke-width="3" stroke-linecap="round"/>
  <path d="M10 40h44l-5 12H15z" fill="url(#adHolz)" stroke="#4a2a12" stroke-width="1"/><path d="M14 44h36" stroke="#4a2a12" stroke-width=".8" opacity=".6"/>
  <g stroke="#f2d27a" stroke-width="1.2" stroke-linecap="round">${Array.from({ length: 12 }, (_, i) => `<path d="M${12 + i * 3.6} 41l${(i % 3) - 1} -4"/>`).join("")}</g>
  <ellipse cx="32" cy="37" rx="12" ry="5.6" fill="#fffaf0" stroke="#d8ccb8" stroke-width=".8"/><path d="M24 37q8 4 14 -1M27 34q6 3 10 0" stroke="#d8ccb8" stroke-width=".8" fill="none"/>
  <circle cx="41" cy="34" r="4.6" fill="#f2c9a0"/><path d="M37 33q4 -5 8 0" fill="#fffaf0" stroke="#d8ccb8" stroke-width=".6"/>
  <circle cx="41" cy="34" r="8" fill="none" stroke="#fff3b0" stroke-width="1.2" opacity=".8"/>${adSpark(12, 14, .8)}${adSpark(53, 20, .6)}</svg>`;
function adRahmenKranz(n) {
  const gold = n >= 5;
  const zw = Array.from({ length: 30 }, (_, i) => { const a = i / 30 * Math.PI * 2, x = 50 + Math.cos(a) * 41, y = 50 + Math.sin(a) * 41; return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6.6" ry="3.2" fill="${gold ? "url(#adG)" : "url(#adTanne)"}" transform="rotate(${(a * 57.3 + 90 + (i % 2 ? 25 : -25)).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }).join("");
  const be = Array.from({ length: 8 }, (_, i) => { const a = (i + .5) / 8 * Math.PI * 2; return `<circle cx="${(50 + Math.cos(a) * 43).toFixed(1)}" cy="${(50 + Math.sin(a) * 43).toFixed(1)}" r="2.4" fill="#e8344a"/>`; }).join("");
  const kz = [-90, 0, 90, 180].map((w, i) => { const a = w / 57.3, x = 50 + Math.cos(a) * 43, y = 50 + Math.sin(a) * 43; return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><rect x="-3" y="-9" width="6" height="11" rx="1.2" fill="url(#adKerze)" stroke="#5a0a14" stroke-width=".6"/>${i < Math.min(4, n) ? adFlamme(0, -10, .62) : ""}</g>`; }).join("");
  return `<svg class="av-fr" viewBox="0 0 100 100" aria-hidden="true">${AD_GR}${zw}${be}${kz}${gold ? adSpark(88, 8, 1.1) + adSpark(12, 90, .8) : ""}</svg>`;
}
function adRahmenSterne(gold) {
  const c = gold ? "#f2c14e" : "#cfd8ee";
  return `<svg class="av-fr" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="41" fill="none" stroke="#141a3a" stroke-width="5"/><circle cx="50" cy="50" r="41" fill="none" stroke="${c}" stroke-width="2.6"/><circle cx="50" cy="50" r="37" fill="none" stroke="${c}" stroke-width=".8" opacity=".6"/>${Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2 - Math.PI / 2, x = 50 + Math.cos(a) * 41, y = 50 + Math.sin(a) * 41; return `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${i === 0 ? 1.6 : i % 3 ? .75 : 1.05})" d="M0 -5l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z" fill="${i === 0 ? "#fff8d0" : c}"/>`; }).join("")}</svg>`;
}
if (window.RAHMEN_SVG) { [1, 2, 3, 4, 5].forEach(n => { RAHMEN_SVG["adv-kranz" + n] = adRahmenKranz(n); }); RAHMEN_SVG["adv-stern"] = adRahmenSterne(false); RAHMEN_SVG["adv-stern-g"] = adRahmenSterne(true); }

/* ---------- Ansicht ---------- */
const adLink = s => "https://www.bibleserver.com/SLT/" + encodeURIComponent(s.replace(/\. /, "").replace(/ /g, "").replace(/–/g, "-"));
VIEWS.advent = () => {
  if (!adSichtbar()) { go("home"); return; }
  const h = adHeuteNr(), offen = Object.keys(adStand()).map(Number), test = adTest();
  const vorStart = h < 0 && adJetzt() < adTag(0);
  const kopf = vorStart ? `Startet am Sonntag, 29. November` : adNachEnde() ? "Danke fürs Mitfeiern – frohes neues Jahr!" : h >= 24 ? (adAnzahl() >= 25 || test ? "Frohe Weihnachten!" : "Frohe Weihnachten – verpasste Türen bis 6.1. nachholen") : `Noch ${24 - Math.max(0, h)} ${24 - Math.max(0, h) === 1 ? "Tag" : "Tage"} bis Heiligabend`;
  screen.innerHTML = `${backBtn("home", "Start")}<div class="ad-seite">
    <div class="ad-titel"><b>Adventskalender</b><small>${kopf}</small></div>
    ${test ? `<div class="ad-test">Vorschau mit Testdatum ${esc(adHeuteStr())} – keine Belohnungen. <button class="btn ghost mini" id="adTagZ">◀</button><button class="btn ghost mini" id="adTagV">▶</button><button class="btn ghost mini" id="adReset">Zurücksetzen</button></div>`
      : vorStart && (BETA || adLokal()) ? `<div class="ad-test">Beta-Vorschau: Im Testlabor ein Datum ab 29.11. wählen, um Türen zu öffnen.</div>` : ""}
    <div class="ad-buehne">${bethlehem({ heute: h, offen })}</div>
    ${schHtml()}
    <div class="ad-gesch-t">Die Weihnachtsgeschichte</div>
    <div class="ad-gesch">${[0, 6, 13, 20, 24].map(nr => { const auf = adOffen(nr), T = ADVENT_TUEREN[nr]; return `<button class="ad-g${auf ? " auf" : ""}" data-gesch="${nr}"><span class="ad-g-b">${auf ? tkBildSvg("adv", T.bild) : `<i>${nr === 24 ? "★" : AD_SO[nr]}</i>`}</span><small>${nr === 24 ? "Heiligabend" : AD_SO[nr] + ". Advent"}</small></button>`; }).join("")}</div>
    <div class="ad-lohnreihe">${["adv-kranz1", "adv-kranz2", "adv-kranz3", "adv-kranz4", "adv-kranz5"].map((id, i) => `<span class="ad-l${adFrei(["adv-0", "adv-6", "adv-13", "adv-20", "adv-24"][i]) ? " frei" : ""}" title="${esc(RAHMEN.find(r => r.id === id).name)}">${avatarHtml({ name: S.lbName || "?", avatar: i === 4 ? "adv-krippe" : S.avatar, frame: id }, 30)}</span>`).join("")}</div>
</div>`;
  wireGo();
  screen.querySelectorAll("[data-tuer]").forEach(t => t.addEventListener("click", () => adTuerTippen(+t.dataset.tuer)));
  schVerdrahten();
  screen.querySelectorAll("[data-gesch]").forEach(b => b.onclick = () => { const nr = +b.dataset.gesch; if (adOffen(nr)) { SFX.tap(); adZeigen(nr, null); } else adTuerTippen(nr); });
  const tagGehen = d => { const n = Math.max(adTag(0) - 1, Math.min(dayNum(AD_ENDE) + 1, adJetzt() + d)), x = datumVon(n); sessionStorage.setItem("bq-ed-datum", `${x.getUTCFullYear()}-${x.getUTCMonth() + 1}-${x.getUTCDate()}`); go("advent"); };
  if ($("adTagZ")) { $("adTagZ").onclick = () => tagGehen(-1); $("adTagV").onclick = () => tagGehen(1); $("adReset").onclick = () => { sessionStorage.removeItem("bq-adv-test"); go("advent"); }; }
};
function adTuerTippen(nr) {
  const h = adHeuteNr();
  if (!adOffen(nr) && adNachEnde()) { SFX.wrong(); toast(`<div>Nachholen war bis 6. Januar möglich.</div>`); return; }
  if (nr > h) { SFX.wrong(); toast(`${svg("clock") || ""}<div>Tür ${nr === 0 ? "„1. Advent“" : nr} öffnet am <b>${adDatumText(nr)}</b>.</div>`); return; }
  if (adOffen(nr)) { SFX.tap(); adZeigen(nr, null); return; }
  if (!adTest() && typeof BQ_UHR !== "undefined" && !BQ_UHR.gesichert() && !BQ_UHR.lokal) { toast("<div>Für neue Türen kurz mit dem Internet verbinden.</div>"); return; }
  const o = adStand(); o[nr] = adJetzt();
  if (adTest()) sessionStorage.setItem("bq-adv-test", JSON.stringify(o)); else save();
  adZeigen(nr, adTest() ? "vorschau" : adGeben(nr));
}
/* Belohnung buchen (nur echter Stand) */
function adGeben(nr) {
  const L = adLohn(nr), r = { xp: L.xp, manna: 0, krug: L.krug, rahmen: L.rahmen, avatar: L.avatar, extra: [] };
  addXp(L.xp, null, "tagesbonus", { d: `Adventskalender Tür ${nr === 0 ? "1. Advent" : nr}` });
  r.manna = typeof smGoldGeben === "function" && typeof smFrei === "function" && smFrei() ? smGoldGeben(L.manna) : 0;
  if (L.rahmen) { const alt = S.frame || "none"; if (alt === "none" || /^adv-kranz/.test(alt)) S.frame = L.rahmen; }
  if (adAnzahl() === 10) r.extra.push("Rahmen „Sternenhimmel“");
  if (adAmTag() >= 25) r.extra.push("Rahmen „Sternenhimmel · Gold“");
  save(); renderHud(); checkBadges(); lbSync();
  try { if (typeof smHud === "function") smHud(0); } catch (e) {}
  return r;
}
function adZeigen(nr, lohn) {
  const T = ADVENT_TUEREN[nr], L = adLohn(nr), bild = T.bild && TK_BILD.adv && TK_BILD.adv[T.bild];
  const titel = nr === 0 ? "1. Advent" : nr === 24 ? "Heiligabend" : AD_SO[nr] ? `${AD_SO[nr]}. Advent · Tür ${nr}` : `Tür ${nr}`;
  const vers = (t, s) => `<div class="ad-rolle"><p>${esc(t)}</p><small>nach ${esc(s)}</small><a class="ad-link" href="${adLink(s)}" target="_blank" rel="noopener">Vers lesen (Schlachter 2000) ›</a></div>`;
  const werte = lohn === "vorschau" ? `<div class="ad-werte"><span>Vorschau – keine Belohnung</span></div>`
    : lohn ? `<div class="ad-werte"><span>+${lohn.xp} XP</span>${lohn.manna ? `<span>+${lohn.manna} Manna</span>` : ""}${lohn.krug ? `<span>${typeof smKrugIc === "function" ? smKrugIc(lohn.krug) : ""} ${lohn.krug === "gold" ? "Goldkrug" : "Silberkrug"}</span>` : ""}${lohn.rahmen ? `<span>Rahmen „${esc(RAHMEN.find(r => r.id === lohn.rahmen).name)}“</span>` : ""}${lohn.avatar ? `<span>Avatar „Christus in der Krippe“</span>` : ""}${lohn.extra.map(x => `<span>${esc(x)}</span>`).join("")}</div>` : "";
  const m = modal(`<div class="ad-tuer${bild ? " gross" : ""}"><div class="ad-tk">${esc(titel)} <small>${esc(adDatumText(nr))}</small></div>
    ${bild ? `<div class="ad-bild">${tkBildSvg("adv", T.bild)}</div>` : `<div class="ad-licht"></div>`}
    ${vers(T.t, T.s)}${T.t2 ? vers(T.t2, T.s2) : ""}${werte}
    ${lohn && lohn !== "vorschau" && lohn.krug ? `<button class="btn primary" data-close="album">Krug öffnen</button>` : ""}<button class="btn ${lohn && lohn !== "vorschau" && lohn.krug ? "ghost" : "primary"}" data-close="">${nr === 24 ? "Frohe Weihnachten!" : "Amen"}</button></div>`,
    w => { if (w === "album") go("album"); else if (current === "advent") VIEWS.advent(); });
  m.dataset.frei = "1"; m.classList.add("ad-modal");
  if (lohn && lohn !== "vorschau") { SFX.badge(); try { rain(bild ? 90 : 40); } catch (e) {} }
}

/* ---------- Startseite: Banner + einmalige Ankündigung ---------- */
function adBanner() {
  if (!adSichtbar() || current !== "home" || screen.querySelector(".ad-banner,[data-ev=advent]")) return;
  const h = adHeuteNr(), wartet = h >= 0 && !adOffen(h), nach = Array.from({ length: Math.max(0, h) }, (_, i) => i).filter(i => !adOffen(i)).length;
  const sub = adNachEnde() ? "Bilder und Verse ansehen" : h < 0 ? (adJetzt() < adTag(0) ? "Beta-Vorschau · Start So 29.11." : "Bis zum nächsten Advent!") : wartet ? `${h === 0 ? "Tür „1. Advent“" : h === 24 ? "Heiligabend" : "Tür " + h} wartet auf dich` : nach ? `${nach} ${nach === 1 ? "Tür" : "Türen"} zum Nachholen` : "Heute schon geöffnet ✓";
  /* 10.53: Medaillon in der Reihe unter den Tagesaufgaben (Michaels Wahl „C · Medaillons“) */
  if (typeof evSetzen === "function") {
    const offen = (wartet ? 1 : 0) + nach;
    evSetzen("advent", { ord: 1, farbe: "#f2c14e", sym: bethlehemMini().replace('width="26" height="26"', 'width="46" height="46"'), titel: "Advent",
      sub: adNachEnde() ? "Bilder ansehen" : h < 0 ? (adJetzt() < adTag(0) ? "ab 29.11." : "bis bald") : wartet ? (h === 0 ? "1. Advent" : h === 24 ? "Heiligabend" : "Tür " + h) : nach ? `${nach} nachholen` : "heute ✓",
      zahl: offen ? String(offen) : "", grau: !offen, neu: adJetzt() < dayNum(AD_NEU_BIS), klick: () => go("advent") });
    return;
  }
  const b = document.createElement("button"); b.className = "ad-banner" + (wartet ? " wartet" : "");
  b.innerHTML = `<span class="ad-b-ic">${bethlehemMini()}</span><span><b>Adventskalender</b> <small>· ${esc(sub)}</small></span>${adJetzt() < dayNum(AD_NEU_BIS) ? `<span class="pl-neu">NEU</span>` : ""}<i>›</i>`;
  b.onclick = () => { SFX.tap(); go("advent"); };
  const kopf = screen.querySelector(".start-aufg"); if (kopf) kopf.insertAdjacentElement("afterend", b); else screen.prepend(b);
}
const bethlehemMini = () => `<svg viewBox="0 0 40 40" width="26" height="26"><rect width="40" height="40" rx="10" fill="#141a44"/><path d="M20 4l1.4 4.2 4.4 1.4-4.4 1.4L20 15.2l-1.4-4.2-4.4-1.4 4.4-1.4z" fill="#fff3b0"/><path d="M4 36V26h8v-4h8v4h6v-6h10v16z" fill="#b9a07c"/><path d="M14 36v-6a6 6 0 0 1 12 0v6z" fill="#ffc85a"/><rect x="30" y="24" width="3" height="3" fill="#ffd27a"/><rect x="7" y="29" width="3" height="3" fill="#ffd27a"/></svg>`;
function adAnkuendigen(versuch = 0) {
  if (!adLaeuft() || adTest() || adEcht().ank || !S.lbName || gesperrt) return;
  setTimeout(() => {
    if (adEcht().ank || current !== "home") return;
    if (document.querySelector(".modal, .sm-ov, .sm-tour, .truhe-fx") || document.body.classList.contains("spiel-laeuft")) { if (versuch < 6) adAnkuendigen(versuch + 1); return; }
    adEcht().ank = 1; save(); adAnkFenster();
  }, versuch ? 2500 : 2200);
}
/* 10.47: Ankündigung wie die Patchnote-Grafik „Advent in Bethlehem“ – Bilder-Fächer, drei Neuerungen, Jesaja 9,5 */
function adAnkFenster() {
    const bild = k => `<span class="ad2-b">${tkBildSvg("adv", k)}</span>`;
    const zeile = (c, ic, t, p) => `<div class="ad2-z" style="--c:${c}"><span class="ad2-ic">${ic}</span><div><b>${t}</b><p>${p}</p></div></div>`;
    const m = modal(`<div class="ad2"><div class="ad2-hg" aria-hidden="true"><svg viewBox="0 0 ${BL_W} ${BL_H}" preserveAspectRatio="xMidYMin slice">${blSzene(0)}</svg></div>
      <small class="ad2-neu">NEU · ab 1. Advent</small><h2>Advent in Bethlehem</h2><span class="ad2-sub">bis 6. Januar</span>
      <div class="ad2-f">${bild("verheissung")}${bild("weg")}${bild("hirten")}</div>
      <div class="ad2-zl">${zeile("#f2c14e", bethlehemMini(), "Adventskalender", "Jeden Tag eine Tür mit einem <em>Bibelvers</em> zur Geburt von Jesus, dazu XP und Manna. An Heiligabend wartet ein <em>Goldkrug</em>.")}
      ${zeile("#bfe3ff", `<img src="icons/biblionaer-logo.webp" alt="">`, "Weihnachts-Biblionär", "Fragen zu Advent und Weihnachten – <em>allein</em>, als <em>Biblionär der Woche</em> oder im <em>Duell</em>.")}
      ${zeile("#7be04a", `<span class="ad2-kr">${tkBildSvg("adv", "krippe")}</span>`, "Bethlehem schmücken", "Mit Talenten gemeinsam Bethlehem schmücken – <em>jedes Schmuckstück zählt gleich viel</em>.")}</div>
      <p class="ad2-vers">„Denn ein Kind ist uns geboren, ein Sohn ist uns gegeben …“<small>Jesaja 9,5</small></p>
      <button class="btn primary" data-close="los">Erste Tür öffnen</button><button class="btn ghost" data-close="">Später</button></div>`,
      w => { if (w === "los") go("advent"); else setTimeout(() => { try { edNeuPruefen(); } catch (e) {} }, 400); }); /* 10.51: danach Weihnachts-Biblionär */
    m.dataset.frei = "1"; m.classList.add("ad2-m");
}
function adAblauf() {
  if (adTest() || !adNachEnde() || !S.lbName) return;
  let geaendert = false;
  if (/^adv-/.test(S.frame || "")) { S.frame = "none"; geaendert = true; }
  if (/^adv-/.test(S.avatar || "")) { S.avatar = "initial"; geaendert = true; }
  if (geaendert) { save(); try { renderHud(); lbSync(true); } catch (e) {}
    toast(`${svg("star", "#f2c14e")}<div><b>Die Weihnachtszeit ist vorbei</b><div class="small muted">Adventskranz und Krippe gibt es im nächsten Advent wieder.</div></div>`); }
}
(function adStart() { const alt = VIEWS.home; VIEWS.home = function (a) { alt(a); try { adAblauf(); adBanner(); adAnkuendigen(); } catch (e) {} }; })();

/* ---------- 10.44: Gemeinsam Bethlehem schmücken ----------
   Jeder spendet Schmuckstücke (Preis 1 Talent × Level – seit 10.57, vorher 10 ×, höchstens 5 am Tag, 29.11.–24.12.). Jedes Schmuckstück zählt für alle gleich.
   Eigener Stand: S.sch = { g: gespendet gesamt, t: Tag (dayNum), h: heute, s: an den Server gemeldet, log: [ms…], gs: zuletzt gesehene Stufe }.
   Server: schmuck/{pid} = { n } → Sammel-Job summiert in rangliste (schmuck, schmuckSp) → localStorage „bq-schmuck“. */
const SCH_STUFEN = [
  { n: 15, name: "Öllampen in den Fenstern", vers: "Matthäus 5,16" },
  { n: 35, name: "Palmzweige an den Türen", vers: "Johannes 12,13" },
  { n: 60, name: "Festtücher über den Gassen", vers: "Psalm 118,24" },
  { n: 95, name: "Laterne und Stroh am Stall", vers: "Lukas 2,7" },
  { n: 135, name: "Hirtenfeuer und Herde", vers: "Lukas 2,8" },
  { n: 180, name: "Sternenglanz über der Stadt", vers: "Matthäus 2,9" },
  { n: 235, name: "Engel über dem Hirtenfeld", vers: "Lukas 2,13" },
  { n: 300, name: "Der Engelchor singt", vers: "Lukas 2,14" }];
const SCH_TAG_MAX = 5, SCH_ENDE = "2026-12-24";
const schPreis = () => Math.max(1, levelOf(S.xp));
function schEcht() { if (!S.sch || typeof S.sch !== "object") S.sch = {}; const m = S.sch; ["g", "t", "h", "s", "gs"].forEach(k => { m[k] = Math.max(0, +m[k] || 0); }); if (!Array.isArray(m.log)) m.log = []; return m; }
function schTest() { try { return JSON.parse(sessionStorage.getItem("bq-sch-test") || "null") || { g: 0, h: 0, t: 0, extra: 0 }; } catch (e) { return { g: 0, h: 0, t: 0, extra: 0 }; } }
const schLaeuft = () => adJetzt() >= adTag(0) && adJetzt() <= dayNum(SCH_ENDE);
function schServer() { try { return JSON.parse(localStorage.getItem("bq-schmuck") || "null") || { s: 0, sp: 0, t: 0 }; } catch (e) { return { s: 0, sp: 0, t: 0 }; } }
/* Summe = Server + eigene Spenden, die der Job noch nicht gezählt hat (Testmodus: plus Vorschau-Spenden) */
function schSumme() { const sv = schServer(), m = schEcht(); let s = sv.s + m.log.filter(z => z > (sv.t || 0)).length; if (adTest()) { const t = schTest(); s += t.g + t.extra; } return Math.max(0, s); }
const schStufe = s => SCH_STUFEN.filter(x => s >= x.n).length;
function schHeute() { if (adTest()) { const t = schTest(); return t.t === adJetzt() ? t.h : 0; } const m = schEcht(); return m.t === adJetzt() ? m.h : 0; }
function schMischen(r) { if (!r || !r.sch) return; const m = schEcht(), o = r.sch; m.g = Math.max(m.g, +o.g || 0); m.s = Math.max(m.s, +o.s || 0); m.gs = Math.max(m.gs, +o.gs || 0);
  if ((+o.t || 0) > m.t) { m.t = +o.t; m.h = +o.h || 0; } else if (+o.t === m.t) m.h = Math.max(m.h, +o.h || 0);
  m.log = [...new Set([...m.log, ...(Array.isArray(o.log) ? o.log : [])])].sort((a, b) => a - b).slice(-30); }
/* An den Server melden – höchstens +5 je Speichern (Regel), Rest beim nächsten Mal */
let schSendet = false;
async function schSenden() {
  const m = schEcht(); if (schSendet || m.g <= m.s || !S.pid || typeof LB === "undefined" || !LB.schmuckSetzen || gesperrt) return;
  schSendet = true;
  try { while (m.g > m.s) { const n = Math.min(m.g, m.s + 5); await LB.schmuckSetzen(S.pid, n); m.s = n; save(); } }
  catch (e) { /* alte Regeln oder offline – später erneut */ }
  schSendet = false;
}
function schSpenden() {
  const test = adTest(), preis = schPreis();
  if (!schLaeuft()) { toast(`<div>Geschmückt wird vom 1. Advent bis Heiligabend.</div>`); return; }
  if (schHeute() >= SCH_TAG_MAX) { toast(`<div>Heute hast du schon ${SCH_TAG_MAX} Schmuckstücke gespendet – morgen wieder!</div>`); return; }
  if (!test && (S.tal | 0) < preis) { SFX.wrong(); toast(`<div>Dafür brauchst du ${preis.toLocaleString("de-DE")} Talente.</div>`); return; }
  if (!test && typeof BQ_UHR !== "undefined" && !BQ_UHR.gesichert() && !BQ_UHR.lokal) { toast("<div>Zum Schmücken kurz mit dem Internet verbinden.</div>"); return; }
  const vorStufe = schStufe(schSumme());
  if (test) { const t = schTest(); if (t.t !== adJetzt()) { t.t = adJetzt(); t.h = 0; } t.h++; t.g++; sessionStorage.setItem("bq-sch-test", JSON.stringify(t)); }
  else { const m = schEcht(); if (m.t !== adJetzt()) { m.t = adJetzt(); m.h = 0; } m.h++; m.g++; m.log = [...m.log, Date.now()].slice(-30); S.tal = (S.tal | 0) - preis; save(); renderHud(); lbSync(); schSenden(); }
  SFX.coin(); try { burst && burst(); } catch (e) {}
  const nach = schStufe(schSumme());
  toast(`${svg("star", "#f2c14e")}<div><b>Danke fürs Schmücken!</b><div class="small muted">${test ? "Vorschau – keine Talente abgezogen" : `−${preis.toLocaleString("de-DE")} Talente`} · heute ${schHeute()}/${SCH_TAG_MAX}</div></div>`);
  if (nach > vorStufe) setTimeout(() => schNeueStufe(nach), 900);
  schFreude = { t: Date.now(), hoch: nach > vorStufe };
  if (current === "advent") VIEWS.advent();
}
function schNeueStufe(st) {
  const x = SCH_STUFEN[st - 1]; if (!x) return; if (!adTest()) { schEcht().gs = Math.max(schEcht().gs, st); save(); }
  modal(`<div class="rb-fenster sch-stufe"><small class="sm-ank-neu">STUFE ${st} VON ${SCH_STUFEN.length}</small><h2>Bethlehem wird festlicher!</h2><p><b>${esc(x.name)}</b></p><p class="small muted">Gemeinsam geschmückt – nach ${esc(x.vers)}</p><button class="btn primary" data-close="">Ansehen</button></div>`).dataset.frei = "1";
  try { rain(60); } catch (e) {}
}
/* 10.56: kompakte, festliche Karte – Lichterkette mit 8 Lampen (= Stufen), Ring = Weg zur nächsten Stufe; Antippen öffnet die Details */
const SCH_FARBEN = ["#ff5a6e", "#f2c14e", "#5fe08a", "#6fb4ff"];
let schFreude = null; /* nach dem Spenden: nächste (bzw. neu erreichte) Lampe leuchtet kurz auf */
function schWerte() {
  const s = schSumme(), st = schStufe(s), nx = SCH_STUFEN[st], vor = st ? SCH_STUFEN[st - 1].n : 0, test = adTest();
  return { s, st, nx, vor, pct: nx ? Math.max(0, Math.min(100, Math.round((s - vor) / (nx.n - vor) * 100))) : 100,
    laeuft: schLaeuft(), h: schHeute(), preis: schPreis(), test, sv: schServer(), eigen: test ? schTest().g : schEcht().g, vorStart: adJetzt() < adTag(0) };
}
/* Lichterkette: Draht mit Durchhang, 8 Glühbirnen – erreichte leuchten, die nächste glimmt */
function schKette(st, pct) {
  const n = SCH_STUFEN.length, w = 210, dx = w / n, x0 = dx / 2;
  let draht = `M0 5`; for (let i = 0; i <= n; i++) { const x = Math.min(w, i * dx + (i ? 0 : 0)); if (i) draht += `Q${(x - dx / 2).toFixed(1)} 13 ${x.toFixed(1)} 5`; }
  const birnen = SCH_STUFEN.map((_, i) => { const x = x0 + i * dx, y = 9.6, f = SCH_FARBEN[i % 4], an = i < st, naechste = i === st;
    const glas = an ? f : naechste ? f : "#3a4170", op = an ? 1 : naechste ? .28 + pct / 100 * .5 : 1;
    return `<g class="sch-b${an ? " an" : ""}${naechste ? " nx" : ""}${i === st - 1 ? " letzt" : ""}" style="--f:${f}" transform="translate(${x.toFixed(1)} ${y})">${an ? `<circle cy="7" r="8.5" fill="${f}" opacity=".32" class="sch-schein"/>` : ""}<rect x="-2.2" y="-1.2" width="4.4" height="3" rx=".8" fill="#8a7a5a"/><path d="M0 1.6c-3.6 0-4.6 3.6-4.6 5.6 0 3.2 2.2 5.6 4.6 5.6s4.6-2.4 4.6-5.6c0-2-1-5.6-4.6-5.6z" fill="${glas}" opacity="${op.toFixed(2)}" stroke="${an ? "#fff6" : "#ffffff22"}" stroke-width=".6"/>${an ? `<ellipse cx="-1.6" cy="5" rx="1" ry="1.8" fill="#fff" opacity=".7"/>` : ""}</g>`; }).join("");
  return `<svg class="sch-kette" viewBox="0 0 ${w} 26" preserveAspectRatio="none" aria-hidden="true"><path d="${draht}" stroke="#2c6a3a" stroke-width="1.6" fill="none"/><path d="${draht}" stroke="#7bd08a" stroke-width=".5" fill="none" opacity=".5"/>${birnen}</svg>`;
}
function schStern(st) {
  const k = .45 + st / SCH_STUFEN.length * .55;
  return `<svg viewBox="-20 -20 40 40" aria-hidden="true"><circle r="15" fill="#ffe9a0" opacity="${(.08 + st * .04).toFixed(2)}"/><path d="M0 -14l3.3 9.2 9.7.3-7.7 6 2.7 9.4L0 5.4l-8 5.5 2.7-9.4-7.7-6 9.7-.3z" fill="url(#schSt)" stroke="#8a5a10" stroke-width="1" opacity="${k.toFixed(2)}"/><defs><linearGradient id="schSt" x1="0" y1="-14" x2="0" y2="11" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fffbe6"/><stop offset=".6" stop-color="#f2c14e"/><stop offset="1" stop-color="#d08a1a"/></linearGradient></defs></svg>`;
}
function schHtml() {
  const W = schWerte(), { s, st, nx, pct, laeuft, h, preis, eigen } = W;
  const zeile = `<b>${s.toLocaleString("de-DE")}</b> gemeinsam · ` + (nx ? `noch <b>${nx.n - s}</b> bis <em>${esc(nx.name)}</em>` : `<em>alles geschmückt!</em>`);
  const fr = schFreude && Date.now() - schFreude.t < 3000 ? schFreude : null; schFreude = null;
  const rechts = laeuft ? (h >= SCH_TAG_MAX ? `<span class="sch-fertig">✓<small>heute ${h}/${SCH_TAG_MAX}</small></span>`
      : `<button class="sch-plus" id="schLos" aria-label="1 Schmuckstück spenden für ${preis} Talente"><b>+1</b><small>${preis.toLocaleString("de-DE")} T</small></button>`)
    : `<span class="sch-chip">${W.vorStart ? "ab<b>29.11.</b>" : "Danke<b>♥</b>"}</span>`;
  return `<div class="sch-karte${fr ? " freude" + (fr.hoch ? " hoch" : "") : ""}" id="schKarte" role="button" tabindex="0" aria-label="Bethlehem schmücken – Details">
    <span class="sch-med" style="--p:${pct}">${schStern(st)}<i class="sch-st">${st}/${SCH_STUFEN.length}</i>${eigen ? `<i class="sch-du">Du ${eigen}</i>` : ""}</span>
    <span class="sch-mitte"><b>Gemeinsam Bethlehem schmücken</b>${schKette(st, pct)}<small>${zeile}</small></span>
    ${rechts}${fr ? `<i class="sch-flug">+1</i>` : ""}</div>`;
}
function schDetails() {
  const W = schWerte(), { s, st, nx, pct, laeuft, h, preis, eigen, sv, test } = W;
  const liste = SCH_STUFEN.map((x, i) => { const an = i < st, naechste = i === st;
    return `<div class="sch-dz${an ? " an" : ""}${naechste ? " nx" : ""}" style="--f:${SCH_FARBEN[i % 4]}"><i></i><span><b>${esc(x.name)}</b><small>${esc(x.vers)}</small></span><em>${an ? "✓" : naechste ? `noch ${x.n - s}` : x.n}</em></div>`; }).join("");
  const m = modal(`<div class="sch-det">
    <div class="sch-det-k"><span class="sch-med gross" style="--p:${pct}">${schStern(st)}<i class="sch-st">${st}/${SCH_STUFEN.length}</i></span>
      <span><b>Gemeinsam Bethlehem schmücken</b><small>${st ? `Stufe ${st}: ${esc(SCH_STUFEN[st - 1].name)}` : "Noch ungeschmückt"}</small></span></div>
    <div class="sch-det-zahlen"><span><b>${s}</b>gemeinsam</span><span><b>${sv.sp || (eigen ? 1 : 0)}</b>Spieler</span><span><b>${eigen}</b>von dir</span></div>
    <div class="sch-det-l">${liste}</div>
    <div class="sch-det-info">Jedes Schmuckstück zählt für alle gleich – je mehr mitmachen, desto schneller wird Bethlehem festlich.<br>
      Preis 1 Talent × dein Level = <b>${preis.toLocaleString("de-DE")} Talente</b> · höchstens ${SCH_TAG_MAX} am Tag · 29.11.–24.12.<br>
      Ab 1 Schmuckstück: Rahmen „Festliches Bethlehem“${eigen ? " ✓" : ""}</div>
    ${laeuft ? `<button class="btn primary" id="schDLos"${h >= SCH_TAG_MAX ? " disabled" : ""}>${h >= SCH_TAG_MAX ? `Heute schon ${SCH_TAG_MAX}× geschmückt ✓` : `1 Schmuckstück spenden · ${preis.toLocaleString("de-DE")} Talente`}</button>`
      : `<div class="sch-det-start">${W.vorStart ? "Los geht's am 1. Advent (29.11.)" : "Danke an alle, die mitgeschmückt haben!"}</div>`}
    ${test ? `<div class="ad-test">Vorschau Schmuck: <button class="btn ghost mini" id="schMinus">−50</button><button class="btn ghost mini" id="schPlus">+50</button></div>` : ""}
    <button class="btn ghost" data-close="">Schließen</button></div>`);
  m.dataset.frei = "1";
  const zu = () => m.remove();
  if (m.querySelector("#schDLos")) m.querySelector("#schDLos").onclick = () => { zu(); schSpenden(); };
  const v = d => { const t = schTest(); t.extra = Math.max(0, (t.extra | 0) + d); sessionStorage.setItem("bq-sch-test", JSON.stringify(t)); zu(); VIEWS.advent(); schDetails(); };
  if (m.querySelector("#schPlus")) { m.querySelector("#schPlus").onclick = () => v(50); m.querySelector("#schMinus").onclick = () => v(-50); }
}
function schVerdrahten() {
  if ($("schLos")) $("schLos").onclick = e => { e.stopPropagation(); schSpenden(); };
  const k = $("schKarte"); if (k) { k.onclick = () => { SFX.tap(); schDetails(); }; k.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); schDetails(); } }; }
  const st = schStufe(schSumme()); if (!adTest() && st > schEcht().gs && schEcht().g + schServer().s > 0) setTimeout(() => schNeueStufe(st), 600);
  schSenden();
  /* Summe auffrischen (Rangliste ist zwischengespeichert – meist kein Lesezugriff) */
  try { const vor = localStorage.getItem("bq-schmuck"); if (typeof LB !== "undefined" && LB.alleSpieler) LB.alleSpieler().then(() => { if (current === "advent" && localStorage.getItem("bq-schmuck") !== vor) VIEWS.advent(); }).catch(() => {}); } catch (e) {}
}
/* Schmuck über der Szene (Koordinaten wie bethlehem()) */
function blSchmuck(stufe) {
  const s = n => stufe >= n; let o = "";
  if (s(6)) o += `<path d="M-20 150Q120 40 380 90" stroke="#c8d0ff" stroke-opacity=".10" stroke-width="46" fill="none" filter="url(#blBlur)"/>${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 47) % 360}" cy="${40 + (i * 29) % 120}" r="${.6 + (i % 3) * .5}" fill="#fff8d0" opacity=".9"/>`).join("")}`;
  if (s(7)) o += `<g transform="translate(300 150) scale(.42)">${_engel(0, 0, 1).replace(/@/g, "s")}</g><g transform="translate(60 160) scale(.36)">${_engel(0, 0, 1).replace(/@/g, "s")}</g>`;
  if (s(8)) o += `<path d="M150 60L120 380H240L210 60z" fill="#fff6d0" opacity=".14" filter="url(#blBlur2)"/>${[[120, 110, .3], [180, 92, .34], [240, 110, .3], [90, 140, .26], [270, 140, .26]].map(([x, y, k]) => `<g transform="translate(${x} ${y}) scale(${k})">${_engel(0, 0, 1).replace(/@/g, "s")}</g>`).join("")}`;
  if (s(1)) o += BL_HAEUSER.map(([x, y, w]) => `<g transform="translate(${x + w * .78} ${y - 5})"><circle r="7" fill="#ffd27a" opacity=".35"/><path d="M-4 0q4 3 8 0q-1 -3 -4 -3q-3 0 -4 3z" fill="#c8864a"/><path d="M0 -3q2 -3 0 -6q-2 3 0 6z" fill="#ffe27a"/></g>`).join("");
  if (s(2)) o += BL_HAEUSER.filter((_, i) => i % 2 === 0).map(([x, y]) => `<g transform="translate(${x + 4} ${y + 2})"><path d="M0 0q10 -6 20 -2" stroke="#3f8a3a" stroke-width="2.4" fill="none"/>${[2, 6, 10, 14, 18].map(t => `<path d="M${t} ${-1.2 - (t % 4)}l-2 ${4 + (t % 3)}M${t} ${-1.2 - (t % 4)}l2 ${4 + (t % 3)}" stroke="#4fae5a" stroke-width="1.3"/>`).join("")}</g>`).join("");
  if (s(3)) { const ketten = [[54, 196, 100, 206], [152, 200, 212, 198], [258, 196, 306, 194], [56, 250, 128, 254], [234, 254, 304, 242], [56, 312, 2, 308], [304, 304, 262, 316]], f = ["#d8344a", "#3a6ad8", "#f2c14e", "#f2f2f2", "#4fae5a"];
    o += ketten.map(([x1, y1, x2, y2], k) => { const mx = (x1 + x2) / 2, my = Math.max(y1, y2) + 16;
      return `<path d="M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}" stroke="#e8dcc0" stroke-width="1" fill="none"/>${Array.from({ length: 6 }, (_, i) => { const t = (i + .5) / 6, x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2, y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2; return `<path d="M${(x - 3).toFixed(1)} ${y.toFixed(1)}h6l-3 7z" fill="${f[(i + k) % 5]}"/>`; }).join("")}`; }).join(""); }
  if (s(4)) o += `<g transform="translate(180 378)"><path d="M0 -10v8" stroke="#3a2a1a" stroke-width="2"/><rect x="-6" y="-2" width="12" height="16" rx="3" fill="#ffd27a" stroke="#5a3a1a" stroke-width="2"/><circle cy="6" r="18" fill="#ffd27a" opacity=".3"/></g><g fill="#e8c86a" stroke="#b8963a" stroke-width="1"><rect x="112" y="452" width="24" height="16" rx="3"/><rect x="226" y="454" width="22" height="14" rx="3"/></g>`;
  if (s(5)) o += `<g transform="translate(28 300)"><circle r="16" fill="#ff8a2a" opacity=".35" filter="url(#blBlur2)"/><path d="M-6 4l12 -2M-5 -1l10 5" stroke="#5a3418" stroke-width="2.4"/><path d="M-3 1q3 -11 5 -2q2 -5 3 1z" fill="#ffc24a"/></g>${blSchaf(326, 300, .9)}${blSchaf(342, 306, .8, -1)}${blSchaf(312, 310, .8)}`;
  return `<g class="bl-schmuck" pointer-events="none">${o}</g>`;
}
/* Rahmen „Festliches Bethlehem“ für alle, die mindestens 1 Schmuckstück gespendet haben (gilt bis 6.1.) */
(function schRahmen() {
  if (typeof RAHMEN !== "undefined" && !RAHMEN.some(r => r.id === "adv-schmuck")) RAHMEN.push({ id: "adv-schmuck", name: "Festliches Bethlehem", price: -1, need: "adv-schmuck", bezug: "Gemeinsam geschmückt: Dies ist der Tag, den der HERR gemacht hat (Psalm 118,24). Gilt bis 6. Januar." });
  if (window.RAHMEN_SVG) { const f = ["#d8344a", "#3a6ad8", "#f2c14e", "#f2f2f2", "#4fae5a"];
    RAHMEN_SVG["adv-schmuck"] = `<svg class="av-fr" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="41" fill="none" stroke="#141a3a" stroke-width="5"/><circle cx="50" cy="50" r="41" fill="none" stroke="#c99a62" stroke-width="2.6"/>${Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2, x = 50 + Math.cos(a) * 42, y = 50 + Math.sin(a) * 42; return `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(a * 57.3 + 90).toFixed(0)})" d="M-3.4 -2h6.8l-3.4 7z" fill="${f[i % 5]}"/>`; }).join("")}${[-90, 30, 150].map(w => { const a = w / 57.3, x = 50 + Math.cos(a) * 42, y = 50 + Math.sin(a) * 42; return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="6" fill="#ffd27a" opacity=".35"/><path d="M-4 1q4 3 8 0q-1 -3 -4 -3q-3 0 -4 3z" fill="#c8864a"/><path d="M0 -2q2 -3 0 -6q-2 3 0 6z" fill="#ffe27a"/></g>`; }).join("")}</svg>`; }
})();
