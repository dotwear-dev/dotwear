// デモの流れ（ログイン → 一覧 → 詳細・設定）を、読み上げの名前で操作して確かめる
import 'package:dotwear_demo/demo_app.dart';
import 'package:dotwear_demo/orders.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

Finder field(String label) => find.byWidgetPredicate((w) => w is Semantics && w.properties.label == label).first;

void main() {
  testWidgets('メールアドレスの形式が違えば、入力欄のヒントとしてエラーを伝える。正しければ一覧へ進む', (tester) async {
    final handle = tester.ensureSemantics();
    await tester.pumpWidget(const DemoApp());
    await tester.enterText(find.descendant(of: field('メールアドレス'), matching: find.byType(TextField)), 'user');
    await tester.tap(find.text('ログイン').last);
    await tester.pump();
    final node = tester.getSemantics(find.descendant(of: field('メールアドレス'), matching: find.byType(TextField)));
    expect(node.hint, 'メールアドレスの形式が正しくありません');

    await tester.enterText(find.descendant(of: field('メールアドレス'), matching: find.byType(TextField)), 'user@example.com');
    await tester.tap(find.text('ログイン').last);
    await tester.pump(const Duration(seconds: 1));
    await tester.pumpAndSettle();
    expect(find.text('受注一覧'), findsOneWidget);
    handle.dispose();
  });

  testWidgets('一覧の行は 1 つのボタンとして読み上げ、押すと詳細を開く。下書きは確定できる', (tester) async {
    final handle = tester.ensureSemantics();
    await tester.pumpWidget(const DemoApp(initialRoute: 'list'));
    final label = 'ドット工房、A-1025、下書き、${yen(54800)}';
    expect(tester.getSemantics(find.bySemanticsLabel(label)), matchesSemantics(label: label, isButton: true, hasTapAction: true));
    await tester.tap(find.byKey(const ValueKey('order-A-1025')));
    await tester.pumpAndSettle();
    expect(find.text('状態'), findsOneWidget);
    await tester.tap(find.text('確定する'));
    await tester.pump();
    expect(find.bySemanticsLabel('状態、確定'), findsOneWidget);

    // 戻るボタン（アイコンだけ）は名前で読み上げる
    await tester.tap(find.bySemanticsLabel('戻る'));
    await tester.pumpAndSettle();
    expect(find.bySemanticsLabel('ドット工房、A-1025、確定、${yen(54800)}'), findsOneWidget);
    handle.dispose();
  });

  testWidgets('検索で絞り込める', (tester) async {
    await tester.pumpWidget(const DemoApp(initialRoute: 'list'));
    await tester.enterText(find.byType(TextField), '8bit');
    await tester.pump();
    expect(find.byKey(const ValueKey('order-A-1027')), findsOneWidget);
    expect(find.byKey(const ValueKey('order-A-1024')), findsNothing);
  });

  testWidgets('設定：プッシュ通知を切ると通知音は押せなくなる。ログアウトでログインに戻る', (tester) async {
    final handle = tester.ensureSemantics();
    await tester.pumpWidget(const DemoApp(initialRoute: 'settings'));
    expect(tester.getSemantics(find.text('通知音')), matchesSemantics(label: '通知音', hasToggledState: true, hasEnabledState: true, isEnabled: true, isFocusable: true, hasTapAction: true, hasFocusAction: true));
    await tester.tap(find.text('プッシュ通知'));
    await tester.pumpAndSettle();
    expect(tester.getSemantics(find.text('通知音')), matchesSemantics(label: '通知音', hasToggledState: true, hasEnabledState: true, isEnabled: false));
    await tester.tap(find.text('ログアウト'));
    await tester.pumpAndSettle();
    expect(find.text('メールアドレス'), findsOneWidget);
    handle.dispose();
  });

  test('金額は 3 桁ごとに区切る', () {
    expect(yen(9900), '¥9,900');
    expect(yen(310500), '¥310,500');
    expect(yen(0), '¥0');
  });
}
