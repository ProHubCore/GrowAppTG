import { useMemo, useRef, useState } from "react";

import { ASSETS } from "../../core/assets/assetCatalog";
import { MARIA_TRUST_LEVELS, getMariaTrustInfo } from "./mariaProgression";
import "./MariaHouseScreen.css";

const QUESTS = [
  {
    id: "maria-first-delivery",
    title: "Первый заказ",
    label: "Дело Марии Ивановны",
    description: "Району нужны свежие Кислоплоды. Принеси Марии Ивановне три штуки.",
    icon: "🟢",
    previousQuestId: null,
    objective: { type: "deliver", itemId: "greenTomato", amount: 3 },
    reward: { coins: 300, trust: 25 },
  },
  {
    id: "maria-club-request",
    title: "Просьба клуба",
    label: "Связь с клубом",
    description: "Продай клубу пять Кислоплодов. Мария Ивановна проверит, умеешь ли ты работать на район.",
    icon: "♣",
    previousQuestId: "maria-first-delivery",
    objective: { type: "club-sale", itemId: "greenTomato", amount: 5 },
    reward: { coins: 350, trust: 30 },
  },
  {
    id: "maria-dark-seed",
    title: "Новая поставка",
    label: "Дело магазина",
    description: "Купи хотя бы одно семя Табакко. У Зорика появилась свежая поставка.",
    icon: "🌿",
    previousQuestId: "maria-club-request",
    objective: { type: "own-seed", itemId: "tabakko", amount: 1 },
    reward: { coins: 200, trust: 20 },
  },
  {
    id: "maria-strange-harvest",
    title: "Ароматный урожай",
    label: "Особое дело",
    description: "Вырасти Табакко и передай один лист Марии Ивановне. Покупатель уже ждёт.",
    icon: "◉",
    previousQuestId: "maria-dark-seed",
    objective: { type: "deliver", itemId: "tabakko", amount: 1 },
    reward: { coins: 700, trust: 35 },
  },
  {
    id: "maria-club-status",
    title: "Свой среди своих",
    label: "Клубная проверка",
    description: "Заработай 50 репутации клуба и докажи, что район начал тебя принимать.",
    icon: "★",
    previousQuestId: "maria-strange-harvest",
    objective: { type: "club-reputation", amount: 50 },
    reward: { coins: 1000, trust: 50 },
  },
  {
    id: "maria-quality-harvest",
    title: "Не просто урожай",
    label: "Мастерство выращивания",
    description: "Получи Кислоплод качеством не ниже хорошего.",
    icon: "◆",
    previousQuestId: "maria-club-status",
    objective: { type: "quality-rank", itemId: "greenTomato", rank: 1, amount: 1 },
    reward: { coins: 500, trust: 20 },
  },
  {
    id: "maria-nutrition-care",
    title: "Рука садовода",
    label: "Испытание Марии Ивановны",
    description: "Используй питательный раствор во время роста.",
    icon: "🌿",
    previousQuestId: "maria-quality-harvest",
    objective: { type: "care-use", careType: "nutrition", amount: 1 },
    reward: { coins: 450, trust: 20 },
  },
  {
    id: "maria-rare-discovery",
    title: "Знак редкости",
    label: "Финал главы",
    description: "Открой редкое качество любой культуры.",
    icon: "✹",
    previousQuestId: "maria-nutrition-care",
    objective: { type: "rare-discovery", amount: 1 },
    reward: { coins: 1200, trust: 40 },
  },
];

function getQuestProgress(quest, inventory, seedInventory, clubReputation, questState, plantCatalog) {
  const objective = quest.objective;
  if (objective.type === "deliver") return inventory?.[objective.itemId] || 0;
  if (objective.type === "club-sale") return questState?.clubSales?.[objective.itemId] || 0;
  if (objective.type === "own-seed") return seedInventory?.[objective.itemId] || 0;
  if (objective.type === "club-reputation") return clubReputation || 0;
  if (objective.type === "quality-rank") {
    return (plantCatalog?.[objective.itemId]?.bestQualityRank ?? -1) >= objective.rank ? 1 : 0;
  }
  if (objective.type === "care-use") return questState?.careUses?.[objective.careType] || 0;
  if (objective.type === "rare-discovery") {
    return Object.values(plantCatalog || {}).some((record) => (record?.qualities?.rare || 0) > 0) ? 1 : 0;
  }
  return 0;
}

