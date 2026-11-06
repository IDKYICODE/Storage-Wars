// Storage unit scenes (polaroid photos on the unit cards). viewBox 0 0 300 190.
import { K, R, E, C, P, D, L, S, G } from './kit.js';
import { registerArt } from '../ui/card.js';

const sky = (c = '#8fd3ff') => `<rect width="300" height="190" fill="${c}"/>`;
const cloud = (x, y, k = 1) => G(`translate(${x} ${y}) scale(${k})`, '<ellipse cx="0" cy="0" rx="34" ry="12" fill="#fff"/><ellipse cx="26" cy="-6" rx="22" ry="10" fill="#fff"/>');
const asphalt = (y = 146) => R(-4, y, 308, 190 - y + 4, '#a9afc2') + L(`M0 ${y + 22}H300`, '#8a90a8', 2) ;
const rollDoor = (x, y, w, h, c1 = '#9aa2b0', c2 = '#757d8d') => R(x, y, w, h, c1) + Array.from({ length: Math.floor(h / 7) }, (_, i) => L(`M${x} ${y + 7 + i * 7}H${x + w}`, c2, 2)).join('') + R(x + w / 2 - 6, y + h - 8, 12, 5, K.g4, 2);
const crate = (x, y, w, h) => R(x, y, w, h, K.wood) + L(`M${x} ${y + h * 0.3}H${x + w}`, K.wood2, 2.4);

