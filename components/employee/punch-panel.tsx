"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  ChevronLeft,
  CheckCircle2,
  CircleAlert,
  CircleX,
  X,
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
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { EntryType, GeoPoint, TimeEntry, WorkState } from "@/types";

type PunchPanelProps = {
  currentState: WorkState;
  employeeName: string;
  nextEntryType: EntryType;
  onRegistered?: (entry: TimeEntry) => void;
  summaryCards: Array<{ label: string; value: string }>;
};

type PunchStep = "location" | "selfie" | "confirm";
type ModalStatus = "idle" | "success" | "error";

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
  if (step === "location") return 34;
  if (step === "selfie") return 68;
  return 100;
}

function getStepIndex(step: PunchStep) {
  if (step === "location") return 0;
  if (step === "selfie") return 1;
  return 2;
}

export function PunchPanel({
  currentState,
  employeeName,
  nextEntryType,
  onRegistered,
  summaryCards,
}: PunchPanelProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [step, setStep] = useState<PunchStep>("location");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<ModalStatus>("idle");
  const [modalMessage, setModalMessage] = useState<string | null>(null);
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

  useEffect(() => {
    if (!modalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalOpen]);

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
    setStep("location");
    setModalStatus("idle");
    setModalMessage(null);
  };

  const openModal = () => {
    resetFlow(false);
    setReceipt(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetFlow(false);
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

      const data = (await response.json()) as Receipt & { entry?: TimeEntry };
      setReceipt(data);
      if (data.entry) {
        onRegistered?.(data.entry);
      }
      setModalStatus("success");
      setModalMessage("Ponto registrado e sincronizado com sucesso.");
      toast.success("Ponto registrado com sucesso.");
      startRefresh(() => {
        router.refresh();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível registrar o ponto.";
      setModalStatus("error");
      setModalMessage(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
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
            <Button type="button" size="lg" className="h-16 flex-1 rounded-[22px] text-base" onClick={openModal}>
              Marcar ponto
            </Button>
            <div className="rounded-[22px] border border-border bg-card/70 px-4 py-4 text-sm text-muted-foreground sm:max-w-[220px]">
              GPS e selfie serão validados em etapas separadas dentro do modal de marcação.
            </div>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-[80] bg-slate-950/38 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex min-h-screen items-end justify-center p-3 sm:items-center sm:p-6">
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ duration: 0.22 }}
                className={cn(
                  "max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[32px] border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.98))] shadow-[0_28px_90px_rgba(10,26,61,0.24)]",
                  modalStatus === "idle" && "border-white/70",
                  modalStatus === "success" && "border-emerald-400/60 shadow-[0_28px_90px_rgba(16,185,129,0.22)]",
                  modalStatus === "error" && "border-rose-400/60 shadow-[0_28px_90px_rgba(244,63,94,0.20)]",
                )}
              >
                <div className="max-h-[92vh] overflow-y-auto">
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/70 bg-white/88 px-5 py-4 backdrop-blur-xl">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">FC Comunicação Visual</p>
                      <p className="font-heading text-xl font-semibold text-foreground">Marcação de ponto</p>
                    </div>
                    <Button type="button" variant="ghost" className="rounded-full" onClick={closeModal}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {modalStatus === "idle" ? (
                    <div className="space-y-6 p-5 sm:p-7">
                      <div className="flex items-center justify-between gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          className="rounded-[18px]"
                          onClick={() => (step === "location" ? closeModal() : setStep(step === "selfie" ? "location" : "selfie"))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          {step === "location" ? "Fechar" : "Voltar"}
                        </Button>
                        <Badge variant="info" className="rounded-full px-3 py-1">
                          Etapa {currentStepIndex + 1} de 3
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {stepMeta.map((item, index) => {
                            const active = currentStepIndex >= index;

                            return (
                              <div key={item.id} className="min-w-0 rounded-[20px] border border-border/70 bg-white/70 p-3 text-center dark:bg-white/6">
                                <div
                                  className={cn(
                                    "mx-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                                    active
                                      ? "border-transparent bg-[#0f6df2] text-white"
                                      : "border-border bg-card/70 text-muted-foreground",
                                  )}
                                >
                                  <item.icon className="h-4 w-4" />
                                </div>
                                <p className="mt-2 truncate text-sm font-medium text-foreground">{item.label}</p>
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

                          <div className="flex justify-end">
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

                          <div className="flex justify-end">
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
                    </div>
                  ) : (
                    <div className="space-y-6 p-6 sm:p-8">
                      <div
                        className={cn(
                          "rounded-[28px] border p-5",
                          modalStatus === "success" && "border-emerald-300 bg-emerald-50/80",
                          modalStatus === "error" && "border-rose-300 bg-rose-50/90",
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "flex h-14 w-14 items-center justify-center rounded-full",
                              modalStatus === "success" && "bg-emerald-500/12 text-emerald-700",
                              modalStatus === "error" && "bg-rose-500/12 text-rose-700",
                            )}
                          >
                            {modalStatus === "success" ? <Check className="h-7 w-7" /> : <CircleX className="h-7 w-7" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "text-sm font-medium",
                                modalStatus === "success" && "text-emerald-800",
                                modalStatus === "error" && "text-rose-800",
                              )}
                            >
                              {modalStatus === "success" ? "Marcação concluída" : "Falha na marcação"}
                            </p>
                            <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                              {modalStatus === "success" ? receipt?.label : "Não foi possível registrar"}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {modalMessage}
                            </p>
                            {modalStatus === "success" && receipt ? (
                              <div className="mt-4 space-y-2">
                                <Badge variant="success">{receipt.classification}</Badge>
                                <p className="text-sm text-muted-foreground">
                                  {new Intl.DateTimeFormat("pt-BR", {
                                    dateStyle: "medium",
                                    timeStyle: "medium",
                                  }).format(new Date(receipt.timestamp))}
                                </p>
                                <p className="inline-flex items-center gap-2 text-sm text-emerald-800">
                                  <CheckCircle2 className="h-4 w-4" />
                                  {isRefreshing ? "Atualizando histórico..." : "Histórico será atualizado em seguida."}
                                </p>
                              </div>
                            ) : (
                              <p className="mt-4 inline-flex items-center gap-2 text-sm text-rose-800">
                                <CircleAlert className="h-4 w-4" />
                                Revise GPS, selfie e conexão antes de tentar novamente.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3">
                        {modalStatus === "error" && (
                          <Button type="button" variant="outline" className="rounded-[20px]" onClick={() => setModalStatus("idle")}>
                            Tentar novamente
                          </Button>
                        )}
                        <Button type="button" className="rounded-[20px]" onClick={closeModal}>
                          {modalStatus === "success" ? "Concluir" : "Fechar"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
