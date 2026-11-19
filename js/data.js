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
  }
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
