import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth-context";
import { authApi, tokenStorage } from "../services/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const response = await authApi.login({ email, password });

    const token = response.data?.token;
    const authenticatedUser = response.data?.user;

    if (!token || !authenticatedUser) {
      throw new Error("The server returned an invalid login response.");
    }

    tokenStorage.set(token);
    setUser(authenticatedUser);

    return authenticatedUser;
  }, []);

  useEffect(() => {
    let isActive = true;

    async function restoreSession() {
      const token = tokenStorage.get();

      if (!token) {
        if (isActive) {
          setIsLoading(false);
        }

        return;
      }

      try {
        const response = await authApi.getCurrentUser();

        if (isActive) {
          setUser(response.data?.user || null);
        }
      } catch {
        tokenStorage.clear();

        if (isActive) {
          setUser(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      logout();
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}