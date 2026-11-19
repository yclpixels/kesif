import { CITIES, NEARBY, EVENTS, CHECKED, CHECKIN_RADIUS } from './data.js';
import { STOP_INFO } from './stops-info.js';
import { fetchWeather, fetchPrayer, fetchPlaces, fetchGrid, fetchPlacesLive, fetchWikiStops, distanceM, getPosition } from './api.js';
import { t, LANGS, pickLang, weatherText, PHRASES_TR } from './i18n.js';
import * as G from './game.js';
import { mascot, setArt, hasArt, artModel, artImage } from './mascot.js';
import { PHOTOS } from './photos.js';
import * as A from './album.js';
import { ICON } from './icons.js';
import { PHRASE_GROUPS, LANG_WORD } from './phrases.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem('damga:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('damga:' + k, JSON.stringify(v)); } catch { /* ignore */ } }
};

const state = {
  lang: pickLang(),
  city: store.get('city', 'istanbul'),
  place: store.get('place', null), // a province or district picked from the list: { n, p, lat, lon }
  tab: 'map',           // map | quests | collection | profile
  page: null,           // fare | cal | sos | pray | stop
  stopId: null,
  qtab: 'daily', ctab: 'chars',
  pos: null,            // { lat, lon } when the visitor shared location
  weather: null, prayer: null, places: null, loading: false,
  msg: ''
};
if (!CITIES[state.city]) state.city = 'istanbul';

const T = (k, v) => t(state.lang, k, v);
const city = () => (state.city === 'nearby' ? NEARBY : CITIES[state.city]);
const cityName = (c = city()) => c.name[state.lang] || c.name.en;
// Where to look: the visitor, else the city pack's centre, else the last place we saw them, else Istanbul.
// A city chosen by hand wins over a real position far away (you can browse Antalya from Ankara).
const chosen = () => state.place || city().center;
const here = () => (state.pos && !(state.manualCity && chosen() && distanceM(state.pos, chosen()) > (state.place ? 25000 : 60000)) ? state.pos : null) || state.place || city().center || store.get('lastPos', null) || CITIES.istanbul.center;
// What the map pill says: the picked district or province, else the city pack.
const placeName = () => (state.place ? state.place.n : state.area && state.pos ? state.area : cityName());
// Which district is this point in? Borders come from data/admin/ squares, worked out on the phone.
let adminIndex = null; const adminCells = {}; let areaAt = null;
const inRing = (pt, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [yi, xi] = ring[i], [yj, xj] = ring[j]; if ((yi > pt.lat) !== (yj > pt.lat) && pt.lon < (xj - xi) * (pt.lat - yi) / (yj - yi) + xi) c = !c; } return c; };
async function detectArea(p) {
  if (areaAt && distanceM(areaAt, p) < 300) return;
  areaAt = { lat: p.lat, lon: p.lon };
  try {
    adminIndex = adminIndex || new Set(await (await fetch('./data/admin/index.json')).json());
    const key = `${Math.floor(p.lat / 0.25)}_${Math.floor(p.lon / 0.25)}`;
    if (!adminIndex.has(key)) return;
    const list = adminCells[key] || (adminCells[key] = await (await fetch(`./data/admin/${key}.json`)).json());
    const hit = list.find(([, , rings]) => rings.some((r) => inRing(p, r)));
    if (hit && state.area !== hit[1]) { state.area = hit[1]; state.areaProv = hit[0]; renderMapChrome(); }
  } catch { /* offline: keep the city name */ }
}
const nf = (n) => n.toLocaleString(state.lang === 'en' ? 'en-US' : state.lang);
const fmtDist = (m) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`);
// Open the place itself (its page with hours, reviews, phone), not just a dropped pin.
// "Name, street, city" makes Google jump straight to the right place, even for chains.
// Places without a name (some police stations, pharmacies) fall back to the coordinates.
const mapUrl = (p) => {
  const name = p.local || p.name;
  if (!name) return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`;
  const q = [name, p.street, CITIES[state.city]?.name.en].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
};
// Walking directions to a passport stop, by name and city so Maps shows the landmark, not a coordinate.
const dirUrl = (s) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${s.name}, ${CITIES[s.city]?.name.en || 'Türkiye'}`)}&travelmode=walking`;
const clock = () => { try { return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }); } catch { return new Date().toTimeString().slice(0, 5); } };
const nearest = (list, n) => { const h = here(); return (list || []).map((p) => ({ ...p, d: distanceM(h, p) })).sort((a, b) => a.d - b.d).slice(0, n); };
// City pack stops, stops found nearby right now, and nearby stops collected earlier somewhere else.
const allStops = () => {
  const list = [...Object.values(CITIES).flatMap((c) => c.stamps.map((s) => ({ ...s, city: c.id }))), ...NEARBY.stamps];
  const ids = new Set(list.map((s) => s.id));
  for (const m of Object.values(G.stopMeta())) if (!ids.has(m.id)) list.push(m);
  return list;
};
const stopById = (id) => allStops().find((s) => s.id === id);
const playerName = () => G.game().name || T('traveler');

