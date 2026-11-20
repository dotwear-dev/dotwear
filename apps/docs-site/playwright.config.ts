// docs-site の E2E テスト（ADR-016）。ビルドした静的サイトを astro preview で配信して検査する
import { defineConfig, devices } from "@playwright/test";

const PORT = 4329;

export default defineConfig({
  testDir: "e2e",
  // スナップショットのファイル名に OS 名を入れない（倍率で画像が変わるので、プロジェクト名は入れる）。
  // 検査するのは文字を含まない SVG だけなので、macOS と Linux（CI）で同じ画像になる想定
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  reporter: process.env["CI"] ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    // 端末の倍率 1 倍と 2 倍（Retina）の両方で、にじまないことを確かめる
    { name: "chromium-1x", use: { ...devices["Desktop Chrome"], deviceScaleFactor: 1 } },
    { name: "chromium-2x", use: { ...devices["Desktop Chrome"], deviceScaleFactor: 2 } },
    // Safari（WebKit）でも確かめる。小数の位置の揃え方がブラウザごとに違うため。
    // Firefox は手元の macOS で Playwright のブラウザが起動しなかったので、いったん外している（ADR-016）
    { name: "webkit-2x", use: { ...devices["Desktop Safari"], deviceScaleFactor: 2 } },
  ],
  webServer: {
    // --ignore-lock：Astro 7 の preview はロックファイルで多重起動を防ぐが、テストでは毎回自分で起動して終了させるため使わない
    command: `pnpm exec astro preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env["CI"],
  },
});
