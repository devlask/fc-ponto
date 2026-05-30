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
import { GpsCaptureCard } from "@/components/employee/gps-capture-card";
import { SelfieCaptureCard } from "@/components/employee/selfie-capture-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { EmployeePrimaryAction, EmployeeQuickSummary } from "@/lib/employee-time";
import type { GeoPoint, TimeEntry, WorkState } from "@/types";

type PunchPanelProps = {
  currentState: WorkState;
  employeeName: string;
  greeting: string;
  onRegistered?: (entry: TimeEntry) => void;
  primaryAction: EmployeePrimaryAction;
  quickSummary: EmployeeQuickSummary;
  todayEntries: TimeEntry[];
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
  greeting,
  onRegistered,
  primaryAction,
  quickSummary,
  todayEntries,
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

  const nextActionLabel = primaryAction.label;
  const canGoToSelfie = Boolean(location);
  const canConfirm = Boolean(location && selfie);
  const progress = getStepProgress(step);
  const currentStepIndex = getStepIndex(step);

  const buttonToneClasses =
    primaryAction.tone === "entry"
      ? "bg-[linear-gradient(135deg,#00b8e6_0%,#25c8ff_100%)] text-white shadow-[0_20px_40px_rgba(0,184,230,0.25)] hover:opacity-95"
      : primaryAction.tone === "exit"
        ? "bg-[linear-gradient(135deg,#ff4fa3_0%,#ff6ab1_100%)] text-white shadow-[0_20px_40px_rgba(255,79,163,0.24)] hover:opacity-95"
        : "bg-[linear-gradient(135deg,#ffcd38_0%,#ffb800_100%)] text-[#3a2d00] shadow-[0_20px_40px_rgba(255,184,0,0.22)] hover:opacity-95";

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
      toast.error("Conclua GPS e selfie antes de confirmar a marcação.");
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
      setModalMessage("Ponto registrado, salvo no histórico e sincronizado com sucesso.");
      toast.success("Ponto registrado com sucesso.");
      startRefresh(() => {
        router.refresh();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível registrar o ponto agora.";
      setModalStatus("error");
      setModalMessage(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-5 rounded-[34px] bg-white/72 px-5 py-6 shadow-[0_18px_40px_rgba(35,31,32,0.06)] backdrop-blur-xl sm:px-7">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-muted-foreground">
            {greeting}, {employeeName} 👋
          </p>
          <div className="space-y-2">
            <p className="font-heading text-6xl font-semibold tracking-tight text-foreground sm:text-7xl">
              {new Intl.DateTimeFormat("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              }).format(now)}
            </p>
            <p className="text-base text-muted-foreground">
              {new Intl.DateTimeFormat("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              }).format(now)}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-white/82 px-4 py-2 text-sm font-medium text-foreground">
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              currentState === "off" && "bg-[#00b8e6]",
              currentState === "working" && "bg-[#00b8e6]",
              currentState === "paused" && "bg-[#ff4fa3]",
              currentState === "overtime" && "bg-[#ffcd38]",
            )}
          />
          {quickSummary.status}
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            size="lg"
            className={cn("h-20 w-full rounded-[28px] px-6 text-lg font-bold tracking-[0.04em]", buttonToneClasses)}
            onClick={openModal}
          >
            {primaryAction.label.toUpperCase()}
          </Button>
          <p className="text-sm leading-6 text-muted-foreground">{primaryAction.helper}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
        <Card className="overflow-hidden border-none bg-white/74 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
          <CardContent className="space-y-5 p-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Hoje</p>
              <h3 className="font-heading text-2xl font-semibold text-foreground">Resumo rápido</h3>
            </div>

            <div className="space-y-3">
              {[
                { label: "Entrada", value: quickSummary.firstEntry, tone: "bg-[#ecfbff] text-[#007f99]" },
                { label: "Saída", value: quickSummary.lastExit, tone: "bg-[#fff2f8] text-[#d32c82]" },
                { label: "Horas extras", value: quickSummary.overtime, tone: "bg-[#fff8de] text-[#9a7100]" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-[22px] bg-white/78 px-4 py-4">
                  <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                  <span className={cn("rounded-full px-3 py-1 text-sm font-semibold", item.tone)}>{item.value || "—"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none bg-white/74 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
          <CardContent className="space-y-5 p-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Hoje</p>
              <h3 className="font-heading text-2xl font-semibold text-foreground">Sua jornada</h3>
            </div>

            {todayEntries.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-white/70 p-6 text-sm text-muted-foreground">
                Nenhuma marcação hoje ainda.
              </div>
            ) : (
              <div className="space-y-4">
                {todayEntries.map((entry) => {
                  const toneClasses =
                    entry.type === "exit"
                      ? "bg-[#ff4fa3]"
                      : entry.isOvertime
                        ? "bg-[#ffcd38]"
                        : "bg-[#00b8e6]";

                  return (
                    <div key={entry.id} className="flex items-start gap-4">
                      <div className="flex w-8 justify-center pt-1">
                        <span className={cn("h-3.5 w-3.5 rounded-full", toneClasses)} />
                      </div>
                      <div className="min-w-0 flex-1 rounded-[22px] bg-white/78 px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-foreground">
                            {entry.type === "exit"
                              ? entry.isOvertime
                                ? "Saída extra"
                                : "Saída"
                              : entry.isOvertime
                                ? "Entrada extra"
                                : "Entrada"}
                          </p>
                          <p className="font-heading text-xl font-semibold text-foreground">
                            {new Intl.DateTimeFormat("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(entry.timestamp))}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{entry.location.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-[220] bg-slate-950/38 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex min-h-screen items-end justify-center sm:items-center sm:p-6">
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ duration: 0.22 }}
                className={cn(
                  "relative h-[100dvh] w-full overflow-hidden border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.98))] shadow-[0_28px_90px_rgba(10,26,61,0.24)] sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-[32px]",
                  modalStatus === "idle" && "border-white/70",
                  modalStatus === "success" && "border-emerald-400/60 shadow-[0_28px_90px_rgba(16,185,129,0.22)]",
                  modalStatus === "error" && "border-rose-400/60 shadow-[0_28px_90px_rgba(244,63,94,0.20)]",
                )}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-[calc(env(safe-area-inset-top,0px)+12px)] z-20 rounded-full bg-white/92 shadow-[0_14px_34px_rgba(10,26,61,0.12)]"
                  onClick={closeModal}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Fechar modal</span>
                </Button>

                <div className="h-[100dvh] overflow-y-auto sm:max-h-[92vh]">
                  <div className="px-5 pb-2 pt-[calc(env(safe-area-inset-top,0px)+20px)] sm:px-7 sm:pt-8">
                    <p className="text-sm font-medium text-muted-foreground">FC Comunicação Visual</p>
                    <p className="font-heading text-xl font-semibold text-foreground">Registrar ponto</p>
                  </div>

                  {modalStatus === "idle" ? (
                    <div className="space-y-6 px-5 pb-8 pt-2 sm:px-7 sm:pb-7">
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
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {stepMeta.map((item, index) => {
                            const active = currentStepIndex >= index;

                            return (
                              <div
                                key={item.id}
                                className="min-w-[96px] flex-1 rounded-[20px] border border-border/70 bg-white/70 p-3 text-center dark:bg-white/6"
                              >
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
                                <p className="mt-2 text-xs font-medium text-foreground sm:text-sm">{item.label}</p>
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
                              Primeiro validamos sua posição atual. Sem GPS confirmado, o ponto não é enviado.
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
                              A selfie confirma a presença no momento da marcação e fica vinculada à auditoria do evento.
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
                              Revise horário, localização e dispositivo antes de concluir o registro definitivo.
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
