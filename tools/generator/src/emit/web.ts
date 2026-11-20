// @dotwear/icons の生成物を出力する（packages/icons/generated/）
//   svg/<name>.svg       16 のグリッド。12・24 の描き分けは svg/<name>-12.svg・svg/<name>-24.svg
//   icons.ts             アイコンの定義オブジェクト（dwSave など）と byName
//   palette.ts           パレットの default テーマの色（CSS 変数のフォールバック用）
//   palette.css          テーマごとの CSS 変数 --dw-palette-*
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { CELL_COLORS, type CellColor } from "../paths/rects.js";
import { GRID_SIZES, type IconSource, type Palette, type PaletteTheme } from "../source/load.js";
import { exportName, ICON_PREFIXES, type IconTier } from "./naming.js";
import { GENERATED_HEADER, gridToLayers, renderSvg, webFillResolver } from "./svg.js";

export const DEFAULT_THEME = "default";

export interface EmitWebOptions {
  icons: IconSource[];
  palette: Palette;
  /** 出力先（packages/icons/generated、Kit は packages/kit/generated）。中身は毎回作り直す */
  outDir: string;
  /**
   * 含める tier（ADR-023）。Free のパッケージは ["free"] で、Pro のアイコンを一切含めない。
   * Kit は ["free", "pro"] で全部を含める
   */
  tiers?: readonly IconTier[];
  /** 生成コードが型を import する先。@dotwear/icons 自身は "../src/types.js"、Kit は "@dotwear/icons" */
  typesImport?: string;
}

/** 指定した tier のアイコンだけを残す */
export function filterTiers(icons: IconSource[], tiers: readonly IconTier[]): IconSource[] {
  return icons.filter((i) => tiers.includes(i.tier));
}

export async function emitWeb({ icons: all, palette, outDir, tiers = ["free"], typesImport = "../src/types.js" }: EmitWebOptions): Promise<void> {
  const icons = filterTiers(all, tiers);
  const defaults = palette[DEFAULT_THEME];
  if (!defaults) throw new Error(`tokens/palette.json に "${DEFAULT_THEME}" テーマがありません`);
  checkPaletteSlots(icons, defaults);

  // 古い生成物（消したアイコンなど）が残らないように、出力先を空にしてから書く
  await rm(outDir, { recursive: true, force: true });
  await mkdir(path.join(outDir, "svg"), { recursive: true });

  const fill = webFillResolver(defaults);
  await Promise.all(
    icons.flatMap((icon) =>
      GRID_SIZES.flatMap((size) => {
        const grid = icon.sizes[size];
        if (!grid) return [];
        const file = size === "16" ? `${icon.name}.svg` : `${icon.name}-${size}.svg`;
        return [writeFile(path.join(outDir, "svg", file), renderSvg(grid, { fill, header: true }))];
      }),
    ),
  );

  await writeFile(path.join(outDir, "icons.ts"), renderIconsModule(icons, tiers, typesImport));
  await writeFile(path.join(outDir, "palette.ts"), renderPaletteModule(defaults));
  await writeFile(path.join(outDir, "palette.css"), renderPaletteCss(palette));
}

function renderIconsModule(icons: IconSource[], tiers: readonly IconTier[], typesImport: string): string {
  const lines = [
    `// ${GENERATED_HEADER}`,
    `import type { DotwearIconDefinition } from ${JSON.stringify(typesImport)};`,
    "",
  ];
  for (const icon of icons) {
    const prefix = ICON_PREFIXES[icon.tier];
    const grids = GRID_SIZES.filter((s) => icon.sizes[s]).map((s) => {
      const layers = gridToLayers(icon.sizes[s]!).map((l) => `{ color: ${JSON.stringify(l.color)}, d: ${JSON.stringify(l.d)} }`);
      return `    ${s}: [${layers.join(", ")}],`;
    });
    lines.push(
      `/** ${icon.name}（${icon.category}${icon.tags.length ? `。${icon.tags.join("・")}` : ""}） */`,
      `export const ${exportName(icon.name, icon.tier)}: DotwearIconDefinition<${JSON.stringify(icon.name)}> = {`,
      `  prefix: ${JSON.stringify(prefix)},`,
      `  name: ${JSON.stringify(icon.name)},`,
      `  grids: {`,
      ...grids,
      `  },`,
      `};`,
      "",
    );
  }
  // 名前から動的に選ぶための一覧。これを import するとすべてのアイコンがバンドルに入るので、静的に決まる場合は dwXxx を直接使う
  lines.push(
    `export const byName = {`,
    ...icons.map((i) => `  ${JSON.stringify(i.name)}: ${exportName(i.name, i.tier)},`),
    `} as const;`,
    "",
    `export type DotwearIconName = keyof typeof byName;`,
    "",
    // Font Awesome の byPrefixAndName と同じ形（ADR-023）。含めた tier のプレフィックスだけを持つので、
    // Free のパッケージで Pro のプレフィックスを書くと TypeScript がエラーにする
    `export const byPrefixAndName = {`,
    ...tiers.flatMap((tier) => [
      `  ${JSON.stringify(ICON_PREFIXES[tier])}: {`,
      ...icons.filter((i) => i.tier === tier).map((i) => `    ${JSON.stringify(i.name)}: ${exportName(i.name, i.tier)},`),
      `  },`,
    ]),
    `} as const;`,
    "",
  );
  return lines.join("\n");
}

function renderPaletteModule(defaults: PaletteTheme): string {
  const entries = CELL_COLORS.filter((c) => c !== "#" && defaults[c as keyof PaletteTheme]).map(
    (c) => `  ${JSON.stringify(c)}: ${JSON.stringify(defaults[c as keyof PaletteTheme])},`,
  );
  return [
    `// ${GENERATED_HEADER}`,
    `// パレットの default テーマ。CSS 変数 --dw-palette-* が未定義のときのフォールバックに使う`,
    `export const paletteDefaults: Readonly<Record<string, string>> = {`,
    ...entries,
    `};`,
    "",
  ].join("\n");
}

function renderPaletteCss(palette: Palette): string {
  const blocks = Object.entries(palette).map(([theme, slots]) => {
    // default テーマは :root にも置き、何も指定しなくても効くようにする
    const selector = theme === DEFAULT_THEME ? `:root,\n[data-dw-palette="${theme}"]` : `[data-dw-palette="${theme}"]`;
    const vars = Object.entries(slots).map(([slot, color]) => `  --dw-palette-${slot}: ${color};`);
    return `${selector} {\n${vars.join("\n")}\n}`;
  });
  return `/* ${GENERATED_HEADER} */\n${blocks.join("\n\n")}\n`;
}

// アイコンが使っているスロットが default テーマにない場合は、色が決まらないのでエラーにする（Swift の出力でも使う）
export function checkPaletteSlots(icons: IconSource[], defaults: PaletteTheme): void {
  const missing: string[] = [];
  for (const icon of icons) {
    for (const size of GRID_SIZES) {
      const grid = icon.sizes[size];
      if (!grid) continue;
      const used = new Set(grid.join("").replace(/[.#]/g, ""));
      for (const slot of used) {
        if (!defaults[slot as Exclude<CellColor, "#">]) missing.push(`${icon.name}（${size}）: スロット ${slot}`);
      }
    }
  }
  if (missing.length) {
    throw new Error(`パレットの "${DEFAULT_THEME}" テーマに色がないスロットを使っています:\n  ${missing.join("\n  ")}`);
  }
}
