// 多色アイコンのパレット（スロット 2〜9 の色）。テーマは Generated/Palette.swift の static プロパティ（.default など）。
// SwiftUI の環境値で配るので、画面の一部だけテーマを変えることもできる：
//   SomeView().dotwearPalette(.retroGreen)
import SwiftUI

public struct DotwearPalette: Sendable, Hashable {
    /// スロット（2〜9）→ 色
    public var colors: [Int: Color]

    public init(colors: [Int: Color]) {
        self.colors = colors
    }

    /// 生成コード用。0xRRGGBB の整数から作る（sRGB）
    init(hex: [Int: UInt32]) {
        self.colors = hex.mapValues { value in
            Color(
                .sRGB,
                red: Double((value >> 16) & 0xff) / 255,
                green: Double((value >> 8) & 0xff) / 255,
                blue: Double(value & 0xff) / 255,
                opacity: 1
            )
        }
    }

    public subscript(slot: Int) -> Color? {
        colors[slot]
    }
}

private struct DotwearPaletteKey: EnvironmentKey {
    static let defaultValue = DotwearPalette.default
}

extension EnvironmentValues {
    public var dotwearPalette: DotwearPalette {
        get { self[DotwearPaletteKey.self] }
        set { self[DotwearPaletteKey.self] = newValue }
    }
}

extension View {
    /// この中の DotwearIcon が使うパレットを変える
    public func dotwearPalette(_ palette: DotwearPalette) -> some View {
        environment(\.dotwearPalette, palette)
    }
}
