// Swift の配布用リポジトリ（dotwear-dev/dotwear-swift）の中身を書き出す（ADR-017）。
//   pnpm generate swift && pnpm release:export-swift <出力先>
// 書き出したものを配布用リポジトリにコミットし、版番号のタグ（例：0.1.0）を付ける。
//
// 開発用の packages/swift/Package.swift はそのまま使わない。テスト用の依存（swift-snapshot-testing）が書いてあり、
// SPM はテストでしか使わない依存も利用者の側で取得してしまうため。配布用には、プロダクトのターゲットだけの Package.swift を作る
import { cp, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { findRepoRoot } from "./repo.js";

// 開発用の Package.swift と同じ resources を書く。ないと Bundle.module が作られず、同梱のフォント（ADR-026）を読むコードがビルドできない
/** 配布するターゲット（Sources/ の下のフォルダ名）。DotwearTestSupport はテスト専用なので含めない */
export const SWIFT_TARGETS = ["DotwearIcons", "Dotwear"] as const;

export function distPackageSwift(): string {
  return `// swift-tools-version: 6.0
// Dotwear（https://dotwear.dev）。ピクセル調のアイコンと UI を SwiftUI で使うためのパッケージ。
// このリポジトリは dotwear-dev/dotwear（モノレポ）から自動で書き出したもの。直接は編集しない（ADR-017）
//   DotwearIcons … アイコンだけ（import DotwearIcons）
//   Dotwear      … UI 一式（import Dotwear。DotwearIcons も使える）
import PackageDescription

let package = Package(
    name: "Dotwear",
    platforms: [.iOS(.v16), .macOS(.v13)],
    products: [
        .library(name: "DotwearIcons", targets: ["DotwearIcons"]),
        .library(name: "Dotwear", targets: ["Dotwear"]),
    ],
    targets: [
        .target(name: "DotwearIcons"),
        .target(name: "Dotwear", dependencies: ["DotwearIcons"], resources: [.copy("Generated/Fonts")]),
    ]
)
`;
}

async function exists(p: string): Promise<boolean> {
  return stat(p).then(() => true, () => false);
}

export async function exportSwift(root: string, outDir: string): Promise<string[]> {
  const pkg = path.join(root, "packages", "swift");
  for (const target of SWIFT_TARGETS) {
    // 生成物がないまま配ると、利用者の手元でビルドできない
    if (!(await exists(path.join(pkg, "Sources", target, "Generated")))) {
      throw new Error(`Sources/${target}/Generated がありません。先に pnpm generate swift を実行してください`);
    }
  }
  // 出力先の .git（配布用リポジトリの履歴）は残し、それ以外を作り直す
  await mkdir(outDir, { recursive: true });
  for (const entry of await readdir(outDir)) {
    if (entry !== ".git") await rm(path.join(outDir, entry), { recursive: true, force: true });
  }
  const written: string[] = [];
  for (const target of SWIFT_TARGETS) {
    await cp(path.join(pkg, "Sources", target), path.join(outDir, "Sources", target), { recursive: true });
    written.push(`Sources/${target}/`);
  }
  await writeFile(path.join(outDir, "Package.swift"), distPackageSwift());
  await cp(path.join(root, "LICENSE"), path.join(outDir, "LICENSE"));
  await cp(path.join(pkg, "README.md"), path.join(outDir, "README.md"));
  written.push("Package.swift", "LICENSE", "README.md");
  return written;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // pnpm --filter で実行すると作業フォルダが tools/release になるので、相対パスは呼び出した場所（INIT_CWD）から解決する
  const out = process.argv[2];
  if (!out) {
    console.error("使い方: pnpm release:export-swift <出力先>（配布用リポジトリを clone したフォルダ）");
    process.exit(2);
  }
  const written = await exportSwift(findRepoRoot(), path.resolve(process.env.INIT_CWD ?? process.cwd(), out));
  console.log(`✔ ${out} に書き出しました:\n  ${written.join("\n  ")}`);
}
