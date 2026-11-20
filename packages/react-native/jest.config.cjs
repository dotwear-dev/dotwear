// React Native の部品を Node で描いて確かめる（@testing-library/react-native）
module.exports = {
  preset: "@react-native/jest-preset",
  // ソースは ESM の書き方で "./x.js" と import するので、.ts を探すように拡張子を外す
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    // フォントの require は Metro ではアセットの番号になる。テストでは中身を読まずに番号の代わりを返す
    "\\.(ttf|otf)$": "<rootDir>/test/asset-stub.cjs",
  },
  // pnpm は node_modules/.pnpm の下に置くので、React Native 系を変換の対象に含める
  transformIgnorePatterns: ["node_modules/(?!(\\.pnpm/[^/]+/node_modules/)?(@react-native|react-native)/)"],
};
