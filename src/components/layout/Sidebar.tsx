"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { CalendarDays, LayoutList, LogOut, Settings2, Users } from "lucide-react";

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
];

export function Sidebar() {
  const { user, isStaff, logout } = useAuth();
  const pathname = usePathname();

  const items = navItems.filter((item) => !item.staffOnly || isStaff);

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-white px-4 py-6">
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
  );
}
