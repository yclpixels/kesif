import { CITIES, NEARBY, EVENTS, CHECKED, CHECKIN_RADIUS } from './data.js';
import { STOP_INFO } from './stops-info.js';
import { fetchWeather, fetchPrayer, fetchPlaces, fetchPlacesLive, fetchWikiStops, distanceM, getPosition } from './api.js';
import { t, LANGS, pickLang, weatherText, PHRASES_TR } from './i18n.js';
import * as G from './game.js';
import { mascot } from './mascot.js';
import { PHOTOS } from './photos.js';
import * as A from './album.js';
import { ICON } from './icons.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem('damga:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('damga:' + k, JSON.stringify(v)); } catch { /* ignore */ } }
};

const state = {
  lang: pickLang(),
  city: store.get('city', 'istanbul'),
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
const here = () => state.pos || city().center || store.get('lastPos', null) || CITIES.istanbul.center;
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
  const places = (nearby ? Promise.resolve(null) : fetchPlaces(state.city)).then((v) => v || fetchPlacesLive(h.lat, h.lon));
  const stops = nearby ? fetchWikiStops(h.lat, h.lon, state.lang).then((list) => { if (run === loadRun) { NEARBY.stamps = list; onData(); } }) : Promise.resolve();
  await Promise.all([fetchWeather(h.lat, h.lon).then(set('weather')), fetchPrayer(h.lat, h.lon).then(set('prayer')), places.then(set('places')), stops]);
  if (run === loadRun) { state.loading = false; onData(); }
}
// Live data appears on the map chrome and on the prayer and SOS pages; leave other screens alone.
function onData() {
  renderMapChrome(); drawMarkers();
  if (state.page === 'pray' || state.page === 'sos') renderView();
}

