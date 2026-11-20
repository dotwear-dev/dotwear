// トグルのスタイル（docs/components/toggle.md）。標準の Toggle に見た目だけを被せる。
//   Toggle("Wi-Fi", isOn: $wifi).toggleStyle(.dotwear)               スイッチ
//   Toggle("同意する", isOn: $agree).toggleStyle(.dotwear(.checkbox))  チェックボックス
// 読み上げは accessibilityRepresentation で標準の Toggle と同じにする（「スイッチ、オン」など）
import SwiftUI

public struct DotwearToggleStyle: ToggleStyle {
    public enum Variant: Sendable, CaseIterable {
        case `switch`, checkbox
    }

    public var variant: Variant

    public init(_ variant: Variant = .switch) {
        self.variant = variant
    }

    public func makeBody(configuration: Configuration) -> some View {
        DotwearToggleBody(configuration: configuration, variant: variant)
    }
}

extension ToggleStyle where Self == DotwearToggleStyle {
    /// `.toggleStyle(.dotwear)`（スイッチ）
    public static var dotwear: DotwearToggleStyle { DotwearToggleStyle() }

    /// `.toggleStyle(.dotwear(.checkbox))`
    public static func dotwear(_ variant: DotwearToggleStyle.Variant) -> DotwearToggleStyle {
        DotwearToggleStyle(variant)
    }
}

private struct DotwearToggleBody: View {
    let configuration: ToggleStyleConfiguration
    let variant: DotwearToggleStyle.Variant

    @Environment(\.dotwearTheme) private var theme
    @ScaledMetric(relativeTo: .body) private var fontSize = DotwearTokens.Typography.label

    var body: some View {
        // 押している間の見た目（沈む）を出すために、内側は Button にする。ラベルを押しても切り替わる
        Button {
            configuration.isOn.toggle()
        } label: {
            configuration.label.font(DotwearFont.font(size: fontSize))
        }
        .buttonStyle(ToggleRowStyle(variant: variant, isOn: configuration.isOn, theme: theme))
        .accessibilityRepresentation {
            // 読み上げ用の見えない標準の Toggle。標準のスイッチの幅を取るので、長いラベルは 1 行に収まらない。
            // 折り返せるようにしておかないと、アクセシビリティ監査に「文字が切れる」と判定される
            Toggle(isOn: configuration.$isOn) {
                configuration.label.fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

private struct ToggleRowStyle: ButtonStyle {
    let variant: DotwearToggleStyle.Variant
    let isOn: Bool
    let theme: DotwearTheme

    func makeBody(configuration: Configuration) -> some View {
        Row(variant: variant, isOn: isOn, theme: theme, isPressed: configuration.isPressed, label: configuration.label)
    }

    private struct Row: View {
        let variant: DotwearToggleStyle.Variant
        let isOn: Bool
        let theme: DotwearTheme
        let isPressed: Bool
        let label: ButtonStyleConfiguration.Label
        @Environment(\.isEnabled) private var isEnabled

        var body: some View {
            FocusReader { focused in
                let control = ToggleControl(variant: variant, isOn: isOn, isEnabled: isEnabled,
                                            isPressed: isPressed && isEnabled, focused: focused, theme: theme)
                HStack(spacing: theme.dots(4)) {
                    switch variant {
                    case .switch:
                        // iOS の標準と同じく、ラベルが左、スイッチが右
                        label.frame(maxWidth: .infinity, alignment: .leading)
                        control
                    case .checkbox:
                        control
                        // スイッチと同じく、ラベルは残りの幅いっぱいに広げる（大きい文字で折り返せる場所を確保する）
                        label.frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                // チェックボックスも行の左に寄せる（タップ領域の枠の中で中央に寄らないように）
                .frame(maxWidth: .infinity, alignment: .leading)
                .foregroundStyle(isEnabled ? theme.colors.foreground : theme.colors.disabled)
            }
            .modifier(MinimumHitArea())
        }
    }
}

/// スイッチ・チェックボックスの本体（文字を含まないので、すべてドットの格子に乗る）
struct ToggleControl: View {
    let variant: DotwearToggleStyle.Variant
    let isOn: Bool
    let isEnabled: Bool
    let isPressed: Bool
    let focused: Bool
    let theme: DotwearTheme

    /// チェックの形（toggle.md。枠の内側 6 × 6 ドット）
    static let checkMark = [
        "......",
        ".....#",
        "....##",
        "#..##.",
        "####..",
        ".##...",
    ]

    var body: some View {
        let u = theme.dots(1)
        let c = theme.colors
        let (w, h) = variant == .switch ? (14, 8) : (8, 8)
        let fill = isOn ? (isEnabled ? c.primary : c.disabled) : c.background
        let mark = isEnabled ? (isOn ? c.onPrimary : c.border) : (isOn ? c.background : c.disabled)

        Canvas { context, _ in
            var path: Path
            switch variant {
            case .switch:
                // つまみは枠の内側いっぱいの 6 × 6。オフは左で線だけの四角、オンは右で塗りつぶし。
                // 4 階調では primary と border、onPrimary と background が同じ色なので、オフも塗りつぶすとオンと同じ絵になる（ADR-029）
                let x = isOn ? 7 : 1
                path = Path(CGRect(x: CGFloat(x) * u, y: u, width: 6 * u, height: 6 * u))
                if !isOn {
                    // 内側の 4 × 4 をくり抜く（偶奇規則で塗る）
                    path.addRect(CGRect(x: CGFloat(x + 1) * u, y: 2 * u, width: 4 * u, height: 4 * u))
                }
            case .checkbox:
                guard isOn else { return }
                var p = Path()
                for (y, row) in Self.checkMark.enumerated() {
                    for (x, ch) in row.enumerated() where ch == "#" {
                        p.addRect(CGRect(x: CGFloat(x + 1) * u, y: CGFloat(y + 1) * u, width: u, height: u))
                    }
                }
                path = p
            }
            context.fill(path, with: .color(mark), style: FillStyle(eoFill: true, antialiased: false))
        }
        .frame(width: theme.dots(w), height: theme.dots(h))
        .modifier(PixelChrome(
            unit: u,
            fill: fill,
            border: isEnabled ? c.border : c.disabled,
            borderWidth: theme.borderWidth,
            steps: theme.cornerStep,
            shadow: isEnabled ? c.border : nil,
            reservesShadow: true,
            pressed: isPressed,
            focusRing: focused ? c.focus : nil
        ))
    }
}
