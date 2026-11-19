// Damga — UI strings. English is the source; every key must exist in "en".
export const LANGS = { en: 'EN', tr: 'TR', de: 'DE', ru: 'RU' };

const S = {
  en: {
    no_places: 'Place data is not available yet. Weather, prayer times, prices and the passport still work.',
    tab_explore: 'Explore', tab_go: 'Transport', tab_pass: 'Passport', tab_cal: 'Calendar', tab_sos: 'SOS',
    use_location: 'Use my location', at_center: 'Showing {place}. Turn on location for places around you.', at_you: 'Showing places around you.',
    loc_denied: 'Location is off. Showing {place} instead.',
    local_time: 'Local time', tz_note: 'GMT+3 all year',
    weather: 'Weather', loading: 'Loading…', offline: 'Could not load live data. Check your connection.',
    prayer: 'Prayer times', next_prayer: 'Next: {name} at {time}', prayer_src: 'Diyanet method',
    p_Fajr: 'Fajr', p_Sunrise: 'Sunrise', p_Dhuhr: 'Dhuhr', p_Asr: 'Asr', p_Maghrib: 'Maghrib', p_Isha: 'Isha',
    worship: 'Places of worship', all_faiths: 'All faiths', worship_tip: 'Mosques close to visitors during prayer. Cover shoulders and knees. Synagogues usually need an appointment.',
    rel_muslim: 'Mosque', rel_christian: 'Church', rel_jewish: 'Synagogue', rel_other: 'Place of worship',
    eat: 'Restaurants nearby', halal: 'Halal', vegetarian: 'Vegetarian', kosher: 'Kosher', call: 'Phone', map: 'Map',
    eat_tip: 'Diet labels come from OpenStreetMap and may be missing. Ask the staff to be sure.',
    malls: 'Shopping malls', none: 'Nothing found nearby.',
    stops: 'Passport stops in {city}',
    fare_title: 'Is this taxi fare fair?', fare_intro: 'Pick a route or enter the distance. We calculate the official meter price.',
    route: 'Route', custom_km: 'Or distance in km', fair_meter: 'Fair price on the meter',
    fare_detail: 'Start {open} TL + {km} TL/km, minimum {min} TL. Traffic and waiting can add up to 15%. Tolls extra.',
    watch: 'Watch out for', w1: 'Driver says the meter is broken', w2: 'Asking to pay in euros or dollars', w3: 'A longer route than your map shows', w4: 'Note swap: say the note value out loud',
    transit: 'Public transport', card_tip: 'Buy a {card} at any station machine. It is cheaper than single tickets.',
    transit_metro_ist: 'Metro, tram, bus, Marmaray (full fare)', transit_ferry: 'City ferry (Şehir Hatları), by route', transit_air_ist: 'Havaist bus, airport → Sultanahmet',
    transit_metro_ank: 'Metro, Ankaray, Başkentray, EGO bus (full fare)', transit_air_ank_ego: 'EGO bus 442, airport → Kızılay', transit_air_ank_havas: 'Havaş / BelkoAir airport bus',
    prices_checked: 'Prices checked {date}. They change often.',
    passport: '{city} passport', checkin: 'Check in', checking: 'Checking your location…',
    got_stamp: 'Stamp collected: {name}', too_far: 'You are {dist} away. Get within {radius} m to collect this stamp.', need_loc: 'Turn on location to collect stamps.',
    badges: 'Badges', b_first: 'First stamp', b_half: 'Half the city', b_full: 'City complete', b_two: 'Two cities',
    share: 'Share my passport', share_text: 'I collected {n} of {total} stamps in {city} with Damga.', copied: 'Copied',
    friends_soon: 'Friends and weekly ranking are coming in the next version.',
    cal_title: 'Holidays and special days', cal_intro: 'Public holidays in Türkiye and major days for every faith.',
    public: 'Public holiday', faith: 'Religious day', today: 'Today', days: '{n} days',
    ev_hanukkah: 'Hanukkah begins', ev_christmas: 'Christmas', ev_newyear: 'New Year’s Day', ev_ramadan: 'Ramadan begins (first day of fasting)',
    ev_ramazan: 'Ramazan Bayramı (Eid al-Fitr), 9–11 March', ev_easter: 'Easter', ev_apr23: 'National Sovereignty and Children’s Day', ev_may1: 'Labour Day',
    ev_oeaster: 'Orthodox Easter', ev_kurban: 'Kurban Bayramı (Eid al-Adha), 16–19 May', ev_may19: 'Atatürk Commemoration, Youth and Sports Day',
    cal_note: 'On religious holidays many shops close and transport is busy. The day before is a half day.',
    tip_ist: 'Book Hagia Sophia and Topkapı early on holidays. The Grand Bazaar is closed on Sundays.',
    tip_ank: 'On 10 November at 09:05 the whole city stops for a minute of silence for Atatürk.',
    emergency: 'Emergency: police, ambulance, fire', nearest: 'Closest to you', hospital: 'Hospital', pharmacy: 'Pharmacy', police: 'Police',
    duty_pharmacy: 'At night, every pharmacy door lists the pharmacy on duty.',
    embassy: 'Embassies', emb_ist: 'Istanbul has consulates. Embassies are in Ankara.', emb_ank: 'Most embassies are in Çankaya, 2–5 km from Kızılay.',
    phrases: 'Show this to someone', ph1: 'Help me, please.', ph2: 'I need a hospital.', ph3: 'Please call the police.', ph4: 'I am lost.',
    data_credit: 'Map data © OpenStreetMap contributors. Weather by Open-Meteo. Prayer times by AlAdhan.'
  },
  tr: {
    no_places: 'Mekân verisi henüz yok. Hava, namaz vakitleri, fiyatlar ve pasaport çalışıyor.',
    tab_explore: 'Keşfet', tab_go: 'Ulaşım', tab_pass: 'Pasaport', tab_cal: 'Takvim', tab_sos: 'Acil',
    use_location: 'Konumumu kullan', at_center: '{place} gösteriliyor. Çevrendeki yerler için konumu aç.', at_you: 'Çevrendeki yerler gösteriliyor.',
    loc_denied: 'Konum kapalı. Onun yerine {place} gösteriliyor.',
    local_time: 'Yerel saat', tz_note: 'Yıl boyu GMT+3',
    weather: 'Hava', loading: 'Yükleniyor…', offline: 'Canlı veri yüklenemedi. Bağlantını kontrol et.',
    prayer: 'Namaz vakitleri', next_prayer: 'Sıradaki: {name} {time}', prayer_src: 'Diyanet hesabı',
    p_Fajr: 'İmsak', p_Sunrise: 'Güneş', p_Dhuhr: 'Öğle', p_Asr: 'İkindi', p_Maghrib: 'Akşam', p_Isha: 'Yatsı',
    worship: 'İbadet yerleri', all_faiths: 'Tüm dinler', worship_tip: 'Camiler namaz sırasında ziyarete kapanır. Omuz ve dizler kapalı olmalı. Sinagoglar genelde randevu ister.',
    rel_muslim: 'Cami', rel_christian: 'Kilise', rel_jewish: 'Sinagog', rel_other: 'İbadet yeri',
    eat: 'Yakındaki restoranlar', halal: 'Helal', vegetarian: 'Vejetaryen', kosher: 'Koşer', call: 'Telefon', map: 'Harita',
    eat_tip: 'Beslenme etiketleri OpenStreetMap\'ten gelir ve eksik olabilir. Emin olmak için personele sor.',
    malls: 'Alışveriş merkezleri', none: 'Yakında bir şey bulunamadı.',
    stops: '{city} pasaport durakları',
    fare_title: 'Bu taksi ücreti adil mi?', fare_intro: 'Güzergâh seç ya da mesafeyi yaz. Resmi taksimetre ücretini hesaplıyoruz.',
    route: 'Güzergâh', custom_km: 'Ya da km olarak mesafe', fair_meter: 'Taksimetrede adil ücret',
    fare_detail: 'Açılış {open} TL + km başı {km} TL, en az {min} TL. Trafik ve bekleme %15\'e kadar ekleyebilir. Köprü ve yol ücreti hariç.',
    watch: 'Dikkat et', w1: 'Şoför taksimetrenin bozuk olduğunu söylüyor', w2: 'Euro ya da dolar ile ödeme istiyor', w3: 'Haritadakinden uzun bir yol', w4: 'Para değiştirme oyunu: verdiğin banknotu yüksek sesle söyle',
    transit: 'Toplu taşıma', card_tip: 'Her istasyondaki makineden {card} al. Tek biletten ucuzdur.',
    transit_metro_ist: 'Metro, tramvay, otobüs, Marmaray (tam)', transit_ferry: 'Şehir Hatları vapuru, hatta göre', transit_air_ist: 'Havaist, havalimanı → Sultanahmet',
    transit_metro_ank: 'Metro, Ankaray, Başkentray, EGO otobüsü (tam)', transit_air_ank_ego: 'EGO 442, havalimanı → Kızılay', transit_air_ank_havas: 'Havaş / BelkoAir havalimanı otobüsü',
    prices_checked: 'Fiyatlar {date} tarihinde kontrol edildi. Sık değişir.',
    passport: '{city} pasaportu', checkin: 'Damga al', checking: 'Konumun kontrol ediliyor…',
    got_stamp: 'Damga alındı: {name}', too_far: '{dist} uzaktasın. Bu damgayı almak için {radius} m yakına gel.', need_loc: 'Damga almak için konumu aç.',
    badges: 'Rozetler', b_first: 'İlk damga', b_half: 'Şehrin yarısı', b_full: 'Şehir tamam', b_two: 'İki şehir',
    share: 'Pasaportumu paylaş', share_text: 'Damga ile {city} şehrinde {total} damgadan {n} tanesini topladım.', copied: 'Kopyalandı',
    friends_soon: 'Arkadaşlar ve haftalık sıralama bir sonraki sürümde geliyor.',
    cal_title: 'Bayramlar ve özel günler', cal_intro: 'Türkiye\'deki resmi tatiller ve tüm dinlerin önemli günleri.',
    public: 'Resmi tatil', faith: 'Dini gün', today: 'Bugün', days: '{n} gün',
    ev_hanukkah: 'Hanuka başlıyor', ev_christmas: 'Noel', ev_newyear: 'Yılbaşı', ev_ramadan: 'Ramazan başlıyor (ilk oruç)',
    ev_ramazan: 'Ramazan Bayramı, 9–11 Mart', ev_easter: 'Paskalya', ev_apr23: 'Ulusal Egemenlik ve Çocuk Bayramı', ev_may1: 'Emek ve Dayanışma Günü',
    ev_oeaster: 'Ortodoks Paskalyası', ev_kurban: 'Kurban Bayramı, 16–19 Mayıs', ev_may19: 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı',
    cal_note: 'Dini bayramlarda birçok dükkân kapanır, ulaşım yoğun olur. Bir önceki gün yarım gündür.',
    tip_ist: 'Bayramlarda Ayasofya ve Topkapı için erken git. Kapalıçarşı pazar günü kapalıdır.',
    tip_ank: '10 Kasım saat 09:05\'te bütün şehir Atatürk için bir dakika saygı duruşunda durur.',
    emergency: 'Acil: polis, ambulans, itfaiye', nearest: 'Sana en yakın', hospital: 'Hastane', pharmacy: 'Eczane', police: 'Polis',
    duty_pharmacy: 'Gece her eczanenin kapısında nöbetçi eczane yazar.',
    embassy: 'Büyükelçilikler', emb_ist: 'İstanbul\'da konsolosluklar var. Büyükelçilikler Ankara\'da.', emb_ank: 'Büyükelçiliklerin çoğu Çankaya\'da, Kızılay\'a 2–5 km.',
    phrases: 'Bunu birine göster', ph1: 'Lütfen bana yardım edin.', ph2: 'Hastaneye gitmem gerekiyor.', ph3: 'Lütfen polisi arayın.', ph4: 'Kayboldum.',
    data_credit: 'Harita verisi © OpenStreetMap katkıcıları. Hava: Open-Meteo. Namaz vakitleri: AlAdhan.'
  },
  de: {
    no_places: 'Ortsdaten sind noch nicht verfügbar. Wetter, Gebetszeiten, Preise und der Pass funktionieren.',
    tab_explore: 'Entdecken', tab_go: 'Verkehr', tab_pass: 'Pass', tab_cal: 'Kalender', tab_sos: 'Notfall',
    use_location: 'Meinen Standort nutzen', at_center: 'Zeige {place}. Standort einschalten für Orte in deiner Nähe.', at_you: 'Zeige Orte in deiner Nähe.',
    loc_denied: 'Standort ist aus. Stattdessen wird {place} gezeigt.',
    local_time: 'Ortszeit', tz_note: 'Ganzjährig GMT+3',
    weather: 'Wetter', loading: 'Lädt…', offline: 'Live-Daten konnten nicht geladen werden. Prüfe deine Verbindung.',
    prayer: 'Gebetszeiten', next_prayer: 'Nächste: {name} um {time}', prayer_src: 'Diyanet-Methode',
    p_Fajr: 'Fadschr', p_Sunrise: 'Sonnenaufgang', p_Dhuhr: 'Dhuhr', p_Asr: 'Asr', p_Maghrib: 'Maghrib', p_Isha: 'Ischa',
    worship: 'Gotteshäuser', all_faiths: 'Alle Religionen', worship_tip: 'Moscheen schließen während des Gebets für Besucher. Schultern und Knie bedecken. Synagogen meist nur mit Termin.',
    rel_muslim: 'Moschee', rel_christian: 'Kirche', rel_jewish: 'Synagoge', rel_other: 'Gotteshaus',
    eat: 'Restaurants in der Nähe', halal: 'Halal', vegetarian: 'Vegetarisch', kosher: 'Koscher', call: 'Telefon', map: 'Karte',
    eat_tip: 'Ernährungsangaben stammen aus OpenStreetMap und können fehlen. Frag im Zweifel nach.',
    malls: 'Einkaufszentren', none: 'In der Nähe nichts gefunden.',
    stops: 'Pass-Stationen in {city}',
    fare_title: 'Ist dieser Taxipreis fair?', fare_intro: 'Wähle eine Strecke oder gib die Entfernung ein. Wir berechnen den offiziellen Taxameterpreis.',
    route: 'Strecke', custom_km: 'Oder Entfernung in km', fair_meter: 'Fairer Preis auf dem Taxameter',
    fare_detail: 'Grundpreis {open} TL + {km} TL/km, mindestens {min} TL. Verkehr und Wartezeit können bis zu 15 % ausmachen. Maut extra.',
    watch: 'Vorsicht bei', w1: 'Fahrer sagt, das Taxameter sei kaputt', w2: 'Bitte um Zahlung in Euro oder Dollar', w3: 'Längere Route als auf deiner Karte', w4: 'Geldschein-Tausch: Nenne den Wert laut',
    transit: 'Öffentlicher Verkehr', card_tip: 'Kauf eine {card} am Automaten in jeder Station. Günstiger als Einzeltickets.',
    transit_metro_ist: 'Metro, Tram, Bus, Marmaray (voller Preis)', transit_ferry: 'Stadtfähre (Şehir Hatları), je nach Linie', transit_air_ist: 'Havaist-Bus, Flughafen → Sultanahmet',
    transit_metro_ank: 'Metro, Ankaray, Başkentray, EGO-Bus (voller Preis)', transit_air_ank_ego: 'EGO-Bus 442, Flughafen → Kızılay', transit_air_ank_havas: 'Havaş / BelkoAir Flughafenbus',
    prices_checked: 'Preise geprüft am {date}. Sie ändern sich oft.',
    passport: '{city}-Pass', checkin: 'Einchecken', checking: 'Standort wird geprüft…',
    got_stamp: 'Stempel gesammelt: {name}', too_far: 'Du bist {dist} entfernt. Komm auf {radius} m heran, um den Stempel zu bekommen.', need_loc: 'Schalte den Standort ein, um Stempel zu sammeln.',
    badges: 'Abzeichen', b_first: 'Erster Stempel', b_half: 'Halbe Stadt', b_full: 'Stadt komplett', b_two: 'Zwei Städte',
    share: 'Meinen Pass teilen', share_text: 'Ich habe mit Damga {n} von {total} Stempeln in {city} gesammelt.', copied: 'Kopiert',
    friends_soon: 'Freunde und Wochenrangliste kommen in der nächsten Version.',
    cal_title: 'Feiertage und besondere Tage', cal_intro: 'Gesetzliche Feiertage in der Türkei und wichtige Tage aller Religionen.',
    public: 'Gesetzlicher Feiertag', faith: 'Religiöser Tag', today: 'Heute', days: '{n} Tage',
    ev_hanukkah: 'Chanukka beginnt', ev_christmas: 'Weihnachten', ev_newyear: 'Neujahr', ev_ramadan: 'Ramadan beginnt (erster Fastentag)',
    ev_ramazan: 'Ramazan Bayramı (Zuckerfest), 9.–11. März', ev_easter: 'Ostern', ev_apr23: 'Tag der nationalen Souveränität und des Kindes', ev_may1: 'Tag der Arbeit',
    ev_oeaster: 'Orthodoxes Ostern', ev_kurban: 'Kurban Bayramı (Opferfest), 16.–19. Mai', ev_may19: 'Gedenktag an Atatürk, Jugend- und Sporttag',
    cal_note: 'An religiösen Feiertagen schließen viele Geschäfte und der Verkehr ist voll. Der Vortag ist ein halber Tag.',
    tip_ist: 'An Feiertagen Hagia Sophia und Topkapı früh buchen. Der Große Basar ist sonntags geschlossen.',
    tip_ank: 'Am 10. November um 09:05 steht die ganze Stadt eine Minute still im Gedenken an Atatürk.',
    emergency: 'Notruf: Polizei, Rettung, Feuerwehr', nearest: 'In deiner Nähe', hospital: 'Krankenhaus', pharmacy: 'Apotheke', police: 'Polizei',
    duty_pharmacy: 'Nachts hängt an jeder Apotheke die diensthabende Apotheke aus.',
    embassy: 'Botschaften', emb_ist: 'In Istanbul gibt es Konsulate. Botschaften sind in Ankara.', emb_ank: 'Die meisten Botschaften liegen in Çankaya, 2–5 km von Kızılay.',
    phrases: 'Zeig das jemandem', ph1: 'Bitte helfen Sie mir.', ph2: 'Ich muss ins Krankenhaus.', ph3: 'Bitte rufen Sie die Polizei.', ph4: 'Ich habe mich verlaufen.',
    data_credit: 'Kartendaten © OpenStreetMap-Mitwirkende. Wetter: Open-Meteo. Gebetszeiten: AlAdhan.'
  },
  ru: {
    no_places: 'Данные о местах пока недоступны. Погода, время намаза, цены и паспорт работают.',
    tab_explore: 'Обзор', tab_go: 'Транспорт', tab_pass: 'Паспорт', tab_cal: 'Календарь', tab_sos: 'SOS',
    use_location: 'Моё местоположение', at_center: 'Показан район {place}. Включите геолокацию, чтобы видеть места рядом.', at_you: 'Показаны места рядом с вами.',
    loc_denied: 'Геолокация выключена. Показан район {place}.',
    local_time: 'Местное время', tz_note: 'GMT+3 круглый год',
    weather: 'Погода', loading: 'Загрузка…', offline: 'Не удалось загрузить данные. Проверьте подключение.',
    prayer: 'Время намаза', next_prayer: 'Следующий: {name} в {time}', prayer_src: 'Метод Диянет',
    p_Fajr: 'Фаджр', p_Sunrise: 'Восход', p_Dhuhr: 'Зухр', p_Asr: 'Аср', p_Maghrib: 'Магриб', p_Isha: 'Иша',
    worship: 'Места поклонения', all_faiths: 'Все религии', worship_tip: 'Мечети закрыты для туристов во время намаза. Плечи и колени должны быть закрыты. В синагоги обычно нужна запись.',
    rel_muslim: 'Мечеть', rel_christian: 'Церковь', rel_jewish: 'Синагога', rel_other: 'Место поклонения',
    eat: 'Рестораны рядом', halal: 'Халяль', vegetarian: 'Вегетарианское', kosher: 'Кошер', call: 'Телефон', map: 'Карта',
    eat_tip: 'Отметки о питании взяты из OpenStreetMap и могут отсутствовать. Уточните у персонала.',
    malls: 'Торговые центры', none: 'Рядом ничего не найдено.',
    stops: 'Точки паспорта: {city}',
    fare_title: 'Честная ли цена такси?', fare_intro: 'Выберите маршрут или введите расстояние. Мы рассчитаем официальную цену по счётчику.',
    route: 'Маршрут', custom_km: 'Или расстояние в км', fair_meter: 'Честная цена по счётчику',
    fare_detail: 'Посадка {open} TL + {km} TL/км, минимум {min} TL. Пробки и ожидание могут добавить до 15%. Платные дороги отдельно.',
    watch: 'Будьте осторожны', w1: 'Водитель говорит, что счётчик сломан', w2: 'Просит оплату в евро или долларах', w3: 'Маршрут длиннее, чем на карте', w4: 'Подмена купюры: называйте номинал вслух',
    transit: 'Общественный транспорт', card_tip: 'Купите {card} в автомате на любой станции. Это дешевле разовых билетов.',
    transit_metro_ist: 'Метро, трамвай, автобус, Мармарай (полный)', transit_ferry: 'Городской паром (Şehir Hatları), по линии', transit_air_ist: 'Автобус Havaist, аэропорт → Султанахмет',
    transit_metro_ank: 'Метро, Анкарай, Башкентрай, автобус EGO (полный)', transit_air_ank_ego: 'Автобус EGO 442, аэропорт → Кызылай', transit_air_ank_havas: 'Автобус Havaş / BelkoAir в аэропорт',
    prices_checked: 'Цены проверены {date}. Они часто меняются.',
    passport: 'Паспорт: {city}', checkin: 'Отметиться', checking: 'Проверяем ваше местоположение…',
    got_stamp: 'Штамп получен: {name}', too_far: 'Вы в {dist}. Подойдите ближе {radius} м, чтобы получить штамп.', need_loc: 'Включите геолокацию, чтобы собирать штампы.',
    badges: 'Награды', b_first: 'Первый штамп', b_half: 'Полгорода', b_full: 'Город пройден', b_two: 'Два города',
    share: 'Поделиться паспортом', share_text: 'Я собрал {n} из {total} штампов в городе {city} с Damga.', copied: 'Скопировано',
    friends_soon: 'Друзья и недельный рейтинг появятся в следующей версии.',
    cal_title: 'Праздники и особые дни', cal_intro: 'Государственные праздники Турции и важные дни всех религий.',
    public: 'Выходной день', faith: 'Религиозный день', today: 'Сегодня', days: '{n} дн.',
    ev_hanukkah: 'Начало Хануки', ev_christmas: 'Рождество (западное)', ev_newyear: 'Новый год', ev_ramadan: 'Начало Рамадана (первый день поста)',
    ev_ramazan: 'Рамазан-байрам, 9–11 марта', ev_easter: 'Пасха (западная)', ev_apr23: 'День национального суверенитета и детей', ev_may1: 'День труда',
    ev_oeaster: 'Православная Пасха', ev_kurban: 'Курбан-байрам, 16–19 мая', ev_may19: 'День памяти Ататюрка, молодёжи и спорта',
    cal_note: 'В религиозные праздники многие магазины закрыты, транспорт переполнен. Накануне — сокращённый день.',
    tip_ist: 'В праздники бронируйте Айя-Софию и Топкапы заранее. Гранд-базар закрыт по воскресеньям.',
    tip_ank: '10 ноября в 09:05 весь город замирает на минуту молчания в память об Ататюрке.',
    emergency: 'Экстренный номер: полиция, скорая, пожарные', nearest: 'Ближайшие к вам', hospital: 'Больница', pharmacy: 'Аптека', police: 'Полиция',
    duty_pharmacy: 'Ночью на двери каждой аптеки указана дежурная аптека.',
    embassy: 'Посольства', emb_ist: 'В Стамбуле консульства. Посольства находятся в Анкаре.', emb_ank: 'Большинство посольств в районе Чанкая, в 2–5 км от Кызылая.',
    phrases: 'Покажите это кому-нибудь', ph1: 'Помогите мне, пожалуйста.', ph2: 'Мне нужно в больницу.', ph3: 'Пожалуйста, вызовите полицию.', ph4: 'Я заблудился.',
    data_credit: 'Данные карты © участники OpenStreetMap. Погода: Open-Meteo. Время намаза: AlAdhan.'
  }
};

