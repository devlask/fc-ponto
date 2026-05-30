"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InviteUserFormProps = {
  canSetAdmin?: boolean;
};

export function InviteUserForm({ canSetAdmin = false }: InviteUserFormProps) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"employee" | "manager" | "admin">("employee");

  const invite = async () => {
    if (!fullName.trim()) {
      toast.error("Informe o nome completo do usuário.");
      return;
    }

    if (!email.trim()) {
      toast.error("Informe um e-mail válido para enviar o convite.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          fullName,
          role,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; ok?: boolean } | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Falha ao enviar convite.");
      }

      toast.success("Convite enviado. O usuário receberá um e-mail para criar a senha.");
      setFullName("");
      setEmail("");
      setRole("employee");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível convidar o usuário.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="ink-chip border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Adicionar usuário</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Perfil de acesso</Label>
          <select
            id="role"
            value={role}
            onChange={(event) => setRole(event.target.value as "employee" | "manager" | "admin")}
            className="h-11 w-full rounded-[18px] border border-border bg-background px-3 text-sm text-foreground outline-none"
          >
            <option value="employee">Funcionário</option>
            <option value="manager">Gerente</option>
            {canSetAdmin ? <option value="admin">Admin</option> : null}
          </select>
        </div>

        <div className="rounded-[22px] border border-border bg-white/68 p-4 text-sm leading-6 text-muted-foreground dark:bg-white/6">
          O Supabase enviará um convite para o e-mail informado. A própria pessoa define a senha e ativa o acesso.
        </div>

        <Button
          type="button"
          className="w-full rounded-[20px]"
          disabled={loading || !fullName.trim() || !email.trim()}
          onClick={() => void invite()}
        >
          {loading ? "Enviando convite..." : "Enviar convite"}
        </Button>
      </CardContent>
    </Card>
  );
}
