// サイトのアイコン（favicon・apple-touch-icon）が、ロゴの元データのマス目を整数倍で拡大したものと 1 ピクセルずつ一致することを確かめる。
// PNG は centeredLogo の SVG を resvg で描いたものなので、同じ SVG を描いて比べる（pixel-roundtrip と同じ考え方）
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { describe, expect, it } from "vitest";
import { centeredLogo, faviconSvg, loadSiteColors, ogSvg, TOUCH_ICON_SIZE } from "../src/emit/site-icons.js";
import { loadIcons } from "../src/source/load.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const logo = (await loadIcons(path.join(REPO_ROOT, "brand"))).find((b) => b.name === "dotwear")!;
const colors = await loadSiteColors(REPO_ROOT);

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** SVG を描き、各ピクセルが「マス目を scale 倍して offset だけずらした絵」と同じ色かを確かめる */
function expectScaledLogo(svg: string, grid: readonly string[], size: number, scale: number, offset: number, background?: string): void {
  const image = new Resvg(svg, { fitTo: { mode: "original" }, background: "rgba(0,0,0,0)", font: { loadSystemFonts: false } }).render();
  expect([image.width, image.height]).toEqual([size, size]);
  const bad: string[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = Math.floor((x - offset) / scale);
      const gy = Math.floor((y - offset) / scale);
      const inside = x >= offset && y >= offset && gx < grid.length && gy < grid.length;
      const ch = inside ? grid[gy]![gx]! : ".";
      const want = ch === "#" ? [...rgb(colors.fg), 255] : ch === "2" ? [...rgb(colors.brand), 255] : background ? [...rgb(background), 255] : [0, 0, 0, 0];
      const i = (y * size + x) * 4;
      const got = [...image.pixels.subarray(i, i + 4)];
      // 透明なピクセルは色を問わない
      const same = want[3] === 0 ? got[3] === 0 : got.every((v, k) => v === want[k]);
      if (!same) bad.push(`(${x}, ${y}) = ${got.join(",")}、期待は ${ch}`);
    }
  }
  expect(bad.slice(0, 5)).toEqual([]);
}

describe("サイトのアイコン", () => {
  it("favicon（32px の PNG）は 16 マスのロゴを 2 倍にしたもの", () => {
    expectScaledLogo(centeredLogo(logo.sizes["16"]!, colors, 32, false), logo.sizes["16"]!, 32, 2, 0);
  });

  it("apple-touch-icon は 24 マスのロゴを 6 倍にし、背景を付けて真ん中に置いたもの", () => {
    expectScaledLogo(centeredLogo(logo.sizes["24"]!, colors, TOUCH_ICON_SIZE, true, 18), logo.sizes["24"]!, TOUCH_ICON_SIZE, 6, 18, colors.bg);
  });

  it("favicon.svg は 16 マスのロゴで、ダークモードでは本体の色だけを反転する", () => {
    const svg = faviconSvg(logo.sizes["16"]!, colors);
    expectScaledLogo(svg, logo.sizes["16"]!, 16, 1, 0);
    expect(svg).toContain(`@media (prefers-color-scheme: dark){.body{fill:${colors.bg}}}`);
  });

  it("OGP 画像のロゴと文字の位置は整数", () => {
    const svg = ogSvg(logo.sizes["24"]!, colors, "tagline");
    for (const m of svg.matchAll(/(?:translate\(|x=|y=)"?([\d.]+)/g)) expect(Number.isInteger(Number(m[1])), m[0]).toBe(true);
  });
});
