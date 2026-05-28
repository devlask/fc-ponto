"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type CompanyLogoProps = {
  compact?: boolean;
  href?: string;
  className?: string;
};

export function CompanyLogo({ compact = false, href, className }: CompanyLogoProps) {
  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--secondary))_62%,hsl(var(--accent))_100%)] text-sm font-black tracking-[0.28em] text-primary-foreground shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
        FC
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="font-heading text-[0.78rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            FC Comunicação Visual
          </p>
          <p className="font-heading text-lg font-semibold leading-tight text-foreground">Registro de Ponto</p>
        </div>
      )}
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex">
      {content}
    </Link>
  );
}
