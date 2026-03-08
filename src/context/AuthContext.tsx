import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState, getRoleName } from '@/types/auth';

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

// Pre-computed SHA-256 hashes
const HASH_ADMIN = '698d5dd0fc584cc4060780e5a39f52e0c2cf90e678cd1afb1ee53e556d1ee20e'; // admin123*
const HASH_DOCENTE = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'; // password123

const INITIAL_USERS: User[] = [
  {
    id: 'admin',
    email: 'admin@ucp.edu.co',
    firstName: 'Administrador',
    secondName: '',
    firstLastName: 'Sistema',
    secondLastName: '',
    password: HASH_ADMIN,
    rolId: 0, // admin
    statusId: 1,
  },
  {
    id: '1234567890',
    email: 'docente.admin@ucp.edu.co',
    firstName: 'Docente',
    secondName: '',
    firstLastName: 'Administrativo',
    secondLastName: '',
    password: HASH_DOCENTE,
    rolId: 3, // docenteAdministrativo
    statusId: 1,
  },
];

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
    const hashed = await hashPassword(password);
    const user = INITIAL_USERS.find(
      u => (u.id === username || u.email === username) && u.password === hashed && u.statusId === 1
    );

    if (!user) {
      return { success: false, error: 'Credenciales inválidas. Verifique su usuario y contraseña.' };
    }

    const { password: _, ...safeUser } = user;
    const roleName = getRoleName(user.rolId);

    setAuthState({ user: safeUser, isAuthenticated: true, roleName });
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: safeUser }));

    return { success: true };
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
