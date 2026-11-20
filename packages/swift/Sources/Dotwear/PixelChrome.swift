// コンポーネントに共通の「ピクセル調の外装」：階段状の角の背景・枠線・影・フォーカスリングと、
// 大きさをドットの整数倍に揃えるレイアウト。各スタイル（Button / Toggle / TextField / Card）はこれを組み合わせて作る。
import SwiftUI

/// 子の大きさをドット（unit）の整数倍に切り上げるレイアウト。
/// 文字の大きさ（Dynamic Type）で中身の大きさが半端になっても、外装の辺がドットの格子からずれないようにするため。
/// 中身は提案に収まっているのに、切り上げたせいで提案を超えるときだけ切り捨てる（画面からはみ出さないように）。
/// 中身がもともと提案より大きいとき（親が高さ 0 などで大きさを試しに聞くとき）は切り捨てない。
/// 切り捨てると、カードなどが 1 ドットの高さに潰れてしまうため
struct DotSnap: Layout {
    let unit: CGFloat
    var minWidth: CGFloat = 0
    var minHeight: CGFloat = 0

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let child = subviews.first?.sizeThatFits(proposal) ?? .zero
        return CGSize(
            width: snap(max(child.width, minWidth), limit: proposal.width),
            height: snap(max(child.height, minHeight), limit: proposal.height)
        )
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        subviews.first?.place(at: CGPoint(x: bounds.midX, y: bounds.midY), anchor: .center, proposal: ProposedViewSize(bounds.size))
    }

    private func snap(_ value: CGFloat, limit: CGFloat?) -> CGFloat {
        // 浮動小数の誤差で 1 ドット余分に切り上げないよう、わずかに引いてから切り上げる
        let up = (value / unit - 1e-6).rounded(.up) * unit
        if let limit, limit.isFinite, value <= limit, up > limit {
            return max(unit, (limit / unit).rounded(.down) * unit)
        }
        return up
    }
}

/// 背景・枠線・影・フォーカスリング
struct PixelChrome: ViewModifier {
    let unit: CGFloat
    /// 背景の色。nil なら透明（ghost など）
    var fill: Color?
    var border: Color
    var borderWidth: Int
    var steps: Int
    /// 二重線の枠（ADR-027）：外の線と内の線のすき間・内の線の太さ（ドット数）。内の線が 0 なら一重の枠
    var innerGap = 0
    var innerWidth = 0
    /// 内の線の色。nil なら外の線と同じ色。塗りが枠と同じ色（primary など）のときは、反転した色にしないと線が見えない
    var innerColor: Color? = nil
    /// 影の色。nil なら影を描かない
    var shadow: Color?
    /// 影の分の場所（下と右に 1 ドット）を空けておくか。押したときに周りの配置が動かないように、影のある部品は常に空ける
    var reservesShadow: Bool
    var pressed = false
    /// フォーカスリングの色。nil なら描かない
    var focusRing: Color?

    func body(content: Content) -> some View {
        let shape = SteppedRectangle(steps: steps, unit: unit)
        content
            .background {
                if let fill { shape.fillCrisp(fill) }
            }
            .overlay {
                if borderWidth > 0 {
                    SteppedBorder(steps: steps, unit: unit, width: borderWidth).fillCrisp(border)
                }
            }
            .overlay {
                // 内の線は、外の線とすき間の分だけ内側に描く。角の段数もその分減らし、外の階段と平行にする
                if innerWidth > 0 {
                    let inset = borderWidth + innerGap
                    SteppedBorder(steps: max(0, steps - inset), unit: unit, width: innerWidth)
                        .fillCrisp(innerColor ?? border)
                        .padding(CGFloat(inset) * unit)
                }
            }
            .overlay {
                // 枠のすぐ外側に 1 ドット。角は 1 段多くして、枠の階段に沿わせる
                if let focusRing {
                    SteppedBorder(steps: steps + 1, unit: unit, width: 1).fillCrisp(focusRing).padding(-unit)
                }
            }
            .background {
                // 影は本体と同じ形を右下に 1 ドットずらして、本体の後ろに描く
                if let shadow, !pressed { shape.fillCrisp(shadow).offset(x: unit, y: unit) }
            }
            // 押したときは影を消して本体を 1 ドット沈める（button.md）
            .offset(y: pressed ? unit : 0)
            .padding(.trailing, reservesShadow ? unit : 0)
            .padding(.bottom, reservesShadow ? unit : 0)
    }
}

/// タップ領域を最低 44pt にする（見た目は小さくても領域は確保する。各コンポーネント仕様の 6 章）
struct MinimumHitArea: ViewModifier {
    func body(content: Content) -> some View {
        content
            .frame(minWidth: 44, minHeight: 44)
            .contentShape(Rectangle())
    }
}

/// キーボード操作のフォーカス（iOS 17 以降の isFocused）。iOS 16 では常に false
struct FocusReader<Content: View>: View {
    @ViewBuilder let content: (Bool) -> Content

    var body: some View {
        if #available(iOS 17.0, macOS 14.0, *) {
            Focused(content: content)
        } else {
            content(false)
        }
    }

    @available(iOS 17.0, macOS 14.0, *)
    private struct Focused: View {
        @Environment(\.isFocused) private var isFocused
        let content: (Bool) -> Content
        var body: some View { content(isFocused) }
    }
}
