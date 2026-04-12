"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Trash2Icon,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────

interface Conta {
  id: string;
  nome: string;
  icone: string | null;
  cor: string | null;
  codigo: string;
  tipo: string;
}

interface PlanoItem {
  id: string;
  contaId: string;
  mes: number;
  ano: number;
  valorPlanejado: number;
  observacao: string | null;
  conta: Conta;
}

interface Lancamento {
  id: string;
  valor: number;
  tipo: "RECEITA" | "DESPESA";
  contaId: string;
  conta: Conta;
}

interface ContaContabil {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  icone: string | null;
  cor: string | null;
  filhos?: ContaContabil[];
}

// ── Helpers ────────────────────────────────────────────

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function flattenContas(contas: ContaContabil[]): ContaContabil[] {
  const result: ContaContabil[] = [];
  function walk(list: ContaContabil[]) {
    for (const c of list) {
      result.push(c);
      if (c.filhos?.length) walk(c.filhos);
    }
  }
  walk(contas);
  return result;
}

// ── Component ──────────────────────────────────────────

export default function PlanoFinanceiroPage() {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [planos, setPlanos] = useState<PlanoItem[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [contas, setContas] = useState<ContaContabil[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state for adding new category to plan
  const [novoContaId, setNovoContaId] = useState("");
  const [novoValor, setNovoValor] = useState("");

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const fetchPlanos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/plano-financeiro?mes=${mes}&ano=${ano}`
      );
      if (res.ok) {
        const data = await res.json();
        setPlanos(data);
      }
    } catch (err) {
      console.error("Erro ao carregar plano financeiro:", err);
    } finally {
      setLoading(false);
    }
  }, [mes, ano]);

  const fetchLancamentos = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/lancamentos?mes=${mes}&ano=${ano}`
      );
      if (res.ok) {
        const data = await res.json();
        setLancamentos(data);
      }
    } catch (err) {
      console.error("Erro ao carregar lancamentos:", err);
    }
  }, [mes, ano]);

  const fetchContas = useCallback(async () => {
    try {
      const res = await fetch("/api/plano-de-contas");
      if (res.ok) {
        const data = await res.json();
        setContas(data);
      }
    } catch (err) {
      console.error("Erro ao carregar plano de contas:", err);
    }
  }, []);

  useEffect(() => {
    fetchPlanos();
    fetchLancamentos();
  }, [fetchPlanos, fetchLancamentos]);

  useEffect(() => {
    fetchContas();
  }, [fetchContas]);

  // ── Computed values ──────────────────────────────────

  const flat = flattenContas(contas);

  const receitasPlano = planos.filter((p) => p.conta.tipo === "RECEITA");
  const despesasPlano = planos.filter((p) => p.conta.tipo === "DESPESA");

  const totalReceitaPlanejada = receitasPlano.reduce(
    (acc, p) => acc + p.valorPlanejado,
    0
  );
  const totalDespesaPlanejada = despesasPlano.reduce(
    (acc, p) => acc + p.valorPlanejado,
    0
  );
  const saldoPlanejado = totalReceitaPlanejada - totalDespesaPlanejada;

  // Aggregate actual lancamentos by contaId
  const realPorConta: Record<string, number> = {};
  for (const l of lancamentos) {
    realPorConta[l.contaId] = (realPorConta[l.contaId] || 0) + l.valor;
  }

  // Available contas (not yet in the plan for this month)
  const contasInPlano = new Set(planos.map((p) => p.contaId));
  const contasDisponiveis = flat.filter((c) => !contasInPlano.has(c.id));

  // ── Month navigation ──────────────────────────────────

  function prevMonth() {
    if (mes === 1) {
      setMes(12);
      setAno((a) => a - 1);
    } else {
      setMes((m) => m - 1);
    }
  }

  function nextMonth() {
    if (mes === 12) {
      setMes(1);
      setAno((a) => a + 1);
    } else {
      setMes((m) => m + 1);
    }
  }

  // ── Add category to plan ──────────────────────────────

  async function handleAddCategoria(e: React.FormEvent) {
    e.preventDefault();
    if (!novoContaId || !novoValor) return;
    setSaving(true);

    try {
      const res = await fetch("/api/plano-financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contaId: novoContaId,
          mes,
          ano,
          valorPlanejado: parseFloat(novoValor.replace(",", ".")),
        }),
      });

      if (res.ok) {
        setDialogOpen(false);
        setNovoContaId("");
        setNovoValor("");
        fetchPlanos();
      }
    } catch (err) {
      console.error("Erro ao adicionar categoria:", err);
    } finally {
      setSaving(false);
    }
  }

  // ── Inline edit (save on blur / Enter) ────────────────

  function startEditing(plano: PlanoItem) {
    setEditingId(plano.id);
    setEditingValue(String(plano.valorPlanejado));
  }

  async function saveEditing(planoId: string) {
    setEditingId(null);
    const valor = parseFloat(editingValue.replace(",", "."));
    if (isNaN(valor) || valor < 0) return;

    try {
      await fetch(`/api/plano-financeiro/${planoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valorPlanejado: valor }),
      });
      fetchPlanos();
    } catch (err) {
      console.error("Erro ao atualizar plano:", err);
    }
  }

  function handleEditKeyDown(e: React.KeyboardEvent, planoId: string) {
    if (e.key === "Enter") {
      saveEditing(planoId);
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  }

  // ── Delete plano item ─────────────────────────────────

  async function handleDelete(planoId: string) {
    try {
      await fetch(`/api/plano-financeiro/${planoId}`, {
        method: "DELETE",
      });
      fetchPlanos();
    } catch (err) {
      console.error("Erro ao excluir plano:", err);
    }
  }

  // ── Plano card ────────────────────────────────────────

  function PlanoCard({ plano }: { plano: PlanoItem }) {
    const valorReal = realPorConta[plano.contaId] || 0;
    const isDespesa = plano.conta.tipo === "DESPESA";
    const percentual =
      plano.valorPlanejado > 0
        ? Math.min((valorReal / plano.valorPlanejado) * 100, 100)
        : 0;

    // For despesas: over plan is bad (red), under is good (green)
    // For receitas: over plan is good (green), under is meh (yellow)
    const isOverPlan = valorReal > plano.valorPlanejado;
    const progressColor = isDespesa
      ? isOverPlan
        ? "bg-red-500"
        : "bg-green-500"
      : isOverPlan
        ? "bg-green-500"
        : "bg-blue-500";

    const statusColor = isDespesa
      ? isOverPlan
        ? "text-red-600"
        : "text-green-600"
      : isOverPlan
        ? "text-green-600"
        : "text-blue-600";

    return (
      <Card className="mb-3">
        <CardContent className="flex items-center gap-3 p-4">
          {/* Icon */}
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
            style={{
              backgroundColor: plano.conta.cor
                ? `${plano.conta.cor}20`
                : "#f3f4f6",
            }}
          >
            {plano.conta.icone || "📋"}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{plano.conta.nome}</p>

            {/* Inline editable value */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">Planejado:</span>
              {editingId === plano.id ? (
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  className="h-8 w-28 text-sm"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={() => saveEditing(plano.id)}
                  onKeyDown={(e) => handleEditKeyDown(e, plano.id)}
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  className="text-sm font-semibold cursor-pointer hover:underline"
                  onClick={() => startEditing(plano)}
                >
                  {formatCurrency(plano.valorPlanejado)}
                </button>
              )}
            </div>

            {/* Actual vs planned comparison */}
            {valorReal > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className={statusColor}>
                    Real: {formatCurrency(valorReal)}
                  </span>
                  {isOverPlan && isDespesa && (
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-xs px-1.5 py-0">
                      Acima
                    </Badge>
                  )}
                  {!isOverPlan && isDespesa && valorReal > 0 && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs px-1.5 py-0">
                      Dentro
                    </Badge>
                  )}
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${progressColor}`}
                    style={{ width: `${percentual}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Delete button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-600"
            onClick={() => handleDelete(plano.id)}
          >
            <Trash2Icon className="size-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Render ────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Plano Financeiro</h1>
      </div>

      {/* Month/Year navigation */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" size="sm" onClick={prevMonth}>
          <ChevronLeftIcon className="size-5" />
        </Button>
        <span className="text-base font-semibold min-w-[160px] text-center">
          {MESES[mes - 1]} {ano}
        </span>
        <Button variant="ghost" size="sm" onClick={nextMonth}>
          <ChevronRightIcon className="size-5" />
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-600 font-medium">
              Receita Planejada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(totalReceitaPlanejada)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600 font-medium">
              Despesa Planejada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">
              {formatCurrency(totalDespesaPlanejada)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-600 font-medium">
              Saldo Planejado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(saldoPlanejado)}
            </p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : (
        <>
          {/* Receitas Planejadas */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Receitas Planejadas
            </h2>
            {receitasPlano.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma receita planejada para este mes
              </p>
            ) : (
              receitasPlano.map((p) => <PlanoCard key={p.id} plano={p} />)
            )}
          </div>

          {/* Despesas Planejadas */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Despesas Planejadas
            </h2>
            {despesasPlano.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma despesa planejada para este mes
              </p>
            ) : (
              despesasPlano.map((p) => <PlanoCard key={p.id} plano={p} />)
            )}
          </div>
        </>
      )}

      {/* FAB - Add category to plan */}
      <Button
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 h-14 w-14 rounded-full shadow-lg z-40"
        size="icon"
        onClick={() => setDialogOpen(true)}
      >
        <PlusIcon className="size-6" />
      </Button>

      {/* Dialog to add category */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Categoria ao Plano</DialogTitle>
            <DialogDescription>
              Selecione uma categoria e defina o valor planejado para{" "}
              {MESES[mes - 1]} {ano}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddCategoria} className="space-y-4 pt-2">
            {/* Categoria */}
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select
                value={novoContaId}
                onValueChange={(val) => setNovoContaId(val ?? "")}
              >
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {contasDisponiveis.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Todas as categorias ja estao no plano
                    </div>
                  ) : (
                    contasDisponiveis.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.icone || "📋"} {c.nome}{" "}
                        <span className="text-muted-foreground text-xs">
                          ({c.tipo === "RECEITA" ? "Receita" : "Despesa"})
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div className="space-y-1.5">
              <Label htmlFor="novoValor">Valor Planejado (R$)</Label>
              <Input
                id="novoValor"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                className="h-12"
                value={novoValor}
                onChange={(e) => setNovoValor(e.target.value)}
                required
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={saving || !novoContaId || !novoValor}
            >
              {saving ? "Salvando..." : "Adicionar ao Plano"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
