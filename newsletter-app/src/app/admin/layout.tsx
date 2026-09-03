import Link from "next/link";
import { logoutAction } from "../login/actions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/admin" className="font-semibold text-gray-900">
              ニュースレター管理
            </Link>
            <Link href="/admin/members" className="text-gray-600 hover:text-gray-900">
              会員一覧
            </Link>
            <Link href="/admin/newsletters" className="text-gray-600 hover:text-gray-900">
              ニュースレター
            </Link>
          </nav>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-800">
              ログアウト
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
