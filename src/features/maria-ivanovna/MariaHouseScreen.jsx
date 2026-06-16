import { useEffect, useMemo, useState } from "react";

import { ASSETS } from "../../core/assets/assetCatalog";
import { triggerTelegramNotification } from "../../core/telegram";
import { MARIA_TRUST_LEVELS, getMariaTrustInfo } from "./mariaProgression";
import { DISTRICT_BULLETINS, MARIA_CHAPTERS, MARIA_QUESTS } from "./mariaQuests";
import "./MariaHouseScreen.css";

export { MARIA_QUESTS } from "./mariaQuests";

function getQuestProgress(quest, inventory, seedInventory, careInventory, clubReputation, questState, plantCatalog) {
  const objective = quest.objective;
  if (objective.type === "deliver" || objective.type === "own-crop") return inventory?.[objective.itemId] || 0;
  if (objective.type === "deliver-set") {
    return Object.entries(objective.items || {}).reduce(
      (sum, [itemId, amount]) => sum + Math.min(Number(inventory?.[itemId]) || 0, amount),
      0,
    );
  }
  if (objective.type === "club-sale") return questState?.clubSales?.[objective.itemId] || 0;
  if (objective.type === "club-sale-each") {
    const values = ["tabakko", "greenTomato", "kokaNova"].map((itemId) => questState?.clubSales?.[itemId] || 0);
    return Math.min(...values);
  }
  if (objective.type === "own-seed") return seedInventory?.[objective.itemId] || 0;
  if (objective.type === "own-tool") return careInventory?.[objective.itemId] || 0;
  if (objective.type === "club-reputation") return clubReputation || 0;
  if (objective.type === "quality-rank") return (plantCatalog?.[objective.itemId]?.bestQualityRank ?? -1) >= objective.rank ? 1 : 0;
  if (objective.type === "quality-any") {
    return Object.values(plantCatalog || {}).some((record) => (record?.bestQualityRank ?? -1) >= objective.rank) ? 1 : 0;
  }
  if (objective.type === "care-use") return questState?.careUses?.[objective.careType] || 0;
  if (objective.type === "rare-discovery") {
    return Object.values(plantCatalog || {}).some((record) => (record?.qualities?.rare || 0) > 0) ? 1 : 0;
  }
  return 0;
}

