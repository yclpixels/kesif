// Keşif photo server (Cloudflare Worker + R2 + D1).
// Visitors share views of places; everyone sees them on the place card and on the map.
//
//   POST   /api/photos           upload (multipart): photo, place, lat, lon, name, kind, device, turnstile
//   GET    /api/photos?place=…   live photos of one place
//   GET    /api/near?lat=&lon=   live photos around a point (for the map), newest first
//   GET    /img/<id>.jpg         the picture itself (cached for a year)
//   POST   /api/photos/<id>/report   {device}  → hidden after REPORT_LIMIT different reports
//   DELETE /api/photos/<id>      header X-Delete-Token: the token returned at upload (owner only)
//   GET    /admin                review page; /api/admin/* need header X-Admin-Key
//
// Every upload is checked twice: on the phone (js/photocheck.js) and here with Google Vision
// SafeSearch, because a phone check can be skipped by a modified app.

const MAX_BYTES = 2_500_000;
const DAILY_LIMIT = 20; // uploads per device per day
const REPORT_LIMIT = 3;
const PLACE_RE = /^(p_-?\d{1,3}\.\d{1,5}_-?\d{1,3}\.\d{1,5}|[a-z0-9_]{2,40}|wp:[a-z]{2}:\d{1,12})$/;
const DEVICE_RE = /^[a-z0-9]{16,40}$/;

const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra }
});
const rid = () => [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, '0')).join('');

function cors(env, req) {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0] || '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Delete-Token, X-Admin-Key',
    'Vary': 'Origin'
  };
}

async function turnstileOk(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return true; // local development without Turnstile
  if (!token) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET); body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const d = await r.json().catch(() => ({}));
  return !!d.success;
}

// Google Vision SafeSearch. Refuses when adult or racy content is LIKELY or VERY_LIKELY.
async function safeSearchOk(env, bytes) {
  if (!env.VISION_API_KEY) return env.ALLOW_UNCHECKED === '1'; // never skip in production
  let bin = '';
  const u8 = new Uint8Array(bytes);
  for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  const r = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${env.VISION_API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [{ image: { content: btoa(bin) }, features: [{ type: 'SAFE_SEARCH_DETECTION' }] }] })
  });
  if (!r.ok) return false;
  const s = (await r.json()).responses?.[0]?.safeSearchAnnotation;
  if (!s) return false;
  const bad = (v) => v === 'LIKELY' || v === 'VERY_LIKELY';
  return !bad(s.adult) && !bad(s.racy) && !bad(s.violence);
}

