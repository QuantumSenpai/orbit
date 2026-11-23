"use client";

import React, { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { EarthStaticFallback } from "./EarthStaticFallback";

const EarthCanvas = dynamic(() => import("./EarthCanvas"), {
  ssr: false,
  loading: () => (
    <EarthStaticFallback label="Loading interactive 3D Earth projection" />
  ),
});

export function EarthCenterpiece({
  reducedMotion,
  forceStatic = false,
}: {
  reducedMotion: boolean;
  forceStatic?: boolean;
}) {
  const [sceneReady, setSceneReady] = useState(false);
  const handleReady = useCallback(() => setSceneReady(true), []);

  return (
    <div className="relative w-full h-full min-h-[260px] flex items-center justify-center overflow-hidden">
      {/* Static fallback renders immediately while WebGL chunk hydrates or when static is requested */}
      {(forceStatic || !sceneReady) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <EarthStaticFallback />
        </div>
      )}

      {!forceStatic && (
        <div
          className={`relative w-full h-full transition-opacity duration-500 ${
            sceneReady ? "opacity-100" : "opacity-0"
          }`}
        >
          <EarthCanvas
            reducedMotion={reducedMotion}
            onReady={handleReady}
          />
        </div>
      )}
    </div>
  );
}
