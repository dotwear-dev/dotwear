// 外装（chrome_geometry.dart で計算した矩形）を、子のウィジェットの後ろに描く。
// 子の大きさを実際のピクセルに丸めてから外装を計算し、描く位置も実際のピクセルの境界にそろえる。
// Flutter は部品の位置と大きさを端数のまま持つため（DotwearIcon と同じ考え方。ADR-019・ADR-033）。
// アンチエイリアスは切る
import 'package:flutter/foundation.dart' show listEquals;
import 'package:flutter/rendering.dart';
import 'package:flutter/widgets.dart';

import 'chrome_geometry.dart';
import 'theme.dart';

/// 外装の上に重ねて描く、ドット単位の矩形（トグルのつまみやチェックの形）。座標は本体の左上からのドット数
@immutable
class DotwearChromeMark {
  const DotwearChromeMark(this.x, this.y, this.width, this.height, this.color);

  final int x;
  final int y;
  final int width;
  final int height;
  final Color color;

  @override
  bool operator ==(Object other) =>
      other is DotwearChromeMark && other.x == x && other.y == y && other.width == width && other.height == height && other.color == color;

  @override
  int get hashCode => Object.hash(x, y, width, height, color);
}

/// 子の後ろに外装を描く。押したとき（style.pressed）は外装と子を 1 ドット下に沈める。
/// 影（右下に 1 ドット）とフォーカスリング（外側に 1 ドット）は子の大きさの外にはみ出すので、場所は使う側で空ける
class DotwearChrome extends StatelessWidget {
  const DotwearChrome({super.key, required this.style, this.marks = const [], this.child});

  final DotwearChromeStyle style;
  final List<DotwearChromeMark> marks;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final dw = Dotwear.of(context);
    return _ChromeBox(style: style, marks: marks, dotPx: dw.dotPx, devicePixelRatio: dw.devicePixelRatio, child: child);
  }
}

class _ChromeBox extends SingleChildRenderObjectWidget {
  const _ChromeBox({required this.style, required this.marks, required this.dotPx, required this.devicePixelRatio, super.child});

  final DotwearChromeStyle style;
  final List<DotwearChromeMark> marks;
  final int dotPx;
  final double devicePixelRatio;

  @override
  RenderDotwearChrome createRenderObject(BuildContext context) =>
      RenderDotwearChrome(style: style, marks: marks, dotPx: dotPx, devicePixelRatio: devicePixelRatio);

  @override
  void updateRenderObject(BuildContext context, RenderDotwearChrome renderObject) {
    renderObject
      ..style = style
      ..marks = marks
      ..dotPx = dotPx
      ..devicePixelRatio = devicePixelRatio;
  }
}

class RenderDotwearChrome extends RenderProxyBox {
  RenderDotwearChrome({
    required DotwearChromeStyle style,
    required List<DotwearChromeMark> marks,
    required int dotPx,
    required double devicePixelRatio,
  })  : _style = style,
        _marks = marks,
        _dotPx = dotPx,
        _devicePixelRatio = devicePixelRatio;

  DotwearChromeStyle _style;
  DotwearChromeStyle get style => _style;
  set style(DotwearChromeStyle value) {
    if (value == _style) return;
    _style = value;
    markNeedsPaint();
  }

  List<DotwearChromeMark> _marks;

  /// テスト用：外装の上に描いている矩形
  @visibleForTesting
  List<DotwearChromeMark> get debugMarks => _marks;

  set marks(List<DotwearChromeMark> value) {
    if (listEquals(value, _marks)) return;
    _marks = value;
    markNeedsPaint();
  }

  int _dotPx;
  set dotPx(int value) {
    if (value == _dotPx) return;
    _dotPx = value;
    markNeedsPaint();
  }

  double _devicePixelRatio;
  set devicePixelRatio(double value) {
    if (value == _devicePixelRatio) return;
    _devicePixelRatio = value;
    markNeedsPaint();
  }

  /// テスト用：いま描いている外装の大きさ（実際のピクセル）
  @visibleForTesting
  ({int width, int height})? debugBodyPx;

  @override
  void paint(PaintingContext context, Offset offset) {
    // 押したときは外装と中身をまとめて 1 ドット沈める（button.md）。1 ドットは整数ピクセルなので境界からずれない
    final sink = _style.pressed ? Offset(0, _dotPx / _devicePixelRatio) : Offset.zero;
    final toScreen = getTransformTo(null);
    final p0 = MatrixUtils.transformPoint(toScreen, Offset.zero);
    final p1 = MatrixUtils.transformPoint(toScreen, Offset(size.width, size.height));
    final scaleX = size.width > 0 ? (p1.dx - p0.dx) / size.width : 1.0;
    final scaleY = size.height > 0 ? (p1.dy - p0.dy) / size.height : 1.0;
    if (scaleX > 0 && scaleY > 0) {
      // 本体の四隅を実際のピクセルに丸め、その整数の大きさで外装を計算する
      final left = (p0.dx * _devicePixelRatio).round();
      final top = (p0.dy * _devicePixelRatio).round();
      final width = (p1.dx * _devicePixelRatio).round() - left;
      final height = (p1.dy * _devicePixelRatio).round() - top;
      debugBodyPx = (width: width, height: height);
      // 実際のピクセルの座標 → この RenderBox の描く座標
      double lx(int px) => offset.dx + ((left + px) / _devicePixelRatio - p0.dx) / scaleX;
      double ly(int px) => offset.dy + ((top + px) / _devicePixelRatio - p0.dy) / scaleY;
      final canvas = context.canvas;
      final paint = Paint()..isAntiAlias = false;
      void fill(int x, int y, int w, int h, Color color) {
        paint.color = color;
        canvas.drawRect(Rect.fromLTRB(lx(x), ly(y), lx(x + w), ly(y + h)).shift(sink), paint);
      }

      for (final r in chromeRects(width, height, _dotPx, _style)) {
        fill(r.x, r.y, r.width, r.height, r.color);
      }
      for (final m in _marks) {
        fill(m.x * _dotPx, m.y * _dotPx, m.width * _dotPx, m.height * _dotPx, m.color);
      }
    }
    final child = this.child;
    if (child != null) context.paintChild(child, offset + sink);
  }
}
