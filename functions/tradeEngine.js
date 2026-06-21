"use strict";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function cleanText(value, fallback = "", maxLength = 180) {
  const text = String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (text || fallback).slice(0, maxLength);
}

function detectCustomIntent(text) {
  const normalized = cleanText(text, "", 160).toLowerCase();
  if (/по рукам|согласен|забирай|ладно[, ]+бери|договорились/.test(normalized)) {
    return "accept";
  }
  if (/уходи|следующ|не продам|не договор|отмена|проваливай/.test(normalized)) {
    return "leave";
  }
  return "bargain";
}

function normalizeAction(action, playerText) {
  if (action === "custom") return detectCustomIntent(playerText);
  if (["arrival", "bargain", "accept", "leave"].includes(action)) return action;
  return "bargain";
}

function getMood(engagement, outcome = "continue") {
  if (outcome === "left") return "leaving";
  if (outcome === "agreed") return "deal";
  if (engagement >= 72) return "engaged";
  if (engagement >= 46) return "thinking";
  if (engagement >= 23) return "irritated";
  return "leaving";
}

function normalizePayload(raw = {}) {
  const buyer = raw.buyer && typeof raw.buyer === "object" ? raw.buyer : {};
  const request = raw.request && typeof raw.request === "object" ? raw.request : {};
  const trade = raw.trade && typeof raw.trade === "object" ? raw.trade : {};
  const playerText = cleanText(raw.playerText, "", 160);
  const action = normalizeAction(raw.action, playerText);
  const marketTotal = clamp(Math.round(trade.marketTotal || 1), 1, 1_000_000);
  const tolerance = clamp(buyer.tolerance ?? 0.55, 0.15, 0.98);
  const currentOffer = clamp(
    Math.round(trade.currentOffer || Math.round(marketTotal * 0.8)),
    1,
    Math.max(1, Math.round(marketTotal * 1.45)),
  );
  const maximumOffer = clamp(
    Math.round(
      trade.maximumOffer ||
        marketTotal *
          (1.02 +
            tolerance * 0.2 +
            clamp(trade.qualityRank, 0, 4) * 0.015),
    ),
    currentOffer,
    Math.max(currentOffer, Math.round(marketTotal * 1.35)),
  );

  return {
    action,
    originalAction: cleanText(raw.action, "bargain", 20),
    playerText,
    buyer: {
      id: cleanText(buyer.id, "buyer", 48),
      name: cleanText(buyer.name, "Покупатель", 48),
      role: cleanText(buyer.role, "Гость клуба", 48),
      line: cleanText(buyer.line, "Есть что показать?", 120),
      dealLine: cleanText(buyer.dealLine, "По рукам.", 100),
      rejectLine: cleanText(buyer.rejectLine, "Не перегибай.", 100),
      tolerance,
      patience: clamp(Math.floor(buyer.patience || 2), 1, 8),
      accent: cleanText(buyer.accent, "cyan", 20),
    },
    request: {
      cropId: cleanText(request.cropId, "crop", 48),
      cropName: cleanText(request.cropName, "товар", 48),
      amount: clamp(Math.floor(request.amount || 1), 1, 99),
      qualityName: cleanText(request.qualityName, "обычное", 48),
      minQualityRank: clamp(Math.floor(request.minQualityRank || 0), 0, 4),
    },
    trade: {
      hasStock: Boolean(trade.hasStock),
      qualityRank: clamp(Math.floor(trade.qualityRank || 0), 0, 4),
      currentOffer,
      marketTotal,
      maximumOffer,
      engagement: clamp(trade.engagement ?? 82, 0, 100),
      round: clamp(Math.floor(trade.round || 0), 0, 100),
      reputation: clamp(Math.floor(trade.reputation || 0), 0, 1_000_000),
      priceBonus: clamp(Math.floor(trade.priceBonus || 0), 0, 100),
    },
  };
}

function resolveTradeTurn(payload) {
  const { action, buyer, trade } = payload;
  const {
    currentOffer,
    marketTotal,
    maximumOffer,
    engagement,
    round,
  } = trade;

  if (action === "arrival") {
    return {
      outcome: "continue",
      offerTotal: currentOffer,
      engagement,
      round,
      mood: getMood(engagement),
      atCeiling: currentOffer >= maximumOffer,
    };
  }

  if (action === "accept") {
    return {
      outcome: "agreed",
      offerTotal: currentOffer,
      engagement: Math.max(engagement, 55),
      round,
      mood: "deal",
      atCeiling: currentOffer >= maximumOffer,
    };
  }

  if (action === "leave") {
    return {
      outcome: "left",
      offerTotal: currentOffer,
      engagement: 0,
      round,
      mood: "leaving",
      atCeiling: currentOffer >= maximumOffer,
    };
  }

  const nextRound = round + 1;
  const atCeiling = currentOffer >= maximumOffer;
  const irritation =
    randomInt(4, 9) +
    Math.floor(nextRound * 0.8) +
    Math.round((1 - buyer.tolerance) * 5) +
    (atCeiling ? randomInt(5, 10) : 0);
  const nextEngagement = clamp(engagement - irritation, 0, 100);
  const walkOutChance = clamp(
    0.015 +
      nextRound * 0.012 +
      Math.max(0, 36 - nextEngagement) * 0.012 +
      (atCeiling ? 0.08 : 0) +
      (1 - buyer.tolerance) * 0.04,
    0.015,
    0.72,
  );

  if (nextEngagement <= 6 || Math.random() < walkOutChance) {
    return {
      outcome: "left",
      offerTotal: currentOffer,
      engagement: 0,
      round: nextRound,
      mood: "leaving",
      atCeiling,
    };
  }

  const gap = Math.max(0, maximumOffer - currentOffer);
  const step =
    gap > 0 ? Math.max(1, Math.round(gap * (0.14 + Math.random() * 0.2))) : 0;
  const offerTotal = Math.min(maximumOffer, currentOffer + step);

  return {
    outcome: "continue",
    offerTotal,
    engagement: nextEngagement,
    round: nextRound,
    mood: getMood(nextEngagement),
    atCeiling: offerTotal >= maximumOffer,
  };
}

