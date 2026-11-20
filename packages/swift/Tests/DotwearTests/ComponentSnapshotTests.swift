// コンポーネントの見た目のスナップショット（iOS シミュレーターだけ）。
// 文字はアンチエイリアスで描かれ、OS の版でわずかに変わることがあるので、許容幅を持たせる。
// DotGothic16 は輪郭が細かい段差なので、Xcode 26.6（CI）と 27.2（手元）で @2x の文字の輪郭の画素が全体の最大 3.5% ほど違った
// （枠とアイコンは 1 画素も違わなかった）。そこで、画素の 95% が一致すれば通すことにする。
// 枠とアイコンがにじまないことは、許容幅のない ComponentPixelTests・PixelRoundtripTests で確かめる
// 撮り直すときは環境変数 SNAPSHOT_TESTING_RECORD=all を付けて実行する
#if os(iOS)
import SnapshotTesting
import SwiftUI
import XCTest
@testable import Dotwear

@MainActor
final class ComponentSnapshotTests: XCTestCase {
    private func snap(_ view: some View, named name: String, file: StaticString = #filePath, testName: String = #function, line: UInt = #line) {
        let framed = view
            .padding(16)
            .frame(width: 360)
            .background(DotwearTheme.default.colors.background)
            .dotwearTheme()
        for scale in [2.0, 3.0] {
            assertSnapshot(
                of: framed,
                as: .image(precision: 0.95, perceptualPrecision: 0.98, layout: .sizeThatFits, traits: .init(displayScale: scale)),
                named: "\(name)@\(Int(scale))x", file: file, testName: testName, line: line
            )
        }
    }

    func testButtons() {
        snap(VStack(alignment: .leading, spacing: 12) {
            ForEach(DotwearButtonStyle.Size.allCases, id: \.self) { size in
                HStack(spacing: 8) {
                    ForEach(DotwearButtonStyle.Variant.allCases, id: \.self) { variant in
                        Button("保存") {}.buttonStyle(.dotwear(variant, size: size))
                    }
                }
            }
            HStack(spacing: 8) {
                Button("無効") {}.buttonStyle(.dotwear).disabled(true)
                // 読み込み中（dotwearLoading）は 3 つのドットが時刻で変わり、撮るたびに絵が変わるので入れない
                Button {} label: { Label { Text("保存") } icon: { DotwearIcon(.save) } }.buttonStyle(.dotwear(.secondary))
            }
        }, named: "buttons")
    }

    func testToggles() {
        snap(VStack(spacing: 8) {
            Toggle("Wi-Fi", isOn: .constant(true)).toggleStyle(.dotwear)
            Toggle("Bluetooth", isOn: .constant(false)).toggleStyle(.dotwear)
            Toggle("同意する", isOn: .constant(true)).toggleStyle(.dotwear(.checkbox))
            Toggle("通知を受け取る", isOn: .constant(false)).toggleStyle(.dotwear(.checkbox))
            Toggle("無効", isOn: .constant(true)).toggleStyle(.dotwear).disabled(true)
        }, named: "toggles")
    }

    func testTextFields() {
        snap(VStack(spacing: 8) {
            TextField("メールアドレス", text: .constant("")).textFieldStyle(.dotwear)
            TextField("名前", text: .constant("山田 太郎")).textFieldStyle(.dotwear)
            TextField("メール", text: .constant("taro@")).textFieldStyle(.dotwear).dotwearFieldError("メールアドレスの形式が正しくありません")
            TextField("無効", text: .constant("編集できません")).textFieldStyle(.dotwear).disabled(true)
        }, named: "text-fields")
    }

    func testCards() {
        snap(VStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 8) {
                Text("今月の売上").font(.headline)
                Text("¥1,234,000")
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .dotwearCard()
            Text("flat のカード").frame(maxWidth: .infinity, alignment: .leading).dotwearCard(.flat)
        }, named: "cards")
    }
}
#endif
