// アイコンを描く部品。`<DotwearIcon icon={dwSave} scale={2} title="保存" />`（ADR-032。名前と使い方は Web と同じ）
//
// View の矩形を並べて描く（react-native-svg は使わない）。矩形の位置と大きさを
// 「整数の物理ピクセル ÷ 画面の倍率」の dp にするので、レイアウトの丸め（Yoga）でも境界がずれない
import { useWindowDimensions, View, type ViewProps } from "react-native";
import type { DotwearIconDefinition, DotwearIconGrid } from "@dotwear/icons";
import { useDotwearIconTheme } from "./context.js";
import { dotwearCellPx, layerRects } from "./geometry.js";

export interface DotwearIconProps extends Omit<ViewProps, "children"> {
  /** アイコンの定義オブジェクト。例：`icon={dwSave}`、動的に選ぶときは `icon={byName[name]}` */
  icon: DotwearIconDefinition;
  /**
   * 表示倍率。**整数だけ**（1 → 16 マス × 1 マスの大きさ）。
   * 整数以外を渡すとマスの境界がにじむため、警告して切り捨てる。
   */
  scale?: number;
  /** 使うグリッド。描き分けがないサイズを指定したときは 16 を使う */
  grid?: DotwearIconGrid;
  /** 読み上げ用のラベル。省略すると装飾扱い（読み上げない）になる */
  title?: string;
  /** `#` のマスの色。省略すると DotwearIconProvider の色（なければ黒） */
  color?: string;
}

export function DotwearIcon({ icon, scale = 1, grid = 16, title, color, style, ...rest }: DotwearIconProps) {
  const theme = useDotwearIconTheme();
  // PixelRatio.get() と違い、別の画面に移ったときも描き直される
  const { scale: pixelRatio } = useWindowDimensions();
  const actualGrid: DotwearIconGrid = icon.grids[grid] ? grid : 16;
  const layers = icon.grids[actualGrid] ?? icon.grids[16];
  const cellPx = dotwearCellPx(normalizeScale(scale, icon.name), pixelRatio);
  // 整数ピクセルを dp に直す。dp で見ると端数になるが、物理ピクセルでは整数になる
  const dp = (cells: number) => (cells * cellPx) / pixelRatio;
  const side = dp(actualGrid);

  // 名前がなければ装飾として読み上げから外す。あれば画像として読み上げる
  const a11y: ViewProps = title
    ? { accessible: true, accessibilityRole: "image", accessibilityLabel: title }
    : { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" };

  return (
    <View {...a11y} {...rest} style={[{ width: side, height: side, flexShrink: 0 }, style]}>
      {layers.map((layer) => {
        const fill = layer.color === "#" ? (color ?? theme.color) : theme.palette[layer.color];
        // パレットに色がないスロットは描かない（利用者が独自のパレットを渡したときだけ起きる）
        if (!fill) return null;
        return layerRects(layer).map((r) => (
          <View
            key={`${layer.color}:${r.x},${r.y}`}
            style={{ position: "absolute", left: dp(r.x), top: dp(r.y), width: dp(r.width), height: dp(r.height), backgroundColor: fill }}
          />
        ));
      })}
    </View>
  );
}

// 整数倍以外の表示は、ピクセルパーフェクトを壊すので受け付けない（CLAUDE.md 最重要ルール 2。Web と同じ）
function normalizeScale(scale: number, name: string): number {
  if (Number.isInteger(scale) && scale >= 1) return scale;
  const fixed = Number.isFinite(scale) ? Math.max(1, Math.floor(scale)) : 1;
  console.warn(`[dotwear] DotwearIcon "${name}" の scale は 1 以上の整数にしてください（${scale} → ${fixed} に切り捨てました）`);
  return fixed;
}
