import React, { createContext, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { User, AuthState, getRoleName } from "@/types/auth";

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = "ucp_session";
const TOKEN_KEY = "ucp_token";

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          user: parsed.user,
          isAuthenticated: true,
          roleName: getRoleName(parsed.user.rolId),
        };
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
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from "@/hooks/useAuth";
