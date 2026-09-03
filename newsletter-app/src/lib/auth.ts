import { timingSafeEqual } from "crypto";

// このファイルは node:crypto を使うため、Node.js実行環境（サーバーアクション、
// APIルートなど）専用。middleware（Edge Runtime）からは、代わりに
// "@/lib/session" を直接importすること（node:cryptoを含まない）。

export {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  createSessionToken,
  verifySessionToken,
  isLoggedIn,
} from "./session";

export function verifyAdminCredentials(email: string, password: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL ?? "";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!adminEmail || !adminPassword) return false;

  const a = Buffer.from(email.trim().toLowerCase());
  const b = Buffer.from(adminEmail.trim().toLowerCase());
  const emailOk = a.length === b.length && timingSafeEqual(a, b);

  const c = Buffer.from(password);
  const d = Buffer.from(adminPassword);
  const passwordOk = c.length === d.length && timingSafeEqual(c, d);

  return emailOk && passwordOk;
}
