import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { locatePath, parseJsonStrict, type JsonPath, type ParsedJson } from "./locate.js";
import type { ValidationIssue } from "./types.js";

// DTCG の $type のうち、このプロジェクトで使うもの
const KNOWN_TYPES = new Set(["color", "dimension", "number", "fontFamily", "fontWeight", "duration"]);
// パレットのスロット（docs/02_architecture.md「マス目の文字」）
const PALETTE_SLOT = /^[2-9]$/;
// 色は #rrggbb または #rrggbbaa
const HEX_COLOR = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export interface ValidateTokensOptions {
  root: string;
  /** tokens/ ディレクトリ（省略時は <root>/tokens） */
  tokensDir?: string;
}

interface TokenContext {
  file: string;
  json: ParsedJson;
  issues: ValidationIssue[];
}

// tokens/*.json を検証する
export async function validateTokens(options: ValidateTokensOptions): Promise<ValidationIssue[]> {
  const root = options.root;
  const tokensDir = options.tokensDir ?? path.join(root, "tokens");
  const rel = (p: string) => path.relative(root, p) || p;
  const issues: ValidationIssue[] = [];

  let files: string[];
  try {
    files = (await readdir(tokensDir)).filter((f) => f.endsWith(".json")).sort();
  } catch (e) {
    return [{ file: rel(tokensDir), message: `tokens ディレクトリを読み込めません: ${(e as Error).message}` }];
  }

  for (const name of files) {
    const filePath = path.join(tokensDir, name);
    const file = rel(filePath);
    const parsed = parseJsonStrict(await readFile(filePath, "utf8"));
    if (!parsed.ok) {
      for (const err of parsed.errors) issues.push({ file, ...err.position, message: err.message });
      continue;
    }
    const ctx: TokenContext = { file, json: parsed.json, issues };
    if (!isRecord(parsed.json.value)) {
      issues.push({ file, line: 1, column: 1, message: "トークンファイルのルートはオブジェクトにしてください" });
      continue;
    }
    walkGroup(ctx, parsed.json.value, [], undefined);
  }
  return issues;
}

// グループを再帰的にたどる。$type はグループから子に継承される（DTCG の仕様）
function walkGroup(ctx: TokenContext, group: Record<string, unknown>, p: JsonPath, inheritedType: string | undefined): void {
  const groupType = typeof group["$type"] === "string" ? group["$type"] : inheritedType;
  for (const [key, child] of Object.entries(group)) {
    if (key.startsWith("$")) continue; // $type・$description などのメタ情報
    const childPath = [...p, key];
    if (!isRecord(child)) {
      report(ctx, childPath, `${childPath.join(".")} はトークン（$value を持つオブジェクト）かグループにしてください`);
      continue;
    }
    if ("$value" in child) {
      checkToken(ctx, child, childPath, groupType);
    } else {
      walkGroup(ctx, child, childPath, groupType);
    }
  }
}

// トークン 1 個分の検証
function checkToken(ctx: TokenContext, token: Record<string, unknown>, p: JsonPath, inheritedType: string | undefined): void {
  const name = p.join(".");
  const type = typeof token["$type"] === "string" ? token["$type"] : inheritedType;
  const value = token["$value"];

  if (type === undefined) {
    report(ctx, p, `${name} に $type がありません`);
    return;
  }
  if (!KNOWN_TYPES.has(type)) {
    report(ctx, [...p, "$type"], `${name} の $type "${type}" は使えません（使えるのは ${[...KNOWN_TYPES].join(" / ")}）`);
    return;
  }

  // 型ごとの値の形
  if (type === "color" && !(typeof value === "string" && HEX_COLOR.test(value))) {
    report(ctx, [...p, "$value"], `${name} の色は "#rrggbb" か "#rrggbbaa" で書いてください`);
  }
  if (type === "dimension" && !isDimension(value)) {
    report(ctx, [...p, "$value"], `${name} の寸法は { "value": 数値, "unit": "px" } で書いてください`);
  }
  if (type === "number" && typeof value !== "number") {
    report(ctx, [...p, "$value"], `${name} の値は数値にしてください`);
  }

  // shape.*：長さはすべて整数のドット数で揃える（docs/02_architecture.md 4 章）
  if (p[0] === "shape") {
    const n = type === "dimension" && isDimension(value) ? value.value : value;
    if (typeof n === "number") {
      const isPixelUnit = p.length === 2 && p[1] === "pixel-unit";
      if (isPixelUnit && !(Number.isInteger(n) && n > 0)) {
        report(ctx, [...p, "$value"], `shape.pixel-unit は正の整数にしてください（現在 ${n}）`);
      } else if (!isPixelUnit && !(Number.isInteger(n) && n >= 0)) {
        report(ctx, [...p, "$value"], `${name} は 0 以上の整数（ドット数）にしてください（現在 ${n}）`);
      }
    }
  }

  // palette.<テーマ>.<スロット>：スロットは 2〜9 のみ
  if (p[0] === "palette" && p.length === 3 && !PALETTE_SLOT.test(String(p[2]))) {
    report(ctx, p, `${name}: パレットのスロットは 2〜9 にしてください（"${String(p[2])}" は使えません）`);
  }
}

function report(ctx: TokenContext, p: JsonPath, message: string): void {
  ctx.issues.push({ file: ctx.file, ...locatePath(ctx.json, p), message });
}

function isDimension(v: unknown): v is { value: number; unit: string } {
  return isRecord(v) && typeof v["value"] === "number" && v["unit"] === "px";
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
