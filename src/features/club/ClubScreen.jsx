import { useEffect, useMemo, useState } from "react";
import { ASSETS } from "../../core/assets/assetCatalog";
import { triggerTelegramNotification, triggerTelegramHaptic } from "../../core/telegram";
import "./ClubScreen.css";
import { HARVEST_QUALITIES } from "../plantation/data/harvestQuality";
import { CROPS } from "../plantation/data/crops";
import { QUALITY_PRICE_MULTIPLIERS, getQualityAmount, removeQualityItems } from "../plantation/data/qualityInventory";
import { getClubLevelInfo, writeClubReputation } from "./clubProgression";
import { createClubLineup } from "./clubBuyers";
import { GAME_ECONOMY } from "../economy/gameEconomy";

const SESSION_KEY = "growapp-club-negotiation-v2";

const PRODUCTS = Object.fromEntries(CROPS.map((crop) => [crop.id, {
  id: crop.id,
  name: crop.name,
  icon: crop.icon,
  image: crop.stages.at(-1)?.image,
  basePrice: crop.basePrice,
  lore: crop.lore,
}]));

function readRep() {
  try { return Math.max(0, Math.floor(Number(localStorage.getItem("growapp-club-reputation")) || 0)); } catch { return 0; }
}

function readSession() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (parsed?.expiresAt > Date.now() && Array.isArray(parsed.buyers)) return parsed;
  } catch {}
  return null;
}

function createSession() {
  return { expiresAt: Date.now() + GAME_ECONOMY.clubBuyerRefreshMs, buyers: createClubLineup(3) };
}

function saveSession(session) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
}

function ProductArt({ product }) {
  if (product.image) return <img src={product.image} alt={product.name} draggable="false" />;
  return <span>{product.icon}</span>;
}

function priceMood(multiplier) {
  if (multiplier <= 0.94) return { label: "Легко согласится", tone: "safe" };
  if (multiplier <= 1.06) return { label: "Честная цена", tone: "fair" };
  if (multiplier <= 1.2) return { label: "Рискованный торг", tone: "risk" };
  return { label: "Почти наглость", tone: "danger" };
}

