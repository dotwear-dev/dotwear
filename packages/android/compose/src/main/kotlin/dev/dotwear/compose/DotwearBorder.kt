// 任意の部品に、階段状の角の枠線だけを付ける（02_architecture の Modifier.dotwearBorder()）
package dev.dotwear.compose

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color

/**
 * @param width 枠線の太さ（ドット数）。省略時はテーマの値
 * @param steps 角の段数。省略時はテーマの値
 */
@Composable
fun Modifier.dotwearBorder(color: Color = Dotwear.colors.border, width: Int = Dotwear.theme.borderWidth, steps: Int = Dotwear.theme.cornerStep): Modifier {
    val unit = Dotwear.dotPx.toFloat()
    return drawBehind { drawPath(steppedBorderPath(size, steps, unit, width), color) }
}
