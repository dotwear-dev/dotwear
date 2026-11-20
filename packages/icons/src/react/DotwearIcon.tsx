import type { ComponentPropsWithoutRef } from "react";
import { paletteDefaults } from "../../generated/palette.js";
import type { DotwearIconColor, DotwearIconDefinition, DotwearIconGrid } from "../types.js";

export interface DotwearIconProps extends Omit<ComponentPropsWithoutRef<"svg">, "width" | "height" | "viewBox" | "children"> {
  /** アイコンの定義オブジェクト。例：`icon={dwSave}`、動的に選ぶときは `icon={byName[name]}` */
  icon: DotwearIconDefinition;
  /**
   * 表示倍率。**整数だけ**（1 → 16px、2 → 32px …）。
   * 整数以外を渡すとマスの境界がにじむため、警告して切り捨てる。
   */
  scale?: number;
  /** 使うグリッド。描き分けがないサイズを指定したときは 16 を使う */
  grid?: DotwearIconGrid;
  /** 読み上げ用のラベル。省略すると装飾扱い（aria-hidden）になる */
  title?: string;
}

export function DotwearIcon({ icon, scale = 1, grid = 16, title, style, ...rest }: DotwearIconProps) {
  const actualGrid: DotwearIconGrid = icon.grids[grid] ? grid : 16;
  const layers = icon.grids[actualGrid] ?? icon.grids[16];
  const px = actualGrid * normalizeScale(scale, icon.name);

  // 名前がなければ装飾として読み上げから外す。あれば画像として読み上げる
  const a11y = title ? { role: "img", "aria-label": title } : { "aria-hidden": true as const };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={px}
      height={px}
      viewBox={`0 0 ${actualGrid} ${actualGrid}`}
      shapeRendering="crispEdges"
      focusable="false"
      // inline の svg はベースラインの下に隙間ができ、位置が小数ピクセルにずれることがあるので揃える
      style={{ verticalAlign: "middle", flexShrink: 0, ...style }}
      {...a11y}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {layers.map((layer) => (
        <path key={layer.color} fill={fillOf(layer.color)} d={layer.d} />
      ))}
    </svg>
  );
}

function fillOf(color: DotwearIconColor): string {
  if (color === "#") return "currentColor";
  const fallback = paletteDefaults[color];
  return fallback ? `var(--dw-palette-${color}, ${fallback})` : `var(--dw-palette-${color})`;
}

// 整数倍以外の表示は、ピクセルパーフェクトを壊すので受け付けない（CLAUDE.md 最重要ルール 2）
function normalizeScale(scale: number, name: string): number {
  if (Number.isInteger(scale) && scale >= 1) return scale;
  const fixed = Number.isFinite(scale) ? Math.max(1, Math.floor(scale)) : 1;
  // process.env を参照するとバンドラーの設定次第でブラウザで落ちるので、本番でも警告する（誤用のときだけ出る）
  console.warn(`[dotwear] DotwearIcon "${name}" の scale は 1 以上の整数にしてください（${scale} → ${fixed} に切り捨てました）`);
  return fixed;
}
