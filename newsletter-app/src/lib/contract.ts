// 契約期間まわりの日付計算。すべて「日付のみ（時刻なし）」はUTCの深夜0時として扱う。
// これにより、タイムゾーンのズレでうっかり日付が1日変わる、という事故を避ける。

/** YYYY-MM-DD 形式の開始日から、契約終了日（開始日+1年-1日、うるう年考慮）を計算する */
export function computeContractEndDate(startISODate: string): string {
  const start = new Date(`${startISODate}T00:00:00Z`);
  if (Number.isNaN(start.getTime())) {
    throw new Error(`不正な日付です: ${startISODate}`);
  }
  const end = new Date(start);
  end.setUTCFullYear(end.getUTCFullYear() + 1);
  end.setUTCDate(end.getUTCDate() - 1);
  return end.toISOString().slice(0, 10);
}

/** 契約終了日の翌日（更新時の新しい契約開始日）を計算する */
export function nextDayISO(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** 今日の日付をYYYY-MM-DD（日本時間基準）で返す */
export function todayInTokyoISO(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date()); // en-CA -> YYYY-MM-DD
}

/** <input type="datetime-local"> の値（日本時間として入力された想定）をUTCのISO文字列に変換する */
export function tokyoLocalInputToUTCISOString(localValue: string): string {
  // localValue 例: "2026-09-04T06:30"
  const [datePart, timePart] = localValue.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = (timePart ?? "00:00").split(":").map(Number);
  // 日本時間はUTC+9固定（サマータイムなし）なので、9時間引けばUTCになる。
  const utcMs = Date.UTC(y, m - 1, d, hh - 9, mm);
  return new Date(utcMs).toISOString();
}

/** UTCのISO文字列を、日本時間の "YYYY-MM-DD HH:mm" 表示用文字列に変換する */
export function formatUTCToTokyoDisplay(isoUTC: string | null | undefined): string {
  if (!isoUTC) return "-";
  const d = new Date(isoUTC);
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return formatter.format(d) + " (JST)";
}

export const DISPLAY_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  "有効": { label: "有効", color: "bg-green-100 text-green-800" },
  "期限間近": { label: "期限間近", color: "bg-yellow-100 text-yellow-800" },
  "期限切れ": { label: "期限切れ", color: "bg-gray-200 text-gray-700" },
  "停止中": { label: "停止中", color: "bg-orange-100 text-orange-800" },
  "解約": { label: "解約", color: "bg-red-100 text-red-800" },
  "未開始": { label: "未開始", color: "bg-blue-100 text-blue-800" },
};
