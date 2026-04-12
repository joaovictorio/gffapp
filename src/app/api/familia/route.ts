import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/tenant";

export async function GET() {
  const { tenantId } = await getAuthenticatedTenant();
  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      usuarios: {
        select: {
          id: true,
          nome: true,
          email: true,
          avatar: true,
          role: true,
          ativo: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json(tenant);
}

export async function PUT(request: NextRequest) {
  const { tenantId, role } = await getAuthenticatedTenant();
  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  if (role !== "admin") {
    return NextResponse.json(
      { error: "Apenas administradores podem editar" },
      { status: 403 }
    );
  }

  const { nome } = await request.json();

  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: { nome },
  });

  return NextResponse.json(updated);
}
