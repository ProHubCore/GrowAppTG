import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import usePersistentState from "../../core/hooks/usePersistentState";
import {
  triggerTelegramHaptic,
  triggerTelegramNotification,
} from "../../core/telegram";
import { CROPS, CROP_BY_ID } from "../plantation/data/crops";
import { HARVEST_QUALITIES } from "../plantation/data/harvestQuality";
import { removeQualityItems } from "../plantation/data/qualityInventory";
import {
  CLUB_LEVELS,
  getClubLevelInfo,
  getClubPriceBonusPercent,
  getClubSeatCount,
  readClubReputation,
  writeClubReputation,
} from "./clubProgression";
import {
  CLUB_MARKET_STORAGE_KEY,
  createClubSession,
  getClubTradeQuote,
  getClubUnlockSignature,
  getMatchingStacks,
  getSaleReputation,
  normalizeClubSession,
  replaceReadyClubBuyers,
  scheduleBuyerReplacement,
} from "./clubMarket";
import {
  createInitialLocalTrade,
  getInterestMeta,
  getLocalTradeChoices,
  getWalkAwayReputationLoss,
  resolveLocalTradeTurn,
} from "./clubLocalTrade";
import { formatCompactNumber } from "../support/storePackages";
import "./ClubScreen.css";

const MAX_CLUB_SEATS = 3;
const RESPONSE_DELAY_MS = 520;

function formatCountdown(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0
    ? `${minutes}:${String(rest).padStart(2, "0")}`
    : `${rest} сек`;
}

function CurrencyIcon({ premium = false }) {
  return (
    <span
      className={`club-currency-icon${premium ? " premium" : ""}`}
      aria-hidden="true"
    />
  );
}

function BuyerPortrait({ buyer, large = false }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [buyer?.portrait]);

  const hasImage = Boolean(buyer?.portrait && !imageFailed);

  return (
    <span
      className={`club-buyer-portrait accent-${buyer?.accent || "cyan"}${
        large ? " large" : ""
      }${hasImage ? " has-image" : ""}`}
    >
      {hasImage ? (
        <img
          src={buyer.portrait}
          alt={buyer.name}
          draggable="false"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span>{buyer?.shortName || buyer?.name?.slice(0, 1) || "?"}</span>
      )}
    </span>
  );
}

function isCatalogCropUnlocked(plantCatalog, cropId) {
  const record = plantCatalog?.[cropId];
  if (!record) return false;

  const bestQualityRank = Number(record.bestQualityRank);
  return Boolean(
    (Number(record.totalHarvested) || 0) > 0 ||
      (Number.isFinite(bestQualityRank) && bestQualityRank >= 0) ||
      Object.keys(record.qualities || {}).length > 0,
  );
}

function getSeatStatus(buyer, clock) {
  if (!buyer) return null;
  if (buyer.status === "active") return "У стола";
  const timeLeft = Math.max(0, (buyer.replaceAt || clock) - clock);
  return `Новый через ${formatCountdown(timeLeft)}`;
}

function getNextActiveBuyer(buyers, excludedId) {
  return buyers.find(
    (buyer) => buyer.status === "active" && buyer.id !== excludedId,
  );
}

function getTradeFromBuyer(buyer, fallbackOffer = 1) {
  return {
    offerTotal: Math.max(
      1,
      Math.round(Number(buyer?.tradeOfferTotal) || fallbackOffer || 1),
    ),
    previousOfferTotal: Math.max(
      1,
      Math.round(
        Number(buyer?.tradePreviousOfferTotal) ||
          Number(buyer?.tradeOfferTotal) ||
          fallbackOffer ||
          1,
      ),
    ),
    lastDelta: Math.max(0, Math.round(Number(buyer?.tradeLastDelta) || 0)),
    ceilingTotal: Math.max(
      1,
      Math.round(
        Number(buyer?.tradeCeilingTotal) ||
          Number(buyer?.tradeOfferTotal) ||
          fallbackOffer ||
          1,
      ),
    ),
    interest: Math.max(0, Math.min(100, Number(buyer?.tradeInterest) || 82)),
    round: Math.max(0, Math.floor(Number(buyer?.tradeRound) || 0)),
    line: buyer?.tradeLine || buyer?.line || "Что предложишь?",
    tone: buyer?.tradeTone || "opening",
    lastAction: buyer?.lastTradeAction || "arrival",
  };
}

