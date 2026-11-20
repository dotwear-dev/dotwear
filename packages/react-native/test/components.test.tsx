// 部品の読み上げ（役割・名前・状態）、操作、見た目の決まり（色・寸法・押したときの沈み）を確かめる
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Dimensions, Platform, StyleSheet, Text } from "react-native";
import { CHECK_MARK } from "../src/DotwearToggle.js";
import { DotwearButton, DotwearCard, DotwearTextField, DotwearToggle, dwSave, tokens } from "../src/index.js";

// useWindowDimensions は Dimensions.get("window") から倍率を読むので、そこを差し替えて画面の倍率を変える
function mockPixelRatio(scale: number) {
  jest.spyOn(Dimensions, "get").mockReturnValue({ width: 400, height: 800, scale, fontScale: 1 });
}

beforeEach(() => mockPixelRatio(2));
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

type Node = ReturnType<typeof screen.getByText>;

/** 子孫の要素をすべて返す（Testing Library 14 の要素は find を持たないので、children をたどる） */
function descendants(root: Node): Node[] {
  return root.children.flatMap((c) => (typeof c === "string" ? [] : [c as Node, ...descendants(c as Node)]));
}

function findAll(root: Node, pred: (n: Node) => boolean): Node[] {
  return descendants(root).filter(pred);
}

/** onLayout を持つ本体（外装の内側） */
function bodyOf(root: Node): Node {
  const body = findAll(root, (n) => typeof n.props.onLayout === "function")[0];
  if (!body) throw new Error("本体が見つかりません");
  return body;
}

/** 子孫の View のうち、背景色を持つもの（外装やつまみの矩形）の色を集める */
function fills(root: Node): string[] {
  return findAll(root, (n) => StyleSheet.flatten(n.props.style)?.backgroundColor != null).map((n) => StyleSheet.flatten(n.props.style).backgroundColor as string);
}

/** onLayout を持つ本体（外装の内側）に、測った大きさを伝える */
function layout(root: Node, width: number, height: number) {
  const body = bodyOf(root);
  fireEvent(body, "layout", { nativeEvent: { layout: { x: 0, y: 0, width, height } } });
  return body;
}

const c = tokens.color;

