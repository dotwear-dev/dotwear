// 多色アイコンのパレット（スロット 2〜9 の色）と、アイコンの既定の色を画面の一部ごとに配る仕組み。
// Web の CSS 変数と data-dw-palette、Android の LocalDotwearPalette・LocalDotwearIconColor に当たる。
//   DotwearIconTheme(palette: DotwearPalettes.retroGreen, child: …)
import 'package:flutter/foundation.dart' show mapEquals;
import 'package:flutter/widgets.dart';

import 'generated/dotwear_palettes.g.dart';

@immutable
final class DotwearPalette {
  const DotwearPalette(this.colors);

  /// スロット（2〜9）→ 色
  final Map<int, Color> colors;

  Color? operator [](int slot) => colors[slot];

  @override
  bool operator ==(Object other) => other is DotwearPalette && mapEquals(other.colors, colors);

  @override
  int get hashCode => Object.hashAllUnordered(colors.entries.map((e) => Object.hash(e.key, e.value)));
}

/// DotwearIcon の前景色とパレットを、子のウィジェットに配る。
/// 指定しなかった項目は外側の DotwearIconTheme を引き継ぐ。
/// 前景色をどこでも指定しなければ、Flutter 標準の IconTheme の色を使う（Material の Icon と同じ）
class DotwearIconTheme extends StatelessWidget {
  const DotwearIconTheme({super.key, this.color, this.palette, required this.child});

  /// `#` のマスの色
  final Color? color;

  /// パレット（スロット 2〜9）
  final DotwearPalette? palette;

  final Widget child;

  /// いま効いている値（外側の DotwearIconTheme とまとめたもの）。どこにもなければ両方 null
  static DotwearIconThemeData of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<_DotwearIconThemeScope>()?.data ?? const DotwearIconThemeData();

  @override
  Widget build(BuildContext context) {
    // 外側の値と合わせてから配る。こうすると、外側が変わったときも内側の依存先まで確実に描き直される
    final outer = of(context);
    return _DotwearIconThemeScope(
      data: DotwearIconThemeData(color: color ?? outer.color, palette: palette ?? outer.palette),
      child: child,
    );
  }
}

@immutable
final class DotwearIconThemeData {
  const DotwearIconThemeData({this.color, this.palette});

  final Color? color;
  final DotwearPalette? palette;

  @override
  bool operator ==(Object other) => other is DotwearIconThemeData && other.color == color && other.palette == palette;

  @override
  int get hashCode => Object.hash(color, palette);
}

class _DotwearIconThemeScope extends InheritedWidget {
  const _DotwearIconThemeScope({required this.data, required super.child});

  final DotwearIconThemeData data;

  @override
  bool updateShouldNotify(_DotwearIconThemeScope oldWidget) => oldWidget.data != data;
}

/// パレットの既定値（tokens/palette.json の default）
const dotwearDefaultPalette = DotwearPalettes.default_;
