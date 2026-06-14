import { useMemo, useRef, useState } from "react";
import "./ClubScreen.css";
import { HARVEST_QUALITIES } from "../data/harvestQuality";
import { QUALITY_PRICE_MULTIPLIERS, getQualityAmount, removeQualityItems } from "../data/qualityInventory";

const REPUTATION_STORAGE_KEY = "growapp-club-reputation";

const PRODUCTS = {
  greenTomato: { id: "greenTomato", name: "Кислоплод", icon: "🟢", basePrice: 4, lore: "Бодрящий плод для коктейлей и ночных смен." },
  lumenweed: { id: "lumenweed", name: "Люмен-трава", icon: "🪻", image: "/assets/plants/psychomor/psychomor-stage-3.png", basePrice: 10, lore: "Светящаяся трава для клубных смесей и кальянов." },
  moonmint: { id: "moonmint", name: "Лунная мята", icon: "🌿", basePrice: 8, lore: "Охлаждает голову и делает музыку глубже." },
  velvetbud: { id: "velvetbud", name: "Бархатный бутон", icon: "🌺", basePrice: 15, lore: "Мягкий ароматный товар для спокойных заведений." },
  psychoshroom: { id: "psychoshroom", name: "Психомор", icon: "🍄", basePrice: 24, lore: "Грибная культура для тех, кто хочет увидеть музыку." },
  bluecap: { id: "bluecap", name: "Синий колпак", icon: "🔵", basePrice: 34, lore: "Закрытый клубный гриб для опытных покупателей." },
  starleaf: { id: "starleaf", name: "Звёздный лист", icon: "✨", basePrice: 18, lore: "Искристая зелень для шумных залов." },
  emberpod: { id: "emberpod", name: "Жар-стручок", icon: "🔥", basePrice: 26, lore: "Горячий плод для крепких напитков." },
  dreamcap: { id: "dreamcap", name: "Сонный колпак", icon: "🌙", basePrice: 30, lore: "Мягкий гриб для тихих комнат." },
  ghostmorel: { id: "ghostmorel", name: "Призрачный сморчок", icon: "👻", basePrice: 48, lore: "Тайный гриб для особых покупателей." },
};

const LEVELS = [
  { level: 1, required: 0, title: "Новый поставщик" },
  { level: 2, required: 50, title: "Свой человек" },
  { level: 3, required: 150, title: "Надёжный поставщик" },
  { level: 4, required: 300, title: "Звезда клуба" },
  { level: 5, required: 600, title: "Легенда района" },
];

function readRep() {
  try { return Math.max(0, Math.floor(Number(localStorage.getItem(REPUTATION_STORAGE_KEY)) || 0)); } catch { return 0; }
}

function getLevelInfo(rep) {
  let current = LEVELS[0];
  for (const level of LEVELS) if (rep >= level.required) current = level;
  const index = LEVELS.findIndex((level) => level.level === current.level);
  const next = LEVELS[index + 1] || null;
  const percent = next ? Math.min(100, ((rep - current.required) / (next.required - current.required)) * 100) : 100;
  return { current, next, percent };
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
  const levelInfo = useMemo(() => getLevelInfo(reputation), [reputation]);

  const stacks = useMemo(() => Object.values(PRODUCTS).flatMap((product) =>
    HARVEST_QUALITIES.map((quality) => ({
      key: `${product.id}:${quality.id}`,
      product,
      quality,
      amount: getQualityAmount(qualityInventory, product.id, quality.id),
      price: Math.max(1, Math.round(product.basePrice * (QUALITY_PRICE_MULTIPLIERS[quality.id] || 1))),
    }))
  ).filter((stack) => stack.amount > 0), [qualityInventory]);

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
    setNotice(`Типусиан забрал ${safeAmount} шт. Ты получил ${total} монет и ${gainedRep} репутации клуба.`);
    setSelectedKey(null);
    setAmount(1);
  };

  return (
    <div className="club-screen">
      <img className="club-npc club-npc-smoker" src="/assets/club/club-dealer.png" alt="Типусиан" draggable="false" onError={(event) => { event.currentTarget.style.display = "none"; }} />
      <button className="club-back-hitbox" type="button" onClick={onGoBack} aria-label="Назад" />
      <div className="club-wallet">🪙 {coins}</div>

      <section className="club-board">
        <header className="club-board-header">
          <div>
            <span>КЛУБНЫЙ СБЫТ</span>
            <h1>Свежий спрос</h1>
          </div>
          <div className="club-level-badge">LVL {levelInfo.current.level}</div>
        </header>

        <div className="club-rep-compact">
          <div className="club-rep-copy">
            <strong>Репутация клуба</strong>
            <small>{levelInfo.current.title} · {reputation} REP</small>
          </div>
          <div className="club-rep-track"><div style={{ width: `${levelInfo.percent}%` }} /></div>
          <span>{levelInfo.next ? `${levelInfo.next.required - reputation} до уровня` : "MAX"}</span>
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

        {import.meta.env.DEV && <button type="button" className="club-dev-rep" onClick={() => saveRep(reputation + 25)}>DEV · +25 REP клуба</button>}
      </section>
    </div>
  );
}
