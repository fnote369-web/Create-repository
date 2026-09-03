import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../lib/api.js";
import { storage, STORAGE_KEYS } from "../lib/storage.js";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [token, setToken] = useState(() => storage.get(STORAGE_KEYS.sessionToken, null));
  const [session, setSession] = useState(null); // { user, letters, readState }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  const refresh = useCallback(async ({ silent = false } = {}) => {
    const t = storage.get(STORAGE_KEYS.sessionToken, null);
    if (!t) {
      setSession(null);
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await api.getSession(t);
      if (!data) {
        storage.remove(STORAGE_KEYS.sessionToken);
        setToken(null);
        setSession(null);
      } else {
        setToken(t);
        setSession(data);
      }
    } catch (e) {
      setError(e.message || "読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Delivery day / lock status can change while the app stays open in the
  // background (a new calendar day arrives, or an admin adjusts test mode),
  // so re-sync quietly on every in-app navigation instead of only at boot.
  useEffect(() => {
    refresh({ silent: true });
  }, [location.pathname, refresh]);

  const login = useCallback(
    async (newToken) => {
      storage.set(STORAGE_KEYS.sessionToken, newToken);
      setToken(newToken);
      await refresh();
    },
    [refresh]
  );

  const logout = useCallback(() => {
    storage.remove(STORAGE_KEYS.sessionToken);
    setToken(null);
    setSession(null);
  }, []);

  const value = { token, session, loading, error, refresh, login, logout };
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
