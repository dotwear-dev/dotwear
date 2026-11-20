// icon.json を、リポジトリの既存ファイルと同じ書き方の文字列にする。
// JSON.stringify(_, null, 2) だとタグが 1 要素 1 行に広がり、保存のたびに無関係な差分が出るため。
//   - キーの順番は $schema → name → category → tier → tags → sizes（12 → 16 → 24）
//   - tags は 1 行、グリッドは 1 行 1 要素、末尾に改行
import { GRID_SIZES, type IconDocument } from "./icon.ts";

export function formatIconJson(icon: IconDocument): string {
  const q = (v: string) => JSON.stringify(v);
  const lines = ["{"];
  if (icon.$schema) lines.push(`  "$schema": ${q(icon.$schema)},`);
  lines.push(`  "name": ${q(icon.name)},`);
  lines.push(`  "category": ${q(icon.category)},`);
  lines.push(`  "tier": ${q(icon.tier)},`);
  // タグが空のときは書かない（スキーマ上は任意のキー）
  if (icon.tags.length > 0) lines.push(`  "tags": [${icon.tags.map(q).join(", ")}],`);
  lines.push(`  "sizes": {`);
  const sizes = GRID_SIZES.filter((s) => icon.sizes[s]);
  sizes.forEach((size, i) => {
    const rows = icon.sizes[size]!;
    lines.push(`    ${q(size)}: [`);
    rows.forEach((row, r) => lines.push(`      ${q(row)}${r < rows.length - 1 ? "," : ""}`));
    lines.push(`    ]${i < sizes.length - 1 ? "," : ""}`);
  });
  lines.push(`  }`);
  lines.push("}");
  return lines.join("\n") + "\n";
}