// Turkish phrases shown on the SOS screen for locals to read.
export const PHRASES_TR = { ph1: 'Lütfen bana yardım edin.', ph2: 'Hastaneye gitmem gerekiyor.', ph3: 'Lütfen polisi arayın.', ph4: 'Kayboldum.' };

export function t(lang, key, vars = {}) {
  const s = (S[lang] && S[lang][key]) ?? S.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}

export function pickLang() {
  try {
    const saved = localStorage.getItem('damga:lang');
    if (saved && S[saved]) return saved;
  } catch { /* ignore */ }
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return S[nav] ? nav : 'en';
}

// Weather codes (WMO) → short label key-free text per language.
const WX = {
  en: ['Clear', 'Partly cloudy', 'Cloudy', 'Fog', 'Drizzle', 'Rain', 'Snow', 'Showers', 'Thunderstorm'],
  tr: ['Açık', 'Parçalı bulutlu', 'Bulutlu', 'Sis', 'Çisenti', 'Yağmur', 'Kar', 'Sağanak', 'Fırtına'],
  de: ['Klar', 'Teils bewölkt', 'Bewölkt', 'Nebel', 'Niesel', 'Regen', 'Schnee', 'Schauer', 'Gewitter'],
  ru: ['Ясно', 'Переменная облачность', 'Облачно', 'Туман', 'Морось', 'Дождь', 'Снег', 'Ливень', 'Гроза']
};
export function weatherText(lang, code) {
  const i = code === 0 ? 0 : code <= 2 ? 1 : code === 3 ? 2 : code <= 48 ? 3 : code <= 57 ? 4 : code <= 67 ? 5 : code <= 77 ? 6 : code <= 86 ? 7 : 8;
  return (WX[lang] || WX.en)[i];
}

