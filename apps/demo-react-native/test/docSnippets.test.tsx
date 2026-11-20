// ドキュメントサイトに載せるコード例（doc-snippets/snippets.tsx）を実際に描いて、実行時にも落ちないことを確かめる。
// 型は pnpm typecheck で見ている。見た目と読み上げは @dotwear/react-native のテストで見ている
import { render, screen } from "@testing-library/react-native";
import type { ComponentType } from "react";
import { DotwearTheme } from "@dotwear/react-native";
import App, * as snippets from "../doc-snippets/snippets";

// Node にはフォントを読み込む仕組みがないので、読み込み済みとして扱う
jest.mock("expo-font", () => ({ useFonts: () => [true, null] }));

it("Getting Started の例は、フォントを読み込んだらボタンを出す", async () => {
  await render(<App />);
  expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
});

// default 以外の export はすべてコード例の部品。props は一番ありがちな値を渡す
const props: Record<string, object> = { IconByName: { name: "save" }, ButtonLoading: { isSaving: true } };

it.each(Object.entries(snippets).filter(([name]) => name !== "default"))("%s を描ける", async (name, Snippet) => {
  await render(
    <DotwearTheme>
      {(() => {
        const C = Snippet as ComponentType<object>;
        return <C {...(props[name] ?? {})} />;
      })()}
    </DotwearTheme>,
  );
  expect(screen.toJSON()).not.toBeNull();
});
