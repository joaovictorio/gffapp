import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const { tenantId } = await getAuthenticatedTenant();

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes");
  const ano = searchParams.get("ano");
  const tipo = searchParams.get("tipo");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { tenantId };

  // Filter by month/year on dataVencimento
  if (mes && ano) {
    const mesNum = parseInt(mes, 10);
    const anoNum = parseInt(ano, 10);
    const inicio = new Date(anoNum, mesNum - 1, 1);
    const fim = new Date(anoNum, mesNum, 1);
    where.dataVencimento = { gte: inicio, lt: fim };
  } else if (ano) {
    const anoNum = parseInt(ano, 10);
    const inicio = new Date(anoNum, 0, 1);
    const fim = new Date(anoNum + 1, 0, 1);
    where.dataVencimento = { gte: inicio, lt: fim };
  }

  if (tipo && (tipo === "RECEITA" || tipo === "DESPESA")) {
    where.tipo = tipo;
  }

  if (status && (status === "PENDENTE" || status === "PAGO" || status === "ATRASADO")) {
    where.status = status;
  }

  const lancamentos = await prisma.lancamento.findMany({
    where,
    include: {
      conta: {
        select: { id: true, nome: true, icone: true, cor: true, codigo: true },
      },
    },
    orderBy: { dataVencimento: "desc" },
  });

  return NextResponse.json(lancamentos);
}

export async function POST(req: NextRequest) {
  const { tenantId, user } = await getAuthenticatedTenant();

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const {
    descricao,
    valor,
    tipo,
    natureza,
    contaId,
    dataVencimento,
    recorrente,
    diaVencimento,
    observacao,
    eventoId,
  } = body;

  // Validation
  if (!descricao || !valor || !tipo || !natureza || !contaId || !dataVencimento) {
    return NextResponse.json(
      { error: "Campos obrigatorios: descricao, valor, tipo, natureza, contaId, dataVencimento" },
      { status: 400 }
    );
  }

  if (tipo !== "RECEITA" && tipo !== "DESPESA") {
    return NextResponse.json(
      { error: "Tipo deve ser RECEITA ou DESPESA" },
      { status: 400 }
    );
  }

  if (natureza !== "FIXO" && natureza !== "VARIAVEL") {
    return NextResponse.json(
      { error: "Natureza deve ser FIXO ou VARIAVEL" },
      { status: 400 }
    );
  }

  if (typeof valor !== "number" || valor <= 0) {
    return NextResponse.json(
      { error: "Valor deve ser um numero positivo" },
      { status: 400 }
    );
  }

  // Verify the conta belongs to the tenant
  const conta = await prisma.contaContabil.findFirst({
    where: { id: contaId, tenantId },
  });

  if (!conta) {
    return NextResponse.json(
      { error: "Conta contabil nao encontrada" },
      { status: 404 }
    );
  }

  const lancamento = await prisma.lancamento.create({
    data: {
      tenantId,
      contaId,
      descricao,
      valor,
      tipo,
      natureza,
      recorrente: recorrente ?? false,
      diaVencimento: recorrente ? diaVencimento : null,
      dataVencimento: new Date(dataVencimento),
      status: "PENDENTE",
      observacao: observacao || null,
      criadoPorId: user?.id || null,
      eventoId: eventoId || null,
    },
    include: {
      conta: {
        select: { id: true, nome: true, icone: true, cor: true, codigo: true },
      },
    },
  });

  return NextResponse.json(lancamento, { status: 201 });
}
