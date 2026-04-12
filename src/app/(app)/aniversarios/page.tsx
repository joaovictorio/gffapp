"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { diasAteAniversario, formatDate } from "@/lib/utils";

const PARENTESCO_OPTIONS = [
  "Pai",
  "Mae",
  "Filho(a)",
  "Irmao(a)",
  "Avo(o)",
  "Tio(a)",
  "Primo(a)",
  "Sobrinho(a)",
  "Cunhado(a)",
  "Sogro(a)",
  "Amigo(a)",
  "Colega",
  "Vizinho(a)",
  "Outro",
];

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

interface Aniversario {
  id: string;
  nome: string;
  data: string;
  anoConhecido: boolean;
  parentesco: string | null;
  telefone: string | null;
  observacao: string | null;
  icone: string | null;
}

const emptyForm = {
  nome: "",
  data: "",
  anoConhecido: true,
  parentesco: "",
  telefone: "",
  observacao: "",
  icone: "🎂",
};

export default function AniversariosPage() {
  const [aniversarios, setAniversarios] = useState<Aniversario[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"lista" | "calendario">("lista");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchAniversarios = useCallback(async () => {
    try {
      const res = await fetch("/api/aniversarios");
      if (res.ok) {
        const data = await res.json();
        setAniversarios(data);
      }
    } catch (error) {
      console.error("Erro ao buscar aniversarios:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAniversarios();
  }, [fetchAniversarios]);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(a: Aniversario) {
    setEditingId(a.id);
    setForm({
      nome: a.nome,
      data: a.data.split("T")[0],
      anoConhecido: a.anoConhecido,
      parentesco: a.parentesco || "",
      telefone: a.telefone || "",
      observacao: a.observacao || "",
      icone: a.icone || "🎂",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.nome || !form.data) return;
    setSaving(true);

    try {
      const payload = {
        nome: form.nome,
        data: form.data,
        anoConhecido: form.anoConhecido,
        parentesco: form.parentesco || null,
        telefone: form.telefone || null,
        observacao: form.observacao || null,
        icone: form.icone || null,
      };

      if (editingId) {
        await fetch(`/api/aniversarios/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/aniversarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setDialogOpen(false);
      fetchAniversarios();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este aniversario?")) return;

    try {
      await fetch(`/api/aniversarios/${id}`, { method: "DELETE" });
      fetchAniversarios();
    } catch (error) {
      console.error("Erro ao remover:", error);
    }
  }

  function getDiasColor(dias: number) {
    if (dias === 0) return "bg-green-500 text-white";
    if (dias < 7) return "bg-green-100 text-green-800 border-green-300";
    if (dias < 30) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-gray-100 text-gray-600 border-gray-300";
  }

  function getDiasLabel(dias: number) {
    if (dias === 0) return "Hoje!";
    if (dias === 1) return "Amanha!";
    return `${dias} dias`;
  }

  const sortedByUpcoming = [...aniversarios].sort(
    (a, b) => diasAteAniversario(a.data) - diasAteAniversario(b.data)
  );

  const byMonth = MESES.map((mes, i) =>
    aniversarios.filter((a) => new Date(a.data).getMonth() === i)
  );

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            🎂 Aniversarios
          </h1>
          <p className="text-gray-500 mt-1">
            {aniversarios.length}{" "}
            {aniversarios.length === 1 ? "aniversario" : "aniversarios"}{" "}
            cadastrados
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant={view === "lista" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("lista")}
          >
            📋 Lista
          </Button>
          <Button
            variant={view === "calendario" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("calendario")}
          >
            📅 Calendario
          </Button>
        </div>
      </div>

      {/* Upcoming List View */}
      {view === "lista" && (
        <div className="space-y-3">
          {sortedByUpcoming.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-4xl mb-3">🎈</p>
                <p className="text-gray-500">
                  Nenhum aniversario cadastrado ainda
                </p>
                <Button className="mt-4" onClick={openNew}>
                  Adicionar primeiro aniversario
                </Button>
              </CardContent>
            </Card>
          )}

          {sortedByUpcoming.map((a) => {
            const dias = diasAteAniversario(a.data);
            return (
              <Card
                key={a.id}
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
                onClick={() => openEdit(a)}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="text-3xl flex-shrink-0">
                    {a.icone || "🎂"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {a.nome}
                      </h3>
                      {a.parentesco && (
                        <Badge variant="secondary" className="text-xs">
                          {a.parentesco}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatDate(a.data)}
                    </p>
                    {a.telefone && (
                      <p className="text-sm text-gray-400 mt-0.5">
                        📞 {a.telefone}
                      </p>
                    )}
                  </div>
                  <Badge
                    className={`flex-shrink-0 text-sm px-3 py-1 ${getDiasColor(dias)}`}
                  >
                    {getDiasLabel(dias)}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Calendar Grid View */}
      {view === "calendario" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MESES.map((mes, i) => (
            <Card key={mes} className={byMonth[i].length > 0 ? "border-blue-200" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {mes}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {byMonth[i].length === 0 ? (
                  <p className="text-xs text-gray-400">Nenhum</p>
                ) : (
                  <div className="space-y-2">
                    {byMonth[i]
                      .sort(
                        (a, b) =>
                          new Date(a.data).getDate() -
                          new Date(b.data).getDate()
                      )
                      .map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg p-1 -m-1"
                          onClick={() => openEdit(a)}
                        >
                          <span className="text-lg">{a.icone || "🎂"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {a.nome}
                            </p>
                            <p className="text-xs text-gray-400">
                              Dia {new Date(a.data).getDate()}
                            </p>
                          </div>
                          {a.parentesco && (
                            <Badge variant="outline" className="text-xs">
                              {a.parentesco}
                            </Badge>
                          )}
                        </div>
                      ))}
                  </div>
                )}
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
              {editingId ? "Editar Aniversario" : "Novo Aniversario"} 🎂
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
                  className="w-16 text-center text-xl"
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
                  placeholder="Nome da pessoa"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={form.data}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, data: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentesco">Parentesco</Label>
                <Select
                  value={form.parentesco}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, parentesco: v ?? "" }))
                  }
                >
                  <SelectTrigger id="parentesco">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARENTESCO_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={form.telefone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, telefone: e.target.value }))
                }
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacao">Observacao</Label>
              <Input
                id="observacao"
                value={form.observacao}
                onChange={(e) =>
                  setForm((f) => ({ ...f, observacao: e.target.value }))
                }
                placeholder="Alguma nota..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              {editingId && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDelete(editingId);
                    setDialogOpen(false);
                  }}
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
                disabled={saving || !form.nome || !form.data}
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
