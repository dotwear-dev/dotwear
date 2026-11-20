// 検証で見つかった問題 1 件分
export interface ValidationIssue {
  /** リポジトリルートからの相対パス */
  file: string;
  /** 1 始まりの行番号（特定できない場合は undefined） */
  line?: number;
  /** 1 始まりの列番号（特定できない場合は undefined） */
  column?: number;
  message: string;
}