// ---- Keşif game screens (v2). DE and RU fall back to English until translated. ----
Object.assign(S.en, {
  transit_izm: 'Bus, metro, ferry, tram (full fare)', transit_izban: 'İZBAN suburban train, first 20 km', transit_air_izm: 'ESHOT airport bus (200–206)', transit_ant: 'Bus and tram (full fare)', transit_air_ant: 'T1A tram to the airport', transit_cc_ant: 'Paying by bank card', transit_shuttle_kap: 'Shared airport shuttle per person', emb_izm: 'İzmir has consulates. Embassies are in Ankara.', emb_ant: 'Antalya has consulates. Embassies are in Ankara.', emb_kap: 'Embassies are in Ankara, about 300 km away.', tip_izm: 'Take the ferry from Konak to Karşıyaka at sunset.', tip_ant: 'Kaleiçi streets are steep and slippery. Wear good shoes.', tip_kap: 'Balloon flights start at sunrise and are cancelled in strong wind.',
  search_ph: 'Search places', install: 'Add to Home Screen', install_d: 'Open Keşif like an app, even offline.', install_ios: 'Tap Share, then “Add to Home Screen”.', update_ready: 'A new version of Keşif is ready.', reload: 'Reload',
  restaurant: 'Restaurant', at_stop: 'You are at {name}!', collect_now: 'Collect', stamp_got_title: 'Stamp collected!', level_up: 'Level {n} reached!', new_char: 'New character unlocked: {name}', tap_continue: 'Continue', directions: 'Directions', call: 'Call', close: 'Close', welcome_sub: 'Visit real places in Istanbul and Ankara, collect stamps, earn XP and unlock characters. Fair taxi prices, prayer times and emergency help are always one tap away.', start_loc: 'Turn on location and start', start_noloc: 'Start without location', loc_privacy: 'Your location and photos stay on your phone.',
  take_photo: 'Take a photo', your_photos: 'Your photos', photo_hint: 'Take a photo here. Your first photo at this place earns +{n} XP.', c_album: 'Album', album_note: 'Photos stay only on this phone.', no_photos: 'No photos yet. Capture the places and views you visit.', photo_saving: 'Saving photo…', photo_saved: 'Photo saved to your album', photo_failed: 'The photo could not be saved. Check that the phone has free space.', photo_far: 'go within 250 m of a stop to earn XP', photo_at: 'photo at {name}', photo_view: 'Scenic view', share: 'Share', delete: 'Delete', delete_q: 'Delete this photo from your phone?', cancel: 'Cancel', q_d_photo: 'Snapshot of the day', q_d_photo_d: 'Take 1 photo today.', q_s_photo: 'Photo hunter', q_s_photo_d: 'Take photos at 3 different stops.', bd_photo: 'Photographer',
  rate_title: 'Rate this place', your_rating: 'Your rating',
  save: 'Save place', saved: 'Saved', photo_by: 'Photo: {by} · {lic}', min: '{n} min', settings_go: 'Settings', see_all: 'See all',
  n_place: '{n} place',
  n_places: '{n} places',
  friends: 'Friends', rank_note: 'Ranking by XP. Codes are snapshots: ask friends for a new code to update their score.', share_code: 'Share my code', add_code: 'Add a friend’s code', add: 'Add', friend_added: '{name} added', bad_code: 'That code did not work. Copy the whole code, starting with KSF-.', you: 'You', updated: 'updated {date}', remove: 'Remove', code_copied: 'Code copied. Send it to your friends.', no_friends: 'No friends yet. Share your code and add theirs.',
  app_name: 'Keşif', tagline: 'Explore. Collect. Level up.',
  nav_map: 'Map', nav_quests: 'Quests', nav_collection: 'Collection', nav_profile: 'Profile',
  level: 'Level {n}', lv_short: 'Lv. {n}', xp_of: '{a} / {b} XP', traveler: 'Traveler',
  near_banner: 'New discovery nearby: {name}, {dist}', all_done: 'You collected every stop in {city}!',
  tools: 'Travel tools', t_fare: 'Taxi fare', t_cal: 'Holidays', t_sos: 'Emergency', t_pray: 'Prayer & worship',
  back: 'Back', start: 'Start exploring', get_stamp: 'Collect stamp', collected: 'Collected on {date}',
  rewards: 'Rewards', city_badge: '{city} badge', walk: '{n} min walk', drive: '{n} min drive',
  plus_xp: '+{n} XP', got_xp: '+{n} XP · {what}',
  cat_history: 'Historic site', cat_museum: 'Museum', cat_worship: 'Place of worship', cat_market: 'Market', cat_view: 'Viewpoint', cat_park: 'Park',
  q_daily: 'Daily', q_weekly: 'Weekly', q_special: 'Special', claim: 'Claim', claimed: 'Claimed',
  q_d_login: 'Daily reward', q_d_login_d: 'You opened Keşif today.',
  q_d_stamp: 'Explorer of the day', q_d_stamp_d: 'Collect 1 stamp today.',
  q_d_fare: 'Fair ride', q_d_fare_d: 'Check a taxi fare before you ride.',
  q_w_five: 'Busy week', q_w_five_d: 'Collect 5 stamps this week.',
  q_w_worship: 'Houses of faith', q_w_worship_d: 'Visit 2 places of worship.',
  q_s_ist: 'Discover Istanbul!', q_s_ist_d: 'Visit 3 places in Istanbul.',
  q_s_ank: 'Discover Ankara!', q_s_ank_d: 'Visit 3 places in Ankara.',
  q_s_market: 'Bazaar hunter', q_s_market_d: 'Visit 2 markets.',
  q_s_museum: 'Museum mind', q_s_museum_d: 'Visit 3 museums.',
  q_s_asia: 'Two continents', q_s_asia_d: 'Take the ferry to Kadıköy.',
  q_s_chars: 'Complete your collection', q_s_chars_d: 'Unlock 5 characters.',
  c_chars: 'Characters', c_badges: 'Badges', c_costumes: 'Costumes', main_char: 'Main character', choose: 'Choose', unlock_at: 'Level {n}',
  egg: 'New character egg', egg_d: 'Hatches at level {n}. {xp} XP to go.', egg_all: 'You unlocked every character.',
  ch_pusula: 'Pusula', ch_lale: 'Lale', ch_cini: 'Çini', ch_simit: 'Simit', ch_marti: 'Martı', ch_kedi: 'Tekir',
  bd_first: 'First stamp', bd_ist: 'Istanbul badge', bd_ank: 'Ankara badge', bd_market: 'Bazaar master', bd_faith: 'Faith path', bd_asia: 'Two continents', bd_two: 'Two cities', bd_lvl10: 'Level 10',
  co_scarf: 'Explorer scarf', co_fez: 'Fez', co_hat: 'Steppe hat', co_cape: 'Traveler cape', co_need: 'Needs: {badge}',
  stats: 'Your stats', st_xp: 'Total XP', st_places: 'Places discovered', st_badges: 'Badges', st_quests: 'Quests done',
  your_name: 'Your name', settings: 'Settings', language: 'Language', city_l: 'City', customize: 'Customize your character',
  locate: 'Show my location', open_maps: 'Open in Maps'
});
Object.assign(S.tr, {
  transit_izm: 'Otobüs, metro, vapur, tramvay (tam)', transit_izban: 'İZBAN, ilk 20 km', transit_air_izm: 'ESHOT havalimanı otobüsü (200–206)', transit_ant: 'Otobüs ve tramvay (tam)', transit_air_ant: 'Havalimanına T1A tramvayı', transit_cc_ant: 'Banka kartıyla ödeme', transit_shuttle_kap: 'Havalimanı servisi, kişi başı', emb_izm: 'İzmir\'de konsolosluklar var. Büyükelçilikler Ankara\'da.', emb_ant: 'Antalya\'da konsolosluklar var. Büyükelçilikler Ankara\'da.', emb_kap: 'Büyükelçilikler yaklaşık 300 km uzaktaki Ankara\'da.', tip_izm: 'Gün batımında Konak\'tan Karşıyaka\'ya vapura bin.', tip_ant: 'Kaleiçi sokakları dik ve kaygan. Rahat ayakkabı giy.', tip_kap: 'Balonlar gün doğumunda kalkar, rüzgârda iptal edilir.',
  search_ph: 'Yer ara', install: 'Ana ekrana ekle', install_d: 'Keşif\'i uygulama gibi aç, internetsiz de çalışır.', install_ios: 'Paylaş\'a dokun, sonra “Ana Ekrana Ekle”yi seç.', update_ready: 'Keşif\'in yeni sürümü hazır.', reload: 'Yenile',
  restaurant: 'Restoran', at_stop: '{name} noktasındasın!', collect_now: 'Damgayı al', stamp_got_title: 'Damga senin!', level_up: 'Seviye {n} oldun!', new_char: 'Yeni karakter açıldı: {name}', tap_continue: 'Devam', directions: 'Yol tarifi', call: 'Ara', close: 'Kapat', welcome_sub: 'İstanbul ve Ankara\'da gerçek yerleri gez, damga topla, XP kazan, karakter aç. Adil taksi ücreti, namaz vakitleri ve acil yardım hep bir dokunuş uzakta.', start_loc: 'Konumu aç ve başla', start_noloc: 'Konumsuz başla', loc_privacy: 'Konumun ve fotoğrafların sadece telefonunda kalır.',
  take_photo: 'Fotoğraf çek', your_photos: 'Fotoğrafların', photo_hint: 'Burada fotoğraf çek. Bu yerdeki ilk fotoğrafın +{n} XP kazandırır.', c_album: 'Albüm', album_note: 'Fotoğraflar sadece bu telefonda saklanır.', no_photos: 'Henüz fotoğraf yok. Gezdiğin yerleri ve manzaraları çek.', photo_saving: 'Fotoğraf kaydediliyor…', photo_saved: 'Fotoğraf albümüne kaydedildi', photo_failed: 'Fotoğraf kaydedilemedi. Telefonda boş yer olduğunu kontrol et.', photo_far: 'XP için bir durağa 250 m yaklaş', photo_at: '{name} fotoğrafı', photo_view: 'Manzara', share: 'Paylaş', delete: 'Sil', delete_q: 'Bu fotoğraf telefondan silinsin mi?', cancel: 'Vazgeç', q_d_photo: 'Günün karesi', q_d_photo_d: 'Bugün 1 fotoğraf çek.', q_s_photo: 'Kare avcısı', q_s_photo_d: '3 farklı durakta fotoğraf çek.', bd_photo: 'Fotoğrafçı',
  rate_title: 'Bu yeri puanla', your_rating: 'Senin puanın',
  save: 'Yeri kaydet', saved: 'Kaydedildi', photo_by: 'Foto: {by} · {lic}', min: '{n} dk', settings_go: 'Ayarlar', see_all: 'Tümü',
  n_place: '{n} yer',
  n_places: '{n} yer',
  friends: 'Arkadaşlar', rank_note: 'XP\'ye göre sıralama. Kodlar o anki durumu gösterir: puanı güncellemek için arkadaşından yeni kod iste.', share_code: 'Kodumu paylaş', add_code: 'Arkadaşının kodunu ekle', add: 'Ekle', friend_added: '{name} eklendi', bad_code: 'Bu kod çalışmadı. KSF- ile başlayan kodun tamamını kopyala.', you: 'Sen', updated: '{date} güncel', remove: 'Çıkar', code_copied: 'Kod kopyalandı. Arkadaşlarına gönder.', no_friends: 'Henüz arkadaşın yok. Kodunu paylaş, onlarınkini ekle.',
  app_name: 'Keşif', tagline: 'Keşfet. Topla. Geliş.',
  nav_map: 'Harita', nav_quests: 'Görevler', nav_collection: 'Koleksiyon', nav_profile: 'Profil',
  level: 'Seviye {n}', lv_short: 'Sv. {n}', xp_of: '{a} / {b} XP', traveler: 'Gezgin',
  near_banner: 'Yakınında yeni bir keşif var: {name}, {dist}', all_done: '{city} şehrindeki bütün durakları topladın!',
  tools: 'Gezi araçları', t_fare: 'Taksi ücreti', t_cal: 'Bayramlar', t_sos: 'Acil', t_pray: 'Namaz ve ibadet',
  back: 'Geri', start: 'Keşfe Başla', get_stamp: 'Damgayı al', collected: '{date} tarihinde toplandı',
  rewards: 'Ödüller', city_badge: '{city} Rozeti', walk: '{n} dk yürüme', drive: '{n} dk araçla',
  plus_xp: '+{n} XP', got_xp: '+{n} XP · {what}',
  cat_history: 'Tarihi Yer', cat_museum: 'Müze', cat_worship: 'İbadet Yeri', cat_market: 'Çarşı', cat_view: 'Manzara', cat_park: 'Park',
  q_daily: 'Günlük', q_weekly: 'Haftalık', q_special: 'Özel', claim: 'Al', claimed: 'Alındı',
  q_d_login: 'Günlük ödül', q_d_login_d: 'Bugün giriş yaptın!',
  q_d_stamp: 'Günün kâşifi', q_d_stamp_d: 'Bugün 1 damga topla.',
  q_d_fare: 'Adil yolculuk', q_d_fare_d: 'Taksiye binmeden ücreti kontrol et.',
  q_w_five: 'Dolu dolu hafta', q_w_five_d: 'Bu hafta 5 damga topla.',
  q_w_worship: 'İnanç yolu', q_w_worship_d: '2 ibadet yeri ziyaret et.',
  q_s_ist: 'İstanbul\'u Keşfet!', q_s_ist_d: 'İstanbul\'da 3 farklı yeri ziyaret et.',
  q_s_ank: 'Ankara\'yı Keşfet!', q_s_ank_d: 'Ankara\'da 3 farklı yeri ziyaret et.',
  q_s_market: 'Çarşı avcısı', q_s_market_d: '2 çarşı ziyaret et.',
  q_s_museum: 'Müze kurdu', q_s_museum_d: '3 müze ziyaret et.',
  q_s_asia: 'İki kıta', q_s_asia_d: 'Vapurla Kadıköy\'e geç.',
  q_s_chars: 'Koleksiyonunu Tamamla', q_s_chars_d: '5 karakterin kilidini aç.',
  c_chars: 'Karakterler', c_badges: 'Rozetler', c_costumes: 'Kostümler', main_char: 'Ana Karakter', choose: 'Seç', unlock_at: 'Seviye {n}',
  egg: 'Yeni karakter yumurtası!', egg_d: 'Seviye {n} olunca çatlar. {xp} XP kaldı.', egg_all: 'Bütün karakterleri açtın.',
  ch_pusula: 'Pusula', ch_lale: 'Lale', ch_cini: 'Çini', ch_simit: 'Simit', ch_marti: 'Martı', ch_kedi: 'Tekir',
  bd_first: 'İlk damga', bd_ist: 'İstanbul Rozeti', bd_ank: 'Ankara Rozeti', bd_market: 'Çarşı ustası', bd_faith: 'İnanç yolu', bd_asia: 'İki kıta', bd_two: 'İki şehir', bd_lvl10: 'Seviye 10',
  co_scarf: 'Kâşif atkısı', co_fez: 'Fes', co_hat: 'Bozkır şapkası', co_cape: 'Gezgin pelerini', co_need: 'Gerekli: {badge}',
  stats: 'İstatistiklerin', st_xp: 'Toplam XP', st_places: 'Keşfedilen Yer', st_badges: 'Rozet', st_quests: 'Tamamlanan görev',
  your_name: 'Adın', settings: 'Ayarlar', language: 'Dil', city_l: 'Şehir', customize: 'Karakterini Özelleştir',
  locate: 'Konumumu göster', open_maps: 'Haritada aç'
});
Object.assign(S.de, {
  search_ph: 'Orte suchen', install: 'Zum Home-Bildschirm', install_d: 'Keşif wie eine App öffnen, auch offline.', install_ios: 'Tippe auf Teilen und dann „Zum Home-Bildschirm“.', update_ready: 'Eine neue Version von Keşif ist bereit.', reload: 'Neu laden',
  restaurant: 'Restaurant', at_stop: 'Du bist bei {name}!', collect_now: 'Stempel holen', stamp_got_title: 'Stempel gesammelt!', level_up: 'Level {n} erreicht!', new_char: 'Neue Figur freigeschaltet: {name}', tap_continue: 'Weiter', directions: 'Route', call: 'Anrufen', close: 'Schließen', welcome_sub: 'Besuche echte Orte in Istanbul und Ankara, sammle Stempel, verdiene XP und schalte Figuren frei. Faire Taxipreise, Gebetszeiten und Notfallhilfe sind immer nur einen Tipp entfernt.', start_loc: 'Standort an und los', start_noloc: 'Ohne Standort starten', loc_privacy: 'Standort und Fotos bleiben auf deinem Handy.',
  take_photo: 'Foto aufnehmen', your_photos: 'Deine Fotos', photo_hint: 'Mach hier ein Foto. Dein erstes Foto an diesem Ort bringt +{n} XP.', c_album: 'Album', album_note: 'Fotos bleiben nur auf diesem Handy.', no_photos: 'Noch keine Fotos. Halte Orte und Aussichten fest.', photo_saving: 'Foto wird gespeichert…', photo_saved: 'Foto im Album gespeichert', photo_failed: 'Das Foto konnte nicht gespeichert werden. Prüfe den freien Speicher.', photo_far: 'für XP auf 250 m an eine Station heran', photo_at: 'Foto: {name}', photo_view: 'Aussicht', share: 'Teilen', delete: 'Löschen', delete_q: 'Dieses Foto vom Handy löschen?', cancel: 'Abbrechen', q_d_photo: 'Bild des Tages', q_d_photo_d: 'Mach heute 1 Foto.', q_s_photo: 'Fotojäger', q_s_photo_d: 'Mach Fotos an 3 verschiedenen Stationen.', bd_photo: 'Fotograf',
  rate_title: 'Ort bewerten', your_rating: 'Deine Bewertung',
  save: 'Ort speichern', saved: 'Gespeichert', photo_by: 'Foto: {by} · {lic}', min: '{n} Min.', settings_go: 'Einstellungen', see_all: 'Alle',
  n_place: '{n} Ort',
  n_places: '{n} Orte',
  friends: 'Freunde', rank_note: 'Rangliste nach XP. Codes sind Momentaufnahmen: Bitte Freunde um einen neuen Code, um ihren Stand zu aktualisieren.', share_code: 'Meinen Code teilen', add_code: 'Code eines Freundes hinzufügen', add: 'Hinzufügen', friend_added: '{name} hinzugefügt', bad_code: 'Dieser Code hat nicht funktioniert. Kopiere den ganzen Code ab KSF-.', you: 'Du', updated: 'Stand {date}', remove: 'Entfernen', code_copied: 'Code kopiert. Schick ihn deinen Freunden.', no_friends: 'Noch keine Freunde. Teile deinen Code und füge ihren hinzu.',
  app_name: 'Keşif', tagline: 'Entdecken. Sammeln. Wachsen.',
  nav_map: 'Karte', nav_quests: 'Quests', nav_collection: 'Sammlung', nav_profile: 'Profil',
  level: 'Level {n}', lv_short: 'Lv. {n}', xp_of: '{a} / {b} XP', traveler: 'Reisende',
  near_banner: 'Neue Entdeckung in der Nähe: {name}, {dist}', all_done: 'Du hast alle Stationen in {city} gesammelt!',
  tools: 'Reisewerkzeuge', t_fare: 'Taxipreis', t_cal: 'Feiertage', t_sos: 'Notfall', t_pray: 'Gebet & Gotteshäuser',
  back: 'Zurück', start: 'Los geht\'s', get_stamp: 'Stempel holen', collected: 'Gesammelt am {date}',
  rewards: 'Belohnungen', city_badge: '{city}-Abzeichen', walk: '{n} Min. zu Fuß', drive: '{n} Min. mit dem Auto',
  plus_xp: '+{n} XP', got_xp: '+{n} XP · {what}',
  cat_history: 'Historischer Ort', cat_museum: 'Museum', cat_worship: 'Gotteshaus', cat_market: 'Markt', cat_view: 'Aussicht', cat_park: 'Park',
  q_daily: 'Täglich', q_weekly: 'Wöchentlich', q_special: 'Spezial', claim: 'Abholen', claimed: 'Abgeholt',
  q_d_login: 'Tagesbelohnung', q_d_login_d: 'Du hast Keşif heute geöffnet.',
  q_d_stamp: 'Entdecker des Tages', q_d_stamp_d: 'Sammle heute 1 Stempel.',
  q_d_fare: 'Faire Fahrt', q_d_fare_d: 'Prüfe einen Taxipreis vor der Fahrt.',
  q_w_five: 'Volle Woche', q_w_five_d: 'Sammle diese Woche 5 Stempel.',
  q_w_worship: 'Häuser des Glaubens', q_w_worship_d: 'Besuche 2 Gotteshäuser.',
  q_s_ist: 'Entdecke Istanbul!', q_s_ist_d: 'Besuche 3 Orte in Istanbul.',
  q_s_ank: 'Entdecke Ankara!', q_s_ank_d: 'Besuche 3 Orte in Ankara.',
  q_s_market: 'Basar-Jäger', q_s_market_d: 'Besuche 2 Märkte.',
  q_s_museum: 'Museumsfan', q_s_museum_d: 'Besuche 3 Museen.',
  q_s_asia: 'Zwei Kontinente', q_s_asia_d: 'Nimm die Fähre nach Kadıköy.',
  q_s_chars: 'Vervollständige deine Sammlung', q_s_chars_d: 'Schalte 5 Figuren frei.',
  c_chars: 'Figuren', c_badges: 'Abzeichen', c_costumes: 'Kostüme', main_char: 'Hauptfigur', choose: 'Wählen', unlock_at: 'Level {n}',
  egg: 'Neues Figuren-Ei!', egg_d: 'Schlüpft bei Level {n}. Noch {xp} XP.', egg_all: 'Du hast alle Figuren freigeschaltet.',
  ch_pusula: 'Pusula', ch_lale: 'Lale', ch_cini: 'Çini', ch_simit: 'Simit', ch_marti: 'Martı', ch_kedi: 'Tekir',
  bd_first: 'Erster Stempel', bd_ist: 'Istanbul-Abzeichen', bd_ank: 'Ankara-Abzeichen', bd_market: 'Basar-Meister', bd_faith: 'Pfad des Glaubens', bd_asia: 'Zwei Kontinente', bd_two: 'Zwei Städte', bd_lvl10: 'Level 10',
  co_scarf: 'Entdecker-Schal', co_fez: 'Fes', co_hat: 'Steppenhut', co_cape: 'Reiseumhang', co_need: 'Benötigt: {badge}',
  stats: 'Deine Statistik', st_xp: 'Gesamt-XP', st_places: 'Entdeckte Orte', st_badges: 'Abzeichen', st_quests: 'Erledigte Quests',
  your_name: 'Dein Name', settings: 'Einstellungen', language: 'Sprache', city_l: 'Stadt', customize: 'Figur anpassen',
  locate: 'Meinen Standort zeigen', open_maps: 'In Karten öffnen', no_places: 'Ortsdaten sind noch nicht verfügbar. Wetter, Gebetszeiten, Preise und der Pass funktionieren.'
});
Object.assign(S.ru, {
  search_ph: 'Поиск мест', install: 'На экран «Домой»', install_d: 'Открывайте Keşif как приложение, даже без сети.', install_ios: 'Нажмите «Поделиться», затем «На экран „Домой“».', update_ready: 'Готова новая версия Keşif.', reload: 'Обновить',
  restaurant: 'Ресторан', at_stop: 'Вы у точки {name}!', collect_now: 'Получить штамп', stamp_got_title: 'Штамп получен!', level_up: 'Достигнут уровень {n}!', new_char: 'Открыт новый персонаж: {name}', tap_continue: 'Продолжить', directions: 'Маршрут', call: 'Позвонить', close: 'Закрыть', welcome_sub: 'Посещайте реальные места Стамбула и Анкары, собирайте штампы, получайте XP и открывайте персонажей. Честные цены на такси, время намаза и экстренная помощь — всегда под рукой.', start_loc: 'Включить геолокацию и начать', start_noloc: 'Начать без геолокации', loc_privacy: 'Ваше местоположение и фото остаются на телефоне.',
  take_photo: 'Сделать фото', your_photos: 'Ваши фото', photo_hint: 'Сфотографируйте это место. Первое фото здесь даёт +{n} XP.', c_album: 'Альбом', album_note: 'Фото хранятся только на этом телефоне.', no_photos: 'Пока нет фото. Снимайте места и виды, которые посещаете.', photo_saving: 'Сохраняем фото…', photo_saved: 'Фото сохранено в альбом', photo_failed: 'Не удалось сохранить фото. Проверьте свободное место.', photo_far: 'для XP подойдите к точке ближе 250 м', photo_at: 'фото: {name}', photo_view: 'Вид', share: 'Поделиться', delete: 'Удалить', delete_q: 'Удалить это фото с телефона?', cancel: 'Отмена', q_d_photo: 'Кадр дня', q_d_photo_d: 'Сделайте 1 фото сегодня.', q_s_photo: 'Охотник за кадрами', q_s_photo_d: 'Сделайте фото у 3 разных точек.', bd_photo: 'Фотограф',
  rate_title: 'Оцените место', your_rating: 'Ваша оценка',
  save: 'Сохранить место', saved: 'Сохранено', photo_by: 'Фото: {by} · {lic}', min: '{n} мин', settings_go: 'Настройки', see_all: 'Все',
  n_place: '{n} место',
  n_places: '{n} мест',
  friends: 'Друзья', rank_note: 'Рейтинг по XP. Код — это снимок: попросите у друга новый код, чтобы обновить его счёт.', share_code: 'Поделиться кодом', add_code: 'Добавить код друга', add: 'Добавить', friend_added: '{name} добавлен(а)', bad_code: 'Код не подошёл. Скопируйте весь код, начиная с KSF-.', you: 'Вы', updated: 'на {date}', remove: 'Удалить', code_copied: 'Код скопирован. Отправьте его друзьям.', no_friends: 'Пока нет друзей. Поделитесь своим кодом и добавьте их коды.',
  app_name: 'Keşif', tagline: 'Исследуй. Собирай. Расти.',
  nav_map: 'Карта', nav_quests: 'Задания', nav_collection: 'Коллекция', nav_profile: 'Профиль',
  level: 'Уровень {n}', lv_short: 'Ур. {n}', xp_of: '{a} / {b} XP', traveler: 'Путешественник',
  near_banner: 'Рядом новое открытие: {name}, {dist}', all_done: 'Вы собрали все точки в городе {city}!',
  tools: 'Инструменты', t_fare: 'Цена такси', t_cal: 'Праздники', t_sos: 'Экстренная помощь', t_pray: 'Намаз и храмы',
  back: 'Назад', start: 'В путь', get_stamp: 'Получить штамп', collected: 'Получено {date}',
  rewards: 'Награды', city_badge: 'Значок: {city}', walk: '{n} мин пешком', drive: '{n} мин на машине',
  plus_xp: '+{n} XP', got_xp: '+{n} XP · {what}',
  cat_history: 'Историческое место', cat_museum: 'Музей', cat_worship: 'Место поклонения', cat_market: 'Рынок', cat_view: 'Смотровая точка', cat_park: 'Парк',
  q_daily: 'Ежедневные', q_weekly: 'Недельные', q_special: 'Особые', claim: 'Забрать', claimed: 'Получено',
  q_d_login: 'Ежедневная награда', q_d_login_d: 'Вы открыли Keşif сегодня.',
  q_d_stamp: 'Открытие дня', q_d_stamp_d: 'Соберите 1 штамп сегодня.',
  q_d_fare: 'Честная поездка', q_d_fare_d: 'Проверьте цену такси перед поездкой.',
  q_w_five: 'Насыщенная неделя', q_w_five_d: 'Соберите 5 штампов за неделю.',
  q_w_worship: 'Дома веры', q_w_worship_d: 'Посетите 2 места поклонения.',
  q_s_ist: 'Откройте Стамбул!', q_s_ist_d: 'Посетите 3 места в Стамбуле.',
  q_s_ank: 'Откройте Анкару!', q_s_ank_d: 'Посетите 3 места в Анкаре.',
  q_s_market: 'Охотник за базарами', q_s_market_d: 'Посетите 2 рынка.',
  q_s_museum: 'Знаток музеев', q_s_museum_d: 'Посетите 3 музея.',
  q_s_asia: 'Два континента', q_s_asia_d: 'Переправьтесь на пароме в Кадыкёй.',
  q_s_chars: 'Соберите коллекцию', q_s_chars_d: 'Откройте 5 персонажей.',
  c_chars: 'Персонажи', c_badges: 'Значки', c_costumes: 'Костюмы', main_char: 'Главный герой', choose: 'Выбрать', unlock_at: 'Уровень {n}',
  egg: 'Новое яйцо персонажа!', egg_d: 'Вылупится на уровне {n}. Осталось {xp} XP.', egg_all: 'Вы открыли всех персонажей.',
  ch_pusula: 'Пусула', ch_lale: 'Лале', ch_cini: 'Чини', ch_simit: 'Симит', ch_marti: 'Марты', ch_kedi: 'Текир',
  bd_first: 'Первый штамп', bd_ist: 'Значок Стамбула', bd_ank: 'Значок Анкары', bd_market: 'Мастер базаров', bd_faith: 'Путь веры', bd_asia: 'Два континента', bd_two: 'Два города', bd_lvl10: 'Уровень 10',
  co_scarf: 'Шарф исследователя', co_fez: 'Феска', co_hat: 'Степная шляпа', co_cape: 'Плащ путника', co_need: 'Нужно: {badge}',
  stats: 'Ваша статистика', st_xp: 'Всего XP', st_places: 'Открыто мест', st_badges: 'Значки', st_quests: 'Выполнено заданий',
  your_name: 'Ваше имя', settings: 'Настройки', language: 'Язык', city_l: 'Город', customize: 'Настроить персонажа',
  locate: 'Показать моё местоположение', open_maps: 'Открыть в картах'
});

