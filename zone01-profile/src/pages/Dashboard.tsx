
import { useAuth } from "../auth/useAuth";
import { useMe, useXpData } from "../hooks/useGraph";
import SvgXpOverTime from "../components/SvgXpOverTime";
import SvgXpByProject from "../components/SvgXpByProject";

export default function Dashboard() {
  const { logout } = useAuth();
  const { data: me, loading: loadMe } = useMe();
  const { txs, objects, loading: loadTx } = useXpData();

  if (loadMe || loadTx) return <p style={{ padding: 24 }}>Loading…</p>;
  if (!me) return <p style={{ padding: 24 }}>No user data.</p>;

  return (
    <div style={{ padding: 24, maxWidth: 920, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2>Welcome, {me.firstName || me.login}</h2>
        <button onClick={logout}>Logout</button>
      </header>

      <section style={{ marginBottom: 24, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h3>Profile</h3>
        <p><b>Login:</b> {me.login}</p>
        {me.email && <p><b>Email:</b> {me.email}</p>}
      </section>

      <section style={{ marginBottom: 24, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h3>XP Over Time</h3>
        <SvgXpOverTime txs={txs} />
      </section>

      <section style={{ marginBottom: 24, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h3>XP by Project</h3>
        <SvgXpByProject txs={txs} objects={objects} />
      </section>
    </div>
  );
}
