// タップ領域の最小の大きさ（button.md・text-field.md・toggle.md）。iOS は 44pt、Android は 48dp。
// 見た目が小さくても、この大きさの場所を確保して中央に置く（Android の minimumInteractiveComponentSize と同じ）
import { Platform } from "react-native";

export function minTouchTarget(): number {
  return Platform.OS === "android" ? 48 : 44;
}
