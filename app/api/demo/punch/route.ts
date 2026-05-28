import { NextResponse } from "next/server";
import { classifyEntryTimestamp } from "@/lib/time";

const labels = {
  entry: "Entrada",
  pause: "Pausa",
  return: "Retorno",
  exit: "Saida",
  overtime: "Hora extra",
};

export async function POST(request: Request) {
  const body = await request.json();
  const timestamp = new Date().toISOString();

  return NextResponse.json({
    ok: true,
    label: labels[body.type as keyof typeof labels] ?? "Registro",
    classification: classifyEntryTimestamp(timestamp) ? "hora extra" : "horario normal",
    timestamp,
  });
}
