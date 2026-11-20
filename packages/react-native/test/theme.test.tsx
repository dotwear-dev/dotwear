// テーマとドットの寸法（ADR-019・ADR-032）、アイコンの色の受け渡し、フォントの名前を確かめる
import { render, screen } from "@testing-library/react-native";
import { Dimensions, StyleSheet, Text } from "react-native";
import {
  defaultDotwearTheme,
  DotwearIcon,
  DotwearTheme,
  dotwearFontFamily,
  dotwearFonts,
  dwSave,
  mergeTheme,
  tokens,
  useDotwear,
  type Dotwear,
} from "../src/index.js";

// useWindowDimensions は Dimensions.get("window") から倍率を読むので、そこを差し替えて画面の倍率を変える
function mockPixelRatio(scale: number) {
  jest.spyOn(Dimensions, "get").mockReturnValue({ width: 400, height: 800, scale, fontScale: 1 });
}

afterEach(() => {
  jest.restoreAllMocks();
});

/** useDotwear() の結果を取り出す */
async function probe(element?: (child: React.ReactElement) => React.ReactElement): Promise<Dotwear> {
  let captured: Dotwear | undefined;
  function Probe() {
    captured = useDotwear();
    return <Text>probe</Text>;
  }
  await render(element ? element(<Probe />) : <Probe />);
  return captured!;
}

describe("tokens", () => {
  it("トークンの値を StyleSheet にそのまま渡せる形で持つ", () => {
    expect(tokens.color.bg).toMatch(/^#[0-9a-f]{6}$/);
    expect(Number.isInteger(tokens.shape.pixelUnit)).toBe(true);
    expect(tokens.typography.family).toBe("DotGothic16");
  });
});

describe("useDotwear", () => {
  it("テーマがなければトークンどおり", async () => {
    mockPixelRatio(2);
    const dw = await probe();
    expect(dw.theme).toEqual(defaultDotwearTheme);
    expect(dw.colors.primary).toBe(tokens.color.primary);
  });

  it.each([
    // [画面の倍率, 1 ドットの px, 3 ドットの dp]
    [1, 2, 6],
    [1.5, 3, 6],
    [2, 4, 6],
    [2.625, 5, 15 / 2.625],
    [3, 6, 6],
  ])("倍率 %d では 1 ドット %d px（pixelUnit 2dp を整数ピクセルに切り捨て）", async (ratio, dotPx, dp3) => {
    mockPixelRatio(ratio);
    const dw = await probe();
    expect(dw.dotPx).toBe(dotPx);
    expect(dw.dots(3)).toBeCloseTo(dp3, 10);
    // dp を物理ピクセルに戻すと整数になる
    expect(dw.dots(7) * ratio).toBeCloseTo(7 * dotPx, 10);
  });

  it("二重線の枠の厚さは、外の線＋すき間＋内の線", async () => {
    mockPixelRatio(2);
    expect((await probe()).frameInset).toBe(
      tokens.shape.borderInnerWidth > 0 ? tokens.shape.borderWidth + tokens.shape.borderGap + tokens.shape.borderInnerWidth : tokens.shape.borderWidth,
    );
    const single = await probe((c) => <DotwearTheme theme={{ borderInnerWidth: 0, borderWidth: 2 }}>{c}</DotwearTheme>);
    expect(single.frameInset).toBe(2);
  });
});

describe("DotwearTheme", () => {
  it("一部だけを上書きでき、入れ子では外側の上書きを引き継ぐ", async () => {
    mockPixelRatio(2);
    const dw = await probe((c) => (
      <DotwearTheme theme={{ colors: { primary: "#306230" } }}>
        <DotwearTheme theme={{ pixelUnit: 3 }}>{c}</DotwearTheme>
      </DotwearTheme>
    ));
    expect(dw.colors.primary).toBe("#306230");
    expect(dw.colors.background).toBe(tokens.color.bg);
    expect(dw.theme.pixelUnit).toBe(3);
    expect(dw.dotPx).toBe(6);
  });

  it("アイコンの既定の色を文字色にする", async () => {
    mockPixelRatio(1);
    await render(
      <DotwearTheme theme={{ colors: { foreground: "#0f380f" } }}>
        <DotwearIcon testID="icon" icon={dwSave} />
      </DotwearTheme>,
    );
    const root = screen.getByTestId("icon", { includeHiddenElements: true });
    const fills = root.children.filter((c) => typeof c !== "string").map((c) => StyleSheet.flatten(c.props.style).backgroundColor);
    expect(fills.length).toBeGreaterThan(0);
    expect(new Set(fills)).toEqual(new Set(["#0f380f"]));
  });

  it("整数でない pixelUnit やドット数は受け付けない", () => {
    expect(() => mergeTheme(defaultDotwearTheme, { pixelUnit: 1.5 })).toThrow(/pixelUnit/);
    expect(() => mergeTheme(defaultDotwearTheme, { pixelUnit: 0 })).toThrow(/pixelUnit/);
    expect(() => mergeTheme(defaultDotwearTheme, { borderGap: -1 })).toThrow(/borderGap/);
  });
});

describe("フォント", () => {
  it("fontFamily の名前と、useFonts に渡す組の名前がそろっている", () => {
    expect(dotwearFontFamily).toBe("DotGothic16");
    expect(Object.keys(dotwearFonts)).toEqual(["DotGothic16"]);
    expect(dotwearFonts.DotGothic16).toBeDefined();
  });
});
