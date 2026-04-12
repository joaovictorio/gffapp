"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password: senha,
      redirect: false,
    });

    if (result?.error) {
      setErro("Email ou senha incorretos");
      setLoading(false);
    } else {
      router.push("/painel");
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center space-y-2">
        <div className="text-5xl mb-2">🏠</div>
        <CardTitle className="text-2xl">Financas da Familia</CardTitle>
        <CardDescription>Entre na sua conta</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {erro}
            </div>
          )}

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
              placeholder="••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="h-12"
            />
          </div>

          <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Nao tem conta?{" "}
            <a href="/registro" className="text-blue-600 hover:underline font-medium">
              Criar familia
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            Tem um codigo de convite?{" "}
            <a href="/convite" className="text-blue-600 hover:underline font-medium">
              Entrar na familia
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
