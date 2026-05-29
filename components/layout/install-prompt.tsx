"use client";

import { useEffect, useState } from "react";
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type InstallPromptProps = {
  children: (props: { available: boolean; promptInstall: () => Promise<void> }) => React.ReactNode;
};

export function InstallPrompt({ children }: InstallPromptProps) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  return children({
    available: Boolean(installEvent),
    promptInstall: async () => {
      if (!installEvent) {
        return;
      }

      await installEvent.prompt();
      await installEvent.userChoice;
      setInstallEvent(null);
    },
  });
}
