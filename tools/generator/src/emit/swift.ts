// Swift Package（packages/swift）の生成物を出力する。
//   Sources/DotwearIcons/Generated/Icons.swift     アイコンの定義（DotwearIconDefinition の static プロパティ .save など）
//   Sources/DotwearIcons/Generated/Palette.swift   パレットのテーマ（DotwearPalette.default など）
//   Tests/DotwearIconsTests/Generated/SourceGrids.swift
//       元データのマス目。Swift 側の pixel-roundtrip テストが、描いた結果と比べるために使う
//
// パスの文字列ではなく矩形の配列を出す。Swift で文字列を解析せずに、そのまま Path に足せるようにするため。
// 矩形は Web と同じ gridToRects で作るので、どのプラットフォームでも同じ形になる。
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { gridToRects, type CellColor } from "../paths/rects.js";
import { GRID_SIZES, type IconSource, type Palette } from "../source/load.js";
import { swiftName } from "./naming.js";
import { GENERATED_HEADER } from "./svg.js";
import { checkPaletteSlots, DEFAULT_THEME, filterTiers } from "./web.js";

export interface EmitSwiftOptions {
  icons: IconSource[];
  palette: Palette;
  /** packages/swift。この下の Generated/ フォルダだけを作り直す */
  packageDir: string;
}

// 手書きのコード（Sources/DotwearIcons/*.swift）が DotwearIconDefinition に置いている名前。
// アイコン名がこれと同じになると static プロパティが衝突してビルドできないので、生成の時点でエラーにする
const RESERVED_MEMBERS = new Set(["name", "grids", "allIcons", "layers", "init"]);

export function swiftOutDirs(packageDir: string) {
  return {
    sources: path.join(packageDir, "Sources", "DotwearIcons", "Generated"),
    tests: path.join(packageDir, "Tests", "DotwearIconsTests", "Generated"),
  };
}

export async function emitSwift({ icons: all, palette, packageDir }: EmitSwiftOptions): Promise<void> {
  // 公開の DotwearIcons には Free のアイコンだけを入れる（Pro は Kit だけ。ADR-023）
  const icons = filterTiers(all, ["free"]);
  const defaults = palette[DEFAULT_THEME];
  if (!defaults) throw new Error(`tokens/palette.json に "${DEFAULT_THEME}" テーマがありません`);
  checkPaletteSlots(icons, defaults);
  const clash = icons.filter((i) => RESERVED_MEMBERS.has(swiftName(i.name).replaceAll("`", "")));
  if (clash.length) throw new Error(`Swift の既存のメンバー名と同じアイコン名です: ${clash.map((i) => i.name).join(", ")}`);

  const dirs = swiftOutDirs(packageDir);
  // 消したアイコンが残らないように、毎回作り直す
  for (const dir of Object.values(dirs)) {
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
  }
  await writeFile(path.join(dirs.sources, "Icons.swift"), renderIcons(icons));
  await writeFile(path.join(dirs.sources, "Palette.swift"), renderPalette(palette));
  await writeFile(path.join(dirs.tests, "SourceGrids.swift"), renderSourceGrids(icons));
}

function swiftColor(color: CellColor): string {
  return color === "#" ? ".foreground" : `.palette(${color})`;
}

function renderIcons(icons: IconSource[]): string {
  const lines = [`// ${GENERATED_HEADER}`, "", "extension DotwearIconDefinition {"];
  for (const icon of icons) {
    lines.push(
      `    /// ${icon.name}（${icon.category}${icon.tags.length ? `。${icon.tags.join("・")}` : ""}）`,
      `    public static let ${swiftName(icon.name)} = DotwearIconDefinition(`,
      `        name: ${JSON.stringify(icon.name)},`,
      `        grids: [`,
    );
    for (const size of GRID_SIZES) {
      const grid = icon.sizes[size];
      if (!grid) continue;
      lines.push(`            .grid${size}: [`);
      for (const [color, rects] of gridToRects(grid)) {
        const rs = rects.map((r) => `.init(${r.x}, ${r.y}, ${r.w}, ${r.h})`).join(", ");
        lines.push(`                .init(color: ${swiftColor(color)}, rects: [${rs}]),`);
      }
      lines.push(`            ],`);
    }
    lines.push(`        ]`, `    )`, "");
  }
  // 名前から動的に選ぶための一覧（Web の byName に相当）
  lines.push(
    `    /// すべてのアイコン（名前順）`,
    `    public static let allIcons: [DotwearIconDefinition] = [`,
    ...icons.map((i) => `        .${swiftName(i.name)},`),
    `    ]`,
    "}",
    "",
  );
  return lines.join("\n");
}

function renderPalette(palette: Palette): string {
  const lines = [`// ${GENERATED_HEADER}`, "", "extension DotwearPalette {"];
  for (const [theme, slots] of Object.entries(palette)) {
    const entries = Object.entries(slots).map(([slot, hex]) => `${slot}: 0x${hex!.replace("#", "").toLowerCase()}`);
    lines.push(`    public static let ${swiftName(theme)} = DotwearPalette(hex: [${entries.join(", ")}])`);
  }
  lines.push("}", "");
  return lines.join("\n");
}

