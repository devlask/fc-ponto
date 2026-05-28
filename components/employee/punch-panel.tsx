"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Clock3, Coffee, LogIn, LogOut, MoonStar } from "lucide-react";
import { toast } from "sonner";
import { GpsCaptureCard } from "@/components/employee/gps-capture-card";
import { SelfieCaptureCard } from "@/components/employee/selfie-capture-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { EntryType, GeoPoint } from "@/types";

const actions: Array<{ type: EntryType; label: string; icon: typeof LogIn }> = [
  { type: "entry", label: "Entrada", icon: LogIn },
  { type: "pause", label: "Pausa", icon: Coffee },
  { type: "return", label: "Retorno", icon: Clock3 },
  { type: "exit", label: "Saida", icon: LogOut },
  { type: "overtime", label: "Hora extra", icon: MoonStar },
];

type PunchPanelProps = {
  summaryCards: Array<{ label: string; value: string }>;
};

function getDeviceLabel() {
  const navigatorWithUAData = navigator as Navigator & { userAgentData?: { platform?: string } };
  const userAgent = navigator.userAgent;
  const platform = navigatorWithUAData.userAgentData?.platform || navigator.platform || "Dispositivo";

  if (userAgent.includes("Edg/")) return `${platform} / Edge`;
  if (userAgent.includes("Chrome/")) return `${platform} / Chrome`;
  if (userAgent.includes("Firefox/")) return `${platform} / Firefox`;
  if (userAgent.includes("Safari/") && !userAgent.includes("Chrome/")) return `${platform} / Safari`;

  return `${platform} / Navegador`;
}

function getDeviceId() {
  const storageKey = "fc-visual-device-id";
  const existing = window.localStorage.getItem(storageKey);

  if (existing) {
    return existing;
  }

  const nextId = crypto.randomUUID();
  window.localStorage.setItem(storageKey, nextId);
  return nextId;
}

export function PunchPanel({ summaryCards }: PunchPanelProps) {
  const router = useRouter();
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<EntryType | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceLabel, setDeviceLabel] = useState<string | null>(null);
  const [locationResetKey, setLocationResetKey] = useState(0);
  const [selfieResetKey, setSelfieResetKey] = useState(0);

  useEffect(() => {
    setDeviceId(getDeviceId());
    setDeviceLabel(getDeviceLabel());
  }, []);

  const canSubmit = Boolean(location && selfie && deviceId && deviceLabel);

  const registerPunch = async (type: EntryType) => {
    if (!location || !selfie || !deviceId || !deviceLabel) {
      toast.error("Selfie e GPS sao obrigatorios antes do registro.");
      return;
    }

    setSubmitting(type);

    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("latitude", String(location.lat));
      formData.append("longitude", String(location.lng));
      formData.append("accuracy", String(location.accuracy));
      formData.append("deviceId", deviceId);
      formData.append("deviceLabel", deviceLabel);
      formData.append("selfie", selfie);

      const response = await fetch("/api/employee/punch", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorPayload?.error || "Falha");
      }

      const data = await response.json();
      toast.success(`${data.label} registrada com sucesso. Classificacao: ${data.classification}.`);
      setLocation(null);
      setSelfie(null);
      setLocationResetKey((value) => value + 1);
      setSelfieResetKey((value) => value + 1);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel registrar o ponto.");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-foreground">Registrar ponto</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fluxo rapido com selfie ao vivo, GPS automatico e suporte a multiplas jornadas por dia.
                </p>
              </div>
              <Badge variant={canSubmit ? "success" : "warning"}>
                {canSubmit ? "pronto para registrar" : "aguardando validacoes"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {actions.map((action) => (
              <Button
                key={action.type}
                type="button"
                size="lg"
                variant={action.type === "overtime" ? "secondary" : "default"}
                disabled={!canSubmit || submitting !== null}
                className="h-20 flex-col rounded-[24px]"
                onClick={() => registerPunch(action.type)}
              >
                <action.icon className="h-5 w-5" />
                {submitting === action.type ? "Enviando..." : action.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <GpsCaptureCard onResolved={setLocation} resetKey={locationResetKey} />
          <SelfieCaptureCard onCaptured={setSelfie} resetKey={selfieResetKey} />
        </div>
      </div>

      <Card className="ink-chip border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Camera className="h-5 w-5 text-primary" />
            Resumo operacional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {summaryCards.map((item, index) => (
            <div
              key={item.label}
              className={
                index === 0
                  ? "rounded-[24px] border border-primary/15 bg-primary/8 p-4"
                  : index === 1
                    ? "rounded-[24px] border border-secondary/15 bg-secondary/8 p-4"
                    : "rounded-[24px] border border-accent/20 bg-accent/15 p-4"
              }
            >
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-2 font-heading text-2xl font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
          <div className="rounded-[24px] border border-border bg-white/55 p-4 dark:bg-white/6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Conformidade do registro</p>
              <p className="text-sm text-foreground">{canSubmit ? "100%" : "67%"}</p>
            </div>
            <Progress value={canSubmit ? 100 : 67} />
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Selfie, GPS, IP e dispositivo sao capturados e enviados junto com o evento de ponto.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
