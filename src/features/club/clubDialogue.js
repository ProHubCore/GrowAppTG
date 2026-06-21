export const CLUB_DIALOGUE_STAGES = {
  GREETING: "greeting",
  OFFER: "offer",
  COUNTER: "counter",
  LAST_OFFER: "last_offer",
  AGREEMENT: "agreement",
};

const BUYER_TONES = {
  tipusian: "street",
  margo: "smooth",
  rax: "direct",
  vespa: "refined",
  "uncle-bit": "street",
  luna: "smooth",
  broker: "cold",
  oracle: "mystic",
  "kira-volt": "direct",
  nox: "calm",
  "madam-flux": "refined",
  bongo: "street",
  pix: "smooth",
  "quiet-tai": "cold",
};

const SPEECH = {
  street: {
    offer: ({ quality, crop, amount, total }) =>
      `Угу. ${quality} ${crop}, ${amount} штуки. Дам ${total} монет, братуха.`,
    counter: ({ total }) =>
      `Ладно, могу докинуть. ${total} — и без долгих песен.`,
    last: ({ total }) =>
      `Всё, край — ${total}. Ещё даванёшь, я встану и уйду.`,
    accepted: ({ total }) =>
      `Уговорил. ${total} монет. Давай по рукам.`,
    left: () => `Не-не, всё. Ты уже перегибаешь. Я пошёл.`,
  },
  smooth: {
    offer: ({ quality, crop, amount, total }) =>
      `${quality} ${crop}, ${amount} шт. Симпатично. Предложу ${total} монет.`,
    counter: ({ total }) =>
      `Ты умеешь уговаривать. Хорошо, ${total}, но я уже сомневаюсь.`,
    last: ({ total }) =>
      `${total} — последняя цифра. Ещё шаг, и я передумаю.`,
    accepted: ({ total }) =>
      `Ладно, убедил. Беру за ${total}.`,
    left: () => `Нет, настроение прошло. Оставь партию себе.`,
  },
  direct: {
    offer: ({ quality, crop, amount, total }) =>
      `${quality} ${crop}, ${amount} штуки. Даю ${total}.`,
    counter: ({ total }) => `Подниму до ${total}. Дальше уже лишнее.`,
    last: ({ total }) => `${total} — финал. Решай сейчас.`,
    accepted: ({ total }) => `Аргумент принят. ${total}. По рукам.`,
    left: () => `Нет. Время вышло. Я ухожу.`,
  },
  refined: {
    offer: ({ quality, crop, amount, total }) =>
      `${quality} ${crop}, ${amount} шт. Моя оценка — ${total} монет.`,
    counter: ({ total }) =>
      `Аргумент неплох. Подниму до ${total}, но терпение не бесконечное.`,
    last: ({ total }) =>
      `${total} — окончательная оценка. Не разрушай хорошую сделку.`,
    accepted: ({ total }) => `Хорошо. ${total} монет — достойный компромисс.`,
    left: () => `На этом всё. Торг потерял всякий вкус.`,
  },
  cold: {
    offer: ({ quality, crop, amount, total }) =>
      `${quality} ${crop}. ${amount} единицы. Цена: ${total}.`,
    counter: ({ total }) => `Корректирую до ${total}. Маржа почти исчезла.`,
    last: ({ total }) => `Финальное значение: ${total}.`,
    accepted: ({ total }) => `Условия пересчитаны. ${total}. Согласен.`,
    left: () => `Сделка более невыгодна. Разговор завершён.`,
  },
  mystic: {
    offer: ({ quality, crop, amount, total }) =>
      `${quality} ${crop}, ${amount} шт. Сегодня их число — ${total}.`,
    counter: ({ total }) => `Монеты качнулись в твою сторону. Теперь ${total}.`,
    last: ({ total }) => `${total} — последняя цифра этой встречи.`,
    accepted: ({ total }) => `Знак сошёлся на ${total}. Сделка верная.`,
    left: () => `Знак погас. Нам не суждено договориться сегодня.`,
  },
  calm: {
    offer: ({ quality, crop, amount, total }) =>
      `${quality} ${crop}, ${amount} шт. За всё дам ${total} монет.`,
    counter: ({ total }) => `Ладно, немного подвинусь: ${total}.`,
    last: ({ total }) => `Остановимся на ${total}. Иначе разойдёмся.`,
    accepted: ({ total }) => `Хорошо, убедил. Беру за ${total}.`,
    left: () => `Нет, дальше торговаться не хочу. Удачи.`,
  },
};

