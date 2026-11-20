// デモの流れ（ログイン → 一覧 → 詳細・設定）を、読み上げの名前で操作して確かめる。
// 画面の中身だけを描く（App.tsx はフォントの読み込みを待つので対象にしない）
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DotwearTheme } from "@dotwear/react-native";
import { DemoApp, routeFromEnv } from "../src/DemoApp";

async function renderApp(ui: ReactElement) {
  // SafeAreaProvider は大きさを測るまで中身を出さないので、テストでは最初から大きさを渡す
  const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <DotwearTheme>{ui}</DotwearTheme>
    </SafeAreaProvider>,
  );
}

afterEach(() => jest.useRealTimers());

it("メールアドレスの形式が違えば、入力欄のヒントとしてエラーを伝える。正しければ一覧へ進む", async () => {
  jest.useFakeTimers();
  await renderApp(<DemoApp />);
  await fireEvent.changeText(screen.getByLabelText("メールアドレス"), "user");
  await fireEvent.press(screen.getByRole("button", { name: "ログイン" }));
  expect(screen.getByLabelText("メールアドレス").props.accessibilityHint).toBe("メールアドレスの形式が正しくありません");

  await fireEvent.changeText(screen.getByLabelText("メールアドレス"), "user@example.com");
  await fireEvent.press(screen.getByRole("button", { name: "ログイン" }));
  expect(screen.getByRole("button", { name: "ログイン" }).props.accessibilityState).toMatchObject({ busy: true });
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(screen.getByRole("header", { name: "受注一覧" })).toBeTruthy();
});

it("一覧の行は 1 つのボタンとして読み上げ、押すと詳細を開く。下書きは確定できる", async () => {
  await renderApp(<DemoApp initialRoute={{ name: "list" }} />);
  await fireEvent.press(screen.getByRole("button", { name: "ドット工房、A-1025、下書き、¥54,800" }));
  expect(screen.getByRole("header", { name: "ドット工房" })).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "確定する" }));
  expect(screen.getByLabelText("状態、確定")).toBeTruthy();
  expect(screen.getByRole("button", { name: "確定する" }).props.accessibilityState).toMatchObject({ disabled: true });
  await fireEvent.press(screen.getByRole("button", { name: "戻る" }));
  expect(screen.getByRole("button", { name: "ドット工房、A-1025、確定、¥54,800" })).toBeTruthy();
});

it("検索で一覧を絞り込める", async () => {
  await renderApp(<DemoApp initialRoute={{ name: "list" }} />);
  await fireEvent.changeText(screen.getByLabelText("検索"), "電機");
  expect(screen.getAllByRole("button", { name: /^.+、A-\d+/ })).toHaveLength(1);
});

it("設定のスイッチとチェックボックスを切り替えられ、通知を切ると通知音は押せなくなる", async () => {
  await renderApp(<DemoApp initialRoute={{ name: "list" }} />);
  await fireEvent.press(screen.getByRole("button", { name: "設定" }));
  const push = screen.getByRole("switch", { name: "プッシュ通知" });
  expect(push.props.accessibilityState).toMatchObject({ checked: true });
  await fireEvent.press(push);
  expect(screen.getByRole("switch", { name: "プッシュ通知" }).props.accessibilityState).toMatchObject({ checked: false });
  expect(screen.getByRole("switch", { name: "通知音" }).props.accessibilityState).toMatchObject({ disabled: true });
  await fireEvent.press(screen.getByRole("checkbox", { name: "利用状況の送信に同意する" }));
  expect(screen.getByRole("checkbox", { name: "利用状況の送信に同意する" }).props.accessibilityState).toMatchObject({ checked: true });
  await fireEvent.press(screen.getByRole("button", { name: "ログアウト" }));
  expect(screen.getByRole("header", { name: "ログイン" })).toBeTruthy();
});

it("最初の画面を環境変数の値で選べる（見た目の確認用）", () => {
  expect(routeFromEnv(undefined)).toEqual({ name: "login" });
  expect(routeFromEnv("settings")).toEqual({ name: "settings" });
  expect(routeFromEnv("detail:A-1025")).toEqual({ name: "detail", id: "A-1025" });
});
