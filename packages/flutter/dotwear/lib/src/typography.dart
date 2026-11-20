// 部品の文字のスタイル。同梱の DotGothic16 を使い、太字にしない（合成した太字はドットの境界がにじむため。ADR-026）
import 'package:flutter/painting.dart';

import 'generated/dotwear_tokens.g.dart';

/// 同梱フォントの名前。TextStyle では package: 'dotwear' と一緒に使う
const dotwearFontFamily = DotwearTokens.typographyFamily;

/// パッケージ名まで含めたフォントの名前（ThemeData.fontFamily に渡すとき用）
const dotwearFontFamilyQualified = 'packages/dotwear/$dotwearFontFamily';

/// ボタンなどのラベルの文字
TextStyle dotwearLabelStyle(Color color) => TextStyle(
      fontFamily: dotwearFontFamily,
      package: 'dotwear',
      fontSize: DotwearTokens.typographyLabel.toDouble(),
      fontWeight: FontWeight.normal,
      color: color,
    );

/// 本文・入力欄の文字
TextStyle dotwearBodyStyle(Color color) => TextStyle(
      fontFamily: dotwearFontFamily,
      package: 'dotwear',
      fontSize: DotwearTokens.typographyBody.toDouble(),
      fontWeight: FontWeight.normal,
      color: color,
    );
