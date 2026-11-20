import Dotwear
import SwiftUI

struct OrderListView: View {
    let onLogout: () -> Void

    @Environment(\.dotwearTheme) private var theme
    @State private var orders = Order.samples
    @State private var query = ""

    private var filtered: [Order] {
        query.isEmpty ? orders : orders.filter { $0.customer.contains(query) || $0.id.contains(query) }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: theme.dots(6)) {
                HStack(spacing: theme.dots(3)) {
                    DotwearIcon(.search, scale: 2)
                    TextField("顧客名・番号で検索", text: $query)
                        .textFieldStyle(.dotwear)
                        .accessibilityLabel("検索")
                }

                ForEach($orders) { $order in
                    if filtered.contains(order) {
                        NavigationLink(value: order.id) {
                            OrderRow(order: order)
                        }
                        // 行全体を 1 つのボタンとして読み上げる。カード自体は見た目だけ（card.md）
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("order-\(order.id)")
                    }
                }
            }
            .padding(theme.dots(8))
        }
        .background(theme.colors.background.ignoresSafeArea())
        .navigationTitle("受注一覧")
        .navigationDestination(for: String.self) { id in
            if let index = orders.firstIndex(where: { $0.id == id }) {
                OrderDetailView(order: $orders[index])
            }
        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                NavigationLink {
                    SettingsView(onLogout: onLogout)
                } label: {
                    DotwearIcon(.settings, scale: 2, label: Text("設定"))
                }
                .accessibilityIdentifier("settings")
            }
        }
    }
}

private struct OrderRow: View {
    let order: Order
    @Environment(\.dotwearTheme) private var theme

    var body: some View {
        HStack(spacing: theme.dots(6)) {
            DotwearIcon(order.status.icon, scale: 2)
            VStack(alignment: .leading, spacing: theme.dots(1)) {
                Text(order.customer).font(.headline)
                Text("\(order.id)・\(order.status.rawValue)").font(.subheadline)
            }
            Spacer(minLength: 0)
            Text(order.amount.yen).font(.body.monospacedDigit())
        }
        .foregroundStyle(theme.colors.foreground)
        .frame(maxWidth: .infinity, alignment: .leading)
        .dotwearCard()
        .accessibilityElement(children: .combine)
    }
}
