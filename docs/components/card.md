# Card

## 1. 概要
関連する内容をまとめて囲む箱。階段状の角の枠と、下と右に 1 ドットの影。
押せるカード（一覧の項目など）は、カード自体ではなく中身を標準のボタン・リンクにする。

## 2. バリアント
| 名前 | 用途 |
|---|---|
| `outlined` | 枠と影（既定） |
| `flat` | 枠のみ、影なし。カードの中にカードを置くときなど |

## 3. 状態
カード自体は状態を持たない（押せる場合の見た目は中のボタンに従う）。

## 4. 寸法（ドット数。実寸は × `shape.pixel-unit`）
| 項目 | 値 |
|---|---|
| 内側の余白 | 6 |
| 枠線 | `shape.border-width`（1） |
| 二重線のすき間・内の線 | `shape.border-gap`（1）・`shape.border-inner-width`（1）。内側の余白の中に描くので、カードの大きさは変わらない |
| 角の段数 | `shape.corner-step`（1） |
| 影 | 下と右に 1（`outlined` のみ） |

## 5. 使用トークン
`color.bg`、`color.border`、`shape.pixel-unit`、`shape.border-width`、`shape.border-gap`、`shape.border-inner-width`、`shape.corner-step`

## 6. アクセシビリティ
- 見た目だけの入れ物で、読み上げの単位は変えない（中の要素をそれぞれ読み上げる）
- 見出しがある場合は、見出しとして読み上げられるようにする（Web は `<h2>` など、iOS は `.accessibilityAddTraits(.isHeader)`）

## 7. プラットフォームごとの API
```tsx
// Web
<DotwearCard>…</DotwearCard>
<DotwearCard variant="flat">…</DotwearCard>
```
```swift
// iOS
VStack { … }
  .dotwearCard()            // outlined
  .dotwearCard(.flat)
```
```kotlin
// Android
DotwearCard { … }
DotwearCard(variant = DotwearCardVariant.Flat) { … }
```
