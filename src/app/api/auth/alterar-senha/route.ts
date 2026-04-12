import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/tenant";

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedTenant();

    if (!user) {
      return NextResponse.json(
        { error: "Nao autorizado" },
        { status: 401 }
      );
    }

    const { senhaAtual, novaSenha } = await request.json();

    if (!senhaAtual || !novaSenha) {
      return NextResponse.json(
        { error: "Todos os campos sao obrigatorios" },
        { status: 400 }
      );
    }

    if (novaSenha.length < 6) {
      return NextResponse.json(
        { error: "A nova senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "Usuario nao encontrado" },
        { status: 404 }
      );
    }

    const senhaValida = await bcrypt.compare(senhaAtual, dbUser.senhaHash);

    if (!senhaValida) {
      return NextResponse.json(
        { error: "Senha atual incorreta" },
        { status: 400 }
      );
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { senhaHash: novaSenhaHash },
    });

    return NextResponse.json({
      message: "Senha alterada com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
