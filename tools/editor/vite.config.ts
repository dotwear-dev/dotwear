// エディタ（開発用）。`pnpm dev:editor` で起動する。
// 保存の API（server/iconApi.ts）は開発サーバーだけに付く。build した静的な画面には含まれない
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { iconApi } from "./server/iconApi.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig({
  plugins: [react(), iconApi(root)],
  server: { port: 5174 },
});
