// ビルド時に元データ（icons/・tokens/）を読む。ページの生成時だけに使う（ブラウザには送らない）
import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { exportName, swiftName } from "@dotwear/generator/naming";

// astro dev / build は apps/docs-site で実行されるので、そこからリポジトリルートをたどる
const ROOT = path.resolve(process.cwd(), "../..");

export interface IconMeta {
  name: string;
  exportName: string;
  /** Swift の名前（DotwearIconDefinition の static プロパティ。例：save → save） */
  swiftName: string;
  category: string;
  tier: "free" | "pro";
  tags: string[];
  /** 描き分けがあるグリッド（16 は必ず含む） */
  grids: number[];
}

export async function loadIconMeta(): Promise<IconMeta[]> {
  const dir = path.join(ROOT, "icons");
  const folders = (await readdir(dir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  const all = await Promise.all(
    folders.map(async (folder) => {
      const json = JSON.parse(await readFile(path.join(dir, folder, "icon.json"), "utf8")) as {
        name: string;
        category: string;
        tier: "free" | "pro";
        tags?: string[];
        sizes: Record<string, string[]>;
      };
      return {
        name: json.name,
        exportName: exportName(json.name),
        swiftName: swiftName(json.name),
        category: json.category,
        tier: json.tier,
        tags: json.tags ?? [],
        grids: Object.keys(json.sizes).map(Number).sort((a, b) => a - b),
      };
    }),
  );
  // 公開のサイトに載せるのは、公開のパッケージ（@dotwear/icons）に入っている Free のアイコンだけ（ADR-023）
  return all.filter((i) => i.tier === "free");
}

export interface PaletteTheme {
  name: string;
  /** Swift の DotwearPalette の static プロパティ名（retro-green → retroGreen） */
  swiftName: string;
  /** スロット → 色 */
  slots: Record<string, string>;
}

/** パレットのテーマと色（tokens/palette.json） */
export async function loadPalette(): Promise<PaletteTheme[]> {
  const json = JSON.parse(await readFile(path.join(ROOT, "tokens", "palette.json"), "utf8")) as {
    palette: Record<string, Record<string, { $value: string }>>;
  };
  return Object.entries(json.palette).map(([name, slots]) => ({
    name,
    swiftName: swiftName(name).replaceAll("`", ""),
    slots: Object.fromEntries(Object.entries(slots).map(([slot, t]) => [slot, t.$value])),
  }));
}

/** パレットのテーマ名の一覧（tokens/palette.json） */
export async function loadPaletteThemes(): Promise<string[]> {
  const json = JSON.parse(await readFile(path.join(ROOT, "tokens", "palette.json"), "utf8")) as { palette: Record<string, unknown> };
  return Object.keys(json.palette);
}

/** @dotwear/icons が配る SVG ファイルのディレクトリ */
export function iconSvgDir(): string {
  const require = createRequire(import.meta.url);
  return path.join(path.dirname(require.resolve("@dotwear/icons/palette.css")), "svg");
}
