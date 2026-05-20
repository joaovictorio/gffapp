"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface LancamentoRelatorio {
  id: string;
  descricao: string;
  valor: number;
  multa: number | null;
  juros: number | null;
  tipo: "RECEITA" | "DESPESA";
  dataPagamento: string;
  formaPagamento: string | null;
  conta: { codigo: string; nome: string; icone: string | null };
  responsavel: { nome: string; avatar: string | null } | null;
  cartaoCredito: { id: string; nome: string } | null;
}

interface ContaRelatorio {
  conta: {
    id: string;
    nome: string;
    icone: string | null;
    tipo: string;
    banco: string | null;
  };
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  quantidadeLancamentos: number;
  lancamentos: LancamentoRelatorio[];
}

interface SemConta {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  quantidadeLancamentos: number;
  lancamentos: LancamentoRelatorio[];
}

interface Relatorio {
  periodo: { inicio: string; fim: string };
  porConta: ContaRelatorio[];
  semConta: SemConta | null;
  totais: {
    receitas: number;
    despesas: number;
    saldo: number;
    quantidade: number;
  };
}

const FORMA_PGTO_LABEL: Record<string, string> = {
  PIX: "🔑 Pix",
  DEBITO: "💳 Debito",
  CREDITO: "💳 Credito",
  DINHEIRO: "💵 Dinheiro",
  TRANSFERENCIA: "🔄 Transferencia",
  BOLETO: "📄 Boleto",
};

function getDefaultDates() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  return {
    dataInicial: inicio.toISOString().split("T")[0],
    dataFinal: hoje.toISOString().split("T")[0],
  };
}

