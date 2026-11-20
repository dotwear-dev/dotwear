// アイコンの定義。iOS の DotwearIconDefinition、Web の定義オブジェクト（dwSave）と同じく、
// 名前とグリッドごとの「色ごとの矩形」だけを持ち、色の値は持たない（ADR-013・ADR-019）。
// 個々のアイコンは生成物の DotwearIcons.Save など
package dev.dotwear.icons

import androidx.compose.runtime.Immutable

/** グリッドのサイズ（マスの数） */
enum class DotwearIconGrid(val size: Int) {
    Grid12(12),
    Grid16(16),
    Grid24(24),
}

/** マス目の色。`#` は前景色、`2`〜`9` はパレットのスロット */
@Immutable
sealed interface DotwearIconColor {
    data object Foreground : DotwearIconColor
    data class Palette(val slot: Int) : DotwearIconColor
}

/** マス目の矩形。座標と大きさはマス単位の整数 */
@Immutable
data class DotwearIconRect(val x: Int, val y: Int, val width: Int, val height: Int)

/**
 * 1 色ぶんの矩形の集まり。
 * 生成コードを小さくするため、矩形は [x, y, 幅, 高さ] を並べた IntArray で受け取る
 */
@Immutable
class DotwearIconLayer(val color: DotwearIconColor, packedRects: IntArray) {
    init {
        require(packedRects.size % 4 == 0) { "矩形は 4 つの整数ずつ並べてください" }
    }

    val rects: List<DotwearIconRect> = List(packedRects.size / 4) { i ->
        DotwearIconRect(packedRects[i * 4], packedRects[i * 4 + 1], packedRects[i * 4 + 2], packedRects[i * 4 + 3])
    }
}

@Immutable
class DotwearIconDefinition(
    /** 元データの名前（kebab-case。例："arrow-left"） */
    val name: String,
    /** グリッドごとの描き方。16 は必ずある */
    val grids: Map<DotwearIconGrid, List<DotwearIconLayer>>,
) {
    init {
        require(DotwearIconGrid.Grid16 in grids) { "16 のグリッドは必須です: $name" }
    }

    /** 指定したグリッドの描き方。描き分けがないときは 16 を使う（Web・iOS と同じ） */
    fun layersFor(grid: DotwearIconGrid): Pair<DotwearIconGrid, List<DotwearIconLayer>> =
        grids[grid]?.let { grid to it } ?: (DotwearIconGrid.Grid16 to grids.getValue(DotwearIconGrid.Grid16))

    override fun toString() = "DotwearIconDefinition($name)"
}
