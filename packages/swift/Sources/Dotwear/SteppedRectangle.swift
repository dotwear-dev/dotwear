// 角を階段状にした長方形。ボタンやカードの外形に使う。
//
//   steps = 1（unit ごとに 1 段）   steps = 2
//   .######.                      ..####..
//   ########                      .######.
//   ########                      ########
//   .######.                      .######.  …
//
// 1 段の大きさは unit（通常は DotwearTheme.pixelUnit）。角の頂点はすべて unit の整数倍なので、
// ビューの大きさがピクセルに揃っていれば、形の境界もすべてピクセルの境界に乗る。
// 塗るときは .fill(style: FillStyle(antialiased: false)) にして、境界を半透明にしない
import SwiftUI

public struct SteppedRectangle: InsettableShape {
    public var steps: Int
    public var unit: CGFloat
    private var insetAmount: CGFloat = 0

    public init(steps: Int, unit: CGFloat) {
        self.steps = max(0, steps)
        self.unit = unit
    }

    public func path(in rect: CGRect) -> Path {
        let r = rect.insetBy(dx: insetAmount, dy: insetAmount)
        guard r.width > 0, r.height > 0 else { return Path() }
        // 小さすぎて階段が入りきらないときは段数を減らす（左右・上下の角が重ならないように）
        let fit = Int(min(r.width, r.height) / (2 * unit))
        let s = min(steps, max(0, fit))
        var path = Path()
        path.addLines(Self.vertices(in: r, steps: s, unit: unit))
        path.closeSubpath()
        return path
    }

    public func inset(by amount: CGFloat) -> SteppedRectangle {
        var copy = self
        copy.insetAmount += amount
        return copy
    }

    /// 外周の頂点（画面の座標で時計回り）。左上の角の階段を作り、残りの 3 つの角は鏡に映して作る
    static func vertices(in r: CGRect, steps s: Int, unit u: CGFloat) -> [CGPoint] {
        // 左上：左の辺の (0, s) から、右へ 1 段・上へ 1 段を s 回くり返して、上の辺の (s, 0) へ
        var topLeft = [CGPoint(x: 0, y: CGFloat(s) * u)]
        for i in 0..<s {
            topLeft.append(CGPoint(x: CGFloat(i + 1) * u, y: CGFloat(s - i) * u))
            topLeft.append(CGPoint(x: CGFloat(i + 1) * u, y: CGFloat(s - i - 1) * u))
        }
        let w = r.width, h = r.height
        let corners = topLeft
            + topLeft.reversed().map { CGPoint(x: w - $0.x, y: $0.y) }        // 右上
            + topLeft.map { CGPoint(x: w - $0.x, y: h - $0.y) }                // 右下
            + topLeft.reversed().map { CGPoint(x: $0.x, y: h - $0.y) }        // 左下
        return corners.map { CGPoint(x: r.minX + $0.x, y: r.minY + $0.y) }
    }
}

/// SteppedRectangle の枠線だけの形。
/// stroke は線の中心が辺に乗るので、太さによっては境界が半ピクセルにずれてにじむ。
/// そこで「外形」と「width ドット内側の形」の差を偶奇規則で塗って枠線にする
public struct SteppedBorder: Shape {
    public var steps: Int
    public var unit: CGFloat
    /// 枠線の太さ（ドット数）
    public var width: Int

    public init(steps: Int, unit: CGFloat, width: Int) {
        self.steps = steps
        self.unit = unit
        self.width = width
    }

    public func path(in rect: CGRect) -> Path {
        var path = SteppedRectangle(steps: steps, unit: unit).path(in: rect)
        // 内側の形は枠線の太さぶん段数が減る（1 ドットの枠で 1 段の角なら、内側はただの長方形）
        let inner = SteppedRectangle(steps: max(0, steps - width), unit: unit)
            .inset(by: CGFloat(width) * unit)
            .path(in: rect)
        path.addPath(inner)
        return path
    }
}

extension Shape {
    /// アンチエイリアスなしで塗る（偶奇規則。SteppedBorder の穴を抜くため）
    public func fillCrisp<S: ShapeStyle>(_ style: S) -> some View {
        fill(style, style: FillStyle(eoFill: true, antialiased: false))
    }
}
