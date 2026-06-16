import { useEffect, useMemo, useState } from "react";
import { getTelegramPlayer, triggerTelegramHaptic } from "../../core/telegram";
import { getClubLevelInfo } from "../club/clubProgression";
import { getMariaTrustInfo } from "../maria-ivanovna/mariaProgression";
import { MARIA_QUESTS } from "../maria-ivanovna/mariaQuests";
import "./PlayerProfile.css";

function readNumber(key) {
  try { return Math.max(0, Number(localStorage.getItem(key)) || 0); } catch { return 0; }
}

function readMariaState() {
  try {
    const parsed = JSON.parse(localStorage.getItem("growapp-maria-ivanovna-quests") || "null");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch { return {}; }
}

function getInitials(user) {
  return `${user.first_name?.trim()?.[0] || ""}${user.last_name?.trim()?.[0] || user.username?.trim()?.[0] || ""}`.toUpperCase() || "G";
}

function getDisplayName(user) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.username || "Садовод";
}

function isPlantationScreenVisible() {
  return Boolean(document.querySelector(".game-stage > .background"));
}

function Avatar({ user, large = false }) {
  const [failed, setFailed] = useState(false);
  const photo = typeof user.photo_url === "string" ? user.photo_url.trim() : "";
  return (
    <div className={`wall-profile-avatar${large ? " large" : ""}`}>
      {photo && !failed
        ? <img src={photo} alt={getDisplayName(user)} draggable="false" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
        : <span>{getInitials(user)}</span>}
    </div>
  );
}

export default function PlayerProfile() {
  const telegramPlayer = useMemo(() => getTelegramPlayer(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(isPlantationScreenVisible);
  const [snapshot, setSnapshot] = useState(() => ({ reputation: readNumber("growapp-club-reputation"), maria: readMariaState() }));

  useEffect(() => {
    const update = () => {
      const nextVisible = isPlantationScreenVisible();
      setVisible(nextVisible);
      if (!nextVisible) setIsOpen(false);
      setSnapshot({ reputation: readNumber("growapp-club-reputation"), maria: readMariaState() });
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = window.setInterval(update, 1200);
    window.addEventListener("growapp-club-reputation-change", update);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
      window.removeEventListener("growapp-club-reputation-change", update);
    };
  }, []);

  if (!visible) return null;

  const user = telegramPlayer.user;
  const club = getClubLevelInfo(snapshot.reputation);
  const trust = Math.max(0, Number(snapshot.maria?.trust) || 0);
  const maria = getMariaTrustInfo(trust);
  const completed = Array.isArray(snapshot.maria?.completedQuestIds) ? snapshot.maria.completedQuestIds.length : 0;

  return (
    <>
      <button
        type="button"
        className="wall-profile-frame"
        disabled={document.body.dataset.tutorialLocked === "true"}
        onClick={() => { triggerTelegramHaptic("light"); setIsOpen(true); }}
        aria-label="Открыть рамку игрока"
      >
        <span className="wall-profile-frame__nail" />
        <Avatar user={user} />
        <b>{club.currentLevel.level}</b>
      </button>

      {isOpen && (
        <div className="wall-profile-overlay" onMouseDown={(event) => event.target === event.currentTarget && setIsOpen(false)}>
          <section className="wall-profile-card" role="dialog" aria-modal="true" aria-label="Профиль Grow Street">
            <button type="button" className="wall-profile-close" onClick={() => setIsOpen(false)}>×</button>
            <div className="wall-profile-card__portrait"><Avatar user={user} large /></div>
            <span className="wall-profile-eyebrow">КАРТОЧКА GROW STREET</span>
            <h2>{getDisplayName(user)}</h2>
            {user.username && <p>@{user.username}</p>}

            <div className="wall-profile-rank">
              <span>Клубный статус</span>
              <strong>{club.currentLevel.title}</strong>
              <div><i style={{ width: `${club.progressPercent}%` }} /></div>
              <small>{snapshot.reputation} REP</small>
            </div>

            <div className="wall-profile-stats">
              <article><span>Уровень</span><strong>{club.currentLevel.level}</strong></article>
              <article><span>Доверие Марии</span><strong>{trust}</strong></article>
              <article><span>Закрыто дел</span><strong>{completed}/{MARIA_QUESTS.length}</strong></article>
            </div>

            <div className="wall-profile-footer">
              <span>{maria.current.title}</span>
              <strong>{completed >= MARIA_QUESTS.length ? "Ключ от лифта получен" : "Имя ещё строится"}</strong>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
