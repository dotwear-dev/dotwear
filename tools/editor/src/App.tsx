// エディタの画面。保存先は store（IconStore）として外から受け取る。
// 保存先（store）を差し替えても、この画面はそのまま使える
import { paletteDefaults } from "@dotwear/icons";
import { DotwearIcon } from "@dotwear/icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PixelCanvas, cellStyle, type Tool } from "./components/PixelCanvas.tsx";
import { toDefinition } from "./model/definition.ts";
import { formatIconJson } from "./model/format.ts";
import {
  CELL_CHARS,
  GRID_SIZES,
  emptyGrid,
  floodFill,
  initHistory,
  newIcon,
  paintCell,
  paintLine,
  parseTags,
  pushHistory,
  redo,
  replacePresent,
  undo,
  type CellChar,
  type Collection,
  type GridSize,
  type History,
  type IconDocument,
} from "./model/icon.ts";
import type { IconStore, StoreIssue } from "./storage/types.ts";

interface Editing {
  collection: Collection;
  history: History<IconDocument>;
  /** 最後に保存（または読み込み）した時点の内容。未保存の変更があるかの判定に使う */
  savedText: string | null;
}

const CANVAS_PX = 384;
// パレットの default テーマに色があるスロットだけを塗れるようにする。
// 色のないスロットで塗ると、generate がエラーにする（ADR-014）ため
const usable = (ch: CellChar) => ch === "." || ch === "#" || ch in paletteDefaults;
const COLOR_LABEL: Record<CellChar, string> = { ".": "透明", "#": "メイン", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9" };

export function App({ store }: { store: IconStore }) {
  const [collection, setCollection] = useState<Collection>("icons");
  const [names, setNames] = useState<string[]>([]);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [size, setSize] = useState<GridSize>("16");
  const [color, setColor] = useState<CellChar>("#");
  const [tool, setTool] = useState<Tool>("pen");
  const [issues, setIssues] = useState<StoreIssue[]>([]);
  const [status, setStatus] = useState("");
  // 1 回のドラッグで最初の変更だけ履歴に積み、残りは同じ手順の中で上書きする
  const strokePushed = useRef(false);

  const doc = editing?.history.present;
  const dirty = !!editing && (editing.savedText === null || formatIconJson(editing.history.present) !== editing.savedText);
  const isNew = editing?.savedText === null;

  const refreshList = useCallback(async (c: Collection) => setNames(await store.list(c)), [store]);
  useEffect(() => {
    void refreshList(collection);
  }, [collection, refreshList]);

  // 未保存の変更があるときは、タブを閉じる前に確認する
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const confirmDiscard = () => !dirty || window.confirm("保存していない変更を破棄しますか？");

  const open = async (name: string) => {
    if (!confirmDiscard()) return;
    const loaded = await store.load(collection, name);
    setEditing({ collection, history: initHistory(loaded), savedText: formatIconJson(loaded) });
    setSize("16");
    setIssues([]);
    setStatus("");
  };

  const create = () => {
    if (!confirmDiscard()) return;
    setEditing({ collection, history: initHistory(newIcon("new-icon")), savedText: null });
    setSize("16");
    setIssues([]);
    setStatus("新しいアイコン（まだ保存していません）");
  };

  // 内容の変更。push は履歴に積む、false なら今の手順を上書きする
  const update = (fn: (d: IconDocument) => IconDocument, push = true) =>
    setEditing((e) => {
      if (!e) return e;
      const next = fn(e.history.present);
      return { ...e, history: push ? pushHistory(e.history, next) : replacePresent(e.history, next) };
    });

  const setGrid = (grid: readonly string[]) => (d: IconDocument): IconDocument =>
    grid === d.sizes[size] ? d : { ...d, sizes: { ...d.sizes, [size]: [...grid] } };

  const paint = (from: { x: number; y: number } | null, to: { x: number; y: number }) => {
    if (!doc) return;
    const grid = doc.sizes[size]!;
    const ch = tool === "eraser" ? "." : color;
    const next = tool === "fill" ? floodFill(grid, to.x, to.y, ch) : from ? paintLine(grid, from, to, ch) : paintCell(grid, to.x, to.y, ch);
    if (next === grid) return;
    update(setGrid(next), !strokePushed.current);
    strokePushed.current = true;
  };

  const save = useCallback(async () => {
    if (!editing) return;
    setStatus("保存しています…");
    const result = await store.save(editing.collection, editing.history.present);
    if (result.ok) {
      setEditing((e) => (e ? { ...e, savedText: formatIconJson(e.history.present) } : e));
      setIssues([]);
      setStatus("保存しました");
      await refreshList(editing.collection);
    } else {
      setIssues(result.issues);
      setStatus("検証エラーのため保存しませんでした");
    }
  }, [editing, store, refreshList]);

  // キーボード操作：⌘/Ctrl+Z・⇧⌘Z・Ctrl+Y・⌘/Ctrl+S、0〜9 で色、B・E・G で道具
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      } else if (mod && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        setEditing((s) => (s ? { ...s, history: e.shiftKey ? redo(s.history) : undo(s.history) } : s));
      } else if (mod && e.key.toLowerCase() === "y" && !typing) {
        e.preventDefault();
        setEditing((s) => (s ? { ...s, history: redo(s.history) } : s));
      } else if (!mod && !typing) {
        if (/^[0-9]$/.test(e.key)) {
          const ch: CellChar = e.key === "0" ? "." : e.key === "1" ? "#" : (e.key as CellChar);
          if (usable(ch)) setColor(ch);
        }
        else if (e.key === "b") setTool("pen");
        else if (e.key === "e") setTool("eraser");
        else if (e.key === "g") setTool("fill");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  const definition = useMemo(() => (doc ? toDefinition(doc) : null), [doc]);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="row">
          <select value={collection} onChange={(e) => confirmDiscard() && (setCollection(e.target.value as Collection), setEditing(null))}>
            <option value="icons">icons/</option>
            <option value="brand">brand/</option>
          </select>
          <button type="button" onClick={create}>
            ＋ 新規
          </button>
        </div>
        <ul className="icon-list">
          {names.map((n) => (
            <li key={n}>
              <button type="button" aria-current={doc?.name === n && !isNew} onClick={() => void open(n)}>
                {n}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {!doc || !editing ? (
        <main className="empty">左の一覧からアイコンを選ぶか、「新規」で作成してください。</main>
      ) : (
        <main className="workspace">
          <header className="toolbar">
            <h1>
              {doc.name}
              {dirty && <span className="dirty" title="未保存の変更があります"> ●</span>}
            </h1>
            <button type="button" onClick={() => setEditing({ ...editing, history: undo(editing.history) })} disabled={!editing.history.past.length}>
              元に戻す
            </button>
            <button type="button" onClick={() => setEditing({ ...editing, history: redo(editing.history) })} disabled={!editing.history.future.length}>
              やり直す
            </button>
            <button type="button" className="primary" onClick={() => void save()} disabled={!dirty}>
              保存（⌘S）
            </button>
            <span role="status">{status}</span>
          </header>

          <div className="columns">
            <section>
              <div className="row" role="tablist" aria-label="グリッドサイズ">
                {GRID_SIZES.map((s) =>
                  doc.sizes[s] ? (
                    <button key={s} type="button" role="tab" aria-selected={size === s} onClick={() => setSize(s)}>
                      {s}
                    </button>
                  ) : (
                    <button key={s} type="button" onClick={() => (update((d) => ({ ...d, sizes: { ...d.sizes, [s]: emptyGrid(Number(s)) } })), setSize(s))}>
                      ＋ {s}
                    </button>
                  ),
                )}
                {size !== "16" && (
                  <button
                    type="button"
                    onClick={() => {
                      update((d) => {
                        const sizes = { ...d.sizes };
                        delete sizes[size];
                        return { ...d, sizes };
                      });
                      setSize("16");
                    }}
                  >
                    {size} の描き分けを削除
                  </button>
                )}
              </div>

              <div className="row" role="group" aria-label="道具">
                {(["pen", "eraser", "fill"] as const).map((t) => (
                  <button key={t} type="button" aria-pressed={tool === t} onClick={() => setTool(t)}>
                    {{ pen: "ペン（B）", eraser: "消しゴム（E）", fill: "塗りつぶし（G）" }[t]}
                  </button>
                ))}
              </div>

              <div className="row swatches" role="group" aria-label="色">
                {CELL_CHARS.map((ch, i) => (
                  <button
                    key={ch}
                    type="button"
                    aria-pressed={color === ch}
                    disabled={!usable(ch)}
                    title={usable(ch) ? `${COLOR_LABEL[ch]}（${i}）` : `スロット ${ch} はパレットに色がありません（tokens/palette.json）`}
                    onClick={() => setColor(ch)}
                  >
                    <span className="swatch" data-ch={ch} style={cellStyle(ch)} />
                    {ch}
                  </button>
                ))}
              </div>

              <PixelCanvas
                grid={doc.sizes[size] ?? doc.sizes["16"]}
                size={CANVAS_PX}
                onStrokeStart={() => (strokePushed.current = false)}
                onPaint={paint}
              />
            </section>

            <section className="side">
              <h2>プレビュー</h2>
              {/* 配布物と同じ DotwearIcon で、整数倍の大きさだけを表示する */}
              <div className="previews">
                {definition &&
                  [1, 2, 4].map((scale) => (
                    <figure key={scale}>
                      <DotwearIcon icon={definition} grid={Number(size) as 12 | 16 | 24} scale={scale} />
                      <figcaption>{Number(size) * scale}px</figcaption>
                    </figure>
                  ))}
              </div>

              <h2>情報</h2>
              <label>
                名前（kebab-case）
                <input value={doc.name} disabled={!isNew} onChange={(e) => update((d) => ({ ...d, name: e.target.value }))} />
              </label>
              {!isNew && <p className="hint">名前の変更は、ファイルの移動になるので未対応です。</p>}
              <label>
                カテゴリ
                <input value={doc.category} onChange={(e) => update((d) => ({ ...d, category: e.target.value }))} />
              </label>
              <label>
                tier
                <select value={doc.tier} onChange={(e) => update((d) => ({ ...d, tier: e.target.value as IconDocument["tier"] }))}>
                  <option value="free">free</option>
                  <option value="pro">pro</option>
                </select>
              </label>
              <TagsInput tags={doc.tags} onChange={(tags) => update((d) => ({ ...d, tags }))} />

              {issues.length > 0 && (
                <div className="issues" role="alert">
                  <h2>検証エラー</h2>
                  <ul>
                    {issues.map((i, k) => (
                      <li key={k}>
                        {i.file}
                        {i.line ? `:${i.line}${i.column ? `:${i.column}` : ""}` : ""} {i.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
        </main>
      )}
    </div>
  );
}

// タグは「,」か「、」区切りで入力し、入力欄から離れたときに確定する（入力中にカンマが消えないようにするため）
function TagsInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [text, setText] = useState(tags.join(", "));
  useEffect(() => setText(tags.join(", ")), [tags]);
  return (
    <label>
      タグ（, 区切り）
      <input value={text} onChange={(e) => setText(e.target.value)} onBlur={() => onChange(parseTags(text))} />
    </label>
  );
}
