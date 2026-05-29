"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavItems, employeeNavItems } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "@/components/branding/company-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
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

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 pb-40 pt-4 sm:px-6 lg:px-8">
      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 px-1 py-1"
      >
        <div className="flex items-center justify-between gap-2 rounded-[24px] bg-white/74 px-3 py-3 shadow-[0_20px_46px_rgba(31,41,55,0.08)] backdrop-blur-xl dark:bg-card/88 sm:gap-3 sm:px-4 sm:py-4">
          <div className="min-w-0 flex-1">
            <CompanyLogo href={isAdmin ? "/admin" : "/employee"} className="min-w-0" />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <InstallPrompt>
              {({ available, promptInstall }) => (
                <ProfileMenu installAvailable={available} onInstall={promptInstall} role={userRole} />
              )}
            </InstallPrompt>
          </div>
        </div>
      </motion.header>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        {children}
      </motion.div>

      <nav
        className="fixed inset-x-0 z-50 mx-auto max-w-md px-4"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
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
