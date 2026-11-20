// デザイントークン（tokens/*.json、DTCG 形式）→ 各プラットフォームの定数
//   Web（packages/web/generated/）
//     tokens.css   :root に --dw-* の CSS 変数
//     tokens.ts    tokens（値）と tokenVars（var(--dw-*) の参照）
//   Swift（packages/swift/Sources/Dotwear/Generated/）
//     DotwearTokens.swift   DotwearTokens.Color.primary など
//   Kotlin（packages/android/compose/src/generated/kotlin/dev/dotwear/compose/）
//     DotwearTokens.kt      DotwearTokens.Color.Primary など
//   React Native（packages/react-native/generated/）
//     tokens.ts   tokens.color.primary など。長さは単位なしの dp（ADR-032）
//   Flutter（packages/flutter/dotwear/lib/src/generated/）
//     dotwear_tokens.g.dart   DotwearTokens.colorPrimary など。長さは論理ピクセルかドット数の int（ADR-033）
// 変換は Style Dictionary に任せ、プラットフォームごとに platform を足す（Kotlin は Phase 3）。
//
// パレット（palette.json）はアイコンのパッケージに入れる（ADR-009）ので、ここでは扱わない。
// 長さはドット数で定義する方針（docs/02_architecture.md「4. デザイントークン」）なので、
// border-width などの number トークンは単位なしで出し、使う側で pixel-unit を掛ける。
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import StyleDictionary, { type TransformedToken } from "style-dictionary";
import { dartName, kotlinName, swiftName } from "./naming.js";
import { GENERATED_HEADER } from "./svg.js";

/** Web 用に出力するトークンのファイル（palette.json は除く） */
export const WEB_TOKEN_FILES = ["color.json", "shape.json", "typography.json"] as const;

const PREFIX = "dw";

export interface EmitTokensOptions {
  root: string;
  /** 出力先（packages/web/generated）。中身は毎回作り直す */
  outDir: string;
}

function createDictionary(root: string): StyleDictionary {
  return new StyleDictionary({
    source: WEB_TOKEN_FILES.map((f) => path.join(root, "tokens", f)),
    // 「ファイルを書き出しました」などのログを出さない（エラーは例外になる）
    log: { verbosity: "silent", warnings: "error" },
    hooks: {
      fileHeaders: { dotwear: () => [GENERATED_HEADER] },
      formats: {
        "dotwear/typescript": ({ dictionary }) => renderTypeScript(dictionary.allTokens),
        "dotwear/swift": ({ dictionary }) => renderSwift(dictionary.allTokens),
        "dotwear/kotlin": ({ dictionary }) => renderKotlin(dictionary.allTokens),
        "dotwear/react-native": ({ dictionary }) => renderReactNative(dictionary.allTokens),
        "dotwear/dart": ({ dictionary }) => renderDart(dictionary.allTokens),
      },
    },
    platforms: {
      web: {
        // css のグループ：名前を kebab-case にし、dimension を "2px"、fontFamily を CSS の書き方にする
        transformGroup: "css",
        prefix: PREFIX,
        options: { fileHeader: "dotwear" },
        files: [
          { destination: "tokens.css", format: "css/variables" },
          { destination: "tokens.ts", format: "dotwear/typescript" },
        ],
      },
      swift: {
        // 変換（transform）はかけず、元データの値（$value）をそのまま renderSwift で Swift の型にする。
        // Style Dictionary の ios-swift の形式は UIKit の UIColor が前提で、SwiftUI の Color にならないため
        files: [{ destination: "DotwearTokens.swift", format: "dotwear/swift" }],
      },
      kotlin: {
        // Swift と同じく変換をかけず、renderKotlin で Compose の型にする
        files: [{ destination: "DotwearTokens.kt", format: "dotwear/kotlin" }],
      },
      "react-native": {
        // Swift と同じく変換をかけず、renderReactNative で React Native の StyleSheet に渡せる値にする
        files: [{ destination: "tokens.ts", format: "dotwear/react-native" }],
      },
      dart: {
        // Swift と同じく変換をかけず、renderDart で Flutter の型にする
        files: [{ destination: "dotwear_tokens.g.dart", format: "dotwear/dart" }],
      },
    },
  });
}

export async function emitTokens({ root, outDir }: EmitTokensOptions): Promise<void> {
  await writePlatform(createDictionary(root), "web", outDir);
}

