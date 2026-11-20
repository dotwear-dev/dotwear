import { describe, expect, it } from "vitest";
import { gridToRects, rectsToGrid, rectsToPath } from "../src/paths/rects.js";

// グリッドを矩形にして塗り戻すと、元と一致することを確かめる（重なり・抜け・はみ出しは rectsToGrid が例外にする）
function roundtrip(grid: string[]): string[] {
  return rectsToGrid(gridToRects(grid), grid.length);
}

function countRects(grid: string[]): number {
  return [...gridToRects(grid).values()].reduce((n, list) => n + list.length, 0);
}

const fill = (size: number, ch = "#") => Array.from({ length: size }, () => ch.repeat(size));

describe("gridToRects", () => {
  it("すべて透明なら矩形はない", () => {
    expect(gridToRects(fill(4, ".")).size).toBe(0);
  });

  it("すべて塗られていれば 1 つの矩形になる", () => {
    expect(gridToRects(fill(16))).toEqual(new Map([["#", [{ x: 0, y: 0, w: 16, h: 16 }]]]));
  });

  it("同じ幅で縦に続く行は 1 つにまとめる", () => {
    const grid = ["....", ".##.", ".##.", "...."];
    expect(gridToRects(grid).get("#")).toEqual([{ x: 1, y: 1, w: 2, h: 2 }]);
  });

  it("L 字は 2 つの矩形になり、元に戻せる", () => {
    const grid = ["#...", "#...", "#...", "####"];
    expect(countRects(grid)).toBe(2);
    expect(roundtrip(grid)).toEqual(grid);
  });

  it("市松模様は 1 マスずつの矩形になり、元に戻せる", () => {
    const grid = Array.from({ length: 8 }, (_, y) =>
      Array.from({ length: 8 }, (_, x) => ((x + y) % 2 === 0 ? "#" : ".")).join(""),
    );
    expect(countRects(grid)).toBe(32);
    expect(roundtrip(grid)).toEqual(grid);
  });

  it("色ごとに分け、# → 2 → 3 … の順に並べる", () => {
    const grid = ["33##", "22##", "....", "2..3"];
    const rects = gridToRects(grid);
    expect([...rects.keys()]).toEqual(["#", "2", "3"]);
    expect(roundtrip(grid)).toEqual(grid);
  });

  it("隣り合う別の色は混ざらない", () => {
    const grid = ["#2#2", "#2#2", "2#2#", "2#2#"];
    expect(roundtrip(grid)).toEqual(grid);
  });
});

describe("rectsToPath", () => {
  it("M x y h w v h h -w z の形で、整数だけを使う", () => {
    expect(rectsToPath([{ x: 1, y: 2, w: 3, h: 4 }, { x: 0, y: 0, w: 1, h: 1 }])).toBe("M1 2h3v4h-3zM0 0h1v1h-1z");
  });
});
