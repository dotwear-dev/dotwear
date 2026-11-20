// カード（docs/components/card.md）。見た目だけの入れ物で、読み上げの単位は変えない（中の要素をそれぞれ読み上げる）。
// 見出しは中の Text を Semantics(header: true) で包む
//   DotwearCard(child: …)
//   DotwearCard(variant: DotwearCardVariant.flat, child: …)
import 'package:dotwear_icons/dotwear_icons.dart';
import 'package:flutter/widgets.dart';

import 'chrome.dart';
import 'chrome_geometry.dart';
import 'theme.dart';
import 'typography.dart';

enum DotwearCardVariant {
  /// 枠と影（既定）
  outlined,

  /// 枠のみ（カードの中にカードを置くときなど）
  flat,
}

class DotwearCard extends StatelessWidget {
  const DotwearCard({super.key, this.variant = DotwearCardVariant.outlined, this.child});

  final DotwearCardVariant variant;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final dw = Dotwear.of(context);
    final t = dw.theme;
    final c = dw.colors;
    final outlined = variant == DotwearCardVariant.outlined;
    final reserve = outlined ? dw.dots(1) : 0.0;
    return Padding(
      // 影の分の場所を右と下に空ける
      padding: EdgeInsets.only(right: reserve, bottom: reserve),
      child: DotwearChrome(
        style: DotwearChromeStyle(
          fill: c.background,
          border: c.border,
          borderWidth: t.borderWidth,
          steps: t.cornerStep,
          shadow: outlined ? c.border : null,
          innerGap: t.borderGap,
          innerWidth: t.borderInnerWidth,
        ),
        child: Padding(
          // 余白は二重線の枠の外側から 6 ドットのまま（カードの大きさを変えない。card.md）
          padding: EdgeInsets.all(dw.dots(6)),
          child: DefaultTextStyle.merge(
            style: dotwearBodyStyle(c.foreground),
            child: DotwearIconTheme(color: c.foreground, child: child ?? const SizedBox.shrink()),
          ),
        ),
      ),
    );
  }
}
