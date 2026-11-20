// Dotwear の React Native デモ。「業務アプリをピクセル調にする」使い方の見本（iOS・Android のデモと同じ画面構成）。
// UI はすべて標準の部品（Pressable / TextInput / ScrollView）に Dotwear のスタイルを被せて作る
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DotwearTheme, dotwearFonts } from "@dotwear/react-native";
import { DemoApp, routeFromEnv } from "./src/DemoApp";

export default function App() {
  // 同梱の DotGothic16 を読み込む。読み込むまでは何も出さない（別の書体で一瞬描かれて、文字の幅がずれないように）
  const [loaded] = useFonts(dotwearFonts);
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      {/* アプリのルートに置けば、全体に Dotwear のテーマが効く */}
      <DotwearTheme>
        <StatusBar style="dark" />
        {/* Expo は EXPO_PUBLIC_ で始まる環境変数を、ビルドのときに値へ置き換える */}
        <DemoApp initialRoute={routeFromEnv(process.env.EXPO_PUBLIC_DEMO_ROUTE)} />
      </DotwearTheme>
    </SafeAreaProvider>
  );
}
