# 02. アーキテクチャ

## 全体像

```
元データ（SSOT）
  icons/<name>/icon.json   … ピクセルのマス目（文字列グリッド）
  tokens/*.json            … 色・パレット・余白・枠線・フォント（DTCG 形式）
  docs/components/*.md     … コンポーネント仕様（人と AI が読む）
        │
        ▼  tools/generator（TypeScript）
  ┌──────────────┬──────────────┬──────────────┬──────────────┐
  Web            iOS            Android        Unity（後回し）
  SVG / React    SwiftUI        Compose        PNG スプライト
  CSS 変数       Shape / Style  矩形の定義     USS
```

元データはすべてテキストなので、Git で差分を確認でき、AI も直接読み書きできる。

## 1. アイコン元データ

1 アイコン 1 フォルダ。`icons/<name>/icon.json`。スキーマは `schema/icon.schema.json`。

```json
{
  "name": "save",
  "category": "file",
  "tier": "free",
  "tags": ["floppy", "disk", "保存"],
  "sizes": {
    "16": [
      "................",
      ".############...",
      "... 16 行 ..."
    ]
  }
}
```

### マス目の文字

| 文字 | 意味 |
|---|---|
| `.` | 透明 |
| `#` | メインの色（Web は `currentColor`、ネイティブは指定色）。単色アイコンはこれだけを使う |
| `2`〜`9` | パレットのスロット。トークンのパレットで実際の色を決める（多色アイコン用） |

- `sizes` のキーはグリッドサイズ。MVP は `"16"` 必須。`"12"`・`"24"` は任意で、あればサイズごとに描き分けたものとして扱う。
- 行数・各行の文字数はグリッドサイズと一致すること。

## 2. パス生成（ピクセルパーフェクトの要）

1. 色（`#`、`2`〜`9`）ごとにマス目を取り出す。
2. **横方向の連続したマスを 1 本にまとめ、さらに同じ幅で縦に続く行を矩形に統合する**（貪欲法で十分）。
3. 矩形を `M x y h w v h h -w z` の形で出力する。**座標は必ず整数、使う命令は水平・垂直だけ。**
4. 色ごとに 1 つのパスにまとめる。

SVG には `shape-rendering="crispEdges"` を付け、`viewBox="0 0 16 16"` とする。

### 表示サイズのルール

- 表示サイズはグリッドサイズの整数倍のみ（16px グリッドなら 16 / 32 / 48 / 64）。各 SDK の API はスケールを整数で受け取る（例：`scale: 2`）。
- ネイティブでは、端末の倍率（@2x / @3x、dp）と掛けても整数ピクセルになるように、論理サイズ × 端末倍率で計算する。
- Unity とビットマップのフォールバックは、最近傍補間（Nearest Neighbor）で書き出す。

## 3. プラットフォームごとの出力

どのプラットフォームも「アイコンだけ」と「UI 一式」の 2 つに分けて配る（ADR-009）。UI 一式はアイコンのパッケージに依存し、逆方向の依存は作らない。パレットはアイコン側に含める。

### Web（npm）

**`@dotwear/icons`（`packages/icons`）… アイコンだけ**
- `svg/<name>.svg`（16 のグリッド）。12・24 の描き分けは `svg/<name>-12.svg`・`svg/<name>-24.svg`（`@dotwear/icons/svg/save.svg` で参照できる）
- React：Font Awesome と同じく、アイコンの定義オブジェクトを `icon` に渡す。`<DotwearIcon icon={dwSave} scale={2} />`
  - 定義は 1 アイコン 1 export（`dwSave` など）なので tree-shaking できる。名前で動的に選ぶときは `byName.save`
