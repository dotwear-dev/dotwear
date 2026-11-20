import Dotwear
import SwiftUI

struct OrderDetailView: View {
    @Binding var order: Order

    @Environment(\.dotwearTheme) private var theme
    @Environment(\.dismiss) private var dismiss
    @State private var confirmingDelete = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: theme.dots(8)) {
                VStack(alignment: .leading, spacing: theme.dots(3)) {
                    Text(order.customer).font(.title2.bold()).accessibilityAddTraits(.isHeader)
                    LabeledContent("受注番号", value: order.id)
                    LabeledContent("金額", value: order.amount.yen)
                    LabeledContent("状態", value: order.status.rawValue)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .dotwearCard()

                VStack(alignment: .leading, spacing: theme.dots(2)) {
                    Text("メモ").font(.subheadline)
                    TextField("メモを入力", text: $order.note)
                        .textFieldStyle(.dotwear)
                        .accessibilityLabel("メモ")
                }

                VStack(spacing: theme.dots(4)) {
                    Button {
                        order.status = .confirmed
                    } label: {
                        Label { Text("確定する") } icon: { DotwearIcon(.check, scale: 1) }
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.dotwear(.primary, size: .large))
                    .disabled(order.status != .draft)

                    Button {
                        confirmingDelete = true
                    } label: {
                        Label { Text("削除") } icon: { DotwearIcon(.trash, scale: 1) }
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.dotwear(.danger, size: .large))
                }
            }
            .foregroundStyle(theme.colors.foreground)
            .padding(theme.dots(8))
        }
        .background(theme.colors.background.ignoresSafeArea())
        .navigationTitle(order.id)
        .navigationBarTitleDisplayMode(.inline)
        // 確認のダイアログは標準のまま（見た目を変えない）
        .confirmationDialog("この受注を削除しますか？", isPresented: $confirmingDelete, titleVisibility: .visible) {
            Button("削除", role: .destructive) { dismiss() }
        }
    }
}
