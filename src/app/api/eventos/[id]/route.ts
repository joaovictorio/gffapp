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
    include: {
      itens: {
        include: {
          conta: {
            select: { id: true, nome: true, icone: true, codigo: true },
          },
        },
        orderBy: { ordem: "asc" },
      },
    },
  });

  if (!evento) {
    return NextResponse.json(
      { error: "Evento nao encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(evento);
}

export async function PUT(
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
  const {
    titulo,
    descricao,
    tipo,
    dataInicio,
    dataFim,
    local,
    status,
    orcamentoPrevisto,
    icone,
    cor,
  } = body;

  const updated = await prisma.evento.update({
    where: { id },
    data: {
      ...(titulo !== undefined && { titulo }),
      ...(descricao !== undefined && { descricao }),
      ...(tipo !== undefined && { tipo }),
      ...(dataInicio !== undefined && { dataInicio: new Date(dataInicio) }),
      ...(dataFim !== undefined && {
        dataFim: dataFim ? new Date(dataFim) : null,
      }),
      ...(local !== undefined && { local }),
      ...(status !== undefined && { status }),
      ...(orcamentoPrevisto !== undefined && {
        orcamentoPrevisto: Number(orcamentoPrevisto),
      }),
      ...(icone !== undefined && { icone }),
      ...(cor !== undefined && { cor }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
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

  // Cascade delete: items first, then event
  await prisma.eventoItem.deleteMany({ where: { eventoId: id } });
  await prisma.evento.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
