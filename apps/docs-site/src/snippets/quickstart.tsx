// ドキュメントに載せる Web のコード例（Getting Started）。取り出し方は src/lib/snippets.ts。
// astro check で型を検査するので、API と食い違えばビルドの前に気づける
// snippet:quickstart
import "@dotwear/web/tokens.css";
import "@dotwear/web/fonts.css";
import "@dotwear/web/components.css";
import "@dotwear/icons/palette.css";
import { DotwearButton, dwSave } from "@dotwear/web";

export function SaveButton() {
  return (
    <DotwearButton icon={dwSave} onClick={() => console.log("saved")}>
      Save
    </DotwearButton>
  );
}
// end-snippet