Object.assign(S.en, { near_sub: 'Anywhere in Türkiye: places around you', city_pick: 'Where are you?', fare_estimate: 'No official tariff for this place yet: estimate from the median of five big cities (start 52 TL, 50 TL/km, minimum 200 TL). Check the meter.', read_wiki: 'Read on Wikipedia', gm_search: 'Search “{what}” on Google Maps', gm_food: 'restaurants', gm_worship: 'mosque church', gm_hospital: 'hospital', gm_pharmacy: 'pharmacy', emb_any: 'Embassies are in Ankara; many countries have consulates in Istanbul, İzmir and Antalya.', tip_any: 'Public holidays apply everywhere in Türkiye. Small towns close early on Sundays and religious holidays.', q_s_izm: 'Discover İzmir!', q_s_izm_d: 'Visit 3 places in İzmir.', q_s_ant: 'Discover Antalya!', q_s_ant_d: 'Visit 3 places in Antalya.', q_s_kap: 'Discover Cappadocia!', q_s_kap_d: 'Visit 3 places in Cappadocia.', q_s_near: 'Your own route', q_s_near_d: 'Collect 3 stamps outside the city packs.', bd_izm: 'İzmir badge', bd_ant: 'Antalya badge', bd_kap: 'Cappadocia badge', bd_near: 'Free explorer', welcome_sub: 'Visit real places anywhere in Türkiye, collect stamps, earn XP and unlock characters. Fair taxi prices, prayer times and emergency help are always one tap away.' });
Object.assign(S.tr, { near_sub: 'Türkiye\'nin her yeri: çevrendeki yerler', city_pick: 'Neredesin?', fare_estimate: 'Burası için henüz resmî tarife yok: beş büyük şehrin ortancasından tahmin (açılış 52 TL, km 50 TL, en az 200 TL). Taksimetreye bak.', read_wiki: 'Wikipedia\'da oku', gm_search: 'Google Haritalar\'da “{what}” ara', gm_food: 'restoran', gm_worship: 'cami kilise', gm_hospital: 'hastane', gm_pharmacy: 'eczane', emb_any: 'Büyükelçilikler Ankara\'da; birçok ülkenin İstanbul, İzmir ve Antalya\'da konsolosluğu var.', tip_any: 'Resmî tatiller Türkiye\'nin her yerinde geçerli. Küçük yerlerde dükkânlar pazar ve bayramlarda erken kapanır.', q_s_izm: 'İzmir\'i Keşfet!', q_s_izm_d: 'İzmir\'de 3 farklı yeri ziyaret et.', q_s_ant: 'Antalya\'yı Keşfet!', q_s_ant_d: 'Antalya\'da 3 farklı yeri ziyaret et.', q_s_kap: 'Kapadokya\'yı Keşfet!', q_s_kap_d: 'Kapadokya\'da 3 farklı yeri ziyaret et.', q_s_near: 'Kendi rotan', q_s_near_d: 'Şehir paketleri dışında 3 damga topla.', bd_izm: 'İzmir Rozeti', bd_ant: 'Antalya Rozeti', bd_kap: 'Kapadokya Rozeti', bd_near: 'Özgür kâşif', welcome_sub: 'Türkiye\'nin her yerinde gerçek yerleri gez, damga topla, XP kazan, karakter aç. Adil taksi ücreti, namaz vakitleri ve acil yardım hep bir dokunuş uzakta.' });
Object.assign(S.de, { near_sub: 'Überall in der Türkei: Orte um dich herum', city_pick: 'Wo bist du?', fare_estimate: 'Für diesen Ort gibt es noch keinen offiziellen Tarif: Schätzung aus dem Median von fünf Großstädten (Grundpreis 52 TL, 50 TL/km, mindestens 200 TL). Achte aufs Taxameter.', read_wiki: 'Auf Wikipedia lesen', gm_search: '„{what}“ in Google Maps suchen', gm_food: 'Restaurant', gm_worship: 'Moschee Kirche', gm_hospital: 'Krankenhaus', gm_pharmacy: 'Apotheke', emb_any: 'Botschaften sind in Ankara; viele Länder haben Konsulate in Istanbul, Izmir und Antalya.', tip_any: 'Feiertage gelten in der ganzen Türkei. In kleinen Orten schließen Läden sonntags und an religiösen Feiertagen früh.', q_s_izm: 'Entdecke Izmir!', q_s_izm_d: 'Besuche 3 Orte in Izmir.', q_s_ant: 'Entdecke Antalya!', q_s_ant_d: 'Besuche 3 Orte in Antalya.', q_s_kap: 'Entdecke Kappadokien!', q_s_kap_d: 'Besuche 3 Orte in Kappadokien.', q_s_near: 'Deine eigene Route', q_s_near_d: 'Sammle 3 Stempel außerhalb der Stadtpakete.', bd_izm: 'Izmir-Abzeichen', bd_ant: 'Antalya-Abzeichen', bd_kap: 'Kappadokien-Abzeichen', bd_near: 'Freier Entdecker', welcome_sub: 'Besuche echte Orte überall in der Türkei, sammle Stempel, verdiene XP und schalte Figuren frei. Faire Taxipreise, Gebetszeiten und Notfallhilfe sind immer nur einen Tipp entfernt.' });
Object.assign(S.ru, { near_sub: 'Вся Турция: места рядом с вами', city_pick: 'Где вы?', fare_estimate: 'Для этого места пока нет официального тарифа: оценка по медиане пяти крупных городов (посадка 52 TL, 50 TL/км, минимум 200 TL). Смотрите на счётчик.', read_wiki: 'Читать в Википедии', gm_search: 'Искать «{what}» в Google Картах', gm_food: 'ресторан', gm_worship: 'мечеть церковь', gm_hospital: 'больница', gm_pharmacy: 'аптека', emb_any: 'Посольства находятся в Анкаре; у многих стран есть консульства в Стамбуле, Измире и Анталье.', tip_any: 'Государственные праздники действуют по всей Турции. В небольших городах магазины рано закрываются по воскресеньям и в религиозные праздники.', q_s_izm: 'Откройте Измир!', q_s_izm_d: 'Посетите 3 места в Измире.', q_s_ant: 'Откройте Анталью!', q_s_ant_d: 'Посетите 3 места в Анталье.', q_s_kap: 'Откройте Каппадокию!', q_s_kap_d: 'Посетите 3 места в Каппадокии.', q_s_near: 'Свой маршрут', q_s_near_d: 'Соберите 3 штампа вне городских пакетов.', bd_izm: 'Значок Измира', bd_ant: 'Значок Антальи', bd_kap: 'Значок Каппадокии', bd_near: 'Свободный исследователь', welcome_sub: 'Посещайте реальные места по всей Турции, собирайте штампы, получайте XP и открывайте персонажей. Честные цены на такси, время намаза и экстренная помощь — всегда под рукой.' });

