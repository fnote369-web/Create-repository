import { createContext, useCallback, useContext, useState } from "react";
import { storage, STORAGE_KEYS } from "../lib/storage.js";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [adminToken, setAdminToken] = useState(() => storage.get(STORAGE_KEYS.adminToken, null));

  const setToken = useCallback((t) => {
    if (t) storage.set(STORAGE_KEYS.adminToken, t);
    else storage.remove(STORAGE_KEYS.adminToken);
    setAdminToken(t);
  }, []);

  return <AdminContext.Provider value={{ adminToken, setAdminToken: setToken }}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
