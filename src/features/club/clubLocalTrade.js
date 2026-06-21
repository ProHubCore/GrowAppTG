const DEFAULT_VOICE = {
  arrival: [
    ({ amount, crop, quality, offer }) =>
      `Слушай, мне нужны ${amount} шт. ${crop}, ${quality}. За всю партию дам ${offer} монет.`,
    ({ amount, crop, quality, offer }) =>
      `Ищу ${amount} шт. ${crop}, качество — ${quality}. Могу положить на стол ${offer} монет.`,
  ],
  raise: [
    ({ offer }) => `Ладно, немного подвинусь. ${offer} монет — уже ближе к делу.`,
    ({ offer }) => `Уговорил. Поднимаю до ${offer}, но дальше будет сложнее.`,
    ({ offer }) => `Хорошо, вижу качество. Пусть будет ${offer} монет.`,
  ],
  hold: [
    ({ offer }) => `Не, пока остаюсь на ${offer}. Ты уже начинаешь перегревать цену.`,
    ({ offer }) => `${offer} — нормальные деньги. Не заставляй меня повторять дважды.`,
  ],
  ceiling: [
    ({ offer }) => `${offer} — мой потолок. Выше уже не пойду.`,
    ({ offer }) => `Всё, ${offer} — последняя цена. Решай сейчас.`,
  ],
  leaving: [
    () => "Не, всё. Мы эту цену уже замучили — я пошёл.",
    () => "Хватит кругами ходить. Поищу партию в другом месте.",
    () => "Не сойдёмся. Удачи со следующим покупателем.",
  ],
};

