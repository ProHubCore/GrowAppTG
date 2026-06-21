import { DAILY_REWARDS } from "./dailyEngagement";
import "./MonetizationModals.css";

function formatReward(reward) {
  const parts = [];
  if (reward.coins) parts.push(`+${reward.coins} монет`);
  if (reward.growth) parts.push(`+${reward.growth} ◆`);
  if (reward.care?.nutrition) parts.push(`+${reward.care.nutrition} раствор`);
  if (reward.care?.mariaMix) parts.push(`+${reward.care.mariaMix} смесь`);
  return parts.join(" · ");
}

export default function DailyRewardModal({ prepared, onClaim, onClose }) {
  if (!prepared?.canClaim || !prepared.reward) return null;
  const activeDay = prepared.reward.day;

  return (
    <div className="monetization-modal-layer" role="presentation">
      <section className="daily-reward" role="dialog" aria-modal="true" aria-labelledby="daily-reward-title">
        <button type="button" className="daily-reward__close" onClick={onClose}>×</button>
        <small>СЕРИЯ ВХОДОВ</small>
        <h2 id="daily-reward-title">День {activeDay} из 7</h2>
        <p>Возвращайся каждый день. Награды помогают играть, но не заменяют торговлю.</p>
        <div className="daily-reward__road">
          {DAILY_REWARDS.map((reward) => {
            const passed = reward.day < activeDay;
            const current = reward.day === activeDay;
            return (
              <article key={reward.day} className={`${passed ? "passed" : ""}${current ? " current" : ""}`}>
                <span>{passed ? "✓" : reward.icon}</span>
                <small>{reward.day}</small>
              </article>
            );
          })}
        </div>
        <div className="daily-reward__prize">
          <span>{prepared.reward.icon}</span>
          <div><small>СЕГОДНЯ</small><strong>{prepared.reward.title}</strong><p>{formatReward(prepared.reward)}</p></div>
        </div>
        <button type="button" className="daily-reward__claim" onClick={onClaim}>Забрать награду</button>
      </section>
    </div>
  );
}
