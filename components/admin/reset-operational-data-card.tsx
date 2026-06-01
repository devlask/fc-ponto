"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, LoaderCircle, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ResetCounts = {
  auditLogs: number;
  editRequests: number;
  overtimeEntries: number;
  storageObjects: number;
  timeEntries: number;
};

const confirmationWord = "ZERAR";

export function ResetOperationalDataCard() {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmationValue, setConfirmationValue] = useState("");
  const [isRefreshing, startRefresh] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isConfirmed = confirmationValue.trim().toUpperCase() === confirmationWord;

  const handleReset = async () => {
    if (!isConfirmed) {
      toast.error(`Digite ${confirmationWord} para confirmar o reset.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/reset-operational-data", {
        method: "POST",
      });

      const payload = (await response.json().catch(() => null)) as
        | { counts?: ResetCounts; error?: string; ok?: boolean }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Não foi possível resetar os dados operacionais.");
      }

      const counts = payload.counts;
      toast.success(
        counts
          ? `Reset concluído. ${counts.timeEntries} registros, ${counts.overtimeEntries} horas extras e ${counts.editRequests} solicitações removidos.`
          : "Reset concluído com sucesso.",
      );

      setConfirmationValue("");
      setConfirmOpen(false);
      startRefresh(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao resetar os dados operacionais.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-none bg-white/76 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Reset operacional</p>
            <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">Zerar dados de teste</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Remove marcações, horas extras, solicitações e selfies de teste. Usuários, perfis, jornada e avatars são preservados.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-[20px]"
            onClick={() => setConfirmOpen((value) => !value)}
          >
            <RotateCcw className="h-4 w-4" />
            Resetar
          </Button>
        </div>

        {confirmOpen ? (
          <div className="space-y-4 rounded-[24px] border border-rose-200 bg-rose-50/80 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-rose-100 p-2 text-rose-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-rose-900">Ação irreversível</p>
                <p className="text-sm leading-6 text-rose-800">
                  Para confirmar, digite <span className="font-semibold">{confirmationWord}</span>. Esse reset limpa o histórico operacional atual para iniciar o uso oficial do app.
                </p>
              </div>
            </div>

            <Input
              value={confirmationValue}
              onChange={(event) => setConfirmationValue(event.target.value)}
              placeholder={`Digite ${confirmationWord}`}
              className="h-12 rounded-[18px] border-rose-200 bg-white"
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-[18px]"
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmationValue("");
                }}
                disabled={isSubmitting || isRefreshing}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="rounded-[18px] bg-rose-600 text-white hover:bg-rose-700"
                onClick={handleReset}
                disabled={!isConfirmed || isSubmitting || isRefreshing}
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Resetando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Confirmar reset
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
