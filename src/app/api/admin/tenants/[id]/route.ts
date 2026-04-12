import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/tenant";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await getAuthenticatedTenant();
  if (!user || user.role !== "superadmin") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;

  // Only metadata - names/emails of members but NO financial data
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      codigo: true,
      ativo: true,
      createdAt: true,
      updatedAt: true,
      usuarios: {
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          ativo: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: {
          lancamentos: true,
          eventos: true,
          aniversarios: true,
          contasBancarias: true,
          planoContas: true,
          planosFinanceiros: true,
        },
      },
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Familia nao encontrada" }, { status: 404 });
  }

  return NextResponse.json(tenant);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await getAuthenticatedTenant();
  if (!user || user.role !== "superadmin") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  const { ativo } = await request.json();

  const updated = await prisma.tenant.update({
    where: { id },
    data: { ativo },
    select: { id: true, nome: true, ativo: true },
  });

  return NextResponse.json(updated);
}
