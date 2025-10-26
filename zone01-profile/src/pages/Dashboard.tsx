import React, { useMemo } from "react";
import { useAuth } from "../auth/useAuth";
import { useMe, useXpData, usePassFailData } from "../hooks/useGraph";
import SvgXpOverTime from "../components/SvgXpOverTime";
import SvgXpByProject from "../components/SvgXpByProject";
import SvgPassFailDonut from "../components/SvgPassFailDonut";
import NavBar from "../components/NavBar";

export default function Dashboard() {
  const { data: me, loading: loadMe } = useMe();
  const { txs, objects, loading: loadTx } = useXpData();
  const { passCount, failCount, passRate, total, loading: loadPF } = usePassFailData();

  const totalXp = useMemo(() => txs.reduce((s, t) => s + t.amount, 0), [txs]);
  const projectsCount = useMemo(() => new Set(txs.map(t => t.objectId)).size, [txs]);

  if (loadMe || loadTx || loadPF) return <p style={{ padding: 24 }}>Loading…</p>;
  if (!me) return <p style={{ padding: 24 }}>No user data.</p>;

  return (
    <>
      <NavBar />
      <main className="container" style={{ paddingTop: 20 }}>
        {/* KPIs */}
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

        {/* Profile + Donut */}
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
