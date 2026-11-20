// ブランド素材（brand/<name>/icon.json）→ SVG（<root>/generated/brand/）
// パッケージでは配らない（ADR-010）。docs-site などで使う。
//
// アイコンとの違い（ADR-011）：`2` のマスはパレットではなく color.brand で塗る。
// テーマやパレットを替えてもロゴのアクセント色は変えないため、CSS 変数ではなく色を直接書く。
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CellColor } from "../paths/rects.js";
import { GRID_SIZES, type IconSource } from "../source/load.js";
import { renderSvg, type FillResolver } from "./svg.js";

export interface EmitBrandOptions {
  brand: IconSource[];
  /** color.brand の色（例 "#ff933e"） */
  brandColor: string;
  /** 出力先（<root>/generated/brand）。中身は毎回作り直す */
  outDir: string;
}

/** ロゴ用の塗り分け。`#` は currentColor（明るい背景では color.fg、暗い背景では color.bg を指定して使う） */
export function brandFillResolver(brandColor: string): FillResolver {
  return (color: CellColor) => {
    if (color === "#") return "currentColor";
    if (color === "2") return brandColor;
    throw new Error(`ブランド素材ではスロット ${color} を使えません（使えるのは # と 2）`);
  };
}

export async function emitBrand({ brand, brandColor, outDir }: EmitBrandOptions): Promise<void> {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  const fill = brandFillResolver(brandColor);
  await Promise.all(
    brand.flatMap((item) =>
      GRID_SIZES.flatMap((size) => {
        const grid = item.sizes[size];
        if (!grid) return [];
        // ロゴはサイズで描き分けている（16 と 24 でマス目が別）ので、すべてサイズ付きの名前にする
        return [writeFile(path.join(outDir, `${item.name}-${size}.svg`), renderSvg(grid, { fill, header: true }))];
      }),
    ),
  );
}

/** tokens/color.json から color.brand の色を読む */
export async function loadBrandColor(root: string): Promise<string> {
  const json = JSON.parse(await readFile(path.join(root, "tokens", "color.json"), "utf8")) as {
    color?: { brand?: { $value?: unknown } };
  };
  const value = json.color?.brand?.$value;
  if (typeof value !== "string") throw new Error("tokens/color.json に color.brand がありません");
  return value;
}
