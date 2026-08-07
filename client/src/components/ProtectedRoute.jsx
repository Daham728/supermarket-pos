import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "./LoadingScreen";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}