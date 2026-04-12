import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/tenant";

export async function GET() {
  const { tenantId } = await getAuthenticatedTenant();

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const contas = await prisma.contaContabil.findMany({
    where: { tenantId, parentId: null },
    include: {
      filhos: {
        include: {
          filhos: {
            include: {
              filhos: true,
            },
            orderBy: { ordem: "asc" },
          },
        },
        orderBy: { ordem: "asc" },
      },
    },
    orderBy: { ordem: "asc" },
  });

  return NextResponse.json(contas);
}

export async function POST(req: NextRequest) {
  const { tenantId } = await getAuthenticatedTenant();

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { codigo, nome, tipo, parentId, icone, cor, ordem } = body;

  if (!codigo || !nome || !tipo) {
    return NextResponse.json(
      { error: "Codigo, nome e tipo sao obrigatorios" },
      { status: 400 }
    );
  }

  if (parentId) {
    const parent = await prisma.contaContabil.findFirst({
      where: { id: parentId, tenantId },
    });
    if (!parent) {
      return NextResponse.json(
        { error: "Conta pai nao encontrada" },
        { status: 404 }
      );
    }
  }

  const existing = await prisma.contaContabil.findFirst({
    where: { tenantId, codigo },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Ja existe uma conta com esse codigo" },
      { status: 409 }
    );
  }

  const conta = await prisma.contaContabil.create({
    data: {
      tenantId,
      codigo,
      nome,
      tipo,
      parentId: parentId || null,
      icone: icone || null,
      cor: cor || null,
      ordem: ordem ?? 0,
    },
  });

  return NextResponse.json(conta, { status: 201 });
}
