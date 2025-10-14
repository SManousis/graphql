
import { useAuth } from "./auth/useAuth";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const { token } = useAuth();
  return token ? <Dashboard /> : <LoginPage />;
}
