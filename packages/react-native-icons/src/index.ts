// @dotwear/react-native-icons：React Native でアイコンを描く部品。
// アイコンの定義（dwSave など）は @dotwear/icons のものをそのまま使い回し、ここからも import できるようにする（ADR-032）
export * from "@dotwear/icons";
export { DotwearIcon, type DotwearIconProps } from "./DotwearIcon.js";
export { DotwearIconProvider, useDotwearIconTheme, type DotwearIconProviderProps, type DotwearIconTheme, type DotwearPalette } from "./context.js";
export { dotwearCellPx, layerRects, type DotwearCellRect } from "./geometry.js";
