// 入力欄のスタイル（docs/components/text-field.md）。標準の TextField に見た目だけを被せる。
//   TextField("メール", text: $email).textFieldStyle(.dotwear).dotwearFieldError(emailError)
// 文字の入力・変換（IME）・選択・カーソル操作は標準のまま。
//
// TextFieldStyle の要件は _body（先頭が _ の名前）だが、独自のスタイルを作る方法はこれしかないため使っている
import SwiftUI

public struct DotwearTextFieldStyle: TextFieldStyle {
    public init() {}

    public func _body(configuration: TextField<Self._Label>) -> some View {
        DotwearTextFieldBody(field: configuration)
    }
}

extension TextFieldStyle where Self == DotwearTextFieldStyle {
    /// `.textFieldStyle(.dotwear)`
    public static var dotwear: DotwearTextFieldStyle { DotwearTextFieldStyle() }
}

private struct DotwearTextFieldBody<Field: View>: View {
    // TextFieldStyle の _body は main actor の外から呼ばれる（プロトコルの要件が nonisolated）。
    // ビューは main actor に属するので、初期化を nonisolated にして、そこから作れるようにする。
    // field は作ったあと書き換えず、SwiftUI が main actor で読むだけなので、unsafe でも同時の読み書きは起きない
    nonisolated(unsafe) let field: Field

    nonisolated init(field: Field) {
        self.field = field
    }

    @Environment(\.dotwearTheme) private var theme
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.dotwearFieldError) private var error
    @FocusState private var focused: Bool
    @ScaledMetric(relativeTo: .body) private var fontSize = DotwearTokens.Typography.body

    var body: some View {
        let c = theme.colors
        VStack(alignment: .leading, spacing: theme.dots(2)) {
            DotSnap(unit: theme.dots(1), minHeight: theme.dots(16)) {
                field
                    .focused($focused)
                    .font(DotwearFont.font(size: fontSize))
                    .foregroundStyle(isEnabled ? c.foreground : c.disabled)
                    // 左右の余白 4 ドットは内の線から測る（外の線から測ると、二重線のとき文字が内の線に触れるため）
                    .padding(.horizontal, theme.dots(theme.frameInset - theme.borderWidth + 4))
                    // 文字が二重線の内の線に重ならないよう、上下は枠の幅の分だけ空ける
                    .padding(.vertical, theme.dots(theme.frameInset))
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .modifier(PixelChrome(
                unit: theme.dots(1),
                fill: c.background,
                border: error != nil ? c.danger : (isEnabled ? c.border : c.disabled),
                borderWidth: theme.borderWidth,
                steps: theme.cornerStep,
                innerGap: theme.borderGap,
                innerWidth: theme.borderInnerWidth,
                shadow: nil,
                reservesShadow: false,
                // 入力中はフォーカスリング。枠の太さは変えない（文字の位置がずれないように）
                focusRing: focused ? c.focus : nil
            ))
            // 枠の外の余白を押しても入力を始められるようにする（タップ領域を 44pt 確保するため）
            .frame(minHeight: 44)
            .contentShape(Rectangle())
            .onTapGesture { focused = true }
            .accessibilityHint(error.map { Text($0) } ?? Text(verbatim: ""))

            if let error {
                Text(error)
                    // 説明文も本文と同じ大きさにする。ピクセルフォントは 16pt の整数倍でないとにじむため（ADR-026）
                    .font(DotwearFont.font(size: fontSize))
                    .foregroundStyle(c.danger)
                    // 入力欄のヒントとして読み上げるので、ここは二重に読まない
                    .accessibilityHidden(true)
            }
        }
    }
}

private struct DotwearFieldErrorKey: EnvironmentKey {
    static let defaultValue: String? = nil
}

extension EnvironmentValues {
    public var dotwearFieldError: String? {
        get { self[DotwearFieldErrorKey.self] }
        set { self[DotwearFieldErrorKey.self] = newValue }
    }
}

extension View {
    /// 入力欄をエラーの見た目にし、下に説明文を出す。nil ならエラーなし
    public func dotwearFieldError(_ message: String?) -> some View {
        environment(\.dotwearFieldError, message)
    }
}
