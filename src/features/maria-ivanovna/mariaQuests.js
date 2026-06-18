const quest = (id, chapter, title, description, objective, coins, trust, icon, previousQuestId = null) => ({
  id,
  chapter,
  title,
  description,
  objective,
  reward: { coins, trust },
  icon,
  previousQuestId,
});

export const MARIA_CHAPTERS = [
  { id: 1, title: "Чужой двор", subtitle: "Освоиться и доказать, что ты не случайный прохожий." },
  { id: 2, title: "Кислая линия", subtitle: "Наладить первую платную культуру и выйти в клуб." },
  { id: 3, title: "Закрытая поставка", subtitle: "Получить доступ к Кока Нове и дорогим покупателям." },
  { id: 4, title: "Работа на качество", subtitle: "Перестать продавать всё подряд и научиться выбирать момент." },
  { id: 5, title: "Имя на Grow Street", subtitle: "Стать поставщиком, которому доверяют Мария, Зорик и клуб." },
];

export const MARIA_QUESTS = [
  quest("maria-tabakko-delivery", 1, "Первая связка", "Принеси Марии три листа Табакко. Это пропуск в район, а не подарок.", { type: "deliver", itemId: "tabakko", amount: 3 }, 180, 25, "🌿"),
  quest("maria-first-watering", 1, "Не лей бездумно", "Нажми на облачко с каплей и полей растение во время активной стадии роста.", { type: "care-use", careType: "water", amount: 1 }, 80, 25, "💦", "maria-tabakko-delivery"),
  quest("maria-tabakko-stock", 1, "Запас на вечер", "Собери и принеси ещё четыре листа Табакко.", { type: "deliver", itemId: "tabakko", amount: 4 }, 95, 8, "▦", "maria-first-watering"),
  quest("maria-tabakko-club", 1, "Первый выход", "Продай в клубе три листа Табакко.", { type: "club-sale", itemId: "tabakko", amount: 3 }, 110, 8, "♣", "maria-tabakko-stock"),
  quest("maria-club-rep-20", 1, "Чтобы запомнили", "Подними репутацию клуба до 20.", { type: "club-reputation", amount: 20 }, 80, 6, "✶", "maria-tabakko-club"),
  quest("maria-tabakko-good", 1, "Не просто лист", "Получи Табакко качеством не ниже хорошего.", { type: "quality-rank", itemId: "tabakko", rank: 1, amount: 1 }, 130, 8, "◆", "maria-club-rep-20"),
  quest("maria-water-three", 1, "Ровная рука", "Используй полив суммарно три раза.", { type: "care-use", careType: "water", amount: 3 }, 90, 5, "≈", "maria-tabakko-good"),

  quest("maria-kisloplod-seed", 2, "Кислая закупка", "Купи первое семя Кислоплода.", { type: "own-seed", itemId: "greenTomato", amount: 1 }, 75, 5, "🟢", "maria-water-three"),
  quest("maria-kisloplod-delivery", 2, "Проба урожая", "Принеси один Кислоплод.", { type: "deliver", itemId: "greenTomato", amount: 1 }, 125, 7, "◉", "maria-kisloplod-seed"),
  quest("maria-kisloplod-club", 2, "Кислый спрос", "Продай в клубе два Кислоплода.", { type: "club-sale", itemId: "greenTomato", amount: 2 }, 150, 7, "♣", "maria-kisloplod-delivery"),
  quest("maria-club-rep-45", 2, "Нормальный разговор", "Подними репутацию клуба до 45.", { type: "club-reputation", amount: 45 }, 110, 5, "✶", "maria-kisloplod-club"),
  quest("maria-kisloplod-good", 2, "Без кислой мины", "Получи Кислоплод качеством не ниже хорошего.", { type: "quality-rank", itemId: "greenTomato", rank: 1, amount: 1 }, 165, 7, "◆", "maria-club-rep-45"),
  quest("maria-tabakko-sale-8", 2, "Постоянный клиент", "Продай клубу суммарно восемь листов Табакко.", { type: "club-sale", itemId: "tabakko", amount: 8 }, 125, 5, "▣", "maria-kisloplod-good"),
  quest("maria-kisloplod-delivery-3", 2, "Партия для кухни", "Передай Марии три Кислоплода.", { type: "deliver", itemId: "greenTomato", amount: 3 }, 210, 8, "◉", "maria-tabakko-sale-8"),
  quest("maria-club-rep-75", 2, "Своё место", "Подними репутацию клуба до 75.", { type: "club-reputation", amount: 75 }, 150, 6, "★", "maria-kisloplod-delivery-3"),

  quest("maria-koka-seed", 3, "Закрытый пакет", "Купи первое семя Кока Новы.", { type: "own-seed", itemId: "kokaNova", amount: 1 }, 110, 5, "🍃", "maria-club-rep-75"),
  quest("maria-koka-delivery", 3, "Проверка Марии", "Принеси один урожай Кока Новы.", { type: "deliver", itemId: "kokaNova", amount: 1 }, 230, 8, "✦", "maria-koka-seed"),
  quest("maria-koka-club", 3, "Дорогой стол", "Продай в клубе две Кока Новы.", { type: "club-sale", itemId: "kokaNova", amount: 2 }, 270, 8, "♣", "maria-koka-delivery"),
  quest("maria-club-rep-110", 3, "Тебя уже знают", "Подними репутацию клуба до 110.", { type: "club-reputation", amount: 110 }, 170, 6, "✶", "maria-koka-club"),
  quest("maria-koka-good", 3, "Чистая партия", "Получи Кока Нову качеством не ниже хорошего.", { type: "quality-rank", itemId: "kokaNova", rank: 1, amount: 1 }, 240, 8, "◆", "maria-club-rep-110"),
  quest("maria-kisloplod-sale-6", 3, "Держи ассортимент", "Продай клубу суммарно шесть Кислоплодов.", { type: "club-sale", itemId: "greenTomato", amount: 6 }, 200, 6, "▦", "maria-koka-good"),
  quest("maria-koka-delivery-3", 3, "Три красных листа", "Передай Марии три Кока Новы.", { type: "deliver", itemId: "kokaNova", amount: 3 }, 330, 8, "🍃", "maria-kisloplod-sale-6"),
  quest("maria-club-rep-150", 3, "Поставщик", "Подними репутацию клуба до 150.", { type: "club-reputation", amount: 150 }, 220, 7, "★", "maria-koka-delivery-3"),

  quest("maria-nutrition-own", 4, "Питание, не магия", "Купи питательный раствор.", { type: "own-tool", itemId: "nutrition", amount: 1 }, 120, 4, "🌿", "maria-club-rep-150"),
  quest("maria-nutrition-care", 4, "Работа на качество", "Используй питательный раствор во время роста.", { type: "care-use", careType: "nutrition", amount: 1 }, 190, 7, "🧪", "maria-nutrition-own"),
  quest("maria-excellent-any", 4, "Отличная партия", "Получи любую культуру отличного качества.", { type: "quality-any", rank: 2, amount: 1 }, 300, 9, "✦", "maria-nutrition-care"),
  quest("maria-club-rep-210", 4, "Торг без суеты", "Подними репутацию клуба до 210.", { type: "club-reputation", amount: 210 }, 240, 7, "♣", "maria-excellent-any"),
  quest("maria-koka-sale-5", 4, "Пять дорогих сделок", "Продай клубу суммарно пять Кока Нов.", { type: "club-sale", itemId: "kokaNova", amount: 5 }, 360, 8, "▣", "maria-club-rep-210"),
  quest("maria-water-eight", 4, "Режим", "Используй полив суммарно восемь раз.", { type: "care-use", careType: "water", amount: 8 }, 170, 5, "≈", "maria-koka-sale-5"),
  quest("maria-nutrition-three", 4, "Без случайностей", "Используй питательный раствор три раза.", { type: "care-use", careType: "nutrition", amount: 3 }, 260, 7, "🌿", "maria-water-eight"),
  quest("maria-club-rep-280", 4, "Хорошая фамилия", "Подними репутацию клуба до 280.", { type: "club-reputation", amount: 280 }, 300, 8, "★", "maria-nutrition-three"),

  quest("maria-mix-own", 5, "Секретный флакон", "Купи смесь Марии Ивановны.", { type: "own-tool", itemId: "mariaMix", amount: 1 }, 180, 4, "🧪", "maria-club-rep-280"),
  quest("maria-mix-use", 5, "Без свидетелей", "Используй смесь Марии во время роста.", { type: "care-use", careType: "mariaMix", amount: 1 }, 260, 7, "✧", "maria-mix-own"),
  quest("maria-rare-discovery", 5, "Редкая отметка", "Открой хотя бы один редкий урожай.", { type: "rare-discovery", amount: 1 }, 450, 12, "★", "maria-mix-use"),
  quest("maria-club-rep-350", 5, "Свой поставщик", "Подними репутацию клуба до 350.", { type: "club-reputation", amount: 350 }, 330, 8, "♣", "maria-rare-discovery"),
  quest("maria-all-sales", 5, "Полный прилавок", "Продай в клубе не меньше пяти единиц каждой культуры.", { type: "club-sale-each", amount: 5 }, 520, 12, "▦", "maria-club-rep-350"),
  quest("maria-excellent-koka", 5, "Лучший лист", "Получи Кока Нову отличного качества.", { type: "quality-rank", itemId: "kokaNova", rank: 2, amount: 1 }, 480, 12, "✦", "maria-all-sales"),
  quest("maria-club-rep-420", 5, "Имя на районе", "Подними репутацию клуба до 420.", { type: "club-reputation", amount: 420 }, 600, 15, "★", "maria-excellent-koka"),
  quest("maria-final-delivery", 5, "Ключ от лифта", "Принеси Марии по три единицы каждой культуры. Она покажет, что спрятано под домом.", { type: "deliver-set", items: { tabakko: 3, greenTomato: 3, kokaNova: 3 }, amount: 9 }, 900, 25, "🔑", "maria-club-rep-420"),
];

