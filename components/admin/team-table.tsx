"use client";

import { useState } from "react";
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

type TeamTableProps = {
  members: AdminTeamMember[];
};

export function TeamTable({ members: initialMembers }: TeamTableProps) {
  const [members, setMembers] = useState(initialMembers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

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
        <div className="space-y-3">
          {members.map((member) => {
            const isEditing = editingId === member.id;

            return (
              <div
                key={member.id}
                className="grid gap-3 rounded-[24px] border border-border bg-white/58 p-4 md:grid-cols-[1.35fr_0.9fr_0.9fr_auto] dark:bg-white/6"
              >
                <div className="space-y-2">
                  {isEditing ? (
                    <Input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{member.fullName}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{labelForRole(member.role)}</p>
                  <Badge variant={badgeVariant(member.status)}>{member.status}</Badge>
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
        </div>
      </CardContent>
    </Card>
  );
}
