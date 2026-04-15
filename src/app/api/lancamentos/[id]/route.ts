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

  // Verify ownership
  const existing = await prisma.lancamento.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Lancamento nao encontrado" },
      { status: 404 }
    );
  }

  const body = await req.json();
  const {
    descricao,
    valor,
    tipo,
    natureza,
    contaId,
    dataVencimento,
    recorrente,
    diaVencimento,
    observacao,
    status,
    responsavelId,
    formaPagamento,
    contaBancariaId,
    codigoBarras,
    multa,
    juros,
    dataPagamento,
  } = body;

  // Build update data with only provided fields
  const updateData: Record<string, unknown> = {};

  if (descricao !== undefined) updateData.descricao = descricao;
  if (valor !== undefined) updateData.valor = valor;
  if (tipo !== undefined) updateData.tipo = tipo;
  if (natureza !== undefined) updateData.natureza = natureza;
  if (contaId !== undefined) {
    // Verify the conta belongs to the tenant
    const conta = await prisma.contaContabil.findFirst({
      where: { id: contaId, tenantId },
    });
    if (!conta) {
      return NextResponse.json(
        { error: "Conta contabil nao encontrada" },
        { status: 404 }
      );
    }
    updateData.contaId = contaId;
  }
  if (dataVencimento !== undefined) updateData.dataVencimento = new Date(dataVencimento);
  if (recorrente !== undefined) updateData.recorrente = recorrente;
  if (diaVencimento !== undefined) updateData.diaVencimento = diaVencimento;
  if (observacao !== undefined) updateData.observacao = observacao;
  if (responsavelId !== undefined) updateData.responsavelId = responsavelId || null;
  if (formaPagamento !== undefined) updateData.formaPagamento = formaPagamento || null;
  if (contaBancariaId !== undefined) updateData.contaBancariaId = contaBancariaId || null;
  if (codigoBarras !== undefined) updateData.codigoBarras = codigoBarras || null;
  if (multa !== undefined) updateData.multa = multa;
  if (juros !== undefined) updateData.juros = juros;

  // Handle status change - when marking as PAGO, set dataPagamento
  if (status !== undefined) {
    updateData.status = status;
    if (status === "PAGO") {
      updateData.dataPagamento = dataPagamento
        ? new Date(dataPagamento + "T12:00:00")
        : new Date();
    } else {
      updateData.dataPagamento = null;
    }
  }

  const lancamento = await prisma.lancamento.update({
    where: { id },
    data: updateData,
    include: {
      conta: {
        select: { id: true, nome: true, icone: true, cor: true, codigo: true },
      },
      responsavel: {
        select: { id: true, nome: true, avatar: true },
      },
      contaBancaria: {
        select: { id: true, nome: true, icone: true },
      },
    },
  });

  return NextResponse.json(lancamento);
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

  // Verify ownership
  const existing = await prisma.lancamento.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Lancamento nao encontrado" },
      { status: 404 }
    );
  }

  await prisma.lancamento.delete({ where: { id } });

  return NextResponse.json({ message: "Lancamento excluido com sucesso" });
}
