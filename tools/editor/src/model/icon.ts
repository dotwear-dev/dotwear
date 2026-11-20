// アイコンの元データ（icon.json）の型と、編集の操作。
// 画面にも保存先にも依存しない純粋な関数だけを置く。保存先を変えてもこのまま使い回せるように

/** マス目に使える文字。`.` は透明、`#` はメインの色、`2`〜`9` はパレットのスロット */
export const CELL_CHARS = [".", "#", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
export type CellChar = (typeof CELL_CHARS)[number];

export const GRID_SIZES = ["12", "16", "24"] as const;
export type GridSize = (typeof GRID_SIZES)[number];

export interface IconDocument {
  $schema?: string;
  name: string;
  category: string;
  tier: "free" | "pro";
  tags: string[];
  sizes: Partial<Record<GridSize, string[]>> & { "16": string[] };
}

/** 保存先の区分。icons/ は配布するアイコン、brand/ はロゴなどのブランド素材 */
export type Collection = "icons" | "brand";

export function emptyGrid(size: number): string[] {
  return Array.from({ length: size }, () => ".".repeat(size));
}

export function newIcon(name: string): IconDocument {
  return {
    $schema: "../../schema/icon.schema.json",
    name,
    category: "",
    tier: "free",
    tags: [],
    sizes: { "16": emptyGrid(16) },
  };
}

/** 1 マスを塗る。変化がなければ同じ配列を返す（履歴に無駄な手順を積まないため） */
export function paintCell(grid: readonly string[], x: number, y: number, ch: CellChar): readonly string[] {
  const row = grid[y];
  if (row === undefined || x < 0 || x >= row.length || row[x] === ch) return grid;
  const next = [...grid];
  next[y] = row.slice(0, x) + ch + row.slice(x + 1);
  return next;
}

/** 2 点の間を直線で塗る。ドラッグが速いとマスが飛ぶので、前の位置から線でつなぐ（ブレゼンハムの方法） */
export function paintLine(
  grid: readonly string[],
  from: { x: number; y: number },
  to: { x: number; y: number },
  ch: CellChar,
): readonly string[] {
  let next = grid;
  let { x, y } = from;
  const dx = Math.abs(to.x - x);
  const dy = -Math.abs(to.y - y);
  const sx = x < to.x ? 1 : -1;
  const sy = y < to.y ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    next = paintCell(next, x, y, ch);
    if (x === to.x && y === to.y) return next;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

/** 塗りつぶし：(x, y) と同じ文字で上下左右につながったマスを ch にする */
export function floodFill(grid: readonly string[], x: number, y: number, ch: CellChar): readonly string[] {
  const target = grid[y]?.[x];
  if (target === undefined || target === ch) return grid;
  const cells = grid.map((row) => row.split(""));
  const stack: [number, number][] = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    if (cells[cy]?.[cx] !== target) continue;
    cells[cy]![cx] = ch;
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  return cells.map((row) => row.join(""));
}

/** 「save, 保存 ,disk」のような入力をタグの配列にする（空と重複は除く） */
export function parseTags(input: string): string[] {
  return [...new Set(input.split(/[,、]/).map((t) => t.trim()).filter(Boolean))];
}

// ---- 元に戻す / やり直す ----

export interface History<T> {
  past: T[];
  present: T;
  future: T[];
}

const HISTORY_LIMIT = 200;

export function initHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

/** 新しい状態を積む。同じ状態なら何もしない */
export function pushHistory<T>(h: History<T>, next: T): History<T> {
  if (next === h.present) return h;
  return { past: [...h.past, h.present].slice(-HISTORY_LIMIT), present: next, future: [] };
}

/** ドラッグ中など、1 回の操作の途中は履歴を積まずに今の状態だけを差し替える */
export function replacePresent<T>(h: History<T>, next: T): History<T> {
  return next === h.present ? h : { ...h, present: next };
}

export function undo<T>(h: History<T>): History<T> {
  const prev = h.past[h.past.length - 1];
  if (prev === undefined) return h;
  return { past: h.past.slice(0, -1), present: prev, future: [h.present, ...h.future] };
}

export function redo<T>(h: History<T>): History<T> {
  const next = h.future[0];
  if (next === undefined) return h;
  return { past: [...h.past, h.present], present: next, future: h.future.slice(1) };
}
