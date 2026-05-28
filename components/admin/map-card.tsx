import { MapPinned } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GeoPoint } from "@/types";

type MapCardProps = {
  point: GeoPoint;
};

export function MapCard({ point }: MapCardProps) {
  const delta = 0.004;
  const bbox = `${point.lng - delta}%2C${point.lat - delta}%2C${point.lng + delta}%2C${point.lat + delta}`;
  const marker = `${point.lat}%2C${point.lng}`;

  return (
    <Card className="ink-chip border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MapPinned className="h-5 w-5 text-primary" />
          Localizacao em mapa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-[24px] border border-border">
          <iframe
            title="Mapa do registro"
            className="h-72 w-full"
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`}
          />
        </div>
        <div className="rounded-[24px] border border-border bg-white/58 p-4 text-sm text-muted-foreground dark:bg-white/6">
          <p>{point.label}</p>
          <p className="mt-1 text-muted-foreground">
            {point.lat.toFixed(5)}, {point.lng.toFixed(5)} • precisao {point.accuracy}m
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
