// スイッチとチェックボックス（docs/components/toggle.md）。標準の toggleable（役割は Role.Switch / Role.Checkbox）に
// 見た目だけを被せる。TalkBack は「スイッチ、オン」のように標準と同じに読み上げる。
//   DotwearSwitch(checked = wifi, onCheckedChange = { wifi = it }, label = { Text("Wi-Fi") })
//   DotwearCheckbox(checked = agree, onCheckedChange = { agree = it }, label = { Text("同意する") })
// label を渡すと、ラベルを含めた行全体が 1 つのトグルになる（押す場所も読み上げも 1 つ）
package dev.dotwear.compose

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.selection.toggleable
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.layout.layout
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.sp

enum class DotwearToggleVariant { Switch, Checkbox }

@Composable
fun DotwearSwitch(
    checked: Boolean,
    onCheckedChange: ((Boolean) -> Unit)?,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    label: (@Composable () -> Unit)? = null,
) = DotwearToggle(DotwearToggleVariant.Switch, checked, onCheckedChange, modifier, enabled, label)

@Composable
fun DotwearCheckbox(
    checked: Boolean,
    onCheckedChange: ((Boolean) -> Unit)?,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    label: (@Composable () -> Unit)? = null,
) = DotwearToggle(DotwearToggleVariant.Checkbox, checked, onCheckedChange, modifier, enabled, label)

@Composable
private fun DotwearToggle(
    variant: DotwearToggleVariant,
    checked: Boolean,
    onCheckedChange: ((Boolean) -> Unit)?,
    modifier: Modifier,
    enabled: Boolean,
    label: (@Composable () -> Unit)?,
) {
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val focused by source.collectIsFocusedAsState()
    val c = Dotwear.colors
    val toggleModifier = if (onCheckedChange != null) {
        Modifier
            .minimumInteractiveComponentSize()
            .toggleable(
                value = checked,
                interactionSource = source,
                indication = null,
                enabled = enabled,
                role = if (variant == DotwearToggleVariant.Switch) Role.Switch else Role.Checkbox,
                onValueChange = onCheckedChange,
            )
    } else {
        Modifier
    }
    val control = @Composable {
        DotwearToggleControl(variant, checked, enabled, pressed = pressed && enabled, focused = focused)
    }
    if (label == null) {
        Box(modifier.then(toggleModifier), contentAlignment = Alignment.Center) { control() }
        return
    }
    CompositionLocalProvider(
        LocalContentColor provides if (enabled) c.foreground else c.disabled,
        LocalTextStyle provides MaterialTheme.typography.bodyLarge.copy(fontSize = DotwearTokens.Typography.Label.sp),
    ) {
        Row(
            modifier.then(toggleModifier).fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(Dotwear.dots(4)),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            when (variant) {
                // Android の設定画面と同じく、ラベルが左、スイッチが右
                DotwearToggleVariant.Switch -> {
                    Box(Modifier.weight(1f)) { label() }
                    control()
                }
                DotwearToggleVariant.Checkbox -> {
                    control()
                    Box(Modifier.weight(1f)) { label() }
                }
            }
        }
    }
}

/** チェックの形（toggle.md。枠の内側 6 × 6 ドット） */
internal val CHECK_MARK = listOf(
    "......",
    ".....#",
    "....##",
    "#..##.",
    "####..",
    ".##...",
)

/** スイッチ・チェックボックスの本体（文字を含まないので、すべてドットの格子に乗る） */
@Composable
internal fun DotwearToggleControl(
    variant: DotwearToggleVariant,
    checked: Boolean,
    enabled: Boolean,
    pressed: Boolean,
    focused: Boolean,
    modifier: Modifier = Modifier,
) {
    val theme = Dotwear.theme
    val c = theme.colors
    val unitPx = Dotwear.dotPx
    val (w, h) = if (variant == DotwearToggleVariant.Switch) 14 to 8 else 8 to 8
    val fill = if (checked) (if (enabled) c.primary else c.disabled) else c.background
    val mark = if (enabled) (if (checked) c.onPrimary else c.border) else (if (checked) c.background else c.disabled)

    Canvas(
        modifier
            .dotwearChrome(
                ChromeStyle(
                    fill = fill,
                    border = if (enabled) c.border else c.disabled,
                    borderWidth = theme.borderWidth,
                    steps = theme.cornerStep,
                    shadow = if (enabled) c.border else null,
                    reservesShadow = true,
                    pressed = pressed,
                    focusRing = if (focused) c.focus else null,
                ),
            )
            // 大きさを px で直接決める（dp を経由すると丸めでずれることがある）
            .layout { m, _ ->
                val p = m.measure(Constraints.fixed(w * unitPx, h * unitPx))
                layout(p.width, p.height) { p.place(0, 0) }
            },
    ) {
        val u = unitPx.toFloat()
        when (variant) {
            DotwearToggleVariant.Switch -> {
                // つまみは枠の内側いっぱいの 6 × 6。オフは左で線だけの四角、オンは右で塗りつぶし。
                // 4 階調では primary と border、onPrimary と background が同じ色なので、オフも塗りつぶすとオンと同じ絵になる（ADR-029）
                val x = if (checked) 7 else 1
                drawRect(mark, Offset(x * u, u), Size(6 * u, 6 * u))
                // 線の幅を Stroke で描くと線の中心が境界に乗ってにじむので、内側を地の色の矩形で塗り直す
                if (!checked) drawRect(fill, Offset((x + 1) * u, 2 * u), Size(4 * u, 4 * u))
            }
            DotwearToggleVariant.Checkbox -> if (checked) {
                CHECK_MARK.forEachIndexed { y, row ->
                    row.forEachIndexed { x, ch ->
                        if (ch == '#') drawRect(mark, Offset((x + 1) * u, (y + 1) * u), Size(u, u))
                    }
                }
            }
        }
    }
}
