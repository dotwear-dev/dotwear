// 角を階段状にした形。ボタンやカードの外形に使う（iOS の SteppedRectangle と同じ形）。
//
//   steps = 1      steps = 2
//   .######.       ..####..
//   ########       .######.
//   ########       ########
//
// 1 段の大きさは unitDp を整数ピクセルにそろえたもの（ADR-019）。頂点はすべて整数ピクセルに乗る
package dev.dotwear.compose

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import dev.dotwear.icons.dotwearCellPx
import kotlin.math.max
import kotlin.math.min

class SteppedCornerShape(val steps: Int, val unitDp: Int) : Shape {
    override fun createOutline(size: Size, layoutDirection: LayoutDirection, density: Density): Outline {
        val unit = dotwearCellPx(unitDp, density.density).toFloat()
        return Outline.Generic(steppedPath(size, steps, unit))
    }

    override fun equals(other: Any?) = other is SteppedCornerShape && other.steps == steps && other.unitDp == unitDp
    override fun hashCode() = steps * 31 + unitDp
}

/**
 * 角を階段にした外形のパス。inset だけ内側に縮めた形も作れる。
 * 小さすぎて階段が入りきらないときは段数を減らす（左右・上下の角が重ならないように）
 */
fun steppedPath(size: Size, steps: Int, unit: Float, inset: Float = 0f, into: Path = Path()): Path {
    val w = size.width - inset * 2
    val h = size.height - inset * 2
    if (w <= 0f || h <= 0f) return into
    val fit = (min(w, h) / (2 * unit)).toInt()
    val s = min(max(0, steps), max(0, fit))
    // 左上：左の辺の (0, s) から、右へ 1 段・上へ 1 段を s 回くり返して、上の辺の (s, 0) へ。残りの角は鏡に映す
    val tl = ArrayList<Offset>()
    tl += Offset(0f, s * unit)
    for (i in 0 until s) {
        tl += Offset((i + 1) * unit, (s - i) * unit)
        tl += Offset((i + 1) * unit, (s - i - 1) * unit)
    }
    val pts = tl +
        tl.reversed().map { Offset(w - it.x, it.y) } +
        tl.map { Offset(w - it.x, h - it.y) } +
        tl.reversed().map { Offset(it.x, h - it.y) }
    pts.forEachIndexed { i, p ->
        if (i == 0) into.moveTo(inset + p.x, inset + p.y) else into.lineTo(inset + p.x, inset + p.y)
    }
    into.close()
    return into
}

/**
 * 枠線だけのパス：外形と width ドット内側の形の差（偶奇規則で穴を抜く）。
 * stroke は線の中心が辺に乗るので、太さによっては半ピクセルずれてにじむ。そこで塗りで枠線を作る（iOS と同じ）
 */
fun steppedBorderPath(size: Size, steps: Int, unit: Float, width: Int): Path {
    val path = Path().apply { fillType = PathFillType.EvenOdd }
    steppedPath(size, steps, unit, into = path)
    steppedPath(size, max(0, steps - width), unit, inset = width * unit, into = path)
    return path
}
