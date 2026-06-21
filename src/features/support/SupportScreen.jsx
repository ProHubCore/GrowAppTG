import { useEffect, useMemo, useState } from "react";

import {
  triggerTelegramHaptic,
  triggerTelegramNotification,
} from "../../core/telegram";
import { trackGameEvent } from "../../core/analytics/monetizationAnalytics";
import {
  COSMETIC_OPTIONS,
  STORE_PRODUCTS,
  STORE_TABS,
  getProductGrowthAmount,
} from "../monetization/storeCatalog";
import {
  getStarsConfiguration,
  purchaseStarsProduct,
  redeemServerPromo,
} from "./starsPayments";
import { formatStoreNumber } from "./storePackages";
import CareItemIcon from "../../shared/components/CareItemIcon/CareItemIcon";

import "./SupportScreen.css";

const DEV_TEST_CODES = new Set(["14.15.92", "3141592"]);

function ProductIcon({ product, compact = false }) {
  const growth = getProductGrowthAmount(product);
  const care = (product.contents || []).filter((item) => item.kind === "care");
  const cosmetic = (product.contents || []).find((item) => item.kind === "cosmetic");

  if (product.type === "bundle") {
    return (
      <span className={`growth-product-icon growth-bundle-visual theme-${product.theme}${compact ? " compact" : ""}`} aria-hidden="true">
        <span className="growth-bundle-coin"><i>✦</i><b>{growth}</b></span>
        <span className="growth-bundle-flasks">
          {care.slice(0, 2).map((item) => (
            <span key={item.id} className={`growth-bundle-flask flask-${item.id}`}>
              <CareItemIcon type={item.id} className="bundle-size" />
              <b>×{item.amount}</b>
            </span>
          ))}
        </span>
        <span className={`growth-bundle-theme preview-${cosmetic?.id || "classic"}`}><i /></span>
      </span>
    );
  }

  if (product.type === "cosmetic") {
    return <span className={`growth-product-icon growth-theme-preview preview-${product.id}${compact ? " compact" : ""}`} aria-hidden="true"><i /><b>ТЕМА</b></span>;
  }

  return (
    <span className={`growth-product-icon growth-coin-product theme-${product.theme}${compact ? " compact" : ""}`} aria-hidden="true">
      <i>✦</i><b>{growth}</b>
    </span>
  );
}

function RewardLine({ item, detailed = false }) {
  return (
    <span className={`growth-reward-line reward-${item.kind} ${item.id ? `reward-${item.id}` : ""}`}>
      <i aria-hidden="true">
        {item.kind === "care" ? (
          <CareItemIcon type={item.id} className="reward-size" />
        ) : (
          <b>{item.kind === "growth" ? "✦" : "◈"}</b>
        )}
      </i>
      <span>
        <strong>{item.label}</strong>
        {detailed && item.detail && <small>{item.detail}</small>}
      </span>
    </span>
  );
}

function ProductCard({ product, owned, equipped, onOpen, onEquip }) {
  const growthAmount = getProductGrowthAmount(product);
  return (
    <article className={`growth-product theme-${product.theme}${product.featured ? " featured" : ""}${owned ? " owned" : ""}`}>
      <button type="button" className="growth-product__main" onClick={onOpen}>
        <span className="growth-product__topline">
          <span className="growth-product__badge">{owned ? "КУПЛЕНО" : product.badge}</span>
          <span className="growth-product__value">{product.valueLabel}</span>
        </span>

        <span className="growth-product__hero-row">
          <ProductIcon product={product} />
          <span className="growth-product__copy">
            <strong>{product.title}</strong>
            <small>{product.cardLine || product.subtitle}</small>
            {product.compareLine && <em>{product.compareLine}</em>}
          </span>
        </span>

        {product.type === "currency" && (
          <span className="growth-product__currency-amount">
            <b>{growthAmount}</b>
            <span><strong>ускорителей</strong><small>сразу на баланс</small></span>
          </span>
        )}

        {product.type !== "currency" && (
          <span className="growth-product__contents">
            {(product.contents || []).slice(0, 3).map((item) => (
              <RewardLine key={`${item.kind}-${item.id || item.amount}`} item={item} />
            ))}
          </span>
        )}

        <span className="growth-product__bottomline">
          <span>{owned ? "Уже получено" : product.ctaLine || "Посмотреть"}</span>
          <span className="growth-product__price">
            {owned ? <b>Открыто</b> : <><b>{product.stars}</b><i>★</i></>}
          </span>
        </span>
      </button>

      {product.type === "cosmetic" && owned && (
        <button type="button" className={`growth-product__equip${equipped ? " active" : ""}`} onClick={onEquip}>
          {equipped ? "Используется" : "Применить тему"}
        </button>
      )}
    </article>
  );
}

