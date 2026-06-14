import { HARVEST_QUALITIES } from "../data/harvestQuality";
import { getClubLevelInfo } from "../game/clubProgression";
import "./DistrictProgressPanel.css";

const JOE_LEVELS = [
  { title: "Незнакомец", required: 0 },
  { title: "Подручный", required: 25 },
  { title: "Свой человек", required: 60 },
  { title: "Партнёр", required: 110 },
  { title: "Правая рука", required: 180 },
];

function getJoeInfo(trust = 0) {
  let current = JOE_LEVELS[0];
  let next = JOE_LEVELS[1];
  for (let i = 0; i < JOE_LEVELS.length; i += 1) {
    if (trust >= JOE_LEVELS[i].required) {
      current = JOE_LEVELS[i];
      next = JOE_LEVELS[i + 1] || null;
    }
  }
  const progress = next
    ? ((trust - current.required) / (next.required - current.required)) * 100
    : 100;
  return { current, next, progress: Math.max(0, Math.min(100, progress)) };
}

export default function DistrictProgressPanel({
  joeTrust = 0,
  clubReputation = 0,
  plantCatalog = {},
  completedQuestCount = 0,
  totalQuestCount = 8,
}) {
  const joe = getJoeInfo(joeTrust);
  const club = getClubLevelInfo(clubReputation);
  const discoveredPlants = Object.values(plantCatalog).filter(
    (record) => (record?.totalHarvested || 0) > 0,
  ).length;
  const discoveredQualities = Object.values(plantCatalog).reduce(
    (sum, record) =>
      sum + HARVEST_QUALITIES.filter((quality) => (record?.qualities?.[quality.id] || 0) > 0).length,
    0,
  );
  const chapterProgress = Math.min(100, (completedQuestCount / totalQuestCount) * 100);

  return (
    <section className="district-progress-panel">
      <div className="district-progress-head">
        <div>
          <span>Путь района</span>
          <strong>Глава I · Свой человек</strong>
        </div>
        <b>{completedQuestCount}/{totalQuestCount}</b>
      </div>

      <div className="district-chapter-track">
        <span style={{ width: `${chapterProgress}%` }} />
      </div>

      <div className="district-progress-grid">
        <div className="district-progress-card">
          <small>Джо</small>
          <strong>{joe.current.title}</strong>
          <span>{joeTrust} доверия</span>
          <i><em style={{ width: `${joe.progress}%` }} /></i>
        </div>

        <div className="district-progress-card">
          <small>Клуб</small>
          <strong>{club.currentLevel.title}</strong>
          <span>{clubReputation} репутации</span>
          <i><em style={{ width: `${club.progressPercent}%` }} /></i>
        </div>

        <div className="district-progress-card">
          <small>Каталог</small>
          <strong>{discoveredPlants}/2 растения</strong>
          <span>{discoveredQualities}/8 качеств</span>
          <i><em style={{ width: `${Math.min(100, (discoveredQualities / 8) * 100)}%` }} /></i>
        </div>
      </div>
    </section>
  );
}
