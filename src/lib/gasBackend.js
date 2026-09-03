// Real backend adapter: talks to a deployed Google Apps Script Web App
// (see /gas-backend for the server-side code). Implements the exact same
// method names/shapes as localBackend.js so the rest of the app never
// needs to know which one is active (see api.js).
//
// GAS Web Apps do not let the server set custom CORS headers on a
// preflighted request, so every call here is a same-"simple-request" POST
// with Content-Type: text/plain (this avoids the CORS preflight entirely)
// carrying a JSON string body. The GAS side parses e.postData.contents.

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function call(action, params = {}) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) {
    throw new Error(`通信に失敗しました（HTTP ${res.status}）。時間をおいて再度お試しください。`);
  }
  const json = await res.json();
  if (!json.ok) {
    const err = new Error(json.error || "処理に失敗しました。");
    err.code = json.code;
    throw err;
  }
  return json.data;
}

export const gasBackend = {
  mode: "gas",

  registerUser: (payload) => call("registerUser", { payload }),
  getSession: (token) => call("getSession", { token }),
  requestMagicLink: (email) => call("requestMagicLink", { email }),
  consumeMagicToken: (token) => call("consumeMagicToken", { token }),
  markLetterRead: (token, day) => call("markLetterRead", { token, day }),
  saveMemo: (token, day, memo) => call("saveMemo", { token, day, memo }),
  setDeliveryStatus: (token, status) => call("setDeliveryStatus", { token, status }),
  changeEmail: (token, newEmail) => call("changeEmail", { token, newEmail }),
  resetAccount: (token) => call("resetAccount", { token }),
  deleteAccount: (token) => call("deleteAccount", { token }),

  adminLogin: (password) => call("adminLogin", { password }),
  adminStats: (adminToken) => call("adminStats", { adminToken }),
  adminListUsers: (adminToken, opts) => call("adminListUsers", { adminToken, ...opts }),
  adminGetUser: (adminToken, userId) => call("adminGetUser", { adminToken, userId }),
  adminSetUserStatus: (adminToken, userId, status) => call("adminSetUserStatus", { adminToken, userId, status }),
  adminSendTestMail: (adminToken, userId, day) => call("adminSendTestMail", { adminToken, userId, day }),
  adminSendManualDay: (adminToken, userId, day) => call("adminSendManualDay", { adminToken, userId, day }),
  adminExportCsv: (adminToken) => call("adminExportCsv", { adminToken }),
  adminResetUser: (adminToken, userId) => call("adminResetUser", { adminToken, userId }),

  testSetDay: (adminToken, userId, day) => call("testSetDay", { adminToken, userId, day }),
  testAdvanceDay: (adminToken, userId) => call("testAdvanceDay", { adminToken, userId }),
};
