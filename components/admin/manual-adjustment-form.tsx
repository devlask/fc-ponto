"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ManualAdjustmentFormProps = {
  userId: string;
};

export function ManualAdjustmentForm({ userId }: ManualAdjustmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [recordedAt, setRecordedAt] = useState("");
  const [eventType, setEventType] = useState<"entry" | "exit">("entry");
  const [reason, setReason] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [note, setNote] = useState("");

  const submit = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/time-entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventType,
          reason,
          recordedAt,
          latitude,
          longitude,
          note,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Falha ao registrar ajuste.");
      }

      toast.success("Ajuste manual registrado.");
      setRecordedAt("");
      setReason("");
      setEventType("entry");
      setLatitude("");
      setLongitude("");
      setNote("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar o ajuste.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="ink-chip border-border">
      <CardHeader className="space-y-2">
        <CardTitle className="text-foreground">Editar hora</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Ajuste simples para corrigir entrada ou saída com observação administrativa.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="recordedAt">Data e hora</Label>
            <Input id="recordedAt" type="datetime-local" value={recordedAt} onChange={(event) => setRecordedAt(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventType">Tipo</Label>
            <select
              id="eventType"
              value={eventType}
              onChange={(event) => setEventType(event.target.value as "entry" | "exit")}
              className="h-12 w-full rounded-2xl border border-border bg-white/80 px-4 py-2 text-sm text-foreground outline-none dark:bg-white/6"
            >
              <option value="entry">Entrada</option>
              <option value="exit">Saída</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reason">Motivo</Label>
          <Input id="reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ex.: ajuste manual aprovado pelo RH" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude opcional</Label>
            <Input id="latitude" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="-3.08222" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude opcional</Label>
            <Input id="longitude" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="-60.06015" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">Observação opcional</Label>
          <Input id="note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Complemento para auditoria" />
        </div>
        <Button
          type="button"
          className="w-full rounded-[20px]"
          disabled={loading || !recordedAt || !reason.trim()}
          onClick={() => void submit()}
        >
          {loading ? "Salvando ajuste..." : "Salvar ajuste"}
        </Button>
      </CardContent>
    </Card>
  );
}
