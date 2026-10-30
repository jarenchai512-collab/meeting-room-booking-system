"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { UserRole } from "../data/types";

export interface AuthUser {
  userId: string;
  username: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  position?: string;
  phoneNumber?: string;
  prefix?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchUserRoleDemo: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (username: string, password?: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || "เข้าสู่ระบบไม่สำเร็จ" };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      window.location.href = "/login";
    }
  };

  const switchUserRoleDemo = async (role: UserRole) => {
    // Convenient 1-click switcher for reviewer/examiner (all passwords: 123456)
    const roleMap: Record<UserRole, { user: string; pass: string }> = {
      Admin: { user: "admin", pass: "123456" },
      Approver: { user: "chatree", pass: "123456" },
      Inspector: { user: "watcharapong", pass: "123456" },
      Endorser: { user: "ekarat", pass: "123456" },
      User: { user: "somchai", pass: "123456" },
    };
    const target = roleMap[role];
    if (target) await login(target.user, target.pass);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        switchUserRoleDemo,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
