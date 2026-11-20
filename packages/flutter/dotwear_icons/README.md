# dotwear_icons

Pixel-art icons for Flutter, from the [Dotwear](https://dotwear.dev) design system.

```dart
import 'package:dotwear_icons/dotwear_icons.dart';

DotwearIcon(DotwearIcons.save, scale: 2, semanticLabel: 'Save')
```

- `scale` is an integer. One cell is `scale × devicePixelRatio` **rounded down to whole device pixels**, and the icon is moved onto the device pixel grid when it is painted. Edges stay crisp on fractional densities such as 1.5× or 2.625×. On those screens the icon is slightly smaller in logical pixels; on integer densities it is exactly `16 × scale`.
- Without `semanticLabel` the icon is decorative (excluded from VoiceOver and TalkBack). With it, the icon is read as an image.
- `#` cells use `color`, then `DotwearIconTheme`, then the ambient `IconTheme` color. Multi-color cells use the palette (slots 2–9):

```dart
DotwearIconTheme(
  palette: DotwearPalettes.retroGreen,
  child: DotwearIcon(DotwearIcons.folder, scale: 2),
)
```

- Pick an icon at run time with `DotwearIcons.named('save')` (this keeps every icon in your app).
- Ask for a hand-tuned drawing with `grid: DotwearIconGrid.grid24`; icons without one use their 16 grid.

Docs: https://dotwear.dev · License: MIT
