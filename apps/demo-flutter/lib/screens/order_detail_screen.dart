import 'package:dotwear/dotwear.dart';
import 'package:material_ui/material_ui.dart';

import '../orders.dart';
import '../ui.dart';

class OrderDetailScreen extends StatefulWidget {
  const OrderDetailScreen({super.key, required this.orders, required this.id});

  final OrdersModel orders;
  final String id;

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  late final _note = TextEditingController(text: widget.orders.byId(widget.id)?.note ?? '');

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  Future<void> _confirmDelete(Order order) async {
    // 確認のダイアログは標準のまま（見た目を変えない）
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('この受注を削除しますか？'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('キャンセル')),
          TextButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('削除')),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    widget.orders.remove(order.id);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final dw = Dotwear.of(context);
    return ListenableBuilder(
      listenable: widget.orders,
      builder: (context, _) {
        final order = widget.orders.byId(widget.id);
        if (order == null) return const SizedBox.shrink();
        Widget row(String label, String value) => MergeSemantics(
              child: Semantics(
                label: '$label、$value',
                excludeSemantics: true,
                child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Body(label), Body(value)]),
              ),
            );
        return DemoScreen(
          title: order.id,
          canGoBack: true,
          children: [
            DotwearCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: dw.dots(3),
                children: [
                  Heading(order.customer),
                  row('受注番号', order.id),
                  row('金額', yen(order.amount)),
                  row('状態', order.status.label),
                ],
              ),
            ),
            DotwearTextField(
              label: 'メモ',
              placeholder: 'メモを入力',
              controller: _note,
              onChanged: (note) => widget.orders.update(order.copyWith(note: note)),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: dw.dots(4),
              children: [
                DotwearButton(
                  size: DotwearButtonSize.large,
                  icon: DotwearIcons.check,
                  onPressed: order.status == OrderStatus.draft ? () => widget.orders.update(order.copyWith(status: OrderStatus.confirmed)) : null,
                  child: const Text('確定する'),
                ),
                DotwearButton(
                  variant: DotwearButtonVariant.danger,
                  size: DotwearButtonSize.large,
                  icon: DotwearIcons.trash,
                  onPressed: () => _confirmDelete(order),
                  child: const Text('削除'),
                ),
              ],
            ),
          ],
        );
      },
    );
  }
}
