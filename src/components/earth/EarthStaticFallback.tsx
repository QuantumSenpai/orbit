"use client";

import React, { useMemo } from "react";
import { getLandGeoJSON } from "@/lib/earth-texture";

function projectOrthographic(
  lonDeg: number,
  latDeg: number,
  centerLon = 58,
  centerLat = 18,
  radius = 104,
  cx = 160,
  cy = 160
): { x: number; y: number; visible: boolean } {
  const toRad = Math.PI / 180;
  const lon = lonDeg * toRad;
  const lat = latDeg * toRad;
  const lon0 = centerLon * toRad;
  const lat0 = centerLat * toRad;

  const cosC =
    Math.sin(lat0) * Math.sin(lat) +
    Math.cos(lat0) * Math.cos(lat) * Math.cos(lon - lon0);

  const x = cx + radius * Math.cos(lat) * Math.sin(lon - lon0);
  const y =
    cy -
    radius *
      (Math.cos(lat0) * Math.sin(lat) -
        Math.sin(lat0) * Math.cos(lat) * Math.cos(lon - lon0));

  return { x, y, visible: cosC >= -0.05 };
}

function ringToSvgPath(ring: number[][]): string {
  let path = "";
  let penDown = false;
  for (let i = 0; i < ring.length; i++) {
    const [lon, lat] = ring[i];
    const p = projectOrthographic(lon, lat);
    if (p.visible) {
      path += `${penDown ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)} `;
      penDown = true;
    } else {
      penDown = false;
    }
  }
  return path;
}

export function EarthStaticFallback({
  label = "STATIC ORBITAL PROJECTION",
}: {
  label?: string;
}) {
  const landPath = useMemo(() => {
    const geo = getLandGeoJSON();
    const segments: string[] = [];
    const handleGeom = (geom: GeoJSON.Geometry) => {
      if (geom.type === "Polygon") {
        geom.coordinates.forEach((ring) => {
          const d = ringToSvgPath(ring);
          if (d) segments.push(d);
        });
      } else if (geom.type === "MultiPolygon") {
        geom.coordinates.forEach((poly) => {
          poly.forEach((ring) => {
            const d = ringToSvgPath(ring);
            if (d) segments.push(d);
          });
        });
      } else if (geom.type === "GeometryCollection") {
        geom.geometries.forEach(handleGeom);
      }
    };
    geo.features.forEach((f) => {
      if (f.geometry) handleGeom(f.geometry);
    });
    return segments.join(" ");
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      <svg
        viewBox="0 0 320 320"
        className="w-full h-full max-w-[340px] max-h-[340px]"
        role="img"
        aria-label="Stylized Earth and orbital path diagram"
      >
        <defs>
          <clipPath id="orbit-earth-clip">
            <circle cx="160" cy="160" r="104" />
          </clipPath>
          <linearGradient id="orbit-day-night" x1="0%" y1="15%" x2="100%" y2="85%">
            <stop offset="0%" stopColor="#283C4F" />
            <stop offset="56%" stopColor="#192634" />
            <stop offset="100%" stopColor="#0D141C" />
          </linearGradient>
          <linearGradient id="orbit-terminator" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="58%" stopColor="rgba(13,20,28,0.18)" />
            <stop offset="100%" stopColor="rgba(10,15,22,0.72)" />
          </linearGradient>
        </defs>

        {/* Outer technical crosshairs */}
        <line x1="16" y1="160" x2="36" y2="160" stroke="#B3B3AF" strokeWidth="1" />
        <line x1="284" y1="160" x2="304" y2="160" stroke="#B3B3AF" strokeWidth="1" />
        <line x1="160" y1="16" x2="160" y2="36" stroke="#B3B3AF" strokeWidth="1" />
        <line x1="160" y1="284" x2="160" y2="304" stroke="#B3B3AF" strokeWidth="1" />

        {/* Back orbital ring */}
        <ellipse
          cx="160"
          cy="160"
          rx="144"
          ry="44"
          transform="rotate(-24 160 160)"
          fill="none"
          stroke="#B3B3AF"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* Subtle atmosphere halo */}
        <circle
          cx="160"
          cy="160"
          r="107"
          fill="none"
          stroke="#8AA4BC"
          strokeOpacity="0.4"
          strokeWidth="3"
        />

        {/* Globe sphere */}
        <circle cx="160" cy="160" r="104" fill="url(#orbit-day-night)" />

        {/* Clipped continents & shading */}
        <g clipPath="url(#orbit-earth-clip)">
          <ellipse
            cx="160"
            cy="160"
            rx="104"
            ry="38"
            fill="none"
            stroke="rgba(179,179,175,0.18)"
            strokeWidth="0.8"
          />
          <ellipse
            cx="160"
            cy="160"
            rx="48"
            ry="104"
            fill="none"
            stroke="rgba(179,179,175,0.18)"
            strokeWidth="0.8"
          />
          <path
            d={landPath}
            fill="#D4D1C5"
            fillOpacity="0.88"
            stroke="#3C4852"
            strokeWidth="0.65"
          />
          <circle cx="160" cy="160" r="104" fill="url(#orbit-terminator)" />
        </g>

        <circle
          cx="160"
          cy="160"
          r="104"
          fill="none"
          stroke="#282828"
          strokeOpacity="0.28"
          strokeWidth="1"
        />

        {/* Secondary tilted ring */}
        <ellipse
          cx="160"
          cy="160"
          rx="132"
          ry="34"
          transform="rotate(14 160 160)"
          fill="none"
          stroke="#626260"
          strokeOpacity="0.55"
          strokeWidth="0.9"
        />

        {/* Orange satellite marker */}
        <g transform="translate(274, 114)">
          <rect x="-4" y="-4" width="8" height="8" fill="#FA3600" />
          <circle cx="0" cy="0" r="9" fill="none" stroke="#FA3600" strokeOpacity="0.45" strokeWidth="1" />
        </g>
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}
