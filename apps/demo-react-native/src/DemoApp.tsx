// 画面の切り替え（ログイン → 受注一覧 → 詳細、設定）。依存を増やさないよう、ナビゲーションのライブラリは使わずに状態で切り替える。
// Android の戻るボタンでも 1 つ前の画面に戻る
import { useEffect, useState } from "react";
import { BackHandler } from "react-native";
import { sampleOrders, type Order } from "./orders";
import { LoginScreen } from "./screens/LoginScreen";
import { OrderDetailScreen } from "./screens/OrderDetailScreen";
import { OrderListScreen } from "./screens/OrderListScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

export type Route = { name: "login" } | { name: "list" } | { name: "detail"; id: string } | { name: "settings" };

/**
 * 最初の画面を、環境変数 EXPO_PUBLIC_DEMO_ROUTE（login・list・settings・detail:A-1025）で選ぶ。
 * スクリーンショットや見た目の確認でログインを飛ばしたいとき用（iOS のデモの -skipLogin と同じ役割）
 */
export function routeFromEnv(value: string | undefined): Route {
  if (value === "list" || value === "settings") return { name: value };
  if (value?.startsWith("detail:")) return { name: "detail", id: value.slice("detail:".length) };
  return { name: "login" };
}

export function DemoApp({ initialRoute = { name: "login" } }: { initialRoute?: Route }) {
  const [route, setRoute] = useState<Route>(initialRoute);
  const [orders, setOrders] = useState<Order[]>(sampleOrders);
  const back = () => setRoute({ name: "list" });

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (route.name === "detail" || route.name === "settings") {
        back();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [route]);

  switch (route.name) {
    case "login":
      return <LoginScreen onLogin={() => setRoute({ name: "list" })} />;
    case "list":
      return <OrderListScreen orders={orders} onOpen={(id) => setRoute({ name: "detail", id })} onSettings={() => setRoute({ name: "settings" })} />;
    case "detail": {
      const order = orders.find((o) => o.id === route.id);
      if (!order) return null;
      return (
        <OrderDetailScreen
          order={order}
          onChange={(next) => setOrders((all) => all.map((o) => (o.id === next.id ? next : o)))}
          onDelete={() => {
            setOrders((all) => all.filter((o) => o.id !== route.id));
            back();
          }}
          onBack={back}
        />
      );
    }
    case "settings":
      return <SettingsScreen onLogout={() => setRoute({ name: "login" })} onBack={back} />;
  }
}
