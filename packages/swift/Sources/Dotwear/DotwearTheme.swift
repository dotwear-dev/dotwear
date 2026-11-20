// テーマ：コンポーネントが使う色と寸法をまとめたもの。SwiftUI の環境値で配る。
//   ContentView().dotwearTheme()            既定のテーマ（デザイントークンの値）
//   ContentView().dotwearTheme(myTheme)     色などを差し替えたテーマ
// 寸法はドット数で持ち、実寸（pt）は dots(_:) で pixelUnit を掛けて求める。
// pixelUnit を整数にしておけば、どの寸法も整数 pt になり、@2x・@3x でも整数ピクセルになる
import SwiftUI

public struct DotwearTheme: Sendable, Hashable {
    public struct Colors: Sendable, Hashable {
        public var background: Color
        public var foreground: Color
        public var border: Color
        public var primary: Color
        public var onPrimary: Color
        public var danger: Color
        public var focus: Color
        public var disabled: Color

        public init(background: Color, foreground: Color, border: Color, primary: Color,
                    onPrimary: Color, danger: Color, focus: Color, disabled: Color) {
            self.background = background
            self.foreground = foreground
            self.border = border
            self.primary = primary
            self.onPrimary = onPrimary
            self.danger = danger
            self.focus = focus
            self.disabled = disabled
        }
    }

    public var colors: Colors
    /// 1 ドットの大きさ（pt）。整数だけ
    public let pixelUnit: Int
    /// 枠線の太さ（ドット数）
    public var borderWidth: Int
    /// 角の階段の段数
    public var cornerStep: Int
    /// 二重線の枠の、外の線と内の線のすき間（ドット数。ADR-027）。borderInnerWidth と一緒に 0 にすると一重の枠
    public var borderGap: Int
    /// 二重線の枠の、内の線の太さ（ドット数）。0 なら内の線を描かない
    public var borderInnerWidth: Int

    /// - Parameter pixelUnit: 1 以上の整数。小数を許すとマスの境界がにじむので Int にしている
    /// - Parameters borderGap, borderInnerWidth: 省略するとトークンの値（二重線の枠）。既存の呼び出しを壊さないように既定値を持たせる
    public init(colors: Colors, pixelUnit: Int, borderWidth: Int, cornerStep: Int,
                borderGap: Int = DotwearTokens.Shape.borderGap,
                borderInnerWidth: Int = DotwearTokens.Shape.borderInnerWidth) {
        precondition(pixelUnit >= 1, "pixelUnit は 1 以上の整数にしてください")
        self.colors = colors
        self.pixelUnit = pixelUnit
        self.borderWidth = max(0, borderWidth)
        self.cornerStep = max(0, cornerStep)
        self.borderGap = max(0, borderGap)
        self.borderInnerWidth = max(0, borderInnerWidth)
    }

    /// 外の線から内の線の内側までの幅（ドット数）。枠の中身はこれより内側に置く
    public var frameInset: Int {
        borderInnerWidth > 0 ? borderWidth + borderGap + borderInnerWidth : borderWidth
    }

    /// ドット数 → pt
    public func dots(_ count: Int) -> CGFloat {
        CGFloat(count * pixelUnit)
    }

    /// デザイントークン（tokens/*.json）の値で作ったテーマ
    public static let `default` = DotwearTheme(
        colors: Colors(
            background: DotwearTokens.Color.bg,
            foreground: DotwearTokens.Color.fg,
            border: DotwearTokens.Color.border,
            primary: DotwearTokens.Color.primary,
            onPrimary: DotwearTokens.Color.onPrimary,
            danger: DotwearTokens.Color.danger,
            focus: DotwearTokens.Color.focus,
            disabled: DotwearTokens.Color.disabled
        ),
        // トークンの pixel-unit は整数 px（Web のテストで保証している）。pt として使う
        pixelUnit: Int(DotwearTokens.Shape.pixelUnit),
        borderWidth: DotwearTokens.Shape.borderWidth,
        cornerStep: DotwearTokens.Shape.cornerStep,
        borderGap: DotwearTokens.Shape.borderGap,
        borderInnerWidth: DotwearTokens.Shape.borderInnerWidth
    )
}

private struct DotwearThemeKey: EnvironmentKey {
    static let defaultValue = DotwearTheme.default
}

extension EnvironmentValues {
    public var dotwearTheme: DotwearTheme {
        get { self[DotwearThemeKey.self] }
        set { self[DotwearThemeKey.self] = newValue }
    }
}

extension View {
    /// この中の Dotwear のコンポーネントが使うテーマを指定する（アプリのルートに付ければ全体に効く）。
    /// 標準の Text なども Dotwear の文字（DotGothic16。ADR-026）になるように、既定の文字も指定する。
    /// 一部だけ別の文字にしたいときは、その中で .font(...) を付ければ上書きできる
    public func dotwearTheme(_ theme: DotwearTheme = .default) -> some View {
        environment(\.dotwearTheme, theme)
            .font(DotwearFont.body)
    }
}
