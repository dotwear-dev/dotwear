// 公開用リポジトリ（dotwear-dev/dotwear）の中身を書き出す（ADR-008）。
//   pnpm release:export-public <出力先>
// 履歴は持ち込まない（ビジネス資料を含む過去のコミットが見えないように）。出力先で git init して初回コミットにする。
//   - 非公開のファイルは丸ごと除く（PRIVATE_FILES。戦略・方針の文書。ADR-021）
//   - tier: "pro" のアイコンと Kit のパッケージは除く（PRIVATE_DIRS。Pro は Kit でだけ配る。ADR-023）
//   - 文書の中の非公開の部分は目印で取り除く：
//       <!-- private:start --> 〜 <!-- private:end -->（その行だけの目印）で囲んだ範囲
//       行末が <!-- private --> の行
//   - 最後に、書き出したものに戦略の言葉（FORBIDDEN_TERMS）が残っていないかを確かめ、残っていたら失敗させる
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { findRepoRoot } from "./repo.js";

/** 丸ごと除くファイル（リポジトリルートからの相対パス） */
// 戦略・方針の文書は丸ごと非公開（ADR-021）。現在地・ロードマップ・決定事項（ADR）も方針を含むので除く
export const PRIVATE_FILES = [
  "docs/00_overview.md",
  "docs/01_business-context.md",
  "docs/03_roadmap.md",
  "docs/04_decisions.md",
  "docs/05_repositories.md",
  // 公開用リポジトリへ書き出すワークフロー（非公開の開発用リポジトリでだけ動かす）
  ".github/workflows/sync-public.yml",
];

/**
 * 公開してはいけない言葉（戦略・方針。ADR-021）。書き出したテキストに 1 つでも残っていたら、書き出しを失敗させる。
 * 目印の付け忘れで、戦略が公開リポジトリに出てしまうのを防ぐ最後の守り
 */
export const FORBIDDEN_TERMS = [
  "収益", "サブスク", "価格", "競合", "SaaS", "販売", "課金", "年額", "マネタイズ", "差別化", "集客", "戦略",
  "Gumroad", "Lemon Squeezy", "Product Hunt", "未決事項",
];

/** この禁止語の検査から外すファイル（禁止語の一覧そのものと、そのテスト） */
const GUARD_EXEMPT = ["tools/release/src/export-public.ts", "tools/release/test/"];

/** テキストに含まれる禁止語を、行番号つきで返す */
export function findForbidden(text: string, file: string): string[] {
  const hits: string[] = [];
  text.split("\n").forEach((line, i) => {
    for (const term of FORBIDDEN_TERMS) if (line.includes(term)) hits.push(`${file}:${i + 1}: 「${term}」`);
  });
  return hits;
}

/** 検査の対象にするテキストファイル（バイナリは除く） */
const GUARD_EXT = new Set([".md", ".mdx", ".txt", ".ts", ".tsx", ".js", ".mjs", ".json", ".yml", ".yaml", ".swift", ".kt", ".kts", ".astro", ".css", ".html", ".toml", ".properties"]);

/** 丸ごと除くフォルダ：Kit（Free と Pro の全部。認証付きでだけ配る。ADR-023） */
export const PRIVATE_DIRS = ["packages/kit/", "packages/swift-kit/", "packages/android/kit/"];

/** 目印を取り除くテキストファイルの拡張子 */
const TEXT_EXT = new Set([".md", ".mdx", ".txt"]);

const BLOCK_START = "<!-- private:start -->";
const BLOCK_END = "<!-- private:end -->";
const LINE_MARK = /\s*<!-- private -->\s*$/;

/** 文書から非公開の部分を取り除く。目印の閉じ忘れはエラーにする（非公開の内容を出してしまわないように） */
export function stripPrivate(text: string, file = "(text)"): string {
  const out: string[] = [];
  let inBlock = false;
  let blockStartLine = 0;
  text.split("\n").forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed === BLOCK_START) {
      if (inBlock) throw new Error(`${file}:${i + 1}: ${BLOCK_START} が入れ子になっています`);
      inBlock = true;
      blockStartLine = i + 1;
      return;
    }
    if (trimmed === BLOCK_END) {
      if (!inBlock) throw new Error(`${file}:${i + 1}: 対応する ${BLOCK_START} がありません`);
      inBlock = false;
      return;
    }
    if (inBlock || LINE_MARK.test(line)) return;
    out.push(line);
  });
  if (inBlock) throw new Error(`${file}:${blockStartLine}: ${BLOCK_START} が閉じられていません`);
  // 取り除いたあとに空行が 3 行以上続かないようにする
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

/** git が管理しているファイルだけを対象にする（生成物・node_modules・手元の設定を持ち込まない） */
function trackedFiles(root: string): string[] {
  return execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
}

async function proIcons(root: string): Promise<Set<string>> {
  const pro = new Set<string>();
  for (const dir of await readdir(path.join(root, "icons"))) {
    const file = path.join(root, "icons", dir, "icon.json");
    try {
      if ((await stat(file)).isFile() && JSON.parse(await readFile(file, "utf8")).tier === "pro") pro.add(`icons/${dir}/`);
    } catch {
      // icon.json のないフォルダは対象外
    }
  }
  return pro;
}

export async function exportPublic(root: string, outDir: string): Promise<{ files: number; excluded: string[] }> {
  if (path.resolve(outDir).startsWith(path.resolve(root) + path.sep)) {
    throw new Error("出力先はリポジトリの外にしてください（リポジトリの中に書き出すと、次の書き出しに混ざるため）");
  }
  const pro = await proIcons(root);
  const excluded: string[] = [];
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  let files = 0;
  const forbidden: string[] = [];
  for (const rel of trackedFiles(root)) {
    if (PRIVATE_FILES.includes(rel) || [...pro, ...PRIVATE_DIRS].some((p) => rel.startsWith(p))) {
      excluded.push(rel);
      continue;
    }
    const src = path.join(root, rel);
    const dest = path.join(outDir, rel);
    await mkdir(path.dirname(dest), { recursive: true });
    let text: string | undefined;
    if (TEXT_EXT.has(path.extname(rel)) || rel === "CLAUDE.md") {
      text = stripPrivate(await readFile(src, "utf8"), rel);
      await writeFile(dest, text);
    } else {
      await cp(src, dest, { preserveTimestamps: true });
      if (GUARD_EXT.has(path.extname(rel))) text = await readFile(src, "utf8");
    }
    if (text !== undefined && !GUARD_EXEMPT.some((e) => rel.startsWith(e))) forbidden.push(...findForbidden(text, rel));
    files++;
  }
  if (forbidden.length) {
    // 中途半端な書き出しを公開に使われないよう、出力先を消してから止める
    await rm(outDir, { recursive: true, force: true });
    throw new Error(`公開してはいけない言葉が残っています（目印を付けるか、書き直してください。ADR-021）:\n  ${forbidden.join("\n  ")}`);
  }
  return { files, excluded };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // pnpm --filter で実行すると作業フォルダが tools/release になるので、相対パスは呼び出した場所（INIT_CWD）から解決する
  const out = process.argv[2];
  if (!out) {
    console.error("使い方: pnpm release:export-public <出力先>（リポジトリの外のフォルダ）");
    process.exit(2);
  }
  const { files, excluded } = await exportPublic(findRepoRoot(), path.resolve(process.env.INIT_CWD ?? process.cwd(), out));
  console.log(`✔ ${files} 個のファイルを ${out} に書き出しました`);
  if (excluded.length) console.log(`除いたファイル:\n  ${excluded.join("\n  ")}`);
}
