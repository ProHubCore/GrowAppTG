import { useEffect, useMemo, useState } from "react";
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
import "./PlayerProfile.css";

function getInitials(user) {
  const firstLetter =
    user.first_name?.trim()?.[0] || "";

  const secondLetter =
    user.last_name?.trim()?.[0] ||
    user.username?.trim()?.[0] ||
    "";

  return (
    `${firstLetter}${secondLetter}`.toUpperCase() ||
    "G"
  );
}

function getDisplayName(user) {
  const fullName = [
    user.first_name,
    user.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullName ||
    user.username ||
    "Неизвестный садовод"
  );
}

function isPlantationScreenVisible() {
  return Boolean(
    document.querySelector(
      ".game-stage > .background",
    ),
  );
}

function PlayerAvatar({
  user,
  size = "small",
  showStatus = true,
}) {
  const [imageFailed, setImageFailed] =
    useState(false);

  const photoUrl =
    typeof user.photo_url === "string"
      ? user.photo_url.trim()
      : "";

  const showTelegramPhoto =
    photoUrl.length > 0 && !imageFailed;

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
          onError={() => {
            setImageFailed(true);
          }}
        />
      ) : (
        <span className="player-avatar__initials">
          {getInitials(user)}
        </span>
      )}

      {showStatus && (
        <span className="player-avatar__status" />
      )}
    </div>
  );
}