/* ---------- icons ---------- */
const ico = (k, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k] || ''}</svg>`;

// When live place data is unavailable, hand the search to Google Maps around the same point.
const gmLink = (term) => { const h = here(); return `<a class="gm" href="https://www.google.com/maps/search/${encodeURIComponent(term)}/@${h.lat},${h.lon},15z" target="_blank" rel="noopener">${ico('map')}${esc(T('gm_search', { what: term }))}</a>`; };

/* ---------- data loading ---------- */
let loadRun = 0;
async function loadLive() {
  const h = here(), run = ++loadRun;
  state.loading = true;
  const set = (k) => (v) => { if (run === loadRun) { state[k] = v; onData(); } return v; };
  const nearby = state.city === 'nearby';
  // City packs ship their places; anywhere else (or if the file is missing) ask OpenStreetMap live.
  // City packs cover their centre; a district further out, Near me and everywhere else use the squares of all Türkiye.
  const usePack = !nearby && !(state.place && distanceM(state.place, city().center) > 12000);
  const places = (usePack ? fetchPlaces(state.city) : Promise.resolve(null)).then((v) => v || fetchGrid(h.lat, h.lon)).then((v) => v || fetchPlacesLive(h.lat, h.lon));
  const stops = nearby ? fetchWikiStops(h.lat, h.lon, state.lang).then((list) => { if (run === loadRun) { NEARBY.stamps = list; onData(); } }) : Promise.resolve();
  await Promise.all([fetchWeather(h.lat, h.lon).then(set('weather')), fetchPrayer(h.lat, h.lon).then(set('prayer')), places.then(set('places')), stops]);
  if (run === loadRun) { state.loading = false; onData(); }
}
// Live data appears on the map chrome and on the prayer and SOS pages; leave other screens alone.
function onData() {
  renderMapChrome(); drawMarkers(); applyTheme();
  if (state.page === 'pray' || state.page === 'sos') renderView();
}

// Inside a city pack's area use the pack; anywhere else in Türkiye switch to "Near me".
function pickCityFor(p) {
  store.set('lastPos', { lat: p.lat, lon: p.lon });
  if (state.place) { state.place = null; store.set('place', null); }
  let best = null;
  for (const c of Object.values(CITIES)) { const d = distanceM(p, c.center); if (d < 60000 && (!best || d < best.d)) best = { id: c.id, d }; }
  const want = best ? best.id : 'nearby';
  if (want !== state.city) { state.city = want; store.set('city', want); state.places = null; NEARBY.stamps = []; return true; }
  return false;
}
async function locate() {
  state.follow = true;
  state.manualCity = false; // "find me" always follows the real position
  try {
    const p = await getPosition();
    state.pos = { lat: p.lat, lon: p.lon, acc: p.acc };
    if (pickCityFor(p)) renderAll();
    moveMe();
    toast(p.acc > 300 ? T('loc_weak', { n: Math.round(p.acc) }) : '');
    startWatch();
  } catch (e) { toast(T(e && e.code === 1 ? 'loc_denied' : 'need_loc')); }
  centerMap(); loadLive();
}

// Live location: the player walks on the map with the visitor, and the banner notices arriving at a stop.
let watchId = null, lastDraw = 0;
function startWatch() {
  if (watchId != null || !navigator.geolocation) return;
  store.set('loc', true);
  watchId = navigator.geolocation.watchPosition((pos) => {
    const first = !state.pos;
    state.pos = { lat: pos.coords.latitude, lon: pos.coords.longitude, acc: pos.coords.accuracy };
    moveMe();
    detectArea(state.pos);
    if (state.follow && !nav && map && state.tab === 'map') map.easeTo({ center: [state.pos.lon, state.pos.lat], duration: 800 });
    if (Date.now() - lastDraw > 4000) { lastDraw = Date.now(); renderMapChrome(); }
    if (first) { if (!state.manualCity && pickCityFor(state.pos)) renderAll(); centerMap(); loadLive(); }
    if (nav) navUpdate();
  }, (e) => {
    // Permission taken away: stop asking. Other errors (no signal indoors): keep the last known position.
    if (e.code === 1) { navigator.geolocation.clearWatch(watchId); watchId = null; store.set('loc', false); toast(T('loc_denied')); }
  }, { enableHighAccuracy: true, maximumAge: 3000, timeout: 30000 });
}

// One place for collecting a stamp, used by the detail page and the "you are here" banner.
async function collectStop(id) {
  const s = stopById(id);
  let p = state.pos;
  try { const f = await getPosition(); p = { lat: f.lat, lon: f.lon, acc: f.acc }; state.pos = p; } catch { if (!p) return { err: T('need_loc') }; }
  const d = distanceM(p, s);
  if (d > CHECKIN_RADIUS + Math.min(p.acc || 0, 100)) return { err: T('too_far', { dist: fmtDist(d), radius: CHECKIN_RADIUS }) };
  const before = G.levelInfo().level;
  const xp = G.addStamp(s.city, s.id, s.city === 'nearby' ? { id: s.id, name: s.name, lat: s.lat, lon: s.lon, img: s.img, page: s.page, desc: s.desc, cat: s.cat, city: 'nearby' } : null);
  celebrate(s, xp, before);
  drawMarkers(); renderMapChrome(); renderNav();
  if (state.page === 'stop') renderView();
  return { ok: true };
}

// Big moment: confetti, the stamp, XP and any level-up or new character.
function celebrate(stop, xp, beforeLevel) {
  const after = G.levelInfo().level, ph = PHOTOS[stop.id] || (stop.img ? { src: stop.img } : null);
  const newChar = after > beforeLevel ? G.CHARACTERS.find((c) => c.level > beforeLevel && c.level <= after) : null;
  const colors = ['#8b5cf6', '#fbbf24', '#34d399', '#f43f5e', '#38bdf8', '#fff'];
  const bits = Array.from({ length: 36 }, (_, i) => `<i style="left:${(i * 37) % 100}%;background:${colors[i % colors.length]};animation-delay:${(i % 9) * 0.08}s;--r:${(i * 53) % 360}deg"></i>`).join('');
  $('celebrate').innerHTML = `
    <div class="confetti" aria-hidden="true">${bits}</div>
    <div class="cel-card">
      <div class="cel-stamp">${ph ? `<img src="${esc(thumb(ph.src))}" alt="">` : ''}<span>${ico('check')}</span></div>
      <h2>${esc(T('stamp_got_title'))}</h2>
      <p>${esc(stop.name)}</p>
      <b class="cel-xp">${ico('collection')}${esc(T('plus_xp', { n: xp }))}</b>
      ${after > beforeLevel ? `<p class="cel-level">${esc(T('level_up', { n: after }))}</p>` : ''}
      ${newChar ? `<div class="cel-char">${mascot(newChar, { size: 72 })}<span>${esc(T('new_char', { name: T('ch_' + newChar.id) }))}</span></div>` : ''}
      <button type="button" class="btn big" data-cel-close>${esc(T('tap_continue'))}</button>
    </div>`;
  $('celebrate').hidden = false;
  if (navigator.vibrate) try { navigator.vibrate([30, 40, 60]); } catch { /* not supported */ }
}

// Apple Maps style place card for restaurants, places of worship and hospitals.
// Opening hours: understands the common OpenStreetMap forms ("Mo-Fr 09:00-18:00; Sa 10:00-14:00", "24/7").
// Returns true / false, or null when the text is something unusual.
const OH_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
function openNow(oh, now = new Date()) {
  if (!oh) return null;
  if (oh.trim() === '24/7') return true;
  const day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
  let result = null;
  for (const rule of oh.replace(/\s*-\s*/g, '-').split(';').map((r) => r.trim()).filter(Boolean)) {
    const m = rule.match(/^((?:(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?,?)+)?\s*(off|closed|(?:\d\d:\d\d-\d\d:\d\d,?\s*)+)$/);
    if (!m) return result;
    if (result === null) result = false; // a day the rules don't list is closed
    let days = m[1] ? [] : [0, 1, 2, 3, 4, 5, 6];
    for (const part of (m[1] || '').split(',').filter(Boolean)) {
      const [a, b] = part.split('-').map((x) => OH_DAYS.indexOf(x));
      if (b === undefined) days.push(a); else for (let i = a; ; i = (i + 1) % 7) { days.push(i); if (i === b) break; }
    }
    const yesterday = (day + 6) % 7;
    if (/off|closed/.test(m[2])) { if (days.includes(day)) result = false; continue; }
    for (const span of m[2].split(',').map((x) => x.trim()).filter(Boolean)) {
      const [h1, m1, h2, m2] = span.match(/\d\d/g).map(Number), a = h1 * 60 + m1, b = h2 * 60 + m2;
      if (days.includes(day)) { if (result !== true) result = b > a ? mins >= a && mins < b : mins >= a; }
      if (b <= a && days.includes(yesterday) && mins < b) result = true; // past midnight
    }
  }
  return result;
}
const DAY_NAMES = { tr: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'], de: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] };
const ohText = (oh) => (DAY_NAMES[state.lang] ? oh.replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/g, (d) => DAY_NAMES[state.lang][OH_DAYS.indexOf(d)]) : oh).replace(/;\s*/g, '\n').replace(/\boff\b/g, T('closed_now').toLowerCase());
const placeKey = (p) => `p_${p.lat.toFixed(4)}_${p.lon.toFixed(4)}`;

function openPlace(p, kindLabel) {
  const d = distanceM(here(), p), walk = Math.max(1, Math.round(d * 1.3 / 80));
  const tel = (p.phone || '').split(';')[0].trim();
  const open = openNow(p.hours), key = placeKey(p), mine = G.myRating(key);
  const tags = [p.fee === false && T('free'), p.fee === true && T('paid'), p.wheelchair && T('accessible'), p.halal && T('halal'), p.vegetarian && T('vegetarian'), p.kosher && T('kosher'), p.outdoor && T('outdoor')].filter(Boolean);
  $('place-card').innerHTML = `
    <div class="pc-head"><div><h2>${esc(p.name || p.local || kindLabel)}</h2>${p.local && p.name && p.local !== p.name ? `<p class="pc-local">${esc(p.local)}</p>` : ''}<small>${esc([p.name || p.local ? kindLabel : '', (kindLabel || '').includes(cuisineText(p.cuisine)) ? '' : cuisineText(p.cuisine)].filter(Boolean).join(' · '))}</small></div>
      <button type="button" class="round sm" data-pc-close aria-label="${esc(T('close'))}">✕</button></div>
    ${open !== null ? `<p class="pc-open ${open ? 'on' : 'off'}">${esc(T(open ? 'open_now' : 'closed_now'))}</p>` : ''}
    <div class="pc-meta"><span>${ico('walk')}${fmtDist(d)} · ${esc(T('min', { n: walk }))}</span>${p.street ? `<span>${ico('pin')}${esc(p.street)}</span>` : ''}${tel ? `<span class="sel">${ico('bell')}${esc(tel)}</span>` : ''}</div>
    ${tags.length ? `<div class="pc-tags">${tags.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
    ${p.hours ? `<details class="pc-hours"><summary>${ico('cal')}${esc(T('hours'))}</summary><pre>${esc(ohText(p.hours))}</pre></details>` : ''}
    <div class="pc-actions">
      <button type="button" class="btn" data-route-card>${ico('walk')}${esc(T('route_draw'))}</button>
      ${tel ? `<a class="btn ghost" href="tel:${esc(tel.replace(/[^+0-9]/g, ''))}">${esc(T('call'))}</a>` : ''}
      ${p.web ? `<a class="btn ghost" href="${esc(p.web)}" target="_blank" rel="noopener">${esc(T('website'))}</a>` : ''}
      <button type="button" class="btn ghost" data-share aria-label="${esc(T('share_place'))}">${ico('share')}</button>
    </div>
    <a class="pc-reviews" href="${mapUrl(p)}" target="_blank" rel="noopener">${ico('collection')}<span><b>${esc(T('reviews'))}</b><small>${esc(T('reviews_note'))}</small></span>${ico('chevron')}</a>
    <div class="rate pc-rate"><span>${esc(T(mine ? 'your_rating' : 'rate_title'))}</span><div class="stars" role="group" aria-label="${esc(T('rate_title'))}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-rate="${key}:${n}" aria-label="${n}" aria-pressed="${n <= mine}">${ico('collection')}</button>`).join('')}</div></div>`;
  $('place-card').hidden = false;
  state.cardPlace = p; state.cardLabel = kindLabel;
}

// Send a place to a friend: the phone's share sheet, or copy the link.
async function sharePlace(p) {
  if (!p) return;
  const url = mapUrl(p), title = p.name || p.local || '';
  try {
    if (navigator.share) await navigator.share({ title, text: [title, p.street].filter(Boolean).join(', '), url });
    else { await navigator.clipboard.writeText(`${title} ${url}`); toast(T('copied')); }
  } catch { /* cancelled */ }
}

// The big character on the profile: a turnable 3D model when one is delivered, else the picture.
const MV_SRC = 'https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
const MV_SRI = 'sha384-Ftcjj/GNLxPvzNDftO/oryXB9aGxsGZY9JGqsXG0uUKgQDl9RfDgsx9NJ/4IVNPe';
function hero3d(c, size) {
  const glb = artModel(c.id);
  if (!glb) return mascot(c, { size });
  if (!document.querySelector('script[data-mv]')) {
    const sc = document.createElement('script');
    sc.type = 'module'; sc.src = MV_SRC; sc.integrity = MV_SRI; sc.crossOrigin = 'anonymous'; sc.dataset.mv = '1';
    document.head.appendChild(sc);
  }
  const poster = artImage(c.id);
  return `<model-viewer class="hero3d" src="${glb}" ${poster ? `poster="${poster}"` : ''} alt="${esc(T('ch_' + c.id))}" loading="eager" camera-controls auto-rotate autoplay animation-name="idle" disable-zoom interaction-prompt="none" shadow-intensity="0.8" style="width:${size}px;height:${size}px"></model-viewer>`;
}

/* ---------- toast ---------- */
let toastTimer;
function toast(text) {
  const el = $('toast');
  if (!text) { el.hidden = true; return; }
  el.textContent = text; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 3500);
}
function reward(xp, what) {
  const before = G.levelInfo(G.game().xp - xp).level, after = G.levelInfo().level;
  toast(T('got_xp', { n: xp, what }) + (after > before ? ' · ' + T('level', { n: after }) + '!' : ''));
}

/* ---------- map ---------- */
// Tilted 3D city map (MapLibre + OpenFreeMap "liberty" style with extruded buildings), close to the
// illustrated city in the design. Free, no API key.
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
let map, markers = [];
function initMap() {
  if (!window.maplibregl) { $('map').innerHTML = `<p class="map-fallback">${esc(T('offline'))}</p>`; return; }
  map = new maplibregl.Map({
    container: 'map', style: MAP_STYLE, center: [here().lon, here().lat], zoom: 16.2, pitch: 58, bearing: -18,
    attributionControl: false, maxPitch: 70
  });
  // Credit line is drawn by us in index.html (#map-credit) so it stays one small, quiet line.
  map.on('style.load', () => { tintMap(); applyTheme(); });
}
// Recolour the base style toward Apple Maps.
function tintMap() {
  const set = (id, prop, val) => { if (map.getLayer(id)) try { map.setPaintProperty(id, prop, val); } catch { /* layer differs */ } };
  // Apple Maps palette: pale grey ground, white-grey buildings, clear blue water, soft green parks.
  set('building-3d', 'fill-extrusion-color', ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 0], 0, '#f2f1f4', 40, '#e4e2ea', 100, '#d6d3df']);
  set('building-3d', 'fill-extrusion-opacity', 0.95);
  set('water', 'fill-color', '#9fd3f5');
  set('park', 'fill-color', '#c4e8b4');
  set('landcover_grass', 'fill-color', '#cdeebd');
  set('landcover_wood', 'fill-color', '#b6e0a4');
  set('background', 'background-color', '#f5f4f2');
  // Hide the base style's own point icons so only Keşif pins remain, like a clean Apple Maps view.
  for (const l of map.getStyle().layers) if (l.type === 'symbol' && /poi|transit|railway|aerialway/.test(l.id)) map.setLayoutProperty(l.id, 'visibility', 'none');
  // Striped pedestrian-area patterns look noisy on a phone: plain ground instead.
  for (const l of map.getStyle().layers) if (l.type === 'fill' && l.paint && l.paint['fill-pattern']) map.setLayoutProperty(l.id, 'visibility', 'none');
}
// Night map: dark like Apple Maps after sunset (or by choice in Profile). The light palette is remembered
// from the style itself so switching back is exact.
const DARK = { bg: '#1b1b25', water: '#1a3550', park: '#1f3a2c', building: ['#2e2e3e', '#3a3a4d', '#47475c'], road: '#3c3c4c', roadMajor: '#55556a', casing: '#22222e', label: '#d6d6e2', halo: '#15151d' };
let lightPaint = null, mapDark = null;
function wantDark() {
  const pref = store.get('mapTheme', 'auto');
  if (pref !== 'auto') return pref === 'dark';
  const wx = state.weather, now = new Date(), hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return wx && wx.sunrise ? hm < wx.sunrise || hm >= wx.sunset : now.getHours() < 6 || now.getHours() >= 19;
}
function applyTheme() {
  if (!map) return;
  let layers; try { layers = map.getStyle().layers; } catch { return; } // style not parsed yet
  if (!layers || !layers.length) return;
  const dark = wantDark();
  if (dark === mapDark) return;
  mapDark = dark;
  document.body.classList.toggle('map-dark', dark);
  if (!lightPaint) {
    lightPaint = [];
    for (const l of layers) for (const prop of ['background-color', 'fill-color', 'fill-extrusion-color', 'line-color', 'text-color', 'text-halo-color']) {
      try { const v = map.getPaintProperty(l.id, prop); if (v !== undefined) lightPaint.push([l.id, prop, v]); } catch { /* not this type */ }
    }
  }
  const set = (id, prop, val) => { try { map.setPaintProperty(id, prop, val); } catch { /* layer differs */ } };
  if (!dark) { for (const [id, prop, v] of lightPaint) set(id, prop, v); return; }
  for (const l of layers) {
    const id = l.id;
    if (l.type === 'background') set(id, 'background-color', DARK.bg);
    else if (l.type === 'fill') set(id, 'fill-color', /water/.test(id) ? DARK.water : /park|grass|wood|landcover/.test(id) ? DARK.park : DARK.bg);
    else if (l.type === 'fill-extrusion') set(id, 'fill-extrusion-color', ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 0], 0, DARK.building[0], 40, DARK.building[1], 100, DARK.building[2]]);
    else if (l.type === 'line' && !/^(route|plan)/.test(id)) set(id, 'line-color', /water|river/.test(id) ? DARK.water : /casing/.test(id) ? DARK.casing : /motorway|trunk|primary|major/.test(id) ? DARK.roadMajor : /boundary|admin/.test(id) ? '#4a4a60' : DARK.road);
    else if (l.type === 'symbol') { set(id, 'text-color', DARK.label); set(id, 'text-halo-color', DARK.halo); }
  }
}

function centerMap() { if (map) map.easeTo({ center: [here().lon, here().lat], zoom: 16.2, pitch: 58, duration: 800 }); }

function addMarker(lat, lon, html, { onClick, popupHtml, z = 0, label = '' } = {}) {
  const el = document.createElement('div');
  el.className = 'mk';
  el.style.zIndex = z;
  el.innerHTML = html;
  // Pins are buttons for screen readers and keyboards too.
  if (onClick) {
    el.setAttribute('role', 'button'); el.tabIndex = 0;
    if (label) el.setAttribute('aria-label', label);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } });
  }
  const m = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([lon, lat]);
  if (popupHtml) m.setPopup(new maplibregl.Popup({ offset: 30, closeButton: false }).setHTML(popupHtml));
  if (onClick) el.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
  m.addTo(map);
  markers.push(m);
}
// Apple Maps style pins: a coloured circle with a white glyph and a small tail.
// Colours follow iOS system colours so categories read at a glance.
const CITY_MEDAL = { istanbul: 'ist', ankara: 'ank', izmir: 'izm', antalya: 'ant', kapadokya: 'kap', nearby: 'near' };
const PIN_COLOR = { food: '#FF9500', mosque: '#34A853', church: '#5856D6', synagogue: '#007AFF', worship: '#34A853', hospital: '#FF3B30', history: '#AF52DE', museum: '#FF2D55', market: '#FF9F0A', view: '#32ADE6', park: '#30B158', got: '#F5B400' };
const pinHtml = (icon, color, { big = false, label = '', cls = '' } = {}) =>
  `<div class="apin${big ? ' big' : ''} ${cls}" style="--c:${color}">${ico(icon)}${label ? `<span class="alabel">${esc(label)}</span>` : ''}</div>`;
const worshipIcon = (r) => (r === 'christian' ? 'church' : r === 'jewish' ? 'synagogue' : r === 'muslim' ? 'mosque' : 'worship');

function drawMarkers() {
  if (!map) return;
  markers.forEach((m) => m.remove()); markers = [];
  const pl = state.places;
  if (pl) {
    for (const p of nearest(pl.worship, 8)) { const k = worshipIcon(p.religion); addMarker(p.lat, p.lon, pinHtml(k, PIN_COLOR[k]), { onClick: () => openPlace(p, T(relKey(p.religion))), label: `${p.name || p.local}, ${T(relKey(p.religion))}` }); }
    for (const p of nearest(pl.food, 6)) addMarker(p.lat, p.lon, pinHtml('food', PIN_COLOR.food), { onClick: () => openPlace(p, T('restaurant')), label: `${p.name || p.local}, ${T('restaurant')}` });
    for (const p of nearest(pl.hospital, 6)) addMarker(p.lat, p.lon, pinHtml('hospital', PIN_COLOR.hospital), { onClick: () => openPlace(p, T('hospital')), label: `${p.name || p.local}, ${T('hospital')}` });
  }
  for (const s of city().stamps) {
    const got = G.hasStamp(state.city, s.id);
    const cat = (STOP_INFO[s.id]?.cat || s.cat || ['history'])[0];
    addMarker(s.lat, s.lon, pinHtml(got ? 'check' : cat, got ? PIN_COLOR.got : PIN_COLOR[cat], { big: true, label: s.name, cls: got ? 'got' : 'todo' }), { onClick: () => openStop(s.id), z: 5, label: `${s.name}${got ? ' ✓' : ''}` });
  }
  // The player always stands on the map, like in the design. Faded until the visitor shares location.
  if (meMk) meMk.remove();
  const h = here(), el = document.createElement('div');
  el.className = 'mk'; el.style.zIndex = 10;
  el.innerHTML = `<div class="me${state.pos ? '' : ' ghost'}"><i class="beam"></i><i class="ring"></i>${mascot(G.currentCharacter(), { size: 66 })}</div>`;
  meMk = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([h.lon, h.lat]).addTo(map);
}
let meMk = null;
function moveMe() {
  if (!meMk) return drawMarkers();
  meMk.setLngLat([state.pos.lon, state.pos.lat]);
  meMk.getElement().querySelector('.me')?.classList.remove('ghost');
}
function popup(p, sub) {
  return `<b>${esc(p.name)}</b>${sub ? `<br><small>${esc(sub)}</small>` : ''}${p.phone ? `<br><small>${esc(p.phone)}</small>` : ''}<br><a href="${mapUrl(p)}" target="_blank" rel="noopener">${esc(T('open_maps'))}</a>`;
}
const relKey = (r) => (r === 'muslim' ? 'rel_muslim' : r === 'christian' ? 'rel_christian' : r === 'jewish' ? 'rel_jewish' : 'rel_other');

function playerChip() {
  const li = G.levelInfo();
  return `<button type="button" class="chip-player" data-go="profile">${mascot(G.currentCharacter(), { size: 40 })}<span><b>${esc(playerName())}</b><small>${esc(T('lv_short', { n: li.level }))}</small></span></button>`;
}

function renderMapChrome() {
  const c = city(), wx = state.weather;
  const next = c.stamps.filter((s) => !G.hasStamp(c.id, s.id)).map((s) => ({ ...s, d: distanceM(here(), s) })).sort((a, b) => a.d - b.d)[0];
  // Top: you (left), the city and weather (middle), tools (right). One row, nothing else.
  $('map-top').innerHTML = `
    <div class="map-row">
      ${playerChip()}
      <div class="map-info"><button type="button" id="city-toggle">${esc(placeName())} ▾</button><i></i><button type="button" data-page="wx">${wx ? esc(wx.temp) + '°' : '–'}</button></div>
      <button type="button" class="round tools-btn" id="tools-btn" aria-label="${esc(T('tools'))}">${ico('grid')}</button>
    </div>`;
  // Bottom right: find me and camera, stacked like Apple Maps. A banner only when there is something to do here.
  const here_ = next && state.pos && next.d <= CHECKIN_RADIUS + Math.min(state.pos.acc || 0, 100);
  $('map-bottom').innerHTML = `
    <div class="fab-col">
      <button type="button" class="round locate" id="locate-btn" aria-label="${esc(T('locate'))}">${ico('locate')}</button>
      <button type="button" class="round cam" data-photo="" aria-label="${esc(T('take_photo'))}">${ico('camera')}</button>
    </div>
    ${here_ ? `<button type="button" class="banner here" data-collect="${next.id}">${ico('map', 'star')}<span>${esc(T('at_stop', { name: next.name }))}</span><em>${esc(T('collect_now'))}</em></button>`
      : next && next.d < 1500 ? `<button type="button" class="next-pill" data-stop="${next.id}">${ico('collection')}<span>${esc(next.name)}</span><small>${fmtDist(next.d)}</small></button>` : ''}`;
}

/* ---------- views ---------- */
function header(title, right = '') {
  return `<header class="vhead"><h1>${title}</h1>${right}</header>`;
}
function backHead(title) {
  return `<header class="vhead"><button type="button" class="round" data-back aria-label="${esc(T('back'))}">${ico('back')}</button><h1>${esc(title)}</h1><span></span></header>`;
}
function bar(a, b) { return `<div class="xpbar"><div style="width:${Math.min(100, Math.round(a / b * 100))}%"></div></div>`; }

function renderStop() {
  const s = stopById(state.stopId); if (!s) return '';
  const info = STOP_INFO[s.id] || { cat: s.cat || ['history'], en: s.desc || '', tr: s.desc || '' };
  const c = CITIES[s.city] || NEARBY, got = G.game().stamps[s.city]?.[s.id];
  const d = distanceM(here(), s), near = state.pos && distanceM(state.pos, s) <= CHECKIN_RADIUS + Math.min(state.pos.acc || 0, 100);
  // Rough times: walking 80 m/min, city driving ~18 km/h plus parking, transit ~13 km/h plus waiting.
  const walk = Math.max(1, Math.round(d * 1.3 / 80)), drive = Math.max(2, Math.round(d * 1.4 / 300 + 3)), transit = Math.max(5, Math.round(d * 1.3 / 220 + 8));
  const ph = PHOTOS[s.id] || (s.img ? { src: s.img, page: s.page, by: 'Wikipedia', lic: 'Wikimedia Commons' } : null), saved = G.isSaved(s.id);
  return `
  <div class="hero hero-${info.cat[0]}${ph ? ' photo' : ''}">
    ${ph ? `<img src="${esc(ph.src)}" alt="${esc(s.name)}" loading="eager" decoding="async" onerror="this.remove()">` : `<div class="hero-art">${ico(info.cat[0], 'big')}</div>`}
    <button type="button" class="round hb-left" data-back aria-label="${esc(T('back'))}">${ico('back')}</button>
    <button type="button" class="round hb-right${saved ? ' on' : ''}" data-save="${s.id}" aria-pressed="${saved}" aria-label="${esc(T(saved ? 'saved' : 'save'))}">${ico('bookmark')}</button>
    ${ph ? `<a class="credit-ph" href="${esc(ph.page)}" target="_blank" rel="noopener">${esc(T('photo_by', { by: ph.by, lic: ph.lic }))}</a>` : ''}
  </div>
  <section class="sheet">
    <h1>${esc(s.name)}</h1>
    <div class="tags">${info.cat.map((k) => `<span class="tag">${esc(T('cat_' + k))}</span>`).join('')}<span class="tag quiet">${esc(cityName(c))}</span></div>
    <p>${esc(info[state.lang] || info.en)}</p>
    ${s.page ? `<a class="wiki" href="${esc(s.page)}" target="_blank" rel="noopener">${esc(T('read_wiki'))} →</a>` : ''}
    ${got ? '' : near ? `<button type="button" class="btn big" id="checkin" data-id="${s.id}">${esc(T('get_stamp'))}</button>
         <p class="muted" id="stop-msg" aria-live="polite"></p>`
      : `<button type="button" class="btn big" data-route-stop="${s.id}">${ico('walk')}${esc(T('route_draw'))}</button>
         <p class="muted" id="stop-msg" aria-live="polite">${esc(state.pos ? T('come_closer', { n: CHECKIN_RADIUS }) : T('need_loc'))}</p>`}
    <div class="facts"><span>${ico('pin')}${fmtDist(d)}</span>${d < 2500 ? `<span>${ico('walk')}${esc(T('min', { n: walk }))}</span>` : ''}<span>${ico('car')}${esc(T('min', { n: drive }))}</span><span>${ico('bus')}${esc(T('min', { n: transit }))}</span></div>
    <h2>${esc(T('rewards'))}</h2>
    <div class="rewards"><div>${ico('collection', 'gold')}<b>${esc(T('plus_xp', { n: G.XP_STAMP }))}</b></div><div>${medal(CITY_MEDAL[s.city] || 'near', true)}<b>${esc(s.city === 'nearby' ? T('bd_near') : T('city_badge', { city: cityName(c) }))}</b></div></div>
    ${got ? `<p class="done">${ico('check')}${esc(T('collected', { date: got.slice(0, 10) }))}</p>
      <div class="rate"><span>${esc(T(G.myRating(s.id) ? 'your_rating' : 'rate_title'))}</span><div class="stars" role="group" aria-label="${esc(T('rate_title'))}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-rate="${s.id}:${n}" aria-label="${n}" aria-pressed="${n <= G.myRating(s.id)}">${ico('collection')}</button>`).join('')}</div></div>`
      : ''}
    <div class="my-photos">
      <div class="row"><h2>${esc(T('your_photos'))}</h2><button type="button" class="btn sm" data-photo="${s.id}">${ico('camera')}${esc(T('take_photo'))}</button></div>
      ${A.photosFor(s.id).length ? `<div class="strip">${A.photosFor(s.id).map((p) => `<button type="button" data-view="${p.id}"><img src="${A.photoUrl(p.id)}" alt="${esc(s.name)}"></button>`).join('')}</div>`
        : `<p class="muted">${esc(T('photo_hint', { n: G.XP_PHOTO }))}</p>`}
    </div>
    ${got || near ? `<button type="button" class="btn ghost big" data-route-stop="${s.id}">${ico('walk')}${esc(T('route_draw'))}</button>` : ''}
    <a class="gm" href="${dirUrl(s)}" target="_blank" rel="noopener">${ico('map')}${esc(T('open_gmaps'))} →</a>
  </section>`;
}
function bindStop() {
  const b = $('checkin'); if (!b) return;
  b.addEventListener('click', async () => {
    const msg = $('stop-msg');
    msg.textContent = T('checking'); b.disabled = true;
    const r = await collectStop(b.dataset.id);
    if (r.err) { msg.textContent = r.err; b.disabled = false; }
  });
}

