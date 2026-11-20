import { useState } from "react";
import { Pressable, View } from "react-native";
import { DotwearButton, DotwearCard, DotwearIcon, DotwearTextField, dwSettings, useDotwear } from "@dotwear/react-native";
import { statusIcon, statusLabel, yen, type Order } from "../orders";
import { Body, Screen } from "../ui";

export interface OrderListScreenProps {
  orders: Order[];
  onOpen: (id: string) => void;
  onSettings: () => void;
}

export function OrderListScreen({ orders, onOpen, onSettings }: OrderListScreenProps) {
  const { dots } = useDotwear();
  const [query, setQuery] = useState("");
  const filtered = query ? orders.filter((o) => o.customer.includes(query) || o.id.includes(query)) : orders;

  return (
    <Screen
      title="受注一覧"
      action={<DotwearButton variant="ghost" size="small" icon={dwSettings} accessibilityLabel="設定" onPress={onSettings} testID="settings" />}
    >
      <DotwearTextField label="検索" placeholder="顧客名・番号で検索" value={query} onChangeText={setQuery} />
      {filtered.map((order) => (
        // 行全体を 1 つのボタンとして読み上げる。カード自体は見た目だけ（card.md）
        <Pressable
          key={order.id}
          accessibilityRole="button"
          accessibilityLabel={`${order.customer}、${order.id}、${statusLabel[order.status]}、${yen(order.amount)}`}
          onPress={() => onOpen(order.id)}
          testID={`order-${order.id}`}
        >
          <DotwearCard>
            <View style={{ flexDirection: "row", alignItems: "center", gap: dots(6) }}>
              <DotwearIcon icon={statusIcon[order.status]} scale={2} />
              <View style={{ flex: 1, gap: dots(1) }}>
                <Body>{order.customer}</Body>
                <Body>
                  {order.id}・{statusLabel[order.status]}
                </Body>
              </View>
              <Body style={{ fontVariant: ["tabular-nums"] }}>{yen(order.amount)}</Body>
            </View>
          </DotwearCard>
        </Pressable>
      ))}
    </Screen>
  );
}
