"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContaContabil {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  parentId: string | null;
  icone: string | null;
  cor: string | null;
  ordem: number;
  ativo: boolean;
  filhos: ContaContabil[];
}

interface FormData {
  codigo: string;
  nome: string;
  tipo: string;
  parentId: string;
  icone: string;
  cor: string;
  ordem: number;
}

const emptyForm: FormData = {
  codigo: "",
  nome: "",
  tipo: "DESPESA",
  parentId: "",
  icone: "📁",
  cor: "",
  ordem: 0,
};

const emojiOptions = [
  "📁", "💰", "🏠", "🚗", "🍔", "💡", "📱", "🎓",
  "❤️", "🎉", "🛒", "👶", "🐾", "✈️", "💊", "🎮",
  "👕", "🔧", "📚", "🏦", "💼", "🎵", "⛪", "🎁",
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

function ContaTree({
  contas,
  level,
  onEdit,
}: {
  contas: ContaContabil[];
  level: number;
  onEdit: (conta: ContaContabil) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!contas || contas.length === 0) return null;

  return (
    <div className="space-y-2">
      {contas.map((conta) => {
        const hasChildren = conta.filhos && conta.filhos.length > 0;
        const isOpen = expanded[conta.id];

        return (
          <div key={conta.id} style={{ paddingLeft: level * 20 }}>
            <Card
              className={`transition-all ${
                !conta.ativo ? "opacity-50" : ""
              } ${
                conta.tipo === "RECEITA"
                  ? "border-green-200 hover:border-green-300"
                  : "border-red-200 hover:border-red-300"
              }`}
            >
              <CardContent className="flex items-center gap-3 p-3">
                {hasChildren ? (
                  <button
                    onClick={() => toggle(conta.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-lg transition-transform"
                  >
                    {isOpen ? "🔽" : "▶️"}
                  </button>
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center">
                    <span className="text-gray-300">•</span>
                  </div>
                )}

                <span className="text-xl">{conta.icone || "📁"}</span>

                <span className="text-xs font-mono text-gray-400 min-w-[60px]">
                  {conta.codigo}
                </span>

                <span className="font-medium text-gray-800 flex-1">
                  {conta.nome}
                </span>

                <Badge
                  className={
                    conta.tipo === "RECEITA"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-red-100 text-red-700 border-red-200"
                  }
                  variant="outline"
                >
                  {conta.tipo === "RECEITA" ? "💚 Receita" : "💸 Despesa"}
                </Badge>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10"
                  onClick={() => onEdit(conta)}
                >
                  ✏️
                </Button>
              </CardContent>
            </Card>

            {hasChildren && isOpen && (
              <div className="mt-2">
                <ContaTree
                  contas={conta.filhos}
                  level={level + 1}
                  onEdit={onEdit}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PlanoDeContasPage() {
  const [contas, setContas] = useState<ContaContabil[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaContabil | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchContas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/plano-de-contas");
      if (res.ok) {
        const data = await res.json();
        setContas(data);
      }
    } catch {
      console.error("Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContas();
  }, [fetchContas]);

  const openNewDialog = () => {
    setEditingConta(null);
    setForm(emptyForm);
    setError("");
    setDialogOpen(true);
  };

  const openEditDialog = (conta: ContaContabil) => {
    setEditingConta(conta);
    setForm({
      codigo: conta.codigo,
      nome: conta.nome,
      tipo: conta.tipo,
      parentId: conta.parentId || "",
      icone: conta.icone || "📁",
      cor: conta.cor || "",
      ordem: conta.ordem,
    });
    setError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.codigo.trim() || !form.nome.trim()) {
      setError("Codigo e nome sao obrigatorios");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingConta) {
        const res = await fetch(`/api/plano-de-contas/${editingConta.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: form.nome,
            icone: form.icone,
            cor: form.cor,
            ordem: form.ordem,
            ativo: editingConta.ativo,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Erro ao atualizar");
          return;
        }
      } else {
        const res = await fetch("/api/plano-de-contas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codigo: form.codigo,
            nome: form.nome,
            tipo: form.tipo,
            parentId: form.parentId || null,
            icone: form.icone,
            cor: form.cor,
            ordem: form.ordem,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Erro ao criar conta");
          return;
        }
      }

      setDialogOpen(false);
      fetchContas();
    } catch {
      setError("Erro de conexao");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingConta) return;

    if (!confirm("Tem certeza que deseja excluir esta conta?")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/plano-de-contas/${editingConta.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao excluir");
        return;
      }
      setDialogOpen(false);
      fetchContas();
    } catch {
      setError("Erro de conexao");
    } finally {
      setSaving(false);
    }
  };

  const allFlat = flattenContas(contas);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            📊 Plano de Contas
          </h1>
          <p className="text-gray-500 mt-1">
            Organize as categorias de receitas e despesas da familia
          </p>
        </div>
        <Button onClick={openNewDialog} className="h-12 px-6 text-base">
          ➕ Nova Conta
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="text-4xl animate-bounce">📊</div>
            <p className="text-gray-500">Carregando contas...</p>
          </div>
        </div>
      ) : contas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="text-5xl">📭</div>
            <p className="text-gray-500 text-lg">
              Nenhuma conta cadastrada ainda
            </p>
            <Button onClick={openNewDialog} className="h-12 px-6 text-base">
              ➕ Criar primeira conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ContaTree contas={contas} level={0} onEdit={openEditDialog} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingConta ? "✏️ Editar Conta" : "➕ Nova Conta"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Icone</Label>
              <div className="flex flex-wrap gap-2">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, icone: emoji }))}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      form.icone === emoji
                        ? "bg-blue-100 ring-2 ring-blue-400 scale-110"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Codigo</Label>
                <Input
                  id="codigo"
                  placeholder="1.1.01"
                  value={form.codigo}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      codigo: (e.target as HTMLInputElement).value,
                    }))
                  }
                  disabled={!!editingConta}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ordem">Ordem</Label>
                <Input
                  id="ordem"
                  type="number"
                  value={form.ordem}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      ordem: parseInt((e.target as HTMLInputElement).value) || 0,
                    }))
                  }
                  className="h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Conta</Label>
              <Input
                id="nome"
                placeholder="Ex: Alimentacao, Salario..."
                value={form.nome}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    nome: (e.target as HTMLInputElement).value,
                  }))
                }
                className="h-12"
              />
            </div>

            {!editingConta && (
              <>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={form.tipo}
                    onValueChange={(val) =>
                      setForm((f) => ({ ...f, tipo: (val ?? "DESPESA") as string }))
                    }
                  >
                    <SelectTrigger className="h-12 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DESPESA">
                        💸 Despesa
                      </SelectItem>
                      <SelectItem value="RECEITA">
                        💚 Receita
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Conta Pai (opcional)</Label>
                  <Select
                    value={form.parentId}
                    onValueChange={(val) =>
                      setForm((f) => ({
                        ...f,
                        parentId: !val || val === "__none__" ? "" : val,
                      }))
                    }
                  >
                    <SelectTrigger className="h-12 w-full">
                      <SelectValue placeholder="Nenhuma (conta raiz)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        📂 Nenhuma (conta raiz)
                      </SelectItem>
                      {allFlat.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.icone || "📁"} {c.codigo} - {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            {editingConta && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={saving}
                className="h-12 mr-auto"
              >
                🗑️ Excluir
              </Button>
            )}
            <DialogClose
              render={
                <Button variant="outline" className="h-12" />
              }
            >
              Cancelar
            </DialogClose>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-12 px-6"
            >
              {saving ? "Salvando..." : editingConta ? "Salvar" : "Criar Conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
