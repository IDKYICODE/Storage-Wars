// Junk tier illustrations (19). Each returns inner SVG markup for viewBox 0 0 300 180.
import { K, R, E, C, P, D, L, S, G, shadow } from './kit.js';
import { registerArt } from '../ui/card.js';

const REDBROWN = '#8a4a2a';
const dots = (pts, fill, r = 2.2) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
const fly = (x, y) => `<g transform="translate(${x} ${y})"><ellipse cx="-3" cy="-3" rx="3.5" ry="2" fill="#fff" stroke="${K.ink}" stroke-width="1"/><ellipse cx="3" cy="-3" rx="3.5" ry="2" fill="#fff" stroke="${K.ink}" stroke-width="1"/><circle r="3" fill="${K.ink}"/></g>`;
const puff = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#9aa2b0" class="ink"/>`;

/** One tire seen from slightly above. */
function tire(cx, cy, rx, ry, h) {
  let s = D(`M${cx - rx} ${cy}V${cy + h}A${rx} ${ry} 0 0 0 ${cx + rx} ${cy + h}V${cy}Z`, '#26262f');
  for (let i = -5; i <= 5; i++) {
    const x = cx + (i * rx) / 5.6;
    const y0 = cy + ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));
    s += L(`M${x.toFixed(1)} ${(y0 + 5).toFixed(1)}l3 ${h - 9}`, '#4d4d62', 3);
  }
  s += E(cx, cy, rx, ry, '#383848');
  s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.7}" ry="${ry * 0.64}" fill="#2d2d3b" stroke="#52526a" stroke-width="2"/>`;
  s += E(cx, cy + 1, rx * 0.5, ry * 0.46, '#0e0e15');
  s += L(`M${cx - rx * 0.82} ${cy - ry * 0.2}Q${cx - rx * 0.5} ${cy - ry * 0.9} ${cx - rx * 0.05} ${cy - ry * 0.88}`, '#8b8ba6', 3.5);
  return s;
}

