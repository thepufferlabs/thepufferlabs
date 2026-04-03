"use client";

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

const _PUFFER_COUNT = 9;
const BUBBLE_COUNT = 50;

interface FloatingPuffer {
  sprite: THREE.Sprite;
  baseX: number;
  baseY: number;
  baseZ: number;
  speed: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  scale: number;
  phase: number;
  rotSpeed: number;
}

interface Bubble {
  mesh: THREE.Mesh;
  speed: number;
  wobble: number;
  wobbleSpeed: number;
  baseX: number;
  baseZ: number;
}

export default function PufferScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f172a, 0.045);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Load logo texture
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const textureLoader = new THREE.TextureLoader();
    const logoTexture = textureLoader.load(`${basePath}/logos/puffer-navy-sm.png`);
    logoTexture.colorSpace = THREE.SRGBColorSpace;

    // Puffer configurations: [scale, x, y, z]
    const configs: [number, number, number, number][] = [
      [1.8, 0, 0.3, 0], // center — largest
      [0.9, -3.8, 1.8, -1], // upper left
      [0.7, 3.5, -1.2, -2], // lower right back
      [1.1, -2.2, -1.5, 0.5], // lower left
      [0.5, 4.2, 2.2, -1.5], // upper right back — tiny
      [0.6, -5, -0.3, -3], // far left — small
      [1.0, 2.5, 1.0, 1], // right front
      [0.4, -1.5, 3, -2], // top — tiny
      [0.55, 3, -2.5, -1], // bottom right — small
    ];

    const puffers: FloatingPuffer[] = configs.map(([s, x, y, z]) => {
      const mat = new THREE.SpriteMaterial({
        map: logoTexture,
        transparent: true,
        opacity: 0.0, // fade in
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(s, s, 1);
      sprite.position.set(x, y, z);
      scene.add(sprite);

      return {
        sprite,
        baseX: x,
        baseY: y,
        baseZ: z,
        speed: 0.3 + Math.random() * 0.5,
        wobbleSpeed: 0.6 + Math.random() * 0.8,
        wobbleAmp: 0.2 + Math.random() * 0.4,
        scale: s,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.1,
      };
    });

    // Bubbles
    const bubbleGeo = new THREE.SphereGeometry(1, 8, 8);
    const bubbles: Bubble[] = [];

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const size = 0.03 + Math.random() * 0.07;
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#2DD4BF"),
        transparent: true,
        opacity: 0.08 + Math.random() * 0.15,
      });
      const mesh = new THREE.Mesh(bubbleGeo, mat);
      mesh.scale.setScalar(size);

      const x = (Math.random() - 0.5) * 18;
      const y = (Math.random() - 1) * 14;
      const z = (Math.random() - 0.5) * 8 - 2;
      mesh.position.set(x, y, z);
      scene.add(mesh);

      bubbles.push({
        mesh,
        speed: 0.2 + Math.random() * 0.6,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.5 + Math.random() * 1.5,
        baseX: x,
        baseZ: z,
      });
    }

    // Subtle light rays
    const rayGeo = new THREE.PlaneGeometry(0.2, 18);
    const rayMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#2DD4BF"),
      transparent: true,
      opacity: 0.012,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    for (let i = 0; i < 4; i++) {
      const ray = new THREE.Mesh(rayGeo, rayMat.clone());
      ray.position.set((Math.random() - 0.5) * 16, 2, -5 - Math.random() * 3);
      ray.rotation.z = (Math.random() - 0.5) * 0.25;
      scene.add(ray);
    }

    // Ambient glow behind center puffer
    const glowGeo = new THREE.SphereGeometry(2.5, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#2DD4BF"),
      transparent: true,
      opacity: 0.02,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(0, 0.3, -1);
    scene.add(glow);

    window.addEventListener("mousemove", handleMouseMove);

    // Animation
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const time = performance.now() * 0.001;

      if (!prefersReducedMotion) {
        for (const p of puffers) {
          const t = time * p.speed + p.phase;

          // Gentle swimming bob
          p.sprite.position.y = p.baseY + Math.sin(t * p.wobbleSpeed) * p.wobbleAmp;

          // Horizontal drift
          p.sprite.position.x = p.baseX + Math.sin(t * 0.35 + p.phase) * 0.3;

          // Subtle depth movement
          p.sprite.position.z = p.baseZ + Math.sin(t * 0.2 + p.phase * 2) * 0.2;

          // Gentle breathing scale
          const breath = 1 + Math.sin(t * 1.5) * 0.04;
          p.sprite.scale.set(p.scale * breath, p.scale * breath, 1);

          // Mouse parallax (depth-based)
          const depth = 1 - (p.baseZ + 4) / 8;
          p.sprite.position.x += mouseRef.current.x * 0.25 * depth;
          p.sprite.position.y += mouseRef.current.y * 0.15 * depth;

          // Fade in smoothly
          const mat = p.sprite.material;
          if (mat.opacity < 0.85) {
            mat.opacity += 0.005;
          }
        }

        // Bubbles
        for (const b of bubbles) {
          b.mesh.position.y += b.speed * 0.012;
          b.wobble += b.wobbleSpeed * 0.012;
          b.mesh.position.x = b.baseX + Math.sin(b.wobble) * 0.25;
          b.mesh.position.z = b.baseZ + Math.cos(b.wobble * 0.7) * 0.1;

          const pulse = 1 + Math.sin(b.wobble * 2) * 0.15;
          b.mesh.scale.setScalar((0.03 + Math.random() * 0.001) * pulse);

          if (b.mesh.position.y > 8) {
            b.mesh.position.y = -7 - Math.random() * 3;
            b.baseX = (Math.random() - 0.5) * 18;
          }
        }

        // Camera sway
        camera.position.x = Math.sin(time * 0.12) * 0.15;
        camera.position.y = Math.sin(time * 0.08) * 0.1;
        camera.lookAt(0, 0, 0);

        // Glow pulse
        glow.scale.setScalar(1 + Math.sin(time * 0.4) * 0.08);
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      logoTexture.dispose();
      bubbleGeo.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      rayGeo.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite) {
          if ("geometry" in obj) obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [handleMouseMove]);

  return <div ref={containerRef} className="absolute inset-0 -z-10" aria-hidden="true" />;
}
