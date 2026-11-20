// コード例を、実際にコンパイルされるソースから取り出す。
//   Web   … src/snippets/*.tsx（astro check で型を検査する）
//   Swift … packages/swift/Tests/DocSnippetsTests/Snippets.swift（swift test でコンパイルする）
// ページに直接コードを書くと、API を変えたときに例だけが古くなって気づけないため、この形にしている。
//
// 書式：`// snippet:<名前>` の次の行から `// end-snippet` の前の行までを取り出し、共通の字下げを取り除く。
// JSX の中では `{/* snippet:<名前> */}` と `{/* end-snippet */}` も使える。
// `//+ ` で始まる行はコメントを外して表示する（テストのターゲットには書けない @main などを見せるため）
import swiftSource from "../../../../packages/swift/Tests/DocSnippetsTests/Snippets.swift?raw";

// Vite の glob で、src/snippets/ の Web のコード例をすべて文字列として読む
const webSources = import.meta.glob<string>("../snippets/*.tsx", { query: "?raw", import: "default", eager: true });

// その行が目印のコメント（`// x`、または JSX のコメントの `{/* x */}`）かどうか
function isMarker(line: string, text: string): boolean {
  const t = line.trim();
  return t === `// ${text}` || t === `{/* ${text} */}`;
}

export function extractSnippet(source: string, name: string, origin: string): string {
  const lines = source.split("\n");
  const start = lines.findIndex((l) => isMarker(l, `snippet:${name}`));
  if (start < 0) throw new Error(`コード例 "${name}" が ${origin} にありません`);
  const end = lines.findIndex((l, i) => i > start && isMarker(l, "end-snippet"));
  if (end < 0) throw new Error(`コード例 "${name}"（${origin}）に // end-snippet がありません`);
  const body = lines.slice(start + 1, end).map((l) => l.replace(/^(\s*)\/\/\+ /, "$1"));
  const indent = Math.min(...body.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length));
  return body.map((l) => l.slice(indent)).join("\n").trimEnd();
}

/** Swift のコード例 */
export function swift(name: string): string {
  return extractSnippet(swiftSource, name, "Snippets.swift");
}

/** Web のコード例。名前はすべてのファイルから探す（同じ名前が 2 つあればエラー） */
export function web(name: string): string {
  const found = Object.entries(webSources).filter(([, src]) => src.split("\n").some((l) => isMarker(l, `snippet:${name}`)));
  if (found.length !== 1) {
    throw new Error(found.length ? `Web のコード例 "${name}" が複数のファイルにあります` : `Web のコード例 "${name}" がありません`);
  }
  const [file, src] = found[0]!;
  return extractSnippet(src, name, file);
}
