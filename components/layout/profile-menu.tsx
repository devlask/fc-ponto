"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BadgePlus, BarChart3, ClipboardClock, Download, LayoutDashboard, Rows3, Settings2, ShieldCheck, UserCircle2, Users2 } from "lucide-react";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ProfileMenuProps = {
  installAvailable?: boolean;
  onInstall?: () => Promise<void>;
  role: UserRole;
};

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/team", label: "Equipe", icon: Users2 },
  { href: "/admin/approvals", label: "Aprovações", icon: ClipboardClock },
  { href: "/admin/records", label: "Registros", icon: Rows3 },
  { href: "/admin/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/admin/settings/audit", label: "Auditoria", icon: ShieldCheck },
  { href: "/admin/settings", label: "Configurações", icon: Settings2 },
];

export function ProfileMenu({ installAvailable = false, onInstall, role }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const canManage = role === "admin" || role === "manager";

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-2xl border border-border bg-card/70"
        onClick={() => setOpen((value) => !value)}
      >
        <UserCircle2 className="h-4 w-4" />
        <span className="sr-only">Perfil</span>
      </Button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[140] w-[min(92vw,280px)] overflow-hidden rounded-[24px] border border-border bg-white/96 p-2 shadow-[0_24px_54px_rgba(24,39,75,0.16)] backdrop-blur-xl dark:bg-card/96">
          <div className="space-y-1">
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-[18px] px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <UserCircle2 className="h-4 w-4 text-primary" />
              Meu perfil
            </Link>

            {installAvailable && onInstall ? (
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-[18px] px-3 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
                onClick={() => {
                  setOpen(false);
                  void onInstall();
                }}
              >
                <Download className="h-4 w-4 text-primary" />
                Instalar app
              </button>
            ) : null}

            {canManage && (
              <>
                <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Administração
                </div>
                {adminLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-[18px] px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted",
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <item.icon className="h-4 w-4 text-primary" />
                    {item.label}
                  </Link>
                ))}
              </>
            )}

            {role === "admin" && (
              <Link
                href="/admin/team"
                className="mt-1 flex items-center gap-3 rounded-[18px] border border-dashed border-primary/24 bg-primary/6 px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/10"
                onClick={() => setOpen(false)}
              >
                <BadgePlus className="h-4 w-4 text-primary" />
                Adicionar usuário
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
