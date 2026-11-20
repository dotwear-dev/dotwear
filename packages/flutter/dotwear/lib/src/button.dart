// ボタン（docs/components/button.md）。標準の TextButton に ButtonStyle を被せる（ADR-003・ADR-033）。
// 読み上げ（「ボタン」）・キーボード操作・フォーカス・タップ領域（Material の 48 × 48）は標準のまま。
//   DotwearButton(onPressed: save, icon: DotwearIcons.save, child: const Text('Save'))
// 見た目だけを標準のボタンに当てることもできる。そのときは clipBehavior: Clip.none も渡す（下の DotwearButtonStyle を参照）：
//   FilledButton(style: DotwearButtonStyle.of(context, variant: DotwearButtonVariant.secondary), clipBehavior: Clip.none, …)
import 'dart:async';

import 'package:dotwear_icons/dotwear_icons.dart';
import 'package:material_ui/material_ui.dart';

import 'chrome.dart';
import 'chrome_geometry.dart';
import 'theme.dart';
import 'typography.dart';

enum DotwearButtonVariant { primary, secondary, danger, ghost }

enum DotwearButtonSize {
  // 寸法（ドット数。button.md の表）。large だけ枠線と角の段を 2 倍にする
  small(height: 12, paddingX: 4, borderScale: 1, gap: 2),
  medium(height: 16, paddingX: 6, borderScale: 1, gap: 3),
  large(height: 20, paddingX: 8, borderScale: 2, gap: 4);

  const DotwearButtonSize({required this.height, required this.paddingX, required this.borderScale, required this.gap});

  final int height;
  final int paddingX;
  final int borderScale;
  final int gap;
}

/// Dotwear のボタンの見た目（ButtonStyle）。どの標準のボタン（TextButton・FilledButton・ElevatedButton など）にも当てられる。
///
/// ボタンには `clipBehavior: Clip.none` も渡すこと。標準のボタンは backgroundBuilder があると既定で
/// アンチエイリアスの切り抜き（Clip.antiAlias）をかけるので、端数の位置で枠の端がにじみ、外にはみ出す影とフォーカスリングも消える
abstract final class DotwearButtonStyle {
  static ButtonStyle of(
    BuildContext context, {
    DotwearButtonVariant variant = DotwearButtonVariant.primary,
    DotwearButtonSize size = DotwearButtonSize.medium,
  }) {
    final dw = Dotwear.of(context);
    final c = dw.colors;
    Color foreground(Set<WidgetState> states) {
      if (states.contains(WidgetState.disabled)) return c.disabled;
      return switch (variant) {
        DotwearButtonVariant.primary || DotwearButtonVariant.danger => c.onPrimary,
        DotwearButtonVariant.secondary || DotwearButtonVariant.ghost => c.foreground,
      };
    }

    return ButtonStyle(
      // 地・影・押したときの見た目はすべて外装（backgroundBuilder）で描く。Material の塗り・影・波紋は使わない
      backgroundColor: const WidgetStatePropertyAll(Colors.transparent),
      overlayColor: const WidgetStatePropertyAll(Colors.transparent),
      shadowColor: const WidgetStatePropertyAll(Colors.transparent),
      surfaceTintColor: const WidgetStatePropertyAll(Colors.transparent),
      elevation: const WidgetStatePropertyAll(0),
      splashFactory: NoSplash.splashFactory,
      shape: const WidgetStatePropertyAll(RoundedRectangleBorder()),
      side: const WidgetStatePropertyAll(BorderSide.none),
      padding: const WidgetStatePropertyAll(EdgeInsets.zero),
      // 見た目の大きさは寸法の表どおり。タップ領域は tapTargetSize（48 × 48）で別に確保する
      minimumSize: const WidgetStatePropertyAll(Size.zero),
      tapTargetSize: MaterialTapTargetSize.padded,
      visualDensity: VisualDensity.standard,
      foregroundColor: WidgetStateProperty.resolveWith(foreground),
      iconColor: WidgetStateProperty.resolveWith(foreground),
      textStyle: WidgetStateProperty.resolveWith((states) => dotwearLabelStyle(foreground(states))),
      backgroundBuilder: (context, states, child) => _ButtonChrome(variant: variant, size: size, states: states, child: child),
    );
  }
}

class _ButtonChrome extends StatelessWidget {
  const _ButtonChrome({required this.variant, required this.size, required this.states, required this.child});

