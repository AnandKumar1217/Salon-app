'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminRole, AdminUser } from '../lib/types';
import { INITIAL_ADMIN_USERS } from '../lib/mock-data';

interface AdminAuthContextType {
  admin: AdminUser | null;
  role: AdminRole | null;
  token: string | null;
  isLoading: boolean;
  isMockMode: boolean;
  canManageSalons: boolean;
  canManageAdmins: boolean;
  canManageFinances: boolean;
  canViewAuditLogs: boolean;
  canHandleSupport: boolean;
  login: (email: string, pass: string) => Promise<void>;
  switchDemoRole: (role: AdminRole) => void;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = 'glamora_admin_session';

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if mock mode is permitted (NEVER in live production)
  const isMockMode =
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_USE_MOCK_FALLBACK === 'true';

  useEffect(() => {
    const verifyExistingSession = async () => {
      try {
        const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
        let parsedToken: string | null = null;
        let parsedAdmin: AdminUser | null = null;

        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsedToken = parsed.token;
            parsedAdmin = parsed.admin;
          } catch {
            localStorage.removeItem(ADMIN_STORAGE_KEY);
          }
        }

        // Verify with MongoDB backend /api/auth/me
        try {
          const headers: Record<string, string> = {};
          if (parsedToken) {
            headers['Authorization'] = `Bearer ${parsedToken}`;
          }

          const res = await fetch('/api/auth/me', { headers });
          if (res.ok) {
            const data = await res.json();
            if (data.admin) {
              setAdmin(data.admin);
              setToken(parsedToken);
              localStorage.setItem(
                ADMIN_STORAGE_KEY,
                JSON.stringify({ admin: data.admin, token: parsedToken })
              );
              setIsLoading(false);
              return;
            }
          }
        } catch (apiErr) {
          console.warn('Auth session check network issue:', apiErr);
        }

        // If stored was present and mock mode is active, restore
        if (parsedAdmin && parsedToken && isMockMode) {
          setAdmin(parsedAdmin);
          setToken(parsedToken);
        } else if (isMockMode) {
          const defaultAdmin = INITIAL_ADMIN_USERS[0];
          setAdmin(defaultAdmin);
          setToken(`mock_${defaultAdmin.id}`);
        } else {
          setAdmin(null);
          setToken(null);
          localStorage.removeItem(ADMIN_STORAGE_KEY);
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyExistingSession();
  }, [isMockMode]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid administrator credentials');
      }

      setAdmin(data.admin);
      setToken(data.token);
      localStorage.setItem(
        ADMIN_STORAGE_KEY,
        JSON.stringify({ admin: data.admin, token: data.token })
      );
    } catch (err: any) {
      if (isMockMode) {
        const found = INITIAL_ADMIN_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        ) || {
          id: `adm_usr_${Date.now()}`,
          email,
          name: email.split('@')[0],
          role: 'SUPER_ADMIN' as AdminRole,
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        const mockToken = `mock_${found.id}`;
        setAdmin(found);
        setToken(mockToken);
        localStorage.setItem(
          ADMIN_STORAGE_KEY,
          JSON.stringify({ admin: found, token: mockToken })
        );
        return;
      }
      throw new Error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoRole = (newRole: AdminRole) => {
    if (!isMockMode) {
      console.warn('Role switching is disabled in live production mode.');
      return;
    }

    const matching = INITIAL_ADMIN_USERS.find((u) => u.role === newRole) || {
      id: `adm_${newRole.toLowerCase()}`,
      email: `${newRole.toLowerCase()}@glamora.com`,
      name: `${newRole} Demo`,
      role: newRole,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const mockToken = `mock_${matching.id}`;
    setAdmin(matching);
    setToken(mockToken);
    localStorage.setItem(
      ADMIN_STORAGE_KEY,
      JSON.stringify({ admin: matching, token: mockToken })
    );
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore if offline
    }
    setAdmin(null);
    setToken(null);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  };

  const role = admin?.role || null;
  const canManageSalons = role === 'SUPER_ADMIN' || role === 'OPERATIONS_ADMIN';
  const canManageAdmins = role === 'SUPER_ADMIN';
  const canManageFinances = role === 'SUPER_ADMIN' || role === 'FINANCE_ADMIN';
  const canViewAuditLogs = role === 'SUPER_ADMIN' || role === 'OPERATIONS_ADMIN';
  const canHandleSupport =
    role === 'SUPER_ADMIN' || role === 'OPERATIONS_ADMIN' || role === 'SUPPORT_ADMIN';

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        role,
        token,
        isLoading,
        isMockMode,
        canManageSalons,
        canManageAdmins,
        canManageFinances,
        canViewAuditLogs,
        canHandleSupport,
        login,
        switchDemoRole,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
