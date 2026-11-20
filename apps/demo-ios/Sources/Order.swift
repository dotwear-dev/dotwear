import Dotwear

/// デモ用の業務データ（受注）
struct Order: Identifiable, Hashable {
    enum Status: String {
        case draft = "下書き"
        case confirmed = "確定"
        case shipped = "出荷済み"

        var icon: DotwearIconDefinition {
            switch self {
            case .draft: .edit
            case .confirmed: .check
            case .shipped: .folder
            }
        }
    }

    let id: String
    let customer: String
    let amount: Int
    var status: Status
    var note: String

    static let samples: [Order] = [
        Order(id: "A-1024", customer: "山田商事", amount: 128_000, status: .confirmed, note: "納品は月末"),
        Order(id: "A-1025", customer: "ドット工房", amount: 54_800, status: .draft, note: ""),
        Order(id: "A-1026", customer: "ピクセル物産", amount: 310_500, status: .shipped, note: "請求書は郵送"),
        Order(id: "A-1027", customer: "株式会社 8bit", amount: 9_900, status: .confirmed, note: ""),
        Order(id: "A-1028", customer: "レトロ電機", amount: 76_000, status: .draft, note: "見積もり再提出"),
    ]
}

extension Int {
    var yen: String { "¥" + formatted(.number) }
}
