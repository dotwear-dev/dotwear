// SteppedRectangle・SteppedBorder の形を、ドット単位の絵（# が塗り、. が透明）と 1 ピクセル単位で比べる。
// 画面の倍率 2・3 で描き、1 ドットが unit × 倍率 ピクセルの正方形になり、境界に半透明のピクセルがないことを確かめる
import DotwearTestSupport
import SwiftUI
import XCTest
@testable import Dotwear

@MainActor
final class SteppedRectangleTests: XCTestCase {
    private let unit = 2

    func testFillOneStep() {
        assertShape(SteppedRectangle(steps: 1, unit: CGFloat(unit)), [
            ".########.",
            "##########",
            "##########",
            "##########",
            "##########",
            "##########",
            "##########",
            ".########.",
        ])
    }

    func testFillTwoSteps() {
        assertShape(SteppedRectangle(steps: 2, unit: CGFloat(unit)), [
            "..######..",
            ".########.",
            "##########",
            "##########",
            "##########",
            "##########",
            ".########.",
            "..######..",
        ])
    }

    func testBorderOneStepWidthOne() {
        assertShape(SteppedBorder(steps: 1, unit: CGFloat(unit), width: 1), [
            ".########.",
            "#........#",
            "#........#",
            "#........#",
            "#........#",
            "#........#",
            "#........#",
            ".########.",
        ])
    }

    func testBorderTwoStepsWidthOne() {
        assertShape(SteppedBorder(steps: 2, unit: CGFloat(unit), width: 1), [
            "..######..",
            ".#......#.",
            "#........#",
            "#........#",
            "#........#",
            "#........#",
            ".#......#.",
            "..######..",
        ])
    }

    func testBorderTwoStepsWidthTwo() {
        assertShape(SteppedBorder(steps: 2, unit: CGFloat(unit), width: 2), [
            "..######..",
            ".########.",
            "##......##",
            "##......##",
            "##......##",
            "##......##",
            ".########.",
            "..######..",
        ])
    }

    func testInsetKeepsSteps() {
        // 1 ドット内側に縮めても、角の段は同じ形のまま
        assertShape(SteppedRectangle(steps: 1, unit: CGFloat(unit)).inset(by: CGFloat(unit)), [
            "..........",
            "..######..",
            ".########.",
            ".########.",
            ".########.",
            ".########.",
            "..######..",
            "..........",
        ])
    }

    func testTooSmallReducesSteps() {
        // 3×3 ドットに 2 段は入らないので 1 段にする
        assertShape(SteppedRectangle(steps: 2, unit: CGFloat(unit)), [
            ".#.",
            "###",
            ".#.",
        ])
    }

    func testThemeUsesTokens() {
        let theme = DotwearTheme.default
        XCTAssertEqual(theme.pixelUnit, Int(DotwearTokens.Shape.pixelUnit))
        XCTAssertEqual(theme.dots(3), CGFloat(3 * theme.pixelUnit))
        XCTAssertEqual(theme.borderWidth, DotwearTokens.Shape.borderWidth)
        XCTAssertEqual(theme.colors.primary, DotwearTokens.Color.primary)
    }

    func testImportDotwearExposesIcons() {
        // import Dotwear だけで DotwearIcon が使える（再公開）
        _ = DotwearIcon(.save)
    }

    // MARK: -

    private func assertShape(_ shape: some Shape, _ rows: [String], file: StaticString = #filePath, line: UInt = #line) {
        let cols = rows[0].count
        let view = shape
            .fillCrisp(Color(.sRGB, red: 1, green: 0, blue: 0, opacity: 1))
            .frame(width: CGFloat(cols * unit), height: CGFloat(rows.count * unit))
        for displayScale in [2, 3] {
            let raster = rasterize(view, displayScale: CGFloat(displayScale))
            let cell = unit * displayScale
            guard raster.width == cols * cell, raster.height == rows.count * cell else {
                return XCTFail("大きさが違う: \(raster.width)×\(raster.height) @\(displayScale)x", file: file, line: line)
            }
            for y in 0..<raster.height {
                for x in 0..<raster.width {
                    let want = Array(rows[y / cell])[x / cell] == "#" ? Probe.foreground : Probe.transparent
                    let got = raster[x, y]
                    if !raster.matches(got, want) {
                        return XCTFail("(\(x), \(y)) = \(got)、期待 \(want)（ドット \(x / cell), \(y / cell)）@\(displayScale)x",
                                       file: file, line: line)
                    }
                }
            }
        }
    }
}
