import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  getTelegramPlayer,
  triggerTelegramHaptic,
} from "../../core/telegram";
import {
  CLUB_REPUTATION_EVENT,
  CLUB_REPUTATION_STORAGE_KEY,
  getClubLevelInfo,
  readClubReputation,
} from "../club/clubProgression";
import { CROPS } from "../plantation/data/crops";
import "./PlayerProfile.css";

const PLANT_CATALOG_STORAGE_KEY = "growapp-plant-catalog";
const MARIA_QUESTS_STORAGE_KEY = "growapp-maria-ivanovna-quests";
const LEGACY_QUESTS_STORAGE_KEY = "growapp-joe-quests";

function getInitials(user) {
  const firstLetter = user.first_name?.trim()?.[0] || "";
  const secondLetter =
    user.last_name?.trim()?.[0] ||
    user.username?.trim()?.[0] ||
    "";

  return `${firstLetter}${secondLetter}`.toUpperCase() || "G";
}

function getDisplayName(user) {
  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || user.username || "Неизвестный садовод";
}

function isPlantationScreenVisible() {
  return Boolean(document.querySelector(".game-stage > .background"));
}

function readStoredObject(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  } catch {
    return {};
  }
}

function readProfileStats() {
  const catalog = readStoredObject(PLANT_CATALOG_STORAGE_KEY);
  const currentQuestState = readStoredObject(MARIA_QUESTS_STORAGE_KEY);
  const legacyQuestState = readStoredObject(LEGACY_QUESTS_STORAGE_KEY);
  const questState = Object.keys(currentQuestState).length
    ? currentQuestState
    : legacyQuestState;

  let totalHarvested = 0;
  let favoriteCropId = null;
  let favoriteCropAmount = 0;

  for (const crop of CROPS) {
    const harvested = Math.max(
      0,
      Math.floor(Number(catalog?.[crop.id]?.totalHarvested) || 0),
    );

    totalHarvested += harvested;

    if (harvested > favoriteCropAmount) {
      favoriteCropAmount = harvested;
      favoriteCropId = crop.id;
    }
  }

  const discoveredCrops = CROPS.filter(
    (crop) => (Number(catalog?.[crop.id]?.totalHarvested) || 0) > 0,
  ).length;

  const completedQuestIds = Array.isArray(questState.completedQuestIds)
    ? [...new Set(questState.completedQuestIds.filter(Boolean))]
    : [];

  const favoriteCrop = CROPS.find((crop) => crop.id === favoriteCropId) || null;

  return {
    totalHarvested,
    discoveredCrops,
    totalCrops: CROPS.length,
    completedQuests: completedQuestIds.length,
    favoriteCropName: favoriteCrop?.name || null,
  };
}

function getProfileDescription(stats) {
  if (stats.totalHarvested <= 0) {
    return "Новый участник старого района. Первый урожай ещё впереди, а клуб пока только присматривается.";
  }

  if (stats.discoveredCrops <= 1) {
    return `Начинающий поставщик района. Чаще всего выращивает ${stats.favoriteCropName || "первую открытую культуру"} и готовится расширять коллекцию.`;
  }

  return `Проверенный садовод района. Любимая культура — ${stats.favoriteCropName || "редкие растения"}, а собранный урожай регулярно уходит в местный клуб.`;
}

function PlayerAvatar({ user, size = "small" }) {
  const [imageFailed, setImageFailed] = useState(false);

  const photoUrl =
    typeof user.photo_url === "string" ? user.photo_url.trim() : "";
  const showTelegramPhoto = photoUrl.length > 0 && !imageFailed;

  return (
    <div
      className={`player-avatar player-avatar--${size}`}
      title={getDisplayName(user)}
    >
      {showTelegramPhoto ? (
        <img
          src={photoUrl}
          alt={`Фото ${getDisplayName(user)}`}
          draggable="false"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="player-avatar__initials">{getInitials(user)}</span>
      )}
    </div>
  );
}

