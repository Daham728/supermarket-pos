import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "./LoadingScreen";

export default function PublicRoute({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}