Object.assign(S.en, { t_plan: 'Day plan', plan_teaser: 'A route for the time you have', plan_intro: 'Pick how long you have. We line up the closest stops in {city} you have not collected yet.', hours: '{n} h', plan_walk: '{n} min walk', plan_ride: '{n} min by taxi', plan_visit: 'stay {n} min', plan_total: '{n} stops · {km} km on foot · done around {end}', plan_show: 'Show route on map', plan_gmaps: 'Open in Google Maps', plan_empty: 'No stops here yet. Try another city.' });
Object.assign(S.tr, { t_plan: 'Gün planı', plan_teaser: 'Ayırdığın süreye göre rota', plan_intro: 'Ne kadar vaktin var? {city} içinde henüz damga almadığın en yakın durakları sıraya koyalım.', hours: '{n} saat', plan_walk: '{n} dk yürü', plan_ride: '{n} dk taksi', plan_visit: '{n} dk kal', plan_total: '{n} durak · {km} km yürüyüş · bitiş yaklaşık {end}', plan_show: 'Rotayı haritada göster', plan_gmaps: 'Google Haritalar\'da aç', plan_empty: 'Burada henüz durak yok. Başka bir şehir dene.' });
Object.assign(S.de, { t_plan: 'Tagesplan', plan_teaser: 'Eine Route für deine Zeit', plan_intro: 'Wie viel Zeit hast du? Wir reihen die nächsten noch nicht gesammelten Stationen in {city} auf.', hours: '{n} Std.', plan_walk: '{n} Min. zu Fuß', plan_ride: '{n} Min. Taxi', plan_visit: '{n} Min. bleiben', plan_total: '{n} Stationen · {km} km zu Fuß · fertig gegen {end}', plan_show: 'Route auf der Karte', plan_gmaps: 'In Google Maps öffnen', plan_empty: 'Hier gibt es noch keine Stationen. Probier eine andere Stadt.' });
Object.assign(S.ru, { t_plan: 'План дня', plan_teaser: 'Маршрут под ваше время', plan_intro: 'Сколько у вас времени? Мы выстроим ближайшие несобранные точки в {city}.', hours: '{n} ч', plan_walk: '{n} мин пешком', plan_ride: '{n} мин на такси', plan_visit: 'остаться {n} мин', plan_total: '{n} точек · {km} км пешком · финиш около {end}', plan_show: 'Показать маршрут на карте', plan_gmaps: 'Открыть в Google Картах', plan_empty: 'Здесь пока нет точек. Выберите другой город.' });

