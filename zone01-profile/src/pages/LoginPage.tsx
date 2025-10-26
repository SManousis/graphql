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
    setErr(null); setLoading(true);
    try {
      await login(identity, password);
    } catch (e: unknown) {
      setErr(messageFromError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: "grid", placeItems: "center", minHeight: "100dvh" }}>
      <div className="card" style={{ width: 380, padding: 20 }}>
        <h2 style={{ margin: 0, marginBottom: 8 }}>Sign in</h2>
        <p style={{ color: "var(--muted)", marginTop: 0, marginBottom: 16 }}>
          Use your Zone01 credentials (username/email + password).
        </p>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
              Username or Email
            </label>
            <input className="input" value={identity} onChange={(ev) => setIdentity(ev.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
              Password
            </label>
            <input type="password" className="input" value={password} onChange={(ev) => setPassword(ev.target.value)} />
          </div>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
          {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
        </form>
      </div>
    </div>
  );
}