export default function RelatoriosPage() {
  const padrao = getDefaultDates();
  const [dataInicial, setDataInicial] = useState(padrao.dataInicial);
  const [dataFinal, setDataFinal] = useState(padrao.dataFinal);
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandido, setExpandido] = useState<Record<string, boolean>>({});

  const buscar = useCallback(async () => {
    if (!dataInicial || !dataFinal) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/relatorios/por-conta-bancaria?dataInicial=${dataInicial}&dataFinal=${dataFinal}`
      );
      if (res.ok) {
        const data = await res.json();
        setRelatorio(data);
      }
    } catch (err) {
      console.error("Erro ao buscar relatorio:", err);
    } finally {
      setLoading(false);
    }
  }, [dataInicial, dataFinal]);

  function toggle(key: string) {
    setExpandido((e) => ({ ...e, [key]: !e[key] }));
  }

  function periodoRapido(tipo: "mes" | "ultimos30" | "ano") {
    const hoje = new Date();
    let inicio: Date;
    if (tipo === "mes") {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    } else if (tipo === "ultimos30") {
      inicio = new Date();
      inicio.setDate(hoje.getDate() - 30);
    } else {
      inicio = new Date(hoje.getFullYear(), 0, 1);
    }
    setDataInicial(inicio.toISOString().split("T")[0]);
    setDataFinal(hoje.toISOString().split("T")[0]);
  }

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📊 Relatorios</h1>
        <p className="text-gray-500 mt-1">Pagamentos por conta bancaria</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📅 Periodo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dataInicial">Data Inicial</Label>
              <Input
                id="dataInicial"
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataFinal">Data Final</Label>
              <Input
                id="dataFinal"
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                className="h-12"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => periodoRapido("mes")}
              className="rounded-full"
            >
              Mes corrente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => periodoRapido("ultimos30")}
              className="rounded-full"
            >
              Ultimos 30 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => periodoRapido("ano")}
              className="rounded-full"
            >
              Ano corrente
            </Button>
          </div>

          <Button
            onClick={buscar}
            disabled={loading || !dataInicial || !dataFinal}
            className="w-full h-12"
          >
            {loading ? "Buscando..." : "🔍 Gerar Relatorio"}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado */}
      {relatorio && (
        <>
          {/* Totais Gerais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-600">
                  Total Recebido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(relatorio.totais.receitas)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-600">Total Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-700">
                  {formatCurrency(relatorio.totais.despesas)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-blue-600">
                  Saldo do Periodo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-2xl font-bold ${
                    relatorio.totais.saldo >= 0
                      ? "text-blue-700"
                      : "text-red-700"
                  }`}
                >
                  {formatCurrency(relatorio.totais.saldo)}
                </p>
              </CardContent>
            </Card>
          </div>

          <p className="text-sm text-gray-500 text-center">
            {relatorio.totais.quantidade} lancamento{relatorio.totais.quantidade !== 1 ? "s" : ""}{" "}
            no periodo
          </p>

          {/* Por Conta Bancaria */}
          {relatorio.porConta.filter((c) => c.quantidadeLancamentos > 0).length === 0 &&
          !relatorio.semConta ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-gray-500">
                  Nenhum pagamento encontrado no periodo
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <h2 className="font-bold text-lg text-gray-800">
                💰 Por Conta Bancaria
              </h2>

              {relatorio.porConta
                .filter((c) => c.quantidadeLancamentos > 0)
                .map((item) => (
                  <Card key={item.conta.id}>
                    <CardContent className="p-4">
                      {/* Header da conta */}
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggle(item.conta.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl flex-shrink-0">
                            {item.conta.icone ||
                              (item.conta.tipo === "CARTAO" ? "💳" : "🏦")}
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-semibold truncate">
                              {item.conta.nome}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {item.quantidadeLancamentos} lancamento
                              {item.quantidadeLancamentos !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p
                            className={`font-bold text-base ${
                              item.saldo >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {formatCurrency(item.saldo)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {expandido[item.conta.id] ? "▲ Recolher" : "▼ Detalhes"}
                          </p>
                        </div>
                      </div>

                      {/* Resumo da conta */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
                        <div className="text-center bg-green-50 rounded-lg py-2">
                          <p className="text-xs text-green-600">Entrou</p>
                          <p className="text-sm font-bold text-green-700">
                            {formatCurrency(item.totalReceitas)}
                          </p>
                        </div>
                        <div className="text-center bg-red-50 rounded-lg py-2">
                          <p className="text-xs text-red-600">Saiu</p>
                          <p className="text-sm font-bold text-red-700">
                            {formatCurrency(item.totalDespesas)}
                          </p>
                        </div>
                      </div>

                      {/* Lista expandida de lancamentos */}
                      {expandido[item.conta.id] && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          {item.lancamentos.map((l) => {
                            const valorTotal =
                              l.valor + (l.multa || 0) + (l.juros || 0);
                            return (
                              <div
                                key={l.id}
                                className="flex items-start justify-between p-2 bg-gray-50 rounded-lg gap-2"
                              >
                                <div className="flex items-start gap-2 min-w-0 flex-1">
                                  <span className="text-lg shrink-0">
                                    {l.conta.icone || "📋"}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {l.descricao}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatDate(l.dataPagamento)}
                                      {l.formaPagamento && (
                                        <>
                                          {" · "}
                                          {FORMA_PGTO_LABEL[l.formaPagamento] ||
                                            l.formaPagamento}
                                        </>
                                      )}
                                    </p>
                                    {l.responsavel && (
                                      <p className="text-xs text-gray-400">
                                        {l.responsavel.avatar || "👤"}{" "}
                                        {l.responsavel.nome}
                                      </p>
                                    )}
                                    {l.cartaoCredito && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-purple-50 text-purple-700 mt-1"
                                      >
                                        💳 Fatura {l.cartaoCredito.nome}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <span
                                  className={`text-sm font-bold shrink-0 ${
                                    l.tipo === "RECEITA"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {l.tipo === "RECEITA" ? "+" : "-"}{" "}
                                  {formatCurrency(valorTotal)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

              {/* Sem conta bancaria */}
              {relatorio.semConta && (
                <Card className="border-dashed">
                  <CardContent className="p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggle("sem-conta")}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">❓</span>
                        <div>
                          <h3 className="font-semibold">Sem conta informada</h3>
                          <p className="text-xs text-gray-500">
                            {relatorio.semConta.quantidadeLancamentos}{" "}
                            lancamentos sem conta bancaria vinculada
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            relatorio.semConta.saldo >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(relatorio.semConta.saldo)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {expandido["sem-conta"] ? "▲" : "▼"}
                        </p>
                      </div>
                    </div>

                    {expandido["sem-conta"] && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {relatorio.semConta.lancamentos.map((l) => {
                          const valorTotal =
                            l.valor + (l.multa || 0) + (l.juros || 0);
                          return (
                            <div
                              key={l.id}
                              className="flex items-start justify-between p-2 bg-gray-50 rounded-lg gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">
                                  {l.descricao}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(l.dataPagamento)}
                                </p>
                              </div>
                              <span
                                className={`text-sm font-bold shrink-0 ${
                                  l.tipo === "RECEITA"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {l.tipo === "RECEITA" ? "+" : "-"}{" "}
                                {formatCurrency(valorTotal)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