Object.assign(S.en, { offline_title: 'Offline map', offline_note: 'Places you have seen stay on the phone. Save a whole city before you lose signal.', offline_btn: 'Save {city} map offline', offline_progress: 'Saving… {n} / {total}', offline_done: '{city} saved for offline use ({n} files).', offline_fail: 'Could not save the map. Check your connection and try again.' });
Object.assign(S.tr, { offline_title: 'Çevrimdışı harita', offline_note: 'Gördüğün yerler telefonda kalır. Çekim gitmeden önce bütün şehri kaydet.', offline_btn: '{city} haritasını çevrimdışı kaydet', offline_progress: 'Kaydediliyor… {n} / {total}', offline_done: '{city} çevrimdışı kullanım için kaydedildi ({n} dosya).', offline_fail: 'Harita kaydedilemedi. Bağlantını kontrol edip tekrar dene.' });
Object.assign(S.de, { offline_title: 'Offline-Karte', offline_note: 'Gesehene Orte bleiben auf dem Handy. Speichere eine ganze Stadt, bevor du kein Netz hast.', offline_btn: 'Karte von {city} offline speichern', offline_progress: 'Speichern… {n} / {total}', offline_done: '{city} für offline gespeichert ({n} Dateien).', offline_fail: 'Karte konnte nicht gespeichert werden. Prüfe die Verbindung und versuche es erneut.' });
Object.assign(S.ru, { offline_title: 'Офлайн-карта', offline_note: 'Просмотренные места остаются на телефоне. Сохраните весь город, пока есть связь.', offline_btn: 'Сохранить карту: {city}', offline_progress: 'Сохранение… {n} / {total}', offline_done: '{city} сохранён для офлайн ({n} файлов).', offline_fail: 'Не удалось сохранить карту. Проверьте подключение и повторите.' });

