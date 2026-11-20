// 開発サーバー（server/iconApi.ts）経由で、手元のリポジトリの icon.json を読み書きする
import type { Collection, IconDocument } from "../model/icon.ts";
import type { IconStore, SaveResult } from "./types.ts";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok && res.status !== 422) throw new Error(`${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

export const devServerStore: IconStore = {
  async list(collection) {
    return json<string[]>(await fetch(`/api/${collection}`));
  },
  async load(collection, name) {
    return json<IconDocument>(await fetch(`/api/${collection}/${encodeURIComponent(name)}`));
  },
  async save(collection, icon) {
    const res = await fetch(`/api/${collection}/${encodeURIComponent(icon.name)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(icon),
    });
    return json<SaveResult>(res);
  },
};
