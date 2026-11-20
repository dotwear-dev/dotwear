// Android 版の pixel-roundtrip（CLAUDE.md の最重要テスト）。
// Robolectric（実際の Skia で描く NATIVE モード）で、画面の倍率 mdpi〜xxxhdpi と端数の 420dpi（2.625 倍）で
// 全アイコンを描き、元データのマス目と 1 ピクセル単位で一致することを確かめる。
// 1 マスは dotwearCellPx（scale × 倍率 の切り捨て）ピクセルの正方形で、中はすべて同じ色、半透明のピクセルがないこと（ADR-019）
package dev.dotwear.icons

import android.graphics.Bitmap
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import org.junit.Assert.assertEquals
import org.junit.Assert.fail
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(ParameterizedRobolectricTestRunner::class)
class PixelRoundtripTest(private val qualifier: String, private val density: Float) {
    companion object {
        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0}")
        fun densities() = listOf(
            arrayOf<Any>("mdpi", 1f),
            arrayOf<Any>("hdpi", 1.5f),
            arrayOf<Any>("xhdpi", 2f),
            arrayOf<Any>("420dpi", 2.625f),
            arrayOf<Any>("xxhdpi", 3f),
            arrayOf<Any>("xxxhdpi", 4f),
        )

        // マスの文字ごとに見分けやすい色（プローブ）。キャプチャには後ろの背景も写るので、
        // 背景も決まった色で塗り、透明なマスはその色になることを確かめる
        val BACKGROUND = Color(0xFF00FF00)
        val FOREGROUND = Color(0xFFFF0000)
        fun slot(n: Int) = Color(red = 0, green = n * 25, blue = 255)
        val PROBE_PALETTE = DotwearPalette((2..9).associateWith { slot(it) })

        fun expected(ch: Char): Int = when (ch) {
            '.' -> BACKGROUND.toArgb()
            '#' -> FOREGROUND.toArgb()
            else -> slot(ch.digitToInt()).toArgb()
        }
    }

    @get:Rule
    val compose = createComposeRule()

    @Test
    fun everyIconMatchesItsSourceGrid() {
        RuntimeEnvironment.setQualifiers(qualifier)
        val scales = listOf(1, 2)
        compose.setContent {
            CompositionLocalProvider(LocalDotwearPalette provides PROBE_PALETTE) {
                // キャプチャは画面に見えている部分しか取れないので、縦一列ではなく折り返して画面に収める
                FlowRow(Modifier.background(BACKGROUND)) {
                    for (scale in scales) {
                        for ((icon, grid, _) in sourceGrids) {
                            DotwearIcon(icon, Modifier.testTag(tag(icon, grid, scale)), scale = scale, grid = grid, tint = FOREGROUND)
                        }
                    }
                }
            }
        }
        for (scale in scales) {
            val cell = dotwearCellPx(scale, density)
            for ((icon, grid, rows) in sourceGrids) {
                val label = "${icon.name} ${grid.name} scale$scale $qualifier"
                val bitmap = compose.onNodeWithTag(tag(icon, grid, scale)).captureToImage().asAndroidBitmap()
                assertMatches(bitmap, rows, cell, label)
            }
        }
    }

    @Test
    fun cellSizeIsWholePixels() {
        // 端数の倍率では切り捨てる（ADR-019）。1.5 倍で scale 1 → 1px、scale 2 → 3px
        assertEquals(1, dotwearCellPx(1, 1.5f))
        assertEquals(3, dotwearCellPx(2, 1.5f))
        assertEquals(2, dotwearCellPx(1, 2.625f))
        assertEquals(1, dotwearCellPx(0, 1f))
    }

    private fun tag(icon: DotwearIconDefinition, grid: DotwearIconGrid, scale: Int) = "${icon.name}-${grid.size}-$scale"

    private fun assertMatches(bitmap: Bitmap, rows: List<String>, cell: Int, label: String) {
        val size = rows.size * cell
        if (bitmap.width != size || bitmap.height != size) {
            fail("大きさが違う: ${bitmap.width}×${bitmap.height}、期待 $size: $label")
        }
        for (y in 0 until size) {
            for (x in 0 until size) {
                val want = expected(rows[y / cell][x / cell])
                val got = bitmap.getPixel(x, y)
                if (got != want) fail("(%d, %d) が #%08X、期待は #%08X: %s".format(x, y, got, want, label))
            }
        }
    }
}
