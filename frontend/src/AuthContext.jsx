import { createContext, useContext, useEffect, useState } from "react";
import { api, clearAuth, getAuth, setAuth } from "./api.js";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getAuth()?.user || null);

  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener("sf-logout", onLogout);
    return () => window.removeEventListener("sf-logout", onLogout);
  }, []);

  const finish = (data) => {
    setAuth({ token: data.token, user: data.user });
    setUser(data.user);
    return data.user;
  };

  const login = async (form) => finish(await api.post("/auth/login/", form));
  const register = async (form) => finish(await api.post("/auth/register/", form));
  const logout = async () => {
    try { await api.post("/auth/logout/"); } catch { /* ignore */ }
    clearAuth();
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, login, register, logout }}>{children}</AuthCtx.Provider>;
}
