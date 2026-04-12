"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Membro {
  id: string;
  nome: string;
  email: string;
  avatar: string;
  role: string;
  ativo: boolean;
}

interface Familia {
  id: string;
  nome: string;
  codigo: string;
  usuarios: Membro[];
}

export default function ConfiguracoesPage() {
  const { data: session } = useSession();
  const [familia, setFamilia] = useState<Familia | null>(null);
  const [nomeFamilia, setNomeFamilia] = useState("");
  const [editando, setEditando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [dialogSenha, setDialogSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [senhaMsg, setSenhaMsg] = useState("");
  const [senhaErro, setSenhaErro] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const isAdmin = session?.user?.role === "admin";

  const fetchFamilia = useCallback(async () => {
    const res = await fetch("/api/familia");
    if (res.ok) {
      const data = await res.json();
      setFamilia(data);
      setNomeFamilia(data.nome);
    }
  }, []);

  useEffect(() => {
    fetchFamilia();
  }, [fetchFamilia]);

  async function salvarNome() {
    await fetch("/api/familia", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nomeFamilia }),
    });
    setEditando(false);
    fetchFamilia();
  }

  function copiarCodigo() {
    if (familia) {
      navigator.clipboard.writeText(familia.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  }

  async function alterarSenha() {
    setSenhaMsg("");
    setSenhaErro("");

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setSenhaErro("Preencha todos os campos");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setSenhaErro("As senhas nao coincidem");
      return;
    }

    if (novaSenha.length < 6) {
      setSenhaErro("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    setSalvandoSenha(true);
    try {
      const res = await fetch("/api/auth/alterar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSenhaErro(data.error || "Erro ao alterar senha");
      } else {
        setSenhaMsg(data.message || "Senha alterada com sucesso!");
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmarSenha("");
        setTimeout(() => {
          setDialogSenha(false);
          setSenhaMsg("");
        }, 1500);
      }
    } catch {
      setSenhaErro("Erro ao alterar senha");
    } finally {
      setSalvandoSenha(false);
    }
  }

  if (!familia) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">👨‍👩‍👧‍👦 Familia</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">🏠 Nome da Familia</CardTitle>
        </CardHeader>
        <CardContent>
          {editando ? (
            <div className="flex gap-2">
              <Input
                value={nomeFamilia}
                onChange={(e) => setNomeFamilia(e.target.value)}
                className="h-12"
              />
              <Button onClick={salvarNome} className="h-12">
                Salvar
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditando(false)}
                className="h-12"
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-lg font-medium">{familia.nome}</p>
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => setEditando(true)}
                  className="h-10"
                >
                  Editar
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">🎟️ Codigo de Convite</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="bg-gray-100 px-6 py-3 rounded-xl">
              <span className="text-2xl font-mono font-bold tracking-widest">
                {familia.codigo}
              </span>
            </div>
            <Button variant="outline" onClick={copiarCodigo} className="h-12">
              {copiado ? "Copiado!" : "Copiar"}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Compartilhe este codigo para convidar membros da familia
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">🔒 Alterar Senha</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="h-12"
            onClick={() => {
              setSenhaAtual("");
              setNovaSenha("");
              setConfirmarSenha("");
              setSenhaMsg("");
              setSenhaErro("");
              setDialogSenha(true);
            }}
          >
            Alterar Senha
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogSenha} onOpenChange={setDialogSenha}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Senha Atual</Label>
              <Input
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Nova Senha</Label>
              <Input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="h-12"
              />
            </div>
            {senhaErro && (
              <p className="text-sm text-red-600">{senhaErro}</p>
            )}
            {senhaMsg && (
              <p className="text-sm text-green-600">{senhaMsg}</p>
            )}
            <Button
              onClick={alterarSenha}
              disabled={salvandoSenha}
              className="w-full h-12"
            >
              {salvandoSenha ? "Salvando..." : "Alterar Senha"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            👥 Membros ({familia.usuarios.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {familia.usuarios.map((membro) => (
            <div
              key={membro.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{membro.avatar || "👤"}</span>
                <div>
                  <p className="font-medium">{membro.nome}</p>
                  <p className="text-sm text-gray-500">{membro.email}</p>
                </div>
              </div>
              <Badge
                variant={membro.role === "admin" ? "default" : "secondary"}
              >
                {membro.role === "admin" ? "Admin" : "Membro"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
