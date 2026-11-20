// コンポーネントに共通の「ピクセル調の外装」：階段状の角の背景・枠線・影・フォーカスリング（iOS の PixelChrome と同じ）
package dev.dotwear.compose

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.layout.layout
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.IntOffset

internal data class ChromeStyle(
    val fill: Color?,
    val border: Color,
    val borderWidth: Int,
    val steps: Int,
    /** 影の色。null なら描かない */
    val shadow: Color?,
    /** 影の分の場所（右と下に 1 ドット）を空けておくか。押したときに周りの配置が動かないように */
    val reservesShadow: Boolean,
    val pressed: Boolean = false,
    val focusRing: Color? = null,
    /** 二重線の枠の、外の線と内の線のすき間（ドット数） */
    val innerGap: Int = 0,
    /** 内の線の太さ（ドット数）。0 なら一重の枠 */
    val innerWidth: Int = 0,
    /** 内の線の色。null なら border と同じ。黒く塗ったボタンでは地の色の上で見えるように変える */
    val innerColor: Color? = null,
)

/**
 * 外装を描く。中身の大きさの外側に、影の分の 1 ドットを空ける。
 * 押したときは影を消して本体を 1 ドット沈める（button.md）
 */
@Composable
internal fun Modifier.dotwearChrome(style: ChromeStyle): Modifier {
    val unitPx = Dotwear.dotPx
    val unit = unitPx.toFloat()
    val reserve = if (style.reservesShadow) unitPx else 0
    return this
        // 影の分の場所を右と下に空ける（px で直接。dp を経由すると丸めでずれるため）
        .layout { measurable, constraints ->
            // 親から来た制約から影の分を引いて中身を測り、影の分を足した大きさにする
            fun shrink(v: Int) = if (v == Constraints.Infinity) v else (v - reserve).coerceAtLeast(0)
            val maxW = shrink(constraints.maxWidth)
            val maxH = shrink(constraints.maxHeight)
            val inner = Constraints(
                minWidth = shrink(constraints.minWidth).coerceAtMost(maxW),
                maxWidth = maxW,
                minHeight = shrink(constraints.minHeight).coerceAtMost(maxH),
                maxHeight = maxH,
            )
            val p = measurable.measure(inner)
            layout(p.width + reserve, p.height + reserve) {
                p.place(IntOffset(0, if (style.pressed) unitPx else 0))
            }
        }
        .drawBehind {
            if (style.shadow != null && !style.pressed) {
                translate(unit, unit) { drawPath(steppedPath(size, style.steps, unit), style.shadow) }
            }
            style.fill?.let { drawPath(steppedPath(size, style.steps, unit), it) }
            if (style.borderWidth > 0) drawPath(steppedBorderPath(size, style.steps, unit, style.borderWidth), style.border)
            // 内の線：外の線とすき間の分だけ内側に、角の段もその分減らして描く（外の線の階段と平行になる。iOS の PixelChrome と同じ）
            if (style.innerWidth > 0) {
                val inset = style.borderWidth + style.innerGap
                val d = inset * unit
                translate(d, d) {
                    drawPath(
                        steppedBorderPath(size.copy(size.width - 2 * d, size.height - 2 * d), (style.steps - inset).coerceAtLeast(0), unit, style.innerWidth),
                        style.innerColor ?: style.border,
                    )
                }
            }
            // 枠のすぐ外側に 1 ドット。角は 1 段多くして、枠の階段に沿わせる
            style.focusRing?.let {
                translate(-unit, -unit) {
                    drawPath(steppedBorderPath(size.copy(size.width + 2 * unit, size.height + 2 * unit), style.steps + 1, unit, 1), it)
                }
            }
        }
}
