// ボタン（docs/components/button.md）。標準の Pressable（役割は button）に見た目だけを被せる。
// 押したときは本体が 1 ドット沈む。タップ領域は最低 44pt / 48dp。VoiceOver・TalkBack・キーボード操作は Pressable のまま効く
//   <DotwearButton variant="primary" icon={dwSave} onPress={save}>保存</DotwearButton>
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, Text, View, type PressableProps } from "react-native";
import { DotwearIcon, DotwearIconProvider, type DotwearIconDefinition } from "@dotwear/react-native-icons";
import { ChromeBox } from "./ChromeBox.js";
import { minTouchTarget } from "./target.js";
import { frameInset, useDotwear } from "./theme.js";
import { labelText } from "./typography.js";

export type DotwearButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type DotwearButtonSize = "small" | "medium" | "large";

/** 寸法（ドット数。button.md の表）。large だけ枠線と角の段を 2 倍にする */
const SIZES: Record<DotwearButtonSize, { height: number; paddingX: number; borderScale: number; gap: number }> = {
  small: { height: 12, paddingX: 4, borderScale: 1, gap: 2 },
  medium: { height: 16, paddingX: 6, borderScale: 1, gap: 3 },
  large: { height: 20, paddingX: 8, borderScale: 2, gap: 4 },
};

export interface DotwearButtonProps extends Omit<PressableProps, "children" | "style"> {
  variant?: DotwearButtonVariant;
  size?: DotwearButtonSize;
  /** ラベルの前に置くアイコン。アイコンだけのボタンには accessibilityLabel を必ず付ける */
  icon?: DotwearIconDefinition;
  /** 読み込み中の表示（文字の代わりに 3 つのドット）。押せないようにはしないので、必要なら disabled も付ける */
  loading?: boolean;
  /** ラベル。文字列なら DotGothic16 の Text にする */
  children?: ReactNode;
  style?: PressableProps["style"];
}

export function DotwearButton({
  variant = "primary",
  size = "medium",
  icon,
  loading = false,
  disabled = false,
  children,
  style,
  onPressIn,
  onPressOut,
  onFocus,
  onBlur,
  accessibilityState,
  ...rest
}: DotwearButtonProps) {
  const { theme, colors: c, dots } = useDotwear();
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);
  const enabled = !disabled;
  const dims = SIZES[size];

  const [fill, fg, border] = !enabled
    ? [variant === "ghost" ? null : c.background, c.disabled, c.disabled]
    : variant === "primary"
      ? [c.primary, c.onPrimary, c.border]
      : variant === "secondary"
        ? [c.background, c.foreground, c.border]
        : variant === "danger"
          ? [c.danger, c.onPrimary, c.border]
          : [null, c.foreground, c.border];
  const outerWidth = theme.borderWidth * dims.borderScale;
  // 黒く塗ったボタン（primary・danger）では、内の線を文字と同じ色にして地の上で見えるようにする（button.md）
  const innerColor = enabled && (variant === "primary" || variant === "danger") ? c.onPrimary : null;
  const target = minTouchTarget();

  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      disabled={disabled}
      accessibilityState={{ disabled, busy: loading, ...accessibilityState }}
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
        // 既定では中身の幅（alignSelf: flex-start）。利用者が style で横に伸ばしたときは、外装も一緒に伸ばす（alignItems: stretch）
        { minHeight: target, minWidth: target, alignItems: "stretch", justifyContent: "center", alignSelf: "flex-start" },
        typeof style === "function" ? style(state) : style,
      ]}
    >
      <ChromeBox
        reservesShadow={variant !== "ghost"}
        chrome={{
          fill,
          border,
          borderWidth: outerWidth,
          steps: theme.cornerStep * dims.borderScale,
          shadow: enabled && variant !== "ghost" ? c.border : null,
          pressed: pressed && enabled,
          focusRing: focused ? c.focus : null,
          innerGap: theme.borderGap,
          innerWidth: theme.borderInnerWidth,
          innerColor,
        }}
        bodyStyle={{
          minHeight: dots(dims.height),
          // 上下は二重線の枠の厚さだけ空け、文字が内の線に重ならないようにする（そのため small は少し高くなる）
          paddingHorizontal: dots(dims.paddingX),
          paddingVertical: dots(frameInset(theme, outerWidth)),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <DotwearIconProvider color={fg}>
          {/* 読み込み中は文字を見えなくして 3 つのドットを重ねる。幅を変えないように文字は残す */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: dots(dims.gap), opacity: loading ? 0 : 1 }}>
            {icon ? <DotwearIcon icon={icon} /> : null}
            {typeof children === "string" || typeof children === "number" ? <Text style={labelText(fg)}>{children}</Text> : children}
          </View>
          {loading ? <LoadingDots color={fg} /> : null}
        </DotwearIconProvider>
      </ChromeBox>
    </Pressable>
  );
}

/** 読み込み中の 3 つのドット。1 つずつ順に明るくする（なめらかに動かさず、コマ送りにする） */
function LoadingDots({ color }: { color: string }) {
  const { dots } = useDotwear();
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 3), 250);
    return () => clearInterval(id);
  }, []);
  return (
    <View
      testID="dotwear-loading"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: "absolute", flexDirection: "row", gap: dots(2) }}
    >
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: dots(2), height: dots(2), backgroundColor: color, opacity: i === step ? 1 : 0.4 }} />
      ))}
    </View>
  );
}
