# Keşif

*Keşfet. Topla. Geliş.* Türkiye'yi oyuna çeviren web uygulaması. İstanbul, Ankara, İzmir, Antalya, Kapadokya, Bursa, Eskişehir, Trabzon, Mardin ve Safranbolu için hazırlanmış şehir paketleri var; bunların dışında "Yakınım" modu damga duraklarını Wikipedia'dan, restoran, ibadet yeri ve hastaneleri OpenStreetMap'ten canlı bulur. Ziyaretçi gerçek yerlere gidip damga toplar, XP kazanır, seviye atlar, karakter ve rozet açar. Yanında taksi ücreti, namaz vakitleri, bayram takvimi ve acil durum araçları var. Telefona "Ana ekrana ekle" ile uygulama gibi kurulur.

## Ekranlar

İlk açılışta tanışma ekranı (ad, dil, şehir, konum izni). Konum açıksa karakter haritada ziyaretçiyle birlikte yürür; bir durağa 250 m yaklaşınca alt bant "Buradasın, damgayı al" olur ve tek dokunuşla damga alınır. Damga alınca konfetili kutlama, seviye atlama ve yeni karakter bildirimi çıkar. Haritadaki restoran, ibadet yeri ve hastane iğneleri Apple Haritalar tarzı bir kart açar (yol tarifi, arama, haritada aç).

| Ekran | Ne yapıyor |
|---|---|
| Harita | Eğik 3B şehir haritası (binalar yükseliyor), ışık hüzmeli oyuncu karakteri, damga durakları (parlayan mor iğne, toplanınca altın), ibadet yeri / restoran / hastane iğneleri, oyuncu çipi, şehir ve hava, "yakınında yeni bir keşif var" bandı, konum düğmesi, gezi araçları (zil) |
| Yer detayı | Wikimedia Commons fotoğrafı (fotoğrafçı ve lisansla), kaydet düğmesi, kısa açıklama, kategori, mesafe ve süre, ödüller (+750 XP, şehir rozeti), konumla "Damgayı al", Google Maps yol tarifi, damgadan sonra 1–5 yıldız kendi puanın |
| Görevler | Günlük, haftalık, özel görevler; ilerleme çubuğu, XP ödülü, "Al" düğmesi |
| Koleksiyon | 6 karakter (seviyeyle açılır), 9 rozet, 4 kostüm (rozetle açılır), sıradaki karakter yumurtası, fotoğraf albümü |
| Fotoğraf | Haritadaki kamera düğmesi ya da yer detayındaki "Fotoğraf çek". Bir durağa 250 m yakında çekilen ilk fotoğraf +150 XP. Fotoğraflar küçültülüp sadece telefonda (IndexedDB) saklanır; albümden büyütülür, paylaşılır, silinir |
| Profil | Maskot, ad, seviye ve XP, istatistikler, arkadaş kodu ve sıralama, rozetler, gezi araçları, dil ve şehir ayarı |
| Gün planı | 2–8 saat seç; henüz damgası alınmamış en yakın duraklar sırayla, kalış ve yürüme süreleriyle. Rota haritada çizilir ya da Google Haritalar'da açılır |
| Çevrimdışı | Görülen harita parçaları, fotoğraflar ve harita kütüphanesi telefonda kalır. Profil > Çevrimdışı harita ile seçili şehrin haritası önceden indirilir |
| Gezi araçları | Taksi ücreti, namaz ve ibadet yerleri (+hava, restoran, AVM), bayram takvimi, acil |

Oyun kuralları `js/game.js` içinde: damga başına 750 XP, seviye n → n+1 için 400 + 100·n XP. Her şey telefonda saklanır, sunucu yok.

Diller: Türkçe ve İngilizce tam. Almanca ve Rusça eski ekranlarda tam, yeni oyun ekranlarında henüz İngilizce görünüyor (`js/i18n.js` sonundaki blok).

