// フォント（fonts/、ADR-026）を各パッケージにコピーする。
// 元データは fonts/ だけにして、パッケージの中のフォントは生成物として扱う（git に入れない）。
// ライセンス（OFL）は、フォントを配るときに一緒に入れる決まりなので、必ず同じ場所にコピーする
import { copyFile, mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { GENERATED_HEADER } from "./svg.js";

/** 配るフォント（fonts/ の下のフォルダ名） */
export const BUNDLED_FONTS = ["DotGothic16"] as const;

export interface EmitFontsOptions {
  root: string;
  /** コピー先。この直下にフォントのファイルと <フォント名>-OFL.txt を置く */
  outDir: string;
}

export async function emitFonts({ root, outDir }: EmitFontsOptions): Promise<string[]> {
  await mkdir(outDir, { recursive: true });
  const copied: string[] = [];
  for (const font of BUNDLED_FONTS) {
    const src = path.join(root, "fonts", font);
    const files = await readdir(src);
    if (!files.includes("OFL.txt")) throw new Error(`fonts/${font}/OFL.txt がありません（ライセンス文なしでは配れません）`);
    for (const f of files.filter((f) => /\.(ttf|otf)$/.test(f))) {
      await copyFile(path.join(src, f), path.join(outDir, f));
      copied.push(f);
    }
    await copyFile(path.join(src, "OFL.txt"), path.join(outDir, `${font}-OFL.txt`));
  }
  return copied;
}

export interface EmitWebFontsOptions {
  root: string;
  /** packages/web/generated。この下に fonts/ と fonts.css を出す */
  outDir: string;
}

/**
 * Web 用：フォントを <outDir>/fonts/ にコピーし、@font-face を書いた <outDir>/fonts.css を出す。
 * 利用者は `import "@dotwear/web/fonts.css"` だけで DotGothic16 が使えるようになる（URL はバンドラーが解決する）
 */
export async function emitWebFonts({ root, outDir }: EmitWebFontsOptions): Promise<void> {
  const copied = await emitFonts({ root, outDir: path.join(outDir, "fonts") });
  const faces = copied.map((file) => {
    const family = file.replace(/-[^-]+\.(ttf|otf)$/, "");
    const format = file.endsWith(".otf") ? "opentype" : "truetype";
    return [
      "@font-face {",
      `  font-family: "${family}";`,
      `  src: url("./fonts/${file}") format("${format}");`,
      // 太さの範囲を 100〜900 と宣言し、bold でもこの 1 つの書体を使わせる。
      // 太さが足りないとブラウザが太字を合成し、ドットの境界がにじむため（ADR-026）
      "  font-weight: 100 900;",
      "  font-style: normal;",
      "  font-display: swap;",
      "}",
    ].join("\n");
  });
  await writeFile(
    path.join(outDir, "fonts.css"),
    [
      `/* ${GENERATED_HEADER} */`,
      // 配布物の利用者が読むので英語で書く
      "/* Font license: see fonts/*-OFL.txt (SIL Open Font License 1.1) */",
      ...faces,
      "",
    ].join("\n"),
  );
}

export interface EmitAndroidFontsOptions {
  root: string;
  /** packages/android/compose/src/generated。この下の res/font/ と assets/licenses/ を作り直す */
  outDir: string;
}

/** Android のリソース名にする（小文字・数字・_ だけ。DotGothic16-Regular.ttf → dotgothic16_regular.ttf） */
export function androidFontResourceName(file: string): string {
  const ext = path.extname(file);
  return `${path.basename(file, ext).toLowerCase().replace(/[^a-z0-9]+/g, "_")}${ext}`;
}

/**
 * Android 用：フォントを res/font/ に（R.font.dotgothic16_regular で引ける）、
 * ライセンス文を assets/licenses/ に置く（res/font には .txt を置けないため。assets は AAR に入る）
 */
export async function emitAndroidFonts({ root, outDir }: EmitAndroidFontsOptions): Promise<string[]> {
  const fontDir = path.join(outDir, "res", "font");
  const licenseDir = path.join(outDir, "assets", "licenses");
  await rm(fontDir, { recursive: true, force: true });
  await rm(licenseDir, { recursive: true, force: true });
  await mkdir(licenseDir, { recursive: true });
  // いったん元の名前でコピーしてから、リソース名に付け替える
  const copied = await emitFonts({ root, outDir: fontDir });
  const renamed: string[] = [];
  for (const f of copied) {
    const name = androidFontResourceName(f);
    await rename(path.join(fontDir, f), path.join(fontDir, name));
    renamed.push(name);
  }
  for (const font of BUNDLED_FONTS) {
    await rename(path.join(fontDir, `${font}-OFL.txt`), path.join(licenseDir, `${font}-OFL.txt`));
  }
  return renamed;
}
