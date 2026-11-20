// 公開するサイトの <head> とサイト全体のファイルの検査：favicon・OGP・canonical・サイトマップ・robots.txt・404。
// アイコンの絵がロゴのマス目と一致することは、ジェネレーターのテスト（tools/generator/test/site-icons.test.ts）が見ている
import { expect, test } from "@playwright/test";

const SITE = "https://dotwear.dev";

/** サイトマップに載っているページのパス（/dev/ と 404 は載せない） */
async function sitemapPaths(request: import("@playwright/test").APIRequestContext): Promise<string[]> {
  const xml = await (await request.get("/sitemap-0.xml")).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname);
}

test("サイトマップは公開するページだけを載せ、robots.txt から辿れる", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
  expect((await request.get("/sitemap-index.xml")).status()).toBe(200);
  const paths = await sitemapPaths(request);
  expect(paths).toContain("/");
  expect(paths).toContain("/icons/");
  expect(paths.filter((p) => p.startsWith("/dev/") || p.includes("404"))).toEqual([]);
});

test("すべてのページに canonical・favicon・OGP があり、指しているファイルが開ける", async ({ page, request }) => {
  for (const pathname of await sitemapPaths(request)) {
    await page.goto(pathname);
    const head = page.locator("head");
    await expect(head.locator('link[rel="canonical"]'), pathname).toHaveAttribute("href", `${SITE}${pathname}`);
    await expect(head.locator('meta[property="og:url"]'), pathname).toHaveAttribute("content", `${SITE}${pathname}`);
    await expect(head.locator('meta[property="og:title"]'), pathname).toHaveAttribute("content", await page.title());
    await expect(head.locator('meta[property="og:description"]'), pathname).toHaveAttribute("content", /.+/);
    await expect(head.locator('meta[name="twitter:card"]'), pathname).toHaveAttribute("content", "summary_large_image");
    await expect(head.locator('meta[name="theme-color"]'), pathname).toHaveAttribute("content", /^#[0-9a-f]{6}$/);
    // 公開するページは検索に載せる
    await expect(head.locator('meta[name="robots"]'), pathname).toHaveCount(0);
  }
  // アイコンと OGP 画像は、サイトの直下で正しい種類のファイルとして配られる
  const files: Record<string, string> = {
    "/favicon.svg": "image/svg+xml",
    "/favicon-32.png": "image/png",
    "/apple-touch-icon.png": "image/png",
    "/og.png": "image/png",
  };
  for (const [file, type] of Object.entries(files)) {
    const res = await request.get(file);
    expect(res.status(), file).toBe(200);
    expect(res.headers()["content-type"], file).toContain(type);
  }
  await page.goto("/");
  for (const sel of ['link[rel="icon"][type="image/svg+xml"]', 'link[rel="icon"][type="image/png"]', 'link[rel="apple-touch-icon"]']) {
    const href = await page.locator(`head ${sel}`).getAttribute("href");
    expect(href && files[href], sel).toBeTruthy();
  }
  await expect(page.locator('head meta[property="og:image"]')).toHaveAttribute("content", `${SITE}/og.png`);
});

test("存在しない URL では 404 のページが出て、検索に載せない", async ({ page }) => {
  const res = await page.goto("/no-such-page/");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", "noindex");
});
