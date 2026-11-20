// 画面に共通の部品（本文・見出し・画面の枠と戻るボタン）。文字は DotGothic16 を 16 の整数倍の大きさで使う（ADR-026）
import 'package:dotwear/dotwear.dart';
import 'package:material_ui/material_ui.dart';

/// 本文の文字
class Body extends StatelessWidget {
  const Body(this.text, {super.key, this.textAlign});

  final String text;
  final TextAlign? textAlign;

  @override
  Widget build(BuildContext context) => Text(text, textAlign: textAlign, style: dotwearBodyStyle(Dotwear.of(context).colors.foreground));
}

/// 見出し。読み上げでも見出しとして伝える
class Heading extends StatelessWidget {
  const Heading(this.text, {super.key, this.size = 32});

  final String text;

  /// 16 か 32（16 の整数倍でないと文字がにじむ）
  final int size;

  @override
  Widget build(BuildContext context) => Semantics(
        header: true,
        child: Text(text, style: dotwearBodyStyle(Dotwear.of(context).colors.foreground).copyWith(fontSize: size.toDouble())),
      );
}

/// 画面の枠：上の見出しの帯と、スクロールする中身
class DemoScreen extends StatelessWidget {
  const DemoScreen({super.key, required this.title, this.canGoBack = false, this.action, required this.children});

  final String title;

  /// 左上に戻るボタンを出す
  final bool canGoBack;

  /// 右上に置くもの（設定ボタンなど）
  final Widget? action;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final dw = Dotwear.of(context);
    final action = this.action;
    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 56),
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: dw.dots(4)),
                child: Row(
                  spacing: dw.dots(2),
                  children: [
                    if (canGoBack)
                      DotwearButton(
                        variant: DotwearButtonVariant.ghost,
                        size: DotwearButtonSize.small,
                        icon: DotwearIcons.arrowLeft,
                        semanticLabel: '戻る',
                        onPressed: () => Navigator.of(context).maybePop(),
                      ),
                    Expanded(child: Heading(title, size: 16)),
                    ?action,
                  ],
                ),
              ),
            ),
            Expanded(
              child: ListView(
                padding: EdgeInsets.all(dw.dots(8)),
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                children: [
                  for (final (i, child) in children.indexed) ...[if (i > 0) SizedBox(height: dw.dots(6)), child],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