export const unitArt = {
  // a single metal locker inside a grey storage room
  'unit-locker': () => {
    let s = '<rect width="300" height="190" fill="#9aa3ad"/>';
    s += P('0,0 300,0 300,52 0,52', '#b8c0c8') + P('0,52 300,52 300,190 0,190', '#7e8792');
    s += P('0,52 70,40 70,150 0,190', '#8a939e') + P('300,52 230,40 230,150 300,190', '#6f7883');
    s += L('M70 40H230M70 150H230', '#5d6671', 2.5);
    s += R(104, 36, 92, 118, '#6a7482', 3) + S('M104 36H196V154H104Z', 'rgba(255,255,255,.05)');
    s += R(112, 44, 36, 104, '#8693a3', 2) + R(152, 44, 36, 104, '#7a8696', 2);
    for (const x of [118, 158]) for (let y = 52; y < 74; y += 6) s += L(`M${x} ${y}h24`, '#4a5361', 2.4);
    s += R(142, 94, 5, 20, K.g1, 2) + R(153, 94, 5, 20, K.g1, 2) + C(150, 120, 3, K.yellow);
    s += S('M0 150H300V190H0Z', 'rgba(0,0,0,.18)') + S('M200 60L296 100V170L200 150Z', 'rgba(255,255,255,.06)');
    s += E(150, 160, 70, 8, 'rgba(0,0,0,.3)') + R(30, 150, 26, 22, K.wood, 2) + R(246, 156, 22, 18, K.wood, 2);
    return s;
  },

  // small yellow roll-up unit, door halfway open
  'unit-small': () => {
    let s = sky('#bfe6f5') + cloud(60, 36) + cloud(230, 52, 0.8);
    s += P('0,120 300,100 300,190 0,190', '#6fae5a');
    s += R(-4, 150, 308, 44, '#a9afc2') + L('M0 172H300', '#8a90a8', 2);
    s += R(60, 44, 180, 112, '#e8dfc4') + R(52, 36, 196, 14, '#b89a5a', 2);
    s += R(80, 66, 140, 90, '#2b1f16');
    s += crate(96, 118, 40, 38) + crate(142, 128, 36, 28) + R(184, 100, 22, 56, K.blue, 3);
    s += rollDoor(78, 62, 144, 46, '#f2c230', '#c9971a') + R(72, 56, 156, 8, K.g3, 2);
    s += L('M150 62V108', '#c9971a', 2) + R(144, 104, 12, 6, K.g4, 2);
    s += R(236, 128, 14, 28, K.g4, 3) + C(243, 124, 6, '#2ee6a6');
    s += E(150, 160, 100, 6, 'rgba(0,0,0,.22)');
    return s;
  },

  // a long corridor of blue doors
  'unit-medium': () => {
    let s = sky('#cfe9f5');
    s += P('0,0 300,0 300,46 150,70 0,46', '#7a8696') + L('M0 46L150 70L300 46', K.ink, 2);
    s += P('0,46 150,70 150,150 0,190', '#e8e2cc') + P('300,46 150,70 150,150 300,190', '#d8d2b8');
    s += P('0,190 150,150 300,190', '#a9afc2');
    const door = (x, y, w, h, c) => R(x, y, w, h, c) + R(x + w * 0.15, y + h * 0.12, w * 0.7, h * 0.2, K.g1, 1);
    s += door(14, 66, 34, 86, '#3a9bd0') + door(58, 74, 28, 66, '#3a9bd0') + door(96, 82, 20, 48, '#3a9bd0');
    s += door(252, 66, 34, 86, '#3a9bd0') + door(214, 74, 28, 66, '#3a9bd0') + door(184, 82, 20, 48, '#3a9bd0');
    s += R(20, 100, 22, 52, '#2b1f16') + R(256, 100, 22, 52, '#2b1f16') + G('translate(228 128)', R(-8, -14, 16, 14, K.wood2, 2) + L('M-8 0v16M8 0v16M-8 -14v-16M8 -14v-16', K.wood2, 3));
    s += P('138,82 162,82 162,126 138,126', '#2b1f16') + E(150, 160, 40, 6, 'rgba(0,0,0,.2)');
    s += G('translate(52 150)', C(-12, 0, 11, 'none') + `<circle cx="-12" cy="0" r="11" fill="none" stroke="${K.ink}" stroke-width="4"/><circle cx="12" cy="0" r="11" fill="none" stroke="${K.ink}" stroke-width="4"/>` + L('M-12 0L0 -14L12 0M0 -14L-4 -20H4', K.red, 3));
    return s;
  },

  // large red-door complex with a light and a bin
  'unit-large': () => {
    let s = sky('#9bd8f2') + cloud(50, 34, 0.9) + cloud(250, 46);
    s += R(0, 70, 300, 90, '#e0b684') + R(0, 62, 300, 12, '#9a6a3a', 2);
    s += R(18, 90, 124, 70, '#c8402f') + R(158, 90, 124, 70, '#c8402f');
    for (const [x, w] of [[18, 124], [158, 124]]) for (let y = 98; y < 156; y += 8) s += L(`M${x} ${y}H${x + w}`, '#a52f22', 2.4);
    s += R(66, 150, 30, 8, K.g4, 2) + R(206, 150, 30, 8, K.g4, 2);
    s += G('translate(150 40)', L('M0 26V0', K.g4, 4) + R(-12, -8, 24, 10, K.g3, 3) + C(0, 4, 5, K.yellow) + `<polygon points="-4,2 4,2 24,22 -24,22" fill="rgba(255,240,150,.4)"/>`);
    s += R(0, 156, 300, 34, '#a9afc2') + L('M0 172H300', '#8a90a8', 2);
    s += R(254, 128, 30, 34, K.green2, 3) + R(250, 122, 38, 8, '#256a44', 3);
    s += R(8, 134, 8, 24, K.yellow, 2) + R(284, 134, 8, 24, K.yellow, 2);
    s += `<text x="80" y="82" text-anchor="middle" font-size="20" font-family="Bebas Neue,Impact,sans-serif" fill="${K.ink}" letter-spacing="2">A-12</text><text x="220" y="82" text-anchor="middle" font-size="20" font-family="Bebas Neue,Impact,sans-serif" fill="${K.ink}" letter-spacing="2">A-13</text>`;
    return s;
  },

  // jumbo warehouse with a pole and power line
  'unit-jumbo': () => {
    let s = sky() + cloud(70, 40) + cloud(96, 34, 0.65) + cloud(238, 52, 0.9);
    s += '<path d="M0 118Q60 84 120 112T300 100V190H0Z" fill="#6fae5a" stroke="#1d1a2b" stroke-width="2.5"/>';
    s += R(-4, 146, 308, 48, '#a9afc2') + L('M0 168H300', '#8a90a8', 2, ) + `<path d="M0 168H300" stroke="#8a90a8" stroke-width="2" stroke-dasharray="14 10" fill="none"/>`;
    s += R(30, 20, 7, 130, '#6b4a2b', 1) + L('M14 36H54M18 48H50', '#6b4a2b', 5) + L('M0 40Q150 70 300 36', K.ink, 1.8);
    s += R(76, 82, 170, 68, '#c9a06a') + R(132, 70, 116, 80, '#c8402f') + P('126,70 254,70 246,60 134,60', '#a82f22');
    s += R(148, 94, 88, 56, '#9aa2b0');
    for (let y = 100; y < 150; y += 7) s += L(`M148 ${y}H236`, '#757d8d', 2);
    s += R(90, 100, 22, 50, '#7a8696') + C(108, 126, 2, K.yellow) + R(136, 124, 7, 26, K.yellow, 1) + R(241, 124, 7, 26, K.yellow, 1) + C(132, 84, 5, '#2ee6a6');
    s += R(262, 128, 26, 22, K.green2, 3);
    return s;
  },
};

registerArt(unitArt);
