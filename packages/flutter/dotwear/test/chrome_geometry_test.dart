// 外装の形（chrome_geometry.dart）を、1 ピクセルずつ判定する素朴な実装と比べて確かめる
import 'dart:math' as math;
import 'dart:ui' show Color;

import 'package:dotwear/dotwear.dart';
import 'package:flutter_test/flutter_test.dart';

/// 階段の角の形に (x, y) のピクセルが入るか（左上の角の k 段目は (s - k) 段ぶん削る。ほかの角は鏡に映す）
bool insideStepped(int x, int y, int w, int h, int steps, int unit) {
  if (x < 0 || y < 0 || x >= w || y >= h) return false;
  final s = math.min(steps, math.min(w, h) ~/ (2 * unit));
  final row = math.min(y, h - 1 - y) ~/ unit;
  final col = math.min(x, w - 1 - x) ~/ unit;
  return !(row < s && col < s - row);
}

Set<(int, int)> raster(Iterable<({int y0, int y1, int x0, int x1})> bands) => {
      for (final b in bands)
        for (var y = b.y0; y < b.y1; y++)
          for (var x = b.x0; x < b.x1; x++) (x, y),
    };

void main() {
  const sizes = [(16, 16), (40, 24), (13, 9), (6, 6), (3, 20)];
  test('steppedBands は、角を階段に削った形と 1 ピクセル単位で一致し、帯どうしは重ならない', () {
    for (final unit in [1, 2, 5]) {
      for (final (w0, h0) in sizes) {
        final (w, h) = (w0 * unit, h0 * unit);
        for (final steps in [0, 1, 2, 3]) {
          final bands = steppedBands(w, h, steps, unit);
          final area = bands.fold(0, (a, b) => a + (b.x1 - b.x0) * (b.y1 - b.y0));
          final got = raster(bands);
          expect(area, got.length, reason: '帯が重なっている（$w×$h、段 $steps、単位 $unit）');
          final want = {for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) if (insideStepped(x, y, w, h, steps, unit)) (x, y)};
          expect(got, want, reason: '$w×$h、段 $steps、単位 $unit');
        }
      }
    }
  });

  test('steppedBorderBands は、外形から線の太さぶん内側の形を抜いたもの', () {
    for (final unit in [1, 3]) {
      for (final (w0, h0) in sizes) {
        final (w, h) = (w0 * unit, h0 * unit);
        for (final steps in [0, 1, 2]) {
          for (final line in [1, 2]) {
            final got = raster(steppedBorderBands(w, h, steps, unit, line));
            final d = line * unit;
            final innerSteps = math.max(0, steps - line);
            final want = {
              for (var y = 0; y < h; y++)
                for (var x = 0; x < w; x++)
                  if (insideStepped(x, y, w, h, steps, unit) && !insideStepped(x - d, y - d, w - 2 * d, h - 2 * d, innerSteps, unit)) (x, y),
            };
            expect(got, want, reason: '$w×$h、段 $steps、線 $line、単位 $unit');
          }
        }
      }
    }
  });

  test('chromeRects：影は右下に 1 ドット、押すと消える。フォーカスリングは外側に 1 ドット', () {
    const black = Color(0xFF000000), gray = Color(0xFF888888), white = Color(0xFFFFFFFF);
    const style = DotwearChromeStyle(fill: white, border: black, borderWidth: 1, steps: 1, shadow: black, focusRing: gray);
    final rects = chromeRects(20, 10, 2, style);
    final shadow = rects.where((r) => r.color == black && (r.x >= 2 || r.y >= 2)).toList();
    expect(rects.first.x, 2 + 2, reason: '影は 1 段目の帯が右に 1 ドットずれる');
    expect(shadow, isNotEmpty);
    final ring = rects.where((r) => r.color == gray);
    expect(ring.map((r) => r.x).reduce(math.min), -2);
    expect(ring.map((r) => r.x + r.width).reduce(math.max), 22);

    final pressed = chromeRects(20, 10, 2, const DotwearChromeStyle(fill: white, border: black, borderWidth: 1, steps: 1, shadow: black, pressed: true));
    expect(pressed.where((r) => r.x + r.width > 20 || r.y + r.height > 10), isEmpty, reason: '押したときは影がない');
  });

  test('二重線の内の線は、外の線とすき間の分だけ内側にあり、角の段もその分減る', () {
    const black = Color(0xFF000000), white = Color(0xFFFFFFFF), red = Color(0xFFFF0000);
    final rects = chromeRects(
      20,
      20,
      1,
      const DotwearChromeStyle(fill: null, border: black, borderWidth: 1, steps: 3, innerGap: 1, innerWidth: 1, innerColor: red),
    );
    final inner = raster(rects.where((r) => r.color == red).map((r) => (y0: r.y, y1: r.y + r.height, x0: r.x, x1: r.x + r.width)));
    final want = {
      for (var y = 0; y < 20; y++)
        for (var x = 0; x < 20; x++)
          if (insideStepped(x - 2, y - 2, 16, 16, 1, 1) && !insideStepped(x - 3, y - 3, 14, 14, 0, 1)) (x, y),
    };
    expect(inner, want);
    expect(rects.where((r) => r.color == white), isEmpty);
  });
}
