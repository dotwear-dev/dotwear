// カード（docs/components/card.md）。見た目だけの入れ物で、読み上げの単位は変えない。
//   DotwearCard { Text("今月の売上") }
//   DotwearCard(variant = DotwearCardVariant.Flat) { … }
package dev.dotwear.compose

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.LocalContentColor
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier

enum class DotwearCardVariant {
    /** 枠と影（既定） */
    Outlined,

    /** 枠のみ。カードの中にカードを置くときなど */
    Flat,
}

@Composable
fun DotwearCard(
    modifier: Modifier = Modifier,
    variant: DotwearCardVariant = DotwearCardVariant.Outlined,
    content: @Composable ColumnScope.() -> Unit,
) {
    val theme = Dotwear.theme
    val c = theme.colors
    CompositionLocalProvider(LocalContentColor provides c.foreground) {
        Column(
            modifier
                .dotwearChrome(
                    ChromeStyle(
                        fill = c.background,
                        border = c.border,
                        borderWidth = theme.borderWidth,
                        steps = theme.cornerStep,
                        shadow = if (variant == DotwearCardVariant.Outlined) c.border else null,
                        reservesShadow = variant == DotwearCardVariant.Outlined,
                        innerGap = theme.borderGap,
                        innerWidth = theme.borderInnerWidth,
                    ),
                )
                // 余白は二重線の枠の外側から 6 ドットのまま（カードの大きさを変えない。card.md）
                .padding(Dotwear.dots(6)),
            content = content,
        )
    }
}
