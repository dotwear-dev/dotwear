// テスト用：コンポーザブルを描いてキャプチャし、ドット単位の絵（文字 → 色）と 1 ピクセル単位で比べる
package dev.dotwear.compose

import android.graphics.Bitmap
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import org.junit.Assert.fail

/** 背景（透明の代わり）。キャプチャには後ろも写るので、決まった色で塗っておく */
val PROBE_BG = Color(0xFF00FF00)

fun assertDots(bitmap: Bitmap, rows: List<String>, dotPx: Int, colors: Map<Char, Color>, label: String) {
    val w = rows[0].length * dotPx
    val h = rows.size * dotPx
    if (bitmap.width != w || bitmap.height != h) fail("大きさが違う: ${bitmap.width}×${bitmap.height}、期待 $w×$h: $label")
    for (y in 0 until h) {
        for (x in 0 until w) {
            val ch = rows[y / dotPx][x / dotPx]
            val want = (if (ch == '.') PROBE_BG else colors.getValue(ch)).toArgb()
            val got = bitmap.getPixel(x, y)
            if (got != want) fail("ドット (${x / dotPx}, ${y / dotPx}) の (%d, %d) が #%08X、期待は %s: %s".format(x, y, got, ch, label))
        }
    }
}