export default function ClubScreen({ inventory, setInventory, qualityInventory = {}, setQualityInventory, coins, setCoins, onSaleCompleted, onGoBack }) {
  const [reputation, setReputation] = useState(readRep);
  const [session, setSession] = useState(() => {
    const existing = readSession();
    if (existing) return existing;
    const created = createSession();
    saveSession(created);
    return created;
  });
  const [buyerId, setBuyerId] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [amount, setAmount] = useState(1);
  const [askMultiplier, setAskMultiplier] = useState(1.05);
  const [notice, setNotice] = useState("Выбери товар и стол. Покупатель первым назовёт цену — принимать её необязательно.");
  const [dealResult, setDealResult] = useState(null);
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      setClock(now);
      setSession((current) => {
        if (current.expiresAt > now) return current;
        const next = createSession();
        saveSession(next);
        setBuyerId(null);
        setSelectedKey(null);
        setDealResult(null);
        setNotice("В клуб пришли новые лица. Спрос и характер покупателей изменились.");
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const levelInfo = useMemo(() => getClubLevelInfo(reputation), [reputation]);
  const clubPriceBonus = Math.max(0, (levelInfo.currentLevel.level - 1) * 5);
  const clubPriceMultiplier = 1 + clubPriceBonus / 100;

  const stacks = useMemo(() => Object.values(PRODUCTS).flatMap((product) =>
    HARVEST_QUALITIES.map((quality) => ({
      key: `${product.id}:${quality.id}`,
      product,
      quality,
      amount: getQualityAmount(qualityInventory, product.id, quality.id),
      marketPrice: Math.max(1, Math.round(product.basePrice * (QUALITY_PRICE_MULTIPLIERS[quality.id] || 1) * clubPriceMultiplier)),
    })),
  ).filter((stack) => stack.amount > 0), [qualityInventory, clubPriceMultiplier]);

  const selected = stacks.find((stack) => stack.key === selectedKey) || null;
  const buyer = session.buyers.find((entry) => entry.id === buyerId) || null;
  const safeAmount = selected ? Math.min(Math.max(1, amount), selected.amount) : 0;
  const preferenceBonus = buyer && selected
    ? buyer.prefers === selected.product.id ? 1.16 : buyer.prefers ? 0.94 : 1
    : 1;
  const rareBonus = selected?.quality.id === "rare" && buyer?.id === "vespa" ? 1.22 : 1;
  const fairUnit = selected ? Math.max(1, Math.round(selected.marketPrice * preferenceBonus * rareBonus)) : 0;
  const openingUnit = buyer ? Math.max(1, Math.round(fairUnit * buyer.openingFactor)) : 0;
  const askUnit = Math.max(1, Math.round(fairUnit * askMultiplier));
  const mood = priceMood(askMultiplier);
  const feeRate = GAME_ECONOMY.negotiation.clubFeeRate;

  const updateSession = (updater) => {
    setSession((current) => {
      const next = updater(current);
      saveSession(next);
      return next;
    });
  };

  const selectStack = (stack) => {
    setSelectedKey(stack.key);
    setAmount(1);
    setDealResult(null);
    setNotice(stack.product.lore);
  };

  const selectBuyer = (entry) => {
    if (entry.left) return;
    setBuyerId(entry.id);
    setAskMultiplier(1.05);
    setDealResult(null);
    setNotice(entry.line);
  };

  const finishSale = (unitPrice, source) => {
    if (!selected || !buyer || safeAmount <= 0) return;
    const gross = safeAmount * unitPrice;
    const fee = Math.max(1, Math.round(gross * feeRate));
    const payout = Math.max(1, gross - fee);
    const repPerItem = 2 + selected.quality.rank + (source === "counter" ? 1 : 0);
    const gainedRep = safeAmount * repPerItem;

    setQualityInventory?.((previous) => removeQualityItems(previous, selected.product.id, selected.quality.id, safeAmount));
    setInventory((previous) => ({ ...previous, [selected.product.id]: Math.max(0, (previous[selected.product.id] || 0) - safeAmount) }));
    setCoins((previous) => previous + payout);
    const nextRep = writeClubReputation(reputation + gainedRep);
    setReputation(nextRep);
    onSaleCompleted?.({ itemId: selected.product.id, amount: safeAmount, coins: payout, reputation: gainedRep, qualityId: selected.quality.id });
    triggerTelegramNotification("success");
    updateSession((current) => ({
      ...current,
      buyers: current.buyers.map((entry) => entry.id === buyer.id ? { ...entry, left: true } : entry),
    }));
    setDealResult({ type: "success", title: source === "counter" ? "Торг удался" : "Сделка закрыта", text: `На руки ● ${payout}. Комиссия клуба: ${fee}. Репутация: +${gainedRep}.` });
    setSelectedKey(null);
    setBuyerId(null);
    setAmount(1);
  };

  const acceptOpening = () => finishSale(openingUnit, "opening");

  const counterOffer = () => {
    if (!selected || !buyer || buyer.left) return;
    const premium = Math.max(0, askMultiplier - 1);
    const qualityBoost = selected.quality.rank * 0.045;
    const preferenceBoost = buyer.prefers === selected.product.id ? 0.08 : 0;
    const reputationBoost = Math.min(0.12, reputation / 3500);
    const patiencePenalty = (buyer.patience - buyer.patienceLeft) * 0.08;
    const chance = Math.max(0.08, Math.min(0.93, buyer.tolerance + qualityBoost + preferenceBoost + reputationBoost - premium * 1.7 - patiencePenalty));

    triggerTelegramHaptic("medium");
    if (Math.random() <= chance) {
      finishSale(askUnit, "counter");
      return;
    }

    const nextPatience = buyer.patienceLeft - 1;
    if (nextPatience <= 0) {
      const nextRep = writeClubReputation(Math.max(0, reputation - GAME_ECONOMY.negotiation.rejectionReputationLoss));
      setReputation(nextRep);
      updateSession((current) => ({ ...current, buyers: current.buyers.map((entry) => entry.id === buyer.id ? { ...entry, patienceLeft: 0, left: true } : entry) }));
      setDealResult({ type: "fail", title: "Перегнул с ценой", text: `Покупатель ушёл. Урожай остался у тебя, но клуб снял ${GAME_ECONOMY.negotiation.rejectionReputationLoss} REP.` });
      setBuyerId(null);
      return;
    }

    updateSession((current) => ({ ...current, buyers: current.buyers.map((entry) => entry.id === buyer.id ? { ...entry, patienceLeft: nextPatience, openingFactor: Math.min(1.03, entry.openingFactor + 0.04) } : entry) }));
    setAskMultiplier((value) => Math.max(0.9, Number((value - 0.08).toFixed(2))));
    setDealResult({ type: "warn", title: "Не согласен", text: `${buyer.name} поднял своё предложение, но терпения осталось: ${nextPatience}. Можно принять или снизить запрос.` });
  };

  const activeBuyers = session.buyers.filter((entry) => !entry.left);
  const refreshSeconds = Math.max(0, Math.ceil((session.expiresAt - clock) / 1000));
  const refreshMinutes = Math.floor(refreshSeconds / 60);
  const refreshRemainder = String(refreshSeconds % 60).padStart(2, "0");

  return (
    <main className="club-screen">
      <img className="club-npc" src={ASSETS.characters.clubDealer} alt="Хозяин клуба" draggable="false" />
      <div className="club-wallet">● {coins}</div>

      <section className="club-deal-room">
        <header className="club-heading">
          <div><span>GROW STREET · НОЧНОЙ СБЫТ</span><h1>Стол переговоров</h1></div>
          <div className="club-level"><small>НОВЫЕ ЛИЦА {refreshMinutes}:{refreshRemainder}</small><strong>{levelInfo.currentLevel.title}</strong></div>
        </header>

        <div className="club-reputation-line">
          <span>{reputation} REP</span>
          <div><i style={{ width: `${levelInfo.progressPercent}%` }} /></div>
          <b>цены +{clubPriceBonus}%</b>
        </div>

        <section className="club-buyers">
          <div className="club-section-title"><span>1</span><strong>Выбери покупателя</strong><small>{activeBuyers.length} за столами</small></div>
          <div className="club-buyers-grid">
            {session.buyers.map((entry) => (
              <button key={entry.id} type="button" className={`${buyer?.id === entry.id ? "selected" : ""}${entry.left ? " left" : ""}`} onClick={() => selectBuyer(entry)} disabled={entry.left}>
                <span>{entry.left ? "×" : entry.avatar}</span>
                <div><strong>{entry.name}</strong><small>{entry.left ? "ушёл" : entry.role}</small></div>
                {!entry.left && <b>{entry.patienceLeft} ход.</b>}
              </button>
            ))}
          </div>
        </section>

        <section className="club-stock">
          <div className="club-section-title"><span>2</span><strong>Положи товар</strong><small>{stacks.length} партий</small></div>
          <div className="club-stock-grid">
            {stacks.length === 0 ? <div className="club-empty">В рюкзаке нет урожая. Клуб не торгует обещаниями.</div> : stacks.map((stack) => (
              <button key={stack.key} type="button" className={selected?.key === stack.key ? "selected" : ""} onClick={() => selectStack(stack)}>
                <div className="club-stock-art"><ProductArt product={stack.product} /></div>
                <strong>{stack.product.name}</strong>
                <small>{stack.quality.icon} {stack.quality.name}</small>
                <b>{stack.amount} шт.</b>
              </button>
            ))}
          </div>
        </section>

        {buyer && selected ? (
          <section className="club-negotiation">
            <div className="club-negotiation__header">
              <div><span>{buyer.name} предлагает</span><strong>● {openingUnit} <small>за штуку</small></strong></div>
              <div className="club-amount"><button onClick={() => setAmount((value) => Math.max(1, value - 1))}>−</button><strong>{safeAmount}</strong><button onClick={() => setAmount((value) => Math.min(selected.amount, value + 1))}>+</button></div>
            </div>

            <div className="club-ask-row">
              {[0.92, 1.05, 1.16, 1.28, 1.4].map((value) => (
                <button key={value} type="button" className={Math.abs(askMultiplier - value) < .01 ? "active" : ""} onClick={() => setAskMultiplier(value)}>● {Math.round(fairUnit * value)}</button>
              ))}
            </div>
            <div className={`club-risk ${mood.tone}`}><span>{mood.label} · рынок ● {fairUnit}</span><b>Твоя цена: ● {askUnit} × {safeAmount}</b></div>
            <div className="club-deal-actions">
              <button type="button" className="club-accept" onClick={acceptOpening}>Принять ● {Math.max(1, safeAmount * openingUnit - Math.max(1, Math.round(safeAmount * openingUnit * feeRate)))}</button>
              <button type="button" className="club-counter" onClick={counterOffer}>Торговаться</button>
            </div>
          </section>
        ) : <div className="club-notice">{notice}</div>}

        {dealResult && <div className={`club-result ${dealResult.type}`}><strong>{dealResult.title}</strong><p>{dealResult.text}</p><button type="button" onClick={() => setDealResult(null)}>Понятно</button></div>}
      </section>

      <button type="button" className="club-grow-street" onClick={onGoBack}>GROW STREET</button>
    </main>
  );
}