  final DotwearButtonVariant variant;
  final DotwearButtonSize size;
  final Set<WidgetState> states;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final dw = Dotwear.of(context);
    final t = dw.theme;
    final c = dw.colors;
    final enabled = !states.contains(WidgetState.disabled);
    final ghost = variant == DotwearButtonVariant.ghost;
    final Color? fill = !enabled
        ? (ghost ? null : c.background)
        : switch (variant) {
            DotwearButtonVariant.primary => c.primary,
            DotwearButtonVariant.secondary => c.background,
            DotwearButtonVariant.danger => c.danger,
            DotwearButtonVariant.ghost => null,
          };
    final outerWidth = t.borderWidth * size.borderScale;
    // 黒く塗ったボタン（primary・danger）では、内の線を文字と同じ色にして地の上で見えるようにする（button.md）
    final innerColor = enabled && (variant == DotwearButtonVariant.primary || variant == DotwearButtonVariant.danger) ? c.onPrimary : null;
    final reserve = ghost ? 0.0 : dw.dots(1);
    return Padding(
      // 影の分の場所を右と下に空ける（押したときに周りの配置が動かないように）
      padding: EdgeInsets.only(right: reserve, bottom: reserve),
      child: DotwearChrome(
        style: DotwearChromeStyle(
          fill: fill,
          border: enabled ? c.border : c.disabled,
          borderWidth: outerWidth,
          steps: t.cornerStep * size.borderScale,
          shadow: enabled && !ghost ? c.border : null,
          pressed: enabled && states.contains(WidgetState.pressed),
          focusRing: states.contains(WidgetState.focused) ? c.focus : null,
          innerGap: t.borderGap,
          innerWidth: t.borderInnerWidth,
          innerColor: innerColor,
        ),
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: dw.dots(size.height)),
          child: Padding(
            // 上下は二重線の枠の厚さだけ空け、文字が内の線に重ならないようにする（そのため small は少し高くなる）
            padding: EdgeInsets.symmetric(horizontal: dw.dots(size.paddingX), vertical: dw.dots(t.frameInset(outerWidth))),
            child: Center(widthFactor: 1, heightFactor: 1, child: child),
          ),
        ),
      ),
    );
  }
}

/// Dotwear のボタン。中身は標準の TextButton
class DotwearButton extends StatelessWidget {
  const DotwearButton({
    super.key,
    required this.onPressed,
    this.variant = DotwearButtonVariant.primary,
    this.size = DotwearButtonSize.medium,
    this.icon,
    this.loading = false,
    this.focusNode,
    this.autofocus = false,
    this.semanticLabel,
    this.child,
  });

  /// null なら押せない（disabled）。Flutter の標準のボタンと同じ
  final VoidCallback? onPressed;
  final DotwearButtonVariant variant;
  final DotwearButtonSize size;

  /// ラベルの前に置くアイコン（装飾）。アイコンだけのボタンには semanticLabel を必ず付ける
  final DotwearIconDefinition? icon;

  /// 読み込み中の表示（文字の代わりに 3 つのドット）。押せないようにはしないので、必要なら onPressed を null にする
  final bool loading;
  final FocusNode? focusNode;
  final bool autofocus;

  /// 読み上げる名前。アイコンだけのボタンで使う
  final String? semanticLabel;

  /// ラベル。ふつうは Text
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final dw = Dotwear.of(context);
    final icon = this.icon;
    final child = this.child;
    Widget content = Row(
      mainAxisSize: MainAxisSize.min,
      spacing: dw.dots(size.gap),
      children: [
        if (icon != null) DotwearIcon(icon),
        ?child,
      ],
    );
    if (loading) {
      // 読み込み中は中身を見えなくして 3 つのドットを重ねる。幅を変えないように中身は残し、読み上げも残す
      content = Stack(
        alignment: Alignment.center,
        children: [
          Opacity(opacity: 0, alwaysIncludeSemantics: true, child: content),
          const ExcludeSemantics(child: _LoadingDots()),
        ],
      );
    }
    final label = semanticLabel;
    if (label != null) content = Semantics(label: label, child: ExcludeSemantics(child: content));
    return TextButton(
      onPressed: onPressed,
      // 切り抜かない。既定の Clip.antiAlias は枠の端をにじませ、影とフォーカスリングを消す（DotwearButtonStyle を参照）
      clipBehavior: Clip.none,
      focusNode: focusNode,
      autofocus: autofocus,
      style: DotwearButtonStyle.of(context, variant: variant, size: size),
      child: content,
    );
  }
}

/// 読み込み中の 3 つのドット。1 つずつ順に濃くする（なめらかに動かさず、コマ送りにする）
class _LoadingDots extends StatefulWidget {
  const _LoadingDots();

  @override
  State<_LoadingDots> createState() => _LoadingDotsState();
}

class _LoadingDotsState extends State<_LoadingDots> {
  int _step = 0;
  late final Timer _timer = Timer.periodic(const Duration(milliseconds: 250), (_) => setState(() => _step = (_step + 1) % 3));

  @override
  void initState() {
    super.initState();
    _timer; // late の Timer をここで始める
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dw = Dotwear.of(context);
    final color = IconTheme.of(context).color ?? dw.colors.foreground;
    // ドットは外装と同じ仕組みで、実際のピクセルの境界に合わせて描く（ふつうの箱を並べると端数の位置でにじむ）
    return SizedBox(
      key: const ValueKey('dotwear-loading'),
      width: dw.dots(10),
      height: dw.dots(2),
      child: DotwearChrome(
        style: DotwearChromeStyle(fill: null, border: color, borderWidth: 0, steps: 0),
        marks: [
          for (var i = 0; i < 3; i++) DotwearChromeMark(i * 4, 0, 2, 2, color.withValues(alpha: i == _step ? 1 : 0.4)),
        ],
      ),
    );
  }
}
