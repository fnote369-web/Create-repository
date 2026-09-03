// Local/demo backend: implements the exact same interface as gasBackend.js,
// but stores everything in this browser's localStorage instead of a Google
// Sheet. This lets the whole product be clicked through and tested with
// zero external setup (no Google account, no deployment).
//
// Honest limits vs. the real backend:
//   - Data does NOT sync across devices/browsers (localStorage is per-browser).
//   - No real email is sent — "delivery" is simulated as a log entry the
//     moment a day unlocks, and the admin's "test send" just renders a
//     preview instead of calling Gmail.
//   - Automatic delivery while the app/tab is closed is impossible from a
//     browser alone — real unattended delivery requires the GAS backend's
//     time-driven trigger (see /gas-backend).
// Switch VITE_API_BASE_URL to a deployed GAS Web App URL to get the real
// cross-device, always-on behavior described in the spec.

import { storage } from "./storage.js";
import { generateUserId, generateToken } from "./id.js";
import { currentDeliveryDay, todayInTimezone, addDays } from "./date.js";
import { generateTemplateLetters, buildEmailPreview } from "./letters.js";

const NS = "fl30_local";
const REGISTRY_KEY = `${NS}:registry`; // [{userId, name, email, createdAt}]
const ADMIN_PASSWORD_DEFAULT = "future-letter-admin"; // change via Settings.jsx-configurable env below
const ADMIN_PASSWORD = import.meta.env.VITE_LOCAL_ADMIN_PASSWORD || ADMIN_PASSWORD_DEFAULT;

function userKey(userId) {
  return `${NS}:user:${userId}`;
}
function tokenIndexKey(token) {
  return `${NS}:token:${token}`;
}

function loadRegistry() {
  return storage.get(REGISTRY_KEY, []);
}
function saveRegistry(list) {
  storage.set(REGISTRY_KEY, list);
}

function loadUser(userId) {
  return storage.get(userKey(userId), null);
}
function saveUser(user) {
  user.updatedAt = new Date().toISOString();
  storage.set(userKey(user.userId), user);
}

function requireUserByToken(token) {
  const userId = storage.get(tokenIndexKey(token), null);
  if (!userId) return null;
  return loadUser(userId);
}

function computeDay(user) {
  if (user.testDayOverride != null) return user.testDayOverride;
  return currentDeliveryDay(user.deliveryStartDate, user.timezone);
}

function syncSendLog(user) {
  const day = Math.min(Math.max(computeDay(user), 0), 30);
  for (let d = 1; d <= day; d += 1) {
    const exists = user.sendLog.some((l) => l.day === d);
    if (!exists) {
      user.sendLog.push({
        day: d,
        sentAt: new Date().toISOString(),
        status: "sent",
        simulated: true,
      });
    }
  }
}

function publicUser(user) {
  const day = Math.min(Math.max(computeDay(user), 0), 31);
  return {
    userId: user.userId,
    name: user.name,
    email: maskEmail(user.email),
    timezone: user.timezone,
    deliveryStartDate: user.deliveryStartDate,
    deliveryTime: user.deliveryTime,
    targetDate: user.targetDate,
    status: user.status,
    mode: user.mode,
    tone: user.answers.tone,
    currentDay: Math.min(day, 30),
    isComplete: day >= 30,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    testMode: user.testDayOverride != null,
  };
}

