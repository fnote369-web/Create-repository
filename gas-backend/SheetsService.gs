/**
 * Sheet access layer. All user/log data lives in one spreadsheet
 * (Script Property SPREADSHEET_ID). Nested data (answers, letters,
 * read-state, tokens) is stored as JSON text in a single cell — Sheets
 * is used as a simple document store here, not a relational database.
 */

var USERS_SHEET = "Users";
var SENDLOG_SHEET = "SendLog";
var ERRORLOG_SHEET = "ErrorLog";

var USER_COLUMNS = [
  "userId", "name", "email", "timezone", "deliveryStartDate", "deliveryTime",
  "targetDate", "status", "mode", "testDayOverride", "consentAt",
  "createdAt", "updatedAt", "answersJson", "lettersJson", "readStateJson", "tokensJson",
];

var SENDLOG_COLUMNS = ["userId", "day", "sentAt", "status", "note"];
var ERRORLOG_COLUMNS = ["userId", "day", "at", "message"];

function getSpreadsheet_() {
  var id = getProp_("SPREADSHEET_ID");
  if (!id) throw new Error("SPREADSHEET_IDが設定されていません。スクリプトプロパティを確認してください。");
  return SpreadsheetApp.openById(id);
}

function ensureSheet_(name, columns) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(columns);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function usersSheet_() { return ensureSheet_(USERS_SHEET, USER_COLUMNS); }
function sendLogSheet_() { return ensureSheet_(SENDLOG_SHEET, SENDLOG_COLUMNS); }
function errorLogSheet_() { return ensureSheet_(ERRORLOG_SHEET, ERRORLOG_COLUMNS); }

function rowToObject_(headerRow, dataRow) {
  var obj = {};
  for (var i = 0; i < headerRow.length; i++) {
    obj[headerRow[i]] = dataRow[i];
  }
  return obj;
}

function objectToRow_(columns, obj) {
  return columns.map(function (c) { return obj[c] !== undefined ? obj[c] : ""; });
}

/** Returns { rowIndex (1-based incl. header), user } or null. rowIndex is the sheet row number. */
function findUserRow_(sheet, predicate) {
  var values = sheet.getDataRange().getValues();
  var header = values[0];
  for (var i = 1; i < values.length; i++) {
    var obj = rowToObject_(header, values[i]);
    if (predicate(obj)) {
      return { rowIndex: i + 1, user: deserializeUser_(obj) };
    }
  }
  return null;
}

function getAllUsers_() {
  var sheet = usersSheet_();
  var values = sheet.getDataRange().getValues();
  var header = values[0];
  var out = [];
  for (var i = 1; i < values.length; i++) {
    out.push(deserializeUser_(rowToObject_(header, values[i])));
  }
  return out;
}

function deserializeUser_(obj) {
  return {
    userId: obj.userId,
    name: obj.name,
    email: obj.email,
    timezone: obj.timezone || "Asia/Tokyo",
    deliveryStartDate: obj.deliveryStartDate,
    deliveryTime: obj.deliveryTime || "06:30",
    targetDate: obj.targetDate,
    status: obj.status || "active",
    mode: obj.mode || "template",
    testDayOverride: obj.testDayOverride === "" || obj.testDayOverride == null ? null : Number(obj.testDayOverride),
    consentAt: obj.consentAt,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    answers: safeParseJson_(obj.answersJson, {}),
    letters: safeParseJson_(obj.lettersJson, []),
    readState: safeParseJson_(obj.readStateJson, {}),
    tokens: safeParseJson_(obj.tokensJson, []),
  };
}

function serializeUser_(user) {
  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
    timezone: user.timezone,
    deliveryStartDate: user.deliveryStartDate,
    deliveryTime: user.deliveryTime,
    targetDate: user.targetDate,
    status: user.status,
    mode: user.mode,
    testDayOverride: user.testDayOverride == null ? "" : user.testDayOverride,
    consentAt: user.consentAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    answersJson: JSON.stringify(user.answers || {}),
    lettersJson: JSON.stringify(user.letters || []),
    readStateJson: JSON.stringify(user.readState || {}),
    tokensJson: JSON.stringify(user.tokens || []),
  };
}

function safeParseJson_(text, fallback) {
  if (!text) return fallback;
  try { return JSON.parse(text); } catch (e) { return fallback; }
}

function insertUser_(user) {
  var sheet = usersSheet_();
  sheet.appendRow(objectToRow_(USER_COLUMNS, serializeUser_(user)));
}

function saveUserByRow_(rowIndex, user) {
  var sheet = usersSheet_();
  user.updatedAt = new Date().toISOString();
  var row = objectToRow_(USER_COLUMNS, serializeUser_(user));
  sheet.getRange(rowIndex, 1, 1, USER_COLUMNS.length).setValues([row]);
}

function findUserByEmail_(email) {
  var sheet = usersSheet_();
  return findUserRow_(sheet, function (o) { return String(o.email).toLowerCase() === String(email).toLowerCase(); });
}

function findUserById_(userId) {
  var sheet = usersSheet_();
  return findUserRow_(sheet, function (o) { return o.userId === userId; });
}

function findUserByToken_(token) {
  var sheet = usersSheet_();
  return findUserRow_(sheet, function (o) {
    var tokens = safeParseJson_(o.tokensJson, []);
    return tokens.indexOf(token) !== -1;
  });
}

function appendSendLog_(userId, day, status, note) {
  var sheet = sendLogSheet_();
  sheet.appendRow([userId, day, new Date().toISOString(), status, note || ""]);
}

function getSendLogForUser_(userId) {
  var sheet = sendLogSheet_();
  var values = sheet.getDataRange().getValues();
  var header = values[0];
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var obj = rowToObject_(header, values[i]);
    if (obj.userId === userId) out.push(obj);
  }
  return out;
}

function appendErrorLog_(userId, day, message) {
  var sheet = errorLogSheet_();
  sheet.appendRow([userId, day, new Date().toISOString(), message]);
}

function getErrorLogForUser_(userId) {
  var sheet = errorLogSheet_();
  var values = sheet.getDataRange().getValues();
  var header = values[0];
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var obj = rowToObject_(header, values[i]);
    if (obj.userId === userId) out.push(obj);
  }
  return out;
}
