// Screen effects for reveals. DOM only (not imported by tests). Particles and flashes are fixed-position
// elements appended to <body> so they work on any screen; they remove themselves when done.

const CONFETTI = ['#ff4d5e', '#ffd23f', '#2ee6a6', '#6c8cff', '#ff7ad9', '#ff8a1f'];
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function center(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function flash(color) {
  const f = document.createElement('div');
  f.className = 'fx-flash';
  f.style.background = color;
  document.body.appendChild(f);
  requestAnimationFrame(() => { f.style.opacity = '0'; });
  setTimeout(() => f.remove(), 800);
}

export function shake(el) {
  if (reduced() || !el) return;
  el.classList.add('fx-shake');
  setTimeout(() => el.classList.remove('fx-shake'), 520);
}

function burst(origin, { n, colors, shape, spread, dur }) {
  if (reduced()) return;
  const { x, y } = center(origin);
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.className = `fx-pt ${shape}`;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--x', `${Math.random() * spread * 2 - spread}px`);
    p.style.setProperty('--y', `${Math.random() * spread * 1.4 - spread * 0.7}px`);
    p.style.setProperty('--r', `${Math.random() * 720}deg`);
    p.style.setProperty('--d', `${dur}s`);
    document.body.appendChild(p);
    setTimeout(() => p.remove(), dur * 1000 + 100);
  }
}

/** The per-rarity effect that plays when a card turns face-up. `shakeEl` is what shakes for Havoc. */
export function playReveal(cardEl, tier, shakeEl) {
  switch (tier) {
    case 'junk':
      return burst(cardEl, { n: 10, colors: ['#9a9aa8', '#b9b9c6', '#7d7d8c'], shape: 'puff', spread: 70, dur: 1.1 });
    case 'valuable':
      flash('#ff8a3d');
      return burst(cardEl, { n: 16, colors: ['#ffc83d', '#ffe07a'], shape: 'coin', spread: 200, dur: 1.3 });
    case 'unique':
      flash('#e6b93a');
      return burst(cardEl, { n: 60, colors: CONFETTI, shape: 'rect', spread: 320, dur: 1.8 });
    case 'havoc':
      shake(shakeEl ?? document.body);
      flash('#c0123a');
      return burst(cardEl, { n: 26, colors: ['#8fb83c', '#a6d64b', '#141c18'], shape: 'dot', spread: 200, dur: 1.5 });
    default: // common: a quiet settle, no burst
      return undefined;
  }
}
