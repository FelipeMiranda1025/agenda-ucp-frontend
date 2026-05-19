import React, { createContext, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { resetAgendaWorkflowQueries } from "@/lib/queryClient";
import { User, AuthState, getRoleName } from "@/types/auth";

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = "ucp_session";
const TOKEN_KEY = "ucp_token";
const SOPORTE_ROL_ID = 5;

/** Reset browser path so a previous /support visit does not stick after logout. */
function syncPathForRole(rolId: number) {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (rolId === SOPORTE_ROL_ID) {
    if (path !== "/support") {
      window.history.replaceState(null, "", "/support");
    }
  } else if (path === "/support") {
    window.history.replaceState(null, "", "/");
  }
}

function resetPathOnLogout() {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== "/") {
    window.history.replaceState(null, "", "/");
  }
}

interface BackendLoginResponse {
  token: string;
  user: {
    cc: string;
    email: string;
    firstName: string;
    secondName: string;
    firstLastName: string;
    secondLastName: string;
    rolId: number;
    statusId: number;
  };
}

// Only restore stored sessions from localStorage; no auto-login bypass.
// All authentication must go through the real login endpoint.

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Verify that a token exists before restoring session
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
          syncPathForRole(parsed.user.rolId);
          return {
            user: parsed.user,
            isAuthenticated: true,
            roleName: getRoleName(parsed.user.rolId),
          };
        }
      }
    } catch {
      /* noop */
    }
    return { user: null, isAuthenticated: false, roleName: null };
  });

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await api.post<BackendLoginResponse>("/auth/login", {
        username,
        password,
      });

      localStorage.setItem(TOKEN_KEY, response.token);

      const appUser: Omit<User, "password"> = {
        id: response.user.cc,
        email: response.user.email,
        firstName: response.user.firstName,
        secondName: response.user.secondName,
        firstLastName: response.user.firstLastName,
        secondLastName: response.user.secondLastName,
        rolId: response.user.rolId,
        statusId: response.user.statusId,
      };

      const roleName = getRoleName(response.user.rolId);
      setAuthState({ user: appUser, isAuthenticated: true, roleName });
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user: appUser }));
      syncPathForRole(response.user.rolId);
      resetAgendaWorkflowQueries();

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al conectar con el servidor";
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(() => {
    setAuthState({ user: null, isAuthenticated: false, roleName: null });
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    resetPathOnLogout();
    resetAgendaWorkflowQueries();
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from "@/hooks/useAuth";
