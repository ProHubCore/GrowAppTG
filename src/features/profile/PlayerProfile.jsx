import { useEffect, useMemo, useState } from "react";
import {
  getTelegramPlayer,
  triggerTelegramHaptic,
} from "../../core/telegram";
import "./PlayerProfile.css";

const REPUTATION_STORAGE_KEY =
  "growapp-club-reputation";

const CLUB_LEVELS = [
  {
    level: 1,
    title: "Новый знакомый",
    required: 0,
  },
  {
    level: 2,
    title: "Свой человек",
    required: 50,
  },
  {
    level: 3,
    title: "Надёжный поставщик",
    required: 150,
  },
  {
    level: 4,
    title: "Звезда клуба",
    required: 300,
  },
  {
    level: 5,
    title: "Легенда района",
    required: 600,
  },
];

function readClubReputation() {
  try {
    const savedValue = Number(
      localStorage.getItem(
        REPUTATION_STORAGE_KEY,
      ),
    );

    if (
      Number.isFinite(savedValue) &&
      savedValue >= 0
    ) {
      return Math.floor(savedValue);
    }

    return 0;
  } catch {
    return 0;
  }
}

function getClubProgress(reputation) {
  let currentLevel = CLUB_LEVELS[0];

  for (const level of CLUB_LEVELS) {
    if (reputation >= level.required) {
      currentLevel = level;
    }
  }

  const currentIndex =
    CLUB_LEVELS.findIndex(
      (level) =>
        level.level === currentLevel.level,
    );

  const nextLevel =
    CLUB_LEVELS[currentIndex + 1] || null;

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      currentProgress:
        reputation - currentLevel.required,
      requiredProgress: 0,
      progressPercent: 100,
    };
  }

  const requiredProgress =
    nextLevel.required -
    currentLevel.required;

  const currentProgress =
    reputation - currentLevel.required;

  const progressPercent = Math.max(
    0,
    Math.min(
      100,
      (currentProgress /
        requiredProgress) *
        100,
    ),
  );

  return {
    currentLevel,
    nextLevel,
    currentProgress,
    requiredProgress,
    progressPercent,
  };
}

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

  const [
    clubReputation,
    setClubReputation,
  ] = useState(readClubReputation);

  useEffect(() => {
    const updateScreenVisibility = () => {
      const plantationVisible =
        isPlantationScreenVisible();

      setIsPlantationVisible(
        plantationVisible,
      );

      if (!plantationVisible) {
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
        REPUTATION_STORAGE_KEY
      ) {
        setClubReputation(
          readClubReputation(),
        );
      }
    };

    window.addEventListener(
      "growapp-club-reputation-change",
      updateReputation,
    );

    window.addEventListener(
      "storage",
      updateFromStorage,
    );

    const intervalId = window.setInterval(
      () => {
        const currentValue =
          readClubReputation();

        setClubReputation(
          (previousValue) =>
            previousValue === currentValue
              ? previousValue
              : currentValue,
        );
      },
      500,
    );

    return () => {
      window.removeEventListener(
        "growapp-club-reputation-change",
        updateReputation,
      );

      window.removeEventListener(
        "storage",
        updateFromStorage,
      );

      window.clearInterval(intervalId);
    };
  }, []);

  const user = telegramPlayer.user;

  const displayName =
    getDisplayName(user);

  const clubProgress =
    getClubProgress(clubReputation);

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

  if (!isPlantationVisible) {
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
        <PlayerAvatar
          user={user}
          size="small"
          showStatus
        />
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
                        clubProgress.requiredProgress
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
                    : "Тестовый режим"}
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