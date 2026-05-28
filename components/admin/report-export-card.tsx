"use client";

import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { employeeEntries } from "@/lib/mock-data";

export function ReportExportCard() {
  const rows = employeeEntries.map((entry) => ({
    Funcionario: entry.employeeName,
    Evento: entry.type,
    Horario: entry.timestamp,
    Latitude: entry.location.lat,
    Longitude: entry.location.lng,
    HoraExtra: entry.isOvertime ? "Sim" : "Nao",
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
    pdf.text("FC Comunicacao Visual - Relatorio de Registros", 14, 18);
    pdf.setFontSize(11);
    rows.slice(0, 8).forEach((row, index) => {
      pdf.text(
        `${row.Funcionario} | ${row.Evento} | ${row.Horario} | HE: ${row.HoraExtra}`,
        14,
        32 + index * 8,
      );
    });
    pdf.save("fc-comunicacao-visual-relatorio.pdf");
    toast.success("PDF exportado.");
  };

  return (
    <Card className="ink-chip border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Relatorios e exportacao</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Button type="button" variant="secondary" className="h-14 rounded-[20px]" onClick={exportPdf}>
          <FileText className="h-4 w-4" />
          Exportar PDF
        </Button>
        <Button type="button" variant="secondary" className="h-14 rounded-[20px]" onClick={exportExcel}>
          <FileSpreadsheet className="h-4 w-4" />
          Exportar Excel
        </Button>
      </CardContent>
    </Card>
  );
}
