// 部品の読み上げ（役割・名前・状態）と操作を確かめる。見た目のにじみは pixel_test.dart
import 'package:dotwear/dotwear.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

// allRenderObjects は要素ごとに数えるので、同じ RenderObject が何度も出る。.toSet() で 1 つにしてから数える
Future<void> pumpApp(WidgetTester tester, Widget child) => tester.pumpWidget(
      MaterialApp(theme: const DotwearThemeData().toThemeData(), home: Scaffold(body: Center(child: child))),
    );

void main() {
  group('DotwearButton', () {
    testWidgets('標準のボタンとして読み上げ、押せる', (tester) async {
      final handle = tester.ensureSemantics();
      var taps = 0;
      await pumpApp(tester, DotwearButton(onPressed: () => taps++, icon: DotwearIcons.save, child: const Text('Save')));
      expect(
        tester.getSemantics(find.byType(DotwearButton)),
        matchesSemantics(label: 'Save', isButton: true, hasEnabledState: true, isEnabled: true, isFocusable: true, hasTapAction: true, hasFocusAction: true),
      );
      await tester.tap(find.byType(DotwearButton));
      expect(taps, 1);
      handle.dispose();
    });

    testWidgets('onPressed が null なら押せないと読み上げる', (tester) async {
      final handle = tester.ensureSemantics();
      await pumpApp(tester, const DotwearButton(onPressed: null, child: Text('Save')));
      expect(tester.getSemantics(find.byType(DotwearButton)), matchesSemantics(label: 'Save', isButton: true, hasEnabledState: true, isEnabled: false));
      handle.dispose();
    });

    testWidgets('アイコンだけのボタンは semanticLabel を名前にする', (tester) async {
      final handle = tester.ensureSemantics();
      await pumpApp(tester, DotwearButton(onPressed: () {}, icon: DotwearIcons.trash, semanticLabel: 'Delete'));
      expect(find.bySemanticsLabel('Delete'), findsOneWidget);
      handle.dispose();
    });

    testWidgets('タップ領域は 48 × 48 以上、見た目は寸法の表どおり（medium は 16 ドット＋影 1 ドット）', (tester) async {
      tester.view.devicePixelRatio = 2;
      addTearDown(tester.view.reset);
      await pumpApp(tester, DotwearButton(onPressed: () {}, icon: DotwearIcons.save));
      final size = tester.getSize(find.byType(DotwearButton));
      expect(size.width, greaterThanOrEqualTo(48));
      expect(size.height, greaterThanOrEqualTo(48));
      final chrome = tester.allRenderObjects.whereType<RenderDotwearChrome>().first;
      // 1 ドット = 2 × 2 = 4px。高さ 16 ドット = 64px
      expect(chrome.debugBodyPx?.height, 64);
    });

    testWidgets('読み込み中は 3 つのドットを出し、名前は読み上げに残す', (tester) async {
      final handle = tester.ensureSemantics();
      await pumpApp(tester, DotwearButton(onPressed: () {}, loading: true, child: const Text('Save')));
      expect(find.byKey(const ValueKey('dotwear-loading')), findsOneWidget);
      expect(find.bySemanticsLabel('Save'), findsOneWidget);
      await tester.pump(const Duration(milliseconds: 300));
      handle.dispose();
    });

    testWidgets('押している間は外装の影を消して 1 ドット沈める', (tester) async {
      await pumpApp(tester, DotwearButton(onPressed: () {}, child: const Text('Save')));
      RenderDotwearChrome chrome() => tester.allRenderObjects.whereType<RenderDotwearChrome>().first;
      expect(chrome().style.pressed, isFalse);
      final gesture = await tester.startGesture(tester.getCenter(find.byType(DotwearButton)));
      await tester.pump();
      expect(chrome().style.pressed, isTrue);
      await gesture.up();
      await tester.pump();
      expect(chrome().style.pressed, isFalse);
    });
  });

  group('DotwearToggle', () {
    testWidgets('スイッチは toggled、チェックボックスは checked の状態を持ち、ラベルと 1 つにまとまる', (tester) async {
      final handle = tester.ensureSemantics();
      await pumpApp(
        tester,
        Column(mainAxisSize: MainAxisSize.min, children: [
          DotwearToggle(value: true, onChanged: (_) {}, child: const Text('Wi-Fi')),
          DotwearToggle(value: false, variant: DotwearToggleVariant.checkbox, onChanged: (_) {}, child: const Text('Agree')),
        ]),
      );
      expect(
        tester.getSemantics(find.text('Wi-Fi')),
        matchesSemantics(label: 'Wi-Fi', hasToggledState: true, isToggled: true, hasEnabledState: true, isEnabled: true, isFocusable: true, hasTapAction: true, hasFocusAction: true),
      );
      expect(
        tester.getSemantics(find.text('Agree')),
        matchesSemantics(label: 'Agree', hasCheckedState: true, isChecked: false, hasEnabledState: true, isEnabled: true, isFocusable: true, hasTapAction: true, hasFocusAction: true),
      );
      handle.dispose();
    });

    testWidgets('タップとキーボード（Space）で切り替わる', (tester) async {
      var value = false;
      await pumpApp(
        tester,
        StatefulBuilder(
          builder: (context, setState) => DotwearToggle(value: value, onChanged: (v) => setState(() => value = v), child: const Text('Wi-Fi')),
        ),
      );
      await tester.tap(find.text('Wi-Fi'));
      await tester.pump();
      expect(value, isTrue);
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.space);
      await tester.pump();
      expect(value, isFalse);
    });

    testWidgets('onChanged が null なら押せないと読み上げ、タップしても変わらない', (tester) async {
      final handle = tester.ensureSemantics();
      await pumpApp(tester, const DotwearToggle(value: false, onChanged: null, child: Text('Wi-Fi')));
      expect(tester.getSemantics(find.text('Wi-Fi')), matchesSemantics(label: 'Wi-Fi', hasToggledState: true, hasEnabledState: true, isEnabled: false));
      handle.dispose();
    });

    testWidgets('チェックの形は toggle.md どおり（オンのときだけ描く）', (tester) async {
      await pumpApp(tester, DotwearToggle(value: true, variant: DotwearToggleVariant.checkbox, onChanged: (_) {}, semanticLabel: 'Agree'));
      final chrome = tester.allRenderObjects.whereType<RenderDotwearChrome>().toSet().single;
      expect(chrome.debugMarks.length, dotwearCheckMark.join().split('').where((c) => c == '#').length);
    });
  });

  group('DotwearTextField', () {
    testWidgets('ラベルを入力欄の名前として、エラーをヒントとして読み上げ、入力できる', (tester) async {
      final handle = tester.ensureSemantics();
      final controller = TextEditingController();
      addTearDown(controller.dispose);
      await pumpApp(tester, SizedBox(width: 300, child: DotwearTextField(label: 'Email', controller: controller, error: 'Enter a valid email')));
      final node = tester.getSemantics(find.byType(TextField));
      expect(node.label, contains('Email'));
      expect(node.hint, 'Enter a valid email');
      expect(node.flagsCollection.isTextField, isTrue);
      // 見た目のラベルとエラーの文字は、二重に読み上げない
      expect(find.bySemanticsLabel('Enter a valid email'), findsNothing);
      await tester.enterText(find.byType(TextField), 'a@b.c');
      expect(controller.text, 'a@b.c');
      handle.dispose();
    });

    testWidgets('入力中はフォーカスリングを出す', (tester) async {
      await pumpApp(tester, const SizedBox(width: 300, child: DotwearTextField(label: 'Email')));
      RenderDotwearChrome chrome() => tester.allRenderObjects.whereType<RenderDotwearChrome>().toSet().single;
      expect(chrome().style.focusRing, isNull);
      await tester.tap(find.byType(TextField));
      await tester.pump();
      expect(chrome().style.focusRing, const DotwearColors().focus);
    });
  });

  testWidgets('DotwearCard は中身の読み上げを変えない', (tester) async {
    final handle = tester.ensureSemantics();
    await pumpApp(tester, const DotwearCard(child: Column(mainAxisSize: MainAxisSize.min, children: [Text('Storage'), Text('12 GB used')])));
    expect(find.bySemanticsLabel('Storage'), findsOneWidget);
    expect(find.bySemanticsLabel('12 GB used'), findsOneWidget);
    handle.dispose();
  });

  test('テーマは整数の寸法だけを持ち、切り替えでは途中の値を作らない', () {
    const a = DotwearThemeData();
    final b = a.copyWith(pixelUnit: 3, colors: a.colors.copyWith(primary: const Color(0xFF306230)));
    expect(a.lerp(b, 0.4), same(a));
    expect(a.lerp(b, 0.6), same(b));
    expect(b.toThemeData().extension<DotwearThemeData>(), b);
    expect(a.frameInset(), 3);
    expect(a.copyWith(borderInnerWidth: 0).frameInset(2), 2);
  });
}
