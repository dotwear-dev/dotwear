// 入力欄（docs/components/text-field.md）。標準の TextInput に見た目だけを被せる。
// 文字の入力・変換（IME）・選択・カーソル操作は標準のまま。名前（label）とエラーは TextInput に付けて読み上げる
//   <DotwearTextField label="メール" value={email} onChangeText={setEmail} error={emailError} />
import { useRef, useState, type ComponentRef } from "react";
import { Pressable, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { ChromeBox } from "./ChromeBox.js";
import { minTouchTarget } from "./target.js";
import { frameInset, useDotwear } from "./theme.js";
import { bodyText } from "./typography.js";

export interface DotwearTextFieldProps extends Omit<TextInputProps, "style" | "editable"> {
  /** 入力欄の名前。見た目には上に出し、VoiceOver・TalkBack でも読み上げる */
  label: string;
  /** エラーの説明。なければエラーなし。枠を danger の色にし、下に説明を出す */
  error?: string | null;
  disabled?: boolean;
  /** 一番外側（ラベル・入力欄・説明をまとめた View）のスタイル */
  style?: StyleProp<ViewStyle>;
}

export function DotwearTextField({ label, error, disabled = false, style, onFocus, onBlur, placeholder, accessibilityHint, ...rest }: DotwearTextFieldProps) {
  const { theme, colors: c, dots } = useDotwear();
  const [focused, setFocused] = useState(false);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const hasError = error != null && error !== "";
  const text = bodyText(disabled ? c.disabled : c.foreground);

  return (
    <View style={[{ gap: dots(2), alignSelf: "stretch" }, style]}>
      {/* 見た目のラベル。読み上げは入力欄のほうで行うので、ここは読み上げない。
          ラベルとエラーの説明も本文と同じ大きさにする（16 の整数倍でないと文字がにじむため。ADR-026） */}
      <Text style={bodyText(c.foreground)} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {label}
      </Text>
      {/* タップ領域は最低 44pt / 48dp（見た目の枠は 16 ドット）。枠の外を押しても入力欄に入る */}
      <Pressable
        accessible={false}
        disabled={disabled}
        onPress={() => input.current?.focus()}
        style={{ minHeight: minTouchTarget(), justifyContent: "center" }}
      >
        <ChromeBox
          reservesShadow={false}
          chrome={{
            fill: c.background,
            border: hasError ? c.danger : disabled ? c.disabled : c.border,
            borderWidth: theme.borderWidth,
            steps: theme.cornerStep,
            shadow: null,
            // 入力中はフォーカスリング。枠の太さは変えない（文字の位置がずれないように）
            focusRing: focused ? c.focus : null,
            innerGap: theme.borderGap,
            innerWidth: theme.borderInnerWidth,
          }}
          bodyStyle={{
            minHeight: dots(16),
            // 文字は内の線から 4 ドット離す（text-field.md）。上下も二重線の枠の厚さだけ空ける
            paddingHorizontal: dots(frameInset(theme, theme.borderWidth) - theme.borderWidth + 4),
            paddingVertical: dots(frameInset(theme, theme.borderWidth)),
            justifyContent: "center",
          }}
        >
          <TextInput
            ref={input}
            accessibilityLabel={label}
            // エラーの説明は入力欄と関連づけて読み上げる（iOS の accessibilityHint と同じ。text-field.md）
            accessibilityHint={hasError ? error : accessibilityHint}
            {...rest}
            editable={!disabled}
            placeholder={placeholder}
            placeholderTextColor={c.disabled}
            selectionColor={c.foreground}
            cursorColor={c.foreground}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            // Android の TextInput は既定で上下に余白と下線があるので消す（余白は枠の側で取る）
            underlineColorAndroid="transparent"
            style={[text, { padding: 0, margin: 0 }]}
          />
        </ChromeBox>
      </Pressable>
      {hasError ? (
        // 入力欄の説明として読み上げるので、ここは二重に読まない
        <Text style={bodyText(c.danger)} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
