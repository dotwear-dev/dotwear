// アイコン一覧（検索・表示倍率・パレットのテーマ・コピー）。ページの中で唯一動く部分なので React のアイランドにする
import { byName, DotwearIcon, type DotwearIconName } from "@dotwear/web";
import { useMemo, useState } from "react";
import type { IconMeta } from "../lib/source";

interface Props {
  icons: IconMeta[];
  themes: string[];
}

const SCALES = [1, 2, 3, 4] as const;

export default function IconGallery({ icons, themes }: Props) {
  const [query, setQuery] = useState("");
  const [scale, setScale] = useState<number>(2);
  const [theme, setTheme] = useState(themes[0] ?? "default");
  const [selected, setSelected] = useState<IconMeta | null>(null);

  // 名前・タグ（元データのタグは日本語）・カテゴリの部分一致。空白区切りの語はすべて含むものだけを残す
  const filtered = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return icons;
    return icons.filter((icon) => {
      const haystack = [icon.name, icon.category, ...icon.tags].join(" ").toLowerCase();
      return words.every((w) => haystack.includes(w));
    });
  }, [icons, query]);

  return (
    // data-dw-palette でパレットのテーマを切り替える（@dotwear/icons/palette.css）
    <div className="gallery" data-dw-palette={theme}>
      <div className="gallery-controls">
        <label className="gallery-search">
          <span>Search</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="save, file, 保存…"
          />
        </label>
        <div role="group" aria-label="Scale" className="gallery-scale">
          {SCALES.map((s) => (
            <button key={s} type="button" className="pixel-button" aria-pressed={scale === s} onClick={() => setScale(s)}>
              {s}×
            </button>
          ))}
        </div>
        {themes.length > 1 && (
          <label>
            <span>Palette </span>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              {themes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <p className="gallery-count" aria-live="polite">
        {filtered.length} of {icons.length} icons
      </p>

      <ul className="gallery-grid">
        {filtered.map((icon) => (
          <li key={icon.name}>
            <button
              type="button"
              className="gallery-item pixel-box"
              aria-pressed={selected?.name === icon.name}
              onClick={() => setSelected(icon)}
            >
              <DotwearIcon icon={byName[icon.name as DotwearIconName]} scale={scale} />
              <span>{icon.name}</span>
            </button>
          </li>
        ))}
      </ul>

      {selected && <IconDetail icon={selected} />}
    </div>
  );
}

function IconDetail({ icon }: { icon: IconMeta }) {
  // 使い方の詳しい説明は /icons/usage/。ここはコピーしてすぐ使える 1 行だけを出す
  const snippets = [
    { label: "Import (web)", code: `import { ${icon.exportName} } from "@dotwear/icons";` },
    { label: "React", code: `<DotwearIcon icon={${icon.exportName}} scale={2} />` },
    { label: "SwiftUI", code: `DotwearIcon(.${icon.swiftName}, scale: 2)` },
  ];
  return (
    <section className="gallery-detail pixel-box" aria-label={`How to use ${icon.name}`}>
      <h2>
        <DotwearIcon icon={byName[icon.name as DotwearIconName]} scale={4} /> {icon.name}
      </h2>
      <p>
        Category: {icon.category}
        {icon.tags.length > 0 && <> · Tags: {icon.tags.join(", ")}</>}
      </p>
      <dl>
        {snippets.map((s) => (
          <div key={s.label}>
            <dt>{s.label}</dt>
            <dd>
              <code>{s.code}</code> <CopyButton text={s.code} />
            </dd>
          </div>
        ))}
        <div>
          <dt>SVG</dt>
          <dd>
            {icon.grids.map((g) => {
              const file = g === 16 ? `${icon.name}.svg` : `${icon.name}-${g}.svg`;
              return (
                <span key={g}>
                  <a href={`/svg/${file}`} download>
                    {file}
                  </a>{" "}
                  <CopyButton fetchUrl={`/svg/${file}`} />
                </span>
              );
            })}
          </dd>
        </div>
      </dl>
    </section>
  );
}

// text をそのまま、または fetchUrl の中身をクリップボードにコピーする
function CopyButton({ text, fetchUrl }: { text?: string; fetchUrl?: string }) {
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const copy = async () => {
    try {
      const value = text ?? (await (await fetch(fetchUrl!)).text());
      await navigator.clipboard.writeText(value);
      setState("done");
    } catch {
      setState("error");
    }
    setTimeout(() => setState("idle"), 1500);
  };
  return (
    <button type="button" className="pixel-button" onClick={copy}>
      {state === "done" ? "Copied" : state === "error" ? "Copy failed" : "Copy"}
    </button>
  );
}