- 色は `currentColor` ＋ CSS 変数 `--dw-palette-2` 〜 `--dw-palette-9`。CSS 変数がないとき（`<img>` で読み込んだときなど）は default テーマの色を使う
- パレットの CSS は `@dotwear/icons/palette.css`。default テーマは `:root` に入り、ほかのテーマは `data-dw-palette="retro-green"` を付けた要素の中で切り替わる
- 表示倍率 `scale` は 1 以上の整数だけ。整数以外は警告して切り捨てる

**`@dotwear/web`（`packages/web`）… UI 一式**
- UI コンポーネント：`DotwearButton`・`DotwearTextField`・`DotwearToggle`・`DotwearCard`（`src/react/`）。標準の要素にクラス名を付けるだけで、見た目は `@dotwear/web/components.css`（`src/components.css`。外装は `::before` の box-shadow で描く。ADR-028）
- トークンは CSS 変数（`@dotwear/web/tokens.css`、`--dw-color-bg` など）と TypeScript の定数（`tokens.color.bg` は値、`tokenVars.color.bg` は `var(--dw-color-bg)`）
- 文字は同梱の DotGothic16（`@dotwear/web/fonts.css` と `generated/fonts/`。`pnpm generate tokens` が `fonts/` からコピーする。ADR-026）
- `@dotwear/icons` の定義と `DotwearIcon` を再 export する（UI 一式を入れればアイコンも使える）

### iOS（`packages/swift`、Swift Package: `Dotwear`）

1 つの Swift Package に 2 つのプロダクトを入れる。利用者は必要なほうだけを追加できる。

**プロダクト `DotwearIcons` … アイコンだけ**
- アイコンの定義（`DotwearIconDefinition` の static プロパティ `.save` など。矩形のリストを持つ）＋ それを描く SwiftUI の `Shape`。モジュール名 `DotwearIcons` と同じ名前の型は作らない（Swift では修飾名が衝突するため）
- ビューは `DotwearIcon(.save, scale: 2)`、色は `.foregroundStyle` と `DotwearPalette` 環境値
- 定義は色ごとの**矩形の配列**（`DotwearIconRect`。マス単位の整数）で持つ。Web と同じ `gridToRects` から生成するので、形はどのプラットフォームでも同じ。名前から選ぶときは `DotwearIconDefinition.named("save")`、一覧は `.allIcons`
- 描画は `Canvas` で、倍率は `Int` だけ。塗りのアンチエイリアスは切る（Web の `crispEdges` に相当）
- 調べた結果、SwiftUI は padding・offset・position のどれでもビューの原点をデバイスピクセルに揃えてから描く。小数の位置に置かれてもにじまない（テスト `testFractionalPlacementStaysCrisp` で回帰を見張る）
- テスト：`PixelRoundtripTests`（全アイコン × 画面の倍率 1〜3 × 表示倍率 1・2 で元データと 1 ピクセル単位で一致）、`SnapshotTests`（iOS シミュレーターだけ。見た目の変化に気づくための補助）

