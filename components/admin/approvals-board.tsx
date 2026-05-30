"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AdminEditRequest } from "@/lib/admin-data";

type ApprovalsBoardProps = {
  requests: AdminEditRequest[];
};

function badgeVariant(status: AdminEditRequest["status"]) {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  return "warning";
}

function statusLabel(status: AdminEditRequest["status"]) {
  if (status === "approved") return "Aprovado";
  if (status === "rejected") return "Recusado";
  return "Em análise";
}

function eventLabel(type: AdminEditRequest["requestedEventType"]) {
  return type === "exit" ? "Saída" : "Entrada";
}

export function ApprovalsBoard({ requests: initialRequests }: ApprovalsBoardProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminEditRequest["status"]>("all");

  const filteredRequests = useMemo(
    () =>
      requests.filter((request) => {
        const matchesStatus = statusFilter === "all" || request.status === statusFilter;
        const searchable = `${request.requesterName} ${request.requesterEmail} ${request.reason}`.toLowerCase();
        const matchesQuery = searchable.includes(query.trim().toLowerCase());
        return matchesStatus && matchesQuery;
      }),
    [query, requests, statusFilter],
  );

  const review = async (id: string, status: "approved" | "rejected") => {
    setLoadingId(id);

    try {
      const response = await fetch(`/api/admin/edit-requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Falha na revisão.");
      }

      setRequests((current) => current.map((request) => (request.id === id ? { ...request, status } : request)));
      toast.success(status === "approved" ? "Solicitação aprovada com sucesso." : "Solicitação recusada com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível revisar a solicitação.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card className="ink-chip border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Aprovações de alteração de ponto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, e-mail ou motivo"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | AdminEditRequest["status"])}
            className="h-11 w-full rounded-[18px] border border-border bg-background px-3 text-sm text-foreground outline-none"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Em análise</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Recusados</option>
          </select>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-border bg-white/60 p-6 text-sm text-muted-foreground dark:bg-white/6">
            Nenhuma solicitação encontrada com esses filtros.
          </div>
        ) : null}

        {filteredRequests.map((request) => (
          <div key={request.id} className="rounded-[24px] border border-border bg-white/58 p-4 dark:bg-white/6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{request.requesterName}</p>
                <p className="text-sm text-muted-foreground">
                  {request.requestedDate} • {request.requestedTime} • {eventLabel(request.requestedEventType)}
                </p>
              </div>
              <Badge variant={badgeVariant(request.status)}>{statusLabel(request.status)}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{request.reason}</p>
            <p className="mt-2 text-xs text-muted-foreground">{request.requesterEmail}</p>
            {request.reviewNotes ? (
              <p className="mt-2 text-xs text-muted-foreground">Observação: {request.reviewNotes}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                className="rounded-[20px]"
                disabled={loadingId === request.id || request.status === "approved"}
                onClick={() => void review(request.id, "approved")}
              >
                Aprovar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-[20px]"
                disabled={loadingId === request.id || request.status === "rejected"}
                onClick={() => void review(request.id, "rejected")}
              >
                Rejeitar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
