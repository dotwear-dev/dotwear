// リポジトリの場所を探す（pnpm-workspace.yaml がある場所）。各スクリプトはどこから実行しても動くようにする
import { existsSync } from "node:fs";
import path from "node:path";

export function findRepoRoot(start = process.cwd()): string {
  let dir = path.resolve(start);
  for (;;) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`リポジトリルート（pnpm-workspace.yaml）が見つかりません: ${start}`);
    dir = parent;
  }
}
