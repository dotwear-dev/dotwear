// 検索エンジン向け。サイトマップの場所を伝える。開発用の検査ページ（/dev/）は公開するサイトに含めない（site.yml で消す）
import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL("sitemap-index.xml", site)}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
