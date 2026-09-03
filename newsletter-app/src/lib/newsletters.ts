import { supabaseAdmin } from "./supabase";
import { getEmailProvider, withUnsubscribeFooter } from "./email";

export interface NewsletterInput {
  title: string;
  subject: string;
  bodyHtml: string;
  publishDate?: string | null;
}

export async function createDraftNewsletter(input: NewsletterInput) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("newsletters")
    .insert({
      title: input.title,
      subject: input.subject,
      body_html: input.bodyHtml,
      publish_date: input.publishDate || null,
      status: "draft",
    })
    .select()
    .single();
  if (error) throw new Error(`下書きの作成に失敗しました: ${error.message}`);
  return data;
}

/** 下書き・予約中のニュースレターの内容を更新する（送信中・送信済みは編集不可） */
export async function updateNewsletterDraft(id: string, input: NewsletterInput) {
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("newsletters")
    .update({
      title: input.title,
      subject: input.subject,
      body_html: input.bodyHtml,
      publish_date: input.publishDate || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .in("status", ["draft", "scheduled", "failed"]);
  if (error) throw new Error(`更新に失敗しました: ${error.message}`);
}

export async function scheduleNewsletter(id: string, scheduledAtUTCISOString: string) {
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("newsletters")
    .update({ status: "scheduled", scheduled_at: scheduledAtUTCISOString, updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["draft", "scheduled", "failed"]);
  if (error) throw new Error(`予約に失敗しました: ${error.message}`);
}

export async function unscheduleNewsletter(id: string) {
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("newsletters")
    .update({ status: "draft", scheduled_at: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "scheduled");
  if (error) throw new Error(`予約の取り消しに失敗しました: ${error.message}`);
}

export async function sendTestEmail(newsletterId: string, toEmail: string) {
  const supabase = supabaseAdmin();
  const { data: nl, error } = await supabase
    .from("newsletters")
    .select("subject, body_html")
    .eq("id", newsletterId)
    .single();
  if (error || !nl) throw new Error("ニュースレターが見つかりません");

  const provider = getEmailProvider();
  const notice =
    '<p style="background:#fef3c7;padding:8px 12px;border-radius:6px;font-size:12px;margin-bottom:16px;">' +
    "これはテスト送信です。実際の会員には配信されていません。" +
    "</p>";
  const html = notice + withUnsubscribeFooter(nl.body_html, "test-preview-token");

  const result = await provider.send({
    to: toEmail,
    subject: `[テスト] ${nl.subject}`,
    html,
  });
  if (!result.ok) throw new Error(result.error ?? "テスト送信に失敗しました");
}

export interface SendResult {
  skipped: boolean;
  reason?: string;
  total?: number;
  success?: number;
  failure?: number;
}

/**
 * ニュースレターを、その時点で契約が有効な会員全員へ送信する。
 * 「今すぐ送信」ボタンと、予約送信の自動実行（cron）の両方から呼ばれる共通処理。
 *
 * 二重送信防止は二段構え:
 *   1) newsletters.status を draft/scheduled -> sending へ"条件付きで"更新する。
 *      これに失敗する（0件更新）ということは、既に他の実行が処理中/完了しているということなので、
 *      ボタンの連打やcronの重複実行があってもここで弾かれる。
 *   2) newsletter_sends に (newsletter_id, member_id) の一意制約を張っているので、
 *      万が一同時実行が起きても、同じ人に2回記録されることはない。
 */
export async function sendNewsletterNow(newsletterId: string): Promise<SendResult> {
  const supabase = supabaseAdmin();

  const { data: claimed, error: claimError } = await supabase
    .from("newsletters")
    .update({ status: "sending" })
    .eq("id", newsletterId)
    .in("status", ["draft", "scheduled", "failed"])
    .select()
    .maybeSingle();

  if (claimError) throw new Error(claimError.message);
  if (!claimed) {
    return { skipped: true, reason: "既に送信済み、または送信処理中です" };
  }

  try {
    const { data: nl, error: nlError } = await supabase
      .from("newsletters")
      .select("subject, body_html")
      .eq("id", newsletterId)
      .single();
    if (nlError || !nl) throw new Error(nlError?.message ?? "ニュースレターが見つかりません");

    const { data: deliverable, error: memberError } = await supabase
      .from("member_view")
      .select("id, email, unsubscribe_token")
      .eq("is_deliverable", true);
    if (memberError) throw new Error(memberError.message);

    const { data: alreadySent, error: sentError } = await supabase
      .from("newsletter_sends")
      .select("member_id")
      .eq("newsletter_id", newsletterId);
    if (sentError) throw new Error(sentError.message);
    const alreadySentIds = new Set((alreadySent ?? []).map((r) => r.member_id));

    const targets = (deliverable ?? []).filter((m) => !alreadySentIds.has(m.id));

    const provider = getEmailProvider();
    let successCount = 0;
    let failureCount = 0;

    for (const member of targets) {
      const html = withUnsubscribeFooter(nl.body_html, member.unsubscribe_token);
      const result = await provider.send({ to: member.email, subject: nl.subject, html });

      const { error: insertError } = await supabase.from("newsletter_sends").insert({
        newsletter_id: newsletterId,
        member_id: member.id,
        status: result.ok ? "success" : "failed",
        error: result.ok ? null : (result.error ?? null),
      });
      // 一意制約違反（23505）＝既に記録済みという意味なので、正常系として無視する
      if (insertError && insertError.code !== "23505") {
        throw new Error(insertError.message);
      }

      if (result.ok) {
        successCount++;
        await supabase
          .from("members")
          .update({ last_sent_at: new Date().toISOString() })
          .eq("id", member.id);
      } else {
        failureCount++;
      }
    }

    await supabase
      .from("newsletters")
      .update({
        status: "sent",
        total_recipients: targets.length,
        success_count: successCount,
        failure_count: failureCount,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", newsletterId);

    return { skipped: false, total: targets.length, success: successCount, failure: failureCount };
  } catch (err) {
    await supabase
      .from("newsletters")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", newsletterId);
    throw err;
  }
}

/** cronから呼ばれる: 送信予定時刻を過ぎた予約ニュースレターをすべて送信する */
export async function runDueScheduledSends() {
  const supabase = supabaseAdmin();
  const nowISO = new Date().toISOString();

  const { data: due, error } = await supabase
    .from("newsletters")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_at", nowISO);
  if (error) throw new Error(error.message);

  const results: Array<{ id: string; result: SendResult | { error: string } }> = [];
  for (const n of due ?? []) {
    try {
      const result = await sendNewsletterNow(n.id);
      results.push({ id: n.id, result });
    } catch (err) {
      results.push({ id: n.id, result: { error: err instanceof Error ? err.message : String(err) } });
    }
  }
  return results;
}
