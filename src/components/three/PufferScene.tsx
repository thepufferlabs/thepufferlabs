"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const STRIP_SEGMENTS = 240;
const STRIP_WIDTH_SEGMENTS = 28;
const TRACE_POINT_COUNT = 220;
const STREAM_POINT_COUNT = 96;
const DUST_COUNT = 180;
const NODE_COUNT = 14;
const SPIKE_COUNT = 24;

interface ThemePalette {
  bg: THREE.Color;
  fog: THREE.Color;
  accent: THREE.Color;
  highlight: THREE.Color;
  text: THREE.Color;
  isLight: boolean;
}

interface StripTrace {
  line: THREE.LineLoop;
  positions: Float32Array;
  amplitude: number;
  frequency: number;
  speed: number;
  phase: number;
  radius: number;
  width: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
}

interface PacketStream {
  points: THREE.Points;
  positions: Float32Array;
  speed: number;
  phase: number;
  amplitude: number;
  bias: number;
  direction: 1 | -1;
  radius: number;
  width: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
}

interface OrbitNode {
  sprite: THREE.Sprite;
  radius: number;
  width: number;
  speed: number;
  phase: number;
  side: 1 | -1;
}

interface DustField {
  points: THREE.Points;
  positions: Float32Array;
  baseX: Float32Array;
  baseZ: Float32Array;
  speed: Float32Array;
  phase: Float32Array;
}

function readThemePalette(): ThemePalette {
  const styles = getComputedStyle(document.documentElement);
  const isLight = document.documentElement.getAttribute("data-theme") === "light";

  const bg = new THREE.Color(styles.getPropertyValue("--color-navy").trim() || "#09090b");
  const accent = new THREE.Color(styles.getPropertyValue("--color-teal").trim() || "#22c55e");
  const highlight = new THREE.Color(styles.getPropertyValue("--color-lime").trim() || "#86efac");
  const text = new THREE.Color(styles.getPropertyValue("--color-text-primary").trim() || "#fafafa");
  const fog = bg.clone().lerp(accent, isLight ? 0.025 : 0.08);

  return { bg, fog, accent, highlight, text, isLight };
}

function createDotTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");

  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  const gradient = context.createRadialGradient(64, 64, 4, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.26, "rgba(255,255,255,0.96)");
  gradient.addColorStop(0.56, "rgba(255,255,255,0.34)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");

  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  const gradient = context.createRadialGradient(128, 128, 20, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,255,255,0.72)");
  gradient.addColorStop(0.24, "rgba(255,255,255,0.28)");
  gradient.addColorStop(0.65, "rgba(255,255,255,0.07)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function mobiusPoint(u: number, v: number, radius: number) {
  const half = u * 0.5;
  const cosHalf = Math.cos(half);
  const sinHalf = Math.sin(half);
  const cosU = Math.cos(u);
  const sinU = Math.sin(u);
  const spread = radius + v * cosHalf;

  return new THREE.Vector3(spread * cosU, v * sinHalf * 1.18, spread * sinU * 0.72);
}

