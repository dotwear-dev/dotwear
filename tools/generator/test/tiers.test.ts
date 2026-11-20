// Free と Pro の振り分け（ADR-023）。公開のパッケージに Pro のアイコンが 1 つでも混ざると、
// Pro を無料で配ってしまうので、すべての出力先で確かめる。Pro のアイコンはテストの中だけの仮のもの
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { androidKitOutDirs, androidOutDirs, emitAndroid, emitAndroidKit } from "../src/emit/android.js";
import { ICON_PREFIXES } from "../src/emit/naming.js";
import { emitSwift, emitSwiftKit, swiftKitOutDirs, swiftOutDirs } from "../src/emit/swift.js";
import { emitWeb } from "../src/emit/web.js";
import type { IconSource, Palette } from "../src/source/load.js";

const palette: Palette = { default: { "2": "#2f5bd3" } };
const ROWS = ["##" + ".".repeat(14), ...Array(15).fill(".".repeat(16))];
const icon = (name: string, tier: "free" | "pro"): IconSource => ({ name, category: "test", tier, tags: [], sizes: { "16": ROWS } });
const ICONS = [icon("save", "free"), icon("secret-crown", "pro")];
const PRO_NAMES = /secret-crown|secretCrown|SecretCrown/;

let dir: string | undefined;
afterEach(async () => dir && rm(dir, { recursive: true, force: true }));
const tmp = async () => (dir = await mkdtemp(path.join(os.tmpdir(), "dw-tiers-")));

async function readAll(d: string): Promise<string> {
  const out: string[] = [];
  for (const e of await readdir(d, { withFileTypes: true, recursive: true })) {
    if (e.isFile()) out.push(e.name, await readFile(path.join(e.parentPath, e.name), "utf8"));
  }
  return out.join("\n");
}

describe("Web", () => {
  it("公開のパッケージ（既定）は Free だけで、byPrefixAndName に Pro のプレフィックスがない", async () => {
    const d = await tmp();
    await emitWeb({ icons: ICONS, palette, outDir: d });
    const all = await readAll(d);
    expect(all).not.toMatch(PRO_NAMES);
    const ts = await readFile(path.join(d, "icons.ts"), "utf8");
    expect(ts).toContain(`${JSON.stringify(ICON_PREFIXES.free)}: {`);
    expect(ts).not.toContain(`${JSON.stringify(ICON_PREFIXES.pro)}: {`);
  });

  it("Kit は Free と Pro の全部で、Pro の定義はプレフィックスが Pro になる", async () => {
    const d = await tmp();
    await emitWeb({ icons: ICONS, palette, outDir: d, tiers: ["free", "pro"], typesImport: "@dotwear/icons" });
    const ts = await readFile(path.join(d, "icons.ts"), "utf8");
    expect(ts).toContain('import type { DotwearIconDefinition } from "@dotwear/icons";');
    expect(ts).toContain(`export const ${ICON_PREFIXES.pro}SecretCrown`);
    expect(ts).toContain(`prefix: ${JSON.stringify(ICON_PREFIXES.pro)}`);
    expect(ts).toMatch(new RegExp(`"${ICON_PREFIXES.pro}": \\{\\n\\s+"secret-crown"`));
    expect(await readdir(path.join(d, "svg"))).toContain("secret-crown.svg");
  });
});

describe("Swift", () => {
  it("公開の DotwearIcons は Free だけ。Kit は Pro を .pro に出す", async () => {
    const d = await tmp();
    await emitSwift({ icons: ICONS, palette, packageDir: d });
    expect(await readAll(swiftOutDirs(d).sources)).not.toMatch(PRO_NAMES);
    expect(await readAll(swiftOutDirs(d).tests)).not.toMatch(PRO_NAMES);
    await emitSwiftKit({ icons: ICONS, palette, packageDir: d });
    const kit = await readAll(swiftKitOutDirs(d).sources);
    expect(kit).toContain("public let secretCrown = DotwearIconDefinition(");
    expect(kit).toContain("public static let pro = DotwearProIconSet()");
    // Kit に Free のアイコンを二重に出さない（Free は依存先の DotwearIcons にある）
    expect(kit).not.toContain('name: "save"');
  });
});

describe("Android", () => {
  it("公開の dotwear-icons は Free だけ。Kit は Pro を DotwearIcons.Pro に出す", async () => {
    const d = await tmp();
    await emitAndroid({ icons: ICONS, palette, projectDir: d });
    expect(await readAll(androidOutDirs(d).sourcesRoot)).not.toMatch(PRO_NAMES);
    expect(await readAll(androidOutDirs(d).testsRoot)).not.toMatch(PRO_NAMES);
    await emitAndroidKit({ icons: ICONS, palette, projectDir: d });
    const kit = await readAll(androidKitOutDirs(d).sourcesRoot);
    expect(kit).toContain("val SecretCrown: DotwearIconDefinition by lazy {");
    expect(kit).toContain("val DotwearIcons.Pro: DotwearProIcons get() = DotwearProIcons");
    expect(kit).not.toContain('name = "save"');
  });
});
