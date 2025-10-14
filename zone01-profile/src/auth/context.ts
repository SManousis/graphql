import { createContext } from "react";

export type AuthCtx = {
  token: string | null;
  login: (identity: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthCtx | null>(null);