// Inside a city pack's area use the pack; anywhere else in Türkiye switch to "Near me".
function pickCityFor(p) {
  store.set('lastPos', { lat: p.lat, lon: p.lon });
  let best = null;
  for (const c of Object.values(CITIES)) { const d = distanceM(p, c.center); if (d < 60000 && (!best || d < best.d)) best = { id: c.id, d }; }
  const want = best ? best.id : 'nearby';
  if (want !== state.city) { state.city = want; store.set('city', want); state.places = null; NEARBY.stamps = []; return true; }
  return false;
}
async function locate() {
  try {
    const p = await getPosition();
    state.pos = { lat: p.lat, lon: p.lon, acc: p.acc };
    if (pickCityFor(p)) renderAll();
    toast('');
    startWatch();
  } catch { toast(T('need_loc')); }
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
    if (Date.now() - lastDraw > 4000) { lastDraw = Date.now(); renderMapChrome(); }
    if (first) { if (pickCityFor(state.pos)) renderAll(); centerMap(); loadLive(); }
  }, () => { /* keep the last known position */ }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
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
function openPlace(p, kindLabel) {
  const d = distanceM(here(), p), walk = Math.max(1, Math.round(d * 1.3 / 80));
  const q = [p.local || p.name, p.street, CITIES[state.city]?.name.en].filter(Boolean).join(', ');
  const dir = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}&travelmode=walking`;
  const tel = (p.phone || '').split(';')[0].trim();
  $('place-card').innerHTML = `
    <div class="pc-head"><div><h2>${esc(p.name || p.local || kindLabel)}</h2><small>${esc([kindLabel, cuisineText(p.cuisine)].filter(Boolean).join(' · '))}</small></div>
      <button type="button" class="round sm" data-pc-close aria-label="${esc(T('close'))}">✕</button></div>
    <div class="pc-meta"><span>${ico('walk')}${fmtDist(d)} · ${esc(T('min', { n: walk }))}</span>${p.street ? `<span>${ico('pin')}${esc(p.street)}</span>` : ''}${tel ? `<span class="sel">${ico('bell')}${esc(tel)}</span>` : ''}</div>
    <div class="pc-actions">
      <a class="btn" href="${dir}" target="_blank" rel="noopener">${ico('walk')}${esc(T('directions'))}</a>
      ${tel ? `<a class="btn ghost" href="tel:${esc(tel.replace(/[^+0-9]/g, ''))}">${esc(T('call'))}</a>` : ''}
      <a class="btn ghost" href="${mapUrl(p)}" target="_blank" rel="noopener">${esc(T('open_maps'))}</a>
    </div>`;
  $('place-card').hidden = false;
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
  map.on('style.load', tintMap);
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
  // Row 1: player chip and bell, same height, pinned to the two edges. Row 2: one centred info pill.
  $('map-top').innerHTML = `
    <div class="map-row">
      ${playerChip()}
      <button type="button" class="round" id="tools-btn" aria-label="${esc(T('tools'))}">${ico('bell')}${G.claimable() ? '<i class="dot"></i>' : ''}</button>
    </div>
    <div class="map-info"><button type="button" id="city-toggle">${esc(cityName())} ▾</button><i></i><span>${wx ? esc(wx.temp) + '°C' : '–'}</span><i></i><span>${clock()}</span></div>`;
  $('map-bottom').innerHTML = `
    <div class="map-row">
      <button type="button" class="round cam" data-photo="" aria-label="${esc(T('take_photo'))}">${ico('camera')}</button>
      <button type="button" class="round locate" id="locate-btn" aria-label="${esc(T('locate'))}">${ico('locate')}</button>
    </div>
    ${next && state.pos && next.d <= CHECKIN_RADIUS + Math.min(state.pos.acc || 0, 100)
      ? `<button type="button" class="banner here" data-collect="${next.id}">${ico('map', 'star')}<span>${esc(T('at_stop', { name: next.name }))}</span><em>${esc(T('collect_now'))}</em></button>`
      : next ? `<button type="button" class="banner" data-stop="${next.id}">${ico('collection', 'star')}<span>${esc(T('near_banner', { name: next.name, dist: fmtDist(next.d) }))}</span><b>›</b></button>`
      : `<div class="banner">${ico('check', 'star')}<span>${esc(T('all_done', { city: cityName() }))}</span></div>`}`;
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
  const d = distanceM(here(), s);
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
    <div class="facts"><span>${ico('pin')}${fmtDist(d)}</span>${d < 2500 ? `<span>${ico('walk')}${esc(T('min', { n: walk }))}</span>` : ''}<span>${ico('car')}${esc(T('min', { n: drive }))}</span><span>${ico('bus')}${esc(T('min', { n: transit }))}</span></div>
    <h2>${esc(T('rewards'))}</h2>
    <div class="rewards"><div>${ico('collection', 'gold')}<b>${esc(T('plus_xp', { n: G.XP_STAMP }))}</b></div><div>${medal(CITY_MEDAL[s.city] || 'near', true)}<b>${esc(s.city === 'nearby' ? T('bd_near') : T('city_badge', { city: cityName(c) }))}</b></div></div>
    ${got ? `<p class="done">${ico('check')}${esc(T('collected', { date: got.slice(0, 10) }))}</p>
      <div class="rate"><span>${esc(T(G.myRating(s.id) ? 'your_rating' : 'rate_title'))}</span><div class="stars" role="group" aria-label="${esc(T('rate_title'))}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-rate="${s.id}:${n}" aria-label="${n}" aria-pressed="${n <= G.myRating(s.id)}">${ico('collection')}</button>`).join('')}</div></div>`
      : `<button type="button" class="btn big" id="checkin" data-id="${s.id}">${esc(T('get_stamp'))}</button>
         <p class="muted" id="stop-msg" aria-live="polite">${state.pos ? '' : esc(T('need_loc'))}</p>`}
    <div class="my-photos">
      <div class="row"><h2>${esc(T('your_photos'))}</h2><button type="button" class="btn sm" data-photo="${s.id}">${ico('camera')}${esc(T('take_photo'))}</button></div>
      ${A.photosFor(s.id).length ? `<div class="strip">${A.photosFor(s.id).map((p) => `<button type="button" data-view="${p.id}"><img src="${A.photoUrl(p.id)}" alt="${esc(s.name)}"></button>`).join('')}</div>`
        : `<p class="muted">${esc(T('photo_hint', { n: G.XP_PHOTO }))}</p>`}
    </div>
    <a class="btn ghost big" href="${dirUrl(s)}" target="_blank" rel="noopener">${esc(T('start'))} →</a>
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
    ${mascot(G.currentCharacter(), { size: 150 })}
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
  <h2 class="sec">${esc(T('tools'))}</h2>
  ${toolsList()}
  <h2 class="sec" id="settings">${esc(T('settings'))}</h2>
  <section class="panel">
    <label for="lang">${esc(T('language'))}</label>
    <select id="lang">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}"${k === state.lang ? ' selected' : ''}>${v}</option>`).join('')}</select>
    <label>${esc(T('city_l'))}</label>
    <button type="button" class="btn ghost" id="city-toggle">${ico('map')}${esc(cityName())} ▾</button>
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

