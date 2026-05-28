import { calculateWorkedMinutes } from "@/lib/time";
import type { ActiveWorker, EditRequest, TimeEntry, UserRole } from "@/types";
import { formatMinutes } from "@/lib/utils";

export const employeeEntries: TimeEntry[] = [
  {
    id: "te-001",
    employeeId: "usr-01",
    employeeName: "Marina Costa",
    type: "entry",
    timestamp: "2026-05-15T08:00:00-03:00",
    location: { lat: -23.55052, lng: -46.633308, accuracy: 9, label: "Sede FC" },
    isOvertime: false,
    ipAddress: "177.54.20.18",
    deviceLabel: "iPhone 15 Pro / Safari",
  },
  {
    id: "te-002",
    employeeId: "usr-01",
    employeeName: "Marina Costa",
    type: "pause",
    timestamp: "2026-05-15T12:02:00-03:00",
    location: { lat: -23.55038, lng: -46.63312, accuracy: 11, label: "Sede FC" },
    isOvertime: false,
    ipAddress: "177.54.20.18",
    deviceLabel: "iPhone 15 Pro / Safari",
  },
  {
    id: "te-003",
    employeeId: "usr-01",
    employeeName: "Marina Costa",
    type: "return",
    timestamp: "2026-05-15T13:05:00-03:00",
    location: { lat: -23.55056, lng: -46.6334, accuracy: 12, label: "Sede FC" },
    isOvertime: false,
    ipAddress: "177.54.20.18",
    deviceLabel: "iPhone 15 Pro / Safari",
  },
  {
    id: "te-004",
    employeeId: "usr-01",
    employeeName: "Marina Costa",
    type: "exit",
    timestamp: "2026-05-15T18:00:00-03:00",
    location: { lat: -23.55058, lng: -46.63345, accuracy: 10, label: "Sede FC" },
    isOvertime: false,
    ipAddress: "177.54.20.18",
    deviceLabel: "iPhone 15 Pro / Safari",
  },
  {
    id: "te-005",
    employeeId: "usr-01",
    employeeName: "Marina Costa",
    type: "overtime",
    timestamp: "2026-05-15T22:00:00-03:00",
    location: { lat: -23.5521, lng: -46.6328, accuracy: 18, label: "Instalacao externa" },
    isOvertime: true,
    ipAddress: "177.54.20.18",
    deviceLabel: "iPhone 15 Pro / Safari",
  },
  {
    id: "te-006",
    employeeId: "usr-01",
    employeeName: "Marina Costa",
    type: "exit",
    timestamp: "2026-05-15T23:32:00-03:00",
    location: { lat: -23.55244, lng: -46.63254, accuracy: 16, label: "Instalacao externa" },
    isOvertime: true,
    ipAddress: "177.54.20.18",
    deviceLabel: "iPhone 15 Pro / Safari",
  },
];

export const timeSummary = calculateWorkedMinutes(employeeEntries);

export const dashboardCards = [
  {
    label: "Ativos agora",
    value: "18",
    description: "Funcionarios em jornada no geofence principal e em campo.",
  },
  {
    label: "Horas extras",
    value: "12.4h",
    description: "Acumulado do dia detectado automaticamente pelas regras configuradas.",
  },
  {
    label: "Solicitacoes",
    value: "07",
    description: "Alteracoes pendentes de validacao pela gerencia.",
  },
  {
    label: "Conformidade",
    value: "98%",
    description: "Registros com GPS, selfie e dispositivo validados.",
  },
];

export const realtimeHighlights = [
  {
    title: "Tempo medio de resposta",
    value: "2m 18s",
    description: "Tempo para aprovacao de excecoes urgentes.",
  },
  {
    title: "Ultimo sync",
    value: "agora",
    description: "Atualizado via Supabase Realtime e cache local.",
  },
  {
    title: "Offline pendentes",
    value: "03",
    description: "Registros aguardando envio quando a rede estabilizar.",
  },
];

export const editRequests: EditRequest[] = [
  {
    id: "req-001",
    employeeName: "Marina Costa",
    requestedAt: "2026-05-15T14:12:00-03:00",
    date: "2026-05-14",
    reason: "Falha de sinal durante o retorno do almoco.",
    status: "pending",
    requestedTime: "13:00",
  },
  {
    id: "req-002",
    employeeName: "Diego Nunes",
    requestedAt: "2026-05-15T09:41:00-03:00",
    date: "2026-05-15",
    reason: "Entrada registrada em obra antes de cruzar o geofence.",
    status: "approved",
    requestedTime: "07:56",
  },
  {
    id: "req-003",
    employeeName: "Paula Reis",
    requestedAt: "2026-05-15T10:18:00-03:00",
    date: "2026-05-13",
    reason: "Selfie sem foco, solicitando substituicao do registro.",
    status: "rejected",
    requestedTime: "18:08",
  },
];

export const activeWorkers: ActiveWorker[] = [
  {
    id: "act-001",
    name: "Marina Costa",
    team: "Instalacao",
    status: "overtime",
    lastEvent: "Retorno em hora extra as 22:00",
    location: { lat: -23.5521, lng: -46.6328, accuracy: 18, label: "Instalacao externa" },
  },
  {
    id: "act-002",
    name: "Diego Nunes",
    team: "Producao",
    status: "working",
    lastEvent: "Entrada as 08:02",
    location: { lat: -23.5502, lng: -46.6335, accuracy: 8, label: "Galpao FC" },
  },
  {
    id: "act-003",
    name: "Paula Reis",
    team: "Atendimento",
    status: "paused",
    lastEvent: "Pausa as 15:08",
    location: { lat: -23.5499, lng: -46.6341, accuracy: 13, label: "Sede FC" },
  },
];

export const teamMembers = [
  { id: "usr-01", name: "Marina Costa", role: "employee" as UserRole, team: "Instalacao", status: "overtime" },
  { id: "usr-02", name: "Diego Nunes", role: "employee" as UserRole, team: "Producao", status: "working" },
  { id: "usr-03", name: "Paula Reis", role: "employee" as UserRole, team: "Atendimento", status: "paused" },
  { id: "usr-04", name: "Rafael Gomes", role: "manager" as UserRole, team: "Operacoes", status: "working" },
  { id: "usr-05", name: "Camila Faria", role: "admin" as UserRole, team: "People Ops", status: "off" },
];

export const employeeStatusCards = [
  { label: "Horas normais", value: formatMinutes(timeSummary.normalMinutes) },
  { label: "Horas extras", value: formatMinutes(timeSummary.overtimeMinutes) },
  { label: "Total do dia", value: formatMinutes(timeSummary.totalMinutes) },
];
