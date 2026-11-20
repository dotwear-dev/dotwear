/// Dotwear の UI 一式（ADR-033）。アイコン（dotwear_icons）も再 export する。
///
/// ```dart
/// MaterialApp(theme: const DotwearThemeData().toThemeData(), home: …)
///
/// DotwearButton(onPressed: save, icon: DotwearIcons.save, child: const Text('Save'))
/// ```
library;

export 'package:dotwear_icons/dotwear_icons.dart';

export 'src/button.dart';
export 'src/card.dart';
export 'src/chrome.dart' show DotwearChrome, DotwearChromeMark, RenderDotwearChrome;
export 'src/chrome_geometry.dart' show DotwearChromeStyle, PxRect, steppedBands, steppedBorderBands, chromeRects;
export 'src/generated/dotwear_tokens.g.dart';
export 'src/text_field.dart';
export 'src/theme.dart';
export 'src/toggle.dart';
export 'src/typography.dart';
