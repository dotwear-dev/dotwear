// テスト用の共通処理：ビューを指定の倍率でラスタライズし、RGBA のピクセルとして読む。
// DotwearIconsTests と DotwearTests の両方で使うので、テスト専用のターゲットに置く（プロダクトには含めない）
import CoreGraphics
import DotwearIcons
import SwiftUI

public struct Pixel: Equatable, Sendable {
    public var r: UInt8, g: UInt8, b: UInt8, a: UInt8
}

public struct Raster {
    public let width: Int
    public let height: Int
    public let pixels: [Pixel]

    public subscript(x: Int, y: Int) -> Pixel { pixels[y * width + x] }

    /// 色の空間の変換で ±数の誤差が出ることがあるので、色は許容幅を持たせて比べる。透明度は 0 か 255 のどちらかでなければならない
    public func matches(_ p: Pixel, _ q: Pixel) -> Bool {
        p.a == q.a && (p.a == 0 || (abs(Int(p.r) - Int(q.r)) <= 3 && abs(Int(p.g) - Int(q.g)) <= 3 && abs(Int(p.b) - Int(q.b)) <= 3))
    }
}

@MainActor
/// - Parameter proposedSize: 親から提案する大きさ。既定は「指定なし」。
///   スナップショット（swift-snapshot-testing の sizeThatFits）は 0 × 0 を提案するので、それを再現したいときに .zero を渡す
public func rasterize(_ view: some View, displayScale: CGFloat, proposedSize: ProposedViewSize = .unspecified) -> Raster {
    let renderer = ImageRenderer(content: view)
    renderer.scale = displayScale
    renderer.proposedSize = proposedSize
    let image = renderer.cgImage!
    let w = image.width, h = image.height
    var data = [UInt8](repeating: 0, count: w * h * 4)
    // sRGB・非乗算に近い形で読むため、premultipliedLast の sRGB コンテキストに描き直す（不透明か透明かだけなので乗算の影響はない）
    let ctx = CGContext(
        data: &data, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
        space: CGColorSpace(name: CGColorSpace.sRGB)!,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )!
    ctx.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))
    let pixels = stride(from: 0, to: data.count, by: 4).map { Pixel(r: data[$0], g: data[$0 + 1], b: data[$0 + 2], a: data[$0 + 3]) }
    return Raster(width: w, height: h, pixels: pixels)
}

/// マス目の文字ごとに見分けやすい色（プローブ）。描いた結果の色から、どの文字のマスかを判定する
public enum Probe {
    public static let foreground = Pixel(r: 255, g: 0, b: 0, a: 255)
    public static func slot(_ n: Int) -> Pixel { Pixel(r: 0, g: UInt8(n * 25), b: 255, a: 255) }
    public static let transparent = Pixel(r: 0, g: 0, b: 0, a: 0)

    public static var palette: DotwearPalette {
        DotwearPalette(colors: Dictionary(uniqueKeysWithValues: (2...9).map { n in
            let p = slot(n)
            return (n, Color(.sRGB, red: Double(p.r) / 255, green: Double(p.g) / 255, blue: Double(p.b) / 255, opacity: 1))
        }))
    }

    public static func expected(_ ch: Character) -> Pixel {
        switch ch {
        case ".": transparent
        case "#": foreground
        default: slot(Int(String(ch))!)
        }
    }
}

/// 元データの色のスロットをプローブの色に置き換えて描く
@MainActor
public func probeIcon(_ icon: DotwearIconDefinition, grid: DotwearIconGrid, scale: Int) -> some View {
    DotwearIcon(icon, scale: scale, grid: grid)
        .foregroundStyle(Color(.sRGB, red: 1, green: 0, blue: 0, opacity: 1))
        .dotwearPalette(Probe.palette)
}
