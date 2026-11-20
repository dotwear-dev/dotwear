import { describe, expect, it } from "vitest";
import { DotwearIcon, dwSave, tokens, tokenVars } from "../src/index.js";

describe("@dotwear/web", () => {
  it("トークンの値と CSS 変数の参照を export する", () => {
    expect(tokens.color.primary).toMatch(/^#[0-9a-f]{6}$/);
    expect(tokenVars.color.primary).toBe("var(--dw-color-primary)");
    expect(tokens.shape.borderWidth).toBe(1);
  });

  it("アイコン（定義と DotwearIcon）も @dotwear/web から使える", () => {
    expect(dwSave.name).toBe("save");
    expect(typeof DotwearIcon).toBe("function");
  });
});
