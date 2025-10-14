import React, { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { messageFromError } from "../lib/errors";

export default function LoginPage() {
  const { login } = useAuth();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(identity, password);
    } catch (e: unknown) {
      setErr(messageFromError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "64px auto", padding: 24, border: "1px solid #ddd", borderRadius: 12 }}>
      <h2>Zone01 Login</h2>
      <form onSubmit={onSubmit}>
        <label>Username or Email</label>
        <input value={identity} onChange={(ev) => setIdentity(ev.target.value)} style={{ width: "100%", marginBottom: 12 }} />
        <label>Password</label>
        <input type="password" value={password} onChange={(ev) => setPassword(ev.target.value)} style={{ width: "100%", marginBottom: 12 }} />
        <button disabled={loading} style={{ width: "100%" }}>{loading ? "Signing in…" : "Sign in"}</button>
        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </form>
    </div>
  );
}
