"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate } from "@/lib/utils";

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
  cor: string | null;
  _count: { itens: number };
  totalEstimado: number;
  totalReal: number;
}

const TIPO_EMOJI: Record<string, string> = {
  VIAGEM: "✈️",
  FESTA: "🎉",
  CASAMENTO: "💒",
  OUTRO: "📌",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PLANEJANDO: {
    label: "Planejando",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  CONFIRMADO: {
    label: "Confirmado",
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  CONCLUIDO: {
    label: "Concluido",
    color: "bg-green-100 text-green-800 border-green-300",
  },
  CANCELADO: {
    label: "Cancelado",
    color: "bg-red-100 text-red-800 border-red-300",
  },
};

const TIPO_OPTIONS = [
  { value: "VIAGEM", label: "✈️ Viagem" },
  { value: "FESTA", label: "🎉 Festa" },
  { value: "CASAMENTO", label: "💒 Casamento" },
  { value: "OUTRO", label: "📌 Outro" },
];

export default function EventosPage() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    tipo: "",
    dataInicio: "",
    dataFim: "",
    local: "",
    orcamentoPrevisto: "",
    descricao: "",
  });

  const fetchEventos = useCallback(async () => {
    try {
      const res = await fetch("/api/eventos");
      if (res.ok) {
        const data = await res.json();
        setEventos(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo || !form.tipo || !form.dataInicio) return;

    setSaving(true);
    try {
      const res = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          orcamentoPrevisto: form.orcamentoPrevisto
            ? Number(form.orcamentoPrevisto)
            : 0,
        }),
      });
      if (res.ok) {
        setDialogOpen(false);
        setForm({
          titulo: "",
          tipo: "",
          dataInicio: "",
          dataFim: "",
          local: "",
          orcamentoPrevisto: "",
          descricao: "",
        });
        fetchEventos();
      }
    } finally {
      setSaving(false);
    }
  };

  const budgetPercent = (evento: Evento) => {
    if (!evento.orcamentoPrevisto || evento.orcamentoPrevisto === 0) return 0;
    return Math.min(
      100,
      Math.round((evento.totalReal / evento.orcamentoPrevisto) * 100)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Eventos e Programacoes
          </h1>
          <p className="text-gray-500 mt-1">
            Planeje e acompanhe os eventos da familia
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : eventos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <span className="text-5xl mb-4">🎯</span>
            <p className="text-gray-500 text-center text-lg">
              Nenhum evento criado ainda
            </p>
            <p className="text-gray-400 text-center text-sm mt-1">
              Crie seu primeiro evento clicando no botao abaixo
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventos.map((evento) => {
            const statusCfg = STATUS_CONFIG[evento.status] || STATUS_CONFIG.PLANEJANDO;
            const emoji = TIPO_EMOJI[evento.tipo] || "📌";
            const percent = budgetPercent(evento);

            return (
              <Card
                key={evento.id}
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                onClick={() => router.push(`/eventos/${evento.id}`)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl flex-shrink-0">{emoji}</span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {evento.titulo}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatDate(evento.dataInicio)}
                          {evento.dataFim &&
                            ` - ${formatDate(evento.dataFim)}`}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs flex-shrink-0 ${statusCfg.color}`}
                    >
                      {statusCfg.label}
                    </Badge>
                  </div>

                  {evento.local && (
                    <p className="text-xs text-gray-400 truncate">
                      📍 {evento.local}
                    </p>
                  )}

                  {evento.orcamentoPrevisto > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Orcamento</span>
                        <span>
                          {percent}% usado
                        </span>
                      </div>
                      <Progress value={percent} className="h-2" />
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">
                          Real: {formatCurrency(evento.totalReal)}
                        </span>
                        <span className="text-gray-400">
                          de {formatCurrency(evento.orcamentoPrevisto)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 text-xs text-gray-500 pt-1 border-t">
                    <span>
                      Estimado: {formatCurrency(evento.totalEstimado)}
                    </span>
                    <span>
                      {evento._count.itens} ite{evento._count.itens === 1 ? "m" : "ns"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <Button
        size="lg"
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 rounded-full h-14 w-14 shadow-lg text-2xl z-50"
        onClick={() => setDialogOpen(true)}
      >
        +
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Evento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Titulo *</Label>
              <Input
                id="titulo"
                value={form.titulo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, titulo: e.target.value }))
                }
                placeholder="Nome do evento"
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm((f) => ({ ...f, tipo: v ?? "" }))}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Inicio *</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={form.dataInicio}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dataInicio: e.target.value }))
                  }
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataFim">Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={form.dataFim}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dataFim: e.target.value }))
                  }
                  className="h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                value={form.local}
                onChange={(e) =>
                  setForm((f) => ({ ...f, local: e.target.value }))
                }
                placeholder="Onde sera o evento"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orcamentoPrevisto">Orcamento Previsto (R$)</Label>
              <Input
                id="orcamentoPrevisto"
                type="number"
                step="0.01"
                min="0"
                value={form.orcamentoPrevisto}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    orcamentoPrevisto: e.target.value,
                  }))
                }
                placeholder="0,00"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descricao</Label>
              <Input
                id="descricao"
                value={form.descricao}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descricao: e.target.value }))
                }
                placeholder="Detalhes do evento"
                className="h-12"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={saving || !form.titulo || !form.tipo || !form.dataInicio}
            >
              {saving ? "Salvando..." : "Criar Evento"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
