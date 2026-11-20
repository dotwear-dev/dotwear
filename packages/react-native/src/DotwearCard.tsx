// カード（docs/components/card.md）。見た目だけの入れ物で、読み上げの単位は変えない（中の要素をそれぞれ読み上げる）。
// 見出しは中の Text に accessibilityRole="header" を付ける
//   <DotwearCard>…</DotwearCard>
//   <DotwearCard variant="flat">…</DotwearCard>
import type { ViewProps } from "react-native";
import { DotwearIconProvider } from "@dotwear/react-native-icons";
import { ChromeBox } from "./ChromeBox.js";
import { useDotwear } from "./theme.js";

export type DotwearCardVariant = "outlined" | "flat";

export interface DotwearCardProps extends ViewProps {
  /** outlined は枠と影（既定）、flat は枠のみ（カードの中にカードを置くときなど） */
  variant?: DotwearCardVariant;
}

export function DotwearCard({ variant = "outlined", children, ...rest }: DotwearCardProps) {
  const { theme, colors: c, dots } = useDotwear();
  const outlined = variant === "outlined";
  return (
    <ChromeBox
      {...rest}
      reservesShadow={outlined}
      chrome={{
        fill: c.background,
        border: c.border,
        borderWidth: theme.borderWidth,
        steps: theme.cornerStep,
        shadow: outlined ? c.border : null,
        innerGap: theme.borderGap,
        innerWidth: theme.borderInnerWidth,
      }}
      // 余白は二重線の枠の外側から 6 ドットのまま（カードの大きさを変えない。card.md）
      bodyStyle={{ padding: dots(6) }}
    >
      <DotwearIconProvider color={c.foreground}>{children}</DotwearIconProvider>
    </ChromeBox>
  );
}
