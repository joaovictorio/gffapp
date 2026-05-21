"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateShort } from "@/lib/utils";

interface DashboardData {
  resumoMes: {
    totalReceitas: number;
    totalDespesas: number;
    saldo: number;
    provisoesDespesa: number;
    provisoesReceita: number;
  };
  despesasPorCategoria: Array<{
    conta: string;
    icone: string;
    cor: string;
    total: number;
  }>;
  pagamentosPorForma: Array<{
    forma: string;
    icone: string;
    total: number;
  }>;
  avisosAniversarios: Array<{
    nome: string;
    data: string;
    icone: string;
    parentesco: string | null;
    diasRestantes: number;
  }>;
  avisosEventos: Array<{
    id: string;
    titulo: string;
    tipo: string;
    icone: string | null;
    dataInicio: string;
    local: string | null;
    diasRestantes: number;
  }>;
  proximosAniversarios: Array<{
    nome: string;
    data: string;
    icone: string;
    parentesco: string;
    diasRestantes: number;
  }>;
  proximosEventos: Array<{
    id: string;
    titulo: string;
    tipo: string;
    icone: string;
    dataInicio: string;
    orcamentoPrevisto: number;
    totalEstimado: number;
    totalReal: number;
  }>;
  pendentes: number;
  atrasados: number;
}

