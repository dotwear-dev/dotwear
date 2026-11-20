import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DotwearIconDefinition } from "../src/index.js";
import { byName, byPrefixAndName, dwSave } from "../src/index.js";
import { DotwearIcon } from "../src/react/index.js";

// 多色と 24 の描き分けを確かめるためのテスト用定義（実際のアイコンに依存しない）
const multi: DotwearIconDefinition<"multi"> = {
  prefix: "dw",
  name: "multi",
  grids: {
    16: [
      { color: "#", d: "M0 0h1v1h-1z" },
      { color: "2", d: "M1 0h1v1h-1z" },
    ],
    24: [{ color: "#", d: "M0 0h2v2h-2z" }],
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DotwearIcon", () => {
  it("定義オブジェクトを渡すと、グリッド × scale の大きさで描く", () => {
    const html = renderToStaticMarkup(<DotwearIcon icon={dwSave} scale={2} />);
    expect(html).toContain('width="32"');
    expect(html).toContain('height="32"');
    expect(html).toContain('viewBox="0 0 16 16"');
    expect(html).toContain('shape-rendering="crispEdges"');
    expect(html).toContain('fill="currentColor"');
  });

  it("byName で名前から選べる", () => {
    expect(byName.save).toBe(dwSave);
    expect(renderToStaticMarkup(<DotwearIcon icon={byName["save"]} />)).toBe(renderToStaticMarkup(<DotwearIcon icon={dwSave} />));
  });

  it("byPrefixAndName でプレフィックスと名前から選べる（Font Awesome と同じ形。ADR-023）", () => {
    expect(byPrefixAndName.dw["save"]).toBe(dwSave);
    expect(dwSave.prefix).toBe("dw");
    // 公開のパッケージには Free のプレフィックスしかない（Pro は Kit だけ）
    expect(Object.keys(byPrefixAndName)).toEqual(["dw"]);
  });

  it("パレットのスロットは CSS 変数で、default テーマの色をフォールバックにする", () => {
    const html = renderToStaticMarkup(<DotwearIcon icon={multi} />);
    expect(html).toMatch(/fill="var\(--dw-palette-2, #[0-9a-f]{6}\)"/);
  });

  it("描き分けがあるグリッドを選べる。ないグリッドは 16 を使う", () => {
    expect(renderToStaticMarkup(<DotwearIcon icon={multi} grid={24} />)).toContain('viewBox="0 0 24 24"');
    expect(renderToStaticMarkup(<DotwearIcon icon={dwSave} grid={24} scale={2} />)).toContain('width="32"');
  });

  it("整数でない scale は警告して切り捨てる（にじみを防ぐ）", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(renderToStaticMarkup(<DotwearIcon icon={dwSave} scale={1.5} />)).toContain('width="16"');
    expect(renderToStaticMarkup(<DotwearIcon icon={dwSave} scale={0} />)).toContain('width="16"');
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("title がなければ読み上げから外し、あれば画像として読み上げる", () => {
    expect(renderToStaticMarkup(<DotwearIcon icon={dwSave} />)).toContain('aria-hidden="true"');
    const labeled = renderToStaticMarkup(<DotwearIcon icon={dwSave} title="保存" />);
    expect(labeled).toContain('role="img"');
    expect(labeled).toContain('aria-label="保存"');
    expect(labeled).not.toContain("aria-hidden");
  });
});
