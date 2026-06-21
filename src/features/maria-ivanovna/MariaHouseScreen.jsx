import { useEffect, useMemo, useState } from "react";

import { ASSETS } from "../../core/assets/assetCatalog";
import {
  getTelegramPlayer,
  triggerTelegramHaptic,
  triggerTelegramNotification,
} from "../../core/telegram";
import { MARIA_TRUST_LEVELS, getMariaTrustInfo } from "./mariaProgression";
import { CROP_IDS } from "../plantation/data/crops";
import {
  DISTRICT_BULLETINS,
  MARIA_CHAPTERS,
  MARIA_QUESTS,
} from "./mariaQuests";
import "./MariaHouseScreen.css";

const MARIA_DIALOGUE_CHOICES = [
  {
    id: "task",
    label: "Что делать сейчас?",
    hint: "Главное поручение",
    icon: "▣",
  },
  {
    id: "shortcut",
    label: "Как закрыть его быстрее?",
    hint: "Конкретный совет",
    icon: "➜",
  },
  {
    id: "reward",
    label: "Что откроется дальше?",
    hint: "Следующая награда",
    icon: "✦",
  },
  {
    id: "money",
    label: "Как не уйти в минус?",
    hint: "Совет по экономике",
    icon: "●",
  },
];

function getQuestProgress(
  quest,
  inventory,
  seedInventory,
  careInventory,
  clubReputation,
  questState,
  plantCatalog,
) {
  const objective = quest.objective;

  if (objective.type === "deliver") return inventory?.[objective.itemId] || 0;
  if (objective.type === "deliver-set") {
    return Object.entries(objective.items || {}).reduce(
      (total, [itemId, amount]) =>
        total + Math.min(inventory?.[itemId] || 0, amount),
      0,
    );
  }
  if (objective.type === "club-sale") {
    return questState?.clubSales?.[objective.itemId] || 0;
  }
  if (objective.type === "club-sale-each") {
    return Math.min(
      ...CROP_IDS.map((itemId) => questState?.clubSales?.[itemId] || 0),
    );
  }
  if (objective.type === "own-seed") {
    return seedInventory?.[objective.itemId] || 0;
  }
  if (objective.type === "own-tool") {
    return careInventory?.[objective.itemId] || 0;
  }
  if (objective.type === "club-reputation") return clubReputation || 0;
  if (objective.type === "quality-rank") {
    return (plantCatalog?.[objective.itemId]?.bestQualityRank ?? -1) >=
      objective.rank
      ? 1
      : 0;
  }
  if (objective.type === "quality-any") {
    return Object.values(plantCatalog || {}).some(
      (record) => (record?.bestQualityRank ?? -1) >= objective.rank,
    )
      ? 1
      : 0;
  }
  if (objective.type === "harvest-count") {
    return Math.max(0, Number(plantCatalog?.[objective.itemId]?.totalHarvested) || 0);
  }
  if (objective.type === "harvest-total") {
    return Object.values(plantCatalog || {}).reduce(
      (total, record) => total + Math.max(0, Number(record?.totalHarvested) || 0),
      0,
    );
  }
  if (objective.type === "quality-count") {
    const rankByQuality = { normal: 0, good: 1, excellent: 2, rare: 3 };
    const records = objective.itemId
      ? [plantCatalog?.[objective.itemId]]
      : Object.values(plantCatalog || {});
    return records.reduce((sum, record) => {
      const qualities = record?.qualities || {};
      return sum + Object.entries(qualities).reduce(
        (count, [qualityId, amount]) =>
          count + ((rankByQuality[qualityId] ?? -1) >= objective.rank
            ? Math.max(0, Number(amount) || 0)
            : 0),
        0,
      );
    }, 0);
  }
  if (objective.type === "care-use") {
    return questState?.careUses?.[objective.careType] || 0;
  }
  if (objective.type === "rare-discovery") {
    return Object.values(plantCatalog || {}).some(
      (record) => (record?.qualities?.rare || 0) > 0,
    )
      ? 1
      : 0;
  }
  return 0;
}

function getQuestStatus(quest, completedQuestIds, progress) {
  if (completedQuestIds.includes(quest.id)) return "completed";
  if (
    quest.previousQuestId &&
    !completedQuestIds.includes(quest.previousQuestId)
  ) {
    return "locked";
  }
  if (progress >= (quest.objective?.amount || 1)) return "ready";
  return "active";
}

function getChapterProgress(chapterId, completedQuestIds) {
  const quests = MARIA_QUESTS.filter((quest) => quest.chapter === chapterId);
  const complete = quests.filter((quest) =>
    completedQuestIds.includes(quest.id),
  ).length;
  return {
    total: quests.length,
    complete,
    percent: quests.length ? (complete / quests.length) * 100 : 0,
  };
}

