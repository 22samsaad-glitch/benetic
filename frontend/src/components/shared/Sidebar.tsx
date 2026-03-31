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
  Settings,
  CalendarCheck,
  ChevronDown,
  Bell,
  Plus,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const mainNavItems = [
  { label: "Dashboard",    href: "/leads",        icon: LayoutDashboard, tutorial: "nav-leads"     },
  { label: "Leads",        href: "/leads",        icon: Users,           tutorial: undefined       },
  { label: "Sequences",    href: "/workflows",    icon: Zap,             tutorial: "nav-sequences" },
  { label: "Booked Calls", href: "/booked",       icon: CalendarCheck,   tutorial: undefined       },
  { label: "Pipeline",     href: "/pipelines",    icon: GitBranch,       tutorial: "nav-pipeline"  },
  { label: "Templates",    href: "/templates",    icon: FileText,        tutorial: "nav-templates" },
  { label: "Analytics",    href: "/analytics",    icon: BarChart3,       tutorial: "nav-analytics" },
  { label: "Lead Sources", href: "/integrations", icon: Radio,           tutorial: undefined       },
  { label: "Settings",     href: "/settings",     icon: Settings,        tutorial: undefined       },
];

const favorites = [
  { label: "Primer Project",     color: "bg-red-500"   },
  { label: "Sullivan Project",   color: "bg-green-500" },
  { label: "Trustworth Project", color: "bg-blue-500"  },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      data-tutorial="sidebar"
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col bg-white transition-all duration-200 border-r",
        collapsed ? "w-14" : "w-60"
      )}
    >
      {/* Workspace selector */}
      <div className={cn(
        "flex h-14 items-center border-b border-gray-100 shrink-0 px-4",
        collapsed && "justify-center px-2"
      )}>
        {collapsed ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z" fill="#2563eb" />
          </svg>
        ) : (
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={onToggle}
              className="flex items-center gap-2 group"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z" fill="#2563eb" />
              </svg>
              <span className="text-sm font-semibold text-gray-900">Jetleads</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>
            <button type="button" className="relative p-1 text-gray-400 hover:text-gray-600 transition-colors duration-150">
              <Bell className="h-4 w-4" />
              <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            </button>
          </div>
        )}
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {/* Main Menu label */}
        {!collapsed && (
          <p className="px-4 mb-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-widest">
            Main Menu
          </p>
        )}

        <div className="space-y-0.5 px-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href) && item.label === "Dashboard"
              ? pathname === "/leads"
              : isActive(item.href);
            // Make Dashboard the active one when on /leads
            const isActiveItem = item.label === "Dashboard"
              ? pathname === "/leads" || pathname.startsWith("/leads/")
              : item.href !== "/leads" && isActive(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                title={collapsed ? item.label : undefined}
                {...(item.tutorial ? { "data-tutorial": item.tutorial } : {})}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150",
                  isActiveItem
                    ? "bg-[#0454ff] text-white font-medium"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                  collapsed && "justify-center px-2.5"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        {!collapsed && <div className="mx-4 mt-4 mb-3 h-px bg-gray-100" />}

        {/* Favorites */}
        {!collapsed && (
          <div className="px-2">
            <div className="flex items-center justify-between px-2 mb-1.5">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                Favorites
              </p>
              <button type="button" className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors duration-150">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-0.5">
              {favorites.map((fav) => (
                <button
                  key={fav.label}
                  type="button"
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
                >
                  <div className={cn("w-3 h-3 rounded-sm shrink-0", fav.color)} />
                  <span className="truncate">{fav.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User profile at bottom */}
      <div className={cn(
        "border-t border-gray-100 p-3 shrink-0",
        collapsed && "flex justify-center"
      )}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-600">
              {user?.name ? getInitials(user.name) : "U"}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-gray-600">
                {user?.name ? getInitials(user.name) : "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name ?? "User"}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email ?? ""}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          </div>
        )}
      </div>
    </aside>
  );
}
