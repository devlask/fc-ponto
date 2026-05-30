"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AdminTeamMember } from "@/lib/admin-data";

function badgeVariant(status: AdminTeamMember["status"]) {
  if (status === "working") return "success";
  if (status === "paused") return "info";
  if (status === "overtime") return "warning";
  return "default";
}

function labelForRole(role: AdminTeamMember["role"]) {
  if (role === "admin") return "Admin";
  if (role === "manager") return "Gerente";
  return "Funcionário";
}

function labelForStatus(status: AdminTeamMember["status"]) {
  if (status === "working") return "Trabalhando";
  if (status === "paused") return "Em pausa";
  if (status === "overtime") return "Hora extra";
  return "Fora";
}

type TeamTableProps = {
  members: AdminTeamMember[];
};

export function TeamTable({ members: initialMembers }: TeamTableProps) {
  const [members, setMembers] = useState(initialMembers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminTeamMember["status"]>("all");

  const filteredMembers = useMemo(
    () =>
      members.filter((member) => {
        const matchesStatus = statusFilter === "all" || member.status === statusFilter;
        const searchable = `${member.fullName} ${member.email} ${member.lastEvent}`.toLowerCase();
        const matchesQuery = searchable.includes(query.trim().toLowerCase());
        return matchesStatus && matchesQuery;
      }),
    [members, query, statusFilter],
  );

  const startEdit = (member: AdminTeamMember) => {
    setEditingId(member.id);
    setNameDraft(member.fullName);
  };

  const saveName = async (memberId: string) => {
    setSavingId(memberId);

    try {
      const response = await fetch(`/api/admin/users/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName: nameDraft }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Falha ao atualizar nome.");
      }

      setMembers((current) =>
        current.map((member) => (member.id === memberId ? { ...member, fullName: nameDraft.trim() } : member)),
      );
      setEditingId(null);
      setNameDraft("");
      toast.success("Nome atualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o nome.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Card className="ink-chip border-border">
      <CardHeader className="space-y-2">
        <CardTitle className="text-foreground">Gestão de funcionários</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Cards leves para acessar a ficha, ajustar o nome e seguir o ritmo da operação sem cara de sistema pesado.
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, e-mail ou evento"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | AdminTeamMember["status"])}
            className="h-11 w-full rounded-[18px] border border-border bg-background px-3 text-sm text-foreground outline-none"
          >
            <option value="all">Todos os status</option>
            <option value="working">Trabalhando</option>
            <option value="overtime">Hora extra</option>
            <option value="paused">Em pausa</option>
            <option value="off">Fora</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredMembers.map((member) => {
            const isEditing = editingId === member.id;

            return (
              <div
                key={member.id}
                className="grid gap-4 rounded-[24px] border border-border bg-white/58 p-4 md:grid-cols-[1.15fr_0.9fr_1fr_auto] dark:bg-white/6"
              >
                <div className="space-y-2">
                  {isEditing ? (
                    <Input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{member.fullName}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  <p className="text-sm font-medium text-foreground">{member.lastEvent}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{labelForRole(member.role)}</p>
                  <Badge variant={badgeVariant(member.status)}>{labelForStatus(member.status)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(member.createdAt))}
                </p>
                <div className="flex flex-wrap items-start justify-end gap-2">
                  <Button type="button" size="sm" variant="ghost" className="rounded-xl" asChild>
                    <Link href={`/admin/team/${member.id}`}>Ver ficha</Link>
                  </Button>
                  {isEditing ? (
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl"
                      disabled={savingId === member.id || !nameDraft.trim()}
                      onClick={() => void saveName(member.id)}
                    >
                      <Save className="h-3.5 w-3.5" />
                      Salvar
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => startEdit(member)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar nome
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {filteredMembers.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-border bg-white/58 p-4 text-sm text-muted-foreground dark:bg-white/6">
              Nenhum funcionário encontrado com esses filtros.
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
