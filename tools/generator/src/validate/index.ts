import path from "node:path";
import { validateIcons } from "./icons.js";
import { validateTokens } from "./tokens.js";
import type { ValidationIssue } from "./types.js";

export { validateIcons } from "./icons.js";
export { validateTokens } from "./tokens.js";
export { formatIssue, sortIssues } from "./report.js";
export type { ValidationIssue } from "./types.js";

// icons/・brand/・tokens/ をまとめて検証する。
// brand/ はロゴなどのブランド素材。アイコンと同じ形式だが、@dotwear/icons では配らない
export async function validateAll(root: string): Promise<ValidationIssue[]> {
  const [icons, brand, tokens] = await Promise.all([
    validateIcons({ root }),
    validateIcons({ root, iconsDir: path.join(root, "brand") }),
    validateTokens({ root }),
  ]);
  return [...icons, ...brand, ...tokens];
}
