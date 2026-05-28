"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Clock3, ShieldAlert } from "lucide-react";
import { adminNavItems, employeeNavItems } from "@/lib/constants";
import { hasSupabaseEnv } from "@/lib/env";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { InstallPrompt } from "@/components/layout/install-prompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8">
      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel sticky top-4 z-40 mb-6 rounded-[28px] border border-border px-4 py-4 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/25">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">FC Ponto</p>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? "Painel administrativo" : "Registro mobile-first"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!hasSupabaseEnv() && (
              <Badge variant="warning" className="hidden md:inline-flex">
                modo demo sem Supabase
              </Badge>
            )}
            <InstallPrompt />
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="rounded-2xl border border-border bg-card/70">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Alertas</span>
            </Button>
          </div>
        </div>

        {!hasSupabaseEnv() && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200 md:hidden">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Sem variaveis do Supabase. A interface funciona em modo demonstracao ate a conexao do backend.</p>
          </div>
        )}
      </motion.header>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        {children}
      </motion.div>

      <nav className="fixed inset-x-0 bottom-4 z-50 mx-auto max-w-md px-4">
        <div className="glass-panel flex items-center justify-between rounded-[28px] border border-border px-3 py-3 backdrop-blur-xl">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-center rounded-2xl px-3 py-3 text-sm font-medium transition-all",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
