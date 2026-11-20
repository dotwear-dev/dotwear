// 画面の部品を Node で描いて、操作と読み上げを確かめる（App.tsx は expo-font を使うので対象にしない）
module.exports = {
  preset: "@react-native/jest-preset",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    // @dotwear/react-native のフォントの require。Metro ではアセットの番号になる
    "\\.(ttf|otf)$": "<rootDir>/test/asset-stub.cjs",
  },
  transformIgnorePatterns: ["node_modules/(?!(\\.pnpm/[^/]+/node_modules/)?(@react-native|react-native|react-native-safe-area-context)/)"],
};
