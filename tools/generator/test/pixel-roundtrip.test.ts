// pixel-roundtrip（最重要のテスト。CLAUDE.md「テストの考え方」）
// 生成した SVG をグリッドサイズ（1 倍）でラスタライズし、元データのマス目と 1 ピクセル単位で一致することを確かめる。
//
// resvg は CSS 変数（var(--dw-palette-*)）と currentColor の指定色を解釈できないので、
// 出力した SVG の fill だけを「文字ごとに決めた識別色」に置き換えてからラスタライズする。
// パスはそのまま使うので、配布する SVG の形そのものを検証できる。
import { readFile, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { emitBrand, loadBrandColor } from "../src/emit/brand.js";
import { emitWeb } from "../src/emit/web.js";
import type { CellColor } from "../src/paths/rects.js";
import { GRID_SIZES, loadIcons, loadPalette, type IconSource } from "../src/source/load.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

// 文字ごとの識別色（RGB がすべて異なり、透明と区別できるもの）
const PROBE: Record<CellColor, [number, number, number]> = {
  "#": [0, 0, 0],
  "2": [255, 0, 0],
  "3": [0, 255, 0],
  "4": [0, 0, 255],
  "5": [255, 255, 0],
  "6": [255, 0, 255],
  "7": [0, 255, 255],
  "8": [128, 64, 32],
  "9": [32, 64, 128],
};
const hex = ([r, g, b]: [number, number, number]) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

// 出力した SVG の fill を識別色に置き換える。想定外の fill があればテストを失敗させる。
// brandColor を渡したときは、その色をスロット 2 として扱う（ロゴは 2 を color.brand で直接塗る。ADR-011）
function probeFills(svg: string, brandColor?: string): string {
  return svg.replace(/fill="([^"]*)"/g, (_, value: string) => {
    if (value === "currentColor") return `fill="${hex(PROBE["#"])}"`;
    if (brandColor && value === brandColor) return `fill="${hex(PROBE["2"])}"`;
    const m = /^var\(--dw-palette-([2-9])(?:, #[0-9a-f]{6})?\)$/.exec(value);
    if (!m) throw new Error(`想定外の fill: ${value}`);
    return `fill="${hex(PROBE[m[1] as CellColor])}"`;
  });
}

// SVG を 1 倍でラスタライズし、各ピクセルを元データの文字に戻す
function rasterizeToGrid(svg: string, size: number): string[] {
  const image = new Resvg(svg, {
    fitTo: { mode: "original" },
    background: "rgba(0,0,0,0)",
    // アイコンに文字はないので、システムフォントを読み込まない（読み込むと 1 枚あたり数秒かかる）
    font: { loadSystemFonts: false },
  }).render();
  expect([image.width, image.height]).toEqual([size, size]);
  const px = image.pixels;
  const rows: string[] = [];
  for (let y = 0; y < size; y++) {
    let row = "";
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const [r, g, b, a] = [px[i]!, px[i + 1]!, px[i + 2]!, px[i + 3]!];
      if (a === 0) {
        row += ".";
        continue;
      }
      // 不透明度が 255 でない＝境界がにじんでいる
      if (a !== 255) throw new Error(`(${x}, ${y}) が半透明です（alpha=${a}）。境界がにじんでいます`);
      const hit = (Object.entries(PROBE) as [CellColor, number[]][]).find(([, c]) => c[0] === r && c[1] === g && c[2] === b);
      if (!hit) throw new Error(`(${x}, ${y}) の色 rgb(${r},${g},${b}) が識別色と一致しません`);
      row += hit[0];
    }
    rows.push(row);
  }
  return rows;
}

function cases(icons: IconSource[]) {
  return icons.flatMap((icon) =>
    GRID_SIZES.filter((s) => icon.sizes[s]).map((size) => ({ icon, size, grid: icon.sizes[size]! })),
  );
}

// it.each にケースを渡すため、元データはファイルの読み込み時に読んでおく
const icons = await loadIcons(path.join(REPO_ROOT, "icons"));
const brand = await loadIcons(path.join(REPO_ROOT, "brand"));
const palette = await loadPalette(REPO_ROOT);
const brandColor = await loadBrandColor(REPO_ROOT);
let outDir: string;

beforeAll(async () => {
  // 実際の出力と同じ処理で、一時ディレクトリに書き出す
  outDir = await mkdtemp(path.join(os.tmpdir(), "dotwear-roundtrip-"));
  // Free と Pro の両方を出力して、全部のアイコンを検査する（Kit と同じ出力。ADR-023）
  await emitWeb({ icons, palette, outDir, tiers: ["free", "pro"] });
  await emitBrand({ brand, brandColor, outDir: path.join(outDir, "brand") });
});

const iconFile = (name: string, size: string) => path.join(outDir, "svg", size === "16" ? `${name}.svg` : `${name}-${size}.svg`);
const brandFile = (name: string, size: string) => path.join(outDir, "brand", `${name}-${size}.svg`);

afterAll(async () => {
  await rm(outDir, { recursive: true, force: true });
});

describe("pixel-roundtrip: icons/（配布する SVG ファイル）", () => {
  it("アイコンが 1 つ以上ある", () => {
    expect(icons.length).toBeGreaterThan(0);
  });

  it.each(cases(icons))("$icon.name（$size）", async ({ icon, size, grid }) => {
    const svg = await readFile(iconFile(icon.name, size), "utf8");
    expect(rasterizeToGrid(probeFills(svg), Number(size))).toEqual(grid);
  });
});

describe("pixel-roundtrip: brand/（ロゴの SVG ファイル）", () => {
  it.each(cases(brand))("$icon.name（$size）", async ({ icon, grid, size }) => {
    const svg = await readFile(brandFile(icon.name, size), "utf8");
    expect(rasterizeToGrid(probeFills(svg, brandColor), Number(size))).toEqual(grid);
  });

  it("スロット 2 は CSS 変数ではなく color.brand の色で塗る", async () => {
    for (const { icon, size } of cases(brand)) {
      const svg = await readFile(brandFile(icon.name, size), "utf8");
      expect(svg).toContain(`fill="${brandColor}"`);
      expect(svg).not.toContain("var(");
    }
  });
});

describe("生成した SVG の形", () => {
  it("パスの座標はすべて整数で、命令は M / h / v / z だけ", async () => {
    const files = [
      ...cases(icons).map(({ icon, size }) => iconFile(icon.name, size)),
      ...cases(brand).map(({ icon, size }) => brandFile(icon.name, size)),
    ];
    const svgs = await Promise.all(files.map((f) => readFile(f, "utf8")));
    for (const svg of svgs) {
      for (const [, d] of svg.matchAll(/ d="([^"]*)"/g)) {
        expect(d).not.toMatch(/\./);
        expect(d).toMatch(/^(M\d+ \d+h\d+v\d+h-\d+z)+$/);
      }
      expect(svg).toContain('shape-rendering="crispEdges"');
    }
  });
});
