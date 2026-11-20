// Dotwear の文字：同梱の DotGothic16（ADR-026）。
// フォントのファイルはジェネレーターが fonts/ から src/generated/res/font/ にコピーする（R.font.dotgothic16_regular）。
// 16px を 1 マスとして描かれたフォントなので、くっきり見えるのは 16sp × 画面の倍率が 16 の整数倍のときだけ。
// 文字の大きさの設定（フォントの倍率）を変えるとにじむが、大きさを変えられることを優先する（ADR-026）
package dev.dotwear.compose

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontSynthesis
import androidx.compose.ui.text.font.FontWeight

object DotwearFont {
    /**
     * DotGothic16 の FontFamily。
     * 太さは Regular の 1 つしかないが、100〜900 のすべての太さにこの書体を割り当てる。
     * こうしないと、Bold を指定されたときに Compose が太字を合成し、ドットの境界がにじむため（Web の fonts.css と同じ考え方）
     */
    val family: FontFamily = FontFamily(
        (100..900 step 100).map { Font(R.font.dotgothic16_regular, FontWeight(it)) },
    )
}

/** Material の文字の大きさなどはそのままに、書体だけを DotGothic16 にする。太字・斜体の合成もしない */
internal fun Typography.withDotwearFont(): Typography {
    fun TextStyle.dw() = copy(fontFamily = DotwearFont.family, fontSynthesis = FontSynthesis.None)
    return copy(
        displayLarge = displayLarge.dw(),
        displayMedium = displayMedium.dw(),
        displaySmall = displaySmall.dw(),
        headlineLarge = headlineLarge.dw(),
        headlineMedium = headlineMedium.dw(),
        headlineSmall = headlineSmall.dw(),
        titleLarge = titleLarge.dw(),
        titleMedium = titleMedium.dw(),
        titleSmall = titleSmall.dw(),
        bodyLarge = bodyLarge.dw(),
        bodyMedium = bodyMedium.dw(),
        bodySmall = bodySmall.dw(),
        labelLarge = labelLarge.dw(),
        labelMedium = labelMedium.dw(),
        labelSmall = labelSmall.dw(),
    )
}
