import { PREMIUM_CURRENCY } from "../../../core/economy/premiumCurrency";
import "./PremiumWallet.css";

export default function PremiumWallet({ balance = 0, onClick, disabled = false }) {
  const content = (
    <>
      <span className="premium-wallet__icon" aria-hidden="true">
        {PREMIUM_CURRENCY.icon}
      </span>
      <span className="premium-wallet__copy">
        <small>{PREMIUM_CURRENCY.shortName}</small>
        <strong>{Math.max(0, Math.floor(Number(balance) || 0))}</strong>
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className="premium-wallet"
        disabled={disabled}
        onClick={onClick}
        aria-label={`${PREMIUM_CURRENCY.name}: ${balance}. Открыть банк.`}
      >
        {content}
      </button>
    );
  }

  return <div className="premium-wallet" aria-label={`${PREMIUM_CURRENCY.name}: ${balance}`}>{content}</div>;
}