/** Swift の DotwearTokens.swift を出す（outDir は packages/swift/Sources/Dotwear/Generated） */
export async function emitSwiftTokens({ root, outDir }: EmitTokensOptions): Promise<void> {
  await writePlatform(createDictionary(root), "swift", outDir);
}

/** Kotlin の DotwearTokens.kt を出す（outDir は packages/android/compose/src/generated/kotlin/dev/dotwear/compose） */
export async function emitKotlinTokens({ root, outDir }: EmitTokensOptions): Promise<void> {
  await writePlatform(createDictionary(root), "kotlin", outDir);
}

async function writePlatform(sd: StyleDictionary, platform: string, outDir: string): Promise<void> {
  // Style Dictionary にファイルを書かせず、文字列で受け取ってから書く（出力先の掃除をこちらで管理するため）
  const outputs = await sd.formatPlatform(platform);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await Promise.all(
    outputs.map(({ destination, output }) => {
      if (!destination || typeof output !== "string") throw new Error("Style Dictionary の出力が想定と異なります");
      return writeFile(path.join(outDir, destination), output);
    }),
  );
}

/** React Native の tokens.ts を出す（outDir は packages/react-native/generated） */
export async function emitReactNativeTokens({ root, outDir }: EmitTokensOptions): Promise<void> {
  await writePlatform(createDictionary(root), "react-native", outDir);
}

/** Flutter の dotwear_tokens.g.dart を出す（outDir は packages/flutter/dotwear/lib/src/generated） */
export async function emitDartTokens({ root, outDir }: EmitTokensOptions): Promise<void> {
  await writePlatform(createDictionary(root), "dart", outDir);
}

// tokens.color.bg のように、元データと同じ入れ子で値を引けるようにする。
// CSS 変数の参照（tokenVars.color.bg === "var(--dw-color-bg)"）も同じ形で出す。
// インラインスタイルでテーマを差し替えられるように、コンポーネントでは基本的に tokenVars を使う想定。
function renderTypeScript(tokens: TransformedToken[]): string {
  const values: Tree = {};
  const vars: Tree = {};
  for (const t of tokens) {
    // path は ["color", "on-primary"] のような元データのキー。TS ではキーを camelCase にする
    const keys = t.path.map(camelCase);
    setIn(values, keys, t.$value as Leaf);
    setIn(vars, keys, `var(--${t.name})`);
  }
  return [
    `// ${GENERATED_HEADER}`,
    "",
    `/** デザイントークンの値（tokens/*.json）。長さの number トークンはドット数 */`,
    `export const tokens = ${JSON.stringify(values, null, 2)} as const;`,
    "",
    `/** CSS 変数の参照。@dotwear/web/tokens.css を読み込んだうえで使う */`,
    `export const tokenVars = ${JSON.stringify(vars, null, 2)} as const;`,
    "",
    `export type DotwearTokens = typeof tokens;`,
    "",
  ].join("\n");
}

// Swift では DotwearTokens.Color.onPrimary のように、グループを enum（名前空間）にする。
//   color      → SwiftUI.Color（sRGB）
//   dimension  → CGFloat（px をそのまま pt として扱う。1pt は @2x・@3x でも整数ピクセルなので、整数のままにじまない）
//   number     → Int（ドット数）
//   fontFamily → [String]
// enum の名前 Color は SwiftUI の Color と重なるので、値の側では SwiftUI.Color と書く
function renderSwift(tokens: TransformedToken[]): string {
  const groups = new Map<string, string[]>();
  for (const t of tokens) {
    const [group, ...rest] = t.path;
    const name = swiftName(rest.join("-"));
    const doc = t.$description ? [`        /// ${t.$description}`] : [];
    const lines = groups.get(group!) ?? [];
    lines.push(...doc, `        public static let ${name}${swiftValue(t)}`);
    groups.set(group!, lines);
  }
  const body = [...groups].flatMap(([group, lines]) => [
    `    public enum ${group!.charAt(0).toUpperCase() + camelCase(group!).slice(1)} {`,
    ...lines,
    "    }",
  ]);
  return [
    `// ${GENERATED_HEADER}`,
    "import SwiftUI",
    "",
    "/// デザイントークンの値（tokens/*.json）。長さの Int はドット数で、実寸は DotwearTheme の dots(_:) で求める",
    "public enum DotwearTokens {",
    ...body,
    "}",
    "",
  ].join("\n");
}

