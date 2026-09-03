// Date / timezone helpers.
// All "day" math is done in the user's chosen IANA timezone (default Asia/Tokyo)
// so delivery day boundaries follow the user's local morning, not the server's.

export function todayInTimezone(timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`; // YYYY-MM-DD
}

export function addDays(isoDate, days) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function diffDays(isoFrom, isoTo) {
  const [fy, fm, fd] = isoFrom.split("-").map(Number);
  const [ty, tm, td] = isoTo.split("-").map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / 86400000);
}

// Current subscription day (1-30) given a delivery start date and the
// user's timezone. Returns 0 before the start date, 31+ once finished.
export function currentDeliveryDay(deliveryStartDate, timezone) {
  const today = todayInTimezone(timezone);
  const diff = diffDays(deliveryStartDate, today);
  return diff + 1; // day 1 on the start date itself
}

export function formatJapaneseDate(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

export function isValidDate(isoDate) {
  return /^\d{4}-\d{2}-\d{2}$/.test(isoDate) && !Number.isNaN(new Date(isoDate).getTime());
}
