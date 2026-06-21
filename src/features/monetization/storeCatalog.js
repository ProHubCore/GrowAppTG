export const STORE_TABS = Object.freeze([
  { id: "featured", label: "Наборы", icon: "✦" },
  { id: "growth", label: "Ускорители", icon: "◆" },
  { id: "style", label: "Оформление", icon: "◈" },
]);

export const STORE_PRODUCTS = Object.freeze([
  {
    id: "starter-kit", tab: "featured", type: "bundle",
    title: "Стартовый набор", shortTitle: "Стартовый набор",
    subtitle: "Ускорения, уход и тема", cardLine: "80 ускорителей · 3 раствора · тема",
    ctaLine: "Забрать 3 в 1", stars: 49, badge: "3 В 1", featured: true, oneTime: true,
    theme: "starter", icon: "✦", valueLabel: "ЛУЧШИЙ СТАРТ", compareLine: "Для первых циклов",
    contents: [
      { kind: "growth", amount: 80, label: "80 ускорителей", detail: "сразу на баланс" },
      { kind: "care", id: "nutrition", amount: 3, label: "3 раствора", detail: "для качества" },
      { kind: "cosmetic", id: "amber-lab", amount: 1, label: "Янтарная тема", detail: "навсегда" },
    ],
  },
  {
    id: "grower-kit", tab: "featured", type: "bundle",
    title: "Набор садовода", shortTitle: "Набор садовода",
    subtitle: "Запас на активную игру", cardLine: "108 ускорителей · 8 составов · тема",
    ctaLine: "Самый ровный выбор", stars: 99, badge: "ВЫГОДНО", featured: true, oneTime: true,
    theme: "grower", icon: "◆", valueLabel: "4 В 1", compareLine: "Больше ухода",
    contents: [
      { kind: "growth", amount: 108, label: "108 ускорителей", detail: "для срочных циклов" },
      { kind: "care", id: "nutrition", amount: 6, label: "6 растворов", detail: "отличное качество" },
      { kind: "care", id: "mariaMix", amount: 2, label: "2 смеси Марии", detail: "шанс редкого" },
      { kind: "cosmetic", id: "violet-haze", amount: 1, label: "Фиолетовая тема", detail: "навсегда" },
    ],
  },
  {
    id: "district-kit", tab: "featured", type: "bundle",
    title: "Большой набор района", shortTitle: "Большой набор района",
    subtitle: "Максимальный запас без покупки прогресса", cardLine: "320 ускорителей · 18 составов · 2 темы",
    ctaLine: "Максимум выгоды", stars: 229, badge: "МАКС. НАБОР", featured: true, oneTime: true,
    theme: "district", icon: "★", valueLabel: "5 В 1", compareLine: "Самая низкая цена",
    contents: [
      { kind: "growth", amount: 320, label: "320 ускорителей", detail: "большой запас" },
      { kind: "care", id: "nutrition", amount: 12, label: "12 растворов", detail: "для качества" },
      { kind: "care", id: "mariaMix", amount: 6, label: "6 смесей Марии", detail: "редкие циклы" },
      { kind: "cosmetic", id: "amber-lab", amount: 1, label: "Янтарная тема", detail: "навсегда" },
      { kind: "cosmetic", id: "violet-haze", amount: 1, label: "Фиолетовая тема", detail: "навсегда" },
    ],
  },
  {
    id: "growth-pocket", tab: "growth", type: "currency", title: "30 ускорителей", shortTitle: "30 ускорителей",
    subtitle: "Небольшой запас", cardLine: "Для пары срочных ускорений", ctaLine: "Пополнить баланс",
    stars: 29, badge: "БЫСТРО", theme: "pocket", icon: "◆", valueLabel: "30 СРАЗУ", compareLine: "Маленький пакет",
    contents: [{ kind: "growth", amount: 30, label: "30 ускорителей", detail: "быстрый запас" }],
  },
  {
    id: "growth-stash", tab: "growth", type: "currency", title: "130 ускорителей", shortTitle: "130 ускорителей",
    subtitle: "Самый популярный запас", cardLine: "Лучшее соотношение цены", ctaLine: "Выбрать популярный",
    stars: 99, badge: "ПОПУЛЯРНО", theme: "stash", icon: "◆", valueLabel: "ЛУЧШАЯ ЦЕНА", compareLine: "+31% к малому", featured: true,
    contents: [{ kind: "growth", amount: 130, label: "130 ускорителей", detail: "лучший баланс цены" }],
  },
  {
    id: "growth-vault", tab: "growth", type: "currency", title: "380 ускорителей", shortTitle: "380 ускорителей",
    subtitle: "Максимальный запас", cardLine: "Самая низкая цена за ускоритель", ctaLine: "Взять максимум",
    stars: 249, badge: "МАКС. ВЫГОДА", theme: "vault", icon: "◆", valueLabel: "МАКСИМУМ", compareLine: "+52% к малому",
    contents: [{ kind: "growth", amount: 380, label: "380 ускорителей", detail: "самая низкая цена" }],
  },
  {
    id: "amber-lab", tab: "style", type: "cosmetic", title: "Янтарная лаборатория", shortTitle: "Янтарная тема",
    subtitle: "Тёплое свечение интерфейса и урожая", stars: 79, badge: "НАВСЕГДА", theme: "amber", icon: "◈", valueLabel: "ПОСТОЯННО",
    contents: [{ kind: "cosmetic", id: "amber-lab", amount: 1, label: "Янтарная тема", detail: "остаётся на аккаунте" }],
  },
  {
    id: "violet-haze", tab: "style", type: "cosmetic", title: "Фиолетовый туман", shortTitle: "Фиолетовая тема",
    subtitle: "Редкий эффект сбора и акцентные элементы", stars: 129, badge: "РЕДКОЕ", theme: "violet", icon: "✧", valueLabel: "ПОСТОЯННО",
    contents: [{ kind: "cosmetic", id: "violet-haze", amount: 1, label: "Фиолетовая тема", detail: "эффект сбора включён" }],
  },
]);

export const PRODUCT_BY_ID = Object.freeze(Object.fromEntries(STORE_PRODUCTS.map((product) => [product.id, product])));
export const COSMETIC_OPTIONS = Object.freeze([
  { id: "classic", title: "Классический район", description: "Базовое оформление Grow App.", icon: "●" },
  { id: "amber-lab", title: "Янтарная лаборатория", description: "Золотистые акценты и мягкое свечение урожая.", icon: "◈" },
  { id: "violet-haze", title: "Фиолетовый туман", description: "Фиолетовые акценты и редкий эффект сбора.", icon: "✧" },
]);
export function getStoreProduct(productId) { return PRODUCT_BY_ID[String(productId || "")] || null; }
export function getProductGrowthAmount(product) {
  return (product?.contents || []).reduce((total, item) => total + (item.kind === "growth" ? Number(item.amount) || 0 : 0), 0);
}
