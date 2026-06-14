import { useEffect } from "react";
import "./TutorialInteractionGuard.css";

const INTERACTIVE_SELECTOR = [
  "button",
  '[role="button"]',
  "a",
  "input",
  "select",
  "textarea",
  "[tabindex]",
  ".seed-card",
  ".seed-option",
  ".bottom-menu-item",
  ".plant-button-image",
  ".seed-basket",
].join(",");

function normalize(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isVisible(element) {
  if (!(element instanceof Element)) {
    return false;
  }

  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    Number(style.opacity) > 0 &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function getVisibleElements(selector, root = document) {
  return Array.from(root.querySelectorAll(selector)).filter(isVisible);
}

function getElementText(element) {
  if (!element) {
    return "";
  }

  return normalize(
    [
      element.getAttribute?.("aria-label"),
      element.getAttribute?.("title"),
      element.getAttribute?.("data-label"),
      element.textContent,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function findTutorialContainer() {
  const selectors = [
    ".tutorial-layer",
    ".tutorial-overlay",
    ".tutorial-dialog",
    ".tutorial-message",
    '[class*="tutorial-overlay"]',
    '[class*="tutorial-layer"]',
    '[class*="tutorial-dialog"]',
    '[class*="tutorial-message"]',
  ].join(",");

  const visible = getVisibleElements(selectors);

  if (visible.length === 0) {
    return null;
  }

  const preferred =
    visible.find((element) => {
      const text = getElementText(element);

      return (
        text.includes("джо") ||
        text.includes("показывай") ||
        text.includes("посад") ||
        text.includes("ведр") ||
        text.includes("корзин") ||
        text.includes("урожай") ||
        text.includes("район")
      );
    }) || visible[0];

  return (
    preferred.closest(
      ".tutorial-layer, .tutorial-overlay, [class*='tutorial-layer'], [class*='tutorial-overlay']",
    ) || preferred
  );
}

function findByText(words, selector = INTERACTIVE_SELECTOR, root = document) {
  const normalizedWords = words.map(normalize);

  return getVisibleElements(selector, root).find((element) => {
    const text = getElementText(element);

    return normalizedWords.some((word) => text.includes(word));
  });
}

function findBySelectors(selectors) {
  return getVisibleElements(selectors.join(","))[0] || null;
}

function findAddPotButton() {
  return (
    findBySelectors([
      ".add-pot-button",
      '[class*="add-pot"]',
      '[data-action="add-pot"]',
    ]) ||
    findByText([
      "добавить ведро",
      "поставить ведро",
      "создать ведро",
      "добавить горшок",
    ])
  );
}

function findSeedBasket() {
  return (
    findBySelectors([
      ".plantation-seed-basket",
      ".seed-basket",
      '[class*="seed-basket"]',
      '[data-action="open-seeds"]',
    ]) ||
    findByText(["корзинка", "семена"])
  );
}

function findTomatoSeed() {
  return (
    findBySelectors([
      '[data-seed-id="greenTomato"]',
      '[data-seed-id="green-tomato"]',
      '[data-seed="greenTomato"]',
      '[data-seed="green-tomato"]',
    ]) ||
    findByText([
      "зелёный томат",
      "зеленый томат",
      "томат",
    ])
  );
}

function findPlantButton() {
  return (
    findBySelectors([
      ".seed-modal-plant-button",
      ".seed-plant-button",
      ".plant-seed-button",
      '[data-action="plant"]',
    ]) ||
    findByText(["посадить"])
  );
}

function findCollectablePlant() {
  return findBySelectors([
    ".plant-button-image.collectable",
    ".collectable",
    '[data-action="collect"]',
    '[class*="collectable"]',
  ]);
}

function findDistrictButton() {
  return (
    findBySelectors([
      '[data-screen="district"]',
      '[data-action="district"]',
      '[data-tab="district"]',
      '[class*="district"]',
    ]) ||
    findByText([
      "перейти в район",
      "вернуться в район",
      "вернёмся в район",
      "вернемся в район",
      "район",
    ])
  );
}

function findContinueButton(tutorialContainer) {
  return findByText(
    [
      "показывай",
      "дальше",
      "продолжить",
      "понял",
      "понятно",
      "готово",
      "поехали",
      "хорошо",
    ],
    INTERACTIVE_SELECTOR,
    tutorialContainer,
  );
}

function resolvePlantingRecoveryTarget() {
  const plantButton = findPlantButton();

  if (plantButton) {
    return {
      target: plantButton,
      focus: "plant-button",
      phase: "planting",
    };
  }

  const tomatoSeed = findTomatoSeed();

  if (tomatoSeed) {
    return {
      target: tomatoSeed,
      focus: "tomato",
      phase: "planting",
    };
  }

  const seedBasket = findSeedBasket();

  if (seedBasket) {
    return {
      target: seedBasket,
      focus: "basket",
      phase: "planting",
    };
  }

  return {
    target: null,
    focus: "message",
    phase: "planting",
  };
}

function resolveAllowedTarget(tutorialContainer) {
  const text = getElementText(tutorialContainer);

  if (
    text.includes("урожай в кармане") ||
    text.includes("вернёмся") ||
    text.includes("вернемся") ||
    text.includes("перейти в район") ||
    text.includes("нажми район") ||
    text.includes("открой район")
  ) {
    return {
      target: findDistrictButton(),
      focus: "district",
      phase: "final",
    };
  }

  if (
    text.includes("добав") &&
    (text.includes("ведр") || text.includes("горш"))
  ) {
    return {
      target: findAddPotButton(),
      focus: "pot",
      phase: "pot",
    };
  }

  if (
    text.includes("подтверд") ||
    text.includes("правильный выбор") ||
    text.includes("посад")
  ) {
    return resolvePlantingRecoveryTarget();
  }

  if (
    text.includes("выбер") ||
    text.includes("томат") ||
    text.includes("семечк")
  ) {
    const tomatoSeed = findTomatoSeed();

    if (tomatoSeed) {
      return {
        target: tomatoSeed,
        focus: "tomato",
        phase: "seed",
      };
    }

    return {
      target: findSeedBasket(),
      focus: "basket",
      phase: "seed",
    };
  }

  if (
    text.includes("корзин") ||
    text.includes("открой семен") ||
    text.includes("нажми на семен")
  ) {
    return {
      target: findSeedBasket(),
      focus: "basket",
      phase: "basket",
    };
  }

  if (
    text.includes("собер") ||
    text.includes("урожай") ||
    text.includes("созрел")
  ) {
    return {
      target: findCollectablePlant(),
      focus: "collect",
      phase: "collect",
    };
  }

  return {
    target: findContinueButton(tutorialContainer),
    focus: "message",
    phase: "message",
  };
}

function TutorialInteractionGuard() {
  useEffect(() => {
    let tutorialContainer = null;
    let allowedTarget = null;
    let currentPhase = null;
    let frameId = 0;
    let missingTargetSince = null;
    let finalClickReleasedAt = 0;

    const clearAllowedTarget = () => {
      if (allowedTarget) {
        allowedTarget.classList.remove("tutorial-allowed-target");
      }

      allowedTarget = null;
    };

    const unlockEverything = () => {
      tutorialContainer = null;
      currentPhase = null;
      missingTargetSince = null;
      clearAllowedTarget();

      document.documentElement.classList.remove(
        "tutorial-interaction-locked",
      );
      document.body.removeAttribute("data-tutorial-focus");
    };

    const refresh = () => {
      const nextTutorialContainer = findTutorialContainer();

      /*
        После финального клика на район даём интерфейсу время переключиться.
        В этот момент блокировка уже снята.
      */
      if (Date.now() < finalClickReleasedAt) {
        unlockEverything();
        frameId = window.requestAnimationFrame(refresh);
        return;
      }

      if (!nextTutorialContainer) {
        unlockEverything();
        frameId = window.requestAnimationFrame(refresh);
        return;
      }

      tutorialContainer = nextTutorialContainer;

      const tutorialText = getElementText(tutorialContainer);
      const result = resolveAllowedTarget(tutorialContainer);

      currentPhase = result.phase;

      /*
        Страховка от вечной блокировки:
        если на финальном шаге кнопка района не найдена,
        не запираем всю игру навсегда.
      */
      if (!result.target) {
        if (missingTargetSince === null) {
          missingTargetSince = Date.now();
        }

        if (
          result.phase === "final" &&
          Date.now() - missingTargetSince > 700
        ) {
          unlockEverything();
          frameId = window.requestAnimationFrame(refresh);
          return;
        }
      } else {
        missingTargetSince = null;
      }

      document.documentElement.classList.add(
        "tutorial-interaction-locked",
      );

      if (
        tutorialText.includes("рост") ||
        tutorialText.includes("растёт") ||
        tutorialText.includes("растет") ||
        tutorialText.includes("1/3") ||
        tutorialText.includes("2/3")
      ) {
        document.body.setAttribute("data-tutorial-focus", "plant");
      } else {
        document.body.setAttribute(
          "data-tutorial-focus",
          result.focus || "message",
        );
      }

      if (result.target !== allowedTarget) {
        clearAllowedTarget();
        allowedTarget = result.target;

        if (allowedTarget) {
          allowedTarget.classList.add("tutorial-allowed-target");
        }
      }

      frameId = window.requestAnimationFrame(refresh);
    };

    const shouldAllowEvent = (event) => {
      if (!tutorialContainer || !allowedTarget) {
        return false;
      }

      const eventTarget = event.target;

      if (!(eventTarget instanceof Node)) {
        return false;
      }

      return (
        eventTarget === allowedTarget ||
        allowedTarget.contains(eventTarget)
      );
    };

    const blockPointerEvent = (event) => {
      if (!tutorialContainer) {
        return;
      }

      if (shouldAllowEvent(event)) {
        /*
          На финальном шаге после нажатия района
          сразу снимаем блокировку, чтобы новый экран работал нормально.
        */
        if (
          currentPhase === "final" &&
          (event.type === "click" || event.type === "pointerup")
        ) {
          finalClickReleasedAt = Date.now() + 1800;
          window.setTimeout(() => {
            unlockEverything();
          }, 0);
        }

        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    };

    const pointerEvents = [
      "click",
      "dblclick",
      "pointerdown",
      "pointerup",
      "pointercancel",
      "touchstart",
      "touchmove",
      "touchend",
      "mousedown",
      "mouseup",
      "wheel",
      "contextmenu",
    ];

    pointerEvents.forEach((eventName) => {
      document.addEventListener(
        eventName,
        blockPointerEvent,
        { capture: true, passive: false },
      );
    });

    refresh();

    return () => {
      window.cancelAnimationFrame(frameId);
      unlockEverything();

      pointerEvents.forEach((eventName) => {
        document.removeEventListener(
          eventName,
          blockPointerEvent,
          true,
        );
      });
    };
  }, []);

  return null;
}

export default TutorialInteractionGuard;
