"use client";

import { motion } from "framer-motion";
import { BarChart3, CalendarRange, ClipboardPenLine, Clock3, Home, LayoutDashboard, Settings2, UserCircle2, Users2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavItems, employeeNavItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "@/components/branding/company-logo";
import { InstallPrompt } from "@/components/layout/install-prompt";
import { ProfileMenu } from "@/components/layout/profile-menu";
import type { UserRole } from "@/types";

type AppShellProps = {
  children: React.ReactNode;
  userRole: UserRole;
};

export function AppShell({ children, userRole }: AppShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const navItems = isAdmin ? adminNavItems : employeeNavItems;
  const iconMap = isAdmin
    ? {
        "/admin": LayoutDashboard,
        "/admin/team": Users2,
        "/admin/approvals": ClipboardPenLine,
        "/admin/reports": BarChart3,
        "/admin/settings": Settings2,
      }
    : {
        "/employee": Home,
        "/employee/journey": CalendarRange,
        "/employee/history": Clock3,
        "/employee/requests": ClipboardPenLine,
        "/profile": UserCircle2,
      };

  const isActiveNavItem = (href: string) => {
    if (href === "/employee" || href === "/admin" || href === "/profile") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-36 pt-4 sm:px-6 lg:px-8">
      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-[120] mb-4 px-1 py-1"
      >
        <div className="flex items-center justify-between gap-2 rounded-[24px] bg-white/76 px-3 py-2 shadow-[0_18px_40px_rgba(31,41,55,0.07)] backdrop-blur-xl dark:bg-card/88 sm:px-4 sm:py-3">
          <div className="min-w-0 flex-1">
            <CompanyLogo compact href="/employee" className="min-w-0" />
          </div>

          <div className="relative z-[130] flex shrink-0 items-center gap-2">
            <InstallPrompt>
              {({ available, promptInstall }) => (
                <ProfileMenu installAvailable={available} onInstall={promptInstall} role={userRole} />
              )}
            </InstallPrompt>
          </div>
        </div>
      </motion.header>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="relative z-0">
        {children}
      </motion.div>

      <nav
        className="fixed inset-x-0 z-50 mx-auto max-w-xl px-4"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <div className="glass-panel flex items-center justify-between rounded-[30px] border border-border/90 px-3 py-3 backdrop-blur-xl shadow-[0_18px_50px_rgba(35,31,32,0.08)]">
          {navItems.map((item) => {
            const active = isActiveNavItem(item.href);
            const Icon = iconMap[item.href as keyof typeof iconMap];

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-2 text-[11px] font-semibold transition-all sm:text-xs",
                  active ? "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(0,194,232,0.2)]" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {Icon ? <Icon className="h-4 w-4" /> : null}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
