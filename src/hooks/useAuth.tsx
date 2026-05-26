"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  decodeToken,
  getToken,
  isTokenValid,
  removeToken,
  saveToken,
} from "@/lib/auth";
import type { PapelUsuario } from "@/types";

interface AuthUser {
  id: string;
  email: string;
  nome: string;
  telefone: string | null;
  papel: PapelUsuario;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  loginWithToken: (token: string) => void;
  logout: () => void;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (token && isTokenValid(token)) {
      const payload = decodeToken(token)!;
      setUser({
        id: payload.sub,
        email: payload.email,
        nome: payload.nome,
        telefone: payload.telefone,
        papel: payload.papel,
      });
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const { data } = await api.post<{ token: string }>("/auth/login", {
      email,
      senha,
    });
    saveToken(data.token);
    const payload = decodeToken(data.token)!;
    const authUser: AuthUser = {
      id: payload.sub,
      email: payload.email,
      nome: payload.nome,
      telefone: payload.telefone,
      papel: payload.papel,
    };
    setUser(authUser);

    const dest =
      authUser.papel === "SERVIDOR" ? "/disponibilidade" : "/missas";
    router.replace(dest);
  }, [router]);

  const loginWithToken = useCallback((token: string) => {
    saveToken(token);
    const payload = decodeToken(token)!;
    setUser({
      id: payload.sub,
      email: payload.email,
      nome: payload.nome,
      telefone: payload.telefone,
      papel: payload.papel,
    });
    const dest = payload.papel === "SERVIDOR" ? "/disponibilidade" : "/missas";
    router.replace(dest);
  }, [router]);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    router.replace("/login");
  }, [router]);

  const isStaff =
    user?.papel === "COORDENADOR" || user?.papel === "ADMIN";

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithToken, logout, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
