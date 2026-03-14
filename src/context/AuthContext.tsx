import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, AuthState, getRoleName } from '@/types/auth';
import { findUserByCredentials } from '@/hooks/useDatabase';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const SESSION_KEY = 'ucp_session';

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
    } catch {}
    return { user: null, isAuthenticated: false, roleName: null };
  });

  const login = useCallback(async (username: string, password: string) => {
    try {
      const hashed = await hashPassword(password);
      const dbUser = await findUserByCredentials(username, hashed);

      if (!dbUser) {
        return { success: false, error: 'Credenciales inválidas. Verifique su usuario y contraseña.' };
      }

      // Map DB user to app User format (without password)
      const appUser: Omit<User, 'password'> = {
        id: dbUser.cc,
        email: dbUser.email,
        firstName: dbUser.first_name,
        secondName: dbUser.second_name,
        firstLastName: dbUser.first_last_name,
        secondLastName: dbUser.second_last_name,
        rolId: dbUser.id_rol,
        statusId: dbUser.id_state,
      };

      const roleName = getRoleName(dbUser.id_rol);
      setAuthState({ user: appUser, isAuthenticated: true, roleName });
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user: appUser }));

      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Error al conectar con el servidor. Intente de nuevo.' };
    }
  }, []);

  const logout = useCallback(() => {
    setAuthState({ user: null, isAuthenticated: false, roleName: null });
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
