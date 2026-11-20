# @dotwear/icons

Pixel-perfect pixel-art icons for the web. Every icon is drawn on a 16×16 grid (some also on 12 and 24) and rendered with integer scaling only, so cell edges never blur.

```sh
npm install @dotwear/icons
```

## React

```tsx
import { dwSave } from "@dotwear/icons";
import { DotwearIcon } from "@dotwear/icons/react";

<DotwearIcon icon={dwSave} scale={2} title="Save" />
```

- `scale` must be an integer (1 → 16px, 2 → 32px, …).
- Without `title` the icon is decorative (`aria-hidden`).
- `#` cells use `currentColor`; multi-color cells use `--dw-palette-2` … `--dw-palette-9` (import `@dotwear/icons/palette.css` for the default theme). The same palettes are available as values in `palettes` (for example `palettes["retro-green"]`), for places without CSS variables such as canvas.
- Pick an icon dynamically with `byName.save` (this bundles every icon).

## SVG

```html
<img src="node_modules/@dotwear/icons/generated/svg/save.svg" width="32" height="32" alt="Save">
```

Docs: https://dotwear.dev · License: MIT
