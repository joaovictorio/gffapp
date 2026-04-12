import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/tenant";

export async function GET() {
  const { tenantId } = await getAuthenticatedTenant();

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const membros = await prisma.user.findMany({
    where: { tenantId, ativo: true },
    select: { id: true, nome: true, avatar: true, role: true },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(membros);
}
