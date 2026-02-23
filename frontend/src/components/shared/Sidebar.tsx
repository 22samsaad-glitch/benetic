"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  GitBranch,
  Zap,
  FileText,
  BarChart3,
  Radio,
  UserPlus,
  Settings,
  CalendarCheck,
  ShoppingCart,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const mainNavItems = [
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Follow-up Sequences", href: "/workflows", icon: Zap },
  { label: "Booked Calls", href: "/booked", icon: CalendarCheck },
  { label: "Pipelines", href: "/pipelines", icon: GitBranch },
  { label: "Templates", href: "/templates", icon: FileText },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Lead Sources", href: "/integrations", icon: Radio },
];

const bottomNavItems = [
  { label: "Team", href: "/team", icon: UserPlus },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const renderNavItem = (item: (typeof mainNavItems)[0]) => {
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-white/10 hover:text-white",
          active
            ? "bg-white/15 text-white"
            : "text-white/60",
          collapsed && "justify-center px-2"
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col border-r bg-[#1e3a5f] text-white transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-white/10 px-4",
          collapsed && "justify-center px-2"
        )}
      >
        {collapsed ? (
          <span className="text-lg font-bold text-white">B</span>
        ) : (
          <span className="text-lg font-semibold tracking-tight text-white">Benetic</span>
        )}
      </div>

      {/* Main navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {mainNavItems.map(renderNavItem)}

        <Separator className="my-3 bg-white/10" />

        {bottomNavItems.map(renderNavItem)}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-white/10 p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn("w-full text-white/60 hover:text-white hover:bg-white/10", collapsed ? "px-2" : "justify-start")}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
