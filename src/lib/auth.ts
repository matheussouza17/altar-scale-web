import Cookies from "js-cookie";
import type { PapelUsuario } from "@/types";

const TOKEN_KEY = "altar_token";

export interface JwtPayload {
  sub: string;
  email: string;
  nome: string;
  telefone: string | null;
  papel: PapelUsuario;
  iat: number;
  exp: number;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: "lax" });
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  Cookies.remove(TOKEN_KEY);
}

export function isTokenValid(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return false;
  return payload.exp * 1000 > Date.now();
}
