// ボタンのスタイル（docs/components/button.md）。標準の Button に見た目だけを被せる。
//   Button("保存") { save() }.buttonStyle(.dotwear(.primary, size: .medium))
// VoiceOver・Dynamic Type・キーボード操作は標準の Button のまま効く
import SwiftUI

public struct DotwearButtonStyle: ButtonStyle {
    public enum Variant: Sendable, CaseIterable {
        case primary, secondary, danger, ghost
    }

    public enum Size: Sendable, CaseIterable {
        case small, medium, large
    }

    public var variant: Variant
    public var size: Size

    public init(_ variant: Variant = .primary, size: Size = .medium) {
        self.variant = variant
        self.size = size
    }

    public func makeBody(configuration: Configuration) -> some View {
        DotwearButtonBody(configuration: configuration, variant: variant, size: size)
    }
}

extension ButtonStyle where Self == DotwearButtonStyle {
    /// `.buttonStyle(.dotwear)`（primary・medium）
    public static var dotwear: DotwearButtonStyle { DotwearButtonStyle() }

    /// `.buttonStyle(.dotwear(.secondary, size: .small))`
    public static func dotwear(_ variant: DotwearButtonStyle.Variant = .primary,
                               size: DotwearButtonStyle.Size = .medium) -> DotwearButtonStyle {
        DotwearButtonStyle(variant, size: size)
    }
}

/// 寸法（ドット数。button.md の 4 章）
private struct ButtonMetrics {
    let height: Int
    let paddingX: Int
    let borderWidth: Int
    let steps: Int
    /// 外の線から内の線の内側までの幅（ドット数）
    let frameInset: Int

    init(_ size: DotwearButtonStyle.Size, theme: DotwearTheme) {
        switch size {
        case .small: (height, paddingX, borderWidth, steps) = (12, 4, theme.borderWidth, theme.cornerStep)
        case .medium: (height, paddingX, borderWidth, steps) = (16, 6, theme.borderWidth, theme.cornerStep)
        case .large: (height, paddingX, borderWidth, steps) = (20, 8, theme.borderWidth * 2, theme.cornerStep * 2)
        }
        frameInset = theme.borderInnerWidth > 0 ? borderWidth + theme.borderGap + theme.borderInnerWidth : borderWidth
    }
}

private struct DotwearButtonBody: View {
    let configuration: ButtonStyleConfiguration
    let variant: DotwearButtonStyle.Variant
    let size: DotwearButtonStyle.Size

    @Environment(\.dotwearTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.dotwearLoading) private var isLoading
    // 文字の大きさは Dynamic Type に合わせて伸び縮みさせる（基準はトークンの typography.label）
    @ScaledMetric(relativeTo: .body) private var fontSize = DotwearTokens.Typography.label

    var body: some View {
        let m = ButtonMetrics(size, theme: theme)
        let colors = self.colors
        FocusReader { focused in
            DotSnap(unit: theme.dots(1), minHeight: theme.dots(m.height)) {
                configuration.label
                    // ピクセルフォントは太字にしない（合成した太字はにじむ。ADR-026）
                    .font(DotwearFont.font(size: fontSize))
                    // 読み込み中は文字を見えなくして 3 つのドットを重ねる。幅を変えないように文字は残す
                    .opacity(isLoading ? 0 : 1)
                    .overlay { if isLoading { LoadingDots(unit: theme.dots(1), color: colors.foreground) } }
                    .padding(.horizontal, theme.dots(m.paddingX))
                    // 文字が二重線の内の線に重ならないよう、上下は枠の幅の分だけ空ける（高さは最小値より伸びることがある）
                    .padding(.vertical, theme.dots(m.frameInset))
            }
            .foregroundStyle(colors.foreground)
            .modifier(PixelChrome(
                unit: theme.dots(1),
                fill: colors.fill,
                border: colors.border,
                borderWidth: m.borderWidth,
                steps: m.steps,
                innerGap: theme.borderGap,
                innerWidth: theme.borderInnerWidth,
                innerColor: colors.inner,
                shadow: colors.hasShadow ? theme.colors.border : nil,
                reservesShadow: variant != .ghost,
                pressed: configuration.isPressed && isEnabled,
                focusRing: focused ? theme.colors.focus : nil
            ))
        }
        .modifier(MinimumHitArea())
    }

    // inner は二重線の内の線の色。塗りが枠と同じ濃い色（primary・danger）のときは文字と同じ色にして、線を見えるようにする
    private var colors: (fill: Color?, foreground: Color, border: Color, inner: Color?, hasShadow: Bool) {
        let c = theme.colors
        if !isEnabled { return (variant == .ghost ? nil : c.background, c.disabled, c.disabled, nil, false) }
        switch variant {
        case .primary: return (c.primary, c.onPrimary, c.border, c.onPrimary, true)
        case .secondary: return (c.background, c.foreground, c.border, nil, true)
        case .danger: return (c.danger, c.onPrimary, c.border, c.onPrimary, true)
        case .ghost: return (nil, c.foreground, c.border, nil, false)
        }
    }
}

/// 読み込み中の 3 つのドット。1 つずつ順に明るくする（なめらかに動かさず、コマ送りにする）
private struct LoadingDots: View {
    let unit: CGFloat
    let color: Color

    var body: some View {
        TimelineView(.periodic(from: .now, by: 0.25)) { context in
            let step = Int(context.date.timeIntervalSinceReferenceDate * 4) % 3
            HStack(spacing: unit * 2) {
                ForEach(0..<3, id: \.self) { i in
                    Rectangle().fill(color).frame(width: unit * 2, height: unit * 2).opacity(i == step ? 1 : 0.4)
                }
            }
        }
        .accessibilityHidden(true)
    }
}

private struct DotwearLoadingKey: EnvironmentKey {
    static let defaultValue = false
}

extension EnvironmentValues {
    public var dotwearLoading: Bool {
        get { self[DotwearLoadingKey.self] }
        set { self[DotwearLoadingKey.self] = newValue }
    }
}

extension View {
    /// 読み込み中の表示にする（ボタンの文字の代わりに 3 つのドット）。押せないようにはしないので、必要なら .disabled も付ける
    public func dotwearLoading(_ isLoading: Bool = true) -> some View {
        environment(\.dotwearLoading, isLoading)
    }
}
