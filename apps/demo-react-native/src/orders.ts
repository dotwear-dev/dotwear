// デモ用の業務データ（受注）。iOS・Android のデモと同じ中身
import { dwCheck, dwEdit, dwFolder, type DotwearIconDefinition } from "@dotwear/react-native";

export type OrderStatus = "draft" | "confirmed" | "shipped";

export const statusLabel: Record<OrderStatus, string> = { draft: "下書き", confirmed: "確定", shipped: "出荷済み" };
export const statusIcon: Record<OrderStatus, DotwearIconDefinition> = { draft: dwEdit, confirmed: dwCheck, shipped: dwFolder };

export interface Order {
  id: string;
  customer: string;
  amount: number;
  status: OrderStatus;
  note: string;
}

export const sampleOrders: Order[] = [
  { id: "A-1024", customer: "山田商事", amount: 128_000, status: "confirmed", note: "納品は月末" },
  { id: "A-1025", customer: "ドット工房", amount: 54_800, status: "draft", note: "" },
  { id: "A-1026", customer: "ピクセル物産", amount: 310_500, status: "shipped", note: "請求書は郵送" },
  { id: "A-1027", customer: "株式会社 8bit", amount: 9_900, status: "confirmed", note: "" },
  { id: "A-1028", customer: "レトロ電機", amount: 76_000, status: "draft", note: "見積もり再提出" },
];

export function yen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}
