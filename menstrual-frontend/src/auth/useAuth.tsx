import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getString, saveString, deleteString } from "../storage";
import { login as apiLogin, register as apiRegister } from "../api";
import { clearChat } from "../chat/storage";

type AuthCtx = {
  token: string | null;
  email: string | null;                 // <—
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const t = await getString("token");
        const e = await getString("email");
        if (t) setToken(t);
        if (e) setEmail(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  // LOGIN: use the real field; saving here is okay even if api.login already saved
  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    const t = res.access_token;          // <-- was res?.token ?? "demo"
    await saveString("token", t);
    await saveString("email", email); // <- emailArg is the function param
    setToken(t);
    setEmail(email);
  };

  // REGISTER: also persist and set token so you’re authenticated right away
  const register = async (email: string, password: string) => {
    const res = await apiRegister(email, password);
    const t = res.access_token;          // make sure backend returns this
    await saveString("token", t);
    await saveString("email", email); // <- emailArg is the function param
    setToken(t);
    setEmail(email);
  };

  const logout = async () => {
    await deleteString("token");
    await deleteString("email");
    await clearChat();
    setToken(null);
    setEmail(null);
  };


  return <Ctx.Provider value={{ token, email, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
