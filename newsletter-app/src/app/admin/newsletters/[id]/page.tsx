import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { formatUTCToTokyoDisplay } from "@/lib/contract";
import NewsletterEditorToolbar from "@/components/NewsletterEditorToolbar";
import PreviewPanel from "@/components/PreviewPanel";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import {
  saveDraftAction,
  testSendAction,
  sendNowAction,
  scheduleAction,
  unscheduleAction,
} from "./actions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  draft: "下書き",
  scheduled: "予約済み",
  sending: "送信中",
  sent: "送信済み",
  failed: "送信失敗",
};

async function getNewsletter(id: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase.from("newsletters").select("*").eq("id", id).maybeSingle();
  return data;
}

export default async function NewsletterEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const newsletter = await getNewsletter(id);
  if (!newsletter) notFound();

  const editable = ["draft", "scheduled", "failed"].includes(newsletter.status);
  const scheduledLocalDefault = newsletter.scheduled_at
    ? new Date(
        new Date(newsletter.scheduled_at).getTime() +
          9 * 60 * 60 * 1000 // 表示用にJSTへオフセット
      )
        .toISOString()
        .slice(0, 16)
    : "";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{newsletter.title}</h1>
        <span className="text-sm text-gray-500">{STATUS_LABELS[newsletter.status] ?? newsletter.status}</span>
      </div>

      {sp.saved === "1" && <Notice text="下書きを保存しました。" />}
      {sp.testsent === "1" && (
        <Notice text="自分宛にテスト送信しました（管理者メールアドレス宛）。会員には送信していません。" />
      )}
      {sp.scheduled === "1" && <Notice text="送信を予約しました。" />}
      {sp.unscheduled === "1" && <Notice text="予約を取り消し、下書きに戻しました。" />}
      {sp.skipped === "1" && (
        <Notice text="既に送信済み、または送信処理中のため、今回の操作はスキップされました（二重送信防止）。" warn />
      )}
      {sp.sent === "1" && (
        <Notice
          text={`送信しました。対象 ${sp.total ?? 0}名 / 成功 ${sp.success ?? 0}件 / 失敗 ${sp.failure ?? 0}件`}
        />
      )}
      {sp.error === "schedule" && <Notice text="送信予定日時を入力してください。" warn />}

      {newsletter.status === "sent" && (
        <div className="card p-4 text-sm text-gray-600">
          送信日時: {formatUTCToTokyoDisplay(newsletter.sent_at)} ／ 対象 {newsletter.total_recipients}名 ／
          成功 {newsletter.success_count}件 ／ 失敗 {newsletter.failure_count}件
        </div>
      )}

      <form className="card p-6 space-y-4">
        <input type="hidden" name="id" value={newsletter.id} />

        <div>
          <label className="label" htmlFor="title">タイトル（管理用）</label>
          <input className="input" id="title" name="title" defaultValue={newsletter.title} required disabled={!editable} />
        </div>
        <div>
          <label className="label" htmlFor="subject">メール件名</label>
          <input className="input" id="subject" name="subject" defaultValue={newsletter.subject} required disabled={!editable} />
        </div>
        <div>
          <label className="label" htmlFor="publishDate">公開日</label>
          <input
            className="input"
            id="publishDate"
            name="publishDate"
            type="date"
            defaultValue={newsletter.publish_date ?? ""}
            disabled={!editable}
          />
        </div>
        <div>
          <label className="label" htmlFor="bodyHtml">本文</label>
          {editable && <NewsletterEditorToolbar targetId="bodyHtml" />}
          <textarea
            className="input font-mono"
            id="bodyHtml"
            name="bodyHtml"
            rows={16}
            defaultValue={newsletter.body_html}
            disabled={!editable}
          />
        </div>

        <PreviewPanel bodyTextareaId="bodyHtml" subjectInputId="subject" />

        {editable && (
          <div className="space-y-4 border-t border-gray-100 pt-4">
            <div className="flex flex-wrap gap-3">
              <button type="submit" formAction={saveDraftAction} className="btn-secondary">
                下書きを保存
              </button>
              <button type="submit" formAction={testSendAction} className="btn-secondary">
                自分だけにテスト送信
              </button>
              <ConfirmSubmitButton
                formAction={sendNowAction}
                confirmText="現在契約が有効な会員全員に、今すぐこのニュースレターを送信します。よろしいですか？"
                className="btn-primary"
              >
                今すぐ送信
              </ConfirmSubmitButton>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-gray-50 rounded-md p-4">
              <label className="text-sm text-gray-700" htmlFor="scheduledAt">
                送信予定日時（日本時間）
              </label>
              <input
                className="input !w-auto"
                id="scheduledAt"
                name="scheduledAt"
                type="datetime-local"
                defaultValue={scheduledLocalDefault}
              />
              <button type="submit" formAction={scheduleAction} className="btn-primary">
                この日時に予約する
              </button>
              {newsletter.status === "scheduled" && (
                <button type="submit" formAction={unscheduleAction} className="btn-secondary">
                  予約を取り消す
                </button>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

function Notice({ text, warn }: { text: string; warn?: boolean }) {
  return (
    <p className={`rounded-md text-sm px-3 py-2 ${warn ? "bg-yellow-50 text-yellow-800" : "bg-green-50 text-green-800"}`}>
      {text}
    </p>
  );
}
