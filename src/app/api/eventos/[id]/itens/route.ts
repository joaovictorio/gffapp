import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/tenant";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { tenantId } = await getAuthenticatedTenant();

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const evento = await prisma.evento.findFirst({
    where: { id, tenantId },
  });

  if (!evento) {
    return NextResponse.json(
      { error: "Evento nao encontrado" },
      { status: 404 }
    );
  }

  const itens = await prisma.eventoItem.findMany({
    where: { eventoId: id, tenantId },
    include: {
      conta: {
        select: { id: true, nome: true, icone: true, codigo: true },
      },
    },
    orderBy: { ordem: "asc" },
  });

  return NextResponse.json(itens);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { tenantId } = await getAuthenticatedTenant();

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const evento = await prisma.evento.findFirst({
    where: { id, tenantId },
  });

  if (!evento) {
    return NextResponse.json(
      { error: "Evento nao encontrado" },
      { status: 404 }
    );
  }

  const body = await req.json();
  const { descricao, valorEstimado, valorReal, contaId, status, ordem } = body;

  if (!descricao) {
    return NextResponse.json(
      { error: "Descricao e obrigatoria" },
      { status: 400 }
    );
  }

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

  const item = await prisma.eventoItem.create({
    data: {
      tenantId,
      eventoId: id,
      descricao,
      valorEstimado: valorEstimado ? Number(valorEstimado) : 0,
      valorReal: valorReal ? Number(valorReal) : null,
      contaId: contaId || null,
      status: status || "PENDENTE",
      ordem: ordem ?? 0,
    },
    include: {
      conta: {
        select: { id: true, nome: true, icone: true, codigo: true },
      },
    },
  });

  return NextResponse.json(item, { status: 201 });
}
