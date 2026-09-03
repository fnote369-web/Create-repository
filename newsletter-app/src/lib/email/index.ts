import { ResendEmailProvider } from "./resend";
import type { EmailProvider } from "./types";

export type { EmailProvider, SendEmailInput, SendEmailResult } from "./types";

// 送信サービスを切り替えたくなったら、ここに新しいプロバイダー
// （例: src/lib/email/brevo.ts, sendgrid.ts, ses.ts）を作って
// EMAIL_PROVIDER 環境変数の値で切り替えるだけでよい設計にしている。
export function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER ?? "resend";

  switch (provider) {
    case "resend": {
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.MAIL_FROM;
      if (!apiKey || !from) {
        throw new Error("RESEND_API_KEY / MAIL_FROM が未設定です。.env.local を確認してください。");
      }
      return new ResendEmailProvider(apiKey, from);
    }
    default:
      throw new Error(`未対応のメール配信サービスです: ${provider}`);
  }
}

/** 本文HTMLの末尾に配信停止リンクを付与する */
export function withUnsubscribeFooter(bodyHtml: string, unsubscribeToken: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const unsubscribeUrl = `${appUrl}/api/unsubscribe?token=${unsubscribeToken}`;
  return `
${bodyHtml}
<hr style="margin-top:32px;border:none;border-top:1px solid #e5e7eb;" />
<p style="font-size:12px;color:#6b7280;margin-top:16px;">
  配信停止をご希望の場合は<a href="${unsubscribeUrl}" style="color:#6b7280;">こちら</a>から手続きできます。
</p>`;
}
