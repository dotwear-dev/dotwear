import { existsSync } from "node:fs";
import path from "node:path";
import { emitAndroid, emitAndroidKit } from "./emit/android.js";
import { emitBrand, loadBrandColor } from "./emit/brand.js";
import { emitAndroidFonts, emitFonts, emitWebFonts } from "./emit/fonts.js";
import { emitSiteIcons, loadSiteColors } from "./emit/site-icons.js";
import { emitSwift, emitSwiftKit } from "./emit/swift.js";
import { emitKotlinTokens, emitSwiftTokens, emitTokens } from "./emit/tokens.js";
import { emitWeb } from "./emit/web.js";
import { loadIcons, loadPalette } from "./source/load.js";
import { formatIssue, sortIssues, validateAll } from "./validate/index.js";

// pnpm-workspace.yaml がある場所をリポジトリルートとみなす
function findRepoRoot(start: string): string {
  let dir = path.resolve(start);
  for (;;) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`リポジトリルート（pnpm-workspace.yaml）が見つかりません: ${start}`);
    dir = parent;
  }
}

async function runValidate(): Promise<number> {
  const root = findRepoRoot(process.cwd());
  const issues = sortIssues(await validateAll(root));
  if (issues.length === 0) {
    console.log("✔ icons/・brand/・tokens/ の検証に成功しました");
    return 0;
  }
  for (const issue of issues) console.error(formatIssue(issue));
  console.error(`\n✖ ${issues.length} 件のエラーがあります`);
  return 1;
}

// 出力の対象。パッケージの build からは自分の分だけを指定する。
// turbo は icons と web の build を並列に走らせるので、同じ出力先を 2 つのプロセスが同時に作り直さないようにするため
const TARGETS = ["icons", "tokens", "brand", "swift", "android", "kit-web", "kit-swift", "kit-android"] as const;
type Target = (typeof TARGETS)[number];

