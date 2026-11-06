// Valuable (9), Unique (2) and Havoc (4) illustrations: the showpiece cards. viewBox 0 0 300 180.
import { K, R, E, C, P, D, L, S, G, shadow } from './kit.js';
import { registerArt } from '../ui/card.js';

const text = (x, y, size, fill, t, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" font-family="Bebas Neue,Impact,sans-serif" fill="${fill}" letter-spacing="1.5"${extra}>${t}</text>`;
const dots = (pts, fill, r = 2.4) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
const spark = (x, y, r = 7) => `<path d="M${x} ${y - r}L${x + r * 0.28} ${y - r * 0.28}L${x + r} ${y}L${x + r * 0.28} ${y + r * 0.28}L${x} ${y + r}L${x - r * 0.28} ${y + r * 0.28}L${x - r} ${y}L${x - r * 0.28} ${y - r * 0.28}Z" fill="#fff6b0" stroke="${K.ink}" stroke-width="1.6" stroke-linejoin="round"/>`;

// ---------- storage-unit interior shared by the four Havoc scenes ----------
function unitWall() {
  let s = '<rect x="0" y="0" width="300" height="180" fill="#c9ced6"/>';
  for (let x = 12; x < 300; x += 24) s += `<path d="M${x} 0V180" stroke="#aab1bd" stroke-width="2"/>`;
  return s;
}
function unitOpening(fill, panel) {
  let s = R(60, 36, 180, 128, fill);
  for (const x of [80, 110, 140, 170, 200]) s += `<path d="M${x} 36V164" stroke="${panel}" stroke-width="2"/>`;
  return s + R(60, 150, 180, 14, 'rgba(0,0,0,.35)');
}
const box = (x, y, w, h, c = '#d8a05a') => R(x, y, w, h, c) + `<path d="M${x} ${y + h * 0.28}H${x + w}" stroke="#a9733a" stroke-width="2.5"/>` + R(x + w * 0.38, y, w * 0.24, h * 0.28, '#efe3b8');
const shutter = () => R(54, 24, 192, 20, '#9aa2b0') + L('M58 30H242M58 36H242', '#6f7787', 2);
const BOXES = [[70, 118, 56, 46], [128, 124, 52, 40], [182, 112, 52, 52], [80, 76, 46, 42], [190, 66, 44, 46], [136, 92, 40, 32]];
const stack = (c, mod) => BOXES.map(([x, y, w, h], i) => box(x, y, w, h, mod ? mod(i, c) : c)).join('');
const hazardBanner = () => '';

function blob(x, y, r, fill = '#141c18') {
  return `<path d="M${x - r} ${y}q${-r * 0.2} ${-r} ${r} ${-r}q${r * 1.3} ${r * 0.1} ${r} ${r}q${r * 0.4} ${r} ${-r * 0.9} ${r}q${-r} ${r * 0.2} ${-r * 1.1} ${-r}z" fill="${fill}" stroke="${K.ink}" stroke-width="2"/>`
    + `<circle cx="${x - r * 0.2}" cy="${y - r * 0.3}" r="${r * 0.22}" fill="#8fb83c"/><circle cx="${x + r * 0.5}" cy="${y + r * 0.2}" r="${r * 0.16}" fill="#8fb83c"/>`;
}
const flame = (x, y, k, c1 = '#ff5a1f', c2 = '#ffd23f') => G(`translate(${x} ${y}) scale(${k})`,
  D('M0 0C-20 -10 -22 -34 -8 -52C-6 -40 0 -36 4 -42C10 -26 24 -20 18 -2C14 6 6 4 0 0Z', c1) + D('M0 0C-10 -6 -10 -20 -2 -30C2 -20 10 -18 8 -6C6 2 2 2 0 0Z', c2));

export const topArt = {
  // ---------------- VALUABLE ----------------
  'valuable-vinyl-record-collection': () => {
    let s = shadow(150, 110);
    s += D('M56 96H244L236 162H64Z', K.wood) + S('M190 96H244L236 162H184Z', '#c18543');
    for (const y of [114, 134]) s += L(`M60 ${y}H240`, K.wood2, 3);
    const sleeve = (x, c, rot) => G(`rotate(${rot} ${x + 24} 100)`, R(x, 34, 48, 62, c, 2) + R(x + 6, 42, 36, 8, K.paper, 1) + L(`M${x + 8} 58h30M${x + 8} 66h22`, K.paper, 2.5));
    s += sleeve(78, K.red, -8) + sleeve(124, K.blue, 3) + sleeve(168, K.orange, 11);
    s += G('translate(216 70)', C(0, 0, 36, '#15151f') + `<circle r="30" fill="none" stroke="#3a3a4d" stroke-width="2.4"/><circle r="24" fill="none" stroke="#3a3a4d" stroke-width="2.4"/><circle r="18" fill="none" stroke="#3a3a4d" stroke-width="2.4"/>` + C(0, 0, 11, K.yellow) + C(0, 0, 3, '#15151f') + L('M-26 -14Q-14 -28 4 -30', '#6b6b88', 3));
    s += R(104, 98, 46, 14, K.paper, 2) + text(127, 110, 14, K.ink, 'HITS');
    return s;
  },

  'valuable-persian-rug': () => {
    let s = shadow(150, 125);
    s += D('M40 100L210 80L214 140L44 160Z', '#b3322e');
    s += P('52,106 200,89 203,132 55,150', '#f0e2c0');
    s += P('62,111 192,96 195,127 65,142', '#233a73');
    s += P('112,104 150,100 168,113 134,134 96,128', '#b3322e') + P('122,108 148,105 158,114 136,126 108,122', '#f0e2c0') + P('130,112 144,110 148,115 138,121 124,119', '#233a73');
    for (const [x, y] of [[74, 116], [180, 106], [76, 134], [182, 120]]) s += P(`${x},${y - 6} ${x + 8},${y} ${x},${y + 6} ${x - 8},${y}`, '#e8b24a');
    for (let i = 0; i < 12; i++) s += L(`M${44 + i * 14} ${160 - i * 1.4}l-3 12`, '#f0e2c0', 2.6);
    s += E(226, 112, 40, 34, '#c43a34') + R(196, 78, 60, 68, '#c43a34', 0) + E(256, 112, 14, 34, '#e0594f');
    s += `<ellipse cx="256" cy="112" rx="10" ry="25" fill="none" stroke="${K.ink}" stroke-width="2.4"/><ellipse cx="256" cy="112" rx="5" ry="14" fill="none" stroke="${K.ink}" stroke-width="2.4"/>` + C(256, 112, 2.5, K.ink);
    s += L('M196 80H256M196 144H256', K.ink, 3) + R(196, 80, 60, 64, 'none') + L('M204 90h44M204 134h44', '#f0e2c0', 4) + L('M204 104h44M204 120h44', '#233a73', 4);
    return s;
  },

  'valuable-rare-comic-collection': () => {
    let s = shadow(150, 110);
    const comic = (x, y, rot, c1, c2, title) => G(`translate(${x} ${y}) rotate(${rot})`,
      R(-34, -50, 68, 100, K.white, 2) + R(-30, -46, 60, 92, c1, 1) + R(-30, -46, 60, 20, c2, 1) + text(0, -30, 17, K.white, title)
      + D('M-8 -2L2 -22L12 -2Z', K.yellow) + C(2, -26 + 20, 0, 'none') + C(2, 12, 11, K.skin) + R(-9, 22, 22, 22, K.red, 4) + D('M-9 22L-26 40L-9 36Z', K.blue) + D('M13 22L30 40L13 36Z', K.blue)
      + L('M-8 10l5 -2M6 8l5 2', K.ink, 2) + P('20,-18 24,-8 34,-6 26,0 28,10 20,5 12,10 14,0 6,-6 16,-8', K.yellow) + R(14, 30, 18, 12, K.paper, 2) + L('M14 30h18', K.ink, 1.5)
      + S('M-30 -46H-18L-30 -34Z', 'rgba(255,255,255,.5)'));
    s += comic(98, 92, -10, '#3a5fd0', K.red, 'ZAP') + comic(192, 90, 9, '#d8402e', '#3a2a8a', 'WHAM') + comic(146, 84, -1, '#17a98a', '#b8332e', 'POW');
    s += R(106, 138, 90, 20, K.paper, 3) + L('M114 148h74', K.g3, 2.5) + R(200, 128, 40, 16, K.yellow, 3) + text(220, 141, 13, K.ink, '#1');
    return s;
  },

  'valuable-pro-camera-kit': () => {
    let s = shadow(150, 118);
    s += D('M72 70L228 70L240 150Q240 160 230 160H70Q60 160 60 150Z', '#2b2f3c') + S('M190 70H228L240 150Q240 160 230 160H190Z', 'rgba(0,0,0,.25)');
    s += R(66, 56, 168, 32, '#3b4152', 8) + R(116, 38, 68, 24, '#4a5064', 5) + R(134, 22, 32, 20, K.g2, 3) + R(180, 40, 26, 14, K.red, 3);
    s += R(80, 66, 24, 12, K.g1, 3) + C(214, 72, 8, K.g3) + C(214, 72, 4, K.g5);
    s += C(150, 118, 46, K.g5) + C(150, 118, 38, '#3b4152') + C(150, 118, 30, K.ink) + C(150, 118, 22, '#1e3a6e') + C(150, 118, 12, '#2f6fa0') + C(142, 110, 5, '#cfe9ff') + L('M120 84L112 76M180 84L188 76', K.g3, 4);
    for (let i = 0; i < 24; i++) { const a = (i * Math.PI) / 12; s += L(`M${(150 + 38 * Math.cos(a)).toFixed(1)} ${(118 + 38 * Math.sin(a)).toFixed(1)}l${(5 * Math.cos(a)).toFixed(1)} ${(5 * Math.sin(a)).toFixed(1)}`, K.g3, 2); }
    s += L('M62 74Q30 90 40 130Q50 150 76 148', '#b8332e', 7) + L('M62 74Q30 90 40 130Q50 150 76 148', '#d8402e', 3);
    s += text(96, 150, 13, K.paper, 'PRO') + R(236, 90, 20, 56, K.g4, 4);
    return s;
  },

  'valuable-grandfather-clock': () => {
    let s = shadow(150, 62);
    s += R(104, 142, 92, 24, '#6b3a16', 4) + R(112, 124, 76, 22, '#8a4a22', 3);
    s += R(118, 56, 64, 74, '#8a4a22', 4) + R(128, 64, 44, 58, '#2b1a12', 3) + L('M150 70V116', K.gold, 3.5) + C(150, 112, 7, K.gold) + C(150, 112, 3, K.gold2);
    s += S('M162 56H182V130H162Z', 'rgba(0,0,0,.2)');
    s += D('M110 56L110 28Q110 8 150 8Q190 8 190 28V56Z', '#8a4a22') + C(150, 34, 30, K.paper) + C(150, 34, 25, '#fff8e0');
    for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6 - Math.PI / 2; s += L(`M${(150 + 21 * Math.cos(a)).toFixed(1)} ${(34 + 21 * Math.sin(a)).toFixed(1)}L${(150 + 24 * Math.cos(a)).toFixed(1)} ${(34 + 24 * Math.sin(a)).toFixed(1)}`, K.ink, 2.4); }
    s += L('M150 34V16', K.ink, 3.4) + L('M150 34L164 40', K.ink, 3.4) + C(150, 34, 3, K.gold2);
    s += C(150, 10, 4, K.gold) + R(104, 56, 92, 8, '#6b3a16', 2) + R(100, 126, 100, 8, '#6b3a16', 2);
    s += `<text x="224" y="60" text-anchor="middle" font-size="20" font-family="Bebas Neue,Impact,sans-serif" fill="${K.paper}" letter-spacing="2" opacity=".0">.</text>`;
    s += G('translate(244 96)', L('M0 -40Q10 -20 0 0Q-10 20 0 40', '#2f9a5f', 5) + D('M0 -22q16 -6 20 4q-14 6 -20 -4z', '#4fd08a') + D('M0 4q-16 -6 -20 4q14 6 20 -4z', '#4fd08a') + D('M0 -4q16 -4 18 6q-14 4 -18 -6z', '#4fd08a'));
    s += R(228, 130, 32, 28, '#c0582e', 4) + R(224, 126, 40, 10, '#d8693a', 3);
    s += G('translate(62 120)', L('M0 0V-30', K.g4, 4) + D('M-14 -30H14L10 -52H-10Z', K.yellow) + L('M-12 -42h24', K.gold2, 2.4) + R(-8, 0, 16, 8, K.g4, 3));
    return s;
  },

  'valuable-gold-coin-stash': () => {
    let s = shadow(150, 118);
    s += D('M54 98H246V158Q246 166 236 166H64Q54 166 54 158Z', '#8a4a22') + S('M196 98H246V158Q246 166 236 166H196Z', 'rgba(0,0,0,.2)');
    s += R(50, 96, 200, 14, K.gold2, 4) + R(50, 140, 200, 12, K.gold2, 4) + R(134, 112, 32, 34, K.gold, 4) + C(150, 126, 5, K.ink) + L('M150 126v10', K.ink, 3);
    s += E(150, 78, 90, 28, '#b8861a');
    const coin = (x, y, r = 12) => `<g transform="translate(${x} ${y})"><circle r="${r}" fill="${K.gold}" class="ink"/><circle r="${r * 0.66}" fill="none" stroke="${K.gold2}" stroke-width="2"/><path d="M0 ${-r * 0.36}v${r * 0.72}" stroke="${K.gold2}" stroke-width="2.2"/></g>`;
    const piles = [[96, 66], [124, 56], [152, 50], [180, 56], [208, 66], [110, 78], [140, 72], [170, 74], [198, 80], [84, 82], [226, 82], [126, 40], [162, 36], [150, 22], [138, 30], [176, 46]];
    for (const [x, y] of piles) s += coin(x, y, 13);
    s += coin(66, 148, 12) + coin(256, 150, 12) + coin(240, 166, 11) + G('rotate(-60 62 164)', coin(62, 164, 12));
    s += D('M104 24l8 -8l8 8l-8 8z', K.red) + D('M188 28l7 -7l7 7l-7 7z', '#4aa3d8') + spark(94, 30, 8) + spark(212, 22, 7) + spark(262, 100, 6);
    return s;
  },

  'valuable-signed-baseball-collection': () => {
    let s = shadow(150, 118);
    s += R(54, 128, 192, 32, '#6b3a16', 5) + R(48, 120, 204, 12, '#8a4a22', 4);
    const ball = (x, y, r) => `<g transform="translate(${x} ${y})"><circle r="${r}" fill="${K.paper}" class="ink"/>` + L(`M${-r * 0.55} ${-r * 0.8}Q${-r * 0.1} 0 ${-r * 0.55} ${r * 0.8}`, K.red, 2.4) + L(`M${r * 0.55} ${-r * 0.8}Q${r * 0.1} 0 ${r * 0.55} ${r * 0.8}`, K.red, 2.4)
      + Array.from({ length: 5 }, (_, i) => L(`M${-r * 0.5 + i * 0.5} ${-r * 0.5 + i * r * 0.25}l-5 1M${r * 0.5 - i * 0.5} ${-r * 0.5 + i * r * 0.25}l5 1`, K.red, 1.6)).join('')
      + L(`M${-r * 0.1} ${r * 0.1}q8 -10 14 2t12 -4`, '#2f4fb0', 2.4) + '</g>';
    s += ball(96, 98, 26) + ball(152, 92, 30) + ball(208, 98, 26);
    s += G('rotate(-70 262 110)', R(212, 100, 96, 14, K.wood, 7) + R(206, 98, 14, 18, K.wood3, 5) + R(300, 96, 6, 22, K.wood3, 2) + L('M230 106h56', K.wood2, 2));
    s += R(104, 138, 92, 14, K.gold, 3) + text(150, 149, 13, K.ink, '1927');
    s += spark(60, 70, 7) + spark(246, 60, 6);
    return s;
  },

  'valuable-vintage-pocketwatch': () => {
    let s = shadow(150, 98);
    s += L('M150 44Q118 6 80 14Q40 26 56 66', K.ink, 7) + L('M150 44Q118 6 80 14Q40 26 56 66', K.gold, 3.5);
    for (let i = 0; i < 6; i++) s += E(78 - i * 3 + (i > 3 ? 0 : 0), 16 + i * 8, 5, 3, 'none');
    s += R(140, 28, 20, 14, K.gold, 4) + C(150, 22, 9, 'none') + `<circle cx="150" cy="22" r="9" fill="none" stroke="${K.ink}" stroke-width="7"/><circle cx="150" cy="22" r="9" fill="none" stroke="${K.gold}" stroke-width="3.4"/>`;
    s += C(150, 100, 62, K.gold2) + C(150, 100, 56, K.gold) + C(150, 100, 46, '#fff8e0') + `<circle cx="150" cy="100" r="46" fill="none" stroke="${K.ink}" stroke-width="3"/>`;
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6 - Math.PI / 2;
      s += L(`M${(150 + 39 * Math.cos(a)).toFixed(1)} ${(100 + 39 * Math.sin(a)).toFixed(1)}L${(150 + 44 * Math.cos(a)).toFixed(1)} ${(100 + 44 * Math.sin(a)).toFixed(1)}`, K.ink, i % 3 ? 2.2 : 3.6);
    }
    s += text(150, 72, 13, K.ink, 'XII') + text(150, 134, 13, K.ink, 'VI') + text(116, 106, 13, K.ink, 'IX') + text(184, 106, 13, K.ink, 'III');
    s += L('M150 100L150 70', K.ink, 4) + L('M150 100L174 112', K.ink, 4) + C(150, 100, 5, K.red) + C(150, 100, 2, K.ink);
    s += S('M150 40A60 60 0 0 1 206 78L196 82A50 50 0 0 0 150 50Z', 'rgba(255,255,255,.35)');
    return s;
  },

  'valuable-antique-sword': () => {
    let s = shadow(150, 100, 170, 7);
    s += G('translate(150 92) rotate(-38)',
      R(-84, -8, 56, 16, '#8c1f3a', 3) + [-80, -71, -62, -53, -44, -35].map((x) => L(`M${x} -8l6 16`, '#c23d5c', 2.5)).join('')
      + C(-92, 0, 11, '#3a4252') + C(-92, 0, 4.5, K.green)
      + P('-14,-13 118,-13 168,0 118,13 -14,13', '#b9c4d4') + P('-14,0 168,0 118,13 -14,13', '#8593aa')
      + L('M-4 0H128', '#e7eef8', 3) + L('M10 -7H60M80 -7H100', '#e7eef8', 2)
      + R(-30, -38, 18, 76, '#3a4252', 7) + R(-26, -34, 5, 68, '#5a667d', 2) + C(-21, 0, 6, K.green));
    s += L('M58 72l-14 8M52 96l-16 6M66 52l-12 10', 'rgba(29,26,43,.45)', 3);
    return s;
  },

  // ---------------- UNIQUE ----------------
  'unique-dinosaur-fossil': () => {
    let s = shadow(150, 118);
    s += D('M30 150L44 40Q50 22 72 20L240 18Q262 20 266 42L272 140Q272 160 250 162L52 164Q30 164 30 150Z', '#9c8b72') + S('M170 20H240Q262 20 266 42L272 140Q272 160 250 162H170Z', 'rgba(0,0,0,.14)');
    s += L('M70 40L96 64L88 92L120 108M232 38L214 70L238 96M60 140L96 128L120 146', '#6e5f4a', 3);
    s += dots([[64, 60], [250, 64], [74, 120], [236, 138], [140, 150], [200, 150]], '#7c6c56', 3);
    s += D('M62 112C54 84 76 56 120 52C150 46 196 48 226 66C244 76 250 92 244 100L226 104L222 118L200 112L196 124L176 114L170 126L152 116L144 128L128 118L120 128L104 120C90 124 70 124 62 112Z', '#f1e6c8');
    s += S('M150 46C196 48 226 66 244 76C250 92 244 100 244 100L226 104L222 118L200 112L196 124L176 114L170 126L152 116Z', 'rgba(0,0,0,.1)');
    s += P('226,104 232,120 218,110', K.paper) + P('206,110 212,128 198,114', K.paper) + P('186,114 190,130 178,118', K.paper) + P('166,116 170,132 158,120', K.paper) + P('146,118 150,132 138,121', K.paper);
    s += D('M96 68C100 56 118 54 126 66C128 78 112 84 100 80C96 76 96 72 96 68Z', '#2b1a12') + C(110, 68, 3, '#6b4020');
    s += D('M236 86C240 82 246 82 248 88C246 94 238 94 236 90Z', '#2b1a12');
    s += L('M126 62L170 62M170 62L196 76', '#cdbf9e', 3) + L('M66 112C80 100 100 98 120 104', '#cdbf9e', 3);
    s += G('rotate(-30 60 60)', R(40, 54, 60, 10, K.wood, 4) + R(96, 50, 24, 18, K.g3, 3)) + dots([[60, 92], [70, 100], [54, 104], [200, 150]], '#d8c9a8', 2.4);
    return s;
  },

  'unique-modern-painting': () => {
    let s = shadow(150, 95, 170, 8);
    s += R(86, 14, 128, 148, K.gold, 4) + R(96, 24, 108, 128, '#a8741a', 0);
    s += '<clipPath id="cv"><rect x="102" y="30" width="96" height="116"/></clipPath><g clip-path="url(#cv)">';
    const polys = [['#ff5fa2', '102,30 150,30 138,72 102,86'], ['#ffd23f', '150,30 198,30 198,66 162,72'], ['#2ee6a6', '102,86 138,72 150,118 102,146'],
      ['#6c8cff', '138,72 162,72 176,104 150,118'], ['#ff8a1f', '162,72 198,66 198,110 176,104'], ['#8f4dff', '150,118 176,104 198,110 198,146 150,146'],
      ['#f4f1de', '118,50 142,46 146,70 122,76'], ['#ff4d5e', '124,84 150,80 156,100 130,108'], ['#1d1a2b', '166,48 180,50 178,62 164,60'], ['#19c3b8', '102,120 128,112 140,146 102,146']];
    for (const [c, p] of polys) s += `<polygon points="${p}" fill="${c}" stroke="${K.ink}" stroke-width="2.5" stroke-linejoin="round"/>`;
    s += L('M126 92q10 12 22 4', K.ink, 3) + '</g>';
    s += `<rect x="102" y="30" width="96" height="116" fill="none" class="ink"/>`;
    for (const [x, y] of [[92, 20], [208, 20], [92, 156], [208, 156]]) s += C(x, y, 3.5, '#fff3b0');
    s += R(120, 150, 60, 10, K.gold2, 2);
    return s;
  },

  // ---------------- HAVOC ----------------
  'havoc-water-damage': () => {
    let s = unitWall() + unitOpening('#27545e', '#1f444c');
    s += stack('#b99a6a', (i, c) => (i % 2 ? '#a08560' : c));
    s += L('M70 140q10 -6 20 0t20 0t20 0t20 0t20 0t20 0t20 0', '#7ec7f0', 4);
    s += R(60, 138, 180, 26, '#4aa3d8') + S('M60 138H240Q220 144 200 138T160 138T120 138T80 138T60 138Z', '#9fdbf6');
    s += L('M72 146q10 -5 20 0t20 0t20 0t20 0t20 0t20 0M72 156q10 -5 20 0t20 0t20 0t20 0t20 0', '#cdeeff', 2.4);
    s += `<path d="M80 118q-4 12 0 20M132 124q-4 10 0 14M184 108q-4 12 0 24" fill="none" stroke="#4aa3d8" stroke-width="5" stroke-linecap="round"/>`;
    s += shutter();
    for (const x of [78, 126, 176, 214]) s += D(`M${x} 44v16q0 6 5 6t5-6V44`, '#4aa3d8');
    for (const [x, y] of [[90, 78], [150, 66], [210, 90]]) s += D(`M${x} ${y}q7 10 0 14q-7 -4 0 -14z`, '#8cd0ff');
    s += `<path d="M20 130c8 -10 14 -10 22 0s14 10 22 0" fill="none" stroke="#4aa3d8" stroke-width="4" stroke-linecap="round"/>`;
    return s + hazardBanner();
  },

  'havoc-black-mold': () => {
    let s = unitWall() + unitOpening('#27545e', '#1f444c') + stack('#d8a05a') + shutter();
    for (const x of [80, 130, 196]) s += `<path d="M${x} 44v14q0 4 3 4t3-4V44" fill="#4aa3d8" stroke="${K.ink}" stroke-width="2"/>`;
    for (const [x, y, r] of [[86, 100, 14], [96, 134, 10], [152, 108, 12], [208, 90, 13], [200, 132, 11], [120, 146, 9], [172, 140, 8], [100, 86, 8]]) s += blob(x, y, r);
    s += dots([[70, 70], [230, 60], [150, 60], [110, 56], [214, 128], [62, 140]], '#a6d64b', 3);
    return s;
  },

  'havoc-fire-damage': () => {
    let s = unitWall() + unitOpening('#3a1a14', '#2b120e');
    s += stack('#6b4a30', (i, c) => (i % 3 ? '#3a2a20' : c));
    s += R(60, 36, 180, 128, 'rgba(255,90,31,.25)');
    for (const [x, y, k] of [[96, 160, 1.4], [140, 164, 1.9], [190, 160, 1.5], [226, 164, 1.1], [116, 118, 1.0], [168, 100, 1.2], [210, 114, 0.9]]) s += flame(x, y, k);
    s += shutter();
    s += `<g fill="#5a6273" stroke="${K.ink}" stroke-width="2.4"><circle cx="106" cy="26" r="13"/><circle cx="130" cy="14" r="16"/><circle cx="162" cy="20" r="14"/><circle cx="196" cy="12" r="12"/></g>`;
    s += L('M70 20q-8 -8 0 -16', '#5a6273', 3) + dots([[88, 60], [210, 50], [236, 80], [70, 100]], '#ffd23f', 2.6);
    return s;
  },

  'havoc-termite-nest': () => {
    let s = unitWall() + unitOpening('#2a2118', '#1f1810');
    const wood = (x, y, w, h) => R(x, y, w, h, '#a8693a') + L(`M${x + 4} ${y + h * 0.3}h${w - 8}M${x + 4} ${y + h * 0.65}h${w - 12}`, '#7a4a22', 2);
    s += wood(70, 130, 160, 28) + wood(86, 96, 130, 28) + wood(100, 62, 100, 28);
    s += L('M92 110q20 -8 30 6t28 -4t30 8t24 -6M112 78q16 -6 26 4t24 -2t24 6', '#2b1a12', 6);
    for (const [x, y] of [[104, 146], [150, 140], [196, 148], [128, 112], [176, 108], [150, 76], [124, 80]]) s += E(x, y, 6, 4, '#2b1a12');
    s += `<path d="M120 164q-4 -14 4 -22M180 164q4 -12 -4 -20" fill="none" stroke="#d8c08a" stroke-width="3"/>` + E(150, 164, 54, 6, '#d8c08a');
    const term = (x, y, rot) => G(`translate(${x} ${y}) rotate(${rot})`, E(0, 0, 9, 5, '#e8d4a0') + E(10, 0, 5, 4.4, '#c8a460') + E(-8, 0, 4, 3.6, '#e8d4a0') + C(12, -1, 1.2, K.ink) + L('M4 4l-3 6M-2 4l-3 6M-6 3l-3 6M12 -2l6 -6M12 -1l8 -2', K.ink, 1.6));
    for (const [x, y, r] of [[96, 50, 20], [150, 52, -10], [206, 56, 30], [70, 100, -20], [230, 110, 10], [118, 126, 40], [188, 130, -30], [100, 160, 0], [210, 158, 15]]) s += term(x, y, r);
    s += shutter() + dots([[80, 44], [200, 40], [226, 42]], '#d8c08a', 3);
    return s;
  },
};

registerArt(topArt);
