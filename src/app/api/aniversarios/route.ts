import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/tenant";

export async function GET() {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    if (!tenantId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const aniversarios = await prisma.aniversario.findMany({
      where: { tenantId },
      orderBy: [{ data: "asc" }],
    });

    return NextResponse.json(aniversarios);
  } catch (error) {
    console.error("Erro ao buscar aniversarios:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    if (!tenantId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nome, data, anoConhecido, parentesco, telefone, observacao, icone } =
      body;

    if (!nome || !data) {
      return NextResponse.json(
        { error: "Nome e data sao obrigatorios" },
        { status: 400 }
      );
    }

    const aniversario = await prisma.aniversario.create({
      data: {
        tenantId,
        nome,
        data: new Date(data),
        anoConhecido: anoConhecido ?? true,
        parentesco: parentesco || null,
        telefone: telefone || null,
        observacao: observacao || null,
        icone: icone || null,
      },
    });

    return NextResponse.json(aniversario, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar aniversario:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
