// DotwearIcon の大きさ・色・読み上げを、React Native の部品として描いて確かめる
import { render, screen } from "@testing-library/react-native";
import { Dimensions, StyleSheet } from "react-native";
import { DotwearIcon, DotwearIconProvider, dwSave, type DotwearIconDefinition } from "../src/index.js";

// 多色と 24 の描き分けを確かめるためのテスト用定義（実際のアイコンに依存しない）
const multi: DotwearIconDefinition<"multi"> = {
  prefix: "dw",
  name: "multi",
  grids: {
    16: [
      { color: "#", d: "M0 0h1v1h-1z" },
      { color: "2", d: "M1 0h1v1h-1z" },
    ],
    24: [{ color: "#", d: "M0 0h2v2h-2z" }],
  },
};

// useWindowDimensions は Dimensions.get("window") から倍率を読むので、そこを差し替えて画面の倍率を変える
function mockPixelRatio(scale: number) {
  jest.spyOn(Dimensions, "get").mockReturnValue({ width: 400, height: 800, scale, fontScale: 1 });
}

/** testID の付いた外側の View と、その中のマスの View の style を平らにして返す（装飾のアイコンは読み上げから外しているので、隠れた要素も探す） */
function shape(testID = "icon") {
  const root = screen.getByTestId(testID, { includeHiddenElements: true });
  return {
    root: StyleSheet.flatten(root.props.style),
    cells: root.children
      .filter((c): c is Exclude<typeof c, string> => typeof c !== "string")
      .map((c) => StyleSheet.flatten(c.props.style)),
  };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("DotwearIcon", () => {
  it("倍率 2 の画面で scale 2 なら、1 マス 4px（2dp）で 32dp 四方に描く", async () => {
    mockPixelRatio(2);
    await render(<DotwearIcon testID="icon" icon={dwSave} scale={2} />);
    const { root, cells } = shape();
    expect(root).toMatchObject({ width: 32, height: 32 });
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.every((c) => c.backgroundColor === "#000000")).toBe(true);
  });

  it("倍率 2.625 の画面では 1 マスを切り捨てた 2px にする（dp では 16 × 2 ÷ 2.625）", async () => {
    mockPixelRatio(2.625);
    await render(<DotwearIcon testID="icon" icon={multi} />);
    const { root, cells } = shape();
    expect(root.width).toBeCloseTo((16 * 2) / 2.625, 10);
    expect(cells[1]).toMatchObject({ left: 2 / 2.625, top: 0, width: 2 / 2.625, height: 2 / 2.625 });
  });

  it("title があれば画像として読み上げる", async () => {
    mockPixelRatio(2);
    await render(<DotwearIcon icon={dwSave} title="保存" />);
    const icon = screen.getByRole("image", { name: "保存" });
    expect(icon.props.accessible).toBe(true);
  });

  it("title がなければ読み上げから外す", async () => {
    mockPixelRatio(2);
    await render(<DotwearIcon testID="icon" icon={dwSave} />);
    const root = screen.getByTestId("icon", { includeHiddenElements: true });
    expect(root.props.accessible).toBe(false);
    expect(root.props.accessibilityElementsHidden).toBe(true);
    expect(root.props.importantForAccessibility).toBe("no-hide-descendants");
    expect(screen.queryByRole("image")).toBeNull();
  });

  it("# のマスは color、なければ Provider の色。パレットは Provider のものを使う", async () => {
    mockPixelRatio(1);
    await render(
      <DotwearIconProvider color="#123456" palette={{ "2": "#ff0000" }}>
        <DotwearIcon testID="icon" icon={multi} />
        <DotwearIcon testID="tinted" icon={multi} color="#00ff00" />
      </DotwearIconProvider>,
    );
    expect(shape("icon").cells.map((c) => c.backgroundColor)).toEqual(["#123456", "#ff0000"]);
    expect(shape("tinted").cells.map((c) => c.backgroundColor)).toEqual(["#00ff00", "#ff0000"]);
  });

  it("Provider がなければ黒と default のパレット。パレットにないスロットは描かない", async () => {
    mockPixelRatio(1);
    await render(
      <>
        <DotwearIcon testID="icon" icon={multi} />
        <DotwearIconProvider palette={{}}>
          <DotwearIcon testID="empty" icon={multi} />
        </DotwearIconProvider>
      </>,
    );
    expect(shape("icon").cells.map((c) => c.backgroundColor)).toEqual(["#000000", "#181818"]);
    expect(shape("empty").cells.map((c) => c.backgroundColor)).toEqual(["#000000"]);
  });

  it("描き分けのあるグリッドを選べ、ないときは 16 を使う", async () => {
    mockPixelRatio(1);
    await render(
      <>
        <DotwearIcon testID="g24" icon={multi} grid={24} />
        <DotwearIcon testID="g12" icon={multi} grid={12} />
      </>,
    );
    expect(shape("g24").root).toMatchObject({ width: 24, height: 24 });
    expect(shape("g24").cells).toEqual([expect.objectContaining({ width: 2, height: 2 })]);
    expect(shape("g12").root).toMatchObject({ width: 16, height: 16 });
  });

  it("整数でない scale は警告して切り捨てる", async () => {
    mockPixelRatio(1);
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    await render(<DotwearIcon testID="icon" icon={dwSave} scale={2.5} />);
    expect(shape().root).toMatchObject({ width: 32 });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("2.5 → 2"));
  });

  it("利用者の style を後から重ねられる（大きさ以外の余白など）", async () => {
    mockPixelRatio(1);
    await render(<DotwearIcon testID="icon" icon={dwSave} style={{ margin: 4 }} />);
    expect(shape().root).toMatchObject({ width: 16, margin: 4 });
  });
});
