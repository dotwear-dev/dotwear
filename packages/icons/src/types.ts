// アイコンの定義オブジェクトの型（ADR-013）。
// Font Awesome の IconDefinition と同じく、コンポーネントに渡すデータそのもの。
// 別のパッケージのアイコンも同じ形で渡せるように、この型は公開 API として安定させる。

/** マス目の色。`#` はメインの色（currentColor）、`2`〜`9` はパレットのスロット */
export type DotwearIconColor = "#" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

/** グリッドサイズ。16 は必ずあり、12・24 は描き分けがあるアイコンだけが持つ */
export type DotwearIconGrid = 12 | 16 | 24;

/** 1 色分のパス。d は整数座標の M / h / v / z だけでできている */
export interface DotwearIconLayer {
  readonly color: DotwearIconColor;
  readonly d: string;
}

export interface DotwearIconDefinition<Name extends string = string> {
  /** プレフィックス（Font Awesome の prefix に当たる。byPrefixAndName のキー。ADR-023） */
  readonly prefix: string;
  readonly name: Name;
  readonly grids: {
    readonly 16: readonly DotwearIconLayer[];
    readonly 12?: readonly DotwearIconLayer[];
    readonly 24?: readonly DotwearIconLayer[];
  };
}
