"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  ChevronLeft,
  CheckCircle2,
  Clock3,
  Fingerprint,
  LoaderCircle,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { CompanyLogo } from "@/components/branding/company-logo";
import { GpsCaptureCard } from "@/components/employee/gps-capture-card";
import { SelfieCaptureCard } from "@/components/employee/selfie-capture-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { EntryType, GeoPoint, WorkState } from "@/types";

type PunchPanelProps = {
  currentState: WorkState;
  employeeName: string;
  nextEntryType: EntryType;
  summaryCards: Array<{ label: string; value: string }>;
};

type PunchStep = "home" | "location" | "selfie" | "confirm";

type Receipt = {
  classification: string;
  label: string;
  timestamp: string;
};

const stepMeta: Array<{
  id: Exclude<PunchStep, "home">;
  label: string;
  icon: typeof MapPin;
}> = [
  { id: "location", label: "Localização", icon: MapPin },
  { id: "selfie", label: "Selfie", icon: Camera },
  { id: "confirm", label: "Confirmar", icon: Fingerprint },
];

const nextActionLabels: Record<EntryType, string> = {
  entry: "Marcar entrada",
  exit: "Marcar saída",
  overtime: "Registrar retorno",
  pause: "Registrar retorno",
  return: "Registrar saída",
};

