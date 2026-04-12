"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/painel", label: "Inicio", emoji: "🏠" },
  { href: "/financeiro", label: "Dinheiro", emoji: "💰" },
  { href: "/plano-financeiro", label: "Plano Financeiro", emoji: "📊" },
  { href: "/contas-bancarias", label: "Contas Bancarias", emoji: "🏦" },
  { href: "/plano-de-contas", label: "Plano de Contas", emoji: "📋" },
  { href: "/aniversarios", label: "Aniversarios", emoji: "🎂" },
  { href: "/eventos", label: "Eventos", emoji: "📅" },
  { href: "/configuracoes", label: "Familia", emoji: "👨‍👩‍👧‍👦" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4 border-b border-gray-100">
        <Link href="/painel" className="flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          <span className="font-bold text-lg text-gray-800">GFF</span>
        </Link>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <span className="text-lg">{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
