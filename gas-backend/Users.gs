/**
 * User-facing API handlers (mirrors src/lib/localBackend.js one-for-one).
 */

function publicUser_(user) {
  var day = clampDay_(computeDay_(user));
  return {
    userId: user.userId,
    name: user.name,
    email: maskEmail_(user.email),
    timezone: user.timezone,
    deliveryStartDate: user.deliveryStartDate,
    deliveryTime: user.deliveryTime,
    targetDate: user.targetDate,
    status: user.status,
    mode: user.mode,
    tone: (user.answers || {}).tone,
    currentDay: day,
    isComplete: day >= 30,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    testMode: user.testDayOverride != null,
  };
}

function visibleLetter_(user, letter) {
  var day = clampDay_(computeDay_(user));
  if (letter.day <= day) return Object.assign({}, letter, { locked: false });
  return { day: letter.day, locked: true };
}

function registerUser_(payload) {
  if (!payload || !payload.name || !isValidEmail_(payload.email)) {
    throw appError_("入力内容を確認してください。", "INVALID_INPUT");
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var existing = findUserByEmail_(payload.email);
    if (existing) throw appError_("このメールアドレスはすでに登録されています。", "DUPLICATE_EMAIL");

    var now = new Date().toISOString();
    var token = generateToken_();
    var letters = generateLettersForUser_(payload.answers, payload.mode);
    var user = {
      userId: generateUserId_(),
      name: payload.name,
      email: payload.email,
      timezone: payload.timezone || "Asia/Tokyo",
      deliveryStartDate: payload.deliveryStartDate,
      deliveryTime: payload.deliveryTime || "06:30",
      targetDate: payload.targetDate || "",
      status: "active",
      mode: letters[0] && letters[0].source === "ai" ? "ai" : "template",
      testDayOverride: null,
      consentAt: now,
      createdAt: now,
      updatedAt: now,
      answers: payload.answers || {},
      letters: letters,
      readState: {},
      tokens: [token],
    };
    insertUser_(user);
    return { token: token, user: publicUser_(user) };
  } finally {
    lock.releaseLock();
  }
}

function getSession_(token) {
  var found = findUserByToken_(token);
  if (!found) return null;
  var user = found.user;
  return {
    user: publicUser_(user),
    letters: user.letters.map(function (l) { return visibleLetter_(user, l); }),
    readState: user.readState,
  };
}

function requestMagicLink_(email) {
  var found = findUserByEmail_(email);
  if (!found) throw appError_("このメールアドレスの登録が見つかりませんでした。", "NOT_FOUND");
  var user = found.user;
  var token = generateToken_();
  user.tokens.push(token);
  saveUserByRow_(found.rowIndex, user);
  sendMagicLinkEmail_(user, token);
  return { ok: true };
}

function consumeMagicToken_(token) {
  var found = findUserByToken_(token);
  if (!found) throw appError_("リンクの有効期限が切れているか、無効です。", "INVALID_TOKEN");
  return { token: token, user: publicUser_(found.user) };
}

function withUserByToken_(token, mutator) {
  var found = findUserByToken_(token);
  if (!found) throw appError_("セッションが見つかりません。", "UNAUTHORIZED");
  var result = mutator(found.user);
  saveUserByRow_(found.rowIndex, found.user);
  return result || { ok: true };
}

function markLetterRead_(token, day) {
  return withUserByToken_(token, function (user) {
    user.readState[day] = Object.assign({}, user.readState[day], { read: true, readAt: new Date().toISOString() });
  });
}

function saveMemo_(token, day, memo) {
  return withUserByToken_(token, function (user) {
    user.readState[day] = Object.assign({}, user.readState[day], { memo: memo });
  });
}

function setDeliveryStatus_(token, status) {
  return withUserByToken_(token, function (user) {
    user.status = status;
  });
}

function changeEmail_(token, newEmail) {
  if (!isValidEmail_(newEmail)) throw appError_("正しいメールアドレスを入力してください。", "INVALID_INPUT");
  return withUserByToken_(token, function (user) {
    user.email = newEmail;
  });
}

function resetAccount_(token) {
  return withUserByToken_(token, function (user) {
    user.deliveryStartDate = todayInTimezone_(user.timezone);
    user.status = "active";
    user.readState = {};
    user.testDayOverride = null;
    user.letters = generateLettersForUser_(user.answers, user.mode);
  });
}

function deleteAccount_(token) {
  var found = findUserByToken_(token);
  if (!found) throw appError_("セッションが見つかりません。", "UNAUTHORIZED");
  usersSheet_().deleteRow(found.rowIndex);
  return { ok: true };
}
