// ドキュメントサイト（apps/docs-site）に載せる React Native のコード例。
// サイトは `// snippet:<名前>` から `// end-snippet` までを取り出して表示する（apps/docs-site/src/lib/snippets.ts）。
// デモアプリの中に置くのは、実際に expo-font と @dotwear/react-native を入れた環境で型を検査するため（pnpm typecheck）。
// test/docSnippets.test.tsx で描画もして、実行時にも落ちないことを確かめる。
// 名前は Web（src/snippets/*.tsx）と Swift（Snippets.swift）にそろえ、同じタブの組で並べる
import { useState } from "react";
import { Text, View } from "react-native";
// snippet:quickstart
import { useFonts } from "expo-font";
import { DotwearButton, DotwearTheme, dotwearFonts, dwSave } from "@dotwear/react-native";

export default function App() {
  // Load the bundled DotGothic16 font before showing any text
  const [fontsLoaded] = useFonts(dotwearFonts);
  if (!fontsLoaded) return null;

  return (
    <DotwearTheme>
      <DotwearButton icon={dwSave} onPress={() => console.log("saved")}>
        Save
      </DotwearButton>
    </DotwearTheme>
  );
}
// end-snippet
// snippet:icons-only
import { DotwearIcon, DotwearIconProvider, byName, byPrefixAndName, dwTrash, palettes, type DotwearIconName } from "@dotwear/react-native-icons";
// end-snippet
import { DotwearCard, DotwearTextField, DotwearToggle, tokens, useDotwear } from "@dotwear/react-native";

// コード例が呼ぶ処理（テストで描くので、宣言だけでなく中身のない関数にする）
function save() {}
function cancel() {}
function remove() {}

// MARK: アイコン

export function IconBasic() {
  return (
    <>
      {/* snippet:icon-basic */}
      {/* 16 × 16 dp */}
      <DotwearIcon icon={dwSave} />
      {/* 32 × 32 dp */}
      <DotwearIcon icon={dwSave} scale={2} />
      {/* end-snippet */}
    </>
  );
}

export function IconColor() {
  return (
    // snippet:icon-color
    <DotwearIcon icon={dwTrash} scale={2} color="crimson" />
    // end-snippet
  );
}

export function IconLabel() {
  return (
    <>
      {/* snippet:icon-label */}
      {/* Decorative: hidden from VoiceOver and TalkBack */}
      <DotwearIcon icon={dwSave} />

      {/* Meaningful on its own: give it a title */}
      <DotwearIcon icon={dwTrash} title="Delete" />
      {/* end-snippet */}
    </>
  );
}

export function IconGrid() {
  return (
    // snippet:icon-grid
    <DotwearIcon icon={dwSave} scale={1} grid={24} />
    // end-snippet
  );
}

export function IconByName({ name }: { name: DotwearIconName }) {
  return (
    <>
      {/* snippet:icon-by-name */}
      <DotwearIcon icon={byName[name]} scale={2} />
      <DotwearIcon icon={byPrefixAndName.dw["save"]} scale={2} />
      {/* end-snippet */}
    </>
  );
}

export function IconPalette() {
  return (
    // snippet:icon-palette
    <DotwearIconProvider palette={palettes["retro-green"]}>
      <DotwearIcon icon={byName.folder} scale={2} />
    </DotwearIconProvider>
    // end-snippet
  );
}

// MARK: 部品

export function Buttons() {
  return (
    <>
      {/* snippet:button */}
      <DotwearButton onPress={save}>Save</DotwearButton>

      <DotwearButton variant="secondary" size="small" onPress={cancel}>
        Cancel
      </DotwearButton>

      <DotwearButton variant="danger" icon={dwTrash} onPress={remove}>
        Delete
      </DotwearButton>
      {/* end-snippet */}
    </>
  );
}

export function ButtonLoading({ isSaving }: { isSaving: boolean }) {
  return (
    // snippet:button-loading
    <DotwearButton icon={dwSave} loading={isSaving} disabled={isSaving} onPress={save}>
      Save
    </DotwearButton>
    // end-snippet
  );
}

export function TextFieldExample({ emailError }: { emailError?: string }) {
  // snippet:text-field
  const [email, setEmail] = useState("");
  return (
    <DotwearTextField
      label="Email"
      keyboardType="email-address"
      value={email}
      onChangeText={setEmail}
      error={emailError} // undefined hides the message
    />
  );
  // end-snippet
}

export function Toggles() {
  // snippet:toggle
  const [wifi, setWifi] = useState(true);
  const [agree, setAgree] = useState(false);
  return (
    <>
      <DotwearToggle value={wifi} onValueChange={setWifi}>
        Wi-Fi
      </DotwearToggle>

      <DotwearToggle variant="checkbox" value={agree} onValueChange={setAgree}>
        I agree to the terms
      </DotwearToggle>
    </>
  );
  // end-snippet
}

export function Cards() {
  return (
    <>
      {/* snippet:card */}
      <DotwearCard>
        <Text accessibilityRole="header">Storage</Text>
        <Text>12 GB of 50 GB used</Text>
      </DotwearCard>

      <DotwearCard variant="flat">
        <Text>Nested</Text>
      </DotwearCard>
      {/* end-snippet */}
    </>
  );
}

// MARK: テーマ

export function ThemeRoot() {
  return (
    // snippet:theme-root
    <DotwearTheme>
      <RootView />
    </DotwearTheme>
    // end-snippet
  );
}

function RootView() {
  return <Text>Root</Text>;
}

export function ThemeCustom() {
  return (
    // snippet:theme-custom
    // Only the values you pass are changed; the rest follow the outer theme
    <DotwearTheme theme={{ colors: { primary: "#cc334d" } }}>
      <RootView />
    </DotwearTheme>
    // end-snippet
  );
}

// snippet:theme-read
function Badge() {
  const { colors, dots } = useDotwear();
  return (
    // dots(2): 2 dots → dp, always a whole number of device pixels
    <View style={{ padding: dots(2), backgroundColor: colors.primary }}>
      <Text style={{ color: colors.onPrimary }}>NEW</Text>
    </View>
  );
}

// Raw values (for charts, native modules…)
const primaryHex = tokens.color.primary; // "#181818"
// end-snippet

export function ThemeRead() {
  return (
    <View accessibilityHint={primaryHex}>
      <Badge />
    </View>
  );
}
