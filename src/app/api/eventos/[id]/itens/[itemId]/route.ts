import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/tenant";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { tenantId } = await getAuthenticatedTenant();

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id, itemId } = await params;

  const item = await prisma.eventoItem.findFirst({
    where: { id: itemId, eventoId: id, tenantId },
  });

  if (!item) {
    return NextResponse.json(
      { error: "Item nao encontrado" },
      { status: 404 }
    );
  }

  const body = await req.json();
  const { descricao, valorEstimado, valorReal, contaId, status, ordem } = body;

  if (contaId) {
    const conta = await prisma.contaContabil.findFirst({
      where: { id: contaId, tenantId },
    });
    if (!conta) {
      return NextResponse.json(
        { error: "Conta nao encontrada" },
        { status: 404 }
      );
    }
  }

  const updated = await prisma.eventoItem.update({
    where: { id: itemId },
    data: {
      ...(descricao !== undefined && { descricao }),
      ...(valorEstimado !== undefined && {
        valorEstimado: Number(valorEstimado),
      }),
      ...(valorReal !== undefined && {
        valorReal: valorReal !== null ? Number(valorReal) : null,
      }),
      ...(contaId !== undefined && { contaId: contaId || null }),
      ...(status !== undefined && { status }),
      ...(ordem !== undefined && { ordem }),
    },
    include: {
      conta: {
        select: { id: true, nome: true, icone: true, codigo: true },
      },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { tenantId } = await getAuthenticatedTenant();

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id, itemId } = await params;

  const item = await prisma.eventoItem.findFirst({
    where: { id: itemId, eventoId: id, tenantId },
  });

  if (!item) {
    return NextResponse.json(
      { error: "Item nao encontrado" },
      { status: 404 }
    );
  }

  await prisma.eventoItem.delete({ where: { id: itemId } });

  return NextResponse.json({ success: true });
}
