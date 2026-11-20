// にじみの検査：文字を含まない部品（カード・スイッチ・チェックボックス・アイコンだけのボタン・空の入力欄）を、
// 倍率 1・1.5・2・2.625・3 で端数の位置に置いて画像にし、すべてのピクセルが 4 階調の色のどれかちょうどであることを確かめる。
// 外装の端が実際のピクセルの境界からずれていれば、中間の色（アンチエイリアス）が出る（ADR-019・ADR-033）
import 'dart:ui' as ui;

import 'package:dotwear/dotwear.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

const ratios = [1.0, 1.5, 2.0, 2.625, 3.0];

/// 4 階調（tokens/color.json）。RGBA をリトルエンディアンで読んだ 32 ビットにしておく
final allowed = {
  for (final c in const [DotwearTokens.colorBg, DotwearTokens.colorFg, DotwearTokens.colorFocus, DotwearTokens.colorDisabled]) rgbaLe(c),
};

int rgbaLe(Color color) {
  final argb = color.toARGB32();
  return (argb >> 24 & 0xFF) << 24 | (argb & 0xFF) << 16 | (argb >> 8 & 0xFF) << 8 | (argb >> 16 & 0xFF);
}

/// 端数の位置（x.3, y.45 など）に部品を置く
Widget at(double x, double y, Widget child) => Positioned(left: x + 0.3, top: y + 0.45, child: child);

void main() {
  for (final ratio in ratios) {
    testWidgets('倍率 $ratio：外装・つまみ・チェック・アイコンに中間の色が出ない', (tester) async {
      tester.view.devicePixelRatio = ratio;
      // 画像の大きさがどの倍率でも整数ピクセルになる大きさ（端数だと画像の端の列が半透明になる）
      tester.view.physicalSize = Size(400 * ratio, 320 * ratio);
      addTearDown(tester.view.reset);
      final key = GlobalKey();
      await tester.pumpWidget(
        MaterialApp(
          theme: const DotwearThemeData().toThemeData(),
          // TextField は Material の中に置く決まり（Scaffold の中と同じ）
          home: Material(
            child: RepaintBoundary(
              key: key,
              child: ColoredBox(
                color: DotwearTokens.colorBg,
                child: Stack(
                  children: [
                    at(10, 10, const DotwearCard(child: SizedBox(width: 61.7, height: 23.1))),
                    at(10, 80, const DotwearCard(variant: DotwearCardVariant.flat, child: SizedBox(width: 33.3, height: 12.9))),
                    at(150, 10, DotwearToggle(value: true, onChanged: (_) {}, semanticLabel: 'On')),
                    at(150, 70, DotwearToggle(value: false, onChanged: (_) {}, semanticLabel: 'Off')),
                    at(
                      220,
                      10,
                      DotwearToggle(value: true, variant: DotwearToggleVariant.checkbox, onChanged: (_) {}, semanticLabel: 'Checked'),
                    ),
                    at(220, 70, const DotwearToggle(value: true, onChanged: null, semanticLabel: 'Disabled')),
                    at(10, 140, DotwearButton(onPressed: () {}, icon: DotwearIcons.save, semanticLabel: 'Save')),
                    at(
                      90,
                      140,
                      DotwearButton(
                        onPressed: () {},
                        variant: DotwearButtonVariant.secondary,
                        size: DotwearButtonSize.large,
                        icon: DotwearIcons.trash,
                        semanticLabel: 'Delete',
                      ),
                    ),
                    at(190, 140, const DotwearButton(onPressed: null, icon: DotwearIcons.save, semanticLabel: 'Disabled')),
                    at(10, 210, const SizedBox(width: 201.7, child: DotwearTextField(label: '', error: null))),
                  ],
                ),
              ),
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
      final stray = <String>{};
      for (var i = 0; i < pixels.length && stray.length < 10; i++) {
        if (!allowed.contains(pixels[i])) stray.add('(${i % width}, ${i ~/ width}) #${pixels[i].toRadixString(16).padLeft(8, '0')}');
      }
      expect(stray, isEmpty, reason: '4 階調以外の色のピクセル：${stray.join(', ')}');
    });
  }
}
