import { applyAction } from "./actions";

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-lg p-8">
        <h1 className="text-lg font-semibold mb-1">ニュースレターお申し込み</h1>
        <p className="text-sm text-gray-500 mb-6">
          お申し込み後、運営者が入金確認を行い契約を開始します。
        </p>

        {sp.error === "1" && (
          <p className="mb-4 rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">
            必須項目が未入力か、規約への同意が必要です。
          </p>
        )}
        {sp.error === "2" && (
          <p className="mb-4 rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">
            このメールアドレスはすでに登録されています。
          </p>
        )}

        <form action={applyAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="name">お名前</label>
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
            <input className="input" id="paymentMethod" name="paymentMethod" placeholder="例: 銀行振込 / PayPal" />
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input type="checkbox" name="termsAgreed" className="mt-1" required />
            <span>利用規約に同意します</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input type="checkbox" name="privacyAgreed" className="mt-1" required />
            <span>プライバシーポリシーに同意します</span>
          </label>

          <button type="submit" className="btn-primary w-full">申し込む</button>
        </form>
      </div>
    </div>
  );
}
