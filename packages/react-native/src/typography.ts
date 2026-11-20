// 部品の文字のスタイル。DotGothic16 を太字にしない（合成した太字はドットの境界がにじむため。ADR-026）
import type { TextStyle } from "react-native";
import { tokens } from "../generated/tokens.js";

export function labelText(color: string): TextStyle {
  return { fontFamily: tokens.typography.family, fontSize: tokens.typography.label, fontWeight: "normal", color };
}

export function bodyText(color: string): TextStyle {
  return { fontFamily: tokens.typography.family, fontSize: tokens.typography.body, fontWeight: "normal", color };
}
