import 'package:dotwear/dotwear.dart';
import 'package:material_ui/material_ui.dart';

import '../demo_app.dart';
import '../ui.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notifications = true;
  bool _sound = false;
  bool _weeklyReport = true;
  bool _agreeAnalytics = false;

  @override
  Widget build(BuildContext context) {
    final dw = Dotwear.of(context);
    return DemoScreen(
      title: '設定',
      canGoBack: true,
      children: [
        DotwearCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: dw.dots(2),
            children: [
              const Heading('通知', size: 16),
              DotwearToggle(value: _notifications, onChanged: (v) => setState(() => _notifications = v), child: const Text('プッシュ通知')),
              DotwearToggle(value: _sound, onChanged: _notifications ? (v) => setState(() => _sound = v) : null, child: const Text('通知音')),
              DotwearToggle(
                variant: DotwearToggleVariant.checkbox,
                value: _weeklyReport,
                onChanged: (v) => setState(() => _weeklyReport = v),
                child: const Text('週次レポートをメールで受け取る'),
              ),
            ],
          ),
        ),
        DotwearCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: dw.dots(2),
            children: [
              const Heading('プライバシー', size: 16),
              DotwearToggle(
                variant: DotwearToggleVariant.checkbox,
                value: _agreeAnalytics,
                onChanged: (v) => setState(() => _agreeAnalytics = v),
                child: const Text('利用状況の送信に同意する'),
              ),
            ],
          ),
        ),
        Row(
          spacing: dw.dots(4),
          children: [
            DotwearButton(
              variant: DotwearButtonVariant.secondary,
              onPressed: () => Navigator.of(context).pushNamedAndRemoveUntil(Routes.login, (_) => false),
              child: const Text('ログアウト'),
            ),
            DotwearButton(variant: DotwearButtonVariant.ghost, onPressed: () => Navigator.of(context).maybePop(), child: const Text('キャンセル')),
          ],
        ),
      ],
    );
  }
}