const BUYER_VOICES = {
  tipusian: {
    arrival: [
      ({ amount, crop, quality, offer }) =>
        `Братуха, надо ${amount} шт. ${crop}, ${quality}. Закину ${offer} монет. Как тебе?`,
      ({ amount, crop, quality, offer }) =>
        `Смотри, заберу ${amount} шт. ${crop}. Нужно ${quality}, плачу ${offer}. Без долгих танцев.`,
    ],
    raise: [
      ({ offer }) => `Во, уже разговор. Ладно, ${offer} монет — но не наглей.`,
      ({ offer }) => `Нормально заговорил. Накину до ${offer}.`,
    ],
    hold: [
      ({ offer }) => `Не-не, братуха. Пока ${offer}. Я тоже не первый день за столом.`,
      ({ offer }) => `${offer} — честно. Дальше ты уже меня прогибаешь.`,
    ],
    ceiling: [
      ({ offer }) => `${offer} — всё, край. Ещё раз попросишь — я встал.`,
    ],
    leaving: [
      () => "Не, братуха, хорош. Ты цену до потолка докинул — я ушёл.",
      () => "Всё, не срослось. Следующий раз без таких аппетитов.",
    ],
  },
  margo: {
    arrival: [
      ({ amount, crop, quality, offer }) =>
        `Мне на стойку нужны ${amount} шт. ${crop}, ${quality}. За всё дам ${offer} монет.`,
    ],
    raise: [
      ({ offer }) => `Красиво продаёшь. Ладно, подниму до ${offer}.`,
      ({ offer }) => `Хорошо, публика это оценит. ${offer} монет.`,
    ],
    hold: [
      ({ offer }) => `Не спеши. Касса у меня одна, и в ней пока ${offer}.`,
    ],
    ceiling: [
      ({ offer }) => `${offer} — последняя цена перед открытием бара.`,
    ],
    leaving: [
      () => "Нет, на такой цене стойка не заработает. Я пас.",
    ],
  },
  rax: {
    arrival: [
      ({ amount, crop, quality, offer }) =>
        `Нужно быстро: ${amount} шт. ${crop}, ${quality}. Даю ${offer} монет.`,
    ],
    raise: [
      ({ offer }) => `Ладно. ${offer}. Но маршрут уже горит.`,
    ],
    hold: [
      ({ offer }) => `${offer}. У меня нет времени спорить по кругу.`,
    ],
    ceiling: [
      ({ offer }) => `${offer} — финал. Сейчас да или нет.`,
    ],
    leaving: [
      () => "Время вышло. Найду товар по дороге.",
    ],
  },
  vespa: {
    arrival: [
      ({ amount, crop, quality, offer }) =>
        `Меня интересуют ${amount} шт. ${crop}, только ${quality}. Предлагаю ${offer} монет.`,
    ],
    raise: [
      ({ offer }) => `Редкость действительно заметна. Исправлю предложение до ${offer}.`,
    ],
    hold: [
      ({ offer }) => `Редкость не оправдывает любую фантазию. Пока ${offer}.`,
    ],
    ceiling: [
      ({ offer }) => `${offer} — предел разумной коллекционной цены.`,
    ],
    leaving: [
      () => "Нет. Коллекция переживёт отсутствие этой партии.",
    ],
  },
  "uncle-bit": {
    arrival: [
      ({ amount, crop, quality, offer }) =>
        `Малой, заберу объёмом: ${amount} шт. ${crop}, ${quality}. Даю ${offer} монет.`,
    ],
    raise: [
      ({ offer }) => `Ладно, уважаю упорство. Пусть будет ${offer}.`,
      ({ offer }) => `Накинул до ${offer}. Но объём тоже чего-то стоит.`,
    ],
    hold: [
      ({ offer }) => `Не торопись. ${offer} за весь объём — не так уж мало.`,
    ],
    ceiling: [
      ({ offer }) => `${offer} — и ударили по рукам. Больше не достану.`,
    ],
    leaving: [
      () => "Не-не, малой. За такие деньги я лучше подожду.",
    ],
  },
  luna: {
    arrival: [
      ({ amount, crop, quality, offer }) =>
        `На ночь нужны ${amount} шт. ${crop}, качество ${quality}. Моя цена — ${offer}.`,
    ],
    raise: [
      ({ offer }) => `Звучит убедительно. Подниму тон до ${offer} монет.`,
    ],
    hold: [
      ({ offer }) => `Нет, ритм сделки пока держится на ${offer}.`,
    ],
    ceiling: [
      ({ offer }) => `${offer} — последняя нота. Дальше будет тишина.`,
    ],
    leaving: [
      () => "Всё, ритм потерян. Я пошла.",
    ],
  },
  broker: {
    arrival: [
      ({ amount, crop, quality, offer }) =>
        `Беру ${amount} шт. ${crop}, не ниже ${quality}. Расчётная ставка — ${offer} монет.`,
    ],
    raise: [
      ({ offer }) => `Аргумент принят. Корректирую ставку до ${offer}.`,
    ],
    hold: [
      ({ offer }) => `Маржа не сходится. Текущая ставка остаётся ${offer}.`,
    ],
    ceiling: [
      ({ offer }) => `${offer} — экономический предел этой сделки.`,
    ],
    leaving: [
      () => "Сделка потеряла смысл. Закрываю расчёт.",
    ],
  },
  oracle: {
    arrival: [
      ({ amount, crop, quality, offer }) =>
        `Знаки привели меня за ${amount} шт. ${crop}, ${quality}. Сегодняшнее число — ${offer}.`,
    ],
    raise: [
      ({ offer }) => `Монета качнулась в твою сторону. Теперь число — ${offer}.`,
    ],
    hold: [
      ({ offer }) => `Знак не изменился. Всё ещё ${offer}.`,
    ],
    ceiling: [
      ({ offer }) => `${offer}. Выше этого числа дорога закрыта.`,
    ],
    leaving: [
      () => "Знак погас. Этой сделки не должно было быть.",
    ],
  },

  "kira-volt": {
    arrival: [
      ({ amount, crop, quality, offer }) =>
        `На смену нужны ${amount} шт. ${crop}, ${quality}. Могу дать ${offer} монет до включения света.`,
    ],
    raise: [
      ({ offer }) => `Контакт есть. Поднимаю напряжение до ${offer}.`,
    ],
    hold: [
      ({ offer }) => `Не коротни сделку. Пока держу ${offer}.`,
    ],
    ceiling: [
      ({ offer }) => `${offer} — предел сети. Выше выбьет всё помещение.`,
    ],
    leaving: [
      () => "Всё, контакт пропал. Поищу другую линию.",
    ],
  },
  nox: {
    arrival: [
      ({ amount, crop, quality, offer }) =>
        `На кухню нужны ${amount} шт. ${crop}, ${quality}. За ровную партию дам ${offer}.`,
    ],
    raise: [
      ({ offer }) => `Вкус стабильный, вижу. Ладно, ${offer} монет.`,
    ],
    hold: [
      ({ offer }) => `Я плачу за товар, не за историю. Пока ${offer}.`,
    ],
    ceiling: [
      ({ offer }) => `${offer} — максимум, который пропустит кухня.`,
    ],
    leaving: [
      () => "Пересолили цену. Я ухожу.",
    ],
  },
  "madam-flux": {
    arrival: [
      ({ amount, crop, quality, offer }) =>
        `Для главного стола нужны ${amount} шт. ${crop}, ${quality}. Предлагаю ${offer} монет.`,
    ],
    raise: [
      ({ offer }) => `Эта партия действительно соберёт внимание. Пусть будет ${offer}.`,
    ],
    hold: [
      ({ offer }) => `Публика щедрая, но не безумная. Пока ${offer}.`,
    ],
    ceiling: [
      ({ offer }) => `${offer} — последняя цена перед началом вечеринки.`,
    ],
    leaving: [
      () => "Нет. За эту цену я лучше сменю программу вечера.",
    ],
  },
  bongo: {
    arrival: [
      ({ amount, crop, quality, offer }) =>
        `Брат, надо ${amount} шт. ${crop}, ${quality}. Мой ритм — ${offer} монет.`,
    ],
    raise: [
      ({ offer }) => `Во, попали в бит. Поднимаю до ${offer}.`,
    ],
    hold: [
      ({ offer }) => `Не спеши, ритм пока стоит на ${offer}.`,
    ],
    ceiling: [
      ({ offer }) => `${offer} — финальный удар. Дальше песня закончится.`,
    ],
    leaving: [
      () => "Всё, брат, ритм развалился. Я пошёл.",
    ],
  },
  pix: {
    arrival: [
      ({ amount, crop, quality, offer }) =>
        `Чату нужны ${amount} шт. ${crop}, ${quality}. На экране сейчас ${offer} монет.`,
    ],
    raise: [
      ({ offer }) => `Чат одобрил качество. Апну ставку до ${offer}.`,
    ],
    hold: [
      ({ offer }) => `Чат пишет, что ты перегибаешь. Остаюсь на ${offer}.`,
    ],
    ceiling: [
      ({ offer }) => `${offer} — донат-бар заполнен. Выше не будет.`,
    ],
    leaving: [
      () => "Всё, чат проголосовал против. Скипаю сделку.",
    ],
  },
  "quiet-tai": {
    arrival: [
      ({ amount, crop, quality, offer }) =>
        `${amount} шт. ${crop}. Качество ${quality}. Цена — ${offer}.`,
    ],
    raise: [
      ({ offer }) => `Хорошо. ${offer}.`,
    ],
    hold: [
      ({ offer }) => `${offer}. Не повторяй просьбу зря.`,
    ],
    ceiling: [
      ({ offer }) => `${offer}. Последнее слово.`,
    ],
    leaving: [
      () => "Нет. Маршрут закрыт.",
    ],
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomInteger(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function hashText(value = "") {
  return String(value)
    .split("")
    .reduce((hash, char) => hash + char.charCodeAt(0), 0);
}

function pickCycled(list, buyerId, round = 0, salt = 0) {
  const source = Array.isArray(list) && list.length ? list : [() => "..."];
  const index =
    Math.abs(hashText(buyerId) + round * 7 + salt * 13) % source.length;
  return source[index];
}

function getVoice(buyer) {
  return {
    ...DEFAULT_VOICE,
    ...(BUYER_VOICES[buyer?.id] || {}),
  };
}

function getSpeechContext({ buyer, request, quality, offer }) {
  return {
    buyer: buyer?.name || "Покупатель",
    amount: Math.max(1, Number(request?.amount) || 1),
    crop: request?.cropName || "товара",
    quality: String(quality?.name || "Обычное").toLowerCase(),
    offer: Math.max(1, Math.round(Number(offer) || 1)),
  };
}

/**
 * Цена растёт короткими понятными шагами. Потолок считается от первой ставки,
 * поэтому торг ощущается выгодным, но не ломает экономику.
 */
export function getTradeCeiling({ buyer, quote, qualityRank = 0, priceBonus = 0 }) {
  if (!quote) return 1;

  const opening = Math.max(1, Math.round(Number(quote.total) || 1));
  const tolerance = clamp(buyer?.tolerance ?? 0.55, 0.15, 0.98);
  const patience = clamp(Number(buyer?.patience) || 1, 1, 4);
  const uplift = clamp(
    0.07 + tolerance * 0.055 + patience * 0.012 + qualityRank * 0.009,
    0.1,
    0.19,
  );
  const openingCap = opening + Math.max(2, Math.round(opening * uplift));
  const marketCap = Math.max(
    opening,
    Math.round((Number(quote.marketTotal) || opening) * (1.015 + priceBonus * 0.0005)),
  );

  return Math.max(opening, Math.min(openingCap, marketCap));
}

export function createInitialLocalTrade({
  buyer,
  request,
  quality,
  quote,
  priceBonus = 0,
}) {
  const offerTotal = Math.max(1, Math.round(Number(quote?.total) || 1));
  const ceilingTotal = getTradeCeiling({
    buyer,
    quote,
    qualityRank: quality?.rank || 0,
    priceBonus,
  });
  const interest = clamp(
    91 +
      (Number(buyer?.tolerance) || 0.55) * 5 +
      (Number(buyer?.patience) || 1) * 1.2 +
      randomInteger(-2, 2),
    90,
    100,
  );
  const voice = getVoice(buyer);
  const context = getSpeechContext({ buyer, request, quality, offer: offerTotal });
  const line = pickCycled(voice.arrival, buyer?.id, 0)(context);

  return {
    offerTotal,
    previousOfferTotal: offerTotal,
    lastDelta: 0,
    ceilingTotal,
    interest,
    round: 0,
    line,
    tone: "opening",
    lastAction: "arrival",
  };
}

export function getInterestMeta(interest, status = "active") {
  if (status === "completed") {
    return {
      state: "deal",
      label: "Договорились",
      detail: "Сделка закрыта",
    };
  }

  if (status === "left") {
    return {
      state: "gone",
      label: "Ушёл",
      detail: "Торг сорван",
    };
  }

  const value = clamp(interest, 0, 100);
  if (value >= 76) {
    return {
      state: "focused",
      label: "Спокоен",
      detail: "Можно попросить ещё",
    };
  }
  if (value >= 52) {
    return {
      state: "bargaining",
      label: "Сомневается",
      detail: "Следующий круг уже риск",
    };
  }
  if (value >= 28) {
    return {
      state: "annoyed",
      label: "Недоволен",
      detail: "Лучше закрыть сделку",
    };
  }
  return {
    state: "edge",
    label: "На грани",
    detail: "Может уйти после клика",
  };
}

function getAskTarget(state) {
  const current = Math.max(1, Number(state?.offerTotal) || 1);
  const ceiling = Math.max(current, Number(state?.ceilingTotal) || current);
  const gap = Math.max(0, ceiling - current);
  if (gap <= 0) return current;
  return Math.min(ceiling, current + Math.max(1, Math.ceil(gap * 0.42)));
}

function getPlayerLine(state, buyer) {
  const target = getAskTarget(state);
  const round = Math.max(0, Number(state?.round) || 0);
  const lines = [
    `Партия ровная. Накинь до ${target} — и по рукам.`,
    `Давай чуть честнее: ${target} за всё.`,
    `Ты сам качество видишь. Сделай ${target}.`,
    `Ещё немного — ${target}, и закрываем разговор.`,
  ];
  return lines[(hashText(buyer?.id) + round) % lines.length];
}

export function getLocalTradeChoices({
  buyer,
  trade,
  hasStock,
  reputationReward = 0,
}) {
  if (!buyer || buyer.status !== "active") return [];

  if (!hasStock) {
    return [
      {
        id: "next_buyer",
        tone: "quiet",
        eyebrow: "НЕТ ПАРТИИ",
        text: "Сейчас такого нет. Позову следующего.",
        hint: "Без штрафа",
      },
    ];
  }

  const offer = Math.max(1, Math.round(Number(trade?.offerTotal) || 1));
  const ceiling = Math.max(offer, Math.round(Number(trade?.ceilingTotal) || offer));
  const atCeiling = offer >= ceiling;
  const target = getAskTarget(trade);
  const choices = [];

  if (!atCeiling) {
    choices.push({
      id: "quality",
      tone: "negotiate",
      eyebrow: "ЛЁГКИЙ ТОРГ",
      text: getPlayerLine(trade, buyer),
      hint: `Просишь ${target} · цена растёт, интерес падает`,
    });
  }

  choices.push({
    id: "accept",
    tone: "success",
    eyebrow: atCeiling ? "ЕГО ПОТОЛОК" : "ПРОДАТЬ СЕЙЧАС",
    text: `По рукам. Забирай за ${offer}.`,
    hint: `+${Math.max(0, reputationReward)} REP`,
  });

  return choices;
}

/**
 * В клубе остался один понятный торг. Каждый клик гарантированно повышает
 * цену, пока покупатель не достиг потолка, но с каждым кругом он быстрее
 * теряет интерес. Игрок выбирает: монеты сейчас или репутация за спокойную сделку.
 */
export function resolveLocalTradeTurn({
  buyer,
  trade,
  action,
  request,
  quality,
}) {
  const currentOffer = Math.max(1, Math.round(Number(trade?.offerTotal) || 1));
  const ceilingTotal = Math.max(
    currentOffer,
    Math.round(Number(trade?.ceilingTotal) || currentOffer),
  );
  const round = Math.max(0, Math.floor(Number(trade?.round) || 0));
  const interest = clamp(trade?.interest ?? 94, 0, 100);
  const tolerance = clamp(buyer?.tolerance ?? 0.55, 0.15, 0.98);
  const nextRound = round + 1;
  const gap = Math.max(0, ceilingTotal - currentOffer);
  const playerLine = getPlayerLine(trade, buyer);

  if (gap <= 0) {
    return {
      outcome: "continue",
      playerLine,
      delta: 0,
      trade: {
        ...trade,
        previousOfferTotal: currentOffer,
        lastDelta: 0,
        line: `Выше ${currentOffer} не дам. Это уже мой предел.`,
        tone: "ceiling",
        lastAction: "quality",
      },
    };
  }

  const interestCost = Math.round(
    randomBetween(13, 19) + round * 3.2 + (1 - tolerance) * 6,
  );
  const nextInterest = clamp(interest - interestCost, 0, 100);
  const leaveChance = clamp(
    0.025 +
      round * 0.065 +
      Math.max(0, 48 - nextInterest) * 0.009 +
      (1 - tolerance) * 0.07,
    0.02,
    0.72,
  );

  const voice = getVoice(buyer);
  const contextBase = { buyer, request, quality, offer: currentOffer };

  if (nextInterest <= 3 || Math.random() < leaveChance) {
    const line = pickCycled(
      voice.leaving,
      buyer?.id,
      nextRound,
      1,
    )(getSpeechContext(contextBase));

    return {
      outcome: "left",
      playerLine,
      delta: 0,
      trade: {
        ...trade,
        previousOfferTotal: currentOffer,
        lastDelta: 0,
        interest: 0,
        round: nextRound,
        line,
        tone: "leaving",
        lastAction: "quality",
      },
    };
  }

  const share = randomBetween(0.34, 0.5);
  const delta = Math.max(1, Math.ceil(gap * share));
  const nextOffer = Math.min(ceilingTotal, currentOffer + delta);
  const actualDelta = Math.max(1, nextOffer - currentOffer);
  const reachedCeiling = nextOffer >= ceilingTotal;
  const context = getSpeechContext({
    buyer,
    request,
    quality,
    offer: nextOffer,
  });
  const line = pickCycled(
    voice[reachedCeiling ? "ceiling" : "raise"],
    buyer?.id,
    nextRound,
    1,
  )(context);

  return {
    outcome: "continue",
    playerLine,
    delta: actualDelta,
    trade: {
      ...trade,
      previousOfferTotal: currentOffer,
      offerTotal: nextOffer,
      lastDelta: actualDelta,
      ceilingTotal,
      interest: nextInterest,
      round: nextRound,
      line,
      tone: reachedCeiling ? "ceiling" : "counter",
      lastAction: "quality",
    },
  };
}

export function getWalkAwayReputationLoss({ trade }) {
  const rounds = Math.max(1, Math.floor(Number(trade?.round) || 1));
  return clamp(2 + Math.ceil(rounds * 1.1), 3, 7);
}
