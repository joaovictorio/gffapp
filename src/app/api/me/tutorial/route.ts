import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/tenant";

export async function GET() {
  const { user } = await getAuthenticatedTenant();

  if (!user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { tutorialVisto: true },
  });

  return NextResponse.json({ tutorialVisto: dbUser?.tutorialVisto ?? false });
}

export async function PUT() {
  const { user } = await getAuthenticatedTenant();

  if (!user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { tutorialVisto: true },
  });

  return NextResponse.json({ tutorialVisto: true });
}
