// カード（docs/components/card.md）。見た目だけの入れ物で、読み上げの単位は変えない（<div> のまま）。
// 見出しを入れるときは <h2> などを使い、見出しとして読み上げられるようにする
//   <DotwearCard>…</DotwearCard>
import { forwardRef, type HTMLAttributes } from "react";
import { cx } from "./classNames.js";

export type DotwearCardVariant = "outlined" | "flat";

export interface DotwearCardProps extends HTMLAttributes<HTMLDivElement> {
  /** outlined：枠と影（既定）。flat：枠のみ（カードの中にカードを置くときなど） */
  variant?: DotwearCardVariant;
}

export const DotwearCard = forwardRef<HTMLDivElement, DotwearCardProps>(function DotwearCard(
  { variant = "outlined", className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("dw-chrome", "dw-card", variant === "flat" && "dw-card--flat", className)} {...rest} />;
});
