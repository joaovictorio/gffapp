export const PARENTESCOS = [
  "Pai",
  "Mae",
  "Filho(a)",
  "Irmao(a)",
  "Avo(o)",
  "Tio(a)",
  "Primo(a)",
  "Sobrinho(a)",
  "Cunhado(a)",
  "Sogro(a)",
  "Amigo(a)",
  "Colega",
  "Vizinho(a)",
  "Outro",
] as const;

export const TIPOS_EVENTO = [
  { value: "VIAGEM", label: "Viagem", icone: "✈️" },
  { value: "FESTA", label: "Festa", icone: "🎉" },
  { value: "CASAMENTO", label: "Casamento", icone: "💒" },
  { value: "OUTRO", label: "Outro", icone: "📌" },
] as const;

export const STATUS_EVENTO = [
  { value: "PLANEJANDO", label: "Planejando", cor: "bg-yellow-100 text-yellow-800" },
  { value: "CONFIRMADO", label: "Confirmado", cor: "bg-blue-100 text-blue-800" },
  { value: "CONCLUIDO", label: "Concluido", cor: "bg-green-100 text-green-800" },
  { value: "CANCELADO", label: "Cancelado", cor: "bg-red-100 text-red-800" },
] as const;

export const STATUS_LANCAMENTO = [
  { value: "PENDENTE", label: "Pendente", cor: "bg-yellow-100 text-yellow-800" },
  { value: "PAGO", label: "Pago", cor: "bg-green-100 text-green-800" },
  { value: "ATRASADO", label: "Atrasado", cor: "bg-red-100 text-red-800" },
] as const;

export const MESES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const;
