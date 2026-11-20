// swift-tools-version: 6.0
// Dotwear の Swift Package。プロダクトを 2 つに分ける（ADR-009）
//   DotwearIcons … アイコンだけ（UI 一式には依存しない）
//   Dotwear      … UI 一式（DotwearIcons に依存し、再公開する）
// 開発はモノレポのここで行い、配布は専用リポジトリ dotwear-dev/dotwear-swift に同期して行う（ADR-017）。
// Sources/*/Generated/ は `pnpm generate swift` で作る生成物（git に入れない）
import PackageDescription

let package = Package(
    name: "Dotwear",
    // iOS 16 以上（CLAUDE.md）。macOS はテストを `swift test` で手早く回すために入れている
    platforms: [.iOS(.v16), .macOS(.v13)],
    products: [
        .library(name: "DotwearIcons", targets: ["DotwearIcons"]),
        .library(name: "Dotwear", targets: ["Dotwear"]),
    ],
    dependencies: [
        .package(url: "https://github.com/pointfreeco/swift-snapshot-testing", from: "1.17.0"),
    ],
    targets: [
        .target(name: "DotwearIcons"),
        // フォント（DotGothic16 と OFL。ADR-026）はパッケージに同梱し、初めて使うときに登録する（DotwearFont.swift）。
        // Generated/Fonts は pnpm generate swift が fonts/ からコピーする生成物
        .target(name: "Dotwear", dependencies: ["DotwearIcons"], resources: [.copy("Generated/Fonts")]),
        // テストだけで使う共通処理（ラスタライズとピクセルの比較）。プロダクトには含めない
        .target(name: "DotwearTestSupport", dependencies: ["DotwearIcons"], path: "Sources/DotwearTestSupport"),
        .testTarget(
            name: "DotwearIconsTests",
            dependencies: [
                "DotwearIcons",
                "DotwearTestSupport",
                .product(name: "SnapshotTesting", package: "swift-snapshot-testing"),
            ],
            exclude: ["__Snapshots__"]
        ),
        .testTarget(
            name: "DotwearTests",
            dependencies: [
                "Dotwear",
                "DotwearTestSupport",
                .product(name: "SnapshotTesting", package: "swift-snapshot-testing"),
            ],
            exclude: ["__Snapshots__"]
        ),
        // ドキュメントサイトに載せるコード例。コンパイルが通ることで、例が API と食い違っていないことを確かめる
        .testTarget(name: "DocSnippetsTests", dependencies: ["Dotwear"]),
    ]
)
