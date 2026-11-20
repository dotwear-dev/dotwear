// コンポーネントのうち文字を含まない部分（トグルの本体・カードの外装・大きさの丸め）を、ドット単位の絵と 1 ピクセル単位で比べる。
// 文字はアンチエイリアスで描かれるので、文字を含む全体は SnapshotTests で見る
import CoreText
import DotwearTestSupport
import SwiftUI
import XCTest
@testable import Dotwear

@MainActor
final class ComponentPixelTests: XCTestCase {
    private let theme = DotwearTheme.default

    // 色の記号：. 透明、B 枠と影（color.border）、P color.primary、W color.on-primary、G color.bg
    private var palette: [Character: Color] {
        let c = theme.colors
        return ["B": c.border, "P": c.primary, "W": c.onPrimary, "G": c.background]
    }

    func testCheckboxOn() {
        assertDots(ToggleControl(variant: .checkbox, isOn: true, isEnabled: true, isPressed: false, focused: false, theme: theme), [
            ".BBBBBB..",
            "BPPPPPPB.",
            "BPPPPPWBB",
            "BPPPPWWBB",
            "BWPPWWPBB",
            "BWWWWPPBB",
            "BPWWPPPBB",
            ".BBBBBBBB",
            "..BBBBBB.",
        ])
    }

    func testCheckboxOffPressedSinksAndDropsShadow() {
        // 押している間は影を消し、本体を 1 ドット下げる（大きさは変えない）
        assertDots(ToggleControl(variant: .checkbox, isOn: false, isEnabled: true, isPressed: true, focused: false, theme: theme), [
            ".........",
            ".BBBBBB..",
            "BGGGGGGB.",
            "BGGGGGGB.",
            "BGGGGGGB.",
            "BGGGGGGB.",
            "BGGGGGGB.",
            "BGGGGGGB.",
            ".BBBBBB..",
        ])
    }

    func testSwitchOnAndOff() {
        assertDots(ToggleControl(variant: .switch, isOn: true, isEnabled: true, isPressed: false, focused: false, theme: theme), [
            ".BBBBBBBBBBBB..",
            "BPPPPPPWWWWWWB.",
            "BPPPPPPWWWWWWBB",
            "BPPPPPPWWWWWWBB",
            "BPPPPPPWWWWWWBB",
            "BPPPPPPWWWWWWBB",
            "BPPPPPPWWWWWWBB",
            ".BBBBBBBBBBBBBB",
            "..BBBBBBBBBBBB.",
        ])
        assertDots(ToggleControl(variant: .switch, isOn: false, isEnabled: true, isPressed: false, focused: false, theme: theme), [
            ".BBBBBBBBBBBB..",
            "BBBBBBBGGGGGGB.",
            "BBGGGGBGGGGGGBB",
            "BBGGGGBGGGGGGBB",
            "BBGGGGBGGGGGGBB",
            "BBGGGGBGGGGGGBB",
            "BBBBBBBGGGGGGBB",
            ".BBBBBBBBBBBBBB",
            "..BBBBBBBBBBBB.",
        ])
    }

    func testCardHasDoubleLineFrame() {
        // 二重線の枠（ADR-027）：外の線 1・すき間 1・内の線 1。内の線は角を階段にしない（外の階段 1 段より内側のため）。
        // 中身が 0 × 0 でも、内側の余白 6 ドットの中に内の線が収まる
        assertDots(Color.clear.frame(width: 0, height: 0).dotwearCard(), [
            ".BBBBBBBBBB..",
            "BGGGGGGGGGGB.",
            "BGBBBBBBBBGBB",
            "BGBGGGGGGBGBB",
            "BGBGGGGGGBGBB",
            "BGBGGGGGGBGBB",
            "BGBGGGGGGBGBB",
            "BGBGGGGGGBGBB",
            "BGBGGGGGGBGBB",
            "BGBBBBBBBBGBB",
            "BGGGGGGGGGGBB",
            ".BBBBBBBBBBBB",
            "..BBBBBBBBBB.",
        ])
    }

