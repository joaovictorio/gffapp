import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/tenant";

export async function GET() {
  const { tenantId } = await getAuthenticatedTenant();

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const eventos = await prisma.evento.findMany({
    where: { tenantId },
    include: {
      itens: {
        select: {
          id: true,
          valorEstimado: true,
          valorReal: true,
        },
      },
    },
    orderBy: { dataInicio: "desc" },
  });

  const result = eventos.map((evento) => {
    const totalEstimado = evento.itens.reduce(
      (sum, item) => sum + item.valorEstimado,
      0
    );
    const totalReal = evento.itens.reduce(
      (sum, item) => sum + (item.valorReal ?? 0),
      0
    );
    return {
      ...evento,
      _count: { itens: evento.itens.length },
      totalEstimado,
      totalReal,
      itens: undefined,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { tenantId } = await getAuthenticatedTenant();

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const {
    titulo,
    descricao,
    tipo,
    dataInicio,
    dataFim,
    local,
    orcamentoPrevisto,
    icone,
    cor,
  } = body;

  if (!titulo || !tipo || !dataInicio) {
    return NextResponse.json(
      { error: "Titulo, tipo e data de inicio sao obrigatorios" },
      { status: 400 }
    );
  }

  const evento = await prisma.evento.create({
    data: {
      tenantId,
      titulo,
      descricao: descricao || null,
      tipo,
      dataInicio: new Date(dataInicio),
      dataFim: dataFim ? new Date(dataFim) : null,
      local: local || null,
      orcamentoPrevisto: orcamentoPrevisto ? Number(orcamentoPrevisto) : 0,
      icone: icone || null,
      cor: cor || null,
    },
  });

  return NextResponse.json(evento, { status: 201 });
}
