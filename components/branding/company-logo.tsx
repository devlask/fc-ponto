"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type CompanyLogoProps = {
  compact?: boolean;
  href?: string;
  className?: string;
};

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      viewBox="0 0 300 180"
      aria-label="FC Comunicação Visual"
      className={cn(
        "h-auto shrink-0",
        compact ? "w-[112px] sm:w-[128px]" : "w-[136px] sm:w-[168px]",
      )}
      role="img"
    >
      <rect width="300" height="180" fill="transparent" />

      <path d="M24 16h118v27H56v32h74v27H56v46H24V16Z" fill="#050505" />

      <path
        d="M265 45c-12-16-32-26-57-26-39 0-69 28-69 71s29 71 69 71c24 0 45-10 57-26l-28-16c-6 8-15 13-28 13-22 0-38-18-38-42s16-42 38-42c13 0 22 5 28 13l28-16Z"
        fill="#050505"
      />

      <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="10">
        <path d="M171 60c18-6 40-5 56 2" stroke="#00b7ff" />
        <path d="M170 80c18 2 35 2 54-5" stroke="#ffb700" />
        <path d="M170 100c18 8 36 10 56 4" stroke="#31c561" />
        <path d="M169 120c18 7 34 8 54 2" stroke="#ff4a8d" />
      </g>

      <g>
        <path d="M230 59l14 3-11 9Z" fill="#00b7ff" />
        <path d="M226 73l14 0-12 10Z" fill="#ffb700" />
        <path d="M228 96l14-3-9 12Z" fill="#31c561" />
        <path d="M228 116l14-4-9 12Z" fill="#ff4a8d" />
      </g>

      <rect x="20" y="153" width="248" height="7" rx="3.5" fill="#050505" />

      <text
        x="20"
        y="177"
        fill="#050505"
        fontFamily="var(--font-space-grotesk), sans-serif"
        fontSize="18"
        fontWeight="700"
        letterSpacing="0.03em"
      >
        COMUNICAÇÃO VISUAL
      </text>
    </svg>
  );
}

export function CompanyLogo({ compact = false, href, className }: CompanyLogoProps) {
  const content = (
    <div className={cn("flex min-w-0 items-center", className)}>
      <LogoMark compact={compact} />
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex min-w-0 max-w-full">
      {content}
    </Link>
  );
}