function swiftValue(t: TransformedToken): string {
  const v = t.$value as unknown;
  switch (t.$type) {
    case "color": {
      const hex = String(v).replace("#", "");
      if (!/^[0-9a-fA-F]{6}$/.test(hex)) throw new Error(`Swift には #RRGGBB の色だけを出せます: ${t.name} = ${String(v)}`);
      const [r, g, b] = [0, 2, 4].map((i) => `0x${hex.slice(i, i + 2).toLowerCase()} / 255.0`);
      return ` = SwiftUI.Color(.sRGB, red: ${r}, green: ${g}, blue: ${b}, opacity: 1)`;
    }
    case "dimension": {
      const d = v as { value: number; unit: string };
      if (d.unit !== "px") throw new Error(`Swift には px の長さだけを出せます: ${t.name}`);
      return `: CGFloat = ${d.value}`;
    }
    case "number":
      if (!Number.isInteger(v)) throw new Error(`number のトークンは整数（ドット数）にしてください: ${t.name}`);
      return `: Int = ${String(v)}`;
    case "fontFamily":
      return `: [String] = ${JSON.stringify(Array.isArray(v) ? v : [v])}`;
    default:
      throw new Error(`Swift に出せない型のトークンです: ${t.name}（${String(t.$type)}）`);
  }
}

// Kotlin では DotwearTokens.Color.OnPrimary のように、グループを object、名前を PascalCase にする（Compose の慣習）。
//   color      → androidx.compose.ui.graphics.Color
//   dimension  → Int（dp / sp の数値。整数ピクセルへの変換は使う側で dotwearCellPx を通す。ADR-019）
//   number     → Int（ドット数）
//   fontFamily → List<String>
function renderKotlin(tokens: TransformedToken[]): string {
  const groups = new Map<string, string[]>();
  for (const t of tokens) {
    const [group, ...rest] = t.path;
    const name = kotlinName(rest.join("-"));
    const doc = t.$description ? [`        /** ${t.$description} */`] : [];
    const lines = groups.get(group!) ?? [];
    lines.push(...doc, `        val ${name}${kotlinValue(t)}`);
    groups.set(group!, lines);
  }
  const body = [...groups].flatMap(([group, lines]) => [`    object ${kotlinName(group!)} {`, ...lines, "    }"]);
  return [
    `// ${GENERATED_HEADER}`,
    "package dev.dotwear.compose",
    "",
    // Kotlin のコメントは入れ子にできるので、KDoc の中に「スラッシュ＋アスタリスク」（tokens フォルダのワイルドカードなど）を書かない
    "/** デザイントークンの値（tokens フォルダの JSON）。長さの Int はドット数か dp で、実寸は DotwearTheme で整数ピクセルにそろえる */",
    "object DotwearTokens {",
    ...body,
    "}",
    "",
  ].join("\n");
}

function kotlinValue(t: TransformedToken): string {
  const v = t.$value as unknown;
  switch (t.$type) {
    case "color": {
      const hex = String(v).replace("#", "");
      if (!/^[0-9a-fA-F]{6}$/.test(hex)) throw new Error(`Kotlin には #RRGGBB の色だけを出せます: ${t.name} = ${String(v)}`);
      return ` = androidx.compose.ui.graphics.Color(0xFF${hex.toUpperCase()})`;
    }
    case "dimension": {
      const d = v as { value: number; unit: string };
      if (d.unit !== "px" || !Number.isInteger(d.value)) throw new Error(`Kotlin には整数の px の長さだけを出せます: ${t.name}`);
      return `: Int = ${d.value}`;
    }
    case "number":
      if (!Number.isInteger(v)) throw new Error(`number のトークンは整数（ドット数）にしてください: ${t.name}`);
      return `: Int = ${String(v)}`;
    case "fontFamily":
      return `: List<String> = listOf(${(Array.isArray(v) ? v : [v]).map((x) => JSON.stringify(x)).join(", ")})`;
    default:
      throw new Error(`Kotlin に出せない型のトークンです: ${t.name}（${String(t.$type)}）`);
  }
}

