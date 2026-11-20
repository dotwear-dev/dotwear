// Flutter のデモアプリの入口。最初の画面は --dart-define=DEMO_ROUTE=list などで選べる（スクリーンショット用。iOS のデモの -skipLogin と同じ役割）
import 'package:material_ui/material_ui.dart';

import 'demo_app.dart';

void main() {
  runApp(const DemoApp(initialRoute: String.fromEnvironment('DEMO_ROUTE')));
}
