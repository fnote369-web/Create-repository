function getProp_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function generateToken_(byteLength) {
  byteLength = byteLength || 24;
  var bytes = [];
  for (var i = 0; i < byteLength; i++) bytes.push(Math.floor(Math.random() * 256));
  // Utilities.getUuid() alone is not long enough / not hex; combine with random bytes via Utilities.
  var uuidPart = Utilities.getUuid().replace(/-/g, "");
  var randPart = bytes.map(function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  return (uuidPart + randPart).slice(0, byteLength * 2);
}

function generateUserId_() {
  return "u_" + generateToken_(12);
}

function todayInTimezone_(timezone) {
  return Utilities.formatDate(new Date(), timezone || "Asia/Tokyo", "yyyy-MM-dd");
}

function addDays_(isoDate, days) {
  var parts = isoDate.split("-").map(Number);
  var dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  dt.setUTCDate(dt.getUTCDate() + days);
  return Utilities.formatDate(dt, "UTC", "yyyy-MM-dd");
}

function diffDays_(isoFrom, isoTo) {
  var f = isoFrom.split("-").map(Number);
  var t = isoTo.split("-").map(Number);
  var from = Date.UTC(f[0], f[1] - 1, f[2]);
  var to = Date.UTC(t[0], t[1] - 1, t[2]);
  return Math.round((to - from) / 86400000);
}

function currentDeliveryDay_(deliveryStartDate, timezone) {
  var today = todayInTimezone_(timezone);
  return diffDays_(deliveryStartDate, today) + 1;
}

function computeDay_(user) {
  if (user.testDayOverride != null) return user.testDayOverride;
  return currentDeliveryDay_(user.deliveryStartDate, user.timezone);
}

function clampDay_(day) {
  return Math.min(Math.max(day, 0), 30);
}

function maskEmail_(email) {
  if (!email) return "";
  var atIdx = email.indexOf("@");
  if (atIdx === -1) return email;
  var local = email.slice(0, atIdx);
  var domain = email.slice(atIdx + 1);
  var visible = local.slice(0, 2);
  var stars = new Array(Math.max(local.length - 2, 1) + 1).join("*");
  return visible + stars + "@" + domain;
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function csvEscape_(value) {
  var s = String(value == null ? "" : value);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ok_(data) { return { ok: true, data: data }; }
function fail_(message, code) { return { ok: false, error: message, code: code || null }; }

function appError_(message, code) {
  var e = new Error(message);
  e.code = code;
  return e;
}
