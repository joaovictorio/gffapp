"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";

interface TenantCount {
  usuarios: number;
  lancamentos: number;
  eventos: number;
  aniversarios: number;
  contasBancarias: number;
}

interface Tenant {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  _count: TenantCount;
}

interface TenantDetail extends Tenant {
  usuarios: Array<{
    id: string;
    nome: string;
    email: string;
    role: string;
    ativo: boolean;
    createdAt: string;
  }>;
  _count: TenantCount & {
    planoContas: number;
    planosFinanceiros: number;
  };
}

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantDetail | null>(null);

  const isSuperAdmin = session?.user?.role === "superadmin";

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/tenants");
    if (res.ok) {
      setTenants(await res.json());
    } else if (res.status === 403) {
      router.push("/painel");
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (session && !isSuperAdmin) {
      router.push("/painel");
      return;
    }
    if (session) fetchTenants();
  }, [session, isSuperAdmin, router, fetchTenants]);

  async function toggleAtivo(id: string, ativoAtual: boolean) {
    const res = await fetch(`/api/admin/tenants/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !ativoAtual }),
    });
    if (res.ok) fetchTenants();
  }

  async function verDetalhes(id: string) {
    const res = await fetch(`/api/admin/tenants/${id}`);
    if (res.ok) {
      setSelectedTenant(await res.json());
      setDetailOpen(true);
    }
  }

  const filteredTenants = tenants.filter(
    (t) =>
      t.nome.toLowerCase().includes(busca.toLowerCase()) ||
      t.codigo.toLowerCase().includes(busca.toLowerCase())
  );

  const totalFamilias = tenants.length;
  const ativas = tenants.filter((t) => t.ativo).length;
  const inativas = tenants.filter((t) => !t.ativo).length;
  const totalUsuarios = tenants.reduce((s, t) => s + t._count.usuarios, 0);

  if (!isSuperAdmin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          🛡️ Administracao da Plataforma
        </h1>
        <p className="text-gray-500 mt-1">
          Gerencie as familias cadastradas no sistema
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-blue-600 font-medium">Total Familias</p>
            <p className="text-2xl font-bold text-blue-700">{totalFamilias}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-green-600 font-medium">Ativas</p>
            <p className="text-2xl font-bold text-green-700">{ativas}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-red-600 font-medium">Inativas</p>
            <p className="text-2xl font-bold text-red-700">{inativas}</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-purple-600 font-medium">Total Usuarios</p>
            <p className="text-2xl font-bold text-purple-700">{totalUsuarios}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar familia por nome ou codigo..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="h-12"
      />

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p className="text-sm text-amber-800">
          🔒 <strong>Modo sigilo:</strong> Voce pode ver apenas dados administrativos
          (nome, membros, contagens). Dados financeiros, aniversarios e eventos
          das familias sao sigilosos e nao sao exibidos.
        </p>
      </div>

      {/* Tenants list */}
      {loading ? (
        <p className="text-center text-gray-500 py-8">Carregando...</p>
      ) : filteredTenants.length === 0 ? (
        <p className="text-center text-gray-500 py-8">Nenhuma familia encontrada</p>
      ) : (
        <div className="space-y-3">
          {filteredTenants.map((t) => (
            <Card key={t.id} className={!t.ativo ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base">{t.nome}</h3>
                      <Badge
                        className={
                          t.ativo
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {t.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                      <span>🎟️ {t.codigo}</span>
                      <span>👥 {t._count.usuarios} membros</span>
                      <span>📅 Desde {formatDate(t.createdAt)}</span>
                    </div>

                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      <span>💰 {t._count.lancamentos} lancamentos</span>
                      <span>📅 {t._count.eventos} eventos</span>
                      <span>🎂 {t._count.aniversarios} aniversarios</span>
                      <span>🏦 {t._count.contasBancarias} contas</span>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => verDetalhes(t.id)}
                    >
                      Detalhes
                    </Button>
                    <Button
                      variant={t.ativo ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleAtivo(t.id, t.ativo)}
                    >
                      {t.ativo ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTenant?.nome}
            </DialogTitle>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Codigo Convite</p>
                  <p className="font-mono font-bold text-lg">{selectedTenant.codigo}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Status</p>
                  <Badge
                    className={
                      selectedTenant.ativo
                        ? "bg-green-100 text-green-800 mt-1"
                        : "bg-red-100 text-red-800 mt-1"
                    }
                  >
                    {selectedTenant.ativo ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Criada em</p>
                  <p className="font-medium">{formatDate(selectedTenant.createdAt)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Ultima atualizacao</p>
                  <p className="font-medium">{formatDate(selectedTenant.updatedAt)}</p>
                </div>
              </div>

              {/* Usage stats - only counts, no actual data */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">📊 Uso do Sistema (apenas contagens)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-lg font-bold">{selectedTenant._count.lancamentos}</p>
                      <p className="text-xs text-gray-500">Lancamentos</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-lg font-bold">{selectedTenant._count.eventos}</p>
                      <p className="text-xs text-gray-500">Eventos</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-lg font-bold">{selectedTenant._count.aniversarios}</p>
                      <p className="text-xs text-gray-500">Aniversarios</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-lg font-bold">{selectedTenant._count.planoContas}</p>
                      <p className="text-xs text-gray-500">Plano Contas</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-lg font-bold">{selectedTenant._count.planosFinanceiros}</p>
                      <p className="text-xs text-gray-500">Planos Fin.</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-lg font-bold">{selectedTenant._count.contasBancarias}</p>
                      <p className="text-xs text-gray-500">Contas Banc.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Members - only names/emails, no financial data */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    👥 Membros ({selectedTenant.usuarios.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedTenant.usuarios.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-xl"
                    >
                      <div>
                        <p className="font-medium text-sm">{u.nome}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {u.role}
                        </Badge>
                        {!u.ativo && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            Inativo
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-800">
                  🔒 Dados financeiros, aniversarios e eventos desta familia
                  sao sigilosos e nao sao exibidos aqui.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
