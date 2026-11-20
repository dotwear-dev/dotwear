import Dotwear
import SwiftUI

struct SettingsView: View {
    let onLogout: () -> Void

    @Environment(\.dotwearTheme) private var theme
    @State private var notifications = true
    @State private var sound = false
    @State private var weeklyReport = true
    @State private var agreeAnalytics = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: theme.dots(8)) {
                VStack(alignment: .leading, spacing: theme.dots(2)) {
                    Text("通知").font(.headline).accessibilityAddTraits(.isHeader)
                    Toggle("プッシュ通知", isOn: $notifications).toggleStyle(.dotwear)
                    Toggle("通知音", isOn: $sound).toggleStyle(.dotwear).disabled(!notifications)
                    Toggle("週次レポートをメールで受け取る", isOn: $weeklyReport).toggleStyle(.dotwear(.checkbox))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .dotwearCard()

                VStack(alignment: .leading, spacing: theme.dots(2)) {
                    Text("プライバシー").font(.headline).accessibilityAddTraits(.isHeader)
                    Toggle("利用状況の送信に同意する", isOn: $agreeAnalytics).toggleStyle(.dotwear(.checkbox))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .dotwearCard()

                HStack(spacing: theme.dots(4)) {
                    Button("ログアウト", action: onLogout).buttonStyle(.dotwear(.secondary))
                    Button("キャンセル") {}.buttonStyle(.dotwear(.ghost))
                }
            }
            .foregroundStyle(theme.colors.foreground)
            .padding(theme.dots(8))
        }
        .background(theme.colors.background.ignoresSafeArea())
        .navigationTitle("設定")
    }
}