Object.assign(S.en, { transit_bursa: 'BursaRay, bus and tram (full fare)', transit_esk: 'Tram and bus (full fare)', transit_esk_qr: 'Single QR ticket', transit_trb: 'City bus in Ortahisar (full fare)' });
Object.assign(S.tr, { transit_bursa: 'BursaRay, otobüs ve tramvay (tam)', transit_esk: 'Tramvay ve otobüs (tam)', transit_esk_qr: 'Tek kullanımlık QR bilet', transit_trb: 'Ortahisar içi belediye otobüsü (tam)' });
Object.assign(S.de, { transit_bursa: 'BursaRay, Bus und Tram (voller Preis)', transit_esk: 'Tram und Bus (voller Preis)', transit_esk_qr: 'Einzel-QR-Ticket', transit_trb: 'Stadtbus in Ortahisar (voller Preis)' });
Object.assign(S.ru, { transit_bursa: 'BursaRay, автобус и трамвай (полный)', transit_esk: 'Трамвай и автобус (полный)', transit_esk_qr: 'Разовый QR-билет', transit_trb: 'Городской автобус в Ортахисаре (полный)' });

Object.assign(S.en, { plan_late: 'This plan runs into the evening. Most museums close between 17:00 and 19:00, and mosques close to visitors at prayer times. Check opening hours or start tomorrow morning.' });
Object.assign(S.tr, { plan_late: 'Bu plan akşama uzanıyor. Müzelerin çoğu 17:00–19:00 arasında kapanır, camiler namaz vakitlerinde ziyarete kapalıdır. Açılış saatlerine bak ya da yarın sabah başla.' });
Object.assign(S.de, { plan_late: 'Dieser Plan reicht in den Abend. Die meisten Museen schließen zwischen 17 und 19 Uhr, Moscheen sind zu Gebetszeiten für Besucher geschlossen. Prüfe die Öffnungszeiten oder starte morgen früh.' });
Object.assign(S.ru, { plan_late: 'План затягивается до вечера. Большинство музеев закрывается с 17:00 до 19:00, мечети закрыты для туристов во время намаза. Проверьте часы работы или начните завтра утром.' });

