import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/tenant";

export async function GET() {
  const { user } = await getAuthenticatedTenant();
  if (!user || user.role !== "superadmin") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  // Only metadata - NO financial data, no personal details
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nome: true,
      codigo: true,
      ativo: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          usuarios: true,
          lancamentos: true,
          eventos: true,
          aniversarios: true,
          contasBancarias: true,
        },
      },
    },
  });

  return NextResponse.json(tenants);
}
