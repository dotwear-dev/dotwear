// 保存の仕組みのインターフェース（ADR-016）。
// 今は開発サーバー経由で手元の icons/・brand/ を読み書きする（devServerStore）。
// 保存先は、同じインターフェースの別の実装に差し替えられる。画面のコードは変えない
import type { Collection, IconDocument } from "../model/icon.ts";

/** 検証で見つかった問題（@dotwear/generator の validate と同じ形） */
export interface StoreIssue {
  file: string;
  line?: number;
  column?: number;
  message: string;
}

export type SaveResult = { ok: true } | { ok: false; issues: StoreIssue[] };

export interface IconStore {
  /** アイコンの名前の一覧（名前順） */
  list(collection: Collection): Promise<string[]>;
  load(collection: Collection, name: string): Promise<IconDocument>;
  /** 検証に通ったときだけ保存する。通らなければ保存せず、問題を返す */
  save(collection: Collection, icon: IconDocument): Promise<SaveResult>;
}
