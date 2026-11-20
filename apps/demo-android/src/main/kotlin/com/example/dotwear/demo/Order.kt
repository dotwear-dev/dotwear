package com.example.dotwear.demo

import dev.dotwear.icons.DotwearIconDefinition
import dev.dotwear.icons.DotwearIcons
import java.text.NumberFormat
import java.util.Locale

/** デモ用の業務データ（受注）。iOS のデモと同じ内容 */
data class Order(val id: String, val customer: String, val amount: Int, val status: Status, val note: String) {
    enum class Status(val label: String) {
        Draft("下書き"),
        Confirmed("確定"),
        Shipped("出荷済み");

        val icon: DotwearIconDefinition
            get() = when (this) {
                Draft -> DotwearIcons.Edit
                Confirmed -> DotwearIcons.Check
                Shipped -> DotwearIcons.Folder
            }
    }

    val yen: String get() = "¥" + NumberFormat.getNumberInstance(Locale.JAPAN).format(amount)

    companion object {
        val samples = listOf(
            Order("A-1024", "山田商事", 128_000, Status.Confirmed, "納品は月末"),
            Order("A-1025", "ドット工房", 54_800, Status.Draft, ""),
            Order("A-1026", "ピクセル物産", 310_500, Status.Shipped, "請求書は郵送"),
            Order("A-1027", "株式会社 8bit", 9_900, Status.Confirmed, ""),
            Order("A-1028", "レトロ電機", 76_000, Status.Draft, "見積もり再提出"),
        )
    }
}
