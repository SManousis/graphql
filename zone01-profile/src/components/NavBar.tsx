import React from "react";
import { useTheme } from "../ui/ThemeProvider";
import { useAuth } from "../auth/useAuth";

// NavBar renders the cross-application chrome: brand mark, theme toggle and logout button.
// The component stays sticky so the controls remain visible while navigating long dashboards.
export default function NavBar() {
  const { theme, toggle } = useTheme();
  const { logout } = useAuth();

  return (
    // Frosted glass treatment keeps the header legible without fully obscuring the page context.
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

        {/* Utility cluster docks to the right so theme/logout are instantly accessible */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {/* Toggle copies the current theme label so users always know target state */}
          <button className="btn btn-ghost" onClick={toggle} title="Toggle theme">
            {theme === "dark" ? "🌙 Dark" : "🔆 Light"}
          </button>
          <button className="btn" onClick={logout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}
