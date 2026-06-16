import { ASSETS } from "../../core/assets/assetCatalog";
import { triggerTelegramNotification } from "../../core/telegram";
import { useMemo, useRef, useState } from "react";
import "./ClubScreen.css";
import { HARVEST_QUALITIES } from "../plantation/data/harvestQuality";
import { CROPS } from "../plantation/data/crops";
import { QUALITY_PRICE_MULTIPLIERS, getQualityAmount, removeQualityItems } from "../plantation/data/qualityInventory";
import { getClubLevelInfo } from "./clubProgression";

const REPUTATION_STORAGE_KEY = "growapp-club-reputation";

const PRODUCTS = Object.fromEntries(
  CROPS.map((crop) => [
    crop.id,
    {
      id: crop.id,
      name: crop.name,
      icon: crop.icon,
      image: crop.stages.at(-1)?.image,
      basePrice: crop.basePrice,
      lore: crop.lore,
    },
  ]),
);


function readRep() {
  try { return Math.max(0, Math.floor(Number(localStorage.getItem(REPUTATION_STORAGE_KEY)) || 0)); } catch { return 0; }
}


function ProductArt({ product }) {
  if (product.image) return <img src={product.image} alt={product.name} draggable="false" />;
  return <span>{product.icon}</span>;
}

