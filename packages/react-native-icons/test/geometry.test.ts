// pixel-roundtrip の React Native 版：View で描く矩形が、元データ（icons/<name>/icon.json）のマス目と 1 マスずつ一致し、
// どの画面の倍率でも矩形の境界が物理ピクセルの境界に乗ることを確かめる（CLAUDE.md 最重要ルール 2）
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { byName, type DotwearIconDefinition, type DotwearIconGrid } from "@dotwear/icons";
import { dotwearCellPx, layerRects } from "../src/geometry.js";

const ICONS_DIR = path.resolve(__dirname, "../../../icons");

interface IconSource {
  name: string;
  sizes: Partial<Record<string, string[]>>;
}

const sources: IconSource[] = readdirSync(ICONS_DIR).map(
  (dir) => JSON.parse(readFileSync(path.join(ICONS_DIR, dir, "icon.json"), "utf8")) as IconSource,
);

/** 矩形の並びを、元データと同じ文字列のマス目に戻す（重なりがあれば失敗させる） */
function paint(def: DotwearIconDefinition, grid: DotwearIconGrid): string[] {
  const rows = Array.from({ length: grid }, () => Array.from({ length: grid }, () => "."));
  for (const layer of def.grids[grid] ?? []) {
    for (const r of layerRects(layer)) {
      for (let y = r.y; y < r.y + r.height; y++) {
        for (let x = r.x; x < r.x + r.width; x++) {
          if (rows[y]![x] !== ".") throw new Error(`${def.name}: (${x},${y}) を 2 回塗っています`);
          rows[y]![x] = layer.color;
        }
      }
    }
  }
  return rows.map((row) => row.join(""));
}

describe("layerRects（pixel-roundtrip）", () => {
  it("アイコンの元データがある", () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  for (const source of sources) {
    for (const [size, expected] of Object.entries(source.sizes)) {
      it(`${source.name} の ${size}×${size} が元データと一致する`, () => {
        const def = (byName as Record<string, DotwearIconDefinition>)[source.name];
        expect(def).toBeDefined();
        expect(paint(def!, Number(size) as DotwearIconGrid)).toEqual(expected);
      });
    }
  }

  it("生成物ではない定義（重なった矩形や穴のあるパス）も、SVG の nonzero と同じに塗る", () => {
    // 外側を時計回り、内側を反時計回りに描くと穴になる。同じ向きの重なりは 1 回だけ塗る
    const def: DotwearIconDefinition = {
      prefix: "x",
      name: "hole",
      grids: { 16: [{ color: "#", d: "M0 0h4v4h-4zM1 1v2h2v-2zM0 0h2v1h-2z" }] },
    };
    expect(paint(def, 16).slice(0, 5)).toEqual([
      "####............",
      "#..#............",
      "#..#............",
      "####............",
      "................",
    ]);
  });

  it("使えない命令（斜めの線）はエラーにする", () => {
    expect(() => layerRects({ color: "#", d: "M0 0L4 4z" })).toThrow(/使えない命令/);
  });
});

describe("dotwearCellPx（ADR-019 と同じ規則）", () => {
  it.each([
    [1, 1, 1],
    [1, 1.5, 1],
    [2, 1.5, 3],
    [1, 2, 2],
    [1, 2.625, 2],
    [2, 2.625, 5],
    [4, 2.625, 10],
    [1, 3, 3],
    [3, 3.5, 10],
    [1, 0.75, 1],
  ])("scale %d・倍率 %d のとき 1 マスは %d px", (scale, ratio, expected) => {
    expect(dotwearCellPx(scale, ratio)).toBe(expected);
  });

  it.each([1, 1.5, 2, 2.625, 2.75, 3, 3.5, 4])("倍率 %d で、どの矩形の端も整数の物理ピクセルになる", (ratio) => {
    for (const scale of [1, 2, 3, 4]) {
      const cellPx = dotwearCellPx(scale, ratio);
      for (const def of Object.values(byName) as DotwearIconDefinition[]) {
        for (const layer of def.grids[16]) {
          for (const r of layerRects(layer)) {
            // DotwearIcon と同じく、dp = マス × 1 マスの px ÷ 倍率。それを物理ピクセルに戻すと整数になる
            for (const cells of [r.x, r.y, r.x + r.width, r.y + r.height]) {
              const px = ((cells * cellPx) / ratio) * ratio;
              expect(Math.abs(px - Math.round(px))).toBeLessThan(1e-6);
            }
          }
        }
      }
    }
  });
});