function lowerFirst(value = "") {
  return value ? `${value.slice(0, 1).toLowerCase()}${value.slice(1)}` : "товар";
}

function getTone(buyer) {
  return SPEECH[BUYER_TONES[buyer?.id] || "calm"] || SPEECH.calm;
}

function getSpeechContext(stack, quote) {
  return {
    quality: stack?.quality?.name || "Хороший",
    crop: stack?.crop?.name || "товар",
    amount: quote?.amount || 1,
    total: quote?.total || 0,
  };
}

export function createDialogueEntry(speaker, text, tone = "neutral") {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    speaker,
    text,
    tone,
  };
}

export function appendDialogue(conversation = [], ...entries) {
  return [...(Array.isArray(conversation) ? conversation : []), ...entries]
    .filter((entry) => entry?.text)
    .slice(-8);
}

export function getPlayerProductLine({ stack, amount }) {
  const crop = stack?.crop?.name || "товар";
  const quality = lowerFirst(stack?.quality?.name || "хорошего качества");
  return `Вот, смотри: ${crop}, ${quality}. Есть ровно ${amount} шт.`;
}

export function getBuyerOfferLine({ buyer, stack, quote }) {
  return getTone(buyer).offer(getSpeechContext(stack, quote));
}

export function getBuyerNegotiationLine({ buyer, stack, quote, result }) {
  const tone = getTone(buyer);
  const context = getSpeechContext(stack, quote);

  if (result?.type === "accepted") return tone.accepted(context);
  if (result?.type === "left") return tone.left(context);
  if (result?.patienceLeft <= 1) return tone.last(context);
  return tone.counter(context);
}

export function getBuyerMood(buyer) {
  if (!buyer || buyer.status !== "active") {
    return { state: "gone", label: "Разговор окончен", hint: "Место скоро освободится" };
  }

  const stage = buyer.dialogueStage || CLUB_DIALOGUE_STAGES.GREETING;
  if (stage === CLUB_DIALOGUE_STAGES.AGREEMENT) {
    return {
      state: "ready",
      label: "Уже тянется за монетами",
      hint: "Осталось закрепить сделку",
    };
  }

  const maximum = Math.max(1, Number(buyer.patience) || 1);
  const current = Math.max(0, Number(buyer.patienceLeft) || 0);
  const ratio = current / maximum;

  if (stage === CLUB_DIALOGUE_STAGES.LAST_OFFER || ratio <= 0.34) {
    return {
      state: "tense",
      label: "Уже привстал со стула",
      hint: "Следующий нажим может сорвать сделку",
    };
  }

  if (ratio <= 0.66) {
    return {
      state: "wary",
      label: "Крутит монету в пальцах",
      hint: "Начинает уставать от торга",
    };
  }

  return {
    state: "calm",
    label: "Слушает спокойно",
    hint: "Пока готов обсуждать цену",
  };
}

export function getClubDialogueChoices({ buyer, quote, hasEnough }) {
  if (!buyer || buyer.status !== "active" || !hasEnough) return [];
  const stage = buyer.dialogueStage || CLUB_DIALOGUE_STAGES.GREETING;

  if (stage === CLUB_DIALOGUE_STAGES.GREETING) return [];

  if (stage === CLUB_DIALOGUE_STAGES.AGREEMENT) {
    return [
      {
        id: "confirm_sale",
        tone: "success",
        text: "Вот и договорились. Забирай.",
      },
      {
        id: "walk_away",
        tone: "quiet",
        text: "Стоп. Всё-таки придержу товар.",
      },
    ];
  }

  return [
    {
      id: "soft_push",
      tone: "soft",
      text: `Слушай, качество сам видишь. Накинь хотя бы до ${quote?.softAskTotal || quote?.askTotal || "чуть выше"}.`,
    },
    {
      id: "hard_push",
      tone: "bold",
      text: `Не, за ${quote?.total || "столько"} не отдам. Давай ${quote?.hardAskTotal || quote?.askTotal || "нормальную цену"}.`,
    },
    {
      id: "accept_offer",
      tone: "success",
      text: `Ладно, по рукам за ${quote?.total || "эту сумму"}.`,
    },
  ];
}
