// 元データ（icons/・brand/・tokens/palette.json）を読み込む。
// 形式の検証は validate が担当するので、ここでは validate に通ったデータを前提にする。
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { CellColor } from "../paths/rects.js";

export type GridSize = "12" | "16" | "24";
export const GRID_SIZES: readonly GridSize[] = ["12", "16", "24"];

export interface IconSource {
  name: string;
  category: string;
  tier: "free" | "pro";
  tags: string[];
  sizes: Partial<Record<GridSize, string[]>> & { "16": string[] };
}

/** パレットのテーマ。キーはスロット（"2"〜"9"）、値は色 */
export type PaletteTheme = Partial<Record<Exclude<CellColor, "#">, string>>;
export type Palette = Record<string, PaletteTheme>;

/** dir（icons/ や brand/）配下の icon.json を名前順に読み込む */
export async function loadIcons(dir: string): Promise<IconSource[]> {
  const folders = (await readdir(dir, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();
  return Promise.all(
    folders.map(async (folder) => {
      const json = JSON.parse(await readFile(path.join(dir, folder, "icon.json"), "utf8")) as IconSource;
      return { ...json, tags: json.tags ?? [] };
    }),
  );
}

/** tokens/palette.json を { テーマ名: { スロット: 色 } } の形で読み込む（DTCG の $value だけを取り出す） */
export async function loadPalette(root: string): Promise<Palette> {
  const json = JSON.parse(await readFile(path.join(root, "tokens", "palette.json"), "utf8")) as {
    palette: Record<string, Record<string, { $value: string }>>;
  };
  const palette: Palette = {};
  for (const [theme, slots] of Object.entries(json.palette)) {
    const t: PaletteTheme = {};
    for (const [slot, token] of Object.entries(slots)) t[slot as keyof PaletteTheme] = token.$value;
    palette[theme] = t;
  }
  return palette;
}
