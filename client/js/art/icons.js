// 40x40 tier medallion icons (drawn inside a tier-coloured circle on each card).

const ICONS = {
  junk: '<rect x="12" y="14" width="16" height="18" rx="2" fill="#7a8696" class="ink2"/><rect x="9" y="10" width="22" height="5" rx="2" fill="#aab4c2" class="ink2"/><rect x="16" y="6" width="8" height="5" rx="1.5" fill="#aab4c2" class="ink2"/><path d="M17 18v11M23 18v11" stroke="#1d1a2b" stroke-width="2"/>',
  common: '<path d="M8 15l12-6 12 6v14l-12 6-12-6z" fill="#d8a05a" class="ink2"/><path d="M8 15l12 6 12-6M20 21v14" stroke="#1d1a2b" stroke-width="2" fill="none"/><path d="M14 12l12 6" stroke="#efe3b8" stroke-width="3"/>',
  valuable: '<circle cx="20" cy="20" r="12" fill="#ffc83d" class="ink2"/><circle cx="20" cy="20" r="7.5" fill="none" stroke="#c98a12" stroke-width="2"/><path d="M20 14v12M23 16.5c-1-1.5-6-1.5-6 1.2 0 3 6 1.5 6 4.5 0 2.5-5 2.5-6 .8" stroke="#8a5a0a" stroke-width="2" fill="none" stroke-linecap="round"/>',
  unique: '<polygon points="20,8 31,15 27,29 13,29 9,15" fill="#6fe0ff" class="ink2"/><path d="M9 15H31M20 8l-4 7 4 14 4-14-4-7" stroke="#1d1a2b" stroke-width="1.8" fill="none" stroke-linejoin="round"/><polygon points="20,8 16,15 24,15" fill="#d6f7ff"/>',
  havoc: '<path d="M11 24a6 6 0 0 1 1-12 8 8 0 0 1 15 2 5 5 0 0 1 0 10z" fill="#c8ced8" class="ink2"/><path d="M21 22l-4 7h4l-2 6 7-9h-4l3-4z" fill="#ffd23f" class="ink2"/>',
};

export const getIcon = (tier) => `<svg viewBox="0 0 40 40" class="ic">${ICONS[tier] ?? ''}</svg>`;
