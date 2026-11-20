import { useEffect, useRef, useState } from "react";
import { Keyboard, View } from "react-native";
import { DotwearButton, DotwearIcon, DotwearTextField, dwUser, useDotwear } from "@dotwear/react-native";
import { Heading, Screen } from "../ui";

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const { dots } = useDotwear();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const submit = () => {
    // 送信したらキーボードを閉じる（次の画面の最初のタップが、キーボードを閉じる操作に使われないように）
    Keyboard.dismiss();
    // デモなので、形式だけを確かめる
    if (!email.includes("@")) {
      setEmailError("メールアドレスの形式が正しくありません");
      return;
    }
    setEmailError(null);
    setLoading(true);
    timer.current = setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1000);
  };

  return (
    <Screen title="Dotwear Demo">
      <View style={{ flexDirection: "row", alignItems: "center", gap: dots(4) }}>
        <DotwearIcon icon={dwUser} scale={3} />
        <Heading>ログイン</Heading>
      </View>
      <DotwearTextField
        label="メールアドレス"
        placeholder="メールアドレスを入力"
        value={email}
        onChangeText={setEmail}
        error={emailError}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoCapitalize="none"
        autoCorrect={false}
        testID="email"
      />
      <DotwearTextField label="パスワード" placeholder="8 文字以上" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" testID="password" />
      <DotwearButton variant="primary" size="large" loading={loading} disabled={loading} onPress={submit} style={{ alignSelf: "stretch" }} testID="login">
        ログイン
      </DotwearButton>
    </Screen>
  );
}
