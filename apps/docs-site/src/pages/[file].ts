// サイトのアイコン（favicon・apple-touch-icon・OGP 画像）をサイトの直下で配る。
// 中身はジェネレーターの出力（generated/brand/site/。ロゴの元データから作る）。手で作った画像は置かない
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { APIRoute, GetStaticPaths } from "astro";

// astro dev / build は apps/docs-site で実行されるので、そこからリポジトリルートをたどる
const SITE_DIR = path.resolve(process.cwd(), "../../generated/brand/site");

const FILES = {
  "favicon.svg": "image/svg+xml",
  "favicon-32.png": "image/png",
  "apple-touch-icon.png": "image/png",
  "og.png": "image/png",
} as const;

export const getStaticPaths = (() => Object.keys(FILES).map((file) => ({ params: { file } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const file = params.file as keyof typeof FILES;
  return new Response(await readFile(path.join(SITE_DIR, file)), { headers: { "Content-Type": FILES[file] } });
};
