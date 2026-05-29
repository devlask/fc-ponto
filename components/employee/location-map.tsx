"use client";

import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import type { GeoPoint } from "@/types";

type LocationMapProps = {
  location: GeoPoint;
};

export function LocationMap({ location }: LocationMapProps) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-white/80 shadow-[0_18px_40px_rgba(41,64,120,0.12)]">
      <div className="h-[280px] w-full">
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={17}
          scrollWheelZoom={false}
          className="h-full w-full"
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <CircleMarker
            center={[location.lat, location.lng]}
            radius={12}
            pathOptions={{
              color: "#0f6df2",
              fillColor: "#0f6df2",
              fillOpacity: 0.92,
              weight: 3,
            }}
          />
        </MapContainer>
      </div>
    </div>
  );
}
