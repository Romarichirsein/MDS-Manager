import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, mdp: string) => Promise<void>;
  logout: () => void;
  switchRoleQuick: (role: UserRole) => Promise<void>;
  isAdmin: boolean;
  isComptable: boolean;
  isSecretaire: boolean;
  canManageStudents: boolean;
  canRecordPayments: boolean;
  canDeleteRecords: boolean;
  canAccessSettings: boolean;
  canAccessLogs: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('edufinance_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkAuth() {
      const storedToken = localStorage.getItem('mds_token') || localStorage.getItem('edufinance_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          setToken(storedToken);
        } catch {
          localStorage.removeItem('mds_token');
          localStorage.removeItem('edufinance_token');
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const login = async (email: string, mdp: string) => {
    const res = await api.login(email, mdp);
    localStorage.setItem('mds_token', res.token);
    setUser(res.user);
    setToken(res.token);
  };

  const logout = () => {
    localStorage.removeItem('mds_token');
    localStorage.removeItem('edufinance_token');
    setUser(null);
    setToken(null);
  };

  // Reconnexion rapide Administrateur
  const switchRoleQuick = async (_targetRole?: UserRole) => {
    await login('lamaindusecour@gmail.com', 'qlac485!');
  };

  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isComptable = role === 'COMPTABLE';
  const isSecretaire = role === 'SECRETAIRE';

  const canManageStudents = isAdmin || isSecretaire || isComptable;
  const canRecordPayments = isAdmin || isComptable;
  const canDeleteRecords = isAdmin;
  const canAccessSettings = isAdmin;
  const canAccessLogs = isAdmin || isComptable;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        switchRoleQuick,
        isAdmin,
        isComptable,
        isSecretaire,
        canManageStudents,
        canRecordPayments,
        canDeleteRecords,
        canAccessSettings,
        canAccessLogs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }
  return context;
}
