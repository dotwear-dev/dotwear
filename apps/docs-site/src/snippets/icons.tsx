// ドキュメントに載せる Web のコード例（アイコン）。取り出し方は src/lib/snippets.ts
// snippet:icons-only
import { dwSave } from "@dotwear/icons";
import { DotwearIcon } from "@dotwear/icons/react";
// end-snippet
import { byName, byPrefixAndName, dwTrash, type DotwearIconName } from "@dotwear/icons";

export function Basic() {
  return (
    <>
      {/* snippet:icon-basic */}
      <DotwearIcon icon={dwSave} />            {/* 16 × 16 px */}
      <DotwearIcon icon={dwSave} scale={2} />  {/* 32 × 32 px */}
      {/* end-snippet */}
    </>
  );
}

export function Color() {
  return (
    // snippet:icon-color
    <DotwearIcon icon={dwTrash} scale={2} style={{ color: "crimson" }} />
    // end-snippet
  );
}

export function Labels() {
  return (
    <>
      {/* snippet:icon-label */}
      {/* Decorative: hidden from screen readers */}
      <DotwearIcon icon={dwSave} />

      {/* Meaningful on its own: give it a title */}
      <DotwearIcon icon={dwTrash} title="Delete" />
      {/* end-snippet */}
    </>
  );
}

export function Grid() {
  return (
    // snippet:icon-grid
    <DotwearIcon icon={dwSave} scale={1} grid={24} />
    // end-snippet
  );
}

export function ByName({ name }: { name: DotwearIconName }) {
  return (
    <>
      {/* snippet:icon-by-name */}
      <DotwearIcon icon={byName[name]} scale={2} />
      <DotwearIcon icon={byPrefixAndName.dw["save"]} scale={2} />
      {/* end-snippet */}
    </>
  );
}

export function Palette() {
  return (
    // snippet:icon-palette
    <div data-dw-palette="retro-green">
      <DotwearIcon icon={byName.folder} scale={2} />
    </div>
    // end-snippet
  );
}
