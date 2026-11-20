# @dotwear/react-native-icons

Pixel-perfect pixel-art icons for React Native. Every icon is drawn on a 16×16 grid (some also on 12 and 24) with plain `View`s — no `react-native-svg` needed.

```sh
npm install @dotwear/react-native-icons
```

```tsx
import { DotwearIcon, dwSave } from "@dotwear/react-native-icons";

<DotwearIcon icon={dwSave} scale={2} title="Save" />
```

- `scale` must be an integer. One cell is `scale × screen density` **rounded down to whole physical pixels**, so cell edges stay crisp on fractional densities such as 1.5× or 2.625×. On those screens the icon is slightly smaller in dp; on integer densities it is exactly `16 × scale` dp.
- Without `title` the icon is decorative (hidden from VoiceOver and TalkBack). With `title` it is read as an image.
- `#` cells use `color`, or the color from `DotwearIconProvider` (black by default). Multi-color cells use the provider's `palette` (slots `"2"`–`"9"`).

```tsx
import { DotwearIconProvider, palettes } from "@dotwear/react-native-icons";

<DotwearIconProvider color="#1a1a1a" palette={palettes["retro-green"]}>
  {/* icons here */}
</DotwearIconProvider>
```

- `palettes` holds every built-in palette by name (`"default"`, `"retro-green"`). You can also pass your own object, such as `{ "2": "#306230" }`.

- Icon definitions (`dwSave`, `byName`, …) are the same objects as in [`@dotwear/icons`](https://www.npmjs.com/package/@dotwear/icons) and are re-exported here.

Docs: https://dotwear.dev · License: MIT
