// ブラウザでの表示がにじまないことの検査（Phase 1 の受け入れ条件「32px 表示がにじまずに表示される」）。
//
// 主な検査はピクセルの比較：アイコンの要素を撮り、各ピクセルが「元データのマス目から計算した色」と
// 完全に一致することを確かめる。中間の色（アンチエイリアス）が 1 ピクセルでもあれば失敗する。
// OS のフォント描画などに左右されないので、macOS と CI（Linux）で同じ結果になる。
// toHaveScreenshot は、意図しない見た目の変化に気づくための補助として使う。
import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { PNG } from "pngjs";

const ROOT = path.resolve(process.cwd(), "../..");

type Rgb = [number, number, number];

async function loadGrid(name: string, grid: string): Promise<string[]> {
  const json = JSON.parse(await readFile(path.join(ROOT, "icons", name, "icon.json"), "utf8")) as {
    sizes: Record<string, string[]>;
  };
  return json.sizes[grid]!;
}

async function loadPaletteDefault(): Promise<Record<string, Rgb>> {
  const json = JSON.parse(await readFile(path.join(ROOT, "tokens", "palette.json"), "utf8")) as {
    palette: { default: Record<string, { $value: string }> };
  };
  return Object.fromEntries(Object.entries(json.palette.default).map(([slot, t]) => [slot, hexToRgb(t.$value)]));
}

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function parseCssRgb(css: string): Rgb {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(css);
  if (!m) throw new Error(`色を読めません: ${css}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/**
 * アイコンの周りを撮り、マス目から期待される絵と 1 ピクセルずつ比べる。
 *
 * 実際のページでは、文字の行の高さや中央寄せのせいで、アイコンが小数の位置（例：x = 156.5）に置かれる。
 * ブラウザはそれをデバイスピクセルに揃えて描くので、どちらに揃えたかはブラウザ次第になる。
 * そこで要素の周りを 1 px 余分に撮り、「期待どおりの絵がぴったり重なる位置」を探す。
 * 重なる位置が見つからなければ、にじみか形の崩れがあるということなので失敗にする。
 */
async function expectPixelPerfect(page: Page, svg: Locator, background: Rgb): Promise<void> {
  const name = (await svg.getAttribute("data-name"))!;
  const gridSize = Number(await svg.getAttribute("data-grid"));
  const grid = await loadGrid(name, String(gridSize));
  const palette = await loadPaletteDefault();
  const fg = parseCssRgb(await svg.evaluate((el) => getComputedStyle(el).color));
  const dpr = await page.evaluate(() => window.devicePixelRatio);

  await svg.scrollIntoViewIfNeeded();
  const box = (await svg.boundingBox())!;
  // 1 マスのデバイスピクセル数が整数であること（scale と端末の倍率の掛け算が整数倍になっている）
  const cell = (box.width / gridSize) * dpr;
  expect(Number.isInteger(cell), `${name}: 1 マスが ${cell} デバイスピクセルです（整数倍ではない）`).toBe(true);
  const iconPx = gridSize * cell;

  // 要素の外側に 1 CSS px ずつ余白をとって撮る（座標は整数の CSS px にそろえる）
  const clip = { x: Math.floor(box.x) - 1, y: Math.floor(box.y) - 1, width: Math.ceil(box.width) + 3, height: Math.ceil(box.height) + 3 };
  const png = PNG.sync.read(await page.screenshot({ clip }));
  const at = (x: number, y: number): Rgb => {
    const i = (y * png.width + x) * 4;
    return [png.data[i]!, png.data[i + 1]!, png.data[i + 2]!];
  };
  const same = (a: Rgb, b: Rgb) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  const expectedAt = (gx: number, gy: number): Rgb => {
    const ch = grid[gy]![gx]!;
    return ch === "." ? background : ch === "#" ? fg : palette[ch]!;
  };

  // 撮った画像の中で、アイコンの左上がありうる位置をすべて試す
  let best = { mismatches: Infinity, detail: "" };
  for (let oy = 0; oy + iconPx <= png.height; oy++) {
    for (let ox = 0; ox + iconPx <= png.width; ox++) {
      let mismatches = 0;
      let detail = "";
      for (let y = 0; y < png.height && mismatches <= best.mismatches; y++) {
        for (let x = 0; x < png.width; x++) {
          const inside = x >= ox && x < ox + iconPx && y >= oy && y < oy + iconPx;
          const expected = inside ? expectedAt(Math.floor((x - ox) / cell), Math.floor((y - oy) / cell)) : background;
          const actual = at(x, y);
          if (!same(actual, expected)) {
            if (mismatches === 0) detail = `(${x}, ${y}) 期待 ${expected.join(",")} / 実際 ${actual.join(",")}`;
            mismatches++;
          }
        }
      }
      if (mismatches < best.mismatches) best = { mismatches, detail };
      if (mismatches === 0) return;
    }
  }
  expect(best.mismatches, `${name}（${gridSize}）がマス目どおりに描かれていません。最も近い位置でも ${best.mismatches} ピクセル不一致: ${best.detail}`).toBe(0);
}

test.describe("検査用ページ（全アイコン × 全グリッド、2 倍）", () => {
  test("すべてのアイコンがマス目どおりに描かれ、にじまない", async ({ page }) => {
    await page.goto("/dev/pixel-test/");
    const icons = page.locator("#pixel-test svg");
    const count = await icons.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expectPixelPerfect(page, icons.nth(i), [255, 255, 255]);
    }
  });

  test("見た目が前回から変わっていない", async ({ page }) => {
    await page.goto("/dev/pixel-test/");
    await expect(page.locator("#pixel-test")).toHaveScreenshot("pixel-test.png");
  });
});

test.describe("アイコン一覧（実際のサイトのレイアウト）", () => {
  // ウィンドウの幅が奇数でも、中央寄せのせいで小数の位置にずれないことを確かめる
  for (const width of [1280, 1281]) {
    test(`幅 ${width}px で、32px 表示がにじまない`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/icons/");
      // 読み込み後に React が有効になるまで待つ（表示倍率の初期値は 2 倍 = 32px）
      await expect(page.getByRole("button", { name: "2×" })).toHaveAttribute("aria-pressed", "true");
      const items = page.locator(".gallery-item svg");
      const count = await items.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const svg = items.nth(i);
        // 一覧の SVG にはテスト用の属性がないので、ボタンの名前から元データを引けるように付ける
        const name = await svg.locator("xpath=..").locator("span").textContent();
        await svg.evaluate((el, n) => {
          el.setAttribute("data-name", n!);
          el.setAttribute("data-grid", "16");
        }, name);
        // 背景はトークンで決まる（白ではない）ので、アイコンを囲む箱の実際の色を使う
        const background = parseCssRgb(await svg.evaluate((el) => getComputedStyle(el.closest(".gallery-item")!).backgroundColor));
        await expectPixelPerfect(page, svg, background);
      }
    });
  }
});
