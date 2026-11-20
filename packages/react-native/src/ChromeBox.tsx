// 外装（src/chromeGeometry.ts で計算した矩形）を View で描く。
// 大きさが中身で決まる部品は、onLayout で測った本体の大きさから描く（最初の 1 回の描画では外装が出ない）
import { useState } from "react";
import { View, type LayoutChangeEvent, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import { chromeRects, type ChromeStyle } from "./chromeGeometry.js";
import { useDotwear } from "./theme.js";

/** 外装の矩形を、本体の後ろ（先に描く子）に並べる。読み上げとタッチの対象にはしない */
export function ChromeLayer({ width, height, style }: { width: number; height: number; style: ChromeStyle }) {
  const { dotPx, pixelRatio } = useDotwear();
  const dp = (px: number) => px / pixelRatio;
  return (
    <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ position: "absolute", left: 0, top: 0 }}>
      {chromeRects(width, height, dotPx, style).map((r, i) => (
        <View key={i} style={{ position: "absolute", left: dp(r.x), top: dp(r.y), width: dp(r.width), height: dp(r.height), backgroundColor: r.color }} />
      ))}
    </View>
  );
}

export interface ChromeBoxProps extends ViewProps {
  chrome: ChromeStyle;
  /** 影の分の場所（右と下に 1 ドット）を空けておくか。押したときに周りの配置が動かないように */
  reservesShadow: boolean;
  /** 本体（外装の内側）のスタイル。余白など */
  bodyStyle?: StyleProp<ViewStyle>;
}

/**
 * 外装を付けた箱。外側の View は影の分を右と下に空け、本体は押したときに 1 ドット沈む（button.md）。
 * 本体の大きさは物理ピクセルに直してから外装を計算する（Yoga が整数ピクセルに丸めた大きさに合わせる）
 */
export function ChromeBox({ chrome, reservesShadow, bodyStyle, style, children, ...rest }: ChromeBoxProps) {
  const { dots, pixelRatio } = useDotwear();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const width = Math.round(e.nativeEvent.layout.width * pixelRatio);
    const height = Math.round(e.nativeEvent.layout.height * pixelRatio);
    if (!size || size.width !== width || size.height !== height) setSize({ width, height });
  };
  const reserve = reservesShadow ? dots(1) : 0;
  return (
    <View {...rest} style={[{ paddingRight: reserve, paddingBottom: reserve }, style]}>
      <View onLayout={onLayout} style={[{ top: chrome.pressed ? dots(1) : 0 }, bodyStyle]}>
        {size ? <ChromeLayer width={size.width} height={size.height} style={chrome} /> : null}
        {children}
      </View>
    </View>
  );
}
