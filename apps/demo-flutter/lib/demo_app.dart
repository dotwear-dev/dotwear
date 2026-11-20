// アプリ全体：テーマと画面の切り替え（ログイン → 受注一覧 → 詳細、設定）。
// 画面の移動は標準の Navigator に任せる（iOS のスワイプで戻る・Android の戻るボタンがそのまま効く）
import 'package:dotwear/dotwear.dart';
import 'package:material_ui/material_ui.dart';

import 'orders.dart';
import 'screens/login_screen.dart';
import 'screens/order_detail_screen.dart';
import 'screens/order_list_screen.dart';
import 'screens/settings_screen.dart';

abstract final class Routes {
  static const login = '/';
  static const list = '/list';
  static const settings = '/settings';

  /// '/detail/A-1025'
  static String detail(String id) => '/detail/$id';
}

class DemoApp extends StatefulWidget {
  const DemoApp({super.key, this.initialRoute = ''});

  /// 最初の画面（login・list・settings・detail:A-1025）。空ならログイン
  final String initialRoute;

  @override
  State<DemoApp> createState() => _DemoAppState();
}

class _DemoAppState extends State<DemoApp> {
  final _orders = OrdersModel();

  @override
  void dispose() {
    _orders.dispose();
    super.dispose();
  }

  Route<void> _page(Widget child, String name) => MaterialPageRoute(builder: (_) => child, settings: RouteSettings(name: name));

  Route<void>? _onGenerateRoute(RouteSettings settings) {
    final name = settings.name ?? Routes.login;
    if (name == Routes.login) return _page(const LoginScreen(), name);
    if (name == Routes.list) return _page(OrderListScreen(orders: _orders), name);
    if (name == Routes.settings) return _page(const SettingsScreen(), name);
    if (name.startsWith('/detail/')) return _page(OrderDetailScreen(orders: _orders, id: name.substring('/detail/'.length)), name);
    return null;
  }

  /// 最初の画面の下に、戻る先の画面を積んでおく（詳細・設定から戻ると一覧になる）
  List<Route<void>> _initialRoutes(String _) {
    final start = widget.initialRoute;
    final names = switch (start) {
      'list' => [Routes.list],
      'settings' => [Routes.list, Routes.settings],
      _ when start.startsWith('detail:') => [Routes.list, Routes.detail(start.substring('detail:'.length))],
      _ => [Routes.login],
    };
    return [for (final n in names) _onGenerateRoute(RouteSettings(name: n))!];
  }

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'Dotwear Demo',
        // 右上の DEBUG の帯を出さない（スクリーンショットで部品の上に重なるため）
        debugShowCheckedModeBanner: false,
        theme: const DotwearThemeData().toThemeData(),
        onGenerateRoute: _onGenerateRoute,
        onGenerateInitialRoutes: _initialRoutes,
      );
}
