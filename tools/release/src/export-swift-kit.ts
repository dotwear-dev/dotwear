// Swift の Kit（Free と Pro の全部。ADR-023）の配布用リポジトリの中身を書き出す。
//   pnpm generate kit && pnpm release:export-swift-kit <出力先>
// 開発用の packages/swift-kit/Package.swift はモノレポの packages/swift をパスで参照しているので、そのままは配れない。
// 配布用には、公開の dotwear-swift を URL で、同じ版番号（ADR-020）にそろえて参照する Package.swift を作る。
// 配布先は認証付き（非公開）のリポジトリ。ライセンス文はまだ入れない
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { findRepoRoot } from "./repo.js";

export function distKitPackageSwift(version: string): string {
  return `// swift-tools-version: 6.0
// Dotwear Kit（https://dotwear.dev）。Free と Pro の全部のアイコンを、公開の Dotwear と同じ API で使う。
// このリポジトリは自動で書き出したもの。直接は編集しない
//   import DotwearKit
//   DotwearIcon(.save)        // Free
//   DotwearIcon(.pro.crown)   // Pro
import PackageDescription

let package = Package(
    name: "DotwearKit",
    platforms: [.iOS(.v16), .macOS(.v13)],
    products: [
        .library(name: "DotwearKit", targets: ["DotwearKit"]),
    ],
    dependencies: [
        // 公開の Dotwear と同じ版番号にそろえる（ADR-020）
        .package(url: "https://github.com/dotwear-dev/dotwear-swift", exact: "${version}"),
    ],
    targets: [
        .target(name: "DotwearKit", dependencies: [.product(name: "Dotwear", package: "dotwear-swift")]),
    ]
)
`;
}

export async function exportSwiftKit(root: string, outDir: string): Promise<string[]> {
  const kit = path.join(root, "packages", "swift-kit");
  if (!(await stat(path.join(kit, "Sources", "DotwearKit", "Generated")).then(() => true, () => false))) {
    throw new Error("Sources/DotwearKit/Generated がありません。先に pnpm generate kit を実行してください");
  }
  const version = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")).version as string;
  await mkdir(outDir, { recursive: true });
  for (const entry of await readdir(outDir)) {
    if (entry !== ".git") await rm(path.join(outDir, entry), { recursive: true, force: true });
  }
  await cp(path.join(kit, "Sources", "DotwearKit"), path.join(outDir, "Sources", "DotwearKit"), { recursive: true });
  await writeFile(path.join(outDir, "Package.swift"), distKitPackageSwift(version));
  return ["Sources/DotwearKit/", `Package.swift（dotwear-swift ${version} を参照）`];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // pnpm --filter で実行すると作業フォルダが tools/release になるので、相対パスは呼び出した場所（INIT_CWD）から解決する
  const out = process.argv[2];
  if (!out) {
    console.error("使い方: pnpm release:export-swift-kit <出力先>（Kit の配布用リポジトリを clone したフォルダ）");
    process.exit(2);
  }
  const written = await exportSwiftKit(findRepoRoot(), path.resolve(process.env.INIT_CWD ?? process.cwd(), out));
  console.log(`✔ ${out} に書き出しました:\n  ${written.join("\n  ")}`);
}
