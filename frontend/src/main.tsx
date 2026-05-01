import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initFrontendSentry } from "./instrument";
import "@telegram-apps/telegram-ui/dist/styles.css";
import "./styles/globals.css";
import { App } from "./App";

initFrontendSentry();

if (import.meta.env.PROD && typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* ignore */
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
