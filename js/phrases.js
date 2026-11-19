// Turkish phrases for visitors: the Turkish, how to say it (written for each language's readers), and the meaning.
// [turkish, {en, de, ru} pronunciation, {en, de, ru, tr} meaning]. "{lang}" phrases are filled per language.
export const PHRASE_GROUPS = [
  ['ph_basic', [
    ['Merhaba', { en: 'mehr-hah-BAH', de: 'Merhaba', ru: 'Мерхаба' }, { en: 'Hello', de: 'Hallo', ru: 'Здравствуйте', tr: 'Hello' }],
    ['Teşekkür ederim', { en: 'teh-shek-KEWR eh-deh-rim', de: 'Teschekkür ederim', ru: 'Тешеккюр эдерим' }, { en: 'Thank you', de: 'Danke', ru: 'Спасибо', tr: 'Thank you' }],
    ['Lütfen', { en: 'LEWT-fen', de: 'Lütfen', ru: 'Лютфен' }, { en: 'Please', de: 'Bitte', ru: 'Пожалуйста', tr: 'Please' }],
    ['Evet / Hayır', { en: 'eh-VET / HAH-yuhr', de: 'Ewet / Hajyr', ru: 'Эвет / Хайыр' }, { en: 'Yes / No', de: 'Ja / Nein', ru: 'Да / Нет', tr: 'Yes / No' }],
    ['Affedersiniz', { en: 'ahf-feh-DEHR-see-neez', de: 'Affedersinis', ru: 'Аффедерсиниз' }, { en: 'Excuse me', de: 'Entschuldigung', ru: 'Извините', tr: 'Excuse me' }],
    ['Anlamıyorum', { en: 'ahn-LAH-muh-yoh-room', de: 'Anlamyjorum', ru: 'Анламыёрум' }, { en: "I don't understand", de: 'Ich verstehe nicht', ru: 'Я не понимаю', tr: "I don't understand" }],
    ['{lang} biliyor musunuz?', { en: 'een-gee-LEEZ-jeh bee-lee-YOHR moo-soo-nooz', de: 'Almandscha bilijor musunus?', ru: 'Русча билийор мусунуз?' }, { en: 'Do you speak English?', de: 'Sprechen Sie Deutsch?', ru: 'Вы говорите по-русски?', tr: 'Do you speak English?' }],
    ['Günaydın', { en: 'gewn-eye-DUHN', de: 'Günajdyn', ru: 'Гюнайдын' }, { en: 'Good morning', de: 'Guten Morgen', ru: 'Доброе утро', tr: 'Good morning' }],
    ['Hoşça kalın', { en: 'HOHSH-chah kah-luhn', de: 'Hoschtscha kalyn', ru: 'Хошча калын' }, { en: 'Goodbye', de: 'Auf Wiedersehen', ru: 'До свидания', tr: 'Goodbye' }]
  ]],
  ['ph_food', [
    ['Hesap lütfen', { en: 'heh-SAHP lewt-fen', de: 'Hesap lütfen', ru: 'Хесап лютфен' }, { en: 'The bill, please', de: 'Die Rechnung, bitte', ru: 'Счёт, пожалуйста', tr: 'The bill, please' }],
    ['Ne kadar?', { en: 'neh kah-DAHR', de: 'Ne kadar?', ru: 'Не кадар?' }, { en: 'How much?', de: 'Wie viel kostet das?', ru: 'Сколько стоит?', tr: 'How much?' }],
    ['Bir çay, lütfen', { en: 'beer chai, lewt-fen', de: 'Bir tschaj, lütfen', ru: 'Бир чай, лютфен' }, { en: 'A tea, please', de: 'Einen Tee, bitte', ru: 'Чай, пожалуйста', tr: 'A tea, please' }],
    ['Su', { en: 'soo', de: 'Su', ru: 'Су' }, { en: 'Water', de: 'Wasser', ru: 'Вода', tr: 'Water' }],
    ['Vejetaryen yemek var mı?', { en: 'veh-zheh-tahr-YEN yeh-MEK vahr muh', de: 'Weschetarjen jemek war my?', ru: 'Веджетарьен емек вар мы?' }, { en: 'Is there vegetarian food?', de: 'Gibt es vegetarisches Essen?', ru: 'Есть вегетарианская еда?', tr: 'Is there vegetarian food?' }],
    ['Acı olmasın, lütfen', { en: 'ah-JUH ohl-mah-suhn, lewt-fen', de: 'Adschy olmasyn, lütfen', ru: 'Аджы олмасын, лютфен' }, { en: 'Not spicy, please', de: 'Bitte nicht scharf', ru: 'Не острое, пожалуйста', tr: 'Not spicy, please' }],
    ['Çok lezzetli!', { en: 'chohk lez-zet-LEE', de: 'Tschok lessetli!', ru: 'Чок леззетли!' }, { en: 'Delicious!', de: 'Sehr lecker!', ru: 'Очень вкусно!', tr: 'Delicious!' }]
  ]],
  ['ph_travel', [
    ['Taksimetreyi açar mısınız?', { en: 'tahk-see-MET-reh-yee ah-CHAHR muh-suh-nuhz', de: 'Taksimetreji atschar mysynys?', ru: 'Таксиметрейи ачар мысыныз?' }, { en: 'Could you turn on the meter?', de: 'Können Sie das Taxameter einschalten?', ru: 'Включите, пожалуйста, счётчик', tr: 'Could you turn on the meter?' }],
    ['Bu adrese, lütfen', { en: 'boo ahd-reh-SEH, lewt-fen', de: 'Bu adrese, lütfen', ru: 'Бу адресе, лютфен' }, { en: 'To this address, please', de: 'Zu dieser Adresse, bitte', ru: 'По этому адресу, пожалуйста', tr: 'To this address, please' }],
    ['Tuvalet nerede?', { en: 'too-vah-LET neh-reh-deh', de: 'Tuwalet nerede?', ru: 'Тувалет нереде?' }, { en: 'Where is the toilet?', de: 'Wo ist die Toilette?', ru: 'Где туалет?', tr: 'Where is the toilet?' }],
    ['Fotoğraf çekebilir miyim?', { en: 'foh-toh-RAHF cheh-keh-bee-LEER mee-yeem', de: 'Fotograf tschekebilir mijim?', ru: 'Фотограф чекебилир мийим?' }, { en: 'May I take a photo?', de: 'Darf ich ein Foto machen?', ru: 'Можно сфотографировать?', tr: 'May I take a photo?' }],
    ['Burada durun, lütfen', { en: 'boo-rah-DAH doo-roon, lewt-fen', de: 'Burada durun, lütfen', ru: 'Бурада дурун, лютфен' }, { en: 'Stop here, please', de: 'Halten Sie bitte hier', ru: 'Остановите здесь, пожалуйста', tr: 'Stop here, please' }]
  ]],
  ['ph_help', [
    ['Yardım edin!', { en: 'yahr-DUHM eh-deen', de: 'Jardym edin!', ru: 'Ярдым эдин!' }, { en: 'Help!', de: 'Hilfe!', ru: 'Помогите!', tr: 'Help!' }],
    ['Hastaneye gitmem lazım', { en: 'hahs-tah-neh-YEH geet-MEM lah-ZUHM', de: 'Hastaneje gitmem lasym', ru: 'Хастанейе гитмем лазым' }, { en: 'I need to go to a hospital', de: 'Ich muss ins Krankenhaus', ru: 'Мне нужно в больницу', tr: 'I need to go to a hospital' }],
    ['Kayboldum', { en: 'kai-bohl-DOOM', de: 'Kajboldum', ru: 'Кайболдум' }, { en: "I'm lost", de: 'Ich habe mich verlaufen', ru: 'Я заблудился', tr: "I'm lost" }],
    ['Polisi arayın!', { en: 'poh-lee-SEE ah-rah-yuhn', de: 'Polisi arajyn!', ru: 'Полиси арайын!' }, { en: 'Call the police!', de: 'Rufen Sie die Polizei!', ru: 'Вызовите полицию!', tr: 'Call the police!' }],
    ['Eczane nerede?', { en: 'ej-ZAH-neh neh-reh-deh', de: 'Edschsane nerede?', ru: 'Эджзане нереде?' }, { en: 'Where is a pharmacy?', de: 'Wo ist eine Apotheke?', ru: 'Где аптека?', tr: 'Where is a pharmacy?' }]
  ]]
];
export const LANG_WORD = { en: 'İngilizce', de: 'Almanca', ru: 'Rusça', tr: 'İngilizce' };
