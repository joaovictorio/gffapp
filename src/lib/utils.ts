import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function parseLocalDate(date: Date | string): Date {
  const str = typeof date === "string" ? date : date.toISOString();
  // Extract YYYY-MM-DD and treat as local date to avoid UTC shift
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(+match[1], +match[2] - 1, +match[3]);
  }
  return new Date(date);
}

export function formatDate(date: Date | string): string {
  const d = parseLocalDate(date);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateShort(date: Date | string): string {
  const d = parseLocalDate(date);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(d);
}

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function diasAteAniversario(data: Date | string): number {
  const hoje = new Date();
  const aniversario = parseLocalDate(data);
  const proximoAniversario = new Date(
    hoje.getFullYear(),
    aniversario.getMonth(),
    aniversario.getDate()
  );
  if (proximoAniversario < hoje) {
    proximoAniversario.setFullYear(proximoAniversario.getFullYear() + 1);
  }
  const diff = proximoAniversario.getTime() - hoje.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