function buildMobiusGeometry(radius: number, width: number, segments: number, widthSegments: number) {
  const positions = new Float32Array(segments * (widthSegments + 1) * 3);
  const indices: number[] = [];
  const epsilon = 0.0001;

  for (let i = 0; i < segments; i += 1) {
    const u = (i / segments) * Math.PI * 2;

    for (let j = 0; j <= widthSegments; j += 1) {
      const v = (j / widthSegments - 0.5) * 2 * width;
      const point = mobiusPoint(u, v, radius);
      const index = (i * (widthSegments + 1) + j) * 3;

      positions[index] = point.x;
      positions[index + 1] = point.y;
      positions[index + 2] = point.z;

      const nextU = mobiusPoint(u + epsilon, v, radius);
      const nextV = mobiusPoint(u, v + epsilon, radius);
      const tangentU = nextU.sub(point);
      const tangentV = nextV.sub(point.clone());
      tangentU.cross(tangentV).normalize();
    }
  }

  for (let i = 0; i < segments; i += 1) {
    const nextI = (i + 1) % segments;

    for (let j = 0; j < widthSegments; j += 1) {
      const a = i * (widthSegments + 1) + j;
      const b = nextI * (widthSegments + 1) + j;
      const c = nextI * (widthSegments + 1) + j + 1;
      const d = i * (widthSegments + 1) + j + 1;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  return geometry;
}

function buildCenterlineGeometry(radius: number, pointCount: number) {
  const positions = new Float32Array(pointCount * 3);

  for (let i = 0; i < pointCount; i += 1) {
    const u = (i / pointCount) * Math.PI * 2;
    const point = mobiusPoint(u, 0, radius);
    const index = i * 3;

    positions[index] = point.x;
    positions[index + 1] = point.y;
    positions[index + 2] = point.z;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geometry;
}

function buildSpikeGeometry(count: number, innerRadius: number, outerRadius: number) {
  const positions = new Float32Array(count * 6);

  for (let i = 0; i < count; i += 1) {
    const t = i + 0.5;
    const phi = Math.acos(1 - (2 * t) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * t;
    const direction = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
    const inner = direction.clone().multiplyScalar(innerRadius);
    const outer = direction.clone().multiplyScalar(outerRadius);
    const index = i * 6;

    positions[index] = inner.x;
    positions[index + 1] = inner.y;
    positions[index + 2] = inner.z;
    positions[index + 3] = outer.x;
    positions[index + 4] = outer.y;
    positions[index + 5] = outer.z;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geometry;
}

export default function PufferScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x09090b, 0.03);

    const stage = new THREE.Group();
    stage.position.set(0, 0.1, 0);
    scene.add(stage);

    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 13.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const dotTexture = createDotTexture();
    const glowTexture = createGlowTexture();

    const engineGroup = new THREE.Group();
    engineGroup.position.set(1.2, 0.75, -4.3);
    stage.add(engineGroup);

    const stripRadius = 3.15;
    const stripWidth = 0.95;

    const surfaceMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const surface = new THREE.Mesh(buildMobiusGeometry(stripRadius, stripWidth, STRIP_SEGMENTS, STRIP_WIDTH_SEGMENTS), surfaceMaterial);
    engineGroup.add(surface);

    const ghostSurfaceMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const ghostSurface = new THREE.Mesh(buildMobiusGeometry(stripRadius * 1.06, stripWidth * 0.9, STRIP_SEGMENTS, STRIP_WIDTH_SEGMENTS), ghostSurfaceMaterial);
    ghostSurface.rotation.x = 0.45;
    ghostSurface.rotation.y = -0.35;
    ghostSurface.scale.setScalar(1.03);
    engineGroup.add(ghostSurface);

    const edgeMaterial = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const edgeLines = new THREE.LineSegments(new THREE.EdgesGeometry(surface.geometry, 18), edgeMaterial);
    engineGroup.add(edgeLines);

    const ghostEdgeMaterial = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const ghostEdges = new THREE.LineSegments(new THREE.EdgesGeometry(ghostSurface.geometry, 18), ghostEdgeMaterial);
    engineGroup.add(ghostEdges);

    const centerlineMaterial = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const centerline = new THREE.LineLoop(buildCenterlineGeometry(stripRadius, TRACE_POINT_COUNT), centerlineMaterial);
    engineGroup.add(centerline);

    const traceConfigs = [
      { amplitude: 0.18, frequency: 4, speed: 0.62, phase: 0.2, radius: stripRadius, width: stripWidth * 0.72, offsetX: 0, offsetY: 0, offsetZ: 0 },
      { amplitude: 0.24, frequency: 6, speed: -0.55, phase: 1.6, radius: stripRadius, width: stripWidth * 0.55, offsetX: 0, offsetY: 0, offsetZ: 0 },
      { amplitude: 0.14, frequency: 8, speed: 0.78, phase: 3.1, radius: stripRadius * 1.02, width: stripWidth * 0.48, offsetX: 0, offsetY: 0.04, offsetZ: 0 },
    ] as const;

    const traces: StripTrace[] = traceConfigs.map((config) => {
      const positions = new Float32Array(TRACE_POINT_COUNT * 3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const material = new THREE.LineBasicMaterial({
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const line = new THREE.LineLoop(geometry, material);
      engineGroup.add(line);

      return { line, positions, ...config };
    });

    const streamConfigs = [
      { speed: 0.95, phase: 0.4, amplitude: 0.22, bias: -0.12, direction: 1 as const, radius: stripRadius, width: stripWidth * 0.74, offsetX: 0, offsetY: 0, offsetZ: 0.02 },
      { speed: 0.82, phase: 2.1, amplitude: 0.3, bias: 0.16, direction: -1 as const, radius: stripRadius, width: stripWidth * 0.66, offsetX: 0, offsetY: 0, offsetZ: -0.02 },
    ] as const;

    const streams: PacketStream[] = streamConfigs.map((config) => {
      const positions = new Float32Array(STREAM_POINT_COUNT * 3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        map: dotTexture,
        size: 0.18,
        transparent: true,
        opacity: 0.44,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geometry, material);
      engineGroup.add(points);

      return { points, positions, ...config };
    });

    const haloMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Sprite(haloMaterial);
    halo.scale.set(10, 10, 1);
    halo.position.set(0, 0, -0.3);
    engineGroup.add(halo);

    const controlCore = new THREE.Group();
    controlCore.scale.setScalar(0.42);
    engineGroup.add(controlCore);

    const coreMeshMaterial = new THREE.MeshBasicMaterial({
      wireframe: true,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    });
    const coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 1), coreMeshMaterial);
    controlCore.add(coreMesh);

    const spikeMaterial = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const spikes = new THREE.LineSegments(buildSpikeGeometry(SPIKE_COUNT, 2.4, 3.9), spikeMaterial);
    controlCore.add(spikes);

    const orbitRingMaterial = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const orbitRingA = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.TorusGeometry(4.1, 0.06, 10, 128), 10), orbitRingMaterial);
    orbitRingA.rotation.x = Math.PI / 2.7;
    orbitRingA.rotation.y = 0.45;
    controlCore.add(orbitRingA);

    const orbitRingMaterialB = orbitRingMaterial.clone();
    const orbitRingB = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.TorusGeometry(3.4, 0.04, 10, 128), 10), orbitRingMaterialB);
    orbitRingB.rotation.x = Math.PI / 1.9;
    orbitRingB.rotation.z = 0.9;
    controlCore.add(orbitRingB);

    const nodes: OrbitNode[] = [];
    for (let i = 0; i < NODE_COUNT; i += 1) {
      const material = new THREE.SpriteMaterial({
        map: dotTexture,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(material);
      const size = 0.12 + (i % 3) * 0.025;
      sprite.scale.set(size, size, 1);
      engineGroup.add(sprite);

      nodes.push({
        sprite,
        radius: stripRadius,
        width: stripWidth * 0.92,
        speed: 0.32 + (i % 5) * 0.05,
        phase: (i / NODE_COUNT) * Math.PI * 2,
        side: i % 2 === 0 ? 1 : -1,
      });
    }

    const dustPositions = new Float32Array(DUST_COUNT * 3);
    const dustBaseX = new Float32Array(DUST_COUNT);
    const dustBaseZ = new Float32Array(DUST_COUNT);
    const dustSpeed = new Float32Array(DUST_COUNT);
    const dustPhase = new Float32Array(DUST_COUNT);

    for (let i = 0; i < DUST_COUNT; i += 1) {
      const index = i * 3;
      dustPositions[index] = (Math.random() - 0.5) * 20;
      dustPositions[index + 1] = (Math.random() - 0.5) * 12.5;
      dustPositions[index + 2] = -10 + Math.random() * 8.4;
      dustBaseX[i] = dustPositions[index];
      dustBaseZ[i] = dustPositions[index + 2];
      dustSpeed[i] = 0.0018 + Math.random() * 0.004;
      dustPhase[i] = Math.random() * Math.PI * 2;
    }

    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));

    const dustMaterial = new THREE.PointsMaterial({
      map: dotTexture,
      size: 0.1,
      transparent: true,
      opacity: 0.16,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const dustField: DustField = {
      points: new THREE.Points(dustGeometry, dustMaterial),
      positions: dustPositions,
      baseX: dustBaseX,
      baseZ: dustBaseZ,
      speed: dustSpeed,
      phase: dustPhase,
    };
    stage.add(dustField.points);

    const backgroundGlowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const backgroundGlow = new THREE.Sprite(backgroundGlowMaterial);
    backgroundGlow.scale.set(14, 10, 1);
    backgroundGlow.position.set(2.8, -0.8, -9.4);
    stage.add(backgroundGlow);

    const applyPalette = () => {
      const palette = readThemePalette();
      (scene.fog as THREE.FogExp2).color.copy(palette.fog);
      (scene.fog as THREE.FogExp2).density = palette.isLight ? 0.018 : 0.03;
      renderer.setClearColor(palette.bg, 0);

      surfaceMaterial.color.copy(palette.accent.clone().lerp(palette.highlight, 0.4));
      surfaceMaterial.opacity = palette.isLight ? 0.08 : 0.14;

      ghostSurfaceMaterial.color.copy(palette.highlight.clone().lerp(palette.accent, 0.45));
      ghostSurfaceMaterial.opacity = palette.isLight ? 0.03 : 0.06;

      edgeMaterial.color.copy(palette.accent.clone().lerp(palette.text, 0.08));
      edgeMaterial.opacity = palette.isLight ? 0.1 : 0.2;

      ghostEdgeMaterial.color.copy(palette.highlight.clone().lerp(palette.accent, 0.3));
      ghostEdgeMaterial.opacity = palette.isLight ? 0.045 : 0.09;

      centerlineMaterial.color.copy(palette.highlight.clone().lerp(palette.text, 0.12));
      centerlineMaterial.opacity = palette.isLight ? 0.08 : 0.16;

      traces.forEach((trace, index) => {
        const material = trace.line.material as THREE.LineBasicMaterial;
        material.color.copy(index === 1 ? palette.highlight : palette.accent.clone().lerp(palette.highlight, 0.25 + index * 0.15));
        material.opacity = palette.isLight ? 0.12 : 0.26 - index * 0.03;
      });

      streams.forEach((stream, index) => {
        const material = stream.points.material as THREE.PointsMaterial;
        material.color.copy(index === 0 ? palette.text.clone().lerp(palette.accent, 0.2) : palette.highlight.clone().lerp(palette.accent, 0.5));
        material.opacity = palette.isLight ? 0.26 : 0.46;
      });

      haloMaterial.color.copy(palette.accent.clone().lerp(palette.highlight, 0.45));
      haloMaterial.opacity = palette.isLight ? 0.06 : 0.12;

      coreMeshMaterial.color.copy(palette.highlight.clone().lerp(palette.accent, 0.5));
      coreMeshMaterial.opacity = palette.isLight ? 0.08 : 0.15;

      spikeMaterial.color.copy(palette.accent.clone().lerp(palette.highlight, 0.55));
      spikeMaterial.opacity = palette.isLight ? 0.08 : 0.18;

      orbitRingMaterial.color.copy(palette.accent.clone().lerp(palette.text, 0.15));
      orbitRingMaterial.opacity = palette.isLight ? 0.08 : 0.15;

      orbitRingMaterialB.color.copy(palette.highlight.clone().lerp(palette.text, 0.12));
      orbitRingMaterialB.opacity = palette.isLight ? 0.06 : 0.12;

      nodes.forEach((node, index) => {
        const material = node.sprite.material as THREE.SpriteMaterial;
        material.color.copy(index % 3 === 0 ? palette.highlight : palette.accent.clone().lerp(palette.text, 0.08));
        material.opacity = palette.isLight ? 0.28 : 0.52;
      });

      dustMaterial.color.copy(palette.accent.clone().lerp(palette.text, 0.16));
      dustMaterial.opacity = palette.isLight ? 0.08 : 0.16;

      backgroundGlowMaterial.color.copy(palette.accent.clone().lerp(palette.highlight, 0.25));
      backgroundGlowMaterial.opacity = palette.isLight ? 0.04 : 0.08;
    };

    const updateTraces = (time: number) => {
      traces.forEach((trace) => {
        for (let i = 0; i < TRACE_POINT_COUNT; i += 1) {
          const progress = i / TRACE_POINT_COUNT;
          const u = progress * Math.PI * 2 + time * trace.speed + trace.phase;
          const v = Math.sin(progress * Math.PI * 2 * trace.frequency - time * trace.speed * 1.25 + trace.phase) * trace.width * trace.amplitude;
          const point = mobiusPoint(u, v, trace.radius);
          const index = i * 3;

          trace.positions[index] = point.x + trace.offsetX;
          trace.positions[index + 1] = point.y + trace.offsetY;
          trace.positions[index + 2] = point.z + trace.offsetZ;
        }

        trace.line.geometry.attributes.position.needsUpdate = true;
      });
    };

    const updateStreams = (time: number) => {
      streams.forEach((stream) => {
        for (let i = 0; i < STREAM_POINT_COUNT; i += 1) {
          const progress = i / STREAM_POINT_COUNT;
          const u = time * stream.speed * stream.direction + progress * Math.PI * 2 * 1.45 + stream.phase;
          const wave = Math.sin(u * 2.8 + progress * 5 + stream.phase) * stream.width * stream.amplitude;
          const point = mobiusPoint(u, stream.bias * stream.width + wave, stream.radius);
          const index = i * 3;

          stream.positions[index] = point.x + stream.offsetX;
          stream.positions[index + 1] = point.y + stream.offsetY;
          stream.positions[index + 2] = point.z + stream.offsetZ;
        }

        stream.points.geometry.attributes.position.needsUpdate = true;
      });
    };

    const updateNodes = (time: number) => {
      nodes.forEach((node) => {
        const u = time * node.speed + node.phase;
        const point = mobiusPoint(u, node.width * node.side, node.radius);
        node.sprite.position.copy(point);
      });
    };

    const updateDust = (time: number) => {
      for (let i = 0; i < DUST_COUNT; i += 1) {
        const index = i * 3;
        dustField.positions[index + 1] += dustField.speed[i];
        dustField.positions[index] = dustField.baseX[i] + Math.sin(time * 0.45 + dustField.phase[i]) * (0.14 + (i % 7) * 0.014);
        dustField.positions[index + 2] = dustField.baseZ[i] + Math.cos(time * 0.2 + dustField.phase[i]) * 0.16;

        if (dustField.positions[index + 1] > 7.2) {
          dustField.positions[index] = (Math.random() - 0.5) * 20;
          dustField.positions[index + 1] = -7.4 - Math.random() * 2.4;
          dustField.positions[index + 2] = -10 + Math.random() * 8.4;
          dustField.baseX[i] = dustField.positions[index];
          dustField.baseZ[i] = dustField.positions[index + 2];
          dustField.phase[i] = Math.random() * Math.PI * 2;
        }
      }

      dustField.points.geometry.attributes.position.needsUpdate = true;
    };

    const renderScene = (time: number) => {
      updateTraces(time);
      updateStreams(time);
      updateNodes(time);
      updateDust(time);

      const pulse = 1 + Math.sin(time * 0.95) * 0.04;
      engineGroup.scale.setScalar(pulse);
      engineGroup.rotation.x = 0.72 + Math.sin(time * 0.18) * 0.05;
      engineGroup.rotation.y = -0.45 + time * 0.12;
      engineGroup.rotation.z = Math.sin(time * 0.24) * 0.08;

      ghostSurface.rotation.x = 0.45 - time * 0.07;
      ghostSurface.rotation.y = -0.35 + time * 0.09;
      halo.scale.setScalar(10 + Math.sin(time * 0.52) * 0.55);

      controlCore.rotation.y = time * 0.22;
      controlCore.rotation.z = Math.sin(time * 0.28) * 0.16;
      coreMesh.scale.setScalar(1 + Math.sin(time * 1.05) * 0.08);
      spikes.scale.setScalar(1 + Math.sin(time * 1.05 + 0.8) * 0.1);
      orbitRingA.rotation.z = time * 0.18;
      orbitRingB.rotation.x = Math.PI / 1.9 + time * 0.12;
      orbitRingB.rotation.y = time * 0.08;

      stage.rotation.x = THREE.MathUtils.lerp(stage.rotation.x, mouseRef.current.y * 0.05, 0.04);
      stage.rotation.y = THREE.MathUtils.lerp(stage.rotation.y, mouseRef.current.x * 0.08, 0.04);

      const targetX = Math.sin(time * 0.12) * 0.22 + mouseRef.current.x * 0.32;
      const targetY = Math.cos(time * 0.16) * 0.1 + mouseRef.current.y * 0.16;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.04);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.04);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    const handlePointerMove = (event: PointerEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);

      if (prefersReducedMotion) {
        renderer.render(scene, camera);
      }
    };

    applyPalette();
    renderScene(0);

    const observer = new MutationObserver(() => {
      applyPalette();
      renderer.render(scene, camera);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    if (!prefersReducedMotion) {
      window.addEventListener("pointermove", handlePointerMove);

      const animate = () => {
        frameRef.current = requestAnimationFrame(animate);
        renderScene(performance.now() * 0.001);
      };

      animate();
    }

    window.addEventListener("resize", handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameRef.current);

      const geometries = new Set<THREE.BufferGeometry>();
      const materialSet = new Set<THREE.Material>();

      scene.traverse((object) => {
        const resourceHolder = object as THREE.Object3D & {
          geometry?: THREE.BufferGeometry;
          material?: THREE.Material | THREE.Material[];
        };

        if (resourceHolder.geometry) {
          geometries.add(resourceHolder.geometry);
        }

        if (resourceHolder.material) {
          if (Array.isArray(resourceHolder.material)) {
            resourceHolder.material.forEach((material) => materialSet.add(material));
          } else {
            materialSet.add(resourceHolder.material);
          }
        }
      });

      geometries.forEach((geometry) => geometry.dispose());
      materialSet.forEach((material) => material.dispose());
      dotTexture.dispose();
      glowTexture.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 -z-10" aria-hidden="true" />;
}
