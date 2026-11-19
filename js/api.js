// Damga — live data. All three services are free and need no API key.
// Weather: Open-Meteo (CC BY 4.0). Prayer times: AlAdhan, method 13 = Diyanet. Places: OpenStreetMap snapshot (see fetchPlaces).

const CACHE_PREFIX = 'damga:cache:';

function cacheGet(key, maxAgeMs) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { t, v } = JSON.parse(raw);
    return Date.now() - t < maxAgeMs ? v : null;
  } catch { return null; }
}
function cacheSet(key, v) {
  try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), v })); } catch { /* storage full or blocked */ }
}
// Stale copy for offline use.
function cacheAny(key) {
  try { const raw = localStorage.getItem(CACHE_PREFIX + key); return raw ? JSON.parse(raw).v : null; } catch { return null; }
}

async function getJSON(url, opts = {}, timeoutMs = 20000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: ctl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally { clearTimeout(timer); }
}

const r3 = (n) => Math.round(n * 1000) / 1000; // ~100 m grid for cache keys

export async function fetchWeather(lat, lon) {
  const key = `wx:${r3(lat)},${r3(lon)}`;
  const hit = cacheGet(key, 30 * 60 * 1000);
  if (hit) return hit;
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Europe%2FIstanbul`;
    const d = await getJSON(u);
    const v = { temp: Math.round(d.current.temperature_2m), code: d.current.weather_code };
    cacheSet(key, v);
    return v;
  } catch (e) { return cacheAny(key); }
}

export async function fetchPrayer(lat, lon) {
  const today = new Date().toISOString().slice(0, 10);
  const key = `pr:${today}:${r3(lat)},${r3(lon)}`;
  const hit = cacheGet(key, 12 * 60 * 60 * 1000);
  if (hit) return hit;
  try {
    const [y, m, dd] = today.split('-');
    const u = `https://api.aladhan.com/v1/timings/${dd}-${m}-${y}?latitude=${lat}&longitude=${lon}&method=13&timezonestring=Europe/Istanbul`;
    const d = await getJSON(u);
    const t = d.data.timings;
    const v = { Fajr: t.Fajr, Sunrise: t.Sunrise, Dhuhr: t.Dhuhr, Asr: t.Asr, Maghrib: t.Maghrib, Isha: t.Isha };
    cacheSet(key, v);
    return v;
  } catch (e) { return cacheAny(key); }
}

// Places come from a snapshot of OpenStreetMap shipped with the app (data/places-<city>.json),
// built by tools/build_places.py. The public Overpass servers are too slow to query live.
const placeFiles = {};
export async function fetchPlaces(cityId) {
  if (placeFiles[cityId]) return placeFiles[cityId];
  try {
    const d = await getJSON(`./data/places-${cityId}.json`);
    const v = { built: d.built };
    // A kind that has not been downloaded yet stays null so the app can say so.
    for (const kind of ['worship', 'food', 'mall', 'hospital', 'pharmacy', 'police']) v[kind] = d[kind] ? d[kind].map(expand) : null;
    placeFiles[cityId] = v;
    return v;
  } catch (e) { return null; }
}

function expand(p) {
  const diet = p.d || '';
  return {
    name: p.n || p.l || '', local: p.l || p.n || '', lat: p.a, lon: p.o,
    phone: p.p || '', street: p.s || '', religion: p.r || '', cuisine: p.c || '', hours: p.h || '', web: p.w || '', outdoor: !!p.t,
    halal: diet.includes('h'), vegetarian: diet.includes('v'), kosher: diet.includes('k'),
    emergency: !!p.e
  };
}

// Passport stops anywhere in Türkiye: notable places around the visitor from Wikipedia's geosearch.
// Only sights are kept (mosques, museums, castles, bazaars, parks...), not battles, schools or stadiums.
const SIGHT = /cami|mescid|kilise|sinagog|müze|kale|hisar|sur\b|anıt|çarşı|bedesten|\bhan\b|hanı|kervansaray|hamam|köprü|park|bahçe|saray|kasr|köşk|kule|türbe|medrese|külliye|tapınak|antik|ören|şelale|göl\b|gölü|mağara|kanyon|vadi|plaj|koy\b|meydan|çeşme|kilise|manastır|mosque|church|synagogue|museum|castle|fortress|citadel|monument|bazaar|market|caravanserai|bath|bridge|park|garden|palace|mansion|tower|tomb|mausoleum|madrasa|temple|ancient|ruins|waterfall|lake|cave|canyon|valley|beach|square|fountain|monastery/i;
const SKIP = /muharebe|savaş|battle|siege|kuşatma|lise|okul|üniversite|school|university|college|stadyum|stadium|hastane|hospital|belediye|seçim|election|futbol|kulüp|club|istasyon|gar\b|garı|station|otoyol|motorway|caddesi|sokak|mahalle|neighbourhood|ilçe|district|province|şirket|company|holding|televizyon|radyo|gazete/i;
function sightCat(t) {
  if (/cami|mescid|kilise|sinagog|manastır|mosque|church|synagogue|monastery|türbe|tomb|mausoleum|külliye/i.test(t)) return 'worship';
  if (/müze|museum/i.test(t)) return 'museum';
  if (/çarşı|bedesten|bazaar|market|\bhan\b|hanı|kervansaray|caravanserai/i.test(t)) return 'market';
  if (/park|bahçe|garden|şelale|waterfall|göl|lake|vadi|valley|kanyon|canyon|plaj|beach|mağara|cave/i.test(t)) return 'park';
  if (/kule|tower|tepe|seyir|view/i.test(t)) return 'view';
  return 'history';
}

