"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  updateNewsletterDraft,
  scheduleNewsletter,
  unscheduleNewsletter,
  sendTestEmail,
  sendNewsletterNow,
} from "@/lib/newsletters";
import { tokyoLocalInputToUTCISOString } from "@/lib/contract";

function readCommonFields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    subject: String(formData.get("subject") ?? "").trim(),
    bodyHtml: String(formData.get("bodyHtml") ?? ""),
    publishDate: String(formData.get("publishDate") ?? ""),
  };
}

export async function saveDraftAction(formData: FormData) {
  const id = String(formData.get("id"));
  await updateNewsletterDraft(id, readCommonFields(formData));
  revalidatePath(`/admin/newsletters/${id}`);
  redirect(`/admin/newsletters/${id}?saved=1`);
}

export async function testSendAction(formData: FormData) {
  const id = String(formData.get("id"));
  await updateNewsletterDraft(id, readCommonFields(formData));

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) throw new Error("ADMIN_EMAIL が設定されていません。");
  await sendTestEmail(id, adminEmail);

  revalidatePath(`/admin/newsletters/${id}`);
  redirect(`/admin/newsletters/${id}?testsent=1`);
}

export async function sendNowAction(formData: FormData) {
  const id = String(formData.get("id"));
  await updateNewsletterDraft(id, readCommonFields(formData));
  const result = await sendNewsletterNow(id);

  revalidatePath(`/admin/newsletters/${id}`);
  revalidatePath("/admin/members");
  if (result.skipped) {
    redirect(`/admin/newsletters/${id}?skipped=1`);
  }
  redirect(`/admin/newsletters/${id}?sent=1&total=${result.total}&success=${result.success}&failure=${result.failure}`);
}

export async function scheduleAction(formData: FormData) {
  const id = String(formData.get("id"));
  await updateNewsletterDraft(id, readCommonFields(formData));

  const scheduledLocal = String(formData.get("scheduledAt") ?? "");
  if (!scheduledLocal) {
    redirect(`/admin/newsletters/${id}?error=schedule`);
  }
  const scheduledUTC = tokyoLocalInputToUTCISOString(scheduledLocal);
  await scheduleNewsletter(id, scheduledUTC);

  revalidatePath(`/admin/newsletters/${id}`);
  redirect(`/admin/newsletters/${id}?scheduled=1`);
}

export async function unscheduleAction(formData: FormData) {
  const id = String(formData.get("id"));
  await unscheduleNewsletter(id);
  revalidatePath(`/admin/newsletters/${id}`);
  redirect(`/admin/newsletters/${id}?unscheduled=1`);
}
