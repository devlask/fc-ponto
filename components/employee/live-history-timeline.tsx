"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { DailyTimeline } from "@/components/employee/daily-timeline";
import type { TimeEntry } from "@/types";

type LiveHistoryTimelineProps = {
  employeeName: string;
  initialEntries: TimeEntry[];
  title?: string;
  userId: string;
};

function mapGeofenceLabel(status: string | null | undefined) {
  if (status === "outside") return "Fora do geofence";
  if (status === "unknown") return "Geofence indisponível";
  return "Dentro do geofence";
}

function mapRealtimeEntry(
  record: Record<string, unknown>,
  employeeName: string,
  userId: string,
): TimeEntry {
  return {
    id: String(record.id),
    employeeId: userId,
    employeeName,
    type: String(record.event_type) as TimeEntry["type"],
    timestamp: String(record.recorded_at),
    location: {
      lat: Number(record.latitude),
      lng: Number(record.longitude),
      accuracy: Number(record.accuracy_meters),
      label: mapGeofenceLabel((record.geofence_status as string | null | undefined) ?? "inside"),
    },
    isOvertime: Boolean(record.is_overtime),
    ipAddress: typeof record.ip_address === "string" ? record.ip_address : "Não informado",
    deviceLabel: typeof record.device_label === "string" ? record.device_label : "Dispositivo não informado",
  };
}

export function LiveHistoryTimeline({
  employeeName,
  initialEntries,
  title = "Últimos registros",
  userId,
}: LiveHistoryTimelineProps) {
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries);

  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(`employee-time-entries-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `user_id=eq.${userId}`,
          schema: "public",
          table: "time_entries",
        },
        (payload) => {
          const nextEntry = mapRealtimeEntry(payload.new as Record<string, unknown>, employeeName, userId);

          setEntries((current) => {
            const deduped = current.filter((item) => item.id !== nextEntry.id);
            return [...deduped, nextEntry]
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
              .slice(-20);
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [employeeName, userId]);

  return <DailyTimeline entries={entries} title={title} />;
}
