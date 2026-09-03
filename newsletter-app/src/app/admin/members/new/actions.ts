"use server";

import { redirect } from "next/navigation";
import { createMember, isValidEmail } from "@/lib/members";
import { todayInTokyoISO } from "@/lib/contract";

export async function createMemberAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const productName = String(formData.get("productName") ?? "").trim();
  const paymentMethod = String(formData.get("paymentMethod") ?? "").trim();
  const paymentStatus = String(formData.get("paymentStatus") ?? "pending") as
    | "pending"
    | "paid";
  const termsAgreed = formData.get("termsAgreed") === "on";
  const privacyAgreed = formData.get("privacyAgreed") === "on";
  const startNow = formData.get("startNow") === "on";
  const contractStartDate = String(formData.get("contractStartDate") ?? todayInTokyoISO());

  if (!name || !isValidEmail(email)) {
    redirect("/admin/members/new?error=1");
  }

  let memberId: string;
  try {
    const member = await createMember({
      name,
      email,
      productName,
      paymentMethod,
      paymentStatus,
      termsAgreed,
      privacyAgreed,
      contractStartDate: paymentStatus === "paid" && startNow ? contractStartDate : undefined,
    });
    memberId = member.id;
  } catch {
    redirect("/admin/members/new?error=2");
  }

  redirect(`/admin/members/${memberId}`);
}
