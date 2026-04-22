import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/tenant";

export async function GET() {
  const { tenantId } = await getAuthenticatedTenant();

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const contas = await prisma.contaBancaria.findMany({
    where: { tenantId, ativo: true },
    orderBy: { nome: "asc" },
    include: {
      lancamentos: {
        where: { status: "PAGO" },
        select: { valor: true, tipo: true, multa: true, juros: true },
      },
    },
  });

  const result = contas.map((conta) => {
    const somaReceitas = conta.lancamentos
      .filter((l) => l.tipo === "RECEITA")
      .reduce((sum, l) => sum + l.valor + (l.multa || 0) + (l.juros || 0), 0);

    const somaDespesas = conta.lancamentos
      .filter((l) => l.tipo === "DESPESA")
      .reduce((sum, l) => sum + l.valor + (l.multa || 0) + (l.juros || 0), 0);

    const saldoAtual = conta.saldoInicial + somaReceitas - somaDespesas;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { lancamentos, ...contaSemLancamentos } = conta;

    return {
      ...contaSemLancamentos,
      saldoAtual,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { tenantId } = await getAuthenticatedTenant();

  if (!tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { nome, tipo, banco, agencia, numeroConta, saldoInicial, icone, cor } =
    body;

  if (!nome || !tipo) {
    return NextResponse.json(
      { error: "Campos obrigatorios: nome, tipo" },
      { status: 400 }
    );
  }

  const tiposValidos = ["CORRENTE", "POUPANCA", "CARTEIRA", "OUTRO"];
  if (!tiposValidos.includes(tipo)) {
    return NextResponse.json(
      { error: "Tipo deve ser CORRENTE, POUPANCA, CARTEIRA ou OUTRO" },
      { status: 400 }
    );
  }

  const conta = await prisma.contaBancaria.create({
    data: {
      tenantId,
      nome,
      tipo,
      banco: banco || null,
      agencia: agencia || null,
      numeroConta: numeroConta || null,
      saldoInicial: saldoInicial ?? 0,
      icone: icone || null,
      cor: cor || null,
    },
  });

  return NextResponse.json({ ...conta, saldoAtual: conta.saldoInicial }, { status: 201 });
}
