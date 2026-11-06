// Common tier illustrations (22). Each returns inner SVG markup for viewBox 0 0 300 180.
import { K, R, E, C, P, D, L, S, G, shadow } from './kit.js';
import { registerArt } from '../ui/card.js';

const text = (x, y, size, fill, t, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" font-family="Bebas Neue,Impact,sans-serif" fill="${fill}" letter-spacing="1.5"${extra}>${t}</text>`;
const lines = (x, y, w, n, gap = 8, color = K.g3, sw = 2.5) => Array.from({ length: n }, (_, i) => L(`M${x} ${y + i * gap}h${w - ((i * 11) % 18)}`, color, sw)).join('');

export const commonArt = {
  'common-family-photos': () => {
    let s = shadow(150, 105);
    const photo = (x, y, rot, sky, hill) => G(`translate(${x} ${y}) rotate(${rot})`,
      R(-30, -38, 60, 76, K.white, 2) + R(-25, -33, 50, 50, sky, 1) + S('M-25 8Q-10 -6 5 6T25 4V17H-25Z', hill)
      + C(-8, -14, 5, K.skin) + R(-12, -9, 8, 14, K.red, 2) + C(10, -12, 4.4, K.skin) + R(6, -8, 8, 12, K.blue2, 2)
      + L('M-11 -13h6M7 -11h6', K.ink, 1.6) + L('M-20 28h26', K.g2, 3));
    s += photo(116, 62, -14, '#bfe6f5', '#7bc27a') + photo(170, 56, 10, '#f5d9a0', '#a8c478') + photo(144, 66, -2, '#cfd8f5', '#8fcf8a');
    s += D('M62 90L238 90L226 160L74 160Z', K.wood);
    s += S('M186 90H238L226 160H178Z', '#c18543') + P('62,90 48,76 96,84 100,90', '#e8b76e') + P('238,90 252,76 204,84 200,90', '#e8b76e');
    s += R(130, 100, 40, 18, '#efe3b8', 2) + L('M136 106h28M136 112h18', K.wood2, 2);
    return s;
  },

  'common-empty-cardboard-boxes': () => {
    let s = shadow(150, 118);
    const box = (x, y, w, h, flap) => D(`M${x} ${y}H${x + w}V${y + h}H${x}Z`, K.wood) + S(`M${x + w * 0.7} ${y}H${x + w}V${y + h}H${x + w * 0.7}Z`, '#c18543')
      + R(x + w * 0.4, y, w * 0.2, h * 0.34, '#efe3b8', 1) + L(`M${x} ${y + h * 0.34}H${x + w}`, K.wood2, 2.5)
      + (flap ? P(`${x},${y} ${x - 16},${y - 22} ${x + w * 0.5},${y - 12} ${x + w * 0.5},${y}`, '#e8b76e') + P(`${x + w},${y} ${x + w + 16},${y - 22} ${x + w * 0.5},${y - 12} ${x + w * 0.5},${y}`, '#d9a05a') : '');
    s += box(52, 90, 108, 72, true) + box(168, 108, 78, 54, true) + box(86, 36, 74, 54, false);
    s += text(123, 128, 22, K.wood3, 'FRAGILE', ' transform="rotate(-4 123 128)"');
    s += L('M180 128l10 -8M196 144l8 -6', K.wood2, 2);
    return s;
  },

  'common-stack-of-old-receipts': () => {
    let s = shadow(150, 85);
    const slip = (x, y, h, rot, curl) => G(`translate(${x} ${y}) rotate(${rot})`,
      D(`M-26 0H26V${h}${Array.from({ length: 7 }, (_, i) => `l${i % 2 ? -7.4 : -7.4}  ${i % 2 ? -5 : 5}`).join('')}H-26Z`, K.white)
      + lines(-18, 12, 36, Math.floor((h - 24) / 8), 8, K.g3, 2.4) + R(-18, 6, 22, 4, K.g2, 1) + (curl ? L('M-26 0Q-34 -8 -24 -14', K.ink, 3) : ''));
    s += slip(104, 40, 118, -8, true) + slip(150, 30, 130, 3, false) + slip(198, 44, 108, 9, true);
    s += E(150, 162, 70, 12, K.wood2) + R(144, 140, 12, 22, K.g4, 3) + L('M150 140V70', K.g3, 4);
    s += R(88, 150, 124, 10, K.g1, 3);
    s += C(150, 68, 5, K.red);
    return s;
  },

  'common-single-left-shoe': () => {
    let s = shadow(150, 100);
    s += D('M52 132Q52 118 66 114L112 104Q132 82 160 80Q196 78 214 104Q248 108 252 128V140Q252 148 244 148H62Q52 148 52 138Z', K.white);
    s += S('M170 82Q196 78 214 104Q248 108 252 128V140Q252 148 244 148H170Z', 'rgba(0,0,0,.08)');
    s += D('M50 140H254Q258 160 244 160H62Q46 160 50 140Z', K.red);
    s += S('M56 150H250', K.red2);
    s += D('M112 104Q124 70 142 62Q156 80 160 80Q140 80 126 104Z', K.red2);
    s += L('M146 88L170 98M140 98L164 108M132 108L156 118', K.ink, 4) + L('M146 88L170 98M140 98L164 108M132 108L156 118', K.white, 2);
    s += L('M200 112Q232 118 244 134', K.red, 6);
    s += D('M66 114Q52 96 70 86Q86 86 96 106Z', K.g1);
    s += `<text x="86" y="134" text-anchor="middle" font-size="26" font-family="Bebas Neue,Impact,sans-serif" fill="${K.ink}">L</text>`;
    s += L('M64 160H244', K.g3, 2);
    return s;
  },

  'common-paperback-books': () => {
    let s = shadow(150, 100);
    const book = (x, y, w, h, c, c2, rot = 0) => G(`rotate(${rot} ${x + w / 2} ${y + h})`, R(x, y, w, h, c, 3) + R(x, y, 10, h, c2, 3) + R(x + 18, y + 10, w - 30, 10, K.paper, 2) + lines(x + 22, y + 28, w - 36, 2, 7, K.paper, 2.4));
    s += book(76, 130, 150, 30, K.orange, K.red2) + book(86, 98, 132, 30, K.yellow, K.gold2, -2) + book(80, 68, 140, 30, K.purple, K.purple2, 2);
    s += G('rotate(-12 200 60)', D('M190 54L230 40L242 70L200 84Z', K.paper) + L('M196 62l34 -12M198 70l34 -12', K.g3, 2) + D('M200 84L242 70L246 82L204 96Z', K.cream));
    s += R(94, 36, 12, 34, K.red, 2) + P('94,70 106,70 100,62', K.red);
    s += lines(110, 142, 70, 1, 8, K.paper, 3);
    return s;
  },

  'common-garden-gnomes': () => {
    let s = shadow(150, 105);
    const gnome = (cx, base, k, hat, coat) => G(`translate(${cx} ${base}) scale(${k})`,
      R(-26, -70, 52, 66, coat, 14) + S('M8 -70H26V-14Q26 -4 14 -4H8Z', 'rgba(0,0,0,.15)')
      + E(0, -4, 32, 8, K.g3) + R(-22, -10, 14, 12, K.wood3, 3) + R(8, -10, 14, 12, K.wood3, 3)
      + D('M-24 -66Q0 -30 24 -66Q22 -34 0 -22Q-22 -34 -24 -66Z', K.white)
      + C(0, -76, 11, K.skin) + C(0, -72, 7, '#f08a7a')
      + D('M-20 -82L0 -150L20 -82Z', hat) + R(-24, -86, 48, 10, hat, 4) + S('M0 -150L20 -82H8Z', 'rgba(0,0,0,.18)')
      + C(-5, -80, 1.8, K.ink) + C(5, -80, 1.8, K.ink));
    s += gnome(112, 160, 0.95, K.red, K.blue) + gnome(196, 160, 0.66, K.green2, K.orange);
    s += E(60, 166, 14, 4, '#4f9a4a') + L('M52 166l-4 -12M60 166l0 -14M68 166l4 -10', '#4f9a4a', 3);
    return s;
  },

  'common-kitchen-utensils': () => {
    let s = shadow(150, 78);
    s += L('M112 98L96 22', K.wood2, 9) + L('M112 98L96 22', K.wood, 4) + E(94, 18, 12, 16, K.wood);
    s += L('M150 98L150 36', K.g3, 6) + C(150, 22, 22, 'none') + `<ellipse cx="150" cy="22" rx="12" ry="22" fill="none" stroke="${K.ink}" stroke-width="7"/><ellipse cx="150" cy="22" rx="12" ry="22" fill="none" stroke="${K.g1}" stroke-width="3"/><ellipse cx="150" cy="22" rx="5" ry="20" fill="none" stroke="${K.g1}" stroke-width="2.5"/>`;
    s += L('M188 98L204 30', K.g4, 7) + C(208, 22, 17, K.g2) + E(208, 22, 10, 9, K.g1);
    s += L('M126 98L132 40', K.red2, 7) + R(122, 26, 22, 20, K.red, 5);
    s += L('M170 98L176 52', K.wood2, 8) + D('M164 52L188 52L184 28L168 28Z', K.wood);
    s += D('M92 96H208L200 160Q150 170 100 160Z', '#e0a45a') + S('M168 96H208L200 160Q184 164 170 165Z', '#c78534');
    s += R(88, 90, 124, 14, '#efc27a', 4) + L('M108 116l16 -6M108 136l60 -10M112 148l70 -8', '#b66a2a', 3);
    return s;
  },

  'common-winter-coats': () => {
    let s = shadow(150, 105);
    const coat = (x, c, c2, rot) => G(`rotate(${rot} ${x} 160)`,
      D(`M${x - 44} 70Q${x - 52} 120 ${x - 46} 162H${x + 46}Q${x + 52} 120 ${x + 44} 70Q${x} 56 ${x - 44} 70Z`, c) + S(`M${x + 14} 66Q${x + 40} 70 ${x + 44} 70Q${x + 52} 120 ${x + 46} 162H${x + 14}Z`, c2)
      + L(`M${x - 46} 96H${x + 46}M${x - 48} 124H${x + 48}M${x - 46} 150H${x + 46}`, c2, 3.5) + L(`M${x} 66V162`, K.ink, 3)
      + D(`M${x - 44} 70Q${x - 62} 100 ${x - 50} 150L${x - 36} 148Q${x - 40} 110 ${x - 30} 80Z`, c) + D(`M${x + 44} 70Q${x + 62} 100 ${x + 50} 150L${x + 36} 148Q${x + 40} 110 ${x + 30} 80Z`, c)
      + D(`M${x - 30} 66Q${x} 40 ${x + 30} 66Q${x + 22} 80 ${x} 74Q${x - 22} 80 ${x - 30} 66Z`, '#f4efe6') + R(x - 3, 74, 6, 12, K.g1, 2));
    s += coat(110, K.blue, K.blue2, -5) + coat(196, K.red, K.red2, 6);
    s += D('M70 54Q100 40 130 54Q120 70 100 66Q80 66 70 54Z', K.yellow) + L('M82 56l6 8M96 52l6 12M110 54l6 10', K.gold2, 2.5);
    return s;
  },

  'common-lawn-chairs': () => {
    let s = shadow(150, 118);
    const chair = (x, c1, c2, flip = 1) => G(`translate(${x} 0) scale(${flip} 1)`,
      L('M-36 160L-24 78L-14 40', K.g4, 9) + L('M-36 160L-24 78L-14 40', K.g2, 3.5) + L('M36 160L24 78L14 40', K.g4, 9) + L('M36 160L24 78L14 40', K.g2, 3.5)
      + P('-30,94 30,94 38,116 -38,116', c1) + Array.from({ length: 6 }, (_, i) => S(`M${-32 + i * 11} 94L${-26 + i * 11} 94L${-30 + i * 12} 116L${-36 + i * 12} 116Z`, i % 2 ? c2 : c1)).join('')
      + R(-32, 94, 64, 3, K.ink, 1) + P('-18,44 18,44 24,92 -24,92', c1) + Array.from({ length: 4 }, (_, i) => S(`M${-18 + i * 9} 44H${-13 + i * 9}L${-17 + i * 10} 92H${-23 + i * 10}Z`, c2)).join('')
      + R(-22, 38, 44, 7, K.g2, 3) + L('M-34 124L34 124', K.g4, 6) + L('M-30 116L-30 150M30 116L30 150', K.g3, 4));
    s += chair(100, K.green, K.white) + chair(204, K.orange, K.white);
    return s;
  },

  'common-toolbox': () => {
    let s = shadow(150, 105);
    s += L('M96 60Q150 4 204 60', K.g4, 8) + L('M96 60Q150 4 204 60', K.g2, 3);
    s += R(56, 112, 188, 50, K.red, 8) + S('M196 112H244V162H196Z', K.red2) + R(52, 100, 196, 18, '#ea5a54', 6);
    s += R(138, 100, 24, 22, K.g1, 3) + C(150, 111, 4, K.g4);
    s += R(66, 64, 168, 40, '#b8bdc8', 4) + S('M66 64H234V74H66Z', '#9aa2b0');
    s += G('rotate(-14 110 70)', R(70, 60, 78, 12, K.g2, 3) + C(76, 66, 9, K.g1) + C(76, 66, 4, K.g4));
    s += G('rotate(8 190 66)', R(166, 52, 12, 52, K.wood, 3) + R(150, 44, 44, 18, K.g3, 4) + R(184, 44, 10, 18, K.g4, 2));
    s += L('M96 134h20M96 144h14', K.red2, 3) + R(204, 128, 26, 18, K.yellow, 3) + L('M208 138h18', K.ink, 2);
    return s;
  },

  'common-power-drill-set': () => {
    let s = shadow(150, 118);
    s += R(54, 128, 192, 34, '#3d4252', 6) + R(54, 124, 192, 8, K.g5, 3);
    for (let i = 0; i < 8; i++) s += R(66 + i * 22, 136, 8, 20 - (i % 3) * 3, K.g1, 2) + L(`M${70 + i * 22} 138v14`, K.g3, 1.5);
    s += G('rotate(-8 150 84)',
      D('M82 56H182Q196 56 196 70V86Q196 98 182 98H156L148 124H122L128 98H82Q70 98 70 86V68Q70 56 82 56Z', K.yellow)
      + S('M150 56H182Q196 56 196 70V86Q196 98 182 98H156Z', K.gold) + R(196, 66, 12, 24, K.g4, 3) + R(208, 70, 32, 16, K.g2, 3) + L('M244 78H262', K.g1, 6)
      + R(106, 62, 40, 14, K.ink, 4) + D('M104 98L98 126H128L136 98Z', K.ink) + R(118, 100, 10, 18, K.red, 3) + R(74, 66, 22, 24, K.red, 4) + L('M80 74h10M80 82h10', K.white, 2.5));
    s += C(262, 78, 3, K.g1);
    return s;
  },

  'common-starter-guitar': () => {
    let s = shadow(150, 105);
    s += G('rotate(-38 150 100)',
      L('M150 96H296', K.ink, 16) + L('M150 96H296', '#6b4020', 11) + L('M200 92H290', K.wood, 2)
      + [212, 232, 252, 272].map((x) => L(`M${x} 90v12`, K.g1, 1.8)).join('')
      + R(284, 80, 36, 32, K.ink, 6) + R(288, 84, 28, 24, '#6b4020', 5) + [292, 302, 310].map((x) => C(x, 90, 2.4, K.g1) + C(x, 102, 2.4, K.g1)).join('')
      + D('M150 96C120 96 108 74 84 74C56 74 46 96 62 112C40 118 42 150 76 152C108 152 124 136 150 136V96Z', K.orange)
      + D('M150 96C180 96 196 74 220 74', 'none')
      + S('M84 74C56 74 46 96 62 112C40 118 42 150 76 152C90 152 100 150 108 146C90 138 92 112 110 100C100 78 92 74 84 74Z', 'rgba(255,255,255,.18)')
      + C(96, 114, 17, K.ink) + C(96, 114, 12, '#2b1a12')
      + L('M70 114H150', K.g1, 1.8) + L('M70 118H150', K.g1, 1.8) + L('M70 110H150', K.g1, 1.8)
      + R(116, 130, 30, 8, K.wood3, 3));
    s += P('180,32 186,44 198,46 189,54 192,66 180,59 168,66 171,54 162,46 174,44', 'none');
    return s;
  },

  'common-camping-gear': () => {
    let s = shadow(150, 118);
    s += D('M50 160L150 38L250 160Z', K.orange);
    s += S('M150 38L250 160H178Z', '#d8661a');
    s += D('M150 38L120 160L150 160L196 160Z', '#8c3a10');
    s += D('M150 62L124 160H176Z', '#2b1a12');
    s += L('M150 38V62', K.ink, 4) + L('M150 38L108 98M150 38L192 98', '#ffb066', 3);
    s += L('M150 38L130 12M150 38L170 12', K.g4, 4);
    s += G('translate(228 138)', R(-12, -20, 24, 30, K.yellow, 4) + R(-8, -28, 16, 8, K.g4, 3) + L('M-8 -28Q0 -42 8 -28', K.g4, 3) + R(-8, -12, 16, 14, '#fff6b0', 3) + R(-14, 8, 28, 6, K.g4, 3));
    s += G('translate(70 148)', E(0, 0, 30, 12, '#4a6fd8') + R(-30, -12, 60, 24, '#4a6fd8', 12) + E(-30, 0, 8, 12, '#2f4fb0') + L('M-12 -10V10M4 -10V10', '#2f4fb0', 3));
    s += L('M236 138l10 -4M240 128l8 -10', K.yellow, 3);
    return s;
  },

  'common-box-of-board-games': () => {
    let s = shadow(150, 112);
    const box = (x, y, w, h, c, c2) => R(x, y, w, h, c, 4) + R(x + 6, y + 6, w - 12, 10, c2, 2) + S(`M${x + w * 0.75} ${y}H${x + w}V${y + h}H${x + w * 0.75}Z`, 'rgba(0,0,0,.14)');
    s += box(60, 126, 182, 36, K.blue, K.yellow) + text(150, 154, 20, K.white, 'TRIVIA NIGHT');
    s += box(76, 90, 156, 36, K.purple, K.pink) + text(154, 118, 20, K.white, 'MYSTERY MANOR');
    s += G('rotate(-3 150 70)', R(84, 36, 140, 54, K.red, 4));
    for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) s += R(92 + c * 16, 44 + r * 10, 16, 10, (r + c) % 2 ? K.paper : K.ink, 0);
    s += G('translate(250 84) rotate(18)', R(-14, -14, 28, 28, K.white, 5) + [[-7, -7], [7, -7], [0, 0], [-7, 7], [7, 7]].map(([x, y]) => C(x, y, 2.6, K.ink)).join(''));
    s += G('translate(44 112) rotate(-14)', R(-12, -12, 24, 24, K.red, 5) + [[-5, -5], [5, 5]].map(([x, y]) => C(x, y, 2.6, K.white)).join(''));
    return s;
  },

  'common-vintage-radio': () => {
    let s = shadow(150, 104);
    s += R(82, 156, 26, 10, '#3a2410', 3) + R(192, 156, 26, 10, '#3a2410', 3);
    s += L('M96 62Q96 34 132 34Q168 34 168 62', K.ink, 11) + L('M96 62Q96 34 132 34Q168 34 168 62', K.wood2, 5);
    s += L('M210 62L262 14', K.ink, 4) + C(263, 13, 5, K.red);
    s += `<clipPath id="rb"><rect x="58" y="58" width="184" height="102" rx="16"/></clipPath>`;
    s += `<rect x="58" y="58" width="184" height="102" rx="16" fill="#e0903f"/><rect x="206" y="58" width="40" height="102" fill="#c47a2f" clip-path="url(#rb)"/><rect x="58" y="58" width="184" height="102" rx="16" fill="none" class="ink"/>`;
    s += R(70, 70, 160, 78, '#fbf0d0', 10) + R(78, 78, 64, 62, '#5a3216', 8);
    for (let y = 86; y < 138; y += 8) s += L(`M85 ${y}H135`, K.wood2, 3.5);
    s += R(150, 78, 72, 28, '#fff7e0', 5);
    for (let x = 158; x < 218; x += 8) s += L(`M${x} 100v-${(x - 158) % 16 === 0 ? 8 : 5}`, K.ink, 2);
    s += L('M190 81V103', K.red, 3);
    for (const kx of [170, 202]) s += C(kx, 127, 11, K.g5) + C(kx, 127, 5, K.g4) + L(`M${kx} 118v5`, K.white, 2.5);
    const note = (x, y) => C(x, y, 5.5, K.white) + L(`M${x + 5} ${y}V${y - 22}q8 2 9 10`, K.ink, 3.5) + L(`M${x + 5} ${y}V${y - 22}q8 2 9 10`, K.white, 1.6);
    s += note(44, 50) + note(262, 96);
    return s;
  },

  'common-leather-jacket': () => {
    let s = shadow(150, 100);
    s += D('M92 56Q54 62 44 120L52 156L82 150L86 96Z', '#7a3f1e') + D('M208 56Q246 62 256 120L248 156L218 150L214 96Z', '#7a3f1e');
    s += D('M92 56L116 46L150 64L184 46L208 56L214 96V160H86V96Z', '#8a4a24');
    s += S('M170 52L208 56L214 96V160H170Z', 'rgba(0,0,0,.18)');
    s += P('116,46 150,64 132,112 96,80', '#6b3416') + P('184,46 150,64 168,112 204,80', '#6b3416');
    s += L('M150 64V160', K.ink, 3) + L('M146 70V158', K.g2, 2) + R(144, 118, 12, 14, K.g2, 2);
    s += R(86, 138, 128, 14, '#6b3416', 4) + R(138, 138, 24, 14, K.g2, 3);
    s += L('M108 110h32M160 110h32', K.ink, 3) + [96, 106, 196, 206].map((x) => C(x, 84, 3, K.g1)).join('');
    s += R(100, 94, 28, 4, K.g2, 2) + R(172, 94, 28, 4, K.g2, 2);
    s += L('M60 124l12 6M240 124l-12 6', K.ink, 2.5) + C(46, 144, 4, K.g1);
    return s;
  },

  'common-espresso-machine': () => {
    let s = shadow(150, 108);
    s += R(66, 38, 168, 92, K.g1, 10) + S('M180 38H234V130H180Z', K.g2) + R(62, 30, 176, 16, K.g3, 6);
    s += R(88, 52, 124, 34, K.g5, 6) + R(150, 96, 44, 12, K.g4, 3);
    s += C(112, 69, 14, K.paper) + L('M112 69L121 62', K.red, 2.5) + C(112, 69, 14, 'none');
    s += C(150, 69, 7, K.red) + C(172, 69, 7, K.green) + C(194, 69, 7, K.yellow);
    s += R(122, 100, 60, 12, K.g4, 3) + R(138, 112, 26, 12, K.g5, 2) + D('M180 106H226', 'none') + L('M182 108H214L222 130', K.g3, 6) + L('M182 108H214L222 130', K.g1, 2.5);
    s += R(60, 130, 180, 16, K.g3, 5) + R(76, 146, 148, 8, K.g5, 3);
    s += D('M112 124H152L148 154H116Z', K.paper) + R(150, 132, 12, 12, K.paper, 6);
    s += L('M126 112q-6 -8 0 -16M138 112q-6 -8 0 -14', K.white, 3);
    return s;
  },

  'common-game-console': () => {
    let s = shadow(150, 118);
    s += R(54, 104, 192, 56, K.g2, 8) + S('M200 104H246V160H200Z', K.g3) + R(60, 98, 180, 14, K.g1, 4);
    s += R(82, 118, 94, 12, K.g5, 3) + R(88, 76, 76, 28, K.red, 3) + R(98, 84, 56, 12, K.paper, 2) + L('M104 90h44', K.red2, 2.5);
    s += C(212, 124, 5, K.green) + R(190, 138, 32, 8, K.g4, 3) + R(88, 138, 40, 8, K.g4, 3);
    s += L('M60 150Q30 160 24 130', K.ink, 4);
    const pad = (x, y, rot) => G(`translate(${x} ${y}) rotate(${rot})`, R(-34, -18, 68, 36, K.white, 16) + S('M10 -18H18Q34 -18 34 0V2Q34 18 18 18H10Z', 'rgba(0,0,0,.12)')
      + R(-26, -4, 20, 8, K.ink, 2) + R(-20, -10, 8, 20, K.ink, 2) + C(16, -2, 6, K.red) + C(26, 6, 6, K.blue) + R(-2, 4, 10, 4, K.g3, 2));
    s += pad(92, 40, -8) + pad(210, 46, 7);
    s += L('M72 56Q60 84 90 98M236 60Q244 86 212 98', K.ink, 3);
    return s;
  },

  'common-mountain-bike': () => {
    let s = shadow(150, 128);
    const wheel = (cx) => `<circle cx="${cx}" cy="126" r="42" fill="none" stroke="${K.ink}" stroke-width="13"/><circle cx="${cx}" cy="126" r="42" fill="none" stroke="#3d4252" stroke-width="7"/><circle cx="${cx}" cy="126" r="42" fill="none" stroke="#5a6273" stroke-width="2" stroke-dasharray="5 6"/>`
      + L(Array.from({ length: 8 }, (_, i) => `M${cx} 126L${(cx + 36 * Math.cos((i * Math.PI) / 4)).toFixed(1)} ${(126 + 36 * Math.sin((i * Math.PI) / 4)).toFixed(1)}`).join(''), K.g2, 1.6) + C(cx, 126, 6, K.g3);
    s += wheel(74) + wheel(226);
    s += L('M74 126L120 80L190 80L150 126Z', K.ink, 10) + L('M74 126L120 80L190 80L150 126Z', K.green, 5.5);
    s += L('M120 80L150 126', K.ink, 10) + L('M120 80L150 126', K.green, 5.5) + L('M190 80L226 126', K.ink, 9) + L('M190 80L226 126', K.g3, 5);
    s += L('M190 80L184 58', K.ink, 8) + L('M190 80L184 58', K.g4, 4) + L('M168 52L204 56', K.g5, 6) + R(108, 60, 34, 10, K.g5, 5);
    s += C(150, 126, 10, K.g3) + L('M150 126L168 142M150 126L134 142', K.g4, 5) + R(160, 140, 18, 6, K.g5, 2);
    return s;
  },

  'common-drum-kit': () => {
    let s = shadow(150, 120);
    s += L('M64 62L58 158M64 62L90 158', K.g4, 4) + E(64, 58, 38, 7, K.gold) + E(64, 58, 6, 2, K.gold2);
    s += L('M244 40L248 158M244 40L222 158', K.g4, 4) + E(244, 36, 34, 6, K.gold) + E(244, 36, 5, 2, K.gold2);
    s += E(150, 112, 62, 48, K.red) + `<ellipse cx="150" cy="112" rx="62" ry="48" fill="none" stroke="${K.g1}" stroke-width="6"/>` + E(150, 112, 42, 32, K.paper) + text(150, 124, 30, K.red, 'BB');
    s += R(86, 92, 12, 12, K.g3, 3) + R(202, 92, 12, 12, K.g3, 3);
    s += E(104, 64, 34, 22, K.blue) + R(70, 64, 68, 20, K.blue2, 3) + E(104, 62, 30, 17, K.paper) + L('M70 66V84M138 66V84', K.g1, 3);
    s += E(196, 64, 34, 22, K.blue) + R(162, 64, 68, 20, K.blue2, 3) + E(196, 62, 30, 17, K.paper);
    s += E(150, 142, 36, 20, K.white) + R(114, 140, 72, 22, K.red2, 4) + E(150, 140, 32, 16, K.paper) + L('M114 142V160M186 142V160', K.g1, 3);
    s += G('rotate(-30 120 40)', R(100, 36, 66, 6, K.wood, 3) + C(100, 39, 6, K.wood)) + G('rotate(26 190 38)', R(140, 34, 62, 6, K.wood, 3) + C(202, 37, 6, K.wood));
    return s;
  },

  'common-telescope': () => {
    let s = shadow(150, 100);
    s += L('M150 112L96 166M150 112L204 166M150 112V166', K.ink, 9) + L('M150 112L96 166M150 112L204 166M150 112V166', K.g3, 4);
    s += C(150, 112, 9, K.g4);
    s += G('rotate(-26 150 100)', R(50, 84, 150, 34, '#f4f1de', 5) + S('M50 106H200V118H50Z', 'rgba(0,0,0,.12)') + R(196, 78, 14, 46, K.gold2, 3) + R(40, 80, 14, 42, K.gold2, 3)
      + R(210, 92, 36, 18, K.g5, 4) + R(238, 86, 14, 30, K.g4, 3) + R(98, 62, 66, 14, K.g1, 3) + R(104, 76, 6, 10, K.g3, 1) + R(150, 76, 6, 10, K.g3, 1) + R(50, 92, 34, 14, K.blue2, 2));
    s += '<g fill="#fff6b0"><circle cx="40" cy="30" r="2.4"/><circle cx="260" cy="50" r="2"/><circle cx="224" cy="22" r="2.6"/><circle cx="84" cy="14" r="1.8"/><circle cx="270" cy="124" r="2.2"/></g>';
    s += G('translate(56 60)', D('M0 -8L2 -2L8 -2L3 2L5 8L0 4L-5 8L-3 2L-8 -2L-2 -2Z', K.yellow));
    return s;
  },

  'common-designer-handbag': () => {
    let s = shadow(150, 98);
    s += L('M104 74Q104 18 150 18Q196 18 196 74', K.ink, 12) + L('M104 74Q104 18 150 18Q196 18 196 74', '#b8793c', 6);
    s += D('M62 70H238L252 150Q252 164 238 164H62Q48 164 48 150Z', K.pink) + S('M186 70H238L252 150Q252 164 238 164H186Z', 'rgba(0,0,0,.14)');
    s += R(56, 64, 188, 20, '#ff9be3', 8);
    for (let y = 96; y < 160; y += 22) for (let x = 70; x < 240; x += 26) s += text(x + ((y / 22) % 2 ? 13 : 0), y + 14, 18, '#ffd0f0', 'BB');
    s += R(130, 70, 40, 26, K.gold, 6) + C(150, 83, 7, K.gold2) + L('M144 83h12', K.ink, 2);
    s += R(60, 96, 14, 54, '#b8793c', 3) + R(226, 96, 14, 54, '#b8793c', 3);
    s += G('translate(224 128) rotate(14)', R(-16, -22, 32, 44, K.paper, 3) + C(0, -14, 3, K.ink) + L('M-9 -2h18M-9 6h18M-9 14h12', K.g3, 2.2) + L('M0 -22Q-4 -34 -14 -30', K.gold2, 2.5));
    return s;
  },
};

registerArt(commonArt);