export const DISTRICT_BULLETINS = [
  { title: "У клуба сменился бармен", text: "Новый бармен любит качественный Табакко и хуже переносит наглые цены. Сегодня торг может быть жёстче." },
  { title: "У Зорика задержалась машина", text: "Редкие поставки приходят не по расписанию. Проверяй лавку после обновления — оснащение исчезает быстрее семян." },
  { title: "Кто-то слышал лифт", text: "Ночью под домом Марии снова гудел старый механизм. Сама она говорит, что это трубы. Никто ей не верит." },
  { title: "Кислоплод вошёл в моду", text: "В клубе его мешают с ледяной водой. Покупатели готовы брать больше, но только хорошее качество." },
  { title: "Проверка на районе", text: "Типусиан просит не носить весь урожай одному покупателю. Когда один стол знает твой запас, торг становится хуже." },
  { title: "Мария закрыла окно", text: "Значит, снова варит свою смесь. Зорик клянётся, что ничего не знает, но уже освободил место на полке." },
  { title: "Старое правило Grow Street", text: "Быстрые деньги делают тебя заметным. Хорошие сделки делают тебя своим. Репутация открывает больше, чем монеты." },
  { title: "Пропал грузчик", text: "Последний раз его видели возле закрытого лифта. На стене осталась только надпись: «не выращивайте это наверху»." },
];
