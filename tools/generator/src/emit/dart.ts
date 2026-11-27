// Flutter（packages/flutter/dotwear_icons）の生成物を出力する（ADR-033）。
//   lib/src/generated/dotwear_icons.g.dart     アイコンの定義（DotwearIcons.save など）
//   lib/src/generated/dotwear_palettes.g.dart  パレットのテーマ（DotwearPalettes.retroGreen など）
//   test/generated/source_grids.g.dart         pixel-roundtrip テスト用の元データのマス目
//
// Dart は @dotwear/icons の JavaScript を読めないので、iOS・Android と同じく矩形を定数として出す。
// 矩形は Web・iOS・Android と同じ gridToRects で作る（ADR-019）
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { gridToRects, type CellColor } from "../paths/rects.js";
import { GRID_SIZES, type IconSource, type Palette } from "../source/load.js";
import { dartName } from "./naming.js";
import { GENERATED_HEADER } from "./svg.js";
import { checkPaletteSlots, DEFAULT_THEME, filterTiers } from "./web.js";

export interface EmitDartOptions {
  icons: IconSource[];
  palette: Palette;
  /** packages/flutter/dotwear_icons。この下の lib/src/generated と test/generated だけを作り直す */
  packageDir: string;
}

export function dartOutDirs(packageDir: string) {
  return { sources: path.join(packageDir, "lib", "src", "generated"), tests: path.join(packageDir, "test", "generated") };
}

export async function emitDart({ icons: all, palette, packageDir }: EmitDartOptions): Promise<void> {
  // 公開の dotwear_icons には Free のアイコンだけを入れる（ADR-023）
  const icons = filterTiers(all, ["free"]);
  const defaults = palette[DEFAULT_THEME];
  if (!defaults) throw new Error(`tokens/palette.json に "${DEFAULT_THEME}" テーマがありません`);
  checkPaletteSlots(icons, defaults);

  const dirs = dartOutDirs(packageDir);
  for (const dir of Object.values(dirs)) {
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
  }
  await writeFile(path.join(dirs.sources, "dotwear_icons.g.dart"), renderIcons(icons, FREE_ICONS));
  await writeFile(path.join(dirs.sources, "dotwear_palettes.g.dart"), renderPalettes(palette));
  await writeFile(path.join(dirs.tests, "source_grids.g.dart"), renderSourceGrids(icons, FREE_ICONS));
}

function dartColor(color: CellColor): string {
  return color === "#" ? "DotwearIconColor.foreground" : `DotwearIconColor.palette(${color})`;
}

/** アイコンのクラスの出し方（Free の dotwear_icons と、Kit の dotwear_kit で変える） */
interface DartIconSet {
  /** クラス名（DotwearIcons・DotwearProIcons） */
  className: string;
  /** 定義の型（DotwearIconDefinition など）を読み込む import 文 */
  definitionImport: string;
  /** テストの元データが読み込むパッケージ */
  testImport: string;
  /** クラスの説明（dartdoc） */
  doc: string[];
}

const FREE_ICONS: DartIconSet = {
  className: "DotwearIcons",
  definitionImport: "import '../definition.dart';",
  testImport: "import 'package:dotwear_icons/dotwear_icons.dart';",
  doc: ["/// すべてのアイコン。`DotwearIcon(DotwearIcons.save)` のように使う。", "/// const なので、アプリのビルドでは使ったアイコンだけが残る"],
};

/**
 * Kit（dotwear_kit。ADR-039）の Pro のアイコン。Dart では Free の DotwearIcons にあとから足せないので、別のクラスにする
 * （Swift の `.pro.crown`、Kotlin の `DotwearIcons.Pro.Crown` に当たる）
 */
const PRO_ICONS: DartIconSet = {
  className: "DotwearProIcons",
  definitionImport: "import 'package:dotwear_icons/dotwear_icons.dart';",
  testImport: "import 'package:dotwear_kit/dotwear_kit.dart';",
  doc: ["/// Pro のアイコン。`DotwearIcon(DotwearProIcons.treasureChest)` のように使う（Free のアイコンは DotwearIcons のまま）。", "/// const なので、アプリのビルドでは使ったアイコンだけが残る"],
};

export interface EmitDartKitOptions {
  icons: IconSource[];
  palette: Palette;
  /** packages/flutter-kit。この下の lib/src/generated と test/generated だけを作り直す */
  packageDir: string;
}

