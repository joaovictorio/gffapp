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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  PlusIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  Trash2Icon,
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
  formaPagamento?: string | null;
  contaBancaria?: { id: string; nome: string; icone: string | null } | null;
  codigoBarras?: string | null;
  multa?: number | null;
  juros?: number | null;
  contaBancariaId?: string | null;
  responsavelId?: string | null;
}

interface ContaBancaria {
  id: string;
  nome: string;
  icone: string | null;
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

const FORMAS_PAGAMENTO = [
  { value: "PIX", label: "\u{1F511} Pix" },
  { value: "DEBITO", label: "\u{1F4B3} Debito" },
  { value: "CREDITO", label: "\u{1F4B3} Credito" },
  { value: "DINHEIRO", label: "\u{1F4B5} Dinheiro" },
  { value: "TRANSFERENCIA", label: "\u{1F504} Transferencia" },
  { value: "BOLETO", label: "\u{1F4C4} Boleto" },
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
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    formaPagamento: "",
    contaBancariaId: "",
    codigoBarras: "",
    multa: "",
    juros: "",
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

  const fetchContasBancarias = useCallback(async () => {
    try {
      const res = await fetch("/api/contas-bancarias");
      if (res.ok) {
        const data = await res.json();
        setContasBancarias(data);
      }
    } catch (err) {
      console.error("Erro ao carregar contas bancarias:", err);
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

  useEffect(() => {
    fetchContasBancarias();
  }, [fetchContasBancarias]);

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

  // ── Quitacao dialog ────────────────────────────────────

  const [quitarOpen, setQuitarOpen] = useState(false);
  const [quitarId, setQuitarId] = useState<string | null>(null);
  const [quitarForm, setQuitarForm] = useState({
    dataPagamento: new Date().toISOString().split("T")[0],
    formaPagamento: "",
    contaBancariaId: "",
    responsavelId: "",
  });
  const [quitarSaving, setQuitarSaving] = useState(false);

  function abrirQuitar(l: Lancamento) {
    setQuitarId(l.id);
    setQuitarForm({
      dataPagamento: new Date().toISOString().split("T")[0],
      formaPagamento: l.formaPagamento || "",
      contaBancariaId: l.contaBancariaId || "",
      responsavelId: l.responsavelId || "",
    });
    setQuitarOpen(true);
  }

  async function confirmarQuitacao() {
    if (!quitarId) return;
    setQuitarSaving(true);
    try {
      const res = await fetch(`/api/lancamentos/${quitarId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAGO",
          dataPagamento: quitarForm.dataPagamento,
          formaPagamento: quitarForm.formaPagamento || null,
          contaBancariaId: quitarForm.contaBancariaId || null,
          responsavelId: quitarForm.responsavelId || null,
        }),
      });
      if (res.ok) {
        setQuitarOpen(false);
        fetchLancamentos();
      }
    } catch (err) {
      console.error("Erro ao quitar:", err);
    } finally {
      setQuitarSaving(false);
    }
  }

  // ── Create / Update lancamento ─────────────────────────

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
        formaPagamento: form.formaPagamento || null,
        contaBancariaId: form.contaBancariaId || null,
        codigoBarras: form.codigoBarras || null,
        multa: form.multa ? parseFloat(form.multa) : 0,
        juros: form.juros ? parseFloat(form.juros) : 0,
      };

      const url = editingId
        ? `/api/lancamentos/${editingId}`
        : "/api/lancamentos";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSheetOpen(false);
        resetForm();
        fetchLancamentos();
      }
    } catch (err) {
      console.error("Erro ao salvar lancamento:", err);
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setEditingId(null);
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
      formaPagamento: "",
      contaBancariaId: "",
      codigoBarras: "",
      multa: "",
      juros: "",
    });
  }

  function editarLancamento(l: Lancamento) {
    setEditingId(l.id);
    setForm({
      descricao: l.descricao,
      valor: l.valor.toString(),
      tipo: l.tipo,
      natureza: l.natureza,
      contaId: l.conta.id,
      dataVencimento: l.dataVencimento.split("T")[0],
      recorrente: l.recorrente,
      diaVencimento: l.diaVencimento?.toString() || "",
      observacao: l.observacao || "",
      responsavelId: l.responsavel?.id || "",
      formaPagamento: l.formaPagamento || "",
      contaBancariaId: l.contaBancaria?.id || "",
      codigoBarras: l.codigoBarras || "",
      multa: l.multa ? l.multa.toString() : "",
      juros: l.juros ? l.juros.toString() : "",
    });
    setSheetOpen(true);
  }

  async function excluirLancamento(id: string) {
    try {
      const res = await fetch(`/api/lancamentos/${id}`, { method: "DELETE" });
      if (res.ok) fetchLancamentos();
    } catch (err) {
      console.error("Erro ao excluir:", err);
    }
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
            {(l.formaPagamento || l.contaBancaria) && (
              <div className="flex gap-1.5 mt-1">
                {l.formaPagamento && (
                  <Badge variant="outline" className="text-xs">
                    {FORMAS_PAGAMENTO.find((fp) => fp.value === l.formaPagamento)?.label || l.formaPagamento}
                  </Badge>
                )}
                {l.contaBancaria && (
                  <Badge variant="outline" className="text-xs">
                    {l.contaBancaria.icone || "\u{1F3E6}"} {l.contaBancaria.nome}
                  </Badge>
                )}
              </div>
            )}
            <div className="flex gap-1.5 mt-1.5">
              <StatusBadge status={l.status} />
              <NaturezaBadge natureza={l.natureza} />
            </div>
          </div>

          {/* Value + actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span
              className={`font-bold text-sm ${
                l.tipo === "RECEITA" ? "text-green-600" : "text-red-600"
              }`}
            >
              {l.tipo === "RECEITA" ? "+" : "-"}{" "}
              {formatCurrency(l.valor)}
            </span>
            {(l.multa || l.juros) && (
              <span className="text-xs text-orange-600">
                {l.multa ? `Multa: ${formatCurrency(l.multa)} ` : ""}
                {l.juros ? `Juros: ${formatCurrency(l.juros)}` : ""}
              </span>
            )}

            <div className="flex gap-1">
              {l.status !== "PAGO" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs text-green-600"
                  onClick={() => abrirQuitar(l)}
                >
                  <CheckIcon className="size-3.5" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => editarLancamento(l)}
              >
                <PencilIcon className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs text-red-600"
                onClick={() => excluirLancamento(l.id)}
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </div>
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
        onClick={() => { resetForm(); setSheetOpen(true); }}
      >
        <PlusIcon className="size-6" />
      </Button>
      {/* Dialog de Quitacao */}
      <Dialog open={quitarOpen} onOpenChange={setQuitarOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quitar Lancamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Data do Pagamento</Label>
              <Input
                type="date"
                value={quitarForm.dataPagamento}
                onChange={(e) => setQuitarForm((f) => ({ ...f, dataPagamento: e.target.value }))}
                className="h-12"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Forma de Pagamento</Label>
              <Select
                value={quitarForm.formaPagamento || undefined}
                onValueChange={(v) => setQuitarForm((f) => ({ ...f, formaPagamento: v ?? "" }))}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione...">
                    {quitarForm.formaPagamento ? FORMAS_PAGAMENTO.find(x => x.value === quitarForm.formaPagamento)?.label : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map((fp) => (
                    <SelectItem key={fp.value} value={fp.value}>
                      {fp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Conta Bancaria</Label>
              <Select
                value={quitarForm.contaBancariaId || undefined}
                onValueChange={(v) => setQuitarForm((f) => ({ ...f, contaBancariaId: v ?? "" }))}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione...">
                    {quitarForm.contaBancariaId ? (() => { const cb = contasBancarias.find(x => x.id === quitarForm.contaBancariaId); return cb ? `${cb.icone || "🏦"} ${cb.nome}` : undefined; })() : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {contasBancarias.map((cb) => (
                    <SelectItem key={cb.id} value={cb.id}>
                      {cb.icone || "🏦"} {cb.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Quem Pagou?</Label>
              <Select
                value={quitarForm.responsavelId || undefined}
                onValueChange={(v) => setQuitarForm((f) => ({ ...f, responsavelId: v ?? "" }))}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione...">
                    {quitarForm.responsavelId ? (() => { const m = membros.find(x => x.id === quitarForm.responsavelId); return m ? `${m.avatar || "👤"} ${m.nome}` : undefined; })() : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {membros.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.avatar || "👤"} {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
              onClick={confirmarQuitacao}
              disabled={quitarSaving}
            >
              {quitarSaving ? "Quitando..." : "Confirmar Quitacao"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) setEditingId(null); }}>

        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{editingId ? "Editar Lancamento" : "Novo Lancamento"}</SheetTitle>
            <SheetDescription>
              {editingId ? "Altere os dados do lancamento" : "Registre uma nova receita ou despesa"}
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
                value={form.contaId || undefined}
                onValueChange={(val) =>
                  setForm((f) => ({ ...f, contaId: (val ?? "") as string }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma categoria">
                    {form.contaId ? (() => { const c = flat.find(x => x.id === form.contaId); return c ? `${c.icone || "📋"} ${c.nome}` : undefined; })() : undefined}
                  </SelectValue>
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
                value={form.responsavelId || undefined}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, responsavelId: v ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um membro">
                    {form.responsavelId ? (() => { const m = membros.find(x => x.id === form.responsavelId); return m ? `${m.avatar || "👤"} ${m.nome}` : undefined; })() : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {membros.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.avatar || "👤"} {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Forma de Pagamento */}
            <div className="space-y-1.5">
              <Label>Forma de Pagamento</Label>
              <Select
                value={form.formaPagamento || undefined}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, formaPagamento: v ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a forma de pagamento">
                    {form.formaPagamento ? FORMAS_PAGAMENTO.find(x => x.value === form.formaPagamento)?.label : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map((fp) => (
                    <SelectItem key={fp.value} value={fp.value}>
                      {fp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conta Bancaria */}
            <div className="space-y-1.5">
              <Label>Conta Bancaria</Label>
              <Select
                value={form.contaBancariaId || undefined}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, contaBancariaId: v ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a conta bancaria">
                    {form.contaBancariaId ? (() => { const cb = contasBancarias.find(x => x.id === form.contaBancariaId); return cb ? `${cb.icone || "🏦"} ${cb.nome}` : undefined; })() : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {contasBancarias.map((cb) => (
                    <SelectItem key={cb.id} value={cb.id}>
                      {cb.icone || "🏦"} {cb.nome}
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

            {/* Codigo de Barras (only for DESPESA) */}
            {form.tipo === "DESPESA" && (
              <div className="space-y-1.5">
                <Label>Codigo de Barras</Label>
                <Input
                  placeholder="Cole o codigo de barras do boleto"
                  value={form.codigoBarras}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, codigoBarras: e.target.value }))
                  }
                />
              </div>
            )}

            {/* Multa e Juros */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Multa (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.multa}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, multa: e.target.value }))
                  }
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Juros (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.juros}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, juros: e.target.value }))
                  }
                  placeholder="0,00"
                />
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={saving}
            >
              {saving ? "Salvando..." : editingId ? "Atualizar" : "Salvar Lancamento"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
