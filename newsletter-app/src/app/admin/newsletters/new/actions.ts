"use server";

import { redirect } from "next/navigation";
import { createDraftNewsletter } from "@/lib/newsletters";

export async function createNewsletterAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const bodyHtml = String(formData.get("bodyHtml") ?? "");
  const publishDate = String(formData.get("publishDate") ?? "");

  if (!title || !subject) {
    redirect("/admin/newsletters/new?error=1");
  }

  const newsletter = await createDraftNewsletter({ title, subject, bodyHtml, publishDate });
  redirect(`/admin/newsletters/${newsletter.id}`);
}
