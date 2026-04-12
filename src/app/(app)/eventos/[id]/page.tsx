"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ContaContabil {
  id: string;
  codigo: string;
  nome: string;
  icone: string;
  tipo: string;
}

interface EventoItem {
  id: string;
  descricao: string;
  valorEstimado: number;
  valorReal: number | null;
  status: string;
  conta: ContaContabil | null;
}

interface Evento {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  dataInicio: string;
  dataFim: string | null;
  local: string | null;
  status: string;
  orcamentoPrevisto: number;
  icone: string | null;
  itens: EventoItem[];
}

const STATUS_CORES: Record<string, string> = {
  PLANEJANDO: "bg-yellow-100 text-yellow-800",
  CONFIRMADO: "bg-blue-100 text-blue-800",
  CONCLUIDO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

const TIPO_ICONE: Record<string, string> = {
  VIAGEM: "✈️",
  FESTA: "🎉",
  CASAMENTO: "💒",
  OUTRO: "📌",
};

export default function EventoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [evento, setEvento] = useState<Evento | null>(null);
  const [contas, setContas] = useState<ContaContabil[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<EventoItem | null>(null);

  const [descricao, setDescricao] = useState("");
  const [valorEstimado, setValorEstimado] = useState("");
  const [valorReal, setValorReal] = useState("");
  const [contaId, setContaId] = useState("");
  const [statusItem, setStatusItem] = useState("PENDENTE");

  const fetchEvento = useCallback(async () => {
    const res = await fetch(`/api/eventos/${id}`);
    if (res.ok) {
      setEvento(await res.json());
    }
  }, [id]);

  const fetchContas = useCallback(async () => {
    const res = await fetch("/api/plano-de-contas");
    if (res.ok) {
      const tree = await res.json();
      const flat: ContaContabil[] = [];
      function flatten(items: (ContaContabil & { filhos?: ContaContabil[] })[]) {
        for (const item of items) {
          flat.push(item);
          if (item.filhos) flatten(item.filhos);
        }
      }
      flatten(tree);
      setContas(flat);
    }
  }, []);

  useEffect(() => {
    fetchEvento();
    fetchContas();
  }, [fetchEvento, fetchContas]);

  function openNew() {
    setEditItem(null);
    setDescricao("");
    setValorEstimado("");
    setValorReal("");
    setContaId("");
    setStatusItem("PENDENTE");
    setDialogOpen(true);
  }

  function openEdit(item: EventoItem) {
    setEditItem(item);
    setDescricao(item.descricao);
    setValorEstimado(item.valorEstimado.toString());
    setValorReal(item.valorReal?.toString() || "");
    setContaId(item.conta?.id || "");
    setStatusItem(item.status);
    setDialogOpen(true);
  }

  async function salvar() {
    const body = {
      descricao,
      valorEstimado: parseFloat(valorEstimado) || 0,
      valorReal: valorReal ? parseFloat(valorReal) : null,
      contaId: contaId || null,
      status: statusItem,
    };

    if (editItem) {
      await fetch(`/api/eventos/${id}/itens/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch(`/api/eventos/${id}/itens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setDialogOpen(false);
    fetchEvento();
  }

  async function excluirItem(itemId: string) {
    await fetch(`/api/eventos/${id}/itens/${itemId}`, { method: "DELETE" });
    fetchEvento();
  }

  async function marcarPago(itemId: string) {
    await fetch(`/api/eventos/${id}/itens/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAGO" }),
    });
    fetchEvento();
  }

  if (!evento) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  const totalEstimado = evento.itens.reduce((s, i) => s + i.valorEstimado, 0);
  const totalReal = evento.itens.reduce((s, i) => s + (i.valorReal || 0), 0);
  const orcamento = evento.orcamentoPrevisto || totalEstimado || 1;
  const percentGasto = Math.min((totalReal / orcamento) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.push("/eventos")} className="mb-2 -ml-2">
            ← Voltar
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">
            {TIPO_ICONE[evento.tipo] || "📌"} {evento.titulo}
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge className={STATUS_CORES[evento.status]}>
              {evento.status}
            </Badge>
            <span className="text-sm text-gray-500">
              {formatDate(evento.dataInicio)}
              {evento.dataFim && ` - ${formatDate(evento.dataFim)}`}
            </span>
            {evento.local && (
              <span className="text-sm text-gray-500">📍 {evento.local}</span>
            )}
          </div>
          {evento.descricao && (
            <p className="text-gray-600 mt-2">{evento.descricao}</p>
          )}
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-600 font-medium">
              🎯 Orcamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-blue-700">
              {formatCurrency(evento.orcamentoPrevisto)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-600 font-medium">
              📋 Estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-yellow-700">
              {formatCurrency(totalEstimado)}
            </p>
          </CardContent>
        </Card>

        <Card className={totalReal > orcamento ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${totalReal > orcamento ? "text-red-600" : "text-green-600"}`}>
              💰 Gasto Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${totalReal > orcamento ? "text-red-700" : "text-green-700"}`}>
              {formatCurrency(totalReal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Progresso do Orcamento</span>
            <span className="text-sm font-medium">{percentGasto.toFixed(0)}%</span>
          </div>
          <Progress
            value={percentGasto}
            className={`h-4 ${percentGasto > 90 ? "[&>div]:bg-red-500" : percentGasto > 70 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"}`}
          />
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>R$ 0</span>
            <span>{formatCurrency(orcamento)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Budget Items */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">📦 Itens do Orcamento</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={() => { openNew(); setDialogOpen(true); }} className="h-10">
            + Novo Item
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editItem ? "Editar Item" : "Novo Item do Orcamento"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Descricao</Label>
                <Input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Gasolina, Hotel, Presente..."
                  className="h-12"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Estimado</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valorEstimado}
                    onChange={(e) => setValorEstimado(e.target.value)}
                    placeholder="0,00"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Real</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valorReal}
                    onChange={(e) => setValorReal(e.target.value)}
                    placeholder="0,00"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categoria (Plano de Contas)</Label>
                <Select value={contaId} onValueChange={(v) => setContaId(v ?? "")}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.icone} {c.codigo} - {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusItem} onValueChange={(v) => setStatusItem(v ?? "PENDENTE")}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="PAGO">Pago</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={salvar} className="w-full h-12">
                {editItem ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {evento.itens.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-gray-500">Nenhum item no orcamento</p>
            <p className="text-sm text-gray-400">Adicione itens como gasolina, hotel, presentes...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {evento.itens.map((item) => {
            const diff = item.valorReal != null ? item.valorEstimado - item.valorReal : null;
            return (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">
                        {item.conta?.icone || "📦"}
                      </span>
                      <div>
                        <p className="font-medium">{item.descricao}</p>
                        {item.conta && (
                          <p className="text-xs text-gray-500">
                            {item.conta.codigo} - {item.conta.nome}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-sm">
                          <span className="text-gray-500">
                            Estimado: {formatCurrency(item.valorEstimado)}
                          </span>
                          {item.valorReal != null && (
                            <span className="font-medium">
                              Real: {formatCurrency(item.valorReal)}
                            </span>
                          )}
                          {diff != null && (
                            <span
                              className={`text-xs font-medium ${diff >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {diff >= 0 ? `Economizou ${formatCurrency(diff)}` : `Passou ${formatCurrency(Math.abs(diff))}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          item.status === "PAGO"
                            ? "bg-green-100 text-green-800"
                            : item.status === "CANCELADO"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 justify-end">
                    {item.status === "PENDENTE" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => marcarPago(item.id)}
                        className="text-green-600"
                      >
                        ✓ Pagar
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(item)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => excluirItem(item.id)}
                      className="text-red-600"
                    >
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
