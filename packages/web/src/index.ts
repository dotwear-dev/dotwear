// @dotwear/web：UI 一式（React の部品とトークン）。部品の見た目は @dotwear/web/components.css。
// UI を使う人が追加の import なしでアイコンも使えるように、@dotwear/icons をそのまま再 export する（依存の向きは UI → アイコンだけ。ADR-009）
export { tokens, tokenVars, type DotwearTokens } from "../generated/tokens.js";
export * from "@dotwear/icons";
export { DotwearIcon, type DotwearIconProps } from "@dotwear/icons/react";
export * from "./react/index.js";
