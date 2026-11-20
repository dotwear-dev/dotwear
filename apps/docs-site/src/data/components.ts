// コンポーネントのページの中身（利用者向け・英語）。
// 内部の仕様（docs/components/*.md、日本語）を正として、そこから利用者に必要な部分だけを英語で書き起こしたもの。
// 仕様を変えたら、ここも合わせて直す。コード例は src/lib/snippets.ts でコンパイル済みのソースから取り出す
export interface ComponentDoc {
  id: string;
  title: string;
  summary: string;
  variants: { name: string; use: string }[];
  states: { name: string; look: string }[];
  /** React の API（props） */
  webApi: { api: string; description: string }[];
  /** iOS の API（見出しの下に表で出す） */
  swiftApi: { api: string; description: string }[];
  /** コード例の名前（上から順に出す）。Web（src/snippets/components.tsx）と Swift（Snippets.swift）で同じ名前にする */
  snippets: { title: string; name: string }[];
  accessibility: string[];
}

export const COMPONENTS: ComponentDoc[] = [
  {
    id: "button",
    title: "Button",
    summary: "Runs an action when pressed. Stepped corners, a one-dot shadow, and a one-dot press-down.",
    variants: [
      { name: "primary", use: "The most important action on the screen (default)" },
      { name: "secondary", use: "Any other action" },
      { name: "danger", use: "Destructive actions such as delete" },
      { name: "ghost", use: "Border only — for toolbars" },
    ],
    states: [
      { name: "default", look: "One-dot shadow below and to the right" },
      { name: "pressed", look: "Shadow removed, body shifts down by one dot" },
      { name: "focused", look: "One-dot focus ring outside the border" },
      { name: "disabled", look: "Disabled colors, no shadow" },
      { name: "loading", look: "Three animated dots replace the label" },
    ],
    webApi: [
      { api: 'variant="primary"', description: '"primary" (default), "secondary", "danger", "ghost"' },
      { api: 'size="medium"', description: '"small", "medium" (default), "large"' },
      { api: "icon={dwSave}", description: "An icon before the label (decorative). Icon-only buttons need aria-label" },
      { api: "loading", description: "Shows the loading dots and sets aria-busy. Does not disable the button; add disabled if needed" },
      { api: "…button props", description: 'Any <button> attribute. type defaults to "button"' },
    ],
    swiftApi: [
      { api: ".buttonStyle(.dotwear)", description: "Primary, medium" },
      { api: ".buttonStyle(.dotwear(_ variant:, size:))", description: "variant: .primary .secondary .danger .ghost — size: .small .medium .large" },
      { api: ".dotwearLoading(_ isLoading: Bool = true)", description: "Shows the loading dots. Does not disable the button; add .disabled if needed" },
    ],
    snippets: [
      { title: "Variants and sizes", name: "button" },
      { title: "Loading", name: "button-loading" },
    ],
    accessibility: [
      "Web: it is a standard <button>, so keyboard, focus, screen readers and form submission work as usual. The focus ring appears for keyboard focus (:focus-visible).",
      "iOS: it is a standard Button, so VoiceOver, Dynamic Type, Full Keyboard Access and Voice Control work as usual.",
      "Icon-only buttons must have an accessibility label.",
    ],
  },
  {
    id: "text-field",
    title: "TextField",
    summary: "Single-line text input. Text entry, IME composition, selection and the cursor are the platform's own — only the look changes.",
    variants: [
      { name: "default", use: "Normal input" },
      { name: "error", use: "Invalid input: danger-colored border and a message below" },
    ],
    states: [
      { name: "default", look: "Border color border, background bg" },
      { name: "focused", look: "One-dot focus ring outside the border (the border width does not change, so text never moves)" },
      { name: "error", look: "Danger-colored border and message" },
      { name: "disabled", look: "Disabled color for border and text" },
    ],
    webApi: [
      { api: "label", description: "Required. Shown above the field and used as its accessible name" },
      { api: "value / onChange(value, event)", description: "onChange receives the new string first, so onChange={setEmail} works" },
      { api: "error", description: "Error message below the field (aria-invalid and aria-describedby are set). undefined hides it" },
      { api: "…input props", description: "Any <input> attribute (type, placeholder, disabled, autoComplete, …)" },
    ],
    swiftApi: [
      { api: ".textFieldStyle(.dotwear)", description: "Applies the Dotwear look to a TextField or SecureField" },
      { api: ".dotwearFieldError(_ message: String?)", description: "Shows an error message below the field. nil hides it" },
    ],
    snippets: [{ title: "Usage", name: "text-field" }],
    accessibility: [
      "Web: the label is a <label for>, and the error is linked with aria-describedby and aria-invalid.",
      "iOS: VoiceOver reads the error message as the field's hint, so it is announced together with the field.",
      "The whole 44 pt row is tappable, not just the visible border.",
      "Placeholders are not labels: keep a visible label when the field needs one.",
    ],
  },
  {
    id: "card",
    title: "Card",
    summary: "A box that groups related content. It is purely visual and does not change how content is read.",
    variants: [
      { name: "outlined", use: "Border and shadow (default)" },
      { name: "flat", use: "Border only — e.g. a card inside a card" },
    ],
    states: [{ name: "—", look: "A card has no states. To make it tappable, put a standard button or link inside it" }],
    webApi: [
      { api: 'variant="outlined"', description: '"outlined" (default), "flat"' },
      { api: "…div props", description: "Any <div> attribute" },
    ],
    swiftApi: [{ api: ".dotwearCard(_ variant: = .outlined)", description: "variant: .outlined .flat" }],
    snippets: [{ title: "Usage", name: "card" }],
    accessibility: [
      "The card does not group or rename its content; screen readers read the children as they are.",
      "Web: use a real heading (<h2> etc.) for the card title.",
    ],
  },
  {
    id: "toggle",
    title: "Toggle",
    summary: "Switches something on or off. Two looks: switch and checkbox. Both are a standard toggle underneath.",
    variants: [
      { name: "switch", use: "Settings that apply immediately (default)" },
      { name: "checkbox", use: "Forms that are submitted together, or multiple selection" },
    ],
    states: [
      { name: "off", look: "Background bg, one-dot shadow" },
      { name: "on", look: "Background primary (switch knob on the right / check mark)" },
      { name: "pressed", look: "Shadow removed, body shifts down by one dot" },
      { name: "focused", look: "One-dot focus ring" },
      { name: "disabled", look: "Disabled colors" },
    ],
    webApi: [
      { api: 'variant="switch"', description: '"switch" (default, role="switch") or "checkbox"' },
      { api: "checked / onChange(checked, event)", description: "onChange receives the new boolean first, so onChange={setWifi} works" },
      { api: "children", description: "The label. Clicking it toggles too. Without a visible label, pass aria-label" },
      { api: "…input props", description: "Any checkbox <input> attribute (name, value, disabled, defaultChecked, …)" },
    ],
    swiftApi: [
      { api: ".toggleStyle(.dotwear)", description: "Switch" },
      { api: ".toggleStyle(.dotwear(.checkbox))", description: "Checkbox" },
    ],
    snippets: [{ title: "Usage", name: "toggle" }],
    accessibility: [
      "Web: a standard checkbox <input> (role=\"switch\" for the switch) wrapped in a <label>, so Space toggles it and clicking the label works.",
      "iOS: VoiceOver announces it exactly like a standard Toggle (\"Switch, on\"), for both looks.",
    ],
  },
];
