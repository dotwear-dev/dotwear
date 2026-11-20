// React の部品（@dotwear/web）の外装が、ドットの格子どおりに描かれ、にじまないことの検査。
//
// 期待する絵は、iOS・Android と同じ決まり（角の階段・枠線・二重線・影・フォーカスリング）から計算して作る。
// CSS の描き方（box-shadow を重ねる。ADR-028）とは別の方法で作った答えと 1 ピクセルずつ比べるので、
// CSS の影の並びを間違えると失敗する。トグルの絵は Android の ShapePixelTest と同じ。
import { expect, test, type Locator, type Page } from "@playwright/test";
import { PNG } from "pngjs";

type Rgb = [number, number, number];

// 1 ドット = shape.pixel-unit（2px）
const DOT = 2;

const COLORS: Record<string, Rgb> = {
  ".": [0, 255, 0], // ページの背景（何も描かれていない）
  B: [0x18, 0x18, 0x18], // color.border・primary・danger
  G: [0xf8, 0xf8, 0xf8], // color.bg・on-primary
  D: [0xa8, 0xa8, 0xa8], // color.disabled
  F: [0x58, 0x58, 0x58], // color.focus
};

interface Chrome {
  /** 外形の大きさ（影を除く。ドット数） */
  w: number;
  h: number;
  steps: number;
  ring: number;
  /** 地の色。null なら塗らない */
  fill: string | null;
  border: string;
  /** 二重線。null なら一重 */
  inner: { gap: number; width: number; color: string } | null;
  shadow: string | null;
  focus: string | null;
  pressed?: boolean;
}

/** 角を階段にした矩形の中か（左上から右へ 1 段・上へ 1 段をくり返す形。iOS の SteppedRectangle と同じ） */
function inStepped(x: number, y: number, w: number, h: number, steps: number): boolean {
  if (x < 0 || y < 0 || x >= w || y >= h) return false;
  const s = Math.min(steps, Math.floor(Math.min(w, h) / 2));
  const dx = Math.min(x, w - 1 - x);
  const dy = Math.min(y, h - 1 - y);
  return dx + dy >= s;
}

/** 枠線（外形から width ドット内側の形を抜いたもの） */
function inBorder(x: number, y: number, w: number, h: number, steps: number, width: number): boolean {
  return (
    inStepped(x, y, w, h, steps) &&
    !inStepped(x - width, y - width, w - 2 * width, h - 2 * width, Math.max(0, steps - width))
  );
}

/**
 * 部品の周りの絵（文字の行）。範囲は外形の 1 ドット外側（フォーカスリング）から、影と沈んだ分まで。
 * 塗る順番は iOS・Android の PixelChrome と同じ：影 → 地 → 外の線 → 内の線 → フォーカスリング
 */
