// Vite の開発サーバーに足す API。手元のリポジトリの icons/・brand/ を読み書きする。
// **開発用**：認証がないので、公開するサーバーには絶対に載せない（vite build の出力には含まれない）。
//
//   GET  /api/:collection          名前の一覧
//   GET  /api/:collection/:name    icon.json の中身
//   PUT  /api/:collection/:name    保存。検証に通らなければ元に戻して 422 と問題の一覧を返す
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { tsImport } from "tsx/esm/api";
import type { Plugin } from "vite";
import { formatIconJson } from "../src/model/format.ts";
import type { Collection, IconDocument } from "../src/model/icon.ts";

const COLLECTIONS: readonly Collection[] = ["icons", "brand"];
// フォルダ名に使えるのは kebab-case だけ（パスの外に書き出されるのを防ぐ。スキーマの name と同じ規則）
const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type ValidateIcons = (options: { root: string; iconsDir?: string }) => Promise<{ file: string; line?: number; column?: number; message: string }[]>;

export function iconApi(root: string): Plugin {
  // generator は TypeScript のまま書かれているので、tsx 経由で読み込む
  let validateIcons: ValidateIcons | undefined;
  const loadValidator = async () => {
    validateIcons ??= ((await tsImport("@dotwear/generator/validate", import.meta.url)) as { validateIcons: ValidateIcons }).validateIcons;
    return validateIcons;
  };

  return {
    name: "dotwear-icon-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api", (req, res, next) => {
        handle(req, res).catch((e: unknown) => {
          send(res, 500, { message: e instanceof Error ? e.message : String(e) });
        });
        async function handle(req: IncomingMessage, res: ServerResponse) {
          const [collection, rawName, ...rest] = (req.url ?? "").split("?")[0]!.split("/").filter(Boolean);
          if (!collection || !COLLECTIONS.includes(collection as Collection) || rest.length) return next();
          const dir = path.join(root, collection);

          if (!rawName) {
            if (req.method !== "GET") return next();
            const names = (await readdir(dir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();
            return send(res, 200, names);
          }

          const name = decodeURIComponent(rawName);
          if (!NAME.test(name)) return send(res, 400, { message: `名前は kebab-case にしてください: ${name}` });
          const folder = path.join(dir, name);
          const file = path.join(folder, "icon.json");

          if (req.method === "GET") {
            return send(res, 200, JSON.parse(await readFile(file, "utf8")));
          }
          if (req.method === "PUT") {
            const icon = JSON.parse(await readBody(req)) as IconDocument;
            if (icon.name !== name) return send(res, 400, { message: "URL の名前と name が一致しません" });

            // 書いてから検証し、問題があれば元に戻す（validate はディレクトリ単位でしか動かないため）
            const previous = await readFile(file, "utf8").catch(() => undefined);
            await mkdir(folder, { recursive: true });
            await writeFile(file, formatIconJson(icon));
            const rel = path.relative(root, file);
            const issues = (await (await loadValidator())({ root, iconsDir: dir })).filter((i) => i.file === rel || i.message.includes(rel));
            if (issues.length > 0) {
              if (previous === undefined) await rm(folder, { recursive: true, force: true });
              else await writeFile(file, previous);
              return send(res, 422, { ok: false, issues });
            }
            return send(res, 200, { ok: true });
          }
          return next();
        }
      });
    },
  };
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}
