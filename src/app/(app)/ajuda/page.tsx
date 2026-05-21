"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TutorialModal from "@/components/TutorialModal";

interface Secao {
  emoji: string;
  titulo: string;
  resumo: string;
  conteudo: Array<{
    tit: string;
    txt: string | string[];
  }>;
}

const SECOES: Secao[] = [
  {
    emoji: "🚀",
    titulo: "Comecando",
    resumo: "Primeiros passos no GFF",
    conteudo: [
      {
        tit: "O que e o GFF?",
        txt: "O GFF (Gerenciamento Financeiro Familiar) eh um sistema multi-tenant para sua familia controlar financas, planejar eventos e nao esquecer aniversarios. Cada familia tem seus dados isolados e privados.",
      },
      {
        tit: "Primeiro passo: cadastre suas contas bancarias",
        txt: [
          "1. Acesse 'Contas Bancarias' no menu",
          "2. Toque no botao + para adicionar",
          "3. Escolha o tipo (Corrente, Poupanca, Carteira, Cartao, Outro)",
          "4. Informe nome, banco e saldo inicial",
          "5. Salve - o saldo sera atualizado automaticamente com os lancamentos",
        ],
      },
      {
        tit: "Segundo passo: cadastre receitas e despesas",
        txt: [
          "1. Va em 'Controle Financeiro' (ou 'Dinheiro' no celular)",
          "2. Toque no + para criar um lancamento",
          "3. Escolha Despesa ou Receita, descreva, valor e categoria",
          "4. Se ja foi pago, marque 'Ja esta quitado'",
          "5. Senao, fica como pendente para quitar depois",
        ],
      },
    ],
  },
  {
    emoji: "📋",
    titulo: "Plano de Contas",
    resumo: "Categorias para classificar dinheiro",
    conteudo: [
      {
        tit: "O que e Plano de Contas?",
        txt: "Sao as categorias que voce usa para classificar suas receitas e despesas. Ex: Moradia, Alimentacao, Salario, Lazer.",
      },
      {
        tit: "Categorias padrao",
        txt: "Quando voce cria a familia, o sistema ja cria varias categorias prontas para usar (Despesas: Moradia, Alimentacao, Transporte, Saude, Educacao, Lazer, Vestuario, Presentes; Receitas: Salarios, Freelance, Investimentos).",
      },
      {
        tit: "Adicionar minhas proprias categorias",
        txt: [
          "1. Acesse 'Plano de Contas' no menu",
          "2. Toque em + Nova Conta",
          "3. Informe codigo (1, 2, 3...), nome, tipo (Receita ou Despesa)",
          "4. Opcional: escolha um icone e cor",
          "5. Voce pode criar subcategorias escolhendo uma 'Conta Pai'",
        ],
      },
    ],
  },
  {
    emoji: "🏦",
    titulo: "Contas Bancarias",
    resumo: "Suas contas e cartoes",
    conteudo: [
      {
        tit: "Tipos de conta disponiveis",
        txt: [
          "🏦 CORRENTE - conta corrente do banco",
          "💰 POUPANCA - poupanca",
          "👛 CARTEIRA - dinheiro em especie",
          "💳 CARTAO - cartao de credito (controla a fatura)",
          "📦 OUTRO - qualquer outro tipo",
        ],
      },
      {
        tit: "Como o saldo e calculado",
        txt: "O saldo eh sempre: Saldo Inicial + Receitas Pagas - Despesas Pagas. Lancamentos pendentes nao afetam o saldo. Compras no credito NAO debitam o saldo (sao computadas quando voce paga a fatura).",
      },
      {
        tit: "Cartao de Credito - como funciona",
        txt: [
          "1. Crie uma conta do tipo CARTAO (ex: Nubank, Itaucard)",
          "2. Lance suas compras: forma 'Credito' + escolha o cartao usado",
          "3. As compras entram em 'Fatura Aberta' do cartao",
          "4. Quando o boleto da fatura chegar, lance o pagamento:",
          "   - Forma de Pagamento: PIX/Debito/etc (NAO credito)",
          "   - Conta Bancaria: a conta corrente que vai pagar",
          "   - Pagamento de Fatura?: selecione o cartao sendo pago",
          "5. Isso debita da conta corrente e zera a fatura do cartao",
        ],
      },
    ],
  },
  {
    emoji: "💰",
    titulo: "Controle Financeiro",
    resumo: "Receitas, despesas e quitacao",
    conteudo: [
      {
        tit: "Criar um lancamento",
        txt: [
          "1. Toque no botao + (FAB) no canto inferior direito",
          "2. Escolha Despesa ou Receita",
          "3. Preencha descricao, valor, categoria",
          "4. Escolha quem pagou/recebeu, forma de pagamento, conta bancaria",
          "5. Defina a data de vencimento",
          "6. Marque 'Recorrente' se for todo mes",
          "7. Marque 'Ja esta quitado' se ja foi pago, senao salve como pendente",
        ],
      },
      {
        tit: "Campos extras",
        txt: [
          "💳 Codigo de Barras - cole o codigo do boleto para guardar",
          "📈 Multa - acrescimo por atraso de pagamento",
          "📈 Juros - juros por atraso",
          "📝 Observacao - qualquer anotacao adicional",
        ],
      },
      {
        tit: "Quitar uma conta pendente",
        txt: [
          "1. Encontre o lancamento na lista (filtre por 'Pendentes' se quiser)",
          "2. Toque no botao ✓ verde no card do lancamento",
          "3. Informe data do pagamento, forma de pagamento, conta e quem pagou",
          "4. Confirme - o status muda para PAGO e o saldo da conta eh atualizado",
        ],
      },
      {
        tit: "Filtros e navegacao",
        txt: [
          "📅 Setas para trocar de mes",
          "🔘 Botoes Todos/Pendentes/Pagos/Atrasados para filtrar",
          "📑 Tabs: Tudo | Contas a Pagar | Recebimentos",
          "💡 Pendentes de meses anteriores aparecem automaticamente no mes atual",
        ],
      },
    ],
  },
  {
    emoji: "📊",
    titulo: "Plano Financeiro",
    resumo: "Orcamento mensal por categoria",
    conteudo: [
      {
        tit: "Para que serve?",
        txt: "Voce define quanto pretende gastar/receber em cada categoria no mes. O sistema compara em tempo real com o que realmente foi gasto e mostra se voce esta dentro ou fora do orcamento.",
      },
      {
        tit: "Como usar",
        txt: [
          "1. Acesse 'Plano Financeiro' no menu",
          "2. Selecione o mes/ano",
          "3. Toque em '+ Adicionar Categoria ao Plano'",
          "4. Escolha a categoria e informe o valor planejado",
          "5. Conforme voce lanca movimentos, a barra de progresso atualiza",
          "6. Verde = dentro do orcamento, Vermelho = estourou",
        ],
      },
    ],
  },
  {
    emoji: "🎂",
    titulo: "Aniversarios",
    resumo: "Agenda de aniversarios",
    conteudo: [
      {
        tit: "Cadastrar aniversario",
        txt: [
          "1. Va em 'Aniversarios' no menu",
          "2. Toque no + para adicionar",
          "3. Informe nome, data, parentesco",
          "4. Opcional: telefone, observacao, emoji",
        ],
      },
      {
        tit: "Visualizacao",
        txt: [
          "📋 Lista - ordenada por dias ate o aniversario, com contador",
          "📅 Calendario - 12 cards mensais com todos os aniversariantes",
          "🔔 Avisos no painel inicial: 1 dia antes e no dia",
        ],
      },
    ],
  },
  {
    emoji: "📅",
    titulo: "Eventos / Programacoes",
    resumo: "Viagens, festas e eventos com orcamento",
    conteudo: [
      {
        tit: "Criar evento",
        txt: [
          "1. Acesse 'Eventos' no menu",
          "2. Toque no + para criar",
          "3. Informe titulo, tipo (Viagem, Festa, Casamento, Outro), datas",
          "4. Opcional: local, descricao, orcamento previsto",
        ],
      },
      {
        tit: "Itens de orcamento",
        txt: [
          "1. Entre no evento criado",
          "2. Adicione itens: ex 'Gasolina', 'Hotel', 'Refeicoes'",
          "3. Informe valor estimado e valor real (quando souber)",
          "4. Vincule cada item a uma categoria do plano de contas",
          "5. Veja o progresso do orcamento em tempo real",
        ],
      },
      {
        tit: "Status do evento",
        txt: [
          "⏳ Planejando - ainda em fase de planejamento",
          "✓ Confirmado - confirmado, vai acontecer",
          "🎉 Concluido - ja aconteceu",
          "❌ Cancelado - foi cancelado",
        ],
      },
    ],
  },
  {
    emoji: "📊",
    titulo: "Relatorios",
    resumo: "Visualizar dados do periodo",
    conteudo: [
      {
        tit: "Relatorio por Conta Bancaria",
        txt: [
          "1. Acesse 'Relatorios' no menu",
          "2. Selecione data inicial e final (ou atalho: mes corrente, ultimos 30 dias, ano)",
          "3. Toque em '🔍 Gerar Relatorio'",
          "4. Veja totais gerais e detalhamento por conta",
          "5. Clique em cada conta para expandir e ver os lancamentos do periodo",
        ],
      },
    ],
  },
  {
    emoji: "👨‍👩‍👧‍👦",
    titulo: "Familia",
    resumo: "Membros, codigo de convite e senha",
    conteudo: [
      {
        tit: "Convidar membros da familia",
        txt: [
          "1. Acesse 'Familia' no menu (Configuracoes)",
          "2. Copie o 'Codigo de Convite' (6 caracteres)",
          "3. Envie para os membros da familia",
          "4. Cada um acessa o site, escolhe 'Entrar na Familia' e usa o codigo",
          "5. Apos isso, todos veem os mesmos dados e podem registrar lancamentos",
        ],
      },
      {
        tit: "Alterar senha",
        txt: [
          "1. Va em 'Familia'",
          "2. Toque no botao 'Alterar Senha'",
          "3. Informe a senha atual e a nova senha (minimo 6 caracteres)",
          "4. Confirme - sera deslogado e precisa fazer login com a nova senha",
        ],
      },
      {
        tit: "Permissoes",
        txt: [
          "👑 Admin - quem criou a familia. Pode editar nome da familia.",
          "👤 Membro - pode criar e editar lancamentos, mas nao altera nome da familia",
          "Todos veem tudo (financas, eventos, etc) - eh um sistema FAMILIAR, sem dados privados entre membros da mesma familia",
        ],
      },
    ],
  },
  {
    emoji: "🔒",
    titulo: "Privacidade e Seguranca",
    resumo: "Como seus dados sao protegidos",
    conteudo: [
      {
        tit: "Seus dados sao privados",
        txt: "Cada familia tem seus dados completamente isolados. Outras familias usando o sistema NAO veem nada da sua. As consultas no banco sempre filtram pelo seu tenant (familia).",
      },
      {
        tit: "Senha",
        txt: "Sua senha eh armazenada com hash bcrypt - nem nos administradores conseguimos ver. Use senhas fortes e nao compartilhe.",
      },
      {
        tit: "Codigo de convite",
        txt: "Compartilhe o codigo de convite SO com pessoas da familia. Qualquer pessoa com o codigo consegue entrar na sua familia e ver todos os dados.",
      },
    ],
  },
];

