// ドキュメントのページの検査：目次のリンク切れ、ページ内のリンク先の見出し、コード例のタブの動き。
// 見た目のにじみは pixel.spec.ts が見ているので、ここでは扱わない
import { expect, test } from "@playwright/test";

test("目次のすべてのページが開け、ページ内のリンク先（#…）も存在する", async ({ page, request }) => {
  await page.goto("/");
  const hrefs = await page.locator(".site-sidebar a").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
  expect(hrefs.length).toBeGreaterThan(5);
  for (const href of hrefs) {
    expect((await request.get(href)).status(), href).toBe(200);
    await page.goto(href);
    // 本文中のサイト内リンクもたどる。#… 付きなら、その id の要素があることまで確かめる
    const links = await page.locator("main a[href^='/']").evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
    for (const link of links) {
      const [pathname, hash] = link.split("#");
      expect((await request.get(pathname!)).status(), `${href} → ${link}`).toBe(200);
      if (hash) {
        await page.goto(link);
        await expect(page.locator(`#${hash}`), `${href} → ${link}`).toHaveCount(1);
        await page.goto(href);
      }
    }
  }
});

test("タブを選ぶと、ページ内のすべてのタブと次のページにも引き継がれる", async ({ page }) => {
  await page.goto("/icons/usage/");
  const firstTabs = page.locator("[data-code-tabs]").first();
  await expect(firstTabs.getByRole("tab", { name: "Web (React)" })).toHaveAttribute("aria-selected", "true");

  await firstTabs.getByRole("tab", { name: "iOS (SwiftUI)" }).click();
  // ページ内のすべてのタブが SwiftUI に切り替わる
  for (const group of await page.locator("[data-code-tabs]").all()) {
    await expect(group.getByRole("tab", { name: "iOS (SwiftUI)" })).toHaveAttribute("aria-selected", "true");
    await expect(group.locator('[role="tabpanel"][data-platform="web"]')).toBeHidden();
  }

  // 別のページを開いても SwiftUI のまま
  await page.goto("/getting-started/");
  await expect(page.getByRole("tab", { name: "iOS (SwiftUI)" }).first()).toHaveAttribute("aria-selected", "true");
  // 2 つ目のタブ（最初の例）の SwiftUI のコードが見えている
  await expect(page.locator("[data-code-tabs]").nth(1).locator('[role="tabpanel"][data-platform="swift"]')).toContainText(".dotwearTheme()");
});

test("タブは矢印キーで切り替えられる", async ({ page }) => {
  await page.goto("/getting-started/");
  const group = page.locator("[data-code-tabs]").first();
  await group.getByRole("tab", { name: "Web (React)" }).focus();
  await page.keyboard.press("ArrowRight");
  const swiftTab = group.getByRole("tab", { name: "iOS (SwiftUI)" });
  await expect(swiftTab).toBeFocused();
  await expect(swiftTab).toHaveAttribute("aria-selected", "true");
});

test.describe("JavaScript が動かないとき", () => {
  test.use({ javaScriptEnabled: false });

  test("タブを出さず、すべてのプラットフォームのコードを並べる", async ({ page }) => {
    await page.goto("/getting-started/");
    const group = page.locator("[data-code-tabs]").first();
    await expect(group.getByRole("tablist", { includeHidden: true })).toBeHidden();
    await expect(group.locator('[data-platform="web"][role="tabpanel"]')).toBeVisible();
    await expect(group.locator('[data-platform="swift"][role="tabpanel"]')).toBeVisible();
  });
});
