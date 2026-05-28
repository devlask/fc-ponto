"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultSchedule } from "@/lib/constants";

const weekdays = [
  { key: 1, label: "Segunda" },
  { key: 2, label: "Terca" },
  { key: 3, label: "Quarta" },
  { key: 4, label: "Quinta" },
  { key: 5, label: "Sexta" },
];

export function ScheduleSettingsPanel() {
  const [toleranceMinutes, setToleranceMinutes] = useState(defaultSchedule.toleranceMinutes);
  const [radiusMeters, setRadiusMeters] = useState(defaultSchedule.geofence.radiusMeters);

  return (
    <Card className="ink-chip border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Configuracoes dinamicas de jornada</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tolerance">Tolerancia de atraso (min)</Label>
            <Input
              id="tolerance"
              type="number"
              value={toleranceMinutes}
              onChange={(event) => setToleranceMinutes(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="radius">Raio do geofence (m)</Label>
            <Input
              id="radius"
              type="number"
              value={radiusMeters}
              onChange={(event) => setRadiusMeters(Number(event.target.value))}
            />
          </div>
        </div>

        <div className="grid gap-3">
          {weekdays.map((day) => (
            <div key={day.key} className="grid gap-3 rounded-[24px] border border-border bg-white/58 p-4 sm:grid-cols-3 dark:bg-white/6">
              <div>
                <p className="font-medium text-foreground">{day.label}</p>
                <p className="text-xs text-muted-foreground">Horario normal configuravel</p>
              </div>
              <Input value={defaultSchedule.weekdays[day.key].start} readOnly />
              <Input value={defaultSchedule.weekdays[day.key].end} readOnly />
            </div>
          ))}
        </div>

        <Button
          type="button"
          className="w-full rounded-[20px]"
          onClick={() => toast.success("Configuracoes salvas. Conecte ao Supabase para persistir em producao.")}
        >
          Salvar configuracoes
        </Button>
      </CardContent>
    </Card>
  );
}
