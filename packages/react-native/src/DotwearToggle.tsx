// スイッチとチェックボックス（docs/components/toggle.md）。標準の Switch は見た目をほとんど変えられないので、
// Pressable に accessibilityRole="switch" / "checkbox" と accessibilityState.checked を付けて作る（ADR-032）。
// VoiceOver・TalkBack は「スイッチ、オン」のように標準と同じに読み上げる。
// ラベル（children）を渡すと、ラベルを含めた行全体が 1 つのトグルになる（押す場所も読み上げも 1 つ）
//   <DotwearToggle value={wifi} onValueChange={setWifi}>Wi-Fi</DotwearToggle>
//   <DotwearToggle variant="checkbox" value={agree} onValueChange={setAgree}>同意する</DotwearToggle>
import { useState, type ReactNode } from "react";
import { Pressable, Text, View, type PressableProps } from "react-native";
import { ChromeLayer } from "./ChromeBox.js";
import { minTouchTarget } from "./target.js";
import { useDotwear } from "./theme.js";
import { labelText } from "./typography.js";

export type DotwearToggleVariant = "switch" | "checkbox";

export interface DotwearToggleProps extends Omit<PressableProps, "children" | "onPress"> {
  variant?: DotwearToggleVariant;
  value: boolean;
  /** 新しい値を受け取る（React Native の Switch と同じ名前） */
  onValueChange?: (value: boolean) => void;
  /** ラベル。見た目に出さないときは accessibilityLabel を渡す */
  children?: ReactNode;
}

/** チェックの形（toggle.md。枠の内側 6 × 6 ドット） */
export const CHECK_MARK = ["......", ".....#", "....##", "#..##.", "####..", ".##..."] as const;

export function DotwearToggle({
  variant = "switch",
  value,
  onValueChange,
  disabled = false,
  children,
  style,
  onPressIn,
  onPressOut,
  onFocus,
  onBlur,
  accessibilityState,
  ...rest
}: DotwearToggleProps) {
  const { colors: c, dots } = useDotwear();
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);
  const control = <DotwearToggleControl variant={variant} checked={value} enabled={!disabled} pressed={pressed && !disabled} focused={focused} />;
  const label =
    children == null ? null : typeof children === "string" || typeof children === "number" ? (
      <Text style={[labelText(disabled ? c.disabled : c.foreground), { flexShrink: 1 }]}>{children}</Text>
    ) : (
      children
    );

  return (
    <Pressable
      accessibilityRole={variant}
      {...rest}
      disabled={disabled}
      accessibilityState={{ checked: value, disabled, ...accessibilityState }}
      onPress={() => onValueChange?.(!value)}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={(state) => [
        // タップ領域はラベルを含めて最低 44pt / 48dp
        { minHeight: minTouchTarget(), minWidth: minTouchTarget(), flexDirection: "row", alignItems: "center", gap: dots(4) },
        label ? { alignSelf: "stretch" } : { justifyContent: "center", alignSelf: "flex-start" },
        typeof style === "function" ? style(state) : style,
      ]}
    >
      {/* iOS の設定画面と同じく、スイッチはラベルが左で本体が右。チェックボックスは本体が左 */}
      {variant === "switch" ? (
        <>
          {label ? <View style={{ flex: 1 }}>{label}</View> : null}
          {control}
        </>
      ) : (
        <>
          {control}
          {label ? <View style={{ flex: 1 }}>{label}</View> : null}
        </>
      )}
    </Pressable>
  );
}

/** スイッチ・チェックボックスの本体（文字を含まないので、すべてドットの格子に乗る。大きさは整数ピクセルで決める） */
function DotwearToggleControl({ variant, checked, enabled, pressed, focused }: { variant: DotwearToggleVariant; checked: boolean; enabled: boolean; pressed: boolean; focused: boolean }) {
  const { theme, colors: c, dotPx, dots } = useDotwear();
  const [w, h] = variant === "switch" ? [14, 8] : [8, 8];
  const fill = checked ? (enabled ? c.primary : c.disabled) : c.background;
  const mark = enabled ? (checked ? c.onPrimary : c.border) : checked ? c.background : c.disabled;
  const cell = (x: number, y: number, cw: number, ch: number, color: string, key: string) => (
    <View key={key} style={{ position: "absolute", left: dots(x), top: dots(y), width: dots(cw), height: dots(ch), backgroundColor: color }} />
  );

  let marks: ReactNode = null;
  if (variant === "switch") {
    // つまみは枠の内側いっぱいの 6 × 6。オフは左で線だけの四角、オンは右で塗りつぶし。
    // 4 階調では primary と border、onPrimary と background が同じ色なので、オフも塗りつぶすとオンと同じ絵になる（ADR-029）
    const x = checked ? 7 : 1;
    marks = [cell(x, 1, 6, 6, mark, "knob"), checked ? null : cell(x + 1, 2, 4, 4, fill, "hole")];
  } else if (checked) {
    marks = CHECK_MARK.flatMap((row, y) => [...row].map((ch, x) => (ch === "#" ? cell(x + 1, y + 1, 1, 1, mark, `${x},${y}`) : null)));
  }

  return (
    <View
      testID="dotwear-toggle-control"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      // 影の分の場所を右と下に空ける（押したときに周りの配置が動かないように）
      style={{ width: dots(w + 1), height: dots(h + 1) }}
    >
      <View style={{ position: "absolute", left: 0, top: pressed ? dots(1) : 0, width: dots(w), height: dots(h) }}>
        <ChromeLayer
          width={w * dotPx}
          height={h * dotPx}
          style={{
            fill,
            border: enabled ? c.border : c.disabled,
            borderWidth: theme.borderWidth,
            steps: theme.cornerStep,
            shadow: enabled ? c.border : null,
            pressed,
            focusRing: focused ? c.focus : null,
          }}
        />
        {marks}
      </View>
    </View>
  );
}
