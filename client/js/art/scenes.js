// Backgrounds in the owner's reference style: a flat, daytime storage facility. Corrugated light-blue metal wall,
// navy roof band, mauve door frames, navy roll-up doors, cream concrete and grass. Thin dark outlines.
// Both scenes use viewBox -800 0 2600 700 (xMidYMid slice) so any screen shape shows wall, and the centre
// door (x 325..675) is always in view.
import { K, R, E, C, P, D, L, S } from './kit.js';

const PAL = {
  wall: '#b4d3e0', ribDark: '#9dbccb', ribLight: '#cfe4ec', sky: '#9cc8dd', roof: '#324f8c', roofHi: '#4a68a8',
  frame: '#8d5a6b', frameDark: '#6e4553', door: '#26335a', doorDark: '#161e3a', concrete: '#eadcae', concrete2: '#dccb97',
  grass: '#6b8a4a', grass2: '#8aa860', lamp: '#f6ecb8', plate: '#f4e9c4',
};
export { PAL };

const rng = (seed) => { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };

/** Sky strip, roof band, corrugated wall, concrete and the wall lamp. Everything behind the doors. */
function backdrop() {
  const r = rng(3);
  // sky continues above the roof so tall (phone) screens see the whole front of the building
  let s = `<rect x="-800" y="-300" width="2600" height="376" fill="${PAL.sky}"/>`;
  s += '<ellipse cx="60" cy="14" rx="70" ry="16" fill="#fff"/><ellipse cx="120" cy="12" rx="44" ry="12" fill="#fff"/><ellipse cx="980" cy="20" rx="80" ry="15" fill="#fff"/><ellipse cx="-420" cy="10" rx="90" ry="14" fill="#fff"/>';
  s += '<ellipse cx="420" cy="-120" rx="110" ry="26" fill="#fff"/><ellipse cx="500" cy="-132" rx="64" ry="20" fill="#fff"/><ellipse cx="-60" cy="-210" rx="90" ry="22" fill="#fff"/><ellipse cx="850" cy="-200" rx="100" ry="24" fill="#fff"/><ellipse cx="780" cy="-212" rx="60" ry="18" fill="#fff"/>';
  s += `<rect x="-800" y="36" width="2600" height="40" fill="${PAL.roof}"/><rect x="-800" y="36" width="2600" height="8" fill="${PAL.roofHi}"/><path d="M-800 76H1800" stroke="${K.ink}" stroke-width="3"/>`;
  s += `<rect x="-800" y="76" width="2600" height="490" fill="${PAL.wall}"/>`;
  for (let x = -800; x < 1800; x += 22) s += `<rect x="${x}" y="76" width="8" height="490" fill="${PAL.ribDark}"/><rect x="${x + 11}" y="76" width="3" height="490" fill="${PAL.ribLight}"/>`;
  for (let i = 0; i < 46; i++) { // faint scratches and rivets so the wall is not a flat pattern
    const x = -780 + r() * 2560; const y = 100 + r() * 420; const len = 8 + r() * 22;
    s += `<path d="M${x.toFixed(0)} ${y.toFixed(0)}l${(len * 0.4).toFixed(0)} ${len.toFixed(0)}" stroke="rgba(29,26,43,.28)" stroke-width="2" stroke-linecap="round"/>`;
  }
  s += '<path d="M-800 76H1800V110H-800Z" fill="rgba(0,0,0,.08)"/>';
  // wall lamp (top right of the centre door)
  s += R(735, 112, 54, 36, PAL.lamp, 3) + R(727, 144, 70, 11, PAL.frame, 3) + '<polygon points="735,155 789,155 840,330 684,330" fill="rgba(255,244,170,.16)"/>';
  // ground
  s += `<rect x="-800" y="560" width="2600" height="80" fill="${PAL.concrete}"/><rect x="-800" y="640" width="2600" height="60" fill="${PAL.concrete2}"/>`;
  s += `<path d="M-800 560H1800M-800 640H1800" stroke="${K.ink}" stroke-width="3"/>`;
  for (let i = 0; i < 18; i++) s += `<path d="M${(-760 + i * 150 + (i % 3) * 20)} ${650 + (i % 4) * 12}h${30 + (i % 3) * 14}" stroke="rgba(29,26,43,.18)" stroke-width="3" stroke-linecap="round"/>`;
  return s;
}

const tuft = (x, w = 90) => {
  let s = '';
  for (let i = 0; i < 9; i++) {
    const bx = x + (i / 8) * w; const h = 26 + ((i * 7) % 5) * 7;
    s += `<path d="M${bx.toFixed(0)} 562q${(i % 2 ? 6 : -6)} ${-h / 2} ${(i % 2 ? 12 : -10)} ${-h}q-2 ${h / 2} ${(i % 2 ? 6 : 4)} ${h}z" fill="${i % 2 ? PAL.grass : PAL.grass2}" stroke="${K.ink}" stroke-width="2" stroke-linejoin="round"/>`;
  }
  return s;
};

/** A mauve frame around an opening of 350 x 372 centred on cx; returns frame (above) and opening geometry. */
function frame(cx) {
  return R(cx - 210, 150, 420, 38, PAL.frame, 3) + R(cx - 16, 158, 32, 22, PAL.plate, 2) + C(cx - 190, 169, 4, PAL.frameDark) + C(cx + 190, 169, 4, PAL.frameDark)
    + R(cx - 210, 188, 35, 372, PAL.frame, 3) + R(cx + 175, 188, 35, 372, PAL.frame, 3)
    + `<path d="M${cx - 210} 190H${cx + 210}" stroke="rgba(0,0,0,.18)" stroke-width="10"/>`;
}

