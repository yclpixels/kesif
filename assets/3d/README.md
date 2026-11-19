# Keşif 3D karakterleri: teslim rehberi

Bu klasör 3D karakter dosyalarının yeri. Buraya doğru adla konan dosyayı uygulama kendiliğinden
kullanır; dosya yoksa eski çizim (SVG) görünmeye devam eder. Yani karakterleri tek tek, bitirdikçe
ekleyebilirsin.

## Karakterler

| Kimlik (dosya adı) | Karakter | Açıldığı seviye | Ana renkler |
|---|---|---|---|
| `pusula` | Pusula (ilk karakter) | 1 | koyu mor gövde, açık lila karın, mor vurgu, mavi taş |
| `lale` | Lale | 3 | bordo gövde, açık pembe karın, pembe vurgu, sarı taş |
| `cini` | Çini | 5 | lacivert gövde, açık mavi karın, mavi vurgu, beyaz taş |
| `simit` | Simit | 8 | kahverengi gövde, krem karın, turuncu vurgu, kırmızı taş |
| `marti` | Martı | 12 | açık gri gövde, beyaz karın, gri vurgu, sarı taş |
| `kedi` | Kedi | 16 | koyu gri gövde, açık gri karın, yeşil vurgu, mor taş |

Kostümler (isteğe bağlı): `scarf` (atkı), `fez` (fes), `hat` (şapka), `cape` (pelerin).

## Her karakter için iki dosya

1. **`<kimlik>.png`** — uygulamanın her yerinde kullanılır (harita, profil, koleksiyon).
   - 1024 × 1024 piksel, **şeffaf arka plan**, karakter ortada, tam boy, önden ya da hafif yandan.
   - Ayakların altında ~%8 boşluk; haritada karakter ayaklarının üstünde duruyor.
   - 600 KB'tan küçük olsun (gerekirse https://squoosh.app ile sıkıştır).
2. **`<kimlik>.glb`** — profil ve koleksiyonda döndürülebilir 3D görünüm için (isteğe bağlı).
   - glTF Binary (.glb), dokular içinde gömülü, **5 MB'tan küçük** (Blender: Export › glTF 2.0 ›
     Compression açık, dokular 1024 px).
   - Model ayakta, yüzü kameraya (+Z) dönük, ayaklar 0 yüksekliğinde; boyu yaklaşık 1 birim.
   - Bekleme animasyonu varsa adı `idle` olsun; uygulama onu oynatır.

Kostüm için ayrı görsel istersen: `<kimlik>-<kostüm>.png` (örnek: `pusula-fez.png`), aynı ölçüler.

## manifest.json

Hangi dosyaların hazır olduğunu uygulamaya bu dosya söyler. Yeni dosya ekleyince buraya da yaz:

```json
{
  "characters": {
    "pusula": { "png": "pusula.png", "glb": "pusula.glb", "costumes": { "fez": "pusula-fez.png" } }
  }
}
```

Henüz hazır olmayan karakteri hiç yazma. Sadece PNG hazırsa `"glb"` satırını koyma.

## GitHub ile gönderme

1. Depoyu indir: `git clone https://github.com/yclpixels/kesif.git`
2. Kendi dalını aç: `git switch -c 3d-pusula`
3. Dosyaları `assets/3d/` içine koy, `manifest.json`'u güncelle.
4. `git add assets/3d && git commit -m "3D: pusula" && git push -u origin 3d-pusula`
5. GitHub'da "Compare & pull request" düğmesine bas. Kontrol edilip ana projeye eklenir.

Sadece `assets/3d/` içindeki dosyaları değiştir; kod tarafı ayrı ilerliyor, böylece çakışma olmaz.
Claude Code kullanıyorsan bu klasörde ona "bu rehbere göre pusula'yı ekle" demen yeterli.

## Lisans

Depo herkese açık. Bu klasördeki modellerin ve görsellerin nasıl kullanılabileceğine birlikte karar
verip buraya yazın (örnek: "Tüm hakları saklıdır" ya da "CC BY 4.0").