const currentStateCopy: Record<WorkState, string> = {
  off: "Pronto para iniciar a jornada.",
  working: "Seu próximo registro será a saída.",
  overtime: "Seu próximo registro será a saída da hora extra.",
  paused: "Seu próximo registro será o retorno.",
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

function getStepProgress(step: PunchStep) {
  if (step === "home") return 0;
  if (step === "location") return 34;
  if (step === "selfie") return 68;
  return 100;
}

function getStepIndex(step: PunchStep) {
  if (step === "location") return 0;
  if (step === "selfie") return 1;
  if (step === "confirm") return 2;
  return -1;
}

export function PunchPanel({ currentState, employeeName, nextEntryType, summaryCards }: PunchPanelProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [step, setStep] = useState<PunchStep>("home");
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceLabel, setDeviceLabel] = useState<string | null>(null);
  const [locationResetKey, setLocationResetKey] = useState(0);
  const [selfieResetKey, setSelfieResetKey] = useState(0);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setDeviceId(getDeviceId());
    setDeviceLabel(getDeviceLabel());
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const nextActionLabel = nextActionLabels[nextEntryType];
  const canGoToSelfie = Boolean(location);
  const canConfirm = Boolean(location && selfie);
  const progress = getStepProgress(step);
  const currentStepIndex = getStepIndex(step);

  const confirmationRows = useMemo(
    () => [
      {
        label: "Tipo do registro",
        value: nextActionLabel.replace("Marcar ", "").replace("Registrar ", ""),
      },
      {
        label: "Data e hora",
        value: new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "full",
          timeStyle: "medium",
        }).format(now),
      },
      {
        label: "Localização",
        value: location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : "Aguardando GPS",
      },
      {
        label: "Dispositivo",
        value: deviceLabel ?? "Carregando",
      },
    ],
    [deviceLabel, location, nextActionLabel, now],
  );

  const resetFlow = (clearReceipt = true) => {
    setLocation(null);
    setSelfie(null);
    setLocationResetKey((value) => value + 1);
    setSelfieResetKey((value) => value + 1);
    if (clearReceipt) {
      setReceipt(null);
    }
    setStep("home");
  };

  const submitPunch = async () => {
    if (!location || !selfie || !deviceId || !deviceLabel) {
      toast.error("Finalize GPS e selfie antes de confirmar.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
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
        throw new Error(errorPayload?.error || "Falha no envio.");
      }

      const data = (await response.json()) as Receipt;
      setReceipt(data);
      toast.success("Ponto registrado com sucesso.");
      startRefresh(() => {
        router.refresh();
      });
      resetFlow(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar o ponto.");
    } finally {
      setSubmitting(false);
    }
  };

  const showReceipt = receipt && step === "home";

  return (
    <div className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
      <div className="space-y-5">
        <AnimatePresence mode="wait">
          {step === "home" ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.24 }}
            >
              <Card className="overflow-hidden border-none bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(244,248,255,0.94))] shadow-[0_26px_70px_rgba(30,86,184,0.14)]">
                <CardContent className="space-y-8 p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <CompanyLogo />
                    <Badge variant="info" className="rounded-full px-3 py-1">
                      Registro guiado
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Olá, {employeeName}</p>
                      <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                        {nextActionLabel}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{currentStateCopy[currentState]}</p>
                    </div>

                    <div className="rounded-[30px] bg-[linear-gradient(135deg,#0f6df2_0%,#3388ff_45%,#7ab3ff_100%)] px-6 py-7 text-white shadow-[0_24px_60px_rgba(15,109,242,0.28)]">
                      <p className="text-sm uppercase tracking-[0.22em] text-white/72">Hora local</p>
                      <p className="mt-4 font-heading text-5xl font-semibold tracking-tight sm:text-6xl">
                        {new Intl.DateTimeFormat("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        }).format(now)}
                      </p>
                      <p className="mt-3 text-sm text-white/80">
                        {new Intl.DateTimeFormat("pt-BR", {
                          dateStyle: "full",
                        }).format(now)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {summaryCards.map((item, index) => (
                      <div
                        key={item.label}
                        className={cn(
                          "rounded-[24px] border p-4",
                          index === 0 && "border-[#d9e7ff] bg-[#eef5ff]",
                          index === 1 && "border-[#ffd7ea] bg-[#fff1f8]",
                          index === 2 && "border-[#ffeab3] bg-[#fff7dd]",
                        )}
                      >
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                        <p className="mt-2 font-heading text-2xl font-semibold text-foreground">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      size="lg"
                      className="h-16 flex-1 rounded-[22px] text-base"
                      onClick={() => {
                        setReceipt(null);
                        setStep("location");
                      }}
                    >
                      Marcar ponto
                    </Button>
                    <div className="rounded-[22px] border border-border bg-card/70 px-4 py-4 text-sm text-muted-foreground sm:max-w-[220px]">
                      GPS e selfie serão validados em etapas separadas antes da confirmação.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 22 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.22 }}
              className="space-y-4"
            >
              <Card className="overflow-hidden border-none bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,255,0.94))] shadow-[0_26px_70px_rgba(30,86,184,0.10)]">
                <CardContent className="space-y-6 p-6 sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <Button type="button" variant="ghost" className="rounded-[18px]" onClick={() => setStep("home")}>
                      <ChevronLeft className="h-4 w-4" />
                      Voltar
                    </Button>
                    <Badge variant="info" className="rounded-full px-3 py-1">
                      Etapa {Math.max(currentStepIndex + 1, 1)} de 3
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      {stepMeta.map((item, index) => {
                        const active = currentStepIndex >= index;

                        return (
                          <div key={item.id} className="flex min-w-0 flex-1 items-center gap-3">
                            <div
                              className={cn(
                                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                                active
                                  ? "border-transparent bg-[#0f6df2] text-white"
                                  : "border-border bg-card/70 text-muted-foreground",
                              )}
                            >
                              <item.icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{item.label}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Progress value={progress} />
                  </div>

                  {step === "location" && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="font-heading text-2xl font-semibold text-foreground">Confirme sua localização</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Primeiro capturamos sua posição atual para validar o registro de ponto.
                        </p>
                      </div>

                      <GpsCaptureCard onResolved={setLocation} resetKey={locationResetKey} />

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="lg"
                          className="h-14 rounded-[20px] px-8"
                          onClick={() => setStep("selfie")}
                          disabled={!canGoToSelfie}
                        >
                          Continuar
                        </Button>
                      </div>
                    </div>
                  )}

                  {step === "selfie" && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="font-heading text-2xl font-semibold text-foreground">Capture sua selfie</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          A foto é registrada apenas para validação do ponto e auditoria do evento.
                        </p>
                      </div>

                      <SelfieCaptureCard onCaptured={setSelfie} resetKey={selfieResetKey} />

                      <div className="flex items-center justify-between gap-3">
                        <Button type="button" variant="outline" className="rounded-[20px]" onClick={() => setStep("location")}>
                          Voltar para GPS
                        </Button>
                        <Button
                          type="button"
                          size="lg"
                          className="h-14 rounded-[20px] px-8"
                          onClick={() => setStep("confirm")}
                          disabled={!selfie}
                        >
                          Revisar marcação
                        </Button>
                      </div>
                    </div>
                  )}

                  {step === "confirm" && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="font-heading text-2xl font-semibold text-foreground">Confirmar ponto</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Revise os dados abaixo antes de enviar o registro definitivo.
                        </p>
                      </div>

                      <div className="grid gap-3">
                        {confirmationRows.map((row) => (
                          <div key={row.label} className="rounded-[24px] border border-border bg-white/72 p-4 dark:bg-white/6">
                            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{row.label}</p>
                            <p className="mt-2 text-base font-medium text-foreground">{row.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-800 dark:text-emerald-200">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          GPS, selfie, IP e dispositivo serão anexados ao evento.
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <Button type="button" variant="outline" className="rounded-[20px]" onClick={() => setStep("selfie")}>
                          Voltar para selfie
                        </Button>
                        <Button
                          type="button"
                          size="lg"
                          className="h-14 rounded-[20px] px-8"
                          onClick={submitPunch}
                          disabled={!canConfirm || submitting}
                        >
                          {submitting ? (
                            <>
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                              Confirmando...
                            </>
                          ) : (
                            "Confirmar ponto"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-5">
        {showReceipt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] border border-emerald-400/20 bg-[linear-gradient(180deg,rgba(240,255,248,0.96),rgba(234,255,245,0.92))] p-5 shadow-[0_20px_52px_rgba(16,185,129,0.12)]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-emerald-800">Registro sincronizado</p>
                <p className="mt-1 font-heading text-2xl font-semibold text-foreground">{receipt.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "medium",
                    timeStyle: "medium",
                  }).format(new Date(receipt.timestamp))}
                </p>
                <Badge variant="success" className="mt-3">
                  {receipt.classification}
                </Badge>
              </div>
            </div>
          </motion.div>
        )}

        <Card className="ink-chip border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Clock3 className="h-5 w-5 text-primary" />
              Visão rápida
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] border border-border bg-white/70 p-4 dark:bg-white/6">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Próxima ação</p>
              <p className="mt-2 font-heading text-2xl font-semibold text-foreground">{nextActionLabel}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{currentStateCopy[currentState]}</p>
            </div>

            <div className="grid gap-3">
              {summaryCards.map((item, index) => (
                <div
                  key={item.label}
                  className={cn(
                    "rounded-[24px] border p-4",
                    index === 0 && "border-[#d9e7ff] bg-[#eef5ff]",
                    index === 1 && "border-[#ffd7ea] bg-[#fff1f8]",
                    index === 2 && "border-[#ffeab3] bg-[#fff7dd]",
                  )}
                >
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-2 font-heading text-2xl font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[24px] border border-border bg-white/70 p-4 dark:bg-white/6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Sincronização</p>
                <p className="text-sm text-foreground">{isRefreshing ? "Atualizando..." : "Online"}</p>
              </div>
              <Progress value={isRefreshing ? 76 : 100} />
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                O histórico abaixo será atualizado automaticamente após a confirmação do ponto.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
