import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/tenant";

export async function GET() {
  const { tenantId } = await getAuthenticatedTenant();
  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Financial summary for current month
  const lancamentos = await prisma.lancamento.findMany({
    where: {
      tenantId,
      dataVencimento: { gte: inicioMes, lte: fimMes },
    },
    include: {
      conta: { select: { nome: true, icone: true, cor: true, codigo: true } },
    },
  });

  const totalReceitas = lancamentos
    .filter((l) => l.tipo === "RECEITA" && l.status === "PAGO")
    .reduce((sum, l) => sum + l.valor + (l.multa || 0) + (l.juros || 0), 0);

  // Excluir despesas pagas com cartao de credito - estas serao computadas
  // quando a fatura do cartao for paga
  const totalDespesas = lancamentos
    .filter((l) => l.tipo === "DESPESA" && l.status === "PAGO" && l.formaPagamento !== "CREDITO")
    .reduce((sum, l) => sum + l.valor + (l.multa || 0) + (l.juros || 0), 0);

  const provisoes = lancamentos
    .filter((l) => l.status !== "PAGO")
    .reduce((sum, l) => sum + l.valor, 0);

  const provisoesDespesa = lancamentos
    .filter((l) => l.tipo === "DESPESA" && l.status !== "PAGO")
    .reduce((sum, l) => sum + l.valor, 0);

  const provisoesReceita = lancamentos
    .filter((l) => l.tipo === "RECEITA" && l.status !== "PAGO")
    .reduce((sum, l) => sum + l.valor, 0);

  const pendentes = lancamentos.filter((l) => l.status === "PENDENTE").length;
  const atrasados = lancamentos.filter((l) => l.status === "ATRASADO").length;

  // Get root categories (parentId is null) to use their names for grouping
  const categoriasRaiz = await prisma.contaContabil.findMany({
    where: { tenantId, parentId: null, tipo: "DESPESA" },
    select: { codigo: true, nome: true, icone: true, cor: true },
  });
  const raizMap = new Map(categoriasRaiz.map((c) => [c.codigo, c]));

  // Expenses by root category - using parent name, not sub-category name
  const despesasPorCategoria = lancamentos
    .filter((l) => l.tipo === "DESPESA" && l.status === "PAGO")
    .reduce(
      (acc, l) => {
        const key = l.conta.codigo.split(".")[0];
        if (!acc[key]) {
          const raiz = raizMap.get(key);
          acc[key] = {
            conta: raiz?.nome || l.conta.nome,
            icone: raiz?.icone || l.conta.icone || "📌",
            cor: raiz?.cor || l.conta.cor || "#6B7280",
            total: 0,
          };
        }
        acc[key].total += l.valor + (l.multa || 0) + (l.juros || 0);
        return acc;
      },
      {} as Record<string, { conta: string; icone: string; cor: string; total: number }>
    );

  // Payments by payment method (paid expenses only)
  const FORMA_PAGAMENTO_LABELS: Record<string, { label: string; icone: string }> = {
    PIX: { label: "Pix", icone: "🔑" },
    DEBITO: { label: "Debito", icone: "💳" },
    CREDITO: { label: "Credito", icone: "💳" },
    DINHEIRO: { label: "Dinheiro", icone: "💵" },
    TRANSFERENCIA: { label: "Transferencia", icone: "🔄" },
    BOLETO: { label: "Boleto", icone: "📄" },
  };

  const pagamentosPorForma = lancamentos
    .filter((l) => l.tipo === "DESPESA" && l.status === "PAGO" && l.formaPagamento)
    .reduce(
      (acc, l) => {
        const key = l.formaPagamento as string;
        if (!acc[key]) {
          const meta = FORMA_PAGAMENTO_LABELS[key] || { label: key, icone: "💰" };
          acc[key] = { forma: meta.label, icone: meta.icone, total: 0 };
        }
        acc[key].total += l.valor + (l.multa || 0) + (l.juros || 0);
        return acc;
      },
      {} as Record<string, { forma: string; icone: string; total: number }>
    );

  // Upcoming birthdays (next 30 days)
  const aniversarios = await prisma.aniversario.findMany({
    where: { tenantId },
  });

  const proximosAniversarios = aniversarios
    .map((a) => {
      const hoje = new Date();
      const aniv = new Date(a.data);
      const proximo = new Date(hoje.getFullYear(), aniv.getMonth(), aniv.getDate());
      if (proximo < hoje) proximo.setFullYear(proximo.getFullYear() + 1);
      const dias = Math.ceil(
        (proximo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        nome: a.nome,
        data: a.data,
        icone: a.icone || "🎂",
        parentesco: a.parentesco,
        diasRestantes: dias,
      };
    })
    .filter((a) => a.diasRestantes <= 30)
    .sort((a, b) => a.diasRestantes - b.diasRestantes)
    .slice(0, 5);

  // Upcoming events
  const proximosEventos = await prisma.evento.findMany({
    where: {
      tenantId,
      dataInicio: { gte: now },
      status: { in: ["PLANEJANDO", "CONFIRMADO"] },
    },
    orderBy: { dataInicio: "asc" },
    take: 5,
    include: {
      itens: { select: { valorEstimado: true, valorReal: true } },
    },
  });

  return NextResponse.json({
    resumoMes: {
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      provisoes,
      provisoesDespesa,
      provisoesReceita,
    },
    despesasPorCategoria: Object.values(despesasPorCategoria),
    pagamentosPorForma: Object.values(pagamentosPorForma),
    proximosAniversarios,
    proximosEventos: proximosEventos.map((e) => ({
      id: e.id,
      titulo: e.titulo,
      tipo: e.tipo,
      icone: e.icone,
      dataInicio: e.dataInicio,
      orcamentoPrevisto: e.orcamentoPrevisto,
      totalEstimado: e.itens.reduce((s, i) => s + i.valorEstimado, 0),
      totalReal: e.itens.reduce((s, i) => s + (i.valorReal || 0), 0),
    })),
    pendentes,
    atrasados,
  });
}