function getActiveQuest(completedQuestIds) {
  return (
    MARIA_QUESTS.find((quest) => !completedQuestIds.includes(quest.id)) || null
  );
}

function getQuestShortcut(quest) {
  const objective = quest?.objective;
  if (!objective) return "Смотри на доску и не распыляйся: одно закрытое дело лучше пяти начатых.";

  if (objective.type === "deliver" || objective.type === "deliver-set") {
    return "Освободи место в рюкзаке заранее и не продавай нужный урожай клубу. Сначала закрой поставку мне.";
  }
  if (objective.type === "club-sale" || objective.type === "club-sale-each") {
    return "Не жди идеального покупателя. Собери нужную партию, выбери ровную сделку и продавай без лишнего торга.";
  }
  if (objective.type === "club-reputation") {
    return "Репутация растёт быстрее от честных сделок. Меньше торга, больше закрытых заказов подряд.";
  }
  if (objective.type === "own-seed" || objective.type === "own-tool") {
    return "Сначала накопи цену покупки. Не трать монеты на обновления лавки, пока нужный товар уже лежит на витрине.";
  }
  if (objective.type === "care-use") {
    return "Ставь растение и применяй уход во время активной стадии. На пустом ведре счётчик не двинется.";
  }
  if (objective.type === "quality-rank" || objective.type === "quality-any" || objective.type === "quality-count") {
    return "Поливай обе стадии. Для отличного качества добавь питательный раствор, для редкого — смесь Марии. Серия надёжнее одной попытки.";
  }
  if (objective.type === "harvest-count" || objective.type === "harvest-total") {
    return "Не ускоряй всё подряд. Запусти несколько вёдер с разницей во времени — тогда сборы будут идти ровной цепочкой.";
  }
  if (objective.type === "rare-discovery") {
    return "Редкость не гарантируется. Два полива, питание и моя смесь дают лучший шанс — но запасись несколькими семенами.";
  }

  return "Делай поручения по порядку. Район любит тех, кто доводит начатое до конца.";
}

function getDialogueText(
  choiceId,
  activeQuest,
  trustInfo,
  trust,
  clubReputation,
  radioBulletin,
) {
  if (choiceId === "task") {
    return activeQuest
      ? `Сейчас главное — «${activeQuest.title}». ${activeQuest.description}`
      : "Текущая цепочка закрыта. Отдохни, но ключ от старого лифта не теряй.";
  }

  if (choiceId === "shortcut") {
    return getQuestShortcut(activeQuest);
  }

  if (choiceId === "reward") {
    return trustInfo.next
      ? `Следом я открою тебе «${trustInfo.next.reward}». Осталось заслужить ${Math.max(
          0,
          trustInfo.next.required - trust,
        )} доверия.`
      : "Ты уже правая рука. Дальше награды будут приходить из новых глав.";
  }

  if (choiceId === "money") {
    return clubReputation < 75
      ? "Держи резерв хотя бы на одно семя. Не выжимай покупателя досуха: сначала имя в клубе, потом высокая цена."
      : "Дешёвые культуры продавай оборотом, дорогие — качеством. Расходники лей только туда, где они реально окупаются.";
  }

  if (choiceId === "district") {
    return radioBulletin
      ? `По району шепчутся: «${radioBulletin.title}». ${radioBulletin.text}`
      : "Сегодня тихо. А когда на Grow Street тихо — кто-то точно что-то прячет.";
  }

  return "Не стой столбом. В районе всегда есть дело.";
}

function statusLabel(status) {
  if (status === "completed") return "Выполнено";
  if (status === "ready") return "Награда готова";
  if (status === "locked") return "Закрыто";
  return "В работе";
}

