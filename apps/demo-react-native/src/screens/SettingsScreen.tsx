import { useState } from "react";
import { View } from "react-native";
import { DotwearButton, DotwearCard, DotwearToggle, useDotwear } from "@dotwear/react-native";
import { Heading, Screen } from "../ui";

export function SettingsScreen({ onLogout, onBack }: { onLogout: () => void; onBack: () => void }) {
  const { dots } = useDotwear();
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [agreeAnalytics, setAgreeAnalytics] = useState(false);

  return (
    <Screen title="設定" onBack={onBack}>
      <DotwearCard>
        <View style={{ gap: dots(2) }}>
          <Heading size={16}>通知</Heading>
          <DotwearToggle value={notifications} onValueChange={setNotifications}>
            プッシュ通知
          </DotwearToggle>
          <DotwearToggle value={sound} onValueChange={setSound} disabled={!notifications}>
            通知音
          </DotwearToggle>
          <DotwearToggle variant="checkbox" value={weeklyReport} onValueChange={setWeeklyReport}>
            週次レポートをメールで受け取る
          </DotwearToggle>
        </View>
      </DotwearCard>
      <DotwearCard>
        <View style={{ gap: dots(2) }}>
          <Heading size={16}>プライバシー</Heading>
          <DotwearToggle variant="checkbox" value={agreeAnalytics} onValueChange={setAgreeAnalytics}>
            利用状況の送信に同意する
          </DotwearToggle>
        </View>
      </DotwearCard>
      <View style={{ flexDirection: "row", gap: dots(4) }}>
        <DotwearButton variant="secondary" onPress={onLogout} testID="logout">
          ログアウト
        </DotwearButton>
        <DotwearButton variant="ghost" onPress={onBack}>
          キャンセル
        </DotwearButton>
      </View>
    </Screen>
  );
}