function PlayerProfile() {
  const telegramPlayer = useMemo(
    () => getTelegramPlayer(),
    [],
  );

  const [isOpen, setIsOpen] =
    useState(false);

  const [
    isPlantationVisible,
    setIsPlantationVisible,
  ] = useState(() =>
    isPlantationScreenVisible(),
  );

  const [isInterfaceBlocked, setIsInterfaceBlocked] = useState(() =>
    document.body.dataset.gameOverlayOpen === "true" ||
    document.body.dataset.tutorialLocked === "true",
  );

  const [
    clubReputation,
    setClubReputation,
  ] = useState(readClubReputation);

  useEffect(() => {
    const updateScreenVisibility = () => {
      const plantationVisible =
        isPlantationScreenVisible();

      const interfaceBlocked =
        document.body.dataset.gameOverlayOpen === "true" ||
        document.body.dataset.tutorialLocked === "true";

      setIsPlantationVisible(
        plantationVisible,
      );
      setIsInterfaceBlocked(interfaceBlocked);

      if (!plantationVisible || interfaceBlocked) {
        setIsOpen(false);
      }
    };

    updateScreenVisibility();

    const observer = new MutationObserver(
      updateScreenVisibility,
    );

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "data-game-overlay-open",
        "data-tutorial-locked",
      ],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const updateReputation = (event) => {
      const eventReputation =
        Number(event?.detail?.reputation);

      if (
        Number.isFinite(eventReputation) &&
        eventReputation >= 0
      ) {
        setClubReputation(
          Math.floor(eventReputation),
        );

        return;
      }

      setClubReputation(
        readClubReputation(),
      );
    };

    const updateFromStorage = (event) => {
      if (
        event.key ===
        CLUB_REPUTATION_STORAGE_KEY
      ) {
        setClubReputation(
          readClubReputation(),
        );
      }
    };

    window.addEventListener(
      CLUB_REPUTATION_EVENT,
      updateReputation,
    );

    window.addEventListener(
      "storage",
      updateFromStorage,
    );

    const refreshReputation = () => {
      const currentValue = readClubReputation();
      setClubReputation((previousValue) =>
        previousValue === currentValue ? previousValue : currentValue,
      );
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshReputation();
    };

    window.addEventListener("focus", refreshReputation);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener(
        CLUB_REPUTATION_EVENT,
        updateReputation,
      );

      window.removeEventListener(
        "storage",
        updateFromStorage,
      );

      window.removeEventListener("focus", refreshReputation);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const user = telegramPlayer.user;

  const displayName =
    getDisplayName(user);

  const clubProgress =
    getClubLevelInfo(clubReputation);

  const openProfile = () => {
    if (document.body.dataset.tutorialLocked === "true") {
      return;
    }

    triggerTelegramHaptic("light");
    setIsOpen(true);
  };

  const closeProfile = () => {
    triggerTelegramHaptic("soft");
    setIsOpen(false);
  };

  if (!isPlantationVisible || isInterfaceBlocked) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="player-profile-button"
        disabled={document.body.dataset.tutorialLocked === "true"}
        onClick={openProfile}
        aria-label="Открыть профиль игрока"
      >
        <span className="player-profile-frame__hanger" aria-hidden="true" />

        <span className="player-profile-frame__portrait">
          <PlayerAvatar
            user={user}
            size="small"
            showStatus
          />
        </span>

        <span className="player-profile-frame__plate">УЧАСТНИК</span>
      </button>

      {isOpen && (
        <div
          className="player-profile-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeProfile();
            }
          }}
        >
          <section
            className="player-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Профиль игрока"
          >
            <button
              type="button"
              className="player-profile-modal__close"
              onClick={closeProfile}
              aria-label="Закрыть"
            >
              ×
            </button>

            <div className="player-profile-modal__glow" />

            <header className="player-profile-modal__header">
              <PlayerAvatar
                user={user}
                size="large"
                showStatus
              />

              <div className="player-profile-modal__identity">
                <span className="player-profile-modal__eyebrow">
                  Участник района
                </span>

                <h2>{displayName}</h2>

                {user.username ? (
                  <p>@{user.username}</p>
                ) : (
                  <p>
                    Без публичного имени
                  </p>
                )}
              </div>
            </header>

            <div className="player-rank-card">
              <div className="player-rank-card__top">
                <div>
                  <span className="player-rank-card__label">
                    Репутация клуба
                  </span>

                  <strong>
                    {
                      clubProgress
                        .currentLevel
                        .title
                    }
                  </strong>
                </div>

                <div className="player-rank-card__level">
                  {
                    clubProgress
                      .currentLevel.level
                  }
                </div>
              </div>

              <div className="player-rank-card__progress">
                <div
                  className="player-rank-card__progress-fill"
                  style={{
                    width: `${clubProgress.progressPercent}%`,
                  }}
                />
              </div>

              <div className="player-rank-card__experience">
                {clubProgress.nextLevel ? (
                  <>
                    <span>
                      {
                        clubProgress.currentProgress
                      }{" "}
                      REP
                    </span>

                    <span>
                      {
                        clubProgress.nextLevel.required - clubReputation
                      }{" "}
                      до повышения
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {clubReputation} REP
                    </span>

                    <span>
                      Максимальный уровень
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="player-profile-stats">
              <div className="player-profile-stat">
                <span>
                  Общая репутация
                </span>

                <strong>
                  {clubReputation} REP
                </strong>
              </div>

              <div className="player-profile-stat">
                <span>
                  Уровень клуба
                </span>

                <strong>
                  LVL{" "}
                  {
                    clubProgress
                      .currentLevel.level
                  }
                </strong>
              </div>

              <div className="player-profile-stat">
                <span>
                  Следующий статус
                </span>

                <strong>
                  {clubProgress.nextLevel
                    ? clubProgress.nextLevel
                        .title
                    : "Все открыто"}
                </strong>
              </div>

              <div className="player-profile-stat">
                <span>
                  Telegram ID
                </span>

                <strong>{user.id}</strong>
              </div>
            </div>

            <div className="player-profile-details">
              <div>
                <span>
                  Источник входа
                </span>

                <strong>
                  {telegramPlayer.startParam ||
                    "прямой вход"}
                </strong>
              </div>

              <div>
                <span>Устройство</span>

                <strong>
                  {telegramPlayer.platform}
                </strong>
              </div>

              <div>
                <span>
                  Подключение
                </span>

                <strong>
                  {telegramPlayer.isTelegram
                    ? "Telegram"
                    : "В браузере"}
                </strong>
              </div>
            </div>

            <div className="player-profile-missions">
              <div className="player-profile-missions__icon">
                ◈
              </div>

              <div>
                <strong>
                  Репутация общая с клубом
                </strong>

                <p>
                  Продажа урожая в клубе
                  повышает этот уровень и
                  сразу обновляет профиль.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default PlayerProfile;