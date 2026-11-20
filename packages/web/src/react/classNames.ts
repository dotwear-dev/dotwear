/** クラス名をつなぐ（偽の値は除く）。小さな処理なので依存を増やさずに書く */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}
