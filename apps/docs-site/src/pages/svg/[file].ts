// @dotwear/icons の SVG を /svg/<name>.svg として配る（コピーとダウンロード用）。
// 一覧のページに SVG の文字列を埋め込まないのは、アイコンが増えても HTML を重くしないため
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { APIRoute, GetStaticPaths } from "astro";
import { iconSvgDir } from "../../lib/source";

export const getStaticPaths = (async () => {
  const files = (await readdir(iconSvgDir())).filter((f) => f.endsWith(".svg"));
  return files.map((file) => ({ params: { file } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const svg = await readFile(path.join(iconSvgDir(), params.file!), "utf8");
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml" } });
};
