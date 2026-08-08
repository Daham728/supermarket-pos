import {
  Navigate,
  Route,
  Routes,
} from "react-router";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import PosPage from "./pages/PosPage";
import SalesPage from "./pages/SalesPage";

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/pos"
          element={<PosPage />}
        />

        <Route
          path="/sales"
          element={<SalesPage />}
        />
      </Route>

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}