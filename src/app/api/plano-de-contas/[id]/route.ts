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

  const conta = await prisma.contaContabil.findFirst({
    where: { id, tenantId },
  });

  if (!conta) {
    return NextResponse.json(
      { error: "Conta nao encontrada" },
      { status: 404 }
    );
  }

  const body = await req.json();
  const { nome, icone, cor, ordem, ativo } = body;

  const updated = await prisma.contaContabil.update({
    where: { id },
    data: {
      ...(nome !== undefined && { nome }),
      ...(icone !== undefined && { icone }),
      ...(cor !== undefined && { cor }),
      ...(ordem !== undefined && { ordem }),
      ...(ativo !== undefined && { ativo }),
    },
  });

  return NextResponse.json(updated);
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

  const conta = await prisma.contaContabil.findFirst({
    where: { id, tenantId },
    include: {
      filhos: { select: { id: true } },
      lancamentos: { select: { id: true }, take: 1 },
    },
  });

  if (!conta) {
    return NextResponse.json(
      { error: "Conta nao encontrada" },
      { status: 404 }
    );
  }

  if (conta.filhos.length > 0) {
    return NextResponse.json(
      { error: "Nao e possivel excluir uma conta que possui subcontas" },
      { status: 400 }
    );
  }

  if (conta.lancamentos.length > 0) {
    return NextResponse.json(
      { error: "Nao e possivel excluir uma conta que possui lancamentos" },
      { status: 400 }
    );
  }

  await prisma.contaContabil.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
