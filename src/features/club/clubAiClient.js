const DEFAULT_ENDPOINT = "/api/club-dialogue";
const REQUEST_TIMEOUT_MS = 9_000;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function cleanText(value, fallback = "") {
  const text = String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 180) || fallback;
}

function getEndpoint() {
  const configured =
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_CLUB_AI_ENDPOINT : "";
  return cleanText(configured, DEFAULT_ENDPOINT);
}

function getMood(engagement, outcome = "continue") {
  if (outcome === "left") return "leaving";
  if (outcome === "agreed") return "deal";
  if (engagement >= 72) return "engaged";
  if (engagement >= 46) return "thinking";
  if (engagement >= 23) return "irritated";
  return "leaving";
}

function detectCustomIntent(text) {
  const normalized = cleanText(text).toLowerCase();
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

function resolveLocalState(payload) {
  const trade = payload?.trade || {};
  const buyer = payload?.buyer || {};
  const action = normalizeAction(payload?.action, payload?.playerText);
  const marketTotal = Math.max(1, Math.round(Number(trade.marketTotal) || 1));
  const tolerance = clamp(buyer.tolerance ?? 0.58, 0.15, 0.98);
  const currentOffer = clamp(
    Math.round(Number(trade.currentOffer) || Math.round(marketTotal * 0.8)),
    1,
    Math.max(1, Math.round(marketTotal * 1.45)),
  );
  const maximumOffer = clamp(
    Math.round(
      Number(trade.maximumOffer) ||
        marketTotal * (1.02 + tolerance * 0.2 + clamp(trade.qualityRank, 0, 4) * 0.015),
    ),
    currentOffer,
    Math.max(currentOffer, Math.round(marketTotal * 1.35)),
  );
  const round = Math.max(0, Math.floor(Number(trade.round) || 0));
  const engagement = clamp(
    trade.engagement ?? 72 + Math.round(tolerance * 20),
    0,
    100,
  );

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
    Math.round((1 - tolerance) * 5) +
    (atCeiling ? randomInt(5, 10) : 0);
  const nextEngagement = clamp(engagement - irritation, 0, 100);
  const walkOutChance = clamp(
    0.015 +
      nextRound * 0.012 +
      Math.max(0, 36 - nextEngagement) * 0.012 +
      (atCeiling ? 0.08 : 0) +
      (1 - tolerance) * 0.04,
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
  const step = gap > 0 ? Math.max(1, Math.round(gap * (0.14 + Math.random() * 0.2))) : 0;
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

function buildLocalLine(payload, state) {
  const buyer = payload?.buyer || {};
  const request = payload?.request || {};
  const trade = payload?.trade || {};
  const action = normalizeAction(payload?.action, payload?.playerText);
  const amount = Math.max(1, Number(request.amount) || 1);
  const crop = cleanText(request.cropName, "товар");
  const quality = cleanText(request.qualityName, "обычного качества").toLowerCase();
  const offer = state.offerTotal;

  if (state.outcome === "left") {
    const lines = [
      "Не, всё. Ты цену уже перегрел. Я пошёл.",
      "Хватит. Мы не сойдёмся — поищу в другом месте.",
      "Нет, братуха. Ещё круг — и это уже не сделка. Я ухожу.",
    ];
    return lines[randomInt(0, lines.length - 1)];
  }

  if (state.outcome === "agreed") {
    const lines = [
      `Ладно, ${offer} монет. По рукам.`,
      `Договорились: ${offer}. Передавай партию.`,
      `Всё, сошлись на ${offer}. Забираю.`,
    ];
    return lines[randomInt(0, lines.length - 1)];
  }

  if (action === "arrival") {
    return `${buyer.line || "Слушай внимательно."} Нужны ${amount} шт. ${crop}, ${quality} или выше. Даю ${offer} монет.`;
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

function buildLocalChoices(state) {
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

  if (state.outcome === "left") return [];

  return [
    {
      id: "bargain",
      tone: state.atCeiling ? "danger" : "raise",
      text: state.atCeiling
        ? "Да ладно, накинь ещё хоть немного."
        : "Давай выше. Качество того стоит.",
    },
    {
      id: "accept",
      tone: "success",
      text: `Ладно, за ${state.offerTotal} — по рукам.`,
    },
    {
      id: "leave",
      tone: "quiet",
      text: "Не сойдёмся. Следующий клиент.",
    },
  ];
}

export function createLocalClubDialogue(payload) {
  const state = resolveLocalState(payload);
  return {
    ok: true,
    source: "local",
    buyerLine: buildLocalLine(payload, state),
    choices: buildLocalChoices(state),
    state,
  };
}

function sanitizeChoice(choice, fallback) {
  const allowedIds = new Set(["bargain", "accept", "leave", "confirm_sale"]);
  const id = allowedIds.has(choice?.id) ? choice.id : fallback.id;
  return {
    id,
    tone: cleanText(choice?.tone, fallback.tone).slice(0, 20),
    text: cleanText(choice?.text, fallback.text),
  };
}

function sanitizeResponse(data, fallback) {
  if (!data || typeof data !== "object" || !data.state) return fallback;

  const state = {
    outcome: ["continue", "agreed", "left"].includes(data.state.outcome)
      ? data.state.outcome
      : fallback.state.outcome,
    offerTotal: Math.max(1, Math.round(Number(data.state.offerTotal) || fallback.state.offerTotal)),
    engagement: clamp(data.state.engagement, 0, 100),
    round: Math.max(0, Math.floor(Number(data.state.round) || 0)),
    mood: ["engaged", "thinking", "irritated", "leaving", "deal"].includes(
      data.state.mood,
    )
      ? data.state.mood
      : fallback.state.mood,
    atCeiling: Boolean(data.state.atCeiling),
  };

  const fallbackChoices = buildLocalChoices(state);
  const receivedChoices = Array.isArray(data.choices) ? data.choices : [];
  const choices = fallbackChoices.map((choice, index) =>
    sanitizeChoice(receivedChoices[index], choice),
  );

  return {
    ok: true,
    source: data.source === "openai" ? "openai" : "server-fallback",
    buyerLine: cleanText(data.buyerLine, fallback.buyerLine),
    choices,
    state,
  };
}

export async function requestClubDialogue(payload, { signal } = {}) {
  const fallback = createLocalClubDialogue(payload);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const abortFromParent = () => controller.abort();
  signal?.addEventListener?.("abort", abortFromParent, { once: true });

  try {
    const response = await fetch(getEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error(`Club AI request failed: ${response.status}`);
    }

    const data = await response.json();
    return sanitizeResponse(data, fallback);
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.warn("Club AI fallback enabled:", error);
    }
    return fallback;
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener?.("abort", abortFromParent);
  }
}
