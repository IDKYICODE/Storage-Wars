// Helpers shared by card rendering and the illustrations. Pure functions, no DOM.

/** The ink colour used for every outline. */
export const INK = '#1d1a2b';

/** 9000 -> "$9,000", -100 -> "-$100". */
export function formatMoney(n) {
  const abs = Math.abs(n).toLocaleString('en-US');
  return `${n < 0 ? '-' : ''}$${abs}`;
}

/** Escapes text for safe use inside HTML (names, flavor lines, player names). */
export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---- drawing primitives for the illustrations (all return SVG markup; outlines come from class "ink") ----

/** Palette shared by all illustrations so the deck looks like one set. */
export const K = {
  ink: INK, white: '#ffffff', paper: '#fffaf0',
  g1: '#d9dde4', g2: '#b4bbc7', g3: '#8a93a3', g4: '#5a6273', g5: '#363b4a',
  red: '#d8403f', red2: '#a82f22', pink: '#ff7ad9', orange: '#ff8a1f', yellow: '#ffd23f', gold: '#e6b93a', gold2: '#b8861a',
  green: '#4fd08a', green2: '#2f9a5f', lime: '#a6d64b', teal: '#19b8b8', teal2: '#0d8a8a', blue: '#4aa3d8', blue2: '#2f6fa0',
  purple: '#8f4dff', purple2: '#5d2fb0', wood: '#d8a05a', wood2: '#a8693a', wood3: '#6b4020', cream: '#f4e3b3', skin: '#f2c9a0',
};

const f = (n) => (Number.isInteger(n) ? n : Math.round(n * 10) / 10);
/** rect */ export const R = (x, y, w, h, fill, r = 0) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${r}" fill="${fill}" class="ink"/>`;
/** ellipse */ export const E = (cx, cy, rx, ry, fill) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" class="ink"/>`;
/** circle */ export const C = (cx, cy, r, fill) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" class="ink"/>`;
/** polygon, points as "x,y x,y ..." */ export const P = (pts, fill) => `<polygon points="${pts}" fill="${fill}" class="ink"/>`;
/** closed or open path with fill and outline */ export const D = (d, fill = 'none') => `<path d="${d}" fill="${fill}" class="ink"/>`;
/** stroke-only line/curve without the heavy outline (details, cracks, stripes) */
export const L = (d, color = INK, w = 3) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
/** fill-only shape without outline (cel shading and highlights) */ export const S = (d, fill) => `<path d="${d}" fill="${fill}"/>`;
/** group with a transform */ export const G = (transform, inner) => `<g transform="${transform}">${inner}</g>`;
/** ground shadow */ export const shadow = (cx = 150, rx = 100, cy = 168, ry = 9) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="rgba(0,0,0,.25)"/>`;

/** Soft ground shadow ellipse that sits under an object in a 300x180 illustration. */
export function groundShadow(cx = 150, cy = 168, rx = 100, ry = 9) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="rgba(0,0,0,.25)"/>`;
}
