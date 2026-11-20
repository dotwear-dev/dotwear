// ドキュメントサイト（apps/docs-site）に載せる Flutter のコード例。
// サイトは `// snippet:<名前>` から `// end-snippet` までを取り出して表示する（apps/docs-site/src/lib/snippets.ts）。
// デモアプリの中に置くのは、実際に dotwear と material_ui を入れた環境で静的解析をかけるため（flutter analyze）。
// test/doc_snippets_test.dart で描画もして、実行時にも落ちないことを確かめる。
// 名前は Web・Swift・React Native のコード例にそろえ、同じタブの組で並べる
// ignore_for_file: avoid_print
// snippet:quickstart
import 'package:dotwear/dotwear.dart';
import 'package:material_ui/material_ui.dart';

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      // Colors, the bundled DotGothic16 font and icon colors
      theme: const DotwearThemeData().toThemeData(),
      home: Scaffold(
        body: Center(
          child: DotwearButton(
            icon: DotwearIcons.save,
            onPressed: () => print('saved'),
            child: const Text('Save'),
          ),
        ),
      ),
    );
  }
}
// end-snippet

// コード例が呼ぶ処理（テストで描くので、中身のない関数にする）
void save() {}
void cancel() {}
void remove() {}

// MARK: アイコン

class IconSnippets extends StatelessWidget {
  const IconSnippets({super.key, this.name = 'save'});

  final String name;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // snippet:icon-basic
        const DotwearIcon(DotwearIcons.save), // 16 × 16
        const DotwearIcon(DotwearIcons.save, scale: 2), // 32 × 32
        // end-snippet

        // snippet:icon-color
        const DotwearIcon(DotwearIcons.trash, scale: 2, color: Colors.red),
        // end-snippet

        // snippet:icon-label
        // Decorative: excluded from VoiceOver and TalkBack
        const DotwearIcon(DotwearIcons.save),

        // Meaningful on its own: give it a label
        const DotwearIcon(DotwearIcons.trash, semanticLabel: 'Delete'),
        // end-snippet

        // snippet:icon-grid
        const DotwearIcon(DotwearIcons.save, grid: DotwearIconGrid.grid24),
        // end-snippet

        // snippet:icon-by-name
        if (DotwearIcons.named(name) case final icon?) DotwearIcon(icon, scale: 2),
        // end-snippet

        // snippet:icon-palette
        const DotwearIconTheme(
          palette: DotwearPalettes.retroGreen,
          child: DotwearIcon(DotwearIcons.folder, scale: 2),
        ),
        // end-snippet
      ],
    );
  }
}

// MARK: 部品

class ButtonSnippets extends StatelessWidget {
  const ButtonSnippets({super.key, this.isSaving = false});

  final bool isSaving;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // snippet:button
        const DotwearButton(onPressed: save, child: Text('Save')),

        const DotwearButton(
          variant: DotwearButtonVariant.secondary,
          size: DotwearButtonSize.small,
          onPressed: cancel,
          child: Text('Cancel'),
        ),

        const DotwearButton(
          variant: DotwearButtonVariant.danger,
          icon: DotwearIcons.trash,
          onPressed: remove,
          child: Text('Delete'),
        ),
        // end-snippet

        // snippet:button-loading
        DotwearButton(
          icon: DotwearIcons.save,
          loading: isSaving,
          onPressed: isSaving ? null : save, // null disables it
          child: const Text('Save'),
        ),
        // end-snippet
      ],
    );
  }
}

class TextFieldSnippet extends StatefulWidget {
  const TextFieldSnippet({super.key, this.emailError});

  final String? emailError;

  @override
  State<TextFieldSnippet> createState() => _TextFieldSnippetState();
}

class _TextFieldSnippetState extends State<TextFieldSnippet> {
  final email = TextEditingController();

  @override
  void dispose() {
    email.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final emailError = widget.emailError;
    return
        // snippet:text-field
        DotwearTextField(
          label: 'Email',
          controller: email,
          keyboardType: TextInputType.emailAddress,
          error: emailError, // null hides the message
        );
    // end-snippet
  }
}

class ToggleSnippet extends StatefulWidget {
  const ToggleSnippet({super.key});

  @override
  State<ToggleSnippet> createState() => _ToggleSnippetState();
}

class _ToggleSnippetState extends State<ToggleSnippet> {
  bool wifi = true;
  bool agree = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // snippet:toggle
        DotwearToggle(
          value: wifi,
          onChanged: (v) => setState(() => wifi = v),
          child: const Text('Wi-Fi'),
        ),

        DotwearToggle(
          variant: DotwearToggleVariant.checkbox,
          value: agree,
          onChanged: (v) => setState(() => agree = v),
          child: const Text('I agree to the terms'),
        ),
        // end-snippet
      ],
    );
  }
}

class CardSnippet extends StatelessWidget {
  const CardSnippet({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // snippet:card
        DotwearCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Semantics(header: true, child: const Text('Storage')),
              const Text('12 GB of 50 GB used'),
            ],
          ),
        ),

        const DotwearCard(variant: DotwearCardVariant.flat, child: Text('Nested')),
        // end-snippet
      ],
    );
  }
}

// MARK: テーマ

class RootView extends StatelessWidget {
  const RootView({super.key});

  @override
  Widget build(BuildContext context) => const Text('Root');
}

class ThemeRoot extends StatelessWidget {
  const ThemeRoot({super.key});

  @override
  Widget build(BuildContext context) {
    return
        // snippet:theme-root
        MaterialApp(
          theme: const DotwearThemeData().toThemeData(),
          home: const RootView(),
        );
    // end-snippet
  }
}

// snippet:theme-custom
final brand = const DotwearThemeData().copyWith(
  colors: const DotwearColors(primary: Color(0xFFCC334D)),
);

// MaterialApp(theme: brand.toThemeData(), …)
// end-snippet

class ThemeCustom extends StatelessWidget {
  const ThemeCustom({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(theme: brand.toThemeData(), home: const RootView());
}

// snippet:theme-read
class Badge extends StatelessWidget {
  const Badge({super.key});

  @override
  Widget build(BuildContext context) {
    final dw = Dotwear.of(context);
    return Container(
      padding: EdgeInsets.all(dw.dots(2)), // 2 dots → a whole number of device pixels
      color: dw.colors.primary,
      child: Text('NEW', style: TextStyle(color: dw.colors.onPrimary)),
    );
  }
}

// Raw values
const primary = DotwearTokens.colorPrimary;
// end-snippet
