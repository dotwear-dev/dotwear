// 部品のページの見本（@dotwear/web の React の部品を、そのままページに置く）。
// サイトは静的な HTML なので JavaScript では動かさない。トグルと入力欄は標準の要素なので、それでも操作できる
import { DotwearButton, DotwearCard, DotwearTextField, DotwearToggle, dwSave, dwTrash } from "@dotwear/web";

function Buttons() {
  return (
    <div className="demo-stack">
      <div className="demo-row">
        <DotwearButton>Save</DotwearButton>
        <DotwearButton variant="secondary">Cancel</DotwearButton>
        <DotwearButton variant="danger" icon={dwTrash}>
          Delete
        </DotwearButton>
        <DotwearButton variant="ghost">More</DotwearButton>
      </div>
      <div className="demo-row">
        <DotwearButton size="small" variant="secondary">
          Small
        </DotwearButton>
        <DotwearButton size="large" icon={dwSave}>
          Large
        </DotwearButton>
        <DotwearButton disabled>Disabled</DotwearButton>
        <DotwearButton loading>Saving</DotwearButton>
      </div>
    </div>
  );
}

function TextFields() {
  return (
    <div className="demo-stack demo-narrow">
      <DotwearTextField label="Name" placeholder="Your name" />
      <DotwearTextField label="Email" type="email" defaultValue="taro@" error="Enter a valid email address." />
      <DotwearTextField label="Disabled" defaultValue="Read only" disabled />
    </div>
  );
}

function Cards() {
  return (
    <div className="demo-row">
      <DotwearCard>
        Storage
        <br />
        12 GB of 50 GB used
      </DotwearCard>
      <DotwearCard variant="flat">Flat card</DotwearCard>
    </div>
  );
}

function Toggles() {
  return (
    <div className="demo-stack">
      <DotwearToggle defaultChecked>Wi-Fi</DotwearToggle>
      <DotwearToggle>Bluetooth</DotwearToggle>
      <DotwearToggle variant="checkbox" defaultChecked>
        I agree to the terms
      </DotwearToggle>
      <DotwearToggle variant="checkbox" disabled>
        Disabled
      </DotwearToggle>
    </div>
  );
}

const DEMOS: Record<string, () => React.JSX.Element> = {
  button: Buttons,
  "text-field": TextFields,
  card: Cards,
  toggle: Toggles,
};

export function ComponentDemo({ id }: { id: string }) {
  const Demo = DEMOS[id];
  return Demo ? <Demo /> : null;
}