// React Native では Web と同じ入れ子（tokens.color.onPrimary）にし、値を StyleSheet にそのまま渡せる形にする。
//   color      → "#rrggbb"
//   dimension  → number（px をそのまま dp として扱う。整数ピクセルへの変換は使う側で dotwearCellPx を通す。ADR-019）
//   number     → number（ドット数）
//   fontFamily → 最初の 1 つの名前だけ（React Native の fontFamily は代わりの書体の並びを受け付けないため）
function renderReactNative(tokens: TransformedToken[]): string {
  const values: Tree = {};
  for (const t of tokens) setIn(values, t.path.map(camelCase), reactNativeValue(t));
  return [
    `// ${GENERATED_HEADER}`,
    "",
    "/** デザイントークンの値（tokens/*.json）。長さは dp、number はドット数。実寸は useDotwear().dots(n) で整数ピクセルにそろえる */",
    `export const tokens = ${JSON.stringify(values, null, 2)} as const;`,
    "",
    "export type DotwearTokens = typeof tokens;",
    "",
  ].join("\n");
}

function reactNativeValue(t: TransformedToken): Leaf {
  const v = t.$value as unknown;
  switch (t.$type) {
    case "color": {
      const hex = String(v);
      if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new Error(`React Native には #RRGGBB の色だけを出せます: ${t.name} = ${hex}`);
      return hex.toLowerCase();
    }
    case "dimension": {
      const d = v as { value: number; unit: string };
      if (d.unit !== "px" || !Number.isInteger(d.value)) throw new Error(`React Native には整数の px の長さだけを出せます: ${t.name}`);
      return d.value;
    }
    case "number":
      if (!Number.isInteger(v)) throw new Error(`number のトークンは整数（ドット数）にしてください: ${t.name}`);
      return v as number;
    case "fontFamily": {
      const first = (Array.isArray(v) ? v : [v])[0];
      if (typeof first !== "string") throw new Error(`fontFamily が空です: ${t.name}`);
      return first;
    }
    default:
      throw new Error(`React Native に出せない型のトークンです: ${t.name}（${String(t.$type)}）`);
  }
}

type Leaf = string | number;
interface Tree {
  [key: string]: Leaf | Tree;
}

function setIn(tree: Tree, keys: string[], value: Leaf): void {
  let node = tree;
  keys.slice(0, -1).forEach((k) => {
    const next = node[k];
    if (typeof next === "object") node = next;
    else node = node[k] = {};
  });
  node[keys[keys.length - 1]!] = value;
}

function camelCase(s: string): string {
  return s.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

// Dart には入れ子の static がないので、グループ名を前に付けた 1 段の名前にする（color.on-primary → colorOnPrimary）
function renderDart(tokens: TransformedToken[]): string {
  const lines = tokens.flatMap((t) => {
    const name = dartName(t.path.join("-"));
    const doc = t.$description ? [`  /// ${t.$description}`] : [];
    return [...doc, `  static const ${name}${dartValue(t)};`];
  });
  return [
    `// ${GENERATED_HEADER}`,
    "import 'dart:ui' show Color;",
    "",
    "/// デザイントークンの値（tokens フォルダの JSON）。長さの int はドット数か論理ピクセルで、実寸は DotwearThemeData で整数ピクセルにそろえる",
    "abstract final class DotwearTokens {",
    ...lines,
    "}",
    "",
  ].join("\n");
}

function dartValue(t: TransformedToken): string {
  const v = t.$value as unknown;
  switch (t.$type) {
    case "color": {
      const hex = String(v).replace("#", "");
      if (!/^[0-9a-fA-F]{6}$/.test(hex)) throw new Error(`Dart には #RRGGBB の色だけを出せます: ${t.name} = ${String(v)}`);
      return ` = Color(0xFF${hex.toUpperCase()})`;
    }
    case "dimension": {
      const d = v as { value: number; unit: string };
      if (d.unit !== "px" || !Number.isInteger(d.value)) throw new Error(`Dart には整数の px の長さだけを出せます: ${t.name}`);
      return ` = ${d.value}`;
    }
    case "number":
      if (!Number.isInteger(v)) throw new Error(`number のトークンは整数（ドット数）にしてください: ${t.name}`);
      return ` = ${String(v)}`;
    case "fontFamily": {
      const first = (Array.isArray(v) ? v : [v])[0];
      if (typeof first !== "string") throw new Error(`fontFamily が空です: ${t.name}`);
      return ` = ${JSON.stringify(first)}`;
    }
    default:
      throw new Error(`Dart に出せない型のトークンです: ${t.name}（${String(t.$type)}）`);
  }
}
