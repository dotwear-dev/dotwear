// ボタン（docs/components/button.md）。標準の clickable（役割は Role.Button）に見た目だけを被せる。
// 最低 48dp のタップ領域（minimumInteractiveComponentSize）・キーボード操作・TalkBack は標準のまま効く。
// Material の Surface は中身を形で切り抜くので、外にはみ出す影とフォーカスリングが欠ける。そのため使わない。
// 押したときは波紋を出さず、本体が 1 ドット沈む（ドット絵らしい動きに合わせる。button.md）
//   DotwearButton(onClick = ::save, variant = DotwearButtonVariant.Primary) { Text("保存") }
package dev.dotwear.compose

import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.dotwear.icons.LocalDotwearIconColor
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Spacer
import kotlinx.coroutines.delay

enum class DotwearButtonVariant { Primary, Secondary, Danger, Ghost }

enum class DotwearButtonSize(
    internal val height: Int,
    internal val paddingX: Int,
    internal val borderScale: Int,
    internal val gap: Int,
) {
    Small(12, 4, 1, 2),
    Medium(16, 6, 1, 3),
    Large(20, 8, 2, 4),
}

/**
 * @param loading 読み込み中の表示（文字の代わりに 3 つのドット）。押せないようにはしないので、必要なら enabled も false にする
 */
@Composable
fun DotwearButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: DotwearButtonVariant = DotwearButtonVariant.Primary,
    size: DotwearButtonSize = DotwearButtonSize.Medium,
    enabled: Boolean = true,
    loading: Boolean = false,
    interactionSource: MutableInteractionSource? = null,
    content: @Composable RowScope.() -> Unit,
) {
    val source = interactionSource ?: remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val focused by source.collectIsFocusedAsState()
    val theme = Dotwear.theme
    val c = theme.colors
    val (fill, fg, border) = when {
        !enabled -> Triple(if (variant == DotwearButtonVariant.Ghost) null else c.background, c.disabled, c.disabled)
        variant == DotwearButtonVariant.Primary -> Triple(c.primary, c.onPrimary, c.border)
        variant == DotwearButtonVariant.Secondary -> Triple(c.background, c.foreground, c.border)
        variant == DotwearButtonVariant.Danger -> Triple(c.danger, c.onPrimary, c.border)
        else -> Triple(null, c.foreground, c.border)
    }
    val hasShadow = enabled && variant != DotwearButtonVariant.Ghost
    // 黒く塗ったボタン（Primary・Danger）では、内の線を文字と同じ色にして地の上で見えるようにする（button.md）
    val innerColor = if (enabled && (variant == DotwearButtonVariant.Primary || variant == DotwearButtonVariant.Danger)) c.onPrimary else null
    val outerWidth = theme.borderWidth * size.borderScale

    Box(
        modifier
            .minimumInteractiveComponentSize()
            .clickable(
                interactionSource = source,
                indication = null,
                enabled = enabled,
                role = Role.Button,
                onClick = onClick,
            ),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            Modifier
                .dotwearChrome(
                    ChromeStyle(
                        fill = fill,
                        border = border,
                        borderWidth = outerWidth,
                        steps = theme.cornerStep * size.borderScale,
                        shadow = if (hasShadow) c.border else null,
                        reservesShadow = variant != DotwearButtonVariant.Ghost,
                        pressed = pressed && enabled,
                        focusRing = if (focused) c.focus else null,
                        innerGap = theme.borderGap,
                        innerWidth = theme.borderInnerWidth,
                        innerColor = innerColor,
                    ),
                )
                .defaultMinSize(minHeight = Dotwear.dots(size.height))
                // 上下は二重線の枠の厚さだけ空け、文字が内の線に重ならないようにする（そのため Small は少し高くなる）
                .padding(horizontal = Dotwear.dots(size.paddingX), vertical = Dotwear.dots(theme.frameInset(outerWidth))),
            contentAlignment = Alignment.Center,
        ) {
            CompositionLocalProvider(
                LocalContentColor provides fg,
                LocalDotwearIconColor provides fg,
                // 太字にしない（ピクセルフォントの太字は合成になり、にじむため。ADR-026）
                LocalTextStyle provides MaterialTheme.typography.labelLarge.copy(fontSize = DotwearTokens.Typography.Label.sp, fontWeight = FontWeight.Normal),
            ) {
                // 読み込み中は文字を見えなくして 3 つのドットを重ねる。幅を変えないように文字は残す
                Row(
                    Modifier.alpha(if (loading) 0f else 1f),
                    horizontalArrangement = Arrangement.spacedBy(Dotwear.dots(size.gap)),
                    verticalAlignment = Alignment.CenterVertically,
                    content = content,
                )
                if (loading) LoadingDots(fg)
            }
        }
    }
}

/** 読み込み中の 3 つのドット。1 つずつ順に明るくする（なめらかに動かさず、コマ送りにする） */
@Composable
private fun LoadingDots(color: Color) {
    var step by remember { mutableIntStateOf(0) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(250)
            step = (step + 1) % 3
        }
    }
    Row(Modifier.clearAndSetSemantics { }, horizontalArrangement = Arrangement.spacedBy(Dotwear.dots(2))) {
        repeat(3) { i ->
            Spacer(Modifier.size(Dotwear.dots(2)).alpha(if (i == step) 1f else 0.4f).background(color))
        }
    }
}
