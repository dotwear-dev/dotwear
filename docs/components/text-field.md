# TextField

## 1. 概要
1 行の文字入力。枠は階段状の角、内側は背景色。入力中は枠の外側にフォーカスリングを出す。
文字の入力・選択・変換（日本語の IME）・カーソル操作は各プラットフォームの標準のまま使い、見た目だけを変える。

## 2. バリアント
| 名前 | 用途 |
|---|---|
| `default` | 通常の入力欄 |
| `error` | 入力内容に誤りがあるとき。枠を `color.danger` にし、下に説明文を出す |

## 3. 状態
| 状態 | 見た目 |
|---|---|
| default | `color.border` の枠、背景は `color.bg` |
| focused | 枠の外側に 1 ドットのフォーカスリング（`color.focus`）。枠の太さは変えない（文字の位置がずれないように） |
| error | 枠を `color.danger`。下に説明文（`color.danger`） |
| disabled | 枠と文字を `color.disabled`。背景は変えない |
| placeholder | 文字を `color.disabled` |

## 4. 寸法（ドット数。実寸は × `shape.pixel-unit`）
| 項目 | 値 |
|---|---|
| 高さ（最小） | 16 |
| 左右の余白 | 4（内の線から） |
| 枠線 | `shape.border-width`（1） |
| 二重線のすき間・内の線 | `shape.border-gap`（1）・`shape.border-inner-width`（1）。文字は上下にも枠の幅だけ空ける |
| 角の段数 | `shape.corner-step`（1） |
| フォーカスリングとの間隔 | 0（枠のすぐ外側） |
| 説明文との間隔 | 2 |

文字の大きさを大きくしたとき（Dynamic Type など）は、高さを文字に合わせて伸ばす。伸ばした高さもドットの整数倍に切り上げる。

## 5. 使用トークン
`color.bg`、`color.fg`、`color.border`、`color.focus`、`color.danger`、`color.disabled`、`shape.pixel-unit`、`shape.border-width`、`shape.border-gap`、`shape.border-inner-width`、`shape.corner-step`、`typography.family`、`typography.body`

## 6. アクセシビリティ
- 各プラットフォームの標準の入力欄（`<input>`、SwiftUI の `TextField`、Compose の `TextField` / `BasicTextField`）を使い、見た目だけを変える
- ラベルは必ず付ける（見た目に出さない場合もアクセシビリティラベルとして付ける）
- エラーの説明文は入力欄と関連づけて読み上げる（Web は `aria-describedby`、iOS は `accessibilityHint`、Android は `semantics { error(...) }`）
- タップ領域は最低 44pt / 48dp（Web は見た目の大きさのまま。ADR-028）

## 7. プラットフォームごとの API
```tsx
// Web
<DotwearTextField label="メール" value={email} onChange={setEmail} error={emailError} />
```
```swift
// iOS
TextField("メール", text: $email)
  .textFieldStyle(.dotwear)
  .dotwearFieldError(emailError)   // エラーのときだけ枠を赤くし、説明文を出す
```
```kotlin
// Android
DotwearTextField(value = email, onValueChange = { email = it }, label = { Text("メール") }, error = emailError)
```
