// Web 向けの出力（emit/web.ts）のうち、パレットの TypeScript モジュールの単体テスト。
// アイコンの描画は pixel-roundtrip.test.ts が見ている
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { emitWeb } from "../src/emit/web.js";
import type { IconSource, Palette } from "../src/source/load.js";

const palette: Palette = { default: { "2": "#2f5bd3", "3": "#111111" }, "retro-green": { "2": "#0f380f" } };
const ROWS = ["2" + ".".repeat(15), ...Array(15).fill(".".repeat(16))];
const icon: IconSource = { name: "dot", category: "test", tier: "free", tags: [], sizes: { "16": ROWS } };

let dir: string | undefined;
afterEach(async () => dir && rm(dir, { recursive: true, force: true }));

describe("palette.ts", () => {
  it("default のほかに、すべてのパレットを名前（data-dw-palette と同じ）で引ける形で出す", async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "dw-web-"));
    await emitWeb({ icons: [icon], palette, outDir: dir });
    const ts = await readFile(path.join(dir, "palette.ts"), "utf8");
    expect(ts).toContain('export const paletteDefaults: Readonly<Record<string, string>> = {\n  "2": "#2f5bd3",\n  "3": "#111111",\n};');
    expect(ts).toContain('  "retro-green": {\n    "2": "#0f380f",\n  },');
    expect(ts).toContain("export type DotwearPaletteName = keyof typeof palettes;");
  });
});
