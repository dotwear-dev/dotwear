// テーマ：コンポーネントが使う色と寸法。CompositionLocal で配り、同時に MaterialTheme の色と形も差し替える。
//   DotwearTheme { App() }
// 寸法はドット数で持ち、実寸は dotPx（1 ドットの整数ピクセル）を掛けて求める。
// 1 ドットは「pixelUnit（dp）× 画面の倍率」を切り捨てた整数ピクセル（ADR-019）。端数の倍率の端末でもにじまない
package dev.dotwear.compose

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import dev.dotwear.icons.LocalDotwearIconColor
import dev.dotwear.icons.dotwearCellPx

@Immutable
data class DotwearColors(
    val background: Color = DotwearTokens.Color.Bg,
    val foreground: Color = DotwearTokens.Color.Fg,
    val border: Color = DotwearTokens.Color.Border,
    val primary: Color = DotwearTokens.Color.Primary,
    val onPrimary: Color = DotwearTokens.Color.OnPrimary,
    val danger: Color = DotwearTokens.Color.Danger,
    val focus: Color = DotwearTokens.Color.Focus,
    val disabled: Color = DotwearTokens.Color.Disabled,
)

@Immutable
data class DotwearThemeValues(
    val colors: DotwearColors = DotwearColors(),
    /** 1 ドットの大きさ（dp）。整数だけ */
    val pixelUnit: Int = DotwearTokens.Shape.PixelUnit,
    /** 枠線の太さ（ドット数） */
    val borderWidth: Int = DotwearTokens.Shape.BorderWidth,
    /** 二重線の枠の、外の線と内の線のすき間（ドット数）。ADR-027 */
    val borderGap: Int = DotwearTokens.Shape.BorderGap,
    /** 二重線の枠の、内の線の太さ（ドット数）。0 なら一重の枠 */
    val borderInnerWidth: Int = DotwearTokens.Shape.BorderInnerWidth,
    /** 角の階段の段数 */
    val cornerStep: Int = DotwearTokens.Shape.CornerStep,
) {
    init {
        require(pixelUnit >= 1) { "pixelUnit は 1 以上の整数にしてください" }
        require(borderGap >= 0 && borderInnerWidth >= 0) { "borderGap と borderInnerWidth は 0 以上にしてください" }
    }

    /** 枠の外側から、内の線の内側までの厚さ（ドット数）。中身がここより内側に来るように余白をとる */
    val frameInset: Int
        get() = frameInset(borderWidth)

    /** 外の線の太さが borderWidth と違うとき（大きいボタンなど）の frameInset */
    internal fun frameInset(outerWidth: Int): Int =
        if (borderInnerWidth > 0) outerWidth + borderGap + borderInnerWidth else outerWidth
}

val LocalDotwearTheme = staticCompositionLocalOf { DotwearThemeValues() }

/** 今のテーマの値（MaterialTheme.colorScheme と同じ使い方） */
object Dotwear {
    val theme: DotwearThemeValues
        @Composable get() = LocalDotwearTheme.current

    val colors: DotwearColors
        @Composable get() = LocalDotwearTheme.current.colors

    /** 1 ドットの整数ピクセル */
    val dotPx: Int
        @Composable get() = dotwearCellPx(LocalDotwearTheme.current.pixelUnit, LocalDensity.current.density)

    /** n ドット → dp。整数ピクセルから戻すので、dp → px の丸めでずれない */
    @Composable
    fun dots(n: Int): Dp = with(LocalDensity.current) { (n * dotPx).toDp() }
}

@Composable
fun DotwearTheme(theme: DotwearThemeValues = DotwearThemeValues(), content: @Composable () -> Unit) {
    val c = theme.colors
    // Material の部品（ダイアログ・メニューなど）を一緒に使っても色がそろうように、MaterialTheme も差し替える
    val scheme = lightColorScheme(
        primary = c.primary,
        onPrimary = c.onPrimary,
        background = c.background,
        onBackground = c.foreground,
        surface = c.background,
        onSurface = c.foreground,
        error = c.danger,
        outline = c.border,
    )
    // 形（MaterialTheme.shapes）は差し替えない。Material 3 の Shapes は角を丸める形（CornerBasedShape）しか
    // 受け付けず、階段状の角を入れられないため。Dotwear の部品は SteppedCornerShape を自分で使う
    // 文字は Material の大きさのまま、書体を同梱の DotGothic16 にする（アプリ全体の Text も同じ書体になる。ADR-026）
    MaterialTheme(colorScheme = scheme, typography = MaterialTheme.typography.withDotwearFont()) {
        CompositionLocalProvider(
            LocalDotwearTheme provides theme,
            // DotwearIcon の既定の色（# のマス）を文字色に合わせる
            LocalDotwearIconColor provides c.foreground,
            content = content,
        )
    }
}
