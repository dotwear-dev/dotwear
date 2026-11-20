# Button

## 1. 概要
押すと処理を実行するボタン。角は階段状、押下時は 1 ドット下にずれる、ピクセル調の見た目にする。

## 2. バリアント
| 名前 | 用途 |
|---|---|
| `primary` | 画面で一番重要な操作 |
| `secondary` | それ以外の操作 |
| `danger` | 削除など取り消せない操作 |
| `ghost` | 枠線のみ。ツールバーなど |

## 3. 状態
| 状態 | 見た目 |
|---|---|
| default | 下と右に 1 ドットの影 |
| hover（Web のみ） | 変えない（4 階調ではいちばん明るい地をそれ以上明るくできないため。ADR-028） |
| pressed | 影を消し、本体を下に 1 ドットずらす |
| focused | 外側に 1 ドットのフォーカスリング（`color.focus`） |
| disabled | `color.disabled` の配色、影なし |
| loading | ラベルの代わりに 3 ドットのアニメーション |

## 4. 寸法（ドット数。実寸は × `shape.pixel-unit`）
| 項目 | small | medium | large |
|---|---|---|---|
| 高さ | 12 | 16 | 20 |
| 左右の余白 | 4 | 6 | 8 |
| 枠線 | 1 | 1 | 2 |
| 二重線のすき間・内の線（ADR-027） | 1・1 | 1・1 | 1・1 |
| 角の段数 | 1 | 1 | 2 |
| アイコンとラベルの間隔 | 2 | 3 | 4 |

- 文字は上下に枠の幅（外の線＋すき間＋内の線）だけ空ける。文字が大きいときは、高さを最小値より伸ばす。
- `primary`・`danger` は塗りが枠と同じ濃い色なので、内の線は文字と同じ色（`color.on-primary`）にする。
- 文字は `typography.family`（DotGothic16）。太字にしない（合成した太字はにじむため。ADR-026）。

## 5. 使用トークン
`color.primary`、`color.on-primary`、`color.danger`、`color.border`、`color.focus`、`color.disabled`、`shape.pixel-unit`、`shape.border-width`、`shape.border-gap`、`shape.border-inner-width`、`shape.corner-step`、`typography.family`、`typography.label`

## 6. アクセシビリティ
- 各プラットフォームの標準ボタン（`<button>`、SwiftUI の `Button`、Compose の `Button`）を使い、見た目だけを変える
- タップ領域は最低 44pt / 48dp（見た目が小さくても領域は確保する）。Web は見た目の大きさのまま（24px 以上。ADR-028）
- ラベルとのコントラスト比は 4.5:1 以上
- アイコンだけのボタンには必ずアクセシビリティラベルを付ける

## 7. プラットフォームごとの API
```tsx
// Web
<DotwearButton variant="primary" size="medium" icon={dwSave}>保存</DotwearButton>
```
```swift
// iOS
Button("保存") { save() }
  .buttonStyle(.dotwear(.primary, size: .medium))
```
```kotlin
// Android
DotwearButton(onClick = ::save, variant = DotwearButtonVariant.Primary) { Text("保存") }
```
