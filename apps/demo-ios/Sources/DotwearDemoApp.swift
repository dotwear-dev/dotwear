// Dotwear のデモアプリ。「業務アプリをピクセル調にする」使い方の見本（ログイン → 一覧 → 詳細、設定）。
// UI はすべて標準の部品（Button / TextField / Toggle / NavigationStack / List）に Dotwear のスタイルを被せて作る
import Dotwear
import SwiftUI

@main
struct DotwearDemoApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                // アプリのルートに付ければ、全体に Dotwear のテーマが効く
                .dotwearTheme()
        }
    }
}

struct RootView: View {
    // UI テストでログインを飛ばしたいときは、起動引数 -skipLogin を渡す
    @State private var isLoggedIn = ProcessInfo.processInfo.arguments.contains("-skipLogin")

    var body: some View {
        Group {
            if isLoggedIn {
                NavigationStack {
                    OrderListView(onLogout: { isLoggedIn = false })
                }
            } else {
                LoginView(onLogin: { isLoggedIn = true })
            }
        }
        .tint(DotwearTheme.default.colors.primary)
    }
}
