// 画面に共通の部品（見出し・画面の枠・戻るボタン）。文字は DotGothic16 を 16 の整数倍の大きさで使う（ADR-026）
import type { ReactNode } from "react";
import { ScrollView, Text, View, type TextProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DotwearButton, dotwearFontFamily, dwArrowLeft, useDotwear } from "@dotwear/react-native";

/** 本文の文字。色はテーマの文字色 */
export function Body({ style, ...rest }: TextProps) {
  const { colors } = useDotwear();
  return <Text {...rest} style={[{ fontFamily: dotwearFontFamily, fontSize: 16, color: colors.foreground }, style]} />;
}

/** 見出し。読み上げでも見出しとして伝える */
export function Heading({ size = 32, style, ...rest }: TextProps & { size?: 16 | 32 }) {
  return <Body accessibilityRole="header" {...rest} style={[{ fontSize: size }, style]} />;
}

export interface ScreenProps {
  title: string;
  /** あれば左上に戻るボタンを出す */
  onBack?: () => void;
  /** 右上に置くもの（設定ボタンなど） */
  action?: ReactNode;
  children: ReactNode;
}

/** 画面の枠：上の見出しの帯と、スクロールする中身 */
export function Screen({ title, onBack, action, children }: ScreenProps) {
  const { colors, dots } = useDotwear();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: dots(2), paddingHorizontal: dots(4), minHeight: 56 }}>
        {onBack ? <DotwearButton variant="ghost" size="small" icon={dwArrowLeft} accessibilityLabel="戻る" onPress={onBack} /> : null}
        <Heading size={16} style={{ flex: 1 }}>
          {title}
        </Heading>
        {action}
      </View>
      <ScrollView contentContainerStyle={{ padding: dots(8), gap: dots(6) }} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
