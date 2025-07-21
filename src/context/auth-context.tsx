
"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getUserByEmail } from "@/lib/data-service";
import type { User } from "@/lib/types";
import bcrypt from 'bcrypt';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const foundUser = await getUserByEmail(email);
    if (foundUser && await bcrypt.compare(password, foundUser.password)) {
      sessionStorage.setItem("user", JSON.stringify(foundUser));
      setUser(foundUser);
    } else {
      throw new Error("Invalid email or password");
    }
  };

  const logout = () => {
    sessionStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  const value = { user, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