    func testSingleLineFrameWhenInnerWidthIsZero() {
        // borderGap と borderInnerWidth を 0 にしたテーマでは、今までどおり一重の枠になる
        var single = theme
        single.borderGap = 0
        single.borderInnerWidth = 0
        assertDots(Color.clear.frame(width: 0, height: 0).dotwearCard().dotwearTheme(single), [
            ".BBBBBBBBBB..",
            "BGGGGGGGGGGB.",
            "BGGGGGGGGGGBB",
            "BGGGGGGGGGGBB",
            "BGGGGGGGGGGBB",
            "BGGGGGGGGGGBB",
            "BGGGGGGGGGGBB",
            "BGGGGGGGGGGBB",
            "BGGGGGGGGGGBB",
            "BGGGGGGGGGGBB",
            "BGGGGGGGGGGBB",
            ".BBBBBBBBBBBB",
            "..BBBBBBBBBB.",
        ])
    }

    func testBundledFontIsRegistered() {
        // 同梱の DotGothic16 が、アプリの Info.plist に書かなくても使えること（ADR-026）
        XCTAssertTrue(DotwearFont.register())
        let font = CTFontCreateWithName(DotwearFont.postScriptName as CFString, 16, nil)
        XCTAssertEqual(CTFontCopyPostScriptName(font) as String, DotwearFont.postScriptName)
    }

    func testCardChromeIsCrispAndOnTheDotGrid() {
        // 中身が半端な大きさ（7.3 × 5.1pt）でも、カードの外形はドットの整数倍になり、半透明のピクセルが出ない
        let view = Color.clear.frame(width: 7.3, height: 5.1).dotwearCard()
        for displayScale in [2, 3] {
            let raster = rasterize(view, displayScale: CGFloat(displayScale))
            let dotPx = theme.pixelUnit * displayScale
            XCTAssertEqual(raster.width % dotPx, 0, "幅がドットの整数倍でない @\(displayScale)x")
            XCTAssertEqual(raster.height % dotPx, 0, "高さがドットの整数倍でない @\(displayScale)x")
            XCTAssertTrue(raster.pixels.allSatisfy { $0.a == 0 || $0.a == 255 }, "半透明のピクセルがある @\(displayScale)x")
        }
    }

    func testCardDoesNotCollapseInsideVStack() {
        // 親が高さ 0 を提案しても、カードが 1 ドットに潰れないこと（DotSnap の切り捨ての回帰テスト）。
        // スナップショットで実際に潰れたときと同じく、幅を決めて 0 × 0 を提案する
        let view = VStack(spacing: 0) {
            Color.red.frame(height: 20).frame(maxWidth: .infinity).dotwearCard()
        }
        .frame(width: 100)
        let raster = rasterize(view, displayScale: 1, proposedSize: .zero)
        // 中身 20pt ＋ 余白 6 ドット × 2 ＋ 影 1 ドット
        XCTAssertEqual(raster.height, 20 + theme.pixelUnit * 13)
    }

    func testDotSnapRoundsUpToWholeDots() {
        let view = DotSnap(unit: 2) { Color.red.frame(width: 7.3, height: 5.1) }
        let raster = rasterize(view, displayScale: 2)
        XCTAssertEqual(raster.width, 16)   // 7.3pt → 8pt
        XCTAssertEqual(raster.height, 12)  // 5.1pt → 6pt
    }

    // MARK: -

    private func assertDots(_ view: some View, _ rows: [String], file: StaticString = #filePath, line: UInt = #line) {
        let colors = palette.mapValues { pixel(of: $0) }
        for displayScale in [2, 3] {
            let raster = rasterize(view, displayScale: CGFloat(displayScale))
            let cell = theme.pixelUnit * displayScale
            guard raster.width == rows[0].count * cell, raster.height == rows.count * cell else {
                return XCTFail("大きさが違う: \(raster.width)×\(raster.height) @\(displayScale)x", file: file, line: line)
            }
            for y in 0..<raster.height {
                for x in 0..<raster.width {
                    let ch = Array(rows[y / cell])[x / cell]
                    let want = ch == "." ? Probe.transparent : colors[ch]!
                    let got = raster[x, y]
                    if !raster.matches(got, want) {
                        return XCTFail("ドット (\(x / cell), \(y / cell)) が \(got)、期待は \(ch) @\(displayScale)x", file: file, line: line)
                    }
                }
            }
        }
    }

    /// テーマの色を、ラスタライズしたときと同じ経路で Pixel にする（1 ドットだけ描いて読む）
    private func pixel(of color: Color) -> Pixel {
        rasterize(color.frame(width: 1, height: 1), displayScale: 1)[0, 0]
    }
}
