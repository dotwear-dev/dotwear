// Android（packages/android）の生成物を出力する。
//   icons/src/generated/kotlin/dev/dotwear/icons/DotwearIcons.kt          アイコンの定義（DotwearIcons.Save など）
//   icons/src/generated/kotlin/dev/dotwear/icons/DotwearPaletteThemes.kt  パレットのテーマ（DotwearPalette.Default など）
//   icons/src/testGenerated/kotlin/dev/dotwear/icons/SourceGrids.kt       pixel-roundtrip テスト用の元データのマス目
//
// iOS と同じく、パスの文字列ではなく矩形を出す（ADR-019）。矩形は Web・iOS と同じ gridToRects で作る
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { gridToRects, type CellColor } from "../paths/rects.js";
import { GRID_SIZES, type IconSource, type Palette } from "../source/load.js";
import { kotlinName } from "./naming.js";
import { GENERATED_HEADER } from "./svg.js";
import { checkPaletteSlots, DEFAULT_THEME, filterTiers } from "./web.js";

const PACKAGE = "dev.dotwear.icons";

export interface EmitAndroidOptions {
  icons: IconSource[];
  palette: Palette;
  /** packages/android。この下の icons/src/generated と icons/src/testGenerated だけを作り直す */
  projectDir: string;
}

export function androidOutDirs(projectDir: string) {
  const pkg = PACKAGE.split(".");
  return {
    sources: path.join(projectDir, "icons", "src", "generated", "kotlin", ...pkg),
    tests: path.join(projectDir, "icons", "src", "testGenerated", "kotlin", ...pkg),
    sourcesRoot: path.join(projectDir, "icons", "src", "generated"),
    testsRoot: path.join(projectDir, "icons", "src", "testGenerated"),
  };
}

export async function emitAndroid({ icons: all, palette, projectDir }: EmitAndroidOptions): Promise<void> {
  // 公開の dotwear-icons には Free のアイコンだけを入れる（Pro は Kit だけ。ADR-023）
  const icons = filterTiers(all, ["free"]);
  const defaults = palette[DEFAULT_THEME];
  if (!defaults) throw new Error(`tokens/palette.json に "${DEFAULT_THEME}" テーマがありません`);
  checkPaletteSlots(icons, defaults);

  const dirs = androidOutDirs(projectDir);
  await rm(dirs.sourcesRoot, { recursive: true, force: true });
  await rm(dirs.testsRoot, { recursive: true, force: true });
  await mkdir(dirs.sources, { recursive: true });
  await mkdir(dirs.tests, { recursive: true });
  await writeFile(path.join(dirs.sources, "DotwearIcons.kt"), renderIcons(icons));
  await writeFile(path.join(dirs.sources, "DotwearPaletteThemes.kt"), renderPalette(palette));
  await writeFile(path.join(dirs.tests, "SourceGrids.kt"), renderSourceGrids(icons));
}

function kotlinColor(color: CellColor): string {
  return color === "#" ? "DotwearIconColor.Foreground" : `DotwearIconColor.Palette(${color})`;
}

function renderIcons(icons: IconSource[]): string {
  const lines = [`// ${GENERATED_HEADER}`, `package ${PACKAGE}`, "", "object DotwearIcons {"];
  for (const icon of icons) {
    lines.push(
      `    /** ${icon.name}（${icon.category}${icon.tags.length ? `。${icon.tags.join("・")}` : ""}） */`,
      // by lazy：アイコンが数百個になっても、使うものだけを作る（クラスの初期化を軽くする）
      `    val ${kotlinName(icon.name)}: DotwearIconDefinition by lazy {`,
      `        DotwearIconDefinition(`,
      `            name = ${JSON.stringify(icon.name)},`,
      `            grids = mapOf(`,
    );
    for (const size of GRID_SIZES) {
      const grid = icon.sizes[size];
      if (!grid) continue;
      lines.push(`                DotwearIconGrid.Grid${size} to listOf(`);
      for (const [color, rects] of gridToRects(grid)) {
        const packed = rects.flatMap((r) => [r.x, r.y, r.w, r.h]).join(", ");
        lines.push(`                    DotwearIconLayer(${kotlinColor(color)}, intArrayOf(${packed})),`);
      }
      lines.push(`                ),`);
    }
    lines.push(`            ),`, `        )`, `    }`, "");
  }
  lines.push(
    `    /** すべてのアイコン（名前順） */`,
    `    val all: List<DotwearIconDefinition> by lazy {`,
    `        listOf(${icons.map((i) => kotlinName(i.name)).join(", ")})`,
    `    }`,
    "",
    `    /** 名前から選ぶ（Web の byName に相当）。見つからなければ null */`,
    `    fun named(name: String): DotwearIconDefinition? = all.firstOrNull { it.name == name }`,
    "}",
    "",
  );
  return lines.join("\n");
}

function renderPalette(palette: Palette): string {
  const lines = [`// ${GENERATED_HEADER}`, `package ${PACKAGE}`, ""];
  for (const [theme, slots] of Object.entries(palette)) {
    const entries = Object.entries(slots).map(([slot, hex]) => `${slot} to 0x${hex!.replace("#", "").toUpperCase()}L`);
    const backing = `palette${kotlinName(theme)}`;
    lines.push(
      `private val ${backing} = DotwearPalette.fromHex(${entries.join(", ")})`,
      `val DotwearPalette.Companion.${kotlinName(theme)}: DotwearPalette get() = ${backing}`,
      "",
    );
  }
  return lines.join("\n");
}

