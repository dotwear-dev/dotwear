// Material の Icon() などで使いたい人向けに、定義を ImageVector にする。
// 注意：ImageVector は dp で拡大縮小されるので、1.5 倍などの端数の倍率の端末ではマスの境界がにじむ。
// にじませたくないときは DotwearIcon を使う（ADR-019）
package dev.dotwear.icons

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp

private val cache = HashMap<Pair<String, DotwearIconGrid>, ImageVector>()

/**
 * この定義の ImageVector（16 のグリッド、1 マス 1dp）。
 * `#` は黒で描くので、Icon() の tint で色を付けられる。パレットの色は DotwearPalette.Default で塗る
 */
val DotwearIconDefinition.imageVector: ImageVector
    get() = imageVector(DotwearIconGrid.Grid16)

fun DotwearIconDefinition.imageVector(grid: DotwearIconGrid): ImageVector = synchronized(cache) {
    cache.getOrPut(name to grid) {
        val (actual, layers) = layersFor(grid)
        val side = actual.size.toFloat()
        ImageVector.Builder(name = "Dotwear.$name", defaultWidth = side.dp, defaultHeight = side.dp, viewportWidth = side, viewportHeight = side)
            .apply {
                for (layer in layers) {
                    val color = when (val c = layer.color) {
                        DotwearIconColor.Foreground -> Color.Black
                        is DotwearIconColor.Palette -> DotwearPalette.Default[c.slot] ?: continue
                    }
                    path(fill = SolidColor(color)) {
                        for (r in layer.rects) {
                            moveTo(r.x.toFloat(), r.y.toFloat())
                            horizontalLineToRelative(r.width.toFloat())
                            verticalLineToRelative(r.height.toFloat())
                            horizontalLineToRelative(-r.width.toFloat())
                            close()
                        }
                    }
                }
            }
            .build()
    }
}
