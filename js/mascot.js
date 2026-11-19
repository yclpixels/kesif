// Keşif mascots: small round explorers, each with its own Istanbul/Ankara twist.
// Placeholder art drawn in SVG so it scales and recolours; swap for illustrated art later.
const EARS = {
  pointy: (b, a) => `<path d="M28 44 L22 6 L50 30 Z" fill="${b}"/><path d="M92 44 L98 6 L70 30 Z" fill="${b}"/><path d="M30 38 L27 16 L44 30 Z" fill="${a}"/><path d="M90 38 L93 16 L76 30 Z" fill="${a}"/>`,
  round: (b, a) => `<circle cx="32" cy="30" r="14" fill="${b}"/><circle cx="88" cy="30" r="14" fill="${b}"/><circle cx="32" cy="30" r="7" fill="${a}"/><circle cx="88" cy="30" r="7" fill="${a}"/>`,
  tuft: (b) => `<path d="M52 30 q4 -18 10 -2 q4 -14 8 2" fill="${b}"/>`,
  cat: (b, a) => `<path d="M26 46 L28 12 L52 30 Z" fill="${b}"/><path d="M94 46 L92 12 L68 30 Z" fill="${b}"/><path d="M31 38 L32 20 L45 31 Z" fill="${a}"/><path d="M89 38 L88 20 L75 31 Z" fill="${a}"/>`
};

// What makes each character itself. Drawn on top of the shared body.
const TRAITS = {
  pusula: { ears: 'pointy', head: (a) => `<path d="M60 30 l5 12 l-5 6 l-5 -6 Z" fill="${a}"/>` },
  lale: {
    ears: 'round',
    head: () => `<path d="M60 8 q-12 4 -10 18 q10 4 10 -6 q0 10 10 6 q2 -14 -10 -18 Z" fill="#f43f5e"/><path d="M60 8 q-4 8 0 14 q4 -6 0 -14 Z" fill="#fb7185"/><path d="M60 24 v6" stroke="#16a34a" stroke-width="3"/>`
  },
  cini: {
    ears: 'pointy',
    head: () => `<circle cx="60" cy="36" r="5" fill="#f8fafc"/><circle cx="60" cy="36" r="2.5" fill="#0ea5e9"/>`,
    belly: () => `<g fill="none" stroke="#0369a1" stroke-width="1.6"><path d="M60 102 l6 8 l-6 8 l-6 -8 Z"/><circle cx="60" cy="110" r="2.2" fill="#0369a1"/><path d="M50 106 q-3 4 0 8M70 106 q3 4 0 8"/></g>`
  },
  simit: {
    ears: 'round',
    scarf: () => `<ellipse cx="60" cy="92" rx="27" ry="10" fill="none" stroke="#b45309" stroke-width="9"/><g fill="#fef3c7">${[34, 42, 50, 58, 66, 74, 82].map((x, i) => `<ellipse cx="${x}" cy="${i % 2 ? 99 : 85}" rx="1.6" ry="1" />`).join('')}</g>`
  },
  marti: {
    ears: 'tuft',
    mouth: () => `<path d="M52 68 L68 68 L60 78 Z" fill="#f59e0b"/><path d="M52 68 L68 68" stroke="#b45309" stroke-width="1.5"/>`,
    head: () => `<path d="M30 70 q-10 6 -6 20 q8 -8 12 -16Z M90 70 q10 6 6 20 q-8 -8 -12 -16Z" fill="#cbd5e1"/>`
  },
  kedi: {
    ears: 'cat',
    head: (a) => `<path d="M52 32 l2 10 M60 30 v12 M68 32 l-2 10" stroke="${a}" stroke-width="3" stroke-linecap="round"/>`,
    mouth: () => `<path d="M55 70 q5 4 10 0" fill="none" stroke="#1e1b4b" stroke-width="2" stroke-linecap="round"/><path d="M30 66 h14 M30 72 l14 -3 M90 66 h-14 M90 72 l-14 -3" stroke="#f3f4f6" stroke-width="1.5" stroke-linecap="round"/>`
  }
};

