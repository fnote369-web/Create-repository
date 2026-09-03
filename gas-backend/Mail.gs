/**
 * Email templates + the daily delivery trigger.
 *
 * sendDailyLetters_() is meant to run on a time-driven trigger every
 * 15-30 minutes (see Setup.gs / README for how to install it). Each run:
 *   1. Skips users who are not "active" (paused/completed never send).
 *   2. Computes the REAL calendar day for the user (test-mode day
 *      overrides are UI-only and must never affect real sending).
 *   3. Sends only once the user's local time has reached their chosen
 *      delivery time for that day, and only if that day hasn't already
 *      been logged as sent (SendLog is the source of truth for
 *      de-duplication, so re-running the trigger, or the trigger firing
 *      slightly early/late, can never double-send).
 */

function sendDailyLetters_() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return; // another run is already in progress
  try {
    var sheet = usersSheet_();
    var values = sheet.getDataRange().getValues();
    var header = values[0];
    for (var i = 1; i < values.length; i++) {
      var obj = rowToObject_(header, values[i]);
      var user = deserializeUser_(obj);
      if (user.status !== "active") continue;

      var realDay = currentDeliveryDay_(user.deliveryStartDate, user.timezone);
      if (realDay < 1 || realDay > 30) continue;

      var alreadySent = getSendLogForUser_(user.userId).some(function (l) {
        return Number(l.day) === realDay && l.status === "sent";
      });
      if (alreadySent) continue;

      if (!isPastDeliveryTime_(user)) continue;

      var rowIndex = i + 1;
      try {
        var letter = user.letters[realDay - 1];
        if (!letter) throw new Error("Day" + realDay + "の手紙データがありません。");
        sendLetterEmail_(user, letter);
        appendSendLog_(user.userId, realDay, "sent", "");
        if (realDay === 30) {
          user.status = "completed";
          saveUserByRow_(rowIndex, user);
        }
      } catch (err) {
        appendSendLog_(user.userId, realDay, "error", err.message);
        appendErrorLog_(user.userId, realDay, err.message);
      }
    }
  } finally {
    lock.releaseLock();
  }
}

function isPastDeliveryTime_(user) {
  var nowHm = Utilities.formatDate(new Date(), user.timezone || "Asia/Tokyo", "HH:mm");
  return nowHm >= (user.deliveryTime || "06:30");
}

function sendLetterEmail_(user, letter) {
  var siteUrl = getProp_("SITE_URL") || "";
  var token = (user.tokens && user.tokens[0]) || "";
  var readUrl = siteUrl + "#/auth?token=" + encodeURIComponent(token) + "&next=" + encodeURIComponent("/letter/" + letter.day);
  var settingsUrl = siteUrl + "#/auth?token=" + encodeURIComponent(token) + "&next=" + encodeURIComponent("/settings");
  var subject = "【Day" + letter.day + "】1年後のあなたから手紙が届きました";
  var excerpt = (letter.body || "").split("\n").filter(function (l) { return l.trim(); })[1] || "";
  var html = buildEmailHtml_(user, letter, excerpt, readUrl, settingsUrl);
  GmailApp.sendEmail(user.email, subject, stripHtml_(html), { htmlBody: html, name: "Future Letter 30days" });
}

function buildEmailHtml_(user, letter, excerpt, readUrl, settingsUrl) {
  return "" +
    '<div style="font-family:sans-serif;background:#faf7f0;padding:32px 16px;">' +
    '<div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e4ddc9;">' +
    '<p style="color:#8a836a;font-size:12px;letter-spacing:0.08em;margin:0 0 8px;">FUTURE LETTER 30DAYS</p>' +
    '<h1 style="font-size:20px;color:#33301f;margin:0 0 16px;">' + escapeHtml_(user.name) + "さんへ" + "</h1>" +
    '<p style="color:#5c5842;font-size:15px;line-height:1.8;margin:0 0 16px;"><strong>' + escapeHtml_(letter.title) + "</strong></p>" +
    '<p style="color:#5c5842;font-size:15px;line-height:1.8;margin:0 0 24px;">' + escapeHtml_(excerpt) + "…</p>" +
    '<a href="' + readUrl + '" style="display:inline-block;background:#4a6a3d;color:#fbfaf5;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:bold;">今日の手紙を読む</a>' +
    '<p style="margin-top:32px;font-size:12px;color:#8a836a;">配信の停止・設定変更は<a href="' + settingsUrl + '" style="color:#8a836a;">こちら</a></p>' +
    "</div></div>";
}

function stripHtml_(html) {
  return html.replace(/<[^>]+>/g, "").replace(/\s+\n/g, "\n").trim();
}

function escapeHtml_(text) {
  return String(text == null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sendMagicLinkEmail_(user, token) {
  var siteUrl = getProp_("SITE_URL") || "";
  var url = siteUrl + "#/auth?token=" + encodeURIComponent(token);
  var subject = "Future Letter 30daysへのログインリンク";
  var html =
    '<div style="font-family:sans-serif;padding:24px;">' +
    "<p>" + escapeHtml_(user.name) + "さん</p>" +
    '<p>下のボタンからログインできます。</p>' +
    '<a href="' + url + '" style="display:inline-block;background:#4a6a3d;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;">ログインする</a>' +
    "</div>";
  GmailApp.sendEmail(user.email, subject, "こちらのリンクからログインしてください: " + url, { htmlBody: html, name: "Future Letter 30days" });
}
