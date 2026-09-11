"use client";

import { useEffect, useMemo, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { decodePolyline } from "@/lib/maps/polyline";

export function RouteMap({ polyline }: { polyline: string }) {
  const container = useRef<HTMLDivElement>(null);
  const points = useMemo(() => decodePolyline(polyline), [polyline]);

  useEffect(() => {
    if (!container.current || points.length < 2) return;
    let disposed = false;
    let map: import("leaflet").Map | undefined;

    void import("leaflet").then((leaflet) => {
      if (disposed || !container.current) return;
      map = leaflet.map(container.current, { zoomControl: true, attributionControl: true });
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      const route = leaflet.polyline(points, {
        color: "#2478ee",
        weight: 5,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
      map.fitBounds(route.getBounds(), { padding: [24, 24] });
    });

    return () => {
      disposed = true;
      map?.remove();
    };
  }, [points]);

  if (points.length < 2) return null;
  return <div ref={container} className="h-72 w-full overflow-hidden rounded-[22px] bg-surface-subtle sm:h-96" aria-label="Mapa del recorrido" />;
}

