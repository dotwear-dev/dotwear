// アイコンの定義。Web の定義オブジェクト（dwSave）、Swift・Kotlin の DotwearIconDefinition と同じく、
// 名前とグリッドごとの「色ごとの矩形」だけを持ち、色の値は持たない（ADR-013・ADR-019）。
// 個々のアイコンは生成物の DotwearIcons.save など
import 'package:flutter/foundation.dart';

/// グリッドのサイズ（マスの数）
enum DotwearIconGrid {
  grid12(12),
  grid16(16),
  grid24(24);

  const DotwearIconGrid(this.size);

  final int size;
}

/// マス目の色。`#` は前景色、`2`〜`9` はパレットのスロット
@immutable
final class DotwearIconColor {
  const DotwearIconColor._(this.slot);

  /// パレットのスロット（2〜9）の色
  const DotwearIconColor.palette(int this.slot);

  /// 前景色（`#` のマス）
  static const foreground = DotwearIconColor._(null);

  /// パレットのスロット。前景色なら null
  final int? slot;

  @override
  bool operator ==(Object other) => other is DotwearIconColor && other.slot == slot;

  @override
  int get hashCode => slot.hashCode;
}

/// 1 色ぶんの矩形の集まり。生成コードを小さくするため、矩形は [x, y, 幅, 高さ] を並べた整数のリストで持つ（マス単位）
@immutable
final class DotwearIconLayer {
  const DotwearIconLayer(this.color, this.packedRects);

  final DotwearIconColor color;
  final List<int> packedRects;

  /// 矩形の数
  int get rectCount => packedRects.length ~/ 4;
}

@immutable
final class DotwearIconDefinition {
  const DotwearIconDefinition({required this.name, required this.grids});

  /// 元データの名前（kebab-case。例："arrow-left"）
  final String name;

  /// グリッドごとの描き方。16 は必ずある
  final Map<DotwearIconGrid, List<DotwearIconLayer>> grids;

  /// 指定したグリッドの描き方。描き分けがないときは 16 を使う（Web・iOS・Android と同じ）
  (DotwearIconGrid, List<DotwearIconLayer>) layersFor(DotwearIconGrid grid) {
    final layers = grids[grid];
    if (layers != null) return (grid, layers);
    return (DotwearIconGrid.grid16, grids[DotwearIconGrid.grid16]!);
  }

  @override
  String toString() => 'DotwearIconDefinition($name)';
}
