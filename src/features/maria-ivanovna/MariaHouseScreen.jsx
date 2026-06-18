import { useEffect, useMemo, useRef, useState } from "react";

import { ASSETS } from "../../core/assets/assetCatalog";
import { getTelegramPlayer, triggerTelegramNotification } from "../../core/telegram";
import { MARIA_TRUST_LEVELS, getMariaTrustInfo } from "./mariaProgression";
import { CROP_IDS } from "../plantation/data/crops";
import { MARIA_CHAPTERS, MARIA_QUESTS } from "./mariaQuests";
import "./MariaHouseScreen.css";

function getQuestProgress(quest, inventory, seedInventory, careInventory, clubReputation, questState, plantCatalog) {
  const objective = quest.objective;

  if (objective.type === "deliver") return inventory?.[objective.itemId] || 0;
  if (objective.type === "deliver-set") {
    return Object.entries(objective.items || {}).reduce(
      (total, [itemId, amount]) => total + Math.min(inventory?.[itemId] || 0, amount),
      0,
    );
  }
  if (objective.type === "club-sale") return questState?.clubSales?.[objective.itemId] || 0;
  if (objective.type === "club-sale-each") {
    return Math.min(...CROP_IDS.map((itemId) => questState?.clubSales?.[itemId] || 0));
  }
  if (objective.type === "own-seed") return seedInventory?.[objective.itemId] || 0;
  if (objective.type === "own-tool") return careInventory?.[objective.itemId] || 0;
  if (objective.type === "club-reputation") return clubReputation || 0;
  if (objective.type === "quality-rank") {
    return (plantCatalog?.[objective.itemId]?.bestQualityRank ?? -1) >= objective.rank ? 1 : 0;
  }
  if (objective.type === "quality-any") {
    return Object.values(plantCatalog || {}).some(
      (record) => (record?.bestQualityRank ?? -1) >= objective.rank,
    ) ? 1 : 0;
  }
  if (objective.type === "care-use") return questState?.careUses?.[objective.careType] || 0;
  if (objective.type === "rare-discovery") {
    return Object.values(plantCatalog || {}).some((record) => (record?.qualities?.rare || 0) > 0) ? 1 : 0;
  }
  return 0;
}

function getQuestLabel(quest) {
  const chapter = MARIA_CHAPTERS.find((item) => item.id === quest?.chapter);
  return chapter ? `Глава ${chapter.id} · ${chapter.title}` : "Дело Марии Ивановны";
}

