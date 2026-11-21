// Keşif photo album: pictures the visitor takes, kept only on this phone (IndexedDB).
// Each photo is shrunk to at most 1600 px before saving so the album stays small.
const DB = 'kesif-album', STORE = 'photos', MAX_SIDE = 1600, QUALITY = 0.82;

let dbPromise;
function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}
async function tx(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction(STORE, mode), s = t.objectStore(STORE);
    const out = fn(s);
    t.oncomplete = () => resolve(out && 'result' in out ? out.result : out);
    t.onerror = () => reject(t.error);
  });
}

// Photo metadata in memory so screens can render synchronously; blobs are read on demand.
let meta = [];
const urls = new Map();
export const photos = () => meta;
export const photosFor = (stopId) => meta.filter((p) => p.stop === stopId);

export async function loadAlbum() {
  try {
    const all = await tx('readonly', (s) => s.getAll());
    meta = all.map(({ blob, ...m }) => m).sort((a, b) => b.ts - a.ts);
    for (const p of all) if (!urls.has(p.id)) urls.set(p.id, URL.createObjectURL(p.blob));
  } catch { meta = []; }
  return meta;
}
export const photoUrl = (id) => urls.get(id) || '';

async function shrink(file) {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file; // unknown format: keep the original
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob((b) => res(b || file), 'image/jpeg', QUALITY));
}

// stop: passport stop id or '' for a free view photo. place: name to show. pos: {lat, lon} or null.
export async function addPhoto(file, { stop = '', city = '', place = '', pos = null, kind = '' } = {}) {
  const blob = await shrink(file);
  const p = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), stop, city, place, kind, ts: Date.now(), lat: pos?.lat ?? null, lon: pos?.lon ?? null };
  await tx('readwrite', (s) => s.put({ ...p, blob }));
  meta = [p, ...meta];
  urls.set(p.id, URL.createObjectURL(blob));
  return p;
}

export async function deletePhoto(id) {
  await tx('readwrite', (s) => s.delete(id));
  meta = meta.filter((p) => p.id !== id);
  const u = urls.get(id); if (u) URL.revokeObjectURL(u);
  urls.delete(id);
}

export async function photoFile(id) {
  const rec = await tx('readonly', (s) => s.get(id));
  return rec ? new File([rec.blob], `kesif-${rec.place || 'photo'}-${new Date(rec.ts).toISOString().slice(0, 10)}.jpg`.replace(/\s+/g, '-'), { type: rec.blob.type || 'image/jpeg' }) : null;
}
