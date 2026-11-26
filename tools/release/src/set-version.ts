// 版番号を、すべての配布物にそろえて書き写す（ADR-020）。
//   pnpm release:version 0.1.0
// 元はリポジトリ直下の package.json の version。npm のパッケージ、Flutter の pubspec.yaml、Android の gradle.properties に書き写す。
// Swift はファイルに版番号を持たず、配布用リポジトリのタグ（0.1.0）で表す（ADR-017）
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { findRepoRoot } from "./repo.js";

/** npm に公開するパッケージ（版番号を書き写す先） */
export const NPM_PACKAGES = ["packages/icons", "packages/web", "packages/react-native-icons", "packages/react-native"] as const;

/** 認証付きのレジストリ（npm.dotwear.dev）でだけ配る Kit（ADR-036）。npm には公開しないが、版番号は全配布物とそろえる（ADR-020） */
export const KIT_NPM_PACKAGES = ["packages/kit"] as const;

/** pub.dev に公開するパッケージ（ADR-033）。pubspec.yaml の version と、仲間のパッケージへの依存の版を書き写す */
export const PUB_PACKAGES = ["packages/flutter/dotwear_icons", "packages/flutter/dotwear"] as const;

/** PUB_PACKAGES のパッケージ名（依存の版をそろえる相手） */
const PUB_NAMES = ["dotwear_icons", "dotwear"] as const;

const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

export function assertVersion(version: string): void {
  if (!SEMVER.test(version)) throw new Error(`版番号は semver（例：0.1.0、0.2.0-beta.1）にしてください: ${version}`);
}

/** JSON の version だけを書き換える（キーの順番と書き方はそのまま残す） */
export function replaceJsonVersion(json: string, version: string): string {
  const next = json.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${version}"`);
  if (next === json && !json.includes(`"version": "${version}"`)) throw new Error("version が見つかりません");
  return next;
}

/** gradle.properties の VERSION_NAME だけを書き換える（なければ足す） */
export function replaceGradleVersion(props: string, version: string): string {
  return /^VERSION_NAME=.*$/m.test(props)
    ? props.replace(/^VERSION_NAME=.*$/m, `VERSION_NAME=${version}`)
    : `${props.trimEnd()}\nVERSION_NAME=${version}\n`;
}

/**
 * pubspec.yaml の version（行頭）と、仲間のパッケージへの依存（"  dotwear_icons: ^0.1.0"）を書き換える。
 * 依存は ^ を付けて、同じ版番号以上・次の大きな版未満にする（pub の慣習）
 */
export function replacePubspecVersion(yaml: string, version: string): string {
  if (!/^version: .*$/m.test(yaml)) throw new Error("pubspec.yaml に version がありません");
  let next = yaml.replace(/^version: .*$/m, `version: ${version}`);
  for (const name of PUB_NAMES) {
    next = next.replace(new RegExp(`^(  ${name}): \\^[^\\s#]+`, "m"), `$1: ^${version}`);
  }
  return next;
}

export async function setVersion(root: string, version: string): Promise<string[]> {
  assertVersion(version);
  const changed: string[] = [];
  for (const rel of ["package.json", ...[...NPM_PACKAGES, ...KIT_NPM_PACKAGES].map((p) => `${p}/package.json`)]) {
    const file = path.join(root, rel);
    await writeFile(file, replaceJsonVersion(await readFile(file, "utf8"), version));
    changed.push(rel);
  }
  for (const dir of PUB_PACKAGES) {
    const rel = `${dir}/pubspec.yaml`;
    const file = path.join(root, rel);
    await writeFile(file, replacePubspecVersion(await readFile(file, "utf8"), version));
    changed.push(rel);
  }
  const gradle = path.join(root, "packages/android/gradle.properties");
  await writeFile(gradle, replaceGradleVersion(await readFile(gradle, "utf8"), version));
  changed.push("packages/android/gradle.properties");
  return changed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const version = process.argv[2];
  if (!version) {
    console.error("使い方: pnpm release:version <版番号>（例：0.1.0）");
    process.exit(2);
  }
  const changed = await setVersion(findRepoRoot(), version);
  console.log(`✔ 版番号を ${version} にしました:\n  ${changed.join("\n  ")}`);
  console.log("Swift は配布用リポジトリに同じ番号のタグを付けます（pnpm release:export-swift のあと）");
}
