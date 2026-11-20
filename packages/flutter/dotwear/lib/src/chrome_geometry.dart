// 部品に共通の「ピクセル調の外装」：階段状の角の背景・枠線・影・フォーカスリングを、矩形の並びとして計算する。
// iOS の PixelChrome・Android の dotwearChrome・React Native の chromeGeometry と同じ決まりで、形もそのまま。
// 矩形（横に切った帯）にしておくと、アンチエイリアスなしで整数ピクセルにそのまま塗れる。
// 長さはすべて整数の物理ピクセル（ADR-019・ADR-033）
//
//   steps = 1      steps = 2
//   .######.       ..####..
//   ########       .######.
//   ########       ########
import 'dart:math' as math;
import 'dart:ui' show Color;

import 'package:flutter/foundation.dart';

/// 整数ピクセルの矩形
@immutable
class PxRect {
  const PxRect(this.x, this.y, this.width, this.height, this.color);

  final int x;
  final int y;
  final int width;
  final int height;
  final Color color;

  @override
  bool operator ==(Object other) =>
      other is PxRect && other.x == x && other.y == y && other.width == width && other.height == height && other.color == color;

  @override
  int get hashCode => Object.hash(x, y, width, height, color);

  @override
  String toString() => 'PxRect($x, $y, $width × $height)';
}

/// 外装の見た目
@immutable
class DotwearChromeStyle {
  const DotwearChromeStyle({
    required this.fill,
    required this.border,
    required this.borderWidth,
    required this.steps,
    this.shadow,
    this.pressed = false,
    this.focusRing,
    this.innerGap = 0,
    this.innerWidth = 0,
    this.innerColor,
  });

  /// 地の色。null なら塗らない（ghost のボタンなど）
  final Color? fill;
  final Color border;

  /// 外の線の太さ（ドット数）
  final int borderWidth;

  /// 角の段数
  final int steps;

  /// 影の色。null なら描かない
  final Color? shadow;

  /// 押している。影を消す（本体を沈めるのは描く側）
  final bool pressed;

  /// フォーカスリングの色。null なら描かない
  final Color? focusRing;

  /// 二重線の枠の、外の線と内の線のすき間（ドット数）
  final int innerGap;

  /// 内の線の太さ（ドット数）。0 なら一重の枠
  final int innerWidth;

  /// 内の線の色。null なら border と同じ。黒く塗ったボタンでは地の上で見えるように変える
  final Color? innerColor;

  @override
  bool operator ==(Object other) =>
      other is DotwearChromeStyle &&
      other.fill == fill &&
      other.border == border &&
      other.borderWidth == borderWidth &&
      other.steps == steps &&
      other.shadow == shadow &&
      other.pressed == pressed &&
      other.focusRing == focusRing &&
      other.innerGap == innerGap &&
      other.innerWidth == innerWidth &&
      other.innerColor == innerColor;

  @override
  int get hashCode => Object.hash(fill, border, borderWidth, steps, shadow, pressed, focusRing, innerGap, innerWidth, innerColor);
}

/// 横の帯 1 本：y0 ≦ y < y1 の範囲で、x0 ≦ x < x1 を塗る
typedef Band = ({int y0, int y1, int x0, int x1});

/// 角を階段にした外形を、横の帯に分ける（Android の steppedPath と同じ形）。
/// 小さすぎて階段が入りきらないときは段数を減らす（左右・上下の角が重ならないように）
List<Band> steppedBands(int width, int height, int steps, int unit, [int inset = 0]) {
  final w = width - inset * 2;
  final h = height - inset * 2;
  if (w <= 0 || h <= 0) return const [];
  final s = math.min(math.max(0, steps), math.max(0, math.min(w, h) ~/ (2 * unit)));
  final bands = <Band>[
    // 上から k 段目の帯は、左右を (s - k) 段ぶん削る。下の角は上を鏡に映す
    for (var k = 0; k < s; k++) (y0: k * unit, y1: (k + 1) * unit, x0: (s - k) * unit, x1: w - (s - k) * unit),
    if (h - 2 * s * unit > 0) (y0: s * unit, y1: h - s * unit, x0: 0, x1: w),
    for (var k = s - 1; k >= 0; k--) (y0: h - (k + 1) * unit, y1: h - k * unit, x0: (s - k) * unit, x1: w - (s - k) * unit),
  ];
  return [for (final b in bands) (y0: b.y0 + inset, y1: b.y1 + inset, x0: b.x0 + inset, x1: b.x1 + inset)];
}

