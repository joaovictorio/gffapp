"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegistroPage() {
  const router = useRouter();
  const [nomeFamilia, setNomeFamilia] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomeFamilia, nome, email, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error);
        setLoading(false);
        return;
      }

      // Auto-login after registration
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
      setErro("Erro ao criar conta. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center space-y-2">
        <div className="text-5xl mb-2">👨‍👩‍👧‍👦</div>
        <CardTitle className="text-2xl">Criar Familia</CardTitle>
        <CardDescription>Comece a organizar as financas da familia</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {erro}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nomeFamilia">Nome da Familia</Label>
            <Input
              id="nomeFamilia"
              placeholder="Ex: Familia Silva"
              value={nomeFamilia}
              onChange={(e) => setNomeFamilia(e.target.value)}
              required
              className="h-12"
            />
          </div>

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
            {loading ? "Criando..." : "Criar Familia"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Ja tem conta?{" "}
            <a href="/login" className="text-blue-600 hover:underline font-medium">
              Entrar
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
