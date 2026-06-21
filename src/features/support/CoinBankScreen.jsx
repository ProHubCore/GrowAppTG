import { trackGameEvent } from "../../core/analytics/monetizationAnalytics";
import { formatStoreNumber } from "./storePackages";
import "./SupportScreen.css";

export default function CoinBankScreen({
  coins = 0,
  onClose,
  onOpenPremiumStore,
  dailyOrder = null,
}) {
  const safeCoins = Math.max(0, Math.floor(Number(coins) || 0));
  return (
    <main className="growth-store growth-store--cashbook">
      <div className="growth-store__ambient" aria-hidden="true"><i /><i /><i /></div>
      <header className="growth-store__header">
        <button type="button" className="growth-store__back" onClick={onClose}>←</button>
        <div className="cashbook-title"><h1>Как заработать</h1><p>Три понятных источника обычных монет</p></div>
      </header>

      <div className="cashbook-scroll">
        <section className="cashbook-balance">
          <small>БАЛАНС</small>
          <strong>{formatStoreNumber(safeCoins)}</strong>
          <span>обычных монет</span>
          <p>Выращивай, продавай и закрывай поручения.</p>
        </section>



        <section className="cashbook-routes">
          <article><i>1</i><span><strong>Выращивай с уходом</strong><small>Хорошее и отличное качество заметно дороже обычного.</small></span></article>
          <article><i>2</i><span><strong>Продавай в клубе</strong><small>Торг повышает цену, но длинный спор уменьшает REP.</small></span></article>
          <article><i>3</i><span><strong>Закрывай поручения</strong><small>Мария помогает пережить слабую серию, но не заменяет торговлю.</small></span></article>
        </section>

        <button type="button" className="cashbook-growth-link" onClick={() => { trackGameEvent("cashbook_store_click"); onOpenPremiumStore?.(); }}>
          <span><small>НУЖНО МЕНЬШЕ ЖДАТЬ?</small><strong>Открыть монеты роста</strong></span><i>◆</i>
        </button>
      </div>

      <footer className="growth-store__footer"><button type="button" onClick={onClose}>Вернуться в игру</button></footer>
    </main>
  );
}
