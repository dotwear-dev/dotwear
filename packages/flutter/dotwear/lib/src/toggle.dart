// スイッチとチェックボックス（docs/components/toggle.md）。標準の Switch は見た目をほとんど変えられないので、
// Semantics の toggled（チェックボックスは checked）と、標準のフォーカス・キー操作（FocusableActionDetector）・タップで作る（ADR-033）。
// VoiceOver・TalkBack は「スイッチ、オン」のように標準と同じに読み上げる。
// ラベル（child）を渡すと、ラベルを含めた行全体が 1 つのトグルになる（押す場所も読み上げも 1 つ）
//   DotwearToggle(value: wifi, onChanged: (v) => setState(() => wifi = v), child: const Text('Wi-Fi'))
import 'package:material_ui/material_ui.dart';

import 'chrome.dart';
import 'chrome_geometry.dart';
import 'theme.dart';
import 'typography.dart';

enum DotwearToggleVariant { switch_, checkbox }

/// チェックの形（toggle.md。枠の内側 6 × 6 ドット）
const dotwearCheckMark = ['......', '.....#', '....##', '#..##.', '####..', '.##...'];

class DotwearToggle extends StatefulWidget {
  const DotwearToggle({
    super.key,
    required this.value,
    required this.onChanged,
    this.variant = DotwearToggleVariant.switch_,
    this.focusNode,
    this.autofocus = false,
    this.semanticLabel,
    this.child,
  });

  final bool value;

  /// 新しい値を受け取る。null なら押せない（標準の Switch・Checkbox と同じ）
  final ValueChanged<bool>? onChanged;
  final DotwearToggleVariant variant;
  final FocusNode? focusNode;
  final bool autofocus;

  /// 読み上げる名前。見えるラベル（child）がないときに付ける
  final String? semanticLabel;

  /// ラベル。ふつうは Text
  final Widget? child;

  @override
  State<DotwearToggle> createState() => _DotwearToggleState();
}

class _DotwearToggleState extends State<DotwearToggle> {
  bool _pressed = false;
  bool _focused = false;

  bool get _enabled => widget.onChanged != null;

  void _toggle() => widget.onChanged?.call(!widget.value);

  @override
  Widget build(BuildContext context) {
    final dw = Dotwear.of(context);
    final c = dw.colors;
    final isSwitch = widget.variant == DotwearToggleVariant.switch_;
    final control = _ToggleControl(
      variant: widget.variant,
      checked: widget.value,
      enabled: _enabled,
      pressed: _pressed && _enabled,
      focused: _focused,
    );
    final child = widget.child;
    final label = child == null
        ? null
        : Expanded(
            child: DefaultTextStyle.merge(style: dotwearLabelStyle(_enabled ? c.foreground : c.disabled), child: child),
          );
    return MergeSemantics(
      child: Semantics(
        // 役割と状態。読み上げは「スイッチ、オン」「チェックボックス、チェックあり」になる
        toggled: isSwitch ? widget.value : null,
        checked: isSwitch ? null : widget.value,
        enabled: _enabled,
        label: widget.semanticLabel,
        child: FocusableActionDetector(
          enabled: _enabled,
          focusNode: widget.focusNode,
          autofocus: widget.autofocus,
          mouseCursor: _enabled ? SystemMouseCursors.click : SystemMouseCursors.basic,
          // Space・Enter で切り替える（標準の Switch と同じ）
          actions: {ActivateIntent: CallbackAction<ActivateIntent>(onInvoke: (_) => _toggle())},
          onShowFocusHighlight: (v) => setState(() => _focused = v),
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: _enabled ? _toggle : null,
            onTapDown: _enabled ? (_) => setState(() => _pressed = true) : null,
            onTapUp: _enabled ? (_) => setState(() => _pressed = false) : null,
            onTapCancel: _enabled ? () => setState(() => _pressed = false) : null,
            child: ConstrainedBox(
              // タップ領域はラベルを含めて最低 48（Material）
              constraints: const BoxConstraints(minHeight: kMinInteractiveDimension, minWidth: kMinInteractiveDimension),
              child: Row(
                mainAxisSize: label == null ? MainAxisSize.min : MainAxisSize.max,
                mainAxisAlignment: label == null ? MainAxisAlignment.center : MainAxisAlignment.start,
                spacing: dw.dots(4),
                // iOS の設定画面と同じく、スイッチはラベルが左で本体が右。チェックボックスは本体が左
                children: isSwitch
                    ? [?label, control]
                    : [control, ?label],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// スイッチ・チェックボックスの本体（文字を含まないので、すべてドットの格子に乗る）
class _ToggleControl extends StatelessWidget {
  const _ToggleControl({required this.variant, required this.checked, required this.enabled, required this.pressed, required this.focused});

  final DotwearToggleVariant variant;
  final bool checked;
  final bool enabled;
  final bool pressed;
  final bool focused;

  @override
  Widget build(BuildContext context) {
    final dw = Dotwear.of(context);
    final t = dw.theme;
    final c = dw.colors;
    final (w, h) = variant == DotwearToggleVariant.switch_ ? (14, 8) : (8, 8);
    final fill = checked ? (enabled ? c.primary : c.disabled) : c.background;
    final mark = enabled ? (checked ? c.onPrimary : c.border) : (checked ? c.background : c.disabled);
    final marks = <DotwearChromeMark>[];
    if (variant == DotwearToggleVariant.switch_) {
      // つまみは枠の内側いっぱいの 6 × 6。オフは左で線だけの四角、オンは右で塗りつぶし。
      // 4 階調では primary と border、onPrimary と background が同じ色なので、オフも塗りつぶすとオンと同じ絵になる（ADR-029）
      final x = checked ? 7 : 1;
      marks.add(DotwearChromeMark(x, 1, 6, 6, mark));
      if (!checked) marks.add(DotwearChromeMark(x + 1, 2, 4, 4, fill));
    } else if (checked) {
      for (final (y, row) in dotwearCheckMark.indexed) {
        for (var x = 0; x < row.length; x++) {
          if (row[x] == '#') marks.add(DotwearChromeMark(x + 1, y + 1, 1, 1, mark));
        }
      }
    }
    return ExcludeSemantics(
      child: Padding(
        key: const ValueKey('dotwear-toggle-control'),
        // 影の分の場所を右と下に空ける（押したときに周りの配置が動かないように）
        padding: EdgeInsets.only(right: dw.dots(1), bottom: dw.dots(1)),
        child: SizedBox(
          width: dw.dots(w),
          height: dw.dots(h),
          child: DotwearChrome(
            style: DotwearChromeStyle(
              fill: fill,
              border: enabled ? c.border : c.disabled,
              borderWidth: t.borderWidth,
              steps: t.cornerStep,
              shadow: enabled ? c.border : null,
              pressed: pressed,
              focusRing: focused ? c.focus : null,
            ),
            marks: marks,
          ),
        ),
      ),
    );
  }
}
