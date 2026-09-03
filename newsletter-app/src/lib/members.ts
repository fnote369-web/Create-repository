import { supabaseAdmin } from "./supabase";
import { computeContractEndDate, nextDayISO, todayInTokyoISO } from "./contract";

export type Lifecycle = "pending" | "active" | "paused" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type RenewalSource = "initial" | "manual" | "stripe" | "auto";

export interface CreateMemberInput {
  name: string;
  email: string;
  productName: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  /** 支払い確認済みで、この場で契約を開始する場合のみ指定する */
  contractStartDate?: string;
}

/** 会員を新規作成する。支払い確認済み＆契約開始日ありなら、その場で契約履歴も1件作る。 */
export async function createMember(input: CreateMemberInput) {
  const supabase = supabaseAdmin();

  const startNow = input.paymentStatus === "paid" && !!input.contractStartDate;
  const contractEndDate = input.contractStartDate
    ? computeContractEndDate(input.contractStartDate)
    : null;

  const { data: member, error } = await supabase
    .from("members")
    .insert({
      name: input.name,
      email: input.email,
      product_name: input.productName,
      payment_method: input.paymentMethod,
      payment_status: input.paymentStatus,
      terms_agreed: input.termsAgreed,
      privacy_agreed: input.privacyAgreed,
      contract_start_date: input.contractStartDate ?? null,
      contract_end_date: contractEndDate,
      lifecycle: startNow ? "active" : "pending",
    })
    .select()
    .single();

  if (error) throw new Error(`会員登録に失敗しました: ${error.message}`);

  if (startNow && input.contractStartDate && contractEndDate) {
    const { error: historyError } = await supabase.from("subscription_history").insert({
      member_id: member.id,
      start_date: input.contractStartDate,
      end_date: contractEndDate,
      renewal_number: 0,
      source: "initial",
    });
    if (historyError) throw new Error(`契約履歴の作成に失敗しました: ${historyError.message}`);
  }

  return member;
}

/** 申込のみ（支払い未確認）の会員について、支払いを確認して契約を開始する */
export async function confirmPaymentAndStart(memberId: string, startDate: string) {
  const supabase = supabaseAdmin();
  const endDate = computeContractEndDate(startDate);

  const { error } = await supabase
    .from("members")
    .update({
      payment_status: "paid",
      lifecycle: "active",
      contract_start_date: startDate,
      contract_end_date: endDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId);
  if (error) throw new Error(`契約開始処理に失敗しました: ${error.message}`);

  const { error: historyError } = await supabase.from("subscription_history").insert({
    member_id: memberId,
    start_date: startDate,
    end_date: endDate,
    renewal_number: 0,
    source: "initial",
  });
  if (historyError) throw new Error(`契約履歴の作成に失敗しました: ${historyError.message}`);
}

/**
 * 契約を1年更新する。新しい契約開始日は「これまでの契約終了日の翌日」から始まる
 * （更新ボタンを押すのが遅れても、契約期間が途切れず連続するようにするため）。
 */
export async function renewMember(memberId: string, source: RenewalSource = "manual") {
  const supabase = supabaseAdmin();
  const { data: member, error } = await supabase
    .from("members")
    .select("contract_end_date, renewal_count")
    .eq("id", memberId)
    .single();
  if (error || !member) throw new Error(error?.message ?? "会員が見つかりません");
  if (!member.contract_end_date) {
    throw new Error("契約がまだ開始されていません。先に支払い確認を行ってください。");
  }

  const newStart = nextDayISO(member.contract_end_date);
  const newEnd = computeContractEndDate(newStart);
  const newRenewalCount = (member.renewal_count ?? 0) + 1;

  const { error: updateError } = await supabase
    .from("members")
    .update({
      contract_start_date: newStart,
      contract_end_date: newEnd,
      renewal_count: newRenewalCount,
      lifecycle: "active",
      payment_status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId);
  if (updateError) throw new Error(`更新処理に失敗しました: ${updateError.message}`);

  const { error: historyError } = await supabase.from("subscription_history").insert({
    member_id: memberId,
    start_date: newStart,
    end_date: newEnd,
    renewal_number: newRenewalCount,
    source,
  });
  if (historyError) throw new Error(`契約履歴の作成に失敗しました: ${historyError.message}`);
}

export async function setLifecycle(memberId: string, lifecycle: Lifecycle) {
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("members")
    .update({ lifecycle, updated_at: new Date().toISOString() })
    .eq("id", memberId);
  if (error) throw new Error(`状態の更新に失敗しました: ${error.message}`);
}

export async function setUnsubscribed(memberId: string, unsubscribed: boolean) {
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("members")
    .update({ unsubscribed, updated_at: new Date().toISOString() })
    .eq("id", memberId);
  if (error) throw new Error(`配信停止設定の更新に失敗しました: ${error.message}`);
}

/** メール内の配信停止リンク（トークン）から会員を配信停止にする */
export async function unsubscribeByToken(token: string): Promise<boolean> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("members")
    .update({ unsubscribed: true, updated_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
