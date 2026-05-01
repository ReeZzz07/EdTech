import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initFrontendSentry } from "./instrument";
import "@telegram-apps/telegram-ui/dist/styles.css";
import "./styles/globals.css";
import { App } from "./App";

initFrontendSentry();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
