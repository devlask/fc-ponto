"use client";

import { useMemo } from "react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminTimeEntryRow } from "@/lib/admin-data";
import { calculateWorkedMinutes } from "@/lib/time";
import { formatMinutes } from "@/lib/utils";

type ReportExportCardProps = {
  entries: AdminTimeEntryRow[];
};

function labelForType(entry: AdminTimeEntryRow) {
  if (entry.type === "entry") return entry.isOvertime ? "Entrada extra" : "Entrada";
  if (entry.type === "exit") return entry.isOvertime ? "Saída extra" : "Saída";
  if (entry.type === "pause") return "Pausa";
  if (entry.type === "return") return "Retorno";
  return "Hora extra";
}

function dayKey(timestamp: string) {
  return new Intl.DateTimeFormat("en-CA").format(new Date(timestamp));
}

function entryDayKey(entry: AdminTimeEntryRow) {
  return entry.businessDate || dayKey(entry.timestamp);
}

export function ReportExportCard({ entries }: ReportExportCardProps) {
  const rows = entries.map((entry) => ({
    Funcionário: entry.employeeName,
    Perfil: entry.role,
    Evento: labelForType(entry),
    Horário: new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(entry.timestamp)),
    Latitude: entry.location.lat,
    Longitude: entry.location.lng,
    Local: entry.location.label,
    "Hora Extra": entry.isOvertime ? "Sim" : "Não",
    Dispositivo: entry.deviceLabel,
    IP: entry.ipAddress,
  }));

  const groupedForPdf = useMemo(() => {
    const employeeMap = new Map<string, { name: string; entries: AdminTimeEntryRow[] }>();

    for (const entry of [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())) {
      const current = employeeMap.get(entry.employeeId) ?? { entries: [], name: entry.employeeName };
      current.entries.push(entry);
      employeeMap.set(entry.employeeId, current);
    }

    return [...employeeMap.values()]
      .map((employee) => ({
        ...employee,
        days: [...employee.entries.reduce((map, entry) => {
          const key = entryDayKey(entry);
          const current = map.get(key) ?? [];
          current.push(entry);
          map.set(key, current);
          return map;
        }, new Map<string, AdminTimeEntryRow[]>()).entries()],
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [entries]);

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");
    XLSX.writeFile(workbook, "fc-comunicacao-visual-registros.xlsx");
    toast.success("Excel exportado.");
  };

  const exportPdf = () => {
    const pdf = new jsPDF();
    let y = 18;
    const pageHeight = pdf.internal.pageSize.getHeight();

    const ensureSpace = (height = 8) => {
      if (y + height > pageHeight - 16) {
        pdf.addPage();
        y = 18;
      }
    };

    pdf.setFontSize(16);
    pdf.text("FC Comunicação Visual - Relatório de Registros", 14, y);
    y += 8;
    pdf.setFontSize(10);
    pdf.text(
      `Gerado em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date())}`,
      14,
      y,
    );
    y += 10;

    groupedForPdf.forEach((employee, employeeIndex) => {
      ensureSpace(14);
      pdf.setFontSize(13);
      pdf.text(employee.name, 14, y);
      y += 6;

      const employeeSummary = calculateWorkedMinutes(employee.entries);
      pdf.setFontSize(10);
      pdf.text(
        `Total trabalhado: ${formatMinutes(employeeSummary.totalMinutes)} • Extras: ${formatMinutes(employeeSummary.overtimeMinutes)} • Registros: ${employee.entries.length}`,
        14,
        y,
      );
      y += 8;

      employee.days
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .forEach(([dateKey, dayEntries]) => {
          ensureSpace(12);
          pdf.setFontSize(11);
          pdf.text(
            new Intl.DateTimeFormat("pt-BR", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }).format(new Date(dateKey)),
            16,
            y,
          );
          y += 6;

          dayEntries.forEach((entry) => {
            ensureSpace(7);
            pdf.setFontSize(10);
            pdf.text(
              `• ${labelForType(entry)} | ${new Intl.DateTimeFormat("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(entry.timestamp))} | ${entry.location.label}`,
              18,
              y,
            );
            y += 5;
          });

          const daySummary = calculateWorkedMinutes(dayEntries);
          ensureSpace(6);
          pdf.text(
            `Total do dia: ${formatMinutes(daySummary.totalMinutes)} • Extras: ${formatMinutes(daySummary.overtimeMinutes)}`,
            18,
            y,
          );
          y += 8;
        });

      if (employeeIndex < groupedForPdf.length - 1) {
        y += 2;
      }
    });

    pdf.save("fc-comunicacao-visual-relatorio.pdf");
    toast.success("PDF exportado com agrupamento por funcionário e dia.");
  };

  return (
    <Card className="ink-chip border-border">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-foreground">Relatórios e exportação</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Exportação real com nome do funcionário, horário, local, dispositivo e indicação de hora extra.
            </p>
          </div>
          <Badge variant="info">{entries.length} registros</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="secondary" className="h-14 rounded-[20px]" onClick={exportPdf}>
            <FileText className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button type="button" variant="secondary" className="h-14 rounded-[20px]" onClick={exportExcel}>
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>

        <div className="space-y-3">
          {entries.slice(0, 6).map((entry) => (
            <div
              key={entry.id}
              className="grid gap-3 rounded-[22px] border border-border bg-white/58 p-4 md:grid-cols-[1.2fr_0.8fr_1fr] dark:bg-white/6"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{entry.employeeName}</p>
                <p className="text-sm text-muted-foreground">{labelForType(entry)}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(entry.timestamp))}
              </div>
              <div className="flex items-center justify-start md:justify-end">
                <Badge variant={entry.isOvertime ? "warning" : "success"}>
                  {entry.isOvertime ? "Hora extra" : "Normal"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
