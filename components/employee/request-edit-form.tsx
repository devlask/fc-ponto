"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const requestSchema = z.object({
  date: z.string().min(1, "Informe a data"),
  requestedTime: z.string().min(1, "Informe o horario"),
  reason: z.string().min(10, "Descreva o motivo com mais contexto"),
});

type RequestFormValues = z.infer<typeof requestSchema>;

export function RequestEditForm() {
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      date: "",
      requestedTime: "",
      reason: "",
    },
  });

  const onSubmit = (values: RequestFormValues) => {
    toast.success(`Solicitacao enviada para ${values.date} as ${values.requestedTime}.`);
    form.reset();
  };

  return (
    <Card className="ink-chip border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Solicitar alteracao</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" {...form.register("date")} />
              <p className="text-xs text-danger">{form.formState.errors.date?.message}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestedTime">Horario correto</Label>
              <Input id="requestedTime" type="time" {...form.register("requestedTime")} />
              <p className="text-xs text-danger">{form.formState.errors.requestedTime?.message}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea id="reason" placeholder="Explique o contexto do ajuste solicitado." {...form.register("reason")} />
            <p className="text-xs text-danger">{form.formState.errors.reason?.message}</p>
          </div>
          <Button type="submit" className="w-full rounded-[20px]">
            Enviar solicitacao
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