function expectedRows(c: Chrome): string[] {
  const dy = c.pressed ? 1 : 0;
  const rows: string[] = [];
  for (let y = -1; y <= c.h + 1; y++) {
    let row = "";
    for (let x = -1; x <= c.w + 1; x++) {
      const ly = y - dy;
      let ch = ".";
      if (c.shadow && !c.pressed && inStepped(x - 1, y - 1, c.w, c.h, c.steps)) ch = c.shadow;
      if (c.fill && inStepped(x, ly, c.w, c.h, c.steps)) ch = c.fill;
      if (inBorder(x, ly, c.w, c.h, c.steps, c.ring)) ch = c.border;
      if (c.inner && c.inner.width > 0) {
        const k = c.ring + c.inner.gap;
        if (inBorder(x - k, ly - k, c.w - 2 * k, c.h - 2 * k, Math.max(0, c.steps - k), c.inner.width)) ch = c.inner.color;
      }
      if (c.focus && inBorder(x + 1, ly + 1, c.w + 2, c.h + 2, c.steps + 1, 1)) ch = c.focus;
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}

/** 部品の外装の要素（見た目の枠を持つ要素）を探す */
function chromeOf(page: Page, name: string): Locator {
  const el = page.locator(`[data-case="${name}"]`);
  // 入力欄とトグルでは data-case は <input> に付くので、枠を描く要素をたどる
  if (name.startsWith("field")) return el.locator("xpath=ancestor::*[contains(@class,'dw-field__box')][1]");
  if (name.startsWith("switch") || name.startsWith("checkbox")) return el.locator("xpath=following-sibling::*[1]");
  return el;
}

/**
 * 要素の外側 1 ドットを含めて撮り、期待する絵と 1 ピクセルずつ比べる。
 * at を渡すとその位置を撮る（押して沈んだ要素は boundingBox も動くので、押す前の位置で撮るため）
 */
async function expectDots(page: Page, el: Locator, rows: string[], label: string, at?: { x: number; y: number }): Promise<void> {
  const dpr = await page.evaluate(() => window.devicePixelRatio);
  const box = at ?? (await el.boundingBox())!;
  // 位置と大きさは整数の CSS px（ページの組み方で揃えている）
  expect(Number.isInteger(box.x) && Number.isInteger(box.y), `${label}: 位置が整数 px ではない`).toBe(true);
  const clip = { x: box.x - DOT, y: box.y - DOT, width: rows[0]!.length * DOT, height: rows.length * DOT };
  const png = PNG.sync.read(await page.screenshot({ clip, fullPage: true }));
  const cell = DOT * dpr;
  const bad: string[] = [];
  for (let py = 0; py < png.height; py++) {
    for (let px = 0; px < png.width; px++) {
      const ch = rows[Math.floor(py / cell)]![Math.floor(px / cell)]!;
      const want = COLORS[ch]!;
      const i = (py * png.width + px) * 4;
      const got: Rgb = [png.data[i]!, png.data[i + 1]!, png.data[i + 2]!];
      if (got.some((v, k) => v !== want[k])) bad.push(`(${px}, ${py}) = ${got.join(",")}、期待は ${ch}`);
    }
  }
  expect(bad.slice(0, 5), `${label}: ${bad.length} ピクセルが違う\n${rows.join("\n")}`).toEqual([]);
}

/** 要素の大きさ（ドット数）から、影の分を除いた外形の大きさを求める */
async function sizeOf(el: Locator, shadow: boolean): Promise<{ w: number; h: number }> {
  const box = (await el.boundingBox())!;
  const s = shadow ? 1 : 0;
  return { w: box.width / DOT - s, h: box.height / DOT - s };
}

const DOUBLE = (color: string) => ({ gap: 1, width: 1, color });

test.describe("部品の外装がドットの格子どおりに描かれる", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dev/components-test/");
  });

  const buttons: { name: string; chrome: Omit<Chrome, "w" | "h">; shadow: boolean }[] = [
    { name: "btn-primary", shadow: true, chrome: { steps: 1, ring: 1, fill: "B", border: "B", inner: DOUBLE("G"), shadow: "B", focus: null } },
    { name: "btn-secondary", shadow: true, chrome: { steps: 1, ring: 1, fill: "G", border: "B", inner: DOUBLE("B"), shadow: "B", focus: null } },
    { name: "btn-danger", shadow: true, chrome: { steps: 1, ring: 1, fill: "B", border: "B", inner: DOUBLE("G"), shadow: "B", focus: null } },
    { name: "btn-ghost", shadow: false, chrome: { steps: 1, ring: 1, fill: null, border: "B", inner: DOUBLE("B"), shadow: null, focus: null } },
    { name: "btn-small", shadow: true, chrome: { steps: 1, ring: 1, fill: "G", border: "B", inner: DOUBLE("B"), shadow: "B", focus: null } },
    { name: "btn-large", shadow: true, chrome: { steps: 2, ring: 2, fill: "G", border: "B", inner: DOUBLE("B"), shadow: "B", focus: null } },
    // 無効：影はないが、影の場所はとったまま（押せるボタンと並べたときに揃うように）
    { name: "btn-disabled", shadow: true, chrome: { steps: 1, ring: 1, fill: "G", border: "D", inner: DOUBLE("D"), shadow: null, focus: null } },
    { name: "card", shadow: true, chrome: { steps: 1, ring: 1, fill: "G", border: "B", inner: DOUBLE("B"), shadow: "B", focus: null } },
    { name: "card-flat", shadow: false, chrome: { steps: 1, ring: 1, fill: "G", border: "B", inner: DOUBLE("B"), shadow: null, focus: null } },
    { name: "card-single", shadow: true, chrome: { steps: 1, ring: 1, fill: "G", border: "B", inner: null, shadow: "B", focus: null } },
    { name: "field", shadow: false, chrome: { steps: 1, ring: 1, fill: "G", border: "B", inner: DOUBLE("B"), shadow: null, focus: null } },
    // エラーの枠は color.danger（4 階調では黒。エラーは文言で伝える）
    { name: "field-error", shadow: false, chrome: { steps: 1, ring: 1, fill: "G", border: "B", inner: DOUBLE("B"), shadow: null, focus: null } },
  ];

  for (const { name, chrome, shadow } of buttons) {
    test(name, async ({ page }) => {
      const el = chromeOf(page, name);
      const size = await sizeOf(el, shadow);
      await expectDots(page, el, expectedRows({ ...chrome, ...size }), name);
    });
  }

  test("ボタンとカードの大きさは仕様どおり（文字なしのとき）", async ({ page }) => {
    // 幅は左右の余白だけ、高さは最小値（small 12・medium 16・large 20）
    expect(await sizeOf(chromeOf(page, "btn-secondary"), true)).toEqual({ w: 12, h: 16 });
    expect(await sizeOf(chromeOf(page, "btn-small"), true)).toEqual({ w: 8, h: 12 });
    expect(await sizeOf(chromeOf(page, "btn-large"), true)).toEqual({ w: 16, h: 20 });
    // カード：中身が空なら余白 6 ドット × 2
    expect(await sizeOf(chromeOf(page, "card"), true)).toEqual({ w: 12, h: 12 });
  });

  test("キーボードでフォーカスすると、外の線の 1 ドット外側にフォーカスリング", async ({ page }) => {
    const el = chromeOf(page, "btn-focus");
    await el.focus();
    expect(await el.evaluate((e) => e.matches(":focus-visible"))).toBe(true);
    const size = await sizeOf(el, true);
    const chrome = { steps: 1, ring: 1, fill: "G", border: "B", inner: DOUBLE("B"), shadow: "B", focus: "F" };
    await expectDots(page, el, expectedRows({ ...chrome, ...size }), "btn-focus");
  });

  test("押している間は影が消え、本体が 1 ドット沈む", async ({ page }) => {
    const el = chromeOf(page, "btn-secondary");
    const size = await sizeOf(el, true);
    const box = (await el.boundingBox())!;
    await page.mouse.move(box.x + 4, box.y + 4);
    await page.mouse.down();
    const chrome = { steps: 1, ring: 1, fill: "G", border: "B", inner: DOUBLE("B"), shadow: "B", focus: null, pressed: true };
    await expectDots(page, el, expectedRows({ ...chrome, ...size }), "btn-pressed", box);
    await page.mouse.up();
  });

  // トグルの本体（Android の ShapePixelTest と同じ絵に、外側 1 ドットの余白を足したもの）
  const pad = (rows: string[]) => {
    const w = rows[0]!.length + 2;
    return [".".repeat(w), ...rows.map((r) => `.${r}.`), ".".repeat(w)];
  };
  const toggles: Record<string, string[]> = {
    // オフ：地は bg、つまみは左で 1 ドットの線だけの四角（border の色）。オン：地は primary、つまみ（on-primary）が右で塗りつぶし。
    // 4 階調では primary と border が同じ黒、on-primary と bg が同じ白なので、オフのつまみも塗りつぶすとオンと同じ絵になってしまう
    "switch-off": [".BBBBBBBBBBBB..", "BBBBBBBGGGGGGB.", ...Array<string>(4).fill("BBGGGGBGGGGGGBB"), "BBBBBBBGGGGGGBB", ".BBBBBBBBBBBBBB", "..BBBBBBBBBBBB."],
    "switch-on": [".BBBBBBBBBBBB..", "BBBBBBBGGGGGGB.", ...Array<string>(5).fill("BBBBBBBGGGGGGBB"), ".BBBBBBBBBBBBBB", "..BBBBBBBBBBBB."],
    "checkbox-off": [".BBBBBB..", "BGGGGGGB.", ...Array<string>(5).fill("BGGGGGGBB"), ".BBBBBBBB", "..BBBBBB."],
    "checkbox-on": [".BBBBBB..", "BBBBBBBB.", "BBBBBBGBB", "BBBBBGGBB", "BGBBGGBBB", "BGGGGBBBB", "BBGGBBBBB", ".BBBBBBBB", "..BBBBBB."],
    // 無効でオン：地は disabled、チェックは bg、影なし（影の場所はとる）
    "checkbox-disabled-on": [".DDDDDD..", "DDDDDDDD.", "DDDDDDGD.", "DDDDDGGD.", "DGDDGGDD.", "DGGGGDDD.", "DDGGDDDD.", ".DDDDDD..", "........."],
  };

  for (const [name, rows] of Object.entries(toggles)) {
    test(name, async ({ page }) => {
      await expectDots(page, chromeOf(page, name), pad(rows), name);
    });
  }
});

