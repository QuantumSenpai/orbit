"use client";

import React, { Component, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createEarthTextureCanvas } from "@/lib/earth-texture";
import { EarthStaticFallback } from "./EarthStaticFallback";

class WebGLErrorBoundary extends Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const EARTH_VERT = `
  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vPosWorld;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPosWorld = worldPos.xyz;
    vNormalWorld = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const EARTH_FRAG = `
  uniform sampler2D uMap;
  uniform vec3 uSunDir;
  varying vec2 vUv;
  varying vec3 vNormalWorld;
  varying vec3 vPosWorld;

  void main() {
    vec3 texColor = texture2D(uMap, vUv).rgb;
    vec3 N = normalize(vNormalWorld);
    vec3 L = normalize(uSunDir);
    vec3 V = normalize(cameraPosition - vPosWorld);

    float NdotL = dot(N, L);
    float dayMix = smoothstep(-0.18, 0.28, NdotL);

    // Subtle sunlit warmth vs calm slate night side
    vec3 dayColor = texColor * (0.62 + 0.52 * max(NdotL, 0.0));
    vec3 nightColor = texColor * vec3(0.18, 0.22, 0.28);
    vec3 base = mix(nightColor, dayColor, dayMix);

    // Terminator horizon warmth
    float twilight = exp(-pow(NdotL * 4.5, 2.0)) * 0.14;
    base += vec3(0.95, 0.36, 0.14) * twilight;

    // Restrained atmospheric Fresnel edge
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.4);
    vec3 atmoColor = mix(vec3(0.28, 0.39, 0.50), vec3(0.62, 0.74, 0.86), dayMix);
    base += atmoColor * fresnel * 0.42;

    gl_FragColor = vec4(base, 1.0);
  }
`;

function EarthSceneContent({
  reducedMotion,
  pointerRef,
  onReady,
}: {
  reducedMotion: boolean;
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  onReady?: () => void;
}) {
  const earthGroupRef = useRef<THREE.Group>(null);
  const globeRef = useRef<THREE.Mesh>(null);
  const satRef = useRef<THREE.Mesh>(null);
  const satHaloRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const canvas = createEarthTextureCanvas(1024, 512);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 2;
    tex.needsUpdate = true;
    return tex;
  }, []);

  const earthUniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uSunDir: { value: new THREE.Vector3(-0.78, 0.32, 0.54).normalize() },
    }),
    [texture]
  );

  useEffect(() => {
    onReady?.();
    return () => {
      texture.dispose();
    };
  }, [texture, onReady]);

  useFrame((state, delta) => {
    const clampedDelta = Math.min(delta, 0.05);

    if (globeRef.current && !reducedMotion) {
      globeRef.current.rotation.y += clampedDelta * 0.065;
    }

    // Subtle pointer tilt on desktop
    if (earthGroupRef.current && !reducedMotion) {
      const targetX = pointerRef.current.y * 0.14;
      const targetZ = -pointerRef.current.x * 0.12;
      earthGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        earthGroupRef.current.rotation.x,
        targetX,
        0.04
      );
      earthGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        earthGroupRef.current.rotation.z,
        targetZ,
        0.04
      );
    }

    // Orbiting #FA3600 satellite marker on primary ring
    if (satRef.current && satHaloRef.current) {
      const t = reducedMotion ? 0.6 : state.clock.elapsedTime * 0.38 + 0.6;
      const r = 1.44;
      const x = Math.cos(t) * r;
      const z = Math.sin(t) * r;
      satRef.current.position.set(x, 0, z);
      satHaloRef.current.position.set(x, 0, z);
      satHaloRef.current.lookAt(state.camera.position);
    }
  });

  return (
    <group ref={earthGroupRef}>
      {/* Earth sphere with custom day/night terminator & atmosphere rim */}
      <mesh ref={globeRef} rotation={[0.18, -2.05, 0]}>
        <sphereGeometry args={[1.05, 48, 48]} />
        <shaderMaterial
          vertexShader={EARTH_VERT}
          fragmentShader={EARTH_FRAG}
          uniforms={earthUniforms}
        />
      </mesh>

      {/* Subtle outer atmosphere limb ring */}
      <mesh scale={[1.032, 1.032, 1.032]}>
        <sphereGeometry args={[1.05, 32, 32]} />
        <meshBasicMaterial
          color="#92ADC7"
          transparent
          opacity={0.09}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Primary tilted orbital ring + orange satellite */}
      <group rotation={[0.42, 0.2, -0.34]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.44, 0.005, 8, 96]} />
          <meshBasicMaterial color="#7C7C78" transparent opacity={0.65} />
        </mesh>
        <mesh ref={satRef}>
          <boxGeometry args={[0.058, 0.058, 0.058]} />
          <meshBasicMaterial color="#FA3600" />
        </mesh>
        <mesh ref={satHaloRef}>
          <ringGeometry args={[0.068, 0.082, 20]} />
          <meshBasicMaterial
            color="#FA3600"
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Secondary orbital geometry ring */}
      <group rotation={[-0.36, -0.4, 0.28]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.32, 0.0038, 8, 96]} />
          <meshBasicMaterial color="#B3B3AF" transparent opacity={0.5} />
        </mesh>
      </group>
    </group>
  );
}

export default function EarthCanvas({
  reducedMotion,
  onReady,
}: {
  reducedMotion: boolean;
  onReady?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const testCanvas = document.createElement("canvas");
      const gl =
        testCanvas.getContext("webgl2") ||
        testCanvas.getContext("webgl") ||
        testCanvas.getContext("experimental-webgl");
      setWebglSupported(Boolean(gl));
    } catch {
      setWebglSupported(false);
    }
  }, []);

  useEffect(() => {
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    pointerRef.current = { x: nx, y: ny };
  };

  const handlePointerLeave = () => {
    pointerRef.current = { x: 0, y: 0 };
  };

  if (webglSupported === false) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <EarthStaticFallback label="Static Earth fallback (WebGL unavailable)" />
      </div>
    );
  }

  const activeLoop = inView && tabVisible && !reducedMotion ? "always" : "demand";

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full h-full"
    >
      {webglSupported === true && (
        <WebGLErrorBoundary
          fallback={
            <EarthStaticFallback label="Static Earth fallback after WebGL error" />
          }
        >
          <Canvas
            dpr={[1, 1.75]}
            frameloop={activeLoop}
            camera={{ position: [0, 0.25, 3.65], fov: 36 }}
            gl={{ antialias: true, alpha: true, powerPreference: "default" }}
            fallback={
              <EarthStaticFallback label="Static Earth fallback (WebGL unsupported)" />
            }
          >
            <EarthSceneContent
              reducedMotion={reducedMotion}
              pointerRef={pointerRef}
              onReady={onReady}
            />
          </Canvas>
        </WebGLErrorBoundary>
      )}
    </div>
  );
}
