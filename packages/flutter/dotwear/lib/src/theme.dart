// テーマ：部品が使う色と寸法。Flutter の ThemeExtension に乗せる（ADR-033）。
//   MaterialApp(theme: const DotwearThemeData().toThemeData())
// 寸法はドット数で持ち、実寸は Dotwear.of(context).dots(n) で求める。
// 1 ドットは「pixelUnit × 画面の倍率」を切り捨てた整数ピクセル（ADR-019）。端数の倍率の端末でもにじまない
import 'package:dotwear_icons/dotwear_icons.dart';
import 'package:material_ui/material_ui.dart';

import 'generated/dotwear_tokens.g.dart';
import 'typography.dart';

@immutable
class DotwearColors {
  const DotwearColors({
    this.background = DotwearTokens.colorBg,
    this.foreground = DotwearTokens.colorFg,
    this.border = DotwearTokens.colorBorder,
    this.primary = DotwearTokens.colorPrimary,
    this.onPrimary = DotwearTokens.colorOnPrimary,
    this.danger = DotwearTokens.colorDanger,
    this.focus = DotwearTokens.colorFocus,
    this.disabled = DotwearTokens.colorDisabled,
  });

  final Color background;
  final Color foreground;
  final Color border;
  final Color primary;
  final Color onPrimary;
  final Color danger;
  final Color focus;
  final Color disabled;

  DotwearColors copyWith({
    Color? background,
    Color? foreground,
    Color? border,
    Color? primary,
    Color? onPrimary,
    Color? danger,
    Color? focus,
    Color? disabled,
  }) =>
      DotwearColors(
        background: background ?? this.background,
        foreground: foreground ?? this.foreground,
        border: border ?? this.border,
        primary: primary ?? this.primary,
        onPrimary: onPrimary ?? this.onPrimary,
        danger: danger ?? this.danger,
        focus: focus ?? this.focus,
        disabled: disabled ?? this.disabled,
      );

  @override
  bool operator ==(Object other) =>
      other is DotwearColors &&
      other.background == background &&
      other.foreground == foreground &&
      other.border == border &&
      other.primary == primary &&
      other.onPrimary == onPrimary &&
      other.danger == danger &&
      other.focus == focus &&
      other.disabled == disabled;

  @override
  int get hashCode => Object.hash(background, foreground, border, primary, onPrimary, danger, focus, disabled);
}

/// Dotwear のテーマの値。指定しなければトークン（tokens/*.json）どおり
@immutable
class DotwearThemeData extends ThemeExtension<DotwearThemeData> {
  const DotwearThemeData({
    this.colors = const DotwearColors(),
    this.pixelUnit = DotwearTokens.shapePixelUnit,
    this.borderWidth = DotwearTokens.shapeBorderWidth,
    this.borderGap = DotwearTokens.shapeBorderGap,
    this.borderInnerWidth = DotwearTokens.shapeBorderInnerWidth,
    this.cornerStep = DotwearTokens.shapeCornerStep,
  })  : assert(pixelUnit >= 1, 'pixelUnit は 1 以上の整数にしてください'),
        assert(borderWidth >= 0 && borderGap >= 0 && borderInnerWidth >= 0 && cornerStep >= 0, '寸法は 0 以上の整数（ドット数）にしてください');

  final DotwearColors colors;

  /// 1 ドットの大きさ（論理ピクセル）。整数だけ（端数はマスの境界をにじませるため、型で受け付けない）
  final int pixelUnit;

  /// 枠線の太さ（ドット数）
  final int borderWidth;

  /// 二重線の枠の、外の線と内の線のすき間（ドット数）。ADR-027
  final int borderGap;

  /// 二重線の枠の、内の線の太さ（ドット数）。0 なら一重の枠
  final int borderInnerWidth;

  /// 角の階段の段数
  final int cornerStep;

  /// 外の線の太さが [outerWidth] のとき、枠の外側から内の線の内側までの厚さ（ドット数）。中身はここより内側に置く
  int frameInset([int? outerWidth]) {
    final outer = outerWidth ?? borderWidth;
    return borderInnerWidth > 0 ? outer + borderGap + borderInnerWidth : outer;
  }

