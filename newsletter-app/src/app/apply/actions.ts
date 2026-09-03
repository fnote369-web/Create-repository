"use server";

import { redirect } from "next/navigation";
import { createMember, isValidEmail } from "@/lib/members";

export async function applyAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const productName = String(formData.get("productName") ?? "").trim();
  const paymentMethod = String(formData.get("paymentMethod") ?? "").trim();
  const termsAgreed = formData.get("termsAgreed") === "on";
  const privacyAgreed = formData.get("privacyAgreed") === "on";

  if (!name || !isValidEmail(email) || !termsAgreed || !privacyAgreed) {
    redirect("/apply?error=1");
  }

  // 決済連携はまだ無いため、この時点では「申込のみ」（支払い未確認）として登録する。
  // 運営者が入金を確認した後、管理画面から契約を開始する。
  try {
    await createMember({
      name,
      email,
      productName,
      paymentMethod,
      paymentStatus: "pending",
      termsAgreed,
      privacyAgreed,
    });
  } catch {
    redirect("/apply?error=2");
  }

  redirect("/apply/thanks");
}
