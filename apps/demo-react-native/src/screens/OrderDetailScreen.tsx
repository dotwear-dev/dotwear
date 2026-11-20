import { Alert, View } from "react-native";
import { DotwearButton, DotwearCard, DotwearTextField, dwCheck, dwTrash, useDotwear } from "@dotwear/react-native";
import { statusLabel, yen, type Order } from "../orders";
import { Body, Heading, Screen } from "../ui";

export interface OrderDetailScreenProps {
  order: Order;
  onChange: (order: Order) => void;
  onDelete: () => void;
  onBack: () => void;
}

export function OrderDetailScreen({ order, onChange, onDelete, onBack }: OrderDetailScreenProps) {
  const { dots } = useDotwear();
  const row = (label: string, value: string) => (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }} accessible accessibilityLabel={`${label}、${value}`}>
      <Body>{label}</Body>
      <Body>{value}</Body>
    </View>
  );

  return (
    <Screen title={order.id} onBack={onBack}>
      <DotwearCard>
        <View style={{ gap: dots(3) }}>
          <Heading>{order.customer}</Heading>
          {row("受注番号", order.id)}
          {row("金額", yen(order.amount))}
          {row("状態", statusLabel[order.status])}
        </View>
      </DotwearCard>
      <DotwearTextField label="メモ" placeholder="メモを入力" value={order.note} onChangeText={(note) => onChange({ ...order, note })} />
      <View style={{ gap: dots(4) }}>
        <DotwearButton
          variant="primary"
          size="large"
          icon={dwCheck}
          disabled={order.status !== "draft"}
          onPress={() => onChange({ ...order, status: "confirmed" })}
          style={{ alignSelf: "stretch" }}
        >
          確定する
        </DotwearButton>
        <DotwearButton
          variant="danger"
          size="large"
          icon={dwTrash}
          // 確認のダイアログは標準のまま（見た目を変えない）
          onPress={() =>
            Alert.alert("この受注を削除しますか？", undefined, [
              { text: "キャンセル", style: "cancel" },
              { text: "削除", style: "destructive", onPress: onDelete },
            ])
          }
          style={{ alignSelf: "stretch" }}
        >
          削除
        </DotwearButton>
      </View>
    </Screen>
  );
}
