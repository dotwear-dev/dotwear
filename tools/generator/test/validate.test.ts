import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { formatIssue, sortIssues, validateAll, validateIcons, validateTokens } from "../src/validate/index.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SCHEMA_PATH = path.join(REPO_ROOT, "schema", "icon.schema.json");

// 16x16 の正しいグリッド（枠だけの四角）
function validGrid(): string[] {
  return Array.from({ length: 16 }, (_, i) => (i === 0 || i === 15 ? "#".repeat(16) : "#" + ".".repeat(14) + "#"));
}

function iconJson(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { name: "box", category: "test", tier: "free", sizes: { "16": validGrid() }, ...overrides };
}

// JSON.stringify(_, null, 2) で書くので、行番号は次のとおりに決まる：
//   1 "{" / 2 name / 3 category / 4 tier / 5 "sizes": { / 6 "16": [ / 7〜22 グリッドの 1〜16 行目
const GRID_FIRST_LINE = 7;

let tmpDirs: string[] = [];
afterEach(async () => {
  await Promise.all(tmpDirs.map((d) => rm(d, { recursive: true, force: true })));
  tmpDirs = [];
});

// 一時ディレクトリにアイコンを書き出す。値が文字列ならそのままファイル内容にする
async function makeIcons(icons: Record<string, Record<string, unknown> | string>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "dotwear-test-"));
  tmpDirs.push(root);
  for (const [folder, content] of Object.entries(icons)) {
    const dir = path.join(root, "icons", folder);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "icon.json"), typeof content === "string" ? content : JSON.stringify(content, null, 2));
  }
  return root;
}

async function makeTokens(files: Record<string, unknown>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "dotwear-test-"));
  tmpDirs.push(root);
  await mkdir(path.join(root, "tokens"));
  for (const [name, content] of Object.entries(files)) {
    await writeFile(path.join(root, "tokens", name), JSON.stringify(content, null, 2));
  }
  return root;
}

const runIcons = (root: string) => validateIcons({ root, schemaPath: SCHEMA_PATH }).then(sortIssues);

describe("リポジトリの元データ", () => {
  it("icons/ と tokens/ がすべて検証に通る", async () => {
    expect(await validateAll(REPO_ROOT)).toEqual([]);
  });
});

