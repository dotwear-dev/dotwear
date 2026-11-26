// Dotwear Pro のページ（ADR-036）の設定。
// 売り出すまでは本番のサイトに購入ボタンを出さない（まだない API に案内しないため）。
// ビルドのときに PUBLIC_DOTWEAR_PRO=1 を付けたときだけ、/pro の中身と目次の項目を出す
export const PRO_ENABLED = import.meta.env.PUBLIC_DOTWEAR_PRO === "1";

/** 購入とアカウントの API（apps/pro-api）。手元では PUBLIC_DOTWEAR_PRO_API=http://api.localhost:8787 */
export const PRO_API = (import.meta.env.PUBLIC_DOTWEAR_PRO_API as string | undefined) ?? "https://api.dotwear.dev";

/** Kit のレジストリ */
export const PRO_REGISTRY = "https://npm.dotwear.dev";

/**
 * 特定商取引法に基づく表記の事業者（屋号と氏名。ADR-037）。例：「Dotwear（運営：山田太郎）」。
 * 個人の名前をリポジトリに書かないよう、ビルドのときの環境変数で渡す（サイトのビルドの設定にメンテナーが入れる）
 */
export const SELLER = (import.meta.env.PUBLIC_DOTWEAR_SELLER as string | undefined)?.trim() ?? "";
/** 運営統括責任者（氏名）。SELLER と同じく環境変数で渡す */
export const SELLER_REPRESENTATIVE = (import.meta.env.PUBLIC_DOTWEAR_SELLER_REPRESENTATIVE as string | undefined)?.trim() ?? "";

// 売り出すとき（PRO_ENABLED）に事業者の表記がないまま出さない（特定商取引法で載せる必要がある）
if (PRO_ENABLED && (!SELLER || !SELLER_REPRESENTATIVE)) {
  throw new Error("PUBLIC_DOTWEAR_PRO=1 のときは PUBLIC_DOTWEAR_SELLER と PUBLIC_DOTWEAR_SELLER_REPRESENTATIVE が必要です（特定商取引法に基づく表記）");
}

export const CONTACT_EMAIL = "contact@dotwear.dev";
/** 返金を受け付ける期間（日）。ADR-037 */
export const REFUND_DAYS = 14;
