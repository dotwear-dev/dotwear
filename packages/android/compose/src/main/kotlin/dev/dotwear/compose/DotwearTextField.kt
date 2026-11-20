// 入力欄（docs/components/text-field.md）。標準の BasicTextField に見た目だけを被せる。
// 文字の入力・変換（IME）・選択・カーソル操作は標準のまま。エラーは semantics の error として TalkBack に伝える。
//   DotwearTextField(value = email, onValueChange = { email = it }, label = "メール", error = emailError)
package dev.dotwear.compose

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * @param label 入力欄の名前。見た目には上に出し、TalkBack でも読み上げる
 * @param error エラーの説明。null ならエラーなし。枠を赤くし、下に説明を出す
 */
@Composable
fun DotwearTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    error: String? = null,
    enabled: Boolean = true,
    singleLine: Boolean = true,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    visualTransformation: VisualTransformation = VisualTransformation.None,
) {
    val theme = Dotwear.theme
    val c = theme.colors
    val source = remember { MutableInteractionSource() }
    val focused by source.collectIsFocusedAsState()
    val textStyle = MaterialTheme.typography.bodyLarge.copy(
        fontSize = DotwearTokens.Typography.Body.sp,
        color = if (enabled) c.foreground else c.disabled,
    )

    Column(modifier, verticalArrangement = Arrangement.spacedBy(Dotwear.dots(2))) {
        // 見た目のラベル。読み上げは入力欄のほうで行うので、ここは読み上げない
        // ラベルとエラーの説明も本文と同じ大きさにする（16sp の整数倍でないと文字がにじむため。ADR-026）
        Text(label, style = textStyle, color = c.foreground, modifier = Modifier.clearAndSetSemantics { })
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            enabled = enabled,
            singleLine = singleLine,
            textStyle = textStyle,
            cursorBrush = SolidColor(c.foreground),
            keyboardOptions = keyboardOptions,
            visualTransformation = visualTransformation,
            interactionSource = source,
            modifier = Modifier
                .fillMaxWidth()
                // タップ領域は最低 48dp（見た目の枠は 16 ドット）
                .heightIn(min = 48.dp)
                .semantics {
                    contentDescription = label
                    if (error != null) error(error)
                },
            decorationBox = { inner ->
                Box(
                    Modifier
                        .dotwearChrome(
                            ChromeStyle(
                                fill = c.background,
                                border = when {
                                    error != null -> c.danger
                                    enabled -> c.border
                                    else -> c.disabled
                                },
                                borderWidth = theme.borderWidth,
                                steps = theme.cornerStep,
                                shadow = null,
                                reservesShadow = false,
                                // 入力中はフォーカスリング。枠の太さは変えない（文字の位置がずれないように）
                                focusRing = if (focused) c.focus else null,
                                innerGap = theme.borderGap,
                                innerWidth = theme.borderInnerWidth,
                            ),
                        )
                        .fillMaxWidth()
                        .heightIn(min = Dotwear.dots(16))
                        // 文字は内の線から 4 ドット離す（text-field.md）。上下も二重線の枠の厚さだけ空ける
                        .padding(
                            horizontal = Dotwear.dots(theme.frameInset - theme.borderWidth + 4),
                            vertical = Dotwear.dots(theme.frameInset),
                        ),
                    contentAlignment = Alignment.CenterStart,
                ) {
                    if (value.isEmpty() && placeholder != null) {
                        Text(placeholder, style = textStyle.copy(color = c.disabled), modifier = Modifier.clearAndSetSemantics { })
                    }
                    inner()
                }
            },
        )
        if (error != null) {
            // 入力欄の error として読み上げるので、ここは二重に読まない
            Text(error, color = c.danger, style = textStyle.copy(color = c.danger), modifier = Modifier.clearAndSetSemantics { })
        }
    }
}
