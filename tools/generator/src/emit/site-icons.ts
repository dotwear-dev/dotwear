// サイト用のアイコン（favicon・apple-touch-icon・OGP 画像）。ロゴの元データ（brand/<name>/icon.json）から作る。
// 出力先は <root>/generated/brand/site/。ドキュメントサイトがそのまま配る（パッケージでは配らない。ADR-010）。
//
// にじませないため、PNG はすべて「SVG を整数倍で描く」だけで作る（座標が整数で crispEdges なので、マスの境界はぼけない）。
// OGP 画像の文字（DotGothic16）は 16px を 1 マスとして描かれているので、16 の整数倍の大きさで置く（ADR-026）。
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import type { IconSource } from "../source/load.js";
import { GENERATED_HEADER, gridToLayers } from "./svg.js";

export interface SiteColors {
  /** 背景（color.bg） */
  bg: string;
  /** ロゴの本体（color.fg） */
  fg: string;
  /** ロゴの右下のドット（color.brand） */
  brand: string;
}

export interface EmitSiteIconsOptions {
  logo: IconSource;
  colors: SiteColors;
  /** OGP 画像の文字に使うフォント（DotGothic16 の TTF） */
  fontFile: string;
  /** OGP 画像の 2 行目 */
  tagline: string;
  outDir: string;
}

/** OGP 画像の大きさ（X・Facebook・Slack が推奨する 1.91:1） */
export const OG_SIZE = { width: 1200, height: 630 } as const;
/** apple-touch-icon の大きさ（iPhone の標準） */
export const TOUCH_ICON_SIZE = 180;

/** ロゴのパスを、指定した位置と倍率で並べた <g> にする（倍率と位置は整数だけ） */
function logoGroup(grid: readonly string[], colors: SiteColors, x: number, y: number, scale: number, bodyClass?: string): string {
  if (![x, y, scale].every(Number.isInteger)) throw new Error("ロゴの位置と倍率は整数にする（にじまないように）");
  const paths = gridToLayers(grid)
    .map((l) => {
      if (l.color === "#") return `<path${bodyClass ? ` class="${bodyClass}"` : ""} fill="${colors.fg}" d="${l.d}"/>`;
      if (l.color === "2") return `<path fill="${colors.brand}" d="${l.d}"/>`;
      throw new Error(`ロゴではスロット ${l.color} を使えません（使えるのは # と 2）`);
    })
    .join("");
  return `<g transform="translate(${x} ${y}) scale(${scale})">${paths}</g>`;
}

function svgDoc(width: number, height: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${body}</svg>`;
}

function toPng(svg: string, fontFile?: string): Buffer {
  return new Resvg(svg, {
    fitTo: { mode: "original" },
    background: "rgba(0,0,0,0)",
    // 文字は同梱のフォントだけで描く（環境によって絵が変わらないように）
    font: { loadSystemFonts: false, fontFiles: fontFile ? [fontFile] : [], defaultFontFamily: "DotGothic16" },
  })
    .render()
    .asPng();
}

/**
 * favicon.svg：ロゴの 16 マス版。ダークモードのタブでも見えるように、本体だけ色を反転する（ドットの色は変えない）。
 * SVG の favicon は <img> と同じく外の CSS が届かないので、色は直接書き、切り替えは SVG の中の <style> で行う
 */
export function faviconSvg(grid: readonly string[], colors: SiteColors): string {
  const size = grid.length;
  const style = `<style>@media (prefers-color-scheme: dark){.body{fill:${colors.bg}}}</style>`;
  return svgDoc(size, size, style + logoGroup(grid, colors, 0, 0, 1, "body"));
}

/** size × size の正方形の真ん中に、ロゴを整数倍で置く。margin は四辺にとる最小の余白 */
export function centeredLogo(grid: readonly string[], colors: SiteColors, size: number, background: boolean, margin = 0): string {
  const scale = Math.floor((size - 2 * margin) / grid.length);
  const offset = Math.floor((size - grid.length * scale) / 2);
  const bg = background ? `<rect width="${size}" height="${size}" fill="${colors.bg}"/>` : "";
  return svgDoc(size, size, bg + logoGroup(grid, colors, offset, offset, scale));
}

/** OGP 画像：真ん中にロゴ、その下に「dotwear」と説明の 1 行 */
export function ogSvg(grid: readonly string[], colors: SiteColors, tagline: string): string {
  const { width, height } = OG_SIZE;
  const scale = 10;
  const logoSize = grid.length * scale;
  const logoX = (width - logoSize) / 2;
  // 文字の大きさは 16 の整数倍（96px = 1 マス 6px、32px = 1 マス 2px）。基準線もマスの大きさの倍数に置く
  const text = (y: number, size: number, value: string) =>
    `<text x="${width / 2}" y="${y}" font-family="DotGothic16" font-size="${size}" text-anchor="middle" fill="${colors.fg}" text-rendering="optimizeSpeed">${value}</text>`;
  return svgDoc(
    width,
    height,
    `<rect width="${width}" height="${height}" fill="${colors.bg}"/>` +
      logoGroup(grid, colors, logoX, 96, scale) +
      text(456, 96, "dotwear") +
      text(528, 32, tagline),
  );
}

export async function emitSiteIcons({ logo, colors, fontFile, tagline, outDir }: EmitSiteIconsOptions): Promise<void> {
  const small = logo.sizes["16"];
  const large = logo.sizes["24"] ?? small;
  if (!small || !large) throw new Error(`${logo.name} に 16 のグリッドがありません`);
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(outDir, "favicon.svg"), `<!-- ${GENERATED_HEADER} -->\n${faviconSvg(small, colors)}\n`),
    // SVG の favicon に対応していないブラウザ向け。16 マスを 2 倍にした 32px（背景は透明）
    writeFile(path.join(outDir, "favicon-32.png"), toPng(centeredLogo(small, colors, 32, false))),
    // iOS は透明な部分を黒で塗るので、背景を付ける。角が丸く切り取られるので、右下のドットが欠けないよう余白をとる（24 マス × 6 倍 = 144px）
    writeFile(path.join(outDir, "apple-touch-icon.png"), toPng(centeredLogo(large, colors, TOUCH_ICON_SIZE, true, 18))),
    writeFile(path.join(outDir, "og.png"), toPng(ogSvg(large, colors, tagline), fontFile)),
  ]);
}

/** tokens/color.json から、サイトのアイコンに使う色を読む */
export async function loadSiteColors(root: string): Promise<SiteColors> {
  const json = JSON.parse(await readFile(path.join(root, "tokens", "color.json"), "utf8")) as {
    color?: Record<string, { $value?: unknown }>;
  };
  const get = (name: string) => {
    const value = json.color?.[name]?.$value;
    if (typeof value !== "string") throw new Error(`tokens/color.json に color.${name} がありません`);
    return value;
  };
  return { bg: get("bg"), fg: get("fg"), brand: get("brand") };
}
