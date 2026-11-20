import type { ValidationIssue } from "./types.js";

// 問題を「ファイル:行:列 メッセージ」の形式で整形する
export function formatIssue(issue: ValidationIssue): string {
  let loc = issue.file;
  if (issue.line !== undefined) {
    loc += `:${issue.line}`;
    if (issue.column !== undefined) loc += `:${issue.column}`;
  }
  return `${loc}  ${issue.message}`;
}

// ファイル名 → 行 → 列の順に並べる
export function sortIssues(issues: ValidationIssue[]): ValidationIssue[] {
  return [...issues].sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      (a.line ?? 0) - (b.line ?? 0) ||
      (a.column ?? 0) - (b.column ?? 0),
  );
}
