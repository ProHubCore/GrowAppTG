"use strict";

const assert = require("node:assert/strict");
const {
  normalizePayload,
  resolveTradeTurn,
  buildFallbackPhrases,
  createResponse,
} = require("./tradeEngine");

const base = normalizePayload({
  action: "arrival",
  buyer: {
    id: "margo",
    name: "Марго Ноль",
    role: "Бармен",
    tolerance: 0.62,
    line: "Нужна партия на ночь.",
  },
  request: {
    cropId: "tabakko",
    cropName: "Табакко",
    amount: 2,
    qualityName: "Хорошее",
  },
  trade: {
    currentOffer: 26,
    marketTotal: 32,
    maximumOffer: 38,
    engagement: 84,
    round: 0,
  },
});

const arrival = resolveTradeTurn(base);
assert.equal(arrival.outcome, "continue");
assert.equal(arrival.offerTotal, 26);

const fallback = buildFallbackPhrases(base, arrival);
const response = createResponse(base, arrival, fallback, "server-fallback");
assert.equal(response.state.offerTotal, 26);
assert.equal(response.choices.length, 3);
assert.match(response.buyerLine, /26/);
assert.match(response.buyerLine.toLowerCase(), /табакко/);

const acceptedPayload = normalizePayload({
  ...base,
  action: "custom",
  playerText: "Ладно, по рукам, забирай",
  buyer: base.buyer,
  request: base.request,
  trade: base.trade,
});
const accepted = resolveTradeTurn(acceptedPayload);
assert.equal(accepted.outcome, "agreed");

for (let index = 0; index < 100; index += 1) {
  const bargainPayload = normalizePayload({
    ...base,
    action: "bargain",
    buyer: base.buyer,
    request: base.request,
    trade: {
      ...base.trade,
      currentOffer: 26,
      engagement: 90,
      round: index % 5,
    },
  });
  const turn = resolveTradeTurn(bargainPayload);
  assert.ok(turn.offerTotal >= 26);
  assert.ok(turn.offerTotal <= 38);
  assert.ok(turn.engagement >= 0 && turn.engagement <= 100);
}

console.log("Club AI trade engine tests passed.");
