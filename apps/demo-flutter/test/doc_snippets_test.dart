// ドキュメントサイトに載せるコード例（doc_snippets/snippets.dart）を実際に描いて、実行時にも落ちないことを確かめる。
// 静的解析は flutter analyze が見ている
import 'package:dotwear/dotwear.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

import '../doc_snippets/snippets.dart' as s;

Widget host(Widget child) => MaterialApp(
      theme: const DotwearThemeData().toThemeData(),
      home: Scaffold(body: SingleChildScrollView(child: child)),
    );

void main() {
  testWidgets('Getting Started の例はボタンを出す', (tester) async {
    await tester.pumpWidget(const s.MyApp());
    expect(find.text('Save'), findsOneWidget);
  });

  final cases = <String, Widget>{
    'アイコン': const s.IconSnippets(),
    'ボタン': const s.ButtonSnippets(isSaving: true),
    '入力欄': const s.TextFieldSnippet(emailError: 'Enter a valid email'),
    'トグル': const s.ToggleSnippet(),
    'カード': const s.CardSnippet(),
    'テーマを読む': const s.Badge(),
  };
  for (final MapEntry(:key, :value) in cases.entries) {
    testWidgets('$key の例を描ける', (tester) async {
      await tester.pumpWidget(host(value));
      expect(tester.takeException(), isNull);
      // 読み込み中のドットのタイマーを止めるため、画面を外す
      await tester.pumpWidget(const SizedBox());
    });
  }

  testWidgets('テーマの例を描ける', (tester) async {
    await tester.pumpWidget(const s.ThemeRoot());
    expect(find.text('Root'), findsOneWidget);
    await tester.pumpWidget(const s.ThemeCustom());
    expect(Theme.of(tester.element(find.text('Root'))).extension<DotwearThemeData>()?.colors.primary, const Color(0xFFCC334D));
    expect(s.primary, DotwearTokens.colorPrimary);
  });
}
