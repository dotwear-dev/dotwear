// Swift 版の pixel-roundtrip（CLAUDE.md の最重要テスト）。
// 生成した定義を DotwearIcon で描き、元データのマス目と 1 ピクセル単位で一致することを確かめる。
// 1 マスは scale × 画面の倍率 ピクセルの正方形で、中はすべて同じ色、境界に半透明のピクセルがないこと
import SwiftUI
import DotwearTestSupport
import XCTest
@testable import DotwearIcons

@MainActor
final class PixelRoundtripTests: XCTestCase {
    func testEveryIconMatchesItsSourceGrid() {
        XCTAssertFalse(sourceGrids.isEmpty)
        // 画面の倍率 1・2・3（@1x〜@3x）と、表示倍率 1・2 の組み合わせ
        for displayScale in [1, 2, 3] {
            for scale in [1, 2] {
                for (icon, grid, rows) in sourceGrids {
                    let raster = rasterize(probeIcon(icon, grid: grid, scale: scale), displayScale: CGFloat(displayScale))
                    assertMatches(raster, rows: rows, cellPx: scale * displayScale, at: (0, 0),
                                  "\(icon.name) grid\(grid.rawValue) scale\(scale) @\(displayScale)x")
                }
            }
        }
    }

    /// 小数の位置に置かれても境界がにじまないこと。
    /// 0.25pt・0.3pt ずらして描き（@2x で 0.5px・0.6px）、半透明のピクセルがなく、
    /// どこかの整数ピクセルの位置で元データとぴったり一致することを確かめる。
    ///
    /// 調べた結果（Xcode 27 / iOS 27・macOS）：SwiftUI は padding・offset・position のどれでも、
    /// ビューの原点をデバイスピクセルに揃えてから描く。そのため今はアンチエイリアスを有効にしてもこのテストは通る。
    /// 揃え方が将来の OS で変わったときに気づくための回帰テストとして置いている（DotwearIcon は念のためアンチエイリアスも切っている）
    func testFractionalPlacementStaysCrisp() {
        let (icon, grid, rows) = sourceGrids.first { $0.icon.name == "save" }!
        for displayScale in [2, 3] {
            for offset in [0.25, 0.3] {
                let view = probeIcon(icon, grid: grid, scale: 2)
                    .offset(x: offset, y: offset)
                    // offset はビューの大きさを変えないので、ずらした分がはみ出さないよう余白を足す
                    .padding(.trailing, 1)
                    .padding(.bottom, 1)
                let raster = rasterize(view, displayScale: CGFloat(displayScale))
                let label = "offset \(offset) @\(displayScale)x"
                XCTAssertTrue(raster.pixels.allSatisfy { $0.a == 0 || $0.a == 255 }, "半透明のピクセルがある: \(label)")
                let origin = firstOpaque(raster).map { o in
                    // 元データの最初の不透明なマスから、アイコンの左上の位置を逆算する
                    let first = firstOpaqueCell(rows)
                    let cellPx = 2 * displayScale
                    return (o.x - first.x * cellPx, o.y - first.y * cellPx)
                }
                guard let origin else { return XCTFail("何も描かれていない: \(label)") }
                assertMatches(raster, rows: rows, cellPx: 2 * displayScale, at: origin, label)
            }
        }
    }

    func testScaleBelowOneIsClampedToOne() {
        let raster = rasterize(DotwearIcon(.save, scale: 0), displayScale: 1)
        XCTAssertEqual(raster.width, 16)
    }

    func testMissingGridFallsBackTo16() {
        // 描き分けのないアイコンで 24 を指定すると 16 で描く（Web と同じ）
        guard let icon = DotwearIconDefinition.allIcons.first(where: { $0.grids[.grid24] == nil }) else { return }
        XCTAssertEqual(icon.layers(for: .grid24).grid, .grid16)
    }

    func testNamedLookup() {
        XCTAssertEqual(DotwearIconDefinition.named("save"), .save)
        XCTAssertNil(DotwearIconDefinition.named("no-such-icon"))
    }

    // MARK: -

    private func assertMatches(_ raster: Raster, rows: [String], cellPx: Int, at origin: (Int, Int), _ label: String,
                               file: StaticString = #filePath, line: UInt = #line) {
        let size = rows.count * cellPx
        guard origin.0 >= 0, origin.1 >= 0, origin.0 + size <= raster.width, origin.1 + size <= raster.height else {
            return XCTFail("画像の大きさが合わない（\(raster.width)×\(raster.height)、期待 \(size) 以上）: \(label)", file: file, line: line)
        }
        for y in 0..<raster.height {
            for x in 0..<raster.width {
                let inside = x >= origin.0 && y >= origin.1 && x < origin.0 + size && y < origin.1 + size
                let want: Pixel = inside
                    ? Probe.expected(Array(rows[(y - origin.1) / cellPx])[(x - origin.0) / cellPx])
                    : Probe.transparent
                let got = raster[x, y]
                if !raster.matches(got, want) {
                    return XCTFail("(\(x), \(y)) が \(got)、期待は \(want): \(label)", file: file, line: line)
                }
            }
        }
    }

    private func firstOpaque(_ raster: Raster) -> (x: Int, y: Int)? {
        for y in 0..<raster.height { for x in 0..<raster.width where raster[x, y].a == 255 { return (x, y) } }
        return nil
    }

    private func firstOpaqueCell(_ rows: [String]) -> (x: Int, y: Int) {
        for (y, row) in rows.enumerated() { for (x, ch) in row.enumerated() where ch != "." { return (x, y) } }
        return (0, 0)
    }
}