function buildFallbackLine(payload, state) {
  const { action, buyer, request } = payload;
  const offer = state.offerTotal;

  if (state.outcome === "left") {
    const lines = [
      "Не, всё. Ты цену уже перегрел. Я пошёл.",
      "Хватит. Мы не сойдёмся — поищу в другом месте.",
      "Нет, братуха. Ещё круг — и это уже не сделка. Я ухожу.",
      `${buyer.rejectLine} Всё, разговор закончен.`,
    ];
    return lines[randomInt(0, lines.length - 1)];
  }

  if (state.outcome === "agreed") {
    const lines = [
      `Ладно, ${offer} монет. По рукам.`,
      `Договорились: ${offer}. Передавай партию.`,
      `Всё, сошлись на ${offer}. Забираю.`,
      `${buyer.dealLine} Цена — ${offer}.`,
    ];
    return lines[randomInt(0, lines.length - 1)];
  }

  if (action === "arrival") {
    return `${buyer.line} Мне нужны ${request.amount} шт. ${request.cropName}, ${request.qualityName.toLowerCase()} или выше. За всё дам ${offer} монет.`;
  }

  if (state.atCeiling) {
    return `${offer} — мой потолок. Выше уже не пойду.`;
  }

  const lines = [
    `Ладно, немного накину. ${offer} монет — что скажешь?`,
    `Уговорил на шаг. Сейчас дам ${offer}, но не разгоняйся.`,
    `Хорошо говоришь. Подниму до ${offer} монет.`,
    `Пусть будет ${offer}. Дальше уже начинаю сомневаться.`,
  ];
  return lines[randomInt(0, lines.length - 1)];
}

function buildFallbackPhrases(payload, state) {
  const offer = state.offerTotal;
  const buyerLine = buildFallbackLine(payload, state);
  return {
    buyerLine,
    bargainReply: state.atCeiling
      ? "Да ладно, накинь ещё хоть немного."
      : "Давай выше. Качество того стоит.",
    acceptReply: `Ладно, за ${offer} — по рукам.`,
    leaveReply: "Не сойдёмся. Следующий клиент.",
  };
}

function sanitizeGeneratedPhrases(value, fallback, payload, state) {
  const phrases = {
    buyerLine: cleanText(value?.buyerLine, fallback.buyerLine, 180),
    bargainReply: cleanText(value?.bargainReply, fallback.bargainReply, 110),
    acceptReply: cleanText(value?.acceptReply, fallback.acceptReply, 110),
    leaveReply: cleanText(value?.leaveReply, fallback.leaveReply, 110),
  };

  if (state.outcome !== "left" && !phrases.buyerLine.includes(String(state.offerTotal))) {
    phrases.buyerLine = cleanText(
      `${phrases.buyerLine} Цена — ${state.offerTotal} монет.`,
      fallback.buyerLine,
      180,
    );
  }

  if (payload.action === "arrival") {
    const hasCrop = phrases.buyerLine
      .toLowerCase()
      .includes(payload.request.cropName.toLowerCase());
    if (!hasCrop) {
      phrases.buyerLine = cleanText(
        `${phrases.buyerLine} Нужны ${payload.request.amount} шт. ${payload.request.cropName}.`,
        fallback.buyerLine,
        180,
      );
    }
  }

  return phrases;
}

function buildChoices(state, phrases) {
  if (state.outcome === "left") return [];
  if (state.outcome === "agreed") {
    return [
      {
        id: "confirm_sale",
        tone: "success",
        text: "По рукам. Забирай товар.",
      },
      {
        id: "leave",
        tone: "quiet",
        text: "Стоп. Я передумал.",
      },
    ];
  }

  return [
    {
      id: "bargain",
      tone: state.atCeiling ? "danger" : "raise",
      text: phrases.bargainReply,
    },
    {
      id: "accept",
      tone: "success",
      text: phrases.acceptReply,
    },
    {
      id: "leave",
      tone: "quiet",
      text: phrases.leaveReply,
    },
  ];
}

function createResponse(payload, state, phrases, source) {
  const sanitized = sanitizeGeneratedPhrases(
    phrases,
    buildFallbackPhrases(payload, state),
    payload,
    state,
  );
  return {
    ok: true,
    source,
    buyerLine: sanitized.buyerLine,
    choices: buildChoices(state, sanitized),
    state,
  };
}

module.exports = {
  cleanText,
  normalizePayload,
  resolveTradeTurn,
  buildFallbackPhrases,
  createResponse,
};
