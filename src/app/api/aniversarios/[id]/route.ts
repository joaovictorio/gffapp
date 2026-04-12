import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/tenant";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    if (!tenantId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.aniversario.findUnique({
      where: { id },
    });

    if (!existing || existing.tenantId !== tenantId) {
      return NextResponse.json(
        { error: "Aniversario nao encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { nome, data, anoConhecido, parentesco, telefone, observacao, icone } =
      body;

    const aniversario = await prisma.aniversario.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(data !== undefined && { data: new Date(data) }),
        ...(anoConhecido !== undefined && { anoConhecido }),
        ...(parentesco !== undefined && { parentesco: parentesco || null }),
        ...(telefone !== undefined && { telefone: telefone || null }),
        ...(observacao !== undefined && { observacao: observacao || null }),
        ...(icone !== undefined && { icone: icone || null }),
      },
    });

    return NextResponse.json(aniversario);
  } catch (error) {
    console.error("Erro ao atualizar aniversario:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await getAuthenticatedTenant();

    if (!tenantId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.aniversario.findUnique({
      where: { id },
    });

    if (!existing || existing.tenantId !== tenantId) {
      return NextResponse.json(
        { error: "Aniversario nao encontrado" },
        { status: 404 }
      );
    }

    await prisma.aniversario.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Aniversario removido" });
  } catch (error) {
    console.error("Erro ao remover aniversario:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