describe("DotwearButton", () => {
  it("ボタンとして名前を読み上げ、押すと onPress を呼ぶ", async () => {
    const onPress = jest.fn();
    await render(<DotwearButton onPress={onPress}>保存</DotwearButton>);
    fireEvent.press(screen.getByRole("button", { name: "保存" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("disabled なら押せず、状態として読み上げる。loading は busy として伝える", async () => {
    const onPress = jest.fn();
    await render(
      <>
        <DotwearButton disabled onPress={onPress}>削除</DotwearButton>
        <DotwearButton loading>送信</DotwearButton>
      </>,
    );
    const del = screen.getByRole("button", { name: "削除" });
    fireEvent.press(del);
    expect(onPress).not.toHaveBeenCalled();
    expect(del.props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByRole("button", { name: "送信" }).props.accessibilityState).toMatchObject({ busy: true });
  });

  it("アイコンだけのボタンには accessibilityLabel で名前を付けられる", async () => {
    await render(<DotwearButton icon={dwSave} accessibilityLabel="保存" />);
    expect(screen.getByRole("button", { name: "保存" })).toBeTruthy();
  });

  it("タップ領域は最低 44pt（iOS）・48dp（Android）", async () => {
    await render(<DotwearButton>OK</DotwearButton>);
    const style = StyleSheet.flatten(screen.getByRole("button").props.style);
    expect(style).toMatchObject({ minHeight: Platform.OS === "android" ? 48 : 44 });
  });

  it("大きさを測ると外装を描く。primary は地が primary、内の線が onPrimary、影が border", async () => {
    await render(<DotwearButton>保存</DotwearButton>);
    const button = screen.getByRole("button");
    expect(fills(button)).toEqual([]);
    await act(async () => {
      layout(button, 60, 32);
    });
    const colors = new Set(fills(button));
    expect(colors).toEqual(new Set([c.border, c.primary, c.onPrimary]));
    expect(StyleSheet.flatten(screen.getByText("保存").props.style)).toMatchObject({ color: c.onPrimary, fontFamily: "DotGothic16", fontWeight: "normal" });
  });

  it("押している間は影を消し、本体を 1 ドット下げる", async () => {
    await render(<DotwearButton variant="secondary">戻る</DotwearButton>);
    const button = screen.getByRole("button");
    await act(async () => {
      layout(button, 60, 32);
    });
    const before = fills(button).length;
    await act(async () => {
      fireEvent(button, "pressIn");
    });
    expect(StyleSheet.flatten(bodyOf(button).props.style).top).toBe(tokens.shape.pixelUnit);
    expect(fills(button).length).toBeLessThan(before);
    await act(async () => {
      fireEvent(button, "pressOut");
    });
    expect(StyleSheet.flatten(bodyOf(button).props.style).top).toBe(0);
  });

  it("ghost は地を塗らず影もない。フォーカスでフォーカスリングを出す", async () => {
    await render(<DotwearButton variant="ghost">メニュー</DotwearButton>);
    const button = screen.getByRole("button");
    await act(async () => {
      layout(button, 60, 32);
    });
    expect(new Set(fills(button))).toEqual(new Set([c.border]));
    await act(async () => {
      fireEvent(button, "focus");
    });
    expect(new Set(fills(button))).toEqual(new Set([c.border, c.focus]));
  });

  it("寸法は size の表どおり（medium は高さ 16 ドット・左右 6 ドット）", async () => {
    await render(<DotwearButton size="large">大</DotwearButton>);
    const body = bodyOf(screen.getByRole("button"));
    const s = StyleSheet.flatten(body.props.style);
    const dot = tokens.shape.pixelUnit;
    // large は外の線が 2 ドットなので、上下は 2 + すき間 + 内の線
    expect(s).toMatchObject({ minHeight: 20 * dot, paddingHorizontal: 8 * dot, paddingVertical: (2 + tokens.shape.borderGap + tokens.shape.borderInnerWidth) * dot });
  });

  it("読み込み中は 3 つのドットをコマ送りで動かし、読み上げない", async () => {
    jest.useFakeTimers();
    await render(<DotwearButton loading>送信</DotwearButton>);
    const dots = screen.getByTestId("dotwear-loading", { includeHiddenElements: true });
    expect(dots.props.accessibilityElementsHidden).toBe(true);
    const opacities = () => dots.children.map((d) => (typeof d === "string" ? null : StyleSheet.flatten(d.props.style).opacity));
    expect(opacities()).toEqual([1, 0.4, 0.4]);
    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    expect(opacities()).toEqual([0.4, 1, 0.4]);
  });
});

describe("DotwearTextField", () => {
  it("入力欄の名前として label を読み上げ、見た目のラベルは二重に読まない", async () => {
    await render(<DotwearTextField label="メール" value="" onChangeText={() => {}} />);
    expect(screen.getByLabelText("メール")).toBeTruthy();
    expect(screen.queryByText("メール")).toBeNull();
    expect(screen.getByText("メール", { includeHiddenElements: true })).toBeTruthy();
  });

  it("エラーは枠を danger の色にし、説明を入力欄のヒントとして読み上げる", async () => {
    await render(<DotwearTextField label="メール" value="x" onChangeText={() => {}} error="形式が違います" />);
    const input = screen.getByLabelText("メール");
    expect(input.props.accessibilityHint).toBe("形式が違います");
    expect(screen.getByText("形式が違います", { includeHiddenElements: true })).toBeTruthy();
  });

  it("入力すると onChangeText を呼ぶ。disabled なら編集できない", async () => {
    const onChangeText = jest.fn();
    await render(
      <>
        <DotwearTextField label="名前" value="" onChangeText={onChangeText} />
        <DotwearTextField label="ID" value="1" disabled />
      </>,
    );
    fireEvent.changeText(screen.getByLabelText("名前"), "山田");
    expect(onChangeText).toHaveBeenCalledWith("山田");
    expect(screen.getByLabelText("ID").props.editable).toBe(false);
  });

  it("入力中はフォーカスリングを出す。プレースホルダーは disabled の色", async () => {
    await render(<DotwearTextField label="検索" value="" placeholder="キーワード" />);
    const input = screen.getByLabelText("検索");
    expect(input.props.placeholderTextColor).toBe(c.disabled);
    const field = screen.getByLabelText("検索").parent!.parent!;
    await act(async () => {
      layout(field, 200, 32);
    });
    expect(fills(field)).not.toContain(c.focus);
    await act(async () => {
      fireEvent(input, "focus");
    });
    expect(fills(field)).toContain(c.focus);
  });
});

describe("DotwearToggle", () => {
  it("スイッチとして名前と状態を読み上げ、押すと反対の値を渡す", async () => {
    const onValueChange = jest.fn();
    await render(<DotwearToggle value={false} onValueChange={onValueChange}>Wi-Fi</DotwearToggle>);
    const sw = screen.getByRole("switch", { name: "Wi-Fi" });
    expect(sw.props.accessibilityState).toMatchObject({ checked: false });
    fireEvent.press(sw);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it("チェックボックスの役割にでき、disabled なら押しても変わらない", async () => {
    const onValueChange = jest.fn();
    await render(
      <DotwearToggle variant="checkbox" value disabled onValueChange={onValueChange}>
        同意する
      </DotwearToggle>,
    );
    const box = screen.getByRole("checkbox", { name: "同意する" });
    expect(box.props.accessibilityState).toMatchObject({ checked: true, disabled: true });
    fireEvent.press(box);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("スイッチのオフは線だけのつまみが左、オンは塗りのつまみが右（ADR-029）", async () => {
    const dot = tokens.shape.pixelUnit;
    const knob = async (value: boolean) => {
      await render(<DotwearToggle value={value} accessibilityLabel="t" />);
      const control = screen.getByTestId("dotwear-toggle-control", { includeHiddenElements: true });
      return findAll(control, (n) => StyleSheet.flatten(n.props.style)?.width === 6 * dot).map((n) => StyleSheet.flatten(n.props.style));
    };
    const off = await knob(false);
    expect(off).toEqual([expect.objectContaining({ left: 1 * dot, backgroundColor: c.border })]);
    const on = await knob(true);
    expect(on).toEqual([expect.objectContaining({ left: 7 * dot, backgroundColor: c.onPrimary })]);
  });

  it("チェックボックスのオンは、6 × 6 のチェックの形を 1 ドットずつ描く", async () => {
    await render(<DotwearToggle variant="checkbox" value accessibilityLabel="t" />);
    const control = screen.getByTestId("dotwear-toggle-control", { includeHiddenElements: true });
    const marks = findAll(
      control,
      (n) => StyleSheet.flatten(n.props.style)?.backgroundColor === c.onPrimary && StyleSheet.flatten(n.props.style).width === tokens.shape.pixelUnit,
    );
    const expected = CHECK_MARK.flatMap((row, y) => [...row].flatMap((ch, x) => (ch === "#" ? [[x + 1, y + 1]] : [])));
    const dot = tokens.shape.pixelUnit;
    expect(marks.map((m) => [StyleSheet.flatten(m.props.style).left / dot, StyleSheet.flatten(m.props.style).top / dot]).sort()).toEqual(expected.sort());
  });

  it("本体は影の分を含めて (14 + 1) × (8 + 1) ドット", async () => {
    await render(<DotwearToggle value={false} accessibilityLabel="t" />);
    const s = StyleSheet.flatten(screen.getByTestId("dotwear-toggle-control", { includeHiddenElements: true }).props.style);
    expect(s).toMatchObject({ width: 15 * tokens.shape.pixelUnit, height: 9 * tokens.shape.pixelUnit });
  });
});

describe("DotwearCard", () => {
  it("中の要素をそれぞれ読み上げ、余白は 6 ドット", async () => {
    await render(
      <DotwearCard testID="card">
        <Text accessibilityRole="header">今月の売上</Text>
        <Text>120 万円</Text>
      </DotwearCard>,
    );
    expect(screen.getByRole("header", { name: "今月の売上" })).toBeTruthy();
    expect(screen.getByText("120 万円")).toBeTruthy();
    const card = screen.getByTestId("card");
    const body = bodyOf(card);
    expect(StyleSheet.flatten(body.props.style)).toMatchObject({ padding: 6 * tokens.shape.pixelUnit });
  });

  it("outlined は影の分を空け、flat は空けない", async () => {
    await render(
      <>
        <DotwearCard testID="outlined" />
        <DotwearCard testID="flat" variant="flat" />
      </>,
    );
    expect(StyleSheet.flatten(screen.getByTestId("outlined").props.style)).toMatchObject({ paddingRight: tokens.shape.pixelUnit, paddingBottom: tokens.shape.pixelUnit });
    expect(StyleSheet.flatten(screen.getByTestId("flat").props.style)).toMatchObject({ paddingRight: 0, paddingBottom: 0 });
    const flat = screen.getByTestId("flat");
    await act(async () => {
      layout(flat, 100, 60);
    });
    expect(new Set(fills(flat))).toEqual(new Set([c.bg, c.border]));
  });
});
