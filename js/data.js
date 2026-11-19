// Damga — static city data.
// Every fare and date here was checked on 2026-11-18. See README.md "Veri kaynakları" before changing.
// Coordinates come from OpenStreetMap (Nominatim) lookups on the same date.

export const CHECKED = '2026-11-18';

export const CITIES = {
  istanbul: {
    id: 'istanbul',
    name: { en: 'Istanbul', tr: 'İstanbul', de: 'Istanbul', ru: 'Стамбул' },
    center: { lat: 41.0065, lon: 28.9760, label: 'Sultanahmet' },
    taxi: {
      open: 71.94, perKm: 47.92, min: 230,
      note: 'UKOME 2026, yellow taxi',
      routes: [
        ['Istanbul Airport (IST) → Sultanahmet', 52],
        ['Sabiha Gökçen Airport (SAW) → Sultanahmet', 48],
        ['Taksim → Sultanahmet', 4.5],
        ['Sultanahmet → Galata Tower', 3],
        ['Kadıköy → Taksim', 13]
      ]
    },
    card: 'Istanbulkart',
    transit: [
      ['transit_metro_ist', '46.20 TL'],
      ['transit_ferry', '≈ 50–77 TL'],
      ['transit_air_ist', '≈ 470 TL']
    ],
    stamps: [
      { id: 'hagia', name: 'Hagia Sophia', lat: 41.0085, lon: 28.9800 },
      { id: 'blue', name: 'Blue Mosque', lat: 41.0054, lon: 28.9769 },
      { id: 'cistern', name: 'Basilica Cistern', lat: 41.0085, lon: 28.9784 },
      { id: 'topkapi', name: 'Topkapı Palace', lat: 41.0130, lon: 28.9841 },
      { id: 'bazaar', name: 'Grand Bazaar', lat: 41.0110, lon: 28.9675 },
      { id: 'galata', name: 'Galata Tower', lat: 41.0256, lon: 28.9742 },
      { id: 'spice', name: 'Spice Bazaar', lat: 41.0165, lon: 28.9705 },
      { id: 'kpier', name: 'Kadıköy Ferry Pier', lat: 40.9929, lon: 29.0229 },
      { id: 'kmarket', name: 'Kadıköy Market', lat: 40.9910, lon: 29.0254 }
    ],
    embassy: 'emb_ist',
    tip: 'tip_ist'
  },
  ankara: {
    id: 'ankara',
    name: { en: 'Ankara', tr: 'Ankara', de: 'Ankara', ru: 'Анкара' },
    center: { lat: 39.9210, lon: 32.8540, label: 'Kızılay' },
    taxi: {
      open: 65, perKm: 40, min: 200,
      note: 'Ankara tariff from 1 March 2026, waiting 7 TL/min',
      routes: [
        ['Esenboğa Airport (ESB) → Kızılay', 30],
        ['AŞTİ bus terminal → Kızılay', 6],
        ['Kızılay → Anıtkabir', 2.5],
        ['Kızılay → Ankara Castle', 3.6],
        ['Kızılay → Çankaya embassy area', 4]
      ]
    },
    card: 'AnkaraKart',
    transit: [
      ['transit_metro_ank', '40 TL'],
      ['transit_air_ank_ego', '≈ 150 TL'],
      ['transit_air_ank_havas', '≈ 200–230 TL']
    ],
    stamps: [
      { id: 'anitkabir', name: 'Anıtkabir', lat: 39.9267, lon: 32.8366 },
      { id: 'anadolu', name: 'Museum of Anatolian Civilizations', lat: 39.9379, lon: 32.8618 },
      { id: 'kale', name: 'Ankara Castle', lat: 39.9415, lon: 32.8654 },
      { id: 'hamamonu', name: 'Hamamönü', lat: 39.9335, lon: 32.8661 },
      { id: 'kocatepe', name: 'Kocatepe Mosque', lat: 39.9168, lon: 32.8607 },
      { id: 'augustus', name: 'Temple of Augustus', lat: 39.9442, lon: 32.8582 },
      { id: 'atakule', name: 'Atakule', lat: 39.8861, lon: 32.8561 },
      { id: 'genclik', name: 'Gençlik Park', lat: 39.9372, lon: 32.8496 },
      { id: 'erimtan', name: 'Erimtan Museum', lat: 39.9378, lon: 32.8630 }
    ],
    embassy: 'emb_ank',
    tip: 'tip_ank'
  },
  izmir: {
    id: 'izmir',
    name: { en: 'İzmir', tr: 'İzmir', de: 'Izmir', ru: 'Измир' },
    center: { lat: 38.4190, lon: 27.1286, label: 'Konak' },
    taxi: {
      open: 40, perKm: 54, min: 210,
      note: 'İzmir 2026 (news sites; not on the official site)',
      routes: [
        ['İzmir Airport (ADB) → Konak', 18],
        ['Konak → Alsancak', 3],
        ['Konak → Kadifekale', 3.5],
        ['Konak → Karşıyaka', 13],
        ['Bus terminal (Otogar) → Konak', 11]
      ]
    },
    card: 'İzmirimKart',
    transit: [
      ['transit_izm', '35 TL'],
      ['transit_izban', '40 TL'],
      ['transit_air_izm', '77 TL']
    ],
    stamps: [
      { id: 'iz_clock', name: 'İzmir Clock Tower', lat: 38.4189, lon: 27.1287 },
      { id: 'iz_yali', name: 'Konak Yalı Mosque', lat: 38.4191, lon: 27.1293 },
      { id: 'iz_kemeralti', name: 'Kemeraltı Bazaar', lat: 38.4187, lon: 27.1307 },
      { id: 'iz_kizlaragasi', name: 'Kızlarağası Han', lat: 38.4212, lon: 27.1333 },
      { id: 'iz_agora', name: 'Agora of Smyrna', lat: 38.4191, lon: 27.1384 },
      { id: 'iz_kadifekale', name: 'Kadifekale', lat: 38.4138, lon: 27.1450 },
      { id: 'iz_asansor', name: 'Historic Elevator', lat: 38.4084, lon: 27.1176 },
      { id: 'iz_kordon', name: 'Kordon Promenade', lat: 38.4337, lon: 27.1382 },
      { id: 'iz_kulturpark', name: 'Kültürpark', lat: 38.4279, lon: 27.1455 }
    ],
    embassy: 'emb_izm',
    tip: 'tip_izm'
  },
  antalya: {
    id: 'antalya',
    name: { en: 'Antalya', tr: 'Antalya', de: 'Antalya', ru: 'Анталья' },
    center: { lat: 36.8868, lon: 30.7055, label: 'Kaleiçi' },
    taxi: {
      open: 40, perKm: 50, min: 200,
      note: 'Antalya centre 2026 (news sites; not on the official site)',
      routes: [
        ['Antalya Airport (AYT) → Kaleiçi', 15],
        ['Kaleiçi → Konyaaltı Beach', 6],
        ['Kaleiçi → Lara Beach', 13],
        ['Kaleiçi → Lower Düden Falls', 9],
        ['Bus terminal (Otogar) → Kaleiçi', 6]
      ]
    },
    card: 'AntalyaKart',
    transit: [
      ['transit_ant', '42 TL'],
      ['transit_air_ant', '42 TL'],
      ['transit_cc_ant', '50 TL']
    ],
    stamps: [
      { id: 'an_hadrian', name: "Hadrian's Gate", lat: 36.8853, lon: 30.7085 },
      { id: 'an_yivli', name: 'Yivli Minaret', lat: 36.8866, lon: 30.7045 },
      { id: 'an_clock', name: 'Kaleiçi Clock Tower', lat: 36.8868, lon: 30.7059 },
      { id: 'an_harbor', name: 'Old Harbour', lat: 36.8844, lon: 30.7021 },
      { id: 'an_kesik', name: 'Kesik Minare', lat: 36.8827, lon: 30.7057 },
      { id: 'an_hidirlik', name: 'Hıdırlık Tower', lat: 36.8813, lon: 30.7037 },
      { id: 'an_karaali', name: 'Karaalioğlu Park', lat: 36.8797, lon: 30.7048 },
      { id: 'an_museum', name: 'Antalya Museum', lat: 36.8858, lon: 30.6798 },
      { id: 'an_duden', name: 'Lower Düden Falls', lat: 36.8510, lon: 30.7835 }
    ],
    embassy: 'emb_ant',
    tip: 'tip_ant'
  },
  kapadokya: {
    id: 'kapadokya',
    name: { en: 'Cappadocia', tr: 'Kapadokya', de: 'Kappadokien', ru: 'Каппадокия' },
    center: { lat: 38.6421, lon: 34.8296, label: 'Göreme' },
    taxi: {
      open: 52, perKm: 65, min: 200,
      note: 'Nevşehir, April 2026 (local news; not on the official site)',
      routes: [
        ['Nevşehir Airport (NAV) → Göreme', 38],
        ['Göreme → Uçhisar', 4],
        ['Göreme → Avanos', 10],
        ['Göreme → Ürgüp', 9],
        ['Göreme → Kaymaklı Underground City', 25]
      ]
    },
    card: '',
    transit: [
      ['transit_shuttle_kap', '≈ 450–650 TL']
    ],
    stamps: [
      { id: 'ka_goreme', name: 'Göreme Open-Air Museum', lat: 38.6391, lon: 34.8456 },
      { id: 'ka_uchisar', name: 'Uçhisar Castle', lat: 38.6304, lon: 34.8053 },
      { id: 'ka_love', name: 'Love Valley', lat: 38.6590, lon: 34.8232 },
      { id: 'ka_pasabag', name: 'Paşabağ', lat: 38.6770, lon: 34.8549 },
      { id: 'ka_zelve', name: 'Zelve Open-Air Museum', lat: 38.6657, lon: 34.8653 },
      { id: 'ka_devrent', name: 'Devrent Valley', lat: 38.6751, lon: 34.8843 },
      { id: 'ka_ortahisar', name: 'Ortahisar Castle', lat: 38.6204, lon: 34.8645 },
      { id: 'ka_kaymakli', name: 'Kaymaklı Underground City', lat: 38.4599, lon: 34.7525 }
    ],
    embassy: 'emb_kap',
    tip: 'tip_kap'
  },
  bursa: {
    id: 'bursa',
    name: { en: "Bursa", tr: "Bursa", de: "Bursa", ru: "Бурса" },
    center: { lat: 40.1835, lon: 29.0618, label: "Ulu Cami" },
    taxi: {
      open: 65, perKm: 55, min: 190,
      note: "Bursa, from 11 Oct 2026 (news sites)",
      routes: [
        ["Bursa bus terminal → Ulu Cami", 10],
        ["Ulu Cami → Green Mosque", 1.5],
        ["Ulu Cami → Muradiye", 2],
        ["Ulu Cami → Cumalıkızık", 12]
      ]
    },
    card: '',
    transit: [],
    stamps: [
      { id: 'bu_ulu', name: "Grand Mosque of Bursa", lat: 40.1835, lon: 29.0618 },
      { id: 'bu_koza', name: "Koza Han", lat: 40.1844, lon: 29.0633 },
      { id: 'bu_irgandi', name: "Irgandı Bridge", lat: 40.1819, lon: 29.0708 },
      { id: 'bu_yesilcami', name: "Green Mosque", lat: 40.1822, lon: 29.0746 },
      { id: 'bu_yesilturbe', name: "Green Tomb", lat: 40.1814, lon: 29.0749 },
      { id: 'bu_muradiye', name: "Muradiye Complex", lat: 40.1911, lon: 29.0465 },
      { id: 'bu_cumali', name: "Cumalıkızık", lat: 40.1752, lon: 29.1727 }
    ],
    embassy: 'emb_any',
    tip: 'tip_any'
  },
  eskisehir: {
    id: 'eskisehir',
    name: { en: "Eskişehir", tr: "Eskişehir", de: "Eskişehir", ru: "Эскишехир" },
    center: { lat: 39.7667, lon: 30.524, label: "Odunpazarı" },
    taxi: {
      open: 65, perKm: 65, min: 200,
      note: "Eskişehir, from 1 Oct 2026 (news sites)",
      routes: [
        ["YHT station → Odunpazarı", 2.5],
        ["Odunpazarı → Sazova Park", 5],
        ["Adalar → Odunpazarı", 1.5]
      ]
    },
    card: '',
    transit: [],
    stamps: [
      { id: 'es_odun', name: "Odunpazarı Houses", lat: 39.7651, lon: 30.5242 },
      { id: 'es_alaeddin', name: "Alaeddin Mosque", lat: 39.7667, lon: 30.524 },
      { id: 'es_omm', name: "Odunpazarı Modern Museum", lat: 39.7648, lon: 30.5225 },
      { id: 'es_adalar', name: "Adalar and Porsuk River", lat: 39.7855, lon: 30.5096 },
      { id: 'es_sazova', name: "Sazova Park", lat: 39.7651, lon: 30.4742 }
    ],
    embassy: 'emb_any',
    tip: 'tip_any'
  },
  trabzon: {
    id: 'trabzon',
    name: { en: "Trabzon", tr: "Trabzon", de: "Trabzon", ru: "Трабзон" },
    center: { lat: 41.0053, lon: 39.7315, label: "Meydan" },
    taxi: {
      open: 90, perKm: 73, min: 260,
      note: "Trabzon, from 19 Oct 2026 (news sites; sources disagree)",
      routes: [
        ["Trabzon Airport → Meydan", 6],
        ["Meydan → Hagia Sophia", 3.5],
        ["Meydan → Boztepe", 2.5],
        ["Meydan → Atatürk Pavilion", 6]
      ]
    },
    card: '',
    transit: [],
    stamps: [
      { id: 'tr_kale', name: "Güzelhisar Castle", lat: 41.0078, lon: 39.7347 },
      { id: 'tr_uzun', name: "Uzun Sokak", lat: 41.0051, lon: 39.7285 },
      { id: 'tr_muze', name: "Trabzon Museum", lat: 41.005, lon: 39.7266 },
      { id: 'tr_boztepe', name: "Boztepe", lat: 40.9976, lon: 39.7329 },
      { id: 'tr_gulbahar', name: "Gülbahar Hatun Mosque", lat: 41.0034, lon: 39.7161 },
      { id: 'tr_ayasofya', name: "Hagia Sophia of Trabzon", lat: 41.0031, lon: 39.6961 },
      { id: 'tr_kosk', name: "Atatürk Pavilion", lat: 40.9798, lon: 39.6975 }
    ],
    embassy: 'emb_any',
    tip: 'tip_any'
  },
  mardin: {
    id: 'mardin',
    name: { en: "Mardin", tr: "Mardin", de: "Mardin", ru: "Мардин" },
    center: { lat: 37.3134, lon: 40.7347, label: "Cumhuriyet Meydanı" },
    taxi: {
      open: 50, perKm: 45, min: 150,
      note: "Mardin 2026 (news sites)",
      routes: [
        ["Mardin Airport → old town", 20],
        ["New town (Yenişehir) → old town", 4],
        ["Old town → Deyrulzafaran", 6]
      ]
    },
    card: '',
    transit: [],
    stamps: [
      { id: 'ma_muze', name: "Mardin Museum", lat: 37.3138, lon: 40.7346 },
      { id: 'ma_kirklar', name: "Forty Martyrs Church", lat: 37.3135, lon: 40.7328 },
      { id: 'ma_ulu', name: "Great Mosque of Mardin", lat: 37.3127, lon: 40.7393 },
      { id: 'ma_zinciriye', name: "Zinciriye Madrasa", lat: 37.3142, lon: 40.7399 },
      { id: 'ma_kent', name: "Sakıp Sabancı City Museum", lat: 37.3145, lon: 40.746 },
      { id: 'ma_kasimiye', name: "Kasımiye Madrasa", lat: 37.3076, lon: 40.7198 },
      { id: 'ma_deyr', name: "Deyrulzafaran Monastery", lat: 37.2994, lon: 40.7928 }
    ],
    embassy: 'emb_any',
    tip: 'tip_any'
  },
  safranbolu: {
    id: 'safranbolu',
    name: { en: "Safranbolu", tr: "Safranbolu", de: "Safranbolu", ru: "Сафранболу" },
    center: { lat: 41.2446, lon: 32.6935, label: "Çarşı" },
    taxi: {
      open: 52, perKm: 50, min: 200, estimate: true,
      note: "No tariff found: estimate",
      routes: [
        ["Karabük bus terminal → Çarşı", 10],
        ["Kıranköy → Çarşı", 2]
      ]
    },
    card: '',
    transit: [],
    stamps: [
      { id: 'sa_cinci', name: "Cinci Han", lat: 41.2446, lon: 32.6935 },
      { id: 'sa_izzet', name: "İzzet Mehmet Paşa Mosque", lat: 41.2439, lon: 32.6931 },
      { id: 'sa_kaymakam', name: "Kaymakamlar House", lat: 41.2441, lon: 32.6942 },
      { id: 'sa_hidirlik', name: "Hıdırlık Hill", lat: 41.2437, lon: 32.6961 },
      { id: 'sa_saat', name: "Clock Tower and City Museum", lat: 41.2462, lon: 32.6904 }
    ],
    embassy: 'emb_any',
    tip: 'tip_any'
  }
};

