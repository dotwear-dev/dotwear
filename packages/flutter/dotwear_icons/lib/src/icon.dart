// アイコンを描くウィジェット。`DotwearIcon(DotwearIcons.save, scale: 2)`（ADR-013・ADR-033）
//
// ピクセルパーフェクトのための決まり（ADR-019 と同じ）：
//   - 1 マスは「scale × 画面の倍率」を切り捨てた整数ピクセル（最低 1px）。
//     1.5 倍や 2.625 倍の端末でも、マスの境界がピクセルの境界からずれない。
//     そのかわり論理ピクセルで見た大きさは、端数の倍率で少し小さくなる
//   - Flutter は部品の位置を端数のまま持つ（中央寄せなどで 0.5px ずれる）ので、
//     描くときに画面上の位置を実際のピクセルの境界まで丸めてずらす
//   - アンチエイリアスは切る（矩形の端を半透明にしない）
import 'dart:math' as math;

import 'package:flutter/widgets.dart';

import 'definition.dart';
import 'palette.dart';

/// 1 マスの大きさ（実際のピクセル）。scale × 画面の倍率 を切り捨てた整数で、最低 1（ADR-019）
int dotwearCellPx(int scale, double devicePixelRatio) =>
    math.max(1, (math.max(1, scale) * devicePixelRatio + 1e-4).floor());

class DotwearIcon extends StatelessWidget {
  const DotwearIcon(
    this.icon, {
    super.key,
    this.scale = 1,
    this.grid = DotwearIconGrid.grid16,
    this.semanticLabel,
    this.color,
  });

  /// アイコン（`DotwearIcons.save` など）
  final DotwearIconDefinition icon;

  /// 表示倍率。整数だけ（端数はマスの境界をにじませるため受け付けない）。1 未満は 1 にする
  final int scale;

  /// 使うグリッド。描き分けがないときは 16 を使う
  final DotwearIconGrid grid;

  /// VoiceOver・TalkBack で読み上げる名前。null なら装飾として読み上げから外す（Material の Icon と同じ）
  final String? semanticLabel;

  /// `#` のマスの色。指定しなければ DotwearIconTheme、それもなければ IconTheme の色
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final (actualGrid, layers) = icon.layersFor(grid);
    final ratio = MediaQuery.maybeDevicePixelRatioOf(context) ?? View.of(context).devicePixelRatio;
    final theme = DotwearIconTheme.of(context);
    final painted = _DotwearIconBox(
      layers: layers,
      gridSize: actualGrid.size,
      cellPx: dotwearCellPx(scale, ratio),
      devicePixelRatio: ratio,
      foreground: color ?? theme.color ?? IconTheme.of(context).color ?? const Color(0xFF000000),
      palette: theme.palette ?? dotwearDefaultPalette,
    );
    final label = semanticLabel;
    if (label == null) return ExcludeSemantics(child: painted);
    return Semantics(label: label, image: true, excludeSemantics: true, child: painted);
  }
}

class _DotwearIconBox extends LeafRenderObjectWidget {
  const _DotwearIconBox({
    required this.layers,
    required this.gridSize,
    required this.cellPx,
    required this.devicePixelRatio,
    required this.foreground,
    required this.palette,
  });

  final List<DotwearIconLayer> layers;
  final int gridSize;
  final int cellPx;
  final double devicePixelRatio;
  final Color foreground;
  final DotwearPalette palette;

  @override
  RenderDotwearIcon createRenderObject(BuildContext context) => RenderDotwearIcon(
        layers: layers,
        gridSize: gridSize,
        cellPx: cellPx,
        devicePixelRatio: devicePixelRatio,
        foreground: foreground,
        palette: palette,
      );

  @override
  void updateRenderObject(BuildContext context, RenderDotwearIcon renderObject) {
    renderObject
      ..layers = layers
      ..gridSize = gridSize
      ..cellPx = cellPx
      ..devicePixelRatio = devicePixelRatio
      ..foreground = foreground
      ..palette = palette;
  }
}

/// アイコンを描く RenderBox。大きさは「マスの数 × 1 マスの実際のピクセル ÷ 画面の倍率」の正方形
class RenderDotwearIcon extends RenderBox {
  RenderDotwearIcon({
    required List<DotwearIconLayer> layers,
    required int gridSize,
    required int cellPx,
    required double devicePixelRatio,
    required Color foreground,
    required DotwearPalette palette,
  })  : _layers = layers,
        _gridSize = gridSize,
        _cellPx = cellPx,
        _devicePixelRatio = devicePixelRatio,
        _foreground = foreground,
        _palette = palette;

