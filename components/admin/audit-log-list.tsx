"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AdminAuditLog } from "@/lib/admin-data";

type AuditLogListProps = {
  logs: AdminAuditLog[];
};

type FilterKey = "all" | "invites" | "approvals" | "adjustments" | "users";

function targetLabel(targetTable: string) {
  if (targetTable === "users") return "usuário";
  if (targetTable === "edit_requests") return "solicitação";
  if (targetTable === "time_entries") return "registro de ponto";
  if (targetTable === "work_schedule_settings") return "configuração de jornada";
  if (targetTable === "overtime_entries") return "hora extra";
  return targetTable;
}

function describeLog(log: AdminAuditLog) {
  const after = log.afterData ?? {};
  const before = log.beforeData ?? {};

  if (log.action === "admin_convidou_usuario") {
    return {
      detail: `Convidou ${String(after.full_name ?? "usuário")} para ${String(after.email ?? "e-mail não informado")}.`,
      title: "Convite enviado",
    };
  }

  if (log.action === "admin_editou_usuario") {
    return {
      detail: `Alterou o nome de ${String(before.full_name ?? "usuário")} para ${String(after.full_name ?? "usuário")}.`,
      title: "Cadastro editado",
    };
  }

  if (log.action === "admin_lancou_ajuste_manual") {
    return {
      detail: `${String(after.event_type === "exit" ? "Saída" : "Entrada")} manual em ${new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(String(after.recorded_at ?? log.createdAt)))}`,
      title: "Ajuste manual lançado",
    };
  }

  if (log.action === "admin_aprovou_solicitacao") {
    return {
      detail: "A solicitação foi aprovada e marcada como concluída.",
      title: "Solicitação aprovada",
    };
  }

  if (log.action === "admin_recusou_solicitacao") {
    return {
      detail: "A solicitação foi recusada pelo administrador.",
      title: "Solicitação recusada",
    };
  }

  if (log.targetTable === "edit_requests" && log.action === "update") {
    const nextStatus = String(after.status ?? "");
    const previousStatus = String(before.status ?? "");

    if (previousStatus !== nextStatus && nextStatus === "approved") {
      return {
        detail: "A solicitação foi aprovada.",
        title: "Solicitação aprovada",
      };
    }

    if (previousStatus !== nextStatus && nextStatus === "rejected") {
      return {
        detail: "A solicitação foi recusada.",
        title: "Solicitação recusada",
      };
    }
  }

  if (log.targetTable === "time_entries" && log.action === "insert" && after.is_manual === true) {
    return {
      detail: "Um ajuste manual foi incluído no histórico de ponto.",
      title: "Ajuste manual registrado",
    };
  }

  if (log.targetTable === "users" && log.action === "update") {
    return {
      detail: "Dados cadastrais do usuário foram atualizados.",
      title: "Usuário atualizado",
    };
  }

  if (log.targetTable === "users" && log.action === "insert") {
    return {
      detail: "Novo usuário criado no sistema.",
      title: "Usuário criado",
    };
  }

  return {
    detail: `${log.action} em ${targetLabel(log.targetTable)}.`,
    title: "Ação registrada",
  };
}

export function AuditLogList({ logs }: AuditLogListProps) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const filteredLogs = useMemo(() => {
    if (filter === "invites") {
      return logs.filter((log) => log.action === "admin_convidou_usuario");
    }

    if (filter === "approvals") {
      return logs.filter((log) => log.action === "admin_aprovou_solicitacao" || log.action === "admin_recusou_solicitacao");
    }

    if (filter === "adjustments") {
      return logs.filter((log) => log.action === "admin_lancou_ajuste_manual" || (log.targetTable === "time_entries" && log.action === "insert"));
    }

    if (filter === "users") {
      return logs.filter((log) => log.action === "admin_editou_usuario" || (log.targetTable === "users" && log.action === "update"));
    }

    return logs;
  }, [filter, logs]);

  return (
    <Card className="ink-chip border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Logs de auditoria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "Tudo" },
            { key: "invites", label: "Convites" },
            { key: "approvals", label: "Aprovações" },
            { key: "adjustments", label: "Ajustes" },
            { key: "users", label: "Usuários" },
          ].map((item) => (
            <Button
              key={item.key}
              type="button"
              size="sm"
              variant={filter === item.key ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setFilter(item.key as FilterKey)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        {filteredLogs.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-border bg-white/60 p-6 text-sm text-muted-foreground dark:bg-white/6">
            Nenhum log encontrado.
          </div>
        ) : null}
        {filteredLogs.map((log) => (
          <div key={log.id} className="rounded-[22px] border border-border bg-white/58 p-4 dark:bg-white/6">
            {(() => {
              const description = describeLog(log);

              return (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{description.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{log.actorName}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(log.createdAt))}
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{description.detail}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {targetLabel(log.targetTable)}
                  </p>
                  {log.targetId ? <p className="mt-1 text-xs text-muted-foreground">ID: {log.targetId}</p> : null}
                </>
              );
            })()}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
