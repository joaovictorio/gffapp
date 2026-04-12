import { prisma } from "./prisma";

interface ContaSeed {
  codigo: string;
  nome: string;
  tipo: "RECEITA" | "DESPESA";
  icone?: string;
  cor?: string;
  parentCodigo?: string;
}

const CONTAS_PADRAO: ContaSeed[] = [
  // DESPESAS
  { codigo: "1", nome: "Moradia", tipo: "DESPESA", icone: "🏠", cor: "#F59E0B" },
  { codigo: "1.1", nome: "Aluguel", tipo: "DESPESA", parentCodigo: "1" },
  { codigo: "1.2", nome: "Condominio", tipo: "DESPESA", parentCodigo: "1" },
  { codigo: "1.3", nome: "IPTU", tipo: "DESPESA", parentCodigo: "1" },
  { codigo: "1.4", nome: "Energia", tipo: "DESPESA", parentCodigo: "1" },
  { codigo: "1.5", nome: "Agua", tipo: "DESPESA", parentCodigo: "1" },
  { codigo: "1.6", nome: "Internet", tipo: "DESPESA", parentCodigo: "1" },
  { codigo: "1.7", nome: "Manutencao", tipo: "DESPESA", parentCodigo: "1" },

  { codigo: "2", nome: "Alimentacao", tipo: "DESPESA", icone: "🍽️", cor: "#EF4444" },
  { codigo: "2.1", nome: "Supermercado", tipo: "DESPESA", parentCodigo: "2" },
  { codigo: "2.2", nome: "Feira/Hortifruti", tipo: "DESPESA", parentCodigo: "2" },
  { codigo: "2.3", nome: "Restaurantes", tipo: "DESPESA", parentCodigo: "2" },
  { codigo: "2.4", nome: "Delivery", tipo: "DESPESA", parentCodigo: "2" },

  { codigo: "3", nome: "Transporte", tipo: "DESPESA", icone: "🚗", cor: "#3B82F6" },
  { codigo: "3.1", nome: "Combustivel", tipo: "DESPESA", parentCodigo: "3" },
  { codigo: "3.2", nome: "Estacionamento", tipo: "DESPESA", parentCodigo: "3" },
  { codigo: "3.3", nome: "Transporte Publico", tipo: "DESPESA", parentCodigo: "3" },
  { codigo: "3.4", nome: "Manutencao Veiculo", tipo: "DESPESA", parentCodigo: "3" },
  { codigo: "3.5", nome: "Seguro Veiculo", tipo: "DESPESA", parentCodigo: "3" },
  { codigo: "3.6", nome: "IPVA", tipo: "DESPESA", parentCodigo: "3" },
  { codigo: "3.7", nome: "Pedagio", tipo: "DESPESA", parentCodigo: "3" },

  { codigo: "4", nome: "Saude", tipo: "DESPESA", icone: "🏥", cor: "#10B981" },
  { codigo: "4.1", nome: "Plano de Saude", tipo: "DESPESA", parentCodigo: "4" },
  { codigo: "4.2", nome: "Farmacia", tipo: "DESPESA", parentCodigo: "4" },
  { codigo: "4.3", nome: "Consultas", tipo: "DESPESA", parentCodigo: "4" },
  { codigo: "4.4", nome: "Exames", tipo: "DESPESA", parentCodigo: "4" },

  { codigo: "5", nome: "Educacao", tipo: "DESPESA", icone: "📚", cor: "#8B5CF6" },
  { codigo: "5.1", nome: "Escola/Faculdade", tipo: "DESPESA", parentCodigo: "5" },
  { codigo: "5.2", nome: "Cursos", tipo: "DESPESA", parentCodigo: "5" },
  { codigo: "5.3", nome: "Material Escolar", tipo: "DESPESA", parentCodigo: "5" },
  { codigo: "5.4", nome: "Livros", tipo: "DESPESA", parentCodigo: "5" },

  { codigo: "6", nome: "Lazer", tipo: "DESPESA", icone: "🎮", cor: "#EC4899" },
  { codigo: "6.1", nome: "Viagens", tipo: "DESPESA", parentCodigo: "6" },
  { codigo: "6.2", nome: "Streaming", tipo: "DESPESA", parentCodigo: "6" },
  { codigo: "6.3", nome: "Esportes", tipo: "DESPESA", parentCodigo: "6" },
  { codigo: "6.4", nome: "Cinema/Teatro", tipo: "DESPESA", parentCodigo: "6" },

  { codigo: "7", nome: "Vestuario", tipo: "DESPESA", icone: "👕", cor: "#F97316" },
  { codigo: "8", nome: "Presentes", tipo: "DESPESA", icone: "🎁", cor: "#A855F7" },
  { codigo: "9", nome: "Outros Gastos", tipo: "DESPESA", icone: "📌", cor: "#6B7280" },

  // RECEITAS
  { codigo: "10", nome: "Salarios", tipo: "RECEITA", icone: "💰", cor: "#22C55E" },
  { codigo: "10.1", nome: "Salario Principal", tipo: "RECEITA", parentCodigo: "10" },
  { codigo: "10.2", nome: "Salario Conjuge", tipo: "RECEITA", parentCodigo: "10" },

  { codigo: "11", nome: "Freelance", tipo: "RECEITA", icone: "💻", cor: "#06B6D4" },

  { codigo: "12", nome: "Investimentos", tipo: "RECEITA", icone: "📈", cor: "#14B8A6" },
  { codigo: "12.1", nome: "Rendimentos", tipo: "RECEITA", parentCodigo: "12" },
  { codigo: "12.2", nome: "Dividendos", tipo: "RECEITA", parentCodigo: "12" },

  { codigo: "13", nome: "Outras Receitas", tipo: "RECEITA", icone: "💵", cor: "#84CC16" },
];

export async function seedContasPadrao(tenantId: string) {
  const contaIdMap = new Map<string, string>();

  // Create parent accounts first (no parentCodigo)
  for (const conta of CONTAS_PADRAO.filter((c) => !c.parentCodigo)) {
    const created = await prisma.contaContabil.create({
      data: {
        tenantId,
        codigo: conta.codigo,
        nome: conta.nome,
        tipo: conta.tipo,
        icone: conta.icone,
        cor: conta.cor,
        ordem: parseInt(conta.codigo),
      },
    });
    contaIdMap.set(conta.codigo, created.id);
  }

  // Create child accounts
  for (const conta of CONTAS_PADRAO.filter((c) => c.parentCodigo)) {
    const parentId = contaIdMap.get(conta.parentCodigo!);
    await prisma.contaContabil.create({
      data: {
        tenantId,
        codigo: conta.codigo,
        nome: conta.nome,
        tipo: conta.tipo,
        icone: conta.icone,
        cor: conta.cor,
        parentId,
        ordem: parseInt(conta.codigo.split(".")[1] || "0"),
      },
    });
  }
}
