import Dotwear
import SwiftUI

struct LoginView: View {
    let onLogin: () -> Void

    @Environment(\.dotwearTheme) private var theme
    @State private var email = ""
    @State private var password = ""
    @State private var emailError: String?
    @State private var isLoading = false
    @FocusState private var focusedField: Field?

    private enum Field { case email, password }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: theme.dots(8)) {
                HStack(spacing: theme.dots(4)) {
                    DotwearIcon(.user, scale: 3)
                    Text("ログイン")
                        .font(.largeTitle.bold())
                        .accessibilityAddTraits(.isHeader)
                }

                VStack(alignment: .leading, spacing: theme.dots(4)) {
                    Text("メールアドレス").font(.subheadline)
                    TextField("メールアドレスを入力", text: $email)
                        .textFieldStyle(.dotwear)
                        .dotwearFieldError(emailError)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .accessibilityLabel("メールアドレス")
                        .accessibilityIdentifier("email")
                        .focused($focusedField, equals: .email)

                    Text("パスワード").font(.subheadline)
                    SecureField("8 文字以上", text: $password)
                        .textFieldStyle(.dotwear)
                        .textContentType(.password)
                        .accessibilityLabel("パスワード")
                        .accessibilityIdentifier("password")
                        .focused($focusedField, equals: .password)
                }

                Button {
                    submit()
                } label: {
                    Text("ログイン").frame(maxWidth: .infinity)
                }
                .buttonStyle(.dotwear(.primary, size: .large))
                .dotwearLoading(isLoading)
                .disabled(isLoading)
                .accessibilityIdentifier("login")
            }
            .padding(theme.dots(8))
        }
        .background(theme.colors.background.ignoresSafeArea())
    }

    private func submit() {
        // 送信したらキーボードを閉じる（次の画面の最初のタップが、キーボードを閉じる操作に使われないように）
        focusedField = nil
        // デモなので、形式だけを確かめる
        guard email.contains("@") else {
            emailError = "メールアドレスの形式が正しくありません"
            return
        }
        emailError = nil
        isLoading = true
        Task {
            try? await Task.sleep(for: .seconds(1))
            isLoading = false
            onLogin()
        }
    }
}
