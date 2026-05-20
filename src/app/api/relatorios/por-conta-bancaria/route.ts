import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { tenantId } = await getAuthenticatedTenant();

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dataInicial = searchParams.get("dataInicial");
  const dataFinal = searchParams.get("dataFinal");

  if (!dataInicial || !dataFinal) {
    return NextResponse.json(
      { error: "Informe dataInicial e dataFinal" },
      { status: 400 }
    );
  }

  const inicio = new Date(dataInicial + "T00:00:00");
  const fim = new Date(dataFinal + "T23:59:59");

  // Busca todas as contas bancarias ativas
  const contas = await prisma.contaBancaria.findMany({
    where: { tenantId, ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, icone: true, tipo: true, banco: true },
  });

  // Busca lancamentos PAGOS no periodo
  const lancamentos = await prisma.lancamento.findMany({
    where: {
      tenantId,
      status: "PAGO",
      dataPagamento: { gte: inicio, lte: fim },
    },
    include: {
      conta: { select: { codigo: true, nome: true, icone: true } },
      responsavel: { select: { nome: true, avatar: true } },
      contaBancaria: { select: { id: true, nome: true, icone: true, tipo: true } },
      cartaoCredito: { select: { id: true, nome: true } },
    },
    orderBy: { dataPagamento: "desc" },
  });

  // Agrupa por conta bancaria
  const porConta = contas.map((conta) => {
    const itens = lancamentos.filter((l) => l.contaBancariaId === conta.id);
    const receitas = itens.filter((l) => l.tipo === "RECEITA");
    const despesas = itens.filter((l) => l.tipo === "DESPESA");

    const totalReceitas = receitas.reduce(
      (sum, l) => sum + l.valor + (l.multa || 0) + (l.juros || 0),
      0
    );
    const totalDespesas = despesas.reduce(
      (sum, l) => sum + l.valor + (l.multa || 0) + (l.juros || 0),
      0
    );

    return {
      conta,
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      quantidadeLancamentos: itens.length,
      lancamentos: itens.map((l) => ({
        id: l.id,
        descricao: l.descricao,
        valor: l.valor,
        multa: l.multa,
        juros: l.juros,
        tipo: l.tipo,
        dataPagamento: l.dataPagamento,
        formaPagamento: l.formaPagamento,
        conta: l.conta,
        responsavel: l.responsavel,
        cartaoCredito: l.cartaoCredito,
      })),
    };
  });

  // Lancamentos sem conta bancaria associada
  const semConta = lancamentos.filter((l) => !l.contaBancariaId);
  const semContaReceitas = semConta
    .filter((l) => l.tipo === "RECEITA")
    .reduce((sum, l) => sum + l.valor + (l.multa || 0) + (l.juros || 0), 0);
  const semContaDespesas = semConta
    .filter((l) => l.tipo === "DESPESA")
    .reduce((sum, l) => sum + l.valor + (l.multa || 0) + (l.juros || 0), 0);

  // Totais gerais
  const totalGeralReceitas = lancamentos
    .filter((l) => l.tipo === "RECEITA")
    .reduce((sum, l) => sum + l.valor + (l.multa || 0) + (l.juros || 0), 0);
  const totalGeralDespesas = lancamentos
    .filter((l) => l.tipo === "DESPESA")
    .reduce((sum, l) => sum + l.valor + (l.multa || 0) + (l.juros || 0), 0);

  return NextResponse.json({
    periodo: { inicio, fim },
    porConta,
    semConta: semConta.length > 0
      ? {
          totalReceitas: semContaReceitas,
          totalDespesas: semContaDespesas,
          saldo: semContaReceitas - semContaDespesas,
          quantidadeLancamentos: semConta.length,
          lancamentos: semConta.map((l) => ({
            id: l.id,
            descricao: l.descricao,
            valor: l.valor,
            multa: l.multa,
            juros: l.juros,
            tipo: l.tipo,
            dataPagamento: l.dataPagamento,
            formaPagamento: l.formaPagamento,
            conta: l.conta,
            responsavel: l.responsavel,
            cartaoCredito: l.cartaoCredito,
          })),
        }
      : null,
    totais: {
      receitas: totalGeralReceitas,
      despesas: totalGeralDespesas,
      saldo: totalGeralReceitas - totalGeralDespesas,
      quantidade: lancamentos.length,
    },
  });
}