export default function MariaHouseScreen({
  onBack,
  inventory,
  seedInventory,
  careInventory = {},
  clubReputation = 0,
  onDeliverItems,
  onRewardClaimed,
  questState,
  plantCatalog,
  onQuestStateChange,
  tutorialStep = "completed",
  onTutorialAction,
}) {
  const isTutorialActive = tutorialStep !== "completed";
  const canOpenBoard = !isTutorialActive || tutorialStep === "open-maria-board";
  const canClaimTutorialQuest = !isTutorialActive || tutorialStep === "claim-first-quest";

  const completedQuestIds = useMemo(
    () => Array.isArray(questState?.completedQuestIds)
      ? questState.completedQuestIds
      : [],
    [questState],
  );
  const trust = Math.max(0, Number(questState?.trust) || 0);
  const trustInfo = getMariaTrustInfo(trust);
  const [panel, setPanel] = useState(() =>
    tutorialStep === "claim-first-quest" || tutorialStep === "onboarding-finish"
      ? "quests"
      : null,
  );
  const [section, setSection] = useState("active");
  const [cardIndex, setCardIndex] = useState(0);
  const [message, setMessage] = useState("На доске — дела района. Подойди, ученик, разберёмся по порядку.");
  const [rewardPopup, setRewardPopup] = useState(null);
  const touchStartY = useRef(null);
  const telegramPlayer = useMemo(() => getTelegramPlayer(), []);

  useEffect(() => {
    if (
      tutorialStep === "claim-first-quest" &&
      completedQuestIds.includes("maria-tabakko-delivery")
    ) {
      onTutorialAction?.("claim-first-quest");
    }
  }, [completedQuestIds, onTutorialAction, tutorialStep]);

  useEffect(() => {
    const backButton = telegramPlayer.webApp?.BackButton;

    if (!backButton) return undefined;

    if (isTutorialActive) {
      backButton.hide?.();
      return undefined;
    }

    const handleBack = () => onBack?.();

    backButton.show?.();
    backButton.onClick?.(handleBack);

    return () => {
      backButton.offClick?.(handleBack);
      backButton.hide?.();
    };
  }, [isTutorialActive, onBack, telegramPlayer.webApp]);

  const activeQuests = useMemo(
    () => MARIA_QUESTS.filter((quest) => !completedQuestIds.includes(quest.id)),
    [completedQuestIds],
  );
  const archivedQuests = useMemo(
    () => MARIA_QUESTS.filter((quest) => completedQuestIds.includes(quest.id)),
    [completedQuestIds],
  );
  const cards = section === "archive" ? archivedQuests : activeQuests;
  const safeIndex = Math.min(cardIndex, Math.max(0, cards.length - 1));
  const selectedQuest = cards[safeIndex] || null;
  const isLocked = Boolean(
    selectedQuest?.previousQuestId && !completedQuestIds.includes(selectedQuest.previousQuestId),
  );
  const currentProgress = selectedQuest
    ? getQuestProgress(selectedQuest, inventory, seedInventory, careInventory, clubReputation, questState, plantCatalog)
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

    if (!force && selectedQuest.objective.type === "deliver-set") {
      const delivered = onDeliverItems?.({ items: selectedQuest.objective.items });
      if (delivered === false) {
        setMessage("Проверь инвентарь: для полной поставки не хватает урожая.");
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
    triggerTelegramNotification("success");
    const isChapterFinale = selectedQuest.id === "maria-final-delivery";
    setRewardPopup({
      coins: selectedQuest.reward.coins,
      trust: selectedQuest.reward.trust,
      levelUp: nextInfo.current.level > trustInfo.current.level ? nextInfo.current : null,
      finale: isChapterFinale,
    });
    setMessage(
      isChapterFinale
        ? "Первая глава закрыта. Ключ от старого лифта теперь твой — подвал дождётся следующей истории."
        : "Дело закрыто. Награда твоя, записка отправлена в архив.",
    );
    setCardIndex(0);

    if (
      tutorialStep === "claim-first-quest" &&
      selectedQuest.id === "maria-tabakko-delivery"
    ) {
      onTutorialAction?.("claim-first-quest");
    }

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


  return (
    <main
      className="maria-house-screen"
      style={{ "--maria-house-background": `url(${ASSETS.locations.mariaIvanovnaHouse.background})` }}
    >
      {!isTutorialActive && (
        <button
          type="button"
          className="maria-house-fallback-back"
          onClick={onBack}
          aria-label="????????? ? ?????"
        >
          ? ?????
        </button>
      )}

      <section className="maria-house-room" aria-label="Комната Марии Ивановны">
        <button
          type="button"
          className="maria-house-object maria-house-board"
          onClick={() => {
            if (!canOpenBoard) return;
            setPanel("quests");
            if (tutorialStep === "open-maria-board") {
              onTutorialAction?.("open-maria-board");
            }
          }}
          aria-label="Открыть доску дел"
          disabled={isTutorialActive && !canOpenBoard}
        >
          <img src={ASSETS.locations.mariaIvanovnaHouse.questBoard} alt="Доска дел" draggable="false" />
          <span>Доска дел</span>
          {activeQuests.length > 0 && <b>{activeQuests.length}</b>}
        </button>

        <button
          type="button"
          className="maria-house-object maria-house-radio"
          onClick={() => {
            if (isTutorialActive) return;
            setMessage("Космо-волна 4.20 FM. Мария Ивановна говорит, под неё урожай растёт веселее.");
          }}
          aria-label="Включить радио"
          disabled={isTutorialActive}
        >
          <img src={ASSETS.locations.mariaIvanovnaHouse.radio} alt="Космо-радио" draggable="false" />
          <span>Космо-волна</span>
        </button>

        <button
          type="button"
          className="maria-house-object maria-house-character"
          onClick={() => {
            if (isTutorialActive) return;
            setPanel("path");
          }}
          aria-label="Открыть путь доверия"
          disabled={isTutorialActive}
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
          if (!isTutorialActive && event.target === event.currentTarget) setPanel(null);
        }}>
          {panel === "quests" ? (
            <section className="maria-panel maria-quests-panel">
              <header>
                <div>
                  <span>Доска поручений</span>
                  <h2>Дела Марии Ивановны</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPanel(null)}
                  aria-label="Закрыть"
                  disabled={isTutorialActive}
                >
                  ×
                </button>
              </header>

              <div className="maria-panel-tabs">
                <button
                  type="button"
                  className={section === "active" ? "active" : ""}
                  onClick={() => setCurrentSection("active")}
                  disabled={isTutorialActive}
                >
                  Активные · {activeQuests.length}
                </button>
                <button
                  type="button"
                  className={section === "archive" ? "active" : ""}
                  onClick={() => setCurrentSection("archive")}
                  disabled={isTutorialActive}
                >
                  Архив · {archivedQuests.length}
                </button>
              </div>

              {selectedQuest ? (
                <div
                  className={`maria-quest-card${isLocked ? " locked" : ""}`}
                  onTouchStart={(event) => { touchStartY.current = event.touches[0]?.clientY ?? null; }}
                  onTouchEnd={(event) => {
                    if (touchStartY.current === null) return;
                    const delta = (event.changedTouches[0]?.clientY ?? touchStartY.current) - touchStartY.current;
                    touchStartY.current = null;
                    if (!isTutorialActive && Math.abs(delta) > 48) {
                      moveCard(delta < 0 ? 1 : -1);
                    }
                  }}
                >
                  <div className="maria-quest-topline">
                    <span>{getQuestLabel(selectedQuest)}</span>
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
                    <button
                      type="button"
                      className="maria-quest-complete"
                      disabled={!canComplete || !canClaimTutorialQuest}
                      onClick={() => finishQuest()}
                    >
                      {isLocked ? "Дело закрыто цепочкой" : canComplete ? "Забрать награду" : "Условие не выполнено"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="maria-empty-panel">
                  {section === "archive"
                    ? "Архив пока пуст."
                    : (
                      <>
                        <strong>Первая глава завершена 🔑</strong>
                        <span>Все 40 дел закрыты. Ключ от старого лифта получен.</span>
                      </>
                    )}
                </div>
              )}

              {cards.length > 1 && !isTutorialActive && (
                <div className="maria-card-navigation">
                  <button type="button" onClick={() => moveCard(-1)}>↑ Предыдущее</button>
                  <button type="button" onClick={() => moveCard(1)}>Следующее ↓</button>
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

            </section>
          )}
        </div>
      )}

      {rewardPopup && (
        <div className="maria-reward-popup">
          <strong>Дело закрыто</strong>
          <span>🪙 +{rewardPopup.coins} · 🤝 +{rewardPopup.trust}</span>
          {rewardPopup.levelUp && <em>Новый уровень: {rewardPopup.levelUp.title}</em>}
          {rewardPopup.finale && <em>🔑 Ключ от старого лифта получен</em>}
        </div>
      )}
    </main>
  );
}