async function upload(req, env) {
  const form = await req.formData().catch(() => null);
  if (!form) return json({ error: 'bad_form' }, 400);
  const photo = form.get('photo'), place = String(form.get('place') || ''), device = String(form.get('device') || '');
  const lat = Number(form.get('lat')), lon = Number(form.get('lon'));
  const name = String(form.get('name') || '').trim().slice(0, 20);
  const placeName = String(form.get('placeName') || '').trim().slice(0, 80);
  const kind = form.get('kind') === 'selfie' ? 'selfie' : 'view';
  if (!(photo instanceof File) || photo.size > MAX_BYTES || photo.type !== 'image/jpeg') return json({ error: 'bad_photo' }, 400);
  if (!PLACE_RE.test(place) || !DEVICE_RE.test(device)) return json({ error: 'bad_place' }, 400);
  if (!(lat > 35 && lat < 43 && lon > 25 && lon < 45.5)) return json({ error: 'outside_turkey' }, 400);
  if (!(await turnstileOk(env, form.get('turnstile'), req.headers.get('CF-Connecting-IP')))) return json({ error: 'bot' }, 403);

  const banned = await env.DB.prepare('SELECT 1 FROM banned WHERE device = ?').bind(device).first();
  if (banned) return json({ error: 'banned' }, 403);
  const today = await env.DB.prepare("SELECT COUNT(*) AS n FROM photos WHERE device = ? AND created > datetime('now', '-1 day')").bind(device).first();
  if ((today?.n || 0) >= DAILY_LIMIT) return json({ error: 'limit' }, 429);

  const bytes = await photo.arrayBuffer();
  // JPEG files start with FF D8: refuse anything pretending to be one.
  const head = new Uint8Array(bytes, 0, 2);
  if (head[0] !== 0xff || head[1] !== 0xd8) return json({ error: 'bad_photo' }, 400);
  if (!(await safeSearchOk(env, bytes))) return json({ error: 'refused' }, 422);

  const id = rid(), token = rid();
  await env.BUCKET.put(`photos/${id}.jpg`, bytes, { httpMetadata: { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000, immutable' } });
  await env.DB.prepare('INSERT INTO photos (id, place, place_name, lat, lon, name, kind, device, token, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, place, placeName, lat, lon, name, kind, device, token, 'live').run();
  return json({ id, token, url: `/img/${id}.jpg` }, 201);
}

const PUBLIC_COLS = 'id, place, place_name AS placeName, lat, lon, name, kind, created';

async function list(url, env) {
  const place = url.searchParams.get('place') || '';
  if (!PLACE_RE.test(place)) return json({ error: 'bad_place' }, 400);
  const { results } = await env.DB.prepare(`SELECT ${PUBLIC_COLS} FROM photos WHERE place = ? AND status = 'live' ORDER BY created DESC LIMIT 60`).bind(place).all();
  return json({ photos: results }, 200, { 'Cache-Control': 'public, max-age=60' });
}

async function near(url, env) {
  const lat = Number(url.searchParams.get('lat')), lon = Number(url.searchParams.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return json({ error: 'bad_point' }, 400);
  const d = 0.03; // about 3 km
  const { results } = await env.DB.prepare(`SELECT ${PUBLIC_COLS} FROM photos WHERE status = 'live' AND lat BETWEEN ? AND ? AND lon BETWEEN ? AND ? ORDER BY created DESC LIMIT 80`)
    .bind(lat - d, lat + d, lon - d, lon + d).all();
  return json({ photos: results }, 200, { 'Cache-Control': 'public, max-age=60' });
}

async function image(id, env) {
  if (!/^[a-f0-9]{24}$/.test(id)) return new Response('not found', { status: 404 });
  const row = await env.DB.prepare("SELECT status FROM photos WHERE id = ?").bind(id).first();
  if (!row || row.status !== 'live') return new Response('not found', { status: 404 });
  const obj = await env.BUCKET.get(`photos/${id}.jpg`);
  if (!obj) return new Response('not found', { status: 404 });
  return new Response(obj.body, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' } });
}

async function report(id, req, env) {
  const { device } = await req.json().catch(() => ({}));
  if (!/^[a-f0-9]{24}$/.test(id) || !DEVICE_RE.test(String(device || ''))) return json({ error: 'bad_request' }, 400);
  await env.DB.prepare('INSERT OR IGNORE INTO reports (photo, device) VALUES (?, ?)').bind(id, device).run();
  const c = await env.DB.prepare('SELECT COUNT(*) AS n FROM reports WHERE photo = ?').bind(id).first();
  if ((c?.n || 0) >= REPORT_LIMIT) await env.DB.prepare("UPDATE photos SET status = 'hidden' WHERE id = ? AND status = 'live'").bind(id).run();
  return json({ ok: true });
}

async function remove(id, req, env) {
  const token = req.headers.get('X-Delete-Token') || '';
  const row = await env.DB.prepare('SELECT token FROM photos WHERE id = ?').bind(id).first();
  if (!row || !token || row.token !== token) return json({ error: 'forbidden' }, 403);
  await env.BUCKET.delete(`photos/${id}.jpg`);
  await env.DB.prepare("UPDATE photos SET status = 'deleted' WHERE id = ?").bind(id).run();
  return json({ ok: true });
}

// ---- review (only with the admin key) ----
async function admin(url, req, env) {
  if (!env.ADMIN_KEY || req.headers.get('X-Admin-Key') !== env.ADMIN_KEY) return json({ error: 'forbidden' }, 403);
  if (url.pathname === '/api/admin/queue') {
    const { results } = await env.DB.prepare(`SELECT p.id, p.place_name AS placeName, p.name, p.kind, p.created, p.status, p.device,
        (SELECT COUNT(*) FROM reports r WHERE r.photo = p.id) AS reports
      FROM photos p WHERE p.status = 'hidden' OR (p.status = 'live' AND EXISTS (SELECT 1 FROM reports r WHERE r.photo = p.id))
      ORDER BY reports DESC, p.created DESC LIMIT 100`).all();
    return json({ photos: results });
  }
  if (url.pathname === '/api/admin/decide' && req.method === 'POST') {
    const { id, action } = await req.json().catch(() => ({}));
    if (!/^[a-f0-9]{24}$/.test(String(id || ''))) return json({ error: 'bad_request' }, 400);
    if (action === 'keep') {
      await env.DB.prepare("UPDATE photos SET status = 'live' WHERE id = ?").bind(id).run();
      await env.DB.prepare('DELETE FROM reports WHERE photo = ?').bind(id).run();
    } else if (action === 'delete' || action === 'ban') {
      const row = await env.DB.prepare('SELECT device FROM photos WHERE id = ?').bind(id).first();
      await env.BUCKET.delete(`photos/${id}.jpg`);
      await env.DB.prepare("UPDATE photos SET status = 'removed' WHERE id = ?").bind(id).run();
      if (action === 'ban' && row) await env.DB.prepare('INSERT OR IGNORE INTO banned (device) VALUES (?)').bind(row.device).run();
    } else return json({ error: 'bad_action' }, 400);
    return json({ ok: true });
  }
  if (url.pathname.startsWith('/api/admin/img/')) {
    const id = url.pathname.split('/').pop();
    const obj = /^[a-f0-9]{24}$/.test(id) ? await env.BUCKET.get(`photos/${id}.jpg`) : null;
    return obj ? new Response(obj.body, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store' } }) : new Response('not found', { status: 404 });
  }
  return json({ error: 'not_found' }, 404);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), h = cors(env, req);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    let res;
    try {
      const m = url.pathname.match(/^\/api\/photos\/([a-f0-9]{24})(\/report)?$/);
      if (url.pathname === '/api/photos' && req.method === 'POST') res = await upload(req, env);
      else if (url.pathname === '/api/photos' && req.method === 'GET') res = await list(url, env);
      else if (url.pathname === '/api/near' && req.method === 'GET') res = await near(url, env);
      else if (m && m[2] && req.method === 'POST') res = await report(m[1], req, env);
      else if (m && !m[2] && req.method === 'DELETE') res = await remove(m[1], req, env);
      else if (url.pathname.startsWith('/img/')) res = await image(url.pathname.slice(5).replace(/\.jpg$/, ''), env);
      else if (url.pathname.startsWith('/api/admin/')) res = await admin(url, req, env);
      else if (url.pathname === '/admin') res = new Response(ADMIN_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
      else res = json({ error: 'not_found' }, 404);
    } catch (e) {
      res = json({ error: 'server' }, 500);
    }
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(h)) out.headers.set(k, v);
    return out;
  }
};

// The review page: paste the admin key once, then keep / delete / ban reported photos.
const ADMIN_HTML = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Keşif · Fotoğraf inceleme</title>
<style>body{font:15px system-ui,-apple-system,sans-serif;margin:0;padding:16px;background:#f5f4f8;color:#1c1c1e}h1{font-size:20px}
.k{display:flex;gap:8px;margin-bottom:16px}.k input{flex:1;padding:10px;border-radius:10px;border:1px solid #ccc}
button{padding:10px 14px;border:0;border-radius:10px;background:#7c3aed;color:#fff;font-weight:700;cursor:pointer}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}.c{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px #0002}
.c img{width:100%;height:220px;object-fit:cover;display:block;background:#ddd}.c div{padding:10px}.c small{color:#666;display:block;margin:4px 0 8px}
.r{display:flex;gap:6px;flex-wrap:wrap}.del{background:#d70015}.ban{background:#1c1c1e}.keep{background:#1f9d55}</style></head>
<body><h1>Bildirilen fotoğraflar</h1><div class="k"><input id="key" type="password" placeholder="Yönetici anahtarı"><button id="go">Yükle</button></div><div class="g" id="g"></div>
<script>
const $=(i)=>document.getElementById(i);$('key').value=sessionStorage.getItem('k')||'';
const H=()=>({'X-Admin-Key':$('key').value,'Content-Type':'application/json'});
async function load(){sessionStorage.setItem('k',$('key').value);const r=await fetch('/api/admin/queue',{headers:H()});if(!r.ok){$('g').textContent='Anahtar yanlış.';return;}
const d=await r.json();$('g').innerHTML=d.photos.length?'':'Bekleyen fotoğraf yok.';
for(const p of d.photos){const c=document.createElement('div');c.className='c';
const im=await fetch('/api/admin/img/'+p.id,{headers:H()});const url=im.ok?URL.createObjectURL(await im.blob()):'';
c.innerHTML='<img src="'+url+'" alt=""><div><b></b><small></small><div class="r"><button class="keep">Yayında kalsın</button><button class="del">Sil</button><button class="ban">Sil ve engelle</button></div></div>';
c.querySelector('b').textContent=p.placeName||'—';c.querySelector('small').textContent=(p.name||'Gezgin')+' · '+p.kind+' · '+p.reports+' bildirim · '+p.status+' · '+p.created;
const act=async(a)=>{if(a!=='keep'&&!confirm('Emin misin?'))return;await fetch('/api/admin/decide',{method:'POST',headers:H(),body:JSON.stringify({id:p.id,action:a})});c.remove();};
c.querySelector('.keep').onclick=()=>act('keep');c.querySelector('.del').onclick=()=>act('delete');c.querySelector('.ban').onclick=()=>act('ban');$('g').appendChild(c);}}
$('go').onclick=load;if($('key').value)load();
</script></body></html>`;