/// 外形から inner を抜いた形（偶奇規則の塗りと同じ）。どちらも 1 つの y に帯が 1 本だけの形に限る
List<Band> _subtract(List<Band> outer, List<Band> inner) {
  final ys = {for (final b in [...outer, ...inner]) ...[b.y0, b.y1]}.toList()..sort();
  Band? at(List<Band> bands, int y) {
    for (final b in bands) {
      if (b.y0 <= y && y < b.y1) return b;
    }
    return null;
  }

  final out = <Band>[];
  for (var i = 0; i + 1 < ys.length; i++) {
    final y0 = ys[i], y1 = ys[i + 1];
    final o = at(outer, y0);
    if (o == null) continue;
    final n = at(inner, y0);
    if (n == null || n.x1 <= o.x0 || o.x1 <= n.x0) {
      out.add((y0: y0, y1: y1, x0: o.x0, x1: o.x1));
      continue;
    }
    if (n.x0 > o.x0) out.add((y0: y0, y1: y1, x0: o.x0, x1: n.x0));
    if (o.x1 > n.x1) out.add((y0: y0, y1: y1, x0: n.x1, x1: o.x1));
  }
  return out;
}

/// 枠線だけ：外形と lineWidth ドット内側の形の差（Android の steppedBorderPath と同じ）
List<Band> steppedBorderBands(int width, int height, int steps, int unit, int lineWidth) => _subtract(
      steppedBands(width, height, steps, unit),
      steppedBands(width, height, math.max(0, steps - lineWidth), unit, lineWidth * unit),
    );

Iterable<PxRect> _toRects(List<Band> bands, Color color, [int dx = 0, int dy = 0]) =>
    bands.where((b) => b.x1 > b.x0 && b.y1 > b.y0).map((b) => PxRect(b.x0 + dx, b.y0 + dy, b.x1 - b.x0, b.y1 - b.y0, color));

/// 外装の矩形を、下に描くものから順に返す。座標は本体（影を除く部分）の左上が原点の物理ピクセル。
/// 影は右下に、フォーカスリングは外側にはみ出す
List<PxRect> chromeRects(int width, int height, int unit, DotwearChromeStyle style) {
  final steps = style.steps;
  final shadow = style.shadow;
  final fill = style.fill;
  final ring = style.focusRing;
  return [
    if (shadow != null && !style.pressed) ..._toRects(steppedBands(width, height, steps, unit), shadow, unit, unit),
    if (fill != null) ..._toRects(steppedBands(width, height, steps, unit), fill),
    if (style.borderWidth > 0) ..._toRects(steppedBorderBands(width, height, steps, unit, style.borderWidth), style.border),
    // 内の線：外の線とすき間の分だけ内側に、角の段もその分減らして描く（外の線の階段と平行になる）
    if (style.innerWidth > 0)
      ..._toRects(
        steppedBorderBands(
          width - 2 * (style.borderWidth + style.innerGap) * unit,
          height - 2 * (style.borderWidth + style.innerGap) * unit,
          math.max(0, steps - (style.borderWidth + style.innerGap)),
          unit,
          style.innerWidth,
        ),
        style.innerColor ?? style.border,
        (style.borderWidth + style.innerGap) * unit,
        (style.borderWidth + style.innerGap) * unit,
      ),
    // 枠のすぐ外側に 1 ドット。角は 1 段多くして、枠の階段に沿わせる
    if (ring != null) ..._toRects(steppedBorderBands(width + 2 * unit, height + 2 * unit, steps + 1, unit, 1), ring, -unit, -unit),
  ];
}