**プロダクト `Dotwear` … UI 一式（`DotwearIcons` に依存）**
- UI は `DotwearButtonStyle`・`DotwearTextFieldStyle`・`DotwearToggleStyle`・`DotwearCardModifier` と、角を階段状にした `SteppedRectangle: Shape`
- `.dotwearTheme(.default)` を付けるとアプリ全体に適用される
- トークンは Style Dictionary から `DotwearTokens.swift` を生成（`DotwearTokens.Color.primary` は sRGB の `Color`、ドット数は `Int`、長さは `CGFloat` の pt）
- `import Dotwear` だけでアイコンも使えるように、`DotwearIcons` を `@_exported import` で再公開する
- `DotwearTheme`（色・`pixelUnit: Int`・枠線の太さ・角の段数・二重線のすき間と内の線）を環境値で配る。寸法はドット数で持ち、`theme.dots(n)` で pt にする。`pixelUnit` を `Int` にして、どの寸法も整数 pt（＝@2x・@3x で整数ピクセル）になるようにする
- 文字は同梱の DotGothic16（`Sources/Dotwear/Generated/Fonts`。`pnpm generate swift` が `fonts/` からコピーし、`DotwearFont` が初回に登録する。ADR-026）。`.dotwearTheme()` がアプリ全体の既定の文字を `DotwearFont.body` にする
- `SteppedRectangle`（角を階段にした `InsettableShape`）と `SteppedBorder`（枠線）。二重線の枠は、`PixelChrome` が内側にもう 1 本 `SteppedBorder` を描く。枠線は `stroke` を使わず、外形と内側の形の差を偶奇規則で塗る（`stroke` は線の中心が辺に乗り、半ピクセルずれてにじむことがあるため）。塗りは `fillCrisp`（アンチエイリアスなし）
- コンポーネントは標準の部品にスタイルを被せる：`.buttonStyle(.dotwear(.primary, size: .medium))`、`.toggleStyle(.dotwear)` / `.dotwear(.checkbox)`、`.textFieldStyle(.dotwear)`（エラーは `.dotwearFieldError(_:)`）、`.dotwearCard()`、読み込み中は `.dotwearLoading()`
  - 共通の外装（背景・枠線・影・フォーカスリング）は `PixelChrome`、大きさをドットの整数倍に揃えるのは `DotSnap`（`Layout`）。文字の大きさ（Dynamic Type）で中身が半端な大きさになっても、外装の辺はドットの格子に乗る
  - タップ領域は最低 44pt。トグルの読み上げは `accessibilityRepresentation` で標準の `Toggle` と同じにする
  - フォーカスリングはキーボード操作のフォーカス（`isFocused`）を使うので iOS 17 以降。iOS 16 では出ない
  - テスト：`ComponentPixelTests`（文字を含まない部分をドット単位の絵と比べる）、`ComponentSnapshotTests`（iOS シミュレーターだけ。文字を含むので許容幅あり）

**デモアプリ（`apps/demo-ios`）**
- ログイン → 受注一覧 → 詳細、設定 の業務アプリ風の 4 画面。すべて標準の部品に Dotwear のスタイルを被せて作る見本
- Xcode プロジェクトは XcodeGen の `project.yml` から作る（`.xcodeproj` は git に入れない。ADR-017）。`pnpm dev:ios` で開く
- UI テストで、全画面を Xcode のアクセシビリティ監査（`performAccessibilityAudit`）にかける。標準の文字の大きさと最大の Dynamic Type の両方。除外は 2 つだけで、どちらも iOS 標準の部品でも同じ指摘が出るもの：入力欄の「文字が切れる」、無効な部品のコントラスト（WCAG 1.4.3 の対象外）

### Android（`packages/android`、Gradle のモジュールを 2 つ）

**`dev.dotwear:dotwear-icons`（`:icons` モジュール）… アイコンだけ**
- `DotwearIcons.Save: DotwearIconDefinition`（iOS と同じ矩形の定義）、`DotwearIcon(DotwearIcons.Save, scale = 2)`。1 マスは整数ピクセル（端数の倍率では切り捨て。ADR-019）。`Icon()` 用に `.imageVector` も出す
- Compose UI だけに依存し、Material 3 には依存しない