export default function SupportScreen({
  premiumCoins = 0,
  ownedProducts = [],
  ownedCosmetics = ["classic"],
  activeCosmetic = "classic",
  initialProductId = null,
  onProductGranted,
  onEquipCosmetic,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(() => {
    const initial = STORE_PRODUCTS.find((product) => product.id === initialProductId);
    return initial?.tab || "featured";
  });
  const [selectedProduct, setSelectedProduct] = useState(() =>
    STORE_PRODUCTS.find((product) => product.id === initialProductId) || null,
  );
  const [purchaseStatus, setPurchaseStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [successProduct, setSuccessProduct] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState("idle");
  const configuration = getStarsConfiguration();
  const canUsePromo = configuration.promo || import.meta.env.DEV;

  const ownedProductSet = useMemo(() => new Set(ownedProducts || []), [ownedProducts]);
  const ownedCosmeticSet = useMemo(() => new Set(ownedCosmetics || ["classic"]), [ownedCosmetics]);
  const visibleProducts = STORE_PRODUCTS.filter((product) => {
    if (activeTab === "featured") return product.tab === "featured";
    return product.tab === activeTab;
  });

  useEffect(() => {
    trackGameEvent("store_open", { focusProductId: initialProductId || null, premiumBalance: premiumCoins });
  }, [initialProductId, premiumCoins]);

  useEffect(() => {
    if (!initialProductId) return;
    const product = STORE_PRODUCTS.find((item) => item.id === initialProductId);
    if (!product) return;
    setActiveTab(product.tab || "featured");
    setSelectedProduct(product);
    trackGameEvent("offer_impression", { productId: product.id, source: "contextual" });
  }, [initialProductId]);

  const productOwned = selectedProduct && (
    ownedProductSet.has(selectedProduct.id) ||
    (selectedProduct.type === "cosmetic" && ownedCosmeticSet.has(selectedProduct.id))
  );

  const closeProduct = () => {
    if (purchaseStatus === "loading") return;
    setSelectedProduct(null);
    setPurchaseStatus("idle");
    setMessage("");
  };

  const openProduct = (product) => {
    triggerTelegramHaptic("light");
    setSelectedProduct(product);
    setPurchaseStatus("idle");
    setMessage("");
    trackGameEvent("product_view", { productId: product.id });
  };

  const handlePurchase = async () => {
    if (!selectedProduct || purchaseStatus === "loading" || productOwned) return;

    setPurchaseStatus("loading");
    setMessage("");
    trackGameEvent("purchase_started", { productId: selectedProduct.id, stars: selectedProduct.stars });

    try {
      const result = await purchaseStarsProduct(selectedProduct);
      if (result.status === "cancelled") {
        setPurchaseStatus("idle");
        setMessage("Покупка отменена. Stars не списывались.");
        trackGameEvent("purchase_cancelled", { productId: selectedProduct.id });
        return;
      }
      if (!result.verified) {
        setPurchaseStatus("error");
        setMessage("Платёж не подтверждён сервером. Ничего не начислено.");
        return;
      }

      onProductGranted?.({
        product: selectedProduct,
        entitlements: result.entitlements,
        serverBalance: result.serverBalance,
        purchaseId: result.purchaseId,
      });
      setSuccessProduct(selectedProduct);
      setSelectedProduct(null);
      setPurchaseStatus("success");
      triggerTelegramNotification("success");
      trackGameEvent("purchase_succeeded", { productId: selectedProduct.id, stars: selectedProduct.stars });
    } catch (error) {
      console.error("Stars purchase failed:", error);
      setPurchaseStatus("error");
      const errorMessage = String(error?.message || "");
      setMessage(
        errorMessage.includes("TELEGRAM_SESSION_REQUIRED")
          ? "Покупка открывается только внутри Telegram."
          : errorMessage.includes("VERIFY")
            ? "Оплата прошла, но сервер ещё не подтвердил выдачу. Повтори проверку позже."
            : "Не удалось открыть безопасную оплату Telegram Stars.",
      );
      trackGameEvent("purchase_failed", { productId: selectedProduct.id, reason: String(error?.message || "unknown") });
    }
  };

  const handlePromo = async (event) => {
    event.preventDefault();
    if (!promoCode.trim() || promoStatus === "loading") return;

    setPromoStatus("loading");
    setMessage("");
    const normalizedCode = promoCode.trim();

    if (import.meta.env.DEV && DEV_TEST_CODES.has(normalizedCode)) {
      const developerGrant = { id: "developer-grant", shortTitle: "Тестовый запас", title: "Тестовый запас" };
      onProductGranted?.({
        product: null,
        entitlements: [
          { kind: "care", id: "nutrition", amount: 25 },
          { kind: "care", id: "mariaMix", amount: 25 },
          { kind: "cosmetic", id: "amber-lab", amount: 1 },
          { kind: "cosmetic", id: "violet-haze", amount: 1 },
        ],
        serverBalance: Math.max(100000, Number(premiumCoins) + 100000),
        purchaseId: `dev-${Date.now()}`,
      });
      setPromoCode("");
      setPromoStatus("success");
      setMessage("Тестовый запас выдан. Покупки не отмечены.");
      setSuccessProduct(developerGrant);
      triggerTelegramNotification("success");
      trackGameEvent("developer_test_grant");
      return;
    }

    try {
      const result = await redeemServerPromo(normalizedCode);
      onProductGranted?.({ product: null, entitlements: result.entitlements, serverBalance: result.serverBalance, purchaseId: null });
      setPromoCode("");
      setPromoStatus("success");
      setMessage(result.message);
      triggerTelegramNotification("success");
      trackGameEvent("promo_redeemed");
    } catch (error) {
      setPromoStatus("error");
      setMessage("Ключ не найден, уже использован или доступен только разработчику.");
      triggerTelegramNotification("error");
    }
  };

  return (
    <main className={`growth-store growth-store--${activeTab}`}>
      <div className="growth-store__ambient" aria-hidden="true"><i /><i /><i /></div>

      <header className="growth-store__header">
        <button type="button" className="growth-store__back" onClick={onClose} aria-label="Закрыть магазин">←</button>
        <div className="growth-store__title">
          <small>МАГАЗИН РАЙОНА</small>
          <h1>Ускорения</h1>
        </div>
        <div className="growth-store__wallet" aria-label={`Монеты роста: ${premiumCoins}`}>
          <span className="growth-store__wallet-crystal">✦</span>
          <span><small>УСКОРИТЕЛИ</small><strong>{formatStoreNumber(premiumCoins)}</strong></span>
        </div>
      </header>

      <nav className="growth-store__tabs" aria-label="Разделы магазина">
        {STORE_TABS.map((tab) => (
          <button type="button" key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => {
            triggerTelegramHaptic("light");
            setActiveTab(tab.id);
          }}>
            <i aria-hidden="true">{tab.icon}</i><span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="growth-store__scroll">
        {activeTab === "growth" && (
          <section className="growth-store__explain">
            <span>✦</span>
            <div><strong>Ускорители сокращают ожидание</strong><p>Прогресс и обычные монеты всё равно добываются в игре.</p></div>
          </section>
        )}

        <section className="growth-product-grid" aria-label="Товары">
          {visibleProducts.map((product) => {
            const owned = ownedProductSet.has(product.id) || (product.type === "cosmetic" && ownedCosmeticSet.has(product.id));
            const equipped = product.type === "cosmetic" && activeCosmetic === product.id;
            return (
              <ProductCard
                key={product.id}
                product={product}
                owned={owned}
                equipped={equipped}
                onOpen={() => openProduct(product)}
                onEquip={() => onEquipCosmetic?.(product.id)}
              />
            );
          })}
        </section>

        {activeTab === "style" && (
          <section className="growth-style-library">
            <header><small>ТВОЯ КОЛЛЕКЦИЯ</small><h2>Оформление района</h2></header>
            {COSMETIC_OPTIONS.map((cosmetic) => {
              const owned = cosmetic.id === "classic" || ownedCosmeticSet.has(cosmetic.id);
              const equipped = activeCosmetic === cosmetic.id;
              return (
                <button type="button" key={cosmetic.id} disabled={!owned} className={`${owned ? "owned" : "locked"}${equipped ? " active" : ""}`} onClick={() => owned && onEquipCosmetic?.(cosmetic.id)}>
                  <i aria-hidden="true">{owned ? (equipped ? "✓" : cosmetic.icon) : "⌁"}</i>
                  <span><strong>{cosmetic.title}</strong><small>{cosmetic.description}</small></span>
                  <b>{equipped ? "Выбрано" : owned ? "Выбрать" : "Закрыто"}</b>
                </button>
              );
            })}
          </section>
        )}

        <form className="growth-promo" onSubmit={handlePromo}>
          <div><small>КЛЮЧ</small><strong>Тестовый доступ</strong></div>
          <label>
            <input value={promoCode} onChange={(event) => setPromoCode(event.target.value.replace(/\s/g, "").slice(0, 32))} placeholder="Введите ключ" autoComplete="off" inputMode="text" />
            <button type="submit" disabled={!canUsePromo || promoStatus === "loading"}>{promoStatus === "loading" ? "…" : "Готово"}</button>
          </label>
        </form>

        {message && !selectedProduct && <div className={`growth-store__message ${promoStatus}`}>{message}</div>}
      </div>

      <footer className="growth-store__footer"><button type="button" onClick={onClose}>Вернуться в игру</button></footer>

      {selectedProduct && (
        <div className="growth-dialog-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeProduct()}>
          <section className={`growth-dialog theme-${selectedProduct.theme}`} role="dialog" aria-modal="true" aria-labelledby="growth-product-title">
            <button type="button" className="growth-dialog__close" onClick={closeProduct} disabled={purchaseStatus === "loading"}>×</button>
            <div className="growth-dialog__visual"><ProductIcon product={selectedProduct} /><span>{selectedProduct.valueLabel}</span></div>
            <small>{selectedProduct.badge}</small>
            <h2 id="growth-product-title">{selectedProduct.title}</h2>
            <p>{selectedProduct.cardLine || selectedProduct.subtitle}</p>
            <div className="growth-dialog__rewards">
              {(selectedProduct.contents || []).map((item) => <RewardLine key={`${item.kind}-${item.id || item.amount}`} item={item} />)}
            </div>
            <div className="growth-dialog__total">
              <span>{productOwned ? "Уже на аккаунте" : "Получишь сразу"}</span>
              <strong>{productOwned ? "✓" : `${selectedProduct.stars} ★`}</strong>
            </div>
            {!configuration.ready && !import.meta.env.DEV && (
              <div className="growth-dialog__warning">
                {configuration.reason === "OPEN_IN_TELEGRAM"
                  ? "Открой игру внутри Telegram, чтобы купить через Stars."
                  : "Оплата временно недоступна. Награды не будут начислены без подтверждения сервера."}
              </div>
            )}
            {message && <div className={`growth-dialog__message status-${purchaseStatus}`}>{message}</div>}
            <div className="growth-dialog__actions">
              <button type="button" onClick={closeProduct} disabled={purchaseStatus === "loading"}>Не сейчас</button>
              <button type="button" className="primary" onClick={handlePurchase} disabled={!configuration.ready || purchaseStatus === "loading" || productOwned}>
                {productOwned ? "Получено" : purchaseStatus === "loading" ? "Проверяем…" : `Купить · ${selectedProduct.stars} ★`}
              </button>
            </div>
          </section>
        </div>
      )}

      {successProduct && (
        <div className="growth-success-layer" role="status">
          <section className="growth-success">
            <span aria-hidden="true">✦</span>
            <small>ПОКУПКА ПОДТВЕРЖДЕНА</small>
            <h2>{successProduct.shortTitle}</h2>
            <p>Награды уже на аккаунте.</p>
            <button type="button" onClick={() => setSuccessProduct(null)}>Забрать</button>
          </section>
        </div>
      )}
    </main>
  );
}
