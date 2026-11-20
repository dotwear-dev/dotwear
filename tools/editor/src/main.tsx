import "@dotwear/web/tokens.css";
import "@dotwear/icons/palette.css";
import "./styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { devServerStore } from "./storage/devServerStore.ts";

// 今は開発サーバー経由で手元のファイルに保存する。別の保存先にするときは、ここで別の store を渡す
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App store={devServerStore} />
  </StrictMode>,
);
