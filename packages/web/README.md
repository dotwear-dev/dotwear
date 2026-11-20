# @dotwear/web

Dotwear for the web: React components, design tokens (CSS variables and TypeScript constants) and a bundled pixel font for pixel-style UIs. Re-exports everything from [`@dotwear/icons`](https://www.npmjs.com/package/@dotwear/icons).

```sh
npm install @dotwear/web
```

```ts
import "@dotwear/web/tokens.css"; // --dw-color-primary, --dw-shape-pixel-unit, …
import "@dotwear/web/fonts.css"; // the DotGothic16 pixel font
import "@dotwear/web/components.css"; // the look of the components
import { tokens, tokenVars, DotwearIcon, dwSave } from "@dotwear/web";
```

### Components

```tsx
import { DotwearButton, DotwearCard, DotwearTextField, DotwearToggle, dwSave } from "@dotwear/web";

<DotwearButton variant="primary" icon={dwSave} onClick={save}>Save</DotwearButton>
<DotwearTextField label="Email" value={email} onChange={setEmail} error={emailError} />
<DotwearToggle checked={wifi} onChange={setWifi}>Wi-Fi</DotwearToggle>
<DotwearCard>…</DotwearCard>
```

Each component is a standard element (`<button>`, `<input>`, `<label>`, `<div>`) with Dotwear class names, so keyboard, focus, screen readers and forms work as usual. `onChange` receives the new value first (`onChange={setEmail}`) and the event second. Without React, use the same class names on standard elements (see `components.css`).

### Font

The default font is [DotGothic16](https://github.com/fontworks-fonts/DotGothic16), a pixel font included in this package (SIL Open Font License 1.1; the license text ships next to it in `generated/fonts/`). Import `fonts.css` once and use the font through the token:

```ts
import "@dotwear/web/fonts.css";
```

```css
body {
  font-family: var(--dw-typography-family);
  font-size: 16px; /* the font is drawn on a 16px grid: use multiples of 16px to keep it crisp */
}
```

Lengths are defined in dots. Multiply by `--dw-shape-pixel-unit` (an integer number of px) to keep everything on the pixel grid.

Docs: https://dotwear.dev · License: MIT
