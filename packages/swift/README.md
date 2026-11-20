# Dotwear for SwiftUI

Pixel-perfect pixel-art icons and pixel-style styles for standard SwiftUI controls. iOS 16+ / macOS 13+.

Add the package in Xcode: `https://github.com/dotwear-dev/dotwear-swift`

| Product | Use it for |
|---|---|
| `DotwearIcons` | Icons only |
| `Dotwear` | Icons + UI styles (re-exports `DotwearIcons`) |

```swift
import Dotwear

DotwearIcon(.save, scale: 2, label: Text("Save"))

Button("Save") { save() }
    .buttonStyle(.dotwear(.primary, size: .medium))
Toggle("Wi-Fi", isOn: $wifi).toggleStyle(.dotwear)
TextField("Email", text: $email).textFieldStyle(.dotwear)
VStack { … }.dotwearCard()
```

The styles sit on top of the standard controls, so VoiceOver, Dynamic Type and keyboard navigation work as usual. `scale` is an `Int`: every cell is a whole number of points, which is a whole number of pixels on @2x and @3x screens.

The `Dotwear` product bundles the DotGothic16 pixel font and registers it the first time it is used — no Info.plist entry needed. `.dotwearTheme()` makes it the default font for your app; add `.font(...)` to any view to use something else. DotGothic16 is drawn on a 16 pt grid, so it is sharpest at 16, 32 or 48 pt.

Docs: https://dotwear.dev · License: MIT (code and icons). DotGothic16 is licensed under the SIL Open Font License 1.1 (`Sources/Dotwear/Generated/Fonts/DotGothic16-OFL.txt`).
