import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const codigo = request.nextUrl.searchParams.get("codigo");

  if (!codigo) {
    return NextResponse.json({ error: "Codigo obrigatorio" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { codigo },
    select: { id: true, nome: true, ativo: true },
  });

  if (!tenant || !tenant.ativo) {
    return NextResponse.json(
      { error: "Codigo de convite invalido" },
      { status: 404 }
    );
  }

  return NextResponse.json({ nome: tenant.nome });
}

export async function POST(request: NextRequest) {
  try {
    const { codigo, nome, email, senha } = await request.json();

    if (!codigo || !nome || !email || !senha) {
      return NextResponse.json(
        { error: "Todos os campos sao obrigatorios" },
        { status: 400 }
      );
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { codigo },
    });

    if (!tenant || !tenant.ativo) {
      return NextResponse.json(
        { error: "Codigo de convite invalido" },
        { status: 404 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email ja esta em uso" },
        { status: 400 }
      );
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        nome,
        email,
        senhaHash,
        role: "membro",
        avatar: "👤",
      },
    });

    return NextResponse.json({ message: "Bem-vindo a familia!" });
  } catch (error) {
    console.error("Erro ao entrar na familia:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
