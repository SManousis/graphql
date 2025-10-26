import React from "react";
import { useTheme } from "../ui/ThemeProvider";
import { useAuth } from "../auth/useAuth";

export default function NavBar() {
  const { theme, toggle } = useTheme();
  const { logout } = useAuth();

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      backdropFilter: "blur(6px)",
      background: "color-mix(in oklab, var(--bg), transparent 10%)",
      borderBottom: "1px solid var(--border)",
      zIndex: 10
    }}>
      <div className="container" style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 12, paddingBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border)",
            display: "grid", placeItems: "center", fontWeight: 700
          }}>Z</div>
          <strong>Zone01 Profile</strong>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={toggle} title="Toggle theme">
            {theme === "dark" ? "🌙 Dark" : "🔆 Light"}
          </button>
          <button className="btn" onClick={logout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}