/** Closed navy roll-up door panel for an opening centred on cx (drawn in its own group so it can roll). */
function doorPanel(cx) {
  let s = R(cx - 175, 188, 350, 372, PAL.door);
  for (let y = 202; y < 556; y += 14) s += `<path d="M${cx - 175} ${y}H${cx + 175}" stroke="${PAL.doorDark}" stroke-width="3"/>`;
  s += R(cx - 20, 540, 40, 9, '#4a5880', 2);
  s += R(cx - 168, 508, 34, 20, '#b9bec8', 3) + R(cx - 161, 520, 15, 17, '#d8a93a', 3) + `<path d="M${cx - 158} 520v-7q0-7 7-7t7 7v7" fill="none" stroke="#9aa2b0" stroke-width="3"/>`;
  return s;
}

/** The dark inside of an open doorway: warm light and a few crates. */
function interior(cx) {
  const crate = (x, y, w, h) => R(x, y, w, h, '#3a2418', 3) + L(`M${x} ${y + h * 0.3}H${x + w}`, '#6b4020', 3);
  const id = `inside${cx + 800}`; // clip so the warm glow never spills past the doorway
  return `<clipPath id="${id}"><rect x="${cx - 175}" y="188" width="350" height="372"/></clipPath>`
    + `<g clip-path="url(#${id})">${R(cx - 175, 188, 350, 372, '#150c2a')}<ellipse cx="${cx}" cy="540" rx="190" ry="130" fill="#ffb34d" opacity=".28"/>`
    + `${crate(cx - 150, 480, 80, 80)}${crate(cx + 40, 450, 110, 110)}${crate(cx - 50, 520, 66, 40)}</g>`;
}

const svgWrap = (cls, inner, attrs = '') => `<svg class="sc ${cls}" viewBox="-800 -300 2600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true"${attrs}>${inner}</svg>`;

/**
 * The title screen: the storage unit front with its door closed (or open). The door carries the title and the
 * ENTER button, so it rolls up as one piece. Everything on the door is SVG so it scales with the scene.
 */
export function renderStorageFront({ open = false } = {}) {
  const cx = 500;
  const title = `<rect x="${cx - 128}" y="236" width="256" height="128" fill="none" stroke="#fff" stroke-width="8"/>`
    + `<text x="${cx}" y="302" text-anchor="middle" font-size="64" font-family="Bebas Neue,Impact,sans-serif" fill="#fff" letter-spacing="4">STORAGE</text>`
    + `<text x="${cx}" y="356" text-anchor="middle" font-size="68" font-family="Bebas Neue,Impact,sans-serif" fill="#fff" letter-spacing="8">WARS</text>`
    + `<text x="${cx}" y="400" text-anchor="middle" font-size="19" font-family="Josefin Sans,sans-serif" font-weight="700" fill="#9fb4e0" letter-spacing="5">BID. BLUFF. BANK IT.</text>`;
  const button = `<g class="enter-g" data-act="enter" role="button" tabindex="0" aria-label="Enter"><rect x="${cx - 86}" y="440" width="180" height="62" rx="14" fill="${K.ink}"/>`
    + `<rect x="${cx - 90}" y="434" width="180" height="62" rx="14" fill="#2ee6a6" stroke="${K.ink}" stroke-width="5"/>`
    + `<text x="${cx - 12}" y="480" text-anchor="middle" font-size="44" font-family="Bebas Neue,Impact,sans-serif" fill="${K.ink}" letter-spacing="3">ENTER</text>`
    + `<path d="M${cx + 38} 452l16 13l-16 13M${cx + 54} 452l16 13l-16 13" fill="none" stroke="${K.ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/></g>`;
  const inner = `${backdrop()}${tuft(190, 100)}${tuft(740, 110)}${interior(cx)}`
    + `<defs><clipPath id="doorclip"><rect x="${cx - 175}" y="188" width="350" height="372"/></clipPath></defs>`
    + `<g clip-path="url(#doorclip)"><g class="door-g${open ? ' open' : ''}">${doorPanel(cx)}${title}${button}</g></g>`
    + `${frame(cx)}`
    // bollard in front of the wall, left of the door
    + `${R(196, 430, 26, 160, '#3a5f9a', 5)}${R(190, 420, 38, 18, '#4a73b8', 5)}<rect x="196" y="430" width="8" height="160" fill="rgba(255,255,255,.25)"/>`
    + `<ellipse cx="209" cy="592" rx="36" ry="7" fill="rgba(0,0,0,.2)"/>`;
  return `<div class="scene front">${svgWrap('sc-front', inner)}</div>`;
}

/** Plain wall with three closed doors, used behind the lobby, the table and the end screen. */
export function renderHallScene() {
  let inner = backdrop();
  for (const cx of [-120, 500, 1120]) {
    inner += interior(cx) + `<g>${doorPanel(cx)}</g>${frame(cx)}`;
  }
  inner += tuft(-340, 100) + tuft(190, 100) + tuft(740, 110) + tuft(1370, 100);
  // number plates on the wall between the doors
  for (const [x, n] of [[190, 'A-1'], [810, 'A-2'], [1430, 'A-3']]) {
    inner += R(x - 36, 250, 72, 40, PAL.plate, 3) + `<text x="${x}" y="280" text-anchor="middle" font-size="30" font-family="Bebas Neue,Impact,sans-serif" fill="${K.ink}" letter-spacing="2">${n}</text>`;
  }
  return `<div class="scene hall">${svgWrap('sc-hall', inner)}</div>`;
}
