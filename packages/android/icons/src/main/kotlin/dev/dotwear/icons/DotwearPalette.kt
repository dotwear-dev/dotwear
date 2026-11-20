// 多色アイコンのパレット（スロット 2〜9 の色）。テーマは生成物の DotwearPalette.Default など。
// CompositionLocal で配るので、画面の一部だけテーマを変えることもできる：
//   CompositionLocalProvider(LocalDotwearPalette provides DotwearPalette.RetroGreen) { … }
package dev.dotwear.icons

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

@Immutable
class DotwearPalette(val colors: Map<Int, Color>) {
    operator fun get(slot: Int): Color? = colors[slot]

    override fun equals(other: Any?) = other is DotwearPalette && other.colors == colors
    override fun hashCode() = colors.hashCode()

    // 生成物が DotwearPalette.Default などを拡張プロパティとして足すための入れ物
    companion object {
        /** 生成コード用。0xRRGGBB の整数から作る */
        fun fromHex(vararg slots: Pair<Int, Long>): DotwearPalette =
            DotwearPalette(slots.associate { (slot, hex) -> slot to Color(0xFF000000 or hex) })
    }
}

/** DotwearIcon が使うパレット */
val LocalDotwearPalette = staticCompositionLocalOf<DotwearPalette> { DotwearPalette.Default }

/**
 * DotwearIcon の前景色（`#` のマス）の既定値。
 * このモジュールは Material に依存しないので、Material の LocalContentColor の代わりにこれを使う。
 * dotwear-compose の DotwearTheme は、ここに Material の文字色を流し込む
 */
val LocalDotwearIconColor = staticCompositionLocalOf { Color.Black }
