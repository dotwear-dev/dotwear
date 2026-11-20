# dotwear

Pixel-art UI for Flutter, from the [Dotwear](https://dotwear.dev) design system: buttons, text fields, cards and toggles, design tokens, and the bundled pixel font DotGothic16. It re-exports [`dotwear_icons`](https://pub.dev/packages/dotwear_icons).

Built on [`material_ui`](https://pub.dev/packages/material_ui) (Flutter 3.47+).

```dart
import 'package:dotwear/dotwear.dart';
import 'package:material_ui/material_ui.dart';

MaterialApp(
  theme: const DotwearThemeData().toThemeData(),
  home: Scaffold(
    body: DotwearButton(
      onPressed: save,
      icon: DotwearIcons.save,
      child: const Text('Save'),
    ),
  ),
)
```

## Components

```dart
DotwearButton(onPressed: save, variant: DotwearButtonVariant.secondary, size: DotwearButtonSize.small, child: const Text('Cancel'))
DotwearTextField(label: 'Email', controller: email, error: emailError)
DotwearToggle(value: wifi, onChanged: (v) => setState(() => wifi = v), child: const Text('Wi-Fi'))
DotwearToggle(value: agree, variant: DotwearToggleVariant.checkbox, onChanged: …, child: const Text('I agree'))
DotwearCard(child: …)
```

- `DotwearButton` is a standard `TextButton`; `DotwearTextField` is a standard `TextField`. Screen readers, keyboard focus, text input and IME work as usual. Toggles report `toggled` (switch) or `checked` (checkbox) like the standard controls, and Space toggles them.
- Touch targets are at least 48 × 48.
- To put the look on your own button, use `DotwearButtonStyle.of(context)` **and pass `clipBehavior: Clip.none`** (otherwise the button's default anti-aliased clip blurs the frame and hides the shadow).
- Pixel frames are drawn on whole device pixels, without anti-aliasing, so edges stay crisp on fractional densities such as 2.625×.

## Theme

```dart
final theme = const DotwearThemeData().copyWith(
  colors: const DotwearColors().copyWith(primary: Color(0xFF306230)),
);
MaterialApp(theme: theme.toThemeData())

// In a widget
final dw = Dotwear.of(context);
Padding(padding: EdgeInsets.all(dw.dots(4)), child: …)   // 4 dots, a whole number of device pixels
```

- Lengths are in **dots**. One dot is `pixelUnit × devicePixelRatio`, rounded down to whole device pixels.
- `DotwearTokens` holds the raw token values.

## Font

DotGothic16 (SIL Open Font License 1.1) is bundled. `toThemeData()` sets it as the app font; elsewhere use `TextStyle(fontFamily: 'DotGothic16', package: 'dotwear')`. It is drawn on a 16px grid, so it is sharpest at 16, 32 or 48.

Docs: https://dotwear.dev · License: MIT (font: OFL 1.1)
