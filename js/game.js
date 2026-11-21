// Keşif — game rules: XP, levels, quests, badges, characters, costumes.
// Everything is stored on the phone (localStorage). No server yet.
import { CITIES } from './data.js';
import { STOP_INFO } from './stops-info.js';

export const XP_STAMP = 750;
export const XP_DAILY_LOGIN = 200;
export const XP_PHOTO = 150; // first photo taken at a passport stop

const KEY = 'damga:game';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
let G = Object.assign({ name: '', xp: 0, claims: {}, stamps: {}, fareDay: '', character: 'pusula', id: '', friends: [], saved: [], ratings: {}, photoLog: [], onboarded: false, stopMeta: {} }, load());
if (!G.id) G.id = Math.random().toString(36).slice(2, 10);
// Players from before the welcome screen existed should not see it.
if (!G.onboarded && (G.xp > 0 || G.name)) G.onboarded = true;

// Move stamps from the first version of the app into the game save.
try {
  const old = JSON.parse(localStorage.getItem('damga:stamps') || 'null');
  if (old && !Object.keys(G.stamps).length) { G.stamps = old; G.xp += Object.values(old).reduce((n, c) => n + Object.keys(c).length, 0) * XP_STAMP; }
} catch { /* ignore */ }

export const save = () => { try { localStorage.setItem(KEY, JSON.stringify(G)); } catch { /* ignore */ } };
export const game = () => G;

/* ---------- dates ---------- */
export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }); // YYYY-MM-DD
export function weekKey(d = new Date()) {
  const day = Math.floor((d.getTime() + 3 * 3600e3) / 864e5); // days since epoch, Istanbul time
  return 'w' + Math.floor((day + 3) / 7); // weeks start on Monday
}

/* ---------- levels ---------- */
// Level n → n+1 needs 400 + 100·n XP (level 1 → 2 needs 500).
export function levelInfo(xp = G.xp) {
  let level = 1, left = xp;
  while (left >= 400 + 100 * level) { left -= 400 + 100 * level; level++; }
  return { level, into: left, need: 400 + 100 * level };
}

/* ---------- stamps ---------- */
export const hasStamp = (cityId, id) => !!(G.stamps[cityId] && G.stamps[cityId][id]);
export const stampCount = (cityId) => Object.keys(G.stamps[cityId] || {}).length;
export const totalStamps = () => Object.keys(G.stamps).reduce((n, c) => n + stampCount(c), 0);
function allStampDates() { return Object.values(G.stamps).flatMap((c) => Object.values(c)); }
function stampIds() { return Object.values(G.stamps).flatMap((c) => Object.keys(c)); }

// meta: for stops found live (Wikipedia), remember name and place so the passport can show them later.
export function addStamp(cityId, id, meta) {
  if (hasStamp(cityId, id)) return 0;
  if (meta) G.stopMeta = { ...(G.stopMeta || {}), [id]: meta };
  G.stamps[cityId] = { ...(G.stamps[cityId] || {}), [id]: new Date().toISOString() };
  G.xp += XP_STAMP;
  save();
  return XP_STAMP;
}

export function markFareUsed() { if (G.fareDay !== today()) { G.fareDay = today(); save(); } }
export function setName(n) { G.name = String(n || '').trim().slice(0, 20); save(); }
export function setCharacter(id) { G.character = id; save(); }

/* ---------- quests ---------- */
const catCount = (cat) => stampIds().filter((id) => STOP_INFO[id]?.cat.includes(cat)).length;
const has = (id) => stampIds().includes(id);

