import React from "react";
import ReactDOM from "react-dom/client";
import AuthProvider from "./auth/AuthProvider";
import ThemeProvider from "./ui/ThemeProvider";
import App from "./App";
import "./ui/theme.css"; // add the theme

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);