export default function ClubScreen({ inventory, setInventory, qualityInventory = {}, setQualityInventory, coins, setCoins, onSaleCompleted, onGoBack }) {
  const stripRef = useRef(null);
  const [reputation, setReputation] = useState(readRep);
  const [selectedKey, setSelectedKey] = useState(null);
  const [amount, setAmount] = useState(1);
  const [notice, setNotice] = useState("Сегодня клуб берёт свежий товар. Чем выше качество — тем выше цена и уважение.");
  const levelInfo = useMemo(() => getClubLevelInfo(reputation), [reputation]);
  const clubPriceBonus = Math.max(0, (levelInfo.currentLevel.level - 1) * 5);
  const clubPriceMultiplier = 1 + clubPriceBonus / 100;

  const stacks = useMemo(() => Object.values(PRODUCTS).flatMap((product) =>
    HARVEST_QUALITIES.map((quality) => ({
      key: `${product.id}:${quality.id}`,
      product,
      quality,
      amount: getQualityAmount(qualityInventory, product.id, quality.id),
      price: Math.max(1, Math.round(product.basePrice * (QUALITY_PRICE_MULTIPLIERS[quality.id] || 1) * clubPriceMultiplier)),
    }))
  ).filter((stack) => stack.amount > 0), [qualityInventory, clubPriceMultiplier]);

  const selected = stacks.find((stack) => stack.key === selectedKey) || stacks[0] || null;
  const safeAmount = selected ? Math.min(Math.max(1, amount), selected.amount) : 0;
  const repPerItem = selected ? 2 + (selected.quality.rank || 0) : 0;
  const total = selected ? safeAmount * selected.price : 0;


  const scrollStock = (direction) => {
    stripRef.current?.scrollBy({
      left: direction * Math.max(220, stripRef.current.clientWidth * 0.72),
      behavior: "smooth",
    });
  };

  const handleStockWheel = (event) => {
    if (!stripRef.current || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    stripRef.current.scrollLeft += event.deltaY;
  };

  const saveRep = (value) => {
    const next = Math.max(0, Math.floor(value));
    setReputation(next);
    try { localStorage.setItem(REPUTATION_STORAGE_KEY, String(next)); } catch {}
    window.dispatchEvent(new CustomEvent("growapp-club-reputation-change", { detail: { reputation: next } }));
  };

  const choose = (stack) => {
    setSelectedKey(stack.key);
    setAmount(1);
    setNotice(stack.product.lore);
  };

  const sell = () => {
    if (!selected || safeAmount <= 0) return;
    setQualityInventory?.((previous) => removeQualityItems(previous, selected.product.id, selected.quality.id, safeAmount));
    setInventory((previous) => ({ ...previous, [selected.product.id]: Math.max(0, (previous[selected.product.id] || 0) - safeAmount) }));
    setCoins((previous) => previous + total);
    const gainedRep = safeAmount * repPerItem;
    saveRep(reputation + gainedRep);
    onSaleCompleted?.({ itemId: selected.product.id, amount: safeAmount, coins: total, reputation: gainedRep, qualityId: selected.quality.id });
    triggerTelegramNotification("success");
    setNotice(`Типусиан забрал ${safeAmount} шт. Ты получил ${total} монет и ${gainedRep} репутации клуба.`);
    setSelectedKey(null);
    setAmount(1);
  };

  return (
    <div className="club-screen">
      <img className="club-npc club-npc-smoker" src={ASSETS.characters.clubDealer} alt="Типусиан" draggable="false" onError={(event) => { event.currentTarget.style.display = "none"; }} />
      <button className="club-back-hitbox" type="button" onClick={onGoBack} aria-label="Назад" />
      <div className="club-wallet">🪙 {coins}</div>

      <section className="club-board">
        <header className="club-board-header">
          <div>
            <span>КЛУБНЫЙ СБЫТ</span>
            <h1>Свежий спрос</h1>
          </div>
          <div className="club-level-badge">LVL {levelInfo.currentLevel.level}</div>
        </header>

        <div className="club-rep-compact">
          <div className="club-rep-copy">
            <strong>Репутация клуба</strong>
            <small>{levelInfo.currentLevel.title} · {reputation} REP · цены +{clubPriceBonus}%</small>
          </div>
          <div className="club-rep-track"><div style={{ width: `${levelInfo.progressPercent}%` }} /></div>
          <span>{levelInfo.nextLevel ? `${levelInfo.nextLevel.required - reputation} до уровня` : "MAX"}</span>
        </div>

        <div className="club-lore-note">
          <strong>Типусиан:</strong> «Мы не спрашиваем, кто ты и с какой планеты. Главное — чтобы товар был свежий.»
        </div>

        <div className="club-strip-shell">
          <button type="button" className="club-strip-arrow left" onClick={() => scrollStock(-1)} disabled={stacks.length <= 2} aria-label="Предыдущие товары">‹</button>
          <div className="club-stock-strip" ref={stripRef} onWheel={handleStockWheel}>
            {stacks.length === 0 ? (
              <div className="club-empty">В рюкзаке пока нечего продавать. Вырасти урожай и возвращайся.</div>
            ) : stacks.map((stack) => (
              <button type="button" key={stack.key} className={`club-stock-card${selected?.key === stack.key ? " selected" : ""}`} onClick={() => choose(stack)}>
                <div className="club-stock-art"><ProductArt product={stack.product} /></div>
                <strong>{stack.product.name}</strong>
                <small>{stack.quality.icon} {stack.quality.name}</small>
                <div><span>{stack.amount} шт.</span><b>🪙 {stack.price}</b></div>
              </button>
            ))}
          </div>
          <button type="button" className="club-strip-arrow right" onClick={() => scrollStock(1)} disabled={stacks.length <= 2} aria-label="Следующие товары">›</button>
        </div>

        {selected && (
          <article className="club-sale-box">
            <div className="club-sale-top">
              <div className="club-sale-art"><ProductArt product={selected.product} /></div>
              <div>
                <span>{selected.quality.icon} {selected.quality.name}</span>
                <h2>{selected.product.name}</h2>
                <p>{notice}</p>
              </div>
            </div>
            <div className="club-sale-controls">
              <div className="club-stepper">
                <button type="button" onClick={() => setAmount((value) => Math.max(1, value - 1))}>−</button>
                <strong>{safeAmount}</strong>
                <button type="button" onClick={() => setAmount((value) => Math.min(selected.amount, value + 1))}>+</button>
              </div>
              <div className="club-sale-result"><span>Получишь</span><strong>🪙 {total} · +{safeAmount * repPerItem} REP</strong></div>
              <button type="button" className="club-sell-button" onClick={sell}>Продать клубу</button>
            </div>
          </article>
        )}

        {!selected && stacks.length > 0 && <div className="club-notice">{notice}</div>}

      </section>
    </div>
  );
}
