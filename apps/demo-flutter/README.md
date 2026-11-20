# demo-flutter

Dotwear の Flutter のデモアプリ（ADR-033）。iOS・Android・React Native のデモと同じ画面構成（ログイン → 受注一覧 → 詳細、設定）。

```sh
pnpm dev:flutter                     # 生成物を作ってから flutter run（端末を選ぶ）
cd apps/demo-flutter && flutter test # 画面の流れのテスト
```

- 手元の `packages/flutter/dotwear`・`dotwear_icons` を path と dependency_overrides で使う
- 最初の画面は `--dart-define=DEMO_ROUTE=list`（`settings`・`detail:A-1025` も可）で選べる。スクリーンショットの確認用