// period: daily | weekly | special. key() decides how often it can be claimed again.
export const QUESTS = [
  { id: 'd_login', period: 'daily', xp: XP_DAILY_LOGIN, goal: 1, progress: () => 1 },
  { id: 'd_stamp', period: 'daily', xp: 300, goal: 1, progress: () => allStampDates().filter((d) => d.slice(0, 10) === today()).length },
  { id: 'd_fare', period: 'daily', xp: 100, goal: 1, progress: () => (G.fareDay === today() ? 1 : 0) },
  { id: 'w_five', period: 'weekly', xp: 1000, goal: 5, progress: () => allStampDates().filter((d) => weekKey(new Date(d)) === weekKey()).length },
  { id: 'w_worship', period: 'weekly', xp: 500, goal: 2, progress: () => catCount('worship') },
  { id: 's_ist', period: 'special', xp: 750, goal: 3, progress: () => stampCount('istanbul') },
  { id: 's_ank', period: 'special', xp: 750, goal: 3, progress: () => stampCount('ankara') },
  { id: 's_izm', period: 'special', xp: 750, goal: 3, progress: () => stampCount('izmir') },
  { id: 's_ant', period: 'special', xp: 750, goal: 3, progress: () => stampCount('antalya') },
  { id: 's_kap', period: 'special', xp: 750, goal: 3, progress: () => stampCount('kapadokya') },
  { id: 's_near', period: 'special', xp: 1000, goal: 3, progress: () => stampCount('nearby') },
  { id: 's_market', period: 'special', xp: 500, goal: 2, progress: () => catCount('market') },
  { id: 's_museum', period: 'special', xp: 500, goal: 3, progress: () => catCount('museum') },
  { id: 's_asia', period: 'special', xp: 500, goal: 1, progress: () => (has('kpier') ? 1 : 0) },
  { id: 'd_photo', period: 'daily', xp: 150, goal: 1, progress: () => (G.photoLog || []).filter((p) => p.date === today()).length },
  { id: 's_photo', period: 'special', xp: 500, goal: 3, progress: () => photoStops().length },
  { id: 's_chars', period: 'special', xp: 1000, goal: 5, progress: () => unlockedCharacters().length },
  // Getting around: districts and provinces found from your location
  { id: 'd_area', period: 'daily', xp: 200, goal: 1, progress: () => Object.values(G.provinces || {}).flatMap((p) => Object.values(p.d || {})).filter((d) => String(d).slice(0, 10) === today()).length },
  { id: 'w_areas', period: 'weekly', xp: 600, goal: 3, progress: () => Object.values(G.provinces || {}).flatMap((p) => Object.values(p.d || {})).filter((d) => String(d).length > 9 && weekKey(new Date(d)) === weekKey()).length },
  { id: 's_prov3', period: 'special', xp: 1500, goal: 3, progress: () => Object.keys(G.provinces || {}).length }
];

const claimKey = (q) => q.period === 'daily' ? `${q.id}:${today()}` : q.period === 'weekly' ? `${q.id}:${weekKey()}` : q.id;
export function questState(q) {
  const p = Math.min(q.goal, q.progress());
  const claimed = !!G.claims[claimKey(q)];
  return { p, done: p >= q.goal, claimed };
}
export function claim(q) {
  const s = questState(q);
  if (!s.done || s.claimed) return 0;
  G.claims[claimKey(q)] = new Date().toISOString();
  G.xp += q.xp;
  save();
  return q.xp;
}
export const questsDone = () => Object.keys(G.claims).length;
export const claimable = () => QUESTS.filter((q) => { const s = questState(q); return s.done && !s.claimed; }).length;

/* ---------- badges ---------- */
export const BADGES = [
  { id: 'first', test: () => totalStamps() >= 1 },
  { id: 'ist', test: () => stampCount('istanbul') === CITIES.istanbul.stamps.length },
  { id: 'ank', test: () => stampCount('ankara') === CITIES.ankara.stamps.length },
  { id: 'izm', test: () => stampCount('izmir') === CITIES.izmir.stamps.length },
  { id: 'ant', test: () => stampCount('antalya') === CITIES.antalya.stamps.length },
  { id: 'kap', test: () => stampCount('kapadokya') === CITIES.kapadokya.stamps.length },
  { id: 'near', test: () => stampCount('nearby') >= 5 },
  { id: 'market', test: () => catCount('market') >= 3 },
  { id: 'faith', test: () => catCount('worship') >= 3 },
  { id: 'asia', test: () => has('kpier') },
  // Two places with stamps: any two of the city packs, or a city pack plus a stop found nearby.
  { id: 'two', test: () => Object.keys(G.stamps).filter((c) => stampCount(c) > 0).length >= 2 },
  { id: 'photo', test: () => (G.photoLog || []).length >= 5 },
  { id: 'lvl10', test: () => levelInfo().level >= 10 },
  { id: 'prov5', test: () => Object.keys(G.provinces || {}).length >= 5 },
  { id: 'prov20', test: () => Object.keys(G.provinces || {}).length >= 20 }
];
/* ---------- provinces and districts you have been to (found from your location) ---------- */
export const XP_PROVINCE = 300, XP_DISTRICT = 50;
export const provinces = () => G.provinces || {};
export const districtCount = () => Object.values(G.provinces || {}).reduce((a, p) => a + Object.keys(p.d || {}).length, 0);
// Returns the XP earned: a new province and a new district each count once.
export function visitArea(prov, dist) {
  G.provinces = G.provinces || {};
  let xp = 0;
  if (!G.provinces[prov]) { G.provinces[prov] = { at: new Date().toISOString(), d: {} }; xp += XP_PROVINCE; }
  if (!G.provinces[prov].d[dist]) { G.provinces[prov].d[dist] = new Date().toISOString(); xp += XP_DISTRICT; }
  if (xp) { G.xp += xp; save(); }
  return xp;
}
export const badgeCount = () => BADGES.filter((b) => b.test()).length;

