// 入力欄（docs/components/text-field.md）。標準の <input> と <label> に見た目のクラスを付ける。
// エラーの説明文は aria-describedby で入力欄に関連づけ、aria-invalid でエラーであることを伝える
//   <DotwearTextField label="メール" value={email} onChange={setEmail} error={emailError} />
import { forwardRef, useId, type ChangeEvent, type InputHTMLAttributes } from "react";
import { cx } from "./classNames.js";

export interface DotwearTextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  /** 入力欄の名前。上に表示し、読み上げにも使う（必須） */
  label: string;
  value?: string;
  /** 入力された値を渡す（仕様の例 onChange={setEmail} のとおり）。イベントが必要なら 2 つ目の引数を使う */
  onChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  /** エラーの説明。undefined ならエラーなし。文言で伝える（色だけに頼らない。ADR-027） */
  error?: string;
  /** 一番外側の要素（ラベル・入力欄・説明文をまとめたもの）に付けるクラス */
  className?: string;
}

export const DotwearTextField = forwardRef<HTMLInputElement, DotwearTextFieldProps>(function DotwearTextField(
  { label, value, onChange, error, className, id, disabled, "aria-describedby": describedBy, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? `${autoId}-input`;
  const errorId = `${inputId}-error`;
  return (
    <div className={cx("dw-field", error && "dw-field--error", disabled && "dw-field--disabled", className)}>
      <label className="dw-field__label" htmlFor={inputId}>
        {label}
      </label>
      <span className="dw-chrome dw-field__box">
        <input
          ref={ref}
          id={inputId}
          className="dw-field__input"
          value={value}
          disabled={disabled}
          onChange={onChange ? (e) => onChange(e.target.value, e) : undefined}
          aria-invalid={error ? true : undefined}
          // 利用者が渡した説明文があれば、エラーの説明と一緒に読み上げる
          aria-describedby={cx(describedBy, error && errorId) || undefined}
          {...rest}
        />
      </span>
      {error ? (
        <p id={errorId} className="dw-field__error">
          {error}
        </p>
      ) : null}
    </div>
  );
});
