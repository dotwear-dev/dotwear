// 見た目のスナップショット（swift-snapshot-testing）。iOS シミュレーターだけで撮る。
// にじみの有無は PixelRoundtripTests が厳密に確かめるので、こちらは「見た目が意図せず変わっていないか」に気づくための補助
// （Web の toHaveScreenshot と同じ位置づけ。ADR-016）。
// 撮り直すときは環境変数 SNAPSHOT_TESTING_RECORD=all を付けて実行する
#if os(iOS)
import SnapshotTesting
import SwiftUI
import XCTest
@testable import DotwearIcons

@MainActor
final class SnapshotTests: XCTestCase {
    /// すべてのアイコンを 2 倍で並べた一覧。default と retroGreen のパレットで撮る
    private func gallery(_ palette: DotwearPalette) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(DotwearIconDefinition.allIcons) { icon in
                HStack(spacing: 8) {
                    DotwearIcon(icon, scale: 2)
                    DotwearIcon(icon, scale: 2, grid: .grid24)
                }
            }
        }
        .padding(8)
        .foregroundStyle(Color(.sRGB, red: 0x1f / 255, green: 0x1f / 255, blue: 0x24 / 255, opacity: 1))
        .background(Color.white)
        .dotwearPalette(palette)
    }

    func testGallery() {
        for (paletteName, palette) in [("default", DotwearPalette.default), ("retroGreen", DotwearPalette.retroGreen)] {
            for displayScale in [2.0, 3.0] {
                assertSnapshot(
                    of: gallery(palette),
                    as: .image(precision: 1, layout: .sizeThatFits, traits: .init(displayScale: displayScale)),
                    named: "\(paletteName)@\(Int(displayScale))x"
                )
            }
        }
    }
}
#endif
