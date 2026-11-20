import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { Ajv2020, type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import { locateCharInString, locatePath, parseJsonStrict, pointerToPath, type JsonPath, type ParsedJson } from "./locate.js";
import type { ValidationIssue } from "./types.js";

// マス目に使える文字（docs/02_architecture.md「マス目の文字」）
const ALLOWED_CELL = /^[.#2-9]$/;
// グリッドを検証するサイズ（スキーマの sizes と合わせる）
const GRID_SIZES = ["12", "16", "24"] as const;

export interface ValidateIconsOptions {
  /** リポジトリルート。エラー表示のファイルパスはここからの相対パスにする */
  root: string;
  /** アイコン形式のデータを置くディレクトリ（省略時は <root>/icons。ロゴは <root>/brand） */
  iconsDir?: string;
  /** スキーマファイル（省略時は <root>/schema/icon.schema.json） */
  schemaPath?: string;
}

interface LoadedIcon {
  file: string;
  folder: string;
  json: ParsedJson;
}

// icons/ 配下のすべての icon.json を検証する
export async function validateIcons(options: ValidateIconsOptions): Promise<ValidationIssue[]> {
  const root = options.root;
  const iconsDir = options.iconsDir ?? path.join(root, "icons");
  const schemaPath = options.schemaPath ?? path.join(root, "schema", "icon.schema.json");
  const rel = (p: string) => path.relative(root, p) || p;

  const issues: ValidationIssue[] = [];

  // スキーマの読み込み（スキーマ自体が壊れていたら、その時点で中断する）
  let validateSchema: ValidateFunction;
  try {
    const schema = JSON.parse(await readFile(schemaPath, "utf8")) as object;
    validateSchema = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  } catch (e) {
    return [{ file: rel(schemaPath), message: `スキーマを読み込めません: ${(e as Error).message}` }];
  }

  let folders: string[];
  try {
    folders = (await readdir(iconsDir)).filter((f) => !f.startsWith(".")).sort();
  } catch (e) {
    return [{ file: rel(iconsDir), message: `${rel(iconsDir)} ディレクトリを読み込めません: ${(e as Error).message}` }];
  }

  const loaded: LoadedIcon[] = [];
  for (const folder of folders) {
    const dir = path.join(iconsDir, folder);
    if (!(await stat(dir)).isDirectory()) {
      issues.push({ file: rel(dir), message: `${rel(iconsDir)}/ 直下にはアイコンごとのフォルダだけを置いてください` });
      continue;
    }
    const filePath = path.join(dir, "icon.json");
    const file = rel(filePath);
    let text: string;
    try {
      text = await readFile(filePath, "utf8");
    } catch {
      issues.push({ file, message: "icon.json がありません" });
      continue;
    }
    const parsed = parseJsonStrict(text);
    if (!parsed.ok) {
      for (const err of parsed.errors) {
        issues.push({ file, ...err.position, message: err.message });
      }
      continue;
    }
    loaded.push({ file, folder, json: parsed.json });
  }

  for (const icon of loaded) {
    issues.push(...validateOne(icon, validateSchema));
  }
  issues.push(...checkDuplicateNames(loaded));
  return issues;
}

// 1 ファイル分の検証
function validateOne(icon: LoadedIcon, validateSchema: ValidateFunction): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { file, json } = icon;
  const at = (p: JsonPath) => locatePath(json, p);

  // 1. JSON Schema の検証（グリッドの行数・文字は 2. で詳しく出すので、ここでは除外する）
  if (!validateSchema(json.value)) {
    for (const err of validateSchema.errors ?? []) {
      if (isGridError(err)) continue;
      const p = pointerToPath(err.instancePath);
      // additionalProperties は余分なキーそのものの位置を指す
      const target = err.keyword === "additionalProperties" ? [...p, String(err.params["additionalProperty"])] : p;
      issues.push({ file, ...at(target), message: describeAjvError(err) });
    }
  }

  const value = json.value;
  if (!isRecord(value)) return issues;

  // 2. グリッドの検証（行数・行の長さ・使えない文字・空のグリッド）
  const sizes = value["sizes"];
  if (isRecord(sizes)) {
    for (const key of GRID_SIZES) {
      const grid = sizes[key];
      if (grid === undefined) continue;
      issues.push(...validateGrid(icon, key, grid));
    }
  }

  // 3. name とフォルダ名の一致
  const name = value["name"];
  if (typeof name === "string" && name !== icon.folder) {
    issues.push({
      file,
      ...at(["name"]),
      message: `name "${name}" がフォルダ名 "${icon.folder}" と一致しません`,
    });
  }
  return issues;
}

function validateGrid(icon: LoadedIcon, key: string, grid: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { file, json } = icon;
  const size = Number(key);
  const gridPath: JsonPath = ["sizes", key];

  if (!Array.isArray(grid)) {
    issues.push({ file, ...locatePath(json, gridPath), message: `sizes.${key} は文字列の配列にしてください` });
    return issues;
  }
  if (grid.length !== size) {
    issues.push({
      file,
      ...locatePath(json, gridPath),
      message: `sizes.${key} の行数が ${grid.length} です（${size} 行必要）`,
    });
  }

  let hasPixel = false;
  grid.forEach((row: unknown, i) => {
    const rowPath: JsonPath = [...gridPath, i];
    const rowNo = i + 1;
    if (typeof row !== "string") {
      issues.push({ file, ...locatePath(json, rowPath), message: `sizes.${key} の ${rowNo} 行目が文字列ではありません` });
      return;
    }
    if (row.length !== size) {
      issues.push({
        file,
        ...locatePath(json, rowPath),
        message: `sizes.${key} の ${rowNo} 行目の長さが ${row.length} です（${size} 文字必要）`,
      });
    }
    // 使えない文字はすべて報告する（1 行に複数あっても列ごとに出す）
    [...row].forEach((ch, col) => {
      if (!ALLOWED_CELL.test(ch)) {
        issues.push({
          file,
          ...locateCharInString(json, rowPath, col),
          message: `sizes.${key} の ${rowNo} 行目 ${col + 1} 列目の "${ch}" は使えない文字です（使えるのは . # 2〜9）`,
        });
      } else if (ch !== ".") {
        hasPixel = true;
      }
    });
  });

  if (!hasPixel && grid.length > 0) {
    issues.push({ file, ...locatePath(json, gridPath), message: `sizes.${key} がすべて透明です（空のアイコン）` });
  }
  return issues;
}

// 全アイコンを通して name が重複していないか
function checkDuplicateNames(icons: LoadedIcon[]): ValidationIssue[] {
  const byName = new Map<string, LoadedIcon[]>();
  for (const icon of icons) {
    const v = icon.json.value;
    if (!isRecord(v) || typeof v["name"] !== "string") continue;
    const list = byName.get(v["name"]) ?? [];
    list.push(icon);
    byName.set(v["name"], list);
  }
  const issues: ValidationIssue[] = [];
  for (const [name, list] of byName) {
    if (list.length < 2) continue;
    for (const icon of list) {
      const others = list.filter((o) => o !== icon).map((o) => o.file).join(", ");
      issues.push({
        file: icon.file,
        ...locatePath(icon.json, ["name"]),
        message: `name "${name}" が重複しています（${others}）`,
      });
    }
  }
  return issues;
}

// sizes.<n> 配下の行数・パターンのエラーかどうか（validateGrid が詳しく報告する）
function isGridError(err: ErrorObject): boolean {
  const p = pointerToPath(err.instancePath);
  if (p[0] !== "sizes" || p.length < 2) return false;
  if (!(GRID_SIZES as readonly string[]).includes(String(p[1]))) return false;
  return ["minItems", "maxItems", "pattern", "type"].includes(err.keyword);
}

// Ajv のエラーを日本語のメッセージにする
function describeAjvError(err: ErrorObject): string {
  const where = err.instancePath === "" ? "ルート" : err.instancePath.slice(1).replace(/\//g, ".");
  switch (err.keyword) {
    case "required":
      return `${where} に必須のキー "${String(err.params["missingProperty"])}" がありません`;
    case "additionalProperties":
      return `${where} に未定義のキー "${String(err.params["additionalProperty"])}" があります`;
    case "enum":
      return `${where} の値が不正です（使えるのは ${(err.params["allowedValues"] as unknown[]).map((v) => JSON.stringify(v)).join(" / ")}）`;
    case "type":
      return `${where} の型が不正です（${String(err.params["type"])} にしてください）`;
    case "pattern":
      return where === "name"
        ? `name は kebab-case にしてください（例: "arrow-left"）`
        : `${where} の形式が不正です（${String(err.params["pattern"])}）`;
    case "uniqueItems":
      return `${where} に重複した値があります`;
    default:
      return `${where}: ${err.message ?? err.keyword}`;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
