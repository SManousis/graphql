import  { useMemo } from "react";
import { useMe, useXpData, usePassFailData, useRecentResults } from "../hooks/useGraph";
import SvgXpOverTime from "../components/SvgXpOverTime";
import SvgXpByProject from "../components/SvgXpByProject";
import SvgPassFailDonut from "../components/SvgPassFailDonut";
import NavBar from "../components/NavBar";

// Dashboard stitches together multiple hooks and charts to provide a single glance view of progress.
export default function Dashboard() {
  const { data: me, loading: loadMe } = useMe();
  const { txs, objects, loading: loadTx } = useXpData();
  const { passCount, failCount, passRate, total, loading: loadPF } = usePassFailData(me?.id);
  const { rows: recent, loading: loadRecent } = useRecentResults(5, me?.id);
  
  const totalXp = useMemo(() => txs.reduce((s, t) => s + t.amount, 0), [txs]); // aggregated for KPI tile
  const projectsCount = useMemo(() => new Set(txs.map(t => t.objectId)).size, [txs]); // unique projects receiving XP

  if (loadMe || loadTx || loadPF) return <p style={{ padding: 24 }}>Loading...</p>;
  if (!me) return <p style={{ padding: 24 }}>No user data.</p>;

  return (
    <>
      <NavBar />
      <main className="container" style={{ paddingTop: 20 }}>
        {/* KPIs summarize the main stats before diving into detailed visuals */}
        <section className="kpis" style={{ marginBottom: 16 }}>
          <div className="kpi">
            <div className="label">Total XP</div>
            <div className="value">{totalXp.toLocaleString()}</div>
          </div>
          <div className="kpi">
            <div className="label">Projects w/ XP</div>
            <div className="value">{projectsCount}</div>
          </div>
          <div className="kpi">
            <div className="label">Pass rate</div>
            <div className="value">{Math.round(passRate * 100)}%</div>
          </div>
        </section>
        <section className="card" style={{ marginBottom: 16 }}>
          <h3>Recent Results (nested)</h3>
          {loadRecent ? <p>Loading...</p> : (
            <div style={{ display: "grid", gap: 6 }}>
              {recent.map(r => {
                const pass = Number(r.grade) >= 1;
                const when = r.updatedAt ?? r.createdAt;
                return (
                  <div key={r.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 9999, background: pass ? "var(--success)" : "var(--danger)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{r.object?.name ?? `#${r.object?.id ?? "-"}`}</div>
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>
                        by {r.user?.login ?? "me"} • {new Date(when).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700 }}>{pass ? "PASS" : "FAIL"}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        {/* Profile + Donut block pairs human context with assessment outcome */}
        <section className="grid grid-2" style={{ marginBottom: 16 }}>
          <div className="card">
            <h3>Profile</h3>
            <div style={{ display: "grid", gap: 4 }}>
              <div><b>Login:</b> {me.login}</div>
              {me.email && <div><b>Email:</b> {me.email}</div>}
              {(me.firstName || me.lastName) && (
                <div><b>Name:</b> {[me.firstName, me.lastName].filter(Boolean).join(" ")}</div>
              )}
            </div>
          </div>

          <div className="card">
            <h3>Pass vs Fail</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <SvgPassFailDonut pass={passCount} fail={failCount} />
              <div>
                <p><b>Total results:</b> {total}</p>
                <p><b>Passes:</b> {passCount}</p>
                <p><b>Fails:</b> {failCount}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Charts */}
        <section className="grid grid-2">
          <div className="card">
            <h3>XP Over Time</h3>
            <SvgXpOverTime txs={txs} />
          </div>
          <div className="card">
            <h3>XP by Project</h3>
            <SvgXpByProject txs={txs} objects={objects} />
          </div>
        </section>
      </main>
    </>
  );
}