export default function PainelPage() {
  const { data: session } = useSession();
  const [dados, setDados] = useState<DashboardData | null>(null);

  const fetchDados = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    if (res.ok) {
      setDados(await res.json());
    }
  }, []);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Ola, {session?.user?.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Veja como esta sua familia</p>
      </div>

      {/* Avisos de aniversarios e eventos - hoje e amanha */}
      {dados &&
        (dados.avisosAniversarios?.length > 0 || dados.avisosEventos?.length > 0) && (
          <div className="space-y-2">
            {/* Aniversarios hoje */}
            {dados.avisosAniversarios
              ?.filter((a) => a.diasRestantes === 0)
              .map((a, i) => (
                <Link key={`a-hoje-${i}`} href="/aniversarios">
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="text-4xl animate-bounce">🎉</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-purple-900">
                        Hoje e aniversario!
                      </p>
                      <p className="text-sm text-purple-800 truncate">
                        {a.icone} <strong>{a.nome}</strong>
                        {a.parentesco && ` - ${a.parentesco}`}
                      </p>
                    </div>
                    <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full font-bold">
                      HOJE
                    </span>
                  </div>
                </Link>
              ))}

            {/* Aniversarios amanha */}
            {dados.avisosAniversarios
              ?.filter((a) => a.diasRestantes === 1)
              .map((a, i) => (
                <Link key={`a-amanha-${i}`} href="/aniversarios">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center gap-3 hover:bg-purple-100 transition-colors cursor-pointer">
                    <div className="text-2xl">🎂</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-purple-900 text-sm">
                        Amanha eh aniversario de {a.nome}!
                      </p>
                      {a.parentesco && (
                        <p className="text-xs text-purple-700">{a.parentesco}</p>
                      )}
                    </div>
                    <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full font-medium">
                      Amanha
                    </span>
                  </div>
                </Link>
              ))}

            {/* Eventos hoje */}
            {dados.avisosEventos
              ?.filter((e) => e.diasRestantes === 0)
              .map((e) => (
                <Link key={`e-hoje-${e.id}`} href={`/eventos/${e.id}`}>
                  <div className="bg-gradient-to-r from-blue-100 to-cyan-100 border-2 border-blue-300 rounded-xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="text-4xl animate-pulse">📅</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-blue-900">Evento hoje!</p>
                      <p className="text-sm text-blue-800 truncate">
                        {e.icone || "📌"} <strong>{e.titulo}</strong>
                      </p>
                      {e.local && (
                        <p className="text-xs text-blue-700">📍 {e.local}</p>
                      )}
                    </div>
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-bold">
                      HOJE
                    </span>
                  </div>
                </Link>
              ))}

            {/* Eventos amanha */}
            {dados.avisosEventos
              ?.filter((e) => e.diasRestantes === 1)
              .map((e) => (
                <Link key={`e-amanha-${e.id}`} href={`/eventos/${e.id}`}>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3 hover:bg-blue-100 transition-colors cursor-pointer">
                    <div className="text-2xl">📅</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-blue-900 text-sm">
                        Amanha tem evento: {e.titulo}
                      </p>
                      {e.local && (
                        <p className="text-xs text-blue-700">📍 {e.local}</p>
                      )}
                    </div>
                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-medium">
                      Amanha
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-600 font-medium">
              💰 Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(dados?.resumoMes.totalReceitas ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600 font-medium">
              💸 Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">
              {formatCurrency(dados?.resumoMes.totalDespesas ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-600 font-medium">
              🏦 Sobrou
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">
              {formatCurrency(dados?.resumoMes.saldo ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Provisoes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-600 font-medium">
              📋 Contas a Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-700">
              {formatCurrency(dados?.resumoMes.provisoesDespesa ?? 0)}
            </p>
            <p className="text-xs text-orange-500 mt-1">Pendentes e atrasadas</p>
          </CardContent>
        </Card>

        <Card className="bg-cyan-50 border-cyan-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-cyan-600 font-medium">
              📋 A Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-cyan-700">
              {formatCurrency(dados?.resumoMes.provisoesReceita ?? 0)}
            </p>
            <p className="text-xs text-cyan-500 mt-1">Pendentes e atrasadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {dados && (dados.pendentes > 0 || dados.atrasados > 0) && (
        <div className="flex gap-3 flex-wrap">
          {dados.atrasados > 0 && (
            <Link href="/financeiro">
              <Badge variant="destructive" className="text-sm py-1.5 px-3 cursor-pointer">
                ⚠️ {dados.atrasados} conta{dados.atrasados > 1 ? "s" : ""} atrasada{dados.atrasados > 1 ? "s" : ""}
              </Badge>
            </Link>
          )}
          {dados.pendentes > 0 && (
            <Link href="/financeiro">
              <Badge variant="secondary" className="text-sm py-1.5 px-3 cursor-pointer">
                🕐 {dados.pendentes} conta{dados.pendentes > 1 ? "s" : ""} pendente{dados.pendentes > 1 ? "s" : ""}
              </Badge>
            </Link>
          )}
        </div>
      )}

      {/* Expenses by Category */}
      {dados && dados.despesasPorCategoria.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📊 Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dados.despesasPorCategoria
              .sort((a, b) => b.total - a.total)
              .map((cat, i) => {
                const maxTotal = dados.despesasPorCategoria[0]?.total || 1;
                const percent = (cat.total / maxTotal) * 100;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {cat.icone} {cat.conta}
                      </span>
                      <span className="font-medium">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: cat.cor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}

      {/* Payments by Method */}
      {dados && dados.pagamentosPorForma && dados.pagamentosPorForma.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">💳 Pagamentos por Forma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {dados.pagamentosPorForma
                .sort((a, b) => b.total - a.total)
                .map((fp, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl"
                  >
                    <span className="text-xl">{fp.icone}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 truncate">{fp.forma}</p>
                      <p className="text-sm font-bold text-gray-800">
                        {formatCurrency(fp.total)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming Birthdays */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🎂 Proximos Aniversarios</CardTitle>
          </CardHeader>
          <CardContent>
            {!dados || dados.proximosAniversarios.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum aniversario nos proximos 30 dias</p>
            ) : (
              <div className="space-y-3">
                {dados.proximosAniversarios.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 bg-purple-50 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{a.icone}</span>
                      <div>
                        <p className="font-medium text-sm">{a.nome}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateShort(a.data)}
                          {a.parentesco && ` - ${a.parentesco}`}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        a.diasRestantes <= 7
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                      }
                    >
                      {a.diasRestantes === 0
                        ? "Hoje!"
                        : a.diasRestantes === 1
                          ? "Amanha!"
                          : `${a.diasRestantes} dias`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📅 Proximos Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            {!dados || dados.proximosEventos.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum evento programado</p>
            ) : (
              <div className="space-y-3">
                {dados.proximosEventos.map((e) => (
                  <Link key={e.id} href={`/eventos/${e.id}`}>
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{e.icone || "📅"}</span>
                        <div>
                          <p className="font-medium text-sm">{e.titulo}</p>
                          <p className="text-xs text-gray-500">
                            {formatDateShort(e.dataInicio)}
                          </p>
                        </div>
                      </div>
                      {e.orcamentoPrevisto > 0 && (
                        <span className="text-xs font-medium text-blue-600">
                          {formatCurrency(e.orcamentoPrevisto)}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
