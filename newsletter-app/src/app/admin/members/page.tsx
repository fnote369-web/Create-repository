import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { formatUTCToTokyoDisplay } from "@/lib/contract";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

const STATUS_TABS = ["すべて", "有効", "期限間近", "期限切れ", "停止中", "解約", "未開始"];
const DAY_FILTERS = [30, 14, 7, 1];

interface MemberRow {
  id: string;
  name: string;
  email: string;
  contract_start_date: string | null;
  contract_end_date: string | null;
  days_remaining: number | null;
  display_status: string;
  payment_status: string;
  renewal_count: number;
  is_deliverable: boolean;
  last_sent_at: string | null;
}

async function getMembers(status?: string, withinDays?: string) {
  const supabase = supabaseAdmin();
  let query = supabase
    .from("member_view")
    .select(
      "id, name, email, contract_start_date, contract_end_date, days_remaining, display_status, payment_status, renewal_count, is_deliverable, last_sent_at"
    )
    .order("contract_end_date", { ascending: true, nullsFirst: false });

  if (status && status !== "すべて") {
    query = query.eq("display_status", status);
  }
  if (withinDays) {
    const n = Number(withinDays);
    query = query.gte("days_remaining", 0).lte("days_remaining", n);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as MemberRow[];
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; withinDays?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "すべて";
  const withinDays = sp.withinDays;
  const members = await getMembers(status, withinDays);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">会員一覧</h1>
        <Link href="/admin/members/new" className="btn-primary">
          会員を登録する
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => (
          <Link
            key={s}
            href={`/admin/members?status=${encodeURIComponent(s)}`}
            className={`btn-secondary !py-1 !px-3 text-xs ${status === s ? "bg-brand-50 border-brand-500 text-brand-700" : ""}`}
          >
            {s}
          </Link>
        ))}
        <span className="mx-2 text-gray-300">|</span>
        <span className="text-xs text-gray-500 self-center">期限が近い人:</span>
        {DAY_FILTERS.map((d) => (
          <Link
            key={d}
            href={`/admin/members?withinDays=${d}`}
            className={`btn-secondary !py-1 !px-3 text-xs ${withinDays === String(d) ? "bg-brand-50 border-brand-500 text-brand-700" : ""}`}
          >
            {d}日前まで
          </Link>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">名前</th>
              <th className="text-left px-4 py-3">メールアドレス</th>
              <th className="text-left px-4 py-3">契約開始日</th>
              <th className="text-left px-4 py-3">契約終了日</th>
              <th className="text-left px-4 py-3">残り日数</th>
              <th className="text-left px-4 py-3">状態</th>
              <th className="text-left px-4 py-3">決済</th>
              <th className="text-left px-4 py-3">更新回数</th>
              <th className="text-left px-4 py-3">配信可否</th>
              <th className="text-left px-4 py-3">最終送信</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/members/${m.id}`} className="text-brand-600 hover:underline">
                    {m.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{m.email}</td>
                <td className="px-4 py-3 text-gray-600">{m.contract_start_date ?? "-"}</td>
                <td className="px-4 py-3 text-gray-600">{m.contract_end_date ?? "-"}</td>
                <td className="px-4 py-3 text-gray-600">
                  {m.days_remaining !== null ? `${m.days_remaining}日` : "-"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={m.display_status} />
                </td>
                <td className="px-4 py-3 text-gray-600">{m.payment_status}</td>
                <td className="px-4 py-3 text-gray-600">{m.renewal_count}</td>
                <td className="px-4 py-3">{m.is_deliverable ? "○" : "×"}</td>
                <td className="px-4 py-3 text-gray-600">{formatUTCToTokyoDisplay(m.last_sent_at)}</td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                  該当する会員がいません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
