// DotwearIcon の前景色（`#` のマス）とパレット（スロット 2〜9）の既定値を、画面の一部ごとに配る。
// Web の currentColor と CSS 変数、Android の LocalDotwearIconColor・LocalDotwearPalette に当たる。
// React Native には色の継承がないので、Context で渡す。@dotwear/react-native のテーマはここに文字色を流し込む
import { createContext, useContext, type ReactNode } from "react";
import { paletteDefaults } from "@dotwear/icons";

/** パレット。キーはスロット（"2"〜"9"）、値は色 */
export type DotwearPalette = Readonly<Partial<Record<string, string>>>;

export interface DotwearIconTheme {
  /** `#` のマスの色 */
  readonly color: string;
  readonly palette: DotwearPalette;
}

const DotwearIconContext = createContext<DotwearIconTheme>({ color: "#000000", palette: paletteDefaults });

export interface DotwearIconProviderProps {
  color?: string;
  palette?: DotwearPalette;
  children?: ReactNode;
}

/** 指定しなかった項目は、外側の Provider（なければ黒と default のパレット）を引き継ぐ */
export function DotwearIconProvider({ color, palette, children }: DotwearIconProviderProps) {
  const outer = useContext(DotwearIconContext);
  const value: DotwearIconTheme = { color: color ?? outer.color, palette: palette ?? outer.palette };
  return <DotwearIconContext.Provider value={value}>{children}</DotwearIconContext.Provider>;
}

export function useDotwearIconTheme(): DotwearIconTheme {
  return useContext(DotwearIconContext);
}
