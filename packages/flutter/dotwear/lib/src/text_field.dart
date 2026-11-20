// 入力欄（docs/components/text-field.md）。標準の TextField に外装を被せる（ADR-003・ADR-033）。
// 文字の入力・変換（IME）・選択・カーソル操作・読み上げは標準の TextField のまま。
// 名前（label）は上に出し、読み上げでは入力欄の名前にする。エラーは下に出し、入力欄のヒントとして読み上げる
//   DotwearTextField(label: 'Email', controller: email, error: emailError)
// 外装だけを自分の TextField に当てるときは DotwearFieldFrame と DotwearFieldFrame.decoration を使う
import 'package:material_ui/material_ui.dart';
import 'package:flutter/services.dart';

import 'chrome.dart';
import 'chrome_geometry.dart';
import 'theme.dart';
import 'typography.dart';

/// 入力欄の外装。中に標準の TextField（decoration: DotwearFieldFrame.decoration(context)）を置く
class DotwearFieldFrame extends StatelessWidget {
  const DotwearFieldFrame({super.key, this.focused = false, this.error = false, this.enabled = true, required this.child});

  /// 入力中。フォーカスリングを出す（枠の太さは変えない。文字の位置がずれないように）
  final bool focused;

  /// エラー。枠を danger の色にする
  final bool error;
  final bool enabled;
  final Widget child;

  /// 外装の中に置く TextField の InputDecoration。標準の枠と余白を消す（枠と余白は外装の側で取る）
  static InputDecoration decoration(BuildContext context, {String? hintText}) {
    final c = Dotwear.of(context).colors;
    return InputDecoration(
      border: InputBorder.none,
      enabledBorder: InputBorder.none,
      focusedBorder: InputBorder.none,
      disabledBorder: InputBorder.none,
      errorBorder: InputBorder.none,
      isCollapsed: true,
      contentPadding: EdgeInsets.zero,
      hintText: hintText,
      hintStyle: dotwearBodyStyle(c.disabled),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dw = Dotwear.of(context);
    final t = dw.theme;
    final c = dw.colors;
    final inset = t.frameInset();
    return ConstrainedBox(
      // タップ領域は最低 48（Material）。見た目の枠は 16 ドット
      constraints: const BoxConstraints(minHeight: kMinInteractiveDimension),
      child: Center(
        heightFactor: 1,
        child: DotwearChrome(
          style: DotwearChromeStyle(
            fill: c.background,
            border: error ? c.danger : (enabled ? c.border : c.disabled),
            borderWidth: t.borderWidth,
            steps: t.cornerStep,
            focusRing: focused ? c.focus : null,
            innerGap: t.borderGap,
            innerWidth: t.borderInnerWidth,
          ),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: dw.dots(16), minWidth: double.infinity),
            child: Padding(
              // 文字は内の線から 4 ドット離す（text-field.md）。上下も二重線の枠の厚さだけ空ける
              padding: EdgeInsets.symmetric(horizontal: dw.dots(inset + 4), vertical: dw.dots(inset)),
              child: Align(alignment: Alignment.centerLeft, widthFactor: 1, heightFactor: 1, child: child),
            ),
          ),
        ),
      ),
    );
  }
}

class DotwearTextField extends StatefulWidget {
  const DotwearTextField({
    super.key,
    required this.label,
    this.controller,
    this.focusNode,
    this.error,
    this.enabled = true,
    this.placeholder,
    this.keyboardType,
    this.textInputAction,
    this.obscureText = false,
    this.autofillHints,
    this.autofocus = false,
    this.inputFormatters,
    this.onChanged,
    this.onSubmitted,
  });

  /// 入力欄の名前。見た目には上に出し、VoiceOver・TalkBack でも入力欄の名前として読み上げる
  final String label;
  final TextEditingController? controller;
  final FocusNode? focusNode;

  /// エラーの説明。null か空ならエラーなし。枠を danger の色にし、下に説明を出す
  final String? error;
  final bool enabled;

  /// 入力のヒント（入力前に薄く出す）。名前の代わりにはならない
  final String? placeholder;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final bool obscureText;
  final Iterable<String>? autofillHints;
  final bool autofocus;
  final List<TextInputFormatter>? inputFormatters;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;

  @override
  State<DotwearTextField> createState() => _DotwearTextFieldState();
}

class _DotwearTextFieldState extends State<DotwearTextField> {
  FocusNode? _ownFocusNode;
  FocusNode get _focusNode => widget.focusNode ?? (_ownFocusNode ??= FocusNode());

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void didUpdateWidget(DotwearTextField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.focusNode != widget.focusNode) {
      (oldWidget.focusNode ?? _ownFocusNode)?.removeListener(_onFocusChange);
      _focusNode.addListener(_onFocusChange);
    }
  }

  @override
  void dispose() {
    _focusNode.removeListener(_onFocusChange);
    _ownFocusNode?.dispose();
    super.dispose();
  }

  void _onFocusChange() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final dw = Dotwear.of(context);
    final c = dw.colors;
    final error = widget.error;
    final hasError = error != null && error.isNotEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      spacing: dw.dots(2),
      children: [
        // 見た目のラベル。読み上げは入力欄のほうで行うので、ここは読み上げない。
        // ラベルとエラーの説明も本文と同じ大きさにする（16 の整数倍でないと文字がにじむため。ADR-026）
        ExcludeSemantics(child: Text(widget.label, style: dotwearBodyStyle(c.foreground))),
        // 枠の外（タップ領域の余白）を押しても入力欄に入る
        GestureDetector(
          behavior: HitTestBehavior.translucent,
          excludeFromSemantics: true,
          onTap: widget.enabled ? _focusNode.requestFocus : null,
          child: DotwearFieldFrame(
            focused: _focusNode.hasFocus,
            error: hasError,
            enabled: widget.enabled,
            child: Semantics(
              label: widget.label,
              // エラーの説明は入力欄と関連づけて読み上げる（iOS の accessibilityHint と同じ。text-field.md）
              hint: hasError ? error : null,
              child: TextField(
                controller: widget.controller,
                focusNode: _focusNode,
                enabled: widget.enabled,
                keyboardType: widget.keyboardType,
                textInputAction: widget.textInputAction,
                obscureText: widget.obscureText,
                autofillHints: widget.autofillHints,
                autofocus: widget.autofocus,
                inputFormatters: widget.inputFormatters,
                onChanged: widget.onChanged,
                onSubmitted: widget.onSubmitted,
                style: dotwearBodyStyle(widget.enabled ? c.foreground : c.disabled),
                cursorColor: c.foreground,
                decoration: DotwearFieldFrame.decoration(context, hintText: widget.placeholder),
              ),
            ),
          ),
        ),
        // 入力欄の説明として読み上げるので、ここは二重に読まない
        if (hasError) ExcludeSemantics(child: Text(error, style: dotwearBodyStyle(c.danger))),
      ],
    );
  }
}
