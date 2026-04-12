"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
      <div className="md:hidden">
        <span className="font-bold text-lg">🏠 GFF</span>
      </div>

      <div className="hidden md:block" />

      <div className="relative">
        <Button
          variant="ghost"
          className="gap-2 h-10"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="text-lg">👤</span>
          <span className="text-sm font-medium hidden sm:inline">
            {session?.user?.name}
          </span>
        </Button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[120px]">
            <button
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
