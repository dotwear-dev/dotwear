// 公開の準備のスクリプトのテスト。特に、非公開の部分を取り除く処理（stripPrivate）は、
// 間違えるとビジネス資料を公開してしまうので、閉じ忘れなどをエラーにすることまで確かめる
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { exportPublic, findForbidden, PRIVATE_FILES, stripPrivate } from "../src/export-public.js";
import { distPackageSwift } from "../src/export-swift.js";
import { distKitPackageSwift } from "../src/export-swift-kit.js";
import { assertVersion, replaceGradleVersion, replaceJsonVersion } from "../src/set-version.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

let tmp: string | undefined;
afterEach(async () => tmp && rm(tmp, { recursive: true, force: true }));

describe("stripPrivate", () => {
  it("目印で囲んだ範囲と、行末に目印のある行を取り除く", () => {
    const text = ["# 見出し", "公開", "<!-- private:start -->", "非公開 1", "非公開 2", "<!-- private:end -->", "| a | b |", "| 秘 | 密 | <!-- private -->", "| c | d |"].join("\n");
    expect(stripPrivate(text)).toBe(["# 見出し", "公開", "| a | b |", "| c | d |"].join("\n"));
  });

  it("説明文の中に書いた目印（バッククォートで囲んだもの）は、行の途中なので取り除かない", () => {
    const line = "1 行：行末に `<!-- private -->` を付ける（表が切れるため）。";
    expect(stripPrivate(line)).toBe(line);
  });

  it("閉じ忘れ・対応のない終わり・入れ子はエラーにする（非公開の内容を出してしまわないように）", () => {
    expect(() => stripPrivate("<!-- private:start -->\n秘密")).toThrow(/閉じられていません/);
    expect(() => stripPrivate("<!-- private:end -->")).toThrow(/対応する/);
    expect(() => stripPrivate("<!-- private:start -->\n<!-- private:start -->")).toThrow(/入れ子/);
  });
});

describe("exportPublic（実際のリポジトリで）", () => {
  // 書き出す元（開発用リポジトリ）でだけ確かめる。書き出した先（公開用リポジトリ）には、除く対象のファイルがそもそもない
  it.runIf(existsSync(path.join(REPO_ROOT, PRIVATE_FILES[0]!)))("戦略・方針の文書を丸ごと除き、残る文書から非公開の部分を取り除き、目印を 1 つも残さない", async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), "dw-public-"));
    const { files, excluded } = await exportPublic(REPO_ROOT, tmp);
    expect(files).toBeGreaterThan(50);
    expect(excluded).toEqual(expect.arrayContaining(PRIVATE_FILES));
    for (const doc of PRIVATE_FILES) await expect(readFile(path.join(tmp, doc), "utf8")).rejects.toThrow();
    // Kit のパッケージは 1 ファイルも出さない
    await expect(readFile(path.join(tmp, "packages/kit/package.json"), "utf8")).rejects.toThrow();
    await expect(readFile(path.join(tmp, "packages/swift-kit/Package.swift"), "utf8")).rejects.toThrow();
    await expect(readFile(path.join(tmp, "packages/android/kit/build.gradle.kts"), "utf8")).rejects.toThrow();
    // ルートの scripts が Kit のパッケージを名指ししていると、公開用リポジトリでは turbo が「パッケージがない」で失敗する。
    // Kit も含めたいときは '@dotwear/swift*' のようにパターンで指す（あれば含まれ、なければ飛ばされる）
    const rootScripts = JSON.parse(await readFile(path.join(tmp, "package.json"), "utf8")).scripts as Record<string, string>;
    for (const [name, cmd] of Object.entries(rootScripts)) {
      expect(cmd, name).not.toMatch(/@dotwear\/(swift-)?kit\b/);
    }
    const claude = await readFile(path.join(tmp, "CLAUDE.md"), "utf8");
    expect(claude).not.toContain("04_decisions.md");
    expect(claude).not.toContain("05_repositories.md");
    const arch = await readFile(path.join(tmp, "docs/02_architecture.md"), "utf8");
    expect(arch).not.toMatch(/\| 対象 \| Free \| Pro \|/);
    for (const doc of ["docs/02_architecture.md", "CLAUDE.md"]) {
      expect(await readFile(path.join(tmp, doc), "utf8")).not.toMatch(/<!-- private(:start|:end)? -->\s*$/m);
    }
  });

  it("戦略の言葉が残っていたら書き出しを失敗させ、出力先を消す", async () => {
    expect(findForbidden("a\n年額で売る\nb", "x.md")).toEqual(["x.md:2: 「年額」"]);
    expect(findForbidden("ふつうの説明", "x.md")).toEqual([]);
  });

  it("リポジトリの中には書き出さない", async () => {
    await expect(exportPublic(REPO_ROOT, path.join(REPO_ROOT, "tmp-export"))).rejects.toThrow(/リポジトリの外/);
  });
});

describe("set-version", () => {
  it("semver だけを受け付ける", () => {
    expect(() => assertVersion("0.1.0")).not.toThrow();
    expect(() => assertVersion("0.2.0-beta.1")).not.toThrow();
    expect(() => assertVersion("v0.1")).toThrow();
  });

  it("JSON の version だけを書き換え、ほかの書き方は変えない", () => {
    const json = '{\n  "name": "@dotwear/icons",\n  "version": "0.0.0",\n  "deps": { "x": "1.0.0" }\n}\n';
    expect(replaceJsonVersion(json, "0.1.0")).toBe(json.replace('"version": "0.0.0"', '"version": "0.1.0"'));
  });

  it("gradle.properties の VERSION_NAME を書き換える（なければ足す）", () => {
    expect(replaceGradleVersion("a=1\nVERSION_NAME=0.0.0\n", "0.1.0")).toBe("a=1\nVERSION_NAME=0.1.0\n");
    expect(replaceGradleVersion("a=1\n", "0.1.0")).toBe("a=1\nVERSION_NAME=0.1.0\n");
  });
});

describe("distPackageSwift", () => {
  it("テスト用の依存とテストのターゲットを含まない", () => {
    const pkg = distPackageSwift();
    expect(pkg).not.toContain("swift-snapshot-testing");
    expect(pkg).not.toContain("testTarget");
    expect(pkg).not.toContain("DotwearTestSupport");
    expect(pkg).toContain('.library(name: "Dotwear", targets: ["Dotwear"])');
  });
});


describe("distKitPackageSwift", () => {
  it("公開の dotwear-swift を同じ版番号で参照し、モノレポのパスを参照しない", () => {
    const pkg = distKitPackageSwift("0.1.0");
    expect(pkg).toContain('.package(url: "https://github.com/dotwear-dev/dotwear-swift", exact: "0.1.0")');
    expect(pkg).not.toContain("path:");
    expect(pkg).not.toContain("testTarget");
  });
});