function renderQuests() {
  // The daily login reward sits in its own chest card at the bottom, like the design.
  const list = G.QUESTS.filter((q) => q.period === state.qtab && q.id !== 'd_login');
  const qIcon = { s_near: 'locate', s_izm: 'history', s_ant: 'history', s_kap: 'view', d_photo: 'camera', s_photo: 'camera', d_stamp: 'collection', d_fare: 'taxi', w_five: 'collection', w_worship: 'worship', s_ist: 'history', s_ank: 'history', s_market: 'market', s_museum: 'museum', s_asia: 'view', s_chars: 'egg' };
  const qPhoto = { s_izm: 'iz_clock', s_ant: 'an_hadrian', s_kap: 'ka_goreme', s_photo: 'kale', d_stamp: 'topkapi', w_five: 'galata', w_worship: 'blue', s_ist: 'hagia', s_ank: 'anitkabir', s_market: 'bazaar', s_museum: 'anadolu', s_asia: 'kpier' };
  const login = G.QUESTS.find((q) => q.id === 'd_login'), ls = G.questState(login);
  return `${header(`<span class="hicon">${ico('quests')}</span>${esc(T('nav_quests'))}`, `<button type="button" class="round" data-go="profile" aria-label="${esc(T('friends'))}">${ico('profile')}</button>`)}
  <div class="seg">${['daily', 'weekly', 'special'].map((k) => `<button type="button" data-qtab="${k}" aria-pressed="${state.qtab === k}">${esc(T('q_' + k))}</button>`).join('')}</div>
  <div class="stack">${list.map((q) => {
    const s = G.questState(q), ph = PHOTOS[qPhoto[q.id]];
    return `<article class="quest${s.claimed ? ' claimed' : ''}">
      <div class="qart qart-${q.id.split('_')[0]}">${ph ? `<img src="${esc(thumb(ph.src))}" alt="" loading="lazy" onerror="this.remove()">` : ''}${ico(qIcon[q.id] || 'quests', 'big')}</div>
      <div class="qbody"><div class="qtop"><h2>${esc(T('q_' + q.id))}</h2><span class="xp">${ico('collection', 'gold')}${esc(T('plus_xp', { n: q.xp }))}</span></div><p>${esc(T('q_' + q.id + '_d'))}</p>
        <div class="qrow">${bar(s.p, q.goal)}<span class="qn">${s.p} / ${q.goal}</span></div></div>
      <div class="qact">${s.claimed ? `<span class="ok" title="${esc(T('claimed'))}">${ico('check')}</span>` : s.done ? `<button type="button" class="btn sm gold" data-claim="${q.id}">${esc(T('claim'))}</button>` : `<span class="chev">${ico('chevron')}</span>`}</div>
    </article>`;
  }).join('')}</div>
  <article class="chest-card">
    <h2>${esc(T('q_d_login'))}</h2>
    <div class="row"><div class="chest">${ico('chest', 'big')}</div><span class="grow"><b>${esc(T('q_d_login_d'))}</b><small>${ico('collection', 'gold')}${esc(T('plus_xp', { n: login.xp }))}</small></span>
    ${ls.claimed ? `<span class="ok">${ico('check')}</span>` : `<button type="button" class="btn sm gold" data-claim="d_login">${esc(T('claim'))}</button>`}</div>
  </article>`;
}

