import { findNodeAtLocation, parseTree, printParseErrorCode, type Node, type ParseError } from "jsonc-parser";

export interface Position {
  line: number;
  column: number;
}

export type JsonPath = (string | number)[];

// 解析済みの JSON ファイル。値と、位置を引くための構文木を持つ
export interface ParsedJson {
  text: string;
  tree: Node;
  value: unknown;
}

export type ParseResult =
  | { ok: true; json: ParsedJson }
  | { ok: false; errors: { position: Position; message: string }[] };

// 厳密な JSON として解析する（コメントや末尾カンマは不可）
export function parseJsonStrict(text: string): ParseResult {
  const errors: ParseError[] = [];
  const tree = parseTree(text, errors, { disallowComments: true, allowTrailingComma: false });
  if (errors.length > 0 || tree === undefined) {
    if (errors.length === 0) {
      return { ok: false, errors: [{ position: { line: 1, column: 1 }, message: "JSON が空です" }] };
    }
    return {
      ok: false,
      errors: errors.map((e) => ({
        position: offsetToPosition(text, e.offset),
        message: `JSON の構文エラー（${printParseErrorCode(e.error)}）`,
      })),
    };
  }
  // 構文木から値を復元する（JSON.parse と同じ結果になる）
  return { ok: true, json: { text, tree, value: JSON.parse(text) as unknown } };
}

// 文字オフセット（0 始まり）を行・列（1 始まり）に変換する
export function offsetToPosition(text: string, offset: number): Position {
  let line = 1;
  let lineStart = 0;
  const end = Math.min(offset, text.length);
  for (let i = 0; i < end; i++) {
    if (text.charCodeAt(i) === 10 /* \n */) {
      line++;
      lineStart = i + 1;
    }
  }
  return { line, column: end - lineStart + 1 };
}

// JSON パス（例: ["sizes", "16", 3]）が指す値の位置を返す。
// 値が存在しない場合は、たどれた一番深い親の位置を返す
export function locatePath(json: ParsedJson, path: JsonPath): Position {
  for (let depth = path.length; depth >= 0; depth--) {
    const node = findNodeAtLocation(json.tree, path.slice(0, depth));
    if (node !== undefined) {
      return offsetToPosition(json.text, node.offset);
    }
  }
  return { line: 1, column: 1 };
}

// 文字列の値の中の n 文字目（0 始まり）の位置を返す。
// エスケープを含まない文字列を前提とする（グリッドの行はこれに該当する）
export function locateCharInString(json: ParsedJson, path: JsonPath, index: number): Position {
  const node = findNodeAtLocation(json.tree, path);
  if (node === undefined || node.type !== "string") {
    return locatePath(json, path);
  }
  // node.offset は開始の引用符の位置なので +1 する
  return offsetToPosition(json.text, node.offset + 1 + index);
}

// Ajv の instancePath（例: "/sizes/16/3"）を JSON パスに変換する
export function pointerToPath(pointer: string): JsonPath {
  if (pointer === "") return [];
  return pointer
    .slice(1)
    .split("/")
    .map((seg) => seg.replace(/~1/g, "/").replace(/~0/g, "~"))
    .map((seg) => (/^\d+$/.test(seg) ? Number(seg) : seg));
}