function renderSourceGrids(icons: IconSource[]): string {
  const lines = [
    `// ${GENERATED_HEADER}`,
    `package ${PACKAGE}`,
    "",
    "/** 元データのマス目（icons/<name>/icon.json）。描いた結果がこれと 1 ピクセル単位で一致するかを確かめる */",
    "val sourceGrids: List<Triple<DotwearIconDefinition, DotwearIconGrid, List<String>>> = listOf(",
  ];
  for (const icon of icons) {
    for (const size of GRID_SIZES) {
      const grid = icon.sizes[size];
      if (!grid) continue;
      lines.push(
        `    Triple(DotwearIcons.${kotlinName(icon.name)}, DotwearIconGrid.Grid${size}, listOf(`,
        ...grid.map((r) => `        ${JSON.stringify(r)},`),
        "    )),",
      );
    }
  }
  lines.push(")", "");
  return lines.join("\n");
}

// ---- Kit（ADR-023）：Pro のアイコンを DotwearIcons.Pro.<名前> として出す（モジュール :kit、dev.dotwear.kit）----
// `Pro` の名前はプレフィックスと同じく仮（Q10）

export function androidKitOutDirs(projectDir: string) {
  const pkg = ["dev", "dotwear", "kit"];
  return {
    sources: path.join(projectDir, "kit", "src", "generated", "kotlin", ...pkg),
    tests: path.join(projectDir, "kit", "src", "testGenerated", "kotlin", ...pkg),
    sourcesRoot: path.join(projectDir, "kit", "src", "generated"),
    testsRoot: path.join(projectDir, "kit", "src", "testGenerated"),
  };
}

export async function emitAndroidKit({ icons: all, palette, projectDir }: EmitAndroidOptions): Promise<void> {
  const icons = filterTiers(all, ["pro"]);
  const defaults = palette[DEFAULT_THEME];
  if (!defaults) throw new Error(`tokens/palette.json に "${DEFAULT_THEME}" テーマがありません`);
  checkPaletteSlots(icons, defaults);
  const dirs = androidKitOutDirs(projectDir);
  await rm(dirs.sourcesRoot, { recursive: true, force: true });
  await rm(dirs.testsRoot, { recursive: true, force: true });
  await mkdir(dirs.sources, { recursive: true });
  await mkdir(dirs.tests, { recursive: true });
  const lines = [
    `// ${GENERATED_HEADER}`,
    "package dev.dotwear.kit",
    "",
    "import dev.dotwear.icons.DotwearIconColor",
    "import dev.dotwear.icons.DotwearIconDefinition",
    "import dev.dotwear.icons.DotwearIconGrid",
    "import dev.dotwear.icons.DotwearIconLayer",
    "import dev.dotwear.icons.DotwearIcons",
    "",
    "/** Pro のアイコン。`DotwearIcon(DotwearIcons.Pro.Crown)` のように使う（Kit を入れたときだけ書ける。ADR-023） */",
    "object DotwearProIcons {",
  ];
  for (const icon of icons) {
    lines.push(
      `    /** ${icon.name}（${icon.category}${icon.tags.length ? `。${icon.tags.join("・")}` : ""}） */`,
      `    val ${kotlinName(icon.name)}: DotwearIconDefinition by lazy {`,
      `        DotwearIconDefinition(`,
      `            name = ${JSON.stringify(icon.name)},`,
      `            grids = mapOf(`,
    );
    for (const size of GRID_SIZES) {
      const grid = icon.sizes[size];
      if (!grid) continue;
      lines.push(`                DotwearIconGrid.Grid${size} to listOf(`);
      for (const [color, rects] of gridToRects(grid)) {
        lines.push(`                    DotwearIconLayer(${kotlinColor(color)}, intArrayOf(${rects.flatMap((r) => [r.x, r.y, r.w, r.h]).join(", ")})),`);
      }
      lines.push(`                ),`);
    }
    lines.push(`            ),`, `        )`, `    }`, "");
  }
  lines.push(
    "    /** すべての Pro のアイコン（名前順） */",
    `    val all: List<DotwearIconDefinition> by lazy { listOf(${icons.map((i) => kotlinName(i.name)).join(", ")}) }`,
    "}",
    "",
    "/** DotwearIcons.Pro で Pro のアイコンに届くようにする（Kit を入れたときだけある） */",
    "val DotwearIcons.Pro: DotwearProIcons get() = DotwearProIcons",
    "",
  );
  await writeFile(path.join(dirs.sources, "DotwearProIcons.kt"), lines.join("\n"));
  const grids = [
    `// ${GENERATED_HEADER}`,
    "package dev.dotwear.kit",
    "",
    "import dev.dotwear.icons.DotwearIconDefinition",
    "import dev.dotwear.icons.DotwearIconGrid",
    "",
    "/** Pro のアイコンの元データのマス目 */",
    "val proSourceGrids: List<Triple<DotwearIconDefinition, DotwearIconGrid, List<String>>> = listOf(",
  ];
  for (const icon of icons) {
    for (const size of GRID_SIZES) {
      const grid = icon.sizes[size];
      if (!grid) continue;
      grids.push(`    Triple(DotwearProIcons.${kotlinName(icon.name)}, DotwearIconGrid.Grid${size}, listOf(`, ...grid.map((r) => `        ${JSON.stringify(r)},`), "    )),");
    }
  }
  grids.push(")", "");
  await writeFile(path.join(dirs.tests, "ProSourceGrids.kt"), grids.join("\n"));
}
