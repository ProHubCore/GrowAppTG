import { PREMIUM_CURRENCY } from "../../../core/economy/premiumCurrency";
import { formatCompactNumber } from "../../../features/support/storePackages";
import "./PremiumWallet.css";

export default function PremiumWallet({ balance = 0, onClick, disabled = false }) {
  const safeBalance = Math.max(0, Math.floor(Number(balance) || 0));
  const content = (
    <>
      <span className="premium-wallet__icon" aria-hidden="true"><i>✦</i></span>
      <strong className="premium-wallet__value">{formatCompactNumber(safeBalance)}</strong>
      {onClick && <span className="premium-wallet__plus" aria-hidden="true">+</span>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className="premium-wallet"
        disabled={disabled}
        onClick={onClick}
        aria-label={`${PREMIUM_CURRENCY.name}: ${safeBalance}. Открыть магазин.`}
      >
        {content}
      </button>
    );
  }

  return <div className="premium-wallet" aria-label={`${PREMIUM_CURRENCY.name}: ${safeBalance}`}>{content}</div>;
}
