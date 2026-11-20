// 部品に共通の「ピクセル調の外装」：階段状の角の背景・枠線・影・フォーカスリングを、矩形の並びとして計算する。
// iOS の PixelChrome・Android の dotwearChrome と同じ決まりで、形はそのまま。React Native にはパスの塗りがないので、
// 横に切った帯（矩形）に分けて、それぞれを View で描く（src/ChromeBox.tsx）。
// 長さはすべて整数の物理ピクセル。dp にするのは描くときだけ（ADR-019・ADR-032）
//
//   steps = 1      steps = 2
//   .######.       ..####..
//   ########       .######.
//   ########       ########

export interface PxRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface ChromeRect extends PxRect {
  readonly color: string;
}

export interface ChromeStyle {
  /** 地の色。null なら塗らない（ghost のボタンなど） */
  readonly fill: string | null;
  readonly border: string;
  /** 外の線の太さ（ドット数） */
  readonly borderWidth: number;
  /** 角の段数 */
  readonly steps: number;
  /** 影の色。null なら描かない */
  readonly shadow: string | null;
  readonly pressed?: boolean;
  readonly focusRing?: string | null;
  /** 二重線の枠の、外の線と内の線のすき間（ドット数） */
  readonly innerGap?: number;
  /** 内の線の太さ（ドット数）。0 なら一重の枠 */
  readonly innerWidth?: number;
  /** 内の線の色。null なら border と同じ。黒く塗ったボタンでは地の色の上で見えるように変える */
  readonly innerColor?: string | null;
}

/** 横の帯 1 本：y0 ≦ y < y1 の範囲で、x0 ≦ x < x1 を塗る */
interface Band {
  y0: number;
  y1: number;
  x0: number;
  x1: number;
}

/**
 * 角を階段にした外形を、横の帯に分ける（Android の steppedPath と同じ形）。
 * 小さすぎて階段が入りきらないときは段数を減らす（左右・上下の角が重ならないように）
 */
export function steppedBands(width: number, height: number, steps: number, unit: number, inset = 0): Band[] {
  const w = width - inset * 2;
  const h = height - inset * 2;
  if (w <= 0 || h <= 0) return [];
  const s = Math.min(Math.max(0, steps), Math.max(0, Math.floor(Math.min(w, h) / (2 * unit))));
  const bands: Band[] = [];
  // 上から k 段目の帯は、左右を (s - k) 段ぶん削る。下の角は上を鏡に映す
  for (let k = 0; k < s; k++) bands.push({ y0: k * unit, y1: (k + 1) * unit, x0: (s - k) * unit, x1: w - (s - k) * unit });
  if (h - 2 * s * unit > 0) bands.push({ y0: s * unit, y1: h - s * unit, x0: 0, x1: w });
  for (let k = s - 1; k >= 0; k--) bands.push({ y0: h - (k + 1) * unit, y1: h - k * unit, x0: (s - k) * unit, x1: w - (s - k) * unit });
  return bands.map((b) => ({ y0: b.y0 + inset, y1: b.y1 + inset, x0: b.x0 + inset, x1: b.x1 + inset }));
}

/** 外形から inner を抜いた形（偶奇規則の塗りと同じ）。どちらも 1 つの y に帯が 1 本だけの形に限る */
function subtract(outer: Band[], inner: Band[]): Band[] {
  const ys = [...new Set([...outer, ...inner].flatMap((b) => [b.y0, b.y1]))].sort((a, b) => a - b);
  const at = (bands: Band[], y: number) => bands.find((b) => b.y0 <= y && y < b.y1);
  const out: Band[] = [];
  for (let i = 0; i + 1 < ys.length; i++) {
    const y0 = ys[i]!;
    const y1 = ys[i + 1]!;
    const o = at(outer, y0);
    if (!o) continue;
    const n = at(inner, y0);
    if (!n || n.x1 <= o.x0 || o.x1 <= n.x0) {
      out.push({ y0, y1, x0: o.x0, x1: o.x1 });
      continue;
    }
    if (n.x0 > o.x0) out.push({ y0, y1, x0: o.x0, x1: n.x0 });
    if (o.x1 > n.x1) out.push({ y0, y1, x0: n.x1, x1: o.x1 });
  }
  return out;
}

/** 枠線だけ：外形と width ドット内側の形の差（Android の steppedBorderPath と同じ） */
export function steppedBorderBands(width: number, height: number, steps: number, unit: number, lineWidth: number): Band[] {
  return subtract(steppedBands(width, height, steps, unit), steppedBands(width, height, Math.max(0, steps - lineWidth), unit, lineWidth * unit));
}

function toRects(bands: Band[], color: string, dx = 0, dy = 0): ChromeRect[] {
  return bands
    .filter((b) => b.x1 > b.x0 && b.y1 > b.y0)
    .map((b) => ({ x: b.x0 + dx, y: b.y0 + dy, width: b.x1 - b.x0, height: b.y1 - b.y0, color }));
}

/**
 * 外装の矩形を、下に描くものから順に返す。座標は本体（影を除く部分）の左上が原点の物理ピクセル。
 * 影は右下に、フォーカスリングは外側にはみ出す。押したときは影を消す（本体を沈めるのは描く側）
 */
export function chromeRects(width: number, height: number, unit: number, style: ChromeStyle): ChromeRect[] {
  const { steps } = style;
  const rects: ChromeRect[] = [];
  if (style.shadow && !style.pressed) rects.push(...toRects(steppedBands(width, height, steps, unit), style.shadow, unit, unit));
  if (style.fill) rects.push(...toRects(steppedBands(width, height, steps, unit), style.fill));
  if (style.borderWidth > 0) rects.push(...toRects(steppedBorderBands(width, height, steps, unit, style.borderWidth), style.border));
  // 内の線：外の線とすき間の分だけ内側に、角の段もその分減らして描く（外の線の階段と平行になる）
  const innerWidth = style.innerWidth ?? 0;
  if (innerWidth > 0) {
    const inset = style.borderWidth + (style.innerGap ?? 0);
    const d = inset * unit;
    rects.push(
      ...toRects(
        steppedBorderBands(width - 2 * d, height - 2 * d, Math.max(0, steps - inset), unit, innerWidth),
        style.innerColor ?? style.border,
        d,
        d,
      ),
    );
  }
  // 枠のすぐ外側に 1 ドット。角は 1 段多くして、枠の階段に沿わせる
  if (style.focusRing) {
    rects.push(...toRects(steppedBorderBands(width + 2 * unit, height + 2 * unit, steps + 1, unit, 1), style.focusRing, -unit, -unit));
  }
  return rects;
}
