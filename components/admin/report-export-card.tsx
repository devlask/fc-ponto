"use client";

import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminTimeEntryRow } from "@/lib/admin-data";

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

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");
    XLSX.writeFile(workbook, "fc-comunicacao-visual-registros.xlsx");
    toast.success("Excel exportado.");
  };

  const exportPdf = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text("FC Comunicação Visual - Relatório de Registros", 14, 18);
    pdf.setFontSize(11);
    rows.slice(0, 12).forEach((row, index) => {
      pdf.text(
        `${row["Funcionário"]} | ${row.Evento} | ${row.Horário} | ${row["Hora Extra"]}`,
        14,
        32 + index * 8,
      );
    });
    pdf.save("fc-comunicacao-visual-relatorio.pdf");
    toast.success("PDF exportado.");
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
