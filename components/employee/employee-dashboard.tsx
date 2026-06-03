"use client";

import { useEffect, useState } from "react";
import { PunchPanel } from "@/components/employee/punch-panel";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { EmployeePrimaryAction, EmployeeQuickSummary } from "@/lib/employee-time";
import type { TimeEntry, WorkState } from "@/types";

type EmployeeDashboardProps = {
  currentState: WorkState;
  employeeName: string;
  greeting: string;
  primaryAction: EmployeePrimaryAction;
  quickSummary: EmployeeQuickSummary;
  businessDate: string;
  timeZone: string;
  todayEntries: TimeEntry[];
  userId: string;
};

function mapGeofenceLabel(status: string | null | undefined) {
  if (status === "outside") return "Fora do geofence";
  if (status === "unknown") return "Geofence indisponível";
  return "Dentro do geofence";
}

function getStoredAddressLabel(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const addressLabel = (metadata as Record<string, unknown>).addressLabel;
  return typeof addressLabel === "string" && addressLabel.trim() ? addressLabel.trim() : null;
}

export function EmployeeDashboard({
  currentState,
  employeeName,
  greeting,
  primaryAction,
  quickSummary,
  businessDate,
  timeZone,
  todayEntries: initialTodayEntries,
  userId,
}: EmployeeDashboardProps) {
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>(initialTodayEntries);

  useEffect(() => {
    setTodayEntries(initialTodayEntries);
  }, [initialTodayEntries]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    let active = true;

    const syncTodayEntries = async () => {
      const { data } = await supabase
        .from("time_entries")
        .select(
          "id, event_type, recorded_at, business_date, pairing_group, latitude, longitude, accuracy_meters, geofence_status, ip_address, device_label, is_overtime, metadata",
        )
        .eq("user_id", userId)
        .eq("business_date", businessDate)
        .order("recorded_at", { ascending: true });

      if (!active || !data) {
        return;
      }

      setTodayEntries(
        data.map((row) => ({
          id: String(row.id),
          employeeId: userId,
          employeeName,
          type: String(row.event_type) as TimeEntry["type"],
          timestamp: String(row.recorded_at),
          businessDate: typeof row.business_date === "string" ? row.business_date : null,
          pairingGroup: typeof row.pairing_group === "string" ? row.pairing_group : null,
          location: {
            lat: Number(row.latitude),
            lng: Number(row.longitude),
            accuracy: Number(row.accuracy_meters),
            label:
              getStoredAddressLabel(row.metadata) ??
              mapGeofenceLabel((row.geofence_status as string | null | undefined) ?? "inside"),
          },
          isOvertime: Boolean(row.is_overtime),
          ipAddress: typeof row.ip_address === "string" ? row.ip_address : "Não informado",
          deviceLabel: typeof row.device_label === "string" ? row.device_label : "Dispositivo não informado",
        })),
      );
    };

    void syncTodayEntries();

    const channel = supabase
      .channel(`employee-dashboard-${userId}-${businessDate}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `user_id=eq.${userId}`,
          schema: "public",
          table: "time_entries",
        },
        () => {
          void syncTodayEntries();
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [businessDate, employeeName, userId]);

  const handleRegistered = (entry: TimeEntry) => {
    setTodayEntries((current) => {
      const deduped = current.filter((item) => item.id !== entry.id);
      return [...deduped, entry];
    });
  };

  return (
    <PunchPanel
      currentState={currentState}
      employeeName={employeeName}
      greeting={greeting}
      onRegistered={handleRegistered}
      primaryAction={primaryAction}
      quickSummary={quickSummary}
      timeZone={timeZone}
      todayEntries={todayEntries}
    />
  );
}
