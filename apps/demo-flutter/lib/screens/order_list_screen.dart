import 'package:dotwear/dotwear.dart';
import 'package:material_ui/material_ui.dart';

import '../demo_app.dart';
import '../orders.dart';
import '../ui.dart';

class OrderListScreen extends StatefulWidget {
  const OrderListScreen({super.key, required this.orders});

  final OrdersModel orders;

  @override
  State<OrderListScreen> createState() => _OrderListScreenState();
}

class _OrderListScreenState extends State<OrderListScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final dw = Dotwear.of(context);
    return ListenableBuilder(
      listenable: widget.orders,
      builder: (context, _) {
        final all = widget.orders.orders;
        final filtered = _query.isEmpty ? all : all.where((o) => o.customer.contains(_query) || o.id.contains(_query)).toList();
        return DemoScreen(
          title: '受注一覧',
          action: DotwearButton(
            variant: DotwearButtonVariant.ghost,
            size: DotwearButtonSize.small,
            icon: DotwearIcons.settings,
            semanticLabel: '設定',
            onPressed: () => Navigator.of(context).pushNamed(Routes.settings),
          ),
          children: [
            DotwearTextField(label: '検索', placeholder: '顧客名・番号で検索', onChanged: (q) => setState(() => _query = q)),
            for (final order in filtered)
              // 行全体を 1 つのボタンとして読み上げる。カード自体は見た目だけ（card.md）
              Semantics(
                button: true,
                label: '${order.customer}、${order.id}、${order.status.label}、${yen(order.amount)}',
                excludeSemantics: true,
                onTap: () => Navigator.of(context).pushNamed(Routes.detail(order.id)),
                child: GestureDetector(
                  key: ValueKey('order-${order.id}'),
                  behavior: HitTestBehavior.opaque,
                  onTap: () => Navigator.of(context).pushNamed(Routes.detail(order.id)),
                  child: DotwearCard(
                    child: Row(
                      spacing: dw.dots(6),
                      children: [
                        DotwearIcon(order.status.icon, scale: 2),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            spacing: dw.dots(1),
                            children: [Body(order.customer), Body('${order.id}・${order.status.label}')],
                          ),
                        ),
                        Body(yen(order.amount)),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