/** Kit（dotwear_kit）の生成物。Pro のアイコンだけを出す（Free は依存先の dotwear_icons にある） */
export async function emitDartKit({ icons: all, palette, packageDir }: EmitDartKitOptions): Promise<void> {
  const icons = filterTiers(all, ["pro"]);
  const defaults = palette[DEFAULT_THEME];
  if (!defaults) throw new Error(`tokens/palette.json に "${DEFAULT_THEME}" テーマがありません`);
  checkPaletteSlots(icons, defaults);
  const dirs = dartOutDirs(packageDir);
  for (const dir of Object.values(dirs)) {
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
  }
  await writeFile(path.join(dirs.sources, "dotwear_pro_icons.g.dart"), renderIcons(icons, PRO_ICONS));
  await writeFile(path.join(dirs.tests, "source_grids.g.dart"), renderSourceGrids(icons, PRO_ICONS));
}

function renderIcons(icons: IconSource[], set: DartIconSet): string {
  const lines = [
    `// ${GENERATED_HEADER}`,
    "// ignore_for_file: public_member_api_docs",
    set.definitionImport,
    "",
    ...set.doc,
    `abstract final class ${set.className} {`,
  ];
  for (const icon of icons) {
    lines.push(
      `  /// ${icon.name}（${icon.category}${icon.tags.length ? `。${icon.tags.join("・")}` : ""}）`,
      `  static const ${dartName(icon.name)} = DotwearIconDefinition(`,
      `    name: ${JSON.stringify(icon.name)},`,
      `    grids: {`,
    );
    for (const size of GRID_SIZES) {
      const grid = icon.sizes[size];
      if (!grid) continue;
      lines.push(`      DotwearIconGrid.grid${size}: [`);
      for (const [color, rects] of gridToRects(grid)) {
        const packed = rects.flatMap((r) => [r.x, r.y, r.w, r.h]).join(", ");
        lines.push(`        DotwearIconLayer(${dartColor(color)}, [${packed}]),`);
      }
      lines.push(`      ],`);
    }
    lines.push(`    },`, `  );`, "");
  }
  lines.push(
    "  /// すべてのアイコン（名前順）。これを使うと、すべてのアイコンがアプリに入る",
    `  static const all = <DotwearIconDefinition>[${icons.map((i) => dartName(i.name)).join(", ")}];`,
    "",
    "  /// 名前から選ぶ（Web の byName に当たる）。見つからなければ null",
    "  static DotwearIconDefinition? named(String name) {",
    "    for (final icon in all) {",
    "      if (icon.name == name) return icon;",
    "    }",
    "    return null;",
    "  }",
    "}",
    "",
  );
  return lines.join("\n");
}

function renderPalettes(palette: Palette): string {
  const lines = [
    `// ${GENERATED_HEADER}`,
    "import 'dart:ui' show Color;",
    "",
    "import '../palette.dart';",
    "",
    "/// パレットのテーマ（tokens/palette.json）。Web の data-dw-palette、Swift の .retroGreen に当たる",
    "abstract final class DotwearPalettes {",
  ];
  for (const [theme, slots] of Object.entries(palette)) {
    const entries = Object.entries(slots).map(([slot, hex]) => `${slot}: Color(0xFF${hex!.replace("#", "").toUpperCase()})`);
    lines.push(`  /// ${theme}`, `  static const ${dartName(theme)} = DotwearPalette({${entries.join(", ")}});`, "");
  }
  lines.push(
    "  /// 名前（data-dw-palette と同じ）から選ぶ",
    "  static const byName = <String, DotwearPalette>{",
    ...Object.keys(palette).map((theme) => `    ${JSON.stringify(theme)}: ${dartName(theme)},`),
    "  };",
    "}",
    "",
  );
  return lines.join("\n");
}

function renderSourceGrids(icons: IconSource[], set: DartIconSet): string {
  const lines = [
    `// ${GENERATED_HEADER}`,
    set.testImport,
    "",
    "/// 元データのマス目（icons/<name>/icon.json）。描いた結果がこれと 1 ピクセル単位で一致するかを確かめる",
    "const sourceGrids = <(DotwearIconDefinition, DotwearIconGrid, List<String>)>[",
  ];
  for (const icon of icons) {
    for (const size of GRID_SIZES) {
      const grid = icon.sizes[size];
      if (!grid) continue;
      lines.push(`  (${set.className}.${dartName(icon.name)}, DotwearIconGrid.grid${size}, [`, ...grid.map((r) => `    ${JSON.stringify(r)},`), "  ]),");
    }
  }
  lines.push("];", "");
  return lines.join("\n");
}