// Anywhere else in Türkiye: stops come live from Wikipedia, places live from OpenStreetMap.
// Taxi fare is an estimate: the median of the five city tariffs above (open 52, km 50, min 200).
export const NEARBY = {
  id: 'nearby',
  name: { en: 'Near me', tr: 'Yakınım', de: 'In der Nähe', ru: 'Рядом' },
  center: null,
  taxi: { open: 52, perKm: 50, min: 200, estimate: true, routes: [] },
  card: '',
  transit: [],
  stamps: [],
  embassy: 'emb_any',
  tip: 'tip_any'
};

// [date, i18n key, kind] — kind: public | faith
// Islamic dates follow the Diyanet 2027 calendar as reported in Nov 2026.
export const EVENTS = [
  ['2026-12-04', 'ev_hanukkah', 'faith'],
  ['2026-12-25', 'ev_christmas', 'faith'],
  ['2027-01-01', 'ev_newyear', 'public'],
  ['2027-02-08', 'ev_ramadan', 'faith'],
  ['2027-03-09', 'ev_ramazan', 'public'],
  ['2027-03-28', 'ev_easter', 'faith'],
  ['2027-04-23', 'ev_apr23', 'public'],
  ['2027-05-01', 'ev_may1', 'public'],
  ['2027-05-02', 'ev_oeaster', 'faith'],
  ['2027-05-16', 'ev_kurban', 'public'],
  ['2027-05-19', 'ev_may19', 'public']
];

// Check-in radius in metres for passport stamps.
export const CHECKIN_RADIUS = 250;