export default function AjudaPage() {
  const [busca, setBusca] = useState("");
  const [expandido, setExpandido] = useState<Record<number, boolean>>({});
  const [tutorialOpen, setTutorialOpen] = useState(false);

  function toggle(i: number) {
    setExpandido((e) => ({ ...e, [i]: !e[i] }));
  }

  const secoesFiltradas = busca
    ? SECOES.filter((s) => {
        const texto = (
          s.titulo +
          " " +
          s.resumo +
          " " +
          s.conteudo
            .map((c) => c.tit + " " + (Array.isArray(c.txt) ? c.txt.join(" ") : c.txt))
            .join(" ")
        ).toLowerCase();
        return texto.includes(busca.toLowerCase());
      })
    : SECOES;

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">❓ Ajuda</h1>
        <p className="text-gray-500 mt-1">Manual de instrucoes do GFF</p>
      </div>

      {/* Ver tutorial novamente */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="py-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-blue-900">🎓 Tutorial</p>
            <p className="text-sm text-blue-700">
              Quer rever o tutorial de boas-vindas?
            </p>
          </div>
          <Button onClick={() => setTutorialOpen(true)} className="h-11">
            Ver tutorial
          </Button>
        </CardContent>
      </Card>

      {/* Busca */}
      <Input
        placeholder="🔍 Buscar na ajuda..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="h-12"
      />

      {/* Secoes */}
      {secoesFiltradas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-500">Nada encontrado para &ldquo;{busca}&rdquo;</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {secoesFiltradas.map((secao, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-3xl flex-shrink-0">{secao.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800">{secao.titulo}</h3>
                    <p className="text-sm text-gray-500">{secao.resumo}</p>
                  </div>
                  <span className="text-gray-400 text-xl flex-shrink-0">
                    {expandido[i] ? "▲" : "▼"}
                  </span>
                </button>

                {expandido[i] && (
                  <div className="px-4 pb-4 space-y-4 border-t pt-4">
                    {secao.conteudo.map((c, j) => (
                      <div key={j}>
                        <h4 className="font-semibold text-gray-800 mb-2">
                          {c.tit}
                        </h4>
                        {Array.isArray(c.txt) ? (
                          <ul className="space-y-1">
                            {c.txt.map((linha, k) => (
                              <li
                                key={k}
                                className="text-sm text-gray-600 pl-2"
                              >
                                {linha}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-600">{c.txt}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer */}
      <Card className="bg-gray-50">
        <CardContent className="py-4 text-center">
          <p className="text-sm text-gray-600">
            💡 Nao encontrou o que procurava?
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Continuamos melhorando o GFF. Use bem e bom controle financeiro!
          </p>
        </CardContent>
      </Card>

      {/* Tutorial Modal */}
      <TutorialModal
        open={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        marcarComoVisto={false}
      />
    </div>
  );
}
