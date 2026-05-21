"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    emoji: "👋",
    titulo: "Bem-vindo ao GFF!",
    descricao:
      "O GFF eh o sistema de financas da sua familia. Aqui voce controla dinheiro, planeja eventos e nao esquece de nenhum aniversario!",
    detalhes: [
      "👨‍👩‍👧‍👦 Toda a familia em um so lugar",
      "🔒 Seus dados sao privados e seguros",
      "📱 Funciona no celular e no computador",
    ],
  },
  {
    emoji: "📋",
    titulo: "Plano de Contas",
    descricao:
      "Antes de tudo, conheca o Plano de Contas - sao as categorias para classificar suas receitas e despesas.",
    detalhes: [
      "🏠 Categorias prontas: Moradia, Alimentacao, Transporte, Saude...",
      "💰 Tambem tem categorias de receita: Salario, Freelance, Investimentos",
      "➕ Voce pode adicionar suas proprias categorias se quiser",
    ],
  },
  {
    emoji: "🏦",
    titulo: "Contas Bancarias",
    descricao:
      "Cadastre suas contas (corrente, poupanca, carteira) e cartoes de credito.",
    detalhes: [
      "💰 Saldo eh calculado automaticamente conforme voce paga/recebe",
      "💳 Tipo CARTAO: para cartoes de credito - controle a fatura aberta",
      "👛 Tipo CARTEIRA: para o dinheiro em especie da familia",
    ],
  },
  {
    emoji: "💰",
    titulo: "Controle Financeiro",
    descricao:
      "Aqui voce cadastra contas a pagar, contas a receber e lancamentos diarios.",
    detalhes: [
      "➕ Toque no botao + para criar um novo lancamento",
      "✅ Marque 'Ja esta quitado' se ja foi pago",
      "✓ Lancamentos pendentes tem botao para quitar depois",
      "✏️ Pode editar ou excluir a qualquer momento",
    ],
  },
  {
    emoji: "💳",
    titulo: "Como funciona o Cartao de Credito",
    descricao:
      "Compras no credito nao saem da conta na hora - ficam na fatura do cartao.",
    detalhes: [
      "1. Lance a despesa com forma 'Credito' e escolha o cartao usado",
      "2. A compra entra na 'Fatura aberta' do cartao",
      "3. Quando chegar o boleto, lance o pagamento da fatura",
      "4. Marque o campo 'Pagamento de Fatura?' com o cartao - isso zera a fatura",
    ],
  },
  {
    emoji: "📊",
    titulo: "Plano Financeiro",
    descricao:
      "Defina um orcamento mensal para cada categoria. Compare planejado vs realizado.",
    detalhes: [
      "🎯 Estipule quanto pretende gastar/receber por categoria no mes",
      "📈 Veja em tempo real quanto ja foi gasto vs o que planejou",
      "🚦 Barra fica vermelha quando estoura o orcamento",
    ],
  },
  {
    emoji: "🎂",
    titulo: "Aniversarios e Eventos",
    descricao:
      "Nao esqueca dos aniversarios e planeje viagens, festas e ocasioes especiais.",
    detalhes: [
      "🎂 Cadastre aniversarios com parentesco e telefone",
      "📅 Crie eventos (viagens, festas) com orcamento detalhado",
      "🔔 Avisos automaticos aparecem no painel hoje e amanha",
    ],
  },
  {
    emoji: "👨‍👩‍👧‍👦",
    titulo: "Convide a Familia",
    descricao:
      "Compartilhe o codigo de convite para todos da familia usarem o mesmo sistema.",
    detalhes: [
      "🎟️ Va em Familia > Codigo de Convite e copie",
      "📤 Envie para os membros da familia",
      "👤 Cada um cria sua conta e ve tudo da mesma familia",
      "💪 Quem paga/recebe fica registrado por pessoa",
    ],
  },
  {
    emoji: "🎉",
    titulo: "Tudo pronto!",
    descricao:
      "Voce ja sabe o basico. Comece cadastrando seu primeiro lancamento ou conta bancaria.",
    detalhes: [
      "💡 Esqueceu algo? Acesse a aba '❓ Ajuda' a qualquer momento",
      "🚀 Bom uso!",
    ],
  },
];

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
  marcarComoVisto?: boolean;
}

export default function TutorialModal({ open, onClose, marcarComoVisto = true }: TutorialModalProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  async function handleFinish() {
    if (marcarComoVisto) {
      try {
        await fetch("/api/me/tutorial", { method: "PUT" });
      } catch (err) {
        console.error("Erro ao marcar tutorial como visto:", err);
      }
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleFinish(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Tutorial</DialogTitle>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? "w-6 bg-blue-600"
                  : i < step
                    ? "w-1.5 bg-blue-300"
                    : "w-1.5 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center py-4 space-y-4">
          <div className="text-7xl">{current.emoji}</div>
          <h2 className="text-2xl font-bold text-gray-800">{current.titulo}</h2>
          <p className="text-gray-600 px-2">{current.descricao}</p>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left space-y-2 mt-4">
            {current.detalhes.map((d, i) => (
              <p key={i} className="text-sm text-blue-900">
                {d}
              </p>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 pt-2">
          {!isFirst && (
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              className="h-12"
            >
              ← Voltar
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handleFinish}
            className="h-12"
          >
            Pular
          </Button>
          {isLast ? (
            <Button onClick={handleFinish} className="flex-1 h-12 bg-green-600 hover:bg-green-700">
              Comecar! 🚀
            </Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)} className="flex-1 h-12">
              Proximo →
            </Button>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-2">
          Passo {step + 1} de {STEPS.length}
        </p>
      </DialogContent>
    </Dialog>
  );
}