  /// いま効いているテーマ。ThemeData に入っていなければトークンどおりの値
  static DotwearThemeData of(BuildContext context) => Theme.of(context).extension<DotwearThemeData>() ?? const DotwearThemeData();

  /// この値を入れた Material の ThemeData。色・同梱フォント・アイコンの色をそろえ、波紋（なめらかな円）を消す
  ThemeData toThemeData() {
    final scheme = ColorScheme(
      brightness: Brightness.light,
      primary: colors.primary,
      onPrimary: colors.onPrimary,
      secondary: colors.primary,
      onSecondary: colors.onPrimary,
      error: colors.danger,
      onError: colors.onPrimary,
      surface: colors.background,
      onSurface: colors.foreground,
    );
    return ThemeData(
      colorScheme: scheme,
      scaffoldBackgroundColor: colors.background,
      fontFamily: dotwearFontFamilyQualified,
      iconTheme: IconThemeData(color: colors.foreground),
      // 波紋やハイライトはなめらかな半透明の図形で、ドットの見た目と合わないので出さない（押したときは 1 ドット沈める）
      splashFactory: NoSplash.splashFactory,
      highlightColor: Colors.transparent,
      hoverColor: Colors.transparent,
      focusColor: Colors.transparent,
      textSelectionTheme: TextSelectionThemeData(
        cursorColor: colors.foreground,
        selectionColor: colors.disabled,
        selectionHandleColor: colors.foreground,
      ),
      extensions: [this],
    );
  }

  @override
  DotwearThemeData copyWith({
    DotwearColors? colors,
    int? pixelUnit,
    int? borderWidth,
    int? borderGap,
    int? borderInnerWidth,
    int? cornerStep,
  }) =>
      DotwearThemeData(
        colors: colors ?? this.colors,
        pixelUnit: pixelUnit ?? this.pixelUnit,
        borderWidth: borderWidth ?? this.borderWidth,
        borderGap: borderGap ?? this.borderGap,
        borderInnerWidth: borderInnerWidth ?? this.borderInnerWidth,
        cornerStep: cornerStep ?? this.cornerStep,
      );

  /// テーマの切り替えのアニメーションでは、途中の値を作らずに半分で切り替える（途中の色や端数の寸法はドットの見た目を壊す）
  @override
  DotwearThemeData lerp(DotwearThemeData? other, double t) => other == null || t < 0.5 ? this : other;

  @override
  bool operator ==(Object other) =>
      other is DotwearThemeData &&
      other.colors == colors &&
      other.pixelUnit == pixelUnit &&
      other.borderWidth == borderWidth &&
      other.borderGap == borderGap &&
      other.borderInnerWidth == borderInnerWidth &&
      other.cornerStep == cornerStep;

  @override
  int get hashCode => Object.hash(colors, pixelUnit, borderWidth, borderGap, borderInnerWidth, cornerStep);
}

/// 今のテーマの値と、ドット数を論理ピクセルに直す計算をまとめたもの
@immutable
class Dotwear {
  const Dotwear._(this.theme, this.devicePixelRatio, this.dotPx);

  /// いまのテーマと画面の倍率から作る
  factory Dotwear.of(BuildContext context) {
    final theme = DotwearThemeData.of(context);
    final ratio = MediaQuery.maybeDevicePixelRatioOf(context) ?? View.of(context).devicePixelRatio;
    return Dotwear._(theme, ratio, dotwearCellPx(theme.pixelUnit, ratio));
  }

  final DotwearThemeData theme;
  final double devicePixelRatio;

  /// 1 ドットの整数ピクセル
  final int dotPx;

  DotwearColors get colors => theme.colors;

  /// n ドット → 論理ピクセル。整数ピクセルから戻すので、実際のピクセルの境界に乗る
  double dots(int n) => n * dotPx / devicePixelRatio;
}
