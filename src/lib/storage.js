// Thin, crash-safe localStorage wrapper. Local mode uses this as its
// "device sync" layer; the session-token itself (see id.js) is also kept
// here so returning visitors can resume via the "続きから" button.

function safeParse(raw, fallback) {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export const storage = {
  get(key, fallback = null) {
    try {
      return safeParse(window.localStorage.getItem(key), fallback);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable (private mode, quota) — fail silently */
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* noop */
    }
  },
};

export const STORAGE_KEYS = {
  sessionToken: "fl30_session_token",
  onboardingDraft: "fl30_onboarding_draft",
  adminToken: "fl30_admin_token",
  testMode: "fl30_test_mode",
};