function renderSourceGrids(icons: IconSource[]): string {
  const lines = [
    `// ${GENERATED_HEADER}`,
    "@testable import DotwearIcons",
    "",
    "/// 元データのマス目（icons/<name>/icon.json）。描いた結果がこれと 1 ピクセル単位で一致するかを確かめる",
    "let sourceGrids: [(icon: DotwearIconDefinition, grid: DotwearIconGrid, rows: [String])] = [",
  ];
  for (const icon of icons) {
    for (const size of GRID_SIZES) {
      const grid = icon.sizes[size];
      if (!grid) continue;
      lines.push(`    (.${swiftName(icon.name)}, .grid${size}, [`, ...grid.map((r) => `        ${JSON.stringify(r)},`), "    ]),");
    }
  }
  lines.push("]", "");
  return lines.join("\n");
}

// ---- Kit（ADR-023）：Pro のアイコンを DotwearIconDefinition.pro.<名前> として出す ----
// Kit は Free の DotwearIcons に依存するので、Free のアイコンはそちらを使い、ここでは Pro だけを出す。
// `.pro` の名前はプレフィックスと同じく仮（Q10）

export function swiftKitOutDirs(kitDir: string) {
  return {
    sources: path.join(kitDir, "Sources", "DotwearKit", "Generated"),
    tests: path.join(kitDir, "Tests", "DotwearKitTests", "Generated"),
  };
}

export async function emitSwiftKit({ icons: all, palette, packageDir }: EmitSwiftOptions): Promise<void> {
  const icons = filterTiers(all, ["pro"]);
  const defaults = palette[DEFAULT_THEME];
  if (!defaults) throw new Error(`tokens/palette.json に "${DEFAULT_THEME}" テーマがありません`);
  checkPaletteSlots(icons, defaults);
  const dirs = swiftKitOutDirs(packageDir);
  for (const dir of Object.values(dirs)) {
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
  }
  const lines = [
    `// ${GENERATED_HEADER}`,
    "import DotwearIcons",
    "",
    "/// Pro のアイコンの一覧。`DotwearIcon(.pro.crown)` のように使う（Kit を入れたときだけ書ける。ADR-023）",
    "public struct DotwearProIconSet: Sendable {",
    "    init() {}",
    "",
  ];
  for (const icon of icons) {
    lines.push(`    /// ${icon.name}（${icon.category}${icon.tags.length ? `。${icon.tags.join("・")}` : ""}）`);
    lines.push(`    public let ${swiftName(icon.name)} = ${renderDefinition(icon, "    ")}`);
    lines.push("");
  }
  lines.push(
    "    /// すべての Pro のアイコン（名前順）",
    `    public var allIcons: [DotwearIconDefinition] { [${icons.map((i) => swiftName(i.name)).join(", ")}] }`,
    "}",
    "",
    "extension DotwearIconDefinition {",
    "    /// Pro のアイコン（Kit を入れたときだけある）",
    "    public static let pro = DotwearProIconSet()",
    "}",
    "",
  );
  await writeFile(path.join(dirs.sources, "ProIcons.swift"), lines.join("\n"));
  const grids = [
    `// ${GENERATED_HEADER}`,
    "import DotwearKit",
    "",
    "/// Pro のアイコンの元データのマス目。定義の矩形がこれを正しく埋めるかを確かめる",
    "let proSourceGrids: [(icon: DotwearIconDefinition, grid: DotwearIconGrid, rows: [String])] = [",
  ];
  for (const icon of icons) {
    for (const size of GRID_SIZES) {
      const grid = icon.sizes[size];
      if (!grid) continue;
      grids.push(`    (DotwearIconDefinition.pro.${swiftName(icon.name)}, .grid${size}, [`, ...grid.map((r) => `        ${JSON.stringify(r)},`), "    ]),");
    }
  }
  grids.push("]", "");
  await writeFile(path.join(dirs.tests, "ProSourceGrids.swift"), grids.join("\n"));
}

/** 1 つのアイコンの DotwearIconDefinition(...) の式（Free の出力と同じ形） */
function renderDefinition(icon: IconSource, indent: string): string {
  const out = ["DotwearIconDefinition(", `${indent}    name: ${JSON.stringify(icon.name)},`, `${indent}    grids: [`];
  for (const size of GRID_SIZES) {
    const grid = icon.sizes[size];
    if (!grid) continue;
    out.push(`${indent}        .grid${size}: [`);
    for (const [color, rects] of gridToRects(grid)) {
      const rs = rects.map((r) => `.init(${r.x}, ${r.y}, ${r.w}, ${r.h})`).join(", ");
      out.push(`${indent}            .init(color: ${swiftColor(color)}, rects: [${rs}]),`);
    }
    out.push(`${indent}        ],`);
  }
  out.push(`${indent}    ]`, `${indent})`);
  return out.join("\n");
}