function MariaRewardTokens({ coins = 0, trust = 0, compact = false }) {
  return (
    <span className={`maria-reward-tokens${compact ? " compact" : ""}`}>
      <span className="maria-reward-token maria-reward-token--coins" title={`${coins} монет`}>
        <i className="maria-coin-icon" aria-hidden="true" />
        <b>+{coins}</b>
      </span>
      <span className="maria-reward-token maria-reward-token--trust" title={`${trust} REP Марии`}>
        <i className="maria-trust-icon" aria-hidden="true">REP</i>
        <b>+{trust}</b>
      </span>
    </span>
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
  const canOpenBoard =
    !isTutorialActive || tutorialStep === "open-maria-board";
  const canClaimTutorialQuest =
    !isTutorialActive || tutorialStep === "claim-first-quest";
  const completedQuestIds = useMemo(
    () =>
      Array.isArray(questState?.completedQuestIds)
        ? questState.completedQuestIds
        : [],
    [questState],
  );
  const trust = Math.max(0, Number(questState?.trust) || 0);
  const trustInfo = getMariaTrustInfo(trust);
  const activeQuest = useMemo(
    () => getActiveQuest(completedQuestIds),
    [completedQuestIds],
  );
  const initialChapter = activeQuest?.chapter || MARIA_CHAPTERS.at(-1)?.id || 1;

  const [panel, setPanel] = useState(() =>
    tutorialStep === "claim-first-quest" ||
    tutorialStep === "onboarding-finish"
      ? "quests"
      : null,
  );
  const [selectedChapter, setSelectedChapter] = useState(initialChapter);
  const [selectedQuestId, setSelectedQuestId] = useState(
    activeQuest?.id || MARIA_QUESTS[0]?.id || null,
  );
  const [dialogueReply, setDialogueReply] = useState(
    "Говори по делу, ученик. У меня смесь на плите.",
  );
  const [radioIndex, setRadioIndex] = useState(0);
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [radioBulletin, setRadioBulletin] = useState(
    DISTRICT_BULLETINS[0] || { title: "Космоволна", text: "Эфир молчит." },
  );
  const [rewardPopup, setRewardPopup] = useState(null);
  const [chapterRewardOpen, setChapterRewardOpen] = useState(false);
  const [trustDetailOpen, setTrustDetailOpen] = useState(false);
  const [selectedTrustLevel, setSelectedTrustLevel] = useState(
    () => trustInfo.next?.level ?? trustInfo.current.level,
  );
  const telegramPlayer = useMemo(() => getTelegramPlayer(), []);

  useEffect(() => {
    if (!activeQuest) return;

    // Текущее поручение всегда раскрыто при первом входе и после перехода
    // к следующему заданию. Раньше здесь сохранялся устаревший id, поэтому
    // визуально карточка могла не меняться после нажатия.
    setSelectedChapter(activeQuest.chapter);
    setSelectedQuestId(activeQuest.id);
  }, [activeQuest?.id, activeQuest?.chapter]);


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

    const handleBack = () => {
      if (panel) setPanel(null);
      else onBack?.();
    };
    backButton.show?.();
    backButton.onClick?.(handleBack);

    return () => {
      backButton.offClick?.(handleBack);
      backButton.hide?.();
    };
  }, [isTutorialActive, onBack, panel, telegramPlayer.webApp]);

  const chapterQuests = useMemo(() => {
    const quests = MARIA_QUESTS.filter((quest) => quest.chapter === selectedChapter);
    const originalOrder = new Map(quests.map((quest, index) => [quest.id, index]));

    return [...quests].sort((a, b) => {
      const aIsCurrent = a.id === activeQuest?.id;
      const bIsCurrent = b.id === activeQuest?.id;
      if (aIsCurrent !== bIsCurrent) return aIsCurrent ? -1 : 1;

      const aCompleted = completedQuestIds.includes(a.id);
      const bCompleted = completedQuestIds.includes(b.id);
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;

      return (originalOrder.get(a.id) || 0) - (originalOrder.get(b.id) || 0);
    });
  }, [activeQuest?.id, completedQuestIds, selectedChapter]);
  const chapter =
    MARIA_CHAPTERS.find((item) => item.id === selectedChapter) ||
    MARIA_CHAPTERS[0];
  const chapterProgress = getChapterProgress(
    selectedChapter,
    completedQuestIds,
  );
  const maxOpenChapter = activeQuest?.chapter || MARIA_CHAPTERS.at(-1)?.id || 1;
  const chapterLocked = selectedChapter > maxOpenChapter;
  const defaultChapterQuest =
    chapterQuests.find((quest) =>
      !completedQuestIds.includes(quest.id) &&
      (!quest.previousQuestId || completedQuestIds.includes(quest.previousQuestId)),
    ) || chapterQuests[0] || null;
  const selectedQuest =
    chapterQuests.find((quest) => quest.id === selectedQuestId) ||
    defaultChapterQuest;
  const expandedQuestId = selectedQuest?.id || null;
  const currentChapterIndex = MARIA_CHAPTERS.findIndex(
    (item) => item.id === selectedChapter,
  );
  const currentProgress = selectedQuest
    ? getQuestProgress(
        selectedQuest,
        inventory,
        seedInventory,
        careInventory,
        clubReputation,
        questState,
        plantCatalog,
      )
    : 0;
  const selectedStatus = selectedQuest
    ? getQuestStatus(selectedQuest, completedQuestIds, currentProgress)
    : "locked";
  const nextReward = trustInfo.next || trustInfo.current;
  const selectedTrustReward =
    MARIA_TRUST_LEVELS.find((level) => level.level === selectedTrustLevel) ||
    trustInfo.current;
  const openTrustPath = (level = trustInfo.next?.level ?? trustInfo.current.level) => {
    setSelectedTrustLevel(level);
    setPanel("path");
    triggerTelegramHaptic("light");
  };

  const selectChapter = (chapterId) => {
    if (isTutorialActive) return;
    const firstIncomplete = MARIA_QUESTS.find(
      (quest) =>
        quest.chapter === chapterId &&
        !completedQuestIds.includes(quest.id),
    );
    setSelectedChapter(chapterId);
    setSelectedQuestId(
      firstIncomplete?.id ||
        MARIA_QUESTS.find((quest) => quest.chapter === chapterId)?.id ||
        null,
    );
    triggerTelegramHaptic("light");
  };

  const moveChapter = (direction) => {
    const nextIndex = currentChapterIndex + direction;
    const nextChapter = MARIA_CHAPTERS[nextIndex];
    if (!nextChapter) return;
    selectChapter(nextChapter.id);
  };

  const updateQuestState = (patch) =>
    onQuestStateChange?.({
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

  const openQuestBoard = () => {
    if (!canOpenBoard) return;
    const nextQuest = getActiveQuest(completedQuestIds);
    if (nextQuest) {
      setSelectedChapter(nextQuest.chapter);
      setSelectedQuestId(nextQuest.id);
    }
    setPanel("quests");
    triggerTelegramHaptic("light");
    if (tutorialStep === "open-maria-board") {
      onTutorialAction?.("open-maria-board");
    }
  };

  const finishQuest = () => {
    if (
      !selectedQuest ||
      selectedStatus !== "ready" ||
      !canClaimTutorialQuest
    ) {
      return;
    }

    if (selectedQuest.objective.type === "deliver") {
      const delivered = onDeliverItems?.({
        itemId: selectedQuest.objective.itemId,
        amount: selectedQuest.objective.amount,
      });
      if (delivered === false) {
        setDialogueReply("Проверь рюкзак. Нужного товара уже не хватает.");
        setPanel("dialogue");
        return;
      }
    }

    if (selectedQuest.objective.type === "deliver-set") {
      const delivered = onDeliverItems?.({
        items: selectedQuest.objective.items,
      });
      if (delivered === false) {
        setDialogueReply(
          "Для полной поставки не хватает урожая. Не пытайся меня обсчитать.",
        );
        setPanel("dialogue");
        return;
      }
    }

    const nextCompleted = [...completedQuestIds, selectedQuest.id];
    const nextTrust = trust + selectedQuest.reward.trust;
    updateQuestState({ completedQuestIds: nextCompleted, trust: nextTrust });
    onRewardClaimed?.({
      questId: selectedQuest.id,
      ...selectedQuest.reward,
    });

    const nextInfo = getMariaTrustInfo(nextTrust);
    const nextQuest = getActiveQuest(nextCompleted);
    triggerTelegramNotification("success");
    setRewardPopup({
      coins: selectedQuest.reward.coins,
      trust: selectedQuest.reward.trust,
      levelUp:
        nextInfo.current.level > trustInfo.current.level
          ? nextInfo.current
          : null,
      finale: selectedQuest.id === "maria-final-delivery",
      slotUnlock: selectedQuest.reward.slotUnlock || null,
      seeds: selectedQuest.reward.seeds || null,
      care: selectedQuest.reward.care || null,
    });
    setDialogueReply(
      nextQuest
        ? `Хорошо. Теперь берись за «${nextQuest.title}».`
        : "Цепочка закрыта. Ключ от лифта теперь твой.",
    );

    if (nextQuest) {
      setSelectedChapter(nextQuest.chapter);
      setSelectedQuestId(nextQuest.id);
    }

    if (
      tutorialStep === "claim-first-quest" &&
      selectedQuest.id === "maria-tabakko-delivery"
    ) {
      onTutorialAction?.("claim-first-quest");
    }

    window.setTimeout(() => setRewardPopup(null), 2400);
  };

  const openRadio = () => {
    if (isTutorialActive) return;
    const nextIndex = radioIndex % DISTRICT_BULLETINS.length;
    setRadioBulletin(DISTRICT_BULLETINS[nextIndex]);
    setRadioIndex((nextIndex + 1) % DISTRICT_BULLETINS.length);
    setPanel("radio");
    setRadioPlaying(true);
    triggerTelegramHaptic("light");
    window.setTimeout(() => setRadioPlaying(false), 1100);
  };

  const nextRadioBulletin = () => {
    const nextIndex = radioIndex % DISTRICT_BULLETINS.length;
    setRadioBulletin(DISTRICT_BULLETINS[nextIndex]);
    setRadioIndex((nextIndex + 1) % DISTRICT_BULLETINS.length);
    setRadioPlaying(true);
    triggerTelegramHaptic("light");
    window.setTimeout(() => setRadioPlaying(false), 1100);
  };

  const talkToMaria = (choiceId) => {
    setDialogueReply(
      getDialogueText(
        choiceId,
        activeQuest,
        trustInfo,
        trust,
        clubReputation,
        radioBulletin,
      ),
    );
    triggerTelegramHaptic("light");
  };

  const openDialogue = () => {
    if (isTutorialActive) return;
    setDialogueReply("Говори по делу, ученик. У меня смесь на плите.");
    setPanel("dialogue");
    triggerTelegramHaptic("light");
  };

  return (
    <main
      className={`maria-house-screen${radioPlaying ? " radio-playing" : ""}${
        panel ? ` panel-${panel}` : ""
      }`}
      style={{
        "--maria-house-background": `url(${ASSETS.locations.mariaIvanovnaHouse.background})`,
      }}
    >
      <section className="maria-house-room" aria-label="Комната Марии Ивановны">
        {!isTutorialActive && (
          <button
            type="button"
            className="maria-trust-peek"
            onClick={() => openTrustPath()}
            aria-label={`Доверие Марии Ивановны. Уровень ${trustInfo.current.level}`}
          >
            <span className="maria-trust-medal">
              <b>{trustInfo.current.level}</b>
              <small>LVL</small>
            </span>
            <span className="maria-trust-peek-copy">
              <small>ДОВЕРИЕ МАРИИ</small>
              <strong>{trustInfo.current.title}</strong>
              <i>
                <b style={{ width: `${trustInfo.progress}%` }} />
              </i>
              <em>
                {trustInfo.next
                  ? `${Math.max(0, trustInfo.next.required - trust)} до следующей награды`
                  : "Все награды открыты"}
              </em>
            </span>
            <span className="maria-trust-open" aria-hidden="true">›</span>
          </button>
        )}

        <button
          type="button"
          className="maria-house-object maria-house-board"
          onClick={openQuestBoard}
          aria-label="Открыть доску поручений"
          disabled={isTutorialActive && !canOpenBoard}
        >
          <img
            src={ASSETS.locations.mariaIvanovnaHouse.questBoard}
            alt="Доска поручений"
            draggable="false"
          />
          {activeQuest && <b className="maria-object-alert">!</b>}
        </button>

        <button
          type="button"
          className="maria-house-object maria-house-radio"
          onClick={openRadio}
          aria-label="Включить Космоволну 4.20 FM"
          disabled={isTutorialActive}
        >
          <img
            src={ASSETS.locations.mariaIvanovnaHouse.radio}
            alt="Космоволна 4.20 FM"
            draggable="false"
          />
          <span className="maria-radio-waves" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </button>

        <button
          type="button"
          className="maria-house-object maria-house-character"
          onClick={openDialogue}
          aria-label="Поговорить с Марией Ивановной"
          disabled={isTutorialActive}
        >
          <img
            src={ASSETS.characters.mariaIvanovna}
            alt="Мария Ивановна"
            draggable="false"
          />
        </button>
      </section>

      {!isTutorialActive && !panel && (
        <button
          className="maria-house-exit"
          type="button"
          onClick={onBack}
        >
          <span>Вернуться на район</span>
          <i aria-hidden="true">→</i>
        </button>
      )}

      {panel && (
        <div className={`maria-panel-overlay mode-${panel}`} onMouseDown={(event) => { if (event.target === event.currentTarget && !isTutorialActive) setPanel(null); }}>
          {panel === "quests" && (
            <section
              className="maria-panel maria-quests-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Доска поручений"
            >
              <header className="maria-panel-header maria-board-header">
                <div className="maria-board-title">
                  <small>ЛИЧНАЯ ДОСКА</small>
                  <h2>Поручения Марии Ивановны</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPanel(null)}
                  aria-label="Закрыть доску"
                  disabled={isTutorialActive}
                >
                  ×
                </button>
              </header>

              <section className="maria-chapter-switcher" aria-label="Выбранная глава">
                <button
                  type="button"
                  className="maria-chapter-switcher__arrow"
                  onClick={() => moveChapter(-1)}
                  disabled={currentChapterIndex <= 0 || isTutorialActive}
                  aria-label="Предыдущая глава"
                >
                  ‹
                </button>

                <div className="maria-chapter-switcher__card">
                  <div className="maria-chapter-switcher__eyebrow">
                    <span>ГЛАВА {chapter.id} ИЗ {MARIA_CHAPTERS.length}</span>
                    <b>{chapterProgress.complete} / {chapterProgress.total}</b>
                  </div>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.subtitle}</p>
                  <div className="maria-chapter-switcher__progress">
                    <i><b style={{ width: `${chapterProgress.percent}%` }} /></i>
                    <span>{chapterProgress.complete} из {chapterProgress.total} выполнено</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="maria-chapter-switcher__arrow"
                  onClick={() => moveChapter(1)}
                  disabled={currentChapterIndex >= MARIA_CHAPTERS.length - 1 || isTutorialActive}
                  aria-label="Следующая глава"
                >
                  ›
                </button>
              </section>

              {chapterLocked && (
                <div className="maria-chapter-preview-note maria-chapter-preview-note--fixed">
                  <span>⌁</span>
                  <div>
                    <strong>Эта глава пока закрыта</strong>
                    <small>Заверши предыдущую главу. Содержание можно посмотреть заранее.</small>
                  </div>
                </div>
              )}

              <section className="maria-quest-board" aria-label={`Поручения главы ${chapter.id}`}>
                <div className="maria-quest-board__heading">
                  <div>
                    <small>ПОРУЧЕНИЯ ГЛАВЫ</small>
                    <strong>Нажми на поручение, чтобы раскрыть</strong>
                  </div>
                  <span>{chapterProgress.complete}/{chapterProgress.total}</span>
                </div>

                <div className="maria-quest-list">
                  {chapterQuests.map((quest) => {
                    const questNumber = MARIA_QUESTS
                      .filter((item) => item.chapter === selectedChapter)
                      .findIndex((item) => item.id === quest.id) + 1;
                    const progress = getQuestProgress(
                      quest,
                      inventory,
                      seedInventory,
                      careInventory,
                      clubReputation,
                      questState,
                      plantCatalog,
                    );
                    const questTarget = quest.objective?.amount || 1;
                    const status = getQuestStatus(quest, completedQuestIds, progress);
                    const shownProgress = status === "completed"
                      ? questTarget
                      : Math.min(progress, questTarget);
                    const isSelected = expandedQuestId === quest.id;
                    const isCurrentQuest = activeQuest?.id === quest.id;
                    const rewardExtras = [
                      quest.reward?.slotUnlock ? `Ведро ${quest.reward.slotUnlock}` : null,
                      quest.reward?.seeds ? `${Object.values(quest.reward.seeds).reduce((a, b) => a + b, 0)} семени` : null,
                      quest.reward?.care?.nutrition ? `${quest.reward.care.nutrition} раствор` : null,
                      quest.reward?.care?.mariaMix ? `${quest.reward.care.mariaMix} смесь` : null,
                    ].filter(Boolean);

                    return (
                      <article
                        key={quest.id}
                        className={`maria-quest-accordion status-${status}${isSelected ? " open" : ""}${isCurrentQuest ? " current" : ""}`}
                      >
                        <button
                          type="button"
                          className="maria-quest-accordion__head"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setSelectedQuestId(quest.id);
                            triggerTelegramHaptic("light");
                          }}
                          aria-expanded={isSelected}
                          aria-controls={`maria-quest-body-${quest.id}`}
                        >
                          <span className="maria-quest-accordion__number">
                            {status === "completed" ? "✓" : questNumber}
                          </span>
                          <span className="maria-quest-accordion__title">
                            <small>{isCurrentQuest ? "ТЕКУЩЕЕ ПОРУЧЕНИЕ" : `ПОРУЧЕНИЕ ${questNumber}`}</small>
                            <strong>{quest.title}</strong>
                          </span>
                          <span className="maria-quest-accordion__status">
                            <b>{statusLabel(status)}</b>
                            <small>{shownProgress}/{questTarget}</small>
                          </span>
                          <i aria-hidden="true">⌄</i>
                        </button>

                        {isSelected && (
                          <div
                            id={`maria-quest-body-${quest.id}`}
                            className="maria-quest-accordion__body"
                          >
                            <p>
                              {status === "locked"
                                ? "Сначала заверши предыдущее поручение в цепочке."
                                : quest.description}
                            </p>

                            <div className="maria-quest-accordion__track">
                              <i style={{ width: `${Math.min(100, (shownProgress / questTarget) * 100)}%` }} />
                            </div>

                            <div className="maria-quest-accordion__meta">
                              <span>
                                <small>ПРОГРЕСС</small>
                                <strong>{shownProgress} из {questTarget}</strong>
                              </span>
                              <span className="maria-quest-accordion__reward">
                                <small>НАГРАДА</small>
                                <MariaRewardTokens coins={quest.reward.coins} trust={quest.reward.trust} compact />
                              </span>
                            </div>

                            {rewardExtras.length > 0 && (
                              <div className="maria-quest-accordion__bonus">
                                <small>ДОПОЛНИТЕЛЬНО</small>
                                <strong>{rewardExtras.join(" · ")}</strong>
                              </div>
                            )}

                            {status === "ready" ? (
                              <button
                                type="button"
                                className="maria-quest-complete maria-quest-accordion__claim"
                                disabled={!canClaimTutorialQuest}
                                onClick={finishQuest}
                              >
                                Забрать награду
                              </button>
                            ) : (
                              <div className={`maria-quest-accordion__message state-${status}`}>
                                {status === "completed"
                                  ? "Поручение выполнено"
                                  : status === "locked"
                                    ? "Закрыто предыдущим поручением"
                                    : `Осталось выполнить: ${Math.max(0, questTarget - shownProgress)}`}
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>

              <button
                type="button"
                className={`maria-chapter-reward-card maria-chapter-reward-card--fixed${chapterProgress.complete === chapterProgress.total ? " unlocked" : ""}`}
                onClick={() => setChapterRewardOpen(true)}
              >
                <span className="maria-chapter-reward-icon">{chapter.reward?.icon || "✦"}</span>
                <div>
                  <small>НАГРАДА ЗА ГЛАВУ</small>
                  <strong>{chapter.reward?.title || "Новая возможность"}</strong>
                </div>
                <b>{chapterProgress.complete === chapterProgress.total ? "ОТКРЫТО" : `${chapterProgress.complete}/${chapterProgress.total}`}</b>
              </button>
            </section>
          )}

          {panel === "dialogue" && (
            <section
              className="maria-panel maria-talk-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Разговор с Марией Ивановной"
            >
              <header className="maria-panel-header maria-talk-header">
                <div>
                  <span>РАЗГОВОР</span>
                  <h2>Мария Ивановна</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPanel(null)}
                  aria-label="Вернуться в комнату"
                >
                  ×
                </button>
              </header>

              <div className="maria-conversation-stage">
                <div
                  key={dialogueReply}
                  className="maria-speech-bubble"
                  aria-live="polite"
                >
                  <small>МАРИЯ ИВАНОВНА</small>
                  <p>{dialogueReply}</p>
                </div>
                <img
                  src={ASSETS.characters.mariaIvanovna}
                  alt="Мария Ивановна"
                  draggable="false"
                />
              </div>

              <div className="maria-talk-actions" aria-label="Варианты ответа">
                {MARIA_DIALOGUE_CHOICES.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => talkToMaria(choice.id)}
                  >
                    <span>{choice.icon}</span>
                    <span>
                      <strong>{choice.label}</strong>
                      <small>{choice.hint}</small>
                    </span>
                    <i>›</i>
                  </button>
                ))}
                <button
                  type="button"
                  className="path"
                  onClick={() => openTrustPath()}
                >
                  <span>♥</span>
                  <span>
                    <strong>Посмотреть доверие</strong>
                    <small>
                      Следом: {nextReward.icon} {nextReward.reward}
                    </small>
                  </span>
                  <i>›</i>
                </button>
              </div>
            </section>
          )}

          {panel === "radio" && (
            <section
              className="maria-panel maria-radio-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Космоволна 4.20 FM"
            >
              <header className="maria-panel-header maria-radio-header">
                <div>
                  <span>ЭФИР РАЙОНА</span>
                  <h2>Космоволна 4.20 FM</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPanel(null)}
                  aria-label="Выключить радио"
                >
                  ×
                </button>
              </header>

              <div className="maria-radio-compact">
                <div className="maria-radio-mini-device">
                  <img
                    src={ASSETS.locations.mariaIvanovnaHouse.radio}
                    alt="Космо-радио"
                    draggable="false"
                  />
                  <span className="maria-radio-live">
                    <i /> ЭФИР
                  </span>
                </div>
                <div className="maria-radio-transcript" aria-live="polite">
                  <small>СООБЩЕНИЕ РАЙОНА</small>
                  <h3>{radioBulletin.title}</h3>
                  <p>{radioBulletin.text}</p>
                </div>
              </div>

              <button
                type="button"
                className="maria-radio-next"
                onClick={nextRadioBulletin}
              >
                <span>Следующая подсказка</span>
                <i aria-hidden="true">↻</i>
              </button>
            </section>
          )}

          {panel === "path" && (
            <section
              className="maria-panel maria-path-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Путь доверия"
            >
              <header className="maria-panel-header">
                <div>
                  <span>ДОВЕРИЕ · {trust}</span>
                  <h2>Путь ученика</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPanel(null)}
                  aria-label="Закрыть"
                >
                  ×
                </button>
              </header>

              <div className="maria-path-summary">
                <span>{trustInfo.current.icon}</span>
                <div>
                  <small>ТЕКУЩИЙ УРОВЕНЬ</small>
                  <strong>
                    LVL {trustInfo.current.level} · {trustInfo.current.title}
                  </strong>
                  <p>
                    {trustInfo.next
                      ? `${trustInfo.next.required - trust} доверия до «${
                          trustInfo.next.reward
                        }»`
                      : "Все награды доверия открыты"}
                  </p>
                  <i>
                    <b style={{ width: `${trustInfo.progress}%` }} />
                  </i>
                </div>
              </div>

              <div className="maria-path-hint"><span>✦</span><p>Нажми на награду, чтобы увидеть, что она откроет.</p></div>

              <div className="maria-level-list">
                {MARIA_TRUST_LEVELS.map((level) => {
                  const unlocked = trust >= level.required;
                  const current = level.level === trustInfo.current.level;
                  const selected = level.level === selectedTrustReward.level;
                  return (
                    <button
                      type="button"
                      key={level.level}
                      onClick={() => {
                        setSelectedTrustLevel(level.level);
                        setTrustDetailOpen(true);
                        triggerTelegramHaptic("light");
                      }}
                      className={`${unlocked ? "unlocked" : "locked"}${
                        current ? " current" : ""
                      }${selected ? " selected" : ""}`}
                      style={{ "--level-order": level.level }}
                    >
                      <span className="maria-level-icon">
                        {unlocked ? level.icon : "◇"}
                      </span>
                      <div>
                        <small>LVL {level.level} · {level.title}</small>
                        <strong>{level.reward}</strong>
                        <p>
                          {unlocked
                            ? "Награда уже доступна"
                            : `${Math.max(0, level.required - trust)} доверия до открытия`}
                        </p>
                      </div>
                      <b>{unlocked ? "✓" : "›"}</b>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {chapterRewardOpen && (
            <div className="maria-info-layer" onMouseDown={(event) => event.target === event.currentTarget && setChapterRewardOpen(false)}>
              <section className="maria-info-modal" role="dialog" aria-modal="true">
                <button type="button" onClick={() => setChapterRewardOpen(false)}>×</button>
                <span className="maria-info-icon">{chapter.reward?.icon || "✦"}</span>
                <small>{chapter.reward?.accent || "НАГРАДА ГЛАВЫ"}</small>
                <h3>{chapter.reward?.title || "Новая возможность"}</h3>
                <p>{chapter.reward?.description || chapter.subtitle}</p>
                <strong>{chapterProgress.complete === chapterProgress.total ? "Уже открыто ✓" : `Заверши ${chapterProgress.total - chapterProgress.complete} поручения`}</strong>
              </section>
            </div>
          )}

          {trustDetailOpen && (
            <div className="maria-info-layer" onMouseDown={(event) => event.target === event.currentTarget && setTrustDetailOpen(false)}>
              <section className="maria-info-modal trust-info" role="dialog" aria-modal="true">
                <button type="button" onClick={() => setTrustDetailOpen(false)}>×</button>
                <span className="maria-info-icon">{selectedTrustReward.icon}</span>
                <small>LVL {selectedTrustReward.level} · {selectedTrustReward.title}</small>
                <h3>{selectedTrustReward.unlockTitle}</h3>
                <p>{selectedTrustReward.unlockDescription}</p>
                <div className="maria-info-unlocks">{selectedTrustReward.unlocks?.map((item) => <span key={item}>{item}</span>)}</div>
                <strong>{trust >= selectedTrustReward.required ? "Открыто ✓" : `Нужно ещё ${selectedTrustReward.required - trust} доверия`}</strong>
              </section>
            </div>
          )}
        </div>
      )}

      {rewardPopup && (
        <div className="maria-reward-popup" role="status">
          <div className="maria-reward-popup__head">
            <span aria-hidden="true">✓</span>
            <div><small>ПОРУЧЕНИЕ ВЫПОЛНЕНО</small><strong>Награда получена</strong></div>
          </div>
          <MariaRewardTokens coins={rewardPopup.coins} trust={rewardPopup.trust} />
          {rewardPopup.levelUp && (
            <em>Открыто: {rewardPopup.levelUp.reward}</em>
          )}
          {rewardPopup.finale && <em>Ключ от старого лифта открыт</em>}
        </div>
      )}
    </main>
  );
}
