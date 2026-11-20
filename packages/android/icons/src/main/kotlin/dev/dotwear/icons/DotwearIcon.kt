// アイコンを描くコンポーザブル。`DotwearIcon(DotwearIcons.Save, scale = 2)`（ADR-013）
//
// ピクセルパーフェクトのための決まり（ADR-019）：
//   - 1 マスは「scale × 画面の倍率」を切り捨てた整数ピクセル（最低 1px）。
//     1.5 倍や 2.625 倍の端末でも、マスの境界がピクセルの境界からずれない。
//     そのかわり dp で見た大きさは、端数の倍率で少し小さくなる
//   - 大きさは dp ではなく px で決める（dp → px の丸めで 1px ずれるのを避ける）
package dev.dotwear.icons

import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.isSpecified
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import kotlin.math.floor
import kotlin.math.max

/**
 * @param icon アイコン（`DotwearIcons.Save` など）
 * @param scale 表示倍率。整数だけ。1 未満は 1 にする
 * @param grid 使うグリッド。描き分けがないときは 16 を使う
 * @param contentDescription TalkBack で読み上げる名前。null なら装飾として読み上げない
 * @param tint `#` のマスの色。指定しなければ [LocalDotwearIconColor]
 */
@Composable
fun DotwearIcon(
    icon: DotwearIconDefinition,
    modifier: Modifier = Modifier,
    scale: Int = 1,
    grid: DotwearIconGrid = DotwearIconGrid.Grid16,
    contentDescription: String? = null,
    tint: Color = Color.Unspecified,
) {
    val (actualGrid, layers) = icon.layersFor(grid)
    val cellPx = dotwearCellPx(scale, LocalDensity.current.density)
    val sidePx = actualGrid.size * cellPx
    val palette = LocalDotwearPalette.current
    val foreground = if (tint.isSpecified) tint else LocalDotwearIconColor.current

    val a11y = if (contentDescription != null) {
        Modifier.semantics {
            this.contentDescription = contentDescription
            role = Role.Image
        }
    } else {
        Modifier
    }

    Canvas(
        modifier
            .then(a11y)
            // 大きさを px で直接決める（dp を経由すると丸めで 1px ずれることがある）
            .layout { measurable, _ ->
                val placeable = measurable.measure(androidx.compose.ui.unit.Constraints.fixed(sidePx, sidePx))
                layout(sidePx, sidePx) { placeable.place(0, 0) }
            },
    ) {
        val cell = cellPx.toFloat()
        for (layer in layers) {
            val color = when (val c = layer.color) {
                DotwearIconColor.Foreground -> foreground
                // パレットに色がないスロットは描かない（利用者が独自のパレットを渡したときだけ起きる）
                is DotwearIconColor.Palette -> palette[c.slot] ?: continue
            }
            for (r in layer.rects) {
                drawRect(color, Offset(r.x * cell, r.y * cell), Size(r.width * cell, r.height * cell))
            }
        }
    }
}

/** 1 マスの大きさ（px）。scale × 画面の倍率 を切り捨てた整数で、最低 1（ADR-019） */
fun dotwearCellPx(scale: Int, density: Float): Int =
    max(1, floor(max(1, scale) * density + 1e-4f).toInt())
