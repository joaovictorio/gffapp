"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

const TIPO_LABELS: Record<string, string> = {
  CORRENTE: "Conta Corrente",
  POUPANCA: "Poupanca",
  CARTEIRA: "Carteira/Dinheiro",
  OUTRO: "Outro",
};

const TIPO_COLORS: Record<string, string> = {
  CORRENTE: "bg-blue-100 text-blue-800",
  POUPANCA: "bg-green-100 text-green-800",
  CARTEIRA: "bg-amber-100 text-amber-800",
  OUTRO: "bg-gray-100 text-gray-800",
};

interface ContaBancaria {
  id: string;
  nome: string;
  tipo: string;
  banco: string | null;
  agencia: string | null;
  numeroConta: string | null;
  saldoInicial: number;
  saldoAtual: number;
  icone: string | null;
  cor: string | null;
}

const emptyForm = {
  nome: "",
  tipo: "CORRENTE",
  banco: "",
  agencia: "",
  numeroConta: "",
  saldoInicial: "0",
  icone: "🏦",
  cor: "",
};

export default function ContasBancariasPage() {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchContas = useCallback(async () => {
    try {
      const res = await fetch("/api/contas-bancarias");
      if (res.ok) {
        const data = await res.json();
        setContas(data);
      }
    } catch (error) {
      console.error("Erro ao buscar contas bancarias:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContas();
  }, [fetchContas]);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(conta: ContaBancaria) {
    setEditingId(conta.id);
    setForm({
      nome: conta.nome,
      tipo: conta.tipo,
      banco: conta.banco || "",
      agencia: conta.agencia || "",
      numeroConta: conta.numeroConta || "",
      saldoInicial: String(conta.saldoInicial),
      icone: conta.icone || "🏦",
      cor: conta.cor || "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.nome || !form.tipo) return;
    setSaving(true);

    try {
      const payload = {
        nome: form.nome,
        tipo: form.tipo,
        banco: form.banco || null,
        agencia: form.agencia || null,
        numeroConta: form.numeroConta || null,
        saldoInicial: parseFloat(form.saldoInicial) || 0,
        icone: form.icone || null,
        cor: form.cor || null,
      };

      if (editingId) {
        await fetch(`/api/contas-bancarias/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/contas-bancarias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setDialogOpen(false);
      fetchContas();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta conta bancaria?")) return;

    try {
      const res = await fetch(`/api/contas-bancarias/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao remover conta");
        return;
      }

      setDialogOpen(false);
      fetchContas();
    } catch (error) {
      console.error("Erro ao remover:", error);
    }
  }

  const saldoTotal = contas.reduce((sum, c) => sum + c.saldoAtual, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          🏦 Contas Bancarias
        </h1>
        <p className="text-gray-500 mt-1">
          {contas.length} {contas.length === 1 ? "conta" : "contas"}{" "}
          cadastradas
        </p>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-gray-600 mb-1">Saldo Total</p>
          <p
            className={`text-3xl font-bold ${
              saldoTotal >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(saldoTotal)}
          </p>
        </CardContent>
      </Card>

      {/* Account Cards Grid */}
      {contas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-4xl mb-3">🏦</p>
            <p className="text-gray-500">
              Nenhuma conta bancaria cadastrada ainda
            </p>
            <Button className="mt-4" onClick={openNew}>
              Adicionar primeira conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contas.map((conta) => (
            <Card
              key={conta.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="py-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl flex-shrink-0">
                      {conta.icone || "🏦"}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {conta.nome}
                      </h3>
                      {conta.banco && (
                        <p className="text-sm text-gray-500 truncate">
                          {conta.banco}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge className={TIPO_COLORS[conta.tipo] || TIPO_COLORS.OUTRO}>
                    {TIPO_LABELS[conta.tipo] || conta.tipo}
                  </Badge>
                </div>

                <p
                  className={`text-2xl font-bold ${
                    conta.saldoAtual >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(conta.saldoAtual)}
                </p>

                {(conta.agencia || conta.numeroConta) && (
                  <p className="text-xs text-gray-400">
                    {conta.agencia && `Ag: ${conta.agencia}`}
                    {conta.agencia && conta.numeroConta && " | "}
                    {conta.numeroConta && `Conta: ${conta.numeroConta}`}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-10"
                    onClick={() => openEdit(conta)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(conta.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* FAB */}
      <Button
        onClick={openNew}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 h-14 w-14 rounded-full shadow-lg text-2xl p-0 z-50"
      >
        +
      </Button>

      {/* Dialog Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Conta Bancaria" : "Nova Conta Bancaria"} 🏦
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="flex gap-3">
              <div className="space-y-2 flex-shrink-0">
                <Label htmlFor="icone">Icone</Label>
                <Input
                  id="icone"
                  value={form.icone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, icone: e.target.value }))
                  }
                  className="w-16 h-12 text-center text-xl"
                  maxLength={4}
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nome: e.target.value }))
                  }
                  placeholder="Ex: Nubank, Itau..."
                  className="h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, tipo: v ?? "" }))
                  }
                >
                  <SelectTrigger id="tipo" className="h-12">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CORRENTE">Conta Corrente</SelectItem>
                    <SelectItem value="POUPANCA">Poupanca</SelectItem>
                    <SelectItem value="CARTEIRA">Carteira/Dinheiro</SelectItem>
                    <SelectItem value="OUTRO">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="banco">Banco</Label>
                <Input
                  id="banco"
                  value={form.banco}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, banco: e.target.value }))
                  }
                  placeholder="Nome do banco"
                  className="h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="agencia">Agencia</Label>
                <Input
                  id="agencia"
                  value={form.agencia}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, agencia: e.target.value }))
                  }
                  placeholder="0001"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numeroConta">Numero da Conta</Label>
                <Input
                  id="numeroConta"
                  value={form.numeroConta}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, numeroConta: e.target.value }))
                  }
                  placeholder="12345-6"
                  className="h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="saldoInicial">Saldo Inicial (R$)</Label>
              <Input
                id="saldoInicial"
                type="number"
                step="0.01"
                value={form.saldoInicial}
                onChange={(e) =>
                  setForm((f) => ({ ...f, saldoInicial: e.target.value }))
                }
                placeholder="0.00"
                className="h-12"
              />
            </div>

            <div className="flex gap-2 pt-2">
              {editingId && (
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(editingId)}
                  className="mr-auto"
                >
                  Remover
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className={editingId ? "" : "flex-1"}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.nome || !form.tipo}
                className={editingId ? "" : "flex-1"}
              >
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