**Maskot:** `js/mascot.js` içindeki SVG geçici bir çizim. Gerçek karakter çizimleri gelince bu dosyadaki fonksiyon resim döndürecek şekilde değiştirilir.

## Çalıştırma

Derleme adımı yok. Klasörü herhangi bir statik sunucuyla açman yeterli:

```bash
python3 -m http.server 8080
```

Sonra tarayıcıda `http://localhost:8080` adresini aç. Konum ve uygulama kurulumu için yayında HTTPS gerekir (GitHub Pages, Netlify ve Cloudflare Pages ücretsiz HTTPS verir).

## Veri kaynakları ve güncelleme

| Veri | Kaynak | Ne sıklıkla güncellenmeli |
|---|---|---|
| Hava durumu | [Open-Meteo](https://open-meteo.com) (anahtar gerekmez, CC BY 4.0) | Canlı |
| Namaz vakitleri | [AlAdhan](https://aladhan.com) API, `method=13` (Diyanet) | Canlı |
| İbadet yerleri, restoranlar, AVM, hastane, polis, eczane | OpenStreetMap, `data/places-*.json` | Birkaç haftada bir (aşağıya bak) |
| Taksi ve toplu taşıma ücretleri | Haber siteleri, 18 Kasım 2026 | Her zamda. `js/data.js` |
| Bayram tarihleri | Diyanet 2027 takvimi (haberlerden) | Yılda bir. `js/data.js` |
| Damga durağı koordinatları | OpenStreetMap Nominatim, 18 Kasım 2026 | Yeni durak eklerken |

### Mekân verisini güncelleme

İki yol var. İkisi de `data/.raw/` içine önbellek yazar, sonra `--cached` uygulama dosyalarını üretir.

```bash
# İstanbul: BBBike şehir dosyası (hızlı, ~1 dakika)
curl -L -o data/.raw/Istanbul.osm.gz https://download.bbbike.org/osm/bbbike/Istanbul/Istanbul.osm.gz
python3 tools/extract_osm.py data/.raw/Istanbul.osm.gz istanbul
```

```bash
# Diğer şehirler: Geofabrik'in Türkiye shapefile paketi (1,5 GB; Overpass kapalıyken en güvenilir yol)
curl -L -o data/.raw/turkey-latest-free.shp.zip https://download.geofabrik.de/europe/turkey-latest-free.shp.zip
python3 tools/extract_shp.py data/.raw/turkey-latest-free.shp.zip ankara izmir antalya kapadokya
```

```bash
# Ya da Overpass sunucularından (yavaş, sunucular sık kapalı; kaldığı yerden devam eder)
python3 tools/build_places.py ankara
```

```bash
# Telefon, adres, mutfak ve beslenme etiketleri: tam Türkiye dosyası (654 MB, ~2 dakikada okunur)
curl -L -o data/.raw/turkey-latest.osm.pbf https://download.geofabrik.de/europe/turkey-latest.osm.pbf
python3 tools/extract_pbf.py data/.raw/turkey-latest.osm.pbf
python3 tools/build_places.py --cached
```

Overpass sorguları dört parçaya bölünür ve her parça `data/.raw/tiles/` altında saklanır; kesilirse kaldığı parçadan devam eder.

```bash
# İnmiş olanlardan uygulama dosyalarını üret
python3 tools/build_places.py --cached
```

Yeniden indirmek için önce `data/.raw/<şehir>-*.json` dosyalarını sil.

**Neden mekânlar canlı değil:** Ücretsiz Overpass sunucuları test sırasında 502 hatası verdi ya da 40 saniyede cevap vermedi. Bu yüzden veri önceden indirilip uygulamayla birlikte geliyor.

### Doğrulanan ücretler (18 Kasım 2026)

- İstanbul sarı taksi: açılış 71,94 TL, km 47,92 TL, en az 230 TL
- Ankara taksi: açılış 65 TL, km 40 TL, en az 200 TL, bekleme dakikası 7 TL (1 Mart 2026 tarifesi)
- İstanbulkart tam: 46,20 TL (20 Temmuz 2026'dan beri). Vapur hatta göre ≈ 50–77 TL. Havaist IST → Sultanahmet ≈ 470 TL
- Ankara EGO tam: 40 TL (23 Ağustos 2026'dan beri). EGO 442 havalimanı ≈ 150 TL. Havaş/BelkoAir ≈ 200–230 TL

Kaynaklar haber siteleri. Yayına çıkmadan önce İBB/UKOME ve EGO'nun kendi sayfalarından son kez kontrol et.

## Bilinen eksikler

- **Arkadaşlar** sunucusuz çalışıyor: herkes `KSF-` ile başlayan kodunu paylaşır, arkadaşının kodunu Profil'e yapıştırır. Kod o anki puanı taşır, güncellemek için yeni kod gerekir. Canlı sıralama ve hile koruması için ileride sunucu gerekir.
- **Fotoğraflar** Wikimedia Commons'tan elle seçildi (`js/photos.js`). Fotoğrafın üstündeki fotoğrafçı ve lisans satırını kaldırma, lisans bunu istiyor.
- **Karakter çizimleri** geçici SVG (her karakterin kendi parçası var: lale, çini, simit, gaga, çizgiler). Tasarımdaki gibi 3D karakterler için illüstratör gerekli.
- **Harita** MapLibre + OpenFreeMap (ücretsiz, anahtarsız, 3B binalı "liberty" stili). Çok yoğun kullanımda kendi karo sunucusu ya da ücretli bir servis düşünülmeli.
- **Puanlar** şimdilik sadece kişinin kendi puanı. Herkesin ortalaması için sunucu gerekir, uydurma puan gösterilmiyor.
- **Restoran rezervasyonu** yok. Restoranlarla anlaşma yapılınca eklenecek. Şimdilik telefon numarası (varsa) ve harita bağlantısı gösteriliyor.
- **Nöbetçi eczane** listesi yok, sadece en yakın eczaneler. Resmi nöbetçi verisi için ayrı bir kaynak gerekiyor.
- OpenStreetMap'te helal/vejetaryen etiketi olan restoran az. Etiketler eksik olabilir.

## Dosyalar

```
index.html              Uygulama kabuğu
css/style.css           Tasarım (gece moru oyun teması, Apple sistem yazı tipleri, Apple Haritalar tarzı iğneler)
js/app.js               Ekranlar ve uygulama mantığı
js/game.js              XP, seviye, görevler, rozetler, karakterler
js/mascot.js            Maskot çizimi (SVG, geçici)
js/stops-info.js        Damga duraklarının kısa açıklamaları
js/photos.js            Durak fotoğrafları ve lisans bilgisi
js/album.js             Ziyaretçinin çektiği fotoğraflar (telefonda saklanır)
js/icons.js             Apple SF Symbols tarzı çizgi simgeler (çoğu Lucide, ISC lisansı)
js/api.js               Hava, namaz vakti, mekân verisi
js/data.js              Şehirler, ücretler, damga durakları, takvim
js/i18n.js              Dört dilde metinler
data/places-*.json      OpenStreetMap'ten hazır mekân verisi
tools/build_places.py   Mekân verisini Overpass'tan indirir, uygulama dosyalarını üretir
tools/extract_osm.py    Mekânları OpenStreetMap şehir dosyasından çıkarır
tools/extract_shp.py    Mekânları Geofabrik Türkiye shapefile paketinden çıkarır
tools/extract_pbf.py    Tam Türkiye .pbf dosyasından telefon, adres, mutfak ekler (ek paket gerekmez)
sw.js                   Çevrimdışı çalışma
manifest.webmanifest    Telefona kurulum
```

Harita verisi © OpenStreetMap katkıcıları (ODbL). Uygulamadaki kaynak satırını kaldırma.
