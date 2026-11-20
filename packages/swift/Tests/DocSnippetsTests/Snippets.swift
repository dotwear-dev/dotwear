// ドキュメントサイト（apps/docs-site）に載せる Swift のコード例。
// サイトは `// snippet:<名前>` から `// end-snippet` までを取り出して表示する（apps/docs-site/src/lib/snippets.ts）。
// コード例をここに置くのは、swift test でコンパイルして、API を変えたときに例が古くなるのを防ぐため。
// 取り出した部分だけを読んでも意味が通るように書く（字下げは取り除かれる）。
// `//+ ` で始まる行は、コメントを外して表示する。テストのターゲットには書けないもの（@main など）を見せるため
import SwiftUI
import XCTest
import Dotwear

// MARK: - Getting Started

// snippet:quickstart
struct ContentView: View {
    @State private var email = ""

    var body: some View {
        VStack(spacing: 16) {
            DotwearIcon(.save, scale: 2)
            TextField("Email", text: $email)
                .textFieldStyle(.dotwear)
            Button("Save") { save() }
                .buttonStyle(.dotwear)
        }
        .padding()
        .dotwearTheme()
    }

    func save() {}
}
// end-snippet

// MARK: - Icons

struct IconSnippets: View {
    let name = "save"

    var body: some View {
        VStack {
            // snippet:icon-basic
            DotwearIcon(.save)             // 16 × 16 pt
            DotwearIcon(.save, scale: 2)   // 32 × 32 pt
            // end-snippet

            // snippet:icon-color
            DotwearIcon(.trash, scale: 2)
                .foregroundStyle(.red)
            // end-snippet

            // snippet:icon-label
            // Decorative: hidden from VoiceOver
            DotwearIcon(.save)

            // Meaningful on its own: give it a label
            DotwearIcon(.trash, label: Text("Delete"))
            // end-snippet

            // snippet:icon-grid
            DotwearIcon(.save, scale: 1, grid: .grid24)
            // end-snippet

            // snippet:icon-by-name
            if let icon = DotwearIconDefinition.allIcons.first(where: { $0.name == name }) {
                DotwearIcon(icon, scale: 2)
            }
            // end-snippet

            // snippet:icon-palette
            DotwearIcon(.folder, scale: 2)
                .dotwearPalette(.retroGreen)
            // end-snippet
        }
    }
}

// MARK: - Components

struct ComponentSnippets: View {
    @State private var email = ""
    @State private var emailError: String? = nil
    @State private var wifi = true
    @State private var agree = false
    @State private var isSaving = false

    var body: some View {
        VStack {
            // snippet:button
            Button("Save") { save() }
                .buttonStyle(.dotwear)

            Button("Cancel") { cancel() }
                .buttonStyle(.dotwear(.secondary, size: .small))

            Button(role: .destructive) { delete() } label: {
                Label("Delete", systemImage: "trash")
            }
            .buttonStyle(.dotwear(.danger))
            // end-snippet

            // snippet:button-loading
            Button("Save") { save() }
                .buttonStyle(.dotwear)
                .dotwearLoading(isSaving)
                .disabled(isSaving)
            // end-snippet

            // snippet:text-field
            TextField("Email", text: $email)
                .textFieldStyle(.dotwear)
                .dotwearFieldError(emailError)   // nil hides the message
            // end-snippet

            // snippet:toggle
            Toggle("Wi-Fi", isOn: $wifi)
                .toggleStyle(.dotwear)               // switch

            Toggle("I agree to the terms", isOn: $agree)
                .toggleStyle(.dotwear(.checkbox))
            // end-snippet

            // snippet:card
            VStack(alignment: .leading, spacing: 8) {
                Text("Storage").font(.headline)
                Text("12 GB of 50 GB used")
            }
            .dotwearCard()           // .outlined (border + shadow)

            Text("Nested")
                .dotwearCard(.flat)  // border only
            // end-snippet
        }
    }

    func save() {}
    func cancel() {}
    func delete() {}
}

// MARK: - Theming

// snippet:theme-root
//+ @main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                .dotwearTheme(.default)
        }
    }
}
// end-snippet

struct RootView: View {
    var body: some View { Text("Root") }
}

// snippet:theme-custom
extension DotwearTheme {
    static let brand: DotwearTheme = {
        var theme = DotwearTheme.default
        theme.colors.primary = Color(red: 0.8, green: 0.2, blue: 0.3)
        return theme
    }()
}
// end-snippet

// snippet:theme-read
struct Badge: View {
    @Environment(\.dotwearTheme) private var theme

    var body: some View {
        Text("NEW")
            .padding(theme.dots(2))   // 2 dots → points
            .background(theme.colors.primary)
    }
}
// end-snippet

// コード例のビューを実際に組み立てて、実行時にも落ちないことを確かめる（中身の見た目は他のテストで見ている）
final class DocSnippetsTests: XCTestCase {
    @MainActor
    func testSnippetsRender() {
        let views: [AnyView] = [
            AnyView(ContentView()),
            AnyView(IconSnippets()),
            AnyView(ComponentSnippets()),
            AnyView(Badge().dotwearTheme(.brand)),
        ]
        for view in views {
            let renderer = ImageRenderer(content: view.frame(width: 320, height: 640))
            XCTAssertNotNil(renderer.cgImage)
        }
    }
}