Object.assign(S.en, { er_24h: 'emergency room' });
Object.assign(S.tr, { er_24h: 'acil servis' });
Object.assign(S.de, { er_24h: 'Notaufnahme' });
Object.assign(S.ru, { er_24h: 'приёмный покой' });

Object.assign(S.en, { msearch_ph: 'Search: pharmacy, döner, museum, a name…', web_results: 'More on OpenStreetMap', route_draw: 'Draw route', route_walk: '{km} · {n} min walk', route_drive: '{km} · {n} min by car', route_straight: 'approximate' });
Object.assign(S.tr, { msearch_ph: 'Ara: eczane, döner, müze, bir yer adı…', web_results: 'OpenStreetMap\'te daha fazlası', route_draw: 'Rota çiz', route_walk: '{km} · {n} dk yürüyüş', route_drive: '{km} · {n} dk araçla', route_straight: 'yaklaşık' });
Object.assign(S.de, { msearch_ph: 'Suche: Apotheke, Döner, Museum, ein Name…', web_results: 'Mehr bei OpenStreetMap', route_draw: 'Route zeichnen', route_walk: '{km} · {n} Min. zu Fuß', route_drive: '{km} · {n} Min. mit dem Auto', route_straight: 'ungefähr' });
Object.assign(S.ru, { msearch_ph: 'Поиск: аптека, дёнер, музей, название…', web_results: 'Ещё в OpenStreetMap', route_draw: 'Построить маршрут', route_walk: '{km} · {n} мин пешком', route_drive: '{km} · {n} мин на машине', route_straight: 'примерно' });
Object.assign(S.en, { min_short: 'min', website: 'Website', open_now: 'Open now', closed_now: 'Closed now', outdoor: 'Outdoor seating', reviews: 'Reviews & photos', reviews_note: 'Opens this place on Google Maps', loc_denied: 'Location is blocked. Allow it in your browser settings (iPhone: Settings › Privacy › Location Services › Safari Websites).', loc_weak: 'Location is approximate (±{n} m). Go outside for GPS.',
 nav_left: 'Turn left', nav_right: 'Turn right', nav_slight_left: 'Keep left', nav_slight_right: 'Keep right', nav_sharp_left: 'Turn sharp left', nav_sharp_right: 'Turn sharp right', nav_straight: 'Go straight', nav_uturn: 'Turn around', nav_depart: 'Start walking', nav_arrive: 'You have arrived!', nav_round: 'At the roundabout, take exit {n}', nav_follow: 'Follow the route', nav_in: 'In {d}', nav_end: 'End', nav_eta: 'arrive {t}', nav_off: 'Recalculating route…', nav_noloc: 'Turn on location to be guided step by step.', nav_sound: 'Voice guidance', nav_overview: 'Show the whole route' });
Object.assign(S.tr, { min_short: 'dk', website: 'Web sitesi', open_now: 'Şu an açık', closed_now: 'Şu an kapalı', outdoor: 'Açık hava oturma', reviews: 'Yorumlar ve fotoğraflar', reviews_note: 'Bu yeri Google Haritalar\'da açar', loc_denied: 'Konum izni kapalı. Tarayıcı ayarlarından izin ver (iPhone: Ayarlar › Gizlilik › Konum Servisleri › Safari Web Siteleri).', loc_weak: 'Konum yaklaşık (±{n} m). GPS için açık havaya çık.',
 nav_left: 'Sola dön', nav_right: 'Sağa dön', nav_slight_left: 'Soldan devam et', nav_slight_right: 'Sağdan devam et', nav_sharp_left: 'Keskin sola dön', nav_sharp_right: 'Keskin sağa dön', nav_straight: 'Düz devam et', nav_uturn: 'Geri dön', nav_depart: 'Yürümeye başla', nav_arrive: 'Vardın!', nav_round: 'Göbekte {n}. çıkıştan çık', nav_follow: 'Rotayı takip et', nav_in: '{d} sonra', nav_end: 'Bitir', nav_eta: 'varış {t}', nav_off: 'Rota yeniden hesaplanıyor…', nav_noloc: 'Adım adım yönlendirme için konumu aç.', nav_sound: 'Sesli yönlendirme', nav_overview: 'Tüm rotayı göster' });
Object.assign(S.de, { min_short: 'Min.', website: 'Website', open_now: 'Jetzt geöffnet', closed_now: 'Jetzt geschlossen', outdoor: 'Sitzplätze draußen', reviews: 'Bewertungen & Fotos', reviews_note: 'Öffnet diesen Ort in Google Maps', loc_denied: 'Standort ist blockiert. Erlaube ihn in den Browser-Einstellungen (iPhone: Einstellungen › Datenschutz › Ortungsdienste › Safari-Websites).', loc_weak: 'Standort ungenau (±{n} m). Geh nach draußen für GPS.',
 nav_left: 'Links abbiegen', nav_right: 'Rechts abbiegen', nav_slight_left: 'Links halten', nav_slight_right: 'Rechts halten', nav_sharp_left: 'Scharf links abbiegen', nav_sharp_right: 'Scharf rechts abbiegen', nav_straight: 'Geradeaus', nav_uturn: 'Umkehren', nav_depart: 'Losgehen', nav_arrive: 'Du bist angekommen!', nav_round: 'Im Kreisverkehr Ausfahrt {n} nehmen', nav_follow: 'Der Route folgen', nav_in: 'In {d}', nav_end: 'Beenden', nav_eta: 'Ankunft {t}', nav_off: 'Route wird neu berechnet…', nav_noloc: 'Standort einschalten für Schritt-für-Schritt-Führung.', nav_sound: 'Sprachansage', nav_overview: 'Ganze Route zeigen' });
Object.assign(S.ru, { min_short: 'мин', website: 'Сайт', open_now: 'Сейчас открыто', closed_now: 'Сейчас закрыто', outdoor: 'Места на улице', reviews: 'Отзывы и фото', reviews_note: 'Откроет это место в Google Картах', loc_denied: 'Доступ к геолокации запрещён. Разрешите его в настройках браузера (iPhone: Настройки › Конфиденциальность › Службы геолокации › Веб-сайты Safari).', loc_weak: 'Местоположение примерное (±{n} м). Выйдите на улицу для GPS.',
 nav_left: 'Поверните налево', nav_right: 'Поверните направо', nav_slight_left: 'Держитесь левее', nav_slight_right: 'Держитесь правее', nav_sharp_left: 'Резко налево', nav_sharp_right: 'Резко направо', nav_straight: 'Прямо', nav_uturn: 'Развернитесь', nav_depart: 'Начните движение', nav_arrive: 'Вы прибыли!', nav_round: 'На круге — {n}-й съезд', nav_follow: 'Следуйте по маршруту', nav_in: 'Через {d}', nav_end: 'Завершить', nav_eta: 'прибытие {t}', nav_off: 'Перестраиваю маршрут…', nav_noloc: 'Включите геолокацию для пошаговой навигации.', nav_sound: 'Голосовые подсказки', nav_overview: 'Показать весь маршрут' });
Object.assign(S.en, { nav_now: 'Now', nav_dest_in: 'Destination in {d}' });
Object.assign(S.tr, { nav_now: 'Şimdi', nav_dest_in: 'Varışa {d}' });
Object.assign(S.de, { nav_now: 'Jetzt', nav_dest_in: 'Ziel in {d}' });
Object.assign(S.ru, { nav_now: 'Сейчас', nav_dest_in: 'До цели {d}' });
