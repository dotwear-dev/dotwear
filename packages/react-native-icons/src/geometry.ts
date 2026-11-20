// アイコンを React Native の View で描くための計算（描画に依存しない純粋な関数だけを置く）。
//
// ピクセルパーフェクトの決まりは Android と同じ（ADR-019・ADR-032）：
//   - 1 マスは「scale × 画面の倍率」を切り捨てた整数ピクセル（最低 1px）。
//     1.5 倍や 2.625 倍の端末でも、マスの境界が実際のピクセルの境界からずれない。
//     そのかわり dp で見た大きさは、端数の倍率で少し小さくなる
import type { DotwearIconLayer } from "@dotwear/icons";

/** マス目の単位の矩形 */
export interface DotwearCellRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** 1 マスの大きさ（物理ピクセル）。scale × 画面の倍率 を切り捨てた整数で、最低 1 */
export function dotwearCellPx(scale: number, pixelRatio: number): number {
  // 2.625 × 2 = 5.25 のような掛け算の誤差で 1 つ下に切り捨てないよう、少しだけ足す
  return Math.max(1, Math.floor(Math.max(1, scale) * pixelRatio + 1e-4));
}

// 同じ定義を何度も描くので、layer のオブジェクトごとに結果を覚えておく
const cache = new WeakMap<DotwearIconLayer, readonly DotwearCellRect[]>();

/**
 * 1 色分のパス（整数座標の M / h / v / z）を、塗られるマスを覆う矩形の並びにする。
 * 生成物のパスはもともと矩形の並びだが、別のパッケージの定義（ADR-013）も受け付けるため、
 * 一度マス目に戻してから矩形にまとめ直す（SVG と同じ nonzero の塗りの規則）。
 */
export function layerRects(layer: DotwearIconLayer): readonly DotwearCellRect[] {
  const hit = cache.get(layer);
  if (hit) return hit;
  const rects = mergeCells(rasterize(layer.d));
  cache.set(layer, rects);
  return rects;
}

interface VerticalEdge {
  x: number;
  top: number;
  bottom: number;
  /** 下向きの辺は +1、上向きは -1（巻き数を数えるため） */
  dir: 1 | -1;
}

/** パスを塗りつぶしたときに、中心が塗られるマスの集合（キーは "x,y"）を返す */
function rasterize(d: string): Set<string> {
  const edges: VerticalEdge[] = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const visit = (px: number, py: number) => {
    minX = Math.min(minX, px);
    minY = Math.min(minY, py);
    maxX = Math.max(maxX, px);
    maxY = Math.max(maxY, py);
  };
  const lineTo = (nx: number, ny: number) => {
    if (nx === x && ny !== y) edges.push({ x, top: Math.min(y, ny), bottom: Math.max(y, ny), dir: ny > y ? 1 : -1 });
    x = nx;
    y = ny;
    visit(x, y);
  };

  const tokens = d.match(/[MmHhVvZz]|-?\d+(?:\.\d+)?/g) ?? [];
  let i = 0;
  const num = () => {
    const t = tokens[i++];
    const n = Number(t);
    if (t === undefined || Number.isNaN(n)) throw new Error(`[dotwear] アイコンのパスを読めません: ${d}`);
    return n;
  };
  while (i < tokens.length) {
    const cmd = tokens[i++]!;
    switch (cmd) {
      case "M":
      case "m": {
        const nx = num();
        const ny = num();
        x = cmd === "M" ? nx : x + nx;
        y = cmd === "M" ? ny : y + ny;
        startX = x;
        startY = y;
        visit(x, y);
        break;
      }
      case "H":
        lineTo(num(), y);
        break;
      case "h":
        lineTo(x + num(), y);
        break;
      case "V":
        lineTo(x, num());
        break;
      case "v":
        lineTo(x, y + num());
        break;
      case "Z":
      case "z":
        lineTo(startX, startY);
        break;
      default:
        // 斜めの線や曲線は、マス目のアイコンでは使わない（型の約束。DotwearIconLayer.d）
        throw new Error(`[dotwear] アイコンのパスに使えない命令 "${cmd}" があります: ${d}`);
    }
  }

  const cells = new Set<string>();
  if (!Number.isFinite(minX)) return cells;
  for (let cy = minY; cy < maxY; cy++) {
    for (let cx = minX; cx < maxX; cx++) {
      // マスの中心から右へ伸ばした半直線と交わる縦の辺の向きを足す（nonzero）
      const px = cx + 0.5;
      const py = cy + 0.5;
      let winding = 0;
      for (const e of edges) if (e.x > px && e.top < py && py < e.bottom) winding += e.dir;
      if (winding !== 0) cells.add(`${cx},${cy}`);
    }
  }
  return cells;
}

/** マスの集合を、横に長く伸ばしてから同じ幅の行を下へつなげた矩形にまとめる（View の数を減らすため） */
function mergeCells(cells: Set<string>): DotwearCellRect[] {
  const rects: DotwearCellRect[] = [];
  const used = new Set<string>();
  const sorted = [...cells]
    .map((k) => k.split(",").map(Number) as [number, number])
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  for (const [x, y] of sorted) {
    if (used.has(`${x},${y}`)) continue;
    let width = 1;
    while (cells.has(`${x + width},${y}`) && !used.has(`${x + width},${y}`)) width++;
    let height = 1;
    const rowFree = (row: number) => {
      for (let dx = 0; dx < width; dx++) {
        const k = `${x + dx},${row}`;
        if (!cells.has(k) || used.has(k)) return false;
      }
      return true;
    };
    while (rowFree(y + height)) height++;
    for (let dy = 0; dy < height; dy++) for (let dx = 0; dx < width; dx++) used.add(`${x + dx},${y + dy}`);
    rects.push({ x, y, width, height });
  }
  return rects;
}
