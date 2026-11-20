// DotwearIcon の大きさ・読み上げ・色の決まりを確かめる（描いた結果のピクセルは pixel_roundtrip_test.dart）
import 'package:dotwear_icons/dotwear_icons.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

Widget host(Widget child) => Directionality(textDirection: TextDirection.ltr, child: Center(child: child));

RenderDotwearIcon renderOf(WidgetTester tester) =>
    tester.allRenderObjects.whereType<RenderDotwearIcon>().single;

void main() {
  test('1 マスは scale × 倍率 を切り捨てた整数ピクセルで、最低 1', () {
    expect(dotwearCellPx(1, 1), 1);
    expect(dotwearCellPx(1, 1.5), 1);
    expect(dotwearCellPx(2, 1.5), 3);
    expect(dotwearCellPx(1, 2.625), 2);
    expect(dotwearCellPx(3, 2.625), 7);
    expect(dotwearCellPx(0, 3), 3);
    // 浮動小数点の誤差で 1 つ小さくならない（0.1 × 3 などの倍率）
    expect(dotwearCellPx(1, 2.9999999), 3);
  });

  testWidgets('大きさは マスの数 × 1 マスのピクセル ÷ 倍率（論理ピクセル）', (tester) async {
    tester.view.devicePixelRatio = 2.625;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(host(const DotwearIcon(DotwearIcons.save, scale: 2)));
    // 2 × 2.625 = 5.25 → 5px。16 マスで 80px = 80 / 2.625 論理ピクセル
    expect(tester.getSize(find.byType(DotwearIcon)), const Size.square(80 / 2.625));
  });

  testWidgets('描き分けのないグリッドを頼むと 16 を使う', (tester) async {
    const icon = DotwearIconDefinition(name: 'only16', grids: {
      DotwearIconGrid.grid16: [DotwearIconLayer(DotwearIconColor.foreground, [0, 0, 1, 1])],
    });
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(host(const DotwearIcon(icon, grid: DotwearIconGrid.grid24)));
    expect(tester.getSize(find.byType(DotwearIcon)), const Size.square(16));
  });

  testWidgets('semanticLabel がなければ読み上げから外し、あれば画像として読む', (tester) async {
    final handle = tester.ensureSemantics();
    await tester.pumpWidget(host(const Column(mainAxisSize: MainAxisSize.min, children: [
      DotwearIcon(DotwearIcons.save),
      DotwearIcon(DotwearIcons.trash, semanticLabel: 'Delete'),
    ])));
    expect(find.bySemanticsLabel('Delete'), findsOneWidget);
    expect(tester.getSemantics(find.bySemanticsLabel('Delete')), matchesSemantics(label: 'Delete', isImage: true));
    // 装飾のアイコンは読み上げる名前を持たない（名前のある意味のノードは Delete の 1 つだけ）
    expect(find.bySemanticsLabel(RegExp('.+')), findsOneWidget);
    handle.dispose();
  });

  testWidgets('前景色は color → DotwearIconTheme → IconTheme の順で決まる', (tester) async {
    await tester.pumpWidget(host(const IconTheme(
      data: IconThemeData(color: Color(0xFF112233)),
      child: DotwearIcon(DotwearIcons.save),
    )));
    expect(renderOf(tester).debugForeground, const Color(0xFF112233));

    await tester.pumpWidget(host(const IconTheme(
      data: IconThemeData(color: Color(0xFF112233)),
      child: DotwearIconTheme(color: Color(0xFF445566), child: DotwearIcon(DotwearIcons.save)),
    )));
    expect(renderOf(tester).debugForeground, const Color(0xFF445566));

    await tester.pumpWidget(host(const DotwearIconTheme(
      color: Color(0xFF445566),
      child: DotwearIcon(DotwearIcons.save, color: Color(0xFF778899)),
    )));
    expect(renderOf(tester).debugForeground, const Color(0xFF778899));
  });

  testWidgets('パレットは内側の DotwearIconTheme が優先され、指定しない項目は外側を引き継ぐ', (tester) async {
    await tester.pumpWidget(host(const DotwearIcon(DotwearIcons.save)));
    expect(renderOf(tester).debugPalette, DotwearPalettes.default_);

    await tester.pumpWidget(host(const DotwearIconTheme(
      palette: DotwearPalettes.retroGreen,
      child: DotwearIconTheme(color: Color(0xFF010203), child: DotwearIcon(DotwearIcons.save)),
    )));
    expect(renderOf(tester).debugPalette, DotwearPalettes.retroGreen);
    expect(renderOf(tester).debugForeground, const Color(0xFF010203));
  });

  test('名前から選べる。パレットも名前（data-dw-palette と同じ）から選べる', () {
    expect(DotwearIcons.named('arrow-left'), same(DotwearIcons.arrowLeft));
    expect(DotwearIcons.named('nope'), isNull);
    expect(DotwearPalettes.byName['retro-green'], DotwearPalettes.retroGreen);
    expect(DotwearIcons.all, hasLength(greaterThan(50)));
  });
}
