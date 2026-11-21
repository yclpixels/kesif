// Photo check, done on the phone (nothing is uploaded): no nudity, and only selfies or views
// (landscapes, landmarks, streets). Three small models, loaded the first time a photo is added:
//   - nudity:   NSFWJS MobileNetV2 (MIT, infinitered/nsfwjs)        assets/models/nsfw/
//   - faces:    BlazeFace (Apache-2.0, TensorFlow.js models)         assets/models/face/
//   - scenes:   MobileNet v1 0.25 ImageNet (Apache-2.0)              assets/models/scene/
const TF = ['https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js', 'sha384-vE8hbVJ4lezako5rlvE7bY0BVzWlFhZncPlckrqNwcUQpVtgbENTgZ8TBbnPjZre'];
const BF = ['https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.1.0/dist/blazeface.min.umd.js', 'sha384-iJWhpSChNu7IJ/gTquk8wahHVB/jxKE5A0Qf232C02mC8l9saaVFnjnBfKwd7G8E'];
const M = './assets/models/';

const script = ([src, integrity]) => new Promise((resolve, reject) => {
  if (document.querySelector(`script[src="${src}"]`)) return resolve();
  const s = document.createElement('script');
  s.src = src; s.integrity = integrity; s.crossOrigin = 'anonymous';
  s.onload = resolve; s.onerror = reject;
  document.head.appendChild(s);
});

let ready = null;
function load() {
  if (!ready) {
    ready = (async () => {
      await script(TF);
      await script(BF);
      const tf = window.tf;
      const [nsfw, face, scene, classes] = await Promise.all([
        tf.loadLayersModel(M + 'nsfw/model.json'),
        window.blazeface.load({ modelUrl: M + 'face/model.json', maxFaces: 3 }),
        tf.loadLayersModel(M + 'scene/model.json'),
        fetch(M + 'scene/scene-classes.json').then((r) => r.json())
      ]);
      return { tf, nsfw, face, scene, sceneSet: new Set(classes.scene) };
    })();
    ready.catch(() => { ready = null; }); // try again next time (e.g. was offline)
  }
  return ready;
}

// Start loading in the background (e.g. when the camera opens), so the check is quick afterwards.
export const warmUp = () => { load().catch(() => {}); };

function canvasOf(bmp, side) {
  const k = Math.min(1, side / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k));
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return c;
}

/**
 * @returns {Promise<{ok: boolean, kind?: 'selfie'|'view', reason?: 'nudity'|'drawing'|'other'|'offline'}>}
 */
export async function checkPhoto(file) {
  let m;
  try { m = await load(); } catch { return { ok: false, reason: 'offline' }; }
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return { ok: false, reason: 'other' };
  const { tf } = m;
  const small = canvasOf(bmp, 512);

  // 1. Nudity: classes are Drawing, Hentai, Neutral, Porn, Sexy.
  const [drawing, hentai, , porn, sexy] = tf.tidy(() => {
    const x = tf.image.resizeBilinear(tf.browser.fromPixels(small).toFloat().div(255), [224, 224]).expandDims(0);
    return Array.from(m.nsfw.predict(x).dataSync());
  });
  if (porn > 0.3 || hentai > 0.3 || sexy > 0.6) return { ok: false, reason: 'nudity' };

  // 2. A face that fills a good part of the picture: a selfie.
  const faces = await m.face.estimateFaces(small, false).catch(() => []);
  const area = small.width * small.height;
  const big = faces.some((f) => {
    const [x1, y1] = f.topLeft, [x2, y2] = f.bottomRight;
    return (f.probability?.[0] ?? f.probability ?? 1) > 0.85 && ((x2 - x1) * (y2 - y1)) / area > 0.025;
  });
  if (big) return drawing > 0.8 ? { ok: false, reason: 'drawing' } : { ok: true, kind: 'selfie' }; // a painted face is not a selfie

  // 3. Otherwise it must look like a place: landscape, landmark, street, sea... A confident close-up
  //    of a thing (food, a screen, a document, a pet) is not a view.
  const probs = tf.tidy(() => {
    const x = tf.image.resizeBilinear(tf.browser.fromPixels(small).toFloat(), [224, 224]).div(127.5).sub(1).expandDims(0);
    return Array.from(m.scene.predict(x).dataSync());
  });
  const top = probs.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]).slice(0, 3);
  const looksLikePlace = top.some(([p, i]) => m.sceneSet.has(i) && p > 0.05);
  if (looksLikePlace) return { ok: true, kind: 'view' };
  // Old stone and painted façades can look "drawn"; only call it a drawing when nothing says place.
  if (drawing > 0.7) return { ok: false, reason: 'drawing' };
  if (top[0][0] < 0.35) return { ok: true, kind: 'view' };
  return { ok: false, reason: 'other' };
}
