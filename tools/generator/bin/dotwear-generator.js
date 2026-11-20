#!/usr/bin/env node
// ジェネレーターは TypeScript のまま実行する（ビルド工程を増やさないため）。
// ほかのパッケージの build スクリプトから `dotwear-generator generate` と呼べるようにする入口
import { register } from "tsx/esm/api";

register();
await import("../src/cli.ts");
