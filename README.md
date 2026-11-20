# Dotwear

**Pixel-art icons and UI for business apps — generated for Web, iOS and Android from one source of truth.**

Dotwear makes ordinary apps (forms, lists, settings) look pixel-styled without giving up accessibility. Icons are drawn on a grid once and generated for every platform with integer scaling only, so edges never blur.

| Platform | Package |
|---|---|
| Web | [`@dotwear/icons`](packages/icons) · [`@dotwear/web`](packages/web) |
| iOS (SwiftUI) | [`dotwear-swift`](https://github.com/dotwear-dev/dotwear-swift) — products `DotwearIcons`, `Dotwear` (add this URL in Swift Package Manager; the source lives in [`packages/swift`](packages/swift)) |
| Android (Compose) | [`dev.dotwear:dotwear-icons` · `dev.dotwear:dotwear-compose`](packages/android) (not on Maven Central yet) |

- The UI is a *style on top of* the standard controls (`ButtonStyle`, `toggleable`, `<button>`), so VoiceOver, TalkBack, Dynamic Type and keyboard navigation keep working.
- Every icon is checked pixel by pixel on every platform (`pixel-roundtrip`), including fractional Android densities.

## Repository

```
icons/<name>/icon.json   Icon sources (grid strings) — the single source of truth
tokens/*.json            Design tokens (W3C DTCG)
tools/generator          Source → SVG / React / Swift / Kotlin
tools/editor             Browser pixel editor (pnpm dev:editor)
packages/*               Published packages
apps/*                   Docs site and demo apps
```

```sh
pnpm install
pnpm validate && pnpm test
```

Docs: https://dotwear.dev · License: [MIT](LICENSE)