// Each badge gets its own symbol, like the coloured medals in the design.
const MEDAL_SYM = {
  first: 'M24 13l3.2 7 7.6.8-5.7 5 1.7 7.5L24 29.4l-6.8 3.9 1.7-7.5-5.7-5 7.6-.8z',
  ist: 'M24 12c4 3 7 6 7 11H17c0-5 3-8 7-11zM15 34v-9h18v9zM12 34V20M36 34V20',
  ank: 'M13 34h22M15 31h18M16 31V21M20 31V21M24 31V21M28 31V21M32 31V21M14 21h20l-10-6z',
  city: 'M13 34h22M15 31h18M16 31V21M20 31V21M24 31V21M28 31V21M32 31V21M14 21h20l-10-6z',
  market: 'M14 20l3-6h14l3 6zM14 20h20v13H14zM21 33v-7h6v7',
  faith: 'M24 12c4 3 7 6 7 11H17c0-5 3-8 7-11zM15 34v-9h18v9z',
  asia: 'M12 28c4 3 8 3 12 0s8-3 12 0M12 33c4 3 8 3 12 0s8-3 12 0M17 25l2-8h10l2 8z',
  two: 'M17 15l7 3 7-3v18l-7 3-7-3zM24 18v18M17 15v18M31 15v18',
  lvl10: 'M17 14h14v6a7 7 0 0 1-14 0zM24 27v4M19 34h10M17 16h-4a4 4 0 0 0 4 6M31 16h4a4 4 0 0 1-4 6',
  photo: 'M14 19h5l2-3h6l2 3h5v13H14zM24 29a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  izm: 'M21 34h6M22 34V18h4v16M20 18h8l-4-5zM24 22h.01',
  ant: 'M13 34V20h22v14M17 34v-8a3 3 0 0 1 6 0v8M25 34v-8a3 3 0 0 1 6 0v8M12 20h24',
  kap: 'M24 12a8 8 0 0 1 8 8c0 5-5 8-6 10h-4c-1-2-6-5-6-10a8 8 0 0 1 8-8zM22 31h4v4h-4z',
  near: 'M24 13a8 8 0 0 1 8 8c0 6-8 14-8 14s-8-8-8-14a8 8 0 0 1 8-8zM24 24a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'
};
function medal(id, on) {
  const hue = { first: '#f59e0b', ist: '#8b5cf6', ank: '#ef4444', market: '#f97316', faith: '#22c55e', asia: '#0ea5e9', two: '#ec4899', lvl10: '#eab308', photo: '#14b8a6', izm: '#0ea5e9', ant: '#f97316', kap: '#d97706', near: '#22c55e', city: '#ef4444' }[id] || '#8b5cf6';
  const sym = MEDAL_SYM[id] || MEDAL_SYM.first, filled = id === 'first';
  return `<svg class="medal${on ? '' : ' off'}" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 2l5 4 6-1 2 6 6 2-1 6 4 5-4 5 1 6-6 2-2 6-6-1-5 4-5-4-6 1-2-6-6-2 1-6-4-5 4-5-1-6 6-2 2-6 6 1z" fill="${on ? '#fcd34d' : '#3b3561'}"/><circle cx="24" cy="24" r="15" fill="${on ? hue : '#2a2450'}"/><path d="${sym}" fill="${filled ? (on ? '#fff' : '#4a4378') : 'none'}" stroke="${on ? '#fff' : '#4a4378'}" stroke-width="${filled ? 0 : 2.2}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function renderCollection() {
  const li = G.levelInfo(), cur = G.currentCharacter();
  let body = '';
  if (state.ctab === 'chars') {
    const next = G.nextCharacter();
    let xpTo = 0;
    if (next) { for (let l = li.level; l < next.level; l++) xpTo += 400 + 100 * l; xpTo -= li.into; }
    body = `<div class="grid2">${G.CHARACTERS.map((c) => {
      const open = li.level >= c.level, isCur = c.id === cur.id;
      return `<button type="button" class="char${isCur ? ' cur' : ''}" ${open && !isCur ? `data-char="${c.id}"` : 'disabled'}>
        ${mascot(c, { size: 96, locked: !open })}
        <b>${esc(open ? T('ch_' + c.id) : '???')}</b>
        <small>${isCur ? esc(T('main_char')) + ' · ' + esc(T('lv_short', { n: li.level })) : open ? esc(T('choose')) : esc(T('unlock_at', { n: c.level }))}</small>
        ${open ? '' : `<span class="lock">${ico('lock')}</span>`}
      </button>`;
    }).join('')}</div>
    <div class="egg">${ico('egg', 'big gold')}<span><b>${esc(T('egg'))}</b><small>${next ? esc(T('egg_d', { n: next.level, xp: nf(xpTo) })) : esc(T('egg_all'))}</small></span></div>`;
  } else if (state.ctab === 'badges') {
    body = `<div class="grid3">${G.BADGES.map((b) => { const on = b.test(); return `<div class="badge${on ? '' : ' off'}">${medal(b.id, on)}<small>${esc(T('bd_' + b.id))}</small></div>`; }).join('')}</div>`;
  } else if (state.ctab === 'album') {
    const all = A.photos();
    body = all.length ? `<div class="album">${all.map((p) => `<button type="button" data-view="${p.id}"><img src="${A.photoUrl(p.id)}" alt="${esc(p.place)}" loading="lazy"><small>${esc(p.place)}</small></button>`).join('')}</div>
      <p class="muted center">${esc(T('album_note'))}</p>`
      : `<div class="empty">${ico('camera', 'big')}<b>${esc(T('no_photos'))}</b><button type="button" class="btn" data-photo="">${esc(T('take_photo'))}</button></div>`;
  } else {
    body = `<div class="grid2">${G.COSTUMES.map((c) => {
      const on = G.costumeUnlocked(c);
      return `<div class="char${on ? '' : ' off'}">${mascot(cur, { size: 96, costume: c.id, locked: !on })}<b>${esc(T('co_' + c.id))}</b><small>${on ? '' : esc(T('co_need', { badge: T('bd_' + c.badge) }))}</small>${on ? '' : `<span class="lock">${ico('lock')}</span>`}</div>`;
    }).join('')}</div>`;
  }
  return `${header(esc(T('nav_collection')))}
  <div class="seg">${[['chars', 'c_chars'], ['badges', 'c_badges'], ['costumes', 'c_costumes'], ['album', 'c_album']].map(([k, l]) => `<button type="button" data-ctab="${k}" aria-pressed="${state.ctab === k}">${esc(T(l))}</button>`).join('')}</div>
  ${body}`;
}

function renderProfile() {
  const g = G.game(), li = G.levelInfo();
  const earned = G.BADGES.filter((b) => b.test());
  return `
  <div class="pro-hero">
    <button type="button" class="round gear-l" data-scroll="friends-sec" aria-label="${esc(T('friends'))}">${ico('profile')}</button>
    <button type="button" class="round gear" data-scroll="settings" aria-label="${esc(T('settings_go'))}">${ico('gear')}</button>
    <i class="spark s1"></i><i class="spark s2"></i><i class="spark s3"></i>
    ${hero3d(G.currentCharacter(), 150)}
    <div class="pro-name"><input id="pname" value="${esc(g.name)}" placeholder="${esc(T('traveler'))}" aria-label="${esc(T('your_name'))}" maxlength="20">${ico('edit')}</div>
    <b>${esc(T('level', { n: li.level }))}</b>
    ${bar(li.into, li.need)}
    <small>${esc(T('xp_of', { a: nf(li.into), b: nf(li.need) }))}</small>
  </div>
  <h2 class="sec row">${esc(T('stats'))}<span class="muted">${ico('chevron')}</span></h2>
  <div class="grid2 stats">
    <div>${ico('collection', 'gold')}<small>${esc(T('st_xp'))}</small><b>${nf(g.xp)}</b></div>
    <div>${ico('pin', 'violet')}<small>${esc(T('st_places'))}</small><b>${G.totalStamps()}</b></div>
    <div>${medal('first', true)}<small>${esc(T('st_badges'))}</small><b>${earned.length} / ${G.BADGES.length}</b></div>
    <div>${ico('quests', 'gold')}<small>${esc(T('st_quests'))}</small><b>${G.questsDone()}</b></div>
  </div>
  <section class="panel">
    <div class="row" id="friends-sec"><h2>${esc(T('friends'))}</h2><span class="muted">${G.game().friends.length}</span></div>
    ${friendsHtml()}
    <button type="button" class="btn" id="share-code">${esc(T('share_code'))}</button>
    <label for="friend-code">${esc(T('add_code'))}</label>
    <div class="addrow"><input id="friend-code" type="text" autocomplete="off" spellcheck="false" placeholder="KSF-…"><button type="button" class="btn sm" id="add-friend">${esc(T('add'))}</button></div>
    <p class="muted" id="friend-msg" aria-live="polite"></p>
    <p class="muted">${esc(T('rank_note'))}</p>
  </section>
  <section class="panel">
    <div class="row"><h2>${esc(T('c_badges'))}</h2><span class="muted">${earned.length} / ${G.BADGES.length}</span></div>
    <div class="medals">${[...G.BADGES].sort((a, b) => b.test() - a.test()).slice(0, 5).map((b) => medal(b.id, b.test())).join('')}</div>
    <button type="button" class="btn ghost" data-go-col="costumes">${esc(T('customize'))} ›</button>
  </section>
  <h2 class="sec" id="settings">${esc(T('settings'))}</h2>
  <section class="panel">
    <label for="lang">${esc(T('language'))}</label>
    <select id="lang">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}"${k === state.lang ? ' selected' : ''}>${v}</option>`).join('')}</select>
    <label>${esc(T('city_l'))}</label>
    <button type="button" class="btn ghost" id="city-toggle">${ico('map')}${esc(cityName())} ▾</button>
    <label for="map-theme">${esc(T('map_theme'))}</label>
    <select id="map-theme">${['auto', 'light', 'dark'].map((k) => `<option value="${k}"${k === store.get('mapTheme', 'auto') ? ' selected' : ''}>${esc(T('theme_' + k))}</option>`).join('')}</select>
  </section>
  <section class="panel">
    <div class="row"><h2>${esc(T('offline_title'))}</h2>${store.get('offline:' + state.city, '') ? `<span class="tag">${esc(store.get('offline:' + state.city, ''))}</span>` : ''}</div>
    <p class="muted">${esc(T('offline_note'))}</p>
    <button type="button" class="btn" id="offline-btn">${ico('map')}${esc(T('offline_btn', { city: cityName() }))}</button>
    <p class="muted" id="offline-msg" aria-live="polite"></p>
  </section>
  <p class="credit">${esc(T('data_credit'))}</p>`;
}
function friendsHtml() {
  const rows = G.leaderboard(playerName());
  if (rows.length === 1) return `<p class="muted">${esc(T('no_friends'))}</p>`;
  return `<ol class="ranks">${rows.map((f, i) => {
    const ch = G.CHARACTERS.find((c) => c.id === f.character) || G.CHARACTERS[0];
    return `<li class="${f.me ? 'me-row' : ''}"><span class="rk">${i + 1}</span>${mascot(ch, { size: 34 })}<span class="nm"><b>${esc(f.me ? T('you') : f.name)}</b><small title="${f.date ? esc(T('updated', { date: f.date })) : ''}">${esc(T('lv_short', { n: G.levelInfo(f.xp).level }))} · ${esc(T(f.stamps === 1 ? 'n_place' : 'n_places', { n: f.stamps }))}</small></span><span class="xp">${nf(f.xp)} XP</span>${f.me ? '' : `<button type="button" class="x" data-unfriend="${esc(f.id)}" aria-label="${esc(T('remove'))}">✕</button>`}</li>`;
  }).join('')}</ol>`;
}

function bindProfile() {
  $('map-theme')?.addEventListener('change', (e) => { store.set('mapTheme', e.target.value); applyTheme(); });
  $('offline-btn')?.addEventListener('click', saveOffline);
  const msg = $('friend-msg');
  $('share-code').addEventListener('click', async () => {
    const code = G.myCode(playerName());
    try {
      if (navigator.share) { await navigator.share({ text: `${T('app_name')}: ${code}` }); return; }
      await navigator.clipboard.writeText(code); msg.textContent = T('code_copied');
    } catch { msg.innerHTML = `<span class="sel">${esc(code)}</span>`; }
  });
  const add = () => {
    const f = G.addFriendCode($('friend-code').value);
    if (!f) { msg.textContent = T('bad_code'); return; }
    renderView(); $('friend-msg').textContent = T('friend_added', { name: f.name });
  };
  $('add-friend').addEventListener('click', add);
  $('friend-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });
  document.querySelectorAll('[data-unfriend]').forEach((b) => b.addEventListener('click', () => { G.removeFriend(b.dataset.unfriend); renderView(); }));
  $('pname').addEventListener('change', (e) => { G.setName(e.target.value); renderMapChrome(); });
  $('lang').addEventListener('change', (e) => { state.lang = e.target.value; try { localStorage.setItem('damga:lang', state.lang); } catch {} renderAll(); });
}

/* ---------- search: the bar on the map ---------- */
const fold = (x) => String(x || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
// Words that mean a whole kind of place, in four languages (already folded: no accents).
const CAT_WORDS = [
  ['pharmacy', 'hospital', /^(eczane|pharmac|apothek|аптек)/, 'pharmacy'],
  ['hospital', 'hospital', /^(hastane|acil|hospital|krankenhaus|klinik|больниц)/, 'hospital'],
  ['police', 'sos', /^(polis|karakol|police|polizei|полиц)/, 'police'],
  ['worship', 'mosque', /^(cami|mescit|kilise|sinagog|ibadet|mosque|church|synagog|moschee|kirche|мечет|церк)/, 'worship'],
  ['mall', 'market', /^(avm|alisveris|mall|shopping|einkauf)/, 'malls'],
  ['food', 'food', /^(restoran|lokanta|yemek|restaurant|food|essen|ресторан|еда)/, 'restaurant'],
  ['cafe', 'cafe', /^(kafe|cafe|kahve|coffee|kaffee|кафе|кофе)/, 'cafe'],
  ['atm', 'atm', /^(atm|bankamatik|geldautomat|bankomat|банкомат|nakit|cash)/, 'atm'],
  ['toilets', 'wc', /^(tuvalet|wc|toilet|lavabo|klo|туалет)/, 'toilets']
];
// One-tap searches shown when the bar is empty: the things travellers look for most.
const QUICK = [['restaurant', 'food'], ['cafe', 'cafe'], ['atm', 'atm'], ['toilets', 'wc'], ['pharmacy', 'hospital'], ['worship', 'mosque'], ['hospital', 'hospital']];
// Food words look inside cuisine and names: "döner", "balık", "vegan"...
const FOOD_WORDS = [[/^(kebap|kebab)/, ['kebab', 'kebap']], [/^doner/, ['doner', 'kebab']], [/^(balik|fish|seafood)/, ['fish', 'seafood', 'balik']], [/^pide/, ['pide']], [/^kofte/, ['kofte', 'meatball']],
  [/^pizza/, ['pizza']], [/^burger/, ['burger']], [/^(kahvalti|breakfast)/, ['breakfast', 'kahvalti']], [/^(meyhane)/, ['meyhane']], [/^(lahmacun)/, ['lahmacun']], [/^(iskender)/, ['iskender']],
  [/^(corba|soup)/, ['soup', 'corba']], [/^(tatli|dessert|baklava)/, ['dessert', 'baklava', 'tatli']]];
const PLACE_KINDS = [['cafe', 'cafe', 'cafe'], ['atm', 'atm', 'atm'], ['food', 'food', 'restaurant'], ['worship', 'mosque', 'worship'], ['mall', 'market', 'malls'], ['hospital', 'hospital', 'hospital'], ['pharmacy', 'hospital', 'pharmacy'], ['police', 'sos', 'police']];

// Result subtitle: kind, plus "open now"/"closed", toilet fee, when known.
function placeLabel(p, kind) {
  const o = openNow(p.hours);
  return [kind, o === true ? T('open_now') : o === false ? T('closed_now') : '', p.fee === false ? T('free') : p.fee === true ? T('paid') : ''].filter(Boolean).join(' · ');
}
function quickChips() {
  $('mresults').innerHTML = `<li class="quick">${QUICK.map(([k, icon]) => `<button type="button" data-quick="${k}">${ico(icon)}<span>${esc(T(k))}</span></button>`).join('')}</li>`;
  $('mresults').hidden = false;
}
function localSearch(q) {
  const f = fold(q).trim(), h = here(), pl = state.places || {};
  if (f.length < 2) return [];
  const hits = [], seen = new Set();
  const push = (x) => { const k = (x.p.id || '') + x.p.lat + ',' + x.p.lon; if (!seen.has(k)) { seen.add(k); hits.push({ ...x, d: distanceM(h, x.p) }); } };
  // 1. A whole category ("eczane", "mosque")
  for (const [kind, icon, re, label] of CAT_WORDS) if (re.test(f) || f === fold(T(label))) for (const p of nearest(pl[kind], 15)) push({ kind: 'place', p, icon, label: placeLabel(p, T(label)) });
  // 2. Food types and diets
  const diet = /^(vegan|vejetaryen|vegetarian)/.test(f) ? 'vegetarian' : /^(helal|halal)/.test(f) ? 'halal' : /^(koser|kosher)/.test(f) ? 'kosher' : '';
  const fw = FOOD_WORDS.find(([re]) => re.test(f));
  if (diet || fw) for (const p of nearest(pl.food, 400)) {
    const text = fold(p.cuisine + ' ' + p.name + ' ' + p.local);
    if ((diet && p[diet]) || (fw && fw[1].some((w) => text.includes(w)))) push({ kind: 'place', p, icon: 'food', label: [T('restaurant'), cuisineText(p.cuisine)].filter(Boolean).join(' · ') });
  }
  // 3. Names: passport stops first, then every kind of place
  for (const s of allStops()) if (fold(s.name).includes(f)) push({ kind: 'stop', p: s, icon: 'collection', label: T('cat_' + ((STOP_INFO[s.id]?.cat || s.cat || ['history'])[0])) });
  for (const [kind, icon, label] of PLACE_KINDS) for (const p of pl[kind] || []) if (fold(p.name).includes(f) || fold(p.local).includes(f)) push({ kind: 'place', p, icon, label: placeLabel(p, T(label)) });
  // Stop names are in English; a local name ("Ayasofya") that matches a place of worship right at a stop finds the stop too.
  // (Shops and restaurants borrow landmark names, so only places of worship count.)
  const stops = allStops();
  for (const x of [...hits]) if (x.kind === 'place' && x.icon === 'mosque' && (fold(x.p.name).includes(f) || fold(x.p.local).includes(f))) {
    const st = stops.find((t) => distanceM(t, x.p) < 120 && (STOP_INFO[t.id]?.cat || t.cat || []).includes('worship'));
    if (st) push({ kind: 'stop', p: st, icon: 'collection', label: T('cat_' + ((STOP_INFO[st.id]?.cat || st.cat || ['history'])[0])) });
  }
  return hits.sort((a, b) => (b.kind === 'stop') - (a.kind === 'stop') || a.d - b.d).slice(0, 20);
}

// Anything else (a café chain, a hotel, an ATM): OpenStreetMap search around the visitor.
const WEB_ICON = { restaurant: 'food', cafe: 'food', fast_food: 'food', bar: 'food', pub: 'food', place_of_worship: 'mosque', hospital: 'hospital', clinic: 'hospital', pharmacy: 'hospital', police: 'sos', museum: 'museum', mall: 'market', supermarket: 'market', marketplace: 'market', park: 'park', viewpoint: 'view', attraction: 'history', monument: 'history', castle: 'history' };
async function webSearch(q) {
  const h = here(), r = 0.25;
  const u = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${h.lat}&lon=${h.lon}&limit=12&bbox=${h.lon - r},${h.lat - r},${h.lon + r},${h.lat + r}`;
  try {
    const d = await (await fetch(u)).json();
    return (d.features || []).map((f) => {
      const pr = f.properties || {}, [lon, lat] = f.geometry.coordinates;
      const p = { name: pr.name || pr.street || '', local: pr.name || '', lat, lon, street: [pr.street, pr.housenumber].filter(Boolean).join(' '), phone: '', cuisine: '' };
      const label = [String(pr.osm_value || '').replace(/_/g, ' '), pr.district || pr.city].filter(Boolean).join(' · ');
      return { kind: 'web', p, icon: WEB_ICON[pr.osm_value] || 'pin', label, d: distanceM(h, p) };
    }).filter((x) => x.p.name).sort((a, b) => a.d - b.d);
  } catch { return []; }
}

