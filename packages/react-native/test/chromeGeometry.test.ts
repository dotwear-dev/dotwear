// 外装の矩形が、iOS・Android と同じ決まり（階段の頂点を結んだ多角形を偶奇規則で塗る）の絵と 1 ピクセルずつ一致することを確かめる
import { chromeRects, steppedBands, steppedBorderBands, type ChromeStyle, type PxRect } from "../src/chromeGeometry.js";

type Pt = [number, number];

/** Android の steppedPath と同じ頂点の並び（左上の階段を作り、残りの角は鏡に映す） */
function steppedPolygon(width: number, height: number, steps: number, unit: number, inset = 0): Pt[] {
  const w = width - inset * 2;
  const h = height - inset * 2;
  if (w <= 0 || h <= 0) return [];
  const s = Math.min(Math.max(0, steps), Math.max(0, Math.floor(Math.min(w, h) / (2 * unit))));
  const tl: Pt[] = [[0, s * unit]];
  for (let i = 0; i < s; i++) {
    tl.push([(i + 1) * unit, (s - i) * unit]);
    tl.push([(i + 1) * unit, (s - i - 1) * unit]);
  }
  const pts: Pt[] = [
    ...tl,
    ...[...tl].reverse().map(([x, y]): Pt => [w - x, y]),
    ...tl.map(([x, y]): Pt => [w - x, h - y]),
    ...[...tl].reverse().map(([x, y]): Pt => [x, h - y]),
  ];
  return pts.map(([x, y]) => [x + inset, y + inset]);
}

/** 点が多角形の中にあるか（交差の回数の偶奇）。複数の多角形を重ねると偶奇規則になる */
function crossings(poly: Pt[], px: number, py: number): number {
  let n = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i]!;
    const [x2, y2] = poly[(i + 1) % poly.length]!;
    if (y1 > py !== y2 > py && px < x1 + ((py - y1) * (x2 - x1)) / (y2 - y1)) n++;
  }
  return n;
}

function referenceBorder(w: number, h: number, steps: number, unit: number, width: number) {
  const outer = steppedPolygon(w, h, steps, unit);
  const inner = steppedPolygon(w, h, Math.max(0, steps - width), unit, width * unit);
  return (x: number, y: number) => (crossings(outer, x + 0.5, y + 0.5) + crossings(inner, x + 0.5, y + 0.5)) % 2 === 1;
}

/** 矩形を塗ったピクセルの集合。重なっていたら失敗させる（同じ層の中で 2 回塗らない） */
function cover(rects: readonly PxRect[]): Set<string> {
  const set = new Set<string>();
  for (const r of rects) {
    for (let y = r.y; y < r.y + r.height; y++) {
      for (let x = r.x; x < r.x + r.width; x++) {
        const k = `${x},${y}`;
        if (set.has(k)) throw new Error(`(${x},${y}) を 2 回塗っています`);
        set.add(k);
      }
    }
  }
  return set;
}

function expectSame(rects: readonly PxRect[], ref: (x: number, y: number) => boolean, w: number, h: number) {
  const got = cover(rects);
  for (let y = -4; y < h + 4; y++) for (let x = -4; x < w + 4; x++) expect([x, y, got.has(`${x},${y}`)]).toEqual([x, y, ref(x, y)]);
}

const toRects = (bands: ReturnType<typeof steppedBands>): PxRect[] => bands.map((b) => ({ x: b.x0, y: b.y0, width: b.x1 - b.x0, height: b.y1 - b.y0 }));

// [幅, 高さ, 段数, 1 ドットの px]。端数の倍率で 1 ドットが 3px や 5px になる場合と、段が入りきらない小さい箱を含める
const CASES: [number, number, number, number][] = [
  [32, 20, 1, 2],
  [57, 33, 1, 3],
  [83, 41, 2, 5],
  [12, 12, 3, 2],
  [6, 40, 2, 2],
  [28, 16, 1, 2],
];

describe("steppedBands・steppedBorderBands", () => {
  it.each(CASES)("%d×%d・%d 段・1 ドット %dpx の外形が多角形の塗りと一致する", (w, h, s, u) => {
    const poly = steppedPolygon(w, h, s, u);
    expectSame(toRects(steppedBands(w, h, s, u)), (x, y) => crossings(poly, x + 0.5, y + 0.5) % 2 === 1, w, h);
  });

  it.each(CASES.flatMap(([w, h, s, u]) => [1, 2].map((lw) => [w, h, s, u, lw] as const)))(
    "%d×%d・%d 段・1 ドット %dpx・線 %d ドットの枠線が、外形から内側を偶奇規則で抜いた形と一致する",
    (w, h, s, u, lw) => {
      expectSame(toRects(steppedBorderBands(w, h, s, u, lw)), referenceBorder(w, h, s, u, lw), w, h);
    },
  );
});

describe("chromeRects", () => {
  const style: ChromeStyle = {
    fill: "#ffffff",
    border: "#000000",
    borderWidth: 1,
    steps: 1,
    shadow: "#111111",
    focusRing: "#888888",
    innerGap: 1,
    innerWidth: 1,
    innerColor: "#eeeeee",
  };
  const byColor = (rects: ReturnType<typeof chromeRects>, color: string) => rects.filter((r) => r.color === color);

  it("影・地・外の線・内の線・フォーカスリングを、下に描くものから順に返す", () => {
    const order = [...new Set(chromeRects(40, 24, 2, style).map((r) => r.color))];
    expect(order).toEqual(["#111111", "#ffffff", "#000000", "#eeeeee", "#888888"]);
  });

  it("影は外形を右下に 1 ドットずらしたもの。押したときは描かない", () => {
    const shadow = byColor(chromeRects(40, 24, 2, style), "#111111");
    const poly = steppedPolygon(40, 24, 1, 2);
    expectSame(shadow, (x, y) => crossings(poly, x - 2 + 0.5, y - 2 + 0.5) % 2 === 1, 40, 24);
    expect(byColor(chromeRects(40, 24, 2, { ...style, pressed: true }), "#111111")).toEqual([]);
  });

  it("内の線は、外の線とすき間の分だけ内側に、角の段を減らして描く", () => {
    const inner = byColor(chromeRects(40, 24, 3, { ...style, steps: 2 }), "#eeeeee");
    const d = (1 + 1) * 3;
    const ref = referenceBorder(40 - 2 * d, 24 - 2 * d, 0, 3, 1);
    expectSame(inner, (x, y) => ref(x - d, y - d), 40, 24);
  });

  it("フォーカスリングは枠のすぐ外側の 1 ドットで、角を 1 段多くする", () => {
    const ring = byColor(chromeRects(40, 24, 2, style), "#888888");
    const ref = referenceBorder(44, 28, 2, 2, 1);
    expectSame(ring, (x, y) => ref(x + 2, y + 2), 40, 24);
  });

  it("地が null なら塗らず、内の線の太さが 0 なら一重の枠にする", () => {
    const rects = chromeRects(40, 24, 2, { ...style, fill: null, innerWidth: 0, shadow: null, focusRing: null });
    expect(new Set(rects.map((r) => r.color))).toEqual(new Set(["#000000"]));
  });

  it("どの矩形も整数ピクセルに乗る", () => {
    for (const r of chromeRects(57, 33, 3, { ...style, steps: 2 })) {
      for (const v of [r.x, r.y, r.width, r.height]) expect(Number.isInteger(v)).toBe(true);
    }
  });
});