export default function MariaHouseScreen({
  onBack,
  inventory,
  seedInventory,
  clubReputation = 0,
  onDeliverItems,
  onRewardClaimed,
  questState,
  plantCatalog,
  onQuestStateChange,
}) {
  const completedQuestIds = Array.isArray(questState?.completedQuestIds)
    ? questState.completedQuestIds
    : [];
  const trust = Math.max(0, Number(questState?.trust) || 0);
  const trustInfo = getMariaTrustInfo(trust);
  const [panel, setPanel] = useState(null);
  const [section, setSection] = useState("active");
  const [cardIndex, setCardIndex] = useState(0);
  const [message, setMessage] = useState("На доске — дела района. Подойди, ученик, разберёмся по порядку.");
  const [rewardPopup, setRewardPopup] = useState(null);
  const touchStartY = useRef(null);
  const isDev = import.meta.env.DEV;

  const activeQuests = useMemo(
    () => QUESTS.filter((quest) => !completedQuestIds.includes(quest.id)),
    [completedQuestIds],
  );
  const archivedQuests = useMemo(
    () => QUESTS.filter((quest) => completedQuestIds.includes(quest.id)),
    [completedQuestIds],
  );
  const cards = section === "archive" ? archivedQuests : activeQuests;
  const safeIndex = Math.min(cardIndex, Math.max(0, cards.length - 1));
  const selectedQuest = cards[safeIndex] || null;
  const isLocked = Boolean(
    selectedQuest?.previousQuestId && !completedQuestIds.includes(selectedQuest.previousQuestId),
  );
  const currentProgress = selectedQuest
    ? getQuestProgress(selectedQuest, inventory, seedInventory, clubReputation, questState, plantCatalog)
    : 0;
  const target = selectedQuest?.objective?.amount || 1;
  const canComplete = Boolean(selectedQuest && !isLocked && currentProgress >= target);

  const updateQuestState = (patch) => onQuestStateChange?.({
    ...questState,
    completedQuestIds,
    trust,
    clubSales: { ...(questState?.clubSales || {}) },
    careUses: {
      water: questState?.careUses?.water || 0,
      nutrition: questState?.careUses?.nutrition || 0,
      mariaMix: questState?.careUses?.mariaMix || 0,
    },
    ...patch,
  });

  const finishQuest = ({ force = false } = {}) => {
    if (!selectedQuest || completedQuestIds.includes(selectedQuest.id)) return;
    if (!force && (!canComplete || isLocked)) return;

    if (!force && selectedQuest.objective.type === "deliver") {
      const delivered = onDeliverItems?.({
        itemId: selectedQuest.objective.itemId,
        amount: selectedQuest.objective.amount,
      });
      if (delivered === false) {
        setMessage("Проверь инвентарь: нужного товара уже не хватает.");
        return;
      }
    }

    const nextCompleted = [...completedQuestIds, selectedQuest.id];
    const nextTrust = trust + selectedQuest.reward.trust;
    updateQuestState({ completedQuestIds: nextCompleted, trust: nextTrust });
    onRewardClaimed?.({
      questId: selectedQuest.id,
      coins: selectedQuest.reward.coins,
      trust: selectedQuest.reward.trust,
    });

    const nextInfo = getMariaTrustInfo(nextTrust);
    setRewardPopup({
      coins: selectedQuest.reward.coins,
      trust: selectedQuest.reward.trust,
      levelUp: nextInfo.current.level > trustInfo.current.level ? nextInfo.current : null,
    });
    setMessage("Дело закрыто. Награда твоя, записка отправлена в архив.");
    setCardIndex(0);
    window.setTimeout(() => setRewardPopup(null), 2300);
  };

  const moveCard = (direction) => {
    if (cards.length <= 1) return;
    setCardIndex((index) => (index + direction + cards.length) % cards.length);
  };

  const setCurrentSection = (nextSection) => {
    setSection(nextSection);
    setCardIndex(0);
  };

  const resetMaria = () => updateQuestState({
    completedQuestIds: [],
    trust: 0,
    clubSales: {},
    careUses: { water: 0, nutrition: 0, mariaMix: 0 },
  });

  return (
    <main
      className="maria-house-screen"
      style={{ "--maria-house-background": `url(${ASSETS.locations.mariaIvanovnaHouse.background})` }}
    >
      <header className="maria-house-topbar">
        <button type="button" className="maria-house-back" onClick={onBack}>← Район</button>
        <div>
          <span>Старый район</span>
          <strong>Дом Марии Ивановны</strong>
        </div>
      </header>

      <section className="maria-house-room" aria-label="Комната Марии Ивановны">
        <button
          type="button"
          className="maria-house-object maria-house-board"
          onClick={() => setPanel("quests")}
          aria-label="Открыть доску дел"
        >
          <img src={ASSETS.locations.mariaIvanovnaHouse.questBoard} alt="Доска дел" draggable="false" />
          <span>Доска дел</span>
          {activeQuests.length > 0 && <b>{activeQuests.length}</b>}
        </button>

        <button
          type="button"
          className="maria-house-object maria-house-radio"
          onClick={() => setMessage("Космо-волна 4.20 FM. Мария Ивановна говорит, под неё урожай растёт веселее.")}
          aria-label="Включить радио"
        >
          <img src={ASSETS.locations.mariaIvanovnaHouse.radio} alt="Космо-радио" draggable="false" />
          <span>Космо-волна</span>
        </button>

        <button
          type="button"
          className="maria-house-object maria-house-character"
          onClick={() => setPanel("path")}
          aria-label="Открыть путь доверия"
        >
          <img src={ASSETS.characters.mariaIvanovna} alt="Мария Ивановна" draggable="false" />
          <span>Путь ученика</span>
        </button>
      </section>

      <section className="maria-house-status">
        <div className="maria-trust-card">
          <div className="maria-trust-line">
            <span>Доверие · уровень {trustInfo.current.level}</span>
            <strong>{trustInfo.current.title} · {trustInfo.text}</strong>
          </div>
          <div className="maria-trust-track">
            <div style={{ width: `${trustInfo.progress}%` }} />
          </div>
        </div>

        <div className="maria-dialogue">
          <strong>Мария Ивановна</strong>
          <p>{message}</p>
        </div>
      </section>

      {panel && (
        <div className="maria-panel-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setPanel(null);
        }}>
          {panel === "quests" ? (
            <section className="maria-panel maria-quests-panel">
              <header>
                <div>
                  <span>Доска поручений</span>
                  <h2>Дела Марии Ивановны</h2>
                </div>
                <button type="button" onClick={() => setPanel(null)} aria-label="Закрыть">×</button>
              </header>

              <div className="maria-panel-tabs">
                <button type="button" className={section === "active" ? "active" : ""} onClick={() => setCurrentSection("active")}>Активные · {activeQuests.length}</button>
                <button type="button" className={section === "archive" ? "active" : ""} onClick={() => setCurrentSection("archive")}>Архив · {archivedQuests.length}</button>
              </div>

              {selectedQuest ? (
                <div
                  className={`maria-quest-card${isLocked ? " locked" : ""}`}
                  onTouchStart={(event) => { touchStartY.current = event.touches[0]?.clientY ?? null; }}
                  onTouchEnd={(event) => {
                    if (touchStartY.current === null) return;
                    const delta = (event.changedTouches[0]?.clientY ?? touchStartY.current) - touchStartY.current;
                    touchStartY.current = null;
                    if (Math.abs(delta) > 48) moveCard(delta < 0 ? 1 : -1);
                  }}
                >
                  <div className="maria-quest-topline">
                    <span>{selectedQuest.label}</span>
                    <b>{safeIndex + 1}/{cards.length}</b>
                  </div>
                  <div className="maria-quest-icon">{isLocked ? "🔒" : selectedQuest.icon}</div>
                  <h3>{selectedQuest.title}</h3>
                  <p>{isLocked ? "Сначала закрой предыдущее дело на доске." : selectedQuest.description}</p>

                  <div className="maria-quest-progress">
                    <span>Прогресс</span>
                    <strong>{Math.min(currentProgress, target)}/{target}</strong>
                  </div>
                  <div className="maria-quest-track">
                    <div style={{ width: `${Math.min(100, (currentProgress / target) * 100)}%` }} />
                  </div>
                  <div className="maria-quest-reward">Награда: 🪙 {selectedQuest.reward.coins} · 🤝 +{selectedQuest.reward.trust}</div>

                  {section === "active" && (
                    <button type="button" className="maria-quest-complete" disabled={!canComplete} onClick={() => finishQuest()}>
                      {isLocked ? "Дело закрыто цепочкой" : canComplete ? "Забрать награду" : "Условие не выполнено"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="maria-empty-panel">{section === "archive" ? "Архив пока пуст." : "Все текущие дела закрыты."}</div>
              )}

              {cards.length > 1 && (
                <div className="maria-card-navigation">
                  <button type="button" onClick={() => moveCard(-1)}>↑ Предыдущее</button>
                  <button type="button" onClick={() => moveCard(1)}>Следующее ↓</button>
                </div>
              )}

              {isDev && (
                <div className="maria-devbar">
                  <button type="button" onClick={() => updateQuestState({ trust: trust + 25 })}>DEV · +25 доверия</button>
                  <button type="button" onClick={() => finishQuest({ force: true })}>DEV · закрыть дело</button>
                  <button type="button" onClick={resetMaria}>DEV · сбросить</button>
                </div>
              )}
            </section>
          ) : (
            <section className="maria-panel maria-path-panel">
              <header>
                <div>
                  <span>Репутация наставника</span>
                  <h2>Путь ученика</h2>
                </div>
                <button type="button" onClick={() => setPanel(null)} aria-label="Закрыть">×</button>
              </header>

              <div className="maria-level-list">
                {MARIA_TRUST_LEVELS.map((level) => {
                  const unlocked = trust >= level.required;
                  return (
                    <article key={level.level} className={unlocked ? "unlocked" : ""}>
                      <div className="maria-level-icon">{level.icon}</div>
                      <div>
                        <strong>Уровень {level.level} · {level.title}</strong>
                        <small>{level.reward}</small>
                      </div>
                      <b>{unlocked ? "Открыто ✓" : `${trust}/${level.required}`}</b>
                    </article>
                  );
                })}
              </div>

              {isDev && (
                <div className="maria-devbar">
                  <button type="button" onClick={() => updateQuestState({ trust: trust + 25 })}>DEV · +25 доверия</button>
                  <button type="button" onClick={resetMaria}>DEV · сбросить</button>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {rewardPopup && (
        <div className="maria-reward-popup">
          <strong>Дело закрыто</strong>
          <span>🪙 +{rewardPopup.coins} · 🤝 +{rewardPopup.trust}</span>
          {rewardPopup.levelUp && <em>Новый уровень: {rewardPopup.levelUp.title}</em>}
        </div>
      )}
    </main>
  );
}
