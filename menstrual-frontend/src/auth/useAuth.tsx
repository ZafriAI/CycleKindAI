import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
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
      try { const t = await SecureStore.getItemAsync("auth_token"); if (t) setToken(t); }
      finally { setLoading(false); }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    const t = res?.token ?? "demo"; // adjust to your API
    await SecureStore.setItemAsync("auth_token", t);
    setToken(t);
  };

  const register = async (email: string, password: string) => {
    await apiRegister(email, password);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("auth_token");
    await clearChat();
    setToken(null);
  };

  return <Ctx.Provider value={{ token, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
