// テーマ：部品が使う色と寸法。Context で配り、アイコンの既定の色も文字色に合わせる（Android の DotwearTheme と同じ形）。
//   <DotwearTheme><App /></DotwearTheme>
// 寸法はドット数で持ち、実寸は dotPx（1 ドットの整数ピクセル）を掛けて求める。
// 1 ドットは「pixelUnit（dp）× 画面の倍率」を切り捨てた整数ピクセル（ADR-019・ADR-032）。端数の倍率の端末でもにじまない
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useWindowDimensions } from "react-native";
import { DotwearIconProvider, dotwearCellPx } from "@dotwear/react-native-icons";
import { tokens } from "../generated/tokens.js";

export interface DotwearColors {
  readonly background: string;
  readonly foreground: string;
  readonly border: string;
  readonly primary: string;
  readonly onPrimary: string;
  readonly danger: string;
  readonly focus: string;
  readonly disabled: string;
}

export interface DotwearThemeValues {
  readonly colors: DotwearColors;
  /** 1 ドットの大きさ（dp）。整数だけ */
  readonly pixelUnit: number;
  /** 枠線の太さ（ドット数） */
  readonly borderWidth: number;
  /** 二重線の枠の、外の線と内の線のすき間（ドット数）。ADR-027 */
  readonly borderGap: number;
  /** 二重線の枠の、内の線の太さ（ドット数）。0 なら一重の枠 */
  readonly borderInnerWidth: number;
  /** 角の階段の段数 */
  readonly cornerStep: number;
}

/** トークン（tokens/*.json）どおりのテーマ */
export const defaultDotwearTheme: DotwearThemeValues = {
  colors: {
    background: tokens.color.bg,
    foreground: tokens.color.fg,
    border: tokens.color.border,
    primary: tokens.color.primary,
    onPrimary: tokens.color.onPrimary,
    danger: tokens.color.danger,
    focus: tokens.color.focus,
    disabled: tokens.color.disabled,
  },
  pixelUnit: tokens.shape.pixelUnit,
  borderWidth: tokens.shape.borderWidth,
  borderGap: tokens.shape.borderGap,
  borderInnerWidth: tokens.shape.borderInnerWidth,
  cornerStep: tokens.shape.cornerStep,
};

/** 一部だけを上書きするための型（色も 1 色ずつ上書きできる） */
export type DotwearThemeOverrides = Partial<Omit<DotwearThemeValues, "colors">> & { colors?: Partial<DotwearColors> };

const ThemeContext = createContext<DotwearThemeValues>(defaultDotwearTheme);

export interface DotwearThemeProps {
  /** 上書きする値。指定しなかった値は外側のテーマ（なければトークンどおり）を引き継ぐ */
  theme?: DotwearThemeOverrides;
  children?: ReactNode;
}

export function DotwearTheme({ theme, children }: DotwearThemeProps) {
  const outer = useContext(ThemeContext);
  const value = useMemo(() => mergeTheme(outer, theme), [outer, theme]);
  return (
    <ThemeContext.Provider value={value}>
      {/* DotwearIcon の既定の色（# のマス）を文字色に合わせる。パレットはアイコンのものをそのまま使う */}
      <DotwearIconProvider color={value.colors.foreground}>{children}</DotwearIconProvider>
    </ThemeContext.Provider>
  );
}

export function mergeTheme(base: DotwearThemeValues, overrides: DotwearThemeOverrides | undefined): DotwearThemeValues {
  const merged: DotwearThemeValues = { ...base, ...overrides, colors: { ...base.colors, ...overrides?.colors } };
  // 整数でない値はピクセルパーフェクトを壊すので、早めに知らせる（Android の DotwearThemeValues と同じ）
  if (!Number.isInteger(merged.pixelUnit) || merged.pixelUnit < 1) throw new Error(`[dotwear] pixelUnit は 1 以上の整数にしてください: ${merged.pixelUnit}`);
  for (const key of ["borderWidth", "borderGap", "borderInnerWidth", "cornerStep"] as const) {
    if (!Number.isInteger(merged[key]) || merged[key] < 0) throw new Error(`[dotwear] ${key} は 0 以上の整数（ドット数）にしてください: ${merged[key]}`);
  }
  return merged;
}

export interface Dotwear {
  readonly theme: DotwearThemeValues;
  readonly colors: DotwearColors;
  /** 1 ドットの整数ピクセル */
  readonly dotPx: number;
  /** 画面の倍率（物理ピクセル ÷ dp） */
  readonly pixelRatio: number;
  /** n ドット → dp。整数ピクセルから戻すので、レイアウトの丸めでずれない */
  dots(n: number): number;
  /** 枠の外側から、内の線の内側までの厚さ（ドット数）。中身がここより内側に来るように余白をとる */
  readonly frameInset: number;
}

/** 今のテーマの値と、ドット数を dp に直す関数 */
export function useDotwear(): Dotwear {
  const theme = useContext(ThemeContext);
  // PixelRatio.get() と違い、別の画面に移ったときも描き直される
  const { scale: pixelRatio } = useWindowDimensions();
  return useMemo(() => {
    const dotPx = dotwearCellPx(theme.pixelUnit, pixelRatio);
    return {
      theme,
      colors: theme.colors,
      dotPx,
      pixelRatio,
      dots: (n: number) => (n * dotPx) / pixelRatio,
      frameInset: frameInset(theme, theme.borderWidth),
    };
  }, [theme, pixelRatio]);
}

/** 外の線の太さが borderWidth と違うとき（大きいボタンなど）の frameInset */
export function frameInset(theme: DotwearThemeValues, outerWidth: number): number {
  return theme.borderInnerWidth > 0 ? outerWidth + theme.borderGap + theme.borderInnerWidth : outerWidth;
}
