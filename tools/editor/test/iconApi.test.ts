// 開発サーバーの API（server/iconApi.ts）を、一時ディレクトリのリポジトリに対して動かす
import { cp, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { iconApi } from "../server/iconApi.ts";
import { formatIconJson } from "../src/model/format.ts";
import { newIcon, paintCell, type IconDocument } from "../src/model/icon.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
let tmp: string;
let server: ViteDevServer;
let base: string;

beforeAll(async () => {
  tmp = await mkdtemp(path.join(os.tmpdir(), "dotwear-editor-"));
  for (const d of ["icons", "brand", "schema"]) await cp(path.join(ROOT, d), path.join(tmp, d), { recursive: true });
  server = await createServer({ configFile: false, root: tmp, logLevel: "silent", plugins: [iconApi(tmp)], server: { port: 0 } });
  await server.listen();
  const address = server.httpServer!.address();
  base = `http://localhost:${typeof address === "object" && address ? address.port : 0}`;
});

afterAll(async () => {
  await server.close();
  await rm(tmp, { recursive: true, force: true });
});

const put = (collection: string, icon: IconDocument) =>
  fetch(`${base}/api/${collection}/${icon.name}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(icon) });

describe("iconApi", () => {
  it("一覧と読み込み", async () => {
    const names = (await (await fetch(`${base}/api/icons`)).json()) as string[];
    expect(names).toContain("save");
    const save = (await (await fetch(`${base}/api/icons/save`)).json()) as IconDocument;
    expect(save.name).toBe("save");
  });

  it("保存すると、リポジトリと同じ書き方で書き出す", async () => {
    const save = (await (await fetch(`${base}/api/icons/save`)).json()) as IconDocument;
    const edited = { ...save, sizes: { ...save.sizes, "16": [...paintCell(save.sizes["16"], 0, 0, "#")] } };
    const res = await put("icons", edited);
    expect(res.status).toBe(200);
    expect(await readFile(path.join(tmp, "icons/save/icon.json"), "utf8")).toBe(formatIconJson(edited));
  });

  it("新しいアイコンを作れる", async () => {
    const icon = { ...newIcon("new-one"), category: "test", sizes: { "16": [...paintCell(newIcon("x").sizes["16"], 3, 3, "#")] } };
    expect((await put("icons", icon)).status).toBe(200);
    expect((await stat(path.join(tmp, "icons/new-one/icon.json"))).isFile()).toBe(true);
  });

  it("検証に通らなければ保存せず、問題を返す（既存のファイルは元のまま）", async () => {
    const before = await readFile(path.join(tmp, "icons/check/icon.json"), "utf8");
    const broken = { ...(JSON.parse(before) as IconDocument), tier: "gold" } as unknown as IconDocument;
    const res = await put("icons", broken);
    expect(res.status).toBe(422);
    const body = (await res.json()) as { ok: false; issues: { message: string }[] };
    expect(body.issues.some((i) => i.message.includes("tier"))).toBe(true);
    expect(await readFile(path.join(tmp, "icons/check/icon.json"), "utf8")).toBe(before);
  });

  it("検証に通らない新しいアイコンは、フォルダごと残さない", async () => {
    const empty = { ...newIcon("empty-one"), category: "test" }; // すべて透明は検証エラー
    expect((await put("icons", empty)).status).toBe(422);
    await expect(stat(path.join(tmp, "icons/empty-one"))).rejects.toThrow();
  });

  it("kebab-case でない名前（パスの外に出る名前など）は受け付けない", async () => {
    const res = await fetch(`${base}/api/icons/${encodeURIComponent("../evil")}`, { method: "PUT", body: "{}" });
    expect(res.status).toBe(400);
  });
});
