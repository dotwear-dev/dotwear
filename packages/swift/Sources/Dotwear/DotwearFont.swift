// Dotwear の文字（DotGothic16。ADR-026）。フォントはパッケージに同梱し、初めて使うときにこのプロセスに登録する。
// アプリの Info.plist（UIAppFonts）に書かなくても使えるようにするため。
//
// DotGothic16 は 16pt を 1 マスとして描かれている。Dynamic Type で半端な大きさになると文字はにじむが、
// 文字の大きさを変えられることを優先する（ADR-026）。太字は合成しない（にじむため）
import CoreText
import SwiftUI

public enum DotwearFont {
    /// PostScript 名（Font.custom に渡す名前）
    public static let postScriptName = "DotGothic16-Regular"

    /// 同梱のフォントを登録する。何度呼んでも 1 回だけ登録する。
    /// 部品は自動で呼ぶので、利用者が呼ぶのは Dotwear の部品の外で DotwearFont を使うときだけでよい
    @discardableResult
    public static func register() -> Bool { registered }

    private static let registered: Bool = {
        guard let url = Bundle.module.url(forResource: postScriptName, withExtension: "ttf", subdirectory: "Fonts") else {
            assertionFailure("同梱のフォントが見つかりません（pnpm generate swift を実行してください）")
            return false
        }
        var error: Unmanaged<CFError>?
        // .process：このアプリの中だけで使う。すでに登録済み（アプリ側でも同じフォントを入れた）ときの失敗は無視してよい
        if !CTFontManagerRegisterFontsForURL(url as CFURL, .process, &error) {
            let code = (error?.takeRetainedValue()).map { CFErrorGetCode($0) }
            return code == CFIndex(CTFontManagerError.alreadyRegistered.rawValue)
        }
        return true
    }()

    /// 本文の文字（typography.body）。Dynamic Type に合わせて大きさが変わる。
    /// .dotwearTheme() がアプリ全体の既定の文字にする
    public static var body: Font {
        register()
        return .custom(postScriptName, size: DotwearTokens.Typography.body, relativeTo: .body)
    }

    /// Dotwear の文字。size は pt（呼ぶ側で @ScaledMetric などを使って Dynamic Type に合わせた値を渡す）
    public static func font(size: CGFloat) -> Font {
        register()
        return .custom(postScriptName, fixedSize: size)
    }
}
