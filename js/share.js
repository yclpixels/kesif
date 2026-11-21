// Shared photos: talk to the Keşif photo server (server/). Until the server is set up, PHOTO_API is
// empty and the app simply keeps photos on the phone, as before.
// For local testing: localStorage.setItem('damga:api', '"http://localhost:8787"')
const PHOTO_API_LIVE = ''; // e.g. 'https://kesif-photos.<account>.workers.dev' after `npm run deploy`
export const TURNSTILE_SITEKEY = '';

const ls = (k, d) => { try { const v = localStorage.getItem('damga:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem('damga:' + k, JSON.stringify(v)); } catch { /* private mode */ } };

export const api = () => ls('api', '') || PHOTO_API_LIVE;
export const enabled = () => !!api();
export const imgUrl = (id) => `${api()}/img/${id}.jpg`;

// A random id for this phone: no account, but lets the server limit uploads and the owner delete.
export function deviceId() {
  let id = ls('device', '');
  if (!/^[a-z0-9]{20}$/.test(id)) {
    id = [...crypto.getRandomValues(new Uint8Array(10))].map((b) => b.toString(16).padStart(2, '0')).join('');
    lsSet('device', id);
  }
  return id;
}

// Album photo id → { id, token } on the server
export const sharedOf = (albumId) => ls('shared', {})[albumId] || null;
export const isMine = (serverId) => Object.values(ls('shared', {})).some((s) => s.id === serverId);
export const consented = () => ls('shareOK', false) === true;
export const setConsent = () => lsSet('shareOK', true);

let turnstileReady = null;
async function turnstileToken() {
  if (!TURNSTILE_SITEKEY) return '';
  if (!turnstileReady) {
    turnstileReady = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
  }
  await turnstileReady;
  return new Promise((resolve) => {
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;bottom:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(box);
    window.turnstile.render(box, { sitekey: TURNSTILE_SITEKEY, size: 'invisible', callback: (t) => { box.remove(); resolve(t); }, 'error-callback': () => { box.remove(); resolve(''); } });
  });
}

/** Upload one album photo. Returns { ok, id } or { ok: false, error }. */
// Draw the picture again so nothing hidden travels with it (location, camera model): only pixels.
async function clean(blob) {
  const bmp = await createImageBitmap(blob);
  const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), 'image/jpeg', 0.85));
}

export async function sharePhoto(albumPhoto, blob, { name, placeName }) {
  const f = new FormData();
  f.append('photo', new File([await clean(blob)], 'photo.jpg', { type: 'image/jpeg' }));
  f.append('place', albumPhoto.stop);
  f.append('lat', albumPhoto.lat); f.append('lon', albumPhoto.lon);
  f.append('name', name || ''); f.append('placeName', placeName || albumPhoto.place || '');
  f.append('kind', albumPhoto.kind || 'view');
  f.append('device', deviceId());
  f.append('turnstile', await turnstileToken());
  try {
    const r = await fetch(`${api()}/api/photos`, { method: 'POST', body: f });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: d.error || 'server' };
    const all = ls('shared', {}); all[albumPhoto.id] = { id: d.id, token: d.token }; lsSet('shared', all);
    return { ok: true, id: d.id };
  } catch { return { ok: false, error: 'offline' }; }
}

export async function unshare(albumId) {
  const s = sharedOf(albumId); if (!s) return true;
  try {
    const r = await fetch(`${api()}/api/photos/${s.id}`, { method: 'DELETE', headers: { 'X-Delete-Token': s.token } });
    if (!r.ok && r.status !== 403) return false;
  } catch { return false; }
  const all = ls('shared', {}); delete all[albumId]; lsSet('shared', all);
  return true;
}

export async function report(serverId) {
  try { await fetch(`${api()}/api/photos/${serverId}/report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ device: deviceId() }) }); return true; } catch { return false; }
}

// Small cache so cards don't ask twice in a minute.
const cache = new Map();
async function getCached(url) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < 60000) return hit.data;
  const d = await (await fetch(url, { cache: 'no-store' })).json(); // fresh after your own share; the 60 s cache above is enough
  cache.set(url, { at: Date.now(), data: d.photos || [] });
  return d.photos || [];
}
export const placePhotos = (place) => (enabled() ? getCached(`${api()}/api/photos?place=${encodeURIComponent(place)}`).catch(() => []) : Promise.resolve([]));
export const nearPhotos = (lat, lon) => (enabled() ? getCached(`${api()}/api/near?lat=${lat.toFixed(3)}&lon=${lon.toFixed(3)}`).catch(() => []) : Promise.resolve([]));
export const forget = () => cache.clear();
