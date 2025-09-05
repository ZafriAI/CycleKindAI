import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getString, saveString, deleteString } from "../storage";
import { login as apiLogin, register as apiRegister } from "../api";
import { clearChat } from "../chat/storage";

type AuthCtx = {
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await getString("token"); // ← use the same key as your API (see Fix #2)
        if (t) setToken(t);
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  // LOGIN: use the real field; saving here is okay even if api.login already saved
  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    const t = res.access_token;          // <-- was res?.token ?? "demo"
    await saveString("token", t);        // optional if you prefer saving only in api.ts
    setToken(t);
  };

  // REGISTER: also persist and set token so you’re authenticated right away
  const register = async (email: string, password: string) => {
    const res = await apiRegister(email, password);
    const t = res.access_token;          // make sure backend returns this
    await saveString("token", t);
    setToken(t);
  };

  const logout = async () => {
    await deleteString("token");     // ← storage helper
    await clearChat();
    setToken(null);
  };


  return <Ctx.Provider value={{ token, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
