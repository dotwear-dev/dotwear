// デモ用の業務データ（受注）。iOS・Android・React Native のデモと同じ中身
import 'package:dotwear/dotwear.dart';
import 'package:flutter/foundation.dart';

enum OrderStatus {
  draft('下書き', DotwearIcons.edit),
  confirmed('確定', DotwearIcons.check),
  shipped('出荷済み', DotwearIcons.folder);

  const OrderStatus(this.label, this.icon);

  final String label;
  final DotwearIconDefinition icon;
}

@immutable
class Order {
  const Order({required this.id, required this.customer, required this.amount, required this.status, this.note = ''});

  final String id;
  final String customer;
  final int amount;
  final OrderStatus status;
  final String note;

  Order copyWith({OrderStatus? status, String? note}) =>
      Order(id: id, customer: customer, amount: amount, status: status ?? this.status, note: note ?? this.note);
}

const sampleOrders = [
  Order(id: 'A-1024', customer: '山田商事', amount: 128000, status: OrderStatus.confirmed, note: '納品は月末'),
  Order(id: 'A-1025', customer: 'ドット工房', amount: 54800, status: OrderStatus.draft),
  Order(id: 'A-1026', customer: 'ピクセル物産', amount: 310500, status: OrderStatus.shipped, note: '請求書は郵送'),
  Order(id: 'A-1027', customer: '株式会社 8bit', amount: 9900, status: OrderStatus.confirmed),
  Order(id: 'A-1028', customer: 'レトロ電機', amount: 76000, status: OrderStatus.draft, note: '見積もり再提出'),
];

/// 受注の一覧。画面をまたいで同じものを見る（詳細で確定・削除すると一覧にも反映する）
class OrdersModel extends ChangeNotifier {
  OrdersModel([List<Order> orders = sampleOrders]) : _orders = [...orders];

  final List<Order> _orders;
  List<Order> get orders => List.unmodifiable(_orders);

  Order? byId(String id) {
    for (final o in _orders) {
      if (o.id == id) return o;
    }
    return null;
  }

  void update(Order order) {
    final i = _orders.indexWhere((o) => o.id == order.id);
    if (i < 0) return;
    _orders[i] = order;
    notifyListeners();
  }

  void remove(String id) {
    _orders.removeWhere((o) => o.id == id);
    notifyListeners();
  }
}

/// ¥128,000 の形にする（intl に依存しないよう、3 桁区切りだけを自前で付ける）
String yen(int amount) {
  final digits = amount.toString();
  final buf = StringBuffer('¥');
  for (var i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 == 0) buf.write(',');
    buf.write(digits[i]);
  }
  return buf.toString();
}
