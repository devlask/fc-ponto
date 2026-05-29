"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { LocateFixed, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GeoPoint } from "@/types";

const DynamicLocationMap = dynamic(
  () => import("@/components/employee/location-map").then((mod) => mod.LocationMap),
  {
    ssr: false,
    loading: () => <div className="h-[280px] w-full animate-pulse rounded-[28px] bg-muted" />,
  },
);

type GpsCaptureCardProps = {
  onResolved: (location: GeoPoint) => void;
  resetKey?: number;
};

export function GpsCaptureCard({ onResolved, resetKey = 0 }: GpsCaptureCardProps) {
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [loading, setLoading] = useState(false);

  const captureLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocalizacao nao suportada neste dispositivo.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          label: "Local capturado ao vivo",
        };
        setLocation(nextLocation);
        onResolved(nextLocation);
        setLoading(false);
        toast.success("GPS capturado com sucesso.");
      },
      () => {
        setLoading(false);
        toast.error("Nao foi possivel capturar o GPS.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 12_000,
      },
    );
  }, [onResolved]);

  useEffect(() => {
    captureLocation();
  }, [captureLocation, resetKey]);

  return (
    <Card className="ink-chip border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MapPin className="h-5 w-5 text-primary" />
          GPS obrigatorio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[28px] border border-border bg-white/55 p-4 text-sm text-muted-foreground dark:bg-white/6">
          {location ? (
            <div className="space-y-4">
              <DynamicLocationMap location={location} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-border bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Coordenadas</p>
                  <p className="mt-2 font-medium text-foreground">
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </p>
                </div>
                <div className="rounded-[22px] border border-border bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Precisão</p>
                  <p className="mt-2 inline-flex items-center gap-2 font-medium text-foreground">
                    <ShieldCheck className="h-4 w-4 text-success" />
                    {location.accuracy} m
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p>{loading ? "Capturando localizacao..." : "Nenhuma localizacao capturada."}</p>
          )}
        </div>
        <Button type="button" variant="secondary" className="w-full rounded-[20px]" onClick={captureLocation}>
          <LocateFixed className="h-4 w-4" />
          Atualizar GPS
        </Button>
      </CardContent>
    </Card>
  );
}
