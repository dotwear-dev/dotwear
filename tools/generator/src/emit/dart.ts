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
  await writeFile(path.join(dirs.sources, "dotwear_icons.g.dart"), renderIcons(icons));
  await writeFile(path.join(dirs.sources, "dotwear_palettes.g.dart"), renderPalettes(palette));
  await writeFile(path.join(dirs.tests, "source_grids.g.dart"), renderSourceGrids(icons));
}

function dartColor(color: CellColor): string {
  return color === "#" ? "DotwearIconColor.foreground" : `DotwearIconColor.palette(${color})`;
}

function renderIcons(icons: IconSource[]): string {
  const lines = [
    `// ${GENERATED_HEADER}`,
    "// ignore_for_file: public_member_api_docs",
    "import '../definition.dart';",
    "",
    "/// すべてのアイコン。`DotwearIcon(DotwearIcons.save)` のように使う。",
    "/// const なので、アプリのビルドでは使ったアイコンだけが残る",
    "abstract final class DotwearIcons {",
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

function renderSourceGrids(icons: IconSource[]): string {
  const lines = [
    `// ${GENERATED_HEADER}`,
    "import 'package:dotwear_icons/dotwear_icons.dart';",
    "",
    "/// 元データのマス目（icons/<name>/icon.json）。描いた結果がこれと 1 ピクセル単位で一致するかを確かめる",
    "const sourceGrids = <(DotwearIconDefinition, DotwearIconGrid, List<String>)>[",
  ];
  for (const icon of icons) {
    for (const size of GRID_SIZES) {
      const grid = icon.sizes[size];
      if (!grid) continue;
      lines.push(`  (DotwearIcons.${dartName(icon.name)}, DotwearIconGrid.grid${size}, [`, ...grid.map((r) => `    ${JSON.stringify(r)},`), "  ]),");
    }
  }
  lines.push("];", "");
  return lines.join("\n");
}
