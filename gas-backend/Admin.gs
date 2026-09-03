/**
 * Admin API handlers. Admin sessions are short-lived tokens held in
 * CacheService (auto-expires — no separate sheet/table needed).
 */

var ADMIN_SESSION_TTL_SEC = 6 * 60 * 60; // 6 hours

function adminLogin_(password) {
  var expected = getProp_("ADMIN_PASSWORD");
  if (!expected) throw appError_("ADMIN_PASSWORDが設定されていません。スクリプトプロパティを確認してください。", "SERVER_MISCONFIGURED");
  if (password !== expected) throw appError_("パスワードが違います。", "UNAUTHORIZED");
  var token = generateToken_();
  CacheService.getScriptCache().put("admin_session_" + token, "1", ADMIN_SESSION_TTL_SEC);
  return { adminToken: token };
}

function requireAdmin_(adminToken) {
  var cached = CacheService.getScriptCache().get("admin_session_" + adminToken);
  if (!cached) throw appError_("管理者セッションが無効です。再度ログインしてください。", "UNAUTHORIZED");
}

function adminStats_(adminToken) {
  requireAdmin_(adminToken);
  var users = getAllUsers_();
  var active = 0, completed = 0, paused = 0;
  users.forEach(function (u) {
    if (u.status === "paused") paused++;
    else if (u.status === "completed" || clampDay_(computeDay_(u)) >= 30) completed++;
    else if (u.status === "active") active++;
  });
  return { total: users.length, active: active, completed: completed, paused: paused };
}

function adminListUsers_(adminToken, search) {
  requireAdmin_(adminToken);
  var q = (search || "").trim().toLowerCase();
  var users = getAllUsers_().filter(function (u) {
    if (!q) return true;
    return u.name.toLowerCase().indexOf(q) !== -1 || u.email.toLowerCase().indexOf(q) !== -1;
  });
  return users.map(function (u) {
    var log = getSendLogForUser_(u.userId);
    var lastSent = log.length ? log[log.length - 1].sentAt : null;
    return {
      userId: u.userId,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      deliveryStartDate: u.deliveryStartDate,
      currentDay: clampDay_(computeDay_(u)),
      status: u.status,
      lastSentAt: lastSent,
      errorCount: getErrorLogForUser_(u.userId).length,
    };
  });
}

function adminGetUser_(adminToken, userId) {
  requireAdmin_(adminToken);
  var found = findUserById_(userId);
  if (!found) throw appError_("利用者が見つかりません。", "NOT_FOUND");
  var user = found.user;
  var pub = publicUser_(user);
  pub.emailRaw = user.email;
  pub.answers = user.answers;
  pub.letters = user.letters;
  pub.readState = user.readState;
  pub.sendLog = getSendLogForUser_(userId);
  pub.errorLog = getErrorLogForUser_(userId);
  return pub;
}

function adminSetUserStatus_(adminToken, userId, status) {
  requireAdmin_(adminToken);
  var found = findUserById_(userId);
  if (!found) throw appError_("利用者が見つかりません。", "NOT_FOUND");
  found.user.status = status;
  saveUserByRow_(found.rowIndex, found.user);
  return { ok: true };
}

function adminSendTestMail_(adminToken, userId, day) {
  requireAdmin_(adminToken);
  var found = findUserById_(userId);
  if (!found) throw appError_("利用者が見つかりません。", "NOT_FOUND");
  var letter = found.user.letters[Number(day) - 1];
  if (!letter) throw appError_("指定のDayの手紙が見つかりません。", "NOT_FOUND");
  sendLetterEmail_(found.user, letter);
  var excerpt = (letter.body || "").split("\n").filter(function (l) { return l.trim(); })[1] || "";
  return {
    ok: true,
    note: "テストメールを " + found.user.email + " 宛に送信しました。",
    preview: { subject: "【Day" + letter.day + "】1年後のあなたから手紙が届きました", name: found.user.name, title: letter.title, excerpt: excerpt },
  };
}

function adminSendManualDay_(adminToken, userId, day) {
  requireAdmin_(adminToken);
  var found = findUserById_(userId);
  if (!found) throw appError_("利用者が見つかりません。", "NOT_FOUND");
  var dayNum = Number(day);
  var already = getSendLogForUser_(userId).some(function (l) { return Number(l.day) === dayNum && l.status === "sent"; });
  if (already) return { ok: false, message: "Day" + dayNum + "はすでに送信済みです（二重配信防止）。" };
  var letter = found.user.letters[dayNum - 1];
  if (!letter) throw appError_("指定のDayの手紙が見つかりません。", "NOT_FOUND");
  try {
    sendLetterEmail_(found.user, letter);
    appendSendLog_(userId, dayNum, "sent", "manual");
    if (dayNum === 30) {
      found.user.status = "completed";
      saveUserByRow_(found.rowIndex, found.user);
    }
    return { ok: true };
  } catch (e) {
    appendSendLog_(userId, dayNum, "error", e.message);
    appendErrorLog_(userId, dayNum, e.message);
    throw appError_("送信に失敗しました: " + e.message, "SEND_FAILED");
  }
}

function adminExportCsv_(adminToken) {
  requireAdmin_(adminToken);
  var users = getAllUsers_();
  var header = ["userId", "name", "email", "createdAt", "deliveryStartDate", "currentDay", "status", "lastSentAt"];
  var rows = users.map(function (u) {
    var log = getSendLogForUser_(u.userId);
    var lastSent = log.length ? log[log.length - 1].sentAt : "";
    return [u.userId, u.name, u.email, u.createdAt, u.deliveryStartDate, clampDay_(computeDay_(u)), u.status, lastSent];
  });
  var csv = [header].concat(rows).map(function (r) { return r.map(csvEscape_).join(","); }).join("\n");
  return { csv: csv };
}

function adminResetUser_(adminToken, userId) {
  requireAdmin_(adminToken);
  var found = findUserById_(userId);
  if (!found) throw appError_("利用者が見つかりません。", "NOT_FOUND");
  var user = found.user;
  user.deliveryStartDate = todayInTimezone_(user.timezone);
  user.status = "active";
  user.readState = {};
  user.testDayOverride = null;
  user.letters = generateLettersForUser_(user.answers, user.mode);
  saveUserByRow_(found.rowIndex, user);
  return { ok: true };
}

function testSetDay_(adminToken, userId, day) {
  requireAdmin_(adminToken);
  var found = findUserById_(userId);
  if (!found) throw appError_("利用者が見つかりません。", "NOT_FOUND");
  found.user.testDayOverride = day === null || day === "" ? null : Number(day);
  saveUserByRow_(found.rowIndex, found.user);
  return { ok: true, user: publicUser_(found.user) };
}

function testAdvanceDay_(adminToken, userId) {
  requireAdmin_(adminToken);
  var found = findUserById_(userId);
  if (!found) throw appError_("利用者が見つかりません。", "NOT_FOUND");
  var user = found.user;
  var current = user.testDayOverride != null ? user.testDayOverride : computeDay_(user);
  user.testDayOverride = Math.min(current + 1, 31);
  saveUserByRow_(found.rowIndex, user);
  return { ok: true, user: publicUser_(user) };
}
