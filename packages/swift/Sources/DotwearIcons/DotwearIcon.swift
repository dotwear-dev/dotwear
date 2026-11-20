// アイコンを描くビュー。`DotwearIcon(.save, scale: 2)`（ADR-013）
//
// ピクセルパーフェクトのための決まり：
//   - 倍率は Int だけ。1 マス = scale pt なので、@2x・@3x の画面でも 1 マスは必ず整数ピクセルになる
//   - 塗りはアンチエイリアスを切る（Web の shape-rendering="crispEdges" に相当）。
//     万一ビューが小数の位置に置かれても、マスの境界が半透明ににじまないようにするため
import SwiftUI

public struct DotwearIcon: View {
    private let icon: DotwearIconDefinition
    private let scale: Int
    private let grid: DotwearIconGrid
    private let label: Text?

    @Environment(\.dotwearPalette) private var palette

    /// - Parameters:
    ///   - icon: アイコン（`.save` など）
    ///   - scale: 表示倍率。整数だけ（16 のグリッドなら 1 → 16pt、2 → 32pt）。1 未満は 1 にする
    ///   - grid: 使うグリッド。描き分けがないときは 16 を使う
    ///   - label: VoiceOver で読み上げる名前。省略すると装飾として読み上げから外す
    public init(_ icon: DotwearIconDefinition, scale: Int = 1, grid: DotwearIconGrid = .grid16, label: Text? = nil) {
        self.icon = icon
        self.scale = max(1, scale)
        self.grid = grid
        self.label = label
    }

    public var body: some View {
        let (actualGrid, layers) = icon.layers(for: grid)
        let side = CGFloat(actualGrid.rawValue * scale)
        let cell = CGFloat(scale)
        let palette = self.palette

        Canvas { context, _ in
            for layer in layers {
                let shading: GraphicsContext.Shading
                switch layer.color {
                case .foreground:
                    // .foregroundStyle(...) で指定した色（指定がなければ文字色）
                    shading = .foreground
                case .palette(let slot):
                    // パレットに色がないスロットは描かない（生成時に検査しているので、利用者が独自のパレットを渡したときだけ起きる）
                    guard let color = palette[slot] else { continue }
                    shading = .color(color)
                }
                context.fill(Self.path(layer.rects, cell: cell), with: shading, style: FillStyle(antialiased: false))
            }
        }
        .frame(width: side, height: side)
        .modifier(IconAccessibility(label: label))
    }

    static func path(_ rects: [DotwearIconRect], cell: CGFloat) -> Path {
        var path = Path()
        for r in rects {
            path.addRect(CGRect(
                x: CGFloat(r.x) * cell,
                y: CGFloat(r.y) * cell,
                width: CGFloat(r.width) * cell,
                height: CGFloat(r.height) * cell
            ))
        }
        return path
    }
}

/// ラベルがあれば画像として読み上げ、なければ読み上げから外す（Web の role="img" / aria-hidden と同じ考え方）
private struct IconAccessibility: ViewModifier {
    let label: Text?

    func body(content: Content) -> some View {
        if let label {
            content
                .accessibilityElement()
                .accessibilityLabel(label)
                .accessibilityAddTraits(.isImage)
        } else {
            content.accessibilityHidden(true)
        }
    }
}
