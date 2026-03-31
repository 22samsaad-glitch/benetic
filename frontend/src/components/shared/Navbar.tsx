"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const pageTitles: Record<string, string> = {
  "/leads": "Dashboard",
  "/booked": "Booked Calls",
  "/converted": "Converted",
  "/pipelines": "Pipeline",
  "/workflows": "Sequences",
  "/templates": "Templates",
  "/analytics": "Analytics",
  "/integrations": "Lead Sources",
  "/team": "Team",
  "/settings": "Settings",
};

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const pageTitle = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(path)
  )?.[1] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-6">
      <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 hover:opacity-90"
        >
          <span className="text-sm font-bold leading-none">+</span> New
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs font-bold bg-blue-100 text-[#2563eb] rounded-full">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl">
            <DropdownMenuLabel className="font-normal py-2.5">
              <p className="text-sm font-semibold leading-none">{user?.name ?? "User"}</p>
              <p className="text-xs text-muted-foreground mt-1">{user?.email ?? ""}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer rounded-lg">
                <Settings className="mr-2 h-3.5 w-3.5" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer text-destructive focus:text-destructive rounded-lg"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
