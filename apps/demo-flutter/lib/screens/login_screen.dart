import 'dart:async';

import 'package:dotwear/dotwear.dart';
import 'package:material_ui/material_ui.dart';

import '../demo_app.dart';
import '../ui.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  String? _emailError;
  bool _loading = false;
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  void _submit() {
    // 送信したらキーボードを閉じる（次の画面の最初のタップが、キーボードを閉じる操作に使われないように）
    FocusScope.of(context).unfocus();
    // デモなので、形式だけを確かめる
    if (!_email.text.contains('@')) {
      setState(() => _emailError = 'メールアドレスの形式が正しくありません');
      return;
    }
    setState(() {
      _emailError = null;
      _loading = true;
    });
    _timer = Timer(const Duration(seconds: 1), () {
      if (!mounted) return;
      setState(() => _loading = false);
      Navigator.of(context).pushReplacementNamed(Routes.list);
    });
  }

  @override
  Widget build(BuildContext context) {
    final dw = Dotwear.of(context);
    return DemoScreen(
      title: 'Dotwear Demo',
      children: [
        Row(spacing: dw.dots(4), children: const [DotwearIcon(DotwearIcons.user, scale: 3), Heading('ログイン')]),
        DotwearTextField(
          label: 'メールアドレス',
          placeholder: 'メールアドレスを入力',
          controller: _email,
          error: _emailError,
          keyboardType: TextInputType.emailAddress,
          autofillHints: const [AutofillHints.email],
        ),
        DotwearTextField(
          label: 'パスワード',
          placeholder: '8 文字以上',
          controller: _password,
          obscureText: true,
          autofillHints: const [AutofillHints.password],
        ),
        SizedBox(
          width: double.infinity,
          child: DotwearButton(
            size: DotwearButtonSize.large,
            loading: _loading,
            onPressed: _loading ? null : _submit,
            child: const Text('ログイン'),
          ),
        ),
      ],
    );
  }
}
