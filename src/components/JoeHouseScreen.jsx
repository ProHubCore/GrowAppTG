import { useMemo, useRef, useState } from "react";

const TRUST_LEVELS = [
  { level: 0, title: "Незнакомец", required: 0 },
  { level: 1, title: "Подручный", required: 25 },
  { level: 2, title: "Свой человек", required: 60 },
  { level: 3, title: "Партнёр", required: 110 },
  { level: 4, title: "Правая рука", required: 180 },
];

const QUESTS = [
  {
    id: "joe-first-delivery",
    title: "Первый заказ",
    label: "Дело Джо",
    description:
      "Району нужны свежие зелёные томаты. Принеси Дяде Джо три штуки.",
    icon: "🍅",
    previousQuestId: null,
    objective: { type: "deliver", itemId: "greenTomato", amount: 3 },
    reward: { coins: 300, trust: 25 },
  },
  {
    id: "joe-club-request",
    title: "Просьба клуба",
    label: "Связь с клубом",
    description:
      "Типусиан хочет проверить, можешь ли ты быть постоянным поставщиком. Продай клубу пять зелёных томатов.",
    icon: "♣",
    previousQuestId: "joe-first-delivery",
    objective: { type: "club-sale", itemId: "greenTomato", amount: 5 },
    reward: { coins: 350, trust: 30 },
  },
  {
    id: "joe-dark-seed",
    title: "Тёмное семя",
    label: "Дело магазина",
    description:
      "У Зорика появилась странная поставка. Купи хотя бы одно семя Психомора и покажи Джо, что ты готов к делам посерьёзнее.",
    icon: "✦",
    previousQuestId: "joe-club-request",
    objective: { type: "own-seed", itemId: "psychomor", amount: 1 },
    reward: { coins: 200, trust: 20 },
  },
  {
    id: "joe-strange-harvest",
    title: "Странный урожай",
    label: "Особое дело",
    description:
      "Вырасти Психомор и передай один плод Джо. Покупатель не назвал имени, но платит щедро.",
    icon: "◉",
    previousQuestId: "joe-dark-seed",
    objective: { type: "deliver", itemId: "psychomor", amount: 1 },
    reward: { coins: 700, trust: 35 },
  },
  {
    id: "joe-club-status",
    title: "Свой среди своих",
    label: "Финал главы",
    description:
      "Заработай 50 репутации клуба. Джо хочет убедиться, что район действительно начал принимать тебя за своего.",
    icon: "★",
    previousQuestId: "joe-strange-harvest",
    objective: { type: "club-reputation", amount: 50 },
    reward: { coins: 1000, trust: 50 },
  },
];

function getTrustInfo(trust) {
  let current = TRUST_LEVELS[0];

  for (const item of TRUST_LEVELS) {
    if (trust >= item.required) current = item;
  }

  const index = TRUST_LEVELS.findIndex((item) => item.level === current.level);
  const next = TRUST_LEVELS[index + 1] || null;

  if (!next) {
    return { current, next: null, progress: 100, text: "MAX" };
  }

  const range = next.required - current.required;
  const value = trust - current.required;

  return {
    current,
    next,
    progress: Math.max(0, Math.min(100, (value / range) * 100)),
    text: `${value}/${range}`,
  };
}

