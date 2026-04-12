"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ConvitePage() {
  const router = useRouter();
  const [step, setStep] = useState<"codigo" | "registro">("codigo");
  const [codigo, setCodigo] = useState("");
  const [nomeFamilia, setNomeFamilia] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function verificarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/convite?codigo=${codigo}`);
      const data = await res.json();

      if (!res.ok) {
        setErro(data.error);
        setLoading(false);
        return;
      }

      setNomeFamilia(data.nome);
      setStep("registro");
    } catch {
      setErro("Erro ao verificar codigo");
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/convite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, nome, email, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error);
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password: senha,
        redirect: false,
      });

      if (result?.error) {
        setErro("Conta criada! Faca login.");
        setLoading(false);
      } else {
        router.push("/painel");
      }
    } catch {
      setErro("Erro ao entrar na familia");
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center space-y-2">
        <div className="text-5xl mb-2">🎟️</div>
        <CardTitle className="text-2xl">
          {step === "codigo" ? "Entrar na Familia" : `Bem-vindo a ${nomeFamilia}!`}
        </CardTitle>
        <CardDescription>
          {step === "codigo"
            ? "Digite o codigo de convite da sua familia"
            : "Crie sua conta para entrar"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "codigo" ? (
          <form onSubmit={verificarCodigo} className="space-y-4">
            {erro && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                {erro}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="codigo">Codigo de Convite</Label>
              <Input
                id="codigo"
                placeholder="Ex: ABC123"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                required
                maxLength={6}
                className="h-12 text-center text-xl tracking-widest font-mono"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? "Verificando..." : "Verificar Codigo"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                {erro}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="nome">Seu Nome</Label>
              <Input
                id="nome"
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="Minimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
                className="h-12"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? "Entrando..." : "Entrar na Familia"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            <a href="/login" className="text-blue-600 hover:underline font-medium">
              Voltar para login
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
