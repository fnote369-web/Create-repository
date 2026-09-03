import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/admin";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <h1 className="text-lg font-semibold mb-1">管理者ログイン</h1>
        <p className="text-sm text-gray-500 mb-6">ニュースレター配信管理画面</p>

        {sp.error && (
          <p className="mb-4 rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">
            メールアドレスまたはパスワードが違います。
          </p>
        )}

        <form action={loginAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <label className="label" htmlFor="email">メールアドレス</label>
            <input className="input" id="email" name="email" type="email" required autoFocus />
          </div>
          <div>
            <label className="label" htmlFor="password">パスワード</label>
            <input className="input" id="password" name="password" type="password" required />
          </div>
          <button type="submit" className="btn-primary w-full">ログイン</button>
        </form>
      </div>
    </div>
  );
}
