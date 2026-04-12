"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  PlusIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────

interface Conta {
  id: string;
  nome: string;
  icone: string | null;
  cor: string | null;
  codigo: string;
}

interface Membro {
  id: string;
  nome: string;
  avatar: string | null;
  role: string;
}

interface Lancamento {
  id: string;
  descricao: string;
  valor: number;
  tipo: "RECEITA" | "DESPESA";
  natureza: "FIXO" | "VARIAVEL";
  recorrente: boolean;
  diaVencimento: number | null;
  dataVencimento: string;
  dataPagamento: string | null;
  status: "PENDENTE" | "PAGO" | "ATRASADO";
  observacao: string | null;
  conta: Conta;
  responsavel?: { id: string; nome: string; avatar: string | null } | null;
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

export default function FinanceiroPage() {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [contas, setContas] = useState<ContaContabil[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    tipo: "DESPESA",
    natureza: "VARIAVEL",
    contaId: "",
    dataVencimento: "",
    recorrente: false,
    diaVencimento: "",
    observacao: "",
    responsavelId: "",
  });

  const fetchLancamentos = useCallback(async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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

  const fetchMembros = useCallback(async () => {
    try {
      const res = await fetch("/api/familia/membros");
      if (res.ok) {
        const data = await res.json();
        setMembros(data);
      }
    } catch (err) {
      console.error("Erro ao carregar membros:", err);
    }
  }, []);

  useEffect(() => {
    fetchLancamentos();
  }, [fetchLancamentos]);

  useEffect(() => {
    fetchContas();
  }, [fetchContas]);

  useEffect(() => {
    fetchMembros();
  }, [fetchMembros]);

  // ── Summary ───────────────────────────────────────────

  const totalReceitas = lancamentos
    .filter((l) => l.tipo === "RECEITA")
    .reduce((acc, l) => acc + l.valor, 0);

  const totalDespesas = lancamentos
    .filter((l) => l.tipo === "DESPESA")
    .reduce((acc, l) => acc + l.valor, 0);

  const saldo = totalReceitas - totalDespesas;

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

  // ── Mark as paid ──────────────────────────────────────

  async function marcarComoPago(id: string) {
    try {
      const res = await fetch(`/api/lancamentos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAGO" }),
      });
      if (res.ok) {
        fetchLancamentos();
      }
    } catch (err) {
      console.error("Erro ao marcar como pago:", err);
    }
  }

  // ── Create lancamento ─────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        descricao: form.descricao,
        valor: parseFloat(form.valor.replace(",", ".")),
        tipo: form.tipo,
        natureza: form.natureza,
        contaId: form.contaId,
        dataVencimento: form.dataVencimento,
        recorrente: form.recorrente,
        diaVencimento: form.recorrente
          ? parseInt(form.diaVencimento, 10)
          : null,
        observacao: form.observacao || null,
        responsavelId: form.responsavelId || null,
      };

      const res = await fetch("/api/lancamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSheetOpen(false);
        resetForm();
        fetchLancamentos();
      }
    } catch (err) {
      console.error("Erro ao criar lancamento:", err);
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm({
      descricao: "",
      valor: "",
      tipo: "DESPESA",
      natureza: "VARIAVEL",
      contaId: "",
      dataVencimento: "",
      recorrente: false,
      diaVencimento: "",
      observacao: "",
      responsavelId: "",
    });
  }

  // ── Filter helpers ────────────────────────────────────

  const despesas = lancamentos.filter((l) => l.tipo === "DESPESA");
  const receitas = lancamentos.filter((l) => l.tipo === "RECEITA");
  const flat = flattenContas(contas);

  // ── Status badge ──────────────────────────────────────

  function StatusBadge({ status }: { status: string }) {
    if (status === "PAGO") {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          Pago
        </Badge>
      );
    }
    if (status === "ATRASADO") {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          Atrasado
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
        Pendente
      </Badge>
    );
  }

  function NaturezaBadge({ natureza }: { natureza: string }) {
    return (
      <Badge variant="outline" className="text-xs">
        {natureza === "FIXO" ? "Fixo" : "Variavel"}
      </Badge>
    );
  }

  // ── Lancamento card ───────────────────────────────────

  function LancamentoCard({ l }: { l: Lancamento }) {
    return (
      <Card key={l.id} className="mb-3">
        <CardContent className="flex items-center gap-3 p-4">
          {/* Icon */}
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
            style={{
              backgroundColor: l.conta.cor
                ? `${l.conta.cor}20`
                : "#f3f4f6",
            }}
          >
            {l.conta.icone || "📋"}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{l.descricao}</p>
            <p className="text-xs text-muted-foreground">
              {l.conta.nome} - Vence {formatDate(l.dataVencimento)}
            </p>
            {l.responsavel && (
              <p className="text-xs text-muted-foreground">
                {l.responsavel.avatar || "\u{1F464}"}{" "}
                {l.responsavel.nome}{" "}
                {l.tipo === "RECEITA" ? "recebeu" : "pagou"}
              </p>
            )}
            <div className="flex gap-1.5 mt-1.5">
              <StatusBadge status={l.status} />
              <NaturezaBadge natureza={l.natureza} />
            </div>
          </div>

          {/* Value + action */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span
              className={`font-bold text-sm ${
                l.tipo === "RECEITA" ? "text-green-600" : "text-red-600"
              }`}
            >
              {l.tipo === "RECEITA" ? "+" : "-"}{" "}
              {formatCurrency(l.valor)}
            </span>

            {l.status !== "PAGO" && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => marcarComoPago(l.id)}
              >
                <CheckIcon className="size-3.5 mr-1" />
                Pagar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Render ────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header with month selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Controle Financeiro
        </h1>
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
              Dinheiro que entrou
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(totalReceitas)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600 font-medium">
              Dinheiro que saiu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">
              {formatCurrency(totalDespesas)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-600 font-medium">
              Sobrou
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(saldo)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tudo">
        <TabsList className="w-full">
          <TabsTrigger value="tudo">Tudo</TabsTrigger>
          <TabsTrigger value="despesas">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="receitas">Recebimentos</TabsTrigger>
        </TabsList>

        <TabsContent value="tudo">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">
              Carregando...
            </p>
          ) : lancamentos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum lancamento neste mes
            </p>
          ) : (
            lancamentos.map((l) => <LancamentoCard key={l.id} l={l} />)
          )}
        </TabsContent>

        <TabsContent value="despesas">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">
              Carregando...
            </p>
          ) : despesas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma despesa neste mes
            </p>
          ) : (
            despesas.map((l) => <LancamentoCard key={l.id} l={l} />)
          )}
        </TabsContent>

        <TabsContent value="receitas">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">
              Carregando...
            </p>
          ) : receitas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum recebimento neste mes
            </p>
          ) : (
            receitas.map((l) => <LancamentoCard key={l.id} l={l} />)
          )}
        </TabsContent>
      </Tabs>

      {/* FAB - Add new lancamento */}
      <Button
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 h-14 w-14 rounded-full shadow-lg z-40"
        size="icon"
        onClick={() => setSheetOpen(true)}
      >
        <PlusIcon className="size-6" />
      </Button>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>

        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Novo Lancamento</SheetTitle>
            <SheetDescription>
              Registre uma nova receita ou despesa
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-6">
            {/* Tipo */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={form.tipo === "DESPESA" ? "default" : "outline"}
                className={
                  form.tipo === "DESPESA"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : ""
                }
                onClick={() => setForm((f) => ({ ...f, tipo: "DESPESA" }))}
              >
                Despesa
              </Button>
              <Button
                type="button"
                variant={form.tipo === "RECEITA" ? "default" : "outline"}
                className={
                  form.tipo === "RECEITA"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : ""
                }
                onClick={() => setForm((f) => ({ ...f, tipo: "RECEITA" }))}
              >
                Receita
              </Button>
            </div>

            {/* Descricao */}
            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descricao</Label>
              <Input
                id="descricao"
                placeholder="Ex: Conta de luz"
                value={form.descricao}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descricao: e.target.value }))
                }
                required
              />
            </div>

            {/* Valor */}
            <div className="space-y-1.5">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={form.valor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, valor: e.target.value }))
                }
                required
              />
            </div>

            {/* Conta contabil */}
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select
                value={form.contaId}
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, contaId: (val ?? "") as string }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {flat
                    .filter(
                      (c) =>
                        c.tipo === form.tipo ||
                        (!c.tipo.includes("RECEITA") &&
                          !c.tipo.includes("DESPESA"))
                    )
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.icone || "📋"} {c.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Responsavel */}
            <div className="space-y-1.5">
              <Label>Quem pagou/recebeu?</Label>
              <Select
                value={form.responsavelId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, responsavelId: v ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um membro" />
                </SelectTrigger>
                <SelectContent>
                  {membros.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.avatar || "\u{1F464}"} {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Natureza */}
            <div className="space-y-1.5">
              <Label>Natureza</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={form.natureza === "FIXO" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setForm((f) => ({ ...f, natureza: "FIXO" }))
                  }
                >
                  Fixo
                </Button>
                <Button
                  type="button"
                  variant={
                    form.natureza === "VARIAVEL" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setForm((f) => ({ ...f, natureza: "VARIAVEL" }))
                  }
                >
                  Variavel
                </Button>
              </div>
            </div>

            {/* Data vencimento */}
            <div className="space-y-1.5">
              <Label htmlFor="dataVencimento">Data de Vencimento</Label>
              <Input
                id="dataVencimento"
                type="date"
                value={form.dataVencimento}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    dataVencimento: e.target.value,
                  }))
                }
                required
              />
            </div>

            {/* Recorrente */}
            <div className="flex items-center gap-3">
              <input
                id="recorrente"
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300"
                checked={form.recorrente}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    recorrente: e.target.checked,
                  }))
                }
              />
              <Label htmlFor="recorrente" className="cursor-pointer">
                Lancamento recorrente (todo mes)
              </Label>
            </div>

            {/* Dia vencimento (if recorrente) */}
            {form.recorrente && (
              <div className="space-y-1.5">
                <Label htmlFor="diaVencimento">Dia do Vencimento</Label>
                <Input
                  id="diaVencimento"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Ex: 10"
                  value={form.diaVencimento}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      diaVencimento: e.target.value,
                    }))
                  }
                />
              </div>
            )}

            {/* Observacao */}
            <div className="space-y-1.5">
              <Label htmlFor="observacao">Observacao (opcional)</Label>
              <Input
                id="observacao"
                placeholder="Alguma anotacao..."
                value={form.observacao}
                onChange={(e) =>
                  setForm((f) => ({ ...f, observacao: e.target.value }))
                }
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar Lancamento"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
