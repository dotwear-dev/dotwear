# @dotwear/react-native

Dotwear UI for React Native: components, design tokens, a theme, and the bundled pixel font DotGothic16. It re-exports [`@dotwear/react-native-icons`](https://www.npmjs.com/package/@dotwear/react-native-icons), so `DotwearIcon` and every icon come with it.

```sh
npm install @dotwear/react-native
```

## Components

```tsx
import { DotwearButton, DotwearCard, DotwearTextField, DotwearToggle, dwSave } from "@dotwear/react-native";

<DotwearButton variant="primary" icon={dwSave} onPress={save}>Save</DotwearButton>
<DotwearTextField label="Email" value={email} onChangeText={setEmail} error={emailError} />
<DotwearToggle value={wifi} onValueChange={setWifi}>Wi-Fi</DotwearToggle>
<DotwearToggle variant="checkbox" value={agree} onValueChange={setAgree}>I agree</DotwearToggle>
<DotwearCard>…</DotwearCard>
```

- They are styles on top of the standard `Pressable` and `TextInput`, so VoiceOver, TalkBack and keyboard focus work as usual. Toggles use `accessibilityRole="switch"` / `"checkbox"` with `accessibilityState.checked`.
- Touch targets are at least 44pt on iOS and 48dp on Android, even when the visual control is smaller.
- `DotwearButton`: `variant` (`primary` · `secondary` · `danger` · `ghost`), `size` (`small` · `medium` · `large`), `icon`, `loading`, `disabled`. Give icon-only buttons an `accessibilityLabel`.
- `DotwearTextField`: `label` is shown above the field and used as its accessibility label; `error` is shown below and read as the field's hint.
- Components whose size depends on their content draw their pixel frame after the first layout pass.

## Theme

```tsx
import { DotwearTheme, useDotwear } from "@dotwear/react-native";

<DotwearTheme theme={{ colors: { primary: "#306230" } }}>
  <App />
</DotwearTheme>

function Box() {
  const { colors, dots } = useDotwear();
  return <View style={{ borderWidth: dots(1), borderColor: colors.border, padding: dots(4) }} />;
}
```

- Lengths are in **dots**. `dots(n)` converts them to dp so that one dot is always a whole number of physical pixels (`pixelUnit × screen density`, rounded down). Edges stay crisp on fractional densities such as 2.625×.
- `DotwearTheme` also sets the default icon color to the theme's foreground color.
- `tokens` holds the raw values (`tokens.color.primary`, `tokens.shape.pixelUnit`, …).

## Font

DotGothic16 (SIL Open Font License 1.1) is bundled. Use it with `fontFamily: "DotGothic16"` (`dotwearFontFamily`) on both iOS and Android.

**Expo**

```tsx
import { useFonts } from "expo-font";
import { dotwearFonts } from "@dotwear/react-native";

const [loaded] = useFonts(dotwearFonts);
```

**React Native CLI** — add the font folder to `react-native.config.js` and run `npx react-native-asset`:

```js
module.exports = { assets: ["./node_modules/@dotwear/react-native/dist/generated/fonts"] };
```

The font is drawn on a 16px grid, so it is sharpest at sizes where `16 × screen density` is a multiple of 16.

Docs: https://dotwear.dev · License: MIT (font: OFL 1.1)