**`dev.dotwear:dotwear-compose`（`:compose` モジュール）… UI 一式（`dotwear-icons` に依存）**
- `DotwearTheme { }` で `MaterialTheme` のカラー・形状・文字設定を差し替える
- 文字は同梱の DotGothic16（`DotwearFont.family`。`pnpm generate android` が `fonts/` から `compose/src/generated/res/font/` にコピーし、ライセンス文は `assets/licenses/` に置く。ADR-026）。100〜900 のすべての太さに同じ書体を割り当てて、太字を合成させない
- 二重線の枠（ADR-027）：`DotwearThemeValues` の `borderGap`・`borderInnerWidth`（0 なら一重）。内の線は外の線とすき間の分だけ内側に、角の段もその分減らして描く（iOS の `PixelChrome` と同じ）。ボタン・入力欄・カードは二重線、トグルは一重
- `Modifier.dotwearBorder()`、`SteppedCornerShape`
- トークンは `DotwearTokens.kt` を生成（`DotwearTokens.Color.Primary` など。KDoc に `/*` を書かない：Kotlin のコメントは入れ子になるため）
- 1 ドットは「pixelUnit（dp）× 画面の倍率」を切り捨てた整数ピクセル（`Dotwear.dotPx`。ADR-019）。寸法は `Dotwear.dots(n)` で求める
- `MaterialTheme` は色と文字（書体だけ。大きさは Material のまま）を差し替える。形（`Shapes`）は角を丸める形しか受け付けないので、階段状の角は各部品が `SteppedCornerShape` を使う
- コンポーネント：`DotwearButton`、`DotwearSwitch` / `DotwearCheckbox`（`label` を渡すと行全体が 1 つのトグル）、`DotwearTextField`、`DotwearCard`、`Modifier.dotwearBorder()`
  - 中身は標準の `clickable`（`Role.Button`）・`toggleable`（`Role.Switch` / `Role.Checkbox`）・`BasicTextField`。タップ領域は `minimumInteractiveComponentSize` で 48dp 以上
  - Material の `Surface` は使わない（中身を形で切り抜くので、外にはみ出す影とフォーカスリングが欠けるため）。押したときは波紋ではなく 1 ドット沈む
- テスト（Robolectric。実際の Skia で描く NATIVE モード）：`PixelRoundtripTest`（mdpi〜xxxhdpi と 420dpi で全アイコン）、`ShapePixelTest`（角の形・枠線・トグルの本体・カードの二重線の枠を hdpi・420dpi を含む倍率で）、`FontTest`（同梱のフォントとライセンス文）、`ComponentSnapshotTest`（Roborazzi）

**デモアプリ（`apps/demo-android`）**
- iOS と同じ 4 画面。Gradle は `packages/android` のビルドに `:demo` として入れる
- アクセシビリティの検査は 2 段：
  - JVM（Robolectric）：`auditSemantics` で、押せる部品・切り替えられる部品に読み上げる名前があり、タップ領域が 48dp 以上かを全画面で確かめる。標準の文字の大きさと 2 倍の両方。Robolectric の上では Google の ATF が動かない（検査が素通りになる）ため、自前で書いている
  - エミュレーター：`androidTest` で本物の ATF（`enableAccessibilityChecks`）を有効にして全画面を巡る。CI でもエミュレーターで動かす

### Unity（`packages/unity`、Phase 5）

- アイコンだけと UI 一式に分ける方針は同じ（パッケージ構成は Phase 5 で決める）

- PNG スプライトシート（Point filter、圧縮なし）、9-slice 用の UI 枠
- UI Toolkit の USS

## 4. デザイントークン

W3C Design Tokens（DTCG）形式。`tokens/` 配下。

| ファイル | 内容 |
|---|---|
| `color.json` | 基本色とセマンティックカラー（`bg`・`fg`・`primary`・`danger` など） |
| `palette.json` | テーマごとのパレット（スロット 2〜9）。例：`default`（白黒 4 階調。ADR-027）・`retro-green` |
| `shape.json` | `pixel-unit`（1 ドットの論理サイズ）、`border-width`（ドット数）、`border-gap`・`border-inner-width`（二重線の枠のすき間と内の線。一重なら 0）、`corner-step`（階段の段数） |
| `typography.json` | フォント（DotGothic16。ADR-026）とサイズ。16px の整数倍で使う |

**長さはすべて「ドット数」で定義し、`pixel-unit` を掛けて実寸にする。**こうすると全体の拡大縮小が整数倍で揃う。

## 5. コンポーネント仕様

`docs/components/<name>.md` に 1 コンポーネント 1 ファイル。共通の見出しは次のとおり（`button.md` を参照）。

