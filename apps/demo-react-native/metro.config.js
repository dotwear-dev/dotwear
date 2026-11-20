// モノレポ（pnpm workspaces）で Metro を動かす設定。Expo の既定の設定がワークスペースのパッケージを解決する
const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
