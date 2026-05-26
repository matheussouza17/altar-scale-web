"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { CalendarDays, CircleUser, LayoutList, LogOut, Settings2, Users } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  staffOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    href: "/missas",
    label: "Missas",
    icon: <LayoutList className="h-5 w-5" />,
    staffOnly: true,
  },
  {
    href: "/servidores",
    label: "Servidores",
    icon: <Users className="h-5 w-5" />,
    staffOnly: true,
  },
  {
    href: "/funcoes",
    label: "Funções",
    icon: <Settings2 className="h-5 w-5" />,
    staffOnly: true,
  },
  {
    href: "/disponibilidade",
    label: "Disponibilidade",
    icon: <CalendarDays className="h-5 w-5" />,
  },
  {
    href: "/conta",
    label: "Conta",
    icon: <CircleUser className="h-5 w-5" />,
  },
];

export function Sidebar() {
  const { user, isStaff, logout } = useAuth();
  const pathname = usePathname();

  const items = navItems.filter((item) => !item.staffOnly || isStaff);

  return (
    <>
      {/* ── Desktop: sidebar lateral ── */}
      <aside className="hidden md:flex h-screen w-60 flex-col border-r border-gray-200 bg-white px-4 py-6 shrink-0">
        <div className="mb-8 px-2">
          <p className="text-lg font-bold text-blue-700">EscalaAltar</p>
          <p className="text-xs text-gray-500 truncate">{user?.nome}</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </aside>

      {/* ── Mobile: header top bar ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <p className="text-base font-bold text-blue-700">EscalaAltar</p>
        <p className="text-xs text-gray-500 truncate max-w-[140px]">{user?.nome}</p>
      </header>

      {/* ── Mobile: bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-200 bg-white">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors",
                active ? "text-blue-700" : "text-gray-500",
              )}
            >
              <span className={cn(
                "rounded-lg p-1 transition-colors",
                active ? "bg-blue-50" : "",
              )}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium text-gray-500 transition-colors"
        >
          <span className="rounded-lg p-1">
            <LogOut className="h-5 w-5" />
          </span>
          <span>Sair</span>
        </button>
      </nav>
    </>
  );
}
