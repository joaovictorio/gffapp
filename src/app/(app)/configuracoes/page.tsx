"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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