function PlayerProfile() {
  const telegramPlayer = useMemo(() => getTelegramPlayer(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [isPlantationVisible, setIsPlantationVisible] = useState(() =>
    isPlantationScreenVisible(),
  );
  const [profileMountNode, setProfileMountNode] = useState(() =>
    document.querySelector(".game-stage"),
  );
  const [isInterfaceBlocked, setIsInterfaceBlocked] = useState(
    () =>
      document.body.dataset.gameOverlayOpen === "true" ||
      document.body.dataset.tutorialLocked === "true",
  );
  const [clubReputation, setClubReputation] = useState(readClubReputation);
  const [profileStats, setProfileStats] = useState(readProfileStats);

  useEffect(() => {
    const updateScreenVisibility = () => {
      const plantationVisible = isPlantationScreenVisible();
      const interfaceBlocked =
        document.body.dataset.gameOverlayOpen === "true" ||
        document.body.dataset.tutorialLocked === "true";

      setIsPlantationVisible(plantationVisible);
      setProfileMountNode(document.querySelector(".game-stage"));
      setIsInterfaceBlocked(interfaceBlocked);

      if (!plantationVisible || interfaceBlocked) {
        setIsOpen(false);
      }
    };

    updateScreenVisibility();

    const observer = new MutationObserver(updateScreenVisibility);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-game-overlay-open", "data-tutorial-locked"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateReputation = (event) => {
      const eventReputation = Number(event?.detail?.reputation);

      if (Number.isFinite(eventReputation) && eventReputation >= 0) {
        setClubReputation(Math.floor(eventReputation));
        return;
      }

      setClubReputation(readClubReputation());
    };

    const refreshProfileData = () => {
      const currentReputation = readClubReputation();
      setClubReputation((previousValue) =>
        previousValue === currentReputation ? previousValue : currentReputation,
      );
      setProfileStats(readProfileStats());
    };

    const updateFromStorage = (event) => {
      if (
        event.key === CLUB_REPUTATION_STORAGE_KEY ||
        event.key === PLANT_CATALOG_STORAGE_KEY ||
        event.key === MARIA_QUESTS_STORAGE_KEY ||
        event.key === LEGACY_QUESTS_STORAGE_KEY
      ) {
        refreshProfileData();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshProfileData();
    };

    window.addEventListener(CLUB_REPUTATION_EVENT, updateReputation);
    window.addEventListener("storage", updateFromStorage);
    window.addEventListener("focus", refreshProfileData);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener(CLUB_REPUTATION_EVENT, updateReputation);
      window.removeEventListener("storage", updateFromStorage);
      window.removeEventListener("focus", refreshProfileData);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const user = telegramPlayer.user;
  const displayName = getDisplayName(user);
  const clubProgress = getClubLevelInfo(clubReputation);
  const profileDescription = getProfileDescription(profileStats);

  const openProfile = () => {
    if (document.body.dataset.tutorialLocked === "true") return;

    triggerTelegramHaptic("light");
    setProfileStats(readProfileStats());
    setClubReputation(readClubReputation());
    setIsOpen(true);
  };

  const closeProfile = () => {
    triggerTelegramHaptic("soft");
    setIsOpen(false);
  };

  if (!isPlantationVisible || isInterfaceBlocked || !profileMountNode) {
    return null;
  }

  const profileButton = (
    <button
      type="button"
      className="player-profile-button"
      disabled={document.body.dataset.tutorialLocked === "true"}
      onClick={openProfile}
      aria-label="Открыть профиль игрока"
    >
      <span className="player-profile-frame__hanger" aria-hidden="true" />
      <span className="player-profile-frame__wood">
        <span className="player-profile-frame__portrait">
          <PlayerAvatar user={user} size="small" />
        </span>
      </span>
    </button>
  );

  return (
    <>
      {createPortal(profileButton, profileMountNode)}

      {isOpen && (
        <div
          className="player-profile-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeProfile();
          }}
        >
          <section
            className="player-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Профиль игрока"
          >
            <span className="player-profile-modal__nail player-profile-modal__nail--left" aria-hidden="true" />
            <span className="player-profile-modal__nail player-profile-modal__nail--right" aria-hidden="true" />

            <button
              type="button"
              className="player-profile-modal__close"
              onClick={closeProfile}
              aria-label="Закрыть"
            >
              <span className="player-profile-modal__close-icon" aria-hidden="true" />
            </button>

            <div className="player-profile-modal__inner">
              <div className="player-profile-modal__glow" />

              <header className="player-profile-modal__header">
                <div className="player-profile-modal__portrait-frame">
                  <PlayerAvatar user={user} size="large" />
                </div>

                <div className="player-profile-modal__identity">
                  <span className="player-profile-modal__eyebrow">
                    Участник района
                  </span>
                  <h2>{displayName}</h2>
                  {user.username ? <p>@{user.username}</p> : <p>Местный садовод</p>}
                </div>
              </header>

              <p className="player-profile-modal__bio">{profileDescription}</p>

              <div className="player-profile-stats player-profile-stats--clean" aria-label="Статистика игрока">
                <article className="player-profile-stat">
                  <small>Собрано</small>
                  <strong>{profileStats.totalHarvested}</strong>
                  <span>урожая</span>
                </article>

                <article className="player-profile-stat">
                  <small>Открыто</small>
                  <strong>{profileStats.discoveredCrops}<em>/{profileStats.totalCrops}</em></strong>
                  <span>культур</span>
                </article>

                <article className="player-profile-stat">
                  <small>Закрыто</small>
                  <strong>{profileStats.completedQuests}</strong>
                  <span>поручений</span>
                </article>

                <article className="player-profile-stat">
                  <small>Клуб</small>
                  <strong>{clubReputation}</strong>
                  <span>REP · LVL {clubProgress.currentLevel.level}</span>
                </article>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default PlayerProfile;
