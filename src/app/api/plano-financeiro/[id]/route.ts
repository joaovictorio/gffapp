import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/tenant";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { tenantId } = await getAuthenticatedTenant();

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const existing = await prisma.planoFinanceiro.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Plano financeiro nao encontrado" },
      { status: 404 }
    );
  }

  const body = await req.json();
  const { valorPlanejado, observacao } = body;

  const updateData: Record<string, unknown> = {};

  if (valorPlanejado !== undefined) updateData.valorPlanejado = valorPlanejado;
  if (observacao !== undefined) updateData.observacao = observacao;

  const plano = await prisma.planoFinanceiro.update({
    where: { id },
    data: updateData,
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

  return NextResponse.json(plano);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { tenantId } = await getAuthenticatedTenant();

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const existing = await prisma.planoFinanceiro.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Plano financeiro nao encontrado" },
      { status: 404 }
    );
  }

  await prisma.planoFinanceiro.delete({ where: { id } });

  return NextResponse.json({ message: "Plano financeiro excluido com sucesso" });
}
