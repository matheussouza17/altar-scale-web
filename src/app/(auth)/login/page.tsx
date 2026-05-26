"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api, getApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const { login } = useAuth();
  const [view, setView] = useState<"login" | "reset">("login");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      await login(email, senha);
    } catch (err) {
      setLoginError(getApiError(err));
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);
    try {
      await api.post("/auth/solicitar-reset", { email: resetEmail });
      setResetSent(true);
    } catch (err) {
      setResetError(getApiError(err));
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
      <div className="mb-8 text-center">
        <p className="text-2xl font-bold text-blue-700">EscalaAltar</p>
        <p className="mt-1 text-sm text-gray-500">Gestão de escalas litúrgicas</p>
      </div>

      {view === "login" ? (
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            autoFocus
          />
          <div className="flex flex-col gap-1">
            <Input
              label="Senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => { setView("reset"); setResetEmail(email); }}
              className="self-end text-xs text-blue-600 hover:underline mt-0.5"
            >
              Esqueci minha senha
            </button>
          </div>

          {loginError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loginError}</p>
          )}

          <Button type="submit" loading={loginLoading} className="mt-2 w-full">
            Entrar
          </Button>
        </form>
      ) : resetSent ? (
        <div className="text-center">
          <p className="mb-2 text-4xl">✉️</p>
          <p className="mb-1 font-semibold text-gray-900">Email enviado!</p>
          <p className="mb-6 text-sm text-gray-500">
            Se o endereço <strong>{resetEmail}</strong> estiver cadastrado, você receberá um link para redefinir a senha.
          </p>
          <button
            onClick={() => { setView("login"); setResetSent(false); }}
            className="text-sm text-blue-600 hover:underline"
          >
            Voltar ao login
          </button>
        </div>
      ) : (
        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <div>
            <p className="mb-4 text-sm text-gray-600">
              Informe seu email e enviaremos um link para redefinir a senha.
            </p>
            <Input
              label="E-mail"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoFocus
            />
          </div>

          {resetError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{resetError}</p>
          )}

          <Button type="submit" loading={resetLoading} disabled={!resetEmail} className="w-full">
            Enviar link
          </Button>

          <button
            type="button"
            onClick={() => setView("login")}
            className="text-sm text-gray-500 hover:text-gray-700 hover:underline text-center"
          >
            Voltar ao login
          </button>
        </form>
      )}
    </div>
  );
}
