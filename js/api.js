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
    phone: p.p || '', street: p.s || '', religion: p.r || '', cuisine: p.c || '',
    halal: diet.includes('h'), vegetarian: diet.includes('v'), kosher: diet.includes('k'),
    emergency: !!p.e
  };
}

export function distanceM(a, b) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function getPosition(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('unsupported'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy }),
      (e) => reject(e),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 }
    );
  });
}