// 元データから各プラットフォームの生成物を出力する。
// 壊れた元データから生成しないように、必ず先に validate を通す
async function runGenerate(args: string[]): Promise<number> {
  const unknown = args.filter((a) => a !== "kit" && !(TARGETS as readonly string[]).includes(a));
  if (unknown.length) {
    console.error(`不明な出力対象: ${unknown.join(", ")}（使えるのは ${TARGETS.join(" / ")}）`);
    return 2;
  }
  // "kit" は Kit の 3 つ（kit-web・kit-swift・kit-android）をまとめた書き方
  const expanded = args.flatMap((a) => (a === "kit" ? ["kit-web", "kit-swift", "kit-android"] : [a]));
  const targets = new Set<Target>(expanded.length ? (expanded as Target[]) : TARGETS);

  const root = findRepoRoot(process.cwd());
  const issues = sortIssues(await validateAll(root));
  if (issues.length > 0) {
    for (const issue of issues) console.error(formatIssue(issue));
    console.error(`\n✖ 検証エラーが ${issues.length} 件あるため、生成を中止しました`);
    return 1;
  }
  const rel = (p: string) => path.relative(root, p);

  if (targets.has("icons")) {
    const icons = await loadIcons(path.join(root, "icons"));
    const outDir = path.join(root, "packages", "icons", "generated");
    await emitWeb({ icons, palette: await loadPalette(root), outDir });
    console.log(`✔ Free のアイコン ${icons.filter((i) => i.tier === "free").length} 個を ${rel(outDir)}/ に出力しました`);
  }
  if (targets.has("tokens")) {
    const outDir = path.join(root, "packages", "web", "generated");
    await emitTokens({ root, outDir });
    // emitTokens が generated/ を作り直すので、その後にフォント（fonts/ と fonts.css）を出す（ADR-026）
    await emitWebFonts({ root, outDir });
    console.log(`✔ デザイントークンとフォントを ${rel(outDir)}/ に出力しました`);
  }
  if (targets.has("brand")) {
    // brand/ はパッケージで配らない（ADR-010）ので、リポジトリ直下の generated/ に出す
    const brand = await loadIcons(path.join(root, "brand"));
    const outDir = path.join(root, "generated", "brand");
    await emitBrand({ brand, brandColor: await loadBrandColor(root), outDir });
    // サイトの favicon・apple-touch-icon・OGP 画像（ロゴ dotwear から作る）。emitBrand が outDir を作り直すので、その後に出す
    const logo = brand.find((b) => b.name === "dotwear");
    if (!logo) throw new Error("brand/dotwear がありません（サイトのアイコンの元）");
    await emitSiteIcons({
      logo,
      colors: await loadSiteColors(root),
      fontFile: path.join(root, "fonts", "DotGothic16", "DotGothic16-Regular.ttf"),
      tagline: "Pixel-art icons and UI for business apps",
      outDir: path.join(outDir, "site"),
    });
    console.log(`✔ ブランド素材を ${rel(outDir)}/ に出力しました`);
  }
  if (targets.has("swift")) {
    // Swift Package の生成物。モノレポでは git に入れず、配布専用リポジトリへの同期時に含める（ADR-017）
    const icons = await loadIcons(path.join(root, "icons"));
    const packageDir = path.join(root, "packages", "swift");
    await emitSwift({ icons, palette: await loadPalette(root), packageDir });
    await emitSwiftTokens({ root, outDir: path.join(packageDir, "Sources", "Dotwear", "Generated") });
    // フォントは Dotwear ターゲットのリソース（Package.swift の resources: .copy("Generated/Fonts")）。
    // emitSwiftTokens が Generated/ を作り直すので、その後にコピーする
    await emitFonts({ root, outDir: path.join(packageDir, "Sources", "Dotwear", "Generated", "Fonts") });
    console.log(`✔ Free のアイコン ${icons.filter((i) => i.tier === "free").length} 個とデザイントークンを ${rel(packageDir)}/ の Generated/ に出力しました`);
  }
  if (targets.has("android")) {
    const icons = await loadIcons(path.join(root, "icons"));
    const projectDir = path.join(root, "packages", "android");
    await emitAndroid({ icons, palette: await loadPalette(root), projectDir });
    await emitKotlinTokens({
      root,
      outDir: path.join(projectDir, "compose", "src", "generated", "kotlin", "dev", "dotwear", "compose"),
    });
    // フォント（res/font）とライセンス文（assets/licenses）。compose の build.gradle.kts で読み込む（ADR-026）
    await emitAndroidFonts({ root, outDir: path.join(projectDir, "compose", "src", "generated") });
    console.log(`✔ Free のアイコン ${icons.filter((i) => i.tier === "free").length} 個とデザイントークンを ${rel(projectDir)}/ の src/generated/ に出力しました`);
  }
  if (targets.has("kit-web") || targets.has("kit-swift") || targets.has("kit-android")) {
    // Kit（Free と Pro の全部が入る認証付きのパッケージ。ADR-023）。
    // Kit のパッケージは非公開のリポジトリにだけあるので、フォルダがないプラットフォームは飛ばす
    const icons = await loadIcons(path.join(root, "icons"));
    const palette = await loadPalette(root);
    const kitWeb = path.join(root, "packages", "kit");
    const kitSwift = path.join(root, "packages", "swift-kit");
    const android = path.join(root, "packages", "android");
    const done: string[] = [];
    if (targets.has("kit-web") && existsSync(kitWeb)) {
      await emitWeb({ icons, palette, outDir: path.join(kitWeb, "generated"), tiers: ["free", "pro"], typesImport: "@dotwear/icons" });
      done.push(rel(kitWeb));
    }
    if (targets.has("kit-swift") && existsSync(kitSwift)) {
      await emitSwiftKit({ icons, palette, packageDir: kitSwift });
      done.push(rel(kitSwift));
    }
    if (targets.has("kit-android") && existsSync(path.join(android, "kit"))) {
      await emitAndroidKit({ icons, palette, projectDir: android });
      done.push(rel(path.join(android, "kit")));
    }
    const pro = icons.filter((i) => i.tier === "pro").length;
    console.log(done.length ? `✔ Kit（Pro のアイコン ${pro} 個）を ${done.join("・")} に出力しました` : "Kit のパッケージがないので飛ばしました");
  }
  return 0;
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  switch (command) {
    case "validate":
      process.exitCode = await runValidate();
      return;
    case "generate":
      process.exitCode = await runGenerate(args);
      return;
    default:
      console.error(`使い方: dotwear-generator validate | generate [icons] [tokens] [brand] [swift] [android] [kit | kit-web kit-swift kit-android]\n不明なコマンド: ${command ?? "(なし)"}`);
      process.exitCode = 2;
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