// 3D art from assets/3d/ (listed in its manifest.json) replaces the SVG drawing when it exists.
let ART = {};
const SAFE = /^[a-z0-9-]+\.(png|webp|glb)$/;
export function setArt(m) { ART = (m && m.characters) || {}; }
export const hasArt = () => Object.keys(ART).length > 0;
export const artModel = (id) => (ART[id] && SAFE.test(ART[id].glb || '') ? 'assets/3d/' + ART[id].glb : '');
export const artImage = (id, costume = '') => {
  const a = ART[id]; if (!a) return '';
  const f = costume ? (a.costumes || {})[costume] : a.png;
  return f && SAFE.test(f) ? 'assets/3d/' + f : '';
};

export function mascot(c, { size = 120, locked = false, costume = '' } = {}) {
  const img = artImage(c.id, costume);
  if (img) return `<img class="mascot-img${locked ? ' locked' : ''}" src="${img}" width="${size}" height="${size}" alt="" draggable="false" loading="lazy">`;
  const body = locked ? '#3b3561' : c.body;
  const belly = locked ? '#4a4378' : c.belly;
  const accent = locked ? '#4a4378' : c.accent;
  const gem = locked ? '#5b5391' : c.gem;
  const tr = TRAITS[c.id] || TRAITS.pusula;
  const eyes = locked ? '' : `
    <ellipse cx="48" cy="58" rx="7" ry="9" fill="#fff"/><ellipse cx="72" cy="58" rx="7" ry="9" fill="#fff"/>
    <circle cx="49" cy="60" r="4.5" fill="#1e1b4b"/><circle cx="71" cy="60" r="4.5" fill="#1e1b4b"/>
    <circle cx="50.5" cy="58" r="1.6" fill="#fff"/><circle cx="72.5" cy="58" r="1.6" fill="#fff"/>
    ${tr.mouth ? tr.mouth() : '<path d="M55 70 q5 4 10 0" fill="none" stroke="#1e1b4b" stroke-width="2" stroke-linecap="round"/>'}`;
  const hat = {
    fez: `<path d="M48 22 L72 22 L70 6 L50 6 Z" fill="#dc2626"/><path d="M60 6 q8 -2 10 8" fill="none" stroke="#111" stroke-width="2"/>`,
    hat: `<ellipse cx="60" cy="24" rx="30" ry="6" fill="#92400e"/><path d="M44 24 q16 -26 32 0 Z" fill="#b45309"/>`
  }[costume] || '';
  const cape = costume === 'cape' ? `<path d="M34 90 L22 128 L98 128 L86 90 Z" fill="${accent}" opacity=".7"/>` : '';
  const scarf = tr.scarf && !locked ? tr.scarf()
    : `<path d="M34 86 Q60 100 86 86 L84 94 Q60 106 36 94 Z" fill="${accent}"/><circle cx="60" cy="97" r="7" fill="${gem}" stroke="#fff" stroke-width="2"/>`;
  return `<svg viewBox="0 0 120 130" width="${size}" height="${Math.round(size * 130 / 120)}" aria-hidden="true">
    ${cape}
    ${EARS[tr.ears](body, accent)}
    <ellipse cx="60" cy="108" rx="26" ry="20" fill="${body}"/>
    <ellipse cx="60" cy="112" rx="15" ry="13" fill="${belly}"/>
    ${tr.belly && !locked ? tr.belly() : ''}
    <ellipse cx="60" cy="58" rx="36" ry="32" fill="${body}"/>
    <path d="M36 66 Q60 96 84 66 Q72 76 60 76 Q48 76 36 66 Z" fill="${belly}"/>
    ${tr.head && !locked ? tr.head(accent) : ''}
    ${eyes}
    ${scarf}
    ${costume === 'scarf' && !locked ? `<path d="M80 92 l8 18 l-8 -2 Z" fill="${accent}"/>` : ''}
    ${hat}
    ${locked ? '<rect x="48" y="50" width="24" height="20" rx="4" fill="#2a2450"/><path d="M53 50 v-6 a7 7 0 0 1 14 0 v6" fill="none" stroke="#2a2450" stroke-width="4"/>' : ''}
  </svg>`;
}
