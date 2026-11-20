// 階段状の角の形・枠線と、トグルの本体を、ドット単位の絵と 1 ピクセル単位で比べる（iOS の SteppedRectangleTests・
// ComponentPixelTests と同じ絵）。画面の倍率は整数と端数（hdpi 1.5 倍、420dpi 2.625 倍）の両方で確かめる。
// 1 ドットは dotwearCellPx（pixelUnit × 倍率 の切り捨て）ピクセル（ADR-019）
package dev.dotwear.compose

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.Constraints
import dev.dotwear.icons.dotwearCellPx
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(ParameterizedRobolectricTestRunner::class)
class ShapePixelTest(private val qualifier: String, private val density: Float) {
    companion object {
        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0}")
        fun densities() = listOf(
            arrayOf<Any>("mdpi", 1f),
            arrayOf<Any>("hdpi", 1.5f),
            arrayOf<Any>("xhdpi", 2f),
            arrayOf<Any>("420dpi", 2.625f),
            arrayOf<Any>("xxhdpi", 3f),
        )

        val RED = Color(0xFFFF0000)
        val FILL_1 = listOf(".########.") + List(6) { "##########" } + listOf(".########.")
        val FILL_2 = listOf("..######..", ".########.") + List(4) { "##########" } + listOf(".########.", "..######..")
        val BORDER_1_1 = listOf(".########.") + List(6) { "#........#" } + listOf(".########.")
        val BORDER_2_1 = listOf("..######..", ".#......#.") + List(4) { "#........#" } + listOf(".#......#.", "..######..")
        val BORDER_2_2 = listOf("..######..", ".########.") + List(4) { "##......##" } + listOf(".########.", "..######..")
    }

    @get:Rule
    val compose = createComposeRule()

    private val theme = DotwearThemeValues()
    private val dotPx get() = dotwearCellPx(theme.pixelUnit, density)

    @Test
    fun steppedShapesAndBorders() {
        RuntimeEnvironment.setQualifiers(qualifier)
        val cases = listOf(
            Triple("fill1", FILL_1) { m: Modifier, u: Float -> m.drawBehind { drawPath(steppedPath(size, 1, u), RED) } },
            Triple("fill2", FILL_2) { m: Modifier, u: Float -> m.drawBehind { drawPath(steppedPath(size, 2, u), RED) } },
            Triple("border11", BORDER_1_1) { m: Modifier, u: Float -> m.drawBehind { drawPath(steppedBorderPath(size, 1, u, 1), RED) } },
            Triple("border21", BORDER_2_1) { m: Modifier, u: Float -> m.drawBehind { drawPath(steppedBorderPath(size, 2, u, 1), RED) } },
            Triple("border22", BORDER_2_2) { m: Modifier, u: Float -> m.drawBehind { drawPath(steppedBorderPath(size, 2, u, 2), RED) } },
        )
        val px = dotPx
        compose.setContent {
            Column(Modifier.background(PROBE_BG)) {
                for ((tag, rows, draw) in cases) {
                    Box(draw(Modifier.testTag(tag).fixedPx(rows[0].length * px, rows.size * px), px.toFloat()))
                }
            }
        }
        for ((tag, rows, _) in cases) {
            assertDots(compose.onNodeWithTag(tag).captureToImage().asAndroidBitmap(), rows, px, mapOf('#' to RED), "$tag $qualifier")
        }
    }

    @Test
    fun toggleControls() {
        RuntimeEnvironment.setQualifiers(qualifier)
        val c = theme.colors
        val colors = mapOf('B' to c.border, 'P' to c.primary, 'W' to c.onPrimary, 'G' to c.background)
        data class Case(val tag: String, val rows: List<String>, val content: @Composable () -> Unit)
        val cases = listOf(
            Case(
                "checkbox-on",
                listOf(".BBBBBB..", "BPPPPPPB.", "BPPPPPWBB", "BPPPPWWBB", "BWPPWWPBB", "BWWWWPPBB", "BPWWPPPBB", ".BBBBBBBB", "..BBBBBB."),
            ) { DotwearToggleControl(DotwearToggleVariant.Checkbox, checked = true, enabled = true, pressed = false, focused = false, modifier = Modifier.testTag("checkbox-on")) },
            Case(
                "checkbox-pressed",
                listOf(".........", ".BBBBBB..") + List(6) { "BGGGGGGB." } + listOf(".BBBBBB.."),
            ) { DotwearToggleControl(DotwearToggleVariant.Checkbox, checked = false, enabled = true, pressed = true, focused = false, modifier = Modifier.testTag("checkbox-pressed")) },
            Case(
                "switch-on",
                listOf(".BBBBBBBBBBBB..", "BPPPPPPWWWWWWB.") + List(5) { "BPPPPPPWWWWWWBB" } + listOf(".BBBBBBBBBBBBBB", "..BBBBBBBBBBBB."),
            ) { DotwearToggleControl(DotwearToggleVariant.Switch, checked = true, enabled = true, pressed = false, focused = false, modifier = Modifier.testTag("switch-on")) },
            Case(
                "switch-off",
                listOf(".BBBBBBBBBBBB..", "BBBBBBBGGGGGGB.") + List(4) { "BBGGGGBGGGGGGBB" } + listOf("BBBBBBBGGGGGGBB", ".BBBBBBBBBBBBBB", "..BBBBBBBBBBBB."),
            ) { DotwearToggleControl(DotwearToggleVariant.Switch, checked = false, enabled = true, pressed = false, focused = false, modifier = Modifier.testTag("switch-off")) },
        )
        compose.setContent {
            DotwearTheme(theme) {
                Column(Modifier.background(PROBE_BG)) { cases.forEach { it.content() } }
            }
        }
        for (case in cases) {
            assertDots(compose.onNodeWithTag(case.tag).captureToImage().asAndroidBitmap(), case.rows, dotPx, colors, "${case.tag} $qualifier")
        }
    }

    @Test
    fun cardFrames() {
        // 二重線の枠（ADR-027）：外の線 1・すき間 1・内の線 1。内の線の角は階段にならない（外の階段 1 段より内側のため）。
        // borderGap と borderInnerWidth を 0 にしたテーマでは、今までどおり一重の枠になる
        RuntimeEnvironment.setQualifiers(qualifier)
        val c = theme.colors
        val colors = mapOf('B' to c.border, 'G' to c.background)
        val single = theme.copy(borderGap = 0, borderInnerWidth = 0)
        compose.setContent {
            Column(Modifier.background(PROBE_BG)) {
                DotwearTheme(theme) { DotwearCard(Modifier.testTag("double")) {} }
                DotwearTheme(single) { DotwearCard(Modifier.testTag("single")) {} }
            }
        }
        assertDots(compose.onNodeWithTag("double").captureToImage().asAndroidBitmap(), CARD_DOUBLE, dotPx, colors, "double $qualifier")
        assertDots(compose.onNodeWithTag("single").captureToImage().asAndroidBitmap(), CARD_SINGLE, dotPx, colors, "single $qualifier")
    }
}

/** 中身が 0 × 0 のカード（iOS の ComponentPixelTests と同じ絵）。外の線・すき間・内の線と、右下の影 */
private val CARD_DOUBLE = listOf(
    ".BBBBBBBBBB..",
    "BGGGGGGGGGGB.",
    "BGBBBBBBBBGBB",
) + List(6) { "BGBGGGGGGBGBB" } + listOf(
    "BGBBBBBBBBGBB",
    "BGGGGGGGGGGBB",
    ".BBBBBBBBBBBB",
    "..BBBBBBBBBB.",
)
private val CARD_SINGLE = listOf(".BBBBBBBBBB..", "BGGGGGGGGGGB.") + List(9) { "BGGGGGGGGGGBB" } + listOf(".BBBBBBBBBBBB", "..BBBBBBBBBB.")

/** 大きさを px で直接決める（dp を経由すると丸めで 1px ずれることがある） */
private fun Modifier.fixedPx(w: Int, h: Int) = layout { m, _ ->
    val p = m.measure(Constraints.fixed(w, h))
    layout(w, h) { p.place(0, 0) }
}