  List<DotwearIconLayer> _layers;
  set layers(List<DotwearIconLayer> value) {
    if (identical(value, _layers)) return;
    _layers = value;
    markNeedsPaint();
  }

  int _gridSize;
  set gridSize(int value) {
    if (value == _gridSize) return;
    _gridSize = value;
    markNeedsLayout();
  }

  int _cellPx;
  set cellPx(int value) {
    if (value == _cellPx) return;
    _cellPx = value;
    markNeedsLayout();
  }

  double _devicePixelRatio;
  set devicePixelRatio(double value) {
    if (value == _devicePixelRatio) return;
    _devicePixelRatio = value;
    markNeedsLayout();
  }

  Color _foreground;

  /// テスト用：いま使っている前景色
  @visibleForTesting
  Color get debugForeground => _foreground;

  set foreground(Color value) {
    if (value == _foreground) return;
    _foreground = value;
    markNeedsPaint();
  }

  DotwearPalette _palette;

  /// テスト用：いま使っているパレット
  @visibleForTesting
  DotwearPalette get debugPalette => _palette;

  set palette(DotwearPalette value) {
    if (value == _palette) return;
    _palette = value;
    markNeedsPaint();
  }

  /// 一辺の大きさ（論理ピクセル）
  double get _side => _gridSize * _cellPx / _devicePixelRatio;

  @override
  bool get sizedByParent => true;

  @override
  Size computeDryLayout(BoxConstraints constraints) => constraints.constrain(Size.square(_side));

  @override
  double computeMinIntrinsicWidth(double height) => _side;
  @override
  double computeMaxIntrinsicWidth(double height) => _side;
  @override
  double computeMinIntrinsicHeight(double width) => _side;
  @override
  double computeMaxIntrinsicHeight(double width) => _side;

  @override
  void paint(PaintingContext context, Offset offset) {
    // 親から大きい枠を渡されたら、その中央に置く
    final centered = offset + Offset((size.width - _side) / 2, (size.height - _side) / 2);
    final origin = centered + _snapDelta(centered - offset);
    final cell = _cellPx / _devicePixelRatio;
    final paint = Paint()..isAntiAlias = false;
    final canvas = context.canvas;
    for (final layer in _layers) {
      final slot = layer.color.slot;
      // パレットに色がないスロットは描かない（利用者が独自のパレットを渡したときだけ起きる）
      final color = slot == null ? _foreground : _palette[slot];
      if (color == null) continue;
      paint.color = color;
      final r = layer.packedRects;
      for (var i = 0; i + 3 < r.length; i += 4) {
        canvas.drawRect(Rect.fromLTWH(origin.dx + r[i] * cell, origin.dy + r[i + 1] * cell, r[i + 2] * cell, r[i + 3] * cell), paint);
      }
    }
  }

  /// アイコンの左上（この RenderBox の中での位置 [local]）を、実際のピクセルの境界に合わせるためのずらし幅（論理ピクセル）。
  /// getTransformTo(null) は画面の論理ピクセルへの変換なので、倍率を掛けて実際のピクセルにしてから丸める。
  /// 画面までの変換が平行移動と拡大だけのとき（ふつうの配置）に効く。回転などがあればずらさない
  Offset _snapDelta(Offset local) {
    final toScreen = getTransformTo(null);
    final p0 = MatrixUtils.transformPoint(toScreen, local);
    final p1 = MatrixUtils.transformPoint(toScreen, local + const Offset(1, 1));
    // この RenderBox の 1 論理ピクセルが、実際のピクセルでいくつになるか
    final unitX = (p1.dx - p0.dx) * _devicePixelRatio;
    final unitY = (p1.dy - p0.dy) * _devicePixelRatio;
    if (unitX <= 0 || unitY <= 0) return Offset.zero;
    final px = p0.dx * _devicePixelRatio;
    final py = p0.dy * _devicePixelRatio;
    return Offset((px.roundToDouble() - px) / unitX, (py.roundToDouble() - py) / unitY);
  }

  @override
  bool hitTestSelf(Offset position) => true;
}
