import React, { useMemo, useState } from "react";
import { signin } from "../lib/api";
import { AuthContext, type AuthCtx } from "./context";

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(sessionStorage.getItem("z01_token"));

  const login = async (identity: string, password: string) => {
    const { token } = await signin(identity, password);
    setToken(token);
    sessionStorage.setItem("z01_token", token);
  };

  const logout = () => {
    setToken(null);
    sessionStorage.removeItem("z01_token");
  };

  const value: AuthCtx = useMemo(() => ({ token, login, logout }), [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