export async function fetchWikiStops(lat, lon, lang) {
  const wiki = lang === 'tr' ? 'tr' : 'en';
  const key = `wp:${wiki}:${Math.round(lat * 100) / 100},${Math.round(lon * 100) / 100}`;
  const hit = cacheGet(key, 24 * 60 * 60 * 1000);
  if (hit) return hit;
  const ask = async (w) => {
    const u = `https://${w}.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=geosearch&ggscoord=${lat}|${lon}&ggsradius=10000&ggslimit=50&prop=coordinates|pageimages|extracts|description&pithumbsize=960&pilimit=50&colimit=50&exintro=1&explaintext=1&exsentences=2&exlimit=20`;
    const d = await getJSON(u, {}, 15000);
    return Object.values(d.query?.pages || {}).map((p) => ({ ...p, wiki: w }));
  };
  try {
    let pages = await ask(wiki);
    // English Wikipedia covers small Turkish towns thinly; fall back to Turkish articles.
    if (wiki !== 'tr' && pages.filter((p) => SIGHT.test(p.title + ' ' + (p.description || ''))).length < 4) pages = pages.concat(await ask('tr'));
    const seen = new Set();
    const stops = pages
      .filter((p) => p.coordinates && p.coordinates[0])
      .filter((p) => { const t = p.title + ' ' + (p.description || ''); return SIGHT.test(t) && !SKIP.test(t); })
      .map((p) => ({
        id: `wp:${p.wiki}:${p.pageid}`,
        name: p.title.replace(/\s*\([^)]*\)$/, ''),
        lat: p.coordinates[0].lat, lon: p.coordinates[0].lon,
        img: p.thumbnail?.source || '',
        page: `https://${p.wiki}.wikipedia.org/?curid=${p.pageid}`,
        desc: (p.extract || p.description || '').replace(/\s+/g, ' ').trim().slice(0, 260),
        cat: [sightCat(p.title + ' ' + (p.description || ''))],
        city: 'nearby'
      }))
      .filter((s) => (seen.has(s.name) ? false : seen.add(s.name)))
      .map((s) => ({ ...s, d: distanceM({ lat, lon }, s) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 12)
      .map(({ d, ...s }) => s);
    cacheSet(key, stops);
    return stops;
  } catch (e) { return cacheAny(key) || []; }
}

// Restaurants, places of worship, hospitals... around any point, live from OpenStreetMap (Overpass).
// The public servers are often busy, so this is best effort with a day of caching; the app falls back
// to Google Maps search links when it fails.
export async function fetchPlacesLive(lat, lon) {
  const key = `pl:${Math.round(lat * 100) / 100},${Math.round(lon * 100) / 100}`;
  const hit = cacheGet(key, 24 * 60 * 60 * 1000);
  if (hit) return hit;
  const a = (r) => `(around:${r},${lat},${lon})`;
  const q = `[out:json][timeout:20];
nwr${a(2500)}[amenity=place_of_worship][name];out center tags 60;
nwr${a(1500)}[amenity=restaurant][name];out center tags 60;
nwr${a(8000)}[shop=mall][name];out center tags 15;
nwr${a(8000)}[amenity=hospital][name];out center tags 15;
nwr${a(2500)}[amenity=pharmacy];out center tags 20;
nwr${a(5000)}[amenity=police];out center tags 10;`;
  for (const ep of ['https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass-api.de/api/interpreter']) {
    try {
      const d = await getJSON(ep, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, 14000);
      const v = { live: true, worship: [], food: [], mall: [], hospital: [], pharmacy: [], police: [] };
      for (const el of d.elements || []) {
        const t = el.tags || {}, la = el.lat ?? el.center?.lat, lo = el.lon ?? el.center?.lon;
        if (la == null) continue;
        const yes = (x) => /yes|only/.test(t[x] || '');
        const p = { name: t['name:en'] || t.name || '', local: t.name || '', lat: la, lon: lo, phone: t.phone || t['contact:phone'] || '', street: t['addr:street'] ? `${t['addr:street']}${t['addr:housenumber'] ? ' ' + t['addr:housenumber'] : ''}` : '', religion: t.religion || '', cuisine: t.cuisine || '', halal: yes('diet:halal'), vegetarian: yes('diet:vegetarian') || yes('diet:vegan'), kosher: yes('diet:kosher'), emergency: t.emergency === 'yes', hours: t.opening_hours || '', web: /^https?:/.test(t.website || '') ? t.website : '', outdoor: t.outdoor_seating === 'yes' };
        const k = t.amenity === 'place_of_worship' ? 'worship' : t.amenity === 'restaurant' ? 'food' : t.shop === 'mall' ? 'mall' : t.amenity === 'hospital' ? 'hospital' : t.amenity === 'pharmacy' ? 'pharmacy' : t.amenity === 'police' ? 'police' : null;
        if (k) v[k].push(p);
      }
      cacheSet(key, v);
      return v;
    } catch (e) { /* try the next server */ }
  }
  return cacheAny(key);
}

export function distanceM(a, b) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function getPosition(timeoutMs = 10000) {
  // GPS first; indoors it often times out, so fall back to Wi-Fi/cell position instead of failing.
  const ask = (opts) => new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('unsupported'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy }),
      (e) => reject(e), opts);
  });
  return ask({ enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 10000 })
    .catch((e) => (e && e.code === 1 ? Promise.reject(e) : ask({ enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 })));
}
