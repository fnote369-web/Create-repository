import { todayInTokyoISO } from "@/lib/contract";
import { createMemberAction } from "./actions";

export default async function NewMemberPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="max-w-xl">
      <h1 className="text-lg font-semibold mb-6">会員を登録する</h1>

      {sp.error === "1" && (
        <p className="mb-4 rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">
          お名前と正しいメールアドレスを入力してください。
        </p>
      )}
      {sp.error === "2" && (
        <p className="mb-4 rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">
          登録に失敗しました。同じメールアドレスの会員がすでに存在する可能性があります。
        </p>
      )}

      <form action={createMemberAction} className="card p-6 space-y-4">
        <div>
          <label className="label" htmlFor="name">名前</label>
          <input className="input" id="name" name="name" required />
        </div>
        <div>
          <label className="label" htmlFor="email">メールアドレス</label>
          <input className="input" id="email" name="email" type="email" required />
        </div>
        <div>
          <label className="label" htmlFor="productName">商品名</label>
          <input className="input" id="productName" name="productName" placeholder="例: 年間購読プラン" />
        </div>
        <div>
          <label className="label" htmlFor="paymentMethod">決済方法</label>
          <input className="input" id="paymentMethod" name="paymentMethod" placeholder="例: 銀行振込" />
        </div>
        <div>
          <label className="label" htmlFor="paymentStatus">決済状況</label>
          <select className="input" id="paymentStatus" name="paymentStatus" defaultValue="pending">
            <option value="pending">未確認（申込のみ）</option>
            <option value="paid">支払い済み</option>
          </select>
        </div>

        <div className="rounded-md bg-gray-50 p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="startNow" defaultChecked className="rounded" />
            <span>支払い済みの場合、今すぐ契約を開始する（契約終了日は自動計算されます）</span>
          </label>
          <div>
            <label className="label" htmlFor="contractStartDate">契約開始日</label>
            <input
              className="input"
              id="contractStartDate"
              name="contractStartDate"
              type="date"
              defaultValue={todayInTokyoISO()}
            />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" name="termsAgreed" className="mt-1" />
          <span>利用規約への同意を確認済み</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" name="privacyAgreed" className="mt-1" />
          <span>プライバシーポリシーへの同意を確認済み</span>
        </label>

        <button type="submit" className="btn-primary w-full">登録する</button>
      </form>
    </div>
  );
}
