// dotwear.dev のドキュメントサイト（ADR-016）。
// どこにでも置けるように静的な HTML として出力する
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://dotwear.dev",
  output: "static",
  // HTML を圧縮すると、改行をはさんだ「文字 <code>」の間の空白が消えて単語がくっつくので、圧縮しない
  compressHTML: false,
  integrations: [
    react(),
    // 開発用の検査ページ（/dev/）と 404 はサイトマップに載せない（/dev/ は公開するサイトからも消す。site.yml）
    sitemap({ filter: (page) => !page.includes("/dev/") && !page.endsWith("/404/") }),
  ],
});
