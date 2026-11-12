/* 9.13: Bilder der Themen-Ketten (Zehn Gebote, Schöpfung) – selbst gezeichnete Vektorgrafiken (kein KI-Bild).
   Jedes Bild: viewBox 240×240, Verläufe, Licht und Schatten; „@“ in den IDs wird je Einbettung durch eine Nummer ersetzt. */
const _ar = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join("");
const _rnd = seed => { let a = seed || 1; return () => (a = (a * 16807) % 2147483647) / 2147483647; };
const _fk = (x, y, s, o = 1, c = "#fff") => (x = +x, y = +y, s = +s, `<path d="M${x} ${y - s}Q${x + s * .12} ${y - s * .12} ${x + s} ${y}Q${x + s * .12} ${y + s * .12} ${x} ${y + s}Q${x - s * .12} ${y + s * .12} ${x - s} ${y}Q${x - s * .12} ${y - s * .12} ${x} ${y - s}z" fill="${c}" opacity="${o}"/>`);
const _sterne = (seed, n, x0, y0, x1, y1, smax = 2.2) => { const r = _rnd(seed); return _ar(n, () => { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), s = .5 + r() * smax; return r() > .82 ? _fk(x.toFixed(1), y.toFixed(1), (s * 2.4).toFixed(1), (.6 + r() * .4).toFixed(2)) : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(1)}" fill="#fff" opacity="${(.35 + r() * .6).toFixed(2)}"/>`; }); };
const _wolke = (x, y, s, c1 = "#fff", c2 = "#cfe0f7", o = 1) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${o}"><ellipse cx="0" cy="10" rx="46" ry="9" fill="${c2}"/><circle cx="-24" cy="2" r="14" fill="${c1}"/><circle cx="-6" cy="-8" r="20" fill="${c1}"/><circle cx="16" cy="-2" r="16" fill="${c1}"/><circle cx="32" cy="5" r="11" fill="${c1}"/><ellipse cx="0" cy="8" rx="44" ry="8" fill="${c1}"/><ellipse cx="-4" cy="12" rx="40" ry="5" fill="${c2}" opacity=".55"/></g>`;
const TK_VERBOT = '<g fill="none" stroke-linecap="round"><circle cx="120" cy="120" r="88" stroke="#000" stroke-opacity=".35" stroke-width="15"/><path d="M58 182L182 58" stroke="#000" stroke-opacity=".35" stroke-width="15"/><circle cx="120" cy="120" r="88" stroke="#ef3b3b" stroke-width="9" stroke-opacity=".92"/><path d="M58 182L182 58" stroke="#ef3b3b" stroke-width="9" stroke-opacity=".92"/></g>';
const TK_DEFS_GLANZ = '<filter id="bl@" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter><filter id="bs@" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>';

const TK_BILD = { schoepfung: [], gebote: [] };

/* ---------- Schöpfung ---------- */
/* Tag 1 – Licht und Finsternis */
TK_BILD.schoepfung[0] = () => `<defs>${TK_DEFS_GLANZ}
<radialGradient id="a@" cx=".5" cy=".5" r=".72"><stop offset="0" stop-color="#fffdf0"/><stop offset=".16" stop-color="#ffeaa0"/><stop offset=".36" stop-color="#ffb03a"/><stop offset=".62" stop-color="#a8409a"/><stop offset="1" stop-color="#090a2c"/></radialGradient>
<linearGradient id="r@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".55" stop-color="#fff6c8" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".9"/></linearGradient>
<linearGradient id="d@" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#05061f" stop-opacity=".92"/><stop offset=".5" stop-color="#05061f" stop-opacity=".55"/><stop offset="1" stop-color="#05061f" stop-opacity="0"/></linearGradient></defs>
<rect width="240" height="240" fill="url(#a@)"/>
<g transform="translate(120 120)">${_ar(18, i => `<path d="M0 0L-13 -150L13 -150z" fill="url(#r@)" transform="rotate(${i * 20 + 4}) scale(1 -1)" opacity="${i % 2 ? .75 : 1}"/>`)}</g>
<rect width="240" height="240" fill="url(#d@)"/>
${_sterne(11, 46, 4, 4, 100, 236, 1.6)}
<circle cx="120" cy="120" r="46" fill="#fff4b8" opacity=".75" filter="url(#bl@)"/><circle cx="120" cy="120" r="24" fill="#fffef6"/><circle cx="120" cy="120" r="14" fill="#fff"/>
${_fk(120, 120, 40, .55, "#fffbe0")}
<path d="M120 120L214 54" stroke="#fff" stroke-opacity=".0"/>`;
/* Tag 2 – Himmelsfeste: Wasser oben und unten */
TK_BILD.schoepfung[1] = () => `<defs>${TK_DEFS_GLANZ}
<linearGradient id="s@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c2f86"/><stop offset=".35" stop-color="#2f7fe0"/><stop offset=".62" stop-color="#9fd4ff"/><stop offset=".64" stop-color="#e9f6ff"/></linearGradient>
<linearGradient id="w@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fa6f0"/><stop offset=".45" stop-color="#1b62c6"/><stop offset="1" stop-color="#082a6e"/></linearGradient>
<linearGradient id="b@" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="l@" cx=".5" cy=".3" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<rect width="240" height="240" fill="url(#s@)"/>
<ellipse cx="120" cy="30" rx="120" ry="40" fill="#0a2468" opacity=".55"/>${_wolke(52, 22, .9, "#7fb4f0", "#3d73c6", .85)}${_wolke(186, 28, 1, "#8fc0f6", "#4580d4", .8)}
<rect width="240" height="240" fill="url(#l@)"/>
<path d="M-6 150Q120 -22 246 150" fill="none" stroke="#fff" stroke-width="5" opacity=".55" filter="url(#bs@)"/><path d="M-6 150Q120 -22 246 150" fill="none" stroke="url(#b@)" stroke-width="2.4"/>
${_wolke(70, 112, 1.25, "#fff", "#b9d6f5")}${_wolke(176, 124, 1.5, "#fff", "#b9d6f5")}${_wolke(122, 96, .8, "#fff", "#cfe3f8", .9)}
<rect y="150" width="240" height="90" fill="url(#w@)"/>
${_ar(7, i => `<path d="M-10 ${158 + i * 12}q16 -6 32 0t32 0 32 0 32 0 32 0 32 0 32 0 32 0" fill="none" stroke="#fff" stroke-opacity="${(.55 - i * .06).toFixed(2)}" stroke-width="${(2.4 - i * .18).toFixed(1)}"/>`)}
<ellipse cx="122" cy="168" rx="34" ry="5" fill="#fff" opacity=".35" filter="url(#bs@)"/>${_fk(60, 188, 6, .6)}${_fk(190, 204, 5, .5)}`;
/* Tag 3 – Land, Meer, Pflanzen */
TK_BILD.schoepfung[2] = () => `<defs>${TK_DEFS_GLANZ}
<linearGradient id="s@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb4f4"/><stop offset="1" stop-color="#ffe9b8"/></linearGradient>
<linearGradient id="m@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#37a3e6"/><stop offset="1" stop-color="#0c5aa8"/></linearGradient>
<linearGradient id="h1@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86c85a"/><stop offset="1" stop-color="#3f8a3a"/></linearGradient>
<linearGradient id="h2@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5eaa45"/><stop offset="1" stop-color="#27682c"/></linearGradient>
<radialGradient id="k@" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#7fd058"/><stop offset="1" stop-color="#1f6a2a"/></radialGradient></defs>
<rect width="240" height="240" fill="url(#s@)"/><circle cx="188" cy="82" r="30" fill="#fff2b0" opacity=".7" filter="url(#bl@)"/><circle cx="188" cy="82" r="15" fill="#fffbe6"/>
${_wolke(60, 40, .7, "#fff", "#e6f1fb", .9)}
<rect y="118" width="240" height="122" fill="url(#m@)"/><path d="M0 128q30 -6 60 0t60 0 60 0 60 0" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2"/><path d="M110 150q20 -5 40 0t40 0" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>
<path d="M60 240V158q40 -34 100 -22Q214 126 250 150V240z" fill="url(#h1@)"/>
<path d="M-10 240V176q50 -26 100 -4t110 -8 50 14V240z" fill="url(#h2@)"/>
<path d="M0 208q60 -22 120 -6t120 -10V240H0z" fill="#1f5a26" opacity=".7"/>
<rect x="117" y="104" width="8" height="52" rx="3" fill="#6b4220"/><rect x="121" y="104" width="3" height="52" fill="#8a5a2b"/>
<circle cx="121" cy="86" r="30" fill="url(#k@)"/><circle cx="96" cy="100" r="19" fill="url(#k@)"/><circle cx="146" cy="100" r="20" fill="url(#k@)"/><circle cx="108" cy="72" r="15" fill="#8fdc66" opacity=".7"/><circle cx="136" cy="84" r="12" fill="#a3e87a" opacity=".5"/>
${_ar(5, i => `<circle cx="${100 + i * 12}" cy="${80 + (i % 3) * 10}" r="3" fill="#ff6a4a"/>`)}
${_ar(26, i => { const x = 8 + i * 9; return `<path d="M${x} 236q${i % 2 ? 4 : -4} -22 ${i % 3 - 1} -34" stroke="${i % 2 ? "#5fb347" : "#3f8f35"}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`; })}
${_ar(9, i => { const x = 14 + i * 26, y = 214 + (i % 3) * 7; return `<circle cx="${x}" cy="${y}" r="3.4" fill="${["#ff7aa2", "#ffd54a", "#fff", "#b28bff"][i % 4]}"/><circle cx="${x}" cy="${y}" r="1.2" fill="#ffb300"/>`; })}`;
/* Tag 4 – Sonne, Mond und Sterne */
TK_BILD.schoepfung[3] = () => `<defs>${TK_DEFS_GLANZ}
<linearGradient id="n@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050a30"/><stop offset=".6" stop-color="#1c2a78"/><stop offset="1" stop-color="#6a3f9a"/></linearGradient>
<radialGradient id="o@" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#fffbe0"/><stop offset=".5" stop-color="#ffd34a"/><stop offset="1" stop-color="#ff8f1f"/></radialGradient>
<radialGradient id="c@" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#dfe6f8"/><stop offset="1" stop-color="#9aa8d4"/></radialGradient></defs>
<rect width="240" height="240" fill="url(#n@)"/>${_sterne(23, 70, 4, 4, 236, 150, 1.5)}
<circle cx="76" cy="84" r="62" fill="#ffb030" opacity=".35" filter="url(#bl@)"/>
<g transform="translate(76 84)">${_ar(16, i => `<path d="M0 -50L-5 -72L5 -72z" fill="#ffd34a" opacity=".9" transform="rotate(${i * 22.5})"/>`)}</g>
<circle cx="76" cy="84" r="42" fill="url(#o@)"/><circle cx="64" cy="72" r="14" fill="#fff" opacity=".35" filter="url(#bs@)"/>
<circle cx="172" cy="70" r="34" fill="#cfdcff" opacity=".28" filter="url(#bl@)"/>
<circle cx="172" cy="70" r="26" fill="url(#c@)"/><circle cx="182" cy="62" r="22" fill="#14226b" opacity=".0"/><path d="M172 44a26 26 0 1 0 0 52a20 26 0 0 1 0 -52z" fill="#6b7fc4" opacity=".35"/>
<circle cx="164" cy="64" r="4.5" fill="#aab6dc" opacity=".6"/><circle cx="178" cy="80" r="3.2" fill="#aab6dc" opacity=".6"/><circle cx="166" cy="82" r="2.2" fill="#aab6dc" opacity=".6"/>
${_fk(120, 36, 9, .95)}${_fk(212, 120, 7, .9)}${_fk(30, 36, 6, .9)}${_fk(150, 128, 6, .8)}
<path d="M0 196q40 -26 80 -10t80 -22 80 14V240H0z" fill="#1a1346"/><path d="M0 214q60 -22 120 -8t120 -14V240H0z" fill="#0c0a2c"/>`;
/* Tag 5 – Fische und Vögel */
TK_BILD.schoepfung[4] = () => { const fisch = (x, y, s, r, c1, c2) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M-30 0Q-6 -22 22 -6Q30 0 22 6Q-6 22 -30 0z" fill="${c1}"/><path d="M22 0L42 -16Q38 0 42 16z" fill="${c2}"/><path d="M-6 -14Q4 -26 12 -12z" fill="${c2}"/><path d="M-30 0Q-6 -22 22 -6Q-6 4 -30 0z" fill="#fff" opacity=".28"/>${_ar(6, i => `<path d="M${-14 + i * 6} -6q4 6 0 12" stroke="#fff" stroke-opacity=".22" fill="none"/>`)}<circle cx="-20" cy="-3" r="3.2" fill="#fff"/><circle cx="-20.6" cy="-3" r="1.7" fill="#102040"/></g>`;
  const vogel = (x, y, s, r) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M-34 -4Q-18 -26 0 -2Q18 -26 34 -4Q18 -12 0 6Q-18 -12 -34 -4z" fill="#fff"/><path d="M-34 -4Q-18 -26 0 -2Q-18 -14 -34 -4z" fill="#cfdcf0"/><path d="M0 -2l14 -4l-6 8z" fill="#ffb347"/><circle cx="3" cy="-3" r="1.6" fill="#223"/></g>`;
  return `<defs>${TK_DEFS_GLANZ}<linearGradient id="s@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f9be8"/><stop offset="1" stop-color="#ffe3b0"/></linearGradient>
<linearGradient id="w@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2fa0e0"/><stop offset=".5" stop-color="#0f6bb8"/><stop offset="1" stop-color="#06336e"/></linearGradient>
<linearGradient id="f@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<rect width="240" height="240" fill="url(#s@)"/><circle cx="196" cy="60" r="26" fill="#fff4c0" opacity=".7" filter="url(#bl@)"/><circle cx="196" cy="60" r="13" fill="#fffbe8"/>${_wolke(60, 54, .7, "#fff", "#e3eefb", .9)}
${vogel(90, 56, .9, -8)}${vogel(150, 36, .6, 6)}${vogel(46, 100, .55, -4)}${vogel(184, 100, .5, 8)}
<rect y="124" width="240" height="116" fill="url(#w@)"/><path d="M0 128q30 -6 60 0t60 0 60 0 60 0" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2.2"/>
<path d="M60 124L36 240M110 124L110 240M150 124L186 240M196 124L246 240" stroke="url(#f@)" stroke-width="16" opacity=".5"/>
${fisch(70, 168, 1.1, -10, "#ff9a3c", "#ff6f1f")}${fisch(166, 190, .95, 8, "#5ed0ff", "#2a8fe0")}${fisch(120, 218, .6, 0, "#ffd54a", "#ffa000")}
${fisch(150, 106, .7, -38, "#ff9a3c", "#ff6f1f")}<path d="M128 124q4 -10 14 -14" stroke="#fff" stroke-opacity=".7" fill="none" stroke-width="2.4"/><path d="M160 126q-4 -6 -10 -8M120 128l-6 -8" stroke="#fff" stroke-opacity=".6" fill="none" stroke-width="2"/>
${_ar(14, i => `<circle cx="${30 + (i * 37) % 190}" cy="${150 + (i * 53) % 84}" r="${(1.2 + (i % 4)).toFixed(1)}" fill="#fff" opacity=".4"/>`)}`; };
/* Tag 6 – Landtiere und der Mensch */
TK_BILD.schoepfung[5] = () => `<defs>${TK_DEFS_GLANZ}
<linearGradient id="s@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a5a"/><stop offset=".5" stop-color="#ffd48a"/><stop offset="1" stop-color="#fff0c8"/></linearGradient>
<linearGradient id="g@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ac85a"/><stop offset="1" stop-color="#3a7a32"/></linearGradient>
<linearGradient id="p@" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0c49a"/><stop offset="1" stop-color="#b9805a"/></linearGradient>
<linearGradient id="rb@" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff7e6"/><stop offset=".6" stop-color="#f0e2c4"/><stop offset="1" stop-color="#c9b48a"/></linearGradient>
<linearGradient id="rg@" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8f0ff"/><stop offset=".6" stop-color="#c3d3f0"/><stop offset="1" stop-color="#8ea6d4"/></linearGradient>
<radialGradient id="mn@" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#d9962f"/><stop offset="1" stop-color="#7a4510"/></radialGradient></defs>
<rect width="240" height="240" fill="url(#s@)"/><circle cx="120" cy="100" r="72" fill="#fff6c8" opacity=".55" filter="url(#bl@)"/>
<path d="M0 138q50 -26 110 -10t130 -14V240H0z" fill="#a8d672" opacity=".7"/><path d="M0 160q70 -22 130 -6t110 -4V240H0z" fill="url(#g@)"/>
<rect x="112" y="40" width="9" height="62" rx="3" fill="#6b4220"/><circle cx="116" cy="34" r="30" fill="#4ea03e"/><circle cx="94" cy="46" r="18" fill="#5fb44a"/><circle cx="140" cy="46" r="18" fill="#5fb44a"/><circle cx="112" cy="24" r="14" fill="#79c85a" opacity=".8"/>${_ar(5, i => `<circle cx="${98 + i * 11}" cy="${34 + (i % 3) * 10}" r="3.4" fill="#ffcf3a"/>`)}
<g transform="translate(96 104)"><path d="M-12 16Q0 6 12 16L18 82Q0 90 -18 82z" fill="url(#rg@)"/><path d="M-12 16Q0 6 12 16L10 30Q0 24 -10 30z" fill="#fff" opacity=".5"/><path d="M-14 22Q-26 46 -22 66" stroke="url(#p@)" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M14 22Q22 40 18 62" stroke="url(#p@)" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M-18 82l-2 10h12l-1 -10M18 82l2 10h-12l1 -10" fill="#caa07a"/><path d="M-12 -2Q-16 18 -10 32Q-2 16 12 12Q16 -14 0 -14Q-12 -14 -12 -2z" fill="#6b3d1c"/><circle cx="1" cy="1" r="9.6" fill="url(#p@)"/><path d="M-9 -3Q-2 -12 10 -4Q2 -7 -9 -3z" fill="#6b3d1c"/><circle cx="-3" cy="1" r=".9" fill="#3a2414"/><circle cx="5" cy="1" r=".9" fill="#3a2414"/><path d="M-1 6q2.4 1.6 4.8 0" stroke="#9a5a40" stroke-width="1.1" fill="none"/></g>
<g transform="translate(138 100)"><path d="M-13 18Q0 8 13 18L18 86Q0 94 -18 86z" fill="url(#rb@)"/><path d="M-13 18Q0 8 13 18L11 32Q0 26 -11 32z" fill="#fff" opacity=".5"/><path d="M-15 24Q-24 46 -20 68" stroke="url(#p@)" stroke-width="6.5" fill="none" stroke-linecap="round"/><path d="M15 24Q24 42 20 66" stroke="url(#p@)" stroke-width="6.5" fill="none" stroke-linecap="round"/><path d="M-18 86l-2 10h12l-1 -10M18 86l2 10h-12l1 -10" fill="#caa07a"/><circle cx="0" cy="0" r="11" fill="url(#p@)"/><path d="M-11 -2Q-12 -14 0 -13Q12 -14 11 -2Q6 -8 -11 -2z" fill="#4a2c14"/><path d="M-5 8Q0 12 5 8Q3 15 0 15Q-3 15 -5 8z" fill="#4a2c14"/></g>
<g transform="translate(12 190)"><ellipse cx="38" cy="16" rx="38" ry="15" fill="url(#mn@)"/><circle cx="82" cy="4" r="19" fill="#7a4510"/><circle cx="82" cy="4" r="12.5" fill="#e8b45a"/><circle cx="86" cy="2" r="1.9" fill="#2a1a08"/><path d="M78 10q4 4 9 0" stroke="#2a1a08" fill="none" stroke-width="1.4"/><circle cx="90" cy="8" r="2.4" fill="#5a3410"/><path d="M0 12Q-14 8 -12 26" stroke="#c98a3b" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M10 26v14M24 28v14M52 28v14M64 26v14" stroke="#a8641e" stroke-width="7" stroke-linecap="round"/></g>
<g transform="translate(172 196)"><ellipse cx="14" cy="14" rx="22" ry="13" fill="#fbf6ea"/><circle cx="-8" cy="4" r="10" fill="#fbf6ea"/><path d="M-12 -2q-7 -3 -9 3M-4 -3q-1 -7 5 -9" stroke="#e6dccb" stroke-width="3.4" fill="none"/><path d="M-2 24v12M22 24v12M8 26v10" stroke="#e6dccb" stroke-width="5" stroke-linecap="round"/><circle cx="-11" cy="3" r="1.5" fill="#222"/></g>
${_fk(36, 40, 7, .8)}${_fk(206, 30, 6, .8)}`;
/* Tag 7 – Gott ruht */
TK_BILD.schoepfung[6] = () => `<defs>${TK_DEFS_GLANZ}
<linearGradient id="s@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#13174f"/><stop offset=".45" stop-color="#4a3a8a"/><stop offset=".78" stop-color="#f0a860"/><stop offset="1" stop-color="#ffe29a"/></linearGradient>
<linearGradient id="w@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c07a"/><stop offset=".4" stop-color="#6a5a9e"/><stop offset="1" stop-color="#171a54"/></linearGradient>
<radialGradient id="g@" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe6"/><stop offset=".5" stop-color="#ffe08a"/><stop offset="1" stop-color="#ffb347"/></radialGradient></defs>
<rect width="240" height="240" fill="url(#s@)"/>${_sterne(5, 40, 4, 4, 236, 110, 1.4)}
<circle cx="120" cy="136" r="74" fill="#ffd27a" opacity=".45" filter="url(#bl@)"/>
<g transform="translate(120 136)">${_ar(14, i => `<path d="M0 -44L-4 -66L4 -66z" fill="#fff0b0" opacity=".7" transform="rotate(${i * (360 / 14)})"/>`)}</g>
<circle cx="120" cy="136" r="38" fill="url(#g@)"/><circle cx="108" cy="124" r="12" fill="#fff" opacity=".4" filter="url(#bs@)"/>
<path d="M0 148q30 -22 60 -8t60 -16 60 14 60 -10V240H0z" fill="#241f63"/><path d="M0 156q40 -14 80 -4t80 -6 80 8V240H0z" fill="#171a54"/>
<rect y="164" width="240" height="76" fill="url(#w@)"/>${_ar(6, i => `<path d="M${96 - i * 4} ${168 + i * 11}h${48 + i * 8}" stroke="#ffe9b0" stroke-opacity="${(.8 - i * .12).toFixed(2)}" stroke-width="${(3 - i * .3).toFixed(1)}" stroke-linecap="round"/>`)}
<path d="M0 164q60 -12 120 0t120 -4" fill="none" stroke="#ffe0a0" stroke-opacity=".5" stroke-width="1.6"/>
<path d="M170 150v-30M170 128q-14 -4 -20 -16M170 124q14 -4 20 -16" stroke="#10133e" stroke-width="3.4" fill="none" stroke-linecap="round"/><circle cx="170" cy="104" r="16" fill="#10133e"/><circle cx="154" cy="116" r="11" fill="#10133e"/><circle cx="188" cy="114" r="11" fill="#10133e"/>
${_ar(7, i => `<circle cx="${50 + i * 23}" cy="${30 + Math.abs(3 - i) * 5}" r="2.6" fill="#fff3b8"/>${_fk(50 + i * 23, 30 + Math.abs(3 - i) * 5, 7, .55, "#fff3b8")}`)}`;
/* ---------- Zehn Gebote ---------- */
/* 1 – Keine anderen Götter: der HERR allein (Licht über dem Sinai) */
TK_BILD.gebote[0] = () => `<defs>${TK_DEFS_GLANZ}
<linearGradient id="s@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1445"/><stop offset=".55" stop-color="#3b3a8c"/><stop offset="1" stop-color="#e8a05a"/></linearGradient>
<linearGradient id="r@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c0" stop-opacity=".95"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></linearGradient>
<linearGradient id="b1@" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a4a3a"/><stop offset=".5" stop-color="#9a6a4a"/><stop offset="1" stop-color="#4a3226"/></linearGradient>
<linearGradient id="b2@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a30"/><stop offset="1" stop-color="#1c1420"/></linearGradient>
<radialGradient id="g@" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffdf2"/><stop offset=".5" stop-color="#ffe58a"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs>
<rect width="240" height="240" fill="url(#s@)"/>${_sterne(31, 34, 4, 4, 236, 100, 1.3)}
<g transform="translate(120 50)">${_ar(12, i => `<path d="M0 0L-12 130L12 130z" fill="url(#r@)" opacity=".5" transform="rotate(${-60 + i * 10})"/>`)}</g>
<circle cx="120" cy="52" r="46" fill="url(#g@)"/><circle cx="120" cy="52" r="22" fill="#fffdf5"/>
<path d="M-10 240V176L40 130L66 154L100 108L120 96L146 112L178 140L208 124L250 170V240z" fill="url(#b1@)"/>
<path d="M100 108L120 96L146 112L132 150L112 132z" fill="#fff" opacity=".18"/><path d="M-10 190L40 130L66 154L30 200z" fill="#000" opacity=".18"/><path d="M146 112L178 140L208 124L250 170V240H160L132 150z" fill="#000" opacity=".22"/>
<path d="M-10 240V204Q60 186 120 200T250 196V240z" fill="url(#b2@)"/>
<path d="M92 160q18 -22 46 0M80 176q40 -34 80 0" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="3"/>
<g fill="#ffe9a0">${_fk(52, 60, 6, .8)}${_fk(190, 76, 5, .8)}</g>`;
/* 2 – Kein Götzenbild: das goldene Kalb */
TK_BILD.gebote[1] = () => `<defs>${TK_DEFS_GLANZ}
<linearGradient id="s@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1a3a"/><stop offset="1" stop-color="#7a4a38"/></linearGradient>
<linearGradient id="au@" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".45" stop-color="#e8b020"/><stop offset="1" stop-color="#8a5a08"/></linearGradient>
<linearGradient id="st@" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a39a92"/><stop offset=".5" stop-color="#d8d0c8"/><stop offset="1" stop-color="#6e665e"/></linearGradient></defs>
<rect width="240" height="240" fill="url(#s@)"/><circle cx="120" cy="110" r="84" fill="#ffb347" opacity=".35" filter="url(#bl@)"/>
<g transform="translate(120 110)">${_ar(14, i => `<path d="M0 0L-5 -96L5 -96z" fill="#ffe08a" opacity=".16" transform="rotate(${i * (360 / 14)})"/>`)}</g>
<path d="M34 168h172l-10 14H44z" fill="url(#st@)"/><path d="M44 182h152v36H44z" fill="url(#st@)"/><path d="M44 182h152" stroke="#fff" stroke-opacity=".4"/><path d="M44 218h152" stroke="#000" stroke-opacity=".3" stroke-width="3"/>${_ar(6, i => `<path d="M${64 + i * 22} 186v28" stroke="#000" stroke-opacity=".12" stroke-width="2"/>`)}
<g transform="translate(120 118)"><path d="M-62 -6Q-60 -42 -14 -40Q26 -42 52 -30Q70 -20 66 4L62 34H48L44 8Q10 18 -22 8L-30 34H-44L-52 6Q-60 14 -62 -6z" fill="url(#au@)"/>
<path d="M54 -34Q86 -50 94 -26Q96 -10 82 -2L66 -4Q56 -14 54 -34z" fill="url(#au@)"/><path d="M64 -44Q54 -70 70 -76Q70 -58 76 -48z" fill="url(#au@)"/><path d="M88 -42Q104 -66 92 -76Q90 -58 82 -48z" fill="url(#au@)"/>
<path d="M-62 -6Q-80 4 -78 24" stroke="#e8b020" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="-78" cy="26" r="5" fill="#b8820e"/>
<path d="M-50 -22Q-14 -46 40 -26Q10 -30 -50 -14z" fill="#fff" opacity=".5"/><path d="M-30 30L-34 36M62 34L66 38" stroke="#000" stroke-opacity=".0"/>
<circle cx="84" cy="-24" r="3.4" fill="#3a2208"/><circle cx="85" cy="-25" r="1.2" fill="#fff"/><path d="M-20 -4Q10 10 40 -2" stroke="#8a5a08" stroke-opacity=".5" fill="none" stroke-width="3"/></g>
${_fk(52, 52, 7, .8, "#ffe9a0")}${_fk(196, 44, 6, .8, "#ffe9a0")}${_fk(176, 110, 5, .7, "#ffe9a0")}
${TK_VERBOT}`;
/* 3 – Namen nicht missbrauchen: versiegelter Mund + Siegel */
TK_BILD.gebote[2] = () => `<defs>${TK_DEFS_GLANZ}
<radialGradient id="s@" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#6a3a8a"/><stop offset="1" stop-color="#1a0f33"/></radialGradient>
<linearGradient id="l1@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6f8a"/><stop offset="1" stop-color="#c41e4a"/></linearGradient>
<linearGradient id="l2@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e04068"/><stop offset="1" stop-color="#8a1236"/></linearGradient>
<linearGradient id="au@" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".5" stop-color="#e8b020"/><stop offset="1" stop-color="#8a5a08"/></linearGradient></defs>
<rect width="240" height="240" fill="url(#s@)"/>${_sterne(9, 22, 4, 4, 236, 236, 1.2)}
<circle cx="120" cy="120" r="80" fill="#ff9acb" opacity=".25" filter="url(#bl@)"/>
<path d="M30 124Q60 70 100 84Q120 90 120 90Q120 90 140 84Q180 70 210 124Q180 118 120 124Q60 118 30 124z" fill="url(#l1@)"/>
<path d="M30 124Q60 118 120 124Q180 118 210 124Q184 186 120 190Q56 186 30 124z" fill="url(#l2@)"/>
<path d="M30 124Q60 118 120 124Q180 118 210 124" fill="none" stroke="#5a0820" stroke-width="3" stroke-linecap="round"/>
<path d="M62 100Q96 82 118 96Q80 96 62 100z" fill="#fff" opacity=".4"/><path d="M70 154Q120 178 170 154Q120 168 70 154z" fill="#fff" opacity=".22"/>
<rect x="96" y="104" width="48" height="38" rx="10" fill="url(#au@)" stroke="#8a5a08" stroke-width="2"/><rect x="102" y="110" width="36" height="26" rx="6" fill="none" stroke="#fff6c8" stroke-opacity=".7" stroke-width="2"/>
<circle cx="120" cy="123" r="6.5" fill="#8a5a08"/><rect x="118" y="124" width="4" height="10" rx="1.5" fill="#8a5a08"/>
${_fk(60, 56, 7, .85)}${_fk(184, 60, 6, .8)}
${TK_VERBOT}`;
/* 4 – Sabbat: Leuchter mit Flammen */
TK_BILD.gebote[3] = () => { const kerze = x => `<g transform="translate(${x} 0)"><rect x="-9" y="104" width="18" height="76" rx="3" fill="#fff3d8"/><rect x="-9" y="104" width="7" height="76" fill="#fff" opacity=".6"/><rect x="2" y="104" width="7" height="76" fill="#d8c096" opacity=".6"/><ellipse cx="0" cy="104" rx="9" ry="3" fill="#ffe9b8"/>
 <path d="M0 62Q-12 82 -4 98Q0 104 4 98Q12 82 0 62z" fill="#ff8a1f"/><path d="M0 72Q-7 86 -2 98Q0 100 2 98Q7 86 0 72z" fill="#ffd34a"/><path d="M0 84Q-3 92 0 98Q3 92 0 84z" fill="#fff6c8"/><circle cx="0" cy="84" r="26" fill="#ffc34a" opacity=".5" filter="url(#bl@)"/>
 <path d="M-4 180h8v14h-8z" fill="#d9a020"/><path d="M-22 194h44l-6 10h-32z" fill="url(#au@)"/></g>`;
  return `<defs>${TK_DEFS_GLANZ}
<linearGradient id="s@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1a4a"/><stop offset="1" stop-color="#6a3a3a"/></linearGradient>
<linearGradient id="au@" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".5" stop-color="#e8b020"/><stop offset="1" stop-color="#8a5a08"/></linearGradient>
<linearGradient id="t@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a3a3a"/><stop offset="1" stop-color="#4a1a22"/></linearGradient></defs>
<rect width="240" height="240" fill="url(#s@)"/>${_sterne(4, 30, 4, 4, 236, 90, 1.2)}
<circle cx="120" cy="110" r="100" fill="#ffb347" opacity=".25" filter="url(#bl@)"/>
<path d="M0 200Q120 186 240 200V240H0z" fill="url(#t@)"/><path d="M0 204Q120 190 240 204" fill="none" stroke="#ffd98a" stroke-opacity=".35" stroke-width="2"/>
${kerze(82)}${kerze(158)}
<path d="M104 200q16 -18 32 0z" fill="#e8c27a"/><ellipse cx="120" cy="204" rx="30" ry="6" fill="#f2d49a"/><ellipse cx="120" cy="200" rx="26" ry="9" fill="#e0b060"/><path d="M96 198q24 -8 48 0" stroke="#fff" stroke-opacity=".5" fill="none" stroke-width="2"/>
${_fk(120, 40, 8, .8, "#ffe9a0")}${_fk(40, 80, 5, .7, "#ffe9a0")}${_fk(206, 84, 5, .7, "#ffe9a0")}`; };
/* 5 – Vater und Mutter ehren */
TK_BILD.gebote[4] = () => `<defs>${TK_DEFS_GLANZ}
<linearGradient id="s@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a5a"/><stop offset=".6" stop-color="#ffd48a"/><stop offset="1" stop-color="#fff0c8"/></linearGradient>
<linearGradient id="p@" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0c49a"/><stop offset="1" stop-color="#b9805a"/></linearGradient>
<linearGradient id="v@" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a6fb8"/><stop offset="1" stop-color="#2a4488"/></linearGradient>
<linearGradient id="m@" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c8485a"/><stop offset="1" stop-color="#8a2038"/></linearGradient>
<linearGradient id="k@" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe38a"/><stop offset="1" stop-color="#d9a020"/></linearGradient></defs>
<rect width="240" height="240" fill="url(#s@)"/><circle cx="120" cy="90" r="80" fill="#fff6c8" opacity=".5" filter="url(#bl@)"/>
<path d="M0 190Q120 168 240 188V240H0z" fill="#c9a06a"/><path d="M0 206Q120 190 240 204V240H0z" fill="#a8804a"/>
<g transform="translate(70 70)"><path d="M-6 -6Q0 -18 14 -8L18 8H-8z" fill="#f4ecdc"/><circle cx="6" cy="2" r="12.5" fill="url(#p@)"/><path d="M-7 -4Q-12 -22 8 -22Q26 -20 20 0Q14 -14 -7 -4z" fill="#d8d0c0"/><path d="M-2 10Q6 28 14 10Q10 18 6 18Q2 18 -2 10z" fill="#d8d0c0"/><path d="M-26 26Q6 8 38 26L44 120H-32z" fill="url(#v@)"/><path d="M-26 26Q6 8 38 26L30 44Q6 30 -18 44z" fill="#fff" opacity=".22"/><path d="M-22 40Q-12 70 6 82" stroke="#fff" stroke-opacity=".18" stroke-width="3" fill="none"/></g>
<g transform="translate(170 72)"><path d="M-20 -8Q-22 -26 6 -26Q32 -26 28 -4Q24 14 20 18Q0 0 -20 -8z" fill="#e9eef8"/><circle cx="4" cy="2" r="12" fill="url(#p@)"/><path d="M-12 -4Q4 -26 22 -4Q14 -14 -12 -4z" fill="#e9eef8"/><path d="M-26 28Q4 10 34 28L40 118H-32z" fill="url(#m@)"/><path d="M-26 28Q4 10 34 28L26 46Q4 32 -16 46z" fill="#fff" opacity=".2"/></g>
<g transform="translate(120 112)"><path d="M-22 50Q-24 18 0 14Q24 18 22 50L26 96H-26z" fill="url(#k@)"/><path d="M-22 50Q-24 18 0 14Q24 18 22 50L14 36Q0 26 -14 36z" fill="#fff" opacity=".35"/><circle cx="0" cy="2" r="12" fill="url(#p@)"/><path d="M-12 -2Q-12 -16 0 -15Q12 -16 12 -2Q6 -8 -12 -2z" fill="#6b3d1c"/><circle cx="-4" cy="3" r="1" fill="#3a2414"/><circle cx="4" cy="3" r="1" fill="#3a2414"/><path d="M-2 8q2 1.6 4 0" stroke="#9a5a40" stroke-width="1.1" fill="none"/></g>
<path d="M98 150Q108 136 118 144M142 150Q132 136 122 144" stroke="#e8b88a" stroke-width="7" fill="none" stroke-linecap="round" opacity=".0"/>
<path d="M120 36c-6 -12 -24 -4 -14 10c4 6 14 12 14 12s10 -6 14 -12c10 -14 -8 -22 -14 -10z" fill="#ff6f8a"/><path d="M112 36q3 -6 8 -2" stroke="#fff" stroke-opacity=".6" fill="none" stroke-width="2.2" stroke-linecap="round"/>`;
/* 6 – Nicht töten: zerbrochenes Schwert + Ölzweig */
TK_BILD.gebote[5] = () => `<defs>${TK_DEFS_GLANZ}
<radialGradient id="s@" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#5a2a40"/><stop offset="1" stop-color="#150c1c"/></radialGradient>
<linearGradient id="bl1@" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8e9ab2"/><stop offset=".5" stop-color="#f4f8ff"/><stop offset="1" stop-color="#7e8aa2"/></linearGradient>
<linearGradient id="au@" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".5" stop-color="#e8b020"/><stop offset="1" stop-color="#8a5a08"/></linearGradient></defs>
<rect width="240" height="240" fill="url(#s@)"/><circle cx="120" cy="120" r="70" fill="#ff7a9a" opacity=".22" filter="url(#bl@)"/>
<g transform="translate(-14 -10) rotate(-24 120 90)"><path d="M120 12L134 48L132 104L124 112L118 104L110 112L108 48z" fill="url(#bl1@)"/><path d="M120 12L120 108L110 112L108 48z" fill="#fff" opacity=".35"/><path d="M132 104L126 96L122 108L116 98L110 112" fill="none" stroke="#2a1a2a" stroke-opacity=".0"/></g>
<g transform="translate(18 18) rotate(14 120 160)"><path d="M108 124L114 118L120 126L127 116L132 124L130 150H110z" fill="url(#bl1@)"/><rect x="84" y="150" width="72" height="12" rx="6" fill="url(#au@)"/><rect x="113" y="162" width="14" height="38" rx="5" fill="#6b3a1c"/><rect x="113" y="162" width="5" height="38" fill="#a8682c"/><circle cx="120" cy="206" r="9" fill="url(#au@)"/><path d="M114 168h12M114 176h12M114 184h12M114 192h12" stroke="#2a1008" stroke-opacity=".4" stroke-width="1.6"/></g>
<g stroke="#ffd98a" stroke-linecap="round" stroke-width="3" filter="url(#bs@)"><path d="M112 118L100 108M126 114L134 102M120 122L120 134"/></g>${_fk(120, 118, 10, .95, "#fff6c8")}
<g transform="translate(184 196)"><path d="M0 0Q-34 -8 -56 -38" stroke="#7a8a3a" stroke-width="4" fill="none" stroke-linecap="round"/>${_ar(7, i => `<path d="M${-6 - i * 7.5} ${-3 - i * 4.8}q-4 -14 10 -16q4 12 -10 16z" fill="${i % 2 ? "#8fb04a" : "#a8c85a"}"/>`)}</g>
${_fk(48, 52, 7, .8)}${_fk(196, 52, 5, .7)}
${TK_VERBOT}`;
/* 7 – Nicht die Ehe brechen: Ringe mit Edelstein */
TK_BILD.gebote[6] = () => `<defs>${TK_DEFS_GLANZ}
<radialGradient id="s@" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#8a3a7a"/><stop offset="1" stop-color="#1c0f33"/></radialGradient>
<linearGradient id="a1@" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".45" stop-color="#e8b020"/><stop offset="1" stop-color="#7a4a06"/></linearGradient>
<linearGradient id="a2@" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe0"/><stop offset=".45" stop-color="#f0c840"/><stop offset="1" stop-color="#8a5a0a"/></linearGradient>
<linearGradient id="gm@" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8fbff"/><stop offset=".5" stop-color="#7fd4ff"/><stop offset="1" stop-color="#2a7ac8"/></linearGradient></defs>
<rect width="240" height="240" fill="url(#s@)"/>${_sterne(14, 26, 4, 4, 236, 236, 1.2)}<circle cx="120" cy="128" r="84" fill="#ff9acb" opacity=".25" filter="url(#bl@)"/>
<circle cx="88" cy="140" r="52" fill="none" stroke="#6a3a06" stroke-width="16"/><circle cx="88" cy="140" r="52" fill="none" stroke="url(#a1@)" stroke-width="13"/><circle cx="88" cy="140" r="52" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-dasharray="40 290" stroke-dashoffset="-70"/>
<circle cx="152" cy="140" r="52" fill="none" stroke="#6a3a06" stroke-width="16"/><circle cx="152" cy="140" r="52" fill="none" stroke="url(#a2@)" stroke-width="13"/>
<path d="M120 100A52 52 0 0 1 120 180" fill="none" stroke="url(#a1@)" stroke-width="13"/><path d="M120 100A52 52 0 0 1 120 180" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="3"/>
<g transform="translate(152 84)"><path d="M-14 0L-8 -12H8L14 0L0 20z" fill="url(#gm@)"/><path d="M-14 0H14M-8 -12L-3 0L0 20L3 0L8 -12" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"/><path d="M-8 -12L-3 0H-14z" fill="#fff" opacity=".5"/></g>
<path d="M120 52c-8 -16 -32 -6 -18 12c6 8 18 16 18 16s12 -8 18 -16c14 -18 -10 -28 -18 -12z" fill="#ff6f8a"/><path d="M110 50q4 -8 10 -4" stroke="#fff" stroke-opacity=".6" fill="none" stroke-width="2.4" stroke-linecap="round"/>
${_ar(8, i => `<path d="M${30 + (i * 29) % 190} ${190 + (i * 17) % 40}q6 -10 12 0q-6 8 -12 0z" fill="#ff9ac0" opacity=".65" transform="rotate(${i * 40} ${36 + (i * 29) % 190} ${194 + (i * 17) % 40})"/>`)}`;
/* 8 – Nicht stehlen: Geldbeutel mit Münzen */
TK_BILD.gebote[7] = () => { const m = (x, y, r) => `<g transform="translate(${x} ${y})"><circle r="${r}" fill="#8a5a08"/><circle r="${r - 2}" fill="url(#au@)"/><circle r="${r - 6}" fill="none" stroke="#b8820e" stroke-width="1.6"/><path d="M-3 -${r - 10}h6M0 -${r - 10}v${(r - 10) * 2}" stroke="#b8820e" stroke-width="2" stroke-linecap="round"/><path d="M-${r - 6} -${r - 8}A${r - 4} ${r - 4} 0 0 1 ${r - 10} -${r - 5}" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none"/></g>`;
  return `<defs>${TK_DEFS_GLANZ}
<linearGradient id="s@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a3a30"/><stop offset="1" stop-color="#0c1c1a"/></linearGradient>
<linearGradient id="au@" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".5" stop-color="#e8b020"/><stop offset="1" stop-color="#8a5a08"/></linearGradient>
<linearGradient id="sk@" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a5a2a"/><stop offset=".5" stop-color="#c8904a"/><stop offset="1" stop-color="#6a4020"/></linearGradient></defs>
<rect width="240" height="240" fill="url(#s@)"/><circle cx="120" cy="130" r="84" fill="#ffd34a" opacity=".28" filter="url(#bl@)"/>
${m(52, 196, 20)}${m(190, 200, 18)}${m(78, 214, 16)}${m(166, 216, 16)}${m(36, 168, 14)}
<path d="M84 80Q120 62 156 80L150 98H90z" fill="#6a4020"/><path d="M90 98Q40 130 44 180Q50 214 120 214Q190 214 196 180Q200 130 150 98z" fill="url(#sk@)"/><path d="M90 98Q56 126 60 170Q62 130 100 106z" fill="#e8b878" opacity=".45"/><path d="M150 98Q190 130 186 180Q180 130 142 106z" fill="#000" opacity=".18"/>
<path d="M86 98Q120 112 154 98" fill="none" stroke="#3a2210" stroke-width="5" stroke-linecap="round"/><path d="M84 80Q120 62 156 80" fill="none" stroke="#e8c27a" stroke-opacity=".5" stroke-width="2"/>
<path d="M82 92q-8 -14 8 -20M158 92q8 -14 -8 -20" stroke="#6a4020" stroke-width="5" fill="none" stroke-linecap="round"/>
<g transform="translate(120 160)"><circle r="30" fill="#8a5a08"/><circle r="27" fill="url(#au@)"/><circle r="21" fill="none" stroke="#b8820e" stroke-width="2.4"/><path d="M-8 -9Q-14 -2 -6 2H6Q14 6 6 12Q-2 14 -9 10M0 -14V16" fill="none" stroke="#b8820e" stroke-width="3.2" stroke-linecap="round"/><path d="M-22 -14A27 27 0 0 1 8 -26" stroke="#fff" stroke-opacity=".6" stroke-width="3" fill="none"/></g>
${_fk(194, 56, 7, .85, "#ffe9a0")}${_fk(46, 70, 6, .8, "#ffe9a0")}${_fk(176, 120, 4, .8, "#ffe9a0")}
${TK_VERBOT}`; };
/* 9 – Kein falsches Zeugnis: Waage der Gerechtigkeit */
TK_BILD.gebote[8] = () => { const schale = (x, y) => `<g transform="translate(${x} ${y})"><path d="M0 0L-26 40M0 0L26 40M0 0V40" stroke="#c8902a" stroke-width="2" fill="none"/><path d="M-32 40Q0 70 32 40z" fill="url(#au@)"/><ellipse cx="0" cy="40" rx="32" ry="6" fill="#ffe08a"/><path d="M-28 44Q0 62 28 44" stroke="#fff" stroke-opacity=".5" fill="none" stroke-width="2"/></g>`;
  return `<defs>${TK_DEFS_GLANZ}
<radialGradient id="s@" cx=".5" cy=".35" r=".85"><stop offset="0" stop-color="#4a5aa8"/><stop offset="1" stop-color="#12163f"/></radialGradient>
<linearGradient id="au@" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".5" stop-color="#e8b020"/><stop offset="1" stop-color="#8a5a08"/></linearGradient></defs>
<rect width="240" height="240" fill="url(#s@)"/>${_sterne(8, 24, 4, 4, 236, 120, 1.2)}<circle cx="120" cy="100" r="76" fill="#ffe08a" opacity=".25" filter="url(#bl@)"/>
<path d="M104 214h32l6 12H98z" fill="url(#au@)"/><path d="M116 70H124L128 214H112z" fill="url(#au@)"/><path d="M116 70H119L120 214H112z" fill="#fff" opacity=".35"/><circle cx="120" cy="64" r="11" fill="url(#au@)"/><circle cx="116" cy="60" r="4" fill="#fff" opacity=".6"/>
<path d="M48 78Q120 52 192 78" fill="none" stroke="#8a5a08" stroke-width="8" stroke-linecap="round"/><path d="M48 78Q120 52 192 78" fill="none" stroke="url(#au@)" stroke-width="5" stroke-linecap="round"/><circle cx="48" cy="78" r="5" fill="url(#au@)"/><circle cx="192" cy="78" r="5" fill="url(#au@)"/>
${schale(48, 80)}${schale(192, 80)}
<rect x="34" y="124" width="28" height="16" rx="3" fill="#fff6d8" transform="rotate(-4 48 130)"/><path d="M38 129h20M38 134h14" stroke="#b8902a" stroke-width="1.6" transform="rotate(-4 48 130)"/>
<path d="M186 118c0 -12 -10 -16 -16 -8c-4 -10 -18 -4 -12 8c2 6 14 14 14 14s14 -8 14 -14z" fill="#7fd4ff" opacity=".0"/>
<path d="M92 214Q120 200 148 214" fill="none" stroke="#fff" stroke-opacity=".3"/>${_fk(120, 40, 8, .8, "#ffe9a0")}${_fk(40, 40, 5, .7)}${_fk(204, 44, 5, .7)}
<path d="M186 120l8 -14l8 14z" fill="#7fd4ff" stroke="#fff" stroke-opacity=".7" stroke-width="1.4" opacity=".0"/>`; };
/* 10 – Nicht begehren: das Haus des Nächsten mit Weinberg und Ochse */
TK_BILD.gebote[9] = () => `<defs>${TK_DEFS_GLANZ}
<linearGradient id="s@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a5a"/><stop offset=".55" stop-color="#ffd48a"/><stop offset="1" stop-color="#fff0c8"/></linearGradient>
<linearGradient id="g@" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ccf5a"/><stop offset="1" stop-color="#3a7a32"/></linearGradient>
<linearGradient id="h@" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f2dcb0"/><stop offset=".6" stop-color="#dcc08a"/><stop offset="1" stop-color="#a8885a"/></linearGradient>
<linearGradient id="ro@" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8643a"/><stop offset="1" stop-color="#7a3a22"/></linearGradient></defs>
<rect width="240" height="240" fill="url(#s@)"/><circle cx="190" cy="70" r="36" fill="#fff6c8" opacity=".6" filter="url(#bl@)"/><circle cx="190" cy="70" r="16" fill="#fffbe6"/>
<path d="M0 150q50 -26 110 -10t130 -12V240H0z" fill="#b5dc7a" opacity=".7"/><path d="M0 178q70 -22 130 -6t110 -4V240H0z" fill="url(#g@)"/>
<g><rect x="70" y="104" width="100" height="68" fill="url(#h@)"/><path d="M62 106L120 66L178 106z" fill="url(#ro@)"/><path d="M62 106L120 66L120 106z" fill="#fff" opacity=".18"/><rect x="62" y="102" width="116" height="6" fill="#7a3a22"/><rect x="106" y="130" width="26" height="42" rx="13" fill="#5a3418"/><rect x="106" y="130" width="13" height="42" rx="6" fill="#7a4a24"/><rect x="80" y="120" width="16" height="18" rx="2" fill="#ffe08a"/><rect x="144" y="120" width="16" height="18" rx="2" fill="#ffe08a"/><path d="M88 120v18M80 129h16M152 120v18M144 129h16" stroke="#7a4a24" stroke-width="2"/><rect x="146" y="82" width="12" height="22" fill="#a8885a"/></g>
<path d="M40 192Q60 176 80 190Q100 176 120 190Q140 176 160 190Q180 176 200 192V210H40z" fill="#2f6a2a"/>${_ar(7, i => `<circle cx="${52 + i * 22}" cy="${192 + (i % 2) * 5}" r="4.6" fill="#7a2f8f"/><circle cx="${52 + i * 22 - 1.5}" cy="${190 + (i % 2) * 5}" r="1.4" fill="#fff" opacity=".6"/>`)}
<g transform="translate(26 196)"><ellipse cx="22" cy="12" rx="22" ry="12" fill="#8a5a3a"/><circle cx="48" cy="6" r="9" fill="#8a5a3a"/><path d="M44 -2Q38 -12 46 -14M54 -2Q62 -10 56 -14" stroke="#e8dcc0" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M8 20v12M18 22v12M32 22v12M40 20v12" stroke="#6a4028" stroke-width="5" stroke-linecap="round"/></g>
<g transform="translate(206 40)"><path d="M-26 0Q0 -22 26 0Q0 22 -26 0z" fill="#fff" opacity=".92"/><circle r="9.5" fill="#3fa84a"/><circle r="4.4" fill="#10301a"/><circle cx="-2" cy="-2" r="1.5" fill="#fff"/><path d="M-26 0Q0 -22 26 0" fill="none" stroke="#3a2a10" stroke-width="2.4"/></g>`;
let _tkZ = 0;
const tkBildSvg = (id, k) => { const u = "t" + (++_tkZ); return `<svg viewBox="0 0 240 240" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">${TK_BILD[id][k]().replace(/@/g, u)}</svg>`; };
