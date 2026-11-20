// ドキュメントに載せる Web のコード例（部品）。取り出し方は src/lib/snippets.ts。
// 名前は Swift のコード例（Snippets.swift）とそろえ、同じタブの組で並べる
import { useState } from "react";
import { DotwearButton, DotwearCard, DotwearTextField, DotwearToggle, dwSave, dwTrash } from "@dotwear/web";

declare function save(): void;
declare function cancel(): void;
declare function remove(): void;

export function Buttons() {
  return (
    <>
      {/* snippet:button */}
      <DotwearButton onClick={save}>Save</DotwearButton>

      <DotwearButton variant="secondary" size="small" onClick={cancel}>
        Cancel
      </DotwearButton>

      <DotwearButton variant="danger" icon={dwTrash} onClick={remove}>
        Delete
      </DotwearButton>
      {/* end-snippet */}
    </>
  );
}

export function Loading({ isSaving }: { isSaving: boolean }) {
  return (
    // snippet:button-loading
    <DotwearButton icon={dwSave} loading={isSaving} disabled={isSaving} onClick={save}>
      Save
    </DotwearButton>
    // end-snippet
  );
}

export function TextField({ emailError }: { emailError?: string }) {
  // snippet:text-field
  const [email, setEmail] = useState("");
  return (
    <DotwearTextField
      label="Email"
      type="email"
      value={email}
      onChange={setEmail}
      error={emailError} // undefined hides the message
    />
  );
  // end-snippet
}

export function Toggles() {
  // snippet:toggle
  const [wifi, setWifi] = useState(true);
  const [agree, setAgree] = useState(false);
  return (
    <>
      <DotwearToggle checked={wifi} onChange={setWifi}>
        Wi-Fi
      </DotwearToggle>

      <DotwearToggle variant="checkbox" checked={agree} onChange={setAgree}>
        I agree to the terms
      </DotwearToggle>
    </>
  );
  // end-snippet
}

export function Cards() {
  return (
    <>
      {/* snippet:card */}
      <DotwearCard>
        <h2>Storage</h2>
        <p>12 GB of 50 GB used</p>
      </DotwearCard>

      <DotwearCard variant="flat">Nested</DotwearCard>
      {/* end-snippet */}
    </>
  );
}
