// アイコンの定義。Web の定義オブジェクト（dwSave）と同じく、名前とグリッドごとの「色ごとの矩形」だけを持つ。
// 色の値は持たない（# は前景色、2〜9 はパレットのスロット）。実際の色は描くときに環境から決める。
// 個々のアイコンは Generated/Icons.swift の static プロパティ（.save など）。`DotwearIcon(.save)` と書けるようにするため（ADR-013）

/// グリッドのサイズ（1 倍で描いたときの px / pt）
public enum DotwearIconGrid: Int, Sendable, CaseIterable, Hashable {
    case grid12 = 12
    case grid16 = 16
    case grid24 = 24
}

/// マス目の色。`#` は前景色、`2`〜`9` はパレットのスロット
public enum DotwearIconColor: Sendable, Hashable {
    case foreground
    case palette(Int)
}

/// マス目の矩形。座標と大きさはマス単位の整数
public struct DotwearIconRect: Sendable, Hashable {
    public let x: Int
    public let y: Int
    public let width: Int
    public let height: Int

    public init(_ x: Int, _ y: Int, _ width: Int, _ height: Int) {
        self.x = x
        self.y = y
        self.width = width
        self.height = height
    }
}

/// 1 色ぶんの矩形の集まり
public struct DotwearIconLayer: Sendable, Hashable {
    public let color: DotwearIconColor
    public let rects: [DotwearIconRect]

    public init(color: DotwearIconColor, rects: [DotwearIconRect]) {
        self.color = color
        self.rects = rects
    }
}

public struct DotwearIconDefinition: Sendable, Hashable, Identifiable {
    /// 元データの名前（kebab-case。例："arrow-left"）
    public let name: String
    /// グリッドごとの描き方。16 は必ずある
    public let grids: [DotwearIconGrid: [DotwearIconLayer]]

    public var id: String { name }

    public init(name: String, grids: [DotwearIconGrid: [DotwearIconLayer]]) {
        precondition(grids[.grid16] != nil, "16 のグリッドは必須です: \(name)")
        self.name = name
        self.grids = grids
    }

    /// 指定したグリッドの描き方。描き分けがないときは 16 を使う（Web の DotwearIcon と同じ）
    public func layers(for grid: DotwearIconGrid) -> (grid: DotwearIconGrid, layers: [DotwearIconLayer]) {
        if let layers = grids[grid] { return (grid, layers) }
        return (.grid16, grids[.grid16]!)
    }

    /// 名前から選ぶ（Web の byName に相当）。見つからなければ nil
    public static func named(_ name: String) -> DotwearIconDefinition? {
        byName[name]
    }

    private static let byName: [String: DotwearIconDefinition] =
        Dictionary(uniqueKeysWithValues: allIcons.map { ($0.name, $0) })
}
