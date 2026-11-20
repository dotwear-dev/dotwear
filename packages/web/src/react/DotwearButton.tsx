// ボタン（docs/components/button.md）。標準の <button> に見た目のクラスを付けるだけなので、
// キーボード操作・フォーカス・読み上げ・フォームの送信は標準のまま効く。見た目は components.css
//   <DotwearButton variant="primary" icon={dwSave}>保存</DotwearButton>
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { DotwearIcon } from "@dotwear/icons/react";
import type { DotwearIconDefinition } from "@dotwear/icons";
import { cx } from "./classNames.js";

export type DotwearButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type DotwearButtonSize = "small" | "medium" | "large";

export interface DotwearButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: DotwearButtonVariant;
  size?: DotwearButtonSize;
  /** ラベルの前に出すアイコン。アイコンだけのボタンにするときは aria-label を必ず付ける */
  icon?: DotwearIconDefinition;
  /**
   * 読み込み中の表示（文字の代わりに 3 つのドット）。aria-busy を付けて読み上げにも伝える。
   * 押せないようにはしないので、必要なら disabled も付ける
   */
  loading?: boolean;
  children?: ReactNode;
}

export const DotwearButton = forwardRef<HTMLButtonElement, DotwearButtonProps>(function DotwearButton(
  { variant = "primary", size = "medium", icon, loading = false, className, type = "button", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      // フォームの中で勝手に送信しないように、既定は type="button"（送信するボタンは type="submit" を渡す）
      type={type}
      className={cx(
        "dw-chrome",
        size === "large" && "dw-chrome--thick",
        "dw-button",
        `dw-button--${variant}`,
        `dw-button--${size}`,
        className,
      )}
      aria-busy={loading || undefined}
      {...rest}
    >
      <span className="dw-button__content">
        {icon ? <DotwearIcon icon={icon} /> : null}
        {children}
      </span>
      {loading ? (
        <span className="dw-button__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      ) : null}
    </button>
  );
});
