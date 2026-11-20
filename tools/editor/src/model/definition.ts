// 編集中のグリッドから、@dotwear/icons と同じ形の定義オブジェクトを作る。
// パスはジェネレーターと同じ矩形統合（@dotwear/generator/paths）で作るので、
// プレビューは配布物（DotwearIcon）とまったく同じ描き方になる
import type { DotwearIconDefinition, DotwearIconLayer } from "@dotwear/icons";
import { ICON_PREFIXES } from "@dotwear/generator/naming";
import { gridToRects, rectsToPath } from "@dotwear/generator/paths";
import type { IconDocument } from "./icon.ts";

export function toDefinition(icon: IconDocument): DotwearIconDefinition {
  const layers = (grid: readonly string[]): DotwearIconLayer[] =>
    [...gridToRects(grid)].map(([color, rects]) => ({ color, d: rectsToPath(rects) }));
  return {
    prefix: ICON_PREFIXES[icon.tier],
    name: icon.name,
    grids: {
      16: layers(icon.sizes["16"]),
      ...(icon.sizes["12"] ? { 12: layers(icon.sizes["12"]) } : {}),
      ...(icon.sizes["24"] ? { 24: layers(icon.sizes["24"]) } : {}),
    },
  };
}
