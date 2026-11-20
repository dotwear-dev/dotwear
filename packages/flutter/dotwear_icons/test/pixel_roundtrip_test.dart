// pixel-roundtrip（最重要）：すべてのアイコンを倍率 1・1.5・2・2.625・3 で描き、
// 元データのマス目と実際のピクセル単位で一致することを確かめる（ADR-019・ADR-033）。
// アイコンは端数の位置（x.3, y.45）に置き、位置の丸めが効いていること、矩形の端がにじまないことも同時に見る
import 'dart:ui' as ui;

import 'package:dotwear_icons/dotwear_icons.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

import 'generated/source_grids.g.dart';

const ratios = [1.0, 1.5, 2.0, 2.625, 3.0];
const spacing = 40.0; // アイコンどうしの間隔（論理ピクセル）。24 マス × 1 マスより広くする
const columns = 10;
// 外側 1px も見るので、画像の端から少し離す（端数は位置の丸めを試すため）
const fractional = Offset(2.3, 2.45);
const foreground = Color(0xFF000000);

Offset slot(int i) => Offset((i % columns) * spacing, (i ~/ columns) * spacing) + fractional;

void main() {
  for (final ratio in ratios) {
    testWidgets('倍率 $ratio：すべてのアイコンが元データとピクセル単位で一致する', (tester) async {
      final rows = (sourceGrids.length / columns).ceil();
      tester.view.devicePixelRatio = ratio;
      tester.view.physicalSize = Size(columns * spacing * ratio, (rows * spacing + 1) * ratio);
      addTearDown(tester.view.reset);

      final key = GlobalKey();
      await tester.pumpWidget(
        Directionality(
          textDirection: TextDirection.ltr,
          child: RepaintBoundary(
            key: key,
            child: Stack(
              children: [
                for (final (i, (icon, grid, _)) in sourceGrids.indexed)
                  Positioned(
                    left: slot(i).dx,
                    top: slot(i).dy,
                    child: DotwearIcon(icon, grid: grid, color: foreground),
                  ),
              ],
            ),
          ),
        ),
      );

      final boundary = tester.renderObject<RenderRepaintBoundary>(find.byKey(key));
      final (width, pixels) = (await tester.runAsync(() async {
        final image = await boundary.toImage(pixelRatio: ratio);
        final data = await image.toByteData(format: ui.ImageByteFormat.rawRgba);
        return (image.width, data!.buffer.asUint32List());
      }))!;

      final cell = dotwearCellPx(1, ratio);
      final failures = <String>[];
      for (final (i, (icon, grid, source)) in sourceGrids.indexed) {
        final left = (slot(i).dx * ratio).round();
        final top = (slot(i).dy * ratio).round();
        // アイコンの正方形と、その外側 1px（はみ出し・にじみがないこと）を見る
        for (var y = -1; y <= grid.size * cell; y++) {
          for (var x = -1; x <= grid.size * cell; x++) {
            final inside = x >= 0 && y >= 0 && x < grid.size * cell && y < grid.size * cell;
            final char = inside ? source[y ~/ cell][x ~/ cell] : '.';
            final expected = expectedRgba(char);
            final actual = pixels[(top + y) * width + (left + x)];
            if (actual != expected) {
              failures.add('${icon.name}/${grid.size} (${x ~/ cell}, ${y ~/ cell}) の px ($x, $y)：'
                  '期待 ${hex(expected)}、実際 ${hex(actual)}');
              break;
            }
          }
          if (failures.isNotEmpty && failures.last.startsWith('${icon.name}/${grid.size}')) break;
        }
      }
      expect(failures, isEmpty, reason: failures.take(10).join('\n'));
    });
  }
}

/// マスの文字 → 画像の 1 ピクセル（RGBA をリトルエンディアンで読んだ 32 ビット）
int expectedRgba(String char) {
  if (char == '.') return 0;
  final color = char == '#' ? foreground : dotwearDefaultPalette[int.parse(char)]!;
  final argb = color.toARGB32();
  final a = argb >> 24 & 0xFF, r = argb >> 16 & 0xFF, g = argb >> 8 & 0xFF, b = argb & 0xFF;
  return (a << 24) | (b << 16) | (g << 8) | r;
}

String hex(int rgbaLe) => '#${(rgbaLe & 0xFFFFFFFF).toRadixString(16).padLeft(8, '0')}';
