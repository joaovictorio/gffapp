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

  if (!mes || !ano) {
    return NextResponse.json(
      { error: "Parametros mes e ano sao obrigatorios" },
      { status: 400 }
    );
  }

  const mesNum = parseInt(mes, 10);
  const anoNum = parseInt(ano, 10);

  const planos = await prisma.planoFinanceiro.findMany({
    where: {
      tenantId,
      mes: mesNum,
      ano: anoNum,
    },
    include: {
      conta: {
        select: {
          id: true,
          nome: true,
          icone: true,
          cor: true,
          codigo: true,
          tipo: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(planos);
}

export async function POST(req: NextRequest) {
  const { tenantId } = await getAuthenticatedTenant();

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { contaId, mes, ano, valorPlanejado, observacao } = body;

  if (!contaId || !mes || !ano || valorPlanejado === undefined) {
    return NextResponse.json(
      { error: "Campos obrigatorios: contaId, mes, ano, valorPlanejado" },
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

  const plano = await prisma.planoFinanceiro.upsert({
    where: {
      tenantId_contaId_mes_ano: {
        tenantId,
        contaId,
        mes,
        ano,
      },
    },
    update: {
      valorPlanejado,
      observacao: observacao ?? null,
    },
    create: {
      tenantId,
      contaId,
      mes,
      ano,
      valorPlanejado,
      observacao: observacao ?? null,
    },
    include: {
      conta: {
        select: {
          id: true,
          nome: true,
          icone: true,
          cor: true,
          codigo: true,
          tipo: true,
        },
      },
    },
  });

  return NextResponse.json(plano, { status: 201 });
}
