import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { formatIconJson } from "../src/model/format.ts";
import {
  emptyGrid,
  floodFill,
  initHistory,
  paintCell,
  paintLine,
  parseTags,
  pushHistory,
  redo,
  replacePresent,
  undo,
  type IconDocument,
} from "../src/model/icon.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

describe("paintCell / paintLine / floodFill", () => {
  it("1 マスを塗る。変化がなければ同じ配列を返す", () => {
    const g = emptyGrid(4);
    const painted = paintCell(g, 1, 2, "#");
    expect(painted).toEqual(["....", "....", ".#..", "...."]);
    expect(paintCell(painted, 1, 2, "#")).toBe(painted);
    expect(paintCell(g, 9, 9, "#")).toBe(g);
  });

  it("2 点の間を、マスを飛ばさずに塗る", () => {
    expect(paintLine(emptyGrid(4), { x: 0, y: 0 }, { x: 3, y: 3 }, "#")).toEqual(["#...", ".#..", "..#.", "...#"]);
    expect(paintLine(emptyGrid(4), { x: 0, y: 1 }, { x: 3, y: 1 }, "2")).toEqual(["....", "2222", "....", "...."]);
  });

  it("塗りつぶしは上下左右につながった同じ文字だけを変える", () => {
    const g = ["#...", "#.#.", "##..", "...."];
    expect(floodFill(g, 1, 0, "2")).toEqual(["#222", "#2#2", "##22", "2222"]);
    expect(floodFill(g, 0, 0, "3")).toEqual(["3...", "3.#.", "33..", "...."]);
  });
});

describe("履歴", () => {
  it("積む・戻す・やり直す。1 回のドラッグは replacePresent で 1 手順にまとめる", () => {
    let h = initHistory("a");
    h = pushHistory(h, "b");
    h = replacePresent(h, "b2");
    h = pushHistory(h, "c");
    expect(h.present).toBe("c");
    h = undo(h);
    expect(h.present).toBe("b2");
    h = undo(h);
    expect(h.present).toBe("a");
    expect(undo(h)).toBe(h);
    h = redo(redo(h));
    expect(h.present).toBe("c");
    expect(pushHistory(h, "c")).toBe(h);
  });
});

describe("parseTags", () => {
  it("「,」と「、」で区切り、空と重複を除く", () => {
    expect(parseTags(" save, 保存、disk ,, save")).toEqual(["save", "保存", "disk"]);
  });
});

describe("formatIconJson", () => {
  it("リポジトリのすべての icon.json を、1 文字も変えずに書き出せる（保存しても無関係な差分が出ない）", async () => {
    for (const collection of ["icons", "brand"]) {
      const dir = path.join(ROOT, collection);
      for (const name of await readdir(dir)) {
        const text = await readFile(path.join(dir, name, "icon.json"), "utf8");
        expect(formatIconJson(JSON.parse(text) as IconDocument), `${collection}/${name}`).toBe(text);
      }
    }
  });
});