export default function ClubScreen({
  setInventory,
  qualityInventory = {},
  setQualityInventory,
  plantCatalog = {},
  coins,
  setCoins,
  premiumCoins = 0,
  onOpenCoinBank,
  onOpenPremiumStore,
  onSaleCompleted,
  dailyOrder = null,
  onGoBack,
}) {
  const [reputation, setReputation] = useState(readClubReputation);
  const levelInfo = useMemo(() => getClubLevelInfo(reputation), [reputation]);
  const clubLevel = levelInfo.currentLevel.level;
  const seatCount = getClubSeatCount(reputation);
  const priceBonus = getClubPriceBonusPercent(reputation);

  const unlockedCropIds = useMemo(
    () =>
      CROPS.filter((crop) =>
        isCatalogCropUnlocked(plantCatalog, crop.id),
      ).map((crop) => crop.id),
    [plantCatalog],
  );
  const unlockSignature = useMemo(
    () => getClubUnlockSignature(unlockedCropIds),
    [unlockedCropIds],
  );

  const [session, setSession] = usePersistentState(
    CLUB_MARKET_STORAGE_KEY,
    () =>
      createClubSession({
        seatCount,
        qualityInventory,
        unlockedCropIds,
        clubLevel,
      }),
    { migrate: normalizeClubSession },
  );
  const [clock, setClock] = useState(Date.now);
  const [selectedBuyerId, setSelectedBuyerId] = useState(null);
  const [showReputation, setShowReputation] = useState(false);
  const [rewardToast, setRewardToast] = useState(null);
  const [respondingBuyerId, setRespondingBuyerId] = useState(null);
  const responseTimerRef = useRef(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(
    () => () => {
      if (responseTimerRef.current) window.clearTimeout(responseTimerRef.current);
    },
    [],
  );

  const updateBuyer = useCallback(
    (buyerId, updater) => {
      setSession((previous) => ({
        ...previous,
        buyers: (previous?.buyers || []).map((buyer) =>
          buyer.id === buyerId ? updater(buyer) : buyer,
        ),
      }));
    },
    [setSession],
  );

  useEffect(() => {
    const wrongSeatCount = session?.seatCount !== seatCount;
    const wrongUnlocks = session?.unlockSignature !== unlockSignature;
    const wrongClubLevel = session?.clubLevel !== clubLevel;
    const asksLockedCrop = (session?.buyers || []).some(
      (buyer) =>
        buyer?.request?.cropId &&
        !unlockedCropIds.includes(buyer.request.cropId),
    );

    if (!session || wrongSeatCount || wrongUnlocks || wrongClubLevel || asksLockedCrop) {
      const previousBuyerIds = session?.buyers?.map((buyer) => buyer.id) || [];
      const nextSession = createClubSession({
        seatCount,
        qualityInventory,
        unlockedCropIds,
        previousBuyerIds,
        clubLevel,
      });
      setSession(nextSession);
      setSelectedBuyerId(nextSession.buyers[0]?.id || null);
      return;
    }

    const nextSession = replaceReadyClubBuyers(session, {
      qualityInventory,
      unlockedCropIds,
      clubLevel,
      now: clock,
    });

    if (nextSession !== session) {
      setSession(nextSession);
      triggerTelegramHaptic("light");
    }
  }, [
    clock,
    clubLevel,
    qualityInventory,
    seatCount,
    session,
    setSession,
    unlockSignature,
    unlockedCropIds,
  ]);

  const buyers = session?.buyers || [];
  const activeBuyers = buyers.filter((buyer) => buyer.status === "active");
  const selectedBuyer =
    buyers.find((buyer) => buyer.id === selectedBuyerId) ||
    activeBuyers[0] ||
    buyers[0] ||
    null;

  useEffect(() => {
    if (!buyers.some((buyer) => buyer.id === selectedBuyerId)) {
      setSelectedBuyerId(activeBuyers[0]?.id || buyers[0]?.id || null);
    }
  }, [activeBuyers, buyers, selectedBuyerId]);

  const minimumQuality =
    HARVEST_QUALITIES[selectedBuyer?.request?.minQualityRank || 0] ||
    HARVEST_QUALITIES[0];
  const matchingStacks = useMemo(
    () => getMatchingStacks(qualityInventory, selectedBuyer?.request),
    [qualityInventory, selectedBuyer?.request],
  );
  const selectedStack = useMemo(() => {
    const requestedAmount = selectedBuyer?.request?.amount || 0;
    return (
      matchingStacks.find((stack) => stack.amount >= requestedAmount) || null
    );
  }, [matchingStacks, selectedBuyer?.request?.amount]);
  const hasStock = Boolean(selectedStack);
  const quoteStack =
    selectedStack ||
    (selectedBuyer?.request
      ? {
          crop: CROP_BY_ID[selectedBuyer.request.cropId],
          quality: minimumQuality,
        }
      : null);
  const quote = getClubTradeQuote({
    buyer: selectedBuyer,
    stack: quoteStack,
    reputation,
  });
  const trade = getTradeFromBuyer(selectedBuyer, quote?.total || 1);
  const interestMeta = getInterestMeta(trade.interest, selectedBuyer?.status);
  const isResponding = respondingBuyerId === selectedBuyer?.id;

  useEffect(() => {
    if (
      !selectedBuyer ||
      selectedBuyer.status !== "active" ||
      selectedBuyer.tradeInitialized ||
      !selectedBuyer.request ||
      !quote
    ) {
      return;
    }

    const initialTrade = createInitialLocalTrade({
      buyer: selectedBuyer,
      request: selectedBuyer.request,
      quality: selectedStack?.quality || minimumQuality,
      quote,
      priceBonus,
    });

    updateBuyer(selectedBuyer.id, (buyer) => ({
      ...buyer,
      tradeInitialized: true,
      tradeLine: initialTrade.line,
      tradeOfferTotal: initialTrade.offerTotal,
      tradePreviousOfferTotal: initialTrade.previousOfferTotal,
      tradeLastDelta: initialTrade.lastDelta,
      tradeCeilingTotal: initialTrade.ceilingTotal,
      tradeInterest: initialTrade.interest,
      tradeRound: initialTrade.round,
      tradeTone: initialTrade.tone,
      lastTradeAction: initialTrade.lastAction,
    }));
  }, [
    minimumQuality,
    priceBonus,
    quote,
    selectedBuyer,
    selectedStack,
    updateBuyer,
  ]);

  const selectBuyer = (buyer) => {
    if (!buyer) return;
    if (responseTimerRef.current) window.clearTimeout(responseTimerRef.current);
    setRespondingBuyerId(null);
    setSelectedBuyerId(buyer.id);
    triggerTelegramHaptic("light");
  };

  const changeReputation = (nextValue) => {
    const next = writeClubReputation(nextValue);
    setReputation(next);
    return next;
  };

  const moveToAnotherBuyer = (excludedId) => {
    const nextBuyer = getNextActiveBuyer(buyers, excludedId);
    if (nextBuyer) setSelectedBuyerId(nextBuyer.id);
  };

  const finishWithoutSale = (playerLine = "Не сойдёмся. Давай следующего.") => {
    if (!selectedBuyer || selectedBuyer.status !== "active") return;
    const buyerId = selectedBuyer.id;
    const buyerLine = hasStock
      ? "Ладно, не сойдёмся. Поищу в другом месте."
      : "Понял. Тогда не задерживаю — спрошу у других.";

    updateBuyer(buyerId, (buyer) =>
      scheduleBuyerReplacement(
        {
          ...buyer,
          status: "left",
          tradeLine: buyerLine,
          tradeInterest: 0,
          tradeTone: "leaving",
          lastPlayerLine: playerLine,
        },
        "skipped",
      ),
    );
    triggerTelegramHaptic("light");
    window.setTimeout(() => moveToAnotherBuyer(buyerId), 240);
  };

  const handleSale = (playerLine) => {
    if (
      !selectedBuyer ||
      selectedBuyer.status !== "active" ||
      !selectedStack ||
      !hasStock ||
      !unlockedCropIds.includes(selectedStack.crop.id)
    ) {
      return;
    }

    const amount = selectedBuyer.request.amount;
    const total = trade.offerTotal;
    const gainedReputation = getSaleReputation({
      buyer: selectedBuyer,
      stack: selectedStack,
      negotiationCount: selectedBuyer.negotiationCount || trade.round,
    });
    const buyerId = selectedBuyer.id;

    setQualityInventory?.((previous) =>
      removeQualityItems(
        previous,
        selectedStack.crop.id,
        selectedStack.quality.id,
        amount,
      ),
    );
    setInventory?.((previous) => ({
      ...previous,
      [selectedStack.crop.id]: Math.max(
        0,
        (previous?.[selectedStack.crop.id] || 0) - amount,
      ),
    }));
    setCoins?.((previous) => previous + total);
    changeReputation(reputation + gainedReputation);

    updateBuyer(buyerId, (buyer) =>
      scheduleBuyerReplacement(
        {
          ...buyer,
          status: "completed",
          earnedCoins: total,
          earnedReputation: gainedReputation,
          tradeLine: buyer.dealLine || "По рукам. Забираю партию.",
          tradeInterest: 100,
          tradeTone: "deal",
          lastPlayerLine: playerLine,
        },
        "completed",
      ),
    );

    onSaleCompleted?.({
      itemId: selectedStack.crop.id,
      amount,
      coins: total,
      reputation: gainedReputation,
      qualityId: selectedStack.quality.id,
      buyerId,
    });

    triggerTelegramNotification("success");
    setRewardToast({ coins: total, reputation: gainedReputation });
    window.setTimeout(() => setRewardToast(null), 1900);
    window.setTimeout(() => moveToAnotherBuyer(buyerId), 340);
  };

  const negotiate = (action, playerLine) => {
    if (
      !selectedBuyer ||
      selectedBuyer.status !== "active" ||
      !hasStock ||
      isResponding
    ) {
      return;
    }

    const buyerId = selectedBuyer.id;
    const arrivedAt = selectedBuyer.arrivedAt;
    const result = resolveLocalTradeTurn({
      buyer: selectedBuyer,
      trade,
      action,
      request: selectedBuyer.request,
      quality: selectedStack?.quality || minimumQuality,
    });
    const reputationLoss =
      result.outcome === "left"
        ? getWalkAwayReputationLoss({ trade: result.trade, action })
        : 0;

    setRespondingBuyerId(buyerId);
    triggerTelegramHaptic("light");
    updateBuyer(buyerId, (buyer) => ({
      ...buyer,
      lastPlayerLine: playerLine || result.playerLine,
    }));

    responseTimerRef.current = window.setTimeout(() => {
      if (result.outcome === "left") {
        updateBuyer(buyerId, (buyer) => {
          if (buyer.arrivedAt !== arrivedAt) return buyer;
          return scheduleBuyerReplacement(
            {
              ...buyer,
              status: "left",
              tradeLine: result.trade.line,
              tradeOfferTotal: result.trade.offerTotal,
              tradePreviousOfferTotal: result.trade.previousOfferTotal,
              tradeLastDelta: result.trade.lastDelta,
              tradeCeilingTotal: result.trade.ceilingTotal,
              tradeInterest: 0,
              tradeRound: result.trade.round,
              tradeTone: "leaving",
              lastTradeAction: action,
              earnedReputation: -reputationLoss,
              negotiationCount: (buyer.negotiationCount || 0) + 1,
            },
            "rejected",
          );
        });
        if (reputationLoss > 0) {
          changeReputation(readClubReputation() - reputationLoss);
          setRewardToast({
            coins: 0,
            reputation: -reputationLoss,
            type: "loss",
          });
          window.setTimeout(() => setRewardToast(null), 1900);
        }
        triggerTelegramNotification("warning");
        window.setTimeout(() => moveToAnotherBuyer(buyerId), 520);
      } else {
        updateBuyer(buyerId, (buyer) => {
          if (buyer.arrivedAt !== arrivedAt || buyer.status !== "active") {
            return buyer;
          }
          return {
            ...buyer,
            tradeLine: result.trade.line,
            tradeOfferTotal: result.trade.offerTotal,
            tradePreviousOfferTotal: result.trade.previousOfferTotal,
            tradeLastDelta: result.trade.lastDelta,
            tradeCeilingTotal: result.trade.ceilingTotal,
            tradeInterest: result.trade.interest,
            tradeRound: result.trade.round,
            tradeTone: result.trade.tone,
            lastTradeAction: action,
            negotiationCount: (buyer.negotiationCount || 0) + 1,
          };
        });
      }
      setRespondingBuyerId((value) => (value === buyerId ? null : value));
    }, RESPONSE_DELAY_MS);
  };

  const projectedReputation = useMemo(
    () =>
      hasStock && selectedBuyer && selectedStack
        ? getSaleReputation({
            buyer: selectedBuyer,
            stack: selectedStack,
            negotiationCount: selectedBuyer.negotiationCount || trade.round,
          })
        : 0,
    [hasStock, selectedBuyer, selectedStack, trade.round],
  );

  const visibleChoices = useMemo(
    () =>
      getLocalTradeChoices({
        buyer: selectedBuyer,
        trade,
        hasStock,
        reputationReward: projectedReputation,
      }),
    [hasStock, projectedReputation, selectedBuyer, trade],
  );

  const handleReply = (choice) => {
    if (!choice || isResponding) return;
    if (choice.id === "next_buyer") {
      finishWithoutSale(choice.text);
      return;
    }
    if (choice.id === "accept") {
      handleSale(choice.text);
      return;
    }
    if (choice.id === "quality") {
      negotiate("quality", choice.text);
    }
  };

  const buyerLine = selectedBuyer
    ? trade.line
    : "Собери первый урожай — после этого здесь появятся покупатели.";
  const dailyOrderPercent = dailyOrder
    ? Math.min(100, Math.round(((dailyOrder.progress || 0) / Math.max(1, dailyOrder.amount || 1)) * 100))
    : 0;

  return (
    <div className={`club-screen${rewardToast ? " sale-success" : ""}`}>
      <div className="club-ambient" aria-hidden="true"><i /><i /><i /></div>

      <div className="club-hud">
        <button
          type="button"
          className="club-wallet club-wallet-premium"
          onClick={onOpenPremiumStore}
          aria-label={`Монеты роста: ${premiumCoins}`}
        >
          <CurrencyIcon premium />
          <strong>{formatCompactNumber(premiumCoins)}</strong>
        </button>

        <button
          type="button"
          className="club-reputation-button"
          onClick={() => setShowReputation(true)}
          aria-label={`Уровень клуба ${clubLevel}. Репутация ${reputation}`}
        >
          <span className="club-reputation-button__level">LVL {clubLevel}</span>
          <span className="club-reputation-button__copy">
            <strong>{levelInfo.currentLevel.title}</strong>
            <i><b style={{ width: `${levelInfo.progressPercent}%` }} /></i>
          </span>
          <span className="club-reputation-button__value">{reputation}</span>
        </button>

        <button
          type="button"
          className="club-wallet club-wallet-coins"
          onClick={onOpenCoinBank}
          aria-label={`Монеты: ${coins}`}
        >
          <CurrencyIcon />
          <strong>{formatCompactNumber(coins)}</strong>
        </button>
      </div>



      <main className="club-scroll-area">
        <nav className="club-seat-rail" aria-label="Покупатели клуба">
          {Array.from({ length: MAX_CLUB_SEATS }).map((_, index) => {
            const buyer = buyers[index];
            const unlocked = index < seatCount;

            if (!unlocked) {
              const requiredLevel = index === 1 ? 2 : 4;
              return (
                <div className="club-seat-card locked" key={`locked-${index}`}>
                  <span className="club-seat-lock">⌾</span>
                  <span className="club-seat-copy">
                    <strong>Место {index + 1}</strong>
                    <small>Откроется на LVL {requiredLevel}</small>
                  </span>
                </div>
              );
            }

            if (!buyer) {
              return (
                <div className="club-seat-card waiting" key={`waiting-${index}`}>
                  <span className="club-seat-loader" />
                  <span className="club-seat-copy">
                    <strong>Стол свободен</strong>
                    <small>Покупатель уже идёт</small>
                  </span>
                </div>
              );
            }

            return (
              <button
                type="button"
                key={`${buyer.id}-${buyer.arrivedAt || 0}`}
                className={`club-seat-card status-${buyer.status}${
                  selectedBuyer?.id === buyer.id ? " selected" : ""
                }`}
                onClick={() => selectBuyer(buyer)}
              >
                <BuyerPortrait buyer={buyer} />
                <span className="club-seat-copy">
                  <strong>{buyer.name}</strong>
                  <small>{getSeatStatus(buyer, clock)}</small>
                </span>
              </button>
            );
          })}
        </nav>

        {selectedBuyer ? (
          <section
            key={`${selectedBuyer.id}-${selectedBuyer.arrivedAt || 0}`}
            className={`club-deal status-${selectedBuyer.status} mood-${interestMeta.state}`}
          >
            <div className="club-character-stage">
              <div className="club-character-card">
                <BuyerPortrait buyer={selectedBuyer} large />
                <div className="club-customer-name">
                  <strong>{selectedBuyer.name}</strong>
                  <span>{selectedBuyer.role}</span>
                </div>
              </div>

              <div className="club-conversation-thread">
                <div className="club-conversation-label">
                  <small>ПОКУПАТЕЛЬ</small>
                  <strong>{selectedBuyer.name}</strong>
                </div>
                <div className={`club-chat-bubble buyer tone-${trade.tone}`} aria-live="polite">
                  <p key={`${selectedBuyer.id}-${trade.round}-${buyerLine}`}>{buyerLine}</p>
                  {isResponding && (
                    <span className="club-thinking" aria-label="Покупатель думает"><i /><i /><i /></span>
                  )}
                </div>
                {selectedBuyer.lastPlayerLine && (
                  <div className="club-last-reply" aria-live="polite">
                    <small>ТЫ</small>
                    <span>{selectedBuyer.lastPlayerLine}</span>
                  </div>
                )}
              </div>
            </div>

            <section className={`club-trade-card state-${interestMeta.state}`} aria-label="Сделка">
              <div className="club-trade-card__order">
                <span className="club-order-icon" aria-hidden="true">{selectedBuyer.request?.cropIcon || "✦"}</span>
                <div>
                  <small>ПОКУПАТЕЛЮ НУЖНО</small>
                  <strong>{selectedBuyer.request?.amount || 0}× {selectedBuyer.request?.cropName || "Урожай"}</strong>
                  <em>{minimumQuality.name}+</em>
                </div>
                <b className={hasStock ? "ready" : "missing"}>
                  {hasStock ? `ЕСТЬ ×${selectedStack.amount}` : "НЕ ХВАТАЕТ"}
                </b>
              </div>

              <div className="club-trade-card__price">
                <small>ТЕКУЩАЯ ЦЕНА</small>
                <strong key={trade.offerTotal}><CurrencyIcon />{trade.offerTotal}</strong>
                {trade.lastDelta > 0 && <b className="club-price-delta">+{trade.lastDelta}</b>}
                <span>за всю партию</span>
              </div>

              <div className="club-trade-card__interest">
                <span>
                  <small>ИНТЕРЕС ПОКУПАТЕЛЯ</small>
                  <strong>{interestMeta.label}</strong>
                </span>
                <i><b style={{ width: `${Math.max(0, trade.interest)}%` }} /></i>
                <em>{hasStock ? `Продажа сейчас: +${projectedReputation} REP` : "Собери нужную партию"}</em>
              </div>
            </section>

            {selectedBuyer.status === "active" ? (
              <div className="club-trade-actions" aria-label="Действия сделки">
                {hasStock ? (
                  <>
                    {visibleChoices.map((choice) => {
                      if (choice.id === "quality") {
                        return (
                          <button
                            type="button"
                            key={choice.id}
                            className="club-trade-action club-trade-action--bargain"
                            onClick={() => handleReply(choice)}
                            disabled={isResponding}
                          >
                            <span className="club-trade-action__icon" aria-hidden="true">↗</span>
                            <span className="club-trade-action__copy">
                              <small>ТОРГ</small>
                              <strong>Попросить больше</strong>
                              <em>{choice.hint || "Цена выше, но покупатель может уйти"}</em>
                            </span>
                            <i aria-hidden="true">›</i>
                          </button>
                        );
                      }

                      if (choice.id === "accept") {
                        return (
                          <button
                            type="button"
                            key={choice.id}
                            className="club-trade-action club-trade-action--sell"
                            onClick={() => handleReply(choice)}
                            disabled={isResponding}
                          >
                            <span className="club-trade-action__icon" aria-hidden="true"><CurrencyIcon /></span>
                            <span className="club-trade-action__copy">
                              <small>ПРОДАТЬ СЕЙЧАС</small>
                              <strong>{trade.offerTotal} монет</strong>
                              <em>Без риска · +{projectedReputation} REP</em>
                            </span>
                            <i aria-hidden="true">›</i>
                          </button>
                        );
                      }

                      return null;
                    })}

                    <button
                      type="button"
                      className="club-decline-deal"
                      onClick={() => finishWithoutSale()}
                      disabled={isResponding}
                    >
                      Отказаться и позвать следующего
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="club-trade-action club-trade-action--next"
                    onClick={() => finishWithoutSale("Нужной партии сейчас нет.")}
                    disabled={isResponding}
                  >
                    <span className="club-trade-action__icon" aria-hidden="true">→</span>
                    <span className="club-trade-action__copy">
                      <small>ТОВАРА НЕ ХВАТАЕТ</small>
                      <strong>Позвать следующего</strong>
                      <em>Покупатель уйдёт без штрафа</em>
                    </span>
                    <i aria-hidden="true">›</i>
                  </button>
                )}
              </div>
            ) : (
              <div className={`club-result-card ${selectedBuyer.status}`}>
                <strong>{selectedBuyer.status === "completed" ? "Сделка закрыта" : "Покупатель ушёл"}</strong>
                <span>
                  {selectedBuyer.status === "completed"
                    ? `+${selectedBuyer.earnedCoins} монет · +${selectedBuyer.earnedReputation} REP`
                    : `${selectedBuyer.earnedReputation || 0} REP · ${getSeatStatus(selectedBuyer, clock)}`}
                </span>
              </div>
            )}
          </section>
        ) : (
          <section className="club-deal empty">
            <div className="club-no-crops">
              <span>◇</span>
              <strong>Сбыт пока закрыт</strong>
              <p>Собери первый урожай, чтобы к столу пришли покупатели.</p>
            </div>
          </section>
        )}
      </main>

      <button className="club-exit-button" type="button" onClick={onGoBack}>
        <span>Вернуться на район</span><i aria-hidden="true">→</i>
      </button>

      {rewardToast && (
        <div className={`club-reward-toast ${rewardToast.type === "loss" ? "loss" : "success"}`} role="status">
          <span>{rewardToast.type === "loss" ? "СДЕЛКА СОРВАНА" : "ПРОДАНО"}</span>
          {rewardToast.coins > 0 && <strong>+{rewardToast.coins} монет</strong>}
          <small>{rewardToast.reputation > 0 ? "+" : ""}{rewardToast.reputation} REP</small>
        </div>
      )}

      {showReputation && (
        <div
          className="club-reputation-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowReputation(false);
          }}
        >
          <section className="club-reputation-modal" role="dialog" aria-modal="true" aria-labelledby="club-reputation-title">
            <header>
              <div>
                <span>ПУТЬ ПОСТАВЩИКА</span>
                <h2 id="club-reputation-title">Уровни клуба</h2>
              </div>
              <button type="button" onClick={() => setShowReputation(false)}>×</button>
            </header>

            <div className="club-reputation-summary">
              <span className="club-reputation-level">LVL {clubLevel}</span>
              <div>
                <strong>{levelInfo.currentLevel.title}</strong>
                <small>{reputation} REP</small>
              </div>
              <i><b style={{ width: `${levelInfo.progressPercent}%` }} /></i>
              <p>
                {levelInfo.nextLevel
                  ? `Ещё ${Math.max(0, levelInfo.nextLevel.required - reputation)} REP до следующей награды`
                  : "Максимальный уровень клуба достигнут"}
              </p>
            </div>

            <div className="club-level-road">
              {CLUB_LEVELS.map((level, index) => {
                const unlocked = reputation >= level.required;
                const current = level.level === clubLevel;
                return (
                  <article key={level.level} className={`${unlocked ? "unlocked" : "locked"}${current ? " current" : ""}`}>
                    <div className="club-level-node">
                      <span>{unlocked ? "✓" : level.level}</span>
                      {index < CLUB_LEVELS.length - 1 && <i />}
                    </div>
                    <div className="club-level-card">
                      <header>
                        <span>LVL {level.level}</span>
                        <b>{level.required} REP</b>
                      </header>
                      <strong>{level.title}</strong>
                      <p>{level.reward}</p>
                      <div className="club-level-unlocks">
                        {(level.unlocks || []).map((unlock) => <span key={unlock}>{unlock}</span>)}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <button type="button" className="club-reputation-close" onClick={() => setShowReputation(false)}>
              Вернуться к сделке
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
