// マス目を塗るキャンバス。ドラッグで連続して塗れる。
// 1 回のドラッグ（押してから離すまで）を 1 つの操作として、元に戻すの単位にする
import { useRef } from "react";
import type { CellChar } from "../model/icon.ts";

export type Tool = "pen" | "eraser" | "fill";

interface Props {
  grid: readonly string[];
  /** キャンバス全体の大きさ（px）。1 マスの大きさはこれをグリッドサイズで割った整数 */
  size: number;
  /** ドラッグの開始。stroke 内の onPaint はこの後に続く */
  onStrokeStart: () => void;
  onPaint: (from: { x: number; y: number } | null, to: { x: number; y: number }) => void;
}

export function PixelCanvas({ grid, size, onStrokeStart, onPaint }: Props) {
  const gridSize = grid.length;
  // 1 マスの大きさを整数 px にする（キャンバス自体もにじませない）
  const cell = Math.floor(size / gridSize);
  const last = useRef<{ x: number; y: number } | null>(null);

  const cellAt = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cell);
    const y = Math.floor((e.clientY - rect.top) / cell);
    return x >= 0 && y >= 0 && x < gridSize && y < gridSize ? { x, y } : null;
  };

  return (
    <div
      className="canvas"
      role="img"
      aria-label={`${gridSize}×${gridSize} のマス目`}
      style={{ width: cell * gridSize, height: cell * gridSize, gridTemplateColumns: `repeat(${gridSize}, ${cell}px)` }}
      onPointerDown={(e) => {
        const at = cellAt(e);
        if (!at || e.button !== 0) return;
        // キャンバスの外にドラッグしても、離すまで塗り続けられるようにする
        e.currentTarget.setPointerCapture(e.pointerId);
        onStrokeStart();
        onPaint(null, at);
        last.current = at;
      }}
      onPointerMove={(e) => {
        if (!last.current) return;
        const at = cellAt(e);
        if (!at || (at.x === last.current.x && at.y === last.current.y)) return;
        onPaint(last.current, at);
        last.current = at;
      }}
      onPointerUp={() => (last.current = null)}
      onPointerCancel={() => (last.current = null)}
    >
      {grid.flatMap((row, y) =>
        [...row].map((ch, x) => <span key={`${x},${y}`} className="cell" data-ch={ch as CellChar} style={cellStyle(ch)} />),
      )}
    </div>
  );
}

// マスの色。# は前景色、2〜9 はパレットの CSS 変数（@dotwear/icons/palette.css）、. は透明（市松模様が見える）
export function cellStyle(ch: string): React.CSSProperties | undefined {
  if (ch === ".") return undefined;
  if (ch === "#") return { background: "var(--dw-color-fg)" };
  return { background: `var(--dw-palette-${ch})` };
}
