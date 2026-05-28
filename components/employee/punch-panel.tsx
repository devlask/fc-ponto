"use client";

import { useState } from "react";
import { Camera, Clock3, Coffee, LogIn, LogOut, MoonStar } from "lucide-react";
import { toast } from "sonner";
import { GpsCaptureCard } from "@/components/employee/gps-capture-card";
import { SelfieCaptureCard } from "@/components/employee/selfie-capture-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { employeeStatusCards } from "@/lib/mock-data";
import type { EntryType, GeoPoint } from "@/types";

const actions: Array<{ type: EntryType; label: string; icon: typeof LogIn }> = [
  { type: "entry", label: "Entrada", icon: LogIn },
  { type: "pause", label: "Pausa", icon: Coffee },
  { type: "return", label: "Retorno", icon: Clock3 },
  { type: "exit", label: "Saida", icon: LogOut },
  { type: "overtime", label: "Hora extra", icon: MoonStar },
];

export function PunchPanel() {
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<EntryType | null>(null);

  const canSubmit = Boolean(location && selfie);

  const registerPunch = async (type: EntryType) => {
    if (!location || !selfie) {
      toast.error("Selfie e GPS sao obrigatorios antes do registro.");
      return;
    }

    setSubmitting(type);

    try {
      const response = await fetch("/api/demo/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          location,
          selfieName: selfie.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha");
      }

      const data = await response.json();
      toast.success(`${data.label} registrada com sucesso. Classificacao: ${data.classification}.`);
    } catch {
      toast.error("Nao foi possivel registrar o ponto.");
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
          <GpsCaptureCard onResolved={setLocation} />
          <SelfieCaptureCard onCaptured={setSelfie} />
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
          {employeeStatusCards.map((item, index) => (
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
              <p className="text-sm text-foreground">100%</p>
            </div>
            <Progress value={100} />
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Selfie, GPS, IP e dispositivo sao capturados e enviados junto com o evento de ponto.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
