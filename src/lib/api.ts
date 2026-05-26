import axios from "axios";
import { getToken, removeToken } from "./auth";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Redireciona para login apenas quando havia um token (sessão expirada),
    // não em tentativas de login/reset com credenciais inválidas.
    if (err.response?.status === 401 && getToken()) {
      removeToken();
      if (typeof window !== "undefined") window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export function getApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data?.error === "VALIDATION_ERROR" && data?.details?.fieldErrors) {
      const fieldErrors: Record<string, string[]> = data.details.fieldErrors;
      const msgs = Object.entries(fieldErrors)
        .filter(([, errs]) => errs.length > 0)
        .map(([field, errs]) => `${field}: ${errs[0]}`);
      if (msgs.length > 0) return msgs.join(" · ");
    }
    return data?.message ?? err.message;
  }
  return "Erro inesperado.";
}