/* ---------- characters and costumes ---------- */
// Colours feed the mascot drawing in mascot.js.
export const CHARACTERS = [
  { id: 'pusula', level: 1, body: '#2b2160', belly: '#efe7ff', accent: '#8b5cf6', gem: '#38bdf8' },
  { id: 'lale', level: 3, body: '#7f1d2d', belly: '#ffe4e6', accent: '#f43f5e', gem: '#fbbf24' },
  { id: 'cini', level: 5, body: '#0c4a6e', belly: '#e0f2fe', accent: '#0ea5e9', gem: '#f8fafc' },
  { id: 'simit', level: 8, body: '#78350f', belly: '#fef3c7', accent: '#f59e0b', gem: '#ef4444' },
  { id: 'marti', level: 12, body: '#e2e8f0', belly: '#ffffff', accent: '#64748b', gem: '#facc15' },
  { id: 'kedi', level: 16, body: '#1f2937', belly: '#f3f4f6', accent: '#a3e635', gem: '#a855f7' }
];
export const unlockedCharacters = () => CHARACTERS.filter((c) => levelInfo().level >= c.level);
export const currentCharacter = () => CHARACTERS.find((c) => c.id === G.character && levelInfo().level >= c.level) || CHARACTERS[0];
export const nextCharacter = () => CHARACTERS.find((c) => levelInfo().level < c.level) || null;

export const COSTUMES = [
  { id: 'scarf', badge: 'first' },
  { id: 'fez', badge: 'ist' },
  { id: 'hat', badge: 'ank' },
  { id: 'cape', badge: 'two' }
];
export const costumeUnlocked = (c) => BADGES.find((b) => b.id === c.badge).test();

/* ---------- friends (no server: players swap codes) ---------- */
// A code is a snapshot of name, XP, stamps and character. Paste a newer code to update a friend.
const b64 = (str) => btoa(String.fromCharCode(...new TextEncoder().encode(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (str) => new TextDecoder().decode(Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

export function myCode(name) {
  return 'KSF-' + b64(JSON.stringify({ i: G.id, n: name, x: G.xp, s: totalStamps(), c: currentCharacter().id, t: today() }));
}

export function addFriendCode(code) {
  try {
    const d = JSON.parse(unb64(String(code).trim().replace(/^KSF-/i, '')));
    if (!d.i || typeof d.x !== 'number' || d.i === G.id) return null;
    const f = { id: String(d.i).slice(0, 12), name: String(d.n || '?').slice(0, 20), xp: Math.max(0, Math.min(d.x, 1e7)), stamps: Math.max(0, d.s | 0), character: String(d.c || 'pusula'), date: String(d.t || '').slice(0, 10) };
    G.friends = [f, ...G.friends.filter((x) => x.id !== f.id)].slice(0, 50);
    save();
    return f;
  } catch { return null; }
}

export function removeFriend(id) { G.friends = G.friends.filter((x) => x.id !== id); save(); }

export function leaderboard(name) {
  const me = { id: G.id, name, xp: G.xp, stamps: totalStamps(), character: currentCharacter().id, me: true };
  return [me, ...G.friends].sort((a, b) => b.xp - a.xp);
}

/* ---------- saved places ---------- */
export const isSaved = (id) => (G.saved || []).includes(id);
export function toggleSaved(id) { G.saved = isSaved(id) ? G.saved.filter((x) => x !== id) : [...(G.saved || []), id]; save(); return isSaved(id); }

/* ---------- your own ratings (no fake averages; a shared score needs a server) ---------- */
export const myRating = (id) => (G.ratings || {})[id] || 0;
export function rate(id, n) { G.ratings = { ...(G.ratings || {}), [id]: Math.max(1, Math.min(5, n | 0)) }; save(); }

/* ---------- photos (the pictures themselves live in album.js) ---------- */
const photoStops = () => [...new Set((G.photoLog || []).map((p) => p.stop).filter(Boolean))];
// Log a photo; returns XP earned (only the first photo at each stop pays).
export function logPhoto(stop) {
  const first = stop && !photoStops().includes(stop);
  G.photoLog = [...(G.photoLog || []), { stop: stop || '', date: today() }];
  if (first) G.xp += XP_PHOTO;
  save();
  return first ? XP_PHOTO : 0;
}

export function setOnboarded() { G.onboarded = true; save(); }

export const stopMeta = () => G.stopMeta || {};
