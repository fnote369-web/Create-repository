"use server";

import { revalidatePath } from "next/cache";
import {
  confirmPaymentAndStart,
  renewMember,
  setLifecycle,
  setUnsubscribed,
} from "@/lib/members";

export async function confirmPaymentAction(formData: FormData) {
  const memberId = String(formData.get("memberId"));
  const startDate = String(formData.get("contractStartDate"));
  await confirmPaymentAndStart(memberId, startDate);
  revalidatePath(`/admin/members/${memberId}`);
}

export async function renewMemberAction(formData: FormData) {
  const memberId = String(formData.get("memberId"));
  await renewMember(memberId, "manual");
  revalidatePath(`/admin/members/${memberId}`);
}

export async function pauseMemberAction(formData: FormData) {
  const memberId = String(formData.get("memberId"));
  await setLifecycle(memberId, "paused");
  revalidatePath(`/admin/members/${memberId}`);
}

export async function resumeMemberAction(formData: FormData) {
  const memberId = String(formData.get("memberId"));
  await setLifecycle(memberId, "active");
  revalidatePath(`/admin/members/${memberId}`);
}

export async function cancelMemberAction(formData: FormData) {
  const memberId = String(formData.get("memberId"));
  await setLifecycle(memberId, "cancelled");
  revalidatePath(`/admin/members/${memberId}`);
}

export async function toggleUnsubscribeAction(formData: FormData) {
  const memberId = String(formData.get("memberId"));
  const unsubscribed = formData.get("unsubscribed") === "true";
  await setUnsubscribed(memberId, unsubscribed);
  revalidatePath(`/admin/members/${memberId}`);
}
