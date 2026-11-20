// トグル（docs/components/toggle.md）。中身は標準の <input type="checkbox">（スイッチは role="switch"）で、
// 見た目の部品（dw-toggle__control）を横に置いて、全体を <label> で包む。
// ラベルの文字を押しても切り替わり、Space キーでも切り替わる。フォームの送信（name・value）も標準のまま
//   <DotwearToggle checked={wifi} onChange={setWifi}>Wi-Fi</DotwearToggle>
//   <DotwearToggle variant="checkbox" checked={agree} onChange={setAgree}>同意する</DotwearToggle>
import { forwardRef, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "./classNames.js";

export type DotwearToggleVariant = "switch" | "checkbox";

export interface DotwearToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "children"> {
  /** switch：押した瞬間に反映される設定など（既定）。checkbox：まとめて送信するフォームなど */
  variant?: DotwearToggleVariant;
  /** オン・オフを渡す（仕様の例 onChange={setWifi} のとおり）。イベントが必要なら 2 つ目の引数を使う */
  onChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
  /** ラベル。見た目に出さないときは aria-label を渡す */
  children?: ReactNode;
  /** 一番外側の <label> に付けるクラス */
  className?: string;
}

export const DotwearToggle = forwardRef<HTMLInputElement, DotwearToggleProps>(function DotwearToggle(
  { variant = "switch", onChange, children, className, disabled, ...rest },
  ref,
) {
  return (
    <label className={cx("dw-toggle", `dw-toggle--${variant}`, disabled && "dw-toggle--disabled", className)}>
      <input
        ref={ref}
        type="checkbox"
        role={variant === "switch" ? "switch" : undefined}
        className="dw-toggle__input"
        disabled={disabled}
        onChange={onChange ? (e) => onChange(e.target.checked, e) : undefined}
        {...rest}
      />
      {/* CSS の「入力欄の直後」の指定で状態を見るので、入力欄のすぐ後ろに置く */}
      <span className="dw-chrome dw-toggle__control" aria-hidden="true" />
      {children != null ? <span className="dw-toggle__label">{children}</span> : null}
    </label>
  );
});
