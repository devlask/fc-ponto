import type { WorkScheduleSettings } from "@/types";

export const employeeNavItems = [
  { href: "/employee", label: "Ponto" },
  { href: "/employee/history", label: "Historico" },
  { href: "/employee/requests", label: "Solicitacoes" },
  { href: "/profile", label: "Perfil" },
];

export const adminNavItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/approvals", label: "Aprovacoes" },
  { href: "/admin/team", label: "Equipe" },
  { href: "/admin/settings", label: "Jornada" },
];

export const defaultSchedule: WorkScheduleSettings = {
  timezone: "America/Sao_Paulo",
  toleranceMinutes: 10,
  overtimeGraceMinutes: 0,
  geofence: {
    enabled: true,
    radiusMeters: 180,
    center: {
      lat: -23.55052,
      lng: -46.633308,
      accuracy: 12,
      label: "Sede FC Comunicacao Visual",
    },
  },
  weekdays: {
    0: { enabled: false, start: "00:00", end: "00:00" },
    1: { enabled: true, start: "08:00", end: "18:00" },
    2: { enabled: true, start: "08:00", end: "18:00" },
    3: { enabled: true, start: "08:00", end: "18:00" },
    4: { enabled: true, start: "08:00", end: "18:00" },
    5: { enabled: true, start: "08:00", end: "17:00" },
    6: { enabled: false, start: "00:00", end: "00:00" },
  },
};