function searchBox() {
  return `<div class="search"><span>${ico('search')}</span><input id="q" type="search" placeholder="${esc(T('search_ph'))}" aria-label="${esc(T('search_ph'))}" autocomplete="off"></div><ul class="results" id="results"></ul>`;
}
// Search passport stops and every downloaded place in the current city by name (Turkish-aware, accent-insensitive).
const fold = (x) => String(x || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
function runSearch(q) {
  const out = $('results'); if (!out) return;
  const f = fold(q).trim();
  if (f.length < 2) { out.innerHTML = ''; return; }
  const h = here(), pl = state.places || {};
  const hits = [];
  for (const s of allStops()) if (fold(s.name).includes(f)) hits.push({ kind: 'stop', p: s, label: T('cat_' + ((STOP_INFO[s.id]?.cat || s.cat || ['history'])[0])), icon: 'collection' });
  const add = (list, kind, icon, label) => { for (const p of list || []) if (fold(p.name).includes(f) || fold(p.local).includes(f)) hits.push({ kind, p, label, icon }); };
  add(pl.food, 'place', 'food', T('restaurant'));
  add(pl.worship, 'place', 'mosque', T('worship'));
  add(pl.mall, 'place', 'market', T('malls'));
  add(pl.hospital, 'place', 'hospital', T('hospital'));
  const top = hits.map((x) => ({ ...x, d: distanceM(h, x.p) })).sort((a, b) => (a.kind === 'stop') - (b.kind === 'stop') ? (b.kind === 'stop') - (a.kind === 'stop') : a.d - b.d).slice(0, 12);
  window.__hits = top;
  out.innerHTML = top.length ? top.map((x, i) => `<li><button type="button" data-hit="${i}">${ico(x.icon)}<span><b>${esc(x.p.name || x.p.local)}</b><small>${esc(x.label)}</small></span><em>${fmtDist(x.d)}</em></button></li>`).join('')
    : `<li class="muted">${esc(T('none'))}</li>`;
}
function openHit(i) {
  const x = (window.__hits || [])[i]; if (!x) return;
  $('tools-sheet').hidden = true;
  if (x.kind === 'stop') { if (x.p.city !== state.city) setCity(x.p.city); openStop(x.p.id); return; }
  state.tab = 'map'; state.page = null; renderNav(); renderView();
  if (map) map.easeTo({ center: [x.p.lon, x.p.lat], zoom: 17, duration: 700 });
  openPlace(x.p, x.label);
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
  return `${installCard()}<button type="button" class="tool tool-plan wide" data-page="plan">${ico('walk')}<span>${esc(T('t_plan'))}<small>${esc(T('plan_teaser'))}</small></span></button><div class="tools">${[['fare', 'taxi', 't_fare'], ['pray', 'pray', 't_pray'], ['cal', 'cal', 't_cal'], ['sos', 'sos', 't_sos']]
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
// Draw the planned route as a violet line on the map.
function showPlanOnMap() {
  const plan = state.lastPlan || []; if (!map || !plan.length) return;
  const h = here(), coords = [[h.lon, h.lat], ...plan.map((x) => [x.s.lon, x.s.lat])];
  const draw = () => {
    const data = { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } };
    if (map.getSource('plan')) map.getSource('plan').setData(data);
    else {
      map.addSource('plan', { type: 'geojson', data });
      map.addLayer({ id: 'plan-glow', type: 'line', source: 'plan', paint: { 'line-color': '#a78bfa', 'line-width': 10, 'line-opacity': 0.35, 'line-blur': 2 } });
      map.addLayer({ id: 'plan', type: 'line', source: 'plan', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#7c3aed', 'line-width': 4, 'line-dasharray': [1.5, 1.2] } });
    }
    const lons = coords.map((c) => c[0]), lats = coords.map((c) => c[1]);
    map.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], { padding: { top: 140, bottom: 200, left: 50, right: 50 }, pitch: 45, duration: 900 });
  };
  state.tab = 'map'; state.page = null; renderNav(); renderView();
  // The map was hidden behind the plan page; let it take its size before fitting the route.
  setTimeout(() => { map.resize(); if (map.isStyleLoaded()) draw(); else map.once('idle', draw); }, 60);
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
  <div class="glance"><div><small>${esc(T('weather'))}</small><b>${wx ? esc(wx.temp) + '°C' : '–'}</b><small>${wx ? esc(weatherText(state.lang, wx.code)) : ''}</small></div><div><small>${esc(T('local_time'))}</small><b>${clock()}</b><small>${esc(T('tz_note'))}</small></div></div>
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
  <section class="panel"><h2>${esc(T('nearest'))}</h2>${rowsHtml(near, (p) => { const bits = [(p.name || p.local) ? T(p.kind) : '', p.emergency ? T('er_24h') : '', p.phone ? `<span class="sel">${esc(p.phone)}</span>` : ''].filter(Boolean); return bits.length ? `<small>${bits.map((b) => (b.startsWith('<span') ? b : esc(b))).join(' · ')}</small>` : ''; }, sosAvail)}${sosAvail ? '' : gmLink(T('gm_hospital')) + gmLink(T('gm_pharmacy'))}<p class="muted">${esc(T('duty_pharmacy'))}</p></section>
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
const PAGES = { plan: [renderPlan], stop: [renderStop, bindStop], pray: [renderPray], fare: [renderFare, bindFare], cal: [renderCal], sos: [renderSos] };
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
function renderAll() { document.documentElement.lang = state.lang; $('tools-body').innerHTML = searchBox() + toolsList(); $('tools-title').textContent = T('tools'); renderNav(); renderMapChrome(); drawMarkers(); renderView(); }

function openStop(id) { state.stopId = id; state.page = 'stop'; renderView(); $('view').scrollTop = 0; }
function goTab(tab) { state.tab = tab; state.page = null; renderNav(); renderView(); $('view').scrollTop = 0; }
function openCityPicker() {
  const opt = (id, name, sub, n, total) => `<li><button type="button" data-city="${id}" aria-pressed="${id === state.city}">${ico(id === 'nearby' ? 'locate' : 'map')}<span><b>${esc(name)}</b><small>${esc(sub)}</small></span>${total ? `<em>${n} / ${total}</em>` : ''}</button></li>`;
  $('tools-title').textContent = T('city_pick');
  $('tools-body').innerHTML = `<ul class="cities">${opt('nearby', NEARBY.name[state.lang] || NEARBY.name.en, T('near_sub'), 0, 0)}${Object.values(CITIES).map((c) => opt(c.id, cityName(c), c.center.label, G.stampCount(c.id), c.stamps.length)).join('')}</ul>`;
  $('tools-sheet').hidden = false;
}
function setCity(id) {
  $('tools-sheet').hidden = true;
  if (id === state.city) return;
  state.city = id; store.set('city', id);
  if (id !== 'nearby') NEARBY.stamps = [];
  // A chosen city pack wins over a real position elsewhere.
  if (state.pos && city().center && distanceM(state.pos, city().center) > 60000) state.pos = null;
  state.weather = state.prayer = state.places = null;
  centerMap(); renderAll(); loadLive();
}

function init() {
  initMap();
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-hours],[data-plan-map],[data-hit],[data-install],[data-reload],[data-collect],[data-cel-close],[data-pc-close],[data-start],[data-photo],[data-view],[data-vshare],[data-vdel],[data-vdel-yes],[data-vclose],[data-rate],[data-scroll],[data-save],[data-tab],[data-go],[data-stop],[data-page],[data-back],[data-qtab],[data-ctab],[data-claim],[data-char],[data-city],[data-go-col],#city-toggle,#tools-btn,#locate-btn,#tools-close');
    if (!el) return;
    if (el.dataset.hours) { state.hours = +el.dataset.hours; renderView(); }
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
    else if (el.dataset.rate) { const [id, n] = el.dataset.rate.split(':'); G.rate(id, +n); renderView(); }
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
    else if (el.id === 'tools-btn') { $('tools-title').textContent = T('tools'); $('tools-body').innerHTML = searchBox() + toolsList(); $('tools-sheet').hidden = false; }
    else if (el.id === 'tools-close') $('tools-sheet').hidden = true;
    else if (el.id === 'locate-btn') locate();
  });
  $('tools-sheet').addEventListener('click', (e) => { if (e.target.id === 'tools-sheet') e.target.hidden = true; });
  setInterval(() => { if (state.tab === 'map' && !state.page) renderMapChrome(); }, 30000);
  $('tools-title').textContent = T('tools');
  $('tools-sheet').addEventListener('input', (e) => { if (e.target.id === 'q') runSearch(e.target.value); });
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; renderAll(); });
  $('cam').addEventListener('change', (e) => savePhoto(e.target.files && e.target.files[0]));
  renderAll();
  A.loadAlbum().then(() => renderAll());
  if (!G.game().onboarded) showWelcome();
  // Resume live location if the visitor already allowed it.
  try { navigator.permissions?.query({ name: 'geolocation' }).then((r) => { if (r.state === 'granted' && store.get('loc', false)) startWatch(); }).catch(() => {}); } catch { /* old browser */ }
  if (map) map.on('click', () => { $('place-card').hidden = true; });
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
