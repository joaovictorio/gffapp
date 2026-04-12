import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/tenant";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { tenantId } = await getAuthenticatedTenant();

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.contaBancaria.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Conta bancaria nao encontrada" },
      { status: 404 }
    );
  }

  const body = await req.json();
  const { nome, tipo, banco, agencia, numeroConta, saldoInicial, icone, cor } =
    body;

  const updateData: Record<string, unknown> = {};

  if (nome !== undefined) updateData.nome = nome;
  if (tipo !== undefined) {
    const tiposValidos = ["CORRENTE", "POUPANCA", "CARTEIRA", "OUTRO"];
    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo deve ser CORRENTE, POUPANCA, CARTEIRA ou OUTRO" },
        { status: 400 }
      );
    }
    updateData.tipo = tipo;
  }
  if (banco !== undefined) updateData.banco = banco || null;
  if (agencia !== undefined) updateData.agencia = agencia || null;
  if (numeroConta !== undefined) updateData.numeroConta = numeroConta || null;
  if (saldoInicial !== undefined) updateData.saldoInicial = saldoInicial;
  if (icone !== undefined) updateData.icone = icone || null;
  if (cor !== undefined) updateData.cor = cor || null;

  const conta = await prisma.contaBancaria.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(conta);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { tenantId } = await getAuthenticatedTenant();

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.contaBancaria.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Conta bancaria nao encontrada" },
      { status: 404 }
    );
  }

  // Check if there are linked lancamentos
  const lancamentosCount = await prisma.lancamento.count({
    where: { contaBancariaId: id },
  });

  if (lancamentosCount > 0) {
    return NextResponse.json(
      {
        error: `Nao e possivel excluir: existem ${lancamentosCount} lancamento(s) vinculado(s) a esta conta`,
      },
      { status: 400 }
    );
  }

  await prisma.contaBancaria.delete({ where: { id } });

  return NextResponse.json({ message: "Conta bancaria excluida com sucesso" });
}
