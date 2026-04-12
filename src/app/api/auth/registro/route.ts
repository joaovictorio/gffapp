import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/utils";
import { seedContasPadrao } from "@/lib/seed-contas";

export async function POST(request: NextRequest) {
  try {
    const { nomeFamilia, nome, email, senha } = await request.json();

    if (!nomeFamilia || !nome || !email || !senha) {
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
    const codigo = generateInviteCode();

    const tenant = await prisma.tenant.create({
      data: {
        nome: nomeFamilia,
        codigo,
        usuarios: {
          create: {
            nome,
            email,
            senhaHash,
            role: "admin",
            avatar: "👤",
          },
        },
      },
      include: { usuarios: true },
    });

    // Seed default chart of accounts
    await seedContasPadrao(tenant.id);

    return NextResponse.json({
      message: "Familia criada com sucesso!",
      codigoConvite: tenant.codigo,
    });
  } catch (error) {
    console.error("Erro ao registrar:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
