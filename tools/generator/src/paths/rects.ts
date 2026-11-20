// マス目 → 矩形 → SVG パスの変換（docs/02_architecture.md「2. パス生成」）
// ピクセルパーフェクトの要。座標は必ず整数、命令は M / h / v / z だけを使う。

/** マス目の色を表す文字。`#` はメインの色、`2`〜`9` はパレットのスロット */
export type CellColor = "#" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// 出力の並び順を安定させるため、色は常にこの順で扱う（`#` を最初に描く）
export const CELL_COLORS: readonly CellColor[] = ["#", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * グリッドを色ごとの矩形に分解する。
 * 1. 各行で、同じ色が横に続くマスを 1 本の帯にまとめる
 * 2. すぐ下の行に「同じ x・同じ幅・同じ色」の帯があれば、縦に伸ばして 1 つの矩形にする（貪欲法）
 * 最小の矩形数は求めないが、同じ入力からは必ず同じ出力になり、マスの重なりも抜けもない。
 */
export function gridToRects(grid: readonly string[]): Map<CellColor, Rect[]> {
  const result = new Map<CellColor, Rect[]>();
  // 上の行から伸ばしている途中の矩形。キーは「色:x:幅」
  let open = new Map<string, Rect>();

  grid.forEach((row, y) => {
    const next = new Map<string, Rect>();
    let x = 0;
    while (x < row.length) {
      const ch = row[x]!;
      if (ch === ".") {
        x++;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      const w = end - x;
      const key = `${ch}:${x}:${w}`;
      const above = open.get(key);
      if (above) {
        // 上の行の帯と同じ位置・幅なので、縦に 1 マス伸ばす
        above.h++;
        next.set(key, above);
        open.delete(key);
      } else {
        const rect: Rect = { x, y, w, h: 1 };
        const color = ch as CellColor;
        const list = result.get(color) ?? [];
        list.push(rect);
        result.set(color, list);
        next.set(key, rect);
      }
      x = end;
    }
    // 下に続かなかった帯（open に残ったもの）はここで確定する
    open = next;
  });

  // 色の並びを CELL_COLORS の順にそろえる
  const ordered = new Map<CellColor, Rect[]>();
  for (const c of CELL_COLORS) {
    const list = result.get(c);
    if (list) ordered.set(c, list);
  }
  return ordered;
}

/**
 * 矩形のリストを 1 本の SVG パスにする。各矩形は `M x y h w v h h -w z`。
 * 相対命令の h / v だけを使うので、座標の誤差やにじみが入る余地がない。
 */
export function rectsToPath(rects: readonly Rect[]): string {
  return rects.map((r) => `M${r.x} ${r.y}h${r.w}v${r.h}h${-r.w}z`).join("");
}

/** 矩形のリストをマス目に塗り戻す（テストと検証用）。塗られていないマスは "." */
export function rectsToGrid(rects: ReadonlyMap<CellColor, readonly Rect[]>, size: number): string[] {
  const cells = Array.from({ length: size }, () => Array<string>(size).fill("."));
  for (const [color, list] of rects) {
    for (const r of list) {
      for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
          const row = cells[y];
          if (!row || x >= size) throw new Error(`矩形がグリッドの外にはみ出しています: ${JSON.stringify(r)}`);
          if (row[x] !== ".") throw new Error(`矩形が重なっています: (${x}, ${y})`);
          row[x] = color;
        }
      }
    }
  }
  return cells.map((row) => row.join(""));
}