let searchTimer, searchRun = 0, lastHits = [];
function drawResults(local, web, loadingWeb) {
  lastHits = [...local, ...(web || [])];
  const row = (x, i) => `<li><button type="button" data-hit="${i}">${ico(x.icon)}<span><b>${esc(x.p.name || x.p.local || x.label.split(' · ')[0])}</b><small>${esc(x.label)}</small></span><em>${fmtDist(x.d)}</em></button></li>`;
  const el = $('mresults');
  el.innerHTML = local.map(row).join('')
    + (web && web.length ? `<li class="rhead">${esc(T('web_results'))}</li>` + web.map((x, i) => row(x, local.length + i)).join('') : '')
    + (loadingWeb ? `<li class="rhead">${esc(T('loading'))}</li>` : '')
    + (!local.length && !(web && web.length) && !loadingWeb ? `<li class="rhead">${esc(T('none'))}</li>` : '');
  el.hidden = false;
}
function onSearchInput(q) {
  clearTimeout(searchTimer);
  $('mq-clear').hidden = !q;
  if (!q.trim()) { quickChips(); return; }
  if (fold(q).trim().length < 2) { $('mresults').hidden = true; return; }
  searchTimer = setTimeout(async () => {
    const run = ++searchRun, local = localSearch(q);
    const wantWeb = local.length < 6 && fold(q).trim().length >= 3;
    drawResults(local, null, wantWeb);
    if (!wantWeb) return;
    const web = await webSearch(q);
    if (run === searchRun) drawResults(local, web, false);
  }, 220);
}
// Leave search mode: the bar slides back to the bottom.
function endSearch(clear) {
  if (clear) { $('mq').value = ''; $('mq-clear').hidden = true; }
  $('mresults').hidden = true; $('mq').blur();
  document.body.classList.remove('searching');
}
function openHit(i) {
  const x = lastHits[i]; if (!x) return;
  endSearch(false); $('tools-sheet').hidden = true;
  if (x.kind === 'stop') { if (x.p.city && x.p.city !== state.city) setCity(x.p.city); openStop(x.p.id); return; }
  state.tab = 'map'; state.page = null; renderNav(); renderView();
  if (map) map.easeTo({ center: [x.p.lon, x.p.lat], zoom: 17, duration: 700 });
  openPlace(x.p, x.label.split(' · ')[0]);
}

