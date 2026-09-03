import NewsletterEditorToolbar from "@/components/NewsletterEditorToolbar";
import PreviewPanel from "@/components/PreviewPanel";
import { todayInTokyoISO } from "@/lib/contract";
import { createNewsletterAction } from "./actions";

export default async function NewNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-lg font-semibold">新しいニュースレターを書く</h1>

      {sp.error === "1" && (
        <p className="rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">
          タイトルと件名を入力してください。
        </p>
      )}

      <form action={createNewsletterAction} className="card p-6 space-y-4">
        <div>
          <label className="label" htmlFor="title">タイトル（管理用）</label>
          <input className="input" id="title" name="title" placeholder="例: 9月3日号" required />
        </div>
        <div>
          <label className="label" htmlFor="subject">メール件名</label>
          <input className="input" id="subject" name="subject" required />
        </div>
        <div>
          <label className="label" htmlFor="publishDate">公開日</label>
          <input className="input" id="publishDate" name="publishDate" type="date" defaultValue={todayInTokyoISO()} />
        </div>
        <div>
          <label className="label" htmlFor="bodyHtml">本文</label>
          <NewsletterEditorToolbar targetId="bodyHtml" />
          <textarea
            className="input font-mono"
            id="bodyHtml"
            name="bodyHtml"
            rows={16}
            placeholder="ここに今日のニュースレターを書いてください。改行はそのままメールでも改行されます。&#10;HTMLタグ（<b>太字</b>など）もそのまま使えます。"
          />
        </div>

        <PreviewPanel bodyTextareaId="bodyHtml" subjectInputId="subject" />

        <button type="submit" className="btn-primary">下書きとして保存する</button>
      </form>
    </div>
  );
}
