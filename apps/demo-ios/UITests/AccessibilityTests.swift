// デモアプリの各画面を、Xcode の自動アクセシビリティ監査（performAccessibilityAudit）にかける。
// 標準の文字の大きさと、いちばん大きい文字（アクセシビリティサイズの XXXL）の両方で行う。
// フェーズ 2 の受け入れ条件「VoiceOver と Dynamic Type が標準の部品と同じように動く」を自動で確かめる部分。
// 実際の VoiceOver での操作は手で確かめる（docs/03_roadmap.md）
import XCTest

@MainActor
final class AccessibilityTests: XCTestCase {
    private func launch(contentSize: String? = nil, skipLogin: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        if skipLogin { app.launchArguments.append("-skipLogin") }
        if let contentSize { app.launchArguments += ["-UIPreferredContentSizeCategoryName", contentSize] }
        app.launch()
        return app
    }

    /// 監査を行う。次の 3 つだけは除外する。
    /// 入力欄（TextField / SecureField）の「文字が切れる」：
    /// 1 行の入力欄は長い文字を横にスクロールして見せる作りで、iOS 標準の見た目（.roundedBorder）でも同じ指摘が出るため
    /// （2026-11-17 に確かめた）。Dotwear のスタイルが標準より悪くしていないことは、比べて確認している
    /// 無効な部品のコントラスト：WCAG 1.4.3 で操作できない部品は対象外。iOS 標準の無効なボタンも同じ色の薄さ
    /// 対象の要素がない指摘：アプリの外（システムのキーボード・ダイアログなど）のもので、アプリでは直せない
    @available(iOS 17.0, *)
    private func audit(_ app: XCUIApplication) throws {
        try app.performAccessibilityAudit { issue in
            let type = issue.element?.elementType
            // 無効な部品のコントラストも除外する。WCAG 1.4.3 で操作できない部品は対象外で、iOS 標準の無効なボタンも同じ色の薄さのため
            // 対象の要素がない指摘は、アプリの外（システムのキーボード・ダイアログなど）のもの。
            // アプリの部品の問題ではなく、出たり出なかったりして CI を不安定にするので除外する（ログには出す）
            let outsideApp = issue.element == nil
            let ignored = (issue.auditType == .textClipped && (type == .textField || type == .secureTextField))
                || (issue.auditType == .contrast && issue.element?.isEnabled == false)
                || outsideApp
            if outsideApp {
                print("監査の指摘（アプリの外のため除外）: \(issue.compactDescription) | \(issue.detailedDescription)")
            }
            if !ignored {
                // 失敗の理由がわかるように、どの要素の何が問題かをログに出す（CI でも読めるように）
                print("監査の指摘: \(issue.compactDescription) | \(issue.detailedDescription) | \(issue.element?.debugDescription.prefix(300) ?? "-")")
            }
            return ignored
        }
    }

    /// ナビゲーションバーの題名が出て、押せる状態（＝アニメーションが終わった状態）になるまで待つ
    private func waitForNavigationToSettle(_ app: XCUIApplication, title: String) {
        let bar = app.navigationBars[title]
        let settled = NSPredicate(format: "exists == true AND hittable == true")
        let exp = XCTNSPredicateExpectation(predicate: settled, object: bar)
        XCTAssertEqual(XCTWaiter().wait(for: [exp], timeout: 15), .completed, "画面の切り替えが終わらない: \(title)")
        // hittable になったあとも、題名の透明度の変化が少し残ることがあるので、短く待つ
        Thread.sleep(forTimeInterval: 0.5)
    }

    /// すべての画面を巡って監査する
    private func auditAllScreens(_ app: XCUIApplication) throws {
        guard #available(iOS 17.0, *) else { throw XCTSkip("performAccessibilityAudit は iOS 17 以降") }

        // ログイン
        try audit(app)
        app.textFields["email"].tap()
        app.textFields["email"].typeText("taro@example.com")
        // パスワードは入力しない。入力してログインすると iOS の「パスワードを保存しますか？」が出て、
        // 次の画面のタップを奪うため（デモのログインはメールの形式だけを確かめる）
        app.buttons["login"].tap()

        // 一覧。キーボードが消えて画面が落ち着いてから監査する
        XCTAssertTrue(app.buttons["order-A-1024"].waitForExistence(timeout: 15))
        XCTAssertTrue(app.keyboards.element.waitForNonExistence(timeout: 15), "キーボードが消えない")
        waitForNavigationToSettle(app, title: "受注一覧")
        try audit(app)

        // 詳細
        app.buttons["order-A-1024"].tap()
        XCTAssertTrue(app.buttons["削除"].waitForExistence(timeout: 15))
        // 画面の切り替えのアニメーションが終わってから監査する。途中だとナビゲーションバーの題名が
        // 半透明のまま検査され、「コントラスト不足」と誤って判定されることがある（CI で起きた）
        waitForNavigationToSettle(app, title: "A-1024")
        try audit(app)
        app.navigationBars.buttons.element(boundBy: 0).tap()

        // 設定
        app.buttons["settings"].tap()
        XCTAssertTrue(app.switches["プッシュ通知"].waitForExistence(timeout: 15))
        try audit(app)
    }

    func testAuditDefaultSize() throws {
        try auditAllScreens(launch())
    }

    func testAuditLargestDynamicType() throws {
        try auditAllScreens(launch(contentSize: "UICTContentSizeCategoryAccessibilityXXXL"))
    }

    /// トグルが標準の Toggle と同じく「スイッチ」として読み上げられ、押すと値が変わること
    func testTogglesAreExposedAsSwitches() {
        let app = launch(skipLogin: true)
        app.buttons["settings"].tap()
        let push = app.switches["プッシュ通知"]
        XCTAssertTrue(push.waitForExistence(timeout: 15))
        XCTAssertEqual(push.value as? String, "1")
        push.tap()
        XCTAssertEqual(push.value as? String, "0")
        XCTAssertTrue(app.switches["週次レポートをメールで受け取る"].exists)
    }
}
