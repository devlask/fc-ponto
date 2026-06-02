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

function getStoredAddressLabel(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const addressLabel = (metadata as Record<string, unknown>).addressLabel;
  return typeof addressLabel === "string" && addressLabel.trim() ? addressLabel.trim() : null;
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
    businessDate: typeof record.business_date === "string" ? record.business_date : null,
    pairingGroup: typeof record.pairing_group === "string" ? record.pairing_group : null,
    location: {
      lat: Number(record.latitude),
      lng: Number(record.longitude),
      accuracy: Number(record.accuracy_meters),
      label:
        getStoredAddressLabel(record.metadata) ??
        mapGeofenceLabel((record.geofence_status as string | null | undefined) ?? "inside"),
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

    let active = true;

    void supabase
      .from("time_entries")
      .select(
        "id, event_type, recorded_at, business_date, pairing_group, latitude, longitude, accuracy_meters, geofence_status, ip_address, device_label, is_overtime, metadata",
      )
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(60)
      .then(({ data }) => {
        if (!active || !data) {
          return;
        }

        const fetchedEntries = [...data]
          .reverse()
          .map((row) => mapRealtimeEntry(row as Record<string, unknown>, employeeName, userId));

        setEntries((current) => {
          if (current.length >= fetchedEntries.length) {
            return current;
          }

          return fetchedEntries;
        });
      });

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
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [employeeName, userId]);

  return <DailyTimeline entries={entries} title={title} />;
}
