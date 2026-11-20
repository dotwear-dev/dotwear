// React の部品が出す HTML とアクセシビリティの属性（見た目のピクセルは docs-site の e2e で確かめる）
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DotwearButton, DotwearCard, DotwearTextField, DotwearToggle, dwSave } from "../src/index.js";

const html = (el: React.ReactElement) => renderToStaticMarkup(el);

describe("DotwearButton", () => {
  it("標準の <button> で、既定は primary・medium・type=button", () => {
    const out = html(<DotwearButton>保存</DotwearButton>);
    expect(out).toMatch(/^<button type="button" class="dw-chrome dw-button dw-button--primary dw-button--medium"/);
    expect(out).toContain(">保存<");
  });

  it("large は 2 段・2 ドットの外装にする", () => {
    expect(html(<DotwearButton size="large">保存</DotwearButton>)).toContain("dw-chrome--thick");
  });

  it("アイコンは装飾として読み上げない（ラベルは文字で伝える）", () => {
    const out = html(<DotwearButton icon={dwSave}>保存</DotwearButton>);
    expect(out).toContain('aria-hidden="true"');
    expect(out).toContain("<svg");
  });

  it("読み込み中は aria-busy を付け、3 つのドットは読み上げない", () => {
    const out = html(<DotwearButton loading>保存</DotwearButton>);
    expect(out).toContain('aria-busy="true"');
    expect(out).toContain('<span class="dw-button__dots" aria-hidden="true">');
  });

  it("disabled と送信ボタンは標準の属性のまま", () => {
    expect(html(<DotwearButton disabled>保存</DotwearButton>)).toContain("disabled");
    expect(html(<DotwearButton type="submit">送信</DotwearButton>)).toContain('type="submit"');
  });
});

describe("DotwearCard", () => {
  it("<div> の入れ物で、flat は影なし", () => {
    expect(html(<DotwearCard>中身</DotwearCard>)).toBe('<div class="dw-chrome dw-card">中身</div>');
    expect(html(<DotwearCard variant="flat" />)).toContain("dw-card--flat");
  });
});

describe("DotwearTextField", () => {
  it("<label for> で入力欄に名前を付ける", () => {
    const out = html(<DotwearTextField id="mail" label="メール" value="" onChange={() => {}} />);
    expect(out).toContain('<label class="dw-field__label" for="mail">メール</label>');
    expect(out).toContain('id="mail"');
    expect(out).not.toContain("aria-invalid");
  });

  it("エラーは aria-invalid と aria-describedby で入力欄に関連づける", () => {
    const out = html(<DotwearTextField id="mail" label="メール" error="形式が正しくありません" aria-describedby="hint" />);
    expect(out).toContain('aria-invalid="true"');
    expect(out).toContain('aria-describedby="hint mail-error"');
    expect(out).toContain('<p id="mail-error" class="dw-field__error">形式が正しくありません</p>');
    expect(out).toContain("dw-field--error");
  });

  it("id がなくても、ラベルと入力欄を自動の id で結ぶ", () => {
    const out = html(<DotwearTextField label="名前" />);
    const forId = /for="([^"]+)"/.exec(out)![1];
    expect(out).toContain(`id="${forId}"`);
  });
});

describe("DotwearToggle", () => {
  it("スイッチは role=switch の checkbox を <label> で包む", () => {
    const out = html(<DotwearToggle checked onChange={() => {}}>Wi-Fi</DotwearToggle>);
    expect(out).toMatch(/^<label class="dw-toggle dw-toggle--switch">/);
    expect(out).toContain('type="checkbox" role="switch"');
    expect(out).toContain("checked");
    expect(out).toContain('<span class="dw-toggle__label">Wi-Fi</span>');
  });

  it("チェックボックスは role を付けない（標準の checkbox のまま）", () => {
    expect(html(<DotwearToggle variant="checkbox">同意する</DotwearToggle>)).not.toContain("role=");
  });

  it("見た目の部品は読み上げず、入力欄のすぐ後ろに置く（CSS の + で状態を見るため）", () => {
    const out = html(<DotwearToggle>Wi-Fi</DotwearToggle>);
    expect(out).toMatch(/<input[^>]*\/><span class="dw-chrome dw-toggle__control" aria-hidden="true"><\/span>/);
  });
});
