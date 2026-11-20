// カード（docs/components/card.md）。見た目だけの入れ物で、読み上げの単位は変えない。
//   VStack { … }.dotwearCard()
//   VStack { … }.dotwearCard(.flat)
import SwiftUI

public struct DotwearCardModifier: ViewModifier {
    public enum Variant: Sendable, CaseIterable {
        /// 枠と影（既定）
        case outlined
        /// 枠のみ。カードの中にカードを置くときなど
        case flat
    }

    public var variant: Variant
    @Environment(\.dotwearTheme) private var theme

    public init(_ variant: Variant = .outlined) {
        self.variant = variant
    }

    public func body(content: Content) -> some View {
        DotSnap(unit: theme.dots(1)) {
            content.padding(theme.dots(6))
        }
        .modifier(PixelChrome(
            unit: theme.dots(1),
            fill: theme.colors.background,
            border: theme.colors.border,
            borderWidth: theme.borderWidth,
            steps: theme.cornerStep,
            // 内の線は内側の余白（6 ドット）の中に描くので、カードの大きさは変わらない
            innerGap: theme.borderGap,
            innerWidth: theme.borderInnerWidth,
            shadow: variant == .outlined ? theme.colors.border : nil,
            reservesShadow: variant == .outlined
        ))
    }
}

extension View {
    public func dotwearCard(_ variant: DotwearCardModifier.Variant = .outlined) -> some View {
        modifier(DotwearCardModifier(variant))
    }
}
