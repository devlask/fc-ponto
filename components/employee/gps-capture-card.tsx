"use client";

import { useCallback, useEffect, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GeoPoint } from "@/types";

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
        <div className="rounded-2xl border border-border bg-white/55 p-4 text-sm text-muted-foreground dark:bg-white/6">
          {location ? (
            <div className="space-y-1">
              <p>
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </p>
              <p className="text-muted-foreground">Precisao estimada: {location.accuracy}m</p>
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
