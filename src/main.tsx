import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/game.css";
import App from "./App";
import { prepareReleaseState } from "./core/bootstrap/prepareReleaseState";

prepareReleaseState();

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);