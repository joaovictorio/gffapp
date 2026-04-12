import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/utils";

// One-time setup endpoint - creates the superadmin account
// Protected by a secret token passed as query param
export async function POST(request: NextRequest) {
  const { email, senha, nome, secret } = await request.json();

  // Protect with environment variable
  const expectedSecret = process.env.SUPERADMIN_SECRET || "GFF_SUPER_2024";
  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  if (!email || !senha || !nome) {
    return NextResponse.json(
      { error: "email, senha e nome sao obrigatorios" },
      { status: 400 }
    );
  }

  // Check if superadmin already exists
  const existing = await prisma.user.findFirst({
    where: { role: "superadmin" },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Superadmin ja existe" },
      { status: 400 }
    );
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const codigo = generateInviteCode();

  // Create a special tenant for the platform admin
  const tenant = await prisma.tenant.create({
    data: {
      nome: "Administracao da Plataforma",
      codigo,
      usuarios: {
        create: {
          nome,
          email,
          senhaHash,
          role: "superadmin",
          avatar: "🛡️",
        },
      },
    },
    include: { usuarios: true },
  });

  return NextResponse.json({
    message: "Superadmin criado com sucesso",
    email: tenant.usuarios[0].email,
  });
}
