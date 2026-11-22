import { feature } from "topojson-client";
import landAtlas from "world-atlas/land-110m.json";

export type GeoFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry>;

let cachedLandGeo: GeoFeatureCollection | null = null;

export function getLandGeoJSON(): GeoFeatureCollection {
  if (cachedLandGeo) return cachedLandGeo;
  const topology = landAtlas as unknown as Parameters<typeof feature>[0] & {
    objects: { land: Parameters<typeof feature>[1] };
  };
  const geo = feature(topology, topology.objects.land) as unknown as
    | GeoFeatureCollection
    | GeoJSON.Feature<GeoJSON.Geometry>;
  const normalized: GeoFeatureCollection =
    geo.type === "FeatureCollection"
      ? geo
      : { type: "FeatureCollection", features: [geo] };
  cachedLandGeo = normalized;
  return normalized;
}

function drawPolygonRing(
  ctx: CanvasRenderingContext2D,
  ring: number[][],
  width: number,
  height: number
) {
  if (ring.length === 0) return;
  for (let i = 0; i < ring.length; i++) {
    const [lon, lat] = ring[i];
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawGeometry(
  ctx: CanvasRenderingContext2D,
  geometry: GeoJSON.Geometry,
  width: number,
  height: number
) {
  if (geometry.type === "Polygon") {
    ctx.beginPath();
    geometry.coordinates.forEach((ring) =>
      drawPolygonRing(ctx, ring, width, height)
    );
    ctx.fill();
    ctx.stroke();
  } else if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach((poly) => {
      ctx.beginPath();
      poly.forEach((ring) => drawPolygonRing(ctx, ring, width, height));
      ctx.fill();
      ctx.stroke();
    });
  } else if (geometry.type === "GeometryCollection") {
    geometry.geometries.forEach((g) => drawGeometry(ctx, g, width, height));
  }
}

let cachedTextureCanvas: HTMLCanvasElement | null = null;

export function createEarthTextureCanvas(
  width = 1024,
  height = 512
): HTMLCanvasElement {
  if (
    cachedTextureCanvas &&
    cachedTextureCanvas.width === width &&
    cachedTextureCanvas.height === height
  ) {
    return cachedTextureCanvas;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Calm deep editorial ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, "#213140");
  oceanGrad.addColorStop(0.5, "#192735");
  oceanGrad.addColorStop(1, "#213140");
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle cartographic lat/lon graticule lines
  ctx.strokeStyle = "rgba(179, 179, 175, 0.14)";
  ctx.lineWidth = 1;
  for (let lon = -150; lon <= 180; lon += 30) {
    const x = ((lon + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Render Public Domain Natural Earth 110m continents
  const landGeo = getLandGeoJSON();
  ctx.fillStyle = "#D4D1C5";
  ctx.strokeStyle = "#48545F";
  ctx.lineWidth = 1.4;

  for (const feat of landGeo.features) {
    if (feat.geometry) {
      drawGeometry(ctx, feat.geometry, width, height);
    }
  }

  // Subtle coastal highlight pass
  ctx.strokeStyle = "rgba(245, 245, 237, 0.35)";
  ctx.lineWidth = 0.7;
  for (const feat of landGeo.features) {
    if (feat.geometry) {
      ctx.fillStyle = "transparent";
      drawGeometry(ctx, feat.geometry, width, height);
    }
  }

  cachedTextureCanvas = canvas;
  return canvas;
}
