import { useRef, useState } from "react";

import { JOE_TRUST_LEVELS, getJoeTrustInfo } from "./joeProgression";

const QUESTS = [
  {
    id: "joe-first-delivery",
    title: "Первый заказ",
    label: "Дело Джо",
    description: "Району нужны свежие Кислоплоды. Принеси Дяде Джо три штуки.",
    icon: "🟢",
    previousQuestId: null,
    objective: { type: "deliver", itemId: "greenTomato", amount: 3 },
    reward: { coins: 300, trust: 25 },
  },
  {
    id: "joe-club-request",
    title: "Просьба клуба",
    label: "Связь с клубом",
    description: "Продай клубу пять Кислоплодов. Джо хочет проверить, умеешь ли ты работать не только на себя.",
    icon: "♣",
    previousQuestId: "joe-first-delivery",
    objective: { type: "club-sale", itemId: "greenTomato", amount: 5 },
    reward: { coins: 350, trust: 30 },
  },
  {
    id: "joe-dark-seed",
    title: "Тёмное семя",
    label: "Дело магазина",
    description: "Купи хотя бы одно семя Люмен-травы. У Зорика появилась поставка, о которой лучше не шуметь.",
    icon: "✦",
    previousQuestId: "joe-club-request",
    objective: { type: "own-seed", itemId: "lumenweed", amount: 1 },
    reward: { coins: 200, trust: 20 },
  },
  {
    id: "joe-strange-harvest",
    title: "Странный урожай",
    label: "Особое дело",
    description: "Вырасти Люмен-траву и передай один плод Джо. Покупатель имени не назвал, но платит щедро.",
    icon: "◉",
    previousQuestId: "joe-dark-seed",
    objective: { type: "deliver", itemId: "lumenweed", amount: 1 },
    reward: { coins: 700, trust: 35 },
  },
  {
    id: "joe-club-status",
    title: "Свой среди своих",
    label: "Клубная проверка",
    description: "Заработай 50 репутации клуба. Джо хочет убедиться, что район действительно начал тебя принимать.",
    icon: "★",
    previousQuestId: "joe-strange-harvest",
    objective: { type: "club-reputation", amount: 50 },
    reward: { coins: 1000, trust: 50 },
  },
  {
    id: "joe-quality-harvest",
    title: "Не просто урожай",
    label: "Мастерство выращивания",
    description: "Получи Кислоплод качеством не ниже хорошего. Обычного ожидания таймера уже недостаточно.",
    icon: "◆",
    previousQuestId: "joe-club-status",
    objective: { type: "quality-rank", itemId: "greenTomato", rank: 1, amount: 1 },
    reward: { coins: 500, trust: 20 },
  },
  {
    id: "joe-nutrition-care",
    title: "Рука садовода",
    label: "Испытание Джо",
    description: "Используй питательный раствор во время роста. Хороший урожай начинается с правильного решения.",
    icon: "🌿",
    previousQuestId: "joe-quality-harvest",
    objective: { type: "care-use", careType: "nutrition", amount: 1 },
    reward: { coins: 450, trust: 20 },
  },
  {
    id: "joe-rare-discovery",
    title: "Знак редкости",
    label: "Финал главы",
    description: "Открой редкое качество любого растения. Такой экземпляр докажет, что ты уже не случайный гость.",
    icon: "✹",
    previousQuestId: "joe-nutrition-care",
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
  if (objective.type === "quality-rank") return (plantCatalog?.[objective.itemId]?.bestQualityRank ?? -1) >= objective.rank ? 1 : 0;
  if (objective.type === "care-use") return questState?.careUses?.[objective.careType] || 0;
  if (objective.type === "rare-discovery") return Object.values(plantCatalog || {}).some((record) => (record?.qualities?.rare || 0) > 0) ? 1 : 0;
  return 0;
}

export default function JoeHouseScreen({
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
  const completedQuestIds = Array.isArray(questState?.completedQuestIds) ? questState.completedQuestIds : [];
  const trust = Math.max(0, Number(questState?.trust) || 0);
  const trustInfo = getJoeTrustInfo(trust);
  const [panel, setPanel] = useState(null);
  const [section, setSection] = useState("active");
  const [cardIndex, setCardIndex] = useState(0);
  const [message, setMessage] = useState("На доске — вся цепочка. На полке — твой путь ученика.");
  const [rewardPopup, setRewardPopup] = useState(null);
  const touchStartY = useRef(null);
  const isDev = import.meta.env.DEV;

  const activeQuests = QUESTS.filter((quest) => !completedQuestIds.includes(quest.id));
  const archivedQuests = QUESTS.filter((quest) => completedQuestIds.includes(quest.id));
  const cards = section === "archive" ? archivedQuests : activeQuests;
  const safeIndex = Math.min(cardIndex, Math.max(0, cards.length - 1));
  const selectedQuest = cards[safeIndex] || null;
  const isLocked = Boolean(selectedQuest?.previousQuestId && !completedQuestIds.includes(selectedQuest.previousQuestId));
  const currentProgress = selectedQuest ? getQuestProgress(selectedQuest, inventory, seedInventory, clubReputation, questState, plantCatalog) : 0;
  const target = selectedQuest?.objective?.amount || 1;
  const canComplete = Boolean(selectedQuest && !isLocked && currentProgress >= target);

  const updateQuestState = (patch) => onQuestStateChange?.({
    ...questState,
    completedQuestIds,
    trust,
    clubSales: { greenTomato: questState?.clubSales?.greenTomato || 0, lumenweed: questState?.clubSales?.lumenweed || questState?.clubSales?.psychomor || 0 },
    careUses: { water: questState?.careUses?.water || 0, nutrition: questState?.careUses?.nutrition || 0, joeMix: questState?.careUses?.joeMix || 0 },
    ...patch,
  });

  const finishQuest = ({ force = false } = {}) => {
    if (!selectedQuest || completedQuestIds.includes(selectedQuest.id)) return;
    if (!force && (!canComplete || isLocked)) return;
    if (!force && selectedQuest.objective.type === "deliver") {
      const delivered = onDeliverItems?.({ itemId: selectedQuest.objective.itemId, amount: selectedQuest.objective.amount });
      if (delivered === false) return setMessage("Проверь инвентарь: товара уже не хватает.");
    }
    const nextCompleted = [...completedQuestIds, selectedQuest.id];
    const nextTrust = trust + selectedQuest.reward.trust;
    updateQuestState({ completedQuestIds: nextCompleted, trust: nextTrust });
    onRewardClaimed?.({ questId: selectedQuest.id, coins: selectedQuest.reward.coins, trust: selectedQuest.reward.trust });
    const nextInfo = getJoeTrustInfo(nextTrust);
    setRewardPopup({ coins: selectedQuest.reward.coins, trust: selectedQuest.reward.trust, levelUp: nextInfo.current.level > trustInfo.current.level ? nextInfo.current : null });
    setMessage("Дело закрыто. Награда твоя, записка ушла в архив.");
    setCardIndex(0);
    window.setTimeout(() => setRewardPopup(null), 2300);
  };

  const addDevTrust = () => updateQuestState({ trust: trust + 25 });
  const resetJoe = () => updateQuestState({ completedQuestIds: [], trust: 0, clubSales: { greenTomato: 0, lumenweed: 0 }, careUses: { water: 0, nutrition: 0, joeMix: 0 } });
  const moveCard = (direction) => cards.length > 1 && setCardIndex((i) => (i + direction + cards.length) % cards.length);
  const setCurrentSection = (next) => { setSection(next); setCardIndex(0); };

  return (
    <main className="joe3-house">
      <style>{`
        *{box-sizing:border-box}.joe3-house{position:relative;width:100%;height:100dvh;min-height:620px;overflow:hidden;color:#f7ecd4;font-family:Inter,"Segoe UI",system-ui,sans-serif;background:radial-gradient(circle at 50% 12%,rgba(255,184,85,.16),transparent 30%),linear-gradient(180deg,#2d2221,#191416 63%,#0e0c0e)}.joe3-house:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,.015) 0 2px,transparent 2px 58px),linear-gradient(180deg,transparent 72%,rgba(0,0,0,.3) 72%);pointer-events:none}.joe3-top{position:relative;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:max(54px,calc(env(safe-area-inset-top) + 18px)) 16px 10px}.joe3-back,.joe3-close{border:1px solid rgba(255,225,170,.14);color:#f8e9c9;background:rgba(22,17,19,.84);cursor:pointer}.joe3-back{min-height:42px;padding:0 14px;border-radius:999px;font:inherit;font-size:12px;font-weight:900}.joe3-heading{text-align:right}.joe3-kicker{font-size:9px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:rgba(255,226,178,.48)}.joe3-title{font-family:Georgia,serif;font-size:21px;color:#ffedc4}.joe3-room{position:absolute;inset:116px 0 0}.joe3-lamp{position:absolute;top:1%;left:50%;width:52px;height:28px;transform:translateX(-50%);border-radius:50% 50% 20% 20%;background:#5b4331;box-shadow:0 4px 0 #302521,0 16px 58px rgba(255,175,74,.3)}.joe3-object{position:absolute;z-index:5;border:0;cursor:pointer}.joe3-board{top:12%;left:7%;width:min(34vw,140px);aspect-ratio:1.18;border:5px solid #4e3428;border-radius:14px;background:#6b4935;box-shadow:0 14px 24px rgba(0,0,0,.42);transform:rotate(-2deg)}.joe3-note{position:absolute;width:40%;height:43%;border-radius:3px;background:#d7bf88}.joe3-note:nth-child(1){top:14%;left:9%;transform:rotate(-5deg)}.joe3-note:nth-child(2){top:22%;right:8%;transform:rotate(5deg);background:#b9a875}.joe3-note:nth-child(3){bottom:8%;left:29%;transform:rotate(2deg);background:#d1b37c}.joe3-label{position:absolute;left:50%;bottom:-28px;transform:translateX(-50%);white-space:nowrap;font-size:10px;font-weight:900;color:rgba(255,235,201,.72)}.joe3-path{top:39%;left:8%;width:108px;height:72px;border-radius:14px;background:linear-gradient(145deg,#5f4634,#30251f);box-shadow:0 12px 20px rgba(0,0,0,.38),inset 0 0 0 3px #76563d;color:#ffe5ae;font-size:30px}.joe3-path small{display:block;margin-top:3px;font-size:9px;font-weight:900;color:#f3d6a3}.joe3-character{right:16%;bottom:22%;width:min(42vw,175px);aspect-ratio:.78;background:transparent;animation:joe3idle 3.2s ease-in-out infinite}.joe3-shadow{position:absolute;left:50%;bottom:-4px;width:85%;height:18px;transform:translateX(-50%);border-radius:50%;background:rgba(0,0,0,.5);filter:blur(7px)}.joe3-body{position:absolute;left:50%;bottom:0;width:72%;height:59%;transform:translateX(-50%);border-radius:42% 42% 17% 17%;background:#535d44}.joe3-head{position:absolute;left:50%;top:15%;width:62%;height:43%;transform:translateX(-50%);border-radius:47%;background:#c79160}.joe3-hat{position:absolute;top:4%;left:50%;width:82%;height:24%;transform:translateX(-50%);border-radius:60% 60% 20% 20%;background:#38312e}.joe3-eye{position:absolute;top:43%;width:6px;height:6px;border-radius:50%;background:#211918}.joe3-eye.left{left:29%}.joe3-eye.right{right:29%}.joe3-trust{position:absolute;z-index:9;left:14px;right:14px;bottom:94px;padding:11px 13px;border:1px solid rgba(255,220,157,.12);border-radius:16px;background:rgba(24,19,21,.92)}.joe3-trust-top{display:flex;justify-content:space-between;gap:8px;margin-bottom:7px;font-size:10px;font-weight:900}.joe3-track{height:8px;overflow:hidden;border-radius:999px;background:rgba(255,255,255,.08)}.joe3-fill{height:100%;background:linear-gradient(90deg,#b87c3d,#efc069)}.joe3-message{position:absolute;z-index:10;left:14px;right:14px;bottom:max(16px,env(safe-area-inset-bottom));min-height:66px;padding:13px 16px;border:1px solid rgba(255,224,165,.13);border-radius:18px;background:rgba(24,19,21,.95)}.joe3-name{margin-bottom:4px;color:#e7ae58;font-size:9px;font-weight:950;letter-spacing:.14em;text-transform:uppercase}.joe3-text{margin:0;font-size:12px;font-weight:650;line-height:1.35}.joe3-overlay{position:fixed;z-index:100;inset:0;display:flex;align-items:center;justify-content:center;padding:max(64px,env(safe-area-inset-top)) 12px max(16px,env(safe-area-inset-bottom));background:rgba(8,7,8,.8);backdrop-filter:blur(9px)}.joe3-panel{width:min(100%,430px);max-height:86dvh;overflow:auto;padding:15px;border:5px solid #4d3428;border-radius:22px;background:#624432;box-shadow:0 25px 65px rgba(0,0,0,.65)}.joe3-panel-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.joe3-panel-title{margin:0;font-family:Georgia,serif;font-size:23px;color:#ffe9bc}.joe3-close{width:38px;height:38px;border-radius:50%;font-size:20px}.joe3-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}.joe3-tab{min-height:40px;border:1px solid rgba(255,227,175,.1);border-radius:13px;color:rgba(255,236,204,.57);font:inherit;font-size:11px;font-weight:900;background:rgba(27,19,20,.32)}.joe3-tab.active{color:#ffdda0;background:rgba(61,38,29,.78)}.joe3-card{position:relative;min-height:420px;padding:21px 18px 17px;border-radius:8px;color:#36251e;background:linear-gradient(rgba(73,47,31,.035) 1px,transparent 1px),#dcc590;background-size:100% 22px;box-shadow:0 14px 22px rgba(0,0,0,.3)}.joe3-card.locked{filter:saturate(.55)}.joe3-lock{position:absolute;inset:0;z-index:2;display:flex;align-items:center;justify-content:center;padding:24px;border-radius:inherit;background:rgba(71,53,39,.54);backdrop-filter:blur(2px)}.joe3-lock div{padding:16px;border-radius:16px;text-align:center;background:rgba(232,211,166,.94);font-size:12px;font-weight:900}.joe3-count{position:absolute;top:14px;right:15px;font-size:9px;font-weight:950;color:rgba(54,35,26,.48)}.joe3-badge{display:inline-flex;margin-bottom:8px;padding:4px 8px;border-radius:999px;background:rgba(81,52,32,.1);font-size:8px;font-weight:950;text-transform:uppercase}.joe3-icon{font-size:34px}.joe3-card h3{margin:7px 0 0;font-family:Georgia,serif;font-size:27px}.joe3-desc{margin:11px 0 16px;font-size:12px;font-weight:650;line-height:1.45}.joe3-progress-box{margin-top:24px;padding:12px;border-radius:14px;background:rgba(91,61,38,.1)}.joe3-progress-top{display:flex;justify-content:space-between;margin-bottom:8px;font-size:10px;font-weight:900}.joe3-progress{height:10px;overflow:hidden;border-radius:999px;background:rgba(71,45,29,.17)}.joe3-progress span{display:block;height:100%;background:linear-gradient(90deg,#638243,#a8c469)}.joe3-rewards{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.joe3-reward{padding:6px 8px;border-radius:10px;background:rgba(87,57,35,.1);font-size:10px;font-weight:900}.joe3-action,.joe3-dev{width:100%;min-height:44px;margin-top:13px;border:0;border-radius:14px;color:#fff2ce;font:inherit;font-size:12px;font-weight:950;background:linear-gradient(180deg,#79994d,#516c32);box-shadow:0 6px 0 #344620;cursor:pointer}.joe3-action:disabled{opacity:.5}.joe3-dev{background:linear-gradient(180deg,#8f5a9f,#5f376c);box-shadow:0 6px 0 #3e2348}.joe3-nav{display:flex;justify-content:space-between;align-items:center;margin-top:10px}.joe3-nav button{width:42px;height:42px;border:1px solid rgba(255,225,170,.12);border-radius:50%;color:#f7e6c6;background:rgba(26,19,20,.43);font-size:20px}.joe3-dots{display:flex;gap:5px}.joe3-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,235,200,.24)}.joe3-dot.active{width:18px;border-radius:999px;background:#e9b45d}.joe3-level-list{display:grid;gap:9px}.joe3-level{display:grid;grid-template-columns:48px 1fr auto;gap:10px;align-items:center;padding:11px;border-radius:15px;background:rgba(28,20,21,.42);border:1px solid rgba(255,224,166,.09)}.joe3-level.unlocked{background:rgba(72,48,31,.7);border-color:rgba(239,180,87,.28)}.joe3-level-icon{display:grid;place-items:center;width:44px;height:44px;border-radius:13px;background:rgba(255,210,132,.1);font-size:23px}.joe3-level strong{display:block;font-size:12px}.joe3-level small{display:block;margin-top:3px;color:rgba(255,234,199,.6);font-size:10px}.joe3-level-status{font-size:10px;font-weight:900;color:#efbd70}.joe3-devbar{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.joe3-popup{position:fixed;z-index:200;top:50%;left:50%;min-width:235px;padding:22px;border-radius:22px;transform:translate(-50%,-50%);text-align:center;background:rgba(25,19,18,.98);box-shadow:0 0 80px rgba(255,168,54,.16)}.joe3-popup strong{display:block;font-family:Georgia,serif;font-size:25px}.joe3-level-up{margin-top:9px;color:#fff1c8}@keyframes joe3idle{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
      `}</style>

      <header className="joe3-top">
        <button className="joe3-back" type="button" onClick={onBack}>← В район</button>
        <div className="joe3-heading"><div className="joe3-kicker">Старый район</div><div className="joe3-title">Дом Дяди Джо</div></div>
      </header>

      <section className="joe3-room">
        <div className="joe3-lamp" />
        <button className="joe3-object joe3-board" type="button" onClick={() => { setPanel("board"); setCurrentSection("active"); }}>
          <span className="joe3-note" /><span className="joe3-note" /><span className="joe3-note" /><span className="joe3-label">Все дела</span>
        </button>
        <button className="joe3-object joe3-path" type="button" onClick={() => setPanel("path")}>🏅<small>Путь ученика</small></button>
        <button className="joe3-object joe3-character" type="button" onClick={() => setMessage(`Твой статус — ${trustInfo.current.title.toLowerCase()}. Следующая награда уже видна на полке.`)}>
          <span className="joe3-shadow" /><span className="joe3-body" /><span className="joe3-head"><span className="joe3-hat" /><span className="joe3-eye left" /><span className="joe3-eye right" /></span>
        </button>
        <div className="joe3-trust"><div className="joe3-trust-top"><span>Доверие Джо · уровень {trustInfo.current.level}</span><strong>{trustInfo.current.title} · {trustInfo.text}</strong></div><div className="joe3-track"><div className="joe3-fill" style={{ width: `${trustInfo.progress}%` }} /></div></div>
        <div className="joe3-message"><div className="joe3-name">Дядя Джо</div><p className="joe3-text">{message}</p></div>
      </section>

      {panel === "board" && (
        <div className="joe3-overlay" onMouseDown={(e) => e.target === e.currentTarget && setPanel(null)}>
          <section className="joe3-panel">
            <div className="joe3-panel-top"><h2 className="joe3-panel-title">Дела Джо</h2><button className="joe3-close" onClick={() => setPanel(null)}>×</button></div>
            <div className="joe3-tabs"><button className={`joe3-tab${section === "active" ? " active" : ""}`} onClick={() => setCurrentSection("active")}>Вся цепочка · {activeQuests.length}</button><button className={`joe3-tab${section === "archive" ? " active" : ""}`} onClick={() => setCurrentSection("archive")}>Архив · {archivedQuests.length}</button></div>
            {selectedQuest ? (
              <div onTouchStart={(e) => { touchStartY.current = e.touches[0]?.clientY ?? null; }} onTouchEnd={(e) => { const end = e.changedTouches[0]?.clientY ?? touchStartY.current; if (touchStartY.current !== null && Math.abs(end - touchStartY.current) > 45) moveCard(end < touchStartY.current ? 1 : -1); touchStartY.current = null; }}>
                <article className={`joe3-card${isLocked ? " locked" : ""}`}>
                  {isLocked && <div className="joe3-lock"><div>🔒<br />Сначала выполни предыдущее дело.<br /><small>Карточку можно читать заранее.</small></div></div>}
                  <div className="joe3-count">{safeIndex + 1}/{cards.length}</div><div className="joe3-badge">{selectedQuest.label}</div><div className="joe3-icon">{selectedQuest.icon}</div><h3>{selectedQuest.title}</h3><p className="joe3-desc">{selectedQuest.description}</p>
                  <div className="joe3-progress-box"><div className="joe3-progress-top"><span>Прогресс</span><strong>{Math.min(currentProgress, target)}/{target}</strong></div><div className="joe3-progress"><span style={{ width: `${Math.min(100, (currentProgress / target) * 100)}%` }} /></div></div>
                  <div className="joe3-rewards"><span className="joe3-reward">+{selectedQuest.reward.coins} 🪙</span><span className="joe3-reward">+{selectedQuest.reward.trust} доверия</span></div>
                  {section === "active" ? <button className="joe3-action" disabled={!canComplete} onClick={() => finishQuest()}>{isLocked ? "Задание закрыто" : canComplete ? (selectedQuest.objective.type === "deliver" ? `Передать ${target} шт.` : "Завершить дело") : `Осталось: ${Math.max(0, target - currentProgress)}`}</button> : <button className="joe3-action" disabled>Выполнено ✓</button>}
                  {isDev && section === "active" && <button className="joe3-dev" onClick={() => finishQuest({ force: true })}>DEV · завершить это задание</button>}
                </article>
                <div className="joe3-nav"><button onClick={() => moveCard(-1)}>↑</button><div className="joe3-dots">{cards.map((q, i) => <span key={q.id} className={`joe3-dot${i === safeIndex ? " active" : ""}`} />)}</div><button onClick={() => moveCard(1)}>↓</button></div>
              </div>
            ) : <div className="joe3-card">Здесь пока пусто.</div>}
            {isDev && <div className="joe3-devbar"><button className="joe3-dev" onClick={addDevTrust}>DEV · +25 доверия</button><button className="joe3-dev" onClick={resetJoe}>DEV · сбросить Джо</button></div>}
          </section>
        </div>
      )}

      {panel === "path" && (
        <div className="joe3-overlay" onMouseDown={(e) => e.target === e.currentTarget && setPanel(null)}>
          <section className="joe3-panel"><div className="joe3-panel-top"><h2 className="joe3-panel-title">Путь ученика</h2><button className="joe3-close" onClick={() => setPanel(null)}>×</button></div><div className="joe3-level-list">{JOE_TRUST_LEVELS.map((level) => { const unlocked = trust >= level.required; return <div key={level.level} className={`joe3-level${unlocked ? " unlocked" : ""}`}><div className="joe3-level-icon">{level.icon}</div><div><strong>Уровень {level.level} · {level.title}</strong><small>{level.reward}</small></div><div className="joe3-level-status">{unlocked ? "Открыто ✓" : `${trust}/${level.required}`}</div></div>; })}</div>{isDev && <div className="joe3-devbar"><button className="joe3-dev" onClick={addDevTrust}>DEV · +25 доверия</button><button className="joe3-dev" onClick={resetJoe}>DEV · сбросить</button></div>}</section>
        </div>
      )}

      {rewardPopup && <div className="joe3-popup"><small>Дело выполнено</small><strong>+{rewardPopup.coins} 🪙</strong><strong>+{rewardPopup.trust} доверия</strong>{rewardPopup.levelUp && <div className="joe3-level-up">Открыто: {rewardPopup.levelUp.icon} {rewardPopup.levelUp.reward}</div>}</div>}
    </main>
  );
}
