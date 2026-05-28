"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { PwaRegister } from "@/components/providers/pwa-register";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <PwaRegister />
      {children}
      <Toaster
        richColors
        closeButton
        toastOptions={{
          className: "border border-border bg-card text-foreground shadow-xl",
        }}
      />
    </ThemeProvider>
  );
}
