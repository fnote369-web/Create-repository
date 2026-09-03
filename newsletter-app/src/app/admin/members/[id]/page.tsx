import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { formatUTCToTokyoDisplay, todayInTokyoISO } from "@/lib/contract";
import StatusBadge from "@/components/StatusBadge";
import {
  confirmPaymentAction,
  renewMemberAction,
  pauseMemberAction,
  resumeMemberAction,
  cancelMemberAction,
  toggleUnsubscribeAction,
} from "./actions";

export const dynamic = "force-dynamic";

async function getMemberDetail(id: string) {
  const supabase = supabaseAdmin();

  const { data: member } = await supabase.from("member_view").select("*").eq("id", id).maybeSingle();
  if (!member) return null;

  const { data: history } = await supabase
    .from("subscription_history")
    .select("*")
    .eq("member_id", id)
    .order("start_date", { ascending: true });

  const { data: sends } = await supabase
    .from("newsletter_sends")
    .select("id, status, sent_at, error, newsletters(id, title, subject)")
    .eq("member_id", id)
    .order("sent_at", { ascending: false });

  return { member, history: history ?? [], sends: sends ?? [] };
}

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getMemberDetail(id);
  if (!detail) notFound();
  const { member, history, sends } = detail;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">{member.name}</h1>
          <p className="text-sm text-gray-500">{member.email}</p>
        </div>
        <StatusBadge status={member.display_status} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoBox label="契約開始日" value={member.contract_start_date ?? "未開始"} />
        <InfoBox label="契約終了日" value={member.contract_end_date ?? "-"} />
        <InfoBox
          label="残り日数"
          value={member.days_remaining !== null ? `${member.days_remaining}日` : "-"}
        />
        <InfoBox label="更新回数" value={String(member.renewal_count)} />
        <InfoBox label="決済状況" value={member.payment_status} />
        <InfoBox label="商品名" value={member.product_name || "-"} />
        <InfoBox label="配信可否" value={member.is_deliverable ? "配信対象" : "対象外"} />
        <InfoBox label="最終送信日" value={formatUTCToTokyoDisplay(member.last_sent_at)} />
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold">操作</h2>
        <div className="flex flex-wrap gap-3">
          {member.lifecycle === "pending" && (
            <form action={confirmPaymentAction} className="flex items-center gap-2">
              <input type="hidden" name="memberId" value={member.id} />
              <input
                type="date"
                name="contractStartDate"
                defaultValue={todayInTokyoISO()}
                className="input !w-auto"
              />
              <button type="submit" className="btn-primary">支払いを確認して契約開始</button>
            </form>
          )}

          <form action={renewMemberAction}>
            <input type="hidden" name="memberId" value={member.id} />
            <button type="submit" className="btn-primary" disabled={!member.contract_end_date}>
              1年間更新する
            </button>
          </form>

          {member.lifecycle === "active" ? (
            <form action={pauseMemberAction}>
              <input type="hidden" name="memberId" value={member.id} />
              <button type="submit" className="btn-secondary">配信を停止する</button>
            </form>
          ) : member.lifecycle === "paused" ? (
            <form action={resumeMemberAction}>
              <input type="hidden" name="memberId" value={member.id} />
              <button type="submit" className="btn-secondary">配信を再開する</button>
            </form>
          ) : null}

          {member.lifecycle !== "cancelled" && (
            <form action={cancelMemberAction}>
              <input type="hidden" name="memberId" value={member.id} />
              <button type="submit" className="btn-danger">解約する</button>
            </form>
          )}

          <form action={toggleUnsubscribeAction}>
            <input type="hidden" name="memberId" value={member.id} />
            <input type="hidden" name="unsubscribed" value={(!member.unsubscribed).toString()} />
            <button type="submit" className="btn-secondary">
              {member.unsubscribed ? "配信停止を解除する" : "配信停止にする"}
            </button>
          </form>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold mb-4">契約履歴</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">契約履歴はまだありません。</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="text-gray-500 text-xs">
              <tr>
                <th className="text-left py-2">開始日</th>
                <th className="text-left py-2">終了日</th>
                <th className="text-left py-2">更新回数</th>
                <th className="text-left py-2">きっかけ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((h) => (
                <tr key={h.id}>
                  <td className="py-2">{h.start_date}</td>
                  <td className="py-2">{h.end_date}</td>
                  <td className="py-2">{h.renewal_number}</td>
                  <td className="py-2">{h.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card p-6">
        <h2 className="font-semibold mb-4">送信履歴</h2>
        {sends.length === 0 ? (
          <p className="text-sm text-gray-500">まだこの会員への送信はありません。</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="text-gray-500 text-xs">
              <tr>
                <th className="text-left py-2">送信日時</th>
                <th className="text-left py-2">ニュースレター</th>
                <th className="text-left py-2">結果</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sends.map((s) => (
                <tr key={s.id}>
                  <td className="py-2">{formatUTCToTokyoDisplay(s.sent_at)}</td>
                  {/* @ts-expect-error supabase joins typed loosely */}
                  <td className="py-2">{s.newsletters?.title ?? "-"}</td>
                  <td className="py-2">{s.status === "success" ? "成功" : `失敗: ${s.error ?? ""}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium mt-1">{value}</div>
    </div>
  );
}
