const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return typeof value === "string" && EMAIL_RE.test(value.trim());
}

export function required(value) {
  return typeof value === "string" ? value.trim().length > 0 : value != null;
}

export const MESSAGES = {
  required: "この項目は必須です。",
  email: "正しいメールアドレスの形式で入力してください（例：name@example.com）。",
  date: "正しい日付を選択してください。",
  time: "正しい時刻を選択してください。",
  consent: "内容を確認のうえ、同意にチェックしてください。",
};
