"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
  verifyAdminCredentials,
} from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!verifyAdminCredentials(email, password)) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const token = await createSessionToken(email);
  (await cookies()).set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  redirect(next.startsWith("/") ? next : "/admin");
}

export async function logoutAction() {
  (await cookies()).delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
