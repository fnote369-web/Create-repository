import { cookies } from "next/headers";

// セッショントークンの署名・検証は Web Crypto API (crypto.subtle) のみを使う。
// node:crypto を一切importしないことで、このファイルは middleware（Edge Runtime）からも
// 安全に使える（Node専用のverifyAdminCredentialsは auth.ts 側に分離している）。

export const SESSION_COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7日間

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "ADMIN_SESSION_SECRET が未設定、または短すぎます。.env.local を確認してください。"
    );
  }
  return secret;
}

async function getHmacKey(): Promise<CryptoKey> {
  const secret = getSecret();
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export async function createSessionToken(email: string): Promise<string> {
  const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({ email, exp })));
  const key = await getHmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${toHex(sig)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payload, sigHex] = token.split(".");
  if (!payload || !sigHex) return false;
  try {
    const key = await getHmacKey();
    const sigBytes = fromHex(sigHex);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as BufferSource,
      new TextEncoder().encode(payload)
    );
    if (!valid) return false;
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    if (typeof data.exp !== "number" || Date.now() > data.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export async function isLoggedIn(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
