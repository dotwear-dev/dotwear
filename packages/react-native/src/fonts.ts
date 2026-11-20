// 同梱のフォント（DotGothic16。ADR-026）。
// ファイル名をフォントの名前にそろえてあるので、iOS と Android のどちらでも fontFamily: "DotGothic16" で引ける。
//   Expo：const [loaded] = useFonts(dotwearFonts);
//   Expo を使わない場合：react-native.config.js の assets に node_modules/@dotwear/react-native/dist/generated/fonts を足す
// 16px を 1 マスとして描かれたフォントなので、くっきり見えるのは 16 × 画面の倍率が 16 の整数倍のときだけ。
// 文字の大きさの設定で大きさが変わるとにじむが、大きさを変えられることを優先する（ADR-026）
import { tokens } from "../generated/tokens.js";

// Metro はフォントの require をアセットの番号に置き換える。型のためだけに宣言する（Node の require とは別物）
declare function require(id: string): number;

/** fontFamily に渡す名前 */
export const dotwearFontFamily = tokens.typography.family;

/** Expo の useFonts / Font.loadAsync に渡す、名前とファイルの組 */
export const dotwearFonts = {
  [dotwearFontFamily]: require("../generated/fonts/DotGothic16.ttf"),
} as const;