function QuestCard({ quest, selected, locked, completed, onClick }) {
  return (
    <button
      type="button"
      className={`maria-case-strip__item${selected ? " selected" : ""}${locked ? " locked" : ""}${completed ? " completed" : ""}`}
      onClick={onClick}
    >
      <span>{completed ? "✓" : locked ? "⌁" : quest.icon}</span>
      <div>
        <small>Глава {quest.chapter}</small>
        <strong>{quest.title}</strong>
      </div>
    </button>
  );
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
  const completedQuestIds = Array.isArray(questState?.completedQuestIds) ? questState.completedQuestIds : [];
  const trust = Math.max(0, Number(questState?.trust) || 0);
  const trustInfo = getMariaTrustInfo(trust);
  const firstIncomplete = MARIA_QUESTS.find((quest) => !completedQuestIds.includes(quest.id)) || null;

  const [panel, setPanel] = useState(null);
  const [boardMode, setBoardMode] = useState("current");
  const [selectedId, setSelectedId] = useState(firstIncomplete?.id || null);
  const [bulletinIndex, setBulletinIndex] = useState(0);
  const [message, setMessage] = useState("На районе ценят не скорость, а тех, кто доводит дело до конца.");
  const [rewardPopup, setRewardPopup] = useState(null);

  useEffect(() => {
    if (firstIncomplete && !MARIA_QUESTS.some((quest) => quest.id === selectedId)) setSelectedId(firstIncomplete.id);
  }, [firstIncomplete, selectedId]);

  useEffect(() => {
    if (tutorialStep === "claim-first-quest" || tutorialStep === "onboarding-finish") {
      setPanel("board");
      setBoardMode("current");
      setSelectedId("maria-tabakko-delivery");
    }
  }, [tutorialStep]);

  useEffect(() => {
    if (tutorialStep === "claim-first-quest" && completedQuestIds.includes("maria-tabakko-delivery")) {
      onTutorialAction?.("claim-first-quest");
    }
  }, [completedQuestIds, onTutorialAction, tutorialStep]);

  const chapter = MARIA_CHAPTERS.find((entry) => entry.id === (firstIncomplete?.chapter || 5)) || MARIA_CHAPTERS.at(-1);
  const visibleCases = useMemo(() => {
    if (boardMode === "archive") return MARIA_QUESTS.filter((quest) => completedQuestIds.includes(quest.id)).reverse();
    if (!firstIncomplete) return [];
    const start = Math.max(0, MARIA_QUESTS.findIndex((quest) => quest.id === firstIncomplete.id));
    return MARIA_QUESTS.slice(start, start + 5);
  }, [boardMode, completedQuestIds, firstIncomplete]);

  useEffect(() => {
    if (visibleCases.length > 0 && !visibleCases.some((quest) => quest.id === selectedId)) {
      setSelectedId(visibleCases[0].id);
    }
  }, [visibleCases, selectedId]);

  const selectedQuest = MARIA_QUESTS.find((quest) => quest.id === selectedId)
    || visibleCases[0]
    || null;
  const selectedCompleted = Boolean(selectedQuest && completedQuestIds.includes(selectedQuest.id));
  const selectedLocked = Boolean(
    selectedQuest?.previousQuestId && !completedQuestIds.includes(selectedQuest.previousQuestId),
  );
  const currentProgress = selectedQuest
    ? getQuestProgress(selectedQuest, inventory, seedInventory, careInventory, clubReputation, questState, plantCatalog)
    : 0;
  const target = selectedQuest?.objective?.type === "club-sale-each"
    ? selectedQuest.objective.amount
    : selectedQuest?.objective?.amount || 1;
  const canComplete = Boolean(selectedQuest && !selectedCompleted && !selectedLocked && currentProgress >= target);

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

  const deliverObjective = (objective) => {
    if (objective.type === "deliver") {
      return onDeliverItems?.({ itemId: objective.itemId, amount: objective.amount }) !== false;
    }
    if (objective.type === "deliver-set") {
      const entries = Object.entries(objective.items || {});
      const hasEverything = entries.every(([itemId, amount]) => (inventory?.[itemId] || 0) >= amount);
      if (!hasEverything) return false;
      return entries.every(([itemId, amount]) => onDeliverItems?.({ itemId, amount }) !== false);
    }
    return true;
  };

  const finishQuest = () => {
    if (!selectedQuest || !canComplete || selectedLocked || selectedCompleted || !canClaimTutorialQuest) return;
    if (!deliverObjective(selectedQuest.objective)) {
      setMessage("Проверь рюкзак. Для дела не хватает товара.");
      return;
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
    setRewardPopup({
      coins: selectedQuest.reward.coins,
      trust: selectedQuest.reward.trust,
      levelUp: nextInfo.current.level > trustInfo.current.level ? nextInfo.current : null,
    });
    setMessage("Готово. Записка ушла в архив, а район запомнил результат.");
    const nextQuest = MARIA_QUESTS.find((quest) => !nextCompleted.includes(quest.id));
    setSelectedId(nextQuest?.id || selectedQuest.id);
    window.setTimeout(() => setRewardPopup(null), 2400);
  };

  const openBoard = () => {
    if (!canOpenBoard) return;
    setPanel("board");
    setBoardMode("current");
    setSelectedId(firstIncomplete?.id || MARIA_QUESTS.at(-1)?.id);
    if (tutorialStep === "open-maria-board") onTutorialAction?.("open-maria-board");
  };

  const openBulletins = () => {
    if (isTutorialActive) return;
    setBulletinIndex(Math.floor(Math.random() * DISTRICT_BULLETINS.length));
    setPanel("bulletins");
  };

  return (
    <main
      className="maria-house-screen"
      style={{ "--maria-house-background": `url(${ASSETS.locations.mariaIvanovnaHouse.background})` }}
    >
      <div className="maria-house-heading">
        <span>GROW STREET · ДОМ 7</span>
        <strong>Мария Ивановна</strong>
      </div>

      <section className="maria-house-room" aria-label="Комната Марии Ивановны">
        <button type="button" className="maria-house-object maria-house-board" onClick={openBoard} disabled={isTutorialActive && !canOpenBoard}>
          <img src={ASSETS.locations.mariaIvanovnaHouse.questBoard} alt="Доска дел" draggable="false" />
          <span>Дела района</span>
          {firstIncomplete && <b>{completedQuestIds.length + 1}/{MARIA_QUESTS.length}</b>}
        </button>

        <button type="button" className="maria-house-object maria-house-radio" onClick={openBulletins} disabled={isTutorialActive}>
          <img src={ASSETS.locations.mariaIvanovnaHouse.radio} alt="Приёмник" draggable="false" />
          <span>Сводки</span>
        </button>

        <button type="button" className="maria-house-object maria-house-character" onClick={() => !isTutorialActive && setPanel("trust")} disabled={isTutorialActive}>
          <img src={ASSETS.characters.mariaIvanovna} alt="Мария Ивановна" draggable="false" />
          <span>Поговорить</span>
        </button>
      </section>

      <section className="maria-house-brief">
        <div className="maria-house-brief__chapter">
          <span>ГЛАВА {chapter.id}</span>
          <strong>{chapter.title}</strong>
          <p>{chapter.subtitle}</p>
        </div>
        <div className="maria-house-brief__trust">
          <span>{trustInfo.current.title}</span>
          <div><i style={{ width: `${trustInfo.progress}%` }} /></div>
          <b>{trustInfo.text}</b>
        </div>
        <p className="maria-house-brief__message">«{message}»</p>
      </section>

      <button type="button" className="maria-grow-street-button" onClick={onBack} disabled={isTutorialActive}>
        GROW STREET
      </button>

      {panel && (
        <div className="maria-panel-overlay" onMouseDown={(event) => {
          if (!isTutorialActive && event.target === event.currentTarget) setPanel(null);
        }}>
          {panel === "board" && (
            <section className="maria-panel maria-case-board">
              <header>
                <div>
                  <span>ДОСКА МАРИИ</span>
                  <h2>{boardMode === "archive" ? "Закрытые дела" : "Текущее дело"}</h2>
                </div>
                <button type="button" onClick={() => setPanel(null)} disabled={isTutorialActive} aria-label="Закрыть">×</button>
              </header>

              <nav className="maria-board-tabs">
                <button type="button" className={boardMode === "current" ? "active" : ""} onClick={() => { setBoardMode("current"); setSelectedId(firstIncomplete?.id || null); }} disabled={isTutorialActive}>Сейчас</button>
                <button type="button" className={boardMode === "archive" ? "active" : ""} onClick={() => { setBoardMode("archive"); const archived = MARIA_QUESTS.filter((quest) => completedQuestIds.includes(quest.id)).at(-1); setSelectedId(archived?.id || null); }} disabled={isTutorialActive}>Архив</button>
              </nav>

              <div className="maria-case-strip">
                {visibleCases.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    selected={selectedQuest?.id === quest.id}
                    locked={Boolean(quest.previousQuestId && !completedQuestIds.includes(quest.previousQuestId))}
                    completed={completedQuestIds.includes(quest.id)}
                    onClick={() => setSelectedId(quest.id)}
                  />
                ))}
              </div>

              {selectedQuest ? (
                <article className={`maria-case-file${selectedLocked ? " locked" : ""}`}>
                  <div className="maria-case-file__pin">{selectedLocked ? "⌁" : selectedQuest.icon}</div>
                  <span className="maria-case-file__chapter">ГЛАВА {selectedQuest.chapter} · ДЕЛО {MARIA_QUESTS.findIndex((quest) => quest.id === selectedQuest.id) + 1}</span>
                  <h3>{selectedQuest.title}</h3>
                  <p>{selectedLocked ? "Мария не открывает детали, пока не закрыто предыдущее дело." : selectedQuest.description}</p>

                  {!selectedLocked && (
                    <>
                      <div className="maria-case-progress">
                        <div><span>Готовность</span><strong>{Math.min(currentProgress, target)}/{target}</strong></div>
                        <div className="maria-case-progress__track"><i style={{ width: `${Math.min(100, (currentProgress / target) * 100)}%` }} /></div>
                      </div>
                      <div className="maria-case-reward"><span>НАГРАДА</span><strong>● {selectedQuest.reward.coins}</strong><strong>🤝 +{selectedQuest.reward.trust}</strong></div>
                      {boardMode === "current" && !selectedCompleted && (
                        <button type="button" className="maria-case-action" disabled={!canComplete || !canClaimTutorialQuest} onClick={finishQuest}>
                          {canComplete ? "ЗАКРЫТЬ ДЕЛО" : "ЕЩЁ НЕ ГОТОВО"}
                        </button>
                      )}
                    </>
                  )}
                </article>
              ) : <div className="maria-empty-panel">Здесь пока пусто.</div>}
            </section>
          )}

          {panel === "bulletins" && (
            <section className="maria-panel maria-bulletin-panel">
              <header><div><span>СВОДКИ GROW STREET</span><h2>Сегодня на районе</h2></div><button type="button" onClick={() => setPanel(null)}>×</button></header>
              <div className="maria-bulletin-card">
                <span>HOT SHOT #{bulletinIndex + 1}</span>
                <h3>{DISTRICT_BULLETINS[bulletinIndex].title}</h3>
                <p>{DISTRICT_BULLETINS[bulletinIndex].text}</p>
              </div>
              <button type="button" className="maria-bulletin-next" onClick={() => setBulletinIndex((index) => (index + 1) % DISTRICT_BULLETINS.length)}>Следующая сводка</button>
            </section>
          )}

          {panel === "trust" && (
            <section className="maria-panel maria-trust-panel">
              <header><div><span>ДОВЕРИЕ МАРИИ</span><h2>{trustInfo.current.title}</h2></div><button type="button" onClick={() => setPanel(null)}>×</button></header>
              <p className="maria-trust-quote">«Монеты показывают, что ты продал. Доверие показывает, что тебе можно поручить.»</p>
              <div className="maria-level-list">
                {MARIA_TRUST_LEVELS.map((level) => {
                  const unlocked = trust >= level.required;
                  return (
                    <article key={level.level} className={unlocked ? "unlocked" : ""}>
                      <div>{level.icon}</div>
                      <span><strong>{level.title}</strong><small>{level.reward}</small></span>
                      <b>{unlocked ? "✓" : level.required}</b>
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
          <strong>ДЕЛО ЗАКРЫТО</strong>
          <span>● +{rewardPopup.coins} · 🤝 +{rewardPopup.trust}</span>
          {rewardPopup.levelUp && <em>{rewardPopup.levelUp.title}</em>}
        </div>
      )}
    </main>
  );
}
