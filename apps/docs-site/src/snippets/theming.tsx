// ドキュメントに載せる Web のコード例（テーマとトークン）。取り出し方は src/lib/snippets.ts
// snippet:tokens-ts
import { tokens, tokenVars } from "@dotwear/web";

// CSS variables (follow overrides made in CSS)
const badge = {
  background: tokenVars.color.primary,
  color: tokenVars.color.onPrimary,
  padding: `calc(2 * ${tokenVars.shape.pixelUnit})`,
};

// Raw values (for canvas, charts, native bridges…)
const primaryHex = tokens.color.primary; // "#181818"
// end-snippet

export function Badge() {
  return <span style={badge} data-color={primaryHex}>NEW</span>;
}