/* ---------- routes drawn in the app ---------- */
// Walking (or driving, for far places) along real streets, from the free OSRM servers of OpenStreetMap Germany.
const ROUTER = 'https://routing.openstreetmap.de';
async function fetchRoute(points, car, steps = false) {
  const prof = car ? 'routed-car/route/v1/driving' : 'routed-foot/route/v1/foot';
  const path = points.map((p) => `${p.lon.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
  try {
    const d = await (await fetch(`${ROUTER}/${prof}/${path}?overview=full&geometries=geojson${steps ? '&steps=true' : ''}`)).json();
    const r = d.routes && d.routes[0];
    if (r) return { coords: r.geometry.coordinates, dist: r.distance, dur: r.duration, real: true, steps: steps ? r.legs.flatMap((l) => l.steps) : [] };
  } catch { /* fall back to a straight line */ }
  let dist = 0; for (let i = 1; i < points.length; i++) dist += distanceM(points[i - 1], points[i]) * 1.3;
  return { coords: points.map((p) => [p.lon, p.lat]), dist, dur: dist / (car ? 5 : 1.3), real: false, steps: [] };
}
function drawLine(id, coords, { dashed = false, fit = true } = {}) {
  const draw = () => {
    const data = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } }, { type: 'Feature', geometry: { type: 'Point', coordinates: coords[coords.length - 1] } }] };
    if (map.getSource(id)) map.getSource(id).setData(data);
    else {
      map.addSource(id, { type: 'geojson', data });
      map.addLayer({ id: id + '-case', type: 'line', source: id, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 10 } });
      map.addLayer({ id, type: 'line', source: id, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#7c3aed', 'line-width': 6, ...(dashed ? { 'line-dasharray': [1.6, 1.1] } : {}) } });
      // the end of the line: a white-ringed violet dot
      map.addLayer({ id: id + '-end', type: 'circle', source: id, filter: ['==', '$type', 'Point'], paint: { 'circle-radius': 8, 'circle-color': '#7c3aed', 'circle-stroke-color': '#fff', 'circle-stroke-width': 3 } });
    }
    if (!fit) return;
    const lons = coords.map((c) => c[0]), lats = coords.map((c) => c[1]);
    map.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], { padding: { top: 170, bottom: 240, left: 50, right: 50 }, pitch: 45, duration: 900 });
  };
  setTimeout(() => { map.resize(); if (map.isStyleLoaded()) draw(); else map.once('idle', draw); }, 60);
}
function clearLines() {
  if (!map) return;
  endNav(true);
  for (const id of ['route', 'plan']) for (const l of [id + '-end', id, id + '-case']) if (map.getLayer(l)) map.removeLayer(l);
  for (const id of ['route', 'plan']) if (map.getSource(id)) map.removeSource(id);
  $('route-chip').hidden = true;
}

/* ---------- turn-by-turn navigation ---------- */
// "Rota çiz" starts guiding at once: the map follows you heading-up, the next turn is shown (and spoken),
// the route is recalculated when you walk off it, and arriving ends it.
let nav = null, wakeLock = null;
const bearing = (a, b) => { const r = Math.PI / 180, y = Math.sin((b.lon - a.lon) * r) * Math.cos(b.lat * r), x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lon - a.lon) * r); return (Math.atan2(y, x) / r + 360) % 360; };
const pt = (c) => ({ lat: c[1], lon: c[0] });
function stepText(st) {
  if (!st) return '';
  const m = st.maneuver || {}, mod = (m.modifier || 'straight').replace(' ', '_');
  let key = m.type === 'arrive' ? 'nav_arrive' : m.type === 'depart' ? 'nav_depart' : /roundabout|rotary/.test(m.type) ? 'nav_round' : 'nav_' + mod;
  const txt = T(key, { n: m.exit || 1 });
  return st.name && m.type !== 'arrive' ? `${txt} · ${st.name}` : txt;
}
const STEP_ICON = { left: '↰', right: '↱', slight_left: '↖', slight_right: '↗', sharp_left: '↰', sharp_right: '↱', straight: '↑', uturn: '↶' };
function stepIcon(st) { const m = st?.maneuver || {}; return m.type === 'arrive' ? '◎' : /roundabout|rotary/.test(m.type) ? '⟳' : STEP_ICON[(m.modifier || 'straight').replace(' ', '_')] || '↑'; }
function speak(text) {
  if (!nav || nav.mute || !('speechSynthesis' in window)) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = { tr: 'tr-TR', de: 'de-DE', ru: 'ru-RU' }[state.lang] || 'en-US'; speechSynthesis.speak(u); } catch { /* no voice */ }
}
async function routeTo(dest) {
  if (!map) return;
  clearLines();
  $('place-card').hidden = true; $('tools-sheet').hidden = true;
  state.tab = 'map'; state.page = null; renderNav(); renderView();
  // Guiding needs the real position: ask for it now if we don't have it yet.
  if (!state.pos) { try { const p = await getPosition(8000); state.pos = { lat: p.lat, lon: p.lon, acc: p.acc }; startWatch(); moveMe(); } catch { /* show the route from the map centre */ } }
  const h = state.pos || here(), car = distanceM(h, dest) > 4000;
  nav = { dest, car, mute: store.get('navMute', false), step: 1, lastReroute: 0, spoken: -1, live: !!state.pos };
  document.body.classList.add('navigating');
  $('nav-top').innerHTML = `<span class="nav-ico">…</span><div><b>${esc(T('loading'))}</b></div>`;
  $('nav-top').hidden = $('nav-bottom').hidden = false;
  await navRoute(h, true);
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { /* not allowed */ }
}
async function navRoute(from, first) {
  if (!nav) return;
  const r = await fetchRoute([from, nav.dest], nav.car, true);
  if (!nav) return;
  nav.r = r; nav.step = r.steps.length > 1 ? 1 : 0; nav.spoken = -1;
  drawLine('route', r.coords, { fit: !nav.live });
  if (first && nav.live) map.easeTo({ center: [from.lon, from.lat], zoom: 17.5, pitch: 60, bearing: r.coords.length > 1 ? bearing(pt(r.coords[0]), pt(r.coords[Math.min(3, r.coords.length - 1)])) : 0, duration: 900 });
  navDraw();
}
function navDraw() {
  if (!nav || !nav.r) return;
  const r = nav.r, pos = state.pos || here();
  const st = r.steps[nav.step];
  const toTurn = st ? distanceM(pos, pt(st.maneuver.location)) : distanceM(pos, nav.dest);
  // remaining: straight to the next turn, then the route's own lengths after it
  const left = st ? toTurn + r.steps.slice(nav.step).reduce((a, x) => a + x.distance, 0) : distanceM(pos, nav.dest);
  const secs = left / (nav.car ? (r.dist / r.dur || 8) : 1.3);
  const eta = new Date(Date.now() + secs * 1000).toLocaleTimeString(state.lang === 'en' ? 'en-GB' : state.lang, { hour: '2-digit', minute: '2-digit' });
  const arrive = st && st.maneuver.type === 'arrive';
  const line = arrive ? (nav.dest.name || nav.dest.local || T('nav_follow')) : st ? stepText(st) : T('nav_follow');
  $('nav-top').innerHTML = `<span class="nav-ico" aria-hidden="true">${st ? stepIcon(st) : '↑'}</span><div><small>${esc(toTurn < 10 ? T('nav_now') : T(arrive ? 'nav_dest_in' : 'nav_in', { d: fmtDist(toTurn) }))}</small><b>${esc(line)}</b></div>`
    + (!nav.live ? `<p class="nav-note">${esc(T('nav_noloc'))}</p>` : '') + (!r.real ? `<p class="nav-note">${esc(T('route_straight'))}</p>` : '');
  $('nav-bottom').innerHTML = `<div><b>${Math.max(1, Math.round(secs / 60))} ${esc(T('min_short'))}</b><small>${fmtDist(left)} · ${esc(T('nav_eta', { t: eta }))}</small></div>
    <button type="button" class="round sm" data-nav-mute aria-label="${esc(T('nav_sound'))}" aria-pressed="${!nav.mute}">${ico(nav.mute ? 'mute' : 'sound')}</button>
    <button type="button" class="round sm" data-nav-overview aria-label="${esc(T('nav_overview'))}">${ico('map')}</button>
    <button type="button" class="btn nav-end" data-nav-end>${esc(T('nav_end'))}</button>`;
  if (st && !arrive && nav.spoken !== nav.step) { nav.spoken = nav.step; speak(line); }
}
function navUpdate() {
  if (!nav || !nav.r || !state.pos) return;
  const pos = state.pos, r = nav.r;
  if (!nav.live) { nav.live = true; }
  // Arrived?
  if (distanceM(pos, nav.dest) < 25 + Math.min(pos.acc || 0, 30)) { speak(T('nav_arrive')); toast(T('nav_arrive') + ' ' + (nav.dest.name || '')); endNav(); return; }
  // Next turn passed?
  const st = r.steps[nav.step];
  if (st && st.maneuver.type !== 'arrive' && distanceM(pos, pt(st.maneuver.location)) < 15) nav.step = Math.min(nav.step + 1, r.steps.length - 1);
  // Off the route by more than ~40 m: recalculate (at most every 15 s).
  let off = Infinity; for (let i = 0; i < r.coords.length; i += 1) off = Math.min(off, distanceM(pos, pt(r.coords[i])));
  if (r.real && off > 40 + Math.min(pos.acc || 0, 40) && Date.now() - nav.lastReroute > 15000) {
    nav.lastReroute = Date.now(); toast(T('nav_off')); navRoute(pos, false); return;
  }
  // Follow the walker, heading toward the next point of the route.
  if (!nav.overview) {
    let k = 0, best = Infinity; r.coords.forEach((c, i) => { const d = distanceM(pos, pt(c)); if (d < best) { best = d; k = i; } });
    const ahead = pt(r.coords[Math.min(k + 2, r.coords.length - 1)]);
    map.easeTo({ center: [pos.lon, pos.lat], zoom: 17.5, pitch: 60, bearing: distanceM(pos, ahead) > 5 ? bearing(pos, ahead) : map.getBearing(), duration: 900 });
  }
  navDraw();
}
function endNav(silent) {
  if (!nav) return;
  nav = null;
  document.body.classList.remove('navigating');
  $('nav-top').hidden = $('nav-bottom').hidden = true;
  try { speechSynthesis.cancel(); } catch { /* none */ }
  try { wakeLock?.release(); } catch { /* none */ } wakeLock = null;
  if (!silent) { clearLines(); map.easeTo({ bearing: 0, pitch: 58, duration: 600 }); renderMapChrome(); }
}

// Install: Android/Chrome gives us a prompt; iPhone needs the Share menu.
let installEvt = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
function installCard() {
  if (isStandalone()) return '';
  if (installEvt) return `<button type="button" class="install" data-install>${ico('share')}<span><b>${esc(T('install'))}</b><small>${esc(T('install_d'))}</small></span></button>`;
  if (isIOS()) return `<div class="install">${ico('share')}<span><b>${esc(T('install'))}</b><small>${esc(T('install_ios'))}</small></span></div>`;
  return '';
}

function toolsList() {
  return `${installCard()}<button type="button" class="tool tool-plan wide" data-page="plan">${ico('walk')}<span>${esc(T('t_plan'))}<small>${esc(T('plan_teaser'))}</small></span></button><div class="tools">${[['fare', 'taxi', 't_fare'], ['fx', 'atm', 't_fx'], ['talk', 'talk', 't_talk'], ['pray', 'pray', 't_pray'], ['cal', 'cal', 't_cal'], ['sos', 'sos', 't_sos']]
    .map(([p, i, l]) => `<button type="button" class="tool tool-${p}" data-page="${p}">${ico(i)}<span>${esc(T(l))}</span></button>`).join('')}</div>`;
}

/* ---------- offline map ---------- */
// Vector tiles exist up to zoom 14 (closer views are drawn from them), so a city fits in a few hundred files.
const MAP_CACHE = 'kesif-map';
const lon2x = (lon, z) => Math.floor((lon + 180) / 360 * 2 ** z);
const lat2y = (lat, z) => { const r = lat * Math.PI / 180; return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 2 ** z); };
async function saveOffline() {
  const msg = $('offline-msg'), btn = $('offline-btn');
  if (!('caches' in window)) { msg.textContent = T('offline_fail'); return; }
  btn.disabled = true; msg.textContent = T('offline_progress', { n: 0, total: '…' });
  try {
    const style = await (await fetch(MAP_STYLE)).json();
    const tj = await (await fetch(style.sources.openmaptiles.url)).json();
    const tpl = tj.tiles[0];
    // Box around the city's stops (or around the visitor in Near me), with a little margin.
    const pts = city().stamps.length ? city().stamps : [here()];
    const lats = pts.map((p) => p.lat), lons = pts.map((p) => p.lon), m = 0.012;
    const box = [Math.min(...lons) - m, Math.min(...lats) - m, Math.max(...lons) + m, Math.max(...lats) + m];
    const urls = [MAP_STYLE, style.sources.openmaptiles.url];
    for (const ext of ['.json', '.png', '@2x.json', '@2x.png']) urls.push(style.sprite + ext);
    for (const font of ['Noto Sans Regular', 'Noto Sans Bold', 'Noto Sans Italic']) for (const range of ['0-255', '256-511', '8192-8447']) urls.push(style.glyphs.replace('{fontstack}', encodeURIComponent(font)).replace('{range}', range));
    for (let z = 10; z <= 14; z++) {
      for (let x = lon2x(box[0], z); x <= lon2x(box[2], z); x++) for (let y = lat2y(box[3], z); y <= lat2y(box[1], z); y++) urls.push(tpl.replace('{z}', z).replace('{x}', x).replace('{y}', y));
    }
    const cache = await caches.open(MAP_CACHE);
    let done = 0;
    const queue = [...urls];
    const worker = async () => { while (queue.length) { const u = queue.shift(); try { if (!(await cache.match(u))) await cache.add(u); } catch { /* skip one bad file */ } done++; if (done % 10 === 0) msg.textContent = T('offline_progress', { n: done, total: urls.length }); } };
    await Promise.all([worker(), worker(), worker(), worker()]);
    // Places for this city pack, so lists work offline too.
    if (CITIES[state.city]) try { await cache.add(`./data/places-${state.city}.json`); } catch { /* ok */ }
    store.set('offline:' + state.city, new Date().toISOString().slice(0, 10));
    msg.textContent = T('offline_done', { city: cityName(), n: urls.length });
  } catch { msg.textContent = T('offline_fail'); }
  btn.disabled = false;
}

/* ---------- day plan ---------- */
// Minutes to spend at a stop, by kind of place.
const VISIT = { museum: 60, history: 40, worship: 25, market: 45, view: 25, park: 35 };
function buildPlan(hours) {
  const c = city(), start = here(), budget = hours * 60;
  let pool = c.stamps.filter((s) => !G.hasStamp(c.id, s.id));
  if (!pool.length) pool = [...c.stamps];
  const plan = [];
  let at = start, used = 0, walked = 0;
  while (pool.length) {
    // Nearest next stop from where we are (greedy route: simple and good enough on foot).
    pool.sort((a, b) => distanceM(at, a) - distanceM(at, b));
    const s = pool.shift(), d = distanceM(at, s);
    const walk = Math.round(d * 1.3 / 80), ride = d > 2000;
    const leg = ride ? Math.round(d * 1.4 / 300 + 5) : Math.max(1, walk);
    const cat = (STOP_INFO[s.id]?.cat || s.cat || ['history'])[0], stay = VISIT[cat] || 35;
    if (used + leg + stay > budget) { if (plan.length) continue; }
    plan.push({ s, leg, ride, stay, startAt: used + leg });
    used += leg + stay; if (!ride) walked += d * 1.3; at = s;
    if (used >= budget) break;
  }
  return { plan, used, walked };
}
function renderPlan() {
  const h = state.hours || 4, { plan, used, walked } = buildPlan(h);
  const now = new Date(), fmt = (m) => new Date(now.getTime() + m * 60000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });
  state.lastPlan = plan;
  return `${backHead(T('t_plan'))}
  <section class="panel"><p class="muted">${esc(T('plan_intro', { city: cityName() }))}</p>
    <div class="seg">${[2, 4, 6, 8].map((n) => `<button type="button" data-hours="${n}" aria-pressed="${n === h}">${esc(T('hours', { n }))}</button>`).join('')}</div></section>
  ${plan.length ? `<ol class="timeline">${plan.map((x, i) => `<li>
      <span class="tl-leg">${ico(x.ride ? 'car' : 'walk')}${esc(T(x.ride ? 'plan_ride' : 'plan_walk', { n: x.leg }))}</span>
      <button type="button" class="tl-stop" data-stop="${x.s.id}"><b class="tl-n">${i + 1}</b><span><b>${esc(x.s.name)}</b><small>${fmt(x.startAt)} · ${esc(T('plan_visit', { n: x.stay }))}</small></span>${G.hasStamp(x.s.city || state.city, x.s.id) ? ico('check') : `<em>+${G.XP_STAMP} XP</em>`}</button>
    </li>`).join('')}</ol>
    <p class="muted center">${esc(T('plan_total', { n: plan.length, km: (walked / 1000).toFixed(1), end: fmt(used) }))}</p>
    ${lateAt(now, used) ? `<p class="note">${esc(T('plan_late'))}</p>` : ''}
    <button type="button" class="btn big" data-plan-map>${ico('map')}${esc(T('plan_show'))}</button>
    <a class="btn ghost big" href="${planGmaps(plan)}" target="_blank" rel="noopener">${esc(T('plan_gmaps'))} →</a>`
    : `<p class="muted center">${esc(T('plan_empty'))}</p>`}`;
}
// Does the plan run past 18:00 Istanbul time, when most museums are closing?
function lateAt(now, minutes) {
  const end = new Date(now.getTime() + minutes * 60000);
  const h = +end.toLocaleTimeString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Europe/Istanbul' }).slice(0, 2);
  const startH = +now.toLocaleTimeString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Europe/Istanbul' }).slice(0, 2);
  return h >= 18 || h < 7 || startH >= 17 || end.getDate() !== now.getDate();
}
function planGmaps(plan) {
  const h = here(), name = (s) => `${s.name}, ${CITIES[s.city]?.name.en || cityName()}`;
  const last = plan[plan.length - 1]; if (!last) return '#';
  const way = plan.slice(0, -1).slice(0, 8).map((x) => name(x.s)).join('|');
  return `https://www.google.com/maps/dir/?api=1&origin=${h.lat},${h.lon}&destination=${encodeURIComponent(name(last.s))}${way ? `&waypoints=${encodeURIComponent(way)}` : ''}&travelmode=walking`;
}
// Draw the planned route on real walking streets (straight lines if the route service is down).
async function showPlanOnMap() {
  const plan = state.lastPlan || []; if (!map || !plan.length) return;
  clearLines();
  state.tab = 'map'; state.page = null; renderNav(); renderView();
  const r = await fetchRoute([here(), ...plan.slice(0, 11).map((x) => x.s)], false);
  drawLine('plan', r.coords, { dashed: true });
}

/* ---------- tool pages (from v1) ---------- */
// avail: was this kind of place downloaded? false shows "no data yet" instead of "nothing nearby".
function rowsHtml(items, extra, avail = !!state.places) {
  if (!items.length) return `<p class="muted">${esc(T(state.loading ? 'loading' : avail ? 'none' : 'no_places'))}</p>`;
  return `<ul class="list">${items.map((p) => `<li class="item"><span class="l"><a href="${mapUrl(p)}" target="_blank" rel="noopener">${esc(p.name || p.local || (p.kind ? T(p.kind) : '?'))}</a>${extra ? extra(p) : ''}</span><span class="r">${fmtDist(p.d)}</span></li>`).join('')}</ul>`;
}
function nextPrayer(pr) { const now = clock(); for (const k of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) if (pr[k] > now) return { k, time: pr[k] }; return { k: 'Fajr', time: pr.Fajr }; }
function pickWorship(list) {
  const by = { muslim: [], christian: [], jewish: [], other: [] };
  for (const p of nearest(list, 300)) (by[p.religion] || by.other).push(p);
  return [...by.muslim.slice(0, 3), ...by.christian.slice(0, 2), ...by.jewish.slice(0, 2), ...by.other.slice(0, 1)].sort((a, b) => a.d - b.d);
}

function renderPray() {
  const pr = state.prayer, pl = state.places, np = pr ? nextPrayer(pr) : null, wx = state.weather;
  return `${backHead(T('t_pray'))}
  <section class="panel">
    <div class="row"><h2>${esc(T('prayer'))}</h2><span class="tag">${esc(T('prayer_src'))}</span></div>
    ${pr ? `<p><b>${esc(T('next_prayer', { name: T('p_' + np.k), time: np.time }))}</b></p><div class="ptimes">${['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((k) => `<span${np.k === k ? ' class="on"' : ''}><small>${esc(T('p_' + k))}</small>${esc(pr[k])}</span>`).join('')}</div>` : `<p class="muted">${esc(T('loading'))}</p>`}
  </section>
  <section class="panel"><div class="row"><h2>${esc(T('worship'))}</h2><span class="tag">${esc(T('all_faiths'))}</span></div>
    ${rowsHtml(pl?.worship ? pickWorship(pl.worship) : [], (p) => `<small>${esc(T(relKey(p.religion)))}</small>`, !!pl?.worship)}${pl?.worship ? '' : gmLink(T('gm_worship'))}<p class="muted">${esc(T('worship_tip'))}</p></section>
  <section class="panel"><h2>${esc(T('eat'))}</h2>
    ${rowsHtml(pl?.food ? nearest(pl.food, 8) : [], (p) => { const tg = [p.halal && T('halal'), p.vegetarian && T('vegetarian'), p.kosher && T('kosher')].filter(Boolean); return `<small>${esc(cuisineText(p.cuisine))}${tg.length ? ' · ' + tg.map(esc).join(' · ') : ''}${p.phone ? ` · <span class="sel">${esc(p.phone)}</span>` : ''}</small>`; }, !!pl?.food)}
    ${pl?.food ? '' : gmLink(T('gm_food'))}<p class="muted">${esc(T('eat_tip'))}</p></section>
  <section class="panel"><h2>${esc(T('malls'))}</h2>${rowsHtml(pl?.mall ? nearest(pl.mall, 4) : [], null, !!pl?.mall)}</section>`;
}

function renderFare() {
  const c = city(), tx = c.taxi, sel = store.get('route:' + c.id, 0);
  return `${backHead(T('t_fare'))}
  <section class="panel">
    <h2>${esc(T('fare_title'))}</h2><p class="muted">${esc(T('fare_intro'))}</p>
    ${tx.routes.length ? `<label for="route">${esc(T('route'))} · ${esc(cityName())}</label>
    <select id="route">${tx.routes.map((r, i) => `<option value="${i}"${i === sel ? ' selected' : ''}>${esc(r[0])} · ~${r[1]} km</option>`).join('')}</select>${tx.estimate ? `<p class="note">${esc(T('fare_estimate'))}</p>` : ''}` : `<p class="note">${esc(T('fare_estimate'))}</p>`}
    <label for="km">${esc(T('custom_km'))}</label>
    <input id="km" type="number" inputmode="decimal" min="0.5" max="200" step="0.5" placeholder="${tx.routes[sel] ? tx.routes[sel][1] : 5}">
    <div class="fare"><small>${esc(T('fair_meter'))}</small><b id="fare"></b><small>${esc(T('fare_detail', { open: tx.open, km: tx.perKm, min: tx.min }))}</small></div>
  </section>
  <section class="panel"><h2>${esc(T('watch'))}</h2><ul class="bullets"><li>${esc(T('w1'))}</li><li>${esc(T('w2'))}</li><li>${esc(T('w3'))}</li><li>${esc(T('w4'))}</li></ul></section>
  ${c.transit.length ? `<section class="panel"><div class="row"><h2>${esc(T('transit'))}</h2>${c.card ? `<span class="tag">${esc(c.card)}</span>` : ''}</div>
    <ul class="list">${c.transit.map(([k, v]) => `<li class="item"><span class="l">${esc(T(k))}</span><span class="r">${esc(v)}</span></li>`).join('')}</ul>
    ${c.card ? `<p class="muted">${esc(T('card_tip', { card: c.card }))}</p>` : ''}</section>` : ''}
  <p class="muted center">${esc(T('prices_checked', { date: CHECKED }))}</p>`;
}
function bindFare() {
  const tx = city().taxi, route = $('route'), km = $('km');
  const calc = () => {
    const custom = parseFloat(km.value), dist = custom > 0 ? custom : (route ? tx.routes[+route.value][1] : 5);
    const base = Math.max(tx.min, tx.open + tx.perKm * dist), r10 = (n) => Math.round(n / 10) * 10;
    $('fare').textContent = `${nf(r10(base))} – ${nf(r10(base * 1.15))} TL`;
  };
  if (route) route.addEventListener('change', () => { store.set('route:' + state.city, +route.value); km.value = ''; km.placeholder = tx.routes[+route.value][1]; calc(); });
  km.addEventListener('input', calc);
  calc();
  G.markFareUsed();
}

/* ---------- weather: now, the next hours and the next days (Open-Meteo) ---------- */
const WX_ICON = (c) => (c === 0 ? '☀️' : c <= 2 ? '⛅' : c === 3 ? '☁️' : c <= 48 ? '🌫️' : c <= 57 ? '🌦️' : c <= 67 ? '🌧️' : c <= 77 ? '🌨️' : c <= 82 ? '🌧️' : c <= 86 ? '🌨️' : '⛈️');
function renderWx() {
  const wx = state.weather, loc = { en: 'en-GB', tr: 'tr-TR', de: 'de-DE', ru: 'ru-RU' }[state.lang];
  if (!wx || !wx.hours) return `${backHead(T('weather'))}<p class="muted pad">${esc(T('loading'))}</p>`;
  const day = (t, i) => (i === 0 ? T('today') : new Date(t + 'T12:00:00').toLocaleDateString(loc, { weekday: 'long' }));
  const tip = wx.days[0].uv >= 7 ? T('wx_uv') : wx.days[0].rain >= 60 ? T('wx_rain') : wx.temp >= 30 ? T('wx_hot') : wx.temp <= 5 ? T('wx_cold') : '';
  return `${backHead(T('weather') + ' · ' + placeName())}
  <section class="panel wx-now"><span class="wx-big" aria-hidden="true">${WX_ICON(wx.code)}</span><div><b>${wx.temp}°</b><small>${esc(weatherText(state.lang, wx.code))} · ${esc(T('wx_feels', { n: wx.feels }))}</small><small>${esc(T('wx_wind', { n: wx.wind }))} · ${esc(T('wx_hum', { n: wx.hum }))}</small></div></section>
  ${tip ? `<p class="note">${esc(tip)}</p>` : ''}
  <section class="panel"><h2>${esc(T('wx_hours'))}</h2><div class="wx-hours">${wx.hours.map((h, i) => `<div><small>${i === 0 ? esc(T('now')) : h.t}</small><span aria-hidden="true">${WX_ICON(h.code)}</span><b>${h.temp}°</b>${h.rain >= 20 ? `<em>${h.rain}%</em>` : '<em></em>'}</div>`).join('')}</div></section>
  <section class="panel"><h2>${esc(T('wx_days'))}</h2><ul class="wx-days">${wx.days.map((d, i) => `<li><span>${esc(day(d.t, i))}</span><span aria-hidden="true">${WX_ICON(d.code)}</span><em>${d.rain >= 20 ? d.rain + '%' : ''}</em><b>${d.min}° / ${d.max}°</b></li>`).join('')}</ul>
    <p class="muted">${esc(T('wx_sun', { a: wx.sunrise, b: wx.sunset }))}</p></section>
  <p class="credit">Open-Meteo.com</p>`;
}

/* ---------- money: live exchange rates (cached, so it works offline with the last rates) ---------- */
const FX_LIST = ['EUR', 'USD', 'GBP', 'RUB', 'CHF', 'SAR', 'AZN', 'CNY', 'JPY', 'IRR'];
const FX_DEFAULT = { de: 'EUR', ru: 'RUB', en: 'USD', tr: 'EUR' };
async function fetchRates() {
  const c = store.get('fx', null);
  if (c && Date.now() - c.at < 12 * 3600e3) return c;
  try {
    const d = await (await fetch('https://open.er-api.com/v6/latest/TRY')).json();
    if (d.result === 'success') { const v = { at: Date.now(), day: d.time_last_update_unix * 1000, rates: d.rates }; store.set('fx', v); return v; }
  } catch { /* offline */ }
  return c;
}
function renderFx() {
  const cur = store.get('fxCur', FX_DEFAULT[state.lang] || 'EUR');
  return `${backHead(T('t_fx'))}
  <section class="panel">
    <div class="fx-row"><input id="fx-a" type="number" inputmode="decimal" min="0" step="any" value="${store.get('fxAmt', 100)}" aria-label="${esc(T('fx_amount'))}">
      <select id="fx-cur" aria-label="${esc(T('fx_currency'))}">${FX_LIST.map((c) => `<option${c === cur ? ' selected' : ''}>${c}</option>`).join('')}</select></div>
    <button type="button" class="fx-swap" id="fx-swap" aria-label="${esc(T('fx_swap'))}">⇅</button>
    <div class="fx-out"><b id="fx-b">…</b><small id="fx-rate"></small></div>
    <div class="fx-quick" id="fx-quick"></div>
    <p class="muted"><span id="fx-when"></span> <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">Rates by Exchange Rate API</a></p>
  </section>
  <section class="panel"><h2>${esc(T('fx_tips_t'))}</h2><ul class="bullets"><li>${esc(T('fx_tip1'))}</li><li>${esc(T('fx_tip2'))}</li><li>${esc(T('fx_tip3'))}</li></ul></section>`;
}
async function bindFx() {
  let toTry = store.get('fxDir', true); // true: foreign → TL
  const a = $('fx-a'), sel = $('fx-cur');
  const fx = await fetchRates();
  const draw = () => {
    if (!$('fx-b')) return;
    if (!fx) { $('fx-b').textContent = T('fx_none'); return; }
    const cur = sel.value, per = 1 / fx.rates[cur], amt = parseFloat(a.value) || 0; // per = TL for 1 unit
    const money = (n, c, d) => new Intl.NumberFormat(state.lang === 'en' ? 'en-GB' : state.lang, { style: 'currency', currency: c, maximumFractionDigits: d ?? (n < 10 ? 2 : 0) }).format(n);
    $('fx-b').textContent = toTry ? `${money(amt, cur)} = ${money(amt * per, 'TRY')}` : `${money(amt, 'TRY')} = ${money(amt / per, cur)}`;
    $('fx-rate').textContent = `1 ${cur} = ${money(per, 'TRY', 2)}`;
    $('fx-quick').innerHTML = [20, 50, 100, 250, 500, 1000].map((n) => `<span><b>${money(n, 'TRY')}</b>${money(n / per, cur)}</span>`).join('');
    $('fx-when').textContent = T('fx_when', { d: new Date(fx.day).toLocaleDateString(state.lang === 'en' ? 'en-GB' : state.lang) });
    store.set('fxCur', cur); store.set('fxAmt', a.value); store.set('fxDir', toTry);
  };
  a.addEventListener('input', draw); sel.addEventListener('change', draw);
  $('fx-swap').addEventListener('click', () => { toTry = !toTry; draw(); });
  draw();
}

/* ---------- speak Turkish: phrases with pronunciation, read aloud, or shown big to someone ---------- */
const trPhrase = (tr) => tr.replace('{lang}', LANG_WORD[state.lang] || 'İngilizce');
function renderTalk() {
  const L = state.lang === 'tr' ? 'en' : state.lang;
  let i = 0;
  return `${backHead(T('t_talk'))}
  <p class="muted pad">${esc(T('talk_intro'))}</p>
  ${PHRASE_GROUPS.map(([g, list]) => `<section class="panel"><h2>${esc(T(g))}</h2><ul class="talk">${list.map(([tr, pron, mean]) => `<li>
      <button type="button" class="talk-main" data-big="${esc(trPhrase(tr))}"><b lang="tr">${esc(trPhrase(tr))}</b><small>${esc(state.lang === 'tr' ? mean.tr : `${pron[L] || pron.en} · ${mean[L] || mean.en}`)}</small></button>
      <button type="button" class="round sm" data-say="${esc(trPhrase(tr))}" aria-label="${esc(T('talk_say'))}">${ico('sound')}</button></li>`).join('')}</ul></section>`).join('')}
  <p class="muted pad">${esc(T('talk_tip'))}</p>`;
}
function sayTr(text) {
  if (!('speechSynthesis' in window)) { toast(T('talk_nosound')); return; }
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'tr-TR'; u.rate = 0.85; const v = speechSynthesis.getVoices().find((x) => /^tr/i.test(x.lang)); if (v) u.voice = v; speechSynthesis.speak(u); } catch { toast(T('talk_nosound')); }
}
function showBig(text) {
  const el = $('big');
  el.innerHTML = `<p lang="tr">${esc(text)}</p><small>${esc(T('talk_close'))}</small>`;
  el.hidden = false;
}

function renderCal() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const locale = { en: 'en-GB', tr: 'tr-TR', de: 'de-DE', ru: 'ru-RU' }[state.lang];
  return `${backHead(T('t_cal'))}
  <section class="panel"><p class="muted">${esc(T('cal_intro'))}</p>
    <ul class="list">${EVENTS.filter(([d]) => new Date(d + 'T00:00:00') >= today).map(([d, k, kind]) => {
      const dt = new Date(d + 'T00:00:00'), n = Math.round((dt - today) / 864e5);
      return `<li class="item top"><span class="date">${esc(dt.toLocaleDateString(locale, { day: '2-digit', month: 'short' }))}</span><span class="l grow">${esc(T(k))}<small>${esc(T(kind))}</small></span><span class="tag ${kind === 'public' ? 'hot' : ''}">${n === 0 ? esc(T('today')) : esc(T('days', { n }))}</span></li>`;
    }).join('')}</ul><p class="muted">${esc(T('cal_note'))}</p></section>
  <section class="panel"><h2>${esc(cityName())}</h2><p class="muted">${esc(T(city().tip))}</p></section>`;
}

function renderSos() {
  const pl = state.places;
  // Nearest hospitals first; the emergency tag is often missing in OpenStreetMap, so it only adds a label.
  const near = pl ? [...nearest(pl.hospital, 2).map((p) => ({ ...p, kind: 'hospital' })), ...nearest(pl.police, 1).map((p) => ({ ...p, kind: 'police' })), ...nearest(pl.pharmacy, 2).map((p) => ({ ...p, kind: 'pharmacy' }))] : [];
  const sosAvail = !!(pl && (pl.hospital || pl.police || pl.pharmacy));
  return `${backHead(T('t_sos'))}
  <div class="sos"><small>${esc(T('emergency'))}</small><b class="sel">112</b></div>
  <section class="panel"><h2>${esc(T('nearest'))}</h2>${rowsHtml(near, (p) => { const bits = [(p.name || p.local) ? T(p.kind) : '', p.emergency ? T('er_24h') : '', p.phone ? `<span class="sel">${esc(p.phone)}</span>` : ''].filter(Boolean); return bits.length ? `<small>${bits.map((b) => (b.startsWith('<span') ? b : esc(b))).join(' · ')}</small>` : ''; }, sosAvail)}${sosAvail ? '' : gmLink(T('gm_hospital')) + gmLink(T('gm_pharmacy'))}<a class="gm" href="https://www.google.com/maps/search/${encodeURIComponent('nöbetçi eczane')}/@${here().lat},${here().lon},14z" target="_blank" rel="noopener">${ico('hospital')}${esc(T('duty_find'))}</a><p class="muted">${esc(T('duty_pharmacy'))}</p></section>
  <section class="panel"><h2>${esc(T('embassy'))}</h2><p class="muted">${esc(T(city().embassy))}</p></section>
  <section class="panel"><h2>${esc(T('phrases'))}</h2><ul class="phrases">${Object.keys(PHRASES_TR).map((k) => `<li><b lang="tr">${esc(PHRASES_TR[k])}</b>${state.lang !== 'tr' ? `<small>${esc(T(k))}</small>` : ''}</li>`).join('')}</ul></section>`;
}

/* ---------- photos ---------- */
let photoTarget = '';
function startPhoto(stopId) { photoTarget = stopId; $('cam').value = ''; $('cam').click(); }

async function savePhoto(file) {
  if (!file) return;
  toast(T('photo_saving'));
  let pos = null;
  try { const p = await getPosition(8000); pos = { lat: p.lat, lon: p.lon, acc: p.acc }; state.pos = { lat: p.lat, lon: p.lon }; } catch { /* no location: still keep the photo */ }
  // Which stop is this? The one the visitor chose, or the closest one they are standing at.
  let stop = photoTarget ? stopById(photoTarget) : null;
  if (!stop && pos) stop = allStops().map((x) => ({ ...x, d: distanceM(pos, x) })).filter((x) => x.d <= CHECKIN_RADIUS + Math.min(pos.acc || 0, 100)).sort((a, b) => a.d - b.d)[0] || null;
  const atStop = !!(stop && pos && distanceM(pos, stop) <= CHECKIN_RADIUS + Math.min(pos.acc || 0, 100));
  try {
    await A.addPhoto(file, { stop: stop?.id || '', city: stop?.city || state.city, place: stop?.name || T('photo_view'), pos });
  } catch { toast(T('photo_failed')); return; }
  const xp = G.logPhoto(atStop ? stop.id : '');
  if (xp) reward(xp, T('photo_at', { name: stop.name }));
  else toast(T('photo_saved') + (stop && !atStop ? ' · ' + T('photo_far') : ''));
  renderAll();
}

async function openViewer(id) {
  const p = A.photos().find((x) => x.id === id); if (!p) return;
  const locale = { en: 'en-GB', tr: 'tr-TR', de: 'de-DE', ru: 'ru-RU' }[state.lang];
  $('viewer').innerHTML = `
    <img src="${A.photoUrl(p.id)}" alt="${esc(p.place)}">
    <div class="vbar">
      <span><b>${esc(p.place)}</b><small>${esc(new Date(p.ts).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }))}</small></span>
      <button type="button" class="round" data-vshare="${p.id}" aria-label="${esc(T('share'))}">${ico('share')}</button>
      <button type="button" class="round" data-vdel="${p.id}" aria-label="${esc(T('delete'))}">${ico('trash')}</button>
      <button type="button" class="round" data-vclose aria-label="${esc(T('back'))}">✕</button>
    </div>
    <p class="vconfirm" id="vconfirm" hidden><span>${esc(T('delete_q'))}</span><button type="button" class="btn sm" data-vdel-yes="${p.id}">${esc(T('delete'))}</button><button type="button" class="btn sm ghost" data-vclose>${esc(T('cancel'))}</button></p>`;
  $('viewer').hidden = false;
}
async function sharePhoto(id) {
  const f = await A.photoFile(id); if (!f) return;
  try {
    if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: T('app_name') }); return; }
  } catch { return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
}

/* ---------- cuisine names (OpenStreetMap values are English codes) ---------- */
const CUISINE = {
  de: { turkish: 'Türkische Küche', kebab: 'Kebab', regional: 'Regional', seafood: 'Meeresfrüchte', fish: 'Fisch', pizza: 'Pizza', burger: 'Burger', italian: 'Italienisch', chinese: 'Chinesisch', japanese: 'Japanisch', sushi: 'Sushi', coffee_shop: 'Café', breakfast: 'Frühstück', international: 'International', vegetarian: 'Vegetarisch', vegan: 'Vegan', meat: 'Fleisch', steak_house: 'Steakhaus', chicken: 'Hähnchen', dessert: 'Dessert', ottoman: 'Osmanisch', mediterranean: 'Mediterran', greek: 'Griechisch', indian: 'Indisch', asian: 'Asiatisch', homestyle: 'Hausmannskost', soup: 'Suppe', pide: 'Pide', lahmacun: 'Lahmacun', doner: 'Döner' },
  ru: { turkish: 'Турецкая кухня', kebab: 'Кебаб', regional: 'Местная кухня', seafood: 'Морепродукты', fish: 'Рыба', pizza: 'Пицца', burger: 'Бургеры', italian: 'Итальянская', chinese: 'Китайская', japanese: 'Японская', sushi: 'Суши', coffee_shop: 'Кофейня', breakfast: 'Завтраки', international: 'Интернациональная', vegetarian: 'Вегетарианская', vegan: 'Веганская', meat: 'Мясо', steak_house: 'Стейк-хаус', chicken: 'Курица', dessert: 'Десерты', ottoman: 'Османская', mediterranean: 'Средиземноморская', greek: 'Греческая', indian: 'Индийская', asian: 'Азиатская', homestyle: 'Домашняя кухня', soup: 'Супы', pide: 'Пиде', lahmacun: 'Лахмаджун', doner: 'Дёнер' },
  tr: { turkish: 'Türk mutfağı', kebab: 'Kebap', regional: 'Yöresel', seafood: 'Deniz ürünleri', fish: 'Balık', pizza: 'Pizza', burger: 'Burger', italian: 'İtalyan', chinese: 'Çin', japanese: 'Japon', sushi: 'Suşi', coffee_shop: 'Kahve', breakfast: 'Kahvaltı', international: 'Dünya mutfağı', vegetarian: 'Vejetaryen', vegan: 'Vegan', meat: 'Et', steak_house: 'Et', chicken: 'Tavuk', dessert: 'Tatlı', ottoman: 'Osmanlı', mediterranean: 'Akdeniz', greek: 'Yunan', indian: 'Hint', asian: 'Asya', homestyle: 'Ev yemekleri', soup: 'Çorba', pide: 'Pide', lahmacun: 'Lahmacun', doner: 'Döner', meyhane: 'Meyhane', börek: 'Börek' }
};
function cuisineText(raw) {
  if (!raw) return '';
  const dict = CUISINE[state.lang] || {};
  return raw.split(/[;,]\s*/).slice(0, 3).map((c) => dict[c.trim()] || (c.trim().charAt(0).toUpperCase() + c.trim().slice(1)).replace(/_/g, ' ')).join(', ');
}

// Wikimedia serves fixed thumbnail widths; small cards only need the 330 px one.
const thumb = (src) => String(src).replace(/\/960px-/, '/330px-');

/* ---------- first run ---------- */
function showWelcome() {
  $('welcome').innerHTML = `
    <div class="wl">
      <div class="wl-hero">${mascot(G.currentCharacter(), { size: 150 })}</div>
      <h1>${esc(T('app_name'))}</h1>
      <p class="wl-tag">${esc(T('tagline'))}</p>
      <p class="wl-sub">${esc(T('welcome_sub'))}</p>
      <label for="wl-name">${esc(T('your_name'))}</label>
      <input id="wl-name" maxlength="20" placeholder="${esc(T('traveler'))}" autocomplete="nickname">
      <div class="two">
        <div><label for="wl-lang">${esc(T('language'))}</label><select id="wl-lang">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}"${k === state.lang ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
        <div><label for="wl-city">${esc(T('city_l'))}</label><select id="wl-city"><option value="nearby"${state.city === 'nearby' ? ' selected' : ''}>${esc(NEARBY.name[state.lang] || NEARBY.name.en)}</option>${Object.values(CITIES).map((c) => `<option value="${c.id}"${c.id === state.city ? ' selected' : ''}>${esc(cityName(c))}</option>`).join('')}</select></div>
      </div>
      <button type="button" class="btn big" data-start="loc">${ico('locate')}${esc(T('start_loc'))}</button>
      <button type="button" class="btn ghost big" data-start="noloc">${esc(T('start_noloc'))}</button>
      <p class="muted center">${esc(T('loc_privacy'))}</p>
    </div>`;
  $('welcome').hidden = false;
  $('wl-lang').addEventListener('change', (e) => { state.lang = e.target.value; try { localStorage.setItem('damga:lang', state.lang); } catch {} const n = $('wl-name').value; showWelcome(); $('wl-name').value = n; renderAll(); });
}
function finishWelcome(withLoc) {
  G.setName($('wl-name').value);
  const c = $('wl-city').value;
  G.setOnboarded();
  $('welcome').hidden = true;
  if (c !== state.city) setCity(c); else renderAll();
  if (withLoc) locate();
}

/* ---------- shell ---------- */
const PAGES = { wx: [renderWx], fx: [renderFx, bindFx], talk: [renderTalk], plan: [renderPlan], stop: [renderStop, bindStop], pray: [renderPray], fare: [renderFare, bindFare], cal: [renderCal], sos: [renderSos] };
const TABS = { quests: [renderQuests], collection: [renderCollection], profile: [renderProfile, bindProfile] };

function renderView() {
  const onMap = state.tab === 'map' && !state.page;
  $('map-view').hidden = !onMap;
  $('view').hidden = onMap;
  if (onMap) { if (map) setTimeout(() => map.resize(), 0); return; }
  const [draw, bind] = state.page ? PAGES[state.page] : TABS[state.tab];
  $('view').innerHTML = draw();
  $('view').className = 'view' + (state.page === 'stop' ? ' flush' : '');
  if (bind) bind();
}
function renderNav() {
  document.querySelectorAll('.nav button').forEach((b) => {
    b.setAttribute('aria-selected', b.dataset.tab === state.tab);
    b.querySelector('span').textContent = T('nav_' + b.dataset.tab);
    b.querySelector('i').hidden = !(b.dataset.tab === 'quests' && G.claimable());
  });
}
function renderAll() { document.documentElement.lang = state.lang; if ($('mq')) { $('mq').placeholder = T('msearch_ph'); $('mq-cancel').textContent = T('close'); } $('tools-body').innerHTML = toolsList(); $('tools-title').textContent = T('tools'); renderNav(); renderMapChrome(); drawMarkers(); renderView(); }

function openStop(id) { state.stopId = id; state.page = 'stop'; renderView(); $('view').scrollTop = 0; }
function goTab(tab) { state.tab = tab; state.page = null; renderNav(); renderView(); $('view').scrollTop = 0; }
// Where are you? Near me, the 15 stamp packs, and all 81 provinces with their 973 districts (searchable).
let ADMIN = null;
const loadAdmin = async () => ADMIN || (ADMIN = await fetch('./data/tr-admin.json').then((r) => r.json()).catch(() => []));
const packNear = (p) => Object.values(CITIES).find((c) => distanceM(p, c.center) < 60000);
async function openCityPicker(view = null) {
  const admin = await loadAdmin();
  const cur = state.place;
  const row = (attrs, icon, name, sub, on, right = '') => `<li><button type="button" ${attrs} aria-pressed="${!!on}">${ico(icon)}<span><b>${esc(name)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>${right}</button></li>`;
  const provRow = (p, i) => row(`data-prov="${i}"`, 'map', p.n, T('n_districts', { n: p.d.length }) + (packNear({ lat: p.a, lon: p.o }) ? ' · ' + T('has_pack') : ''), cur && cur.p === p.n, '<b class="chev">›</b>');
  let body;
  if (view && view.prov != null) {
    const p = admin[view.prov];
    body = `<button type="button" class="link-back" data-prov-back>‹ ${esc(T('all_provinces'))}</button>
      <h3 class="prov-title">${esc(p.n)}</h3>
      <ul class="cities">${row(`data-place="${view.prov}:-1"`, 'pin', T('centre_of', { name: p.n }), '', cur && cur.p === p.n && cur.n === p.n)}
      ${p.d.map((d, j) => row(`data-place="${view.prov}:${j}"`, 'pin', d[0], '', cur && cur.p === p.n && cur.n === d[0])).join('')}</ul>`;
  } else {
    const packs = Object.values(CITIES).map((c) => row(`data-city="${c.id}"`, 'collection', cityName(c), c.center.label, !cur && c.id === state.city, `<em>${G.stampCount(c.id)} / ${c.stamps.length}</em>`)).join('');
    body = `<input id="cq" class="cq" type="search" autocomplete="off" placeholder="${esc(T('city_search'))}" aria-label="${esc(T('city_search'))}">
      <ul class="cities" id="clist">${row('data-city="nearby"', 'locate', NEARBY.name[state.lang] || NEARBY.name.en, T('near_sub'), !cur && state.city === 'nearby')}
      <li class="chead">${esc(T('packs_title'))}</li>${packs}
      <li class="chead">${esc(T('all_provinces'))}</li>${admin.map(provRow).join('')}</ul>`;
  }
  $('tools-title').textContent = T('city_pick');
  $('tools-body').innerHTML = body;
  $('tools-sheet').hidden = false;
  $('tools-body').scrollTop = 0;
  const q = $('cq');
  if (q) q.addEventListener('input', () => {
    const f = fold(q.value).trim();
    if (!f) { openCityPicker(); return; }
    const hits = [];
    admin.forEach((p, i) => {
      if (fold(p.n).startsWith(f)) hits.push([0, row(`data-prov="${i}"`, 'map', p.n, T('n_districts', { n: p.d.length }), false, '<b class="chev">›</b>')]);
      p.d.forEach((d, j) => { const fd = fold(d[0]); if (fd.startsWith(f) || (f.length > 2 && fd.includes(f))) hits.push([fd.startsWith(f) ? 1 : 2, row(`data-place="${i}:${j}"`, 'pin', d[0], p.n, false)]); });
    });
    hits.sort((a, b) => a[0] - b[0]);
    $('clist').innerHTML = hits.length ? hits.slice(0, 50).map((h) => h[1]).join('') : `<li class="chead">${esc(T('none'))}</li>`;
  });
}
// A province or district from the list: use its city pack when one is close, else "anywhere" mode.
function setPlace(prov, dist) {
  const p = ADMIN[prov]; if (!p) return;
  const d = dist >= 0 ? p.d[dist] : null;
  const place = d ? { n: d[0], p: p.n, lat: d[1], lon: d[2] } : { n: p.n, p: p.n, lat: p.a, lon: p.o };
  const pack = packNear(place);
  $('tools-sheet').hidden = true;
  state.place = place; store.set('place', place);
  state.city = pack ? pack.id : 'nearby'; store.set('city', state.city);
  NEARBY.stamps = [];
  clearLines();
  state.manualCity = true;
  state.weather = state.prayer = state.places = null;
  centerMap(); renderAll(); loadLive();
}
function setCity(id) {
  $('tools-sheet').hidden = true;
  const hadPlace = !!state.place;
  state.place = null; store.set('place', null);
  if (id === 'nearby') { state.city = 'nearby'; store.set('city', 'nearby'); NEARBY.stamps = []; state.places = null; locate(); return; }
  if (id === state.city && !hadPlace) return;
  state.city = id; store.set('city', id);
  if (id !== 'nearby') NEARBY.stamps = [];
  clearLines();
  // A chosen city pack wins over a real position elsewhere (see here()).
  state.manualCity = true;
  state.weather = state.prayer = state.places = null;
  centerMap(); renderAll(); loadLive();
}

function init() {
  fetch('./assets/3d/manifest.json').then((r) => (r.ok ? r.json() : null)).then((m) => { setArt(m); if (hasArt()) renderAll(); }).catch(() => {});
  initMap();
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-prov],[data-prov-back],[data-place],[data-say],[data-big],[data-share],[data-quick],[data-nav-end],[data-nav-mute],[data-nav-overview],[data-route-card],[data-route-stop],[data-route-clear],[data-hours],[data-plan-map],[data-hit],[data-install],[data-reload],[data-collect],[data-cel-close],[data-pc-close],[data-start],[data-photo],[data-view],[data-vshare],[data-vdel],[data-vdel-yes],[data-vclose],[data-rate],[data-scroll],[data-save],[data-tab],[data-go],[data-stop],[data-page],[data-back],[data-qtab],[data-ctab],[data-claim],[data-char],[data-city],[data-go-col],#city-toggle,#tools-btn,#locate-btn,#tools-close');
    if (!el) return;
    if (el.dataset.prov) openCityPicker({ prov: +el.dataset.prov });
    else if (el.hasAttribute('data-prov-back')) openCityPicker();
    else if (el.dataset.place) { const [a, b] = el.dataset.place.split(':').map(Number); setPlace(a, b); }
    else if (el.dataset.say) sayTr(el.dataset.say);
    else if (el.dataset.big) showBig(el.dataset.big);
    else if (el.hasAttribute('data-share')) sharePlace(state.cardPlace);
    else if (el.dataset.quick) { $('mq').value = T(el.dataset.quick); onSearchInput($('mq').value); $('mq').focus(); }
    else if (el.hasAttribute('data-nav-end')) endNav();
    else if (el.hasAttribute('data-nav-mute')) { nav.mute = !nav.mute; store.set('navMute', nav.mute); if (nav.mute) try { speechSynthesis.cancel(); } catch { /* none */ } navDraw(); }
    else if (el.hasAttribute('data-nav-overview')) { nav.overview = !nav.overview; if (nav.overview) drawLine('route', nav.r.coords); else navUpdate(); }
    else if (el.hasAttribute('data-route-card')) { if (state.cardPlace) routeTo(state.cardPlace); }
    else if (el.dataset.routeStop) { const st = stopById(el.dataset.routeStop); if (st) routeTo(st); }
    else if (el.hasAttribute('data-route-clear')) clearLines();
    else if (el.dataset.hours) { state.hours = +el.dataset.hours; renderView(); }
    else if (el.hasAttribute('data-plan-map')) showPlanOnMap();
    else if (el.dataset.hit !== undefined) openHit(+el.dataset.hit);
    else if (el.hasAttribute('data-install')) { installEvt?.prompt(); installEvt?.userChoice.finally(() => { installEvt = null; renderAll(); }); }
    else if (el.hasAttribute('data-reload')) location.reload();
    else if (el.dataset.collect) { collectStop(el.dataset.collect).then((r) => { if (r.err) toast(r.err); }); }
    else if (el.hasAttribute('data-cel-close')) $('celebrate').hidden = true;
    else if (el.hasAttribute('data-pc-close')) $('place-card').hidden = true;
    else if (el.dataset.start) finishWelcome(el.dataset.start === 'loc');
    else if (el.dataset.photo !== undefined) startPhoto(el.dataset.photo);
    else if (el.dataset.view) openViewer(el.dataset.view);
    else if (el.dataset.vshare) sharePhoto(el.dataset.vshare);
    else if (el.dataset.vdel) $('vconfirm').hidden = false;
    else if (el.dataset.vdelYes) { A.deletePhoto(el.dataset.vdelYes).then(() => { $('viewer').hidden = true; renderAll(); }); }
    else if (el.hasAttribute('data-vclose')) $('viewer').hidden = true;
    else if (el.dataset.rate) { const [id, n] = el.dataset.rate.split(':'); G.rate(id, +n); if (id.startsWith('p_') && state.cardPlace) openPlace(state.cardPlace, state.cardLabel); else renderView(); }
    else if (el.dataset.scroll) $(el.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' });
    else if (el.dataset.save) { const on = G.toggleSaved(el.dataset.save); el.classList.toggle('on', on); el.setAttribute('aria-pressed', on); el.setAttribute('aria-label', T(on ? 'saved' : 'save')); toast(T(on ? 'saved' : 'save') + (on ? ' ✓' : '')); if (!on) toast(''); }
    else if (el.dataset.tab) goTab(el.dataset.tab);
    else if (el.dataset.go) goTab(el.dataset.go);
    else if (el.dataset.stop) openStop(el.dataset.stop);
    else if (el.dataset.page) { $('tools-sheet').hidden = true; state.page = el.dataset.page; renderView(); $('view').scrollTop = 0; }
    else if (el.hasAttribute('data-back')) { state.page = null; renderView(); }
    else if (el.dataset.qtab) { state.qtab = el.dataset.qtab; renderView(); }
    else if (el.dataset.ctab) { state.ctab = el.dataset.ctab; renderView(); }
    else if (el.dataset.goCol) { state.ctab = el.dataset.goCol; goTab('collection'); }
    else if (el.dataset.claim) { const q = G.QUESTS.find((x) => x.id === el.dataset.claim); const xp = G.claim(q); if (xp) reward(xp, T('q_' + q.id)); renderAll(); }
    else if (el.dataset.char) { G.setCharacter(el.dataset.char); renderAll(); }
    else if (el.dataset.city) setCity(el.dataset.city);
    else if (el.id === 'city-toggle') openCityPicker();
    else if (el.id === 'tools-btn') { $('tools-title').textContent = T('tools'); $('tools-body').innerHTML = toolsList(); $('tools-sheet').hidden = false; }
    else if (el.id === 'tools-close') $('tools-sheet').hidden = true;
    else if (el.id === 'locate-btn') locate();
  });
  $('tools-sheet').addEventListener('click', (e) => { if (e.target.id === 'tools-sheet') e.target.hidden = true; });
  setInterval(() => { if (state.tab === 'map' && !state.page) renderMapChrome(); applyTheme(); }, 30000);
  $('tools-title').textContent = T('tools');
  // Map search bar
  $('mq-ico').innerHTML = ico('search');
  $('mq').placeholder = T('msearch_ph');
  $('mq').addEventListener('input', (e) => onSearchInput(e.target.value));
  $('mq').addEventListener('focus', (e) => { document.body.classList.add('searching'); $('place-card').hidden = true; onSearchInput(e.target.value); });
  $('mq-cancel').textContent = T('close');
  $('mq-cancel').addEventListener('click', () => endSearch(true));
  $('mq').addEventListener('keydown', (e) => { if (e.key === 'Enter' && lastHits.length) openHit(0); if (e.key === 'Escape') endSearch(false); });
  $('mq-clear').addEventListener('click', () => { $('mq').value = ''; $('mresults').hidden = true; $('mq-clear').hidden = true; clearLines(); $('mq').focus(); });
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; renderAll(); });
  $('cam').addEventListener('change', (e) => savePhoto(e.target.files && e.target.files[0]));
  renderAll();
  A.loadAlbum().then(() => renderAll());
  if (!G.game().onboarded) showWelcome();
  // Resume live location if the visitor already allowed it.
  // Someone who shared their location before gets it again at once. Safari often answers "prompt" to the
  // permissions query even when allowed, so only a clear "denied" stops us.
  if (store.get('loc', false)) {
    let asked = false;
    const go = () => { if (!asked) { asked = true; startWatch(); } };
    try { navigator.permissions.query({ name: 'geolocation' }).then((r) => { if (r.state !== 'denied') go(); }).catch(go); } catch { go(); }
  }
  if (map) map.on('click', () => { $('place-card').hidden = true; endSearch(false); });
  $('big').addEventListener('click', () => { $('big').hidden = true; });
  if (map) map.on('dragstart', () => { state.follow = false; }); // moving the map yourself stops following
  loadLive();
  if ('serviceWorker' in navigator) {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('./sw.js').then((reg) => setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000)).catch(() => {});
    // A new version took over: offer a reload instead of switching under the visitor's feet.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) return;
      $('update').innerHTML = `<span>${esc(T('update_ready'))}</span><button type="button" class="btn sm" data-reload>${esc(T('reload'))}</button>`;
      $('update').hidden = false;
    });
  }
}

init();
