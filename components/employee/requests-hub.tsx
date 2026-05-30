"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Clock3, MessageSquareMore } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EditRequest, EntryType } from "@/types";

type RequestKind = "adjust" | "overtime" | "justification";

type RequestsHubProps = {
  initialRequests: EditRequest[];
};

function badgeForStatus(status: EditRequest["status"]) {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  return "warning";
}

function requestCopy(kind: RequestKind) {
  if (kind === "overtime") {
    return {
      description: "Registrar ou justificar um período de hora extra.",
      label: "Hora extra",
      reasonPrefix: "[Hora extra] ",
    };
  }

  if (kind === "justification") {
    return {
      description: "Justificar uma divergência de ponto ou ausência de registro.",
      label: "Justificativa",
      reasonPrefix: "[Justificativa] ",
    };
  }

  return {
    description: "Corrigir o horário de uma entrada ou saída.",
    label: "Ajustar horário",
    reasonPrefix: "[Ajuste de horário] ",
  };
}

function getRequestHeadline(request: EditRequest) {
  if (request.kind === "overtime") {
    return "Hora extra";
  }

  if (request.kind === "justification") {
    return "Justificativa";
  }

  return "Ajuste de horário";
}

export function RequestsHub({ initialRequests }: RequestsHubProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [kind, setKind] = useState<RequestKind>("adjust");
  const [date, setDate] = useState("");
  const [requestedTime, setRequestedTime] = useState("");
  const [eventType, setEventType] = useState<EntryType>("entry");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const copy = useMemo(() => requestCopy(kind), [kind]);

  const submit = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/employee/edit-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          requestedEventType: eventType,
          requestedTime,
          reason: `${copy.reasonPrefix}${reason}`,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; request?: EditRequest } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Falha ao enviar solicitação.");
      }

      const createdRequest = payload?.request;
      if (createdRequest) {
        setRequests((current) => [createdRequest, ...current]);
      }
      setDate("");
      setRequestedTime("");
      setReason("");
      setEventType("entry");
      toast.success("Solicitação enviada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a solicitação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white/76 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
        <CardContent className="space-y-5 p-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Nova solicitação</p>
            <h2 className="mt-1 font-heading text-3xl font-semibold text-foreground">O que deseja solicitar?</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              { key: "adjust", label: "Ajustar horário", color: "bg-[#eef8ff]", icon: Clock3 },
              { key: "overtime", label: "Hora extra", color: "bg-[#fff8df]", icon: AlertCircle },
              { key: "justification", label: "Justificativa", color: "bg-[#fff2f8]", icon: MessageSquareMore },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={`rounded-[24px] border p-4 text-left transition-all ${item.color} ${
                  kind === item.key ? "border-primary shadow-[0_10px_24px_rgba(0,194,232,0.12)]" : "border-border"
                }`}
                onClick={() => setKind(item.key as RequestKind)}
              >
                <item.icon className="h-5 w-5 text-foreground" />
                <p className="mt-3 font-medium text-foreground">{item.label}</p>
                <p className="mt-2 text-sm text-muted-foreground">{requestCopy(item.key as RequestKind).description}</p>
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestedTime">Horário correto</Label>
              <Input id="requestedTime" type="time" value={requestedTime} onChange={(event) => setRequestedTime(event.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventType">Marcação</Label>
            <div className="flex gap-2">
              {[
                { key: "entry", label: "Entrada" },
                { key: "exit", label: "Saída" },
              ].map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  variant={eventType === item.key ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setEventType(item.key as EntryType)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea
              id="reason"
              placeholder="Descreva o contexto da solicitação."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>

          <Button className="h-14 w-full rounded-[22px]" disabled={loading || !date || !requestedTime || reason.trim().length < 6} onClick={() => void submit()}>
            {loading ? "Enviando..." : `Enviar ${copy.label.toLowerCase()}`}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Minhas solicitações</p>
          <h3 className="mt-1 font-heading text-2xl font-semibold text-foreground">Acompanhe o status</h3>
        </div>

        {requests.length === 0 ? (
          <Card className="border-none bg-white/76 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
            <CardContent className="p-6 text-sm text-muted-foreground">Nenhuma solicitação enviada ainda.</CardContent>
          </Card>
        ) : (
          requests.map((request) => (
              <Card key={request.id} className="border-none bg-white/76 shadow-[0_16px_36px_rgba(35,31,32,0.05)]">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-3">
                  <Badge variant={badgeForStatus(request.status)}>
                    {request.status === "pending" ? "Em análise" : request.status === "approved" ? "Aprovado" : "Recusado"}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(request.requestedAt))}
                  </p>
                  </div>

                  <div>
                    <p className="font-medium text-foreground">{getRequestHeadline(request)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {(request.requestedEventType === "exit" ? "Saída" : "Entrada")} • {request.date}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {request.requestedEventType === "exit" ? "Saída" : "Entrada"} {request.requestedTime}
                    </p>
                  </div>

                  <p className="text-sm leading-6 text-muted-foreground">{request.reason}</p>

                {request.reviewNotes ? (
                  <div className="rounded-[18px] bg-muted px-4 py-3 text-sm text-muted-foreground">
                    {request.reviewNotes}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