1. 概要 / 2. バリアント / 3. 状態 / 4. 寸法（ドット数）/ 5. 使用トークン / 6. アクセシビリティ / 7. プラットフォームごとの API

MVP の対象は Button、TextField、Card、Toggle（Checkbox）。

## 6. ツール

- `tools/generator`：`validate` → `build-paths` → `emit-web` / `emit-swift` / `emit-android`。各 emitter は独立させる。
- `tools/editor`：ブラウザでマス目を塗って `icon.json` を読み書きできるエディタ（`pnpm dev:editor`）。
  - 3 層に分け、保存の層だけを差し替えられるようにする。
    - `src/model/`：編集の操作（塗る・線・塗りつぶし・履歴）と、`icon.json` の書き出し。画面にも保存先にも依存しない
    - `src/App.tsx`：画面。保存先は `IconStore` として外から受け取る
    - `src/storage/`：保存先。今は `devServerStore`（開発サーバーの API `server/iconApi.ts` 経由で手元のファイルを読み書き）
  - 開発サーバーの API は認証がないので、`vite build` の出力には含めない（開発サーバーだけに付く）。
  - 保存のたびに `validate` を通し、通らなければ元に戻してエラーを位置付きで表示する。`icon.json` はリポジトリと同じ書き方で書き出す（保存しても無関係な差分が出ない）。
  - プレビューは、ジェネレーターと同じ矩形統合で作った定義を `DotwearIcon` で描く。配布物と同じ見た目になる。
  - 今はできないこと：名前の変更（フォルダの移動になるため）、色のないパレットのスロットで塗ること。

## 7. 配布

**公開の流れ**
1. `pnpm release:version 0.1.0`：リポジトリ直下の `version` を、npm の各パッケージと `packages/android/gradle.properties` に書き写す（全配布物で同じ番号。ADR-020）
2. コミットしてタグ `v0.1.0` を push すると、`.github/workflows/release.yml` が公開する
   - npm：`@dotwear/icons`・`@dotwear/web`（provenance 付き。ライセンス文は prepack でリポジトリ直下からコピー）
   - Maven Central：`dev.dotwear:dotwear-icons`・`dotwear-compose`（`com.vanniktech.maven.publish`。署名は鍵があるときだけ）。リポジトリの変数 `PUBLISH_MAVEN` が `true` のときだけ公開する
   - Swift：`pnpm release:export-swift` で書き出し、単体で `swift build` できることを確かめてから `dotwear-dev/dotwear-swift` に push してタグを付ける。配布用の `Package.swift` はテスト用の依存を含まない（SPM はテストだけの依存も利用者の側で取得するため）
3. 手動実行（workflow_dispatch）は既定で dry-run。何も公開せずに、公開できる状態かだけを確かめる
- ドキュメントサイトのビルドは `pnpm --filter @dotwear/docs-site run build`、出力は `apps/docs-site/dist`（静的な HTML）
  - Cloudflare Pages に出す（`.github/workflows/site.yml`）。開発用の検査ページ（`/dev/`）は出す直前に消す
  - favicon・apple-touch-icon・OGP 画像は、ロゴの元データからジェネレーターで作る（`generate brand` → `generated/brand/site/`）。サイトは `src/pages/[file].ts` で直下に配る
- ドキュメントサイトは英語で、Web と iOS のコード例をタブで切り替える（ADR-025）。コード例はコンパイルされるソースから取り出す
  - Web：`apps/docs-site/src/snippets/*.tsx`（`astro check` で型を検査）
  - Swift：`packages/swift/Tests/DocSnippetsTests/Snippets.swift`（`swift test` でコンパイル）
  - 目印は `// snippet:<名前>` 〜 `// end-snippet`（JSX の中では `{/* … */}`）。取り出しは `apps/docs-site/src/lib/snippets.ts`。名前が見つからなければビルドが失敗する
