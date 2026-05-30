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
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-36 pt-4 sm:px-6 lg:px-8">
      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 px-1 py-1"
      >
        <div className="flex items-center justify-between gap-2 rounded-[26px] bg-white/76 px-3 py-3 shadow-[0_18px_40px_rgba(31,41,55,0.07)] backdrop-blur-xl dark:bg-card/88 sm:gap-3 sm:px-4 sm:py-4">
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
        <div className="glass-panel flex items-center justify-between rounded-[30px] border border-border/90 px-3 py-3 backdrop-blur-xl shadow-[0_18px_50px_rgba(35,31,32,0.08)]">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-center rounded-[20px] px-3 py-3 text-sm font-semibold transition-all",
                  active ? "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(0,194,232,0.2)]" : "text-muted-foreground hover:bg-muted",
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