describe("validateIcons", () => {
  it("正しいアイコンはエラーなし", async () => {
    const root = await makeIcons({ box: iconJson() });
    expect(await runIcons(root)).toEqual([]);
  });

  it("行の長さ違いを、ファイルと行番号付きで報告する", async () => {
    const grid = validGrid();
    grid[2] = "#".repeat(15); // 3 行目を 15 文字にする
    const root = await makeIcons({ box: iconJson({ sizes: { "16": grid } }) });

    const issues = await runIcons(root);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      file: path.join("icons", "box", "icon.json"),
      line: GRID_FIRST_LINE + 2,
      message: "sizes.16 の 3 行目の長さが 15 です（16 文字必要）",
    });
    // 表示形式は「ファイル:行:列  メッセージ」
    expect(formatIssue(issues[0]!)).toMatch(/^icons[/\\]box[/\\]icon\.json:9:\d+ {2}sizes\.16 の 3 行目/);
  });

  it("未定義の文字を、行と列の位置付きで報告する", async () => {
    const grid = validGrid();
    grid[4] = "#..x..........1#"; // 5 行目の 4 列目と 15 列目
    const root = await makeIcons({ box: iconJson({ sizes: { "16": grid } }) });

    const issues = await runIcons(root);
    expect(issues.map((i) => i.message)).toEqual([
      'sizes.16 の 5 行目 4 列目の "x" は使えない文字です（使えるのは . # 2〜9）',
      'sizes.16 の 5 行目 15 列目の "1" は使えない文字です（使えるのは . # 2〜9）',
    ]);
    // 列は「行頭のインデント 6 文字 + 開始の引用符 1 文字」の後ろから数える
    expect(issues.map((i) => [i.line, i.column])).toEqual([
      [GRID_FIRST_LINE + 4, 6 + 1 + 4],
      [GRID_FIRST_LINE + 4, 6 + 1 + 15],
    ]);
  });

  it("行数の不足を報告する", async () => {
    const root = await makeIcons({ box: iconJson({ sizes: { "16": validGrid().slice(0, 15) } }) });
    const issues = await runIcons(root);
    expect(issues.map((i) => i.message)).toEqual(["sizes.16 の行数が 15 です（16 行必要）"]);
    expect(issues[0]?.line).toBe(6);
  });

  it("すべて透明のグリッドを報告する", async () => {
    const empty = Array.from({ length: 16 }, () => ".".repeat(16));
    const root = await makeIcons({ box: iconJson({ sizes: { "16": empty } }) });
    expect((await runIcons(root)).map((i) => i.message)).toEqual(["sizes.16 がすべて透明です（空のアイコン）"]);
  });

  it("name とフォルダ名の不一致を報告する", async () => {
    const root = await makeIcons({ box: iconJson({ name: "square" }) });
    const issues = await runIcons(root);
    expect(issues.map((i) => i.message)).toEqual(['name "square" がフォルダ名 "box" と一致しません']);
    expect(issues[0]?.line).toBe(2);
  });

  it("name の重複を両方のファイルで報告する", async () => {
    const root = await makeIcons({ box: iconJson(), "box-2": iconJson() });
    const messages = (await runIcons(root)).map((i) => i.message);
    expect(messages.filter((m) => m.startsWith('name "box" が重複しています'))).toHaveLength(2);
  });

  it("kebab-case でない name を報告する", async () => {
    const root = await makeIcons({ Box_1: iconJson({ name: "Box_1" }) });
    expect((await runIcons(root)).map((i) => i.message)).toContain('name は kebab-case にしてください（例: "arrow-left"）');
  });

  it("スキーマ違反（必須キーの欠落・未定義のキー・enum 違反）を報告する", async () => {
    const icon = iconJson({ tier: "gold", extra: 1 });
    delete icon["category"];
    const root = await makeIcons({ box: icon });
    const messages = (await runIcons(root)).map((i) => i.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        'ルート に必須のキー "category" がありません',
        'ルート に未定義のキー "extra" があります',
        'tier の値が不正です（使えるのは "free" / "pro"）',
      ]),
    );
  });

  it("JSON の構文エラーを位置付きで報告する", async () => {
    const root = await makeIcons({ box: '{\n  "name": "box",\n}' });
    const issues = await runIcons(root);
    expect(issues[0]).toMatchObject({ line: 3, column: 1 });
    expect(issues[0]?.message).toMatch(/^JSON の構文エラー/);
  });
});

describe("validateTokens", () => {
  it("正しいトークンはエラーなし（$type はグループから継承できる）", async () => {
    const root = await makeTokens({
      "color.json": { color: { $type: "color", bg: { $value: "#ffffff" } } },
      "shape.json": { shape: { "pixel-unit": { $type: "dimension", $value: { value: 2, unit: "px" } } } },
    });
    expect(await validateTokens({ root })).toEqual([]);
  });

  it("$type の欠落・色の形式違いを報告する", async () => {
    const root = await makeTokens({
      "color.json": { color: { bg: { $value: "#fff" }, fg: { $type: "color", $value: "red" } } },
    });
    const messages = (await validateTokens({ root })).map((i) => i.message);
    expect(messages).toEqual(["color.bg に $type がありません", 'color.fg の色は "#rrggbb" か "#rrggbbaa" で書いてください']);
  });

  it("pixel-unit が整数でない・ドット数が負の場合を報告する", async () => {
    const root = await makeTokens({
      "shape.json": {
        shape: {
          "pixel-unit": { $type: "dimension", $value: { value: 1.5, unit: "px" } },
          "border-width": { $type: "number", $value: -1 },
        },
      },
    });
    const messages = (await validateTokens({ root })).map((i) => i.message);
    expect(messages).toEqual([
      "shape.pixel-unit は正の整数にしてください（現在 1.5）",
      "shape.border-width は 0 以上の整数（ドット数）にしてください（現在 -1）",
    ]);
  });

  it("パレットのスロットが 2〜9 以外なら報告する", async () => {
    const root = await makeTokens({
      "palette.json": { palette: { default: { "1": { $type: "color", $value: "#000000" } } } },
    });
    const issues = await validateTokens({ root });
    expect(issues.map((i) => i.message)).toEqual(['palette.default.1: パレットのスロットは 2〜9 にしてください（"1" は使えません）']);
    expect(issues[0]?.file).toBe(path.join("tokens", "palette.json"));
  });
});