function maskEmail(email) {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

export const localBackend = {
  mode: "local",

  async registerUser(payload) {
    const userId = generateUserId();
    const token = generateToken();
    const now = new Date().toISOString();
    const registry = loadRegistry();
    if (registry.some((r) => r.email.toLowerCase() === payload.email.toLowerCase())) {
      const err = new Error("このメールアドレスはすでに登録されています。");
      err.code = "DUPLICATE_EMAIL";
      throw err;
    }
    const letters = generateTemplateLetters(payload.answers);
    const user = {
      userId,
      name: payload.name,
      email: payload.email,
      timezone: payload.timezone || "Asia/Tokyo",
      deliveryStartDate: payload.deliveryStartDate,
      deliveryTime: payload.deliveryTime || "06:30",
      targetDate: payload.targetDate || null,
      answers: payload.answers,
      status: "active",
      mode: "template",
      testDayOverride: null,
      letters,
      readState: {},
      sendLog: [],
      errorLog: [],
      consentAt: now,
      createdAt: now,
      updatedAt: now,
      tokens: [token],
    };
    syncSendLog(user);
    saveUser(user);
    storage.set(tokenIndexKey(token), userId);
    registry.push({ userId, name: user.name, email: user.email, createdAt: now });
    saveRegistry(registry);
    storage.set("fl30_session_token", token);
    return { token, user: publicUser(user) };
  },

  async getSession(token) {
    const user = requireUserByToken(token);
    if (!user) return null;
    syncSendLog(user);
    saveUser(user);
    return {
      user: publicUser(user),
      letters: user.letters.map((l) => visibleLetter(user, l)),
      readState: user.readState,
    };
  },

  async requestMagicLink(email) {
    const registry = loadRegistry();
    const found = registry.find((r) => r.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) {
      const err = new Error("このメールアドレスの登録が見つかりませんでした。");
      err.code = "NOT_FOUND";
      throw err;
    }
    const token = generateToken();
    storage.set(tokenIndexKey(token), found.userId);
    const user = loadUser(found.userId);
    user.tokens.push(token);
    saveUser(user);
    // Local mode has no real mail server, so we hand the link back directly
    // instead of emailing it — clearly surfaced in the UI as a demo affordance.
    return { demoLoginToken: token };
  },

  async consumeMagicToken(token) {
    const user = requireUserByToken(token);
    if (!user) throw new Error("リンクの有効期限が切れているか、無効です。");
    storage.set("fl30_session_token", token);
    return { token, user: publicUser(user) };
  },

  async markLetterRead(token, day) {
    const user = requireUserByToken(token);
    if (!user) throw new Error("セッションが見つかりません。");
    user.readState[day] = { ...(user.readState[day] || {}), read: true, readAt: new Date().toISOString() };
    saveUser(user);
    return { ok: true };
  },

  async saveMemo(token, day, memo) {
    const user = requireUserByToken(token);
    if (!user) throw new Error("セッションが見つかりません。");
    user.readState[day] = { ...(user.readState[day] || {}), memo };
    saveUser(user);
    return { ok: true };
  },

  async setDeliveryStatus(token, status) {
    const user = requireUserByToken(token);
    if (!user) throw new Error("セッションが見つかりません。");
    user.status = status;
    saveUser(user);
    return { ok: true, user: publicUser(user) };
  },

  async changeEmail(token, newEmail) {
    const user = requireUserByToken(token);
    if (!user) throw new Error("セッションが見つかりません。");
    const registry = loadRegistry();
    const idx = registry.findIndex((r) => r.userId === user.userId);
    user.email = newEmail;
    if (idx >= 0) registry[idx].email = newEmail;
    saveRegistry(registry);
    saveUser(user);
    return { ok: true, user: publicUser(user) };
  },

  async resetAccount(token) {
    const user = requireUserByToken(token);
    if (!user) throw new Error("セッションが見つかりません。");
    user.deliveryStartDate = todayInTimezone(user.timezone);
    user.status = "active";
    user.readState = {};
    user.sendLog = [];
    user.testDayOverride = null;
    user.letters = generateTemplateLetters(user.answers);
    saveUser(user);
    return { ok: true, user: publicUser(user) };
  },

  async deleteAccount(token) {
    const user = requireUserByToken(token);
    if (!user) throw new Error("セッションが見つかりません。");
    const registry = loadRegistry().filter((r) => r.userId !== user.userId);
    saveRegistry(registry);
    user.tokens.forEach((t) => storage.remove(tokenIndexKey(t)));
    storage.remove(userKey(user.userId));
    storage.remove("fl30_session_token");
    return { ok: true };
  },

  // ---- admin ----
  async adminLogin(password) {
    if (password !== ADMIN_PASSWORD) {
      const err = new Error("パスワードが違います。");
      err.code = "UNAUTHORIZED";
      throw err;
    }
    const token = generateToken();
    storage.set("fl30_admin_session", { token, at: Date.now() });
    return { adminToken: token };
  },

  _checkAdmin(adminToken) {
    const sess = storage.get("fl30_admin_session", null);
    if (!sess || sess.token !== adminToken) {
      const err = new Error("管理者セッションが無効です。再度ログインしてください。");
      err.code = "UNAUTHORIZED";
      throw err;
    }
  },

  async adminStats(adminToken) {
    this._checkAdmin(adminToken);
    const registry = loadRegistry();
    const users = registry.map((r) => loadUser(r.userId)).filter(Boolean);
    return {
      total: users.length,
      active: users.filter((u) => u.status === "active" && computeDay(u) < 30).length,
      completed: users.filter((u) => computeDay(u) >= 30).length,
      paused: users.filter((u) => u.status === "paused").length,
    };
  },

  async adminListUsers(adminToken, { search = "" } = {}) {
    this._checkAdmin(adminToken);
    const registry = loadRegistry();
    const users = registry.map((r) => loadUser(r.userId)).filter(Boolean);
    const filtered = users.filter((u) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
    return filtered.map((u) => ({
      userId: u.userId,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      deliveryStartDate: u.deliveryStartDate,
      currentDay: Math.min(Math.max(computeDay(u), 0), 30),
      status: u.status,
      lastSentAt: u.sendLog.at(-1)?.sentAt || null,
      errorCount: u.errorLog.length,
    }));
  },

  async adminGetUser(adminToken, userId) {
    this._checkAdmin(adminToken);
    const user = loadUser(userId);
    if (!user) throw new Error("利用者が見つかりません。");
    return {
      ...publicUser(user),
      emailRaw: user.email,
      answers: user.answers,
      letters: user.letters,
      readState: user.readState,
      sendLog: user.sendLog,
      errorLog: user.errorLog,
    };
  },

  async adminSetUserStatus(adminToken, userId, status) {
    this._checkAdmin(adminToken);
    const user = loadUser(userId);
    if (!user) throw new Error("利用者が見つかりません。");
    user.status = status;
    saveUser(user);
    return { ok: true };
  },

  async adminSendTestMail(adminToken, userId, day) {
    this._checkAdmin(adminToken);
    const user = loadUser(userId);
    if (!user) throw new Error("利用者が見つかりません。");
    const letter = user.letters.find((l) => l.day === Number(day));
    if (!letter) throw new Error("指定のDayの手紙が見つかりません。");
    return { ok: true, preview: buildEmailPreview(letter, user.name), note: "ローカルモードのため実際のメール送信は行われません（プレビューのみ）。" };
  },

  async adminSendManualDay(adminToken, userId, day) {
    this._checkAdmin(adminToken);
    const user = loadUser(userId);
    if (!user) throw new Error("利用者が見つかりません。");
    const already = user.sendLog.some((l) => l.day === Number(day));
    if (already) {
      return { ok: false, message: `Day${day}はすでに送信済みです（二重配信防止）。` };
    }
    user.sendLog.push({ day: Number(day), sentAt: new Date().toISOString(), status: "sent", manual: true });
    saveUser(user);
    return { ok: true };
  },

  async adminExportCsv(adminToken) {
    this._checkAdmin(adminToken);
    const registry = loadRegistry();
    const users = registry.map((r) => loadUser(r.userId)).filter(Boolean);
    const header = ["userId", "name", "email", "createdAt", "deliveryStartDate", "currentDay", "status", "lastSentAt"];
    const rows = users.map((u) => [
      u.userId,
      u.name,
      u.email,
      u.createdAt,
      u.deliveryStartDate,
      Math.min(Math.max(computeDay(u), 0), 30),
      u.status,
      u.sendLog.at(-1)?.sentAt || "",
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
    return { csv };
  },

  async adminResetUser(adminToken, userId) {
    this._checkAdmin(adminToken);
    const user = loadUser(userId);
    if (!user) throw new Error("利用者が見つかりません。");
    user.deliveryStartDate = todayInTimezone(user.timezone);
    user.status = "active";
    user.readState = {};
    user.sendLog = [];
    user.testDayOverride = null;
    user.letters = generateTemplateLetters(user.answers);
    saveUser(user);
    return { ok: true };
  },

  // ---- test mode (admin-authenticated) ----
  async testSetDay(adminToken, userId, day) {
    this._checkAdmin(adminToken);
    const user = loadUser(userId);
    if (!user) throw new Error("利用者が見つかりません。");
    user.testDayOverride = day === null ? null : Number(day);
    syncSendLog(user);
    saveUser(user);
    return { ok: true, user: publicUser(user) };
  },

  async testAdvanceDay(adminToken, userId) {
    this._checkAdmin(adminToken);
    const user = loadUser(userId);
    if (!user) throw new Error("利用者が見つかりません。");
    const current = user.testDayOverride ?? computeDay(user);
    user.testDayOverride = Math.min(current + 1, 31);
    syncSendLog(user);
    saveUser(user);
    return { ok: true, user: publicUser(user) };
  },
};

function visibleLetter(user, letter) {
  const day = Math.min(Math.max(computeDay(user), 0), 30);
  const unlocked = letter.day <= day;
  if (unlocked) return { ...letter, locked: false };
  return { day: letter.day, phase: letter.phase, locked: true };
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}