test("部品の見た目が前回から変わっていない", async ({ page }) => {
  await page.goto("/dev/components-test/");
  // 文字は OS ごとに描かれ方が違う（macOS と CI の Linux で画像が変わる）ので、隠して撮る
  await expect(page.locator("#components-test")).toHaveScreenshot("components-test.png", {
    mask: [page.locator(".dw-field__label, .dw-field__error")],
  });
});

test.describe("標準の要素なので、キーボードとラベルの操作がそのまま効く", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dev/components-test/");
  });

  // Safari（WebKit）は標準の設定では Tab でボタンに止まらず、Option + Tab で止まる（ブラウザの仕様）
  const tabKey = (browserName: string) => (browserName === "webkit" ? "Alt+Tab" : "Tab");

  test("Tab で最初のボタンにフォーカスが移り、フォーカスリングの条件（:focus-visible）を満たす", async ({ page, browserName }) => {
    await page.keyboard.press(tabKey(browserName));
    const focused = page.locator('[data-case="btn-primary"]');
    await expect(focused).toBeFocused();
    expect(await focused.evaluate((e) => e.matches(":focus-visible"))).toBe(true);
  });

  test("無効のボタンには Tab で止まらない", async ({ page, browserName }) => {
    await page.locator('[data-case="btn-large"]').focus();
    await page.keyboard.press(tabKey(browserName));
    await expect(page.locator('[data-case="btn-focus"]')).toBeFocused();
  });

  test("スイッチは Space で切り替わり、role=switch の状態として読める", async ({ page }) => {
    const sw = page.getByRole("switch", { name: "off" });
    await sw.focus();
    await expect(sw).not.toBeChecked();
    await page.keyboard.press("Space");
    await expect(sw).toBeChecked();
  });

  test("チェックボックスは本体を押しても切り替わる（<label> で包んでいるため）", async ({ page }) => {
    const box = page.getByRole("checkbox", { name: "off" });
    await page.locator('[data-case="checkbox-off"] + .dw-toggle__control').click();
    await expect(box).toBeChecked();
  });

  test("入力欄はラベルの名前で見つかり、エラーは説明として読める", async ({ page }) => {
    const field = page.locator('[data-case="field-error"]');
    await expect(field).toHaveAccessibleName("a");
    await expect(field).toHaveAccessibleDescription("e");
    await expect(field).toHaveAttribute("aria-invalid", "true");
  });
});

test("入力欄は、文字の幅が広いフォントでも指定した幅からはみ出さない", async ({ page }) => {
  await page.goto("/dev/components-test/");
  // 幅の広いフォントにして、<input> の固有の幅（20 文字分）が 200px を超えるようにする
  await page.addStyleTag({ content: ".dw-field { font-size: 32px; }" });
  const field = page.locator('[data-case="field"]').locator("xpath=ancestor::*[contains(@class,'dw-field')][last()]");
  const box = page.locator('[data-case="field"]').locator("xpath=ancestor::*[contains(@class,'dw-field__box')][1]");
  expect((await field.boundingBox())!.width).toBe(200);
  expect((await box.boundingBox())!.width).toBe(200);
});