export const junkArt = {
  'junk-worn-tires': () => {
    let s = shadow(150, 118);
    const cx = 236, cy = 112;
    s += C(cx, cy, 52, '#26262f') + `<circle cx="${cx}" cy="${cy}" r="45" fill="none" stroke="#4d4d62" stroke-width="7" stroke-dasharray="5 6"/>`;
    s += C(cx, cy, 34, '#34343f') + C(cx, cy, 22, '#b7bfcc') + C(cx, cy, 8, '#6d7686');
    for (let k = 0; k < 5; k++) {
      const a = (k * 2 * Math.PI) / 5 - Math.PI / 2;
      s += `<circle cx="${(cx + 14 * Math.cos(a)).toFixed(1)}" cy="${(cy + 14 * Math.sin(a)).toFixed(1)}" r="2.6" fill="#40485a"/>`;
    }
    s += L(`M${cx - 38} ${cy - 14}A40 40 0 0 1 ${cx - 10} ${cy - 38}`, '#8b8ba6', 4);
    s += tire(112, 128, 82, 27, 24) + tire(106, 104, 80, 26, 22) + tire(114, 82, 78, 25, 20);
    s += '<ellipse cx="200" cy="165" rx="30" ry="5" fill="#5b8fb0" opacity=".55"/>';
    return `<g transform="translate(140 90) scale(.88) translate(-150 -90)">${s}</g>`;
  },

  'junk-cracked-flower-pot': () => {
    let s = shadow(150, 85);
    s += E(214, 164, 26, 6, K.wood3);
    s += L('M150 88Q146 56 124 44', '#7a5a2a', 5) + L('M156 88Q170 58 192 52', '#7a5a2a', 5) + L('M152 88Q152 62 150 38', '#7a5a2a', 4);
    s += D('M124 44q-14-2-18 8q10 4 18-8z', '#a8793a') + D('M192 52q14-6 20 4q-12 6-20-4z', '#a8793a') + D('M150 38q-6-12 4-18q8 8-4 18z', '#a8793a');
    s += D('M100 104L111 158Q150 170 189 158L200 104Z', '#e0794a');
    s += S('M168 104L200 104L189 158Q176 162 166 162Z', '#c25f36');
    s += R(94, 86, 112, 20, '#ea8a58', 5);
    s += L('M150 106L143 122L157 134L146 148L152 164', K.ink, 4);
    s += P('178,86 192,86 190,100 182,95', '#2b1a12');
    s += dots([[84, 160], [238, 150], [226, 168]], K.pink, 4);
    s += P('104,162 118,170 112,176', '#c25f36');
    return s;
  },

  'junk-tangled-christmas-lights': () => {
    let s = shadow(150, 110);
    s += L('M36 122C70 30 118 160 150 92S224 38 262 112S192 168 140 132S58 154 82 98S150 60 190 96', '#1f6b3b', 5);
    s += L('M70 70C110 130 160 20 210 70S250 150 200 150', '#1f6b3b', 5);
    const bulbs = [[52, 80, K.red], [88, 134, K.yellow], [120, 118, K.blue], [150, 92, '#6b7384'], [186, 62, K.green], [236, 82, K.red],
      [250, 118, '#6b7384'], [196, 152, K.yellow], [112, 150, K.pink], [84, 98, K.orange], [212, 70, K.blue], [160, 128, K.green]];
    for (const [x, y, c] of bulbs) {
      s += R(x - 4, y - 11, 8, 8, '#2b2b2b', 1.5) + C(x, y, 8, c);
      if (c !== '#6b7384') s += S(`M${x - 4} ${y - 3}a4 4 0 0 1 4-4`, 'rgba(255,255,255,.8)');
      else s += L(`M${x - 4} ${y - 4}l8 8M${x + 4} ${y - 4}l-8 8`, K.ink, 2);
    }
    return s;
  },

  'junk-broken-umbrella': () => {
    let s = shadow(150, 88);
    s += D('M150 82L150 150Q150 166 134 164Q124 162 124 152', 'none');
    s += L('M150 82L150 150', K.wood2, 5) + L('M150 150Q150 166 134 164Q124 162 124 152', K.wood2, 5);
    s += D('M42 96Q60 24 150 22Q240 24 258 96Q240 82 222 96Q204 82 186 96Q168 82 150 96Q132 82 114 96Q96 82 78 96Q60 82 42 96Z', '#4a3b7a');
    s += S('M150 22Q240 24 258 96Q240 82 222 96Q204 82 186 96Q168 82 150 96Z', '#3a2d64');
    s += L('M150 22L150 96M150 22L114 96M150 22L78 96M150 22L186 96M150 22L222 96', '#2b2150', 3);
    s += P('96,48 132,40 118,76', '#c9ced6');
    s += L('M118 76L84 120', K.ink, 4) + L('M84 120l-10 6M84 120l-4 12', K.ink, 3);
    s += L('M222 96L252 126', K.ink, 4) + L('M252 126l-4 12', K.ink, 3);
    s += C(150, 82, 5, K.g3);
    return s;
  },

  'junk-dented-trash-can': () => {
    let s = shadow(145, 78);
    s += D('M96 74L106 158Q148 168 190 158L200 74Z', K.g3);
    s += S('M166 74L200 74L190 158Q176 162 164 163Z', K.g4);
    for (const x of [118, 136, 154, 172]) s += L(`M${x} 84L${x + 3} 154`, K.g2, 3);
    s += D('M120 110q16 -12 30 4q-12 16 -30 -4z', K.g4) + L('M126 112q10 -6 20 2', K.g2, 2);
    s += D('M156 132q14 -8 24 4q-10 12 -24 -4z', K.g4);
    s += G('rotate(-18 190 66)', E(190, 66, 56, 12, K.g2) + R(176, 52, 28, 8, K.g3, 3));
    s += C(112, 70, 12, '#fff') + L('M104 66l8 6l6-8', K.g3, 2) + C(132, 66, 10, '#f4f1de') + L('M126 62l6 8', K.g3, 2);
    s += D('M148 68q-6 -22 6 -34q10 16 4 34z', K.yellow) + L('M152 40v26', '#b8861a', 2);
    s += fly(100, 46) + fly(176, 36);
    return s;
  },

  'junk-box-of-mismatched-socks': () => {
    let s = shadow(150, 100);
    const sock = (x, y, rot, c1, c2) => G(`translate(${x} ${y}) rotate(${rot})`,
      D('M-9 0V-34Q-9 -40 -3 -40H9Q15 -40 15 -34V4Q15 20 -4 24Q-24 28 -26 14Q-26 6 -18 4L-9 0Z', c1)
      + R(-9, -40, 24, 10, c2, 3) + L('M-9 -22h24M-9 -12h24', c2, 3));
    s += sock(112, 66, -20, K.pink, K.yellow) + sock(150, 52, 6, K.teal, K.white) + sock(190, 62, 22, K.orange, K.purple);
    s += sock(132, 78, -45, K.green, K.red);
    s += D('M70 100L230 100L222 162L78 162Z', K.wood);
    s += S('M190 100L230 100L222 162L186 162Z', '#c18543');
    s += P('70,100 52,82 98,92 100,100', '#e8b76e') + P('230,100 250,82 202,92 200,100', '#e8b76e');
    s += R(128, 100, 44, 18, '#efe3b8', 2) + L('M134 106h32M134 112h20', K.wood2, 2);
    s += D('M92 140q30 -10 60 0', 'none');
    s += L('M92 140q30 8 60 0', K.wood2, 3);
    return s;
  },

  'junk-busted-treadmill': () => {
    let s = shadow(150, 120);
    s += D('M44 138L252 112L252 128L44 154Z', K.g5);
    s += P('52,138 246,114 246,122 52,146', K.g4);
    s += L('M92 134L96 126M130 130L134 122M170 126L174 118', K.g3, 3);
    s += P('150,136 176,132 172,124 148,127', K.ink);
    s += C(52, 150, 10, K.g3) + C(248, 124, 10, K.g3);
    s += L('M222 118L200 46', K.g3, 8) + L('M222 118L200 46', K.g2, 3);
    s += L('M202 56L150 70', K.g3, 7) + L('M202 56L150 70', K.g2, 3);
    s += R(168, 26, 64, 36, K.g5, 6) + R(176, 32, 36, 22, '#2e6c5a', 3);
    s += L('M180 36l10 10l8-8l8 12', '#9ee8c8', 2.5) + C(222, 38, 4, K.red) + C(222, 52, 4, K.yellow);
    s += L('M184 36L204 50M204 36L184 52', K.red, 3);
    s += puff(232, 18, 9) + puff(246, 8, 7) + puff(220, 6, 6);
    s += L('M252 100l8 -8l-4 12l10 -4', K.yellow, 3);
    return s;
  },

  'junk-moldy-couch': () => {
    let s = shadow(150, 118);
    const fab = '#c99a3a', fab2 = '#a87b22';
    s += R(52, 52, 196, 66, fab, 16);
    s += R(34, 84, 46, 74, fab2, 16) + R(220, 84, 46, 74, fab2, 16);
    s += R(66, 98, 168, 52, fab, 10);
    s += L('M150 98V150', fab2, 3);
    s += S('M66 124H234V140Q234 150 224 150H76Q66 150 66 140Z', 'rgba(0,0,0,.12)');
    s += R(56, 156, 14, 10, K.wood3, 2) + R(230, 156, 14, 10, K.wood3, 2);
    const mold = (x, y, r) => `<path d="M${x - r} ${y}q0 ${-r} ${r} ${-r}q${r * 1.2} 0 ${r} ${r * 0.9}q0 ${r * 0.9} ${-r} ${r * 0.9}q${-r} 0 ${-r} ${-r * 0.8}z" fill="#7aa04a" stroke="${K.ink}" stroke-width="2"/>`;
    s += mold(98, 78, 18) + mold(196, 70, 14) + mold(160, 128, 20) + mold(88, 130, 11) + mold(46, 112, 9);
    s += dots([[92, 74], [104, 82], [198, 66], [190, 74], [156, 124], [168, 132], [86, 128]], '#2f5b22', 2.4);
    s += fly(120, 44) + fly(208, 40) + fly(60, 66);
    return s;
  },

  'junk-leaky-cooler': () => {
    let s = shadow(150, 100);
    s += '<ellipse cx="170" cy="164" rx="70" ry="9" fill="#5b9fd0" opacity=".6"/>';
    s += R(66, 84, 168, 76, K.blue, 8) + S('M180 84H234V160H180Z', K.blue2) + R(60, 66, 180, 26, K.white, 7);
    s += S('M190 66H240V92H190Z', K.g1);
    s += R(104, 50, 92, 18, K.g1, 8) + R(114, 56, 72, 6, K.g3, 3);
    s += L('M96 108v36M204 108v36', K.blue2, 4);
    s += L('M150 92L140 110L156 124L144 150', K.ink, 3.5);
    for (const [x, y] of [[108, 164], [146, 160], [190, 166]]) s += D(`M${x} ${y - 14}q8 10 0 14q-8 -4 0 -14z`, '#8cd0ff');
    s += D('M232 112q6 14 -2 20q-8 -6 2 -20z', '#8cd0ff') + D('M222 144q5 12 -2 16q-7 -6 2 -16z', '#8cd0ff');
    return s;
  },

  'junk-broken-crt-tv': () => {
    let s = shadow(150, 105);
    s += L('M130 52L96 14', K.g5, 4) + L('M170 52L206 20L224 30', K.g5, 4) + C(96, 14, 4, K.g3) + C(224, 30, 4, K.g3);
    s += R(56, 50, 188, 112, '#c9b88a', 18) + S('M196 50H244V162H196Z', '#a8986a');
    s += R(72, 64, 118, 84, '#1f2a2a', 16);
    s += S('M84 76L130 72L112 100L86 98Z', 'rgba(255,255,255,.12)');
    s += L('M130 70L118 92L140 104L124 138M118 92L92 96M140 104L172 94M124 138L158 144', '#cfe9e9', 2.5);
    for (let y = 80; y < 140; y += 8) s += L(`M76 ${y}h${30 + ((y * 7) % 40)}`, 'rgba(160,200,200,.35)', 2);
    s += C(220, 78, 11, K.g5) + C(220, 112, 11, K.g5) + L('M220 70v8M214 112h12', K.g2, 2.5);
    s += L('M206 134h28M206 142h28M206 150h28', '#8a7a52', 3);
    s += R(78, 160, 24, 8, K.g5, 2) + R(198, 160, 24, 8, K.g5, 2);
    s += L('M234 40l-6 -10l8 2l-4 -10', K.yellow, 3);
    return s;
  },

  'junk-rusty-bike-frame': () => {
    let s = shadow(150, 120);
    s += `<circle cx="84" cy="124" r="40" fill="none" stroke="${K.ink}" stroke-width="12"/><circle cx="84" cy="124" r="40" fill="none" stroke="${REDBROWN}" stroke-width="6"/>`;
    s += `<circle cx="84" cy="124" r="40" fill="none" stroke="#e8a86a" stroke-width="2" stroke-dasharray="14 22"/>`;
    for (let a = 0; a < 6; a++) {
      const r = (a * Math.PI) / 3;
      s += L(`M84 124L${(84 + 38 * Math.cos(r)).toFixed(1)} ${(124 + 38 * Math.sin(r)).toFixed(1)}`, K.g3, 2);
    }
    s += C(84, 124, 7, K.g3);
    s += L('M84 124L130 78L196 78L150 124Z', REDBROWN, 7) + L('M84 124L130 78L196 78L150 124Z', '#c97b45', 3);
    s += L('M130 78L150 124', REDBROWN, 7) + L('M196 78L226 52', REDBROWN, 7) + L('M214 44L240 56', K.g4, 6);
    s += L('M226 52L244 118', K.g3, 7) + L('M226 52L244 118', K.g2, 3);
    s += R(112, 62, 38, 12, K.g5, 5);
    s += C(150, 124, 10, K.g3) + L('M150 124L170 140M150 124L134 144', K.g4, 5);
    s += dots([[110, 100], [168, 86], [140, 100]], '#7a3216', 3);
    s += L('M244 118l-6 12', K.g3, 3);
    return s;
  },

  'junk-soiled-mattress': () => {
    let s = shadow(150, 110);
    s += G('translate(150 100) scale(1.14) translate(-150 -100) rotate(-9 150 100)', R(52, 66, 196, 74, '#efe6cf', 12) + S('M52 118H248V128Q248 140 236 140H64Q52 140 52 128Z', '#d8ccae')
      + L('M68 78H232M68 128H232', '#d8ccae', 3) + L('M100 82V122M150 82V122M200 82V122', '#d8ccae', 2));
    const stain = (x, y, r, c) => `<path d="M${x - r} ${y}q${r * 0.2} ${-r} ${r} ${-r * 0.9}q${r * 1.1} ${r * 0.2} ${r * 0.9} ${r}q${-r * 0.2} ${r * 0.9} ${-r} ${r * 0.8}q${-r} ${r * 0.1} ${-r * 0.9} ${-r * 0.9}z" fill="${c}"/>`;
    s += stain(110, 100, 20, '#a8792e') + stain(190, 92, 14, '#8a5a1e') + stain(150, 112, 10, '#8a5a1e') + stain(86, 84, 9, '#b88a3a');
    s += L('M230 70q12 -14 4 -26q-10 -4 -14 8q4 8 -6 14', K.g3, 4) + L('M230 70q12 -14 4 -26', K.g1, 1.5);
    s += fly(130, 56) + fly(176, 50) + fly(224, 100);
    return s;
  },

  'junk-expired-paint-cans': () => {
    let s = shadow(150, 118);
    const can = (x, y, w, h, band, tilt = 0) => G(`rotate(${tilt} ${x + w / 2} ${y + h})`,
      R(x, y, w, h, K.g2, 5) + S(`M${x + w * 0.7} ${y}H${x + w}V${y + h}H${x + w * 0.7}Z`, K.g3)
      + R(x - 4, y - 6, w + 8, 12, K.g1, 5) + R(x, y + h * 0.3, w, h * 0.34, band, 0)
      + L(`M${x + 6} ${y + 12}v${h * 0.45}`, '#6b4020', 4) + L(`M${x + w - 12} ${y + 12}v${h * 0.3}`, '#6b4020', 4)
      + `<ellipse cx="${x + 14}" cy="${y + h + 2}" rx="9" ry="3" fill="#6b4020"/>`);
    s += can(64, 98, 64, 62, K.teal) + can(140, 100, 64, 60, K.orange) + can(102, 40, 64, 60, K.pink, -4);
    s += G('rotate(-14 214 96)', R(190, 84, 66, 24, K.paper, 3) + L('M196 96h54', K.red, 0) + `<text x="223" y="101" text-anchor="middle" font-size="15" font-family="Bebas Neue,Impact,sans-serif" fill="${K.red}" letter-spacing="2">EXPIRED</text>`);
    s += D('M204 110q16 4 14 18', 'none');
    return s;
  },

  'junk-cracked-aquarium': () => {
    let s = shadow(150, 112);
    s += R(48, 52, 204, 108, '#cfeff0', 6);
    s += R(54, 94, 192, 60, '#6fc3d8', 2) + S('M54 94H246V102Q200 108 150 100T54 102Z', '#9fdbe8');
    s += R(40, 156, 220, 12, K.g5, 3) + R(40, 44, 220, 12, K.g5, 3);
    s += S('M60 140H240V152H60Z', '#d8c48a');
    s += L('M84 150Q80 124 90 112M96 150Q100 128 94 116', '#2f7a4a', 5);
    s += L('M200 150Q206 126 198 114', '#2f7a4a', 5) + dots([[88, 112], [96, 116], [198, 114]], '#7aa04a', 4);
    s += `<g transform="translate(150 120)">${L('M-24 0Q0 -12 20 0Q0 12 -24 0Z', K.white, 3)}${L('M20 0L34 -10M20 0L34 10', K.white, 3)}${L('M-10 -4v8M-2 -5v10M6 -4v8', K.g1, 2)}${C(-14, -1, 2.4, K.ink)}</g>`;
    s += L('M180 52L168 80L196 98L176 126L188 156M168 80L134 90M196 98L226 88', '#fff', 3.5);
    s += L('M176 126L150 142', '#fff', 2.5);
    s += D('M226 156q4 10 -2 14q-6 -6 2 -14z', '#8cd0ff');
    return s;
  },

  'junk-dead-fridge': () => {
    let s = shadow(150, 70);
    s += R(104, 18, 92, 148, K.g1, 10) + S('M168 18H196V166H168Z', K.g2);
    s += L('M104 74H196', K.g3, 4);
    s += R(176, 36, 6, 28, K.g4, 3) + R(176, 90, 6, 40, K.g4, 3);
    s += P('104,22 62,40 62,160 104,162', K.g2);
    s += P('104,26 70,42 70,156 104,158', '#1f3a2a');
    s += L('M96 44V150', '#4fd08a', 3) + `<ellipse cx="86" cy="120" rx="10" ry="16" fill="#4fd08a" opacity=".6"/>`;
    s += R(124, 34, 38, 22, K.yellow, 2) + L('M130 40l26 10M156 40l-26 10', K.red, 3);
    s += L('M70 20q-10 -10 0 -18q10 -8 0 -16', '#7aa04a', 4) + L('M92 22q-10 -10 0 -16', '#7aa04a', 4);
    s += fly(60, 100) + fly(50, 140);
    s += R(112, 160, 14, 8, K.g5, 2) + R(174, 160, 14, 8, K.g5, 2);
    return s;
  },

  'junk-rat-chewed-wiring': () => {
    let s = shadow(150, 110);
    const wire = (d, c) => L(d, K.ink, 11) + L(d, c, 6);
    s += wire('M40 140C80 90 120 160 160 120S240 90 262 140', K.purple);
    s += wire('M50 100C90 150 130 70 170 110S230 150 258 100', K.blue);
    s += wire('M60 60C100 100 140 40 180 70S226 100 240 60', K.yellow);
    s += L('M258 100l14 -6M258 100l12 8M258 100l10 -14', '#d88a3a', 2.5) + L('M262 140l12 -4M262 140l10 10', '#d88a3a', 2.5);
    s += L('M240 60l12 -8M240 60l14 6', '#d88a3a', 2.5);
    s += L('M146 112l10 -12l-4 14l10 -4', K.yellow, 3);
    s += G('translate(104 96) scale(1.3)',
      E(0, 0, 26, 20, '#9aa2b0') + C(-14, -16, 9, '#9aa2b0') + C(-14, -16, 5, K.pink) + C(14, -16, 9, '#9aa2b0') + C(14, -16, 5, K.pink)
      + C(-9, -2, 5, K.white) + C(-9, -2, 2.4, K.ink) + C(9, -2, 5, K.white) + C(9, -2, 2.4, K.ink)
      + E(0, 7, 6, 4, K.pink) + R(-4, 11, 4, 7, K.white, 1) + R(1, 11, 4, 7, K.white, 1)
      + L('M-14 6L-34 0M-14 10L-34 12M14 6L34 0M14 10L34 12', K.ink, 1.8));
    return s;
  },

  'junk-bucket-of-mystery-goo': () => {
    let s = shadow(150, 82);
    s += L('M96 70Q150 8 204 70', K.g4, 5);
    s += D('M92 70L106 158Q150 170 194 158L208 70Z', K.g3);
    s += S('M170 70H208L194 158Q182 162 170 163Z', K.g4);
    s += L('M96 100H204M100 130H200', K.g2, 3);
    s += D('M86 70Q150 58 214 70Q214 82 200 80Q196 100 186 84Q150 92 112 84Q104 104 100 80Q86 82 86 70Z', '#7fe05a');
    s += S('M100 66Q150 56 200 66Q150 72 100 66Z', '#b6f58f');
    s += D('M104 82q-4 22 4 38q8 -16 2 -36', '#7fe05a') + D('M196 82q6 16 0 36q-8 -14 -2 -34', '#7fe05a');
    s += C(128, 64, 8, K.white) + C(130, 64, 3.4, K.ink) + C(150, 62, 8, K.white) + C(152, 62, 3.4, K.ink);
    s += `<circle cx="176" cy="64" r="6" fill="#b6f58f" stroke="${K.ink}" stroke-width="2"/><circle cx="196" cy="48" r="4" fill="#b6f58f" stroke="${K.ink}" stroke-width="2"/><circle cx="112" cy="46" r="5" fill="#b6f58f" stroke="${K.ink}" stroke-width="2"/>`;
    s += E(110, 164, 22, 5, '#7fe05a');
    return s;
  },

  'junk-barrels-of-mystery-sludge': () => {
    let s = shadow(150, 118);
    const barrel = (cx, top, w, h, body, band) => D(`M${cx - w} ${top}Q${cx - w - 8} ${top + h / 2} ${cx - w} ${top + h}H${cx + w}Q${cx + w + 8} ${top + h / 2} ${cx + w} ${top}Z`, body)
      + S(`M${cx + w * 0.4} ${top}H${cx + w}Q${cx + w + 8} ${top + h / 2} ${cx + w} ${top + h}H${cx + w * 0.4}Z`, 'rgba(0,0,0,.18)')
      + R(cx - w - 4, top + h * 0.18, w * 2 + 8, 8, band, 2) + R(cx - w - 4, top + h * 0.66, w * 2 + 8, 8, band, 2)
      + E(cx, top, w, 9, band);
    s += barrel(104, 66, 44, 92, K.teal2, K.g4);
    s += barrel(200, 78, 40, 82, '#5a8a2a', K.g4);
    s += E(104, 66, 32, 6, '#b06bff') + E(200, 78, 28, 5, '#b06bff');
    s += D('M70 70q-8 34 2 66q6 14 -2 24', '#b06bff') + L('M72 70q-8 34 2 66', '#d9a8ff', 2);
    s += D('M232 82q8 24 0 50q-4 14 4 26', '#b06bff');
    s += E(80, 166, 30, 6, '#b06bff') + E(236, 166, 24, 5, '#b06bff');
    s += `<text x="104" y="128" text-anchor="middle" font-size="44" font-family="Bebas Neue,Impact,sans-serif" fill="${K.yellow}" stroke="${K.ink}" stroke-width="3" paint-order="stroke">?</text>`;
    s += D('M200 100L220 134H180Z', K.yellow) + L('M200 112v10', K.ink, 3.5) + C(200, 128, 1.8, K.ink);
    s += puff(104, 36, 7) + puff(116, 24, 5);
    return s;
  },

  'junk-asbestos-tiles': () => {
    let s = shadow(150, 118);
    const tile = (x, y, c, n) => {
      let t = P(`${x},${y} ${x + 120},${y - 20} ${x + 168},${y + 6} ${x + 48},${y + 26}`, c);
      t += P(`${x},${y} ${x + 48},${y + 26} ${x + 48},${y + 40} ${x},${y + 14}`, '#a89a72');
      t += P(`${x + 48},${y + 26} ${x + 168},${y + 6} ${x + 168},${y + 20} ${x + 48},${y + 40}`, '#8a7c58');
      for (let i = 0; i < n; i++) t += `<circle cx="${x + 30 + i * 22}" cy="${y + 8 - (i % 3) * 3}" r="1.8" fill="#8a7c58"/>`;
      return t;
    };
    s += tile(62, 134, '#d8c892', 6) + tile(62, 112, '#e0d29c', 5) + tile(62, 90, '#d8c892', 6);
    s += L('M96 82l-12 -10M120 76l-6 -14M176 66l10 -12M210 62l12 -8', '#fff', 3);
    s += G('translate(214 40)', D('M0 -34L32 22H-32Z', K.yellow) + L('M0 -14v22', K.ink, 5) + C(0, 15, 3, K.ink));
    s += L('M214 22q-8 -10 0 -16', '#fff', 2.5);
    s += puff(86, 58, 8) + puff(100, 46, 6);
    return s;
  },
};

registerArt(junkArt);
