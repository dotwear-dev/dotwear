# Toggle

## 1. 概要
オンとオフを切り替える。見た目は 2 種類（スイッチ・チェックボックス）から選ぶ。
どちらも中身は標準のトグル（オン・オフの状態を持つ操作部品）で、見た目だけを変える。

## 2. バリアント
| 名前 | 用途 |
|---|---|
| `switch` | 設定画面など、押した瞬間に反映されるもの（既定） |
| `checkbox` | フォームなど、まとめて送信するものや、複数を選ぶもの |

## 3. 状態
| 状態 | `switch` | `checkbox` |
|---|---|---|
| off | 背景 `color.bg`、つまみ（正方形・`color.border` の 1 ドットの線だけで中は `color.bg`）が左。下と右に 1 ドットの影 | 背景 `color.bg`。下と右に 1 ドットの影 |
| on | 背景 `color.primary`、つまみ（塗りつぶし・`color.on-primary`）が右 | 背景 `color.primary`、中に `color.on-primary` のチェック（下の形） |
| pressed | 影を消し、本体を下に 1 ドットずらす（Button と同じ） | 同左 |
| focused | 外側に 1 ドットのフォーカスリング（`color.focus`） | 同左 |
| disabled | `color.disabled` の配色 | 同左 |

チェックの形（枠の内側 6 × 6 ドット。`#` が塗り）：
```
......
.....#
....##
#..##.
####..
.##...
```

オフのつまみを線だけにするのは、4 階調では `color.primary` と `color.border`、`color.on-primary` と `color.bg` が同じ色になり、つまみを塗りつぶすとオンとオフが同じ絵になるため（ADR-029）。

つまみの移動はアニメーションさせず、一瞬で切り替える（ドット絵の動きに合わせる。途中の小数の位置でにじませないため）。

## 4. 寸法（ドット数。実寸は × `shape.pixel-unit`）
| 項目 | `switch` | `checkbox` |
|---|---|---|
| 幅 × 高さ（影を除く） | 14 × 8 | 8 × 8 |
| つまみ | 6 × 6（枠の内側いっぱい。オフの線の太さは 1） | — |
| 影 | 下と右に 1 | 同左 |
| 枠線 | `shape.border-width`（1） | 同左 |
| 角の段数 | `shape.corner-step`（1） | 同左 |
| ラベルとの間隔 | 4 | 4 |

## 5. 使用トークン
`color.primary`、`color.on-primary`、`color.border`、`color.focus`、`color.disabled`、`color.fg`、`shape.pixel-unit`、`shape.border-width`、`shape.corner-step`、`typography.label`

## 6. アクセシビリティ
- 各プラットフォームの標準のトグル（`<input type="checkbox">`（スイッチは `role="switch"`）、SwiftUI の `Toggle`、Compose の `Switch` / `Checkbox`）を使い、見た目だけを変える
- ラベルの文字を押しても切り替わる（タップ領域はラベルを含めて最低 44pt / 48dp。Web はラベルと本体を合わせた大きさのまま。ADR-028）
- 色だけでオン・オフを区別しない（つまみの位置と形・チェックの形でも区別できる）

## 7. プラットフォームごとの API
```tsx
// Web
<DotwearToggle checked={wifi} onChange={setWifi}>Wi-Fi</DotwearToggle>
<DotwearToggle variant="checkbox" checked={agree} onChange={setAgree}>同意する</DotwearToggle>
```
```swift
// iOS
Toggle("Wi-Fi", isOn: $wifi)
  .toggleStyle(.dotwear)               // スイッチ
Toggle("同意する", isOn: $agree)
  .toggleStyle(.dotwear(.checkbox))
```
```kotlin
// Android
DotwearSwitch(checked = wifi, onCheckedChange = { wifi = it })
DotwearCheckbox(checked = agree, onCheckedChange = { agree = it })
```