function getQuestProgress(quest, inventory, seedInventory, clubReputation, questState) {
  const objective = quest.objective;

  if (objective.type === "deliver") {
    return inventory?.[objective.itemId] || 0;
  }

  if (objective.type === "club-sale") {
    return questState?.clubSales?.[objective.itemId] || 0;
  }

  if (objective.type === "own-seed") {
    return seedInventory?.[objective.itemId] || 0;
  }

  if (objective.type === "club-reputation") {
    return clubReputation || 0;
  }

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
  onQuestStateChange,
}) {
  const completedQuestIds = Array.isArray(questState?.completedQuestIds)
    ? questState.completedQuestIds
    : [];
  const trust = Math.max(0, Number(questState?.trust) || 0);
  const trustInfo = getTrustInfo(trust);

  const availableQuests = useMemo(
    () =>
      QUESTS.filter((quest) => {
        if (!quest.previousQuestId) return true;
        return completedQuestIds.includes(quest.previousQuestId);
      }),
    [completedQuestIds],
  );

  const activeQuests = availableQuests.filter(
    (quest) => !completedQuestIds.includes(quest.id),
  );
  const archivedQuests = QUESTS.filter((quest) =>
    completedQuestIds.includes(quest.id),
  );

  const [panel, setPanel] = useState(null);
  const [section, setSection] = useState("active");
  const [cardIndex, setCardIndex] = useState(0);
  const [message, setMessage] = useState(
    "Осматривайся. На доске висят дела, которые действительно двигают тебя вперёд.",
  );
  const [rewardPopup, setRewardPopup] = useState(null);
  const touchStartY = useRef(null);

  const cards = section === "archive" ? archivedQuests : activeQuests;
  const safeIndex = Math.min(cardIndex, Math.max(0, cards.length - 1));
  const selectedQuest = cards[safeIndex] || null;

  const currentProgress = selectedQuest
    ? getQuestProgress(
        selectedQuest,
        inventory,
        seedInventory,
        clubReputation,
        questState,
      )
    : 0;

  const target = selectedQuest?.objective?.amount || 1;
  const canComplete = Boolean(selectedQuest && currentProgress >= target);

  const setCurrentSection = (nextSection) => {
    setSection(nextSection);
    setCardIndex(0);
  };

  const moveCard = (direction) => {
    if (cards.length <= 1) return;
    setCardIndex((previous) => {
      const next = previous + direction;
      if (next < 0) return cards.length - 1;
      if (next >= cards.length) return 0;
      return next;
    });
  };

  const completeQuest = () => {
    if (!selectedQuest || !canComplete) return;

    if (selectedQuest.objective.type === "deliver") {
      const delivered = onDeliverItems?.({
        itemId: selectedQuest.objective.itemId,
        amount: selectedQuest.objective.amount,
      });

      if (delivered === false) {
        setMessage("Проверь инвентарь. Похоже, нужного товара уже не хватает.");
        return;
      }
    }

    const nextCompleted = [...completedQuestIds, selectedQuest.id];
    const nextTrust = trust + selectedQuest.reward.trust;

    onQuestStateChange?.({
      ...questState,
      completedQuestIds: nextCompleted,
      trust: nextTrust,
      clubSales: {
        greenTomato: questState?.clubSales?.greenTomato || 0,
        psychomor: questState?.clubSales?.psychomor || 0,
      },
    });

    onRewardClaimed?.({
      questId: selectedQuest.id,
      coins: selectedQuest.reward.coins,
      trust: selectedQuest.reward.trust,
    });

    setRewardPopup({
      coins: selectedQuest.reward.coins,
      trust: selectedQuest.reward.trust,
      levelUp:
        getTrustInfo(nextTrust).current.level > trustInfo.current.level
          ? getTrustInfo(nextTrust).current.title
          : null,
    });
    setMessage("Хорошая работа. Дело отправлено в архив, а следующая записка уже появилась на доске.");
    setCardIndex(0);

    window.setTimeout(() => setRewardPopup(null), 2200);
  };

  const actionText = () => {
    if (!selectedQuest) return "Нет активных дел";
    if (!canComplete) {
      const remaining = Math.max(0, target - currentProgress);
      return `Осталось: ${remaining}`;
    }

    if (selectedQuest.objective.type === "deliver") {
      return `Передать ${target} шт.`;
    }

    return "Завершить дело";
  };

  return (
    <main className="joe2-house">
      <style>{`
        *{box-sizing:border-box}.joe2-house{position:relative;width:100%;height:100dvh;min-height:620px;overflow:hidden;color:#f7ecd4;font-family:Inter,"Segoe UI",system-ui,sans-serif;background:radial-gradient(circle at 50% 12%,rgba(255,184,85,.16),transparent 30%),linear-gradient(180deg,#2d2221 0%,#191416 63%,#0e0c0e 100%)}.joe2-house:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,.015) 0 2px,transparent 2px 58px),linear-gradient(180deg,transparent 72%,rgba(0,0,0,.3) 72%);pointer-events:none}.joe2-top{position:relative;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:max(16px,env(safe-area-inset-top)) 16px 10px}.joe2-back{min-height:42px;padding:0 14px;border:1px solid rgba(255,225,170,.14);border-radius:999px;color:#f8e9c9;font:inherit;font-size:12px;font-weight:900;background:rgba(22,17,19,.82);box-shadow:0 8px 18px rgba(0,0,0,.34);cursor:pointer}.joe2-heading{text-align:right}.joe2-kicker{font-size:9px;font-weight:900;letter-spacing:.17em;text-transform:uppercase;color:rgba(255,226,178,.48)}.joe2-title{font-family:Georgia,serif;font-size:21px;color:#ffedc4}.joe2-room{position:absolute;inset:72px 0 0;z-index:2}.joe2-lamp{position:absolute;top:2%;left:50%;width:52px;height:28px;transform:translateX(-50%);border-radius:50% 50% 20% 20%;background:#5b4331;box-shadow:0 4px 0 #302521,0 16px 58px rgba(255,175,74,.3)}.joe2-lamp:after{content:"";position:absolute;top:20px;left:50%;width:250px;height:240px;transform:translateX(-50%);clip-path:polygon(42% 0,58% 0,100% 100%,0 100%);background:linear-gradient(180deg,rgba(255,193,105,.12),transparent 78%)}.joe2-board{position:absolute;z-index:5;top:15%;left:7%;width:min(35vw,145px);aspect-ratio:1.18;border:5px solid #4e3428;border-radius:14px;background:#6b4935;box-shadow:0 14px 24px rgba(0,0,0,.42),inset 0 0 22px rgba(0,0,0,.2);transform:rotate(-2deg);cursor:pointer}.joe2-note{position:absolute;width:40%;height:43%;border-radius:3px;background:#d7bf88;box-shadow:0 4px 7px rgba(0,0,0,.2)}.joe2-note:nth-child(1){top:14%;left:9%;transform:rotate(-5deg)}.joe2-note:nth-child(2){top:22%;right:8%;transform:rotate(5deg);background:#b9a875}.joe2-note:nth-child(3){bottom:8%;left:29%;transform:rotate(2deg);background:#d1b37c}.joe2-board-label{position:absolute;left:50%;bottom:-28px;transform:translateX(-50%);white-space:nowrap;font-size:10px;font-weight:900;color:rgba(255,235,201,.7)}.joe2-board-badge{position:absolute;right:-10px;top:-10px;display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#ca5a3e;color:white;font-size:11px;font-weight:1000;box-shadow:0 0 14px rgba(202,90,62,.55)}.joe2-radio{position:absolute;z-index:5;top:43%;left:10%;width:84px;height:58px;border:0;border-radius:12px;background:radial-gradient(circle at 72% 48%,#c49454 0 5px,transparent 6px),repeating-radial-gradient(circle at 28% 52%,#1d1918 0 2px,#665447 3px 5px),#493a34;box-shadow:0 9px 16px rgba(0,0,0,.37);cursor:pointer}.joe2-crate{position:absolute;z-index:5;right:7%;bottom:12%;width:112px;height:87px;border:0;border-radius:8px;background:linear-gradient(35deg,transparent 45%,rgba(58,36,24,.48) 46% 54%,transparent 55%),linear-gradient(-35deg,transparent 45%,rgba(58,36,24,.48) 46% 54%,transparent 55%),#755039;box-shadow:0 12px 18px rgba(0,0,0,.42),inset 0 0 0 5px #4e3428;cursor:pointer}.joe2-character{position:absolute;z-index:6;right:18%;bottom:18%;width:min(42vw,175px);aspect-ratio:.78;border:0;background:transparent;cursor:pointer;animation:joe2idle 3.2s ease-in-out infinite}.joe2-shadow{position:absolute;left:50%;bottom:-4px;width:85%;height:18px;transform:translateX(-50%);border-radius:50%;background:rgba(0,0,0,.5);filter:blur(7px)}.joe2-body{position:absolute;left:50%;bottom:0;width:72%;height:59%;transform:translateX(-50%);border-radius:42% 42% 17% 17%;background:#535d44;box-shadow:inset 0 -18px 25px rgba(0,0,0,.26),0 8px 18px rgba(0,0,0,.25)}.joe2-head{position:absolute;left:50%;top:15%;width:62%;height:43%;transform:translateX(-50%);border-radius:47%;background:#c79160;box-shadow:inset -10px -9px 19px rgba(83,43,26,.24)}.joe2-hat{position:absolute;top:4%;left:50%;width:82%;height:24%;transform:translateX(-50%);border-radius:60% 60% 20% 20%;background:#38312e}.joe2-hat:after{content:"";position:absolute;left:-15%;bottom:-18%;width:130%;height:36%;border-radius:50%;background:#292422}.joe2-eye{position:absolute;top:43%;width:6px;height:6px;border-radius:50%;background:#211918}.joe2-eye.left{left:29%}.joe2-eye.right{right:29%}.joe2-mustache{position:absolute;left:50%;top:63%;width:42%;height:12%;transform:translateX(-50%)}.joe2-mustache:before,.joe2-mustache:after{content:"";position:absolute;width:54%;height:100%;border-radius:70% 25% 70% 25%;background:#584133}.joe2-mustache:before{left:0;transform:rotate(8deg)}.joe2-mustache:after{right:0;transform:scaleX(-1) rotate(8deg)}.joe2-trust{position:absolute;z-index:9;left:14px;right:14px;bottom:94px;padding:11px 13px;border:1px solid rgba(255,220,157,.12);border-radius:16px;background:rgba(24,19,21,.9);box-shadow:0 12px 24px rgba(0,0,0,.34)}.joe2-trust-top{display:flex;justify-content:space-between;gap:10px;margin-bottom:7px;font-size:10px;font-weight:900}.joe2-trust-top span{color:#e8af58}.joe2-trust-top strong{color:#f7e8c8}.joe2-track{height:8px;overflow:hidden;border-radius:999px;background:rgba(255,255,255,.08)}.joe2-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,#b87c3d,#efc069);box-shadow:0 0 10px rgba(239,192,105,.28)}.joe2-message{position:absolute;z-index:10;left:14px;right:14px;bottom:max(16px,env(safe-area-inset-bottom));min-height:66px;padding:13px 16px;border:1px solid rgba(255,224,165,.13);border-radius:18px;background:rgba(24,19,21,.94);box-shadow:0 14px 30px rgba(0,0,0,.42)}.joe2-name{margin-bottom:4px;color:#e7ae58;font-size:9px;font-weight:950;letter-spacing:.14em;text-transform:uppercase}.joe2-text{margin:0;color:#f1e4ca;font-size:12px;font-weight:650;line-height:1.35}.joe2-overlay{position:fixed;z-index:100;inset:0;display:flex;align-items:center;justify-content:center;padding:max(70px,env(safe-area-inset-top)) 12px max(16px,env(safe-area-inset-bottom));background:rgba(8,7,8,.78);backdrop-filter:blur(9px)}.joe2-panel{width:min(100%,430px);max-height:84dvh;padding:15px;border:5px solid #4d3428;border-radius:22px;background:#624432;box-shadow:0 25px 65px rgba(0,0,0,.65),inset 0 0 35px rgba(0,0,0,.26)}.joe2-panel-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.joe2-panel-title{margin:0;font-family:Georgia,serif;font-size:23px;color:#ffe9bc}.joe2-close{display:grid;place-items:center;width:38px;height:38px;border:1px solid rgba(255,226,173,.12);border-radius:50%;color:#f7e7c6;font-size:20px;background:rgba(25,18,19,.48);cursor:pointer}.joe2-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}.joe2-tab{min-height:40px;border:1px solid rgba(255,227,175,.1);border-radius:13px;color:rgba(255,236,204,.57);font:inherit;font-size:11px;font-weight:900;background:rgba(27,19,20,.32);cursor:pointer}.joe2-tab.active{color:#ffdda0;border-color:rgba(245,179,76,.27);background:rgba(61,38,29,.78)}.joe2-feed{position:relative}.joe2-card{position:relative;min-height:430px;padding:21px 18px 17px;border-radius:7px 7px 18px 10px;color:#36251e;background:linear-gradient(rgba(73,47,31,.035) 1px,transparent 1px),#dcc590;background-size:100% 22px;box-shadow:0 14px 22px rgba(0,0,0,.3),inset 0 0 30px rgba(92,55,28,.12);overflow:hidden}.joe2-card:before{content:"";position:absolute;top:-7px;left:50%;width:68px;height:20px;transform:translateX(-50%);background:rgba(169,130,72,.59)}.joe2-card-count{position:absolute;top:14px;right:15px;font-size:9px;font-weight:950;color:rgba(54,35,26,.48)}.joe2-label{display:inline-flex;margin-bottom:8px;padding:4px 8px;border-radius:999px;background:rgba(81,52,32,.1);font-size:8px;font-weight:950;letter-spacing:.12em;text-transform:uppercase}.joe2-card-icon{font-size:34px;margin:2px 0 7px}.joe2-card-title{margin:0;font-family:Georgia,serif;font-size:27px;line-height:1}.joe2-desc{margin:11px 0 16px;font-size:12px;font-weight:650;line-height:1.45;color:rgba(54,37,29,.78)}.joe2-progress-box{margin-top:auto;padding:12px;border-radius:14px;background:rgba(91,61,38,.1)}.joe2-progress-top{display:flex;justify-content:space-between;gap:10px;margin-bottom:8px;font-size:10px;font-weight:900}.joe2-card-progress{height:10px;overflow:hidden;border-radius:999px;background:rgba(71,45,29,.17)}.joe2-card-progress span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#638243,#a8c469)}.joe2-rewards{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.joe2-reward{padding:6px 8px;border-radius:10px;background:rgba(87,57,35,.1);font-size:10px;font-weight:900}.joe2-action{width:100%;min-height:44px;margin-top:13px;border:0;border-radius:14px;color:#fff2ce;font:inherit;font-size:12px;font-weight:950;background:linear-gradient(180deg,#79994d,#516c32);box-shadow:0 6px 0 #344620,0 11px 18px rgba(44,59,27,.24);cursor:pointer}.joe2-action:disabled{opacity:.5;filter:grayscale(.45);cursor:default}.joe2-nav{display:flex;justify-content:space-between;align-items:center;margin-top:10px}.joe2-nav button{width:42px;height:42px;border:1px solid rgba(255,225,170,.12);border-radius:50%;color:#f7e6c6;background:rgba(26,19,20,.43);font-size:20px;cursor:pointer}.joe2-dots{display:flex;gap:5px}.joe2-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,235,200,.24)}.joe2-dot.active{width:18px;border-radius:999px;background:#e9b45d}.joe2-empty{display:grid;place-items:center;min-height:310px;padding:30px;border-radius:16px;text-align:center;color:rgba(255,235,201,.58);background:rgba(25,18,19,.25);font-size:12px;font-weight:750}.joe2-popup{position:fixed;z-index:200;top:50%;left:50%;min-width:235px;padding:22px;border:1px solid rgba(255,223,155,.24);border-radius:22px;transform:translate(-50%,-50%);text-align:center;color:#ffe5a3;background:radial-gradient(circle at 50% 0,rgba(255,196,82,.22),transparent 60%),rgba(25,19,18,.98);box-shadow:0 0 80px rgba(255,168,54,.16),0 26px 55px rgba(0,0,0,.62);animation:joe2pop 2.2s ease both}.joe2-popup small{display:block;margin-bottom:8px;font-size:9px;font-weight:950;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,236,193,.58)}.joe2-popup strong{display:block;font-family:Georgia,serif;font-size:25px}.joe2-level-up{margin-top:9px;padding-top:9px;border-top:1px solid rgba(255,232,180,.12);font-size:11px;font-weight:900;color:#fff1c8}@keyframes joe2idle{0%,100%{transform:translateY(0) rotate(-.4deg)}50%{transform:translateY(-5px) rotate(.4deg)}}@keyframes joe2pop{0%{opacity:0;transform:translate(-50%,-50%) scale(.75)}18%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}30%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-60%) scale(.94)}}@media(max-height:700px){.joe2-card{min-height:360px}.joe2-character{width:135px}.joe2-trust{bottom:84px}.joe2-message{min-height:58px;padding:10px 13px}}`}</style>

      <header className="joe2-top">
        <button className="joe2-back" type="button" onClick={onBack}>← В район</button>
        <div className="joe2-heading">
          <div className="joe2-kicker">Старый район</div>
          <div className="joe2-title">Дом Дяди Джо</div>
        </div>
      </header>

      <section className="joe2-room">
        <div className="joe2-lamp" />

        <button className="joe2-board" type="button" onClick={() => { setPanel("board"); setCurrentSection("active"); }}>
          <span className="joe2-note" />
          <span className="joe2-note" />
          <span className="joe2-note" />
          <span className="joe2-board-label">Дела Джо</span>
          {activeQuests.length > 0 && <span className="joe2-board-badge">{activeQuests.length}</span>}
        </button>

        <button className="joe2-radio" type="button" aria-label="Радио" onClick={() => setMessage("Радио пока ловит только шум. Позже здесь будут новости района и редкие события.")} />
        <button className="joe2-crate" type="button" aria-label="Склад" onClick={() => setMessage(trustInfo.current.level >= 2 ? "Склад уже почти твой. Скоро здесь появится оборудование Джо." : "Джо пока не доверяет тебе ключ от склада.")} />

        <button className="joe2-character" type="button" aria-label="Дядя Джо" onClick={() => setMessage(`Сейчас ты для меня — ${trustInfo.current.title.toLowerCase()}. Продолжай в том же духе.`)}>
          <span className="joe2-shadow" />
          <span className="joe2-body" />
          <span className="joe2-head">
            <span className="joe2-hat" />
            <span className="joe2-eye left" />
            <span className="joe2-eye right" />
            <span className="joe2-mustache" />
          </span>
        </button>

        <div className="joe2-trust">
          <div className="joe2-trust-top">
            <span>Доверие Джо · уровень {trustInfo.current.level}</span>
            <strong>{trustInfo.current.title} · {trustInfo.text}</strong>
          </div>
          <div className="joe2-track"><div className="joe2-fill" style={{ width: `${trustInfo.progress}%` }} /></div>
        </div>

        <div className="joe2-message">
          <div className="joe2-name">Дядя Джо</div>
          <p className="joe2-text">{message}</p>
        </div>
      </section>

      {panel === "board" && (
        <div className="joe2-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setPanel(null); }}>
          <section className="joe2-panel">
            <div className="joe2-panel-top">
              <h2 className="joe2-panel-title">Дела Джо</h2>
              <button className="joe2-close" type="button" onClick={() => setPanel(null)}>×</button>
            </div>

            <div className="joe2-tabs">
              <button className={`joe2-tab${section === "active" ? " active" : ""}`} type="button" onClick={() => setCurrentSection("active")}>Текущие · {activeQuests.length}</button>
              <button className={`joe2-tab${section === "archive" ? " active" : ""}`} type="button" onClick={() => setCurrentSection("archive")}>Архив · {archivedQuests.length}</button>
            </div>

            {selectedQuest ? (
              <div
                className="joe2-feed"
                onTouchStart={(event) => { touchStartY.current = event.touches[0]?.clientY ?? null; }}
                onTouchEnd={(event) => {
                  if (touchStartY.current === null) return;
                  const endY = event.changedTouches[0]?.clientY ?? touchStartY.current;
                  const delta = endY - touchStartY.current;
                  if (Math.abs(delta) > 45) moveCard(delta < 0 ? 1 : -1);
                  touchStartY.current = null;
                }}
              >
                <article className="joe2-card">
                  <div className="joe2-card-count">{safeIndex + 1}/{cards.length}</div>
                  <div className="joe2-label">{selectedQuest.label}</div>
                  <div className="joe2-card-icon">{selectedQuest.icon}</div>
                  <h3 className="joe2-card-title">{selectedQuest.title}</h3>
                  <p className="joe2-desc">{selectedQuest.description}</p>

                  <div className="joe2-progress-box">
                    <div className="joe2-progress-top">
                      <span>Прогресс</span>
                      <strong>{Math.min(currentProgress, target)}/{target}</strong>
                    </div>
                    <div className="joe2-card-progress"><span style={{ width: `${Math.min(100, (currentProgress / target) * 100)}%` }} /></div>
                  </div>

                  <div className="joe2-rewards">
                    <span className="joe2-reward">+{selectedQuest.reward.coins} 🪙</span>
                    <span className="joe2-reward">+{selectedQuest.reward.trust} доверия</span>
                  </div>

                  {section === "active" ? (
                    <button className="joe2-action" type="button" disabled={!canComplete} onClick={completeQuest}>{actionText()}</button>
                  ) : (
                    <button className="joe2-action" type="button" disabled>Выполнено ✓</button>
                  )}
                </article>

                <div className="joe2-nav">
                  <button type="button" onClick={() => moveCard(-1)}>↑</button>
                  <div className="joe2-dots">{cards.map((quest, index) => <span key={quest.id} className={`joe2-dot${index === safeIndex ? " active" : ""}`} />)}</div>
                  <button type="button" onClick={() => moveCard(1)}>↓</button>
                </div>
              </div>
            ) : (
              <div className="joe2-empty">{section === "archive" ? "Архив пока пуст." : "Все доступные дела выполнены. Джо готовит продолжение."}</div>
            )}
          </section>
        </div>
      )}

      {rewardPopup && (
        <div className="joe2-popup">
          <small>Дело выполнено</small>
          <strong>+{rewardPopup.coins} 🪙</strong>
          <strong>+{rewardPopup.trust} доверия</strong>
          {rewardPopup.levelUp && <div className="joe2-level-up">Новый статус: {rewardPopup.levelUp}</div>}
        </div>
      )}
    </main>
  );
}
