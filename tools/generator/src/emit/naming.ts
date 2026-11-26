// 公開 API の命名規則。ジェネレーターの出力と docs-site（コピー用のコード片）で同じ規則を使うため、
// Node の API に依存しないこのファイルにまとめる（docs-site から import される）

export type IconTier = "free" | "pro";

/**
 * アイコンのプレフィックス（Font Awesome の fas・fal に当たる。byPrefixAndName.dw["save"] の dw）。
 * tier で分ける（dw = Free、dwp = Pro。ADR-035 で確定）。変えるときはここだけを直す
 */
export const ICON_PREFIXES: Readonly<Record<IconTier, string>> = { free: "dw", pro: "dwp" };

/** "arrow-left" → "dwArrowLeft"（Font Awesome の faXxx に合わせた書き方。ADR-013）。Pro は "dwpArrowLeft" */
export function exportName(name: string, tier: IconTier = "free"): string {
  return ICON_PREFIXES[tier] + name.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}

// Swift の予約語。アイコン名がこれと同じになったら `default` のようにバッククォートで囲む
const SWIFT_KEYWORDS = new Set([
  "associatedtype", "class", "deinit", "enum", "extension", "fileprivate", "func", "import", "init", "inout",
  "internal", "let", "open", "operator", "private", "precedencegroup", "protocol", "public", "rethrows", "static",
  "struct", "subscript", "typealias", "var", "break", "case", "catch", "continue", "default", "defer", "do", "else",
  "fallthrough", "for", "guard", "if", "in", "repeat", "return", "throw", "switch", "where", "while", "as", "Any",
  "false", "is", "nil", "self", "Self", "super", "throws", "true", "try",
]);

/** "arrow-left" → "arrowLeft"（Swift の static プロパティ名。`DotwearIcon(.arrowLeft)` と書く。ADR-013） */
export function swiftName(name: string): string {
  const camel = name.split("-").map((s, i) => (i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1))).join("");
  return SWIFT_KEYWORDS.has(camel) ? `\`${camel}\`` : camel;
}

/** "arrow-left" → "ArrowLeft"（Kotlin のプロパティ名。Material Icons と同じく大文字で始める。`DotwearIcons.ArrowLeft`） */
export function kotlinName(name: string): string {
  return name.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}

// Dart の予約語（識別子に使えない語）。アイコン名やパレット名がこれと同じになったら、Material の Icons.class_ と同じく末尾に _ を付ける
const DART_KEYWORDS = new Set([
  "assert", "break", "case", "catch", "class", "const", "continue", "default", "do", "else", "enum", "extends",
  "false", "final", "finally", "for", "if", "in", "is", "new", "null", "rethrow", "return", "super", "switch",
  "this", "throw", "true", "try", "var", "void", "while", "with", "await", "yield",
]);

/** "arrow-left" → "arrowLeft"（Dart の static フィールド名。`DotwearIcon(DotwearIcons.arrowLeft)` と書く） */
export function dartName(name: string): string {
  const camel = name.split("-").map((s, i) => (i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1))).join("");
  return DART_KEYWORDS.has(camel) ? `${camel}_` : camel;
}
