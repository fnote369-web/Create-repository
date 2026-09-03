import { localBackend } from "./localBackend.js";
import { gasBackend } from "./gasBackend.js";
import { storage } from "./storage.js";

const hasRealBackend = Boolean(import.meta.env.VITE_API_BASE_URL);

// The whole app talks to `api`, never to local/gasBackend directly, so that
// switching from the free local demo to the real Google Apps Script backend
// is a single environment variable (VITE_API_BASE_URL) — no code changes.
export const api = hasRealBackend ? gasBackend : localBackend;
export const backendMode = hasRealBackend ? "gas" : "local";

// Onboarding drafts are always kept in this browser (there is no account
// yet to attach them to), regardless of which backend is active.
export const draftStore = {
  save(draft) {
    storage.set("fl30_onboarding_draft", { draft, savedAt: new Date().toISOString() });
  },
  load() {
    return storage.get("fl30_onboarding_draft", null);
  },
  clear() {
    storage.remove("fl30_onboarding_draft");
  },
};
