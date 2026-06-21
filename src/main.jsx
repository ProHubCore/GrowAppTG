import { StrictMode, createElement } from "react";
import { createRoot } from "react-dom/client";
import "./styles/game.css";
import App from "./App.jsx";
import { prepareReleaseState } from "./core/bootstrap/prepareReleaseState";
import { ensureTelegramWebAppSdk } from "./core/bootstrap/loadTelegramSdk";

async function bootstrap() {
  await ensureTelegramWebAppSdk();
  prepareReleaseState();

  // Поддерживаем оба варианта index.html: игровой #root и старый #app.
  let rootElement = document.getElementById("root");

  if (!rootElement) {
    const legacyRootElement = document.getElementById("app");
    if (legacyRootElement) {
      legacyRootElement.id = "root";
      rootElement = legacyRootElement;
    }
  }

  if (!rootElement) {
    throw new Error('Root element not found. Add <div id="root"></div> to index.html.');
  }

  createRoot(rootElement).render(
    createElement(
      StrictMode,
      null,
      createElement(App),
    ),
  );
}

bootstrap().catch((error) => {
  console.error("Grow App bootstrap failed:", error);
  document.body.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#110e0b;color:#f4ead0;font-family:system-ui;text-align:center">
      <section><h1>Не удалось запустить игру</h1><p>Обнови страницу и попробуй ещё раз.</p><button onclick="location.reload()" style="padding:12px 22px;border:0;border-radius:12px;font-weight:800">Перезапустить</button></section>
    </main>`;
});
